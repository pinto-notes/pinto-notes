import CryptoKit
import Foundation
@testable import Pane

/// The collaboration backend in memory, with the rules of the migration
/// (supabase/migrations/20261007163000_collaboration.sql and after): one identity key per account,
/// roles, epochs, stale keys and viewers refused, compaction by snapshot, edit links checked by the
/// hash of their answer, and a live channel per note that only members may join. Each account
/// talks to it through its own `MemoryCollabTransport`, so two (or more) people can share, join and
/// type in one test process, offscreen. Events are delivered on a later main-actor turn, as a network
/// would; `settle()` waits until nothing is in flight.
@MainActor
final class MemoryCollabServer {
    struct Person { var name: String; var avatar: String? = nil }
    private struct MemberRow { var role: String; var epoch: Int; var keyWrap: String; var wrappedBy: UUID; var selfWrap: String?; var invitedBy: UUID?; var acceptedAt: String?; var order: Int }
    private struct LinkRow { var note: UUID; var role: String; var epoch: Int; var answerHash: String; var keyWrap: String; var createdBy: UUID }
    private struct Shared { var owner: UUID; var epoch: Int; var head: String?; var rekeyAfter: Date? = nil }

    var people: [UUID: Person] = [:]
    private(set) var identities: [UUID: Collab.IdentityRow] = [:]
    private var notes: [UUID: Shared] = [:]
    private var members: [UUID: [UUID: MemberRow]] = [:]
    private(set) var updates: [UUID: [Collab.Update]] = [:]
    private(set) var snapshots: [UUID: [Collab.Snapshot]] = [:]
    private var links: [String: LinkRow] = [:]
    private var nextID: Int64 = 0
    private var order = 0
    private var channels: [UUID: [MemoryChannel]] = [:]
    private var inFlight = 0
    /// Calls the server answered, by name, for tests that count them.
    private(set) var calls: [String] = []
    /// While true every call fails as if offline.
    var offline = false
    /// While true, stored changes aren't relayed on the channels (a dropped socket, a change stored
    /// while a channel was still joining).
    var dropRelays = false

    /// Every row the server holds, as text: for tests that check what never reaches it.
    var everythingStored: String {
        [String(describing: identities), String(describing: notes), String(describing: members), String(describing: updates),
         String(describing: snapshots), String(describing: links)].joined(separator: "\n")
    }

    func account(_ name: String, id: UUID = UUID()) -> UUID {
        people[id] = Person(name: name)
        return id
    }

    func transport(for user: UUID) -> MemoryCollabTransport { MemoryCollabTransport(server: self, me: user) }

    /// Plays a server that hands out a key of its own for someone (what a key change looks like).
    func substituteIdentity(of user: UUID, with publicKey: String) {
        guard let row = identities[user] else { return }
        identities[user] = Collab.IdentityRow(public_key: publicKey, private_wrap: row.private_wrap)
    }

    /// Waits (up to two seconds) for something to become true: an event delivered, a channel joined.
    func eventually(_ condition: () -> Bool) async {
        for _ in 0..<400 where !condition() { await settle(); try? await Task.sleep(for: .milliseconds(5)) }
    }

    /// Waits until every event sent so far has been delivered.
    func settle() async {
        for _ in 0..<200 where inFlight > 0 { await Task.yield(); try? await Task.sleep(for: .milliseconds(2)) }
        for _ in 0..<5 { await Task.yield() }
    }

    // MARK: Rules

    struct Offline: Error {}

    func check(_ name: String) throws {
        calls.append(name)
        if offline { throw Offline() }
    }

    func role(_ note: UUID, _ user: UUID) -> String? { members[note]?[user]?.role }

    func publishIdentity(_ user: UUID, publicKey: String, privateWrap: String) throws {
        if let have = identities[user] {
            if have.public_key != publicKey { throw Collab.Failure.identityExists }
            return
        }
        identities[user] = Collab.IdentityRow(public_key: publicKey, private_wrap: privateWrap)
    }

    func memberships(_ user: UUID) -> [Collab.Membership] {
        members.compactMap { note, rows -> Collab.Membership? in
            guard let r = rows[user], let n = notes[note] else { return nil }
            return Collab.Membership(note_id: note, role: r.role, epoch: r.epoch, key_wrap: r.keyWrap, wrapped_by: r.wrappedBy, self_wrap: r.selfWrap,
                                     invited_by: r.invitedBy, accepted_at: r.acceptedAt, head_ct: n.head, owner_id: n.owner,
                                     rekey_after: n.rekeyAfter.map { ISO8601DateFormatter().string(from: $0) })
        }
    }

    func members(of note: UUID, as user: UUID) -> [Collab.Member] {
        guard role(note, user) != nil, let rows = members[note] else { return [] }
        return rows.sorted { $0.value.order < $1.value.order }.map { id, r in
            Collab.Member(user_id: id, role: r.role, display_name: people[id]?.name, avatar_path: people[id]?.avatar,
                          public_key: identities[id]?.public_key, accepted: r.acceptedAt != nil)
        }
    }

    private func addMember(_ note: UUID, _ user: UUID, _ row: MemberRow) {
        order += 1
        var r = row
        r.order = order
        members[note, default: [:]][user] = r
    }

    func share(_ user: UUID, note: UUID, keyWrap: String, selfWrap: String, head: String) throws {
        guard notes[note] == nil else { throw Collab.Failure.server("duplicate key value") }
        notes[note] = Shared(owner: user, epoch: 1, head: head)
        addMember(note, user, MemberRow(role: "owner", epoch: 1, keyWrap: keyWrap, wrappedBy: user, selfWrap: selfWrap, invitedBy: user, acceptedAt: "now", order: 0))
    }

    /// `collab_invite`: the owner adds someone with NK sealed to their identity key.
    func invite(_ caller: UUID, note: UUID, user: UUID, role r: String, keyWrap: String, epoch: Int) throws {
        guard role(note, caller) == "owner" else { throw Collab.Failure.notOwner }
        guard notes[note]?.epoch == epoch else { throw Collab.Failure.staleEpoch }
        addMember(note, user, MemberRow(role: r, epoch: epoch, keyWrap: keyWrap, wrappedBy: caller, selfWrap: nil, invitedBy: caller, acceptedAt: nil, order: 0))
    }

    func accept(_ user: UUID, note: UUID, selfWrap: String) throws {
        guard members[note]?[user] != nil else { throw Collab.Failure.server("That invitation is gone.") }
        members[note]?[user]?.selfWrap = selfWrap
        if members[note]?[user]?.acceptedAt == nil { members[note]?[user]?.acceptedAt = "now" }
    }

    func remove(_ caller: UUID, note: UUID, user: UUID?, epoch: Int, wraps: [Collab.Wrap]) throws -> Int {
        guard role(note, caller) == "owner" else { throw Collab.Failure.notOwner }
        guard user != caller, let current = notes[note]?.epoch else { throw Collab.Failure.server("bad request") }
        guard epoch == current + 1 else { throw Collab.Failure.staleEpoch }
        if let user { members[note]?[user] = nil }
        links = links.filter { $0.value.note != note }
        let stay = Set(members[note]?.keys.map { $0 } ?? [])
        guard Set(wraps.map(\.user_id)).intersection(stay).count == stay.count else { throw Collab.Failure.wrapsIncomplete }
        for w in wraps where stay.contains(w.user_id) {
            members[note]?[w.user_id]?.keyWrap = w.key_wrap
            members[note]?[w.user_id]?.wrappedBy = caller
            members[note]?[w.user_id]?.selfWrap = nil
            members[note]?[w.user_id]?.epoch = epoch
        }
        notes[note]?.epoch = epoch
        notes[note]?.rekeyAfter = nil
        // A removed person's open channel is cut, as the realtime policy refuses them from now on.
        if let user { for c in channels[note] ?? [] where c.user == user { c.cut() } }
        return epoch
    }

    func updateHead(_ user: UUID, note: UUID, head: String) throws {
        guard ["owner", "editor"].contains(role(note, user) ?? "") else { throw Collab.Failure.readOnly }
        notes[note]?.head = head
    }

    func createLink(_ user: UUID, id: String, note: UUID, role r: String, epoch: Int, answerHash: String, keyWrap: String) throws {
        guard role(note, user) == "owner" else { throw Collab.Failure.notOwner }
        links = links.filter { $0.value.note != note || $0.key == id }
        links[id] = LinkRow(note: note, role: r, epoch: epoch, answerHash: answerHash, keyWrap: keyWrap, createdBy: user)
    }

    func leave(_ user: UUID, note: UUID) throws {
        guard let r = role(note, user) else { throw Collab.Failure.notMember }
        guard r != "owner" else { throw Collab.Failure.server("The owner can't leave their own note.") }
        members[note]?[user] = nil
        if notes[note]?.rekeyAfter == nil { notes[note]?.rekeyAfter = .now }
        for c in channels[note] ?? [] where c.user == user { c.cut() }
    }

    /// collab_unshare: the shared note and everything of it go (the notes rows aren't kept here).
    func unshare(_ user: UUID, note: UUID, upto: Int64) throws {
        guard role(note, user) == "owner" else { throw Collab.Failure.notOwner }
        guard !(updates[note] ?? []).contains(where: { $0.id > upto }) else { throw Collab.Failure.server("The note changed meanwhile. Try again.") }
        for c in channels[note] ?? [] { c.cut() }
        notes[note] = nil
        members[note] = nil
        updates[note] = nil
        snapshots[note] = nil
        links = links.filter { $0.value.note != note }
    }

    func stopLink(_ user: UUID, note: UUID) throws {
        guard role(note, user) == "owner" else { throw Collab.Failure.notOwner }
        links = links.filter { $0.value.note != note }
    }

    func openLink(id: String, answer: String) -> Collab.OpenedLink? {
        guard let l = links[id], let raw = Self.unhex(answer), E2EE.hex(SHA256.hash(data: raw)) == l.answerHash, notes[l.note]?.epoch == l.epoch else { return nil }
        return Collab.OpenedLink(note_id: l.note, role: l.role, epoch: l.epoch, key_wrap: l.keyWrap)
    }

    func joinLink(_ user: UUID, id: String, answer: String, keyWrap: String, selfWrap: String) throws {
        guard let opened = openLink(id: id, answer: answer), let l = links[id] else { throw Collab.Failure.server("That link has expired or was stopped.") }
        guard members[opened.note_id]?[user] == nil else { return }
        addMember(opened.note_id, user, MemberRow(role: opened.role, epoch: opened.epoch, keyWrap: keyWrap, wrappedBy: user, selfWrap: selfWrap,
                                                 invitedBy: l.createdBy, acceptedAt: "now", order: 0))
    }

    func pull(_ user: UUID, note: UUID, after: Int64) throws -> Collab.Pull {
        guard role(note, user) != nil else { return Collab.Pull(snapshot: nil, updates: []) }
        let newest = snapshots[note]?.max { ($0.upto, $0.epoch) < ($1.upto, $1.epoch) }
        let snapshot = newest.flatMap { s in after == 0 || after < s.upto ? s : nil }
        let from = snapshot?.upto ?? after
        return Collab.Pull(snapshot: snapshot, updates: (updates[note] ?? []).filter { $0.id > from })
    }

    func addUpdate(_ user: UUID, note: UUID, epoch: Int, ct: String) throws -> Collab.Update {
        guard ["owner", "editor"].contains(role(note, user) ?? "") else { throw Collab.Failure.readOnly }
        guard notes[note]?.epoch == epoch else { throw Collab.Failure.staleEpoch }
        nextID += 1
        let u = Collab.Update(id: nextID, note_id: note, author_id: user, epoch: epoch, ct: ct, client: nil)
        updates[note, default: []].append(u)
        if !dropRelays { for c in channels[note] ?? [] { deliver(c, .update(u)) } }
        return u
    }

    func addSnapshot(_ user: UUID, note: UUID, upto: Int64, epoch: Int, ct: String) throws {
        guard ["owner", "editor"].contains(role(note, user) ?? "") else { throw Collab.Failure.readOnly }
        guard notes[note]?.epoch == epoch else { throw Collab.Failure.staleEpoch }
        snapshots[note, default: []].append(Collab.Snapshot(note_id: note, upto: upto, epoch: epoch, ct: ct))
        updates[note] = updates[note]?.filter { $0.id > upto }
    }

    // MARK: Channels

    func join(_ user: UUID, note: UUID, onEvent: @escaping @MainActor (Collab.Event) -> Void) throws -> MemoryChannel {
        guard role(note, user) != nil else { throw Collab.Failure.notMember }
        let c = MemoryChannel(server: self, note: note, user: user, onEvent: onEvent)
        channels[note, default: []].append(c)
        return c
    }

    func channelCount(_ note: UUID) -> Int { channels[note]?.count ?? 0 }

    /// Every channel on the note rejoins (Realtime says it relays changes again).
    func rejoin(_ note: UUID) {
        for c in channels[note] ?? [] { deliver(c, .reconnected) }
    }

    func presence(from c: MemoryChannel, ct: String) {
        for other in channels[c.note] ?? [] where other !== c && other.user != c.user { deliver(other, .presence(user: c.user, ct: ct)) }
    }

    func closed(_ c: MemoryChannel) {
        channels[c.note]?.removeAll { $0 === c }
        guard !(channels[c.note] ?? []).contains(where: { $0.user == c.user }) else { return }
        for other in channels[c.note] ?? [] { deliver(other, .leave(c.user)) }
    }

    private func deliver(_ c: MemoryChannel, _ event: Collab.Event) {
        inFlight += 1
        Task { @MainActor in
            await Task.yield()
            if c.isOpen { c.onEvent(event) }
            inFlight -= 1
        }
    }

    static func unhex(_ s: String) -> Data? {
        guard s.count % 2 == 0 else { return nil }
        var d = Data()
        var i = s.startIndex
        while i < s.endIndex {
            let j = s.index(i, offsetBy: 2)
            guard let b = UInt8(s[i..<j], radix: 16) else { return nil }
            d.append(b)
            i = j
        }
        return d
    }
}

@MainActor
final class MemoryChannel: CollabChannel {
    let server: MemoryCollabServer
    let note: UUID
    let user: UUID
    let onEvent: @MainActor (Collab.Event) -> Void
    private(set) var isOpen = true

    init(server: MemoryCollabServer, note: UUID, user: UUID, onEvent: @escaping @MainActor (Collab.Event) -> Void) {
        self.server = server
        self.note = note
        self.user = user
        self.onEvent = onEvent
    }

    func send(presence ct: String) {
        guard isOpen else { return }
        server.presence(from: self, ct: ct)
    }

    func close() {
        guard isOpen else { return }
        isOpen = false
        server.closed(self)
    }

    /// The server dropped this channel (its person was removed).
    func cut() { close() }
}

/// One account's view of the in-memory server, as `SupabaseCollabTransport` is of the real one.
@MainActor
final class MemoryCollabTransport: CollabTransport {
    let server: MemoryCollabServer
    let me: UUID

    init(server: MemoryCollabServer, me: UUID) {
        self.server = server
        self.me = me
    }

    func ownIdentity() async throws -> Collab.IdentityRow? { try server.check("identity"); return server.identities[me] }
    func publishIdentity(publicKey: String, privateWrap: String) async throws {
        try server.check("publish_identity")
        try server.publishIdentity(me, publicKey: publicKey, privateWrap: privateWrap)
    }
    func memberships() async throws -> [Collab.Membership] { try server.check("memberships"); return server.memberships(me) }
    func members(of note: UUID) async throws -> [Collab.Member] { try server.check("members"); return server.members(of: note, as: me) }
    func share(note: UUID, keyWrap: String, selfWrap: String, head: String) async throws {
        try server.check("share")
        try server.share(me, note: note, keyWrap: keyWrap, selfWrap: selfWrap, head: head)
    }
    func accept(note: UUID, selfWrap: String) async throws { try server.check("accept"); try server.accept(me, note: note, selfWrap: selfWrap) }
    @discardableResult
    func remove(note: UUID, user: UUID?, epoch: Int, wraps: [Collab.Wrap]) async throws -> Int {
        try server.check("remove")
        return try server.remove(me, note: note, user: user, epoch: epoch, wraps: wraps)
    }
    func updateHead(note: UUID, head: String) async throws { try server.check("head"); try server.updateHead(me, note: note, head: head) }
    func createLink(id: String, note: UUID, role: String, epoch: Int, answerHash: String, keyWrap: String) async throws {
        try server.check("create_link")
        try server.createLink(me, id: id, note: note, role: role, epoch: epoch, answerHash: answerHash, keyWrap: keyWrap)
    }
    func leave(note: UUID) async throws { try server.check("leave"); try server.leave(me, note: note) }
    func unshare(note: UUID, body: String, head: String, upto: Int64) async throws { try server.check("unshare"); try server.unshare(me, note: note, upto: upto) }
    func stopLink(note: UUID) async throws { try server.check("stop_link"); try server.stopLink(me, note: note) }
    func openLink(id: String, answer: String) async throws -> Collab.OpenedLink? { try server.check("open_link"); return server.openLink(id: id, answer: answer) }
    func joinLink(id: String, answer: String, keyWrap: String, selfWrap: String) async throws {
        try server.check("join_link")
        try server.joinLink(me, id: id, answer: answer, keyWrap: keyWrap, selfWrap: selfWrap)
    }
    func publishSealedLink(id: String, note: UUID, ct: String) async throws { try server.check("publish_sealed_link") }
    func stopSealedLink(note: UUID) async throws { try server.check("stop_sealed_link") }
    func publishTemplate(id: String, note: UUID, name: String, json: String) async throws { try server.check("publish_template") }
    func stopTemplate(note: UUID) async throws { try server.check("stop_template") }
    func sharedTemplate(id: String) async throws -> Data? { try server.check("shared_template"); return nil }
    func pull(note: UUID, after: Int64) async throws -> Collab.Pull { try server.check("pull"); return try server.pull(me, note: note, after: after) }
    func send(update ct: String, note: UUID, epoch: Int) async throws -> Collab.Update {
        try server.check("update")
        return try server.addUpdate(me, note: note, epoch: epoch, ct: ct)
    }
    func send(snapshot ct: String, note: UUID, upto: Int64, epoch: Int) async throws {
        try server.check("snapshot")
        try server.addSnapshot(me, note: note, upto: upto, epoch: epoch, ct: ct)
    }
    func join(note: UUID, onEvent: @escaping @MainActor (Collab.Event) -> Void) async throws -> CollabChannel {
        try server.check("join")
        return try server.join(me, note: note, onEvent: onEvent)
    }
}
