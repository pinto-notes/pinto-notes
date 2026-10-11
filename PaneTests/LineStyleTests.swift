import Foundation
import Testing
@testable import Pane

@Suite struct LineStyleTests {
    func run(_ text: String, _ caret: Int, _ style: ListEditing.LineStyle) -> (String, Int) {
        let e = ListEditing.toggleLineStyle(in: text, selection: NSRange(location: caret, length: 0), style)
        return ((text as NSString).replacingCharacters(in: e.range, with: e.replacement), e.caret)
    }

    @Test func plainLineTakesTheStyle() {
        #expect(run("Milk", 4, .bulleted) == ("* Milk", 6))
        #expect(run("Milk", 4, .dashed) == ("- Milk", 6))
        #expect(run("Milk", 4, .numbered) == ("1. Milk", 7))
        #expect(run("Milk", 0, .quote) == ("> Milk", 2))
    }

    @Test func sameStyleAgainGoesBackToBody() {
        #expect(run("* Milk", 6, .bulleted) == ("Milk", 4))
        #expect(run("- Milk", 6, .dashed) == ("Milk", 4))
        #expect(run("1. Milk", 7, .numbered) == ("Milk", 4))
        #expect(run("> Milk", 6, .quote) == ("Milk", 4))
    }

    @Test func switchesBetweenListStylesKeepingIndent() {
        #expect(run("  - Milk", 8, .numbered) == ("  1. Milk", 9))
        #expect(run("1. Milk", 7, .bulleted) == ("* Milk", 6))
        #expect(run("> Milk", 6, .dashed) == ("- Milk", 6))
        // Bullets and dashes are separate styles, like Notes.
        #expect(run("- Milk", 6, .bulleted) == ("* Milk", 6))
        #expect(run("* Milk", 6, .dashed) == ("- Milk", 6))
    }

    @Test func checklistBecomesBullets() {
        #expect(run("- [ ] Milk", 10, .bulleted).0 == "* Milk")
        #expect(run("- [ ] Milk", 10, .dashed).0 == "- Milk")
    }

    // MARK: Several lines selected

    /// The text and what is selected afterwards, for a selection of `selected` in `text`.
    func runSelected(_ text: String, _ selected: String, _ make: (String, NSRange) -> TextEdit) -> (String, String) {
        let e = make(text, (text as NSString).range(of: selected))
        let out = (text as NSString).replacingCharacters(in: e.range, with: e.replacement)
        return (out, e.selection.map { (out as NSString).substring(with: $0) } ?? "")
    }

    static let bullets = "TODO\n\n* **Finances**\n* Pinto notes\n* Write blog post\n\nAfter"

    @Test func bulletsBecomeAChecklistAndBack() {
        // The selection from the recording: the empty line above the list and every bullet.
        let (text, kept) = runSelected(Self.bullets, "\n* **Finances**\n* Pinto notes\n* Write blog post", ListEditing.toggleChecklist)
        #expect(text == "TODO\n\n- [ ] **Finances**\n- [ ] Pinto notes\n- [ ] Write blog post\n\nAfter")
        #expect(kept == "\n- [ ] **Finances**\n- [ ] Pinto notes\n- [ ] Write blog post", "the lines stay selected")
        // Checklist again: every line already is one, so they go back to plain text.
        #expect(runSelected(text, kept, ListEditing.toggleChecklist).0 == "TODO\n\n**Finances**\nPinto notes\nWrite blog post\n\nAfter")
        // And a checklist becomes bullets, dashes or numbers from the Format menu.
        #expect(runSelected(text, kept) { ListEditing.toggleLineStyle(in: $0, selection: $1, .bulleted) }.0 == Self.bullets)
        #expect(runSelected(text, kept) { ListEditing.toggleLineStyle(in: $0, selection: $1, .numbered) }.0 == "TODO\n\n1. **Finances**\n2. Pinto notes\n3. Write blog post\n\nAfter")
    }

    @Test func dashedNumberedAndPlainLinesBecomeAChecklist() {
        #expect(runSelected("- Milk\n- Eggs\n", "- Milk\n- Eggs", ListEditing.toggleChecklist).0 == "- [ ] Milk\n- [ ] Eggs\n")
        #expect(runSelected("1. Milk\n2. Eggs", "1. Milk\n2. Eggs", ListEditing.toggleChecklist).0 == "- [ ] Milk\n- [ ] Eggs")
        #expect(runSelected("Milk\nEggs", "Milk\nEggs", ListEditing.toggleChecklist).0 == "- [ ] Milk\n- [ ] Eggs")
        // Sub-items keep their depth, and an item that is already ticked stays ticked.
        #expect(runSelected("* Milk\n  * Oat\n- [x] Eggs", "* Milk\n  * Oat\n- [x] Eggs", ListEditing.toggleChecklist).0 == "- [ ] Milk\n  - [ ] Oat\n- [x] Eggs")
    }

    @Test func aSelectionOnlyChangesTheLinesItTouches() {
        // From the middle of one line to the middle of another: both whole lines, nothing else.
        #expect(runSelected("* One\n* Two\n* Three", "ne\n* Tw", ListEditing.toggleChecklist).0 == "- [ ] One\n- [ ] Two\n* Three")
        // Ending at the start of the next line (a triple-click and drag) doesn't take that line.
        #expect(runSelected("* One\n* Two\n* Three", "* One\n* Two\n", ListEditing.toggleChecklist).0 == "- [ ] One\n- [ ] Two\n* Three")
        // A selection inside one line is still that line, as before.
        #expect(runSelected("* One\n* Two", "On", ListEditing.toggleChecklist).0 == "- [ ] One\n* Two")
    }

    @Test func severalLinesTakeAListStyleAndGiveItBack() {
        func style(_ text: String, _ s: ListEditing.LineStyle) -> String { runSelected(text, text) { ListEditing.toggleLineStyle(in: $0, selection: $1, s) }.0 }
        #expect(style("Milk\nEggs\n\nBread", .bulleted) == "* Milk\n* Eggs\n\n* Bread")
        #expect(style("* Milk\n* Eggs", .bulleted) == "Milk\nEggs")
        #expect(style("* Milk\n- Eggs", .dashed) == "- Milk\n- Eggs", "a mixed selection all takes the style")
        #expect(style("* Milk\n  * Oat\n  * Soy\n* Eggs", .numbered) == "1. Milk\n  1. Oat\n  2. Soy\n2. Eggs")
        #expect(style("Milk\nEggs", .quote) == "> Milk\n> Eggs")
        #expect(style("> Milk\n> Eggs", .quote) == "Milk\nEggs")
    }
}
