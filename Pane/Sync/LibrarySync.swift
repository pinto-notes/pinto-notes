import Foundation
import Supabase
import os

private let log = Logger(subsystem: "dev.emilwagman.pane", category: "sync")

/// The whiteboard library's trips to the server, in every sync that pulls (SyncEngine). The rules
/// are CanvasLibraryContents'; this sends and fetches. Every box is sealed with the account's key:
/// a head an item (`library-head:<id>`) and its body (`library:<id>`), which goes up once.
@MainActor
enum LibrarySync {
    /// One request carries at most this much of sealed bodies (or one item that's bigger), and
    /// this many rows.
    static let batchBytes = 4_000_000
    static let batchRows = 50
    /// Bodies asked for at once on a pull.
    static let bodiesAtOnce = 10

    struct Row: PagedRow {
        var id: UUID
        var version: Int64
        var deleted_at: String?
        var head_ct: String?
        var server_updated_at: Date?
        /// `server_updated_at` as the server wrote it, to the microsecond: where the next page starts.
        var server_stamp: String?

        enum CodingKeys: String, CodingKey { case id, version, deleted_at, head_ct, server_updated_at }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            id = try c.decode(UUID.self, forKey: .id)
            version = try c.decode(Int64.self, forKey: .version)
            deleted_at = try c.decodeIfPresent(String.self, forKey: .deleted_at)
            head_ct = try c.decodeIfPresent(String.self, forKey: .head_ct)
            server_updated_at = try c.decodeIfPresent(Date.self, forKey: .server_updated_at)
            server_stamp = try? c.decodeIfPresent(String.self, forKey: .server_updated_at)
        }
    }

    struct Body: Decodable { var id: UUID; var body_ct: String? }
    struct Answer: Decodable { var id: UUID; var version: Int64; var deleted_at: String? }
    struct New: Encodable { var id: String; var head_ct: String; var body_ct: String }
    struct Gone: Encodable { var id: String; var deleted_at: String }

    private static let rowColumns = "id,version,deleted_at,head_ct,server_updated_at"
    private static let answerColumns = "id,version,deleted_at"

    /// What changed on the account's other devices comes down, then what changed here goes up.
    /// `check` stops it once the run has outlived its key or its engine.
    static func sync(_ client: SupabaseClient, sealer: Sealer, library: CanvasLibrary, owner: UUID, check: () throws -> Void) async throws {
        if library.update(local: false, { $0.adopt(owner: owner.uuidString) }) {
            log.notice("another account's whiteboard library was on this device; it went")
        }
        try await pull(client, sealer: sealer, library: library, check: check)
        try check()
        try await push(client, sealer: sealer, library: library, check: check)
    }

    static func open(_ r: Row, sealer: Sealer) -> CanvasLibraryContents.Pulled {
        let head = r.deleted_at == nil ? r.head_ct.flatMap { sealer.open($0, context: E2EE.libraryHead(r.id)) }.flatMap(CanvasLibraryWire.head) : nil
        return .init(id: r.id.uuidString.lowercased(), version: r.version, head: head, removed: r.deleted_at != nil)
    }

    // MARK: Down

    static func pull(_ client: SupabaseClient, sealer: Sealer, library: CanvasLibrary, check: () throws -> Void) async throws {
        // A little before the cursor, as notes pull: rows can commit slightly out of order.
        let since = library.ledger.cursor.map { $0.addingTimeInterval(-5) } ?? .distantPast
        let stamp = since.formatted(Date.ISO8601FormatStyle(includingFractionalSeconds: true))
        var rows: [Row] = []
        try await SyncEngine.changedRows(client, CanvasLibraryWire.table, since: stamp, size: 500, columns: rowColumns) { (page: [Row]) in rows += page }
        try check()
        let pulled = rows.map { open($0, sealer: sealer) }
        let heads = Dictionary(pulled.compactMap { p in p.head.map { (p.id, $0) } }, uniquingKeysWith: { a, _ in a })
        let wanted = library.contents.wanted(pulled)
        var new: [String: CanvasLibraryItem] = [:]
        for i in stride(from: 0, to: wanted.count, by: bodiesAtOnce) {
            let ids = Array(wanted[i ..< min(i + bodiesAtOnce, wanted.count)])
            let bodies: [Body] = try await client.from(CanvasLibraryWire.table).select("id,body_ct").in("id", values: ids).execute().value
            try check()
            for b in bodies {
                let k = b.id.uuidString.lowercased()
                guard let box = b.body_ct, let head = heads[k], let json = sealer.open(box, context: E2EE.libraryItem(b.id)),
                      let item = CanvasLibraryWire.item(id: k, head: head, body: json) else { continue }
                new[k] = item
            }
        }
        let newest = rows.compactMap(\.server_updated_at).max()
        let merged = library.update(local: false) { c -> [(from: String, to: String)] in
            let merged = c.take(pulled, new: new)
            if let newest, newest > (c.ledger.cursor ?? .distantPast) { c.ledger.cursor = newest }
            c.ledger.pulled = true
            return merged
        }
        for m in merged { library.moveThumbnail(from: m.from, to: m.to) }
    }

    // MARK: Up

    static func push(_ client: SupabaseClient, sealer: Sealer, library: CanvasLibrary, check: () throws -> Void) async throws {
        let table = CanvasLibraryWire.table
        // An id the server can't hold (a library file edited by hand) goes up under a new one.
        for m in library.update(local: false, { $0.reidentify() }) { library.moveThumbnail(from: m.from, to: m.to) }

        // Removals first: a removed item never goes up again from here.
        let removals = library.ledger.removed.sorted()
        if !removals.isEmpty {
            let stamp = Date.now.formatted(Date.ISO8601FormatStyle(includingFractionalSeconds: true))
            try await client.from(table).upsert(removals.map { Gone(id: $0, deleted_at: stamp) }, onConflict: "id").execute()
            try check()
            library.update(local: false) { $0.sentRemovals(removals) }
        }

        // New items, once this account's library has come down (the first merge has run).
        guard library.ledger.pulled else { return }
        var batch: [(row: New, edited: Double)] = []
        var bytes = 0
        func send() async throws {
            guard !batch.isEmpty else { return }
            let sending = batch
            batch = []
            bytes = 0
            try await upsert(sending, client: client, library: library, check: check)
        }
        for item in library.contents.unsent {
            guard let id = UUID(uuidString: item.id) else { continue }
            let head = library.contents.head(item)
            guard let body = CanvasLibraryWire.body(item) else { continue }
            guard let headBox = sealer.seal(CanvasLibraryWire.json(head), context: E2EE.libraryHead(id)),
                  let bodyBox = sealer.seal(body, context: E2EE.libraryItem(id)) else { throw Wire.Unsealable() }
            if bodyBox.utf8.count > CanvasLibraryWire.bodyLimit || headBox.utf8.count > CanvasLibraryWire.headLimit {
                log.notice("a whiteboard library item is too big to sync (\(bodyBox.utf8.count, privacy: .public) bytes sealed); it stays on this device")
                library.update(local: false) { $0.keptHere(item.id) }
                continue
            }
            if !batch.isEmpty, bytes + bodyBox.utf8.count > batchBytes || batch.count >= batchRows { try await send() }
            batch.append((New(id: id.uuidString.lowercased(), head_ct: headBox, body_ct: bodyBox), head.edited))
            bytes += bodyBox.utf8.count
        }
        try await send()

        // Renames, each over the version it was read at. Another device wrote since: the later
        // rename wins, and a removal wins over both.
        for (item, read) in library.contents.renames {
            guard let id = UUID(uuidString: item.id) else { continue }
            var version = read
            for _ in 0..<3 {
                guard let now = library.items.first(where: { $0.id == item.id }) else { break }
                let head = library.contents.head(now)
                guard let box = sealer.seal(CanvasLibraryWire.json(head), context: E2EE.libraryHead(id)) else { throw Wire.Unsealable() }
                let done: [Answer] = try await client.from(table).update(["head_ct": box]).eq("id", value: id.uuidString.lowercased())
                    .eq("version", value: Int(version)).select(answerColumns).execute().value
                try check()
                if let a = done.first {
                    library.update(local: false) { a.deleted_at != nil ? $0.goneOnServer(item.id) : $0.sent(item.id, version: a.version, edited: head.edited) }
                    break
                }
                // It changed since this device read it: what is it now?
                let rows: [Row] = try await client.from(table).select(rowColumns).eq("id", value: id.uuidString.lowercased()).execute().value
                try check()
                guard let r = rows.first else { library.update(local: false) { $0.missingOnServer(item.id) }; break }
                let theirs = open(r, sealer: sealer)
                if theirs.removed || (theirs.head?.edited ?? 0) > head.edited {
                    library.update(local: false) { $0.take([theirs]) }
                    break
                }
                version = r.version
                library.update(local: false) { $0.take([CanvasLibraryContents.Pulled(id: theirs.id, version: r.version, head: theirs.head, removed: false)]) }
            }
        }
    }

    /// New items up, a batch at a time. The account's library being full (or an item the server
    /// finds too big) keeps those items on this device, and the rest still go.
    private static func upsert(_ batch: [(row: New, edited: Double)], client: SupabaseClient, library: CanvasLibrary, check: () throws -> Void) async throws {
        do {
            let answers: [Answer] = try await client.from(CanvasLibraryWire.table).upsert(batch.map(\.row), onConflict: "id").select(answerColumns).execute().value
            try check()
            let edited = Dictionary(batch.map { ($0.row.id, $0.edited) }, uniquingKeysWith: { a, _ in a })
            library.update(local: false) { c in
                for a in answers {
                    let k = a.id.uuidString.lowercased()
                    if a.deleted_at != nil { c.goneOnServer(k) } else { c.sent(k, version: a.version, edited: edited[k] ?? 0) }
                }
            }
        } catch let e as PostgrestError where refusesItem(e) {
            guard batch.count > 1 else {
                log.notice("the server won't take a whiteboard library item (\(e.code ?? "", privacy: .public)); it stays on this device")
                library.update(local: false) { $0.keptHere(batch[0].row.id) }
                return
            }
            for one in batch { try await upsert([one], client: client, library: library, check: check) }
        }
    }

    /// The account's library is full, or an item is over what the server holds.
    static func refusesItem(_ e: PostgrestError) -> Bool { e.code == "PT413" || e.code == "23514" }

    /// The server doesn't have the library's table yet (an app newer than its server).
    static func missingTable(_ error: Error) -> Bool {
        guard let e = error as? PostgrestError else { return false }
        return e.code == "PGRST205" || e.code == "42P01"
    }
}
