#if os(macOS)
import CryptoKit
import Foundation
import Observation
import SwiftData

/// Checklist ticks and pins for notes an Apple Notes import already brought in.
///
/// AppleScript hands a checklist over as a plain list and says nothing of pins; only Notes' own
/// database knows them, and only an app with Full Disk Access may read it. The import never asks
/// for that first (Emil, 12 November 2026: one button, nothing to set up). When it ran without
/// the database, the import's last page offers to bring the ticks and pins over; once the person
/// turns Full Disk Access on and comes back, this puts them on the notes that came in, by each
/// note's row in the database (its AppleScript id names it). No second import, no copies, and a
/// note changed here since the import is left as it is.
enum AppleNotesFollowUp {
    /// A note the import made, the database row it came from, and its text as it came in.
    struct Item: Codable, Equatable, Sendable {
        var note: UUID
        /// The note's Z_PK in NoteStore.sqlite (ApplePins.primaryKey).
        var key: Int
        /// The note's text as the import wrote it (`fingerprint`): a different one now is an edit.
        var fingerprint: String
    }

    /// What bringing the ticks and pins over did.
    struct Outcome: Equatable, Sendable {
        /// List items that became checklist items, and how many of them are ticked.
        var checklistItems = 0
        var ticked = 0
        /// Notes that got checklists.
        var checklistNotes = 0
        var pinned = 0
        /// Notes changed here since the import, left as they are.
        var changedSince = 0
        /// Notes gone since (deleted, locked or shared), left out.
        var gone = 0
        /// The database couldn't be read even with access (a macOS that lays it out differently).
        var unreadable = false

        /// "Ticked 14 items and pinned 3 notes".
        func line(locale: Locale = .current) -> String {
            func n(_ c: Int) -> String { c.formatted(.number.locale(locale)) }
            if unreadable { return "Apple Notes\u{2019} database couldn\u{2019}t be read, so nothing changed" }
            var parts: [String] = []
            if ticked > 0 {
                parts.append("Ticked \(n(ticked)) \(ticked == 1 ? "item" : "items")")
            } else if checklistNotes > 0 {
                parts.append("Brought back \(checklistNotes == 1 ? "1 checklist" : "\(n(checklistNotes)) checklists")")
            }
            if pinned > 0 {
                parts.append("\(parts.isEmpty ? "Pinned" : "pinned") \(n(pinned)) \(pinned == 1 ? "note" : "notes")")
            }
            return parts.isEmpty ? "No checklists or pins to bring over" : parts.joined(separator: " and ")
        }

        /// Under it, when some notes were left as they are.
        func leftLine(locale: Locale = .current) -> String? {
            guard changedSince > 0 else { return nil }
            return changedSince == 1
                ? "1 note you changed since the import was left as it is."
                : "\(changedSince.formatted(.number.locale(locale))) notes you changed since the import were left as they are."
        }
    }

    /// A short, stable fingerprint of a note's text.
    static func fingerprint(_ body: String) -> String {
        SHA256.hash(data: Data(body.utf8)).prefix(16).map { String(format: "%02x", $0) }.joined()
    }

    // MARK: Lists

    /// Rewrites the note's list items that the database knows better than the HTML did, in
    /// order, as the import would have with the database (`RichTextToMarkdown`'s hints): checklist
    /// items with their ticks, and a numbered list straight after a dashed one. An item is used
    /// only where its words match, so a database a step ahead of the note shifts nothing.
    static func checklists(in markdown: String, items: [RichTextToMarkdown.ListItem]) -> (markdown: String, checks: Int, ticked: Int) {
        let hints = items.map { (comparable($0.text), $0) }
        guard hints.contains(where: { $0.1.kind != .bullet && $0.1.kind != .dash }) else { return (markdown, 0, 0) }
        var next = 0
        var lines = markdown.components(separatedBy: "\n")
        var checks = 0, ticked = 0
        var fenced = false
        // Numbering per depth, as the converter keeps it: a list of another kind, or a line that
        // isn't in a list, ends it.
        var counters: [Int: Int] = [:]
        for (i, line) in lines.enumerated() {
            if line.trimmingCharacters(in: .whitespaces).hasPrefix("```") { fenced.toggle(); counters.removeAll(); continue }
            if fenced { continue }
            guard let m = line.firstMatch(of: #/^( *)([*+-]|\d+[.)]) (?!\[[ xX]\] )(.*)$/#) else {
                // A wrapped item's next line is still in the list.
                if !line.hasPrefix("  ") || line.trimmingCharacters(in: .whitespaces).isEmpty { counters.removeAll() }
                continue
            }
            let key = comparable(String(m.3))
            let hint = key.isEmpty ? nil : hints[next...].firstIndex(where: { $0.0 == key })
            let depth = hint.map { hints[$0].1.indent } ?? m.1.count / 2
            let numbered = hint.map { hints[$0].1.kind == .number } ?? m.2.first!.isNumber
            for d in Array(counters.keys) where d > depth || (d == depth && !numbered) { counters[d] = nil }
            guard let at = hint else {
                if numbered { counters[depth] = Int(m.2.dropLast()) ?? 1 }
                continue
            }
            next = at + 1
            let indent = String(repeating: "  ", count: depth)
            switch hints[at].1.kind {
            case .check(let done):
                lines[i] = indent + "- [\(done ? "x" : " ")] " + m.3
                checks += 1
                if done { ticked += 1 }
            case .number:
                let n = (counters[depth] ?? 0) + 1
                counters[depth] = n
                lines[i] = indent + "\(n). " + m.3
            case .bullet, .dash:
                break
            }
        }
        return (lines.joined(separator: "\n"), checks, ticked)
    }

    /// An item's words for matching: without markdown (links, emphasis, escapes) or spaces.
    static func comparable(_ s: String) -> String {
        let unlinked = s.replacing(/\[([^\]]*)\]\([^)]*\)/) { String($0.1) }
        let skip = CharacterSet.whitespacesAndNewlines.union(.controlCharacters).union(CharacterSet(charactersIn: "\\*_~`[]\u{FFFC}"))
        return String(String.UnicodeScalarView(unlinked.unicodeScalars.filter { !skip.contains($0) }))
    }

    // MARK: Applying

    /// Puts the database's checklists, ticks, named links and pins on the notes the import made.
    @MainActor
    static func apply(_ items: [Item], store: AppleNoteStore, in context: ModelContext) -> Outcome {
        var out = Outcome()
        for item in items {
            guard let note = context.note(item.note), note.deletedAt == nil, note.trashedAt == nil, !note.isLocked, !note.isShared else {
                out.gone += 1
                continue
            }
            guard fingerprint(note.body) == item.fingerprint else { out.changedSince += 1; continue }
            let lists = checklists(in: note.body, items: store.listItems(ofNote: item.key))
            var md = lists.markdown
            let links = store.links(ofNote: item.key)
            if !links.isEmpty { md = AppleNotesImporter.name(links, in: md) }
            var changed = false
            if md != note.body {
                note.body = md
                changed = true
            }
            if lists.checks > 0 {
                out.checklistItems += lists.checks
                out.ticked += lists.ticked
                out.checklistNotes += 1
            }
            if store.pinned.contains(item.key), !note.isPinned {
                note.isPinned = true
                out.pinned += 1
                changed = true
            }
            // Not an edit of the person's: the note keeps its date and place in the list, as a pin does.
            if changed { note.touchKeepingDate() }
        }
        try? context.save()
        return out
    }

    // MARK: Waiting for access

    /// Notes waiting for their ticks and pins, kept across a relaunch: turning Full Disk Access on
    /// can have macOS quit and reopen the app.
    struct Pending: Codable, Equatable {
        var items: [Item]
        var asked: Date
    }

    nonisolated(unsafe) static var defaults = UserDefaults.standard
    static let defaultsKey = "appleNotes.followUp"
    /// Asked for and never turned on: after a week the offer is forgotten, and nothing changes.
    static let keepFor: TimeInterval = 7 * 86_400

    static var pending: Pending? {
        get {
            guard let data = defaults.data(forKey: defaultsKey), let p = try? JSONDecoder().decode(Pending.self, from: data) else { return nil }
            return Date.now.timeIntervalSince(p.asked) < keepFor ? p : nil
        }
        set {
            if let newValue, let data = try? JSONEncoder().encode(newValue) { defaults.set(data, forKey: defaultsKey) } else { defaults.removeObject(forKey: defaultsKey) }
        }
    }
}

/// The one place the follow-up runs, so the import sheet and the window never both apply it.
@MainActor @Observable
final class AppleNotesFollowUpCenter {
    static let shared = AppleNotesFollowUpCenter()

    /// What the last run did, for whoever shows it.
    private(set) var outcome: AppleNotesFollowUp.Outcome?
    /// The import sheet is on its "turn it on" page and says the outcome itself.
    var sheetWaiting = false
    @ObservationIgnored var hasAccess: @Sendable () -> Bool = { ApplePins.hasAccess() }
    @ObservationIgnored var openStore: @Sendable () -> AppleNoteStore? = { try? AppleNoteStore.open().get() }
    @ObservationIgnored private var running = false

    /// The person asked for the ticks and pins of these notes: they wait until access is on. The
    /// database is tried once now, so macOS lists Pinto Notes under Full Disk Access.
    func ask(_ items: [AppleNotesFollowUp.Item]) {
        AppleNotesFollowUp.pending = items.isEmpty ? nil : .init(items: items, asked: .now)
        outcome = nil
        _ = hasAccess()
    }

    var isWaiting: Bool { AppleNotesFollowUp.pending != nil }

    /// Applies what waits, if anything does and the database can be read now. Nil otherwise.
    @discardableResult
    func applyIfReady(in context: ModelContext) async -> AppleNotesFollowUp.Outcome? {
        guard !running, let pending = AppleNotesFollowUp.pending else { return nil }
        running = true
        defer { running = false }
        let hasAccess = hasAccess, openStore = openStore
        guard await Task.detached(operation: { hasAccess() }).value else { return nil }
        let store = await Task.detached { FollowUpUnchecked(openStore()) }.value.value
        defer { store?.close() }
        // Asked again by the time the database is open: those notes, not the older ones.
        guard AppleNotesFollowUp.pending == pending else { return nil }
        AppleNotesFollowUp.pending = nil
        var result = AppleNotesFollowUp.Outcome(unreadable: true)
        if let store { result = AppleNotesFollowUp.apply(pending.items, store: store, in: context) }
        outcome = result
        return result
    }

    /// For the window, at launch and on coming back to the app: the line it shows once the ticks
    /// and pins came over. Nil while nothing waits, and while the import sheet says it itself.
    func windowLine(in context: ModelContext, locale: Locale = .current) async -> String? {
        guard isWaiting, !sheetWaiting, let outcome = await applyIfReady(in: context) else { return nil }
        return [outcome.line(locale: locale), outcome.leftLine(locale: locale)].compactMap { $0 }.joined(separator: " ")
    }

    /// Tests start clean.
    func reset() {
        AppleNotesFollowUp.pending = nil
        outcome = nil
        sheetWaiting = false
        running = false
    }
}

/// Carries a value that is handed over once, from the thread that made it.
private struct FollowUpUnchecked<T>: @unchecked Sendable {
    let value: T
    init(_ value: T) { self.value = value }
}
#endif
