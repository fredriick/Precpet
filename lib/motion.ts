// Shared motion analysis core, used by both the phone-sensor hook
// (hooks/use-motion-sensor.ts) and the wearable BLE hook
// (hooks/use-wearable-motion.ts). Units follow DeviceMotionEvent:
// acceleration includes gravity (m/s²), rotationRate in deg/s.

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

export const ANALYSIS_WINDOW_MS = 2000 // 2 seconds of data for analysis
export const JERK_THRESHOLD = 15 // threshold for detecting jerky movements

export interface MotionMetrics {
  fluidityScore: number
  intensity: number
  directionChanges: number
  isActive: boolean
}

// Keep only samples within the analysis window.
export function pruneMotionData(data: MotionData[], now: number, windowMs = ANALYSIS_WINDOW_MS): MotionData[] {
  return data.filter((d) => now - d.timestamp < windowMs)
}

// Calculate motion fluidity score from a window of samples.
export function analyzeMotion(data: MotionData[]): MotionMetrics {
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
}
