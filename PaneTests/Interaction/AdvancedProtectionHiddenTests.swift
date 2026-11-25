import Foundation
import Testing
@testable import Pane

/// Advanced protection was retired on 2026-10-28 and comes back by invitation (AdvancedProtection,
/// 2026-11-25): the server says which accounts are invited, and nobody is by default. An account
/// that isn't invited and has it off never sees it; one that has it on sees its switch until it
/// turns it off; an invited one sees it either way. Real accounts against the fake key server
/// (KeyCopyTests.Server); what Security shows is read from the rule its body uses
/// (PrivacySecuritySection.showsProtection), as LockedNotesSection.shown is.
extension AdvancedProtectionHiddenTests {
    @Test func shownToInvitedAccountsAndToThoseThatHaveItOn() {
        #expect(AdvancedProtection.shown(.strict, offered: false), "on: shown so it can be turned off")
        #expect(!AdvancedProtection.shown(.standard, offered: false))
        #expect(!AdvancedProtection.shown(nil, offered: false), "an account that hasn't chosen is asked, without the device-only choice")
        #expect(AdvancedProtection.shown(.standard, offered: true) && AdvancedProtection.shown(.strict, offered: true))
        #expect(!AdvancedProtection.shown(nil, offered: true), "an invited account that hasn't chosen is asked, with the device-only choice")
    }

    @Test func theSwitchIsHiddenWhenItIsOff() async throws {
        let crypto = await Self.standard()
        defer { crypto.signedOut() }
        #expect(crypto.protection == .standard && crypto.serverCopy && crypto.copiesOn && !crypto.protectionInvited)
        #expect(!PrivacySecuritySection.showsProtection(crypto))
    }

    @Test func theSwitchShowsWhenItIsOnAndGoesWhenTurnedOff() async throws {
        let crypto = try await Self.strict()
        defer { crypto.signedOut() }
        #expect(crypto.protection == .strict)
        #expect(PrivacySecuritySection.showsProtection(crypto))
        // What the switch's "Turn Off Advanced Protection" does (no input is posted on a developer's Mac).
        try await crypto.keepCopy()
        #expect(crypto.protection == .standard && crypto.serverCopy)
        #expect(!PrivacySecuritySection.showsProtection(crypto), "gone once it's off")
        // And it doesn't come back with the next look at the server.
        await crypto.recheck()
        #expect(!PrivacySecuritySection.showsProtection(crypto))
    }

    /// An account from before copies, asked once: no switch on Security, only the question.
    @Test func anAccountThatHasNotChosenIsNotShownIt() async throws {
        let t = KeyCopyTests()
        let (crypto, _, _) = try t.accountFromBefore()
        await t.attach(crypto)
        defer { crypto.signedOut() }
        #expect(crypto.protection == nil && crypto.asksProtection && crypto.copiesOn)
        #expect(!PrivacySecuritySection.showsProtection(crypto))
    }

    @Test func theAskHasNoDeviceOnlyChoiceUnlessInvited() async throws {
        #expect(KeyProtectionAsk.answers(offersStrict: false) == [.continue])
        #expect(KeyProtectionAsk.answers(offersStrict: true) == [.continue, .strict])
        let crypto = AccountCrypto(store: MemoryAccountKeyStore(), defaults: UserDefaults(suiteName: "advanced-protection-\(UUID())")!)
        #expect(KeyProtectionAsk(crypto: crypto).offersStrict == false, "the sheet as PaneApp shows it: nobody is invited by default")
        #expect(!KeyCopyWords.askMessage.contains("devices only") && !KeyCopyWords.askMessage.contains("Advanced protection"))
        // An invited account from before is offered "Keep My Key on My Devices Only" in the question.
        let t = KeyCopyTests()
        t.server.invited = true
        let (asked, _, _) = try t.accountFromBefore()
        await t.attach(asked)
        defer { asked.signedOut() }
        #expect(asked.asksProtection && asked.protectionInvited)
        #expect(KeyProtectionAsk(crypto: asked).offersStrict)
    }

    // MARK: By invitation (2026-11-25)

    /// The server says the account is invited: the switch shows, turns on, turns off, and stays.
    @Test func anInvitedAccountSeesTheSwitchAndKeepsItAfterTurningItOff() async throws {
        let t = KeyCopyTests()
        t.server.invitesOnly = true
        let (crypto, _) = t.device()
        await t.attach(crypto)
        defer { crypto.signedOut() }
        #expect(crypto.protection == .standard && !crypto.protectionInvited && !PrivacySecuritySection.showsProtection(crypto))
        // Invited on the server: the next look shows the switch, with nothing else changed.
        t.server.invited = true
        await crypto.recheck()
        #expect(crypto.protectionInvited && PrivacySecuritySection.showsProtection(crypto))
        #expect(SecurityContent(crypto: crypto, devices: KeyDevices.shared, connections: []).showsProtection)
        try await crypto.markRecoveryKeySaved()
        try await crypto.keepOnDevicesOnly(device: UUID())
        #expect(crypto.protection == .strict && t.server.copy == nil && PrivacySecuritySection.showsProtection(crypto))
        try await crypto.keepCopy()
        #expect(crypto.protection == .standard && t.server.copy != nil)
        #expect(PrivacySecuritySection.showsProtection(crypto), "invited: it can be turned on again")
        #expect(!KeyCopyWords.turnOffMessage(invited: crypto.protectionInvited).contains("no longer offered"))
        // The invitation taken back: the switch goes with the next look.
        t.server.invited = false
        await crypto.recheck()
        #expect(!PrivacySecuritySection.showsProtection(crypto))
    }

    /// An app that offers the switch anyway (a build from before 2026-11-01) is refused by the
    /// server for an account that isn't invited, and nothing changes.
    @Test func anAccountThatIsNotInvitedIsRefusedByTheServer() async throws {
        let t = KeyCopyTests()
        t.server.invitesOnly = true
        let (crypto, _) = t.device()
        await t.attach(crypto)
        defer { crypto.signedOut() }
        try await crypto.markRecoveryKeySaved()
        await #expect(throws: KeyCopyError.notOffered) { try await crypto.keepOnDevicesOnly(device: UUID()) }
        #expect(crypto.protection == .standard && crypto.serverCopy && t.server.copy != nil)
        #expect(KeyCopyWords.error(.notOffered) == KeyCopyWords.notOffered)
    }

    /// The key state of a server from before invitations says nothing of them: nobody is invited.
    @Test func aServerFromBeforeInvitationsInvitesNobody() throws {
        let state = ServerKeyState(key: nil, generation: 0, protection: .standard, copy: true)
        #expect(state.invited == false)
    }
}
