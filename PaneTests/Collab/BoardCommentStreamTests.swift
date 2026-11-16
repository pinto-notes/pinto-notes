import Automerge
import CryptoKit
import Foundation
import SwiftData
import SwiftUI
import Testing
#if os(macOS)
import AppKit
#endif
@testable import Pane

private final class CommentVectorsToken {}

/// Can comment on a shared whiteboard (docs/Technical/collaboration-design.md section 8): comments
/// in their own sealed stream (note_comments), folded alike by every reader (the vectors the
/// browser and the MCP server check too); someone who can comment comments and replies live but
/// draws nothing; the comments a board had in its document move into the stream once, and are
/// carried over a new key; yours wait while offline. People through CollabStore and the in-memory
/// server (BoardPeople, as BoardCommentsTests). Offscreen; no window, no network.
@MainActor
@Suite struct BoardCommentStreamTests {
    let people = BoardPeople()
    var server: MemoryCollabServer { people.server }

    private func page(_ s: CollabSession, note: UUID) -> CanvasController {
        let canvas = CanvasController()
        canvas.noteID = note
        canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        BoardCollab.wire(s, canvas)
        return canvas
    }

    private static func line(_ c: BoardComment) -> String { "\(c.id)|\(c.by)|\(c.text)|\(c.version)|\(c.resolved)|\(c.deleted)|\(c.thread ?? "")" }

    // MARK: The fold, as every reader does it

    @Test func theStreamFoldsAsTheVectorsSay() throws {
        let url = try #require(Bundle(for: CommentVectorsToken.self).url(forResource: "comment-vectors", withExtension: "json"))
        let v = try #require(try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
        func entries(_ list: [[String: Any]]) -> [BoardComments.Entry] {
            list.map { BoardComments.Entry(author: $0["author"] as? String ?? "", role: $0["role"] as? String ?? "", moved: ($0["moved"] as? Bool) == true, comments: $0["comments"] as? [Any] ?? []) }
        }
        let folds = try #require(v["fold"] as? [[String: Any]])
        #expect(folds.count > 5)
        for f in folds {
            let legacy = ((f["legacy"] as? [[String: Any]]) ?? []).compactMap(BoardComment.init)
            let got = BoardComments.fold(legacy: legacy, entries: entries((f["entries"] as? [[String: Any]]) ?? [])).map(Self.line)
            let want = ((f["expect"] as? [[String: Any]]) ?? []).map {
                "\($0["id"]!)|\($0["by"]!)|\($0["text"]!)|\($0["version"]!)|\(($0["resolved"] as? Bool)!)|\(($0["deleted"] as? Bool)!)|\($0["thread"] as? String ?? "")"
            }
            #expect(got == want, "\(f["name"] ?? "")")
        }
        for r in try #require(v["restate"] as? [[String: Any]]) {
            let all = (r["entries"] as? [[String: Any]]) ?? []
            let current = r["current"] as? Int ?? 1
            let legacy = ((r["legacy"] as? [[String: Any]]) ?? []).compactMap(BoardComment.init)
            let full = BoardComments.fold(legacy: legacy, entries: entries(all))
            let bare = BoardComments.fold(legacy: [], entries: entries(all.filter { ($0["epoch"] as? Int) == current }))
            #expect(BoardComments.toRestate(full: full, bare: bare).map(\.id) == (r["expect"] as? [String] ?? []), "\(r["name"] ?? "")")
        }
    }

    @Test func aWriteNeverTakesAVersionPastTheTop() {
        let c = BoardComment(id: "c-a", by: "me", name: "Emil", text: "Ship it", created: "2026-11-18T09:00:00Z", version: BoardComments.maxVersion)
        #expect(BoardComments.next(c) == BoardComments.maxVersion)
        #expect(BoardComments.next(BoardComment(id: "c-a", by: "me", name: "Emil", text: "Ship it", created: "2026-11-18T09:00:00Z", version: 4)) == 5)
        // Many comments go as several entries, each under the server's 64 KB once sealed.
        let many = (0..<30).map { BoardComment(id: "c-\($0)", by: "me", name: "Emil", text: String(repeating: "x", count: 4000), created: "2026-11-18T09:00:00Z") }
        let parts = BoardComments.chunks(many, moved: true)
        #expect(parts.count > 1 && parts.allSatisfy { $0.count < 46_000 })
        let back = BoardComments.fold(legacy: [], entries: parts.map { BoardComments.entry($0, author: "me", role: "owner") })
        #expect(Set(back.map(\.id)) == Set(many.map(\.id)))
    }

    // MARK: Show change on an AI's comment (round 14)

    /// Claude's reply keeps what its write changed: Show change outlines all of it, the arrow too,
    /// after the board is opened again (no change seen since); once none of it is on the board,
    /// the reply says so instead.
    @Test func showChangeOutlinesWhatTheReplyNamesAndSaysWhenItsGone() {
        let canvas = CanvasController()
        let start = BoardComment(id: "c-1", on: "idea", by: "me", name: "Emil", text: "Add the inbox?", created: "2026-11-18T09:00:00Z")
        let reply = BoardComment(id: "c-2", thread: "c-1", by: "me", name: "Emil", ai: "Claude", text: "Added the arrow from Inbox to Idea",
                                 created: "2026-11-18T09:01:00Z", changes: ["inbox", "inbox-idea"])
        let person = BoardComment(id: "c-3", thread: "c-1", by: "me", name: "Emil", text: "Thanks", created: "2026-11-18T09:02:00Z")
        canvas.show(comments: [start, reply, person])
        // The page is asked to name them, so it says which are on the board.
        #expect(Set(canvas.commentedShapes).isSuperset(of: ["inbox", "inbox-idea"]))
        guard case .show(let mark)? = canvas.changeLink(for: reply) else { Issue.record("Show change, before the page said"); return }
        #expect(mark.ids == ["inbox", "inbox-idea"] && mark.by == "Claude")
        #expect(canvas.changeLink(for: person) == nil, "a person's reply has none")
        canvas.receive(["commentShapes": ["idea": "Idea", "inbox": "Inbox", "inbox-idea": "Arrow"]])
        canvas.show(mark)
        #expect(canvas.sent.last == .outline(["inbox", "inbox-idea"], all: true), "every one, arrows included")
        // The arrow went: the box alone.
        canvas.receive(["commentShapes": ["idea": "Idea", "inbox": "Inbox"]])
        #expect(canvas.changeLink(for: reply) == .show(CanvasController.AIChangeMark(by: "Claude", at: reply.date!, ids: ["inbox"])))
        // Both went.
        canvas.receive(["commentShapes": ["idea": "Idea"]])
        #expect(canvas.changeLink(for: reply) == .gone)
        #expect(CanvasController.changeGone == "That change is no longer on the board")
    }

    // MARK: The Share sheet

    @Test func aWhiteboardsLinkOffersCanCommentAndANoteDoesnt() {
        #expect(ShareState.Access.choices(board: true).map(\.rawValue) == ["Can edit", "Can comment", "Can view", "Off"])
        #expect(ShareState.Access.choices(board: false).map(\.rawValue) == ["Can edit", "Can view", "Off"])
        #expect([ShareState.Access.edit, .comment, .view].map(\.role) == ["editor", "commenter", "viewer"])
        #expect(ShareCopy.link(.comment).lowercased().contains("comment"))
    }

    // MARK: Someone who can comment

    /// Cleo has a Comment link: her board is view only, with comments placed in view mode. Her
    /// comment reaches Emil live, as an entry of the stream stamped "commenter", never as a change
    /// of the drawing; what she draws goes nowhere. She can resolve Emil's thread, not change his words.
    @Test func aCommenterCommentsLiveButDrawsNothing() async throws {
        let (emil, others, note) = try await people.share(BoardCommentsTests.scene, access: .comment, people: ["Cleo"])
        let e = try people.session(emil, note), c = try people.session(others[0], note)
        #expect(c.isCommenter && c.canComment && c.isViewOnly && !c.canWrite)
        let mine = page(e, note: note.id)
        let theirs = page(c, note: try #require(others[0].context.pointer(forShared: note.id)).id)
        #expect(theirs.commentsOnly && theirs.canComment && theirs.viewOnly)
        guard case .comments(_, _, _, _, let can, _, let inView)? = theirs.sent.last(where: { if case .comments = $0 { true } else { false } }) else {
            Issue.record("the page wasn't told"); return
        }
        #expect(can && inView)

        let drawn = server.updates[note.id]?.count ?? 0
        c.boardLocal([SharedBoardTests.shape("z", x: 400, index: "a5")])
        theirs.receive(["comment": ["new": ["on": "a", "x": 1, "y": 0]]])
        let first = try #require(theirs.post("Can we move this?"))
        await server.eventually { e.boardComments.count == 1 }
        #expect(mine.threads.map(\.first.text) == ["Can we move this?"])
        #expect(mine.byline(first) == "Cleo")
        #expect((server.updates[note.id]?.count ?? 0) == drawn, "nothing of the drawing, from her")
        let rows = server.comments[note.id] ?? []
        #expect(rows.last?.role == "commenter" && rows.last?.author_id == others[0].id)
        #expect(rows.allSatisfy { $0.ct.hasPrefix("amb3c.1.") && !$0.ct.contains("move") })

        // Emil replies: Cleo has it live. She resolves his thread (it counts); she writes over his
        // reply's words (it doesn't).
        let reply = try #require(mine.reply(to: first.id, "Yes, next to Publish"))
        await server.eventually { c.boardComments.count == 2 }
        theirs.resolve(first.id)
        var forged = reply
        forged.text = "No"
        forged.version = 9
        c.commentLocal([forged])
        await server.eventually { e.boardComments.first?.resolved == true }
        await server.settle()
        #expect(e.boardComments.first { $0.id == reply.id }?.text == "Yes, next to Publish")
        #expect(c.boardComments.first { $0.id == reply.id }?.text == "Yes, next to Publish")
        #expect(e.boardComments == c.boardComments)
    }

    /// Made Can view while a comment of hers waits: the server refuses it, her board stops offering
    /// Comment, and nothing goes on trying.
    @Test func aCommenterMadeAViewerStops() async throws {
        let (emil, others, note) = try await people.share(BoardCommentsTests.scene, access: .comment, people: ["Cleo"])
        let c = try people.session(others[0], note)
        _ = emil
        try server.invite(emil.id, note: note.id, user: others[0].id, role: "viewer", keyWrap: "amb3k.AA==", epoch: 1)
        c.commentLocal([BoardComment(id: "c-late", by: others[0].id.uuidString, name: "Cleo", text: "Late", created: "2026-11-18T10:00:00Z")])
        await server.eventually { !c.canComment }
        #expect(!c.canComment && c.unsentComments == 0)
        #expect((server.comments[note.id] ?? []).isEmpty)
    }

    /// Offline, a comment waits (saved, and shown here); it goes when the server answers. One the
    /// board has no room for is dropped and said, never retried for ever.
    @Test func aCommentWaitsOfflineAndOneWithNoRoomIsSaid() async throws {
        let (emil, others, note) = try await people.share(BoardCommentsTests.scene, access: .comment, people: ["Cleo"])
        let e = try people.session(emil, note), c = try people.session(others[0], note)
        var said: [String] = []
        c.onCommentsRefused = { said.append($0) }
        server.offline = true
        c.commentLocal([BoardComment(id: "c-1", on: "a", by: others[0].id.uuidString, name: "Cleo", text: "Offline for a moment", created: "2026-11-18T10:00:00Z")])
        await server.settle()
        #expect(c.unsentComments == 1 && c.boardComments.map(\.text) == ["Offline for a moment"])
        server.offline = false
        await c.catchUp().value
        await server.eventually { c.unsentComments == 0 && e.boardComments.count == 1 }
        #expect(e.boardComments.map(\.text) == ["Offline for a moment"])

        server.commentsRoom = 10
        c.commentLocal([BoardComment(id: "c-2", on: "a", by: others[0].id.uuidString, name: "Cleo", text: "No room", created: "2026-11-18T10:01:00Z")])
        await server.eventually { !said.isEmpty }
        #expect(said == ["This whiteboard has no room for more comments."])
        #expect(c.unsentComments == 0 && c.boardComments.map(\.text) == ["Offline for a moment"])
    }

    // MARK: Carried over a new key

    /// Emil removes Ola: the board moves to a new key. His device restates the comments under it,
    /// so a device holding only the new key (a person who joins later, a new Mac) has Cleo's.
    @Test func theCommentsAreRestatedUnderANewKey() async throws {
        let (emil, others, note) = try await people.share(BoardCommentsTests.scene, access: .comment, people: ["Cleo", "Ola"])
        let e = try people.session(emil, note), c = try people.session(others[0], note)
        c.commentLocal([BoardComment(id: "c-1", on: "a", by: others[0].id.uuidString, name: "Cleo", text: "Before the new key", created: "2026-11-18T10:00:00Z")])
        await server.eventually { e.boardComments.count == 1 }
        try await emil.store.remove(others[1].id, from: note)
        await server.eventually { e.epoch == 2 && (server.comments[note.id] ?? []).contains { $0.epoch == 2 } }
        let restated = (server.comments[note.id] ?? []).filter { $0.epoch == 2 }
        #expect(restated.allSatisfy { $0.role == "owner" || $0.role == "editor" }, "only an owner's or editor's device restates")

        let row = try #require(try await server.transport(for: emil.id).memberships().first { $0.note_id == note.id })
        let fresh = try await CollabSession.load(record: SharedDocument(id: note.id, epoch: 2, role: "editor", saved: Data()), nk: try await emil.store.openKey(row).nk,
                                                 transport: server.transport(for: emil.id), me: emil.id, name: "Emil")
        await fresh.catchUp().value
        await server.eventually { fresh.boardComments.count == 1 }
        #expect(fresh.boardComments.map { [$0.by, $0.text] } == [[others[0].id.uuidString, "Before the new key"]])
        fresh.close()
    }
}

/// The comments in a board's document from before Can comment (an older build wrote them there):
/// moved into the stream once, by the owner's device, with nothing lost; and moved again when an
/// older build writes another there. Through the library and the fake server, whose key the test holds.
@MainActor @Suite struct BoardCommentMoveTests {
    let server = FakeCollabServer()
    let owner = UUID(uuidString: "0A000000-0000-4000-8000-0000000000D1")!
    let member = UUID(uuidString: "0A000000-0000-4000-8000-0000000000D2")!
    let nk = SymmetricKey(size: .bits256)
    let dataKeys: [UUID: SymmetricKey]

    init() {
        dataKeys = [owner: SymmetricKey(size: .bits256), member: SymmetricKey(size: .bits256)]
        server.names = [owner: "Emil Wagman", member: "Sara Lind"]
    }

    struct Device { let context: ModelContext; let transport: FakeCollabTransport; let library: SharedLibrary }

    func device(_ user: UUID) throws -> Device {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = ModelContext(c)
        let transport = FakeCollabTransport(server: server, me: user)
        let key = dataKeys[user]!, nk = self.nk
        let library = SharedLibrary(context: context, transport: transport, name: user == owner ? "Emil" : "Sara", dataKey: { key }, openKey: { _ in nk })
        return Device(context: context, transport: transport, library: library)
    }

    func waitUntil(_ seconds: Double = 5, _ done: () -> Bool) async {
        let end = Date.now.addingTimeInterval(seconds)
        while !done(), Date.now < end { try? await Task.sleep(for: .milliseconds(20)) }
    }

    /// The board's document as the server has it, opened.
    func document(_ note: UUID) throws -> Automerge.Document {
        let doc = Automerge.Document(textEncoding: .utf16)
        if let s = server.snapshots.last(where: { $0.note_id == note }) {
            try CollabText.absorb(try CollabCrypto.open(.snapshot, s.ct, nk: nk, note: note, extra: String(s.upto)), into: doc)
        }
        for u in server.updates(of: note) {
            try CollabText.absorb(try CollabCrypto.open(.update, u.ct, nk: nk, note: note, extra: u.author_id.uuidString), into: doc)
        }
        return doc
    }

    /// What a build from before Can comment does with comments: into the document's map, as a change.
    func writeTheOldWay(_ c: [BoardComment], by user: UUID, note: UUID) throws {
        let doc = try document(note)
        let before = doc.heads()
        try BoardComments.put(c, in: doc)
        doc.commitWith(message: CollabHistory.stamp(user), timestamp: .now)
        let change = try doc.encodeChangesSince(heads: before)
        _ = try server.insertUpdate(note: note, author: user, epoch: 1, ct: try CollabCrypto.seal(.update, change, nk: nk, note: note, epoch: 1, extra: user.uuidString))
    }

    /// The stream alone, as a reader holding the key folds it (without the document's map).
    func streamAlone(_ note: UUID) throws -> [BoardComment] {
        let entries = try server.comments.filter { $0.note_id == note }.map {
            BoardComments.entry(try CollabCrypto.open(.comment, $0.ct, nk: nk, note: note, extra: $0.author_id.uuidString), author: $0.author_id.uuidString, role: $0.role)
        }
        return BoardComments.fold(legacy: [], entries: entries)
    }

    @Test func theOldMapMovesIntoTheStreamOnceAndAgainWhenAnOlderBuildWritesThere() async throws {
        let emil = try device(owner)
        let note = CanvasNote.make(in: .all, context: emil.context, scene: BoardCommentsTests.scene, named: "Launch plan")
        try await emil.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let e = try await emil.library.becomeShared(note, nk: nk)
        await waitUntil { e.isSent && e.unsentComments == 0 }
        server.add(member, to: note.id)
        // A board shared by a build from before Can comment: its comments are in the document.
        let old = [BoardComment(id: "c-1", on: "a", by: owner.uuidString, name: "Emil", text: "Ship it", created: "2026-11-14T09:00:00Z"),
                   BoardComment(id: "c-2", thread: "c-1", by: member.uuidString, name: "Sara", text: "Not yet", created: "2026-11-14T09:05:00Z", version: 3)]
        try writeTheOldWay(old, by: owner, note: note.id)
        #expect(try streamAlone(note.id).isEmpty)

        await e.catchUp().value
        await waitUntil { server.comments.contains { $0.author_id == self.owner } && e.unsentComments == 0 }
        #expect(try streamAlone(note.id).map(Self.line) == old.map(Self.line), "every comment, as it was")
        let moved = server.comments.count
        #expect(moved == 1)
        // Read again (opened again): nothing more to move.
        await e.catchUp().value
        await waitUntil { e.unsentComments == 0 }
        #expect(server.comments.count == moved)

        // Sara on an older build writes another in the map: Emil's device moves it.
        try writeTheOldWay([BoardComment(id: "c-3", thread: "c-1", by: member.uuidString, name: "Sara", text: "From the old app", created: "2026-11-15T09:00:00Z")],
                           by: member, note: note.id)
        await e.catchUp().value
        await waitUntil { (try? streamAlone(note.id).count) == 3 }
        #expect(try streamAlone(note.id).map(\.text) == ["Ship it", "Not yet", "From the old app"])
        #expect(e.boardComments.map(\.text) == ["Ship it", "Not yet", "From the old app"])

        // Someone who can only comment sees all of them, and moves nothing.
        server.add(member, to: note.id, role: "commenter")
        let phone = try device(member)
        let mine = try await phone.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "commenter")
        let s = try #require(phone.library.session(for: mine))
        await s.catchUp().value
        await waitUntil { s.boardComments.count == 3 }
        #expect(s.boardComments == e.boardComments)
        #expect(!server.comments.contains { $0.author_id == self.member })
    }

    private static func line(_ c: BoardComment) -> String { "\(c.id)|\(c.by)|\(c.text)|\(c.version)|\(c.resolved)|\(c.thread ?? "")" }
}

#if os(macOS)
/// Pictures of Can comment on the Mac, light and dark, offscreen: the Share popover with Can
/// comment chosen, and a commenter's comment as the owner's Mac shows it (its thread and the
/// Comments list), arrived through the comment stream. Only when AMBER_HIG_SHOTS names a folder.
@MainActor @Suite(.serialized) struct BoardCommentRolePictures {
    let people = BoardPeople()

    @Test func canCommentPictures() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        // A commenter's comment, live on Emil's board.
        let (emil, others, note) = try await people.share(BoardCommentsTests.scene, access: .comment, people: ["Cleo"])
        let e = try people.session(emil, note), c = try people.session(others[0], note)
        let mine = CanvasController()
        mine.noteID = note.id
        mine.seenStore = BoardComments.Seen(defaults: TestDefaults())
        BoardCollab.wire(e, mine)
        defer { BoardCollab.unwire(e, mine) }
        let theirs = CanvasController()
        theirs.seenStore = BoardComments.Seen(defaults: TestDefaults())
        BoardCollab.wire(c, theirs)
        defer { BoardCollab.unwire(c, theirs) }
        mine.receive(["commentShapes": ["a": "Launch", "b": "Plan"]])
        mine.receive(["comment": ["new": ["on": "a", "x": 1, "y": 0]]])
        let ask = try #require(mine.post("Cleo, does the launch step read right?"))
        await people.server.eventually { theirs.threads.count == 1 }
        let reply = try #require(theirs.reply(to: ask.id, "Mostly. Can this box be twice as wide?"))
        await people.server.eventually { mine.comments.contains { $0.id == reply.id } }

        let share = ShareController(note: Note(body: "Launch plan"), backend: SampleShare(ShareState(
            link: URL(string: "https://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw"), access: .comment, people: [
                .init(id: CollabGallery.emil, name: "Emil Wagman", isMe: true, role: "owner"),
                .init(id: CollabGallery.sara, name: "Cleo Lind", role: "commenter", safetyCode: "4821 0937 5512"),
            ])), board: { true })
        let store = ShareLinkStore(state: ShareLinkState(phase: .notShared))
        for dark in [false, true] {
            let mode = dark ? "dark" : "light"
            let popover = ShareNotePopover(title: "Launch plan", text: "Launch plan", store: store, linkAvailable: true, share: share, startingWay: .people,
                                           pictureRequest: { nil }, close: {}).tint(Color(PColor.paneAccent))
            try await AppSnapshotTests.render(popover, name: "r15-share-can-comment-\(mode)", dark: dark)
            let thread = try await BoardCommentsCanvasTests.popover(BoardThreadView(canvas: mine, id: ask.id), dark: dark)
            try #require(thread.representation(using: .png, properties: [:])).write(to: dir.appending(path: "r15-mac-commenters-reply-\(mode).png"))
            let list = try await BoardCommentsCanvasTests.popover(BoardCommentsList(canvas: mine), dark: dark)
            try #require(list.representation(using: .png, properties: [:])).write(to: dir.appending(path: "r15-mac-comments-list-\(mode).png"))
        }
    }
}
#endif
