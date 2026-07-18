import { describe, it, expect } from "vitest"
import { rankLeaderboard, type LeaderboardRow } from "@/lib/leaderboard-rank"
import { weeklyMinutes } from "@/lib/leaderboard"
import type { PracticeSession } from "@/lib/types"

function makeSession(startDaysAgo: number, durationMin: number): PracticeSession {
  const start = new Date()
  start.setDate(start.getDate() - startDaysAgo)
  start.setMinutes(start.getMinutes() - durationMin)
  const end = new Date()
  end.setDate(end.getDate() - startDaysAgo)
  return {
    id: `s-${startDaysAgo}-${durationMin}`,
    skillId: "test",
    sport: "soccer",
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    fluidityScores: [50],
    completed: true,
  }
}

const rows: LeaderboardRow[] = [
  { session_token: "a", name: "Alex", minutes: 200 },
  { session_token: "b", name: "Bex", minutes: 150 },
  { session_token: "me", name: "Tester", minutes: 120 },
  { session_token: "c", name: "Cam", minutes: 90 },
  { session_token: "d", name: "Dee", minutes: 60 },
  { session_token: "e", name: "Eve", minutes: 30 },
]

describe("rankLeaderboard", () => {
  it("flags the user entry with isUser", () => {
    const { user } = rankLeaderboard(rows, "me")
    expect(user?.isUser).toBe(true)
    expect(user?.name).toBe("Tester")
    expect(user?.minutes).toBe(120)
    expect(user?.rank).toBe(3)
  })

  it("returns up to 5 top entries in descending minutes order", () => {
    const { top } = rankLeaderboard(rows, "me")
    expect(top.length).toBe(5)
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].minutes).toBeGreaterThanOrEqual(top[i].minutes)
    }
  })

  it("assigns sequential ranks starting at 1", () => {
    const { top } = rankLeaderboard(rows, "me")
    top.forEach((entry, i) => {
      expect(entry.rank).toBe(i + 1)
    })
  })

  it("ranks a high-minute user at the top", () => {
    const { user } = rankLeaderboard(rows, "a")
    expect(user?.rank).toBe(1)
  })

  it("ranks a low-minute user below high performers", () => {
    const { user } = rankLeaderboard(rows, "e")
    expect(user?.rank).toBeGreaterThan(1)
  })

  it("falls back to a default name when none is given", () => {
    const { top } = rankLeaderboard([{ session_token: "x", name: "", minutes: 10 }], "x")
    expect(top[0].name).toBe("Anonymous")
  })

  it("returns a null user when the token is not present", () => {
    const { user } = rankLeaderboard(rows, null)
    expect(user).toBeNull()
  })

  it("marks configured as true for ranked results", () => {
    expect(rankLeaderboard(rows, "me").configured).toBe(true)
  })
})

describe("weeklyMinutes", () => {
  it("sums only sessions within the last 7 days", () => {
    const sessions = [
      makeSession(0, 30),
      makeSession(3, 15),
      makeSession(6, 45),
      makeSession(10, 60),
      makeSession(30, 60),
    ]
    // 30 + 15 + 45 = 90; older sessions excluded
    expect(weeklyMinutes(sessions)).toBe(90)
  })

  it("returns 0 when there are no sessions", () => {
    expect(weeklyMinutes([])).toBe(0)
  })

  it("ignores sessions without an end time", () => {
    const s = makeSession(1, 20)
    delete s.endTime
    expect(weeklyMinutes([s])).toBe(0)
  })
})
