"use client"

import { use } from "react"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { getProgramById } from "@/lib/programs-database"
import { getSkillById } from "@/lib/skills-database"
import { cn } from "@/lib/utils"

interface ProgramDetailPageProps {
  params: Promise<{ id: string }>
}

const difficultyStyles = {
  beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
}

const categoryIcons: Record<string, string> = {
  dribbling: "⚽",
  passing: "👟",
  shooting: "🥅",
  defending: "🛡️",
  fitness: "💪",
  full: "🏆",
}

export default function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const program = getProgramById(id)

  if (!program) {
    notFound()
  }

  const totalReps = program.steps.reduce((acc, s) => acc + s.reps, 0)

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4 px-4 h-14 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold truncate">{program.name}</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-900/20 via-card to-card border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl">
              {categoryIcons[program.category] || "🏆"}
            </div>
            <div>
              <h2 className="text-xl font-bold">{program.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border", difficultyStyles[program.difficulty])}>
                  {program.difficulty}
                </span>
                <span className="text-xs text-muted-foreground">{program.steps.length} drills</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{program.estimatedMinutes} min</span>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">{program.description}</p>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-primary">{program.steps.length}</p>
              <p className="text-[10px] uppercase text-muted-foreground">Drills</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-foreground">{totalReps}</p>
              <p className="text-[10px] uppercase text-muted-foreground">Reps</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-400">{program.estimatedMinutes}</p>
              <p className="text-[10px] uppercase text-muted-foreground">Minutes</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Workout Plan</h3>
          <div className="space-y-4">
            {program.steps.map((step, i) => {
              const skill = getSkillById(step.skillId)
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm truncate">{skill?.name || "Drill"}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{step.reps} reps · {step.duration}m</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.instruction}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="fixed bottom-16 md:bottom-6 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent md:bg-gradient-to-t md:from-background/95 md:via-background/80 md:to-transparent">
          <div className="max-w-lg mx-auto">
            <Link href={`/practice?skill=${program.steps[0].skillId}`}>
              <Button className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
                Start Program 🚀
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
