#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// Emil's Mac notes of 6 November 2026 on 1.3, built with the macOS 27 SDK.
@MainActor @Suite(.serialized) struct QuietChromeTests {
    /// The icons that moved are parked; finishing a checklist isn't one of them.
    @Test func animatedIconsAreParked() {
        #expect(!Charm.on)
        #expect(TodayButton.symbol(for: Date(timeIntervalSince1970: 1_793_000_000), calendar: .init(identifier: .gregorian)).hasSuffix(".calendar"))
        #expect(NSImage(systemSymbolName: "6.calendar", accessibilityDescription: nil) != nil, "a flat symbol, no strokes crossing")
    }

    /// The pencil's ink sits in the middle of its button, up and down within half a point.
    @Test func composeIconIsCentred() throws {
        let image = ToolbarGlyph.nsImage("square.and.pencil", shift: ToolbarGlyph.composeShift)
        let scale = 4
        let w = Int(image.size.width) * scale, h = Int(image.size.height) * scale
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                                isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        image.draw(in: NSRect(x: 0, y: 0, width: w, height: h))
        NSGraphicsContext.restoreGraphicsState()
        var top = h, bottom = 0
        for y in 0..<h { for x in 0..<w where (rep.colorAt(x: x, y: y)?.alphaComponent ?? 0) > 0.5 { top = min(top, y); bottom = max(bottom, y) } }
        let off = (CGFloat(top + bottom) / 2 - CGFloat(h) / 2) / CGFloat(scale)
        #expect(abs(off) <= 0.5, "\(off) pt off centre")
    }

    /// Only on the note's last line, so arrowing through blank lines doesn't make it jump.
    @Test func theSlashHintStaysOnTheLastLine() async {
        let h = await EditorHarness("Plan\n\nMilk\n")
        defer { h.close() }
        func hint() -> Bool { h.view.subviews.contains { ($0 as? NSTextField)?.stringValue == PaneTextView.slashHintText } }
        await h.select(5)
        #expect(!hint(), "a blank line in the middle")
        await h.select((h.view.string as NSString).length)
        #expect(hint(), "the last line")
    }

    /// With the window behind another, no caret and no hint.
    @Test func theSlashHintLeavesWithTheWindowsFocus() async {
        let h = await EditorHarness("Plan\nMilk\n")
        defer { h.close() }
        await h.select((h.view.string as NSString).length)
        #expect(h.view.caretHint() == PaneTextView.slashHintText)
        NotificationCenter.default.post(name: NSWindow.didResignKeyNotification, object: h.window)
        #expect(h.view.caretHint() == nil)
        NotificationCenter.default.post(name: NSWindow.didBecomeKeyNotification, object: h.window)
        #expect(h.view.caretHint() == PaneTextView.slashHintText)
    }

    @Test func aClickOutsideClosesSearch() {
        let panel = CGRect(x: 100, y: 100, width: 400, height: 300)
        #expect(!QuickOpen.isOutside(CGPoint(x: 200, y: 600), of: panel, windowHeight: 800), "inside: y 200 from the top")
        #expect(QuickOpen.isOutside(CGPoint(x: 20, y: 600), of: panel, windowHeight: 800))
        #expect(QuickOpen.isOutside(CGPoint(x: 200, y: 50), of: panel, windowHeight: 800))
        #expect(!QuickOpen.isOutside(.zero, of: .zero, windowHeight: 800), "not measured yet: stays")
    }

    @Test func dateHeadingsStopFloatingSoTheirLineGoes() {
        let list = NSTableView(), sidebar = NSTableView()
        list.style = .plain; list.floatsGroupRows = true
        sidebar.style = .sourceList; sidebar.floatsGroupRows = true
        ListEdgeLine.stopFloating(list); ListEdgeLine.stopFloating(sidebar)
        #expect(!list.floatsGroupRows)
        #expect(sidebar.floatsGroupRows, "the sidebar keeps its own")
    }

    @Test func theLinesAreHiddenAndOnlyThem() {
        let root = CALayer(), line = CALayer(), other = CALayer(), ground = CALayer(), thin = CALayer()
        line.name = "Separator"; ground.name = "DividerBackground"; ground.bounds.size.width = 1
        thin.name = "DividerBackground"; thin.bounds.size.width = 0.5
        [line, other, ground, thin].forEach(root.addSublayer)
        ListEdgeLine.hideLines(in: root)
        #expect(line.isHidden && ground.isHidden)
        #expect(!other.isHidden && !thin.isHidden, "the sidebar's own divider stays")
    }

    /// Clicking your name opens Settings; there's no menu.
    @Test func theAccountRowOpensSettings() {
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "account-\(UUID())")!)
        AccountButton.open(route)
        #expect(route.presenting && route.target == nil)
    }

    /// The caret keeps its height from an empty line to the first letter typed on it: a new
    /// note's title, a body line, a line under a heading.
    @Test(arguments: ["", "Plan\nMilk\n", "Plan\n# Big\n", "Plan\n- one\n"])
    func theCaretKeepsItsHeightWhenYouType(start: String) async {
        let h = await EditorHarness(start)
        defer { h.close() }
        await h.select((h.view.string as NSString).length)
        func caret() -> CGFloat? {
            guard let tlm = h.view.textLayoutManager, let tcm = tlm.textContentManager,
                  let loc = tcm.location(tcm.documentRange.location, offsetBy: h.view.selectedRange().location) else { return nil }
            var r: CGRect?
            tlm.enumerateTextSegments(in: NSTextRange(location: loc), type: .selection, options: [.rangeNotRequired]) { _, f, _, _ in r = f; return false }
            return r?.height
        }
        let empty = caret()
        await h.type("E")
        let typed = caret()
        #expect(empty != nil && empty == typed)
    }
}
#endif
