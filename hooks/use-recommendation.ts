"use client"

import { useState, useEffect } from "react"
import type { SkillRecommendation } from "@/lib/types"
import { useApp } from "@/contexts/app-context"
import { getOrCreateSessionToken } from "@/lib/auth"

interface RecommendationState {
  recommendation: SkillRecommendation | null
  isLoading: boolean
  error: string | null
}

export function useRecommendation(motionFluidityScore: number) {
  const { userStats } = useApp()
  const [state, setState] = useState<RecommendationState>({
    recommendation: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const isInPracticeWindow = (() => {
      const hour = new Date().getHours()
      return hour >= 17 && hour <= 21
    })()

    let cancelled = false

    async function fetchRecommendation() {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetch("/api/analyze-skill-gap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": getOrCreateSessionToken(),
          },
          body: JSON.stringify({
            userStats: {
              matchesPlayed: userStats.matchesPlayed,
              ballLossesUnderPressure: userStats.ballLossesUnderPressure,
              successfulDribbles: userStats.successfulDribbles,
              passAccuracy: userStats.passAccuracy,
              shotsOnTarget: userStats.shotsOnTarget,
              avgFluidityScore: userStats.avgFluidityScore,
              practiceMinutes: userStats.practiceMinutes,
              skillsLearned: userStats.skillsLearned,
              bookmarkedSkills: userStats.bookmarkedSkills,
              achievements: userStats.achievements,
              currentStreak: userStats.currentStreak,
              longestStreak: userStats.longestStreak,
              lastPracticeDate: userStats.lastPracticeDate,
            },
            motionFluidityScore,
            isInPracticeWindow,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data: SkillRecommendation = await response.json()
        if (!cancelled) {
          setState({ recommendation: data, isLoading: false, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            recommendation: null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to get recommendation",
          })
        }
      }
    }

    fetchRecommendation()

    return () => {
      cancelled = true
    }
  }, [
    motionFluidityScore,
    userStats.matchesPlayed,
    userStats.ballLossesUnderPressure,
    userStats.successfulDribbles,
    userStats.passAccuracy,
    userStats.shotsOnTarget,
    userStats.avgFluidityScore,
    userStats.practiceMinutes,
    userStats.skillsLearned,
    userStats.bookmarkedSkills,
    userStats.achievements,
    userStats.currentStreak,
    userStats.longestStreak,
    userStats.lastPracticeDate,
  ])

  return state
}
