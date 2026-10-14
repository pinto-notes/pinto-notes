import CryptoKit
import Foundation
@testable import Pane

/// The collaboration server in memory, for the library's tests: the tables and rules of
/// 20261007163000_collaboration.sql that shared notes in the library depend on. Changes get ids
/// from one counter (as `note_updates.id` does across all notes), a change sealed for an old key
/// or by a viewer is refused, a snapshot drops the changes it covers, and pulling hands a device
/// that's behind the newest snapshot that snapshot first. Each device talks to it through its own
/// `FakeCollabTransport`, which can go offline.
@MainActor
final class FakeCollabServer {
    struct Member { var role: String; var epoch: Int; var accepted = true; var acceptedAt = Date.now }

    private(set) var updates: [Collab.Update] = []
    private(set) var snapshots: [Collab.Snapshot] = []
    private var nextID: Int64 = 1
    var epochs: [UUID: Int] = [:]
    var members: [UUID: [UUID: Member]] = [:]
    var owners: [UUID: UUID] = [:]
    /// Live channels: who's listening to which note.
    fileprivate var channels: [FakeChannel] = []
    /// Ids handed out but not stored yet: a change still being written when someone pulls.
    var inFlight: Set<Int64> = []

    func role(_ note: UUID, _ user: UUID) -> String? { members[note]?[user]?.role }

    func share(_ note: UUID, owner: UUID) {
        epochs[note] = 1
        owners[note] = owner
        members[note] = [owner: Member(role: "owner", epoch: 1)]
    }

    func add(_ user: UUID, to note: UUID, role: String = "editor") {
        members[note, default: [:]][user] = Member(role: role, epoch: epochs[note] ?? 1)
    }

    /// Removes someone and moves the note to a new key, as collab_remove does.
    func remove(_ user: UUID, from note: UUID) {
        members[note]?[user] = nil
        let epoch = (epochs[note] ?? 1) + 1
        epochs[note] = epoch
        for id in members[note]?.keys.map({ $0 }) ?? [] { members[note]?[id]?.epoch = epoch }
    }

    func insertUpdate(note: UUID, author: UUID, epoch: Int, ct: String) throws -> Collab.Update {
        guard let role = role(note, author) else { throw Collab.Failure.notMember }
        guard role != "viewer" else { throw Collab.Failure.readOnly }
        guard epoch == epochs[note] else { throw Collab.Failure.staleEpoch }
        let row = Collab.Update(id: nextID, note_id: note, author_id: author, epoch: epoch, ct: ct, client: nil)
        nextID += 1
        updates.append(row)
        for c in channels where c.note == note && c.open { c.deliver(.update(row)) }
        return row
    }

    func insertSnapshot(note: UUID, author: UUID, upto: Int64, epoch: Int, ct: String) throws {
        guard let role = role(note, author) else { throw Collab.Failure.notMember }
        guard role != "viewer" else { throw Collab.Failure.readOnly }
        guard epoch == epochs[note] else { throw Collab.Failure.staleEpoch }
        snapshots.append(.init(note_id: note, upto: upto, epoch: epoch, ct: ct))
        // collab_compact: the changes it covers go.
        updates.removeAll { $0.note_id == note && $0.id <= upto }
    }

    func pull(note: UUID, user: UUID, after: Int64) -> Collab.Pull {
        guard role(note, user) != nil else { return .init(snapshot: nil, updates: []) }
        let newest = snapshots.filter { $0.note_id == note }.max { ($0.upto, $0.epoch) < ($1.upto, $1.epoch) }
        let use = newest.map { after == 0 || after < $0.upto } ?? false
        let from = use ? newest!.upto : after
        return .init(snapshot: use ? newest : nil, updates: updates.filter { $0.note_id == note && $0.id > from && !inFlight.contains($0.id) })
    }

    func updates(of note: UUID) -> [Collab.Update] { updates.filter { $0.note_id == note } }
    func snapshots(of note: UUID) -> [Collab.Snapshot] { snapshots.filter { $0.note_id == note } }
}

@MainActor
final class FakeCollabTransport: CollabTransport {
    let server: FakeCollabServer
    let me: UUID
    /// No network: every call fails as a dropped connection would.
    var offline = false {
        didSet { for c in server.channels where c.user == me { c.open = !offline } }
    }
    /// Calls made, by name, for tests that check what went where.
    private(set) var calls: [String] = []

    init(server: FakeCollabServer, me: UUID) {
        self.server = server
        self.me = me
    }

    private func call(_ name: String) throws {
        calls.append(name)
        if offline { throw URLError(.notConnectedToInternet) }
    }

    func ownIdentity() async throws -> Collab.IdentityRow? { try call("ownIdentity"); return nil }
    func publishIdentity(publicKey: String, privateWrap: String) async throws { try call("publishIdentity") }

    func memberships() async throws -> [Collab.Membership] {
        try call("memberships")
        return server.members.compactMap { note, people in
            guard let m = people[me] else { return nil }
            return Collab.Membership(note_id: note, role: m.role, epoch: m.epoch, key_wrap: "amb3k.AA==", wrapped_by: server.owners[note] ?? me,
                                     self_wrap: nil, invited_by: server.owners[note], accepted_at: m.accepted ? m.acceptedAt.formatted(Date.ISO8601FormatStyle(includingFractionalSeconds: true)) : nil,
                                     head_ct: nil, owner_id: server.owners[note] ?? me)
        }
    }

    func members(of note: UUID) async throws -> [Collab.Member] {
        try call("members")
        guard server.role(note, me) != nil else { return [] }
        return (server.members[note] ?? [:]).map { .init(user_id: $0.key, role: $0.value.role, display_name: nil, avatar_path: nil, public_key: nil, accepted: true) }
    }

    func share(note: UUID, keyWrap: String, selfWrap: String, head: String) async throws {
        try call("share")
        server.share(note, owner: me)
    }

    func accept(note: UUID, selfWrap: String) async throws { try call("accept") }
    func remove(note: UUID, user: UUID?, epoch: Int, wraps: [Collab.Wrap]) async throws -> Int { try call("remove"); return epoch }
    func updateHead(note: UUID, head: String) async throws { try call("updateHead") }
    func createLink(id: String, note: UUID, role: String, epoch: Int, answerHash: String, keyWrap: String) async throws { try call("createLink") }
    func stopLink(note: UUID) async throws { try call("stopLink") }
    func openLink(id: String, answer: String) async throws -> Collab.OpenedLink? { try call("openLink"); return nil }
    func joinLink(id: String, answer: String, keyWrap: String, selfWrap: String) async throws { try call("joinLink") }
    func publishSealedLink(id: String, note: UUID, ct: String) async throws { try call("publishSealedLink") }
    func stopSealedLink(note: UUID) async throws { try call("stopSealedLink") }
    func publishTemplate(id: String, note: UUID, name: String, json: String) async throws { try call("publishTemplate") }
    func stopTemplate(note: UUID) async throws { try call("stopTemplate") }
    func sharedTemplate(id: String) async throws -> Data? { try call("sharedTemplate"); return nil }

    func leave(note: UUID) async throws {
        try call("leave")
        guard server.role(note, me) != "owner" else { throw Collab.Failure.notOwner }
        server.members[note]?[me] = nil
    }

    func pull(note: UUID, after: Int64) async throws -> Collab.Pull {
        try call("pull")
        return server.pull(note: note, user: me, after: after)
    }

    func send(update ct: String, note: UUID, epoch: Int) async throws -> Collab.Update {
        try call("send update")
        return try server.insertUpdate(note: note, author: me, epoch: epoch, ct: ct)
    }

    func send(snapshot ct: String, note: UUID, upto: Int64, epoch: Int) async throws {
        try call("send snapshot")
        try server.insertSnapshot(note: note, author: me, upto: upto, epoch: epoch, ct: ct)
    }

    func join(note: UUID, onEvent: @escaping @MainActor (Collab.Event) -> Void) async throws -> CollabChannel {
        try call("join")
        guard server.role(note, me) != nil else { throw Collab.Failure.notMember }
        let c = FakeChannel(note: note, user: me, onEvent: onEvent)
        server.channels.append(c)
        return c
    }
}

@MainActor
fileprivate final class FakeChannel: CollabChannel {
    let note: UUID
    let user: UUID
    let onEvent: @MainActor (Collab.Event) -> Void
    var open = true

    init(note: UUID, user: UUID, onEvent: @escaping @MainActor (Collab.Event) -> Void) {
        self.note = note
        self.user = user
        self.onEvent = onEvent
    }

    func deliver(_ event: Collab.Event) {
        // As Realtime does: after the write that made it, never inside it.
        Task { @MainActor in self.onEvent(event) }
    }

    func send(presence ct: String) {}
    func close() { open = false }
}
