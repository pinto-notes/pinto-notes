import Foundation

// Which features are used, how fast notes and searches feel, and who leaves
// (docs/Technical/app-telemetry.md). A feature's use is one `feature_used` event; speeds are
// counted on this device and sent rolled up. Never a note's text, title or folder, never a
// search's words. Nothing is recorded with Share diagnostics and usage off (Telemetry.used).

/// A feature, by the word `feature_used` says it with.
enum UsedFeature: String, TelemetryWord {
    case notesCreated = "notes_created", notesEdited = "notes_edited", checklistTicked = "checklist_ticked"
    case tablesInserted = "tables_inserted", linksInserted = "links_inserted", slashMenu = "slash_menu"
    case formatUsed = "format_used", searchUsed = "search_used", goToNote = "go_to_note", todaysNote = "todays_note"
    case fromTemplate = "from_template", noteAppOpened = "note_app_opened", notePinned = "note_pinned"
    case noteLocked = "note_locked", sharePicture = "share_picture", menuBarNote = "menu_bar_note"
    case shortcutNote = "shortcut_note", importsStarted = "imports_started"
}

/// How long something took to show, counted into ranges and sent as one event.
struct SpeedTimings: Equatable, Sendable {
    var under100ms = 0, under250ms = 0, under1s = 0, over1s = 0

    /// How many make an event of their own while the app is still running.
    static let enough = 50

    var count: Int { under100ms + under250ms + under1s + over1s }
    var isEmpty: Bool { count == 0 }

    mutating func add(seconds: TimeInterval) {
        switch seconds {
        case ..<0.1: under100ms += 1
        case ..<0.25: under250ms += 1
        case ..<1: under1s += 1
        default: over1s += 1
        }
    }
}

/// What a speed is of.
enum SpeedKind: Sendable { case noteOpened, search }

/// A step of sharing a note with people (Collab).
enum ShareStep: String, TelemetryWord {
    case inviteSent = "invite_sent", inviteOpened = "invite_opened", inviteAccepted = "invite_accepted", left, removed
}

/// The Mac download's "Pinto Notes is now in the Mac App Store" (MacStoreMove): shown, Open the
/// App Store, Not Now.
enum MacStoreStep: String, TelemetryWord {
    case shown, openStore = "open_store", notNow = "not_now"
}

/// The account's storage, as the warning in the list says it (StorageUsage.Level).
enum StorageLevelWord: String, TelemetryWord {
    case fine, almostFull = "almost_full", full

    init(_ level: StorageUsage.Level) {
        switch level {
        case .fine: self = .fine
        case .nearlyFull: self = .almostFull
        case .full: self = .full
        }
    }
}

/// Where the app says a feature was used: one call at the one place each action happens.
enum Usage {
    /// Tests: every feature counted within the task that bound it, in order.
    @TaskLocal static var tap: (@Sendable (UsedFeature) -> Void)?

    static func count(_ feature: UsedFeature) {
        tap?(feature)
        Telemetry.shared.used(feature)
    }

    /// Typing in a note: one `feature_used` the first time each note is typed in, each launch.
    static func edited(_ note: UUID) {
        tap?(.notesEdited)
        Telemetry.shared.edited(note)
    }
}

/// From tapping a note to its text drawn (`note_opened_speed`). The tap starts it (the note pane's
/// selection changed); the editor made for that note ends it once its first frame is on screen.
/// A start that nothing ends in two seconds (a locked note, a note's app, a file) is dropped.
@MainActor
enum NoteOpenSpeed {
    private static var started: TimeInterval?
    static var now: () -> TimeInterval = { ProcessInfo.processInfo.systemUptime }
    static var record: (TimeInterval) -> Void = { Telemetry.shared.speed(.noteOpened, seconds: $0) }

    static func tapped(at: TimeInterval? = nil) { started = at ?? now() }

    /// The editor for the note is on screen.
    static func drawn() {
        guard let s = started else { return }
        started = nil
        let seconds = now() - s
        if seconds >= 0, seconds < 2 { record(seconds) }
    }
}

/// From typing in the list's search field to its results shown (`search_speed`).
@MainActor
enum SearchSpeed {
    private static var typed: TimeInterval?
    static var now: () -> TimeInterval = { ProcessInfo.processInfo.systemUptime }
    static var record: (TimeInterval) -> Void = { Telemetry.shared.speed(.search, seconds: $0) }

    /// A key changed what's searched for. The first key since the last results shown starts it.
    static func typed(at: TimeInterval? = nil) { if typed == nil { typed = at ?? now() } }

    /// The list shows what it found for the text typed.
    static func shown() {
        guard let t = typed else { return }
        typed = nil
        let seconds = now() - t
        if seconds >= 0, seconds < 10 { record(seconds) }
    }
}

/// The account's storage level, said when it changes (to almost full or full, and back to fine).
/// The level last said is kept on this device, so a launch doesn't say it again.
enum StorageLevelWatch {
    static let key = "telemetry.storageLevel"

    @MainActor static func saw(_ level: StorageUsage.Level, defaults: UserDefaults = .standard, isOn: Bool = Telemetry.shared.isOn) {
        // Off, nothing is kept: the level is looked at again once it's on.
        guard isOn || Funnel.tap != nil else { return }
        let word = StorageLevelWord(level)
        let last = defaults.string(forKey: key).flatMap(StorageLevelWord.init) ?? .fine
        guard word != last else { return }
        defaults.set(word.rawValue, forKey: key)
        Funnel.record(.storageLevel(word))
    }
}
