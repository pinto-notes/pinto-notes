import SwiftData
import SwiftUI

/// Open Note in New Window, and a folder's Open in New Window, as in Apple Notes (Emil, 2 November
/// 2026). A note's window is the note alone, editable, in the same editor as the main window; a
/// folder's window is that folder's list with its notes beside it. Both are scenes of their own in
/// PaneApp, opened by id, and are never restored at launch (the notes window decides what shows
/// first: sign-in, the key, the notes).
enum NoteWindows {
    static let noteScene = "note-window"
    static let folderScene = "folder-window"
    static let openNoteTitle = "Open Note in New Window"
    static let openFolderTitle = "Open in New Window"
    static let symbol = "macwindow.badge.plus"

    static func open(note id: UUID, with openWindow: OpenWindowAction) {
        openWindow(id: noteScene, value: id)
    }

    static func open(folder id: UUID, with openWindow: OpenWindowAction) {
        openWindow(id: folderScene, value: id)
    }

    /// What a note's window shows: the note, unless it has been deleted for good (or never came).
    @MainActor static func note(_ id: UUID, in context: ModelContext) -> Note? {
        context.note(id).flatMap { $0.deletedAt == nil ? $0 : nil }
    }

    /// What a folder's window shows: the folder, while it is still there.
    @MainActor static func folder(_ id: UUID, in context: ModelContext) -> Folder? {
        context.folder(id).flatMap { $0.deletedAt == nil ? $0 : nil }
    }
}

#if os(macOS)
/// A note in a window of its own. A link in it opens the linked note in the same window, with
/// Back and Forward, as the notes window does.
struct NoteWindowView: View {
    let noteID: UUID
    @Environment(\.modelContext) private var context
    @State private var shown: UUID?
    @State private var history = OpenedNotes()
    @State private var editor = EditorController()

    var body: some View {
        let id = shown ?? noteID
        let note = NoteWindows.note(id, in: context)
        NoteToolbarStage(showsItems: note != nil, history: actions, ownWindow: true, controller: editor) {
            if let note {
                NoteDetailView(note: note, controller: editor, inOwnWindow: true, onNewNote: {}) { target, _ in
                    open(target)
                }
                .id(note.id)
            } else {
                ContentUnavailableView("No Note", systemImage: "note.text", description: Text("This note was deleted."))
            }
        }
        .environment(editor)
        .focusedSceneValue(\.editorController, editor)
        // The window keeps its name (the Window menu, Mission Control) but doesn't show it: shown,
        // it took the bar's room and pushed Share and More into a » menu (Emil, 3 November 2026).
        .toolbar(removing: .title)
        .navigationTitle(note.map { $0.title.isEmpty ? "New Note" : $0.title } ?? "")
        .frame(minWidth: 480, minHeight: 360)
    }

    private func open(_ target: UUID) {
        history.opened(from: shown ?? noteID, to: target)
        shown = target
    }

    private func isGone(_ id: UUID) -> Bool { NoteWindows.note(id, in: context) == nil }

    private var actions: OpenedNotes.Actions {
        OpenedNotes.Actions(notes: history,
                            back: { if let p = history.back(from: shown ?? noteID, gone: isGone) { shown = p } },
                            forward: { if let n = history.forward(from: shown ?? noteID, gone: isGone) { shown = n } })
    }
}

/// A folder in a window of its own: its list, and the note chosen in it beside the list.
struct FolderWindowView: View {
    let folderID: UUID
    @Environment(\.modelContext) private var context
    @State private var selection: Set<UUID> = []
    @State private var editor = EditorController()
    @State private var justCreated: UUID?

    var body: some View {
        if let folder = NoteWindows.folder(folderID, in: context) {
            NavigationSplitView {
                NoteListView(scope: .folder(folderID), selection: $selection, onNewNote: newNote)
                    .navigationSplitViewColumnWidth(min: 260, ideal: 330, max: 440)
            } detail: {
                detail
                    .navigationSplitViewColumnWidth(min: 480, ideal: 640)
                    .overlay(alignment: .leading) { ColumnHairline() }
            }
            .environment(editor)
            .focusedSceneValue(\.editorController, editor)
            .focusedSceneValue(\.newNoteAction, newNote)
            .toolbar(removing: .title)
            .navigationTitle(folder.name)
            .frame(minWidth: 760, minHeight: 420)
        } else {
            ContentUnavailableView("No Folder", systemImage: "folder", description: Text("This folder was deleted."))
                .frame(minWidth: 420, minHeight: 300)
        }
    }

    private var selected: UUID? { selection.count == 1 ? selection.first : nil }

    @ViewBuilder private var detail: some View {
        let note = selected.flatMap { NoteWindows.note($0, in: context) }
        NoteToolbarStage(showsItems: note != nil, controller: editor) {
            if let note {
                NoteDetailView(note: note, controller: editor, autofocus: justCreated == note.id, onNewNote: newNote) { target, edit in
                    if edit { justCreated = target }
                    selection = [target]
                }
                .id(note.id)
            } else {
                EmptyDetailView()
            }
        }
    }

    /// New Note here goes in this folder; an untouched empty note open here is used instead.
    private func newNote() {
        if let id = selected, let n = context.note(id), n.body.isEmpty, n.trashedAt == nil {
            editor.focus()
            return
        }
        let note = context.createNote(in: .folder(folderID))
        justCreated = note.id
        selection = [note.id]
    }
}
#endif
