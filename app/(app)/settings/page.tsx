"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useApp } from "@/contexts/app-context"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"
import type { Sport } from "@/lib/types"

const sportIcons: Record<Sport, string> = {
  soccer: "⚽",
  basketball: "🏀",
  tennis: "🎾",
}

export default function SettingsPage() {
  const { settings, updateSettings } = useApp()
  const router = useRouter()

  const difficulties = ["all", "beginner", "intermediate", "advanced"] as const
  const sports: Sport[] = ["soccer", "basketball", "tennis"]

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-4 max-w-lg md:max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Settings ⚙️</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto space-y-6">
        {/* Sport Preference */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <h2 className="font-semibold mb-1">Preferred Sport</h2>
          <p className="text-xs text-muted-foreground mb-4">Your default sport for practice and skills</p>
          <div className="flex gap-2">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => updateSettings({ preferredSport: sport })}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-medium transition-all border",
                  settings.preferredSport === sport
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span className="text-lg block mb-1">{sportIcons[sport]}</span>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty Preference */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <h2 className="font-semibold mb-1">Preferred Difficulty</h2>
          <p className="text-xs text-muted-foreground mb-4">Default skill difficulty filter</p>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => updateSettings({ preferredDifficulty: diff })}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                  settings.preferredDifficulty === diff
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {diff === "all" ? "All Levels" : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Theme Toggle */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <h2 className="font-semibold mb-1">Appearance</h2>
          <p className="text-xs text-muted-foreground mb-4">Choose your theme</p>
          <div className="flex gap-2">
            {(["dark", "light"] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => updateSettings({ theme })}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-medium transition-all border",
                  settings.theme === theme
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span className="text-lg block mb-1">{theme === "dark" ? "🌙" : "☀️"}</span>
                {theme === "dark" ? "Dark" : "Light"}
              </button>
            ))}
          </div>
        </section>

        {/* Sound & Haptics */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <h2 className="font-semibold mb-4">Sound & Feedback</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium">Sound Effects</p>
                <p className="text-xs text-muted-foreground">Play sounds during practice</p>
              </div>
              <button
                onClick={() => updateSettings({ soundEffects: !settings.soundEffects })}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative",
                  settings.soundEffects ? "bg-primary" : "bg-secondary",
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                  settings.soundEffects ? "translate-x-5.5" : "translate-x-0.5",
                )} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium">Haptic Feedback</p>
                <p className="text-xs text-muted-foreground">Vibrate on actions</p>
              </div>
              <button
                onClick={() => updateSettings({ hapticFeedback: !settings.hapticFeedback })}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative",
                  settings.hapticFeedback ? "bg-primary" : "bg-secondary",
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                  settings.hapticFeedback ? "translate-x-5.5" : "translate-x-0.5",
                )} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium">Practice Reminders</p>
                <p className="text-xs text-muted-foreground">Remind me to practice daily</p>
              </div>
              <button
                onClick={() => updateSettings({ practiceReminders: !settings.practiceReminders })}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative",
                  settings.practiceReminders ? "bg-primary" : "bg-secondary",
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                  settings.practiceReminders ? "translate-x-5.5" : "translate-x-0.5",
                )} />
              </button>
            </label>
          </div>
        </section>

        {/* About */}
        <section className="rounded-2xl bg-card border border-border p-5 text-center">
          <p className="text-sm font-semibold mb-1">Precept Coach</p>
          <p className="text-xs text-muted-foreground">v1.0.0 · 32 skills · 13 programs</p>
          <div className="flex gap-4 justify-center mt-3 text-xs text-muted-foreground">
            <Link href="/profile" className="underline hover:text-foreground">Profile</Link>
            <Link href="/programs" className="underline hover:text-foreground">Programs</Link>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
