import Automerge
import Foundation

/// A shared whiteboard's drawing in its Automerge document (14 November 2026).
///
/// A board is a note whose app page is the canvas (CanvasNote). Shared, its document holds what a
/// note's does (`body`, the board's title) and its drawing beside it:
///
/// - `board`: a map from each element's id to the element as JSON (one Excalidraw element, as the
///   scene keeps it). Two people changing different elements at once both land. Two changing the
///   same element at once leave two values under its id; every device picks the same one, as
///   Excalidraw's own reconciling does: the higher `version`, then the lower `versionNonce`.
/// - `boardState`: the scene's `viewBackgroundColor` and `gridModeEnabled`.
///
/// Deleted elements stay as Excalidraw keeps them (`isDeleted`), so a device that was away can't
/// bring them back. Pictures aren't in it: their bytes are the scene's `files`, which aren't
/// shared yet (SharedNoteLimits), so a shared board takes none.
enum CollabBoard {
    typealias Document = CollabText.Document
    typealias ObjId = CollabText.ObjId
    typealias Element = [String: Any]

    static let key = "board"
    static let stateKey = "boardState"
    /// The scene's settings kept with the drawing (`boardState`), the ones Pinto saves.
    static let settings = ["viewBackgroundColor", "gridModeEnabled"]

    /// Which of two edits of one element wins: Excalidraw's rule (data/reconcile.ts).
    struct Stamp: Equatable {
        var version: Int
        var nonce: Int

        init(version: Int, nonce: Int) { self.version = version; self.nonce = nonce }

        /// An element's stamp. An AI's short form has neither: it's version 0, and the full element
        /// a board makes of it wins.
        init(_ e: Element) {
            version = (e["version"] as? NSNumber)?.intValue ?? 0
            nonce = (e["versionNonce"] as? NSNumber)?.intValue ?? 0
        }

        /// This edit wins over `other`: newer, or as new with the lower nonce.
        func beats(_ other: Stamp) -> Bool { version > other.version || (version == other.version && nonce < other.nonce) }
    }

    /// The board's map in `doc`, when the document is a board's.
    static func board(in doc: Document) -> ObjId? {
        guard case .Object(let id, .Map)? = try? doc.get(obj: .ROOT, key: key) else { return nil }
        return id
    }

    static func state(in doc: Document) -> ObjId? {
        guard case .Object(let id, .Map)? = try? doc.get(obj: .ROOT, key: stateKey) else { return nil }
        return id
    }

    /// A new board's maps, holding `scene`'s drawing (the owner, when sharing). Pictures and
    /// elements without an id aren't taken.
    @discardableResult
    static func create(in doc: Document, scene: [String: Any]) throws -> ObjId {
        let board = try doc.putObject(obj: .ROOT, key: key, ty: .Map)
        let state = try doc.putObject(obj: .ROOT, key: stateKey, ty: .Map)
        for e in (scene["elements"] as? [Element]) ?? [] {
            guard let id = id(of: e), keeps(e), let json = encode(e) else { continue }
            try doc.put(obj: board, key: id, value: .String(json))
        }
        let appState = (scene["appState"] as? [String: Any]) ?? [:]
        for k in settings { if let v = scalar(appState[k]) { try doc.put(obj: state, key: k, value: v) } }
        return board
    }

    // MARK: Reading

    /// One element's values in the document: one, or more after two people changed it at once.
    struct Entry {
        var raw: [String]
        var element: Element
        var stamp: Stamp
    }

    /// Every element as the document holds it now (or at `heads`), each conflict resolved.
    /// `reuse`: entries read before; one whose values haven't changed isn't decoded again (a
    /// change from someone else touches a few elements of hundreds).
    static func entries(in doc: Document, _ board: ObjId, heads: Set<CollabText.ChangeHash>? = nil, reuse: [String: Entry] = [:]) -> [String: Entry] {
        let keys = heads.map { doc.keysAt(obj: board, heads: $0) } ?? doc.keys(obj: board)
        var out: [String: Entry] = [:]
        out.reserveCapacity(keys.count)
        for k in keys {
            let values = (heads.map { try? doc.getAllAt(obj: board, key: k, heads: $0) } ?? (try? doc.getAll(obj: board, key: k))) ?? []
            let raw = values.compactMap { v -> String? in if case .Scalar(.String(let s)) = v { return s } else { return nil } }.sorted()
            if let had = reuse[k], had.raw == raw { out[k] = had; continue }
            if let e = resolve(raw) { out[k] = e }
        }
        return out
    }

    /// The winner among values written for one element at once: Excalidraw's rule, and the same
    /// on every device (the JSON itself breaks a tie no stamp does).
    static func resolve(_ raw: [String]) -> Entry? {
        var best: Entry?
        for s in raw {
            guard let e = decode(s) else { continue }
            let st = Stamp(e)
            if let b = best, !(st.beats(b.stamp) || (st == b.stamp && s < b.raw[0])) { continue }
            best = Entry(raw: [s], element: e, stamp: st)
        }
        if var b = best { b.raw = raw; best = b }
        return best
    }

    /// The elements in drawing order: by Excalidraw's fractional `index`, then id.
    static func ordered(_ entries: [String: Entry]) -> [Element] {
        entries.sorted { a, b in
            let ia = a.value.element["index"] as? String, ib = b.value.element["index"] as? String
            switch (ia, ib) {
            case let (x?, y?) where x != y: return x.utf8.lexicographicallyPrecedes(y.utf8)
            case (_?, nil): return true
            case (nil, _?): return false
            default: return a.key.utf8.lexicographicallyPrecedes(b.key.utf8)
            }
        }.map(\.value.element)
    }

    /// The scene's settings as the document has them.
    static func settings(in doc: Document) -> [String: Any] {
        guard let state = state(in: doc) else { return [:] }
        var out: [String: Any] = [:]
        for k in settings {
            switch try? doc.get(obj: state, key: k) {
            case .Scalar(.String(let s))?: out[k] = s
            case .Scalar(.Boolean(let b))?: out[k] = b
            default: break
            }
        }
        return out
    }

    /// The whole scene, as a board's data keeps it (`values.scene`), with no pictures.
    static func scene(elements: [Element], settings: [String: Any]) -> [String: Any] {
        var s = CanvasNote.emptyScene()
        s["elements"] = elements
        var appState = (s["appState"] as? [String: Any]) ?? [:]
        for (k, v) in settings { appState[k] = v }
        s["appState"] = appState
        return s
    }

    // MARK: Writing

    /// What of `elements` (a board's scene as the page saved it) the document should take, given
    /// what it holds now: each element that wins over the document's copy. Pictures aren't taken,
    /// nor anything without an id.
    static func winners(_ elements: [Element], over current: [String: Stamp]) -> [(id: String, element: Element)] {
        var out: [(String, Element)] = []
        for e in elements {
            guard let id = id(of: e), keeps(e) else { continue }
            if let had = current[id], !Stamp(e).beats(had) { continue }
            out.append((id, e))
        }
        return out
    }

    static func id(of e: Element) -> String? {
        guard let id = e["id"] as? String, !id.isEmpty, id.utf8.count <= 200 else { return nil }
        return id
    }

    /// Pictures aren't shared yet: their bytes are the scene's files.
    static func keeps(_ e: Element) -> Bool { (e["type"] as? String) != "image" }

    /// Whether a scene holds a picture (not deleted): such a board can't be shared yet.
    static func hasPictures(_ scene: [String: Any]?) -> Bool {
        ((scene?["elements"] as? [Element]) ?? []).contains { ($0["type"] as? String) == "image" && ($0["isDeleted"] as? Bool) != true }
    }

    static func encode(_ e: Element) -> String? {
        guard JSONSerialization.isValidJSONObject(e), let data = try? JSONSerialization.data(withJSONObject: e, options: [.sortedKeys]) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func decode(_ s: String) -> Element? {
        (try? JSONSerialization.jsonObject(with: Data(s.utf8))) as? Element
    }

    static func scalar(_ v: Any?) -> ScalarValue? {
        switch v {
        case let s as String: .String(s)
        case let n as NSNumber where CFGetTypeID(n) == CFBooleanGetTypeID(): .Boolean(n.boolValue)
        case let b as Bool: .Boolean(b)
        default: nil
        }
    }

    /// A short fingerprint of a drawing: each element's id and stamp, in order, and the settings.
    static func fingerprint(_ elements: [Element], settings: [String: Any]) -> String {
        var out = settings.keys.sorted().map { "\($0)=\(settings[$0]!)" }.joined(separator: ",") + "|"
        for e in elements {
            let st = Stamp(e)
            out += "\(e["id"] as? String ?? "-"):\(st.version):\(st.nonce);"
        }
        return out
    }

    /// The ids of elements that differ between two drawings (added, changed or deleted), for
    /// outlining what an AI changed.
    static func changedIDs(from before: [String: Entry], to after: [String: Entry]) -> [String] {
        after.compactMap { id, e in
            guard let was = before[id] else { return (e.element["isDeleted"] as? Bool) == true ? nil : id }
            return was.raw == e.raw ? nil : id
        }.sorted()
    }
}

/// An open shared whiteboard joined to its session: what the page draws goes into the document as
/// changes, the document's drawing comes back into the page whenever someone else's change moves
/// it, the others' pointers and selections are drawn, an AI's change is outlined with its name,
/// and a viewer's board is in the engine's view mode.
@MainActor enum BoardCollab {
    static func wire(_ session: CollabSession, _ canvas: CanvasController) {
        canvas.share(true, viewOnly: !session.canWrite)
        session.onRemoteBoard = { [weak canvas] scene in canvas?.remote(scene: scene) }
        session.onBoardAI = { [weak canvas] by, ids in canvas?.outline(by: by, ids: ids) }
        session.onBoardPeers = { [weak canvas] peers in canvas?.show(peers: peers) }
        canvas.onBoardDelta = { [weak session] elements, settings in session?.boardLocal(elements, settings: settings) }
        canvas.onPresence = { [weak session] pointer, selection in session?.boardPresence(pointer: pointer, selection: selection) }
        canvas.onLoad = { [weak session, weak canvas] in
            guard let session, let canvas else { return }
            canvas.remote(scene: session.boardScene())
            canvas.resendPeers()
        }
        // What the page has may be behind the document (the drawing kept beside the note settles
        // after a moment): it's handed the document's.
        canvas.remote(scene: session.boardScene())
        canvas.show(peers: session.boardPeers)
        // Comments (BoardComments): in the document, sealed as the drawing is; viewers read them.
        canvas.author = BoardComments.Author(id: session.me.uuidString, name: BoardComments.firstName(session.myName))
        canvas.colorOf = { [weak session] id in session?.boardColor(of: id) ?? BoardComments.color(for: id) }
        canvas.onComments = { [weak session] list in session?.commentLocal(list) }
        session.onBoardComments = { [weak canvas] list in canvas?.show(comments: list) }
        canvas.setCanComment(session.canWrite)
        canvas.show(comments: session.boardComments)
    }

    /// A board of your own: its comments are in its page data, which syncs as the drawing does
    /// (and merges by comment, so replies written at once on two devices both stay).
    static func wirePrivate(_ note: UUID, _ canvas: CanvasController, canComment: Bool = true, store: NotePageDataStore = .shared) {
        guard !canvas.shared else { return }
        canvas.author = BoardComments.me()
        canvas.colorOf = { BoardComments.color(for: $0) }
        canvas.onComments = { [weak store] list in if let store { BoardComments.keep(list, for: note, in: store) } }
        canvas.setCanComment(canComment)
        canvas.show(comments: BoardComments.stored(in: store.doc(note)))
    }

    /// The board closed, or the note is no longer shared.
    static func unwire(_ session: CollabSession?, _ canvas: CanvasController) {
        if let session {
            session.onRemoteBoard = nil
            session.onBoardAI = nil
            session.onBoardPeers = nil
            session.onBoardComments = nil
            session.boardPresence(pointer: nil, selection: [])
        }
        canvas.onComments = nil
        canvas.colorOf = { BoardComments.color(for: $0) }
        canvas.show(comments: [])
        canvas.onBoardDelta = nil
        canvas.onPresence = nil
        canvas.onLoad = nil
        canvas.share(false)
    }

    /// While the board is open, a few times a second: whether you can still edit (your access
    /// changed), and the others' flags fading and colours going grey when they go quiet.
    static func tick(_ session: CollabSession, _ canvas: CanvasController) {
        canvas.share(true, viewOnly: !session.canWrite)
        canvas.show(peers: session.boardPeers)
        canvas.setCanComment(session.canWrite)
    }
}
