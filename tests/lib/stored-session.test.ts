import { describe, it, expect } from "vitest"
import { encodeImuPacket, bytesToBase64, base64ToBytes, type WearableStoredSession } from "@/lib/wearable-protocol"
import { decodeStoredSession, analyzeStoredSession } from "@/lib/stored-session"

function buildStoredSession(count = 10, sampleRate = 50): WearableStoredSession {
  const startedAtMs = 1_700_000_000_000
  const packets: Uint8Array[] = []
  for (let t = 0; t < count; t++) {
    packets.push(
      encodeImuPacket({
        counter: t & 0xffff,
        acceleration: { x: Math.sin(t * 0.8) * 2, y: Math.cos(t * 1.04) * 2, z: 9.8 },
        rotationRate: { alpha: Math.sin(t * 0.07) * 30, beta: Math.cos(t * 0.11) * 25, gamma: 0 },
      }),
    )
  }
  const flat = new Uint8Array(count * 16)
  packets.forEach((p, i) => flat.set(p, i * 16))
  return {
    summary: {
      index: 0,
      id: "mock-session",
      startedAtMs,
      endedAtMs: startedAtMs + (count * 1000) / sampleRate,
      sampleCount: count,
      avgAccelMagnitude: 9.9,
      peakGyroMagnitude: 33,
    },
    packetVersion: 1,
    packetSize: 16,
    samplesBase64: bytesToBase64(flat),
    sampleRate,
  }
}

describe("decodeStoredSession", () => {
  it("decodes the blob into MotionData re-timestamped from startedAtMs", () => {
    const session = buildStoredSession(10, 50)
    const data = decodeStoredSession(session)
    expect(data).toHaveLength(10)
    expect(data[0].timestamp).toBe(session.summary.startedAtMs)
    expect(data[9].timestamp).toBe(session.summary.startedAtMs + (9 * 1000) / 50)
    expect(data[5].acceleration.z).toBeCloseTo(9.8, 1)
  })

  it("falls back to 50 Hz when the sample rate is missing", () => {
    const session = buildStoredSession(4)
    session.sampleRate = 0
    const data = decodeStoredSession(session)
    expect(data).toHaveLength(4)
    expect(data[3].timestamp).toBe(session.summary.startedAtMs + (3 * 1000) / 50)
  })

  it("skips trailing partial packets", () => {
    const session = buildStoredSession(3)
    const full = base64ToBytes(session.samplesBase64)
    const padded = new Uint8Array(full.length + 7)
    padded.set(full)
    session.samplesBase64 = bytesToBase64(padded)
    expect(decodeStoredSession(session)).toHaveLength(3)
  })
})

describe("analyzeStoredSession", () => {
  it("runs the shared fluidity pipeline over stored samples", () => {
    const analysis = analyzeStoredSession(buildStoredSession(60, 50))
    expect(analysis).toHaveProperty("fluidityScore")
    expect(typeof analysis.fluidityScore).toBe("number")
    expect(analysis).toHaveProperty("intensity")
    expect(analysis).toHaveProperty("isActive")
  })
})
