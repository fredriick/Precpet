package com.precpet.wearos.session

import java.util.Base64
import java.util.UUID

/**
 * Accumulates IMU packets into an on-device session while the watch is worn
 * with no phone nearby. Pure JVM (no Android dependencies) so it is unit
 * testable.
 *
 * Feed it via [PreceptMotionStreamer.addPacketListener] (see the streamer), one
 * 16-byte Precept Motion Service packet per call, then call [finalize] to close
 * the session and get the persisted payload.
 */
object SessionRecorder {
    const val PACKET_VERSION = 0x01

    /** Nominal sensor period used for the rep detector's time base (ms). */
    private const val SAMPLE_INTERVAL_MS = 20L

    @Volatile
    var active: Boolean = false
        private set

    var sampleCount: Int = 0
        private set

    /** Live rep count from the on-watch detector (0 until movement is seen). */
    val repCount: Int get() = repCounter.repCount

    private var startedAtMs = 0L
    private var packets = mutableListOf<ByteArray>()
    private var accelSquaresSum = 0.0 // Σ|a|² (m/s²)²
    private var peakGyroSquare = 0f // max |ω|² (deg/s)²
    private val repCounter = RepCounter()

    fun start() {
        if (active) return
        active = true
        startedAtMs = System.currentTimeMillis()
        packets = mutableListOf()
        accelSquaresSum = 0.0
        peakGyroSquare = 0f
        sampleCount = 0
        repCounter.reset()
    }

    /** Record one encoded IMU packet. No-op unless a session is active. */
    fun record(packet: ByteArray) {
        if (!active) return
        packets.add(packet)
        sampleCount++

        val ax = readInt16LE(packet, 3) / 100f
        val ay = readInt16LE(packet, 5) / 100f
        val az = readInt16LE(packet, 7) / 100f
        accelSquaresSum += ax * ax + ay * ay + az * az
        val accelMagnitude = Math.sqrt((ax * ax + ay * ay + az * az).toDouble()).toFloat()
        repCounter.record(accelMagnitude, sampleCount * SAMPLE_INTERVAL_MS)

        val gx = readInt16LE(packet, 9) / 10f
        val gy = readInt16LE(packet, 11) / 10f
        val gz = readInt16LE(packet, 13) / 10f
        val gyroSquare = gx * gx + gy * gy + gz * gz
        if (gyroSquare > peakGyroSquare) peakGyroSquare = gyroSquare
    }

    /**
     * Close the active session and return it for storage. Returns null when no
     * session was active or no samples were captured. State is reset either way.
     */
    fun finalize(): StoredSession? {
        if (!active) return null
        active = false
        val captured = packets
        packets = mutableListOf()
        val capturedCount = sampleCount
        if (capturedCount == 0) {
            sampleCount = 0
            return null
        }

        val avgAccel = Math.sqrt(accelSquaresSum / capturedCount)
        val peakGyro = Math.sqrt(peakGyroSquare.toDouble()).toFloat()
        val blob = captured
            .flatMap { it.toList() }
            .toByteArray()

        sampleCount = 0
        return StoredSession(
            summary = SessionSummary(
                id = UUID.randomUUID().toString(),
                startedAtMs = startedAtMs,
                endedAtMs = System.currentTimeMillis(),
                sampleCount = capturedCount,
                avgAccelMagnitude = avgAccel,
                peakGyroMagnitude = peakGyro,
                repCount = repCounter.repCount,
            ),
            packetVersion = PACKET_VERSION,
            packetSize = captured.first().size,
            samplesBase64 = Base64.getEncoder().encodeToString(blob),
        )
    }

    private fun readInt16LE(bytes: ByteArray, offset: Int): Int =
        (bytes[offset].toInt() and 0xff) or ((bytes[offset + 1].toInt() and 0xff) shl 8)
}
