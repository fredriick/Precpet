"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { getGeneratedVideo, saveGeneratedVideo } from "@/lib/storage"
import { getOrCreateSessionToken } from "@/lib/auth"

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

  const pollingRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  // Check cache on mount if skillId is provided
  useEffect(() => {
    if (initialSkillId) {
      const cachedVideo = getGeneratedVideo(initialSkillId)
      if (cachedVideo) {
        setState((prev) => ({
          ...prev,
          videoUrl: cachedVideo,
          progress: "ready",
        }))
      }
    }
  }, [initialSkillId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (pollingRef.current) {
        pollingRef.current.abort()
        pollingRef.current = null
      }
    }
  }, [])

  const generateVideo = useCallback(async (prompt: string, skillId: string) => {
    // Check cache first
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

    const controller = new AbortController()
    pollingRef.current = controller
    const sessionToken = getOrCreateSessionToken()

    try {
      // Start generation
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({ prompt, skillId }),
        signal: AbortSignal.timeout(30_000),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to start video generation")
      }

      // If mock mode, return immediately
      if (data.status === "mock") {
        saveGeneratedVideo(skillId, data.videoUrl)
        if (mountedRef.current) {
          setState({
            isGenerating: false,
            videoUrl: data.videoUrl,
            error: null,
            progress: "ready",
          })
        }
        return data.videoUrl
      }

      // Poll for completion
      const operationName = data.operationName
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, progress: "generating" }))
      }

      const pollInterval = 5000
      const maxAttempts = 60

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (controller.signal.aborted) break

        await new Promise((resolve) => setTimeout(resolve, pollInterval))
        if (!mountedRef.current || controller.signal.aborted) break

        const statusResponse = await fetch(
          `/api/video-status?operationName=${encodeURIComponent(operationName)}`,
          {
            headers: { "x-session-token": sessionToken },
            signal: AbortSignal.timeout(10_000),
          },
        )
        const statusData = await statusResponse.json()

        if (statusData.done) {
          if (statusData.videoUrl) {
            saveGeneratedVideo(skillId, statusData.videoUrl)
            if (mountedRef.current) {
              setState({
                isGenerating: false,
                videoUrl: statusData.videoUrl,
                error: null,
                progress: "ready",
              })
            }
            return statusData.videoUrl
          } else {
            throw new Error(statusData.error || "Video generation failed")
          }
        }
      }

      throw new Error("Video generation timed out")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (mountedRef.current) {
          setState({
            isGenerating: false,
            videoUrl: null,
            error: "Request was cancelled",
            progress: "error",
          })
        }
        return null
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      if (mountedRef.current) {
        setState({
          isGenerating: false,
          videoUrl: null,
          error: errorMessage,
          progress: "error",
        })
      }
      return null
    } finally {
      pollingRef.current = null
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
