package com.precpet.wearos.protocol

import java.util.UUID

/**
 * Precept Motion Service — BLE GATT protocol.
 * Spec: docs/wearable-protocol.md (source of truth for UUIDs + packet format).
 */
object PreceptMotionProtocol {
    const val SERVICE_UUID = "d5f2a1a0-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
    const val IMU_CHARACTERISTIC_UUID = "d5f2a1a1-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
    const val COMMAND_CHARACTERISTIC_UUID = "d5f2a1a2-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
    const val BATTERY_CHARACTERISTIC_UUID = "d5f2a1a3-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
    const val TIME_SYNC_CHARACTERISTIC_UUID = "d5f2a1a4-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
    const val SESSION_DATA_CHARACTERISTIC_UUID = "d5f2a1a5-3f1e-4b6e-9c2e-7f3a8b4c5d6e"

    const val PACKET_VERSION = 0x01
    const val PACKET_SIZE = 16

    const val COMMAND_START = 0x01
    const val COMMAND_STOP = 0x02
    const val COMMAND_SET_RATE = 0x03

    // Offline session sync (§12). Session Data notifications are chunked:
    // byte 0 = flags (0x80 first, 0x40 last, 0x20 error), rest = JSON fragment.
    const val COMMAND_LIST_SESSIONS = 0x10
    const val COMMAND_REQUEST_SESSION = 0x11
    const val COMMAND_DELETE_SESSION = 0x12
    const val COMMAND_DELETE_ALL = 0x13

    const val CHUNK_FLAG_FIRST = 0x80
    const val CHUNK_FLAG_LAST = 0x40
    const val CHUNK_FLAG_ERROR = 0x20

    val SERVICE_UUID_OBJ: UUID by lazy { UUID.fromString(SERVICE_UUID) }
    val IMU_CHARACTERISTIC_UUID_OBJ: UUID by lazy { UUID.fromString(IMU_CHARACTERISTIC_UUID) }
    val COMMAND_CHARACTERISTIC_UUID_OBJ: UUID by lazy { UUID.fromString(COMMAND_CHARACTERISTIC_UUID) }
    val BATTERY_CHARACTERISTIC_UUID_OBJ: UUID by lazy { UUID.fromString(BATTERY_CHARACTERISTIC_UUID) }
    val TIME_SYNC_CHARACTERISTIC_UUID_OBJ: UUID by lazy { UUID.fromString(TIME_SYNC_CHARACTERISTIC_UUID) }
    val SESSION_DATA_CHARACTERISTIC_UUID_OBJ: UUID by lazy { UUID.fromString(SESSION_DATA_CHARACTERISTIC_UUID) }

    /**
     * Encode an IMU sample into the 16-byte little-endian packet:
     * [ver u8][counter u16][accel x3 i16 (m/s² × 100)][gyro x3 i16 (deg/s × 10)][reserved u8].
     */
    fun encodeImuPacket(
        counter: Int,
        accelX: Float,
        accelY: Float,
        accelZ: Float,
        gyroX: Float,
        gyroY: Float,
        gyroZ: Float,
    ): ByteArray {
        val packet = ByteArray(PACKET_SIZE)
        packet[0] = PACKET_VERSION.toByte()
        writeInt16LE(packet, 1, counter) // counter is uint16; writeInt16LE keeps the low 16 bits
        // Round like the TS reference encoder (Math.round, ties toward +inf) so
        // both implementations emit identical bytes (see PreceptMotionProtocolTest).
        writeInt16LE(packet, 3, Math.round(accelX * 100))
        writeInt16LE(packet, 5, Math.round(accelY * 100))
        writeInt16LE(packet, 7, Math.round(accelZ * 100))
        writeInt16LE(packet, 9, Math.round(gyroX * 10))
        writeInt16LE(packet, 11, Math.round(gyroY * 10))
        writeInt16LE(packet, 13, Math.round(gyroZ * 10))
        packet[15] = 0x00
        return packet
    }

    private fun writeInt16LE(packet: ByteArray, offset: Int, value: Int) {
        packet[offset] = (value and 0xff).toByte()
        packet[offset + 1] = ((value shr 8) and 0xff).toByte()
    }
}
