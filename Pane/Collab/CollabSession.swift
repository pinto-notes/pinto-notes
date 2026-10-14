import CryptoKit
import Foundation
import Observation
import SwiftUI
import os

private let log = Logger(subsystem: "dev.emilwagman.pane", category: "collab")

/// Collaboration: one shared note while it's open on this device.
///
/// The note's text is an Automerge document (UTF-16 offsets, so they match the editor's NSString
/// ranges). Your typing becomes splices into it; each splice goes up as a sealed change and comes
/// to the others over the note's channel. What arrives is merged by Automerge, and the editor
/// takes the merged text through the same minimal-diff path it uses for sync (your caret stays).
/// Presence (who's here, their cursor, whether they're typing) goes over the same channel, sealed.
@MainActor
@Observable
final class CollabSession {
    typealias Document = CollabText.Document
    typealias ObjId = CollabText.ObjId
    typealias Anchor = CollabText.Anchor

    struct Peer: Identifiable, Equatable {
        let id: UUID
        var name: String
        var selection: NSRange?
        /// Where their caret and selection end are, as stable positions in the document; resolved
        /// against the text here whenever it changes.
        var caret: Anchor?
        var end: Anchor?
        var typingUntil: Date?
        /// When their caret last moved or they last typed: the name flag shows for a moment after.
        var movedAt: Date = .now
        var isTyping: Bool { (typingUntil ?? .distantPast) > .now }
    }

    struct Member: Identifiable, Equatable {
        let id: UUID
        var name: String
        var role: String
        var publicKey: Data?
        var accepted: Bool
        /// Their profile photo's name (profiles.avatar_path), when they have one.
        var avatarPath: String? = nil
    }

    /// The shared note (`shared_notes.id`): what's sealed and sent. Not always the id of the note
    /// in your library (SharedNotes.noteID).
    let noteID: UUID
    private(set) var epoch: Int
    let me: UUID
    let myName: String
    /// The note keys this device holds, by epoch: changes and snapshots from before a new key
    /// still open with the one they were sealed with.
    @ObservationIgnored private var keys: [Int: SymmetricKey]
    private var nk: SymmetricKey { keys[epoch]! }
    /// The note key in use now (the owner's Share sheet seals links and new keys with it).
    var noteKey: SymmetricKey { nk }
    private let transport: any CollabTransport
    private let doc: Document
    private let body: ObjId
    /// The document on this device (SwiftData): saved as it changes, so it opens offline and
    /// nothing typed offline is lost.
    @ObservationIgnored let record: SharedDocument
    /// The document's text as last given to (or taken from) the editor.
    private(set) var text: String
    /// Who else has the note open right now, by user id.
    private(set) var peers: [UUID: Peer] = [:]
    private(set) var members: [Member] = []
    /// Whether the server has your changes: false while some wait to go up (offline, say).
    private(set) var isSent = true
    /// The newest server change this document holds (`SharedDocument.cursor`).
    var lastSeen: Int64 { record.cursor }
    /// Updates already in the document. Ids don't arrive in order (your own come back from the
    /// server before someone else's earlier one reaches you), so this, not `lastSeen`, decides.
    @ObservationIgnored private var applied: Set<Int64> = []
    /// Hands merged text to the open editor.
    @ObservationIgnored var onRemoteText: ((String) -> Void)?
    /// Hands other people's carets to the open editor, straight after any change that moves them
    /// (their text, yours, their presence), so text and carets change in the same frame.
    @ObservationIgnored var onCarets: (([RemoteCaret]) -> Void)?
    /// Mirrors the text into the note (list title, search, links) once it settles.
    @ObservationIgnored var onSettled: ((String) -> Void)?
    /// The note's members as last read, for the key-change check (CollabStore.checkKeys).
    @ObservationIgnored var onMembers: (([Collab.Member]) -> Void)?
    /// The server refused a change for an old key (or the channel refused you): the library
    /// looks for the new key (`reseal`), or finds you were removed.
    @ObservationIgnored var onKeyChanged: (() -> Void)?
    /// A new key was taken (`reseal`): the library keeps it, sealed under your data key.
    @ObservationIgnored var onResealed: ((SymmetricKey, Int) -> Void)?
    /// The server says you aren't in the note anymore.
    @ObservationIgnored var onRemoved: (() -> Void)?
    @ObservationIgnored private var channel: CollabChannel?
    @ObservationIgnored private var joining = false
    @ObservationIgnored private var sending = false
    @ObservationIgnored private var pulling: Task<Void, Never>?
    @ObservationIgnored private var retryTask: Task<Void, Never>?
    @ObservationIgnored private var retryDelay: Duration = .seconds(2)
    @ObservationIgnored private var snapshotTask: Task<Void, Never>?
    /// When a change from someone else last arrived: a snapshot waits for a quiet moment.
    @ObservationIgnored private var lastArrival = Date.distantPast
    /// A change too big to send on its own is in the document only: the next snapshot carries it.
    @ObservationIgnored private var needsSnapshot = false
    /// A change from the server that didn't open here: no snapshot until it does (a snapshot
    /// without it would let the server drop it for everyone).
    @ObservationIgnored private var missing = false
    @ObservationIgnored private var mySelection: NSRange?
    @ObservationIgnored private var typingAt = Date.distantPast
    @ObservationIgnored private var presenceTask: Task<Void, Never>?
    @ObservationIgnored private var settleTask: Task<Void, Never>?

    /// How many server changes make a snapshot due, and how quiet the note must be first. The
    /// quiet makes sure no change before the snapshot's point is still on its way in.
    static var snapshotEvery = 200
    static var snapshotQuiet: TimeInterval = 5
    /// A change sealed bigger than the server takes (note_updates.ct) goes in the next snapshot.
    static let maxUpdate = 262_144
    static let maxSnapshot = 4_194_304
    /// Local storage: the document is saved whole again once this many changes (or bytes) piled up.
    static var compactEvery = 200
    static let compactBytes = 256 * 1024
    /// Catching up asks again for a few ids before the cursor: a change whose id came before
    /// one already read can land a moment later (ids are handed out before commit).
    static let rewind: Int64 = 64

    /// A new shared document holding `initial` (the owner, when sharing). Saved in `record`.
    static func create(record: SharedDocument, nk: SymmetricKey, initial: String, transport: any CollabTransport, me: UUID, name: String) throws -> CollabSession {
        let doc = Document(textEncoding: .utf16)
        let body = try doc.putObject(obj: .ROOT, key: "body", ty: .Text)
        try doc.spliceText(obj: body, start: 0, delete: 0, value: initial)
        record.saved = doc.save()
        record.tail = Data()
        record.tailChanges = 0
        return CollabSession(record: record, keys: [record.epoch: nk], doc: doc, body: body, transport: transport, me: me, name: name)
    }

    /// The document as this device has it, with no network: what it saved, and the changes since.
    static func open(record: SharedDocument, keys: [Int: SymmetricKey], transport: any CollabTransport, me: UUID, name: String) throws -> CollabSession {
        guard !record.saved.isEmpty else { throw CollabCrypto.Failure.malformed }
        let doc = Document(textEncoding: .utf16)
        try CollabText.absorb(record.saved, into: doc)
        if !record.tail.isEmpty { try doc.applyEncodedChanges(encoded: record.tail) }
        guard case .Object(let body, .Text)? = try doc.get(obj: .ROOT, key: "body") else { throw CollabCrypto.Failure.malformed }
        return CollabSession(record: record, keys: keys, doc: doc, body: body, transport: transport, me: me, name: name)
    }

    /// The document as the server has it, for a device that has none yet: the newest snapshot,
    /// then the changes after it. Saved in `record`.
    static func load(record: SharedDocument, nk: SymmetricKey, transport: any CollabTransport, me: UUID, name: String) async throws -> CollabSession {
        let pull = try await transport.pull(note: record.id, after: 0)
        let keys = [record.epoch: nk]
        let doc = Document(textEncoding: .utf16)
        var last: Int64 = 0
        if let s = pull.snapshot {
            guard let k = keys[s.epoch] else { throw CollabCrypto.Failure.wrongKey }
            try CollabText.absorb(try CollabCrypto.open(.snapshot, s.ct, nk: k, note: record.id, extra: String(s.upto)), into: doc)
            last = s.upto
        }
        for u in pull.updates {
            guard let k = keys[u.epoch] else { continue }
            try CollabText.absorb(try CollabCrypto.open(.update, u.ct, nk: k, note: record.id, extra: u.author_id.uuidString), into: doc)
            last = max(last, u.id)
        }
        guard case .Object(let body, .Text)? = try doc.get(obj: .ROOT, key: "body") else { throw CollabCrypto.Failure.malformed }
        record.saved = doc.save()
        record.tail = Data()
        record.tailChanges = 0
        record.cursor = last
        record.sinceSnapshot = pull.updates.count
        let s = CollabSession(record: record, keys: keys, doc: doc, body: body, transport: transport, me: me, name: name)
        s.applied = Set(pull.updates.map(\.id))
        return s
    }

    private init(record: SharedDocument, keys: [Int: SymmetricKey], doc: Document, body: ObjId, transport: any CollabTransport, me: UUID, name: String) {
        noteID = record.id
        epoch = record.epoch
        self.keys = keys
        self.record = record
        self.doc = doc
        self.body = body
        self.transport = transport
        self.me = me
        myName = name
        text = (try? doc.text(obj: body)) ?? ""
        isSent = record.outbox.isEmpty
    }

    /// The note has a new key (someone was removed, or left): everything from here on is
    /// sealed with it. The document itself doesn't change. Changes waiting to go up go now.
    func reseal(nk: SymmetricKey, epoch: Int) {
        keys[epoch] = nk
        self.epoch = epoch
        record.epoch = epoch
        onResealed?(nk, epoch)
        saveSoon()
        sendPresence()
        flush()
    }

    /// The whole document sealed, for the server to hand to devices starting out.
    func sealedSnapshot(upto: Int64) throws -> String {
        try CollabCrypto.seal(.snapshot, doc.save(), nk: nk, note: noteID, epoch: epoch, extra: String(upto))
    }

    // MARK: Live

    func connect() {
        guard channel == nil, !joining else { return }
        joining = true
        Task { [weak self] in
            guard let self else { return }
            do {
                let channel = try await transport.join(note: noteID) { [weak self] event in self?.receive(event) }
                joining = false
                self.channel = channel
                sendPresence()
            } catch {
                joining = false
                log.error("joining the note's channel failed: \(String(describing: error), privacy: .public)")
                // Refused: most likely removed, or a new key. Offline: nothing to decide yet.
                if error is Collab.Failure { onKeyChanged?() }
            }
        }
        Task { await refreshMembers() }
        // Catch up on anything that landed while this device was away, and send what was typed meanwhile.
        catchUp()
        flush()
        // Presence is re-sent now and then, so someone who joins later sees you without waiting.
        presenceTask?.cancel()
        presenceTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(2))
                self?.sendPresence()
            }
        }
    }

    func disconnect() {
        presenceTask?.cancel()
        retryTask?.cancel()
        retryTask = nil
        snapshotTask?.cancel()
        channel?.close()
        channel = nil
        peers = [:]
        compact()
        saveSoon()
    }

    func refreshMembers() async {
        guard let rows = try? await transport.members(of: noteID) else { return }
        onMembers?(rows)
        members = rows.map { Member(id: $0.user_id, name: $0.display_name ?? "Someone", role: $0.role,
                                    publicKey: $0.public_key.flatMap { Data(base64Encoded: $0) }, accepted: $0.accepted, avatarPath: $0.avatar_path) }
    }

    /// Takes in every change the server has after this device's cursor (and the snapshot, when
    /// it's behind the newest one). One at a time; asked again while running, it runs once more.
    @discardableResult
    func catchUp() -> Task<Void, Never> {
        if let pulling { return pulling }
        let task = Task { [weak self] in
            guard let self else { return }
            await pull()
            pulling = nil
        }
        pulling = task
        return task
    }

    private func pull() async {
        let after = record.cursor > 0 ? max(0, record.cursor - Self.rewind) : 0
        let pull: Collab.Pull
        do {
            pull = try await transport.pull(note: noteID, after: after)
        } catch {
            if (error as? Collab.Failure) == .notMember { onRemoved?() }
            return
        }
        var changed = false
        // A snapshot this device is already past (asked a little before its cursor) has nothing new.
        if let s = pull.snapshot, s.upto > record.cursor {
            if let k = keys[s.epoch], let saved = try? CollabCrypto.open(.snapshot, s.ct, nk: k, note: noteID, extra: String(s.upto)) {
                if (try? CollabText.absorb(saved, into: doc)) != nil {
                    keep(saved)
                    changed = true
                }
                record.cursor = max(record.cursor, s.upto)
                record.sinceSnapshot = 0
            } else {
                log.error("a snapshot didn't open here")
                missing = true
            }
        }
        var newest = record.cursor
        for u in pull.updates {
            newest = max(newest, u.id)
            if take(u) { changed = true }
        }
        record.cursor = newest
        saveSoon()
        if changed { textChanged() }
        scheduleSnapshot()
    }

    private func receive(_ event: Collab.Event) {
        switch event {
        case .update(let u):
            if take(u) { textChanged() }
            saveSoon()
            scheduleSnapshot()
        case .reconnected:
            catchUp()
            flush()
        case .presence(let user, let ct):
            guard user != me, let k = keys[epoch], let data = try? CollabCrypto.open(.presence, ct, nk: k, note: noteID, extra: user.uuidString),
                  let p = try? JSONDecoder().decode(Presence.self, from: data) else { return }
            var peer = peers[user] ?? Peer(id: user, name: p.name)
            let wasHere = peers[user] != nil
            peer.name = p.name
            if peer.caret != p.caret || peer.end != p.end { peer.movedAt = .now }
            peer.caret = p.caret
            peer.end = p.end
            if p.typing == true { peer.typingUntil = .now.addingTimeInterval(1.6); peer.movedAt = .now }
            peers[user] = peer
            resolvePeers()
            if !wasHere { Task { await refreshMembers() }; sendPresence() }
        case .leave(let user):
            peers[user] = nil
        }
    }

    /// One change from the server into the document (and its storage). Your own come back too:
    /// from another of your devices they're new here; from this one Automerge already has them.
    /// Returns whether it was new.
    private func take(_ u: Collab.Update) -> Bool {
        guard u.note_id == noteID, !applied.contains(u.id) else { return false }
        applied.insert(u.id)
        record.sinceSnapshot += 1
        if u.author_id != me { lastArrival = .now }
        guard let k = keys[u.epoch] else {
            log.error("a change sealed with a key this device doesn't hold (epoch \(u.epoch))")
            missing = true
            return false
        }
        do {
            let change = try CollabCrypto.open(.update, u.ct, nk: k, note: noteID, extra: u.author_id.uuidString)
            try CollabText.absorb(change, into: doc)
            keep(change)
            return true
        } catch {
            log.error("a change didn't open or apply: \(String(describing: error), privacy: .public)")
            missing = true
            return false
        }
    }

    /// The document's text changed from outside: to the editor, the carets, and the note.
    private func textChanged() {
        let merged = (try? doc.text(obj: body)) ?? text
        guard merged != text else { resolvePeers(); return }
        text = merged
        onRemoteText?(merged)
        resolvePeers()
        settle()
    }

    // MARK: Your edits

    /// The editor's text after a keystroke: the difference goes into the document and up.
    func local(_ new: String, selection: NSRange?) {
        // Can view: the server would refuse it, so it isn't taken; the editor shows the note's text again.
        guard record.canEdit else { if new != text { onRemoteText?(text) }; return }
        guard let edit = TextDiff.edit(from: text, to: new) else { if let selection { mySelection = selection }; return }
        // Your caret is right after what you typed. The text view's own selection can still be the
        // one from before the keystroke at this point, which would put your caret a character
        // behind on everyone else's screen; the 0.1 s check corrects anything else (a selection).
        mySelection = NSRange(location: edit.range.location + (edit.replacement as NSString).length, length: 0)
        let before = doc.heads()
        let change: Data
        do {
            try doc.spliceText(obj: body, start: UInt64(edit.range.location), delete: Int64(edit.range.length),
                               value: edit.replacement.isEmpty ? nil : edit.replacement)
            // Only this edit: others' changes taken in since aren't sent back as yours.
            change = try doc.encodeChangesSince(heads: before)
        } catch {
            log.error("splice failed: \(String(describing: error), privacy: .public)")
            return
        }
        let merged = (try? doc.text(obj: body)) ?? new
        text = merged
        if merged != new { onRemoteText?(merged) }
        resolvePeers()
        if !change.isEmpty {
            keep(change)
            record.enqueue(change)
            isSent = false
        }
        saveSoon()
        typingAt = .now
        flush()
        sendPresence()
        settle()
    }

    /// Your caret, or nil while you aren't editing (then nobody sees a caret for you).
    func selectionChanged(_ selection: NSRange?) {
        guard selection != mySelection else { return }
        // While you type, your caret goes with each keystroke (local); the text view's own
        // selection can trail it there, so it isn't taken until you pause.
        if selection != nil, Date.now.timeIntervalSince(typingAt) < 0.6 { return }
        mySelection = selection
        sendPresence()
    }

    /// Sends the changes waiting to go up, oldest first, one at a time. Offline (or any failure
    /// that may pass), they stay, saved, and go when the server answers again.
    func flush() {
        guard !sending, !record.pending.isEmpty else { isSent = record.pending.isEmpty; return }
        guard record.canEdit else {
            // A viewer's edits are refused by the server: they stay on this device only until
            // the document is opened again.
            record.pending = []
            isSent = true
            return
        }
        sending = true
        Task { [weak self] in
            guard let self else { return }
            let outcome = await sendPending()
            sending = false
            isSent = record.pending.isEmpty
            saveSoon()
            switch outcome {
            case .done:
                retryDelay = .seconds(2)
                if !record.pending.isEmpty { flush() } else { scheduleSnapshot() }
            case .later:
                retry()
            case .stop:
                break
            }
        }
    }

    /// Changes made here that the server doesn't have yet.
    var unsent: Int { record.pending.count }

    private enum SendOutcome { case done, later, stop }

    private func sendPending() async -> SendOutcome {
        while let change = record.pending.first {
            let ct: String
            do {
                ct = try CollabCrypto.seal(.update, change, nk: nk, note: noteID, epoch: epoch, extra: me.uuidString)
            } catch {
                return .stop
            }
            if ct.utf8.count > Self.maxUpdate {
                // Too big for one change (a long paste): it's in the document, and the snapshot
                // that's due now carries it to everyone.
                needsSnapshot = true
                record.pending.removeFirst()
                continue
            }
            do {
                let row = try await transport.send(update: ct, note: noteID, epoch: epoch)
                applied.insert(row.id)
                record.sinceSnapshot += 1
                // Typing may have added more meanwhile; this one is the first still.
                if record.pending.first == change { record.pending.removeFirst() }
            } catch let failure as Collab.Failure {
                switch failure {
                case .staleEpoch:
                    // Kept, and sent again sealed with the new key once the library has it.
                    onKeyChanged?()
                    return .stop
                case .readOnly:
                    record.role = "viewer"
                    record.pending = []
                    return .stop
                case .notMember:
                    onRemoved?()
                    return .stop
                default:
                    // Refused for a reason that may mean you're no longer in the note: the library checks.
                    log.error("sending a change failed: \(String(describing: failure), privacy: .public)")
                    onKeyChanged?()
                    return .later
                }
            } catch {
                // Offline, or the connection dropped: try again in a while.
                return .later
            }
        }
        return .done
    }

    /// Tries the waiting changes again, waiting longer each time (2 s up to a minute).
    private func retry() {
        guard retryTask == nil else { return }
        let delay = retryDelay
        retryDelay = min(retryDelay * 2, .seconds(60))
        retryTask = Task { [weak self] in
            try? await Task.sleep(for: delay)
            guard let self, !Task.isCancelled else { return }
            retryTask = nil
            flush()
        }
    }

    private func settle() {
        settleTask?.cancel()
        settleTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(0.4))
            guard let self, !Task.isCancelled else { return }
            self.onSettled?(self.text)
        }
    }

    // MARK: Storage and snapshots

    /// A change (or snapshot) the document took in, appended to what's stored.
    private func keep(_ bytes: Data) {
        record.tail.append(bytes)
        record.tailChanges += 1
        if record.tailChanges >= Self.compactEvery || record.tail.count >= Self.compactBytes { compact() }
    }

    /// The document saved whole again, and the changes piled up since dropped: the device's own
    /// compaction, as snapshots are the server's.
    func compact() {
        guard record.tailChanges > 0 else { return }
        record.saved = doc.save()
        record.tail = Data()
        record.tailChanges = 0
    }

    private func saveSoon() {
        record.modelContext?.saveSoon()
    }

    /// A snapshot once enough changes piled up on the server (or one is needed to carry a change
    /// too big to send), after a quiet moment.
    private func scheduleSnapshot() {
        guard record.canEdit, needsSnapshot || record.sinceSnapshot >= Self.snapshotEvery, snapshotTask == nil else { return }
        snapshotTask = Task { [weak self] in
            guard let self else { return }
            defer { snapshotTask = nil }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Self.snapshotQuiet))
                if Date.now.timeIntervalSince(lastArrival) >= Self.snapshotQuiet { break }
            }
            // Still due: one written meanwhile (when sharing, say) made this one unnecessary.
            guard !Task.isCancelled, needsSnapshot || record.sinceSnapshot >= Self.snapshotEvery else { return }
            await writeSnapshot()
        }
    }

    /// Seals the whole document and sends it with the newest change it covers; the server then
    /// drops the changes up to there. Only with everything up to that point in it: it pulls first,
    /// and doesn't write one while a change from the server didn't open here.
    func writeSnapshot() async {
        guard record.canEdit else { return }
        await catchUp().value
        guard !missing, record.pending.isEmpty else { return }
        let upto = record.cursor
        guard let ct = try? sealedSnapshot(upto: upto), ct.utf8.count <= Self.maxSnapshot else { return }
        do {
            try await transport.send(snapshot: ct, note: noteID, upto: upto, epoch: epoch)
            record.sinceSnapshot = 0
            needsSnapshot = false
            compact()
            saveSoon()
        } catch {
            log.error("writing a snapshot failed: \(String(describing: error), privacy: .public)")
        }
    }

    // MARK: Presence

    private struct Presence: Codable {
        var name: String
        var caret: Anchor?
        var end: Anchor?
        var typing: Bool?
    }

    /// The anchor for a UTF-16 offset in this document's text.
    func anchor(at offset: Int) -> Anchor? { CollabText.anchor(in: doc, body, at: offset) }

    /// Where an anchor is in this document now (UTF-16), or nil when it names a character that
    /// hasn't arrived here yet (their presence can outrun their change).
    func offset(of a: Anchor?) -> Int? { CollabText.offset(of: a, in: doc, body) }

    /// Every peer's caret against the text as it is now. One that can't resolve yet keeps where it was.
    private func resolvePeers() {
        defer { onCarets?(remoteCarets) }
        for (id, p) in peers {
            // Not editing: no caret to show.
            guard p.caret != nil else { if p.selection != nil { peers[id]?.selection = nil }; continue }
            guard let start = offset(of: p.caret) else { continue }
            let end = p.end.flatMap { offset(of: $0) } ?? start
            let range = NSRange(location: min(start, end), length: abs(end - start))
            if peers[id]?.selection != range { peers[id]?.selection = range }
        }
    }

    private func sendPresence() {
        guard let channel, keys[epoch] != nil else { return }
        let sel = mySelection
        let p = Presence(name: myName, caret: sel.flatMap { anchor(at: $0.location) },
                         end: sel.flatMap { $0.length > 0 ? anchor(at: NSMaxRange($0)) : nil },
                         typing: Date.now.timeIntervalSince(typingAt) < 1.2)
        guard let data = try? JSONEncoder().encode(p),
              let ct = try? CollabCrypto.seal(.presence, data, nk: nk, note: noteID, epoch: epoch, extra: me.uuidString) else { return }
        channel.send(presence: ct)
    }

    // MARK: Showing people

    /// Each person keeps one colour everywhere: six muted, earthy tones that sit beside the amber
    /// brand without competing with it (clay, sage, dusk blue, plum, teal, olive). Amber itself is
    /// you, and AI edits. All take white initials at 4.5:1 or better.
    static func color(for user: UUID) -> Color {
        let h = user.uuidString.unicodeScalars.reduce(UInt32(7)) { ($0 &* 31) &+ $1.value }
        return color(at: Int(h % UInt32(palette.count)))
    }

    static let palette: [UInt32] = [0xA85A3C, 0x5E7A5A, 0x4F6B87, 0x7E5878, 0x3F7774, 0x7A6F3A]

    static func color(at i: Int) -> Color {
        let rgb = palette[i % palette.count]
        return Color(red: Double(rgb >> 16 & 0xFF) / 255, green: Double(rgb >> 8 & 0xFF) / 255, blue: Double(rgb & 0xFF) / 255)
    }

    /// Other people's carets and selections for the editor to draw.
    var remoteCarets: [RemoteCaret] {
        peers.values.compactMap { p in
            guard let s = p.selection else { return nil }
            return RemoteCaret(id: p.id, name: p.name.split(separator: " ").first.map(String.init) ?? p.name, color: Self.color(for: p.id), range: s,
                               showsName: Date.now.timeIntervalSince(p.movedAt) < 2.5)
        }.sorted { $0.id.uuidString < $1.id.uuidString }
    }
}

/// Someone else's caret (or selection) in the open note.
struct RemoteCaret: Equatable, Identifiable {
    let id: UUID
    let name: String
    let color: Color
    let range: NSRange
    /// The name flag shows while they type or just after their caret moves, then fades.
    var showsName = true
}
