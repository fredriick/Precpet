package com.precpet.wearos.session

/**
 * Phone-free offline session models.
 *
 * A recorded session stores the exact Precept Motion Service packets (the same
 * 16-byte frames the BLE streamer emits, see `docs/wearable-protocol.md` §4) as
 * a base64 blob, so the PWA can decode every sample with the same
 * `decodeImuPacket` used for live streaming and feed it through the shared
 * `analyzeMotion` pipeline.
 */
data class SessionSummary(
    val id: String,
    val startedAtMs: Long,
    val endedAtMs: Long,
    val sampleCount: Int,
    val avgAccelMagnitude: Double, // m/s² (RMS, includes gravity)
    val peakGyroMagnitude: Float, // deg/s
    val repCount: Int = 0, // on-watch rep detector (§12); 0 = not counted
) {
    val durationMs: Long get() = endedAtMs - startedAtMs
}

data class StoredSession(
    val summary: SessionSummary,
    val packetVersion: Int,
    val packetSize: Int,
    val samplesBase64: String,
) {
    val sampleRate: Double
        get() = if (summary.durationMs > 0) {
            summary.sampleCount * 1000.0 / summary.durationMs
        } else {
            0.0
        }
}
