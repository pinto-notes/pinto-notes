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
