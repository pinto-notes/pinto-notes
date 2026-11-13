#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The notes list's hairlines, as Apple Notes draws them (Emil, 12 November 2026: "some line
/// separations between notes would be good, and remove that · between date and description"):
/// a line under each row from the text's leading edge to the row's trailing edge, none under a
/// section's last row, a line under each heading, and none next to the selected or hovered row.
/// Read from the real list drawn in a borderless window far off the screen, never ordered in.
@MainActor @Suite(.serialized) struct NoteListSeparatorTests {
    /// Where the before and after pictures go: `TEST_RUNNER_PINTO_LIST_LINE_SHOTS=/path scripts/qa-test.sh PaneTests/NoteListSeparatorTests`.
    static var dir: URL? { ProcessInfo.processInfo.environment["PINTO_LIST_LINE_SHOTS"].map { URL(fileURLWithPath: $0) } }

    /// A list like Emil's: three notes in Previous 7 Days and three in Previous 30 Days, in a folder.
    static func container() throws -> (ModelContainer, Folder, [String: Note]) {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        Seed.ensureLibrary(ctx, demo: false)
        let folder = ctx.createFolder(named: "Notes")
        var notes: [String: Note] = [:]
        let days: [(Double, String)] = [(3, "Weekend plans\nA hike on Saturday, then dinner"), (4, "Book club\nChapters 9 to 12 for Thursday"),
                                        (5, "Bike repair\nA new chain and brake pads"), (10, "Quarterly report\nNumbers due on the 20th"),
                                        (14, "Garden\nPlant the bulbs before the frost"), (20, "Recipes to try\nLentil soup and focaccia")]
        for (back, body) in days {
            let n = ctx.createNote(in: .folder(folder.id), body: body)
            let at = Date.now.addingTimeInterval(-back * 86_400)
            n.updatedAt = at
            n.createdAt = at
            notes[n.title] = n
        }
        try ctx.save()
        return (c, folder, notes)
    }

    /// The list drawn: its picture at 2x and where each row is in it.
    struct Drawn {
        let rep: NSBitmapImageRep
        let size: CGSize
        /// Each row of the table, top to bottom: its frame in the picture (points from the top left)
        /// and whether it's a heading.
        let rows: [(frame: CGRect, heading: Bool)]
        /// Where a note row's text starts, and its content's left and right edges, in the picture.
        let text: CGFloat
        let left: CGFloat
        let right: CGFloat

        var scale: CGFloat { CGFloat(rep.pixelsWide) / size.width }

        func color(_ x: CGFloat, _ y: CGFloat) -> NSColor {
            rep.colorAt(x: Int(x * scale), y: Int(y * scale))?.usingColorSpace(.sRGB) ?? .clear
        }

        static func differ(_ a: NSColor, _ b: NSColor) -> Bool {
            max(abs(a.redComponent - b.redComponent), abs(a.greenComponent - b.greenComponent), abs(a.blueComponent - b.blueComponent)) > 0.03
        }

        /// Whether a line runs along the bottom of row `r` at `x`: a pixel in its last point that
        /// isn't what's 2.5 pt above it (the ground, or the selected row's fill).
        func line(under r: Int, at x: CGFloat) -> Bool {
            let bottom = rows[r].frame.maxY
            var y = bottom - 1
            while y < bottom {
                if Self.differ(color(x, y), color(x, y - 2.5)) { return true }
                y += 1 / scale
            }
            return false
        }

        /// Whether row `r` has its line: at the text's start and at the content's right edge.
        func line(under r: Int) -> Bool { line(under: r, at: text + 30) }
    }

    static func draw(_ c: ModelContainer, _ folder: Folder, selected: Set<UUID> = [], dark: Bool = false, hover: String? = nil, width: CGFloat = 300) async throws -> Drawn {
        let h = await NoteListGeometryTests.Host(c, scope: .folder(folder.id), width: width, selected: selected, dark: dark)
        defer { h.close() }
        if let hover {
            #expect(HoverProbe.hover(hover, true), "the row \(hover) takes a hover: \(HoverProbe.ids)")
            try? await Task.sleep(for: .seconds(0.4))
        }
        let root = try #require(h.window.contentView)
        root.layoutSubtreeIfNeeded()
        let table = try #require(h.table)
        var rows: [(CGRect, Bool)] = []
        for r in 0..<table.numberOfRows {
            var f = table.convert(table.rect(ofRow: r), to: root)
            if !root.isFlipped { f.origin.y = root.bounds.height - f.maxY }
            rows.append((f, table.isHeadingRow(r)))
        }
        let note = try #require((0..<table.numberOfRows).first { !table.isHeadingRow($0) })
        let box = try #require(NoteListGeometryTests.content(table, note))
        let rv = try #require(table.rowView(atRow: note, makeIfNecessary: true))
        let left = rv.convert(CGPoint(x: box.minX, y: 0), to: root).x
        let right = rv.convert(CGPoint(x: box.maxX, y: 0), to: root).x
        let size = root.bounds.size
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width) * 2, pixelsHigh: Int(size.height) * 2, bitsPerSample: 8,
                                                samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        rep.size = size
        root.cacheDisplay(in: root.bounds, to: rep)
        return Drawn(rep: rep, size: size, rows: rows, text: left + RowMetrics.leading, left: left, right: right)
    }

    /// The note rows of each section, by their index in the table.
    static func sections(_ d: Drawn) -> [[Int]] {
        var out: [[Int]] = []
        for (r, row) in d.rows.enumerated() {
            if row.heading { out.append([]) } else if !out.isEmpty { out[out.count - 1].append(r) }
        }
        return out
    }

    @Test(arguments: [false, true]) func aLineBetweenRowsNoneAfterASectionsLast(dark: Bool) async throws {
        let (c, folder, _) = try Self.container()
        let d = try await Self.draw(c, folder, dark: dark)
        let sections = Self.sections(d)
        try #require(sections.count == 2 && sections.allSatisfy { $0.count == 3 }, "Previous 7 Days and Previous 30 Days, three notes each: \(d.rows)")
        for rows in sections {
            for r in rows.dropLast() {
                #expect(d.line(under: r), "a line under row \(r)")
                // From the text's start, not the row's edge, to the row's right edge.
                #expect(d.line(under: r, at: d.text + 1), "row \(r)'s line starts with the text")
                #expect(!d.line(under: r, at: d.text - 3), "row \(r)'s line starts no earlier than the text")
                #expect(d.line(under: r, at: d.right), "row \(r)'s line runs to the row's right edge")
            }
            #expect(!d.line(under: try #require(rows.last)), "none under a section's last row")
        }
        // A line under each heading, the list content's full width (the rows' card edges).
        for r in d.rows.indices where d.rows[r].heading {
            #expect(d.line(under: r), "a line under heading \(r)")
            #expect(d.line(under: r, at: d.left - Hover.noteRowReach.leading + 1), "heading \(r)'s line starts at the card's edge")
            #expect(d.line(under: r, at: d.right + Hover.noteRowReach.trailing - 1), "heading \(r)'s line ends at the card's edge")
        }
    }

    /// The selected row's fill isn't cut by a line: none under it, none under the row above it.
    @Test(arguments: [false, true]) func noLineNextToTheSelectedRow(dark: Bool) async throws {
        let (c, folder, notes) = try Self.container()
        let d = try await Self.draw(c, folder, selected: [try #require(notes["Book club"]).id], dark: dark)
        let sections = Self.sections(d)
        try #require(sections.count == 2 && sections[0].count == 3)
        let (above, selected) = (sections[0][0], sections[0][1])
        #expect(!d.line(under: above), "none above the selected row")
        #expect(!d.line(under: selected), "none under the selected row")
        for r in sections[1].dropLast() { #expect(d.line(under: r), "the other section keeps its lines (row \(r))") }
        // The first row selected: no line under it, the next one keeps its own.
        let first = try await Self.draw(c, folder, selected: [try #require(notes["Weekend plans"]).id], dark: dark)
        let s = Self.sections(first)
        #expect(!first.line(under: s[0][0]), "none under the selected first row")
        #expect(first.line(under: s[0][1]), "the row under it keeps its line")
    }

    /// The hover's fill isn't cut by a line either, above or below it.
    @Test func noLineNextToTheHoveredRow() async throws {
        HoverProbe.enabled = true
        defer { HoverProbe.enabled = false; HoverProbe.reset() }
        let (c, folder, _) = try Self.container()
        let d = try await Self.draw(c, folder, hover: "Garden")
        let sections = Self.sections(d)
        try #require(sections.count == 2 && sections[1].count == 3)
        #expect(!d.line(under: sections[1][0]), "none above the hovered row")
        #expect(!d.line(under: sections[1][1]), "none under the hovered row")
        #expect(d.line(under: sections[0][0]), "the rest keep theirs")
    }

    /// The second line: the date, about 8 pt of room, then the preview. No middle dot between them.
    @Test(arguments: [false, true]) func theDateAndThePreviewHaveNoDotBetween(dark: Bool) async throws {
        let (c, _, notes) = try Self.container()
        let note = try #require(notes["Garden"])
        let width: CGFloat = 300, height: CGFloat = 80
        let row = NoteRow(note: note).frame(width: width, alignment: .leading).modelContainer(c)
        let rowHeight = NSHostingView(rootView: row).fittingSize.height
        let rep = try await ThemeShots.host(row, size: CGSize(width: width, height: height), dark: dark, wait: 0.4)
        let scale = CGFloat(rep.pixelsWide) / width
        // The date line's band, the row centred in the picture.
        let top = (height - rowHeight) / 2 + RowMetrics.top(folderLine: false) + RowMetrics.calmAir
            + NoteListGeometryTests.lineHeight(RowMetrics.title) + RowMetrics.spacing
        let band = Int(top * scale)..<Int((top + NoteListGeometryTests.lineHeight(RowMetrics.detail)) * scale)
        let ground = try #require(rep.colorAt(x: 0, y: 0)?.usingColorSpace(.sRGB))
        func inked(_ x: CGFloat) -> Bool {
            band.contains { y in rep.colorAt(x: Int(x * scale), y: y)?.usingColorSpace(.sRGB).map { Drawn.differ($0, ground) } ?? false }
        }
        let date = DateBucket.rowDate(note.updatedAt)
        let dateWidth = NSHostingView(rootView: Text(date).font(RowMetrics.detail).monospacedDigit().fixedSize()).fittingSize.width
        let end = RowMetrics.leading + dateWidth
        #expect((0..<8).contains { inked(end - 2 - CGFloat($0) / scale) }, "the date is drawn where it's measured (\(date), \(dateWidth) pt)")
        var x = end + 0.5
        while x < end + 7.5 {
            #expect(!inked(x), "nothing between the date and the preview, \(x - end) pt past the date")
            x += 1 / scale
        }
        let start = stride(from: end + 7.5, to: end + 12, by: 1 / scale).first { inked($0) }
        #expect(start != nil, "the preview starts about 8 pt after the date")
    }

    /// Before and after pictures of the list, light and dark, one row selected.
    @Test func pictures() async throws {
        guard let dir = Self.dir else { return }
        let (c, folder, notes) = try Self.container()
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            let d = try await Self.draw(c, folder, selected: [try #require(notes["Book club"]).id], dark: dark)
            let bottom = (d.rows.last?.frame.maxY ?? 400) + 24
            let crop = CGRect(x: 0, y: 0, width: d.size.width * d.scale, height: min(d.size.height, bottom) * d.scale)
            let cg = try #require(d.rep.cgImage?.cropping(to: crop))
            let out = NSBitmapImageRep(cgImage: cg)
            try #require(out.representation(using: .png, properties: [:])).write(to: dir.appending(path: "notes-list-\(dark ? "dark" : "light").png"))
        }
    }

    /// The line's grey laid over the list's ground: black in dark mode, white in light.
    private func onGround(_ color: NSColor, dark: Bool) -> CGFloat {
        var level: CGFloat = 0
        NSAppearance(named: dark ? .darkAqua : .aqua)!.performAsCurrentDrawingAppearance {
            let c = color.usingColorSpace(.sRGB)!
            level = c.redComponent * c.alphaComponent + (dark ? 0 : 1) * (1 - c.alphaComponent)
        }
        return level
    }

    /// On the pure black list the system separator (10% white) all but vanished (Emil,
    /// 12 November 2026: "I can barely see divider lines at all").
    @Test func theLinesShowOnTheBlackList() {
        #expect(onGround(RowHairline.color, dark: true) >= 0.24)
        #expect(onGround(RowHairline.color, dark: true) > onGround(.separatorColor, dark: true) * 2)
        let light = onGround(RowHairline.color, dark: false)
        #expect(light <= 0.88 && light >= 0.78)
    }
}
#endif
