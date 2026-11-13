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
    /// Shapes, not a scribble: beside the compose pencil a scribble read as a second New Note
    /// (create study, 13 November 2026). The list marks canvases with it too.
    static let symbol = "square.on.circle"
    static let title = "Canvas"

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
    <title>Canvas</title>
    <link rel="stylesheet" href="amber-lib:///canvas/canvas.css">
    <div id="canvas"></div>
    <script>window.EXCALIDRAW_ASSET_PATH = "amber-lib:///canvas/";</script>
    <script src="amber-lib:///canvas/canvas.js"></script>
    """

    /// What an AI reads first (the server tells it to read an app's README.md).
    static let readme = """
    # Canvas

    This note is a canvas: a drawing board in Pinto Notes, not an app to build. Don't change index.html.

    The drawing is in data.json, as `values.scene`: a standard Excalidraw scene, the same JSON an .excalidraw file holds.

        { "values": { "scene": { "type": "excalidraw", "version": 2, "elements": [ … ], "appState": { "viewBackgroundColor": "#ffffff" }, "files": {} } }, "collections": {} }

    To draw, add elements to `values.scene.elements` with edit or write. Full elements work, and so does the short form, which the canvas fills out when it opens:

        { "type": "rectangle", "id": "start", "x": 0, "y": 0, "width": 180, "height": 70, "label": { "text": "Start" } }
        { "type": "arrow", "x": 90, "y": 70, "width": 0, "height": 80, "start": { "id": "start" }, "end": { "id": "next" } }
        { "type": "text", "x": 0, "y": -60, "text": "Title" }

    Types: rectangle, ellipse, diamond, arrow, line, text, freedraw. Colors are `strokeColor` and `backgroundColor` (hex). Give each element its own `id` so arrows can bind to it.

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

    /// A new, empty canvas in `scope`'s folder: the note, its page and its empty scene, all at once,
    /// no AI and no network.
    @MainActor @discardableResult
    static func make(in scope: Scope, context: ModelContext, pages: NotePageStore = .shared, data: NotePageDataStore = .shared) -> Note {
        let note = context.createNote(in: scope, body: title)
        data.set(note.id, ["values": ["scene": emptyScene()], "collections": [String: Any]()])
        pages.setHere(note.id, .init(html: project, by: writer, at: .now))
        return note
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
        var files = (t["files"] as? [String: Any]) ?? [:]
        for (k, v) in (m["files"] as? [String: Any]) ?? [:] { files[k] = v }
        var merged = m
        merged["elements"] = out
        merged["files"] = files
        return merged
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
