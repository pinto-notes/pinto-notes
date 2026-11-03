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
            guard !item.isHidden, let view = item.view, view.window != nil else { return nil }
            let f = view.convert(view.bounds, to: nil)
            let column = columns.firstIndex { !$0.isNull && f.midX >= $0.minX && f.midX < $0.maxX } ?? -1
            return (item.label, column, f)
        }
    }

    /// Emil (10-29): "inside the note panel we should just have the stuff that is relating to
    /// the note itself." Compose goes to the list; the sidebar has New Folder, Today and Search
    /// (Emil, 10-31: search was in the list's header on 10-30); the note keeps Format, Checklist,
    /// Table, Attach, Share and More.
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
                try Self.expectSidebarButtons(w, items)
                #expect(column("Hide Sidebar").isEmpty && column("Show Sidebar").isEmpty, "no sidebar button")
                #expect(column("New Note") == [1], "compose sits with the list")
                for label in ["Format", "Checklist", "Table", "Attach", "Share"] {
                    #expect(column(label) == [2], "\(label) stays with the note")
                }
                #expect(column("More").sorted() == [1, 2], "a More for the list and one for the note")
                #expect(!(w.toolbar?.items ?? []).contains { $0 is NSSearchToolbarItem }, "no search field over the note")

                // The list's round More on the left, its name centred, search and compose on the right.
                try Self.expectListHeader(w, items)

                // Back and forward on the left, the note's tools on the right, ending at the text's
                // right edge (Emil, 11-01).
                let editor = try #require(w.contentView.flatMap { Self.find(PaneTextView.self, in: $0) })
                let page = editor.convert(editor.bounds, to: nil)
                let side = PaneTextView.textSide(width: page.width)
                let format = try #require(items.first { $0.label == "Format" })
                let noteMore = try #require(items.first { $0.label == "More" && $0.column == 2 })
                #expect(abs(noteMore.frame.maxX - (page.maxX - side)) <= 24, "More ends at the text's right edge")
                #expect(format.frame.minX > page.midX - 60, "the tools are on the right")
                #expect(column("Back") == [2] && column("Forward") == [2], "back and forward over the note, at every width")
                if let back = items.first(where: { $0.label == "Back" }) {
                    #expect(back.frame.minX < page.minX + side + 24, "back and forward start the bar at the left")
                }
            }
        }
    }

    /// Emil, 2 November 2026: the note's tools stood about 50 pt in from the window's right edge,
    /// because the empty item that keeps the toolbar's column was last; first, it pushed back and
    /// forward in from the left. It goes between them.
    @Test func theNoteToolsReachTheRightEdge() throws {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: "Pane/Views/NoteDetailView.swift")
        let source = try String(contentsOf: url, encoding: .utf8)
        let anchor = try #require(source.range(of: "ToolbarItem { Color.clear.frame(width: 1, height: 1)"))
        let tools = try #require(source.range(of: "Button(\"Checklist\", systemImage: \"checklist\", action: controller.checklist)"))
        let forward = try #require(source.range(of: "Button(\"Forward\", systemImage: \"chevron.forward\")"))
        #expect(forward.lowerBound < anchor.lowerBound && anchor.lowerBound < tools.lowerBound, "the empty anchor item sits between back and forward and the tools")
    }

    /// The bar over the list and the note is the columns' own ground in every folder, never the
    /// system's grey band. Left to AppKit, it put a hard band behind the whole toolbar in some
    /// folders and not others (Emil, 3 November 2026: "why did the top bar change on specifically
    /// this folder?", in a folder with a long name). Windows that are never shown get no such band,
    /// so this reads that the notes window asks for none.
    @Test func theBarNeverGetsTheSystemBand() throws {
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: "Pane/Views/RootView.swift")
        let source = try String(contentsOf: url, encoding: .utf8)
        #expect(source.contains(".toolbarBackgroundVisibility(.hidden, for: .windowToolbar)"))
    }

    /// There is no sidebar-hidden state (Emil, 11-01): Toggle Sidebar (⌃⌘S) does nothing, and the
    /// window can't get narrower than the three columns, so it never folds away.
    @Test func nothingHidesTheSidebar() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = Self.window(c, size: CGSize(width: 700, height: 600))
            defer { w.close() }
            await Self.settle(w)
            let split = try #require(w.contentView.flatMap { Self.find(NSSplitView.self, in: $0) })
            let sidebar = try #require(split.arrangedSubviews.first)
            #expect(!sidebar.isHidden && !split.isSubviewCollapsed(sidebar) && sidebar.frame.width >= 200,
                    "asked for 700 pt, the window keeps the sidebar: \(Int(w.frame.width)) pt, sidebar \(Int(sidebar.frame.width))")
        }
        // ⌃⌘S, the split view's own Toggle Sidebar, does nothing.
        let w = Self.window(c, size: CGSize(width: 1180, height: 760))
        defer { w.close() }
        await Self.settle(w)
        let split = try #require(w.contentView.flatMap { Self.find(NSSplitView.self, in: $0) })
        let sidebar = try #require(split.arrangedSubviews.first)
        let controller = try #require(split.delegate as? NSSplitViewController)
        #expect(controller.splitViewItems.first?.canCollapse == false, "the sidebar can't collapse")
        controller.toggleSidebar(nil)
        await Self.settle(w, 15)
        #expect(!sidebar.isHidden && !split.isSubviewCollapsed(sidebar) && sidebar.frame.width >= 200,
                "Toggle Sidebar leaves it: \(Int(sidebar.frame.width)) pt, collapsed \(split.isSubviewCollapsed(sidebar))")
    }

    /// The sidebar's top, left to right: New Folder, Today, Search, all over the sidebar, in the
    /// toolbar, the same size, not overlapping, and clear of the window's buttons.
    static func expectSidebarButtons(_ w: NSWindow, _ items: [(label: String, column: Int, frame: CGRect)]) throws {
        let sidebar = items.filter { $0.column == 0 }
        #expect(sidebar.map(\.label) == ["New Folder", "Today\u{2019}s note", "Search"], "New Folder, Today, Search over the sidebar: \(sidebar.map(\.label))")
        let frames = sidebar.map(\.frame).sorted { $0.minX < $1.minX }
        #expect(sidebar.map(\.frame) == frames, "in that order, left to right")
        for (a, b) in zip(frames, frames.dropFirst()) { #expect(a.maxX <= b.minX, "not overlapping") }
        for f in frames {
            #expect(f.maxY >= w.contentLayoutRect.maxY, "in the toolbar at the sidebar's top")
            #expect(abs(f.width - frames[0].width) <= 3, "the same size (the group's ends are a little wider)")
        }
        if let first = frames.first { #expect(first.minX >= 70, "clear of the window's buttons (\(first.minX))") }
        #expect(items.filter { $0.label == "Search" }.count == 1, "one Search button")
    }

    /// The list's header: More, the name, then New Note, in that order and not overlapping; the
    /// name centred in the column.
    static func expectListHeader(_ w: NSWindow, _ items: [(label: String, column: Int, frame: CGRect)]) throws {
        let more = try #require(items.first { $0.label == "More" && $0.column == 1 })
        let compose = try #require(items.first { $0.label == "New Note" })
        #expect(!items.contains { $0.label == "Search" && $0.frame.minX > more.frame.maxX }, "no Search in the list's header")
        #expect(abs(more.frame.width - compose.frame.width) <= 1, "two circles the same size")
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
            print("PERF list header \(Int(list.width)) pt, no name: More \(Int(more.frame.minX - list.minX))-\(Int(more.frame.maxX - list.minX)), New Note to \(Int(compose.frame.maxX - list.minX))")
            #expect(more.frame.maxX < compose.frame.minX, "More, New Note")
            #expect(compose.frame.maxX <= list.maxX - 4 && more.frame.minX >= list.minX, "the buttons inside the list column")
            return
        }
        let title = try #require(items.first { $0.label.isEmpty && $0.column == 1 && $0.frame.width > 20 })
        #expect(more.frame.maxX < title.frame.minX && title.frame.maxX < compose.frame.minX,
                "More, name, New Note: \(more.frame) \(title.frame) \(compose.frame)")
        let t = title.frame
        print("PERF list header \(Int(list.width)) pt: More \(Int(more.frame.minX - list.minX))-\(Int(more.frame.maxX - list.minX)), name \(Int(t.minX - list.minX))-\(Int(t.maxX - list.minX)), New Note to \(Int(compose.frame.maxX - list.minX))")
        // Centred between More and New Note (the window's buttons may cover the column's start).
        let mid = (more.frame.maxX + compose.frame.minX) / 2
        #expect(abs(t.midX - mid) <= 6, "the name centred between the buttons (\(t.midX - mid) off)")
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
            try Self.expectSidebarButtons(w, items)
        }
    }

    /// The sidebar at its narrowest keeps all three buttons in sight (none in an overflow menu).
    @Test func theNarrowestSidebarKeepsItsButtons() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = Self.window(c, size: CGSize(width: 1180, height: 760))
            defer { w.close() }
            await Self.settle(w)
            let split = try #require(w.contentView.flatMap { Self.find(NSSplitView.self, in: $0) })
            split.setPosition(150, ofDividerAt: 0)
            await Self.settle(w, 8)
            let width = split.arrangedSubviews[0].frame.width
            let items = try Self.items(w)
            print("toolbar, narrowest sidebar (\(Int(width)) pt): " + items.map { "\($0.label.isEmpty ? "(blank)" : $0.label)@\($0.column) \(Int($0.frame.minX))-\(Int($0.frame.maxX))" }.joined(separator: ", "))
            #expect(width < 250, "the sidebar at its narrowest (\(width) pt)")
            try Self.expectSidebarButtons(w, items)
        }
    }

    /// With the sidebar hidden its buttons stay beside the window's buttons, before the list's
    /// More, and the list's header still fits.
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
            let buttons = ["New Folder", "Today\u{2019}s note", "Search"].compactMap { l in items.first { $0.label == l } }
            #expect(buttons.count == 3, "New Folder, Today and Search stay")
            #expect(buttons.allSatisfy { $0.frame.maxX < more.frame.minX }, "before the list's More")
            if let last = buttons.last { print("PERF sidebar hidden: its buttons end at \(Int(last.frame.maxX)) pt; windowButtons is \(Int(NoteListView.windowButtons))") }
            try Self.expectListHeader(w, items)
        }
    }

    /// ⌘F from the list opens its field, while the sidebar's Search opens QuickOpen.
    /// In the note's text ⌘F finds in the note, as in Notes.
    @Test func searchOpensInTheListOrPanel() async throws {
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
            #expect(search.focusRingType == .none, "the list field has no amber focus ring")
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

            // The sidebar's Search button opens Go to Note instead of the list field.
            @MainActor func panelField() -> NSTextField? {
                w.contentView.flatMap { Self.find(NSTextField.self, in: $0) {
                    $0.isEditable && $0.placeholderString == "Go to a note, or type a command"
                } }
            }
            let button = try #require(Self.toolbarItem(w, "Search"), "a Search button at the sidebar's top")
            #expect(Self.press(button))
            await Self.settle(w, 5)
            _ = try #require(panelField(), "the button opens Go to Note")
            #expect(field() == nil, "the panel does not open the list's search")
            #expect(Self.press(button))
            await Self.settle(w, 3)
            #expect(panelField() == nil, "the button again closes the panel")
        }
    }

    /// New Folder makes and selects the folder, then edits its name in the sidebar row.
    @Test func sidebarNewFolderNamesItsRow() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = Self.window(c, size: CGSize(width: 1469, height: 920))
            defer { w.close() }
            await Self.settle(w)
            let before = Set(c.mainContext.allFolders().map(\.id))
            #expect(Self.press(try #require(Self.toolbarItem(w, "New Folder"), "New Folder at the sidebar's top")))
            await Self.settle(w, 5)
            let made = try #require(c.mainContext.allFolders().first { !before.contains($0.id) })
            #expect(made.name == "New Folder")
            #expect(w.attachedSheet == nil, "the name is edited inline")
            let field = try #require(w.contentView.flatMap { Self.find(NSTextField.self, in: $0) {
                $0.isEditable && $0.accessibilityIdentifier() == "folder.nameField"
            } })
            #expect(field.stringValue == "New Folder")
            let editor = try #require(w.firstResponder as? NSTextView)
            #expect(editor.delegate === field)
            #expect(editor.selectedRange() == NSRange(location: 0, length: ("New Folder" as NSString).length))
            editor.insertText("Audit folder", replacementRange: editor.selectedRange())
            editor.doCommand(by: #selector(NSResponder.insertNewline(_:)))
            await Self.settle(w, 3)
            #expect(made.name == "Audit folder", "Return commits the name")
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

    /// Emil (10-29): "the content of the note is placed weirdly far down." And 10-31: the date
    /// "should appear on scroll up", "at the very centre of the note". A note opens at its title,
    /// close under the toolbar, the date folded away above it; scrolled to the top, the date shows
    /// centred over the text, just under the toolbar, the title close under it. Sidebar shown or hidden.
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
                let scroll = try #require(editor.enclosingScrollView)
                let date = try #require(Self.find(NSTextField.self, in: editor) { $0.accessibilityIdentifier() == "editor.date" })
                // Window coordinates run up from the bottom: the toolbar's bottom edge is the top of the content layout rect.
                let toolbarBottom = w.contentLayoutRect.maxY
                func titleTop() -> CGFloat {
                    let firstLine = editor.firstRect(forCharacterRange: NSRange(location: 0, length: 1), actualRange: nil)
                    return w.convertFromScreen(firstLine).maxY
                }
                if sidebar {
                    // As it opens: folded, the title close under the toolbar, the date not seen.
                    let gap = toolbarBottom - titleTop()
                    print("PERF note opens: title \(Int(gap)) pt under the toolbar, date alpha \(date.alphaValue)")
                    #expect(gap >= 6 && gap <= 22, "the title sits \(gap) pt under the toolbar")
                    #expect(date.alphaValue < 0.05, "the date is folded away: alpha \(date.alphaValue)")
                }
                // Scrolled to the very top: the date in view.
                scroll.contentView.scroll(to: NSPoint(x: 0, y: -scroll.contentInsets.top))
                scroll.reflectScrolledClipView(scroll.contentView)
                await Self.settle(w, 2)
                let dateFrame = date.convert(date.bounds, to: nil)
                let dateGap = toolbarBottom - dateFrame.maxY
                let titleGap = dateFrame.minY - titleTop()
                let page = editor.convert(editor.bounds, to: nil)
                print("PERF note top (sidebar \(sidebar ? "shown" : "hidden")): date \(Int(dateGap)) pt under the toolbar, title \(Int(titleGap)) pt under the date, page \(NSStringFromRect(page))")
                #expect(date.alphaValue > 0.95, "scrolled up, the date shows")
                #expect(dateGap >= 6 && dateGap <= 14, "the date sits \(dateGap) pt under the toolbar (Notes: about 10)")
                #expect(titleGap >= 0 && titleGap <= 20, "the title sits \(titleGap) pt under the date")
                #expect(abs(dateFrame.midX - page.midX) <= 1, "the date is centred over the note")
                #expect(date.alignment == .center)
            }
        }
    }

    /// Headings in Notes' weights (Emil, 10-31: "they are too bold"): the title and a heading bold,
    /// not heavy and not tightened; a subheading a semibold heading in the text's colour.
    @Test func headingsAreNotesWeights() {
        let text = "Welcome\n\n# Big\n## Heading\n### Get started\nOne thing"
        let storage = NSTextStorage(string: text)
        var styler = MarkdownStyler()
        styler.firstLineIsTitle = true
        styler.apply(to: storage, active: NSRange(location: 0, length: 0))
        func at(_ s: String) -> Int { (text as NSString).range(of: s).location }
        func weight(_ s: String) -> CGFloat {
            let font = storage.attribute(.font, at: at(s), effectiveRange: nil) as? NSFont
            let traits = font?.fontDescriptor.object(forKey: .traits) as? [NSFontDescriptor.TraitKey: Any]
            return (traits?[.weight] as? CGFloat) ?? -1
        }
        func kern(_ s: String) -> CGFloat { (storage.attribute(.kern, at: at(s), effectiveRange: nil) as? CGFloat) ?? 0 }
        for s in ["Welcome", "Big", "Heading"] {
            #expect(abs(weight(s) - NSFont.Weight.bold.rawValue) < 0.01, "\(s) is bold: \(weight(s))")
            #expect(kern(s) == 0, "\(s) keeps its letter spacing")
        }
        #expect(abs(weight("Get started") - NSFont.Weight.semibold.rawValue) < 0.01, "a subheading is semibold: \(weight("Get started"))")
        #expect(((storage.attribute(.font, at: at("Get started"), effectiveRange: nil) as? NSFont)?.pointSize ?? 0) > EditorMetrics.body, "bigger than the text")
        #expect(storage.attribute(.foregroundColor, at: at("Get started"), effectiveRange: nil) as? NSColor != Palette.muted, "not a muted label")
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
