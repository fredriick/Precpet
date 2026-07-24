"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type { ReactNode } from "react"
import { trainingPrograms } from "@/lib/programs-database"
import { getProgramProgress, resetProgramProgress, initProgramProgress } from "@/lib/storage"
import { cn } from "@/lib/utils"

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const program = trainingPrograms.find((p) => p.id === id)
  const [progress, setProgress] = useState(() => getProgramProgress(id))
  const [animatingStep, setAnimatingStep] = useState<number | null>(null)

  useEffect(() => {
    if (program) {
      initProgramProgress(program.id, program.steps.length)
      setProgress(getProgramProgress(id))
    }
  }, [id, program])

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">Program not found</p>
        <Link href="/practice" className="text-primary underline text-sm">Back to training</Link>
      </div>
    )
  }

  const completed = progress?.completedSteps ?? 0
  const total = program.steps.length
  const done = completed >= total
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const handlePracticeStep = (stepIndex: number) => {
    const step = program.steps[stepIndex]
    if (!step) return
    router.push(`/practice?skill=${step.skillId}&program=${program.id}&step=${stepIndex}`)
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    dribbling: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>,
    passing: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
    shooting: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    defending: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    fitness: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
    full: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
  }

  const difficultyStyles = {
    beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    intermediate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    advanced: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3 max-w-lg md:max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/practice" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold truncate">{program.name}</h1>
            <p className="text-xs text-muted-foreground">
              {total} drills · {program.estimatedMinutes} min
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto space-y-6">
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
              {categoryIcons[program.category] || <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border", difficultyStyles[program.difficulty])}>
                  {program.difficulty}
                </span>
                {done && <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Complete
                </span>}
              </div>
              <p className="text-sm text-muted-foreground mt-2">{program.description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-mono font-bold text-primary">{completed}/{total}</span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", done ? "bg-emerald-500" : "bg-primary")}
                style={{ width: `${pct}%` }}
              />
            </div>
            {progress?.lastPracticed && (
              <p className="text-xs text-muted-foreground text-right">
                Last practiced: {new Date(progress.lastPracticed).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Drills</h2>
          <div className="space-y-3">
            {program.steps.map((step, i) => {
              const isCompleted = i < completed
              const isCurrent = i === completed
              const isFuture = i > completed

              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-2xl border p-4 transition-all duration-300",
                    isCompleted && "border-emerald-500/30 bg-emerald-500/5",
                    isCurrent && "border-primary/50 bg-primary/5 cursor-pointer hover:border-primary",
                    isFuture && "border-border bg-card opacity-60",
                    animatingStep === i && "scale-[1.02] border-primary",
                  )}
                  onClick={() => (isCurrent ? handlePracticeStep(i) : null)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        isCompleted && "bg-emerald-500 border-emerald-500",
                        isCurrent && "border-primary",
                        isFuture && "border-muted-foreground/30",
                      )}
                    >
                      {isCompleted ? (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-medium text-sm">Step {i + 1}</h3>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {step.reps}x · {step.duration}s
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.instruction}</p>
                    </div>
                    {isCurrent && !done && (
                      <div className="shrink-0 self-center">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {completed === 0 && (
          <div className="text-center">
            <button
              onClick={() => handlePracticeStep(0)}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Start Program
              <svg className="w-5 h-5 inline-block ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </button>
          </div>
        )}

        {done && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-semibold text-emerald-500 mb-1">Program Complete!</p>
            <p className="text-sm text-muted-foreground">
              {progress?.completedAt
                ? `Completed on ${new Date(progress.completedAt).toLocaleDateString()}`
                : "Great work finishing this program!"}
            </p>
            <button
              onClick={() => {
                resetProgramProgress(program.id)
                setProgress(getProgramProgress(id))
              }}
              className="mt-3 text-xs text-muted-foreground underline hover:text-foreground"
            >
              Reset steps to redo
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
