import CryptoKit
import Foundation
import SwiftData
import os

private let log = Logger(subsystem: "dev.emilwagman.pane", category: "collab")

/// Shared notes in this device's library: turning a note into a shared document, someone else's
/// shared note arriving here, opening them (offline too), keys changing, and leaving.
///
/// The rule it keeps: one note, one sync path. A shared note's text goes only through its
/// document (`CollabSession`, sealed with the note key). Its notes row is a pointer that
/// SyncEngine syncs like any note's place, pin and deletion, with a placeholder for text
/// (`NoteDTO`). The note's `body` here is a copy of the document's text, kept so the list,
/// search and links work as for any note; nothing sends it.
///
/// Decided: leaving a note, or being removed from it, takes it out of your library on all your
/// devices, as in Apple Notes. No private copy is kept.
@MainActor
final class SharedLibrary {
    let context: ModelContext
    let transport: any CollabTransport
    /// Your name as others see it in a note.
    let name: String
    var me: UUID { transport.me }
    /// The account's data key: each note key is kept here sealed under it, so a shared note opens
    /// offline. Nil while the notes aren't open on this device.
    private let dataKey: @MainActor () -> SymmetricKey?
    /// Opens a note key that isn't sealed under your data key yet (an invitation, or a new key
    /// after someone was removed): sealed to your identity key. The store's, which also writes the
    /// self wrap on the server (`accept`).
    private let openKey: @MainActor (Collab.Membership) async throws -> SymmetricKey
    /// Open shared notes, by the id of the note in your library.
    private(set) var sessions: [UUID: CollabSession] = [:]
    /// Called with a session as it opens, to hook it up further (the store's members, photos).
    var onOpen: ((CollabSession, Note) -> Void)?
    /// Called with a note's id when it leaves your library (you left, or were removed).
    var onClose: ((UUID) -> Void)?
    /// Called with a note's id when its session closed for good (it left your library, or isn't
    /// shared anymore).
    var onSessionClosed: ((UUID) -> Void)?
    /// Notes being loaded from the server, so a pointer arriving twice loads once.
    private var loading: [UUID: Task<CollabSession?, Never>] = [:]

    enum Problem: LocalizedError {
        case locked, noDataKey, notShared
        var errorDescription: String? {
            switch self {
            case .locked: "A locked note can't be shared. Unlock it first."
            case .noDataKey: "Open your notes on this device first."
            case .notShared: "This note isn't shared."
            }
        }
    }

    init(context: ModelContext, transport: any CollabTransport, name: String,
         dataKey: @escaping @MainActor () -> SymmetricKey?,
         openKey: @escaping @MainActor (Collab.Membership) async throws -> SymmetricKey) {
        self.context = context
        self.transport = transport
        self.name = name
        self.dataKey = dataKey
        self.openKey = openKey
    }

    /// Hooks this library into sync: a shared note's pointer arriving from another of your
    /// devices gets its document.
    func install() {
        SharedNotes.pointerArrived = { [weak self] note in
            guard let self else { return }
            // Deleted on another of your devices (you left there), or by the owner stopping sharing.
            if note.deletedAt != nil { self.forget(note); return }
            guard note.sharedDocument == nil else { return }
            Task { await self.ensureDocument(note) }
        }
        SharedNotes.unshared = { [weak self] note in self?.forget(note) }
        SharedNotes.trashed = { [weak self] note in
            guard let self else { return }
            Task { await self.trashed(note) }
        }
        SharedNotes.purged = { [weak self] note in
            guard let self else { return }
            Task { await self.deleted(note) }
        }
    }

    // MARK: Sharing your note

    /// Your note becomes a shared document, after the server has it as shared (`transport.share`
    /// with `nk` at epoch 1). Nothing of it is lost: the document starts from the note's whole
    /// text, which keeps its links, and the note keeps its id, so its files, sub-notes, place and
    /// history stay where they are. From here its text goes only through the document.
    @discardableResult
    func becomeShared(_ note: Note, nk: SymmetricKey) async throws -> CollabSession {
        if let s = sessions[note.id] { return s }
        guard !note.isLocked else { throw Problem.locked }
        guard let dk = dataKey() else { throw Problem.noDataKey }
        // Typing that isn't in the note yet goes in first.
        DebouncedSave.flushAll()
        let record = SharedDocument(id: note.id, epoch: 1, role: "owner", saved: Data())
        record.setKey(try CollabCrypto.selfWrap(nk, dataKey: dk, note: note.id, epoch: 1), epoch: 1)
        // Due at once: the first snapshot is how the text reaches everyone (it may be bigger than a change).
        record.sinceSnapshot = CollabSession.snapshotEvery
        context.insert(record)
        let session: CollabSession
        do {
            session = try CollabSession.create(record: record, nk: nk, initial: note.body, transport: transport, me: me, name: name)
        } catch {
            context.delete(record)
            throw error
        }
        note.sharedDocument = record
        note.sharedNoteID = note.id
        // The notes row becomes the pointer (placeholder text) on the next push.
        note.touch()
        context.saveOrReport()
        open(session, note: note)
        await session.writeSnapshot()
        return session
    }

    // MARK: Someone else's note

    /// A note shared with you, after you joined it (an invitation accepted, or an edit link
    /// opened): the document from the server, and a note for it in "Shared with me". Its id is
    /// yours, never the owner's (`notes.id` is unique across accounts), and the same on each of
    /// your devices.
    ///
    /// `announce`: the note's pointer goes to your other devices. False for a note found joined on
    /// another device: that device sent its pointer, and this one's would put the note back in
    /// "Shared with me" if you'd moved it there; the pointer arriving puts it in its place.
    @discardableResult
    func adopt(shared: UUID, nk: SymmetricKey, epoch: Int, role: String, announce: Bool = true) async throws -> Note {
        let noteID = SharedNotes.noteID(for: shared, user: me)
        if let s = sessions[noteID], let note = context.note(noteID), note.deletedAt == nil {
            if epoch > s.epoch { s.reseal(nk: nk, epoch: epoch) }
            return note
        }
        guard let dk = dataKey() else { throw Problem.noDataKey }
        let record = context.sharedDocument(shared) ?? {
            let r = SharedDocument(id: shared, epoch: epoch, role: role, saved: Data())
            context.insert(r)
            return r
        }()
        record.epoch = epoch
        record.role = role
        record.setKey(try CollabCrypto.selfWrap(nk, dataKey: dk, note: shared, epoch: epoch), epoch: epoch)
        let session: CollabSession
        do {
            session = try await CollabSession.load(record: record, nk: nk, transport: transport, me: me, name: name)
        } catch {
            if record.saved.isEmpty { context.delete(record) }
            throw error
        }
        let note: Note
        if let existing = context.note(noteID) {
            // Left before, or a pointer from another of your devices: it's live again.
            note = existing
            note.deletedAt = nil
            note.trashedAt = nil
            if note.folder == nil || note.folder?.deletedAt != nil { note.folder = SharedNotes.sharedWithMe(context, user: me) }
        } else {
            note = Note(body: session.text, folder: SharedNotes.sharedWithMe(context, user: me))
            note.id = noteID
            context.insert(note)
        }
        note.sharedNoteID = shared
        note.sharedDocument = record
        note.body = session.text
        if announce { note.touch() } else { note.dirty = false }
        context.saveOrReport()
        open(session, note: note)
        return note
    }

    // MARK: Opening

    /// The open session for a shared note, opened from this device's copy if it isn't open yet,
    /// with no network. Nil for a note that isn't shared, or whose document isn't here yet.
    func session(for note: Note) -> CollabSession? {
        if let s = sessions[note.id] { return s }
        guard note.isShared, note.deletedAt == nil, let record = note.sharedDocument, !record.saved.isEmpty,
              let dk = dataKey() else { return nil }
        let keys = record.openKeys(dataKey: dk)
        guard keys[record.epoch] != nil else { return nil }
        do {
            let session = try CollabSession.open(record: record, keys: keys, transport: transport, me: me, name: name)
            open(session, note: note)
            return session
        } catch {
            log.error("a shared note's document didn't open: \(String(describing: error), privacy: .public)")
            return nil
        }
    }

    /// A shared note this device has no document for yet (its pointer came from another of your
    /// devices): the document from the server, with the key from your membership.
    @discardableResult
    func ensureDocument(_ note: Note) async -> CollabSession? {
        if let s = session(for: note) { return s }
        guard let shared = note.sharedNoteID else { return nil }
        if let running = loading[shared] { return await running.value }
        let task = Task<CollabSession?, Never> { [weak self] in
            guard let self else { return nil }
            do {
                guard let row = try await transport.memberships().first(where: { $0.note_id == shared }) else {
                    // Not in it anymore (removed while this device was away).
                    if await isMember(shared) == false { removeLocally(note) }
                    return nil
                }
                let nk = try await key(for: row)
                guard let dk = dataKey() else { return nil }
                let record = note.sharedDocument ?? context.sharedDocument(shared) ?? {
                    let r = SharedDocument(id: shared, epoch: row.epoch, role: row.role, saved: Data())
                    context.insert(r)
                    return r
                }()
                record.epoch = row.epoch
                record.role = row.role
                record.setKey(try CollabCrypto.selfWrap(nk, dataKey: dk, note: shared, epoch: row.epoch), epoch: row.epoch)
                let session = try await CollabSession.load(record: record, nk: nk, transport: transport, me: me, name: name)
                note.sharedDocument = record
                note.body = session.text
                context.saveOrReport()
                open(session, note: note)
                return session
            } catch {
                log.error("loading a shared note failed: \(String(describing: error), privacy: .public)")
                return nil
            }
        }
        loading[shared] = task
        let session = await task.value
        loading[shared] = nil
        return session
    }

    private func key(for row: Collab.Membership) async throws -> SymmetricKey {
        if let box = row.self_wrap, let dk = dataKey(), let nk = try? CollabCrypto.openSelfWrap(box, dataKey: dk, note: row.note_id, epoch: row.epoch) {
            return nk
        }
        return try await openKey(row)
    }

    private func open(_ session: CollabSession, note: Note) {
        sessions[note.id] = session
        session.onSettled = { [weak self, weak note] text in
            guard let self, let note else { return }
            self.mirror(text, into: note)
        }
        session.onKeyChanged = { [weak self, weak session] in
            guard let self, let session else { return }
            Task { await self.refreshKey(session) }
        }
        session.onResealed = { [weak self, weak session] nk, epoch in
            guard let self, let session, let dk = dataKey(),
                  let box = try? CollabCrypto.selfWrap(nk, dataKey: dk, note: session.noteID, epoch: epoch) else { return }
            session.record.setKey(box, epoch: epoch)
        }
        session.onRemoved = { [weak self, weak note] in
            guard let self, let note else { return }
            self.removeLocally(note)
        }
        onOpen?(session, note)
        session.connect()
    }

    /// The document's text into the note: the list, search and links read it from there. Not a
    /// change to sync (the notes row holds a placeholder), except that a new title goes into the
    /// placeholder, for apps from before collaboration.
    func mirror(_ text: String, into note: Note) {
        guard note.body != text, note.deletedAt == nil else { return }
        let oldTitle = note.title
        note.body = text
        if note.title != oldTitle {
            note.touch()
        } else {
            note.updatedAt = .now
            context.saveSoon()
        }
    }

    // MARK: Keys, removal and leaving

    /// After each look at your memberships (the store's): new keys taken, notes you joined on
    /// another device given their document here, and notes you're no longer in taken out.
    func reconcile(_ rows: [Collab.Membership]) async {
        let byNote = Dictionary(rows.map { ($0.note_id, $0) }, uniquingKeysWith: { a, _ in a })
        for note in context.sharedNotes() {
            guard let shared = note.sharedNoteID else { continue }
            guard let row = byNote[shared] else {
                // Not listed: checked with the note itself before anything is taken away, so a
                // list that came back short never empties the library.
                if await isMember(shared) == false { removeLocally(note) }
                continue
            }
            if note.trashedAt != nil {
                // Deleted while offline: finish it now (stop sharing yours, leave someone else's).
                await trashed(note)
                continue
            }
            if let session = sessions[note.id] {
                session.setRole(row.role)
                if row.epoch > session.epoch { await refreshKey(session, row: row) }
            } else if note.sharedDocument == nil {
                await ensureDocument(note)
            }
        }
        // Joined on another device, whose pointer hasn't reached this one yet. Your own notes
        // come with their own pointer (their id is the shared note's).
        for row in rows where row.role != "owner" && row.accepted_at != nil {
            let id = SharedNotes.noteID(for: row.note_id, user: me)
            if let local = context.note(id) {
                // Deleted for good after you joined (here or on another device) while offline:
                // you leave it now. Joined again since, it stays.
                if let gone = local.deletedAt, let joined = Self.date(row.accepted_at), gone > joined {
                    try? await transport.leave(note: row.note_id)
                }
                continue
            }
            guard let nk = try? await key(for: row) else { continue }
            _ = try? await adopt(shared: row.note_id, nk: nk, epoch: row.epoch, role: row.role, announce: false)
        }
    }

    /// The note has a new key: opened from your membership and taken, then what's waiting is
    /// sealed with it and sent.
    func refreshKey(_ session: CollabSession, row: Collab.Membership? = nil) async {
        let found: Collab.Membership?
        if let row { found = row } else { found = try? await transport.memberships().first { $0.note_id == session.noteID } }
        guard let row = found else {
            if await isMember(session.noteID) == false,
               let note = sessions.first(where: { $0.value === session }).flatMap({ context.note($0.key) }) {
                removeLocally(note)
            }
            return
        }
        guard row.epoch >= session.epoch, let nk = try? await key(for: row) else { return }
        session.reseal(nk: nk, epoch: row.epoch)
    }

    /// A shared note moved to Recently Deleted (Apple Notes): yours stops being shared for
    /// everyone and stays in your Recently Deleted with its text (restoring brings it back, not
    /// shared); someone else's you leave, and it goes from your library. Offline, the next look
    /// at your memberships finishes it (`reconcile`).
    func trashed(_ note: Note) async {
        guard let shared = note.sharedNoteID else { return }
        if shared == note.id {
            try? await unshare(note)
        } else {
            try? await leave(note)
        }
    }

    /// Your note stops being shared: its text (the document's, merged) goes back into your notes
    /// row on the server, which stops being a pointer; the shared note goes, and every member's
    /// copy with it (`collab_unshare`). Here it's an ordinary note again.
    func unshare(_ note: Note) async throws {
        guard let shared = note.sharedNoteID, shared == note.id else { throw Problem.notShared }
        let text = sessions[note.id]?.text ?? note.body
        SharedNotes.unsharing.insert(note.id)
        defer { SharedNotes.unsharing.remove(note.id) }
        let body = try Wire.seal(text, E2EE.body(note.id))
        let head = try Wire.seal(head: Wire.head(body: text, locked: false), note.id)
        try await transport.unshare(note: shared, body: body, head: head)
        forget(note)
        note.sharedNoteID = nil
        note.body = text
        note.touch()
        context.saveOrReport()
    }

    /// Someone else's shared note you deleted for good: its document goes, and you leave it (as
    /// in Apple Notes). Offline, the next look at your memberships leaves it (`reconcile`). Your own
    /// note's document just goes; the others keep the note.
    func deleted(_ note: Note) async {
        guard let shared = note.sharedNoteID else { return }
        forget(note)
        if shared == note.id {
            // Yours, deleted for good while still shared (sharing couldn't be stopped when it went
            // to Recently Deleted): it stops now. The row is deleted, so the text isn't needed.
            SharedNotes.unsharing.insert(note.id)
            defer { SharedNotes.unsharing.remove(note.id) }
            if let body = try? Wire.seal("", E2EE.body(note.id)), let head = try? Wire.seal(head: Wire.head(body: "", locked: false), note.id) {
                try? await transport.unshare(note: shared, body: body, head: head)
            }
            return
        }
        try? await transport.leave(note: shared)
    }

    nonisolated static func date(_ s: String?) -> Date? {
        guard let s else { return nil }
        return (try? Date(s, strategy: .iso8601)) ?? (try? Date(s, strategy: Date.ISO8601FormatStyle(includingFractionalSeconds: true)))
    }

    /// Whether you're still in a note, asked of the note itself: its member list is empty to
    /// anyone outside it. Nil when the server couldn't be asked (offline): nothing is decided then.
    func isMember(_ shared: UUID) async -> Bool? {
        do {
            return try await transport.members(of: shared).contains { $0.user_id == me }
        } catch let failure as Collab.Failure where failure == .notMember {
            return false
        } catch {
            return nil
        }
    }

    /// You leave someone's note: it goes from your library on all your devices.
    func leave(_ note: Note) async throws {
        guard let shared = note.sharedNoteID else { throw Problem.notShared }
        try await transport.leave(note: shared)
        removeLocally(note)
    }

    /// You're not in the note anymore (you left, or were removed): the note goes from this
    /// device and, through its pointer's deletion, from your others. Its document goes with it.
    /// Your own note never goes this way: if its shared note is gone, it's yours again, with the
    /// text it had.
    func removeLocally(_ note: Note) {
        if note.sharedNoteID == note.id {
            forget(note)
            note.sharedNoteID = nil
            note.touch()
            context.saveOrReport()
            return
        }
        forget(note)
        note.body = ""
        note.deletedAt = .now
        note.touch()
        context.saveOrReport()
        onClose?(note.id)
    }

    /// The note's document and session go from this device; the note itself is left as it is
    /// (sync already deleted it, or made it an ordinary note again).
    func forget(_ note: Note) {
        if let session = sessions.removeValue(forKey: note.id) {
            session.close()
            onSessionClosed?(note.id)
        }
        if let record = note.sharedDocument ?? note.sharedNoteID.flatMap({ context.sharedDocument($0) }) { context.delete(record) }
        note.sharedDocument = nil
    }

    /// Closes every open session for good (signing out, or the library replaced): what's stored
    /// stays, and opens again with the next library.
    func closeAll() {
        for s in sessions.values { s.close() }
        sessions = [:]
    }
}

extension SharedDocument {
    /// Your note keys, each sealed under your data key, by epoch (JSON): opening a note offline
    /// needs one, and older changes need the key they were sealed with.
    func setKey(_ selfWrap: String, epoch: Int) {
        var boxes = (try? JSONDecoder().decode([String: String].self, from: keyBoxes)) ?? [:]
        boxes[String(epoch)] = selfWrap
        keyBoxes = (try? JSONEncoder().encode(boxes)) ?? keyBoxes
    }

    func openKeys(dataKey: SymmetricKey) -> [Int: SymmetricKey] {
        let boxes = (try? JSONDecoder().decode([String: String].self, from: keyBoxes)) ?? [:]
        var out: [Int: SymmetricKey] = [:]
        for (e, box) in boxes {
            guard let epoch = Int(e), let k = try? CollabCrypto.openSelfWrap(box, dataKey: dataKey, note: id, epoch: epoch) else { continue }
            out[epoch] = k
        }
        return out
    }
}
