import CryptoKit
import Foundation
import Observation
import SwiftData
import os

private let log = Logger(subsystem: "dev.emilwagman.pane", category: "collab")

/// The formats of a file in a shared note (docs/Technical/collaboration-design.md, section 8,
/// "Files in shared notes"). Each file has its own random file key. Its bytes are sealed under it
/// (`amb3b`), and the key, with the file's name, type and size, is sealed under the note key
/// (`amb3x.<epoch>.…`), so whoever holds the note key opens it.
enum SharedFileCrypto {
    enum Failure: Error, Equatable { case malformed, wrongKey }

    /// What `amb3x` holds: the file key and what the file is.
    struct Meta: Codable, Equatable {
        var key: String
        var name: String
        var type: String
        var size: Int64
    }

    private static func keyAAD(note: UUID, epoch: Int, file: UUID) -> Data {
        Data("amb3x|\(note.uuidString.lowercased())|\(epoch)|\(file.uuidString.lowercased())".utf8)
    }

    private static func bytesAAD(note: UUID, file: UUID) -> Data {
        Data("amb3b|\(note.uuidString.lowercased())|\(file.uuidString.lowercased())".utf8)
    }

    /// The file key and what the file is, sealed under the note key of `epoch`.
    static func sealKey(_ meta: Meta, nk: SymmetricKey, note: UUID, epoch: Int, file: UUID) throws -> String {
        let plain = try JSONEncoder.sorted.encode(meta)
        guard let combined = try AES.GCM.seal(plain, using: nk, authenticating: keyAAD(note: note, epoch: epoch, file: file)).combined else { throw Failure.malformed }
        return "amb3x.\(epoch).\(combined.base64EncodedString())"
    }

    /// The epoch an `amb3x` box says it's sealed under (which note key opens it).
    static func epoch(of sealed: String) -> Int? {
        let parts = sealed.split(separator: ".", maxSplits: 2)
        guard parts.count == 3, parts[0] == "amb3x" else { return nil }
        return Int(parts[1])
    }

    static func openKey(_ sealed: String, nk: SymmetricKey, note: UUID, file: UUID) throws -> Meta {
        let parts = sealed.split(separator: ".", maxSplits: 2)
        guard parts.count == 3, parts[0] == "amb3x", let epoch = Int(parts[1]), let b = Data(base64Encoded: String(parts[2])),
              let box = try? AES.GCM.SealedBox(combined: b) else { throw Failure.malformed }
        guard let plain = try? AES.GCM.open(box, using: nk, authenticating: keyAAD(note: note, epoch: epoch, file: file)),
              let meta = try? JSONDecoder().decode(Meta.self, from: plain) else { throw Failure.wrongKey }
        return meta
    }

    static let magic = Data("amb3b".utf8)

    /// A file's bytes sealed under its own key: `amb3b ‖ nonce ‖ ct ‖ tag`.
    static func sealBytes(_ data: Data, key: SymmetricKey, note: UUID, file: UUID) throws -> Data {
        guard let combined = try AES.GCM.seal(data, using: key, authenticating: bytesAAD(note: note, file: file)).combined else { throw Failure.malformed }
        return magic + combined
    }

    static func openBytes(_ sealed: Data, key: SymmetricKey, note: UUID, file: UUID) throws -> Data {
        guard sealed.count >= magic.count + 28, sealed.prefix(magic.count) == magic,
              let box = try? AES.GCM.SealedBox(combined: sealed.dropFirst(magic.count)) else { throw Failure.malformed }
        guard let plain = try? AES.GCM.open(box, using: key, authenticating: bytesAAD(note: note, file: file)) else { throw Failure.wrongKey }
        return plain
    }

    static func fileKey(_ meta: Meta) throws -> SymmetricKey {
        guard let raw = Data(base64Encoded: meta.key), raw.count == 32 else { throw Failure.malformed }
        return SymmetricKey(data: raw)
    }
}

/// Files and photos in shared notes, on this device.
///
/// A note's text keeps `[name](pane-file:<id>)` as in any note; the file itself is the note's,
/// sealed under the note key (`SharedFileCrypto`, `shared_note_files`). Everyone who can edit adds
/// files by putting them in the text as they would in a note of their own: this device then
/// uploads each one the note doesn't have yet. The file stays in their own library too, as it was.
/// Everyone in the note gets a local `Attachment` for each file of the note that isn't theirs
/// (`sharedNoteID` set), so the editor, Quick Look, export and search find it as they find any
/// file; its bytes come from the note's folder on first open and stay on the device.
///
/// A new note key is followed by the owner's device sealing every file key again under it (`rekey`);
/// any editor's device that still has an older key catches up the ones left. Stopping sharing keeps
/// the owner's files: those others added are copied into the owner's own files first (new ids, the
/// text's links follow), then the note's folder is deleted. Keep a Copy, after you lose access,
/// keeps the files you have here the same way.
@MainActor
@Observable
final class SharedFiles {
    @ObservationIgnored let context: ModelContext
    @ObservationIgnored let transport: any CollabTransport
    /// Where this device keeps file bytes (`FileStore.root`; each device in a test has its own).
    @ObservationIgnored var root: URL
    /// The note keys this device holds for a shared note, by epoch.
    @ObservationIgnored private let keys: @MainActor (UUID) -> [Int: SymmetricKey]
    /// Bumps when files of a shared note arrive here: an open note fetches its pictures again.
    private(set) var arrived = 0

    /// Fetches one of your own files (SyncEngine), when one you put in a shared note isn't on this
    /// device: it's sealed under your key, and the note needs it under its own.
    @ObservationIgnored var fetchOwn: @MainActor (Attachment) async -> Bool = { a in await SharedFiles.fetchOwnFile?(a) ?? false }
    /// SyncEngine's fetch of your own files, for `fetchOwn`.
    static var fetchOwnFile: (@MainActor (Attachment) async -> Bool)?
    /// The signed-in library's fetch of a shared note's file (SharedLibrary.install), for SyncEngine.
    static var download: (@MainActor (Attachment) async -> Bool)?

    /// The note's files as the server last listed them, by shared note and file.
    @ObservationIgnored private var rows: [UUID: [UUID: Collab.NoteFile]] = [:]
    @ObservationIgnored private var owners: [UUID: UUID] = [:]
    @ObservationIgnored private var looked: [UUID: Date] = [:]
    @ObservationIgnored private var running: [UUID: Task<Void, Never>] = [:]
    @ObservationIgnored private var again: Set<UUID> = []
    /// A file whose adding failed, by id: when to try again.
    @ObservationIgnored private var retryAt: [UUID: Date] = [:]
    @ObservationIgnored var now: @MainActor () -> Date = { .now }
    /// A note's list is read again at most this often while its text names a file it doesn't have
    /// (the text can arrive before the file's row).
    @ObservationIgnored var lookEvery: TimeInterval = 5
    @ObservationIgnored var retryAfter: TimeInterval = 60

    enum Problem: LocalizedError {
        case notHere
        var errorDescription: String? {
            switch self {
            case .notHere: "The note's files couldn't be brought to this device. Try again when you're online."
            }
        }
    }

    init(context: ModelContext, transport: any CollabTransport, root: URL = FileStore.root, keys: @escaping @MainActor (UUID) -> [Int: SymmetricKey]) {
        self.context = context
        self.transport = transport
        self.root = root
        self.keys = keys
    }

    /// The files a note's text embeds, in order, each once.
    nonisolated static func fileIDs(in text: String) -> [UUID] {
        var out: [UUID] = []
        for m in text.matches(of: /pane-file:([0-9a-fA-F-]{36})/) {
            if let id = UUID(uuidString: String(m.1)), !out.contains(id) { out.append(id) }
        }
        return out
    }

    func url(_ a: Attachment) -> URL { FileStore.url(for: a.id, filename: a.filename, in: root) }
    func isHere(_ a: Attachment) -> Bool { FileManager.default.fileExists(atPath: url(a).path) }

    /// Shared files of a note on this device (not your own ones).
    func attachments(of shared: UUID) -> [Attachment] {
        let id: UUID? = shared
        return (try? context.fetch(FetchDescriptor<Attachment>(predicate: #Predicate { $0.sharedNoteID == id }))) ?? []
    }

    // MARK: Following a note

    /// A shared note opened, or its text changed: its files are brought up to date soon. One run
    /// at a time per note; a change meanwhile runs it once more after.
    func follow(_ session: CollabSession) {
        let shared = session.noteID
        guard !Self.fileIDs(in: session.text).isEmpty || rows[shared]?.values.contains(where: { $0.epoch < session.epoch }) == true else { return }
        if running[shared] != nil { again.insert(shared); return }
        running[shared] = Task { [weak self, weak session] in
            while let self, let session, !session.isClosed {
                self.again.remove(shared)
                await self.settle(session)
                guard self.again.contains(shared) else { break }
            }
            self?.running[shared] = nil
        }
    }

    /// Tests: waits until nothing is running.
    func settled() async {
        while let task = running.values.first { await task.value }
    }

    /// The note's files here as its text and the server have them: a file the text embeds and the
    /// note doesn't have yet goes up (if you can edit), each of the note's files gets its place
    /// here, and file keys under an older note key are sealed again under the current one.
    func settle(_ session: CollabSession) async {
        let shared = session.noteID
        let ids = Self.fileIDs(in: session.text)
        var known = rows[shared]
        if known == nil || (ids.contains { known?[$0] == nil } && mayLook(shared)) { known = await look(shared) ?? known }
        guard let known else { return }
        let keys = self.keys(shared).merging(session.noteKeys) { _, b in b }
        let canEdit = !session.isViewOnly
        var placed = false
        for id in ids {
            if let row = known[id] {
                if context.attachment(id) == nil, place(row, keys: keys) { placed = true }
            } else if canEdit, let a = context.attachment(id), a.deletedAt == nil, (retryAt[id] ?? .distantPast) <= now(), !session.isClosed {
                await add(a, to: session)
            }
        }
        if canEdit, !session.isClosed { await reseal(shared, keys: keys, nk: session.noteKey, epoch: session.epoch) }
        if placed {
            context.saveOrReport()
            arrived += 1
        }
    }

    private func mayLook(_ shared: UUID) -> Bool {
        guard let last = looked[shared] else { return true }
        return now().timeIntervalSince(last) >= lookEvery
    }

    /// The note's files from the server (nil when it couldn't be asked).
    @discardableResult
    private func look(_ shared: UUID) async -> [UUID: Collab.NoteFile]? {
        looked[shared] = now()
        do {
            let list = try await transport.noteFiles(note: shared)
            let byID = Dictionary(list.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
            rows[shared] = byID
            return byID
        } catch {
            log.error("a shared note's files didn't load: \(String(describing: error), privacy: .public)")
            return nil
        }
    }

    private func owner(of shared: UUID) async throws -> UUID {
        if let o = owners[shared] { return o }
        let o = try await transport.noteOwner(note: shared)
        owners[shared] = o
        return o
    }

    /// Someone else's file of the note gets its place here (not its bytes yet). False when its key
    /// didn't open (a key this device doesn't have yet).
    private func place(_ row: Collab.NoteFile, keys: [Int: SymmetricKey]) -> Bool {
        guard let nk = keys[row.epoch], let meta = try? SharedFileCrypto.openKey(row.key_ct, nk: nk, note: row.note_id, file: row.id) else { return false }
        let a = Attachment(id: row.id, filename: meta.name, contentType: meta.type, size: meta.size)
        a.sharedNoteID = row.note_id
        a.uploaded = true
        a.dirty = false
        a.modifiedAt = .now
        context.insert(a)
        return true
    }

    /// A file put in the note here goes up sealed under a key of its own, and its key under the
    /// note's. Two devices adding the same file at once each upload, under names of their own; the
    /// first row stays, and the other upload is never read (it goes with the note's folder).
    private func add(_ a: Attachment, to session: CollabSession) async {
        let shared = session.noteID, epoch = session.epoch, nk = session.noteKey, id = a.id
        do {
            guard let data = await bytes(of: a) else {
                retryAt[id] = now().addingTimeInterval(retryAfter)
                return
            }
            let owner = try await owner(of: shared)
            let fk = SymmetricKey(size: .bits256)
            let blob = UUID()
            try await transport.uploadNoteFile(owner: owner, note: shared, blob: blob, data: try SharedFileCrypto.sealBytes(data, key: fk, note: shared, file: id))
            let meta = SharedFileCrypto.Meta(key: E2EE.bytes(fk).base64EncodedString(), name: a.filename, type: a.contentType, size: Int64(data.count))
            let row = Collab.NoteFile(note_id: shared, id: id, blob: blob, epoch: epoch,
                                      key_ct: try SharedFileCrypto.sealKey(meta, nk: nk, note: shared, epoch: epoch, file: id), added_by: transport.me)
            if try await transport.addNoteFile(row) {
                rows[shared, default: [:]][id] = row
            } else {
                await look(shared)
            }
            retryAt[id] = nil
        } catch Collab.Failure.staleEpoch {
            // A new key on its way: tried again under it.
            retryAt[id] = nil
        } catch {
            log.error("a file didn't go into a shared note: \(String(describing: error), privacy: .public)")
            retryAt[id] = now().addingTimeInterval(retryAfter)
        }
    }

    /// A file's bytes, fetched first if they aren't here: your own from your files, someone else's
    /// from the note it came from.
    private func bytes(of a: Attachment) async -> Data? {
        if !isHere(a) {
            if a.sharedNoteID != nil { guard await download(a) else { return nil } }
            else { guard await fetchOwn(a) else { return nil } }
        }
        return try? Data(contentsOf: url(a))
    }

    // MARK: A new note key

    /// The note has a new key (someone was removed, or left): every file key sealed again under it
    /// (the owner's device, right after making it).
    func rekey(_ session: CollabSession) async {
        let shared = session.noteID
        await look(shared)
        let keys = self.keys(shared).merging(session.noteKeys) { _, b in b }
        await reseal(shared, keys: keys, nk: session.noteKey, epoch: session.epoch)
    }

    private func reseal(_ shared: UUID, keys: [Int: SymmetricKey], nk: SymmetricKey, epoch: Int) async {
        guard let known = rows[shared] else { return }
        var sealed: [UUID: String] = [:]
        for row in known.values where row.epoch < epoch {
            guard let old = keys[row.epoch], let meta = try? SharedFileCrypto.openKey(row.key_ct, nk: old, note: shared, file: row.id),
                  let ct = try? SharedFileCrypto.sealKey(meta, nk: nk, note: shared, epoch: epoch, file: row.id) else { continue }
            sealed[row.id] = ct
        }
        guard !sealed.isEmpty else { return }
        do {
            try await transport.resealNoteFiles(note: shared, epoch: epoch, keys: sealed)
            for (id, ct) in sealed {
                rows[shared]?[id]?.epoch = epoch
                rows[shared]?[id]?.key_ct = ct
            }
        } catch {
            log.error("a shared note's files weren't sealed under its new key: \(String(describing: error), privacy: .public)")
        }
    }

    // MARK: Opening a file

    /// Fetches someone else's file of a shared note to this device. It stays here (offline too).
    func download(_ a: Attachment) async -> Bool {
        guard let shared = a.sharedNoteID else { return false }
        let id = a.id, filename = a.filename
        for fresh in [false, true] {
            if fresh || rows[shared]?[id] == nil { await look(shared) }
            guard let row = rows[shared]?[id] else { continue }
            guard let nk = self.keys(shared)[row.epoch], let meta = try? SharedFileCrypto.openKey(row.key_ct, nk: nk, note: shared, file: id) else { continue }
            do {
                let owner = try await owner(of: shared)
                let sealed = try await transport.downloadNoteFile(owner: owner, note: shared, blob: row.blob)
                let data = try SharedFileCrypto.openBytes(sealed, key: try SharedFileCrypto.fileKey(meta), note: shared, file: id)
                let to = FileStore.url(for: id, filename: filename, in: root)
                try FileManager.default.createDirectory(at: to.deletingLastPathComponent(), withIntermediateDirectories: true)
                try data.write(to: to, options: .atomic)
                return true
            } catch {
                log.error("a shared note's file didn't download: \(String(describing: error), privacy: .public)")
                return false
            }
        }
        return false
    }

    // MARK: Sharing stops, or you lose access

    /// Before the owner stops sharing: every file of the note that someone else added, on this
    /// device (fetched now if it isn't), becomes a file of the owner's own with a new id, and the
    /// text links to it. Returns the text to keep. Throws when a file couldn't be fetched: sharing
    /// doesn't stop then, so nothing is lost.
    func keepForOwner(_ session: CollabSession) async throws -> String {
        let shared = session.noteID
        await look(shared)
        await settle(session)
        let ids = Set(Self.fileIDs(in: session.text))
        for a in attachments(of: shared) where ids.contains(a.id) && a.deletedAt == nil && !isHere(a) {
            guard await download(a) else { throw Problem.notHere }
        }
        // A file the text names that isn't here even as a place (its key never opened): fetched
        // nowhere, so stopping waits.
        for id in ids where context.attachment(id) == nil && rows[shared]?[id] != nil { throw Problem.notHere }
        return keepCopies(in: session.text)
    }

    /// The text with each shared file it embeds that's on this device copied into your own files
    /// (a new id, the link follows). Files that aren't here stay as links to nothing.
    func keepCopies(in text: String) -> String { Self.keepCopies(in: text, context: context, root: root) }

    static func keepCopies(in text: String, context: ModelContext, root: URL = FileStore.root) -> String {
        var map: [UUID: UUID] = [:]
        for id in fileIDs(in: text) {
            guard let a = context.attachment(id), a.sharedNoteID != nil, a.deletedAt == nil else { continue }
            let from = FileStore.url(for: a.id, filename: a.filename, in: root)
            guard FileManager.default.fileExists(atPath: from.path) else { continue }
            let own = Attachment(filename: a.filename, contentType: a.contentType, size: a.size)
            let to = FileStore.url(for: own.id, filename: own.filename, in: root)
            do {
                try FileManager.default.createDirectory(at: to.deletingLastPathComponent(), withIntermediateDirectories: true)
                try FileManager.default.copyItem(at: from, to: to)
            } catch {
                log.error("a shared file wasn't kept: \(String(describing: error), privacy: .public)")
                continue
            }
            context.insert(own)
            map[a.id] = own.id
        }
        guard !map.isEmpty else { return text }
        SyncSignal.changed()
        return relink(text, map)
    }

    /// `pane-file:` links moved to other files.
    nonisolated static func relink(_ text: String, _ map: [UUID: UUID]) -> String {
        text.replacing(/pane-file:([0-9a-fA-F-]{36})/) { m in
            guard let id = UUID(uuidString: String(m.1)), let to = map[id] else { return String(m.0) }
            return "pane-file:" + to.uuidString.lowercased()
        }
    }

    /// The note isn't shared anymore, or you're not in it: its files' places here go, and their bytes.
    func forget(_ shared: UUID) {
        for a in attachments(of: shared) { remove(a) }
        rows[shared] = nil
        owners[shared] = nil
        looked[shared] = nil
        context.saveOrReport()
    }

    private func remove(_ a: Attachment) {
        try? FileManager.default.removeItem(at: url(a).deletingLastPathComponent())
        context.delete(a)
    }

    /// Places of files whose shared note isn't in your library anymore (you left, were removed, or
    /// sharing stopped elsewhere) go, with their bytes, unless a note of yours still shows them.
    /// Not while you're still being asked whether to keep a copy of a note you lost.
    func sweep(asking: Bool = !SharedRemovals.shared.queue.isEmpty) {
        guard !asking else { return }
        let all = (try? context.fetch(FetchDescriptor<Attachment>(predicate: #Predicate { $0.sharedNoteID != nil }))) ?? []
        guard !all.isEmpty else { return }
        let live = Set(context.sharedNotes().compactMap(\.sharedNoteID))
        let orphans = all.filter { !live.contains($0.sharedNoteID!) }
        guard !orphans.isEmpty else { return }
        let bodies = ((try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil }))) ?? []).map(\.body)
        let shown = Set(bodies.flatMap { Self.fileIDs(in: $0) })
        var gone = 0
        for a in orphans where !shown.contains(a.id) {
            remove(a)
            gone += 1
        }
        if gone > 0 { context.saveOrReport() }
    }
}
