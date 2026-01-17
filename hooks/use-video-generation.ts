"use client"

import { useState, useCallback, useEffect } from "react"
import { getGeneratedVideo, saveGeneratedVideo } from "@/lib/storage"

interface VideoGenerationState {
  isGenerating: boolean
  videoUrl: string | null
  error: string | null
  progress: "idle" | "starting" | "generating" | "ready" | "error"
}

export function useVideoGeneration(initialSkillId?: string) {
  const [state, setState] = useState<VideoGenerationState>({
    isGenerating: false,
    videoUrl: null,
    error: null,
    progress: "idle",
  })

  // Check cache on mount if skillId is provided
  useEffect(() => {
    if (initialSkillId) {
      const cachedVideo = getGeneratedVideo(initialSkillId)
      if (cachedVideo) {
        setState(prev => ({
          ...prev,
          videoUrl: cachedVideo,
          progress: "ready"
        }))
      }
    }
  }, [initialSkillId])

  const generateVideo = useCallback(async (prompt: string, skillId: string) => {
    // Check cache first (double check)
    const cachedVideo = getGeneratedVideo(skillId)
    if (cachedVideo) {
      setState({
        isGenerating: false,
        videoUrl: cachedVideo,
        error: null,
        progress: "ready",
      })
      return cachedVideo
    }

    setState({
      isGenerating: true,
      videoUrl: null,
      error: null,
      progress: "starting",
    })

    try {
      // Start generation
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, skillId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to start video generation")
      }

      // If mock mode (no API key), return immediately
      if (data.status === "mock") {
        saveGeneratedVideo(skillId, data.videoUrl)
        setState({
          isGenerating: false,
          videoUrl: data.videoUrl,
          error: null,
          progress: "ready",
        })
        return data.videoUrl
      }

      // Poll for completion
      const operationName = data.operationName
      setState((prev) => ({ ...prev, progress: "generating" }))

      const pollInterval = 5000 // 5 seconds
      const maxAttempts = 60 // 5 minutes max

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval))

        const statusResponse = await fetch(`/api/video-status?operationName=${encodeURIComponent(operationName)}`)
        const statusData = await statusResponse.json()

        if (statusData.done) {
          if (statusData.videoUrl) {
            saveGeneratedVideo(skillId, statusData.videoUrl)
            setState({
              isGenerating: false,
              videoUrl: statusData.videoUrl,
              error: null,
              progress: "ready",
            })
            return statusData.videoUrl
          } else {
            throw new Error(statusData.error || "Video generation failed")
          }
        }
      }

      throw new Error("Video generation timed out")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setState({
        isGenerating: false,
        videoUrl: null,
        error: errorMessage,
        progress: "error",
      })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      videoUrl: null,
      error: null,
      progress: "idle",
    })
  }, [])

  return {
    ...state,
    generateVideo,
    reset,
  }
}
