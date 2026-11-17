import Foundation
import Testing
@testable import Pane

/// Advanced protection was retired on 2026-10-28 (AdvancedProtection): an account that has it off
/// never sees it, and one that has it on sees its switch until it turns it off. Real accounts
/// against the fake key server (KeyCopyTests.Server); what Security shows is read from the rule its
/// body uses (PrivacySecuritySection.showsProtection), as LockedNotesSection.shown is.
extension AdvancedProtectionHiddenTests {
    @Test func shownOnlyToAccountsThatHaveItOn() {
        #expect(!AdvancedProtection.offered, "nobody is offered it any more")
        #expect(AdvancedProtection.shown(.strict))
        #expect(!AdvancedProtection.shown(.standard))
        #expect(!AdvancedProtection.shown(nil), "an account that hasn't chosen is asked, without the device-only choice")
        // Parked, not cut: offered again, it shows as it did.
        #expect(AdvancedProtection.shown(.standard, offered: true) && !AdvancedProtection.shown(nil, offered: true))
    }

    @Test func theSwitchIsHiddenWhenItIsOff() async throws {
        let crypto = await Self.standard()
        defer { crypto.signedOut() }
        #expect(crypto.protection == .standard && crypto.serverCopy && crypto.copiesOn)
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

    @Test func theAskHasNoDeviceOnlyChoice() {
        #expect(KeyProtectionAsk.answers(offersStrict: AdvancedProtection.offered) == [.continue])
        #expect(KeyProtectionAsk.answers(offersStrict: true) == [.continue, .strict], "parked, not cut")
        let crypto = AccountCrypto(store: MemoryAccountKeyStore(), defaults: UserDefaults(suiteName: "advanced-protection-\(UUID())")!)
        #expect(KeyProtectionAsk(crypto: crypto).offersStrict == false, "the sheet as PaneApp shows it")
        #expect(!KeyCopyWords.askMessage.contains("devices only") && !KeyCopyWords.askMessage.contains("Advanced protection"))
    }
}
