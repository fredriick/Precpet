import { describe, it, expect } from "vitest"
import {
  decodeImuPacket,
  encodeImuPacket,
  buildCommandPacket,
  buildTimeSyncPacket,
  buildSessionIndexJson,
  bytesToBase64,
  base64ToBytes,
  parseSessionIndex,
  parseStoredSession,
  SessionChunkAssembler,
  SESSION_CHUNK_FIRST,
  SESSION_CHUNK_LAST,
  SESSION_CHUNK_ERROR,
  COMMAND_START,
  COMMAND_STOP,
  COMMAND_SET_RATE,
  PACKET_SIZE,
} from "@/lib/wearable-protocol"
import type { ImuSample, WearableSessionSummary } from "@/lib/wearable-protocol"

describe("wearable protocol", () => {
  describe("encode/decode round-trip", () => {
    it("round-trips a typical sample with gravity", () => {
      const sample: ImuSample = {
        counter: 0xbeef,
        acceleration: { x: 0.42, y: -1.13, z: 9.81 },
        rotationRate: { alpha: 1.5, beta: -0.4, gamma: 2.75 },
      }
      const decoded = decodeImuPacket(encodeImuPacket(sample))
      expect(decoded).not.toBeNull()
      expect(decoded!.counter).toBe(sample.counter)
      expect(decoded!.acceleration.x).toBeCloseTo(sample.acceleration.x, 1)
      expect(decoded!.acceleration.y).toBeCloseTo(sample.acceleration.y, 1)
      expect(decoded!.acceleration.z).toBeCloseTo(sample.acceleration.z, 1)
      expect(decoded!.rotationRate.alpha).toBeCloseTo(sample.rotationRate.alpha, 1)
      expect(decoded!.rotationRate.beta).toBeCloseTo(sample.rotationRate.beta, 1)
      expect(decoded!.rotationRate.gamma).toBeCloseTo(sample.rotationRate.gamma, 1)
    })

    it("encodes exactly 16 bytes with a matching length", () => {
      const packet = encodeImuPacket({
        counter: 0,
        acceleration: { x: 0, y: 0, z: 0 },
        rotationRate: { alpha: 0, beta: 0, gamma: 0 },
      })
      expect(packet).toHaveLength(PACKET_SIZE)
    })
  })

  describe("decodeImuPacket", () => {
    it("returns null for a truncated buffer", () => {
      expect(decodeImuPacket(new Uint8Array(10))).toBeNull()
    })

    it("returns null for an unknown protocol version", () => {
      const packet = encodeImuPacket({
        counter: 0,
        acceleration: { x: 0, y: 0, z: 0 },
        rotationRate: { alpha: 0, beta: 0, gamma: 0 },
      })
      packet[0] = 0xff
      expect(decodeImuPacket(packet)).toBeNull()
    })

    it("clamps out-of-range values on encode", () => {
      const packet = encodeImuPacket({
        counter: 0,
        acceleration: { x: 99999, y: 0, z: 0 },
        rotationRate: { alpha: 0, beta: 0, gamma: 0 },
      })
      const decoded = decodeImuPacket(packet)!
      expect(decoded.acceleration.x).toBeCloseTo(327.67, 1)
    })
  })

  describe("command packets", () => {
    it("builds a bare start packet", () => {
      expect([...buildCommandPacket(COMMAND_START)]).toEqual([COMMAND_START])
    })

    it("builds a stop packet", () => {
      expect([...buildCommandPacket(COMMAND_STOP)]).toEqual([COMMAND_STOP])
    })

    it("builds a set-rate packet with payload", () => {
      expect([...buildCommandPacket(COMMAND_SET_RATE, 50)]).toEqual([COMMAND_SET_RATE, 50])
    })
  })

  describe("time sync", () => {
    it("builds a 10-byte packet with little-endian ms", () => {
      const packet = buildTimeSyncPacket(1699999999999)
      expect(packet).toHaveLength(10)
      expect(packet[0]).toBe(0x10)
      const view = new DataView(packet.buffer)
      expect(view.getBigUint64(1, true)).toBe(BigInt(1699999999999))
      expect(packet[9]).toBe(0x00)
    })
  })

  describe("base64 helpers", () => {
    it("round-trips arbitrary bytes", () => {
      const bytes = new Uint8Array([0, 1, 2, 127, 128, 255, 3])
      expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes)
    })
  })

  describe("session index", () => {
    const summaries: WearableSessionSummary[] = [
      { index: 0, id: "s1", startedAtMs: 2000, endedAtMs: 4000, sampleCount: 100, avgAccelMagnitude: 9.8, peakGyroMagnitude: 40 },
      { index: 1, id: "s2", startedAtMs: 1000, endedAtMs: 2000, sampleCount: 50, avgAccelMagnitude: 9.7, peakGyroMagnitude: 30 },
    ]

    it("round-trips through buildSessionIndexJson + parseSessionIndex", () => {
      const parsed = parseSessionIndex(buildSessionIndexJson(summaries))
      expect(parsed).toEqual(summaries)
    })

    it("round-trips an optional repCount and omits it when absent", () => {
      const withReps: WearableSessionSummary[] = [
        { index: 0, id: "s1", startedAtMs: 2000, endedAtMs: 4000, sampleCount: 100, avgAccelMagnitude: 9.8, peakGyroMagnitude: 40, repCount: 12 },
      ]
      expect(parseSessionIndex(buildSessionIndexJson(withReps))).toEqual(withReps)
      expect(parseSessionIndex(buildSessionIndexJson(summaries))![0].repCount).toBeUndefined()
    })

    it("parses repCount from a raw watch index payload", () => {
      const parsed = parseSessionIndex(
        '{"v":1,"sessions":[{"index":0,"id":"s1","startedAtMs":2000,"endedAtMs":4000,' +
          '"sampleCount":100,"avgAccelMagnitude":9.8,"peakGyroMagnitude":40,"repCount":3}]}',
      )
      expect(parsed).not.toBeNull()
      expect(parsed![0].repCount).toBe(3)
    })

    it("rejects a response without a sessions array", () => {
      expect(parseSessionIndex('{"v":1}')).toBeNull()
      expect(parseSessionIndex("not json")).toBeNull()
    })

    it("rejects a malformed summary entry", () => {
      expect(parseSessionIndex('{"sessions":[{"id":"s1"}]}')).toBeNull()
    })
  })

  describe("parseStoredSession", () => {
    it("parses the watch JSON shape and derives the sample rate", () => {
      const json = JSON.stringify({
        v: 1,
        id: "abc",
        startedAtMs: 1_700_000_000_000,
        endedAtMs: 1_700_000_000_000 + 20_000,
        sampleCount: 1000,
        avgAccelMagnitude: 9.8,
        peakGyroMagnitude: 44.4,
        packetVersion: 1,
        packetSize: 16,
        samplesBase64: "aGk=",
      })
      const parsed = parseStoredSession(json)
      expect(parsed).not.toBeNull()
      expect(parsed!.summary.id).toBe("abc")
      expect(parsed!.sampleRate).toBeCloseTo(50, 5)
      expect(parsed!.packetVersion).toBe(1)
      expect(parsed!.packetSize).toBe(16)
      expect(parsed!.samplesBase64).toBe("aGk=")
    })

    it("falls back to the default sample rate for zero-duration sessions", () => {
      const json = JSON.stringify({
        id: "abc",
        startedAtMs: 1000,
        endedAtMs: 1000,
        sampleCount: 0,
        avgAccelMagnitude: 0,
        peakGyroMagnitude: 0,
        packetVersion: 1,
        packetSize: 16,
        samplesBase64: "",
      })
      expect(parseStoredSession(json)!.sampleRate).toBe(50)
    })

    it("rejects missing payload fields", () => {
      const json = JSON.stringify({ id: "abc", packetVersion: 1, packetSize: 16 })
      expect(parseStoredSession(json)).toBeNull()
      expect(parseStoredSession("not json")).toBeNull()
    })
  })

  describe("SessionChunkAssembler", () => {
    const chunk = (flags: number, fragment: string): Uint8Array => {
      const out = new Uint8Array(1 + fragment.length)
      out[0] = flags
      for (let i = 0; i < fragment.length; i++) out[1 + i] = fragment.charCodeAt(i)
      return out
    }

    it("reassembles a single-chunk message", () => {
      const assembler = new SessionChunkAssembler()
      const result = assembler.push(chunk(SESSION_CHUNK_FIRST | SESSION_CHUNK_LAST, `{"ok":true}`))
      expect(result.complete).toBe(true)
      expect(result.text).toBe(`{"ok":true}`)
    })

    it("reassembles a multi-chunk message in order", () => {
      const assembler = new SessionChunkAssembler()
      const message = "0123456789".repeat(8)
      expect(assembler.push(chunk(SESSION_CHUNK_FIRST, message.slice(0, 10))).complete).toBe(false)
      expect(assembler.push(chunk(0, message.slice(10, 40))).complete).toBe(false)
      const last = assembler.push(chunk(SESSION_CHUNK_LAST, message.slice(40)))
      expect(last.complete).toBe(true)
      expect(last.text).toBe(message)
    })

    it("surfaces a watch error chunk", () => {
      const assembler = new SessionChunkAssembler()
      const result = assembler.push(chunk(SESSION_CHUNK_FIRST | SESSION_CHUNK_LAST | SESSION_CHUNK_ERROR, "session not found"))
      expect(result.complete).toBe(true)
      expect(result.error).toContain("session not found")
    })

    it("rejects a continuation before the first chunk", () => {
      const assembler = new SessionChunkAssembler()
      const result = assembler.push(chunk(SESSION_CHUNK_LAST, "orphan"))
      expect(result.complete).toBe(false)
      expect(result.error).toContain("out of order")
    })

    it("restarts cleanly when a new first chunk arrives", () => {
      const assembler = new SessionChunkAssembler()
      assembler.push(chunk(SESSION_CHUNK_FIRST, "stale"))
      const result = assembler.push(chunk(SESSION_CHUNK_FIRST | SESSION_CHUNK_LAST, "fresh"))
      expect(result.text).toBe("fresh")
    })

    it("rejects an empty chunk", () => {
      const assembler = new SessionChunkAssembler()
      expect(assembler.push(new Uint8Array(0)).error).toContain("Empty")
    })
  })
})
