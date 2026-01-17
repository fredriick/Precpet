"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { UserStats, PracticeSession } from "@/lib/types"
import {
  getUserStats,
  saveUserStats,
  getPracticeSessions,
  savePracticeSession,
  hasCompletedOnboarding,
  completeOnboarding as markOnboarded,
  getUserSettings,
  saveUserSettings,
  completePracticeSession,
  markSkillLearned as markLearned,
  toggleBookmark as toggleBookmarkStorage,
  unlockAchievement as unlockAchievementStorage,
  updateStreak as updateStreakStorage,
  type UserSettings,
} from "@/lib/storage"

interface AppContextValue {
  // User data
  userStats: UserStats
  sessions: PracticeSession[]
  settings: UserSettings
  isOnboarded: boolean
  isLoading: boolean

  // Actions
  updateStats: (updates: Partial<UserStats>) => void
  addSession: (session: PracticeSession) => void
  finishSession: (session: PracticeSession, fluidityScores: number[]) => void
  markSkillLearned: (skillId: string) => void
  updateSettings: (settings: Partial<UserSettings>) => void
  completeOnboarding: () => void
  refreshData: () => void
  toggleBookmark: (skillId: string) => void
  unlockAchievement: (achievementId: string) => void
  updateStreak: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [userStats, setUserStats] = useState<UserStats>({
    matchesPlayed: 0,
    ballLossesUnderPressure: 0,
    successfulDribbles: 0,
    passAccuracy: 0,
    shotsOnTarget: 0,
    avgFluidityScore: 0,
    practiceMinutes: 0,
    skillsLearned: [],
    lastPractice: null,
  })
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [settings, setSettings] = useState<UserSettings>({
    hapticFeedback: true,
    soundEffects: true,
    practiceReminders: true,
    preferredDifficulty: "all",
  })
  const [isOnboarded, setIsOnboarded] = useState(true) // Default to true to avoid flash
  const [isLoading, setIsLoading] = useState(true)

  // Load data from localStorage on mount
  useEffect(() => {
    setUserStats(getUserStats())
    setSessions(getPracticeSessions())
    setSettings(getUserSettings())
    setIsOnboarded(hasCompletedOnboarding())
    setIsLoading(false)
  }, [])

  const refreshData = useCallback(() => {
    setUserStats(getUserStats())
    setSessions(getPracticeSessions())
    setSettings(getUserSettings())
  }, [])

  const updateStats = useCallback((updates: Partial<UserStats>) => {
    setUserStats((prev) => {
      const updated = { ...prev, ...updates }
      saveUserStats(updated)
      return updated
    })
  }, [])

  const addSession = useCallback((session: PracticeSession) => {
    savePracticeSession(session)
    setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)])
  }, [])

  const finishSession = useCallback((session: PracticeSession, fluidityScores: number[]) => {
    const { session: completed, stats } = completePracticeSession(session, fluidityScores)
    setSessions((prev) => [completed, ...prev.filter((s) => s.id !== completed.id)])
    setUserStats(stats)
  }, [])

  const markSkillLearned = useCallback((skillId: string) => {
    const updated = markLearned(skillId)
    setUserStats(updated)
  }, [])

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates }
      saveUserSettings(updated)
      return updated
    })
  }, [])

  const completeOnboarding = useCallback(() => {
    markOnboarded()
    setIsOnboarded(true)
  }, [])

  const toggleBookmark = useCallback((skillId: string) => {
    const updated = toggleBookmarkStorage(skillId)
    setUserStats(updated)
  }, [])

  const unlockAchievement = useCallback((achievementId: string) => {
    const updated = unlockAchievementStorage(achievementId)
    setUserStats(updated)
  }, [])

  const updateStreak = useCallback(() => {
    const updated = updateStreakStorage()
    setUserStats(updated)
  }, [])

  return (
    <AppContext.Provider
      value={{
        userStats,
        sessions,
        settings,
        isOnboarded,
        isLoading,
        updateStats,
        addSession,
        finishSession,
        markSkillLearned,
        updateSettings,
        completeOnboarding,
        refreshData,
        toggleBookmark,
        unlockAchievement,
        updateStreak,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
