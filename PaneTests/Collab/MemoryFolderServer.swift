import CryptoKit
import Foundation
@testable import Pane

/// Shared folders in memory, with the rules of 20261118120000_shared_folders.sql: roles, folder
/// keys by epoch, the tree, which note is where, members joining notes through the folder, links,
/// removal, leaving and stopping. Notes themselves live in `MemoryCollabServer`.
@MainActor
final class MemoryFolderServer {
    unowned let notes: MemoryCollabServer

    struct Member { var role: String; var epoch: Int; var keyWrap: String; var wrappedBy: UUID?; var selfWrap: String?; var invitedBy: UUID?; var acceptedAt: String? }
    struct Root { var owner: UUID; var epoch: Int; var rekeyAfter: Date? }
    struct Link { var root: UUID; var role: String; var epoch: Int; var answerHash: String; var keyWrap: String }
    struct Placed { var folder: UUID; var wrap: String; var noteEpoch: Int }

    private(set) var roots: [UUID: Root] = [:]
    private(set) var members: [UUID: [UUID: Member]] = [:]
    private(set) var tree: [UUID: [UUID: Collab.FolderRow]] = [:]
    private(set) var placed: [UUID: [UUID: Placed]] = [:]
    /// Note memberships that came through a folder: note -> users.
    private(set) var viaFolder: [UUID: Set<UUID>] = [:]
    private var links: [String: Link] = [:]
    private var ended: [UUID: [UUID: Collab.FolderAccessEnded]] = [:]

    init(notes: MemoryCollabServer) { self.notes = notes }

    func role(_ root: UUID, _ user: UUID) -> String? { members[root]?[user]?.role }
    private func accepted(_ root: UUID, _ user: UUID) -> Bool { members[root]?[user]?.acceptedAt != nil }
    private func editor(_ root: UUID, _ user: UUID) throws {
        guard let r = role(root, user), accepted(root, user) else { throw Collab.Failure.notMember }
        guard r != "viewer" else { throw Collab.Failure.readOnly }
    }

    func share(_ user: UUID, root: UUID, keyWrap: String, selfWrap: String, name: String) throws {
        guard roots[root] == nil else { throw Collab.Failure.server("duplicate key value") }
        roots[root] = Root(owner: user, epoch: 1)
        members[root] = [user: Member(role: "owner", epoch: 1, keyWrap: keyWrap, wrappedBy: user, selfWrap: selfWrap, invitedBy: user, acceptedAt: "now")]
        tree[root] = [root: Collab.FolderRow(id: root, parent_id: nil, name: name, sort_index: 0, deleted: false)]
    }

    func memberships(_ user: UUID) -> [Collab.FolderMembership] {
        members.compactMap { root, rows in
            guard let m = rows[user], let r = roots[root] else { return nil }
            return Collab.FolderMembership(root: root, role: m.role, epoch: m.epoch, key_wrap: m.keyWrap, wrapped_by: m.wrappedBy, self_wrap: m.selfWrap,
                                           invited_by: m.invitedBy, accepted_at: m.acceptedAt, owner_id: r.owner,
                                           rekey_after: m.role == "owner" ? r.rekeyAfter.map { ISO8601DateFormatter().string(from: $0) } : nil)
        }
    }

    func accept(_ user: UUID, root: UUID, epoch: Int, selfWrap: String) throws {
        guard members[root]?[user] != nil, roots[root]?.epoch == epoch else { throw Collab.Failure.staleEpoch }
        members[root]?[user]?.selfWrap = selfWrap
        if members[root]?[user]?.acceptedAt == nil { members[root]?[user]?.acceptedAt = "now" }
    }

    func folderMembers(_ user: UUID, root: UUID) -> [Collab.Member] {
        guard role(root, user) != nil, let rows = members[root] else { return [] }
        return rows.sorted { ($0.value.role == "owner" ? 0 : 1, $0.key.uuidString) < ($1.value.role == "owner" ? 0 : 1, $1.key.uuidString) }.map { id, m in
            Collab.Member(user_id: id, role: m.role, display_name: notes.people[id]?.name, avatar_path: nil,
                          public_key: notes.identities[id]?.public_key, accepted: m.acceptedAt != nil)
        }
    }

    func folders(_ user: UUID, root: UUID) -> [Collab.FolderRow] {
        guard role(root, user) != nil else { return [] }
        return Array(tree[root]?.values ?? [:].values)
    }

    func put(_ user: UUID, root: UUID, folder: UUID, parent: UUID, name: String, sort: Double) throws {
        try editor(root, user)
        if folder == root { tree[root]?[root]?.name = name; return }
        guard tree[root]?[parent] != nil, parent != folder else { throw Collab.Failure.server("bad request") }
        tree[root]?[folder] = Collab.FolderRow(id: folder, parent_id: parent, name: name, sort_index: sort, deleted: false)
    }

    func drop(_ user: UUID, root: UUID, folder: UUID) throws {
        try editor(root, user)
        guard folder != root else { throw Collab.Failure.server("bad request") }
        var gone: Set<UUID> = [folder]
        var grew = true
        while grew {
            grew = false
            for (id, row) in tree[root] ?? [:] where !gone.contains(id) && row.parent_id.map(gone.contains) == true { gone.insert(id); grew = true }
        }
        for id in gone { tree[root]?[id]?.deleted = true }
    }

    func notesIn(_ user: UUID, root: UUID) -> [Collab.FolderNote] {
        guard role(root, user) != nil else { return [] }
        return (placed[root] ?? [:]).compactMap { note, p in
            guard let owner = notes.noteOwner(note) else { return nil }
            return Collab.FolderNote(note_id: note, folder_id: p.folder, folder_wrap: p.wrap, owner_id: owner, note_epoch: p.noteEpoch, joined: notes.isMember(note, user))
        }
    }

    func add(_ user: UUID, root: UUID, note: UUID, folder: UUID, wrap: String) throws {
        try editor(root, user)
        guard notes.isMember(note, user), ["owner", "editor"].contains(notes.role(note, user) ?? "") else { throw Collab.Failure.notMember }
        guard tree[root]?[folder]?.deleted == false else { throw Collab.Failure.server("bad request") }
        guard placed.values.allSatisfy({ $0[note] == nil }) || placed[root]?[note] != nil else { throw Collab.Failure.server("That note is in another shared folder.") }
        placed[root, default: [:]][note] = Placed(folder: folder, wrap: wrap, noteEpoch: CollabCrypto.wrapNoteEpoch(wrap) ?? 1)
    }

    func move(_ user: UUID, root: UUID, note: UUID, folder: UUID) throws {
        try editor(root, user)
        guard placed[root]?[note] != nil, tree[root]?[folder]?.deleted == false else { throw Collab.Failure.server("bad request") }
        placed[root]?[note]?.folder = folder
    }

    func rewrap(_ user: UUID, root: UUID, note: UUID, wrap: String) throws {
        guard notes.isMember(note, user), placed[root]?[note] != nil else { throw Collab.Failure.notMember }
        placed[root]?[note]?.wrap = wrap
        placed[root]?[note]?.noteEpoch = CollabCrypto.wrapNoteEpoch(wrap) ?? 1
    }

    /// Out of the folder: everyone who came in through it loses the note; its maker keeps it.
    func remove(_ user: UUID, root: UUID, note: UUID) throws {
        try editor(root, user)
        takeOut(note, root: root, by: user)
    }

    private func takeOut(_ note: UUID, root: UUID, by: UUID?) {
        placed[root]?[note] = nil
        for u in viaFolder[note] ?? [] { notes.endMembership(note, user: u, .moved, by: by, rekey: true) }
        viaFolder[note] = nil
    }

    func joinNote(_ user: UUID, root: UUID, note: UUID, epoch: Int, keyWrap: String, selfWrap: String) throws {
        guard let r = role(root, user), accepted(root, user), placed[root]?[note] != nil else { throw Collab.Failure.notMember }
        guard !notes.isMember(note, user) else { return }
        try notes.folderJoin(user, note: note, role: r == "owner" ? "editor" : r, epoch: epoch, keyWrap: keyWrap, selfWrap: selfWrap)
        viaFolder[note, default: []].insert(user)
    }

    func setRole(_ caller: UUID, root: UUID, user: UUID, role r: String) throws {
        guard role(root, caller) == "owner" else { throw Collab.Failure.notOwner }
        guard ["editor", "viewer"].contains(r), user != caller, members[root]?[user] != nil else { throw Collab.Failure.server("bad request") }
        members[root]?[user]?.role = r
        for (note, users) in viaFolder where users.contains(user) && placed[root]?[note] != nil { notes.setNoteRole(note, user: user, role: r) }
    }

    /// Someone goes: their folder membership and every note membership that came through it;
    /// the notes they made leave the folder with them. The owner's device gives the folder a new key.
    private func out(_ user: UUID, root: UUID, reason: Collab.AccessEnded.Reason, by: UUID?) {
        members[root]?[user] = nil
        ended[root, default: [:]][user] = Collab.FolderAccessEnded(root: root, reason: reason.rawValue, at: "now")
        for (note, _) in placed[root] ?? [:] {
            if notes.noteOwner(note) == user { takeOut(note, root: root, by: user); continue }
            if viaFolder[note]?.contains(user) == true {
                notes.endMembership(note, user: user, reason, by: by, rekey: true)
                viaFolder[note]?.remove(user)
            }
        }
        roots[root]?.rekeyAfter = .now
    }

    func removeMember(_ caller: UUID, root: UUID, user: UUID) throws {
        guard role(root, caller) == "owner" else { throw Collab.Failure.notOwner }
        guard user != caller, members[root]?[user] != nil else { throw Collab.Failure.notMember }
        out(user, root: root, reason: .removed, by: caller)
        links = links.filter { $0.value.root != root }
    }

    func leave(_ user: UUID, root: UUID) throws {
        guard let r = role(root, user) else { throw Collab.Failure.notMember }
        guard r != "owner" else { throw Collab.Failure.server("The owner can't leave their own folder.") }
        out(user, root: root, reason: .left, by: nil)
    }

    func rekey(_ caller: UUID, root: UUID, epoch: Int, wraps: [Collab.Wrap], selfWrap: String, noteWraps: [Collab.NoteWrap]) throws {
        guard role(root, caller) == "owner", let current = roots[root]?.epoch else { throw Collab.Failure.notOwner }
        guard epoch == current + 1 else { throw Collab.Failure.staleEpoch }
        let stay = Set(members[root]?.filter { $0.value.acceptedAt != nil }.map(\.key) ?? [])
        guard Set(wraps.map(\.user_id)).isSuperset(of: stay) else { throw Collab.Failure.wrapsIncomplete }
        for w in wraps where stay.contains(w.user_id) {
            members[root]?[w.user_id]?.keyWrap = w.key_wrap
            members[root]?[w.user_id]?.wrappedBy = caller
            members[root]?[w.user_id]?.selfWrap = w.user_id == caller ? selfWrap : nil
            members[root]?[w.user_id]?.epoch = epoch
        }
        for w in noteWraps where placed[root]?[w.note_id] != nil {
            placed[root]?[w.note_id]?.wrap = w.folder_wrap
            placed[root]?[w.note_id]?.noteEpoch = CollabCrypto.wrapNoteEpoch(w.folder_wrap) ?? 1
        }
        roots[root]?.epoch = epoch
        roots[root]?.rekeyAfter = nil
        links = links.filter { $0.value.root != root }
    }

    func unshare(_ caller: UUID, root: UUID) throws {
        guard role(root, caller) == "owner" else { throw Collab.Failure.notOwner }
        for u in (members[root]?.keys).map(Array.init) ?? [] where u != caller { out(u, root: root, reason: .unshared, by: caller) }
        for (note, _) in placed[root] ?? [:] { takeOut(note, root: root, by: caller) }
        roots[root] = nil
        members[root] = nil
        tree[root] = nil
        placed[root] = nil
        links = links.filter { $0.value.root != root }
    }

    func accessEnded(_ user: UUID) -> [Collab.FolderAccessEnded] {
        ended.compactMap { root, rows in members[root]?[user] == nil ? rows[user] : nil }
    }

    func createLink(_ user: UUID, id: String, root: UUID, role r: String, epoch: Int, answerHash: String, keyWrap: String) throws {
        guard role(root, user) == "owner", roots[root]?.epoch == epoch else { throw Collab.Failure.notOwner }
        links = links.filter { $0.value.root != root }
        links[id] = Link(root: root, role: r, epoch: epoch, answerHash: answerHash, keyWrap: keyWrap)
    }

    func stopLink(_ user: UUID, root: UUID) throws {
        guard role(root, user) == "owner" else { throw Collab.Failure.notOwner }
        links = links.filter { $0.value.root != root }
    }

    func openLink(id: String, answer: String) -> Collab.OpenedFolderLink? {
        guard let l = links[id], let raw = MemoryCollabServer.unhex(answer), E2EE.hex(SHA256.hash(data: raw)) == l.answerHash, roots[l.root]?.epoch == l.epoch else { return nil }
        return Collab.OpenedFolderLink(root: l.root, role: l.role, epoch: l.epoch, key_wrap: l.keyWrap,
                                       owner_name: roots[l.root].flatMap { notes.people[$0.owner]?.name }, folder_name: tree[l.root]?[l.root]?.name)
    }

    func joinLink(_ user: UUID, id: String, answer: String) throws -> Collab.OpenedFolderLink? {
        guard let opened = openLink(id: id, answer: answer) else { throw Collab.Failure.server("That link has expired or was stopped.") }
        if members[opened.root]?[user] == nil {
            members[opened.root, default: [:]][user] = Member(role: opened.role, epoch: opened.epoch, keyWrap: opened.key_wrap, wrappedBy: nil, selfWrap: nil,
                                                              invitedBy: roots[opened.root]?.owner, acceptedAt: nil)
        }
        ended[opened.root]?[user] = nil
        return opened
    }

    func linkKind(_ id: String) -> String? { links[id] != nil ? "folder" : nil }
}

extension CollabCrypto {
    /// The note epoch an `amb3w` box is for.
    static func wrapNoteEpoch(_ wrap: String) -> Int? {
        let parts = wrap.split(separator: ".", maxSplits: 3)
        return parts.count == 4 ? Int(parts[2]) : nil
    }
}

extension MemoryCollabTransport: FolderTransport {
    private var f: MemoryFolderServer { server.folders }
    func shareFolder(root: UUID, keyWrap: String, selfWrap: String, name: String) async throws {
        try server.check("share_folder"); try f.share(me, root: root, keyWrap: keyWrap, selfWrap: selfWrap, name: name)
    }
    func folderMemberships() async throws -> [Collab.FolderMembership] { try server.check("folder_memberships"); return f.memberships(me) }
    func acceptFolder(root: UUID, epoch: Int, selfWrap: String) async throws { try server.check("folder_accept"); try f.accept(me, root: root, epoch: epoch, selfWrap: selfWrap) }
    func folderMembers(root: UUID) async throws -> [Collab.Member] { try server.check("folder_members"); return f.folderMembers(me, root: root) }
    func folderTree(root: UUID) async throws -> [Collab.FolderRow] { try server.check("folder_folders"); return f.folders(me, root: root) }
    func putFolder(root: UUID, folder: UUID, parent: UUID, name: String, sort: Double) async throws {
        try server.check("folder_put"); try f.put(me, root: root, folder: folder, parent: parent, name: name, sort: sort)
    }
    func dropFolder(root: UUID, folder: UUID) async throws { try server.check("folder_drop"); try f.drop(me, root: root, folder: folder) }
    func folderNotes(root: UUID) async throws -> [Collab.FolderNote] { try server.check("folder_notes"); return f.notesIn(me, root: root) }
    func addNote(root: UUID, note: UUID, folder: UUID, wrap: String) async throws { try server.check("folder_note_add"); try f.add(me, root: root, note: note, folder: folder, wrap: wrap) }
    func moveNote(root: UUID, note: UUID, folder: UUID) async throws { try server.check("folder_note_move"); try f.move(me, root: root, note: note, folder: folder) }
    func rewrapNote(root: UUID, note: UUID, wrap: String) async throws { try server.check("folder_note_rewrap"); try f.rewrap(me, root: root, note: note, wrap: wrap) }
    func removeNote(root: UUID, note: UUID) async throws { try server.check("folder_note_remove"); try f.remove(me, root: root, note: note) }
    func joinNote(root: UUID, note: UUID, epoch: Int, keyWrap: String, selfWrap: String) async throws {
        try server.check("folder_join_note"); try f.joinNote(me, root: root, note: note, epoch: epoch, keyWrap: keyWrap, selfWrap: selfWrap)
    }
    func setFolderRole(root: UUID, user: UUID, role: String) async throws { try server.check("folder_set_role"); try f.setRole(me, root: root, user: user, role: role) }
    func removeFromFolder(root: UUID, user: UUID) async throws { try server.check("folder_remove"); try f.removeMember(me, root: root, user: user) }
    func leaveFolder(root: UUID) async throws { try server.check("folder_leave"); try f.leave(me, root: root) }
    func rekeyFolder(root: UUID, epoch: Int, wraps: [Collab.Wrap], selfWrap: String, noteWraps: [Collab.NoteWrap]) async throws {
        try server.check("folder_rekey"); try f.rekey(me, root: root, epoch: epoch, wraps: wraps, selfWrap: selfWrap, noteWraps: noteWraps)
    }
    func unshareFolder(root: UUID) async throws { try server.check("unshare_folder"); try f.unshare(me, root: root) }
    func folderAccessEnded() async throws -> [Collab.FolderAccessEnded] { try server.check("folder_access_ended"); return f.accessEnded(me) }
    func createFolderLink(id: String, root: UUID, role: String, epoch: Int, answerHash: String, keyWrap: String) async throws {
        try server.check("folder_create_link"); try f.createLink(me, id: id, root: root, role: role, epoch: epoch, answerHash: answerHash, keyWrap: keyWrap)
    }
    func stopFolderLink(root: UUID) async throws { try server.check("folder_stop_link"); try f.stopLink(me, root: root) }
    func openFolderLink(id: String, answer: String) async throws -> Collab.OpenedFolderLink? { try server.check("folder_open_link"); return f.openLink(id: id, answer: answer) }
    func joinFolderLink(id: String, answer: String) async throws -> Collab.OpenedFolderLink? { try server.check("folder_join_link"); return try f.joinLink(me, id: id, answer: answer) }
    func linkKind(id: String) async throws -> String? { try server.check("link_kind"); return f.linkKind(id) ?? (server.hasLink(id) ? "note" : nil) }
}
