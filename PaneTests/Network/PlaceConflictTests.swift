import Foundation
import SwiftData
import Testing
@testable import Pane

extension NetworkFaults {
/// A note whose text is the same on both sides, moved, trashed, restored or pinned here while it
/// changed on the server: this device's change still goes up, and the other side's stays.
@MainActor @Suite(.sealedAccount) struct PlaceConflictTests {
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

    private func syncedNote(_ body: String) async throws -> Note {
        let n = context.createNote(in: .all, body: body)
        n.dirty = true
        await engine.sync()
        #expect(!n.dirty && n.serverVersion > 0)
        return n
    }

    private func row(_ n: Note) -> [String: Any] { StubSupabase.note(n.id) ?? [:] }

    @Test func trashedHereWhilePinnedElsewhereKeepsBoth() async throws {
        let n = try await syncedNote("Groceries")
        StubSupabase.update("notes", id: n.id) { $0["is_pinned"] = true }
        n.trashedAt = .now
        n.touchKeepingDate()
        await engine.sync()
        #expect(row(n)["trashed_at"] is String, "the trash made here reached the server")
        #expect(row(n)["is_pinned"] as? Bool == true, "and the pin made there stays")
        #expect(n.trashedAt != nil && n.isPinned && !n.dirty)
        await engine.stop()
    }

    @Test func movedHereWhileTheServerMovedOnKeepsTheMove() async throws {
        let n = try await syncedNote("Trip plan")
        let trips = context.createFolder(named: "Trips")
        await engine.sync()
        // The server moved on without changing the note's text or place (an AI touched it).
        StubSupabase.update("notes", id: n.id) { _ in }
        context.move(n, to: trips)
        await engine.sync()
        #expect((row(n)["folder_id"] as? String)?.lowercased() == trips.id.uuidString.lowercased())
        #expect(n.folder?.id == trips.id && !n.dirty)
        await engine.stop()
    }

    @Test func restoredHereWhileMovedElsewhere() async throws {
        let n = try await syncedNote("Old idea")
        let work = context.createFolder(named: "Work")
        n.trashedAt = .now
        n.touchKeepingDate()
        await engine.sync()
        StubSupabase.update("notes", id: n.id) { $0["folder_id"] = work.id.uuidString.lowercased() }
        n.trashedAt = nil
        n.touchKeepingDate()
        await engine.sync()
        #expect(row(n)["trashed_at"] == nil || row(n)["trashed_at"] is NSNull, "the restore reached the server")
        #expect((row(n)["folder_id"] as? String)?.lowercased() == work.id.uuidString.lowercased(), "and the move made there stays")
        #expect(n.trashedAt == nil && n.folder?.id == work.id)
        await engine.stop()
    }

    /// A third device writes between this one reading the server's version for a conflict and
    /// sending its own over it: that write isn't overwritten unseen; it's kept as a copy too.
    @Test func aThirdWriteDuringAConflictIsKept() async throws {
        let n = try await syncedNote("Plan\nLine")
        StubSupabase.edit(n.id, body: "Plan\nLine A", updatedAt: .now.addingTimeInterval(-30))
        n.body = "Plan\nLine B"
        n.touch()
        let sealer = Wire.sealer, id = n.id
        // The first PATCH misses (version), the conflict reads Line A, and just before its
        // second PATCH lands, a third device writes Line C.
        let count = Count()
        StubSupabase.onRequest = { method, path in
            guard method == "PATCH", path == "/rest/v1/notes", count.next() == 2 else { return }
            Wire.$testSealer.withValue(sealer) { StubSupabase.edit(id, body: "Plan\nLine C", updatedAt: .now.addingTimeInterval(-20)) }
        }
        await engine.sync()
        StubSupabase.onRequest = nil
        await engine.sync()
        #expect(StubSupabase.body(n.id) == "Plan\nLine B", "this device's edit went up")
        let bodies = try context.fetch(FetchDescriptor<Note>()).map(\.body)
        #expect(bodies.contains { $0.contains("Line A") }, "the first other edit is kept as a copy")
        #expect(bodies.contains { $0.contains("Line C") }, "and so is the one made meanwhile: \(bodies)")
        await engine.stop()
    }

    @Test func withoutAStartingPointThisDevicesPlaceWins() {
        let f = UUID(), g = UUID()
        let mine = SyncEngine.Place(folder: f, parent: nil, pinned: false, trashed: .now, deleted: nil)
        let theirs = SyncEngine.Place(folder: g, parent: nil, pinned: true, trashed: nil, deleted: nil)
        #expect(SyncEngine.Place.merge(base: nil, mine: mine, theirs: theirs).same(as: mine))
        // Deleted for good on either side stays deleted.
        let gone = SyncEngine.Place(folder: g, parent: nil, pinned: false, trashed: nil, deleted: .now)
        let base = SyncEngine.Place(folder: g, parent: nil, pinned: false, trashed: nil, deleted: nil)
        #expect(SyncEngine.Place.merge(base: base, mine: mine, theirs: gone).deleted != nil)
    }
}
}

private final class Count: @unchecked Sendable {
    private let lock = NSLock()
    private var n = 0
    func next() -> Int { lock.withLock { n += 1; return n } }
}
