import Foundation
import CoreBluetooth
import WatchKit

/// BLE GATT server that advertises the Precept Motion Service and fans IMU
/// notifications out to connected phones/PWAs. Also serves on-device offline
/// sessions (docs/wearable-protocol.md §12) over the Session Data channel.
/// Mirrors the Wear OS `PreceptBleServer.kt`.
final class PreceptBlePeripheral: NSObject, CBPeripheralManagerDelegate {
    static let defaultAttMtu = 23
    // One notification per tick keeps the BLE stack happy even at 20-byte MTUs.
    static let chunkInterval: TimeInterval = 0.012
    static let okJson = "{\"ok\":true}"
    static let errorJson = "{\"ok\":false}"

    private let sessionStore: SessionStore
    private var manager: CBPeripheralManager?
    private var timer: Timer?

    private var imuCharacteristic: CBMutableCharacteristic?
    private var timeSyncCharacteristic: CBMutableCharacteristic?
    private var sessionDataCharacteristic: CBMutableCharacteristic?

    private var imuSubscribers: [CBCentral] = []

    private var streaming = false
    private var sessionBusy = false
    private var sessionChunks: [Data] = []
    private var sessionIndex = 0

    private(set) var advertising = false {
        didSet {
            if oldValue != advertising {
                onAdvertisingChanged?(advertising)
            }
        }
    }

    /// Called whenever the advertising state flips (on/off).
    var onAdvertisingChanged: ((Bool) -> Void)?

    init(sessionStore: SessionStore) {
        self.sessionStore = sessionStore
        super.init()
    }

    // MARK: - Lifecycle

    func start() {
        guard manager == nil else { return }
        let manager = CBPeripheralManager(delegate: self, queue: .main)
        self.manager = manager
        // Service/characteristic setup happens once the manager is powered on.
    }

    func stop() {
        cancelSessionTransfer()
        manager?.stopAdvertising()
        imuSubscribers.removeAll()
        manager = nil
    }

    var batteryLevel: UInt8 {
        let level = WKInterfaceDevice.current().batteryLevel
        // batteryLevel is 0...1 on supported devices; 1.0 means "unknown" pre-iOS 13 era,
        // so clamp and default to 100 when the value looks unset.
        if level <= 0 || level >= 1 {
            return level >= 1 ? UInt8(level * 100) : 100
        }
        return UInt8((level * 100).rounded())
    }

    // MARK: - Streaming

    func handleSample(_ packet: Data) {
        guard streaming, let imuCharacteristic, let manager else { return }
        let payload = packet as Data
        guard manager.updateValue(payload, for: imuCharacteristic, onSubscribedCentrals: imuSubscribers) else {
            // BLE stack queue full — drop the sample rather than buffer unboundedly.
            return
        }
    }

    func startStreaming() {
        guard !streaming else { return }
        streaming = true
    }

    func stopStreaming() {
        streaming = false
    }

    // MARK: - CBPeripheralManagerDelegate

    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        guard peripheral.state == .poweredOn else {
            advertising = false
            return
        }
        addService()
    }

    func peripheralManager(_ peripheral: CBPeripheralManager, didAdd service: CBService, error: Error?) {
        if let error {
            NSLog("Precept: failed to add service: \(error)")
            return
        }
        peripheral.startAdvertising([
            CBAdvertisementDataServiceUUIDsKey: [PreceptMotionProtocol.serviceCBUUID],
        ])
    }

    func peripheralManagerDidStartAdvertising(_ peripheral: CBPeripheralManager, error: Error?) {
        advertising = error == nil
    }

    func peripheralManager(
        _ peripheral: CBPeripheralManager,
        central: CBCentral,
        didSubscribeTo characteristic: CBCharacteristic
    ) {
        if characteristic.uuid == PreceptMotionProtocol.imuCBUUID {
            imuSubscribers.append(central)
        }
    }

    func peripheralManager(
        _ peripheral: CBPeripheralManager,
        central: CBCentral,
        didUnsubscribeFrom characteristic: CBCharacteristic
    ) {
        if characteristic.uuid == PreceptMotionProtocol.imuCBUUID {
            imuSubscribers.removeAll { $0.identifier == central.identifier }
            if imuSubscribers.isEmpty {
                stopStreaming()
            }
        }
    }

    func peripheralManager(
        _ peripheral: CBPeripheralManager,
        didReceiveRead request: CBATTRequest
    ) {
        if request.characteristic.uuid == PreceptMotionProtocol.batteryCBUUID {
            request.value = Data([batteryLevel])
            peripheral.respond(to: request, withResult: .success)
        } else {
            peripheral.respond(to: request, withResult: .requestNotSupported)
        }
    }

    func peripheralManager(
        _ peripheral: CBPeripheralManager,
        didReceiveWrite requests: [CBATTRequest]
    ) {
        for request in requests {
            handleWrite(request, peripheral: peripheral)
        }
    }

    // MARK: - Private

    private func addService() {
        let service = CBMutableService(type: PreceptMotionProtocol.serviceCBUUID, primary: true)

        let imu = CBMutableCharacteristic(
            type: PreceptMotionProtocol.imuCBUUID,
            properties: [.notify],
            value: nil,
            permissions: []
        )
        let command = CBMutableCharacteristic(
            type: PreceptMotionProtocol.commandCBUUID,
            properties: [.writeWithoutResponse],
            value: nil,
            permissions: [.writeable]
        )
        let battery = CBMutableCharacteristic(
            type: PreceptMotionProtocol.batteryCBUUID,
            properties: [.read, .notify],
            value: nil,
            permissions: [.readable]
        )
        let timeSync = CBMutableCharacteristic(
            type: PreceptMotionProtocol.timeSyncCBUUID,
            properties: [.writeWithoutResponse, .notify],
            value: nil,
            permissions: [.writeable]
        )
        let sessionData = CBMutableCharacteristic(
            type: PreceptMotionProtocol.sessionDataCBUUID,
            properties: [.notify],
            value: nil,
            permissions: []
        )

        imuCharacteristic = imu
        timeSyncCharacteristic = timeSync
        sessionDataCharacteristic = sessionData

        service.characteristics = [imu, command, battery, timeSync, sessionData]
        manager?.add(service)
    }

    private func handleWrite(_ request: CBATTRequest, peripheral: CBPeripheralManager) {
        let uuid = request.characteristic.uuid
        let value = request.value ?? Data()
        switch uuid {
        case PreceptMotionProtocol.commandCBUUID:
            handleCommand(value, peripheral: peripheral)
        case PreceptMotionProtocol.timeSyncCBUUID:
            handleTimeSync(request, peripheral: peripheral)
        default:
            break
        }
    }

    private func handleCommand(_ value: Data, peripheral: CBPeripheralManager) {
        guard let command = value.first else { return }
        switch command {
        case PreceptMotionProtocol.COMMAND_START:
            startStreaming()
        case PreceptMotionProtocol.COMMAND_STOP:
            stopStreaming()
        case PreceptMotionProtocol.COMMAND_SET_RATE:
            NSLog("Precept: set-rate command received (rate switching not yet implemented)")
        case PreceptMotionProtocol.COMMAND_LIST_SESSIONS:
            startSessionTransfer(sessionStore.listJson())
        case PreceptMotionProtocol.COMMAND_REQUEST_SESSION:
            handleRequestSession(value)
        case PreceptMotionProtocol.COMMAND_DELETE_SESSION:
            handleDeleteSession(value)
        case PreceptMotionProtocol.COMMAND_DELETE_ALL:
            sessionStore.clear()
            startSessionTransfer(Self.okJson)
        default:
            break
        }
    }

    private func handleRequestSession(_ value: Data) {
        guard value.count >= 2 else { return }
        let index = Int(value[1])
        guard let session = sessionStore.list()[safe: index].flatMap({ sessionStore.load(id: $0.id) }) else {
            sendSessionError("session not found")
            return
        }
        startSessionTransfer(sessionStore.toJson(session))
    }

    private func handleDeleteSession(_ value: Data) {
        guard value.count >= 2 else { return }
        let index = Int(value[1])
        let id = sessionStore.list()[safe: index]?.id
        let deleted = id.map(sessionStore.delete(id:)) ?? false
        startSessionTransfer(deleted ? Self.okJson : Self.errorJson)
    }

    private func handleTimeSync(_ request: CBATTRequest, peripheral: CBPeripheralManager) {
        // Ignore the client's clock; always ack with our unix ms.
        let ack = PreceptMotionProtocol.buildTimeSyncAckPacket(
            unixMs: UInt64(Date().timeIntervalSince1970 * 1000)
        )
        if let timeSyncCharacteristic {
            _ = peripheral.updateValue(ack, for: timeSyncCharacteristic, onSubscribedCentrals: nil)
        }
    }

    // MARK: - Session Data channel (§12.1)

    private func maxSessionFragment() -> Int {
        // watchOS doesn't expose negotiated MTU; default ATT MTU is 23.
        max(Self.defaultAttMtu - 4, 1)
    }

    /// Paced, one-chunk-per-tick delivery of a Session Data message so the
    /// notification queue never overflows.
    private func startSessionTransfer(_ message: String) {
        guard let manager, let sessionDataCharacteristic, !sessionBusy else { return }
        let chunks = SessionChunker.chunk(Data(message.utf8), maxFragment: maxSessionFragment())
        sessionBusy = true
        sessionChunks = chunks
        sessionIndex = 0
        sendNextChunk(manager, characteristic: sessionDataCharacteristic)
    }

    private func sendNextChunk(_ manager: CBPeripheralManager, characteristic: CBMutableCharacteristic) {
        guard sessionIndex < sessionChunks.count else {
            cancelSessionTransfer()
            return
        }
        let chunk = sessionChunks[sessionIndex]
        sessionIndex += 1
        _ = manager.updateValue(chunk, for: characteristic, onSubscribedCentrals: nil)
        if sessionIndex < sessionChunks.count {
            timer?.invalidate()
            let timer = Timer(timeInterval: Self.chunkInterval, repeats: false) { [weak self, weak manager, weak characteristic] _ in
                guard let self, let manager, let characteristic else { return }
                self.sendNextChunk(manager, characteristic: characteristic)
            }
            RunLoop.main.add(timer, forMode: .common)
            self.timer = timer
        } else {
            cancelSessionTransfer()
        }
    }

    private func sendSessionError(_ message: String) {
        guard let manager, let sessionDataCharacteristic, !sessionBusy else { return }
        let chunk = SessionChunker.errorChunk(Data(message.utf8), maxFragment: maxSessionFragment())
        _ = manager.updateValue(chunk, for: sessionDataCharacteristic, onSubscribedCentrals: nil)
    }

    private func cancelSessionTransfer() {
        timer?.invalidate()
        timer = nil
        sessionBusy = false
        sessionChunks = []
        sessionIndex = 0
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
