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
  buildCommandPacket,
  encodeImuPacket,
  COMMAND_START,
  COMMAND_STOP,
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

class WebBluetoothTransport implements WearableTransport {
  readonly kind = "web-bluetooth" as const
  readonly isSupported = true

  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private imuCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  private onPacketListener: ((ev: Event) => void) | null = null
  private onDisconnectedListener: ((ev: Event) => void) | null = null

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
    if (this.device && this.onDisconnectedListener) {
      this.device.removeEventListener("gattserverdisconnected", this.onDisconnectedListener)
    }
    try {
      this.device?.gatt?.disconnect()
    } catch {
      // ignore
    }
    this.clearConnection()
  }

  private clearConnection(): void {
    this.device = null
    this.server = null
    this.imuCharacteristic = null
    this.commandCharacteristic = null
    this.onPacketListener = null
    this.onDisconnectedListener = null
  }
}

class NativeBridgeTransport implements WearableTransport {
  readonly kind = "native-bridge" as const
  readonly isSupported = true

  private listeners: { remove: () => void }[] = []

  constructor(private readonly host: WearableTransportHost) {}

  private get plugin(): PreceptBlePlugin {
    const plugin = typeof window !== "undefined" ? window.Capacitor?.Plugins?.PreceptBle : undefined
    if (!plugin) throw new Error("PreceptBle plugin unavailable")
    return plugin
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

class MockTransport implements WearableTransport {
  readonly kind = "mock" as const
  readonly isSupported = true

  private timer: ReturnType<typeof setInterval> | null = null
  private started = false
  private counter = 0

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
