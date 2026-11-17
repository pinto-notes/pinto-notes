import Foundation
import SwiftData
import Testing
@testable import Pane

extension NetworkFaults {
/// A pull while things change elsewhere: a folder moved here and not sent yet keeps its new place,
/// and a row changed between two pages of a big pull is still read, with every row after it.
@MainActor @Suite(.sealedAccount) struct PullPagingTests {
    let context: ModelContext
    let engine: SyncEngine

    init() throws {
        StubSupabase.reset()
        NetFault.config = .init()
        NetFault.resetLog()
        UserDefaults.standard.removeObject(forKey: "syncCursor.none")
        UserDefaults.standard.removeObject(forKey: "syncCursor.none.pages")
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        context = ModelContext(c)
        engine = SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com"), context: context)
    }

    private func finish() async {
        StubSupabase.onRequest = nil
        await engine.stop()
        NetFault.config = .init()
    }

    private func serverParent(_ f: Folder) -> String? {
        (StubSupabase.rows("folders").first { ($0["id"] as? String) == f.id.uuidString.lowercased() }?["parent_id"] as? String)?.lowercased()
    }

    /// Calls `body` on the main actor the `n`th time a GET for `table` reaches the server, before
    /// it's answered.
    private func onGet(_ table: String, number n: Int, _ body: @escaping @MainActor () -> Void) {
        let count = Counter()
        nonisolated(unsafe) let body = body
        StubSupabase.onRequest = { method, path in
            guard method == "GET", path == "/rest/v1/\(table)", count.next() == n else { return }
            DispatchQueue.main.sync { MainActor.assumeIsolated { body() } }
        }
    }

    // MARK: Folder parents

    @Test func aFolderMovedHereWhileAPullIsOnItsWayKeepsItsNewParent() async throws {
        let trips = context.createFolder(named: "Trips")
        let work = context.createFolder(named: "Work")
        await engine.sync()
        #expect(!trips.dirty && !work.dirty && trips.serverVersion > 0)
        // Another device changes Trips, so the pull brings its row (with no parent)…
        StubSupabase.update("folders", id: trips.id) { $0["sort_index"] = 7.0 }
        // …while it's moved into Work here, after this run's push.
        nonisolated(unsafe) let ctx = context
        onGet("folders", number: 1) { ctx.move(trips, into: work) }
        await engine.sync()
        #expect(trips.parent?.id == work.id, "the move made here isn't undone by the pull")
        // And it goes up: in a push run straight after this one (the move asked for it), or the next sync.
        #expect(trips.dirty || serverParent(trips) == work.id.uuidString.lowercased())
        StubSupabase.onRequest = nil
        await engine.sync()
        #expect(serverParent(trips) == work.id.uuidString.lowercased())
        #expect(trips.parent?.id == work.id && !trips.dirty)
        await finish()
    }

    @Test func aFolderMovedElsewhereFollowsHere() async throws {
        let trips = context.createFolder(named: "Trips")
        let work = context.createFolder(named: "Work")
        await engine.sync()
        StubSupabase.update("folders", id: trips.id) { $0["parent_id"] = work.id.uuidString.lowercased() }
        await engine.sync()
        #expect(trips.parent?.id == work.id)
        await finish()
    }

    // MARK: Pages

    /// `count` rows made on the server a while ago, in order, as another device would have sent them.
    private func serverFolders(_ count: Int) -> [UUID] {
        let start = Date.now.addingTimeInterval(-600)
        return (0 ..< count).map { i in
            let id = UUID()
            let at = start.addingTimeInterval(Double(i) * 0.01)
            StubSupabase.insert("folders", [
                "id": id.uuidString.lowercased(), "name_ct": Wire.sealer!.seal("Folder \(i)", context: E2EE.folder(id))!,
                "sort_index": Double(i), "created_at": StubSupabase.stamp(at), "updated_at": StubSupabase.stamp(at),
                "version": 1, "server_updated_at": StubSupabase.stamp(at),
            ])
            return id
        }
    }

    private func serverNotes(_ count: Int) -> [UUID] {
        let start = Date.now.addingTimeInterval(-600)
        return (0 ..< count).map { i in
            let id = UUID()
            let at = start.addingTimeInterval(Double(i) * 0.01)
            let body = "Note \(i)\nfrom another device"
            StubSupabase.insert("notes", [
                "id": id.uuidString.lowercased(), "body_ct": Wire.sealer!.seal(body, context: E2EE.body(id))!,
                "head_ct": Wire.sealer!.sealHead(.of(body), note: id)!, "is_pinned": false,
                "created_at": StubSupabase.stamp(at), "updated_at": StubSupabase.stamp(at),
                "version": 1, "server_updated_at": StubSupabase.stamp(at),
            ])
            return id
        }
    }

    @Test func aFolderChangedBetweenTwoPagesSkipsNoOther() async throws {
        let ids = serverFolders(1005)
        // Between the first page (1,000 rows) and the second, the first folder changes elsewhere
        // and moves to the end of the order.
        onGet("folders", number: 2) { StubSupabase.update("folders", id: ids[0]) { $0["sort_index"] = -1.0 } }
        await engine.sync()
        let here = Set(context.allFoldersIncludingDeleted().map(\.id))
        #expect(Set(ids).subtracting(here).isEmpty, "every folder came down: \(Set(ids).subtracting(here).count) missing")
        #expect(context.folder(ids[0])?.sortIndex == -1)
        await finish()
    }

    @Test func aNoteChangedBetweenTwoPagesSkipsNoOther() async throws {
        let ids = serverNotes(505)
        // The hook runs outside this test's task, so it's given the test's key.
        let sealer = Wire.sealer
        onGet("notes", number: 2) { Wire.$testSealer.withValue(sealer) { StubSupabase.edit(ids[0], body: "Note 0\nchanged meanwhile") } }
        await engine.sync()
        let here = Set(try context.fetch(FetchDescriptor<Note>()).map(\.id))
        #expect(Set(ids).subtracting(here).isEmpty, "every note came down: \(Set(ids).subtracting(here).count) missing")
        #expect(context.note(ids[0])?.body == "Note 0\nchanged meanwhile")
        await finish()
    }

    /// A pull whose rows couldn't be saved here (a full disk) doesn't move the cursor past them:
    /// if the app then quits, the next pull brings them again.
    @Test func aPullThatCouldntBeSavedKeepsTheCursor() async throws {
        let ids = serverNotes(3)
        engine.saveLibrary = { _ in false }
        await engine.sync()
        #expect(UserDefaults.standard.object(forKey: "syncCursor.none") == nil, "the cursor didn't move")
        if case .synced = engine.status { Issue.record("not reported as synced") }
        engine.saveLibrary = { $0.saveOrReport() }
        await engine.sync()
        #expect(UserDefaults.standard.object(forKey: "syncCursor.none") != nil)
        #expect(Set(try context.fetch(FetchDescriptor<Note>()).map(\.id)) == Set(ids))
        await finish()
    }

    /// `count` app pages (note_pages) on the server from a while ago, and one ordinary note newer
    /// than all of them.
    private func serverPages(_ count: Int) -> [UUID] {
        let start = Date.now.addingTimeInterval(-600)
        let ids = (0 ..< count).map { i -> UUID in
            let id = UUID()
            let at = start.addingTimeInterval(Double(i) * 0.01)
            StubSupabase.insert("note_pages", [
                "note_id": id.uuidString.lowercased(), "page_ct": Wire.sealer!.seal("<p>Page \(i)</p>", context: E2EE.page(id))!,
                "client": "Claude", "updated_at": StubSupabase.stamp(at), "server_updated_at": StubSupabase.stamp(at),
            ])
            return id
        }
        _ = serverNotes(1).map { id in StubSupabase.update("notes", id: id) { _ in } }
        return ids
    }

    @Test func moreAppPagesThanOneAnswerHoldsAllComeDown() async throws {
        let ids = serverPages(1003)
        await engine.sync()
        let missing = ids.filter { NotePageStore.shared[$0] == nil }
        #expect(missing.isEmpty, "\(missing.count) pages missing")
        await finish()
    }

    @Test func appPagesAFailedRequestMissedComeDownNextTime() async throws {
        let ids = serverPages(2)
        // Every try of this sync fails (the request is retried a few times).
        for _ in 0 ..< 20 { StubSupabase.loseAnswer("GET", "/rest/v1/note_pages", applied: false) }
        await engine.sync()
        #expect(ids.allSatisfy { NotePageStore.shared[$0] == nil })
        StubSupabase.clearLostAnswers()
        await engine.sync()
        #expect(ids.allSatisfy { NotePageStore.shared[$0] != nil }, "read again, though the notes' cursor moved past them")
        await finish()
    }

    /// Rows written in one go share their server time to the microsecond; the order's tie-break
    /// (the id) still pages through them all, each once.
    @Test func rowsWithTheSameServerTimeArePagedByID() async throws {
        let ids = serverNotes(1203)
        let same = StubSupabase.stamp(.now.addingTimeInterval(-300))
        for id in ids { StubSupabase.setStamp("notes", id: id, same) }
        await engine.sync()
        #expect(Set(try context.fetch(FetchDescriptor<Note>()).map(\.id)) == Set(ids))
        await finish()
    }

    // MARK: A first sync of the release gate's bench accounts

    /// A library as the release gate's bench accounts have it (scripts/page-evals/staging-bench.ts):
    /// `count` notes in `nf` folders up to three deep, and every 20th note under the one before it,
    /// as an older build made sub-notes. Returns how many sub-notes there are.
    private func benchLibrary(notes count: Int, folders nf: Int) -> Int {
        let start = Date.now.addingTimeInterval(-600)
        var folders: [UUID] = []
        for i in 0 ..< nf {
            let id = UUID()
            let at = start.addingTimeInterval(Double(i) * 0.01)
            let parent: Any = i < 4 ? NSNull() : folders[(i * 3) % min(i, 40)].uuidString.lowercased()
            StubSupabase.insert("folders", [
                "id": id.uuidString.lowercased(), "name_ct": Wire.sealer!.seal("Folder \(i)", context: E2EE.folder(id))!, "parent_id": parent,
                "sort_index": Double(i), "created_at": StubSupabase.stamp(at), "updated_at": StubSupabase.stamp(at),
                "version": 1, "server_updated_at": StubSupabase.stamp(at),
            ])
            folders.append(id)
        }
        var notes: [UUID] = []
        var subNotes = 0
        for i in 0 ..< count {
            let id = UUID()
            let at = start.addingTimeInterval(10 + Double(i) * 0.01)
            let body = "Note \(i)\n\nSome text for note \(i)"
            let under: Any = i % 20 == 19 ? notes[i - 1].uuidString.lowercased() : NSNull()
            if i % 20 == 19 { subNotes += 1 }
            StubSupabase.insert("notes", [
                "id": id.uuidString.lowercased(), "body_ct": Wire.sealer!.seal(body, context: E2EE.body(id))!,
                "head_ct": Wire.sealer!.sealHead(.of(body), note: id)!, "is_pinned": false,
                "folder_id": folders[i % nf].uuidString.lowercased(), "parent_id": under,
                "created_at": StubSupabase.stamp(at), "updated_at": StubSupabase.stamp(at),
                "version": 1, "server_updated_at": StubSupabase.stamp(at),
            ])
            notes.append(id)
        }
        return subNotes
    }

    /// Requests that reached the server, by method and table ("GET notes", "POST folders").
    private func requests() -> [String: Int] {
        var out: [String: Int] = [:]
        for r in StubSupabase.requests {
            let parts = r.split(separator: " ", maxSplits: 1)
            guard parts.count == 2, let path = parts[1].split(separator: "?").first, path.hasPrefix("/rest/v1/") else { continue }
            out["\(parts[0]) \(path.dropFirst("/rest/v1/".count))", default: 0] += 1
        }
        return out
    }

    /// The release gate on 16 November 2026 measured 1.4's first sync of its 10,000-note bench
    /// account at 157 s and 1,068 requests (notes 523, folders 502), against 15.8 s and 35 for 1.3.2.
    /// Those counts are two pulls and one push of 500 folders and 500 notes: the account's 500
    /// sub-notes, folded into folders named after their parents (foldSubNotesIntoFolders) and sent
    /// up once. 1.4 was the first app to sign in to those accounts (made that morning); 1.3.2 ran an
    /// hour later, on accounts 1.4 had already folded. A backup poll (realtime isn't joined during the
    /// first sync) that came due during the first pull turned the push that follows into a full run,
    /// so `synced` waited for it; the 2,000-note account's first pull ended before the first poll, so
    /// its push came after the measurement.
    ///
    /// Here, that first sync at a small size, with the backup poll coming due during it: the folded
    /// rows go up one write each, in one more run, and nothing asks for more runs however long the
    /// sync takes. A second device afterwards pulls the folded library and writes nothing (what the
    /// gate measured for 1.3.2).
    @Test(.timeLimit(.minutes(1))) func aFirstSyncFoldsOldSubNotesOnceInOneMoreRun() async throws {
        let saved = SyncEngine.fallbackPoll
        SyncEngine.fallbackPoll = (.milliseconds(40), .milliseconds(40), 300)
        defer { SyncEngine.fallbackPoll = saved }
        let subNotes = benchLibrary(notes: 400, folders: 16)
        // Signed in with realtime down (it joins only after the first sync), so the backup poll runs.
        // Offline for the start: the socket isn't tried, and the first sync is the one below.
        NetFault.config = .init(offline: true)
        await engine.start()
        // Every request slowed, so the first pull outlasts a poll interval, as 10,000 notes outlast
        // 8 s against staging.
        NetFault.config = .init(delay: 0.02)
        StubSupabase.resetLog()
        let began = Date.now
        await engine.sync()
        let took = Date.now.timeIntervalSince(began)
        let first = requests()
        print("PERF first sync with \(subNotes) old sub-notes: \(StubSupabase.requests.count) requests in \(String(format: "%.2f", took)) s: \(first.sorted { $0.key < $1.key })")
        let notes = try context.fetch(FetchDescriptor<Note>())
        #expect(notes.count == 400)
        #expect(notes.allSatisfy { $0.parentID == nil && !$0.dirty }, "every sub-note folded and sent")
        #expect(context.allFolders().count == 16 + subNotes, "one folder for each note that had sub-notes")
        #expect(first["POST folders"] == subNotes && first["PATCH notes"] == subNotes, "one write per folded row, once")
        #expect(first["GET notes"] == 2 && first["GET folders"] == 2, "the first pull and one more run: no run for every poll that came due")
        #expect(took > 0.08, "the first sync outlasted a poll interval, as on the gate")
        if case .synced = engine.status {} else { Issue.record("status should be synced, is \(engine.status)") }
        await finish()

        // Another device signs in now: the library comes down folded, and nothing goes up.
        let suite = "PullPagingTests.second.\(UUID())"
        let defaults = try #require(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let second = ModelContext(c)
        let other = SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com"), context: second, defaults: defaults)
        StubSupabase.resetLog()
        await other.sync()
        let again = requests()
        #expect(try second.fetchCount(FetchDescriptor<Note>()) == 400)
        #expect(second.allFolders().count == 16 + subNotes, "the same folders, none made twice")
        #expect(again["POST folders"] == nil && again["PATCH notes"] == nil && again["POST notes"] == nil, "nothing to fold: \(again)")
        await other.stop()
    }
}
}

/// A thread-safe count, for the stub's request hook.
private final class Counter: @unchecked Sendable {
    private let lock = NSLock()
    private var n = 0
    func next() -> Int { lock.withLock { n += 1; return n } }
}
