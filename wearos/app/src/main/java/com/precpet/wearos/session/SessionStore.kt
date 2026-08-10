package com.precpet.wearos.session

import org.json.JSONObject
import java.io.File

/**
 * Persists recorded sessions as one flat JSON file per session inside [dir]
 * (e.g. `filesDir/sessions`). The JSON shape is the same one the PWA will
 * consume over BLE (see `docs/wearable-protocol.md` §12), so the on-watch
 * files are directly reusable as the sync payload.
 *
 * `org.json` ships with the Android SDK on device; the real jar is added as a
 * test-only dependency so unit tests run on the JVM.
 */
class SessionStore(private val dir: File) {
    init {
        dir.mkdirs()
    }

    /** Most recent first. Corrupt/unreadable files are skipped. */
    fun list(): List<SessionSummary> =
        dir.listFiles { f -> f.isFile && f.name.endsWith(JSON_SUFFIX) }
            ?.mapNotNull { readSummary(it) }
            ?.sortedByDescending { it.startedAtMs }
            ?: emptyList()

    fun save(session: StoredSession) {
        File(dir, session.summary.id + JSON_SUFFIX).writeText(toJson(session))
    }

    /**
     * The on-watch JSON for one session — the exact payload the PWA consumes
     * over the Session Data channel (§12). Shared by the file store and the
     * BLE server so the disk format and the transfer format are identical.
     */
    fun toJson(session: StoredSession): String = JSONObject()
        .put("v", 1)
        .put("id", session.summary.id)
        .put("startedAtMs", session.summary.startedAtMs)
        .put("endedAtMs", session.summary.endedAtMs)
        .put("sampleCount", session.summary.sampleCount)
        .put("avgAccelMagnitude", session.summary.avgAccelMagnitude)
        .put("peakGyroMagnitude", session.summary.peakGyroMagnitude)
        .put("repCount", session.summary.repCount)
        .put("packetVersion", session.packetVersion)
        .put("packetSize", session.packetSize)
        .put("samplesBase64", session.samplesBase64)
        .toString()

    /** The List Sessions response: {"v":1,"sessions":[...]} with 0-based indexes. */
    fun listJson(): String {
        val arr = org.json.JSONArray()
        list().forEachIndexed { index, s ->
            arr.put(JSONObject()
                .put("index", index)
                .put("id", s.id)
                .put("startedAtMs", s.startedAtMs)
                .put("endedAtMs", s.endedAtMs)
                .put("sampleCount", s.sampleCount)
                .put("avgAccelMagnitude", s.avgAccelMagnitude)
                .put("peakGyroMagnitude", s.peakGyroMagnitude)
                .put("repCount", s.repCount))
        }
        return JSONObject().put("v", 1).put("sessions", arr).toString()
    }

    fun load(id: String): StoredSession? {
        val file = File(dir, id + JSON_SUFFIX)
        if (!file.isFile) return null
        return readStored(file)
    }

    fun delete(id: String): Boolean = File(dir, id + JSON_SUFFIX).delete()

    fun clear() {
        list().forEach { delete(it.id) }
    }

    private fun readSummary(file: File): SessionSummary? = try {
        val obj = JSONObject(file.readText())
        SessionSummary(
            id = obj.getString("id"),
            startedAtMs = obj.getLong("startedAtMs"),
            endedAtMs = obj.getLong("endedAtMs"),
            sampleCount = obj.getInt("sampleCount"),
            avgAccelMagnitude = obj.getDouble("avgAccelMagnitude"),
            peakGyroMagnitude = obj.getDouble("peakGyroMagnitude").toFloat(),
            repCount = obj.optInt("repCount", 0),
        )
    } catch (_: Exception) {
        null
    }

    private fun readStored(file: File): StoredSession? = try {
        val obj = JSONObject(file.readText())
        StoredSession(
            summary = SessionSummary(
                id = obj.getString("id"),
                startedAtMs = obj.getLong("startedAtMs"),
                endedAtMs = obj.getLong("endedAtMs"),
                sampleCount = obj.getInt("sampleCount"),
                avgAccelMagnitude = obj.getDouble("avgAccelMagnitude"),
                peakGyroMagnitude = obj.getDouble("peakGyroMagnitude").toFloat(),
                repCount = obj.optInt("repCount", 0),
            ),
            packetVersion = obj.getInt("packetVersion"),
            packetSize = obj.getInt("packetSize"),
            samplesBase64 = obj.getString("samplesBase64"),
        )
    } catch (_: Exception) {
        null
    }

    companion object {
        private const val JSON_SUFFIX = ".json"
    }
}
