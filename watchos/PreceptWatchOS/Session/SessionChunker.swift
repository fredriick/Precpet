import Foundation

/// Splits a session-store JSON message into Session Data notification chunks
/// (docs/wearable-protocol.md §12). Mirrors the Wear OS `SessionChunker.kt`
/// and the TypeScript `SessionChunkAssembler` (lib/wearable-protocol.ts).
///
/// Each chunk = [flags u8][fragment], where fragment ≤ maxFragment. The total
/// notification payload must stay ≤ MTU − 3, so the server passes
/// `maxFragment = mtu - 4` (1 header byte + 3 ATT header bytes).
enum SessionChunker {
    static let flagFirst: UInt8 = 0x80
    static let flagLast: UInt8 = 0x40
    static let flagError: UInt8 = 0x20

    /// Chunk a message into fragments with FIRST/LAST flags set.
    static func chunk(_ message: Data, maxFragment: Int) -> [Data] {
        precondition(maxFragment >= 1, "maxFragment must be >= 1")
        if message.isEmpty {
            return [Data([flagLast])]
        }

        var chunks: [Data] = []
        var offset = 0
        var first = true
        while offset < message.count {
            let size = min(maxFragment, message.count - offset)
            var flags: UInt8 = first ? flagFirst : 0
            if offset + size >= message.count {
                flags |= flagLast
            }

            var chunk = Data(count: size + 1)
            chunk[0] = flags
            chunk.replaceSubrange(1..<chunk.count, with: message[offset..<(offset + size)])
            chunks.append(chunk)
            offset += size
            first = false
        }
        return chunks
    }

    /// A single FIRST|LAST|ERROR chunk carrying an error message fragment.
    static func errorChunk(_ message: Data, maxFragment: Int) -> Data {
        let size = min(maxFragment, message.count)
        var chunk = Data(count: size + 1)
        chunk[0] = flagFirst | flagLast | flagError
        chunk.replaceSubrange(1..<chunk.count, with: message[0..<size])
        return chunk
    }
}
