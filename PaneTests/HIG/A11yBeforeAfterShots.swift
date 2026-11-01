#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Before and after pictures for each problem in the themes accessibility audit
/// (docs/Evidence/themes/accessibility-audit.md), drawn with the app's own views and the study
/// switches in `A11yStudy`, from windows that are never shown (far off screen, never ordered in).
/// Run the iPhone half first (A11yBeforeAfterPhoneShots, on a simulator, into `<dir>/raw-ios`),
/// then this, which lays out every sheet:
/// `TEST_RUNNER_PANE_A11Y_SHOTS=/path scripts/qa-test.sh PaneTests/A11yBeforeAfterShots`
@MainActor @Suite(.serialized) struct A11yBeforeAfterShots {
    static let note = """
    Lisbon trip

    Three days in May. The hotel is in Alfama, and the [tram timetable](https://example.com/tram) is online.

    ## Packing
    - [ ] Passport
    - [x] Adapter
    - [x] Rain jacket
    - [ ] Sun hat

    ```swift
    let budget = 600
    ```

    Back by Sunday night.
    """

    // MARK: Study switches

    static func reset() {
        A11yStudy.selection = .fill
        A11yStudy.darkTick = false
        A11yStudy.formatOn = false
        A11yStudy.defaultAmber = .stock
        A11yStudy.contrastAccent = .stock
        A11yStudy.increaseContrast = false
        A11yStudy.distinctAccents = false
        A11yStudy.swatchTick = false
        Palette.forgetBuiltColours()
    }

    /// The look and the study switches for the next pictures.
    static func use(_ theme: Theme, _ accent: AccentChoice = .theme, _ study: () -> Void = {}) {
        reset()
        study()
        Palette.forgetBuiltColours()
        // Through another look and back, so every live colour is asked again.
        ThemeStore.shared.set(ThemeLook(theme: theme == .paper ? .slate : .paper, accent: .graphite), persist: false)
        ThemeStore.shared.set(ThemeLook(theme: theme, accent: accent), persist: false)
    }

    // MARK: Contrast

    static func lum(_ hex: UInt32) -> Double {
        func lin(_ v: UInt32) -> Double { let c = Double(v & 0xFF) / 255; return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4) }
        return 0.2126 * lin(hex >> 16) + 0.7152 * lin(hex >> 8) + 0.0722 * lin(hex)
    }
    static func ratio(_ a: UInt32, _ b: UInt32) -> Double {
        let x = lum(a), y = lum(b)
        return (max(x, y) + 0.05) / (min(x, y) + 0.05)
    }
    static func r(_ a: UInt32, _ b: UInt32) -> String { String(format: "%.2f:1", ratio(a, b)) }
    static func mix(_ a: UInt32, _ b: UInt32, _ t: Double) -> UInt32 { Palette.Accent.mix(a, b, t) }

    /// A Palette colour as hex in the light or the dark.
    static func hex(_ c: NSColor, dark: Bool) -> UInt32 {
        var out: UInt32 = 0
        NSAppearance(named: dark ? .darkAqua : .aqua)!.performAsCurrentDrawingAppearance {
            let s = c.usingColorSpace(.sRGB)!
            out = UInt32((s.redComponent * 255).rounded()) << 16 | UInt32((s.greenComponent * 255).rounded()) << 8 | UInt32((s.blueComponent * 255).rounded())
        }
        return out
    }

    // MARK: Pictures

    static func list(_ c: ModelContainer, _ folder: Folder, _ n: Note, dark: Bool, height: CGFloat = 300) async throws -> NSBitmapImageRep {
        try await ThemeShots.host(NavigationStack { NoteListView(scope: .folder(folder.id), selection: .constant([n.id]), onNewNote: {}) }
            .modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
            size: CGSize(width: 280, height: height), dark: dark, wait: 2.5, layers: true)
    }

    static func sidebar(_ c: ModelContainer, _ folder: Folder, dark: Bool, height: CGFloat) async throws -> NSBitmapImageRep {
        try await ThemeShots.host(NavigationStack { SidebarView(scope: .constant(.folder(folder.id)), onNewNote: {}) }
            .modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
            size: CGSize(width: 220, height: height), dark: dark)
    }

    /// The note's column, drawn in the whole window as ThemeShots does.
    static func page(_ c: ModelContainer, dark: Bool) async throws -> NSBitmapImageRep {
        let w = ThemeShots.window(c, dark: dark)
        defer { w.close() }
        await MacWindowChromeTests.settle(w, 20)
        w.makeFirstResponder(nil)
        await MacWindowChromeTests.settle(w, 6)
        return try ThemeShots.page(w, ThemeShots.shot(w))
    }

    /// Sidebar, list and page, as ThemeShots lays them out.
    static func window(_ c: ModelContainer, _ folder: Folder, _ n: Note, dark: Bool) async throws -> NSBitmapImageRep {
        let p = try await page(c, dark: dark)
        let s = try await sidebar(c, folder, dark: dark, height: p.size.height)
        let l = try await list(c, folder, n, dark: dark, height: p.size.height)
        return try ThemeShots.stitch([s, l, p])
    }

    static func buttons(dark: Bool, height: CGFloat) async throws -> NSBitmapImageRep {
        let view = VStack(alignment: .leading, spacing: 18) {
            Button("Continue") {}.buttonStyle(.amberProminent)
            Button("Show all notes") {}.buttonStyle(.borderless).foregroundStyle(.tint)
        }
        .padding(20).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color.notePage).tint(Color(PColor.paneAccent))
        return try await ThemeShots.host(view, size: CGSize(width: 200, height: height), dark: dark, wait: 0.5)
    }

    static func crop(_ rep: NSBitmapImageRep, top: CGFloat = 0, height: CGFloat, left: CGFloat = 0, width: CGFloat? = nil) throws -> NSBitmapImageRep {
        let px = CGFloat(rep.pixelsWide) / rep.size.width
        let w = width ?? (rep.size.width - left)
        let cg = try #require(rep.cgImage?.cropping(to: CGRect(x: left * px, y: top * px, width: w * px, height: min(height, rep.size.height - top) * px).integral))
        let out = NSBitmapImageRep(cgImage: cg)
        out.size = CGSize(width: CGFloat(cg.width) / px, height: CGFloat(cg.height) / px)
        return out
    }

    static func load(_ url: URL) -> NSBitmapImageRep? {
        guard let rep = NSImage(contentsOf: url)?.representations.first as? NSBitmapImageRep ?? (try? Data(contentsOf: url)).flatMap(NSBitmapImageRep.init(data:)) else { return nil }
        return rep
    }

    // MARK: Colour blindness (Machado, Oliveira and Fernandes 2009, severity 1)

    enum Vision: String, CaseIterable {
        case normal, protanopia, deuteranopia, tritanopia
        var matrix: [Double]? {
            switch self {
            case .normal: nil
            case .protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998]
            case .deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881]
            case .tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900]
            }
        }
    }

    static func simulate(_ src: NSBitmapImageRep, _ vision: Vision) throws -> NSBitmapImageRep {
        guard let m = vision.matrix else { return src }
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: src.pixelsWide, pixelsHigh: src.pixelsHigh, bitsPerSample: 8,
                                                samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: src.pixelsWide * 4, bitsPerPixel: 32))
        out.size = src.size
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        src.draw(in: CGRect(origin: .zero, size: src.size))
        NSGraphicsContext.current = saved
        let toLin = (0..<256).map { i -> Double in let c = Double(i) / 255; return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4) }
        func toSRGB(_ v: Double) -> UInt8 {
            let c = min(1, max(0, v)), s = c <= 0.0031308 ? c * 12.92 : 1.055 * pow(c, 1 / 2.4) - 0.055
            return UInt8((s * 255).rounded())
        }
        let p = try #require(out.bitmapData)
        for i in stride(from: 0, to: src.pixelsWide * src.pixelsHigh * 4, by: 4) {
            let a = Double(p[i + 3]) / 255
            guard a > 0 else { continue }
            // Premultiplied: undo, simulate, redo.
            let rgb = (0..<3).map { toLin[min(255, Int((Double(p[i + $0]) / a).rounded()))] }
            for k in 0..<3 {
                let v = m[k * 3] * rgb[0] + m[k * 3 + 1] * rgb[1] + m[k * 3 + 2] * rgb[2]
                p[i + k] = UInt8((Double(toSRGB(v)) * a).rounded())
            }
        }
        return out
    }

    /// CIE76 colour difference between two colours as one kind of vision sees them.
    static func deltaE(_ a: UInt32, _ b: UInt32, _ vision: Vision) -> Double {
        func lin(_ v: UInt32) -> Double { let c = Double(v & 0xFF) / 255; return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4) }
        func lab(_ h: UInt32) -> (Double, Double, Double) {
            var v = [lin(h >> 16), lin(h >> 8), lin(h)]
            if let m = vision.matrix { v = (0..<3).map { k in min(1, max(0, m[k * 3] * v[0] + m[k * 3 + 1] * v[1] + m[k * 3 + 2] * v[2])) } }
            let x = (0.4124 * v[0] + 0.3576 * v[1] + 0.1805 * v[2]) / 0.95047, y = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
            let z = (0.0193 * v[0] + 0.1192 * v[1] + 0.9505 * v[2]) / 1.08883
            func f(_ t: Double) -> Double { t > 0.008856 ? cbrt(t) : 7.787 * t + 16 / 116 }
            return (116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z)))
        }
        let p = lab(a), q = lab(b)
        return ((p.0 - q.0) * (p.0 - q.0) + (p.1 - q.1) * (p.1 - q.1) + (p.2 - q.2) * (p.2 - q.2)).squareRoot()
    }

    // MARK: Sheets

    struct Cell {
        let label: String
        let rep: NSBitmapImageRep
        init(_ label: String, _ rep: NSBitmapImageRep) { self.label = label; self.rep = rep }
    }

    /// A contact sheet: a title, a caption, then rows of labelled pictures (before on the left).
    static func board(_ title: String, _ caption: String, rows: [[Cell]], scale: CGFloat = 1) throws -> Data {
        let pad: CGFloat = 28, gap: CGFloat = 22, labelHeight: CGFloat = 76, width0: CGFloat = 1000
        let sizes = rows.map { $0.map { CGSize(width: $0.rep.size.width * scale, height: $0.rep.size.height * scale) } }
        let width = max(width0, sizes.map { $0.reduce(0) { $0 + $1.width } + gap * CGFloat(max(0, $0.count - 1)) }.max()! + pad * 2)
        let captionFont = NSFont.systemFont(ofSize: 15)
        let captionRect = (caption as NSString).boundingRect(with: CGSize(width: width - pad * 2, height: 400), options: [.usesLineFragmentOrigin],
                                                              attributes: [.font: captionFont])
        let head: CGFloat = 40 + ceil(captionRect.height) + 18
        let height = head + sizes.reduce(0) { $0 + ($1.map(\.height).max() ?? 0) + labelHeight } + gap * CGFloat(rows.count - 1) + pad * 2
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(width * 2), pixelsHigh: Int(height * 2), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = CGSize(width: width, height: height)
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        NSColor(white: 0.88, alpha: 1).setFill()
        CGRect(origin: .zero, size: out.size).fill()
        (title as NSString).draw(at: CGPoint(x: pad, y: height - pad - 30), withAttributes: [.font: NSFont.systemFont(ofSize: 26, weight: .bold), .foregroundColor: NSColor.black])
        (caption as NSString).draw(with: CGRect(x: pad, y: height - pad - 40 - ceil(captionRect.height), width: width - pad * 2, height: ceil(captionRect.height)),
                                   options: [.usesLineFragmentOrigin], attributes: [.font: captionFont, .foregroundColor: NSColor(white: 0.15, alpha: 1)])
        let labelStyle = NSMutableParagraphStyle()
        labelStyle.lineBreakMode = .byWordWrapping
        let bold: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 13, weight: .semibold), .foregroundColor: NSColor.black, .paragraphStyle: labelStyle]
        let small: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 12), .foregroundColor: NSColor(white: 0.2, alpha: 1), .paragraphStyle: labelStyle]
        var top = height - pad - head
        for (row, s) in zip(rows, sizes) {
            var x = pad
            let h = s.map(\.height).max() ?? 0
            for (cell, size) in zip(row, s) {
                let lines = cell.label.split(separator: "\n", maxSplits: 1).map(String.init)
                let text = NSMutableAttributedString(string: lines[0], attributes: bold)
                if lines.count > 1 { text.append(NSAttributedString(string: "\n" + lines[1], attributes: small)) }
                text.draw(with: CGRect(x: x, y: top - labelHeight + 4, width: max(size.width, 260), height: labelHeight - 6), options: [.usesLineFragmentOrigin])
                cell.rep.draw(in: CGRect(x: x, y: top - labelHeight - size.height, width: size.width, height: size.height))
                NSColor(white: 0.6, alpha: 1).setStroke()
                NSBezierPath(rect: CGRect(x: x - 0.5, y: top - labelHeight - size.height - 0.5, width: size.width + 1, height: size.height + 1)).stroke()
                x += size.width + gap
            }
            top -= h + labelHeight + gap
        }
        return try #require(out.representation(using: .png, properties: [:]))
    }

    static func overview(_ files: [(String, URL)]) throws -> Data {
        let cellW: CGFloat = 640, cellH: CGFloat = 420, pad: CGFloat = 24, label: CGFloat = 26, cols = 3
        let rows = Int(ceil(Double(files.count) / Double(cols)))
        let width = pad + CGFloat(cols) * (cellW + pad), height = 70 + CGFloat(rows) * (cellH + label + pad) + pad
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(width * 2), pixelsHigh: Int(height * 2), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = CGSize(width: width, height: height)
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        NSColor(white: 0.94, alpha: 1).setFill()
        CGRect(origin: .zero, size: out.size).fill()
        ("Themes accessibility: before and after, all nine problems" as NSString).draw(at: CGPoint(x: pad, y: height - 50), withAttributes: [.font: NSFont.systemFont(ofSize: 26, weight: .bold)])
        for (i, (name, url)) in files.enumerated() {
            guard let rep = load(url) else { continue }
            let col = i % cols, row = i / cols
            let x = pad + CGFloat(col) * (cellW + pad), top = height - 70 - CGFloat(row) * (cellH + label + pad)
            (name as NSString).draw(at: CGPoint(x: x, y: top - 20), withAttributes: [.font: NSFont.systemFont(ofSize: 15, weight: .semibold)])
            let s = min(cellW / rep.size.width, cellH / rep.size.height)
            let w = rep.size.width * s, h = rep.size.height * s
            NSColor.white.setFill()
            CGRect(x: x, y: top - label - cellH, width: cellW, height: cellH).fill()
            rep.draw(in: CGRect(x: x + (cellW - w) / 2, y: top - label - cellH + (cellH - h), width: w, height: h))
        }
        return try #require(out.representation(using: .png, properties: [:]))
    }

    // MARK: The pictures

    @Test func pictures() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_A11Y_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let kept = ThemeStore.shared.current
        defer { Self.reset(); ThemeStore.shared.set(kept, persist: false) }
        let c = try AppSnapshotTests.container()
        let travel = try c.mainContext.fetch(FetchDescriptor<Folder>()).first { $0.name == "Travel" } ?? c.mainContext.createFolder(named: "Travel")
        let n = c.mainContext.createNote(in: .folder(travel.id), body: Self.note)
        n.updatedAt = .now.addingTimeInterval(600)
        try c.mainContext.save()
        let only = ProcessInfo.processInfo.environment["PANE_A11Y_ONLY"].map { Set($0.split(separator: ",").compactMap { Int($0) }) }
        func wants(_ i: Int) -> Bool { only?.contains(i) ?? true }

        try await AppSnapshotTests.withLastNote(c, "Lisbon trip") {
            if wants(1) { try await problem1(c, travel, n, dir) }
            if wants(2) { try await problem2(c, dir) }
            if wants(3) { try problem3(dir) }
            if wants(4) { try await problem4(c, travel, dir) }
            if wants(5) { try await problem5(c, dir) }
            if wants(6) { try await problem6(c, travel, n, dir) }
            if wants(7) { try await problem7(c, dir) }
            if wants(8) { try problem8(dir) }
            if wants(9) { try await problem9(c, travel, n, dir) }
        }
        let names = ["01-selected-row", "02-checkbox-tick", "03-iphone-format-panel", "04-default-amber", "05-high-contrast-accent",
                     "06-increase-contrast", "07-hairlines", "08-iphone-accent-dots", "09-colour-blindness"]
        let files = names.enumerated().map { ("\($0.offset + 1). " + $0.element.dropFirst(3).replacingOccurrences(of: "-", with: " "), dir.appending(path: $0.element + ".png")) }
            .filter { FileManager.default.fileExists(atPath: $0.1.path) }
        try Self.overview(files).write(to: dir.appending(path: "overview.png"))
    }

    // 1. The selected note row.
    func problem1(_ c: ModelContainer, _ folder: Folder, _ n: Note, _ dir: URL) async throws {
        var rows: [[Cell]] = []
        for (theme, dark) in [(Theme.standard, false), (.standard, true), (.sepia, true)] {
            let mode = "\(theme.title) \(dark ? "dark" : "light")"
            var row: [Cell] = []
            for (sel, name) in [(A11yStudy.Selection.fill, "Before"), (.bar, "After (option a): 3 pt accent bar"),
                                (.outline, "After (option b): 1 pt outline"), (.strongerFill, "After (option c): stronger fill")] {
                Self.use(theme) { A11yStudy.selection = sel }
                let list = Self.hex(Palette.listGround, dark: dark), fill = Self.hex(Palette.rowSelection, dark: dark)
                let ink = Self.hex(Palette.ink, dark: dark), muted = Self.hex(Palette.muted, dark: dark)
                let bar = Self.hex(Palette.amberInk, dark: dark)
                let note: String
                switch sel {
                case .fill: note = "fill against the list \(Self.r(fill, list)), needs 3:1"
                case .bar: note = "bar against the list \(Self.r(bar, list)), against the fill \(Self.r(bar, fill))"
                case .outline: note = "outline against the list \(Self.r(muted, list)), against the fill \(Self.r(muted, fill))"
                case .strongerFill:
                    let strong = Self.mix(fill, ink, 0.12)
                    note = "fill against the list \(Self.r(strong, list)); grey text on it \(Self.r(muted, strong))"
                }
                row.append(Cell("1 · \(mode) · \(name)\n\(note)", try await Self.list(c, folder, n, dark: dark, height: 250)))
            }
            rows.append(row)
        }
        try Self.board("1. Selected note row", "Today the selected row is a faint fill in every theme (1.2 to 1.4:1 against the list; a state mark needs 3:1). A fill can't reach 3:1 while the row's grey text keeps 4.5:1 on it, so the fix is a mark that doesn't rely on colour. Option a adds a 3 pt bar in the accent's text shade on the leading edge, over today's fill. Option b adds a 1 pt outline in the muted text colour. Option c only darkens the fill (12% ink) and still fails.",
                       rows: rows).write(to: dir.appending(path: "01-selected-row.png"))
    }

    // 2. The ticked checkbox in dark mode.
    func problem2(_ c: ModelContainer, _ dir: URL) async throws {
        var rows: [[Cell]] = []
        for theme in [Theme.standard, .forest] {
            var row: [Cell] = []
            for after in [false, true] {
                Self.use(theme) { A11yStudy.darkTick = after }
                let fill = Self.hex(PColor.paneAccent, dark: true)
                let tick: UInt32 = after ? A11yStudy.darkGlyph : 0xFFFFFF
                let page = try await Self.page(c, dark: true)
                row.append(Cell("2 · \(theme.title) dark · \(after ? "After: near-black tick" : "Before: white tick")\ntick on the accent \(Self.r(tick, fill)), needs 3:1",
                                try Self.crop(page, top: 60, height: 230, width: 520)))
            }
            rows.append(row)
        }
        try Self.board("2. Ticked checkbox, dark mode", "In dark mode the accent is a light shade, and the white tick on it reads at 1.4 to 2.5:1. Suggested fix: a near-black tick (#141414) on the accent in dark mode, in DecoratedLayoutFragment.drawCheckbox and CheckPop. Light mode keeps the white tick.",
                       rows: rows).write(to: dir.appending(path: "02-checkbox-tick.png"))
    }

    // 3. The iPhone Format panel (pictures from A11yBeforeAfterPhoneShots).
    func problem3(_ dir: URL) throws {
        let raw = dir.appending(path: "raw-ios")
        var rows: [[Cell]] = []
        for (accent, light, darkHex) in [("blue", 0x0957AE as UInt32, 0x74B7FF as UInt32), ("green", 0x23653D, 0x6CC690)] {
            let pill = Palette.Format.pill(dark: true, highContrast: false)
            guard let before = Self.load(raw.appending(path: "format-\(accent)-before.png")),
                  let after = Self.load(raw.appending(path: "format-\(accent)-after.png")) else { continue }
            rows.append([
                Cell("3 · Default dark, \(accent) accent · Before\non segment against the pill \(Self.r(light, pill)), white glyph on it \(Self.r(0xFFFFFF, light))", before),
                Cell("3 · Default dark, \(accent) accent · After: light accent, near-black glyph\non segment against the pill \(Self.r(darkHex, pill)), glyph on it \(Self.r(A11yStudy.darkGlyph, darkHex))", after),
            ])
        }
        guard !rows.isEmpty else { return }
        try Self.board("3. iPhone Format panel, dark mode", "The on segment is the accent's deep light-mode shade on a dark pill, which only the stock amber lifts past 3:1. Suggested fix in Palette.Format.on: in dark mode the accent's dark shade, under a near-black glyph (Palette.Format.onGlyph). Drawn with the app's FormatPanel on the iPhone simulator, 520 pt wide so the whole style row and its on segment (Body) show.",
                       rows: rows, scale: 0.9).write(to: dir.appending(path: "03-iphone-format-panel.png"))
    }

    // 4. Default's amber.
    func problem4(_ c: ModelContainer, _ folder: Folder, _ dir: URL) async throws {
        // The folder pill: the system's tertiary fill over the sidebar, about #E8E8E8 in the light
        // (the audit's measure: amber on it 2.75:1) and #2B2B2B in the dark.
        let pill: [Bool: UInt32] = [false: 0xE5E5E5, true: 0x2B2B2B]
        var rows: [[Cell]] = []
        for dark in [false, true] {
            var row: [Cell] = []
            for (option, name) in [(A11yStudy.DefaultAmber.stock, "Before"), (.deepText, "After (option a): deeper amber for text"),
                                   (.inkOnFill, "After (option b): amber fills, ink text")] {
                Self.use(.standard) { A11yStudy.defaultAmber = option }
                let accent = Self.hex(PColor.paneAccent, dark: dark), button = Self.hex(Palette.primaryButton, dark: dark)
                let label = Self.hex(Palette.primaryButtonLabel, dark: dark), page = Self.hex(Palette.page, dark: dark)
                let folderName = option == .inkOnFill ? "name \(Self.r(0x000000, accent)) on the amber pill" : "name \(Self.r(accent, pill[dark]!))"
                let note = "link \(Self.r(accent, page)) · \(folderName) · button label \(Self.r(label, button))"
                let p = try await Self.page(c, dark: dark)
                let s = try await Self.sidebar(c, folder, dark: dark, height: 230)
                let b = try await Self.buttons(dark: dark, height: 230)
                let cell = try ThemeShots.stitch([s, Self.crop(p, top: 0, height: 230, width: 600), b])
                row.append(Cell("4 · Default \(dark ? "dark" : "light") · \(name)\n\(note)", cell))
            }
            rows.append(row)
        }
        let dotBefore = Self.r(0xD96A06, 0xEBEBEB), dotAfter = Self.r(A11yStudy.deepAmber, 0xEBEBEB)
        try Self.board("4. Default's amber", "A brand call. The stock amber #D96A06 is 3.49:1 as link or button text on white, 2.75:1 as the selected folder's name, and the AI dot on the selected row is \(dotBefore). Option a: a deeper amber #A34E00 for text, links and the button that carries a label (the dot becomes \(dotAfter)); ticks, the Format panel and other fills keep #D96A06 (this picture shows only the text parts). Option b: amber fills with black text for the selected folder and the button; links stay #D96A06 and still fail. Dark mode already passes except the white label on amberButton fills (3.49:1), which option a also fixes.",
                       rows: rows, scale: 0.8).write(to: dir.appending(path: "04-default-amber.png"))
    }

    // 5. High contrast with a picked accent.
    func problem5(_ c: ModelContainer, _ dir: URL) async throws {
        let grounds: [Bool: [UInt32]] = [false: [0xFFFFFF, 0xF0F0F0, 0xFFE14D], true: [0x000000, 0x1C1C1C, 0x4F4100]]
        func worst(_ h: UInt32, _ dark: Bool) -> String { String(format: "%.2f:1", grounds[dark]!.map { Self.ratio(h, $0) }.min()!) }
        var rows: [[Cell]] = []
        for dark in [false, true] {
            var row: [Cell] = []
            for (option, name) in [(A11yStudy.ContrastAccent.stock, "Before: red accent"), (.hidden, "After (option a): accent row hidden"),
                                   (.shades, "After (option b): High contrast shade of red")] {
                Self.use(.contrast, .red) { A11yStudy.contrastAccent = option }
                let accent = Self.hex(PColor.paneAccent, dark: dark)
                let p = try await Self.page(c, dark: dark)
                let s = try await ThemeShots.settings(dark: dark)
                let cell = try ThemeShots.stitch([Self.crop(p, top: 0, height: 290, width: 600), s])
                let worstAll = AccentChoice.allCases.compactMap { ch -> Double? in
                    guard ch != .theme else { return nil }
                    let h = option == .shades ? A11yStudy.contrastShades[ch]! : ch.hex!
                    return grounds[dark]!.map { Self.ratio(dark ? h.dark : h.light, $0) }.min()
                }.min()!
                let all = option == .hidden ? "own accent only" : String(format: "worst of the five accents %.2f:1", worstAll)
                row.append(Cell("5 · High contrast \(dark ? "dark" : "light") · \(name)\nlink, worst ground \(worst(accent, dark)) · \(all) · needs 7:1", cell))
            }
            rows.append(row)
        }
        try Self.board("5. High contrast with a picked accent", "High contrast holds its text to 7:1 (AAA), but a picked accent reaches only AA. Option a hides the accent row while High contrast is on, with one line in the footer, and High contrast keeps its own blue and yellow. Option b gives High contrast its own deep (light) and pale (dark) shade of each accent, each 7:1 on the page, the code fill and the selection (the swatches in Settings still show the normal shades).",
                       rows: rows, scale: 0.9).write(to: dir.appending(path: "05-high-contrast-accent.png"))
    }

    // 6. Increase Contrast.
    func problem6(_ c: ModelContainer, _ folder: Folder, _ n: Note, _ dir: URL) async throws {
        var rows: [[Cell]] = []
        for (theme, dark) in [(Theme.sepia, false), (.slate, true)] {
            var row: [Cell] = []
            for on in [false, true] {
                Self.use(theme) { if on { A11yStudy.increaseContrast = true; A11yStudy.selection = .bar } }
                let page = Self.hex(Palette.page, dark: dark), muted = Self.hex(Palette.muted, dark: dark), line = Self.hex(Palette.line, dark: dark)
                let list = Self.hex(Palette.listGround, dark: dark), sel = Self.hex(Palette.rowSelection, dark: dark)
                let mark = on ? "bar against the list \(Self.r(Self.hex(Palette.amberInk, dark: dark), list))" : "selected row \(Self.r(sel, list))"
                row.append(Cell("6 · \(theme.title) \(dark ? "dark" : "light") · \(on ? "After: Increase Contrast on" : "Before: Increase Contrast on (no change today)")\ngrey text \(Self.r(muted, page)) · hairline \(Self.r(line, page)) · \(mark)",
                                try await Self.window(c, folder, n, dark: dark)))
            }
            rows.append(row)
        }
        try Self.board("6. Increase Contrast", "With the macOS setting on, no theme changes today. Suggested: with Increase Contrast on, muted text takes the ink colour, hairlines take the muted text's colour (solid, 4.5:1 and up), and the selected row gets the bar from problem 1. The after pictures switch this on with a study flag; the app would read accessibilityDisplayShouldIncreaseContrast.",
                       rows: rows, scale: 0.62).write(to: dir.appending(path: "06-increase-contrast.png"))
    }

    // 7. Hairlines.
    func problem7(_ c: ModelContainer, _ dir: URL) async throws {
        var row: [Cell] = []
        for (theme, dark) in [(Theme.sepia, false), (.slate, true)] {
            Self.use(theme)
            let line = Self.hex(Palette.line, dark: dark), page = Self.hex(Palette.page, dark: dark), card = Self.hex(Palette.card, dark: dark)
            // A raised card (the app's `raised`: a 1 pt line ring and its shadow) on the page.
            let shape = RoundedRectangle(cornerRadius: 12, style: .continuous)
            let view = VStack(alignment: .leading, spacing: 6) {
                Text("Hotel booking").font(.headline).foregroundStyle(Color.ink)
                Text("Memmo Príncipe Real, two nights from 12 May.").foregroundStyle(Color.muted)
            }
            .padding(16).frame(width: 320, alignment: .leading)
            .background(Color.card, in: shape).raised(in: shape)
            .frame(maxWidth: .infinity, maxHeight: .infinity).background(Color.notePage)
            let rep = try await ThemeShots.host(view, size: CGSize(width: 420, height: 180), dark: dark, wait: 0.5)
            row.append(Cell("7 · \(theme.title) \(dark ? "dark" : "light") · Before (no change suggested)\na card's hairline against the page \(Self.r(line, page)), against the card \(Self.r(line, card))", rep))
        }
        try Self.board("7. Hairlines", "Hairlines are 1.3 to 1.7:1 in every theme but High contrast. Here, a raised card's 1 pt ring. They are decorative: cards also have a shadow and a fill of their own, table cells have their fill, and columns have the split view's divider. No fix suggested unless a hairline ever becomes the only boundary of something you can use. Increase Contrast would make them solid (problem 6).",
                       rows: [row]).write(to: dir.appending(path: "07-hairlines.png"))
    }

    // 8. iPhone accent dots (pictures from A11yBeforeAfterPhoneShots).
    func problem8(_ dir: URL) throws {
        let raw = dir.appending(path: "raw-ios")
        var row: [Cell] = []
        for (file, label) in [("dots-before", "8 · Default light · Before\naccent dots 22 by 22 pt, need 44 by 44 pt"),
                              ("dots-a", "8 · Default light · After (option a): 44 pt targets on two rows\neach dot 30 pt inside a 44 by 44 pt target"),
                              ("dots-b", "8 · Default light · After (option b): an Accent row with a picker\nrows 44 pt tall, each accent named")] {
            if let rep = Self.load(raw.appending(path: "\(file).png")) { row.append(Cell(label, rep)) }
        }
        guard !row.isEmpty else { return }
        try Self.board("8. iPhone accent dots", "On iPhone each accent dot is 22 pt, under the 44 pt minimum, and six 44 pt targets don't fit beside the Accent label. Option a puts 44 pt targets on their own rows under the label. Option b makes Accent one row showing the chosen accent's name, which opens a list of named accents. Both are standalone study views; the real page is being rebuilt on feature/settings-card.",
                       rows: [row], scale: 0.6).write(to: dir.appending(path: "08-iphone-accent-dots.png"))
    }

    // 9. Colour blindness.
    func problem9(_ c: ModelContainer, _ folder: Folder, _ n: Note, _ dir: URL) async throws {
        var pictures: [Bool: NSBitmapImageRep] = [:]
        for after in [false, true] {
            Self.use(.forest, .purple) {
                if after { A11yStudy.distinctAccents = true; A11yStudy.swatchTick = true; A11yStudy.selection = .bar }
            }
            let s = try await ThemeShots.settings(dark: true)
            let l = try await Self.list(c, folder, n, dark: true, height: 290)
            pictures[after] = try ThemeShots.stitch([s, l])
        }
        func pair(_ v: Vision, _ after: Bool) -> String {
            let blue = AccentChoice.blue.hex!.dark, purple = after ? A11yStudy.magenta.dark : AccentChoice.purple.hex!.dark
            let forest = after ? A11yStudy.moss.dark : Theme.forest.colors!.accent.dark, green = AccentChoice.green.hex!.dark
            let red = AccentChoice.red.hex!.dark
            return String(format: "ΔE blue to %@ %.0f, Forest's own to green %.0f, red to green %.0f", after ? "magenta" : "purple",
                          Self.deltaE(blue, purple, v), Self.deltaE(forest, green, v), Self.deltaE(red, green, v))
        }
        var rows: [[Cell]] = []
        for v in Vision.allCases {
            rows.append([
                Cell("9 · Forest dark, purple picked · Before · \(v.rawValue)\n\(pair(v, false))", try Self.simulate(pictures[false]!, v)),
                Cell("9 · Forest dark, purple picked · After · \(v.rawValue)\n\(pair(v, true))", try Self.simulate(pictures[true]!, v)),
            ])
        }
        try Self.board("9. Colour blindness", "Simulated with the Machado 2009 matrices at full strength. Before: blue and purple look alike with protanopia and deuteranopia, and Forest's own accent is the green accent in dark mode (ΔE 0). After: purple moves to magenta (#93246F, #FF9AD5), Forest's own accent to moss (#4A6A12, #B4D16A), the chosen swatch gets a tick, and the selected row the bar from problem 1, so neither relies on hue. ΔE under 10 is hard to tell apart. Still open: red and green stay close with protanopia and deuteranopia; the tick and the names (option b in problem 8) carry the choice there.",
                       rows: rows, scale: 0.8).write(to: dir.appending(path: "09-colour-blindness.png"))
    }
}
#endif
