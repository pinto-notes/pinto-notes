import SwiftUI
import WebKit

#if os(macOS)
/// The style of what's selected, or of what's drawn next, and what to do with the selection:
/// always there at the board's left, under the tools, as Excalidraw's properties are (Emil, 16 and
/// 17 November 2026: a style panel that's always there; "I prefer just having the style menu" to a
/// bar over the selection). Only the sections that apply show. On a wide board (Full Screen) it's
/// Excalidraw's full panel, one section under another; on a narrower one, Excalidraw's compact
/// strip, a button for each section that opens it beside the strip. Nothing to fold, no title.
struct CanvasStyleSidebar: View {
    let canvas: CanvasController
    var layout: Layout = .wide
    /// The most it can be tall: a taller panel scrolls.
    var height: CGFloat = 800
    @Environment(\.colorScheme) private var scheme
    /// What's open beside the panel.
    @State private var open: Card?
    /// Where each opener's top is, in the panel.
    @State private var tops: [Card: CGFloat] = [:]
    @State private var cardHeight: CGFloat = 0

    /// A strip button's section, or Excalidraw's picker for the colour in use. It opens beside the
    /// panel, never over the tools (real-window check, 17 Nov: the system popover, centred on its
    /// button, covered the left half of the tools' palette).
    enum Card: Hashable { case pop(Pop), picker(CanvasCommand.StyleKey) }
    static let space = "canvas.stylePanel"
    /// Between the panel and what opens beside it.
    static let cardGap: CGFloat = 8

    /// The top of what opens beside the panel, in the panel (whose top is under the tools): at its
    /// opener's top, moved up only as far as it must to end inside `room`, never above the panel's top.
    static func cardTop(opener: CGFloat, card: CGFloat, room: CGFloat) -> CGFloat {
        max(0, min(opener, room - card))
    }

    enum Layout: Equatable, Sendable { case wide, compact }

    /// The panel's fold was kept under this name until 17 November 2026. It no longer folds;
    /// RenamedDefaults still moves the old dotted name.
    static let openKey = "canvasStylePanelOpen"
    static let title = "Style"
    /// From the board's left edge, as the zoom is from its right.
    static let inset: CGFloat = 12
    static let width: CGFloat = 216
    /// The compact strip: a cell and its padding, as the tools' palette is tall.
    static var strip: CGFloat { CanvasToolPalette.height }
    /// A board this wide gets the full panel (Full Screen at 1400 pt does; beside the sidebar and
    /// the list, the strip).
    static let wideFrom: CGFloat = 1100

    /// Kept clear at the foot: the zoom's bar, and the map over it while it's on.
    static func foot(map: Bool) -> CGFloat { map ? CGFloat(CanvasMap.bottom) + CanvasMap.size.height + 8 : 64 }

    static func layout(board: CGFloat) -> Layout { board >= wideFrom ? .wide : .compact }
    static func panelWidth(_ layout: Layout) -> CGFloat { layout == .wide ? width : strip }

    /// On a board you can draw on, unless it's presenting or showing its templates to start from
    /// (one thing at a time).
    static func shows(_ s: CanvasState, viewOnly: Bool) -> Bool { !viewOnly && s.present == nil && !CanvasStart.shows(s) }

    /// The sections that apply.
    struct Parts: Equatable {
        var stroke = false, fill = false, fillStyle = false, width = false, line = false, arrow = false, text = false
        var opacity = true
        /// What's selected: its layer, its line-up with the rest, its template's next part, and
        /// what to do with it.
        var layers = false, align = false, template = false, actions = false
        /// What it sets is how the next shape is drawn.
        var next = false
    }

    static func parts(_ s: CanvasState) -> Parts {
        var p = Parts()
        if s.cropping {
            p.opacity = false
            p.actions = true
            return p
        }
        guard s.hasSelection || s.tool.draws else {
            p.stroke = true; p.fill = true; p.fillStyle = true; p.width = true; p.line = true; p.text = true; p.next = true
            return p
        }
        p.stroke = s.showsStroke || s.showsText
        p.fill = s.showsFill
        p.fillStyle = s.showsFill && s.backgroundColor != "transparent"
        p.width = s.showsStroke
        // A pen's line: its width only.
        p.line = s.showsStroke && (s.tool != .freedraw || s.hasSelection)
        p.text = s.showsText
        p.arrow = s.showsArrowheads
        p.layers = s.hasSelection
        p.align = s.hasSelection && s.showsAlign
        p.template = s.hasSelection && s.grows != nil
        p.actions = s.hasSelection
        return p
    }

    /// The compact strip's buttons, each a section or two in a card beside the strip.
    enum Pop: String, CaseIterable, Identifiable {
        case stroke, fill, lines, arrow, text, opacity, arrange, actions
        var id: String { rawValue }
        var title: String {
            switch self {
            case .stroke: "Stroke"
            case .fill: "Background"
            case .lines: "Stroke width and style"
            case .arrow: "Arrows"
            case .text: "Text"
            case .opacity: "Opacity"
            case .arrange: "Layers and align"
            case .actions: "Actions"
            }
        }
        var symbol: String {
            switch self {
            case .stroke, .fill: ""
            case .lines: "line.3.horizontal"
            case .arrow: "arrow.up.right"
            case .text: "textformat"
            case .opacity: "circle.lefthalf.filled"
            case .arrange: "square.3.layers.3d"
            case .actions: "ellipsis"
            }
        }
        func shows(_ p: Parts) -> Bool {
            switch self {
            case .stroke: p.stroke
            case .fill: p.fill
            case .lines: p.width || p.line || p.fillStyle
            case .arrow: p.arrow
            case .text: p.text
            case .opacity: p.opacity
            case .arrange: p.layers || p.align
            case .actions: p.template || p.actions
            }
        }
    }

    var body: some View {
        let parts = Self.parts(canvas.state)
        Group {
            switch layout {
            case .wide: wide(parts)
            case .compact: compact(parts)
            }
        }
        .coordinateSpace(.named(Self.space))
        // Solid: over a drawing, glass let the lines run through it.
        .background(Color.card, in: shape)
        .raised(in: shape)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Self.title)
        .accessibilityIdentifier("canvas.stylePanel")
        .overlay(alignment: .topLeading) {
            if let open {
                card(open)
                    .onGeometryChange(for: CGFloat.self, of: \.size.height) { cardHeight = $0 }
                    .offset(x: Self.panelWidth(layout) + Self.cardGap,
                            y: Self.cardTop(opener: tops[open] ?? 0, card: cardHeight, room: height))
                    .transition(.opacity)
            }
        }
        .animation(.easeOut(duration: 0.12), value: open)
        // Closed by what changes under it, as a popover was.
        .onChange(of: canvas.state.selection) { _, _ in close() }
        .onChange(of: canvas.state.tool) { _, _ in close() }
        .onChange(of: layout) { _, _ in close() }
    }

    private func toggle(_ c: Card) {
        if open == c { close() } else { open = c }
    }

    /// Closes what's open beside the panel; the keys go back to the board (the picker had them).
    private func close() {
        guard open != nil else { return }
        open = nil
        canvas.focusPage()
    }

    /// Records an opener's top, for its card.
    private func opener(_ c: Card) -> some ViewModifier { OpenerTop(card: c, tops: $tops) }

    private struct OpenerTop: ViewModifier {
        let card: Card
        @Binding var tops: [Card: CGFloat]
        func body(content: Content) -> some View {
            let space = CanvasStyleSidebar.space
            content.onGeometryChange(for: CGFloat.self, of: { $0.frame(in: .named(space)).minY }) { tops[card] = $0 }
        }
    }

    /// What opens beside the panel: solid, raised, as the panel is. Escape or a click on the board
    /// closes it.
    private func card(_ c: Card) -> some View {
        let state = canvas.state
        let shape = RoundedRectangle(cornerRadius: Radius.lg, style: .continuous)
        return Group {
            switch c {
            case .pop(let pop): sectionCard(pop)
            case .picker(let key):
                CanvasColorPicker(canvas: canvas, key: key, current: key == .strokeColor ? state.strokeColor : state.mixedFill ? "mixed" : state.backgroundColor)
                    .padding(12)
            }
        }
        .fixedSize()
        .background(Color.card, in: shape)
        .raised(in: shape)
        .background(CanvasCardWatch(close: close))
        .onExitCommand(perform: close)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("canvas.stylePanel.card")
    }

    private var shape: RoundedRectangle { RoundedRectangle(cornerRadius: Radius.lg, style: .continuous) }

    // MARK: Wide

    private func wide(_ parts: Parts) -> some View {
        let stack = VStack(alignment: .leading, spacing: 12) { sections(parts) }
            .padding(12)
            .frame(width: Self.width, alignment: .leading)
        return ViewThatFits(in: .vertical) {
            stack
            ScrollView(.vertical) { stack }.frame(width: Self.width, height: max(120, height))
        }
    }

    @ViewBuilder
    private func sections(_ parts: Parts) -> some View {
        let state = canvas.state
        let dark = scheme == .dark
        if parts.stroke {
            section(state.showsText && !state.showsStroke ? "Text colour" : "Stroke") {
                quickColors(CanvasStyle.strokes, current: state.strokeColor, key: .strokeColor, dark: dark)
            }
        }
        if parts.fill {
            section("Background") {
                quickColors(CanvasStyle.fills, current: state.mixedFill ? "mixed" : state.backgroundColor, key: .backgroundColor, dark: dark)
            }
        }
        lineSections(parts)
        if parts.arrow { arrowSections() }
        if parts.text { textSections() }
        if parts.opacity { opacitySection() }
        if parts.layers { layersSection() }
        if parts.align { alignSection() }
        if parts.template { templateSection() }
        if parts.actions { actionsSection() }
    }

    @ViewBuilder private func lineSections(_ parts: Parts) -> some View {
        let state = canvas.state
        if parts.fillStyle {
            section("Fill") {
                choices(CanvasStyle.fillStyles, current: state.fillStyle, id: "fillStyle", set: { canvas.set(.fillStyle, .text($0)) }) { FillGlyph(style: $0) }
            }
        }
        if parts.width {
            section("Stroke width") {
                choices(CanvasStyle.widths, current: state.strokeWidth, id: "width", set: { canvas.set(.strokeWidth, .number($0)) }) { w in
                    Capsule().fill(Color.ink).frame(width: 22, height: w == 1 ? 1.5 : w == 2 ? 2.5 : 4)
                }
            }
        }
        if parts.line {
            section("Stroke style") {
                choices(CanvasStyle.strokeStyles, current: state.strokeStyle, id: "strokeStyle", set: { canvas.set(.strokeStyle, .text($0)) }) { LineGlyph(style: $0) }
            }
        }
    }

    @ViewBuilder private func arrowSections() -> some View {
        let state = canvas.state
        section("Arrow type") {
            choices(CanvasStyle.arrowTypes.map { (name: $0.name, value: $0.value) }, current: state.arrowType, id: "arrowType", set: { canvas.set(.arrowType, .text($0)) }) { v in
                Image(systemName: CanvasStyle.arrowTypes.first { $0.value == v }?.symbol ?? "arrow.up.right")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.ink)
            }
        }
        section("Arrowheads") {
            Grid(alignment: .leading, horizontalSpacing: 8, verticalSpacing: 4) {
                GridRow {
                    Text("Start").font(.system(size: 11)).foregroundStyle(Color.muted)
                    Picker("Start", selection: Binding(get: { state.startArrowhead ?? "" }, set: { canvas.set(.startArrowhead, $0.isEmpty ? .none : .text($0)) })) {
                        ForEach(CanvasStyle.arrowheads, id: \.name) { Text($0.name).tag($0.value ?? "") }
                    }
                    .accessibilityIdentifier("canvas.stylePanel.startArrowhead")
                }
                GridRow {
                    Text("End").font(.system(size: 11)).foregroundStyle(Color.muted)
                    Picker("End", selection: Binding(get: { state.endArrowhead ?? "" }, set: { canvas.set(.endArrowhead, $0.isEmpty ? .none : .text($0)) })) {
                        ForEach(CanvasStyle.arrowheads, id: \.name) { Text($0.name).tag($0.value ?? "") }
                    }
                    .accessibilityIdentifier("canvas.stylePanel.endArrowhead")
                }
            }
            .labelsHidden()
            .pickerStyle(.menu)
            .controlSize(.small)
            .fixedSize()
        }
    }

    @ViewBuilder private func textSections() -> some View {
        let state = canvas.state
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

    private func opacitySection() -> some View {
        let state = canvas.state
        return section("Opacity") {
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

    /// Excalidraw's Layers: to the back, back one, forward one, to the front.
    static let layers: [(title: String, symbol: String, action: CanvasCommand.Action)] = [
        ("Send to Back", "square.3.layers.3d.bottom.filled", .sendToBack), ("Send Backward", "square.2.layers.3d.bottom.filled", .sendBackward),
        ("Bring Forward", "square.2.layers.3d.top.filled", .bringForward), ("Bring to Front", "square.3.layers.3d.top.filled", .bringToFront),
    ]

    private func layersSection() -> some View {
        section("Layers") {
            HStack(spacing: 4) {
                ForEach(Self.layers, id: \.title) { l in
                    iconButton(l.title, symbol: l.symbol, id: "canvas.stylePanel.layer.\(l.action.rawValue)") { canvas.run(l.action) }
                }
            }
        }
    }

    static let alignTitle = "Align"
    /// The right-click menu's name for the cropping's Done.
    static let doneCroppingTitle = "Done Cropping"

    typealias AlignItem = (title: String, symbol: String, action: CanvasCommand.Action)

    /// Lined up along an edge or a middle; three or more, spaced evenly too. The right-click
    /// menu's order.
    static func aligns(_ count: Int) -> [AlignItem] {
        let rows = alignRows(count)
        return Array(rows[0].prefix(3) + rows[1].prefix(3) + rows[0].dropFirst(3) + rows[1].dropFirst(3))
    }

    /// The panel's, as Excalidraw's: across in a row (left, centre, right, then spaced evenly
    /// across for three or more), down in the next.
    static func alignRows(_ count: Int) -> [[AlignItem]] {
        let spaced = count >= 3
        return [
            [("Align Left", "align.horizontal.left", .alignLeft), ("Align Centre", "align.horizontal.center", .alignCenter), ("Align Right", "align.horizontal.right", .alignRight)]
                + (spaced ? [("Space Evenly Across", "distribute.horizontal.center", .distributeHorizontally)] : []),
            [("Align Top", "align.vertical.top", .alignTop), ("Align Middle", "align.vertical.center", .alignMiddle), ("Align Bottom", "align.vertical.bottom", .alignBottom)]
                + (spaced ? [("Space Evenly Down", "distribute.vertical.center", .distributeVertically)] : []),
        ]
    }

    private func alignSection() -> some View {
        section(Self.alignTitle) {
            VStack(alignment: .leading, spacing: 4) {
                ForEach(Array(Self.alignRows(canvas.state.alignCount).enumerated()), id: \.offset) { _, row in
                    HStack(spacing: 4) {
                        ForEach(row, id: \.title) { a in
                            iconButton(a.title, symbol: a.symbol, id: "canvas.stylePanel.align.\(a.action.rawValue)") { canvas.run(a.action) }
                        }
                    }
                }
            }
        }
    }

    /// A Kanban or Retro column, a Timeline step, a person on an org chart: the next of its kind
    /// (Tab too).
    @ViewBuilder private func templateSection() -> some View {
        if let grows = canvas.state.grows {
            section("Template") {
                Button { canvas.send(.grow) } label: {
                    Label(grows.title, systemImage: grows.symbol)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.ink)
                        .padding(.horizontal, 10)
                        .frame(height: 28)
                        .contentShape(Capsule())
                }
                .buttonStyle(.plain)
                .background(Color.soft, in: Capsule())
                .hoverHighlight(Capsule())
                .help("\(grows.title) (Tab)")
                .accessibilityIdentifier("canvas.stylePanel.grow")
            }
        }
    }

    /// What to do with what's selected: everything the bar over the selection held.
    struct Action: Identifiable {
        let id: String
        let title: String
        let symbol: String
        var destructive = false
        let run: () -> Void
    }

    static func actions(_ canvas: CanvasController) -> [Action] {
        let s = canvas.state
        if s.cropping { return [Action(id: "cropDone", title: CanvasSelectionBar.doneCropping, symbol: "checkmark") { canvas.send(.cropDone) }] }
        var out: [Action] = []
        out.append(Action(id: "duplicate", title: "Duplicate", symbol: "plus.square.on.square") { canvas.run(.duplicate) })
        out.append(Action(id: "delete", title: "Delete", symbol: "trash", destructive: true) { canvas.run(.delete) })
        if canvas.canComment, !canvas.viewOnly {
            out.append(Action(id: "comment", title: BoardCommentUI.comment, symbol: "plus.bubble") { canvas.comment() })
        }
        if s.selection == ["image"] { out.append(Action(id: "crop", title: CanvasSelectionBar.crop, symbol: "crop") { canvas.run(.crop) }) }
        if let card = s.card {
            if canvas.restorable.contains(card.note) {
                out.append(Action(id: "restoreNote", title: CanvasSelectionBar.restoreNote, symbol: "arrow.uturn.backward") { canvas.restoreCard(card.note) })
            } else {
                out.append(Action(id: "openNote", title: CanvasSelectionBar.openNote, symbol: "doc.text") { canvas.openCard(card.note) })
            }
        }
        out.append(Action(id: "saveToLibrary", title: CanvasLibraryPopover.saveTitle, symbol: CanvasLibraryPopover.symbol) { Task { await canvas.saveSelectionToLibrary() } })
        out.append(Action(id: "saveTemplate", title: NoteMoreMenu.saveTemplateTitle, symbol: "square.on.square.dashed") { canvas.askTemplateName(.selection) })
        if s.inFrame { out.append(Action(id: "presentFromHere", title: CanvasPresentOrder.fromHere, symbol: "play.rectangle") { canvas.send(.presentFrom(nil)) }) }
        return out
    }

    private func actionsSection() -> some View {
        section("Actions") {
            grid(Self.actions(canvas).map { a in
                AnyView(iconButton(a.title, symbol: a.symbol, id: "canvas.stylePanel.action.\(a.id)", tint: a.destructive ? .red : nil, action: a.run))
            })
        }
    }

    // MARK: Compact

    private func compact(_ parts: Parts) -> some View {
        let dark = scheme == .dark
        let state = canvas.state
        let shown = Pop.allCases.filter { $0.shows(parts) }
        return VStack(spacing: 2) {
            ForEach(shown) { pop in
                if pop == .arrange, shown.first != .arrange {
                    Rectangle().fill(Color.primary.opacity(0.12)).frame(width: CanvasToolPalette.cell - 12, height: 1).padding(.vertical, 4)
                        .accessibilityHidden(true)
                }
                stripButton(pop, state: state, dark: dark)
            }
        }
        .padding(5)
        .frame(width: Self.strip)
    }

    private func stripButton(_ pop: Pop, state: CanvasState, dark: Bool) -> some View {
        Button { toggle(.pop(pop)) } label: {
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous).fill(open == .pop(pop) ? Color.soft : .clear)
                switch pop {
                case .stroke:
                    Circle().fill(CanvasStyle.shown(state.strokeColor, dark: dark) ?? .primary).frame(width: 18, height: 18)
                        .overlay(Circle().strokeBorder(Color.primary.opacity(0.15), lineWidth: 1))
                case .fill:
                    CanvasSelectionBar.fillSwatch(state.mixedFill ? "mixed" : state.backgroundColor, dark: dark, size: 18)
                case .arrow:
                    Image(systemName: CanvasStyle.arrowTypes.first { $0.value == state.arrowType }?.symbol ?? pop.symbol).font(.system(size: 14))
                default:
                    Image(systemName: pop.symbol).font(.system(size: 14))
                }
            }
            .foregroundStyle(Color.primary.opacity(0.85))
            .frame(width: CanvasToolPalette.cell, height: CanvasToolPalette.cell)
            .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .hoverHighlight(RoundedRectangle(cornerRadius: 8, style: .continuous))
        .help(pop.title)
        .accessibilityLabel(pop.title)
        .accessibilityIdentifier("canvas.stylePanel.open.\(pop.rawValue)")
        .modifier(opener(.pop(pop)))
    }

    @ViewBuilder private func sectionCard(_ pop: Pop) -> some View {
        let parts = Self.parts(canvas.state)
        let state = canvas.state
        Group {
            switch pop {
            case .stroke: CanvasColorPicker(canvas: canvas, key: .strokeColor, current: state.strokeColor)
            case .fill: CanvasColorPicker(canvas: canvas, key: .backgroundColor, current: state.mixedFill ? "mixed" : state.backgroundColor)
            case .lines: VStack(alignment: .leading, spacing: 12) { lineSections(parts) }
            case .arrow: VStack(alignment: .leading, spacing: 12) { arrowSections() }
            case .text: VStack(alignment: .leading, spacing: 12) { textSections() }
            case .opacity: opacitySection().frame(width: 190)
            case .arrange:
                VStack(alignment: .leading, spacing: 12) {
                    if parts.layers { layersSection() }
                    if parts.align { alignSection() }
                }
            case .actions:
                VStack(alignment: .leading, spacing: 12) {
                    if parts.template { templateSection() }
                    if parts.actions { actionsSection() }
                }
            }
        }
        .padding(12)
        .tint(Color(PColor.paneAccent))
    }

    // MARK: Parts

    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(Color.muted)
            content()
        }
    }

    /// Five to a row.
    private func grid(_ items: [AnyView]) -> some View {
        LazyVGrid(columns: Array(repeating: GridItem(.fixed(CanvasToolPalette.cell), spacing: 4), count: 5), alignment: .leading, spacing: 4) {
            ForEach(items.indices, id: \.self) { items[$0] }
        }
    }

    private func iconButton(_ title: String, symbol: String, id: String, tint: Color? = nil, action: @escaping () -> Void) -> some View {
        let well = RoundedRectangle(cornerRadius: 7, style: .continuous)
        return Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 14))
                .foregroundStyle(tint ?? Color.ink)
                .frame(width: CanvasToolPalette.cell, height: 30)
                .background(Color.soft.opacity(0.6), in: well)
                .contentShape(well)
        }
        .buttonStyle(.plain)
        .hoverHighlight(well)
        .help(title)
        .accessibilityLabel(title)
        .accessibilityIdentifier(id)
    }

    /// The short palette, then the colour in use, which opens Excalidraw's picker.
    private func quickColors(_ list: [CanvasStyle.Swatch], current: String, key: CanvasCommand.StyleKey, dark: Bool) -> some View {
        HStack(spacing: 3) {
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
            Rectangle().fill(Color.primary.opacity(0.12)).frame(width: 1, height: 18).accessibilityHidden(true)
            CanvasColorButton(key: key, current: current, open: open == .picker(key)) { toggle(.picker(key)) }
                .modifier(opener(.picker(key)))
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

/// The colour in use, as a swatch: a click opens Excalidraw's picker for it, beside the panel.
struct CanvasColorButton: View {
    let key: CanvasCommand.StyleKey
    let current: String
    var open = false
    let action: () -> Void
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Button(action: action) {
            CanvasSelectionBar.fillSwatch(current, dark: scheme == .dark, size: 20)
                .padding(2)
                .overlay(RoundedRectangle(cornerRadius: 6, style: .continuous).strokeBorder(Color.primary.opacity(open ? 0.6 : 0.25), lineWidth: open ? 1.5 : 1).padding(-2))
        }
        .buttonStyle(CanvasPressStyle())
        .help(key == .strokeColor ? "Stroke colour" : "Background colour")
        .accessibilityLabel(key == .strokeColor ? "Stroke colour" : "Background colour")
        .accessibilityAddTraits(open ? .isSelected : [])
        .accessibilityIdentifier("canvas.stylePanel.picker.\(key.rawValue)")
    }
}

/// While a card is open beside the style panel: a click on the board, or Escape, closes it (the
/// click still reaches the board, as one outside a popover does). Takes no clicks of its own.
private struct CanvasCardWatch: NSViewRepresentable {
    let close: () -> Void

    func makeNSView(context: Context) -> Watch { Watch() }
    func updateNSView(_ v: Watch, context: Context) { v.close = close }

    final class Watch: NSView {
        var close: () -> Void = {}
        nonisolated(unsafe) private var monitor: Any?

        override func hitTest(_ point: NSPoint) -> NSView? { nil }

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            if let monitor { NSEvent.removeMonitor(monitor); self.monitor = nil }
            guard window != nil else { return }
            monitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown, .keyDown]) { [weak self] e in
                // Monitors run on the main thread.
                nonisolated(unsafe) let event = e
                MainActor.assumeIsolated { self?.saw(event) }
                return e
            }
        }

        /// Escape, or a click on the board: closed once the event has gone where it goes.
        private func saw(_ e: NSEvent) {
            guard let w = window, e.window === w else { return }
            guard e.type == .keyDown ? e.keyCode == 53 : Self.onBoard(e.locationInWindow, in: w) else { return }
            Task { @MainActor [weak self] in self?.close() }
        }

        /// Whether a point of the window lands on the board (its web view), not on anything over it.
        static func onBoard(_ p: NSPoint, in w: NSWindow) -> Bool {
            // A view's hitTest takes its superview's coordinates: the frame view's, from the window's.
            guard let root = w.contentView?.superview else { return false }
            var v = root.hitTest(root.convert(p, from: nil))
            while let x = v { if x is WKWebView { return true }; v = x.superview }
            return false
        }

        deinit { if let monitor { NSEvent.removeMonitor(monitor) } }
    }
}

/// Excalidraw's colour picker in the app's look: its fifteen colours in a grid of five by three,
/// each with its key (q w e r t, a s d f g, z x c v b); the five shades of the colour in use (⇧1
/// to ⇧5); and its hex code, with an eyedropper for a colour from anywhere on the screen.
struct CanvasColorPicker: View {
    let canvas: CanvasController
    let key: CanvasCommand.StyleKey
    let current: String
    @State private var hex = ""
    @FocusState private var focused: Bool
    /// Typing a hex code: its keys are the field's, not the grid's.
    @FocusState private var typing: Bool
    @Environment(\.colorScheme) private var scheme

    /// Excalidraw's palette (open-color, shades 0 2 4 6 8), in its grid's order.
    static let names = ["transparent", "white", "gray", "black", "bronze", "cyan", "blue", "violet", "grape", "pink",
                        "green", "teal", "yellow", "orange", "red"]
    static let keys = ["q", "w", "e", "r", "t", "a", "s", "d", "f", "g", "z", "x", "c", "v", "b"]
    static let shades: [String: [String]] = [
        "gray": ["#f8f9fa", "#e9ecef", "#ced4da", "#868e96", "#343a40"],
        "bronze": ["#f8f1ee", "#eaddd7", "#d2bab0", "#a18072", "#846358"],
        "cyan": ["#e3fafc", "#99e9f2", "#3bc9db", "#15aabf", "#0c8599"],
        "blue": ["#e7f5ff", "#a5d8ff", "#4dabf7", "#228be6", "#1971c2"],
        "violet": ["#f3f0ff", "#d0bfff", "#9775fa", "#7950f2", "#6741d9"],
        "grape": ["#f8f0fc", "#eebefa", "#da77f2", "#be4bdb", "#9c36b5"],
        "pink": ["#fff0f6", "#fcc2d7", "#f783ac", "#e64980", "#c2255c"],
        "green": ["#ebfbee", "#b2f2bb", "#69db7c", "#40c057", "#2f9e44"],
        "teal": ["#e6fcf5", "#96f2d7", "#38d9a9", "#12b886", "#099268"],
        "yellow": ["#fff9db", "#ffec99", "#ffd43b", "#fab005", "#f08c00"],
        "orange": ["#fff4e6", "#ffd8a8", "#ffa94d", "#fd7e14", "#e8590c"],
        "red": ["#fff5f5", "#ffc9c9", "#ff8787", "#fa5252", "#e03131"],
    ]
    static let single = ["transparent": "transparent", "white": "#ffffff", "black": "#1e1e1e"]

    /// The colour's name and shade in the palette, if it's one of them.
    static func place(_ hex: String) -> (name: String, shade: Int?)? {
        let h = hex.lowercased()
        if let n = single.first(where: { $0.value == h })?.key { return (n, nil) }
        for (n, list) in shades { if let i = list.firstIndex(of: h) { return (n, i) } }
        return nil
    }

    /// The shade the grid shows: the colour in use's, else Excalidraw's for strokes (the darkest)
    /// or backgrounds (the second lightest).
    static func activeShade(_ current: String, key: CanvasCommand.StyleKey) -> Int {
        place(current)?.shade ?? (key == .strokeColor ? 4 : 1)
    }

    /// The grid's colour at `index`, in this shade.
    static func color(_ index: Int, shade: Int) -> String {
        let n = names[index]
        return single[n] ?? shades[n]![shade]
    }

    /// The colour a key picks, as Excalidraw's picker takes it: a grid key (by the letter it
    /// types), or ⇧1 to ⇧5 for a shade of the colour in use (by the key itself, `digit` 0 to 4, as
    /// Excalidraw reads the key's code: ⇧2 types " on a Swedish keyboard). Nil: not the picker's.
    static func picked(_ characters: String, shift: Bool, digit: Int?, current: String, key: CanvasCommand.StyleKey) -> String? {
        if shift {
            guard let d = digit, (0..<5).contains(d), let n = place(current)?.name, let list = shades[n] else { return nil }
            return list[d]
        }
        guard let i = keys.firstIndex(of: characters.lowercased()) else { return nil }
        return color(i, shade: activeShade(current, key: key))
    }

    /// The number row's 1 to 5, by where the key is (kVK_ANSI_1 to kVK_ANSI_5, the same on every
    /// layout): 0 to 4.
    static func digit(keyCode: UInt16) -> Int? { [18: 0, 19: 1, 20: 2, 21: 3, 23: 4][keyCode] }

    var body: some View {
        let dark = scheme == .dark
        let shade = Self.activeShade(current, key: key)
        let here = Self.place(current)
        VStack(alignment: .leading, spacing: 10) {
            heading("Colours")
            LazyVGrid(columns: Array(repeating: GridItem(.fixed(28), spacing: 6), count: 5), alignment: .leading, spacing: 6) {
                ForEach(Self.names.indices, id: \.self) { i in
                    let value = Self.color(i, shade: shade)
                    swatch(value, label: Self.keys[i], on: here?.name == Self.names[i], dark: dark, id: "canvas.color.\(Self.names[i])")
                        .help("\(Self.names[i].capitalized) (\(Self.keys[i].uppercased()))")
                }
            }
            // Only a palette colour has shades: none to show for another (the board's ink), and no
            // heading over nothing (real-window check, 17 Nov).
            if let n = here?.name, let list = Self.shades[n] {
                VStack(alignment: .leading, spacing: 10) {
                    heading("Shades")
                    HStack(spacing: 6) {
                        ForEach(list.indices, id: \.self) { i in
                            swatch(list[i], label: "\u{21E7}\(i + 1)", on: here?.shade == i, dark: dark, id: "canvas.color.shade.\(i + 1)")
                                .help("\(n.capitalized), shade \(i + 1) (\u{21E7}\(i + 1))")
                        }
                    }
                }
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("canvas.color.shades")
            }
            heading("Hex code")
            HStack(spacing: 6) {
                HStack(spacing: 2) {
                    Text("#").foregroundStyle(Color.muted)
                    TextField("Hex code", text: $hex)
                        .textFieldStyle(.plain)
                        .font(.system(size: 12).monospaced())
                        .focused($typing)
                        .onSubmit(applyHex)
                        .accessibilityIdentifier("canvas.color.hex")
                }
                .padding(.horizontal, 8)
                .frame(height: 26)
                .background(Color.primary.opacity(0.06), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                Button {
                    NSColorSampler().show { picked in
                        guard let picked else { return }
                        // As the board stores it: in dark mode it shows its colours turned round.
                        let value = CanvasStyle.hex(Color(nsColor: picked), dark: dark)
                        Task { @MainActor in canvas.set(key, .text(value)) }
                    }
                } label: {
                    Image(systemName: "eyedropper").font(.system(size: 13)).frame(width: 28, height: 26).contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .hoverHighlight(RoundedRectangle(cornerRadius: 6, style: .continuous))
                .help("Pick a colour from the screen")
                .accessibilityLabel("Eyedropper")
                .accessibilityIdentifier("canvas.color.eyedropper")
            }
        }
        .frame(width: 5 * 28 + 4 * 6)
        .focusable()
        .focusEffectDisabled()
        .focused($focused)
        .onKeyPress(phases: .down) { press in
            let digit = NSApp.currentEvent.flatMap { $0.type == .keyDown ? Self.digit(keyCode: $0.keyCode) : nil }
            guard !typing, !press.modifiers.contains(.command), !press.modifiers.contains(.option),
                  let value = Self.picked(press.characters, shift: press.modifiers.contains(.shift), digit: digit, current: current, key: key) else { return .ignored }
            canvas.set(key, .text(value))
            return .handled
        }
        .onAppear {
            hex = Self.hexText(current)
            focused = true
        }
        .onChange(of: current) { _, now in hex = Self.hexText(now) }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("canvas.colorPicker")
    }

    static func hexText(_ value: String) -> String { value.hasPrefix("#") ? String(value.dropFirst()) : "" }

    private func applyHex() {
        let h = hex.trimmingCharacters(in: .whitespaces).lowercased().replacingOccurrences(of: "#", with: "")
        guard [3, 6].contains(h.count), h.allSatisfy(\.isHexDigit) else { hex = Self.hexText(current); return }
        canvas.set(key, .text("#" + h))
    }

    private func heading(_ title: String) -> some View {
        Text(title).font(.system(size: 11, weight: .medium)).foregroundStyle(Color.muted)
    }

    private func swatch(_ value: String, label: String, on: Bool, dark: Bool, id: String) -> some View {
        Button { canvas.set(key, .text(value)) } label: {
            Chip(value: value, label: label, dark: dark)
                .overlay(
                    RoundedRectangle(cornerRadius: Chip.radius + 3, style: .continuous)
                        .strokeBorder(Color.ink, lineWidth: on ? 2 : 0)
                        .padding(-3)
                )
        }
        .buttonStyle(CanvasPressStyle())
        .accessibilityLabel(id.components(separatedBy: ".").last ?? value)
        .accessibilityAddTraits(on ? .isSelected : [])
        .accessibilityIdentifier(id)
    }

    /// A colour in the grid: a rounded square, as Excalidraw's, with its key inside at the bottom
    /// right in black or white, whichever reads on it.
    struct Chip: View {
        let value: String
        let label: String
        let dark: Bool
        static let size: CGFloat = 28
        static let radius: CGFloat = 7
        /// The key's distance from the chip's edges.
        static let inset: CGFloat = 3.5

        var body: some View {
            let shape = RoundedRectangle(cornerRadius: Self.radius, style: .continuous)
            ZStack(alignment: .bottomTrailing) {
                if value == "transparent" {
                    shape.fill(Color.card)
                        .overlay(Rectangle().fill(Color.red).frame(width: 1.5, height: Self.size * 1.3).rotationEffect(.degrees(45)))
                        .clipShape(shape)
                } else {
                    shape.fill(CanvasStyle.shown(value, dark: dark) ?? .clear)
                }
                shape.strokeBorder(Color.line, lineWidth: 1)
                if !label.isEmpty {
                    Text(label)
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundStyle(CanvasColorPicker.readable(on: value, dark: dark))
                        .padding(.trailing, Self.inset)
                        .padding(.bottom, Self.inset - 1)
                        .accessibilityHidden(true)
                }
            }
            .frame(width: Self.size, height: Self.size)
        }
    }

    /// The key's letter on a swatch: dark on a light colour, light on a dark one.
    static func readable(on hex: String, dark: Bool) -> Color {
        guard var (r, g, b) = CanvasStyle.rgb(hex) else { return Color.primary.opacity(0.6) }
        if dark { (r, g, b) = CanvasStyle.throughDark(r, g, b) }
        let light = 0.299 * r + 0.587 * g + 0.114 * b
        return light > 0.6 ? Color.black.opacity(0.55) : Color.white.opacity(0.85)
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
