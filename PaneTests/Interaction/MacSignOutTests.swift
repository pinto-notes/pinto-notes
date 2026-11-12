#if os(macOS)
import AppKit
import Foundation
import Testing
@testable import Pane

/// The Mac's Sign Out (12 November 2026): one Sign Out button, which removes this Mac's notes,
/// in an alert on the window; when they can't go, one line says why, with Sign Out and Keep Notes
/// and Cancel. Built and answered here without being shown.
@MainActor @Suite(.serialized) struct MacSignOutTests {
    let rigs = SignOutRemovalTests()

    @Test(arguments: [SignOutRemoval.Offer.offered(keyStays: true), .offered(keyStays: false), .needsRecoveryKey, .unavailable])
    func theAlertByOffer(_ offer: SignOutRemoval.Offer) {
        let ask = SignOutAsk.first(offer, kind: "Mac")
        let alert = MacSignOut.alert(ask)
        #expect(alert.messageText == "Sign out?")
        #expect(alert.informativeText == ask.line)
        #expect(alert.buttons.map(\.title) == ask.choices.map(SignOutCopy.title))
        #expect(alert.buttons.first?.hasDestructiveAction == true, "the default signs out")
        #expect(alert.buttons.last?.title == "Cancel" && alert.buttons.last?.keyEquivalent == "\u{1b}", "Escape cancels")
        #expect(!alert.showsSuppressionButton, "no box to tick: removing is what Sign Out does")
        if case .offered = offer {
            #expect(alert.buttons.map(\.title) == ["Sign Out", "Cancel"])
        } else {
            #expect(alert.buttons.first?.title == "Sign Out and Keep Notes")
        }
    }

    @Test(arguments: [SignOutRemoval.Refusal.unsynced, .offline, .needsRecoveryKey, .unavailable])
    func theAlertAfterARefusal(_ refusal: SignOutRemoval.Refusal) {
        let ask = SignOutAsk.refused(refusal, unsynced: 2, offline: false, kind: "Mac")
        let alert = MacSignOut.alert(ask)
        #expect(alert.messageText == "Couldn\u{2019}t remove your notes")
        #expect(alert.informativeText == SignOutCopy.why(refusal, unsynced: 2, kind: "Mac"))
        #expect(alert.buttons.map(\.title) == ask.choices.map(SignOutCopy.title))
        #expect(alert.buttons.first?.title == "Sign Out and Keep Notes")
    }

    @Test func eachAnswerIsItsButton() {
        let ask = SignOutAsk.first(.needsRecoveryKey, kind: "Mac")
        #expect(MacSignOut.choice(.alertFirstButtonReturn, in: ask) == .keepNotes)
        #expect(MacSignOut.choice(.alertSecondButtonReturn, in: ask) == .saveRecoveryKey)
        #expect(MacSignOut.choice(.alertThirdButtonReturn, in: ask) == .cancel)
        #expect(MacSignOut.choice(.cancel, in: ask) == .cancel, "closed some other way: nothing happens")
        #expect(MacSignOut.choice(.alertFirstButtonReturn, in: .first(.offered(keyStays: false))) == .signOut)
    }

    /// The default button, answered as the alert answers it: Sign Out removes when it's offered;
    /// otherwise Sign Out and Keep Notes keeps the library.
    @Test(arguments: [SignOutRemoval.Offer.offered(keyStays: true), .offered(keyStays: false), .needsRecoveryKey, .unavailable])
    func theDefaultButton(_ offer: SignOutRemoval.Offer) async throws {
        let (mac, rest) = try await rigs.device(offering: offer)
        defer { ([mac] + rest).forEach { $0.crypto.signedOut() } }
        let (flow, pressed) = rigs.flow(mac)
        flow.start()
        await flow.choose(MacSignOut.choice(.alertFirstButtonReturn, in: try #require(flow.ask)))
        if case .offered = offer {
            #expect(mac.notes == 0 && !mac.hasFiles && mac.steps.contains("erase") && pressed.kept == 0, "removed")
        } else {
            #expect(pressed.kept == 1 && mac.notes == 1 && mac.hasFiles && mac.steps.isEmpty, "kept")
        }
        #expect(flow.ask == nil && !mac.pending)
    }

    /// Refused: nothing changed, the alert asks again, and its default keeps the notes.
    @Test(arguments: [SignOutRemoval.Refusal.unsynced, .offline, .needsRecoveryKey, .unavailable])
    func aRefusedRemovalAsksAgain(_ refusal: SignOutRemoval.Refusal) async throws {
        let (mac, rest, meanwhile) = try await rigs.device(refusing: refusal)
        defer { ([mac] + rest).forEach { $0.crypto.signedOut() } }
        let notes = mac.notes
        let (flow, pressed) = rigs.flow(mac)
        flow.start()
        meanwhile()
        await flow.choose(MacSignOut.choice(.alertFirstButtonReturn, in: try #require(flow.ask)))
        let again = try #require(flow.ask, "asked again")
        #expect(MacSignOut.alert(again).informativeText == SignOutCopy.why(refusal, unsynced: refusal == .unsynced ? 2 : 0, kind: "Mac"))
        #expect(mac.notes == notes && mac.hasFiles && !mac.pending && !mac.steps.contains("erase"), "nothing changed")
        await flow.choose(MacSignOut.choice(.alertFirstButtonReturn, in: again))
        #expect(pressed.kept == 1 && flow.ask == nil && mac.notes == notes && mac.hasFiles)
    }
}
#endif
