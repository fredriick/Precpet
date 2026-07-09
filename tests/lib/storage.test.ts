import { describe, it, expect, beforeEach, vi } from "vitest"
import type { UserStats, PracticeSession } from "@/lib/types"

function createMockStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() {
      return store.size
    },
    key: vi.fn((index: number) => [...store.keys()][index] ?? null),
  })
  vi.stubGlobal("crypto", {
    randomUUID: () => "test-uuid-xxxx",
  })
  return store
}

describe("storage", () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = createMockStorage()
  })

  describe("getUserStats / saveUserStats", async () => {
    const { getUserStats, saveUserStats } = await import("@/lib/storage")

    it("returns default stats when nothing stored", () => {
      const stats = getUserStats()
      expect(stats.matchesPlayed).toBe(0)
      expect(stats.skillsLearned).toEqual([])
      expect(stats.achievements).toEqual([])
      expect(stats.currentStreak).toBe(0)
    })

    it("persists and retrieves stats", () => {
      saveUserStats({ ...getUserStats(), matchesPlayed: 5 })
      expect(getUserStats().matchesPlayed).toBe(5)
    })

    it("merges with defaults for missing fields", () => {
      store.set("precept_user_stats", JSON.stringify({ matchesPlayed: 3 }))
      const stats = getUserStats()
      expect(stats.matchesPlayed).toBe(3)
      expect(stats.skillsLearned).toEqual([])
    })
  })

  describe("getPracticeSessions / savePracticeSession", async () => {
    const { getPracticeSessions, savePracticeSession } = await import("@/lib/storage")

    it("returns empty array when no sessions", () => {
      expect(getPracticeSessions()).toEqual([])
    })

    it("prepends new sessions", () => {
      const s1: PracticeSession = {
        id: "1", skillId: "a", sport: "soccer", startTime: new Date().toISOString(),
        fluidityScores: [], completed: false,
      }
      const s2: PracticeSession = {
        id: "2", skillId: "b", sport: "soccer", startTime: new Date().toISOString(),
        fluidityScores: [], completed: false,
      }
      savePracticeSession(s1)
      savePracticeSession(s2)
      const sessions = getPracticeSessions()
      expect(sessions).toHaveLength(2)
      expect(sessions[0].id).toBe("2")
      expect(sessions[1].id).toBe("1")
    })

    it("updates existing session by id", () => {
      const s1: PracticeSession = {
        id: "1", skillId: "a", sport: "soccer", startTime: new Date().toISOString(),
        fluidityScores: [], completed: false,
      }
      savePracticeSession(s1)
      s1.completed = true
      savePracticeSession(s1)
      expect(getPracticeSessions()).toHaveLength(1)
      expect(getPracticeSessions()[0].completed).toBe(true)
    })

    it("limits to 50 sessions", () => {
      for (let i = 0; i < 60; i++) {
        savePracticeSession({
          id: `${i}`, skillId: "a", sport: "soccer", startTime: new Date().toISOString(),
          fluidityScores: [], completed: false,
        })
      }
      expect(getPracticeSessions()).toHaveLength(50)
    })
  })

  describe("onboarding", async () => {
    const { hasCompletedOnboarding, completeOnboarding } = await import("@/lib/storage")

    it("returns false initially", () => {
      expect(hasCompletedOnboarding()).toBe(false)
    })

    it("returns true after completing", () => {
      completeOnboarding()
      expect(hasCompletedOnboarding()).toBe(true)
    })
  })

  describe("bookmarks", async () => {
    const { toggleBookmark, isSkillBookmarked } = await import("@/lib/storage")

    it("toggles bookmark on and off", () => {
      toggleBookmark("skill-1")
      expect(isSkillBookmarked("skill-1")).toBe(true)
      toggleBookmark("skill-1")
      expect(isSkillBookmarked("skill-1")).toBe(false)
    })
  })

  describe("streak management", async () => {
    const { updateStreak, getStreakStatus } = await import("@/lib/storage")

    it("starts streak on first practice", () => {
      updateStreak()
      const status = getStreakStatus()
      expect(status.current).toBe(1)
      expect(status.longest).toBe(1)
    })

    it("increments streak on consecutive day", () => {
      const now = new Date()
      store.set("precept_user_stats", JSON.stringify({
        matchesPlayed: 0, ballLossesUnderPressure: 0, successfulDribbles: 0,
        passAccuracy: 0, shotsOnTarget: 0, avgFluidityScore: 0, practiceMinutes: 0,
        skillsLearned: [], bookmarkedSkills: [], achievements: [],
        currentStreak: 1, longestStreak: 1,
        lastPracticeDate: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()-1).padStart(2,"0")}`,
      }))
      updateStreak()
      const status = getStreakStatus()
      expect(status.current).toBe(2)
      expect(status.longest).toBe(2)
    })
  })

  describe("export / import", async () => {
    const { exportUserData, importUserData, getUserStats, saveUserStats, getPracticeSessions } = await import("@/lib/storage")

    it("exports and imports data successfully", () => {
      saveUserStats({ ...getUserStats(), matchesPlayed: 10 })
      const exported = exportUserData()
      store.clear()
      expect(getUserStats().matchesPlayed).toBe(0)
      const result = importUserData(exported)
      expect(result.success).toBe(true)
      expect(getUserStats().matchesPlayed).toBe(10)
    })

    it("returns error for invalid JSON", () => {
      const result = importUserData("not json")
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe("clearAllData", async () => {
    const { clearAllData, getUserStats } = await import("@/lib/storage")

    it("clears all precept keys and auth data", () => {
      store.set("precept_user_stats", JSON.stringify({ matchesPlayed: 5 }))
      store.set("precept_sessions", "[]")
      store.set("precept_auth_user", JSON.stringify({ email: "test" }))
      store.set("precept_session", "abc123")
      store.set("precept_cred_test@test.com", JSON.stringify({ password: "123" }))
      clearAllData()
      expect(getUserStats().matchesPlayed).toBe(0)
      expect(store.size).toBe(0)
    })
  })

  describe("completePracticeSession", async () => {
    const { completePracticeSession, getUserStats, getPracticeSessions } = await import("@/lib/storage")

    it("completes a session and updates stats", () => {
      const session: PracticeSession = {
        id: "s1", skillId: "cruyff-turn", sport: "soccer",
        startTime: new Date(Date.now() - 600000).toISOString(),
        fluidityScores: [], completed: false,
      }
      const { session: completed, stats } = completePracticeSession(session, [70, 80, 75])
      expect(completed.completed).toBe(true)
      expect(completed.fluidityScores).toEqual([70, 80, 75])
      expect(stats.practiceMinutes).toBeGreaterThanOrEqual(9)
    })

    it("marks skill as learned after 3 sessions with avg > 70", () => {
      for (let i = 0; i < 3; i++) {
        const session: PracticeSession = {
          id: `s${i}`, skillId: "step-over", sport: "soccer",
          startTime: new Date(Date.now() - 600000).toISOString(),
          fluidityScores: [], completed: false,
        }
        completePracticeSession(session, [75, 80, 85])
      }
      const stats = getUserStats()
      expect(stats.skillsLearned).toContain("step-over")
    })
  })
})
