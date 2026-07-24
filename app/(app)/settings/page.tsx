"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useApp } from "@/contexts/app-context"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"
import type { Sport } from "@/lib/types"

const sportIcons: Record<Sport, React.ReactNode> = {
  soccer: (
    <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} />
    </svg>
  ),
  basketball: (
    <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} />
    </svg>
  ),
  tennis: (
    <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} />
    </svg>
  ),
}

export default function SettingsPage() {
  const { settings, updateSettings, activeSport, setActiveSport } = useApp()
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
          <h1 className="text-2xl font-bold">
            <svg className="w-6 h-6 inline-block mr-2 -mt-0.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto space-y-6">
        {/* Sport Preference */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <h2 className="font-semibold mb-1">Preferred Sports</h2>
          <p className="text-xs text-muted-foreground mb-4">Select the sports you train</p>
          <div className="flex gap-2">
            {sports.map((sport) => {
              const isSelected = settings.preferredSports.includes(sport)
              return (
                <button
                  key={sport}
                  onClick={() => {
                    const current = settings.preferredSports
                    const next = isSelected
                      ? current.filter((s) => s !== sport)
                      : [...current, sport]
                    if (next.length === 0) return // Prevent deselecting all
                    updateSettings({ preferredSports: next, preferredSport: next[0] })
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-medium transition-all border",
                    isSelected
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span className="text-lg block mb-1">{sportIcons[sport]}</span>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </button>
              )
            })}
          </div>
        </section>

        {/* Active Sport */}
        {settings.preferredSports.length > 1 && (
          <section className="rounded-2xl bg-card border border-border p-5">
            <h2 className="font-semibold mb-1">Active Sport</h2>
            <p className="text-xs text-muted-foreground mb-4">Currently viewing content for</p>
            <div className="flex gap-2">
              {settings.preferredSports.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setActiveSport(sport)}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-medium transition-all border",
                    activeSport === sport
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
        )}

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

        {/* Weekly Goal */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold">Weekly Practice Goal</h2>
            <span className="text-sm font-mono font-bold text-primary">
              {settings.weeklyGoalMinutes >= 60
                ? `${Math.floor(settings.weeklyGoalMinutes / 60)}h${settings.weeklyGoalMinutes % 60 ? ` ${settings.weeklyGoalMinutes % 60}m` : ""}`
                : `${settings.weeklyGoalMinutes}m`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Target practice minutes per week</p>
          <div className="flex flex-wrap gap-2">
            {[30, 60, 90, 120, 180, 300].map((mins) => (
              <button
                key={mins}
                onClick={() => updateSettings({ weeklyGoalMinutes: mins })}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                  settings.weeklyGoalMinutes === mins
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
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
                <span className="w-5 h-5 block mx-auto mb-1">
                  {theme === "dark" ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  )}
                </span>
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

        {/* Data Management */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <h2 className="font-semibold mb-1">Data &amp; Privacy</h2>
          <p className="text-xs text-muted-foreground mb-4">Back up, restore, or reset your progress</p>
          <Link
            href="/profile/export"
            className="flex items-center justify-between rounded-xl bg-secondary/50 hover:bg-secondary p-4 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Data Management</p>
                <p className="text-xs text-muted-foreground">Export, import &amp; reset</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>

        {/* About */}
        <section className="rounded-2xl bg-card border border-border p-5 text-center">
          <p className="text-sm font-semibold mb-1">Precept Coach</p>
          <p className="text-xs text-muted-foreground">v1.0.0 · 32 skills · 13 programs</p>
          <div className="flex gap-4 justify-center mt-3 text-xs text-muted-foreground">
            <Link href="/profile" className="underline hover:text-foreground">Profile</Link>
            <Link href="/practice" className="underline hover:text-foreground">Practice</Link>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
