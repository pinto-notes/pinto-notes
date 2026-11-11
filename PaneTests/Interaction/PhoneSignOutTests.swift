import Foundation
import SwiftUI
import Testing
#if os(iOS)
import UIKit
#endif
@testable import Pane

/// iPhone 1.3 (Emil, 11 November 2026): Sign Out opened "this absurd popup with so much shit on
/// it": a popover with up to three buttons, two of them red, under three or four sentences. Now
/// an alert, as Settings asks before signing out of an Apple Account: the question, Sign Out and
/// Cancel, and one line only when changes haven't synced.
@MainActor @Suite struct PhoneSignOutTests {
    @Test func theLineIsOnlyForChangesNotSynced() {
        #expect(SignOutCopy.phoneTitle == "Sign out?")
        #expect(SignOutCopy.phoneTitle == SignOutCopy.macAlert(.unavailable).title, "the Mac asks the same question")
        #expect(SignOutCopy.phoneLine(unsynced: false) == nil)
        #expect(SignOutCopy.phoneLine(unsynced: true, kind: "iPhone") == "Some changes on this iPhone haven\u{2019}t synced yet.")
    }

    #if os(iOS)
    /// Sign Out… asks in an alert with two buttons; a line under the question only with changes
    /// that haven't synced.
    @Test func signOutAsksInAnAlertWithTwoButtons() async throws {
        for unsynced in [false, true] {
            let alert = try await Self.ask(unsynced: unsynced)
            #expect(alert.preferredStyle == .alert, "an alert in the middle, not a popover from the button")
            #expect(alert.title == "Sign out?")
            #expect(alert.actions.map(\.title) == ["Sign Out", "Cancel"])
            #expect(alert.actions.first?.style == .destructive)
            #expect(alert.actions.last?.style == .cancel)
            if unsynced {
                #expect(alert.message == "Some changes on this iPhone haven\u{2019}t synced yet.")
            } else {
                #expect((alert.message ?? "").isEmpty, "nothing under the question with everything synced: \(alert.message ?? "")")
            }
        }
    }

    /// The alert as SignOutButton raises it.
    static func ask(unsynced: Bool) async throws -> UIAlertController {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(rootView: Color.clear.modifier(PhoneSignOutAlert(asking: .constant(true), unsynced: unsynced) {}))
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
