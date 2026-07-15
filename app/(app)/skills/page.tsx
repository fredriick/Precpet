"use client"

import { useState, useMemo } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { SkillCard } from "@/components/skill-card"
import { SkillSearch } from "@/components/skill-search"
import { allSkills, getSkillsBySport } from "@/lib/skills-database"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Skill, Sport } from "@/lib/types"

type FilterCategory = "all" | Skill["category"] | "bookmarked"
type FilterDifficulty = "all" | Skill["difficulty"]
type SortOption = "recommended" | "difficulty" | "az" | "unlearned"

const difficultyRank: Record<Skill["difficulty"], number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
}

export default function SkillsPage() {
  const { userStats, settings } = useApp()
  const [sportFilter, setSportFilter] = useState<Sport | "all">(settings.preferredSport)
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<FilterDifficulty>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("recommended")

  const recommendedSkills = useMemo(() => {
    const pref = settings.preferredDifficulty === "all" ? "beginner" : settings.preferredDifficulty
    return getSkillsBySport(settings.preferredSport)
      .filter((s) => !userStats.skillsLearned.includes(s.id))
      .sort((a, b) => {
        const aMatch = a.difficulty === pref ? 0 : 1
        const bMatch = b.difficulty === pref ? 0 : 1
        if (aMatch !== bMatch) return aMatch - bMatch
        return difficultyRank[a.difficulty] - difficultyRank[b.difficulty]
      })
      .slice(0, 5)
  }, [settings.preferredSport, settings.preferredDifficulty, userStats.skillsLearned])

  const sportSkills = sportFilter === "all" ? allSkills : getSkillsBySport(sportFilter)
  const filteredSkills = sportSkills
    .filter((skill) => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          skill.name.toLowerCase().includes(q) ||
          skill.description.toLowerCase().includes(q) ||
          skill.category.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }

      // Category filter
      if (categoryFilter === "bookmarked") {
        if (!userStats.bookmarkedSkills.includes(skill.id)) return false
      } else if (categoryFilter !== "all" && skill.category !== categoryFilter) {
        return false
      }

      // Difficulty filter
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-4 max-w-lg md:max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Skills Library</h1>
              <p className="text-muted-foreground text-xs">Master these moves</p>
            </div>
            <div className="text-xs font-medium px-3 py-1 rounded-full bg-secondary border border-border">
              {filteredSkills.length} {filteredSkills.length === 1 ? "skill" : "skills"}
            </div>
          </div>
          <SkillSearch onSearch={setSearchQuery} />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg md:max-w-5xl mx-auto space-y-5">
        {/* Recommended for you */}
        {!searchQuery && categoryFilter === "all" && recommendedSkills.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recommended for You</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
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

        {/* Sport Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-wrap md:flex-nowrap">
          {(["all", "soccer", "basketball", "tennis"] as const).map((sport) => (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border",
                sportFilter === sport
                  ? "bg-accent/50 border-accent text-accent-foreground"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              {sport === "all" ? "All" : <span className="inline-flex items-center gap-1">
                {sport === "soccer" ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>
                ) : sport === "basketball" ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 2v20M2 12h20" opacity={0.4} /></svg>
                )}
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </span>}
            </button>
          ))}
        </div>

        {/* Category Filter */}
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

        {/* Difficulty Filter */}
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

        {/* Sort */}
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

        {/* Skills Grid */}
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
              We couldn't find any skills matching your filters. Try adjusting them!
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSportFilter("all")
                setCategoryFilter("all")
                setDifficultyFilter("all")
                setSearchQuery("")
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
