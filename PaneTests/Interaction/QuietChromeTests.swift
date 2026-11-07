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

    /// Settings was a sheet on the notes window for a while; it is a window of its own again, like
    /// System Settings (Emil, 7 November 2026). SettingsWindow is what opens it.
    @Test func settingsIsAWindowOfItsOwn() {
        #expect(SettingsWindow.size.width > 0 && SettingsWindow.size.height > 0)
    }

    @Test func theNameLeavesBeforeTheSlideAndReturnsAfterIt() {
        #expect(NoteListView.nameFade(hidden: true, reduceMotion: true) == nil)
        #expect(NoteListView.nameFade(hidden: true, reduceMotion: false) != nil)
    }

    @Test func aHeadingPinsOnlyOnceTheListHasScrolled() {
        #expect(!ListEdgeLine.pins(offset: -52, topInset: 52), "at the top: a plain row")
        #expect(!ListEdgeLine.pins(offset: 0, topInset: 0))
        #expect(ListEdgeLine.pins(offset: -40, topInset: 52), "scrolled: pinned")
        #expect(ListEdgeLine.pins(offset: 200, topInset: 0))
    }

    @Test func theLinesAreHiddenAndOnlyThem() {
        let root = CALayer(), line = CALayer(), other = CALayer(), ground = CALayer(), thin = CALayer()
        line.name = "Separator"; ground.name = "DividerBackground"; ground.bounds.size.width = 1
        thin.name = "DividerBackground"; thin.bounds.size.width = 0.5
        [line, other, ground, thin].forEach(root.addSublayer)
        ListEdgeLine.hideLines(in: root)
        #expect(ground.isHidden)
        #expect(!line.isHidden, "the bar's hairline stays, as in Notes")
        #expect(!other.isHidden && !thin.isHidden, "the sidebar's own divider stays")
    }

    /// Clicking your name opens Settings at Account, even when another page was shown last; there's
    /// no menu.
    @Test func theAccountRowOpensSettingsAtAccount() {
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "account-\(UUID())")!)
        route.tab = .ai
        AccountButton.open(route)
        #expect(route.presenting)
        #expect(route.tab == .account && route.target == .account, "Account, not the last page (\(route.tab))")
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

    /// Go to Note pops in like the sheets and leaves faster; Reduce Motion only fades.
    @Test func goToNoteHasATransition() throws {
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        #expect(root.contains("QuickOpen.transition(reduceMotion:"))
        #expect(root.contains("value: quickOpen == nil"))
        #expect(QuickOpen.motion(opening: true, reduceMotion: false) != QuickOpen.motion(opening: false, reduceMotion: false))
        #expect(QuickOpen.motion(opening: true, reduceMotion: true) == QuickOpen.motion(opening: false, reduceMotion: true))
    }

    /// A note drags from anywhere on its card, not only its words.
    @Test func aNoteDragsFromItsWholeCard() throws {
        let list = try SettingsHomeTests.source("Pane/Views/NoteListView.swift")
        let row = try #require(list.range(of: "private struct ListRow").map { String(list[$0.lowerBound...].prefix(1600)) })
        let shape = try #require(row.range(of: ".contentShape(Rectangle().inset(by: -6))"))
        let drag = try #require(row.range(of: ".draggable(PaneDragItem(kind: .note"))
        #expect(shape.lowerBound < drag.lowerBound, "the shape comes before the drag")
    }

    /// The folder and the trash open while something's held over them; the trash shows during a drag.
    @Test func iconsOpenUnderADragAndTheTrashWaits() async throws {
        let sidebar = try SettingsHomeTests.source("Pane/Views/SidebarView.swift")
        #expect(sidebar.contains("DropOpenIcon(symbol: \"folder\", kind: .folder, open: lit"))
        #expect(sidebar.contains("DropOpenIcon(symbol: \"trash\", kind: .trash, open: noteOver"))
        #expect(sidebar.contains("|| Self.noteBeingDragged") && sidebar.contains("NoteDragging.shared.active"))
        let charm = try SettingsHomeTests.source("Pane/Views/Charm.swift")
        #expect(charm.contains("let open = max(moving, p.agape)"), "the folder's front drops for a held note")
        let drag = NoteDragging()
        #expect(!drag.active)
        drag.began()
        #expect(drag.active)
        drag.ended()
        #expect(drag.active, "still there for the drop, which lands after the lift")
        try await Task.sleep(for: NoteDragging.linger + .milliseconds(150))
        #expect(!drag.active)
    }

    /// A folder stays lit a moment after a drop and bounces once per drop; a later drop restarts it.
    @Test func aFolderReactsWhenSomethingLands() async throws {
        let drops = FolderDropState(), a = UUID(), b = UUID()
        drops.id = a
        #expect(drops.lit(a) && !drops.lit(b), "lit under the drag")
        drops.id = nil
        #expect(!drops.lit(a), "out when the drag leaves")
        drops.land(a)
        #expect(drops.lit(a) && drops.landings[a] == 1, "lit as it lands, one bounce")
        try await Task.sleep(for: FolderDropState.landedHold + .milliseconds(150))
        #expect(!drops.lit(a), "then it fades")
        drops.land(a)
        #expect(drops.landings[a] == 2 && drops.landings[b] == nil, "each drop bounces only its own row")
        let sidebar = try SettingsHomeTests.source("Pane/Views/SidebarView.swift")
        #expect(sidebar.contains("drops.lifted(folder.id)\n            DropLoader.load(providers)"), "lit before the dropped item is read")
        // The wait between the lift and the drop keeps the row lit, and the drop's own time replaces it.
        drops.lifted(b)
        #expect(drops.lit(b) && !drops.lit(a), "lit from the lift")
        drops.land(b)
        try await Task.sleep(for: FolderDropState.landedHold + .milliseconds(150))
        #expect(!drops.lit(b), "the drop's shorter hold wins")
    }
}
#endif
