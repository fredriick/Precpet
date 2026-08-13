import Foundation

/// Persists recorded sessions as one flat JSON file per session in an app
/// sandbox directory (e.g. `Application Support/Sessions`). The JSON shape is
/// the same one the PWA will consume over BLE (docs/wearable-protocol.md §12),
/// so the on-watch files are directly reusable as the sync payload.
/// Mirrors the Wear OS `SessionStore.kt`.
final class SessionStore {
    private let directory: URL
    private let jsonEncoder = JSONEncoder()
    private let jsonDecoder = JSONDecoder()
    private let fileManager = FileManager.default

    init(directory: URL? = nil) throws {
        let defaultDir: URL
        if let directory {
            defaultDir = directory
        } else {
            let support = try FileManager.default.url(
                for: .applicationSupportDirectory,
                in: .userDomainMask,
                appropriateFor: nil,
                create: true
            )
            defaultDir = support.appendingPathComponent("Sessions", isDirectory: true)
        }
        try FileManager.default.createDirectory(at: defaultDir, withIntermediateDirectories: true)
        self.directory = defaultDir
    }

    /// Most recent first. Corrupt/unreadable files are skipped.
    func list() -> [SessionSummary] {
        let files = (try? fileManager.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: nil
        )) ?? []
        return files
            .filter { $0.pathExtension == "json" }
            .compactMap { readSummary(from: $0) }
            .sorted { $0.startedAtMs > $1.startedAtMs }
    }

    func save(_ session: StoredSession) throws {
        let url = directory.appendingPathComponent("\(session.id).json")
        try jsonEncoder.encode(session).write(to: url)
    }

    /// The on-watch JSON for one session — the exact payload the PWA consumes
    /// over the Session Data channel (§12). Shared by the file store and the
    /// BLE server so the disk format and the transfer format are identical.
    func toJson(_ session: StoredSession) -> String {
        (try? String(data: jsonEncoder.encode(session), encoding: .utf8)) ?? "{}"
    }

    /// The List Sessions response: {"v":1,"sessions":[...]} with 0-based indexes.
    func listJson() -> String {
        struct SessionIndexItem: Encodable {
            let index: Int
            let id: String
            let startedAtMs: Int64
            let endedAtMs: Int64
            let sampleCount: Int
            let avgAccelMagnitude: Double
            let peakGyroMagnitude: Float
            let repCount: Int
        }
        let items = list().enumerated().map { (index, s) in
            SessionIndexItem(
                index: index,
                id: s.id,
                startedAtMs: s.startedAtMs,
                endedAtMs: s.endedAtMs,
                sampleCount: s.sampleCount,
                avgAccelMagnitude: s.avgAccelMagnitude,
                peakGyroMagnitude: s.peakGyroMagnitude,
                repCount: s.repCount
            )
        }
        let payload = [
            "v": 1,
            "sessions": items.map { item -> [String: Any] in
                [
                    "index": item.index,
                    "id": item.id,
                    "startedAtMs": item.startedAtMs,
                    "endedAtMs": item.endedAtMs,
                    "sampleCount": item.sampleCount,
                    "avgAccelMagnitude": item.avgAccelMagnitude,
                    "peakGyroMagnitude": item.peakGyroMagnitude,
                    "repCount": item.repCount,
                ]
            },
        ] as [String: Any]
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let text = String(data: data, encoding: .utf8) else {
            return "{\"v\":1,\"sessions\":[]}"
        }
        return text
    }

    func load(id: String) -> StoredSession? {
        let url = directory.appendingPathComponent("\(id).json")
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? jsonDecoder.decode(StoredSession.self, from: data)
    }

    @discardableResult
    func delete(id: String) -> Bool {
        let url = directory.appendingPathComponent("\(id).json")
        return (try? fileManager.removeItem(at: url)) != nil
    }

    func clear() {
        for session in list() {
            delete(id: session.id)
        }
    }

    private func readSummary(from url: URL) -> SessionSummary? {
        guard let data = try? Data(contentsOf: url),
              let session = try? jsonDecoder.decode(StoredSession.self, from: data) else {
            return nil
        }
        return session.summary
    }
}
