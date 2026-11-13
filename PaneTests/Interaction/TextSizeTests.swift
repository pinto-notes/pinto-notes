#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// View › Make Text Bigger, Make Text Smaller and Actual Size, and Settings › Appearance › Text
/// size (council round 1 and the persona council, 11-04: Notes and Obsidian have it; Ingrid can't
/// read 13 pt). Five stops, 13 to 24 pt, display only, per device. The title, headings,
/// checklists, code and tables scale with the body.
@MainActor @Suite(.serialized) struct TextSizeTests {
    /// The View menu holds what the app puts there, after Hide Sidebar. Replacing the sidebar
    /// group with nothing (to drop Hide Sidebar, 11-01) took every item placed after it away too:
    /// Collapse All Sections, AI Changes and the text sizes were missing on the Air (11-04).
    @Test func theViewMenuHasTextSizesSectionsAndAIChanges() throws {
        guard let main = NSApp.mainMenu, let view = main.items.first(where: { $0.title == "View" })?.submenu else {
            Issue.record("the test host has no View menu to check"); return
        }
        let titles = view.items.map(\.title)
        for t in [TextSize.biggerTitle, TextSize.smallerTitle, TextSize.actualTitle, "Collapse All Sections", "Expand All Sections", "\(AIChangeCopy.title)\u{2026}"] {
            #expect(titles.contains(t), "View › \(t): \(titles)")
        }
        #expect(titles.contains { $0.contains("Sidebar") }, "Hide Sidebar is back (11-04): \(titles)")
        let bigger = view.items.first { $0.title == TextSize.biggerTitle }
        #expect(bigger?.keyEquivalent == "+")
    }

    /// The sidebar item names what it will do (it read "Show Sidebar" both ways on the Air, 11-04),
    /// and hides the folders in one click, as in Notes (11-13: no closing it twice; the note
    /// alone is Full Screen).
    @Test func theSidebarItemNamesItsState() {
        #expect(SidebarToggle.title(.all) == "Hide Sidebar")
        #expect(SidebarToggle.title(.doubleColumn) == "Show Sidebar")
        #expect(SidebarToggle.title(.detailOnly) == "Show Sidebar")
        #expect(SidebarToggle.next(.all) == .doubleColumn, "one click hides the folders")
        #expect(SidebarToggle.next(.doubleColumn) == .all, "one click shows them")
        #expect(SidebarToggle.next(.detailOnly) == .all)
        for v in [NavigationSplitViewVisibility.all, .doubleColumn, .detailOnly] {
            #expect(SidebarToggle.visibility(named: SidebarToggle.name(v)) == v, "the window remembers the step")
        }
        #expect(SidebarToggle.animation(reduceMotion: true) == nil && SidebarToggle.animation(reduceMotion: false) != nil, "Reduce Motion: no slide")
    }

    @Test func fiveStopsUpAndDownStoppingAtTheEnds() {
        #expect(TextSize.steps == [13, 15, 17, 20, 24])
        #expect(TextSize.step(from: 13, bigger: true) == 15)
        #expect(TextSize.step(from: 17, bigger: true) == 20)
        #expect(TextSize.step(from: 20, bigger: false) == 17)
        #expect(TextSize.step(from: 24, bigger: true) == 24, "the largest stays")
        #expect(TextSize.step(from: 13, bigger: false) == 13, "13 pt, Notes' size, is the smallest")
        #expect(TextSize.index(of: 17) == 2 && TextSize.index(of: 24) == 4 && TextSize.index(of: 14) == 0)
        #expect(TextSize.size(stored: 0) == 13, "nothing stored: the standard size")
        #expect(TextSizeRow.label == "Note text", "the row under the Text size header doesn't repeat it")
        // A size from the earlier 11-24 pt build: the stop at or above it, never back to 13.
        #expect(TextSize.size(stored: 14) == 15)
        #expect(TextSize.size(stored: 16) == 17 && TextSize.size(stored: 18) == 20 && TextSize.size(stored: 22) == 24)
        #expect(TextSize.size(stored: 11) == 13 && TextSize.size(stored: 30) == 24)
        #expect(TextSize.size(stored: 0) == 13, "nothing stored: the standard size")
        #expect(TextSizeRow.label == "Note text", "the row under the Text size header doesn't repeat it")
        #expect(TextSize.size(stored: 20) == 20)
        #expect(TextSize.spoken(17) == "17 points")
        // Note text only: the sidebar and list never grow with it (Emil, 7 November 2026).
        for step in TextSize.steps { #expect(TextSize.interfaceScale(stored: Double(step)) == 1, "\(step) pt") }
        #expect(TextSize.interface(13) == 13)
        #expect(TextSize.biggerTitle == "Make Text Bigger" && TextSize.smallerTitle == "Make Text Smaller" && TextSize.actualTitle == "Actual Size")
    }

    /// Settings › Appearance › Font: note text and headings take the face; code stays mono, and
    /// Default is the system's own (Emil, 7 November 2026).
    @Test func theFontChangesNoteTextButNotCode() {
        // Read outside the overrides: a styler's fonts are worked out when asked.
        let plainBody = MarkdownStyler().bodyFont, plainMono = MarkdownStyler().monoFont, plainTitle = MarkdownStyler.titleFont
        #expect(NoteFont.override == nil)
        #expect(plainBody.fontName == NSFont.systemFont(ofSize: plainBody.pointSize).fontName, "Default is the system font")
        for face in NoteFont.allCases where face != .standard {
            NoteFont.$override.withValue(face) {
                let s = MarkdownStyler()
                #expect(s.bodyFont.fontDescriptor != plainBody.fontDescriptor, "\(face): the body takes the face")
                #expect(s.bodyFont.pointSize == plainBody.pointSize, "\(face): at the same size")
                #expect(MarkdownStyler.titleFont.fontDescriptor != plainTitle.fontDescriptor, "\(face): the title too")
                #expect(s.monoFont.fontDescriptor == plainMono.fontDescriptor, "\(face): code stays mono")
            }
        }
        #expect(NoteFont.allCases.map(\.title) == ["Default", "Serif", "Rounded", "Mono"])
        #expect(SettingsIndex.matches("serif", available: Set(SettingsPage.allCases)).map(\.page) == [.appearance])
    }

    @Test func biggerRestylesAnOpenNoteAndActualSizeBringsItBack() async throws {
        TextSize.actualSize()
        defer { TextSize.actualSize() }
        let h = await EditorHarness("Lisbon\n\nFour days of tiles, trams and pastries in May.\n\n## Plan\n- [ ] Tram 28 early\n- [x] Book flights\n\n```\nnpm run dev\n```", focus: false)
        defer { h.close() }
        let ns = h.text as NSString
        func size(at s: String) -> CGFloat {
            let r = ns.range(of: s)
            return (h.view.textStorage!.attribute(.font, at: r.location, effectiveRange: nil) as? NSFont)?.pointSize ?? 0
        }
        func circle(_ s: String) -> CGFloat {
            let line = ns.lineRange(for: NSRange(location: ns.range(of: s).location, length: 0)).location
            return h.view.core.checkboxRect(line: line, layout: h.view.textLayoutManager)?.width ?? 0
        }
        #expect(size(at: "Four days") == 13)
        let title = size(at: "Lisbon"), heading = size(at: "Plan"), code = size(at: "npm run dev"), ring = circle("Tram 28")
        #expect(ring > 0)
        let row = GridMetrics.row

        TextSize.bigger(); TextSize.bigger() // 15, 17
        await h.settle(0.1)
        #expect(TextSize.body == 17)
        #expect(UserDefaults.standard.double(forKey: TextSize.key) == 17, "kept on this Mac")
        #expect(size(at: "Four days") == 17, "the body follows")
        #expect(size(at: "Lisbon") > title, "the title grows with it")
        #expect(size(at: "Plan") > heading, "and the headings")
        #expect(size(at: "npm run dev") > code, "and code")
        #expect(circle("Tram 28") > ring + 2, "and the checklist's circles: \(circle("Tram 28")) from \(ring)")
        #expect(GridTable.cellFont.pointSize == 17, "table cells' text follows")
        await h.snapshot("text-size-17-light")

        TextSize.set(24)
        await h.settle(0.1)
        #expect(size(at: "Four days") == 24)
        #expect(GridMetrics.row > row, "table rows grow once the text outgrows them: \(GridMetrics.row) from \(row)")
        TextSize.bigger()
        #expect(TextSize.body == 24, "no bigger than 24")

        #expect(GridMetrics.row > 32, "table rows grow with the text: \(GridMetrics.row)")

        TextSize.actualSize()
        await h.settle(0.1)
        #expect(GridMetrics.row == 32)
        #expect(size(at: "Four days") == 13)
        #expect(size(at: "Lisbon") == title)
        #expect(abs(circle("Tram 28") - ring) < 0.5)
        #expect(UserDefaults.standard.object(forKey: TextSize.key) == nil, "the default isn't stored")
        TextSize.smaller()
        #expect(TextSize.body == 13, "no smaller than 13")
    }

    /// Settings › Appearance › Text size: a slider with five stops that follows ⌘+ and sets the size.
    @Test func settingsSliderHasFiveStopsAndSetsTheSize() async throws {
        TextSize.actualSize()
        defer { TextSize.actualSize() }
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 640, height: 900), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        let host = NSHostingView(rootView: AppearanceSettingsPage().frame(width: 640, height: 900))
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(0.5))
        host.layoutSubtreeIfNeeded()
        #expect(TextSize.steps.count == 5, "a stop for each size")
        // As VoiceOver reaches it: from macOS 27 SwiftUI's slider is no NSSlider.
        let enhanced = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
        NSApp.accessibilitySetValue(true, forAttribute: enhanced)
        defer { NSApp.accessibilitySetValue(false, forAttribute: enhanced) }
        func element() -> NSObject? { MacEmptyDetailTests.element("settings.textSize", in: host) }
        for _ in 0..<30 where element() == nil {
            try? await Task.sleep(for: .milliseconds(100))
            host.layoutSubtreeIfNeeded()
        }
        func said() -> String? {
            let e = element()
            // A value of words is its description; the slider's own value is the stop's number.
            return e?.value(forKey: "accessibilityValueDescription") as? String ?? e?.value(forKey: "accessibilityValue") as? String
        }
        #expect(element()?.value(forKey: "accessibilityRole") as? String == "AXSlider", "VoiceOver calls it a slider")
        #expect(said() == TextSize.spoken(13), "13 pt")
        TextSize.set(20)
        try? await Task.sleep(for: .seconds(0.3))
        host.layoutSubtreeIfNeeded()
        #expect(said() == TextSize.spoken(20), "the fourth stop: it follows View › Make Text Bigger")
        _ = try #require(element()).perform(#selector(NSAccessibilityProtocol.accessibilityPerformIncrement))
        try? await Task.sleep(for: .seconds(0.1))
        #expect(TextSize.body == 24, "moving it sets the size")
    }
}
#endif
