import Foundation
#if os(macOS)
import AppKit
#else
import UIKit
#endif
import SwiftData
import Testing
@testable import Pane

/// AI Changes: every AI change across your notes, grouped by day, the diff of one edit (before
/// against after that edit, never against the note now), Undo that keeps your later edits, and
/// Compare with… in version history.
@MainActor @Suite(.serialized) struct AIChangesLogTests {
    static let t0 = Date(timeIntervalSince1970: 1_790_000_000)
    static var calendar: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "Europe/Stockholm")!
        c.locale = Locale(identifier: "en_US")
        return c
    }

    static let before = "Lisbon\n\n- Alfama\n- Belém"
    static let after = "Lisbon\n\n- Alfama\n- Belém\n- Sintra, Pena Palace first"

    /// A note's history with numbered texts and no server: restoring writes the text here.
    final class Texts: NoteHistoryStore {
        var texts: [Int64: String]
        var restored: [Int64] = []
        init(_ texts: [Int64: String]) { self.texts = texts }
        func versions(of note: UUID) async throws -> [NoteVersion] { [] }
        func body(of note: UUID, version: Int64) async throws -> String {
            guard let t = texts[version] else { throw HistoryError.gone }
            return t
        }
        func restore(note: UUID, version: Int64) async throws -> NoteDTO? {
            restored.append(version)
            return nil
        }
    }

    final class Changes: AIChangesStore {
        var all: [AIChange]
        var asked: [(Date?, String?)] = []
        init(_ all: [AIChange]) { self.all = all }
        func changes(before: Date?, limit: Int, ai: String?) async throws -> [AIChange] {
            asked.append((before, ai))
            return Array(all.filter { (ai == nil || $0.ai == ai) && (before == nil || $0.at < before!) }.prefix(limit))
        }
    }

    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    static func edit(_ note: Note, by ai: String = "ChatGPT", minutesAgo: Double = 5, before: Int64 = 4, after: Int64? = nil) -> AIChange {
        AIChange(id: "r\(before)\(ai)", kind: .edit, noteID: note.id, ai: ai, at: t0.addingTimeInterval(-minutesAgo * 60), beforeVersion: before, afterVersion: after)
    }

    // MARK: The list

    @Test func changesGroupByDayNewestFirst() throws {
        let c = try Self.container()
        let note = c.mainContext.createNote(in: .all, body: Self.after)
        let cal = Self.calendar
        let now = cal.date(from: DateComponents(year: 2026, month: 10, day: 30, hour: 15))!
        func at(_ day: Int, _ hour: Int) -> Date { cal.date(from: DateComponents(year: 2026, month: 10, day: day, hour: hour))! }
        let changes = [(30, 14), (30, 9), (29, 22), (27, 8)].enumerated().map { i, d in
            AIChange(id: "\(i)", kind: .edit, noteID: note.id, ai: "Claude", at: at(d.0, d.1))
        }
        let days = AIChangeCopy.days(changes, now: now, calendar: cal)
        #expect(days.map(\.title) == ["Today", "Yesterday", "Tuesday, October 27"])
        #expect(days.map { $0.changes.map(\.id) } == [["0", "1"], ["2"], ["3"]])
    }

    @Test func theEmptyStateSaysWhatWillShow() {
        #expect(AIChangeCopy.empty == "No AI changes yet. When an AI edits your notes, every change shows here.")
        #expect(AIChangeCopy.title == "AI Changes")
    }

    @Test func summariesSayWhatChanged() throws {
        let c = try Self.container()
        let trips = Folder(name: "Trips")
        c.mainContext.insert(trips)
        let note = c.mainContext.createNote(in: .all, body: Self.after)
        func change(_ kind: AIChange.Kind, to: UUID? = nil) -> AIChange {
            AIChange(id: kind.rawValue, kind: kind, noteID: note.id, ai: "Claude", at: Self.t0, toFolder: to)
        }
        let name: (UUID) -> String? = { $0 == trips.id ? "Trips" : nil }
        #expect(AIChangeCopy.summary(change(.edit), before: Self.before, after: Self.after) == "+1 line")
        #expect(AIChangeCopy.summary(change(.edit), before: "A\n\nOne\nTwo\nThree", after: "A\n\nOne\nTwo, changed\n\nFour") == "+2 \u{2212}2 lines")
        #expect(AIChangeCopy.summary(change(.edit), before: "A\n\nOne\nTwo", after: "A\n\nOne") == "\u{2212}1 line")
        #expect(AIChangeCopy.summary(change(.edit), before: "# Trip\n\nDay 1", after: "# Lisbon trip\n\nDay 1") == "Renamed to \u{201C}Lisbon trip\u{201D}")
        #expect(AIChangeCopy.summary(change(.edit), before: "A\n\nOne", after: "A\n\n\nOne") == "No visible change")
        #expect(AIChangeCopy.summary(change(.created)) == "Created")
        #expect(AIChangeCopy.summary(change(.moved, to: trips.id), folderName: name) == "Moved to Trips")
        #expect(AIChangeCopy.summary(change(.moved, to: UUID()), folderName: name) == "Moved to another folder")
        #expect(AIChangeCopy.summary(change(.moved)) == "Moved out of its folder")
        #expect(AIChangeCopy.summary(change(.deleted)) == "Moved to Recently Deleted")
    }

    @Test func theServersRowsBecomeChanges() throws {
        let note = UUID()
        typealias R = SupabaseAIChangesStore.Row
        let edit = SupabaseAIChangesStore.change(R(id: "r12", kind: "edit", note_id: note, ai: "ChatGPT", at: Self.t0, before_version: 4, after_version: nil, from_folder: nil, to_folder: nil, trashed: false))
        #expect(edit == AIChange(id: "r12", kind: .edit, noteID: note, ai: "ChatGPT", at: Self.t0, beforeVersion: 4))
        // A kind from a newer server is left out, not shown wrong.
        #expect(SupabaseAIChangesStore.change(R(id: "e1", kind: "shared", note_id: note, ai: "ChatGPT", at: Self.t0, before_version: nil, after_version: nil, from_folder: nil, to_folder: nil, trashed: nil)) == nil)
    }

    /// One store serves every note, and version numbers repeat across notes: its cache of opened
    /// texts was keyed by version alone, so two notes' version 4 read as the same text.
    @Test func openedTextsAreCachedPerNote() {
        let a = UUID(), b = UUID()
        #expect(SupabaseHistoryStore.cacheKey(a, 4) != SupabaseHistoryStore.cacheKey(b, 4))
        #expect(SupabaseHistoryStore.cacheKey(a, 4) == SupabaseHistoryStore.cacheKey(a, 4))
    }

    @Test func theListLoadsFiltersAndPages() async throws {
        let c = try Self.container()
        let note = c.mainContext.createNote(in: .all, body: Self.after)
        let all = (0..<60).map { i in
            AIChange(id: "\(i)", kind: .edit, noteID: note.id, ai: i % 2 == 0 ? "ChatGPT" : "Claude", at: Self.t0.addingTimeInterval(Double(-i) * 60), beforeVersion: 1)
        }
        let store = Changes(all)
        let history = NoteHistory(store: Texts([1: Self.before]), context: c.mainContext, sync: nil)
        let model = AIChangesModel(store: store, history: history, connected: ["Codex"])
        await model.load()
        #expect(model.changes.count == 50 && model.hasMore)
        #expect(model.selection == "0", "opens on the newest")
        await model.loadMore()
        #expect(model.changes.count == 60 && !model.hasMore)
        #expect(store.asked.last?.0 == all[49].at)
        #expect(model.ais == ["ChatGPT", "Claude", "Codex"])
        await model.setFilter("Claude")
        #expect(model.changes.count == 30 && model.changes.allSatisfy { $0.ai == "Claude" })
        #expect(store.asked.last?.1 == "Claude")
    }

    // MARK: One edit's diff

    @Test func theDiffShowsWhatTheEditTookOutAndPutIn() {
        let d = EditDiff.between("Plan\n\nOne\nTwo\nThree", "Plan\n\nOne\nTwo, better\nThree\nFour")
        #expect(d.text == "Plan\n\nOne\nTwo\nTwo, better\nThree\nFour")
        let ns = d.text as NSString
        #expect(d.removed.map(ns.substring) == ["Two"])
        #expect(d.added.map(ns.substring) == ["Two, better", "Four"])
        #expect(AIChangeCopy.lines(d) == "+2 \u{2212}1 lines")
    }

    /// Lines an edit took out are struck through on a soft red, so they never read as ticked items.
    @Test func removedLinesAreStruckThroughOnABand() throws {
        let d = EditDiff.between("List\n\n- [x] Bread\n- [ ] Eggs", "List\n\n- [x] Bread\n- [ ] Milk")
        let storage = NSTextStorage(string: d.text)
        VersionTextView.style(storage, changed: d.added, removed: d.removed)
        let gone = try #require(d.removed.first)
        #expect(storage.attribute(.strikethroughStyle, at: gone.location, effectiveRange: nil) != nil)
        #expect(storage.attribute(.backgroundColor, at: gone.location, effectiveRange: nil) != nil)
        // The ticked item keeps its own look, with no band.
        let bread = (d.text as NSString).range(of: "Bread")
        #expect(storage.attribute(.backgroundColor, at: bread.location, effectiveRange: nil) == nil)
    }

    /// The diff is of that edit: the text it replaced against the text it wrote, kept as a
    /// version once you changed the note again. Never against the note as it is now.
    @Test func selectingAChangeShowsThatEditNotTheNoteNow() async throws {
        let c = try Self.container()
        let yours = Self.after + "\n- Book the tram"
        let note = c.mainContext.createNote(in: .all, body: yours)
        let history = NoteHistory(store: Texts([4: Self.before, 5: Self.after]), context: c.mainContext, sync: nil)
        let model = AIChangesModel(store: Changes([Self.edit(note, after: 5)]), history: history)
        await model.load()
        let diff = try #require(model.diff)
        #expect(diff.text == Self.after)
        #expect(diff.added.map((diff.text as NSString).substring) == ["- Sintra, Pena Palace first"])
        #expect(diff.removed.isEmpty)
        let row = try #require(model.changes.first)
        await model.summarize(row)
        #expect(model.summary(row) == "+1 line")
        #expect(model.title(row) == "Lisbon")
    }

    // MARK: Undo

    @Test func undoAnUntouchedEditRestoresTheVersionBeforeIt() async throws {
        let c = try Self.container()
        let note = c.mainContext.createNote(in: .all, body: Self.after)
        note.dirty = false
        let store = Texts([4: Self.before])
        let model = AIChangesModel(store: Changes([Self.edit(note)]), history: NoteHistory(store: store, context: c.mainContext, sync: nil))
        await model.load()
        let change = try #require(model.selected)
        #expect(model.canUndo(change))
        await model.undo(change)
        #expect(store.restored == [4], "restored as a version, so the AI's text stays in the history")
        #expect(note.body == Self.before)
        #expect(model.undone.contains(change.id) && !model.canUndo(change))
    }

    /// Your edits after the AI's stay: only the AI's lines come out.
    @Test func undoKeepsYourLaterEdits() async throws {
        let c = try Self.container()
        let yours = "Lisbon, 4 days\n\n- Alfama\n- Belém\n- Sintra, Pena Palace first"
        let note = c.mainContext.createNote(in: .all, body: yours)
        let store = Texts([4: Self.before, 5: Self.after])
        let model = AIChangesModel(store: Changes([Self.edit(note, after: 5)]), history: NoteHistory(store: store, context: c.mainContext, sync: nil))
        await model.load()
        await model.undo(try #require(model.selected))
        #expect(note.body == "Lisbon, 4 days\n\n- Alfama\n- Belém")
        #expect(store.restored.isEmpty, "a merge, written as your edit")
        #expect(model.conflict == nil && model.undoError == nil)
    }

    /// You changed the very lines the AI wrote: it says so, and only restores when you say yes.
    @Test func undoOverYourOwnEditsOfTheSameLinesAsksFirst() async throws {
        let c = try Self.container()
        let yours = "Lisbon\n\n- Alfama\n- Belém\n- Sintra, and Cabo da Roca"
        let note = c.mainContext.createNote(in: .all, body: yours)
        let store = Texts([4: Self.before, 5: Self.after])
        let model = AIChangesModel(store: Changes([Self.edit(note, after: 5)]), history: NoteHistory(store: store, context: c.mainContext, sync: nil))
        await model.load()
        let change = try #require(model.selected)
        await model.undo(change)
        #expect(model.conflict == change)
        #expect(note.body == yours, "nothing changes until you say so")
        await model.undo(change, anyway: true)
        #expect(store.restored == [4])
        #expect(note.body == Self.before)
        #expect(AIChangeUndoError.editedSince.localizedDescription == "You've changed those lines since this change.")
    }

    @Test func undoANoteItMadeAMoveAndADelete() async throws {
        let c = try Self.container()
        let home = Folder(name: "Notes"), trips = Folder(name: "Trips")
        c.mainContext.insert(home)
        c.mainContext.insert(trips)
        let made = c.mainContext.createNote(in: .folder(home.id), body: "Packing\n\n- Passport")
        let moved = c.mainContext.createNote(in: .folder(trips.id), body: "Lisbon")
        let deleted = c.mainContext.createNote(in: .folder(home.id), body: "Old plan")
        c.mainContext.trash(deleted)
        let changes = [
            AIChange(id: "e1", kind: .created, noteID: made.id, ai: "Claude", at: Self.t0),
            AIChange(id: "e2", kind: .moved, noteID: moved.id, ai: "Claude", at: Self.t0, fromFolder: home.id, toFolder: trips.id),
            AIChange(id: "e3", kind: .deleted, noteID: deleted.id, ai: "Claude", at: Self.t0),
        ]
        let model = AIChangesModel(store: Changes(changes), history: NoteHistory(store: Texts([:]), context: c.mainContext, sync: nil))
        await model.load()
        for change in changes {
            #expect(model.canUndo(change), "\(change.kind)")
            await model.undo(change)
        }
        #expect(made.trashedAt != nil, "a note it made goes to Recently Deleted")
        #expect(moved.folder?.id == home.id)
        #expect(deleted.trashedAt == nil)
        // A move whose folder is gone can't be put back.
        let gone = AIChange(id: "e4", kind: .moved, noteID: moved.id, ai: "Claude", at: Self.t0, fromFolder: UUID(), toFolder: home.id)
        #expect(!model.canUndo(gone))
    }

    // MARK: The demo history

    @Test func theDemoHistoryListsItsAIEdits() async throws {
        let (c, _) = try NoteHistoryTests.demo()
        let history = DemoHistoryStore(context: c.mainContext)
        let store = HistoryAIChangesStore(history: history, context: c.mainContext)
        let all = try await store.changes(before: nil, limit: 50, ai: nil)
        #expect(Set(all.map(\.ai)) == ["ChatGPT", "Claude Code"])
        #expect(zip(all, all.dropFirst()).allSatisfy { $0.at >= $1.at })
        #expect(try await store.changes(before: nil, limit: 50, ai: "Claude Code").count == 1)
        // Each edit's texts open, and differ.
        let model = AIChangesModel(store: store, history: NoteHistory(store: history, context: c.mainContext, sync: nil))
        await model.load()
        let diff = try #require(model.diff)
        #expect(!diff.added.isEmpty || !diff.removed.isEmpty)
    }

    // MARK: Compare with…

    @Test func versionHistoryComparesAnyTwoVersions() async throws {
        let (c, note) = try NoteHistoryTests.demo()
        let history = NoteHistory(store: DemoHistoryStore(context: c.mainContext), context: c.mainContext, sync: nil)
        let model = VersionHistoryModel(note: note, history: history)
        await model.load()
        let entries = model.entries
        #expect(entries.count >= 4)
        await model.select(entries[1].id)
        #expect(model.comparable.map(\.id) == entries.filter { $0.id != entries[1].id }.map(\.id))
        await model.compare(with: entries[3].id)
        let diff = try #require(model.comparison)
        let older = try await history.body(of: note, entries[3].version)
        let newer = try #require(model.previewText)
        #expect(diff == EditDiff.between(older, newer), "reads from the older version to the newer")
        let summary = try #require(model.comparisonSummary)
        #expect(summary.contains(VersionHistoryModel.heading(entries[3].version)) && summary.hasSuffix("."))
        // Picking another version keeps comparing with the same one; picking it ends the comparison.
        await model.select(entries[0].id)
        #expect(model.compareWith == entries[3].id && model.comparison != nil)
        #expect(model.comparisonSummary?.contains("the current version") == true)
        await model.select(entries[3].id)
        #expect(model.compareWith == nil && model.comparison == nil)
        await model.select(entries[1].id)
        await model.compare(with: entries[2].id)
        await model.compare(with: nil)
        #expect(model.comparison == nil && model.comparisonSummary == nil)
    }
}
