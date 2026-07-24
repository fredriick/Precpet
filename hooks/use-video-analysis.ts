"use client"

import { useState, useCallback } from "react"
import type { VideoAnalysisResult, Sport } from "@/lib/types"

type AnalysisState = "idle" | "uploading" | "analyzing" | "ready" | "error"

interface UseVideoAnalysisReturn {
  state: AnalysisState
  result: VideoAnalysisResult | null
  error: string | null
  analyzeVideo: (blob: Blob, skillId: string, skillName: string, sport: Sport, sessionId?: string) => Promise<void>
  reset: () => void
}

export function useVideoAnalysis(userId: string | null): UseVideoAnalysisReturn {
  const [state, setState] = useState<AnalysisState>("idle")
  const [result, setResult] = useState<VideoAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeVideo = useCallback(
    async (blob: Blob, skillId: string, skillName: string, sport: Sport, sessionId?: string) => {
      if (!userId) {
        setState("error")
        setError("Not signed in")
        return
      }

      setState("uploading")
      setError(null)

      try {
        const formData = new FormData()
        formData.append("video", blob, "practice.webm")
        formData.append("skillId", skillId)
        formData.append("sport", sport)
        formData.append("userId", userId)
        formData.append("skillName", skillName)
        if (sessionId) formData.append("sessionId", sessionId)

        setState("analyzing")

        const response = await fetch("/api/analyze-video", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || `Analysis failed (${response.status})`)
        }

        const data = await response.json()
        if (!data.success || !data.result) {
          throw new Error("Invalid response from analysis")
        }

        const analysisResult: VideoAnalysisResult = {
          passAccuracy: data.result.passAccuracy,
          successfulDribbles: data.result.successfulDribbles,
          shotsOnTarget: data.result.shotsOnTarget,
          ballControlQuality: data.result.ballControlQuality,
          techniqueForm: data.result.techniqueForm,
          confidence: data.result.confidence,
          summary: data.result.summary,
          analyzedAt: new Date().toISOString(),
          videoUrl: data.result.videoUrl || null,
        }

        setResult(analysisResult)
        setState("ready")
      } catch (err) {
        setState("error")
        setError(err instanceof Error ? err.message : "Analysis failed")
      }
    },
    [userId],
  )

  const reset = useCallback(() => {
    setState("idle")
    setResult(null)
    setError(null)
  }, [])

  return { state, result, error, analyzeVideo, reset }
}
