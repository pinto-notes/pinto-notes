import Foundation
import SwiftData
import SwiftUI

/// What the account's menu and the foot of the Mac sidebar open to set an account up: Templates,
/// Connect an AI and Import notes. Templates is a row at the foot for good; Connect an AI and
/// Import notes are in Settings, said once by a notice (`SetupNotice`), and in your account's
/// right-click menu and the File menu (Emil, 12 November 2026: "maybe we should keep templates
/// there. but put connect AI and import notes as a notice you see").
enum SidebarSetupRow: String, CaseIterable, Sendable {
    case templates
    case connect = "connectAI"
    case importNotes = "import"

    var title: String {
        switch self {
        case .templates: SidebarAIWords.templates
        case .connect: SidebarAIWords.connect
        case .importNotes: SidebarAIWords.importNotes
        }
    }

    var symbol: String {
        switch self {
        case .templates: "square.grid.2x2"
        case .connect: "sparkles"
        case .importNotes: "square.and.arrow.down"
        }
    }

    /// Its accessibility identifier, and its pill's in the tests' frames.
    var id: String { "sidebar.\(rawValue)" }

    /// What a click opens: the sheet the account's menu opens too.
    var opens: Notification.Name {
        switch self {
        case .templates: .paneTemplates
        case .connect: .paneConnectAI
        // The choice of where from, not Apple Notes' import straight away (Emil, 2 November 2026).
        case .importNotes: .paneImportNotes
        }
    }
}

/// The notice's words: what it says depends on whether the account has imported yet.
enum SetupNoticeWords {
    static let connectAndImport = "You can connect more AIs and import notes any time in Settings."
    static let connect = "You can connect more AIs any time in Settings."
    static let open = "Open Settings"

    static func line(imported: Bool) -> String { imported ? connect : connectAndImport }
}

/// What the app knows about an account, as the notice asks it.
struct SetupNoticeFacts: Equatable {
    /// An import has finished on the account (the server's mark). Nil until the server has said,
    /// so the notice never shows one line and swaps to the other.
    var imported: Bool?
    /// When the account's first note was made, as far as is known.
    var firstNote: Date?
}

/// The one notice a new account sees at the foot of the Mac sidebar, once setup is over: that
/// Settings connects more AIs and imports notes. It goes when either of its buttons is pressed, or
/// two weeks after the account's first note, and never comes back (kept per account in
/// UserDefaults, "sidebarSetup.notice.<account>"). An account older than two weeks never sees it.
struct SetupNotice {
    /// Two weeks after the account's first note it has gone, seen or not.
    static let window: TimeInterval = 14 * 86_400

    let defaults: UserDefaults
    let account: String

    init(defaults: UserDefaults = .standard, account: UUID) {
        self.defaults = defaults
        self.account = account.uuidString.lowercased()
    }

    var goneKey: String { "sidebarSetup.notice.\(account)" }
    var firstNoteKey: String { "sidebarSetup.firstNote.\(account)" }

    var isGone: Bool { defaults.bool(forKey: goneKey) }
    /// For good: a button was pressed, or the two weeks are over.
    func close() { defaults.set(true, forKey: goneKey) }

    /// What the notice says now, or nil when it doesn't show: gone, during the first-run flow,
    /// before the account has a note, or before the server has said whether it has imported. Once
    /// the two weeks are over it is put away for good.
    func line(_ facts: SetupNoticeFacts, onboarding: Bool, now: Date = .now) -> String? {
        guard !isGone, let first = facts.firstNote else { return nil }
        if now.timeIntervalSince(first) >= Self.window { close(); return nil }
        guard !onboarding, let imported = facts.imported else { return nil }
        return SetupNoticeWords.line(imported: imported)
    }

    /// When the account's first note was made: kept the first time the account is seen holding a
    /// note. Notes keep the dates they had where they came from (an import from Apple Notes can
    /// be years old), so the notes' own dates don't say it; the account's sign-up date does, the
    /// day its first note (Welcome) was made. Nil while the account has no notes, or while its
    /// sign-up date isn't known yet (so an old account is never taken for a new one).
    func firstNote(hasNotes: Bool, accountCreated: Date?, now: Date = .now) -> Date? {
        if let kept = defaults.object(forKey: firstNoteKey) as? Date { return kept }
        guard hasNotes, let accountCreated else { return nil }
        let first = min(accountCreated, now)
        defaults.set(first, forKey: firstNoteKey)
        return first
    }

    /// What the notice asks, from what the app already knows: the server's setup marks and your notes.
    @MainActor static func facts(progress: SetupProgress?, context: ModelContext, accountCreated: Date?,
                                 notice: SetupNotice, now: Date = .now) -> SetupNoticeFacts {
        let hasNotes = ((try? context.fetchCount(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil }))) ?? 0) > 0
        return SetupNoticeFacts(imported: progress?.imported,
                                firstNote: notice.firstNote(hasNotes: hasNotes, accountCreated: accountCreated, now: now))
    }
}

extension EnvironmentValues {
    /// Where the notice keeps whether it has gone; tests give each run its own.
    @Entry var sidebarSetupDefaults: UserDefaults = .standard
}

/// Menu bar items the tests read.
enum AppMenuWords {
    /// File › New from Template…: the Templates library.
    static let newFromTemplate = "New from Template\u{2026}"
    /// File › Import Notes: a submenu of the places to import from.
    static let importNotes = "Import Notes"
}

/// Your account's menu at the foot of the sidebar (a right-click on it): Connect an AI first, one
/// click away, then Templates and Import Notes.
enum AccountMenuItems {
    struct Item: Identifiable {
        let title: String
        let symbol: String
        let row: SidebarSetupRow
        var id: String { row.rawValue }
        @MainActor func open() { NotificationCenter.default.post(name: row.opens, object: nil) }
    }

    static let settings = "Account Settings\u{2026}"
    static let items: [Item] = [
        Item(title: "Connect an AI\u{2026}", symbol: "sparkles", row: .connect),
        Item(title: "Templates\u{2026}", symbol: "square.grid.2x2", row: .templates),
        Item(title: "Import Notes\u{2026}", symbol: "square.and.arrow.down", row: .importNotes),
    ]
}
