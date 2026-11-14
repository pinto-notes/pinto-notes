import SwiftUI
import SwiftData
import UniformTypeIdentifiers

/// A canvas's own controls, over the drawing (direction B, "Dock", 13 November 2026):
/// - one floating dock centred at the foot: Undo and Redo, then the tools (Mac); the tools and the
///   style (iPhone, where Undo and Redo are in the navigation bar);
/// - a small bar floating just above the selection, for its colours, stroke, layer and the rest;
/// - the zoom, quiet at the bottom right (Mac), with − and + under the pointer.
/// All of it native; the drawing itself is the only web part (CanvasBridge).
struct CanvasOverlay: View {
    let canvas: CanvasController
    /// For the empty board's "Ask your AI to draw it".
    var targets: [AskAI.Target] = []
    var subject: AskAI.Subject?

    var body: some View {
        ZStack {
            if canvas.connected {
                // Measured over the whole page, as the page measures the selection: on iPhone the
                // canvas runs under the bars, and inside the safe area the bar came out a band too
                // low, under the shape (the iPhone pictures, 13 November 2026).
                GeometryReader { geo in
                    if canvas.state.showsSelectionBar, let bounds = canvas.state.bounds, CanvasSelectionBar.inView(bounds, area: geo.size) {
                        CanvasSelectionBar(canvas: canvas, bounds: bounds, area: geo.size)
                    }
                    if let h = canvas.highlight {
                        CanvasAIHighlight(highlight: h)
                            .transition(.opacity)
                    }
                }
                .animation(.easeOut(duration: 0.3), value: canvas.highlight)
                #if os(iOS)
                .ignoresSafeArea()
                #endif
                if CanvasStart.shows(canvas.state) {
                    CanvasStart(canvas: canvas, targets: targets, subject: subject)
                        .transition(.opacity)
                }
                VStack(spacing: 0) {
                    Spacer(minLength: 0)
                    #if os(macOS)
                    // The tools are in the window's toolbar, where a note's are (Emil, 13 November
                    // 2026: "why can't it be at the top like it is for notes"). The zoom stays here.
                    HStack {
                        Spacer(minLength: 0)
                        CanvasZoom(canvas: canvas)
                    }
                    .overlay {
                        if let notice = canvas.notice {
                            Toast(text: notice)
                                .transition(.opacity)
                                .accessibilityIdentifier("canvas.notice")
                        }
                    }
                    .animation(.smooth(duration: 0.2), value: canvas.notice)
                    .padding(.trailing, 16)
                    .padding(.bottom, CanvasDock.margin)
                    #else
                    CanvasDock(canvas: canvas)
                        .padding(.bottom, CanvasDock.margin)
                    #endif
                }
            }
        }
    }
}

/// Pictures dropped on a board: image files from Finder, or an image dragged from another app.
@MainActor enum CanvasImageDrop {
    static let types: [UTType] = [.fileURL, .image]

    static func place(_ providers: [NSItemProvider], at point: CGPoint, on canvas: CanvasController) {
        Task { @MainActor in
            var placed = 0
            for p in providers.prefix(10) {
                guard let data = await load(p) else { continue }
                guard let image = await Task.detached(priority: .userInitiated, operation: { CanvasImage(data: data) }).value else { continue }
                // Several at once: each a little lower and to the right of the last.
                canvas.send(.image(image, at: CGPoint(x: point.x + CGFloat(placed) * 28, y: point.y + CGFloat(placed) * 28)))
                placed += 1
            }
            if placed == 0 { canvas.confirm("Only pictures can go on a whiteboard") }
        }
    }

    private static func load(_ p: NSItemProvider) async -> Data? {
        if p.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) {
            let url: URL? = await withCheckedContinuation { done in
                _ = p.loadObject(ofClass: URL.self) { url, _ in done.resume(returning: url) }
            }
            if let url, (UTType(filenameExtension: url.pathExtension)?.conforms(to: .image) ?? false) { return try? Data(contentsOf: url) }
            return nil
        }
        guard p.hasItemConformingToTypeIdentifier(UTType.image.identifier) else { return nil }
        return await withCheckedContinuation { done in
            _ = p.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { d, _ in done.resume(returning: d) }
        }
    }
}

/// Around what an AI just drew: an accent outline and its name at the top left, for a few
/// seconds. The receipt at the foot says it too, with Undo.
struct CanvasAIHighlight: View {
    let highlight: CanvasController.Highlight

    /// The outlines: one per thing the AI added or changed.
    var outlines: [CGRect] {
        (highlight.boxes.isEmpty ? [highlight.rect] : highlight.boxes).map { $0.insetBy(dx: -6, dy: -6) }
    }

    /// Where the name tag's top-left corner goes: above the topmost outline and clear of it
    /// (round 3, 16: it covered a shape's corner), or under it when there's no room above.
    /// …and clear of the rest of the drawing too, when it can be (round 4: it covered the
    /// template's how-to line and an arrow): above or below the topmost outline, at its left or
    /// right end, the first spot that covers nothing.
    static func tag(over outlines: [CGRect], avoiding near: [CGRect] = [], width: CGFloat = 96) -> CGPoint {
        guard let top = outlines.min(by: { ($0.minY, $0.minX) < ($1.minY, $1.minX) }) else { return .zero }
        let above = top.minY - 4 - 22, below = top.maxY + 4
        let spots = [CGPoint(x: top.minX, y: above), CGPoint(x: top.maxX - width, y: above),
                     CGPoint(x: top.minX, y: below), CGPoint(x: top.maxX - width, y: below)].filter { $0.y >= 4 }
        let others = outlines.filter { $0 != top } + near
        let clear = spots.first { p in
            let r = CGRect(x: p.x, y: p.y, width: width, height: 22).insetBy(dx: -2, dy: -2)
            return !others.contains { $0.intersects(r) }
        }
        return clear ?? spots.first ?? CGPoint(x: top.minX, y: below)
    }

    var body: some View {
        let boxes = outlines
        let at = Self.tag(over: boxes, avoiding: highlight.near)
        ZStack {
            ForEach(Array(boxes.enumerated()), id: \.offset) { _, r in
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .strokeBorder(Color.paneAccent, style: StrokeStyle(lineWidth: 2, dash: [6, 4]))
                    .background(Color.paneAccent.opacity(0.05), in: .rect(cornerRadius: 8, style: .continuous))
                    .frame(width: max(r.width, 20), height: max(r.height, 20))
                    .position(x: r.midX, y: r.midY)
            }
            HStack(spacing: 5) {
                AIGlyph(ai: highlight.by, size: 12, monochrome: true)
                Text(highlight.by)
            }
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .frame(height: 22)
            .background(Color.paneAccent, in: Capsule())
            .fixedSize()
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .offset(x: at.x, y: at.y)
        }
        .allowsHitTesting(false)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(highlight.by) drew this")
        .accessibilityIdentifier("canvas.aiHighlight")
    }
}

// MARK: An empty whiteboard

/// On an empty whiteboard: draw, or start from a template, or ask your AI (Emil, 13 November 2026).
/// Blank costs nothing: picking a drawing tool or drawing puts it away; a template comes in as one
/// step Undo takes back.
struct CanvasStart: View {
    let canvas: CanvasController
    /// The connected AIs, and what they'd be asked about (this whiteboard): the last line asks
    /// one to draw (whiteboard council, round 1: "make the AI line an action").
    var targets: [AskAI.Target] = []
    var subject: AskAI.Subject?
    @State private var asking: AskAI.Target?

    static func shows(_ s: CanvasState) -> Bool { s.empty && !s.busy && !s.editing && !s.tool.draws && s.tool != .eraser }

    static let askTitle = "Ask your AI to draw it\u{2026}"
    static func askTitle(_ t: AskAI.Target) -> String { "Ask \(t.ai) to draw it\u{2026}" }
    static let connectTitle = "Connect an AI to draw it for you\u{2026}"
    static let importTitle = "Import Excalidraw files\u{2026}"

    var body: some View {
        VStack(spacing: 16) {
            Text("Draw anything, or start from a template")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color.muted)
            HStack(spacing: 10) {
                ForEach(WhiteboardTemplate.allCases) { t in
                    Button { canvas.insert(t) } label: {
                        VStack(spacing: 8) {
                            CanvasTemplatePreview(template: t)
                                .frame(width: 92, height: 58)
                            Text(t.title)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Color.ink)
                        }
                        .padding(.vertical, 10)
                        .frame(width: 116)
                        .contentShape(.rect(cornerRadius: 14))
                    }
                    .buttonStyle(.plain)
                    .background(Color.card, in: .rect(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Color.primary.opacity(0.08)))
                    .hoverHighlight(.rect(cornerRadius: 14))
                    .help("Start from \(t.title.lowercased())")
                    .accessibilityLabel(t.title)
                    .accessibilityIdentifier("canvas.template.\(t.rawValue)")
                }
            }
            ask
            #if os(macOS)
            // Coming from Excalidraw: bring the old boards along from here (whiteboard council,
            // round 4: "an import entry on the empty board").
            Button(Self.importTitle) { CanvasImport.pick() }
                .buttonStyle(.hoverLink)
                .font(.system(size: 12))
                .foregroundStyle(Color.muted)
                .accessibilityIdentifier("canvas.import")
            #endif
        }
        .padding(20)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Start this whiteboard")
        .accessibilityIdentifier("canvas.start")
    }

    @ViewBuilder private var ask: some View {
        Group {
            if let subject, targets.count == 1, let t = targets.first {
                Button { asking = t } label: {
                    Label { Text(Self.askTitle(t)) } icon: { AIGlyph(ai: t.ai, size: 14, monochrome: true) }
                }
                .askAIPopover($asking, subject: subject, arrowEdge: .bottom)
            } else if let subject, targets.count > 1 {
                Menu {
                    ForEach(targets) { t in Button(AskAI.submenuItem(t)) { asking = t } }
                } label: {
                    Label(Self.askTitle, systemImage: "sparkles")
                }
                .menuStyle(.button)
                #if os(macOS)
                .menuIndicator(.hidden)
                #endif
                .fixedSize()
                .askAIPopover($asking, subject: subject, arrowEdge: .bottom)
            } else {
                Button { NotificationCenter.default.post(name: .paneConnectAI, object: nil) } label: {
                    Label(Self.connectTitle, systemImage: "sparkles")
                }
            }
        }
        .buttonStyle(.hoverLink)
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(Color.amberInk)
        .accessibilityIdentifier("canvas.ask")
    }
}

/// A template's shapes drawn small, in their colours, for its tile on an empty whiteboard (round
/// 1 of the whiteboard council: "show a preview, not a glyph").
struct CanvasTemplatePreview: View {
    let template: WhiteboardTemplate
    var body: some View { CanvasSketchView(sketch: CanvasSketch(elements: template.elements)) }
}

/// A board's shapes drawn small: boxes, ellipses and diamonds in their fills, lines, arrows and
/// pencil strokes as thin lines. The list's whiteboard rows and the template tiles.
struct CanvasSketchView: View {
    let sketch: CanvasSketch
    var lineWidth: CGFloat = 0.8
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Canvas { ctx, size in
            let shapes = sketch.shapes
            guard let first = shapes.first?.frame.standardized else { return }
            let box = shapes.dropFirst().reduce(first) { $0.union($1.frame.standardized) }.insetBy(dx: -2, dy: -2)
            let scale = min(size.width / max(box.width, 1), size.height / max(box.height, 1))
            let dx = (size.width - box.width * scale) / 2 - box.minX * scale
            let dy = (size.height - box.height * scale) / 2 - box.minY * scale
            let ink = Color.ink.opacity(0.75)
            func at(_ p: CGPoint) -> CGPoint { CGPoint(x: p.x * scale + dx, y: p.y * scale + dy) }
            for s in shapes {
                let f = s.frame.standardized
                let r = CGRect(origin: at(f.origin), size: CGSize(width: f.width * scale, height: f.height * scale))
                let path: Path
                switch s.kind {
                case "ellipse": path = Path(ellipseIn: r)
                case "diamond":
                    path = Path { p in
                        p.move(to: CGPoint(x: r.midX, y: r.minY)); p.addLine(to: CGPoint(x: r.maxX, y: r.midY))
                        p.addLine(to: CGPoint(x: r.midX, y: r.maxY)); p.addLine(to: CGPoint(x: r.minX, y: r.midY)); p.closeSubpath()
                    }
                case "arrow", "line", "freedraw":
                    // Points run from the element's own origin (as written, not standardised).
                    let o = s.frame.origin
                    let pts = s.points.isEmpty ? [CGPoint.zero, CGPoint(x: s.frame.size.width, y: s.frame.size.height)] : s.points
                    let line = Path { p in
                        for (i, q) in pts.enumerated() {
                            let pt = at(CGPoint(x: o.x + q.x, y: o.y + q.y))
                            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
                        }
                    }
                    ctx.stroke(line, with: .color(ink), style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
                    continue
                case "image": path = Path(r)
                default: path = Path(roundedRect: r, cornerRadius: min(3, r.height / 4))
                }
                if let hex = s.fill, let c = CanvasStyle.shown(hex, dark: scheme == .dark) { ctx.fill(path, with: .color(c)) }
                ctx.stroke(path, with: .color(ink), lineWidth: lineWidth)
            }
        }
        .accessibilityHidden(true)
    }
}

// MARK: The dock

struct CanvasDock: View {
    let canvas: CanvasController
    @Namespace private var well
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var showingStyle = false

    static let margin: CGFloat = 16
    static let button: CGFloat = 36

    /// The grey well slides to the tool you pick.
    var motion: Animation? { reduceMotion ? nil : .easeOut(duration: 0.15) }

    var body: some View {
        HStack(spacing: 2) {
            #if os(macOS)
            CanvasBarButton(title: "Undo", key: "\u{2318}Z", symbol: "arrow.uturn.backward", enabled: canvas.canUndo) { canvas.run(.undo) }
                .accessibilityIdentifier("canvas.undo")
            CanvasBarButton(title: "Redo", key: "\u{21E7}\u{2318}Z", symbol: "arrow.uturn.forward", enabled: canvas.canRedo) { canvas.run(.redo) }
                .accessibilityIdentifier("canvas.redo")
            Color.clear.frame(width: 14, height: 1)
            ForEach(CanvasTool.dock) { tool in toolButton(tool) }
            #else
            toolButton(.selection)
            toolButton(.freedraw)
            shapesButton
            toolButton(.arrow)
            toolButton(.text)
            toolButton(.eraser)
            styleButton
            #endif
        }
        .padding(6)
        .glassEffect(.regular, in: .capsule)
        .animation(motion, value: canvas.state.tool)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Drawing tools")
        .accessibilityIdentifier("canvas.dock")
    }

    private func toolButton(_ tool: CanvasTool) -> some View {
        CanvasBarButton(title: tool.title, key: tool.key, symbol: tool.symbol, selected: canvas.state.tool == tool,
                        well: well) { canvas.pick(tool) }
            .accessibilityIdentifier("canvas.tool.\(tool.rawValue)")
    }

    #if os(iOS)
    /// The shapes in one button: the last shape picked, the rest in its menu.
    private var shapesButton: some View {
        let current = CanvasTool.shapes.contains(canvas.state.tool) ? canvas.state.tool : .rectangle
        return Menu {
            ForEach(CanvasTool.shapes) { tool in
                Button(tool.title, systemImage: tool.symbol) { canvas.pick(tool) }
            }
        } label: {
            CanvasWell(selected: CanvasTool.shapes.contains(canvas.state.tool), well: well) {
                Image(systemName: current == .rectangle ? "square.on.circle" : current.symbol)
            }
        } primaryAction: {
            canvas.pick(current)
        }
        .accessibilityLabel("Shapes")
        .accessibilityIdentifier("canvas.tool.shapes")
    }

    /// The style of what's selected or about to be drawn, in a sheet.
    private var styleButton: some View {
        Button { showingStyle = true } label: {
            Circle()
                .fill(AngularGradient(colors: [.red, .orange, .yellow, .green, .blue, .purple, .red], center: .center))
                .frame(width: 26, height: 26)
                .frame(width: CanvasDock.button, height: CanvasDock.button)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Style")
        .accessibilityIdentifier("canvas.style")
        .sheet(isPresented: $showingStyle) {
            CanvasStylePanel(canvas: canvas)
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
    }
    #endif
}

/// The grey well under the picked tool; it slides between tools (matched geometry).
struct CanvasWell<Label: View>: View {
    var selected = false
    var hovering = false
    var well: Namespace.ID?
    @ViewBuilder let label: Label

    var body: some View {
        label
            .font(.system(size: 15, weight: .regular))
            .foregroundStyle(Color.ink)
            .frame(width: CanvasDock.button, height: CanvasDock.button)
            .background {
                if selected, let well {
                    Circle().fill(Color.soft).matchedGeometryEffect(id: "well", in: well)
                } else if selected {
                    Circle().fill(Color.soft)
                } else if hovering {
                    Circle().fill(Color.soft.opacity(0.55))
                }
            }
            .contentShape(Circle())
    }
}

/// A button on the dock or the selection bar: its symbol in a well, a tag after a short hover
/// ("Rectangle  R").
struct CanvasBarButton: View {
    let title: String
    var key: String? = nil
    let symbol: String
    var selected = false
    var enabled = true
    var well: Namespace.ID? = nil
    let action: () -> Void
    @State private var hovering = false
    @State private var tagShown = false
    @State private var tagWait: Task<Void, Never>?

    var body: some View {
        Button(action: action) {
            CanvasWell(selected: selected, hovering: hovering && enabled, well: well) {
                Image(systemName: symbol)
            }
            .opacity(enabled ? 1 : 0.35)
        }
        .buttonStyle(CanvasPressStyle())
        .disabled(!enabled)
        .accessibilityLabel(title)
        .accessibilityAddTraits(selected ? .isSelected : [])
        #if os(macOS)
        .onHover { inside in
            hovering = inside
            tagWait?.cancel()
            if inside {
                tagWait = Task { @MainActor in
                    try? await Task.sleep(for: .milliseconds(450))
                    if !Task.isCancelled { tagShown = true }
                }
            } else {
                tagShown = false
            }
        }
        .overlay(alignment: .top) {
            if tagShown { CanvasTag(title: title, key: key).fixedSize().offset(y: -38).allowsHitTesting(false).transition(.opacity) }
        }
        .animation(.easeOut(duration: 0.12), value: tagShown)
        #endif
    }
}

/// "Rectangle  R": dark, small, above the button.
struct CanvasTag: View {
    let title: String
    var key: String?

    var body: some View {
        HStack(spacing: 6) {
            Text(title).fontWeight(.semibold)
            if let key { Text(key).foregroundStyle(.white.opacity(0.6)) }
        }
        .font(.system(size: 12))
        .foregroundStyle(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(white: 0.12), in: RoundedRectangle(cornerRadius: 6))
        .accessibilityHidden(true)
    }
}

// MARK: The bar over the selection

struct CanvasSelectionBar: View {
    let canvas: CanvasController
    let bounds: CGRect
    let area: CGSize
    @State private var tray: Tray? = CanvasSelectionBar.startTray
    @State private var size = CGSize(width: 240, height: 44)

    /// Pictures only: the swatch tray starts out open.
    nonisolated(unsafe) static var startTray: Tray?
    @Environment(\.colorScheme) private var scheme

    enum Tray: Equatable { case stroke, fill }

    /// How far above the selection it floats: 6 pt on the Mac; on iPhone clear of the touch
    /// handles and the rotate handle above them, which the page's bounds don't include.
    #if os(iOS)
    static let gap: CGFloat = 28
    #else
    /// Clear of the rotate handle, which stands about 20 pt above the selection's box.
    static let gap: CGFloat = 30
    #endif

    /// Shown only while some of the selection is in view: scrolled away, a bar kept at the edge
    /// floated over other things for a shape you couldn't see (whiteboard council, round 2, 15).
    static func inView(_ bounds: CGRect, area: CGSize) -> Bool {
        bounds.intersects(CGRect(origin: .zero, size: area).insetBy(dx: 12, dy: 12))
    }

    /// Its centre. Above the selection where it covers nothing drawn; else slid along above it,
    /// then below, then beside it; with nowhere clear, where it covers least (whiteboard council,
    /// round 2, 07: it sat on the arrow into the box and on the shape above). Always in the canvas.
    static func position(bounds: CGRect, bar: CGSize, area: CGSize, nearby: [CanvasObstacle] = [], margin: CGFloat = 8) -> CGPoint {
        func clamp(_ p: CGPoint) -> CGPoint {
            CGPoint(x: min(max(p.x, margin + bar.width / 2), max(area.width - margin - bar.width / 2, margin + bar.width / 2)),
                    y: min(max(p.y, margin + bar.height / 2), max(area.height - margin - bar.height / 2, margin + bar.height / 2)))
        }
        // Clear by the bar's shadow and a hand-drawn stroke's wobble (round 4, 07: it still clipped
        // the Start ellipse's edge with 4 pt).
        func rect(_ c: CGPoint) -> CGRect { CGRect(x: c.x - bar.width / 2, y: c.y - bar.height / 2, width: bar.width, height: bar.height).insetBy(dx: -10, dy: -10) }
        func fits(_ c: CGPoint) -> Bool {
            c.y - bar.height / 2 >= margin && c.y + bar.height / 2 <= area.height - margin
                && c.x - bar.width / 2 >= margin && c.x + bar.width / 2 <= area.width - margin
        }
        let above = bounds.minY - gap - bar.height / 2, below = bounds.maxY + gap + bar.height / 2
        let slide = (bounds.width + bar.width) / 2
        let offsets: [CGFloat] = [0] + stride(from: CGFloat(16), through: slide, by: 16).flatMap { [-$0, $0] }
        var spots = [CGPoint]()
        // Slid spots are kept inside the canvas side to side; one that can't be is left out.
        let lo = margin + bar.width / 2, hi = max(area.width - margin - bar.width / 2, lo)
        for y in [above, below] {
            for o in offsets {
                let c = CGPoint(x: min(max(bounds.midX + o, lo), hi), y: y)
                if !spots.contains(c) { spots.append(c) }
            }
        }
        // Off a corner, clear of shapes as wide as the selection right above or below it (round 5,
        // 07: Start above the selected box; 15: Done below the diamond), then beside it.
        let left = bounds.minX - gap / 2 - bar.width / 2, right = bounds.maxX + gap / 2 + bar.width / 2
        spots += [CGPoint(x: right, y: above), CGPoint(x: left, y: above), CGPoint(x: right, y: below), CGPoint(x: left, y: below)]
        spots += [CGPoint(x: bounds.minX - gap - bar.width / 2, y: bounds.midY), CGPoint(x: bounds.maxX + gap + bar.width / 2, y: bounds.midY)]
        let inside = spots.filter(fits)
        if let clear = inside.first(where: { c in !nearby.contains { $0.hits(rect(c)) } }) { return clear }
        // Nowhere clear: the old place, above (below with no room above), kept in the canvas.
        let fallback = CGPoint(x: bounds.midX, y: above - bar.height / 2 < margin ? below : above)
        let least = inside.min { a, b in nearby.filter { $0.hits(rect(a)) }.count < nearby.filter { $0.hits(rect(b)) }.count }
        if let least, nearby.filter({ $0.hits(rect(least)) }).count < nearby.filter({ $0.hits(rect(fallback)) }).count { return least }
        return clamp(fallback)
    }

    var body: some View {
        let state = canvas.state
        let dark = scheme == .dark
        VStack(spacing: 6) {
            if let tray {
                swatchTray(tray, dark: dark)
                    .transition(.opacity.combined(with: .scale(scale: 0.96, anchor: .bottom)))
            }
            HStack(spacing: 2) {
                if state.showsStroke || state.showsText {
                    chip(.stroke) {
                        Circle().fill(CanvasStyle.shown(state.strokeColor, dark: dark) ?? .primary).frame(width: 18, height: 18)
                    }
                    .accessibilityLabel(state.showsText && !state.showsStroke ? "Text colour" : "Stroke colour")
                    .accessibilityIdentifier("canvas.bar.stroke")
                }
                if state.showsFill {
                    chip(.fill) { fillSwatch(state.mixedFill ? "mixed" : state.backgroundColor, dark: dark, size: 18) }
                        .accessibilityLabel("Fill")
                        .accessibilityIdentifier("canvas.bar.fill")
                }
                if state.showsStroke {
                    menuButton("Stroke width", symbol: "line.3.horizontal", id: "canvas.bar.width") {
                        Picker("Stroke width", selection: Binding(get: { state.strokeWidth }, set: { canvas.set(.strokeWidth, .number($0)) })) {
                            ForEach(CanvasStyle.widths, id: \.value) { Text($0.name).tag($0.value) }
                        }
                        .pickerStyle(.inline)
                        Picker("Line", selection: Binding(get: { state.strokeStyle }, set: { canvas.set(.strokeStyle, .text($0)) })) {
                            ForEach(CanvasStyle.strokeStyles, id: \.value) { Text($0.name).tag($0.value) }
                        }
                        .pickerStyle(.inline)
                    }
                } else if state.showsText {
                    menuButton("Text size", symbol: "textformat.size", id: "canvas.bar.textSize") {
                        Picker("Size", selection: Binding(get: { state.fontSize }, set: { canvas.set(.fontSize, .number($0)) })) {
                            ForEach(CanvasStyle.fontSizes, id: \.value) { Text($0.name).tag($0.value) }
                        }
                        .pickerStyle(.inline)
                    }
                }
                if state.showsArrowheads {
                    menuButton("Arrow type", symbol: CanvasStyle.arrowTypes.first { $0.value == state.arrowType }?.symbol ?? "arrow.up.right", id: "canvas.bar.arrowType") {
                        Picker("Arrow type", selection: Binding(get: { state.arrowType }, set: { canvas.set(.arrowType, .text($0)) })) {
                            ForEach(CanvasStyle.arrowTypes, id: \.value) { Label($0.name, systemImage: $0.symbol).tag($0.value) }
                        }
                        .pickerStyle(.inline)
                    }
                }
                if state.showsAlign {
                    menuButton("Align", symbol: "align.horizontal.left", id: "canvas.bar.align") { CanvasAlignItems(canvas: canvas, count: state.selection.count) }
                }
                menuButton("Arrange", symbol: "square.3.layers.3d", id: "canvas.bar.layer") {
                    Button("Bring to Front", systemImage: "square.3.layers.3d.top.filled") { canvas.run(.bringToFront) }
                    Button("Bring Forward", systemImage: "arrow.up") { canvas.run(.bringForward) }
                    Button("Send Backward", systemImage: "arrow.down") { canvas.run(.sendBackward) }
                    Button("Send to Back", systemImage: "square.3.layers.3d.bottom.filled") { canvas.run(.sendToBack) }
                }
                menuButton("More", symbol: "ellipsis", id: "canvas.bar.more") { CanvasMoreItems(canvas: canvas) }
            }
            .padding(4)
            // Solid, as a menu is: over a drawing, glass let the lines behind run through the
            // buttons (whiteboard council, round 1).
            .background(Color.card, in: Capsule())
            .raised(in: Capsule())
        }
        .fixedSize()
        .onGeometryChange(for: CGSize.self) { $0.size } action: { size = $0 }
        .position(Self.position(bounds: bounds, bar: size, area: area, nearby: canvas.state.nearby))
        .animation(.easeOut(duration: 0.15), value: tray)
        .onChange(of: canvas.state.selection) { _, _ in tray = nil }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Selection")
        .accessibilityIdentifier("canvas.selectionBar")
    }

    private func chip(_ which: Tray, @ViewBuilder label: () -> some View) -> some View {
        Button { tray = tray == which ? nil : which } label: {
            CanvasWell(selected: tray == which) { label() }
                .frame(width: 34, height: 34)
        }
        .buttonStyle(CanvasPressStyle())
    }

    private func menuButton(_ title: String, symbol: String, id: String, @ViewBuilder items: () -> some View) -> some View {
        Menu { items() } label: {
            Image(systemName: symbol)
                .font(.system(size: 14))
                .foregroundStyle(Color.ink)
                .frame(width: 34, height: 34)
                .contentShape(Circle())
        }
        .menuStyle(.button)
        .buttonStyle(.plain)
        .hoverHighlight(Circle())
        #if os(macOS)
        .menuIndicator(.hidden)
        .help(title)
        #endif
        .fixedSize()
        .accessibilityLabel(title)
        .accessibilityIdentifier(id)
    }

    /// A row of swatches and the system colour well, above the bar.
    private func swatchTray(_ which: Tray, dark: Bool) -> some View {
        let swatches = which == .stroke ? CanvasStyle.strokes : CanvasStyle.fills
        let current = which == .stroke ? canvas.state.strokeColor : canvas.state.backgroundColor
        let key: CanvasCommand.StyleKey = which == .stroke ? .strokeColor : .backgroundColor
        return HStack(spacing: 6) {
            ForEach(swatches) { s in
                Button { canvas.set(key, .text(s.hex)) } label: {
                    fillSwatch(s.hex, dark: dark, size: 22)
                        .padding(3)
                        .overlay(Circle().strokeBorder(Color.ink, lineWidth: current.lowercased() == s.hex ? 2 : 0))
                }
                .buttonStyle(CanvasPressStyle())
                .accessibilityLabel(s.name)
                .accessibilityAddTraits(current.lowercased() == s.hex ? .isSelected : [])
            }
            CanvasColorWell(title: which == .stroke ? "Stroke colour" : "Fill colour",
                            color: CanvasStyle.shown(current, dark: dark) ?? .clear) { canvas.set(key, .text(CanvasStyle.hex($0, dark: dark))) }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.card, in: Capsule())
        .raised(in: Capsule())
        .accessibilityIdentifier("canvas.tray")
    }

    @ViewBuilder
    private func fillSwatch(_ hex: String, dark: Bool, size: CGFloat) -> some View {
        if hex == "mixed" {
            // Different fills: half and half, as a mixed state.
            RoundedRectangle(cornerRadius: size * 0.28).fill(LinearGradient(colors: [.secondary.opacity(0.55), .secondary.opacity(0.55), Color.card, Color.card], startPoint: .topLeading, endPoint: .bottomTrailing))
                .overlay(RoundedRectangle(cornerRadius: size * 0.28).strokeBorder(Color.line, lineWidth: 1))
                .frame(width: size, height: size)
                .accessibilityLabel("Mixed")
        } else if hex == "transparent" {
            Circle().fill(Color.card)
                .overlay(Rectangle().fill(Color.red).frame(width: 1.5, height: size * 1.1).rotationEffect(.degrees(45)))
                .clipShape(Circle())
                .overlay(Circle().strokeBorder(Color.line, lineWidth: 1))
                .frame(width: size, height: size)
        } else {
            RoundedRectangle(cornerRadius: size * 0.28).fill(CanvasStyle.shown(hex, dark: dark) ?? .clear)
                .overlay(RoundedRectangle(cornerRadius: size * 0.28).strokeBorder(Color.line, lineWidth: 1))
                .frame(width: size, height: size)
        }
    }
}

/// Lining up two or more: Excalidraw's align and distribute (whiteboard council, round 2: "used on
/// every diagram").
struct CanvasAlignItems: View {
    let canvas: CanvasController
    let count: Int

    var body: some View {
        Button("Align Left", systemImage: "align.horizontal.left") { canvas.run(.alignLeft) }
        Button("Align Centre", systemImage: "align.horizontal.center") { canvas.run(.alignCenter) }
        Button("Align Right", systemImage: "align.horizontal.right") { canvas.run(.alignRight) }
        Divider()
        Button("Align Top", systemImage: "align.vertical.top") { canvas.run(.alignTop) }
        Button("Align Middle", systemImage: "align.vertical.center") { canvas.run(.alignMiddle) }
        Button("Align Bottom", systemImage: "align.vertical.bottom") { canvas.run(.alignBottom) }
        if count >= 3 {
            Divider()
            Button("Space Evenly Across", systemImage: "distribute.horizontal.center") { canvas.run(.distributeHorizontally) }
            Button("Space Evenly Down", systemImage: "distribute.vertical.center") { canvas.run(.distributeVertically) }
        }
    }
}

/// The selection's ••• menu: the rest of its style, then Duplicate and Delete.
struct CanvasMoreItems: View {
    let canvas: CanvasController

    var body: some View {
        let state = canvas.state
        if state.showsFill, state.backgroundColor != "transparent" {
            Picker("Fill style", selection: Binding(get: { state.fillStyle }, set: { canvas.set(.fillStyle, .text($0)) })) {
                ForEach(CanvasStyle.fillStyles, id: \.value) { Text($0.name).tag($0.value) }
            }
        }
        if state.showsText {
            Picker("Font", selection: Binding(get: { state.fontFamily }, set: { canvas.set(.fontFamily, .number(Double($0))) })) {
                ForEach(CanvasStyle.fonts, id: \.value) { Text($0.name).tag($0.value) }
            }
            if state.showsStroke {
                Picker("Text size", selection: Binding(get: { state.fontSize }, set: { canvas.set(.fontSize, .number($0)) })) {
                    ForEach(CanvasStyle.fontSizes, id: \.value) { Text($0.name).tag($0.value) }
                }
            }
        }
        if state.showsArrowheads {
            Picker("Start", selection: Binding(get: { state.startArrowhead ?? "" }, set: { canvas.set(.startArrowhead, $0.isEmpty ? .none : .text($0)) })) {
                ForEach(CanvasStyle.arrowheads, id: \.name) { Text($0.name).tag($0.value ?? "") }
            }
            Picker("End", selection: Binding(get: { state.endArrowhead ?? "" }, set: { canvas.set(.endArrowhead, $0.isEmpty ? .none : .text($0)) })) {
                ForEach(CanvasStyle.arrowheads, id: \.name) { Text($0.name).tag($0.value ?? "") }
            }
        }
        Picker("Opacity", selection: Binding(get: { (state.opacity / 25).rounded() * 25 }, set: { canvas.set(.opacity, .number($0)) })) {
            ForEach([100.0, 75, 50, 25], id: \.self) { Text("\(Int($0))%").tag($0) }
        }
        Divider()
        Button("Duplicate", systemImage: "plus.square.on.square") { canvas.run(.duplicate) }
        Button("Delete", systemImage: "trash", role: .destructive) { canvas.run(.delete) }
    }
}

#if os(iOS)
/// The style of what's selected or about to be drawn, as one panel (the iPhone's sheet).
struct CanvasStylePanel: View {
    let canvas: CanvasController
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let state = canvas.state
        let dark = scheme == .dark
        Form {
            if state.showsStroke || state.showsText {
                Section(state.showsStroke ? "Stroke" : "Text") {
                    swatches(CanvasStyle.strokes, current: state.strokeColor, key: .strokeColor, dark: dark)
                }
            }
            if state.showsFill {
                Section("Fill") {
                    swatches(CanvasStyle.fills, current: state.backgroundColor, key: .backgroundColor, dark: dark)
                }
            }
            if state.showsStroke {
                Section {
                    Picker("Width", selection: Binding(get: { state.strokeWidth }, set: { canvas.set(.strokeWidth, .number($0)) })) {
                        ForEach(CanvasStyle.widths, id: \.value) { Text($0.name).tag($0.value) }
                    }
                    .pickerStyle(.segmented)
                    Picker("Line", selection: Binding(get: { state.strokeStyle }, set: { canvas.set(.strokeStyle, .text($0)) })) {
                        ForEach(CanvasStyle.strokeStyles, id: \.value) { Text($0.name).tag($0.value) }
                    }
                    .pickerStyle(.segmented)
                }
            }
            Section {
                CanvasMoreItems(canvas: canvas)
            }
        }
        .accessibilityIdentifier("canvas.stylePanel")
    }

    private func swatches(_ list: [CanvasStyle.Swatch], current: String, key: CanvasCommand.StyleKey, dark: Bool) -> some View {
        HStack(spacing: 10) {
            ForEach(list) { s in
                Button { canvas.set(key, .text(s.hex)) } label: {
                    Circle().fill(s.hex == "transparent" ? Color.card : (CanvasStyle.shown(s.hex, dark: dark) ?? .clear))
                        .overlay(Circle().strokeBorder(Color.line, lineWidth: 1))
                        .frame(width: 30, height: 30)
                        .padding(3)
                        .overlay(Circle().strokeBorder(Color.ink, lineWidth: current.lowercased() == s.hex ? 2 : 0))
                }
                .buttonStyle(.plain)
                .accessibilityLabel(s.name)
            }
            Spacer(minLength: 0)
            ColorPicker("Other colour", selection: Binding(get: { CanvasStyle.shown(current, dark: dark) ?? .clear },
                                                           set: { canvas.set(key, .text(CanvasStyle.hex($0, dark: dark))) }), supportsOpacity: false)
                .labelsHidden()
        }
    }
}
#endif

/// Any other colour: a round rainbow well. On the Mac it opens the system colour panel (SwiftUI's
/// ColorPicker draws a wide well there); on iPhone it's the system ColorPicker.
struct CanvasColorWell: View {
    let title: String
    let color: Color
    let pick: (Color) -> Void

    var body: some View {
        #if os(macOS)
        Button { CanvasColorPanel.shared.open(color, pick: pick) } label: {
            Circle()
                .fill(AngularGradient(colors: [.red, .orange, .yellow, .green, .blue, .purple, .red], center: .center))
                .frame(width: 22, height: 22)
                .padding(3)
        }
        .buttonStyle(CanvasPressStyle())
        .help(title)
        .accessibilityLabel(title)
        #else
        ColorPicker(title, selection: Binding(get: { color }, set: pick), supportsOpacity: false)
            .labelsHidden()
        #endif
    }
}

#if os(macOS)
/// The system colour panel, sending what's picked to the open canvas.
@MainActor final class CanvasColorPanel: NSObject {
    static let shared = CanvasColorPanel()
    private var pick: ((Color) -> Void)?

    func open(_ color: Color, pick: @escaping (Color) -> Void) {
        self.pick = pick
        let panel = NSColorPanel.shared
        panel.showsAlpha = false
        panel.setTarget(self)
        panel.setAction(#selector(changed(_:)))
        panel.color = NSColor(color)
        panel.orderFront(nil)
    }

    @objc private func changed(_ panel: NSColorPanel) { pick?(Color(nsColor: panel.color)) }
}
#endif

// MARK: Zoom

#if os(macOS)
/// "100%", quiet, at the bottom right; − and + come with the pointer. ⌘+, ⌘− and ⌘0 too.
struct CanvasZoom: View {
    let canvas: CanvasController
    @State private var hovering = false

    var body: some View {
        HStack(spacing: 2) {
            if hovering {
                CanvasBarButton(title: CanvasMenu.zoomOut, key: "\u{2318}\u{2212}", symbol: "minus") { canvas.run(.zoomOut) }
                    .transition(.opacity)
            }
            Button { canvas.run(.resetZoom) } label: {
                Text("\(Int((canvas.state.zoom * 100).rounded()))%")
                    .font(.system(size: 12, weight: .medium).monospacedDigit())
                    .foregroundStyle(Color.muted)
                    .frame(minWidth: 40, minHeight: CanvasDock.button)
            }
            .buttonStyle(.plain)
            .hoverHighlight(Capsule())
            .help("Actual Size (\u{2318}0)")
            .accessibilityLabel("Zoom \(Int((canvas.state.zoom * 100).rounded())) percent")
            .accessibilityIdentifier("canvas.zoom")
            if hovering {
                CanvasBarButton(title: CanvasMenu.zoomIn, key: "\u{2318}+", symbol: "plus") { canvas.run(.zoomIn) }
                    .transition(.opacity)
            }
        }
        .padding(.horizontal, 4)
        .contentShape(Rectangle())
        .onHover { inside in withAnimation(.easeOut(duration: 0.15)) { hovering = inside } }
    }
}

/// A focused canvas's note list, slid in over the drawing from the window's left edge while the
/// pointer is there; the drawing doesn't move (Emil, 13 November 2026).
struct CanvasEdgePeek<Content: View>: View {
    @Binding var shown: Bool
    @ViewBuilder let content: Content
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static var width: CGFloat { 330 }

    var body: some View {
        ZStack(alignment: .leading) {
            // The strip that wakes it: the window's left edge.
            Color.clear
                .frame(width: 6)
                .frame(maxHeight: .infinity)
                .contentShape(Rectangle())
                .onHover { if $0 { shown = true } }
                .accessibilityHidden(true)
            if shown {
                content
                    .frame(width: Self.width)
                    .frame(maxHeight: .infinity)
                    .background(Color(nsColor: .windowBackgroundColor))
                    .clipShape(UnevenRoundedRectangle(bottomTrailingRadius: 14, topTrailingRadius: 14))
                    .raised(in: UnevenRoundedRectangle(bottomTrailingRadius: 14, topTrailingRadius: 14))
                    .onHover { if !$0 { shown = false } }
                    .transition(reduceMotion ? .opacity : .move(edge: .leading))
                    .accessibilityIdentifier("canvas.peek")
            }
        }
        .animation(reduceMotion ? nil : .snappy(duration: 0.22), value: shown)
    }
}

/// Non-generic home for the peek's picture switch.
enum CanvasEdgePeekFlag {
    nonisolated(unsafe) static var startShown = false
}
#endif

#if os(macOS)
// MARK: In the window's toolbar (Mac)

/// The canvas's tools as the note's toolbar items: the same glass group and buttons as a text
/// note's Aa, Checklist and Table, the picked tool in the accent (as the Table menu shows a table).
/// The shapes share one button, the last shape picked, the rest in its menu, as Freeform does.
private extension View {
    /// The picked tool in the accent; the others untouched, as the toolbar's other buttons are.
    @ViewBuilder func picked(_ on: Bool) -> some View {
        if on { foregroundStyle(Color.amberInk) } else { self }
    }
}

struct CanvasToolbarTools: View {
    let canvas: CanvasController
    /// A narrow window: the tools used most, the rest in one menu, so nothing falls off the
    /// toolbar (whiteboard council, round 2, 15: everything after the pencil was gone).
    var compact = false

    static let tools: [CanvasTool] = [.selection, .hand, .freedraw, .arrow, .text, .eraser]
    /// Narrower than this, the column shows the compact tools (and the board drops its breadcrumb).
    static let compactWidth: CGFloat = 760
    static func compact(_ width: CGFloat) -> Bool { width < compactWidth }
    /// In the compact set: shown, and in its More Tools menu.
    static let compactShown: [CanvasTool] = [.selection, .freedraw, .arrow, .text]
    static let compactMore: [CanvasTool] = [.hand, .eraser]

    var body: some View {
        let current = canvas.state.tool
        Group {
            if compact {
                tool(.selection, current)
                tool(.freedraw, current)
                shapes(current)
                tool(.arrow, current)
                tool(.text, current)
                moreTools(current)
            } else {
                tool(.selection, current)
                tool(.hand, current)
                tool(.freedraw, current)
                shapes(current)
                tool(.arrow, current)
                tool(.text, current)
                tool(.eraser, current)
                Button { Self.pickImage(canvas) } label: { Label(Self.imageTitle, systemImage: "photo") }
                    .help("Add a picture (or paste or drop one)")
                    .accessibilityIdentifier("canvas.tool.image")
            }
        }
        .disabled(!canvas.connected)
    }

    private func moreTools(_ current: CanvasTool) -> some View {
        let picked = Self.compactMore.contains(current)
        return Menu {
            ForEach(Self.compactMore) { t in
                Button(t.help, systemImage: t.symbol) { canvas.pick(t) }
            }
            Button(Self.imageTitle + "\u{2026}", systemImage: "photo") { Self.pickImage(canvas) }
            Button(Self.stickyTitle, systemImage: "note.text") { canvas.send(.sticky) }
        } label: {
            Label("More Tools", systemImage: picked ? current.symbol : "chevron.down.circle").picked(picked)
        }
        .menuIndicator(.hidden)
        .help("Hand, eraser, pictures and sticky notes")
        .accessibilityIdentifier("canvas.tool.more")
    }

    private func tool(_ t: CanvasTool, _ current: CanvasTool) -> some View {
        Button { canvas.pick(t) } label: {
            // Only the picked tool is tinted; the rest keep the toolbar's own style, so they dim
            // with the window like its other buttons (round 2: forced black, the others looked off).
            Label(t.title, systemImage: t.symbol).picked(t == current)
        }
        .help(t.help)
        .accessibilityAddTraits(t == current ? .isSelected : [])
        .accessibilityIdentifier("canvas.tool.\(t.rawValue)")
    }

    private func shapes(_ current: CanvasTool) -> some View {
        let picked = CanvasTool.shapes.contains(current)
        let shown = picked ? current : CanvasToolbarTools.lastShape
        return Menu {
            ForEach(CanvasTool.shapes) { t in
                Button(t.help, systemImage: t.symbol) { CanvasToolbarTools.lastShape = t; canvas.pick(t) }
            }
            Divider()
            Button(Self.stickyTitle, systemImage: "note.text") { canvas.send(.sticky) }
                .accessibilityIdentifier("canvas.tool.sticky")
        } label: {
            Label("Shapes", systemImage: shown.symbol).picked(picked)
        } primaryAction: {
            canvas.pick(shown)
        }
        .menuIndicator(.hidden)
        .help("\(shown.help), more shapes on a long press")
        .accessibilityAddTraits(picked ? .isSelected : [])
        .accessibilityIdentifier("canvas.tool.shapes")
    }

    static let imageTitle = "Image"
    static let stickyTitle = "Sticky Note (S)"

    /// Pictures from a file, onto the middle of the view.
    static func pickImage(_ canvas: CanvasController) {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.image]
        panel.allowsMultipleSelection = true
        panel.begin { response in
            guard response == .OK else { return }
            let urls = panel.urls
            Task { @MainActor in
                for (i, url) in urls.prefix(10).enumerated() {
                    guard let image = await Task.detached(priority: .userInitiated, operation: { (try? Data(contentsOf: url)).flatMap(CanvasImage.init(data:)) }).value else {
                        canvas.confirm("\u{201C}\(url.lastPathComponent)\u{201D} couldn\u{2019}t be read"); continue
                    }
                    _ = i
                    canvas.send(.image(image, at: nil))
                }
            }
        }
    }

    /// The shape the button draws when pressed: the last one picked from its menu.
    nonisolated(unsafe) static var lastShape: CanvasTool = .rectangle
}

/// Excalidraw files brought in as whiteboards (whiteboard council, round 2: "Missing import blocks
/// moving existing work").
@MainActor enum CanvasImport {
    struct Made { var notes: [Note] = []; var refused: [String] = [] }

    static let types: [UTType] = [UTType(filenameExtension: "excalidraw") ?? .json, .json]

    static func make(_ urls: [URL], in scope: Scope, context: ModelContext, pages: NotePageStore = .shared, data: NotePageDataStore = .shared) -> Made {
        var made = Made()
        for url in urls {
            let reach = url.startAccessingSecurityScopedResource()
            defer { if reach { url.stopAccessingSecurityScopedResource() } }
            guard let bytes = try? Data(contentsOf: url), let scene = CanvasNote.scene(fromExcalidraw: bytes) else {
                made.refused.append(url.lastPathComponent); continue
            }
            made.notes.append(CanvasNote.make(in: scope, context: context, pages: pages, data: data, scene: scene, named: CanvasNote.name(ofFile: url)))
        }
        return made
    }

    static func pick() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = types
        panel.allowsMultipleSelection = true
        panel.message = "Choose Excalidraw files. Each one becomes a whiteboard."
        panel.prompt = "Import"
        guard panel.runModal() == .OK else { return }
        NotificationCenter.default.post(name: .paneImportWhiteboards, object: panel.urls)
    }

    static func report(_ made: Made) {
        guard !made.refused.isEmpty else { return }
        let alert = NSAlert()
        alert.messageText = made.refused.count == 1 ? "\u{201C}\(made.refused[0])\u{201D} isn't an Excalidraw file" : "\(made.refused.count) files aren't Excalidraw files"
        alert.informativeText = made.notes.isEmpty ? "Nothing was imported." : "The others are in your notes."
        alert.runModal()
    }
}

/// Export and Copy as PNG, from the More menu and File › Export (Excalidraw's Export image and
/// Copy to clipboard as PNG, ⇧⌥C there; ⇧⌥⌘C here, with the Mac's ⌘).
@MainActor enum CanvasExportAction {
    static func save(_ format: CanvasExport, canvas: CanvasController) {
        Task { @MainActor in
            guard let data = await canvas.export(format) else { canvas.confirm("Nothing to export yet"); return }
            let panel = NSSavePanel()
            panel.allowedContentTypes = [format.contentType]
            panel.nameFieldStringValue = CanvasExport.filename(canvas.title, format)
            panel.canCreateDirectories = true
            panel.begin { response in
                guard response == .OK, let url = panel.url else { return }
                do { try data.write(to: url, options: .atomic); canvas.confirm("Exported \(url.lastPathComponent)") }
                catch { canvas.confirm("Couldn\u{2019}t save \(url.lastPathComponent)") }
            }
        }
    }

    /// The selection if there is one, else the whole board.
    static func copy(_ canvas: CanvasController) {
        Task { @MainActor in
            let selected = canvas.state.bounds != nil
            guard let data = await canvas.export(.png, selected: selected), let image = NSImage(data: data) else { canvas.confirm("Nothing to copy yet"); return }
            NSPasteboard.general.clearContents()
            NSPasteboard.general.writeObjects([image])
            canvas.confirm(selected ? "Copied the selection as PNG" : "Copied as PNG")
        }
    }

    static let copyTitle = "Copy as PNG"
}

/// A canvas's name, in the toolbar after where it is: click it to rename, Return or a click away
/// keeps it, Escape puts it back. A canvas has no text for a title line, so this is where it's
/// named (Emil, 13 November 2026: "there is no way to name the canvas").
struct CanvasTitleField: View {
    let note: Note
    @State private var text = ""
    @FocusState private var focused: Bool

    var body: some View {
        // Sized to what's typed, from a hidden copy of it.
        Text(text.isEmpty ? CanvasNote.title : text)
            .font(.system(size: 13, weight: .semibold))
            .lineLimit(1)
            .padding(.horizontal, 6)
            .hidden()
            .frame(minWidth: 60, maxWidth: 280)
            .overlay {
                TextField(CanvasNote.title, text: $text)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13, weight: .semibold))
                    .padding(.horizontal, 6)
                    .focused($focused)
                    .onSubmit { commit() }
                    .onExitCommand { text = note.title; focused = false }
                    .help("Rename")
                    .accessibilityLabel("Whiteboard name")
                    .accessibilityIdentifier("canvas.title")
            }
            .frame(height: 24)
            .background(focused ? Color.primary.opacity(0.07) : .clear, in: .rect(cornerRadius: 6))
            .onAppear { text = note.title }
            .onChange(of: note.id) { _, _ in text = note.title }
            .onChange(of: note.title) { _, t in if !focused { text = t } }
            .onChange(of: focused) { _, now in if !now { commit() } }
    }

    private func commit() {
        if let t = Self.renamed(note, to: text) { text = t } else { text = note.title }
    }

    /// Renames a canvas: its text is its title, one line. Nil when there's nothing to change.
    @MainActor @discardableResult
    static func renamed(_ note: Note, to typed: String) -> String? {
        let t = typed.components(separatedBy: .newlines).joined(separator: " ").trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty, t != note.title, !note.isLocked else { return nil }
        note.body = t
        note.touch()
        return t
    }
}
#endif
