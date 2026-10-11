import SwiftData
import SwiftUI

/// Notes dropped onto a note's row in the list become its sub-notes, the way a note dropped on
/// a folder moves there. (Dropped into a note's text they are linked, not moved: `PaneTextView`.)
@MainActor
enum NoteDrop {
    /// Makes the dragged notes sub-notes of `parent` and registers the way back with `undo`.
    /// Notes that can't go there (the note itself, a note it is inside, a locked parent) are
    /// left alone. Returns whether any note moved.
    @discardableResult
    static func nest(_ ids: [UUID], under parent: UUID, in context: ModelContext, undo: UndoManager?) -> Bool {
        guard let target = context.note(parent) else { return false }
        let notes = ids.compactMap { context.note($0) }
        guard let change = context.nest(notes, under: target) else { return false }
        register(change, in: context, undo: undo)
        return true
    }

    /// Undo puts the notes back where they were; Redo makes them sub-notes again.
    private static func register(_ change: ModelContext.Nesting, in context: ModelContext, undo: UndoManager?) {
        guard let undo else { return }
        undo.registerUndo(withTarget: context) { context in
            MainActor.assumeIsolated {
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
struct SubNoteDropTarget: ViewModifier {
    let note: Note
    @Environment(\.modelContext) private var context
    @Environment(\.undoManager) private var undoManager
    @State private var targeted = false

    func body(content: Content) -> some View {
        content
            .background {
                if targeted {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(Color.accentColor.opacity(0.22))
                        .padding(EdgeInsets(top: -Hover.listReach.top, leading: -Hover.listReach.leading, bottom: -Hover.listReach.bottom, trailing: -Hover.listReach.trailing))
                }
            }
            .onDrop(of: [.paneItem], isTargeted: Binding(get: { targeted }, set: { over in withAnimation(.easeOut(duration: 0.12)) { targeted = over } })) { providers in
                guard !note.isLocked, note.trashedAt == nil else { return false }
                let parent = note.id
                DropLoader.load(providers) { items, _ in
                    let ids = items.filter { $0.kind == .note }.flatMap(\.ids)
                    guard !ids.isEmpty else { return }
                    withAnimation(.snappy) { _ = NoteDrop.nest(ids, under: parent, in: context, undo: undoManager) }
                }
                return true
            }
    }
}
