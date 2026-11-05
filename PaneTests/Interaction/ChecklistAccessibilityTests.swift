#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Checklist items reach VoiceOver as checkboxes (council rounds 2 and 3, 11-04): the circles are
/// drawn, and all VoiceOver had was the hidden "- [ ]" in the line's text.
@MainActor @Suite(.serialized) struct ChecklistAccessibilityTests {
    static let note = "Lisbon\n\n- [ ] Tram 28 early\n- [x] Book flights\n\n```\n- [ ] not a checklist\n```\n"

    @Test func eachItemIsACheckboxWithItsTextAndState() async {
        let h = await EditorHarness(Self.note, focus: false)
        defer { h.close() }
        await h.settle(0.2)
        let boxes = h.view.checklistCheckboxes()
        #expect(boxes.map { $0.accessibilityLabel() ?? "" } == ["Tram 28 early", "Book flights"], "the items, not the code block's line")
        #expect(boxes.allSatisfy { $0.accessibilityRole() == .checkBox })
        #expect(boxes.map { ($0.accessibilityValue() as? NSNumber)?.intValue } == [0, 1], "open, then ticked")
        #expect(boxes.allSatisfy { $0.accessibilityFrame().width > 0 }, "each sits on its circle")
        let children = h.view.accessibilityChildren() ?? []
        #expect(children.filter { $0 is ChecklistCheckbox }.count == 2, "they're the text view's children")
        // The same item is the same element each time VoiceOver asks (round 15: made anew on
        // every call, an outside reader held elements already gone and read "?").
        let again = h.view.checklistCheckboxes()
        #expect(zip(boxes, again).allSatisfy { $0 === $1 }, "the same elements while the note is unchanged")
    }

    /// A table reaches VoiceOver as its cells, not as the empty lines of its hidden text.
    @Test func aTableIsInTheTextsChildren() async {
        let h = await EditorHarness("Food\n\n| Place | Dish |\n| --- | --- |\n| Ramiro | Seafood |\n", focus: false)
        defer { h.close() }
        await h.settle(0.4)
        let children = h.view.accessibilityChildren() ?? []
        #expect(children.contains { $0 is NSHostingView<AnyView> }, "the table's view is a child: \(children)")
    }

    @Test func aPressTicksTheItemAndLeavesTheCaret() async {
        let h = await EditorHarness(Self.note, focus: true)
        defer { h.close() }
        await h.settle(0.2)
        await h.select(3)
        let caret = h.view.selectedRange()
        let tram = h.view.checklistCheckboxes()[0]
        #expect(tram.accessibilityPerformPress())
        #expect(await h.until(2) { h.text.contains("- [x] Tram 28 early") }, "pressed, it's ticked: \(h.text.debugDescription)")
        #expect(h.view.selectedRange() == caret, "the caret stays")
    }
}
#endif
