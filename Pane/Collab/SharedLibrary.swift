import CryptoKit
import Foundation
import Observation
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
/// devices, as in Apple Notes. No private copy is kept, unless you'd typed in it here and choose
/// Keep a Copy when told you lost it (SharedRemoval).
@MainActor
final class SharedLibrary {
    let context: ModelContext
    let transport: any CollabTransport
    /// Your name as others see it in a note, as it is now (CollabStore.name).
    var name: String { nameSource() }
    private let nameSource: @MainActor () -> String
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
    /// Called when a note left your library because you're no longer in it, not by your own
    /// choice: what to tell you, once (the store hands it to SharedRemovals).
    var onLostAccess: ((SharedRemoval) -> Void)?
    /// Called with a note's id when its session closed for good (it left your library, or isn't
    /// shared anymore).
    var onSessionClosed: ((UUID) -> Void)?
    /// Notes being loaded from the server, so a pointer arriving twice loads once.
    private var loading: [UUID: Task<CollabSession?, Never>] = [:]
    /// Notes being joined (`adopt`), by shared id: the join's task (its note's id), and whether it
    /// sends the note's pointer.
    private var adopting: [UUID: (task: Task<UUID, Error>, announce: Bool)] = [:]
    /// The last look found no memberships and no shared notes in the library.
    private var nothingShared = false
    /// How many times reconcile went through the library's notes (for tests).
    private(set) var libraryScans = 0

    enum Problem: LocalizedError {
        case locked, noDataKey, notShared, notUpToDate
        var errorDescription: String? {
            switch self {
            case .locked: "A locked note can't be shared. Unlock it first."
            case .noDataKey: "Open your notes on this device first."
            case .notShared: "This note isn't shared."
            case .notUpToDate: "The note couldn't be brought up to date. Try again when you're online."
            }
        }
    }

    init(context: ModelContext, transport: any CollabTransport, name: @escaping @autoclosure @MainActor () -> String,
         dataKey: @escaping @MainActor () -> SymmetricKey?,
         openKey: @escaping @MainActor (Collab.Membership) async throws -> SymmetricKey) {
        self.context = context
        self.transport = transport
        nameSource = name
        self.dataKey = dataKey
        self.openKey = openKey
    }

    /// Hooks this library into sync: a shared note's pointer arriving from another of your
    /// devices gets its document.
    func install() {
        SharedNotes.pointerArrived = { [weak self] note in
            guard let self else { return }
            // The library has a shared note now: the next look goes through it.
            self.nothingShared = false
            // Deleted on another of your devices (you left there), or by the owner stopping sharing.
            // Only the owner's stopping is news: your own leaving comes marked as yours (removeLocally).
            if note.deletedAt != nil {
                let removal = note.trashedAt == nil && note.sharedNoteID != note.id ? self.lostAccess(note) : nil
                self.forget(note)
                if let removal { self.onLostAccess?(removal) }
                return
            }
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
        nothingShared = false
        if let s = sessions[note.id] { return s }
        guard !note.isLocked else { throw Problem.locked }
        guard let dk = dataKey() else { throw Problem.noDataKey }
        // Typing that isn't in the note yet goes in first.
        DebouncedSave.flushAll()
        let record = SharedDocument(id: note.id, epoch: 1, role: "owner", saved: Data())
        record.setKey(try CollabCrypto.selfWrap(nk, dataKey: dk, note: note.id, epoch: 1), epoch: 1)
        // Due at once: the first snapshot is how the text reaches everyone (it may be bigger than a change).
        record.sinceSnapshot = CollabSession.snapshotEvery
        record.pointerOnServer = false
        context.insert(record)
        let session: CollabSession
        let name = nameSource
        do {
            session = try CollabSession.create(record: record, nk: nk, initial: note.body, transport: transport, me: me, name: name())
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
    ///
    /// One join at a time for a note. A link join can still be loading the document when the
    /// membership check (every 30 s) finds the membership with no note for it here, or the other
    /// way round. Both opened the note: two sessions on its one record, and Realtime's client
    /// gave the second the first one's channel with no change listener, so the note you had open
    /// got no change live (persona council round 7). The second now waits and gets the first
    /// one's note.
    @discardableResult
    func adopt(shared: UUID, nk: SymmetricKey, epoch: Int, role: String, announce: Bool = true) async throws -> Note {
        while let running = adopting[shared] {
            // Failed, or the note went meanwhile: this one tries.
            guard let id = try? await running.task.value, let note = context.note(id), note.deletedAt == nil,
                  let s = sessions[id] else { continue }
            if epoch > s.epoch { s.reseal(nk: nk, epoch: epoch) }
            // The check got there first and took the pointer as sent by another device. It's
            // this device's join, so its pointer goes to your other devices.
            if announce, !running.announce, let record = note.sharedDocument, record.pointerOnServer {
                record.pointerOnServer = false
                note.touch()
                context.saveOrReport()
            }
            return note
        }
        // The note's id: a SwiftData note stays on the main actor.
        let task = Task<UUID, Error> { [weak self] in
            guard let self else { throw CancellationError() }
            // Cleared before anyone waiting hears back, so they never wait on it twice.
            defer { self.adopting[shared] = nil }
            // A pointer's document being fetched meanwhile (`ensureDocument`): that one first.
            if let running = self.loading[shared] { _ = await running.value }
            return try await self.adoptNow(shared: shared, nk: nk, epoch: epoch, role: role, announce: announce).id
        }
        adopting[shared] = (task, announce)
        guard let note = context.note(try await task.value) else { throw Problem.notShared }
        return note
    }

    private func adoptNow(shared: UUID, nk: SymmetricKey, epoch: Int, role: String, announce: Bool) async throws -> Note {
        nothingShared = false
        guard let dk = dataKey() else { throw Problem.noDataKey }
        // The pointer this account has already (from another device, or from before you left),
        // else the id your data key gives it.
        let noteID = context.pointer(forShared: shared)?.id ?? SharedNotes.noteID(for: shared, dataKey: dk)
        if let s = sessions[noteID], let note = context.note(noteID), note.deletedAt == nil {
            if epoch > s.epoch { s.reseal(nk: nk, epoch: epoch) }
            return note
        }
        let record = context.sharedDocument(shared) ?? {
            let r = SharedDocument(id: shared, epoch: epoch, role: role, saved: Data())
            context.insert(r)
            return r
        }()
        record.epoch = epoch
        record.role = role
        record.setKey(try CollabCrypto.selfWrap(nk, dataKey: dk, note: shared, epoch: epoch), epoch: epoch)
        let session: CollabSession
        let name = nameSource
        do {
            session = try await CollabSession.load(record: record, nk: nk, transport: transport, me: me, name: name())
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
            if note.folder == nil || note.folder?.deletedAt != nil { note.folder = SharedNotes.sharedWithMe(context, dataKey: dk) }
        } else {
            note = Note(body: session.text, folder: SharedNotes.sharedWithMe(context, dataKey: dk))
            note.id = noteID
            context.insert(note)
        }
        note.sharedNoteID = shared
        note.sharedDocument = record
        note.body = session.text
        record.pointerOnServer = !announce
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
        let name = nameSource
        do {
            let session = try CollabSession.open(record: record, keys: keys, transport: transport, me: me, name: name())
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
        guard let shared = note.sharedNoteID else {
            log.error("\(note.id, privacy: .public) has no shared document: it isn't a shared note here")
            return nil
        }
        // Being joined right now (by link, or by the membership check): that join's session, so
        // the note opens once (`adopt`).
        while let joining = adopting[shared] {
            _ = try? await joining.task.value
            if let s = session(for: note) { return s }
        }
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
                record.pointerOnServer = true
                record.setKey(try CollabCrypto.selfWrap(nk, dataKey: dk, note: shared, epoch: row.epoch), epoch: row.epoch)
                let name = nameSource
                let session = try await CollabSession.load(record: record, nk: nk, transport: transport, me: me, name: name())
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
        // The hooks find the note by its id each time, never by the object it opened with:
        // SwiftData doesn't keep a saved note alive by itself. The one `adopt` made when you joined
        // by link was gone once the join opened the note by id, and hooks holding it weakly did
        // nothing from then on. On the phone you joined on, an AI's change came in unmarked and
        // the note's own copy of the text (list, search) stopped following (persona council
        // round 7, bug 16).
        let id = note.id
        session.onSettled = { [weak self] text in
            guard let self, let note = self.context.note(id) else { return }
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
        session.onRemoved = { [weak self] in
            guard let self, let note = self.context.note(id) else { return }
            self.removeLocally(note)
        }
        session.onAIChange = { [weak self, weak session] arrival in
            guard let self, let session else { return }
            guard let note = self.context.note(id) else {
                CollabScript.trace("AI change from \(arrival.ai): no note \(id) in the library to mark")
                return
            }
            self.aiChanged(arrival, in: session, note: note)
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

    /// An AI's change reached the note's document (someone's AI, through its tools): the note
    /// takes the text now and is marked as an AI's edit of a note of your own is, with the tint,
    /// the margin marks and the receipt. Your own AI reads "Claude changed 2 lines"; someone
    /// else's is named with them, "Sara's Claude changed 2 lines" (persona council round 7, bug 16).
    func aiChanged(_ arrival: CollabSession.AIArrival, in session: CollabSession, note: Note) {
        guard note.deletedAt == nil else { return }
        mirror(session.text, into: note)
        let person = arrival.author == me ? nil : session.firstName(of: arrival.author) ?? AIEdit.someone
        AIEdit.arrived(note, ai: arrival.ai, person: person, previousBody: arrival.before)
        CollabScript.trace("AI change marked: \(AIEdit.whose(arrival.ai, person: person)), unseen \(AIEdit.isUnseen(note))")
    }

    // MARK: Keys, removal and leaving

    /// After each look at your memberships (the store's): new keys taken, notes you joined on
    /// another device given their document here, and notes you're no longer in taken out.
    func reconcile(_ rows: [Collab.Membership]) async {
        // Still no memberships, and the last look found no shared notes here: there's nothing to
        // reconcile, so the library isn't gone through again. That's a scan of every note on the
        // main thread every half minute, for an account that shares nothing.
        if rows.isEmpty, nothingShared { return }
        let byNote = Dictionary(rows.map { ($0.note_id, $0) }, uniquingKeysWith: { a, _ in a })
        libraryScans += 1
        let local = context.sharedNotes()
        nothingShared = rows.isEmpty && local.isEmpty
        for note in local {
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
            if let local = context.pointer(forShared: row.note_id) {
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
            // A change can land between the pull and the server's check: a few tries, then the
            // next look at your memberships tries again.
            for _ in 0..<3 {
                do { try await unshare(note); return } catch {}
            }
        } else {
            try? await leave(note)
        }
    }

    /// Your note stops being shared: its text (the document's, merged) goes back into your notes
    /// row on the server, which stops being a pointer; the shared note goes, and every member's
    /// copy with it (`collab_unshare`). Here it's an ordinary note again.
    ///
    /// The text is the document's after a fresh pull, never the note's copy (which can be behind:
    /// the note may not be open, or offline). Without a pull, or with a change that didn't open,
    /// it's refused and tried again later; the server also refuses if a change came after it.
    func unshare(_ note: Note) async throws {
        guard let shared = note.sharedNoteID, shared == note.id else { throw Problem.notShared }
        guard let session = await ensureDocument(note) else { throw Problem.notUpToDate }
        await session.catchUp().value
        guard session.isUpToDate else { throw Problem.notUpToDate }
        let text = session.text
        let upto = session.lastSeen
        SharedNotes.unsharing.insert(note.id)
        defer { SharedNotes.unsharing.remove(note.id) }
        let body = try Wire.seal(text, E2EE.body(note.id))
        let head = try Wire.seal(head: Wire.head(body: text, locked: false), note.id)
        try await transport.unshare(note: shared, body: body, head: head, upto: upto)
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
                // Its row is deleted for good, so no text is kept: no change can be lost.
                try? await transport.unshare(note: shared, body: body, head: head, upto: .max)
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
        removeLocally(note, byYou: true)
    }

    /// You're not in the note anymore (you left, or were removed): the note goes from this
    /// device and, through its pointer's deletion, from your others. Its document goes with it.
    /// Your own note never goes this way: if its shared note is gone, it's yours again, with the
    /// text it had. `byYou`: you left (Leave Note, or deleting it); otherwise you're told, once
    /// (`onLostAccess`).
    func removeLocally(_ note: Note, byYou: Bool = false) {
        if note.sharedNoteID == note.id {
            // The newest text this device has: the open document's, else the stored one's (the
            // note's own copy can be behind when it wasn't open).
            if let text = sessions[note.id]?.text ?? note.sharedDocument?.storedText() { note.body = text }
            forget(note)
            note.sharedNoteID = nil
            note.touch()
            context.saveOrReport()
            return
        }
        // Removed, or the owner stopped sharing: what to say, from the document before it goes.
        // A note you'd moved to Recently Deleted you left yourself.
        let removal = byYou || note.trashedAt != nil ? nil : lostAccess(note)
        forget(note)
        note.body = ""
        note.deletedAt = .now
        // Your own leaving is marked as yours (as deleting it is), so your other devices, which see
        // the note go through sync, don't tell you that you lost it.
        if byYou, note.trashedAt == nil { note.trashedAt = note.deletedAt }
        note.touch()
        context.saveOrReport()
        onClose?(note.id)
        if let removal { onLostAccess?(removal) }
    }

    /// What to tell you about a note you're no longer in, from what this device has of it, before
    /// its document goes: its title, who shared it, and your text when you'd typed in it here (in
    /// this run of the app, or changes still waiting to go up). Nil for a note whose document this
    /// device never had (nothing of it was shown here).
    func lostAccess(_ note: Note) -> SharedRemoval? {
        let session = sessions[note.id]
        guard session != nil || note.sharedDocument != nil else { return nil }
        let text = session?.text ?? note.sharedDocument?.storedText() ?? ""
        let typed = session.map { $0.typedHere || !$0.isSent } ?? !(note.sharedDocument?.outbox.isEmpty ?? true)
        let blank = text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        // The copy goes where the note was, unless that was Shared with me (it's not shared).
        let sharedWithMe = dataKey().map { SharedNotes.sharedWithMeID(dataKey: $0) }
        return SharedRemoval(id: note.id, title: blank ? "" : NoteText.title(of: text), owner: session?.ownerFirstName,
                             copy: typed && !blank ? text : nil, folder: note.folder.flatMap { $0.id == sharedWithMe ? nil : $0.id },
                             sharedWithMe: sharedWithMe)
    }

    /// Start fresh: the server deleted the account's shared notes and memberships with its keys.
    /// Every shared note goes from this device now, not on the next look at memberships.
    func startedFresh() {
        let shared = (try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.sharedNoteID != nil && $0.deletedAt == nil }))) ?? []
        for note in shared { removeLocally(note, byYou: true) }
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

// MARK: Losing access

/// A shared note that went from this device because you're no longer in it: its owner removed you
/// or stopped sharing it (the server doesn't say which). Said once, as Apple Notes does, with your
/// text to keep as a note of your own when you'd typed in it here (persona council round 7, bugs
/// 17 and 19).
struct SharedRemoval: Identifiable, Equatable {
    /// The note's id in your library (gone from it now).
    let id: UUID
    /// Empty when the note had no text.
    let title: String
    /// Who shared it, by first name, when this device knew.
    let owner: String?
    /// The text as it was on this device, when you'd typed in it: kept only if you choose.
    let copy: String?
    /// Where the note was in your library: the copy goes there.
    let folder: UUID?
    /// Your Shared with me folder, which the copy never goes in (it isn't shared).
    var sharedWithMe: UUID? = nil

    var alertTitle: String {
        title.isEmpty ? "You no longer have access to a shared note" : "You no longer have access to \u{201C}\(title)\u{201D}"
    }

    var message: String {
        let ask = "Ask \(owner ?? "its owner") to share it with you again if you still need it."
        guard copy != nil else { return ask }
        return ask + " You can keep a copy of it as it is on this \(InstallID.kind)."
    }

    static let keepCopy = "Keep a Copy"
    static let dontKeep = "Don\u{2019}t Keep"
}

/// Notes you lost access to, waiting to be said (SharedRemovalAlert, over the notes), oldest first.
/// Emptied when you sign out.
@MainActor @Observable
final class SharedRemovals {
    static let shared = SharedRemovals()
    private(set) var queue: [SharedRemoval] = []
    var current: SharedRemoval? { queue.first }

    func add(_ removal: SharedRemoval) {
        guard !queue.contains(where: { $0.id == removal.id }) else { return }
        queue.append(removal)
    }

    func shown(_ removal: SharedRemoval) { queue.removeAll { $0.id == removal.id } }

    func clear() { queue = [] }

    /// Keep a Copy: the text as a note of your own, where the shared note was, or else in your
    /// first folder that isn't Shared with me (the default folder can be that one: it sorts first).
    @discardableResult
    func keep(_ removal: SharedRemoval, in context: ModelContext) -> Note? {
        shown(removal)
        guard let text = removal.copy else { return nil }
        if let id = removal.folder, let folder = context.folder(id), folder.deletedAt == nil {
            return context.createNote(in: .folder(folder.id), body: text)
        }
        let own = context.allFolders().filter { $0.parent == nil && $0.id != removal.sharedWithMe }.min { $0.sortIndex < $1.sortIndex }
            ?? context.createFolder(named: "Notes")
        return context.createNote(in: .folder(own.id), body: text)
    }
}
