"use client"

import { useState, useEffect } from "react"
import { PreceptLogo } from "@/components/precept-logo"
import { BottomNav } from "@/components/bottom-nav"
import { MotionIndicator } from "@/components/motion-indicator"
import { Onboarding } from "@/components/onboarding"
import { StreakWidget } from "@/components/streak-widget"
import { AchievementBadge } from "@/components/achievement-badge"
import { useMotionSensor } from "@/hooks/use-motion-sensor"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { soccerSkills } from "@/lib/skills-database"
import { achievements } from "@/lib/achievements-database"
import { isPracticeWindow } from "@/lib/demo-data"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const { isSupported, isTracking, analysis, startTracking, stopTracking, permissionStatus } = useMotionSensor()
  const { userStats, isOnboarded, isLoading } = useApp()
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [recommendedSkill, setRecommendedSkill] = useState(soccerSkills[0])

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // AI recommendation logic based on user stats
  useEffect(() => {
    if (isPracticeWindow()) {
      // Find skills not yet learned and recommend based on weakness
      const unlearnedSkills = soccerSkills.filter((s) => !userStats.skillsLearned.includes(s.id))

      if (unlearnedSkills.length > 0) {
        // Prioritize based on user weaknesses
        let recommended = unlearnedSkills[0]

        if (userStats.ballLossesUnderPressure > 5) {
          // Recommend escape moves
          const escapeSkill = unlearnedSkills.find((s) => s.category === "dribbling" && s.difficulty !== "advanced")
          if (escapeSkill) recommended = escapeSkill
        } else if (userStats.successfulDribbles < 10) {
          // Recommend beginner dribbling
          const beginnerSkill = unlearnedSkills.find((s) => s.difficulty === "beginner")
          if (beginnerSkill) recommended = beginnerSkill
        }

        const timer = setTimeout(() => {
          setRecommendedSkill(recommended)
          setShowRecommendation(true)
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [userStats])

  // Show loading state
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

  // Show onboarding for new users
  if (!isOnboarded) {
    return <Onboarding />
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-16 max-w-lg md:max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <PreceptLogo className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{getGreeting()}, athlete! 👋</h1>
              <p className="text-xs text-muted-foreground">Let's level up today</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto space-y-6">
        {/* Streak Widget */}
        <StreakWidget />

        {/* Skill Recommendation Card */}
        {showRecommendation && (
          <div className="rounded-2xl bg-gradient-to-br from-card to-primary/5 border-2 border-primary/30 p-6 glow-primary animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💡</span>
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Hey! Want to try this?</span>
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
                Let's Learn It! 🚀
              </Button>
            </Link>
          </div>
        )}

        {/* Latest Achievement */}
        {userStats.achievements.length > 0 && (
          <div className="rounded-2xl bg-card p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Latest Achievement 🏆</h3>
              <Link href="/progress" className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="flex justify-center">
              <AchievementBadge
                achievement={achievements.find((a) => a.id === userStats.achievements[userStats.achievements.length - 1])!}
                isUnlocked={true}
                size="md"
              />
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-card p-4 border border-border">
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Fluidity Avg</p>
            <p className="text-3xl font-bold font-mono text-primary">{userStats.avgFluidityScore || "–"}</p>
          </div>
          <div className="rounded-2xl bg-card p-4 border border-border">
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Practice Time</p>
            <p className="text-3xl font-bold font-mono text-foreground">
              {userStats.practiceMinutes || 0}
              <span className="text-lg text-muted-foreground">m</span>
            </p>
          </div>
        </div>

        {/* Motion Sensor */}
        <MotionIndicator
          fluidityScore={analysis.fluidityScore}
          intensity={analysis.intensity}
          isActive={analysis.isActive}
          isTracking={isTracking}
        />

        {/* Motion Control */}
        <div className="space-y-3">
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

        {/* Skills Learned */}
        <div className="rounded-2xl bg-card p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Skills Learned</h3>
            <span className="text-xs text-muted-foreground">
              {userStats.skillsLearned.length} / {soccerSkills.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {userStats.skillsLearned.map((skillId) => {
              const skill = soccerSkills.find((s) => s.id === skillId)
              return skill ? (
                <div key={skillId} className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {skill.name}
                </div>
              ) : null
            })}
            {userStats.skillsLearned.length === 0 && (
              <p className="text-muted-foreground text-sm">Complete practice sessions to unlock skills</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/practice" className="block">
            <div className="rounded-2xl bg-card p-4 border border-border hover:border-primary/50 transition-colors h-full">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold mb-1">Start Practice</h4>
              <p className="text-muted-foreground text-xs">Begin a guided session</p>
            </div>
          </Link>
          <Link href="/skills" className="block">
            <div className="rounded-2xl bg-card p-4 border border-border hover:border-primary/50 transition-colors h-full">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
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
