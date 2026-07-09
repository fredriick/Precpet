"use client"

import { useState } from "react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { trainingPrograms } from "@/lib/programs-database"
import { cn } from "@/lib/utils"
import type { Program } from "@/lib/types"

export default function ProgramsPage() {
  const [filter, setFilter] = useState<"all" | Program["difficulty"]>("all")

  const filtered = filter === "all" ? trainingPrograms : trainingPrograms.filter((p) => p.difficulty === filter)

  const difficultyStyles = {
    beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    intermediate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    advanced: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  const categoryIcons: Record<string, string> = {
    dribbling: "⚽",
    passing: "👟",
    shooting: "🥅",
    defending: "🛡️",
    fitness: "💪",
    full: "🏆",
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-4 max-w-lg md:max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Training Programs 🏋️</h1>
          <p className="text-muted-foreground text-xs">Structured workouts to level up fast</p>
        </div>
        <div className="px-4 pb-3 max-w-lg md:max-w-5xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
          {(["all", "beginner", "intermediate", "advanced"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap",
                filter === f
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
        {filtered.map((program) => (
          <Link key={program.id} href={`/programs/${program.id}`}>
            <div className="rounded-2xl bg-card border border-border p-5 hover:border-primary/40 transition-all hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                    {categoryIcons[program.category] || "🏆"}
                  </div>
                  <div>
                    <h3 className="font-semibold">{program.name}</h3>
                    <p className="text-xs text-muted-foreground">{program.steps.length} drills · {program.estimatedMinutes} min</p>
                  </div>
                </div>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border", difficultyStyles[program.difficulty])}>
                  {program.difficulty}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>
            </div>
          </Link>
        ))}
      </main>
      <BottomNav />
    </div>
  )
}
