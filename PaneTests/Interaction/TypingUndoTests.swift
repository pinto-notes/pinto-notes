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
