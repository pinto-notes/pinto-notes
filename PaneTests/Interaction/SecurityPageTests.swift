import Foundation
import Testing
@testable import Pane

/// Settings › Security as built on 2026-11-01 from the picked study (Mac C, iPhone "by reason"):
/// what the page's model (SecurityContent) puts on it for each kind of account, and the words it
/// can never say. Real accounts against the fake key server where the account matters
/// (AdvancedProtectionHiddenTests' standard and strict); the pure model elsewhere.
@MainActor @Suite(.serialized) struct SecurityPageTests {
    static let mac = KeyDevice(id: UUID(), name: "Sara\u{2019}s MacBook Air", platform: "macos", how: .added, backedUp: false,
                               addedAt: .now.addingTimeInterval(-6 * 86400), seenAt: .now, removing: false)
    static let phone = KeyDevice(id: UUID(), name: "iPhone", platform: "ios", how: .keychain, backedUp: true,
                                 addedAt: .now.addingTimeInterval(-200 * 86400), seenAt: .now.addingTimeInterval(-44 * 86400), removing: false)
    static let chatGPT = Connection(id: UUID(), name: "ChatGPT", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "chatgpt.com")
    static let claudeGone = Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now, last_used_at: nil, revoked_at: .now, redirect_host: "claude.ai")

    static func standard(_ crypto: AccountCrypto, ais: [Connection] = [chatGPT, claudeGone]) -> SecurityContent {
        SecurityContent(crypto: crypto, devices: AddDeviceSnapshots.devices([mac, phone]), connections: ais)
    }

    /// The account most have: two other devices, one AI connected (and one disconnected, not shown).
    /// Each AI in the list has its Disconnect beside it on the Mac (rounds 17 to 20: the footer said
    /// to, and there was no button).
    @Test func eachAIHasItsDisconnect() throws {
        // Disconnect moved to each AI's own page under AI Connections (7 November 2026).
        let source = try String(contentsOf: TestFiles.url("Views").appending(path: "SettingsPages.swift"), encoding: .utf8)
        #expect(source.contains("private func disconnect() async"))
        #expect(source.contains("ConnectRevoke.revoke(client, id: c.id)"))
    }

    @Test func aStandardAccountWithTwoDevicesAndOneAI() async {
        let crypto = await AdvancedProtectionHiddenTests.standard()
        defer { crypto.signedOut() }
        let c = Self.standard(crypto)
        #expect(c.devices.map(\.name) == [PrivacyCopy.thisDevice, "Sara\u{2019}s MacBook Air", "iPhone"])
        #expect(c.devices[0].kind == .thisDevice && c.devices[0].detail == PrivacyCopy.inUseNow)
        #expect(c.devices[1].detail.hasPrefix("Seen today \u{00B7} added "), "added, as two can share a name")
        #expect(c.devices[2].detail.hasPrefix("Not seen since"), "a phone not seen for six weeks says so")
        #expect(c.devices[1].canRemove && !c.devices[2].canRemove, "Remove… as before: not for a key in iCloud Keychain")
        #expect(c.pintoNotes?.name == "Pinto Notes" && c.pintoNotes?.short == "Helps you back in")
        #expect(c.ais.map(\.name) == ["ChatGPT"], "only what's connected now")
        #expect(c.ais.first?.ai == "ChatGPT", "with its mark")
        #expect(c.openers.last?.detail == "Can read and edit your notes while connected", "as Allow says it")
        #expect(c.openers.map(\.name) == [PrivacyCopy.thisDevice, "Sara\u{2019}s MacBook Air", "iPhone", "Pinto Notes", "ChatGPT"])
        #expect(c.backInFooter == PrivacyCopy.backInFooterWithCopy)
        #expect(!c.showsProtection && !c.addsDevices, "a new device signs in: nothing to add")
        #expect(!c.onlyThisDevice)
    }

    /// iCloud Keychain is your own Apple Account, not someone who can open your notes: never an
    /// opener, and said once, in "How it works", when it applies.
    @Test func iCloudKeychainIsOnlyInHowItWorks() async {
        let crypto = await AdvancedProtectionHiddenTests.standard()
        defer { crypto.signedOut() }
        #expect(crypto.backedUp)
        let c = Self.standard(crypto)
        #expect(!c.openers.contains { $0.name.contains("iCloud") || $0.detail.contains("iCloud") || $0.symbol == "icloud" })
        #expect(c.keychain)
        #expect(c.how.filter { ($0.title + $0.line).contains("iCloud Keychain") }.count == 1)
        #expect(c.how.contains { $0.line == "Your key also syncs between your own devices through iCloud Keychain, end-to-end encrypted by Apple." })
        let none = SecurityContent(serverCopy: true, protection: .standard, recoverySaved: false, backedUp: false, others: [Self.mac], connections: [])
        #expect(!none.keychain && !none.how.contains { $0.line.contains("iCloud") }, "not said where it doesn't apply")
    }

    @Test func noAIConnected() async {
        let crypto = await AdvancedProtectionHiddenTests.standard()
        defer { crypto.signedOut() }
        let c = Self.standard(crypto, ais: [Self.claudeGone])
        #expect(c.ais.isEmpty, "the While connected group and the AI tiles are left out")
        #expect(!c.words.contains(PrivacyCopy.aiFooter))
        #expect(c.openers.map(\.name) == [PrivacyCopy.thisDevice, "Sara\u{2019}s MacBook Air", "iPhone", "Pinto Notes"])
    }

    /// A standard account opens its notes by signing in: no recovery key anywhere, saved or not.
    @Test func aStandardAccountHasNoRecoveryKey() async throws {
        let crypto = await AdvancedProtectionHiddenTests.standard()
        defer { crypto.signedOut() }
        #expect(!crypto.offersRecoveryKey)
        #expect(Self.standard(crypto).recovery == nil)
        try await crypto.markRecoveryKeySaved()
        let c = Self.standard(crypto)
        #expect(c.recovery == nil, "not even one saved before")
        for word in c.words {
            #expect(!word.localizedCaseInsensitiveContains("recovery key"), "\(word)")
        }
        // Nor in search (the Mac's), nor in the notices.
        #if os(macOS)
        let all = Set(SettingsPage.allCases)
        #expect(SettingsIndex.matches("recovery", available: all, recoveryKey: crypto.offersRecoveryKey).isEmpty)
        #expect(SettingsIndex.matches("key", available: all, recoveryKey: crypto.offersRecoveryKey).allSatisfy { $0.label != SettingsIndex.recoveryKey })
        #endif
        let fresh = AccountNotice(id: 1, kind: .startedFresh, created_at: .now)
        #expect(!fresh.text(recoveryKey: crypto.offersRecoveryKey).message.localizedCaseInsensitiveContains("recovery"))
        #expect(!PrivacyCopy.notSavedMessage(recovery: crypto.offersRecoveryKey).localizedCaseInsensitiveContains("recovery"))
        // Signing out is never held up for one.
        #expect(SignOutRemoval.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: false, others: [], serverCopy: crypto.serverCopy) != .needsRecoveryKey)
    }

    /// Advanced protection on: no copy kept by Pinto Notes, the switch to turn it off, the
    /// recovery key with its Show and Save, and the words say only your devices and your AIs.
    @Test func advancedProtectionOn() async throws {
        let crypto = try await AdvancedProtectionHiddenTests.strict()
        defer { crypto.signedOut() }
        #expect(crypto.offersRecoveryKey)
        let c = Self.standard(crypto)
        #expect(c.pintoNotes == nil && !c.openers.contains { $0.kind == .pintoNotes })
        #expect(c.showsProtection, "the switch to turn it off stays")
        #expect(c.recovery == .saved, "strict() saved one first")
        #expect(c.addsDevices, "a new device is added from one of yours")
        #expect(c.backInFooter == PrivacyCopy.backInFooterDevicesOnly)
        #expect(c.backInFooter.contains("Only your devices and the AIs you connect can open your notes"))
        #expect(c.ais.map(\.name) == ["ChatGPT"])
        for word in c.words {
            #expect(!word.contains("can\u{2019}t read") && !word.contains("can't read"), "\(word)")
        }
        // Search finds it (the Mac's), and the notices point to it.
        #if os(macOS)
        let all = Set(SettingsPage.allCases)
        #expect(SettingsIndex.matches("recovery", available: all, recoveryKey: crypto.offersRecoveryKey).map(\.label) == [SettingsIndex.recoveryKey])
        #endif
        #expect(AccountNotice(id: 1, kind: .startedFresh, created_at: .now).text(recoveryKey: true).message.contains("recovery key"))
    }

    /// Recovery key saved or not, for an account offered one.
    @Test func recoveryKeySavedOrNot() {
        let notSaved = SecurityContent(serverCopy: false, protection: .strict, recoverySaved: false, backedUp: false, others: [Self.mac], connections: [])
        let saved = SecurityContent(serverCopy: false, protection: .strict, recoverySaved: true, backedUp: false, others: [Self.mac], connections: [])
        #expect(notSaved.recovery == .notSaved && saved.recovery == .saved)
        // An account that hasn't answered "Signing in now opens your notes" has no copy yet: offered too.
        let before = SecurityContent(serverCopy: false, protection: nil, recoverySaved: false, backedUp: false, others: [], connections: [])
        #expect(before.recovery == .notSaved && before.pintoNotes == nil && !before.showsProtection)
        #expect(before.onlyThisDevice, "nothing else opens the notes: said")
        #expect(RecoveryKeyOffer.shown(serverCopy: false, protection: nil) && RecoveryKeyOffer.shown(serverCopy: false, protection: .strict))
        #expect(!RecoveryKeyOffer.shown(serverCopy: true, protection: .standard) && !RecoveryKeyOffer.shown(serverCopy: false, protection: .standard),
                "a standard account between looks at the server isn't offered one either")
    }

    /// The words that can't come back for a standard account: "we can't read them", a "protected"
    /// claim, the Advanced protection offer, "end-to-end" for the notes, and the study's leftovers.
    @Test func theWordsStayTrue() async {
        let crypto = await AdvancedProtectionHiddenTests.standard()
        defer { crypto.signedOut() }
        let words = Self.standard(crypto).words.joined(separator: " ")
        for banned in ["can\u{2019}t read", "can't read", "protected", "Advanced protection", "Take Pinto Notes off this list", "AIs see"] {
            #expect(!words.localizedCaseInsensitiveContains(banned), "\(banned)")
        }
        #expect(!words.replacingOccurrences(of: "end-to-end encrypted by Apple", with: "").localizedCaseInsensitiveContains("end-to-end"),
                "only iCloud Keychain's own encryption is called end-to-end")
        for fact in ["court order", "gets into your account", "help you back in", "connected", "title"] {
            #expect(words.localizedCaseInsensitiveContains(fact), "\(fact)")
        }
        #expect(PrivacyCopy.lockedLine == "An AI sees that a locked note exists, not its title or text. Lock one from a note\u{2019}s \u{2022}\u{2022}\u{2022} menu.")
        // The page's source: no green shield, no "protected", no study switches left behind.
        let src = try? String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .deletingLastPathComponent().appendingPathComponent("Pane/Views/PrivacySecurity.swift"), encoding: .utf8)
        if let src {
            #expect(!src.contains("shield.fill") && !src.contains(".green") && !src.contains("securityStudy"))
        }
    }
}
