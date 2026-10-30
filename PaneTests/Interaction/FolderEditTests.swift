import Foundation
import SwiftData
import Testing
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

    @Test func theMenusOfferWhatNotesDoesThatPintoHas() {
        let folder = SidebarView.folderActions(isNotes: false)
        #expect(folder.row == [.move, .delete])
        #expect(folder.list == [.rename, .newSubfolder])
        #expect(folder.row.map(\.title) == ["Move", "Delete"])
        let notes = SidebarView.folderActions(isNotes: true)
        #expect(!notes.row.contains(.move) && !notes.list.contains(.move), "Notes stays first")
    }
}
