package com.precpet.wearos.protocol

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Byte-parity tests against the TypeScript reference encoder
 * (`lib/wearable-protocol.ts` / `tests/lib/wearable-protocol.test.ts`).
 *
 * Both implementations must emit identical 16-byte little-endian packets for the
 * same sample, because the watch encodes and the PWA decodes.
 */
class PreceptMotionProtocolTest {

    @Test
    fun `encodes the reference TS sample byte-for-byte`() {
        val packet = PreceptMotionProtocol.encodeImuPacket(
            counter = 0xbeef,
            accelX = 0.42f,
            accelY = -1.13f,
            accelZ = 9.81f,
            gyroX = -0.4f, // TS beta
            gyroY = 2.75f, // TS gamma (2.75 * 10 rounds to 28, not 27)
            gyroZ = 1.5f, // TS alpha
        )
        assertArrayEquals(
            byteArrayOf(
                0x01, 0xef.toByte(), 0xbe.toByte(), // version + counter LE
                0x2a.toByte(), 0x00, // accelX 42
                0x8f.toByte(), 0xff.toByte(), // accelY -113
                0xd5.toByte(), 0x03, // accelZ 981
                0xfc.toByte(), 0xff.toByte(), // gyroX -4
                0x1c.toByte(), 0x00, // gyroY 28
                0x0f.toByte(), 0x00, // gyroZ 15
                0x00, // reserved
            ),
            packet,
        )
    }

    @Test
    fun `encodes a zero sample as an all-zero payload`() {
        val packet = PreceptMotionProtocol.encodeImuPacket(0, 0f, 0f, 0f, 0f, 0f, 0f)
        assertArrayEquals(
            byteArrayOf(0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
            packet,
        )
    }

    @Test
    fun `wraps the counter at 16 bits`() {
        val packet = PreceptMotionProtocol.encodeImuPacket(0x1_0000, 0f, 0f, 0f, 0f, 0f, 0f)
        assertEquals(0x00.toByte(), packet[1])
        assertEquals(0x00.toByte(), packet[2])
        val wrapped = PreceptMotionProtocol.encodeImuPacket(0xffff, 0f, 0f, 0f, 0f, 0f, 0f)
        assertEquals(0xff.toByte(), wrapped[1])
        assertEquals(0xff.toByte(), wrapped[2])
    }

    @Test
    fun `always emits exactly 16 bytes`() {
        val packet = PreceptMotionProtocol.encodeImuPacket(7, 1f, 2f, 3f, 4f, 5f, 6f)
        assertEquals(PreceptMotionProtocol.PACKET_SIZE, packet.size)
        assertEquals(0x01, packet[0].toInt())
    }
}
