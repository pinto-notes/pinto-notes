import CryptoKit
import Foundation
import Supabase
import SwiftData
import Testing
import UniformTypeIdentifiers
@testable import Pane

extension NetworkFaults {
/// Shared notes in the library (Pane/Collab/SharedLibrary.swift): one note, one sync path; a
/// member's note of their own; edits kept offline and sent later; catching up after being away;
/// snapshots and compaction on the server and the device; leaving and being removed.
///
/// The collaboration server is `FakeCollabServer`; the notes server (for the pointer rows) is
/// StubSupabase, as the account `SealedAccount.user`.
@MainActor @Suite(.sealedAccount) struct SharedLibraryTests {
    let server = FakeCollabServer()
    let owner = UUID(uuidString: "0A000000-0000-4000-8000-0000000000E1")!
    let member = SealedAccount.user
    let nk = SymmetricKey(size: .bits256)
    /// Each account's data key, the same on each of its devices.
    let dataKeys: [UUID: SymmetricKey]

    init() {
        StubSupabase.reset()
        NetFault.config = .init()
        dataKeys = [owner: SymmetricKey(size: .bits256), member: SymmetricKey(size: .bits256)]
        CollabSession.snapshotEvery = 200
        CollabSession.snapshotQuiet = 5
        CollabSession.compactEvery = 200
        SharedNotes.pointerArrived = nil
    }

    struct Device {
        let container: ModelContainer
        let context: ModelContext
        let transport: FakeCollabTransport
        let library: SharedLibrary
    }

    func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    /// One of `user`'s devices. `container`: the same storage as an earlier device (the app opened again).
    func device(_ user: UUID, container given: ModelContainer? = nil) throws -> Device {
        let c = try given ?? container()
        let context = ModelContext(c)
        let transport = FakeCollabTransport(server: server, me: user)
        let key = dataKeys[user]!
        let nk = self.nk
        let library = SharedLibrary(context: context, transport: transport, name: user == owner ? "Emil" : "Sara",
                                    dataKey: { key }, openKey: { _ in nk })
        return Device(container: c, context: context, transport: transport, library: library)
    }

    func engine(for d: Device) -> SyncEngine {
        SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com", userID: member), context: d.context, defaults: MemoryDefaults())
    }

    /// The owner's note, shared.
    func shared(_ body: String, on d: Device) async throws -> (Note, CollabSession) {
        let note = d.context.createNote(in: .all, body: body)
        try await d.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let session = try await d.library.becomeShared(note, nk: nk)
        return (note, session)
    }

    func waitUntil(_ seconds: Double = 5, _ done: () -> Bool) async {
        let end = Date.now.addingTimeInterval(seconds)
        while !done(), Date.now < end { try? await Task.sleep(for: .milliseconds(20)) }
    }

    /// Typing at the end of a shared note.
    func type(_ s: String, in session: CollabSession) {
        session.local(session.text + s, selection: nil)
    }

    // MARK: The prototype's two bugs

    /// Accepting made a note with the owner's note id, but `notes.id` is unique across accounts:
    /// the member's sync would collide with the owner's row. The member's note has an id of its
    /// own, the same on each of their devices, and lands in "Shared with me".
    @Test func aMembersNoteHasAnIdOfItsOwn() async throws {
        let emil = try device(owner), sara = try device(member)
        let (note, _) = try await shared("Trip to Lisbon\nPastéis at 9", on: emil)
        server.add(member, to: note.id)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        #expect(mine.id != note.id)
        #expect(mine.id == SharedNotes.noteID(for: note.id, dataKey: dataKeys[member]!))
        // Keyed with Sara's data key: nobody else can work it out and take it first.
        #expect(mine.id != SharedNotes.noteID(for: note.id, dataKey: dataKeys[owner]!))
        #expect(mine.sharedNoteID == note.id)
        #expect(mine.body == "Trip to Lisbon\nPastéis at 9")
        #expect(mine.folder?.name == "Shared with me" && mine.folder?.id == SharedNotes.sharedWithMeID(dataKey: dataKeys[member]!))

        // Through the member's sync: a row with their own id, a pointer to the shared note.
        let engine = engine(for: sara)
        await engine.sync()
        #expect(!mine.dirty)
        #expect(StubSupabase.note(note.id) == nil, "nothing is written under the owner's note id")
        let row = try #require(StubSupabase.note(mine.id))
        #expect((row["shared_note_id"] as? String)?.lowercased() == note.id.uuidString.lowercased())
        #expect(StubSupabase.body(mine.id) == SharedNotes.placeholder(title: "Trip to Lisbon"))
        await engine.stop()
    }

    /// The document's text was mirrored into `note.body`, and the regular sync then pushed it as
    /// an ordinary note. Now the notes row only ever holds the placeholder: no text typed in a
    /// shared note reaches the notes path, before or after a push, and the pull that follows
    /// doesn't put the placeholder over the text here.
    @Test func syncNeverSendsASharedNotesText() async throws {
        let sara = try device(member)
        let engine = engine(for: sara)
        // Sara's own note, synced as usual, then shared by her.
        let note = sara.context.createNote(in: .all, body: "Budget\nRent 900")
        await engine.sync()
        #expect(StubSupabase.body(note.id) == "Budget\nRent 900")
        try await sara.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let session = try await sara.library.becomeShared(note, nk: nk)
        StubSupabase.resetLog()

        type("\nCanary-c0llab groceries 250", in: session)
        await waitUntil { note.body.contains("Canary-c0llab") }
        #expect(note.body == "Budget\nRent 900\nCanary-c0llab groceries 250", "the note mirrors the document for the list and search")
        note.dirty = true
        await engine.sync()
        await engine.sync()

        #expect(StubSupabase.body(note.id) == SharedNotes.placeholder(title: "Budget"))
        let row = try #require(StubSupabase.note(note.id))
        #expect((row["shared_note_id"] as? String)?.lowercased() == note.id.uuidString.lowercased())
        // Every note row the server holds, opened: none has the shared text.
        for r in StubSupabase.rows("notes") {
            let id = UUID(uuidString: r["id"] as! String)!
            #expect(!(StubSupabase.body(id) ?? "").contains("Canary-c0llab"))
            #expect(!(StubSupabase.body(id) ?? "").contains("Rent 900"), "the notes row stops holding the text once shared")
        }
        #expect(!StubSupabase.bodies.joined().contains("Canary-c0llab"))
        // The pull took the pointer back without putting the placeholder over the text.
        #expect(note.body.contains("Canary-c0llab"))
        // And the text went where it belongs: the shared document on the collaboration server.
        await waitUntil { !server.updates(of: note.id).isEmpty }
        #expect(!server.updates(of: note.id).isEmpty)
        await engine.stop()
    }

    /// Another of your devices gets the pointer by sync and asks for the document; the
    /// placeholder never shows as the note's text once the document is here.
    @Test func aPointerFromAnotherDeviceGetsItsDocument() async throws {
        let a = try device(member), b = try device(member)
        let ea = engine(for: a), eb = engine(for: b)
        let note = a.context.createNote(in: .all, body: "Plan\nStep one")
        try await a.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        _ = try await a.library.becomeShared(note, nk: nk)
        await ea.sync()

        b.library.install()
        await eb.sync()
        let there = try #require(b.context.note(note.id))
        #expect(there.isShared)
        await waitUntil { there.sharedDocument != nil }
        #expect(there.body == "Plan\nStep one")
        #expect(b.library.session(for: there)?.text == "Plan\nStep one")
        await ea.stop()
        await eb.stop()
    }

    /// Joined on another of your devices, whose pointer hasn't come by sync yet: the next look at
    /// your memberships brings the note here too, with the same id, without sending a pointer of
    /// its own (the other device's says where you put it).
    @Test func aNoteJoinedOnAnotherDeviceArrivesHere() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Recipes", on: emil)
        server.add(member, to: note.id)
        let phone = try device(member), mac = try device(member)
        let mine = try await phone.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        await mac.library.reconcile(try await mac.transport.memberships())
        let there = try #require(mac.context.note(mine.id))
        #expect(there.body == "Recipes" && there.sharedNoteID == note.id)
        #expect(!there.dirty)
        // Asked again, nothing is made twice.
        await mac.library.reconcile(try await mac.transport.memberships())
        #expect(try mac.context.fetchCount(FetchDescriptor<Note>(predicate: #Predicate { $0.sharedNoteID != nil })) == 1)
    }

    /// Shared on one device a moment after another of yours typed in it as an ordinary note:
    /// that typing isn't lost (a conflicted copy, as for any conflict) and the row ends up the
    /// pointer on both, so the two devices never keep editing the note down two paths.
    @Test func sharedJustAfterAnEditElsewhereKeepsTheEdit() async throws {
        let a = try device(member), b = try device(member)
        let ea = engine(for: a), eb = engine(for: b)
        let note = a.context.createNote(in: .all, body: "Packing\nPassport")
        await ea.sync()
        await eb.sync()
        let onB = try #require(b.context.note(note.id))
        onB.body = "Packing\nPassport\nCharger from B"
        onB.touch()
        await eb.sync()

        try await a.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        _ = try await a.library.becomeShared(note, nk: nk)
        await ea.sync()
        #expect(StubSupabase.body(note.id) == SharedNotes.placeholder(title: "Packing"))
        let copies = try a.context.fetch(FetchDescriptor<Note>()).filter { $0.body.contains("(conflicted copy)") }
        #expect(copies.map(\.body) == ["Packing (conflicted copy)\nPassport\nCharger from B"])

        await eb.sync()
        #expect(onB.isShared, "B takes the pointer")
        #expect(!(StubSupabase.body(note.id) ?? "").contains("Charger"))
        await ea.stop()
        await eb.stop()
    }

    /// The owner stopped sharing (collab_unshare, from their AI or another device): the server
    /// puts the merged text back in their row and drops the pointer. Their other devices take it
    /// as an ordinary note again and let go of the document; the members' pointers come back
    /// deleted and their documents go.
    @Test func whenTheOwnerStopsSharingTheNoteIsTheirsAgainAndGoesFromOthers() async throws {
        let a = try device(member), b = try device(member)
        let ea = engine(for: a), eb = engine(for: b)
        b.library.install()
        let note = a.context.createNote(in: .all, body: "Menu\nSoup")
        try await a.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        _ = try await a.library.becomeShared(note, nk: nk)
        await ea.sync()
        await eb.sync()
        let onB = try #require(b.context.note(note.id))
        await waitUntil { onB.sharedDocument != nil }
        #expect(onB.isShared && onB.sharedDocument != nil)

        // What collab_unshare leaves in the owner's row: the text, and no pointer.
        StubSupabase.update("notes", id: note.id) { row in
            row["body_ct"] = try! Wire.seal("Menu\nSoup\nBread", E2EE.body(note.id))
            row["shared_note_id"] = NSNull()
        }
        await eb.sync()
        #expect(!onB.isShared)
        #expect(onB.body == "Menu\nSoup\nBread")
        #expect(onB.sharedDocument == nil && b.library.sessions[onB.id] == nil)
        #expect(try b.context.fetchCount(FetchDescriptor<SharedDocument>()) == 0)
        await ea.stop()
        await eb.stop()
    }

    /// Sharing stopped on one device while another had a change to its pointer waiting (moved,
    /// pinned): that device doesn't push its pointer back over the unshared row; it takes the
    /// server's row and the note is ordinary there too.
    @Test func aWaitingPointerDoesntBringSharingBack() async throws {
        let a = try device(member), b = try device(member)
        let ea = engine(for: a), eb = engine(for: b)
        b.library.install()
        let note = a.context.createNote(in: .all, body: "Menu\nSoup")
        try await a.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        _ = try await a.library.becomeShared(note, nk: nk)
        await ea.sync()
        await eb.sync()
        let onB = try #require(b.context.note(note.id))
        await waitUntil { onB.sharedDocument != nil }
        onB.isPinned = true
        onB.touch()

        // collab_unshare from the other device.
        StubSupabase.update("notes", id: note.id) { row in
            row["body_ct"] = try! Wire.seal("Menu\nSoup\nBread", E2EE.body(note.id))
            row["shared_note_id"] = NSNull()
        }
        await eb.sync()
        #expect(!onB.isShared && onB.body == "Menu\nSoup\nBread")
        let row = try #require(StubSupabase.note(note.id))
        #expect(row["shared_note_id"] == nil || row["shared_note_id"] is NSNull)
        #expect(StubSupabase.body(note.id) == "Menu\nSoup\nBread")
        await ea.stop()
        await eb.stop()
    }

    /// Your own note whose shared note went while it wasn't open here (Start fresh, or sharing
    /// stopped elsewhere): it keeps the newest text this device stored, not the note's older copy.
    @Test func yourOwnNoteKeepsTheStoredTextWhenItsSharedNoteGoes() async throws {
        let emil = try device(owner)
        let (note, session) = try await shared("Garden", on: emil)
        type("\nTomatoes", in: session)
        await waitUntil { session.isSent }
        emil.library.closeAll()
        note.body = "Garden"
        server.members[note.id] = nil
        emil.library.removeLocally(note)
        #expect(!note.isShared && note.deletedAt == nil)
        #expect(note.body == "Garden\nTomatoes")
    }

    /// Your own note whose shared note is gone (nobody's in it anymore) stays yours, with its text.
    @Test func yourOwnNoteNeverLeavesYourLibrary() async throws {
        let emil = try device(owner)
        let (note, session) = try await shared("Garden", on: emil)
        type("\nTomatoes", in: session)
        await waitUntil { note.body == "Garden\nTomatoes" }
        server.members[note.id] = nil
        await emil.library.reconcile(try await emil.transport.memberships())
        #expect(note.deletedAt == nil && !note.isShared)
        #expect(note.body == "Garden\nTomatoes")
        #expect(note.sharedDocument == nil)
    }

    // MARK: Becoming shared

    /// Sharing keeps everything: the whole text with its links and files, the note's id (so its
    /// files, place and history stay), and the note list, search and links keep finding it.
    @Test func sharingANoteKeepsItsTextLinksAndFiles() async throws {
        let emil = try device(owner), sara = try device(member)
        let folder = emil.context.createFolder(named: "Travel")
        let file = try FileStore.importData(Data("tickets".utf8), filename: "tickets.pdf", type: .pdf)
        emil.context.insert(file)
        let body = "Trip\nSee [[Packing list]] and [[Budget#Food|food]]\n\(file.markdown)\n- [ ] Book train"
        let note = emil.context.createNote(in: .folder(folder.id), body: body)
        let id = note.id
        try await emil.transport.share(note: id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let session = try await emil.library.becomeShared(note, nk: nk)
        #expect(note.id == id && note.folder?.id == folder.id)
        #expect(session.text == body && note.body == body)
        #expect(note.sharedNoteID == id)
        // The first snapshot carries the whole text to everyone.
        #expect(server.snapshots(of: id).count == 1)

        server.add(member, to: id)
        let mine = try await sara.library.adopt(shared: id, nk: nk, epoch: 1, role: "editor")
        #expect(mine.body == body)
        #expect(WikiLinks.links(in: mine.body).map(\.name) == ["Packing list", "Budget"])
        // Search (the note list's predicate) and links by title find the member's copy.
        let found = try sara.context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.body.localizedStandardContains("Book train") }))
        #expect(found.map(\.id) == [mine.id])
        WikiDirectory.invalidate()
        #expect(WikiDirectory.index(sara.context).resolve("Trip") == mine.id)
        WikiDirectory.invalidate()
        try? FileManager.default.removeItem(at: FileStore.url(for: file.id, filename: file.filename).deletingLastPathComponent())
    }

    // MARK: Offline

    /// Typed with no network, then the app closed: the edits are kept on the device and go up
    /// when it's back, and the owner sees them.
    @Test func editsMadeOfflineAreKeptAndSentLater() async throws {
        let emil = try device(owner)
        let (note, emilSession) = try await shared("Shopping", on: emil)
        server.add(member, to: note.id)
        var sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let session = try #require(sara.library.session(for: mine))

        sara.transport.offline = true
        type("\n- Milk", in: session)
        type("\n- Bread", in: session)
        await waitUntil(1) { false }
        #expect(server.updates(of: note.id).allSatisfy { $0.author_id != member })
        #expect(!session.isSent)
        #expect(!mine.sharedDocument!.pending.isEmpty)
        try sara.context.save()

        // The app quits and opens again, still offline: the edits are there.
        sara.library.closeAll()
        sara = try device(member, container: sara.container)
        sara.transport.offline = true
        let again = try #require(sara.context.note(mine.id))
        let reopened = try #require(sara.library.session(for: again))
        #expect(reopened.text == "Shopping\n- Milk\n- Bread")
        #expect(!reopened.isSent)

        // Back online.
        sara.transport.offline = false
        reopened.flush()
        await waitUntil { reopened.isSent }
        #expect(reopened.isSent)
        #expect(again.sharedDocument!.pending.isEmpty)
        await waitUntil { emilSession.text == "Shopping\n- Milk\n- Bread" }
        #expect(emilSession.text == "Shopping\n- Milk\n- Bread")
        await waitUntil { note.body == "Shopping\n- Milk\n- Bread" }
        #expect(note.body == "Shopping\n- Milk\n- Bread")
    }

    /// Typing offline while someone else types online: both edits are kept and merge.
    @Test func offlineEditsMergeWithOthersEdits() async throws {
        let emil = try device(owner)
        let (note, emilSession) = try await shared("A\nB", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let session = try #require(sara.library.session(for: mine))
        sara.transport.offline = true
        session.local("A sara\nB", selection: nil)
        emilSession.local("A\nB emil", selection: nil)
        sara.transport.offline = false
        session.flush()
        session.catchUp()
        await waitUntil { session.text == "A sara\nB emil" && emilSession.text == "A sara\nB emil" }
        #expect(session.text == "A sara\nB emil")
        #expect(emilSession.text == "A sara\nB emil")
    }

    // MARK: Catching up

    /// Away while others typed: opening the note again takes in what came after this device's
    /// cursor, with nothing missed and nothing taken twice.
    @Test func catchesUpByCursorAfterBeingAway() async throws {
        let emil = try device(owner)
        let (note, emilSession) = try await shared("Notes", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let cursorBefore = mine.sharedDocument!.cursor
        sara.library.closeAll()

        for line in ["\none", "\ntwo", "\nthree"] { type(line, in: emilSession) }
        // Typed while one is in flight, the rest go up together.
        await waitUntil { emilSession.isSent }
        #expect(server.updates(of: note.id).count == 2)
        #expect(mine.body == "Notes", "nothing arrives while the note is closed")

        let session = try #require(sara.library.session(for: mine))
        await session.catchUp().value
        #expect(session.text == "Notes\none\ntwo\nthree")
        #expect(mine.sharedDocument!.cursor == server.updates(of: note.id).map(\.id).max())
        #expect(server.snapshots(of: note.id).count == 1, "no snapshot that wasn't due")
        #expect(mine.sharedDocument!.cursor > cursorBefore)
        await waitUntil { mine.body == "Notes\none\ntwo\nthree" }
        #expect(mine.body == "Notes\none\ntwo\nthree")
    }

    /// A change whose id was handed out before one already read, but stored a moment later, is
    /// still caught: catching up asks again a little before the cursor.
    @Test func aChangeStoredLateIsStillCaughtUp() async throws {
        let emil = try device(owner)
        let (note, emilSession) = try await shared("x", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        sara.library.closeAll()

        type("1", in: emilSession)
        type("2", in: emilSession)
        await waitUntil { server.updates(of: note.id).count == 2 }
        let first = server.updates(of: note.id)[0].id
        server.inFlight = [first]
        let session = try #require(sara.library.session(for: mine))
        await session.catchUp().value
        #expect(mine.sharedDocument!.cursor > first)
        server.inFlight = []
        await session.catchUp().value
        #expect(session.text == "x12")
    }

    // MARK: Snapshots and compaction

    /// After enough changes, a device seals a snapshot; the server drops the changes it covers,
    /// and a device starting out reads the snapshot and what came after.
    @Test func snapshotsCompactTheServerAndNewDevicesStartFromThem() async throws {
        CollabSession.snapshotEvery = 4
        CollabSession.snapshotQuiet = 0.05
        let emil = try device(owner)
        let (note, emilSession) = try await shared("Log", on: emil)
        for i in 1...5 {
            type("\n\(i)", in: emilSession)
            await waitUntil { emilSession.isSent }
        }
        await waitUntil { server.snapshots(of: note.id).count >= 2 }
        let snaps = server.snapshots(of: note.id)
        #expect(snaps.count >= 2, "the first when shared, then one after enough changes")
        let upto = snaps.map(\.upto).max()!
        #expect(upto > 0)
        #expect(server.updates(of: note.id).allSatisfy { $0.id > upto }, "the server dropped the changes the snapshot covers")
        type("\nlast", in: emilSession)
        await waitUntil { server.updates(of: note.id).contains { $0.id > upto } }

        server.add(member, to: note.id)
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        #expect(mine.body == "Log\n1\n2\n3\n4\n5\nlast")
    }

    /// Catching up after a snapshot asks from after it: the snapshot (megabytes, for a long note)
    /// isn't sent again every 20 seconds.
    @Test func catchingUpDoesntFetchTheSameSnapshotAgain() async throws {
        CollabSession.snapshotEvery = 3
        CollabSession.snapshotQuiet = 0.05
        let emil = try device(owner)
        let (note, session) = try await shared("Notes", on: emil)
        for i in 1...4 {
            type("\n\(i)", in: session)
            await waitUntil { session.isSent }
        }
        await waitUntil { server.snapshots(of: note.id).count >= 2 }
        await session.catchUp().value
        let sent = server.snapshotsSent
        for _ in 0..<3 { await session.catchUp().value }
        #expect(server.snapshotsSent == sent)
        #expect(note.sharedDocument!.snapshotUpto == server.snapshots(of: note.id).map(\.upto).max())

        // Someone else's device that's already past the snapshot when it learns of it.
        server.add(member, to: note.id)
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let theirs = try #require(sara.library.session(for: mine))
        mine.sharedDocument!.snapshotUpto = 0
        await theirs.catchUp().value
        let before = server.snapshotsSent
        for _ in 0..<3 { await theirs.catchUp().value }
        #expect(server.snapshotsSent == before)
    }

    /// On the device: changes pile up in the stored tail, and once there are many the document is
    /// saved whole again and the tail starts over. It opens the same either way.
    @Test func theDeviceCompactsItsStoredDocument() async throws {
        CollabSession.compactEvery = 3
        let emil = try device(owner)
        let (note, session) = try await shared("Diary", on: emil)
        let record = try #require(note.sharedDocument)
        type("\nMon", in: session)
        type("\nTue", in: session)
        #expect(record.tailChanges == 2 && !record.tail.isEmpty)
        type("\nWed", in: session)
        #expect(record.tailChanges == 0 && record.tail.isEmpty, "saved whole again")
        type("\nThu", in: session)
        #expect(record.tailChanges == 1)
        try emil.context.save()

        emil.library.closeAll()
        let again = try device(owner, container: emil.container)
        let stored = try #require(again.context.note(note.id))
        let reopened = try #require(again.library.session(for: stored))
        #expect(reopened.text == "Diary\nMon\nTue\nWed\nThu")
    }

    // MARK: Looking at memberships

    /// An account that shares nothing: the library is gone through once, not on every look at the
    /// memberships (every half minute, on the main thread, over every note). A note shared later,
    /// or one joined, is looked at again.
    @Test func anAccountThatSharesNothingIsNotScannedOnEveryLook() async throws {
        let emil = try device(owner)
        emil.context.insert(Note(body: "Groceries"))
        await emil.library.reconcile([])
        await emil.library.reconcile([])
        await emil.library.reconcile(try await emil.transport.memberships())
        #expect(emil.library.libraryScans == 1)

        _ = try await shared("Trip plan", on: emil)
        await emil.library.reconcile(try await emil.transport.memberships())
        #expect(emil.library.libraryScans == 2)
        // Shared notes here: an empty list is checked, never taken as nothing shared.
        await emil.library.reconcile([])
        await emil.library.reconcile([])
        #expect(emil.library.libraryScans == 4)
    }

    // MARK: Leaving and being removed

    /// Removed by the owner: the note goes from the member's library (Apple Notes does the same),
    /// with its document; its pointer is deleted, so the member's other devices drop it too.
    @Test func beingRemovedTakesTheNoteOutOfYourLibrary() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Secret plan", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")

        // A list that comes back without the note doesn't remove it while the note says otherwise.
        await sara.library.reconcile([])
        #expect(mine.deletedAt == nil)

        server.remove(member, from: note.id)
        await sara.library.reconcile(try await sara.transport.memberships())
        #expect(mine.deletedAt != nil && mine.body.isEmpty)
        #expect(mine.sharedDocument == nil)
        #expect(try sara.context.fetchCount(FetchDescriptor<SharedDocument>()) == 0)
        #expect(mine.dirty, "the deletion goes to the member's other devices")
        #expect(sara.library.sessions.isEmpty)
    }

    /// Leaving: the same, from your side.
    @Test func leavingTakesTheNoteOutOfYourLibrary() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Book club", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        try await sara.library.leave(mine)
        #expect(server.role(note.id, member) == nil)
        #expect(mine.deletedAt != nil && mine.sharedDocument == nil)
        // The owner can't leave their own note.
        await #expect(throws: Collab.Failure.notOwner) { try await emil.library.leave(note) }
    }

    /// Deleting someone else's shared note leaves it, as in Apple Notes: it goes from your library
    /// (no Recently Deleted). Offline, it waits in Recently Deleted and the next look at your
    /// memberships leaves it. One you joined again since isn't left.
    @Test func deletingSomeoneElsesSharedNoteLeavesIt() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Reading list", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        sara.library.install()
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        sara.context.trash(mine)
        await waitUntil { mine.deletedAt != nil }
        #expect(server.role(note.id, member) == nil)
        #expect(mine.deletedAt != nil && mine.sharedDocument == nil)

        // Offline: it waits, then leaves once the server answers.
        server.add(member, to: note.id)
        let again = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        #expect(again.id == mine.id && again.deletedAt == nil)
        sara.transport.offline = true
        sara.context.trash(again)
        await waitUntil(1) { false }
        #expect(server.role(note.id, member) != nil && again.trashedAt != nil)
        sara.transport.offline = false
        await sara.library.reconcile(try await sara.transport.memberships())
        #expect(server.role(note.id, member) == nil)
        #expect(again.deletedAt != nil)

        // Joined again later: the old deletion doesn't make you leave.
        server.add(member, to: note.id)
        _ = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        await sara.library.reconcile(try await sara.transport.memberships())
        #expect(server.role(note.id, member) != nil)
        #expect(mine.deletedAt == nil)
    }

    /// The owner deleting their shared note (Apple Notes): sharing stops for everyone through
    /// collab_unshare, with the merged text sent back for their own row; the note is in their
    /// Recently Deleted with that text, an ordinary note, and restoring it brings it back unshared.
    /// Its pointer never goes up over the unshared row.
    @Test func theOwnerDeletingASharedNoteStopsSharingForEveryone() async throws {
        let emil = try device(owner)
        let (note, session) = try await shared("Party plan", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let theirs = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let saraSession = try #require(sara.library.session(for: theirs))
        type("\nCake", in: saraSession)
        await waitUntil { session.text == "Party plan\nCake" }

        emil.library.install()
        emil.context.trash(note)
        await waitUntil { !note.isShared }
        #expect(!note.isShared && note.trashedAt != nil && note.deletedAt == nil)
        #expect(note.body == "Party plan\nCake", "Recently Deleted holds the merged text")
        #expect(note.sharedDocument == nil && emil.library.sessions[note.id] == nil)
        let sent = try #require(emil.transport.unshared[note.id])
        #expect(Wire.sealer?.open(sent, context: E2EE.body(note.id)) == "Party plan\nCake")
        #expect(server.members[note.id] == nil, "nobody is in it anymore")
        // The members' pointers are deleted by the server; theirs goes when it comes by sync,
        // or at the next look at memberships.
        await sara.library.reconcile(try await sara.transport.memberships())
        #expect(theirs.deletedAt != nil)

        emil.context.restore(note)
        #expect(note.trashedAt == nil && !note.isShared && note.body == "Party plan\nCake")
    }

    /// While sharing is being stopped, sync doesn't push the note's pointer: it would put the
    /// pointer back over the row collab_unshare just wrote. Once done, it goes up as an ordinary note.
    @Test func syncHoldsANoteWhileItsSharingStops() async throws {
        let sara = try device(member)
        let engine = engine(for: sara)
        let note = sara.context.createNote(in: .all, body: "Plans")
        try await sara.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        _ = try await sara.library.becomeShared(note, nk: nk)
        await engine.sync()
        let version = StubSupabase.note(note.id)?["version"] as? Int
        SharedNotes.unsharing.insert(note.id)
        note.isPinned = true
        note.touch()
        await engine.sync()
        #expect(StubSupabase.note(note.id)?["version"] as? Int == version)
        #expect(note.dirty)
        SharedNotes.unsharing.remove(note.id)
        await engine.sync()
        #expect(!note.dirty)
        await engine.stop()
    }

    /// Offline, the owner's delete waits in Recently Deleted, still shared, and stops sharing once
    /// the server answers.
    @Test func theOwnersDeleteOfflineStopsSharingLater() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Budget", on: emil)
        emil.library.install()
        emil.transport.offline = true
        emil.context.trash(note)
        await waitUntil(1) { false }
        #expect(note.isShared && note.trashedAt != nil)
        emil.transport.offline = false
        await emil.library.reconcile(try await emil.transport.memberships())
        #expect(!note.isShared && note.body == "Budget")
        #expect(emil.transport.unshared[note.id] != nil)
    }

    /// The owner deletes offline with the note not open here, while a member keeps typing: once
    /// back online, what's written back as the owner's note is the whole document, the member's
    /// latest edits included, never the note's older copy.
    @Test func theOwnersDeleteWithNoSessionKeepsEveryNewerEdit() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Trip", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let theirs = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let saraSession = try #require(sara.library.session(for: theirs))
        emil.library.closeAll()
        type("\nTickets booked", in: saraSession)
        await waitUntil { saraSession.isSent }
        #expect(note.body == "Trip", "the owner's copy is behind")

        emil.library.install()
        emil.transport.offline = true
        emil.context.trash(note)
        await waitUntil(1) { false }
        #expect(note.isShared, "not stopped without the newest text")
        emil.transport.offline = false
        await emil.library.reconcile(try await emil.transport.memberships())
        #expect(!note.isShared && note.body == "Trip\nTickets booked")
        let sent = try #require(emil.transport.unshared[note.id])
        #expect(Wire.sealer?.open(sent, context: E2EE.body(note.id)) == "Trip\nTickets booked")
    }

    /// A shared note deleted with its folder stops being shared and keeps every edit that
    /// reached it. (Sub-notes are gone since release 1.3, so a parent no longer takes a note with it.)
    @Test func aSharedNoteDeletedWithItsFolderKeepsEveryEdit() async throws {
        let emil = try device(owner)
        emil.library.install()
        let folder = emil.context.createFolder(named: "Work")
        let (inFolder, _) = try await shared("Agenda", on: emil)
        inFolder.folder = folder
        server.add(member, to: inFolder.id)
        let sara = try device(member)
        let theirs = try await sara.library.adopt(shared: inFolder.id, nk: nk, epoch: 1, role: "editor")
        let s = try #require(sara.library.session(for: theirs))
        type("\nBudget", in: s)
        await waitUntil { s.isSent }
        emil.library.closeAll()
        emil.library.install()

        emil.context.trash(folder)
        await waitUntil { !inFolder.isShared }
        #expect(inFolder.trashedAt != nil && inFolder.body == "Agenda\nBudget")
    }

    /// The server refuses text that's behind the document (collab_unshare's `upto`).
    @Test func stoppingSharingWithOldTextIsRefused() async throws {
        let emil = try device(owner)
        let (note, session) = try await shared("Notes", on: emil)
        type("\nmore", in: session)
        await waitUntil { session.isSent }
        await #expect(throws: (any Error).self) { try await emil.transport.unshare(note: note.id, body: "", head: "", upto: 0) }
        #expect(server.role(note.id, owner) == "owner")
    }

    /// A new key after someone else was removed: what's waiting is sealed with it and goes up.
    @Test func aNewKeyIsTakenAndWaitingEditsGoWithIt() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Team", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let session = try #require(sara.library.session(for: mine))
        server.add(UUID(), to: note.id)
        server.remove(server.members[note.id]!.keys.first { $0 != owner && $0 != member }!, from: note.id)
        type(" ok", in: session)
        await waitUntil { session.epoch == 2 && session.isSent }
        #expect(session.epoch == 2)
        #expect(server.updates(of: note.id).last?.epoch == 2)
    }

    /// Can view: typing isn't taken, and nothing is sent.
    @Test func aViewerSendsNothing() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Menu", on: emil)
        server.add(member, to: note.id, role: "viewer")
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "viewer")
        let session = try #require(sara.library.session(for: mine))
        type(" and more", in: session)
        #expect(session.text == "Menu")
        #expect(server.updates(of: note.id).isEmpty)
    }
}
}

/// What the library says when you lose a shared note, for a test to read.
@MainActor final class SaidRemovals {
    var all: [SharedRemoval] = []
}

/// Persona council round 7, bugs 16 to 19: an AI's change to a shared note, losing access to one
/// (said once, with your text to keep), and a shared note that couldn't sync.
extension NetworkFaults.SharedLibraryTests {
    // MARK: Bug 16: an AI's change, marked for everyone

    /// Emil's note shared with Sara and open on her phone; Sara's AI (the MCP server writing as
    /// her, from another session on her account) adds a line.
    private func saraAIAddsALine() async throws -> (emil: Device, note: Note, emilSession: CollabSession, phone: Device, mine: Note, onPhone: CollabSession) {
        server.names = [owner: "Emil Wagman", member: "Sara Lind"]
        let emil = try device(owner)
        let (note, emilSession) = try await shared("Offsite plan\n- Venue", on: emil)
        server.add(member, to: note.id)
        await emilSession.refreshMembers()
        let phone = try device(member), ai = try device(member)
        let mine = try await phone.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let onPhone = try #require(phone.library.session(for: mine))
        let viaAI = try await ai.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let aiSession = try #require(ai.library.session(for: viaAI))

        server.aiWriting[member] = "Claude"
        type("\n- Budget", in: aiSession)
        await waitUntil { aiSession.isSent }
        server.aiWriting[member] = nil
        return (emil, note, emilSession, phone, mine, onPhone)
    }

    /// It came in as typing: no tint, no margin marks, no receipt. It's marked as an AI's edit of
    /// a note of your own is, on every device in the note. Someone else's AI is named with them.
    @Test func anAIsChangeToASharedNoteIsMarkedForEveryone() async throws {
        let (_, note, _, _, mine, _) = try await saraAIAddsALine()

        // Emil's note: Sara's AI changed it.
        await waitUntil { note.aiEditedAt != nil }
        #expect(note.body == "Offsite plan\n- Venue\n- Budget")
        #expect(note.aiEditor == "Claude" && note.aiEditorPerson == "Sara")
        #expect(AIEdit.isUnseen(note))
        #expect(AIEdit.listLine(note, by: "Claude") == "Edited by Sara's Claude")
        let receipt = try #require(AIEdit.markSeen(note))
        #expect(receipt.previous == "Offsite plan\n- Venue", "the tint and the margin marks start from here")
        #expect(receipt.summary == "Sara's Claude changed 1 line")
        #expect(receipt.by == "Claude", "the mark is the AI's own")
        #expect(receipt.undoLabel == "Undo Sara's Claude's changes")
        #expect(AIReview(receipt)?.title == "Sara's Claude changed 1 line")

        // Sara's phone: her own AI, named as in a note of her own.
        await waitUntil { mine.aiEditedAt != nil }
        #expect(mine.aiEditor == "Claude" && mine.aiEditorPerson == nil)
        #expect(try #require(AIEdit.markSeen(mine)).summary == "Claude changed 1 line")
    }

    /// Undo on that receipt takes the AI's change out of the document, as your edit, for everyone.
    /// It wrote `note.body` alone, which never reached the others and the next change put back.
    @Test func undoingAnAIsChangeToASharedNoteReachesEveryone() async throws {
        let (emil, note, emilSession, _, _, onPhone) = try await saraAIAddsALine()
        await waitUntil { note.aiEditedAt != nil }
        let receipt = try #require(AIEdit.markSeen(note))
        try await AIEdit.undo(receipt, on: note, library: emil.library)
        #expect(emilSession.text == "Offsite plan\n- Venue")
        #expect(note.body == "Offsite plan\n- Venue")
        await waitUntil { onPhone.text == "Offsite plan\n- Venue" }
        #expect(onPhone.text == "Offsite plan\n- Venue")
        // Typing after it keeps it undone.
        type("\n- Dates", in: emilSession)
        await waitUntil { onPhone.text.hasSuffix("- Dates") }
        #expect(onPhone.text == "Offsite plan\n- Venue\n- Dates")
    }

    /// A shared note's pointer row carries the AI stamps of the note it was before it was shared.
    /// Sync took them over the change's own, and dropped whose AI it was.
    @Test func aPointerRowLeavesASharedNotesAIMarkAlone() async throws {
        let a = try device(member), b = try device(member)
        let ea = engine(for: a), eb = engine(for: b)
        let note = a.context.createNote(in: .all, body: "Plan\nStep one")
        try await a.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        _ = try await a.library.becomeShared(note, nk: nk)
        await ea.sync()
        b.library.install()
        await eb.sync()
        let there = try #require(b.context.note(note.id))
        let at = Date.now
        AIEdit.arrived(there, ai: "Claude", person: "Emil", previousBody: "Plan", at: at)
        StubSupabase.update("notes", id: note.id) { row in
            row["ai_editor"] = "ChatGPT"
            row["ai_edited_at"] = StubSupabase.stamp(at.addingTimeInterval(60))
            row["is_pinned"] = true
        }
        await eb.sync()
        #expect(there.isPinned, "the row was taken")
        #expect(there.aiEditor == "Claude" && there.aiEditorPerson == "Emil")
        #expect(there.aiEditedAt == at)
        await ea.stop()
        await eb.stop()
    }

    /// Ticks an item, as the checkbox does.
    private func tick(_ item: String, in session: CollabSession) {
        session.local(session.text.replacingOccurrences(of: "- [ ] \(item)", with: "- [x] \(item)"), selection: nil)
    }

    /// The two-phone run on the local server (round 7, c11): Sara's AI edits the note through the
    /// MCP function, so its change reaches her own phone with her own user id on it, and only by
    /// catching up (Realtime relayed nothing there), after she typed and ticked offline. Her phone
    /// marks it as her AI's edit, "Claude changed 1 line", as Emil's marks it "Sara's Claude".
    @Test func yourAIsChangeIsMarkedOnYourOwnPhone() async throws {
        server.names = [owner: "Emil Wagman", member: "Sara Lind"]
        let emil = try device(owner)
        let (note, emilSession) = try await shared("Offsite plan\n\n- [ ] Book the venue\n- [ ] Pick dates\n- [ ] Order lunch\n- [ ] Print agenda", on: emil)
        server.add(member, to: note.id)
        await emilSession.refreshMembers()
        let phone = try device(member)
        let mine = try await phone.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let onPhone = try #require(phone.library.session(for: mine))
        emil.transport.deaf = true
        phone.transport.deaf = true

        // Both tick at once, and each catches up.
        tick("Book the venue", in: emilSession)
        tick("Order lunch", in: onPhone)
        await waitUntil { emilSession.isSent && onPhone.isSent }
        await onPhone.catchUp().value
        await emilSession.catchUp().value
        #expect(onPhone.text == emilSession.text)

        // Offline, she adds an item a key at a time and ticks it. Back online, it goes up.
        phone.transport.offline = true
        for key in "\n- [ ] Book the train" { type(String(key), in: onPhone) }
        tick("Book the train", in: onPhone)
        phone.transport.offline = false
        onPhone.flush()
        await waitUntil { onPhone.isSent }
        await emilSession.catchUp().value
        #expect(emilSession.text == onPhone.text)
        #expect(mine.aiEditedAt == nil)

        // Her AI edits it through the server, as her.
        let change = try server.aiEdits(note.id, as: member, ai: "Claude", nk: nk) {
            $0.replacingOccurrences(of: "- [ ] Pick dates", with: "- [x] Pick dates: 3-4 November")
        }
        #expect(change.author_id == member && change.client == "Claude")
        let before = onPhone.text
        await onPhone.catchUp().value
        #expect(onPhone.text.contains("- [x] Pick dates: 3-4 November"))
        await waitUntil { mine.aiEditedAt != nil }
        #expect(mine.aiEditor == "Claude" && mine.aiEditorPerson == nil, "her own AI, named as in a note of her own")
        let receipt = try #require(AIEdit.markSeen(mine))
        #expect(receipt.summary == "Claude changed 1 line")
        #expect(receipt.previous == before)

        await emilSession.catchUp().value
        await waitUntil { note.aiEditedAt != nil }
        #expect(note.aiEditor == "Claude" && note.aiEditorPerson == "Sara")
    }

    /// Sara's phone missed a change of Emil's (its relay was lost), and her AI's change, made after
    /// it, reached the phone first: Automerge holds it back until Emil's arrives with the next catch-up,
    /// and then it lands as a side effect of Emil's, which no AI wrote. It was never marked. It's
    /// marked when it lands, with its own line only: Emil's was in the text it started from.
    @Test func yourAIsChangeHeldBackIsMarkedWhenItLands() async throws {
        let emil = try device(owner)
        let (note, emilSession) = try await shared("Offsite plan\n- Venue", on: emil)
        server.add(member, to: note.id)
        let phone = try device(member)
        let mine = try await phone.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let onPhone = try #require(phone.library.session(for: mine))

        phone.transport.deaf = true
        type("\n- Dates", in: emilSession)
        await waitUntil { emilSession.isSent }
        phone.transport.deaf = false
        try server.aiEdits(note.id, as: member, ai: "Claude", nk: nk) { $0 + "\n- Budget" }
        await waitUntil { emilSession.text.hasSuffix("- Budget") }
        await waitUntil(0.5) { false }
        #expect(onPhone.text == "Offsite plan\n- Venue", "held back: it builds on Emil's line, which hasn't come")
        #expect(mine.aiEditedAt == nil)

        await onPhone.catchUp().value
        #expect(onPhone.text == "Offsite plan\n- Venue\n- Dates\n- Budget")
        await waitUntil { mine.aiEditedAt != nil }
        #expect(mine.aiEditor == "Claude" && mine.aiEditorPerson == nil)
        let receipt = try #require(AIEdit.markSeen(mine))
        #expect(receipt.previous == "Offsite plan\n- Venue\n- Dates", "only its own line is the AI's")
        #expect(receipt.summary == "Claude changed 1 line")
        // Undo takes out its line and leaves Emil's.
        try await AIEdit.undo(receipt, on: mine, library: phone.library)
        #expect(onPhone.text == "Offsite plan\n- Venue\n- Dates")
    }

    /// Joining by link, as ShareModel.join does: the note `adopt` makes is kept by its id only (the
    /// join opens it by id), so nothing keeps the object `adopt` returned; then it's found by its id,
    /// as the editor finds it.
    func joinByLink(_ note: UUID, on d: Device) async throws -> Note {
        var id: UUID?
        do {
            let adopted = try await d.library.adopt(shared: note, nk: nk, epoch: 1, role: "editor")
            id = adopted.id
        }
        return try #require(id.flatMap { d.context.note($0) })
    }

    /// The two-phone run on the local server (round 7, c11 -v3). Sara joined by link: the join
    /// opens the note `adopt` made by its id (NoteOpener), and nothing keeps the object `adopt`
    /// returned, so SwiftData lets it go. Her AI's change came by catch-up (her phone got no
    /// relays), tagged Claude and with her own user id, and went in: the text showed it, unmarked.
    /// The session's hooks held that first object weakly, gone by then; now they find the note
    /// by its id, as the editor does.
    @Test func yourAIsChangeIsMarkedInANoteYouJoinedByLink() async throws {
        server.names = [owner: "Emil Wagman", member: "Sara Lind"]
        let emil = try device(owner)
        let (note, emilSession) = try await shared("Offsite plan\n\n- [ ] Book the venue\n- [ ] Pick dates\n- [ ] Order lunch\n- [ ] Print agenda", on: emil)
        server.add(member, to: note.id)
        await emilSession.refreshMembers()
        let phone = try device(member)
        phone.transport.deaf = true
        let mine = try await joinByLink(note.id, on: phone)
        let onPhone = try #require(phone.library.session(for: mine))

        // She ticks, then adds an item and ticks it offline. Back online, it goes up.
        tick("Order lunch", in: onPhone)
        phone.transport.offline = true
        for key in "\n- [ ] Book the train" { type(String(key), in: onPhone) }
        tick("Book the train", in: onPhone)
        phone.transport.offline = false
        onPhone.flush()
        await waitUntil { onPhone.isSent }
        await emilSession.catchUp().value
        #expect(emilSession.text == onPhone.text)
        // The note's own copy of the text follows (the list's preview, search).
        await waitUntil { mine.body == onPhone.text }
        #expect(mine.body == onPhone.text)

        // Her AI edits it through the server, as her, and her phone catches up.
        try server.aiEdits(note.id, as: member, ai: "Claude", nk: nk) {
            $0.replacingOccurrences(of: "- [ ] Pick dates", with: "- [x] Pick dates: 3-4 November")
        }
        let before = onPhone.text
        await onPhone.catchUp().value
        #expect(onPhone.text.contains("- [x] Pick dates: 3-4 November"))
        await waitUntil { mine.aiEditedAt != nil }
        #expect(mine.aiEditor == "Claude" && mine.aiEditorPerson == nil, "her own AI, named as in a note of her own")
        #expect(mine.body == onPhone.text)
        let receipt = try #require(AIEdit.markSeen(mine))
        #expect(receipt.summary == "Claude changed 1 line")
        #expect(receipt.previous == before)
    }

    /// Removed from a note you joined by link, with a change of yours on its way: the server
    /// refuses the change, and the note goes from your phone then. The hook that does it finds the
    /// note by its id now, as the AI's does (above).
    @Test func aNoteYouJoinedByLinkGoesWhenTheServerRefusesYou() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Offsite plan\n- Venue", on: emil)
        server.add(member, to: note.id)
        let phone = try device(member)
        let mine = try await joinByLink(note.id, on: phone)
        let onPhone = try #require(phone.library.session(for: mine))

        server.remove(member, from: note.id)
        type("\n- Name badges", in: onPhone)
        await waitUntil { mine.deletedAt != nil }
        #expect(mine.deletedAt != nil)
        #expect(phone.library.session(for: mine) == nil)
    }

    // MARK: Bug 18: not synced yet

    /// Offline, a shared note looked synced. Changes that wait with nothing going up say "Not
    /// synced yet" after a few seconds; once they're up the line goes again.
    @Test func aSharedNoteSaysWhenItsChangesHaventSynced() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Shopping", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let session = try #require(sara.library.session(for: mine))
        #expect(session.waitingSince == nil && SharedSyncLine.at(.now, session: session) == nil)

        sara.transport.offline = true
        type("\n- Milk", in: session)
        let since = try #require(session.waitingSince)
        #expect(SharedSyncLine.at(since.addingTimeInterval(1), session: session) == nil, "a moment's wait says nothing")
        #expect(SharedSyncLine.at(since.addingTimeInterval(SharedSyncLine.after), session: session) == .notSynced)
        #expect(SharedSyncLine.notSynced.text == "Not synced yet")
        // More typing offline doesn't start the wait again.
        await waitUntil(0.2) { false }
        type("\n- Bread", in: session)
        #expect(session.waitingSince == since)

        sara.transport.offline = false
        session.flush()
        await waitUntil { session.isSent }
        #expect(session.isSent && session.waitingSince == nil)
        let sent = try #require(session.sentAt)
        #expect(session.lastWait >= 0.2)
        // A wait this short was never said, so "Synced" isn't either.
        #expect(SharedSyncLine.at(sent, session: session) == nil)
    }

    /// Typing while online never counts as waiting: each change that goes up starts the wait again.
    @Test func typingOnlineNeverSaysNotSynced() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Shopping", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let session = try #require(sara.library.session(for: mine))
        for item in ["\n- Milk", "\n- Bread", "\n- Eggs"] { type(item, in: session) }
        await waitUntil { session.isSent }
        #expect(session.isSent && session.waitingSince == nil)
        #expect(session.lastWait < SharedSyncLine.after)
        #expect(SharedSyncLine.at(.now, session: session) == nil)
    }

    /// When the line says what: "Not synced yet" after 3 seconds with nothing going up, "Synced"
    /// for 2 seconds after a wait that was said, nothing otherwise.
    @Test func theSyncLinesTimes() {
        let t = Date(timeIntervalSinceReferenceDate: 0)
        #expect(SharedSyncLine.at(t, waitingSince: nil, sentAt: nil, lastWait: 0) == nil)
        #expect(SharedSyncLine.at(t + 2.9, waitingSince: t, sentAt: nil, lastWait: 0) == nil)
        #expect(SharedSyncLine.at(t + 3, waitingSince: t, sentAt: nil, lastWait: 0) == .notSynced)
        #expect(SharedSyncLine.at(t + 16, waitingSince: t, sentAt: t - 60, lastWait: 20) == .notSynced)
        #expect(SharedSyncLine.at(t + 1, waitingSince: nil, sentAt: t, lastWait: 16) == .synced)
        #expect(SharedSyncLine.synced.text == "Synced")
        #expect(SharedSyncLine.at(t + 2, waitingSince: nil, sentAt: t, lastWait: 16) == nil)
        #expect(SharedSyncLine.at(t + 1, waitingSince: nil, sentAt: t, lastWait: 0.4) == nil, "no Synced after a wait nobody saw")
    }

    // MARK: Bugs 17 and 19: losing access

    /// Bug 17: removed from a shared note, the person was left on "No note selected" with nothing
    /// said. The note goes and they're told once, with its title and who shared it.
    @Test func beingRemovedIsSaidOnce() async throws {
        server.names = [owner: "Emil Wagman"]
        let emil = try device(owner)
        let (note, _) = try await shared("Trip plan\n- Flights", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let said = SaidRemovals()
        sara.library.onLostAccess = { said.all.append($0) }
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let session = try #require(sara.library.session(for: mine))
        await session.refreshMembers()

        server.remove(member, from: note.id)
        await sara.library.reconcile(try await sara.transport.memberships())
        #expect(mine.deletedAt != nil)
        #expect(said.all.count == 1)
        let removal = try #require(said.all.first)
        #expect(removal.id == mine.id)
        #expect(removal.alertTitle == "You no longer have access to \u{201C}Trip plan\u{201D}")
        #expect(removal.message == "Ask Emil to share it with you again if you still need it.")
        #expect(removal.copy == nil, "nothing typed here, nothing to keep")
        // Said once: the next look has nothing more to say.
        await sara.library.reconcile(try await sara.transport.memberships())
        #expect(said.all.count == 1)
        // The notes window's queue says it once too.
        let queue = SharedRemovals()
        queue.add(removal)
        queue.add(removal)
        #expect(queue.queue.count == 1 && queue.current == removal)
        queue.shown(removal)
        #expect(queue.current == nil)
    }

    /// The owner stopping sharing deletes the members' pointers on the server: that comes by sync,
    /// and is said too. A note whose owner isn't known here asks "its owner".
    @Test func theOwnerStoppingSharingIsSaid() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Party plan", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let said = SaidRemovals()
        sara.library.onLostAccess = { said.all.append($0) }
        sara.library.install()
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        // What collab_unshare leaves in a member's row, as sync applies it.
        mine.deletedAt = .now
        SharedNotes.pointerArrived?(mine)
        #expect(said.all.map(\.id) == [mine.id])
        #expect(said.all.first?.message == "Ask its owner to share it with you again if you still need it.")
        #expect(mine.sharedDocument == nil)
    }

    /// Leaving is your own choice: nothing is said, here or on your other devices, which see the
    /// note go by sync (its pointer goes marked as yours, as a deleted one is).
    @Test func leavingSaysNothingHereOrOnYourOtherDevices() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Book club", on: emil)
        server.add(member, to: note.id)
        let phone = try device(member), mac = try device(member)
        let said = SaidRemovals()
        phone.library.onLostAccess = { said.all.append($0) }
        mac.library.onLostAccess = { said.all.append($0) }
        let onPhone = try await phone.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let onMac = try await mac.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        try await phone.library.leave(onPhone)
        #expect(onPhone.deletedAt != nil && onPhone.trashedAt != nil)

        mac.library.install()
        onMac.trashedAt = onPhone.trashedAt
        onMac.deletedAt = onPhone.deletedAt
        SharedNotes.pointerArrived?(onMac)
        #expect(onMac.sharedDocument == nil)
        #expect(said.all.isEmpty)
    }

    /// Bug 19: removed while typing, what they'd typed went with the note. When they'd typed in it
    /// here, the notice offers Keep a Copy: their text, as a note of their own.
    @Test func removedWhileTypingOffersACopyOfYourText() async throws {
        let emil = try device(owner)
        let (note, _) = try await shared("Offsite plan\n- Venue", on: emil)
        server.add(member, to: note.id)
        let sara = try device(member)
        let said = SaidRemovals()
        sara.library.onLostAccess = { said.all.append($0) }
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let session = try #require(sara.library.session(for: mine))
        // Typed offline: it never reached the owner.
        sara.transport.offline = true
        type("\n- Dinner at 8", in: session)
        server.remove(member, from: note.id)
        sara.transport.offline = false
        await sara.library.reconcile(try await sara.transport.memberships())
        #expect(mine.deletedAt != nil)
        let removal = try #require(said.all.first)
        #expect(removal.copy == "Offsite plan\n- Venue\n- Dinner at 8")
        #expect(removal.message == "Ask its owner to share it with you again if you still need it. You can keep a copy of it as it is on this Mac.")

        // Keep a Copy: an ordinary note of Sara's with her text, not in Shared with me.
        let queue = SharedRemovals()
        queue.add(removal)
        let copy = try #require(queue.keep(removal, in: sara.context))
        #expect(queue.current == nil)
        #expect(copy.body == "Offsite plan\n- Venue\n- Dinner at 8")
        #expect(!copy.isShared && copy.deletedAt == nil && copy.id != mine.id)
        #expect(copy.folder?.id != SharedNotes.sharedWithMeID(dataKey: dataKeys[member]!))
        #expect(copy.folder?.name == "Notes", "Sara has no folder of her own yet: Notes is made for it")
    }
}
