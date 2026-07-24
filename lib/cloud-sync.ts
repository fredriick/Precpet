"use client"

import { getSupabaseBrowser } from "@/lib/supabase-browser"
import type { UserStats, PracticeSession, ProgramProgress, Sport } from "@/lib/types"
import type { UserSettings } from "@/lib/storage"

interface AchievementRecord {
  id: string
  unlockedAt: string
}

function toAchievementRecords(ids: string[]): AchievementRecord[] {
  const now = new Date().toISOString()
  return ids.map((id) => ({ id, unlockedAt: now }))
}

function fromAchievementRecords(records: unknown): string[] {
  if (!Array.isArray(records)) return []
  return records
    .map((r) => (typeof r === "string" ? r : (r as AchievementRecord)?.id))
    .filter((id): id is string => typeof id === "string")
}

export interface CloudSnapshot {
  userStats: UserStats
  sessions: PracticeSession[]
  settings: UserSettings
  programProgress: Record<string, ProgramProgress>
  generatedVideos: Record<string, string>
}

export async function loadCloudSnapshot(userId: string): Promise<CloudSnapshot | null> {
  const supabase = getSupabaseBrowser()
  const [{ data: stats }, { data: sessions }, { data: settings }, { data: programs }, { data: videos }] =
    await Promise.all([
      supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("practice_sessions").select("*").eq("user_id", userId).order("start_time", { ascending: false }),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("program_progress").select("*").eq("user_id", userId),
      supabase.from("generated_videos").select("*").eq("user_id", userId),
    ])

  if (!stats && !settings) return null

  const programMap: Record<string, ProgramProgress> = {}
  for (const p of programs ?? []) {
    const { user_id, ...rest } = p as Record<string, unknown>
    programMap[p.program_id as string] = rest as unknown as ProgramProgress
  }

  const videoMap: Record<string, string> = {}
  for (const v of videos ?? []) {
    videoMap[(v as Record<string, unknown>).skill_id as string] = (v as Record<string, unknown>).video_url as string
  }

  const baseStats: UserStats = {
    matchesPlayed: 0,
    ballLossesUnderPressure: 0,
    successfulDribbles: 0,
    passAccuracy: 0,
    shotsOnTarget: 0,
    avgFluidityScore: 0,
    practiceMinutes: 0,
    skillsLearned: [],
    bookmarkedSkills: [],
    achievements: [],
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    isPro: false,
  }

  const mergedStats: UserStats = stats
    ? {
        matchesPlayed: (stats as Record<string, unknown>).matches_played as number,
        ballLossesUnderPressure: (stats as Record<string, unknown>).ball_losses_under_pressure as number,
        successfulDribbles: (stats as Record<string, unknown>).successful_dribbles as number,
        passAccuracy: (stats as Record<string, unknown>).pass_accuracy as number,
        shotsOnTarget: (stats as Record<string, unknown>).shots_on_target as number,
        avgFluidityScore: (stats as Record<string, unknown>).avg_fluidity_score as number,
        practiceMinutes: (stats as Record<string, unknown>).practice_minutes as number,
        skillsLearned: ((stats as Record<string, unknown>).skills_learned as string[]) ?? [],
        bookmarkedSkills: ((stats as Record<string, unknown>).bookmarked_skills as string[]) ?? [],
        achievements: fromAchievementRecords((stats as Record<string, unknown>).achievements),
        currentStreak: (stats as Record<string, unknown>).current_streak as number,
        longestStreak: (stats as Record<string, unknown>).longest_streak as number,
        lastPracticeDate: ((stats as Record<string, unknown>).last_practice_date as string) ?? null,
        isPro: ((stats as Record<string, unknown>).is_pro as boolean) ?? false,
      }
    : baseStats

  const baseSettings: UserSettings = {
    hapticFeedback: true,
    soundEffects: true,
    practiceReminders: true,
    preferredDifficulty: "all",
    preferredSport: "soccer",
    preferredSports: ["soccer"],
    activeSport: "soccer",
    theme: "dark",
    weeklyGoalMinutes: 60,
  }

  const mergedSettings: UserSettings = settings
    ? {
        hapticFeedback: (settings as Record<string, unknown>).haptic_feedback as boolean,
        soundEffects: (settings as Record<string, unknown>).sound_effects as boolean,
        practiceReminders: (settings as Record<string, unknown>).practice_reminders as boolean,
        preferredDifficulty: (settings as Record<string, unknown>).preferred_difficulty as UserSettings["preferredDifficulty"],
        preferredSport: (settings as Record<string, unknown>).preferred_sport as UserSettings["preferredSport"],
        preferredSports: ((settings as Record<string, unknown>).preferred_sports as UserSettings["preferredSports"]) || [(settings as Record<string, unknown>).preferred_sport as Sport] || ["soccer"],
        activeSport: ((settings as Record<string, unknown>).active_sport as Sport) || ((settings as Record<string, unknown>).preferred_sport as Sport) || "soccer",
        theme: (settings as Record<string, unknown>).theme as UserSettings["theme"],
        weeklyGoalMinutes: (settings as Record<string, unknown>).weekly_goal_minutes as number,
      }
    : baseSettings

  const mappedSessions: PracticeSession[] = (sessions ?? []).map((s) => {
    const row = s as Record<string, unknown>
    return {
      id: row.id as string,
      skillId: row.skill_id as string,
      sport: row.sport as PracticeSession["sport"],
      startTime: row.start_time as string,
      endTime: (row.end_time as string) ?? undefined,
      fluidityScores: (row.fluidity_scores as number[]) ?? [],
      completed: (row.completed as boolean) ?? false,
      notes: (row.notes as string) ?? undefined,
    }
  })

  return {
    userStats: mergedStats,
    sessions: mappedSessions,
    settings: mergedSettings,
    programProgress: programMap,
    generatedVideos: videoMap,
  }
}

export async function saveCloudStats(userId: string, stats: UserStats): Promise<void> {
  const supabase = getSupabaseBrowser()
  await supabase.from("user_stats").upsert({
    user_id: userId,
    matches_played: stats.matchesPlayed,
    ball_losses_under_pressure: stats.ballLossesUnderPressure,
    successful_dribbles: stats.successfulDribbles,
    pass_accuracy: stats.passAccuracy,
    shots_on_target: stats.shotsOnTarget,
    avg_fluidity_score: stats.avgFluidityScore,
    practice_minutes: stats.practiceMinutes,
    skills_learned: stats.skillsLearned,
    bookmarked_skills: stats.bookmarkedSkills,
    achievements: toAchievementRecords(stats.achievements),
    current_streak: stats.currentStreak,
    longest_streak: stats.longestStreak,
    last_practice_date: stats.lastPracticeDate,
    is_pro: stats.isPro,
    updated_at: new Date().toISOString(),
  })
}

export async function saveCloudSettings(userId: string, settings: UserSettings): Promise<void> {
  const supabase = getSupabaseBrowser()
  await supabase.from("user_settings").upsert({
    user_id: userId,
    haptic_feedback: settings.hapticFeedback,
    sound_effects: settings.soundEffects,
    practice_reminders: settings.practiceReminders,
    preferred_difficulty: settings.preferredDifficulty,
    preferred_sport: settings.preferredSport,
    preferred_sports: settings.preferredSports,
    active_sport: settings.activeSport,
    theme: settings.theme,
    weekly_goal_minutes: settings.weeklyGoalMinutes,
    updated_at: new Date().toISOString(),
  })
}

export async function saveCloudSession(userId: string, session: PracticeSession): Promise<void> {
  const supabase = getSupabaseBrowser()
  await supabase.from("practice_sessions").upsert({
    user_id: userId,
    id: session.id,
    skill_id: session.skillId,
    sport: session.sport,
    start_time: session.startTime,
    end_time: session.endTime ?? null,
    fluidity_scores: session.fluidityScores,
    completed: session.completed,
    notes: session.notes ?? null,
  })
}

export async function saveCloudProgramProgress(
  userId: string,
  programId: string,
  progress: ProgramProgress,
): Promise<void> {
  const supabase = getSupabaseBrowser()
  await supabase.from("program_progress").upsert({
    user_id: userId,
    program_id: programId,
    completed_steps: progress.completedSteps,
    total_steps: progress.totalSteps,
    started_at: progress.startedAt ?? null,
    completed_at: progress.completedAt ?? null,
    last_practiced: progress.lastPracticed ?? null,
  })
}

export async function saveCloudVideo(userId: string, skillId: string, videoUrl: string): Promise<void> {
  const supabase = getSupabaseBrowser()
  await supabase.from("generated_videos").upsert({
    user_id: userId,
    skill_id: skillId,
    video_url: videoUrl,
  })
}
