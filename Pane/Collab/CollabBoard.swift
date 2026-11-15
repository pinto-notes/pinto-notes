import Automerge
import CryptoKit
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
/// bring them back.
///
/// A picture is an image element in `board` like any other. Its bytes aren't in the document (a
/// change holds 256 KB, a snapshot 4 MB, and the document keeps every change for good): each
/// picture is sealed under the note key on its own and stored beside the document (`note_files`,
/// `Pictures`), put there once by whoever added it, and fetched by its file id when a device
/// first draws it.
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

    /// A new board's maps, holding `scene`'s drawing (the owner, when sharing). Elements without
    /// an id aren't taken, nor a picture without its file id. The pictures' bytes go up beside it.
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

    /// The whole scene, as a board's data keeps it (`values.scene`), with the pictures given in
    /// `files` that its pictures in use show (as a board of your own keeps only those).
    static func scene(elements: [Element], settings: [String: Any], files: [String: [String: Any]] = [:]) -> [String: Any] {
        var s = CanvasNote.emptyScene()
        s["elements"] = elements
        var appState = (s["appState"] as? [String: Any]) ?? [:]
        for (k, v) in settings { appState[k] = v }
        s["appState"] = appState
        if !files.isEmpty {
            let used = Pictures.inUse(elements)
            s["files"] = files.filter { used.contains($0.key) }
        }
        return s
    }

    // MARK: Writing

    /// What of `elements` (a board's scene as the page saved it) the document should take, given
    /// what it holds now: each element that wins over the document's copy. Nothing without an id
    /// is taken, nor a picture without its file id.
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

    /// A picture goes in with the id of the file it shows; every other element as it is.
    static func keeps(_ e: Element) -> Bool { (e["type"] as? String) != "image" || Pictures.fileID(of: e) != nil }

    /// Whether a scene holds a picture (not deleted).
    static func hasPictures(_ scene: [String: Any]?) -> Bool {
        !Pictures.inUse((scene?["elements"] as? [Element]) ?? []).isEmpty
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

extension CollabBoard {
    /// The pictures on a shared whiteboard (16 November 2026). Each is sealed under the note key on
    /// its own (`amb3f`, AAD with the note, the key's epoch and the file id) and stored beside the
    /// document (`note_files`): what's sealed is its type, a newline, then its bytes. The board
    /// keeps each one as Excalidraw does, `{ id, dataURL, mimeType, created }`.
    enum Pictures {
        typealias File = [String: Any]

        /// At most this much of pictures in use on one board, as on a board of your own (its data
        /// is 4 MB in all): counted as the scene keeps them, data URLs.
        static let maxInUse = 4 * 1024 * 1024
        /// One picture sealed is at most this (note_files.ct).
        static let maxSealed = 4_194_304

        static let tooBig = "This picture doesn\u{2019}t fit: a whiteboard\u{2019}s pictures can be 4 MB in all"
        static let notThere = "This picture didn\u{2019}t reach the board. Try adding it again."
        static let viewOnly = "You can view this whiteboard but not change it"

        static func fileID(of e: Element) -> String? {
            guard (e["type"] as? String) == "image", let id = e["fileId"] as? String,
                  id.range(of: "^[A-Za-z0-9_-]{1,128}$", options: .regularExpression) != nil else { return nil }
            return id
        }

        /// The file ids the pictures in use show (not deleted ones).
        static func inUse(_ elements: [Element]) -> Set<String> {
            Set(elements.compactMap { ($0["isDeleted"] as? Bool) == true ? nil : fileID(of: $0) })
        }

        /// A picture as the board gave it, when it's one: a data URL of an image.
        static func valid(_ f: Any?, id: String) -> File? {
            guard let f = f as? File, f["id"] as? String == id, let url = f["dataURL"] as? String, url.hasPrefix("data:image/"),
                  url.contains(";base64,") else { return nil }
            var out: File = ["id": id, "dataURL": url, "mimeType": (f["mimeType"] as? String) ?? mime(of: url)]
            out["created"] = (f["created"] as? NSNumber) ?? NSNumber(value: Date.now.timeIntervalSince1970 * 1000)
            return out
        }

        static func mime(of url: String) -> String {
            String(url.dropFirst(5).prefix { $0 != ";" && $0 != "," })
        }

        /// How much of the board's room a picture takes: its data URL, as a scene keeps it.
        static func size(_ f: File) -> Int { (f["dataURL"] as? String)?.utf8.count ?? 0 }

        /// How big it is sealed (`amb3f.<epoch>.` and base64 of its type, its bytes, the nonce and tag).
        static func sealedSize(_ f: File) -> Int {
            guard let url = f["dataURL"] as? String, let comma = url.firstIndex(of: ",") else { return .max }
            let b64 = url.utf8.count - url[...comma].utf8.count
            let bytes = b64 / 4 * 3 + ((f["mimeType"] as? String) ?? mime(of: url)).utf8.count + 1 + 28
            return 12 + (bytes + 2) / 3 * 4
        }

        /// The picture sealed for the server.
        static func seal(_ f: File, nk: SymmetricKey, note: UUID, epoch: Int) throws -> String {
            guard let id = f["id"] as? String, let url = f["dataURL"] as? String, let comma = url.firstIndex(of: ","),
                  let bytes = Data(base64Encoded: String(url[url.index(after: comma)...])) else { throw CollabCrypto.Failure.malformed }
            let mime = (f["mimeType"] as? String) ?? mime(of: url)
            return try CollabCrypto.seal(.file, Data((mime + "\n").utf8) + bytes, nk: nk, note: note, epoch: epoch, extra: id)
        }

        /// A picture from the server, opened: as the board keeps it.
        static func open(_ row: Collab.File, keys: [Int: SymmetricKey], note: UUID) throws -> File {
            guard let nk = keys[row.epoch] else { throw CollabCrypto.Failure.wrongKey }
            let plain = try CollabCrypto.open(.file, row.ct, nk: nk, note: note, extra: row.file_id)
            guard let nl = plain.firstIndex(of: 0x0A), nl > plain.startIndex, plain.distance(from: plain.startIndex, to: nl) <= 100,
                  let mime = String(data: plain[plain.startIndex..<nl], encoding: .utf8), mime.hasPrefix("image/") else { throw CollabCrypto.Failure.malformed }
            let bytes = plain[plain.index(after: nl)...]
            return ["id": row.file_id, "dataURL": "data:\(mime);base64," + Data(bytes).base64EncodedString(), "mimeType": mime,
                    "created": NSNumber(value: Date.now.timeIntervalSince1970 * 1000)]
        }

        /// What a picture's box opens to, sealed again under a newer key.
        static func reseal(_ row: Collab.File, keys: [Int: SymmetricKey], to epoch: Int, note: UUID) throws -> String {
            guard let old = keys[row.epoch], let nk = keys[epoch] else { throw CollabCrypto.Failure.wrongKey }
            let plain = try CollabCrypto.open(.file, row.ct, nk: old, note: note, extra: row.file_id)
            return try CollabCrypto.seal(.file, plain, nk: nk, note: note, epoch: epoch, extra: row.file_id)
        }
    }
}

/// An open shared whiteboard joined to its session: what the page draws goes into the document as
/// changes (a new picture's bytes with it), the document's drawing comes back into the page
/// whenever someone else's change moves it (with the pictures the page doesn't have yet), the
/// others' pointers and selections are drawn, an AI's change is outlined with its name, and a
/// viewer's board is in the engine's view mode.
@MainActor enum BoardCollab {
    static func wire(_ session: CollabSession, _ canvas: CanvasController) {
        canvas.share(true, viewOnly: !session.canWrite)
        session.onRemoteBoard = { [weak canvas] scene in canvas?.remote(scene: scene) }
        session.onBoardAI = { [weak canvas] by, ids in canvas?.outline(by: by, ids: ids) }
        // Someone's change, or yours from another device: outlined quietly in their colour, unless
        // you can see them at it (round 14).
        session.onBoardArrived = { [weak canvas, weak session] authors, ids in
            guard let canvas, let session, let arrival = arrival(authors, in: session) else { return }
            canvas.arrived(from: arrival.name, kind: arrival.kind, ids: ids)
        }
        session.onBoardPeers = { [weak canvas] peers in canvas?.show(peers: peers) }
        canvas.onBoardFiles = { [weak session] files in session?.offerPictures(files) }
        canvas.onBoardDelta = { [weak session] elements, settings in session?.boardLocal(elements, settings: settings) }
        session.onPicturesRefused = { [weak canvas] ids, why in
            if !ids.isEmpty { canvas?.send(.refusePictures(ids)) }
            canvas?.confirm(why, for: .seconds(4))
        }
        canvas.onPresence = { [weak session] pointer, selection in session?.boardPresence(pointer: pointer, selection: selection) }
        // Following someone (BoardFollow): what you present and see goes out with your pointer;
        // everyone else's comes back, and their laser trails.
        canvas.onBoardLook = { [weak session] look in session?.boardLook(look) }
        canvas.onFollow = { [weak session] id in session?.boardFollow(id) }
        session.onBoardPeople = { [weak canvas] people in canvas?.show(people: people) }
        session.onBoardLaser = { [weak canvas] id, points in canvas?.laser(from: id, points: points) }
        canvas.onLoad = { [weak session, weak canvas] in
            guard let session, let canvas else { return }
            canvas.remote(scene: session.boardScene())
            canvas.resendPeers()
        }
        // What the page has may be behind the document (the drawing kept beside the note settles
        // after a moment): it's handed the document's.
        canvas.remote(scene: session.boardScene())
        canvas.show(peers: session.boardPeers)
        canvas.show(people: session.boardPeople)
        // Comments (BoardComments): in the document, sealed as the drawing is; viewers read them.
        canvas.author = BoardComments.Author(id: session.me.uuidString, name: BoardComments.firstName(session.myName))
        canvas.colorOf = { [weak session] id in session?.boardColor(of: id) ?? BoardComments.color(for: id) }
        canvas.onComments = { [weak session] list in session?.commentLocal(list) }
        session.onBoardComments = { [weak canvas] list in canvas?.show(comments: list) }
        canvas.setCanComment(session.canWrite)
        mention(session, canvas)
        canvas.show(comments: session.boardComments)
    }

    /// The name a change from elsewhere is marked with ("Sara", "Sara and Ola", or your other
    /// device), and its look; nil when everyone it came from is at work on the board in view.
    static let yourOtherDevice = "Your other device"
    static func arrival(_ authors: [UUID], in session: CollabSession) -> (name: String, kind: CanvasController.Highlight.Kind)? {
        let unseen = authors.filter { $0 == session.me || !session.watching($0) }
        guard !unseen.isEmpty else { return nil }
        let people = unseen.filter { $0 != session.me }
        guard let first = people.first else { return (yourOtherDevice, .device) }
        let names = people.map { session.firstName(of: $0) ?? AIEdit.someone }
        let name = names.count == 1 ? names[0] : names.count == 2 ? "\(names[0]) and \(names[1])" : "\(names[0]) and \(names.count - 1) others"
        let c = session.boardColors(of: first)
        return (name, .person(color: c.light, dark: c.dark))
    }

    /// The people a comment can mention (@Sara): the board's other members who joined, by first
    /// name, never you.
    static func people(_ session: CollabSession) -> [BoardComments.Person] {
        session.members.filter { $0.id != session.me && $0.accepted }.compactMap { m in
            let name = BoardComments.firstName(m.name)
            return name == "You" ? nil : BoardComments.Person(id: m.id.uuidString, name: name)
        }
    }

    private static func mention(_ session: CollabSession, _ canvas: CanvasController) {
        let p = people(session)
        if p != canvas.mentionable { canvas.mentionable = p }
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
            session.onBoardArrived = nil
            session.onBoardPeers = nil
            session.onPicturesRefused = nil
            session.onBoardComments = nil
            session.onBoardPeople = nil
            session.onBoardLaser = nil
            session.boardPresence(pointer: nil, selection: [])
            session.boardLook(BoardLook())
            session.boardFollow(nil)
        }
        canvas.onBoardLook = nil
        canvas.onFollow = nil
        canvas.stopFollowing()
        canvas.onBoardFiles = nil
        canvas.onComments = nil
        canvas.mentionable = []
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
        canvas.show(people: session.boardPeople)
        canvas.setCanComment(session.canWrite)
        mention(session, canvas)
    }
}
