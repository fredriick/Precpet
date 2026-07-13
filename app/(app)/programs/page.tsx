"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { trainingPrograms, getProgramsBySport } from "@/lib/programs-database"
import { getAllProgramProgress, initProgramProgress } from "@/lib/storage"
import { cn } from "@/lib/utils"
import type { Program, Sport } from "@/lib/types"

export default function ProgramsPage() {
  const [sportFilter, setSportFilter] = useState<"all" | Sport>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | Program["difficulty"]>("all")
  const [programProgress, setProgramProgress] = useState<Record<string, { completedSteps: number; totalSteps: number }>>({})

  useEffect(() => {
    const progress = getAllProgramProgress()
    const enriched: Record<string, { completedSteps: number; totalSteps: number }> = {}
    for (const p of trainingPrograms) {
      const init = initProgramProgress(p.id, p.steps.length)
      enriched[p.id] = init
    }
    setProgramProgress(enriched)
  }, [])

  const bySport = sportFilter === "all" ? trainingPrograms : getProgramsBySport(sportFilter)
  const filtered = difficultyFilter === "all" ? bySport : bySport.filter((p) => p.difficulty === difficultyFilter)

  const difficultyStyles = {
    beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    intermediate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    advanced: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    dribbling: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>,
    passing: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
    shooting: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    defending: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    fitness: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
    full: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
  }

  const sportIcons: Record<string, React.ReactNode> = {
    soccer: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>,
    basketball: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>,
    tennis: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>,
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-4 max-w-lg md:max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Training Programs</h1>
          <p className="text-muted-foreground text-xs">Structured workouts to level up fast</p>
        </div>
        <div className="px-4 pb-2 max-w-lg md:max-w-5xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide flex-wrap md:flex-nowrap">
          {(["all", "soccer", "basketball", "tennis"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSportFilter(s)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap",
                sportFilter === s
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50",
              )}
            >
              {s === "all" ? "All Sports" : <span className="inline-flex items-center gap-1.5">{sportIcons[s]} {s.charAt(0).toUpperCase() + s.slice(1)}</span>}
            </button>
          ))}
        </div>
        <div className="px-4 pb-3 max-w-lg md:max-w-5xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide flex-wrap md:flex-nowrap">
          {(["all", "beginner", "intermediate", "advanced"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setDifficultyFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap",
                difficultyFilter === f
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50",
              )}
            >
              {f === "all" ? "All Levels" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto space-y-4">
        {filtered.map((program) => {
          const prog = programProgress[program.id]
          const completed = prog?.completedSteps ?? 0
          const total = prog?.totalSteps ?? program.steps.length
          const done = completed >= total && total > 0
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0

          return (
            <Link key={program.id} href={`/programs/${program.id}`}>
              <div className="rounded-2xl bg-card border border-border p-5 hover:border-primary/40 transition-all hover-lift relative overflow-hidden">
                {done && (
                  <div className="absolute top-0 right-0 w-20 h-20">
                    <div className="absolute top-2 right-[-28px] bg-emerald-500 text-white text-[10px] font-bold uppercase px-8 py-0.5 rotate-45 shadow-lg">
                      Done
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                      {sportIcons[program.sport] || categoryIcons[program.category] || <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>}
                    </div>
                    <div>
                      <h3 className="font-semibold">{program.name}</h3>
                      <p className="text-xs text-muted-foreground">{program.steps.length} drills · {program.estimatedMinutes} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{sportIcons[program.sport]}</span>
                    {completed > 0 && (
                      <span className="text-xs font-mono text-primary">{completed}/{total}</span>
                    )}
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border", difficultyStyles[program.difficulty])}>
                      {program.difficulty}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{program.description}</p>
                {completed > 0 && (
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", done ? "bg-emerald-500" : "bg-primary")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </main>
      <BottomNav />
    </div>
  )
}
