import Foundation
import SwiftData
import Testing
#if os(macOS)
import AppKit
#endif
@testable import Pane

/// Notes dragged from the list and dropped into a note's text are linked there, and nothing
/// moves. (Dropped on another note's row they once became its sub-notes; sub-notes are gone.)
@MainActor @Suite struct NoteDropTests {
    let ctx: ModelContext

    init() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        ctx = ModelContext(c)
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
    @Test func droppingNotesInTheEditorInsertsLinksAndMovesNothing() throws {
        let open = ctx.createNote(in: .all, body: "Plans\nSee \n")
        let other = ctx.createNote(in: .all, body: "Packing list\n- socks")
        let gone = ctx.createNote(in: .all, body: "Gone")
        gone.deletedAt = .now
        // The text view on its own, in no window: the tests that measure the editor in a window
        // share the key window with every other test that opens one.
        let view = PaneTextView(frame: NSRect(x: 0, y: 0, width: 600, height: 400))
        view.configure(text: open.body, header: "")
        let controller = EditorController()
        view.controller = controller
        controller.target = view
        controller.noteLinkTitle = { [ctx] id in
            guard id != open.id, let n = ctx.note(id), n.deletedAt == nil else { return nil }
            return n.title
        }
        let at = (view.string as NSString).range(of: "See ").upperBound
        #expect(view.dropNotes([other.id, open.id, gone.id], at: at))
        #expect(view.string == "Plans\nSee [[Packing list]]\n")
        #expect(view.selectedRange() == NSRange(location: at + 16, length: 0), "the caret is after the link")
        #expect(other.parentID == nil && other.folder?.id == open.folder?.id, "the note is linked, not moved")
        #expect(!view.dropNotes([open.id], at: 0), "a note dropped into itself: nothing")
        #expect(view.string == "Plans\nSee [[Packing list]]\n")
        // The link is the kind [[ makes: it opens that note.
        #expect(WikiLinks.links(in: view.string).map(\.target) == ["Packing list"])
    }
    #endif
}

private extension NSRange {
    var upperBound: Int { NSMaxRange(self) }
}
