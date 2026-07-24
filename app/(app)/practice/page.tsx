"use client"

import { useState, useMemo, useEffect } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { Suspense } from "react"
import { PracticeContent } from "@/components/practice-content"
import { BottomNav } from "@/components/bottom-nav"
import { SkillCard } from "@/components/skill-card"
import { SkillSearch } from "@/components/skill-search"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { allSkills, getSkillsBySport } from "@/lib/skills-database"
import { trainingPrograms, getProgramsBySport } from "@/lib/programs-database"
import { getAllProgramProgress, initProgramProgress } from "@/lib/storage"
import { useApp } from "@/contexts/app-context"
import { cn } from "@/lib/utils"
import type { Skill, Sport, Program } from "@/lib/types"

type FilterCategory = "all" | Skill["category"] | "bookmarked"
type FilterDifficulty = "all" | Skill["difficulty"]
type SortOption = "recommended" | "difficulty" | "az" | "unlearned"

const difficultyRank: Record<Skill["difficulty"], number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
}

const sportIcons: Record<Sport, ReactNode> = {
  soccer: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>,
  basketball: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>,
  tennis: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>,
}

function SkillsTab() {
  const { userStats, activeSport } = useApp()
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<FilterDifficulty>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("recommended")

  const recommendedSkills = useMemo(() => {
    return getSkillsBySport(activeSport)
      .filter((s) => !userStats.skillsLearned.includes(s.id))
      .sort((a, b) => difficultyRank[a.difficulty] - difficultyRank[b.difficulty])
      .slice(0, 5)
  }, [activeSport, userStats.skillsLearned])

  const sportSkills = useMemo(() => getSkillsBySport(activeSport), [activeSport])
  const filteredSkills = sportSkills
    .filter((skill) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          skill.name.toLowerCase().includes(q) ||
          skill.description.toLowerCase().includes(q) ||
          skill.category.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      if (categoryFilter === "bookmarked") {
        if (!userStats.bookmarkedSkills.includes(skill.id)) return false
      } else if (categoryFilter !== "all" && skill.category !== categoryFilter) {
        return false
      }
      if (difficultyFilter !== "all" && skill.difficulty !== difficultyFilter) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "az":
          return a.name.localeCompare(b.name)
        case "difficulty":
          return difficultyRank[a.difficulty] - difficultyRank[b.difficulty]
        case "unlearned": {
          const aLearned = userStats.skillsLearned.includes(a.id) ? 1 : 0
          const bLearned = userStats.skillsLearned.includes(b.id) ? 1 : 0
          return aLearned - bLearned
        }
        default:
          return 0
      }
    })

  const categories: { id: FilterCategory; label: string; icon?: ReactNode }[] = [
    { id: "all", label: "All Skills" },
    { id: "bookmarked", label: "Bookmarked", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> },
    { id: "dribbling", label: "Dribbling", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg> },
    { id: "passing", label: "Passing", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg> },
    { id: "shooting", label: "Shooting", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { id: "defending", label: "Defending", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { id: "movement", label: "Movement", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg> },
    { id: "striking", label: "Striking", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ]

  const difficulties: FilterDifficulty[] = ["all", "beginner", "intermediate", "advanced"]

  return (
    <div className="space-y-4">
      <SkillSearch onSearch={setSearchQuery} />

      {!searchQuery && categoryFilter === "all" && recommendedSkills.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recommended for You</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-3">
            {recommendedSkills.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.id}`}
                className="flex-shrink-0 w-44 rounded-2xl bg-card border border-border p-4 hover:border-primary/40 transition-all hover-lift"
              >
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-2",
                    skill.difficulty === "beginner" && "bg-emerald-500/10 text-emerald-500",
                    skill.difficulty === "intermediate" && "bg-amber-500/10 text-amber-500",
                    skill.difficulty === "advanced" && "bg-red-500/10 text-red-500",
                  )}
                >
                  {skill.difficulty}
                </span>
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{skill.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">{skill.category}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide md:overflow-visible">
        <div className="flex gap-2 min-w-max pb-2 md:min-w-0 md:flex-wrap">
          {categories.map((cat) => {
            const isActive = categoryFilter === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {difficulties.map((diff) => (
          <button
            key={diff}
            onClick={() => setDifficultyFilter(diff)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              difficultyFilter === diff
                ? "bg-accent/50 border-accent text-accent-foreground"
                : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            )}
          >
            {diff === "all" ? "All Levels" : diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Sort by</span>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {([
            { id: "recommended", label: "Recommended" },
            { id: "difficulty", label: "Difficulty" },
            { id: "az", label: "A-Z" },
            { id: "unlearned", label: "Not Learned" },
          ] as { id: SortOption; label: string }[]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                sortBy === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredSkills.map((skill, index) => (
          <div
            key={skill.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <SkillCard
              skill={skill}
              isLearned={userStats.skillsLearned.includes(skill.id)}
            />
          </div>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">No skills found</h3>
          <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
            We couldn&apos;t find any skills matching your filters. Try adjusting them!
          </p>
        </div>
      )}
    </div>
  )
}

function ProgramsTab() {
  const { activeSport } = useApp()
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | Program["difficulty"]>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | Program["category"]>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [programProgress, setProgramProgress] = useState<Record<string, { completedSteps: number; totalSteps: number }>>({})

  useEffect(() => {
    const enriched: Record<string, { completedSteps: number; totalSteps: number }> = {}
    for (const p of trainingPrograms) {
      const init = initProgramProgress(p.id, p.steps.length)
      enriched[p.id] = init
    }
    setProgramProgress(enriched)
  }, [])

  const availableCategories = useMemo(() => {
    const set = new Set<Program["category"]>()
    for (const p of trainingPrograms) set.add(p.category)
    return Array.from(set)
  }, [])

  const inProgressPrograms = useMemo(() => {
    return trainingPrograms.filter((p) => {
      const prog = programProgress[p.id]
      return prog && prog.completedSteps > 0 && prog.completedSteps < prog.totalSteps
    })
  }, [programProgress])

  const bySport = useMemo(() => getProgramsBySport(activeSport), [activeSport])
  const filtered = bySport.filter((p) => {
    if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) return false
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false
    }
    return true
  })

  const difficultyStyles = {
    beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    intermediate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    advanced: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  const categoryIcons: Record<string, ReactNode> = {
    dribbling: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>,
    passing: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
    shooting: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    defending: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    fitness: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
    full: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
  }

  const renderProgram = (program: Program) => {
    const prog = programProgress[program.id]
    const completed = prog?.completedSteps ?? 0
    const total = prog?.totalSteps ?? program.steps.length
    const done = completed >= total && total > 0
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0

    return (
      <Link key={program.id} href={`/programs/${program.id}`} className="block">
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
  }

  return (
    <div className="space-y-4">
      <SkillSearch onSearch={setSearchQuery} placeholder="Search programs..." />

      <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-wrap md:flex-nowrap">
        {(["beginner", "intermediate", "advanced"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setDifficultyFilter(difficultyFilter === f ? "all" : f)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap",
              difficultyFilter === f
                ? "bg-primary/20 border-primary text-primary"
                : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50",
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-wrap md:flex-nowrap">
        {(["all", ...availableCategories] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap capitalize",
              categoryFilter === c
                ? "bg-primary/20 border-primary text-primary"
                : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50",
            )}
          >
            {c === "all" ? "All Types" : c === "full" ? "Full Session" : c}
          </button>
        ))}
      </div>

      {inProgressPrograms.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 2.25-4.5 2.25v-4.5z" />
            </svg>
            Continue Training
          </h2>
          {inProgressPrograms.map((program) => renderProgram(program))}
          <div className="border-b border-border/50 pt-1" />
        </section>
      )}

      {filtered.map((program) => renderProgram(program))}

      {filtered.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">No programs found</h3>
          <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
            Try adjusting your filters or search.
          </p>
        </div>
      )}
    </div>
  )
}

function PracticeTab() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  )
}

function SportSwitcher() {
  const { settings, activeSport, setActiveSport } = useApp()
  const [open, setOpen] = useState(false)
  const sports = settings.preferredSports

  if (sports.length <= 1) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{sportIcons[activeSport]}</span>
        <span className="text-sm font-medium capitalize">{activeSport}</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border transition-colors"
      >
        <span className="text-lg">{sportIcons[activeSport]}</span>
        <span className="text-sm font-medium capitalize">{activeSport}</span>
        <svg className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[140px]">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => {
                  setActiveSport(sport)
                  setOpen(false)
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors",
                  activeSport === sport
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-secondary/50 text-foreground",
                )}
              >
                <span>{sportIcons[sport]}</span>
                <span className="capitalize">{sport}</span>
                {activeSport === sport && (
                  <svg className="w-4 h-4 ml-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 pt-4 pb-0 max-w-lg md:max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Training</h1>
              <p className="text-muted-foreground text-xs">Skills, programs & practice</p>
            </div>
            <SportSwitcher />
          </div>
          <Tabs defaultValue="practice">
            <TabsList className="w-full bg-secondary/50">
              <TabsTrigger value="skills" className="flex-1 text-xs">Skills</TabsTrigger>
              <TabsTrigger value="programs" className="flex-1 text-xs">Programs</TabsTrigger>
              <TabsTrigger value="practice" className="flex-1 text-xs">Practice</TabsTrigger>
            </TabsList>
            <div className="py-4">
              <TabsContent value="skills">
                <SkillsTab />
              </TabsContent>
              <TabsContent value="programs">
                <ProgramsTab />
              </TabsContent>
              <TabsContent value="practice">
                <PracticeTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </header>

      <main className="px-4 max-w-lg md:max-w-5xl mx-auto">
      </main>

      <BottomNav />
    </div>
  )
}
