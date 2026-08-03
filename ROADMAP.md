# Precept Roadmap

## Shipped (current state)

- Paddle Pro subscriptions (billing + webhook gating)
- Multi-sport content (soccer / basketball / tennis) with active-sport switching
- AI skill-gap recommendations and AI video analysis
- Practice sessions with motion-based fluidity scoring
- Programs, streaks, achievements, weekly leaderboard
- Supabase cloud sync with offline localStorage cache
- PWA installable (manifest + service worker)
- Open BLE "Precept Motion Service" protocol + Wear OS companion app (Phase A:
  watch streams motion to the PWA via Web Bluetooth)
- Pluggable BLE transport layer (`lib/wearable-transport.ts`): Web Bluetooth
  (Android/Chrome/Edge), native-bridge (iOS Capacitor shell), and mock
  (`?mockWearable=1`) — packet decode lives in one place for all of them
- iOS receiver app (`ios/`): Capacitor shell + CoreBluetooth `PreceptBle`
  plugin that wraps the deployed PWA, so **an iPhone can connect any BLE watch
  (incl. Wear OS) emitting the protocol** — both platforms ship with watch
  support

## Priority — Smart Watch Support ("train phone-free")

**Why:** athletes can't carry phones mid-training, and a wrist-worn sensor is the
ideal place to capture movement. The app must let people track a session from
their watch while the phone stays in a bag on the sideline.

### Platform reality (honest constraints)

- **Web Bluetooth** (the only way a web app can talk to a watch) works on
  Android / Chrome / Edge only. It is **blocked on iOS Safari and all iOS
  PWAs** (Apple WebKit has no implementation; workarounds require third-party
  bridge apps such as Bluefy or beacio). iOS is instead served by a thin native
  receiver app (Capacitor + CoreBluetooth) that wraps the PWA and feeds the
  same protocol into it — see the shipped iOS receiver above.
- **Only Wear OS exposes raw motion data** (accelerometer / gyroscope) to
  third-party apps — and only through a native companion app streaming over a
  custom BLE GATT service. Apple Watch, Garmin, and Fitbit are closed
  ecosystems; their raw IMU is not reachable from web code.
- **Working model:** watch on wrist → BLE (≈10 m range) → phone on the
  sideline. The phone keeps running AI analysis and cloud sync. Fully
  phone-free *offline* sessions are a later phase.

### Phases

- **Phase A — Wear OS MVP (open protocol + companion app) ✅ shipped**
  - ✅ **Open protocol:** Precept Motion Service BLE GATT spec —
    [`docs/wearable-protocol.md`](docs/wearable-protocol.md). One contract every
    future peripheral (Wear OS, watchOS, Garmin, band) implements so the PWA
    receiver never changes.
  - ✅ **PWA receiver:** `hooks/use-wearable-motion.ts` (Web Bluetooth on
    Android/Chrome/Edge) feeds the shared fluidity pipeline
    (`lib/motion.ts`, extracted for reuse).
  - ✅ **Source switch + UX:** Practice page picks Phone vs Smart Watch, with
    connect/disconnect + battery status; `motionSource` persists through
    Supabase sync; `?mockWearable=1` enables a synthetic source for desktop dev.
  - ✅ **Companion app:** `wearos/` Kotlin app — foreground sensor service
    (~50 Hz accel + gyro), BLE GATT server advertising the service, Wear
    Compose start/stop screen.
  - ⏳ Validate streaming end-to-end on real hardware (Wear OS watch + Android
    phone in Chrome, and iPhone via the iOS receiver) once hardware is
    available.

- **Phase B — Apple Watch**
  - watchOS companion app (CoreMotion) emitting the same Precept Motion Service
    over BLE, reached through the shipped iOS receiver app (the native iOS
    shell already scans/connects any Precept peripheral; iOS blocks Web
    Bluetooth, so a PWA-only path is impossible on iPhone).

- **Phase C — Garmin / Fitbit**
  - Vendor BLE passthrough and health SDKs (e.g. Samsung Health Sensor SDK for
    Galaxy Watch, Terra for Garmin/Fitbit) via native companion apps that emit
    the same protocol.

- **Phase D — Phone-free offline sessions**
  - The watch app runs the full session on-device (timer, reps, sensor
    capture) and syncs results via the Wearable Data Layer when the phone
    reconnects.

### Cross-cutting (shipped)

- Shared `lib/motion.ts` (`MotionData` / `MotionAnalysis`, `analyzeMotion`,
  window pruning) consumed by both `use-motion-sensor.ts` and
  `use-wearable-motion.ts` — a pluggable `MotionSource` union in
  `components/practice-content.tsx` selects the active one.
- Pluggable transport layer: `lib/wearable-transport.ts` defines one interface;
  `createWearableTransport` selects native-bridge (iOS Capacitor shell, when
  `window.Capacitor.Plugins.PreceptBle` exists) → Web Bluetooth (Android
  Chrome/Edge) → mock (`?mockWearable=1`). Commands go to the **command
  characteristic**; packet decode stays in `lib/wearable-protocol.ts` for every
  transport.
- Web Bluetooth requires HTTPS (works on `localhost`); the device chooser needs
  a user gesture (Connect Watch tap).

## Backlog / Future ideas

- Coach mode (assign drills to athletes)
- Team / club leaderboards
- Rivalry challenges and head-to-head sessions
- Localized content (languages beyond English)
