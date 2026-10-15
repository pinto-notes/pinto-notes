import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// Share's questions on iPhone (Join, Remove, Leave, Delete) are system alerts in the system's own
/// colours: the app's amber tint doesn't reach their buttons, so the highlighted button is never
/// amber on blue. Presented for real in a window of the test host on the simulator; with
/// AMBER_HIG_SHOTS set, each is also photographed.
@MainActor @Suite(.serialized) struct SystemAlertColourTests {
    /// Both platforms: the questions' words, as the alerts show them.
    @Test func theQuestionsWords() {
        #expect(JoinCopy.askTitle(JoinPreview(title: "Team offsite", owner: "Emil Wagman", canEdit: true)) == "Join \u{201C}Team offsite\u{201D}?")
        #expect(ShareCopy.leaveTitle("Team offsite") == "Leave \u{201C}Team offsite\u{201D}?")
    }

    #if os(iOS)
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    /// The screen the questions sit on, tinted amber as the app is.
    static func present(_ view: some View, name: String) async throws -> UIAlertController {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(rootView: view.tint(Color(PColor.paneAccent)))
        window.isHidden = false
        defer { window.rootViewController?.dismiss(animated: false); window.isHidden = true }
        var alert: UIAlertController?
        for _ in 0..<40 where alert == nil {
            try? await Task.sleep(for: .milliseconds(100))
            alert = window.rootViewController?.presentedViewController as? UIAlertController
        }
        let found = try #require(alert, "\(name): no alert")
        try? await Task.sleep(for: .milliseconds(500))
        if let dir = Self.dir {
            let format = UIGraphicsImageRendererFormat()
            format.scale = 3
            let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                found.view.drawHierarchy(in: found.view.frame, afterScreenUpdates: true)
            }
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try #require(image.pngData()).write(to: dir.appending(path: "iphone-alert-\(name).png"))
        }
        return found
    }

    /// The alert's buttons take the alert view's tint: it's the system's, not the app's amber.
    static func expectSystemColours(_ alert: UIAlertController, _ name: String) {
        let tint = alert.view.tintColor.resolvedColor(with: alert.traitCollection)
        let amber = UIColor(Color(PColor.paneAccent)).resolvedColor(with: alert.traitCollection)
        #expect(tint == SystemAlert.tint.resolvedColor(with: alert.traitCollection), "\(name): \(tint)")
        #expect(tint != amber, "\(name)")
    }

    @Test func joinIsInTheSystemsColours() async throws {
        let center = JoinCenter()
        center.ready = { true }
        center.preview = { _ in JoinPreview(title: "Team offsite", owner: "Emil Wagman", canEdit: true) }
        CollabFeature.forced = true
        defer { CollabFeature.forced = nil }
        struct Host: View {
            let center: JoinCenter
            var body: some View { Color.white.modifier(JoinLinkHandler(center: center)) }
        }
        center.open(URL(string: "https://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw")!)
        let alert = try await Self.present(Host(center: center), name: "join")
        #expect(alert.title == "Join \u{201C}Team offsite\u{201D}?")
        #expect(Set(alert.actions.compactMap(\.title)) == ["Not Now", "Join"])
        // No filled button: both read in the system's colours.
        #expect(alert.preferredAction == nil)
        Self.expectSystemColours(alert, "join")
    }

    @Test func removeAndLeaveAreInTheSystemsColours() async throws {
        for leaving in [false, true] {
            let state = leaving ? ShareControllerTests.member() : ShareControllerTests.owner(link: .edit)
            let share = ShareController(note: Note(body: "Team offsite"), backend: SampleShare(state))
            if leaving { share.askLeave() } else { share.askRemove(state.people[1]) }
            let alert = try await Self.present(Color.white.modifier(ShareConfirmations(share: share)), name: leaving ? "leave" : "remove")
            #expect(alert.actions.contains { $0.style == .destructive && $0.title == (leaving ? "Leave" : "Remove") })
            Self.expectSystemColours(alert, leaving ? "leave" : "remove")
        }
    }

    @Test func deleteIsInTheSystemsColours() async throws {
        let note = Note(body: "Team offsite\n")
        note.sharedNoteID = note.id
        struct Host: View {
            @State var pending: [Note]?
            var body: some View { Color.white.sharedDeleteConfirmation($pending) { _ in } }
        }
        let alert = try await Self.present(Host(pending: [note]), name: "delete")
        #expect(alert.title == "Delete \u{201C}Team offsite\u{201D} for everyone?")
        #expect(alert.actions.contains { $0.style == .destructive && $0.title == "Delete" })
        Self.expectSystemColours(alert, "delete")
    }
    #endif
}
