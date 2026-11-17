import Foundation
import Observation

/// A page's own data (prototype; see NotePage): anything the page wants to keep that isn't the
/// note's text, such as workouts, settings, a flashcard schedule. One JSON document per note, next to
/// the page in the database (note_pages.data_ct, sealed with the account key), never in the markdown:
///
///     { "values": { "goal": 4 },
///       "collections": { "workouts": [{ "id": "…", "created": "…", "updated": "…", "km": 5.2 }] } }
///
/// Files (photos, recordings) live in the encrypted file storage; records point at them with
/// `{"$file": "<attachment id>"}`. Up to 4 MB of JSON.
enum NotePageData {
    typealias Doc = [String: Any]
    static let maxBytes = 4 * 1024 * 1024

    static func empty() -> Doc { ["values": Doc(), "collections": Doc()] }
    /// `empty()` as `encode` gives it: what a page is given for a note with no data yet.
    static let emptyData = encode(empty())

    static func encode(_ doc: Doc) -> Data {
        (try? JSONSerialization.data(withJSONObject: doc, options: [.sortedKeys, .fragmentsAllowed])) ?? Data("{}".utf8)
    }

    static func decode(_ data: Data?) -> Doc {
        guard let data, let d = (try? JSONSerialization.jsonObject(with: data)) as? Doc else { return empty() }
        return ["values": d["values"] as? Doc ?? Doc(), "collections": d["collections"] as? Doc ?? Doc()]
    }

    /// Two JSON values are the same when they encode the same.
    static func same(_ a: Any?, _ b: Any?) -> Bool {
        switch (a, b) {
        case (nil, nil): true
        case (nil, _), (_, nil): false
        case let (x?, y?): (try? JSONSerialization.data(withJSONObject: [x], options: .sortedKeys)) == (try? JSONSerialization.data(withJSONObject: [y], options: .sortedKeys))
        }
    }

    /// What a text note held, for its new app to start from (once, when the note becomes an app):
    /// its tables as rows keyed by column, its checklists, under their headings, and the text.
    static func imported(from body: String) -> Doc {
        let lines = body.components(separatedBy: "\n")
        var tables = Doc(), checklists = Doc()
        for (i, t) in NotePage.tables(in: lines).enumerated() {
            let name = (NotePage.heading(above: t.header, in: lines) as? String) ?? "Table \(i + 1)"
            tables[name] = t.rows.map { r in Dictionary(t.columns.enumerated().map { ($1.name, $0 < r.count ? r[$0] : "") }, uniquingKeysWith: { a, _ in a }) }
        }
        for (i, line) in lines.enumerated() {
            guard let p = ListPrefix(line: line), let checked = p.checkbox else { continue }
            let name = (NotePage.heading(above: i, in: lines) as? String) ?? "Checklist"
            var list = checklists[name] as? [Doc] ?? []
            list.append(["text": (line as NSString).substring(from: p.length), "checked": checked])
            checklists[name] = list
        }
        return ["tables": tables, "checklists": checklists, "text": body]
    }

    // MARK: Changes a page can ask for

    indirect enum Op {
        case set(key: String, value: Any?)
        /// Several changes as one (amber.batch): one Undo.
        case batch([Op])
        case patch(Doc)
        case add(collection: String, fields: Doc)
        case update(collection: String, id: String, patch: Doc)
        case remove(collection: String, id: String)

        init(_ message: Any) throws {
            guard let m = message as? Doc, let op = m["op"] as? String else { throw NotePage.OpError("Send { op, … }.") }
            func string(_ k: String) throws -> String {
                guard let s = m[k] as? String, !s.isEmpty, s.count <= 200 else { throw NotePage.OpError("\(k) must be a short string.") }
                return s
            }
            func object(_ k: String) throws -> Doc {
                guard let d = m[k] as? Doc else { throw NotePage.OpError("\(k) must be an object.") }
                return d
            }
            switch op {
            case "store.set": self = .set(key: try string("key"), value: m["value"] is NSNull ? nil : m["value"])
            // The value as JSON text (a board's drawing): one string across the bridge, not a tree
            // the web view copies object by object.
            case "store.setJSON":
                guard let json = m["json"] as? String, let value = try? JSONSerialization.jsonObject(with: Data(json.utf8), options: [.fragmentsAllowed]) else { throw NotePage.OpError("json must be JSON text.") }
                self = .set(key: try string("key"), value: value is NSNull ? nil : value)
            case "store.patch": self = .patch(try object("patch"))
            case "collection.add": self = .add(collection: try string("name"), fields: try object("fields"))
            case "collection.update": self = .update(collection: try string("name"), id: try string("id"), patch: try object("patch"))
            case "collection.remove": self = .remove(collection: try string("name"), id: try string("id"))
            case "batch":
                guard let ops = m["ops"] as? [Any], !ops.isEmpty, ops.count <= 500 else { throw NotePage.OpError("ops must be a list of up to 500 changes.") }
                self = .batch(try ops.map { try Op($0) })
            default: throw NotePage.OpError("Unknown op \(op).")
            }
        }
    }

    /// The document after `op`, and the new record's id for an add. Throws past the size limit.
    static func apply(_ op: Op, to doc: Doc, now: Date = .now, newID: () -> String = { UUID().uuidString.lowercased() }) throws -> (Doc, String?) {
        let (d, data, made) = try applyEncoded(op, to: doc, now: now, newID: newID)
        _ = data
        return (d, made)
    }

    /// `apply`, with the document as the store keeps it (`encode`), for `NotePageDataStore.set`.
    /// One pass over the document: a canvas saves its whole drawing each time, and the copy through
    /// JSON, the size check and the store's encoding were three passes per save on the main thread
    /// (80 ms a save at 500 strokes, growing with the drawing).
    static func applyEncoded(_ op: Op, to doc: Doc, now: Date = .now, newID: () -> String = { UUID().uuidString.lowercased() }) throws -> (Doc, Data, String?) {
        let (d, made) = try applying(op, to: doc, now: now, newID: newID)
        // Anything JSON can't hold (a date from a page) is refused here, never stored as "{}".
        guard JSONSerialization.isValidJSONObject(d), let data = try? JSONSerialization.data(withJSONObject: d, options: [.sortedKeys, .fragmentsAllowed]) else {
            throw NotePage.OpError("Only JSON values (text, numbers, true and false, lists and objects) can be kept.")
        }
        if data.count > maxBytes {
            throw NotePage.OpError(String(format: "This app's data would be %.1f MB; the limit is 4 MB. Keep photos and recordings as files.", Double(data.count) / 1_048_576))
        }
        return (d, data, made)
    }

    private static func applying(_ op: Op, to doc: Doc, now: Date, newID: () -> String) throws -> (Doc, String?) {
        // Value types all the way down (decoded JSON and the page's message): changed in place, no
        // copy through JSON first.
        var d = doc
        var values = d["values"] as? Doc ?? Doc()
        var collections = d["collections"] as? Doc ?? Doc()
        let stamp = ISO8601DateFormatter().string(from: now)
        var made: String?
        if case .batch(let ops) = op {
            var doc = d
            for o in ops { let r = try applying(o, to: doc, now: now, newID: newID); doc = r.0; made = r.1 ?? made }
            return (doc, made)
        }
        switch op {
        case .batch: break
        case .set(let key, let value):
            values[key] = value
        case .patch(let patch):
            let merged = mergePatch(["values": values, "collections": collections], patch)
            values = merged["values"] as? Doc ?? Doc()
            collections = merged["collections"] as? Doc ?? Doc()
        case .add(let name, var fields):
            var list = collections[name] as? [Doc] ?? []
            let id = (fields["id"] as? String).flatMap { id in list.contains { $0["id"] as? String == id } ? nil : id } ?? newID()
            fields["id"] = id
            fields["created"] = fields["created"] ?? stamp
            fields["updated"] = stamp
            list.append(fields)
            collections[name] = list
            made = id
        case .update(let name, let id, let patch):
            var list = collections[name] as? [Doc] ?? []
            guard let i = list.firstIndex(where: { $0["id"] as? String == id }) else { throw NotePage.OpError("No record \(id) in \(name).") }
            var r = mergePatch(list[i], patch)
            r["id"] = id
            r["updated"] = stamp
            list[i] = r
            collections[name] = list
        case .remove(let name, let id):
            var list = collections[name] as? [Doc] ?? []
            guard let i = list.firstIndex(where: { $0["id"] as? String == id }) else { throw NotePage.OpError("No record \(id) in \(name).") }
            list.remove(at: i)
            collections[name] = list
        }
        d = ["values": values, "collections": collections]
        return (d, made)
    }

    /// RFC 7386: objects merge, null removes a key, anything else replaces.
    static func mergePatch(_ target: Doc, _ patch: Doc) -> Doc {
        var out = target
        for (k, v) in patch {
            if v is NSNull { out[k] = nil }
            else if let p = v as? Doc { out[k] = mergePatch(out[k] as? Doc ?? Doc(), p) }
            else { out[k] = v }
        }
        return out
    }

    // MARK: Two devices at once

    /// Combines this device's changes since `base` with the server's. Values merge by key and
    /// records by id (then by field), so different keys, records or fields never overwrite each
    /// other. When both sides changed the same field, this device's write wins. A record removed on
    /// one side stays removed unless the other side changed it.
    static func merge(base: Doc, mine: Doc, theirs: Doc) -> Doc {
        func three(_ b: Doc, _ m: Doc, _ t: Doc, records: Bool = false) -> Doc {
            var out = Doc()
            for k in Set(b.keys).union(m.keys).union(t.keys) {
                let bv = b[k], mv = m[k], tv = t[k]
                if same(mv, bv) { if let tv { out[k] = tv } }
                else if same(tv, bv) { if let mv { out[k] = mv } }
                else if records, let bd = bv as? Doc, let md = mv as? Doc, let td = tv as? Doc { out[k] = three(bd, md, td) }
                else if mv == nil, tv != nil, records { out[k] = tv }   // removed here, changed there: kept
                else if let mv { out[k] = mv }
            }
            return out
        }
        let b = decode(encode(base)), m = decode(encode(mine)), t = decode(encode(theirs))
        var values = three(b["values"] as! Doc, m["values"] as! Doc, t["values"] as! Doc)
        // A canvas's drawing changed on both: merged by element, not one side's whole drawing.
        let (bs, ms, ts) = ((b["values"] as! Doc)["scene"], (m["values"] as! Doc)["scene"], (t["values"] as! Doc)["scene"])
        if !same(ms, bs), !same(ts, bs), let scene = CanvasNote.merge(base: bs, mine: ms, theirs: ts) { values["scene"] = scene }
        var collections = Doc()
        let bc = b["collections"] as! Doc, mc = m["collections"] as! Doc, tc = t["collections"] as! Doc
        for name in Set(bc.keys).union(mc.keys).union(tc.keys) {
            func byID(_ x: Any?) -> Doc { Dictionary(((x as? [Doc]) ?? []).compactMap { r in (r["id"] as? String).map { ($0, r as Any) } }, uniquingKeysWith: { a, _ in a }) }
            let merged = three(byID(bc[name]), byID(mc[name]), byID(tc[name]), records: true)
            // In the order they were made.
            let list = merged.values.compactMap { $0 as? Doc }.sorted {
                (($0["created"] as? String) ?? "", ($0["id"] as? String) ?? "") < (($1["created"] as? String) ?? "", ($1["id"] as? String) ?? "")
            }
            if !list.isEmpty || mc[name] != nil || tc[name] != nil { collections[name] = list }
        }
        return ["values": values, "collections": collections]
    }
}

/// The page data this device has, per note: the current document, the one last synced (the base for
/// merging), and which have changes to push. Kept beside the library in its own file.
@MainActor
@Observable
final class NotePageDataStore {
    static let shared = NotePageDataStore(file: PaneApp.isUnitTestHost || ProcessInfo.processInfo.arguments.contains("-uitest") ? nil : defaultFile)

    private(set) var docs: [UUID: Data] = [:]
    private(set) var synced: [UUID: Data] = [:]
    private(set) var dirty: Set<UUID> = []
    /// The last change to an app's data that came from elsewhere (an AI through MCP, another
    /// device): who, and the data before it, for "Claude changed this · Undo" in an open app.
    struct Arrival: Equatable { var by: String; var at: Date; var before: Data? }
    private(set) var arrivals: [UUID: Arrival] = [:]
    /// A change another of your devices made ("iPhone"), as it came down: an open board outlines
    /// it with the device's name for a moment (round 14). No receipt, nothing to undo.
    struct DeviceArrival: Equatable { var device: String; var at: Date }
    private(set) var fromDevices: [UUID: DeviceArrival] = [:]
    @ObservationIgnored private let file: URL?
    /// The file is written here, in order, off the main thread: encoding every app's data to it took
    /// 26 ms a save on a canvas of 500 strokes, in the middle of drawing.
    @ObservationIgnored private let writer = DispatchQueue(label: "pinto.note-page-data.save", qos: .utility)

    private struct Saved: Codable { var docs: [UUID: Data]; var synced: [UUID: Data]; var dirty: Set<UUID> }

    init(file: URL?) {
        self.file = file
        if let file, let data = try? Data(contentsOf: file), let s = try? JSONDecoder().decode(Saved.self, from: data) {
            docs = s.docs; synced = s.synced; dirty = s.dirty
        }
    }

    static var defaultFile: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appending(path: "\(AppIdentity.dataFolder)/note-page-data.json")
    }

    /// The last document decoded, by note, with the bytes it came from: a canvas reads its whole
    /// drawing back before each save.
    @ObservationIgnored private var decoded: [UUID: (data: Data, doc: NotePageData.Doc)] = [:]

    /// Moves a moment after the data changes, once for a burst of changes: what the list's
    /// whiteboard rows watch, so their words and picture follow the board without the list being
    /// redrawn on every stroke.
    private(set) var listRevision = 0
    @ObservationIgnored private var listPending: Task<Void, Never>?
    /// The notes changed since the list was last told.
    @ObservationIgnored private var listChanged: Set<UUID> = []
    static var listDelay: Duration = .milliseconds(800)
    private func changedForList(_ id: UUID) {
        listChanged.insert(id)
        guard listPending == nil else { return }
        listPending = Task { @MainActor [weak self] in
            try? await Task.sleep(for: Self.listDelay)
            guard let self else { return }
            let ids = self.listChanged
            self.listChanged = []
            // The boards' sketches worked out off the main thread first: their rows then only read them.
            await CanvasSketch.prime(ids, in: self)
            self.listPending = nil
            self.listRevision += 1
            // Changed while those were worked out: told in a moment, too.
            if let next = self.listChanged.first { self.listChanged.remove(next); self.changedForList(next) }
        }
    }

    /// A note's bytes, read without being watched (the list's whiteboard rows: CanvasSketch).
    func peek(_ id: UUID) -> Data? { _docs[id] }
    /// The notes that have data, read without being watched.
    var ids: Dictionary<UUID, Data>.Keys { _docs.keys }

    func doc(_ id: UUID) -> NotePageData.Doc {
        guard let data = docs[id] else { return NotePageData.decode(nil) }
        if let c = decoded[id], c.data == data { return c.doc }
        let doc = NotePageData.decode(data)
        decoded[id] = (data, doc)
        return doc
    }

    /// A change from the page (or Undo): kept here and pushed with the next sync. `encoded` is
    /// `doc` as `NotePageData.encode` gives it, when the caller has it already.
    func set(_ id: UUID, _ doc: NotePageData.Doc?, encoded: Data? = nil) {
        let data = doc.map { encoded ?? NotePageData.encode($0) }
        docs[id] = data
        if let data, let doc { decoded[id] = (data, doc) } else { decoded[id] = nil }
        dirty.insert(id)
        save()
        changedForList(id)
        SyncSignal.changed()
    }

    /// The server's copy arrived. Changes made here since the last sync are merged in, not lost.
    func take(_ id: UUID, server: Data?, by: String? = nil, device: String? = nil) {
        let before = docs[id]
        defer {
            if let by, !NotePageData.same(NotePageData.decode(before), doc(id)) {
                arrivals[id] = Arrival(by: by, at: .now, before: before)
            } else if by == nil, let device, before != nil, !NotePageData.same(NotePageData.decode(before), doc(id)) {
                fromDevices[id] = DeviceArrival(device: device, at: .now)
            }
        }
        let theirs = NotePageData.decode(server)
        if dirty.contains(id) {
            let merged = NotePageData.merge(base: NotePageData.decode(synced[id]), mine: doc(id), theirs: theirs)
            docs[id] = NotePageData.encode(merged)
            if NotePageData.same(merged, theirs) { dirty.remove(id) }
        } else {
            docs[id] = server.map { NotePageData.encode(NotePageData.decode($0)) }
        }
        synced[id] = server
        save()
        changedForList(id)
    }

    /// Taking the server's copy (`take`), worked out off the main thread: the merge and the
    /// comparisons go over the whole drawing several times, 100 ms and more on the main thread for a
    /// board of 500 elements, after every push of it and every change that came down (16 November
    /// 2026). `prepareTake` works it out from the data as it is now; `take(_:)` keeps it.
    struct Taking: Sendable {
        let id: UUID, server: Data?
        /// What it was worked out from.
        let before: Data?, base: Data?, wasDirty: Bool
        /// What it leaves: the data, whether nothing of this device's is left to push, and whether
        /// the data changed (for the receipts).
        let after: Data?, clean: Bool, changed: Bool
    }

    func prepareTake(_ id: UUID, server: Data?) async -> Taking {
        let before = docs[id], base = synced[id], wasDirty = dirty.contains(id)
        return await Task.detached(priority: .utility) {
            Self.taking(id, server: server, before: before, base: base, dirty: wasDirty)
        }.value
    }

    /// `take`'s work, on its own: what the data becomes, from the bytes alone.
    nonisolated static func taking(_ id: UUID, server: Data?, before: Data?, base: Data?, dirty: Bool) -> Taking {
        let theirs = NotePageData.decode(server)
        var after: Data?, clean = false
        if dirty {
            let merged = NotePageData.merge(base: NotePageData.decode(base), mine: NotePageData.decode(before), theirs: theirs)
            after = NotePageData.encode(merged)
            clean = NotePageData.same(merged, theirs)
        } else {
            after = server.map { NotePageData.encode(NotePageData.decode($0)) }
        }
        let changed = !NotePageData.same(NotePageData.decode(before), NotePageData.decode(after))
        return Taking(id: id, server: server, before: before, base: base, wasDirty: dirty, after: after, clean: clean, changed: changed)
    }

    /// Keeps what `prepareTake` worked out. Changed here in the meantime (a stroke saved): the
    /// server's copy is taken again, on what's here now.
    func take(_ t: Taking, by: String? = nil, device: String? = nil) {
        let id = t.id
        guard docs[id] == t.before, synced[id] == t.base, dirty.contains(id) == t.wasDirty else {
            take(id, server: t.server, by: by, device: device)
            return
        }
        if let by, t.changed {
            arrivals[id] = Arrival(by: by, at: .now, before: t.before)
        } else if by == nil, let device, t.before != nil, t.changed {
            fromDevices[id] = DeviceArrival(device: device, at: .now)
        }
        docs[id] = t.after
        if t.wasDirty, t.clean { dirty.remove(id) }
        synced[id] = t.server
        save()
        changedForList(id)
    }

    /// A shared board's drawing from its shared document (CollabBoard), kept here for the list's
    /// picture, search and note cards. Not pushed: the document is how a shared board travels.
    /// `by`: an AI changed it ("Claude drew…" with Undo), and `before` is the drawing before.
    func takeShared(_ id: UUID, scene: [String: Any], by: String? = nil, before: [String: Any]? = nil) {
        let was = docs[id]
        let data = NotePageData.encode(Self.with(scene, in: doc(id)))
        if let by {
            arrivals[id] = Arrival(by: by, at: .now, before: before.map { NotePageData.encode(Self.with($0, in: doc(id))) } ?? was)
        }
        dirty.remove(id)
        guard data != was else { save(); return }
        docs[id] = data
        decoded[id] = nil
        save()
        changedForList(id)
    }

    /// A board's data with `scene` as its drawing.
    static func with(_ scene: [String: Any], in doc: NotePageData.Doc) -> NotePageData.Doc {
        var doc = doc
        var values = (doc["values"] as? NotePageData.Doc) ?? [:]
        values["scene"] = scene
        doc["values"] = values
        if doc["collections"] == nil { doc["collections"] = NotePageData.Doc() }
        return doc
    }

    /// Not pushed (a shared note's data travels in its shared document).
    func clean(_ id: UUID) {
        guard dirty.contains(id) else { return }
        dirty.remove(id)
        save()
    }

    /// Pushed: what the server now holds is the new base.
    func pushed(_ id: UUID, _ sent: Data) {
        synced[id] = sent
        if docs[id] == sent { dirty.remove(id) }
        save()
    }

    func forgetAll() {
        docs = [:]; synced = [:]; dirty = []; decoded = [:]
        // After any write still queued, so none brings the file back.
        if let file { writer.async { try? FileManager.default.removeItem(at: file) } }
    }

    private func save() {
        guard let file else { return }
        // Copies of three values (the bytes themselves are shared): safe to encode on the queue.
        let saved = Saved(docs: docs, synced: synced, dirty: dirty)
        writer.async {
            guard let data = try? JSONEncoder().encode(saved) else { return }
            try? FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
            try? data.write(to: file, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        }
    }

    /// Waits for the file to be written (tests; the app on quit).
    nonisolated func waitForSave() { writer.sync {} }
}

/// A page value set from its JSON text (a board's drawing, from canvas.jsx): the text read and the
/// note's data encoded again off the main thread, at utility priority, in the order they came. A
/// board of 2000 elements is 3 MB: as objects through the bridge, then checked and encoded on the
/// main thread, each save took the app 40 ms and more, and the page as long again for the whole
/// drawing coming back in the reply (16 November 2026). Quitting puts in any still on their way.
///
/// A save is made on the data the page had (`base`), and what reached the store since (another
/// device's change taken, an AI's edit) is merged in by key, record and element, as sync merges:
/// set on what was there, a change that came down while a save was on its way was lost, on the
/// board and then on the server.
@MainActor enum NotePageDataWrites {
    private struct Done: @unchecked Sendable { let seq: Int; let base: Data?; let doc: NotePageData.Doc; let data: Data }
    private struct Input: @unchecked Sendable { let base: Data?; let doc: NotePageData.Doc?; let json: String }
    nonisolated private static let queue = DispatchQueue(label: "pinto.note-page-data.encode", qos: .utility)
    nonisolated private static let lock = NSLock()
    nonisolated(unsafe) private static var done: [UUID: Done] = [:]
    private static var seq = 0
    private static var applied: [UUID: Int] = [:]
    /// A save being merged off the main thread, for `finish`.
    private static var merging: [UUID: Done] = [:]

    /// Sets `key` to what `json` holds, on `base`: the data the page had when it saved (the store's
    /// when not given). Returns the data before, for Undo, and the page's own: its data as the page
    /// has it after this save. When the store's is different (merged with a change from elsewhere),
    /// the page is told (NotePageView pushes what isn't its own).
    static func set(_ key: String, json: String, note id: UUID, base given: Data? = nil, store: NotePageDataStore = .shared) async throws -> (before: NotePageData.Doc, own: Data) {
        seq += 1
        let mine = seq, before = store.doc(id), base = given ?? store.docs[id]
        // On the store's document when the page had that one (decoded already); otherwise decoded there.
        let input = Input(base: base, doc: same(base, store.docs[id]) ? before : nil, json: json)
        let own: Data = try await withCheckedThrowingContinuation { k in
            queue.async {
                do {
                    guard let value = try? JSONSerialization.jsonObject(with: Data(input.json.utf8), options: [.fragmentsAllowed]) else {
                        throw NotePage.OpError("Only JSON values (text, numbers, true and false, lists and objects) can be kept.")
                    }
                    let onto = input.doc ?? NotePageData.decode(input.base)
                    let (doc, data, _) = try NotePageData.applyEncoded(.set(key: key, value: value is NSNull ? nil : value), to: onto)
                    lock.withLock { done[id] = Done(seq: mine, base: input.base, doc: doc, data: data) }
                    k.resume(returning: data)
                } catch { k.resume(throwing: error) }
            }
        }
        return (before, await put(id, store) ?? own)
    }

    /// The newest result for a note into the store, once; returns the page's own data it came from.
    /// The store changed since the page had its data: merged with that off the main thread (a few
    /// times at most while it keeps changing; then here).
    private static func put(_ id: UUID, _ store: NotePageDataStore) async -> Data? {
        guard var d = next(id) else { return nil }
        let own = d.data
        var tries = 0
        while !same(store.docs[id], d.base), tries < 3 {
            tries += 1
            let made = d, theirs = store.docs[id]
            merging[id] = made
            d = await withCheckedContinuation { k in queue.async { k.resume(returning: merged(made, theirs)) } }
            if merging[id]?.seq == made.seq { merging[id] = nil }
            // A newer save went in meanwhile: it's the page's newer drawing, and was merged itself.
            guard applied[id] == d.seq else { return nil }
        }
        keep(d, id, in: store)
        return own
    }

    private static func next(_ id: UUID) -> Done? {
        guard let d = lock.withLock({ done.removeValue(forKey: id) }), d.seq > applied[id, default: 0] else { return nil }
        applied[id] = d.seq
        return d
    }

    private static func keep(_ d: Done, _ id: UUID, in store: NotePageDataStore) {
        let d = same(store.docs[id], d.base) ? d : merged(d, store.docs[id])
        store.set(id, d.doc, encoded: d.data)
    }

    /// A save merged with what the store has now (`theirs`), which is then its base.
    nonisolated private static func merged(_ d: Done, _ theirs: Data?) -> Done {
        let doc = NotePageData.merge(base: NotePageData.decode(d.base), mine: d.doc, theirs: NotePageData.decode(theirs))
        return Done(seq: d.seq, base: theirs, doc: doc, data: NotePageData.encode(doc))
    }

    /// The same data; none is the empty document (what a page is given for a note without any).
    nonisolated private static func same(_ a: Data?, _ b: Data?) -> Bool { (a ?? NotePageData.emptyData) == (b ?? NotePageData.emptyData) }

    /// Waits for the saves on their way and puts them in (on quit).
    static func finish(_ store: NotePageDataStore = .shared) {
        queue.sync {}
        for (id, d) in merging where applied[id] == d.seq { keep(d, id, in: store) }
        merging = [:]
        for id in lock.withLock({ Array(done.keys) }) { if let d = next(id) { keep(d, id, in: store) } }
    }
}
