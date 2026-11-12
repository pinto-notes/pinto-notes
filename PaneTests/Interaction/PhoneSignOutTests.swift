import Foundation
import SwiftUI
import Testing
#if os(iOS)
import UIKit
#endif
@testable import Pane

/// iPhone and iPad's Sign Out: a centred alert, as Settings asks before signing out of an Apple
/// Account (11 November 2026), whose one Sign Out button removes this iPhone's notes (12 November
/// 2026). When they can't go, one line says why, with Sign Out and Keep Notes and Cancel.
@MainActor @Suite struct PhoneSignOutTests {
    @Test func theAlertNamesTheDevice() {
        #expect(SignOutAsk.first(.offered(keyStays: true), kind: "iPhone").line == "This removes your notes from this iPhone. They stay in your account.")
        #expect(SignOutAsk.first(.needsRecoveryKey, kind: "iPad").line == "This iPad holds the only copy of your key. Save your recovery key first.")
    }

    #if os(iOS)
    /// Sign Out… asks in an alert: Sign Out (red) and Cancel when the notes can go; otherwise why,
    /// Sign Out and Keep Notes (red), the recovery key when that's what's missing, and Cancel.
    @Test(arguments: [SignOutRemoval.Offer.offered(keyStays: true), .offered(keyStays: false), .needsRecoveryKey, .unavailable])
    func signOutAsksInAnAlert(_ offer: SignOutRemoval.Offer) async throws {
        let flow = SignOutFlow(kind: "iPhone", offer: { offer }, remove: {}, keep: {}, showRecoveryKey: {})
        flow.start()
        let alert = try await Self.ask(flow)
        let ask = SignOutAsk.first(offer, kind: "iPhone")
        #expect(alert.preferredStyle == .alert, "an alert in the middle, not a popover from the button")
        #expect(alert.title == "Sign out?")
        #expect(alert.message == ask.line)
        #expect(alert.actions.map(\.title) == ask.choices.map(SignOutCopy.title))
        #expect(alert.actions.first?.style == .destructive, "the first is Sign Out, or Sign Out and Keep Notes")
        #expect(alert.actions.last?.style == .cancel)
        if case .offered = offer {
            #expect(alert.actions.map(\.title) == ["Sign Out", "Cancel"], "one Sign Out, which removes")
        } else {
            #expect(alert.actions.first?.title == "Sign Out and Keep Notes")
            #expect(alert.actions.contains { $0.title == SignOutCopy.saveRecoveryKey } == (offer == .needsRecoveryKey))
        }
    }

    /// Sign Out pressed and refused: the alert comes back with why, and Sign Out and Keep Notes.
    @Test(arguments: [SignOutRemoval.Refusal.unsynced, .offline, .needsRecoveryKey, .unavailable])
    func aRefusalAsksAgainWithWhy(_ refusal: SignOutRemoval.Refusal) async throws {
        var kept = 0
        let flow = SignOutFlow(kind: "iPhone", offer: { .offered(keyStays: true) }, remove: { throw refusal }, keep: { kept += 1 },
                               showRecoveryKey: {}, unsynced: { 2 }, offline: { true })
        flow.start()
        flow.answer(.signOut)
        _ = await PhoneFolderTapTests.until { flow.ask != nil }
        let alert = try await Self.ask(flow)
        #expect(alert.title == "Couldn\u{2019}t remove your notes")
        #expect(alert.message == SignOutCopy.why(refusal, unsynced: 2, offline: true, kind: "iPhone"))
        #expect(alert.actions.first?.title == "Sign Out and Keep Notes" && alert.actions.last?.title == "Cancel")
        flow.answer(.keepNotes)
        _ = await PhoneFolderTapTests.until { kept == 1 }
        #expect(kept == 1 && flow.ask == nil)
    }

    /// The alert as SignOutButton raises it, for what `flow` asks.
    static func ask(_ flow: SignOutFlow) async throws -> UIAlertController {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(rootView: Color.clear.modifier(PhoneSignOutAlert(flow: flow)))
        window.makeKeyAndVisible()
        defer {
            window.rootViewController?.presentedViewController?.dismiss(animated: false)
            window.isHidden = true
        }
        var shown: UIAlertController?
        _ = await PhoneFolderTapTests.until { shown = presented(in: window); return shown != nil }
        return try #require(shown, "nothing asked")
    }

    static func presented(in window: UIWindow) -> UIAlertController? {
        var vc = window.rootViewController?.presentedViewController
        while let v = vc {
            if let a = v as? UIAlertController { return a }
            vc = v.presentedViewController
        }
        return nil
    }
    #endif
}
