"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  analyzeMotion,
  pruneMotionData,
  ANALYSIS_WINDOW_MS,
  type MotionData,
  type MotionAnalysis,
} from "@/lib/motion"
import {
  PRECEPT_SERVICE_UUID,
  PRECEPT_IMU_CHARACTERISTIC_UUID,
  PRECEPT_BATTERY_CHARACTERISTIC_UUID,
  decodeImuPacket,
  buildCommandPacket,
  COMMAND_START,
  COMMAND_STOP,
} from "@/lib/wearable-protocol"

const ANALYSIS_UPDATE_MS = 50 // throttle React updates to ~20 Hz, keep raw data at 50 Hz
const MOCK_INTERVAL_MS = 20 // 50 Hz mock stream

export type WearableConnectionStatus =
  | "unsupported"
  | "idle"
  | "scanning"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

export interface WearableError {
  name: string
  message: string
}

const emptyAnalysis: MotionAnalysis = {
  fluidityScore: 0,
  intensity: 0,
  directionChanges: 0,
  isActive: false,
  rawData: [],
}

function errorFrom(e: unknown): WearableError {
  if (typeof e === "object" && e !== null && "name" in e && "message" in e) {
    return { name: String((e as { name: unknown }).name), message: String((e as { message: unknown }).message) }
  }
  return { name: "UnknownError", message: "Unknown Bluetooth error" }
}

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

export function useWearableMotion(options?: { mock?: boolean }): UseWearableMotion {
  const mock = options?.mock ?? false

  const [connectionStatus, setConnectionStatus] = useState<WearableConnectionStatus>(() =>
    mock ? "idle" : typeof navigator !== "undefined" && !!navigator.bluetooth ? "idle" : "unsupported",
  )
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [battery, setBattery] = useState<number | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [analysis, setAnalysis] = useState<MotionAnalysis>(emptyAnalysis)
  const [error, setError] = useState<WearableError | null>(null)

  const deviceRef = useRef<BluetoothDevice | null>(null)
  const serverRef = useRef<BluetoothRemoteGATTServer | null>(null)
  const imuCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const motionDataRef = useRef<MotionData[]>([])
  const streamingRef = useRef(false)
  const lastAnalysisRef = useRef(0)
  const mockIntervalRef = useRef<number | null>(null)
  const mockCounterRef = useRef(0)

  const isSupported = mock || (typeof navigator !== "undefined" && !!navigator.bluetooth)

  // Handle an IMU notification from the watch.
  const handleSample = useCallback((event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic | null
    const value = characteristic?.value
    if (!value) return
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    const sample = decodeImuPacket(bytes)
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

  // The watch dropped us: reset everything.
  const handleDisconnect = useCallback(() => {
    deviceRef.current = null
    serverRef.current = null
    imuCharacteristicRef.current = null
    streamingRef.current = false
    setIsTracking(false)
    motionDataRef.current = []
    setAnalysis(emptyAnalysis)
    setConnectionStatus("disconnected")
  }, [])

  // Open the Web Bluetooth device chooser and subscribe to IMU notifications.
  const connect = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError({ name: "UnsupportedError", message: "Web Bluetooth is not available on this device." })
      return false
    }
    if (mock) {
      setDeviceName("Precept Mock Watch")
      setBattery(87)
      setError(null)
      setConnectionStatus("connected")
      return true
    }
    setConnectionStatus("scanning")
    try {
      const device = await navigator.bluetooth!.requestDevice({
        filters: [{ services: [PRECEPT_SERVICE_UUID] }],
        optionalServices: [PRECEPT_SERVICE_UUID],
      })
      setDeviceName(device.name ?? null)
      setConnectionStatus("connecting")
      device.addEventListener("gattserverdisconnected", handleDisconnect)

      const server = await device.gatt!.connect()
      const service = await server.getPrimaryService(PRECEPT_SERVICE_UUID)
      const imuCharacteristic = await service.getCharacteristic(PRECEPT_IMU_CHARACTERISTIC_UUID)
      const batteryCharacteristic = await service.getCharacteristic(PRECEPT_BATTERY_CHARACTERISTIC_UUID)

      try {
        const value = await batteryCharacteristic.readValue()
        setBattery(value.getUint8(0))
      } catch {
        setBattery(null)
      }

      imuCharacteristic.addEventListener("characteristicvaluechanged", handleSample)
      await imuCharacteristic.startNotifications()

      deviceRef.current = device
      serverRef.current = server
      imuCharacteristicRef.current = imuCharacteristic
      setError(null)
      setConnectionStatus("connected")
      return true
    } catch (e) {
      setError(errorFrom(e))
      setConnectionStatus("disconnected")
      return false
    }
  }, [isSupported, mock, handleDisconnect, handleSample])

  const stopMockStreaming = useCallback(() => {
    streamingRef.current = false
    setIsTracking(false)
    if (mockIntervalRef.current !== null) {
      window.clearInterval(mockIntervalRef.current)
      mockIntervalRef.current = null
    }
    motionDataRef.current = []
    setAnalysis(emptyAnalysis)
  }, [])

  const startMockStreaming = useCallback(() => {
    streamingRef.current = true
    setIsTracking(true)
    motionDataRef.current = []
    mockCounterRef.current = 0
    if (mockIntervalRef.current !== null) window.clearInterval(mockIntervalRef.current)
    mockIntervalRef.current = window.setInterval(() => {
      const now = Date.now()
      const t = mockCounterRef.current++
      const amplitude = 2 + Math.sin(t * 0.13) * 1.5
      const data: MotionData = {
        acceleration: {
          x: Math.sin(t * 0.8) * amplitude,
          y: Math.cos(t * 1.04) * amplitude,
          z: 9.8 + Math.sin(t * 0.05) * 0.5,
        },
        rotationRate: {
          alpha: Math.sin(t * 0.07) * 30,
          beta: Math.cos(t * 0.11) * 25,
          gamma: Math.sin(t * 0.09) * 20,
        },
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
    }, MOCK_INTERVAL_MS)
  }, [])

  // Send the Start command (connecting first if needed) and begin streaming.
  const startTracking = useCallback(async (): Promise<boolean> => {
    if (mock) {
      startMockStreaming()
      return true
    }
    if (streamingRef.current) return true
    if (!imuCharacteristicRef.current) {
      const connected = await connect()
      if (!connected) return false
    }
    try {
      await imuCharacteristicRef.current!.writeValueWithoutResponse(buildCommandPacket(COMMAND_START))
    } catch (e) {
      setError(errorFrom(e))
      setConnectionStatus("error")
      return false
    }
    streamingRef.current = true
    setIsTracking(true)
    return true
  }, [mock, connect, startMockStreaming])

  // Send the Stop command and reset the local buffer.
  const stopTracking = useCallback(() => {
    if (mock) {
      stopMockStreaming()
      return
    }
    if (streamingRef.current && imuCharacteristicRef.current) {
      imuCharacteristicRef.current.writeValueWithoutResponse(buildCommandPacket(COMMAND_STOP)).catch(() => {})
    }
    streamingRef.current = false
    setIsTracking(false)
    motionDataRef.current = []
    setAnalysis(emptyAnalysis)
  }, [mock, stopMockStreaming])

  // Tear down the GATT connection and reset state.
  const disconnect = useCallback(() => {
    if (mock) {
      stopMockStreaming()
      setDeviceName(null)
      setBattery(null)
      setConnectionStatus("disconnected")
      return
    }
    if (streamingRef.current && imuCharacteristicRef.current) {
      imuCharacteristicRef.current.writeValueWithoutResponse(buildCommandPacket(COMMAND_STOP)).catch(() => {})
    }
    streamingRef.current = false
    setIsTracking(false)
    try {
      deviceRef.current?.gatt?.disconnect()
    } catch {
      // ignore
    }
    deviceRef.current = null
    serverRef.current = null
    imuCharacteristicRef.current = null
    motionDataRef.current = []
    setAnalysis(emptyAnalysis)
    setConnectionStatus("disconnected")
  }, [mock, stopMockStreaming])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (mockIntervalRef.current !== null) window.clearInterval(mockIntervalRef.current)
      try {
        deviceRef.current?.gatt?.disconnect()
      } catch {
        // ignore
      }
      deviceRef.current = null
      serverRef.current = null
      imuCharacteristicRef.current = null
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
