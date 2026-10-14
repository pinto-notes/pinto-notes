import Foundation
import Supabase
import os

private let log = Logger(subsystem: "dev.emilwagman.pane", category: "collab")

/// Collaboration over the real backend, as the signed-in account: PostgREST calls to the
/// `collab_*` functions and tables (supabase/migrations/20261007163000_collaboration.sql), whose
/// row-level security decides what each person may read and write, and a Realtime private channel
/// `note:<id>` per open note, which only members can join (the policies on `realtime.messages`).
///
/// On the channel: new changes arrive as inserts into `note_updates` (Postgres changes, checked
/// against the same row-level security), presence goes as a broadcast (`presence`, sealed), and
/// Realtime's own presence tracks which devices are here, so leaving is seen even when a device
/// drops without saying so.
@MainActor
final class SupabaseCollabTransport: CollabTransport {
    let client: SupabaseClient
    let me: UUID

    init(client: SupabaseClient, me: UUID) {
        self.client = client
        self.me = me
    }

    private static func id(_ u: UUID) -> String { u.uuidString.lowercased() }

    /// Runs a call, turning the server's hints into `Collab.Failure`.
    @discardableResult
    private func call<T>(_ what: String, _ body: () async throws -> T) async throws -> T {
        do {
            return try await body()
        } catch let e as PostgrestError {
            log.error("collab \(what, privacy: .public): \(e.message, privacy: .public)")
            throw Collab.Failure.from(hint: e.hint, message: e.message)
        }
    }

    // MARK: Identity

    func ownIdentity() async throws -> Collab.IdentityRow? {
        try await call("identity") {
            let rows: [Collab.IdentityRow] = try await client.from("identity_keys").select("public_key,private_wrap")
                .eq("user_id", value: Self.id(me)).execute().value
            return rows.first
        }
    }

    func publishIdentity(publicKey: String, privateWrap: String) async throws {
        try await call("publish identity") {
            try await client.rpc("collab_publish_identity", params: ["p_public_key": publicKey, "p_private_wrap": privateWrap]).execute()
        }
    }

    // MARK: Membership

    func memberships() async throws -> [Collab.Membership] {
        struct Row: Decodable {
            struct Note: Decodable { let head_ct: String?; let owner_id: UUID; let rekey_after: String? }
            let note_id: UUID, role: String, epoch: Int, key_wrap: String, wrapped_by: UUID
            let self_wrap: String?, invited_by: UUID?, accepted_at: String?
            let shared_notes: Note
        }
        return try await call("memberships") {
            let rows: [Row] = try await client.from("note_members")
                .select("note_id,role,epoch,key_wrap,wrapped_by,self_wrap,invited_by,accepted_at,shared_notes(head_ct,owner_id,rekey_after)")
                .eq("user_id", value: Self.id(me)).execute().value
            return rows.map {
                Collab.Membership(note_id: $0.note_id, role: $0.role, epoch: $0.epoch, key_wrap: $0.key_wrap, wrapped_by: $0.wrapped_by,
                                  self_wrap: $0.self_wrap, invited_by: $0.invited_by, accepted_at: $0.accepted_at,
                                  head_ct: $0.shared_notes.head_ct, owner_id: $0.shared_notes.owner_id,
                                  rekey_after: $0.shared_notes.rekey_after)
            }
        }
    }

    func members(of note: UUID) async throws -> [Collab.Member] {
        try await call("members") { try await client.rpc("collab_members", params: ["p_note": Self.id(note)]).execute().value }
    }

    func share(note: UUID, keyWrap: String, selfWrap: String, head: String) async throws {
        try await call("share") {
            try await client.rpc("collab_share", params: ["p_note": Self.id(note), "p_key_wrap": keyWrap, "p_self_wrap": selfWrap, "p_head_ct": head]).execute()
        }
    }

    func accept(note: UUID, selfWrap: String) async throws {
        try await call("accept") { try await client.rpc("collab_accept", params: ["p_note": Self.id(note), "p_self_wrap": selfWrap]).execute() }
    }

    @discardableResult
    func remove(note: UUID, user: UUID?, epoch: Int, wraps: [Collab.Wrap]) async throws -> Int {
        struct Params: Encodable { let p_note: String; let p_user: String?; let p_epoch: Int; let p_wraps: [Collab.Wrap] }
        return try await call("remove") {
            try await client.rpc("collab_remove", params: Params(p_note: Self.id(note), p_user: user.map(Self.id), p_epoch: epoch, p_wraps: wraps)).execute().value
        }
    }

    func updateHead(note: UUID, head: String) async throws {
        try await call("head") { try await client.from("shared_notes").update(["head_ct": head]).eq("id", value: Self.id(note)).execute() }
    }

    // MARK: Edit links

    func createLink(id: String, note: UUID, role: String, epoch: Int, answerHash: String, keyWrap: String) async throws {
        struct Params: Encodable { let p_link: String; let p_note: String; let p_role: String; let p_epoch: Int; let p_answer_hash: String; let p_key_wrap: String }
        try await call("create link") {
            try await client.rpc("collab_create_link", params: Params(p_link: id, p_note: Self.id(note), p_role: role, p_epoch: epoch,
                                                                      p_answer_hash: answerHash, p_key_wrap: keyWrap)).execute()
        }
    }

    func leave(note: UUID) async throws {
        try await call("leave") { try await client.rpc("collab_leave", params: ["p_note": Self.id(note)]).execute() }
    }

    func stopLink(note: UUID) async throws {
        try await call("stop link") { try await client.rpc("collab_stop_link", params: ["p_note": Self.id(note)]).execute() }
    }

    func openLink(id: String, answer: String) async throws -> Collab.OpenedLink? {
        do {
            let rows: [Collab.OpenedLink] = try await client.rpc("collab_open_link", params: ["p_link": id, "p_answer": answer]).execute().value
            return rows.first
        } catch let e as PostgrestError where e.code == "P0002" {
            return nil
        } catch let e as PostgrestError {
            throw Collab.Failure.from(hint: e.hint, message: e.message)
        }
    }

    func joinLink(id: String, answer: String, keyWrap: String, selfWrap: String) async throws {
        try await call("join link") {
            try await client.rpc("collab_join_link", params: ["p_link": id, "p_answer": answer, "p_key_wrap": keyWrap, "p_self_wrap": selfWrap]).execute()
        }
    }

    // MARK: Sealed links and templates

    func publishSealedLink(id: String, note: UUID, ct: String) async throws {
        try await call("publish sealed link") {
            try await client.rpc("publish_sealed_link", params: ["p_id": id, "p_note": Self.id(note), "p_ct": ct]).execute()
        }
    }

    func stopSealedLink(note: UUID) async throws {
        try await call("stop sealed link") { try await client.rpc("stop_sealed_link", params: ["p_note": Self.id(note)]).execute() }
    }

    func publishTemplate(id: String, note: UUID, name: String, json: String) async throws {
        struct Params: Encodable { let p_id: String; let p_note: String; let p_maker: String; let p_template: AnyJSON }
        let template = try JSONDecoder().decode(AnyJSON.self, from: Data(json.utf8))
        try await call("publish template") {
            try await client.rpc("publish_template", params: Params(p_id: id, p_note: Self.id(note), p_maker: name, p_template: template)).execute()
        }
    }

    func stopTemplate(note: UUID) async throws {
        try await call("stop template") { try await client.rpc("stop_template", params: ["p_note": Self.id(note)]).execute() }
    }

    func sharedTemplate(id: String) async throws -> Data? {
        struct Row: Codable { let maker: String?; let template: AnyJSON }
        return try await call("template") {
            let rows: [Row] = try await client.rpc("shared_template", params: ["p_id": id]).execute().value
            return try rows.first.map { try JSONEncoder().encode($0) }
        }
    }

    // MARK: The document

    /// PostgREST hands back at most this many rows at once; longer runs are read in pages.
    private static let page = 500

    func pull(note: UUID, after: Int64) async throws -> Collab.Pull {
        try await call("pull") {
            let snapshots: [Collab.Snapshot] = try await client.from("note_snapshots").select("note_id,upto,epoch,ct")
                .eq("note_id", value: Self.id(note)).order("upto", ascending: false).order("epoch", ascending: false).limit(1)
                .execute().value
            let snapshot = snapshots.first.flatMap { s in after == 0 || after < s.upto ? s : nil }
            var from = snapshot?.upto ?? after
            var updates: [Collab.Update] = []
            while true {
                let rows: [Collab.Update] = try await client.from("note_updates").select("id,note_id,author_id,epoch,ct,client")
                    .eq("note_id", value: Self.id(note)).gt("id", value: Int(from)).order("id").limit(Self.page)
                    .execute().value
                updates += rows
                guard rows.count == Self.page, let last = rows.last else { break }
                from = last.id
            }
            return Collab.Pull(snapshot: snapshot, updates: updates)
        }
    }

    func send(update ct: String, note: UUID, epoch: Int) async throws -> Collab.Update {
        struct Row: Encodable { let note_id: String; let epoch: Int; let ct: String }
        return try await call("send update") {
            try await client.from("note_updates").insert(Row(note_id: Self.id(note), epoch: epoch, ct: ct), returning: .representation)
                .select("id,note_id,author_id,epoch,ct,client").single().execute().value
        }
    }

    func send(snapshot ct: String, note: UUID, upto: Int64, epoch: Int) async throws {
        struct Row: Encodable { let note_id: String; let upto: Int64; let epoch: Int; let ct: String }
        try await call("send snapshot") {
            try await client.from("note_snapshots").insert(Row(note_id: Self.id(note), upto: upto, epoch: epoch, ct: ct), returning: .minimal).execute()
        }
    }

    // MARK: Live

    func join(note: UUID, onEvent: @escaping @MainActor (Collab.Event) -> Void) async throws -> CollabChannel {
        // Each device is its own presence entry; a person has left when their last one has.
        let device = UUID().uuidString.lowercased()
        let channel = client.realtimeV2.channel("note:\(Self.id(note))") {
            $0.isPrivate = true
            $0.presence.key = device
        }
        let live = SupabaseCollabChannel(channel: channel, client: client, me: me)
        let inserts = channel.postgresChange(InsertAction.self, schema: "public", table: "note_updates", filter: .eq("note_id", value: Self.id(note)))
        let presence = channel.broadcastStream(event: "presence")
        let devices = channel.presenceChange()
        let status = channel.statusChange
        let system = channel.system()
        do {
            // Refused (not a member) shows as retries until the client gives up, about a minute;
            // a member joins in well under a second, so ten seconds is the answer either way.
            try await withThrowingTaskGroup(of: Void.self) { group in
                group.addTask { try await channel.subscribeWithError() }
                group.addTask { try await Task.sleep(for: Self.joinTimeout); throw Collab.Failure.notMember }
                defer { group.cancelAll() }
                try await group.next()
            }
        } catch {
            await client.realtimeV2.removeChannel(channel)
            log.error("collab channel refused: \(String(describing: error), privacy: .public)")
            throw Collab.Failure.notMember
        }
        try? await channel.track(Here(user: Self.id(me)))
        let me = me
        live.tasks = [
            Task { @MainActor in
                for await insert in inserts {
                    guard let u = try? insert.decodeRecord(as: Collab.Update.self, decoder: JSONDecoder()) else {
                        log.error("a change from the channel didn't decode")
                        continue
                    }
                    onEvent(.update(u))
                }
            },
            Task { @MainActor in
                for await message in presence {
                    guard let p = Self.presence(message), p.user != me else { continue }
                    onEvent(.presence(user: p.user, ct: p.ct))
                }
            },
            Task { @MainActor in
                var here: [String: UUID] = [:]
                for await change in devices {
                    for (key, p) in change.joins { if let u = (try? p.decodeState(as: Here.self)).flatMap({ UUID(uuidString: $0.user) }) { here[key] = u } }
                    for key in change.leaves.keys {
                        guard let u = here.removeValue(forKey: key), u != me, !here.values.contains(u) else { continue }
                        onEvent(.leave(u))
                    }
                }
            },
            // Changes are only relayed once Realtime has subscribed to them, which it says a moment
            // after the channel itself is joined (on staging, sometimes seconds). Whatever was stored
            // in between is fetched then.
            Task { @MainActor in
                for await message in system {
                    guard message.payload["extension"]?.stringValue == "postgres_changes", message.payload["status"]?.stringValue == "ok" else { continue }
                    onEvent(.reconnected)
                }
            },
            Task { @MainActor in
                var joined = false
                for await s in status {
                    if s == .subscribed {
                        if joined { onEvent(.reconnected) }
                        joined = true
                    }
                }
            },
        ]
        return live
    }

    private struct Here: Codable { let user: String }

    nonisolated static let joinTimeout: Duration = .seconds(10)

    /// The sealed presence in a broadcast: `{user, ct}`, inside the message's payload.
    nonisolated static func presence(_ message: JSONObject) -> (user: UUID, ct: String)? {
        let body = message["payload"]?.objectValue ?? message
        guard let user = body["user"]?.stringValue.flatMap(UUID.init(uuidString:)), let ct = body["ct"]?.stringValue else { return nil }
        return (user, ct)
    }
}

@MainActor
final class SupabaseCollabChannel: CollabChannel {
    private let channel: RealtimeChannelV2
    private let client: SupabaseClient
    private let me: UUID
    var tasks: [Task<Void, Never>] = []
    private var open = true

    init(channel: RealtimeChannelV2, client: SupabaseClient, me: UUID) {
        self.channel = channel
        self.client = client
        self.me = me
    }

    func send(presence ct: String) {
        guard open else { return }
        let message: JSONObject = ["user": .string(me.uuidString.lowercased()), "ct": .string(ct)]
        Task { await channel.broadcast(event: "presence", message: message) }
    }

    func close() {
        guard open else { return }
        open = false
        tasks.forEach { $0.cancel() }
        let channel = channel, client = client
        Task {
            await channel.untrack()
            await client.realtimeV2.removeChannel(channel)
        }
    }
}
