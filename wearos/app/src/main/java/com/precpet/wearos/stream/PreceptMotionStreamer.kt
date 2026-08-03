package com.precpet.wearos.stream

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import com.precpet.wearos.ble.PreceptBleServer
import com.precpet.wearos.protocol.PreceptMotionProtocol

/**
 * Owns the accelerometer/gyroscope stream and fans each sample out to the
 * currently connected BLE central(s) as Precept Motion Service packets.
 */
object PreceptMotionStreamer : SensorEventListener {
    private const val TAG = "PreceptMotion"
    private const val LOG_EVERY = 50 // ~1 log line/sec at 50 Hz

    private var sensorManager: SensorManager? = null
    private var accelerometer: Sensor? = null
    private var gyroscope: Sensor? = null

    @Volatile
    var bleServer: PreceptBleServer? = null

    /** Packets encoded since the stream started (surfaced in the watch UI). */
    @Volatile
    var packetsEncoded: Int = 0

    private var running = false
    private var counter = 0
    private val latestAccel = FloatArray(3)

    fun start(context: Context) {
        if (running) return
        running = true
        counter = 0
        packetsEncoded = 0
        latestAccel.fill(0f)

        sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        gyroscope = sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

        // SENSOR_DELAY_GAME ≈ 20 ms → ~50 Hz
        sensorManager?.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME)
        sensorManager?.registerListener(this, gyroscope, SensorManager.SENSOR_DELAY_GAME)
    }

    fun stop() {
        running = false
        sensorManager?.unregisterListener(this)
        sensorManager = null
        accelerometer = null
        gyroscope = null
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (!running) return
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                latestAccel[0] = event.values[0]
                latestAccel[1] = event.values[1]
                latestAccel[2] = event.values[2]
            }
            Sensor.TYPE_GYROSCOPE -> {
                // Pair on the gyro callback; the accel may lag one sample, which is fine.
                val packet = PreceptMotionProtocol.encodeImuPacket(
                    counter = counter++,
                    accelX = latestAccel[0],
                    accelY = latestAccel[1],
                    accelZ = latestAccel[2],
                    gyroX = Math.toDegrees(event.values[0].toDouble()).toFloat(),
                    gyroY = Math.toDegrees(event.values[1].toDouble()).toFloat(),
                    gyroZ = Math.toDegrees(event.values[2].toDouble()).toFloat(),
                )
                packetsEncoded++
                // Throttled log: one line per second at 50 Hz so the packet stream
                // is observable on an emulator (which has synthetic sensors but no
                // BLE to deliver them over).
                if (packetsEncoded % LOG_EVERY == 0) {
                    Log.d(TAG, "packet #${packetsEncoded} (${packet.joinToString("") { "%02x".format(it) }})")
                }
                bleServer?.sendSample(packet)
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
}
