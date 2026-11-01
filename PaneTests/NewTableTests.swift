import Foundation
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// A new table from Insert Table (Emil's table walkthrough, 1 November 2026).
@MainActor @Suite struct NewTableTests {
    /// On the empty line under a line of text, the text stays text: it isn't drawn as the table's header.
    @Test func theLineAboveStaysText() throws {
        let text = "Trip\n\nPacking next.\n"
        let (edit, index) = EditorCore().newGridEdit(text: text, selection: NSRange(location: (text as NSString).length, length: 0))
        let after = (text as NSString).replacingCharacters(in: edit.range, with: edit.replacement)
        #expect(index == 0)
        let storage = NoteBlockLookTests.styled(after)
        let decoration = NoteBlockLookTests.decoration(storage, at: "Packing next.")
        #expect(decoration == nil, "the text above the table has no table fill")
        #expect(after.hasPrefix("Trip\n\nPacking next.\n\n|"), "a blank line between the text and the table")
        #expect(GridTable.find(in: after).count == 1)
        #expect(GridTable.find(in: after)[0].rows.allSatisfy { $0.allSatisfy(\.isEmpty) }, "the new table is empty")
    }

    /// Under a line of text with the caret on it, the table goes below with a blank line between.
    @Test func afterALineOfText() throws {
        let text = "Trip\n\nPacking next."
        let (edit, _) = EditorCore().newGridEdit(text: text, selection: NSRange(location: (text as NSString).length, length: 0))
        let after = (text as NSString).replacingCharacters(in: edit.range, with: edit.replacement)
        #expect(after.hasPrefix("Trip\n\nPacking next.\n\n|"))
        #expect(NoteBlockLookTests.decoration(NoteBlockLookTests.styled(after), at: "Packing next.") == nil)
    }
}

/// Where a table's view takes clicks: its grid, and around it only its handles and add bars.
@MainActor @Suite struct GridHitBoxTests {
    @Test func theBandsAroundATableLetClicksThrough() {
        let box = GridHitBox()
        let size = CGSize(width: 400, height: GridMetrics.reach + 120 + GridMetrics.growBelow)
        #expect(box.takes(CGPoint(x: 100, y: GridMetrics.reach + 40), in: size), "the grid is the table's")
        #expect(!box.takes(CGPoint(x: 100, y: size.height - 5), in: size), "the strip below goes to the text")
        #expect(!box.takes(CGPoint(x: size.width - 5, y: 60), in: size), "the strip at the right goes to the text")
        box.adds[.row] = CGRect(x: 16, y: size.height - 18, width: 300, height: 16)
        box.adds[.column] = CGRect(x: size.width - 20, y: 30, width: 16, height: 80)
        #expect(box.takes(CGPoint(x: 100, y: size.height - 10), in: size), "the add-row bar is the table's")
        #expect(box.takes(CGPoint(x: size.width - 10, y: 60), in: size), "the add-column bar is the table's")
        #expect(!box.takes(CGPoint(x: 360, y: size.height - 5), in: size), "beside the bar, the text")
        #expect(!box.takes(CGPoint(x: 500, y: 60), in: size), "outside, never")
    }
}

/// A table's handles are big enough to be seen and fit their strip (Emil, 1 November 2026).
@Suite struct GridGripTests {
    @Test func gripsAreSeenAndFitTheirStrip() {
        #expect(GridMetrics.grip.height >= 30 && GridMetrics.grip.width >= 16, "they were 14 by 24")
        #expect(GridMetrics.grip.width <= GridMetrics.handle, "a row grip stays in the handle strip")
    }
}
