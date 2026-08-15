"use client"

import { useMemo, useState } from "react"
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
import { usePaddle } from "@/hooks/use-paddle"
import { useI18n } from "@/hooks/use-i18n"

export default function ProfilePage() {
  const { userStats, settings, updateSettings, sessions, atSessionLimit } = useApp()
  const { user } = useAuth()
  const { loaded: paddleLoaded, openCheckout } = usePaddle()
  const { t } = useI18n()
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month")

  const monthlyPriceId = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID
  const yearlyPriceId = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID

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
          <h1 className="text-2xl font-bold mb-1">{t("profile.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("profile.subtitle")}</p>
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
              <h2 className="text-xl font-bold">{user?.name || t("profile.athlete")}</h2>
              <p className="text-muted-foreground text-sm">
                {t("profile.skillsMastered", { learned: learnedSkills, total: totalSkills })}
              </p>
              {user?.createdAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("profile.memberSince", { date: new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) })}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <p className="text-2xl font-bold font-mono text-primary">{userStats.practiceMinutes}</p>
              <p className="text-xs text-muted-foreground">{t("profile.minutes")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">{t("profile.sessions")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{userStats.avgFluidityScore}</p>
              <p className="text-xs text-muted-foreground">{t("profile.avgScore")}</p>
            </div>
          </div>
        </div>

        {/* Streak & Personal Bests */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">{t("profile.streakBests")}</h3>
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
                <p className="text-xs text-muted-foreground">{t("profile.currentStreak")}</p>
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
                <p className="text-xs text-muted-foreground">{t("profile.longestStreak")}</p>
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
                <p className="text-xs text-muted-foreground">{t("profile.bestFluidity")}</p>
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
                <p className="text-xs text-muted-foreground">{t("profile.longestSession")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Showcase */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("profile.achievements")}</h3>
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
              {t("profile.noAchievements")}
            </p>
          )}
          <Link href="/progress" className="mt-4 block text-center text-xs text-primary font-medium">
            {t("profile.viewAllAchievements")}
          </Link>
        </div>

        {/* Game Stats */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("profile.gameStats")}</h3>
            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{t("profile.aiAnalyzed")}</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{t("profile.passAccuracy")}</span>
              <span className="font-semibold">{userStats.passAccuracy}%</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{t("profile.successfulDribbles")}</span>
              <span className="font-semibold text-primary">{userStats.successfulDribbles}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{t("profile.shotsOnTarget")}</span>
              <span className="font-semibold">{userStats.shotsOnTarget}</span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-4 text-center">
            {t("profile.aiNote")}
          </p>
        </div>

        {/* Settings */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("profile.settings")}</h3>
            <Link href="/settings" className="text-xs text-primary underline">{t("profile.fullSettings")}</Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("profile.haptic")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.hapticDesc")}</p>
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
                <p className="font-medium">{t("profile.soundEffects")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.soundDesc")}</p>
              </div>
              <button
                onClick={() => updateSettings({ soundEffects: !settings.soundEffects })}
                role="switch"
                aria-checked={settings.soundEffects}
                aria-label={t("profile.toggleSoundEffects")}
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
                <p className="font-medium">{t("profile.reminders")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.remindersDesc")}</p>
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
              <p className="font-medium mb-2">{t("profile.preferredDifficulty")}</p>
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
                    {level === "all" ? t("profile.allLevels") : level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">{t("profile.about")}</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t("profile.version")}</p>
            <p>{t("profile.coachDesc")}</p>
          </div>
        </div>

        {/* Pro Subscription */}
        <div className={cn("rounded-2xl bg-card border p-6", userStats.isPro ? "border-emerald-500/30" : "border-border")}>
          {userStats.isPro ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">{t("profile.pro")}</h3>
                    <p className="text-xs text-emerald-500 font-medium">{t("profile.active")}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase">
                  Pro
                </span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{t("profile.unlimitedSessions")}</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{t("profile.aiAnalysis")}</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{t("profile.advancedAnalytics")}</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{t("profile.prioritySupport")}</li>
              </ul>
              <p className="text-xs text-muted-foreground">{t("profile.manageSub")}</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">{t("profile.upgrade")}</h3>
                    <p className="text-xs text-muted-foreground">{t("profile.upgradeDesc")}</p>
                  </div>
                </div>
              </div>

              {/* Billing toggle */}
              <div className="flex bg-secondary/50 rounded-xl p-1 mb-4">
                {(["month", "year"] as const).map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setBillingInterval(interval)}
                    className={cn(
                      "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                      billingInterval === interval
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {interval === "month" ? t("profile.monthly") : t("profile.yearly")}
                    {interval === "year" && <span className="ml-1 text-emerald-500">-20%</span>}
                  </button>
                ))}
              </div>

              {/* Pricing */}
              <div className="text-center mb-4">
                <span className="text-3xl font-bold">{billingInterval === "month" ? "$9" : "$89"}</span>
                <span className="text-muted-foreground text-sm">{billingInterval === "month" ? t("profile.perMonth") : t("profile.perYear")}</span>
              </div>

              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{t("profile.unlimitedSessions")}</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{t("profile.aiAnalysis")}</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{t("profile.advancedAnalytics")}</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{t("profile.prioritySupport")}</li>
              </ul>

              <Button
                onClick={() => {
                  const priceId = billingInterval === "month" ? monthlyPriceId : yearlyPriceId
                  if (!priceId || !user?.id) return
                  openCheckout({
                    priceId,
                    customerEmail: user?.email,
                    userId: user?.id,
                    onSuccess: () => {
                      setTimeout(() => window.location.reload(), 3000)
                    },
                  })
                }}
                disabled={!paddleLoaded || !monthlyPriceId}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-semibold"
              >
                {!monthlyPriceId
                  ? t("profile.comingSoon")
                  : !paddleLoaded
                    ? t("profile.loading")
                    : t("profile.subscribe", { price: billingInterval === "month" ? "$9/mo" : "$89/yr" })}
              </Button>
            </>
          )}

          {/* Session limit */}
          <div className={cn("mt-4 pt-4 border-t border-border")}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{t("profile.sessionUsage")}</span>
              <span className="text-xs font-medium">
                {sessions.length} / {userStats.isPro ? "∞" : SESSION_LIMIT}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  userStats.isPro
                    ? "bg-emerald-500"
                    : atSessionLimit
                      ? "bg-gradient-to-r from-violet-500 to-violet-400"
                      : "bg-gradient-to-r from-emerald-500 to-emerald-400",
                )}
                style={{ width: userStats.isPro ? "100%" : `${Math.min(100, (sessions.length / SESSION_LIMIT) * 100)}%` }}
              />
            </div>
          </div>
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
