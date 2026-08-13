# Precept watchOS Companion (scaffold)

A **source scaffold** for an Apple Watch companion that turns the watch into a
Precept Motion Service BLE *peripheral*: it advertises the Precept service UUID
and streams raw IMU packets that the phone PWA connects to and analyzes.

> **Status: unbuilt, unverified.** This directory was authored on Windows, where
> the Xcode toolchain isn't available, so none of the Swift files have been
> compiled. It is a faithful port of the reference Wear OS implementation
> (`wearos/`), but expect to fix compile-time issues (imports, APIs, signatures)
> on first build. The SwiftUI app shell, `@main` entry, and `@StateObject` wiring
> are intentionally thin and may need adjustment for your Xcode project template.

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

## Build on macOS

1. Open Xcode → New Project → **watchOS → Watch App** (SwiftUI). Bundle ID e.g.
   `com.precpet.watch`.
2. Add the `PreceptWatchOS/` sources to the target, or copy them into the
   project's watch app group. Files to add: `WatchAppStore.swift`,
   `ContentView.swift`, `PreceptWatchOSApp.swift`, plus the `Protocol/`, `Ble/`,
   `Motion/`, `Session/` folders.
3. Set a development team under **Signing & Capabilities** so the app can run
   on a physical watch (BLE peripheral mode requires a real device; the watch
   simulator does not provide Bluetooth).
4. Add `NSBluetoothAlwaysUsageDescription` to the watch app's Info.plist and the
   entitlement `com.apple.developer.bluetooth-services` with
   `bluetooth-peripheral` if targeting iOS 13+.
5. Build and run on the paired Apple Watch.

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

## TODO

- [ ] Compile on macOS; fix any API drift from the Xcode template.
- [ ] Wire battery updates to the Battery characteristic (read is implemented;
      change notification is not yet sent).
- [ ] Implement the `0x03` set-rate command end to end.
- [ ] Add a WatchKit/Complication surface beyond the minimal `ContentView`.
