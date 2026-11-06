import Foundation
import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#endif

/// Search shows every match (persona council round 1, Elena: Obsidian listed 9 hits where Pinto
/// listed 1): a found note shows up to three lines that hold the text, the text in bold, then
/// "4 more in this note". In Go to Note (⌘O) and in the list's search.
@MainActor @Suite(.serialized) struct SearchLinesTests {
    /// Opened from a search, a note goes to the first line below its title that holds the words
    /// (case and accents aside), once; a match in the title alone opens it at the top.
    @Test func aNoteOpenedFromASearchGoesToItsLine() {
        let body = "Lisbon trip\n\nFly on Friday\nTram 28 across LISBON\nPastéis at 9"
        let r = try? #require(SearchJump.range(of: "lisbon", in: body))
        #expect(r.map { (body as NSString).substring(with: $0) } == "LISBON")
        #expect(SearchJump.range(of: "pasteis", in: body).map { (body as NSString).substring(with: $0) } == "Pastéis")
        #expect(SearchJump.range(of: "trip", in: body) == nil, "only the title has it")
        #expect(SearchJump.range(of: "x", in: "Just a title") == nil)

        let id = UUID(), other = UUID()
        SearchJump.set(id, query: "  tram ")
        #expect(SearchJump.take(other) == nil, "another note opening doesn't take it")
        #expect(SearchJump.take(id) == "tram")
        #expect(SearchJump.take(id) == nil, "once")
        SearchJump.set(id, query: " ")
        #expect(SearchJump.take(id) == nil, "no search, no jump")
    }

    /// Lisbon in the title and on seven lines of the text.
    static let trip = """
    Lisbon trip

    Fly to Lisbon on Friday
    - [ ] Book the hotel near the river
    - [ ] Tram 28 across lisbon
    Sintra on Saturday
    Lisbon cards for the museums
    Dinner in Alfama, the best fish in Lisbon
    Back from Lisbon on Monday
    [[Lisbon]] has the map
    Packing: sunscreen
    - [x] Buy the Lisbon guidebook
    """

    @Test func upToThreeLinesThenHowManyMore() throws {
        let found = try #require(SearchLines.find(in: Self.trip, query: "lisbon", skipping: "Lisbon trip"))
        #expect(found.lines.map(\.text) == ["Fly to Lisbon on Friday", "Tram 28 across lisbon", "Lisbon cards for the museums"])
        #expect(found.lines.map(\.match) == ["Lisbon", "lisbon", "Lisbon"], "the text as written there")
        #expect(found.more == 4 && found.total == 7)
        #expect(SearchLines.moreLine(found.more) == "4 more in this note")
        #expect(SearchLines.moreLine(1) == "1 more in this note")
        // Markup taken out: the checkbox and the link's brackets.
        let tram = try #require(SearchLines.find(in: Self.trip, query: "tram"))
        #expect(tram.lines == [SearchLines.Line(before: "", match: "Tram", after: " 28 across lisbon")] && tram.more == 0)
        let link = try #require(SearchLines.find(in: Self.trip, query: "the map"))
        #expect(link.lines.first?.text == "Lisbon has the map")
        // Only the title holds it: nothing to show under it.
        #expect(SearchLines.find(in: "Sintra\n\nPena first", query: "sintra", skipping: "Sintra") == nil)
        #expect(SearchLines.find(in: Self.trip, query: "porto") == nil)
        #expect(SearchLines.find(in: Self.trip, query: "  ") == nil)

        // A row's line is short, the date beside it: the whole word found shows, what's in front cut.
        let far = try #require(SearchLines.find(in: "A long enough sentence to be worth searching for: word733 and on", query: "word733", lead: SearchLines.rowLead)?.lines.first)
        #expect(far.before.count <= SearchLines.rowLead + 1 && far.before.hasPrefix("\u{2026}"), "\(far.before)")
        #expect(far.match == "word733")
    }

    /// Go to Note: a note found by its text carries its lines and the count past them, and its
    /// row grows a line for each.
    #if os(macOS)  // Go to Note (QuickOpen) is the Mac's.
    @Test func goToNoteFindsEveryLine() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let n = c.mainContext.createNote(in: .all, body: "Trip ideas\n\n" + Self.trip.split(separator: "\n").dropFirst(1).joined(separator: "\n"))
        let one = c.mainContext.createNote(in: .all, body: "Budget\n\nFlights to Lisbon: 240")
        one.updatedAt = .now.addingTimeInterval(-3600)
        try c.mainContext.save()
        let hits = await QuickOpen.textHits(for: "lisbon", in: c)
        let hit = try #require(hits.first { $0.id == n.id })
        #expect(hit.snippet.text == "Fly to Lisbon on Friday")
        #expect(hit.others.map(\.text) == ["Tram 28 across lisbon", "Lisbon cards for the museums"])
        #expect(hit.more == 4)
        let single = try #require(hits.first { $0.id == one.id })
        #expect(single.others.isEmpty && single.more == 0)
        #if os(macOS)
        #expect(QuickOpenPanel.height(of: .text(hit)) == QuickOpenPanel.Metrics.textRow + 3 * QuickOpenPanel.Metrics.textLine)
        #expect(QuickOpenPanel.height(of: .text(single)) == QuickOpenPanel.Metrics.textRow)
        #endif
    }

    /// Round 7 captures: Go to Note found nothing for "renovaton". When nothing holds the query
    /// as typed, a note a letter off is found, with its line shown around the word it holds.
    @Test func goToNoteForgivesATypo() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let n = c.mainContext.createNote(in: .all, body: "Kitchen plans\n\nAsk about the renovation budget\nBlue tiles")
        _ = c.mainContext.createNote(in: .all, body: "Garden\n\nPlant the beans")
        try c.mainContext.save()
        let hits = await QuickOpen.textHits(for: "renovaton", in: c)
        #expect(hits.map(\.id) == [n.id])
        #expect(hits.first?.snippet.text == "Ask about the renovation budget")
        #expect(await QuickOpen.textHits(for: "zzzzzz", in: c).isEmpty)
    }
    #endif

    @Test func aWholeTitleIsATopHit() {
        let sections = [("Today", ["Lisbon 7 day plan", "Groceries"]), ("Previous 30 Days", ["Lisbon 7"])]
        let moved = DateBucket.withTopHits(sections) { DateBucket.isWholeTitle($0, query: " lisbon 7 ") }
        #expect(moved.map(\.0) == ["Top Hits", "Today"])
        #expect(moved.map(\.1) == [["Lisbon 7"], ["Lisbon 7 day plan", "Groceries"]])
        #expect(DateBucket.isWholeTitle("Café", query: "cafe"))
        #expect(!DateBucket.isWholeTitle("Lisbon 7 day plan", query: "Lisbon 7"))
        let same = DateBucket.withTopHits(sections) { _ in false }
        #expect(same.map(\.0) == sections.map(\.0))
    }

    #if os(macOS)
    /// The panel shows the lines and the count, read through accessibility far off the screen.
    @Test func thePanelShowsTheLinesAndTheCount() async throws {
        let hit = QuickOpen.TextHit(id: UUID(), title: "Trip ideas", folder: "Travel", date: .now,
                                    snippet: .init(before: "Fly to ", match: "Lisbon", after: " on Friday"),
                                    others: [.init(before: "Tram 28 across ", match: "lisbon", after: ""), .init(before: "", match: "Lisbon", after: " cards for the museums")],
                                    more: 4)
        let panel = QuickOpenPanel(notes: [], commands: [], choose: { _ in }, close: {}, initialQuery: "lisbon", initialTextHits: [hit])
        let ax = OffscreenAX(panel, size: CGSize(width: QuickOpenPanel.Metrics.width, height: 360))
        defer { ax.close() }
        await ax.settle()
        // One element to VoiceOver, saying all that the row shows.
        let row = try #require(ax.find("quickOpen.row"), "\(ax.ids())")
        #expect(row.text.contains("Fly to Lisbon on Friday") && row.text.contains("Tram 28 across lisbon"), "\(row.text)")
        #expect(row.text.contains("4 more in this note"), "\(row.text)")
    }

    /// The list's search: a row shows the lines that hold the text and the count, as one element.
    @Test func theListRowShowsTheLinesAndTheCount() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let n = c.mainContext.createNote(in: .all, body: Self.trip)
        let ax = OffscreenAX(NoteRow(note: n, query: "lisbon").frame(width: 300).padding(10).modelContainer(c), size: CGSize(width: 320, height: 160))
        defer { ax.close() }
        await ax.settle()
        let row = try #require(ax.find("note.Lisbon trip"), "\(ax.ids())")
        for line in ["Fly to Lisbon on Friday", "across lisbon", "Lisbon cards for the museums", "4 more in this note"] {
            #expect(row.text.contains(line), "\(line): \(row.text)")
        }
        // No search: the preview, no count.
        let plain = OffscreenAX(NoteRow(note: n).frame(width: 300).padding(10).modelContainer(c), size: CGSize(width: 320, height: 160))
        defer { plain.close() }
        await plain.settle()
        #expect(plain.find("note.Lisbon trip")?.text.contains("more in this note") == false)
    }
    #endif
}
