import SwiftUI

/// Deleting a shared note asks first, as Notes does, and says what happens: yours stops being
/// shared and the people in it lose it; one shared with you leaves your notes. The library does
/// the rest when the note is trashed (SharedLibrary: collab_unshare, or leave). Other notes go to
/// Recently Deleted straight away, as before.
enum SharedDelete {
    struct Ask: Equatable {
        var title: String
        var message: String
        var button: String
    }

    /// Yours: the shared note's id is the note's own. Someone else's lives here under its own id.
    static func isYours(_ note: Note) -> Bool { note.sharedNoteID == note.id }

    /// What to ask before `notes` go, or nil when nothing shared is among them (or they're already
    /// in Recently Deleted, which asks its own question).
    static func ask(_ notes: [Note]) -> Ask? {
        let shared = notes.filter { $0.isShared && $0.trashedAt == nil }
        guard !shared.isEmpty else { return nil }
        if notes.count == 1, let n = shared.first {
            return isYours(n)
                ? Ask(title: "Delete \u{201C}\(n.title)\u{201D} for everyone?",
                      message: "People in this note lose it. It goes to your Recently Deleted, no longer shared.", button: "Delete")
                : Ask(title: ShareCopy.leaveTitle(n.title), message: ShareCopy.leaveMessage, button: "Leave")
        }
        return Ask(title: "Delete \(notes.count) notes?",
                   message: "Some are shared. People in the ones you shared lose them, and notes shared with you leave your notes.", button: "Delete")
    }
}

/// The question, on whatever view deletes notes: `pending` set means asking.
struct SharedDeleteConfirmation: ViewModifier {
    @Binding var pending: [Note]?
    let perform: ([Note]) -> Void

    func body(content: Content) -> some View {
        let ask = pending.flatMap(SharedDelete.ask)
        content.alert(ask?.title ?? "", isPresented: Binding(get: { ask != nil }, set: { if !$0 { pending = nil } })) {
            Button("Cancel", role: .cancel) { pending = nil }
            Button(ask?.button ?? "Delete", role: .destructive) {
                if let notes = pending { perform(notes) }
                pending = nil
            }
            .accessibilityIdentifier("sharedDelete.confirm")
        } message: {
            Text(ask?.message ?? "")
        }
    }
}

extension View {
    func sharedDeleteConfirmation(_ pending: Binding<[Note]?>, perform: @escaping ([Note]) -> Void) -> some View {
        modifier(SharedDeleteConfirmation(pending: pending, perform: perform))
    }
}
