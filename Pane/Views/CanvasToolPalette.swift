import SwiftUI

#if os(macOS)
/// The board's tools in Excalidraw's order, with Excalidraw's keys (Emil, 17 November 2026:
/// "normally these buttons aren't toggles, but now they are, so that is messing with my brain"): in
/// the middle of the window's title row, as Excalidraw's one row, or with no room there floating at
/// the top middle of the board (BoardToolbar.Tools). Either way it's this palette, with its own
/// glass, never a row of toolbar toggles.
///
/// The lock, a line, the hand and the tools, a line, More. Each tool's letter sits in its corner and
/// its keys are in its help; the tool you have is a filled chip in the accent. Under it, the hint
/// Excalidraw shows for what you're doing (CanvasHint). It takes clicks on itself only: the board
/// beside and under it stays the board's.
struct CanvasToolPalette: View {
    let canvas: CanvasController
    /// What waits in More: on the board, what a narrow board has no room for; in the window's bar,
    /// the lock, the hand, the picture and the eraser when there's no room for them there.
    var fold: Fold = .board(1200)

    enum Fold: Equatable, Sendable {
        /// On a board this wide: the tools used least wait in More.
        case board(CGFloat)
        /// In the window's bar, with barFold in More or not.
        case bar(folded: Bool)
    }
    /// The pointer is on More (a menu's label hears no hover of its own).
    @State private var overMore = false

    /// One place on the palette.
    enum Item: Hashable, Identifiable, Sendable {
        case lock, tool(CanvasTool), sticky, image, more

        var id: String {
            switch self {
            case .lock: "lock"
            case .tool(let t): t.rawValue
            case .sticky: "sticky"
            case .image: "image"
            case .more: "more"
            }
        }

        /// The letter in its corner, as Excalidraw's toolbar shows its keys (none on the hand, the
        /// picture or the lock, whose keys aren't letters there either).
        var letter: String? {
            switch self {
            case .tool(let t): t == .hand ? nil : t.key
            case .sticky: "N"
            default: nil
            }
        }

        /// Its keys, as its help says them: the letter, then Excalidraw's number (1 to 0).
        var keys: [String] {
            switch self {
            case .lock: ["Q"]
            case .tool(let t): [t.key] + (CanvasToolPalette.numbers[t].map { [$0] } ?? [])
            case .sticky: ["N"]
            case .image: ["9"]
            case .more: []
            }
        }

        var title: String {
            switch self {
            case .lock: "Keep selected tool active after drawing"
            case .tool(let t): t.title
            case .sticky: "Sticky Note"
            case .image: "Insert Image"
            case .more: "More Tools"
            }
        }

        /// "Rectangle (R or 2)".
        var help: String { keys.isEmpty ? title : "\(title) (\(keys.joined(separator: " or ")))" }

        var symbol: String {
            switch self {
            case .lock: "lock.open"
            case .tool(let t): t.symbol
            case .sticky: "note.text"
            case .image: "photo"
            case .more: "ellipsis"
            }
        }

        var identifier: String { "canvas.tool.\(id)" }

        /// The tool it picks, for one that is a tool.
        var tool: CanvasTool? {
            if case .tool(let t) = self { t } else { nil }
        }
    }

    /// Excalidraw's number keys (its SHAPES table): 1 to 8 and 0; 9 is the picture.
    static let numbers: [CanvasTool: String] = [.selection: "1", .rectangle: "2", .diamond: "3", .ellipse: "4", .arrow: "5",
                                                .line: "6", .freedraw: "7", .text: "8", .eraser: "0"]

    /// Excalidraw's order: the lock; the hand, then the tools by their numbers, with the sticky
    /// note after text; More. The lines go between the three.
    static let groups: [[Item]] = [
        [.lock],
        [.tool(.hand), .tool(.selection), .tool(.rectangle), .tool(.diamond), .tool(.ellipse), .tool(.arrow), .tool(.line),
         .tool(.freedraw), .tool(.text), .sticky, .image, .tool(.eraser)],
        [.more],
    ]
    static var items: [Item] { groups.flatMap { $0 } }
    /// What More holds besides what a narrow board folds into it: Excalidraw's More Tools that the
    /// board has, then a note of yours as a card.
    static let moreTools: [CanvasTool] = [.frame, .laser]
    /// In a narrow board, the first of these go into More, until the palette fits.
    static let foldOrder: [Item] = [.tool(.line), .tool(.diamond), .image, .tool(.hand), .lock, .tool(.ellipse), .sticky, .tool(.eraser)]
    /// In the window's bar with no room for every tool: these wait in More (Emil's step b, 17
    /// November 2026), as in Excalidraw's "more tools".
    static let barFold: [Item] = [.lock, .tool(.hand), .image, .tool(.eraser)]

    // Its measures: a cell for each, a little between them, a line between the groups.
    static let cell: CGFloat = 32
    static let gap: CGFloat = 2
    static let padding: CGFloat = 5
    static let rule: CGFloat = 1 + 2 * 5
    static let radius: CGFloat = 12
    /// From the board's top edge, as Excalidraw's toolbar stands.
    static let top: CGFloat = 12
    static var height: CGFloat { cell + 2 * padding }
    /// Where what goes under the palette starts on the board (the style panel, the follow banner,
    /// voting): below the palette, clear of it.
    static var below: CGFloat { top + height + 10 }
    /// Where it starts while the tools are in the window's bar: just under the bar.
    static let belowBar: CGFloat = 12
    static func below(_ tools: BoardToolbar.Tools) -> CGFloat { tools.inBar ? belowBar : below }

    /// The palette's width with these items in these groups: a gap between two cells of a group,
    /// a rule (with a gap each side) between two groups.
    static func width(_ groups: [[Item]]) -> CGFloat {
        let shown = groups.filter { !$0.isEmpty }
        let n = CGFloat(shown.reduce(0) { $0 + $1.count }), g = CGFloat(shown.count)
        return 2 * padding + n * cell + max(0, n - g) * gap + max(0, g - 1) * rule
    }

    /// The groups without these, which wait in More.
    static func groups(folding folded: [Item]) -> [[Item]] { groups.map { $0.filter { !folded.contains($0) } } }

    /// The groups that fit a board this wide (the rest are in More), keeping 12 pt at each side.
    static func fitted(width board: CGFloat) -> (groups: [[Item]], folded: [Item]) {
        var folded: [Item] = []
        for item in foldOrder where width(groups(folding: folded)) > board - 24 { folded.append(item) }
        return (groups(folding: folded), folded)
    }

    /// What shows and what waits in More, here.
    static func fitted(_ fold: Fold) -> (groups: [[Item]], folded: [Item]) {
        switch fold {
        case .board(let width): fitted(width: width)
        case .bar(let folded): folded ? (groups(folding: barFold), barFold) : (groups, [])
        }
    }

    /// Shown on a board you can draw on, unless it's presenting. Reads neither the tool nor the
    /// selection, so the window's bar doesn't redo its layout as you draw.
    static func shows(_ canvas: CanvasController) -> Bool { !canvas.viewOnly && !canvas.isPresenting }

    var body: some View {
        let (all, folded) = Self.fitted(fold)
        // A group with nothing left in it has no line before the next (the lock in More).
        let groups = all.filter { !$0.isEmpty }
        let state = canvas.state
        HStack(spacing: Self.gap) {
            ForEach(Array(groups.enumerated()), id: \.offset) { index, group in
                if index > 0 {
                    Rectangle()
                        .fill(Color.primary.opacity(0.14))
                        .frame(width: 1, height: Self.cell - 12)
                        .padding(.horizontal, (Self.rule - 1) / 2 - Self.gap)
                        .accessibilityHidden(true)
                }
                ForEach(group) { item in
                    if item == .more {
                        more(folded, state)
                    } else {
                        button(item, state)
                    }
                }
            }
        }
        .padding(Self.padding)
        .glassEffect(.regular, in: .rect(cornerRadius: Self.radius))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Tools")
        .accessibilityIdentifier("canvas.palette")
    }

    /// The tool you have: its chip is filled. The sticky note and a picture are things you add,
    /// never held.
    static func isPicked(_ item: Item, _ s: CanvasState) -> Bool {
        switch item {
        case .tool(let t): s.tool == t
        case .lock: s.locked
        case .more: moreTools.contains(s.tool)
        default: false
        }
    }

    private func button(_ item: Item, _ s: CanvasState) -> some View {
        let picked = Self.isPicked(item, s)
        return Button { run(item) } label: {
            CanvasPaletteCell(symbol: item == .lock && s.locked ? "lock.fill" : item.symbol, letter: item.letter,
                              picked: picked, soft: item == .lock)
        }
        .buttonStyle(CanvasPressStyle())
        .help(item.help)
        .accessibilityLabel(item.title)
        .accessibilityAddTraits(picked ? .isSelected : [])
        .accessibilityIdentifier(item.identifier)
    }

    /// More: Excalidraw's more tools (Frame, the laser), a note as a card, and whatever a narrow
    /// board or a narrow bar folded into it. Picked, it shows the tool that's picked from it, filled
    /// (the hand or the eraser too, while they wait in it).
    private func more(_ folded: [Item], _ s: CanvasState) -> some View {
        let from = Self.picked(fromMore: folded, s)
        return Menu {
            ForEach(folded) { item in
                if item == .lock {
                    // On or off, as its cell shows it.
                    Toggle(isOn: Binding(get: { canvas.state.locked }, set: { canvas.send(.lock($0)) })) {
                        Label(item.help, systemImage: item.symbol)
                    }
                    .accessibilityIdentifier(item.identifier)
                } else {
                    Button(item.help, systemImage: item.symbol) { run(item) }
                        .accessibilityIdentifier(item.identifier)
                }
            }
            if !folded.isEmpty { Divider() }
            ForEach(Self.moreTools) { t in
                Button(Item.tool(t).help, systemImage: t.symbol) { canvas.pick(t) }
                    .accessibilityIdentifier("canvas.tool.\(t.rawValue)")
            }
            Divider()
            Button(CanvasMenu.noteCard, systemImage: "doc.text") { canvas.choosingNote = true }
                .accessibilityIdentifier("canvas.tool.noteCard")
        } label: {
            CanvasPaletteCell(symbol: from?.symbol ?? Item.more.symbol, letter: nil, picked: from != nil, turned: from == nil, hover: overMore)
        }
        .menuStyle(.button)
        .buttonStyle(.plain)
        .menuIndicator(.hidden)
        .fixedSize()
        .modifier(HoverTracking(hovering: $overMore))
        .help(from.map { Item.tool($0).help } ?? "More Tools")
        .accessibilityLabel(Item.more.title)
        .accessibilityAddTraits(from != nil ? .isSelected : [])
        .accessibilityIdentifier(Item.more.identifier)
    }

    /// The tool picked from More: one of its own, or one that waits in it.
    static func picked(fromMore folded: [Item], _ s: CanvasState) -> CanvasTool? {
        (moreTools + folded.compactMap(\.tool)).first { $0 == s.tool }
    }

    private func run(_ item: Item) {
        switch item {
        case .lock: canvas.send(.lock(!canvas.state.locked))
        case .tool(let t): canvas.pick(t)
        case .sticky: canvas.send(.sticky)
        case .image: canvas.pickImage()
        case .more: break
        }
    }
}

/// One cell of the palette: its symbol, its letter in the corner, a soft square on hover, the
/// accent when it's the tool you have.
struct CanvasPaletteCell: View {
    let symbol: String
    let letter: String?
    var picked = false
    /// The lock: on, a soft tint in the accent rather than the filled chip (one filled chip on
    /// the palette, the tool you have).
    var soft = false
    /// More's dots stand upright (Excalidraw's ⋮).
    var turned = false
    /// The pointer's on it, when its button tracks that itself (a menu's).
    var hover: Bool? = nil
    @State private var over = false
    private var hovering: Bool { hover ?? over }

    var body: some View {
        let accent = Color(PColor.paneAccent)
        ZStack {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(picked ? (soft ? accent.opacity(0.18) : accent) : hovering ? Color.primary.opacity(0.08) : .clear)
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .regular))
                .rotationEffect(turned ? .degrees(90) : .zero)
                .foregroundStyle(picked ? (soft ? accent : .white) : Color.primary.opacity(0.85))
            if let letter {
                // The symbol's own colour, lighter: on the glass, .secondary is drawn with its
                // vibrancy, and in dark mode the letters were gone (17 November 2026).
                Text(letter)
                    .font(.system(size: 8, weight: .medium))
                    .foregroundStyle(picked && !soft ? Color.white.opacity(0.85) : Color.primary.opacity(0.5))
                    .padding(.trailing, 3)
                    .padding(.bottom, 1.5)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                    .accessibilityHidden(true)
            }
        }
        .frame(width: CanvasToolPalette.cell, height: CanvasToolPalette.cell)
        .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        .onHover { if hover == nil { over = $0 } }
    }
}

/// Excalidraw's hint line under its toolbar, word for word (the page works it out: canvas.jsx
/// hintOf), its keys drawn as keys. It stays while it applies, and takes no clicks.
struct CanvasHint: View {
    let text: String

    enum Part: Equatable { case words(String), key(String) }

    /// The words a key stands for in Excalidraw's hints, as they're written there.
    static let keyWords: Set<String> = ["Shift", "Option", "Alt", "Cmd", "Enter", "Escape", "ESCAPE", "Delete", "spacebar"]

    /// The hint in words and keys: a key's name, a letter after "Press" or a "+" ("Press A again",
    /// "Cmd+D").
    static func parts(_ text: String) -> [Part] {
        var out: [Part] = []
        var words = ""
        let tokens = text.split(separator: " ", omittingEmptySubsequences: false).map(String.init)
        for (i, token) in tokens.enumerated() {
            if i > 0 { words += " " }
            // "Cmd+ENTER", "Cmd+D": keys joined by a plus.
            let pieces = token.split(separator: "+", omittingEmptySubsequences: false).map(String.init)
            for (j, piece) in pieces.enumerated() {
                if j > 0 { words += "+" }
                let bare = piece.trimmingCharacters(in: .punctuationCharacters)
                let letterKey = bare.count == 1 && bare.uppercased() == bare && bare.rangeOfCharacter(from: .letters) != nil
                    && (pieces.count > 1 || (i > 0 && tokens[i - 1] == "Press"))
                if keyWords.contains(bare) || letterKey {
                    let start = piece.range(of: bare)!
                    words += piece[..<start.lowerBound]
                    if !words.isEmpty { out.append(.words(words)); words = "" }
                    out.append(.key(bare))
                    words += piece[start.upperBound...]
                } else {
                    words += piece
                }
            }
        }
        if !words.isEmpty { out.append(.words(words)) }
        return out
    }

    /// Its top while the tools are in the window's bar: just under the bar, on the board.
    static let belowBar: CGFloat = 10

    /// How wide the line can be on a board this wide: clear of the style panel at the left (its
    /// whole panel or its strip, as wide on the right to stay centred), at most a long line's
    /// width. Nil: no room for it.
    static func room(board: CGFloat) -> CGFloat? {
        let panel = CanvasStyleSidebar.panelWidth(CanvasStyleSidebar.layout(board: board))
        let room = min(560, board - 2 * (CanvasStyleSidebar.inset + panel + 12))
        return room >= 220 ? room : nil
    }

    var body: some View {
        Self.parts(text).reduce(Text(verbatim: "")) { line, part in
            switch part {
            case .words(let w): Text("\(line)\(Text(verbatim: w))")
            case .key(let k): Text("\(line)\(Text(Image(nsImage: Self.keycap(k))).baselineOffset(-3))")
            }
        }
        .font(.system(size: 12))
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)
        .lineSpacing(3)
        .fixedSize(horizontal: false, vertical: true)
        .accessibilityLabel(text)
        .accessibilityIdentifier("canvas.hint")
        .allowsHitTesting(false)
    }

    /// A key as a key: its name in a small monospaced face in an outline, drawn in the line's own
    /// colour (a template image takes the text's colour).
    @MainActor static func keycap(_ name: String) -> NSImage {
        if let made = keycaps[name] { return made }
        let font = NSFont.monospacedSystemFont(ofSize: 10, weight: .medium)
        let words = NSAttributedString(string: name, attributes: [.font: font, .foregroundColor: NSColor.black])
        let size = words.size()
        let box = CGSize(width: ceil(size.width) + 8, height: 15)
        let image = NSImage(size: CGSize(width: box.width + 2, height: box.height), flipped: false) { _ in
            let frame = CGRect(x: 1.5, y: 0.5, width: box.width - 1, height: box.height - 1)
            let path = NSBezierPath(roundedRect: frame, xRadius: 3.5, yRadius: 3.5)
            path.lineWidth = 1
            NSColor.black.setStroke()
            path.stroke()
            words.draw(at: CGPoint(x: 1 + (box.width - size.width) / 2, y: (box.height - size.height) / 2 + 0.5))
            return true
        }
        image.isTemplate = true
        image.accessibilityDescription = name
        keycaps[name] = image
        return image
    }
    @MainActor private static var keycaps: [String: NSImage] = [:]
}
#endif
