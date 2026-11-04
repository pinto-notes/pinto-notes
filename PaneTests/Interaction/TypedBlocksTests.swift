#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// Tables and links typed key by key on the Mac, and Undo straight after (persona council r7,
/// bugs 12 to 14): a block that forms under the caret mid-typing mustn't push the rest of the
/// line onto a new one, and a deferred caret fix mustn't land after an Undo.
@MainActor @Suite(.serialized) struct TypedBlocksTests {
    func typeKeys(_ h: EditorHarness, _ s: String) async {
        for ch in s {
            if ch == "\n" { await h.press(EditorHarness.returnKey) } else { await h.key(0, String(ch)) }
        }
    }

    /// Bug 13: the address became a chip at "https://w" and the rest went onto the next line.
    @Test func anAddressTypedOnItsOwnLineStaysWhole() async {
        let h = await EditorHarness("Porto\n")
        defer { h.close() }
        await h.select((h.text as NSString).length)
        await typeKeys(h, "https://www.visitporto.travel/en-GB")
        #expect(h.text == "Porto\nhttps://www.visitporto.travel/en-GB", "\(h.text.debugDescription)")
        await h.snapshot("typed-address-caret")
        await typeKeys(h, "\nNext")
        #expect(h.text.hasPrefix("Porto\nhttps://www.visitporto.travel/en-GB\n"), "\(h.text.debugDescription)")
        #expect(h.text.hasSuffix("Next"), "the caret left the link's line: \(h.text.debugDescription)")
    }

    /// Bug 14: a line break landed after "| -", so only the header row became a table.
    @Test func aTableTypedByHandStaysOneTable() async {
        let h = await EditorHarness("Porto\n")
        defer { h.close() }
        await h.select((h.text as NSString).length)
        await typeKeys(h, "| Day | Plan |\n| --- | --- |")
        #expect(h.text == "Porto\n| Day | Plan |\n| --- | --- |", "\(h.text.debugDescription)")
        await h.snapshot("typed-table-caret")
        await typeKeys(h, "\n| Fri | Ribeira |\nAfter")
        await h.snapshot("typed-table-rows")
        #expect(h.text == "Porto\n| Day | Plan |\n| --- | --- |\n| Fri | Ribeira |\nAfter", "\(h.text.debugDescription)")
    }

    /// A table straight under the title, with a plain line straight under it: the title and that
    /// line were set as table source, grey and monospaced, typed or opened (persona r7).
    @Test func linesTouchingATableKeepTheirOwnLook() async {
        let note = "Porto\n| Day | Plan |\n| --- | --- |\n| Fri | Ribeira |\nAfter"
        let h = await EditorHarness(note)
        defer { h.close() }
        await h.select(2)
        let ns = h.text as NSString, storage = h.view.textStorage!
        func mono(_ word: String) -> Bool {
            let f = storage.attribute(.font, at: ns.range(of: word).location, effectiveRange: nil) as? NSFont
            return f?.fontDescriptor.symbolicTraits.contains(.monoSpace) == true
        }
        #expect(!mono("Porto"), "the title")
        #expect(!mono("After"), "the line under the table")
        #expect(storage.attribute(.font, at: 0, effectiveRange: nil) as? NSFont == MarkdownStyler.titleFont)
        await h.snapshot("typed-table-neighbours")
    }

    /// Bug 12: a caret fix worked out before an Undo was applied after it, past the end
    /// (NSRangeException in `resolve`).
    @Test func undoBeforeADeferredCaretFixDoesNotCrash() async {
        let h = await EditorHarness("Porto weekend\n")
        defer { h.close() }
        await h.select((h.text as NSString).length)
        await h.type("\n| a | b |\n| --- | --- |\n| 1 | 2 |")
        await h.settle(0.2)
        let typed = h.text
        // In the table at the end: the fix is a new line after it, one run-loop turn later.
        h.view.setSelectedRange(NSRange(location: (typed as NSString).length - 3, length: 0))
        // The Undo runs first.
        h.view.undoManager?.undo()
        let undone = h.text
        #expect(undone != typed)
        await h.settle(0.2)
        #expect(h.text == undone, "the late fix was dropped: \(h.text.debugDescription)")
    }
}
#endif
