import Foundation
import CoreMotion

/// Owns the accelerometer/gyroscope stream and fans each sample out as a
/// Precept Motion Service packet. Mirrors the Wear OS `PreceptMotionStreamer.kt`.
///
/// CoreMotion's `deviceMotion` delivers time-aligned gravity + user
/// acceleration (in g) and rotation rate (in rad/s). The protocol wants
/// acceleration including gravity in m/s² and rotation rate in deg/s, so this
/// service converts before encoding (§3 of docs/wearable-protocol.md).
final class MotionSensorService {
    private let motionManager = CMMotionManager()

    private(set) var isRunning = false
    private(set) var packetsEncoded = 0

    /// Additional sinks for every encoded packet (e.g. the BLE server and the
    /// offline SessionRecorder). Invoked on the motion callback queue.
    var packetListeners: [(Data) -> Void] = []

    /// Packets encoded since the stream started.
    var counter = 0

    func start(sampleRateHz: Double = 50) {
        guard !isRunning, motionManager.isDeviceMotionAvailable else { return }
        isRunning = true
        counter = 0
        packetsEncoded = 0

        motionManager.deviceMotionUpdateInterval = 1.0 / sampleRateHz
        motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in
            guard let self, self.isRunning, let motion else { return }
            self.handle(motion)
        }
    }

    func stop() {
        isRunning = false
        motionManager.stopDeviceMotionUpdates()
    }

    private func handle(_ motion: CMDeviceMotion) {
        // gravity + userAcceleration both in g; sum then convert to m/s².
        let ax = (motion.gravity.x + motion.userAcceleration.x) * 9.81
        let ay = (motion.gravity.y + motion.userAcceleration.y) * 9.81
        let az = (motion.gravity.z + motion.userAcceleration.z) * 9.81

        // rotationRate in rad/s → deg/s.
        let gx = motion.rotationRate.x * 180.0 / .pi
        let gy = motion.rotationRate.y * 180.0 / .pi
        let gz = motion.rotationRate.z * 180.0 / .pi

        let packet = PreceptMotionProtocol.encodeImuPacket(
            counter: counter,
            accelX: ax,
            accelY: ay,
            accelZ: az,
            gyroX: gx,
            gyroY: gy,
            gyroZ: gz
        )
        counter += 1
        packetsEncoded += 1
        packetListeners.forEach { $0(packet) }
    }
}
