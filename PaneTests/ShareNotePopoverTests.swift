#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The toolbar's Share popover: the way it opens on, what its one line says, and its pictures.
@MainActor @Suite(.serialized) struct ShareNotePopoverTests {
    @Test func itOpensOnALinkWhenLinksCanBeMade() {
        #expect(ShareWays.initial(linkAvailable: true) == .link)
        #expect(ShareWays.initial(linkAvailable: false) == .copy)
    }

    /// The line under the chooser tells the truth: a link publishes a page anyone with it can
    /// read, until sharing is stopped; a copy is the note as it is now. Nothing about working together.
    @Test func theLineSaysWhatTheChosenWayDoes() {
        let fresh = ShareWays.line(.link, shared: false)
        #expect(fresh.contains("anyone with the link can read") && fresh.contains("until you stop sharing"))
        #expect(ShareWays.line(.link, shared: true).contains("Stop sharing"))
        #expect(ShareWays.line(.link, shared: true, trashed: true).contains("Recently Deleted"))
        #expect(ShareWays.line(.copy, shared: false).contains("as it is now"))
        for way in ShareWays.ways(collaborating: false) {
            for shared in [false, true] {
                let line = ShareWays.line(way, shared: shared).lowercased()
                #expect(!line.contains("collaborat") && !line.contains("together") && !line.contains("edit"))
            }
        }
    }

    /// Before sharing, once shared, and sending a copy; light and dark.
    @Test(arguments: [false, true])
    func pictures(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        ShareTargets.preview = ["Mail", "Messages", "Notes"].compactMap { name in
            NSSharingService(title: name, image: NSImage(systemSymbolName: name == "Mail" ? "envelope.fill" : name == "Messages" ? "message.fill" : "note.text", accessibilityDescription: nil) ?? NSImage(), alternateImage: nil, handler: {})
        }
        defer { ShareTargets.preview = nil }
        func popover(_ state: ShareLinkState, _ way: ShareWays.Way) -> some View {
            let store = ShareLinkStore(state: state)
            store.baseURL = URL(string: "https://pintonotes.com/s/")
            return SharePopoverCapture(store: store, way: way).tint(Color(PColor.paneAccent))
        }
        try await AppSnapshotTests.render(popover(ShareLinkState(phase: .notShared), .link), name: "mac-look-share-link-\(mode)", dark: dark)
        try await AppSnapshotTests.render(popover(ShareLinkState(phase: .shared(slug: "k3v9-dinner-guide", includesSubNotes: false)), .link), name: "mac-look-share-shared-\(mode)", dark: dark)
        try await AppSnapshotTests.render(popover(ShareLinkState(phase: .notShared), .copy), name: "mac-look-share-copy-\(mode)", dark: dark)
    }
}

private struct SharePopoverCapture: View {
    let store: ShareLinkStore
    let way: ShareWays.Way
    var body: some View {
        ShareNotePopover(title: "Dinner Guide", text: "Dinner Guide", store: store, linkAvailable: true, startingWay: way, close: {})
    }
}
#endif
