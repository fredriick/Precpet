import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  createWearableTransport,
  hexToBytes,
  bytesToHex,
  type WearableTransportHost,
} from "@/lib/wearable-transport"
import { decodeImuPacket } from "@/lib/wearable-protocol"

function makeHost(): { host: WearableTransportHost; packets: Uint8Array[]; statuses: string[] } {
  const packets: Uint8Array[] = []
  const statuses: string[] = []
  return {
    packets,
    statuses,
    host: {
      onPacket: (p) => packets.push(p),
      onDisconnected: () => statuses.push("disconnected"),
      onBattery: () => statuses.push("battery"),
      onStatus: (s) => statuses.push(s),
      onError: () => statuses.push("error"),
    },
  }
}

describe("hex helpers", () => {
  it("converts bytes to hex and back", () => {
    const bytes = new Uint8Array([0x01, 0xef, 0xbe, 0x2a, 0x00])
    expect(bytesToHex(bytes)).toBe("01efbe2a00")
    expect(hexToBytes("01efbe2a00")).toEqual(bytes)
  })

  it("returns null for odd-length or invalid hex", () => {
    expect(hexToBytes("abc")).toBeNull()
    expect(hexToBytes("zz")).toBeNull()
  })
})

describe("createWearableTransport", () => {
  it("returns the mock transport when requested", () => {
    const { host } = makeHost()
    expect(createWearableTransport(host, { mock: true }).kind).toBe("mock")
  })

  it("returns unsupported when no BLE and no native bridge is present", () => {
    const { host } = makeHost()
    expect(createWearableTransport(host).kind).toBe("unsupported")
    expect(createWearableTransport(host).isSupported).toBe(false)
  })
})

describe("MockTransport", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("streams decodable 16-byte packets at 50 Hz", async () => {
    const { host, packets, statuses } = makeHost()
    const transport = createWearableTransport(host, { mock: true })

    const result = await transport.connect()
    expect(result).toEqual({ deviceName: "Precept Mock Watch", battery: 87 })
    expect(statuses).toContain("connected")

    await transport.start()
    vi.advanceTimersByTime(200) // ~10 packets at 20 ms
    transport.stop()

    expect(packets.length).toBeGreaterThan(0)
    for (const packet of packets) {
      expect(packet).toHaveLength(16)
      expect(decodeImuPacket(packet)).not.toBeNull()
    }
  })

  it("stops emitting after stop() and cleans up on disconnect", async () => {
    const { host, packets } = makeHost()
    const transport = createWearableTransport(host, { mock: true })
    await transport.connect()
    await transport.start()
    vi.advanceTimersByTime(100)
    const before = packets.length
    transport.stop()
    vi.advanceTimersByTime(100)
    expect(packets.length).toBe(before)
    transport.cleanup()
  })
})
