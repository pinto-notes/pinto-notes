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
        // The hint stops once the / menu has been used a few times: start from none used, as
        // SlashMenuEditorTests does (other suites leave uses behind in the test host).
        SlashRecents.clear()
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
        // The hint stops once the / menu has been used a few times: start from none used, as
        // SlashMenuEditorTests does (other suites leave uses behind in the test host).
        SlashRecents.clear()
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

    /// Go to Note drops in quickly from just above, like the app's sheets but faster, and goes at
    /// once: no spring, no scale (Emil, 9 November 2026: the spring was "really slow", a fade alone
    /// felt unlike the other sheets, and with nothing "some transition would be good").
    @Test func goToNoteHasATransition() throws {
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        #expect(root.contains("QuickOpen.transition(reduceMotion:"))
        // The transition sits on the layer that is inserted, after its onDisappear, not on the
        // panel inside it (there it never ran: Emil saw a plain fade).
        let content = try #require(root.range(of: "private var quickOpenContent").map { String(root[$0.lowerBound...].prefix(2400)) })
        let gone = try #require(content.range(of: ".onDisappear { RowPressSlop.cover = nil"))
        let placed = try #require(content.range(of: ".transition(QuickOpen.transition"))
        #expect(gone.upperBound < placed.lowerBound)
        #expect(root.contains("value: quickOpen == nil"))
        #expect(QuickOpen.openDuration > 0 && QuickOpen.openDuration <= 0.16)
        #expect(QuickOpen.motion(opening: true, reduceMotion: false) == .easeOut(duration: QuickOpen.openDuration))
        #expect(QuickOpen.motion(opening: false, reduceMotion: false) == .easeOut(duration: 0), "closing is instant")
        #expect(QuickOpen.motion(opening: true, reduceMotion: true) == .easeOut(duration: 0), "Reduce Motion: no movement")
        #expect(QuickOpen.dropDistance <= 12)
        let source = try SettingsHomeTests.source("Pane/Views/QuickOpen.swift")
        let transition = try #require(source.range(of: "static func transition").map { String(source[$0.lowerBound...].prefix(260)) })
        #expect(!transition.contains("scale") && !transition.contains("spring"), "nothing grows or bounces")
        #expect(transition.contains("removal: .identity"), "it goes at once")
    }

    /// A note drags from anywhere on its card, not only its words.
    @Test func aNoteDragsFromItsWholeCard() throws {
        let list = try SettingsHomeTests.source("Pane/Views/NoteListView.swift")
        // The row's declaration through its body (it grew past 1,600 characters with its tags and drag chip).
        let row = try #require(list.range(of: "private struct ListRow").map { String(list[$0.lowerBound...].prefix(4000)) })
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
        #expect(sidebar.contains("drops.lifted(folder.id)\n            let dropped = DropSpeed.start()\n            DropLoader.load(providers)"), "lit before the dropped item is read")
        // The wait between the lift and the drop keeps the row lit, and the drop's own time replaces it.
        drops.lifted(b)
        #expect(drops.lit(b) && !drops.lit(a), "lit from the lift")
        drops.land(b)
        try await Task.sleep(for: FolderDropState.landedHold + .milliseconds(150))
        #expect(!drops.lit(b), "the drop's shorter hold wins")
    }
}
#endif
