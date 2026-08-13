import SwiftUI
import CoreMotion

@main
struct PreceptWatchOSApp: App {
    @StateObject private var store = WatchAppStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}

/// Owns the motion stream, the BLE peripheral, and the offline recorder so the
/// SwiftUI views can bind to one source of truth. Wires the motion packets to
/// both the BLE server and the offline session recorder.
final class WatchAppStore: ObservableObject {
    private let motion = MotionSensorService()
    private var peripheral: PreceptBlePeripheral?
    private let recorder = SessionRecorder()
    private var sessionStore: SessionStore?

    @Published private(set) var isStreaming = false
    @Published private(set) var isRecording = false
    @Published private(set) var isAdvertising = false
    @Published private(set) var packetsSent = 0
    @Published private(set) var currentReps = 0

    init() {
        let store = (try? SessionStore())
        sessionStore = store
        guard let store else { return }
        let peripheral = PreceptBlePeripheral(sessionStore: store)
        self.peripheral = peripheral
        peripheral.onAdvertisingChanged = { [weak self] advertising in
            self?.isAdvertising = advertising
        }
        motion.packetListeners.append { [weak self] packet in
            guard let self else { return }
            if self.isStreaming {
                peripheral.handleSample(packet)
                self.packetsSent += 1
            }
            if self.isRecording {
                self.recorder.record(packet)
                self.currentReps = self.recorder.repCount
            }
        }
        peripheral.start()
    }

    func toggleStreaming() {
        isStreaming.toggle()
    }

    func toggleRecording() {
        if isRecording {
            if let session = recorder.finalize() {
                try? sessionStore?.save(session)
            }
            isRecording = false
        } else {
            recorder.start()
            isRecording = true
        }
    }
}
