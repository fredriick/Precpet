import { describe, it, expect } from "vitest"
import { analyzeMotion, pruneMotionData, ANALYSIS_WINDOW_MS, type MotionData } from "@/lib/motion"

const DT_MS = 20 // 50 Hz samples

function sample(partial: Partial<MotionData> = {}): MotionData {
  return {
    acceleration: { x: 0, y: 0, z: 9.8 },
    rotationRate: { alpha: 0, beta: 0, gamma: 0 },
    timestamp: 0,
    ...partial,
  }
}

function buildSeries(count: number, acceleration: MotionData["acceleration"], start = 0): MotionData[] {
  return Array.from({ length: count }, (_, i) =>
    sample({ acceleration: { ...acceleration }, timestamp: start + i * DT_MS }),
  )
}

describe("analyzeMotion", () => {
  it("returns zeros when there are fewer than 10 samples", () => {
    const result = analyzeMotion(buildSeries(5, { x: 1, y: 2, z: 9.8 }))
    expect(result).toEqual({ fluidityScore: 0, intensity: 0, directionChanges: 0, isActive: false })
  })

  it("scores smooth, constant motion as high fluidity", () => {
    const result = analyzeMotion(buildSeries(20, { x: 1, y: 2, z: 9.8 }))
    expect(result.fluidityScore).toBe(100)
    expect(result.directionChanges).toBe(0)
    expect(result.isActive).toBe(true)
  })

  it("scores jerky, alternating motion as low fluidity with direction changes", () => {
    const data = buildSeries(20, { x: 1, y: 2, z: 9.8 })
    // Alternate x between +40 and -40 every sample.
    data.forEach((d, i) => {
      d.acceleration.x = i % 2 === 0 ? 40 : -40
    })
    const result = analyzeMotion(data)
    expect(result.fluidityScore).toBe(0)
    expect(result.directionChanges).toBeGreaterThan(0)
    expect(result.intensity).toBeGreaterThan(0)
  })

  it("reports isActive=false for near-zero motion", () => {
    const result = analyzeMotion(buildSeries(20, { x: 0, y: 0, z: 0 }))
    expect(result.isActive).toBe(false)
  })
})

describe("pruneMotionData", () => {
  it("keeps only samples within the analysis window", () => {
    const data = buildSeries(120, { x: 1, y: 2, z: 9.8 }) // spans 2380 ms > 2000 ms window
    const now = data[data.length - 1].timestamp
    const pruned = pruneMotionData(data, now, ANALYSIS_WINDOW_MS)
    expect(pruned.length).toBeLessThan(data.length)
    expect(pruned.length).toBe(100) // strict < window: sample at exactly 2000 ms old drops
    for (const d of pruned) {
      expect(now - d.timestamp).toBeLessThan(ANALYSIS_WINDOW_MS)
    }
  })

  it("drops samples at or older than the window boundary", () => {
    const data = buildSeries(10, { x: 1, y: 2, z: 9.8 }, 1000) // timestamps 1000..1180
    const pruned = pruneMotionData(data, 3000, 2000)
    expect(pruned.length).toBe(9) // only timestamp > 1000 survives
    expect(pruned[0].timestamp).toBe(1020)
  })
})
