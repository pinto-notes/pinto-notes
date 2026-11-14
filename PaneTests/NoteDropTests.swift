import Foundation
import SwiftData
import SwiftUI
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

    // MARK: Dropped on Recently Deleted

    /// Dragged onto Recently Deleted, as in Notes: the notes go there, a folder doesn't, and one
    /// already in there keeps its date.
    @Test func notesDroppedOnRecentlyDeletedGoThere() throws {
        let a = ctx.createNote(in: .all, body: "Soup\nleeks")
        let b = ctx.createNote(in: .all, body: "Bread\nflour")
        let keep = ctx.createNote(in: .all, body: "Keep\nme")
        let old = ctx.createNote(in: .all, body: "Old\nnote")
        ctx.trash(old)
        let when = try #require(old.trashedAt)
        let folder = Folder(name: "Trip")
        ctx.insert(folder)
        ctx.trashDropped([PaneDragItem(kind: .note, id: a.id, others: [b.id]), PaneDragItem(kind: .note, id: old.id), PaneDragItem(kind: .folder, id: folder.id)])
        #expect(a.trashedAt != nil && b.trashedAt != nil)
        #expect(keep.trashedAt == nil)
        #expect(old.trashedAt == when)
        #expect(folder.deletedAt == nil)
    }

    /// ⌘Z after the drop brings back what you dragged, not the note you deleted before it.
    @Test func undoAfterADropOnRecentlyDeletedBringsItBack() throws {
        let earlier = ctx.createNote(in: .all, body: "Earlier\nnote")
        let a = ctx.createNote(in: .all, body: "Soup\nleeks")
        let undo = UndoManager()
        undo.groupsByEvent = false
        undo.beginUndoGrouping()
        ctx.remove([earlier], undo: undo)
        undo.endUndoGrouping()
        undo.beginUndoGrouping()
        ctx.trashDropped([PaneDragItem(kind: .note, id: a.id)], undo: undo)
        undo.endUndoGrouping()
        #expect(a.trashedAt != nil)
        undo.undo()
        #expect(a.trashedAt == nil)
        #expect(earlier.trashedAt != nil)
    }

    /// Moving a note into a folder is a move: the green plus means a copy, and there isn't one.
    @Test func movingInsideTheAppShowsNoPlus() {
        #expect(dropOperation(fromThisApp: true) == .move)
        #expect(dropOperation(fromThisApp: false) == .copy, "a file from Finder is copied in")
    }

    /// The chip that follows a dragged note shows its name, not a lone icon.
    @Test func aDraggedNoteShowsItsName() throws {
        let short = ImageRenderer(content: NoteDragPreview(title: "A", symbol: "note.text"))
        let long = ImageRenderer(content: NoteDragPreview(title: "Hotel booking", symbol: "note.text"))
        let w = try #require(long.cgImage?.width), s = try #require(short.cgImage?.width)
        #expect(w > s + 40)
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

    /// A web project's folder (index.html at its top) dropped on a note becomes its app, as built
    /// (2026-11-14): dropped in the text it goes to the app, not in as a file; the app is the
    /// folder's files, binary ones too; the app's own view takes the drop the same way; a note that
    /// can't have an app says so.
    @Test func aFolderWithIndexHTMLDroppedOnANoteBecomesItsApp() async throws {
        let note = ctx.createNote(in: .all, body: "Doom\n")
        let dir = FileManager.default.temporaryDirectory.appending(path: "dropped-app-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: dir) }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try Data("<!doctype html><canvas></canvas><script src=\"main.js\"></script>".utf8).write(to: dir.appending(path: "index.html"))
        try Data("fetch('game.wad')".utf8).write(to: dir.appending(path: "main.js"))
        try Data([0x49, 0x57, 0x41, 0x44, 0, 0, 0, 1, 0xFF]).write(to: dir.appending(path: "game.wad"))

        let view = PaneTextView(frame: NSRect(x: 0, y: 0, width: 600, height: 400))
        view.configure(text: note.body, header: "")
        let controller = EditorController()
        view.controller = controller
        controller.target = view
        var taken: [URL] = [], attached: [URL] = []
        controller.dropAppFolder = { taken.append($0); return true }
        controller.addFiles = { attached += $0; return [] }
        #expect(view.dropFiles([dir], at: 0))
        #expect(taken == [dir] && attached.isEmpty && view.string == "Doom\n", "the folder went to the app, not into the text")
        // A file, or the folder with something else: attached, as before.
        view.dropFiles([dir.appending(path: "main.js")], at: 0)
        view.dropFiles([dir, dir.appending(path: "main.js")], at: 0)
        #expect(taken.count == 1 && attached.count == 3)

        let store = NotePageStore(file: nil)
        try NoteApps.takeFolder(dir, for: note, store: store, enabled: true)
        let page = try #require(store[note.id])
        #expect(page.by == "You")
        let project = try #require(NotePageProject.parse(page.html))
        #expect(Set(project.files.keys) == ["/index.html", "/main.js"] && Set(project.binary.keys).union(project.blobs.keys) == ["/game.wad"],
                "the binary file is kept inside, or apart when this device has the account's key (AppBlobs)")
        #expect(project.serve("/game.wad")?.data == Data([0x49, 0x57, 0x41, 0x44, 0, 0, 0, 1, 0xFF]))

        // The app's own view: the same drop replaces it there (NotePageWebView).
        let sandbox = NotePageSandbox(rules: try await NotePageSandbox.prepare())
        #expect(sandbox.webView is NotePageWebView)

        note.trashedAt = .now
        #expect(throws: NotePageProject.FolderError.self) { try NoteApps.takeFolder(dir, for: note, store: store, enabled: true) }
    }
    #endif
}

private extension NSRange {
    var upperBound: Int { NSMaxRange(self) }
}
