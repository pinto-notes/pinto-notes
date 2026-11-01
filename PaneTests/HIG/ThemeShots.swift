#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Every theme's window (sidebar, list with a note selected, and a note with a heading, a list, a
/// checklist, a link and a code block) in light and dark, plus Settings' Appearance section,
/// combined into contact sheets. Drawn from windows that are never shown (far off screen, never
/// ordered in), like CodeBlockShots: nothing appears on the display.
/// `TEST_RUNNER_PANE_THEME_SHOTS=/path scripts/qa-test.sh PaneTests/ThemeShots`
@MainActor @Suite(.serialized) struct ThemeShots {
    static let note = """
    Lisbon trip

    Three days in May. The hotel is in Alfama, and the [tram timetable](https://example.com/tram) is online.

    ## To book
    - Flights
    - Hotel
    - Dinner at Ramiro

    ## Packing
    - [ ] Passport
    - [x] Adapter
    - [ ] Rain jacket

    ```swift
    let budget = 600
    print(budget)
    ```

    Back by Sunday night.
    """

    static let size = CGSize(width: 1180, height: 720)

    /// The window's SwiftUI as cacheDisplay draws it, then the editor's lines on top (they are
    /// layers that cacheDisplay skips), each fragment drawn into the bitmap as its layer would.
    static func shot(_ w: NSWindow) throws -> NSBitmapImageRep {
        let root = try #require(w.contentView)
        root.layoutSubtreeIfNeeded()
        let rep = try #require(root.bitmapImageRepForCachingDisplay(in: root.bounds))
        root.cacheDisplay(in: root.bounds, to: rep)
        guard let tv = MacWindowChromeTests.find(PaneTextView.self, in: root), let tlm = tv.textLayoutManager else { return rep }
        tlm.ensureLayout(for: tlm.documentRange)
        let ctx = try #require(NSGraphicsContext(bitmapImageRep: rep))
        let saved = NSGraphicsContext.current
        defer { NSGraphicsContext.current = saved }
        let visible = tv.visibleRect
        let inRoot = tv.convert(visible, to: root)
        let bottom = root.isFlipped ? root.bounds.height - inRoot.maxY : inRoot.minY
        let cg = ctx.cgContext
        cg.saveGState()
        cg.clip(to: CGRect(x: inRoot.minX, y: bottom, width: inRoot.width, height: inRoot.height))
        cg.translateBy(x: inRoot.minX, y: bottom + inRoot.height)
        cg.scaleBy(x: 1, y: -1)
        cg.translateBy(x: -visible.minX, y: -visible.minY)
        NSGraphicsContext.current = NSGraphicsContext(cgContext: cg, flipped: true)
        w.effectiveAppearance.performAsCurrentDrawingAppearance {
            (tv.drawsBackground ? tv.backgroundColor : Palette.page).setFill()
            visible.fill()
            let origin = tv.textContainerOrigin
            tlm.enumerateTextLayoutFragments(from: tlm.documentRange.location, options: [.ensuresLayout]) { f in
                let o = CGPoint(x: origin.x + f.layoutFragmentFrame.minX, y: origin.y + f.layoutFragmentFrame.minY)
                if o.y > visible.maxY { return false }
                f.draw(at: o, in: cg)
                return true
            }
        }
        cg.restoreGState()
        return rep
    }

    static func window(_ c: ModelContainer, dark: Bool) -> NSWindow {
        let root = RootView().modelContainer(c).environment(SetupStore(progress: SetupProgress(imported: true)))
            .tint(Color(PColor.paneAccent))
            .environment(\.controlActiveState, .key)
        let w = NSWindow(contentRect: CGRect(origin: CGPoint(x: -20000, y: -20000), size: size),
                         styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        w.contentViewController = NSHostingController(rootView: root)
        w.setContentSize(size)
        return w
    }

    /// A SwiftUI view drawn alone in a borderless window far off screen (MacLookSnapshots' way:
    /// the split view's columns don't draw their rows through the window's cacheDisplay).
    static func host(_ view: some View, size: CGSize, dark: Bool, wait: Double = 1.0, layers: Bool = false) async throws -> NSBitmapImageRep {
        let host = NSHostingView(rootView: view.frame(width: size.width, height: size.height).background(Color(nsColor: .windowBackgroundColor)))
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let w = NSWindow(contentRect: CGRect(origin: CGPoint(x: -20000, y: -20000), size: size), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(wait))
        host.layoutSubtreeIfNeeded()
        host.displayIfNeeded()
        if layers, let table = MacWindowChromeTests.find(NSTableView.self, in: host) {
            // The list: its ground, then each row as it draws itself (offscreen, the scroll view's
            // edge effect paints over the rows in a whole-view capture).
            let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width * 2), pixelsHigh: Int(size.height * 2), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
            rep.size = size
            let saved = NSGraphicsContext.current
            NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
            defer { NSGraphicsContext.current = saved }
            host.effectiveAppearance.performAsCurrentDrawingAppearance {
                Palette.listGround.setFill()
                CGRect(origin: .zero, size: size).fill()
            }
            // The cells only: offscreen, a row view lays a white background of its own under them.
            for row in table.subviews where !row.isHidden && row.frame.height > 0 {
                for cell in row.subviews.filter({ !String(describing: type(of: $0)).contains("Separator") }).flatMap({ $0.subviews.isEmpty ? [$0] : $0.subviews }) {
                    let r = cell.convert(cell.bounds, to: host)
                    guard let layer = cell.layer else { continue }
                    let y = host.isFlipped ? size.height - r.maxY : r.minY
                    let cg = NSGraphicsContext.current!.cgContext
                    cg.saveGState()
                    cg.translateBy(x: r.minX, y: y + r.height)
                    cg.scaleBy(x: 1, y: -1)
                    layer.render(in: cg)
                    cg.restoreGState()
                }
            }
            return rep
        }
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        return rep
    }

    /// The note's column out of the window's picture.
    static func page(_ w: NSWindow, _ full: NSBitmapImageRep) throws -> NSBitmapImageRep {
        let root = try #require(w.contentView)
        let tv = try #require(MacWindowChromeTests.find(PaneTextView.self, in: root))
        let column = try #require(tv.enclosingScrollView)
        let r = column.convert(column.bounds, to: root)
        let px = CGFloat(full.pixelsWide) / root.bounds.width
        let top = root.isFlipped ? r.minY : root.bounds.height - r.maxY
        let crop = CGRect(x: r.minX * px, y: top * px, width: r.width * px, height: r.height * px).integral
        let cg = try #require(full.cgImage?.cropping(to: crop))
        let out = NSBitmapImageRep(cgImage: cg)
        out.size = r.size
        return out
    }

    /// Sidebar, list and page side by side, as the window lays them out.
    static func stitch(_ parts: [NSBitmapImageRep]) throws -> NSBitmapImageRep {
        let width = parts.reduce(0) { $0 + $1.size.width }, height = parts.map(\.size.height).max()!
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(width * 2), pixelsHigh: Int(height * 2), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = CGSize(width: width, height: height)
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        var x: CGFloat = 0
        for p in parts {
            p.draw(in: CGRect(x: x, y: height - p.size.height, width: p.size.width, height: p.size.height))
            x += p.size.width
            if p !== parts.last {
                NSColor(white: 0.5, alpha: 0.35).setFill()
                CGRect(x: x - 0.5, y: 0, width: 0.5, height: height).fill()
            }
        }
        return out
    }

    static func settings(dark: Bool) async throws -> NSBitmapImageRep {
        let view = Form { AppearanceSection() }.formStyle(.grouped).frame(width: 460, height: 290)
            .tint(Color(PColor.paneAccent))
        let host = NSHostingView(rootView: view.background(Color(nsColor: .windowBackgroundColor)))
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 460, height: 290), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(0.6))
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        return rep
    }

    /// Pictures laid out in rows under a title, each with its label, on a neutral grey.
    static func sheet(_ title: String, rows: [[(String, NSBitmapImageRep)]], scale: CGFloat) throws -> Data {
        let pad: CGFloat = 24, gap: CGFloat = 18, label: CGFloat = 22, head: CGFloat = 44
        let rowSizes = rows.map { row in row.map { CGSize(width: $0.1.size.width * scale, height: $0.1.size.height * scale) } }
        let width = rowSizes.map { $0.reduce(0) { $0 + $1.width } + gap * CGFloat(max(0, $0.count - 1)) }.max()! + pad * 2
        let height = head + rowSizes.reduce(0) { $0 + ($1.map(\.height).max() ?? 0) + label } + gap * CGFloat(rows.count - 1) + pad * 2
        let px = 2.0
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(width * px), pixelsHigh: Int(height * px), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = CGSize(width: width, height: height)
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        NSColor(white: 0.86, alpha: 1).setFill()
        CGRect(origin: .zero, size: out.size).fill()
        let bold: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 22, weight: .bold), .foregroundColor: NSColor.black]
        let small: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 13, weight: .medium), .foregroundColor: NSColor(white: 0.2, alpha: 1)]
        (title as NSString).draw(at: CGPoint(x: pad, y: height - pad - 28), withAttributes: bold)
        var top = height - pad - head
        for (row, sizes) in zip(rows, rowSizes) {
            var x = pad
            let h = sizes.map(\.height).max() ?? 0
            for ((name, rep), s) in zip(row, sizes) {
                (name as NSString).draw(at: CGPoint(x: x, y: top - 17), withAttributes: small)
                rep.draw(in: CGRect(x: x, y: top - label - s.height, width: s.width, height: s.height))
                x += s.width + gap
            }
            top -= h + label + gap
        }
        return try #require(out.representation(using: .png, properties: [:]))
    }

    @Test func contactSheets() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_THEME_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let kept = ThemeStore.shared.current
        defer { ThemeStore.shared.set(kept, persist: false) }
        let c = try AppSnapshotTests.container()
        let travel = try c.mainContext.fetch(FetchDescriptor<Folder>()).first { $0.name == "Travel" } ?? c.mainContext.createFolder(named: "Travel")
        let n = c.mainContext.createNote(in: .folder(travel.id), body: Self.note)
        n.updatedAt = .now.addingTimeInterval(600)
        try c.mainContext.save()
        var all: [[(String, NSBitmapImageRep)]] = []
        try await AppSnapshotTests.withLastNote(c, "Lisbon trip") {
            for theme in Theme.allCases {
                ThemeStore.shared.set(ThemeLook(theme: theme, accent: .theme), persist: false)
                var row: [(String, NSBitmapImageRep)] = []
                for dark in [false, true] {
                    let w = Self.window(c, dark: dark)
                    defer { w.close() }
                    await MacWindowChromeTests.settle(w, 20)
                    w.makeFirstResponder(nil)
                    await MacWindowChromeTests.settle(w, 6)
                    let page = try Self.page(w, Self.shot(w))
                    let sidebar = try await Self.host(NavigationStack { SidebarView(scope: .constant(.folder(travel.id)), onNewNote: {}) }
                        .modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
                        size: CGSize(width: 220, height: page.size.height), dark: dark)
                    let list = try await Self.host(NavigationStack { NoteListView(scope: .folder(travel.id), selection: .constant([n.id]), onNewNote: {}) }
                        .modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
                        size: CGSize(width: 280, height: page.size.height), dark: dark, wait: 2.5, layers: true)
                    row.append(("\(theme.title), \(dark ? "dark" : "light")", try Self.stitch([sidebar, list, page])))
                }
                for dark in [false, true] { row.append(("Settings, \(dark ? "dark" : "light")", try await Self.settings(dark: dark))) }
                try Self.sheet("\(theme.title) theme", rows: [Array(row.prefix(2)), Array(row.suffix(2))], scale: 1)
                    .write(to: dir.appending(path: "theme-\(theme.rawValue).png"))
                all.append(Array(row.prefix(2)))
            }
            try Self.sheet("Themes: light and dark", rows: all, scale: 0.42).write(to: dir.appending(path: "themes-all.png"))
        }
    }
}
#endif
