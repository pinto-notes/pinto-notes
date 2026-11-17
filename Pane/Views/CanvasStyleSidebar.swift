import SwiftUI

#if os(macOS)
/// The style of what's selected, or of what's drawn next: a calm panel at the board's top left,
/// where Excalidraw keeps its properties (Emil, 16 November 2026: a style panel that's always
/// there). It folds to its title. With nothing selected it sets how the next shape is drawn; with
/// a drawing tool picked, that tool's.
struct CanvasStyleSidebar: View {
    let canvas: CanvasController
    /// Folded at first, to its title in the corner: open, it covered the drawing's left side on
    /// every board. Once opened it stays open.
    @AppStorage(CanvasStyleSidebar.openKey) private var open = false
    @Environment(\.colorScheme) private var scheme

    static let openKey = "canvas.stylePanel.open"
    static let title = "Style"
    /// From the board's top left corner, as the zoom is from its bottom right.
    static let inset: CGFloat = 12
    static let width: CGFloat = 216

    /// On a board you can draw on, unless it's presenting or showing its templates to start from
    /// (one thing at a time).
    static func shows(_ s: CanvasState, viewOnly: Bool) -> Bool { !viewOnly && s.present == nil && !CanvasStart.shows(s) }

    /// What it offers: the selection's style, a drawing tool's, or with neither, everything a new
    /// shape takes.
    struct Parts: Equatable {
        var stroke = false, fill = false, line = false, text = false, arrow = false
        /// What it sets is how the next shape is drawn.
        var next = false
    }

    static func parts(_ s: CanvasState) -> Parts {
        guard s.hasSelection || s.tool.draws else { return Parts(stroke: true, fill: true, line: true, text: true, next: true) }
        var p = Parts()
        p.stroke = s.showsStroke || s.showsText
        p.fill = s.showsFill
        p.line = s.showsStroke && s.tool != .freedraw || s.showsStroke && s.hasSelection
        p.text = s.showsText
        p.arrow = s.showsArrowheads
        return p
    }

    var body: some View {
        let parts = Self.parts(canvas.state)
        VStack(alignment: .leading, spacing: 0) {
            header(parts)
            if open {
                VStack(alignment: .leading, spacing: 12) { sections(parts) }
                    .padding(.horizontal, 12)
                    .padding(.top, 2)
                    .padding(.bottom, 12)
                    .transition(.opacity)
            }
        }
        .frame(width: open ? Self.width : nil, alignment: .leading)
        // Folded: its title's own width, not the board's.
        .fixedSize(horizontal: !open, vertical: false)
        // Solid, as the selection bar is: over a drawing, glass let the lines run through it.
        .background(Color.card, in: shape)
        .raised(in: shape)
        .animation(.easeOut(duration: 0.15), value: open)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Self.title)
        .accessibilityIdentifier("canvas.stylePanel")
    }

    private var shape: RoundedRectangle { RoundedRectangle(cornerRadius: Radius.lg, style: .continuous) }

    /// "Style", and what it's for; a click folds it away or opens it.
    private func header(_ parts: Parts) -> some View {
        Button { open.toggle() } label: {
            HStack(spacing: 6) {
                Text(Self.title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.ink)
                if open, parts.next {
                    Text("Next shape")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.muted)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.down")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Color.muted)
                    .rotationEffect(.degrees(open ? 180 : 0))
            }
            .padding(.horizontal, 12)
            .frame(height: 32)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        // The card's own corners: folded, the title is the whole card.
        .hoverHighlight(shape)
        .help(open ? "Hide Style" : "Show Style")
        .accessibilityLabel(open ? "Hide Style" : "Show Style")
        .accessibilityIdentifier("canvas.stylePanel.toggle")
    }

    @ViewBuilder
    private func sections(_ parts: Parts) -> some View {
        let state = canvas.state
        let dark = scheme == .dark
        if parts.stroke {
            section(state.showsText && !state.showsStroke ? "Text colour" : "Stroke") {
                swatches(CanvasStyle.strokes, current: state.strokeColor, key: .strokeColor, title: "Stroke colour", dark: dark)
            }
        }
        if parts.fill {
            section("Fill") {
                swatches(CanvasStyle.fills, current: state.mixedFill ? "mixed" : state.backgroundColor, key: .backgroundColor, title: "Fill colour", dark: dark)
            }
            if state.backgroundColor != "transparent" || parts.next {
                section("Fill style") {
                    choices(CanvasStyle.fillStyles, current: state.fillStyle, id: "fillStyle", set: { canvas.set(.fillStyle, .text($0)) }) { FillGlyph(style: $0) }
                }
            }
        }
        if parts.line {
            section("Stroke width") {
                choices(CanvasStyle.widths, current: state.strokeWidth, id: "width", set: { canvas.set(.strokeWidth, .number($0)) }) { w in
                    Capsule().fill(Color.ink).frame(width: 22, height: w == 1 ? 1.5 : w == 2 ? 2.5 : 4)
                }
            }
            section("Stroke style") {
                choices(CanvasStyle.strokeStyles, current: state.strokeStyle, id: "strokeStyle", set: { canvas.set(.strokeStyle, .text($0)) }) { LineGlyph(style: $0) }
            }
        } else if parts.stroke, state.showsStroke {
            // A pen's line: its width only.
            section("Stroke width") {
                choices(CanvasStyle.widths, current: state.strokeWidth, id: "width", set: { canvas.set(.strokeWidth, .number($0)) }) { w in
                    Capsule().fill(Color.ink).frame(width: 22, height: w == 1 ? 1.5 : w == 2 ? 2.5 : 4)
                }
            }
        }
        if parts.arrow {
            section("Arrow") {
                choices(CanvasStyle.arrowTypes.map { (name: $0.name, value: $0.value) }, current: state.arrowType, id: "arrowType", set: { canvas.set(.arrowType, .text($0)) }) { v in
                    Image(systemName: CanvasStyle.arrowTypes.first { $0.value == v }?.symbol ?? "arrow.up.right")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.ink)
                }
            }
        }
        if parts.text {
            section("Font") {
                Picker("Font", selection: Binding(get: { state.fontFamily }, set: { canvas.set(.fontFamily, .number(Double($0))) })) {
                    ForEach(CanvasStyle.fonts, id: \.value) { Text($0.name).tag($0.value) }
                }
                .labelsHidden()
                .pickerStyle(.menu)
                .fixedSize()
                .accessibilityIdentifier("canvas.stylePanel.font")
            }
            section("Text size") {
                Picker("Text size", selection: Binding(get: { state.fontSize }, set: { canvas.set(.fontSize, .number($0)) })) {
                    ForEach(CanvasStyle.fontSizes, id: \.value) { Text($0.name).tag($0.value) }
                }
                .labelsHidden()
                .pickerStyle(.segmented)
                .accessibilityIdentifier("canvas.stylePanel.textSize")
            }
        }
        section("Opacity") {
            HStack(spacing: 8) {
                Slider(value: Binding(get: { state.opacity }, set: { canvas.set(.opacity, .number(($0 / 10).rounded() * 10)) }), in: 0...100, step: 10)
                    .controlSize(.small)
                    .accessibilityLabel("Opacity")
                    .accessibilityIdentifier("canvas.stylePanel.opacity")
                Text("\(Int(state.opacity.rounded()))%")
                    .font(.system(size: 11).monospacedDigit())
                    .foregroundStyle(Color.muted)
                    .frame(width: 34, alignment: .trailing)
            }
        }
    }

    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(Color.muted)
            content()
        }
    }

    /// The palette and any other colour, the one in use ringed.
    private func swatches(_ list: [CanvasStyle.Swatch], current: String, key: CanvasCommand.StyleKey, title: String, dark: Bool) -> some View {
        HStack(spacing: 4) {
            ForEach(list) { s in
                let on = current.lowercased() == s.hex
                Button { canvas.set(key, .text(s.hex)) } label: {
                    CanvasSelectionBar.fillSwatch(s.hex, dark: dark, size: 20)
                        .padding(2)
                        .overlay(Circle().strokeBorder(Color.ink, lineWidth: on ? 2 : 0))
                }
                .buttonStyle(CanvasPressStyle())
                .help(s.name)
                .accessibilityLabel(s.name)
                .accessibilityAddTraits(on ? .isSelected : [])
            }
            CanvasColorWell(title: title, color: CanvasStyle.shown(current, dark: dark) ?? .clear) { canvas.set(key, .text(CanvasStyle.hex($0, dark: dark))) }
        }
    }

    /// A few choices side by side, the one in use in a soft well, each drawn as what it makes.
    private func choices<V: Equatable, G: View>(_ options: [(name: String, value: V)], current: V, id: String, set: @escaping (V) -> Void,
                                                 @ViewBuilder glyph: @escaping (V) -> G) -> some View {
        let well = RoundedRectangle(cornerRadius: 7, style: .continuous)
        return HStack(spacing: 4) {
            ForEach(options.indices, id: \.self) { i in
                let o = options[i], on = o.value == current
                Button { set(o.value) } label: {
                    glyph(o.value)
                        .frame(width: 40, height: 28)
                        .background(on ? Color.soft : .clear, in: well)
                        .contentShape(well)
                }
                .buttonStyle(.plain)
                .hoverHighlight(well)
                .help(o.name)
                .accessibilityLabel(o.name)
                .accessibilityAddTraits(on ? .isSelected : [])
                .accessibilityIdentifier("canvas.stylePanel.\(id).\(i)")
            }
        }
    }

    /// Solid, dashed or dotted, as a line.
    private struct LineGlyph: View {
        let style: String
        var body: some View {
            Canvas { ctx, size in
                var p = Path()
                p.move(to: CGPoint(x: 1, y: size.height / 2))
                p.addLine(to: CGPoint(x: size.width - 1, y: size.height / 2))
                let dash: [CGFloat] = style == "dashed" ? [5, 3.5] : style == "dotted" ? [0.01, 4] : []
                ctx.stroke(p, with: .color(Color.ink), style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: dash))
            }
            .frame(width: 24, height: 6)
            .accessibilityHidden(true)
        }
    }

    /// Hatched, cross-hatched or solid, as a small filled square.
    private struct FillGlyph: View {
        let style: String
        var body: some View {
            Canvas { ctx, size in
                let r = CGRect(origin: .zero, size: size).insetBy(dx: 1, dy: 1)
                let box = Path(roundedRect: r, cornerRadius: 3)
                if style == "solid" {
                    ctx.fill(box, with: .color(Color.ink.opacity(0.85)))
                } else {
                    var hatch = Path()
                    for x in stride(from: -r.height, through: r.width, by: 4) {
                        hatch.move(to: CGPoint(x: r.minX + x, y: r.maxY))
                        hatch.addLine(to: CGPoint(x: r.minX + x + r.height, y: r.minY))
                        if style == "cross-hatch" {
                            hatch.move(to: CGPoint(x: r.minX + x, y: r.minY))
                            hatch.addLine(to: CGPoint(x: r.minX + x + r.height, y: r.maxY))
                        }
                    }
                    ctx.drawLayer { layer in
                        layer.clip(to: box)
                        layer.stroke(hatch, with: .color(Color.ink), lineWidth: 1)
                    }
                }
                ctx.stroke(box, with: .color(Color.ink), lineWidth: 1.2)
            }
            .frame(width: 18, height: 14)
            .accessibilityHidden(true)
        }
    }
}

#endif

/// Something's drawn and none of it is in view: back to all of it, as Excalidraw's "Scroll back
/// to content" (Emil, 16 November 2026).
struct CanvasBackToContent: View {
    let canvas: CanvasController
    static let title = "Back to content"

    var body: some View {
        Button { canvas.run(.zoomToFit) } label: {
            Text(Self.title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Color.ink)
                .padding(.horizontal, 14)
                .frame(minHeight: 32)
                #if os(iOS)
                .frame(minHeight: 44)
                #endif
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .background(Color.card, in: Capsule())
        .hoverHighlight(Capsule())
        .raised(in: Capsule())
        #if os(macOS)
        .help("Show all that's drawn")
        #endif
        .accessibilityIdentifier("canvas.backToContent")
    }
}
