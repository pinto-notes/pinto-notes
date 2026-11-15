import Automerge
import Foundation

/// Comments on a whiteboard (15 November 2026): FigJam's, made calm. A comment sits on a shape (and
/// moves with it) or on a spot of the board, marked by a small pin in its writer's colour; a click
/// on the pin opens its thread. Comments are not part of the drawing: pictures, the share page and
/// the .excalidraw file leave them out.
///
/// Each comment, the first of a thread or a reply, is one record:
///
///     { "id": "c-…", "thread": "c-…" (a reply), "on": "<element id>" (a thread on a shape),
///       "x": 1, "y": 0, "by": "<account id>", "name": "Sara", "ai": "Claude" (an AI wrote it),
///       "text": "…", "created": "2026-11-15T09:12:00Z", "resolved": true (a thread), "version": 1 }
///
/// `x`, `y`: on a shape, where on its box as a fraction of its width and height (0 to 1 from its top
/// left), so the pin stays on it when it moves or grows; on a spot, the board's own coordinates.
///
/// Where they're kept:
/// - A board of your own: its page data, `collections.comments` (NotePageData), synced and sealed
///   like the drawing. Records merge by id, so a reply on each of two devices both land.
/// - A shared board: its Automerge document, root map `comments`, each comment's JSON under its id
///   as a scalar string, as `board` keeps elements. Sealed with the note key like every change.
///   Two people commenting at once write different keys and both land; two changes of one
///   comment (resolved on one device, opened again on another) leave both values, and every
///   device keeps the same one: the higher `version`, then the lower JSON.
///
/// A viewer reads comments but doesn't write them: the server can't see inside a sealed change, so
/// a viewer allowed to send comments could send drawing too. Keeping the rule "a viewer sends
/// nothing" is what keeps Can view honest (FigJam lets viewers comment; parked until comments can
/// travel apart from the drawing).
struct BoardComment: Equatable, Identifiable, Sendable {
    var id: String
    /// The thread this replies to; nil for a thread's first comment.
    var thread: String?
    /// The shape it's on (a thread's first comment).
    var on: String?
    var x: Double = 1
    var y: Double = 0
    /// Who wrote it: their account id ("me" on a board of your own while signed out).
    var by: String
    /// Their first name when they wrote it, so it reads the same after they leave the board.
    var name: String
    /// The AI that wrote it as them ("Claude"), through the file tools.
    var ai: String?
    var text: String
    /// When it was written (ISO 8601): the same on every device, so threads sort the same.
    var created: String
    var resolved = false
    var version = 1

    var isReply: Bool { thread != nil }
    var date: Date? { BoardComments.date(created) }

    /// The record as it's kept.
    var record: [String: Any] {
        var r: [String: Any] = ["id": id, "by": by, "name": name, "text": text, "created": created, "version": version]
        if let thread { r["thread"] = thread } else { r["x"] = x; r["y"] = y }
        if let on { r["on"] = on }
        if let ai { r["ai"] = ai }
        if resolved { r["resolved"] = true }
        return r
    }

    /// The record as JSON with sorted keys: what the shared document keeps, and the tie-break.
    var json: String {
        let data = (try? JSONSerialization.data(withJSONObject: record, options: [.sortedKeys])) ?? Data("{}".utf8)
        return String(data: data, encoding: .utf8) ?? "{}"
    }

    init(id: String, thread: String? = nil, on: String? = nil, x: Double = 1, y: Double = 0, by: String, name: String, ai: String? = nil,
         text: String, created: String, resolved: Bool = false, version: Int = 1) {
        self.id = id; self.thread = thread; self.on = on; self.x = x; self.y = y; self.by = by; self.name = name; self.ai = ai
        self.text = text; self.created = created; self.resolved = resolved; self.version = version
    }

    /// A record as kept, checked: anything malformed is left out rather than shown half.
    init?(_ r: [String: Any]) {
        func string(_ k: String, max: Int) -> String? {
            guard let s = r[k] as? String, !s.isEmpty, s.count <= max else { return nil }
            return s
        }
        guard let id = string("id", max: 200), let by = string("by", max: 200), let text = r["text"] as? String,
              !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, text.count <= BoardComments.maxText,
              let created = string("created", max: 64) else { return nil }
        self.id = id
        self.by = by
        self.text = text
        self.created = created
        thread = string("thread", max: 200)
        on = thread == nil ? string("on", max: 200) : nil
        name = string("name", max: 200) ?? "Someone"
        ai = string("ai", max: 80)
        let n = { (k: String) in (r[k] as? NSNumber)?.doubleValue }
        x = n("x").flatMap { $0.isFinite ? $0 : nil } ?? 1
        y = n("y").flatMap { $0.isFinite ? $0 : nil } ?? 0
        resolved = thread == nil && (r["resolved"] as? Bool) == true
        version = (r["version"] as? NSNumber)?.intValue ?? 1
    }

    init?(json: String) {
        guard let r = (try? JSONSerialization.jsonObject(with: Data(json.utf8))) as? [String: Any] else { return nil }
        self.init(r)
    }
}

/// A thread: its first comment and the replies, oldest first.
struct BoardThread: Equatable, Identifiable, Sendable {
    var first: BoardComment
    var replies: [BoardComment]
    var id: String { first.id }
    var resolved: Bool { first.resolved }
    var all: [BoardComment] { [first] + replies }
    /// When the last word in it was written.
    var latest: String { replies.last?.created ?? first.created }
}

enum BoardComments {
    /// The root map of a shared board's document that holds its comments.
    static let key = "comments"
    /// The page data collection that holds a board of your own's comments.
    static let collection = "comments"
    /// The longest comment taken (characters).
    static let maxText = 5000
    /// An AI's pin and avatar: the accent deepened so a white letter reads on it (Palette.Accent.fill).
    static let aiColor = "#BB5B05"

    static func newID() -> String { "c-" + String(UUID().uuidString.lowercased().replacingOccurrences(of: "-", with: "").prefix(16)) }

    static func stamp(_ date: Date = .now) -> String { date.formatted(.iso8601) }

    static func date(_ s: String) -> Date? {
        (try? Date(s, strategy: .iso8601)) ?? (try? Date(s, strategy: Date.ISO8601FormatStyle(includingFractionalSeconds: true)))
    }

    /// Who's writing: an account's id and first name.
    struct Author: Equatable, Sendable {
        var id: String
        var name: String
    }

    /// Where a new comment goes: on a shape (`on`, a fraction of its box) or on a spot of the board.
    struct Place: Equatable, Sendable {
        var on: String?
        var x: Double
        var y: Double
    }

    // MARK: Threads

    /// The threads, oldest first, each with its replies oldest first. A reply whose thread isn't
    /// here (it arrived before it, or its thread was left out) waits, unshown.
    static func threads(_ comments: [BoardComment]) -> [BoardThread] {
        let order: (BoardComment, BoardComment) -> Bool = { ($0.created, $0.id) < ($1.created, $1.id) }
        var replies: [String: [BoardComment]] = [:]
        for c in comments { if let t = c.thread { replies[t, default: []].append(c) } }
        return comments.filter { !$0.isReply }.sorted(by: order).map { BoardThread(first: $0, replies: (replies[$0.id] ?? []).sorted(by: order)) }
    }

    /// The winner among values written for one comment at once: the higher version, then the lower
    /// JSON (the same on every device).
    static func resolve(_ raw: [String]) -> BoardComment? {
        var best: (raw: String, c: BoardComment)?
        for s in raw {
            guard let c = BoardComment(json: s) else { continue }
            if let b = best, !(c.version > b.c.version || (c.version == b.c.version && s < b.raw)) { continue }
            best = (s, c)
        }
        return best?.c
    }

    /// What's shown for who wrote it: "Sara", "Claude" (your own AI), "Sara's Claude".
    static func byline(_ c: BoardComment, me: String) -> String {
        guard let ai = c.ai else { return c.name }
        return AIEdit.whose(ai, person: c.by == me ? nil : c.name)
    }

    /// The first word of a name ("Emil Wagman" is Emil), or "You" with none.
    static func firstName(_ full: String) -> String {
        let first = full.split(whereSeparator: \.isWhitespace).first.map(String.init) ?? ""
        return first.isEmpty || first == "Someone" ? "You" : first
    }

    /// You, on a board of your own: your account, or "me" signed out (made your account's id when
    /// the board is shared).
    @MainActor static func me(store: CollabStore? = CollabStore.shared, profile: String? = ProfileStore.shared.name) -> Author {
        Author(id: store?.me?.uuidString ?? "me", name: firstName(store?.name ?? profile ?? ""))
    }

    /// The letter on a pin and an avatar.
    static func initial(_ c: BoardComment) -> String {
        String((c.ai ?? c.name).trimmingCharacters(in: .whitespaces).first.map { String($0).uppercased() } ?? "?")
    }

    /// The colour an account id takes when no board says otherwise (CollabSession.color(for:)).
    static func color(for id: String) -> String {
        let rgb = CollabSession.palette[Int(CollabSession.paletteIndex(for: UUID(uuidString: id) ?? UUID(uuid: (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))))]
        return String(format: "#%06X", rgb)
    }

    /// When it was written, as Notes and Messages say it: "Now", "12 min ago", "09:14",
    /// "Yesterday", "12 Nov".
    static func when(_ c: BoardComment, now: Date = .now, calendar: Calendar = .current) -> String {
        guard let d = c.date else { return "" }
        let secs = now.timeIntervalSince(d)
        if secs < 60 { return "Now" }
        if secs < 3600 { return "\(Int(secs / 60)) min ago" }
        if calendar.isDate(d, inSameDayAs: now) { return d.formatted(date: .omitted, time: .shortened) }
        if let y = calendar.date(byAdding: .day, value: -1, to: now), calendar.isDate(d, inSameDayAs: y) { return "Yesterday" }
        return d.formatted(.dateTime.day().month(.abbreviated))
    }

    // MARK: A shared board's document

    /// Every `comments` map in the document. Two devices that made the map at once (each with its
    /// first comment) leave two: both are read, so neither one's comments go missing.
    static func maps(in doc: CollabText.Document) -> [CollabText.ObjId] {
        ((try? doc.getAll(obj: .ROOT, key: key)) ?? []).compactMap { if case .Object(let id, .Map) = $0 { id } else { nil } }
    }

    /// Each comment's values in the document, by id, across every comments map.
    static func raw(in doc: CollabText.Document) -> [String: [String]] {
        var out: [String: [String]] = [:]
        for map in maps(in: doc) {
            for k in doc.keys(obj: map) {
                for v in (try? doc.getAll(obj: map, key: k)) ?? [] {
                    if case .Scalar(.String(let s)) = v { out[k, default: []].append(s) }
                }
            }
        }
        return out.mapValues { Array(Set($0)).sorted() }
    }

    /// The document's comments, each conflict resolved.
    static func read(_ doc: CollabText.Document) -> [BoardComment] {
        raw(in: doc).compactMap { id, raws in resolve(raws).flatMap { $0.id == id ? $0 : nil } }
            .sorted { ($0.created, $0.id) < ($1.created, $1.id) }
    }

    /// Writes comments into the document (in the map every device reads first, made when there's none).
    static func put(_ comments: [BoardComment], in doc: CollabText.Document) throws {
        guard !comments.isEmpty else { return }
        let map: CollabText.ObjId
        if case .Object(let id, .Map)? = try doc.get(obj: .ROOT, key: key) { map = id } else { map = try doc.putObject(obj: .ROOT, key: key, ty: .Map) }
        for c in comments { try doc.put(obj: map, key: c.id, value: .String(c.json)) }
    }

    // MARK: A board of your own's page data

    /// The comments in a board's page data (`collections.comments`).
    static func stored(in doc: NotePageData.Doc) -> [BoardComment] {
        let list = ((doc["collections"] as? NotePageData.Doc)?[collection] as? [NotePageData.Doc]) ?? []
        return list.compactMap(BoardComment.init).sorted { ($0.created, $0.id) < ($1.created, $1.id) }
    }

    /// The page data with `comments` written in: each replaces the record with its id, or is added.
    static func keeping(_ comments: [BoardComment], in doc: NotePageData.Doc) -> NotePageData.Doc {
        guard !comments.isEmpty else { return doc }
        var doc = doc
        var collections = (doc["collections"] as? NotePageData.Doc) ?? [:]
        var list = (collections[collection] as? [NotePageData.Doc]) ?? []
        for c in comments {
            if let i = list.firstIndex(where: { $0["id"] as? String == c.id }) { list[i] = c.record } else { list.append(c.record) }
        }
        collections[collection] = list
        doc["collections"] = collections
        if doc["values"] == nil { doc["values"] = NotePageData.Doc() }
        return doc
    }

    /// Writes comments into a board of your own (synced with its data).
    @MainActor static func keep(_ comments: [BoardComment], for note: UUID, in store: NotePageDataStore = .shared) {
        guard !comments.isEmpty else { return }
        store.set(note, keeping(comments, in: store.doc(note)))
    }

    // MARK: What you've seen

    /// The comments you've seen on each board, by id, kept on this device: a comment from someone
    /// else that isn't among them shows the quiet dot on the Comments button.
    struct Seen {
        let defaults: UserDefaults
        static let most = 500

        /// The app's settings; in the test host, memory (tests never write the app's own).
        nonisolated(unsafe) static let store: UserDefaults = ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil
            || ProcessInfo.processInfo.arguments.contains("-uitest") ? MemoryDefaults() : .standard

        init(defaults: UserDefaults = Seen.store) { self.defaults = defaults }

        private func key(_ board: UUID) -> String { "boardCommentsSeen.\(board.uuidString)" }

        /// Nil: this board was never looked at here.
        func ids(_ board: UUID) -> Set<String>? { (defaults.array(forKey: key(board)) as? [String]).map(Set.init) }

        func set(_ ids: Set<String>, for board: UUID) {
            defaults.set(Array(ids.sorted().suffix(Self.most)), forKey: key(board))
        }
    }

    // MARK: The pins

    /// What the page draws for each thread: its pin, in its writer's colour, with their initial.
    struct Pin: Equatable, Sendable {
        var id: String
        var on: String?
        var x: Double
        var y: Double
        var color: String
        var letter: String
        var open = false

        var payload: [String: Any] {
            var p: [String: Any] = ["id": id, "x": x, "y": y, "color": color, "letter": letter, "open": open]
            if let on { p["on"] = on }
            return p
        }
    }
}
