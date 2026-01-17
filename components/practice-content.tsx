"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { MotionIndicator } from "@/components/motion-indicator"
import { Button } from "@/components/ui/button"
import { useMotionSensor } from "@/hooks/use-motion-sensor"
import { useApp } from "@/contexts/app-context"
import { getSkillById, soccerSkills } from "@/lib/skills-database"
import { cn } from "@/lib/utils"
import type { Skill, PracticeSession } from "@/lib/types"

export function PracticeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const skillId = searchParams.get("skill")
  const selectedSkill = skillId ? getSkillById(skillId) : null

  const { isSupported, isTracking, analysis, startTracking, stopTracking, permissionStatus } = useMotionSensor()
  const { addSession, finishSession, settings } = useApp()

  const [practiceState, setPracticeState] = useState<"idle" | "active" | "paused" | "complete">("idle")
  const [sessionTime, setSessionTime] = useState(0)
  const [fluidityHistory, setFluidityHistory] = useState<number[]>([])
  const [currentSkill, setCurrentSkill] = useState<Skill | null>(selectedSkill ?? null)
  const [showSkillPicker, setShowSkillPicker] = useState(!selectedSkill)
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // Feedback messages based on performance
  const getEncouragement = (fluidity: number) => {
    if (fluidity > 80) return "Incredible flow! 🔥"
    if (fluidity > 60) return "Looking good! Keep it smooth 🌊"
    if (fluidity > 40) return "You're getting there! 💪"
    return "Focus on control and balance 🧘"
  }

  // Filter skills based on user preference
  const filteredSkills =
    settings.preferredDifficulty === "all"
      ? soccerSkills
      : soccerSkills.filter((s) => s.difficulty === settings.preferredDifficulty)

  // Timer for practice session
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (practiceState === "active") {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [practiceState])

  // Record fluidity scores during practice
  useEffect(() => {
    if (practiceState === "active" && analysis.isActive && analysis.fluidityScore > 0) {
      setFluidityHistory((prev) => [...prev.slice(-50), analysis.fluidityScore])
    }
  }, [practiceState, analysis.fluidityScore, analysis.isActive])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const startPractice = useCallback(async () => {
    if (!currentSkill) {
      setShowSkillPicker(true)
      return
    }

    const started = await startTracking()
    if (started) {
      // Create new session
      const session: PracticeSession = {
        id: `session-${Date.now()}`,
        skillId: currentSkill.id,
        startTime: new Date().toISOString(),
        fluidityScores: [],
        completed: false,
      }
      setCurrentSession(session)
      addSession(session)

      setPracticeState("active")
      setSessionTime(0)
      setFluidityHistory([])

      // Haptic feedback if enabled
      if (settings.hapticFeedback && navigator.vibrate) {
        navigator.vibrate(100)
      }
    }
  }, [currentSkill, startTracking, addSession, settings.hapticFeedback])

  const pausePractice = useCallback(() => {
    setPracticeState("paused")
    if (settings.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [settings.hapticFeedback])

  const resumePractice = useCallback(() => {
    setPracticeState("active")
    if (settings.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [settings.hapticFeedback])

  const endPractice = useCallback(() => {
    stopTracking()
    setPracticeState("complete")
    setShowConfetti(true)

    // Save completed session
    if (currentSession) {
      finishSession(currentSession, fluidityHistory)
    }

    // Haptic feedback if enabled
    if (settings.hapticFeedback && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100])
    }
  }, [stopTracking, currentSession, fluidityHistory, finishSession, settings.hapticFeedback])

  const resetPractice = useCallback(() => {
    setPracticeState("idle")
    setSessionTime(0)
    setFluidityHistory([])
    setCurrentSession(null)
    setShowConfetti(false)
  }, [])

  const selectSkill = (skill: Skill) => {
    setCurrentSkill(skill)
    setShowSkillPicker(false)
  }

  const avgFluidity =
    fluidityHistory.length > 0 ? Math.round(fluidityHistory.reduce((a, b) => a + b, 0) / fluidityHistory.length) : 0

  const peakFluidity = fluidityHistory.length > 0 ? Math.max(...fluidityHistory) : 0

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex justify-center">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: '50%',
                backgroundColor: ['#ff6b6b', '#ffd93d', '#4facfe'][Math.floor(Math.random() * 3)],
                animationDelay: `${Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-4 max-w-lg md:max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Practice ⚽</h1>
              {currentSkill && <p className="text-primary text-sm font-medium animate-slide-up">{currentSkill.name}</p>}
            </div>
            {practiceState === "active" && (
              <div className="text-right animate-slide-up">
                <p className="text-3xl font-mono font-bold text-primary">{formatTime(sessionTime)}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto space-y-6">
        {/* Skill Picker Modal */}
        {showSkillPicker && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md animate-slide-up">
            <div className="h-full overflow-y-auto">
              <div className="px-4 py-6 max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => currentSkill ? setShowSkillPicker(false) : router.back()}
                      className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-xl font-bold">What are we training? 🤔</h2>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredSkills.map((skill, i) => (
                    <button
                      key={skill.id}
                      onClick={() => selectSkill(skill)}
                      className={cn(
                        "w-full text-left rounded-2xl bg-card border p-4 transition-all hover-lift",
                        currentSkill?.id === skill.id ? "border-primary ring-2 ring-primary/20" : "border-border",
                      )}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{skill.name}</h3>
                          <p className="text-muted-foreground text-sm">{skill.category}</p>
                        </div>
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            skill.difficulty === "beginner" && "bg-emerald-500/10 text-emerald-500",
                            skill.difficulty === "intermediate" && "bg-amber-500/10 text-amber-500",
                            skill.difficulty === "advanced" && "bg-red-500/10 text-red-500",
                          )}
                        >
                          {skill.difficulty}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Practice Complete Summary */}
        {practiceState === "complete" && (
          <div className="rounded-3xl bg-card border border-primary/30 p-8 glow-primary animate-bounce-in text-center">

            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-success text-white mb-6 shadow-xl">
              <span className="text-4xl">🎉</span>
            </div>

            <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
            <p className="text-muted-foreground mb-8">You crushed that practice session! Here is how you did:</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-3 bg-secondary/30 rounded-2xl">
                <p className="text-2xl font-bold font-mono text-primary">{formatTime(sessionTime)}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-60">Time</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-2xl">
                <p className="text-2xl font-bold font-mono text-foreground">{avgFluidity}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-60">Avg Flow</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-2xl">
                <p className="text-2xl font-bold font-mono text-emerald-400">{peakFluidity}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-60">Peak</p>
              </div>
            </div>

            {/* Fluidity Chart */}
            {fluidityHistory.length > 0 && (
              <div className="mb-8">
                <div className="h-20 flex items-end gap-1 px-4">
                  {fluidityHistory.slice(-40).map((score, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all bg-primary/40"
                      style={{ height: `${score}%`, opacity: 0.5 + (score / 200) }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Flow Consistency</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetPractice} className="flex-1 h-12 rounded-xl">
                One More?
              </Button>
              <Button onClick={() => router.push("/progress")} className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                See Progress
              </Button>
            </div>
          </div>
        )}

        {/* Active Practice Interface */}
        {practiceState !== "complete" && currentSkill && (
          <div className="space-y-6">

            {/* Encouragement Banner */}
            {practiceState === "active" && (
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-center text-sm font-medium animate-pulse">
                {getEncouragement(analysis.fluidityScore)}
              </div>
            )}

            <div className="rounded-3xl bg-card border border-border p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Drill</p>
                  <h2 className="text-xl font-bold">{currentSkill.name}</h2>
                </div>
                <button onClick={() => setShowSkillPicker(true)} className="text-primary text-xs font-bold uppercase tracking-wide bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors">
                  Switch
                </button>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {currentSkill.steps.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Motion Feedback */}
            {(practiceState === "active" || practiceState === "paused") && (
              <div className="relative">
                <MotionIndicator
                  fluidityScore={analysis.fluidityScore}
                  intensity={analysis.intensity}
                  isActive={analysis.isActive}
                  isTracking={isTracking && practiceState === "active"}
                />

                {/* Live Score Overlay */}
                {practiceState === "active" && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-6xl font-black text-foreground/10">{Math.round(analysis.fluidityScore)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sensor Warnings */}
        {practiceState === "idle" && (
          <>
            {!isSupported && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex gap-3 items-start">
                <span className="text-xl">⚠️</span>
                <p className="text-amber-600 text-sm">
                  Motion sensors unavailable. For the best coaching experience, use a mobile device!
                </p>
              </div>
            )}
            {permissionStatus === "denied" && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex gap-3 items-start">
                <span className="text-xl">🛑</span>
                <p className="text-red-600 text-sm">
                  Motion access denied. We need that to track your sweet moves! Enable it in settings.
                </p>
              </div>
            )}
          </>
        )}

        {/* Bottom Controls */}
        {practiceState !== "complete" && (
          <div className="fixed bottom-0 left-0 right-0 md:bg-transparent md:static p-4 pb-8 bg-gradient-to-t from-background via-background/95 to-transparent z-30">
            <div className="max-w-lg md:max-w-5xl mx-auto">
              {practiceState === "idle" && (
                <Button
                  onClick={startPractice}
                  disabled={!isSupported || permissionStatus === "denied"}
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                >
                  {currentSkill ? "Let's Do This! 🚀" : "Pick a Drill"}
                </Button>
              )}

              {practiceState === "active" && (
                <div className="flex gap-4">
                  <Button variant="outline" onClick={pausePractice} className="flex-1 h-14 rounded-2xl bg-card border-2 font-semibold">
                    Pause
                  </Button>
                  <Button onClick={endPractice} className="flex-1 h-14 rounded-2xl bg-destructive text-white font-semibold shadow-lg shadow-destructive/20">
                    Finish
                  </Button>
                </div>
              )}

              {practiceState === "paused" && (
                <div className="flex gap-4">
                  <Button variant="outline" onClick={endPractice} className="flex-1 h-14 rounded-2xl font-semibold">
                    Stop
                  </Button>
                  <Button onClick={resumePractice} className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25">
                    Resume
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
