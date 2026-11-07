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
        Usage.count(.menuBarNote)
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

#if os(macOS)
import AppKit
import Carbon.HIToolbox
import ServiceManagement

/// Settings › General › Quick note shortcut: a key that works in any app and brings Pinto
/// Notes forward on a new note. None until one is recorded (⌥Space belongs to ChatGPT).
@MainActor
final class QuickNoteHotKey {
    static let shared = QuickNoteHotKey()

    struct Shortcut: Equatable, Codable, Sendable {
        /// The key, as Carbon numbers it (kVK_…), and Carbon's modifier mask.
        var keyCode: UInt32
        var modifiers: UInt32
        /// What the chip shows: "⌃⌥N".
        var display: String
    }

    static let key = "quickNote.shortcut"
    @MainActor static var store: UserDefaults = PaneApp.isUnitTestHost ? MemoryDefaults() : .standard

    private var ref: EventHotKeyRef?
    private var handler: EventHandlerRef?
    /// What the key does; tests count presses instead.
    var action: @MainActor () -> Void = { QuickNoteHotKey.openNewNote() }

    var shortcut: Shortcut? {
        get { Self.store.data(forKey: Self.key).flatMap { try? JSONDecoder().decode(Shortcut.self, from: $0) } }
        set {
            if let newValue, let data = try? JSONEncoder().encode(newValue) { Self.store.set(data, forKey: Self.key) } else { Self.store.removeObject(forKey: Self.key) }
            register()
        }
    }

    /// Takes the key from the system, or gives it back when there is none. Test runs never do.
    func register() {
        if let ref { UnregisterEventHotKey(ref); self.ref = nil }
        guard !PaneApp.isUnitTestHost, let s = shortcut else { return }
        if handler == nil {
            var spec = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
            InstallEventHandler(GetApplicationEventTarget(), { _, _, _ in
                DispatchQueue.main.async { MainActor.assumeIsolated { QuickNoteHotKey.shared.action() } }
                return noErr
            }, 1, &spec, nil, &handler)
        }
        var made: EventHotKeyRef?
        let status = RegisterEventHotKey(s.keyCode, s.modifiers, EventHotKeyID(signature: OSType(0x504E5154), id: 1), GetApplicationEventTarget(), 0, &made)
        if status == noErr { ref = made }
    }

    /// Pinto Notes in front, on a new note: its window opens if it was closed.
    static func openNewNote() {
        Usage.count(.shortcutNote)
        NoteOpener.shared.askForNewNote()
        NSApp.activate(ignoringOtherApps: true)
        let shown = NSApp.windows.contains { $0.isVisible && $0.canBecomeMain }
        if !shown { NSWorkspace.shared.openApplication(at: Bundle.main.bundleURL, configuration: .init()) }
    }

    /// A shortcut from a key pressed while recording: at least one of ⌘, ⌥ or ⌃ (a bare letter
    /// would take that letter from every app), and never Delete or Escape, which clear and cancel.
    static func shortcut(keyCode: UInt16, flags: NSEvent.ModifierFlags, characters: String?) -> Shortcut? {
        let f = flags.intersection([.command, .option, .control, .shift])
        guard !f.intersection([.command, .option, .control]).isEmpty else { return nil }
        guard ![UInt16(kVK_Delete), UInt16(kVK_ForwardDelete), UInt16(kVK_Escape)].contains(keyCode) else { return nil }
        var mods: UInt32 = 0
        if f.contains(.command) { mods |= UInt32(cmdKey) }
        if f.contains(.option) { mods |= UInt32(optionKey) }
        if f.contains(.control) { mods |= UInt32(controlKey) }
        if f.contains(.shift) { mods |= UInt32(shiftKey) }
        return Shortcut(keyCode: UInt32(keyCode), modifiers: mods, display: display(flags: f, keyCode: keyCode, characters: characters))
    }

    /// "⌃⌥⇧⌘N", in the order the Mac's menus write them.
    static func display(flags: NSEvent.ModifierFlags, keyCode: UInt16, characters: String?) -> String {
        var out = ""
        if flags.contains(.control) { out += "\u{2303}" }
        if flags.contains(.option) { out += "\u{2325}" }
        if flags.contains(.shift) { out += "\u{21E7}" }
        if flags.contains(.command) { out += "\u{2318}" }
        let named: [Int: String] = [kVK_Space: "Space", kVK_Return: "\u{21A9}", kVK_Tab: "\u{21E5}",
                                    kVK_LeftArrow: "\u{2190}", kVK_RightArrow: "\u{2192}", kVK_UpArrow: "\u{2191}", kVK_DownArrow: "\u{2193}"]
        if let n = named[Int(keyCode)] { return out + n }
        return out + (characters ?? "").uppercased()
    }
}

/// Settings › General › Open at login: the system's login item for Pinto Notes.
@MainActor
enum LoginItem {
    /// Tests stand in for the system.
    @MainActor static var service: LoginService = PaneApp.isUnitTestHost ? MemoryLoginService() : SystemLoginService()

    static var isOn: Bool { service.isEnabled }

    /// Turns it on or off; false when the system said no (shown by the switch going back).
    @discardableResult
    static func set(_ on: Bool) -> Bool {
        do { try on ? service.register() : service.unregister(); return true } catch { return false }
    }
}

protocol LoginService: AnyObject {
    var isEnabled: Bool { get }
    func register() throws
    func unregister() throws
}

final class SystemLoginService: LoginService {
    var isEnabled: Bool { SMAppService.mainApp.status == .enabled }
    func register() throws { try SMAppService.mainApp.register() }
    func unregister() throws { try SMAppService.mainApp.unregister() }
}

final class MemoryLoginService: LoginService {
    var isEnabled = false
    func register() throws { isEnabled = true }
    func unregister() throws { isEnabled = false }
}
#endif
