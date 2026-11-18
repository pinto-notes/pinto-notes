import Foundation

/// Share for a folder: the note's Share sheet over a shared folder (FolderSharing). People are the
/// folder's members, the link is the folder's, Leave leaves the folder and Stop Sharing stops it.
/// The sheet is made for a note, so it's given a stand-in note with the folder's name, never saved.
@MainActor
final class FolderShareBackend: ShareBackend {
    let folder: Folder
    let sharing: FolderSharing
    let store: CollabStore
    let standIn: Note
    private var members: [Collab.Member] = []
    private var fetched: Date?
    private var fetching = false

    init(folder: Folder, sharing: FolderSharing, store: CollabStore) {
        self.folder = folder
        self.sharing = sharing
        self.store = store
        standIn = Note(body: folder.name)
        load()
    }

    private var root: FolderSharing.Root? { sharing.root(of: folder) }

    /// The members, fetched again every few seconds while the sheet asks.
    private func load(force: Bool = false) {
        guard let root, !fetching, force || fetched.map({ Date.now.timeIntervalSince($0) > 3 }) ?? true else { return }
        fetching = true
        Task {
            let m = await sharing.members(root.id)
            store.checkKeys(m)
            members = m
            fetched = .now
            fetching = false
        }
    }

    func shareState(for _: Note) -> ShareState {
        load()
        guard let root else {
            return ShareState(link: nil, access: .off, people: [.init(id: store.me ?? UUID(), name: store.name, isMe: true, role: "owner")])
        }
        sharing.restoreLink(root.id)
        let me = store.me
        var people = members.map { m in
            ShareState.Person(id: m.user_id, name: m.user_id == me ? store.name : (m.display_name ?? "Someone"), isMe: m.user_id == me, role: m.role,
                              safetyCode: m.user_id == me ? nil : store.safetyCode(with: m), photo: store.photos[m.user_id])
        }
        people.sort { ($0.isMe ? 0 : 1) < ($1.isMe ? 0 : 1) }
        if people.isEmpty { people = [.init(id: me ?? UUID(), name: store.name, isMe: true, role: root.role)] }
        return ShareState(link: sharing.linkURL(root.id), access: sharing.linkAccess[root.id] ?? .off, people: people)
    }

    func setAccess(_ access: ShareState.Access, for _: Note) async throws {
        try await sharing.setAccess(access, for: folder)
        load(force: true)
    }

    func remove(_ user: UUID, from _: Note) async throws {
        guard let root else { return }
        try await sharing.remove(user, from: root.id)
        members.removeAll { $0.user_id == user }
        load(force: true)
    }

    func setRole(_ role: ShareState.Role, of user: UUID, in _: Note) async throws {
        guard let root else { return }
        try await sharing.setRole(role, of: user, in: root.id)
        if let i = members.firstIndex(where: { $0.user_id == user }) {
            let m = members[i]
            members[i] = Collab.Member(user_id: m.user_id, role: role.rawValue, display_name: m.display_name, avatar_path: m.avatar_path, public_key: m.public_key, accepted: m.accepted)
        }
    }

    func leave(_ _: Note) async throws {
        guard let root else { return }
        try await sharing.leave(root.id)
    }

    func stop() async throws {
        guard let root else { return }
        try await sharing.stopSharing(root.id)
    }

    func markVerified(_ user: UUID, in _: Note) {
        if let change = store.keyChanges.first(where: { $0.user == user }) { store.trust(change) }
        guard let key = members.first(where: { $0.user_id == user })?.public_key.flatMap({ Data(base64Encoded: $0) }) else { return }
        store.verified.mark(user, key: key)
    }
}
