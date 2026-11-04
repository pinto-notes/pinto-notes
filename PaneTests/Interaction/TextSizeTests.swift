#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// View › Bigger, Smaller and Actual Size (council round 1, 11-04: both judges asked for it, as
/// Notes and Obsidian have it). The size is display only and scales the title with the body.
@MainActor @Suite(.serialized) struct TextSizeTests {
    /// The View menu holds what the app puts there, after Hide Sidebar. Replacing the sidebar
    /// group with nothing (to drop Hide Sidebar, 11-01) took every item placed after it away too:
    /// Collapse All Sections, AI Changes and the text sizes were missing on the Air (11-04).
    @Test func theViewMenuHasTextSizesSectionsAndAIChanges() throws {
        guard let main = NSApp.mainMenu, let view = main.items.first(where: { $0.title == "View" })?.submenu else {
            Issue.record("the test host has no View menu to check"); return
        }
        let titles = view.items.map(\.title)
        for t in ["Bigger", "Smaller", "Actual Size", "Collapse All Sections", "Expand All Sections", "\(AIChangeCopy.title)\u{2026}"] {
            #expect(titles.contains(t), "View › \(t): \(titles)")
        }
        #expect(titles.contains { $0.contains("Sidebar") }, "Hide Sidebar is back (11-04): \(titles)")
        let bigger = view.items.first { $0.title == "Bigger" }
        #expect(bigger?.keyEquivalent == "+")
    }

    /// The sidebar item names what it will do (it read "Show Sidebar" both ways on the Air, 11-04).
    @Test func theSidebarItemNamesItsState() {
        #expect(SidebarToggle.title(.all) == "Hide Sidebar")
        #expect(SidebarToggle.title(.doubleColumn) == "Show Sidebar")
        #expect(SidebarToggle.title(.detailOnly) == "Show Sidebar")
        #expect(SidebarToggle.toggled(.all) == .doubleColumn)
        #expect(SidebarToggle.toggled(.doubleColumn) == .all)
    }

    @Test func stepsGoUpAndDownAndStopAtTheEnds() {
        #expect(TextSize.step(from: 13, bigger: true) == 14)
        #expect(TextSize.step(from: 16, bigger: true) == 18)
        #expect(TextSize.step(from: 13, bigger: false) == 12)
        #expect(TextSize.step(from: 24, bigger: true) == 24, "the largest stays")
        #expect(TextSize.step(from: 11, bigger: false) == 11, "the smallest stays")
    }

    @Test func biggerRestylesAnOpenNoteAndActualSizeBringsItBack() async throws {
        TextSize.actualSize()
        defer { TextSize.actualSize() }
        let h = await EditorHarness("Lisbon\n\nFour days of tiles, trams and pastries in May.", focus: false)
        defer { h.close() }
        let ns = h.text as NSString
        func size(at s: String) -> CGFloat {
            let r = ns.range(of: s)
            return (h.view.textStorage!.attribute(.font, at: r.location, effectiveRange: nil) as? NSFont)?.pointSize ?? 0
        }
        #expect(size(at: "Four days") == 13)
        let title = size(at: "Lisbon")

        TextSize.bigger(); TextSize.bigger(); TextSize.bigger() // 14, 15, 16
        await h.settle(0.1)
        #expect(TextSize.body == 16)
        #expect(size(at: "Four days") == 16, "the body follows")
        #expect(size(at: "Lisbon") > title, "the title grows with it")

        #expect(GridMetrics.row > 32, "table rows grow with the text: \(GridMetrics.row)")

        TextSize.actualSize()
        await h.settle(0.1)
        #expect(GridMetrics.row == 32)
        #expect(size(at: "Four days") == 13)
        #expect(size(at: "Lisbon") == title)
        #expect(UserDefaults.standard.object(forKey: TextSize.key) == nil, "the default isn't stored")
    }
}
#endif
