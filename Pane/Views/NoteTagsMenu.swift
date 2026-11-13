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
    private var colors: TagColors { .shared }

    /// The dot beside a tag in the menu: the colour its labels and its sidebar row have.
    @MainActor static func colour(of tag: String, in colors: TagColors) -> TagColor { colors.color(for: tag) }

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
                    // Each tag with its colour's dot, as the sidebar lists it.
                    Label {
                        Text(entry.name)
                    } icon: {
                        Image(nsOrUIImage: TagColorMenu.dot(Self.colour(of: entry.name, in: colors)))
                    }
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

/// New Tag…: a name and a colour (Emil, 12 November 2026: "I should be able to pick color
/// here"), then the tag goes on the notes it was asked for. A sheet, not an alert: an alert holds
/// only text fields and buttons. Until a colour is picked, it shows the one the name has.
struct NewTagAlert: ViewModifier {
    @Binding var notes: [UUID]?

    func body(content: Content) -> some View {
        content.sheet(isPresented: Binding(get: { notes != nil }, set: { if !$0 { notes = nil } })) {
            NewTagSheet(notes: notes ?? [], close: { notes = nil })
        }
    }
}

struct NewTagSheet: View {
    let notes: [UUID]
    let close: () -> Void
    @State private var name = ""
    @State private var picked: TagColor?
    @FocusState private var focused: Bool
    @Environment(\.modelContext) private var context
    @Environment(\.undoManager) private var undoManager

    /// The colour the new tag shows in: the one picked, else the one its name has (chosen before,
    /// or from the name).
    static func colour(for name: String, picked: TagColor?, in colors: TagColors) -> TagColor {
        picked ?? colors.color(for: NoteLabels.typedName(name) ?? name)
    }

    /// Add: the tag on the notes and, when one was picked, its colour.
    @MainActor static func add(_ typed: String, colour picked: TagColor?, to notes: [Note], in context: ModelContext, colors: TagColors, undo: UndoManager?) {
        guard let tag = NoteLabels.typedName(typed) else { return }
        if let picked { colors.set(picked, for: tag) }
        context.setTag(tag, on: notes, to: true, undo: undo)
    }

    private var tag: String? { NoteLabels.typedName(name) }
    private var shown: TagColor { Self.colour(for: name, picked: picked, in: .shared) }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                TextField("Needs review", text: $name)
                    .focused($focused)
                    .submitLabel(.done)
                    .onSubmit(add)
                    .padding(.horizontal, 14).padding(.vertical, 11)
                    .background(Color.secondary.opacity(0.12), in: .rect(cornerRadius: 12))
                    .accessibilityIdentifier("newTag.name")
                HStack(spacing: 0) {
                    ForEach(TagColor.allCases) { c in
                        Button { picked = c } label: {
                            Circle().fill(Color(tagColor: c))
                                .frame(width: 26, height: 26)
                                .hoverOverlay(Circle(), .hoverDarken)
                                .padding(4)
                                .overlay(Circle().strokeBorder(Color(tagColor: c), lineWidth: 2).opacity(shown == c ? 1 : 0))
                                .contentShape(Circle())
                        }
                        .buttonStyle(.plain)
                        #if os(macOS)
                        .pointerStyle(.link)
                        .help(c.title)
                        #endif
                        .frame(maxWidth: .infinity)
                        .accessibilityLabel(c.title)
                        .accessibilityAddTraits(shown == c ? .isSelected : [])
                        .accessibilityIdentifier("newTag.color.\(c.rawValue)")
                    }
                }
                // How it will look on the note.
                NoteLabelChips(labels: [tag ?? "Needs review"], colour: shown)
                    .opacity(tag == nil ? 0.4 : 1)
                    .frame(maxWidth: .infinity)
                    .accessibilityHidden(true)
                Spacer(minLength: 0)
            }
            .padding(20)
            .navigationTitle("New Tag")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: close)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add", action: add)
                        .disabled(tag == nil)
                        .accessibilityIdentifier("newTag.add")
                }
            }
        }
        #if os(iOS)
        .presentationDetents([.height(250)])
        #else
        .frame(width: 340, height: 220)
        #endif
        .onAppear { focused = true }
    }

    private func add() {
        guard tag != nil else { return }
        Self.add(name, colour: picked, to: notes.compactMap { context.note($0) }, in: context, colors: .shared, undo: undoManager)
        close()
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
