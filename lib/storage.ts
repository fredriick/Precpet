// Local storage utilities for persisting user data

import type { UserStats, PracticeSession, ProgramProgress, Sport } from "./types"

const STORAGE_KEYS = {
  userStats: "precept_user_stats",
  sessions: "precept_sessions",
  onboarded: "precept_onboarded",
  generatedVideos: "precept_videos",
  settings: "precept_settings",
  bookmarks: "precept_bookmarks",
  achievements: "precept_achievements",
  programs: "precept_programs",
} as const

// Default user stats for new users
const defaultUserStats: UserStats = {
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
}

export interface UserSettings {
  hapticFeedback: boolean
  soundEffects: boolean
  practiceReminders: boolean
  preferredDifficulty: "beginner" | "intermediate" | "advanced" | "all"
  preferredSport: Sport
  theme: "dark" | "light"
  weeklyGoalMinutes: number
}

const defaultSettings: UserSettings = {
  hapticFeedback: true,
  soundEffects: true,
  practiceReminders: true,
  preferredDifficulty: "all",
  preferredSport: "soccer",
  theme: "dark",
  weeklyGoalMinutes: 60,
}

const DATA_VERSION_KEY = "precept_data_version"
const CURRENT_VERSION = 2

function getStoredVersion(): number {
  const v = safeGetItem(DATA_VERSION_KEY)
  return v ? parseInt(v, 10) || 0 : 0
}

function setStoredVersion(version: number): void {
  safeSetItem(DATA_VERSION_KEY, version.toString())
}

function migrateIfNeeded(): void {
  const version = getStoredVersion()
  if (version >= CURRENT_VERSION) return

  // Migration v0 -> v1: add lastPracticeDate if missing
  if (version < 1) {
    const stats = getUserStats()
    if (!stats.lastPracticeDate && stats.lastPractice) {
      stats.lastPracticeDate = stats.lastPractice.split("T")[0]
      saveUserStats(stats)
    }
  }

  // Migration v1 -> v2: ensure settings exist
  if (version < 2) {
    const settings = safeGetItem(STORAGE_KEYS.settings)
    if (!settings) {
      saveUserSettings(defaultSettings)
    }
  }

  setStoredVersion(CURRENT_VERSION)
}

// Run migration on import
if (typeof window !== "undefined") {
  try {
    migrateIfNeeded()
  } catch {
    // Silently fail migration
  }
}

// Helper to safely access localStorage
function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, value)
  } catch {
    console.warn("Failed to save to localStorage")
  }
}

// User Stats
export function getUserStats(): UserStats {
  const stored = safeGetItem(STORAGE_KEYS.userStats)
  if (stored) {
    try {
      return { ...defaultUserStats, ...JSON.parse(stored) }
    } catch {
      return defaultUserStats
    }
  }
  return defaultUserStats
}

export function saveUserStats(stats: UserStats): void {
  safeSetItem(STORAGE_KEYS.userStats, JSON.stringify(stats))
}

export function updateUserStats(updates: Partial<UserStats>): UserStats {
  const current = getUserStats()
  const updated = { ...current, ...updates }
  saveUserStats(updated)
  return updated
}

// Practice Sessions
export function getPracticeSessions(): PracticeSession[] {
  const stored = safeGetItem(STORAGE_KEYS.sessions)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

export function savePracticeSession(session: PracticeSession): void {
  const sessions = getPracticeSessions()
  const existingIndex = sessions.findIndex((s) => s.id === session.id)

  if (existingIndex >= 0) {
    sessions[existingIndex] = session
  } else {
    sessions.unshift(session) // Add new sessions at the beginning
  }

  // Keep only the last 50 sessions
  const trimmed = sessions.slice(0, 50)
  safeSetItem(STORAGE_KEYS.sessions, JSON.stringify(trimmed))
}

// Onboarding
export function hasCompletedOnboarding(): boolean {
  return safeGetItem(STORAGE_KEYS.onboarded) === "true"
}

export function completeOnboarding(): void {
  safeSetItem(STORAGE_KEYS.onboarded, "true")
}

// Generated Videos Cache
export function getGeneratedVideos(): Record<string, string> {
  const stored = safeGetItem(STORAGE_KEYS.generatedVideos)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return {}
    }
  }
  return {}
}

export function getGeneratedVideo(skillId: string): string | null {
  const videos = getGeneratedVideos()
  return videos[skillId] || null
}

export function saveGeneratedVideo(skillId: string, videoUrl: string): void {
  const videos = getGeneratedVideos()
  videos[skillId] = videoUrl
  safeSetItem(STORAGE_KEYS.generatedVideos, JSON.stringify(videos))
}


// Settings
export function getUserSettings(): UserSettings {
  const stored = safeGetItem(STORAGE_KEYS.settings)
  if (stored) {
    try {
      return { ...defaultSettings, ...JSON.parse(stored) }
    } catch {
      return defaultSettings
    }
  }
  return defaultSettings
}

export function saveUserSettings(settings: UserSettings): void {
  safeSetItem(STORAGE_KEYS.settings, JSON.stringify(settings))
  if (typeof document !== "undefined") {
    document.documentElement.className = settings.theme
  }
}

// Mark a skill as learned
export function markSkillLearned(skillId: string): UserStats {
  const stats = getUserStats()
  if (!stats.skillsLearned.includes(skillId)) {
    stats.skillsLearned.push(skillId)
    saveUserStats(stats)
  }
  return stats
}

// Complete a practice session and update stats
export function completePracticeSession(
  session: PracticeSession,
  fluidityScores: number[],
): { session: PracticeSession; stats: UserStats } {
  const endTime = new Date().toISOString()
  const completedSession: PracticeSession = {
    ...session,
    endTime,
    fluidityScores,
    completed: true,
  }

  savePracticeSession(completedSession)

  // Update user stats
  const stats = getUserStats()
  const duration = Math.round((new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 60000)

  const avgScore =
    fluidityScores.length > 0 ? Math.round(fluidityScores.reduce((a, b) => a + b, 0) / fluidityScores.length) : 0

  // Calculate new average fluidity across all sessions
  const allSessions = getPracticeSessions()
  const allScores = allSessions.flatMap((s) => s.fluidityScores)
  const newAvgFluidity =
    allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : avgScore

  const updatedStats = updateUserStats({
    practiceMinutes: stats.practiceMinutes + duration,
    avgFluidityScore: newAvgFluidity,
    lastPractice: endTime,
  })

  // Check if skill should be marked as learned (3+ sessions with avg > 70)
  const skillSessions = allSessions.filter((s) => s.skillId === session.skillId && s.completed)
  if (skillSessions.length >= 3) {
    const skillAvg = skillSessions.flatMap((s) => s.fluidityScores)
    const skillAvgScore = skillAvg.reduce((a, b) => a + b, 0) / skillAvg.length
    if (skillAvgScore >= 70 && !updatedStats.skillsLearned.includes(session.skillId)) {
      markSkillLearned(session.skillId)
    }
  }

  return { session: completedSession, stats: updatedStats }
}

// Bookmark Management
export function toggleBookmark(skillId: string): UserStats {
  const stats = getUserStats()
  const index = stats.bookmarkedSkills.indexOf(skillId)

  if (index >= 0) {
    // Remove bookmark
    stats.bookmarkedSkills.splice(index, 1)
  } else {
    // Add bookmark
    stats.bookmarkedSkills.push(skillId)
  }

  saveUserStats(stats)
  return stats
}

export function isSkillBookmarked(skillId: string): boolean {
  const stats = getUserStats()
  return stats.bookmarkedSkills.includes(skillId)
}

// Achievement Management
export function unlockAchievement(achievementId: string): UserStats {
  const stats = getUserStats()

  if (!stats.achievements.includes(achievementId)) {
    stats.achievements.push(achievementId)
    saveUserStats(stats)
  }

  return stats
}

export function isAchievementUnlocked(achievementId: string): boolean {
  const stats = getUserStats()
  return stats.achievements.includes(achievementId)
}

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Streak Management
export function updateStreak(): UserStats {
  const stats = getUserStats()
  const today = getLocalDateString()

  if (!stats.lastPracticeDate) {
    // First practice ever
    stats.currentStreak = 1
    stats.longestStreak = 1
    stats.lastPracticeDate = today
  } else {
    const lastDate = new Date(stats.lastPracticeDate + "T00:00:00")
    const todayDate = new Date(today + "T00:00:00")
    const diffTime = todayDate.getTime() - lastDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Same day, no change
      return stats
    } else if (diffDays === 1) {
      // Consecutive day
      stats.currentStreak += 1
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak)
      stats.lastPracticeDate = today
    } else {
      // Streak broken
      stats.currentStreak = 1
      stats.lastPracticeDate = today
    }
  }

  saveUserStats(stats)
  return stats
}

export function getStreakStatus(): {
  current: number
  longest: number
  daysUntilBreak: number
  isActive: boolean
} {
  const stats = getUserStats()

  if (!stats.lastPracticeDate) {
    return { current: 0, longest: 0, daysUntilBreak: 0, isActive: false }
  }

  const lastDate = new Date(stats.lastPracticeDate + "T00:00:00")
  const today = new Date(getLocalDateString() + "T00:00:00")
  const diffTime = today.getTime() - lastDate.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  const isActive = diffDays <= 1
  const daysUntilBreak = isActive ? 1 - diffDays : 0

  return {
    current: isActive ? stats.currentStreak : 0,
    longest: stats.longestStreak,
    daysUntilBreak,
    isActive,
  }
}

// Data Export/Import
export function exportUserData(): string {
  const data = {
    userStats: getUserStats(),
    sessions: getPracticeSessions(),
    settings: getUserSettings(),
    generatedVideos: getGeneratedVideos(),
    exportedAt: new Date().toISOString(),
    version: "1.0",
  }

  return JSON.stringify(data, null, 2)
}

export function importUserData(jsonString: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonString)

    // Validate data structure
    if (!data.userStats || !data.sessions || !data.settings) {
      return { success: false, error: "Invalid data format" }
    }

    // Import data
    saveUserStats(data.userStats)
    safeSetItem(STORAGE_KEYS.sessions, JSON.stringify(data.sessions))
    saveUserSettings(data.settings)

    if (data.generatedVideos) {
      safeSetItem(STORAGE_KEYS.generatedVideos, JSON.stringify(data.generatedVideos))
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export function clearAllData(): void {
  if (typeof window === "undefined") return

  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
    // Also clear auth/session data
    localStorage.removeItem("precept_auth_user")
    localStorage.removeItem("precept_session")
    // Clear all credential entries
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.startsWith("precept_cred_")) {
        localStorage.removeItem(key)
      }
    }
  } catch (error) {
    console.warn("Failed to clear data:", error)
  }
}

// Program Progress
export function getProgramProgress(programId: string): ProgramProgress | null {
  const all = safeGetItem(STORAGE_KEYS.programs)
  if (!all) return null
  try {
    const parsed = JSON.parse(all)
    return parsed[programId] || null
  } catch {
    return null
  }
}

export function getAllProgramProgress(): Record<string, ProgramProgress> {
  const all = safeGetItem(STORAGE_KEYS.programs)
  if (!all) return {}
  try {
    return JSON.parse(all)
  } catch {
    return {}
  }
}

export function saveProgramProgress(programId: string, progress: ProgramProgress): void {
  const all = getAllProgramProgress()
  all[programId] = progress
  safeSetItem(STORAGE_KEYS.programs, JSON.stringify(all))
}

export function markProgramStepComplete(programId: string): ProgramProgress {
  const all = getAllProgramProgress()
  const current = all[programId]
  const now = new Date().toISOString()

  if (!current) {
    const newProgress: ProgramProgress = {
      completedSteps: 1,
      totalSteps: 0,
      startedAt: now,
      lastPracticed: now,
    }
    all[programId] = newProgress
    safeSetItem(STORAGE_KEYS.programs, JSON.stringify(all))
    return newProgress
  }

  const next = Math.min(current.completedSteps + 1, current.totalSteps || Infinity)
  const completed = next >= current.totalSteps && current.totalSteps > 0
  all[programId] = {
    ...current,
    completedSteps: next,
    lastPracticed: now,
    completedAt: completed ? now : current.completedAt,
  }
  safeSetItem(STORAGE_KEYS.programs, JSON.stringify(all))
  return all[programId]
}

export function initProgramProgress(programId: string, totalSteps: number): ProgramProgress {
  const existing = getProgramProgress(programId)
  if (existing) {
    if (existing.totalSteps !== totalSteps) {
      const updated = { ...existing, totalSteps }
      saveProgramProgress(programId, updated)
      return updated
    }
    return existing
  }

  const progress: ProgramProgress = {
    completedSteps: 0,
    totalSteps,
    startedAt: new Date().toISOString(),
  }
  saveProgramProgress(programId, progress)
  return progress
}

export function resetProgramProgress(programId: string): void {
  const all = getAllProgramProgress()
  all[programId] = {
    ...all[programId],
    completedSteps: 0,
    completedAt: undefined,
    lastPracticed: undefined,
  }
  safeSetItem(STORAGE_KEYS.programs, JSON.stringify(all))
}
