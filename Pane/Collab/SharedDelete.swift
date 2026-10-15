import SwiftUI
#if os(macOS)
import AppKit
#endif

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
    /// in Recently Deleted, which asks its own question). `others` gives the first names of the
    /// other people in a note, when they're known here.
    @MainActor static func ask(_ notes: [Note], others: @MainActor (Note) -> [String] = { SharedDelete.others($0) }) -> Ask? {
        let shared = notes.filter { $0.isShared && $0.trashedAt == nil }
        guard !shared.isEmpty else { return nil }
        if notes.count == 1, let n = shared.first {
            if isYours(n) {
                let names = others(n)
                let who = list(names).map { "\($0) \(names.count == 1 ? "loses" : "lose") it too." } ?? "Everyone in it loses it too."
                return Ask(title: "Delete \u{201C}\(n.title)\u{201D} for everyone?",
                           message: "\(who) It stays in your Recently Deleted for 30 days, no longer shared.", button: "Delete")
            }
            let title = "Delete \u{201C}\(n.title)\u{201D}?"
            return Ask(title: title, message: "You\u{2019}ll leave it. It stays for the others.", button: "Delete")
        }
        return Ask(title: "Delete \(notes.count) notes?",
                   message: "Some are shared. The ones you shared stop being shared and are removed for the people in them; you leave the ones shared with you.",
                   button: "Delete")
    }

    /// "Sara", "Sara and Jonas", "Sara, Jonas and 3 others"; nil for nobody.
    static func list(_ names: [String]) -> String? {
        switch names.count {
        case 0: nil
        case 1: names[0]
        case 2: "\(names[0]) and \(names[1])"
        default: "\(names[0]), \(names[1]) and \(names.count - 2) others"
        }
    }

    /// The other people in the note, by first name, as its open session knows them.
    @MainActor static func others(_ note: Note) -> [String] {
        guard let session = CollabStore.shared?.session(for: note) else { return [] }
        return session.members.filter { $0.id != session.me }.map { ShareCopy.first($0.name) }
    }
}

/// The question, on whatever view deletes notes: `pending` set means asking.
struct SharedDeleteConfirmation: ViewModifier {
    @Binding var pending: [Note]?
    let perform: ([Note]) -> Void

    #if os(macOS)
    /// On the Mac the question is a small sheet of our own, as Remove and Leave are in Share:
    /// Cancel is the default (Return) and takes Esc, and only a click on Delete deletes for
    /// everyone. SwiftUI's alert makes the destructive button the one Return presses.
    func body(content: Content) -> some View {
        let ask = pending.flatMap { SharedDelete.ask($0) }
        content.sheet(isPresented: Binding(get: { ask != nil }, set: { if !$0 { pending = nil } })) {
            if let ask {
                SharedDeleteQuestion(ask: ask, cancel: { pending = nil }) {
                    if let notes = pending { perform(notes) }
                    pending = nil
                }
            }
        }
    }
    #else
    func body(content: Content) -> some View {
        let ask = pending.flatMap { SharedDelete.ask($0) }
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
    #endif
}

#if os(macOS)
/// The Mac's question before a shared note goes: the title, one line, then Delete in plain red
/// (the destructive role, no fill) and Cancel, the default, answering Return and Esc.
struct SharedDeleteQuestion: View {
    let ask: SharedDelete.Ask
    let cancel: () -> Void
    let delete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(ask.title).font(.headline).fixedSize(horizontal: false, vertical: true)
            Text(ask.message).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            HStack {
                Spacer()
                Button(role: .destructive, action: delete) { Text(ask.button).foregroundStyle(.red) }
                    .buttonStyle(.quiet)
                    .accessibilityIdentifier("sharedDelete.confirm")
                Button("Cancel", action: cancel)
                    .buttonStyle(.amberProminent)
                    .keyboardShortcut(.defaultAction)
                    .accessibilityIdentifier("sharedDelete.cancel")
                // Esc cancels too.
                Button("", action: cancel).keyboardShortcut(.cancelAction).hidden().frame(width: 0, height: 0)
            }
            .padding(.top, 6)
        }
        .padding(20)
        .frame(width: 360)
    }
}
#endif

extension View {
    func sharedDeleteConfirmation(_ pending: Binding<[Note]?>, perform: @escaping ([Note]) -> Void) -> some View {
        modifier(SharedDeleteConfirmation(pending: pending, perform: perform))
    }
}
