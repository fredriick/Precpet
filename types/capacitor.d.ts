// Minimal ambient typings for the Capacitor runtime bridge used by the iOS
// receiver app (ios/). Only present when the PWA runs inside the Capacitor
// shell (window.Capacitor); plain web/Android-Chrome builds never see it.

interface PreceptBleEvent {
  packet?: string
  battery?: number
  deviceName?: string
  error?: { name: string; message: string }
}

interface PreceptBlePlugin {
  connect(): Promise<{ deviceName: string | null; battery: number | null }>
  disconnect(): Promise<void>
  sendCommand(value: string): Promise<void>
  /** Resolves with `{ json }` = the fully reassembled Session Data message (raw JSON string). */
  listSessions(): Promise<{ json: string }>
  fetchSession(index: number): Promise<{ json: string }>
  deleteSession(index: number): Promise<{ json: string }>
  clearSessions(): Promise<{ json: string }>
  addListener(eventName: string, listener: (data: PreceptBleEvent) => void): Promise<{ remove: () => void }>
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean
  Plugins: {
    PreceptBle?: PreceptBlePlugin
  }
}

interface Window {
  Capacitor?: CapacitorGlobal
}
