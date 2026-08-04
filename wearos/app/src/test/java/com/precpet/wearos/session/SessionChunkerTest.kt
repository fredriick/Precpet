package com.precpet.wearos.session

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionChunkerTest {

    @Test
    fun `single chunk fits entirely`() {
        val message = "hello".toByteArray(Charsets.UTF_8)
        val chunks = SessionChunker.chunk(message, 16)
        assertEquals(1, chunks.size)
        assertEquals(SessionChunker.FLAG_FIRST or SessionChunker.FLAG_LAST, chunks[0][0].toInt() and 0xff)
        assertArrayEquals(message, chunks[0].copyOfRange(1, chunks[0].size))
    }

    @Test
    fun `empty message yields a single last chunk`() {
        val chunks = SessionChunker.chunk(ByteArray(0), 16)
        assertEquals(1, chunks.size)
        assertEquals(SessionChunker.FLAG_LAST, chunks[0][0].toInt() and 0xff)
        assertEquals(1, chunks[0].size)
    }

    @Test
    fun `multi chunk keeps flags and order`() {
        val message = "0123456789".toByteArray(Charsets.UTF_8)
        val chunks = SessionChunker.chunk(message, 4)
        assertEquals(3, chunks.size)
        assertEquals(SessionChunker.FLAG_FIRST, chunks[0][0].toInt() and 0xff)
        assertEquals(0, chunks[1][0].toInt() and 0xff)
        assertEquals(SessionChunker.FLAG_LAST, chunks[2][0].toInt() and 0xff)
        assertEquals(5, chunks[0].size)
        assertEquals(5, chunks[1].size)
        assertEquals(3, chunks[2].size)
        assertArrayEquals(message, chunks.flatMap { it.copyOfRange(1, it.size).toList() }.toByteArray())
    }

    @Test
    fun `single byte fragment at max fragment size`() {
        val chunks = SessionChunker.chunk("abcdef".toByteArray(Charsets.UTF_8), 2)
        assertEquals(3, chunks.size)
        assertEquals(3, chunks[0].size)
        assertEquals(3, chunks[1].size)
        assertEquals(3, chunks[2].size)
    }

    @Test(expected = IllegalArgumentException::class)
    fun `rejects zero max fragment`() {
        SessionChunker.chunk("x".toByteArray(), 0)
    }

    @Test
    fun `error chunk sets first last and error flags`() {
        val chunk = SessionChunker.errorChunk("boom".toByteArray(Charsets.UTF_8), 16)
        val flags = chunk[0].toInt() and 0xff
        assertEquals(
            SessionChunker.FLAG_FIRST or SessionChunker.FLAG_LAST or SessionChunker.FLAG_ERROR,
            flags,
        )
        assertArrayEquals("boom".toByteArray(Charsets.UTF_8), chunk.copyOfRange(1, chunk.size))
    }

    @Test
    fun `error chunk truncates to max fragment`() {
        val chunk = SessionChunker.errorChunk("a very long error message".toByteArray(Charsets.UTF_8), 8)
        assertEquals(9, chunk.size)
        assertTrue((chunk[0].toInt() and SessionChunker.FLAG_ERROR) != 0)
    }
}
