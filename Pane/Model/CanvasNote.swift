import Foundation
import SwiftData

/// Canvas notes (prototype, 13 November 2026): a drawing board as a third kind of note, beside
/// text notes and apps. Shapes, arrows, freehand and text with a hand-drawn look.
///
/// A canvas is a note whose app is the built-in canvas page (canvas-stack/ in the repository builds
/// Pane/Resources/Canvas: React and @excalidraw/excalidraw, MIT). So it syncs, seals, keeps history
/// and reaches an AI the way every app does:
///
/// - The drawing is a standard Excalidraw scene, unchanged, in the app's data:
///   `values.scene = { type: "excalidraw", version: 2, elements, appState, files }`.
/// - An AI sees the note as "<Title>.app/": README.md says it's a canvas, data.json holds the scene.
/// - The note's text is its title (the list shows it, with the canvas glyph).
/// - The page loads nothing from outside the app (amber-lib:///canvas/, fonts included).
enum CanvasNote {
    /// In the page's HTML: this app is a canvas (the list's glyph, no data receipts, no scrolling).
    static let marker = #"<meta name="pinto-canvas" content="1">"#
    /// A bare scribble, no pencil and no box: beside compose's boxed pencil and the app's grid it
    /// has its own outline. Shapes on shapes (square.on.circle) read as Copy (13 November 2026).
    /// The list marks canvases with it too.
    static let symbol = "scribble.variable"
    /// What people call it (Emil, 13 November 2026): "whiteboard" says draw and explain, and it's
    /// what people search for; "canvas" is a document in Slack and note cards in Obsidian. The
    /// code and the stored format keep "canvas".
    static let title = "Whiteboard"

    /// Whether a page (one HTML file, or a project as a note's page stores it) is the canvas.
    /// Only a page that names the canvas at all is parsed.
    static func isCanvas(_ stored: String?) -> Bool {
        guard let stored, stored.contains("pinto-canvas") else { return false }
        return NotePageProject.entryHTML(stored).contains(marker)
    }

    @MainActor static func has(_ note: Note, in store: NotePageStore = .shared) -> Bool {
        !note.isLocked && isCanvas(NoteApps.page(note.id, in: store)?.html)
    }

    static let index = """
    <!doctype html>
    \(marker)
    <meta name="amber-base" content="none">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <title>Whiteboard</title>
    <link rel="stylesheet" href="amber-lib:///canvas/canvas.css">
    <div id="canvas"></div>
    <script>window.EXCALIDRAW_ASSET_PATH = "amber-lib:///canvas/";</script>
    <script src="amber-lib:///canvas/canvas.js"></script>
    """

    /// What an AI reads first (the server tells it to read an app's README.md).
    static let readme = """
    # Whiteboard

    This note is a whiteboard (a canvas): a drawing board in Pinto Notes, not an app to build. Don't change index.html.

    The drawing is in data.json, as `values.scene`: a standard Excalidraw scene, the same JSON an .excalidraw file holds.

        { "values": { "scene": { "type": "excalidraw", "version": 2, "elements": [ … ], "appState": { "viewBackgroundColor": "#ffffff" }, "files": {} } }, "collections": {} }

    To draw, add elements to `values.scene.elements` with edit or write. Full elements work, and so does the short form, which the canvas fills out when it opens:

        { "type": "rectangle", "id": "start", "x": 0, "y": 0, "width": 180, "height": 70, "label": { "text": "Start" } }
        { "type": "arrow", "x": 90, "y": 70, "width": 0, "height": 80, "start": { "id": "start" }, "end": { "id": "next" } }
        { "type": "text", "x": 0, "y": -60, "text": "Title" }

    Types: rectangle, ellipse, diamond, arrow, line, text, freedraw. Colors are `strokeColor` and `backgroundColor` (hex). Give each element its own `id` so arrows can bind to it.

    A note card puts one of the person's notes on the board: its title and first lines, and a double-click opens the note. To make one, add a shape with `customData.pintoNote` set to the note's title (or its folder path and title, "Work/Launch plan"):

        { "type": "rectangle", "id": "plan", "x": 300, "y": 0, "customData": { "pintoNote": "Launch plan" } }

    The board draws the card in its place and keeps it current when the note changes. Arrows can join it by its `id`. A drawn card is a group of elements whose `customData` has `pintoNote` (the note's id once the board has opened) and `title` (the note's title): read `title` to see which note it is, and move or delete the whole group.

    - Elements with `"isDeleted": true` are deleted: leave them, they keep other devices from bringing them back.
    - To change an element, edit its fields; raising its `version` by one is good manners but not required.
    - The person sees your change at once and can undo it in version history.
    """

    /// The canvas page as a note's page holds it: a project with its README.
    static let project: String = {
        let o: [String: Any] = ["amberApp": 1, "files": ["/index.html": index, "/README.md": readme]]
        return (try? JSONSerialization.data(withJSONObject: o, options: [.sortedKeys])).flatMap { String(data: $0, encoding: .utf8) } ?? ""
    }()

    static func emptyScene() -> [String: Any] {
        ["type": "excalidraw", "version": 2, "source": "https://pintonotes.com", "elements": [Any](), "appState": ["viewBackgroundColor": "#ffffff"], "files": [String: Any]()]
    }

    /// Who made the canvas page, in its history.
    static let writer = "Pinto Notes"

    /// A new canvas in `scope`'s folder: the note, its page and its scene (empty, or one brought
    /// in from a file), all at once, no AI and no network.
    @MainActor @discardableResult
    static func make(in scope: Scope, context: ModelContext, pages: NotePageStore = .shared, data: NotePageDataStore = .shared,
                     scene: [String: Any]? = nil, named: String? = nil) -> Note {
        let note = context.createNote(in: scope, body: named ?? title)
        data.set(note.id, ["values": ["scene": scene ?? emptyScene()], "collections": [String: Any]()])
        pages.setHere(note.id, .init(html: project, by: writer, at: .now))
        return note
    }

    // MARK: What a change did

    /// What a change to a board did, said plainly: "added 3 shapes and 2 arrows", "changed 2
    /// shapes", "removed 1 arrow" (whiteboard council, round 2, 12: the receipt said only "drew on
    /// this whiteboard"). Words on a shape count with the shape.
    static func change(from before: NotePageData.Doc, to after: NotePageData.Doc) -> String? {
        func elements(_ d: NotePageData.Doc) -> [[String: Any]] {
            (((d["values"] as? [String: Any])?["scene"] as? [String: Any])?["elements"] as? [[String: Any]]) ?? []
        }
        func card(_ e: [String: Any]) -> [String: Any]? {
            (e["customData"] as? [String: Any]).flatMap { $0["pintoNote"] is String ? $0 : nil }
        }
        func kind(_ e: [String: Any]) -> String? {
            // A note card counts once, as a card: its glyph and words are parts of it.
            if let c = card(e) { return [nil, "card"].contains(c["pintoCard"] as? String) ? "card" : nil }
            return switch e["type"] as? String {
            case "arrow", "line": "arrow"
            case "text": e["containerId"] is String ? nil : "text"
            case "image": "picture"
            case .some: "shape"
            case nil: nil
            }
        }
        func look(_ e: [String: Any]) -> String {
            let n = { (k: String) in Int(((e[k] as? Double) ?? (e[k] as? Int).map(Double.init) ?? 0).rounded()) }
            let label = (e["label"] as? [String: Any])?["text"] as? String
            return "\(n("x")),\(n("y")),\(n("width")),\(n("height")),\(e["text"] as? String ?? label ?? ""),\(e["strokeColor"] as? String ?? ""),\(e["backgroundColor"] as? String ?? "")"
        }
        let old = Dictionary(elements(before).compactMap { e in (e["id"] as? String).map { ($0, e) } }, uniquingKeysWith: { a, _ in a })
        var added: [String: Int] = [:], changed: [String: Int] = [:], removed: [String: Int] = [:]
        // The words on a shape or a text: its label (short form), the text bound to it, or its own.
        func words(_ e: [String: Any], in all: [[String: Any]]) -> String? {
            if let c = card(e) {
                let t = ((c["title"] as? String) ?? (c["pintoNote"] as? String).flatMap { UUID(uuidString: $0) == nil ? WikiLinks.name(of: $0) : nil } ?? "")
                    .trimmingCharacters(in: .whitespaces)
                return t.isEmpty ? nil : "the \(t.count > 40 ? String(t.prefix(39)) + "…" : t) card"
            }
            let id = e["id"] as? String
            let bound = id.flatMap { id in all.first { $0["containerId"] as? String == id && $0["isDeleted"] as? Bool != true }?["text"] as? String }
            let w = ((e["label"] as? [String: Any])?["text"] as? String) ?? bound ?? (e["type"] as? String == "text" ? e["text"] as? String : nil)
            let t = w?.split(whereSeparator: \.isNewline).joined(separator: " ").trimmingCharacters(in: .whitespaces) ?? ""
            return t.isEmpty ? nil : (t.count > 40 ? String(t.prefix(39)) + "…" : t)
        }
        // Named when there are few enough to read (whiteboard council, round 3, 16: "changed 1 shape"
        // didn't say which): "renamed Manager review to Finance review, added Notify team".
        var named: [String] = [], unnamed: [String: Int] = [:], namedVerbs: [(String, String)] = []
        // Words on a shape changed: the shape changed.
        var relabelled = [String: (String, String)]()
        for e in elements(after) {
            guard e["type"] as? String == "text", let box = e["containerId"] as? String, let id = e["id"] as? String, let was = old[id],
                  (was["text"] as? String) != (e["text"] as? String) else { continue }
            relabelled[box] = ((was["text"] as? String) ?? "", (e["text"] as? String) ?? "")
        }
        for e in elements(after) {
            guard let k = kind(e) else { continue }
            let gone = e["isDeleted"] as? Bool == true
            guard let id = e["id"] as? String, let was = old[id] else {
                if !gone {
                    added[k, default: 0] += 1
                    if k != "arrow", let w = words(e, in: elements(after)) { namedVerbs.append(("added", w)) } else { unnamed["added \(k)", default: 0] += 1 }
                }
                continue
            }
            if gone, was["isDeleted"] as? Bool != true {
                removed[k, default: 0] += 1
                if k != "arrow", let w = words(was, in: elements(before)) { namedVerbs.append(("removed", w)) } else { unnamed["removed \(k)", default: 0] += 1 }
            } else if !gone, look(was) != look(e) || relabelled[id] != nil {
                changed[k, default: 0] += 1
                let flat = { (t: String) in t.split(whereSeparator: \.isNewline).joined(separator: " ") }
                if let (from, to) = relabelled[id], !from.isEmpty, !to.isEmpty { named.append("renamed \(flat(from)) to \(flat(to))") }
                else if k != "arrow", let w = words(e, in: elements(after)) { namedVerbs.append(("changed", w)) }
                else { unnamed["changed \(k)", default: 0] += 1 }
            }
        }
        if named.count + namedVerbs.count <= 3, named.count + namedVerbs.count > 0 {
            var parts = named
            for verb in ["added", "changed", "removed"] {
                let ws = namedVerbs.filter { $0.0 == verb }.map(\.1)
                var list = ws
                for k in ["shape", "arrow", "text", "picture", "card"] {
                    guard let n = unnamed["\(verb) \(k)"], n > 0 else { continue }
                    list.append("\(n) \(k == "text" ? (n == 1 ? "text" : "texts") : (n == 1 ? k : k + "s"))")
                }
                guard !list.isEmpty else { continue }
                parts.append("\(verb) " + (list.count == 1 ? list[0] : list.dropLast().joined(separator: ", ") + " and " + list.last!))
            }
            return parts.joined(separator: ", ")
        }
        func say(_ verb: String, _ counts: [String: Int]) -> String? {
            let order = ["shape", "arrow", "text", "picture", "card"]
            let parts = order.compactMap { k -> String? in
                guard let n = counts[k], n > 0 else { return nil }
                let noun = k == "text" ? (n == 1 ? "text" : "texts") : (n == 1 ? k : k + "s")
                return "\(n) \(noun)"
            }
            guard !parts.isEmpty else { return nil }
            let list = parts.count == 1 ? parts[0] : parts.dropLast().joined(separator: ", ") + " and " + parts.last!
            return "\(verb) \(list)"
        }
        let said = [say("added", added), say("changed", changed), say("removed", removed)].compactMap { $0 }
        return said.isEmpty ? nil : said.joined(separator: ", ")
    }

    // MARK: Bringing boards in

    /// An Excalidraw file (`.excalidraw`, or the same JSON as `.json`) as a scene: its elements,
    /// background and pictures. Nil when it isn't one.
    static func scene(fromExcalidraw data: Data) -> [String: Any]? {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        let kind = json["type"] as? String
        guard kind == nil || kind == "excalidraw", let elements = json["elements"] as? [[String: Any]] else { return nil }
        var scene = emptyScene()
        scene["elements"] = elements
        if let bg = (json["appState"] as? [String: Any])?["viewBackgroundColor"] as? String { scene["appState"] = ["viewBackgroundColor": bg] }
        if let files = json["files"] as? [String: Any] { scene["files"] = files }
        return scene
    }

    /// The board's name from its file's: "Launch plan.excalidraw" is "Launch plan".
    static func name(ofFile url: URL) -> String {
        var name = url.deletingPathExtension().lastPathComponent
        if name.lowercased().hasSuffix(".excalidraw") { name = String(name.dropLast(".excalidraw".count)) }
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        return trimmed.isEmpty ? title : trimmed
    }

    // MARK: Two devices at once

    /// Both sides changed the scene since `base`: merged by element id. An element changed on one
    /// side only takes that side's; changed on both, the higher version wins (this device on a tie).
    /// One deleted on one side and untouched on the other stays deleted. The rest of the scene is
    /// this device's.
    static func merge(base: Any?, mine: Any?, theirs: Any?) -> Any? {
        guard let m = mine as? [String: Any], let t = theirs as? [String: Any],
              m["type"] as? String == "excalidraw", t["type"] as? String == "excalidraw" else { return mine }
        typealias El = [String: Any]
        func byID(_ x: Any?) -> [String: El] {
            Dictionary(((x as? [Any]) ?? []).compactMap { $0 as? El }.compactMap { e in (e["id"] as? String).map { ($0, e) } }, uniquingKeysWith: { a, _ in a })
        }
        let b = byID((base as? [String: Any])?["elements"]), mm = byID(m["elements"]), tt = byID(t["elements"])
        let order = (((m["elements"] as? [Any]) ?? []) + ((t["elements"] as? [Any]) ?? [])).compactMap { ($0 as? El)?["id"] as? String }
        var seen = Set<String>(), out: [Any] = []
        for id in order where seen.insert(id).inserted {
            let be = b[id], me = mm[id], te = tt[id]
            let pick: El?
            switch (me, te) {
            case let (me?, nil): pick = be.map { NotePageData.same($0, me) } == true ? nil : me
            case let (nil, te?): pick = be.map { NotePageData.same($0, te) } == true ? nil : te
            case let (me?, te?):
                if NotePageData.same(te, be) { pick = me }
                else if NotePageData.same(me, be) { pick = te }
                else { pick = ((te["version"] as? Int) ?? 0) > ((me["version"] as? Int) ?? 0) ? te : me }
            case (nil, nil): pick = nil
            }
            if let pick { out.append(pick) }
        }
        // Elements with no id yet (an AI's short form: an arrow often has none until the board
        // opens and fills it out) are kept, each once; merged by id they were dropped.
        let unnamed = { (x: Any?) in ((x as? [Any]) ?? []).compactMap { $0 as? El }.filter { $0["id"] == nil } }
        let theirsUnnamed = unnamed(t["elements"])
        out += theirsUnnamed
        out += unnamed(m["elements"]).filter { e in !theirsUnnamed.contains { NotePageData.same($0, e) } }
        var files = (t["files"] as? [String: Any]) ?? [:]
        for (k, v) in (m["files"] as? [String: Any]) ?? [:] { files[k] = v }
        var merged = m
        merged["elements"] = out
        merged["files"] = files
        return merged
    }
}

/// A note on a whiteboard (canvas-stack/src/cards.js draws it): what its card says, from the note.
/// The card keeps the note's id in its scene (`customData.pintoNote`); an AI may name the note by
/// its title instead, and the card takes the id once the note is found.
struct CanvasNoteCard: Equatable, Sendable {
    /// The note, when there is one.
    var id: UUID?
    /// Its title; nil keeps what the card says (a note that's gone).
    var title: String?
    /// Its first lines, or why there are none ("Locked", "Note deleted").
    var preview: String
    /// The note is gone, or no note has the card's title: the card is quiet and doesn't open.
    var deleted = false

    static let deletedText = "Note deleted"
    static let missingText = "No note has this title"
    static let lockedText = "Locked"
    /// How much of a note's text a card shows: about three lines.
    static let previewLength = 240

    var payload: [String: Any] {
        var p: [String: Any] = ["preview": preview, "deleted": deleted]
        if let id { p["id"] = id.uuidString }
        if let title { p["title"] = title }
        return p
    }

    /// What a card for `note` says: its title and first lines (a whiteboard's words), "Locked"
    /// for a locked note, and "Note deleted" once it's in Recently Deleted or gone.
    @MainActor static func of(_ note: Note, pages: NotePageStore = .shared, data: NotePageDataStore = .shared) -> CanvasNoteCard {
        guard note.trashedAt == nil, note.deletedAt == nil else { return CanvasNoteCard(id: note.id, title: nil, preview: deletedText, deleted: true) }
        if note.isLocked { return CanvasNoteCard(id: note.id, title: note.title, preview: lockedText) }
        if CanvasNote.isCanvas(NoteApps.page(note.id, in: pages)?.html) {
            return CanvasNoteCard(id: note.id, title: note.title, preview: CanvasSketch.of(note.id, in: data)?.preview ?? "")
        }
        return CanvasNoteCard(id: note.id, title: note.title, preview: preview(of: note.body))
    }

    /// A note's first lines after its title, as plain words on one line: markdown, pictures and
    /// a table's dividers left out, [[links]] read as their text.
    static func preview(of body: String) -> String {
        var out: [String] = []
        var length = 0, titled = false
        // Pictures go before the markdown does (stripped, "![shot](…)" read as "!shot").
        for line in body.split(separator: "\n", maxSplits: 60, omittingEmptySubsequences: true).prefix(60) {
            let bare = String(line.unicodeScalars.prefix(2000)).replacing(/!\[[^\]\n]*\]\([^)\n]*\)/, with: "").replacing(/!\[\[[^\]]*\]\]/, with: "")
            let words = WikiLinks.plain(NoteText.stripMarkup(bare)).trimmingCharacters(in: .whitespaces)
            guard !words.isEmpty else { continue }
            // The first line that says something is the title, on the card already.
            guard titled else { titled = true; continue }
            out.append(words)
            length += words.count + 1
            if length >= previewLength { break }
        }
        let joined = out.joined(separator: " ")
        return joined.count > previewLength ? String(joined.prefix(previewLength)) : joined
    }

    /// What each card says, by what it names: a note's id, or a title (with its folders, as a
    /// [[link]] has them) found from the board's folder as a link is. A note that's gone, or a
    /// title no note has, says so.
    @MainActor static func info(for refs: [String], from board: Note?, in context: ModelContext,
                                pages: NotePageStore = .shared, data: NotePageDataStore = .shared) -> [String: CanvasNoteCard] {
        var out: [String: CanvasNoteCard] = [:]
        for ref in refs where out[ref] == nil {
            if let id = UUID(uuidString: ref) {
                out[ref] = context.note(id).map { of($0, pages: pages, data: data) } ?? CanvasNoteCard(id: id, title: nil, preview: deletedText, deleted: true)
            } else if let found = WikiDirectory.index(context).resolve(ref, from: board.map { context.folderPath($0.folder) } ?? []).flatMap({ context.note($0) }) {
                out[ref] = of(found, pages: pages, data: data)
            } else {
                out[ref] = CanvasNoteCard(id: nil, title: nil, preview: missingText, deleted: true)
            }
        }
        return out
    }
}

/// Asks the window to make a new canvas (the compose button's menu, File › New Canvas).
@MainActor @Observable
final class NewCanvas {
    static let shared = NewCanvas()
    /// Counts up per ask; the window makes one canvas per change.
    var asks = 0

    @ObservationIgnored private var taken = 0

    func ask() {
        guard NoteApps.enabled else { return }
        asks += 1
    }

    /// One window makes it, however many are open: the first to claim the ask.
    func claim() -> Bool {
        guard taken < asks else { return false }
        taken = asks
        return true
    }
}

/// What a board holds, for its row in the list (whiteboard council, round 1: the row said "No
/// additional text" over a whole flowchart): its words for the preview and search, and its shapes
/// for a small picture. Worked out from the scene's bytes, once per change.
struct CanvasSketch: Equatable {
    struct Shape: Equatable {
        var kind: String
        var frame: CGRect
        var fill: String?
        /// A line, arrow or pencil stroke: its points, from the frame's origin.
        var points: [CGPoint] = []
    }
    var texts: [String] = []
    var shapes: [Shape] = []

    /// "Start · Do the thing · Did it work?"; "Drawing" for shapes with no words; nil for an empty board.
    var preview: String? { texts.isEmpty ? (shapes.isEmpty ? nil : Self.drawing) : texts.joined(separator: " \u{00B7} ") }
    static let drawing = "Drawing"
    /// Its words, one a line, for search.
    var searchText: String { texts.joined(separator: "\n") }

    init(texts: [String] = [], shapes: [Shape] = []) { self.texts = texts; self.shapes = shapes }

    /// From the scene's elements, in drawing order; deleted ones left out. Words keep the order
    /// they were drawn in, each once.
    init(elements: [[String: Any]]) {
        var seen = Set<String>()
        for e in elements where (e["isDeleted"] as? Bool) != true {
            guard let type = e["type"] as? String else { continue }
            let num = { (k: String) -> Double in (e[k] as? Double) ?? (e[k] as? Int).map(Double.init) ?? 0 }
            // A note card: its note's title, as a box (its glyph and first lines are the note's,
            // not the board's words).
            if let card = e["customData"] as? [String: Any], card["pintoNote"] is String {
                switch card["pintoCard"] as? String {
                case "card", nil:
                    let t = ((card["title"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                    if !t.isEmpty, seen.insert(t).inserted { texts.append(t) }
                    shapes.append(Shape(kind: "rectangle", frame: CGRect(x: num("x"), y: num("y"), width: num("width"), height: num("height")), fill: "#ffffff"))
                default: break
                }
                continue
            }
            if type == "text" {
                // A template's how-to line isn't the board's words, and its title is the board's
                // name, already the row's title (whiteboard council, round 2: two flowcharts' rows
                // both began "Flowchart ·").
                let mark = e["customData"] as? [String: Any]
                if mark?["pintoHint"] as? Bool == true || mark?["pintoTitle"] as? Bool == true { continue }
                let t = ((e["originalText"] as? String) ?? (e["text"] as? String) ?? "")
                    .split(whereSeparator: \.isNewline).joined(separator: " ").trimmingCharacters(in: .whitespaces)
                if !t.isEmpty, seen.insert(t).inserted { texts.append(t) }
                continue
            }
            if let label = (e["label"] as? [String: Any])?["text"] as? String {
                let t = label.trimmingCharacters(in: .whitespacesAndNewlines)
                if !t.isEmpty, seen.insert(t).inserted { texts.append(t) }
            }
            let frame = CGRect(x: num("x"), y: num("y"), width: num("width"), height: num("height"))
            let fill = (e["backgroundColor"] as? String).flatMap { $0 == "transparent" ? nil : $0 }
            var points: [CGPoint] = []
            if let ps = e["points"] as? [[Any]] {
                points = ps.compactMap { p in
                    guard p.count >= 2 else { return nil }
                    let x = (p[0] as? Double) ?? (p[0] as? Int).map(Double.init), y = (p[1] as? Double) ?? (p[1] as? Int).map(Double.init)
                    return x.flatMap { x in y.map { CGPoint(x: x, y: $0) } }
                }
            }
            shapes.append(Shape(kind: type, frame: frame, fill: fill, points: points))
        }
    }

    /// The whiteboards whose words hold `query`, as search finds text in a note.
    @MainActor static func notes(holding query: String, data: NotePageDataStore = .shared, pages: NotePageStore = .shared) -> Set<UUID> {
        var out = Set<UUID>()
        for id in data.ids where CanvasNote.isCanvas(NoteApps.page(id, in: pages)?.html) {
            if let s = of(id, in: data), s.searchText.localizedStandardContains(query) { out.insert(id) }
        }
        return out
    }

    @MainActor private static var cache: [UUID: (data: Data, sketch: CanvasSketch)] = [:]

    /// The board's sketch, from the page data store's bytes, read without watching them: a row
    /// that watched the store would redraw on every stroke on any board. The row redraws when the
    /// note's date moves, which a save does.
    @MainActor static func of(_ id: UUID, in store: NotePageDataStore = .shared) -> CanvasSketch? {
        guard let data = store.peek(id) else { return nil }
        if let c = cache[id], c.data == data { return c.sketch }
        let scene = (NotePageData.decode(data)["values"] as? [String: Any])?["scene"] as? [String: Any]
        let sketch = CanvasSketch(elements: scene?["elements"] as? [[String: Any]] ?? [])
        cache[id] = (data, sketch)
        return sketch
    }
}
