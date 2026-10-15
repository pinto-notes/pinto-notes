import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// Share says what's true straight away, not after the next poll: the owner's delete leaves no link
/// behind, someone leaving goes from People at once, and Start fresh takes the shared notes with it.
@MainActor
@Suite struct ShareTruthTests {
    let server = MemoryCollabServer()

    struct Device {
        let store: CollabStore
        let context: ModelContext
        let container: ModelContainer
    }

    private func device(_ user: UUID, name: String) throws -> Device {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, SharedDocument.self,
                                           configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let key = SymmetricKey(size: .bits256)
        let store = CollabStore(name: name, transport: server.transport(for: user), dataKey: { key }, book: CollabKeyBook(account: user, defaults: TestDefaults()))
        store.context = container.mainContext
        store.linkVault = MemoryLinkVault()
        return Device(store: store, context: container.mainContext, container: container)
    }

    private func shared() async throws -> (emil: Device, sara: Device, note: Note, saraID: UUID) {
        let emilID = server.account("Emil"), saraID = server.account("Sara")
        let emil = try device(emilID, name: "Emil"), sara = try device(saraID, name: "Sara")
        let note = Note(body: "Team offsite\n")
        emil.context.insert(note)
        try await emil.store.setAccess(.edit, for: note)
        #expect(await sara.store.join(try #require(emil.store.linkURL(note))))
        await server.eventually { server.channelCount(note.id) == 2 }
        return (emil, sara, note, saraID)
    }

    /// (b) The owner deletes: Share shows the note unshared at once, with no link, and the vault forgets it.
    @Test func afterTheOwnersDeleteThereIsNoLink() async throws {
        let (emil, _, note, _) = try await shared()
        #expect(emil.store.shareState(for: note).access == .edit)
        // What SharedLibrary.unshare leaves on this device once the server took the shared note
        // (sealing the text back needs the account's real key, so that half is collab-library's test).
        try #require(emil.store.library).forget(note)
        note.sharedNoteID = nil
        let state = emil.store.shareState(for: note)
        #expect(state.access == .off && state.link == nil)
        #expect(emil.store.linkVault?.load(note.id) == nil)
    }

    /// (a) Sara leaves: she's gone from Emil's People as soon as the channel says she left.
    @Test func someoneWhoLeavesGoesFromPeopleAtOnce() async throws {
        let (emil, sara, note, saraID) = try await shared()
        await server.eventually { emil.store.shareState(for: note).people.contains { $0.id == saraID } }
        let hers = try #require(try sara.context.fetch(FetchDescriptor<Note>()).first { $0.sharedNoteID == note.id })
        let started = ContinuousClock.now
        try await sara.store.leave(hers)
        await server.eventually { !emil.store.shareState(for: note).people.contains { $0.id == saraID } }
        #expect(!emil.store.shareState(for: note).people.contains { $0.id == saraID })
        #expect(ContinuousClock.now - started < .seconds(3))
    }

    /// (c) Start fresh: a note shared with you leaves your notes, yours is an ordinary note again
    /// with its text, and no link is left, all at once.
    @Test func startFreshTakesTheSharedNotesAtOnce() async throws {
        let (emil, sara, note, _) = try await shared()
        // Sara's own shared note too.
        let mine = Note(body: "Sara's list\n")
        sara.context.insert(mine)
        try await sara.store.setAccess(.view, for: mine)
        let joined = try #require(try sara.context.fetch(FetchDescriptor<Note>()).first { $0.sharedNoteID == note.id })

        sara.store.startedFresh()
        #expect(joined.deletedAt != nil)
        #expect(mine.sharedNoteID == nil && mine.deletedAt == nil && mine.body == "Sara's list\n")
        #expect(sara.store.shareState(for: mine).link == nil && sara.store.linkVault?.load(mine.id) == nil)
        _ = emil
    }
}
