#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The note list's rows against Apple Notes on macOS 26, read through Accessibility in a 237 pt
/// list column (owner, 2026-10-12: "still looks denser", "the note title and subtitle needs a bit
/// of spacing"). Apple's rows: 68 pt with the folder line, 56 without; its section headings 40;
/// the text 34 pt in from the row's left edge. Where a line's letters start is matched rather
/// than its text box, since Apple's boxes are taller than SwiftUI's for the same line.
@MainActor @Suite(.serialized) struct NoteListGeometryTests {
    /// The real note list in an offscreen window as wide as Apple Notes' list column.
    @MainActor final class Host {
        let window: NSWindow

        init(_ c: ModelContainer, scope: Scope, width: CGFloat = 237, typeSize: DynamicTypeSize = .large, selected: Set<UUID> = [], dark: Bool = false) async {
            let root = NavigationStack {
                NoteListView(scope: scope, selection: .constant(selected), onNewNote: {})
            }
            .dynamicTypeSize(typeSize)
            .modelContainer(c)
            window = KeyableWindow(contentRect: CGRect(x: -20000, y: -20000, width: width, height: 900), styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            window.contentViewController = NSHostingController(rootView: root)
            window.setContentSize(CGSize(width: width, height: 900))
            try? await Task.sleep(for: .seconds(0.8))
            window.contentView?.layoutSubtreeIfNeeded()
        }

        var table: NSTableView? {
            func find(_ v: NSView) -> NSTableView? {
                if let t = v as? NSTableView { return t }
                for s in v.subviews { if let t = find(s) { return t } }
                return nil
            }
            return window.contentView.flatMap(find)
        }

        func close() { window.orderOut(nil); window.close() }
    }

    static func container() throws -> ModelContainer {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        Seed.ensureLibrary(ctx, demo: false)
        let ideas = ctx.createFolder(named: "Ideas")
        ctx.createNote(in: .folder(ideas.id), body: "Groceries\nFor the weekend, and Sunday dinner")
        let tracker = ctx.createNote(in: .folder(ideas.id), body: "Evening tracker\nFill in once a day, it takes a minute")
        ctx.togglePin(tracker)
        try ctx.save()
        return c
    }

    /// Everything a row is made of, as Accessibility reports it, relative to the row.
    static func report(_ table: NSTableView, _ title: String) -> String {
        var out = "== \(title): table \(table.frame.width) wide, \(table.numberOfRows) rows\n"
        for r in 0..<table.numberOfRows {
            let rect = table.rect(ofRow: r)
            out += "row \(r) \(table.isHeadingRow(r) ? "heading" : "note") y=\(rect.minY) h=\(rect.height) w=\(rect.width)\n"
            guard let rv = table.rowView(atRow: r, makeIfNecessary: true) else { continue }
            func views(_ v: NSView, _ depth: Int) {
                let f = v.convert(v.bounds, to: rv)
                out += String(repeating: "  ", count: depth + 1) + "\(type(of: v)) x=\(f.minX) y=\(f.minY) w=\(f.width) h=\(f.height)\n"
                if depth < 3 { v.subviews.forEach { views($0, depth + 1) } }
            }
            rv.subviews.forEach { views($0, 0) }
            let rowFrame = rv.accessibilityFrame()
            func ax(_ e: Any, _ depth: Int) {
                guard depth < 8, let el = e as? NSAccessibilityElementProtocol else { return }
                let f = el.accessibilityFrame()
                let o = e as? NSObject
                let role = (o?.value(forKey: "accessibilityRole") as? NSAccessibility.Role)?.rawValue ?? "?"
                let label = (o?.value(forKey: "accessibilityLabel") as? String) ?? ""
                out += String(repeating: "  ", count: depth + 1) + "ax \(role) \"\(label.prefix(40))\" x=\(f.minX - rowFrame.minX) y=\(rowFrame.maxY - f.maxY) w=\(f.width) h=\(f.height)\n"
                for k in ((e as? NSAccessibilityProtocol)?.accessibilityChildren() ?? []) { ax(k, depth + 1) }
            }
            out += "  AX row frame w=\(rowFrame.width) h=\(rowFrame.height)\n"
            for k in rv.accessibilityChildren() ?? [] { ax(k, 1) }
        }
        return out
    }

    /// Where a row's content (the note row with its padding) sits in its row: x from the row's
    /// left edge, y from its top.
    static func content(_ table: NSTableView, _ row: Int) -> CGRect? {
        guard let rv = table.rowView(atRow: row, makeIfNecessary: true) else { return nil }
        func find(_ v: NSView) -> NSView? {
            if String(describing: type(of: v)).contains("DraggingDestination") { return v }
            for s in v.subviews { if let f = find(s) { return f } }
            return nil
        }
        guard let v = find(rv) else { return nil }
        var f = v.convert(v.bounds, to: rv)
        if !rv.isFlipped { f.origin.y = rv.bounds.height - f.maxY }
        return f
    }

    /// The height SwiftUI gives one line of text in `font`.
    static func lineHeight(_ font: Font) -> CGFloat {
        NSHostingView(rootView: Text("Ag").font(font).fixedSize()).fittingSize.height
    }

    @Test func rowsAreAppleNotesRows() async throws {
        let c = try Self.container()
        let ideas = try #require(c.mainContext.allFolders().first { $0.name == "Ideas" })
        let title = Self.lineHeight(RowMetrics.title), detail = Self.lineHeight(RowMetrics.detail)
        // All Notes: each row also names its folder. Inside a folder it doesn't. The title's letters
        // start where Apple's do (11 and 14.5 pt down); the date line follows 19 pt below them in
        // both, Apple's gap in a row with a folder line.
        for (scope, height, titleTop) in [(Scope.all, 68.0, 8.0), (.folder(ideas.id), 56.0, 11.0)] {
            let h = await Host(c, scope: scope)
            defer { h.close() }
            let table = try #require(h.table)
            let headings = (0..<table.numberOfRows).filter { table.isHeadingRow($0) }
            let notes = (0..<table.numberOfRows).filter { !table.isHeadingRow($0) }
            try #require(headings.count >= 2 && !notes.isEmpty)
            for r in headings { #expect(abs(table.rect(ofRow: r).height - 40) < 0.5, "heading row \(r): \(table.rect(ofRow: r).height)") }
            for r in notes {
                #expect(abs(table.rect(ofRow: r).height - height) < 0.5, "note row \(r) in \(scope): \(table.rect(ofRow: r).height)")
                let box = try #require(Self.content(table, r))
                #expect(abs(box.minX + RowMetrics.leading - 34) < 0.5)
                let top = box.minY + RowMetrics.top(folderLine: height == 68)
                #expect(abs(top - titleTop) <= 0.5, "title line at \(top)")
                let detailTop = top + title + RowMetrics.spacing
                #expect(abs(detailTop - (titleTop + 19)) <= 0.5, "date line at \(detailTop), the title \(title) tall")
                if height == 68 { #expect(abs(detailTop + detail + RowMetrics.spacing - 45) <= 0.5, "folder line") }
            }
        }
    }

    /// Measurements for the side-by-side picture, written where the snapshot run keeps them.
    @Test func measure() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try Self.container()
        let ideas = try #require(c.mainContext.allFolders().first { $0.name == "Ideas" })
        var text = ""
        let first = try #require(c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Evening tracker" })
        for (name, scope, size, dark) in [("all", Scope.all, DynamicTypeSize.large, false), ("folder", Scope.folder(ideas.id), .large, false),
                                          ("all-dark", .all, .large, true), ("folder-dark", .folder(ideas.id), .large, true),
                                          ("all-accessibility", .all, .accessibility2, false)] {
            let h = await Host(c, scope: scope, typeSize: size, selected: [first.id], dark: dark)
            defer { h.close() }
            let table = try #require(h.table)
            text += Self.report(table, name) + "\n"
            // At 2x, as on a Retina screen, to sit beside a capture of Apple Notes.
            if let host = h.window.contentView,
               let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(host.bounds.width) * 2, pixelsHigh: Int(host.bounds.height) * 2, bitsPerSample: 8,
                                          samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0) {
                rep.size = host.bounds.size
                host.cacheDisplay(in: host.bounds, to: rep)
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                try rep.representation(using: .png, properties: [:])?.write(to: dir.appending(path: "list-geometry-\(name).png"))
            }
        }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try text.write(to: dir.appending(path: "list-geometry.txt"), atomically: true, encoding: .utf8)
    }
}
#endif
