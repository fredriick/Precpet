import { describe, it, expect } from "vitest"
import {
  decodeImuPacket,
  encodeImuPacket,
  buildCommandPacket,
  buildTimeSyncPacket,
  COMMAND_START,
  COMMAND_STOP,
  COMMAND_SET_RATE,
  PACKET_SIZE,
} from "@/lib/wearable-protocol"
import type { ImuSample } from "@/lib/wearable-protocol"

describe("wearable protocol", () => {
  describe("encode/decode round-trip", () => {
    it("round-trips a typical sample with gravity", () => {
      const sample: ImuSample = {
        counter: 0xbeef,
        acceleration: { x: 0.42, y: -1.13, z: 9.81 },
        rotationRate: { alpha: 1.5, beta: -0.4, gamma: 2.75 },
      }
      const decoded = decodeImuPacket(encodeImuPacket(sample))
      expect(decoded).not.toBeNull()
      expect(decoded!.counter).toBe(sample.counter)
      expect(decoded!.acceleration.x).toBeCloseTo(sample.acceleration.x, 1)
      expect(decoded!.acceleration.y).toBeCloseTo(sample.acceleration.y, 1)
      expect(decoded!.acceleration.z).toBeCloseTo(sample.acceleration.z, 1)
      expect(decoded!.rotationRate.alpha).toBeCloseTo(sample.rotationRate.alpha, 1)
      expect(decoded!.rotationRate.beta).toBeCloseTo(sample.rotationRate.beta, 1)
      expect(decoded!.rotationRate.gamma).toBeCloseTo(sample.rotationRate.gamma, 1)
    })

    it("encodes exactly 16 bytes with a matching length", () => {
      const packet = encodeImuPacket({
        counter: 0,
        acceleration: { x: 0, y: 0, z: 0 },
        rotationRate: { alpha: 0, beta: 0, gamma: 0 },
      })
      expect(packet).toHaveLength(PACKET_SIZE)
    })
  })

  describe("decodeImuPacket", () => {
    it("returns null for a truncated buffer", () => {
      expect(decodeImuPacket(new Uint8Array(10))).toBeNull()
    })

    it("returns null for an unknown protocol version", () => {
      const packet = encodeImuPacket({
        counter: 0,
        acceleration: { x: 0, y: 0, z: 0 },
        rotationRate: { alpha: 0, beta: 0, gamma: 0 },
      })
      packet[0] = 0xff
      expect(decodeImuPacket(packet)).toBeNull()
    })

    it("clamps out-of-range values on encode", () => {
      const packet = encodeImuPacket({
        counter: 0,
        acceleration: { x: 99999, y: 0, z: 0 },
        rotationRate: { alpha: 0, beta: 0, gamma: 0 },
      })
      const decoded = decodeImuPacket(packet)!
      expect(decoded.acceleration.x).toBeCloseTo(327.67, 1)
    })
  })

  describe("command packets", () => {
    it("builds a bare start packet", () => {
      expect([...buildCommandPacket(COMMAND_START)]).toEqual([COMMAND_START])
    })

    it("builds a stop packet", () => {
      expect([...buildCommandPacket(COMMAND_STOP)]).toEqual([COMMAND_STOP])
    })

    it("builds a set-rate packet with payload", () => {
      expect([...buildCommandPacket(COMMAND_SET_RATE, 50)]).toEqual([COMMAND_SET_RATE, 50])
    })
  })

  describe("time sync", () => {
    it("builds a 10-byte packet with little-endian ms", () => {
      const packet = buildTimeSyncPacket(1699999999999)
      expect(packet).toHaveLength(10)
      expect(packet[0]).toBe(0x10)
      const view = new DataView(packet.buffer)
      expect(view.getBigUint64(1, true)).toBe(BigInt(1699999999999))
      expect(packet[9]).toBe(0x00)
    })
  })
})
