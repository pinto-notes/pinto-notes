import Foundation
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

/// What the page reports.
struct CanvasState: Equatable, Sendable {
    var tool: CanvasTool = .selection
    /// The selected elements' types ("rectangle", "text", …).
    var selection: [String] = []
    /// Where the selection is in the page, in points from its top left (nil: nothing selected).
    var bounds: CGRect?
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
    var showsStroke: Bool { !styledTypes.subtracting(["text"]).isEmpty }
}

/// What the app asks the page to do.
enum CanvasCommand: Equatable, Sendable {
    enum Action: String, CaseIterable, Sendable {
        case undo, redo, bringToFront, sendToBack, bringForward, sendBackward, duplicate, delete, selectAll
        case zoomIn, zoomOut, resetZoom, zoomToFit, clear
    }
    enum StyleKey: String, Sendable {
        case strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, opacity, fontFamily, fontSize, startArrowhead, endArrowhead
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
    /// Adds elements in the short form (a template), in one step Undo takes back.
    case insert(WhiteboardTemplate)

    var payload: [String: Any] {
        switch self {
        case .tool(let t): ["op": "tool", "tool": t.rawValue]
        case .style(let k, let v): ["op": "style", "key": k.rawValue, "value": v.any]
        case .action(let a): ["op": "action", "name": a.rawValue]
        case .pan(let dx, let dy): ["op": "pan", "dx": dx, "dy": dy]
        case .background(let c): ["op": "background", "color": c]
        case .insert(let t): ["op": "insert", "elements": t.elements]
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
        let next = CanvasState(m)
        if !connected { connected = true }
        if next != state { state = next }
        if canUndo != next.canUndo { canUndo = next.canUndo }
        if canRedo != next.canRedo { canRedo = next.canRedo }
        if background != next.background { background = next.background }
        if !next.stylable, showingStyle { showingStyle = false }
    }

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
    private static let ink = "#2a1d10", yellow = "#ffec99", green = "#b2f2bb", blue = "#a5d8ff", red = "#ffc9c9", violet = "#eebefa", grey = "#e9ecef"

    private static func box(_ id: String, _ type: String = "rectangle", x: Double, y: Double, w: Double, h: Double, text: String, fill: String = "transparent", size: Double = 20) -> [String: Any] {
        var e: [String: Any] = ["type": type, "id": id, "x": x, "y": y, "width": w, "height": h, "strokeColor": ink,
                                "backgroundColor": fill, "fillStyle": "solid", "label": ["text": text, "fontSize": size]]
        if type == "rectangle" { e["roundness"] = ["type": 3] }
        return e
    }
    private static func arrow(from a: String, to b: String, x: Double, y: Double, dx: Double, dy: Double, line: Bool = false) -> [String: Any] {
        ["type": line ? "line" : "arrow", "x": x, "y": y, "width": dx, "height": dy, "strokeColor": ink,
         "points": [[0, 0], [dx, dy]], "start": ["id": a], "end": ["id": b]]
    }
    private static func text(_ s: String, x: Double, y: Double, size: Double = 28) -> [String: Any] {
        ["type": "text", "x": x, "y": y, "text": s, "fontSize": size, "strokeColor": ink]
    }
    /// A column with its heading on top and cards under it.
    private static func column(_ id: String, x: Double, title: String, fill: String, cards: [String]) -> [[String: Any]] {
        var out: [[String: Any]] = [["type": "rectangle", "id": id, "x": x, "y": 0, "width": 300, "height": 460, "strokeColor": ink,
                                     "backgroundColor": grey, "fillStyle": "solid", "roundness": ["type": 3], "strokeStyle": "dashed"],
                                    text(title, x: x + 20, y: 16, size: 24)]
        for (i, c) in cards.enumerated() {
            out.append(box("\(id)-\(i)", x: x + 20, y: 70 + Double(i) * 110, w: 260, h: 90, text: c, fill: fill, size: 18))
        }
        return out
    }

    var elements: [[String: Any]] {
        typealias T = WhiteboardTemplate
        switch self {
        case .flowchart:
            return [
                T.box("start", "ellipse", x: 0, y: 0, w: 180, h: 70, text: "Start", fill: T.green),
                T.box("step", x: 0, y: 140, w: 180, h: 80, text: "Do the thing", fill: T.blue),
                T.box("check", "diamond", x: -10, y: 290, w: 200, h: 130, text: "Did it work?", fill: T.yellow),
                T.box("end", "ellipse", x: 0, y: 500, w: 180, h: 70, text: "Done", fill: T.green),
                T.box("fix", x: 280, y: 315, w: 180, h: 80, text: "Fix it", fill: T.red),
                T.arrow(from: "start", to: "step", x: 90, y: 70, dx: 0, dy: 70),
                T.arrow(from: "step", to: "check", x: 90, y: 220, dx: 0, dy: 70),
                T.arrow(from: "check", to: "end", x: 90, y: 420, dx: 0, dy: 80),
                T.arrow(from: "check", to: "fix", x: 190, y: 355, dx: 90, dy: 0),
                T.arrow(from: "fix", to: "step", x: 370, y: 315, dx: -190, dy: -135),
            ]
        case .mindMap:
            let ideas: [(String, Double, Double, String)] = [("Why", -360, -170, T.yellow), ("Who", 360, -170, T.blue), ("How", -360, 170, T.green), ("When", 360, 170, T.violet)]
            var out: [[String: Any]] = [T.box("main", "ellipse", x: -110, y: -50, w: 220, h: 100, text: "The big idea", fill: T.yellow, size: 24)]
            for (i, idea) in ideas.enumerated() {
                let (t, x, y, fill) = idea
                out.append(T.box("idea\(i)", x: x - 80, y: y - 35, w: 160, h: 70, text: t, fill: fill))
                out.append(T.arrow(from: "main", to: "idea\(i)", x: x > 0 ? 110 : -110, y: 0, dx: x > 0 ? x - 190 : x + 190, dy: y, line: true))
            }
            return out
        case .retro:
            return [T.text("Retro", x: 0, y: -80, size: 36)]
                + T.column("well", x: 0, title: "Went well", fill: T.green, cards: ["Add a note"])
                + T.column("better", x: 340, title: "Could be better", fill: T.red, cards: ["Add a note"])
                + T.column("try", x: 680, title: "Try next", fill: T.blue, cards: ["Add a note"])
        case .kanban:
            return T.column("todo", x: 0, title: "To do", fill: T.yellow, cards: ["First task", "Second task"])
                + T.column("doing", x: 340, title: "Doing", fill: T.blue, cards: ["In progress"])
                + T.column("done", x: 680, title: "Done", fill: T.green, cards: [])
        case .meeting:
            return [T.text("Meeting", x: 0, y: -80, size: 36),
                    T.box("agenda", x: 0, y: 0, w: 420, h: 260, text: "Agenda", fill: T.blue),
                    T.box("notes", x: 460, y: 0, w: 420, h: 260, text: "Notes", fill: T.yellow),
                    T.box("decisions", x: 0, y: 300, w: 420, h: 260, text: "Decisions", fill: T.green),
                    T.box("actions", x: 460, y: 300, w: 420, h: 260, text: "Action items", fill: T.violet)]
        }
    }
}
