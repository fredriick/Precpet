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
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import android.util.Log
import com.precpet.wearos.protocol.PreceptMotionProtocol
import com.precpet.wearos.session.SessionChunker
import com.precpet.wearos.session.SessionStore
import com.precpet.wearos.stream.PreceptMotionStreamer

/**
 * BLE GATT server that advertises the Precept Motion Service and fans IMU
 * notifications out to connected phones/PWAs. Also serves on-device offline
 * sessions (docs/wearable-protocol.md §12) over the Session Data channel.
 */
class PreceptBleServer(
    private val context: Context,
    private val sessionStore: SessionStore,
) {
    companion object {
        private const val TAG = "PreceptBleServer"
        private const val DEFAULT_ATT_MTU = 23
        // One notification per tick keeps the BLE stack happy even at 20-byte
        // MTUs; higher negotiated MTUs move the same message in fewer chunks.
        private const val CHUNK_INTERVAL_MS = 12L
        private const val OK_JSON = """{"ok":true}"""
        private const val ERROR_JSON = """{"ok":false}"""
    }

    private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val handler = Handler(Looper.getMainLooper())
    private var gattServer: BluetoothGattServer? = null
    private var advertiser: BluetoothLeAdvertiser? = null

    private var imuCharacteristic: BluetoothGattCharacteristic? = null
    private var timeSyncCharacteristic: BluetoothGattCharacteristic? = null
    private var sessionDataCharacteristic: BluetoothGattCharacteristic? = null

    @Volatile
    private var negotiatedMtu = DEFAULT_ATT_MTU

    private val connectedDevices = mutableSetOf<BluetoothDevice>()

    private var sessionBusy = false
    private var sessionTick: Runnable? = null

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
            sessionDataCharacteristic = BluetoothGattCharacteristic(
                PreceptMotionProtocol.SESSION_DATA_CHARACTERISTIC_UUID_OBJ,
                BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                0,
            )
            service.addCharacteristic(imuCharacteristic)
            service.addCharacteristic(commandCharacteristic)
            service.addCharacteristic(batteryCharacteristic)
            service.addCharacteristic(timeSyncCharacteristic)
            service.addCharacteristic(sessionDataCharacteristic)
            addService(service)
        }

        PreceptMotionStreamer.bleServer = this
        startAdvertising(adapter)
    }

    private fun startAdvertising(adapter: BluetoothAdapter) {
        val leAdvertiser = adapter.bluetoothLeAdvertiser ?: run {
            Log.w(TAG, "No BLE advertiser on this device — expected on the Android emulator, which has no Bluetooth radio")
            return
        }
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
        cancelSessionTransfer()
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

    private fun cancelSessionTransfer() {
        sessionBusy = false
        sessionTick?.let(handler::removeCallbacks)
        sessionTick = null
    }

    private fun maxSessionFragment(): Int = (negotiatedMtu - 4).coerceAtLeast(1)

    /**
     * Paced, one-chunk-per-tick delivery of a Session Data message so the
     * notification queue never overflows at any MTU.
     */
    private fun startSessionTransfer(device: BluetoothDevice, message: ByteArray) {
        if (sessionBusy) {
            Log.w(TAG, "Session transfer already in progress; ignoring request")
            return
        }
        val characteristic = sessionDataCharacteristic ?: run {
            Log.w(TAG, "Session data characteristic unavailable")
            return
        }
        val chunks = SessionChunker.chunk(message, maxSessionFragment())
        sessionBusy = true
        var index = 0
        val tick = object : Runnable {
            override fun run() {
                if (index >= chunks.size) {
                    sessionBusy = false
                    sessionTick = null
                    return
                }
                characteristic.value = chunks[index]
                gattServer?.notifyCharacteristicChanged(device, characteristic, false)
                index++
                if (index < chunks.size) {
                    handler.postDelayed(this, CHUNK_INTERVAL_MS)
                } else {
                    sessionBusy = false
                    sessionTick = null
                }
            }
        }
        sessionTick = tick
        handler.post(tick)
    }

    private fun sendSessionError(device: BluetoothDevice, message: String) {
        val characteristic = sessionDataCharacteristic ?: return
        characteristic.value = SessionChunker.errorChunk(message.toByteArray(Charsets.UTF_8), maxSessionFragment())
        gattServer?.notifyCharacteristicChanged(device, characteristic, false)
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
            Log.i(TAG, "Advertising Precept Motion Service")
        }

        override fun onStartFailure(errorCode: Int) {
            Log.e(TAG, "Advertising failed: $errorCode (BLE unavailable — expected on the Android emulator)")
        }
    }

    private val callback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            when (newState) {
                android.bluetooth.BluetoothProfile.STATE_CONNECTED -> {
                    synchronized(connectedDevices) { connectedDevices.add(device) }
                    Log.i(TAG, "Connected: ${device.address}")
                }
                android.bluetooth.BluetoothProfile.STATE_DISCONNECTED -> {
                    synchronized(connectedDevices) { connectedDevices.remove(device) }
                    cancelSessionTransfer()
                    PreceptMotionStreamer.stop()
                    Log.i(TAG, "Disconnected: ${device.address}")
                }
            }
        }

        override fun onMtuChanged(device: BluetoothDevice, mtu: Int) {
            negotiatedMtu = mtu.coerceAtLeast(DEFAULT_ATT_MTU)
            Log.i(TAG, "MTU negotiated: $mtu")
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
            offset: Int,
            value: ByteArray?,
        ) {
            when (characteristic.uuid) {
                PreceptMotionProtocol.COMMAND_CHARACTERISTIC_UUID_OBJ -> handleCommand(device, value)
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

    private fun handleCommand(device: BluetoothDevice, value: ByteArray?) {
        val command = value?.firstOrNull()?.toInt()?.and(0xff) ?: return
        when (command) {
            PreceptMotionProtocol.COMMAND_START -> PreceptMotionStreamer.start(context.applicationContext)
            PreceptMotionProtocol.COMMAND_STOP -> PreceptMotionStreamer.stop()
            PreceptMotionProtocol.COMMAND_SET_RATE -> Log.i(TAG, "Set-rate command received (rate switching not yet implemented)")
            PreceptMotionProtocol.COMMAND_LIST_SESSIONS -> startSessionTransfer(device, sessionStore.listJson().toByteArray(Charsets.UTF_8))
            PreceptMotionProtocol.COMMAND_REQUEST_SESSION -> handleRequestSession(device, value)
            PreceptMotionProtocol.COMMAND_DELETE_SESSION -> handleDeleteSession(device, value)
            PreceptMotionProtocol.COMMAND_DELETE_ALL -> {
                sessionStore.clear()
                startSessionTransfer(device, OK_JSON.toByteArray(Charsets.UTF_8))
            }
        }
    }

    private fun handleRequestSession(device: BluetoothDevice, value: ByteArray?) {
        val index = value?.getOrNull(1)?.toInt()?.and(0xff) ?: return
        val session = sessionStore.list().getOrNull(index)?.let { sessionStore.load(it.id) }
        if (session == null) {
            sendSessionError(device, "session not found")
            return
        }
        startSessionTransfer(device, sessionStore.toJson(session).toByteArray(Charsets.UTF_8))
    }

    private fun handleDeleteSession(device: BluetoothDevice, value: ByteArray?) {
        val index = value?.getOrNull(1)?.toInt()?.and(0xff) ?: return
        val id = sessionStore.list().getOrNull(index)?.id
        val deleted = id != null && sessionStore.delete(id)
        startSessionTransfer(device, (if (deleted) OK_JSON else ERROR_JSON).toByteArray(Charsets.UTF_8))
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
