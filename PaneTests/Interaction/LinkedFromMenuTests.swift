#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// What links to a note is in its ••• menu, as Linked From, and nowhere under its text (Emil, 12
/// November 2026: "Mentioned in 1 note" showed under a note called To Play because another note
/// said "to play"). Only real links count. Menus are got by handing a right-click event made here
/// to the views (never posted, MenuLookTests); windows are far off the screen and never shown.
@MainActor @Suite(.serialized) struct LinkedFromMenuTests {
    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    /// The menu `LinkedFromMenu` makes for `note`, beside a Pin Note item, as the ••• menu holds it.
    static func menu(_ note: Note, in c: ModelContainer, open: @escaping (UUID) -> Void = { _ in }) async throws -> NSMenu {
        let view = Color.white.frame(width: 200, height: 100).contextMenu {
            Button("Pin Note", systemImage: "pin") {}
            LinkedFromMenu(note: note, open: open).equatable()
        }
        .modelContainer(c)
        let w = MenuLookTests.offscreenWindow(CGSize(width: 200, height: 100))
        let host = NSHostingView(rootView: view)
        host.frame = CGRect(x: 0, y: 0, width: 200, height: 100)
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(0.3))
        host.layoutSubtreeIfNeeded()
        return try #require(MenuLookTests.menu(in: host, window: w, x: 100) { $0.items.contains { $0.title == "Pin Note" } })
    }

    /// Lisbon, linked from Weekend plans (a wiki link) and Packing (a note link); Trip documents
    /// only says "Lisbon" in its text.
    static func library() throws -> (container: ModelContainer, lisbon: Note, weekend: Note, packing: Note, documents: Note) {
        let c = try container()
        let context = c.mainContext
        WikiDirectory.invalidate()
        let lisbon = context.createNote(in: .all, body: "Lisbon\n\nFour days of tiles, trams and pastries in May.")
        let weekend = context.createNote(in: .all, body: "Weekend plans\n\n- [ ] Flights for [[Lisbon]] on Thursday")
        let packing = context.createNote(in: .all, body: "Packing\n\nGood shoes for [the trip](pane-note:\(lisbon.id.uuidString.lowercased())).")
        packing.updatedAt = .now.addingTimeInterval(-3600)
        let documents = context.createNote(in: .all, body: "Trip documents\n\nEverything for the Lisbon trip in one place.")
        try context.save()
        WikiDirectory.invalidate()
        return (c, lisbon, weekend, packing, documents)
    }

    /// A note called To Play, and another that says "to play" without a link: the note ends where
    /// its text ends, with nothing under it about the other note, and its menu has no Linked From.
    @Test func aTitleInPlainWordsShowsNothingExtra() async throws {
        let c = try Self.container()
        let context = c.mainContext
        WikiDirectory.invalidate()
        let toPlay = context.createNote(in: .all, body: "To Play\n\nZelda\nHades")
        _ = context.createNote(in: .all, body: "Weekend\n\nThings to play on Saturday: chess.")
        try context.save()
        WikiDirectory.invalidate()

        let ax = OffscreenAX(NavigationStack { NoteDetailView(note: toPlay, controller: EditorController(), onNewNote: {}) }
            .modelContainer(c), size: CGSize(width: 700, height: 500))
        defer { ax.close() }
        await ax.settle(800)
        #expect(LockedNotePageTests.shownText(in: ax.window).contains("Zelda"), "the note is open")
        let said = ax.texts().joined(separator: "\n")
        for words in ["Things to play", "Mentioned in", "Unlinked mentions", "Linked from", "Linked From"] {
            #expect(!said.contains(words), "nothing under the note says \u{201C}\(words)\u{201D}: \(said)")
        }
        #expect(!ax.ids().contains { $0.hasPrefix("noteLinks") }, "\(ax.ids())")
        #expect(LinkedFromMenu.notes(linkingTo: toPlay, in: context).notes.isEmpty)
        let m = try await Self.menu(toPlay, in: c)
        #expect(MenuLookTests.layout(m) == ["Pin Note"])
    }

    /// Linked From lists the notes with a real link, newest first, by title, and not the note
    /// that only says the title; choosing one opens it.
    @Test func theMenuListsRealLinksAndOpensThem() async throws {
        let lib = try Self.library()
        var opened: [UUID] = []
        let m = try await Self.menu(lib.lisbon, in: lib.container) { opened.append($0) }
        #expect(MenuLookTests.layout(m) == ["Pin Note", LinkedFromMenu.title])
        let item = try #require(m.items.first { $0.title == "Linked From" })
        #expect(item.image != nil, "with its icon, as the menu's other items")
        let sub = try #require(item.submenu)
        #expect(MenuLookTests.layout(sub) == ["Weekend plans", "Packing"])
        sub.performActionForItem(at: 1)
        for _ in 0..<20 where opened.isEmpty { try? await Task.sleep(for: .milliseconds(25)) }
        #expect(opened == [lib.packing.id], "Packing opens")
        _ = lib.documents
    }

    /// No note links here: no Linked From in the menu at all.
    @Test func noLinkedFromWhenNothingLinksHere() async throws {
        let lib = try Self.library()
        let m = try await Self.menu(lib.documents, in: lib.container)
        #expect(MenuLookTests.layout(m) == ["Pin Note"])
        #expect(!m.items.contains { $0.title == LinkedFromMenu.title })
    }
}
#endif
