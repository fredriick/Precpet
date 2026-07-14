import { describe, it, expect } from "vitest"
import { getDailyTip } from "@/lib/daily-tips"
import type { Sport } from "@/lib/types"

const sports: Sport[] = ["soccer", "basketball", "tennis"]

describe("daily-tips", () => {
  it("returns a non-empty tip for every sport", () => {
    for (const sport of sports) {
      const tip = getDailyTip(sport)
      expect(typeof tip).toBe("string")
      expect(tip.length).toBeGreaterThan(0)
    }
  })

  it("is deterministic for the same sport and date", () => {
    const date = new Date("2026-03-15T10:00:00")
    for (const sport of sports) {
      expect(getDailyTip(sport, date)).toBe(getDailyTip(sport, date))
    }
  })

  it("rotates across the year (more than one distinct tip)", () => {
    const seen = new Set<string>()
    for (let day = 0; day < 60; day++) {
      const date = new Date(2026, 0, 1 + day)
      seen.add(getDailyTip("soccer", date))
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it("includes sport-specific tips in the rotation", () => {
    const soccerTips = new Set<string>()
    const tennisTips = new Set<string>()
    for (let day = 0; day < 365; day++) {
      const date = new Date(2026, 0, 1 + day)
      soccerTips.add(getDailyTip("soccer", date))
      tennisTips.add(getDailyTip("tennis", date))
    }
    // Different sports should surface at least one distinct tip
    const onlySoccer = [...soccerTips].filter((t) => !tennisTips.has(t))
    expect(onlySoccer.length).toBeGreaterThan(0)
  })
})
