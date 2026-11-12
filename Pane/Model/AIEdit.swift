import Foundation
import Observation

/// An AI's edit arriving on a note, and whether you've seen it yet.
///
/// The server names the AI that last changed a note (`ai_editor`, `ai_edited_at`). When a newer
/// AI edit arrives, this device keeps the text from before it, so the open note can tint what
/// changed and offer Undo, and the list can mark the note until you open it.
@MainActor
enum AIEdit {
    /// Call after a server row was applied to `note`. `previousBody`, `previousVersion` and
    /// `previousEditAt` are what the note held before (nil for a note this device didn't have).
    /// `quiet`: the first sync of a library, where old AI edits are history, not news.
    static func arrived(_ note: Note, previousBody: String?, previousVersion: Int64? = nil, previousEditAt: Date?, quiet: Bool) {
        guard let at = note.aiEditedAt, note.aiEditor != nil, at > (previousEditAt ?? .distantPast) else { return }
        if quiet || previousBody == note.body {
            note.aiSeenAt = at
            return
        }
        // Several edits before you look: compare against the text before the first of them.
        if note.aiPrevious == nil {
            note.aiPrevious = previousBody ?? ""
            AIEditStore.shared[note.id].previousVersion = previousVersion
            // A note this device didn't have: the AI wrote it.
            AIEditStore.shared[note.id].created = previousBody == nil
        }
    }

    /// An AI changed the note and you haven't opened it since.
    static func isUnseen(_ note: Note) -> Bool {
        guard note.aiEditor != nil, let at = note.aiEditedAt else { return false }
        return note.aiSeenAt.map { $0 < at } ?? true
    }

    /// The unseen AI change is a whole note it wrote.
    static func wroteIt(_ note: Note) -> Bool { AIEditStore.shared[note.id].created ?? false }

    /// The list row's line, in place of the note's preview, until you open it. Someone else's AI
    /// is named with them (a shared note): "Edited by Sara's Claude".
    static func listLine(_ note: Note, by ai: String) -> String {
        let who = whose(ai, person: note.aiEditorPerson)
        return wroteIt(note) ? "Written by \(who)" : "Edited by \(who)"
    }

    /// An AI as a note names it: "Claude", or "Sara's Claude" when it's someone else's.
    nonisolated static func whose(_ ai: String, person: String?) -> String { person.map { "\($0)'s \(ai)" } ?? ai }

    /// Who an AI's change is from when the note doesn't know their name yet.
    static let someone = "Someone"

    /// An AI's change to a shared note, as it reached this device (SharedLibrary.aiChanged): marked
    /// as an AI's edit of a note of your own is, from the text before it. `person`: whose AI it is
    /// when it isn't yours (their first name).
    static func arrived(_ note: Note, ai: String, person: String?, previousBody: String, at: Date = .now) {
        let previousAt = note.aiEditedAt
        note.aiEditor = ai
        note.aiEditorPerson = person
        note.aiEditedAt = at
        arrived(note, previousBody: previousBody, previousEditAt: previousAt, quiet: false)
    }

    /// An edit in words, when it's one plain thing: "ticked “Eggs”", "removed “Lemons”", "added
    /// “Saffron”", "added a row to the table". Nil for anything else ("changed 3 lines" then).
    nonisolated static func describe(previous: String, after: String) -> String? {
        let a = previous.components(separatedBy: "\n"), b = after.components(separatedBy: "\n")
        let blank = { (l: String) in l.trimmingCharacters(in: .whitespaces).isEmpty }
        var removed: [String] = [], added: [String] = []
        for change in b.difference(from: a).inferringMoves() {
            switch change {
            case .remove(_, let l, let moved): if moved == nil, !blank(l) { removed.append(l) }
            case .insert(_, let l, let moved): if moved == nil, !blank(l) { added.append(l) }
            }
        }
        func untick(_ l: String) -> String { l.replacingOccurrences(of: "[x]", with: "[ ]").replacingOccurrences(of: "[X]", with: "[ ]") }
        func words(_ l: String) -> String {
            var t = l
            if let p = ListPrefix(line: t) { t = (t as NSString).substring(from: p.length) }
            t = t.trimmingCharacters(in: CharacterSet(charactersIn: "#*_`= "))
            return t.count > 28 ? String(t.prefix(27)).trimmingCharacters(in: .whitespaces) + "…" : t
        }
        if !added.isEmpty, removed.count == added.count, zip(removed, added).allSatisfy({ untick($0) == untick($1) && $0 != $1 }) {
            let ticked = added.allSatisfy { $0.contains("[x]") || $0.contains("[X]") }
            let unticked = added.allSatisfy { $0.contains("[ ]") }
            guard ticked || unticked else { return nil }
            let verb = ticked ? "ticked" : "unticked"
            return added.count == 1 ? "\(verb) \u{201C}\(words(added[0]))\u{201D}" : "\(verb) \(added.count) items"
        }
        if added.isEmpty, !removed.isEmpty {
            return removed.count == 1 ? "removed \u{201C}\(words(removed[0]))\u{201D}" : "removed \(removed.count) lines"
        }
        if removed.isEmpty, added.count == 1 {
            if added[0].trimmingCharacters(in: .whitespaces).hasPrefix("|") { return "added a row to the table" }
            return "added \u{201C}\(words(added[0]))\u{201D}"
        }
        if removed.isEmpty, added.count > 1, !added.contains(where: { $0.trimmingCharacters(in: .whitespaces).hasPrefix("|") }) {
            return "added \(added.count) lines"
        }
        return nil
    }

    /// You've opened it: the list marker goes. Returns what the receipt and tint need, once.
    static func markSeen(_ note: Note) -> Receipt? {
        guard isUnseen(note), let by = note.aiEditor, let at = note.aiEditedAt else { return nil }
        let previous = note.aiPrevious, version = AIEditStore.shared[note.id].previousVersion
        let created = AIEditStore.shared[note.id].created ?? false
        note.aiSeenAt = at
        note.aiPrevious = nil
        AIEditStore.shared[note.id].previousVersion = nil
        AIEditStore.shared[note.id].created = nil
        guard let previous, previous != note.body else { return nil }
        return Receipt(noteID: note.id, by: by, at: at, previous: previous, after: note.body, previousVersion: version,
                       lines: AIReview.lineCount(previous: previous, after: note.body), created: created, person: note.aiEditorPerson)
    }

    /// Puts the note back the way it was before the AI's edit. With version history, it restores
    /// the version from before the edit, so the AI's text is kept as a version of its own. Without
    /// it (signed out, or an edit this device had no version for), the old text goes up as your edit.
    /// If you've typed since the edit landed, only the AI's change is taken out and your typing
    /// stays; when your typing touched the same lines, nothing changes and Undo says why.
    static func undo(_ receipt: Receipt, on note: Note, library: SharedLibrary? = CollabStore.shared?.library) async throws {
        guard note.id == receipt.noteID else { return }
        // A note the AI wrote goes to Recently Deleted, where you can still get it back.
        if receipt.created {
            note.modelContext?.trash(note)
            return
        }
        // A shared note's text is its document's: the AI's change comes out of it as your edit, for
        // everyone in the note (NoteWrites), and is refused for Can view.
        if note.isShared {
            switch try NoteWrites.change(note, library: library, { try undone(receipt, in: $0) }) {
            case .changed, .unchanged: return
            case .viewOnly: throw UndoError.viewOnly
            case .notReady: throw UndoError.notReady
            }
        }
        // Typing that isn't in the note yet counts as typed since the edit.
        DebouncedSave.flushAll()
        let untouched = receipt.after == nil || note.body == receipt.after
        if untouched, let version = receipt.previousVersion, version > 0, NoteHistory.shared?.sync != nil {
            try await NoteHistory.restore(noteID: note.id, toVersion: version)
            return
        }
        let restored: String
        if untouched {
            restored = receipt.previous
        } else if let after = receipt.after, let undone = revert(receipt.previous, after, in: note.body) {
            restored = undone
        } else {
            throw UndoError.editedSince
        }
        guard restored != note.body else { return }
        note.body = restored
        note.touch()
    }

    /// `current` without the AI's change: the text from before it when nothing changed since,
    /// otherwise only its change taken out. Throws when your edits touched the lines it changed.
    static func undone(_ receipt: Receipt, in current: String) throws -> String {
        if receipt.after == nil || current == receipt.after { return receipt.previous }
        guard let after = receipt.after, let undone = revert(receipt.previous, after, in: current) else { throw UndoError.editedSince }
        return undone
    }

    enum UndoError: LocalizedError {
        case editedSince
        /// A shared note you can only view.
        case viewOnly
        /// A shared note whose document isn't open on this device.
        case notReady
        var errorDescription: String? {
            switch self {
            case .editedSince: "Couldn't undo. You've changed those lines since."
            case .viewOnly: NoteWrites.viewOnlyMessage
            case .notReady: NoteWrites.notReadyMessage
            }
        }
    }

    /// Takes the change from `before` to `after` back out of `current`, which is `after` with
    /// your own edits on top. Nil when your edits touched the lines that change did.
    static func revert(_ before: String, _ after: String, in current: String) -> String? {
        TextDiff.merge(base: after, mine: current, theirs: before)
    }

    struct Receipt: Equatable {
        var noteID: UUID
        var by: String
        var at: Date
        /// The note before the edit, and its version on the server, for Undo.
        var previous: String
        /// The note right after the edit, to tell whether you've changed it since.
        var after: String? = nil
        var previousVersion: Int64? = nil
        /// How many lines it added or changed.
        var lines: Int
        /// The AI wrote the whole note.
        var created = false
        /// Note pages (prototype): an edit made on the note's page, or a page an AI made.
        var kind: Kind = .edit
        /// Whose AI it was, when it isn't yours: their first name (an AI's change to a shared note).
        /// `by` stays the AI's own name, for its mark.
        var person: String? = nil
        /// How many of the AI's edits this is, in a row. They can come to fewer lines than edits.
        var edits = 1

        enum Kind: Equatable { case edit, pageEdit, dataEdit, pageMade, pageChanged, reverted, heldBack }

        /// The note is back to what it was before the edit: undone here or, on a shared note, by
        /// someone else. There's nothing left for the receipt to speak of (persona council r7).
        func isUndone(in body: String) -> Bool {
            kind == .edit && !created && body.trimmingCharacters(in: .whitespacesAndNewlines) == previous.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        /// On a shared note someone can undo part of the edit: the receipt speaks of what's left of
        /// it. Nil when every part is still there, or none is (`isUndone`).
        func withPartsUndone(in body: String) -> Receipt? {
            guard var review = AIReview(self), var text = after else { return nil }
            let now = Set(AIReview.lines(body))
            var undone = 0
            for part in review.parts {
                let gone = part.added.isEmpty || !part.added.allSatisfy(now.contains)
                guard gone, part.removed.allSatisfy(now.contains), let back = try? review.undo(part.id, in: text) else { continue }
                text = back
                undone += 1
            }
            guard undone > 0, text != previous else { return nil }
            var left = self
            left.after = text
            left.lines = AIReview.lineCount(previous: previous, after: text)
            return left
        }

        /// Said where the receipt was when that happens elsewhere, so the line going back doesn't
        /// read as sync losing a change (persona council r7).
        var undoneLine: String { "\(who)\u{2019}s change was undone" }

        /// The same when only part of it was undone elsewhere.
        var partlyUndoneLine: String { "One of \(who)\u{2019}s changes was undone" }

        /// The same, saying who did it, when that's known: the one other person in a shared note.
        func undoneLine(by person: String?) -> String {
            guard let person else { return undoneLine }
            return "\(person) undid \(whoAfter(person))\u{2019}s change"
        }

        func partlyUndoneLine(by person: String?) -> String {
            guard let person else { return partlyUndoneLine }
            return "\(person) undid one of \(whoAfter(person))\u{2019}s changes"
        }

        /// "Sara undid one of Claude's changes", not "of Sara's Claude's".
        private func whoAfter(_ person: String) -> String {
            for own in ["\(person)\u{2019}s ", "\(person)'s "] where who.hasPrefix(own) { return String(who.dropFirst(own.count)) }
            return who
        }

        /// One AI's edits in a row are one change: an AI that makes three edits has "made 3 edits",
        /// all marked, and Undo takes all three back (round 17: it said 1 line, the last one).
        /// `earlier`: the receipt still on the note, if any. Typing between them keeps them apart.
        func continuing(_ earlier: Receipt?) -> Receipt {
            guard let earlier, earlier.noteID == noteID, earlier.by == by, earlier.person == person,
                  earlier.kind == .edit, kind == .edit, !earlier.created, !created, earlier.after == previous,
                  abs(at.timeIntervalSince(earlier.at)) < Self.sameChangeWindow, let after else { return self }
            var both = self
            both.previous = earlier.previous
            both.previousVersion = earlier.previousVersion
            both.lines = AIReview.lineCount(previous: earlier.previous, after: after)
            both.edits = earlier.edits + 1
            return both
        }

        /// How far apart two edits can be and still be one change, in seconds.
        static let sameChangeWindow: TimeInterval = 60

        /// The AI as the receipt names it: "Claude", or "Sara's Claude".
        var who: String { AIEdit.whose(by, person: person) }

        var summary: String {
            if kind == .reverted { return "Reverted to the last working version" }
            if kind == .heldBack { return "\(who)'s new version didn't pass its checks: kept the working one" }
            if kind == .dataEdit, by != AIGlyph.page { return "\(who) changed this app's data" }
            if kind == .pageEdit || kind == .dataEdit { return "Changed in the app" }
            if kind == .pageMade { return "\(who) made this note an app" }
            if kind == .pageChanged { return "\(who) changed this note's app" }
            if created { return "\(who) wrote this note" }
            if edits > 1 { return "\(who) made \(edits) changes" }
            // What it did, when that's one plain thing: "ChatGPT ticked “Eggs”", "removed “Lemons”".
            if kind == .edit, let after, let what = AIEdit.describe(previous: previous, after: after) { return "\(who) \(what)" }
            return lines == 0 ? "Updated by \(who)" : "\(who) changed \(lines == 1 ? "1 line" : "\(lines) lines")"
        }

        /// An AI's edit of the note's text stays marked (the tint, and Undo) until you start
        /// typing, undo it or leave the note, however long you read. The others are moments in a
        /// note's app, and go on their own.
        var staysUntilEdited: Bool { kind == .edit }

        /// For VoiceOver on the Undo button, which shows only "Undo".
        var undoLabel: String { created ? "Undo, removes the note \(who) wrote" : "Undo \(who)'s changes" }

        /// For the navigation bar over a note's app, where there's room for a word or two.
        var shortSummary: String {
            switch kind {
            case .reverted: "Reverted"
            case .heldBack: "Kept the working one"
            case .dataEdit where by != AIGlyph.page: "\(who) changed it"
            case .pageEdit, .dataEdit: "Changed"
            case .pageMade: "\(who) made it"
            case .pageChanged: "\(who) updated it"
            case .edit: created ? "\(who) wrote it" : "\(who) edited"
            }
        }
    }
}

/// What this device knows about AI edits, per note: the AI and time the server reported, the
/// edit you've seen, and the text from before one you haven't (for the tint and Undo).
///
/// Kept beside the library in its own file, not in the SwiftData model, so builds with and
/// without it open the same store.
@MainActor
@Observable
final class AIEditStore {
    struct Entry: Codable, Equatable {
        var editor: String?
        var editedAt: Date?
        var seenAt: Date?
        var previous: String?
        var previousVersion: Int64?
        var created: Bool?
        /// Whose AI made the last change, when it isn't yours: their first name (a shared note,
        /// "Sara's Claude"). Goes whenever the AI is set again (`Note.aiEditor`).
        var person: String?
    }

    static let shared = AIEditStore(file: PaneApp.isUnitTestHost || ProcessInfo.processInfo.arguments.contains("-uitest") ? nil : defaultFile)

    private(set) var entries: [UUID: Entry] = [:]
    @ObservationIgnored private let file: URL?
    @ObservationIgnored private var saving: Task<Void, Never>?

    /// `file` nil keeps everything in memory (tests, captures).
    init(file: URL?) {
        self.file = file
        if let file, let data = try? Data(contentsOf: file), let saved = try? JSONDecoder().decode([UUID: Entry].self, from: data) {
            entries = saved
        }
    }

    static var defaultFile: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appending(path: "\(AppIdentity.dataFolder)/ai-edits.json")
    }

    subscript(id: UUID) -> Entry {
        get { entries[id] ?? Entry() }
        set {
            guard entries[id] != newValue else { return }
            entries[id] = newValue == Entry() ? nil : newValue
            save()
        }
    }

    /// Another account signed in, or this one was deleted.
    func forgetAll() {
        entries = [:]
        saving?.cancel()
        if let file { try? FileManager.default.removeItem(at: file) }
    }

    /// Written a moment after the last change, off the main thread.
    private func save() {
        guard let file else { return }
        saving?.cancel()
        let snapshot = entries
        saving = Task.detached(priority: .utility) {
            try? await Task.sleep(for: .milliseconds(300))
            guard !Task.isCancelled, let data = try? JSONEncoder().encode(snapshot) else { return }
            try? FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
            try? data.write(to: file, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        }
    }
}

extension Note {
    /// The connected AI that last changed this note, and when (from the server, or for a shared
    /// note from the change itself). Setting it forgets whose AI the last one was (`aiEditorPerson`).
    @MainActor var aiEditor: String? {
        get { AIEditStore.shared[id].editor }
        set {
            var entry = AIEditStore.shared[id]
            entry.editor = newValue
            entry.person = nil
            AIEditStore.shared[id] = entry
        }
    }
    /// Whose AI it was, when it isn't yours: their first name (a shared note). Set after `aiEditor`.
    @MainActor var aiEditorPerson: String? {
        get { AIEditStore.shared[id].person }
        set { AIEditStore.shared[id].person = newValue }
    }
    @MainActor var aiEditedAt: Date? {
        get { AIEditStore.shared[id].editedAt }
        set { AIEditStore.shared[id].editedAt = newValue }
    }
    /// This device only: the AI edit you've already seen.
    @MainActor var aiSeenAt: Date? {
        get { AIEditStore.shared[id].seenAt }
        set { AIEditStore.shared[id].seenAt = newValue }
    }
    /// This device only: the text from before an AI edit you haven't seen yet.
    @MainActor var aiPrevious: String? {
        get { AIEditStore.shared[id].previous }
        set { AIEditStore.shared[id].previous = newValue }
    }
}
