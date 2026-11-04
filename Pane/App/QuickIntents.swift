import AppIntents
import Foundation

// Ways into Pinto Notes from outside it (2026-11-04), shared by the app and the widget extension
// (PaneWidgets): the links the widget opens, the words both say, and New Note, which Control
// Centre, the Lock Screen and the Action button run.

/// The words the widget, the control and the intents say.
enum QuickWords {
    static let newNote = "New Pinto note"
    static let newNoteLine = "Opens Pinto Notes on a new note, ready to type."
    static let noLists = "No checklists yet"
    static let noListsLine = "Add a checklist to a note in Pinto Notes, and it shows here."
    static let listGone = "This note has no checklist now"
    static let listGoneLine = "Touch and hold the widget to pick another note."

    static func left(_ n: Int) -> String { n == 0 ? "All done" : n == 1 ? "1 left" : "\(n) left" }
    static func added(_ item: String, to note: String) -> String { "Added \u{201C}\(item)\u{201D} to \(note)." }
    static func ticked(_ item: String, in note: String) -> String { "Ticked \u{201C}\(item)\u{201D} in \(note)." }
    static func unticked(_ item: String, in note: String) -> String { "\u{201C}\(item)\u{201D} in \(note) is ticked already." }
    static func noItem(_ query: String, in note: String) -> String { "There\u{2019}s no \u{201C}\(query)\u{201D} in \(note)." }
    static func found(_ n: Int) -> String { n == 0 ? "No notes found." : n == 1 ? "Found 1 note." : "Found \(n) notes." }
}

/// Links into the app: `pintonotes://note/<id>` opens a note, `pintonotes://new` a new one.
enum QuickLink: Equatable, Sendable {
    case note(UUID)
    case newNote

    var url: URL {
        switch self {
        case .note(let id): URL(string: "\(AppIdentity.scheme)://note/\(id.uuidString.lowercased())")!
        case .newNote: URL(string: "\(AppIdentity.scheme)://new")!
        }
    }

    static func parse(_ url: URL) -> QuickLink? {
        guard url.scheme?.lowercased() == AppIdentity.scheme else { return nil }
        let path = url.path.split(separator: "/").map(String.init)
        switch url.host?.lowercased() {
        case "new" where path.isEmpty: return .newNote
        case "note" where path.count == 1: return UUID(uuidString: path[0]).map(QuickLink.note)
        default: return nil
        }
    }
}

/// New Note: the app opens on a new, empty note with the keyboard up. From Control Centre, the
/// Lock Screen, the Action button, Siri and Shortcuts. In both the app and the widget extension
/// (a control's intent must be); it runs in the app, which it opens.
struct NewNoteIntent: AppIntent {
    static let title: LocalizedStringResource = "New Note"
    static let description = IntentDescription("Opens Pinto Notes on a new note, ready to type.")
    static let supportedModes: IntentModes = .foreground(.immediate)

    init() {}

    @MainActor func perform() async throws -> some IntentResult {
        #if !WIDGET_EXTENSION
        NoteOpener.shared.askForNewNote()
        #endif
        return .result()
    }
}
