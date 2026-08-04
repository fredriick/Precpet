// Decode + analyze a stored offline session (the base64 packet blob from the
// watch, docs/wearable-protocol.md §12). Pure module, unit-testable.

import { decodeImuPacket, base64ToBytes, type WearableStoredSession } from "@/lib/wearable-protocol"
import { analyzeMotion, type MotionData, type MotionMetrics } from "@/lib/motion"

/**
 * Decode the raw 16-byte IMU packets of a stored session into MotionData,
 * re-timestamping them at the session's sample rate starting from
 * startedAtMs — identical decoding to live streaming, just batched.
 */
export function decodeStoredSession(session: WearableStoredSession): MotionData[] {
  const bytes = base64ToBytes(session.samplesBase64)
  const packetSize = Math.max(1, session.packetSize || 16)
  const rate = session.sampleRate > 0 ? session.sampleRate : 50
  const data: MotionData[] = []
  for (let offset = 0; offset + packetSize <= bytes.length; offset += packetSize) {
    const sample = decodeImuPacket(bytes.slice(offset, offset + packetSize))
    if (!sample) continue
    data.push({
      acceleration: sample.acceleration,
      rotationRate: sample.rotationRate,
      timestamp: session.summary.startedAtMs + (data.length * 1000) / rate,
    })
  }
  return data
}

/** Run the shared fluidity pipeline over a stored session's samples. */
export function analyzeStoredSession(session: WearableStoredSession): MotionMetrics {
  return analyzeMotion(decodeStoredSession(session))
}
