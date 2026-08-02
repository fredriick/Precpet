// Precept Motion Service — BLE GATT protocol.
// Spec: docs/wearable-protocol.md. This module is pure/data-only so it is
// unit-testable without a Bluetooth device.

export const PRECEPT_SERVICE_UUID = "d5f2a1a0-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
export const PRECEPT_IMU_CHARACTERISTIC_UUID = "d5f2a1a1-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
export const PRECEPT_COMMAND_CHARACTERISTIC_UUID = "d5f2a1a2-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
export const PRECEPT_BATTERY_CHARACTERISTIC_UUID = "d5f2a1a3-3f1e-4b6e-9c2e-7f3a8b4c5d6e"
export const PRECEPT_TIME_SYNC_CHARACTERISTIC_UUID = "d5f2a1a4-3f1e-4b6e-9c2e-7f3a8b4c5d6e"

export const PRECEPT_PACKET_VERSION = 0x01
export const PACKET_SIZE = 16

export const COMMAND_START = 0x01
export const COMMAND_STOP = 0x02
export const COMMAND_SET_RATE = 0x03

export const SAMPLE_RATES = [10, 25, 50, 100] as const
export const DEFAULT_SAMPLE_RATE = 50

export const ACCEL_SCALE = 100 // m/s² × 100 stored as int16
export const GYRO_SCALE = 10 // deg/s × 10 stored as int16

export interface ImuSample {
  counter: number
  acceleration: { x: number; y: number; z: number } // m/s², includes gravity
  rotationRate: { alpha: number; beta: number; gamma: number } // deg/s
}

const MAX_INT16 = 32767
const MIN_INT16 = -32768

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// Decode a 16-byte IMU Data packet (little-endian). Returns null for
// truncated buffers or unknown protocol versions.
export function decodeImuPacket(bytes: Uint8Array): ImuSample | null {
  if (bytes.length < PACKET_SIZE) return null
  if (bytes[0] !== PRECEPT_PACKET_VERSION) return null

  const view = new DataView(bytes.buffer, bytes.byteOffset, PACKET_SIZE)
  return {
    counter: view.getUint16(1, true),
    acceleration: {
      x: view.getInt16(3, true) / ACCEL_SCALE,
      y: view.getInt16(5, true) / ACCEL_SCALE,
      z: view.getInt16(7, true) / ACCEL_SCALE,
    },
    rotationRate: {
      alpha: view.getInt16(13, true) / GYRO_SCALE, // gyro Z
      beta: view.getInt16(9, true) / GYRO_SCALE, // gyro X
      gamma: view.getInt16(11, true) / GYRO_SCALE, // gyro Y
    },
  }
}

// Encode an IMU sample into the 16-byte little-endian packet (useful for the
// mock peripheral and for tests).
export function encodeImuPacket(sample: ImuSample): Uint8Array {
  const bytes = new Uint8Array(PACKET_SIZE)
  const view = new DataView(bytes.buffer)
  bytes[0] = PRECEPT_PACKET_VERSION
  view.setUint16(1, sample.counter & 0xffff, true)
  view.setInt16(3, Math.round(clamp(sample.acceleration.x, MIN_INT16 / ACCEL_SCALE, MAX_INT16 / ACCEL_SCALE) * ACCEL_SCALE), true)
  view.setInt16(5, Math.round(clamp(sample.acceleration.y, MIN_INT16 / ACCEL_SCALE, MAX_INT16 / ACCEL_SCALE) * ACCEL_SCALE), true)
  view.setInt16(7, Math.round(clamp(sample.acceleration.z, MIN_INT16 / ACCEL_SCALE, MAX_INT16 / ACCEL_SCALE) * ACCEL_SCALE), true)
  view.setInt16(9, Math.round(clamp(sample.rotationRate.beta, MIN_INT16 / GYRO_SCALE, MAX_INT16 / GYRO_SCALE) * GYRO_SCALE), true)
  view.setInt16(11, Math.round(clamp(sample.rotationRate.gamma, MIN_INT16 / GYRO_SCALE, MAX_INT16 / GYRO_SCALE) * GYRO_SCALE), true)
  view.setInt16(13, Math.round(clamp(sample.rotationRate.alpha, MIN_INT16 / GYRO_SCALE, MAX_INT16 / GYRO_SCALE) * GYRO_SCALE), true)
  bytes[15] = 0x00
  return bytes
}

// Build a Command characteristic packet.
export function buildCommandPacket(command: number, payload?: number): Uint8Array {
  if (payload === undefined) return new Uint8Array([command])
  return new Uint8Array([command, payload])
}

// Build a Time Sync write packet: [0x10][u64 unix ms LE][0x00].
export function buildTimeSyncPacket(unixMs: number): Uint8Array {
  const bytes = new Uint8Array(10)
  const view = new DataView(bytes.buffer)
  bytes[0] = 0x10
  view.setBigUint64(1, BigInt(Math.floor(unixMs)), true)
  bytes[9] = 0x00
  return bytes
}
