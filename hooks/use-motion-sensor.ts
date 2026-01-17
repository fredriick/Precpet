"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface MotionData {
  acceleration: { x: number; y: number; z: number }
  rotationRate: { alpha: number; beta: number; gamma: number }
  timestamp: number
}

export interface MotionAnalysis {
  fluidityScore: number // 0-100, higher = smoother movement
  intensity: number // 0-100, movement intensity
  directionChanges: number // number of sudden direction changes
  isActive: boolean
  rawData: MotionData[]
}

const SAMPLE_RATE = 50 // ms between samples
const ANALYSIS_WINDOW = 2000 // 2 seconds of data for analysis
const JERK_THRESHOLD = 15 // threshold for detecting jerky movements

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

  // Check if DeviceMotion API is supported
  useEffect(() => {
    const supported = typeof window !== "undefined" && "DeviceMotionEvent" in window
    setIsSupported(supported)
  }, [])

  // Calculate motion fluidity score
  const analyzeMotion = useCallback((data: MotionData[]) => {
    if (data.length < 10) {
      return { fluidityScore: 0, intensity: 0, directionChanges: 0, isActive: false }
    }

    let totalJerk = 0
    let totalMagnitude = 0
    let directionChanges = 0
    let prevDirection = { x: 0, y: 0, z: 0 }

    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1]
      const curr = data[i]
      const dt = (curr.timestamp - prev.timestamp) / 1000

      if (dt <= 0) continue

      // Calculate jerk (rate of change of acceleration)
      const jerkX = Math.abs(curr.acceleration.x - prev.acceleration.x) / dt
      const jerkY = Math.abs(curr.acceleration.y - prev.acceleration.y) / dt
      const jerkZ = Math.abs(curr.acceleration.z - prev.acceleration.z) / dt
      const jerkMagnitude = Math.sqrt(jerkX ** 2 + jerkY ** 2 + jerkZ ** 2)

      totalJerk += jerkMagnitude

      // Calculate movement magnitude
      const magnitude = Math.sqrt(curr.acceleration.x ** 2 + curr.acceleration.y ** 2 + curr.acceleration.z ** 2)
      totalMagnitude += magnitude

      // Detect direction changes
      const currDirection = {
        x: Math.sign(curr.acceleration.x),
        y: Math.sign(curr.acceleration.y),
        z: Math.sign(curr.acceleration.z),
      }

      if (
        prevDirection.x !== 0 &&
        (currDirection.x !== prevDirection.x ||
          currDirection.y !== prevDirection.y ||
          currDirection.z !== prevDirection.z)
      ) {
        if (jerkMagnitude > JERK_THRESHOLD) {
          directionChanges++
        }
      }
      prevDirection = currDirection
    }

    const avgJerk = totalJerk / (data.length - 1)
    const avgMagnitude = totalMagnitude / data.length

    // Fluidity score: lower jerk = higher fluidity (inverted and normalized)
    const fluidityScore = Math.max(0, Math.min(100, 100 - avgJerk * 2))

    // Intensity: based on average magnitude of movement
    const intensity = Math.min(100, avgMagnitude * 5)

    // Determine if user is actively moving
    const isActive = intensity > 10

    return { fluidityScore, intensity, directionChanges, isActive }
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
      motionDataRef.current = [...motionDataRef.current.filter((d) => now - d.timestamp < ANALYSIS_WINDOW), motionData]

      const { fluidityScore, intensity, directionChanges, isActive } = analyzeMotion(motionDataRef.current)

      setAnalysis({
        fluidityScore: Math.round(fluidityScore),
        intensity: Math.round(intensity),
        directionChanges,
        isActive,
        rawData: motionDataRef.current,
      })
    },
    [analyzeMotion],
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
    if (!isSupported) return false

    const hasPermission = permissionStatus === "granted" || (await requestPermission())
    if (!hasPermission) return false

    window.addEventListener("devicemotion", handleMotion)
    setIsTracking(true)
    return true
  }, [isSupported, permissionStatus, requestPermission, handleMotion])

  // Stop tracking motion
  const stopTracking = useCallback(() => {
    window.removeEventListener("devicemotion", handleMotion)
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
