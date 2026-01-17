"use client"

import { useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/app-context"
import { soccerSkills } from "@/lib/skills-database"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { userStats, settings, updateStats, updateSettings, sessions } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    matchesPlayed: userStats.matchesPlayed,
    passAccuracy: userStats.passAccuracy,
    successfulDribbles: userStats.successfulDribbles,
    ballLossesUnderPressure: userStats.ballLossesUnderPressure,
    shotsOnTarget: userStats.shotsOnTarget,
  })

  const handleSaveStats = () => {
    updateStats(editForm)
    setIsEditing(false)
  }

  const totalSkills = soccerSkills.length
  const learnedSkills = userStats.skillsLearned.length

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
              <h2 className="text-xl font-bold">Athlete</h2>
              <p className="text-muted-foreground text-sm">
                {learnedSkills}/{totalSkills} skills mastered
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
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

        {/* Game Stats */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Game Stats</h3>
            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveStats()
                } else {
                  setEditForm({
                    matchesPlayed: userStats.matchesPlayed,
                    passAccuracy: userStats.passAccuracy,
                    successfulDribbles: userStats.successfulDribbles,
                    ballLossesUnderPressure: userStats.ballLossesUnderPressure,
                    shotsOnTarget: userStats.shotsOnTarget,
                  })
                  setIsEditing(true)
                }
              }}
              className="text-sm text-primary font-medium"
            >
              {isEditing ? "Save" : "Edit"}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Matches Played</label>
                <input
                  type="number"
                  value={editForm.matchesPlayed}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, matchesPlayed: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Pass Accuracy (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.passAccuracy}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, passAccuracy: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Successful Dribbles</label>
                <input
                  type="number"
                  value={editForm.successfulDribbles}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, successfulDribbles: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Ball Losses Under Pressure</label>
                <input
                  type="number"
                  value={editForm.ballLossesUnderPressure}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, ballLossesUnderPressure: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Shots on Target</label>
                <input
                  type="number"
                  value={editForm.shotsOnTarget}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, shotsOnTarget: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary outline-none"
                />
              </div>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full">
                Cancel
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Matches Played</span>
                <span className="font-semibold">{userStats.matchesPlayed}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Pass Accuracy</span>
                <span className="font-semibold">{userStats.passAccuracy}%</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Successful Dribbles</span>
                <span className="font-semibold text-primary">{userStats.successfulDribbles}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Ball Losses Under Pressure</span>
                <span className="font-semibold text-amber-400">{userStats.ballLossesUnderPressure}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Shots on Target</span>
                <span className="font-semibold">{userStats.shotsOnTarget}</span>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Settings</h3>

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
      </main>

      <BottomNav />
    </div>
  )
}
