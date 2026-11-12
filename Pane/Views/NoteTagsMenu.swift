import SwiftData
import SwiftUI

/// Tags in a note's right-click (and its long press on iPhone): each tag in the library, ticked
/// when the notes have it, and New Tag… for one that isn't there yet. Picking one writes `#tag`
/// into the note, on the line of tags under its title (Tags.adding), so it's the same tag as one
/// typed, and the AI tools see it too; picking a ticked one takes it out again.
struct NoteTagsMenu: View {
    let notes: [Note]
    let entries: [Tags.Entry]
    /// New Tag…: asks for the name.
    let onNew: () -> Void
    @Environment(\.modelContext) private var context
    @Environment(\.undoManager) private var undoManager

    /// The notes a tag menu can change: their text is here to write (not locked, not shared, not
    /// in Recently Deleted).
    static func taggable(_ notes: [Note]) -> [Note] {
        notes.filter { !$0.isLocked && !$0.isShared && $0.trashedAt == nil && $0.deletedAt == nil }
    }

    var body: some View {
        Menu {
            ForEach(entries, id: \.name) { entry in
                let has = !notes.isEmpty && notes.allSatisfy { Tags.hasExactly(entry.name, in: $0.body) }
                Toggle(isOn: Binding(get: { has }, set: { on in
                    context.setTag(entry.name, on: notes, to: on, undo: undoManager)
                })) {
                    Text(entry.name)
                }
                .accessibilityIdentifier("row.tag.\(entry.name)")
            }
            if !entries.isEmpty { Divider() }
            Button("New Tag…", systemImage: "plus", action: onNew)
                .accessibilityIdentifier("row.newTag")
        } label: {
            Label("Tags", systemImage: "tag")
        }
        .accessibilityIdentifier("row.tags")
    }
}

/// New Tag…'s question: a name, then the tag goes on the notes it was asked for.
struct NewTagAlert: ViewModifier {
    @Binding var notes: [UUID]?
    @State private var name = ""
    @Environment(\.modelContext) private var context
    @Environment(\.undoManager) private var undoManager

    func body(content: Content) -> some View {
        content.alert("New Tag", isPresented: Binding(get: { notes != nil }, set: { if !$0 { notes = nil } })) {
            TextField("Needs review", text: $name)
                .accessibilityIdentifier("newTag.name")
            Button("Cancel", role: .cancel) { name = "" }
            Button("Add") {
                if let tag = Tags.typedName(name), let ids = notes {
                    context.setTag(tag, on: ids.compactMap { context.note($0) }, to: true, undo: undoManager)
                }
                name = ""
            }
            .disabled(Tags.typedName(name) == nil)
        } message: {
            Text("The tag is added to the note, under its title.")
        }
    }
}

extension ModelContext {
    /// Adds `tag` to the notes, or takes it out of them, as one change Undo takes back.
    @MainActor func setTag(_ tag: String, on notes: [Note], to on: Bool, undo: UndoManager?) {
        var before: [(Note, String)] = []
        for note in NoteTagsMenu.taggable(notes) {
            let after = on ? Tags.adding(tag, to: note.body) : Tags.removing(tag, from: note.body)
            guard after != note.body else { continue }
            before.append((note, note.body))
            note.body = after
            note.touch()
        }
        guard !before.isEmpty else { return }
        saveOrReport()
        guard let undo else { return }
        undo.registerUndo(withTarget: self) { ctx in
            MainActor.assumeIsolated {
                for (note, text) in before where note.modelContext != nil {
                    note.body = text
                    note.touch()
                }
                ctx.saveOrReport()
            }
        }
        undo.setActionName(on ? "Add Tag" : "Remove Tag")
    }
}
