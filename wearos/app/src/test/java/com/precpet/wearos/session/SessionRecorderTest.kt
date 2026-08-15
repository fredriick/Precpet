package com.precpet.wearos.session

import com.precpet.wearos.protocol.PreceptMotionProtocol
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Base64

class SessionRecorderTest {

    private fun packet(counter: Int, accel: Float, gyro: Float): ByteArray =
        PreceptMotionProtocol.encodeImuPacket(counter, accel, accel, accel, gyro, gyro, gyro)

    @Test
    fun `starts inactive`() {
        assertTrue(!SessionRecorder.active)
        assertNull(SessionRecorder.finalize())
    }

    @Test
    fun `recording before start is ignored`() {
        SessionRecorder.record(packet(0, 1f, 1f))
        assertNull(SessionRecorder.finalize())
    }

    @Test
    fun `finalize with no samples returns null`() {
        SessionRecorder.start()
        assertNull(SessionRecorder.finalize())
        assertTrue(!SessionRecorder.active)
    }

    @Test
    fun `records packets and stores them byte-for-byte`() {
        SessionRecorder.start()
        val p0 = packet(0, 1f, 2f)
        val p1 = packet(1, 3f, 4f)
        val p2 = packet(2, 5f, 6f)
        SessionRecorder.record(p0)
        SessionRecorder.record(p1)
        SessionRecorder.record(p2)

        val session = SessionRecorder.finalize()
        assertNotNull(session)
        val s = session!!

        assertEquals(3, s.summary.sampleCount)
        assertEquals(PreceptMotionProtocol.PACKET_SIZE, s.packetSize)
        assertEquals(SessionRecorder.PACKET_VERSION, s.packetVersion)
        assertTrue(s.summary.durationMs >= 0)

        val blob = Base64.getDecoder().decode(s.samplesBase64)
        assertEquals(3 * PreceptMotionProtocol.PACKET_SIZE, blob.size)
        val roundTripped = blob.copyOfRange(0, PreceptMotionProtocol.PACKET_SIZE)
        assertArrayEquals(p0, roundTripped)
        assertArrayEquals(p1, blob.copyOfRange(16, 32))
        assertArrayEquals(p2, blob.copyOfRange(32, 48))
    }

    @Test
    fun `computes rms accel and peak gyro magnitude`() {
        // Constant |a| = sqrt(3)*1 ≈ 1.732 (accel x=y=z=1), |w| = sqrt(3)*2 ≈ 3.464.
        SessionRecorder.start()
        SessionRecorder.record(packet(0, 1f, 2f))
        SessionRecorder.record(packet(1, 1f, 2f))
        val s = SessionRecorder.finalize()!!

        assertEquals(1.732, s.summary.avgAccelMagnitude, 0.01)
        assertEquals(3.464f, s.summary.peakGyroMagnitude, 0.01f)
    }

    @Test
    fun `negative axis values decode as signed int16`() {
        // Regression: readInt16LE was unsigned, so -5 m/s² decoded as ~655.31
        // and inflated the RMS magnitude. |a| = sqrt(3*25) ≈ 8.660 here.
        SessionRecorder.start()
        SessionRecorder.record(packet(0, -5f, -2f))
        SessionRecorder.record(packet(1, -5f, -2f))
        val s = SessionRecorder.finalize()!!

        assertEquals(8.660, s.summary.avgAccelMagnitude, 0.01)
        assertEquals(3.464f, s.summary.peakGyroMagnitude, 0.01f)
    }

    @Test
    fun `state resets after finalize so a new session can start`() {
        SessionRecorder.start()
        SessionRecorder.record(packet(0, 1f, 2f))
        val first = SessionRecorder.finalize()
        assertEquals(1, first!!.summary.sampleCount)

        SessionRecorder.start()
        SessionRecorder.record(packet(0, 9f, 9f))
        SessionRecorder.record(packet(1, 9f, 9f))
        val second = SessionRecorder.finalize()!!
        assertEquals(2, second.summary.sampleCount)
        assertEquals(15.588, second.summary.avgAccelMagnitude, 0.01) // sqrt(3)*9
    }

    @Test
    fun `counts reps from bursts in the captured stream`() {
        // Rest = (0,0,9.81) so |a| ≈ gravity; burst pushes z to 14.81 (dev ~5).
        // Bursts are separated by 15 rest samples (300 ms) > the 250 ms
        // refractory, so each counts: 3 bursts = 3 reps.
        val packets = ArrayList<ByteArray>()
        var counter = 0
        repeat(3) {
            repeat(15) { packets.add(imuPacket(counter++, 0f, 0f, 9.81f)) }
            repeat(10) { packets.add(imuPacket(counter++, 0f, 0f, 14.81f)) }
        }
        repeat(15) { packets.add(imuPacket(counter++, 0f, 0f, 9.81f)) }

        SessionRecorder.start()
        packets.forEach { SessionRecorder.record(it) }
        assertEquals(3, SessionRecorder.repCount)

        val s = SessionRecorder.finalize()!!
        assertEquals(3, s.summary.repCount)
        assertEquals(90, s.summary.sampleCount)
    }

    @Test
    fun `rep count resets between sessions`() {
        SessionRecorder.start()
        repeat(10) { SessionRecorder.record(imuPacket(it, 0f, 0f, 9.81f)) }
        repeat(10) { SessionRecorder.record(imuPacket(it, 0f, 0f, 14.81f)) }
        repeat(15) { SessionRecorder.record(imuPacket(it, 0f, 0f, 9.81f)) }
        assertEquals(1, SessionRecorder.finalize()!!.summary.repCount)

        SessionRecorder.start()
        repeat(25) { SessionRecorder.record(imuPacket(it, 0f, 0f, 9.81f)) }
        assertEquals(0, SessionRecorder.repCount)
        assertEquals(0, SessionRecorder.finalize()!!.summary.repCount)
    }

    private fun imuPacket(counter: Int, ax: Float, ay: Float, az: Float): ByteArray =
        PreceptMotionProtocol.encodeImuPacket(counter, ax, ay, az, 0f, 0f, 0f)
}
