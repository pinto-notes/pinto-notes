import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// Every state of Share with people, light and dark: the Mac's popover (Collaborate) and the
/// iPhone's sheet, with sample people and no server. Offscreen; runs only when AMBER_HIG_SHOTS is
/// set. Mac: `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/CollabShareSnapshots`;
/// iPhone: the same suite under `xcodebuild test -destination 'platform=iOS Simulator,…'`.
@MainActor @Suite(.serialized) struct CollabShareSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    static let me = CollabGallery.emil, sara = CollabGallery.sara, jonas = CollabGallery.jonas

    static var alone: ShareState { ShareState(people: [.init(id: me, name: "Emil Wagman", isMe: true, role: "owner")]) }
    static func owner(_ access: ShareState.Access = .edit) -> ShareState {
        ShareState(link: access == .off ? nil : URL(string: "https://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw"), access: access, people: [
            .init(id: me, name: "Emil Wagman", isMe: true, role: "owner"),
            .init(id: sara, name: "Sara Lind", role: "editor", safetyCode: "4821 0937 5512"),
            .init(id: jonas, name: "Jonas Berg", role: "viewer", safetyCode: "0712 8461 3495"),
        ])
    }
    static var member: ShareState {
        ShareState(people: [
            .init(id: sara, name: "Sara Lind", isMe: true, role: "editor"),
            .init(id: me, name: "Emil Wagman", role: "owner", safetyCode: "4821 0937 5512"),
            .init(id: jonas, name: "Jonas Berg", role: "viewer", safetyCode: "0712 8461 3495"),
        ])
    }

    /// A controller over sample state, put into the moment the picture shows.
    static func controller(_ state: ShareState, _ moment: Moment = .rest) async -> ShareController {
        let backend = SampleShare(state)
        let share = ShareController(note: Note(body: "Team offsite"), backend: backend)
        switch moment {
        case .rest: break
        case .making:
            backend.delay = .seconds(30)
            Task { await share.shareLink() }
            try? await Task.sleep(for: .milliseconds(50))
        case .confirmRemove: share.askRemove(state.people[1])
        case .confirmLeave: share.askLeave()
        case .failed:
            backend.fails = true
            await share.setAccess(.view)
        }
        return share
    }

    enum Moment { case rest, making, confirmRemove, confirmLeave, failed }

    /// name, state, moment, and the person whose safety code shows.
    static let states: [(String, ShareState, Moment, UUID?)] = [
        ("1-not-shared", alone, .rest, nil),
        ("2-making-link", alone, .making, nil),
        ("3-can-edit", owner(.edit), .rest, nil),
        ("4-can-view", owner(.view), .rest, nil),
        ("5-link-off", owner(.off), .rest, nil),
        ("6-verify", owner(.edit), .rest, sara),
        ("7-confirm-remove", owner(.edit), .confirmRemove, nil),
        ("8-failed", owner(.edit), .failed, nil),
        ("9-member", member, .rest, nil),
        ("10-confirm-leave", member, .confirmLeave, nil),
        ("11-key-changed", keyChanged, .rest, nil),
        ("12-key-changed-verify", keyChanged, .rest, jonas),
        ("13-verified", verified, .rest, nil),
    ]

    static var keyChanged: ShareState {
        var s = owner(.edit)
        s.people[2].keyChanged = "Jonas\u{2019}s key changed. That usually means a new device. Check the code with Jonas before you share more."
        return s
    }

    static var verified: ShareState {
        var s = owner(.edit)
        s.people[1].verified = true
        return s
    }

    #if os(macOS)
    @Test func macPopover() async throws {
        guard let dir = Self.dir else { return }
        let store = ShareLinkStore(state: ShareLinkState(phase: .notShared))
        for dark in [false, true] {
            for (name, state, moment, verify) in Self.states {
                let share = await Self.controller(state, moment)
                let view = ShareNotePopover(title: "Team offsite", text: "Team offsite", store: store, linkAvailable: true, share: share,
                                            startingWay: .people, collaboratePage: verify.map { .verify($0) }, close: {})
                    .tint(Color(PColor.paneAccent))
                try await AppSnapshotTests.render(view, name: "mac-\(dark ? "dark" : "light")-\(name)", dark: dark)
            }
        }
    }

    /// Sara typing in the note and Jonas's selection, as the Mac editor draws them, with the
    /// toolbar's avatars above.
    @Test func macEditor() async throws {
        guard let dir = Self.dir else { return }
        let text = "Team offsite, 14 November\n\n## Agenda\n- 09:00 Coffee and goals for Q1\n- 10:30 Roadmap review\n- 12:30 Lunch at Tranan\n\n## Bring\n- [ ] Laptop and charger\n- [ ] Printed customer quotes\n"
        for dark in [false, true] {
            let h = await EditorHarness(text, width: 640, height: 420, dark: dark, focus: false)
            let ns = text as NSString
            let sara = ns.range(of: "Roadmap review")
            let jonas = ns.range(of: "Printed customer quotes")
            h.view.showRemoteCarets([
                RemoteCaret(id: Self.sara, name: "Sara", color: CollabSession.color(for: Self.sara), range: NSRange(location: NSMaxRange(sara), length: 0)),
                // Jonas has been still for a while: his flag has gone, his caret and selection stay.
                RemoteCaret(id: Self.jonas, name: "Jonas", color: CollabSession.color(for: Self.jonas), range: jonas, showsName: false),
            ])
            await h.settle(0.4)
            let rep = try #require(h.scroll.bitmapImageRepForCachingDisplay(in: h.scroll.bounds))
            h.scroll.cacheDisplay(in: h.scroll.bounds, to: rep)
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-\(dark ? "dark" : "light")-editor-carets.png"))
            h.window.close()

            let avatars = HStack(spacing: 10) {
                PresenceAvatars(people: [.init(id: Self.sara, name: "Sara Lind", typing: true), .init(id: Self.jonas, name: "Jonas Berg", canEdit: false)],
                                option: PresenceStack.badges)
                Image(systemName: "square.and.arrow.up").font(.system(size: 15))
            }
            .padding(12)
            try await AppSnapshotTests.render(avatars.tint(Color(PColor.paneAccent)), name: "mac-\(dark ? "dark" : "light")-toolbar-avatars", dark: dark)
        }
    }
    #endif

    #if os(iOS)
    @Test func iPhoneSheet() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        for dark in [false, true] {
            for (name, state, moment, verify) in Self.states where moment != .confirmRemove && moment != .confirmLeave {
                let share = await Self.controller(state, moment)
                let sheet: AnyView
                // Verify is pushed inside Share, as tapping a person does: "‹ Share" and Done above it.
                sheet = AnyView(NavigationStack(path: .constant(verify.map { [$0] } ?? [])) { ShareForm(share: share, done: {}) })
                try await ImportGuideSnapshots.shoot(sheet.tint(Color(PColor.paneAccent)), to: dir.appending(path: "iphone-\(dark ? "dark" : "light")-\(name).png"),
                                                     dark: dark, scene: scene)
            }
        }
    }
    #endif
}
