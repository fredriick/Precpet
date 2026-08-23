import { describe, it, expect } from "vitest"
import { rankLeaderboard, type LeaderboardRow } from "@/lib/leaderboard-rank"

const rows: LeaderboardRow[] = [
  { session_token: "a", name: "Alice", minutes: 30 },
  { session_token: "b", name: "Bob", minutes: 120 },
  { session_token: "c", name: "", minutes: 60 },
  { session_token: "d", name: "Dana", minutes: 10 },
]

describe("rankLeaderboard", () => {
  it("sorts by minutes descending and assigns 1-based ranks", () => {
    const { top } = rankLeaderboard(rows, null)
    expect(top.map((e) => e.minutes)).toEqual([120, 60, 30, 10])
    expect(top.map((e) => e.rank)).toEqual([1, 2, 3, 4])
  })

  it("marks the current user's entry", () => {
    const { user } = rankLeaderboard(rows, "a")
    expect(user?.id).toBe("a")
    expect(user?.isUser).toBe(true)
    expect(top1IsUser(rankLeaderboard(rows, "b"))).toBe(true)
  })

  it("returns null user when token is absent or matches nobody", () => {
    expect(rankLeaderboard(rows, null).user).toBeNull()
    expect(rankLeaderboard(rows, "zzz").user).toBeNull()
  })

  it("slices top N (default 5)", () => {
    const many: LeaderboardRow[] = Array.from({ length: 12 }, (_, i) => ({
      session_token: `t${i}`,
      name: `P${i}`,
      minutes: 100 - i,
    }))
    expect(rankLeaderboard(many, null).top).toHaveLength(5)
    expect(rankLeaderboard(many, null, 3).top).toHaveLength(3)
    expect(rankLeaderboard(many, "t9", 3).user?.rank).toBe(10)
  })

  it("names anonymous rows without a name", () => {
    const { top } = rankLeaderboard(rows, null)
    expect(top.find((e) => e.id === "c")?.name).toBe("Anonymous")
  })

  it("handles empty input", () => {
    const result = rankLeaderboard([], "x")
    expect(result.top).toEqual([])
    expect(result.user).toBeNull()
    expect(result.configured).toBe(true)
  })

  it("does not mutate the input array", () => {
    const original = [...rows]
    rankLeaderboard(rows, null)
    expect(rows).toEqual(original)
  })
})

function top1IsUser(r: { top: { isUser: boolean }[] }): boolean {
  return r.top.some((e) => e.isUser)
}
