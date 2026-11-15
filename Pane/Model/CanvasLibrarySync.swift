import Foundation

// MARK: The whiteboard library on every device

/// What a device's whiteboard library knows of the account's copy on the server, kept in its file
/// beside the items (CanvasLibrary). The server holds one row an item (`whiteboard_library`,
/// 20261117120000_whiteboard_library.sql), sealed with the account's key: a head (its name, the
/// library file it came from, where it sits, when its name last changed) and a body (its shapes and
/// the pictures they show, written once). LibrarySync makes the trips; the rules are here.
///
/// The rules, item by item:
/// - Added or imported on one device: it goes up, and the others take it on their next sync.
/// - Renamed on two devices before either heard: the later rename wins (`edited`), on both.
/// - Removed on one device and renamed on another: removed wins. The server keeps a removed item's
///   row, empty, so every device hears that it went and nothing brings it back.
/// - Order: each item has a place, higher first (when it was made, in milliseconds), the same on
///   every device, so groups and items come in the same order everywhere.
/// - The first sync after the update merges what each device had: this device's items go up, and
///   one that looks the same as an item already on the server (the same library imported on two
///   Macs) becomes that item, rather than a second copy.
struct CanvasLibraryLedger: Codable, Equatable, Sendable {
    struct Entry: Codable, Equatable, Sendable {
        /// Where it sits: higher first.
        var place: Double
        /// The server's version this device last had; 0 while the server doesn't have it.
        var version: Int64 = 0
        /// When its name last changed, here or on another device (milliseconds); 0 for never.
        var edited: Double = 0
        /// Its name changed here and the server doesn't have that yet.
        var renamed = false
        /// The server won't take it (too big, or the account's library is full): kept here only.
        var keptHere = false
    }

    /// The account this library belongs to (its id, lowercased); nil until its first sync.
    var owner: String?
    /// The server time of the newest row taken in: the next pull starts a little before it.
    var cursor: Date?
    /// A pull has finished for this account. Until then nothing made here goes up, so the first
    /// merge can find what the server has already.
    var pulled = false
    /// Each item's place and what the server has of it, by its id (lowercased).
    var entries: [String: Entry] = [:]
    /// Removed here; the server hasn't heard yet (ids, lowercased).
    var removed: Set<String> = []

    static func key(_ id: String) -> String { id.lowercased() }
}

/// An item's head as it's sealed (context `library-head:<id>`).
struct CanvasLibraryHead: Codable, Equatable, Sendable {
    var name: String?
    var source: String?
    var place: Double
    var edited: Double
}

/// The items and the ledger together, as sync changes them. Pure: every rule here has its test
/// (CanvasLibrarySyncTests).
struct CanvasLibraryContents: Equatable {
    typealias Entry = CanvasLibraryLedger.Entry

    var items: [CanvasLibraryItem]
    var ledger: CanvasLibraryLedger

    /// A row of the server's library as it came down, its head opened.
    struct Pulled: Equatable, Sendable {
        var id: String
        var version: Int64
        /// Nil when removed, or when it didn't open with this device's key.
        var head: CanvasLibraryHead?
        var removed: Bool
    }

    private static func key(_ id: String) -> String { CanvasLibraryLedger.key(id) }
    func entry(_ id: String) -> Entry? { ledger.entries[Self.key(id)] }
    private func index(_ id: String) -> Int? { let k = Self.key(id); return items.firstIndex { Self.key($0.id) == k } }
    private var top: Double? { items.compactMap { entry($0.id)?.place }.max() }

    /// Now, as places and edits count it.
    static var now: Double { Date.now.timeIntervalSince1970 * 1000 }

    // MARK: Order

    /// Every item has a place, keeping the order they're kept in: a library from before sync gets
    /// them now. Entries of items that aren't here go.
    mutating func placeAll(now: Double = Self.now) {
        var last: Double?
        for item in items {
            if let p = entry(item.id)?.place { last = p; continue }
            let p = last.map { $0 - 0.01 } ?? now
            ledger.entries[Self.key(item.id)] = Entry(place: p)
            last = p
        }
        let kept = Set(items.map { Self.key($0.id) })
        ledger.entries = ledger.entries.filter { kept.contains($0.key) }
        sort()
    }

    /// Higher places first; the same place (two devices at once) by id, so every device agrees.
    mutating func sort() {
        var places: [String: Double] = [:]
        for item in items { places[Self.key(item.id)] = entry(item.id)?.place ?? 0 }
        items.sort { (a: CanvasLibraryItem, b: CanvasLibraryItem) -> Bool in
            let pa = places[Self.key(a.id)] ?? 0, pb = places[Self.key(b.id)] ?? 0
            return pa != pb ? pa > pb : Self.key(a.id) < Self.key(b.id)
        }
    }

    // MARK: Changes made here

    /// New items (saved here, or a library file's), first, in the order given.
    mutating func made(_ new: [CanvasLibraryItem], now: Double = Self.now) {
        guard !new.isEmpty else { return }
        let base = max(now, (top ?? 0) + 1)
        for (i, item) in new.enumerated() {
            ledger.entries[Self.key(item.id)] = Entry(place: base + Double(new.count - 1 - i) * 0.01)
        }
        items.insert(contentsOf: new, at: 0)
        sort()
    }

    /// A new name for an item. Its edit counts as later than any it has seen.
    mutating func renamed(_ id: String, to name: String?, now: Double = Self.now) {
        guard let i = index(id) else { return }
        items[i].name = name
        var e = entry(id) ?? Entry(place: now)
        e.edited = max(now, e.edited + 1)
        e.renamed = true
        ledger.entries[Self.key(id)] = e
    }

    /// An item removed here: the server is told, whether or not it had it (an answer can be lost).
    mutating func removed(_ id: String) {
        let k = Self.key(id)
        items.removeAll { Self.key($0.id) == k }
        ledger.entries[k] = nil
        ledger.removed.insert(k)
    }

    // MARK: What goes up

    /// The head an item goes up with: its name and group as shown, its place, its last rename.
    func head(_ item: CanvasLibraryItem) -> CanvasLibraryHead {
        let e = entry(item.id)
        return CanvasLibraryHead(name: item.name, source: item.source, place: e?.place ?? 0, edited: e?.edited ?? 0)
    }

    /// Items the server doesn't have yet, in the order they show.
    var unsent: [CanvasLibraryItem] { items.filter { entry($0.id).map { $0.version == 0 && !$0.keptHere } ?? false } }

    /// Items the server has, renamed here since, with the version this device last had.
    var renames: [(item: CanvasLibraryItem, version: Int64)] {
        items.compactMap { item in entry(item.id).flatMap { $0.version > 0 && $0.renamed ? (item, $0.version) : nil } }
    }

    /// What hasn't reached the server: new items, renames and removals.
    var unsynced: Int { unsent.count + renames.count + ledger.removed.count }

    /// Items whose id the server can't hold (a library file someone edited by hand) get new ones.
    /// Returns the old and new ids, for their pictures.
    mutating func reidentify() -> [(from: String, to: String)] {
        var moved: [(from: String, to: String)] = []
        for i in items.indices where UUID(uuidString: items[i].id) == nil {
            let old = items[i].id, new = UUID().uuidString
            let e = entry(old)
            ledger.entries[Self.key(old)] = nil
            ledger.entries[Self.key(new)] = e.map { var e = $0; e.version = 0; return e } ?? Entry(place: Self.now)
            items[i].id = new
            moved.append((old, new))
        }
        ledger.removed = ledger.removed.filter { UUID(uuidString: $0) != nil }
        return moved
    }

    // MARK: Answers

    /// The server took removals.
    mutating func sentRemovals(_ ids: [String]) { ledger.removed.subtract(ids.map(Self.key)) }

    /// The server has the item, at `version`, with the head sent (its rename too, unless another
    /// rename came after it here).
    mutating func sent(_ id: String, version: Int64, edited: Double) {
        guard var e = entry(id) else { return }
        e.version = max(e.version, version)
        if e.edited == edited { e.renamed = false }
        ledger.entries[Self.key(id)] = e
    }

    /// The server says it was removed (on another device, before this one's change got there).
    mutating func goneOnServer(_ id: String) {
        let k = Self.key(id)
        items.removeAll { Self.key($0.id) == k }
        ledger.entries[k] = nil
        ledger.removed.remove(k)
    }

    /// The server doesn't have it at all: it goes up again, whole.
    mutating func missingOnServer(_ id: String) {
        ledger.entries[Self.key(id)]?.version = 0
        ledger.entries[Self.key(id)]?.renamed = false
    }

    /// The server won't take it: it stays on this device only.
    mutating func keptHere(_ id: String) { ledger.entries[Self.key(id)]?.keptHere = true }

    // MARK: What came down

    /// Which of these rows this device doesn't have: their shapes come down next.
    func wanted(_ rows: [Pulled]) -> [String] {
        rows.filter { !$0.removed && $0.head != nil && entry($0.id) == nil && !ledger.removed.contains(Self.key($0.id)) }.map { Self.key($0.id) }
    }

    /// Takes in what came down. `new`: the items this device didn't have, made from their shapes
    /// (by id). Returns the items made here that were the same as one on the server at the first
    /// merge, with the server's id each became (their pictures move to it).
    @discardableResult
    mutating func take(_ rows: [Pulled], new: [String: CanvasLibraryItem] = [:]) -> [(from: String, to: String)] {
        var merged: [(from: String, to: String)] = []
        for r in rows {
            let k = Self.key(r.id)
            if r.removed {
                goneOnServer(k)
                continue
            }
            guard let head = r.head else { continue }
            if var e = ledger.entries[k], let i = index(k) {
                guard r.version > e.version else { continue }
                if e.renamed, head.edited <= e.edited {
                    // This device's rename is the later one: it goes up over this version.
                    e.version = r.version
                } else {
                    items[i].name = head.name
                    items[i].source = head.source
                    e = Entry(place: head.place, version: r.version, edited: head.edited, renamed: false, keptHere: e.keptHere)
                }
                ledger.entries[k] = e
                continue
            }
            guard !ledger.removed.contains(k), var item = new[k] else { continue }
            item.id = k
            item.name = head.name
            item.source = head.source
            if !ledger.pulled, let twin = twin(of: item) {
                let old = items.remove(at: twin)
                ledger.entries[Self.key(old.id)] = nil
                merged.append((old.id, k))
            }
            items.append(item)
            ledger.entries[k] = Entry(place: head.place, version: r.version, edited: head.edited)
        }
        sort()
        return merged
    }

    /// An item made here and not sent yet that looks the same as `other`, in the same group.
    private func twin(of other: CanvasLibraryItem) -> Int? {
        let look = other.look
        return items.firstIndex { mine in
            guard let e = entry(mine.id), e.version == 0, !e.renamed else { return false }
            return mine.source == other.source && mine.look == look
        }
    }

    // MARK: Accounts and keys

    /// The library is `owner`'s from now on. Another account's library (synced with it before)
    /// goes; returns true then. One that never synced is kept, and merged into this account's.
    mutating func adopt(owner: String) -> Bool {
        let owner = Self.key(owner)
        if ledger.owner == owner { return false }
        defer { ledger.owner = owner }
        guard ledger.owner != nil else { return false }
        items = []
        ledger = CanvasLibraryLedger()
        return true
    }

    /// The account has a new key (Start fresh): the server's library went with the old one, and
    /// everything here goes up again, sealed anew.
    mutating func forgetServer() {
        for k in ledger.entries.keys {
            ledger.entries[k]?.version = 0
            ledger.entries[k]?.renamed = false
            ledger.entries[k]?.keptHere = false
        }
        ledger.cursor = nil
        ledger.pulled = false
        ledger.removed = []
    }
}

/// The library's rows on the wire: contexts and what's sealed in them.
enum CanvasLibraryWire {
    static let table = "whiteboard_library"
    /// What the server holds an item to (20261117120000_whiteboard_library.sql).
    static let headLimit = 4000
    static let bodyLimit = 7_000_000

    static func json(_ head: CanvasLibraryHead) -> String {
        let e = JSONEncoder()
        e.outputFormatting = .sortedKeys
        return (try? e.encode(head)).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
    }

    static func head(_ json: String) -> CanvasLibraryHead? { try? JSONDecoder().decode(CanvasLibraryHead.self, from: Data(json.utf8)) }

    /// Its shapes, the pictures they show and when it was made, as one JSON object.
    static func body(_ item: CanvasLibraryItem) -> String? {
        var o: [String: Any] = ["elements": item.elements, "created": item.created]
        if item.filesJSON != nil { o["files"] = item.files }
        guard JSONSerialization.isValidJSONObject(o), let d = try? JSONSerialization.data(withJSONObject: o, options: .sortedKeys) else { return nil }
        return String(data: d, encoding: .utf8)
    }

    /// An item from its head and body; nil when there's nothing to draw.
    static func item(id: String, head: CanvasLibraryHead, body: String) -> CanvasLibraryItem? {
        guard let o = (try? JSONSerialization.jsonObject(with: Data(body.utf8))) as? [String: Any],
              var item = CanvasLibraryItem(id: CanvasLibraryLedger.key(id), name: head.name, source: head.source,
                                           created: (o["created"] as? NSNumber)?.doubleValue ?? 0,
                                           elements: o["elements"] as? [[String: Any]] ?? [], files: o["files"] as? [String: Any] ?? [:]) else { return nil }
        // As the other device keeps it: an item named by nothing stays unnamed.
        item.name = head.name
        return item
    }
}
