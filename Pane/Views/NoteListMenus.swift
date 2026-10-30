import SwiftData
import SwiftUI

/// A note's long-press menu in the iPhone list, as in Apple Notes (iOS 26): Share, Move and
/// Delete across the top, then Pin, Lock and Duplicate. Pinto has no other note actions there.
enum NoteRowMenu {
    enum Item: Hashable { case share, move, delete, pin, lock, removeLock, duplicate, recover }

    /// The first group is the row of three. A locked note's text isn't here to send or copy, so it
    /// has no Share and no Duplicate. In Recently Deleted a note can only come back or go for good.
    static func groups(locked: Bool, trashed: Bool) -> [[Item]] {
        if trashed { return [[.recover, .delete]] }
        if locked { return [[.move, .delete], [.pin, .removeLock]] }
        return [[.share, .move, .delete], [.pin, .lock, .duplicate]]
    }
}

/// The list's ••• menu on iPhone, top to bottom, as in Apple Notes: Select Notes, then Sort By
/// and Group By Date, then adding files. No View as Gallery and no Show Attachments: Pinto
/// shows notes in a list only. Recently Deleted has Edit instead of this menu.
enum ListMoreMenu {
    enum Item: Hashable { case selectNotes, sortBy, groupByDate, addFiles, connectAI }

    static func groups(connectNudge: Bool) -> [[Item]] {
        var out: [[Item]] = [[.selectNotes], [.sortBy, .groupByDate], [.addFiles]]
        if connectNudge { out.append([.connectAI]) }
        return out
    }

    /// What "Add Files" does, said: the files are kept in this folder, next to its notes (they
    /// aren't turned into notes). All Notes keeps them in the first folder.
    static func addFilesTitle(folder: String) -> String { "Add Files to \u{201C}\(folder)\u{201D}\u{2026}" }
}

/// Recently Deleted while editing: the bottom bar's buttons, as in Apple Notes. With nothing
/// selected they act on everything in the list.
enum TrashEditBar {
    static func titles(selected: Int) -> (move: String, delete: String) {
        selected == 0 ? ("Move All", "Delete All") : ("Move", "Delete")
    }
}

/// The note itself, as a tall card over its long-press menu: the title large, then the text the
/// way it reads, checkboxes as circles.
struct NotePreviewCard: View {
    let note: Note

    struct Line: Equatable {
        enum Kind: Equatable { case heading, text, bullet, check(Bool) }
        var kind: Kind
        var text: String
        var depth: Int
    }

    /// The lines under the title, enough to fill the card.
    static func lines(of body: String, limit: Int = 24) -> [Line] {
        var out: [Line] = []
        var titled = false
        for raw in body.split(separator: "\n", omittingEmptySubsequences: false) {
            guard out.count < limit else { break }
            let line = String(raw)
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.isEmpty {
                if titled, let last = out.last, last.text != "" { out.append(Line(kind: .text, text: "", depth: 0)) }
                continue
            }
            if !titled { titled = true; continue }
            let indent = line.prefix { $0 == " " || $0 == "\t" }.reduce(0) { $0 + ($1 == "\t" ? 2 : 1) } / 2
            let kind: Line.Kind
            if trimmed.hasPrefix("- [ ] ") { kind = .check(false) }
            else if trimmed.hasPrefix("- [x] ") || trimmed.hasPrefix("- [X] ") { kind = .check(true) }
            else if trimmed.hasPrefix("#") { kind = .heading }
            else if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") || trimmed.hasPrefix("+ ") { kind = .bullet }
            else { kind = .text }
            let text = NoteText.stripMarkup(trimmed)
            guard !text.isEmpty else { continue }
            out.append(Line(kind: kind, text: text, depth: min(indent, 6)))
        }
        while out.last?.text == "" { out.removeLast() }
        return out
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(note.title)
                .font(.title.bold())
                .foregroundStyle(Color.ink)
                .lineLimit(2)
            if note.isLocked {
                Label("Locked", systemImage: "lock.fill")
                    .foregroundStyle(Color.muted)
            } else {
                ForEach(Array(Self.lines(of: note.body).enumerated()), id: \.offset) { _, line in
                    row(line)
                }
            }
        }
        .padding(24)
        .frame(width: 360, height: 460, alignment: .topLeading)
        .background(Color.notePage)
        .accessibilityIdentifier("note.preview")
    }

    @ViewBuilder
    private func row(_ line: Line) -> some View {
        if line.text.isEmpty {
            Spacer().frame(height: 2)
        } else {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                switch line.kind {
                case .check(let done):
                    // As the editor draws them: a grey ring, or the accent disc with a white tick.
                    if done {
                        Image(systemName: "checkmark.circle.fill")
                            .symbolRenderingMode(.palette)
                            .foregroundStyle(.white, Color(PColor.paneAccent))
                    } else {
                        Image(systemName: "circle").foregroundStyle(Color.muted.opacity(0.6))
                    }
                case .bullet:
                    Text("\u{2022}").foregroundStyle(Color.muted)
                default:
                    EmptyView()
                }
                Text(line.text)
                    .font(line.kind == .heading ? .headline : .body)
                    .foregroundStyle(line.kind == .check(true) ? Color.muted : Color.ink)
            }
            .padding(.leading, CGFloat(line.depth) * 20)
        }
    }
}

#if os(iOS)
/// Move from the list (a note's long-press menu, Select Notes, Recently Deleted): the folders as
/// the sidebar has them. Moving a note out of Recently Deleted brings it back.
struct MoveNotesSheet: View {
    /// The folder the notes are all in now, if they share one: shown, and not a choice.
    let current: UUID?
    let move: (Folder) -> Void
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List(MoveToPicker.rows(context.allFolders())) { row in
                Button {
                    if let f = context.folder(row.id) { move(f) }
                    dismiss()
                } label: {
                    HStack {
                        Label(row.name, systemImage: "folder")
                        Spacer()
                        if row.id == current { Image(systemName: "checkmark").foregroundStyle(Color.muted) }
                    }
                    .padding(.leading, CGFloat(row.depth) * 16)
                }
                .tint(.primary)
                .disabled(row.id == current)
                .accessibilityIdentifier("moveTo.folder.\(row.name)")
            }
            .navigationTitle("Move to")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", systemImage: "xmark") { dismiss() }
                        .tint(.primary)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

/// Lock Note and Remove Lock from a note's long-press menu: the same steps as the note's own •••
/// menu (setting the password up, asking for it, confirming).
struct ListLockRequest: Equatable {
    let note: UUID
    let removing: Bool
    /// Asking again for the same note is a new request.
    let token = UUID()
}

struct ListLockFlow: ViewModifier {
    @Binding var request: ListLockRequest?
    @Environment(\.modelContext) private var context
    @State private var sheet: Step?
    @State private var confirming = false
    @State private var confirmTitle = ""
    @State private var problem: String?
    private var vault: NoteVault { .shared }

    enum Step: String, Identifiable {
        case setUp, password
        var id: String { rawValue }
    }

    func body(content: Content) -> some View {
        content
            .onChange(of: request) { _, r in if let r { start(r) } }
            .sheet(item: $sheet) { step in
                switch step {
                case .setUp: NotesPasswordSetupSheet { lock() }
                case .password:
                    NotesPasswordPrompt(message: request?.removing == true ? "Enter your notes password to remove the lock." : "Enter your notes password to lock this note.") {
                        if request?.removing == true { removeLock() } else { askToLock() }
                    }
                }
            }
            .confirmationDialog(confirmTitle, isPresented: $confirming, titleVisibility: .visible) {
                Button("Lock Note") { lock() }
                    .accessibilityIdentifier("lock.confirm")
            } message: {
                Text("Its earlier versions are removed from version history, so no readable copy is kept, and if it has a share link, the link stops working.")
            }
            .alert("Can't lock this note", isPresented: Binding(get: { problem != nil }, set: { if !$0 { problem = nil } })) {
                Button("OK") {}
            } message: { Text(problem ?? "") }
    }

    private var note: Note? { request.flatMap { context.note($0.note) } }

    private func start(_ r: ListLockRequest) {
        guard let note else { return }
        if !r.removing, let why = NoteVault.blocker(for: note) { problem = why.errorDescription; return }
        Task { @MainActor in
            if !vault.isSetUp { await vault.refresh() }
            if r.removing {
                if vault.isUnlocked { removeLock() } else { sheet = .password }
            } else if !vault.isSetUp {
                sheet = .setUp
            } else if !vault.isUnlocked {
                sheet = .password
            } else {
                askToLock()
            }
        }
    }

    private func askToLock() {
        guard let note else { return }
        confirmTitle = note.title.isEmpty ? "Lock this note?" : "Lock \u{201C}\(note.title)\u{201D}?"
        confirming = true
    }

    private func lock() {
        guard let note else { return }
        do {
            try vault.lock(note)
            try? context.save()
        } catch {
            problem = (error as? LocalizedError)?.errorDescription ?? "Try again."
        }
        request = nil
    }

    private func removeLock() {
        guard let note else { return }
        try? vault.removeLock(note)
        try? context.save()
        request = nil
    }
}
#endif
