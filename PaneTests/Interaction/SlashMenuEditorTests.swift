#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The `/` menu in the real Mac editor: offered under the caret as you type `/`, filtered by the
/// letters after it, run with Return, Tab or a click, put away with Escape.
@MainActor @Suite(.serialized) struct SlashMenuEditorTests {
    func listShown(_ h: EditorHarness) -> Bool { h.view.subviews.contains { $0 is NSHostingView<SlashCommandList> } }
    var end: (EditorHarness) -> Int { { ($0.text as NSString).length } }

    @Test func typingASlashOffersEveryCommandAndLettersFilter() async {
        let h = await EditorHarness("Plan\n")
        defer { h.close() }
        await h.select(end(h))
        await h.type("/")
        #expect(h.controller.slashCommands == SlashCommand.available)
        #expect(listShown(h), "the list shows under the caret")
        await h.type("ch")
        #expect(h.controller.slashCommands == [.checklist])
        await h.press(EditorHarness.delete)
        await h.press(EditorHarness.delete)
        #expect(h.controller.slashCommands == SlashCommand.available, "deleting letters widens it again")
        await h.press(EditorHarness.delete)
        #expect(h.controller.slashCommands.isEmpty && !listShown(h), "the slash gone, the list goes")
    }

    @Test func returnRunsTheHighlightedCommandOnThatLine() async {
        let h = await EditorHarness("Plan\nBuy milk")
        defer { h.close() }
        await h.select(end(h))
        await h.type(" /todo")
        #expect(h.controller.slashCommands == [.checklist])
        await h.press(EditorHarness.returnKey)
        #expect(h.text == "Plan\n- [ ] Buy milk ", "the query goes and the line becomes a checklist item")
        #expect(h.controller.slashCommands.isEmpty && !listShown(h))
    }

    @Test func arrowsMoveTheChoiceAndTabRunsIt() async {
        let h = await EditorHarness("Plan\n")
        defer { h.close() }
        await h.select(end(h))
        await h.type("/h")
        #expect(h.controller.slashCommands.prefix(3) == [.heading, .title, .subheading])
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.up)
        #expect(h.controller.slashChoice == 1)
        await h.press(EditorHarness.tab)
        #expect(h.text == "Plan\n# ", "Title, with the caret ready to write it")
        #expect(h.selection.location == end(h))
    }

    @Test func escapePutsItAwayForThatSlash() async {
        let h = await EditorHarness("Plan\n")
        defer { h.close() }
        await h.select(end(h))
        await h.type("/di")
        #expect(h.controller.slashCommands == [.divider])
        await h.command(#selector(NSResponder.cancelOperation(_:)))
        #expect(h.controller.slashCommands.isEmpty && !listShown(h))
        await h.type("v")
        #expect(h.controller.slashCommands.isEmpty, "not offered again while typing after the same slash")
        await h.press(EditorHarness.returnKey)
        #expect(h.text == "Plan\n/div\n", "Return makes a line again")
        await h.type("/dat")
        #expect(h.controller.slashCommands == [.date], "a new slash offers again")
    }

    @Test func aSpaceThatNamesNothingCloses() async {
        let h = await EditorHarness("Plan\n")
        defer { h.close() }
        await h.select(end(h))
        await h.type("Pay /ta")
        #expect(h.controller.slashCommands == [.table, .checklist], "Table by name, Checklist by \"task\"")
        await h.type("x ")
        #expect(h.controller.slashCommands.isEmpty && !listShown(h))
        await h.press(EditorHarness.returnKey)
        #expect(h.text.hasPrefix("Plan\nPay /tax \n"), "Return writes a new line, nothing runs")
    }

    @Test func notInAURLOrCode() async {
        let h = await EditorHarness("Plan\n```\ncode\n```\n")
        defer { h.close() }
        await h.select(end(h))
        await h.type("https://")
        #expect(h.controller.slashCommands.isEmpty)
        await h.select(("Plan\n```\ncode" as NSString).length)
        await h.type(" /")
        #expect(h.controller.slashCommands.isEmpty, "in a code block a slash is code")
    }

    @Test func dateAndDividerRunWhereTheSlashWas() async {
        let h = await EditorHarness("Plan\nDentist")
        defer { h.close() }
        await h.select(end(h))
        await h.type(" /today")
        await h.press(EditorHarness.returnKey)
        #expect(h.text == "Plan\nDentist " + NoteDates.text(for: .now) + " ")
        await h.type("\n/hr")
        #expect(h.controller.slashCommands == [.divider])
        await h.press(EditorHarness.returnKey)
        #expect(h.text.contains("---"), "a divider line: \(h.text)")
        #expect(!h.text.contains("/hr"))
    }

    @Test func clickingARowRunsIt() async throws {
        let h = await EditorHarness("Plan\nGroceries")
        defer { h.close() }
        await h.select(end(h))
        await h.type(" /")
        let list = try #require(h.view.subviews.first { $0 is NSHostingView<SlashCommandList> })
        let row = try #require(SlashCommand.available.firstIndex(of: .bulleted))
        // A click there lands in the list, not the text. SwiftUI's buttons take clicks only in a
        // window in front of an active app (never on a developer's Mac), so the test then calls
        // what the row's button calls (as NoteLinksFootTests does off CI).
        let p = CGPoint(x: list.frame.minX + 60, y: list.frame.minY + 4 + (CGFloat(row) + 0.5) * SlashCommandList.rowHeight)
        let hit = h.view.superview?.hitTest(h.view.convert(p, to: h.view.superview))
        #expect(hit.map { $0 === list || $0.isDescendant(of: list) } == true, "the click goes to the list: \(String(describing: hit))")
        h.controller.runSlash(SlashCommand.available[row])
        await h.settle()
        #expect(h.text == "Plan\n* Groceries ")
        #expect(!listShown(h))
    }

    @Test func theListSitsUnderTheLineOrOverItNearTheBottom() async {
        let h = await EditorHarness("Plan\n", height: 900)
        defer { h.close() }
        await h.select(end(h))
        await h.type("/")
        let list = h.view.subviews.first { $0 is NSHostingView<SlashCommandList> }
        let line = h.lineRect(at: end(h) - 1)
        #expect(list.map { $0.frame.minY >= line.maxY - 1 } == true, "under the line: \(String(describing: list?.frame)) \(line)")

        let tall = (1...60).map { "Line \($0)" }.joined(separator: "\n")
        let b = await EditorHarness(tall + "\n", height: 500)
        defer { b.close() }
        await b.select(end(b))
        b.view.scrollRangeToVisible(b.selection)
        await b.type("/")
        await b.settle(0.1)
        let l = b.view.subviews.first { $0 is NSHostingView<SlashCommandList> }
        let visible = b.view.visibleRect
        let slashLine = b.lineRect(at: end(b) - 1)
        #expect(l.map { $0.frame.maxY <= slashLine.minY + 1 && $0.frame.minY >= visible.minY - 1 } == true,
                "over the line, inside the visible part: \(String(describing: l?.frame)) line \(slashLine) in \(visible)")
    }
}
#endif
