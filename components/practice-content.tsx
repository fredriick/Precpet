"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { MotionIndicator } from "@/components/motion-indicator"
import { Button } from "@/components/ui/button"
import { useMotionSensor } from "@/hooks/use-motion-sensor"
import { useApp } from "@/contexts/app-context"
import { getSkillById, allSkills, getSkillsBySport } from "@/lib/skills-database"
import { celebratoryFeedback } from "@/lib/feedback"
import { markProgramStepComplete, getProgramProgress, initProgramProgress, savePracticeSession } from "@/lib/storage"
import { trainingPrograms } from "@/lib/programs-database"
import { cn } from "@/lib/utils"
import type { Skill, PracticeSession, Sport } from "@/lib/types"

const REST_SECONDS = 15

export function PracticeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const skillId = searchParams.get("skill")
  const programId = searchParams.get("program")
  const programStep = searchParams.get("step")
  const selectedSkill = skillId ? getSkillById(skillId) : null

  const { isSupported, isTracking, analysis, startTracking, stopTracking, permissionStatus } = useMotionSensor()
  const { addSession, finishSession, settings, sessions } = useApp()

  const [practiceState, setPracticeState] = useState<"idle" | "active" | "paused" | "complete">("idle")
  const [sessionTime, setSessionTime] = useState(0)
  const [fluidityHistory, setFluidityHistory] = useState<number[]>([])
  const [currentSkill, setCurrentSkill] = useState<Skill | null>(selectedSkill ?? null)
  const [selectedSport, setSelectedSport] = useState<Sport>(settings.preferredSport)

  useEffect(() => {
    setSelectedSport(settings.preferredSport)
  }, [settings.preferredSport])
  const [showSkillPicker, setShowSkillPicker] = useState(!selectedSkill)
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null)
  const [completedSession, setCompletedSession] = useState<PracticeSession | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [goalMinutes, setGoalMinutes] = useState<number | null>(() => {
    const goal = settings.weeklyGoalMinutes || 0
    // Per-session target: a reasonable slice of the weekly goal (min 5, max 30).
    if (goal <= 0) return null
    return Math.min(30, Math.max(5, Math.round(goal / 7)))
  })
  const [sessionNotes, setSessionNotes] = useState("")
  const [newBests, setNewBests] = useState<{ avg: boolean; peak: boolean; duration: boolean }>({
    avg: false,
    peak: false,
    duration: false,
  })

  // Program drill state
  const program = programId ? trainingPrograms.find((p) => p.id === programId) : null
  const stepIndex = programStep ? parseInt(programStep) : 0
  const currentStep = program?.steps[stepIndex]
  const totalProgramSteps = program?.steps.length ?? 0
  const [drillPhase, setDrillPhase] = useState<"idle" | "drilling" | "step-complete" | "resting">("idle")
  const [drillTimer, setDrillTimer] = useState(currentStep?.duration ?? 30)
  const [restTimer, setRestTimer] = useState(REST_SECONDS)
  const [drillReps, setDrillReps] = useState(0)
  const [drillStepIndex, setDrillStepIndex] = useState(stepIndex)

  // Drill timer countdown
  useEffect(() => {
    if (drillPhase !== "drilling") return
    const interval = setInterval(() => {
      setDrillTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setDrillPhase("step-complete")
          if (settings.hapticFeedback && navigator.vibrate) navigator.vibrate(200)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [drillPhase, settings.hapticFeedback])

  // Rest timer countdown between drill steps
  useEffect(() => {
    if (drillPhase !== "resting") return
    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setDrillPhase("idle")
          if (settings.hapticFeedback && navigator.vibrate) navigator.vibrate(80)
          return REST_SECONDS
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [drillPhase, settings.hapticFeedback])

  const skipRest = useCallback(() => {
    setDrillPhase("idle")
    setRestTimer(REST_SECONDS)
  }, [])

  const startDrill = useCallback(() => {
    setDrillPhase("drilling")
    setDrillTimer(currentStep?.duration ?? 30)
    setDrillReps(0)
  }, [currentStep])

  const tapRep = useCallback(() => {
    setDrillReps((prev) => {
      const next = prev + 1
      if (next >= (currentStep?.reps ?? Infinity) && drillPhase === "drilling") {
        setDrillPhase("step-complete")
        setDrillTimer(0)
        if (settings.hapticFeedback && navigator.vibrate) navigator.vibrate(200)
      }
      return Math.min(next, currentStep?.reps ?? Infinity)
    })
    if (settings.hapticFeedback && navigator.vibrate) navigator.vibrate(30)
  }, [currentStep, drillPhase, settings.hapticFeedback])

  const computeNewBests = useCallback(
    (avg: number, peak: number, durationSec: number) => {
      const prior = sessions.filter((s) => s.id !== currentSession?.id && s.completed)
      let bestAvg = 0
      let bestPeak = 0
      let bestDur = 0
      for (const s of prior) {
        if (s.fluidityScores.length > 0) {
          const a = Math.round(s.fluidityScores.reduce((x, y) => x + y, 0) / s.fluidityScores.length)
          if (a > bestAvg) bestAvg = a
          const p = Math.max(...s.fluidityScores)
          if (p > bestPeak) bestPeak = p
        }
        if (s.endTime) {
          const d = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000
          if (d > bestDur) bestDur = d
        }
      }
      setNewBests({
        avg: avg > 0 && avg > bestAvg,
        peak: peak > 0 && peak > bestPeak,
        duration: durationSec > 0 && durationSec > bestDur,
      })
    },
    [sessions, currentSession],
  )

  const advanceStep = useCallback(() => {
    const nextIdx = drillStepIndex + 1
    if (nextIdx >= totalProgramSteps) {
      stopTracking()
      setPracticeState("complete")
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1000)
      const avg =
        fluidityHistory.length > 0
          ? Math.round(fluidityHistory.reduce((a, b) => a + b, 0) / fluidityHistory.length)
          : 0
      const peak = fluidityHistory.length > 0 ? Math.max(...fluidityHistory) : 0
      computeNewBests(avg, peak, sessionTime)
      if (currentSession) {
        setCompletedSession({
          ...currentSession,
          endTime: new Date().toISOString(),
          fluidityScores: fluidityHistory,
          completed: true,
        })
        finishSession(currentSession, fluidityHistory, sessionNotes.trim() || undefined)
      }
      if (programId) {
        const prog = trainingPrograms.find((p) => p.id === programId)
        if (prog) {
          initProgramProgress(programId, prog.steps.length)
          markProgramStepComplete(programId)
        }
      }
      celebratoryFeedback()
      return
    }
    setDrillStepIndex(nextIdx)
    setDrillPhase("resting")
    setRestTimer(REST_SECONDS)
    setDrillTimer(program?.steps[nextIdx].duration ?? 30)
    setDrillReps(0)
    router.replace(`/practice?skill=${program?.steps[nextIdx].skillId}&program=${programId}&step=${nextIdx}`, { scroll: false })
  }, [drillStepIndex, totalProgramSteps, stopTracking, currentSession, fluidityHistory, finishSession, sessionNotes, computeNewBests, sessionTime, programId, program, router])

  // Feedback messages based on performance
  const getEncouragement = (fluidity: number) => {
    if (fluidity > 80) return "Incredible flow!"
    if (fluidity > 60) return "Looking good! Keep it smooth"
    if (fluidity > 40) return "You're getting there!"
    return "Focus on control and balance"
  }

  // Filter skills based on user preference
  const sportFiltered = getSkillsBySport(selectedSport)
  const filteredSkills =
    settings.preferredDifficulty === "all"
      ? sportFiltered
      : sportFiltered.filter((s) => s.difficulty === settings.preferredDifficulty)

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
        id: crypto.randomUUID(),
        skillId: currentSkill.id,
        sport: currentSkill.sport,
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
    setTimeout(() => setShowConfetti(false), 1000)

    const avg =
      fluidityHistory.length > 0
        ? Math.round(fluidityHistory.reduce((a, b) => a + b, 0) / fluidityHistory.length)
        : 0
    const peak = fluidityHistory.length > 0 ? Math.max(...fluidityHistory) : 0
    computeNewBests(avg, peak, sessionTime)

    // Save completed session
    if (currentSession) {
      setCompletedSession({
        ...currentSession,
        endTime: new Date().toISOString(),
        fluidityScores: fluidityHistory,
        completed: true,
      })
      finishSession(currentSession, fluidityHistory, sessionNotes.trim() || undefined)
    }

    // Auto-advance program step if practicing from a program
    if (programId) {
      const prog = trainingPrograms.find((p) => p.id === programId)
      if (prog) {
        initProgramProgress(programId, prog.steps.length)
        const stepIdx = programStep ? parseInt(programStep) : 0
        if (stepIdx < prog.steps.length) {
          markProgramStepComplete(programId)
        }
      }
    }

    // Unified feedback
    celebratoryFeedback()
  }, [stopTracking, currentSession, fluidityHistory, finishSession, sessionNotes, computeNewBests, sessionTime, programId, programStep])

  const resetPractice = useCallback(() => {
    setPracticeState("idle")
    setSessionTime(0)
    setFluidityHistory([])
    setCurrentSession(null)
    setShowConfetti(false)
    setSessionNotes("")
    setCompletedSession(null)
    setNewBests({ avg: false, peak: false, duration: false })
  }, [])

  const saveNote = useCallback(() => {
    if (!completedSession) return
    savePracticeSession({ ...completedSession, notes: sessionNotes.trim() || undefined })
  }, [completedSession, sessionNotes])

  const selectSkill = (skill: Skill) => {
    setCurrentSkill(skill)
    setShowSkillPicker(false)
  }

  const avgFluidity =
    fluidityHistory.length > 0 ? Math.round(fluidityHistory.reduce((a, b) => a + b, 0) / fluidityHistory.length) : 0

  const peakFluidity = fluidityHistory.length > 0 ? Math.max(...fluidityHistory) : 0

  const fluidityZones = (() => {
    if (fluidityHistory.length === 0) return { low: 0, mid: 0, high: 0 }
    let low = 0
    let mid = 0
    let high = 0
    for (const s of fluidityHistory) {
      if (s < 40) low++
      else if (s < 70) mid++
      else high++
    }
    const total = fluidityHistory.length
    return {
      low: Math.round((low / total) * 100),
      mid: Math.round((mid / total) * 100),
      high: Math.round((high / total) * 100),
    }
  })()

  const hasNewBest = newBests.avg || newBests.peak || newBests.duration

  const goalMet = goalMinutes !== null && sessionTime >= goalMinutes * 60

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${30 + Math.random() * 40}%`,
                backgroundColor: ['#ff6b6b', '#ffd93d', '#4facfe'][Math.floor(Math.random() * 3)],
                animationDelay: `${Math.random() * 0.5}s`,
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
              <h1 className="text-2xl font-bold">
                <svg className="w-6 h-6 inline-block mr-2 -mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} />
                </svg>
                Practice
              </h1>
              {currentSkill && <p className="text-primary text-sm font-medium animate-slide-up">{currentSkill.name}</p>}
              {programId && (
                <div className="text-xs text-muted-foreground animate-slide-up">
                    <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Step {drillStepIndex + 1}/{totalProgramSteps}
                  {currentStep && ` · ${drillReps}/${currentStep.reps} reps`}
                </div>
              )}
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
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                      What are we training?
                    </h2>
                  </div>
                </div>
                {/* Sport Filter */}
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {(["soccer", "basketball", "tennis"] as const).map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setSelectedSport(sport)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                        selectedSport === sport
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      {sport === "soccer" ? (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>
                          Soccer
                        </span>
                      ) : sport === "basketball" ? (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>
                          Basketball
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>
                          Tennis
                        </span>
                      )}
                    </button>
                  ))}
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
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
            <p className="text-muted-foreground mb-8">You crushed that practice session! Here is how you did:</p>

            {hasNewBest && (
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 p-4 animate-bounce-in">
                <p className="text-amber-500 font-bold flex items-center justify-center gap-1.5 mb-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                  </svg>
                  New Personal Best!
                </p>
                <p className="text-xs text-amber-500/80">
                  {[
                    newBests.avg && "Highest average flow",
                    newBests.peak && "New peak flow",
                    newBests.duration && "Longest session",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            )}

            {goalMinutes && (
              <div className={cn("mb-6 px-4 py-2 rounded-xl text-sm font-medium inline-block", goalMet ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                {goalMet ? (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Goal met!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {Math.max(0, goalMinutes - Math.floor(sessionTime / 60))}min to reach your goal
                  </span>
                )}
              </div>
            )}

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

            {/* Fluidity Zone Breakdown */}
            {fluidityHistory.length > 0 && (
              <div className="mb-8 text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 text-center">Flow Zones</p>
                <div className="flex h-3 rounded-full overflow-hidden mb-3">
                  {fluidityZones.high > 0 && <div className="bg-emerald-500" style={{ width: `${fluidityZones.high}%` }} />}
                  {fluidityZones.mid > 0 && <div className="bg-amber-500" style={{ width: `${fluidityZones.mid}%` }} />}
                  {fluidityZones.low > 0 && <div className="bg-red-500" style={{ width: `${fluidityZones.low}%` }} />}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-emerald-500">{fluidityZones.high}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase">High</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-500">{fluidityZones.mid}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Mid</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-500">{fluidityZones.low}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Low</p>
                  </div>
                </div>
              </div>
            )}

            {/* Session Notes */}
            <div className="mb-8 text-left">
              <label htmlFor="session-notes" className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Session Notes
              </label>
              <textarea
                id="session-notes"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                onBlur={saveNote}
                rows={3}
                placeholder="How did it feel? What to focus on next time?"
                className="w-full rounded-xl bg-secondary/30 border border-border p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

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
            {practiceState === "active" && !programId && (
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-center text-sm font-medium animate-pulse">
                {getEncouragement(analysis.fluidityScore)}
              </div>
            )}

            {/* Program Drill Timer & Rep Counter */}
            {programId && currentStep && practiceState === "active" && (
              <div className="rounded-3xl bg-card border border-primary/20 p-6 text-center shadow-sm">
                {/* Step progress dots */}
                <div className="flex justify-center gap-1.5 mb-4">
                  {Array.from({ length: totalProgramSteps }).map((_, i) => (
                    <div key={i} className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i < drillStepIndex && "bg-emerald-500",
                      i === drillStepIndex && "bg-primary",
                      i > drillStepIndex && "bg-secondary",
                    )} />
                  ))}
                </div>

                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Step {drillStepIndex + 1}</p>
                <p className="text-sm text-muted-foreground mb-4">{currentStep.instruction}</p>

                {/* Rest phase between drills */}
                {drillPhase === "resting" && (
                  <div className="py-2 animate-slide-up">
                    <p className="text-xs uppercase tracking-wider text-emerald-500 font-semibold mb-3">Rest &amp; Recover</p>
                    <div className="relative w-36 h-36 mx-auto mb-4">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--secondary)" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="6"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - restTimer / REST_SECONDS)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-4xl font-mono font-bold text-emerald-500">{restTimer}s</p>
                      </div>
                    </div>
                    <button
                      onClick={skipRest}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Skip Rest
                    </button>
                  </div>
                )}

                {/* Timer */}
                {drillPhase !== "resting" && (
                <div className="relative w-36 h-36 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--secondary)" strokeWidth="6" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke="var(--primary)" strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - (drillPhase === "drilling" ? drillTimer / (currentStep.duration || 1) : 1))}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {drillPhase === "idle" ? (
                      <button
                        onClick={startDrill}
                        className="w-20 h-20 rounded-full bg-primary text-primary-foreground text-lg font-bold flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                      >
                        Go
                      </button>
                    ) : (
                      <div className="text-center">
                        <p className="text-4xl font-mono font-bold text-primary">{drillTimer}s</p>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Rep Counter */}
                {(drillPhase === "drilling" || drillPhase === "step-complete") && (
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reps</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={tapRep}
                          disabled={drillPhase === "step-complete"}
                          className={cn(
                            "w-16 h-16 rounded-2xl font-bold text-2xl transition-all",
                            drillPhase === "drilling"
                              ? "bg-primary/20 text-primary border-2 border-primary hover:bg-primary/30 active:scale-95"
                              : "bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500",
                          )}
                        >
                          {drillReps}
                        </button>
                        <span className="text-sm text-muted-foreground">/ {currentStep.reps}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Complete */}
                {drillPhase === "step-complete" && (
                  <div className="mt-4 animate-slide-up">
                    <p className="text-emerald-500 font-semibold mb-2 flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Step complete!
                    </p>
                    <button
                      onClick={advanceStep}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                    >
                      {drillStepIndex + 1 >= totalProgramSteps ? (
                        <span className="inline-flex items-center gap-1.5">
                          Complete Program
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      ) : "Next Step →"}
                    </button>
                  </div>
                )}
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
            {/* Goal Setting */}
            {currentSkill && (
              <div className="rounded-2xl bg-card border border-border p-5">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Set a Goal</h3>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setGoalMinutes(goalMinutes === mins ? null : mins)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                        goalMinutes === mins
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      {mins} min
                    </button>
                  ))}
                  <button
                    onClick={() => setGoalMinutes(null)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                      goalMinutes === null
                        ? "bg-secondary border-border text-muted-foreground"
                        : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    No goal
                  </button>
                </div>
              </div>
            )}

            {!isSupported && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex gap-3 items-start">
                <svg className="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-amber-600 text-sm">
                  Motion sensors unavailable. For the best coaching experience, use a mobile device!
                </p>
              </div>
            )}
            {permissionStatus === "denied" && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex gap-3 items-start">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <p className="text-red-600 text-sm">
                  Motion access denied. We need that to track your sweet moves! Enable it in settings.
                </p>
              </div>
            )}
          </>
        )}

        {/* Bottom Controls */}
        {practiceState !== "complete" && (
          <div className="fixed bottom-0 left-0 right-0 md:bg-transparent md:static p-4 pb-8 safe-area-pb bg-gradient-to-t from-background via-background/95 to-transparent z-30">
            <div className="max-w-lg md:max-w-5xl mx-auto">
              {practiceState === "idle" && (
                <Button
                  onClick={startPractice}
                  disabled={!isSupported || permissionStatus === "denied"}
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                >
                  {currentSkill ? (
                    <span className="inline-flex items-center gap-2">
                      Let's Do This!
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    </span>
                  ) : "Pick a Drill"}
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
