#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The notes window's toolbar and the note's first lines, in a real window that is never shown:
/// a titled window lays out its toolbar without being on screen, and nothing appears on the display.
@MainActor @Suite(.serialized) struct MacWindowChromeTests {
    /// The demo library's window with `title` open, at `size`.
    static func window(_ c: ModelContainer, size: CGSize) -> NSWindow {
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                         styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore()))
        w.setContentSize(size)
        return w
    }

    static func settle(_ w: NSWindow, _ turns: Int = 10) async {
        for _ in 0..<turns {
            w.contentView?.layoutSubtreeIfNeeded()
            w.displayIfNeeded()
            try? await Task.sleep(for: .milliseconds(100))
        }
    }

    static func find<T: NSView>(_ type: T.Type, in view: NSView, where ok: @MainActor (T) -> Bool = { _ in true }) -> T? {
        if let v = view as? T, ok(v) { return v }
        for s in view.subviews { if let v = find(type, in: s, where: ok) { return v } }
        return nil
    }

    /// The toolbar's items with a view, by label, and the column each one stands over.
    static func items(_ w: NSWindow) throws -> [(label: String, column: Int, frame: CGRect)] {
        let split = try #require(w.contentView.flatMap { find(NSSplitView.self, in: $0) })
        let columns = split.arrangedSubviews.map { $0.isHidden ? CGRect.null : $0.convert($0.bounds, to: nil) }
        return (w.toolbar?.items ?? []).compactMap { item in
            guard let view = item.view, view.window != nil else { return nil }
            let f = view.convert(view.bounds, to: nil)
            let column = columns.firstIndex { !$0.isNull && f.midX >= $0.minX && f.midX < $0.maxX } ?? -1
            return (item.label, column, f)
        }
    }

    /// Emil (10-29): "inside the note panel we should just have the stuff that is relating to
    /// the note itself." Search and compose go to the list (Emil's pick A, 10-30: search over the
    /// field it opens), the sidebar has no buttons, and the note keeps Format, Checklist, Table,
    /// Attach, Share and More.
    @Test func eachColumnHoldsItsOwnControls() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            for size in [CGSize(width: 2200, height: 1000), CGSize(width: 1469, height: 920), CGSize(width: 1180, height: 760)] {
                let w = Self.window(c, size: size)
                defer { w.close() }
                await Self.settle(w)
                let items = try Self.items(w)
                print("toolbar at \(Int(size.width)): " + items.map { "\($0.label.isEmpty ? "(blank)" : $0.label)@\($0.column) \(Int($0.frame.minX))-\(Int($0.frame.maxX))" }.joined(separator: ", "))
                func column(_ label: String) -> [Int] { items.filter { $0.label == label }.map(\.column) }
                #expect(column("Search") == [1], "search sits in the list's header")
                // Daily notes: Today, at the sidebar's top (Emil approved the calendar there, 10-30).
                #expect(items.filter { $0.column == 0 }.map(\.label) == ["Today\u{2019}s note"], "only Today over the sidebar")
                if let today = items.first(where: { $0.column == 0 }) {
                    #expect(today.frame.maxY >= w.contentLayoutRect.maxY, "Today sits in the toolbar at the sidebar's top")
                }
                #expect(column("Hide Sidebar").isEmpty && column("Show Sidebar").isEmpty, "no sidebar button")
                #expect(column("New Note") == [1], "compose sits with the list")
                for label in ["Format", "Checklist", "Table", "Attach", "Share"] {
                    #expect(column(label) == [2], "\(label) stays with the note")
                }
                #expect(column("More").sorted() == [1, 2], "a More for the list and one for the note")
                #expect(!(w.toolbar?.items ?? []).contains { $0 is NSSearchToolbarItem }, "no search field over the note")

                // The list's round More on the left, its name centred, search and compose on the right.
                try Self.expectListHeader(w, items)

                // The note's groups stand over its text: Format starts at the text's left edge,
                // More ends at its right edge (the reading column's, in a wide window).
                let editor = try #require(w.contentView.flatMap { Self.find(PaneTextView.self, in: $0) })
                let page = editor.convert(editor.bounds, to: nil)
                let side = PaneTextView.textSide(width: page.width)
                let format = try #require(items.first { $0.label == "Format" })
                let noteMore = try #require(items.first { $0.label == "More" && $0.column == 2 })
                print("PERF note toolbar at \(Int(size.width)): text \(Int(page.minX + side))-\(Int(page.maxX - side)), Format from \(Int(format.frame.minX)), More to \(Int(noteMore.frame.maxX))")
                // In a narrow window the groups keep the toolbar's own place at the column's edges,
                // a little outside the text's 32 pt margin (a spacer is never narrower than 36 pt).
                let slack: CGFloat = NoteToolbarStage<EmptyView>.inset(column: page.width) == nil ? 24 : 2
                #expect(abs(format.frame.minX - (page.minX + side)) <= slack, "Format starts at the text's left edge")
                #expect(abs(noteMore.frame.maxX - (page.maxX - side)) <= slack, "More ends at the text's right edge")
            }
        }
    }

    /// The list's header: More, the name, then Search and New Note, in that order and not
    /// overlapping; the name centred in the column (its text, not the item's box).
    static func expectListHeader(_ w: NSWindow, _ items: [(label: String, column: Int, frame: CGRect)]) throws {
        let more = try #require(items.first { $0.label == "More" && $0.column == 1 })
        let search = try #require(items.first { $0.label == "Search" && $0.column == 1 })
        let compose = try #require(items.first { $0.label == "New Note" })
        #expect(abs(search.frame.width - compose.frame.width) <= 1 && abs(search.frame.width - more.frame.width) <= 1, "three circles the same size")
        let split = try #require(w.contentView.flatMap { find(NSSplitView.self, in: $0) })
        // The list as seen: the sidebar floats over the column's leading part.
        var list = split.arrangedSubviews[1].convert(split.arrangedSubviews[1].bounds, to: nil)
        let sidebar = split.arrangedSubviews[0]
        if !sidebar.isHidden && sidebar.frame.width > 0 {
            let edge = sidebar.convert(sidebar.bounds, to: nil).maxX
            list = CGRect(x: edge, y: list.minY, width: list.maxX - edge, height: list.height)
        }
        let header = NoteListView.headerWidth(column: list.width, minX: list.minX)
        // No name where the buttons leave it under 40 pt (the sidebar hidden beside a narrow list).
        guard NoteListView.titleRoom(listWidth: header) > 0 else {
            print("PERF list header \(Int(list.width)) pt, no name: More \(Int(more.frame.minX - list.minX))-\(Int(more.frame.maxX - list.minX)), Search \(Int(search.frame.minX - list.minX)), New Note to \(Int(compose.frame.maxX - list.minX))")
            #expect(more.frame.maxX < search.frame.minX && search.frame.maxX < compose.frame.minX, "More, Search, New Note")
            #expect(compose.frame.maxX <= list.maxX - 4 && more.frame.minX >= list.minX, "the buttons inside the list column")
            return
        }
        let title = try #require(items.first { $0.label.isEmpty && $0.column == 1 && $0.frame.width > 20 })
        #expect(more.frame.maxX < title.frame.minX && title.frame.maxX < search.frame.minX && search.frame.maxX < compose.frame.minX,
                "More, name, Search, New Note: \(more.frame) \(title.frame) \(search.frame) \(compose.frame)")
        // The name's text is the item less its lead.
        let lead = NoteListView.titleLead(listWidth: header)
        let t = CGRect(x: title.frame.minX + lead, y: title.frame.minY, width: title.frame.width - lead, height: title.frame.height)
        print("PERF list header \(Int(list.width)) pt: More \(Int(more.frame.minX - list.minX))-\(Int(more.frame.maxX - list.minX)), name \(Int(t.minX - list.minX))-\(Int(t.maxX - list.minX)), Search \(Int(search.frame.minX - list.minX)), New Note to \(Int(compose.frame.maxX - list.minX))")
        // Centred while the list has room for it (from about 310 pt).
        if lead >= 54 { #expect(abs(t.midX - list.midX) <= 6, "the name centred in the list (\(t.midX - list.midX) off)") }
        #expect(compose.frame.maxX <= list.maxX - 4 && more.frame.minX >= list.minX, "the buttons inside the list column")
    }

    /// The header at the list's narrowest: nothing overlaps or drops out of the toolbar.
    @Test func theListHeaderFitsTheNarrowestList() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = Self.window(c, size: CGSize(width: 1180, height: 760))
            defer { w.close() }
            await Self.settle(w)
            let split = try #require(w.contentView.flatMap { Self.find(NSSplitView.self, in: $0) })
            let list = split.arrangedSubviews[1].frame
            split.setPosition(list.minX + 200, ofDividerAt: 1)
            await Self.settle(w, 8)
            let items = try Self.items(w)
            print("toolbar, narrowest list: " + items.map { "\($0.label.isEmpty ? "(blank)" : $0.label)@\($0.column) \(Int($0.frame.minX))-\(Int($0.frame.maxX))" }.joined(separator: ", "))
            let shown = split.arrangedSubviews[1].frame.maxX - split.arrangedSubviews[0].frame.maxX
            #expect(shown < 270, "the list at its narrowest (\(shown) pt beside the sidebar)")
            try Self.expectListHeader(w, items)
        }
    }

    /// With the sidebar hidden the list's header keeps its Search button.
    @Test func searchStaysWithTheSidebarHidden() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = Self.window(c, size: CGSize(width: 1469, height: 920))
            defer { w.close() }
            await Self.settle(w)
            let split = try #require(w.contentView.flatMap { Self.find(NSSplitView.self, in: $0) })
            (split.delegate as? NSSplitViewController)?.toggleSidebar(nil)
            await Self.settle(w, 10)
            let items = try Self.items(w)
            print("toolbar, sidebar hidden: " + items.map { "\($0.label.isEmpty ? "(blank)" : $0.label)@\($0.column) \(Int($0.frame.minX))-\(Int($0.frame.maxX))" }.joined(separator: ", "))
            let search = items.filter { $0.label == "Search" }
            #expect(search.count == 1, "one Search button")
            let more = try #require(items.first { $0.label == "More" })
            #expect(search.first.map { $0.frame.minX > more.frame.maxX } == true, "in the list's header, after its More")
            try Self.expectListHeader(w, items)
        }
    }

    /// Search opens at the top of the list, from the list's Search button or ⌘F, and Escape closes
    /// it; the button again closes it too.
    /// In the note's text ⌘F finds in the note, as in Notes.
    @Test func searchOpensAtTheTopOfTheList() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = Self.window(c, size: CGSize(width: 1469, height: 920))
            defer { w.close() }
            await Self.settle(w)
            @MainActor func field() -> NSSearchField? { w.contentView.flatMap { Self.find(NSSearchField.self, in: $0) { $0.accessibilityIdentifier() == "list.search" } } }
            #expect(field() == nil, "no field until you search")

            // ⌘F with the note's text in front: the text view takes it.
            let editor = try #require(w.contentView.flatMap { Self.find(PaneTextView.self, in: $0) })
            w.makeFirstResponder(editor)
            let find = NSMenuItem(title: "Find…", action: #selector(NSTextView.performFindPanelAction(_:)), keyEquivalent: "f")
            find.tag = Int(NSFindPanelAction.showFindPanel.rawValue)
            #expect(editor.tryToPerform(#selector(NSTextView.performFindPanelAction(_:)), with: find))
            await Self.settle(w, 3)
            #expect(field() == nil, "⌘F in the note finds in the note")

            // ⌘F from the list.
            let table = try #require(w.contentView.flatMap { Self.find(NSTableView.self, in: $0) { $0.numberOfRows > 3 } })
            w.makeFirstResponder(table)
            #expect(table.tryToPerform(#selector(NSTextView.performFindPanelAction(_:)), with: find), "the window answers ⌘F")
            await Self.settle(w, 5)
            let search = try #require(field(), "⌘F opens the search field")
            let list = try #require(table.enclosingScrollView).convert(table.enclosingScrollView!.bounds, to: nil)
            let f = search.convert(search.bounds, to: nil)
            #expect(f.minX >= list.minX && f.maxX <= list.maxX, "the field is in the list column")
            #expect(f.maxY <= w.contentLayoutRect.maxY + 1, "below the toolbar")
            #expect((w.firstResponder as? NSTextView)?.delegate === search, "the keys go to the field")

            // Escape closes it.
            if let editing = w.firstResponder as? NSTextView { editing.doCommand(by: #selector(NSResponder.cancelOperation(_:))) }
            await Self.settle(w, 3)
            #expect(field() == nil, "Escape closes the search")

            // The notification Go to Note (⌘O) and Edit › Find send.
            NotificationCenter.default.post(name: .paneSearchNotes, object: nil)
            await Self.settle(w, 5)
            #expect(field() != nil)
            if let editing = w.firstResponder as? NSTextView { editing.doCommand(by: #selector(NSResponder.cancelOperation(_:))) }
            await Self.settle(w, 3)

            // The list header's button: opens the field with the keys in it, under the button.
            let button = try #require(Self.toolbarItem(w, "Search"), "a Search button in the list's header")
            #expect(Self.press(button))
            await Self.settle(w, 5)
            let opened = try #require(field(), "the button opens the field")
            #expect((w.firstResponder as? NSTextView)?.delegate === opened, "the keys go to the field")
            let b = try #require(button.view).convert(button.view!.bounds, to: nil), o = opened.convert(opened.bounds, to: nil)
            #expect(b.minY >= o.maxY && b.midX >= o.minX && b.midX <= o.maxX, "the field opens under the button")
            // Without a focus ring in the app's amber.
            #expect(opened.focusRingType == .none)
            // Pressed again, it closes.
            #expect(Self.press(button))
            await Self.settle(w, 3)
            #expect(field() == nil, "the button again closes the field")
        }
    }

    /// A toolbar item, by its label, while it stands in the window's toolbar.
    static func toolbarItem(_ w: NSWindow, _ label: String) -> NSToolbarItem? {
        w.toolbar?.items.first { $0.label == label && $0.view?.window != nil }
    }

    /// Presses a toolbar item's button the way its overflow menu does: the same action a click
    /// runs. (A click needs the window on screen; this window never is.)
    static func press(_ item: NSToolbarItem) -> Bool {
        guard let m = item.menuFormRepresentation, let action = m.action else { return false }
        return NSApp.sendAction(action, to: m.target, from: m)
    }

    /// Emil (10-29): "the content of the note is placed weirdly far down." His draft: the date just
    /// under the toolbar at the text's left edge and the title close under it, with the sidebar
    /// shown or hidden.
    @Test func theNoteStartsJustUnderTheToolbar() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = Self.window(c, size: CGSize(width: 1469, height: 920))
            defer { w.close() }
            await Self.settle(w)
            for sidebar in [true, false] {
                if !sidebar, let split = w.contentView.flatMap({ Self.find(NSSplitView.self, in: $0) }) {
                    (split.delegate as? NSSplitViewController)?.toggleSidebar(nil)
                    await Self.settle(w, 8)
                }
                let editor = try #require(w.contentView.flatMap { Self.find(PaneTextView.self, in: $0) })
                let date = try #require(Self.find(NSTextField.self, in: editor) { $0.accessibilityIdentifier() == "editor.date" })
                // Window coordinates run up from the bottom: the toolbar's bottom edge is the top of the content layout rect.
                let toolbarBottom = w.contentLayoutRect.maxY
                let dateFrame = date.convert(date.bounds, to: nil)
                let dateGap = toolbarBottom - dateFrame.maxY
                let firstLine = editor.firstRect(forCharacterRange: NSRange(location: 0, length: 1), actualRange: nil)
                let lineTop = w.convertFromScreen(firstLine).maxY
                let titleGap = dateFrame.minY - lineTop
                let page = editor.convert(editor.bounds, to: nil)
                print("PERF note top (sidebar \(sidebar ? "shown" : "hidden")): date \(Int(dateGap)) pt under the toolbar, title \(Int(titleGap)) pt under the date, page \(NSStringFromRect(page))")
                #expect(dateGap >= 6 && dateGap <= 14, "the date sits \(dateGap) pt under the toolbar (Notes: about 10)")
                #expect(titleGap >= 0 && titleGap <= 16, "the title sits \(titleGap) pt under the date")
                // Emil's draft: at the text's left edge, like the title under it.
                #expect(abs(dateFrame.minX - (page.minX + PaneTextView.textSide(width: page.width))) <= 1, "the date starts where the text does")
            }
        }
    }

    /// "Get started" (###) is the small bold muted label on the Mac too, as on the iPhone.
    @Test func aSubheadingIsASmallMutedLabel() {
        guard DesignLook.readingPage else { return }
        let text = "Welcome\n\n### Get started\nOne thing"
        let storage = NSTextStorage(string: text)
        var styler = MarkdownStyler()
        styler.firstLineIsTitle = true
        styler.apply(to: storage, active: NSRange(location: 0, length: 0))
        let at = (text as NSString).range(of: "Get started").location
        let font = storage.attribute(.font, at: at, effectiveRange: nil) as? NSFont
        #expect(font?.pointSize == EditorMetrics.label)
        #expect(font.map { NSFontManager.shared.traits(of: $0).contains(.boldFontMask) } == true)
        #expect(storage.attribute(.foregroundColor, at: at, effectiveRange: nil) as? NSColor == Palette.muted)
    }
    /// Emil (10-30): "there is no visible separation between note and notes list" in the dark. A
    /// one-pixel separator runs between them, from the window's top edge (the toolbar band) to the
    /// bottom, light and dark: it stands out from the ground on both sides, and is one pixel wide.
    @Test func aHairlineSeparatesTheListFromTheNote() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            for dark in [false, true] {
                // Drawn the way the HIG snapshots draw the window's content (no toolbar here: the
                // line runs into the toolbar band through ignoresSafeArea).
                let size = CGSize(width: 1469, height: 920)
                let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height), styleMask: [.borderless], backing: .buffered, defer: false)
                w.isReleasedWhenClosed = false
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                let host = NSHostingView(rootView: RootView().modelContainer(c).environment(SetupStore()))
                host.appearance = w.appearance
                host.frame = CGRect(origin: .zero, size: size)
                w.contentView = host
                defer { w.close() }
                await Self.settle(w, 12)
                let split = try #require(Self.find(NSSplitView.self, in: host))
                let noteView = try #require(split.arrangedSubviews.last)
                let note = noteView.convert(noteView.bounds, to: host)
                host.layoutSubtreeIfNeeded()
                let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
                host.cacheDisplay(in: host.bounds, to: rep)
                let scale = CGFloat(rep.pixelsWide) / size.width
                let lineX = Int((note.minX * scale).rounded())
                for fromTop in [120.0, 500.0, 880.0] {
                    let y = Int(fromTop * scale)
                    func lum(_ x: Int) -> CGFloat {
                        guard let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.sRGB) else { return -1 }
                        return 0.2126 * c.redComponent + 0.7152 * c.greenComponent + 0.0722 * c.blueComponent
                    }
                    let line = lum(lineX), left = lum(lineX - 6), right = lum(lineX + 6), next = lum(lineX + 1)
                    print("PERF hairline \(dark ? "dark" : "light") at \(Int(fromTop)) pt: line \(line) list \(left) note \(right) next pixel \(next) (x \(lineX) of \(rep.pixelsWide))")
                    #expect(abs(line - right) > 0.03 && abs(line - left) > 0.03, "\(dark ? "dark" : "light"), \(Int(fromTop)) pt down: the line stands out (line \(line), list \(left), note \(right))")
                    #expect(abs(next - right) < 0.01, "\(dark ? "dark" : "light"), \(Int(fromTop)) pt down: one pixel wide")
                }
            }
        }
    }

    /// The list's header with search closed and open, light and dark, for review (AMBER_HIG_SHOTS):
    /// the list column's top 140 pt. Off screen the glass circles come out without their symbols.
    @Test func listHeaderShots() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Lisbon") {
            for dark in [false, true] {
                let w = Self.window(c, size: CGSize(width: 1469, height: 920))
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                defer { w.close() }
                await Self.settle(w, 15)
                let split = try #require(w.contentView.flatMap { Self.find(NSSplitView.self, in: $0) })
                let left = split.arrangedSubviews[0].frame.maxX, right = split.arrangedSubviews[1].frame.maxX
                for open in [false, true] {
                    if open {
                        #expect(Self.press(try #require(Self.toolbarItem(w, "Search"))))
                        await Self.settle(w, 8)
                    }
                    let frame = try #require(w.contentView?.superview)
                    frame.wantsLayer = true
                    let scale: CGFloat = 2, height: CGFloat = 140
                    let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int((right - left) * scale), pixelsHigh: Int(height * scale),
                                                            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
                    let ctx = try #require(NSGraphicsContext(bitmapImageRep: rep))
                    // Layers draw from the bottom up: move the window's top strip over the list into the image.
                    ctx.cgContext.scaleBy(x: scale, y: scale)
                    ctx.cgContext.translateBy(x: -left, y: -(frame.bounds.height - height))
                    frame.layer?.render(in: ctx.cgContext)
                    try #require(rep.representation(using: .png, properties: [:]))
                        .write(to: dir.appending(path: "mac-list-header-\(open ? "open" : "closed")-\(dark ? "dark" : "light").png"))
                }
            }
        }
    }

    /// The whole window's layout, toolbar included, for review (AMBER_HIG_SHOTS). Drawn off screen
    /// the toolbar's glass comes out as plain shapes without their symbols, and the sidebar blank,
    /// but every item stands where it does in the app.
    @Test func toolbarLayoutShots() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Lisbon") {
            for (name, size) in [("default", CGSize(width: 1469, height: 920)), ("wide", CGSize(width: 2200, height: 1000))] {
                for dark in [false, true] {
                    let w = Self.window(c, size: size)
                    w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                    defer { w.close() }
                    await Self.settle(w, 15)
                    let frame = try #require(w.contentView?.superview)
                    frame.wantsLayer = true
                    let scale: CGFloat = 2
                    let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width * scale), pixelsHigh: Int(frame.bounds.height * scale),
                                                            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
                    let ctx = try #require(NSGraphicsContext(bitmapImageRep: rep))
                    ctx.cgContext.scaleBy(x: scale, y: scale)
                    frame.layer?.render(in: ctx.cgContext)
                    try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-toolbar-layout-\(name)-\(dark ? "dark" : "light").png"))
                }
            }
        }
    }
}
#endif
