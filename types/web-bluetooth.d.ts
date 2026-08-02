// Minimal local typings for the subset of the Web Bluetooth API used by
// hooks/use-wearable-motion.ts. Intentionally narrow (no stale @types dep).

interface RequestDeviceFilter {
  services?: string[]
  name?: string
  namePrefix?: string
}

interface RequestDeviceOptions {
  filters?: RequestDeviceFilter[]
  optionalServices?: string[]
  acceptAllDevices?: boolean
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly value?: DataView
  addEventListener(
    type: "characteristicvaluechanged",
    callback: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => unknown,
  ): void
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  readValue(): Promise<DataView>
  writeValueWithoutResponse(value: Uint8Array | ArrayBufferLike): Promise<void>
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTServer {
  readonly connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>
}

interface BluetoothDevice extends EventTarget {
  readonly id: string
  readonly name?: string
  readonly gatt?: BluetoothRemoteGATTServer
  readonly connected: boolean
  addEventListener(
    type: "gattserverdisconnected",
    callback: (this: BluetoothDevice, ev: Event) => unknown,
  ): void
}

interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>
}

interface Navigator {
  bluetooth?: Bluetooth
}
