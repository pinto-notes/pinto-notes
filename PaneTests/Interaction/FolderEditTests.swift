import Foundation
import SwiftData
import Testing
import UniformTypeIdentifiers
@testable import Pane

/// The iPhone folders screen's Edit and its folder menus, as values: the rows Edit lists, where a
/// row dragged by its handle lands, that the order is kept (and marked for sync), that Notes stays
/// first, that Move nests a folder (never inside itself), and what the menus offer.
@MainActor @Suite(.serialized) struct FolderEditTests {
    /// Notes, Work > (Clients, Plans), Home, Travel, in that order.
    static func library() throws -> (ModelContainer, [String: Folder]) {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        var by: [String: Folder] = [:]
        for name in ["Notes", "Work", "Home", "Travel"] { by[name] = ctx.createFolder(named: name) }
        by["Clients"] = ctx.createFolder(named: "Clients", parent: by["Work"])
        by["Plans"] = ctx.createFolder(named: "Plans", parent: by["Work"])
        try ctx.save()
        for f in by.values { f.dirty = false }
        return (c, by)
    }

    static func roots(_ ctx: ModelContext) -> [Folder] {
        ctx.allFolders().filter { $0.parent == nil }.sorted { $0.sortIndex < $1.sortIndex }
    }

    static func names(_ ctx: ModelContext, _ rows: [SidebarView.EditRow]) -> [String] {
        rows.map { r in ctx.folder(r.id).map { String(repeating: "  ", count: r.depth) + $0.name } ?? "?" }
    }

    @Test func editListsEachFolderUnderItsParentAndNotesStaysPut() throws {
        let (c, _) = try Self.library()
        let ctx = c.mainContext
        let rows = SidebarView.editRows(Self.roots(ctx))
        #expect(Self.names(ctx, rows) == ["Notes", "Work", "  Clients", "  Plans", "Home", "Travel"])
        #expect(rows.map(\.pinned) == [true, false, false, false, false, false])
    }

    @Test func draggingAFolderReordersItsLevelAndTheOrderIsKept() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        var rows = SidebarView.editRows(Self.roots(ctx))
        // Travel (row 5) dropped above Work (row 1): first after Notes.
        let t = try #require(SidebarView.reorderTarget(rows, from: [5], to: 1))
        #expect(t.id == by["Travel"]!.id && t.index == 1)
        ctx.reorder(by["Travel"]!, to: t.index)
        rows = SidebarView.editRows(Self.roots(ctx))
        #expect(Self.names(ctx, rows) == ["Notes", "Travel", "Work", "  Clients", "  Plans", "Home"])
        // Kept in the folders' sort index, which syncs: the moved ones are marked for it.
        #expect(by["Travel"]!.dirty && by["Work"]!.dirty && by["Home"]!.dirty)
        #expect(!by["Notes"]!.dirty && !by["Clients"]!.dirty)
        // A fresh read of the store has the same order.
        let fresh = ModelContext(c)
        #expect(fresh.allFolders().filter { $0.parent == nil }.sorted { $0.sortIndex < $1.sortIndex }.map(\.name) == ["Notes", "Travel", "Work", "Home"])
    }

    @Test func aSubfolderReordersAmongItsOwn() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        let rows = SidebarView.editRows(Self.roots(ctx))
        // Plans (row 3) dropped above Clients (row 2).
        let t = try #require(SidebarView.reorderTarget(rows, from: [3], to: 2))
        #expect(t.index == 0)
        ctx.reorder(by["Plans"]!, to: t.index)
        #expect(Self.names(ctx, SidebarView.editRows(Self.roots(ctx))) == ["Notes", "Work", "  Plans", "  Clients", "Home", "Travel"])
        #expect(by["Plans"]!.parent?.id == by["Work"]!.id, "dragging keeps a folder in its parent")
    }

    @Test func nothingGoesAboveNotes() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        let rows = SidebarView.editRows(Self.roots(ctx))
        #expect(SidebarView.reorderTarget(rows, from: [0], to: 3) == nil, "Notes has no handle")
        let t = try #require(SidebarView.reorderTarget(rows, from: [4], to: 0))
        ctx.reorder(by["Home"]!, to: t.index)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Home", "Work", "Travel"])
        #expect(ctx.defaultFolder().id == by["Notes"]!.id, "new notes still go to Notes")
    }

    @Test func moveNestsAFolderAndBackAtTheEnd() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        ctx.move(by["Travel"]!, into: by["Home"])
        #expect(Self.names(ctx, SidebarView.editRows(Self.roots(ctx))) == ["Notes", "Work", "  Clients", "  Plans", "Home", "  Travel"])
        #expect(by["Travel"]!.dirty)
        // Back to the top level: last there, never first (where it would take Notes' place).
        ctx.move(by["Clients"]!, into: nil)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Work", "Home", "Clients"])
        #expect(ctx.defaultFolder().id == by["Notes"]!.id)
    }

    @Test func moveNeverPutsAFolderInsideItself() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        #expect(SidebarView.subtree(of: by["Work"]!) == [by["Work"]!.id, by["Clients"]!.id, by["Plans"]!.id])
        ctx.move(by["Work"]!, into: by["Plans"])
        #expect(by["Work"]!.parent == nil)
    }

    @Test func theMenuIsGroupedNewThenChangesThenDelete() {
        let groups = SidebarView.folderMenu(isNotes: false, newWindow: false, reorders: false)
        #expect(groups == [[.newNote, .newFolder], [.rename, .duplicate, .move], [.delete]])
        #if os(macOS)
        #expect(groups.map { $0.map(\.title) } == [["New Note", "New Folder"], ["Rename", "Duplicate", "Move To"], ["Delete Folder…"]])
        #else
        #expect(groups.map { $0.map(\.title) } == [["New Note", "New Folder"], ["Rename", "Duplicate", "Move To"], ["Delete Folder"]])
        #endif
        #expect(groups.flatMap { $0 }.map(\.symbol) == ["square.and.pencil", "folder.badge.plus", "pencil", "plus.square.on.square", "folder", "trash"])
        #expect(!FolderAction.allCases.map(\.title).contains("New Subfolder"))
        let notes = SidebarView.folderMenu(isNotes: true, newWindow: false, reorders: false)
        #expect(!notes.joined().contains(.move), "Notes stays first")
        #expect(notes == [[.newNote, .newFolder], [.rename, .duplicate]], "Notes can't be deleted, as in Apple Notes")
    }

    /// On the Mac a folder opens in a window of its own, first in its menu, as in Apple Notes
    /// (Emil, 2 November 2026); iPhone has no windows.
    @Test func theMacMenuOpensTheFolderInANewWindowFirst() {
        #if os(macOS)
        #expect(FolderAction.opensWindows)
        #expect(SidebarView.folderMenu(isNotes: false) == [[.openInNewWindow], [.newNote, .newFolder], [.rename, .duplicate, .move], [.moveUp, .moveDown], [.delete]])
        #expect(SidebarView.folderMenu(isNotes: true).first == [.openInNewWindow], "Notes opens in a window too")
        #else
        #expect(!FolderAction.opensWindows)
        #expect(!SidebarView.folderMenu(isNotes: false).joined().contains(.openInNewWindow))
        #endif
        #expect(FolderAction.openInNewWindow.title == "Open in New Window")
        #expect(FolderAction.openInNewWindow.symbol == NoteWindows.symbol)
    }

    // MARK: The Mac sidebar: a folder dragged to the line between two rows, Move Up and Move Down
    // (Emil, 9 November 2026: "a line between the folders appear and you can drop it there").

    /// The list says where between its rows a folder was dropped counting the folder where it
    /// still is; `place` leaves it out, so below its old place the index is one less.
    @Test func theListsInsertIndexBecomesThePlaceAmongTheOthers() {
        let a = UUID(), b = UUID(), c = UUID(), d = UUID()
        let row = [a, b, c, d]
        #expect(SidebarView.placeIndex(of: b, at: 0, among: row) == 0, "above its old place: as given")
        #expect(SidebarView.placeIndex(of: b, at: 1, among: row) == 1, "just above itself: where it is")
        #expect(SidebarView.placeIndex(of: b, at: 2, among: row) == 1, "just below itself: where it is")
        #expect(SidebarView.placeIndex(of: b, at: 4, among: row) == 3, "at the end")
        #expect(SidebarView.placeIndex(of: UUID(), at: 2, among: row) == 2, "from another level: as given")
        // At the top level the list's rows start after Notes.
        #expect(SidebarView.placeIndex(of: UUID(), at: 0, among: row, after: 1) == 1, "the gap under Notes is after it")
        #expect(SidebarView.placeIndex(of: c, at: 4, among: row, after: 1) == 4)
    }

    /// A folder dropped between two rows of the same level moves among them, and from another
    /// level it changes level, as in Notes. Kept in the synced sort index and parent.
    @Test func aFolderDroppedBetweenRowsGoesThere() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        // As the Mac's list counts: at the top level its rows start after Notes, which isn't one.
        func drop(_ name: String, in parent: Folder?, at index: Int) {
            let siblings = parent.map { $0.liveChildren.map(\.id) } ?? Self.roots(ctx).dropFirst().map(\.id)
            ctx.place(by[name]!, in: parent, at: SidebarView.placeIndex(of: by[name]!.id, at: index, among: siblings, after: parent == nil ? 1 : 0))
        }
        // Travel in the gap under Notes, above Work.
        drop("Travel", in: nil, at: 0)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Travel", "Work", "Home"])
        // Travel to the end, below Home.
        drop("Travel", in: nil, at: 3)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Work", "Home", "Travel"])
        // Dropped just below itself or just above itself: nothing to change, nothing to sync.
        for f in by.values { f.dirty = false }
        drop("Travel", in: nil, at: 3)
        drop("Home", in: nil, at: 1)
        #expect(by.values.allSatisfy { !$0.dirty })
        // Plans above Clients, inside Work.
        drop("Plans", in: by["Work"], at: 0)
        #expect(by["Work"]!.liveChildren.map(\.name) == ["Plans", "Clients"])
        // Home between Work's folders: a level in.
        drop("Home", in: by["Work"], at: 1)
        #expect(by["Work"]!.liveChildren.map(\.name) == ["Plans", "Home", "Clients"])
        // Clients out to the top level, under Notes.
        drop("Clients", in: nil, at: 0)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Clients", "Work", "Travel"])
        #expect(by["Clients"]!.parent == nil && by["Clients"]!.dirty)
        let fresh = ModelContext(c)
        let work = try #require(fresh.folder(by["Work"]!.id))
        #expect(work.liveChildren.map(\.name) == ["Plans", "Home"])
    }

    @Test func betweenRowsKeepsNotesFirstAndNeverNestsAFolderInItself() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        // Above Notes: after it.
        ctx.place(by["Home"]!, in: nil, at: 0)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Home", "Work", "Travel"])
        #expect(ctx.defaultFolder().id == by["Notes"]!.id, "new notes still go to Notes")
        // Notes itself stays put.
        for f in by.values { f.dirty = false }
        ctx.place(by["Notes"]!, in: nil, at: 3)
        ctx.place(by["Notes"]!, in: by["Work"], at: 0)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Home", "Work", "Travel"] && !by["Notes"]!.dirty)
        // Work between its own folders: nowhere, nothing changes.
        ctx.place(by["Work"]!, in: by["Work"], at: 1)
        ctx.place(by["Work"]!, in: by["Clients"], at: 0)
        #expect(by["Work"]!.parent == nil && !by["Work"]!.dirty)
    }

    /// Clicking a folder picks it: reordering is the list's own (`onInsert` on the folders), so the
    /// rows keep their tag and the list its selection, and nothing on a row takes the click
    /// (the first try, 9 November 2026: a click started a drag and never picked the folder).
    @Test func reorderingLeavesTheClickToTheList() throws {
        let file = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("Pane/Views/SidebarView.swift")
        let src = try String(contentsOf: file, encoding: .utf8)
        let tree = try #require(src.range(of: "private struct FolderTree: View").map { String(src[$0.lowerBound...]) })
        let row = String(tree[..<(tree.range(of: "/// The name, and its count")?.lowerBound ?? tree.endIndex)])
        #expect(row.contains(".tag(Scope.folder(folder.id))"), "the row is the list's to pick")
        for banned in ["onTapGesture", "DragGesture", ".gesture(", "highPriorityGesture", "simultaneousGesture", "onGeometryChange"] {
            #expect(!row.contains(banned), "nothing on a folder's row takes the click: \(banned)")
        }
        #expect(row.contains(".onInsert(of: [.paneFolder])"), "between a folder's own folders")
        #expect(src.components(separatedBy: ".onInsert(of: [.paneFolder])").count - 1 == 2, "the top level and inside a folder, nothing else")
        #expect(!src.contains("FolderDropZone") && !src.contains("FolderDropLine"), "no line of our own: the list draws it")
        #expect(src.contains("ForEach(Array(roots.dropFirst()))"), "Notes isn't one of the rows that take a folder between them: no gap above it")
    }

    /// Only a dragged folder says it's a folder, so a row knows mid-drag whether the line applies.
    @Test func aDraggedFolderSaysItIsAFolder() {
        let folder = NSItemProvider(), note = NSItemProvider()
        folder.register(PaneDragItem(kind: .folder, id: UUID()))
        note.register(PaneDragItem(kind: .note, id: UUID()))
        #expect(folder.registeredTypeIdentifiers.contains(UTType.paneFolder.identifier))
        #expect(folder.registeredTypeIdentifiers.contains(UTType.paneItem.identifier), "still a pane item, so every drop takes it")
        #expect(!note.registeredTypeIdentifiers.contains(UTType.paneFolder.identifier))
        #expect(note.registeredTypeIdentifiers.contains(UTType.paneItem.identifier))
    }

    @Test func moveUpAndMoveDownGoOnePlaceAndStopAtTheEnds() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        #expect(SidebarView.folderMenu(isNotes: false, newWindow: false, reorders: true) == [[.newNote, .newFolder], [.rename, .duplicate, .move], [.moveUp, .moveDown], [.delete]])
        #expect(!SidebarView.folderMenu(isNotes: true, newWindow: false, reorders: true).joined().contains(.moveUp), "Notes stays first")
        #expect(FolderAction.moveUp.title == "Move Up" && FolderAction.moveDown.title == "Move Down")
        #expect(!ctx.canNudge(by["Notes"]!, by: 1) && !ctx.canNudge(by["Notes"]!, by: -1))
        #expect(!ctx.canNudge(by["Work"]!, by: -1), "nothing above Notes")
        #expect(ctx.canNudge(by["Work"]!, by: 1) && !ctx.canNudge(by["Travel"]!, by: 1))
        ctx.nudge(by["Work"]!, by: 1)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Home", "Work", "Travel"])
        ctx.nudge(by["Travel"]!, by: -1)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Home", "Travel", "Work"])
        ctx.nudge(by["Home"]!, by: -1)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Home", "Travel", "Work"], "a disabled Move Up does nothing")
        #expect(!ctx.canNudge(by["Clients"]!, by: -1) && ctx.canNudge(by["Clients"]!, by: 1))
        ctx.nudge(by["Clients"]!, by: 1)
        #expect(by["Work"]!.liveChildren.map(\.name) == ["Plans", "Clients"])
        #expect(by["Clients"]!.dirty && by["Plans"]!.dirty)
    }

    /// Dragging the folder you're in keeps it shown, wherever it goes, as in Notes (9 November
    /// 2026: the list picked All Notes as the drag started). Only a folder really deleted
    /// falls back to All Notes.
    @Test func theFolderYouMoveStaysSelected() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        func live() -> [UUID] { ctx.allFolders().filter { $0.deletedAt == nil }.map(\.id) }
        #if os(macOS)
        #expect(!SidebarView.listPickCounts(during: .leftMouseDragged), "the list's pick as a drag starts is ignored")
        #expect(SidebarView.listPickCounts(during: .leftMouseDown) && SidebarView.listPickCounts(during: .keyDown) && SidebarView.listPickCounts(during: nil), "a click or a key still picks")
        #endif
        for name in ["Travel", "Clients"] {
            let shown = Scope.folder(by[name]!.id)
            // Between two rows at the top, inside another folder, out to the top level, Move Up.
            ctx.place(by[name]!, in: nil, at: 1)
            #expect(Scope.settled(shown, liveFolders: live()) == shown)
            ctx.move(by[name]!, into: by["Home"])
            #expect(Scope.settled(shown, liveFolders: live()) == shown)
            ctx.place(by[name]!, in: nil, at: 2)
            ctx.nudge(by[name]!, by: -1)
            #expect(Scope.settled(shown, liveFolders: live()) == shown)
            #expect(SidebarView.picking([shown], scope: shown).scope == shown)
        }
        ctx.trash(by["Travel"]!)
        #expect(Scope.settled(.folder(by["Travel"]!.id), liveFolders: live()) == .all, "a deleted folder falls back to All Notes")
    }

    /// Opening and closing a folder is instant on the Mac: the list's slide drew the folders
    /// inside over the row below (9 November 2026).
    @Test func aFolderOpensAndClosesWithoutTheSlide() throws {
        let file = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("Pane/Views/SidebarView.swift")
        let src = try String(contentsOf: file, encoding: .utf8)
        let tree = try #require(src.range(of: "private struct FolderTree: View").map { String(src[$0.lowerBound...]) })
        #expect(tree.contains("DisclosureGroup(isExpanded: opening)"))
        #expect(tree.contains("withTransaction(FolderTree.instant) { expanded = open }"))
        #expect(tree.contains("t.disablesAnimations = true"))
    }

    @Test func newNoteFromAFolderLandsInItAndOpens() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        let made = RootView.newNote(inFolder: by["Clients"]!.id, context: ctx)
        let note = try #require(ctx.note(made.note))
        #expect(note.folder?.id == by["Clients"]!.id)
        #expect(made.scope == .folder(by["Clients"]!.id), "the folder is selected, so its list shows the new note")
        #expect(note.body.isEmpty && note.dirty)
    }

    @Test func duplicateCopiesNotesAndSubfoldersWithNewIDsRightAfterIt() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        let a = ctx.createNote(in: .folder(by["Work"]!.id), body: "Plan\n\nfirst")
        a.isPinned = true
        _ = ctx.createNote(in: .folder(by["Clients"]!.id), body: "Acme\n\ncall")
        let gone = ctx.createNote(in: .folder(by["Plans"]!.id), body: "Old")
        ctx.trash(gone)
        let before = Set(((try? ctx.fetch(FetchDescriptor<Note>())) ?? []).map(\.id))
        let copy = ctx.duplicate(by["Work"]!)
        #expect(copy.name == "Work copy")
        #expect(copy.id != by["Work"]!.id && copy.dirty)
        #expect(Self.names(ctx, SidebarView.editRows(Self.roots(ctx))) == ["Notes", "Work", "  Clients", "  Plans", "Work copy", "  Clients", "  Plans", "Home", "Travel"])
        #expect(copy.liveChildren.allSatisfy { $0.dirty && ![by["Clients"]!.id, by["Plans"]!.id].contains($0.id) })
        let copied = copy.liveNotes
        #expect(copied.map(\.body) == ["Plan\n\nfirst"] && copied[0].isPinned)
        #expect(copy.liveChildren.first { $0.name == "Clients" }?.liveNotes.map(\.body) == ["Acme\n\ncall"])
        #expect(copy.liveChildren.first { $0.name == "Plans" }?.notes.isEmpty == true, "Recently Deleted stays behind")
        let all = (try? ctx.fetch(FetchDescriptor<Note>())) ?? []
        let new = all.filter { !before.contains($0.id) }
        #expect(new.count == 2 && new.allSatisfy(\.dirty), "real copies, new ids, marked for sync")
        // The originals are untouched.
        #expect(by["Work"]!.liveNotes.map(\.id) == [a.id] && !by["Home"]!.dirty)
        // Again: the next name, still right after the original.
        let again = ctx.duplicate(by["Work"]!)
        #expect(again.name == "Work copy 2")
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Work", "Work copy 2", "Work copy", "Home", "Travel"])
        // A fresh read of the store has them.
        #expect(ModelContext(c).allFolders().filter { $0.name == "Work copy" }.count == 1)
    }

    /// A locked note's box is bound to its id: the copy is sealed again for its own, so the same
    /// password opens it, with its front matter. While the password isn't open it isn't copied.
    @Test func duplicatingKeepsLockedNotesOpenableAndFrontMatter() async throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        let vault = NoteVault(keyStore: MemoryKeyStore(), defaults: MemoryDefaults(), iterations: 1_000)
        try await vault.setUp(password: "hunter22", hint: nil)
        let secret = ctx.createNote(in: .folder(by["Work"]!.id), body: "Bank\n\nPIN 4512")
        secret.frontMatter = "aliases: [money]"
        try vault.lock(secret)
        let plain = ctx.createNote(in: .folder(by["Work"]!.id), body: "Plan\n\nfirst")
        plain.frontMatter = "source: obsidian"
        try ctx.save()

        let copy = ctx.duplicate(by["Work"]!, vault: vault)
        let copiedLocked = try #require(copy.liveNotes.first { $0.lockedBody != nil })
        #expect(copiedLocked.id != secret.id && copiedLocked.lockedBody != secret.lockedBody && copiedLocked.dirty)
        #expect(copiedLocked.body == "Bank" && copiedLocked.frontMatter == nil)
        #expect(copy.liveNotes.first { $0.lockedBody == nil }?.frontMatter == "source: obsidian")
        // Locked again, then the same password: a fresh read of the store opens the copy.
        vault.lockNow()
        try await vault.unlock(password: "hunter22")
        let fresh = try #require(ModelContext(c).note(copiedLocked.id))
        #expect(vault.text(of: fresh) == "Bank\n\nPIN 4512")
        #expect(vault.frontMatter(of: fresh) == "aliases: [money]")
        // The original still opens.
        #expect(vault.text(of: secret) == "Bank\n\nPIN 4512")

        // Locked: the copy leaves the locked note out rather than making one that can't open.
        vault.lockNow()
        let again = ctx.duplicate(by["Work"]!, vault: vault)
        #expect(again.liveNotes.map(\.body) == ["Plan\n\nfirst"])
        #expect(((try? ctx.fetch(FetchDescriptor<Note>())) ?? []).filter { $0.lockedBody != nil }.count == 2, "no unreadable copy was made")
    }

    @Test func moveToListsTheTreeAndNeverTheFolderOrWhatsInIt() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        let t = SidebarView.moveTargets(for: by["Work"]!, in: ctx.allFolders())
        #expect(t.map { String(repeating: "  ", count: $0.depth) + $0.name } == ["Top Level", "Notes", "Work", "  Clients", "  Plans", "Home", "Travel"])
        #expect(t.filter { !$0.enabled }.map(\.name) == ["Work", "Clients", "Plans"])
        #expect(t.filter(\.current).map(\.name) == ["Top Level"])
        let inner = SidebarView.moveTargets(for: by["Plans"]!, in: ctx.allFolders())
        #expect(inner.filter(\.current).map(\.name) == ["Work"])
        #expect(inner.filter { !$0.enabled }.map(\.name) == ["Plans"])
        // Into a descendant: refused. Elsewhere: moved, and marked for sync.
        ctx.move(by["Work"]!, into: by["Clients"])
        #expect(by["Work"]!.parent == nil)
        ctx.move(by["Work"]!, into: by["Home"])
        #expect(by["Work"]!.parent?.id == by["Home"]!.id && by["Work"]!.dirty)
        #expect(Self.names(ctx, SidebarView.editRows(Self.roots(ctx))) == ["Notes", "Home", "  Work", "    Clients", "    Plans", "Travel"])
    }
}
