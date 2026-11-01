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

    /// Blank lines are left out of both, as the history's tint leaves them out.
    static func between(_ before: String, _ after: String) -> EditDiff {
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
            return lead + lines(EditDiff.between(before, after))
        }
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
    /// Whether this change can be taken back from here.
    static func possible(_ c: AIChange, note: Note?, context: ModelContext) -> Bool {
        guard let note, note.deletedAt == nil, !note.isLocked else { return false }
        switch c.kind {
        case .edit, .restore: return c.beforeVersion != nil && !note.isTrashed
        case .created, .restored: return !note.isTrashed
        case .deleted: return note.isTrashed
        case .moved:
            guard !note.isTrashed, note.folder?.id == c.toFolder, let from = c.fromFolder else { return false }
            return context.folder(from).map { $0.deletedAt == nil } ?? false
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
    private(set) var changes: [AIChange] = []
    private(set) var days: [AIChangeDay] = []
    private(set) var hasMore = false
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
    func canUndo(_ c: AIChange) -> Bool { !undone.contains(c.id) && AIChangeUndo.possible(c, note: note(c), context: context) }

    func summary(_ c: AIChange) -> String {
        summaries[c.id] ?? AIChangeCopy.summary(c, folderName: folderName)
    }

    private func folderName(_ id: UUID) -> String? { context.folder(id).flatMap { $0.deletedAt == nil ? $0.name : nil } }

    func load() async {
        phase = .loading
        do {
            let page = try await store.changes(before: nil, limit: Self.page, ai: filter)
            changes = page
            hasMore = page.count == Self.page
            regroup()
            phase = .loaded
            if selection == nil || selected == nil, let first = changes.first { await select(first.id) }
        } catch {
            phase = .failed(HistoryError.from(error).localizedDescription)
        }
    }

    func loadMore() async {
        guard hasMore, let last = changes.last else { return }
        do {
            let page = try await store.changes(before: last.at, limit: Self.page, ai: filter)
            let seen = Set(changes.map(\.id))
            changes += page.filter { !seen.contains($0.id) }
            hasMore = page.count == Self.page
            regroup()
        } catch {
            hasMore = false
        }
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
            diff = EditDiff.between(before ?? "", after)
        } catch {
            guard selection == id else { return }
            detailFailed = HistoryError.from(error).localizedDescription
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
