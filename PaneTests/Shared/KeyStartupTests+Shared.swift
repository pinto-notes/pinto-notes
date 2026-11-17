import Foundation
import Testing
@testable import Pane

/// The KeyStartupTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/KeyStartupTests.swift.
@MainActor @Suite(.serialized) struct KeyStartupTests {
    let user = UUID()
    let cloud = Cloud()
    let server = FakeServer()
    let defaults = UserDefaults(suiteName: "key-startup-\(UUID())")!

    /// iCloud Keychain: what each device has saved, delivered to the others when they receive.
    final class Cloud: @unchecked Sendable {
        var keys: [UUID: StoredKey] = [:]
    }

    /// One device's Keychain. Its synced items go to the cloud; it has the cloud's only after
    /// `receive()` (or right away with `autoReceive`). Pending items stay here.
    final class FakeKeychain: AccountKeyStore, @unchecked Sendable {
        let cloud: Cloud
        var syncs = true
        var autoReceive: Bool
        /// Lagging sync: the cloud's key shows up on the load after this many.
        var receiveAfterLoads: Int?
        private(set) var loads = 0
        var synced: [UUID: StoredKey] = [:]
        var pending: [UUID: StoredKey] = [:]
        var previous: [UUID: StoredKey] = [:]
        /// The key another device handed over (Add a device): on this device only.
        var local: [UUID: StoredKey] = [:]
        private(set) var syncedWrites = 0
        /// The Keychain refuses writes of the synced item (the Mac download's -34018), or all of them.
        var refusesSynced = false
        var refusesAll = false

        init(cloud: Cloud, autoReceive: Bool = true) {
            self.cloud = cloud
            self.autoReceive = autoReceive
        }

        func receive() { synced.merge(cloud.keys) { _, new in new } }

        func load(account: UUID, slot: KeySlot) -> StoredKey? {
            if slot == .previous { return previous[account] }
            if slot == .local { return local[account] }
            guard slot == .synced else { return pending[account] }
            loads += 1
            if autoReceive || receiveAfterLoads.map({ loads > $0 }) == true { receive() }
            return synced[account]
        }

        func save(_ key: StoredKey, account: UUID, slot: KeySlot) -> Bool {
            if refusesAll || (refusesSynced && slot == .synced) { return false }
            if slot == .pending { pending[account] = key; return true }
            if slot == .previous { previous[account] = key; return true }
            if slot == .local { local[account] = key; return true }
            syncedWrites += 1
            synced[account] = key
            cloud.keys[account] = key
            return true
        }

        func remove(account: UUID, slot: KeySlot) {
            switch slot {
            case .pending: pending[account] = nil
            case .previous: previous[account] = nil
            case .local: local[account] = nil
            case .synced: synced[account] = nil; cloud.keys[account] = nil
            }
        }
    }

    final class FakeServer: AccountKeyServer, @unchecked Sendable {
        var row: ServerKey?
        /// account_key_resets.generation: bumped by start_fresh.
        var generation = 0
        var offline = false
        /// Answers nothing (a request that hangs).
        var hangs = false
        /// start_fresh wants a recent sign-in.
        var needsReauth = false
        /// start_fresh within 72 hours of a password reset: refused until this.
        var pausedUntil: Date?
        /// The insert lands but the answer is lost.
        var loseCreateResponse = false
        private(set) var creates = 0
        private(set) var startedFresh: [String] = []

        private(set) var fetches = 0

        func fetch() async throws -> ServerKeyState {
            fetches += 1
            if hangs { try await Task.sleep(for: .seconds(3600)) }
            if offline { throw URLError(.notConnectedToInternet) }
            return ServerKeyState(key: row, generation: generation)
        }

        /// The generation each create said it read.
        private(set) var createGenerations: [Int] = []

        func create(_ key: ServerKey, generation: Int) async throws -> (key: ServerKey, created: Bool) {
            if offline { throw URLError(.notConnectedToInternet) }
            createGenerations.append(generation)
            // create_account_key: a key for a generation the account has moved past is refused.
            if generation < self.generation { throw KeyError.staleGeneration }
            creates += 1
            let made = row == nil
            if made { row = key }
            if loseCreateResponse { throw URLError(.networkConnectionLost) }
            return (row!, made)
        }

        func markRecoveryKeySaved() async throws -> Date? {
            if offline { throw URLError(.notConnectedToInternet) }
            row?.recovery_saved_at = Date(timeIntervalSince1970: 1000)
            return row?.recovery_saved_at
        }

        func startFresh(keyID: String) async throws -> Bool {
            if offline { throw URLError(.notConnectedToInternet) }
            if let pausedUntil { throw KeyError.pausedAfterReset(until: pausedUntil) }
            if needsReauth { throw KeyError.reauth }
            startedFresh.append(keyID)
            guard row?.key_id == keyID else { return false }
            row = nil
            generation += 1
            return true
        }
    }
}
