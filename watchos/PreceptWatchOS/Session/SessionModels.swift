import Foundation

/// Phone-free offline session models.
/// Mirrors the Wear OS `SessionModels.kt` and the JSON shape consumed by the
/// PWA over BLE (docs/wearable-protocol.md §12).
struct SessionSummary: Codable {
    let id: String
    let startedAtMs: Int64
    let endedAtMs: Int64
    let sampleCount: Int
    let avgAccelMagnitude: Double // m/s² (RMS, includes gravity)
    let peakGyroMagnitude: Float // deg/s
    var repCount: Int = 0 // on-watch rep detector (§12); 0 = not counted

    var durationMs: Int64 { endedAtMs - startedAtMs }
}

struct StoredSession: Codable {
    let v: Int
    let id: String
    let startedAtMs: Int64
    let endedAtMs: Int64
    let sampleCount: Int
    let avgAccelMagnitude: Double
    let peakGyroMagnitude: Float
    let repCount: Int
    let packetVersion: Int
    let packetSize: Int
    let samplesBase64: String

    init(summary: SessionSummary, packetVersion: Int, packetSize: Int, samplesBase64: String) {
        self.v = 1
        self.id = summary.id
        self.startedAtMs = summary.startedAtMs
        self.endedAtMs = summary.endedAtMs
        self.sampleCount = summary.sampleCount
        self.avgAccelMagnitude = summary.avgAccelMagnitude
        self.peakGyroMagnitude = summary.peakGyroMagnitude
        self.repCount = summary.repCount
        self.packetVersion = packetVersion
        self.packetSize = packetSize
        self.samplesBase64 = samplesBase64
    }

    var summary: SessionSummary {
        SessionSummary(
            id: id,
            startedAtMs: startedAtMs,
            endedAtMs: endedAtMs,
            sampleCount: sampleCount,
            avgAccelMagnitude: avgAccelMagnitude,
            peakGyroMagnitude: peakGyroMagnitude,
            repCount: repCount
        )
    }

    var sampleRate: Double {
        durationMs > 0 ? Double(sampleCount) * 1000.0 / Double(durationMs) : 0
    }
}
