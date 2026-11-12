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
    case notesTrashed = "notes_trashed", folderCreated = "folder_created", folderDeleted = "folder_deleted"
}

/// What an AI did that the person took back (`ai_change_undone`).
enum AIChangeWord: String, TelemetryWord {
    case created, edited, moved, deleted, recovered
    case versionRestored = "version_restored"

    init(_ kind: AIChange.Kind) {
        switch kind {
        case .edit: self = .edited
        case .restore: self = .versionRestored
        case .created: self = .created
        case .moved: self = .moved
        case .deleted: self = .deleted
        case .restored: self = .recovered
        }
    }
}

/// How it was taken back.
enum AIUndoHow: String, TelemetryWord {
    /// Undo on the note, where the AI's change is marked.
    case undo
    /// Undo This Change in AI Changes.
    case changesList = "changes_list"
    /// The person deleted a note an AI had changed in the last week.
    case deleted
}

/// How long after the AI's change.
enum SinceBucket: String, TelemetryWord {
    case under5m = "under_5m", under1h = "under_1h", under1d = "under_1d", under7d = "under_7d"

    /// Nil past a week: by then it's no longer about what the AI did.
    init?(seconds: TimeInterval) {
        switch seconds {
        case ..<300: self = .under5m
        case ..<3600: self = .under1h
        case ..<86400: self = .under1d
        case ..<(7 * 86400): self = .under7d
        default: return nil
        }
    }
}

/// How long the app was away before it came back to the front (`app_returned`).
enum AwayBucket: String, TelemetryWord {
    case under2h = "under_2h", under8h = "under_8h", over8h = "over_8h"

    /// Nil under half an hour: a glance at another app isn't coming back.
    init?(seconds: TimeInterval) {
        switch seconds {
        case ..<1800: return nil
        case ..<7200: self = .under2h
        case ..<28800: self = .under8h
        default: self = .over8h
        }
    }
}

/// Folders an AI made in the last week (the server marks them, `folders.ai_made`), so deleting one
/// can say so. Only the folder's id and when it was made are kept here, at most 200, and only while
/// Share diagnostics and usage is on; turning it off or signing out forgets them.
enum AIMadeFolders {
    static let key = "telemetry.aiFolders"
    static let week: TimeInterval = 7 * 86400

    static func mark(_ id: UUID, at: Date, now: Date = .now, defaults: UserDefaults = .standard, isOn: Bool = Telemetry.shared.isOn) {
        guard isOn, now.timeIntervalSince(at) < week else { return }
        var kept = (defaults.dictionary(forKey: key) as? [String: Double] ?? [:])
            .filter { now.timeIntervalSince1970 - $0.value < week }
        guard kept[id.uuidString] == nil else { return }
        kept[id.uuidString] = at.timeIntervalSince1970
        if kept.count > 200 { kept = Dictionary(uniqueKeysWithValues: kept.sorted { $0.value > $1.value }.prefix(200).map { ($0.key, $0.value) }) }
        defaults.set(kept, forKey: key)
    }

    /// When the AI made it, if it did, and forgets it: a folder is deleted once.
    static func takeMade(_ id: UUID, defaults: UserDefaults = .standard) -> Date? {
        guard var kept = defaults.dictionary(forKey: key) as? [String: Double], let at = kept.removeValue(forKey: id.uuidString) else { return nil }
        defaults.set(kept, forKey: key)
        return Date(timeIntervalSince1970: at)
    }
}

/// Taking back what an AI did, said where it happens.
@MainActor
enum AIUndoUsage {
    /// The person deleted a folder: if an AI made it this week, that's taking back what it did.
    static func folderDeleted(_ id: UUID, now: Date = .now, defaults: UserDefaults = .standard) {
        if let at = AIMadeFolders.takeMade(id, defaults: defaults) { undone(.deleted, change: .created, at: at, now: now) }
    }

    static func undone(_ how: AIUndoHow, change: AIChangeWord?, at: Date, now: Date = .now) {
        guard let after = SinceBucket(seconds: max(0, now.timeIntervalSince(at))) else { return }
        Funnel.record(.aiChangeUndone(how, change: change, after: after))
    }
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

    /// The person deleted notes (Delete Note, ⌫, a shared note's delete): one `feature_used`, and for
    /// each note an AI changed in the last week, an `ai_change_undone` saying how soon after.
    @MainActor static func trashed(_ notes: [Note], now: Date = .now) {
        let live = notes.filter { $0.trashedAt == nil && $0.deletedAt == nil }
        guard !live.isEmpty else { return }
        count(.notesTrashed)
        for n in live where n.aiEditor != nil {
            if let at = n.aiEditedAt { AIUndoUsage.undone(.deleted, change: nil, at: at, now: now) }
        }
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
