"use client"

import { useState, useMemo } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { AchievementBadge } from "@/components/achievement-badge"
import { SessionHistoryList } from "@/components/session-history-list"
import { StreakWidget } from "@/components/streak-widget"
import { FluidityTrendChart } from "@/components/fluidity-trend-chart"
import { useApp } from "@/contexts/app-context"
import { achievements } from "@/lib/achievements-database"
import { allSkills } from "@/lib/skills-database"
import { cn } from "@/lib/utils"
import type { Sport } from "@/lib/types"

type Tab = "stats" | "achievements" | "history"
type SportFilter = Sport | "all"

const sportLabels: Record<Sport, string> = {
  soccer: "Soccer",
  basketball: "Basketball",
  tennis: "Tennis",
}

export default function ProgressPage() {
  const { userStats, sessions, settings } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>("stats")
  const [historyFilter, setHistoryFilter] = useState<SportFilter>("all")

  const preferredSport = settings.preferredSport

  const bestFluidity = useMemo(() => {
    let best = 0
    for (const s of sessions) {
      for (const score of s.fluidityScores) {
        if (score > best) best = score
      }
    }
    return best
  }, [sessions])

  const skillSportMap = useMemo(() => {
    const map = new Map<string, Sport>()
    for (const skill of allSkills) map.set(skill.id, skill.sport)
    return map
  }, [])

  const filteredSessions = useMemo(() => {
    if (historyFilter === "all") return sessions
    return sessions.filter((s) => skillSportMap.get(s.skillId) === historyFilter)
  }, [sessions, historyFilter, skillSportMap])

  // Group achievements
  const unlockedAchievements = achievements.filter((a) => userStats.achievements.includes(a.id))

  // Attach unlockedAt date if possible (for now we just use current order, 
  // in a real app better to store unlockedAt in userStats.achievements object)
  const lockedAchievements = achievements.filter((a) => !userStats.achievements.includes(a.id))

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-4 max-w-lg md:max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Your Journey</h1>
          <p className="text-muted-foreground text-xs">Track your progress and celebrate wins</p>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-0 max-w-lg md:max-w-5xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 border-b border-transparent">
            {([
              { id: "stats", label: "Overview" },
              { id: "achievements", label: "Badges" },
              { id: "history", label: "History" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "pb-3 text-sm font-medium transition-all relative whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto min-h-[60vh]">
        {activeTab === "stats" && (
          <div className="space-y-6 animate-slide-up">
            <StreakWidget />

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.practiceMinutes}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Minutes Practiced</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.avgFluidityScore || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Fluidity</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.skillsLearned.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Skills Learned</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Sessions</p>
                </div>
              </div>
            </div>

            {/* Sport-specific & best performance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 01-1.925 3.546 5.974 5.974 0 01-2.133 1A3.75 3.75 0 0012 18z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{bestFluidity || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Best Fluidity</p>
                </div>
              </div>
              {preferredSport === "soccer" && (
                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.passAccuracy || 0}%</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Pass Accuracy</p>
                  </div>
                </div>
              )}
              {preferredSport === "basketball" && (
                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.shotsOnTarget || 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Shots on Target</p>
                  </div>
                </div>
              )}
              {preferredSport === "tennis" && (
                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.matchesPlayed || 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Matches Played</p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Stats Section */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Skill Breakdown</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pass Accuracy</span>
                    <span className="font-mono font-medium">{userStats.passAccuracy}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${userStats.passAccuracy}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Dribbles</span>
                    <span className="font-mono font-medium">{userStats.successfulDribbles}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${Math.min(100, (userStats.successfulDribbles / 50) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <FluidityTrendChart sessions={sessions} />
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="animate-slide-up space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Unlocked ({unlockedAchievements.length})</h3>
              <p className="text-xs text-muted-foreground">{Math.round((unlockedAchievements.length / achievements.length) * 100)}% Complete</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-4">
              {unlockedAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={true}
                />
              ))}
              {unlockedAchievements.length === 0 && (
                <div className="col-span-3 text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m0 0a6.023 6.023 0 01-2.77-.896m0 0A6.003 6.003 0 015.25 4.236" />
                  </svg>
                  <p>No badges yet. Start practicing to earn them!</p>
                </div>
              )}
            </div>

            {lockedAchievements.length > 0 && (
              <>
                <div className="h-px bg-border/50 my-2" />
                <h3 className="text-lg font-bold opacity-80">Locked ({lockedAchievements.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-4 opacity-60 grayscale-[0.5]">
                  {lockedAchievements.map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      isUnlocked={false}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="animate-slide-up space-y-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {(["all", "soccer", "basketball", "tennis"] as SportFilter[]).map((sport) => (
                <button
                  key={sport}
                  onClick={() => setHistoryFilter(sport)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    historyFilter === sport
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60",
                  )}
                >
                  {sport === "all" ? "All Sports" : sportLabels[sport]}
                </button>
              ))}
            </div>
            <SessionHistoryList sessions={filteredSessions} />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
