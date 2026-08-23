import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  loadCloudSnapshot,
  saveCloudStats,
  saveCloudSettings,
  saveCloudSession,
  saveCloudProgramProgress,
  saveCloudVideo,
} from "@/lib/cloud-sync"
import type { UserStats, PracticeSession, ProgramProgress } from "@/lib/types"
import type { UserSettings } from "@/lib/storage"

const h = vi.hoisted(() => {
  const tableData: Record<string, unknown> = {}
  const upserts: Record<string, ReturnType<typeof vi.fn>> = {}
  return { tableData, upserts }
})

vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowser: () => ({
    from(table: string) {
      if (!h.upserts[table]) h.upserts[table] = vi.fn(() => Promise.resolve({ error: null }))
      return {
        select: () => ({
          eq: () => {
            const result = Promise.resolve({ data: h.tableData[table] ?? null })
            return {
              then: result.then.bind(result),
              order: () => result,
              maybeSingle: () => result,
            }
          },
        }),
        upsert: h.upserts[table],
      }
    },
  }),
}))

beforeEach(() => {
  for (const key of Object.keys(h.tableData)) delete h.tableData[key]
  for (const key of Object.keys(h.upserts)) delete h.upserts[key]
})

const statsRow = {
  user_id: "u1",
  matches_played: 5,
  ball_losses_under_pressure: 2,
  successful_dribbles: 7,
  pass_accuracy: 80,
  shots_on_target: 4,
  avg_fluidity_score: 72.5,
  practice_minutes: 120,
  skills_learned: ["step-over"],
  bookmarked_skills: ["volley"],
  achievements: [{ id: "first-session", unlockedAt: "2026-01-01T00:00:00.000Z" }],
  current_streak: 3,
  longest_streak: 9,
  last_practice_date: "2026-08-20",
  is_pro: true,
}

describe("loadCloudSnapshot", () => {
  it("returns null when there is no stats or settings row", async () => {
    expect(await loadCloudSnapshot("u1")).toBeNull()
  })

  it("maps a full snapshot from snake_case rows", async () => {
    h.tableData.user_stats = statsRow
    h.tableData.user_settings = {
      user_id: "u1",
      haptic_feedback: false,
      sound_effects: false,
      practice_reminders: false,
      preferred_difficulty: "advanced",
      preferred_sport: "tennis",
      preferred_sports: ["tennis", "soccer"],
      active_sport: "tennis",
      theme: "light",
      weekly_goal_minutes: 90,
    }
    h.tableData.practice_sessions = [
      {
        id: "s1",
        skill_id: "volley",
        sport: "soccer",
        start_time: "2026-08-01T10:00:00Z",
        end_time: "2026-08-01T10:05:00Z",
        fluidity_scores: [80, 90],
        completed: true,
        notes: "good",
      },
      {
        id: "s2",
        skill_id: "jockey",
        sport: "soccer",
        start_time: "2026-08-02T10:00:00Z",
        end_time: null,
        fluidity_scores: null,
        completed: null,
        notes: null,
      },
    ]
    h.tableData.program_progress = [
      {
        user_id: "u1",
        program_id: "bb-finishing",
        completed_steps: 2,
        total_steps: 4,
        started_at: "2026-07-01T00:00:00Z",
        completed_at: null,
        last_practiced: null,
      },
    ]
    h.tableData.generated_videos = [
      { user_id: "u1", skill_id: "volley", video_url: "https://x/v.mp4" },
    ]

    const snap = await loadCloudSnapshot("u1")
    expect(snap).not.toBeNull()

    expect(snap!.userStats).toMatchObject({
      matchesPlayed: 5,
      ballLossesUnderPressure: 2,
      successfulDribbles: 7,
      passAccuracy: 80,
      shotsOnTarget: 4,
      avgFluidityScore: 72.5,
      practiceMinutes: 120,
      skillsLearned: ["step-over"],
      bookmarkedSkills: ["volley"],
      achievements: ["first-session"],
      currentStreak: 3,
      longestStreak: 9,
      lastPracticeDate: "2026-08-20",
      isPro: true,
    })

    expect(snap!.settings).toEqual({
      hapticFeedback: false,
      soundEffects: false,
      practiceReminders: false,
      preferredDifficulty: "advanced",
      preferredSport: "tennis",
      preferredSports: ["tennis", "soccer"],
      activeSport: "tennis",
      theme: "light",
      weeklyGoalMinutes: 90,
      motionSource: "phone",
      language: "en",
    })

    expect(snap!.sessions[0]).toEqual({
      id: "s1",
      skillId: "volley",
      sport: "soccer",
      startTime: "2026-08-01T10:00:00Z",
      endTime: "2026-08-01T10:05:00Z",
      fluidityScores: [80, 90],
      completed: true,
      notes: "good",
    })
    expect(snap!.sessions[1]).toEqual({
      id: "s2",
      skillId: "jockey",
      sport: "soccer",
      startTime: "2026-08-02T10:00:00Z",
      endTime: undefined,
      fluidityScores: [],
      completed: false,
      notes: undefined,
    })

    expect(snap!.programProgress["bb-finishing"]).toMatchObject({ completedSteps: 2, totalSteps: 4 })
    expect(snap!.programProgress["bb-finishing"]).not.toHaveProperty("user_id")
    expect(snap!.generatedVideos).toEqual({ volley: "https://x/v.mp4" })
  })

  it("accepts legacy achievement strings and falls back to base settings", async () => {
    h.tableData.user_stats = { user_id: "u1", achievements: ["legacy-id", 42, null] }
    const snap = await loadCloudSnapshot("u1")
    expect(snap!.userStats.achievements).toEqual(["legacy-id"])
    expect(snap!.settings).toMatchObject({ hapticFeedback: true, preferredSport: "soccer", language: "en" })
  })

  it("settings fall back to preferred sport lists when arrays are empty", async () => {
    h.tableData.user_settings = {
      user_id: "u1",
      preferred_sport: "basketball",
      preferred_sports: [],
      active_sport: "",
    }
    const snap = await loadCloudSnapshot("u1")
    expect(snap!.settings.preferredSports).toEqual(["basketball"])
    expect(snap!.settings.activeSport).toBe("basketball")
  })
})

describe("save functions", () => {
  it("saveCloudStats converts achievements to records and camelCase to snake_case", async () => {
    const stats: UserStats = {
      matchesPlayed: 1,
      ballLossesUnderPressure: 0,
      successfulDribbles: 2,
      passAccuracy: 50,
      shotsOnTarget: 1,
      avgFluidityScore: 66,
      practiceMinutes: 15,
      skillsLearned: ["step-over"],
      bookmarkedSkills: [],
      achievements: ["a1", "b2"],
      currentStreak: 2,
      longestStreak: 5,
      lastPracticeDate: "2026-08-21",
      isPro: false,
    }
    await saveCloudStats("u1", stats)
    expect(h.upserts.user_stats).toHaveBeenCalledTimes(1)
    const row = h.upserts.user_stats.mock.calls[0][0] as Record<string, unknown>
    expect(row.user_id).toBe("u1")
    expect(row.matches_played).toBe(1)
    expect(row.avg_fluidity_score).toBe(66)
    expect(row.skills_learned).toEqual(["step-over"])
    expect(row.current_streak).toBe(2)
    expect(row.last_practice_date).toBe("2026-08-21")
    expect(row.achievements).toHaveLength(2)
    for (const rec of row.achievements as { id: string; unlockedAt: string }[]) {
      expect(rec.id).toMatch(/^(a1|b2)$/)
      expect(rec.unlockedAt).toBeTruthy()
    }
  })

  it("saveCloudSettings writes snake_case keys", async () => {
    const settings: UserSettings = {
      hapticFeedback: false,
      soundEffects: true,
      practiceReminders: false,
      preferredDifficulty: "beginner",
      preferredSport: "tennis",
      preferredSports: ["tennis"],
      activeSport: "tennis",
      theme: "dark",
      weeklyGoalMinutes: 45,
      motionSource: "wearable",
      language: "es",
    }
    await saveCloudSettings("u1", settings)
    const row = h.upserts.user_settings.mock.calls[0][0] as Record<string, unknown>
    expect(row.haptic_feedback).toBe(false)
    expect(row.preferred_difficulty).toBe("beginner")
    expect(row.active_sport).toBe("tennis")
    expect(row.weekly_goal_minutes).toBe(45)
    expect(row.updated_at).toBeTruthy()
  })

  it("saveCloudSession maps nulls correctly", async () => {
    const session: PracticeSession = {
      id: "s9",
      skillId: "volley",
      sport: "soccer",
      startTime: "2026-08-22T09:00:00Z",
      endTime: undefined,
      fluidityScores: [70],
      completed: true,
      notes: undefined,
    }
    await saveCloudSession("u1", session)
    const row = h.upserts.practice_sessions.mock.calls[0][0] as Record<string, unknown>
    expect(row.end_time).toBeNull()
    expect(row.notes).toBeNull()
    expect(row.skill_id).toBe("volley")
    expect(row.fluidity_scores).toEqual([70])
  })

  it("saveCloudProgramProgress and saveCloudVideo write keyed rows", async () => {
    const progress: ProgramProgress = {
      completedSteps: 3,
      totalSteps: 5,
      startedAt: "2026-08-01T00:00:00Z",
      completedAt: undefined,
      lastPracticed: "2026-08-20T00:00:00Z",
    }
    await saveCloudProgramProgress("u1", "tn-net-play", progress)
    const prow = h.upserts.program_progress.mock.calls[0][0] as Record<string, unknown>
    expect(prow.program_id).toBe("tn-net-play")
    expect(prow.completed_steps).toBe(3)
    expect(prow.completed_at).toBeNull()

    await saveCloudVideo("u1", "t-volley", "https://x/v.mp4")
    const vrow = h.upserts.generated_videos.mock.calls[0][0] as Record<string, unknown>
    expect(vrow.skill_id).toBe("t-volley")
    expect(vrow.video_url).toBe("https://x/v.mp4")
  })
})
