import SwiftData
import SwiftUI

/// Tags in a note's right-click (and its long press on iPhone): each tag in the library, ticked
/// when the notes have it, and New Tag… for one that isn't there yet. Picking one puts it on the
/// note as a label (NoteLabels), not in its text; the list's row and the note's bar show it.
/// Picking a ticked one takes it off, and out of the text too when it was written there.
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

    /// Whether the note has the tag: as a label, or written in its text.
    static func has(_ tag: String, _ note: Note) -> Bool {
        NoteLabels.has(tag, in: note.frontMatter) || (Tags.writable(tag) && Tags.hasExactly(tag, in: note.body))
    }

    var body: some View {
        Menu {
            ForEach(entries, id: \.name) { entry in
                let has = !notes.isEmpty && notes.allSatisfy { NoteTagsMenu.has(entry.name, $0) }
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
                if let tag = NoteLabels.typedName(name), let ids = notes {
                    context.setTag(tag, on: ids.compactMap { context.note($0) }, to: true, undo: undoManager)
                }
                name = ""
            }
            .disabled(NoteLabels.typedName(name) == nil)
        }
    }
}

extension ModelContext {
    /// Puts `tag` on the notes as a label, or takes it off them (and out of their text, where it's
    /// written), as one change Undo takes back. The notes keep their place in the list: a label
    /// isn't an edit of what they say.
    @MainActor func setTag(_ tag: String, on notes: [Note], to on: Bool, undo: UndoManager?) {
        var before: [(note: Note, body: String, props: String?)] = []
        for note in NoteTagsMenu.taggable(notes) {
            var labels = NoteLabels.labels(in: note.frontMatter)
            var body = note.body
            if on {
                guard !NoteTagsMenu.has(tag, note) else { continue }
                labels.append(tag)
            } else {
                labels.removeAll { $0.lowercased() == tag.lowercased() }
                if Tags.writable(tag) { body = Tags.removing(tag, from: body) }
            }
            let props = NoteLabels.setting(labels, in: note.frontMatter)
            guard props != note.frontMatter || body != note.body else { continue }
            before.append((note, note.body, note.frontMatter))
            note.frontMatter = props
            if body != note.body { note.body = body }
            note.touchKeepingDate()
        }
        guard !before.isEmpty else { return }
        saveOrReport()
        guard let undo else { return }
        undo.registerUndo(withTarget: self) { ctx in
            MainActor.assumeIsolated {
                for b in before where b.note.modelContext != nil {
                    b.note.body = b.body
                    b.note.frontMatter = b.props
                    b.note.touchKeepingDate()
                }
                ctx.saveOrReport()
            }
        }
        undo.setActionName(on ? "Add Tag" : "Remove Tag")
    }
}
