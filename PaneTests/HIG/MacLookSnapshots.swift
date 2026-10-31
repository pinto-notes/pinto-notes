#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The Mac window against Apple Notes (the 2026-10-11 pass): the sidebar's selection and its
/// Recently Deleted row, and the account row at its foot, each in light and dark,
/// with the alternative look where there is one. Offscreen, like the other shots:
/// `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/MacLookSnapshots`.
@MainActor @Suite(.serialized) struct MacLookSnapshots {
    static func sidebar(_ c: ModelContainer, scope: Scope) -> some View {
        NavigationStack { SidebarView(scope: .constant(scope), onNewNote: {}) }
            .frame(width: 260, height: 400)
            .modelContainer(c)
            .tint(Color(PColor.paneAccent))
            // As in the window in front: the capture's own window is never key.
            .environment(\.controlActiveState, .key)
    }

    /// A folder selected, All Notes selected, a folder under the pointer beside the selection,
    /// and Recently Deleted once a note is in it (it has no row before).
    @Test(arguments: [false, true])
    func sidebarSelection(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let c = try AppSnapshotTests.container()
        let ideas = try #require(c.mainContext.allFolders().first { $0.name == "Ideas" })
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .folder(ideas.id)), name: "mac-look-sidebar-folder-\(mode)", dark: dark)
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .all), name: "mac-look-sidebar-all-\(mode)", dark: dark)
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .folder(ideas.id)).environment(\.hoverPreview, ["Travel"]), name: "mac-look-sidebar-hover-\(mode)", dark: dark)
        Hover.tintedSelection = true
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .folder(ideas.id)), name: "mac-look-sidebar-folder-alt-tinted-\(mode)", dark: dark)
        Hover.tintedSelection = false
        // Two notes deleted: the row is back, last, with its count.
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>()).filter { $0.trashedAt == nil && $0.deletedAt == nil }
        c.mainContext.remove(Array(notes.prefix(2)))
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .folder(ideas.id)), name: "mac-look-sidebar-deleted-\(mode)", dark: dark)
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .trash), name: "mac-look-sidebar-deleted-open-\(mode)", dark: dark)
    }

    /// The selection is drawn by the rows, so it has to follow the selection when it changes
    /// under a sidebar that is already up (the window hands it over as an equatable view, which
    /// skips updates from outside): Ideas first, then Travel, in the same view.
    @Test func theDrawnSelectionFollowsTheSelection() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try AppSnapshotTests.container()
        let ideas = try #require(c.mainContext.allFolders().first { $0.name == "Ideas" })
        let travel = try #require(c.mainContext.allFolders().first { $0.name == "Travel" })
        let box = ScopeBox(scope: .folder(ideas.id))
        let host = NSHostingView(rootView: FollowingSidebar(box: box).modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key))
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 260, height: 400), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.appearance = NSAppearance(named: .darkAqua)
        window.contentView = host
        defer { window.close() }
        func shot(_ name: String) throws -> Data {
            host.layoutSubtreeIfNeeded()
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            let png = try #require(rep.representation(using: .png, properties: [:]))
            try png.write(to: dir.appending(path: "\(name).png"))
            return png
        }
        try? await Task.sleep(for: .seconds(0.8))
        let first = try shot("mac-look-sidebar-follows-1-ideas")
        box.scope = .folder(travel.id)
        try? await Task.sleep(for: .seconds(0.8))
        let second = try shot("mac-look-sidebar-follows-2-travel")
        #expect(first != second, "the drawn selection moved with the selection")
    }

    /// The note list with a note selected: a neutral fill, like the folder's, not an amber bar;
    /// and a folder with nothing in it: the leaf and "No Notes", no button.
    @Test(arguments: [false, true])
    func noteList(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let c = try AppSnapshotTests.container()
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>()).filter { $0.trashedAt == nil && $0.deletedAt == nil }
        let picked = try #require(notes.first)
        func list(_ scope: Scope, _ selected: Set<UUID>) -> some View {
            NavigationStack { NoteListView(scope: scope, selection: .constant(selected), onNewNote: {}) }
                .frame(width: 300, height: 460).modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key)
        }
        try await AppSnapshotTests.render(list(.all, [picked.id]), name: "mac-look-list-selected-\(mode)", dark: dark, wait: 1.0)
        // Item 66: a note under the pointer shows its ••• at the right, beside the selected one.
        let other = try #require(notes.first { $0.id != picked.id && !$0.isPinned })
        try await AppSnapshotTests.render(list(.all, [picked.id]).environment(\.hoverPreview, [other.title]), name: "mac-look-list-hover-\(mode)", dark: dark, wait: 1.0)
        let empty = c.mainContext.createFolder(named: "Empty")
        try await AppSnapshotTests.render(list(.folder(empty.id), []), name: "mac-look-list-empty-\(mode)", dark: dark, wait: 1.0)
    }

    /// The sidebar's left edge (item 65): the title, the Folders heading, every row's icon and the
    /// account row start on one line. With and without sub-folders (the outline makes room for
    /// its arrows), and at the large sidebar size; light and dark.
    @Test(arguments: [false, true])
    func sidebarEdge(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let backend = Backend()
        backend.showSignedInForPreview(email: "sara@example.com")
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let nested = try AppSnapshotTests.container()
        let flat = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let notes = flat.mainContext.createFolder(named: "Notes")
        _ = flat.mainContext.createNote(in: .folder(notes.id), body: "Groceries\n\nMilk")
        let gone = flat.mainContext.createNote(in: .folder(notes.id), body: "Old")
        flat.mainContext.trash(gone)
        func sidebar(_ c: ModelContainer, _ scope: Scope, size: SidebarRowSize = .medium) -> some View {
            NavigationStack { SidebarView(scope: .constant(scope), onNewNote: {}) }
                .frame(width: 260, height: 420)
                .modelContainer(c)
                .environment(backend)
                .environment(\.sidebarRowSize, size)
                .tint(Color(PColor.paneAccent))
                .environment(\.controlActiveState, .key)
        }
        let ideas = try #require(nested.mainContext.allFolders().first { $0.name == "Ideas" })
        try await AppSnapshotTests.render(sidebar(nested, .folder(ideas.id)), name: "mac-edge-nested-\(mode)", dark: dark)
        try await AppSnapshotTests.render(sidebar(flat, .folder(notes.id)), name: "mac-edge-flat-\(mode)", dark: dark)
        try await AppSnapshotTests.render(sidebar(nested, .folder(ideas.id), size: .large), name: "mac-edge-nested-large-\(mode)", dark: dark)
        try await AppSnapshotTests.render(sidebar(flat, .folder(notes.id), size: .large), name: "mac-edge-flat-large-\(mode)", dark: dark)
    }

    /// The account row: a name with a photo, a name alone (initials), and no name yet, which is
    /// "Your account" with a person, never an address. The alternative adds the email under the name.
    @Test(arguments: [false, true])
    func accountRow(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let backend = Backend()
        backend.showSignedInForPreview(email: "f7k6w27tsh@privaterelay.appleid.com")
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        func row(_ email: String? = nil) -> some View {
            AccountButton(backend: backend, email: email).frame(width: 240).padding(10).tint(Color(PColor.paneAccent))
        }
        let face = try ProfileImage.prepare(try #require(NSImage(named: "MarkTight")?.tiffRepresentation))
        ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: nil)
        try await AppSnapshotTests.render(row(), name: "mac-look-account-name-\(mode)", dark: dark)
        try await AppSnapshotTests.render(row("emil@example.com"), name: "mac-look-account-alt-email-\(mode)", dark: dark)
        ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: NSImage(data: face))
        try await AppSnapshotTests.render(row(), name: "mac-look-account-photo-\(mode)", dark: dark)
        ProfileStore.shared.showForPreview(name: nil, photo: nil)
        try await AppSnapshotTests.render(row(), name: "mac-look-account-noname-\(mode)", dark: dark)
    }
}

@MainActor @Observable private final class ScopeBox {
    var scope: Scope?
    init(scope: Scope?) { self.scope = scope }
}

/// The sidebar as the window holds it: its selection bound to state outside it, and equatable.
private struct FollowingSidebar: View {
    @Bindable var box: ScopeBox
    var body: some View {
        NavigationStack { SidebarView(scope: $box.scope, onNewNote: {}).equatable() }
            .frame(width: 260, height: 400)
    }
}
/// A folder's right-click menu on the Mac, as SwiftUI hands it to AppKit: its items in order, in
/// groups, with their icons as template images (drawn in the menu's own colour, as Apple's menus
/// draw them, not in the app's amber), and Move To's folders with where the folder is ticked and
/// itself dimmed. The menu itself can't be drawn offscreen, so the shot draws the panel from those
/// items: `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/FolderMenuShots`.
@MainActor @Suite(.serialized) struct FolderMenuShots {
    /// The menu a right-click on `folder`'s row gets, found by asking the sidebar's views for
    /// their menu at each height (an event made here and handed to them, never posted).
    static func menu(for folder: String, dark: Bool) async throws -> NSMenu {
        let c = try AppSnapshotTests.container()
        let view = NavigationStack { SidebarView(scope: .constant(.all), onNewNote: {}) }
            .frame(width: 260, height: 400)
            .modelContainer(c)
            .tint(Color(PColor.paneAccent))
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 260, height: 400), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let host = NSHostingView(rootView: view)
        host.frame = CGRect(x: 0, y: 0, width: 260, height: 400)
        window.contentView = host
        defer { window.close() }
        try? await Task.sleep(for: .seconds(0.6))
        host.layoutSubtreeIfNeeded()
        let parent = c.mainContext.allFolders().first { $0.name == folder }?.parent?.name
        for y in stride(from: 395.0, to: 5, by: -4) {
            let p = host.convert(CGPoint(x: 80, y: y), to: nil)
            guard let e = NSEvent.mouseEvent(with: .rightMouseDown, location: p, modifierFlags: [], timestamp: 0, windowNumber: window.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1),
                  let hit = host.hitTest(host.convert(p, from: nil)) else { continue }
            var v: NSView? = hit
            while let view = v {
                if let m = view.menu(for: e), let move = m.items.first(where: { $0.title == "Move To" })?.submenu,
                   move.items.contains(where: { $0.title.trimmingCharacters(in: .whitespaces) == (parent ?? "Top Level") && $0.state == .on }),
                   move.items.contains(where: { $0.title.trimmingCharacters(in: .whitespaces) == folder && !$0.isEnabled }) {
                    return m
                }
                v = view.superview
            }
        }
        throw CancellationError()
    }

    @Test func theMenuIsGroupedWithPlainIconsAndMoveToTicksWhereItIs() async throws {
        let m = try await Self.menu(for: "Q4 planning", dark: false)
        #expect(m.items.map { $0.isSeparatorItem ? "-" : $0.title } == ["New Note", "New Folder", "-", "Rename", "Duplicate", "Move To", "-", "Delete Folder…"])
        #expect(m.items.filter { !$0.isSeparatorItem }.allSatisfy { $0.image?.isTemplate == true }, "icons in the menu's colour, not amber")
        let move = try #require(m.items.first { $0.title == "Move To" }?.submenu).items.filter { !$0.isSeparatorItem }
        #expect(move.first?.title == "Top Level")
        #expect(move.filter { $0.state == .on }.map { $0.title.trimmingCharacters(in: .whitespaces) } == ["Work"])
        #expect(move.filter { !$0.isEnabled }.map { $0.title.trimmingCharacters(in: .whitespaces) } == ["Q4 planning"])
    }

    @Test(arguments: [false, true])
    func shot(dark: Bool) async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let m = try await Self.menu(for: "Q4 planning", dark: dark)
        let appearance = NSAppearance(named: dark ? .darkAqua : .aqua)!
        var image: NSImage?
        appearance.performAsCurrentDrawingAppearance { image = Self.draw(m, dark: dark) }
        let rep = try #require(image.flatMap { NSBitmapImageRep(data: $0.tiffRepresentation ?? Data()) })
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-folder-menu-\(dark ? "dark" : "light").png"))
    }

    /// The menu and its Move To submenu beside it, drawn from their items at 2x.
    static func draw(_ menu: NSMenu, dark: Bool) -> NSImage {
        let row: CGFloat = 24, sep: CGFloat = 11, pad: CGFloat = 5, width: CGFloat = 220
        func height(_ m: NSMenu) -> CGFloat { m.items.reduce(pad * 2) { $0 + ($1.isSeparatorItem ? sep : row) } }
        let sub = menu.items.first { $0.title == "Move To" }?.submenu
        let size = CGSize(width: 40 + width + (sub == nil ? 0 : width - 8) + 40, height: max(height(menu), (sub.map(height) ?? 0) + 80) + 60)
        let image = NSImage(size: size)
        image.lockFocusFlipped(true)
        (dark ? NSColor(white: 0.12, alpha: 1) : NSColor(white: 0.93, alpha: 1)).setFill()
        CGRect(origin: .zero, size: size).fill()
        func panel(_ m: NSMenu, at origin: CGPoint) {
            let rect = CGRect(x: origin.x, y: origin.y, width: width, height: height(m))
            let shape = NSBezierPath(roundedRect: rect, xRadius: 10, yRadius: 10)
            NSGraphicsContext.saveGraphicsState()
            let shadow = NSShadow()
            shadow.shadowColor = .black.withAlphaComponent(0.3); shadow.shadowBlurRadius = 16; shadow.shadowOffset = CGSize(width: 0, height: -6)
            shadow.set()
            (dark ? NSColor(white: 0.17, alpha: 1) : NSColor(white: 0.97, alpha: 1)).setFill()
            shape.fill()
            NSGraphicsContext.restoreGraphicsState()
            NSColor.separatorColor.setStroke(); shape.lineWidth = 0.5; shape.stroke()
            var y = origin.y + pad
            for item in m.items {
                if item.isSeparatorItem {
                    NSColor.separatorColor.setFill()
                    CGRect(x: rect.minX + 12, y: y + sep / 2, width: width - 24, height: 1).fill()
                    y += sep; continue
                }
                let r = CGRect(x: rect.minX + pad, y: y, width: width - pad * 2, height: row)
                let color: NSColor = item.isEnabled ? .labelColor : .tertiaryLabelColor
                if item.state == .on, let tick = NSImage(systemSymbolName: "checkmark", accessibilityDescription: nil) {
                    tint(tick, color).draw(in: CGRect(x: r.minX + 6, y: r.midY - 5, width: 11, height: 10))
                }
                if let img = item.image {
                    let s = img.size, scale = min(16 / max(s.width, 1), 16 / max(s.height, 1), 1)
                    let d = CGSize(width: s.width * scale, height: s.height * scale)
                    (img.isTemplate ? tint(img, color) : img).draw(in: CGRect(x: r.minX + 9 + (16 - d.width) / 2, y: r.midY - d.height / 2, width: d.width, height: d.height))
                }
                let x = r.minX + (m === menu ? 33 : 22)
                (item.title as NSString).draw(at: CGPoint(x: x, y: r.minY + 3), withAttributes: [.font: NSFont.menuFont(ofSize: 13), .foregroundColor: color])
                if item.submenu != nil, let arrow = NSImage(systemSymbolName: "chevron.right", accessibilityDescription: nil) {
                    tint(arrow, color).draw(in: CGRect(x: r.maxX - 14, y: r.midY - 5, width: 6, height: 10))
                }
                y += row
            }
        }
        panel(menu, at: CGPoint(x: 40, y: 30))
        if let sub {
            let at = menu.items.prefix { $0.title != "Move To" }.reduce(pad) { $0 + ($1.isSeparatorItem ? sep : row) }
            panel(sub, at: CGPoint(x: 40 + width - 8, y: 30 + at - pad))
        }
        image.unlockFocus()
        return image
    }

    private static func tint(_ img: NSImage, _ color: NSColor) -> NSImage {
        NSImage(size: img.size, flipped: false) { r in
            img.draw(in: r)
            color.set()
            r.fill(using: .sourceAtop)
            return true
        }
    }
}
#endif
