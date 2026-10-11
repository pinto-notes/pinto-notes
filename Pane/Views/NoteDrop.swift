import SwiftData
import SwiftUI
import os

/// Notes dropped onto a note's row in the list become its sub-notes, the way a note dropped on
/// a folder moves there. (Dropped into a note's text they are linked, not moved: `PaneTextView`.)
@MainActor
enum NoteDrop {
    nonisolated static let log = Logger(subsystem: "dev.emilwagman.pane", category: "drop")

    /// Posted when notes became sub-notes: `object` is the parent's id, `userInfo["notes"]` theirs.
    /// They are no longer rows of the list, and a list that kept them selected showed
    /// "2 Notes Selected" at the next click (seen in a real drag, 2026-10-11).
    static let nested = Notification.Name("pane.notesNested")

    /// What a list selects once notes went inside `parent`: the parent, which opens with its new
    /// sub-notes at the end of its text. Said to the list outright: left to itself after a row
    /// was dragged away, it added the next click to the selection it had ("2 Notes Selected").
    nonisolated static func selection(afterNestingUnder parent: UUID) -> Set<UUID> { [parent] }

    /// A selection of several never holds a note that is inside another: it has no row to be
    /// selected by. (The list put the dragged row into the selection as the drag ended, after
    /// the note had gone inside its parent; the next click then made "2 Notes Selected".) One
    /// note alone may be a sub-note: that is a sub-note open in the editor.
    static func withoutSubNotes(_ selection: Set<UUID>, in context: ModelContext) -> Set<UUID> {
        guard selection.count > 1 else { return selection }
        let rows = selection.filter { id in context.note(id).map { !context.isNested($0) } ?? true }
        return rows.isEmpty ? selection : rows
    }

    /// Makes the dragged notes sub-notes of `parent` and registers the way back with `undo`.
    /// Notes that can't go there (the note itself, a note it is inside, a locked parent) are
    /// left alone. Returns whether any note moved.
    @discardableResult
    static func nest(_ ids: [UUID], under parent: UUID, in context: ModelContext, undo: UndoManager?) -> Bool {
        guard let target = context.note(parent) else { return false }
        let notes = ids.compactMap { context.note($0) }
        guard let change = context.nest(notes, under: target) else { return false }
        register(change, in: context, undo: undo)
        // The list lets go of the notes that left it (see `nested`).
        NotificationCenter.default.post(name: nested, object: change.parent, userInfo: ["notes": change.notes])
        return true
    }

    /// Takes a sub-note out of the note it is in: it is a note of its own again, in the same
    /// folder, and its line leaves the parent's text. Undo puts it back inside. Returns whether
    /// it was a sub-note.
    @discardableResult
    static func moveOut(_ id: UUID, in context: ModelContext, undo: UndoManager?) -> Bool {
        guard let note = context.note(id), let parent = note.parentID, context.isNested(note) else { return false }
        let change = ModelContext.Nesting(parent: parent, moved: [.init(note: id, parent: nil, folder: note.folder?.id, pinned: note.isPinned)])
        context.unnest(change)
        if let undo {
            undo.registerUndo(withTarget: context) { context in
                MainActor.assumeIsolated {
                    guard let target = context.note(parent), let n = context.note(id), context.nest([n], under: target) != nil else { return }
                    undo.registerUndo(withTarget: context) { context in
                        MainActor.assumeIsolated { _ = moveOut(id, in: context, undo: undo) }
                    }
                }
            }
            undo.setActionName("Move Out of Note")
        }
        return true
    }

    /// Undo puts the notes back where they were; Redo makes them sub-notes again.
    private static func register(_ change: ModelContext.Nesting, in context: ModelContext, undo: UndoManager?) {
        guard let undo else { return }
        undo.registerUndo(withTarget: context) { context in
            MainActor.assumeIsolated {
                log.notice("sub-note drop: undone")
                context.unnest(change)
                undo.registerUndo(withTarget: context) { context in
                    MainActor.assumeIsolated { _ = nest(change.notes, under: change.parent, in: context, undo: undo) }
                }
            }
        }
        undo.setActionName(change.moved.count == 1 ? "Make Sub-note" : "Make Sub-notes")
    }
}

/// A note's row as a place to drop other notes: it highlights while one is over it, as a folder
/// does. Only takes drags from inside the app; files from Finder go to the list around it.
/// On the Mac only: on iPad a row is never offered a drag that started in its own list (seen in
/// a real drag on the simulator, 2026-10-11), so there the row is left as it was.
struct SubNoteDropTarget: ViewModifier {
    let note: Note
    @Environment(\.modelContext) private var context
    @Environment(\.undoManager) private var undoManager
    @State private var targeted = false
    static let afterTheDrag: Duration = .milliseconds(450)

    func body(content: Content) -> some View {
        #if os(macOS)
        content
            .background {
                if targeted {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(Color.accentColor.opacity(0.22))
                        .padding(EdgeInsets(top: -Hover.listReach.top, leading: -Hover.listReach.leading, bottom: -Hover.listReach.bottom, trailing: -Hover.listReach.trailing))
                }
            }
            .onDrop(of: [.paneItem], isTargeted: Binding(get: { targeted }, set: { over in
                // Said in the log so a real drag can be checked without a picture of the screen.
                if over != targeted { NoteDrop.log.notice("sub-note drop: \(over ? "over a row" : "left the row", privacy: .public)") }
                withAnimation(.easeOut(duration: 0.12)) { targeted = over }
            })) { providers in
                guard !note.isLocked, note.trashedAt == nil else { return false }
                let parent = note.id
                DropLoader.load(providers) { items, _ in
                    let ids = items.filter { $0.kind == .note }.flatMap(\.ids)
                    guard !ids.isEmpty else { return }
                    // The window's own Undo when the row has none in its environment.
                    let undo = NSApp.keyWindow?.undoManager ?? NSApp.mainWindow?.undoManager ?? undoManager
                    Task { @MainActor in
                        // Once the drag is over. The dragged row leaves the list, and when it left
                        // while its own drag was still ending, the list took no click afterwards
                        // (seen with a real drag, 2026-10-11).
                        try? await Task.sleep(for: Self.afterTheDrag)
                        var moved = false
                        withAnimation(.snappy) { moved = NoteDrop.nest(ids, under: parent, in: context, undo: undo) }
                        NoteDrop.log.notice("sub-note drop: \(moved ? "made sub-notes" : "nothing moved", privacy: .public)")
                    }
                }
                return true
            }
        #else
        content
        #endif
    }
}
