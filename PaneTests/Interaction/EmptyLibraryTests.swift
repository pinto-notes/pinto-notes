#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// An account with nothing in it, whose first run didn't come (newcomer audit #19: a second,
/// brand-new account on a Mac that had run setup showed "No Notes" and nothing to press). The
/// empty library offers its two ways to start in place: New Note, and Bring Your Notes.
@MainActor @Suite(.serialized) struct EmptyLibraryTests {
    @Test func onlyTheWholeLibraryOffersWaysToStart() {
        #expect(NoteListView.offersWaysToStart(scope: .all))
        #expect(!NoteListView.offersWaysToStart(scope: .folder(UUID())))
        #expect(!NoteListView.offersWaysToStart(scope: .trash))
        #expect(NoteListView.bringNotes == "Bring Your Notes\u{2026}")
        #expect(NoteListView.emptyLine.contains("Apple Notes") && NoteListView.emptyLine.contains("Google Keep"))
    }

    /// The empty library, light and dark, for the review.
    @Test func pictures() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        for dark in [false, true] {
            let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
            let root = NavigationStack { NoteListView(scope: .all, selection: .constant([]), onNewNote: {}) }
                .environment(\.importActions, ImportActions(appleNotes: {}, from: { _ in }))
                .modelContainer(c)
                .tint(Color(PColor.paneAccent))
                .environment(\.controlActiveState, .key)
            let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 320, height: 520), styleMask: [.borderless], backing: .buffered, defer: false)
            w.isReleasedWhenClosed = false
            w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            w.contentViewController = NSHostingController(rootView: root)
            w.setContentSize(CGSize(width: 320, height: 520))
            defer { w.close() }
            try await Task.sleep(for: .seconds(0.8))
            let view = try #require(w.contentView)
            view.layoutSubtreeIfNeeded()
            let rep = try #require(view.bitmapImageRepForCachingDisplay(in: view.bounds))
            view.cacheDisplay(in: view.bounds, to: rep)
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "empty-library-\(dark ? "dark" : "light").png"))
        }
    }
}
#endif
