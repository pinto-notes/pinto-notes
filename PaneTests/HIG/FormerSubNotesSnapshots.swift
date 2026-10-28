#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The Mac app with a library that held sub-notes before they were removed (2026-10-28): the
/// demo's Hotel booking made under Lisbon, as an older build made it, then folded into a folder
/// named Lisbon. In the app's window, offscreen. Runs only when AMBER_HIG_SHOTS is set.
@MainActor @Suite(.serialized) struct FormerSubNotesSnapshots {
    @Test func aLibraryThatHeldSubNotes() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let c = try AppSnapshotTests.container()
        let ctx = c.mainContext
        let notes = try ctx.fetch(FetchDescriptor<Note>())
        let lisbon = try #require(notes.first { $0.title == "Lisbon" })
        let hotel = try #require(notes.first { $0.title == "Hotel booking" })
        hotel.parentID = lisbon.id
        try ctx.save()
        #expect(ctx.foldSubNotesIntoFolders() == 1)
        #expect(hotel.folder?.name == "Lisbon" && hotel.folder?.parent?.name == "Travel")
        for (title, slug) in [("Hotel booking", "former-subnote"), ("Lisbon", "parent-with-link")] {
            try await AppSnapshotTests.withLastNote(c, title) {
                try await AppSnapshotTests.shoot(RootView().modelContainer(c), name: "mac-\(slug)-light", size: CGSize(width: 1180, height: 760), dark: false, wait: 1.2)
            }
        }
    }
}
#endif
