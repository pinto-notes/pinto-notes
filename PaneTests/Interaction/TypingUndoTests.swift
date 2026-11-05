#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// ⌘Z after typing goes back a line at a time. It took everything typed since the caret last
/// moved: three lines typed into a new note went back to the empty title on one press, and came
/// back on one Redo (persona council r7d, a real Mac window).
///
/// The text view folds typing into one Undo step while it is coalescing; Return ends that. The
/// harness has no event loop to close undo groups, so the steps themselves are checked in a real
/// window (council shots, real-mac-undo); here, that Return ends the run.
@MainActor @Suite(.serialized) struct TypingUndoTests {
    @Test func returnEndsTheRunOfTypingThatUndoTakes() async throws {
        let h = await EditorHarness("Porto weekend", width: 640, focus: true)
        defer { h.close() }
        h.view.setSelectedRange(NSRange(location: 13, length: 0))
        for ch in " trip" { await h.key(0, String(ch)) }
        #expect(h.text == "Porto weekend trip")
        #expect(h.view.isCoalescingUndo, "typing folds into one step")

        // What Return asks first, before the text view inserts the line.
        let handled = h.view.textView(h.view, doCommandBy: #selector(NSResponder.insertNewline(_:)))
        #expect(!handled, "a plain line: the text view inserts it")
        #expect(!h.view.isCoalescingUndo, "the next typing starts a new step")
    }

    /// A cell's keys close together are one step of Undo, and Redo brings them back.
    @Test func aCellsTypingIsOneStep() async throws {
        let base = "Porto\n\n| Day | Plan |\n| --- | --- |\n| Sat | x |\n"
        let h = await EditorHarness(base, width: 640, focus: true)
        defer { h.close() }
        let undo = try #require(h.view.undoManager)
        undo.groupsByEvent = false
        defer { undo.groupsByEvent = true }
        var text = base
        for letters in ["xa", "xab", "xabc"] {
            let table = try #require(GridTable.find(in: text).first)
            var edited = table
            edited.rows[1][1] = letters
            // A group around the first key only: the event loop makes none for a key that registers
            // nothing, and an empty one here would take the Undo.
            let first = letters == "xa"
            if first { undo.beginUndoGrouping() }
            h.view.applyCellEdit(TextEdit(range: table.range, replacement: edited.markdown, caret: -1))
            if first { undo.endUndoGrouping() }
            text = h.text
        }
        #expect(h.text.contains("xabc"))
        undo.undo(); await h.settle()
        #expect(h.text == base, "back to before the first key")
        undo.redo(); await h.settle()
        #expect(h.text.contains("xabc"), "and all of it again")
    }

    /// Words on one line are still one step, as in Notes.
    @Test func typingOnALineStaysOneRun() async throws {
        let h = await EditorHarness("Title", width: 640, focus: true)
        defer { h.close() }
        h.view.setSelectedRange(NSRange(location: 5, length: 0))
        for ch in " one two" { await h.key(0, String(ch)) }
        #expect(h.view.isCoalescingUndo)
    }
}
#endif
