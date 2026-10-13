import Foundation
import SwiftData
import Testing
@testable import Pane

private final class SummaryFixtureToken {}

/// Each note's title and preview are kept as it is saved, so the list, links and the AI tools read
/// them instead of working them out from every note's text (NoteSummaries).
@MainActor @Suite(.serialized) struct NoteSummaryTests {
    func onDisk() throws -> (ModelContainer, URL) {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("NoteSummaryTests-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appendingPathComponent("library.store")
        return (try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url)), url)
    }

    @Test func aSaveKeepsTheTitleAndPreviewOfWhatWasWritten() throws {
        let (c, url) = try onDisk()
        let ctx = c.mainContext
        let n = ctx.createNote(in: .all, body: "# Groceries\n\n- [ ] oat milk\n")
        try ctx.save()
        #expect(n.summaryTitle == "Groceries" && n.summaryPreview == "oat milk")
        #expect(n.title == "Groceries" && n.preview == "oat milk")

        // Written and not saved yet: the title is the text's, not the saved one.
        n.body = "Shopping\n\nbread"
        #expect(n.title == "Shopping" && n.preview == "bread", "an unsaved change reads from the text")
        #expect(n.summaryTitle == "Groceries")
        try ctx.save()
        #expect(n.summaryTitle == "Shopping" && n.summaryPreview == "bread")

        // As sync writes: text, then a save with other changes in it.
        n.body = "Only a title"
        n.dirty = false
        try ctx.save()
        #expect(n.summaryTitle == "Only a title" && n.summaryPreview == NoteText.noPreview)

        // Read back from disk by another container: the saved summary is there.
        let again = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
        let id = n.id
        let read = try #require(try again.mainContext.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.id == id })).first)
        #expect(read.summaryTitle == "Only a title" && read.title == "Only a title")
    }

    /// Whatever writes the text, the saved summary is what working it out from the text gives.
    @Test func theSavedSummaryIsAlwaysTheTextsOwn() throws {
        let (c, _) = try onDisk()
        let ctx = c.mainContext
        let bodies = ["", "\n\n", "Title\n", "| a | b |\n| - | - |\n| 1 | 2 |\n", "## Heading\n\n> quote\n", "[[Linked]] note\n\nwith [[A|alias]]",
                      String(repeating: "x", count: 5000), "<!-- pane-table: x -->\nCommented", "1. first\n2. second"]
        let notes = bodies.map { ctx.createNote(in: .all, body: $0) }
        try ctx.save()
        for n in notes {
            let head = NoteText.head(of: n.body)
            #expect(n.summaryTitle == head.title)
            #expect(n.summaryPreview == (head.preview ?? NoteText.noPreview))
        }
    }

    /// A library from 1.2 (made by 1.2's code, PaneTests/Fixtures/library-1.2.store) opens with
    /// every note as it was; its notes have no saved summary yet, read the same titles from their
    /// text, and get one from `fill`, after which nothing is left to fill.
    @Test func aLibraryFromBeforeOpensAndIsFilledIn() throws {
        let fixture = try #require(Bundle(for: SummaryFixtureToken.self).url(forResource: "library-1.2", withExtension: "store"))
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("NoteSummaryTests-old-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appendingPathComponent("library.store")
        try FileManager.default.copyItem(at: fixture, to: url)

        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
        let ctx = c.mainContext
        let notes = try ctx.fetch(FetchDescriptor<Note>(sortBy: [SortDescriptor(\.id)]))
        #expect(notes.count == 5)
        #expect(notes.allSatisfy { $0.summaryTitle == nil }, "1.2 kept no summaries")
        let titles = Dictionary(uniqueKeysWithValues: notes.map { ($0.id.uuidString.prefix(1), $0.title) })
        #expect(titles["1"] == "Groceries" && titles["3"] == "Only a title" && titles["4"] == "A sub")
        #expect(notes.allSatisfy { $0.title == NoteText.head(of: $0.body).title })
        let groceries = try #require(notes.first { $0.id.uuidString.hasPrefix("1") })
        #expect(groceries.preview == "oat milk" && groceries.folder?.name == "Work")
        #expect(notes.first { $0.id.uuidString.hasPrefix("4") }?.parentID == notes.first { $0.id.uuidString.hasPrefix("5") }?.id)
        #expect(notes.first { $0.id.uuidString.hasPrefix("3") }?.trashedAt != nil)

        #expect(NoteSummaries.fill(c, batch: 2) == 5)
        #expect(NoteSummaries.fill(c) == 0, "nothing left")
        // The main context hears of the other context's save.
        let reread = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
        let filled = try reread.mainContext.fetch(FetchDescriptor<Note>())
        #expect(filled.allSatisfy { $0.summaryTitle != nil && $0.summaryTitle == $0.title })
        let trip = try #require(filled.first { $0.id.uuidString.hasPrefix("2") })
        #expect(trip.summaryPreview == NoteText.head(of: trip.body).preview && trip.summaryPreview?.hasSuffix("10 km") == true, "a table's latest row")
    }
}
