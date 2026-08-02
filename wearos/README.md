# Precept Wear — Wear OS companion app

Streams accelerometer + gyroscope from a Wear OS watch to the Precept PWA over
BLE using the **Precept Motion Service** GATT protocol
(see [`docs/wearable-protocol.md`](../docs/wearable-protocol.md) — the source of
truth for packet format and UUIDs).

Works on any Wear OS watch: Samsung Galaxy Watch, Pixel Watch, TicWatch, Fossil,
Montblanc, TAG Heuer, etc. Apple Watch / Garmin / Fitbit need their own companion
apps that emit the same protocol.

## How it works

1. Open the watch app and press **Start** (or just let the watch stream).
2. The app runs a foreground service that:
   - reads `TYPE_ACCELEROMETER` + `TYPE_GYROSCOPE` at ~50 Hz,
   - encodes each sample into the 16-byte little-endian IMU packet,
   - advertises and serves the Precept Motion Service over BLE.
3. In the PWA, pick **Smart Watch** as the Motion Source and tap **Connect
   Watch**. Web Bluetooth (Android Chrome/Edge) finds the watch by service UUID
   and streams fluidity scores live.

BLE range is ~10 m — keep the phone on the sideline, in a bag, or an armband.

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

- **Emulator:** the Wear AVD reports synthetic sensor data, so the GATT server,
  packet encoding, and PWA connection can be validated without hardware. Add
  `?mockWearable=1` to the PWA practice URL to test the source-switch UI on
  desktop without any watch.
- **Hardware:** pair the watch and phone once in the OS Bluetooth settings, then
  connect from the PWA.

## Layout

```
app/src/main/java/com/precpet/wearos/
├── MainActivity.kt            # Wear Compose start/stop screen
├── protocol/PreceptMotionProtocol.kt   # packet encode + UUIDs (mirror of docs)
├── ble/PreceptBleServer.kt    # GATT server + advertising + command handling
├── sensor/MotionSensorService.kt       # foreground service
└── stream/PreceptMotionStreamer.kt     # sensor fan-out to connected phones
```
