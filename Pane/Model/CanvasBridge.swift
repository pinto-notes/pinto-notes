import Foundation
import ImageIO
import UniformTypeIdentifiers
import SwiftUI

/// A canvas's controls are the app's own (13 November 2026, after "we really need to work on the UI"):
/// the drawing engine's toolbars, menus, hints and panels are hidden, and the window's toolbar (Mac)
/// or a tool bar at the foot (iPhone), the menus and a style popover drive it instead.
///
/// The page and the app talk through two narrow messages, like `amber.update`:
/// - the app calls `amber._canvasCommand(command)` (`CanvasCommand.payload`);
/// - the page posts its state on the `amberCanvas` message whenever it changes (`CanvasState`).
/// canvas-stack/src/canvas.jsx is the page's side.

/// The drawing tools, in the toolbar's order, with the engine's single-key shortcuts.
enum CanvasTool: String, CaseIterable, Identifiable, Sendable {
    case selection, hand, rectangle, diamond, ellipse, arrow, line, freedraw, text, eraser

    var id: String { rawValue }

    var title: String {
        switch self {
        case .selection: "Select"
        case .hand: "Hand"
        case .rectangle: "Rectangle"
        case .diamond: "Diamond"
        case .ellipse: "Ellipse"
        case .arrow: "Arrow"
        case .line: "Line"
        case .freedraw: "Pencil"
        case .text: "Text"
        case .eraser: "Eraser"
        }
    }

    var symbol: String {
        switch self {
        case .selection: "cursorarrow"
        case .hand: "hand.raised"
        case .rectangle: "rectangle"
        case .diamond: "diamond"
        case .ellipse: "circle"
        case .arrow: "arrow.up.right"
        case .line: "line.diagonal"
        case .freedraw: "pencil"
        case .text: "textformat"
        case .eraser: "eraser"
        }
    }

    /// The key that picks it while the canvas has focus (the page handles it).
    var key: String {
        switch self {
        case .selection: "V"
        case .hand: "H"
        case .rectangle: "R"
        case .diamond: "D"
        case .ellipse: "O"
        case .arrow: "A"
        case .line: "L"
        case .freedraw: "P"
        case .text: "T"
        case .eraser: "E"
        }
    }

    /// The help tag: "Rectangle (R)".
    var help: String { "\(title) (\(key))" }

    /// A tool that draws something new, so its style can be set before drawing.
    var draws: Bool { ![.selection, .hand, .eraser].contains(self) }
}

extension CanvasTool {
    /// The dock's tools, in its order (direction B, 13 November 2026). Line stays on its key (L).
    static let dock: [CanvasTool] = [.selection, .hand, .freedraw, .rectangle, .ellipse, .diamond, .arrow, .text, .eraser]
    /// The shapes, one button on iPhone.
    static let shapes: [CanvasTool] = [.rectangle, .ellipse, .diamond, .line]
}

/// The canvas's background, from the ••• menu (light colours: the canvas inverts them in dark mode).
enum CanvasBackground {
    static let all: [(name: String, hex: String)] = [("White", "#ffffff"), ("Grey", "#f8f9fa"), ("Blue", "#f5faff"), ("Yellow", "#fffce8"), ("Cream", "#fdf8f6")]
}

/// The View menu's canvas items.
enum CanvasMenu {
    static let zoomIn = "Zoom In"
    static let zoomOut = "Zoom Out"
    static let actualSize = "Actual Size"
    static let zoomToFit = "Zoom to Fit"
}

/// Style values as the scene stores them.
enum CanvasStyle {
    struct Swatch: Identifiable, Hashable {
        let name: String
        let hex: String
        var id: String { hex }
    }

    /// Strokes: Pinto's ink first, then a short palette.
    static let strokes: [Swatch] = [
        .init(name: "Ink", hex: "#2a1d10"), .init(name: "Red", hex: "#e03131"), .init(name: "Orange", hex: "#f08c00"),
        .init(name: "Green", hex: "#2f9e44"), .init(name: "Blue", hex: "#1971c2"), .init(name: "Purple", hex: "#9c36b5"),
    ]
    /// Fills: none, then soft tints of the same.
    static let fills: [Swatch] = [
        .init(name: "None", hex: "transparent"), .init(name: "Pink", hex: "#ffc9c9"), .init(name: "Yellow", hex: "#ffec99"),
        .init(name: "Green", hex: "#b2f2bb"), .init(name: "Blue", hex: "#a5d8ff"), .init(name: "Lilac", hex: "#eebefa"),
    ]

    static let widths: [(name: String, value: Double)] = [("Thin", 1), ("Bold", 2), ("Extra bold", 4)]
    static let strokeStyles: [(name: String, value: String)] = [("Solid", "solid"), ("Dashed", "dashed"), ("Dotted", "dotted")]
    static let fillStyles: [(name: String, value: String)] = [("Hatched", "hachure"), ("Cross-hatched", "cross-hatch"), ("Solid", "solid")]
    /// The engine's font ids: Excalifont, Nunito, Comic Shanns.
    static let fonts: [(name: String, value: Int)] = [("Hand-drawn", 5), ("Normal", 6), ("Code", 8)]
    static let fontSizes: [(name: String, value: Double)] = [("S", 16), ("M", 20), ("L", 28), ("XL", 36)]
    /// nil is no arrowhead.
    static let arrowTypes: [(name: String, value: String, symbol: String)] = [("Straight", "sharp", "arrow.up.right"), ("Curved", "round", "arrow.uturn.right"), ("Elbow", "elbow", "arrow.turn.down.right")]
    static let arrowheads: [(name: String, value: String?)] = [("None", nil), ("Arrow", "arrow"), ("Triangle", "triangle"), ("Bar", "bar"), ("Circle", "circle")]

    /// A colour as the canvas shows it: in dark mode the engine draws the scene inverted and turned
    /// half way round the hue wheel (`invert(100%) hue-rotate(180deg)`), so a swatch shows that too.
    static func shown(_ hex: String, dark: Bool) -> Color? {
        guard var (r, g, b) = rgb(hex) else { return nil }
        if dark {
            (r, g, b) = (1 - r, 1 - g, 1 - b)
            // CSS hue-rotate(180deg).
            let nr = -0.574 * r + 1.430 * g + 0.144 * b
            let ng = 0.426 * r + 0.430 * g + 0.144 * b
            let nb = 0.426 * r + 1.430 * g - 0.856 * b
            (r, g, b) = (min(max(nr, 0), 1), min(max(ng, 0), 1), min(max(nb, 0), 1))
        }
        return Color(red: r, green: g, blue: b)
    }

    static func rgb(_ hex: String) -> (Double, Double, Double)? {
        var h = hex.trimmingCharacters(in: .whitespaces).lowercased()
        guard h.hasPrefix("#") else { return nil }
        h.removeFirst()
        if h.count == 3 { h = h.map { "\($0)\($0)" }.joined() }
        guard h.count == 6 || h.count == 8, let v = UInt32(h.prefix(6), radix: 16) else { return nil }
        return (Double((v >> 16) & 0xFF) / 255, Double((v >> 8) & 0xFF) / 255, Double(v & 0xFF) / 255)
    }

    /// "#rrggbb" for a colour the system colour well picked (light: the scene stores light colours;
    /// in dark mode the canvas inverts what it draws, so the picked colour is turned back first).
    static func hex(_ color: Color, dark: Bool) -> String {
        #if os(macOS)
        let c = NSColor(color).usingColorSpace(.sRGB) ?? .black
        var (r, g, b) = (Double(c.redComponent), Double(c.greenComponent), Double(c.blueComponent))
        #else
        var rr: CGFloat = 0, gg: CGFloat = 0, bb: CGFloat = 0, aa: CGFloat = 0
        UIColor(color).getRed(&rr, green: &gg, blue: &bb, alpha: &aa)
        var (r, g, b) = (Double(rr), Double(gg), Double(bb))
        #endif
        if dark {
            // The inverse of `shown`: hue-rotate(180deg) is its own inverse, then invert.
            let nr = -0.574 * r + 1.430 * g + 0.144 * b
            let ng = 0.426 * r + 0.430 * g + 0.144 * b
            let nb = 0.426 * r + 1.430 * g - 0.856 * b
            (r, g, b) = (1 - min(max(nr, 0), 1), 1 - min(max(ng, 0), 1), 1 - min(max(nb, 0), 1))
        }
        func h(_ x: Double) -> String { String(format: "%02x", Int((min(max(x, 0), 1) * 255).rounded())) }
        return "#" + h(r) + h(g) + h(b)
    }
}

/// Something drawn that the style bar shouldn't cover.
enum CanvasObstacle: Equatable, Sendable {
    case box(CGRect)
    case line([CGPoint])

    init?(_ m: [String: Any]) {
        func nums(_ k: String) -> [CGFloat]? { (m[k] as? [Any])?.compactMap { ($0 as? NSNumber).map { CGFloat($0.doubleValue) } } }
        if let b = nums("box"), b.count == 4 { self = .box(CGRect(x: b[0], y: b[1], width: b[2], height: b[3])); return }
        if let l = nums("line"), l.count >= 4 { self = .line(stride(from: 0, to: l.count - 1, by: 2).map { CGPoint(x: l[$0], y: l[$0 + 1]) }); return }
        return nil
    }

    /// Whether it runs through `r`.
    func hits(_ r: CGRect) -> Bool {
        switch self {
        case .box(let b): return b.intersects(r)
        case .line(let pts):
            if pts.contains(where: r.contains) { return true }
            for (a, b) in zip(pts, pts.dropFirst()) where Self.segment(a, b, crosses: r) { return true }
            return false
        }
    }

    private static func segment(_ a: CGPoint, _ b: CGPoint, crosses r: CGRect) -> Bool {
        guard CGRect(x: min(a.x, b.x), y: min(a.y, b.y), width: abs(a.x - b.x), height: abs(a.y - b.y)).intersects(r.insetBy(dx: -0.5, dy: -0.5)) else { return false }
        let corners = [CGPoint(x: r.minX, y: r.minY), CGPoint(x: r.maxX, y: r.minY), CGPoint(x: r.maxX, y: r.maxY), CGPoint(x: r.minX, y: r.maxY)]
        let side = corners.map { (b.x - a.x) * ($0.y - a.y) - (b.y - a.y) * ($0.x - a.x) }
        return !(side.allSatisfy { $0 > 0 } || side.allSatisfy { $0 < 0 })
    }
}

/// What the page reports.
struct CanvasState: Equatable, Sendable {
    var tool: CanvasTool = .selection
    /// The selected elements' types ("rectangle", "text", …).
    var selection: [String] = []
    /// Where the selection is in the page, in points from its top left (nil: nothing selected).
    var bounds: CGRect?
    /// What's drawn near the selection, in the page's points: boxes for shapes, the points an
    /// arrow or line runs through. The style bar floats where it covers none of it.
    var nearby: [CanvasObstacle] = []
    /// Something is being moved, resized or drawn: the style bar steps out of the way.
    var busy = false
    /// Text is being typed on the canvas.
    var editing = false
    var strokeColor = "#2a1d10"
    var backgroundColor = "transparent"
    var fillStyle = "solid"
    var strokeWidth: Double = 2
    var strokeStyle = "solid"
    var opacity: Double = 100
    var fontFamily = 5
    var fontSize: Double = 20
    var startArrowhead: String? = nil
    var endArrowhead: String? = "arrow"
    /// "sharp" (straight), "round" (curved) or "elbow".
    var arrowType = "round"
    /// The selected shapes have different fills.
    var mixedFill = false
    var zoom: Double = 1
    var background = "#ffffff"
    var canUndo = false
    var canRedo = false
    /// Nothing drawn yet (CanvasStart offers the templates). False until the page says so.
    var empty = false

    init() {}

    init(_ m: [String: Any]) {
        if let t = (m["tool"] as? String).flatMap(CanvasTool.init(rawValue:)) { tool = t }
        selection = (m["selection"] as? [String]) ?? []
        editing = (m["editing"] as? Bool) ?? false
        busy = (m["busy"] as? Bool) ?? false
        if let b = m["bounds"] as? [String: Any], let x = (b["x"] as? NSNumber)?.doubleValue, let y = (b["y"] as? NSNumber)?.doubleValue,
           let w = (b["width"] as? NSNumber)?.doubleValue, let h = (b["height"] as? NSNumber)?.doubleValue {
            bounds = CGRect(x: x, y: y, width: w, height: h)
        }
        nearby = ((m["nearby"] as? [[String: Any]]) ?? []).compactMap(CanvasObstacle.init)
        let s = (m["style"] as? [String: Any]) ?? [:]
        func num(_ k: String) -> Double? { (s[k] as? NSNumber)?.doubleValue }
        strokeColor = (s["strokeColor"] as? String) ?? strokeColor
        backgroundColor = (s["backgroundColor"] as? String) ?? backgroundColor
        fillStyle = (s["fillStyle"] as? String) ?? fillStyle
        strokeWidth = num("strokeWidth") ?? strokeWidth
        strokeStyle = (s["strokeStyle"] as? String) ?? strokeStyle
        opacity = num("opacity") ?? opacity
        fontFamily = num("fontFamily").map { Int($0) } ?? fontFamily
        fontSize = num("fontSize") ?? fontSize
        startArrowhead = s["startArrowhead"] as? String
        endArrowhead = s["endArrowhead"] as? String
        arrowType = (s["arrowType"] as? String) ?? arrowType
        mixedFill = (s["mixedFill"] as? Bool) ?? false
        zoom = (m["zoom"] as? NSNumber)?.doubleValue ?? zoom
        background = (m["background"] as? String) ?? background
        canUndo = (m["canUndo"] as? Bool) ?? false
        canRedo = (m["canRedo"] as? Bool) ?? false
        empty = (m["empty"] as? Bool) ?? false
    }

    var hasSelection: Bool { !selection.isEmpty }

    /// The style controls show when something is selected or a drawing tool is picked.
    var stylable: Bool { hasSelection || tool.draws }
    /// The bar over the selection shows: something selected, nothing being moved or typed.
    var showsSelectionBar: Bool { hasSelection && bounds != nil && !busy && !editing && tool == .selection }

    /// The types the style controls are for: the selection's, else the tool's.
    var styledTypes: Set<String> { hasSelection ? Set(selection) : [tool.rawValue] }
    var showsFill: Bool { !styledTypes.isDisjoint(with: ["rectangle", "diamond", "ellipse"]) }
    var showsText: Bool { styledTypes.contains("text") }
    var showsArrowheads: Bool { styledTypes.contains("arrow") }
    /// A picture has no stroke to set (whiteboard council, round 2, 11: the bar offered one).
    var showsStroke: Bool { !styledTypes.subtracting(["text", "image"]).isEmpty }
    /// Two or more selected: they can be lined up.
    var showsAlign: Bool { selection.count >= 2 }
}

/// What the app asks the page to do.
enum CanvasCommand: Equatable, Sendable {
    enum Action: String, CaseIterable, Sendable {
        case undo, redo, bringToFront, sendToBack, bringForward, sendBackward, duplicate, delete, selectAll
        case zoomIn, zoomOut, resetZoom, zoomToFit, clear
        case alignLeft, alignCenter, alignRight, alignTop, alignMiddle, alignBottom, distributeHorizontally, distributeVertically
    }
    enum StyleKey: String, Sendable {
        case strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, opacity, fontFamily, fontSize, startArrowhead, endArrowhead, arrowType
    }
    enum Value: Equatable, Sendable {
        case text(String), number(Double), none
        var any: Any {
            switch self {
            case .text(let s): s
            case .number(let n): n
            case .none: NSNull()
            }
        }
    }

    case tool(CanvasTool)
    case style(StyleKey, Value)
    case action(Action)
    /// Moves the view by this many points (the drawing follows the pointer).
    case pan(dx: Double, dy: Double)
    case background(String)
    /// Adds elements in the short form (a template), in one step Undo takes back. Its title is
    /// the board's name when it has one.
    case insert(WhiteboardTemplate, title: String? = nil)
    /// A picture onto the board (CanvasImage), at a point of the page or the middle of the view.
    case image(CanvasImage, at: CGPoint?)
    /// A sticky note, next to what's selected or in the middle of the view, typed into at once.
    case sticky

    var payload: [String: Any] {
        switch self {
        case .tool(let t): ["op": "tool", "tool": t.rawValue]
        case .style(let k, let v): ["op": "style", "key": k.rawValue, "value": v.any]
        case .action(let a): ["op": "action", "name": a.rawValue]
        case .pan(let dx, let dy): ["op": "pan", "dx": dx, "dy": dy]
        case .background(let c): ["op": "background", "color": c]
        case .insert(let t, let title): ["op": "insert", "elements": t.elements(titled: title)]
        case .sticky: ["op": "sticky"]
        case .image(let i, let at):
            ["op": "image", "dataURL": i.dataURL, "mimeType": i.mimeType, "width": i.width, "height": i.height]
                .merging(at.map { ["x": Double($0.x), "y": Double($0.y)] } ?? [:]) { a, _ in a }
        }
    }
}

/// One open canvas: the state the page last reported, and the way to send it commands. The note
/// pane makes it; the page view joins it to the page; the toolbar, menus and popover read it.
@MainActor @Observable
final class CanvasController {
    private(set) var state = CanvasState()
    /// The page has reported at least once (its controls are live).
    private(set) var connected = false
    /// The style popover (Mac) or sheet (iPhone) is open.
    var showingStyle = false
    /// Every command sent, for tests.
    @ObservationIgnored private(set) var sent: [CanvasCommand] = []
    /// Delivers a command to the page (set by the page view while it shows).
    @ObservationIgnored var deliver: ((CanvasCommand) -> Void)?

    func send(_ command: CanvasCommand) {
        sent.append(command)
        deliver?(command)
    }

    /// Undo, Redo and the background, apart from `state`: the note pane's toolbar and menus read
    /// these, so they don't depend on the selection's bounds, which change on every move of a drag.
    /// Each is set only when it changes (an @Observable property tells its readers on every set,
    /// even of the same value).
    private(set) var canUndo = false
    private(set) var canRedo = false
    private(set) var background = "#ffffff"

    func receive(_ message: Any) {
        guard let m = message as? [String: Any] else { return }
        // A save the store refused (a board over the size limit): said, not lost quietly.
        if let error = m["error"] as? String { confirm(error, for: .seconds(6)); return }
        if let r = m["remote"] as? [String: Any] { remoteChange(r); return }
        let next = CanvasState(m)
        if !connected { connected = true }
        if next != state { state = next }
        if canUndo != next.canUndo { canUndo = next.canUndo }
        if canRedo != next.canRedo { canRedo = next.canRedo }
        if background != next.background { background = next.background }
        if !next.stylable, showingStyle { showingStyle = false }
    }

    /// Makes a file of the board (set by the page view while it shows): `selected` takes only
    /// what's selected when something is; `light` draws it on its own light background whatever
    /// the appearance; `page` makes it for a shared board's page, whose heading is that name.
    @ObservationIgnored var exporter: ((CanvasExport, Bool, Bool, String?) async -> Data?)?
    /// The board's name, for the files it exports to.
    @ObservationIgnored var title = "Whiteboard"
    /// A line confirming what was just done ("Copied as PNG"), shown for a moment over the board.
    var notice: String?

    /// Every picture leaves out a template's how-to line and the band it stood in; the
    /// .excalidraw file keeps it. `page` (a shared board's page, whose heading says the board's
    /// name): the picture leaves out the board's title when it says the same, and the scene
    /// leaves out the how-to line as a picture does (canvas.jsx exportScene).
    func export(_ format: CanvasExport, selected: Bool = false, light: Bool = false, page: String? = nil) async -> Data? {
        await exporter?(format, selected, light, page)
    }

    func confirm(_ text: String, for time: Duration = .seconds(1.8)) {
        notice = text
        Task { @MainActor [weak self] in
            try? await Task.sleep(for: time)
            if self?.notice == text { self?.notice = nil }
        }
    }

    /// What an AI just drew or changed, outlined over the board with its name for a few seconds
    /// (whiteboard council, round 1: "show what the AI did").
    struct Highlight: Equatable {
        var rect: CGRect
        var by: String
        var count: Int
    }
    var highlight: Highlight?
    @ObservationIgnored private var expecting: (by: String, at: Date)?

    /// An AI's change to this board has arrived (the data store's arrival): the page's report of
    /// where it landed, next, is outlined with its name.
    func arrived(by: String) { expecting = (by, .now) }

    private func remoteChange(_ r: [String: Any]) {
        let num = { (k: String) in (r[k] as? Double) ?? (r[k] as? Int).map(Double.init) ?? 0 }
        // The view moved under an outline: it moves with it.
        if r["follow"] as? Bool == true {
            if var h = highlight {
                h.rect = CGRect(x: num("x"), y: num("y"), width: num("width"), height: num("height"))
                highlight = h
            }
            return
        }
        guard let e = expecting, e.at.timeIntervalSinceNow > -5 else { return }
        expecting = nil
        let h = Highlight(rect: CGRect(x: num("x"), y: num("y"), width: num("width"), height: num("height")), by: e.by, count: Int(num("count")))
        highlight = h
        Task { @MainActor [weak self] in
            try? await Task.sleep(for: .seconds(Self.highlightTime))
            if self?.highlight?.by == h.by, self?.highlight?.count == h.count { self?.highlight = nil }
        }
    }

    nonisolated(unsafe) static var highlightTime: Double = 4

    func pick(_ tool: CanvasTool) { send(.tool(tool)) }
    func run(_ action: CanvasCommand.Action) { send(.action(action)) }
    func set(_ key: CanvasCommand.StyleKey, _ value: CanvasCommand.Value) { send(.style(key, value)) }
}

/// The open canvas, for the menus (Edit, View).
private struct CanvasControllerKey: FocusedValueKey {
    typealias Value = CanvasController
}

extension FocusedValues {
    var canvasController: CanvasController? {
        get { self[CanvasControllerKey.self] }
        set { self[CanvasControllerKey.self] = newValue }
    }
}

/// What an empty whiteboard offers besides drawing (Emil, 13 November 2026: "a quick option to
/// create a blank whiteboard or use some templates"). Blank costs nothing: draw and they go.
/// Each is Excalidraw's short form, which the page fills out, so an AI can make the same.
enum WhiteboardTemplate: String, CaseIterable, Identifiable, Sendable {
    case flowchart, mindMap, retro, kanban, meeting

    var id: String { rawValue }

    var title: String {
        switch self {
        case .flowchart: "Flowchart"
        case .mindMap: "Mind map"
        case .retro: "Retro"
        case .kanban: "Kanban"
        case .meeting: "Meeting"
        }
    }

    var symbol: String {
        switch self {
        case .flowchart: "flowchart"
        case .mindMap: "point.3.connected.trianglepath.dotted"
        case .retro: "hand.thumbsup"
        case .kanban: "rectangle.split.3x1"
        case .meeting: "person.2"
        }
    }

    // Excalidraw's light palette; the canvas inverts it in dark mode.
    private static let ink = "#2a1d10", yellow = "#ffec99", green = "#b2f2bb", blue = "#a5d8ff", red = "#ffc9c9", violet = "#eebefa"
    /// A lane: a hair lighter than the paper, with a quiet solid edge (dashed grey read as a
    /// disabled drop zone, whiteboard council round 1).
    private static let lane = "#f8f9fa", laneEdge = "#ced4da", hint = "#868e96"

    private static func box(_ id: String, _ type: String = "rectangle", x: Double, y: Double, w: Double, h: Double, text: String, fill: String = "transparent", size: Double = 20) -> [String: Any] {
        var e: [String: Any] = ["type": type, "id": id, "x": x, "y": y, "width": w, "height": h, "strokeColor": ink,
                                "backgroundColor": fill, "fillStyle": "solid", "label": ["text": text, "fontSize": size]]
        if type == "rectangle" { e["roundness"] = ["type": 3] }
        return e
    }
    /// `branch`: a mind map's joint, an arrow with no heads, so it stays joined when either end moves.
    private static func arrow(from a: String, to b: String, x: Double, y: Double, dx: Double, dy: Double, branch: Bool = false, label: String? = nil) -> [String: Any] {
        var e: [String: Any] = ["type": "arrow", "x": x, "y": y, "width": dx, "height": dy, "strokeColor": ink,
                                "points": [[0, 0], [dx, dy]], "start": ["id": a], "end": ["id": b]]
        if branch { e["endArrowhead"] = NSNull(); e["startArrowhead"] = NSNull() }
        if let label { e["label"] = ["text": label, "fontSize": 16] }
        return e
    }
    private static func text(_ s: String, x: Double, y: Double, size: Double = 28, color: String = ink) -> [String: Any] {
        ["type": "text", "x": x, "y": y, "text": s, "fontSize": size, "strokeColor": color]
    }
    private static func title(_ s: String, hint h: String) -> [[String: Any]] {
        // The how-to line is marked, so the list's preview and search leave it out (CanvasSketch).
        [text(s, x: 0, y: -96, size: 32).merging(["customData": ["pintoTitle": true]]) { a, _ in a },
         text(h, x: 0, y: -50, size: 16, color: hint).merging(["customData": ["pintoHint": true]]) { a, _ in a }]
    }
    /// A lane with its heading on top and cards under it.
    private static func column(_ id: String, x: Double, title: String, fill: String, cards: [String], width: Double = 220, height: Double = 380) -> [[String: Any]] {
        var out: [[String: Any]] = [["type": "rectangle", "id": id, "x": x, "y": 0, "width": width, "height": height, "strokeColor": laneEdge,
                                     "backgroundColor": lane, "fillStyle": "solid", "roundness": ["type": 3]],
                                    text(title, x: x + 16, y: 14, size: 20)]
        for (i, c) in cards.enumerated() {
            out.append(box("\(id)-\(i)", x: x + 14, y: 56 + Double(i) * 92, w: width - 28, h: 76, text: c, fill: fill, size: 16))
        }
        return out
    }
    /// A section to write in: its heading at the top left, the space under it left empty.
    private static func section(_ id: String, x: Double, y: Double, w: Double, h: Double, title: String, fill: String, lines: [String] = []) -> [[String: Any]] {
        var out: [[String: Any]] = [["type": "rectangle", "id": id, "x": x, "y": y, "width": w, "height": h, "strokeColor": laneEdge,
                                     "backgroundColor": fill, "fillStyle": "solid", "roundness": ["type": 3]],
                                    text(title, x: x + 16, y: y + 14, size: 20)]
        for (i, l) in lines.enumerated() { out.append(text(l, x: x + 16, y: y + 52 + Double(i) * 28, size: 16)) }
        return out
    }

    var elements: [[String: Any]] {
        typealias T = WhiteboardTemplate
        switch self {
        case .flowchart:
            return T.title("Flowchart", hint: "Double-click a shape to write in it. Drag from its edge to add an arrow.") + [
                T.box("start", "ellipse", x: 0, y: 0, w: 180, h: 70, text: "Start", fill: T.green),
                T.box("step", x: 0, y: 130, w: 180, h: 76, text: "Do the thing", fill: T.blue),
                T.box("check", "diamond", x: -10, y: 266, w: 200, h: 124, text: "Did it work?", fill: T.yellow),
                T.box("end", "ellipse", x: 0, y: 460, w: 180, h: 70, text: "Done", fill: T.green),
                T.box("fix", x: 300, y: 290, w: 170, h: 76, text: "Fix it", fill: T.red),
                T.arrow(from: "start", to: "step", x: 90, y: 70, dx: 0, dy: 60),
                T.arrow(from: "step", to: "check", x: 90, y: 206, dx: 0, dy: 60),
                T.arrow(from: "check", to: "end", x: 90, y: 390, dx: 0, dy: 70, label: "Yes"),
                T.arrow(from: "check", to: "fix", x: 190, y: 328, dx: 110, dy: 0, label: "No"),
                T.arrow(from: "fix", to: "step", x: 385, y: 290, dx: -205, dy: -122),
            ]
        case .mindMap:
            // Branches leave the middle at their own angles, one with a second level to show how
            // a map grows.
            let ideas: [(String, Double, Double, String)] = [("Why it matters", -280, -150, T.yellow), ("Who it\u{2019}s for", 280, -150, T.blue),
                                                              ("How", -280, 150, T.green), ("When", 280, 150, T.violet), ("Risks", 0, 230, T.red)]
            var out: [[String: Any]] = T.title("Mind map", hint: "Double-click to write. Option-drag a branch to copy it, then join it with a line.").map { e in
                var e = e; e["y"] = (e["y"] as! Double) - 230; e["x"] = -365.0; return e
            }
            out.append(T.box("main", "ellipse", x: -120, y: -55, w: 240, h: 110, text: "The big idea", fill: T.yellow, size: 24))
            for (i, idea) in ideas.enumerated() {
                let (t, x, y, fill) = idea
                out.append(T.box("idea\(i)", x: x - 85, y: y - 32, w: 170, h: 64, text: t, fill: fill, size: 18))
                // From the ellipse's edge toward the branch.
                let len = (x * x + y * y).squareRoot(), ux = x / len, uy = y / len
                let r = 1 / ((ux * ux) / (120 * 120) + (uy * uy) / (55 * 55)).squareRoot()
                let sx = ux * r, sy = uy * r
                // To the branch box's edge (it's 170 by 64), not into it.
                let reach = min(85 / max(abs(ux), 0.0001), 32 / max(abs(uy), 0.0001))
                let ex = x - ux * (reach + 4), ey = y - uy * (reach + 4)
                out.append(T.arrow(from: "main", to: "idea\(i)", x: sx, y: sy, dx: ex - sx, dy: ey - sy, branch: true))
            }
            out.append(T.box("sub0", x: -355, y: 250, w: 150, h: 56, text: "First step", fill: T.green, size: 16))
            out.append(T.arrow(from: "idea2", to: "sub0", x: -280, y: 186, dx: 0, dy: 60, branch: true))
            return out
        case .retro:
            return T.title("Retro", hint: "Double-click a card to write. Option-drag a card to add another.")
                + T.column("well", x: 0, title: "Went well", fill: T.green, cards: ["Shipped on time"])
                + T.column("better", x: 240, title: "Could be better", fill: T.red, cards: ["Too many meetings"])
                + T.column("try", x: 480, title: "Try next", fill: T.blue, cards: ["Demo every Friday"])
        case .kanban:
            return T.title("Kanban", hint: "Drag cards between columns. Option-drag a card to add another.")
                + T.column("todo", x: 0, title: "To do", fill: T.yellow, cards: ["Write the brief \u{00B7} Sam", "Book the venue \u{00B7} Alex"])
                + T.column("doing", x: 240, title: "Doing", fill: T.blue, cards: ["Draft the post \u{00B7} you"])
                + T.column("done", x: 480, title: "Done", fill: T.green, cards: ["Pick a date \u{00B7} team"])
        case .meeting:
            return T.title("Meeting", hint: "Date:            People:")
                + T.section("agenda", x: 0, y: 0, w: 340, h: 220, title: "Agenda", fill: "#e7f5ff", lines: ["1. Where we are", "2. What\u{2019}s next", "3. Anything else"])
                + T.section("notes", x: 360, y: 0, w: 340, h: 220, title: "Notes", fill: "#fff9db")
                + T.section("decisions", x: 0, y: 240, w: 340, h: 200, title: "Decisions", fill: "#ebfbee")
                + T.section("actions", x: 360, y: 240, w: 340, h: 200, title: "Action items", fill: "#f8f0fc", lines: ["Who does what, by when"])
        }
    }

    /// Its elements, the title the board's name when it has one of its own ("Product launch"
    /// rather than "Flowchart"; whiteboard council, round 2).
    func elements(titled name: String?) -> [[String: Any]] {
        let name = name?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !name.isEmpty, name != CanvasNote.title else { return elements }
        return elements.map { e in
            guard (e["customData"] as? [String: Any])?["pintoTitle"] as? Bool == true else { return e }
            var e = e; e["text"] = name; return e
        }
    }

    /// The template's shapes as boxes, for its preview tile: kind, frame and fill.
    var outline: [(kind: String, frame: CGRect, fill: String?)] {
        elements.compactMap { e in
            guard let type = e["type"] as? String, type != "text", let x = e["x"] as? Double, let y = e["y"] as? Double,
                  let w = e["width"] as? Double, let h = e["height"] as? Double else { return nil }
            let fill = (e["backgroundColor"] as? String).flatMap { $0 == "transparent" ? nil : $0 }
            return (type, CGRect(x: x, y: y, width: w, height: h), fill)
        }
    }
}

/// The files a board exports to (the More menu's Export).
enum CanvasExport: String, CaseIterable, Identifiable, Sendable {
    case png, svg, excalidraw

    var id: String { rawValue }

    var title: String {
        switch self {
        case .png: "PNG Image\u{2026}"
        case .svg: "SVG Image\u{2026}"
        case .excalidraw: "Excalidraw File\u{2026}"
        }
    }

    var fileExtension: String { rawValue }

    var contentType: UTType {
        switch self {
        case .png: .png
        case .svg: .svg
        case .excalidraw: UTType(filenameExtension: "excalidraw") ?? .json
        }
    }

    /// A file name from the board's name: what a file name can't hold is left out.
    static func filename(_ title: String, _ format: CanvasExport) -> String {
        let bad = CharacterSet(charactersIn: "/:\\")
        let name = title.components(separatedBy: bad).joined().trimmingCharacters(in: .whitespacesAndNewlines)
        return "\(name.isEmpty ? "Whiteboard" : name).\(format.fileExtension)"
    }
}

/// A picture made ready for a board: a screenshot at most 2560 pixels on its long side as a PNG
/// (or with see-through parts), a photo at most 1920 as a JPEG, as a data URL in the scene's files, which is how Excalidraw keeps it.
/// A board's data is capped at 4 MB, and a screenshot as it comes is often 2 MB or more.
struct CanvasImage: Equatable, Sendable {
    var dataURL: String
    var mimeType: String
    var width: Double
    var height: Double

    /// Sharp enough for a retina screenshot's small text, zoomed in (whiteboard council, round 2:
    /// at 1600 a dense screenshot lost its detail).
    static let maxSide = 2560
    /// Past this a picture is a JPEG, however it compresses: a board keeps 4 MB in all.
    static let pngLimit = 1_200_000

    init(dataURL: String, mimeType: String, width: Double, height: Double) {
        self.dataURL = dataURL; self.mimeType = mimeType; self.width = width; self.height = height
    }

    /// A photo needs less: grain costs bytes, and it isn't read up close.
    static let photoSide = 1920

    init?(data: Data) {
        guard let src = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
        func sized(_ side: Int) -> CGImage? {
            CGImageSourceCreateThumbnailAtIndex(src, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: side,
            ] as CFDictionary)
        }
        guard var image = sized(Self.maxSide) else { return nil }
        func encode(_ type: UTType, _ props: [CFString: Any]?) -> Data? {
            let out = NSMutableData()
            guard let dest = CGImageDestinationCreateWithData(out, type.identifier as CFString, 1, nil) else { return nil }
            CGImageDestinationAddImage(dest, image, props as CFDictionary?)
            return CGImageDestinationFinalize(dest) ? out as Data : nil
        }
        // A PNG when it has see-through parts, or when it's a screenshot (flat colours and text
        // compress well and stay crisp); a photo is a JPEG.
        let png = encode(.png, nil)
        let alpha = Self.seeThrough(image)
        var chosen: (Data, String)?
        if let png, alpha || png.count <= Self.pngLimit {
            let jpeg = alpha ? nil : encode(.jpeg, [kCGImageDestinationLossyCompressionQuality: 0.85])
            chosen = jpeg.map { $0.count * 2 < png.count } == true ? (jpeg!, "image/jpeg") : (png, "image/png")
        }
        if chosen == nil || chosen?.1 == "image/jpeg" {
            if max(image.width, image.height) > Self.photoSide, let smaller = sized(Self.photoSide) { image = smaller }
            chosen = encode(.jpeg, [kCGImageDestinationLossyCompressionQuality: 0.82]).map { ($0, "image/jpeg") }
        }
        guard let (bytes, mime) = chosen else { return nil }
        self.init(dataURL: "data:\(mime);base64," + bytes.base64EncodedString(), mimeType: mime, width: Double(image.width), height: Double(image.height))
    }

    /// Whether any pixel is see-through (a PNG with a transparent background keeps it).
    private static func seeThrough(_ image: CGImage) -> Bool {
        switch image.alphaInfo {
        case .none, .noneSkipFirst, .noneSkipLast: return false
        default: break
        }
        let w = min(image.width, 256), h = min(image.height, 256)
        var px = [UInt8](repeating: 255, count: w * h * 4)
        guard let ctx = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(),
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return true }
        ctx.clear(CGRect(x: 0, y: 0, width: w, height: h))
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
        return stride(from: 3, to: px.count, by: 4).contains { px[$0] < 250 }
    }
}
