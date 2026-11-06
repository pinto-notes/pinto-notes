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
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
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

    static let packing = "Packing\n- [ ] Passport\n- [ ] Charger\n- [ ] Tickets\n- [ ] Snacks\n"

    /// The text after tapping the box of `item`, as the editor does it (one character).
    static func tick(_ text: String, _ item: String) -> String {
        let ns = text as NSString
        let line = ns.lineRange(for: NSRange(location: ns.range(of: item).location, length: 0)).location
        let edit = ListEditing.toggleCheckbox(in: text, lineStart: line)!
        return ns.replacingCharacters(in: edit.range, with: edit.replacement)
    }

    /// The editor's tick and then the move that sinks ticked items, as in a note of your own.
    static func tickAndSort(_ text: String, _ item: String) -> String {
        let ticked = tick(text, item)
        let at = (ticked as NSString).range(of: item).location
        guard let sort = ListEditing.sortChecklist(in: ticked, around: at, caret: -1) else { return ticked }
        return (ticked as NSString).replacingCharacters(in: sort.range, with: sort.replacement)
    }

    /// A shared checklist: two people tick different items at once, and both see both ticks.
    @Test func twoPeopleTickAtOnceAndBothSeeBothTicks() async throws {
        let (emil, sara, note, _) = try await shared(Self.packing)
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
        mine.local(Self.tick(mine.text, "Passport"), selection: nil)
        theirs.local(Self.tick(theirs.text, "Tickets"), selection: nil)
        await server.settle()
        await server.eventually { mine.text == theirs.text && mine.text.contains("[x] Passport") && mine.text.contains("[x] Tickets") }
        #expect(mine.text == theirs.text)
        #expect(mine.text == "Packing\n- [x] Passport\n- [ ] Charger\n- [x] Tickets\n- [ ] Snacks\n")
    }

    /// Both tick the same item before seeing the other's tick (two phones in the shop): each
    /// replaced the same character, and both replacements would stay ("[xx]", no box any more).
    /// The first device to see it keeps one, and so does the other, so it ends as one tick.
    /// The same for both unticking it again.
    @Test func bothTickingTheSameItemAtOnceLeavesOneTick() async throws {
        let (emil, sara, note, _) = try await shared(Self.packing)
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
        let ticked = Self.tick(Self.packing, "Snacks")
        mine.local(ticked, selection: nil)
        theirs.local(ticked, selection: nil)
        await server.settle()
        await server.eventually { mine.text == ticked && theirs.text == ticked }
        #expect(mine.text == ticked && theirs.text == ticked, "\(mine.text.debugDescription) / \(theirs.text.debugDescription)")

        mine.local(Self.packing, selection: nil)
        theirs.local(Self.packing, selection: nil)
        await server.settle()
        await server.eventually { mine.text == Self.packing && theirs.text == Self.packing }
        #expect(mine.text == Self.packing && theirs.text == Self.packing, "\(mine.text.debugDescription) / \(theirs.text.debugDescription)")
    }

    /// Only a list item's box is mended, and only one a merge doubled.
    @Test func whichBoxesAreMended() {
        let text = "- [xx] a\n  * [  ] b\n- [x ] c\n- [x] d\n- [ ] e\nNot [xx] a box\n1. [xx] f\n- [xx]g\n"
        let ns = text as NSString
        #expect(CollabTicks.drops(in: text).map { ns.substring(with: $0) } == ["x", " ", " "])
        #expect(CollabTicks.drops(in: "- [x] Milk\n- [ ] Bread\n").isEmpty)
    }

    /// Why a tick doesn't move the item in a shared note (EditorController.sortsTickedItems): the
    /// move rewrites the list, and two people's moves at once merge into doubled lines.
    @Test func whyTicksStayPutInASharedNote() async throws {
        let (emil, sara, note, _) = try await shared(Self.packing)
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
        mine.local(Self.tickAndSort(mine.text, "Passport"), selection: nil)
        theirs.local(Self.tickAndSort(theirs.text, "Charger"), selection: nil)
        await server.settle()
        await server.eventually { mine.text == theirs.text }
        let lines = mine.text.split(separator: "\n")
        #expect(lines.count > 5, "the moves merged cleanly after all, so ticks could move again: \(mine.text.debugDescription)")
    }

    @Test func someoneWhoJoinsLaterGetsEverythingFromTheServer() async throws {
        let (emil, sara, note, ids) = try await shared("Groceries\n")
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
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
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
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
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
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
        await sara.store.checkMemberships()
        let hers = try #require(sara.context.pointer(forShared: note.id)?.id)
        #expect(sara.store.removedFrom.contains(hers))
        #expect(sara.store.session(for: hers) == nil)
        #expect(sara.context.note(hers)?.deletedAt != nil)
        // Nobody's signed in with this store: no alert for the window that opens next. It stayed
        // queued and covered the Mac window of every test after this one.
        #expect(SharedRemovals.shared.queue.isEmpty)
    }

    /// The signed-in account's store is the one that says so.
    @Test func theSignedInStoreSaysSoOverTheNotes() async throws {
        let (emil, sara, note, ids) = try await shared("Plan\n")
        let previous = CollabStore.shared
        CollabStore.shared = sara.store
        defer { CollabStore.shared = previous; SharedRemovals.shared.clear() }
        try await emil.store.remove(ids.1, from: note)
        await sara.store.checkMemberships()
        #expect(SharedRemovals.shared.current?.title == "Plan")
    }

    @Test func aRemovedPersonFindsOutAtOnceNotAtTheNextCheck() async throws {
        // Her channel stays open and her half-minute check has just run: only the nudge can tell her in time.
        server.removedStayOnChannel = true
        let (emil, sara, note, ids) = try await shared("Plan\n")
        await sara.store.checkMemberships()
        let hers = try #require(sara.context.pointer(forShared: note.id)?.id)
        try await emil.store.remove(ids.1, from: note)
        await server.eventually { sara.store.removedFrom.contains(hers) }
        #expect(sara.store.removedFrom.contains(hers))
        #expect(sara.store.session(for: hers) == nil)
    }

    @Test func presenceReachesTheOtherPersonAndLeavingIsSeen() async throws {
        let (emil, sara, note, ids) = try await shared("Hello\n")
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
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
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
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
        let hers = try #require(sara.context.pointer(forShared: note.id))
        try await sara.store.leave(hers)
        // Emil's device sees it with his memberships and renews the key, without anyone removed.
        await emil.store.checkMemberships()
        await server.eventually { mine.epoch == 2 }
        #expect(mine.epoch == 2)
        #expect(try await server.transport(for: ids.0).memberships().first?.rekey_after == nil)
        // New text is sealed with a key Sara never had.
        mine.local("Trip\n- after Sara left\n", selection: nil)
        await server.eventually { (server.updates[note.id] ?? []).contains { $0.epoch == 2 } }
        let sealed = try #require((server.updates[note.id] ?? []).last { $0.epoch == 2 })
        #expect(throws: (any Error).self) { try CollabCrypto.open(.update, sealed.ct, nk: oldKey, note: note.id, extra: ids.0.uuidString) }
        // The same link still lets someone join, under the new key.
        let jonasID = server.account("Jonas")
        let jonas = try device(jonasID, name: "Jonas")
        #expect(await jonas.store.join(url))
        let his = jonas.context.pointer(forShared: note.id)?.id ?? UUID()
        await server.eventually { jonas.store.session(for: his)?.text == mine.text }
        #expect(jonas.store.session(for: his)?.text == "Trip\n- after Sara left\n")
    }

    @Test func theSnapshotUnderANewKeyIsTriedAgainUntilItsIn() async throws {
        CollabSession.snapshotRetryAfter = .milliseconds(50)
        defer { CollabSession.snapshotRetryAfter = .seconds(20) }
        let (emil, _, note, ids) = try await shared("Budget\n")
        let mine = try #require(emil.store.session(for: note.id))
        server.failSnapshots = true
        try await emil.store.remove(ids.1, from: note)
        #expect(mine.epoch == 2)
        #expect(!(server.snapshots[note.id] ?? []).contains { $0.epoch == 2 })
        #expect(mine.owesSnapshot)
        server.failSnapshots = false
        await server.eventually { (server.snapshots[note.id] ?? []).contains { $0.epoch == 2 } }
        #expect((server.snapshots[note.id] ?? []).contains { $0.epoch == 2 })
        #expect(!mine.owesSnapshot)
        // A device starting now opens it with the new key alone.
        let row = try #require(try await server.transport(for: ids.0).memberships().first { $0.note_id == note.id })
        #expect(row.epoch == 2)
    }

    @Test func aNoteTooLongToSnapshotIsntShared() async throws {
        let emilID = server.account("Emil")
        let emil = try device(emilID, name: "Emil")
        // Text that doesn't compress, longer than the server takes in one snapshot.
        var bytes = [UInt8](repeating: 0, count: 4_500_000)
        for i in bytes.indices { bytes[i] = UInt8.random(in: 0...255) }
        let long = Data(bytes).base64EncodedString()
        #expect(try CollabText.sealedSnapshotSize(of: long) > CollabSession.maxSnapshot)
        #expect(try CollabText.sealedSnapshotSize(of: "A short note") < 1000)
        let note = Note(body: long)
        emil.context.insert(note)
        await #expect(throws: Collab.Failure.tooLongToShare) { try await emil.store.share(note) }
        #expect(!server.calls.contains("share"))
        #expect(Collab.Failure.tooLongToShare.errorDescription == "This note is too long to share. Split it into smaller notes.")
    }

    @Test func thisBuildTellsTheServerItKnowsSharedNotes() {
        #expect(Backend.clientTag.split(separator: " ").contains("shared/1"))
    }

    @Test func afterALeaveTheOwnersRelaunchedAppRenewsTheKey() async throws {
        let emilID = server.account("Emil"), saraID = server.account("Sara")
        let emilKey = SymmetricKey(size: .bits256)
        let emil = try device(emilID, name: "Emil", dataKey: emilKey), sara = try device(saraID, name: "Sara")
        let note = Note(body: "Plan\n")
        emil.context.insert(note)
        try await emil.store.setAccess(.edit, for: note)
        #expect(await sara.store.join(try #require(emil.store.linkURL(note))))
        await server.eventually { server.channelCount(note.id) == 2 }
        try emil.context.save()
        // Emil quits; Sara leaves meanwhile; Emil's app starts again on the same library.
        emil.store.stop()
        try await sara.store.leave(try #require(sara.context.pointer(forShared: note.id)))
        let relaunched = CollabStore(name: "Emil", transport: server.transport(for: emilID), dataKey: { emilKey },
                                     book: CollabKeyBook(account: emilID, defaults: TestDefaults()))
        relaunched.context = emil.context
        await relaunched.checkMemberships()
        let row = try #require(try await server.transport(for: emilID).memberships().first { $0.note_id == note.id })
        #expect(row.epoch == 2)
        #expect(row.rekey_after == nil)
    }
}

/// A name the test can change, read wherever the app reads yours (ProfileStore's).
@MainActor private final class NameBox {
    var name: String
    init(_ name: String) { self.name = name }
}

/// Persona council round 7: bugs 15 and 18, between two people through the in-memory server.
extension CollabTwoPeopleTests {
    /// Bug 15: the name was read once, when the store was made, before the profile had settled,
    /// so others saw "Someone" until a relaunch. It's read each time presence goes out, so a name
    /// learned later reaches them.
    @Test func aNameLearnedLaterReachesTheOthers() async throws {
        let emilID = server.account("Emil"), saraID = server.account("Sara")
        let box = NameBox("Someone")
        let key = SymmetricKey(size: .bits256)
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let store = CollabStore(name: box.name, transport: server.transport(for: emilID), dataKey: { key },
                                book: CollabKeyBook(account: emilID, defaults: TestDefaults()))
        store.context = container.mainContext
        let sara = try device(saraID, name: "Sara")
        let note = Note(body: "Trip plan\n")
        container.mainContext.insert(note)
        try await store.setAccess(.edit, for: note)
        let url = try #require(store.linkURL(note))
        #expect(await sara.store.join(url))
        await server.eventually { server.channelCount(note.id) == 2 }
        let mine = try #require(store.session(for: note.id))
        let theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))

        mine.selectionChanged(NSRange(location: 1, length: 0))
        await server.eventually { theirs.peers[emilID]?.selection == NSRange(location: 1, length: 0) }
        #expect(theirs.peers[emilID]?.name == "Someone")

        // The profile settles after sharing started.
        box.name = "Emil"
        #expect(store.name == "Emil" && store.library?.name == "Emil" && mine.myName == "Emil")
        mine.selectionChanged(NSRange(location: 2, length: 0))
        await server.eventually { theirs.peers[emilID]?.name == "Emil" }
        #expect(theirs.peers[emilID]?.name == "Emil")
    }

    /// Bug 18: with the server gone for 16 seconds both phones still looked connected. Someone not
    /// heard from for a while goes grey: their avatar, and their caret without its name flag.
    /// Heard again, they're back in their colour.
    @Test func someoneNotHeardFromGoesGrey() async throws {
        let (emil, sara, note, ids) = try await shared("Hello there\n")
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
        theirs.selectionChanged(NSRange(location: 3, length: 0))
        await server.eventually { mine.peers[ids.1]?.selection != nil }
        let peer = try #require(mine.peers[ids.1])
        #expect(!peer.isStale())
        let live = try #require(mine.remoteCarets(at: .now).first)
        #expect(live.color == CollabSession.color(for: ids.1) && live.showsName)

        let later = peer.heardAt.addingTimeInterval(CollabSession.Peer.staleAfter + 0.5)
        #expect(peer.isStale(at: later))
        let grey = try #require(mine.remoteCarets(at: later).first)
        #expect(grey.color == CollabSession.staleColor)
        #expect(!grey.showsName)

        theirs.selectionChanged(NSRange(location: 5, length: 0))
        await server.eventually { mine.peers[ids.1]?.selection == NSRange(location: 5, length: 0) }
        let again = try #require(mine.peers[ids.1])
        #expect(again.heardAt > peer.heardAt)
        #expect(!again.isStale())
    }
}

/// What the two-simulator run's script waits for (CollabScript's waitPresence, and its dump): the
/// people in the note as the avatars show them, by name, and grey once not heard from.
extension CollabTwoPeopleTests {
    @Test func theScriptReadsWhoIsInTheNoteAsTheAvatarsShowThem() async throws {
        let (emil, sara, note, ids) = try await shared("Offsite plan\n")
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)?.id ?? UUID()))
        theirs.selectionChanged(NSRange(location: 3, length: 0))
        await server.eventually { mine.peers[ids.1]?.selection != nil }
        let peer = try #require(mine.peers[ids.1])

        let now = CollabScript.here(mine, at: peer.heardAt)
        #expect(now.count == 1)
        #expect(now.first?["name"] as? String == "Sara" && now.first?["grey"] as? Bool == false)
        let later = CollabScript.here(mine, at: peer.heardAt.addingTimeInterval(CollabSession.Peer.staleAfter + 0.5))
        #expect(later.first?["name"] as? String == "Sara" && later.first?["grey"] as? Bool == true)
    }
}
