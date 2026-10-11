import Foundation
import SwiftData
import Testing
@testable import Pane

/// Notes dragged from the list: dropped on another note's row they become its sub-notes;
/// dropped into a note's text they are linked there, and nothing moves.
@MainActor @Suite struct NoteDropTests {
    let ctx: ModelContext
    let undo = UndoManager()

    init() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        ctx = ModelContext(c)
        // One Undo per drop, also when a test makes several in a row.
        undo.groupsByEvent = false
    }

    private func link(_ n: Note) -> String { "pane-note:\(n.id.uuidString.lowercased())" }

    /// What the list shows of these notes: the ones that aren't inside another note.
    private func listed(_ notes: [Note]) -> [String] { notes.filter { !ctx.isNested($0) }.map(\.title) }

    private func drop(_ notes: [Note], on parent: Note) -> Bool {
        undo.beginUndoGrouping()
        defer { undo.endUndoGrouping() }
        return NoteDrop.nest(notes.map(\.id), under: parent.id, in: ctx, undo: undo)
    }

    @Test func aNoteDroppedOnARowBecomesItsSubNote() throws {
        let work = ctx.createFolder(named: "Work"), home = ctx.createFolder(named: "Home")
        let parent = ctx.createNote(in: .folder(work.id), body: "Trip\nPacking and plans")
        let child = ctx.createNote(in: .folder(home.id), body: "Packing list\n- socks\n- [ ] passport\n![[photo.png]]")
        let text = child.body, made = child.createdAt
        child.dirty = false; parent.dirty = false

        #expect(drop([child], on: parent))
        #expect(child.parentID == parent.id && ctx.isNested(child), "it lives inside the note it was dropped on")
        #expect(parent.body == "Trip\nPacking and plans\n[Packing list](\(link(child)))\n", "linked on a line of its own, at the end")
        #expect(child.body == text && child.createdAt == made, "its text, files and dates in the text are untouched")
        #expect(child.folder?.id == work.id, "in the parent's folder, as a sub-note made there is")
        #expect(child.dirty && parent.dirty, "both go up with the next sync")
        #expect(listed([parent, child]) == ["Trip"], "the list shows the parent, not the sub-note")
        #expect(ctx.subNotes(of: parent).map(\.id) == [child.id])
    }

    @Test func undoPutsItBackWhereItWasAndRedoNestsItAgain() throws {
        let work = ctx.createFolder(named: "Work"), home = ctx.createFolder(named: "Home")
        let parent = ctx.createNote(in: .folder(work.id), body: "Trip")
        let child = ctx.createNote(in: .folder(home.id), body: "Packing list")
        child.isPinned = true
        #expect(drop([child], on: parent))
        #expect(!child.isPinned, "a sub-note isn't pinned in the list")
        // Typed in the parent after the drop: Undo must not take it away.
        parent.body += "Tickets are booked\n"

        #expect(undo.canUndo && undo.undoActionName == "Make Sub-note")
        undo.undo()
        #expect(child.parentID == nil && !ctx.isNested(child))
        #expect(child.folder?.id == home.id && child.isPinned, "in its folder, pinned as it was")
        #expect(parent.body == "Trip\nTickets are booked\n", "only its line left the parent")
        #expect(listed([parent, child]) == ["Trip", "Packing list"])

        #expect(undo.canRedo)
        undo.redo()
        #expect(child.parentID == parent.id && ctx.isNested(child))
        #expect(parent.body.contains(link(child)))
    }

    @Test func severalSelectedNotesGoTogetherAndComeBackTogether() throws {
        let parent = ctx.createNote(in: .all, body: "Recipes")
        let notes = ["Soup", "Bread", "Cake"].map { ctx.createNote(in: .all, body: $0) }
        #expect(drop(notes, on: parent))
        #expect(notes.allSatisfy { $0.parentID == parent.id && ctx.isNested($0) })
        #expect(parent.body == "Recipes\n" + notes.map { "[\($0.title)](\(link($0)))\n" }.joined(), "one line each, in the order dragged")
        #expect(undo.undoActionName == "Make Sub-notes")
        undo.undo()
        #expect(notes.allSatisfy { $0.parentID == nil && !ctx.isNested($0) } && parent.body == "Recipes\n")
    }

    @Test func aNoteNeverGoesInsideItselfOrSomethingInsideIt() throws {
        let top = ctx.createNote(in: .all, body: "Top")
        let middle = ctx.createNote(in: .all, body: "Middle")
        let bottom = ctx.createNote(in: .all, body: "Bottom")
        #expect(drop([middle], on: top) && drop([bottom], on: middle))

        #expect(!drop([top], on: top), "not on itself")
        #expect(ctx.nestRefusal(top, under: top) == .itself)
        #expect(!drop([top], on: middle), "not into its sub-note")
        #expect(!drop([top], on: bottom), "nor into a sub-note's sub-note")
        #expect(ctx.nestRefusal(top, under: bottom) == .insideItself)
        #expect(top.parentID == nil && !top.body.contains(link(top)) && !bottom.body.contains("pane-note:"))

        // Among several, the ones that can go do; the one that can't stays.
        let loose = ctx.createNote(in: .all, body: "Loose")
        #expect(drop([top, loose], on: bottom))
        #expect(loose.parentID == bottom.id && top.parentID == nil)
        #expect(bottom.body == "Bottom\n[Loose](\(link(loose)))\n")
    }

    @Test func lockedAndDeletedNotesTakeNoSubNotes() throws {
        let locked = ctx.createNote(in: .all, body: "Diary")
        locked.lockedBody = "sealed"
        let trashed = ctx.createNote(in: .all, body: "Old")
        ctx.trash(trashed)
        let n = ctx.createNote(in: .all, body: "Note")
        #expect(!drop([n], on: locked) && ctx.nestRefusal(n, under: locked) == .locked, "its sub-notes would stay readable")
        #expect(!drop([n], on: trashed) && ctx.nestRefusal(n, under: trashed) == .gone)
        #expect(!drop([trashed], on: n))
        #expect(n.parentID == nil && n.body == "Note", "nothing happened")
    }

    @Test func aSubNoteDroppedOnAnotherNoteLeavesItsFirstParent() throws {
        let first = ctx.createNote(in: .all, body: "First\nintro")
        let second = ctx.createNote(in: .all, body: "Second")
        let child = ctx.createNote(in: .all, body: "Child")
        #expect(drop([child], on: first))
        first.body += "after\n"
        #expect(drop([child], on: second))
        #expect(child.parentID == second.id && ctx.isNested(child))
        #expect(first.body == "First\nintro\nafter\n", "its line left the first parent")
        undo.undo()
        #expect(child.parentID == first.id && ctx.isNested(child), "back inside the first")
        #expect(!second.body.contains("pane-note:"))
    }

    @Test func droppedOnItsOwnParentNothingChanges() throws {
        let parent = ctx.createNote(in: .all, body: "Parent")
        let child = ctx.createNote(in: .all, body: "Child")
        #expect(drop([child], on: parent))
        let body = parent.body
        #expect(!drop([child], on: parent))
        #expect(parent.body == body)
    }

    @Test func aTitleWithBracketsStillMakesOneLink() throws {
        let parent = ctx.createNote(in: .all, body: "Parent")
        let child = ctx.createNote(in: .all, body: "[Draft] plan")
        #expect(drop([child], on: parent))
        #expect(parent.body == "Parent\n[(Draft) plan](\(link(child)))\n")
        #expect(ctx.isNested(child))
    }

    @Test func afterADropTheListSelectsTheParent() {
        let parent = UUID()
        #expect(NoteDrop.selection(afterNestingUnder: parent) == [parent])
    }

    @Test func aSelectionOfSeveralNeverHoldsASubNote() throws {
        let parent = ctx.createNote(in: .all, body: "Parent")
        let child = ctx.createNote(in: .all, body: "Child")
        let other = ctx.createNote(in: .all, body: "Other")
        #expect(drop([child], on: parent))
        #expect(NoteDrop.withoutSubNotes([child.id, other.id], in: ctx) == [other.id], "the note that went inside leaves the selection")
        #expect(NoteDrop.withoutSubNotes([child.id], in: ctx) == [child.id], "alone it is a sub-note open in the editor")
        #expect(NoteDrop.withoutSubNotes([parent.id, other.id], in: ctx) == [parent.id, other.id])
    }

    // MARK: Move Out of Note

    @Test func aSubNoteMovedOutIsANoteOfItsOwnAgainAndUndoPutsItBack() throws {
        let work = ctx.createFolder(named: "Work")
        let parent = ctx.createNote(in: .folder(work.id), body: "Trip\nintro")
        let child = ctx.createSubNote(of: parent, body: "Packing list\n- socks")
        parent.body += "\n[Packing list](\(link(child)))\nafter\n"
        #expect(ctx.isNested(child) && listed([parent, child]) == ["Trip"])
        parent.dirty = false; child.dirty = false

        undo.beginUndoGrouping()
        #expect(NoteDrop.moveOut(child.id, in: ctx, undo: undo))
        undo.endUndoGrouping()
        #expect(child.parentID == nil && !ctx.isNested(child))
        #expect(parent.body == "Trip\nintro\nafter\n", "its line left the parent, nothing else")
        #expect(child.body == "Packing list\n- socks" && child.folder?.id == work.id, "its text is as it was, in the same folder")
        #expect(listed([parent, child]) == ["Trip", "Packing list"], "it is in the list again")
        #expect(parent.dirty && child.dirty, "both go up with the next sync")
        #expect(undo.undoActionName == "Move Out of Note")

        undo.undo()
        #expect(child.parentID == parent.id && ctx.isNested(child), "Undo puts it back inside")
        undo.redo()
        #expect(child.parentID == nil && !ctx.isNested(child))
    }

    @Test func onlyASubNoteCanBeMovedOut() throws {
        let plain = ctx.createNote(in: .all, body: "Plain")
        // Names a parent that no longer links it: it is in the list already.
        let parent = ctx.createNote(in: .all, body: "Parent")
        let loose = ctx.createSubNote(of: parent, body: "Loose")
        #expect(!NoteDrop.moveOut(plain.id, in: ctx, undo: undo))
        #expect(!NoteDrop.moveOut(loose.id, in: ctx, undo: undo))
        #expect(!NoteDrop.moveOut(UUID(), in: ctx, undo: undo))
        #expect(!undo.canUndo && loose.parentID == parent.id)
    }

    // MARK: Dropped into a note's text

    @Test func notesDroppedIntoTextAreLinkedThere() {
        let text = "Plans\nSee  for details\n"
        let at = (text as NSString).range(of: "See ").upperBound
        let edit = EditorController.noteLinksEdit(titles: ["Packing list"], in: text, selection: NSRange(location: at, length: 0))
        #expect(edit == TextEdit(range: NSRange(location: at, length: 0), replacement: "[[Packing list]]", caret: at + 16))
        // After a word: a space first. Several: side by side.
        let end = EditorController.noteLinksEdit(titles: ["Soup", "Bread"], in: "Recipes", selection: NSRange(location: 7, length: 0))
        #expect(end?.replacement == " [[Soup]] [[Bread]]")
        #expect(EditorController.noteLinksEdit(titles: ["  "], in: "x", selection: NSRange(location: 0, length: 0)) == nil, "a note without a title has no link")
    }

    @Test func aDragCarriesItsNotesAndOnlyNotes() throws {
        let a = UUID(), b = UUID(), c = UUID()
        let data = try [PaneDragItem(kind: .note, id: a, others: [b]), PaneDragItem(kind: .folder, id: c), PaneDragItem(kind: .note, id: b)].map { try JSONEncoder().encode($0) }
        #expect(EditorController.draggedNotes(data + [Data("junk".utf8)]) == [a, b])
    }

    #if os(macOS)
    /// The real Mac editor: notes dropped at a place in the text. The dropped note stays where it
    /// is in the library; the note dropped on itself and a deleted one make no link.
    @Test func droppingNotesInTheEditorInsertsLinksAndMovesNothing() async throws {
        let open = ctx.createNote(in: .all, body: "Plans\nSee \n")
        let other = ctx.createNote(in: .all, body: "Packing list\n- socks")
        let gone = ctx.createNote(in: .all, body: "Gone")
        gone.deletedAt = .now
        let h = await EditorHarness(open.body)
        h.controller.noteLinkTitle = { [ctx] id in
            guard id != open.id, let n = ctx.note(id), n.deletedAt == nil else { return nil }
            return n.title
        }
        let at = (h.text as NSString).range(of: "See ").upperBound
        #expect(h.view.dropNotes([other.id, open.id, gone.id], at: at))
        await h.settle()
        #expect(h.text == "Plans\nSee [[Packing list]]\n")
        #expect(h.selection == NSRange(location: at + 16, length: 0), "the caret is after the link")
        #expect(other.parentID == nil && !ctx.isNested(other), "the note is linked, not moved")
        #expect(!h.view.dropNotes([open.id], at: 0), "a note dropped into itself: nothing")
        #expect(h.text == "Plans\nSee [[Packing list]]\n")
        // The link is the kind [[ makes: it opens that note.
        #expect(WikiLinks.links(in: h.text).map(\.target) == ["Packing list"])
    }
    #endif
}

private extension NSRange {
    var upperBound: Int { NSMaxRange(self) }
}
