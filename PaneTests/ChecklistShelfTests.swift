import AppIntents
import Foundation
import SwiftData
import Testing
@testable import Pane

/// Checklists within reach (2026-11-04): the Home Screen widget ticks items without opening the
/// app, Siri and Shortcuts add, tick and find, and the share sheet adds to a note you have. The
/// pure pieces, the App Group hand-over (ChecklistShelf) and the intents run against an in-memory
/// library here.
@MainActor @Suite(.serialized) struct ChecklistShelfTests {
    static let groceries = """
    Groceries

    For the weekend.

    - [ ] Oat milk
    - [ ] **Lemons**
    - [ ] Coffee beans
    - [x] Sourdough
    - [x] Eggs
    """

    private let tmp = FileManager.default.temporaryDirectory.appending(path: "shelf-\(UUID().uuidString)")

    private func library() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    /// The App Group, in a temporary folder, for the length of `body`.
    private func withShelf(_ body: () throws -> Void) rethrows {
        ChecklistShelf.rootOverride = tmp
        defer { ChecklistShelf.rootOverride = nil; try? FileManager.default.removeItem(at: tmp) }
        try body()
    }

    // MARK: Reading, ticking, adding

    @Test func itemsAreReadInOrderWithTheirMarkersGone() {
        let items = Checklist.items(in: Self.groceries + "\n\n```\n- [ ] not an item in code\n```\n  - [ ] [Nested](https://x.y) one")
        #expect(items.map(\.text) == ["Oat milk", "Lemons", "Coffee beans", "Sourdough", "Eggs", "Nested one"])
        #expect(items.map(\.done) == [false, false, false, true, true, false])
        #expect(items.map(\.index) == Array(0..<6))
        #expect(!Checklist.has("Plain\n\n- a bullet"))
        #expect(Checklist.has(Self.groceries))
    }

    @Test func aTickSinksBelowTheOpenItemsAsInTheEditor() throws {
        let body = try #require(Checklist.setting(true, index: 0, text: "Oat milk", in: Self.groceries))
        #expect(body.hasSuffix("- [ ] **Lemons**\n- [ ] Coffee beans\n- [x] Oat milk\n- [x] Sourdough\n- [x] Eggs"))
        // Unticked, it goes back up among the open ones, at their foot.
        let back = try #require(Checklist.setting(false, index: 4, text: "Eggs", in: body))
        #expect(back.contains("- [ ] Coffee beans\n- [ ] Eggs\n- [x] Oat milk"))
        // Already that way: unchanged. Gone: nil.
        #expect(Checklist.setting(true, index: 3, text: "Sourdough", in: Self.groceries) == Self.groceries)
        #expect(Checklist.setting(true, index: 0, text: "Tea", in: Self.groceries) == nil)
    }

    @Test func aTickFindsItsItemByTextWhenTheNoteMovedOn() throws {
        // Someone added an item at the top since the widget drew: index 0 is now "Tea".
        let moved = Self.groceries.replacingOccurrences(of: "- [ ] Oat milk", with: "- [ ] Tea\n- [ ] Oat milk")
        let body = try #require(Checklist.setting(true, index: 0, text: "Oat milk", in: moved))
        #expect(body.contains("- [ ] Tea\n"))
        #expect(body.contains("- [x] Oat milk"))
    }

    @Test func aNestedListIsTickedButNotReordered() throws {
        let note = "Trip\n\n- [ ] Pack\n  - [ ] Passport\n- [ ] Book taxi"
        let body = try #require(Checklist.setting(true, index: 0, text: "Pack", in: note))
        #expect(body == "Trip\n\n- [x] Pack\n  - [ ] Passport\n- [ ] Book taxi")
    }

    @Test func addingGoesUnderTheLastOpenItem() {
        let added = Checklist.adding("Tomatoes", to: Self.groceries)
        #expect(added.contains("- [ ] Coffee beans\n- [ ] Tomatoes\n- [x] Sourdough"))
        // Said as a list item, or several lines: each line one item, markers dropped.
        let more = Checklist.adding("- [ ] Basil\n\n- Salt ", to: Self.groceries)
        #expect(more.contains("- [ ] Coffee beans\n- [ ] Basil\n- [ ] Salt\n- [x] Sourdough"))
        // Every item ticked: above the ticked ones.
        #expect(Checklist.adding("Tea", to: "List\n\n- [x] Milk") == "List\n\n- [ ] Tea\n- [x] Milk")
        // No checklist yet: one at the end, after a blank line.
        #expect(Checklist.adding("Tea", to: "Shopping\n\nFor Sunday.\n") == "Shopping\n\nFor Sunday.\n\n- [ ] Tea\n")
        #expect(Checklist.adding("  ", to: Self.groceries) == Self.groceries)
    }

    @Test func matchPrefersAnOpenItemWithTheSameWords() {
        #expect(Checklist.match("lemons", in: Self.groceries)?.text == "Lemons")
        #expect(Checklist.match("coffee", in: Self.groceries)?.index == 2)
        #expect(Checklist.match("eggs", in: Self.groceries)?.done == true)
        #expect(Checklist.match("tea", in: Self.groceries) == nil)
    }

    @Test func quickLinksGoThereAndBack() throws {
        let id = UUID()
        #expect(QuickLink.parse(QuickLink.note(id).url) == .note(id))
        #expect(QuickLink.parse(QuickLink.newNote.url) == .newNote)
        #expect(QuickLink.newNote.url.absoluteString == "\(AppIdentity.scheme)://new")
        #expect(QuickLink.parse(try #require(URL(string: "\(AppIdentity.scheme)://note/nope"))) == nil)
        #expect(QuickLink.parse(try #require(URL(string: "\(AppIdentity.scheme)://connect-ai"))) == nil)
        #expect(QuickLink.parse(try #require(URL(string: "https://pintonotes.com/new"))) == nil)
    }

    // MARK: The App Group: the app leaves lists, the widget ticks, the app applies

    @Test func theAppLeavesItsChecklistsButNeverLockedOrDeletedNotes() throws {
        try withShelf {
            let container = try library()
            let context = container.mainContext
            let groceries = context.createNote(in: .all, body: Self.groceries)
            groceries.isPinned = true
            let packing = context.createNote(in: .all, body: "Packing\n\n- [ ] Passport")
            packing.updatedAt = .now.addingTimeInterval(60)
            let gone = context.createNote(in: .all, body: "Old list\n\n- [ ] Gone")
            gone.trashedAt = .now
            let secret = context.createNote(in: .all, body: "Codes\n\n- [ ] Secret item")
            secret.lockedBody = "sealed"
            secret.body = "Codes"
            _ = context.createNote(in: .all, body: "Plain\n\nNo list [here] at all.")
            try context.save()

            context.publishChecklistShelf()
            let lists = ChecklistShelf.lists()
            #expect(lists.map(\.title) == ["Packing", "Groceries"])
            #expect(lists.last?.pinned == true)
            #expect(ChecklistShelf.defaultList(in: lists)?.title == "Groceries", "a pinned list first")
            #expect(!lists.flatMap(\.items).contains { $0.text == "Secret item" || $0.text == "Gone" })
            // The share sheet's notes: titles of live, unlocked notes only.
            let recents = ChecklistShelf.recents().map(\.title)
            #expect(recents.contains("Plain") && recents.contains("Groceries") && !recents.contains("Codes") && !recents.contains("Old list"))
            #expect(ChecklistShelf.search("groc", in: ChecklistShelf.recents()).map(\.title) == ["Groceries"])
        }
    }

    /// An imported library of 1,200 notes: the share sheet finds the oldest by its title.
    @Test func theShareSheetFindsAnOldNoteInABigLibrary() throws {
        try withShelf {
            let container = try library()
            let context = container.mainContext
            for i in 0..<1200 {
                let n = context.createNote(in: .all, body: "Note \(i)")
                n.updatedAt = .now.addingTimeInterval(Double(i))
            }
            try context.save()
            context.publishChecklistShelf()
            #expect(ChecklistShelf.search("Note 0", in: ChecklistShelf.recents()).contains { $0.title == "Note 0" })
        }
    }

    @Test func aWidgetTickShowsAtOnceAndReachesTheNoteWhenTheAppOpens() throws {
        try withShelf {
            let container = try library()
            let context = container.mainContext
            let n = context.createNote(in: .all, body: Self.groceries)
            try context.save()
            context.publishChecklistShelf()

            // In the widget: ticked in place at once, and waiting for the app.
            ChecklistShelf.tick(note: n.id, index: 1, text: "Lemons", done: true)
            let shown = try #require(ChecklistShelf.list(n.id))
            #expect(shown.items.map(\.done) == [false, true, false, true, true])
            #expect(ChecklistWidgetLayout.shown(shown, rows: 4).map(\.text) == ["Oat milk", "Lemons", "Coffee beans", "Sourdough"],
                    "the ticked item keeps its place")
            #expect(ChecklistShelf.ticks().count == 1)

            // The app comes to the front: the note has it, sunk below the open items, ready to sync.
            n.dirty = false
            let changed = context.syncChecklistShelf()
            #expect(changed.map(\.id) == [n.id])
            #expect(n.body.hasSuffix("- [ ] Oat milk\n- [ ] Coffee beans\n- [x] **Lemons**\n- [x] Sourdough\n- [x] Eggs"))
            #expect(n.dirty, "marked for sync")
            #expect(ChecklistShelf.ticks().isEmpty)
            #expect(ChecklistShelf.list(n.id)?.items.map(\.text) == ["Oat milk", "Coffee beans", "Lemons", "Sourdough", "Eggs"])
        }
    }

    @Test func aTickForANoteLockedSinceIsDropped() throws {
        try withShelf {
            let container = try library()
            let context = container.mainContext
            let n = context.createNote(in: .all, body: Self.groceries)
            try context.save()
            ChecklistShelf.tick(note: n.id, index: 0, text: "Oat milk", done: true)
            n.lockedBody = "sealed"
            #expect(context.applyChecklistTicks().isEmpty)
            #expect(ChecklistShelf.ticks().isEmpty)
            #expect(n.body == Self.groceries)
        }
    }

    @Test func theWidgetPicksThePinnedListAndSaysWhenOneIsGone() {
        let a = ChecklistShelf.List(id: UUID(), title: "Packing", items: [ChecklistLine(text: "Passport", done: false, index: 0)], updatedAt: .now)
        var b = a
        b.id = UUID()
        b.title = "Groceries"
        b.pinned = true
        #expect(ChecklistWidgetContent.resolve(picked: nil, lists: [a, b]) == .list(b))
        #expect(ChecklistWidgetContent.resolve(picked: a.id, lists: [a, b]) == .list(a))
        #expect(ChecklistWidgetContent.resolve(picked: UUID(), lists: [a, b]) == .gone)
        #expect(ChecklistWidgetContent.resolve(picked: nil, lists: []) == .noLists)
    }

    @Test func smallShowsFourAndMediumSevenOpenItemsFirst() {
        let items = (0..<10).map { ChecklistLine(text: "Item \($0)", done: $0 == 2 || $0 >= 8, index: $0) }
        let list = ChecklistShelf.List(id: UUID(), title: "List", items: items, updatedAt: .now)
        #expect(ChecklistWidgetLayout.shown(list, rows: 4).map(\.index) == [0, 1, 2, 3])
        #expect(ChecklistWidgetLayout.shown(list, rows: 7).map(\.index) == [0, 1, 2, 3, 4, 5, 6])
        // Few open items: the ticked ones fill the room, in the note's order.
        let few = ChecklistShelf.List(id: UUID(), title: "List", items: Array(items.suffix(3)), updatedAt: .now)
        #expect(ChecklistWidgetLayout.shown(few, rows: 4).map(\.index) == [7, 8, 9])
        #expect(list.open == 7)
    }

    // MARK: Intents (Siri, Shortcuts, the widget's tick)

    /// The intents read PaneApp.sharedContainer, as in the app.
    private func withContainer(_ body: @MainActor (ModelContext) async throws -> Void) async throws {
        let container = try library()
        let saved = PaneApp.sharedContainer
        PaneApp.sharedContainer = container
        defer { PaneApp.sharedContainer = saved }
        try await body(container.mainContext)
    }

    @Test func addToListAddsAnUntickedItemAndSaysSo() async throws {
        try await withContainer { context in
            let n = context.createNote(in: .all, body: Self.groceries)
            try context.save()
            let intent = AddToListIntent(item: "Tomatoes", note: NoteEntity(n))
            _ = try await intent.perform()
            #expect(n.body.contains("- [ ] Coffee beans\n- [ ] Tomatoes\n- [x] Sourdough"))
            #expect(QuickWords.added("Tomatoes", to: "Groceries") == "Added \u{201C}Tomatoes\u{201D} to Groceries.")
            // A locked note is refused.
            n.lockedBody = "sealed"
            await #expect(throws: NoteIntentError.self) { _ = try await AddToListIntent(item: "Salt", note: NoteEntity(n)).perform() }
        }
    }

    @Test func tickItemTicksByWordsAndSaysWhenThereIsNone() async throws {
        try await withContainer { context in
            let n = context.createNote(in: .all, body: Self.groceries)
            try context.save()
            _ = try await TickItemIntent(item: "oat milk", note: NoteEntity(n)).perform()
            #expect(n.body.contains("- [x] Oat milk"))
            #expect(Checklist.items(in: n.body).first?.text == "Lemons", "the ticked item sank")
            await #expect(throws: NoteIntentError.self) { _ = try await TickItemIntent(item: "tea", note: NoteEntity(n)).perform() }
        }
    }

    @Test func findNotesSearchesTitlesAndTextButNotLockedNotes() async throws {
        try await withContainer { context in
            let a = context.createNote(in: .all, body: "Lisbon\n\nTram 28 early")
            a.updatedAt = .now.addingTimeInterval(-60)
            _ = context.createNote(in: .all, body: "Packing\n\nShoes for Lisbon hills")
            let locked = context.createNote(in: .all, body: "Lisbon codes")
            locked.lockedBody = "sealed"
            try context.save()
            #expect(NoteIntents.search("lisbon").map(\.title) == ["Packing", "Lisbon"])
            #expect(NoteIntents.search("tram lisbon").map(\.title) == ["Lisbon"])
            #expect(NoteIntents.search("  ").isEmpty)
            let result = try await FindNotesIntent(query: "lisbon").perform()
            #expect(result.value?.map(\.title) == ["Packing", "Lisbon"])
        }
    }

    /// A tick in the widget opens the app at the note and is in the note at once (Emil, 4 November
    /// 2026: it waited for the next visit, so a shared list went stale). Tapped again, unticked.
    @Test func aWidgetTickOpensTheNoteWithTheItemTicked() async throws {
        ChecklistShelf.rootOverride = tmp
        defer { ChecklistShelf.rootOverride = nil; try? FileManager.default.removeItem(at: tmp) }
        #expect(WidgetTickIntent.supportedModes == .foreground(.immediate), "it opens the app")
        // A widget's button runs in the widget extension; without this the app stayed shut
        // (the persona showcase recording on a simulator, 2026-11-04).
        #expect(WidgetTickIntent.openAppWhenRun, "the widget's tap brings the app up")
        try await withContainer { context in
            let n = context.createNote(in: .all, body: "Groceries\n\n- [ ] Milk\n- [ ] Lemons")
            try context.save()
            NoteOpener.shared.request = nil
            _ = try await WidgetTickIntent(note: n.id, item: ChecklistLine(text: "Lemons", done: false, index: 1)).perform()
            #expect(NoteOpener.shared.request == n.id, "the note opens")
            #expect(n.body.contains("- [x] Lemons"), "ticked in the note itself: \(n.body)")
            #expect(ChecklistShelf.ticks().isEmpty, "nothing left waiting")
            _ = try await WidgetTickIntent(note: n.id, item: ChecklistLine(text: "Lemons", done: true, index: 1)).perform()
            #expect(n.body.contains("- [ ] Lemons"))
        }
    }

    /// Send a Copy and the share sheet's preview show a note as people read it, not its markdown.
    @Test func aCopyOfANoteReadsWithoutMarkdown() {
        let md = "Lisbon\n\n## Plan\n- [ ] Tram 28\n- [x] **Book** flights\n- Time Out Market\n> Pack shoes\n| Place | Dish |\n| --- | --- |\n| Ramiro | Seafood |\nSee [[Hotel booking]] and [site](https://x.com)"
        #expect(ReadableText.from(markdown: md) == "Lisbon\n\nPlan\n\u{25CB} Tram 28\n\u{2713} Book flights\n\u{2022} Time Out Market\nPack shoes\nPlace  Dish\nRamiro  Seafood\nSee Hotel booking and site (https://x.com)")
    }

    @Test func newNoteFromOutsideIsAskedOnce() async throws {
        NoteOpener.shared.newNoteAsked = false
        _ = try await NewNoteIntent().perform()
        #expect(NoteOpener.shared.newNoteAsked)
        NoteOpener.shared.newNoteAsked = false
        #expect(NoteOpener.shared.receive(QuickLink.newNote.url))
        #expect(NoteOpener.shared.newNoteAsked)
        NoteOpener.shared.newNoteAsked = false
        let id = UUID()
        #expect(NoteOpener.shared.receive(QuickLink.note(id).url))
        #expect(NoteOpener.shared.request == id)
        NoteOpener.shared.request = nil
        #expect(!NoteOpener.shared.receive(try #require(URL(string: "\(AppIdentity.scheme)://connect-ai"))))
    }

    // MARK: Share sheet: Add to a note

    /// The share sheet says what Save did (persona council round 5): saved, and when it goes in,
    /// never "Added to" a note it isn't in yet; before Save, what happens if the note can't take it.
    @Test func theShareSheetSaysSavedAndWhenItGoesIn() {
        #expect(InboxCopy.done(note: "Week plan") == "Saved for Week plan. Pinto Notes adds it the next time it opens.")
        #expect(InboxCopy.done(note: nil) == "Saved. It\u{2019}s in your notes the next time Pinto Notes opens.")
        for line in [InboxCopy.done(note: "Week plan"), InboxCopy.done(note: nil), InboxCopy.addToFooter] {
            #expect(!line.contains("Added"), "\(line)")
        }
        #expect(InboxCopy.addToFooter.contains("becomes a new note") && InboxCopy.addToFooter.contains("next time it opens"))
    }

    @Test func sharedTextGoesAtTheEndOfThePickedNote() throws {
        let inbox = tmp.appending(path: "Inbox")
        Inbox.rootOverride = inbox
        defer { Inbox.rootOverride = nil; try? FileManager.default.removeItem(at: tmp) }
        let container = try library()
        let context = container.mainContext
        let plan = context.createNote(in: .all, body: "Week plan\n\n- [ ] Run Thursday")
        let locked = context.createNote(in: .all, body: "Codes")
        locked.lockedBody = "sealed"
        try context.save()

        try Inbox.add(markdown: "Long run Saturday, 12 km\nhttps://example.com/plan", files: [], note: plan.id)
        // A note locked since it was picked: a new note instead, so nothing is lost.
        try Inbox.add(markdown: "Door code 4821", files: [], note: locked.id)
        let made = context.drainInbox()
        #expect(plan.body == "Week plan\n\n- [ ] Run Thursday\n\nLong run Saturday, 12 km\nhttps://example.com/plan\n")
        #expect(made.map(\.title) == ["Door code 4821"])
        #expect(locked.body == "Codes")
        #expect(Inbox.pending().isEmpty)
    }

    @Test func anOlderInboxItemWithoutANoteStillDecodes() throws {
        let old = #"{"id":"6D1F2C9A-1B7E-4C3A-9F0E-2A4B8C1D7E55","markdown":"Hi","files":[],"createdAt":0}"#
        let item = try JSONDecoder().decode(Inbox.Item.self, from: Data(old.utf8))
        #expect(item.note == nil && item.markdown == "Hi")
    }
}
