"use client"

import { useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { SkillCard } from "@/components/skill-card"
import { SkillSearch } from "@/components/skill-search"
import { soccerSkills } from "@/lib/skills-database"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Skill } from "@/lib/types"

type FilterCategory = "all" | Skill["category"] | "bookmarked"
type FilterDifficulty = "all" | Skill["difficulty"]

export default function SkillsPage() {
  const { userStats } = useApp()
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<FilterDifficulty>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSkills = soccerSkills.filter((skill) => {
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

  const categories: { id: FilterCategory; label: string; icon?: string }[] = [
    { id: "all", label: "All Skills" },
    { id: "bookmarked", label: "Bookmarked", icon: "❤️" },
    { id: "dribbling", label: "Dribbling", icon: "⚽" },
    { id: "passing", label: "Passing", icon: "👟" },
    { id: "shooting", label: "Shooting", icon: "🥅" },
    { id: "defending", label: "Defending", icon: "🛡️" },
    { id: "movement", label: "Movement", icon: "🏃" },
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
              <p className="text-muted-foreground text-xs">Master these moves 🏆</p>
            </div>
            <div className="text-xs font-medium px-3 py-1 rounded-full bg-secondary border border-border">
              {filteredSkills.length} {filteredSkills.length === 1 ? "skill" : "skills"}
            </div>
          </div>
          <SkillSearch onSearch={setSearchQuery} />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg md:max-w-5xl mx-auto space-y-5">
        {/* Category Filter */}
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-2 min-w-max pb-2">
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
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4 text-3xl">
              🔍
            </div>
            <h3 className="font-semibold text-lg mb-2">No skills found</h3>
            <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
              We couldn't find any skills matching your filters. Try adjusting them!
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
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
