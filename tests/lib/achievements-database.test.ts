import { describe, it, expect } from "vitest"
import {
  achievements,
  getAchievementById,
  checkAchievementUnlock,
} from "@/lib/achievements-database"

const emptyStats = {
  practiceMinutes: 0,
  skillsLearned: [] as string[],
  bookmarkedSkills: [] as string[],
  currentStreak: 0,
  achievements: [] as string[],
}

const emptySessions: { completed: boolean; fluidityScores: number[]; startTime: string }[] = []

describe("achievements-database", () => {
  it("has all 10 achievements", () => {
    expect(achievements).toHaveLength(10)
  })

  it("each achievement has required fields", () => {
    for (const a of achievements) {
      expect(a.id).toBeTruthy()
      expect(a.name).toBeTruthy()
      expect(a.description).toBeTruthy()
      expect(a.icon).toBeTruthy()
      expect(a.category).toMatch(/^(practice|streak|skill|performance)$/)
    }
  })

  describe("getAchievementById", () => {
    it("returns the correct achievement", () => {
      expect(getAchievementById("first-steps")?.name).toBe("First Steps")
    })

    it("returns undefined for unknown id", () => {
      expect(getAchievementById("nonexistent")).toBeUndefined()
    })
  })

  describe("checkAchievementUnlock", () => {
    it("first-steps unlocks after 1 completed session", () => {
      const sessions = [{ completed: true, fluidityScores: [50], startTime: new Date().toISOString() }]
      expect(checkAchievementUnlock("first-steps", emptyStats, sessions)).toBe(true)
    })

    it("first-steps does not unlock with 0 sessions", () => {
      expect(checkAchievementUnlock("first-steps", emptyStats, emptySessions)).toBe(false)
    })

    it("on-fire unlocks at 3-day streak", () => {
      const stats = { ...emptyStats, currentStreak: 3 }
      expect(checkAchievementUnlock("on-fire", stats, emptySessions)).toBe(true)
    })

    it("on-fire does not unlock at 2-day streak", () => {
      const stats = { ...emptyStats, currentStreak: 2 }
      expect(checkAchievementUnlock("on-fire", stats, emptySessions)).toBe(false)
    })

    it("unstoppable unlocks at 7-day streak", () => {
      const stats = { ...emptyStats, currentStreak: 7 }
      expect(checkAchievementUnlock("unstoppable", stats, emptySessions)).toBe(true)
    })

    it("skill-master requires all skills learned", () => {
      const stats = { ...emptyStats, skillsLearned: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12", "s13", "s14", "s15"] }
      expect(checkAchievementUnlock("skill-master", stats, emptySessions)).toBe(true)
    })

    it("knowledge-seeker unlocks with 3+ bookmarks", () => {
      const stats = { ...emptyStats, bookmarkedSkills: ["a", "b", "c"] }
      expect(checkAchievementUnlock("knowledge-seeker", stats, emptySessions)).toBe(true)
    })

    it("marathon unlocks at 60+ practice minutes", () => {
      const stats = { ...emptyStats, practiceMinutes: 60 }
      expect(checkAchievementUnlock("marathon", stats, emptySessions)).toBe(true)
    })

    it("graduate unlocks at 10+ completed sessions", () => {
      const sessions = Array.from({ length: 10 }, (_, i) => ({
        completed: true,
        fluidityScores: [50],
        startTime: new Date(Date.now() - i * 86400000).toISOString(),
      }))
      expect(checkAchievementUnlock("graduate", emptyStats, sessions)).toBe(true)
    })

    it("fluidity-pro requires avg >= 85 in a session", () => {
      const sessions = [{ completed: true, fluidityScores: [80, 90, 85], startTime: new Date().toISOString() }]
      expect(checkAchievementUnlock("fluidity-pro", emptyStats, sessions)).toBe(true)
    })

    it("fluidity-pro not unlocked for low scores", () => {
      const sessions = [{ completed: true, fluidityScores: [50, 60], startTime: new Date().toISOString() }]
      expect(checkAchievementUnlock("fluidity-pro", emptyStats, sessions)).toBe(false)
    })

    it("perfectionist requires avg >= 95 in a session", () => {
      const sessions = [{ completed: true, fluidityScores: [95, 96], startTime: new Date().toISOString() }]
      expect(checkAchievementUnlock("perfectionist", emptyStats, sessions)).toBe(true)
    })

    it("already unlocked achievements return false", () => {
      const stats = { ...emptyStats, achievements: ["first-steps"] }
      const sessions = [{ completed: true, fluidityScores: [50], startTime: new Date().toISOString() }]
      expect(checkAchievementUnlock("first-steps", stats, sessions)).toBe(false)
    })
  })
})
