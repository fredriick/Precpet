"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { PreceptLogo } from "@/components/precept-logo"
import { BottomNav } from "@/components/bottom-nav"
import { MotionIndicator } from "@/components/motion-indicator"
import { Onboarding } from "@/components/onboarding"
import { StreakWidget } from "@/components/streak-widget"
import { AchievementBadge } from "@/components/achievement-badge"
import { useMotionSensor } from "@/hooks/use-motion-sensor"
import { useRecommendation } from "@/hooks/use-recommendation"
import { useApp } from "@/contexts/app-context"
import { useAuth } from "@/contexts/auth-context"
import { WeeklyActivityChart } from "@/components/weekly-activity-chart"
import { PracticeHeatmap } from "@/components/practice-heatmap"
import { LeaderboardWidget } from "@/components/leaderboard-widget"
import { Button } from "@/components/ui/button"
import { allSkills, getSkillsBySport } from "@/lib/skills-database"
import { getDailyTip } from "@/lib/daily-tips"
import { achievements } from "@/lib/achievements-database"
import { getAllProgramProgress, getStreakStatus } from "@/lib/storage"
import { useStreakReminder } from "@/hooks/use-streak-reminder"
import { getProgramById } from "@/lib/programs-database"
import { cn } from "@/lib/utils"
import type { PracticeSession, ProgramProgress, Sport, Program } from "@/lib/types"
import { startOfDay, subDays } from "date-fns"

const sportLabels: Record<Sport, string> = {
  soccer: "Soccer",
  basketball: "Basketball",
  tennis: "Tennis",
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMin = Math.round((now - then) / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  return `${diffDays}d ago`
}

function sessionsInRange(sessions: PracticeSession[], startDaysAgo: number, endDaysAgo: number): PracticeSession[] {
  const today = startOfDay(new Date())
  const rangeStart = subDays(today, startDaysAgo)
  const rangeEnd = subDays(today, endDaysAgo)
  return sessions.filter((s) => {
    if (!s.endTime) return false
    const sessionDate = startOfDay(new Date(s.endTime))
    return sessionDate >= rangeStart && sessionDate <= rangeEnd
  })
}

function sessionsThisWeek(sessions: PracticeSession[]): PracticeSession[] {
  return sessionsInRange(sessions, 7, 0)
}

function minutesTotal(sessions: PracticeSession[]): number {
  return sessions.reduce((acc, s) => {
    const start = new Date(s.startTime).getTime()
    const end = s.endTime ? new Date(s.endTime).getTime() : start
    return acc + Math.round((end - start) / 60000)
  }, 0)
}

function weeklyMinutesTotal(sessions: PracticeSession[]): number {
  return minutesTotal(sessionsThisWeek(sessions))
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

function ProgressRing({ progress, size = 72, stroke = 7 }: { progress: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, progress) / 100) * circumference
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--secondary)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500"
      />
    </svg>
  )
}

function TrendBadge({ change }: { change: number | null }) {
  if (change === null || change === 0) return null
  const positive = change > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        positive ? "text-emerald-400" : "text-red-400",
      )}
    >
      <svg
        className={cn("w-3 h-3", !positive && "rotate-180")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
      {Math.abs(change)}%
    </span>
  )
}

export default function HomePage() {
  const { isSupported, isTracking, analysis, startTracking, stopTracking, permissionStatus } = useMotionSensor()
  const { userStats, isOnboarded, isLoading, sessions, settings, activeSport } = useApp()
  const { user } = useAuth()
  const { recommendation } = useRecommendation(analysis.fluidityScore)
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [recommendedSkill, setRecommendedSkill] = useState(allSkills[0])
  const [activeProgram, setActiveProgram] = useState<{ program: Program; progress: ProgramProgress } | null>(null)

  const preferredSport = activeSport

  useEffect(() => {
    if (recommendation && recommendation.action === "RECOMMEND" && recommendation.skill) {
      setRecommendedSkill(recommendation.skill)
      setShowRecommendation(true)
    } else if (recommendation && recommendation.action === "SILENCE") {
      setShowRecommendation(false)
    }
  }, [recommendation])

  useEffect(() => {
    const allProgress = getAllProgramProgress()
    const inProgress = Object.entries(allProgress).find(([, p]) => !p.completedAt)
    if (inProgress) {
      const program = getProgramById(inProgress[0])
      if (program) setActiveProgram({ program, progress: inProgress[1] })
    } else {
      setActiveProgram(null)
    }
  }, [sessions])

  const weeklySessions = useMemo(() => sessionsThisWeek(sessions), [sessions])
  const weekMinutes = useMemo(() => weeklyMinutesTotal(sessions), [sessions])
  const lastWeekSessions = useMemo(() => sessionsInRange(sessions, 14, 8), [sessions])
  const lastWeekMinutes = useMemo(() => minutesTotal(lastWeekSessions), [lastWeekSessions])
  const sessionsTrend = useMemo(() => percentChange(weeklySessions.length, lastWeekSessions.length), [weeklySessions, lastWeekSessions])
  const minutesTrend = useMemo(() => percentChange(weekMinutes, lastWeekMinutes), [weekMinutes, lastWeekMinutes])
  const goalMinutes = settings.weeklyGoalMinutes || 60
  const goalProgress = Math.min(100, Math.round((weekMinutes / goalMinutes) * 100))

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const latestAchievementId = userStats.achievements[userStats.achievements.length - 1]
  const latestAchievement = latestAchievementId ? achievements.find((a) => a.id === latestAchievementId) : undefined

  const sportSkills = useMemo(() => getSkillsBySport(activeSport), [activeSport])
  const sportLearnedSkills = userStats.skillsLearned.filter((id) => sportSkills.some((s) => s.id === id))

  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 3)
  }, [sessions])

  const lastSession = recentSessions[0]
  const lastSkill = lastSession ? allSkills.find((sk) => sk.id === lastSession.skillId) : undefined

  const todayMinutes = useMemo(() => minutesTotal(sessionsInRange(sessions, 0, 0)), [sessions])
  const dailyGoal = Math.max(5, Math.round(goalMinutes / 7))
  const dailyProgress = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100))

  const personalBests = useMemo(() => {
    let bestFluidity = 0
    const weekBuckets: Record<string, number> = {}
    for (const s of sessions) {
      for (const score of s.fluidityScores) {
        if (score > bestFluidity) bestFluidity = score
      }
      if (s.endTime) {
        const d = startOfDay(new Date(s.endTime))
        const weekKey = `${d.getFullYear()}-${Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000))}`
        weekBuckets[weekKey] = (weekBuckets[weekKey] || 0) + 1
      }
    }
    const mostSessionsWeek = Object.values(weekBuckets).reduce((max, n) => Math.max(max, n), 0)
    return { bestFluidity, mostSessionsWeek, longestStreak: userStats.longestStreak || 0 }
  }, [sessions, userStats.longestStreak])

  const hasBests = personalBests.bestFluidity > 0 || personalBests.longestStreak > 0 || personalBests.mostSessionsWeek > 0

  const dailyTip = useMemo(() => getDailyTip(preferredSport), [preferredSport])

  const streakStatus = useMemo(() => getStreakStatus(), [sessions])
  useStreakReminder({
    enabled: settings.practiceReminders,
    streakActive: streakStatus.isActive,
    daysUntilBreak: streakStatus.daysUntilBreak,
    practicedToday: todayMinutes > 0,
    currentStreak: streakStatus.current,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <PreceptLogo className="w-16 h-16" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isOnboarded) {
    return <Onboarding />
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-16 max-w-lg md:max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <PreceptLogo className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{getGreeting()}, {user?.name || "athlete"}!</h1>
              <p className="text-xs text-muted-foreground">{sportLabels[preferredSport]} — let's level up today</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto space-y-6">
        {lastSkill && (
          <Link href={`/practice?skill=${lastSession.skillId}`} className="block">
            <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-card border border-primary/30 p-4 flex items-center gap-4 hover:border-primary/50 transition-colors hover-lift">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pick up where you left off</p>
                <p className="font-semibold truncate">{lastSkill.name}</p>
              </div>
              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}

        <StreakWidget sessions={sessions} registeredAt={user?.createdAt} />

        <div className="rounded-2xl bg-card border border-border p-5 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <ProgressRing progress={dailyProgress} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold font-mono text-primary">{dailyProgress}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Today's Goal</h3>
            <p className="text-2xl font-bold font-mono">
              {formatMinutes(todayMinutes)}
              <span className="text-sm text-muted-foreground"> / {formatMinutes(dailyGoal)}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {dailyProgress >= 100
                ? "Goal smashed! Keep the momentum going."
                : todayMinutes > 0
                  ? `${formatMinutes(dailyGoal - todayMinutes)} to go today`
                  : "Start practicing to hit today's target"}
            </p>
          </div>
        </div>

        {showRecommendation && (
          <div className="rounded-2xl bg-gradient-to-br from-card to-primary/5 border-2 border-primary/30 p-6 glow-primary animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Suggested skill</span>
              </div>
              <button
                onClick={() => setShowRecommendation(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-balance">{recommendedSkill.name}</h2>
            <p className="text-muted-foreground text-sm mb-4">{recommendedSkill.reasoning}</p>

            <Link href={`/skills/${recommendedSkill.id}`}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover-lift">
                Learn this skill
              </Button>
            </Link>
          </div>
        )}

        {latestAchievement && (
          <div className="rounded-2xl bg-card p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Latest Achievement</h3>
              <Link href="/progress" className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="flex justify-center">
              <AchievementBadge achievement={latestAchievement} isUnlocked={true} size="md" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Link href="/progress" className="block">
            <div className="rounded-2xl bg-card p-4 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4v16h18V4H3zm16 14H5V8h14v10z" />
                </svg>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Fluidity Avg</p>
              </div>
              <p className="text-3xl font-bold font-mono text-primary">{userStats.avgFluidityScore || "—"}</p>
            </div>
          </Link>
          <Link href="/profile" className="block">
            <div className="rounded-2xl bg-card p-4 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Practice Time</p>
              </div>
              <p className="text-3xl font-bold font-mono text-foreground">
                {formatMinutes(userStats.practiceMinutes || 0)}
              </p>
            </div>
          </Link>
          <Link href="/progress" className="block">
            <div className="rounded-2xl bg-card p-4 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">This Week</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold font-mono text-foreground">
                  {weeklySessions.length}
                  <span className="text-lg text-muted-foreground"> sessions</span>
                </p>
                <TrendBadge change={sessionsTrend} />
              </div>
            </div>
          </Link>
          <Link href="/progress" className="block">
            <div className="rounded-2xl bg-card p-4 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Weekly Goal</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold font-mono text-foreground">
                  {formatMinutes(weekMinutes)}
                  <span className="text-sm text-muted-foreground"> / {formatMinutes(goalMinutes)}</span>
                </p>
                <TrendBadge change={minutesTrend} />
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          </Link>
        </div>

        <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{sportLabels[activeSport]} Stats</span>
            </div>
            {activeSport === "soccer" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-card p-4 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Pass Accuracy</p>
                    {userStats.passAccuracy > 0 && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">AI</span>}
                  </div>
                  <p className="text-3xl font-bold font-mono text-blue-400">{userStats.passAccuracy || 0}%</p>
                  <div className="w-full bg-secondary rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${userStats.passAccuracy || 0}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl bg-card p-4 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Dribbles</p>
                    {userStats.successfulDribbles > 0 && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">AI</span>}
                  </div>
                  <p className="text-3xl font-bold font-mono text-emerald-400">{userStats.successfulDribbles || 0}</p>
                </div>
              </div>
            )}
            {activeSport === "basketball" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-card p-4 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Shots on Target</p>
                    {userStats.shotsOnTarget > 0 && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">AI</span>}
                  </div>
                  <p className="text-3xl font-bold font-mono text-orange-400">{userStats.shotsOnTarget || 0}</p>
                </div>
                <div className="rounded-2xl bg-card p-4 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Dribbles</p>
                    {userStats.successfulDribbles > 0 && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">AI</span>}
                  </div>
                  <p className="text-3xl font-bold font-mono text-emerald-400">{userStats.successfulDribbles || 0}</p>
                </div>
              </div>
            )}
            {activeSport === "tennis" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-card p-4 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Avg Fluidity</p>
                    {userStats.avgFluidityScore > 0 && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">AI</span>}
                  </div>
                  <p className="text-3xl font-bold font-mono text-primary">{userStats.avgFluidityScore || "—"}</p>
                </div>
                <div className="rounded-2xl bg-card p-4 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Matches Played</p>
                  </div>
                  <p className="text-3xl font-bold font-mono text-foreground">{userStats.matchesPlayed || 0}</p>
                </div>
              </div>
            )}
          </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-card border border-amber-500/20 p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">Tip of the Day</h3>
            <p className="text-sm text-foreground/90 leading-relaxed">{dailyTip}</p>
          </div>
        </div>

        <WeeklyActivityChart sessions={sessions} />

        <PracticeHeatmap sessions={sessions} />

        <LeaderboardWidget userMinutes={weekMinutes} userName={user?.name || "You"} sport={preferredSport} />

        {hasBests && (
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Personal Bests</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-primary">{personalBests.bestFluidity || "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Top Fluidity</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-orange-400">{personalBests.longestStreak}</p>
                <p className="text-xs text-muted-foreground mt-1">Longest Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-emerald-400">{personalBests.mostSessionsWeek}</p>
                <p className="text-xs text-muted-foreground mt-1">Best Week</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Sessions</h3>
            {recentSessions.length > 0 && (
              <Link href="/progress" className="text-xs text-primary hover:underline">
                View All
              </Link>
            )}
          </div>
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((s) => {
                const skill = allSkills.find((sk) => sk.id === s.skillId)
                const avgScore = s.fluidityScores.length > 0
                  ? Math.round(s.fluidityScores.reduce((a, b) => a + b, 0) / s.fluidityScores.length)
                  : null
                const duration = s.endTime
                  ? Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000)
                  : 0
                return (
                  <Link
                    key={s.id}
                    href={`/practice?skill=${s.skillId}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{skill?.name || s.skillId}</p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(s.startTime)}
                        {duration > 0 && ` · ${duration}m`}
                      </p>
                    </div>
                    {avgScore !== null && (
                      <div className={cn(
                        "text-sm font-mono font-semibold",
                        avgScore >= 70 ? "text-emerald-400" : avgScore >= 40 ? "text-amber-400" : "text-red-400",
                      )}>
                        {avgScore}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <svg className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-muted-foreground text-sm">No sessions yet</p>
              <Link href="/practice" className="text-xs text-primary hover:underline mt-1 inline-block">
                Start your first practice
              </Link>
            </div>
          )}
        </div>

        {activeProgram && (
          <div className="rounded-2xl bg-gradient-to-br from-card to-primary/5 border border-primary/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Program</h3>
            </div>
            <p className="text-lg font-bold mb-1">{activeProgram.program.name}</p>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>{activeProgram.progress.completedSteps} / {activeProgram.progress.totalSteps} steps</span>
              <span>{Math.round((activeProgram.progress.completedSteps / activeProgram.progress.totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                style={{ width: `${(activeProgram.progress.completedSteps / activeProgram.progress.totalSteps) * 100}%` }}
              />
            </div>
            <Link href={`/programs/${activeProgram.program.id}`}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Continue Program
              </Button>
            </Link>
          </div>
        )}

        <div className="md:hidden">
          <MotionIndicator
            fluidityScore={analysis.fluidityScore}
            intensity={analysis.intensity}
            isActive={analysis.isActive}
            isTracking={isTracking}
          />
        </div>

        <div className="md:hidden">
          {!isSupported ? (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
              <p className="text-amber-500 text-sm text-center">
                Motion sensors not available on this device. Try on a mobile device for full experience.
              </p>
            </div>
          ) : permissionStatus === "denied" ? (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
              <p className="text-destructive text-sm text-center">
                Motion permission denied. Please enable it in your device settings.
              </p>
            </div>
          ) : (
            <Button
              onClick={isTracking ? stopTracking : startTracking}
              variant={isTracking ? "outline" : "default"}
              className={cn(
                "w-full h-14 text-base font-medium",
                !isTracking && "bg-primary hover:bg-primary/90 text-primary-foreground",
              )}
            >
              {isTracking ? "Stop Motion Tracking" : "Start Motion Tracking"}
            </Button>
          )}
        </div>

        <div className="rounded-2xl bg-card p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Skills Learned
            </h3>
            <span className="text-xs text-muted-foreground">
              {sportLearnedSkills.length} / {sportSkills.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sportLearnedSkills.map((skillId) => {
              const skill = allSkills.find((s) => s.id === skillId)
              return skill ? (
                <Link
                  key={skillId}
                  href={`/skills/${skillId}`}
                  className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors"
                >
                  {skill.name}
                </Link>
              ) : null
            })}
            {sportLearnedSkills.length === 0 && (
              <div className="text-center py-6 w-full">
                <svg className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-muted-foreground text-sm">No skills unlocked yet</p>
                <Link href="/practice" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Browse skills
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/practice" className="block">
            <div className="rounded-2xl bg-card p-4 border border-border hover:border-primary/50 transition-colors h-full">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold mb-1">Start Practice</h4>
              <p className="text-muted-foreground text-xs">Begin a guided session</p>
            </div>
          </Link>
          <Link href="/practice" className="block">
            <div className="rounded-2xl bg-card p-4 border border-border hover:border-primary/50 transition-colors h-full">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h4 className="font-semibold mb-1">Browse Skills</h4>
              <p className="text-muted-foreground text-xs">Explore all techniques</p>
            </div>
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
