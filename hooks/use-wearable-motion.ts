"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  analyzeMotion,
  pruneMotionData,
  ANALYSIS_WINDOW_MS,
  type MotionData,
  type MotionAnalysis,
  type MotionMetrics,
} from "@/lib/motion"
import { decodeImuPacket } from "@/lib/wearable-protocol"
import type { WearableSessionSummary, WearableStoredSession } from "@/lib/wearable-protocol"
import {
  createWearableTransport,
  isWearableSessionSync,
  errorFrom,
  type WearableConnectionStatus,
  type WearableError,
  type WearableTransport,
  type WearableTransportHost,
  type WearableSessionSync,
} from "@/lib/wearable-transport"
import { analyzeStoredSession, decodeStoredSession } from "@/lib/stored-session"

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
  // Offline session sync (optional capability — empty on iOS for now).
  hasSessionSync: boolean
  syncingSessions: boolean
  offlineSessions: WearableSessionSummary[]
  offlineSessionError: string | null
  syncSessions: () => Promise<WearableSessionSummary[]>
  fetchOfflineSession: (index: number) => Promise<WearableStoredSession | null>
  deleteOfflineSession: (index: number) => Promise<boolean>
  clearOfflineSessions: () => Promise<boolean>
  decodeOfflineSession: (session: WearableStoredSession) => MotionData[]
  analyzeOfflineSession: (session: WearableStoredSession) => MotionMetrics
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
  const [syncingSessions, setSyncingSessions] = useState(false)
  const [offlineSessions, setOfflineSessions] = useState<WearableSessionSummary[]>([])
  const [offlineSessionError, setOfflineSessionError] = useState<string | null>(null)

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

  const sessionSync = useMemo<WearableTransport & WearableSessionSync | null>(
    () => (isWearableSessionSync(transport) ? transport : null),
    [transport],
  )

  const isSupported = transport.isSupported

  const syncSessions = useCallback(async (): Promise<WearableSessionSummary[]> => {
    if (!sessionSync) {
      setOfflineSessionError("This device can't sync offline watch sessions yet.")
      return []
    }
    setSyncingSessions(true)
    setOfflineSessionError(null)
    try {
      const list = await sessionSync.listSessions()
      setOfflineSessions(list)
      return list
    } catch (e) {
      const err = errorFrom(e)
      setOfflineSessionError(err.message)
      return []
    } finally {
      setSyncingSessions(false)
    }
  }, [sessionSync])

  // Pull the saved-session index as soon as a session-syncing watch connects.
  useEffect(() => {
    if (connectionStatus === "connected" && sessionSync) {
      void syncSessions()
    }
  }, [connectionStatus, sessionSync, syncSessions])

  const fetchOfflineSession = useCallback(
    async (index: number): Promise<WearableStoredSession | null> => {
      if (!sessionSync) return null
      try {
        return await sessionSync.fetchSession(index)
      } catch (e) {
        setOfflineSessionError(errorFrom(e).message)
        return null
      }
    },
    [sessionSync],
  )

  const deleteOfflineSession = useCallback(
    async (index: number): Promise<boolean> => {
      if (!sessionSync) return false
      try {
        const deleted = await sessionSync.deleteSession(index)
        if (deleted) setOfflineSessions((prev) => prev.filter((s) => s.index !== index).map((s, i) => ({ ...s, index: i })))
        return deleted
      } catch (e) {
        setOfflineSessionError(errorFrom(e).message)
        return false
      }
    },
    [sessionSync],
  )

  const clearOfflineSessions = useCallback(async (): Promise<boolean> => {
    if (!sessionSync) return false
    try {
      const cleared = await sessionSync.clearSessions()
      if (cleared) setOfflineSessions([])
      return cleared
    } catch (e) {
      setOfflineSessionError(errorFrom(e).message)
      return false
    }
  }, [sessionSync])

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
    hasSessionSync: sessionSync !== null,
    syncingSessions,
    offlineSessions,
    offlineSessionError,
    syncSessions,
    fetchOfflineSession,
    deleteOfflineSession,
    clearOfflineSessions,
    decodeOfflineSession: decodeStoredSession,
    analyzeOfflineSession: analyzeStoredSession,
  }
}
