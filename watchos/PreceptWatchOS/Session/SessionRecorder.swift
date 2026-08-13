import Foundation

/// Accumulates IMU packets into an on-device session while the watch is worn
/// with no phone nearby. Mirrors the Wear OS `SessionRecorder.kt`.
///
/// Feed it via the motion streamer's packet listener, one 16-byte Precept
/// Motion Service packet per call, then call `finalize` to close the session
/// and get the persisted payload. Packets are decoded with signed int16 reads
/// so magnitude math (which only uses squares) matches the TS decoder.
final class SessionRecorder {
    static let packetVersion = 1
    /// Nominal sensor period used for the rep detector's time base (ms).
    static let sampleIntervalMs: Int64 = 20

    private(set) var active = false
    private(set) var sampleCount = 0

    /// Live rep count from the on-watch detector (0 until movement is seen).
    var repCount: Int { repCounter.repCount }

    private var startedAtMs: Int64 = 0
    private var packets: [Data] = []
    private var accelSquaresSum = 0.0 // Σ|a|² (m/s²)²
    private var peakGyroSquare: Float = 0 // max |ω|² (deg/s)²
    private let repCounter = RepCounter()

    func start() {
        guard !active else { return }
        active = true
        startedAtMs = currentMs()
        packets = []
        accelSquaresSum = 0
        peakGyroSquare = 0
        sampleCount = 0
        repCounter.reset()
    }

    /// Record one encoded IMU packet. No-op unless a session is active.
    func record(_ packet: Data) {
        guard active else { return }
        packets.append(packet)
        sampleCount += 1

        let ax = Double(readInt16LE(packet, offset: 3)) / 100
        let ay = Double(readInt16LE(packet, offset: 5)) / 100
        let az = Double(readInt16LE(packet, offset: 7)) / 100
        accelSquaresSum += ax * ax + ay * ay + az * az
        let accelMagnitude = Float(sqrt(ax * ax + ay * ay + az * az))
        repCounter.record(magnitudeMs2: accelMagnitude, nowMs: Int64(sampleCount) * SessionRecorder.sampleIntervalMs)

        let gx = Float(readInt16LE(packet, offset: 9)) / 10
        let gy = Float(readInt16LE(packet, offset: 11)) / 10
        let gz = Float(readInt16LE(packet, offset: 13)) / 10
        let gyroSquare = gx * gx + gy * gy + gz * gz
        if gyroSquare > peakGyroSquare {
            peakGyroSquare = gyroSquare
        }
    }

    /// Close the active session and return it for storage. Returns nil when no
    /// session was active or no samples were captured. State is reset either way.
    func finalize() -> StoredSession? {
        guard active else { return nil }
        active = false
        let captured = packets
        packets = []
        let capturedCount = sampleCount
        if capturedCount == 0 {
            sampleCount = 0
            return nil
        }

        let avgAccel = sqrt(accelSquaresSum / Double(capturedCount))
        let peakGyro = sqrt(peakGyroSquare)
        let blob = captured.reduce(Data()) { $0 + $1 }

        sampleCount = 0
        return StoredSession(
            summary: SessionSummary(
                id: UUID().uuidString,
                startedAtMs: startedAtMs,
                endedAtMs: currentMs(),
                sampleCount: capturedCount,
                avgAccelMagnitude: avgAccel,
                peakGyroMagnitude: peakGyro,
                repCount: repCounter.repCount
            ),
            packetVersion: SessionRecorder.packetVersion,
            packetSize: captured.first?.count ?? 0,
            samplesBase64: blob.base64EncodedString()
        )
    }

    private func readInt16LE(_ data: Data, offset: Int) -> Int16 {
        Int16(bitPattern: UInt16(data[offset]) | (UInt16(data[offset + 1]) << 8))
    }

    private func currentMs() -> Int64 {
        Int64(Date().timeIntervalSince1970 * 1000)
    }
}
