package com.precpet.wearos.ble

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.BatteryManager
import android.os.ParcelUuid
import android.util.Log
import com.precpet.wearos.protocol.PreceptMotionProtocol
import com.precpet.wearos.stream.PreceptMotionStreamer

/**
 * BLE GATT server that advertises the Precept Motion Service and fans IMU
 * notifications out to connected phones/PWAs.
 */
class PreceptBleServer(private val context: Context) {
    companion object {
        private const val TAG = "PreceptBleServer"
    }

    private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private var gattServer: BluetoothGattServer? = null
    private var advertiser: BluetoothLeAdvertiser? = null

    private var imuCharacteristic: BluetoothGattCharacteristic? = null
    private var timeSyncCharacteristic: BluetoothGattCharacteristic? = null

    private val connectedDevices = mutableSetOf<BluetoothDevice>()

    private val batteryLevel: Int
        get() {
            val bm = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
            return bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: 100
        }

    fun start() {
        val adapter = bluetoothManager.adapter ?: run {
            Log.w(TAG, "No Bluetooth adapter")
            return
        }

        gattServer = bluetoothManager.openGattServer(context, callback)?.apply {
            val service = BluetoothGattService(
                PreceptMotionProtocol.SERVICE_UUID_OBJ,
                BluetoothGattService.SERVICE_TYPE_PRIMARY,
            )
            imuCharacteristic = BluetoothGattCharacteristic(
                PreceptMotionProtocol.IMU_CHARACTERISTIC_UUID_OBJ,
                BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                0,
            )
            val commandCharacteristic = BluetoothGattCharacteristic(
                PreceptMotionProtocol.COMMAND_CHARACTERISTIC_UUID_OBJ,
                BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
                BluetoothGattCharacteristic.PERMISSION_WRITE,
            )
            val batteryCharacteristic = BluetoothGattCharacteristic(
                PreceptMotionProtocol.BATTERY_CHARACTERISTIC_UUID_OBJ,
                BluetoothGattCharacteristic.PROPERTY_READ or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_READ,
            )
            timeSyncCharacteristic = BluetoothGattCharacteristic(
                PreceptMotionProtocol.TIME_SYNC_CHARACTERISTIC_UUID_OBJ,
                BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_WRITE,
            )
            service.addCharacteristic(imuCharacteristic)
            service.addCharacteristic(commandCharacteristic)
            service.addCharacteristic(batteryCharacteristic)
            service.addCharacteristic(timeSyncCharacteristic)
            addService(service)
        }

        PreceptMotionStreamer.bleServer = this
        startAdvertising(adapter)
    }

    private fun startAdvertising(adapter: BluetoothAdapter) {
        val leAdvertiser = adapter.bluetoothLeAdvertiser ?: return
        advertiser = leAdvertiser
        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setConnectable(true)
            .setTimeout(0)
            .build()
        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(ParcelUuid(PreceptMotionProtocol.SERVICE_UUID_OBJ))
            .build()
        leAdvertiser.startAdvertising(settings, data, advertiseCallback)
    }

    /** Send a protocol packet to every connected central. */
    fun sendSample(packet: ByteArray) {
        val characteristic = imuCharacteristic ?: return
        characteristic.value = packet
        val devices = synchronized(connectedDevices) { connectedDevices.toList() }
        devices.forEach { device ->
            gattServer?.notifyCharacteristicChanged(device, characteristic, false)
        }
    }

    fun stop() {
        try {
            advertiser?.stopAdvertising(advertiseCallback)
        } catch (_: Exception) {
        }
        try {
            gattServer?.close()
        } catch (_: Exception) {
        }
        gattServer = null
        advertiser = null
        connectedDevices.clear()
        PreceptMotionStreamer.bleServer = null
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
            Log.i(TAG, "Advertising Precept Motion Service")
        }

        override fun onStartFailure(errorCode: Int) {
            Log.e(TAG, "Advertising failed: $errorCode")
        }
    }

    private val callback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            when (newState) {
                android.bluetooth.Profile.STATE_CONNECTED -> {
                    synchronized(connectedDevices) { connectedDevices.add(device) }
                    Log.i(TAG, "Connected: ${device.address}")
                }
                android.bluetooth.Profile.STATE_DISCONNECTED -> {
                    synchronized(connectedDevices) { connectedDevices.remove(device) }
                    PreceptMotionStreamer.stop()
                    Log.i(TAG, "Disconnected: ${device.address}")
                }
            }
        }

        override fun onCharacteristicReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            characteristic: BluetoothGattCharacteristic,
        ) {
            when (characteristic.uuid) {
                PreceptMotionProtocol.BATTERY_CHARACTERISTIC_UUID_OBJ -> {
                    val response = byteArrayOf(batteryLevel.toByte())
                    gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, response)
                }
                else -> gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_FAILURE, 0, null)
            }
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            value: ByteArray?,
            offset: Int,
        ) {
            when (characteristic.uuid) {
                PreceptMotionProtocol.COMMAND_CHARACTERISTIC_UUID_OBJ -> handleCommand(value)
                PreceptMotionProtocol.TIME_SYNC_CHARACTERISTIC_UUID_OBJ -> handleTimeSync(device, requestId, value)
            }
            if (responseNeeded) {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
            }
        }

        override fun onNotificationSent(device: BluetoothDevice, status: Int) {
            // Notifications are fire-and-forget; nothing to do here.
        }
    }

    private fun handleCommand(value: ByteArray?) {
        val command = value?.firstOrNull()?.toInt()?.and(0xff) ?: return
        when (command) {
            PreceptMotionProtocol.COMMAND_START -> PreceptMotionStreamer.start(context.applicationContext)
            PreceptMotionProtocol.COMMAND_STOP -> PreceptMotionStreamer.stop()
            PreceptMotionProtocol.COMMAND_SET_RATE -> Log.i(TAG, "Set-rate command received (rate switching not yet implemented)")
        }
    }

    private fun handleTimeSync(device: BluetoothDevice, requestId: Int, value: ByteArray?) {
        // Ignore the client's clock for now; always ack with our unix ms.
        val ack = ByteArray(10)
        ack[0] = 0x11
        var now = System.currentTimeMillis()
        for (i in 1..8) {
            ack[i] = (now and 0xff).toByte()
            now = now shr 8
        }
        ack[9] = 0x00
        timeSyncCharacteristic?.let { characteristic ->
            characteristic.value = ack
            gattServer?.notifyCharacteristicChanged(device, characteristic, false)
        }
        gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
    }
}
