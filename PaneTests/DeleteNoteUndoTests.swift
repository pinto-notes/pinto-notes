import Foundation
import SwiftData
import Testing
@testable import Pane

/// ⌘Z after Delete Note brings the note back where it was, as in Notes (council round 16,
/// `a13-delete-recover`: ⌘Z did nothing and only Recently Deleted had it).
@MainActor @Suite struct DeleteNoteUndoTests {
    func library() throws -> (ModelContainer, Folder, Note, Note) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let travel = ctx.createFolder(named: "Travel")
        let lisbon = ctx.createNote(in: .folder(travel.id), body: "Lisbon\n\nTiles and trams.")
        lisbon.isPinned = true
        let blank = ctx.createNote(in: .folder(travel.id), body: "")
        try ctx.save()
        return (c, travel, lisbon, blank)
    }

    /// Redo deletes again and says so, so the list opens the neighbour as the delete did (round 19).
    @Test func redoOpensWhatTheDeleteOpened() throws {
        let (c, _, lisbon, _) = try library()
        let undo = UndoManager()
        undo.groupsByEvent = false
        var moved = 0
        undo.beginUndoGrouping()
        c.mainContext.remove([lisbon], undo: undo, reopen: { _ in }, gone: { moved += 1 })
        undo.endUndoGrouping()
        #expect(moved == 0, "the delete itself chooses, so this is for Redo")
        undo.undo()
        undo.redo()
        #expect(lisbon.trashedAt != nil && moved == 1)
        undo.undo()
        undo.redo()
        #expect(lisbon.trashedAt != nil && moved == 2, "and every Redo after it")
        let view = try String(contentsOf: TestFiles.url("Views").appending(path: "NoteDetailView.swift"), encoding: .utf8)
        #expect(view.contains("if !Self.captureWithoutToolbar, note.trashedAt == nil {"), "and the toolbar's fade leaves a deleted note's title alone")
    }

    @Test func undoBringsItBackAndRedoDeletesItAgain() throws {
        let (c, travel, lisbon, _) = try library()
        let ctx = c.mainContext
        let edited = Date(timeIntervalSinceNow: -86400 * 3)
        lisbon.updatedAt = edited
        let undo = UndoManager()
        undo.groupsByEvent = false
        var reopened: [UUID] = []
        undo.beginUndoGrouping()
        ctx.remove([lisbon], undo: undo) { reopened = $0.map(\.id) }
        undo.endUndoGrouping()
        #expect(lisbon.trashedAt != nil && !lisbon.isPinned)
        #expect(undo.canUndo && undo.undoActionName == "Delete Note")
        undo.undo()
        #expect(lisbon.trashedAt == nil, "back from Recently Deleted")
        #expect(lisbon.folder?.id == travel.id && lisbon.isPinned, "in its folder, pinned as it was")
        #expect(lisbon.updatedAt == edited, "its date as it was, so it goes back to its place in the list")
        #expect(reopened == [lisbon.id], "and selected again")
        #expect(undo.canRedo)
        undo.redo()
        #expect(lisbon.trashedAt != nil, "Redo deletes it again")
        undo.undo()
        #expect(lisbon.trashedAt == nil)
    }

    @Test func aBlankNoteHasNoUndo() throws {
        let (c, _, _, blank) = try library()
        let undo = UndoManager()
        undo.groupsByEvent = false
        undo.beginUndoGrouping()
        c.mainContext.remove([blank], undo: undo)
        undo.endUndoGrouping()
        #expect(blank.deletedAt != nil)
        undo.undo()
        #expect(blank.deletedAt != nil, "gone for good, as before")
    }
}
