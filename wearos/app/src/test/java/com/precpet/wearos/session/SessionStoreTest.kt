package com.precpet.wearos.session

import com.precpet.wearos.protocol.PreceptMotionProtocol
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.nio.file.Files
import java.util.Base64

class SessionStoreTest {

    private lateinit var store: SessionStore
    private lateinit var dir: java.io.File

    @Before
    fun setUp() {
        dir = Files.createTempDirectory("precept-sessions").toFile()
        store = SessionStore(dir)
    }

    private fun session(id: String, count: Int = 4, repCount: Int = 7): StoredSession {
        val packets = ArrayList<ByteArray>(count)
        for (i in 0 until count) {
            packets.add(PreceptMotionProtocol.encodeImuPacket(i, 1f, 1f, 1f, 2f, 2f, 2f))
        }
        return StoredSession(
            summary = SessionSummary(
                id = id,
                startedAtMs = 1_700_000_000_000L + count,
                endedAtMs = 1_700_000_000_000L + count + 1000,
                sampleCount = count,
                avgAccelMagnitude = 9.81,
                peakGyroMagnitude = 3.46f,
                repCount = repCount,
            ),
            packetVersion = SessionRecorder.PACKET_VERSION,
            packetSize = PreceptMotionProtocol.PACKET_SIZE,
            samplesBase64 = Base64.getEncoder().encodeToString(packets.flatMap { it.toList() }.toByteArray()),
        )
    }

    @Test
    fun `empty directory lists nothing`() {
        assertTrue(store.list().isEmpty())
    }

    @Test
    fun `save then list and load round-trips all fields`() {
        store.save(session("s1", 4))

        val listed = store.list()
        assertEquals(1, listed.size)
        assertEquals("s1", listed[0].id)
        assertEquals(4, listed[0].sampleCount)
        assertEquals(1000, listed[0].durationMs)
        assertEquals(7, listed[0].repCount)

        val loaded = store.load("s1")
        assertNotNull(loaded)
        assertEquals("s1", loaded!!.summary.id)
        assertEquals(9.81, loaded.summary.avgAccelMagnitude, 0.0001)
        assertEquals(3.46f, loaded.summary.peakGyroMagnitude, 0.001f)
        assertEquals(7, loaded.summary.repCount)
        assertEquals(1, loaded.packetVersion)
        assertEquals(16, loaded.packetSize)
        assertEquals(4 * 16, Base64.getDecoder().decode(loaded.samplesBase64).size)
    }

    @Test
    fun `list json carries rep count to the phone`() {
        store.save(session("s1", repCount = 3))
        val json = store.listJson()
        assertTrue(json.contains("\"repCount\":3"))
    }

    @Test
    fun `sessions recorded before rep counting default to zero reps`() {
        // A session saved by an older build has no repCount key; it must load
        // as 0 rather than failing.
        java.io.File(dir, "legacy.json").writeText("""
            {"v":1,"id":"legacy","startedAtMs":1000,"endedAtMs":2000,"sampleCount":10,
             "avgAccelMagnitude":9.81,"peakGyroMagnitude":3.4,
             "packetVersion":1,"packetSize":16,"samplesBase64":"AA=="}
        """.trimIndent())

        assertEquals(0, store.list().single().repCount)
        assertEquals(0, store.load("legacy")!!.summary.repCount)
    }

    @Test
    fun `lists most recent first`() {
        store.save(session("old", 1))
        store.save(session("new", 2))
        assertEquals(listOf("new", "old"), store.list().map { it.id })
    }

    @Test
    fun `delete removes the file`() {
        store.save(session("s1"))
        assertTrue(store.delete("s1"))
        assertNull(store.load("s1"))
        assertTrue(store.list().isEmpty())
        assertFalse(store.delete("s1"))
    }

    @Test
    fun `clear removes everything`() {
        store.save(session("a"))
        store.save(session("b"))
        store.clear()
        assertTrue(store.list().isEmpty())
    }

    @Test
    fun `missing load returns null`() {
        assertNull(store.load("nope"))
    }

    @Test
    fun `corrupt files are skipped and never crash`() {
        java.io.File(dir, "corrupt.json").writeText("{not valid json")
        java.io.File(dir, "valid-but-broken.json").writeText("""{"v":1}""")
        assertTrue(store.list().isEmpty())
        assertNull(store.load("corrupt"))
    }
}
