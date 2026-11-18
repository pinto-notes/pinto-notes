import CryptoKit
import Foundation
import SwiftData
import os

private let log = Logger(subsystem: "dev.emilwagman.pane", category: "collab")

/// Shared folders (docs/Technical/collaboration-design.md, section 8): a folder and everything in
/// it, shared with the same people. Underneath, every note in it is an ordinary shared note; this
/// keeps the folder's tree and its notes the same for every member.
///
/// Each look (`sync`, with the half-minute membership check) goes through your shared folders:
/// - the folder key (FK) is opened from your membership, and taken again after it changes;
/// - the folder and its subfolders are made, renamed, moved and deleted here as on the server, or
///   on the server as here, whichever changed since the last look (`FolderSyncState`);
/// - notes in it you aren't in yet are joined with their key under FK, and placed;
/// - notes made in it, moved into it or written there by an AI are shared into it; notes moved
///   out of it or deleted leave it, for everyone.
@MainActor
final class FolderSharing {
    unowned let store: CollabStore
    let transport: any FolderTransport
    let context: ModelContext
    private(set) var state: FolderSyncState
    private let saveState: @MainActor (FolderSyncState) -> Void

    /// Your shared folders, by the shared folder's id (the owner's folder id).
    private(set) var roots: [UUID: Root] = [:]
    /// What each folder's link lets people do. No entry: the link is off.
    var linkAccess: [UUID: ShareState.Access] = [:]
    var links: [UUID: (id: String, secret: Data)] = [:]
    /// Folders whose sharing ended here (you left, were removed, or it was stopped): told once.
    var onLost: ((FolderRemoval) -> Void)?
    /// Looks in progress, for tests to wait on.
    private(set) var syncs = 0
    private var running: Task<Void, Never>?

    struct Root: Equatable {
        let id: UUID
        var role: String
        var epoch: Int
        var fk: SymmetricKey
        let owner: UUID
        var isOwner: Bool { role == "owner" }
        var canEdit: Bool { role != "viewer" }

        static func == (a: Root, b: Root) -> Bool { a.id == b.id && a.role == b.role && a.epoch == b.epoch && a.owner == b.owner }
    }

    init(store: CollabStore, transport: any FolderTransport, context: ModelContext, state: FolderSyncState = FolderSyncState(),
         save: @escaping @MainActor (FolderSyncState) -> Void = { _ in }) {
        self.store = store
        self.transport = transport
        self.context = context
        self.state = state
        self.saveState = save
    }

    var me: UUID? { store.me }

    // MARK: Ids

    /// Your folder for a shared folder or subfolder: yours when you made it (its id is the
    /// shared one), else the id your data key gives it, the same on each of your devices.
    func localID(_ shared: UUID) throws -> UUID {
        if context.folder(shared) != nil { return shared }
        return SharedFolders.folderID(for: shared, dataKey: try store.dataKey())
    }

    /// The shared folder a folder of yours is in (the folder itself or one above it), if any.
    func root(of folder: Folder?) -> Root? {
        let tops = Dictionary(roots.values.compactMap { r in (try? localID(r.id)).map { ($0, r) } }, uniquingKeysWith: { a, _ in a })
        var f = folder
        while let c = f {
            if let r = tops[c.id] { return r }
            f = c.parent
        }
        return nil
    }

    /// True for a folder that's shared: the shared folder itself.
    func isSharedRoot(_ folder: Folder) -> Bool {
        roots.values.contains { (try? localID($0.id)) == folder.id }
    }

    func sharedRoot(for folder: Folder) -> Root? {
        roots.values.first { (try? localID($0.id)) == folder.id }
    }

    /// The shared id of a folder in a shared folder's tree.
    private func sharedID(of folder: Folder) -> UUID { state.sharedID[folder.id] ?? folder.id }

    // MARK: Sharing a folder

    /// Your folder becomes a shared folder: a folder key, your membership, its tree, and every note
    /// in it shared into it.
    func share(_ folder: Folder) async throws {
        guard let me else { throw Collab.Failure.notSignedIn }
        if roots[folder.id] != nil { return }
        let identity = try await store.ensureIdentity()
        let dk = try store.dataKey()
        let fk = SymmetricKey(size: .bits256)
        let toSelf = try CollabCrypto.sealFolderKey(fk, from: identity, to: identity.publicRaw, root: folder.id, epoch: 1, recipient: me, by: me)
        let name = try CollabCrypto.sealFolderName(folder.name, fk: fk, root: folder.id, epoch: 1, folder: folder.id)
        try await transport.shareFolder(root: folder.id, keyWrap: toSelf, selfWrap: try CollabCrypto.folderSelfWrap(fk, dataKey: dk, root: folder.id, epoch: 1), name: name)
        roots[folder.id] = Root(id: folder.id, role: "owner", epoch: 1, fk: fk, owner: me)
        state.sharedID[folder.id] = folder.id
        state.seenFolders[folder.id] = .init(name: folder.name, parent: nil)
        persist()
        await syncRoot(roots[folder.id]!)
    }

    // MARK: Looking

    /// One look at every shared folder. Looks don't overlap: a second waits for the first.
    func sync() async {
        if let running { await running.value }
        let t = Task { await syncNow() }
        running = t
        await t.value
        running = nil
    }

    private func syncNow() async {
        syncs += 1
        let rows: [Collab.FolderMembership]
        do { rows = try await transport.folderMemberships() } catch {
            log.error("folder memberships: \(String(describing: error), privacy: .public)")
            return
        }
        var seen: Set<UUID> = []
        for row in rows {
            seen.insert(row.root)
            guard let root = await take(row) else { continue }
            roots[row.root] = root
            if root.isOwner, row.rekey_after != nil { await rekey(root) }
            if let r = roots[row.root] { await syncRoot(r) }
        }
        // Folders you're no longer in (only those this device knew): taken out, once the server
        // says why.
        for id in Set(state.roots).subtracting(seen) {
            let ended = (try? await transport.folderAccessEnded())?.first { $0.root == id }
            lose(id, reason: ended?.reason ?? "removed")
        }
        persist()
    }

    /// FK from your membership: your own copy under your data key, else the copy sealed to you
    /// (after the folder's key changed, or the first time), which is then kept as your own.
    private func take(_ row: Collab.FolderMembership) async -> Root? {
        guard let me, let dk = try? store.dataKey() else { return nil }
        if let wrap = row.self_wrap, let fk = try? CollabCrypto.openFolderSelfWrap(wrap, dataKey: dk, root: row.root, epoch: row.epoch) {
            return Root(id: row.root, role: row.role, epoch: row.epoch, fk: fk, owner: row.owner_id)
        }
        do {
            let identity = try await store.ensureIdentity()
            let members = try await transport.folderMembers(root: row.root)
            store.checkKeys(members)
            guard let by = row.wrapped_by, let sealer = members.first(where: { $0.user_id == by }),
                  let key = store.identityKeys?.trustedKey(of: sealer) else { return nil }
            let fk = try CollabCrypto.openFolderKey(row.key_wrap, me: identity, from: key, root: row.root, epoch: row.epoch, sender: by, recipient: me)
            try await transport.acceptFolder(root: row.root, epoch: row.epoch, selfWrap: try CollabCrypto.folderSelfWrap(fk, dataKey: dk, root: row.root, epoch: row.epoch))
            return Root(id: row.root, role: row.role, epoch: row.epoch, fk: fk, owner: row.owner_id)
        } catch {
            log.error("folder key: \(String(describing: error), privacy: .public)")
            return nil
        }
    }

    /// The folder's tree and notes, both ways.
    func syncRoot(_ root: Root) async {
        guard let tree = try? await transport.folderTree(root: root.id) else { return }
        if !state.roots.contains(root.id) { state.roots.append(root.id) }
        let names = Dictionary(tree.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        guard let top = names[root.id] else { return }
        let rootFolder = (try? folderFor(top, root: root, parent: nil)) ?? nil
        guard let rootFolder else { return }
        await syncFolders(tree, root: root, rootFolder: rootFolder)
        await syncNotes(root: root, rootFolder: rootFolder)
        persist()
    }

    /// Your folder for a shared row, made if it isn't here.
    private func folderFor(_ row: Collab.FolderRow, root: Root, parent: Folder?) throws -> Folder? {
        let id = try localID(row.id)
        state.sharedID[id] = row.id
        if let f = context.folder(id) { return f }
        guard !row.deleted else { return nil }
        let name = (try? CollabCrypto.openFolderName(row.name, fk: root.fk, root: root.id, folder: row.id)) ?? "Shared folder"
        let f = Folder(name: name, parent: parent, sortIndex: row.parent_id == nil ? -0.5 : row.sort_index)
        f.id = id
        context.insert(f)
        f.touch()
        state.seenFolders[row.id] = .init(name: name, parent: row.parent_id)
        return f
    }

    /// The folders in the tree, here and on the server: whichever side changed since the last look wins.
    private func syncFolders(_ tree: [Collab.FolderRow], root: Root, rootFolder: Folder) async {
        let byID = Dictionary(tree.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        // Parents before children.
        func depth(_ r: Collab.FolderRow) -> Int {
            var d = 0, p = r.parent_id
            while let q = p, d < 64 { d += 1; p = byID[q]?.parent_id }
            return d
        }
        for row in tree.sorted(by: { depth($0) < depth($1) }) {
            let parentLocal = row.parent_id.flatMap { try? localID($0) }.flatMap { context.folder($0) }
            guard let f = try? folderFor(row, root: root, parent: row.parent_id == nil ? nil : parentLocal) else { continue }
            let name = (try? CollabCrypto.openFolderName(row.name, fk: root.fk, root: root.id, folder: row.id)) ?? f.name
            let seen = state.seenFolders[row.id]
            if row.deleted {
                if f.deletedAt == nil, row.id != root.id { deleteLocally(f) }
                state.seenFolders[row.id] = nil
                continue
            }
            if f.deletedAt != nil, row.id != root.id {
                if root.canEdit, seen != nil { await drop(f, sharedID: row.id, root: root) } else { f.deletedAt = nil; f.touch() }
                continue
            }
            let localParent = f.parent.map(sharedID(of:))
            let localChanged = seen.map { $0.name != f.name || (row.id != root.id && $0.parent != localParent) } ?? false
            if localChanged, root.canEdit {
                let parent = row.id == root.id ? nil : localParent
                if let parent, inTree(f.parent, rootFolder) {
                    try? await transport.putFolder(root: root.id, folder: row.id, parent: parent,
                                                   name: (try? CollabCrypto.sealFolderName(f.name, fk: root.fk, root: root.id, epoch: root.epoch, folder: row.id)) ?? row.name,
                                                   sort: f.sortIndex)
                } else if row.id == root.id {
                    try? await transport.putFolder(root: root.id, folder: row.id, parent: root.id,
                                                   name: (try? CollabCrypto.sealFolderName(f.name, fk: root.fk, root: root.id, epoch: root.epoch, folder: row.id)) ?? row.name,
                                                   sort: f.sortIndex)
                } else {
                    // Moved out of the shared folder: it leaves it, with its notes.
                    await drop(f, sharedID: row.id, root: root)
                    continue
                }
                state.seenFolders[row.id] = .init(name: f.name, parent: row.parent_id == nil ? nil : localParent)
            } else {
                if f.name != name { f.name = name; f.touch() }
                if row.id != root.id, let p = parentLocal, f.parent?.id != p.id { f.parent = p; f.touch() }
                state.seenFolders[row.id] = .init(name: name, parent: row.parent_id)
            }
        }
        // Folders made here in the tree that the server doesn't have yet.
        guard root.canEdit else { return }
        for f in descendants(of: rootFolder) where byID[sharedID(of: f)] == nil && f.deletedAt == nil {
            let id = sharedID(of: f)
            guard let parent = f.parent else { continue }
            state.sharedID[f.id] = id
            do {
                try await transport.putFolder(root: root.id, folder: id, parent: sharedID(of: parent),
                                              name: try CollabCrypto.sealFolderName(f.name, fk: root.fk, root: root.id, epoch: root.epoch, folder: id), sort: f.sortIndex)
                state.seenFolders[id] = .init(name: f.name, parent: sharedID(of: parent))
            } catch { log.error("folder put: \(String(describing: error), privacy: .public)") }
        }
    }

    private func inTree(_ folder: Folder?, _ root: Folder) -> Bool {
        var f = folder
        while let c = f { if c.id == root.id { return true }; f = c.parent }
        return false
    }

    private func descendants(of folder: Folder) -> [Folder] {
        var out: [Folder] = []
        var queue = folder.children
        while let f = queue.first {
            queue.removeFirst()
            out.append(f)
            queue.append(contentsOf: f.children)
        }
        return out
    }

    /// A subfolder deleted, or moved out, here: its notes leave the shared folder, then it goes.
    private func drop(_ folder: Folder, sharedID id: UUID, root: Root) async {
        for f in [folder] + descendants(of: folder) {
            for n in f.notes { if let shared = n.sharedNoteID, state.seenNotes[shared] != nil { try? await transport.removeNote(root: root.id, note: shared); state.seenNotes[shared] = nil } }
        }
        try? await transport.dropFolder(root: root.id, folder: id)
        state.seenFolders[id] = nil
    }

    /// Someone deleted a subfolder: it goes here too. Notes of yours still in it stay, in your
    /// folder of the same name at the top (nothing of yours is lost).
    private func deleteLocally(_ folder: Folder) {
        for f in [folder] + descendants(of: folder) {
            for n in f.notes where n.deletedAt == nil && n.trashedAt == nil && isOwn(n) {
                n.folder = outsideFolder()
                n.touchKeepingDate()
            }
            f.deletedAt = .now
            f.touch()
        }
    }

    /// Where a note of yours goes when it leaves a shared folder it's still in here: your first
    /// folder that isn't shared, else a new "Notes".
    func outsideFolder() -> Folder {
        let shared = Set(roots.keys.compactMap { try? localID($0) })
        if let f = context.allFolders().filter({ $0.parent == nil && !shared.contains($0.id) && !ModelContext.isSharedWithMe($0, dataKey: try? store.dataKey()) })
            .min(by: { $0.sortIndex < $1.sortIndex }) { return f }
        let f = Folder(name: "Notes")
        context.insert(f)
        f.touch()
        return f
    }

    /// Your note: one you made (shared or not), not someone else's pointer.
    private func isOwn(_ n: Note) -> Bool { n.sharedNoteID == nil || n.sharedNoteID == n.id }

    // MARK: Notes

    private func syncNotes(root: Root, rootFolder: Folder) async {
        guard let me, let rows = try? await transport.folderNotes(root: root.id) else { return }
        let onServer = Dictionary(rows.map { ($0.note_id, $0) }, uniquingKeysWith: { a, _ in a })
        for row in rows {
            let local = row.owner_id == me ? context.note(row.note_id) : context.pointer(forShared: row.note_id)
            let seen = state.seenNotes[row.note_id]
            if let n = local, n.deletedAt == nil {
                let target = try? localID(row.folder_id)
                let here = n.folder.flatMap { inTree($0, rootFolder) ? sharedID(of: $0) : nil }
                if n.trashedAt != nil {
                    // Deleted here: it leaves the folder for everyone (and the note goes, as any deleted shared note does).
                    if root.canEdit, seen != nil { try? await transport.removeNote(root: root.id, note: row.note_id) }
                    state.seenNotes[row.note_id] = nil
                    continue
                }
                if here == nil, seen != nil, root.canEdit {
                    await moveOut(n, row: row, root: root)
                    continue
                }
                if let here, seen != nil, here != seen, root.canEdit {
                    try? await transport.moveNote(root: root.id, note: row.note_id, folder: here)
                    state.seenNotes[row.note_id] = here
                } else if here != row.folder_id, let target, let f = context.folder(target) {
                    n.folder = f
                    n.touchKeepingDate()
                    state.seenNotes[row.note_id] = row.folder_id
                } else {
                    state.seenNotes[row.note_id] = row.folder_id
                }
                // A note of yours with a newer key than the folder has for it.
                if row.owner_id == me, let k = store.keys[row.note_id], k.epoch > row.note_epoch,
                   let wrap = try? CollabCrypto.sealNoteKeyUnderFolder(k.nk, fk: root.fk, root: root.id, epoch: root.epoch, note: row.note_id, noteEpoch: k.epoch) {
                    try? await transport.rewrapNote(root: root.id, note: row.note_id, wrap: wrap)
                }
                continue
            }
            await join(row, root: root)
        }
        guard root.canEdit else {
            // Can view: a note moved in here goes back where it was on the next look; nothing is sent.
            return
        }
        // Notes in the tree the server doesn't list.
        for f in [rootFolder] + descendants(of: rootFolder) where f.deletedAt == nil {
            for n in f.notes where n.deletedAt == nil && n.trashedAt == nil && !n.isLocked {
                let shared = n.sharedNoteID ?? n.id
                guard onServer[shared] == nil else { continue }
                if state.seenNotes[shared] != nil {
                    // It was in the folder and the server doesn't have it there now: someone moved it
                    // out, or its maker left. Yours stays yours, out of the folder.
                    state.seenNotes[shared] = nil
                    if isOwn(n) { n.folder = outsideFolder(); n.touchKeepingDate() }
                    continue
                }
                await shareIn(n, folder: sharedID(of: f), root: root)
            }
        }
    }

    /// A note in the folder you're not in yet: its key from FK, then joined and placed.
    private func join(_ row: Collab.FolderNote, root: Root) async {
        guard let me, let library = store.library else { return }
        do {
            let opened = try CollabCrypto.openNoteKeyUnderFolder(row.folder_wrap, fk: root.fk, root: root.id, note: row.note_id)
            if !row.joined {
                let identity = try await store.ensureIdentity()
                let dk = try store.dataKey()
                let toSelf = try CollabCrypto.sealNoteKey(opened.nk, from: identity, to: identity.publicRaw,
                                                          party: .init(note: row.note_id, epoch: opened.noteEpoch, from: me, to: me))
                try await transport.joinNote(root: root.id, note: row.note_id, epoch: opened.noteEpoch, keyWrap: toSelf,
                                             selfWrap: try CollabCrypto.selfWrap(opened.nk, dataKey: dk, note: row.note_id, epoch: opened.noteEpoch))
            }
            let note = try await library.adopt(shared: row.note_id, nk: opened.nk, epoch: opened.noteEpoch,
                                               role: row.owner_id == me ? "owner" : (root.role == "owner" ? "editor" : root.role))
            if let target = try? localID(row.folder_id), let f = context.folder(target), note.folder?.id != f.id {
                note.folder = f
                note.touchKeepingDate()
            }
            state.seenNotes[row.note_id] = row.folder_id
        } catch {
            log.error("joining a folder's note: \(String(describing: error), privacy: .public)")
        }
    }

    /// A note made in, moved into or written into the folder: shared on its own first if it isn't,
    /// then into the folder with its key under FK.
    private func shareIn(_ n: Note, folder: UUID, root: Root) async {
        do {
            if n.sharedNoteID == nil {
                guard SharedNoteLimits.notYet(text: n.body, hasApp: NoteApps.page(n.id) != nil, alreadyShared: false) == nil else { return }
                try await store.share(n)
            }
            let shared = n.sharedNoteID ?? n.id
            guard let k = store.keys[shared] ?? store.sessions[n.id].map({ ($0.noteKey, $0.epoch) }) else { return }
            let wrap = try CollabCrypto.sealNoteKeyUnderFolder(k.nk, fk: root.fk, root: root.id, epoch: root.epoch, note: shared, noteEpoch: k.epoch)
            try await transport.addNote(root: root.id, note: shared, folder: folder, wrap: wrap)
            state.seenNotes[shared] = folder
        } catch {
            log.error("sharing a note into a folder: \(String(describing: error), privacy: .public)")
        }
    }

    /// Moved out of the shared folder here: it leaves the folder for everyone. Yours stays as it
    /// is; someone else's stays with its maker, and you keep a copy where you put it.
    private func moveOut(_ n: Note, row: Collab.FolderNote, root: Root) async {
        guard let me else { return }
        do {
            if row.owner_id != me {
                let text = store.sessions[n.id]?.text ?? n.sharedDocument?.storedText() ?? n.body
                let copy = Note(body: text, folder: n.folder)
                context.insert(copy)
                copy.touch()
            }
            try await transport.removeNote(root: root.id, note: row.note_id)
            state.seenNotes[row.note_id] = nil
            if row.owner_id != me { store.library?.removeLocally(n, byYou: true) }
            context.saveOrReport()
        } catch {
            log.error("moving a note out of a folder: \(String(describing: error), privacy: .public)")
        }
    }

    // MARK: People

    /// The folder's owner gives it a new key without whoever left or was removed: sealed to
    /// everyone still in it, with every note's key and every name sealed again under it.
    private func rekey(_ root: Root) async {
        guard let me else { return }
        do {
            let identity = try await store.ensureIdentity()
            let dk = try store.dataKey()
            let members = try await transport.folderMembers(root: root.id)
            store.checkKeys(members)
            let epoch = root.epoch + 1
            let fk = SymmetricKey(size: .bits256)
            var wraps: [Collab.Wrap] = []
            for m in members where m.accepted {
                guard let key = m.user_id == me ? identity.publicRaw : store.identityKeys?.trustedKey(of: m) else { continue }
                wraps.append(Collab.Wrap(user_id: m.user_id, key_wrap: try CollabCrypto.sealFolderKey(fk, from: identity, to: key, root: root.id, epoch: epoch, recipient: m.user_id, by: me)))
            }
            var noteWraps: [Collab.NoteWrap] = []
            for n in (try? await transport.folderNotes(root: root.id)) ?? [] {
                let old = try? CollabCrypto.openNoteKeyUnderFolder(n.folder_wrap, fk: root.fk, root: root.id, note: n.note_id)
                let k = store.keys[n.note_id].flatMap { k in (old?.noteEpoch ?? 0) <= k.epoch ? (k.nk, k.epoch) : nil } ?? old.map { ($0.nk, $0.noteEpoch) }
                guard let k else { continue }
                noteWraps.append(.init(note_id: n.note_id, folder_wrap: try CollabCrypto.sealNoteKeyUnderFolder(k.0, fk: fk, root: root.id, epoch: epoch, note: n.note_id, noteEpoch: k.1)))
            }
            try await transport.rekeyFolder(root: root.id, epoch: epoch, wraps: wraps, selfWrap: try CollabCrypto.folderSelfWrap(fk, dataKey: dk, root: root.id, epoch: epoch), noteWraps: noteWraps)
            var r = root
            r.epoch = epoch
            r.fk = fk
            roots[root.id] = r
            // Names under the new key.
            for row in (try? await transport.folderTree(root: root.id)) ?? [] where !row.deleted {
                guard let name = try? CollabCrypto.openFolderName(row.name, fk: root.fk, root: root.id, folder: row.id) else { continue }
                try? await transport.putFolder(root: root.id, folder: row.id, parent: row.parent_id ?? root.id,
                                               name: try CollabCrypto.sealFolderName(name, fk: fk, root: root.id, epoch: epoch, folder: row.id), sort: row.sort_index)
            }
            // A link made with the old key would let whoever was removed back in: a new one.
            if let access = linkAccess[root.id] {
                links[root.id] = nil
                linkAccess[root.id] = nil
                try? await setAccess(access, root: root.id)
            }
        } catch {
            log.error("folder key renewal: \(String(describing: error), privacy: .public)")
        }
    }

    func members(_ root: UUID) async -> [Collab.Member] { (try? await transport.folderMembers(root: root)) ?? [] }

    func remove(_ user: UUID, from root: UUID) async throws {
        try await transport.removeFromFolder(root: root, user: user)
        await sync()
    }

    func setRole(_ role: ShareState.Role, of user: UUID, in root: UUID) async throws {
        try await transport.setFolderRole(root: root, user: user, role: role.rawValue)
    }

    /// You leave someone else's folder: it and their notes go from your library; notes you made
    /// in it stay yours, in a folder of yours with its name.
    func leave(_ root: UUID) async throws {
        try await transport.leaveFolder(root: root)
        lose(root, reason: nil)
        persist()
    }

    /// Your folder stops being shared: everyone else loses it. It stays yours, with your notes.
    func stopSharing(_ root: UUID) async throws {
        try await transport.unshareFolder(root: root)
        roots[root] = nil
        links[root] = nil
        linkAccess[root] = nil
        store.linkVault?.remove(root)
        forgetState(root)
        persist()
        // Your notes in it are shared with no one now: ordinary notes again.
        if let f = context.folder(root) {
            for n in ([f] + descendants(of: f)).flatMap(\.notes) where n.sharedNoteID == n.id && n.deletedAt == nil {
                let others = (try? await store.transport?.members(of: n.id))?.filter { $0.user_id != me } ?? []
                if others.isEmpty { try? await store.library?.unshare(n) }
            }
        }
    }

    /// A folder you're no longer in. Someone else's notes go (the membership check takes them);
    /// your own stay, and so do the folders that hold them. Folders with nothing of yours go.
    private func lose(_ id: UUID, reason: String?) {
        let root = roots[id]
        roots[id] = nil
        links[id] = nil
        linkAccess[id] = nil
        guard let local = try? localID(id), let f = context.folder(local) else { forgetState(id); return }
        let isOwners = root?.isOwner == true || f.id == id
        if !isOwners {
            for sub in ([f] + descendants(of: f)).reversed() {
                let mine = sub.notes.filter { $0.deletedAt == nil && isOwn($0) }
                for n in sub.notes where !isOwn(n) && n.deletedAt == nil { store.library?.removeLocally(n, byYou: true) }
                if mine.isEmpty && sub.liveChildren.isEmpty { sub.deletedAt = .now; sub.touch() }
            }
            if let reason { onLost?(FolderRemoval(name: f.name, reason: reason)) }
        }
        forgetState(id)
        context.saveOrReport()
    }

    private func forgetState(_ root: UUID) {
        state.roots.removeAll { $0 == root }
    }

    private func persist() { saveState(state) }

    // MARK: Links

    func linkURL(_ root: UUID) -> URL? {
        guard let l = links[root], linkAccess[root] != nil else { return nil }
        return URL(string: "\(CollabStore.site)/s/\(l.id)#\(SealedLink.base64url(l.secret))")
    }

    /// Can edit or Can view: the folder becomes shared if it isn't yet, and its link lets whoever
    /// opens it in Pinto Notes join with that role. Off: the link stops at once.
    func setAccess(_ access: ShareState.Access, for folder: Folder) async throws {
        if sharedRoot(for: folder) == nil { try await share(folder) }
        guard let root = sharedRoot(for: folder) else { throw Collab.Failure.notSignedIn }
        try await setAccess(access, root: root.id)
    }

    func setAccess(_ access: ShareState.Access, root id: UUID) async throws {
        switch access {
        case .off:
            try await transport.stopFolderLink(root: id)
            links[id] = nil
            linkAccess[id] = nil
            store.linkVault?.remove(id)
        case .view, .edit:
            guard let root = roots[id] else { throw Collab.Failure.notSignedIn }
            let link = links[id] ?? (SealedLink.randomID(bytes: 16), E2EE.randomBytes(16))
            let lk = CollabStore.linkKeys(link.secret, link: link.id)
            let wrap = try NoteCrypto.seal(E2EE.bytes(root.fk).base64EncodedString(), key: lk.key, keyID: E2EE.keyID(of: root.fk), context: "invite:\(link.id.lowercased())")
            try await transport.createFolderLink(id: link.id, root: id, role: access == .edit ? "editor" : "viewer", epoch: root.epoch, answerHash: lk.answerHash, keyWrap: wrap)
            links[id] = link
            linkAccess[id] = access
            store.linkVault?.save(LinkVaultEntry(id: link.id, secret: link.secret, access: access.rawValue), for: id)
        }
    }

    /// The link as this device or another of yours kept it.
    func restoreLink(_ root: UUID) {
        guard links[root] == nil, let e = store.linkVault?.load(root), let access = ShareState.Access(rawValue: e.access), access != .off else { return }
        links[root] = (e.id, e.secret)
        linkAccess[root] = access
    }

    /// What a folder's link leads to, before joining: its name and who shared it.
    func preview(link id: String, secret: Data) async -> JoinPreview? {
        let lk = CollabStore.linkKeys(secret, link: id)
        guard let opened = try? await transport.openFolderLink(id: id, answer: lk.answer) else { return nil }
        let name = opened.folder_name.flatMap { ct -> String? in
            guard let text = try? NoteCrypto.open(opened.key_wrap, key: lk.key, context: "invite:\(id.lowercased())"),
                  let raw = Data(base64Encoded: text), raw.count == 32 else { return nil }
            return try? CollabCrypto.openFolderName(ct, fk: SymmetricKey(data: raw), root: opened.root, folder: opened.root)
        }
        return JoinPreview(title: name, owner: opened.owner_name, canEdit: opened.role == "editor", alreadyIn: roots[opened.root] != nil, isFolder: true)
    }

    /// Who shared the folder, by name, as its members list says.
    func ownerName(of folder: Folder) -> String? { ownerNames[folder.id] }
    private var ownerNames: [UUID: String] = [:]

    /// Opening a folder's link: you join the folder with the link's role; its folder lands at
    /// the top of your folders, with its notes.
    @discardableResult
    func join(link id: String, secret: Data) async throws -> Folder? {
        let lk = CollabStore.linkKeys(secret, link: id)
        guard let opened = try await transport.joinFolderLink(id: id, answer: lk.answer) else { throw Collab.Failure.server("This link doesn't work any more.") }
        guard let text = try? NoteCrypto.open(opened.key_wrap, key: lk.key, context: "invite:\(id.lowercased())"),
              let raw = Data(base64Encoded: text), raw.count == 32 else { throw CollabCrypto.Failure.wrongKey }
        let fk = SymmetricKey(data: raw)
        let dk = try store.dataKey()
        if opened.role != "owner" {
            try await transport.acceptFolder(root: opened.root, epoch: opened.epoch, selfWrap: try CollabCrypto.folderSelfWrap(fk, dataKey: dk, root: opened.root, epoch: opened.epoch))
        }
        await sync()
        let local = try localID(opened.root)
        if let name = opened.owner_name { ownerNames[local] = name }
        return context.folder(local)
    }
}

/// What a device last saw of its shared folders, so a look knows which side changed.
struct FolderSyncState: Codable, Equatable {
    struct SeenFolder: Codable, Equatable { var name: String; var parent: UUID? }
    var roots: [UUID] = []
    /// Your folder id to its shared id, for folders in shared trees.
    var sharedID: [UUID: UUID] = [:]
    var seenFolders: [UUID: SeenFolder] = [:]
    /// Each shared note in a shared folder, to the shared folder (or subfolder) it was in.
    var seenNotes: [UUID: UUID] = [:]

    static func load(account: UUID, defaults: UserDefaults = .standard) -> FolderSyncState {
        guard let d = defaults.data(forKey: key(account)), let s = try? JSONDecoder().decode(FolderSyncState.self, from: d) else { return .init() }
        return s
    }

    static func save(_ s: FolderSyncState, account: UUID, defaults: UserDefaults = .standard) {
        if let d = try? JSONEncoder().encode(s) { defaults.set(d, forKey: key(account)) }
    }

    static func key(_ account: UUID) -> String { "pinto.sharedFolders." + account.uuidString.lowercased() }
}

/// A shared folder you lost: what the alert says.
struct FolderRemoval: Equatable, Identifiable {
    let id = UUID()
    let name: String
    let reason: String

    var title: String { "\u{201C}\(name)\u{201D} isn\u{2019}t shared with you any more" }
    var message: String {
        switch reason {
        case "left": "You left this folder."
        case "unshared": "Its owner stopped sharing it. Notes you made in it are still in your notes."
        default: "You were removed from this folder. Notes you made in it are still in your notes."
        }
    }

    static func == (a: FolderRemoval, b: FolderRemoval) -> Bool { a.name == b.name && a.reason == b.reason }
}
