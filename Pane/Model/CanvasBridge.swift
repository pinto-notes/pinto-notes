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
    case selection, hand, rectangle, diamond, ellipse, arrow, line, freedraw, text, eraser, frame, laser
    /// The next click on the board places a comment there (BoardComments). Not the engine's: the
    /// page keeps it.
    case comment

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
        case .frame: "Frame"
        case .laser: "Laser Pointer"
        case .comment: "Comment"
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
        case .frame: "rectangle.dashed"
        case .laser: "cursorarrow.rays"
        case .comment: "plus.bubble"
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
        case .frame: "F"
        case .laser: "K"
        case .comment: "C"
        }
    }

    /// The help tag: "Rectangle (R)".
    var help: String { "\(title) (\(key))" }

    /// A tool that draws something new, so its style can be set before drawing.
    var draws: Bool { ![.selection, .hand, .eraser, .laser, .comment].contains(self) }
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
    /// A note of yours onto the board, as a card (the Shapes menu; CanvasNotePicker).
    static let noteCard = "Add Note Card\u{2026}"
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
        if dark { (r, g, b) = throughDark(r, g, b) }
        return Color(red: r, green: g, blue: b)
    }

    /// A colour (0…1 a channel) as the canvas shows it in dark mode: inverted, then CSS
    /// hue-rotate(180deg).
    static func throughDark(_ r: Double, _ g: Double, _ b: Double) -> (Double, Double, Double) {
        let (r, g, b) = (1 - r, 1 - g, 1 - b)
        let nr = -0.574 * r + 1.430 * g + 0.144 * b
        let ng = 0.426 * r + 0.430 * g + 0.144 * b
        let nb = 0.426 * r + 1.430 * g - 0.856 * b
        return (min(max(nr, 0), 1), min(max(ng, 0), 1), min(max(nb, 0), 1))
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
    /// Words of their own on the board (a how-to line, a heading): covered last (round 15,
    /// 43-timeline-1: Add Step sat on the Timeline's how-to line).
    case words(CGRect)

    init?(_ m: [String: Any]) {
        func nums(_ k: String) -> [CGFloat]? { (m[k] as? [Any])?.compactMap { ($0 as? NSNumber).map { CGFloat($0.doubleValue) } } }
        if let b = nums("box"), b.count == 4 {
            let r = CGRect(x: b[0], y: b[1], width: b[2], height: b[3])
            self = m["words"] as? Bool == true ? .words(r) : .box(r)
            return
        }
        if let l = nums("line"), l.count >= 4 { self = .line(stride(from: 0, to: l.count - 1, by: 2).map { CGPoint(x: l[$0], y: l[$0 + 1]) }); return }
        return nil
    }

    /// Whether it runs through `r`.
    func hits(_ r: CGRect) -> Bool {
        switch self {
        case .box(let b), .words(let b): return b.intersects(r)
        case .line(let pts):
            if pts.contains(where: r.contains) { return true }
            for (a, b) in zip(pts, pts.dropFirst()) where Self.segment(a, b, crosses: r) { return true }
            return false
        }
    }

    /// How much covering it costs: words you'd read far more than any number of lines and shapes.
    var weight: Int { if case .words = self { 1000 } else { 1 } }

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
    /// Presenting: which step of how many (a frame, or the whole board when there are none).
    struct Presenting: Equatable, Sendable {
        var index: Int; var count: Int; var name: String
        /// The frame on screen, in the page's points (nil: the whole board).
        var frame: CGRect? = nil
    }
    var present: Presenting?
    /// A frame on the board, as Present walks them.
    struct Frame: Equatable, Sendable, Identifiable { var id: String; var name: String }
    /// The board's frames in the order Present walks them (yours, kept in the scene as each
    /// frame's `customData.presentOrder`; else the order they were made).
    var frames: [Frame] = []
    /// What's selected is a frame or in one: Present from Here starts there.
    var inFrame = false
    /// What's selected is a part of a template that has more of its kind: a Kanban or Retro
    /// column (Add Column), a Timeline step (Add Step) (round 15) or a person on an org chart
    /// (Add Report, round 16).
    var grows: Grows?
    enum Grows: String, Equatable, Sendable {
        case column, step, report
        var title: String {
            switch self { case .column: "Add Column"; case .step: "Add Step"; case .report: "Add Report" }
        }
        var symbol: String {
            switch self { case .column: "rectangle.split.3x1"; case .step: "calendar.day.timeline.left"; case .report: "person.badge.plus" }
        }
    }
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
    /// A picture's crop handles are showing.
    var cropping = false
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
    /// One note card selected (canvas-stack/src/cards.js): its note, as the card names it.
    var card: Card?
    /// How many note cards are selected, and whether the selection is nothing but cards: a card
    /// has no stroke, fill or text of its own to set, only Open Note, Arrange and the rest.
    var selectedCards = 0
    var onlyCards = false
    /// The notes the board's cards name (a note's id, or an AI's title for it), each once.
    var cardNotes: [String] = []

    struct Card: Equatable, Sendable {
        var note: String
        var title: String
    }

    init() {}

    init(_ m: [String: Any]) {
        if let t = (m["tool"] as? String).flatMap(CanvasTool.init(rawValue:)) { tool = t }
        if let p = m["present"] as? [String: Any], let i = (p["index"] as? NSNumber)?.intValue, let n = (p["count"] as? NSNumber)?.intValue {
            let f = (p["frame"] as? [NSNumber])?.map { CGFloat($0.doubleValue) }
            present = Presenting(index: i, count: n, name: p["name"] as? String ?? "",
                                 frame: f.flatMap { $0.count == 4 ? CGRect(x: $0[0], y: $0[1], width: $0[2], height: $0[3]) : nil })
        }
        selection = (m["selection"] as? [String]) ?? []
        frames = ((m["frames"] as? [[String: Any]]) ?? []).compactMap { f in (f["id"] as? String).map { Frame(id: $0, name: f["name"] as? String ?? "") } }
        inFrame = (m["inFrame"] as? Bool) ?? false
        grows = (m["grows"] as? String).flatMap(Grows.init(rawValue:))
        editing = (m["editing"] as? Bool) ?? false
        cropping = (m["cropping"] as? Bool) ?? false
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
        if let c = m["card"] as? [String: Any], let note = c["note"] as? String { card = Card(note: note, title: (c["title"] as? String) ?? "") }
        selectedCards = (m["selectedCards"] as? NSNumber)?.intValue ?? 0
        onlyCards = (m["onlyCards"] as? Bool) ?? false
        cardNotes = (m["cardNotes"] as? [String]) ?? []
    }

    var hasSelection: Bool { !selection.isEmpty }

    /// The style controls show when something is selected or a drawing tool is picked.
    var stylable: Bool { hasSelection || tool.draws }
    /// The bar over the selection shows: something selected, nothing being moved or typed.
    var showsSelectionBar: Bool { hasSelection && bounds != nil && !busy && !editing && tool == .selection }

    /// The types the style controls are for: the selection's, else the tool's.
    var styledTypes: Set<String> { hasSelection ? Set(selection) : [tool.rawValue] }
    var showsFill: Bool { !onlyCards && !styledTypes.isDisjoint(with: ["rectangle", "diamond", "ellipse"]) }
    var showsText: Bool { !onlyCards && styledTypes.contains("text") }
    var showsArrowheads: Bool { !onlyCards && styledTypes.contains("arrow") }
    /// A picture has no stroke to set (whiteboard council, round 2, 11: the bar offered one).
    var showsStroke: Bool { !onlyCards && !styledTypes.subtracting(["text", "image"]).isEmpty }
    /// Two or more selected: they can be lined up (cards count as one each, not as their parts).
    var showsAlign: Bool { alignCount >= 2 }
    var alignCount: Int { onlyCards ? selectedCards : selection.count }
}

/// What the app asks the page to do.
enum CanvasCommand: Equatable, Sendable {
    enum Action: String, CaseIterable, Sendable {
        case undo, redo, bringToFront, sendToBack, bringForward, sendBackward, duplicate, delete, selectAll
        case zoomIn, zoomOut, resetZoom, zoomToFit, clear
        case alignLeft, alignCenter, alignRight, alignTop, alignMiddle, alignBottom, distributeHorizontally, distributeVertically
        /// A picture's crop handles (the selected picture).
        case crop
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
    /// Add Column or Add Step: the next of the selected template part's kind (CanvasState.grows),
    /// typed into at once, as Tab does.
    case grow
    /// Ends cropping a picture, keeping the crop.
    case cropDone
    /// The last change an AI made, outlined again and brought into view.
    case showLastChange
    /// Present: start (the first frame), next, previous, stop.
    case present(Present)
    enum Present: String, Sendable { case start, next, prev, stop }
    /// Present from this frame (nil: the selected frame, or the frame what's selected is in).
    case presentFrom(String?)
    /// The frames in this order for Present (ids), one step Undo takes back; kept in the scene.
    case presentOrder([String])
    /// Something from the library (CanvasLibrary): where it's dropped (a point of the page), or in
    /// a free spot in the middle of the view; selected, one step Undo takes back.
    case libraryInsert(CanvasLibraryItem, at: CGPoint?)
    /// One of your templates (WhiteboardTemplates) onto the board, as a built-in one comes in: one
    /// step Undo takes back, shown whole; its title line says the board's name when it has one.
    case template(CanvasLibraryItem, title: String?)
    /// What each note card's note says now, by what the card names (cards.js).
    case cards([String: CanvasNoteCard])
    /// Notes onto the board as cards, at a point of the page or in the middle of the view.
    case addCards([CanvasNoteCard], at: CGPoint?)
    /// A note's card selected and brought into view ("On boards" at the foot of the note).
    case focusCard(UUID)
    /// The board is shared with people (CollabBoard), or no longer: its drawing goes to the app as
    /// changes and comes back from the note's shared document. `viewOnly`: you can only look.
    case shared(on: Bool, viewOnly: Bool)
    /// A shared board's whole drawing (a scene, as JSON), merged into what's on screen.
    case remoteScene(Data)
    /// What an AI just changed on a shared board, outlined with its name (`arrived(by:)`).
    /// `move: false`: outlined where it is, the view left alone (a person's change, round 14).
    /// `all`: every one of them outlined, arrows and lines between shapes too (Show change on an
    /// AI's comment names exactly what its write changed).
    case outline([String], move: Bool = true, all: Bool = false)
    /// Opened from a search: the first shape whose words hold it, brought into view and outlined.
    case find(String)
    /// The others on a shared board: each one's pointer, name and selection.
    case peers([BoardPeer])
    /// Pictures that can't go on the shared board (no room, or their bytes didn't come): taken off
    /// the page again, by element id.
    case refusePictures([String])
    /// The board's comment pins (BoardComments), your own pin's look (for a new comment), the
    /// thread that's open ("draft" for one being written), where a new one goes, and whether you
    /// can comment.
    /// `inView`: comments go on the board while its drawing is view only (Can comment).
    case comments([BoardComments.Pin], me: BoardComments.Pin, open: String?, draft: BoardComments.Place?, canComment: Bool, shapes: [String] = [], inView: Bool = false)
    /// A new comment on the selection, or at a point of the page (a right-click on nothing).
    case commentHere(CGPoint?)
    /// A comment's pin into view: `above`, kept in that top part of the view (iPhone, over its sheet).
    case focusComment(String, above: Double? = nil)
    /// The view to someone you follow (BoardFollow): their frame or their view; nil: following ends.
    case follow(BoardFollow.Target?)
    /// Someone's laser trail, the points it went through since the last (board coordinates).
    case laser(UUID, [CGPoint])
    /// A version from the board's History (a scene, as JSON), back on the board in one step Undo
    /// takes back (BoardHistoryModel.restore).
    case restoreVersion(Data)
    /// Voting's dots and totals on the board (BoardTeam).
    case votes(CanvasVotes)

    var payload: [String: Any] {
        switch self {
        case .libraryInsert(let item, let at):
            ["op": "libraryInsert", "elements": item.elements, "files": item.files]
                .merging(at.map { ["x": Double($0.x), "y": Double($0.y)] } ?? [:]) { a, _ in a }
        case .template(let item, let title):
            ["op": "template", "elements": item.elements, "files": item.files].merging(title.map { ["title": $0] } ?? [:]) { a, _ in a }
        case .tool(let t): ["op": "tool", "tool": t.rawValue]
        case .style(let k, let v): ["op": "style", "key": k.rawValue, "value": v.any]
        case .action(let a): ["op": "action", "name": a.rawValue]
        case .pan(let dx, let dy): ["op": "pan", "dx": dx, "dy": dy]
        case .background(let c): ["op": "background", "color": c]
        case .insert(let t, let title): ["op": "insert", "elements": t.elements(titled: title)]
        case .sticky: ["op": "sticky"]
        case .grow: ["op": "grow"]
        case .cropDone: ["op": "cropDone"]
        case .showLastChange: ["op": "showLastChange"]
        case .present(let to): ["op": "present", "to": to.rawValue]
        case .presentFrom(let id): ["op": "present", "to": "start", "from": id ?? "selection"]
        case .presentOrder(let ids): ["op": "presentOrder", "ids": ids]
        case .cards(let info): ["op": "cards", "info": info.mapValues(\.payload)]
        case .focusCard(let note): ["op": "focusCard", "note": note.uuidString]
        case .shared(let on, let viewOnly): ["op": "shared", "on": on, "viewOnly": viewOnly]
        case .remoteScene(let json): ["op": "remoteScene", "scene": (try? JSONSerialization.jsonObject(with: json)) ?? [String: Any]()]
        case .restoreVersion(let json): ["op": "restoreVersion", "scene": (try? JSONSerialization.jsonObject(with: json)) ?? [String: Any]()]
        case .outline(let ids, let move, let all): ["op": "outline", "ids": ids, "move": move, "all": all]
        case .find(let query): ["op": "find", "query": query]
        case .peers(let list): ["op": "peers", "peers": list.map(\.payload)]
        case .refusePictures(let ids): ["op": "refusePictures", "ids": ids]
        case .comments(let pins, let me, let open, let draft, let can, let shapes, let inView):
            ["op": "comments", "pins": pins.map(\.payload), "me": me.payload, "open": open ?? NSNull(), "can": can, "shapes": shapes, "inView": inView,
             "draft": draft.map { d -> Any in ["x": d.x, "y": d.y].merging(d.on.map { ["on": $0] } ?? [:]) { a, _ in a } } ?? NSNull()]
        case .commentHere(let at): ["op": "commentHere"].merging(at.map { ["x": Double($0.x), "y": Double($0.y)] } ?? [:]) { a, _ in a }
        case .focusComment(let id, let above): ["op": "focusComment", "id": id].merging(above.map { ["above": $0] } ?? [:]) { a, _ in a }
        case .follow(let target): target?.payload ?? ["op": "follow", "off": true]
        case .laser(let id, let points): ["op": "laser", "id": id.uuidString, "points": points.map { [Double($0.x), Double($0.y)] }]
        case .votes(let v): v.payload
        case .addCards(let cards, let at):
            ["op": "addCards", "notes": cards.map(\.payload)]
                .merging(at.map { ["x": Double($0.x), "y": Double($0.y)] } ?? [:]) { a, _ in a }
        case .image(let i, let at):
            ["op": "image", "dataURL": i.dataURL, "mimeType": i.mimeType, "width": i.width, "height": i.height]
                .merging(at.map { ["x": Double($0.x), "y": Double($0.y)] } ?? [:]) { a, _ in a }
        }
    }
}

/// What voting shows on the board (BoardTeam): while `on`, a click on a shape or a sticky votes
/// for it and one on your dot takes it back; your dots in your colour; the totals once it ended.
struct CanvasVotes: Equatable, Sendable {
    var on = false
    var dots: [Dot] = []
    var results: [String: Int]?
    struct Dot: Equatable, Sendable {
        var on: String
        var color: String
        var dark: String
    }
    var payload: [String: Any] {
        ["op": "votes", "on": on, "dots": dots.map { ["on": $0.on, "color": $0.color, "dark": $0.dark] }, "results": results ?? NSNull()]
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
    /// Gives the board the keyboard (set by the page view on the Mac): Add Step, Add Column and
    /// Add Report from the selection bar or the menu start typing in the new part, and the keys go
    /// to it, not to the button (round 16: "a new step or column is selected and ready for typing").
    @ObservationIgnored var focusPage: () -> Void = {}

    /// Voting and a timer for a team session (BoardTeam): yours on a board of your own; on a
    /// shared one, joined to its presence (BoardCollab.wire).
    let team = BoardTeamModel()
    /// Someone's colour for their dots (nil: you), light and dark.
    /// On a board of your own, the blue (CollabSession.palette's third).
    @ObservationIgnored var teamColors: (UUID?) -> (light: String, dark: String) = { _ in ("#2D639A", "#3677B9") }
    @ObservationIgnored private var lastVotes: CanvasVotes?

    init() {
        team.pageChanged = { [weak self] in self?.sendVotes() }
    }

    /// What voting shows on the page now.
    var votes: CanvasVotes {
        let c = teamColors(team.me)
        return CanvasVotes(on: team.votingOpen && team.canVote, dots: team.votingOpen ? team.myDots.map { .init(on: $0, color: c.light, dark: c.dark) } : [],
                           results: team.voting?.results)
    }

    func sendVotes() {
        let v = votes
        guard v != lastVotes else { return }
        lastVotes = v
        send(.votes(v))
    }

    func send(_ command: CanvasCommand) {
        if case .grow = command { focusPage() }
        // Can view: no picture goes on the board (the page refuses it too), and it says why.
        if shared, viewOnly, case .image = command { confirm(CollabBoard.Pictures.viewOnly, for: .seconds(3)); return }
        // The last hundred or so: a shared board sends its drawing and the others' pointers often.
        if sent.count >= 200 { sent.removeFirst(100) }
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
        if let ref = m["open"] as? String { openCard(ref); return }
        if let b = m["board"] as? [String: Any] {
            // The pictures its new image elements show come with the change, first.
            if let files = b["files"] as? [String: Any], !files.isEmpty {
                pageFiles.formUnion(files.keys)
                onBoardFiles?(files)
            }
            onBoardDelta?((b["elements"] as? [[String: Any]]) ?? [], (b["settings"] as? [String: Any]) ?? [:])
            return
        }
        if let c = m["comment"] as? [String: Any] { commentMessage(c); return }
        // Voting: a click on a shape, or on one of your dots.
        if let v = m["vote"] as? [String: Any] {
            if let on = v["on"] as? String {
                if team.votesLeft == 0, team.votingOpen { confirm(BoardTeam.votesLeft(0), for: .seconds(2)) }
                team.vote(on: on)
            } else if let off = v["off"] as? String { team.unvote(on: off) }
            return
        }
        if let at = m["commentAt"] { commentMoved(at); return }
        if let names = m["commentShapes"] as? [String: Any] {
            let next = names.compactMapValues { $0 as? String }
            if next != commentShapes { commentShapes = next }
            shapesReported = true
            return
        }
        if let p = m["presence"] as? [String: Any] {
            let xy = (p["pointer"] as? [NSNumber])?.map { CGFloat($0.doubleValue) }
            onPresence?(xy.flatMap { $0.count == 2 ? CGPoint(x: $0[0], y: $0[1]) : nil }, (p["sel"] as? [String]) ?? [])
            onBoardLook?(Self.look(p))
            return
        }
        // You moved the board yourself (or pressed Escape) while following someone.
        if m["unfollow"] as? Bool == true { stopFollowing(); return }
        // A page loaded (the first, or again after the web view's content went away): what it was
        // told about sharing, it's told again.
        if let l = m["load"] as? String, l != load {
            load = l
            pageFiles = []
            if shared { sendShared() }
            onLoad?()
            // Its comments, again, and voting's dots.
            lastPins = nil
            sendPins()
            lastVotes = nil
            if team.running || team.myDots.count > 0 { sendVotes() }
            // And whose view it follows.
            lastFollowTarget = nil
            if let p = followed { applyFollow(p) }
        }
        let next = CanvasState(m)
        // Presenting yourself ends following someone else.
        if next.present != nil, state.present == nil, following != nil { stopFollowing() }
        if !connected {
            connected = true
            // A board opened from "On boards": its card for that note, once the page can take it.
            if let note = focusing { focusing = nil; send(.focusCard(note)) }
            // A board made from the templates gallery: its template, now the page can take it.
            if let t = starting { starting = nil; insert(t) }
            // A board opened from a search: its match (after the first report, so the page has
            // laid the drawing out).
            if let q = finding { finding = nil; Task { @MainActor [weak self] in self?.find(q) } }
        }
        if next != state { state = next }
        if next.cardNotes != cardNotes {
            cardNotes = next.cardNotes
            refreshCards()
        }
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
    /// Renames the board (set by the note's view).
    @ObservationIgnored var rename: ((String) -> Void)?

    /// A template onto the board. A board still called "Whiteboard" takes the template's name, so
    /// the list isn't full of boards called Whiteboard (whiteboard council, round 3, real-01).
    func insert(_ t: WhiteboardTemplate) {
        if title == CanvasNote.title, let rename {
            rename(t.title)
            title = t.title
        }
        send(.insert(t, title: title))
    }
    /// A line confirming what was just done ("Copied as PNG"), shown for a moment over the board.
    var notice: String?

    /// Every picture leaves out a template's how-to line and the band it stood in; the
    /// .excalidraw file keeps it. `page` (a shared board's page, whose heading says the board's
    /// name): the picture leaves out the board's title when it says the same, and the scene
    /// leaves out the how-to line as a picture does (canvas.jsx exportScene).
    func export(_ format: CanvasExport, selected: Bool = false, light: Bool = false, page: String? = nil) async -> Data? {
        await exporter?(format, selected, light, page)
    }

    /// An Undo button beside the notice, for what was done at once (a template deleted).
    var noticeUndo: (() -> Void)?

    /// How long a confirmation stays, whole, before it fades: long enough to read a short line
    /// twice (round 12, 24-note-card-restored: at 1.8 s "Note restored" was caught fading).
    static let noticeTime: Duration = .seconds(2.5)
    /// For the pictures: a confirmation stays until it's taken (as `highlightTime` does).
    nonisolated(unsafe) static var noticeHold: Duration?
    /// Which confirmation is up: a newer one (or the same words again) starts its own time, and an
    /// older one's ending never takes it down early.
    @ObservationIgnored private var noticeTurn = 0

    func confirm(_ text: String, for time: Duration = CanvasController.noticeTime, undo: (() -> Void)? = nil) {
        notice = text
        noticeUndo = undo
        noticeTurn += 1
        let turn = noticeTurn
        let shown = Self.noticeHold ?? time
        Task { @MainActor [weak self] in
            try? await Task.sleep(for: shown)
            guard let self, self.noticeTurn == turn, self.notice == text else { return }
            self.notice = nil; self.noticeUndo = nil
        }
    }

    /// What an AI just drew or changed, outlined over the board with its name for a few seconds
    /// (whiteboard council, round 1: "show what the AI did").
    struct Highlight: Equatable {
        var rect: CGRect
        var by: String
        var count: Int
        /// Whose change it is: an AI's (the accent and its mark), a person's on a shared board (their
        /// colour), your own from another device (neutral), or a search's match (round 14).
        var kind: Kind = .ai
        /// Each thing it added or changed, outlined on its own (whiteboard council, round 3, 16).
        var boxes: [CGRect] = []
        /// What else is drawn nearby, for the name tag to keep clear of: shapes and words.
        var near: [CGRect] = []
        /// …and arrows and lines, as they're drawn (round 10, 16: an arrow's box is a hairline).
        var lines: [Line] = []
        /// Lines of words on their own (a title, a how-to line): the tag never shares a row with
        /// one (round 15).
        var rows: [CGRect] = []
        /// The board's size, for the tag to stay in it.
        var view: CGSize? = nil

        /// A drawn line (or one barb of an arrowhead), in the view's points; its ink reaches
        /// `radius` either side.
        struct Line: Equatable {
            var points: [CGPoint]
            var radius: CGFloat
        }

        enum Kind: Equatable {
            case ai
            /// Someone on a shared board, in their colour ("#RRGGBB" on white, and on a dark board).
            case person(color: String, dark: String)
            /// Another of your devices (its name: "iPhone"), or your own from elsewhere.
            case device
            /// What a search found on the board: outlined, no name.
            case found

            /// Quieter than an AI's: a thinner outline, a shorter time, no receipt.
            var quiet: Bool { self != .ai }
        }

        /// How long it stays: an AI's 4 s, a person's or a device's 3 s, a search's match 2.5 s.
        var time: Double {
            switch kind {
            case .ai: CanvasController.highlightTime
            case .person, .device: min(CanvasController.highlightTime, CanvasController.arrivalTime)
            case .found: min(CanvasController.highlightTime, CanvasController.foundTime)
            }
        }
    }
    var highlight: Highlight?
    @ObservationIgnored private var expecting: (by: String, kind: Highlight.Kind, at: Date)?

    /// An AI's change to this board has arrived (the data store's arrival): the page's report of
    /// where it landed, next, is outlined with its name.
    func arrived(by: String) { expecting = (by, .ai, .now) }

    /// A change from another of your devices (`kind: .device`, its name) or from someone on a
    /// shared board (their name and colour) arrived: outlined for a few seconds, quieter than an
    /// AI's, with no receipt (round 14: "a card added on the other device appears with nothing
    /// to mark it"). A board of your own is outlined from the page's report of what changed; a
    /// shared board's change is named here by its ids (`moved: false`: the view stays yours).
    func arrived(from name: String, kind: Highlight.Kind, ids: [String]? = nil) {
        guard kind == .device || { if case .person = kind { true } else { false } }() else { return }
        expecting = (name, kind, .now)
        if let ids, !ids.isEmpty { send(.outline(ids, move: false)) }
    }

    nonisolated(unsafe) static var arrivalTime: Double = 3
    nonisolated(unsafe) static var foundTime: Double = 2.5

    /// The AI changes seen on this board since it opened, newest last: who, when, what (element
    /// ids). Show Last AI Change, and an AI's reply in a comment thread ("Show change"), outline
    /// one of them again (round 14).
    struct AIChangeMark: Equatable {
        var by: String
        var at: Date
        var ids: [String]
    }
    private(set) var aiChanges: [AIChangeMark] = []

    /// Opened from a search: its first match on the board, in view and outlined for a moment
    /// (round 14). At once when the page is ready, else as soon as it first reports.
    func find(_ query: String) {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else { return }
        guard connected else { finding = q; return }
        expecting = ("", .found, .now)
        send(.find(q))
    }
    @ObservationIgnored private(set) var finding: String?

    private func remoteChange(_ r: [String: Any]) {
        let num = { (k: String) in (r[k] as? Double) ?? (r[k] as? Int).map(Double.init) ?? 0 }
        let rects = { (key: String) in ((r[key] as? [[Any]]) ?? []).compactMap { b -> CGRect? in
            let v = b.compactMap { ($0 as? Double) ?? ($0 as? Int).map(Double.init) }
            return v.count == 4 ? CGRect(x: v[0], y: v[1], width: v[2], height: v[3]) : nil
        } }
        let boxes = rects("boxes"), near = rects("near"), rows = rects("rows")
        let double = { (v: Any) in (v as? Double) ?? (v as? Int).map(Double.init) }
        let lines = ((r["lines"] as? [[String: Any]]) ?? []).compactMap { l -> Highlight.Line? in
            let v = ((l["p"] as? [Any]) ?? []).compactMap(double)
            guard v.count >= 4, let radius = l["r"].flatMap(double) else { return nil }
            return Highlight.Line(points: stride(from: 0, to: v.count - 1, by: 2).map { CGPoint(x: v[$0], y: v[$0 + 1]) }, radius: radius)
        }
        let size = ((r["view"] as? [Any]) ?? []).compactMap(double)
        let view = size.count == 2 ? CGSize(width: size[0], height: size[1]) : nil
        // The view moved under an outline: it moves with it.
        if r["follow"] as? Bool == true {
            if var h = highlight {
                h.rect = CGRect(x: num("x"), y: num("y"), width: num("width"), height: num("height"))
                h.boxes = boxes
                h.near = near
                h.lines = lines
                h.rows = rows
                h.view = view
                highlight = h
            }
            return
        }
        guard let e = expecting, e.at.timeIntervalSinceNow > -5 else { return }
        // A search's match is only taken as one (an AI's change arriving meanwhile isn't).
        guard (r["find"] as? Bool == true) == (e.kind == .found) else { return }
        expecting = nil
        let h = Highlight(rect: CGRect(x: num("x"), y: num("y"), width: num("width"), height: num("height")), by: e.by, count: Int(num("count")),
                          kind: e.kind, boxes: boxes, near: near, lines: lines, rows: rows, view: view)
        highlight = h
        if e.kind == .ai {
            lastChangeBy = e.by
            let ids = ((r["ids"] as? [Any]) ?? []).compactMap { $0 as? String }
            // Shown again (Show Last AI Change, Show change): the same change, not a new one.
            if !ids.isEmpty, aiChanges.last.map({ $0.by == e.by && $0.ids == ids }) != true {
                aiChanges.append(AIChangeMark(by: e.by, at: .now, ids: ids))
                if aiChanges.count > 50 { aiChanges.removeFirst(aiChanges.count - 50) }
            }
        }
        Task { @MainActor [weak self] in
            try? await Task.sleep(for: .seconds(h.time))
            if self?.highlight?.by == h.by, self?.highlight?.count == h.count, self?.highlight?.kind == h.kind { self?.highlight = nil }
        }
    }

    nonisolated(unsafe) static var highlightTime: Double = 4

    /// The AI whose change to this board was outlined last (nil: none since the board opened).
    private(set) var lastChangeBy: String?
    static func showLastChangeTitle(_ by: String?) -> String { by.map { "Show \($0)\u{2019}s Last Change" } ?? "Show Last AI Change" }

    /// Outlines the last AI change again, with its name, and brings it into view.
    func showLastChange() {
        guard let by = lastChangeBy else { return }
        if let last = aiChanges.last(where: { $0.by == by }) { show(last); return }
        arrived(by: by)
        send(.showLastChange)
    }

    /// One AI change outlined again, named, and brought into view (Show change on an AI's reply):
    /// all of it, arrows included.
    func show(_ change: AIChangeMark) {
        arrived(by: change.by)
        send(.outline(change.ids, all: true))
    }

    /// What an AI's comment links to: its change to show, or that the change is gone.
    enum ChangeLink: Equatable {
        case show(AIChangeMark)
        /// Every element its write changed is off the board now.
        case gone
    }

    /// An AI's comment and its change: the elements its write changed, kept with it (`changes`),
    /// those still on the board; when there are none any more, `gone`. A comment from before
    /// `changes` finds its change among those this board saw since it opened (`change(for:)`).
    /// Nil for a person's comment, or when there's nothing to show.
    func changeLink(for comment: BoardComment) -> ChangeLink? {
        guard comment.ai != nil, !comment.deleted else { return nil }
        guard !comment.changes.isEmpty else { return change(for: comment).map(ChangeLink.show) }
        // Before the page has said which are there, all of them: Show change outlines what is.
        let here = shapesReported ? comment.changes.filter { commentShapes[$0] != nil } : comment.changes
        guard !here.isEmpty else { return .gone }
        return .show(AIChangeMark(by: byline(comment), at: comment.date ?? .now, ids: here))
    }

    static let changeGone = "That change is no longer on the board"

    /// The change an AI's comment speaks of: that AI's change to this board made closest before it
    /// (up to ten minutes), else just after it (a minute: it wrote first, then drew). Nil for a
    /// person's comment, or when this board hasn't seen a change of that AI's since it opened.
    func change(for comment: BoardComment) -> AIChangeMark? {
        guard let ai = comment.ai, !comment.deleted, let at = comment.date else { return nil }
        let mine = aiChanges.filter { AIEdit.sameAI($0.by, ai) }
        let before = mine.filter { $0.at <= at.addingTimeInterval(5) && $0.at >= at.addingTimeInterval(-600) }
        if let b = before.max(by: { $0.at < $1.at }) { return b }
        return mine.filter { $0.at > at && $0.at <= at.addingTimeInterval(60) }.min { $0.at < $1.at }
    }

    // MARK: Shared with people

    /// The board is shared (CollabBoard): what you draw goes out as changes, through the note's
    /// shared document, and the page's own store isn't written.
    private(set) var shared = false
    /// You can only look (Can view): no tools, no style controls, the engine in its view mode.
    private(set) var viewOnly = false
    /// Can comment: the drawing is view only and comments go on it; the toolbar has no drawing tools.
    var commentsOnly: Bool { viewOnly && canComment }
    /// The elements the page changed and the board's settings, for the shared document (set by
    /// the note's view).
    @ObservationIgnored var onBoardDelta: (([[String: Any]], [String: Any]) -> Void)?
    /// Your pointer, in the board's own coordinates (nil: off the board), and selection.
    @ObservationIgnored var onPresence: ((CGPoint?, [String]) -> Void)?
    /// The pictures a change from the page shows that it hadn't sent before (`{ id, dataURL,
    /// mimeType, created }` by file id), handed over just before the change itself.
    @ObservationIgnored var onBoardFiles: (([String: Any]) -> Void)?
    /// The pictures the page has (sent to it, or by it), so each crosses once: a shared board's
    /// whole drawing goes to the page on every change from someone else.
    @ObservationIgnored private(set) var pageFiles: Set<String> = []
    /// The page loaded: the note's view sends it the drawing and the others again.
    @ObservationIgnored var onLoad: (() -> Void)?
    @ObservationIgnored private var load: String?
    @ObservationIgnored private(set) var peers: [BoardPeer] = []

    /// Shares the board, or stops (the shared session opened or closed).
    func share(_ on: Bool, viewOnly: Bool = false) {
        let view = on && viewOnly
        guard on != shared || view != self.viewOnly else { return }
        shared = on
        self.viewOnly = view
        if view { showingStyle = false; showingLibrary = false }
        if !on, !peers.isEmpty { peers = [] }
        if !on { stopFollowing(); if !people.isEmpty { people = [] } }
        if !on { pageFiles = [] }
        sendShared()
        // Can comment: comments go on the board in the engine's view mode too.
        if canComment { sendPins() }
    }

    private func sendShared() {
        send(.shared(on: shared, viewOnly: viewOnly))
        if !shared { send(.peers([])) }
    }

    /// The shared document's drawing, into the page, with only the pictures it doesn't have yet.
    func remote(scene: [String: Any]) {
        guard shared else { return }
        var scene = scene
        if let files = scene["files"] as? [String: Any] {
            let new = files.filter { !pageFiles.contains($0.key) }
            pageFiles.formUnion(new.keys)
            scene["files"] = new
        }
        guard JSONSerialization.isValidJSONObject(scene), let json = try? JSONSerialization.data(withJSONObject: scene) else { return }
        send(.remoteScene(json))
    }

    /// What an AI just changed on the shared board: outlined with its name, as for a board of your own.
    func outline(by: String, ids: [String]) {
        guard shared, !ids.isEmpty else { return }
        arrived(by: by)
        send(.outline(ids))
    }

    /// The others on the board, sent when they change.
    func show(peers list: [BoardPeer]) {
        guard shared, list != peers else { return }
        peers = list
        send(.peers(list))
    }

    // MARK: Following someone (BoardFollow)

    /// Everyone else on a shared board, for following them: who presents, where each one looks.
    private(set) var people: [BoardPerson] = []
    /// Whose view you follow: a presenter's (the banner's Follow), or anyone's (Follow from the avatars).
    private(set) var following: UUID?
    /// You followed them because they were presenting: their Done ends it.
    @ObservationIgnored private(set) var followingPresenter = false
    @ObservationIgnored private var lastFollowTarget: BoardFollow.Target?
    /// Tells the others whose view you follow (set by the wiring).
    @ObservationIgnored var onFollow: ((UUID?) -> Void)?
    /// What you present and see, and your laser's trail, for the others (set by the wiring).
    @ObservationIgnored var onBoardLook: ((BoardLook) -> Void)?

    /// The person you follow, while they're on the board.
    var followed: BoardPerson? { following.flatMap { id in people.first { $0.id == id } } }
    /// What the banner over the board says: someone presenting (Follow), or whom you follow.
    var followBanner: BoardFollow.Banner? { shared ? BoardFollow.banner(people: people, following: following, presentingHere: state.present != nil) : nil }
    /// The people following you (the Present bar counts them).
    var followers: [BoardPerson] { BoardFollow.followers(of: UUID(uuidString: author.id), in: people) }

    /// Everyone else on the board, as their presence says: followed views move with them.
    func show(people list: [BoardPerson]) {
        guard shared || list.isEmpty else { return }
        if list != people { people = list }
        guard let id = following else { return }
        // They left, or ended the presentation you followed: following ends where it is.
        guard let p = list.first(where: { $0.id == id }), !(followingPresenter && p.presenting == nil) else { stopFollowing(); return }
        applyFollow(p)
    }

    /// Follows someone on the board: your view goes where theirs is, and moves with it.
    func follow(_ id: UUID) {
        guard shared, let p = people.first(where: { $0.id == id }) else { return }
        if following != id { onFollow?(id) }
        following = id
        followingPresenter = p.presenting != nil
        lastFollowTarget = nil
        applyFollow(p)
    }

    /// Stops following (Stop following, Escape, your own move of the board).
    func stopFollowing() {
        guard following != nil else { return }
        following = nil
        followingPresenter = false
        lastFollowTarget = nil
        onFollow?(nil)
        send(.follow(nil))
    }

    private func applyFollow(_ p: BoardPerson) {
        guard let target = BoardFollow.target(for: p), target != lastFollowTarget else { return }
        lastFollowTarget = target
        send(.follow(target))
    }

    /// Someone's laser trail, drawn on the board as it fades.
    func laser(from id: UUID, points: [CGPoint]) {
        guard shared, !points.isEmpty else { return }
        send(.laser(id, points))
    }

    /// What the page says of your view with your pointer (BoardFollow).
    static func look(_ p: [String: Any]) -> BoardLook {
        let nums = { (k: String) in (p[k] as? [Any])?.compactMap { ($0 as? NSNumber)?.doubleValue } }
        var presenting: BoardPresenting?
        if let pr = p["present"] as? [String: Any], let i = (pr["i"] as? NSNumber)?.intValue, let n = (pr["n"] as? NSNumber)?.intValue {
            presenting = BoardPresenting(frame: pr["frame"] as? String, i: i, n: n).checked
        }
        let laser = (p["laser"] as? [Any]).map { list in BoardFollow.points(list.compactMap { ($0 as? [Any])?.compactMap { ($0 as? NSNumber)?.doubleValue } }) }
        return BoardLook(presenting: presenting, view: BoardFollow.rect(nums("view")), laser: laser)
    }

    /// Sends the others again (a page that just loaded).
    func resendPeers() { if shared { send(.peers(peers)) } }

    // MARK: Comments

    /// Every comment on the board, threads and replies, as its storage holds them: the board's page
    /// data, or a shared board's document (BoardComments).
    private(set) var comments: [BoardComment] = []
    /// The threads, oldest first.
    var threads: [BoardThread] { BoardComments.threads(comments) }
    /// You can add comments here: on your own board, and on a shared one you can edit or comment
    /// on (Can comment: the drawing stays view only, `viewOnly`). A viewer reads them.
    private(set) var canComment = true
    /// You, as your comments say: your account's id and first name (set by the wiring).
    @ObservationIgnored var author = BoardComments.Author(id: "me", name: "You")
    /// Each writer's colour on this board ("#RRGGBB"), by account id: on a shared board, the one
    /// their pointer has.
    @ObservationIgnored var colorOf: (String) -> String = { BoardComments.color(for: $0) }
    /// Keeps comments of yours (new ones, replies, a thread resolved) in the board's storage.
    @ObservationIgnored var onComments: (([BoardComment]) -> Void)?
    /// The people you can mention here (@Sara): the board's other people (a shared board's
    /// members), never you. Nobody on a board of your own.
    var mentionable: [BoardComments.Person] = []
    /// What each comment's shape is called ("Idea", "Rectangle"), by element id, as the page says:
    /// the list names where a thread is.
    private(set) var commentShapes: [String: String] = [:]
    /// The page has said which of the shapes asked about are on the board (`commentShapes`).
    private(set) var shapesReported = false
    /// What you've seen, per board, on this device.
    @ObservationIgnored var seenStore = BoardComments.Seen()
    @ObservationIgnored private var seen: (board: UUID, ids: Set<String>)?
    /// The clock comments are stamped with; tests set it.
    @ObservationIgnored var now: () -> Date = { .now }
    @ObservationIgnored private var lastPins: CanvasCommand?

    /// The thread whose popover is open.
    private(set) var openThread: String?
    /// A comment being written, and where it goes.
    private(set) var draft: BoardComments.Place?
    /// Where the open thread's pin (or the new comment's) is, in the page's points: the popover's
    /// anchor. Nil until the page says.
    private(set) var commentAnchor: CGRect?
    /// When a thread or a new comment last opened: a popover that closed just before it (a click on
    /// another pin closes the one that was open) doesn't close it.
    @ObservationIgnored private(set) var commentOpenedAt = Date.distantPast
    /// The Comments list is open.
    var showingComments = false {
        didSet { if showingComments, !oldValue { markSeen() } }
    }
    /// Where a thread opens over the board, as a fraction of its height from the top that stays in
    /// sight: on iPhone a thread is a sheet over the lower half, and its pin moves above it. Nil:
    /// a popover beside the pin (Mac).
    @ObservationIgnored var focusRoom: Double?
    /// The comment of yours being changed in its thread.
    var editingComment: String?
    /// The comment of yours that Delete asks about.
    var deletingComment: String?
    /// The list shows resolved threads too.
    var showResolved = false
    /// A comment from someone else (a person, or an AI) that you haven't seen: a quiet dot on the
    /// Comments button.
    private(set) var unseen = false

    /// The board's comments, from its storage (on opening, and whenever they change).
    func show(comments list: [BoardComment]) {
        if list != comments { comments = list }
        if let open = openThread, !comments.contains(where: { $0.id == open }) { closeThread() }
        updateUnseen()
        sendPins()
    }

    /// Whether you can comment (your access changed).
    func setCanComment(_ can: Bool) {
        guard can != canComment else { return }
        canComment = can
        if !can {
            draft = nil
            if state.tool == .comment { pick(.selection) }
        }
        sendPins()
    }

    /// A comment of yours, as opposed to someone else's or an AI's.
    func isMine(_ c: BoardComment) -> Bool { (c.by == author.id || c.by == "me") && c.ai == nil }

    /// Who wrote it, as the thread says it.
    func byline(_ c: BoardComment) -> String { isMine(c) ? author.name : BoardComments.byline(c, me: author.id) }

    /// Its writer's colour: an AI's is neutral graphite (BoardComments.aiColor), with its mark.
    func color(of c: BoardComment) -> String { c.ai == nil ? colorOf(c.by) : BoardComments.aiColor }

    /// Where a thread is, as the list says it: "on Idea", "on the board".
    func place(of t: BoardThread) -> String {
        guard let on = t.first.on else { return Self.onBoard }
        guard let name = commentShapes[on] else { return Self.onShape }
        return "on \(name)"
    }

    static let onBoard = "on the board"
    static let onShape = "on a shape"

    /// The first names of the people with these account ids (you among them), for a comment's
    /// mentions to be set apart.
    func names(of ids: [String]) -> [String] {
        ids.compactMap { id in id == author.id ? author.name : mentionable.first { $0.id == id }?.name }
    }

    /// A comment from someone else that mentions you.
    func mentionsMe(_ c: BoardComment) -> Bool { !c.deleted && !isMine(c) && c.mentions.contains(author.id) }

    /// A thread with a mention of you you haven't opened.
    func unreadMention(_ t: BoardThread) -> Bool {
        guard let board = noteID else { return false }
        let seen = mentionsSeen?.board == board ? mentionsSeen!.keys : seenStore.mentions(board)
        return t.all.contains { mentionsMe($0) && !seen.contains(BoardComments.Seen.mentionKey($0)) }
    }

    private func updateUnseen() {
        guard let board = noteID else { return }
        if seen?.board != board {
            // The first look at this board here: what it has now counts as seen.
            if let ids = seenStore.ids(board) { seen = (board, ids) } else {
                seen = (board, Set(comments.map(\.id)))
                seenStore.set(seen!.ids, for: board)
            }
        }
        let ids = seen?.ids ?? []
        // A mention of you counts until you open its thread, even on a board first looked at here.
        let new = comments.contains { !ids.contains($0.id) && !isMine($0) && !$0.deleted } || threads.contains(where: unreadMention)
        if new != unseen { unseen = new }
    }

    @ObservationIgnored private var mentionsSeen: (board: UUID, keys: Set<String>)?

    /// You opened a thread: its mentions of you count as read.
    private func readMentions(in thread: String) {
        guard let board = noteID, let t = threads.first(where: { $0.id == thread }) else { return }
        let mine = t.all.filter(mentionsMe).map(BoardComments.Seen.mentionKey)
        guard !mine.isEmpty else { return }
        var keys = mentionsSeen?.board == board ? mentionsSeen!.keys : seenStore.mentions(board)
        guard !keys.isSuperset(of: mine) else { return }
        keys.formUnion(mine)
        mentionsSeen = (board, keys)
        seenStore.setMentions(keys, for: board)
    }

    /// You looked (the list, or a thread): every comment so far counts as seen.
    func markSeen() {
        guard let board = noteID else { if unseen { unseen = false }; return }
        let ids = (seen?.board == board ? seen!.ids : seenStore.ids(board) ?? []).union(comments.map(\.id))
        seen = (board, ids)
        seenStore.set(ids, for: board)
        if let open = openThread { readMentions(in: open) }
        // A mention of you you haven't opened keeps the dot.
        let still = threads.contains(where: unreadMention)
        if unseen != still { unseen = still }
    }

    /// The pins the page draws: every open thread, and the one open now even when it's resolved.
    var pins: [BoardComments.Pin] {
        threads.filter { !$0.resolved || $0.id == openThread }.map { t in
            BoardComments.Pin(id: t.id, on: t.first.on, x: t.first.x, y: t.first.y, color: color(of: t.first),
                              letter: BoardComments.initial(t.first), open: t.id == openThread, mark: t.first.ai.flatMap(BoardComments.markPicture))
        }
    }

    /// The shapes the threads are on, and what AIs' comments changed, for the page to name
    /// (commentShapes): a name says it's on the board.
    var commentedShapes: [String] {
        Array(Set(threads.compactMap(\.first.on) + comments.filter { $0.ai != nil && !$0.deleted }.flatMap(\.changes))).sorted()
    }

    /// Sends the pins when they changed (and again for a page that just loaded).
    func sendPins() {
        let me = BoardComments.Pin(id: "me", x: 0, y: 0, color: colorOf(author.id),
                                   letter: String(author.name.trimmingCharacters(in: .whitespaces).first.map { String($0).uppercased() } ?? "?"))
        let c = CanvasCommand.comments(pins, me: me, open: openThread ?? (draft == nil ? nil : "draft"), draft: draft, canComment: canComment, shapes: commentedShapes,
                                       inView: canComment && viewOnly)
        guard c != lastPins else { return }
        // Nothing to say to a page that has never had a comment and takes them as it starts (it
        // starts with comments allowed, and not on a view-only board: Can comment has to say so).
        if lastPins == nil, comments.isEmpty, draft == nil, canComment, !viewOnly { lastPins = c; return }
        lastPins = c
        send(c)
    }

    /// The Comment tool: the next click on the board places a comment (C).
    func startCommenting() {
        guard canComment else { return }
        pick(.comment)
    }

    /// The list's New Comment: the list closes and the Comment tool is picked (as C does).
    func newComment() {
        showingComments = false
        startCommenting()
    }

    /// A comment on what's selected (the bar's Comment, the right-click menu's), or at a point of
    /// the page (the right-click menu with nothing selected).
    func comment(at point: CGPoint? = nil) {
        guard canComment else { return }
        send(.commentHere(point))
    }

    private func commentMessage(_ m: [String: Any]) {
        if let n = m["new"] as? [String: Any] {
            guard canComment, let x = (n["x"] as? NSNumber)?.doubleValue, let y = (n["y"] as? NSNumber)?.doubleValue, x.isFinite, y.isFinite else { return }
            openThread = nil
            showingComments = false
            draft = BoardComments.Place(on: n["on"] as? String, x: x, y: y)
            commentAnchor = nil
            commentOpenedAt = .now
            sendPins()
            // Over a sheet (iPhone): its pin moves up out of the sheet's way.
            if let room = focusRoom { send(.focusComment("draft", above: room)) }
        } else if let id = m["open"] as? String {
            open(thread: id)
        }
    }

    private func commentMoved(_ at: Any) {
        guard let a = at as? [String: Any], let id = a["id"] as? String, id == (openThread ?? (draft == nil ? nil : "draft")) else { return }
        let n = { (k: String) in (a[k] as? NSNumber).map { CGFloat($0.doubleValue) } }
        guard let x = n("x"), let y = n("y") else { if commentAnchor != nil { commentAnchor = nil }; return }
        let r = CGRect(x: x, y: y, width: n("width") ?? 24, height: n("height") ?? 24)
        let box = { (v: Any?) -> CGRect? in
            let q = ((v as? [Any]) ?? []).compactMap { ($0 as? NSNumber).map { CGFloat($0.doubleValue) } }
            return q.count == 4 ? CGRect(x: q[0], y: q[1], width: q[2], height: q[3]) : nil
        }
        let around = CommentSurroundings(on: box(a["on"]), near: ((a["near"] as? [Any]) ?? []).compactMap(box))
        if around != commentAround { commentAround = around }
        if r != commentAnchor { commentAnchor = r }
    }

    /// What's drawn round the open pin (the shape it's on, and what's near), in the view's points:
    /// the thread hangs where it covers none of it, when there's room (round 14).
    struct CommentSurroundings: Equatable {
        var on: CGRect?
        var near: [CGRect] = []
    }
    private(set) var commentAround = CommentSurroundings()

    /// Opens a thread's popover (its pin clicked, or its row in the list), its pin brought into view.
    func open(thread id: String) {
        guard comments.contains(where: { $0.id == id && !$0.isReply }) else { return }
        draft = nil
        openThread = id
        commentAnchor = nil
        commentOpenedAt = .now
        editingComment = nil
        markSeen()
        sendPins()
        send(.focusComment(id, above: focusRoom))
    }

    /// The thread's popover closed.
    func closeThread() {
        guard openThread != nil || draft != nil || commentAnchor != nil else { return }
        openThread = nil
        draft = nil
        commentAnchor = nil
        editingComment = nil
        sendPins()
    }

    /// The popover closed by itself (a click outside it): unless another thread opened just now.
    func popoverClosed() {
        guard Date.now.timeIntervalSince(commentOpenedAt) > 0.3 else { return }
        closeThread()
    }

    /// Posts the comment being written. Its thread stays open, for a reply.
    @discardableResult
    func post(_ text: String) -> BoardComment? {
        guard let place = draft, canComment, let t = Self.clean(text) else { return nil }
        let c = BoardComment(id: BoardComments.newID(), on: place.on, x: place.x, y: place.y, by: author.id, name: author.name,
                             text: t, created: BoardComments.stamp(now()), mentions: BoardComments.mentioned(in: t, people: mentionable))
        draft = nil
        openThread = c.id
        commentOpenedAt = .now
        apply([c])
        return c
    }

    @discardableResult
    func reply(to thread: String, _ text: String) -> BoardComment? {
        guard canComment, comments.contains(where: { $0.id == thread && !$0.isReply }), let t = Self.clean(text) else { return nil }
        let c = BoardComment(id: BoardComments.newID(), thread: thread, by: author.id, name: author.name, text: t, created: BoardComments.stamp(now()),
                             mentions: BoardComments.mentioned(in: t, people: mentionable))
        apply([c])
        return c
    }

    /// A comment of yours, changed: its new words, marked edited. Nil for one that isn't yours,
    /// is deleted, or reads the same.
    @discardableResult
    func edit(_ id: String, _ text: String) -> BoardComment? {
        guard canComment, var c = comments.first(where: { $0.id == id }), isMine(c), !c.deleted, let t = Self.clean(text), t != c.text else {
            if editingComment == id { editingComment = nil }
            return nil
        }
        c.text = t
        c.edited = BoardComments.stamp(now())
        c.mentions = BoardComments.mentioned(in: t, people: mentionable)
        c.version = BoardComments.next(c)
        editingComment = nil
        apply([c])
        return c
    }

    /// Deletes a comment of yours (Delete asked first, in its thread). Its words go; a thread
    /// start with replies stays as "Comment deleted" so they still read in place. Undo puts it back.
    func delete(_ id: String) {
        deletingComment = nil
        guard canComment, var c = comments.first(where: { $0.id == id }), isMine(c), !c.deleted else { return }
        let kept = c
        c.deleted = true
        c.text = ""
        c.edited = nil
        c.mentions = []
        c.version = BoardComments.next(c)
        if editingComment == id { editingComment = nil }
        apply([c])
        if !c.isReply, openThread == id, !threads.contains(where: { $0.id == id }) { closeThread() }
        confirm(Self.deletedLine, for: .seconds(4), undo: { [weak self] in
            guard let self, var back = self.comments.first(where: { $0.id == id }), back.deleted else { return }
            back.deleted = false
            back.text = kept.text
            back.edited = kept.edited
            back.mentions = kept.mentions
            back.version = BoardComments.next(back)
            self.apply([back])
        })
    }

    /// Resolves a thread (it goes from the board and stays in the list), or opens it again.
    func resolve(_ thread: String, _ resolved: Bool = true) {
        guard canComment, var first = comments.first(where: { $0.id == thread && !$0.isReply }), first.resolved != resolved else { return }
        first.resolved = resolved
        first.version = BoardComments.next(first)
        apply([first])
        if resolved, openThread == thread { closeThread() }
        confirm(resolved ? Self.resolvedLine : Self.reopenedLine, for: .seconds(4), undo: { [weak self] in self?.resolve(thread, !resolved) })
    }

    private func apply(_ changed: [BoardComment]) {
        var list = comments
        for c in changed {
            if let i = list.firstIndex(where: { $0.id == c.id }) { list[i] = c } else { list.append(c) }
        }
        comments = list
        onComments?(changed)
        markSeen()
        sendPins()
    }

    static let resolvedLine = "Comment resolved"
    static let deletedLine = "Comment deleted"
    static let reopenedLine = "Comment opened again"

    /// What's posted: trimmed, never empty, at most BoardComments.maxText characters.
    static func clean(_ text: String) -> String? {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : String(t.prefix(BoardComments.maxText))
    }

    // MARK: Note cards

    /// The board's own note: never a card on itself.
    @ObservationIgnored var noteID: UUID?
    /// What each card's note says, by what the card names (a note's id, or an AI's title for
    /// it). Set by the note's view (CanvasNoteCard.info).
    @ObservationIgnored var cardInfo: (([String]) -> [String: CanvasNoteCard])?
    /// Opens a note in the window (set by the note's view).
    @ObservationIgnored var openNote: ((UUID) -> Void)?
    /// Takes a note out of Recently Deleted (set by the note's view).
    @ObservationIgnored var restoreNote: ((UUID) -> Void)?
    /// The notes cards name that are in Recently Deleted, by what the card names: their card's
    /// bar offers Restore Note.
    private(set) var restorable: Set<String> = []
    /// The notes the cards name, as the page last said, and the notes those turned out to be.
    @ObservationIgnored private(set) var cardNotes: [String] = []
    @ObservationIgnored private(set) var cardIDs: Set<UUID> = []
    /// The note picker is open (Add Note Card…).
    var choosingNote = false

    /// Each card says what its note says now: sent whenever the board's cards change, and when
    /// one of their notes is saved.
    func refreshCards() {
        guard let cardInfo, !cardNotes.isEmpty else { return }
        let info = cardInfo(cardNotes)
        cardIDs = Set(info.values.compactMap(\.id))
        let trashed = Set(info.filter(\.value.restorable).keys)
        if trashed != restorable { restorable = trashed }
        send(.cards(info))
    }

    /// Restore Note, on a card whose note is in Recently Deleted: the note comes back, and its card
    /// says what it says again.
    func restoreCard(_ ref: String) {
        guard let card = cardInfo?([ref])[ref], card.restorable, let id = card.id else { return }
        restoreNote?(id)
        refreshCards()
        confirm("Note restored")
    }

    /// Notes were saved (nil: something was deleted for good): cards for them say what they say
    /// now. A card that names a note by a title no note has yet looks again on every save.
    func notesChanged(_ ids: Set<UUID>?) {
        guard !cardNotes.isEmpty else { return }
        if let ids, cardIDs.isDisjoint(with: ids), cardNotes.allSatisfy({ UUID(uuidString: $0) != nil }) { return }
        refreshCards()
    }

    /// Notes onto the board as cards (a drop at a point of the page, or the picker's choice).
    func addCards(_ ids: [UUID], at point: CGPoint? = nil) {
        guard let cardInfo else { return }
        let refs = ids.filter { $0 != noteID }.prefix(10).map(\.uuidString)
        let info = cardInfo(Array(refs))
        let cards = refs.compactMap { info[$0] }.filter { $0.id != nil && !$0.deleted }
        guard !cards.isEmpty else { return }
        send(.addCards(cards, at: point))
    }

    /// The card waiting for the page to be ready, to be selected and brought into view.
    @ObservationIgnored private(set) var focusing: UUID?
    /// The template waiting for the page to be ready (a board made from the templates gallery).
    @ObservationIgnored private(set) var starting: WhiteboardTemplate?

    /// Starts the board from a template: at once when the page is ready, else as soon as it first reports.
    func start(_ t: WhiteboardTemplate) {
        if connected { insert(t) } else { starting = t }
    }

    /// Selects `note`'s card and brings it into view: at once when the page is ready, else as
    /// soon as it first reports (a board just opened from "On boards").
    func focusCard(_ note: UUID) {
        if connected { send(.focusCard(note)) } else { focusing = note }
    }

    /// A card was opened (double-click, ⌘-click, Open Note): its note, or why not.
    func openCard(_ ref: String) {
        guard let card = cardInfo?([ref])[ref] else {
            // On a board shared with you: a card for one of the owner's notes.
            if shared { confirm("This note isn\u{2019}t shared with you") }
            return
        }
        guard !card.deleted, let id = card.id else {
            confirm(card.preview == CanvasNoteCard.missingText ? "No note has this title" : "This note was deleted")
            return
        }
        guard id != noteID else { return }
        openNote?(id)
    }

    func pick(_ tool: CanvasTool) { send(.tool(tool)) }
    func run(_ action: CanvasCommand.Action) { send(.action(action)) }
    func set(_ key: CanvasCommand.StyleKey, _ value: CanvasCommand.Value) { send(.style(key, value)) }

    // MARK: The library

    /// Asks the page something and waits for the answer (canvas.jsx `amber._canvasCall`): set by
    /// the page view while it shows.
    @ObservationIgnored var call: ((String, [String: Any]) async -> Any?)?
    /// The library is open: the popover on the Mac, the sheet on iPhone. Opening it brings what
    /// changed on the account's other devices.
    var showingLibrary = false { didSet { if showingLibrary, !oldValue { CanvasLibrary.shared.looked() } } }
    /// The library item whose name is being typed in the popover (right-click › Rename…).
    var renamingLibraryItem: String?
    /// The Present bar's Order list is open.
    var showingPresentOrder = false
    /// Items whose picture the page couldn't draw, not asked again this time.
    @ObservationIgnored private var undrawable: Set<String> = []

    static let savedTitle = "Saved to library"

    /// What's selected, kept in the library as one item (the selection bar's More menu and the
    /// right-click menu: Save to Library), with its picture. Nil with nothing selected.
    @discardableResult
    func saveSelectionToLibrary(_ library: CanvasLibrary = .shared) async -> CanvasLibraryItem? {
        guard let json = await call?("libraryPiece", [:]) as? String,
              let piece = (try? JSONSerialization.jsonObject(with: Data(json.utf8))) as? [String: Any],
              let item = library.add(elements: piece["elements"] as? [[String: Any]] ?? [], files: piece["files"] as? [String: Any] ?? [:]) else {
            confirm("Select something to save it to the library")
            return nil
        }
        confirm(Self.savedTitle)
        if let png = await picture(of: item) { library.setThumbnail(png, for: item.id) }
        return item
    }

    // MARK: Your templates

    static let templateSavedTitle = "Saved as template"
    static let templateDeletedTitle = "Template deleted"

    /// Save as Template… asking for its name (NoteDetailView asks): the whole board (the More
    /// menu), or what's selected (the right-click menu and the selection bar's More; round 15: a
    /// frame takes what's in it).
    enum TemplateSource: Equatable { case board, selection }
    var namingTemplate: TemplateSource?
    func askTemplateName(_ source: TemplateSource) { namingTemplate = source }

    /// The whole board kept as one of your templates (the More menu's Save as Template…), or what's
    /// selected (`selection`): its elements, the how-to line among them, and its pictures. Nil on
    /// an empty board or with nothing selected, and it says so.
    @discardableResult
    func saveAsTemplate(named name: String, selection: Bool = false, _ templates: WhiteboardTemplates = .shared) async -> CanvasLibraryItem? {
        guard let json = await call?("boardPiece", selection ? ["selection": true] : [:]) as? String,
              let piece = (try? JSONSerialization.jsonObject(with: Data(json.utf8))) as? [String: Any],
              let item = templates.add(name: name.isEmpty ? title : name, elements: piece["elements"] as? [[String: Any]] ?? [],
                                       files: piece["files"] as? [String: Any] ?? [:]) else {
            confirm(selection ? "Select something to save it as a template" : "Draw something to save it as a template")
            return nil
        }
        confirm(Self.templateSavedTitle)
        return item
    }

    /// One of your templates onto the board, as a built-in one (`insert(_:)`): a board still
    /// called "Whiteboard" takes the template's name; one with its own name keeps it, and the
    /// template's title line says it.
    func insertTemplate(_ item: CanvasLibraryItem) {
        let name = item.name ?? CanvasNote.title
        if title == CanvasNote.title, name != CanvasNote.title, let rename {
            rename(name)
            title = name
        }
        send(.template(item, title: title))
    }

    /// Deletes one of your templates (after Delete is confirmed); the notice offers Undo, which
    /// puts it back where it was.
    func deleteTemplate(_ id: String, _ templates: WhiteboardTemplates = .shared) {
        guard let gone = templates.remove(id) else { return }
        confirm(Self.templateDeletedTitle, for: .seconds(6)) { [weak self, weak templates] in
            templates?.restore(gone.item, at: gone.index)
            self?.notice = nil
            self?.noticeUndo = nil
        }
    }

    /// A library item onto the board: in a free spot in the middle of the view, or where it was
    /// dropped (a point of the page).
    func insert(_ item: CanvasLibraryItem, at point: CGPoint? = nil) {
        send(.libraryInsert(item, at: point))
    }

    /// A scene (a version from the board's History) drawn as the board draws it: a PNG on the
    /// board's ground, in the look the app has now.
    func picture(of scene: [String: Any], dark: Bool = false) async -> Data? {
        let background = (scene["appState"] as? [String: Any])?["viewBackgroundColor"] as? String ?? "#ffffff"
        guard let b64 = await call?("versionPicture", ["elements": scene["elements"] ?? [Any](), "files": scene["files"] ?? [String: Any](),
                                                       "dark": dark, "background": background]) as? String else { return nil }
        return Data(base64Encoded: b64)
    }

    /// An item drawn by the board as it would draw it: a PNG, light, on a clear background.
    func picture(of item: CanvasLibraryItem) async -> Data? {
        guard let b64 = await call?("libraryPreview", ["elements": item.elements, "files": item.files]) as? String else { return nil }
        return Data(base64Encoded: b64)
    }

    /// Pictures for the items that have none yet (imported ones, or ones from before), one at a
    /// time while the library shows. Until then a tile shows the item's outline (CanvasSketch).
    func drawThumbnails(_ library: CanvasLibrary = .shared) async {
        for item in library.items where library.thumbnails[item.id] == nil && !undrawable.contains(item.id) {
            guard call != nil, !Task.isCancelled else { return }
            if let png = await picture(of: item) { library.setThumbnail(png, for: item.id) } else { undrawable.insert(item.id) }
        }
    }
}

// MARK: The whiteboard library

/// One thing in the whiteboard library: elements as Excalidraw keeps them in a library (one
/// `libraryItems` entry of a .excalidrawlib file), and the pictures its images show.
struct CanvasLibraryItem: Identifiable, Equatable, Sendable {
    var id: String
    /// Imported libraries name their items ("Server", "Database"); a saved one is named by its words.
    var name: String?
    /// The library file it came from, as the popover groups it ("Data flow"); nil when you saved it.
    var source: String?
    /// When it was made, in milliseconds since 1970, as Excalidraw keeps it.
    var created: Double
    /// The elements, as a JSON array.
    var elementsJSON: Data
    /// The pictures its image elements show ({ fileId: { id, dataURL, mimeType, created } }), as
    /// JSON; nil without any. Excalidraw's own library leaves them out, so its images come in empty.
    var filesJSON: Data?

    var elements: [[String: Any]] { ((try? JSONSerialization.jsonObject(with: elementsJSON)) as? [[String: Any]]) ?? [] }
    var files: [String: Any] { filesJSON.flatMap { (try? JSONSerialization.jsonObject(with: $0)) as? [String: Any] } ?? [:] }

    /// Nil when nothing is left to keep (no elements, or only deleted ones).
    init?(id: String = UUID().uuidString, name: String? = nil, source: String? = nil, created: Double = Date.now.timeIntervalSince1970 * 1000,
          elements: [[String: Any]], files: [String: Any] = [:]) {
        let kept = elements.filter { ($0["type"] as? String) != nil && ($0["isDeleted"] as? Bool) != true }
        guard !kept.isEmpty, JSONSerialization.isValidJSONObject(kept), let json = try? JSONSerialization.data(withJSONObject: kept) else { return nil }
        let used = Set(kept.compactMap { $0["fileId"] as? String })
        let pictures = files.filter { used.contains($0.key) }
        self.id = id
        let words = CanvasSketch(elements: kept).texts.joined(separator: " \u{00B7} ")
        self.name = name.flatMap { $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : $0 } ?? (words.isEmpty ? nil : String(words.prefix(60)))
        self.source = source.flatMap { $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : $0 }
        self.created = created
        elementsJSON = json
        filesJSON = pictures.isEmpty || !JSONSerialization.isValidJSONObject(pictures) ? nil : try? JSONSerialization.data(withJSONObject: pictures)
    }

    /// As a .excalidrawlib (version 2) item; `files` is Pinto's own, which Excalidraw passes over.
    var libraryItem: [String: Any] {
        var out: [String: Any] = ["id": id, "status": "unpublished", "created": created, "elements": elements]
        if let name { out["name"] = name }
        if let source { out[CanvasLibraryFile.sourceKey] = source }
        if filesJSON != nil { out["files"] = files }
        return out
    }

    /// What the library shows under its picture: its name (yours, or its library's), or what it
    /// is: "Right triangle", "Blue rectangle", "Arrow", "3 rectangles" (round 7: two different
    /// triangles were both "Line").
    var title: String {
        if let name { return name }
        let shapes = elements.filter { ($0["containerId"] as? String) == nil }
        let kinds = shapes.map(Self.kind)
        guard let first = kinds.first else { return "Nothing" }
        if kinds.count == 1 {
            guard let colour = Self.colour(shapes[0]) else { return first.name }
            return colour + " " + first.name.prefix(1).lowercased() + first.name.dropFirst()
        }
        if kinds.allSatisfy({ $0.name == first.name }) { return "\(kinds.count) \(first.plural)" }
        return "\(kinds.count) shapes"
    }

    /// One element's kind, as a person names it, and its plural.
    static func kind(_ e: [String: Any]) -> (name: String, plural: String) {
        let type = e["type"] as? String ?? ""
        switch type {
        case "line":
            let points = (e["points"] as? [[Any]] ?? []).compactMap { p -> CGPoint? in
                guard p.count >= 2, let x = (p[0] as? NSNumber)?.doubleValue, let y = (p[1] as? NSNumber)?.doubleValue else { return nil }
                return CGPoint(x: x, y: y)
            }
            let span = max(1, (e["width"] as? NSNumber)?.doubleValue ?? 1, (e["height"] as? NSNumber)?.doubleValue ?? 1)
            let joined = points.count > 2 && hypot(points[0].x - points.last!.x, points[0].y - points.last!.y) <= span * 0.02
            guard joined || (e["polygon"] as? Bool) == true else { return ("Line", "lines") }
            var corners = points
            if joined { corners.removeLast() }
            if corners.count == 3 { return rightAngled(corners) ? ("Right triangle", "right triangles") : ("Triangle", "triangles") }
            return ("Polygon", "polygons")
        case "arrow": return (e["elbowed"] as? Bool) == true ? ("Elbow arrow", "elbow arrows") : ("Arrow", "arrows")
        case "freedraw": return ("Freehand", "freehand drawings")
        case "image": return ("Picture", "pictures")
        case "text": return ("Text", "texts")
        case "embeddable", "iframe": return ("Web page", "web pages")
        case "": return ("Shape", "shapes")
        default: return (type.prefix(1).uppercased() + type.dropFirst(), type + "s")
        }
    }

    /// A corner of the three within 3° of square.
    private static func rightAngled(_ p: [CGPoint]) -> Bool {
        (0..<3).contains { i in
            let a = p[i], b = p[(i + 1) % 3], c = p[(i + 2) % 3]
            let u = CGVector(dx: b.x - a.x, dy: b.y - a.y), v = CGVector(dx: c.x - a.x, dy: c.y - a.y)
            let lu = hypot(u.dx, u.dy), lv = hypot(v.dx, v.dy)
            guard lu > 0, lv > 0 else { return false }
            return abs((u.dx * v.dx + u.dy * v.dy) / (lu * lv)) < sin(3 * .pi / 180)
        }
    }

    /// Its colour by the board's palette's name: its fill when it has one, else its stroke when
    /// it isn't ink. Nil for colours the palette doesn't name.
    static func colour(_ e: [String: Any]) -> String? {
        let fill = (e["backgroundColor"] as? String)?.lowercased() ?? "transparent"
        if fill != "transparent" { return CanvasStyle.fills.first { $0.hex == fill && $0.hex != "transparent" }?.name }
        let stroke = (e["strokeColor"] as? String)?.lowercased() ?? ""
        return CanvasStyle.strokes.dropFirst().first { $0.hex == stroke }?.name
    }

    /// What it looks like, whatever its ids: each element's kind, place from the item's corner,
    /// size and words. The same library imported twice adds nothing the second time.
    var look: String {
        let els = elements
        func n(_ e: [String: Any], _ k: String) -> Double { (e[k] as? Double) ?? (e[k] as? Int).map(Double.init) ?? 0 }
        let x0 = els.map { n($0, "x") }.min() ?? 0, y0 = els.map { n($0, "y") }.min() ?? 0
        return els.map { e in
            [e["type"] as? String ?? "", "\(Int((n(e, "x") - x0).rounded()))", "\(Int((n(e, "y") - y0).rounded()))",
             "\(Int(n(e, "width").rounded()))", "\(Int(n(e, "height").rounded()))", (e["text"] as? String) ?? "",
             (e["strokeColor"] as? String) ?? "", (e["backgroundColor"] as? String) ?? ""].joined(separator: ",")
        }.joined(separator: ";")
    }
}

/// Excalidraw's library files (.excalidrawlib): version 1, `{ library: [[elements]] }`, and
/// version 2, `{ libraryItems: [{ id, status, created, name, elements }] }`, as
/// libraries.excalidraw.com gives them.
enum CanvasLibraryFile {
    static let fileExtension = "excalidrawlib"
    static var contentType: UTType { UTType(filenameExtension: fileExtension) ?? .json }
    /// Pinto's own key on an item: the library file it came from (Excalidraw passes over it).
    static let sourceKey = "pintoLibrary"

    /// A library file's name as the popover heads its items: "data-flow.excalidrawlib" is "Data flow".
    static func displayName(_ url: URL) -> String {
        let words = url.deletingPathExtension().lastPathComponent
            .replacingOccurrences(of: "_", with: " ").replacingOccurrences(of: "-", with: " ")
            .split(separator: " ").joined(separator: " ")
        return words.prefix(1).uppercased() + words.dropFirst()
    }

    /// The items in a library file, or nil when it isn't one. `keepIDs`: the app's own file, whose
    /// ids name the items' pictures; an import gets new ones.
    static func items(from data: Data, keepIDs: Bool = false, source: String? = nil) -> [CanvasLibraryItem]? {
        guard let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return nil }
        if let type = json["type"] as? String, type != "excalidrawlib" { return nil }
        let safe = { (s: String) in s.count <= 64 && !s.isEmpty && s.allSatisfy { $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "-" || $0 == "_") } }
        func id(_ raw: Any?) -> String { keepIDs ? (raw as? String).flatMap { safe($0) ? $0 : nil } ?? UUID().uuidString : UUID().uuidString }
        func time(_ raw: Any?) -> Double { (raw as? Double) ?? (raw as? Int).map(Double.init) ?? Date.now.timeIntervalSince1970 * 1000 }
        if let list = json["libraryItems"] as? [[String: Any]] {
            return list.compactMap { i in
                CanvasLibraryItem(id: id(i["id"]), name: i["name"] as? String, source: (i[sourceKey] as? String) ?? source, created: time(i["created"]),
                                  elements: i["elements"] as? [[String: Any]] ?? [], files: i["files"] as? [String: Any] ?? [:])
            }
        }
        if let list = json["library"] as? [[[String: Any]]] {
            return list.compactMap { CanvasLibraryItem(source: source, elements: $0) }
        }
        return nil
    }

    /// The items as a library file (version 2), which Excalidraw opens too. `ledger`: the app's own
    /// file keeps what it knows of the server beside them (Pinto's own key, which Excalidraw passes over).
    static func data(_ items: [CanvasLibraryItem], ledger: CanvasLibraryLedger? = nil) -> Data {
        var file: [String: Any] = ["type": "excalidrawlib", "version": 2, "source": "https://pintonotes.com", "libraryItems": items.map(\.libraryItem)]
        if let ledger, let json = try? JSONEncoder().encode(ledger), let o = try? JSONSerialization.jsonObject(with: json) { file[ledgerKey] = o }
        return (try? JSONSerialization.data(withJSONObject: file)) ?? Data()
    }

    /// Pinto's own key on the app's library file: what it knows of the server (CanvasLibraryLedger).
    static let ledgerKey = "pintoSync"

    /// What the app's library file knows of the server; nil for a file without it (one from before sync).
    static func ledger(from data: Data) -> CanvasLibraryLedger? {
        guard let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any], let o = json[ledgerKey],
              let d = try? JSONSerialization.data(withJSONObject: o) else { return nil }
        return try? JSONDecoder().decode(CanvasLibraryLedger.self, from: d)
    }
}

/// Your whiteboard library (whiteboard council, round 5: "a native shape library, including
/// importing existing Excalidraw libraries (.excalidrawlib) and saving a selected group for
/// reuse"): kept in the app, for every board, not in any board's file. Newest first, as
/// Excalidraw shows its library. Each item's picture is drawn by a board once and kept beside it.
/// The same on every device of the account: names, groups, order and the pictures in items sync,
/// sealed like notes (CanvasLibrarySync.swift, LibrarySync); the items' own pictures (thumbnails)
/// are drawn again on each device.
@MainActor @Observable
final class CanvasLibrary {
    /// The app's library. Tests and UI tests keep theirs in memory (they never touch yours).
    static var shared = CanvasLibrary(folder: PaneApp.isUnitTestHost || ProcessInfo.processInfo.arguments.contains("-uitest") ? nil : defaultFolder)

    static var defaultFolder: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appending(path: "\(AppIdentity.dataFolder)/Whiteboard Library", directoryHint: .isDirectory)
    }

    private(set) var items: [CanvasLibraryItem] = []
    /// What this library knows of the account's copy on the server (CanvasLibraryLedger), kept in
    /// its file with the items.
    private(set) var ledger = CanvasLibraryLedger()
    /// Each item's picture (CanvasController.picture), by its id.
    private(set) var thumbnails: [String: PImage] = [:]
    /// The same in dark mode, its colours turned as the canvas turns them (`darkened`).
    private(set) var darkThumbnails: [String: PImage] = [:]
    /// nil: kept in memory only.
    @ObservationIgnored let folder: URL?
    @ObservationIgnored private let writer = DispatchQueue(label: "pinto.whiteboard-library.save", qos: .utility)
    /// The sync engine's: something changed here that goes up.
    @ObservationIgnored var onChange: (() -> Void)?
    /// The sync engine's: the library is showing, so what changed on the account's other devices
    /// comes down now rather than at the next sync.
    @ObservationIgnored var onLook: (() -> Void)?

    init(folder: URL?) {
        self.folder = folder
        guard let folder, let data = try? Data(contentsOf: folder.appending(path: "library.excalidrawlib")),
              let kept = CanvasLibraryFile.items(from: data, keepIDs: true) else { return }
        var contents = CanvasLibraryContents(items: kept, ledger: CanvasLibraryFile.ledger(from: data) ?? CanvasLibraryLedger())
        // A library from before sync: each item gets its place, in the order it was kept.
        contents.placeAll()
        items = contents.items
        ledger = contents.ledger
        for item in items {
            if let png = try? Data(contentsOf: thumbnailFile(item.id, in: folder)), let image = PImage(data: png) {
                thumbnails[item.id] = image
                darkThumbnails[item.id] = Self.darkened(png)
            }
        }
    }

    /// A picture as the canvas shows it in dark mode, pixel by pixel (CanvasStyle.throughDark):
    /// a SwiftUI colour filter would do it on screen, but isn't drawn into a picture of the view.
    nonisolated static func darkened(_ png: Data) -> PImage? {
        guard let src = CGImageSourceCreateWithData(png as CFData, nil), let image = CGImageSourceCreateImageAtIndex(src, 0, nil),
              let space = CGColorSpace(name: CGColorSpace.sRGB),
              let ctx = CGContext(data: nil, width: image.width, height: image.height, bitsPerComponent: 8, bytesPerRow: image.width * 4,
                                  space: space, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
              let px = ctx.data?.assumingMemoryBound(to: UInt8.self) else { return nil }
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        for i in stride(from: 0, to: image.width * image.height * 4, by: 4) {
            let a = Double(px[i + 3])
            guard a > 0 else { continue }
            let (r, g, b) = CanvasStyle.throughDark(min(Double(px[i]) / a, 1), min(Double(px[i + 1]) / a, 1), min(Double(px[i + 2]) / a, 1))
            px[i] = UInt8((r * a).rounded()); px[i + 1] = UInt8((g * a).rounded()); px[i + 2] = UInt8((b * a).rounded())
        }
        guard let out = ctx.makeImage() else { return nil }
        #if os(macOS)
        return NSImage(cgImage: out, size: NSSize(width: out.width, height: out.height))
        #else
        return UIImage(cgImage: out)
        #endif
    }

    private func thumbnailFile(_ id: String, in folder: URL) -> URL { folder.appending(path: "thumbnails/\(id).png") }

    /// Keeps these elements as one new item, first in the library.
    @discardableResult
    func add(elements: [[String: Any]], files: [String: Any] = [:], name: String? = nil) -> CanvasLibraryItem? {
        guard let item = CanvasLibraryItem(name: name, elements: elements, files: files) else { return nil }
        update(local: true) { $0.made([item]) }
        return item
    }

    /// What importing a library file did.
    struct Imported: Equatable { var added = 0; var already = 0 }

    /// A library file's items, first in the library in the file's order; ones already here (by
    /// how they look) are left out. Nil when the file isn't a library. `source`: the file's name,
    /// which the popover groups them under.
    func importLibrary(_ data: Data, source: String? = nil) -> Imported? {
        guard let incoming = CanvasLibraryFile.items(from: data, source: source) else { return nil }
        var seen = Set(items.map(\.look))
        var fresh: [CanvasLibraryItem] = []
        for item in incoming where seen.insert(item.look).inserted { fresh.append(item) }
        if !fresh.isEmpty { update(local: true) { $0.made(fresh) } }
        return Imported(added: fresh.count, already: incoming.count - fresh.count)
    }

    /// Names an item (right-click › Rename…); an empty name gives it back its own (what it is,
    /// or its words). Kept with the library.
    func rename(_ id: String, to name: String) {
        guard let i = items.firstIndex(where: { $0.id == id }) else { return }
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let named = trimmed.isEmpty ? CanvasLibraryItem(elements: items[i].elements)?.name : String(trimmed.prefix(80))
        guard named != items[i].name else { return }
        update(local: true) { $0.renamed(id, to: named) }
    }

    func remove(_ id: String) {
        guard items.contains(where: { $0.id == id }) else { return }
        update(local: true) { $0.removed(id) }
    }

    /// Changes the items and the ledger together (CanvasLibraryContents), keeps them in order and
    /// saved, and lets the pictures of items that went go too. `local`: a change made here, which
    /// goes up (`onChange`).
    @discardableResult
    func update<T>(local: Bool, _ change: (inout CanvasLibraryContents) -> T) -> T {
        var contents = CanvasLibraryContents(items: items, ledger: ledger)
        let result = change(&contents)
        guard contents != CanvasLibraryContents(items: items, ledger: ledger) else { return result }
        let gone = Set(items.map(\.id)).subtracting(contents.items.map(\.id))
        items = contents.items
        ledger = contents.ledger
        for id in gone { forgetThumbnail(id) }
        save()
        if local { onChange?() }
        return result
    }

    /// The items and the ledger, as sync reads them.
    var contents: CanvasLibraryContents { CanvasLibraryContents(items: items, ledger: ledger) }

    /// Asks for what's new on the account's other devices (the library is showing).
    func looked() { onLook?() }

    /// Everything goes: the account's notes left this device (Sign Out and Remove Notes, another
    /// account, Delete Account). The next sync brings the account's library back down.
    func erase() {
        for id in items.map(\.id) { forgetThumbnail(id) }
        items = []
        ledger = CanvasLibraryLedger()
        thumbnails = [:]
        darkThumbnails = [:]
        save()
    }

    func setThumbnail(_ png: Data, for id: String) {
        guard items.contains(where: { $0.id == id }), let image = PImage(data: png) else { return }
        thumbnails[id] = image
        darkThumbnails[id] = Self.darkened(png)
        guard let folder else { return }
        let f = thumbnailFile(id, in: folder)
        writer.async {
            try? FileManager.default.createDirectory(at: f.deletingLastPathComponent(), withIntermediateDirectories: true)
            try? png.write(to: f, options: .atomic)
        }
    }

    /// An item's picture now belongs to another id (the same item, as the server knows it).
    func moveThumbnail(from old: String, to new: String) {
        guard old != new else { return }
        if let image = thumbnails.removeValue(forKey: old) { thumbnails[new] = image }
        if let image = darkThumbnails.removeValue(forKey: old) { darkThumbnails[new] = image }
        guard let folder else { return }
        let from = thumbnailFile(old, in: folder), to = thumbnailFile(new, in: folder)
        writer.async {
            try? FileManager.default.removeItem(at: to)
            try? FileManager.default.moveItem(at: from, to: to)
        }
    }

    private func forgetThumbnail(_ id: String) {
        thumbnails[id] = nil
        darkThumbnails[id] = nil
        if let folder { let f = thumbnailFile(id, in: folder); writer.async { try? FileManager.default.removeItem(at: f) } }
    }

    /// Written off the main thread, in order: a library with pictures in it can be a few MB.
    private func save() {
        guard let folder else { return }
        let data = CanvasLibraryFile.data(items, ledger: ledger), file = folder.appending(path: "library.excalidrawlib")
        writer.async {
            try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            try? data.write(to: file, options: .atomic)
        }
    }

    /// Waits for what's being written (tests: a library read again from its folder).
    func flush() { writer.sync {} }
}

/// Your own whiteboard templates (both judges, round 8: "save a board as a template"), beside the
/// five built-in ones on an empty board. Each is a whole board as it was saved: its elements (the
/// how-to line among them) and pictures, with a name. Kept in the app, as the library is, in one
/// .excalidrawlib file (Application Support, "Whiteboard Templates"); not synced. Newest first.
@MainActor @Observable
final class WhiteboardTemplates {
    /// The app's templates. Tests and UI tests keep theirs in memory (they never touch yours).
    static var shared = WhiteboardTemplates(folder: PaneApp.isUnitTestHost || ProcessInfo.processInfo.arguments.contains("-uitest") ? nil : defaultFolder)

    static var defaultFolder: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appending(path: "\(AppIdentity.dataFolder)/Whiteboard Templates", directoryHint: .isDirectory)
    }
    static let fileName = "templates.excalidrawlib"
    /// The empty board shows this many in its row; past it, the last place is More….
    static let rowLimit = 5

    private(set) var items: [CanvasLibraryItem] = []
    /// nil: kept in memory only.
    @ObservationIgnored let folder: URL?
    @ObservationIgnored private let writer = DispatchQueue(label: "pinto.whiteboard-templates.save", qos: .utility)

    init(folder: URL?) {
        self.folder = folder
        guard let folder, let data = try? Data(contentsOf: folder.appending(path: Self.fileName)),
              let kept = CanvasLibraryFile.items(from: data, keepIDs: true) else { return }
        items = kept
    }

    /// The tiles the empty board's row shows, and whether More… takes the last place.
    var row: (items: [CanvasLibraryItem], more: Bool) {
        items.count <= Self.rowLimit ? (items, false) : (Array(items.prefix(Self.rowLimit - 1)), true)
    }

    /// A name as a template keeps it: trimmed, at most 80 characters, "Template" when there's none.
    static func cleaned(_ name: String?) -> String {
        let t = (name ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? "Template" : String(t.prefix(80))
    }

    /// Keeps a board as a new template, first. Nil with nothing drawn.
    @discardableResult
    func add(name: String, elements: [[String: Any]], files: [String: Any] = [:]) -> CanvasLibraryItem? {
        guard let item = CanvasLibraryItem(name: Self.cleaned(name), elements: elements, files: files) else { return nil }
        items.insert(item, at: 0)
        save()
        return item
    }

    /// Renames one (right-click › Rename…); an empty name leaves it as it was.
    func rename(_ id: String, to name: String) {
        guard let i = items.firstIndex(where: { $0.id == id }), !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        let named = Self.cleaned(name)
        guard items[i].name != named else { return }
        items[i].name = named
        save()
    }

    /// Takes one out; what it was and where, for Undo (`restore`).
    @discardableResult
    func remove(_ id: String) -> (item: CanvasLibraryItem, index: Int)? {
        guard let i = items.firstIndex(where: { $0.id == id }) else { return nil }
        let item = items.remove(at: i)
        save()
        return (item, i)
    }

    /// Puts a deleted one back where it was.
    func restore(_ item: CanvasLibraryItem, at index: Int) {
        guard !items.contains(where: { $0.id == item.id }) else { return }
        items.insert(item, at: min(max(index, 0), items.count))
        save()
    }

    private func save() {
        guard let folder else { return }
        let data = CanvasLibraryFile.data(items), file = folder.appending(path: Self.fileName)
        writer.async {
            try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            try? data.write(to: file, options: .atomic)
        }
    }

    /// Waits for what's being written (tests: templates read again from their folder).
    func flush() { writer.sync {} }
}

/// The library as the popover lays it out (library council, round 6): items under the name of the
/// library file they came from (yours under "Saved"), newest group first; filtered by a search once
/// there are more than 12; moved through with the arrow keys, row by row as the grid shows them.
struct CanvasLibraryGrid: Equatable {
    struct Group: Equatable, Identifiable {
        var title: String
        var items: [CanvasLibraryItem]
        var id: String { title }
    }

    static let savedTitle = "Saved"
    /// More items than this, and the popover has a search field.
    static let searchAfter = 12
    static func showsSearch(_ count: Int) -> Bool { count > searchAfter }

    let groups: [Group]
    let columns: Int

    /// `query`: what's typed in the search field; an item shows when its name or its library's has it.
    init(_ items: [CanvasLibraryItem], query: String = "", columns: Int = 4) {
        self.columns = max(1, columns)
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines)
        var order: [String] = [], byTitle: [String: [CanvasLibraryItem]] = [:]
        for item in items {
            let title = item.source ?? Self.savedTitle
            guard q.isEmpty || item.title.localizedStandardContains(q) || title.localizedStandardContains(q) else { continue }
            if byTitle[title] == nil { order.append(title) }
            byTitle[title, default: []].append(item)
        }
        groups = order.map { Group(title: $0, items: byTitle[$0] ?? []) }
    }

    /// Every item shown, in the order the grid shows them.
    var items: [CanvasLibraryItem] { groups.flatMap(\.items) }

    enum Move { case left, right, up, down }

    /// Where an arrow key goes from the item `from` (by id): the one beside it, or the one above or
    /// below in the grid, across groups; the first item when nothing is picked yet.
    func moved(_ from: String?, _ move: Move) -> String? {
        // Each shown item's row (counted through every group) and column.
        var cells: [(id: String, row: Int, col: Int)] = []
        var row = 0
        for g in groups {
            for (i, item) in g.items.enumerated() { cells.append((item.id, row + i / columns, i % columns)) }
            row += (g.items.count + columns - 1) / columns
        }
        guard let here = cells.firstIndex(where: { $0.id == from }) else { return cells.first?.id }
        let c = cells[here]
        switch move {
        case .left: return cells[max(here - 1, 0)].id
        case .right: return cells[min(here + 1, cells.count - 1)].id
        case .up, .down:
            let next = move == .up ? cells[..<here].last(where: { $0.row < c.row })?.row : cells[(here + 1)...].first(where: { $0.row > c.row })?.row
            guard let next else { return c.id }
            let line = cells.filter { $0.row == next }
            return (line.last(where: { $0.col <= c.col }) ?? line[0]).id
        }
    }

    /// What Return adds: the picked item, or with a search typed and nothing picked, the first match.
    func chosen(_ picked: String?, searching: Bool) -> CanvasLibraryItem? {
        if let picked, let item = items.first(where: { $0.id == picked }) { return item }
        return searching ? items.first : nil
    }
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
    /// More templates, as FigJam has (round 12: "Journey map, SWOT, Timeline, Org chart, User
    /// story map"), in their own row on the empty board.
    case journeyMap, swot, timeline, orgChart, storyMap

    var id: String { rawValue }

    /// The empty board's first row, and its "More templates" row under it.
    static let first: [WhiteboardTemplate] = [.flowchart, .mindMap, .retro, .kanban, .meeting]
    static let more: [WhiteboardTemplate] = [.journeyMap, .swot, .timeline, .orgChart, .storyMap]

    var title: String {
        switch self {
        case .flowchart: "Flowchart"
        case .mindMap: "Mind map"
        case .retro: "Retro"
        case .kanban: "Kanban"
        case .meeting: "Meeting"
        case .journeyMap: "Journey map"
        case .swot: "SWOT"
        case .timeline: "Timeline"
        case .orgChart: "Org chart"
        case .storyMap: "User story map"
        }
    }

    /// The name in a sentence ("Start from a journey map"): SWOT keeps its capitals.
    var inSentence: String { self == .swot ? title : title.lowercased() }

    /// What it's for, in a few words: the line under its card in the templates gallery.
    var line: String {
        switch self {
        case .flowchart: "Steps, choices and arrows"
        case .mindMap: "One idea, branching out"
        case .retro: "What went well, what to try"
        case .kanban: "To do, doing and done"
        case .meeting: "Agenda, notes and actions"
        case .journeyMap: "What people do and feel"
        case .swot: "Where you stand, four ways"
        case .timeline: "Steps and dates on one line"
        case .orgChart: "Who\u{2019}s on the team, and where"
        case .storyMap: "Stories by step and release"
        }
    }

    var symbol: String {
        switch self {
        case .flowchart: "flowchart"
        case .mindMap: "point.3.connected.trianglepath.dotted"
        case .retro: "hand.thumbsup"
        case .kanban: "rectangle.split.3x1"
        case .meeting: "person.2"
        case .journeyMap: "point.topleft.down.to.point.bottomright.curvepath"
        case .swot: "square.grid.2x2"
        case .timeline: "calendar.day.timeline.left"
        case .orgChart: "person.3.sequence"
        case .storyMap: "rectangle.grid.3x2"
        }
    }

    /// Its how-to line, the grey line under its title on the board.
    var hint: String {
        (elements.first { ($0["customData"] as? [String: Any])?["pintoHint"] as? Bool == true }?["text"] as? String) ?? ""
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
        // Marked, so Add Column (Tab) makes the next one like it (round 15).
        var out: [[String: Any]] = [["type": "rectangle", "id": id, "x": x, "y": 0, "width": width, "height": height, "strokeColor": laneEdge,
                                     "backgroundColor": lane, "fillStyle": "solid", "roundness": ["type": 3], "customData": ["pintoColumn": true]],
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
            var out: [[String: Any]] = T.title("Mind map", hint: "Double-click to write. Select a branch and press Tab to grow a new one from it.").map { e in
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
            return T.title("Retro", hint: "Double-click to write. Select a card and press S to add a note, or Tab to add a column.")
                + T.column("well", x: 0, title: "Went well", fill: T.green, cards: ["Shipped on time"])
                + T.column("better", x: 240, title: "Could be better", fill: T.red, cards: ["Too many meetings"])
                + T.column("try", x: 480, title: "Try next", fill: T.blue, cards: ["Demo every Friday"])
        case .kanban:
            return T.title("Kanban", hint: "Select a card and press S to add one under it, or Tab to add a column.")
                + T.column("todo", x: 0, title: "To do", fill: T.yellow, cards: ["Write the brief \u{00B7} Sam", "Book the venue \u{00B7} Alex"])
                + T.column("doing", x: 240, title: "Doing", fill: T.blue, cards: ["Draft the post \u{00B7} you"])
                + T.column("done", x: 480, title: "Done", fill: T.green, cards: ["Pick a date \u{00B7} team"])
        case .meeting:
            return T.title("Meeting", hint: "Date: \(Date.now.formatted(date: .long, time: .omitted))        People:")
                + T.section("agenda", x: 0, y: 0, w: 340, h: 220, title: "Agenda", fill: "#e7f5ff", lines: ["1. Where we are", "2. What\u{2019}s next", "3. Anything else"])
                + T.section("notes", x: 360, y: 0, w: 340, h: 220, title: "Notes", fill: "#fff9db")
                + T.section("decisions", x: 0, y: 240, w: 340, h: 200, title: "Decisions", fill: "#ebfbee")
                + T.section("actions", x: 360, y: 240, w: 340, h: 200, title: "Action items", fill: "#f8f0fc", lines: ["Who does what, by when"])
        case .journeyMap:
            // The stages along the top, a row each for what people do, think and feel, and ideas.
            // Feelings are a line of dots, high when it goes well, as journey maps draw them.
            let stages = ["Discover", "Sign up", "First use", "Come back"]
            let x = { (i: Int) in 130 + Double(i) * 158 }
            var out = T.title("Journey map", hint: "Name the stages along the top. Under each, write what people do, think and feel.")
            for (i, s) in stages.enumerated() { out.append(T.box("stage\(i)", x: x(i), y: 0, w: 146, h: 52, text: s, fill: T.blue, size: 18)) }
            let rows: [(String, String, String)] = [("doing", "Doing", "#fff9db"), ("thinking", "Thinking", "#e7f5ff"), ("feeling", "Feeling", "#f8f0fc"), ("ideas", "Ideas", "#ebfbee")]
            let rowY = { (r: Int) in 68 + Double(r) * 124 }
            for (r, row) in rows.enumerated() { out += T.section(row.0, x: 0, y: rowY(r), w: 750, h: 112, title: row.1, fill: row.2) }
            let cards: [(Int, Int, String, String)] = [(0, 0, "Reads a friend\u{2019}s post", T.yellow), (0, 1, "Makes an account", T.yellow),
                                                       (1, 0, "Is this for me?", T.yellow), (1, 2, "Where do I start?", T.yellow),
                                                       (3, 1, "Sign in with Apple", T.green), (3, 3, "A weekly email", T.green)]
            for (r, i, words, fill) in cards {
                out.append(T.box("\(rows[r].0)\(i)", x: x(i) + 6, y: rowY(r) + 18, w: 134, h: 76, text: words, fill: fill, size: 16))
            }
            // Curious, put off by the sign-up, pleased, then glad to be back.
            let mood: [Double] = [44, 78, 12, 24]
            // In Doubles, as every number a template writes is (the tile reads them so).
            let dot = { (i: Int) -> (x: Double, y: Double) in (x(i) + 73, rowY(2) + mood[i] + 11) }
            for i in stages.indices {
                out.append(["type": "ellipse", "id": "mood\(i)", "x": dot(i).x - 11, "y": dot(i).y - 11, "width": 22.0, "height": 22.0,
                            "strokeColor": T.ink, "backgroundColor": T.violet, "fillStyle": "solid"])
            }
            for i in stages.indices.dropLast() {
                let a = dot(i), b = dot(i + 1)
                out.append(T.arrow(from: "mood\(i)", to: "mood\(i + 1)", x: a.x + 11, y: a.y, dx: b.x - a.x - 22, dy: b.y - a.y, branch: true))
            }
            return out
        case .swot:
            // Strong colours, so it reads as SWOT at a glance and not as a meeting's four sections.
            var out = T.title("SWOT", hint: "Add notes to each square. Select one and press S to add another under it.")
            out.append(T.text("Helpful", x: 116, y: 0, size: 18, color: T.hint))
            out.append(T.text("Harmful", x: 436, y: 0, size: 18, color: T.hint))
            out.append(T.text("Inside", x: 0, y: 126, size: 18, color: T.hint))
            out.append(T.text("Outside", x: 0, y: 356, size: 18, color: T.hint))
            let squares: [(String, String, Double, Double, String, String)] = [
                ("strengths", "Strengths", 100, 36, T.green, "Loyal first users"), ("weaknesses", "Weaknesses", 420, 36, T.red, "A small team"),
                ("opportunities", "Opportunities", 100, 266, T.blue, "Schools want it"), ("threats", "Threats", 420, 266, T.yellow, "A free rival"),
            ]
            for (id, name, sx, sy, fill, note) in squares {
                out += T.section(id, x: sx, y: sy, w: 300, h: 210, title: name, fill: fill)
                out.append(T.box("\(id)-0", x: sx + 16, y: sy + 56, w: 150, h: 70, text: note, fill: "#ffffff", size: 16))
            }
            return out
        case .timeline:
            // Milestones on one line, their steps above and below in turn.
            let steps = ["Kickoff\nWeek 1", "Research\nWeek 2", "Design\nWeek 4", "Beta\nWeek 6", "Launch\nWeek 8"]
            let fills = [T.blue, T.yellow, T.blue, T.yellow, T.green]
            let cx = { (i: Int) in 70 + Double(i) * 150 }
            var out = T.title("Timeline", hint: "Double-click a step to change it. Select one and press Tab to add a step at the end.")
            // Marked, so Add Step (Tab) makes the next one like them (round 15).
            for i in steps.indices {
                out.append(["type": "ellipse", "id": "dot\(i)", "x": cx(i) - 12, "y": 108.0, "width": 24.0, "height": 24.0,
                            "strokeColor": T.ink, "backgroundColor": T.violet, "fillStyle": "solid", "customData": ["pintoStep": "dot"]])
                let above = i % 2 == 0
                out.append(T.box("step\(i)", x: cx(i) - 70, y: above ? 0 : 176, w: 140, h: 64, text: steps[i], fill: fills[i], size: 16)
                    .merging(["customData": ["pintoStep": "step"]]) { a, _ in a })
                out.append(above ? T.arrow(from: "step\(i)", to: "dot\(i)", x: cx(i), y: 64, dx: 0, dy: 44, branch: true)
                                 : T.arrow(from: "dot\(i)", to: "step\(i)", x: cx(i), y: 132, dx: 0, dy: 44, branch: true))
            }
            // A plain line between the dots: an arrowhead on the last one ran into the last dot
            // (rounds 13 and 14, 31), and the line grows with each step added.
            for i in steps.indices.dropLast() {
                out.append(T.arrow(from: "dot\(i)", to: "dot\(i + 1)", x: cx(i) + 12, y: 120, dx: 126, dy: 0, branch: true))
            }
            return out
        case .orgChart:
            // Each person marked, so Add Report (Tab) puts someone under them, joined, the chart's
            // layout kept (round 16: "org charts grow").
            let person = ["customData": ["pintoPerson": true]]
            var out = T.title("Org chart", hint: "Double-click a box to write a name. Select someone and press Tab to add a report.")
            out.append(T.box("lead", x: 280, y: 0, w: 200, h: 72, text: "Alex\nTeam lead", fill: T.yellow, size: 18).merging(person) { a, _ in a })
            let teams: [(String, String, String, String)] = [("design", "Sam\nDesign", "ana", "Ana\nDesigner"), ("eng", "Kim\nEngineering", "lee", "Lee\nDeveloper"),
                                                             ("market", "Jo\nMarketing", "open", "Open role")]
            for (i, t) in teams.enumerated() {
                let left = Double(i) * 280, mid = left + 100
                out.append(T.box(t.0, x: left, y: 150, w: 200, h: 72, text: t.1, fill: T.blue, size: 18).merging(person) { a, _ in a })
                var report = T.box(t.2, x: left + 10, y: 300, w: 180, h: 64, text: t.3, fill: t.2 == "open" ? "transparent" : T.green, size: 16).merging(person) { a, _ in a }
                if t.2 == "open" { report["strokeStyle"] = "dashed" }
                out.append(report)
                out.append(T.arrow(from: "lead", to: t.0, x: 380, y: 72, dx: mid - 380, dy: 78, branch: true))
                out.append(T.arrow(from: t.0, to: t.2, x: mid, y: 222, dx: 0, dy: 78, branch: true))
            }
            return out
        case .storyMap:
            // What people do along the top; under each, the stories for it, a lane per release.
            let steps = ["Find a recipe", "Plan the week", "Shop", "Cook"]
            let x = { (i: Int) in 110 + Double(i) * 158 }
            var out = T.title("User story map", hint: "Steps along the top, stories under them. Drag a story into its release.")
            for (i, s) in steps.enumerated() { out.append(T.box("step\(i)", x: x(i), y: 0, w: 146, h: 56, text: s, fill: T.violet, size: 18)) }
            out += T.section("first", x: 0, y: 72, w: 744, h: 188, title: "First", fill: T.lane)
            out += T.section("next", x: 0, y: 276, w: 744, h: 104, title: "Next", fill: T.lane)
            let stories: [(Int, Double, String)] = [(0, 88, "Search by name"), (0, 172, "Save a favourite"), (1, 88, "Pick five dinners"), (2, 88, "Make a list"),
                                                     (3, 88, "Step by step"), (0, 292, "Filter by diet"), (1, 292, "Reuse last week"), (2, 292, "Order online"), (3, 292, "Timers")]
            for (n, s) in stories.enumerated() {
                out.append(T.box("story\(n)", x: x(s.0) + 3, y: s.1, w: 140, h: 72, text: s.2, fill: T.yellow, size: 16))
            }
            return out
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
