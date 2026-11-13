import CoreImage
import CryptoKit
import Foundation
import Testing
@testable import Pane

/// The KeyDevicesTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/AddDeviceTests.swift.
@MainActor @Suite(.serialized) struct KeyDevicesTests {
    let user = UUID()
    let keyServer = KeyStartupTests.FakeServer()
    let list = FakeList()
    let defaults = UserDefaults(suiteName: "key-devices-\(UUID())")!
    let phone = UUID(), mac = UUID()

    final class FakeList: KeyDeviceServer, @unchecked Sendable {
        var rows: [KeyDeviceRow] = []
        private(set) var checkIns = 0
        private(set) var forgotten: [UUID] = []
        var keyID = ""

        func list() async throws -> [KeyDeviceRow] { rows }

        func checkIn(device: UUID, platform: String, nameCT: String, how: String, backedUp: Bool, keyID: String, epoch: String, tag: String) async throws {
            checkIns += 1
            let old = rows.first { $0.device_id == device }
            rows.removeAll { $0.device_id == device }
            rows.append(KeyDeviceRow(device_id: device, platform: platform, name_ct: nameCT, how: how, backed_up: backedUp, key_id: keyID, epoch: epoch, tag: tag,
                                     added_at: old?.removed_at == nil ? old?.added_at ?? .now : .now, seen_at: .now))
        }

        func remove(device: UUID, removalTag: String) async throws -> Bool {
            guard let i = rows.firstIndex(where: { $0.device_id == device }) else { return false }
            rows[i].removed_at = .now
            rows[i].removal_tag = removalTag
            return true
        }

        func forget(device: UUID) async throws {
            forgotten.append(device)
            rows.removeAll { $0.device_id == device }
        }
    }
}
