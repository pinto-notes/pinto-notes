import CryptoKit
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// The AddDeviceSnapshots suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/AddDeviceSnapshots.swift.
@MainActor @Suite(.serialized) struct AddDeviceSnapshots {
    /// Signed in, the account has a key, this device doesn't. Background loops off.
    static func waiting() async throws -> AccountCrypto {
        let user = UUID(), keychain = KeyStartupTests.FakeKeychain(cloud: KeyStartupTests.Cloud(), autoReceive: false)
        let crypto = AccountCrypto(store: keychain, defaults: UserDefaults(suiteName: "add-device-shots-\(UUID())")!, sleep: { _ in throw CancellationError() })
        let server = KeyStartupTests.FakeServer()
        server.row = try StoredKey.generate().serverRow(user: user)
        await crypto.attach(account: user, server: server)
        return crypto
    }

    /// A device with the key. `backedUp`: it keeps the key in iCloud Keychain.
    static func ready(backedUp: Bool, recoverySaved: Bool = false) async throws -> AccountCrypto {
        let keychain = KeyStartupTests.FakeKeychain(cloud: KeyStartupTests.Cloud())
        keychain.syncs = backedUp
        let crypto = AccountCrypto(store: keychain, defaults: UserDefaults(suiteName: "add-device-shots-\(UUID())")!, sleep: { _ in throw CancellationError() })
        await crypto.attach(account: UUID(), server: KeyStartupTests.FakeServer())
        crypto.welcomeShown()
        if recoverySaved { try await crypto.markRecoveryKeySaved() }
        return crypto
    }

    /// A new account as most have it now: Pinto Notes keeps a locked copy of the key, so signing
    /// in opens the notes on a new device (KeyCopy), and Advanced protection is off.
    static func readyWithCopy() async -> AccountCrypto {
        let server = KeyCopyTests.Server()
        let keychain = KeyStartupTests.FakeKeychain(cloud: KeyStartupTests.Cloud())
        keychain.syncs = true
        let crypto = AccountCrypto(store: keychain, defaults: UserDefaults(suiteName: "add-device-shots-\(UUID())")!, sleep: { _ in throw CancellationError() })
        await crypto.attach(account: UUID(), server: server, copies: server)
        crypto.welcomeShown()
        return crypto
    }

    /// The list as a device with the key sees it: one Mac added from here.
    static func devices(_ others: [KeyDevice]) -> KeyDevices {
        let d = KeyDevices(device: UUID(), identity: DeviceIdentity(store: MemoryDeviceIdentityStore()))
        d.setForTesting(others)
        return d
    }

    static let added = KeyDevice(id: UUID(), name: "Sara\u{2019}s MacBook Air", platform: "macos", how: .added, backedUp: false,
                                 addedAt: .now.addingTimeInterval(-6 * 86400), seenAt: .now, removing: false)
    /// A second iPhone, which the system only calls "iPhone", not seen for six weeks.
    static let stale = KeyDevice(id: UUID(), name: "iPhone", platform: "ios", how: .keychain, backedUp: true,
                                 addedAt: .now.addingTimeInterval(-200 * 86400), seenAt: .now.addingTimeInterval(-44 * 86400), removing: false)
}
