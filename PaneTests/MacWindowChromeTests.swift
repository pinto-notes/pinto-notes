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
    /// the note itself." Search takes the sidebar button's place, compose goes to the list, and
    /// the note keeps Format, Checklist, Table, Attach, Share and More.
    @Test func eachColumnHoldsItsOwnControls() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            for size in [CGSize(width: 1469, height: 920), CGSize(width: 1180, height: 760)] {
                let w = Self.window(c, size: size)
                defer { w.close() }
                await Self.settle(w)
                let items = try Self.items(w)
                print("toolbar at \(Int(size.width)): " + items.map { "\($0.label)@\($0.column) x\(Int($0.frame.minX))" }.joined(separator: ", "))
                func column(_ label: String) -> [Int] { items.filter { $0.label == label }.map(\.column) }
                #expect(column("Search") == [0], "search sits in the sidebar")
                // At the sidebar's trailing edge, where its toggle was (x 225 at a 260 pt sidebar).
                if let search = items.first(where: { $0.label == "Search" }), let split = w.contentView.flatMap({ Self.find(NSSplitView.self, in: $0) }) {
                    let sidebar = split.arrangedSubviews[0].convert(split.arrangedSubviews[0].bounds, to: nil)
                    #expect(sidebar.maxX - search.frame.maxX < 30, "search at the sidebar's trailing edge")
                }
                #expect(column("Hide Sidebar").isEmpty && column("Show Sidebar").isEmpty, "no sidebar button")
                #expect(column("New Note") == [1], "compose sits with the list")
                for label in ["Format", "Checklist", "Table", "Attach", "Share"] {
                    #expect(column(label) == [2], "\(label) stays with the note")
                }
                #expect(column("More").sorted() == [1, 2], "a More for the list and one for the note")
                #expect(!(w.toolbar?.items ?? []).contains { $0 is NSSearchToolbarItem }, "no search field over the note")
                // The list's More, then compose, at its trailing edge.
                let more = try #require(items.first { $0.label == "More" && $0.column == 1 })
                let compose = try #require(items.first { $0.label == "New Note" })
                #expect(more.frame.maxX <= compose.frame.minX)
            }
        }
    }

    /// Search opens at the top of the list, from the sidebar's button or ⌘F, and Escape closes it.
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

            // The sidebar's button.
            NotificationCenter.default.post(name: .paneSearchNotes, object: nil)
            await Self.settle(w, 5)
            #expect(field() != nil)
        }
    }

    /// Emil (10-29): "the content of the note is placed weirdly far down." Like Notes on the Mac:
    /// the date centred just under the toolbar and the title close under it, with the sidebar
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
                #expect(abs(dateFrame.midX - page.midX) <= 1, "the date is centred over the note")
                #expect(date.alignment == .center)
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
}
#endif
