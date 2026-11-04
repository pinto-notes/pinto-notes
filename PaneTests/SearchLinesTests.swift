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
    #endif

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
        let more = try #require(ax.find("quickOpen.more"), "\(ax.ids())")
        #expect(more.text.contains("4 more in this note"), "\(more.text)")
    }

    /// The list's search: a row shows the lines that hold the text and the count, as one element.
    @Test func theListRowShowsTheLinesAndTheCount() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let n = c.mainContext.createNote(in: .all, body: Self.trip)
        let ax = OffscreenAX(NoteRow(note: n, query: "lisbon").frame(width: 300).padding(10).modelContainer(c), size: CGSize(width: 320, height: 160))
        defer { ax.close() }
        await ax.settle()
        let row = try #require(ax.find("note.Lisbon trip"), "\(ax.ids())")
        for line in ["Fly to Lisbon on Friday", "Tram 28 across lisbon", "Lisbon cards for the museums", "4 more in this note"] {
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
