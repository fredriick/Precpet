import { describe, it, expect } from "vitest"
import { getLeaderboard } from "@/lib/leaderboard"

describe("leaderboard", () => {
  it("always includes the user entry flagged isUser", () => {
    const { user } = getLeaderboard(120, "Tester")
    expect(user.isUser).toBe(true)
    expect(user.name).toBe("Tester")
    expect(user.minutes).toBe(120)
    expect(user.rank).toBeGreaterThanOrEqual(1)
  })

  it("returns up to 5 top entries in descending minutes order", () => {
    const { top } = getLeaderboard(50, "Tester")
    expect(top.length).toBeLessThanOrEqual(5)
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].minutes).toBeGreaterThanOrEqual(top[i].minutes)
    }
  })

  it("assigns sequential ranks starting at 1", () => {
    const { top } = getLeaderboard(50, "Tester")
    top.forEach((entry, i) => {
      expect(entry.rank).toBe(i + 1)
    })
  })

  it("ranks a high-minute user near the top", () => {
    const { user } = getLeaderboard(100000, "Champion")
    expect(user.rank).toBe(1)
  })

  it("ranks a zero-minute user below high performers", () => {
    const { user } = getLeaderboard(0, "Beginner")
    expect(user.rank).toBeGreaterThan(1)
  })

  it("falls back to a default name when none is given", () => {
    const { user } = getLeaderboard(30, "")
    expect(user.name).toBe("You")
  })

  it("is stable within the same week", () => {
    const a = getLeaderboard(80, "Tester")
    const b = getLeaderboard(80, "Tester")
    expect(a.top.map((e) => e.minutes)).toEqual(b.top.map((e) => e.minutes))
    expect(a.user.rank).toBe(b.user.rank)
  })
})
