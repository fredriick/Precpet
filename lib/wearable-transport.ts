// Transport abstraction for the Precept Motion Service.
//
// The hook (use-wearable-motion) talks to a WearableTransport; transports only
// move 16-byte IMU packets and command bytes. All protocol logic (decode/encode,
// UUIDs, commands) stays in lib/wearable-protocol.ts so Web Bluetooth, the iOS
// native bridge, and the mock all share one source of truth.
//
// Transport selection order:
//   1. native-bridge  — running inside the iOS Capacitor shell (window.Capacitor)
//   2. web-bluetooth  — Android Chrome/Edge / desktop
//   3. mock           — ?mockWearable=1 (explicitly requested)
//   4. unsupported    — anything else

import {
  PRECEPT_SERVICE_UUID,
  PRECEPT_IMU_CHARACTERISTIC_UUID,
  PRECEPT_COMMAND_CHARACTERISTIC_UUID,
  PRECEPT_BATTERY_CHARACTERISTIC_UUID,
  PRECEPT_SESSION_DATA_CHARACTERISTIC_UUID,
  buildCommandPacket,
  buildSessionIndexJson,
  bytesToBase64,
  encodeImuPacket,
  parseSessionIndex,
  parseStoredSession,
  SessionChunkAssembler,
  COMMAND_START,
  COMMAND_STOP,
  COMMAND_LIST_SESSIONS,
  COMMAND_REQUEST_SESSION,
  COMMAND_DELETE_SESSION,
  COMMAND_DELETE_ALL,
  SESSION_TRANSFER_TIMEOUT_MS,
  type WearableSessionSummary,
  type WearableStoredSession,
} from "@/lib/wearable-protocol"

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

/** Pending single-transfer session resolver (one transfer at a time). */
type SessionResolver = {
  resolve: (text: string) => void
  reject: (e: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export interface WearableConnectResult {
  deviceName: string | null
  battery: number | null
}

/** Callbacks the transport uses to push data up to the hook. */
export interface WearableTransportHost {
  /** A raw 16-byte IMU packet (the hook decodes it). */
  onPacket(packet: Uint8Array): void
  onDisconnected(): void
  onBattery(level: number): void
  onStatus(status: WearableConnectionStatus): void
  onError(error: WearableError): void
}

export interface WearableTransport {
  readonly kind: "web-bluetooth" | "native-bridge" | "mock" | "unsupported"
  readonly isSupported: boolean
  /** Connect to the watch; resolves null on failure. */
  connect(): Promise<WearableConnectResult | null>
  disconnect(): void
  /** Send the protocol Start command (and begin delivering packets). */
  start(): Promise<boolean>
  /** Send the protocol Stop command. */
  stop(): void
  /** Tear down listeners/connections (unmount). */
  cleanup(): void
}

/**
 * Optional capability: read/delete the peripheral's on-device offline sessions
 * over the Session Data channel (docs/wearable-protocol.md §12). Web Bluetooth,
 * the iOS native bridge, and the mock implement it.
 */
export interface WearableSessionSync {
  listSessions(): Promise<WearableSessionSummary[]>
  fetchSession(index: number): Promise<WearableStoredSession | null>
  deleteSession(index: number): Promise<boolean>
  clearSessions(): Promise<boolean>
}

export function isWearableSessionSync(
  transport: WearableTransport,
): transport is WearableTransport & WearableSessionSync {
  return typeof (transport as Partial<WearableSessionSync>).listSessions === "function"
}

export function errorFrom(e: unknown): WearableError {
  if (typeof e === "object" && e !== null && "name" in e && "message" in e) {
    return { name: String((e as { name: unknown }).name), message: String((e as { message: unknown }).message) }
  }
  return { name: "UnknownError", message: "Unknown Bluetooth error" }
}

export function isWebBluetoothAvailable(): boolean {
  return typeof navigator !== "undefined" && !!navigator.bluetooth
}

export function isNativeBridgeAvailable(): boolean {
  return typeof window !== "undefined" && !!window.Capacitor?.Plugins?.PreceptBle
}

export function hexToBytes(hex: string): Uint8Array | null {
  const normalized = hex.replace(/\s+/g, "")
  if (normalized.length % 2 !== 0) return null
  const bytes = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(normalized.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) return null
    bytes[i] = byte
  }
  return bytes
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

class WebBluetoothTransport implements WearableTransport, WearableSessionSync {
  readonly kind = "web-bluetooth" as const
  readonly isSupported = true

  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private imuCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  private onPacketListener: ((ev: Event) => void) | null = null
  private onDisconnectedListener: ((ev: Event) => void) | null = null

  private sessionCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  private sessionListener: ((ev: Event) => void) | null = null
  private sessionAssembler: SessionChunkAssembler | null = null
  private sessionResolvers: SessionResolver | null = null

  constructor(private readonly host: WearableTransportHost) {}

  async connect(): Promise<WearableConnectResult | null> {
    this.host.onStatus("scanning")
    try {
      const device = await navigator.bluetooth!.requestDevice({
        filters: [{ services: [PRECEPT_SERVICE_UUID] }],
        optionalServices: [PRECEPT_SERVICE_UUID],
      })
      this.host.onStatus("connecting")

      this.device = device
      this.onDisconnectedListener = () => this.host.onDisconnected()
      device.addEventListener("gattserverdisconnected", this.onDisconnectedListener)

      const server = await device.gatt!.connect()
      const service = await server.getPrimaryService(PRECEPT_SERVICE_UUID)
      const imuCharacteristic = await service.getCharacteristic(PRECEPT_IMU_CHARACTERISTIC_UUID)
      const commandCharacteristic = await service.getCharacteristic(PRECEPT_COMMAND_CHARACTERISTIC_UUID)
      const batteryCharacteristic = await service.getCharacteristic(PRECEPT_BATTERY_CHARACTERISTIC_UUID)

      let battery: number | null = null
      try {
        battery = (await batteryCharacteristic.readValue()).getUint8(0)
      } catch {
        battery = null
      }

      this.onPacketListener = (ev) => {
        const characteristic = ev.target as BluetoothRemoteGATTCharacteristic | null
        const value = characteristic?.value
        if (!value) return
        this.host.onPacket(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
      }
      imuCharacteristic.addEventListener("characteristicvaluechanged", this.onPacketListener)
      await imuCharacteristic.startNotifications()

      this.server = server
      this.imuCharacteristic = imuCharacteristic
      this.commandCharacteristic = commandCharacteristic
      this.host.onStatus("connected")
      return { deviceName: device.name ?? null, battery }
    } catch (e) {
      this.host.onError(errorFrom(e))
      this.host.onStatus("disconnected")
      return null
    }
  }

  async start(): Promise<boolean> {
    if (!this.commandCharacteristic) return false
    try {
      // Commands go to the command characteristic (PROPERTY_WRITE_NO_RESPONSE on
      // the watch); the IMU characteristic is notify-only.
      await this.commandCharacteristic.writeValueWithoutResponse(buildCommandPacket(COMMAND_START))
      return true
    } catch (e) {
      this.host.onError(errorFrom(e))
      return false
    }
  }

  stop(): void {
    if (this.commandCharacteristic) {
      this.commandCharacteristic.writeValueWithoutResponse(buildCommandPacket(COMMAND_STOP)).catch(() => {})
    }
  }

  disconnect(): void {
    this.stop()
    try {
      this.device?.gatt?.disconnect()
    } catch {
      // ignore
    }
    this.clearConnection()
  }

  cleanup(): void {
    if (this.imuCharacteristic && this.onPacketListener) {
      this.imuCharacteristic.removeEventListener("characteristicvaluechanged", this.onPacketListener)
    }
    if (this.sessionCharacteristic && this.sessionListener) {
      this.sessionCharacteristic.removeEventListener("characteristicvaluechanged", this.sessionListener)
    }
    if (this.device && this.onDisconnectedListener) {
      this.device.removeEventListener("gattserverdisconnected", this.onDisconnectedListener)
    }
    try {
      this.device?.gatt?.disconnect()
    } catch {
      // ignore
    }
    const pending = this.sessionResolvers
    if (pending) {
      clearTimeout(pending.timer)
      pending.reject(new Error("Watch disconnected during session transfer"))
    }
    this.clearConnection()
  }

  // -- Offline session sync (docs/wearable-protocol.md §12) --

  private async ensureSessionChannel(): Promise<BluetoothRemoteGATTCharacteristic | null> {
    if (this.sessionCharacteristic) return this.sessionCharacteristic
    const server = this.server
    if (!server) return null
    try {
      const service = await server.getPrimaryService(PRECEPT_SERVICE_UUID)
      const characteristic = await service.getCharacteristic(PRECEPT_SESSION_DATA_CHARACTERISTIC_UUID)
      this.sessionCharacteristic = characteristic
      this.sessionListener = (ev) => {
        const value = (ev.target as BluetoothRemoteGATTCharacteristic | null)?.value
        if (!value) return
        this.handleSessionChunk(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
      }
      characteristic.addEventListener("characteristicvaluechanged", this.sessionListener)
      await characteristic.startNotifications()
      return characteristic
    } catch {
      return null
    }
  }

  private handleSessionChunk(chunk: Uint8Array): void {
    const pending = this.sessionResolvers
    if (!pending) return
    const assembler = this.sessionAssembler ?? (this.sessionAssembler = new SessionChunkAssembler())
    const result = assembler.push(chunk)
    if (result.error) {
      clearTimeout(pending.timer)
      this.sessionResolvers = null
      this.sessionAssembler = null
      pending.reject(new Error(result.error))
      return
    }
    if (result.complete && result.text !== undefined) {
      clearTimeout(pending.timer)
      this.sessionResolvers = null
      this.sessionAssembler = null
      pending.resolve(result.text)
    }
  }

  /** Read the current resolver fresh (avoids CFA narrowing across the guard). */
  private currentSessionResolver(): SessionResolver | null {
    return this.sessionResolvers
  }

  /** Send one session command and resolve with the fully reassembled message. */
  private async sendSessionCommand(bytes: Uint8Array): Promise<string> {
    if (!this.commandCharacteristic) throw new Error("Watch not connected")
    const channel = await this.ensureSessionChannel()
    if (!channel) throw new Error("Watch not connected")
    if (this.sessionResolvers) throw new Error("A session transfer is already in progress")

    const message = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.sessionResolvers = null
        this.sessionAssembler = null
        reject(new Error("Session transfer timed out"))
      }, SESSION_TRANSFER_TIMEOUT_MS)
      this.sessionResolvers = { resolve, reject, timer }
    })

    try {
      await this.commandCharacteristic.writeValueWithoutResponse(bytes)
    } catch (e) {
      const pending = this.currentSessionResolver()
      if (pending) {
        clearTimeout(pending.timer)
        this.sessionResolvers = null
        pending.reject(errorFrom(e))
      }
      throw e
    }
    return message
  }

  async listSessions(): Promise<WearableSessionSummary[]> {
    const text = await this.sendSessionCommand(new Uint8Array([COMMAND_LIST_SESSIONS]))
    return parseSessionIndex(text) ?? []
  }

  async fetchSession(index: number): Promise<WearableStoredSession | null> {
    const text = await this.sendSessionCommand(new Uint8Array([COMMAND_REQUEST_SESSION, index & 0xff]))
    const session = parseStoredSession(text)
    if (session) session.summary.index = index
    return session
  }

  async deleteSession(index: number): Promise<boolean> {
    const text = await this.sendSessionCommand(new Uint8Array([COMMAND_DELETE_SESSION, index & 0xff]))
    return /"ok"\s*:\s*true/.test(text)
  }

  async clearSessions(): Promise<boolean> {
    const text = await this.sendSessionCommand(new Uint8Array([COMMAND_DELETE_ALL]))
    return /"ok"\s*:\s*true/.test(text)
  }

  private clearConnection(): void {
    this.device = null
    this.server = null
    this.imuCharacteristic = null
    this.commandCharacteristic = null
    this.onPacketListener = null
    this.onDisconnectedListener = null
    this.sessionCharacteristic = null
    this.sessionListener = null
    this.sessionAssembler = null
    this.sessionResolvers = null
  }
}

class NativeBridgeTransport implements WearableTransport, WearableSessionSync {
  readonly kind = "native-bridge" as const
  readonly isSupported = true

  private listeners: { remove: () => void }[] = []

  constructor(private readonly host: WearableTransportHost) {}

  private get plugin(): PreceptBlePlugin {
    const plugin = typeof window !== "undefined" ? window.Capacitor?.Plugins?.PreceptBle : undefined
    if (!plugin) throw new Error("PreceptBle plugin unavailable")
    return plugin
  }

  private jsonOf(result: { json?: unknown }): string {
    return typeof result.json === "string" ? result.json : ""
  }

  async listSessions(): Promise<WearableSessionSummary[]> {
    return parseSessionIndex(this.jsonOf(await this.plugin.listSessions())) ?? []
  }

  async fetchSession(index: number): Promise<WearableStoredSession | null> {
    const session = parseStoredSession(this.jsonOf(await this.plugin.fetchSession(index)))
    if (session) session.summary.index = index
    return session
  }

  async deleteSession(index: number): Promise<boolean> {
    return /"ok"\s*:\s*true/.test(this.jsonOf(await this.plugin.deleteSession(index)))
  }

  async clearSessions(): Promise<boolean> {
    return /"ok"\s*:\s*true/.test(this.jsonOf(await this.plugin.clearSessions()))
  }

  async connect(): Promise<WearableConnectResult | null> {
    this.host.onStatus("connecting")
    try {
      this.listeners = await Promise.all([
        this.plugin.addListener("preceptPacket", (data) => {
          if (typeof data.packet === "string") {
            const bytes = hexToBytes(data.packet)
            if (bytes) this.host.onPacket(bytes)
          }
        }),
        this.plugin.addListener("preceptDisconnected", () => this.host.onDisconnected()),
        this.plugin.addListener("preceptBattery", (data) => {
          if (typeof data.battery === "number") this.host.onBattery(data.battery)
        }),
      ])

      const result = await this.plugin.connect()
      this.host.onStatus("connected")
      return { deviceName: result.deviceName ?? null, battery: result.battery ?? null }
    } catch (e) {
      this.host.onError(errorFrom(e))
      this.host.onStatus("disconnected")
      return null
    }
  }

  async start(): Promise<boolean> {
    try {
      await this.plugin.sendCommand(bytesToHex(buildCommandPacket(COMMAND_START)))
      return true
    } catch (e) {
      this.host.onError(errorFrom(e))
      return false
    }
  }

  stop(): void {
    this.plugin.sendCommand(bytesToHex(buildCommandPacket(COMMAND_STOP))).catch(() => {})
  }

  disconnect(): void {
    this.stop()
    this.plugin.disconnect().catch(() => {})
    this.host.onStatus("disconnected")
  }

  cleanup(): void {
    this.listeners.forEach((listener) => listener.remove())
    this.listeners = []
  }
}

class MockTransport implements WearableTransport, WearableSessionSync {
  readonly kind = "mock" as const
  readonly isSupported = true

  private timer: ReturnType<typeof setInterval> | null = null
  private started = false
  private counter = 0
  private sessions: WearableStoredSession[] = []
  private cleared = false

  constructor(private readonly host: WearableTransportHost) {}

  async connect(): Promise<WearableConnectResult | null> {
    this.host.onStatus("connected")
    return { deviceName: "Precept Mock Watch", battery: 87 }
  }

  async start(): Promise<boolean> {
    if (this.started) return true
    this.started = true
    this.counter = 0
    this.timer = setInterval(() => {
      const t = this.counter++
      const amplitude = 2 + Math.sin(t * 0.13) * 1.5
      this.host.onPacket(
        encodeImuPacket({
          counter: t & 0xffff,
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
        }),
      )
    }, 20)
    return true
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.started = false
  }

  disconnect(): void {
    this.stop()
    this.host.onStatus("disconnected")
  }

  cleanup(): void {
    this.stop()
  }

  // -- Offline session sync (mocked so the full flow is testable on desktop) --

  private buildSessions(): WearableStoredSession[] {
    if (this.cleared) return []
    if (this.sessions.length > 0) return this.sessions
    const now = Date.now()
    this.sessions = [
      makeMockSession("mock-session-0", now - 3 * 3600_000, 300, 0),
      makeMockSession("mock-session-1", now - 26 * 3600_000, 120, 1),
    ]
    return this.sessions
  }

  async listSessions(): Promise<WearableSessionSummary[]> {
    return this.buildSessions().map((s, i) => ({ ...s.summary, index: i }))
  }

  async fetchSession(index: number): Promise<WearableStoredSession | null> {
    const session = this.buildSessions()[index]
    return session ? { ...session, summary: { ...session.summary, index } } : null
  }

  async deleteSession(index: number): Promise<boolean> {
    const sessions = this.buildSessions()
    if (index < 0 || index >= sessions.length) return false
    sessions.splice(index, 1)
    return true
  }

  async clearSessions(): Promise<boolean> {
    const hadSessions = this.buildSessions().length > 0
    this.sessions = []
    this.cleared = true
    return hadSessions
  }
}

function makeMockSession(id: string, startedAtMs: number, sampleCount: number, seed: number): WearableStoredSession {
  const packets: Uint8Array[] = []
  for (let t = 0; t < sampleCount; t++) {
    packets.push(
      encodeImuPacket({
        counter: t & 0xffff,
        acceleration: {
          x: Math.sin(t * 0.8 + seed) * 2,
          y: Math.cos(t * 1.04 + seed) * 2,
          z: 9.8 + Math.sin(t * 0.05 + seed) * 0.5,
        },
        rotationRate: {
          alpha: Math.sin(t * 0.07 + seed) * 30,
          beta: Math.cos(t * 0.11 + seed) * 25,
          gamma: Math.sin(t * 0.09 + seed) * 20,
        },
      }),
    )
  }
  const flat = new Uint8Array(sampleCount * 16)
  packets.forEach((packet, i) => flat.set(packet, i * 16))
  const durationMs = sampleCount * 20
  return {
    summary: {
      index: 0,
      id,
      startedAtMs,
      endedAtMs: startedAtMs + durationMs,
      sampleCount,
      avgAccelMagnitude: 9.9,
      peakGyroMagnitude: 33,
    },
    packetVersion: 1,
    packetSize: 16,
    samplesBase64: bytesToBase64(flat),
    sampleRate: 50,
  }
}

class UnsupportedTransport implements WearableTransport {
  readonly kind = "unsupported" as const
  readonly isSupported = false

  constructor(private readonly host: WearableTransportHost) {}

  async connect(): Promise<WearableConnectResult | null> {
    this.host.onStatus("unsupported")
    return null
  }

  disconnect(): void {}
  async start(): Promise<boolean> {
    return false
  }
  stop(): void {}
  cleanup(): void {}
}

export function createWearableTransport(
  host: WearableTransportHost,
  options?: { mock?: boolean },
): WearableTransport {
  if (options?.mock) return new MockTransport(host)
  if (isNativeBridgeAvailable()) return new NativeBridgeTransport(host)
  if (isWebBluetoothAvailable()) return new WebBluetoothTransport(host)
  return new UnsupportedTransport(host)
}
