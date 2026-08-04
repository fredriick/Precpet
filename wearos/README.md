# Precept Wear — Wear OS companion app

Streams accelerometer + gyroscope from a Wear OS watch to the Precept PWA over
BLE using the **Precept Motion Service** GATT protocol
(see [`docs/wearable-protocol.md`](../docs/wearable-protocol.md) — the source of
truth for packet format and UUIDs).

Works on any Wear OS watch: Samsung Galaxy Watch, Pixel Watch, TicWatch, Fossil,
Montblanc, TAG Heuer, etc. Apple Watch / Garmin / Fitbit need their own companion
apps that emit the same protocol.

## How it works

1. Open the watch app and press **Stream to phone** (or just let the watch stream).
2. The app runs a foreground service that:
   - reads `TYPE_ACCELEROMETER` + `TYPE_GYROSCOPE` at ~50 Hz,
   - encodes each sample into the 16-byte little-endian IMU packet,
   - advertises and serves the Precept Motion Service over BLE.
3. In the PWA, pick **Smart Watch** as the Motion Source and tap **Connect
   Watch**. Web Bluetooth (Android Chrome/Edge) finds the watch by service UUID
   and streams fluidity scores live.

BLE range is ~10 m — keep the phone on the sideline, in a bag, or an armband.

## Phone-free offline recording

Press **Record offline** and the watch captures a full session **on-device**
with no phone nearby: same 50 Hz IMU packets, a live timer, and a sample counter.
Pressing **Save & stop** writes one JSON file per session to the watch's
internal `sessions/` directory — raw 16-byte packets base64-encoded, exactly
the format the PWA will decode with its normal packet decoder (see
`docs/wearable-protocol.md` §12). The watch UI shows how many sessions are saved.

## Syncing offline sessions to the PWA

The watch also **serves** those saved sessions over BLE: connect the PWA and open
the **Offline Sessions** panel (Wearable motion source) — it lists what's on the
watch, and you can import each into practice history (stats/streaks/achievements
ride the normal path), delete single sessions, or clear all. The transfer uses a
Session Data characteristic with MTU-safe chunk framing (`docs/wearable-protocol.md` §12.1).
Sessions stay on the watch until you delete them, so nothing is lost if you
disconnect mid-sync.

## Build

Open this folder in Android Studio (Electric Eel+), let Gradle sync, then run on
a Wear OS emulator or watch:

```sh
./gradlew :app:assembleDebug
```

## Permissions (Android 12+)

- `BLUETOOTH_ADVERTISE` / `BLUETOOTH_CONNECT` — BLE server + advertising
- `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_DATA_SYNC` — keep streaming alive
- Grant the BLE permissions when Android prompts on first run.

## Testing

### Unit tests (any machine, no hardware)

```sh
./gradlew :app:testDebugUnitTest
```

`PreceptMotionProtocolTest` asserts the Kotlin encoder emits the exact same
16-byte packets as the TypeScript reference encoder (`tests/lib/wearable-protocol.test.ts`)
for the same sample values — the cross-language byte-parity contract.

`SessionRecorderTest` + `SessionStoreTest` + `SessionChunkerTest` cover
phone-free capture and transfer framing: packet round-trips, RMS-accel /
peak-gyro summaries, JSON persistence round-trips, delete/clear, corrupt-file
resilience, and chunk FIRST/LAST/ERROR flagging. 24 tests total.

### Emulator (Wear OS AVD)

The Android emulator has **no Bluetooth radio**, so the BLE link itself can't be
exercised — but everything before it can:

1. Create a Wear OS 4 AVD (API 34) and run the app.
2. Tap **Start** or **Record offline** (grant the BLE + foreground-service
   permissions when prompted).
3. Open `Extended Controls → Virtual Sensors → Device Pose` and drag the
   X/Y/Z sliders to feed synthetic accelerometer/gyroscope data.
4. Watch the UI counter **Encoded: N packets** climb (~50/s), and confirm
   `logcat` shows throttled `PreceptMotion` packet hex dumps.
5. To exercise offline capture: tap **Record offline**, wait a few seconds,
   then **Save & stop** — the screen shows "Saved N sessions".
5. The watch also logs "No BLE advertiser … no Bluetooth radio" — **expected**
   on an emulator, not an error.

You cannot validate the actual phone↔watch link on an emulator; that needs
hardware (below).

### Hardware

- Pair the watch and phone once in the OS Bluetooth settings, then connect from
  the PWA (Android Chrome/Edge) via the **Smart Watch** motion source.
- Add `?mockWearable=1` to the PWA practice URL to test the source-switch UI on
  desktop without any watch.

## Layout

```
app/src/main/java/com/precpet/wearos/
├── MainActivity.kt            # Wear Compose screen: stream / record-offline modes
├── protocol/PreceptMotionProtocol.kt   # packet encode + UUIDs (mirror of docs)
├── ble/PreceptBleServer.kt    # GATT server + advertising + command handling
├── sensor/MotionSensorService.kt       # foreground service
├── session/SessionRecorder.kt # on-device offline capture (pure JVM)
├── session/SessionStore.kt    # JSON persistence (org.json) + listing
├── session/SessionModels.kt   # session summary + stored-session shape
└── stream/PreceptMotionStreamer.kt     # sensor fan-out → BLE + packet listeners

app/src/test/java/com/precpet/wearos/
├── protocol/PreceptMotionProtocolTest.kt   # byte-parity vs the TS encoder
└── session/SessionRecorderTest.kt          # capture/summary/base64 round-trip
└── session/SessionStoreTest.kt             # JSON persistence + corrupt files
```
