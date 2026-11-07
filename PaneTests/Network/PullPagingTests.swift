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
        #expect(trips.dirty, "and still goes up")
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
}
}

/// A thread-safe count, for the stub's request hook.
private final class Counter: @unchecked Sendable {
    private let lock = NSLock()
    private var n = 0
    func next() -> Int { lock.withLock { n += 1; return n } }
}
