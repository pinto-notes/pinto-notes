import Foundation
import SwiftData
import Testing
@testable import Pane

/// "Sort By" and "Group By Date" for the note list, as in Apple Notes: each order with pinned
/// notes on top and sub-notes left inside their parents, headings that run the way the list does,
/// and the choice kept on the device.
@MainActor @Suite struct ListOrderTests {
    let context: ModelContext
    let calendar = Calendar.current
    let now = Date.now

    init() throws {
        context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
    }

    private func daysAgo(_ n: Double) -> Date { now.addingTimeInterval(-n * 86400) }

    @discardableResult
    private func note(_ title: String, created: Double, edited: Double, pinned: Bool = false) -> Note {
        let n = context.createNote(in: .all, body: title + "\nbody")
        n.createdAt = daysAgo(created)
        n.updatedAt = daysAgo(edited)
        n.isPinned = pinned
        return n
    }

    /// Five notes whose three orders all differ, one of them pinned, and a sub-note inside "Banana".
    private func library() throws -> [Note] {
        let banana = note("Banana", created: 400, edited: 0.01)
        let apple = note("apple", created: 3, edited: 2)
        let cherry = note("Cherry 10", created: 100, edited: 40)
        let cherry2 = note("Cherry 2", created: 0.02, edited: 0.02)
        let pinned = note("Zebra", created: 50, edited: 500, pinned: true)
        let child = context.createSubNote(of: banana, body: "Aardvark\ninside Banana")
        child.createdAt = daysAgo(1)
        child.updatedAt = daysAgo(0.001)
        banana.body += "\n[Aardvark](pane-note:\(child.id.uuidString.lowercased()))"
        banana.updatedAt = daysAgo(0.01)
        try context.save()
        return [banana, apple, cherry, cherry2, pinned, child]
    }

    /// The list as the view builds it: the library's entries in order, the scope's notes, sections.
    private func listed(_ order: ListOrder, in library: LibraryNotes = LibraryNotes()) -> [(String, [String])] {
        let scoped = NoteListView.scoped(library.entries(in: context, order: order), to: .all, context: context)
        return DateBucket.sections(ordered: scoped, by: order, now: now, calendar: calendar).map { ($0.0, $0.1.map { $0.note(in: context)?.title ?? "" }) }
    }

    private func titles(_ order: ListOrder) -> [String] { listed(order).flatMap(\.1) }

    @Test func everyOrderKeepsPinnedNotesOnTopAndSubNotesInsideTheirParents() throws {
        _ = try library()
        #expect(titles(.standard) == ["Zebra", "Banana", "Cherry 2", "apple", "Cherry 10"], "as it has always been: newest edit first")
        #expect(titles(ListOrder(key: .edited, reversed: true)) == ["Zebra", "Cherry 10", "apple", "Cherry 2", "Banana"])
        #expect(titles(ListOrder(key: .created)) == ["Zebra", "Cherry 2", "apple", "Cherry 10", "Banana"])
        #expect(titles(ListOrder(key: .created, reversed: true)) == ["Zebra", "Banana", "Cherry 10", "apple", "Cherry 2"])
        // By title: letters whatever their case, and numbers by their value, as Finder and Notes do.
        #expect(titles(ListOrder(key: .title)) == ["Zebra", "apple", "Banana", "Cherry 2", "Cherry 10"])
        #expect(titles(ListOrder(key: .title, reversed: true)) == ["Zebra", "Cherry 10", "Cherry 2", "Banana", "apple"])
        for key in ListOrder.Key.allCases {
            for reversed in [false, true] {
                for grouped in [false, true] {
                    let all = titles(ListOrder(key: key, reversed: reversed, groupsByDate: grouped))
                    #expect(all.first == "Zebra" && !all.contains("Aardvark") && all.count == 5, "\(key) \(reversed) \(grouped)")
                }
            }
        }
    }

    @Test func theHeadingsRunTheWayTheListDoes() throws {
        _ = try library()
        // The list's own order: Pinned, then the newest days first.
        let standard = listed(.standard)
        #expect(standard.map(\.0).prefix(3) == ["Pinned", "Today", "Previous 7 Days"])
        #expect(standard.count == 4 && standard[3].1 == ["Cherry 10"], "an older month last")
        // Oldest first: the same headings the other way round, Pinned still on top.
        let oldest = listed(ListOrder(key: .edited, reversed: true))
        #expect(oldest.map(\.0) == ["Pinned"] + standard.map(\.0).dropFirst().reversed())
        #expect(oldest.last?.0 == "Today" && oldest.last?.1 == ["Cherry 2", "Banana"], "and inside a day the older edit first")
        // By date created, the headings are the days the notes were made.
        let created = listed(ListOrder(key: .created))
        #expect(created[1].0 == "Today" && created[1].1 == ["Cherry 2"])
        #expect(created[2].0 == "Previous 7 Days" && created[2].1 == ["apple"])
        #expect(created.last?.1 == ["Banana"], "made over a year ago, though edited today")
        // By title there are no dates to group by, whatever Group By Date says; nor with it off.
        for order in [ListOrder(key: .title), ListOrder(key: .title, groupsByDate: false), ListOrder(key: .edited, groupsByDate: false), ListOrder(key: .created, reversed: true, groupsByDate: false)] {
            #expect(listed(order).map(\.0) == ["Pinned", "Notes"], "\(order)")
            #expect(!order.showsDateHeadings)
        }
        #expect(listed(ListOrder(key: .edited, groupsByDate: false))[1].1 == ["Banana", "Cherry 2", "apple", "Cherry 10"], "the order stays, only the headings go")
    }

    @Test func withNothingPinnedAnUngroupedListHasNoHeading() {
        note("Beta", created: 2, edited: 2)
        note("Alpha", created: 1, edited: 1)
        let sections = listed(ListOrder(key: .title))
        #expect(sections.map(\.0) == [DateBucket.unheaded] && sections[0].1 == ["Alpha", "Beta"])
        #expect(DateBucket.sections(ordered: [NoteEntry](), by: ListOrder(key: .title)).isEmpty)
    }

    @Test func theChoiceSurvivesARelaunchAndStartsAsTheListAlwaysWas() {
        let defaults = TestDefaults()
        #expect(ListOrderStore(defaults: defaults).order == .standard)
        #expect(ListOrder.standard == ListOrder(key: .edited, reversed: false, groupsByDate: true))
        let store = ListOrderStore(defaults: defaults)
        store.order.key = .title
        store.order.reversed = true
        store.order.groupsByDate = false
        // The next launch.
        #expect(ListOrderStore(defaults: defaults).order == ListOrder(key: .title, reversed: true, groupsByDate: false))
        store.order = ListOrder(key: .created)
        #expect(ListOrderStore(defaults: defaults).order == ListOrder(key: .created))
        // A value this build doesn't know (a later build wrote it) is the list's own order.
        defaults.set("colour", forKey: ListOrderStore.keyKey)
        #expect(ListOrderStore(defaults: defaults).order.key == .edited)
        // Kept in this device's settings only: nothing of it is a note, a folder or a file to sync.
        #expect(Set(defaults.dictionaryRepresentation().keys) == [ListOrderStore.keyKey, ListOrderStore.reversedKey, ListOrderStore.groupKey])
    }

    /// A row shows the date its list is sorted by, as in Apple Notes: when the note was made for a
    /// list sorted by date created, and when it was last edited for the other two.
    @Test func aRowShowsTheDateItsListIsSortedBy() {
        let n = note("Lisbon", created: 400, edited: 3)
        let file = Attachment(filename: "Ticket.pdf", contentType: "com.adobe.pdf", size: 1)
        file.createdAt = daysAgo(90)
        file.modifiedAt = daysAgo(5)
        for reversed in [false, true] {
            for grouped in [false, true] {
                let created = ListOrder(key: .created, reversed: reversed, groupsByDate: grouped)
                #expect(created.showsCreationDates)
                #expect(NoteRow.shownDate(of: n, byCreation: created.showsCreationDates) == n.createdAt)
                #expect(NoteRow.shownDate(of: file, byCreation: created.showsCreationDates) == file.createdAt)
                for key in [ListOrder.Key.edited, .title] {
                    let order = ListOrder(key: key, reversed: reversed, groupsByDate: grouped)
                    #expect(!order.showsCreationDates, "\(key)")
                    #expect(NoteRow.shownDate(of: n, byCreation: order.showsCreationDates) == n.updatedAt, "\(key)")
                    #expect(NoteRow.shownDate(of: file, byCreation: order.showsCreationDates) == file.modifiedAt, "\(key)")
                }
            }
        }
        // What the row says: a note made over a year ago and edited this week.
        let made = DateBucket.rowDate(NoteRow.shownDate(of: n, byCreation: true), now: now, calendar: calendar)
        let edited = DateBucket.rowDate(NoteRow.shownDate(of: n, byCreation: false), now: now, calendar: calendar)
        #expect(made != edited && made == DateBucket.rowDate(n.createdAt, now: now, calendar: calendar))
        // The row's date and its heading are the same date.
        #expect(ListOrder(key: .created).date(of: n) == n.createdAt && ListOrder(key: .title).date(of: n) == n.updatedAt)
    }

    @Test func theMenuNamesTheDirectionsForWhatIsSorted() {
        #expect(ListOrder.Key.allCases.map(\.title) == ["Date Edited", "Date Created", "Title"])
        #expect(ListOrder(key: .edited).directions == ("Newest First", "Oldest First") && ListOrder(key: .created).directions == ("Newest First", "Oldest First"))
        #expect(ListOrder(key: .title).directions == ("A to Z", "Z to A"))
    }

    @Test func aChangedNoteMovesToItsPlaceInTheChosenOrder() async throws {
        let notes = try library()
        let library = LibraryNotes()
        let byTitle = ListOrder(key: .title)
        #expect(listed(byTitle, in: library).flatMap(\.1) == ["Zebra", "apple", "Banana", "Cherry 2", "Cherry 10"])
        // Renamed: it moves with its save, with no fetch of the library.
        notes[1].body = "Dragonfruit\nbody"
        notes[1].updatedAt = now
        try context.save()
        for _ in 0..<20 { await Task.yield() }
        try await Task.sleep(for: .milliseconds(50))
        #expect(listed(byTitle, in: library).flatMap(\.1) == ["Zebra", "Banana", "Cherry 2", "Cherry 10", "Dragonfruit"])
        // A new note goes where its title belongs.
        note("Coconut", created: 0.0005, edited: 0.0005)
        try context.save()
        #expect(listed(byTitle, in: library).flatMap(\.1) == ["Zebra", "Banana", "Cherry 2", "Cherry 10", "Coconut", "Dragonfruit"])
        // By date created, an edit moves nothing.
        let byCreated = ListOrder(key: .created)
        let before = listed(byCreated, in: library).flatMap(\.1)
        notes[2].body = "Cherry 10\nedited again"
        notes[2].updatedAt = now.addingTimeInterval(1)
        try context.save()
        for _ in 0..<20 { await Task.yield() }
        try await Task.sleep(for: .milliseconds(50))
        #expect(listed(byCreated, in: library).flatMap(\.1) == before)
        // And back: the same list as one that was never sorted another way.
        #expect(listed(.standard, in: library).flatMap(\.1) == listed(.standard).flatMap(\.1))
    }

    @Test func filesFallWhereTheyBelongInEachOrder() throws {
        let entries = [note("Alpha", created: 1, edited: 1), note("Mango", created: 10, edited: 3), note("Zulu", created: 5, edited: 5)].map { NoteEntry($0, titled: true) }
        let file = Attachment(filename: "Budget.pdf", contentType: "com.adobe.pdf", size: 1)
        file.createdAt = daysAgo(7)
        file.modifiedAt = daysAgo(2)
        func merged(_ order: ListOrder) -> [String] {
            ListEntry.merged(notes: entries.sorted { order.before($0, $1) }, files: [file], by: order).map(\.listTitle)
        }
        #expect(merged(.standard) == ["Alpha", "Budget.pdf", "Mango", "Zulu"])
        #expect(merged(ListOrder(key: .created)) == ["Alpha", "Zulu", "Budget.pdf", "Mango"])
        #expect(merged(ListOrder(key: .title)) == ["Alpha", "Budget.pdf", "Mango", "Zulu"])
        #expect(merged(ListOrder(key: .title, reversed: true)) == ["Zulu", "Mango", "Budget.pdf", "Alpha"])
        // The list's own order gives what it always gave.
        let old = ListEntry.merged(notes: entries.sorted { $0.date > $1.date }, files: [file]).map(\.0.id)
        #expect(ListEntry.merged(notes: entries.sorted { $0.date > $1.date }, files: [file], by: .standard).map(\.id) == old)
    }

    @Test func whatASearchFindsIsNewestFirstWhateverTheOrder() throws {
        _ = try library()
        for order in [ListOrder.standard, ListOrder(key: .title), ListOrder(key: .created, reversed: true)] {
            let all = LibraryNotes().entries(in: context, order: order)
            let found = NoteListView.found("Cherry", in: all, listedBy: order, context: context).compactMap { $0.note(in: context)?.title }
            #expect(found == ["Cherry 2", "Cherry 10"], "\(order)")
        }
    }
}
