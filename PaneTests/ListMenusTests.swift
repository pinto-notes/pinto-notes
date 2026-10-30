import Foundation
import SwiftData
import Testing
@testable import Pane

/// The iPhone note list's menus, as in Apple Notes (Emil, 30 October 2026): a note's long-press
/// menu, the list's ••• menu, Group By Date per folder, Add Files saying where the files go, and
/// Recently Deleted's Edit bar. PaneUITests/ListMenusUITests drives the same on a simulator.
@MainActor @Suite struct ListMenusTests {
    let context: ModelContext

    init() throws {
        context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
    }

    @Test func aLongPressHasNotesActionsAndNoSelect() {
        // Share, Move and Delete across the top; then Pin, Lock and Duplicate.
        #expect(NoteRowMenu.groups(locked: false, trashed: false) == [[.share, .move, .delete], [.pin, .lock, .duplicate]])
        // A locked note's text isn't here to share or copy; its lock can come off.
        #expect(NoteRowMenu.groups(locked: true, trashed: false) == [[.move, .delete], [.pin, .removeLock]])
        // In Recently Deleted: back, or gone for good.
        #expect(NoteRowMenu.groups(locked: false, trashed: true) == [[.recover, .delete]])
        // Selecting starts from Select Notes in •••, never from a long-press.
        for locked in [false, true] {
            for trashed in [false, true] {
                #expect(!"\(NoteRowMenu.groups(locked: locked, trashed: trashed))".localizedCaseInsensitiveContains("select"))
            }
        }
    }

    @Test func theMoreMenuIsInNotesOrder() {
        #expect(ListMoreMenu.groups(connectNudge: false) == [[.selectNotes], [.sortBy, .groupByDate], [.addFiles]])
        #expect(ListMoreMenu.groups(connectNudge: true).last == [.connectAI], "Connect an AI, when it shows, comes last")
    }

    @Test func addFilesSaysWhereTheFilesGo() throws {
        let work = context.createFolder(named: "Work", parent: nil)
        try context.save()
        #expect(ListMoreMenu.addFilesTitle(folder: context.folderNameForFiles(.folder(work.id))) == "Add Files to \u{201C}Work\u{201D}\u{2026}")
        // All Notes keeps them in the first folder, and naming it makes no folder.
        let before = context.allFolders().count
        #expect(context.folderNameForFiles(.all) == context.folderForFiles(.all).name)
        #expect(context.allFolders().count == before)
        #expect(!ListMoreMenu.addFilesTitle(folder: "Work").hasPrefix("Add Files\u{2026}"))
    }

    @Test func recentlyDeletedEditActsOnAllUntilSomethingIsSelected() {
        #expect(TrashEditBar.titles(selected: 0) == ("Move All", "Delete All"))
        #expect(TrashEditBar.titles(selected: 1) == ("Move", "Delete"))
        #expect(TrashEditBar.titles(selected: 3) == ("Move", "Delete"))
    }

    /// Move All out of Recently Deleted brings a note back, also into the folder it was deleted from.
    @Test func movingOutOfRecentlyDeletedBringsNotesBack() throws {
        let home = context.createFolder(named: "Home", parent: nil)
        let other = context.createFolder(named: "Other", parent: nil)
        let a = context.createNote(in: .folder(home.id), body: "A\nbody")
        let b = context.createNote(in: .folder(home.id), body: "B\nbody")
        context.trash(a)
        context.trash(b)
        context.move([a, b], to: home)
        #expect(a.trashedAt == nil && a.folder?.id == home.id, "back in the folder it was in")
        context.trash(b)
        context.move(b, to: other)
        #expect(b.trashedAt == nil && b.folder?.id == other.id)
    }

    @Test func groupByDateIsKeptPerFolder() {
        let defaults = TestDefaults()
        let store = ListOrderStore(defaults: defaults)
        let work = Scope.folder(UUID()), home = Scope.folder(UUID())
        #expect(store.order(for: work).groupsByDate && store.order(for: .all).groupsByDate, "grouped, as the list always was")
        store.setGroupsByDate(false, for: work)
        #expect(!store.order(for: work).groupsByDate)
        #expect(store.order(for: home).groupsByDate && store.order(for: .all).groupsByDate, "other folders keep theirs")
        // The sort is still one for every list.
        store.order.key = .created
        #expect(store.order(for: work).key == .created && store.order(for: home).key == .created)
        // The next launch.
        let again = ListOrderStore(defaults: defaults)
        #expect(!again.order(for: work).groupsByDate && again.order(for: home).groupsByDate)
        // Grouping off in one folder changes its headings only.
        #expect(again.order(for: work).sortsLike(again.order(for: home)))
    }

    @Test func thePreviewReadsLikeTheNote() {
        let body = """
        Incredible TODO

        **Goal:** Get acquired
        - [ ] Pitch us as an AI native company
          - [ ] Set up a blog
          - [x] Reach out to journalists
        ## Later
        - A bullet
        """
        let lines = NotePreviewCard.lines(of: body)
        #expect(lines.first == .init(kind: .text, text: "Goal: Get acquired", depth: 0), "the title is the card's heading, not a line")
        #expect(lines.contains(.init(kind: .check(false), text: "Set up a blog", depth: 1)))
        #expect(lines.contains(.init(kind: .check(true), text: "Reach out to journalists", depth: 1)))
        #expect(lines.contains(.init(kind: .heading, text: "Later", depth: 0)))
        #expect(lines.last == .init(kind: .bullet, text: "A bullet", depth: 0))
        #expect(NotePreviewCard.lines(of: String(repeating: "line\n", count: 200)).count == 24, "enough to fill the card")
    }
}
