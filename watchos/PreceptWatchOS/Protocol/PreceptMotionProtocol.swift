import Foundation
import CoreBluetooth

/// Precept Motion Service — BLE GATT protocol.
/// Spec: docs/wearable-protocol.md (source of truth for UUIDs + packet format).
/// Mirrors the Wear OS reference `PreceptMotionProtocol.kt` and the TS
/// encoder/decoder in `lib/wearable-protocol.ts`.
enum PreceptMotionProtocol {
    static let SERVICE_UUID = "d5f2a1a0-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
    static let IMU_CHARACTERISTIC_UUID = "d5f2a1a1-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
    static let COMMAND_CHARACTERISTIC_UUID = "d5f2a1a2-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
    static let BATTERY_CHARACTERISTIC_UUID = "d5f2a1a3-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
    static let TIME_SYNC_CHARACTERISTIC_UUID = "d5f2a1a4-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
    static let SESSION_DATA_CHARACTERISTIC_UUID = "d5f2a1a5-3f1e-4b6e-9c2e-7f3a8b4c5d6e"

    static let PACKET_VERSION: UInt8 = 0x01
    static let PACKET_SIZE = 16
    static let ACCEL_SCALE = 100.0 // m/s² × 100 stored as int16
    static let GYRO_SCALE = 10.0   // deg/s × 10 stored as int16

    static let COMMAND_START: UInt8 = 0x01
    static let COMMAND_STOP: UInt8 = 0x02
    static let COMMAND_SET_RATE: UInt8 = 0x03

    // Offline session sync (§12). Session Data notifications are chunked:
    // byte 0 = flags (0x80 first, 0x40 last, 0x20 error), rest = JSON fragment.
    static let COMMAND_LIST_SESSIONS: UInt8 = 0x10
    static let COMMAND_REQUEST_SESSION: UInt8 = 0x11
    static let COMMAND_DELETE_SESSION: UInt8 = 0x12
    static let COMMAND_DELETE_ALL: UInt8 = 0x13

    static let CHUNK_FLAG_FIRST: UInt8 = 0x80
    static let CHUNK_FLAG_LAST: UInt8 = 0x40
    static let CHUNK_FLAG_ERROR: UInt8 = 0x20

    static let serviceCBUUID = CBUUID(string: SERVICE_UUID)
    static let imuCBUUID = CBUUID(string: IMU_CHARACTERISTIC_UUID)
    static let commandCBUUID = CBUUID(string: COMMAND_CHARACTERISTIC_UUID)
    static let batteryCBUUID = CBUUID(string: BATTERY_CHARACTERISTIC_UUID)
    static let timeSyncCBUUID = CBUUID(string: TIME_SYNC_CHARACTERISTIC_UUID)
    static let sessionDataCBUUID = CBUUID(string: SESSION_DATA_CHARACTERISTIC_UUID)

    /// Encode one IMU sample into the 16-byte little-endian packet:
    /// [ver u8][counter u16][accel x3 i16 (m/s² × 100)][gyro x3 i16 (deg/s × 10)][reserved u8].
    /// Rounding matches Math.round (floor(x + 0.5)) and values are clamped to
    /// the int16 range so the emitted bytes match the TS/Kotlin encoders.
    static func encodeImuPacket(
        counter: Int,
        accelX: Double,
        accelY: Double,
        accelZ: Double,
        gyroX: Double,
        gyroY: Double,
        gyroZ: Double
    ) -> Data {
        var packet = Data(count: PACKET_SIZE)
        packet[0] = PACKET_VERSION
        writeUInt16LE(&packet, offset: 1, value: UInt16(counter & 0xffff))
        writeInt16LE(&packet, offset: 3, value: clampedInt16(accelX * ACCEL_SCALE))
        writeInt16LE(&packet, offset: 5, value: clampedInt16(accelY * ACCEL_SCALE))
        writeInt16LE(&packet, offset: 7, value: clampedInt16(accelZ * ACCEL_SCALE))
        writeInt16LE(&packet, offset: 9, value: clampedInt16(gyroX * GYRO_SCALE))
        writeInt16LE(&packet, offset: 11, value: clampedInt16(gyroY * GYRO_SCALE))
        writeInt16LE(&packet, offset: 13, value: clampedInt16(gyroZ * GYRO_SCALE))
        packet[15] = 0x00
        return packet
    }

    /// Decode one 16-byte IMU packet; returns nil for wrong length/version.
    static func decodeImuPacket(_ data: Data) -> (counter: Int, accel: SIMD3<Double>, gyro: SIMD3<Double>)? {
        guard data.count >= PACKET_SIZE, data[0] == PACKET_VERSION else { return nil }
        return (
            counter: Int(readUInt16LE(data, offset: 1)),
            accel: SIMD3(
                Double(readInt16LE(data, offset: 3)) / ACCEL_SCALE,
                Double(readInt16LE(data, offset: 5)) / ACCEL_SCALE,
                Double(readInt16LE(data, offset: 7)) / ACCEL_SCALE
            ),
            gyro: SIMD3(
                Double(readInt16LE(data, offset: 9)) / GYRO_SCALE,
                Double(readInt16LE(data, offset: 11)) / GYRO_SCALE,
                Double(readInt16LE(data, offset: 13)) / GYRO_SCALE
            )
        )
    }

    /// Build a Command characteristic packet (command + optional payload byte).
    static func buildCommandPacket(_ command: UInt8, payload: UInt8? = nil) -> Data {
        if let payload { return Data([command, payload]) }
        return Data([command])
    }

    /// Build a Time Sync ack packet: [0x11][u64 LE unix ms][0x00].
    static func buildTimeSyncAckPacket(unixMs: UInt64) -> Data {
        var packet = Data(count: 10)
        packet[0] = 0x11
        var value = unixMs
        for i in 1...8 {
            packet[i] = UInt8(value & 0xff)
            value >>= 8
        }
        packet[9] = 0x00
        return packet
    }

    // MARK: - Little-endian helpers

    private static func writeUInt16LE(_ data: inout Data, offset: Int, value: UInt16) {
        data[offset] = UInt8(value & 0xff)
        data[offset + 1] = UInt8((value >> 8) & 0xff)
    }

    private static func writeInt16LE(_ data: inout Data, offset: Int, value: Int16) {
        let u = UInt16(bitPattern: value)
        writeUInt16LE(&data, offset: offset, value: u)
    }

    private static func readUInt16LE(_ data: Data, offset: Int) -> UInt16 {
        UInt16(data[offset]) | (UInt16(data[offset + 1]) << 8)
    }

    private static func readInt16LE(_ data: Data, offset: Int) -> Int16 {
        Int16(bitPattern: readUInt16LE(data, offset: offset))
    }

    /// Math.round semantics (floor(x + 0.5)) clamped to the int16 range.
    private static func clampedInt16(_ value: Double) -> Int16 {
        let rounded = (value + 0.5).rounded(.down)
        if rounded <= Double(Int16.min) { return .min }
        if rounded >= Double(Int16.max) { return .max }
        return Int16(rounded)
    }
}
