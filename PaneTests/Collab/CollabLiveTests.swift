import CryptoKit
import Foundation
import Supabase
import SwiftData
import Testing
@testable import Pane

/// Shared notes against a real backend: the local stack or staging, never production. Runs only when
/// TEST_RUNNER_COLLAB_LIVE names a JSON file `{url, anon_key, users: [{email, password, data_key} ×3]}` (made
/// by scripts/collab-live-accounts.ts, which refuses production's project). Three accounts: Emil
/// shares a note with an Edit link, Sara joins through it, both type and converge over the private
/// Realtime channel; Eve, outside the note, is refused by row-level security and by the channel's
/// policy; once Sara is removed she can neither read new text nor write. Then a whiteboard all three
/// draw on at once, with their pointers, ending the same on every device.
@MainActor
@Suite(.enabled(if: CollabLive.config != nil), .serialized)
struct CollabLiveTests {
    static var config: CollabLive.Config? { CollabLive.config }

    struct Person {
        let id: UUID
        let client: SupabaseClient
        let store: CollabStore
        let container: ModelContainer
    }

    private func person(_ i: Int, name: String) async throws -> Person {
        let c = try #require(Self.config)
        let client = SupabaseClient(supabaseURL: c.url, supabaseKey: c.anon_key,
                                    options: SupabaseClientOptions(auth: .init(storage: GoogleSignInTests.MemoryStorage(), autoRefreshToken: false)))
        let session = try await client.auth.signIn(email: c.users[i].email, password: c.users[i].password)
        let dataKey = SymmetricKey(data: try #require(Data(base64Encoded: c.users[i].data_key)))
        let store = CollabStore(name: name, transport: SupabaseCollabTransport(client: client, me: session.user.id), dataKey: { dataKey },
                                book: CollabKeyBook(account: session.user.id, defaults: TestDefaults()))
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        store.context = container.mainContext
        return Person(id: session.user.id, client: client, store: store, container: container)
    }

    /// Waits up to `seconds` for a condition the network has to bring about.
    private func until(_ seconds: Double = 15, _ condition: () -> Bool) async {
        let end = Date.now.addingTimeInterval(seconds)
        while !condition(), Date.now < end { try? await Task.sleep(for: .milliseconds(50)) }
    }

    @Test func twoAccountsShareJoinTypeAndConverge() async throws {
        let emil = try await person(0, name: "Emil"), sara = try await person(1, name: "Sara"), eve = try await person(2, name: "Eve")
        let note = Note(body: "Offsite plan\n\nAgenda\n")
        emil.container.mainContext.insert(note)

        // Emil shares: his identity is published on this first share, and the link lets people edit.
        try await emil.store.setAccess(.edit, for: note)
        let published: [Collab.IdentityRow] = try await emil.client.from("identity_keys").select("public_key,private_wrap").execute().value
        #expect(published.first?.public_key == emil.store.identity?.publicBase64)
        let url = try #require(emil.store.linkURL(note))
        #expect(await sara.store.join(url))
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: sara.container.mainContext.pointer(forShared: note.id)?.id ?? UUID()))
        #expect(theirs.text == "Offsite plan\n\nAgenda\n")
        let members = try await emil.store.transport!.members(of: note.id)
        #expect(Set(members.map(\.user_id)) == [emil.id, sara.id])

        // Both on the channel, both typing at once.
        try await Task.sleep(for: .seconds(1))
        mine.local("Offsite plan\n\nAgenda\n- Budget\n", selection: nil)
        theirs.local("Offsite plan (Lisbon)\n\nAgenda\n", selection: nil)
        await until { mine.text == theirs.text && mine.text.contains("Lisbon") && mine.text.contains("Budget") }
        #expect(mine.text == "Offsite plan (Lisbon)\n\nAgenda\n- Budget\n")
        #expect(theirs.text == mine.text)

        // Presence over the private channel: Sara's caret reaches Emil (a caret move right after
        // typing waits for the typing to pause).
        try await Task.sleep(for: .seconds(0.8))
        theirs.selectionChanged(NSRange(location: 5, length: 0))
        await until { mine.peers[sara.id]?.selection == NSRange(location: 5, length: 0) }
        #expect(mine.peers[sara.id]?.selection == NSRange(location: 5, length: 0))

        // Eve is outside the note: nothing to read, nothing to write, no channel.
        let eveSees: [Collab.Update] = try await eve.client.from("note_updates").select("id,note_id,author_id,epoch,ct,client")
            .eq("note_id", value: note.id.uuidString.lowercased()).execute().value
        #expect(eveSees.isEmpty)
        #expect(try await eve.store.transport!.members(of: note.id).isEmpty)
        await #expect(throws: (any Error).self) { _ = try await eve.store.transport!.send(update: "amb3u.1.AAAA", note: note.id, epoch: 1) }
        await #expect(throws: Collab.Failure.notMember) { _ = try await eve.store.transport!.join(note: note.id) { _ in } }
        // Eve can't make herself a member with a wrong answer either.
        #expect(try await eve.store.transport!.openLink(id: "AAAAAAAAAAAAAAAAAAAAAA", answer: String(repeating: "0", count: 64)) == nil)

        // Sara is removed: a new key for Emil alone; her old key is refused and she gets no new text.
        try await emil.store.remove(sara.id, from: note)
        #expect(mine.epoch == 2)
        mine.local(mine.text + "After Sara left\n", selection: nil)
        await until(3) { false }
        #expect(!theirs.text.contains("After Sara left"))
        let saraSees: [Collab.Update] = try await sara.client.from("note_updates").select("id,note_id,author_id,epoch,ct,client")
            .eq("note_id", value: note.id.uuidString.lowercased()).execute().value
        #expect(saraSees.isEmpty)
        await #expect(throws: (any Error).self) { _ = try await sara.store.transport!.send(update: "amb3u.1.AAAA", note: note.id, epoch: 1) }

        // Emil reads it all back from the server alone, as a new device would.
        await until { mine.unsent == 0 }
        let row = try #require(try await emil.store.transport!.memberships().first { $0.note_id == note.id })
        let fresh = try await CollabSession.load(record: SharedDocument(id: note.id, epoch: row.epoch, role: "owner", saved: Data()), nk: try await emil.store.openKey(row).nk,
                                                 transport: emil.store.transport!, me: emil.id, name: "Emil")
        #expect(fresh.text == mine.text)

        // Eve joins through the link (made again under the new key) and leaves: Emil's device
        // renews the key on its next look at his memberships.
        let link = try #require(emil.store.linkURL(note))
        #expect(await eve.store.join(link))
        let hers = try #require(eve.container.mainContext.pointer(forShared: note.id))
        try await eve.store.leave(hers)
        let marked = try #require(try await emil.store.transport!.memberships().first { $0.note_id == note.id })
        #expect(marked.rekey_after != nil)
        await emil.store.checkMemberships()
        let renewed = try #require(try await emil.store.transport!.memberships().first { $0.note_id == note.id })
        #expect(renewed.epoch == 3)
        #expect(renewed.rekey_after == nil)

        for p in [emil, sara, eve] { p.store.stop() }
    }

    /// A whiteboard against the real backend: Emil shares a board with an Edit link, Sara and Eve
    /// join, and all three draw at once, each before seeing the others (a shape each; Sara and Eve
    /// change the same shape, Eve another). Over the private channel each sees the other two's
    /// pointers and selections, in three colours that are the same on every device, and all three
    /// end with the same drawing: the newer edit, and of two as new the lower nonce. A new device
    /// reads that drawing back from the server alone, where it's only sealed changes.
    @Test func threeAccountsDrawOnOneBoardAndConverge() async throws {
        let emil = try await person(0, name: "Emil"), sara = try await person(1, name: "Sara"), eve = try await person(2, name: "Eve")
        typealias Board = SharedBoardTests
        let note = CanvasNote.make(in: .all, context: emil.container.mainContext,
                                   scene: Board.scene([Board.shape("a", x: 10), Board.shape("b", x: 200, index: "a1")]), named: "Launch plan")
        try await emil.store.setAccess(.edit, for: note)
        let url = try #require(emil.store.linkURL(note))
        #expect(await sara.store.join(url))
        #expect(await eve.store.join(url))
        let e = try #require(emil.store.session(for: note.id))
        func session(_ p: Person) throws -> CollabSession {
            try #require(p.store.session(for: p.container.mainContext.pointer(forShared: note.id)?.id ?? UUID()))
        }
        let s = try session(sara), v = try session(eve)
        #expect(e.isBoard && s.isBoard && v.isBoard)
        await until { Board.said(s) == ["a:1:1", "b:1:1"] && Board.said(v) == Board.said(s) }
        #expect(Board.said(s) == ["a:1:1", "b:1:1"] && Board.said(v) == Board.said(s), "both have the board as Emil shared it")

        // All three on the channel, then drawing at once.
        try await Task.sleep(for: .seconds(1))
        e.boardLocal([Board.shape("emil-1", x: 0, y: 300, index: "a2")])
        s.boardLocal([Board.shape("sara-1", x: 200, y: 300, index: "a3"), Board.shape("a", x: 40, version: 2, nonce: 55)])
        v.boardLocal([Board.shape("eve-1", x: 400, y: 300, index: "a4"), Board.shape("a", x: 90, version: 2, nonce: 900),
                      Board.shape("b", x: 260, version: 2, nonce: 9, index: "a1")])
        let all = ["a:2:55", "b:2:9", "emil-1:1:1", "sara-1:1:1", "eve-1:1:1"]
        await until(20) { [e, s, v].allSatisfy { Board.said($0) == all } }
        for (name, x) in [("Emil", e), ("Sara", s), ("Eve", v)] {
            #expect(Board.said(x) == all, "\(name)'s board: \(Board.said(x))")
            #expect(Board.element("a", in: x)?["x"] as? Double == 40 && Board.element("b", in: x)?["x"] as? Double == 260, "\(name): the winning edits")
        }

        // Each one's pointer and selection reach the other two.
        e.boardPresence(pointer: CGPoint(x: 15, y: 20), selection: ["a"])
        s.boardPresence(pointer: CGPoint(x: 210, y: 45.5), selection: ["b"])
        v.boardPresence(pointer: CGPoint(x: 420, y: 310), selection: ["eve-1"])
        await until { [e, s, v].allSatisfy { $0.boardPeers.filter { $0.pointer != nil }.count == 2 } }
        let ids = [emil.id, sara.id, eve.id]
        let wanted: [UUID: (CGPoint, [String])] = [emil.id: (CGPoint(x: 15, y: 20), ["a"]), sara.id: (CGPoint(x: 210, y: 45.5), ["b"]), eve.id: (CGPoint(x: 420, y: 310), ["eve-1"])]
        for (me, x) in zip(ids, [e, s, v]) {
            let peers = x.boardPeers
            #expect(Set(peers.map(\.id)) == Set(ids).subtracting([me]), "each sees the other two")
            for p in peers {
                #expect(p.pointer == wanted[p.id]?.0 && p.selection == wanted[p.id]?.1, "\(p.name)'s pointer and selection where they put them")
            }
            #expect(Set(peers.map(\.color)).count == 2, "in two colours")
        }
        let colours = [e, s, v].map { x in ids.map { x.paletteSlot(of: $0) } }
        #expect(Set(colours[0]).count == 3 && colours.allSatisfy { $0 == colours[0] }, "three colours, the same on every device: \(colours)")

        // Read back from the server alone, as a new device would; the server has only sealed changes.
        await until { [e, s, v].allSatisfy { $0.unsent == 0 } }
        let row = try #require(try await emil.store.transport!.memberships().first { $0.note_id == note.id })
        let fresh = try await CollabSession.load(record: SharedDocument(id: note.id, epoch: row.epoch, role: "owner", saved: Data()), nk: try await emil.store.openKey(row).nk,
                                                 transport: emil.store.transport!, me: emil.id, name: "Emil")
        #expect(fresh.isBoard && Board.said(fresh) == all, "a new device reads the same board: \(Board.said(fresh))")
        let stored: [Collab.Update] = try await emil.client.from("note_updates").select("id,note_id,author_id,epoch,ct,client")
            .eq("note_id", value: note.id.uuidString.lowercased()).execute().value
        #expect(!stored.isEmpty && stored.allSatisfy { !$0.ct.contains("sara-1") && !$0.ct.contains("rectangle") }, "sealed")

        for p in [emil, sara, eve] { p.store.stop() }
    }

    /// Pictures on a shared whiteboard against the real backend (note_files, collab_put_file): Emil
    /// shares a board with a picture on it; Sara joins with an Edit link and Eve with a View link,
    /// and both have it. Sara pastes one: it reaches the other two, sealed on the server. Eve, a
    /// viewer, sees pictures and can't put one there. Sara is removed: the pictures are sealed
    /// again under the new key, the server gives her none, and Eve, who stays, opens them.
    @Test func picturesOnASharedBoardReachEveryoneAndAreSealedAgainAfterARemoval() async throws {
        let emil = try await person(0, name: "Emil"), sara = try await person(1, name: "Sara"), eve = try await person(2, name: "Eve")
        typealias Board = SharedBoardTests
        var scene = Board.scene([Board.shape("a", x: 10), Board.image("pic", file: "Live-Pic1")])
        scene["files"] = ["Live-Pic1": Board.picture("Live-Pic1", bytes: 40_000)]
        let note = CanvasNote.make(in: .all, context: emil.container.mainContext, scene: scene, named: "Moodboard")
        try await emil.store.setAccess(.edit, for: note)
        #expect(await sara.store.join(try #require(emil.store.linkURL(note))))
        try await emil.store.setAccess(.view, for: note)
        #expect(await eve.store.join(try #require(emil.store.linkURL(note))))
        let e = try #require(emil.store.session(for: note.id))
        func session(_ p: Person) throws -> CollabSession {
            try #require(p.store.session(for: p.container.mainContext.pointer(forShared: note.id)?.id ?? UUID()))
        }
        let s = try session(sara), v = try session(eve)
        #expect(s.canWrite && !v.canWrite)
        let first = Board.picture("Live-Pic1", bytes: 40_000)
        await until { Board.has(s, "Live-Pic1", first) && Board.has(v, "Live-Pic1", first) }
        #expect(Board.has(s, "Live-Pic1", first) && Board.has(v, "Live-Pic1", first), "the board's picture came with it")

        // Sara pastes one.
        let second = Board.picture("Sara-Pic2", bytes: 120_000)
        Board.put(s, Board.image("pic2", file: "Sara-Pic2", index: "a2"), second)
        await until(20) { Board.has(e, "Sara-Pic2", second) && Board.has(v, "Sara-Pic2", second) }
        #expect(Board.has(e, "Sara-Pic2", second) && Board.has(v, "Sara-Pic2", second), "Sara's picture reached Emil and Eve")
        let rows: [Collab.File] = try await emil.client.from("note_files").select("file_id,epoch,ct").eq("note_id", value: note.id.uuidString.lowercased()).execute().value
        #expect(Set(rows.map(\.file_id)) == ["Live-Pic1", "Sara-Pic2"] && rows.allSatisfy { $0.epoch == 1 && $0.ct.hasPrefix("amb3f.1.") })
        let b64 = String((second["dataURL"] as! String).split(separator: ",")[1].prefix(64))
        #expect(rows.allSatisfy { !$0.ct.contains(b64) }, "sealed")

        // Eve views: the server refuses her picture, and her board takes none.
        let sealed = try CollabBoard.Pictures.seal(Board.picture("Eve-Pic3"), nk: SymmetricKey(size: .bits256), note: note.id, epoch: 1)
        await #expect(throws: Collab.Failure.readOnly) { try await eve.store.transport!.putFile(note: note.id, id: "Eve-Pic3", epoch: 1, ct: sealed) }
        Board.put(v, Board.image("pic3", file: "Eve-Pic3", index: "a3"), Board.picture("Eve-Pic3"))
        try await Task.sleep(for: .seconds(1))
        #expect(Board.element("pic3", in: e) == nil)

        // Sara is removed: sealed again under the new key, for whoever stays.
        try await emil.store.remove(sara.id, from: note)
        let after: [Collab.File] = try await emil.client.from("note_files").select("file_id,epoch,ct").eq("note_id", value: note.id.uuidString.lowercased()).execute().value
        #expect(after.count == 2 && after.allSatisfy { $0.epoch == 2 && $0.ct.hasPrefix("amb3f.2.") }, "sealed again: \(after.map { "\($0.file_id)@\($0.epoch)" })")
        #expect(try await sara.store.transport!.files(of: note.id).isEmpty)
        #expect(try await sara.store.transport!.file(note: note.id, id: "Sara-Pic2") == nil, "the server gives her none")
        await eve.store.checkMemberships()
        let eveRow = try #require(try await eve.store.transport!.memberships().first { $0.note_id == note.id })
        #expect(eveRow.epoch == 2)
        let nk = try await eve.store.openKey(eveRow).nk
        for f in after {
            let opened = try CollabBoard.Pictures.open(f, keys: [2: nk], note: note.id)
            #expect(opened["dataURL"] as? String == (f.file_id == "Sara-Pic2" ? second : first)["dataURL"] as? String, "Eve opens \(f.file_id) under the new key")
        }

        for p in [emil, sara, eve] { p.store.stop() }
    }
}

/// Where the live test runs, from TEST_RUNNER_COLLAB_LIVE.
enum CollabLive {
    struct Config: Decodable, Sendable {
        struct User: Decodable, Sendable { let email: String; let password: String; let data_key: String }
        let url: URL
        let anon_key: String
        let users: [User]
    }

    static var config: Config? {
        guard let path = ProcessInfo.processInfo.environment["COLLAB_LIVE"], let data = FileManager.default.contents(atPath: path),
              let c = try? JSONDecoder().decode(Config.self, from: data), c.users.count >= 3,
              !(c.url.host() ?? "").hasPrefix("rodegaeruhyybqilrnpn") else { return nil }
        return c
    }
}
