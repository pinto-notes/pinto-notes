import Foundation
import Testing
#if canImport(AppKit)
import AppKit
#else
import UIKit
#endif
@testable import Pane

/// Collapsible sections (HeadingFolds): which lines a heading hides, and how its state follows edits.
@Suite struct HeadingFoldsTests {
    static let note = "Plan\n# A\na\n## B\nb\n### C\nc\n## D\nd\n# E\ne"

    func headings(_ text: String) -> [HeadingFolds.Heading] {
        HeadingFolds.headings(in: text, code: NoteStructure(text).code)
    }

    func body(_ text: String, _ h: HeadingFolds.Heading) -> String { (text as NSString).substring(with: h.body) }

    @Test func sectionsRunToTheNextHeadingOfTheSameOrAHigherLevel() {
        let t = Self.note
        let hs = headings(t)
        #expect(hs.map(\.title) == ["A", "B", "C", "D", "E"])
        #expect(hs.map(\.level) == [1, 2, 3, 2, 1])
        #expect(body(t, hs[0]) == "a\n## B\nb\n### C\nc\n## D\nd\n")
        #expect(body(t, hs[1]) == "b\n### C\nc\n")
        #expect(body(t, hs[2]) == "c\n")
        #expect(body(t, hs[3]) == "d\n")
        // The last section runs to the note's end.
        #expect(body(t, hs[4]) == "e")
    }

    @Test func aHashInACodeBlockIsNotAHeading() {
        let t = "## A\n```\n# not a heading\n```\nx\n## B\ny"
        let hs = headings(t)
        #expect(hs.map(\.title) == ["A", "B"])
        #expect(body(t, hs[0]) == "```\n# not a heading\n```\nx\n")
    }

    @Test func onlyRealHeadingsCollapse() {
        // A tag, a heading with no text, and a deeper heading (which belongs to the section above).
        let t = "## A\n#tag\n## \n#### Deep\nx\n    # indented code"
        let hs = headings(t)
        #expect(hs.map(\.title) == ["A"])
        #expect(body(t, hs[0]) == "#tag\n## \n#### Deep\nx\n    # indented code")
    }

    @Test func blankLinesAtASectionsEndStayInSight() {
        let t = "## A\nx\n\ny\n\n\n## B\nz\n\n"
        let hs = headings(t)
        #expect(body(t, hs[0]) == "x\n\ny\n")
        #expect(body(t, hs[1]) == "z\n")
    }

    @Test func nothingUnderneathIsNothingToCollapse() {
        let hs = headings("# A\n\n  \n# B\n# C")
        #expect(hs.map(\.foldable) == [false, false, false])
    }

    @Test func hiddenRangesMergeNestedSections() {
        let t = Self.note
        let hs = headings(t)
        // B with C inside it: one range. D's heading stays in sight between B's and D's.
        let hidden = HeadingFolds.hidden(hs, collapsed: [hs[1].location, hs[2].location, hs[3].location])
        #expect(hidden.map { (t as NSString).substring(with: $0) } == ["b\n### C\nc\n", "d\n"])
        // A takes everything up to E, B and D with it.
        let all = HeadingFolds.hidden(hs, collapsed: [hs[0].location, hs[1].location, hs[3].location])
        #expect(all.map { (t as NSString).substring(with: $0) } == ["a\n## B\nb\n### C\nc\n## D\nd\n"])
    }

    @Test func collapsedHeadingsMoveWithEditsAbove() {
        let t = Self.note
        let b = headings(t)[1].location
        // Three letters typed into the title.
        #expect(HeadingFolds.shift([b], edited: NSRange(location: 2, length: 3), delta: 3) == [b + 3])
        // Typing in the heading itself keeps it.
        #expect(HeadingFolds.shift([b], edited: NSRange(location: b + 4, length: 1), delta: 1) == [b])
        // A line deleted above it.
        #expect(HeadingFolds.shift([b], edited: NSRange(location: 5, length: 0), delta: -4) == [b - 4])
        // The heading's own start replaced: it's gone.
        #expect(HeadingFolds.shift([b], edited: NSRange(location: b, length: 0), delta: -3) == [])
    }

    @Test func keysFindTheSameHeadingAgainAndKeepNoText() {
        let t = "# Notes\nx\n## Day\na\n## Day\nb\n"
        let hs = headings(t)
        let keys = HeadingFolds.keys(for: [hs[2].location], in: hs)
        #expect(keys.count == 1)
        #expect(!keys[0].contains("Day"))
        // The second "Day", not the first, even after text is added above.
        let moved = "Intro\n\n" + t
        #expect(HeadingFolds.locations(for: keys, in: headings(moved)) == [hs[2].location + 7])
    }

    @Test func returnAtACollapsedHeadingGoesAfterItsSection() {
        let t = Self.note
        let hs = headings(t)
        let b = hs[1]
        let r = HeadingFolds.returnKey(in: t, selection: NSRange(location: b.textEnd, length: 0), headings: hs, collapsed: [b.location])
        let end = NSMaxRange(b.body)
        #expect(r == TextEdit(range: NSRange(location: end, length: 0), replacement: "\n", caret: end))
        // Not collapsed, or not at the heading's end: Return as usual.
        #expect(HeadingFolds.returnKey(in: t, selection: NSRange(location: b.textEnd, length: 0), headings: hs, collapsed: []) == nil)
        #expect(HeadingFolds.returnKey(in: t, selection: NSRange(location: b.textEnd - 1, length: 0), headings: hs, collapsed: [b.location]) == nil)
        // The last section runs to the end: the new line goes at the end.
        let e = hs[4]
        let len = (t as NSString).length
        #expect(HeadingFolds.returnKey(in: t, selection: NSRange(location: e.textEnd, length: 0), headings: hs, collapsed: [e.location]) == TextEdit(range: NSRange(location: len, length: 0), replacement: "\n", caret: len + 1))
    }

    @Test func aCollapsedSectionKeepsWhereItEnded() {
        // A line added right after it stays out of it; an edit before it moves it.
        #expect(HeadingFolds.shiftEnd(20, edited: NSRange(location: 20, length: 1), delta: 1) == 20)
        #expect(HeadingFolds.shiftEnd(20, edited: NSRange(location: 25, length: 1), delta: 1) == 20)
        #expect(HeadingFolds.shiftEnd(20, edited: NSRange(location: 3, length: 2), delta: 2) == 22)
        #expect(HeadingFolds.shiftEnd(20, edited: NSRange(location: 3, length: 0), delta: -2) == 18)
    }

    @Test func theCaretNeverStaysInAHiddenSection() {
        let t = Self.note
        let len = (t as NSString).length
        let hs = headings(t)
        let b = hs[1]
        let hidden = HeadingFolds.hidden(hs, collapsed: [b.location])
        let inside = b.body.location + 2
        // Coming down from the heading: past the section.
        #expect(HeadingFolds.caret(inside, previous: b.textEnd, hidden: hidden, length: len) == NSMaxRange(b.body))
        // Coming back from below, or placed there: the heading's end.
        #expect(HeadingFolds.caret(NSMaxRange(b.body) - 1, previous: NSMaxRange(b.body), hidden: hidden, length: len) == b.textEnd)
        #expect(HeadingFolds.caret(inside, previous: nil, hidden: hidden, length: len) == b.textEnd)
        // In sight: left alone.
        #expect(HeadingFolds.caret(NSMaxRange(b.body), previous: nil, hidden: hidden, length: len) == nil)
        // The note's end after a last collapsed section counts as inside it.
        let e = hs[4]
        let last = HeadingFolds.hidden(hs, collapsed: [e.location])
        #expect(HeadingFolds.caret(len, previous: e.textEnd, hidden: last, length: len) == e.textEnd)
    }

    @Test func editsReachingIntoASectionOpenIt() {
        let t = Self.note
        let hs = headings(t)
        let b = hs[1]
        // Backspace at the start of the line after it takes the section's last character.
        #expect(HeadingFolds.opened(by: NSRange(location: NSMaxRange(b.body) - 1, length: 1), headings: hs, collapsed: [b.location]) == [b.location])
        // Delete at the heading's end would pull its first line up.
        #expect(HeadingFolds.opened(by: NSRange(location: b.textEnd, length: 1), headings: hs, collapsed: [b.location]) == [b.location])
        // Typing at the heading's end doesn't.
        #expect(HeadingFolds.opened(by: NSRange(location: b.textEnd, length: 0), headings: hs, collapsed: [b.location]).isEmpty)
        // Deleting the heading with its whole section leaves nothing to open.
        #expect(HeadingFolds.opened(by: NSRange(location: b.location, length: NSMaxRange(b.body) - b.location), headings: hs, collapsed: [b.location]).isEmpty)
    }

    @MainActor @Test func stateIsKeptPerNoteOnThisDevice() {
        let saved = FoldStore.defaults
        FoldStore.defaults = TestDefaults()
        defer { FoldStore.defaults = saved }
        let id = UUID()
        let t = Self.note
        let s = FoldState()
        s.noteID = id
        s.update(t, code: [])
        s.toggle(headings(t)[1].location)
        s.update(t, code: [])
        #expect(FoldStore.load(id).count == 1)
        // Another editor on the same note, after a line was added at the top.
        let t2 = "Hello\n" + t
        let s2 = FoldState()
        s2.noteID = id
        s2.update(t2, code: [])
        #expect(s2.collapsed == [headings(t2)[1].location])
        // Opened again: nothing kept.
        s2.expandAll()
        s2.update(t2, code: [])
        #expect(FoldStore.load(id).isEmpty)
    }

    /// A paragraph that counts how often its text is copied out (`attributedString`).
    final class CountingParagraph: NSTextParagraph {
        nonisolated(unsafe) static var copies = 0
        override var attributedString: NSAttributedString { Self.copies += 1; return super.attributedString }
    }

    /// TextKit asks whether to show each paragraph, on screen or not, as it works out a note's
    /// height. The answer is read in the storage: the paragraph's own text isn't copied out for it
    /// (about a tenth of opening a note of 200 lines, 13 November 2026).
    @Test func hiddenLinesAreFoundWithoutCopyingEachParagraph() throws {
        let text = NSMutableAttributedString(string: "Plan\n# A\nhidden\nshown")
        text.addAttribute(.paneFolded, value: true, range: NSRange(location: 9, length: 7))
        // As in the editor: the content storage over the text view's text storage.
        let storage = NSTextContentStorage()
        let backing = NSTextStorage(attributedString: text)
        storage.textStorage = backing
        let delegate = FoldingContentDelegate()
        func paragraph(_ from: Int, _ length: Int) throws -> CountingParagraph {
            let p = CountingParagraph(attributedString: text.attributedSubstring(from: NSRange(location: from, length: length)))
            let start = try #require(storage.location(storage.documentRange.location, offsetBy: from))
            p.elementRange = NSTextRange(location: start, end: storage.location(start, offsetBy: length))
            return p
        }
        CountingParagraph.copies = 0
        #expect(delegate.textContentManager(storage, shouldEnumerate: try paragraph(0, 5), options: []))
        #expect(delegate.textContentManager(storage, shouldEnumerate: try paragraph(5, 4), options: []))
        #expect(!delegate.textContentManager(storage, shouldEnumerate: try paragraph(9, 7), options: []), "a folded line is hidden")
        #expect(delegate.textContentManager(storage, shouldEnumerate: try paragraph(16, 5), options: []))
        #expect(CountingParagraph.copies == 0)
    }
}
