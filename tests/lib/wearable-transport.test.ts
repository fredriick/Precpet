import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  createWearableTransport,
  isWearableSessionSync,
  hexToBytes,
  bytesToHex,
  type WearableTransportHost,
  type WearableTransport,
  type WearableSessionSync,
} from "@/lib/wearable-transport"
import {
  decodeImuPacket,
  base64ToBytes,
  buildSessionIndexJson,
  type WearableSessionSummary,
} from "@/lib/wearable-protocol"

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

  it("exposes offline session sync with seeded sessions", async () => {
    const { host } = makeHost()
    const transport = createWearableTransport(host, { mock: true }) as WearableTransport & WearableSessionSync
    expect(typeof transport.listSessions).toBe("function")

    const sessions = await transport.listSessions()
    expect(sessions.length).toBe(2)
    expect(sessions[0].id).toBe("mock-session-0")
    expect(sessions[0].index).toBe(0)
    expect(sessions[1].index).toBe(1)
  })

  it("fetches a full stored session with decodable packets", async () => {
    const { host } = makeHost()
    const transport = createWearableTransport(host, { mock: true }) as WearableTransport & WearableSessionSync

    const session = await transport.fetchSession(0)
    expect(session).not.toBeNull()
    expect(session!.summary.index).toBe(0)
    expect(session!.sampleRate).toBe(50)
    expect(session!.packetSize).toBe(16)
    expect(session!.samplesBase64.length).toBeGreaterThan(0)

    const decoded = decodeImuPacket(base64ToBytes(session!.samplesBase64).slice(0, 16))
    expect(decoded).not.toBeNull()
  })

  it("deletes a session and re-indexes the list", async () => {
    const { host } = makeHost()
    const transport = createWearableTransport(host, { mock: true }) as WearableTransport & WearableSessionSync

    expect(await transport.deleteSession(1)).toBe(true)
    const remaining = await transport.listSessions()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe("mock-session-0")
    expect(remaining[0].index).toBe(0)

    expect(await transport.fetchSession(1)).toBeNull()
    expect(await transport.deleteSession(5)).toBe(false)
  })

  it("clears all sessions", async () => {
    const { host } = makeHost()
    const transport = createWearableTransport(host, { mock: true }) as WearableTransport & WearableSessionSync

    expect(await transport.clearSessions()).toBe(true)
    expect(await transport.listSessions()).toHaveLength(0)
    expect(await transport.clearSessions()).toBe(false)
  })
})

describe("NativeBridgeTransport", () => {
  const sessions: WearableSessionSummary[] = [
    {
      index: 0,
      id: "s1",
      startedAtMs: 1000,
      endedAtMs: 3000,
      sampleCount: 100,
      avgAccelMagnitude: 1.2,
      peakGyroMagnitude: 3.4,
    },
  ]
  const storedSessionJson = JSON.stringify({
    id: "s1",
    startedAtMs: 1000,
    endedAtMs: 3000,
    sampleCount: 100,
    avgAccelMagnitude: 1.2,
    peakGyroMagnitude: 3.4,
    packetVersion: 1,
    packetSize: 16,
    samplesBase64: "AQ==",
  })

  const plugin = {
    connect: vi.fn(async () => ({ deviceName: "Precept Watch", battery: 50 })),
    disconnect: vi.fn(async () => {}),
    sendCommand: vi.fn(async () => {}),
    addListener: vi.fn(async () => ({ remove: () => {} })),
    listSessions: vi.fn(async () => ({ json: buildSessionIndexJson(sessions) })),
    fetchSession: vi.fn(async () => ({ json: storedSessionJson })),
    deleteSession: vi.fn(async () => ({ json: '{"ok":true}' })),
    clearSessions: vi.fn(async () => ({ json: '{"ok":true}' })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(window as { Capacitor?: unknown }).Capacitor = { Plugins: { PreceptBle: plugin } }
  })
  afterEach(() => {
    delete (window as { Capacitor?: unknown }).Capacitor
  })

  it("selects the native-bridge transport when Capacitor is present", () => {
    const { host } = makeHost()
    expect(createWearableTransport(host).kind).toBe("native-bridge")
    expect(isWearableSessionSync(createWearableTransport(host))).toBe(true)
  })

  it("lists sessions from the plugin", async () => {
    const { host } = makeHost()
    const transport = createWearableTransport(host) as WearableTransport & WearableSessionSync

    const list = await transport.listSessions()
    expect(plugin.listSessions).toHaveBeenCalledOnce()
    expect(list).toEqual([{ ...sessions[0], index: 0 }])
  })

  it("maps a malformed list response to an empty list", async () => {
    plugin.listSessions.mockResolvedValueOnce({ json: "not json" })
    const { host } = makeHost()
    const transport = createWearableTransport(host) as WearableTransport & WearableSessionSync
    expect(await transport.listSessions()).toEqual([])
  })

  it("fetches a session and stamps the requested index", async () => {
    const { host } = makeHost()
    const transport = createWearableTransport(host) as WearableTransport & WearableSessionSync

    const session = await transport.fetchSession(7)
    expect(plugin.fetchSession).toHaveBeenCalledWith(7)
    expect(session).not.toBeNull()
    expect(session!.summary.index).toBe(7)
    expect(session!.packetSize).toBe(16)
  })

  it("maps a malformed fetch response to null", async () => {
    plugin.fetchSession.mockResolvedValueOnce({ json: '{"bad":true}' })
    const { host } = makeHost()
    const transport = createWearableTransport(host) as WearableTransport & WearableSessionSync
    expect(await transport.fetchSession(0)).toBeNull()
  })

  it("deletes and clears via the plugin, parsing the ok flag", async () => {
    const { host } = makeHost()
    const transport = createWearableTransport(host) as WearableTransport & WearableSessionSync

    expect(await transport.deleteSession(2)).toBe(true)
    expect(plugin.deleteSession).toHaveBeenCalledWith(2)

    expect(await transport.clearSessions()).toBe(true)
    expect(plugin.clearSessions).toHaveBeenCalledOnce()
  })

  it("reports false when the plugin returns a failure response", async () => {
    plugin.deleteSession.mockResolvedValueOnce({ json: '{"ok":false,"error":"no such session"}' })
    const { host } = makeHost()
    const transport = createWearableTransport(host) as WearableTransport & WearableSessionSync
    expect(await transport.deleteSession(9)).toBe(false)
  })
})
