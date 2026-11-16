import Automerge
import Foundation
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// Comments on a whiteboard (15 November 2026): FigJam's, made calm. A comment sits on a shape (and
/// moves with it) or on a spot of the board, marked by a small pin in its writer's colour; a click
/// on the pin opens its thread. Comments are not part of the drawing: pictures, the share page and
/// the .excalidraw file leave them out.
///
/// Each comment, the first of a thread or a reply, is one record:
///
///     { "id": "c-…", "thread": "c-…" (a reply), "on": "<element id>" (a thread on a shape),
///       "x": 1, "y": 0, "by": "<account id>", "name": "Sara", "ai": "Claude" (an AI wrote it),
///       "text": "…", "created": "2026-11-15T09:12:00Z", "resolved": true (a thread), "version": 1,
///       "edited": "2026-11-15T09:20:00Z" (its writer changed it), "mentions": ["<account id>"],
///       "deleted": true (its writer deleted it: no text),
///       "changes": ["<element id>"] (an AI's comment: what the write that added it changed) }
///
/// Its writer can change or delete it (round 12): a change keeps its id with the new text and a
/// higher version; a deletion keeps only who and when, with no text. A deleted thread start that
/// has replies stays, as "Comment deleted", so the replies still read in place; one without
/// replies, and a deleted reply, go.
///
/// `x`, `y`: on a shape, where on its box as a fraction of its width and height (0 to 1 from its top
/// left), so the pin stays on it when it moves or grows; on a spot, the board's own coordinates.
///
/// Where they're kept:
/// - A board of your own: its page data, `collections.comments` (NotePageData), synced and sealed
///   like the drawing. Records merge by id, so a reply on each of two devices both land.
/// - A shared board: its comment stream (Can comment, 18 November 2026; `note_comments`), apart
///   from the drawing so the server can let a commenter write comments and nothing else. Each write
///   is one sealed entry (`amb3c`) of the records it changes; every device folds the entries the
///   same way (`fold`). Before that, comments were in the board's Automerge document, root map
///   `comments`, each comment's JSON under its id as a scalar string: that map is still read, as
///   the fold's first layer, and an owner's or editor's device moves it into the stream (`toRestate`).
///
/// A viewer reads comments but doesn't write them; a commenter writes comments and not the drawing.
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
    /// When its writer last changed it (ISO 8601); nil when never.
    var edited: String?
    /// Deleted by its writer: no text kept.
    var deleted = false
    /// The people it mentions (@Sara), by account id: each gets the dot until they open it.
    var mentions: [String] = []
    /// An AI's comment: the elements the write that added it changed (Show change, after reopening too).
    var changes: [String] = []

    var isReply: Bool { thread != nil }
    var date: Date? { BoardComments.date(created) }

    /// The record as it's kept.
    var record: [String: Any] {
        var r: [String: Any] = ["id": id, "by": by, "name": name, "created": created, "version": version]
        if deleted { r["deleted"] = true } else { r["text"] = text }
        if let thread { r["thread"] = thread } else { r["x"] = x; r["y"] = y }
        if let on { r["on"] = on }
        if let ai { r["ai"] = ai }
        if resolved { r["resolved"] = true }
        if let edited, !deleted { r["edited"] = edited }
        if !mentions.isEmpty, !deleted { r["mentions"] = mentions }
        if !changes.isEmpty, !deleted { r["changes"] = changes }
        return r
    }

    /// The record as JSON with sorted keys: what the shared document keeps, and the tie-break.
    var json: String {
        let data = (try? JSONSerialization.data(withJSONObject: record, options: [.sortedKeys])) ?? Data("{}".utf8)
        return String(data: data, encoding: .utf8) ?? "{}"
    }

    init(id: String, thread: String? = nil, on: String? = nil, x: Double = 1, y: Double = 0, by: String, name: String, ai: String? = nil,
         text: String, created: String, resolved: Bool = false, version: Int = 1, edited: String? = nil, deleted: Bool = false, mentions: [String] = [],
         changes: [String] = []) {
        self.id = id; self.thread = thread; self.on = on; self.x = x; self.y = y; self.by = by; self.name = name; self.ai = ai
        self.text = text; self.created = created; self.resolved = resolved; self.version = version
        self.edited = edited; self.deleted = deleted; self.mentions = mentions; self.changes = changes
    }

    /// A record as kept, checked: anything malformed is left out rather than shown half.
    init?(_ r: [String: Any]) {
        func string(_ k: String, max: Int) -> String? {
            guard let s = r[k] as? String, !s.isEmpty, s.count <= max else { return nil }
            return s
        }
        let deleted = (r["deleted"] as? Bool) == true
        guard let id = string("id", max: 200), let by = string("by", max: 200), let created = string("created", max: 64) else { return nil }
        if deleted {
            text = ""
        } else {
            guard let t = r["text"] as? String, !t.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, t.count <= BoardComments.maxText else { return nil }
            text = t
        }
        self.deleted = deleted
        self.id = id
        self.by = by
        self.created = created
        edited = deleted ? nil : string("edited", max: 64)
        mentions = deleted ? [] : Array(((r["mentions"] as? [Any]) ?? []).compactMap { ($0 as? String).flatMap { $0.isEmpty || $0.count > 200 ? nil : $0 } }.prefix(50))
        changes = deleted ? [] : Array(((r["changes"] as? [Any]) ?? []).compactMap { ($0 as? String).flatMap { $0.isEmpty || $0.count > 200 ? nil : $0 } }.prefix(BoardComments.maxChanges))
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
    /// When its last word was written, as a date (for the list's order).
    var latestDate: Date? { BoardComments.date(latest) }
}

enum BoardComments {
    /// The root map of a shared board's document that holds its comments.
    static let key = "comments"
    /// The page data collection that holds a board of your own's comments.
    static let collection = "comments"
    /// The longest comment taken (characters).
    static let maxText = 5000
    /// The highest version a record may have; one above is ignored, and a write never goes past it
    /// (`next`), so nobody can put a comment out of its writer's reach.
    static let maxVersion = 1_000_000_000
    /// The most elements an AI's comment names (`changes`).
    static let maxChanges = 200

    /// The version a change of `c` takes: past everyone's, never past `maxVersion` (a tie goes to the later write).
    static func next(_ c: BoardComment) -> Int { min(c.version + 1, maxVersion) }
    /// An AI's pin and avatar: neutral graphite, never the accent (round 12: Claude's orange read
    /// as the app's own colour, and as a person called C). Its mark on it in white; on a dark board
    /// the pin is a light grey (`aiDark`) with the mark in black.
    static let aiColor = "#48484A"
    static let aiDark = "#D1D1D6"

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
    /// here (it arrived before it, or its thread was left out) waits, unshown. A deleted reply
    /// goes; a deleted thread start stays (as "Comment deleted") only while it has replies.
    static func threads(_ comments: [BoardComment]) -> [BoardThread] {
        let order: (BoardComment, BoardComment) -> Bool = { ($0.created, $0.id) < ($1.created, $1.id) }
        var replies: [String: [BoardComment]] = [:]
        for c in comments where !c.deleted { if let t = c.thread { replies[t, default: []].append(c) } }
        return comments.filter { !$0.isReply }.sorted(by: order).compactMap { first in
            let r = (replies[first.id] ?? []).sorted(by: order)
            return first.deleted && r.isEmpty ? nil : BoardThread(first: first, replies: r)
        }
    }

    /// What's shown for a deleted comment.
    static let deletedText = "Comment deleted"

    // MARK: Mentions

    /// Someone who can be mentioned: their account id and first name.
    struct Person: Equatable, Hashable, Sendable, Identifiable {
        var id: String
        var name: String
    }

    /// The word being typed when it's a mention: "@Sa" at the end of the text, after a space or
    /// at the start. Its range in the text and what's typed after the @.
    static func mentionQuery(in text: String) -> (range: Range<String.Index>, query: String)? {
        guard let at = text.lastIndex(of: "@") else { return nil }
        if at > text.startIndex, !text[text.index(before: at)].isWhitespace { return nil }
        let query = String(text[text.index(after: at)...])
        guard query.count <= 30, !query.contains(where: \.isWhitespace) else { return nil }
        return (at..<text.endIndex, query)
    }

    /// The people whose name starts with what's typed after the @ (case and accents ignored), in
    /// the board's order.
    static func suggestions(_ query: String, from people: [Person]) -> [Person] {
        let q = query.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: nil)
        return people.filter { q.isEmpty || $0.name.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: nil).hasPrefix(q) }
    }

    /// The text with the mention being typed made whole: "@Sara " in place of "@Sa".
    static func complete(_ text: String, with person: Person) -> String {
        guard let m = mentionQuery(in: text) else { return text }
        var t = text
        t.replaceSubrange(m.range, with: "@\(person.name) ")
        return t
    }

    /// The people a comment mentions: each whose "@Name" stands in it as a word.
    static func mentioned(in text: String, people: [Person]) -> [String] {
        var out: [String] = []
        for p in people where !out.contains(p.id) && mentionRanges(of: p.name, in: text).first != nil { out.append(p.id) }
        return out
    }

    /// Where "@Name" stands in the text as a word (not inside "@Name2" or an email address).
    static func mentionRanges(of name: String, in text: String) -> [Range<String.Index>] {
        guard !name.isEmpty else { return [] }
        var out: [Range<String.Index>] = [], from = text.startIndex
        while let r = text.range(of: "@" + name, options: [.caseInsensitive], range: from..<text.endIndex) {
            let before = r.lowerBound == text.startIndex || !(text[text.index(before: r.lowerBound)].isLetter || text[text.index(before: r.lowerBound)].isNumber)
            let after = r.upperBound == text.endIndex || !(text[r.upperBound].isLetter || text[r.upperBound].isNumber)
            if before && after { out.append(r) }
            from = r.upperBound
        }
        return out
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
        return String(format: "#%06X", rgb.light)
    }

    /// A colour's dark-mode shade ("#RRGGBB"), as the presence palette pairs them: the same hue,
    /// lighter, for a pin on a dark board. A colour not in the palette (an AI's) has none.
    static func dark(of color: String) -> String? {
        let hex = color.uppercased()
        if hex == aiColor { return aiDark }
        return CollabSession.palette.first { String(format: "#%06X", $0.light) == hex }.map { String(format: "#%06X", $0.dark) }
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

    // MARK: A shared board's comment stream

    /// One entry of the stream, opened: who wrote it (the server's stamp, also in the seal's AAD),
    /// their role then, and the records it holds. `moved`: the comments that were in the document,
    /// or under an older key, restated as they were by an owner's or editor's device.
    struct Entry {
        var author: String
        var role: String
        var moved = false
        var comments: [Any]
    }

    /// An entry's JSON, opened: anything malformed holds nothing.
    static func entry(_ plain: Data, author: String, role: String) -> Entry {
        guard let o = (try? JSONSerialization.jsonObject(with: plain)) as? [String: Any] else { return Entry(author: author, role: role, comments: []) }
        return Entry(author: author, role: role, moved: (o["moved"] as? Bool) == true, comments: Array(((o["comments"] as? [Any]) ?? []).prefix(500)))
    }

    /// An entry as it's sealed: `{"comments": [record, …]}`, `"moved": true` for a restatement.
    static func entryJSON(_ comments: [BoardComment], moved: Bool = false) -> Data {
        var o: [String: Any] = ["comments": comments.map(\.record)]
        if moved { o["moved"] = true }
        return (try? JSONSerialization.data(withJSONObject: o, options: [.sortedKeys])) ?? Data()
    }

    /// Entries holding `comments`, each small enough to go up sealed (CollabSession.maxComment).
    static func chunks(_ comments: [BoardComment], moved: Bool = false) -> [Data] {
        var out: [Data] = [], part: [BoardComment] = [], size = 0
        for c in comments {
            let n = c.json.utf8.count + 1
            if !part.isEmpty, size + n > chunkBytes || part.count >= 400 {
                out.append(entryJSON(part, moved: moved))
                part = []
                size = 0
            }
            part.append(c)
            size += n
        }
        if !part.isEmpty { out.append(entryJSON(part, moved: moved)) }
        return out
    }

    /// An entry's JSON at most this big: sealed (base64, nonce and tag), it stays under 64 KB.
    static let chunkBytes = 45_000

    private struct Candidate {
        var c: BoardComment
        var trusted: Bool
        var own: Bool
        var order: Int
        /// The higher version, then the later entry, then the later place in it.
        func beats(_ b: Candidate) -> Bool { c.version != b.c.version ? c.version > b.c.version : order > b.order }
    }

    /// A record's version as written, when it's one a fold takes: a whole number from 1 to `maxVersion`.
    private static func version(of raw: Any) -> Int? {
        guard let r = raw as? [String: Any] else { return nil }
        guard let v = r["version"] else { return 1 }
        guard let n = v as? NSNumber else { return 1 }
        let d = n.doubleValue
        guard d.isFinite, d == d.rounded(), d >= 1, d <= Double(maxVersion) else { return nil }
        return Int(d)
    }

    /// A shared board's comments, as every device reads them: `legacy`, the comments in the
    /// document's old `comments` map (each id's values resolved), then the stream's entries in the
    /// server's order. Per comment id:
    ///
    /// - Its owner is the writer the first trusted record names (the old map, or a moved entry from
    ///   an owner or editor), else the writer of the first entry that wrote it in their own name.
    /// - Its words are the owner's record with the highest version (then the later one): a record
    ///   counts as words only from an entry its `by` wrote, so nobody else's can change them.
    /// - Whether a thread is resolved comes from everyone's records for it, the highest version
    ///   (then the later one): anyone who may comment resolves and reopens any thread.
    /// - Its version is the highest anyone wrote, so the next write beats them all.
    ///
    /// The same rules as web/lib/board-doc.ts (`foldComments`) and the MCP server's
    /// board_comments.ts (`fold`), pinned by supabase/functions/_shared/comment-vectors.json.
    static func fold(legacy: [BoardComment], entries: [Entry]) -> [BoardComment] {
        var all: [String: [Candidate]] = [:]
        var ids: [String] = []
        var order = 0
        func add(_ x: Candidate) {
            if all[x.c.id] == nil { ids.append(x.c.id) }
            all[x.c.id, default: []].append(x)
        }
        for c in legacy { add(Candidate(c: c, trusted: true, own: true, order: order)); order += 1 }
        for e in entries {
            let author = e.author.lowercased()
            let trusts = e.moved && (e.role == "owner" || e.role == "editor")
            for raw in e.comments {
                defer { order += 1 }
                guard let v = version(of: raw), var c = (raw as? [String: Any]).flatMap(BoardComment.init) else { continue }
                c.version = v
                let own = trusts || c.by.lowercased() == author
                // Someone else's reply says nothing anyone takes.
                if own || !c.isReply { add(Candidate(c: c, trusted: trusts, own: own, order: order)) }
            }
        }
        var out: [BoardComment] = []
        for id in ids {
            let list = all[id] ?? []
            guard let first = list.first(where: \.trusted) ?? list.first(where: \.own) else { continue }
            let owner = first.c.by.lowercased()
            var words: Candidate?
            for x in list where x.own && x.c.by.lowercased() == owner { if words.map({ x.beats($0) }) ?? true { words = x } }
            guard let words else { continue }
            var c = words.c
            c.version = list.map(\.c.version).max() ?? c.version
            if !c.isReply {
                var r: Candidate?
                for x in list where !x.c.isReply { if r.map({ x.beats($0) }) ?? true { r = x } }
                c.resolved = r?.c.resolved == true
            }
            out.append(c)
        }
        return out.sorted { ($0.created, $0.id) < ($1.created, $1.id) }
    }

    /// What an owner's or editor's device restates in a moved entry: every comment that someone
    /// holding only the note's current key, reading only the stream, wouldn't see as it is (`full`,
    /// everything this device opened, the old map included, against `bare`, the stream's entries
    /// under the current key alone). That moves the old map's comments into the stream, and carries
    /// comments over a new key.
    static func toRestate(full: [BoardComment], bare: [BoardComment]) -> [BoardComment] {
        let had = Dictionary(bare.map { ($0.id, $0.json) }, uniquingKeysWith: { a, _ in a })
        return full.filter { had[$0.id] != $0.json }
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

        /// The comments that mention you whose thread you opened, by id and version. A mention
        /// keeps the dot until then, even on a board first looked at here, and again when a
        /// change of the comment adds it.
        func mentions(_ board: UUID) -> Set<String> { Set((defaults.array(forKey: "boardMentionsSeen.\(board.uuidString)") as? [String]) ?? []) }

        func setMentions(_ keys: Set<String>, for board: UUID) {
            defaults.set(Array(keys.sorted().suffix(Self.most)), forKey: "boardMentionsSeen.\(board.uuidString)")
        }

        /// A mention as it's remembered: the comment and the version that mentions you.
        static func mentionKey(_ c: BoardComment) -> String { "\(c.id)#\(c.version)" }
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
        /// The mark of the AI that wrote it (markPicture): its pin shows it, not a letter.
        var mark: String? = nil

        var payload: [String: Any] {
            var p: [String: Any] = ["id": id, "x": x, "y": y, "color": color, "letter": letter, "open": open]
            if let on { p["on"] = on }
            if let dark = BoardComments.dark(of: color) { p["dark"] = dark }
            if let mark { p["mark"] = mark }
            return p
        }
    }

    /// An AI's mark as the page draws it on a pin: a data URL of its shape (only the shape counts,
    /// as a mask the page colours), 36 pixels square. Nil for an AI with no mark of its own, or in
    /// App Store captures (AIGlyph.storeSafe).
    @MainActor static func markPicture(_ ai: String) -> String? {
        if let kept = marks[ai] { return kept }
        guard !AIGlyph.storeSafe, let asset = AIGlyph.asset(ai) else { return nil }
        let side = 36
        #if os(macOS)
        guard let image = NSImage(named: asset),
              let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: side, pixelsHigh: side, bitsPerSample: 8, samplesPerPixel: 4,
                                         hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0) else { return nil }
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        image.draw(in: CGRect(x: 0, y: 0, width: side, height: side))
        NSGraphicsContext.restoreGraphicsState()
        guard let png = rep.representation(using: .png, properties: [:]) else { return nil }
        #else
        guard let image = UIImage(named: asset) else { return nil }
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let png = UIGraphicsImageRenderer(size: CGSize(width: side, height: side), format: format).pngData { _ in
            image.draw(in: CGRect(x: 0, y: 0, width: side, height: side))
        }
        #endif
        let url = "data:image/png;base64," + png.base64EncodedString()
        marks[ai] = url
        return url
    }

    @MainActor private static var marks: [String: String] = [:]
}
