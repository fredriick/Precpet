"use client"

import { useMemo } from "react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { AchievementBadge } from "@/components/achievement-badge"
import { useApp, SESSION_LIMIT } from "@/contexts/app-context"
import { useAuth } from "@/contexts/auth-context"
import { allSkills } from "@/lib/skills-database"
import { achievements } from "@/lib/achievements-database"
import { cn } from "@/lib/utils"
import { LogoutButton } from "@/components/logout-button"

export default function ProfilePage() {
  const { userStats, settings, updateSettings, sessions, atSessionLimit } = useApp()
  const { user } = useAuth()

  const totalSkills = allSkills.length
  const learnedSkills = userStats.skillsLearned.length

  const { bestFluidity, longestSessionMin } = useMemo(() => {
    let best = 0
    let longest = 0
    for (const s of sessions) {
      for (const score of s.fluidityScores) {
        if (score > best) best = score
      }
      if (s.endTime) {
        const mins = Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000)
        if (mins > longest) longest = mins
      }
    }
    return { bestFluidity: best, longestSessionMin: longest }
  }, [sessions])

  const unlockedAchievements = achievements.filter((a) => userStats.achievements.includes(a.id))

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-4 max-w-lg md:max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Profile</h1>
          <p className="text-muted-foreground text-sm">Your stats and settings</p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto space-y-6">
        {/* Profile Summary */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name || "Athlete"}</h2>
              <p className="text-muted-foreground text-sm">
                {learnedSkills}/{totalSkills} skills mastered
              </p>
              {user?.createdAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <p className="text-2xl font-bold font-mono text-primary">{userStats.practiceMinutes}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{userStats.avgFluidityScore}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>
        </div>

        {/* Streak & Personal Bests */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Streak &amp; Bests</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 01-1.925 3.546 5.974 5.974 0 01-2.133 1A3.75 3.75 0 0012 18z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold font-mono">{userStats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Current Streak</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold font-mono">{userStats.longestStreak}</p>
                <p className="text-xs text-muted-foreground">Longest Streak</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold font-mono">{bestFluidity}</p>
                <p className="text-xs text-muted-foreground">Best Fluidity</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold font-mono">{longestSessionMin}m</p>
                <p className="text-xs text-muted-foreground">Longest Session</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Showcase */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Achievements</h3>
            <span className="text-xs text-muted-foreground">
              {unlockedAchievements.length}/{achievements.length}
            </span>
          </div>
          {unlockedAchievements.length > 0 ? (
            <div className="grid grid-cols-4 gap-3 justify-items-center">
              {unlockedAchievements.slice(0, 8).map((a) => (
                <AchievementBadge key={a.id} achievement={a} isUnlocked size="sm" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No achievements yet. Keep practicing to unlock them!
            </p>
          )}
          <Link href="/progress" className="mt-4 block text-center text-xs text-primary font-medium">
            View all achievements →
          </Link>
        </div>

        {/* Game Stats */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Game Stats</h3>
            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">AI Analyzed</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Pass Accuracy</span>
              <span className="font-semibold">{userStats.passAccuracy}%</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Successful Dribbles</span>
              <span className="font-semibold text-primary">{userStats.successfulDribbles}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Shots on Target</span>
              <span className="font-semibold">{userStats.shotsOnTarget}</span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-4 text-center">
            Values are automatically updated from AI video analysis. Record a session to improve your stats.
          </p>
        </div>

        {/* Settings */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Settings</h3>
            <Link href="/settings" className="text-xs text-primary underline">Full settings →</Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Haptic Feedback</p>
                <p className="text-xs text-muted-foreground">Vibrate during practice</p>
              </div>
              <button
                onClick={() => updateSettings({ hapticFeedback: !settings.hapticFeedback })}
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative",
                  settings.hapticFeedback ? "bg-primary" : "bg-secondary",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full bg-white absolute top-1 transition-transform",
                    settings.hapticFeedback ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sound Effects</p>
                <p className="text-xs text-muted-foreground">Play sounds during sessions</p>
              </div>
              <button
                onClick={() => updateSettings({ soundEffects: !settings.soundEffects })}
                role="switch"
                aria-checked={settings.soundEffects}
                aria-label="Toggle sound effects"
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative",
                  settings.soundEffects ? "bg-primary" : "bg-secondary",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full bg-white absolute top-1 transition-transform",
                    settings.soundEffects ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Practice Reminders</p>
                <p className="text-xs text-muted-foreground">Daily practice notifications</p>
              </div>
              <button
                onClick={() => updateSettings({ practiceReminders: !settings.practiceReminders })}
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative",
                  settings.practiceReminders ? "bg-primary" : "bg-secondary",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full bg-white absolute top-1 transition-transform",
                    settings.practiceReminders ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </button>
            </div>

            <div>
              <p className="font-medium mb-2">Preferred Difficulty</p>
              <div className="flex gap-2 flex-wrap">
                {(["all", "beginner", "intermediate", "advanced"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => updateSettings({ preferredDifficulty: level })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                      settings.preferredDifficulty === level
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {level === "all" ? "All Levels" : level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">About</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Precept v1.0.0</p>
            <p>AI-powered sports skills coach</p>
          </div>
        </div>

        {/* Cloud Storage */}
        <div className={cn("rounded-2xl bg-card border p-6", atSessionLimit ? "border-violet-500/30" : "border-border")}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cloud Storage</h3>
            <span className={cn("text-xs font-medium", atSessionLimit ? "text-violet-500" : "text-muted-foreground")}>
              {sessions.length} / {SESSION_LIMIT} sessions
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                atSessionLimit
                  ? "bg-gradient-to-r from-violet-500 to-violet-400"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-400",
              )}
              style={{ width: `${Math.min(100, (sessions.length / SESSION_LIMIT) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {atSessionLimit
              ? "Session limit reached. Upgrade to Precept Pro for unlimited practice."
              : `${SESSION_LIMIT - sessions.length} sessions remaining on the free plan`}
          </p>
          {atSessionLimit && (
            <div className="mt-3 rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
              <p className="text-violet-600 text-xs font-medium">Upgrade to Pro for unlimited sessions, advanced analytics, and priority support.</p>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="pt-4">
          <LogoutButton />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
