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

    /// The whole way through a real cell: its field, its draft and the note. A burst of typing is
    /// one ⌘Z, the field shows it, and the note and the field stay the same afterwards.
    @Test func undoInACellTakesBackTheBurstAndStays() async throws {
        let base = "Porto\n\n| Day | Plan |\n| --- | --- |\n| Sat | Sea |\n"
        let h = await EditorHarness(base, width: 640, focus: true)
        defer { h.close() }
        await h.caret(after: "Porto")
        await h.press(EditorHarness.down) // blank line
        await h.press(EditorHarness.down) // into the table
        #expect(await h.until(5) { h.gridHasFocus })
        await h.settle(0.3)
        let undo = try #require(h.view.undoManager)
        undo.groupsByEvent = false
        defer { undo.groupsByEvent = true }
        func field() -> String { (h.window.firstResponder as? NSTextView)?.string ?? "<no field>" }
        func burst(_ letters: String) async {
            undo.beginUndoGrouping()
            for ch in letters { TableInteractionTests.typeIntoFocusedCell(h, String(ch)); await h.settle(0.02) }
            await h.settle(0.2)
            undo.endUndoGrouping()
        }
        await burst("abc")
        #expect(h.text.contains("abc"), "typed: \(h.text.debugDescription)")
        #expect(undo.canUndo, "the first burst after the cell took the keyboard is a step")
        undo.undo(); await h.settle(0.5)
        #expect(h.text == base, "one Undo, the whole burst: \(h.text.debugDescription) field \(field())")
        #expect(field() == "Day", "the field shows it: \(field())")
        undo.redo(); await h.settle(0.5)
        #expect(h.text.contains("abc"), "Redo: \(h.text.debugDescription)")
        #expect(field().contains("abc"), "the field too: \(field())")
        undo.undo(); await h.settle(0.5)
        #expect(h.text == base, "and back again: \(h.text.debugDescription)")
        // Straight after an Undo, typing is a step of its own.
        await burst("xy")
        await h.settle(1.6)
        await burst("pq")
        #expect(h.text.contains("xypq"), "both bursts: \(h.text.debugDescription)")
        undo.undo(); await h.settle(0.5)
        #expect(h.text.contains("xy") && !h.text.contains("pq"), "the last burst: \(h.text.debugDescription) field \(field())")
        undo.undo(); await h.settle(0.5)
        #expect(h.text == base, "the one before: \(h.text.debugDescription) field \(field())")
        #expect(field() == "Day", "field: \(field())")
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
