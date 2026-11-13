import AppIntents
import Foundation
import SwiftUI

// Ways into Pinto Notes from outside it (2026-11-04), shared by the app and the widget extension
// (PaneWidgets): the links the widget opens, the words both say, and New Note, which Control
// Centre, the Lock Screen and the Action button run.

/// The words the widget, the control and the intents say.
enum QuickWords {
    static let newNote = "New Pinto note"
    static let newNoteLine = "Opens Pinto Notes on a new note, ready to type."
    static let noLists = "No notes yet"
    static let noListsLine = "Open Pinto Notes, and your notes show here."
    static let listGone = "This note isn\u{2019}t here now"
    static let listGoneLine = "It\u{2019}s locked or deleted. Touch and hold the widget to pick another note."
    static let noteWaiting = "Open Pinto Notes once to show this note here."

    static func left(_ n: Int) -> String { n == 0 ? "All done" : n == 1 ? "1 left" : "\(n) left" }
    static func added(_ item: String, to note: String) -> String { "Added \u{201C}\(item)\u{201D} to \(note)." }
    static func ticked(_ item: String, in note: String) -> String { "Ticked \u{201C}\(item)\u{201D} in \(note)." }
    static func unticked(_ item: String, in note: String) -> String { "\u{201C}\(item)\u{201D} in \(note) is ticked already." }
    static func noItem(_ query: String, in note: String) -> String { "There\u{2019}s no \u{201C}\(query)\u{201D} in \(note)." }
    static func found(_ n: Int) -> String { n == 0 ? "No notes found." : n == 1 ? "Found 1 note." : "Found \(n) notes." }
}

/// The words privacy mode says, in the app, the widget and Control Centre (PrivacyMode).
enum PrivacyWords {
    static let menuTitle = "Privacy Mode"
    static let name = "Privacy mode"
    static let turnOff = "Turn off privacy mode"
    static let help = "Privacy mode is on, so the note list is blurred. Click to turn it off."
    /// The Mac's: titles blur too, until you point at the list (ListTitleReveal).
    static let settingsFooter = "Blurs note previews, and note titles until you point at the list. The note you have open still shows."
    static let settingsFooterPhone = "Blurs the previews under each title in the note list. Titles and the note you have open still show."
    static let whenSharedTitle = "When your screen is shared"
    static let whenSharedFooter = "Privacy mode turns on while your screen is shared or recorded, and off again when it stops."
    /// The Mac's: it hears calls too (CallDetection).
    static let whenSharedTitleMac = "In calls and when sharing your screen"
    static let whenSharedFooterMac = "Privacy mode turns on during a call or while your screen is shared or recorded, and off again when it ends."
    static let coverTitle = "Your screen is being shared"
    static let coverTitleCall = "You\u{2019}re in a call"
    static let coverQuestion = "Blur note previews?"
    static let hide = "Blur previews"
    static let show = "Show previews"
    static let remember = "Remember this"
    static let controlKind = "PrivacyModeControl"
    static let controlLine = "Blurs note previews in Pinto Notes."
}

/// A note's preview while privacy mode is on: still there, in its place, but blurred too much to
/// read (Emil, 13 November 2026: "visibly blurred, not hidden"), so the list keeps its shape and
/// you can see something is there. On the Mac, pointing at it shows it, like the email blur
/// (PrivateBlur). It fades in and out, at once with Reduce Motion. Shared with the widget.
struct PreviewBlur: ViewModifier {
    var on: Bool
    var revealsOnHover = true
    @State private var revealed = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// At 4 whole sentences could still be read (the pictures, 13 November 2026).
    static let radius: CGFloat = 8
    /// PrivacyModeTests keeps `radius` at least this.
    static let minimumRadius: CGFloat = 8

    func body(content: Content) -> some View {
        content
            .blur(radius: on && !revealed ? Self.radius : 0)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: on)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.15), value: revealed)
            #if os(macOS)
            .onHover { if revealsOnHover { revealed = $0 } }
            #endif
    }
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

/// Privacy mode from Control Centre (PrivacyModeControl): on or off, as you set it there. It
/// lands in the App Group, which the app takes up when it comes forward; run in the app, at once.
struct SetPrivacyModeIntent: SetValueIntent {
    static let title: LocalizedStringResource = "Privacy Mode"
    static let description = IntentDescription("Blurs your notes in Pinto Notes, or shows them again.")

    @Parameter(title: "Privacy mode") var value: Bool

    init() {}

    @MainActor func perform() async throws -> some IntentResult {
        var p = ChecklistShelf.privacy()
        p.manual = value
        p.hidden = value
        ChecklistShelf.savePrivacy(p)
        #if !WIDGET_EXTENSION
        PrivacyMode.shared.setManual(value)
        #endif
        return .result()
    }
}

