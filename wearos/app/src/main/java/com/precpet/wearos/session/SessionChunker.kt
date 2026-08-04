package com.precpet.wearos.session

/**
 * Splits a session-store JSON message into Session Data notification chunks
 * (docs/wearable-protocol.md §12). Pure JVM so it is unit testable and mirrors
 * the TypeScript `SessionChunkAssembler` (lib/wearable-protocol.ts).
 *
 * Each chunk = [flags u8][fragment], where fragment ≤ maxFragment. The total
 * notification payload must stay ≤ MTU − 3, so the server passes
 * `maxFragment = negotiatedMtu - 4` (1 header byte + 3 ATT header bytes).
 */
object SessionChunker {
    const val FLAG_FIRST = 0x80
    const val FLAG_LAST = 0x40
    const val FLAG_ERROR = 0x20

    /** Chunk a message into fragments with FIRST/LAST flags set. */
    fun chunk(message: ByteArray, maxFragment: Int): List<ByteArray> {
        require(maxFragment >= 1) { "maxFragment must be >= 1" }
        if (message.isEmpty()) return listOf(byteArrayOf(FLAG_LAST.toByte()))

        val chunks = ArrayList<ByteArray>()
        var offset = 0
        var first = true
        while (offset < message.size) {
            val size = minOf(maxFragment, message.size - offset)
            var flags = if (first) FLAG_FIRST else 0
            if (offset + size >= message.size) flags = flags or FLAG_LAST

            val chunk = ByteArray(size + 1)
            chunk[0] = flags.toByte()
            System.arraycopy(message, offset, chunk, 1, size)
            chunks.add(chunk)
            offset += size
            first = false
        }
        return chunks
    }

    /** A single FIRST|LAST|ERROR chunk carrying an error message fragment. */
    fun errorChunk(message: ByteArray, maxFragment: Int): ByteArray {
        val size = minOf(maxFragment, message.size)
        val chunk = ByteArray(size + 1)
        chunk[0] = (FLAG_FIRST or FLAG_LAST or FLAG_ERROR).toByte()
        System.arraycopy(message, 0, chunk, 1, size)
        return chunk
    }
}
