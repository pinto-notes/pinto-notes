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

    /// name, state, moment, and on the Mac the page Collaborate opens on.
    static let states: [(String, ShareState, Moment, CollaborateRows.Page?)] = [
        ("1-not-shared", alone, .rest, nil),
        ("2-making-link", alone, .making, nil),
        ("3-can-edit", owner(.edit), .rest, nil),
        ("4-can-view", owner(.view), .rest, nil),
        ("5-link-off", owner(.off), .rest, nil),
        ("6-verify", owner(.edit), .rest, .verify(sara)),
        ("7-confirm-remove", owner(.edit), .confirmRemove, nil),
        ("8-failed", owner(.edit), .failed, nil),
        ("9-member", member, .rest, nil),
        ("10-confirm-leave", member, .confirmLeave, nil),
    ]

    #if os(macOS)
    @Test func macPopover() async throws {
        guard let dir = Self.dir else { return }
        let store = ShareLinkStore(state: ShareLinkState(phase: .notShared))
        for dark in [false, true] {
            for (name, state, moment, page) in Self.states {
                let share = await Self.controller(state, moment)
                let view = ShareNotePopover(title: "Team offsite", text: "Team offsite", store: store, linkAvailable: true, share: share,
                                            startingWay: .people, collaboratePage: page, close: {})
                    .tint(Color(PColor.paneAccent))
                try await AppSnapshotTests.render(view, name: "mac-\(dark ? "dark" : "light")-\(name)", dark: dark)
            }
        }
    }
    #endif

    #if os(iOS)
    @Test func iPhoneSheet() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        for dark in [false, true] {
            for (name, state, moment, page) in Self.states where moment != .confirmRemove && moment != .confirmLeave {
                let share = await Self.controller(state, moment)
                let sheet: AnyView
                if case .verify(let id) = page, let p = state.people.first(where: { $0.id == id }) {
                    sheet = AnyView(NavigationStack { PersonDetail(person: p, remove: {}) })
                } else {
                    sheet = AnyView(NavigationStack { ShareForm(title: "Team offsite", share: share) })
                }
                try await ImportGuideSnapshots.shoot(sheet.tint(Color(PColor.paneAccent)), to: dir.appending(path: "iphone-\(dark ? "dark" : "light")-\(name).png"),
                                                     dark: dark, scene: scene)
            }
        }
    }
    #endif
}
