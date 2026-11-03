#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// Collapsible sections in the real Mac editor, offscreen: hidden lines take no room, the caret
/// goes around them, Return goes after them, and the note's text never changes.
@MainActor @Suite(.serialized) struct HeadingFoldInteractionTests {
    static let note = """
    Trip

    ## Packing
    Passport
    Charger

    ## Days
    Walk the old town
    | Day | Place |
    | --- | --- |
    | Mon | Porto |

    ## After
    Photos
    """

    func harness(_ text: String = Self.note) async -> EditorHarness {
        let saved = FoldStore.defaults
        FoldStore.defaults = TestDefaults()
        defer { FoldStore.defaults = saved }
        return await EditorHarness(text)
    }

    func location(_ h: EditorHarness, _ s: String) -> Int { (h.text as NSString).range(of: s).location }

    /// Laid out lines: TextKit's fragments, hidden ones aren't among them.
    func fragmentStarts(_ h: EditorHarness) -> [Int] {
        guard let tlm = h.view.textLayoutManager, let tcm = tlm.textContentManager else { return [] }
        var out: [Int] = []
        tlm.enumerateTextLayoutFragments(from: tcm.documentRange.location, options: [.ensuresLayout]) { f in
            out.append(tcm.offset(from: tcm.documentRange.location, to: f.rangeInElement.location))
            return true
        }
        return out
    }

    @Test func collapsingHidesTheSectionAndKeepsTheText() async {
        let h = await harness()
        defer { h.close() }
        let before = h.text
        let days = location(h, "## Days")
        let yBefore = h.lineRect(at: days).minY
        h.view.toggleFold(location(h, "## Packing"))
        await h.settle()
        #expect(h.text == before)
        // Passport and Charger take no room: Days moved up by their two lines (the blank line stays).
        #expect(!fragmentStarts(h).contains(location(h, "Passport")))
        #expect(!fragmentStarts(h).contains(location(h, "Charger")))
        #expect(fragmentStarts(h).contains(days))
        #expect(h.lineRect(at: days).minY < yBefore - 30)
        // Opened again: back where it was.
        h.view.toggleFold(location(h, "## Packing"))
        await h.settle()
        #expect(fragmentStarts(h).contains(location(h, "Passport")))
        #expect(abs(h.lineRect(at: days).minY - yBefore) < 1)
    }

    @Test func aTableInACollapsedSectionHidesItsGrid() async {
        let h = await harness()
        defer { h.close() }
        await h.until { h.overlays.count == 1 }
        #expect(h.overlays.count == 1)
        h.view.toggleFold(location(h, "## Days"))
        h.view.layoutCards()
        await h.settle()
        #expect(h.overlays.isEmpty)
        h.view.toggleFold(location(h, "## Days"))
        h.view.layoutCards()
        await h.settle()
        #expect(h.overlays.count == 1)
    }

    @Test func arrowKeysGoAroundAHiddenSection() async {
        let h = await harness()
        defer { h.close() }
        let packing = location(h, "## Packing")
        h.view.toggleFold(packing)
        let end = packing + ("## Packing" as NSString).length
        await h.select(end)
        await h.press(EditorHarness.right)
        // The blank line after the section stays in sight: the caret lands there.
        #expect(h.selection.location == location(h, "## Days") - 1)
        await h.press(EditorHarness.left)
        #expect(h.selection.location == end)
        await h.press(EditorHarness.down)
        #expect(h.selection.location == location(h, "## Days") - 1)
        await h.press(EditorHarness.up)
        #expect(NSLocationInRange(h.selection.location, (h.text as NSString).lineRange(for: NSRange(location: packing, length: 0))))
    }

    @Test func returnAtACollapsedHeadingMakesALineAfterItsSection() async {
        let h = await harness()
        defer { h.close() }
        let packing = location(h, "## Packing")
        h.view.toggleFold(packing)
        await h.caret(after: "## Packing")
        await h.press(EditorHarness.returnKey)
        // The new line comes right after Charger, the section's last line; Packing stays collapsed.
        #expect(h.text.contains("Charger\n\n\n## Days"))
        #expect(h.selection.location == location(h, "## Days") - 2)
        #expect(h.view.core.folds.collapsed == [packing])
        await h.type("Tickets")
        #expect(h.text.contains("Charger\nTickets\n\n## Days"))
        #expect(fragmentStarts(h).contains(location(h, "Tickets")))
        #expect(!fragmentStarts(h).contains(location(h, "Passport")))
    }

    @Test func typingAboveKeepsTheSectionCollapsed() async {
        let h = await harness()
        defer { h.close() }
        h.view.toggleFold(location(h, "## Packing"))
        await h.caret(after: "Trip")
        await h.type(" to Porto")
        #expect(h.view.core.folds.collapsed == [location(h, "## Packing")])
        #expect(!fragmentStarts(h).contains(location(h, "Passport")))
        // Renaming the collapsed heading keeps it collapsed too.
        await h.caret(after: "## Packing")
        await h.type(" list")
        #expect(h.view.core.folds.collapsed == [location(h, "## Packing list")])
        #expect(!fragmentStarts(h).contains(location(h, "Passport")))
    }

    @Test func deletingTheHeadingShowsWhatWasUnderIt() async {
        let h = await harness()
        defer { h.close() }
        let packing = location(h, "## Packing")
        h.view.toggleFold(packing)
        await h.select(packing, ("## Packing" as NSString).length)
        await h.command(#selector(NSText.delete(_:)))
        #expect(h.view.core.folds.collapsed.isEmpty)
        #expect(fragmentStarts(h).contains(location(h, "Passport")))
    }

    @Test func backspaceAfterACollapsedSectionOpensIt() async {
        let h = await harness()
        defer { h.close() }
        h.view.toggleFold(location(h, "## Packing"))
        // On the blank line after it: Backspace would take Charger's line break.
        await h.select(location(h, "## Days") - 1)
        await h.press(EditorHarness.delete)
        #expect(h.view.core.folds.collapsed.isEmpty)
        #expect(fragmentStarts(h).contains(location(h, "Passport")))
    }

    @Test func findingAWordInACollapsedSectionOpensIt() async {
        let h = await harness()
        defer { h.close() }
        h.view.toggleFold(location(h, "## Packing"))
        // What the find bar does with a match: select it.
        h.view.setSelectedRange((h.text as NSString).range(of: "Charger"))
        await h.settle()
        #expect(h.view.core.folds.collapsed.isEmpty)
        #expect(fragmentStarts(h).contains(location(h, "Charger")))
    }

    @Test func collapseAllAndExpandAll() async {
        let h = await harness()
        defer { h.close() }
        h.controller.collapseAllSections()
        await h.settle()
        #expect(h.view.core.folds.collapsed.count == 3)
        #expect(!fragmentStarts(h).contains(location(h, "Photos")))
        h.controller.expandAllSections()
        await h.settle()
        #expect(h.view.core.folds.collapsed.isEmpty)
        #expect(fragmentStarts(h).contains(location(h, "Photos")))
    }

    @Test func collapsingMovesAHiddenCaretToItsHeading() async {
        let h = await harness()
        defer { h.close() }
        await h.caret(after: "Passport")
        h.view.toggleFold(location(h, "## Packing"))
        await h.settle()
        #expect(h.selection.location == location(h, "## Packing") + ("## Packing" as NSString).length)
    }

    @Test func theChevronShowsOnHoverAndAClickCollapses() async {
        let h = await harness()
        defer { h.close() }
        let packing = location(h, "## Packing")
        let line = h.lineRect(at: packing)
        // The chevron sits in the margin, left of the heading's text.
        let p = CGPoint(x: h.view.textContainerOrigin.x - HeadingFoldMark.inset, y: line.midY)
        let inContainer = CGPoint(x: p.x - h.view.textContainerOrigin.x, y: p.y - h.view.textContainerOrigin.y)
        #expect(h.view.hoverFolds(at: inContainer))
        #expect(h.view.core.folds.hovered == packing)
        #expect(h.view.textStorage?.attribute(.paneFoldMark, at: packing, effectiveRange: nil) != nil)
        await h.click(p)
        #expect(h.view.core.folds.collapsed == [packing])
        #expect(!fragmentStarts(h).contains(location(h, "Passport")))
        // A click on plain text doesn't.
        #expect(h.view.foldToggle(at: CGPoint(x: 200, y: inContainer.y + 200)) == nil)
    }

    @Test func stateComesBackWhenTheNoteOpensAgain() async {
        let saved = FoldStore.defaults
        FoldStore.defaults = TestDefaults()
        defer { FoldStore.defaults = saved }
        let id = UUID()
        let h = await EditorHarness(Self.note)
        h.view.core.folds.noteID = id
        h.view.core.restyle(h.view.textStorage!, selection: nil, force: true)
        h.view.toggleFold(location(h, "## Days"))
        h.close()
        let again = PaneTextView(frame: NSRect(x: 0, y: 0, width: 600, height: 800))
        again.core.folds.noteID = id
        again.configure(text: Self.note, header: "")
        #expect(again.core.folds.collapsed == [(Self.note as NSString).range(of: "## Days").location])
    }
}
#endif
