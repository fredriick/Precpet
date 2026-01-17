"use client"

import Link from "next/link"
import type { Skill } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"
import { interactionFeedback, playSound } from "@/lib/feedback"

interface SkillCardProps {
  skill: Skill
  isLearned?: boolean
}

const difficultyColors = {
  beginner: "bg-emerald-500/20 text-emerald-400",
  intermediate: "bg-amber-500/20 text-amber-400",
  advanced: "bg-red-500/20 text-red-400",
}

const categoryIcons = {
  dribbling: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M12 2v4m0 16v-4m-10-6h4m16 0h-4" />
    </svg>
  ),
  passing: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
  shooting: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  defending: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  movement: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  ),
}

export function SkillCard({ skill, isLearned = false }: SkillCardProps) {
  const { userStats, toggleBookmark } = useApp()
  const isBookmarked = userStats.bookmarkedSkills.includes(skill.id)

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleBookmark(skill.id)
    playSound("bookmark")
    interactionFeedback()
  }

  return (
    <Link href={`/skills/${skill.id}`}>
      <div
        className={cn(
          "rounded-2xl bg-card p-5 border transition-all hover-lift",
          isLearned ? "border-primary/30" : "border-border",
          isBookmarked && "border-primary/50 bg-gradient-to-br from-card to-primary/5",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isLearned ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
            )}
          >
            {categoryIcons[skill.category]}
          </div>
          <div className="flex items-center gap-2">
            {isLearned && (
              <div className="flex items-center gap-1 text-primary text-xs font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learned
              </div>
            )}
            <button
              onClick={handleBookmarkClick}
              className={cn(
                "p-2 rounded-lg transition-all hover:scale-110",
                isBookmarked ? "text-red-400" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark skill"}
            >
              <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-1">{skill.name}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{skill.description}</p>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
              difficultyColors[skill.difficulty],
            )}
          >
            {skill.difficulty}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium capitalize">
            {skill.category}
          </span>
        </div>
      </div>
    </Link>
  )
}
