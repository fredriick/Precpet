# Precept Motion Service — BLE GATT Protocol

The **Precept Motion Service** is the open, single contract every Precept motion
peripheral implements so that the PWA receiver stays identical regardless of the
source: a Wear OS companion app, an Apple Watch companion app, a Garmin/Fitbit
app, or a dedicated wrist band.

This document is the source of truth. Reference implementations:

- Peripheral (watch/band): `wearos/` (Wear OS companion app)
- Central (Android/desktop PWA): Web Bluetooth transport in
  `lib/wearable-transport.ts` (`hooks/use-wearable-motion.ts` decodes + analyzes)
- Central (iOS): `ios/App/App/PreceptBlePlugin.swift` — CoreBluetooth byte-pipe
  that relays the same packets to the PWA via the native-bridge transport in
  `lib/wearable-transport.ts`

## 1. Physical assumptions

- Bluetooth Low Energy (BLE 4.2+; 5.0 recommended for longer range).
- Phone (central) stays within ~10 m of the watch (peripheral) — typically on a
  sideline, in a bag, or an armband.
- Data flows **peripheral → central** over notifications at 10–100 Hz.
- The peripheral streams raw accelerometer (including gravity) + gyroscope data
  that matches the web `DeviceMotionEvent` shape used by the existing fluidity
  pipeline (`lib/motion.ts`).

## 2. UUIDs

| Role            | UUID (128-bit)                                            |
| --------------- | --------------------------------------------------------- |
| Service         | `d5f2a1a0-3f1e-4b6e-9c2e-7f3a8b4c5d6e`                    |
| IMU Data        | `d5f2a1a1-3f1e-4b6e-9c2e-7f3a8b4c5d6e`  (notify)         |
| Command         | `d5f2a1a2-3f1e-4b6e-9c2e-7f3a8b4c5d6e`  (write, no rsp)  |
| Battery         | `d5f2a1a3-3f1e-4b6e-9c2e-7f3a8b4c5d6e`  (read + notify)   |
| Time Sync       | `d5f2a1a4-3f1e-4b6e-9c2e-7f3a8b4c5d6e`  (write + notify)  |
| Session Data    | `d5f2a1a5-3f1e-4b6e-9c2e-7f3a8b4c5d6e`  (notify)         |

All UUIDs are used in full 128-bit form (no 16-bit aliases).

## 3. Units and coordinate convention

- **Acceleration** is in m/s² and **includes gravity** — exactly the semantics of
  `DeviceMotionEvent.accelerationIncludingGravity` (≈ +9.8 on the dominant axis
  at rest). The fluidity math only uses deltas/magnitudes, so the constant
  gravity offset does not distort results.
- **Rotation rate** is in deg/s — exactly the semantics of
  `DeviceMotionEvent.rotationRate` (alpha/beta/gamma).
- Axes follow the device frame of reference (watch face frame). The PWA does not
  care about exact axis orientation.

## 4. IMU Data packet (notify)

One notification per sample, **16 bytes, little-endian**:

| Offset | Size | Field            | Type       | Scale            |
| ------ | ---- | ---------------- | ---------- | ---------------- |
| 0      | 1    | version          | uint8      | `0x01`           |
| 1      | 2    | sample counter   | uint16 LE  | wraps at 65535   |
| 3      | 2    | accel X          | int16 LE   | m/s² × 100       |
| 5      | 2    | accel Y          | int16 LE   | m/s² × 100       |
| 7      | 2    | accel Z          | int16 LE   | m/s² × 100       |
| 9      | 2    | gyro X           | int16 LE   | deg/s × 10       |
| 11     | 2    | gyro Y           | int16 LE   | deg/s × 10       |
| 13     | 2    | gyro Z           | int16 LE   | deg/s × 10       |
| 15     | 1    | reserved         | uint8      | `0x00`           |

Decoding formula:

```
accel = int16LE(bytes) / 100   // m/s²
gyro  = int16LE(bytes) / 10    // deg/s
```

The sample counter lets the central detect dropped packets and compensate.
Packets are only emitted **after** a Start command (see §5) and stop after a Stop
command or on central disconnect.

## 5. Command characteristic (write, no response)

Single-byte commands with an optional 1-byte payload (2-byte packet):

| Byte 0 | Payload (byte 1) | Meaning                  |
| ------ | ---------------- | ------------------------ |
| `0x01` | —                | Start streaming          |
| `0x02` | —                | Stop streaming           |
| `0x03` | rate: 10/25/50/100 | Set sample rate (Hz). Default 50. Restarts streaming at the new rate if already streaming. |
| `0x10` | —                | List sessions (§12.1)    |
| `0x11` | `index`          | Request session `index` (§12.1) |
| `0x12` | `index`          | Delete session `index` (§12.1) |
| `0x13` | —                | Delete all sessions (§12.1) |

## 6. Time Sync (write + notify)

Used to timestamp samples with host time so latency/offline analysis stays
consistent. Optional; the PWA falls back to local arrival time.

- **Central → peripheral** (10 bytes): `[0x10][uint64 LE unix_ms][0x00]`
- **Peripheral → central** (10 bytes): `[0x11][uint64 LE peripheral_unix_ms][0x00]`

## 7. Battery characteristic (read + notify)

Single uint8, percent 0–100. Notifications are optional; the PWA reads it once
on connect.

## 8. Start/stop handshake

1. Central subscribes to IMU Data notifications.
2. Central writes `0x01` (Start) to Command.
3. Peripheral begins streaming samples at the configured rate.
4. Central writes `0x02` (Stop) when done, or the peripheral stops when the
   central disconnects.
5. Central should unsubscribe and disconnect in cleanup.

## 9. Advertising

The peripheral advertises the **service UUID** so the PWA can find it with
`navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE_UUID] }] })`
(Android/desktop) or the iOS receiver's `CBCentralManager`
`scanForPeripherals(withServices: [SERVICE_UUID])`. It may also use the local
name prefix `Precept`. No pairing (bonding) is required for the prototype;
sensitive builds should enable `LE Secure Connections`.

## 10. Quality of service

- Expected sample jitter at 50 Hz is small; the PWA tolerates gaps up to ~40 ms.
- Drops are detected via the sample counter; a gap > 2× the sample period marks
  the affected samples and they are excluded from analysis.
- If notifications stall > 1 s while tracking, the PWA flags a connection error
  and falls back to phone sensors.

## 11. Extensibility

New peripheral types (watchOS, Garmin, Fitbit, bands) implement this exact
service. Versioned protocol changes bump the packet `version` byte; unknown
versions are ignored by the PWA with a warning.

## 12. Session Store (offline capture)

For phone-free training, the peripheral may capture sessions **on-device** and
store them locally, so nothing is lost when the phone is out of BLE range. A
stored session is one flat JSON document — the exact shape the Wear OS app
persists to disk and will later upload:

```json
{
  "v": 1,
  "id": "6f1c3b9a-…",
  "startedAtMs": 1712345678901,
  "endedAtMs": 1712345689000,
  "sampleCount": 502,
  "avgAccelMagnitude": 9.82,
  "peakGyroMagnitude": 123.4,
  "repCount": 12,
  "packetVersion": 1,
  "packetSize": 16,
  "samplesBase64": "AX4u2A…"
}
```

- `samplesBase64` is the concatenation of the raw IMU Data packets (§4) in
  capture order, base64-encoded. The central decodes it in 16-byte blocks with
  the normal packet decoder and feeds the result through the shared analysis
  pipeline — identical to live streaming, just batched.
- The metadata fields (`sampleCount`, `avgAccelMagnitude`, `peakGyroMagnitude`,
  `startedAtMs`/`endedAtMs`) let a client list sessions without decoding blobs.
- `avgAccelMagnitude` is the RMS of |a| (m/s², includes gravity); `peakGyroMagnitude`
  is the max |ω| (deg/s) across the session.
- `repCount` is **optional** (watch-side only): a count of movement reps detected
  on the wrist (gravity-normalized accel bursts; Wear OS reference
  `RepCounter.kt`). Peripherals that don't count reps omit it; clients must
  treat a missing value as 0 and ignore the field for analysis.

The BLE transfer channel (§12.1 below) uploads these stored sessions to the
PWA, which merges each one into practice history via the normal
`finishSession` path (stats, streaks, achievements, and cloud sync all ride the
existing pipeline).

Wear OS reference: `wearos/app/src/main/java/com/precpet/wearos/session/`
(`SessionRecorder.kt` captures, `SessionStore.kt` persists, `SessionModels.kt`
defines the shape, `SessionChunker.kt` frames transfer chunks, `RepCounter.kt`
detects the optional `repCount`).

### 12.1 Session Data transfer channel

The peripheral exposes the **Session Data** characteristic (notify-only) and
handles the `0x10`–`0x13` session commands on the Command characteristic. One
transfer runs at a time; the peripheral ignores a new request while busy.

**List (`0x10`)** — the peripheral replies with the index JSON on Session Data:

```json
{
  "v": 1,
  "sessions": [
    { "index": 0, "id": "…", "startedAtMs": 1712345678901, "endedAtMs": 1712345689000,
      "sampleCount": 502, "avgAccelMagnitude": 9.82, "peakGyroMagnitude": 123.4,
      "repCount": 12 }
  ]
}
```

Sessions are ordered **most recent first**; `index` is the position in that
list. `repCount` is optional (see §12). Deleting a session re-indexes the
remaining ones, so a fresh `List` must be requested after any delete.

**Request (`0x11 <index>`)** — the peripheral replies with the stored session
JSON (§12) for that position, or an error chunk if the index is out of range.

**Delete (`0x12 <index>`) / Delete all (`0x13`)** — the peripheral replies with
`{"ok":true}` or `{"ok":false}`.

**Chunk framing** — every Session Data notification is
`[flags uint8][fragment]`, a UTF-8 fragment of one JSON message. The fragment
size is bounded by `MTU − 4` (1 header byte + 3 ATT header bytes) so the whole
notification fits any negotiated MTU. Fragments are delivered one per tick
(~12 ms) to avoid overflowing the notification queue.

| Flag    | Bit  | Meaning                                            |
| ------- | ---- | -------------------------------------------------- |
| `0x80`  | 7    | First chunk of a message                           |
| `0x40`  | 6    | Last chunk of a message                            |
| `0x20`  | 5    | Error — the fragment is a UTF-8 error message      |

The central assembles fragments into one message, restarting on a first chunk
and completing on a last chunk. An error chunk aborts the transfer. If no
message completes within 120 s, the PWA times out and reports an error.

Reference implementations: TS `SessionChunkAssembler` +
`parseSessionIndex`/`parseStoredSession` (`lib/wearable-protocol.ts`) and
Kotlin `SessionChunker` (`wearos/.../session/SessionChunker.kt`).
