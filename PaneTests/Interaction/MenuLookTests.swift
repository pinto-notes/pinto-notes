#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The Mac's menus as SwiftUI hands them to AppKit (Emil, 2 November 2026): a note's right-click
/// grouped as in Apple Notes, with Open Note in New Window, Lock Note and Version History; a red
/// title on every item whose icon is red; the list's New Note greyed while it can't make one; and
/// a note's or a folder's own window. Menus are got by handing a right-click event made here to
/// the views (never posted); windows are never shown.
extension MenuLookTests {
    // MARK: Helpers

    static func offscreenWindow(_ size: CGSize, styled: Bool = false) -> NSWindow {
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                         styleMask: styled ? [.titled, .closable, .resizable, .fullSizeContentView] : [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        return w
    }

    static func controls(_ v: NSView) -> [String] {
        ((v as? NSControl).map { ["\(type(of: $0)) enabled=\($0.isEnabled)"] } ?? []) + v.subviews.flatMap { controls($0) }
    }

    static func axButtons(_ e: any NSAccessibilityProtocol) -> [any NSAccessibilityProtocol] {
        let role = e.accessibilityRole()
        let me: [any NSAccessibilityProtocol] = role == .button || role == .menuButton ? [e] : []
        let kids: [any NSAccessibilityProtocol] = (e.accessibilityChildren() ?? []).compactMap { $0 as? any NSAccessibilityProtocol }
        return me + kids.flatMap { axButtons($0) }
    }

    static func layout(_ m: NSMenu) -> [String] { m.items.map { $0.isSeparatorItem ? "-" : $0.title } }

    // MARK: Asking for a menu

    /// A table that counts the times it's asked for a menu, with three rows.
    final class CountingTable: NSTableView, NSTableViewDataSource {
        var asked = 0
        override func menu(for event: NSEvent) -> NSMenu? { asked += 1; return NSMenu(title: "Row") }
        func numberOfRows(in tableView: NSTableView) -> Int { 3 }
    }

    /// The menu sweeps ask a table only on one of its rows. Past the rows the sidebar's list looks
    /// up row -1 and throws on the CI runners' macOS, which left FolderMenuShots running until the
    /// job's time ran out (18 November 2026).
    @Test func aTableIsAskedForItsMenuOnlyOnARow() throws {
        let w = Self.offscreenWindow(CGSize(width: 200, height: 200))
        let table = CountingTable(frame: CGRect(x: 0, y: 0, width: 200, height: 200))
        table.addTableColumn(NSTableColumn(identifier: .init("c")))
        table.rowHeight = 20
        table.dataSource = table
        w.contentView = table
        defer { w.close() }
        table.reloadData()
        func click(_ y: CGFloat) throws -> NSEvent {
            try #require(NSEvent.mouseEvent(with: .rightMouseDown, location: table.convert(CGPoint(x: 50, y: y), to: nil), modifierFlags: [], timestamp: 0,
                                            windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1))
        }
        let under = table.rect(ofRow: 2).maxY + 40
        #expect(table.row(at: CGPoint(x: 50, y: under)) == -1)
        #expect(Self.menu(of: table, for: try click(under)) == nil)
        #expect(table.asked == 0, "not asked past its rows")
        #expect(Self.menu(of: table, for: try click(table.rect(ofRow: 1).midY))?.title == "Row")
        #expect(table.asked == 1, "asked on a row")
        let onRows = stride(from: 195.0, to: 5, by: -4).filter { table.row(at: CGPoint(x: 50, y: $0)) >= 0 }.count
        #expect(Self.menu(in: table, window: w, x: 50) { _ in false } == nil)
        #expect(onRows > 0 && table.asked == 1 + onRows, "the sweep asks it once per point on a row, and nowhere else")
    }

    // MARK: Red titles

    /// A destructive item's title reaches the menu red; a plain one keeps the menu's colour. A
    /// destructive role alone doesn't do it on the Mac (its title stays black).
    @Test func aDestructiveItemHasARedTitle() async throws {
        let view = Color.white.frame(width: 200, height: 100).contextMenu {
            Button("Pin Note", systemImage: "pin") {}
            DestructiveMenuButton("Delete", systemImage: "trash") {}
            DestructiveMenuButton("Rename", systemImage: "pencil", destructive: false) {}
        }
        .tint(.primary)
        let w = Self.offscreenWindow(CGSize(width: 200, height: 100))
        let host = NSHostingView(rootView: view)
        host.frame = CGRect(x: 0, y: 0, width: 200, height: 100)
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(0.3))
        host.layoutSubtreeIfNeeded()
        let m = try #require(Self.menu(in: host, window: w, x: 100) { $0.items.contains { $0.title == "Delete" } })
        #expect(Self.layout(m) == ["Pin Note", "Delete", "Rename"])
        #expect(Self.isRed(Self.titleColor(m.items[1])), "Delete's title is red: \(String(describing: Self.titleColor(m.items[1])))")
        #expect(m.items[1].image != nil, "and it keeps its icon")
        #expect(Self.titleColor(m.items[0]) == nil && Self.titleColor(m.items[2]) == nil, "the rest in the menu's colour")
    }

    /// Every menu item in the app's code with a red icon uses DestructiveMenuButton, so its title is
    /// red too. Swipe actions keep a plain Button: their title sits on a red ground.
    @Test func everyDestructiveMenuItemUsesTheRedTitle() throws {
        var found = 0
        var plain: [String] = []
        for folder in ["Views", "Editor", "App", "Model", "Sync", "Collab"] {
            guard let root = try? TestFiles.url(folder) else { continue }
            let files = FileManager.default.enumerator(at: root, includingPropertiesForKeys: nil)?.compactMap { $0 as? URL }.filter { $0.pathExtension == "swift" } ?? []
            for file in files {
                let lines = try String(contentsOf: file, encoding: .utf8).components(separatedBy: "\n")
                for (i, line) in lines.enumerated() {
                    if line.contains("DestructiveMenuButton(") && !line.contains("struct DestructiveMenuButton") { found += 1 }
                    guard line.contains("Button(") && !line.contains("DestructiveMenuButton(") && line.contains("systemImage") && line.contains(".destructive") else { continue }
                    let before = lines[max(0, i - 3)..<i].joined(separator: "\n")
                    if !before.contains(".swipeActions") { plain.append("\(file.lastPathComponent):\(i + 1)") }
                }
            }
        }
        #expect(found >= 20, "the scan found the app's destructive menu items (\(found))")
        #expect(plain.isEmpty, "a destructive menu item whose title isn't red: \(plain)")
    }

    // MARK: A note's right-click

    /// The note list's right-click on a note: Apple Notes' groups, and Delete in red.
    @Test func aNotesRightClickIsGroupedLikeNotes() async throws {
        let c = try AppSnapshotTests.container()
        let size = CGSize(width: 360, height: 700)
        let view = NavigationStack { NoteListView(scope: .all, selection: .constant([]), onNewNote: {}) }
            .frame(width: size.width, height: size.height)
            .modelContainer(c)
            .tint(Color(PColor.paneAccent))
        let w = Self.offscreenWindow(size)
        let host = NSHostingView(rootView: view)
        host.frame = CGRect(origin: .zero, size: size)
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(0.8))
        host.layoutSubtreeIfNeeded()
        let m = try #require(Self.menu(in: host, window: w, x: 120) { m in
            m.items.contains { $0.title == NoteWindows.openNoteTitle } && m.items.contains { $0.title == "Lock Note" }
        })
        print("note menu: \(Self.layout(m))")
        // Share is the system's own item: whatever its title, it stands alone between Duplicate and Move to.
        var shown = Self.layout(m)
        let share = try #require(shown.firstIndex(of: "Duplicate Note")).advanced(by: 2)
        #expect(shown.indices.contains(share) && shown[share].localizedCaseInsensitiveContains("share"), "Share after Duplicate Note: \(shown)")
        if shown.indices.contains(share) { shown[share] = "Share" }
        let pin = shown[2]
        #expect(pin == "Pin Note" || pin == "Unpin Note")
        shown[2] = "Pin Note"
        #expect(shown == [NoteWindows.openNoteTitle, "-", "Pin Note", "Lock Note", "-", "Duplicate Note", "-", "Share", "-",
                          "Move to", NoteMoreMenu.historyTitle, "-", "Delete"])
        let delete = try #require(m.items.last)
        #expect(Self.isRed(Self.titleColor(delete)), "Delete in red")
        #expect(m.items.filter { !$0.isSeparatorItem && $0 !== delete }.allSatisfy { !Self.isRed(Self.titleColor($0)) }, "nothing else in red")
        #expect(m.items.first { $0.title == "Move to" }?.submenu != nil, "Move to lists the folders")
    }

    // MARK: New Note greyed

    @Test func newNoteIsOffOnlyOnAnUntouchedNewNote() throws {
        let context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        let blank = context.createNote(in: .all)
        let written = context.createNote(in: .all, body: "Groceries\nmilk")
        #expect(ListCompose.isOff(selected: blank.id, in: context))
        #expect(!ListCompose.isOff(selected: written.id, in: context))
        #expect(!ListCompose.isOff(selected: nil, in: context), "no note open: New Note makes one")
        #expect(!ListCompose.isOff(selected: UUID(), in: context))
        context.trash(blank)
        #expect(!ListCompose.isOff(selected: blank.id, in: context), "an empty note in Recently Deleted isn't the new note")
        #expect(String(describing: ListCompose.iconStyle(off: true)) == String(describing: HierarchicalShapeStyle.tertiary))
        #expect(String(describing: ListCompose.iconStyle(off: false)) == String(describing: HierarchicalShapeStyle.primary))
    }

    /// In the window's toolbar New Note turns off while the open note is an untouched new one, and
    /// on again once it has text. On it is a menu with a primary action, which AppKit draws as a
    /// segmented control: `.disabled` on that stopped clicks but left it drawn as on (what Emil
    /// saw). Off it is a disabled button with the pencil in the tertiary style. A window that is
    /// never shown is never key, so AppKit greys both alike there: the test reads the controls, not
    /// the pixels.
    @Test func newNoteTurnsOffInTheToolbar() async throws {
        let c = try AppSnapshotTests.container()
        let ctx = c.mainContext
        let note = try #require(try ctx.fetch(FetchDescriptor<Note>()).first { $0.title == "Groceries" })
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1180, height: 760))
            defer { w.close() }
            await MacWindowChromeTests.settle(w)
            // New Note shares the list's toolbar item with its ••• (7 November 2026).
            let item = try #require(await MacWindowChromeTests.composeItem(w), "New Note in the toolbar")
            @MainActor func controls() -> [String]? { item.view.map { Self.controls($0) } }
            @MainActor func settle(until ok: @MainActor ([String]) -> Bool) async -> [String]? {
                for _ in 0..<40 {
                    if let now = controls(), ok(now) { return now }
                    await MacWindowChromeTests.settle(w, 1)
                }
                return controls()
            }
            let on = try #require(controls())
            #expect(on == ["SwiftUISegmentedControl enabled=true"], "on: the menu, New Note or New App: \(on)")
            // The note is emptied, as a new note is.
            note.body = ""
            try ctx.save()
            #expect(ListCompose.isOff(selected: note.id, in: ctx))
            let off = await settle { !$0.contains { $0.hasPrefix("SwiftUISegmentedControl") } }
            #expect(off?.contains { $0.hasPrefix("SwiftUISegmentedControl") } == false, "off: not the menu that stayed drawn as on: \(String(describing: off))")
            #expect(String(describing: ListCompose.iconStyle(off: true)) == String(describing: HierarchicalShapeStyle.tertiary), "the pencil greyed")
            // Written in again: New Note comes back.
            note.body = "Groceries\nmilk"
            try ctx.save()
            let back = await settle { $0 == ["SwiftUISegmentedControl enabled=true"] }
            #expect(back == ["SwiftUISegmentedControl enabled=true"], "on again: \(String(describing: back))")
        }
    }

    // MARK: Own windows

    /// Open Note in New Window: the window holds that note in the editor, ready to edit.
    @Test func aNoteWindowOpensTheNoteById() async throws {
        let c = try AppSnapshotTests.container()
        let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Groceries" })
        let w = Self.offscreenWindow(CGSize(width: 640, height: 600), styled: true)
        w.contentViewController = NSHostingController(rootView: NoteWindowView(noteID: note.id).modelContainer(c).environment(SetupStore()))
        w.setContentSize(CGSize(width: 640, height: 600))
        defer { w.close() }
        await MacWindowChromeTests.settle(w)
        let editor = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
        #expect(editor.string.contains("Groceries"), "the note's text: \(editor.string.prefix(60))")
        #expect(editor.isEditable)
        #expect(w.toolbar?.items.contains { $0.label == "More" } == true, "the note's own ••• menu")
        #expect(await MacWindowChromeTests.composeItem(w, tries: 5) == nil, "no list, so no compose")
    }

    /// At its first size a note's window shows every tool: no » menu holding Share and More
    /// (Emil, 3 November 2026: the window's hidden title took their room).
    @Test func aNoteWindowFitsItsWholeBar() async throws {
        let c = try AppSnapshotTests.container()
        let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Groceries" })
        let w = Self.offscreenWindow(CGSize(width: 640, height: 500), styled: true)
        w.toolbarStyle = .unified
        w.contentViewController = NSHostingController(rootView: NoteWindowView(noteID: note.id).modelContainer(c).environment(SetupStore()))
        w.setContentSize(CGSize(width: 640, height: 500))
        defer { w.close() }
        await MacWindowChromeTests.settle(w, 10)
        let visible = w.toolbar?.visibleItems?.map(\.label) ?? []
        for label in ["Back", "Forward", "Format", "Share", "More"] {
            #expect(visible.contains(label), "\(label) is in the bar, not in a » menu: \(visible)")
        }
        #expect(w.titleVisibility == .hidden || w.toolbar?.items.contains { $0.itemIdentifier.rawValue.contains("title") } != true, "no title taking the bar's room")
    }

    @Test func aNoteWindowForADeletedNoteSaysSo() async throws {
        let c = try AppSnapshotTests.container()
        let w = Self.offscreenWindow(CGSize(width: 640, height: 600), styled: true)
        w.contentViewController = NSHostingController(rootView: NoteWindowView(noteID: UUID()).modelContainer(c))
        defer { w.close() }
        await MacWindowChromeTests.settle(w)
        #expect(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) } == nil)
        #expect(NoteWindows.note(UUID(), in: c.mainContext) == nil)
    }

    /// A folder's Open in New Window: its list and a note pane, with the list's New Note.
    @Test func aFolderWindowShowsThatFolder() async throws {
        let c = try AppSnapshotTests.container()
        let folder = try #require(c.mainContext.allFolders().first { !$0.liveNotes.isEmpty })
        let w = Self.offscreenWindow(CGSize(width: 1040, height: 700), styled: true)
        w.contentViewController = NSHostingController(rootView: FolderWindowView(folderID: folder.id).modelContainer(c).environment(SetupStore()))
        w.setContentSize(CGSize(width: 1040, height: 700))
        defer { w.close() }
        await MacWindowChromeTests.settle(w)
        let split = try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
        #expect(split.arrangedSubviews.filter { !$0.isHidden }.count == 2, "the list and the note")
        #expect(await MacWindowChromeTests.composeItem(w) != nil, "the list's New Note")
        #expect(w.title == folder.name || w.title.isEmpty)
    }

    /// The app has the two scenes the menus open, by id, and neither comes back at launch.
    @Test func theAppHasTheWindowScenes() throws {
        let app = try String(contentsOf: TestFiles.url("App").appending(path: "PaneApp.swift"), encoding: .utf8)
        for scene in ["NoteWindows.noteScene", "NoteWindows.folderScene"] {
            let decl = try #require(app.range(of: "WindowGroup(id: \(scene), for: UUID.self)"), "\(scene) is a scene")
            let after = String(app[decl.upperBound...].prefix(500))
            #expect(after.contains(".restorationBehavior(.disabled)"), "\(scene) isn't restored at launch")
        }
    }
}
#endif
