#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The note column with no note selected, and the first note opened from there, in a titled
/// window that is never shown (MacWindowChromeTests).
@MainActor @Suite(.serialized) struct MacEmptyDetailTests {
    static let size = CGSize(width: 1469, height: 920)

    /// The notes list (the split view's middle column).
    static func list(_ w: NSWindow) throws -> NSTableView {
        try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSTableView.self, in: $0) { $0.numberOfRows > 3 && $0.style != .sourceList && $0.accessibilityLabel() != "Sidebar" } })
    }

    /// The window as drawn, title bar and toolbar included, at 2x.
    /// Off screen the scroll views' backdrops (the sidebar's glass, the soft edge's portal) come
    /// out white over everything under them; they're hidden for the picture.
    static func picture(_ w: NSWindow) throws -> NSBitmapImageRep {
        let frame = try #require(w.contentView?.superview)
        var hidden: [NSView] = []
        func hide(_ v: NSView) {
            let name = String(describing: type(of: v))
            // The window's grey title bar under the toolbar (a hard pocket) is what's looked for: kept.
            if name == "NSHardPocketView" { return }
            if !v.isHidden, ["BackdropView", "PortalView", "PocketMask", "LuminanceAdjustment", "_NSScrollViewContentBackgroundView"].contains(name) { v.isHidden = true; hidden.append(v) }
            v.subviews.forEach(hide)
        }
        hide(frame)
        defer { hidden.forEach { $0.isHidden = false } }
        frame.wantsLayer = true
        let scale: CGFloat = 2
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(frame.bounds.width * scale), pixelsHigh: Int(frame.bounds.height * scale),
                                                bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        let ctx = try #require(NSGraphicsContext(bitmapImageRep: rep))
        ctx.cgContext.scaleBy(x: scale, y: scale)
        frame.layer?.render(in: ctx.cgContext)
        return rep
    }

    static func ms(_ d: Duration) -> Double { Double(d.components.seconds) * 1000 + Double(d.components.attoseconds) / 1e15 }

    /// Nothing selected: the list deselects, as a click on its blank space does.
    static func deselect(_ w: NSWindow) async throws {
        try list(w).deselectAll(nil)
        await MacWindowChromeTests.settle(w, 8)
    }

    /// Selects `row` in the list and works the window out until the note's text and its toolbar
    /// are there. Milliseconds to each.
    static func open(row: Int, in w: NSWindow) async throws -> (editor: Double, toolbar: Double) {
        let table = try list(w)
        let clock = ContinuousClock()
        let start = clock.now
        table.selectRowIndexes(IndexSet(integer: row), byExtendingSelection: false)
        var editorAt: Double?, toolbarAt: Double?
        while clock.now - start < .seconds(3), editorAt == nil || toolbarAt == nil {
            await Task.yield()
            w.contentView?.layoutSubtreeIfNeeded()
            w.displayIfNeeded()
            if editorAt == nil, let e = w.contentView.flatMap({ MacWindowChromeTests.find(PaneTextView.self, in: $0) }), !e.string.isEmpty { editorAt = ms(clock.now - start) }
            if toolbarAt == nil, (try? MacWindowChromeTests.items(w))?.contains(where: { $0.label == "Format" }) == true { toolbarAt = ms(clock.now - start) }
        }
        return (editorAt ?? -1, toolbarAt ?? -1)
    }

    /// The note column's frame in the window.
    static func noteColumn(_ w: NSWindow) throws -> CGRect {
        let split = try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
        let column = try #require(split.arrangedSubviews.last)
        return column.convert(column.bounds, to: nil)
    }

    /// The window's grey title bar over the note column: AppKit's hard pocket, drawn when nothing
    /// in the column scrolls under the toolbar.
    static func greyBand(_ w: NSWindow) throws -> Bool {
        let column = try noteColumn(w)
        let top = try #require(w.contentView?.superview)
        var found = false
        func look(_ v: NSView) {
            if !v.isHidden, String(describing: type(of: v)) == "NSHardPocketView" {
                let f = v.convert(v.bounds, to: nil)
                if f.midX > column.minX, f.midX < column.maxX { found = true }
            }
            v.subviews.forEach(look)
        }
        look(top)
        return found
    }

    /// The toolbar's enabled controls over the note column, by their item's label. Only the
    /// menus (Attach, More) are AppKit controls; the plain buttons are drawn by SwiftUI.
    static func reachableButtons(_ w: NSWindow) throws -> [String] {
        let column = try noteColumn(w)
        return (w.toolbar?.items ?? []).filter { item in
            guard let v = item.view, v.window != nil, v.convert(v.bounds, to: nil).midX > column.minX else { return false }
            var controls: [NSControl] = []
            func look(_ v: NSView) {
                if let c = v as? NSControl { controls.append(c) }
                v.subviews.forEach(look)
            }
            look(v)
            return controls.contains { $0.isEnabled }
        }.map(\.label)
    }

    /// Emil (10-30): with no note selected the note column wore a grey band across its top and a
    /// lone compose button. Notes shows only the page's ground there, top to bottom. Compose stays
    /// with the list.
    @Test func theEmptyNotePaneIsOneGroundWithoutButtons() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            for dark in [false, true] {
                let w = MacWindowChromeTests.window(c, size: Self.size)
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                defer { w.close() }
                await MacWindowChromeTests.settle(w)
                #expect(try !Self.greyBand(w), "no grey band over a note")
                #expect(try Self.reachableButtons(w).contains("More"), "with a note, its menus take a click")
                try await Self.deselect(w)
                let mode = dark ? "dark" : "light"

                // The note's items may stay in the toolbar unseen (NoteToolbarStage); compose
                // isn't among them.
                let items = try MacWindowChromeTests.items(w)
                print("PERF empty note pane toolbar (\(mode)): " + items.map { "\($0.label.isEmpty ? "(blank)" : $0.label)@\($0.column)" }.joined(separator: ", "))
                #expect(items.filter { $0.label == "New Note" }.map(\.column) == [1], "\(mode): compose only with the list")
                #expect(try !Self.greyBand(w), "\(mode): no grey band over the empty note pane")

                // The ground: the same page colour in the toolbar's band as under it.
                let rep = try Self.picture(w)
                if let dir = AppSnapshotTests.dir {
                    try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                    try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-empty-detail-\(mode).png"))
                }
                let column = try Self.noteColumn(w)
                let scale = CGFloat(rep.pixelsWide) / w.frame.width
                let page = AmberButtonTests.resolved(Palette.page, dark ? .darkAqua : .aqua)
                // Across the toolbar's band (where its buttons would be) and below it.
                var worst: (off: CGFloat, x: CGFloat, y: CGFloat) = (0, 0, 0)
                for fromTop in [12.0, 26.0, 40.0, 200.0] {
                    for x in stride(from: column.minX + 4, to: column.maxX - 4, by: 3) {
                        guard let px = rep.colorAt(x: Int(x * scale), y: Int(fromTop * scale))?.usingColorSpace(.sRGB) else { continue }
                        let off = max(abs(px.redComponent - page.redComponent), abs(px.greenComponent - page.greenComponent), abs(px.blueComponent - page.blueComponent))
                        if off > worst.off { worst = (off, x - column.minX, fromTop) }
                    }
                }
                #expect(worst.off < 0.03, "\(mode): the pane is the page's colour across the toolbar's band and below, off by \(worst.off) at \(Int(worst.x)), \(Int(worst.y)) pt down")
                // Nothing over the empty pane is there for VoiceOver or a click.
                let live = try Self.reachableButtons(w)
                #expect(live.isEmpty, "\(mode): buttons reachable over the empty pane: \(live)")

                // A note opened from here has its toolbar back, and no grey band.
                let table = try Self.list(w)
                _ = try await Self.open(row: try #require((0..<table.numberOfRows).first { !table.isHeadingRow($0) }), in: w)
                await MacWindowChromeTests.settle(w, 4)
                #expect(try Self.reachableButtons(w).contains("More"), "\(mode): the note's menus are back")
                #expect(try !Self.greyBand(w))
                if let dir = AppSnapshotTests.dir {
                    try #require(try Self.picture(w).representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-opened-note-\(mode).png"))
                }
            }
        }
    }

    /// Emil (10-30): a click on a note with none open took up to a second to show it. The pane
    /// was swapped for a new one, toolbar included, on the way from no note to a note: three
    /// times the time of opening the next note (180 against 60 ms here in a Debug build). Now the
    /// same stage holds both, so a note from the empty pane opens about as fast as the next one.
    /// Timing never gates: the bound only catches a return to the old cost and worse.
    @Test func aNoteOpensFromTheEmptyPaneAsFastAsTheNext() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = MacWindowChromeTests.window(c, size: Self.size)
            defer { w.close() }
            await MacWindowChromeTests.settle(w)
            let table = try Self.list(w)
            let rows = (0..<table.numberOfRows).filter { !table.isHeadingRow($0) }
            var fromEmpty: [Double] = [], next: [Double] = []
            for round in 0..<3 {
                try await Self.deselect(w)
                let a = try await Self.open(row: rows[1 + round * 2], in: w)
                await MacWindowChromeTests.settle(w, 3)
                let b = try await Self.open(row: rows[2 + round * 2], in: w)
                await MacWindowChromeTests.settle(w, 3)
                #expect(a.editor >= 0 && a.toolbar >= 0 && b.editor >= 0, "the note and its toolbar showed")
                fromEmpty.append(max(a.editor, a.toolbar))
                next.append(max(b.editor, b.toolbar))
            }
            let empty = PerfTiming.median(fromEmpty), other = PerfTiming.median(next)
            print("PERF open a note from the empty pane: median \(String(format: "%.1f", empty)) ms (\(fromEmpty.map { String(format: "%.0f", $0) }.joined(separator: ", "))); the next note: \(String(format: "%.1f", other)) ms")
            #expect(empty < 400 * PerfBudget.slack, "a note opens from the empty pane in \(empty) ms")
        }
    }
}
#endif
