import Automerge
import CryptoKit
import Foundation
import Observation
import SwiftData
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
        /// On a whiteboard: their pointer, in the board's own coordinates (so it lands on the same
        /// spot whatever each person's zoom and scroll), nil while it's off the board; and the ids of
        /// what they have selected.
        var pointer: CGPoint?
        var selectedIDs: [String] = []
        /// On a whiteboard (BoardFollow): what they're presenting, what of the board they see (in
        /// its own coordinates), and whose view they follow.
        var presenting: BoardPresenting?
        var view: CGRect?
        var following: UUID?
        /// When their caret last moved or they last typed: the name flag shows for a moment after.
        var movedAt: Date = .now
        /// When their presence last arrived. It comes every 2 seconds while they're connected.
        var heardAt: Date = .now
        var isTyping: Bool { (typingUntil ?? .distantPast) > .now }
        /// Nothing heard from them for a while: their connection or yours is down. Their avatar
        /// and caret are shown grey until they're heard again (persona council round 7, bug 18).
        func isStale(at now: Date = .now) -> Bool { now.timeIntervalSince(heardAt) >= Self.staleAfter }
        /// Presence goes out every 2 seconds: three missed and someone's connection (or yours) is down.
        static let staleAfter: TimeInterval = 6
    }

    /// A caret whose person isn't heard from: solid grey, on white and on black.
    static let staleColor = Color(red: 0x8E / 255, green: 0x8E / 255, blue: 0x93 / 255)

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
    /// Your role in the note, once the members have loaded: owner, editor or viewer.
    var myRole: String? { members.first { $0.id == me }?.role }
    /// A viewer reads; the server refuses their changes, so the editor doesn't take any.
    var isViewOnly: Bool { (myRole ?? role) == "viewer" }
    /// Your role as this device last knew it (`SharedDocument.role`).
    private(set) var role: String
    /// Closed for good (you left the note, or were removed, or signed out), or its storage went
    /// away with its library: nothing more is read, written or sent. A stored document can't be
    /// touched once its context is gone, and tasks still running (a send, a save) may outlive it.
    var isClosed: Bool { closed || (isStored && storage == nil) }
    @ObservationIgnored private var closed = false
    @ObservationIgnored private weak var storage: ModelContext?
    @ObservationIgnored private let isStored: Bool
    private(set) var epoch: Int
    let me: UUID
    /// Your name as the others see it: read each time your presence goes out, so a name your
    /// profile learns after the note opened reaches them without either app opening again
    /// (persona council round 7, bug 15).
    var myName: String { nameSource() }
    @ObservationIgnored private let nameSource: @MainActor () -> String
    /// The note keys this device holds, by epoch: changes and snapshots from before a new key
    /// still open with the one they were sealed with.
    @ObservationIgnored private var keys: [Int: SymmetricKey]
    private var nk: SymmetricKey { keys[epoch]! }
    /// The note key in use now (the owner's Share sheet seals links and new keys with it).
    var noteKey: SymmetricKey { nk }
    private let transport: any CollabTransport
    private let doc: Document
    private let body: ObjId
    /// A whiteboard's drawing (CollabBoard): its map, when the document is a board's.
    @ObservationIgnored private var boardObj: ObjId?
    /// The board's elements as the document holds them, each conflict resolved, and its settings.
    @ObservationIgnored private var boardEntries: [String: CollabBoard.Entry] = [:]
    @ObservationIgnored private var boardSettings: [String: Any] = [:]
    /// The document is a whiteboard's: its drawing is shared with its title.
    var isBoard: Bool { boardObj != nil }
    /// Hands the merged drawing to the open board (a scene), whenever someone else's change moved it.
    @ObservationIgnored var onRemoteBoard: (([String: Any]) -> Void)?
    /// An AI's change reached the drawing: whose ("Sara's Claude") and the elements it changed, for
    /// the open board to outline.
    @ObservationIgnored var onBoardAI: ((String, [String]) -> Void)?
    /// Someone else's change to the drawing arrived, or one from another of your devices (not an
    /// AI's: `onBoardAI`): whose (account ids, in the order they came) and which elements. The
    /// open board outlines it for a moment (round 14).
    @ObservationIgnored var onBoardArrived: (([UUID], [String]) -> Void)?
    /// Whose changes went in since the drawing was last read again.
    @ObservationIgnored private var arrivedFrom: [UUID] = []
    /// More than this many elements at once (a whole board caught up after a long time away) are
    /// not outlined: an outline round everything says nothing.
    nonisolated static let mostOutlined = 25
    /// Mirrors the drawing into the board's data once it settles (the list's picture, search, cards).
    @ObservationIgnored var onBoardSettled: (([String: Any]) -> Void)?
    /// Hands other people's pointers and selections to the open board, as soon as they move.
    @ObservationIgnored var onBoardPeers: (([BoardPeer]) -> Void)?
    /// Hands everyone else on the board to the open board, for following them (BoardFollow): who
    /// presents, where each one looks, whom each follows.
    @ObservationIgnored var onBoardPeople: (([BoardPerson]) -> Void)?
    /// Someone's laser trail, the points it went through since their last beat (board coordinates).
    @ObservationIgnored var onBoardLaser: ((UUID, [CGPoint]) -> Void)?
    /// The board's comments as the document holds them (BoardComments), each conflict resolved.
    @ObservationIgnored private(set) var boardComments: [BoardComment] = []
    /// Hands the board's comments to the open board whenever they change (someone else's, or yours).
    @ObservationIgnored var onBoardComments: (([BoardComment]) -> Void)?
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
    /// Since when your changes have waited without any going up: nil while the server has them all.
    /// Each change that goes up starts it again, so typing while online never counts as waiting
    /// (SharedSyncLine says "Not synced yet" after a while of it).
    private(set) var waitingSince: Date?
    /// When the server last got everything after a wait, and the longest stretch of that wait in
    /// which nothing went up ("Synced" shows for a moment after a long one).
    private(set) var sentAt: Date?
    private(set) var lastWait: TimeInterval = 0
    @ObservationIgnored private var longestWait: TimeInterval = 0
    /// You changed the text on this device since the app started: losing the note offers your
    /// copy of it (SharedRemoval).
    @ObservationIgnored private(set) var typedHere = false
    /// The newest server change this document holds (`SharedDocument.cursor`).
    var lastSeen: Int64 { isClosed ? 0 : record.cursor }
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
    /// Someone on the channel said who's in the note changed.
    @ObservationIgnored var onMembersChanged: (() -> Void)?
    /// A new key was taken (`reseal`): the library keeps it, sealed under your data key.
    @ObservationIgnored var onResealed: ((SymmetricKey, Int) -> Void)?
    /// The server says you aren't in the note anymore.
    @ObservationIgnored var onRemoved: (() -> Void)?
    /// An AI's change reached the text here (the editor has it already): the library marks the
    /// note as an AI's edit of a note of your own is (SharedLibrary.aiChanged).
    @ObservationIgnored var onAIChange: ((AIArrival) -> Void)?

    /// A change an AI wrote through its tools (the MCP server, as one of the note's people; the
    /// server names the AI on the change, `note_updates.client`): which AI, whose it is, and the
    /// text from just before it.
    struct AIArrival: Equatable {
        let ai: String
        let author: UUID
        let before: String
        /// On a whiteboard: the drawing from just before it (a scene, as JSON) and what it changed.
        var board: BoardChange? = nil
    }

    struct BoardChange: Equatable {
        let before: Data
        let ids: [String]
    }
    @ObservationIgnored private var channel: CollabChannel?
    @ObservationIgnored private var joining = false
    @ObservationIgnored private var sending = false
    @ObservationIgnored private var pulling: Task<Void, Never>?
    @ObservationIgnored private var pullAgain = false
    /// The next pull asks again for the few ids before the cursor (`rewind`).
    @ObservationIgnored private var pullRewinds = false
    /// Why the server isn't relaying this note's changes (Realtime refused to subscribe to them,
    /// in its words); nil while it relays them, or before it has said. Meanwhile the note pulls
    /// on every beat (2 s), not every 20 s: two people ticking one list see each tick in seconds.
    @ObservationIgnored private(set) var relayRefused: String?
    /// The last pull reached the server: everything stored up to `lastSeen` is in the document.
    @ObservationIgnored private var pulled = false
    /// Everything the server has is in the document as of the last pull, and every change opened:
    /// its text can stand for the note (stopping sharing writes it back as the owner's own).
    var isUpToDate: Bool { pulled && !missing && !isClosed }
    @ObservationIgnored private var retryTask: Task<Void, Never>?
    @ObservationIgnored private var retryDelay: Duration = .seconds(2)
    @ObservationIgnored private var snapshotTask: Task<Void, Never>?
    /// Tries a needed snapshot again later when it didn't go up (offline, a server error).
    @ObservationIgnored private var snapshotRetry: Task<Void, Never>?
    /// How long a needed snapshot that failed waits before the next try.
    static var snapshotRetryAfter: Duration = .seconds(20)
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
    @ObservationIgnored private var saveTask: Task<Void, Never>?

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
    /// `scene`: a whiteboard's drawing, shared with it (CollabBoard), and `comments`, the board's
    /// comments (BoardComments). The comments map is made now, even empty, so two people adding the
    /// first comment at once write into the same one.
    static func create(record: SharedDocument, nk: SymmetricKey, initial: String, scene: [String: Any]? = nil, comments: [BoardComment] = [],
                       transport: any CollabTransport, me: UUID,
                       name: @escaping @autoclosure @MainActor () -> String) throws -> CollabSession {
        let doc = Document(textEncoding: .utf16)
        let body = try doc.putObject(obj: .ROOT, key: "body", ty: .Text)
        try doc.spliceText(obj: body, start: 0, delete: 0, value: initial)
        if let scene {
            try CollabBoard.create(in: doc, scene: scene)
            _ = try doc.putObject(obj: .ROOT, key: BoardComments.key, ty: .Map)
            try BoardComments.put(comments, in: doc)
        }
        doc.commitWith(message: CollabHistory.stamp(me))
        record.saved = doc.save()
        record.tail = Data()
        record.tailChanges = 0
        let session = CollabSession(record: record, keys: [record.epoch: nk], doc: doc, body: body, transport: transport, me: me, name: name)
        // A board's pictures come with it: they go up before anyone can open it (SharedLibrary.becomeShared).
        if let files = scene?["files"] as? [String: Any] { session.seedPictures(files, send: true) }
        return session
    }

    /// The document as this device has it, with no network: what it saved, and the changes since.
    static func open(record: SharedDocument, keys: [Int: SymmetricKey], transport: any CollabTransport, me: UUID,
                     name: @escaping @autoclosure @MainActor () -> String) throws -> CollabSession {
        guard !record.saved.isEmpty else { throw CollabCrypto.Failure.malformed }
        let doc = Document(textEncoding: .utf16)
        try CollabText.absorb(record.saved, into: doc)
        if !record.tail.isEmpty { try doc.applyEncodedChanges(encoded: record.tail) }
        guard case .Object(let body, .Text)? = try doc.get(obj: .ROOT, key: "body") else { throw CollabCrypto.Failure.malformed }
        return CollabSession(record: record, keys: keys, doc: doc, body: body, transport: transport, me: me, name: name)
    }

    /// The document as the server has it, for a device that has none yet: the newest snapshot,
    /// then the changes after it. Saved in `record`.
    static func load(record: SharedDocument, nk: SymmetricKey, transport: any CollabTransport, me: UUID,
                     name: @escaping @autoclosure @MainActor () -> String) async throws -> CollabSession {
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
            // A change sealed under an earlier key that the snapshot already holds (it was made just
            // before a removal) can't be opened with this one, and doesn't need to be.
            guard let k = keys[u.epoch] else { last = max(last, u.id); continue }
            try CollabText.absorb(try CollabCrypto.open(.update, u.ct, nk: k, note: record.id, extra: u.author_id.uuidString), into: doc)
            last = max(last, u.id)
        }
        guard case .Object(let body, .Text)? = try doc.get(obj: .ROOT, key: "body") else { throw CollabCrypto.Failure.malformed }
        record.saved = doc.save()
        record.tail = Data()
        record.tailChanges = 0
        record.cursor = last
        record.snapshotUpto = pull.snapshot?.upto ?? 0
        record.sinceSnapshot = pull.updates.count
        CollabScript.trace("document loaded from the server: \(pull.updates.count) changes up to \(last), \(pull.updates.filter { $0.client != nil }.count) by an AI")
        let s = CollabSession(record: record, keys: keys, doc: doc, body: body, transport: transport, me: me, name: name)
        s.applied = Set(pull.updates.map(\.id))
        return s
    }

    private init(record: SharedDocument, keys: [Int: SymmetricKey], doc: Document, body: ObjId, transport: any CollabTransport, me: UUID,
                 name: @escaping @MainActor () -> String) {
        noteID = record.id
        epoch = record.epoch
        self.keys = keys
        self.record = record
        storage = record.modelContext
        isStored = record.modelContext != nil
        role = record.role
        self.doc = doc
        self.body = body
        self.transport = transport
        self.me = me
        nameSource = name
        text = (try? doc.text(obj: body)) ?? ""
        boardObj = CollabBoard.board(in: doc)
        if let boardObj {
            boardEntries = CollabBoard.entries(in: doc, boardObj)
            boardSettings = CollabBoard.settings(in: doc)
            boardComments = BoardComments.read(doc)
        }
        isSent = record.outbox.isEmpty
        // Changes typed here before (offline, then the app quit) still wait.
        if !isSent { waitingSince = .now }
    }

    /// Every change to `isSent`, so a wait is timed from its start to the moment it ends.
    private func setSent(_ sent: Bool) {
        guard sent != isSent else { return }
        let now = Date.now
        if sent {
            if let since = waitingSince { longestWait = max(longestWait, now.timeIntervalSince(since)) }
            lastWait = longestWait
            sentAt = now
            waitingSince = nil
        } else {
            longestWait = 0
            waitingSince = now
        }
        isSent = sent
    }

    /// A change went up and more still wait: the wait starts again from now.
    private func progressed() {
        guard !isSent, let since = waitingSince else { return }
        let now = Date.now
        longestWait = max(longestWait, now.timeIntervalSince(since))
        waitingSince = now
    }

    /// Your role changed (the server said so).
    func setRole(_ r: String) {
        guard !isClosed, r != role else { return }
        role = r
        record.role = r
        saveSoon()
    }

    /// For good: the session stops, before its storage is deleted.
    func close() {
        guard !isClosed else { return }
        disconnect()
        closed = true
        pulling?.cancel()
        settleTask?.cancel()
    }

    /// The note has a new key (someone was removed, or left): everything from here on is
    /// sealed with it. The document itself doesn't change. Changes waiting to go up go now.
    func reseal(nk: SymmetricKey, epoch: Int) {
        guard !isClosed else { return }
        keys[epoch] = nk
        self.epoch = epoch
        record.epoch = epoch
        onResealed?(nk, epoch)
        saveSoon()
        sendPresence()
        flush()
        // The board's pictures, sealed again under the new key by an editor who has both.
        if isBoard { syncPictures() }
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
                CollabScript.trace("joined the note's channel")
                sendPresence()
            } catch {
                joining = false
                log.error("joining the note's channel failed: \(String(describing: error), privacy: .public)")
                CollabScript.trace("joining the note's channel failed: \(error)")
                // Refused: most likely removed, or a new key. Offline: nothing to decide yet.
                if error is Collab.Failure { onKeyChanged?() }
            }
        }
        Task { await refreshMembers() }
        // Catch up on anything that landed while this device was away, and send what was typed meanwhile.
        catchUp()
        flush()
        // A board's pictures this device doesn't have yet, and what the server has of them.
        if isBoard { fetchPictures(); syncPictures() }
        // Presence is re-sent now and then, so someone who joins later sees you without waiting.
        // A pull every 20 seconds too: a relayed change can be lost (a dropped socket, a change
        // stored while the channel was joining), and Automerge holds every later one back until the
        // missing one arrives. An empty pull is one small request. While the server doesn't relay
        // changes at all, a pull on every beat instead, for what's new since the last one.
        presenceTask?.cancel()
        presenceTask = Task { [weak self] in
            var ticks = 0
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(2))
                guard let self else { return }
                sendPresence()
                ticks += 1
                if ticks % 10 == 0 { catchUp() } else if relayRefused != nil { catchUp(rewinding: false) }
            }
        }
    }

    func disconnect() {
        pictureRetry?.cancel()
        pictureRetry = nil
        presenceTask?.cancel()
        pointerTask?.cancel()
        pointerTask = nil
        retryTask?.cancel()
        retryTask = nil
        snapshotTask?.cancel()
        snapshotRetry?.cancel()
        saveTask?.cancel()
        channel?.close()
        channel = nil
        peers = [:]
        guard !isClosed else { return }
        compact()
        record.modelContext?.saveSoon()
    }

    func refreshMembers() async {
        guard let rows = try? await transport.members(of: noteID) else { return }
        onMembers?(rows)
        members = rows.map { Member(id: $0.user_id, name: $0.display_name ?? "Someone", role: $0.role,
                                    publicKey: $0.public_key.flatMap { Data(base64Encoded: $0) }, accepted: $0.accepted, avatarPath: $0.avatar_path) }
    }

    /// Takes in every change the server has after this device's cursor (and the snapshot, when
    /// it's behind the newest one). One at a time; asked again while running, it runs once more.
    /// `rewinding`: asks again for the few ids before the cursor too (`rewind`). The pulls on every
    /// beat while changes aren't relayed ask only for what's new; the one every 20 s still rewinds.
    @discardableResult
    func catchUp(rewinding: Bool = true) -> Task<Void, Never> {
        if rewinding { pullRewinds = true }
        if let pulling { pullAgain = true; return pulling }
        let task = Task { [weak self] in
            guard let self else { return }
            // Awaiting it means a pull that started after you asked.
            repeat {
                pullAgain = false
                let rewinding = pullRewinds
                pullRewinds = false
                await pull(rewinding: rewinding)
            } while pullAgain && !isClosed
            pulling = nil
        }
        pulling = task
        return task
    }

    private func pull(rewinding: Bool) async {
        guard !isClosed else { return }
        let back = rewinding ? Self.rewind : 0
        let after = record.cursor > 0 ? max(record.snapshotUpto, record.cursor - back, 0) : 0
        let pull: Collab.Pull
        do {
            pull = try await transport.pull(note: noteID, after: after)
        } catch {
            pulled = false
            if (error as? Collab.Failure) == .notMember { onRemoved?() }
            return
        }
        pulled = true
        guard !isClosed else { return }
        var changed = false
        // One this device is already past is known from here on, so it isn't asked for again.
        if let s = pull.snapshot, s.upto <= record.cursor { record.snapshotUpto = max(record.snapshotUpto, s.upto) }
        // A snapshot this device is already past (asked a little before its cursor) has nothing new.
        if let s = pull.snapshot, s.upto > record.cursor {
            if let k = keys[s.epoch], let saved = try? CollabCrypto.open(.snapshot, s.ct, nk: k, note: noteID, extra: String(s.upto)) {
                if (try? CollabText.absorb(saved, into: doc)) != nil {
                    keep(saved)
                    changed = true
                    CollabScript.trace("snapshot up to \(s.upto) taken by catch-up")
                }
                record.cursor = max(record.cursor, s.upto)
                record.snapshotUpto = max(record.snapshotUpto, s.upto)
                record.sinceSnapshot = 0
            } else {
                log.error("a snapshot didn't open here")
                missing = true
            }
        }
        var newest = record.cursor
        // An AI's change among them: the text from just before the first one, to mark what it changed.
        var ai: (update: Collab.Update, before: String, board: [String: CollabBoard.Entry])?
        var taken: [Int64] = []
        // The drawing as it was before this pull's changes went in.
        var boardBefore = boardEntries
        if changed, let boardObj { boardBefore = CollabBoard.entries(in: doc, boardObj, reuse: boardEntries) }
        for u in pull.updates {
            newest = max(newest, u.id)
            var before: String?
            var board = boardBefore
            if ai == nil, u.client != nil {
                before = try? doc.text(obj: body)
                if changed, let boardObj { board = CollabBoard.entries(in: doc, boardObj, reuse: boardBefore) }
            }
            let heads = before == nil ? nil : doc.heads()
            let took = take(u)
            traced(u, by: "catch-up", took: took)
            if took {
                changed = true
                taken.append(u.id)
                // An AI's change this document already has isn't news. After a relaunch the old ones
                // come round again, and someone's typing later in the batch was credited to the AI.
                if ai == nil, let before, !isHeld(u), doc.heads() != heads { ai = (u, before, board) }
            }
        }
        // Which way each change came, for the two-phone runs: a change taken here was not relayed.
        if !taken.isEmpty { CollabScript.trace("catch-up took \(taken.count == 1 ? "change \(taken[0])" : "\(taken.count) changes, \(taken[0]) to \(taken.last!)"), not relayed") }
        record.cursor = newest
        saveSoon()
        if changed { textChanged() }
        aiLanded()
        if let ai { aiArrived(ai.update, before: ai.before, board: ai.board) }
        scheduleSnapshot()
    }

    private func receive(_ event: Collab.Event) {
        guard !isClosed else { return }
        switch event {
        case .update(let u):
            let before = text
            let boardBefore = boardEntries
            let took = take(u)
            // Every change the channel relays, for the two-phone runs (an AI's, in more detail, below).
            CollabScript.trace("relay: change \(u.id) \(u.author_id == me ? "yours" : "someone else's"), \(took ? "taken" : "already here")")
            traced(u, by: "relay", took: took)
            if took {
                textChanged()
                aiLanded()
                aiArrived(u, before: before, board: boardBefore)
            }
            saveSoon()
            scheduleSnapshot()
        case .reconnected:
            CollabScript.trace(relayRefused == nil ? "the server relays this note's changes" : "the server relays this note's changes again")
            relayRefused = nil
            catchUp()
            flush()
        case .membersChanged:
            CollabScript.trace("who's in the note changed: checking memberships")
            onMembersChanged?()
        case .notRelaying(let why):
            // Said again each time Realtime tries (every 5 to 10 seconds): told once, until it changes.
            if relayRefused != why {
                log.error("the server isn't relaying a shared note's changes: \(why, privacy: .public)")
                CollabScript.trace("the server isn't relaying this note's changes (\(why)): pulling every 2 s until it does")
            }
            relayRefused = why
        case .presence(let user, let ct):
            guard user != me, let k = keys[epoch], let data = try? CollabCrypto.open(.presence, ct, nk: k, note: noteID, extra: user.uuidString),
                  let p = try? JSONDecoder().decode(Presence.self, from: data) else { return }
            var peer = peers[user] ?? Peer(id: user, name: p.name)
            let wasHere = peers[user] != nil
            peer.name = p.name
            peer.heardAt = .now
            let pointer = p.pointer.flatMap { $0.count == 2 && $0.allSatisfy(\.isFinite) ? CGPoint(x: $0[0], y: $0[1]) : nil }
            let selected = Array((p.sel ?? []).prefix(500))
            if peer.caret != p.caret || peer.end != p.end || peer.pointer != pointer || peer.selectedIDs != selected { peer.movedAt = .now }
            peer.caret = p.caret
            peer.end = p.end
            peer.pointer = pointer
            peer.selectedIDs = selected
            if p.typing == true { peer.typingUntil = .now.addingTimeInterval(1.6); peer.movedAt = .now }
            let wasLooking = BoardFollow.Look(presenting: peer.presenting, view: peer.view, following: peer.following)
            peer.presenting = p.present?.checked
            peer.view = BoardFollow.rect(p.view)
            peer.following = p.follow.flatMap { UUID(uuidString: $0) }
            peers[user] = peer
            resolvePeers()
            if isBoard {
                onBoardPeers?(boardPeers)
                if wasLooking != BoardFollow.Look(presenting: peer.presenting, view: peer.view, following: peer.following) || !wasHere { onBoardPeople?(boardPeople) }
                let trail = BoardFollow.points(p.laser)
                if !trail.isEmpty { onBoardLaser?(user, trail) }
            }
            if !wasHere { Task { await refreshMembers() }; sendPresence() }
        case .leave(let user):
            peers[user] = nil
            if isBoard { onBoardPeers?(boardPeers); onBoardPeople?(boardPeople) }
            // They may have left the note itself (Leave), not just closed it: People follows now,
            // not on the next poll.
            Task { await refreshMembers() }
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
            let heads = u.client == nil ? nil : doc.heads()
            try CollabText.absorb(change, into: doc)
            keep(change)
            // A person's change (yours from another device included): whose, for the board's outline.
            if isBoard, (u.client?.trimmingCharacters(in: .whitespaces) ?? "").isEmpty, !arrivedFrom.contains(u.author_id) { arrivedFrom.append(u.author_id) }
            // An AI's change that didn't go in: Automerge holds it back for one it builds on.
            if let heads, doc.heads() == heads { hold(u, change) }
            return true
        } catch {
            log.error("a change didn't open or apply: \(String(describing: error), privacy: .public)")
            missing = true
            return false
        }
    }

    /// A change the server says an AI wrote, once it changed the text here: to the library, after
    /// the editor has the text. Changes typed on a device name no AI.
    private func aiArrived(_ u: Collab.Update, before: String, board: [String: CollabBoard.Entry]? = nil) {
        guard !isClosed, let ai = u.client?.trimmingCharacters(in: .whitespacesAndNewlines), !ai.isEmpty, !isHeld(u) else { return }
        // On a whiteboard: what it changed in the drawing.
        let drew = board.flatMap { b in isBoard ? CollabBoard.changedIDs(from: b, to: boardEntries) : nil } ?? []
        guard text != before || !drew.isEmpty else {
            CollabScript.trace("AI change \(u.id): the text here didn't change, so it isn't marked")
            return
        }
        var arrival = AIArrival(ai: ai, author: u.author_id, before: before)
        if let board, !drew.isEmpty {
            arrival.board = BoardChange(before: Self.json(CollabBoard.scene(elements: CollabBoard.ordered(board), settings: boardSettings)), ids: drew)
            onBoardAI?(aiName(arrival), drew)
        }
        CollabScript.trace("AI change \(u.id): to the library to mark\(onAIChange == nil ? " (no library listening)" : "")")
        onAIChange?(arrival)
    }

    /// Whose AI it was, as the board says it: "Claude" for yours, "Sara's Claude" for someone else's.
    func aiName(_ a: AIArrival) -> String {
        AIEdit.whose(a.ai, person: a.author == me ? nil : firstName(of: a.author) ?? AIEdit.someone)
    }

    static func json(_ o: Any) -> Data { (try? JSONSerialization.data(withJSONObject: o)) ?? Data() }

    /// An AI's change as it reached this device, in the steps' log of a two-device run
    /// (CollabScript.trace): by relay or catch-up, yours or someone else's, and whether it went in.
    private func traced(_ u: Collab.Update, by path: String, took: Bool) {
        guard let ai = u.client else { return }
        let whose = u.author_id == me ? "yours" : "someone else's"
        let what = !took ? "not taken (already here, or it didn't open)" : isHeld(u) ? "held back for a change it builds on" : "taken"
        CollabScript.trace("AI change \(u.id) from \(ai), \(whose), by \(path): \(what)")
    }

    /// An AI's change that reached this device before a change it builds on (that one's relay was
    /// lost, or it was stored a moment late). Automerge holds it back until that one arrives, and
    /// it then goes in with that one, which no AI wrote: it came in unmarked (persona council round 7,
    /// bug 16, on the phone of the person whose AI it was). Kept until it lands, then marked.
    private struct HeldAI {
        let update: Collab.Update
        let hash: CollabText.ChangeHash
    }
    @ObservationIgnored private var heldAI: [HeldAI] = []

    private func isHeld(_ u: Collab.Update) -> Bool { heldAI.contains { $0.update.id == u.id } }

    /// Keeps an AI's change Automerge held back, by its hash. One the document has already isn't news.
    private func hold(_ u: Collab.Update, _ change: Data) {
        guard let hash = CollabText.hash(of: change), doc.change(hash: hash) == nil else { return }
        heldAI.append(HeldAI(update: u, hash: hash))
        if heldAI.count > 16 { heldAI.removeFirst() }
    }

    /// Held AI changes that went in since (what each builds on arrived, as a change or in a snapshot):
    /// marked now, each from the text as this device has it without that change.
    private func aiLanded() {
        guard !heldAI.isEmpty, !isClosed else { return }
        var landed: [(Collab.Update, String, [String: CollabBoard.Entry]?)] = []
        heldAI.removeAll { held in
            guard doc.change(hash: held.hash) != nil else { return false }
            CollabScript.trace("AI change \(held.update.id) went in, held back until now")
            if let before = CollabText.text(without: held.hash, in: doc, body) {
                let board = boardObj.flatMap { b in CollabText.heads(without: held.hash, in: doc).map { CollabBoard.entries(in: doc, b, heads: $0) } }
                landed.append((held.update, before, board))
            }
            return true
        }
        for (u, before, board) in landed { aiArrived(u, before: before, board: board) }
    }

    /// The one other person in the note by first name, when there's just one and it's known.
    var onlyOtherName: String? {
        let others = members.filter { $0.id != me }
        return others.count == 1 ? firstName(of: others[0].id) : nil
    }

    /// The note's owner by first name, once its members have loaded (nil for a nameless owner).
    var ownerFirstName: String? {
        guard let owner = members.first(where: { $0.role == "owner" }), owner.name != "Someone" else { return nil }
        return owner.name.split(separator: " ").first.map(String.init)
    }

    /// Someone's first name as this note knows it (its members, else their presence), for "Sara's
    /// Claude". Nil when the note doesn't know them yet.
    func firstName(of user: UUID) -> String? {
        let listed = members.first { $0.id == user }?.name
        let full = listed.flatMap { $0 == "Someone" ? nil : $0 } ?? peers[user]?.name
        return full.flatMap { $0.split(separator: " ").first.map(String.init) }
    }

    /// The document's text changed from outside: to the editor, the carets, and the note.
    private func textChanged() {
        let mended = mendTicks()
        boardChanged()
        commentsChanged()
        let merged = (try? doc.text(obj: body)) ?? text
        guard merged != text else { resolvePeers(); if mended { flush() }; return }
        text = merged
        onRemoteText?(merged)
        resolvePeers()
        settle()
        if mended { flush() }
    }

    /// Two people ticking (or unticking) the same item at once each replaced its one character,
    /// and the merge keeps both: "- [xx] Milk", which no longer reads as a box. A device that
    /// sees it keeps the first character and drops the rest. Every device orders the two the
    /// same way, so two devices mending it at once drop the same one and it ends as one tick.
    /// True when it changed the document (the change is queued, not sent yet).
    private func mendTicks() -> Bool {
        guard !isClosed, record.canEdit, !isViewOnly, let current = try? doc.text(obj: body) else { return false }
        let drops = CollabTicks.drops(in: current)
        guard !drops.isEmpty else { return false }
        let before = doc.heads()
        let change: Data
        do {
            for r in drops.reversed() { try doc.spliceText(obj: body, start: UInt64(r.location), delete: Int64(r.length), value: nil) }
            doc.commitWith(message: CollabHistory.stamp(me), timestamp: now())
            change = try doc.encodeChangesSince(heads: before)
        } catch {
            log.error("mending a tick failed: \(String(describing: error), privacy: .public)")
            return false
        }
        guard !change.isEmpty else { return false }
        keep(change)
        record.enqueue(change)
        setSent(false)
        saveSoon()
        return true
    }

    // MARK: Your edits

    /// The editor's text after a keystroke: the difference goes into the document and up.
    func local(_ new: String, selection: NSRange?) {
        // Can view: the server would refuse it, so it isn't taken; the editor shows the note's text again.
        guard !isClosed, record.canEdit, !isViewOnly else { if new != text { onRemoteText?(text) }; return }
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
            doc.commitWith(message: CollabHistory.stamp(me, restored: restoring), timestamp: now())
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
            setSent(false)
            typedHere = true
        }
        saveSoon()
        typingAt = .now
        flush()
        sendPresence()
        settle()
    }

    /// An edit of yours made outside the editor (Undo of an AI's change, the widget, Siri): into
    /// the document and up as typing goes, and to the open editor, which didn't make it. Left out
    /// of the editor, its next keystroke diffed the old text back over it.
    func localFromOutside(_ new: String) {
        local(new, selection: nil)
        onRemoteText?(text)
    }

    // MARK: The whiteboard

    /// The drawing as the document has it now: a whole scene, as the board's data keeps it.
    func boardScene() -> [String: Any] {
        CollabBoard.scene(elements: CollabBoard.ordered(boardEntries), settings: boardSettings, files: pictures)
    }

    /// The document's drawing changed from outside: read again (only what changed is decoded),
    /// and to the open board. Nothing when it's the same.
    private func boardChanged() {
        let from = arrivedFrom
        arrivedFrom = []
        if boardObj == nil { boardObj = CollabBoard.board(in: doc) }
        guard let boardObj else { return }
        let entries = CollabBoard.entries(in: doc, boardObj, reuse: boardEntries)
        let settings = CollabBoard.settings(in: doc)
        let changed = CollabBoard.changedIDs(from: boardEntries, to: entries)
        let same = entries.count == boardEntries.count && changed.isEmpty
            && NSDictionary(dictionary: settings).isEqual(to: boardSettings)
        guard !same else { return }
        boardEntries = entries
        boardSettings = settings
        onRemoteBoard?(boardScene())
        // Whose change it was, for the open board to outline (after it has the drawing).
        let shown = changed.filter { entries[$0].map { ($0.element["isDeleted"] as? Bool) != true } ?? false }
        if !from.isEmpty, !shown.isEmpty, shown.count <= Self.mostOutlined { onBoardArrived?(from, shown) }
        settleBoard()
        fetchPictures()
    }

    /// What the open board drew or changed (elements the page saw change since it last said, and
    /// its settings): each element that wins over the document's copy goes in, as one change, and
    /// up as typing does. A new picture goes in with its bytes (`offerPictures`), which go up
    /// first, and only while the board's pictures in use fit in 4 MB; one that can't is handed
    /// back to the page to take off (`onPicturesRefused`). A viewer's go nowhere.
    func boardLocal(_ elements: [[String: Any]], settings: [String: Any] = [:]) {
        defer { offered = [:] }
        guard !isClosed, let boardObj, record.canEdit, !isViewOnly else { return }
        let elements = admitPictures(elements)
        let wins = CollabBoard.winners(elements, over: boardEntries.mapValues(\.stamp))
        // Something the page changed lost to what the document holds (someone else's edit of it
        // that the page hadn't merged yet): the page is handed the document's, so it ends the same.
        if wins.count < elements.filter({ CollabBoard.id(of: $0) != nil && CollabBoard.keeps($0) }).count {
            onRemoteBoard?(boardScene())
        }
        var newSettings: [String: ScalarValue] = [:]
        for k in CollabBoard.settings {
            guard let v = CollabBoard.scalar(settings[k]), v != CollabBoard.scalar(boardSettings[k]) else { continue }
            newSettings[k] = v
        }
        guard !wins.isEmpty || !newSettings.isEmpty else { return }
        let before = doc.heads()
        let change: Data
        do {
            for (id, e) in wins {
                guard let json = CollabBoard.encode(e) else { continue }
                try doc.put(obj: boardObj, key: id, value: .String(json))
            }
            if !newSettings.isEmpty {
                let state = try CollabBoard.state(in: doc) ?? doc.putObject(obj: .ROOT, key: CollabBoard.stateKey, ty: .Map)
                for (k, v) in newSettings { try doc.put(obj: state, key: k, value: v) }
            }
            doc.commitWith(message: CollabHistory.stamp(me), timestamp: now())
            change = try doc.encodeChangesSince(heads: before)
        } catch {
            log.error("a board change didn't go in: \(String(describing: error), privacy: .public)")
            return
        }
        boardEntries = CollabBoard.entries(in: doc, boardObj, reuse: boardEntries)
        boardSettings = CollabBoard.settings(in: doc)
        guard !change.isEmpty else { return }
        keep(change)
        record.enqueue(change)
        setSent(false)
        typedHere = true
        saveSoon()
        flush()
        settleBoard()
    }

    /// Puts the drawing back as `scene` had it (Undo of an AI's change): each element that differs
    /// goes in as a new edit of yours, newer than the document's, so it wins on every device; one
    /// added since is deleted.
    func boardRevert(to scene: [String: Any]) {
        guard isBoard, canWrite else { return }
        var before: [String: CollabBoard.Element] = [:]
        for e in (scene["elements"] as? [CollabBoard.Element]) ?? [] { if let id = CollabBoard.id(of: e), CollabBoard.keeps(e) { before[id] = e } }
        var out: [CollabBoard.Element] = []
        let at = Int(now().timeIntervalSince1970 * 1000)
        for (id, current) in boardEntries {
            var e: CollabBoard.Element
            if let was = before[id] {
                guard !NSDictionary(dictionary: was).isEqual(to: current.element) else { continue }
                e = was
            } else {
                guard (current.element["isDeleted"] as? Bool) != true else { continue }
                e = current.element
                e["isDeleted"] = true
            }
            e["version"] = current.stamp.version + 1
            e["versionNonce"] = Int.random(in: 1..<Int(Int32.max))
            e["updated"] = at
            out.append(e)
        }
        for (id, was) in before where boardEntries[id] == nil { out.append(was) }
        boardLocal(out, settings: (scene["appState"] as? [String: Any]) ?? [:])
        onRemoteBoard?(boardScene())
    }

    @ObservationIgnored private var boardSettleTask: Task<Void, Never>?

    // MARK: Comments

    /// The document's comments changed from outside: read again, and to the open board.
    private func commentsChanged() {
        guard isBoard else { return }
        let now = BoardComments.read(doc)
        guard now != boardComments else { return }
        boardComments = now
        onBoardComments?(now)
    }

    /// Comments of yours (new ones, replies, a thread resolved or opened again) into the document,
    /// as one change, and up as the drawing goes. A viewer's go nowhere (BoardComments).
    func commentLocal(_ comments: [BoardComment]) {
        guard !isClosed, isBoard, !comments.isEmpty, record.canEdit, !isViewOnly else { return }
        let before = doc.heads()
        let change: Data
        do {
            try BoardComments.put(comments, in: doc)
            doc.commitWith(message: CollabHistory.stamp(me), timestamp: now())
            change = try doc.encodeChangesSince(heads: before)
        } catch {
            log.error("a comment didn't go in: \(String(describing: error), privacy: .public)")
            return
        }
        guard !change.isEmpty else { return }
        keep(change)
        record.enqueue(change)
        setSent(false)
        typedHere = true
        saveSoon()
        flush()
        commentsChanged()
    }

    /// Someone's colour on this board ("#RRGGBB"), for their comments' pins: the one their pointer
    /// has. Anyone not in the board (they left) keeps the one their account id picks.
    func boardColor(of user: String) -> String {
        guard let id = UUID(uuidString: user) else { return BoardComments.color(for: user) }
        return Self.hex(Self.palette[paletteSlot(of: id)].light)
    }

    private func settleBoard() {
        boardSettleTask?.cancel()
        boardSettleTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(0.4))
            guard let self, !Task.isCancelled, !isClosed else { return }
            onBoardSettled?(boardScene())
        }
    }

    /// Your pointer on the board (in its own coordinates; nil while it's off the board) and what
    /// you have selected. Goes out at most ten times a second, and with every beat.
    func boardPresence(pointer: CGPoint?, selection: [String]) {
        guard isBoard, pointer != myPointer || selection != myBoardSelection else { return }
        myPointer = pointer
        myBoardSelection = selection
        boardPresenceSoon()
    }

    /// What you present and see of the board, and your laser's trail (BoardFollow): with your
    /// pointer, at most ten times a second. The trail's points wait for the next beat, so none of
    /// them is lost between beats.
    func boardLook(_ look: BoardLook) {
        guard isBoard else { return }
        let trail = look.laser ?? []
        let presenting = look.presenting?.checked, view = look.view.map(BoardFollow.rounded)
        guard presenting != myPresenting || view != myView || !trail.isEmpty || (look.laser != nil) != myLaserOn else { return }
        myPresenting = presenting
        myView = view
        myLaserOn = look.laser != nil
        myLaser.append(contentsOf: trail)
        if myLaser.count > BoardFollow.mostLaserPoints { myLaser.removeFirst(myLaser.count - BoardFollow.mostLaserPoints) }
        boardPresenceSoon()
    }

    /// Whose view you follow on the board (nil: nobody), told to the others: the one you follow
    /// sees how many do.
    func boardFollow(_ id: UUID?) {
        guard isBoard, id != myFollow else { return }
        myFollow = id
        boardPresenceSoon()
    }

    /// Everyone else on the board, for following them: their colour, what they present, what they
    /// see and whom they follow, whether or not their pointer is on the board.
    var boardPeople: [BoardPerson] { boardPeople(at: .now) }

    func boardPeople(at now: Date) -> [BoardPerson] {
        let slots = Self.slots(for: colorOrder)
        return peers.values.map { p in
            let shades = Self.palette[slots[p.id] ?? Int(Self.paletteIndex(for: p.id))]
            return BoardPerson(id: p.id, name: p.name.split(separator: " ").first.map(String.init) ?? p.name, color: Self.hex(shades.light), dark: Self.hex(shades.dark),
                               presenting: p.presenting, view: p.view, following: p.following, stale: p.isStale(at: now))
        }.sorted { $0.id.uuidString < $1.id.uuidString }
    }

    private func boardPresenceSoon() {
        let wait = Self.pointerEvery - Date.now.timeIntervalSince(pointerSentAt)
        guard wait > 0 else { pointerSentAt = .now; sendPresence(); return }
        guard pointerTask == nil else { return }
        pointerTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(wait))
            guard let self, !Task.isCancelled else { return }
            pointerTask = nil
            pointerSentAt = .now
            sendPresence()
        }
    }

    /// How often your pointer goes out while it moves (Realtime takes about ten messages a second
    /// from a device).
    static var pointerEvery: TimeInterval = 0.1
    @ObservationIgnored private var myPointer: CGPoint?
    @ObservationIgnored private var myBoardSelection: [String] = []
    @ObservationIgnored private(set) var myPresenting: BoardPresenting?
    @ObservationIgnored private(set) var myView: CGRect?
    @ObservationIgnored private(set) var myFollow: UUID?
    @ObservationIgnored private var myLaserOn = false
    @ObservationIgnored private var myLaser: [CGPoint] = []
    @ObservationIgnored private var pointerSentAt = Date.distantPast
    @ObservationIgnored private var pointerTask: Task<Void, Never>?

    /// Everyone else's pointer and selection for the board to draw, now.
    var boardPeers: [BoardPeer] { boardPeers(at: .now) }

    /// You can see them at work on the board now: their pointer or selection shows, and they've
    /// been heard from lately. Their changes need no outline (round 14: "nothing while you're
    /// watching them draw live").
    func watching(_ user: UUID, at now: Date = .now) -> Bool {
        guard let p = peers[user] else { return false }
        return !p.isStale(at: now) && (p.pointer != nil || !p.selectedIDs.isEmpty)
    }

    /// Someone's colour on this board, on white and on a dark board ("#RRGGBB").
    func boardColors(of user: UUID) -> (light: String, dark: String) {
        let shades = Self.palette[paletteSlot(of: user)]
        return (Self.hex(shades.light), Self.hex(shades.dark))
    }

    func boardPeers(at now: Date) -> [BoardPeer] {
        let slots = Self.slots(for: colorOrder)
        return peers.values.compactMap { p in
            guard p.pointer != nil || !p.selectedIDs.isEmpty else { return nil }
            let stale = p.isStale(at: now)
            let shades: (light: UInt32, dark: UInt32) = stale ? (0x8E8E93, 0x8E8E93) : Self.palette[slots[p.id] ?? Int(Self.paletteIndex(for: p.id))]
            return BoardPeer(id: p.id, name: p.name.split(separator: " ").first.map(String.init) ?? p.name, color: Self.hex(shades.light), dark: Self.hex(shades.dark),
                             pointer: p.pointer, selection: p.selectedIDs, showsName: !stale && now.timeIntervalSince(p.movedAt) < RemoteCaret.flagFor)
        }.sorted { $0.id.uuidString < $1.id.uuidString }
    }

    // MARK: The whiteboard's pictures

    typealias Picture = CollabBoard.Pictures.File

    /// The board's pictures this device has, by file id, as the board keeps them: put on the board
    /// here, fetched, or kept beside the note from before (the board's data, offline).
    @ObservationIgnored private(set) var pictures: [String: Picture] = [:]
    /// Pictures the open board handed over with the change it's about to send.
    @ObservationIgnored private var offered: [String: Picture] = [:]
    /// Pictures put on the board here that the server doesn't have yet, oldest first. They go up
    /// before the changes that show them (`sendPending`), so nobody draws a picture whose bytes
    /// aren't there to fetch.
    @ObservationIgnored private(set) var picturesToSend: [String] = []
    /// Pictures the server is known to have (sent or fetched here, or listed by it).
    @ObservationIgnored private var stored: Set<String> = []
    @ObservationIgnored private var fetching: Set<String> = []
    /// Pictures that weren't there when asked for: asked for again by the retry, not on every change.
    @ObservationIgnored private var waitingFor: Set<String> = []
    @ObservationIgnored private var pictureRetry: Task<Void, Never>?
    @ObservationIgnored private var pictureDelay: Duration = .seconds(1)
    @ObservationIgnored private var syncing: Task<Void, Never>?
    /// How long a picture that wasn't there waits before it's asked for again, at most.
    static var pictureRetryLongest: Duration = .seconds(30)
    /// Pictures that can't go on the shared board, and why: the elements that show them, for the
    /// open board to take off, and a line to say.
    @ObservationIgnored var onPicturesRefused: (([String], String) -> Void)?

    /// The image elements on the board now, deleted ones too.
    private var boardImages: [[String: Any]] {
        boardEntries.values.compactMap { CollabBoard.Pictures.fileID(of: $0.element) == nil ? nil : $0.element }
    }

    /// Pictures this device already has for the board (kept beside the note, or the owner's board
    /// as it was before it was shared). `send`: the server doesn't have them yet.
    func seedPictures(_ files: [String: Any], send: Bool = false) {
        let inUse = CollabBoard.Pictures.inUse(boardImages)
        for (id, f) in files {
            guard pictures[id] == nil, let picture = CollabBoard.Pictures.valid(f, id: id) else { continue }
            pictures[id] = picture
            if send, inUse.contains(id), !picturesToSend.contains(id) { picturesToSend.append(id) }
        }
    }

    /// Pictures the open board sends with its next change (pasted, dropped, from the Image button
    /// or the library): taken when that change shows them.
    func offerPictures(_ files: [String: Any]) {
        guard isBoard, canWrite else { return }
        for (id, f) in files { if let picture = CollabBoard.Pictures.valid(f, id: id) { offered[id] = picture } }
    }

    /// `elements` with the pictures that can't go on the board left out, and those handed back to
    /// the page. A picture already on the board goes as any element does (moved, resized, copied).
    /// One that starts showing here (new, or deleted and brought back) needs its bytes, here
    /// already or offered with it, and room: the board's pictures in use stay within 4 MB, as on a
    /// board of your own. One brought back whose bytes this device never had went up with it first.
    private func admitPictures(_ elements: [[String: Any]]) -> [[String: Any]] {
        let showing = elements.filter { e in
            guard let id = CollabBoard.id(of: e), CollabBoard.Pictures.fileID(of: e) != nil, (e["isDeleted"] as? Bool) != true else { return false }
            return boardEntries[id].map { ($0.element["isDeleted"] as? Bool) == true } ?? true
        }
        guard !showing.isEmpty else { return elements }
        var inUse = CollabBoard.Pictures.inUse(boardImages)
        var used = inUse.reduce(0) { $0 + (pictures[$1].map(CollabBoard.Pictures.size) ?? 0) }
        var refused: Set<String> = [], why: String?
        for e in showing {
            let file = CollabBoard.Pictures.fileID(of: e)!, id = CollabBoard.id(of: e)!
            if inUse.contains(file) { continue }
            guard let picture = pictures[file] ?? offered[file] else {
                if boardEntries[id] != nil { continue }
                refused.insert(id)
                why = why ?? CollabBoard.Pictures.notThere
                continue
            }
            let size = CollabBoard.Pictures.size(picture)
            guard used + size <= CollabBoard.Pictures.maxInUse, CollabBoard.Pictures.sealedSize(picture) <= CollabBoard.Pictures.maxSealed else {
                refused.insert(id)
                why = CollabBoard.Pictures.tooBig
                continue
            }
            used += size
            inUse.insert(file)
            if pictures[file] == nil { pictures[file] = picture }
            if !stored.contains(file), !picturesToSend.contains(file) { picturesToSend.append(file) }
        }
        if !refused.isEmpty {
            CollabScript.trace("\(refused.count) picture\(refused.count == 1 ? "" : "s") kept off the shared board: \(why ?? "")")
            onPicturesRefused?(refused.sorted(), why ?? CollabBoard.Pictures.notThere)
        }
        return elements.filter { e in CollabBoard.id(of: e).map { !refused.contains($0) } ?? true }
    }

    /// The new pictures, sealed and sent, oldest first. One the server has no room for comes off
    /// the board again, as a change of yours, and the board says why.
    private func sendPictures() async -> SendOutcome {
        while let id = picturesToSend.first {
            guard let picture = pictures[id], let ct = try? CollabBoard.Pictures.seal(picture, nk: nk, note: noteID, epoch: epoch) else {
                picturesToSend.removeFirst()
                continue
            }
            do {
                try await transport.putFile(note: noteID, id: id, epoch: epoch, ct: ct)
                guard !isClosed else { return .stop }
                stored.insert(id)
                picturesToSend.removeAll { $0 == id }
                progressed()
            } catch let failure as Collab.Failure {
                switch failure {
                case .staleEpoch:
                    onKeyChanged?()
                    return .stop
                case .readOnly:
                    setRole("viewer")
                    record.pending = []
                    picturesToSend = []
                    return .stop
                case .notMember:
                    onRemoved?()
                    return .stop
                case .picturesFull:
                    picturesToSend.removeAll { $0 == id }
                    withdraw(picture: id)
                default:
                    log.error("sending a picture failed: \(String(describing: failure), privacy: .public)")
                    return .later
                }
            } catch {
                return .later
            }
        }
        return .done
    }

    /// A picture the server wouldn't take: the elements showing it go off the board for everyone
    /// (deleted, newer than any copy), and the board says why.
    private func withdraw(picture id: String) {
        let at = Int(now().timeIntervalSince1970 * 1000)
        let gone = boardEntries.values.compactMap { entry -> [String: Any]? in
            guard CollabBoard.Pictures.fileID(of: entry.element) == id, (entry.element["isDeleted"] as? Bool) != true else { return nil }
            var e = entry.element
            e["isDeleted"] = true
            e["version"] = entry.stamp.version + 1
            e["versionNonce"] = Int.random(in: 1..<Int(Int32.max))
            e["updated"] = at
            return e
        }
        pictures[id] = nil
        if !gone.isEmpty { boardLocal(gone) }
        onRemoteBoard?(boardScene())
        onPicturesRefused?([], CollabBoard.Pictures.tooBig)
    }

    /// The pictures the board shows that this device doesn't have, from the server. One that isn't
    /// there yet (still on its way up, or sealed under a key this device doesn't hold until it's
    /// sealed again) is asked for again a little later, then less often.
    func fetchPictures(again: Bool = false) {
        guard isBoard, !isClosed else { return }
        var wanted = CollabBoard.Pictures.inUse(boardImages).subtracting(pictures.keys).subtracting(fetching)
        if !again { wanted.subtract(waitingFor) }
        guard !wanted.isEmpty else { return }
        Task { [weak self] in
            guard let self else { return }
            await loadPictures(wanted)
            guard !isClosed else { return }
            if waitingFor.isEmpty { pictureDelay = .seconds(1) } else { retryPicturesLater() }
        }
    }

    /// Fetches and opens `ids`; true when some weren't there.
    @discardableResult
    private func loadPictures(_ ids: Set<String>) async -> Bool {
        fetching.formUnion(ids)
        defer { fetching.subtract(ids) }
        var got = 0, missing = false
        for id in ids.sorted() {
            guard !isClosed else { return false }
            do {
                guard let row = try await transport.file(note: noteID, id: id) else { missing = true; waitingFor.insert(id); continue }
                pictures[id] = try CollabBoard.Pictures.open(row, keys: keys, note: noteID)
                stored.insert(id)
                waitingFor.remove(id)
                got += 1
            } catch {
                missing = true
                waitingFor.insert(id)
            }
        }
        CollabScript.trace("\(got) of \(ids.count) picture\(ids.count == 1 ? "" : "s") fetched for the board")
        if got > 0, !isClosed {
            onRemoteBoard?(boardScene())
            settleBoard()
        }
        return missing
    }

    private func retryPicturesLater() {
        guard pictureRetry == nil else { return }
        let delay = pictureDelay
        pictureDelay = min(pictureDelay * 2, Self.pictureRetryLongest)
        pictureRetry = Task { [weak self] in
            try? await Task.sleep(for: delay)
            guard let self, !Task.isCancelled else { return }
            pictureRetry = nil
            fetchPictures(again: true)
        }
    }

    /// Every picture the board shows, fetched now if it isn't here (before the board stops being
    /// shared: its pictures stay with the owner's board).
    func picturesReady() async {
        let wanted = CollabBoard.Pictures.inUse(boardImages).subtracting(pictures.keys)
        if !wanted.isEmpty { await loadPictures(wanted) }
    }

    /// What the server has of the board's pictures, against this device's: a picture in use that's
    /// here and not there goes up (put on the board just before the app quit, say); one stored under
    /// an older key is sealed again under the current one, from the copy here or the stored one,
    /// so whoever joins after a removal can open it and the removed person's key opens none.
    /// Editors only. Once at a time; asked again while running, it's the same run.
    @discardableResult
    func syncPictures() -> Task<Void, Never> {
        if let syncing { return syncing }
        let task = Task { [weak self] in
            guard let self else { return }
            defer { syncing = nil }
            await syncPicturesNow()
        }
        syncing = task
        return task
    }

    private func syncPicturesNow() async {
        guard isBoard, !isClosed, canWrite, !boardImages.isEmpty || !pictures.isEmpty else { return }
        guard let rows = try? await transport.files(of: noteID), !isClosed else { return }
        let there = Dictionary(rows.map { ($0.file_id, $0.epoch) }, uniquingKeysWith: max)
        stored.formUnion(there.keys)
        for id in CollabBoard.Pictures.inUse(boardImages).sorted() where there[id] == nil && pictures[id] != nil && !picturesToSend.contains(id) {
            picturesToSend.append(id)
        }
        let current = epoch
        for row in rows.sorted(by: { $0.file_id < $1.file_id }) where row.epoch < current {
            guard !isClosed, epoch == current else { return }
            do {
                let ct: String
                if let picture = pictures[row.file_id] {
                    ct = try CollabBoard.Pictures.seal(picture, nk: nk, note: noteID, epoch: current)
                } else {
                    guard keys[row.epoch] != nil, let old = try await transport.file(note: noteID, id: row.file_id) else { continue }
                    ct = try CollabBoard.Pictures.reseal(old, keys: keys, to: current, note: noteID)
                }
                try await transport.putFile(note: noteID, id: row.file_id, epoch: current, ct: ct)
            } catch {
                log.error("sealing a picture again failed: \(String(describing: error), privacy: .public)")
                if (error as? Collab.Failure) == .staleEpoch || (error as? Collab.Failure) == .readOnly { return }
            }
        }
        CollabScript.trace("the board's pictures checked with the server: \(rows.count) stored, \(rows.filter { $0.epoch < current }.count) sealed again")
        flush()
    }

    /// The new pictures sent now, before anything else (the board was just shared with them: the
    /// first snapshot that shows them goes after).
    func sendPicturesNow() async {
        guard !isClosed, !picturesToSend.isEmpty, !sending else { return }
        sending = true
        let outcome = await sendPictures()
        sending = false
        if outcome == .later { retry() }
    }

    // MARK: Version history

    /// The clock changes are stamped with; tests set it.
    var now: () -> Date = { .now }
    private var restoring = false

    /// You may change this note, so may restore an earlier version of it.
    var canWrite: Bool { record.canEdit && !isViewOnly }

    func historyRuns() -> [CollabHistory.Run] {
        CollabHistory.runs(in: doc, me: me, start: historyStart, now: now()) { [self] in firstName(of: $0) ?? "Someone" }
    }

    /// When a change without a time (made before changes had them) is taken to be from.
    var historyStart: Date = .distantPast

    func text(at heads: Set<CollabText.ChangeHash>) -> String? {
        try? doc.textAt(obj: body, heads: heads)
    }

    /// An earlier version's text, written as an edit of yours marked as a restore.
    func restore(_ old: String) {
        restoring = true
        defer { restoring = false }
        localFromOutside(old)
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
        guard !isClosed, !sending, !record.outbox.isEmpty || !picturesToSend.isEmpty else { setSent(record.outbox.isEmpty && picturesToSend.isEmpty); return }
        guard record.canEdit else {
            // A viewer's edits are refused by the server: they stay on this device only until
            // the document is opened again.
            record.pending = []
            picturesToSend = []
            setSent(true)
            return
        }
        sending = true
        Task { [weak self] in
            guard let self else { return }
            let outcome = await sendPending()
            sending = false
            guard !isClosed else { return }
            setSent(record.pending.isEmpty && picturesToSend.isEmpty)
            saveSoon()
            switch outcome {
            case .done:
                retryDelay = .seconds(2)
                if !record.pending.isEmpty || !picturesToSend.isEmpty { flush() } else { scheduleSnapshot() }
            case .later:
                retry()
            case .stop:
                break
            }
        }
    }

    /// Changes (and pictures) made here that the server doesn't have yet.
    var unsent: Int { isClosed ? 0 : record.pending.count + picturesToSend.count }

    private enum SendOutcome { case done, later, stop }

    private func sendPending() async -> SendOutcome {
        // A board's new pictures first: a change that shows one never reaches anyone before its bytes.
        let pictures = await sendPictures()
        guard pictures == .done else { return pictures }
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
                guard !isClosed else { return .stop }
                applied.insert(row.id)
                record.sinceSnapshot += 1
                // Typing may have added more meanwhile; this one is the first still.
                if record.pending.first == change { record.pending.removeFirst() }
                progressed()
            } catch let failure as Collab.Failure {
                switch failure {
                case .staleEpoch:
                    // Kept, and sent again sealed with the new key once the library has it.
                    onKeyChanged?()
                    return .stop
                case .readOnly:
                    setRole("viewer")
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
        guard !isClosed, record.tailChanges > 0 else { return }
        record.saved = doc.save()
        record.tail = Data()
        record.tailChanges = 0
    }

    /// Stored a moment after the last change, as the editor saves a note: once per pause in
    /// typing, not once per keystroke (the stored document can be large). Closing saves at once.
    private func saveSoon() {
        saveTask?.cancel()
        saveTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(DebouncedSave.delay))
            guard let self, !Task.isCancelled, !isClosed else { return }
            record.modelContext?.saveSoon()
        }
    }

    /// A snapshot once enough changes piled up on the server (or one is needed to carry a change
    /// too big to send), after a quiet moment.
    private func scheduleSnapshot() {
        guard !isClosed, record.canEdit, needsSnapshot || record.sinceSnapshot >= Self.snapshotEvery, snapshotTask == nil else { return }
        snapshotTask = Task { [weak self] in
            guard let self else { return }
            defer { snapshotTask = nil }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(Self.snapshotQuiet))
                if Date.now.timeIntervalSince(lastArrival) >= Self.snapshotQuiet { break }
            }
            // Still due: one written meanwhile (when sharing, say) made this one unnecessary.
            guard !Task.isCancelled, !isClosed, needsSnapshot || record.sinceSnapshot >= Self.snapshotEvery else { return }
            await writeSnapshot()
        }
    }

    /// Seals the whole document and sends it with the newest change it covers; the server then
    /// drops the changes up to there. Only with everything up to that point in it: it pulls first,
    /// and doesn't write one while a change from the server didn't open here.
    func writeSnapshot() async {
        guard !isClosed, record.canEdit else { return }
        await catchUp().value
        guard !isClosed, !missing, record.pending.isEmpty else { retrySnapshotLater(); return }
        let upto = record.cursor
        guard let ct = try? sealedSnapshot(upto: upto), ct.utf8.count <= Self.maxSnapshot else {
            log.error("a snapshot is over the server's limit and can't go up")
            return
        }
        do {
            try await transport.send(snapshot: ct, note: noteID, upto: upto, epoch: epoch)
            guard !isClosed else { return }
            record.snapshotUpto = max(record.snapshotUpto, upto)
            record.sinceSnapshot = 0
            needsSnapshot = false
            compact()
            saveSoon()
        } catch {
            log.error("writing a snapshot failed: \(String(describing: error), privacy: .public)")
            retrySnapshotLater()
        }
    }

    /// The note has a new key: a snapshot under it is needed now, because devices that start out
    /// (and people who join) have only the new key. Written at once, and tried again until it's in.
    func requireSnapshot() async {
        needsSnapshot = true
        await writeSnapshot()
    }

    /// A needed snapshot that didn't go up goes again a little later, until one does.
    private func retrySnapshotLater() {
        guard needsSnapshot, !isClosed, snapshotRetry == nil else { return }
        snapshotRetry = Task { [weak self] in
            try? await Task.sleep(for: Self.snapshotRetryAfter)
            guard let self, !Task.isCancelled else { return }
            snapshotRetry = nil
            guard needsSnapshot, !isClosed else { return }
            await writeSnapshot()
        }
    }

    /// A snapshot is still owed (it didn't go up yet).
    var owesSnapshot: Bool { needsSnapshot }

    // MARK: Presence

    private struct Presence: Codable {
        var name: String
        var caret: Anchor?
        var end: Anchor?
        var typing: Bool?
        /// On a whiteboard: the pointer (x, y in the board's coordinates) and the selected ids.
        var pointer: [Double]?
        var sel: [String]?
        /// On a whiteboard (BoardFollow): the frame being presented, what of the board is in view
        /// (x, y, width, height), the laser's points since the last beat, and whose view is followed.
        var present: BoardPresenting?
        var view: [Double]?
        var laser: [[Double]]?
        var follow: String?
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
        var p = Presence(name: myName, caret: sel.flatMap { anchor(at: $0.location) },
                         end: sel.flatMap { $0.length > 0 ? anchor(at: NSMaxRange($0)) : nil },
                         typing: Date.now.timeIntervalSince(typingAt) < 1.2)
        if isBoard {
            p.pointer = myPointer.map { [Double($0.x), Double($0.y)] }
            p.sel = myBoardSelection.isEmpty ? nil : myBoardSelection
            p.present = myPresenting
            p.view = myView.map { [Double($0.minX), Double($0.minY), Double($0.width), Double($0.height)] }
            // The trail's points go once: the beat after carries the next ones.
            p.laser = myLaserOn || !myLaser.isEmpty ? myLaser.map { [Double($0.x), Double($0.y)] } : nil
            myLaser = []
            p.follow = myFollow?.uuidString
        }
        guard let data = try? JSONEncoder().encode(p),
              let ct = try? CollabCrypto.seal(.presence, data, nk: nk, note: noteID, epoch: epoch, extra: me.uuidString) else { return }
        channel.send(presence: ct)
    }

    /// Tells the others on the channel that who's in the note changed.
    func announceMembersChanged() { channel?.sendMembersChanged() }

    // MARK: Showing people

    /// Six people colours, all well away from the amber accent, which is you, your selection and
    /// AI edits (whiteboard council, round 10: Sara's clay looked like your own selection). Each is
    /// one hue in two shades: deeper on white, lighter on black, so a person reads as the same
    /// colour in light and dark (`palette`). All take white initials at 4.5:1 or better. In a note
    /// or board each person's colour comes from its members (`slots(for:)`); this is the one their
    /// account id picks, for anyone not in a member list.
    static func color(for user: UUID) -> Color { color(at: Int(paletteIndex(for: user))) }

    nonisolated static func paletteIndex(for user: UUID) -> UInt32 {
        let h = user.uuidString.unicodeScalars.reduce(UInt32(7)) { ($0 &* 31) &+ $1.value }
        return h % UInt32(palette.count)
    }

    /// Everyone's colour in one note or board, so no two people in it share one (Emil and Sara
    /// were both olive). The owner first, then the others in the order they joined (the server's
    /// member list, the same on every device): each takes the colour their account id picks unless
    /// someone before them has it, and then the next one free. So a person keeps the same colour
    /// on every device, and in most notes the one they have everywhere. Past six people, the
    /// colour their id picks.
    static func slots(for members: [UUID]) -> [UUID: Int] {
        var slots: [UUID: Int] = [:], taken = Set<Int>()
        for id in members where slots[id] == nil && taken.count < palette.count {
            let own = Int(paletteIndex(for: id))
            let slot = (0..<palette.count).lazy.map { (own + $0) % palette.count }.first { !taken.contains($0) } ?? own
            slots[id] = slot
            taken.insert(slot)
        }
        return slots
    }

    /// The members in the order their colours are given: the owner, then the others as they joined.
    private var colorOrder: [UUID] { members.filter { $0.role == "owner" }.map(\.id) + members.filter { $0.role != "owner" }.map(\.id) }

    /// Someone's place in the palette in this note.
    func paletteSlot(of user: UUID) -> Int { Self.slots(for: colorOrder)[user] ?? Int(Self.paletteIndex(for: user)) }

    /// Someone's colour in this note: their avatar, caret and pointer, and their row in Share.
    func color(of user: UUID) -> Color { Self.color(at: paletteSlot(of: user)) }

    /// Green, teal, blue, indigo, violet and pink: each hue at least 60° from the accent's (amber,
    /// 28° and 38°) and 25° from the next, in a light-mode shade (6:1 on white) and a dark-mode
    /// one of the same hue (4.5:1 on black). Comment pins take the same shades (BoardComments).
    nonisolated static let palette: [(light: UInt32, dark: UInt32)] = [
        (0x2D6E36, 0x368340), (0x186B70, 0x1C8086), (0x2D639A, 0x3677B9),
        (0x5252C5, 0x6868CD), (0x8841AC, 0x9C56BF), (0xA43777, 0xC1448D),
    ]

    /// Made once, so a person's colour is the same value wherever it's asked for.
    private static let colors: [Color] = palette.map { Color(Palette.pair($0.light, $0.dark)) }

    static func color(at i: Int) -> Color { colors[i % colors.count] }

    /// "#RRGGBB", as the board's page takes a colour.
    static func hex(_ rgb: UInt32) -> String { String(format: "#%06X", rgb) }

    /// Other people's carets and selections for the editor to draw. Someone not heard from for a
    /// while is drawn grey, without the name flag: where their caret was, not where it is.
    var remoteCarets: [RemoteCaret] { remoteCarets(at: .now) }

    func remoteCarets(at now: Date) -> [RemoteCaret] {
        peers.values.compactMap { p in
            guard let s = p.selection else { return nil }
            let stale = p.isStale(at: now)
            return RemoteCaret(id: p.id, name: p.name.split(separator: " ").first.map(String.init) ?? p.name,
                               color: stale ? Self.staleColor : color(of: p.id), range: s,
                               showsName: !stale && now.timeIntervalSince(p.movedAt) < RemoteCaret.flagFor)
        }.sorted { $0.id.uuidString < $1.id.uuidString }
    }
}

/// Someone else on an open whiteboard: their pointer (in the board's coordinates) and selection,
/// in their colour (grey while they aren't heard from), with their first name on a small flag.
struct BoardPeer: Equatable, Identifiable, Sendable {
    let id: UUID
    let name: String
    /// "#RRGGBB", on a light board.
    let color: String
    /// The same hue on a dark board.
    var dark: String? = nil
    let pointer: CGPoint?
    let selection: [String]
    var showsName = true

    var payload: [String: Any] {
        var p: [String: Any] = ["id": id.uuidString, "name": name, "color": color, "dark": dark ?? color, "sel": selection, "flag": showsName]
        if let pointer { p["x"] = Double(pointer.x); p["y"] = Double(pointer.y) }
        return p
    }
}

/// Someone else's caret (or selection) in the open note.
struct RemoteCaret: Equatable, Identifiable {
    let id: UUID
    let name: String
    let color: Color
    let range: NSRange
    /// The name flag shows while they type or just after their caret moves, then fades, so it
    /// doesn't sit over the line above for long.
    var showsName = true
    /// How long a flag stays after they last typed or moved.
    static let flagFor: TimeInterval = 3
    /// The flag: 16 pt tall, 11 pt semibold, corners of 4 pt; in 150 ms, out 200 ms, never sliding.
    static let flagHeight: CGFloat = 16
    static let flagFontSize: CGFloat = 11
    static let flagRadius: CGFloat = 4
    static let flagIn: TimeInterval = 0.15
    static let flagOut: TimeInterval = 0.2
}
