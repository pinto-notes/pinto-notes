import CryptoKit
import Foundation
import Observation
import SwiftData
import Supabase
import os

private let log = Logger(subsystem: "dev.emilwagman.pane", category: "collab")

/// Collaboration: this device's side of shared notes, as the signed-in account.
///
/// It talks to the server through a `CollabTransport` (`SupabaseCollabTransport` in the app). The
/// identity key is the account's own (`CollabKeys`: made and published on the first share or join,
/// opened from the server's copy on every other device), sealed under the account's data key from
/// AccountCrypto, which also seals each note key for this account's other devices and its AI.
@MainActor
@Observable
final class CollabStore {
    static var shared: CollabStore?

    struct Invite: Identifiable, Equatable {
        let id: UUID
        let title: String
        let from: String
        let safetyCode: String
    }

    /// Your name as others see it in a note.
    let name: String
    private(set) var transport: CollabTransport?
    /// The account's identity key and the keys of the people you share with.
    @ObservationIgnored private(set) var identityKeys: CollabKeys?
    /// The account's identity, once it exists (after the first share or join, on any device).
    private(set) var identity: CollabCrypto.Identity?
    /// The account's data key (AccountCrypto's), read when it's needed: nil while it isn't open here.
    @ObservationIgnored private let dataKeySource: @MainActor () -> SymmetricKey?
    /// People whose identity key changed since this account first saw it (trust on first use),
    /// until someone checks the code (`trust`).
    private(set) var keyChanges: [Collab.KeyChange] = []
    var me: UUID? { transport?.me }
    /// Open shared notes, by the id of the note in your library (for someone else's note that
    /// isn't the shared note's id: SharedNotes.noteID).
    var sessions: [UUID: CollabSession] = [:]
    /// Shared notes in this device's library: storage, offline edits, catching up, leaving
    /// (SharedLibrary). Made once the store has a context.
    @ObservationIgnored private(set) var library: SharedLibrary?
    /// An invitation waiting for an answer.
    var invite: Invite?
    @ObservationIgnored var keys: [UUID: (nk: SymmetricKey, epoch: Int)] = [:]
    @ObservationIgnored var handled: Set<UUID> = []
    /// What each note's link lets people do (Share › People with the link). No entry: the link is off.
    var linkAccess: [UUID: ShareState.Access] = [:]
    /// You left a note: the library takes it out of your notes.
    @ObservationIgnored var onLeft: ((UUID) -> Void)?
    /// Why the last link didn't open, shown to the person.
    var joinProblem: String?
    /// Notes you left or were removed from (by the id of the note in your library): they're gone
    /// from your library.
    var removedFrom: Set<UUID> = []
    @ObservationIgnored var context: ModelContext? { didSet { makeLibrary() } }
    /// Sealed links by note: the link's id and secret (in the product, kept in a synced Keychain
    /// item so every device can republish the copy).
    @ObservationIgnored var links: [UUID: (id: String, secret: Data)] = [:]
    /// Shared templates by note.
    @ObservationIgnored var templates: [UUID: String] = [:]
    /// Note pages by note: a stand-in for NotePageStore on the note-pages branch.
    var pages: [UUID: String] = [:]
    /// Profile photos by person, fetched once each (the public avatars bucket).
    var photos: [UUID: PImage] = [:]
    @ObservationIgnored private var photoFetches: Set<String> = []
    @ObservationIgnored private var membershipTask: Task<Void, Never>?

    /// Fetches the photos of a note's members that aren't here yet.
    func loadPhotos(_ session: CollabSession) {
        for m in session.members {
            guard let path = m.avatarPath, photos[m.id] == nil, !photoFetches.contains(path), let url = ProfileStore.avatarURL(path) else { continue }
            photoFetches.insert(path)
            Task {
                guard let (data, response) = try? await URLSession.shared.data(from: url),
                      (response as? HTTPURLResponse)?.statusCode == 200, let image = PImage(data: data) else { return }
                photos[m.id] = image
            }
        }
    }

    /// The signed-in account's store, over the real backend.
    static func live(client: SupabaseClient, account: UUID, name: String, crypto: AccountCrypto = .shared) -> CollabStore {
        let transport = SupabaseCollabTransport(client: client, me: account)
        return CollabStore(name: name, transport: transport, dataKey: { crypto.dataKey })
    }

    /// Whether shared notes are on in this build (CollabFeature).
    static var isOn: Bool { CollabFeature.isOn }

    /// Signed in with the notes open: the account's store, once per account.
    static func attach(client: SupabaseClient, account: UUID, context: ModelContext) async {
        guard isOn, AccountCrypto.shared.isReady else { return }
        if let s = shared, s.me == account { return }
        detach()
        let store = live(client: client, account: account, name: ProfileStore.shared.name ?? "Someone")
        store.context = context
        shared = store
        await store.start()
    }

    /// Signed out: everything open closes, and nothing of the account stays in memory.
    static func detach() {
        shared?.stop()
        shared = nil
    }

    /// `transport` nil: nothing reaches a server (the screenshot gallery).
    init(name: String, transport: CollabTransport? = nil, dataKey: @escaping @MainActor () -> SymmetricKey? = { nil },
         book: CollabKeyBook? = nil) {
        self.name = name
        self.transport = transport
        dataKeySource = dataKey
        if let transport {
            identityKeys = CollabKeys(transport: transport, dataKey: dataKey, book: book ?? CollabKeyBook(account: transport.me))
        }
    }

    var isReady: Bool { transport != nil }

    func session(for note: UUID) -> CollabSession? { sessions[note] }

    /// The open session for a shared note. One that isn't open yet is opened (from this device's
    /// copy, or the server's for a note new here) and shows up here once it is: a view asking
    /// while it draws doesn't change what it observes as it draws.
    func session(for note: Note) -> CollabSession? {
        if let s = sessions[note.id] { return s }
        guard note.isShared, note.deletedAt == nil, let library else { return nil }
        Task { @MainActor in
            if library.session(for: note) == nil { await library.ensureDocument(note) }
        }
        return nil
    }

    private func makeLibrary() {
        library?.closeAll()
        guard let context, let transport else { library = nil; return }
        let library = SharedLibrary(context: context, transport: transport, name: name, dataKey: dataKeySource) { [weak self] row in
            guard let self else { throw Collab.Failure.notSignedIn }
            let nk = try await self.openKey(row).nk
            // A new key for a note you're in: your own copy under your data key, for your other
            // devices and your AI. (An invitation is accepted only by `accept`.)
            if row.accepted_at != nil, row.self_wrap == nil, let key = try? self.dataKey(),
               let wrap = try? CollabCrypto.selfWrap(nk, dataKey: key, note: row.note_id, epoch: row.epoch) {
                try? await transport.accept(note: row.note_id, selfWrap: wrap)
            }
            return nk
        }
        library.onOpen = { [weak self] session, note in self?.opened(session, note: note) }
        library.onClose = { [weak self] noteID in
            self?.sessions[noteID] = nil
            self?.removedFrom.insert(noteID)
        }
        library.install()
        self.library = library
    }

    /// The account's data key, or why there isn't one here.
    func dataKey() throws -> SymmetricKey {
        guard let key = dataKeySource() else { throw CollabKeys.Problem.noDataKey }
        return key
    }

    /// The account's identity, made and published if this is its first share or join.
    @discardableResult
    func ensureIdentity() async throws -> CollabCrypto.Identity {
        if let identity { return identity }
        guard let identityKeys else { throw Collab.Failure.notSignedIn }
        let id = try await identityKeys.identity()
        identity = id
        return id
    }

    /// Signed in with the notes open: picks up the identity if the account has one (never makes
    /// it), then follows your memberships.
    func start() async {
        guard let identityKeys else { return }
        do {
            identity = try await identityKeys.existing()
        } catch {
            log.error("collab start: \(String(describing: error), privacy: .public)")
        }
        keyChanges = identityKeys.book.changes
        pollInvites()
    }

    func stop() {
        membershipTask?.cancel()
        membershipTask = nil
        for s in sessions.values { s.disconnect() }
        sessions = [:]
        library?.closeAll()
        identityKeys?.reset()
        identity = nil
    }

    // MARK: Key changes

    /// Takes in a note's members: remembers first-seen keys and collects changes for the Share sheet.
    func checkKeys(_ members: [Collab.Member]) {
        guard let identityKeys else { return }
        identityKeys.check(members)
        keyChanges = identityKeys.book.changes
    }

    /// Someone checked the code with this person: their new key is trusted from now on.
    func trust(_ change: Collab.KeyChange) {
        identityKeys?.book.trust(change)
        keyChanges = identityKeys?.book.changes ?? []
    }

    /// The code to compare with someone (Verify), from both public keys.
    func safetyCode(with member: Collab.Member) -> String? {
        guard let identity, let key = member.public_key.flatMap({ Data(base64Encoded: $0) }) else { return nil }
        return CollabCrypto.safetyCode(identity.publicRaw, key)
    }

    // MARK: Sharing

    /// Makes the note shared: a note key, the owner's membership, the document's first snapshot.
    @discardableResult
    func share(_ note: Note) async throws -> CollabSession {
        if let s = sessions[note.id] { return s }
        guard let transport, let me else { throw Collab.Failure.notSignedIn }
        let identity = try await ensureIdentity()
        let dataKey = try dataKey()
        let nk = SymmetricKey(size: .bits256)
        let toSelf = try CollabCrypto.sealNoteKey(nk, from: identity, to: identity.publicRaw, party: .init(note: note.id, epoch: 1, from: me, to: me))
        let head = try CollabCrypto.seal(.head, Data(NoteHead.of(note.body).json.utf8), nk: nk, note: note.id, epoch: 1)
        try await transport.share(note: note.id, keyWrap: toSelf, selfWrap: try CollabCrypto.selfWrap(nk, dataKey: dataKey, note: note.id, epoch: 1), head: head)
        guard let library else { throw Collab.Failure.notSignedIn }
        // The note becomes the shared document (its text, links and files kept), and its notes
        // row a pointer: from here its text goes only through the document.
        return try await library.becomeShared(note, nk: nk)
    }

    // MARK: Your memberships

    /// Your memberships are checked when the store starts and then every half minute: a new key
    /// (someone was removed, or the link was reset) is opened and taken; a note you were removed
    /// from stops syncing. Each open note's channel also asks for a check when it reconnects.
    private func pollInvites() {
        membershipTask?.cancel()
        membershipTask = Task { [weak self] in
            while let self, !Task.isCancelled {
                await self.checkInvites()
                try? await Task.sleep(for: .seconds(30))
            }
        }
    }

    func checkInvites() async {
        guard let transport, let rows = try? await transport.memberships() else { return }
        await followKeys(rows)
        guard invite == nil, identity != nil else { return }
        for row in rows where row.accepted_at == nil && !handled.contains(row.note_id) {
            guard let opened = try? await openKey(row) else { continue }
            let head = row.head_ct.flatMap { try? CollabCrypto.open(.head, $0, nk: opened.nk, note: row.note_id) }
                .flatMap { try? JSONDecoder().decode(NoteHead.self, from: $0) }
            invite = Invite(id: row.note_id, title: head?.title ?? "A note", from: opened.from?.display_name ?? "Someone",
                            safetyCode: opened.from.flatMap(safetyCode(with:)) ?? "")
            return
        }
    }

    /// Opens NK from your membership. Your own copy under the data key (`self_wrap`) is opened when
    /// it's for the current key: that's how your other devices and a new device get it. Otherwise
    /// the wrap sealed to your identity, checked against the sealer's key as first seen here; a
    /// sealer whose key changed is refused (and shows as a key change).
    func openKey(_ row: Collab.Membership) async throws -> (nk: SymmetricKey, from: Collab.Member?) {
        guard let transport, let me else { throw Collab.Failure.notSignedIn }
        if let wrap = row.self_wrap, let nk = try? CollabCrypto.openSelfWrap(wrap, dataKey: try dataKey(), note: row.note_id, epoch: row.epoch) {
            let members = (try? await transport.members(of: row.note_id)) ?? []
            if !members.isEmpty { checkKeys(members) }
            return (nk, members.first { $0.user_id == row.invited_by })
        }
        let identity = try await ensureIdentity()
        let members = try await transport.members(of: row.note_id)
        checkKeys(members)
        guard let sealer = members.first(where: { $0.user_id == row.wrapped_by }), let key = identityKeys?.trustedKey(of: sealer) else {
            throw CollabCrypto.Failure.malformed
        }
        let nk = try CollabCrypto.openNoteKey(row.key_wrap, me: identity, from: key, party: .init(note: row.note_id, epoch: row.epoch, from: row.wrapped_by, to: me))
        return (nk, members.first { $0.user_id == row.invited_by } ?? sealer)
    }

    /// Accepts: NK under your own data key, the note into your library, opened.
    func accept(_ invite: Invite) async {
        self.invite = nil
        handled.insert(invite.id)
        guard let transport, let library,
              let row = (try? await transport.memberships())?.first(where: { $0.note_id == invite.id }) else { return }
        do {
            let opened = try await openKey(row)
            try await transport.accept(note: row.note_id, selfWrap: try CollabCrypto.selfWrap(opened.nk, dataKey: try dataKey(), note: row.note_id, epoch: row.epoch))
            // A note of your own for it, in "Shared with me" (never the owner's note id).
            let note = try await library.adopt(shared: row.note_id, nk: opened.nk, epoch: row.epoch, role: row.role)
            NoteOpener.shared.open(note.id)
        } catch {
            log.error("accepting failed: \(String(describing: error), privacy: .public)")
        }
    }

    func decline(_ invite: Invite) {
        self.invite = nil
        handled.insert(invite.id)
    }

    /// A session the library opened: listed here for the views, with the store's own hooks. The
    /// library mirrors its text into the note and follows its key.
    private func opened(_ session: CollabSession, note: Note) {
        sessions[note.id] = session
        keys[session.noteID] = (session.noteKey, session.epoch)
        session.onMembers = { [weak self] members in self?.checkKeys(members) }
    }
}
