import CryptoKit
import Foundation
import Supabase
import SwiftData
import Testing
@testable import Pane

/// Shared notes against a real backend: the local stack or staging, never production. Runs only when
/// TEST_RUNNER_COLLAB_LIVE names a JSON file `{url, anon_key, users: [{email, password} ×3]}` (made
/// by scripts/collab-live-accounts.ts, which refuses production's project). Three accounts: Emil
/// shares a note with an Edit link, Sara joins through it, both type and converge over the private
/// Realtime channel; Eve, outside the note, is refused by row-level security and by the channel's
/// policy; once Sara is removed she can neither read new text nor write.
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
        let dataKey = SymmetricKey(size: .bits256)
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
        let mine = try #require(emil.store.session(for: note.id)), theirs = try #require(sara.store.session(for: note.id))
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

        // Presence over the private channel: Sara's caret reaches Emil.
        theirs.selectionChanged(NSRange(location: 5, length: 0))
        await until { mine.peers[sara.id]?.selection != nil }
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
        let fresh = try await CollabSession.load(note: note.id, epoch: row.epoch, nk: try await emil.store.openKey(row).nk,
                                                 transport: emil.store.transport!, me: emil.id, name: "Emil")
        #expect(fresh.text == mine.text)

        for p in [emil, sara, eve] { p.store.stop() }
    }
}

/// Where the live test runs, from TEST_RUNNER_COLLAB_LIVE.
enum CollabLive {
    struct Config: Decodable, Sendable {
        struct User: Decodable, Sendable { let email: String; let password: String }
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
