"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import type { UserStats, PracticeSession, ProgramProgress } from "@/lib/types"
import type { UserSettings } from "@/lib/storage"
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
  getAllProgramProgress,
  saveProgramProgress,
  getGeneratedVideos,
  saveGeneratedVideo,
} from "@/lib/storage"
import { celebratoryFeedback, playSound } from "@/lib/feedback"
import { getAchievementById, checkAchievementUnlock, achievements as allAchievements } from "@/lib/achievements-database"
import { AchievementToast } from "@/components/achievement-toast"
import type { Achievement } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import {
  loadCloudSnapshot,
  saveCloudStats,
  saveCloudSettings,
  saveCloudSession,
  saveCloudProgramProgress,
  saveCloudVideo,
} from "@/lib/cloud-sync"

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

const defaultSettings: UserSettings = {
  hapticFeedback: true,
  soundEffects: true,
  practiceReminders: true,
  preferredDifficulty: "all",
  preferredSport: "soccer",
  theme: "dark",
  weeklyGoalMinutes: 60,
}

interface AppContextValue {
  userStats: UserStats
  sessions: PracticeSession[]
  settings: UserSettings
  isOnboarded: boolean | null
  isLoading: boolean
  updateStats: (updates: Partial<UserStats>) => void
  addSession: (session: PracticeSession) => void
  finishSession: (session: PracticeSession, fluidityScores: number[], notes?: string) => void
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
  const { user } = useAuth()
  const [userStats, setUserStats] = useState<UserStats>(defaultUserStats)
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const achievementsRef = useRef<string[]>([])
  const [toastAchievement, setToastAchievement] = useState<Achievement | null>(null)

  // Load from localStorage immediately, then hydrate from cloud when authed.
  useEffect(() => {
    setUserStats(getUserStats())
    setSessions(getPracticeSessions())
    setSettings(getUserSettings())
    document.documentElement.className = getUserSettings().theme
    setIsOnboarded(hasCompletedOnboarding())
    setIsLoading(false)
    achievementsRef.current = [...getUserStats().achievements]
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    loadCloudSnapshot(user.id)
      .then((snapshot) => {
        if (cancelled || !snapshot) return
        // Cloud wins; also refresh the local cache so exports/import stay consistent.
        saveUserStats(snapshot.userStats)
        snapshot.sessions.forEach((s) => savePracticeSession(s))
        saveUserSettings(snapshot.settings)
        setUserStats(snapshot.userStats)
        setSessions(snapshot.sessions)
        setSettings(snapshot.settings)
        document.documentElement.className = snapshot.settings.theme
        achievementsRef.current = [...snapshot.userStats.achievements]
      })
      .catch(() => {
        // Keep local data on failure
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const refreshData = useCallback(() => {
    setUserStats(getUserStats())
    setSessions(getPracticeSessions())
    setSettings(getUserSettings())
  }, [])

  const syncStats = useCallback(
    (stats: UserStats) => {
      saveUserStats(stats)
      if (user) void saveCloudStats(user.id, stats).catch(() => {})
    },
    [user],
  )

  const syncSettings = useCallback(
    (s: UserSettings) => {
      saveUserSettings(s)
      if (user) void saveCloudSettings(user.id, s).catch(() => {})
    },
    [user],
  )

  const updateStats = useCallback(
    (updates: Partial<UserStats>) => {
      setUserStats((prev) => {
        const updated = { ...prev, ...updates }
        syncStats(updated)
        return updated
      })
    },
    [syncStats],
  )

  const addSession = useCallback(
    (session: PracticeSession) => {
      savePracticeSession(session)
      setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)])
      if (user) void saveCloudSession(user.id, session).catch(() => {})
    },
    [user],
  )

  const finishSession = useCallback(
    (session: PracticeSession, fluidityScores: number[], notes?: string) => {
      const { session: completed, stats } = completePracticeSession(session, fluidityScores, notes)
      setSessions((prev) => [completed, ...prev.filter((s) => s.id !== completed.id)])
      setUserStats(stats)
      if (user) {
        void saveCloudSession(user.id, completed).catch(() => {})
        void saveCloudStats(user.id, stats).catch(() => {})
      }

      const streakStats = updateStreakStorage()
      setUserStats((prev) => ({
        ...prev,
        currentStreak: streakStats.currentStreak,
        longestStreak: streakStats.longestStreak,
        lastPracticeDate: streakStats.lastPracticeDate,
      }))
      if (user) void saveCloudStats(user.id, getUserStats()).catch(() => {})

      const updatedSessions = getPracticeSessions()
      const newAchievements = allAchievements
        .filter((a) => checkAchievementUnlock(a.id, stats, updatedSessions))
        .map((a) => a.id)

      if (newAchievements.length > 0) {
        newAchievements.forEach((id) => unlockAchievement(id))
      }
    },
    [user],
  )

  const markSkillLearned = useCallback(
    (skillId: string) => {
      const updated = markLearned(skillId)
      const prev = getUserStats()
      if (updated.skillsLearned.length > prev.skillsLearned.length) {
        playSound("success")
      }
      setUserStats(updated)
      if (user) void saveCloudStats(user.id, updated).catch(() => {})
    },
    [user],
  )

  const updateSettings = useCallback(
    (updates: Partial<UserSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...updates }
        syncSettings(updated)
        return updated
      })
    },
    [syncSettings],
  )

  const completeOnboarding = useCallback(() => {
    markOnboarded()
    setIsOnboarded(true)
  }, [])

  const toggleBookmark = useCallback(
    (skillId: string) => {
      const updated = toggleBookmarkStorage(skillId)
      setUserStats(updated)
      if (user) void saveCloudStats(user.id, updated).catch(() => {})
    },
    [user],
  )

  const unlockAchievement = useCallback(
    (achievementId: string) => {
      const updated = unlockAchievementStorage(achievementId)
      if (updated.achievements.length > achievementsRef.current.length) {
        celebratoryFeedback()
        const achievement = getAchievementById(achievementId)
        if (achievement) {
          setToastAchievement(achievement)
        }
      }
      achievementsRef.current = [...updated.achievements]
      setUserStats(updated)
      if (user) void saveCloudStats(user.id, updated).catch(() => {})
    },
    [user],
  )

  const updateStreak = useCallback(() => {
    const updated = updateStreakStorage()
    setUserStats(updated)
    if (user) void saveCloudStats(user.id, updated).catch(() => {})
  }, [user])

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
      {toastAchievement && (
        <AchievementToast achievement={toastAchievement} onClose={() => setToastAchievement(null)} />
      )}
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
