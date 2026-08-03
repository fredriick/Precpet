"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  analyzeMotion,
  pruneMotionData,
  ANALYSIS_WINDOW_MS,
  type MotionData,
  type MotionAnalysis,
} from "@/lib/motion"
import { decodeImuPacket } from "@/lib/wearable-protocol"
import {
  createWearableTransport,
  type WearableConnectionStatus,
  type WearableError,
  type WearableTransport,
  type WearableTransportHost,
} from "@/lib/wearable-transport"

export type { WearableConnectionStatus, WearableError } from "@/lib/wearable-transport"

const ANALYSIS_UPDATE_MS = 50 // throttle React updates to ~20 Hz, keep raw data at 50 Hz

export interface UseWearableMotion {
  connectionStatus: WearableConnectionStatus
  deviceName: string | null
  battery: number | null
  isSupported: boolean
  isTracking: boolean
  analysis: MotionAnalysis
  error: WearableError | null
  connect: () => Promise<boolean>
  disconnect: () => void
  startTracking: () => Promise<boolean>
  stopTracking: () => void
}

const emptyAnalysis: MotionAnalysis = {
  fluidityScore: 0,
  intensity: 0,
  directionChanges: 0,
  isActive: false,
  rawData: [],
}

export function useWearableMotion(options?: { mock?: boolean }): UseWearableMotion {
  const mock = options?.mock ?? false

  const motionDataRef = useRef<MotionData[]>([])
  const streamingRef = useRef(false)
  const connectedRef = useRef(false)
  const lastAnalysisRef = useRef(0)

  const [connectionStatus, setConnectionStatus] = useState<WearableConnectionStatus>("idle")
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [battery, setBattery] = useState<number | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [analysis, setAnalysis] = useState<MotionAnalysis>(emptyAnalysis)
  const [error, setError] = useState<WearableError | null>(null)

  // Decode + analyze a raw 16-byte packet from any transport.
  const handlePacket = useCallback((packet: Uint8Array) => {
    const sample = decodeImuPacket(packet)
    if (!sample) return

    const now = Date.now()
    const data: MotionData = {
      acceleration: sample.acceleration,
      rotationRate: sample.rotationRate,
      timestamp: now,
    }
    motionDataRef.current = [...pruneMotionData(motionDataRef.current, now, ANALYSIS_WINDOW_MS), data]

    if (now - lastAnalysisRef.current < ANALYSIS_UPDATE_MS) return
    lastAnalysisRef.current = now

    const { fluidityScore, intensity, directionChanges, isActive } = analyzeMotion(motionDataRef.current)
    setAnalysis({
      fluidityScore: Math.round(fluidityScore),
      intensity: Math.round(intensity),
      directionChanges,
      isActive,
      rawData: motionDataRef.current,
    })
  }, [])

  // The watch dropped us (or we disconnected): reset everything.
  const handleDisconnected = useCallback(() => {
    connectedRef.current = false
    streamingRef.current = false
    setIsTracking(false)
    motionDataRef.current = []
    setAnalysis(emptyAnalysis)
    setConnectionStatus("disconnected")
  }, [])

  const host = useMemo<WearableTransportHost>(
    () => ({
      onPacket: handlePacket,
      onDisconnected: handleDisconnected,
      onBattery: setBattery,
      onStatus: setConnectionStatus,
      onError: setError,
    }),
    [handlePacket, handleDisconnected],
  )

  const transport = useMemo<WearableTransport>(() => createWearableTransport(host, { mock }), [host, mock])
  const transportRef = useRef(transport)
  transportRef.current = transport

  const isSupported = transport.isSupported

  // Open the device chooser (Web Bluetooth) or native BLE scan (iOS) and
  // subscribe to IMU notifications.
  const connect = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError({ name: "UnsupportedError", message: "Bluetooth is not available on this device." })
      setConnectionStatus("unsupported")
      return false
    }
    const result = await transport.connect()
    if (!result) return false
    connectedRef.current = true
    setDeviceName(result.deviceName)
    setBattery(result.battery)
    setError(null)
    return true
  }, [isSupported, transport])

  const startTracking = useCallback(async (): Promise<boolean> => {
    if (streamingRef.current) return true
    if (!connectedRef.current) {
      const connected = await connect()
      if (!connected) return false
    }
    const started = await transport.start()
    if (!started) return false
    streamingRef.current = true
    setIsTracking(true)
    return true
  }, [connect, transport])

  const stopTracking = useCallback(() => {
    transport.stop()
    streamingRef.current = false
    setIsTracking(false)
    motionDataRef.current = []
    setAnalysis(emptyAnalysis)
  }, [transport])

  const disconnect = useCallback(() => {
    transport.disconnect()
    connectedRef.current = false
    streamingRef.current = false
    setIsTracking(false)
    setDeviceName(null)
    setBattery(null)
    motionDataRef.current = []
    setAnalysis(emptyAnalysis)
  }, [transport])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      transportRef.current.cleanup()
    }
  }, [])

  return {
    connectionStatus,
    deviceName,
    battery,
    isSupported,
    isTracking,
    analysis,
    error,
    connect,
    disconnect,
    startTracking,
    stopTracking,
  }
}
