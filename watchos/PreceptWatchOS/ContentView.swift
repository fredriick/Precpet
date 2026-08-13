import SwiftUI

/// Minimal watchOS companion UI for the Precept Motion Service.
///
/// The watch acts as a BLE *peripheral*: when "Stream" is on it broadcasts
/// IMU packets over the Precept Motion Service UUID, which the phone PWA
/// connects to and analyzes. "Record" additionally captures a phone-free
/// offline session on the watch that the PWA can pull later over BLE (§12 of
/// docs/wearable-protocol.md).
struct ContentView: View {
    @EnvironmentObject private var store: WatchAppStore

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                statusCard

                Button {
                    store.toggleStreaming()
                } label: {
                    Label(store.isStreaming ? "Stop streaming" : "Start streaming",
                          systemImage: store.isStreaming ? "stop.circle.fill" : "waveform")
                }
                .buttonStyle(.borderedProminent)
                .tint(store.isStreaming ? .red : .blue)

                Button {
                    store.toggleRecording()
                } label: {
                    Label(store.isRecording ? "Stop recording" : "Record offline session",
                          systemImage: store.isRecording ? "record.circle.fill" : "recordingtape")
                }
                .buttonStyle(.bordered)
            }
            .padding()
        }
    }

    private var statusCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Precept Watch")
                .font(.headline)
            Text("Advertising: \(store.isAdvertising ? "on" : "off")")
            Text("Packets sent: \(store.packetsSent)")
            if store.isRecording {
                Text("Recording… reps: \(store.currentReps)")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.gray.opacity(0.15), in: RoundedRectangle(cornerRadius: 12))
    }
}
