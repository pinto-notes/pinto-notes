import Foundation
import SwiftData
import SwiftUI

/// The rows at the foot of the Mac sidebar that help set an account up: Templates, Connect an AI
/// and Import notes. Each leaves once its job is done, or when you remove it, and never comes
/// back (Emil, 12 November 2026: "I kinda wanna get these off my sidebar"). Their permanent homes
/// are your account's menu, the File menu and Settings › AI Connections.
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

    static let removeTitle = "Remove from Sidebar"
}

/// What the app knows about an account's setup, as the rows ask it.
struct SidebarSetupFacts: Equatable {
    /// At least one AI is connected to the account.
    var connected = false
    /// An import has finished on the account (on any device: the server's mark).
    var imported = false
    /// A note has been made from a template.
    var madeFromTemplate = false
    /// When the account's first note was made, as far as is known.
    var firstNote: Date?
}

/// Which rows have left, per account, in UserDefaults ("sidebarSetup.<row>.<account>"). Once a
/// row has left it stays gone, whatever changes after (an AI disconnected, the notes deleted).
struct SidebarSetup {
    /// Import notes and Templates leave two weeks after the account's first note.
    static let window: TimeInterval = 14 * 86_400

    let defaults: UserDefaults
    let account: String

    init(defaults: UserDefaults = .standard, account: UUID) {
        self.defaults = defaults
        self.account = account.uuidString.lowercased()
    }

    func key(_ row: SidebarSetupRow) -> String { "sidebarSetup.\(row.rawValue).\(account)" }
    var firstNoteKey: String { "sidebarSetup.firstNote.\(account)" }

    func isGone(_ row: SidebarSetupRow) -> Bool { defaults.bool(forKey: key(row)) }
    func remove(_ row: SidebarSetupRow) { defaults.set(true, forKey: key(row)) }

    /// Whether the row's job is done.
    static func isDone(_ row: SidebarSetupRow, _ facts: SidebarSetupFacts, now: Date = .now) -> Bool {
        let aged = facts.firstNote.map { now.timeIntervalSince($0) >= window } ?? false
        switch row {
        case .connect: return facts.connected
        case .importNotes: return facts.imported || aged
        case .templates: return facts.madeFromTemplate || aged
        }
    }

    /// The rows to show, in order. A row whose job is done now is put away for good.
    func shown(_ facts: SidebarSetupFacts, now: Date = .now) -> [SidebarSetupRow] {
        SidebarSetupRow.allCases.filter { row in
            if isGone(row) { return false }
            if Self.isDone(row, facts, now: now) { remove(row); return false }
            return true
        }
    }

    /// When the account's first note was made: kept the first time the account is seen holding a
    /// note. Notes keep the dates they had where they came from (an import from Apple Notes can
    /// be years old), so the notes' own dates don't say it; the account's sign-up date does, the
    /// day its first note (Welcome) was made. Nil while the account has no notes.
    func firstNote(hasNotes: Bool, accountCreated: Date?, now: Date = .now) -> Date? {
        if let kept = defaults.object(forKey: firstNoteKey) as? Date { return kept }
        guard hasNotes else { return nil }
        let first = min(accountCreated ?? now, now)
        defaults.set(first, forKey: firstNoteKey)
        return first
    }

    /// Everything the rows ask, from what the app already knows: the server's setup marks, the
    /// AI connections list (Settings › AI Connections), the templates you made and your notes.
    @MainActor static func facts(progress: SetupProgress?, connected: [String]?, ledger: NoteSourceLedger, context: ModelContext,
                                 accountCreated: Date?, setup: SidebarSetup, now: Date = .now) -> SidebarSetupFacts {
        let hasNotes = ((try? context.fetchCount(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil }))) ?? 0) > 0
        return SidebarSetupFacts(connected: progress?.connected == true || !(connected ?? []).isEmpty,
                                 imported: progress?.imported == true,
                                 madeFromTemplate: ledger.madeFromTemplate,
                                 firstNote: setup.firstNote(hasNotes: hasNotes, accountCreated: accountCreated, now: now))
    }
}

extension NoteSourceLedger {
    /// A note has been made from a template on this account (here, from the library or a link).
    var madeFromTemplate: Bool {
        let all = defaults.dictionary(forKey: "noteSources.\(account)") as? [String: String] ?? [:]
        return all.keys.contains { $0.hasPrefix("\(NoteSourceLink.Kind.template.rawValue):") }
    }
}

extension EnvironmentValues {
    /// Where the rows keep which have left; tests give each run its own.
    @Entry var sidebarSetupDefaults: UserDefaults = .standard
}

/// Menu bar items the tests read.
enum AppMenuWords {
    /// File › New from Template…: the Templates library.
    static let newFromTemplate = "New from Template\u{2026}"
    /// File › Import Notes: a submenu of the places to import from.
    static let importNotes = "Import Notes"
}

/// Your account's menu at the foot of the sidebar (a right-click on it): the permanent homes of
/// the setup rows, Connect an AI first, one click away.
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
