#if os(macOS)
import AppKit
import Testing
@testable import Pane

@MainActor @Suite(.serialized) struct TableInteractionTests {
    static let note = """
    Shortcuts

    Everything you can do from the keyboard is here.

    | Shortcut | Does |
    | --- | --- |
    | ⌘B | Bold |
    | ⌘⇧L | Checklist |

    After the table
    """

    var tableRange: NSRange { GridTable.find(in: Self.note)[0].range }

    @Test func clickBelowTableNeverShowsSource() async {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        #expect(h.gridCount == 1)
        let r = h.lineRect(at: tableRange.location)
        await h.snapshot("table-before-click")
        // Just below the grid, and to the right of its last row.
        for p in [CGPoint(x: 200, y: r.maxY + 4), CGPoint(x: h.view.bounds.width - 10, y: r.maxY - 10), CGPoint(x: h.view.bounds.width - 10, y: r.maxY + 2)] {
            await h.click(p)
            let sel = h.selection
            #expect(!(sel.location >= tableRange.location && sel.location <= NSMaxRange(tableRange)), "caret \(sel.location) inside table \(tableRange) after click at \(p)")
            #expect(h.gridCount == 1, "table flipped to source after click at \(p)")
        }
        await h.snapshot("table-after-click")
    }
}
#endif

#if os(macOS)
extension TableInteractionTests {
    @Test func arrowDownEntersTheTableAndOutAgain() async {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await h.caret(after: "is here.")
        await h.press(EditorHarness.down) // blank line
        await h.press(EditorHarness.down) // into the table
        #expect(h.gridCount == 1)
        // The keyboard moves between cells a few run-loop turns after the key: each press waits
        // for it to land, or on a busy runner the next press arrives mid-move and is lost.
        #expect(await h.until { h.gridHasFocus }, "arrowing down into a table should put the keyboard in its first cell")
        await h.snapshot("table-arrow-in")
        for row in 1...2 {
            let from = h.focusedGridField
            await h.press(EditorHarness.down)
            #expect(await h.until { h.focusedGridField.map { $0 !== from } ?? false }, "down moves the keyboard to row \(row)")
        }
        await h.press(EditorHarness.down) // past the last row
        #expect(await h.until { !h.gridHasFocus })
        #expect(h.selection.location > NSMaxRange(tableRange), "leaving the table from the bottom lands after it")
    }

    @Test func tableAtEndOfNoteGetsALineAfterOnClick() async {
        let text = "Title\n\n| a | b |\n| --- | --- |\n| 1 | 2 |"
        let h = await EditorHarness(text)
        defer { h.close() }
        let r = h.lineRect(at: GridTable.find(in: text)[0].range.location)
        await h.click(CGPoint(x: 300, y: r.maxY + 6))
        await h.settle(0.1)
        let ok = h.text.hasSuffix("| 1 | 2 |\n")
        #expect(ok, "a line appears after the table for the caret: \(h.text.debugDescription.replacingOccurrences(of: "\\n", with: "⏎")) sel \(h.selection)")
        #expect(h.selection.location == (h.text as NSString).length)
        #expect(h.gridCount == 1)
    }

    @Test func selectAllKeepsTheGrid() async {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        h.view.selectAll(nil)
        await h.settle()
        #expect(h.gridCount == 1)
        #expect(h.overlays.count >= 1)
    }
}
#endif

#if os(macOS)
extension TableInteractionTests {
    @Test func arrowingIntoACellDoesNotSelectItsText() async {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await h.caret(after: "is here.")
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.down)
        await h.settle(0.1)
        let editor = h.window.firstResponder as? NSTextView
        #expect(editor !== h.view)
        #expect(editor?.selectedRange().length == 0, "the cell's text shouldn't be selected")
        #expect(editor?.selectedRange().location == 8, "caret after “Shortcut”")
    }

    @Test func backspaceAfterATableSelectsThenDeletesIt() async {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        let t = tableRange
        await h.select(NSMaxRange(t) + 1) // start of the blank line after the table
        await h.command(#selector(NSResponder.deleteBackward(_:)))
        #expect(h.view.core.armedGrid == 0, "first press marks the table")
        #expect(h.text == Self.note, "nothing deleted yet")
        await h.snapshot("table-selected")
        await h.command(#selector(NSResponder.deleteBackward(_:)))
        #expect(!h.text.contains("| ⌘B"), "second press removes it")
        #expect(h.text.contains("is here.\n\n\nAfter the table"), "\(h.text.debugDescription)")
        #expect(h.gridCount == 0)
    }

    @Test func typingAfterMarkingATableKeepsIt() async {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await h.select(NSMaxRange(tableRange) + 1)
        await h.command(#selector(NSResponder.deleteBackward(_:)))
        await h.type("x")
        #expect(h.view.core.armedGrid == nil)
        await h.command(#selector(NSResponder.deleteBackward(_:)))
        #expect(h.text.contains("| ⌘B"), "the table survives: the second Delete removed the x")
    }

    @Test func backspaceAfterAnEmbedRemovesItWholeNotHalf() async {
        let text = "Links\n\nhttps://example.com\nNext line"
        let h = await EditorHarness(text)
        defer { h.close() }
        await h.caret(after: "example.com\n")
        await h.command(#selector(NSResponder.deleteBackward(_:)))
        #expect(h.text == "Links\n\nNext line")
    }
}
#endif

#if os(macOS)
extension TableInteractionTests {
    /// On a busy main thread, the ask for the keyboard can come before the next cell's field is
    /// in the window and be turned down. The grid keeps asking, so the keyboard still arrives
    /// and the next arrow key moves on (in CI the table had lost the keyboard for good).
    @Test func focusTurnedDownForAMomentStillLands() async throws {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        let window = try #require(h.window as? KeyableWindow)
        await h.caret(after: "is here.")
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.down)
        #expect(await h.until { h.gridHasFocus })
        let from = h.focusedGridField
        window.refusesFirstResponder = true
        await h.press(EditorHarness.down)
        await h.settle(0.3)
        window.refusesFirstResponder = false
        #expect(await h.until { h.focusedGridField.map { $0 !== from } ?? false }, "the keyboard reaches row 1 once the window takes it again")
        let row1 = h.focusedGridField
        await h.press(EditorHarness.down)
        #expect(await h.until { h.focusedGridField.map { $0 !== row1 } ?? false }, "and the next arrow moves on to row 2")
    }
}
#endif

#if os(macOS)
extension TableInteractionTests {
    /// What you type right after making a table goes into its first cell.
    static func typeIntoFocusedCell(_ h: EditorHarness, _ s: String) {
        (h.window.firstResponder as? NSTextView)?.insertText(s, replacementRange: NSRange(location: NSNotFound, length: 0))
    }

    /// The Table button puts the keyboard in the new table's first cell, ready to type, like
    /// Notes (in 1.2 the caret stayed in the text under the table until you clicked a cell).
    @Test func aNewTableTakesTheKeyboardInItsFirstCell() async {
        let h = await EditorHarness("To play\n\n- Hades\n- Factorio\n")
        defer { h.close() }
        await h.select((h.text as NSString).length)
        h.controller.insertTable()
        #expect(await h.until(5) { h.gridHasFocus }, "the keyboard is in the table")
        Self.typeIntoFocusedCell(h, "Game")
        #expect(await h.until(5) { h.text.contains("| Game |   |\n| --- | --- |\n|   |   |") }, "typed into the first header cell: \(h.text.debugDescription)")
    }

    @Test func aNewTableUnderAnotherTakesTheKeyboardToo() async {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await h.caret(after: "After the table")
        h.controller.insertTable()
        #expect(await h.until(5) { h.gridHasFocus }, "the keyboard is in the new table")
        Self.typeIntoFocusedCell(h, "Game")
        #expect(await h.until(5) { h.text.hasSuffix("After the table\n| Game |   |\n| --- | --- |\n|   |   |\n") }, "typed into the new table, not the one above: \(h.text.debugDescription)")
    }
}
#endif

#if os(macOS)
extension TableInteractionTests {
    /// Clicking back into the text ends the table's claim on the keyboard: a table laid out
    /// again later (a sync, a resize) must not pull the caret out of the text.
    @Test func theTextTakingTheKeyboardBackEndsTheTablesClaim() async {
        let h = await EditorHarness("To play\n\n- Hades\n")
        defer { h.close() }
        await h.select((h.text as NSString).length)
        h.controller.insertTable()
        #expect(await h.until(5) { h.gridHasFocus })
        // The grid keeps asking for the keyboard until it knows it has it (a few turns).
        await h.settle(0.5)
        h.window.makeFirstResponder(h.view)
        #expect(h.view.core.gridFocus == nil)
        h.view.layoutCards(animated: false)
        await h.settle(0.3)
        #expect(!h.gridHasFocus, "the keyboard stays in the text")
    }

    /// Over a table or card the pointer belongs to that view; over text it is the text view's.
    @Test func thePointerOverATableIsTheTablesToSet() async {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        let row = h.lineRect(at: tableRange.location)
        #expect(h.view.card(at: CGPoint(x: 200, y: row.minY + GridMetrics.handle + 10)) == "g0")
        #expect(h.view.card(at: CGPoint(x: 200, y: h.lineRect(at: 0).midY)) == nil)
        #expect(h.view.card(at: CGPoint(x: 200, y: h.lineRect(at: (Self.note as NSString).length).midY)) == nil)
    }
}
#endif

#if os(macOS)
extension TableInteractionTests {
    /// A tracker as a template or an AI makes one: a hidden line gives its columns types.
    static let tracker = """
    Evening tracker

    <!-- pane-table: Date=date; Hours=number; Mood=choice Good|Ok|Bad; Diet on plan=choice Yes|No -->
    | Date | Hours | Mood | Diet on plan |
    | --- | --- | --- | --- |
    | 2026-10-10 | 7.5 | Good | Yes |
    | 2026-10-11 | 6 |  | No |

    After
    """

    /// Tab, waiting for the keyboard to land in the next cell with its caret after the text.
    /// A cell's field selects all of its text as it takes the keyboard, and the grid moves the
    /// caret to the end a turn or two later; a key typed in between replaced the whole cell
    /// (on a slow CI runner "2026-10-11" became "!").
    private func tab(_ h: EditorHarness) async -> Bool {
        let from = h.focusedGridField
        await h.press(EditorHarness.tab)
        return await h.until {
            guard h.focusedGridField.map({ $0 !== from }) ?? false, let editor = h.window.firstResponder as? NSTextView else { return false }
            return editor.selectedRange() == NSRange(location: (editor.string as NSString).length, length: 0)
        }
    }

    /// Tables are plain for people: a column with a list of answers is a cell you type in, like
    /// any other (it was a menu you could not type into), and the hidden type line stays as it
    /// was for the AI tools and note apps that read it. A Yes/No column keeps its tick.
    @Test func aTypedTableIsTypedIntoLikeAPlainOne() async {
        let h = await EditorHarness(Self.tracker, dark: true)
        defer { h.close() }
        await h.snapshot("table-plain-tracker")
        await h.caret(after: "Evening tracker")
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.down)
        #expect(await h.until { h.gridHasFocus })
        // Across the header, then Date and Hours of the first row, to its Mood cell.
        for step in 1...6 { #expect(await tab(h), "tab \(step)") }
        Self.typeIntoFocusedCell(h, " day")
        #expect(await h.until(5) { h.text.contains("| 2026-10-10 | 7.5 | Good day | Yes |") }, "typed into the Mood cell: \(h.text.debugDescription)")
        // The tick is not a text cell: Tab goes past it to the next row.
        #expect(await tab(h))
        Self.typeIntoFocusedCell(h, "!")
        #expect(await h.until(5) { h.text.contains("| 2026-10-11! | 6 |") }, "Tab skipped the tick; cell \(String(describing: (h.window.firstResponder as? NSTextView)?.string)): \(h.text.debugDescription)")
        #expect(h.text.contains("<!-- pane-table: Date=date; Hours=number; Mood=choice Good|Ok|Bad; Diet on plan=choice Yes|No -->"), "the type line is untouched")
    }
}
#endif
