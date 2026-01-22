"use client"

import { useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { AchievementBadge } from "@/components/achievement-badge"
import { SessionHistoryList } from "@/components/session-history-list"
import { StreakWidget } from "@/components/streak-widget"
import { useApp } from "@/contexts/app-context"
import { achievements } from "@/lib/achievements-database"
import { cn } from "@/lib/utils"

type Tab = "stats" | "achievements" | "history"

export default function ProgressPage() {
  const { userStats, sessions } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>("stats")

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
          <h1 className="text-2xl font-bold mb-1">Your Journey 🏔️</h1>
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
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl">
                  ⏱️
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.practiceMinutes}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Minutes Practiced</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl">
                  🌊
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.avgFluidityScore || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Fluidity</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xl">
                  📚
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.skillsLearned.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Skills Learned</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl">
                  🎯
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.shotsOnTarget || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Shots on Target</p>
                </div>
              </div>
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
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="animate-slide-up space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Unlocked ({unlockedAchievements.length})</h3>
              <p className="text-xs text-muted-foreground">{Math.round((unlockedAchievements.length / achievements.length) * 100)}% Complete</p>
            </div>

            <div className="grid grid-cols-3 gap-y-8 gap-x-4">
              {unlockedAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={true}
                />
              ))}
              {unlockedAchievements.length === 0 && (
                <div className="col-span-3 text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <div className="text-3xl">🔒</div>
                  <p>No badges yet. Start practicing to earn them! 🏅</p>
                </div>
              )}
            </div>

            {lockedAchievements.length > 0 && (
              <>
                <div className="h-px bg-border/50 my-2" />
                <h3 className="text-lg font-bold opacity-80">Locked ({lockedAchievements.length})</h3>
                <div className="grid grid-cols-3 gap-y-8 gap-x-4 opacity-60 grayscale-[0.5]">
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
          <div className="animate-slide-up">
            <SessionHistoryList sessions={sessions} />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
