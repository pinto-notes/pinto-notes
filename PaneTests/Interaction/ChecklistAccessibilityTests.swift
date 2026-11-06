#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Checklist items reach VoiceOver as checkboxes (council rounds 2 and 3, 11-04): the circles are
/// drawn, and all VoiceOver had was the hidden "- [ ]" in the line's text.
@MainActor @Suite struct SidebarRowWordsTests {
    @Test func aRowSaysItsCount() {
        #expect(SidebarRowWords.spoken("Travel", count: 4) == "Travel, 4 notes")
        #expect(SidebarRowWords.spoken("Notes", count: 1) == "Notes, 1 note")
        #expect(SidebarRowWords.spoken("Ideas", count: 2, files: 1) == "Ideas, 2 notes, 1 file")
    }
}

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
        let table = children.compactMap { $0 as? GridHostingView }.first
        #expect(table?.accessibilityLabel() == "Table, 2 columns, 2 rows")
        #expect(table?.accessibilityRoleDescription() == "table")
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

    /// Real VoiceOver on the Air, 6 November 2026: walking the text goes word by word, the rotor had
    /// no way to a circle, and no key ticked. ⇧⌘U ticks where the caret is, and says so.
    @Test func theCaretsItemTicksFromTheKeyboardAndSaysSo() async {
        let h = await EditorHarness(Self.note, focus: true)
        defer { h.close() }
        await h.settle(0.2)
        let tram = (h.text as NSString).range(of: "Tram").location
        h.view.setSelectedRange(NSRange(location: tram + 2, length: 0))
        h.controller.updateUntick(text: h.text, selection: h.view.selectedRange())
        #expect(h.controller.caretItemTicked == false)
        #expect(EditorController.tickTitle(ticked: false) == "Tick Item")
        let caret = h.view.selectedRange()
        h.controller.tickItem()
        #expect(await h.until(2) { h.text.contains("- [x] Tram 28 early") }, "ticked: \(h.text.debugDescription)")
        #expect(h.controller.lastTickAnnouncement == "Checked, Tram 28 early")
        #expect(h.view.selectedRange() == caret, "the caret stays")
        #expect(h.controller.caretItemTicked == true)
        #expect(EditorController.tickTitle(ticked: true) == "Untick Item")
    }

    @Test func aLineThatIsntAnItemHasNothingToTick() async {
        let h = await EditorHarness(Self.note, focus: true)
        defer { h.close() }
        await h.settle(0.2)
        let before = h.text
        h.view.setSelectedRange(NSRange(location: 2, length: 0))
        h.controller.updateUntick(text: h.text, selection: h.view.selectedRange())
        #expect(h.controller.caretItemTicked == nil, "the menu item is off")
        h.controller.tickItem()
        #expect(h.text == before)
        let code = (h.text as NSString).range(of: "not a checklist").location
        h.view.setSelectedRange(NSRange(location: code, length: 0))
        h.controller.updateUntick(text: h.text, selection: h.view.selectedRange())
        #expect(h.controller.caretItemTicked == nil, "in a code block it's just text")
        h.controller.tickItem()
        #expect(h.text == before, "code stays code")
    }

    @Test func theRotorGoesFromCircleToCircle() async throws {
        let h = await EditorHarness(Self.note, focus: false)
        defer { h.close() }
        await h.settle(0.2)
        #expect(h.view.accessibilityCustomRotors().contains { $0.label == PaneTextView.checklistRotorLabel })
        let first = try #require(h.view.checklistRotorResult(from: nil, next: true))
        #expect(first.customLabel == "Unchecked, Tram 28 early")
        #expect((h.text as NSString).substring(with: first.targetRange) == "Tram 28 early", "lands on the item's words")
        let second = try #require(h.view.checklistRotorResult(from: first.targetRange, next: true))
        #expect(second.customLabel == "Checked, Book flights")
        #expect(h.view.checklistRotorResult(from: second.targetRange, next: true) == nil, "the end of the list")
        #expect(h.view.checklistRotorResult(from: second.targetRange, next: false)?.customLabel == first.customLabel)
    }

    /// AI Changes: read as "- [ ] Burrata", with nothing to tell a new line from a removed one.
    @Test func aChangedVersionSaysWhatChanged() {
        let text = "Plan\n- [ ] Lemons\n- [ ] Burrata\n"
        let ns = text as NSString
        let storage = NSTextStorage(string: text)
        VersionTextView.style(storage, changed: [ns.range(of: "Burrata")], removed: [ns.range(of: "Lemons")])
        let line = { (word: String) in ns.lineRange(for: ns.range(of: word)) }
        let said = { (word: String) in VersionReadingTextView.spokenLine(storage, in: line(word)).string.trimmingCharacters(in: .whitespacesAndNewlines) }
        #expect(said("Burrata") == "Added, Unchecked, Burrata")
        #expect(said("Lemons") == "Removed, Unchecked, Lemons")
        #expect(said("Plan") == "Plan")
    }
}
#endif
