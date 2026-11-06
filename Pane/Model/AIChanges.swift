import Foundation
import Observation
import Supabase
import SwiftData

/// One change an AI connection made to your notes: an edit of a note's text, a version it
/// restored, a note it made, moved, deleted or brought back from Recently Deleted.
///
/// The server lists them across all your notes (`ai_changes`, 20261030153000_ai_changes.sql).
/// The texts on each side of an edit are versions in the note's history, sealed like the note
/// and opened here.
struct AIChange: Identifiable, Hashable, Sendable {
    enum Kind: String, Sendable { case edit, restore, created, moved, deleted, restored }

    var id: String
    var kind: Kind
    var noteID: UUID
    var ai: String
    var at: Date
    /// Edits: the version whose text it replaced.
    var beforeVersion: Int64?
    /// The version holding the text it wrote; nil when that is the note's text now.
    var afterVersion: Int64?
    /// Moves: the folder it left and the one it went to (nil: no folder).
    var fromFolder: UUID?
    var toFolder: UUID?
    /// The note is in Recently Deleted now.
    var trashed = false
    /// Edits one after another by one AI that this one change stands for (`AIChangeCopy.sessions`).
    var edits = 1
    /// When the first of them was made.
    var startedAt: Date?

    /// It changed the note's text, so there is a before and an after to compare.
    var changesText: Bool { kind == .edit || kind == .restore || kind == .created }
}

/// Where the changes come from: the server in the app, the demo history in captures and tests.
@MainActor
protocol AIChangesStore: AnyObject {
    /// Up to `limit` changes from before `before` (nil: from now), newest first; only `ai`'s when given.
    func changes(before: Date?, limit: Int, ai: String?) async throws -> [AIChange]
}

@MainActor
final class SupabaseAIChangesStore: AIChangesStore {
    let client: SupabaseClient
    init(client: SupabaseClient) { self.client = client }

    struct Row: Decodable {
        var id: String
        var kind: String
        var note_id: UUID
        var ai: String
        var at: Date
        var before_version: Int64?
        var after_version: Int64?
        var from_folder: UUID?
        var to_folder: UUID?
        var trashed: Bool?
    }

    nonisolated static func change(_ r: Row) -> AIChange? {
        guard let kind = AIChange.Kind(rawValue: r.kind) else { return nil }
        return AIChange(id: r.id, kind: kind, noteID: r.note_id, ai: r.ai, at: r.at, beforeVersion: r.before_version,
                        afterVersion: r.after_version, fromFolder: r.from_folder, toFolder: r.to_folder, trashed: r.trashed ?? false)
    }

    func changes(before: Date?, limit: Int, ai: String?) async throws -> [AIChange] {
        var params: [String: AnyJSON] = ["p_limit": .integer(limit)]
        if let before { params["p_before"] = .string(before.ISO8601Format(.iso8601.time(includingFractionalSeconds: true))) }
        if let ai { params["p_ai"] = .string(ai) }
        let rows: [Row] = try await client.rpc("ai_changes", params: params).execute().value
        return rows.compactMap(Self.change)
    }
}

/// The AI changes a note history holds: each version an AI wrote, against the one before it.
/// For the demo library (`-demoHistory`) and tests, where there is no server to ask.
@MainActor
final class HistoryAIChangesStore: AIChangesStore {
    let history: NoteHistoryStore
    let context: ModelContext
    var offline = false

    init(history: NoteHistoryStore, context: ModelContext) {
        self.history = history
        self.context = context
    }

    func changes(before: Date?, limit: Int, ai: String?) async throws -> [AIChange] {
        if offline { throw URLError(.notConnectedToInternet) }
        let notes = (try? context.fetch(FetchDescriptor<Note>())) ?? []
        var out: [AIChange] = []
        for note in notes where note.deletedAt == nil {
            let versions = try await history.versions(of: note.id)
            for (i, v) in versions.enumerated() {
                guard case .ai(let name) = v.author, i + 1 < versions.count else { continue }
                if let ai, ai != name { continue }
                if let before, v.madeAt >= before { continue }
                out.append(AIChange(id: "\(note.id)/\(v.version)", kind: v.restored ? .restore : .edit, noteID: note.id, ai: name, at: v.madeAt,
                                    beforeVersion: versions[i + 1].version, afterVersion: v.isCurrent ? nil : v.version,
                                    trashed: note.trashedAt != nil))
            }
        }
        return Array(out.sorted { $0.at > $1.at }.prefix(limit))
    }
}

/// A day's changes, newest first.
struct AIChangeDay: Identifiable, Equatable {
    var title: String
    var day: Date
    var changes: [AIChange]
    var id: Date { day }
}

/// What an edit did to a note's text, line by line, for reading: the text after it with the
/// lines it took out put back where they were, so nothing it changed is hidden.
struct EditDiff: Equatable {
    /// The lines of both sides, in order.
    var text: String
    /// Lines it added or rewrote (UTF-16 ranges into `text`, without line breaks).
    var added: [NSRange]
    /// Lines it took out.
    var removed: [NSRange]

    var plus: Int { added.count }
    var minus: Int { removed.count }

    /// Two checklist lines the same but for their box: "- [ ] Hotel" and "- [x] Hotel".
    static func onlyTheTick(_ a: String, _ b: String) -> Bool {
        func split(_ s: String) -> (String, String, Bool)? {
            guard let r = s.range(of: #"^(\s*[-*+] )\[( |x|X)\]"#, options: .regularExpression) else { return nil }
            let head = String(s[r]), box = head.dropLast().last.map { $0 != " " } ?? false
            return (String(head.prefix { $0 != "[" }), String(s[r.upperBound...]), box)
        }
        guard let x = split(a), let y = split(b) else { return false }
        return x.0 == y.0 && x.1 == y.1 && x.2 != y.2
    }

    /// Blank lines are left out of both, as the history's tint leaves them out.
    /// `ticksAsOne` is for showing it: a tick is then the new line alone, marked as changed.
    static func between(_ before: String, _ after: String, ticksAsOne: Bool = false) -> EditDiff {
        let old = before.components(separatedBy: "\n"), new = after.components(separatedBy: "\n")
        var gone = IndexSet(), came = IndexSet()
        for change in new.difference(from: old) {
            switch change {
            case .remove(let offset, _, _): gone.insert(offset)
            case .insert(let offset, _, _): came.insert(offset)
            }
        }
        func blank(_ s: String) -> Bool { s.trimmingCharacters(in: .whitespaces).isEmpty }
        var lines: [(String, Int)] = [] // 0 same, 1 added, -1 removed
        var i = 0, j = 0
        while i < old.count || j < new.count {
            if i < old.count, gone.contains(i) {
                if !blank(old[i]) { lines.append((old[i], -1)) }
                i += 1
            } else if j < new.count, came.contains(j) {
                // A tick or an untick: one line that changed, not the old one taken out and a new
                // one added, both struck through (council round 16, a16-ai-undo).
                if ticksAsOne, let last = lines.last, last.1 == -1, Self.onlyTheTick(last.0, new[j]) { lines.removeLast() }
                lines.append((new[j], blank(new[j]) ? 0 : 1))
                j += 1
            } else {
                if j < new.count { lines.append((new[j], 0)) }
                i += 1
                j += 1
            }
        }
        var added: [NSRange] = [], removed: [NSRange] = []
        var location = 0
        for (line, mark) in lines {
            let length = (line as NSString).length
            if mark == 1 { added.append(NSRange(location: location, length: length)) }
            if mark == -1 { removed.append(NSRange(location: location, length: length)) }
            location += length + 1
        }
        return EditDiff(text: lines.map(\.0).joined(separator: "\n"), added: added, removed: removed)
    }
}

/// The words for a change, in the list and over its diff.
enum AIChangeCopy {
    static let title = "AI Changes"
    static let empty = "No AI changes yet. When an AI edits your notes, every change shows here."

    /// "+3 −1 lines", "Renamed to “Trip”", "Created", "Moved to Travel".
    static func summary(_ c: AIChange, before: String? = nil, after: String? = nil, folderName: (UUID) -> String? = { _ in nil }) -> String {
        switch c.kind {
        case .created: return "Created"
        case .deleted: return "Moved to Recently Deleted"
        case .restored: return "Brought back from Recently Deleted"
        case .moved:
            guard let to = c.toFolder else { return "Moved out of its folder" }
            return folderName(to).map { "Moved to \($0)" } ?? "Moved to another folder"
        case .edit, .restore:
            guard let before, let after else { return c.kind == .restore ? "Restored an earlier version" : "Edited" }
            let lead = c.kind == .restore ? "Restored an earlier version: " : ""
            if let title = renamed(before, after) { return lead + "Renamed to \u{201C}\(title)\u{201D}" }
            let d = EditDiff.between(before, after)
            return lead + (added(d) ?? words(d))
        }
    }

    /// "Added Burrata, Cherry tomatoes and Olive oil": up to three short lines added and nothing
    /// taken out, by name, so you see what changed without opening it (council round 5, 11-04).
    /// List and checklist items only, their markers left off; nil for anything else or bigger.
    static func added(_ d: EditDiff) -> String? {
        guard d.minus == 0, (1...3).contains(d.plus) else { return nil }
        let ns = d.text as NSString
        // List and checklist items only: a sentence read "Added For the weekend. and Sourdough".
        let marker = try! NSRegularExpression(pattern: #"^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)"#)
        var names: [String] = []
        for r in d.added {
            let line = ns.substring(with: r), all = NSRange(location: 0, length: (line as NSString).length)
            guard marker.firstMatch(in: line, range: all) != nil else { return nil }
            names.append(marker.stringByReplacingMatches(in: line, range: all, withTemplate: "").trimmingCharacters(in: .whitespaces))
        }
        guard names.allSatisfy({ !$0.isEmpty && $0.count <= 30 }), names.joined().count <= 60,
              names.count == 1 || !names.contains(where: { $0.contains(",") }) else { return nil }
        let list = names.count == 1 ? names[0] : names.dropLast().joined(separator: ", ") + " and " + names.last!
        return "Added \(list)"
    }

    /// A change in words, not a diff tool's "+1 −1 lines" (council round 8): one line swapped is
    /// named ("Changed “Tram 28” to “Tram 28 early”"), otherwise "Added 2 lines", "Removed 3 lines" or
    /// "Changed 5 lines". "No visible change" when only blank lines moved.
    static func words(_ d: EditDiff) -> String {
        guard d.plus + d.minus > 0 else { return "No visible change" }
        let count = { (n: Int) in n == 1 ? "a line" : "\(n) lines" }
        if d.plus == d.minus, d.plus >= 1, d.added.count == d.removed.count {
            // Same items, only their boxes changed: ticks, not a change of words (council rounds 9
            // and 10). "Ticked “Book flights”", or "Ticked “Book flights” and 2 more".
            let ns = d.text as NSString
            let ticks = zip(d.removed, d.added).map { ticked(was: ns.substring(with: $0), now: ns.substring(with: $1)) }
            if let first = ticks.first ?? nil, ticks.allSatisfy({ $0 != nil }),
               Set(ticks.map { $0!.hasPrefix("Ticked") }).count == 1 {
                return ticks.count == 1 ? first : first + " and \(ticks.count - 1) more"
            }
        }
        // One line: say which, the way the person reads it (round 18: "Removed a line" made you
        // open the change to find out). Whole: the list's rows end it in "…" where they run out of
        // room; the selected change shows it all (council round 10).
        let marker = try! NSRegularExpression(pattern: #"^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+|#+\s+|>\s*)"#)
        let words = { (r: NSRange) -> String in
            let line = (d.text as NSString).substring(with: r)
            return marker.stringByReplacingMatches(in: line, range: NSRange(location: 0, length: (line as NSString).length), withTemplate: "")
                .trimmingCharacters(in: .whitespacesAndNewlines)
        }
        // A few list items added and taken out: which (round 21: "Changed 2 lines" beside "3 edits").
        if d.plus >= 1, d.minus >= 1, d.plus + d.minus > 2, d.plus <= 3, d.minus <= 3 {
            let ns = d.text as NSString
            let item = try! NSRegularExpression(pattern: #"^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)"#)
            let isItem = { (r: NSRange) in
                let line = ns.substring(with: r)
                return item.firstMatch(in: line, range: NSRange(location: 0, length: (line as NSString).length)) != nil
            }
            if (d.added + d.removed).allSatisfy(isItem), Set(d.added.map(words)) != Set(d.removed.map(words)) {
                let list = { (names: [String]) in
                    names.count == 1 ? names[0] : names.dropLast().joined(separator: ", ") + " and " + names.last!
                }
                return "Added \(list(d.added.map(words))); removed \(list(d.removed.map(words)))"
            }
        }
        if d.plus == 1, d.minus == 1, let r = d.added.first {
            let now = words(r)
            let was = d.removed.first.map(words) ?? ""
            if !now.isEmpty {
                return was.isEmpty ? "Changed \u{201C}\(now)\u{201D}" : "Changed \u{201C}\(was)\u{201D} to \u{201C}\(now)\u{201D}"
            }
        }
        if d.plus == 0, d.minus == 1, let r = d.removed.first, !words(r).isEmpty { return "Removed \u{201C}\(words(r))\u{201D}" }
        if d.minus == 0 { return "Added \(count(d.plus))" }
        if d.plus == 0 { return "Removed \(count(d.minus))" }
        return "Changed \(count(max(d.plus, d.minus)))"
    }

    /// "Ticked “Hotel in Príncipe Real”" or "Unticked …" when a checklist item's box is all that
    /// changed; nil otherwise.
    static func ticked(was: String, now: String) -> String? {
        let box = try! NSRegularExpression(pattern: #"^(\s*[-*+]\s+)\[([ xX])\]\s+(.*)$"#)
        func parts(_ line: String) -> (done: Bool, text: String)? {
            let ns = line as NSString
            guard let m = box.firstMatch(in: line, range: NSRange(location: 0, length: ns.length)) else { return nil }
            return (ns.substring(with: m.range(at: 2)) != " ", ns.substring(with: m.range(at: 3)).trimmingCharacters(in: .whitespaces))
        }
        guard let a = parts(was), let b = parts(now), a.text == b.text, a.done != b.done, !b.text.isEmpty else { return nil }
        return "\(b.done ? "Ticked" : "Unticked") \u{201C}\(b.text)\u{201D}"
    }

    /// "+3 −1 lines", "+1 line", "−2 lines"; "No visible change" when only blank lines moved.
    static func lines(_ d: EditDiff) -> String {
        let total = d.plus + d.minus
        guard total > 0 else { return "No visible change" }
        var parts: [String] = []
        if d.plus > 0 { parts.append("+\(d.plus)") }
        if d.minus > 0 { parts.append("\u{2212}\(d.minus)") }
        let unit = total == 1 ? "line" : "lines"
        return parts.joined(separator: " ") + " " + unit
    }

    /// The new title when only the first line changed.
    static func renamed(_ before: String, _ after: String) -> String? {
        let a = before.components(separatedBy: "\n"), b = after.components(separatedBy: "\n")
        guard let first = b.first, a.first != first, Array(a.dropFirst()) == Array(b.dropFirst()) else { return nil }
        let title = first.replacing(/^#+\s*/, with: "").trimmingCharacters(in: .whitespaces)
        return title.isEmpty ? nil : title
    }

    /// How far apart an AI's edits can be and still be one session.
    static let sessionGap: TimeInterval = 10 * 60

    /// An AI's edits to a note one straight after another, nothing between them, are one change: one
    /// row, one diff, one Undo, as they were one request (round 20: three unrelated-looking rows,
    /// and undoing the last left the first two). Each edit stays in the note's version history.
    /// Newest first in, newest first out.
    static func sessions(_ changes: [AIChange]) -> [AIChange] {
        var out: [AIChange] = []
        for c in changes {
            if var newer = out.last, newer.kind == .edit, c.kind == .edit, newer.noteID == c.noteID, newer.ai == c.ai,
               let joint = newer.beforeVersion, joint == c.afterVersion,
               (newer.startedAt ?? newer.at).timeIntervalSince(c.at) <= sessionGap {
                newer.beforeVersion = c.beforeVersion
                newer.edits += 1
                newer.startedAt = c.at
                out[out.count - 1] = newer
            } else {
                out.append(c)
            }
        }
        return out
    }

    static func days(_ changes: [AIChange], now: Date = .now, calendar: Calendar = .current) -> [AIChangeDay] {
        var out: [AIChangeDay] = []
        for c in changes {
            let day = calendar.startOfDay(for: c.at)
            if out.last?.day == day { out[out.count - 1].changes.append(c); continue }
            out.append(AIChangeDay(title: HistoryGrouping.title(for: day, now: now, calendar: calendar), day: day, changes: [c]))
        }
        return out
    }
}

// MARK: Undo

enum AIChangeUndoError: LocalizedError, Equatable {
    /// You've changed the same lines since: only restoring the version from before it would undo it.
    case editedSince
    case cantUndo(String)

    var errorDescription: String? {
        switch self {
        case .editedSince: "You've changed those lines since this change."
        case .cantUndo(let why): why
        }
    }
}

@MainActor
enum AIChangeUndo {
    /// Why Undo is off, in a few words with what to do; nil when it isn't. Undone shows "Undone"
    /// on its own (council round 10: it greyed out silently).
    static func reason(_ c: AIChange, note: Note?, undone: Bool, context: ModelContext) -> String? {
        undone ? nil : blocked(c, note: note, context: context)
    }

    /// Whether this change can be taken back from here.
    static func possible(_ c: AIChange, note: Note?, context: ModelContext) -> Bool {
        blocked(c, note: note, context: context) == nil
    }

    /// The one place that decides, so every greyed Undo has its words (council round 11: a note
    /// moved again, or a gone folder, greyed it with nothing said).
    static func blocked(_ c: AIChange, note: Note?, context: ModelContext) -> String? {
        guard let note, note.deletedAt == nil else { return "This note isn\u{2019}t on this Mac." }
        if note.isLocked { return "Unlock this note to undo." }
        switch c.kind {
        case .edit, .restore:
            if note.isTrashed { return "Recover the note to undo." }
            return c.beforeVersion == nil ? "No earlier version to go back to." : nil
        case .created, .restored:
            return note.isTrashed ? "Already in Recently Deleted." : nil
        case .deleted:
            return note.isTrashed ? nil : "Already back from Recently Deleted."
        case .moved:
            if note.isTrashed { return "Recover the note to undo." }
            guard note.folder?.id == c.toFolder else { return "Moved again since." }
            guard let from = c.fromFolder, let folder = context.folder(from), folder.deletedAt == nil else {
                return "Its old folder is gone."
            }
            return nil
        }
    }

    /// Takes `c` back out. For an edit, as Undo on a note does (AIEdit.undo): when the note still
    /// reads as the AI left it, the version from before it is restored, so the AI's text stays in
    /// the history; when you've changed it since, only the AI's change is taken out and your edits
    /// stay. If your edits touched the same lines, it throws `editedSince` unless `anyway`, which
    /// restores the version from before it as a new version (your edits stay in the history).
    static func undo(_ c: AIChange, note: Note, before: String?, after: String?, history: NoteHistory, anyway: Bool = false) async throws {
        guard let context = note.modelContext else { throw AIChangeUndoError.cantUndo("This note isn't on this device.") }
        switch c.kind {
        case .created, .restored:
            context.trash(note)
        case .deleted:
            context.restore(note)
        case .moved:
            guard let from = c.fromFolder, let folder = context.folder(from), folder.deletedAt == nil else {
                throw AIChangeUndoError.cantUndo("The folder it was in is gone.")
            }
            context.move(note, to: folder)
        case .edit, .restore:
            guard let version = c.beforeVersion, let before, let after else { throw AIChangeUndoError.cantUndo("That version is no longer kept.") }
            DebouncedSave.flushAll()
            if anyway || (!note.dirty && note.body == after) {
                try await history.restore(noteID: note.id, toVersion: version)
                return
            }
            guard let undone = AIEdit.revert(before, after, in: note.body) else { throw AIChangeUndoError.editedSince }
            guard undone != note.body else { return }
            note.body = undone
            note.touch()
            try? context.save()
            NotificationCenter.default.post(name: NoteHistory.restored, object: note.id)
        }
    }
}

private extension Note {
    var isTrashed: Bool { trashedAt != nil }
}

// MARK: The list

/// Every AI change across your notes: the list, the one selected and its diff, and Undo.
@MainActor
@Observable
final class AIChangesModel {
    enum Phase: Equatable { case loading, loaded, failed(String) }

    private(set) var phase: Phase = .loading
    /// What's listed: `loaded`, an AI's edits in a row as one.
    private(set) var changes: [AIChange] = []
    /// Every change read so far, one by one, for paging.
    private var loaded: [AIChange] = []
    private(set) var days: [AIChangeDay] = []
    private(set) var hasMore = false
    /// The next page failed to load; the list ends on a row that says so with Try Again
    /// (council round 6: it used to stop silently, as if there were nothing older).
    private(set) var olderFailed = false
    /// Only this AI's changes; nil for every AI's.
    private(set) var filter: String?
    /// The AIs to filter by: the connections' names and any in the list.
    private(set) var ais: [String]
    var selection: AIChange.ID?
    /// The selected change's texts and diff.
    private(set) var diff: EditDiff?
    private(set) var detailFailed: String?
    /// Summaries worked out so far, by change.
    private(set) var summaries: [AIChange.ID: String] = [:]
    private(set) var undone: Set<AIChange.ID> = []
    private(set) var undoing = false
    var undoError: String?
    /// Your edits touched the same lines: asks before restoring the version from before it.
    var conflict: AIChange?

    let store: AIChangesStore
    let history: NoteHistory
    let context: ModelContext
    private let now: () -> Date
    private var texts: [AIChange.ID: (before: String?, after: String)] = [:]
    static let page = 50

    init(store: AIChangesStore, history: NoteHistory, filter: String? = nil, connected: [String] = [], now: @escaping () -> Date = { .now }) {
        self.store = store
        self.history = history
        self.context = history.context
        self.filter = filter
        self.now = now
        ais = Array(Set(connected + [filter].compactMap { $0 })).sorted()
    }

    var selected: AIChange? { changes.first { $0.id == selection } }
    func note(_ c: AIChange) -> Note? { context.note(c.noteID) }
    func title(_ c: AIChange) -> String { note(c).map { $0.isLocked ? "Locked note" : $0.title } ?? "A note not on this device" }
    /// Why Undo is off for this change; nil while it's on or the reason is only that it's busy.
    func undoReason(_ c: AIChange) -> String? {
        AIChangeUndo.reason(c, note: note(c), undone: undone.contains(c.id), context: context)
    }
    func canUndo(_ c: AIChange) -> Bool { !undone.contains(c.id) && AIChangeUndo.possible(c, note: note(c), context: context) }

    func summary(_ c: AIChange) -> String {
        summaries[c.id] ?? AIChangeCopy.summary(c, folderName: folderName)
    }

    private func folderName(_ id: UUID) -> String? { context.folder(id).flatMap { $0.deletedAt == nil ? $0.name : nil } }

    func load() async {
        phase = .loading
        do {
            let page = try await store.changes(before: nil, limit: Self.page, ai: filter)
            loaded = page
            changes = AIChangeCopy.sessions(page)
            olderFailed = false
            hasMore = page.count == Self.page
            regroup()
            phase = .loaded
            if selection == nil || selected == nil, let first = changes.first { await select(first.id) }
        } catch {
            phase = .failed(HistoryError.from(error).aiChangesDescription)
        }
    }

    func loadMore() async {
        guard hasMore, !olderFailed, let last = loaded.last else { return }
        do {
            let page = try await store.changes(before: last.at, limit: Self.page, ai: filter)
            let seen = Set(loaded.map(\.id))
            loaded += page.filter { !seen.contains($0.id) }
            // The page may carry on the last session, which then starts earlier than it worked out.
            if let open = changes.last {
                texts[open.id] = nil
                summaries[open.id] = nil
            }
            changes = AIChangeCopy.sessions(loaded)
            hasMore = page.count == Self.page
            regroup()
        } catch {
            olderFailed = true
        }
    }

    /// Try Again: the spinner comes back in the row's place and its own task loads the page, so
    /// this only clears the failure (it loaded too, and two loads of one page raced, round 7).
    func retryOlder() {
        olderFailed = false
    }

    func setFilter(_ ai: String?) async {
        guard ai != filter else { return }
        filter = ai
        selection = nil
        diff = nil
        await load()
    }

    private func regroup() {
        days = AIChangeCopy.days(changes, now: now())
        ais = Array(Set(ais + changes.map(\.ai))).sorted()
    }

    func select(_ id: AIChange.ID?) async {
        selection = id
        diff = nil
        detailFailed = nil
        guard let c = selected else { return }
        do {
            let (before, after) = try await texts(for: c)
            guard selection == id else { return }
            diff = EditDiff.between(before ?? "", after, ticksAsOne: true)
        } catch {
            guard selection == id else { return }
            detailFailed = HistoryError.from(error).aiChangesDescription
        }
    }

    /// Works out a row's "+3 −1 lines" once it's on screen.
    func summarize(_ c: AIChange) async {
        guard c.kind == .edit || c.kind == .restore, summaries[c.id] == nil,
              let (before, after) = try? await texts(for: c) else { return }
        summaries[c.id] = AIChangeCopy.summary(c, before: before, after: after, folderName: folderName)
    }

    /// The text before the change (nil for a note it made) and after it.
    func texts(for c: AIChange) async throws -> (before: String?, after: String) {
        if let t = texts[c.id] { return t }
        guard let note = note(c) else { throw HistoryError.gone }
        guard c.changesText else { return (nil, note.body) }
        let after = try await text(of: note, c.afterVersion)
        let before = c.kind == .created ? nil : try await text(of: note, c.beforeVersion)
        texts[c.id] = (before, after)
        return (before, after)
    }

    private func text(of note: Note, _ version: Int64?) async throws -> String {
        guard let version else { return note.body }
        return try await history.store.body(of: note.id, version: version)
    }

    /// Undoes `c`. With `anyway`, after you've said yes to restoring over your own later edits.
    func undo(_ c: AIChange, anyway: Bool = false) async {
        guard let note = note(c), !undoing else { return }
        undoing = true
        defer { undoing = false }
        do {
            let edit = c.kind == .edit || c.kind == .restore
            let t = edit ? try await texts(for: c) : (before: nil, after: note.body)
            try await AIChangeUndo.undo(c, note: note, before: t.before, after: t.after, history: history, anyway: anyway)
            undone.insert(c.id)
        } catch AIChangeUndoError.editedSince {
            conflict = c
        } catch let e as AIChangeUndoError {
            undoError = e.localizedDescription
        } catch {
            undoError = HistoryError.from(error).localizedDescription
        }
    }

    /// "Today at 14:02".
    static func when(_ d: Date, now: Date = .now) -> String { "\(HistoryGrouping.title(for: d, now: now)) at \(VersionHistoryModel.time(d))" }
}

/// Where the app's AI changes come from, set up at launch beside NoteHistory.shared, and the
/// request to show them (View › AI Changes, Settings, an AI's receipt).
@MainActor
@Observable
final class AIChangesCenter {
    static let shared = AIChangesCenter()
    @ObservationIgnored var store: AIChangesStore?
    /// Set to open AI Changes; the AI to filter by, or "" for all.
    var request: String?

    func show(ai: String? = nil) { request = ai ?? "" }
}
