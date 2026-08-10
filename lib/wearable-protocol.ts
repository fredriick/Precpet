// Precept Motion Service — BLE GATT protocol.
// Spec: docs/wearable-protocol.md. This module is pure/data-only so it is
// unit-testable without a Bluetooth device.

export const PRECEPT_SERVICE_UUID = "d5f2a1a0-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
export const PRECEPT_IMU_CHARACTERISTIC_UUID = "d5f2a1a1-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
export const PRECEPT_COMMAND_CHARACTERISTIC_UUID = "d5f2a1a2-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
export const PRECEPT_BATTERY_CHARACTERISTIC_UUID = "d5f2a1a3-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
export const PRECEPT_TIME_SYNC_CHARACTERISTIC_UUID = "d5f2a1a4-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
export const PRECEPT_SESSION_DATA_CHARACTERISTIC_UUID = "d5f2a1a5-3f1e-4b6e-9c2e-7f3a8b4c5d6e"

export const PRECEPT_PACKET_VERSION = 0x01
export const PACKET_SIZE = 16

export const COMMAND_START = 0x01
export const COMMAND_STOP = 0x02
export const COMMAND_SET_RATE = 0x03
export const COMMAND_LIST_SESSIONS = 0x10
export const COMMAND_REQUEST_SESSION = 0x11
export const COMMAND_DELETE_SESSION = 0x12
export const COMMAND_DELETE_ALL = 0x13

// Session Data characteristic chunk framing (docs/wearable-protocol.md §12).
export const SESSION_CHUNK_FIRST = 0x80
export const SESSION_CHUNK_LAST = 0x40
export const SESSION_CHUNK_ERROR = 0x20

export const SESSION_TRANSFER_TIMEOUT_MS = 120_000

export const SAMPLE_RATES = [10, 25, 50, 100] as const
export const DEFAULT_SAMPLE_RATE = 50

export const ACCEL_SCALE = 100 // m/s² × 100 stored as int16
export const GYRO_SCALE = 10 // deg/s × 10 stored as int16

export interface ImuSample {
  counter: number
  acceleration: { x: number; y: number; z: number } // m/s², includes gravity
  rotationRate: { alpha: number; beta: number; gamma: number } // deg/s
}

const MAX_INT16 = 32767
const MIN_INT16 = -32768

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// Decode a 16-byte IMU Data packet (little-endian). Returns null for
// truncated buffers or unknown protocol versions.
export function decodeImuPacket(bytes: Uint8Array): ImuSample | null {
  if (bytes.length < PACKET_SIZE) return null
  if (bytes[0] !== PRECEPT_PACKET_VERSION) return null

  const view = new DataView(bytes.buffer, bytes.byteOffset, PACKET_SIZE)
  return {
    counter: view.getUint16(1, true),
    acceleration: {
      x: view.getInt16(3, true) / ACCEL_SCALE,
      y: view.getInt16(5, true) / ACCEL_SCALE,
      z: view.getInt16(7, true) / ACCEL_SCALE,
    },
    rotationRate: {
      alpha: view.getInt16(13, true) / GYRO_SCALE, // gyro Z
      beta: view.getInt16(9, true) / GYRO_SCALE, // gyro X
      gamma: view.getInt16(11, true) / GYRO_SCALE, // gyro Y
    },
  }
}

// Encode an IMU sample into the 16-byte little-endian packet (useful for the
// mock peripheral and for tests).
export function encodeImuPacket(sample: ImuSample): Uint8Array {
  const bytes = new Uint8Array(PACKET_SIZE)
  const view = new DataView(bytes.buffer)
  bytes[0] = PRECEPT_PACKET_VERSION
  view.setUint16(1, sample.counter & 0xffff, true)
  view.setInt16(3, Math.round(clamp(sample.acceleration.x, MIN_INT16 / ACCEL_SCALE, MAX_INT16 / ACCEL_SCALE) * ACCEL_SCALE), true)
  view.setInt16(5, Math.round(clamp(sample.acceleration.y, MIN_INT16 / ACCEL_SCALE, MAX_INT16 / ACCEL_SCALE) * ACCEL_SCALE), true)
  view.setInt16(7, Math.round(clamp(sample.acceleration.z, MIN_INT16 / ACCEL_SCALE, MAX_INT16 / ACCEL_SCALE) * ACCEL_SCALE), true)
  view.setInt16(9, Math.round(clamp(sample.rotationRate.beta, MIN_INT16 / GYRO_SCALE, MAX_INT16 / GYRO_SCALE) * GYRO_SCALE), true)
  view.setInt16(11, Math.round(clamp(sample.rotationRate.gamma, MIN_INT16 / GYRO_SCALE, MAX_INT16 / GYRO_SCALE) * GYRO_SCALE), true)
  view.setInt16(13, Math.round(clamp(sample.rotationRate.alpha, MIN_INT16 / GYRO_SCALE, MAX_INT16 / GYRO_SCALE) * GYRO_SCALE), true)
  bytes[15] = 0x00
  return bytes
}

// Build a Command characteristic packet.
export function buildCommandPacket(command: number, payload?: number): Uint8Array {
  if (payload === undefined) return new Uint8Array([command])
  return new Uint8Array([command, payload])
}

// Build a Time Sync write packet: [0x10][u64 unix ms LE][0x00].
export function buildTimeSyncPacket(unixMs: number): Uint8Array {
  const bytes = new Uint8Array(10)
  const view = new DataView(bytes.buffer)
  bytes[0] = 0x10
  view.setBigUint64(1, BigInt(Math.floor(unixMs)), true)
  bytes[9] = 0x00
  return bytes
}

// ---------------------------------------------------------------------------
// Offline session store (§12 of docs/wearable-protocol.md)
// ---------------------------------------------------------------------------

export interface WearableSessionSummary {
  /** Position in the watch's list (sorted most-recent first). Used for commands. */
  index: number
  id: string
  startedAtMs: number
  endedAtMs: number
  sampleCount: number
  avgAccelMagnitude: number // m/s² RMS (includes gravity)
  peakGyroMagnitude: number // deg/s
  /** Optional watch-side rep count (§12); undefined when the watch doesn't count reps. */
  repCount?: number
}

export interface WearableStoredSession {
  summary: WearableSessionSummary
  packetVersion: number
  packetSize: number
  /** Raw 16-byte IMU packets concatenated and base64-encoded. */
  samplesBase64: string
  /** Derived from sampleCount / duration; falls back to the default 50 Hz. */
  sampleRate: number
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

function toSummary(raw: Record<string, unknown>, index: number): WearableSessionSummary | null {
  if (
    typeof raw.id !== "string" ||
    !isFiniteNumber(raw.startedAtMs) ||
    !isFiniteNumber(raw.endedAtMs) ||
    !isFiniteNumber(raw.sampleCount) ||
    !isFiniteNumber(raw.avgAccelMagnitude) ||
    !isFiniteNumber(raw.peakGyroMagnitude)
  ) {
    return null
  }
  const repCount = typeof raw.repCount === "number" ? Math.floor(raw.repCount) : undefined
  return {
    index,
    id: raw.id,
    startedAtMs: raw.startedAtMs,
    endedAtMs: raw.endedAtMs,
    sampleCount: Math.floor(raw.sampleCount),
    avgAccelMagnitude: raw.avgAccelMagnitude,
    peakGyroMagnitude: raw.peakGyroMagnitude,
    ...(repCount !== undefined ? { repCount } : {}),
  }
}

/** Parse the List Sessions response: {"v":1,"sessions":[{index,id,...},...]}. */
export function parseSessionIndex(jsonText: string): WearableSessionSummary[] | null {
  try {
    const obj = JSON.parse(jsonText) as { sessions?: unknown }
    if (!Array.isArray(obj.sessions)) return null
    const summaries: WearableSessionSummary[] = []
    for (let i = 0; i < obj.sessions.length; i++) {
      const s = toSummary(obj.sessions[i] as Record<string, unknown>, i)
      if (!s) return null
      summaries.push(s)
    }
    return summaries
  } catch {
    return null
  }
}

/** Parse a single stored session JSON document. */
export function parseStoredSession(jsonText: string): WearableStoredSession | null {
  try {
    const obj = JSON.parse(jsonText) as Record<string, unknown>
    const summary = toSummary(obj, 0)
    if (
      !summary ||
      typeof obj.packetVersion !== "number" ||
      typeof obj.packetSize !== "number" ||
      typeof obj.samplesBase64 !== "string"
    ) {
      return null
    }
    const durationMs = summary.endedAtMs - summary.startedAtMs
    return {
      summary,
      packetVersion: Math.floor(obj.packetVersion),
      packetSize: Math.floor(obj.packetSize),
      samplesBase64: obj.samplesBase64,
      sampleRate: durationMs > 0 ? (summary.sampleCount * 1000) / durationMs : DEFAULT_SAMPLE_RATE,
    }
  } catch {
    return null
  }
}

/** Build the List Sessions response JSON (used by the mock peripheral). */
export function buildSessionIndexJson(sessions: WearableSessionSummary[]): string {
  return JSON.stringify({
    v: 1,
    sessions: sessions.map((s) => ({
      index: s.index,
      id: s.id,
      startedAtMs: s.startedAtMs,
      endedAtMs: s.endedAtMs,
      sampleCount: s.sampleCount,
      avgAccelMagnitude: s.avgAccelMagnitude,
      peakGyroMagnitude: s.peakGyroMagnitude,
      ...(s.repCount !== undefined ? { repCount: s.repCount } : {}),
    })),
  })
}

/**
 * Reassembles Session Data notification chunks into one JSON message.
 * One message at a time; start fresh on a FIRST chunk (0x80), finish on LAST
 * (0x40). An ERROR flag (0x20) aborts and reports the fragment as the message.
 */
export class SessionChunkAssembler {
  private parts: Uint8Array[] = []
  private hasFirst = false

  push(chunk: Uint8Array): { complete: boolean; text?: string; error?: string } {
    if (chunk.length < 1) return { complete: false, error: "Empty chunk received" }
    const flags = chunk[0]
    const fragment = chunk.slice(1)

    if (flags & SESSION_CHUNK_ERROR) {
      this.parts = []
      this.hasFirst = false
      const message = decodeUtf8(fragment).trim()
      return { complete: true, error: message ? `Watch error: ${message}` : "Watch reported a session error" }
    }

    if (flags & SESSION_CHUNK_FIRST) {
      this.parts = []
      this.hasFirst = true
    } else if (!this.hasFirst) {
      return { complete: false, error: "Chunk out of order: received a continuation before the first chunk" }
    }

    this.parts.push(fragment)

    if (flags & SESSION_CHUNK_LAST) {
      const text = decodeUtf8(concatBytes(this.parts))
      this.parts = []
      this.hasFirst = false
      return { complete: true, text }
    }
    return { complete: false }
  }
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  let length = 0
  for (const part of parts) length += part.length
  const out = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}
