import Foundation
import Testing
@testable import Pane

/// Format › Move Item Up and Down (⌃⌘↑, ⌃⌘↓), as Notes moves list items (council rounds 13, 14).
struct MoveItemTests {
    func run(_ text: String, caretOn line: String, up: Bool, length: Int = 0) -> (String, Int)? {
        let ns = text as NSString
        let at = ns.range(of: line).location
        guard let e = MoveItem.move(in: text, selection: NSRange(location: at, length: length), up: up) else { return nil }
        let out = (text as NSString).replacingCharacters(in: e.range, with: e.replacement)
        return (out, e.caret)
    }

    @Test func anItemSwapsWithTheOneAboveAndBelow() throws {
        let t = "Packing\n- [ ] Passport\n- [ ] Charger\n- [ ] Shoes\n"
        let (up, caret) = try #require(run(t, caretOn: "- [ ] Shoes", up: true))
        #expect(up == "Packing\n- [ ] Passport\n- [ ] Shoes\n- [ ] Charger\n")
        #expect((up as NSString).substring(from: caret).hasPrefix("- [ ] Shoes"), "the caret goes with it")
        #expect(try #require(run(t, caretOn: "- [ ] Passport", up: false)).0 == "Packing\n- [ ] Charger\n- [ ] Passport\n- [ ] Shoes\n")
    }

    @Test func theTitleStaysFirstAndTheEndStops() {
        let t = "Packing\n- [ ] Passport\n- [ ] Charger\n"
        #expect(run(t, caretOn: "- [ ] Passport", up: true) == nil, "not above the title")
        #expect(run(t, caretOn: "Packing", up: false) == nil, "the title doesn't move")
        #expect(run(t, caretOn: "- [ ] Charger", up: false) == nil, "nothing below")
    }

    @Test func anItemTakesItsChildrenAndPassesWholeItems() throws {
        let t = "Trip\n- Bags\n  - Passport\n  - Charger\n- Shoes\n"
        #expect(try #require(run(t, caretOn: "- Shoes", up: true)).0 == "Trip\n- Shoes\n- Bags\n  - Passport\n  - Charger\n", "past Bags and its children")
        #expect(try #require(run(t, caretOn: "- Bags", up: false)).0 == "Trip\n- Shoes\n- Bags\n  - Passport\n  - Charger\n", "with its children")
        #expect(try #require(run(t, caretOn: "  - Charger", up: true)).0 == "Trip\n- Bags\n  - Charger\n  - Passport\n- Shoes\n", "a child among its siblings")
    }

    @Test func plainLinesAndASelectionMoveToo() throws {
        let t = "Notes\nOne\nTwo\nThree"
        #expect(try #require(run(t, caretOn: "Three", up: true)).0 == "Notes\nOne\nThree\nTwo")
        let both = try #require(MoveItem.move(in: t, selection: (t as NSString).range(of: "One\nTwo"), up: false))
        #expect((t as NSString).replacingCharacters(in: both.range, with: both.replacement) == "Notes\nThree\nOne\nTwo")
        #expect(both.selection?.length == 7, "the selection stays selected")
    }

    @MainActor @Test func theMenuHasThem() throws {
        #if os(macOS)
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        #expect(root.contains(#"Button("Move Item Up")"#) && root.contains(".keyboardShortcut(.upArrow, modifiers: [.command, .control])"))
        #expect(root.contains(#"Button("Move Item Down")"#) && root.contains(".keyboardShortcut(.downArrow, modifiers: [.command, .control])"))
        #endif
    }
}
