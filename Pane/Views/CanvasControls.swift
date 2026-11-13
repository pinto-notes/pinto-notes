import SwiftUI

/// A canvas's own controls, over the drawing (direction B, "Dock", 13 November 2026):
/// - one floating dock centred at the foot: Undo and Redo, then the tools (Mac); the tools and the
///   style (iPhone, where Undo and Redo are in the navigation bar);
/// - a small bar floating just above the selection, for its colours, stroke, layer and the rest;
/// - the zoom, quiet at the bottom right (Mac), with − and + under the pointer.
/// All of it native; the drawing itself is the only web part (CanvasBridge).
struct CanvasOverlay: View {
    let canvas: CanvasController

    var body: some View {
        ZStack {
            if canvas.connected {
                // Measured over the whole page, as the page measures the selection: on iPhone the
                // canvas runs under the bars, and inside the safe area the bar came out a band too
                // low, under the shape (the iPhone pictures, 13 November 2026).
                GeometryReader { geo in
                    if canvas.state.showsSelectionBar, let bounds = canvas.state.bounds {
                        CanvasSelectionBar(canvas: canvas, bounds: bounds, area: geo.size)
                    }
                }
                #if os(iOS)
                .ignoresSafeArea()
                #endif
                VStack(spacing: 0) {
                    Spacer(minLength: 0)
                    #if os(macOS)
                    // The tools are in the window's toolbar, where a note's are (Emil, 13 November
                    // 2026: "why can't it be at the top like it is for notes"). The zoom stays here.
                    HStack {
                        Spacer(minLength: 0)
                        CanvasZoom(canvas: canvas)
                    }
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
    static let gap: CGFloat = 6
    #endif

    /// Its centre: above the selection, or below it with no room above, kept inside the canvas.
    static func position(bounds: CGRect, bar: CGSize, area: CGSize, margin: CGFloat = 8) -> CGPoint {
        var y = bounds.minY - gap - bar.height / 2
        if y - bar.height / 2 < margin { y = bounds.maxY + gap + bar.height / 2 }
        let x = min(max(bounds.midX, margin + bar.width / 2), max(area.width - margin - bar.width / 2, margin + bar.width / 2))
        y = min(max(y, margin + bar.height / 2), max(area.height - margin - bar.height / 2, margin + bar.height / 2))
        return CGPoint(x: x, y: y)
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
                    chip(.fill) { fillSwatch(state.backgroundColor, dark: dark, size: 18) }
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
                menuButton("Arrange", symbol: "square.3.layers.3d", id: "canvas.bar.layer") {
                    Button("Bring to Front", systemImage: "square.3.layers.3d.top.filled") { canvas.run(.bringToFront) }
                    Button("Bring Forward", systemImage: "arrow.up") { canvas.run(.bringForward) }
                    Button("Send Backward", systemImage: "arrow.down") { canvas.run(.sendBackward) }
                    Button("Send to Back", systemImage: "square.3.layers.3d.bottom.filled") { canvas.run(.sendToBack) }
                }
                menuButton("More", symbol: "ellipsis", id: "canvas.bar.more") { CanvasMoreItems(canvas: canvas) }
            }
            .padding(4)
            .glassEffect(.regular, in: .capsule)
        }
        .fixedSize()
        .onGeometryChange(for: CGSize.self) { $0.size } action: { size = $0 }
        .position(Self.position(bounds: bounds, bar: size, area: area))
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
        .glassEffect(.regular, in: .capsule)
        .accessibilityIdentifier("canvas.tray")
    }

    @ViewBuilder
    private func fillSwatch(_ hex: String, dark: Bool, size: CGFloat) -> some View {
        if hex == "transparent" {
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
struct CanvasToolbarTools: View {
    let canvas: CanvasController

    static let tools: [CanvasTool] = [.selection, .hand, .freedraw, .arrow, .text, .eraser]

    var body: some View {
        let current = canvas.state.tool
        Group {
            tool(.selection, current)
            tool(.hand, current)
            tool(.freedraw, current)
            shapes(current)
            tool(.arrow, current)
            tool(.text, current)
            tool(.eraser, current)
        }
        .disabled(!canvas.connected)
    }

    private func tool(_ t: CanvasTool, _ current: CanvasTool) -> some View {
        Button { canvas.pick(t) } label: {
            Label(t.title, systemImage: t.symbol).foregroundStyle(t == current ? Color.amberInk : Color.primary)
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
        } label: {
            Label("Shapes", systemImage: shown.symbol).foregroundStyle(picked ? Color.amberInk : Color.primary)
        } primaryAction: {
            canvas.pick(shown)
        }
        .menuIndicator(.hidden)
        .help("\(shown.help), more shapes on a long press")
        .accessibilityAddTraits(picked ? .isSelected : [])
        .accessibilityIdentifier("canvas.tool.shapes")
    }

    /// The shape the button draws when pressed: the last one picked from its menu.
    nonisolated(unsafe) static var lastShape: CanvasTool = .rectangle
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
            }
            .frame(height: 24)
            .background(focused ? Color.primary.opacity(0.07) : .clear, in: .rect(cornerRadius: 6))
            .onAppear { text = note.title }
            .onChange(of: note.id) { _, _ in text = note.title }
            .onChange(of: note.title) { _, t in if !focused { text = t } }
            .onChange(of: focused) { _, now in if !now { commit() } }
            .help("Rename")
            .accessibilityLabel("Whiteboard name")
            .accessibilityIdentifier("canvas.title")
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
