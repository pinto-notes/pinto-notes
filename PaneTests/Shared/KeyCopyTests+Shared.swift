import CryptoKit
import Foundation
import Testing
@testable import Pane

/// The KeyCopyTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/KeyCopyTests.swift.
@MainActor @Suite(.serialized) struct KeyCopyTests {
    typealias Keychain = KeyStartupTests.FakeKeychain

    /// The account's key row and the `key` function, as one server.
    final class Server: AccountKeyServer, KeyCopyServer, @unchecked Sendable {
        var row: ServerKey?
        var generation = 0
        var protection: KeyProtection?
        /// account_key_copies: what a device stored.
        var copy: StoredKey?
        /// KEY_COPY isn't on.
        var off = false
        var offline = false
        /// The function can't be reached, while the rest of the server can.
        var functionDown = false
        /// Storing a copy fails, while the function answers everything else.
        var storeFails = false
        /// A password reset in the last 72 hours.
        var pausedUntil: Date?
        /// The session's sign-in is older than the server allows for a fetch.
        var wantsSignIn = false
        /// The password was just reset: until when Advanced protection can't be turned on.
        var strictPausedUntil: Date?
        /// What devices said they saw when they stored.
        private(set) var froms: [KeyProtection?] = []
        /// What `fetch` hands out instead of the copy (a server gone wrong).
        var handsOut: StoredKey?
        /// keep_key_on_devices is satisfied: a recovery key was saved or another device holds the key.
        var anotherWayBack = false
        private(set) var stores: [Bool] = []
        private(set) var fetches = 0
        private(set) var asked = 0

        func fetch() async throws -> ServerKeyState {
            if offline { throw URLError(.notConnectedToInternet) }
            return ServerKeyState(key: row, generation: generation, protection: protection, copy: copy != nil && copy?.keyID == row?.key_id,
                                  strictPausedUntil: copy != nil ? strictPausedUntil : nil)
        }

        func create(_ key: ServerKey, generation: Int) async throws -> (key: ServerKey, created: Bool) {
            if offline { throw URLError(.notConnectedToInternet) }
            if generation < self.generation { throw KeyError.staleGeneration }
            let made = row == nil
            if made { row = key }
            return (row!, made)
        }

        func markRecoveryKeySaved() async throws -> Date? {
            row?.recovery_saved_at = Date(timeIntervalSince1970: 1000)
            anotherWayBack = true
            return row?.recovery_saved_at
        }

        func startFresh(keyID: String) async throws -> Bool {
            guard row?.key_id == keyID else { return false }
            row = nil
            copy = nil
            generation += 1
            return true
        }

        func available() async throws -> Bool {
            asked += 1
            if offline || functionDown { throw KeyCopyError.offline }
            return !off
        }

        func store(_ key: StoredKey, user: UUID, choose: Bool, from: KeyProtection?) async throws {
            if offline || functionDown || storeFails { throw KeyCopyError.offline }
            if off { throw KeyCopyError.off }
            stores.append(choose)
            froms.append(from)
            guard let row else { throw KeyCopyError.noCopy }
            // As the function does: a strict account gets a copy only from a choice that saw it strict.
            if protection == .strict, !(choose && from == .strict) { throw KeyCopyError.strict }
            if !choose, protection != .standard { throw KeyCopyError.notChosen }
            guard AccountCrypto.isAccountsKey(key, row, user: user) else { throw KeyCopyError.wrongKey }
            copy = key
            protection = .standard
        }

        func fetch(user: UUID, keyID: String) async throws -> StoredKey {
            fetches += 1
            if offline || functionDown { throw KeyCopyError.offline }
            if off { throw KeyCopyError.off }
            if wantsSignIn { throw KeyCopyError.reauth }
            if protection == .strict { throw KeyCopyError.strict }
            guard let copy, copy.keyID == row?.key_id else { throw KeyCopyError.noCopy }
            if let pausedUntil { throw KeyCopyError.paused(until: pausedUntil) }
            return handsOut ?? copy
        }

        func keepOnDevices(device: UUID) async throws {
            if offline { throw KeyCopyError.offline }
            guard anotherWayBack else { throw KeyCopyError.needsRecoveryKey }
            protection = .strict
            copy = nil
        }
    }

    let user = UUID()
    let server = Server()
    let defaults = UserDefaults(suiteName: "key-copy-\(UUID())")!

    /// A device with a Keychain of its own, which shares nothing with any other (no iCloud Keychain).
    func device(_ keychain: Keychain? = nil) -> (AccountCrypto, Keychain) {
        let k = keychain ?? Keychain(cloud: KeyStartupTests.Cloud())
        return (AccountCrypto(store: k, defaults: defaults, sleep: { _ in throw CancellationError() }), k)
    }

    func attach(_ crypto: AccountCrypto) async { await crypto.attach(account: user, server: server, copies: server) }
    /// An account from before copies: a device holds its key, and nobody has chosen anything.
    func accountFromBefore() throws -> (AccountCrypto, Keychain, StoredKey) {
        let k = StoredKey.generate()
        server.row = try k.serverRow(user: user)
        let keychain = Keychain(cloud: KeyStartupTests.Cloud())
        keychain.synced[user] = k
        let (crypto, _) = device(keychain)
        return (crypto, keychain, k)
    }
}
