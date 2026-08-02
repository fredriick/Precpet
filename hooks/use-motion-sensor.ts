"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { analyzeMotion, pruneMotionData, ANALYSIS_WINDOW_MS, type MotionData, type MotionAnalysis } from "@/lib/motion"

const SAMPLE_RATE = 50 // ms between samples

export type { MotionData, MotionAnalysis }

export function useMotionSensor() {
  const [isSupported, setIsSupported] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt")
  const [analysis, setAnalysis] = useState<MotionAnalysis>({
    fluidityScore: 0,
    intensity: 0,
    directionChanges: 0,
    isActive: false,
    rawData: [],
  })

  const motionDataRef = useRef<MotionData[]>([])
  const lastUpdateRef = useRef<number>(0)
  const isListeningRef = useRef(false)

  // Check if DeviceMotion API is supported
  useEffect(() => {
    const supported = typeof window !== "undefined" && "DeviceMotionEvent" in window
    setIsSupported(supported)
  }, [])

  // Handle motion event
  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const now = Date.now()

      // Throttle updates
      if (now - lastUpdateRef.current < SAMPLE_RATE) return
      lastUpdateRef.current = now

      const motionData: MotionData = {
        acceleration: {
          x: event.accelerationIncludingGravity?.x ?? 0,
          y: event.accelerationIncludingGravity?.y ?? 0,
          z: event.accelerationIncludingGravity?.z ?? 0,
        },
        rotationRate: {
          alpha: event.rotationRate?.alpha ?? 0,
          beta: event.rotationRate?.beta ?? 0,
          gamma: event.rotationRate?.gamma ?? 0,
        },
        timestamp: now,
      }

      // Keep only recent data within the analysis window
      motionDataRef.current = [...pruneMotionData(motionDataRef.current, now, ANALYSIS_WINDOW_MS), motionData]

      const { fluidityScore, intensity, directionChanges, isActive } = analyzeMotion(motionDataRef.current)

      setAnalysis({
        fluidityScore: Math.round(fluidityScore),
        intensity: Math.round(intensity),
        directionChanges,
        isActive,
        rawData: motionDataRef.current,
      })
    },
    [],
  )

  // Request permission (iOS 13+ requires explicit permission)
  const requestPermission = useCallback(async () => {
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission ===
        "function"
    ) {
      try {
        const permission = await (
          DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission()
        setPermissionStatus(permission as "granted" | "denied")
        return permission === "granted"
      } catch {
        setPermissionStatus("denied")
        return false
      }
    }
    // Non-iOS devices don't need permission
    setPermissionStatus("granted")
    return true
  }, [])

  // Start tracking motion
  const startTracking = useCallback(async () => {
    if (!isSupported || isListeningRef.current) return false

    const hasPermission = permissionStatus === "granted" || (await requestPermission())
    if (!hasPermission) return false

    window.addEventListener("devicemotion", handleMotion)
    isListeningRef.current = true
    setIsTracking(true)
    return true
  }, [isSupported, permissionStatus, requestPermission, handleMotion])

  // Stop tracking motion
  const stopTracking = useCallback(() => {
    window.removeEventListener("devicemotion", handleMotion)
    isListeningRef.current = false
    setIsTracking(false)
    motionDataRef.current = []
    setAnalysis({
      fluidityScore: 0,
      intensity: 0,
      directionChanges: 0,
      isActive: false,
      rawData: [],
    })
  }, [handleMotion])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener("devicemotion", handleMotion)
    }
  }, [handleMotion])

  return {
    isSupported,
    isTracking,
    permissionStatus,
    analysis,
    startTracking,
    stopTracking,
    requestPermission,
  }
}
