# Precept watchOS Companion (scaffold)

A **source scaffold** for an Apple Watch companion that turns the watch into a
Precept Motion Service BLE *peripheral*: it advertises the Precept service UUID
and streams raw IMU packets that the phone PWA connects to and analyzes.

> **Status: parity-verified, not yet compiled.** This directory was authored and
> line-by-line checked against the Wear OS reference on Windows (no Xcode
> toolchain here — nothing has been compiled yet). A full parity diff against
> the Kotlin implementations was completed and one real bug was found and fixed:
> `WatchAppStore` never called `motion.start()`, so no packets would ever have
> flowed (fix: commit `2b73a09`, mirrors `MotionSensorService.kt`). Expect only
> minor compile-time drift (imports/APIs) on first Xcode build; see
> [Parity status](#parity-status) and [Build on macOS](#build-on-macos).

## What's here

```
PreceptWatchOS/
  WatchAppStore.swift        # Observes: wires stream → BLE + offline recorder
  ContentView.swift          # Minimal SwiftUI: Stream toggle, Record toggle
  Protocol/
    PreceptMotionProtocol.swift   # UUIDs, commands, packet encode/decode (lib/wearable-protocol.ts parity)
  Ble/
    PreceptBlePeripheral.swift    # CBPeripheralManager GATT server + §12 session channel
  Motion/
    MotionSensorService.swift     # CoreMotion deviceMotion → protocol packets
  Session/
    SessionModels.swift           # StoredSession / SessionSummary (JSON shape of §12)
    SessionStore.swift            # Flat-JSON file store (session store on disk)
    SessionRecorder.swift         # Accumulates packets → StoredSession (+ rep count)
    SessionChunker.swift          # §12 chunk framing ([flags][fragment])
    RepCounter.swift              # Gravity-normalized burst rep detector
```

Reference implementations this mirrors:

- BLE server: `wearos/app/src/main/java/com/precpet/wearos/ble/PreceptBleServer.kt`
- Streamer: `wearos/.../stream/PreceptMotionStreamer.kt` (sensor pairing on gyro callback)
- Session stack: `wearos/.../session/SessionStore.kt`, `SessionRecorder.kt`,
  `SessionChunker.kt`, `SessionModels.kt`, `RepCounter.kt`
- Central decoders: `lib/wearable-protocol.ts`, `ios/App/App/PreceptBlePlugin.swift`

## Parity status

Line-by-line diff of the Swift scaffold against its Kotlin reference (verified
on commit `86e26c0`, no functional drift found):

| Layer | Confirmed matching |
| --- | --- |
| Protocol constants | Service/char UUIDs, 16-byte packet layout, signed int16 decode, command bytes `0x01`–`0x03` + session `0x10`–`0x13` |
| BLE (GATT) | All 5 characteristics + properties; MTU 23 default; chunk interval 12 ms; `SESSION_CHUNK_FLAG_MORE=0x40`, fragment cap, index/seq bytes |
| Motion | 50 Hz default; accel incl. gravity in m/s² (g → m/s²), gyro deg/s (rad/s → deg/s) |
| Recorder | Same `RepCounter` burst window + gravity normalization + peak-pair counting |
| Session store | Same flat-JSON envelope `{"v":1,"sessions":[…]}` with index/id/startedAtMs/endedAtMs/sampleCount/avgAccelMagnitude/peakGyroMagnitude/repCount |
| Time sync | Same ack `[0x11][u64 LE ms][0x00]` + client offset math |

**One drift found and fixed:** `motion.start()` was never called (commit
`2b73a09`) — `MotionSensorService.kt` starts the streamer in `onCreate`, the
Swift equivalent now calls `motion.start()` in `WatchAppStore.init()` before
starting the peripheral.

**Intentional divergences (keep, don't "fix"):**
- Swift gates BLE fan-out on an `isStreaming` flag (COMMAND_START/STOP) instead
  of starting/stopping the sensor; this keeps offline recording alive across a
  remote stop, matching the restarted-stream behavior of the TS half.
- watchOS has no negotiated-MTU API; `PreceptBlePeripheral` uses the ATT default
  23 (max fragment 19) — same conservative base the Kotlin server starts from.

## Build on macOS

> The four Swift files are confirmed correct **by inspection** against the Kotlin
> reference; on first Xcode build verify only the shell wiring and CoreMotion
> call-sites (the newly-created `PreceptWatchOSApp.swift` + `@StateObject` flow are
> marked with `// PARITY-FIXME` where an API drift between iOS-like call sites is
> most likely).

1. Open Xcode → New Project → **watchOS → Watch App** (SwiftUI). Bundle ID e.g.
   `com.precpet.watch`.
2. Add the `PreceptWatchOS/` sources to the target, or copy them into the
   project's watch app group. Files to add: `WatchAppStore.swift` (contains the
   `@main` app shell + view model), `ContentView.swift`, plus the `Protocol/`,
   `Ble/`, `Motion/`, `Session/` folders.
3. Set a development team under **Signing & Capabilities** so the app can run
   on a physical watch (BLE peripheral mode requires a real device; the watch
   simulator does not provide Bluetooth).
4. Add `NSBluetoothAlwaysUsageDescription` to the watch app's Info.plist and the
   entitlement `com.apple.developer.bluetooth-services` with
   `bluetooth-peripheral` if targeting iOS 13+.
5. Build and run on the paired Apple Watch. Then run the end-to-end checks:
   stream to iPhone via the iOS receiver app (`ios/`), and exercise
   `List/Request/Delete` over the Session Data channel against a few recordings
   made by **Record offline session** on the watch.

## Pairing with the phone app

- The watch **advertises** the service UUID
  `d5f2a1a0-3f1e-4b6e-9c2e-7f3a8b4c5d6e` (no pairing/bonding required).
- The phone PWA discovers it via Web Bluetooth
  (`navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE_UUID] }] })`)
  on Android/desktop, or via the iOS `PreceptBlePlugin` on iPhone.
- Protocol flow (docs/wearable-protocol.md):

  1. Phone subscribes to the **IMU Data** characteristic.
  2. Phone writes `0x01` (Start) to **Command**.
  3. Watch streams 16-byte IMU packets (50 Hz default).
  4. Phone writes `0x02` (Stop), or the watch stops when the phone disconnects.

- Offline sessions (phone-free capture): tap **Record offline session** on the
  watch. Later, the phone can `List / Request / Delete` sessions over the
  **Session Data** characteristic (commands `0x10`–`0x13`). Captured sessions
  are stored as flat JSON files in the watch app's `Application Support/Sessions`.

## Deliberate differences from Wear OS

- **Sensors**: `MotionSensorService` uses `CMDeviceMotion` `deviceMotion`
  (gravity + userAcceleration + rotationRate) for time-aligned samples, instead
  of separately pairing accelerometer and gyroscope callbacks. CoreMotion gives
  acceleration in g and rotation in rad/s; both are converted to the protocol's
  m/s² and deg/s before encoding.
- **MTU**: watchOS `CBPeripheralManager` doesn't expose a negotiated MTU, so the
  session chunker assumes the default ATT MTU of 23 (max fragment 19), the same
  conservative default the Wear OS server starts from.
- **Sample rate**: `deviceMotionUpdateInterval` is set per the protocol's
  default 50 Hz; the `0x03` set-rate command is acknowledged but not yet
  implemented (matches Wear OS).

## TODO (on macOS)

- [ ] Create the Xcode project shell and add the `PreceptWatchOS/` sources; fix
      any compile drift found (look for `// PARITY-FIXME`).
- [ ] Run the E2E checks: live stream → iOS receiver app; offline-session
      List/Request/Delete over Session Data against real recordings.
- [ ] Wire battery change notifications to the Battery characteristic (read is
      implemented; `didReadValue` → `updateValue(_:for:)` notify is not yet sent).
- [ ] Implement the `0x03` set-rate command end to end (matches Wear OS, which
      also only acks it today).
- [ ] Add a WatchKit/Complication surface beyond the minimal `ContentView`.
