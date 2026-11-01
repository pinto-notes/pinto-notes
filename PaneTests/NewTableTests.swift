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
