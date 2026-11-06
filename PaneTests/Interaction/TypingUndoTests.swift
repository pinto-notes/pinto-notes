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

    /// Typing inside a cell's word, then Undo: the caret goes back to where the typing began, so the
    /// next key lands there (it went to the end of the cell). Redo puts it after the typing again.
    @Test func undoInACellPutsTheCaretBack() async throws {
        let base = "Porto\n\n| Seafood | Plan |\n| --- | --- |\n| Sat | Sea |\n"
        let h = await EditorHarness(base, width: 640, focus: true)
        defer { h.close() }
        await h.caret(after: "Porto")
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.down)
        #expect(await h.until(5) { h.gridHasFocus })
        await h.settle(0.3)
        let undo = try #require(h.view.undoManager)
        undo.groupsByEvent = false
        defer { undo.groupsByEvent = true }
        func editor() throws -> NSTextView { try #require(h.window.firstResponder as? NSTextView) }
        // The caret comes back a moment after the change: wait for it, the machine may be busy.
        func caret(at location: Int) async -> Bool {
            await h.until(5) { (h.window.firstResponder as? NSTextView)?.selectedRange() == NSRange(location: location, length: 0) }
        }
        try editor().setSelectedRange(NSRange(location: 3, length: 0))
        undo.beginUndoGrouping()
        for ch in "xy" { TableInteractionTests.typeIntoFocusedCell(h, String(ch)); await h.settle(0.02) }
        await h.settle(0.2)
        undo.endUndoGrouping()
        #expect(try editor().string == "Seaxyfood")
        #expect(await caret(at: 5))

        undo.undo(); await h.settle(0.5)
        #expect(try editor().string == "Seafood")
        #expect(await caret(at: 3), "back where the typing began")
        undo.redo(); await h.settle(0.5)
        #expect(try editor().string == "Seaxyfood")
        #expect(await caret(at: 5), "after the typing")
        undo.undo()
        #expect(await caret(at: 3))
        await h.settle(0.2)
        undo.beginUndoGrouping()
        TableInteractionTests.typeIntoFocusedCell(h, "z"); await h.settle(0.2)
        undo.endUndoGrouping()
        #expect(try editor().string == "Seazfood", "the next key lands there")
    }

    /// Two keys, and the first one's copy of the table comes back after the second is in: it's
    /// ignored, the last one's isn't, and later on an old-looking table (an Undo) goes in.
    @Test func anOlderCopyOfACellsTypingDoesntOverwriteIt() {
        func table(_ cell: String) -> GridTable { GridTable.find(in: "| \(cell) | b |\n| --- | --- |\n| 1 | 2 |\n")[0] }
        let start = Date.now
        let echoes = GridEchoes()
        echoes.sent(table("Seax"), at: start)
        echoes.sent(table("Seaxy"), at: start)
        #expect(echoes.isStale(table("Seax"), at: start))
        #expect(!echoes.isStale(table("Seaxy"), at: start), "the newest")
        #expect(!echoes.isStale(table("Seax"), at: start), "nothing on its way any more: this is an Undo")

        echoes.sent(table("Seax"), at: start)
        echoes.sent(table("Seaxy"), at: start)
        #expect(!echoes.isStale(table("Sea"), at: start), "not a copy: an Undo or someone else")
        echoes.sent(table("Seax"), at: start)
        echoes.sent(table("Seaxy"), at: start)
        #expect(!echoes.isStale(table("Seax"), at: start.addingTimeInterval(2)), "too long after the key")
    }

    /// ⌘B stepping out of bold only moves the caret: no press of ⌘Z goes on it.
    @Test func steppingOutOfBoldIsNoStepOfUndo() async throws {
        let text = "plain **bold**"
        let h = await EditorHarness(text, width: 640, focus: true)
        defer { h.close() }
        let undo = try #require(h.view.undoManager)
        undo.removeAllActions()
        h.view.setSelectedRange(NSRange(location: (text as NSString).length - 2, length: 0))
        h.controller.bold()
        await h.settle()
        #expect(h.text == text)
        #expect(h.view.selectedRange().location == (text as NSString).length, "past the close")
        #expect(!undo.canUndo)
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
