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

    /// The top and foot quarters of a row put a dragged folder between rows; the middle puts it
    /// in. A note or a file always goes in, and nothing goes above Notes.
    @Test func whereOnTheRowADraggedFolderGoes() {
        #expect(FolderDropZone.at(y: 2, height: 40, folder: true) == .before)
        #expect(FolderDropZone.at(y: 9.9, height: 40, folder: true) == .before)
        #expect(FolderDropZone.at(y: 10.1, height: 40, folder: true) == .into)
        #expect(FolderDropZone.at(y: 20, height: 40, folder: true) == .into)
        #expect(FolderDropZone.at(y: 30.1, height: 40, folder: true) == .after)
        #expect(FolderDropZone.at(y: 39, height: 40, folder: true) == .after)
        // Past the row (its reach, between rows) still counts as its edge.
        #expect(FolderDropZone.at(y: -3, height: 40, folder: true) == .before)
        #expect(FolderDropZone.at(y: 44, height: 40, folder: true) == .after)
        for y in [2.0, 20, 39] { #expect(FolderDropZone.at(y: y, height: 40, folder: false) == .into, "a note goes in") }
        #expect(FolderDropZone.at(y: 2, height: 40, folder: true, before: false) == .into, "nothing above Notes")
        #expect(FolderDropZone.at(y: 39, height: 40, folder: true, before: false) == .after)
        #expect(FolderDropZone.at(y: 2, height: 0, folder: true) == .into, "a row not yet measured")
    }

    @Test func aFolderDroppedOnTheLineReordersItsLevel() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        // Travel on the line above Work: first after Notes.
        let spot = try #require(SidebarView.placement(dropping: by["Travel"]!, zone: .before, on: by["Work"]!, open: true, context: ctx))
        #expect(spot.parent == nil && spot.index == 1)
        ctx.place(by["Travel"]!, in: spot.parent, at: spot.index)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Travel", "Work", "Home"])
        // Below Home: last.
        let end = try #require(SidebarView.placement(dropping: by["Travel"]!, zone: .after, on: by["Home"]!, open: false, context: ctx))
        ctx.place(by["Travel"]!, in: end.parent, at: end.index)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Work", "Home", "Travel"])
        // Among a folder's own: Plans above Clients.
        let sub = try #require(SidebarView.placement(dropping: by["Plans"]!, zone: .before, on: by["Clients"]!, open: false, context: ctx))
        ctx.place(by["Plans"]!, in: sub.parent, at: sub.index)
        #expect(by["Work"]!.liveChildren.map(\.name) == ["Plans", "Clients"])
        #expect(by["Plans"]!.parent?.id == by["Work"]!.id)
        // The middle of a row is "in it", which Move does; onto itself is nowhere.
        #expect(SidebarView.placement(dropping: by["Home"]!, zone: .into, on: by["Work"]!, open: false, context: ctx) == nil)
        #expect(SidebarView.placement(dropping: by["Home"]!, zone: .after, on: by["Home"]!, open: false, context: ctx) == nil)
    }

    /// The line also moves a folder between levels, as in Notes: beside a sub-folder it goes in
    /// that folder; beside a top-level one it comes out; at the foot of an open folder it goes in
    /// first.
    @Test func theLineMovesAFolderToItsLevel() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        let into = try #require(SidebarView.placement(dropping: by["Home"]!, zone: .after, on: by["Clients"]!, open: false, context: ctx))
        ctx.place(by["Home"]!, in: into.parent, at: into.index)
        #expect(Self.names(ctx, SidebarView.editRows(Self.roots(ctx))) == ["Notes", "Work", "  Clients", "  Home", "  Plans", "Travel"])
        let out = try #require(SidebarView.placement(dropping: by["Clients"]!, zone: .before, on: by["Travel"]!, open: false, context: ctx))
        ctx.place(by["Clients"]!, in: out.parent, at: out.index)
        #expect(Self.names(ctx, SidebarView.editRows(Self.roots(ctx))) == ["Notes", "Work", "  Home", "  Plans", "Clients", "Travel"])
        let first = try #require(SidebarView.placement(dropping: by["Travel"]!, zone: .after, on: by["Work"]!, open: true, context: ctx))
        #expect(first.parent?.id == by["Work"]!.id && first.index == 0)
        ctx.place(by["Travel"]!, in: first.parent, at: first.index)
        #expect(Self.names(ctx, SidebarView.editRows(Self.roots(ctx))) == ["Notes", "Work", "  Travel", "  Home", "  Plans", "Clients"])
        // Closed, the foot of Work is after Work, at its level.
        let after = try #require(SidebarView.placement(dropping: by["Clients"]!, zone: .after, on: by["Work"]!, open: false, context: ctx))
        #expect(after.parent == nil && after.index == 2)
        // Kept in the folders' sort index and parent, which sync; a fresh read has them.
        #expect(by["Travel"]!.dirty && by["Home"]!.dirty && by["Clients"]!.dirty)
        let fresh = ModelContext(c)
        let work = try #require(fresh.folder(by["Work"]!.id))
        #expect(work.liveChildren.map(\.name) == ["Travel", "Home", "Plans"])
    }

    @Test func theLineKeepsNotesFirstAndNeverNestsAFolderInItself() throws {
        let (c, by) = try Self.library()
        let ctx = c.mainContext
        // Above Notes: after it.
        let top = try #require(SidebarView.placement(dropping: by["Home"]!, zone: .before, on: by["Notes"]!, open: false, context: ctx))
        ctx.place(by["Home"]!, in: top.parent, at: top.index)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Home", "Work", "Travel"])
        #expect(ctx.defaultFolder().id == by["Notes"]!.id, "new notes still go to Notes")
        // Notes itself stays put.
        for f in by.values { f.dirty = false }
        ctx.place(by["Notes"]!, in: nil, at: 3)
        ctx.place(by["Notes"]!, in: by["Work"], at: 0)
        #expect(Self.roots(ctx).map(\.name) == ["Notes", "Home", "Work", "Travel"] && !by["Notes"]!.dirty)
        // Work beside its own Clients: nowhere, nothing changes.
        let inside = try #require(SidebarView.placement(dropping: by["Work"]!, zone: .after, on: by["Clients"]!, open: false, context: ctx))
        ctx.place(by["Work"]!, in: inside.parent, at: inside.index)
        #expect(by["Work"]!.parent == nil && !by["Work"]!.dirty)
        // Dropped where it already is: nothing to sync.
        let same = try #require(SidebarView.placement(dropping: by["Work"]!, zone: .after, on: by["Home"]!, open: false, context: ctx))
        ctx.place(by["Work"]!, in: same.parent, at: same.index)
        #expect(by.values.allSatisfy { !$0.dirty })
    }

    /// A row's middle still takes a dragged folder in (it lights, no line); its edges draw the
    /// line and put the light out; leaving the row or a drop takes the line away.
    @Test func theRowLightsInItsMiddleAndDrawsTheLineAtItsEdges() {
        let drops = FolderDropState(), a = UUID(), b = UUID()
        drops.id = a
        drops.folderDrag(over: a, zone: .into, nests: false)
        #expect(drops.lit(a) && drops.line == nil)
        drops.folderDrag(over: a, zone: .after, nests: false)
        #expect(drops.id == nil && drops.line == FolderDropLine(id: a, atFoot: true, indented: false))
        drops.folderDrag(over: a, zone: .after, nests: true)
        #expect(drops.line?.indented == true, "at the foot of an open folder the line goes a level in")
        drops.folderDrag(over: b, zone: .before, nests: false)
        #expect(drops.line == FolderDropLine(id: b, atFoot: false, indented: false))
        drops.clearLine(a)
        #expect(drops.line?.id == b, "another row leaving doesn't take this row's line")
        drops.folderDrag(over: b, zone: .into, nests: false)
        #expect(drops.line == nil)
        drops.folderDrag(over: b, zone: .before, nests: false)
        drops.clearLine()
        #expect(drops.line == nil)
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
