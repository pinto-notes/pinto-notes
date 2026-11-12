#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// New Note in a folder whose list had no "Today" yet: the new row came in cut off at about half
/// its height, the selection's lower half and the date line missing, until the list was scrolled
/// (Emil, 12 November 2026, Mac 1.3.2). In the window's middle column SwiftUI's table inserts the
/// rows with their estimated heights (a 24 pt row, a 28 pt heading) and never asks again; each row
/// view clips to its bounds, so the 62 pt row was drawn in 24. The real window, offscreen, never
/// scrolled; New Note pressed through Accessibility, no global events.
@MainActor @Suite(.serialized) struct NewNoteRowTests {
    /// A folder named Journal with two notes from November 2024, and, with `today`, one from today.
    static func container(today: Bool) throws -> (ModelContainer, Folder) {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        Seed.ensureLibrary(ctx, demo: false)
        let journal = ctx.createFolder(named: "Journal")
        let old = try #require(Calendar.current.date(from: DateComponents(year: 2024, month: 11, day: 12, hour: 9)))
        for (i, body) in ["Journal Entry #1\nA walk by the water", "Journal Entry #2\nRain all day"].enumerated() {
            let n = ctx.createNote(in: .folder(journal.id), body: body)
            n.createdAt = old.addingTimeInterval(Double(-i) * 3600)
            n.updatedAt = n.createdAt
        }
        if today { ctx.createNote(in: .folder(journal.id), body: "Morning pages\nCoffee first") }
        try ctx.save()
        return (c, journal)
    }

    /// Each row of the table: its height, and the height of what it holds (a note's cell, a heading).
    static func rows(_ table: NSTableView) -> [(row: CGFloat, content: CGFloat?)] {
        (0..<table.numberOfRows).map { r in
            let content = table.rowView(atRow: r, makeIfNecessary: true)?.subviews
                .first { String(describing: type(of: $0)).hasPrefix("ListTable") }?.frame.height
            return (table.rect(ofRow: r).height, content)
        }
    }

    /// The notes window in `journal` with `open` showing; New Note pressed; the list as it is
    /// then, without a scroll.
    static func newNote(_ c: ModelContainer, in journal: Folder, from open: String) async throws -> (before: Int, table: NSTableView, window: NSWindow) {
        let d = UserDefaults.standard
        d.set(try JSONEncoder().encode(Scope.folder(journal.id)), forKey: "lastScope")
        let note = try #require(c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == open })
        d.set(note.id.uuidString, forKey: "lastNote")
        let w = MacWindowChromeTests.window(c, size: CGSize(width: 1280, height: 800))
        await MacWindowChromeTests.settle(w, 4)
        let table = try MacEmptyDetailTests.list(w)
        let before = table.numberOfRows
        let views = (w.toolbar?.items ?? []).compactMap(\.view)
        let button = try #require(views.lazy.compactMap { MacEmptyDetailTests.element("list.newNote", in: $0) }.first
                                  ?? MacEmptyDetailTests.element("list.newNote", in: w.contentView!.superview!), "the list's New Note")
        // A menu with a primary action is a segmented control: its click is its segment's press.
        let segment = (button.value(forKey: "accessibilityChildren") as? [NSObject])?.first ?? button
        _ = segment.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
        await MacWindowChromeTests.settle(w, 6)
        return (before, table, w)
    }

    /// Runs `body` with Accessibility asking (SwiftUI builds the toolbar's tree only then), and the
    /// window's last folder and note put back after.
    static func withWindowState(_ body: () async throws -> Void) async throws {
        let d = UserDefaults.standard
        let keepNote = d.object(forKey: "lastNote"), keepScope = d.object(forKey: "lastScope")
        let ax = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
        NSApp.accessibilitySetValue(true, forAttribute: ax)
        defer {
            NSApp.accessibilitySetValue(false, forAttribute: ax)
            if let keepNote { d.set(keepNote, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let keepScope { d.set(keepScope, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        try await body()
    }

    /// Every row as tall as what it holds, and every note row as tall as the last one (there before).
    static func expectWhole(_ table: NSTableView, rows expected: Int, _ when: String) {
        let rows = Self.rows(table)
        #expect(rows.count == expected, "\(when): \(rows.count) rows, \(expected) expected")
        let noteHeight = rows.last?.row ?? 0
        for (r, (row, content)) in rows.enumerated() {
            guard let content else { Issue.record("\(when): row \(r) holds nothing"); continue }
            #expect(row >= content - 0.5, "\(when): row \(r) is \(row) pt and cuts off its \(content) pt content")
            if !table.isHeadingRow(r) { #expect(abs(row - noteHeight) < 0.5, "\(when): note row \(r) is \(row) pt, the others \(noteHeight)") }
        }
    }

    @Test func newNoteWithoutTodayShowsItsWholeRow() async throws {
        let (c, journal) = try Self.container(today: false)
        try await Self.withWindowState {
            let (before, table, w) = try await Self.newNote(c, in: journal, from: "Journal Entry #1")
            defer { w.close() }
            // November 2024 and its two notes; then Today and the new note over them.
            #expect(before == 3)
            #expect(table.isHeadingRow(0) && !table.isHeadingRow(1))
            Self.expectWhole(table, rows: 5, "a new Today")
        }
    }

    @Test func newNoteUnderTodayShowsItsWholeRow() async throws {
        let (c, journal) = try Self.container(today: true)
        try await Self.withWindowState {
            let (before, table, w) = try await Self.newNote(c, in: journal, from: "Morning pages")
            defer { w.close() }
            // Today with one note, November 2024 with two; then a second note under Today.
            #expect(before == 5)
            Self.expectWhole(table, rows: 6, "Today already there")
        }
    }
}
#endif
