import Foundation
import SwiftData

/// What the menu bar panel lists: pinned notes, then the latest ones; or, while you
/// type, the notes that match. Every live note, as in the note list.
enum MenuBarList {
    static let pinnedLimit = 5
    static let recentLimit = 6
    static let searchLimit = 8

    struct Sections: Equatable {
        var pinned: [UUID] = []
        var recent: [UUID] = []
        var matches: [UUID] = []
        /// Every row in the order the arrow keys walk them.
        var all: [UUID] { matches.isEmpty ? pinned + recent : matches }
    }

    static func sections(_ notes: [Note], query: String) -> Sections {
        let live = notes.filter { $0.deletedAt == nil && $0.trashedAt == nil }
        let newest = live.sorted { $0.updatedAt > $1.updatedAt }
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard q.isEmpty else {
            // Title matches first, then text matches; newest first within each.
            let inTitle = newest.filter { $0.title.localizedStandardContains(q) }
            let inBody = newest.filter { !$0.title.localizedStandardContains(q) && $0.body.localizedStandardContains(q) }
            return Sections(matches: Array((inTitle + inBody).prefix(searchLimit)).map(\.id))
        }
        let pinned = Array(newest.filter(\.isPinned).prefix(pinnedLimit))
        let recent = Array(newest.filter { !$0.isPinned }.prefix(recentLimit))
        return Sections(pinned: pinned.map(\.id), recent: recent.map(\.id))
    }
}

/// A note typed into the menu bar: the first line is its title, and it goes where new notes go.
enum QuickCapture {
    @MainActor @discardableResult
    static func save(_ text: String, in context: ModelContext) -> Note? {
        let body = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty else { return nil }
        return context.createNote(in: .all, body: body)
    }
}

/// Asks the notes window to show a note, from outside it (the menu bar panel).
@MainActor @Observable
final class NoteOpener {
    static let shared = NoteOpener()
    /// The note to reveal; the notes window clears it once shown.
    var request: UUID?

    /// New Note was asked for from outside the app (Control Centre, the Lock Screen, the Action
    /// button, Siri): the notes open on a new note once they show, then this goes back to false.
    var newNoteAsked = false

    func open(_ id: UUID) {
        // A window opened fresh restores this note; one already open reveals it.
        UserDefaults.standard.set(id.uuidString, forKey: "lastNote")
        request = id
    }

    func askForNewNote() { newNoteAsked = true }

    /// The widget's links (QuickLink): a note by its id, or a new note. False for any other link.
    @discardableResult
    func receive(_ url: URL) -> Bool {
        switch QuickLink.parse(url) {
        case .note(let id)?: open(id)
        case .newNote?: askForNewNote()
        case nil: return false
        }
        return true
    }
}

/// Whether Amber Notes shows in the menu bar (Settings → Menu Bar).
enum MenuBarSettings {
    static let key = "showInMenuBar"
    /// Test runs never put an icon in your menu bar.
    static var allowed: Bool {
        !PaneApp.isUnitTestHost && !ProcessInfo.processInfo.arguments.contains("-uitest")
    }
}
