# Precept iOS receiver (Capacitor)

Thin native iOS app that lets an iPhone connect **any BLE smartwatch** emitting
the Precept Motion Service protocol (see
[`docs/wearable-protocol.md`](../docs/wearable-protocol.md) — source of truth for
UUIDs + packet format).

It is a native shell around the deployed Precept PWA:

- The `WKWebView` loads the **live PWA** (so UI, billing, and cloud stay the
  single codebase).
- A small CoreBluetooth plugin (`PreceptBlePlugin.swift`) provides the one thing
  iOS Safari can't: Bluetooth. It scans for the Precept service UUID, subscribes
  to IMU notifications, and relays each 16-byte packet to the web layer as hex.
  It also reassembles the chunked Session Data channel (byte framing only) and
  resolves the JS call with the single assembled JSON message.
- The PWA's `NativeBridgeTransport` (`lib/wearable-transport.ts`) picks these up
  via `window.Capacitor.Plugins.PreceptBle` and feeds them through the same
  decode/analyze pipeline as Web Bluetooth on Android — including offline session
  list / fetch / delete.

No protocol logic lives in Swift — the web layer generates command bytes and
decodes packets, so the two platforms can't drift (Swift only joins chunk
fragments back into a UTF-8 string).

## Prerequisites

- macOS with Xcode (the iOS build cannot be done on Windows/Linux)
- CocoaPods (`sudo gem install cocoapods`)
- Node 20+ (for the Capacitor CLI)

## Setup / build

```sh
# 1. Point the app at the deployed PWA (default is a non-resolving placeholder)
export PRECEPT_APP_URL="https://app.your-domain.com"

# 2. Sync web assets + config into ios/
npx cap sync ios

# 3. Install pods (first time)
cd ios/App && pod install && cd ../..

# 4. Open and build
open ios/App/App.xcworkspace
#   - select the App scheme and an attached iPhone
#   - set your Team under Signing & Capabilities
#   - Run
```

`PreceptBlePlugin.swift` is already registered in the Xcode project
(`App` target → Sources).

## Plugin API (web ↔ native)

| JS call / event | Native | Direction |
| --- | --- | --- |
| `connect()` | start scan by service UUID → connect → subscribe IMU + Session Data | JS → native |
| `sendCommand("02")` etc. | write command bytes to the command characteristic | JS → native |
| `listSessions()` → `{ json }` | write `0x10`, reassemble Session Data, resolve with JSON string | JS → native |
| `fetchSession(index)` → `{ json }` | write `0x11 <index>` → reassemble → resolve with stored-session JSON | JS → native |
| `deleteSession(index)` → `{ json }` | write `0x12 <index>` → reassemble → resolve `{"ok":…}` | JS → native |
| `clearSessions()` → `{ json }` | write `0x13` → reassemble → resolve `{"ok":…}` | JS → native |
| `disconnect()` | cancel connection | JS → native |
| `preceptPacket` event `{ packet: "01efbe…" }` | 16-byte IMU notification as hex | native → JS |
| `preceptBattery` event `{ battery: n }` | battery read | native → JS |
| `preceptDisconnected` event | link dropped | native → JS |

The PWA auto-selects this transport when `window.Capacitor.Plugins.PreceptBle`
is present (see `createWearableTransport` in `lib/wearable-transport.ts`).

## Known constraints

- **No BLE on the iOS Simulator** — test on a physical iPhone (same story as the
  Android emulator).
- iOS only allows **foreground** scanning; once connected, streaming continues in
  the background via the `bluetooth-central` background mode (already declared in
  `Info.plist`).
- First run prompts for the Bluetooth permission
  (`NSBluetoothAlwaysUsageDescription` is set).
- **App Store review:** the app is a WebView shell, but it provides real native
  functionality (CoreBluetooth motion streaming) and uses the PWA's existing
  Paddle web checkout (no IAP). If reviewers flag it, the mitigations are the
  BLE capability and this README's architecture description.

## Release flow

1. Deploy the PWA, then set `PRECEPT_APP_URL` to the production URL.
2. `npx cap sync ios`
3. In Xcode: bump `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION`, archive, upload
   via Organizer → TestFlight → App Store.

## Layout

```
ios/App/
├── App/
│   ├── AppDelegate.swift          # standard Capacitor template
│   ├── PreceptBlePlugin.swift     # CoreBluetooth bridge (byte-pipe + chunk reassembly)
│   └── Info.plist                 # bluetooth usage + bluetooth-central background mode
├── App.xcworkspace / App.xcodeproj
└── Podfile
```
