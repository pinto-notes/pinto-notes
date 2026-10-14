import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// Two accounts on two devices, through CollabStore and the transport, against the in-memory server:
/// one shares a note with an Edit link, the other opens the link and joins, both type at once, and
/// both end with the same text holding both people's typing. Offscreen; no window, no network.
@MainActor
@Suite struct CollabTwoPeopleTests {
    let server = MemoryCollabServer()

    struct Device {
        let id: UUID
        let store: CollabStore
        let context: ModelContext
        let container: ModelContainer
    }

    private func device(_ user: UUID, name: String, dataKey: SymmetricKey = SymmetricKey(size: .bits256)) throws -> Device {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let store = CollabStore(name: name, transport: server.transport(for: user), dataKey: { dataKey }, book: CollabKeyBook(account: user, defaults: TestDefaults()))
        store.context = container.mainContext
        return Device(id: user, store: store, context: container.mainContext, container: container)
    }

    /// Emil shares a note with an Edit link; Sara opens the link and joins.
    private func shared(_ body: String) async throws -> (emil: Device, sara: Device, note: Note, ids: (UUID, UUID)) {
        let emilID = server.account("Emil"), saraID = server.account("Sara")
        let emil = try device(emilID, name: "Emil"), sara = try device(saraID, name: "Sara")
        let note = Note(body: body)
        emil.context.insert(note)
        try await emil.store.setAccess(.edit, for: note)
        let url = try #require(emil.store.linkURL(note))
        #expect(await sara.store.join(url))
        // Both devices are on the note's channel.
        await server.eventually { server.channelCount(note.id) == 2 }
        return (emil, sara, note, (emilID, saraID))
    }

    @Test func twoPeopleTypeAtOnceAndBothSeeTheSameText() async throws {
        let (emil, sara, note, _) = try await shared("Offsite plan\n\nAgenda\n")
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: SharedNotes.noteID(for: note.id, user: sara.id)))
        #expect(theirs.text == "Offsite plan\n\nAgenda\n")

        // Both type before either has seen the other's change.
        mine.local("Offsite plan\n\nAgenda\n- Budget\n", selection: nil)
        theirs.local("Offsite plan (Lisbon)\n\nAgenda\n", selection: nil)
        await server.settle()
        await server.eventually { mine.text == theirs.text }

        #expect(mine.text == theirs.text)
        #expect(mine.text == "Offsite plan (Lisbon)\n\nAgenda\n- Budget\n")
        // Every change went to the server sealed: nothing in it reads as the note.
        let stored = server.updates[note.id] ?? []
        #expect(stored.count == 2)
        #expect(stored.allSatisfy { $0.ct.hasPrefix("amb3u.1.") && !$0.ct.contains("Budget") })
    }

    @Test func someoneWhoJoinsLaterGetsEverythingFromTheServer() async throws {
        let (emil, sara, note, ids) = try await shared("Groceries\n")
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: SharedNotes.noteID(for: note.id, user: sara.id)))
        mine.local("Groceries\n- milk\n", selection: nil)
        await server.eventually { theirs.text == "Groceries\n- milk\n" }
        theirs.local(theirs.text + "- eggs\n", selection: nil)
        await server.eventually { mine.text.hasSuffix("eggs\n") }
        #expect(mine.text == "Groceries\n- milk\n- eggs\n")
        // Sara's other device: her data key, nothing else. It opens the note key from her own copy.
        let rows = try await server.transport(for: ids.1).memberships()
        let row = try #require(rows.first { $0.note_id == note.id })
        #expect(row.self_wrap != nil)
        let opened = try await sara.store.openKey(row)
        let session = try await CollabSession.load(record: SharedDocument(id: note.id, epoch: row.epoch, role: "editor", saved: Data()), nk: opened.nk, transport: server.transport(for: ids.1), me: ids.1, name: "Sara")
        #expect(session.text == "Groceries\n- milk\n- eggs\n")
    }

    @Test func aChangeTheServerDidntTakeIsSentAgainInOrder() async throws {
        let (emil, sara, note, _) = try await shared("Notes\n")
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: SharedNotes.noteID(for: note.id, user: sara.id)))
        server.offline = true
        mine.local("Notes\none\n", selection: nil)
        mine.local("Notes\none\ntwo\n", selection: nil)
        await server.eventually { mine.unsent == 2 }
        #expect(mine.unsent == 2)
        #expect(theirs.text == "Notes\n")
        server.offline = false
        mine.local("Notes\none\ntwo\nthree\n", selection: nil)
        await server.eventually { theirs.text == mine.text && mine.unsent == 0 }
        #expect(mine.unsent == 0)
        #expect(theirs.text == "Notes\none\ntwo\nthree\n")
    }

    @Test func aRemovedPersonGetsNoNewTextAndCantWrite() async throws {
        let (emil, sara, note, ids) = try await shared("Plan\n")
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: SharedNotes.noteID(for: note.id, user: sara.id)))
        // Emil's last change is stored but his live channel hasn't counted it as seen.
        mine.local("Plan\n- book flights\n", selection: nil)
        await server.eventually { mine.unsent == 0 && theirs.text == mine.text }
        try await emil.store.remove(ids.1, from: note)
        await server.eventually { mine.epoch == 2 }
        #expect(mine.epoch == 2)
        // A device starting now has only the new key: the snapshot under it holds everything.
        let row = try #require(try await server.transport(for: ids.0).memberships().first { $0.note_id == note.id })
        let fresh = try await CollabSession.load(record: SharedDocument(id: note.id, epoch: 2, role: "editor", saved: Data()), nk: try await emil.store.openKey(row).nk,
                                                 transport: server.transport(for: ids.0), me: ids.0, name: "Emil")
        #expect(fresh.text == "Plan\n- book flights\n")
        mine.local("Plan\n- book flights\nsecret after removal\n", selection: nil)
        await server.settle()
        #expect(!theirs.text.contains("secret"))
        // Her device still holds the old key: the server refuses what she sends, and her device
        // doesn't keep trying.
        theirs.local(theirs.text + "still here\n", selection: nil)
        await server.eventually { theirs.unsent == 0 && server.calls.filter { $0 == "update" }.count >= 2 }
        #expect(!(server.updates[note.id] ?? []).contains { $0.author_id == ids.1 && $0.epoch == 2 })
        // And her memberships say she's out: the note goes from her library, as in Apple Notes.
        await sara.store.checkInvites()
        let hers = SharedNotes.noteID(for: note.id, user: ids.1)
        #expect(sara.store.removedFrom.contains(hers))
        #expect(sara.store.session(for: hers) == nil)
        #expect(sara.context.note(hers)?.deletedAt != nil)
    }

    @Test func presenceReachesTheOtherPersonAndLeavingIsSeen() async throws {
        let (emil, sara, note, ids) = try await shared("Hello\n")
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: SharedNotes.noteID(for: note.id, user: sara.id)))
        theirs.selectionChanged(NSRange(location: 3, length: 0))
        await server.settle()
        await server.eventually { mine.peers[ids.1]?.selection != nil }
        #expect(mine.peers[ids.1]?.selection == NSRange(location: 3, length: 0))
        #expect(mine.peers[ids.1]?.name == "Sara")
        theirs.disconnect()
        await server.eventually { mine.peers[ids.1] == nil }
        #expect(mine.peers[ids.1] == nil)
    }

    @Test func yourOtherDeviceSeesYourTypingLive() async throws {
        let emilID = server.account("Emil")
        let dataKey = SymmetricKey(size: .bits256)
        let mac = try device(emilID, name: "Emil", dataKey: dataKey), phone = try device(emilID, name: "Emil", dataKey: dataKey)
        let note = Note(body: "Packing\n")
        mac.context.insert(note)
        let onMac = try await mac.store.share(note)
        // The note's pointer reaches the phone by sync; the phone opens the note from the account's
        // own copy of its key.
        let copy = Note(body: SharedNotes.placeholder(title: "Packing"))
        copy.id = note.id
        copy.sharedNoteID = note.id
        phone.context.insert(copy)
        let onPhone = try #require(await phone.store.library?.ensureDocument(copy))
        await server.eventually { server.channelCount(note.id) == 2 }

        onMac.local("Packing\n- passport\n", selection: nil)
        await server.eventually { onPhone.text == onMac.text }
        #expect(onPhone.text == "Packing\n- passport\n")
        onPhone.local(onPhone.text + "- charger\n", selection: nil)
        await server.eventually { onMac.text == onPhone.text }
        #expect(onMac.text == "Packing\n- passport\n- charger\n")
    }

    @Test func aChangeThatWasntRelayedArrivesWhenTheChannelRejoins() async throws {
        let (emil, sara, note, _) = try await shared("Ideas\n")
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: SharedNotes.noteID(for: note.id, user: sara.id)))
        server.dropRelays = true
        mine.local("Ideas\n- one\n", selection: nil)
        await server.eventually { (server.updates[note.id] ?? []).count == 1 }
        server.dropRelays = false
        // A later change can't be shown before the one it builds on.
        mine.local("Ideas\n- one\n- two\n", selection: nil)
        await server.settle()
        #expect(theirs.text == "Ideas\n")
        server.rejoin(note.id)
        await server.eventually { theirs.text == mine.text }
        #expect(theirs.text == "Ideas\n- one\n- two\n")
    }

    @Test func afterSomeoneLeavesTheOwnersDeviceRenewsTheKeyAndTheLinkKeepsWorking() async throws {
        let (emil, sara, note, ids) = try await shared("Trip\n")
        let mine = try #require(emil.store.session(for: note.id))
        let url = try #require(emil.store.linkURL(note))
        let oldKey = try #require(emil.store.keys[note.id]?.nk)
        // Sara leaves her note (her own id for it).
        try await sara.store.leave(try #require(sara.context.note(SharedNotes.noteID(for: note.id, user: ids.1))))
        // Emil's device sees it with his memberships and renews the key, without anyone removed.
        await emil.store.checkInvites()
        await server.eventually { mine.epoch == 2 }
        #expect(mine.epoch == 2)
        #expect(try await server.transport(for: ids.0).memberships().first?.rekey_after == nil)
        // New text is sealed with a key Sara never had.
        mine.local("Trip\n- after Sara left\n", selection: nil)
        await server.eventually { (server.updates[note.id] ?? []).contains { $0.epoch == 2 } }
        let sealed = try #require((server.updates[note.id] ?? []).last { $0.epoch == 2 })
        #expect(throws: (any Error).self) { try CollabCrypto.open(.update, sealed.ct, nk: oldKey, note: note.id, extra: ids.0.uuidString) }
        // The same link still lets someone join, under the new key.
        let jonas = try device(server.account("Jonas"), name: "Jonas")
        #expect(await jonas.store.join(url))
        let his = SharedNotes.noteID(for: note.id, user: jonas.id)
        await server.eventually { jonas.store.session(for: his)?.text == mine.text }
        #expect(jonas.store.session(for: his)?.text == "Trip\n- after Sara left\n")
    }
}
