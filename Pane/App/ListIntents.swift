import AppIntents
import SwiftData

// Siri and Shortcuts for checklists (2026-11-04): "Add to Groceries in Pinto Notes" asks what to
// add and adds it unticked (a spoken phrase can name a note, not free text), "Tick an item in
// Pinto Notes" ticks one, and Find Notes searches. Add to Note (NoteIntents) still adds plain
// text. Each says what it did, and the Home Screen widget redraws.

struct AddToListIntent: AppIntent {
    static let title: LocalizedStringResource = "Add to List"
    static let description = IntentDescription("Adds an unticked item to a checklist note, under its other open items. Each line is one item.")

    @Parameter(title: "Item", requestValueDialog: "What should I add?") var item: String
    @Parameter(title: "Note", requestValueDialog: "Which note?") var note: NoteEntity

    static var parameterSummary: some ParameterSummary { Summary("Add \(\.$item) to \(\.$note)") }

    init() {}

    init(item: String, note: NoteEntity) {
        self.item = item
        self.note = note
    }

    @MainActor func perform() async throws -> some IntentResult & ReturnsValue<NoteEntity> & ProvidesDialog {
        let n = try NoteIntents.editable(note.id)
        guard try await NoteIntents.save(n, { Checklist.adding(item, to: $0) }) else { throw NoteIntentError.other("Say what to add.") }
        let words = item.components(separatedBy: .newlines).map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        return .result(value: NoteEntity(n), dialog: IntentDialog(stringLiteral: QuickWords.added(words.joined(separator: ", "), to: n.title)))
    }
}

struct TickItemIntent: AppIntent {
    static let title: LocalizedStringResource = "Tick Item"
    static let description = IntentDescription("Ticks an item in a checklist note, found by its words. Like a tick in the note, it moves below the open items.")

    @Parameter(title: "Item", requestValueDialog: "Which item?") var item: String
    @Parameter(title: "Note", requestValueDialog: "Which note?") var note: NoteEntity

    static var parameterSummary: some ParameterSummary { Summary("Tick \(\.$item) in \(\.$note)") }

    init() {}

    init(item: String, note: NoteEntity) {
        self.item = item
        self.note = note
    }

    @MainActor func perform() async throws -> some IntentResult & ReturnsValue<NoteEntity> & ProvidesDialog {
        let n = try NoteIntents.editable(note.id)
        guard let match = Checklist.match(item, in: n.body) else { throw NoteIntentError.other(QuickWords.noItem(item, in: n.title)) }
        guard !match.done else { return .result(value: NoteEntity(n), dialog: IntentDialog(stringLiteral: QuickWords.unticked(match.text, in: n.title))) }
        try await NoteIntents.save(n) { Checklist.setting(true, index: match.index, text: match.text, in: $0) ?? $0 }
        return .result(value: NoteEntity(n), dialog: IntentDialog(stringLiteral: QuickWords.ticked(match.text, in: n.title)))
    }
}

struct FindNotesIntent: AppIntent {
    static let title: LocalizedStringResource = "Find Notes"
    static let description = IntentDescription("Finds notes with these words in their title or text, newest first. Locked notes aren't searched.")

    @Parameter(title: "Words", requestValueDialog: "What should I look for?") var query: String

    static var parameterSummary: some ParameterSummary { Summary("Find notes with \(\.$query)") }

    init() {}

    init(query: String) { self.query = query }

    @MainActor func perform() async throws -> some IntentResult & ReturnsValue<[NoteEntity]> & ProvidesDialog {
        let found = NoteIntents.search(query)
        let titles = found.prefix(3).map(\.title).joined(separator: ", ")
        let said = QuickWords.found(found.count) + (titles.isEmpty ? "" : " \(titles)\(found.count > 3 ? "…" : ".")")
        return .result(value: found.map(NoteEntity.init), dialog: IntentDialog(stringLiteral: said))
    }
}

extension NoteIntents {
    /// A note an intent may change: here, not deleted, not locked.
    static func editable(_ id: UUID) throws -> Note {
        guard let n = try find(id) else { throw NoteIntentError.gone }
        guard !n.isLocked else { throw NoteIntentError.locked }
        return n
    }

    /// Changes the note's text (a shared note's goes through its document, NoteWrites), saves it
    /// for sync, and redraws the Home Screen widget. False when the text didn't change.
    @discardableResult
    static func save(_ n: Note, _ edit: (String) throws -> String) async throws -> Bool {
        await NoteWrites.ready(n)
        switch try NoteWrites.change(n, edit) {
        case .changed: break
        case .unchanged: return false
        case .viewOnly: throw NoteIntentError.other(NoteWrites.viewOnlyMessage)
        case .notReady: throw NoteIntentError.other(NoteWrites.notReadyMessage)
        }
        n.modelContext?.saveOrReport()
        n.modelContext?.publishChecklistShelf()
        return true
    }

    /// Notes with every word of `query` in their title or text, newest first (20 at most).
    static func search(_ query: String, limit: Int = 20) -> [Note] {
        let words = query.split(whereSeparator: \.isWhitespace).map(String.init)
        guard !words.isEmpty, let c = PaneApp.sharedContainer else { return [] }
        let all: [Note] = (try? c.mainContext.fetch(FetchDescriptor(predicate: ShelfNotes.unlocked(), sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]))) ?? []
        return Array(all.lazy.filter { n in words.allSatisfy { n.body.localizedStandardContains($0) } }.prefix(limit))
    }
}
