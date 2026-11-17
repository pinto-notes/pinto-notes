import Automerge
import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// Comments on a whiteboard (Pane/Collab/BoardComments.swift): kept beside the drawing, synced as it
/// is, sealed in a shared board's document. People through CollabStore and the in-memory server
/// (BoardPeople, as SharedBoardTests); the board's page as CanvasController sees it, without a page.
@MainActor
@Suite struct BoardCommentsTests {
    let people = BoardPeople()
    var server: MemoryCollabServer { people.server }

    static let scene = SharedBoardTests.scene([SharedBoardTests.shape("a"), SharedBoardTests.shape("b", x: 200, index: "a1")])

    /// A board's page, joined to someone's session (as the open board is), with its own memory of
    /// what was seen.
    private func page(_ s: CollabSession, note: UUID) -> CanvasController {
        let canvas = CanvasController()
        canvas.noteID = note
        canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        BoardCollab.wire(s, canvas)
        return canvas
    }

    /// The pins the page was last sent.
    private static func pins(_ canvas: CanvasController) -> [BoardComments.Pin] {
        for c in canvas.sent.reversed() { if case .comments(let pins, _, _, _, _, _, _) = c { return pins } }
        return []
    }

    // MARK: Two people

    /// Emil comments on a shape and Sara replies: both boards have the thread, the same, in order,
    /// each line by its writer; the pin is in Emil's colour; the server sees none of the words.
    @Test func aCommentAndItsReplyReachEveryone() async throws {
        let (emil, others, note) = try await people.share(Self.scene, people: ["Sara"])
        let e = try people.session(emil, note), s = try people.session(others[0], note)
        let mine = page(e, note: note.id)
        let theirs = page(s, note: try #require(others[0].context.pointer(forShared: note.id)).id)
        #expect(mine.canComment && theirs.canComment)
        #expect(mine.author == BoardComments.Author(id: emil.id.uuidString, name: "Emil"))

        // The page placed a comment on "a" (the Comment tool, or the bar's Comment): Emil writes it.
        mine.receive(["comment": ["new": ["on": "a", "x": 1, "y": 0]]])
        #expect(mine.draft == BoardComments.Place(on: "a", x: 1, y: 0))
        let first = try #require(mine.post("  Make this one bigger?  "))
        #expect(first.text == "Make this one bigger?" && first.by == emil.id.uuidString && first.name == "Emil" && first.on == "a")
        #expect(mine.openThread == first.id && mine.draft == nil, "its thread stays open, for a reply")

        await server.eventually { s.boardComments.count == 1 }
        #expect(theirs.threads.map(\.first.text) == ["Make this one bigger?"])
        #expect(theirs.byline(first) == "Emil")
        #expect(theirs.unseen, "a quiet dot: someone else wrote it")
        #expect(Self.pins(theirs).map { [$0.id, $0.on, $0.letter, $0.color] } == [[first.id, "a", "E", s.boardColor(of: emil.id.uuidString)]])
        #expect(s.boardColor(of: emil.id.uuidString) == e.boardColor(of: emil.id.uuidString), "his colour on both boards")

        // Sara opens it and replies.
        theirs.open(thread: first.id)
        #expect(!theirs.unseen)
        #expect(theirs.sent.last == .focusComment(first.id))
        let reply = try #require(theirs.reply(to: first.id, "Done: twice as wide now."))
        await server.eventually { e.boardComments.count == 2 }
        #expect(mine.threads.count == 1 && mine.threads[0].replies.map(\.id) == [reply.id])
        #expect(mine.byline(reply) == "Sara" && mine.unseen)
        #expect(e.boardComments == s.boardComments)
        // Sealed like everything else in the board.
        #expect((server.updates[note.id] ?? []).allSatisfy { !$0.ct.contains("bigger") && !$0.ct.contains("twice") })
        BoardCollab.unwire(e, mine)
        #expect(mine.comments.isEmpty && mine.onComments == nil)
    }

    /// Three people comment at once, each before seeing the others: every comment lands, on every
    /// board, in the same order.
    @Test func commentsWrittenAtOnceAllLand() async throws {
        let (emil, others, note) = try await people.share(Self.scene)
        let all = try [emil, others[0], others[1]].map { try people.session($0, note) }
        for (i, s) in all.enumerated() {
            s.commentLocal([BoardComment(id: "c-\(i)", on: "a", by: s.me.uuidString, name: s.myName, text: "Mine \(i)", created: "2026-11-15T09:00:0\(i)Z")])
        }
        await server.settle()
        await server.eventually { all.allSatisfy { $0.boardComments.count == 3 } }
        #expect(all.allSatisfy { $0.boardComments.map(\.id) == ["c-0", "c-1", "c-2"] })
    }

    /// Two devices that made the comments map at once (a board shared before comments, each
    /// device's first comment) leave two maps: both are read, so neither's comments go missing.
    @Test func twoCommentsMapsMadeAtOnceAreBothRead() throws {
        let doc = Document()
        try doc.put(obj: .ROOT, key: "body", value: .String("Launch plan"))
        let other = doc.fork()
        let a = BoardComment(id: "c-a", x: 10, y: 10, by: "u1", name: "Emil", text: "Here", created: "2026-11-15T09:00:00Z")
        let b = BoardComment(id: "c-b", x: 20, y: 20, by: "u2", name: "Sara", text: "There", created: "2026-11-15T09:00:01Z")
        try BoardComments.put([a], in: doc)
        try BoardComments.put([b], in: other)
        try doc.merge(other: other)
        try other.merge(other: doc)
        #expect(BoardComments.maps(in: doc).count == 2)
        #expect(BoardComments.read(doc).map(\.id) == ["c-a", "c-b"])
        #expect(BoardComments.read(other) == BoardComments.read(doc))
        // A later change goes into the map every device reads first, and is read once.
        var done = a
        done.resolved = true
        done.version = 2
        try BoardComments.put([done], in: other)
        try doc.merge(other: other)
        #expect(BoardComments.read(doc).first { $0.id == "c-a" }?.resolved == true)
    }

    /// Resolved on one device and opened again on another at once: both keep the same one. A
    /// resolved thread goes from the board (its pin), and stays in the list.
    @Test func resolvingSyncsAndBothEndTheSame() async throws {
        let (emil, others, note) = try await people.share(Self.scene, people: ["Sara"])
        let e = try people.session(emil, note), s = try people.session(others[0], note)
        let mine = page(e, note: note.id), theirs = page(s, note: UUID())
        mine.receive(["comment": ["new": ["x": 40, "y": 60]]])
        let c = try #require(mine.post("Is this the right order?"))
        await server.eventually { theirs.threads.count == 1 }
        #expect(Self.pins(theirs).map(\.id) == [c.id])
        mine.closeThread()

        theirs.resolve(c.id)
        #expect(theirs.notice == CanvasController.resolvedLine && theirs.noticeUndo != nil)
        await server.eventually { mine.threads.first?.resolved == true }
        #expect(Self.pins(mine).isEmpty && mine.threads.count == 1, "off the board, still in the list")
        // A thread you have open stays on the board while it's open, resolved or not.
        mine.open(thread: c.id)
        #expect(Self.pins(mine).map(\.id) == [c.id])
        mine.closeThread()
        #expect(Self.pins(mine).isEmpty)
        // Undo opens it again, for everyone.
        theirs.noticeUndo?()
        await server.eventually { mine.threads.first?.resolved == false }
        #expect(Self.pins(mine).map(\.id) == [c.id])

        // At once: Emil resolves while Sara, not seeing it, resolves and opens it again.
        mine.resolve(c.id)
        s.commentLocal([BoardComment(id: c.id, x: 40, y: 60, by: c.by, name: c.name, text: c.text, created: c.created, resolved: false, version: 4)])
        await server.settle()
        await server.eventually { e.boardComments == s.boardComments }
        #expect(e.boardComments == s.boardComments)
        #expect(e.boardComments.first?.version == 4)
    }

    /// A viewer reads every comment but writes none: nothing of theirs reaches the document or the
    /// server, and their page offers no Comment.
    @Test func aViewerReadsCommentsButCantComment() async throws {
        let (emil, others, note) = try await people.share(Self.scene, access: .view, people: ["Sara"])
        let e = try people.session(emil, note), s = try people.session(others[0], note)
        let mine = page(e, note: note.id), theirs = page(s, note: UUID())
        #expect(!theirs.canComment && theirs.viewOnly)
        guard case .comments(_, _, _, _, let can, _, _)? = theirs.sent.last(where: { if case .comments = $0 { true } else { false } }) else {
            Issue.record("the page wasn't told"); return
        }
        #expect(!can)
        mine.receive(["comment": ["new": ["on": "b", "x": 1, "y": 0]]])
        let c = try #require(mine.post("Check the numbers"))
        await server.eventually { theirs.threads.count == 1 }

        let before = server.updates[note.id]?.count ?? 0
        theirs.receive(["comment": ["new": ["x": 1, "y": 1]]])
        #expect(theirs.draft == nil)
        #expect(theirs.reply(to: c.id, "Looks fine") == nil)
        theirs.resolve(c.id)
        s.commentLocal([BoardComment(id: "c-eve", thread: c.id, by: s.me.uuidString, name: "Sara", text: "Sneaky", created: "2026-11-15T10:00:00Z")])
        await server.settle()
        #expect((server.updates[note.id]?.count ?? 0) == before)
        #expect(e.boardComments.count == 1 && s.boardComments.count == 1 && !e.boardComments[0].resolved)
    }

    // MARK: Changing and deleting your own (round 12)

    /// Emil changes his comment and deletes another; Sara sees both: the new words marked edited,
    /// and "Comment deleted" where the thread start was, its reply still there. A deleted reply,
    /// and a deleted thread start with no replies, go. None of the words reach the server. Sara
    /// can't change or delete Emil's.
    @Test func yourOwnCommentsCanBeChangedAndDeletedOnEveryBoard() async throws {
        let (emil, others, note) = try await people.share(Self.scene, people: ["Sara"])
        let e = try people.session(emil, note), s = try people.session(others[0], note)
        let mine = page(e, note: note.id)
        let theirs = page(s, note: try #require(others[0].context.pointer(forShared: note.id)).id)
        mine.receive(["comment": ["new": ["on": "a", "x": 1, "y": 0]]])
        let first = try #require(mine.post("Make this bigger"))
        mine.receive(["comment": ["new": ["on": "b", "x": 1, "y": 0]]])
        let second = try #require(mine.post("Wrong box, ignore"))
        mine.receive(["comment": ["new": ["x": 300, "y": 40]]])
        let alone = try #require(mine.post("Typo here"))
        await server.eventually { s.boardComments.count == 3 }
        let answer = try #require(theirs.reply(to: second.id, "Which one then?"))
        let aside = try #require(theirs.reply(to: first.id, "Sure"))
        await server.eventually { e.boardComments.count == 5 }

        // Sara can't change or delete what Emil wrote.
        #expect(theirs.edit(first.id, "Hacked") == nil)
        theirs.delete(first.id)
        #expect(s.boardComments.first { $0.id == first.id }?.text == "Make this bigger")

        // Changed: new words, marked edited, version up; the same on Sara's board.
        let changed = try #require(mine.edit(first.id, "  Make this twice as big  "))
        #expect(changed.text == "Make this twice as big" && changed.edited != nil && changed.version == 2 && changed.id == first.id)
        #expect(mine.edit(first.id, "Make this twice as big") == nil, "the same words change nothing")
        await server.eventually { s.boardComments.first { $0.id == first.id }?.text == "Make this twice as big" }
        #expect(theirs.threads.first { $0.id == first.id }?.first.edited != nil)

        // Deleted (asked first, in its thread): the words go; its reply stays under "Comment deleted".
        mine.deletingComment = second.id
        mine.delete(second.id)
        #expect(mine.deletingComment == nil && mine.notice == CanvasController.deletedLine && mine.noticeUndo != nil)
        await server.eventually { s.boardComments.first { $0.id == second.id }?.deleted == true }
        let kept = try #require(theirs.threads.first { $0.id == second.id })
        #expect(kept.first.deleted && kept.first.text.isEmpty && kept.replies.map(\.id) == [answer.id])
        #expect(!s.boardComments.contains { $0.id == second.id && $0.text.contains("Wrong") })
        #expect(Self.pins(theirs).contains { $0.id == second.id }, "its pin stays while it has replies")
        // A thread start with no replies goes, pin and all; so does a deleted reply.
        mine.delete(alone.id)
        let ownReply = try #require(mine.reply(to: first.id, "Or three times"))
        mine.delete(ownReply.id)
        await server.eventually { theirs.threads.count == 2 && theirs.threads.first { $0.id == first.id }?.replies.map(\.id) == [aside.id] }
        #expect(!Self.pins(theirs).contains { $0.id == alone.id })
        // Sealed like everything else: no words of any version on the server.
        #expect((server.updates[note.id] ?? []).allSatisfy { !$0.ct.contains("twice") && !$0.ct.contains("Wrong") && !$0.ct.contains("Typo") })
        // Undo puts the last one back.
        mine.noticeUndo?()
        await server.eventually { s.boardComments.first { $0.id == ownReply.id }?.deleted == false }
        #expect(s.boardComments.first { $0.id == ownReply.id }?.text == "Or three times")
        // A deleted one can't be changed.
        #expect(mine.edit(alone.id, "Back") == nil)
    }

    /// A deletion and a change are records like any other: kept and read back, the newest version
    /// winning; a deleted one keeps no words.
    @Test func changesAndDeletionsAreKept() throws {
        var c = BoardComment(id: "c-1", on: "a", by: "u1", name: "Emil", text: "Ask @Sara", created: "2026-11-15T09:00:00Z", mentions: ["u2"])
        #expect(BoardComment(json: c.json) == c && c.record["mentions"] as? [String] == ["u2"])
        var edited = c
        edited.text = "Ask @Sara and @Mo"
        edited.edited = "2026-11-15T09:05:00Z"
        edited.version = 2
        #expect(BoardComment(json: edited.json) == edited)
        c.deleted = true
        c.text = ""
        c.mentions = []
        c.version = 3
        #expect(c.record["text"] == nil && c.record["deleted"] as? Bool == true)
        #expect(BoardComment(json: c.json)?.deleted == true)
        #expect(BoardComments.resolve([edited.json, c.json])?.deleted == true, "the newest version wins")
        // Thread starts deleted with no replies, and deleted replies, aren't shown.
        let r = BoardComment(id: "c-r", thread: "c-1", by: "u2", name: "Sara", text: "Ok", created: "2026-11-15T09:10:00Z")
        var gone = r
        gone.deleted = true
        gone.version = 2
        #expect(BoardComments.threads([c, r]).first?.replies == [r])
        #expect(BoardComments.threads([c, gone]).isEmpty)
    }

    // MARK: Mentions (round 12)

    /// Typing @ offers the board's people; a pick puts in "@Sara "; a posted comment keeps who it
    /// mentions; "@Sarah" or an email address isn't Sara.
    @Test func mentionsAreOfferedAndKept() {
        let sara = BoardComments.Person(id: "u2", name: "Sara"), sam = BoardComments.Person(id: "u3", name: "Sam"), mo = BoardComments.Person(id: "u4", name: "Mo")
        let people = [sara, sam, mo]
        #expect(BoardComments.mentionQuery(in: "Ask @Sa")?.query == "Sa")
        #expect(BoardComments.mentionQuery(in: "@")?.query == "")
        #expect(BoardComments.mentionQuery(in: "mail me at a@b") == nil, "not in the middle of a word")
        #expect(BoardComments.mentionQuery(in: "Ask @Sara now") == nil, "done once a space follows")
        #expect(BoardComments.suggestions("sa", from: people) == [sara, sam])
        #expect(BoardComments.suggestions("", from: people) == people)
        #expect(BoardComments.complete("Ask @Sa", with: sara) == "Ask @Sara ")
        #expect(BoardComments.mentioned(in: "Ask @Sara and @mo, not @Sarah or sara@x.com", people: people) == ["u2", "u4"])
        #expect(BoardComments.mentioned(in: "@Sarah", people: people).isEmpty)
        let canvas = CanvasController()
        canvas.author = BoardComments.Author(id: "u1", name: "Emil")
        canvas.mentionable = people
        canvas.receive(["comment": ["new": ["x": 1, "y": 1]]])
        let c = canvas.post("@Sam can you check this?")
        #expect(c?.mentions == ["u3"])
        #expect(canvas.names(of: ["u3", "u1", "nobody"]) == ["Sam", "Emil"])
        let text = BoardCommentUI.text("Hi @Sam and @Samantha", mentions: ["Sam"])
        let marked = text.runs.filter { $0.foregroundColor != nil }.map { String(text[$0.range].characters) }
        #expect(marked == ["@Sam"], "only the mention is set apart: \(marked)")
    }

    /// Sara mentions Emil on the shared board: he gets the dot even after he'd read everything,
    /// and on a board he first opens on this device; it stays until he opens that thread. The
    /// board's people are who can be mentioned, never you.
    @Test func aMentionShowsTheDotUntilItsThreadIsOpened() async throws {
        let (emil, others, note) = try await people.share(Self.scene, people: ["Sara"])
        let e = try people.session(emil, note), s = try people.session(others[0], note)
        let mine = page(e, note: note.id)
        let theirs = page(s, note: try #require(others[0].context.pointer(forShared: note.id)).id)
        await server.eventually { BoardCollab.people(s).contains { $0.name == "Emil" } }
        BoardCollab.tick(s, theirs)
        BoardCollab.tick(e, mine)
        #expect(theirs.mentionable.map(\.name) == ["Emil"], "\(theirs.mentionable)")
        #expect(!mine.mentionable.contains { $0.id == emil.id.uuidString }, "never yourself")
        theirs.receive(["comment": ["new": ["on": "a", "x": 1, "y": 0]]])
        let plain = try #require(theirs.post("Looks good"))
        await server.eventually { e.boardComments.count == 1 }
        mine.showingComments = true
        mine.showingComments = false
        #expect(!mine.unseen, "read everything")

        // A change of her comment mentions him: the dot, though he'd seen that comment.
        let asked = try #require(theirs.edit(plain.id, "Looks good. @Emil can you sign off?"))
        #expect(asked.mentions == [emil.id.uuidString])
        await server.eventually { e.boardComments.first?.mentions.isEmpty == false }
        #expect(mine.unseen && mine.threads.first.map(mine.unreadMention) == true)
        // Opening the list isn't enough: the mention waits for its thread.
        mine.showingComments = true
        mine.showingComments = false
        #expect(mine.unseen)
        // A device that opens the board for the first time: old comments count as seen, the
        // mention doesn't.
        let fresh = CanvasController()
        fresh.noteID = note.id
        fresh.seenStore = BoardComments.Seen(defaults: TestDefaults())
        BoardCollab.wire(e, fresh)
        #expect(fresh.unseen)
        BoardCollab.unwire(e, fresh)
        BoardCollab.wire(e, mine)
        mine.open(thread: plain.id)
        let opened = try #require(mine.threads.first)
        #expect(!mine.unseen && !mine.unreadMention(opened))
    }

    // MARK: The list (round 12)

    /// Each row says where its thread is and when its last reply came; the latest activity first.
    @Test func theListNamesWhereAThreadIsAndSortsByLatestActivity() {
        let canvas = CanvasController()
        canvas.author = BoardComments.Author(id: "u1", name: "Emil")
        let idea = BoardComment(id: "c-idea", on: "idea", by: "u2", name: "Sara", text: "Newsletter replies too?", created: "2026-11-15T09:00:00Z")
        let r1 = BoardComment(id: "c-r1", thread: "c-idea", by: "u1", name: "Emil", text: "Yes", created: "2026-11-15T09:20:00Z")
        let r2 = BoardComment(id: "c-r2", thread: "c-idea", by: "u2", name: "Sara", text: "Thanks", created: "2026-11-15T09:46:00Z")
        let ai = BoardComment(id: "c-ai", on: "fix", by: "u1", name: "Emil", ai: "Claude", text: "No owner yet", created: "2026-11-15T09:36:00Z")
        let spot = BoardComment(id: "c-spot", x: 400, y: 20, by: "u2", name: "Sara", text: "Room here", created: "2026-11-15T09:10:00Z")
        canvas.show(comments: [idea, r1, r2, ai, spot])
        canvas.receive(["commentShapes": ["idea": "Idea"]])
        let threads = canvas.threads
        #expect(BoardCommentsList.ordered(threads).map(\.id) == ["c-idea", "c-ai", "c-spot"], "the latest word first")
        let t = { (id: String) in threads.first { $0.id == id }! }
        #expect(canvas.place(of: t("c-idea")) == "on Idea")
        #expect(canvas.place(of: t("c-spot")) == "on the board")
        #expect(canvas.place(of: t("c-ai")) == CanvasController.onShape, "a shape the page hasn't named")
        #expect(BoardCommentUI.foot(place: "on Idea", replies: 2, last: "2 min ago") == "on Idea \u{00B7} 2 replies \u{00B7} last reply 2 min ago")
        #expect(BoardCommentUI.foot(place: "on the board", replies: 0, last: nil) == "on the board")
        // The page is asked to name the shapes threads are on.
        #expect(canvas.commentedShapes == ["fix", "idea"])
    }

    /// An AI's pin and avatar: neutral graphite (light grey on a dark board) with its own mark,
    /// never the accent or a letter.
    @Test func anAIShowsItsOwnMarkInNeutralColours() throws {
        let canvas = CanvasController()
        canvas.author = BoardComments.Author(id: "u1", name: "Emil")
        let ai = BoardComment(id: "c-ai", on: "fix", by: "u1", name: "Emil", ai: "Claude", text: "No owner yet", created: "2026-11-15T09:36:00Z")
        canvas.show(comments: [ai])
        let pin = try #require(canvas.pins.first)
        #expect(pin.color == BoardComments.aiColor && BoardComments.dark(of: pin.color) == BoardComments.aiDark)
        #expect(pin.payload["dark"] as? String == BoardComments.aiDark)
        let mark = try #require(pin.payload["mark"] as? String, "the AI's mark goes to the page")
        #expect(mark.hasPrefix("data:image/png;base64,") && mark.count > 100)
        #expect(BoardComments.markPicture("Some AI") == nil, "an AI with no mark of its own keeps its letter")
        // Neutral: no colour of its own, and far from the accent.
        for hex in [BoardComments.aiColor, BoardComments.aiDark] {
            let v = try #require(UInt32(hex.dropFirst(), radix: 16))
            let r = Int(v >> 16 & 0xFF), g = Int(v >> 8 & 0xFF), b = Int(v & 0xFF)
            #expect(max(r, g, b) - min(r, g, b) <= 8, "\(hex) is a grey")
        }
    }

    // MARK: The model

    /// Threads oldest first with their replies oldest first; a reply that came before its thread
    /// waits; malformed records are left out.
    @Test func threadsAndRecords() throws {
        let t1 = BoardComment(id: "c-1", on: "a", by: "u1", name: "Emil", text: "One", created: "2026-11-15T09:00:00Z")
        let t2 = BoardComment(id: "c-2", x: 300, y: -20, by: "u2", name: "Sara", text: "Two", created: "2026-11-15T08:00:00Z")
        let r1 = BoardComment(id: "c-r1", thread: "c-1", by: "u2", name: "Sara", ai: "Claude", text: "Reply", created: "2026-11-15T09:05:00Z")
        let r0 = BoardComment(id: "c-r0", thread: "c-1", by: "u1", name: "Emil", text: "First reply", created: "2026-11-15T09:01:00Z")
        let orphan = BoardComment(id: "c-r9", thread: "c-9", by: "u1", name: "Emil", text: "Lost", created: "2026-11-15T09:01:00Z")
        let threads = BoardComments.threads([r1, t1, orphan, t2, r0])
        #expect(threads.map(\.id) == ["c-2", "c-1"])
        #expect(threads[1].replies.map(\.id) == ["c-r0", "c-r1"] && threads[1].latest == "2026-11-15T09:05:00Z")
        // Kept and read back as written.
        for c in [t1, t2, r1] { #expect(BoardComment(json: c.json) == c) }
        #expect(BoardComment(r1.record)?.x == 1, "a reply has no place of its own")
        #expect(r1.record["x"] == nil && t2.record["x"] as? Double == 300)
        #expect(BoardComment(["id": "c", "by": "u", "created": "t", "text": "   "]) == nil)
        #expect(BoardComment(["id": "c", "by": "u", "created": "t", "text": String(repeating: "a", count: 5001)]) == nil)
        #expect(BoardComment(["id": "c", "thread": "t", "by": "u", "created": "t", "text": "hi", "resolved": true])?.resolved == false)
        // Who: your own AI is "Claude"; someone else's, "Sara's Claude".
        #expect(BoardComments.byline(r1, me: "u2") == "Claude" && BoardComments.byline(r1, me: "u1") == "Sara's Claude")
        #expect(BoardComments.initial(r1) == "C" && BoardComments.initial(t2) == "S")
        #expect(BoardComments.firstName("Emil Wagman") == "Emil" && BoardComments.firstName("") == "You" && BoardComments.firstName("Someone") == "You")
        #expect(CanvasController.clean("  \n ") == nil && CanvasController.clean(" Hi ") == "Hi")
        #expect(CanvasController.clean(String(repeating: "x", count: 6000))?.count == BoardComments.maxText)
        #expect(BoardComments.newID().count == 18 && BoardComments.newID() != BoardComments.newID())
    }

    /// Values written for one comment at once: every device keeps the same one.
    @Test func conflictsResolveTheSameEverywhere() {
        let open = BoardComment(id: "c-1", by: "u", name: "E", text: "A", created: "2026-11-15T09:00:00Z")
        var done = open
        done.resolved = true
        done.version = 2
        #expect(BoardComments.resolve([open.json, done.json])?.resolved == true)
        #expect(BoardComments.resolve([done.json, open.json])?.resolved == true)
        var b = open
        b.text = "B"
        let tie = BoardComments.resolve([b.json, open.json])
        #expect(tie == (open.json < b.json ? open : b))
        #expect(BoardComments.resolve(["{", open.json]) == open)
    }

    /// When, as Notes and Messages say it.
    @Test func whenItWasWritten() throws {
        let now = try #require(BoardComments.date("2026-11-15T12:00:00Z"))
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        func at(_ s: String) -> String { BoardComments.when(BoardComment(id: "c", by: "u", name: "E", text: "t", created: s), now: now, calendar: cal) }
        #expect(at("2026-11-15T11:59:30Z") == "Now")
        #expect(at("2026-11-15T11:48:00Z") == "12 min ago")
        #expect(at("2026-11-14T10:00:00Z") == "Yesterday")
        #expect(at("2026-11-12T10:00:00Z").contains("12"))
        #expect(at("garbage") == "")
    }

    // MARK: A board of your own

    /// Your own board's comments are in its page data: kept by id (a reply on each of two devices
    /// both stay), shown from it, and an AI's reply arriving through sync shows the dot.
    @Test func aBoardOfYourOwnKeepsCommentsInItsPageData() async throws {
        let store = NotePageDataStore(file: nil)
        let note = UUID()
        store.set(note, NotePageDataStore.with(Self.scene, in: store.doc(note)))
        let canvas = CanvasController()
        canvas.noteID = note
        canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        BoardCollab.wirePrivate(note, canvas, store: store)
        canvas.author = BoardComments.Author(id: "me", name: "Emil")
        #expect(canvas.canComment && canvas.comments.isEmpty && !canvas.unseen)

        canvas.receive(["comment": ["new": ["on": "a", "x": 0.5, "y": 0.5]]])
        let c = try #require(canvas.post("Split this"))
        #expect(BoardComments.stored(in: store.doc(note)) == [c])
        #expect(store.dirty.contains(note), "synced as the drawing is")
        // The drawing is untouched: comments are never elements.
        let elements = ((store.doc(note)["values"] as? [String: Any])?["scene"] as? [String: Any])?["elements"] as? [[String: Any]]
        #expect(elements?.count == 2)

        // Another device replied, and your AI did: merged by id, both kept.
        let phone = BoardComment(id: "c-phone", thread: c.id, by: "me", name: "Emil", text: "From my phone", created: "2026-11-15T10:00:00Z")
        let ai = BoardComment(id: "c-ai", thread: c.id, by: "u1", name: "Emil", ai: "Claude", text: "Split into a and a2", created: "2026-11-15T10:00:01Z")
        let theirs = BoardComments.keeping([phone, ai], in: NotePageData.decode(nil))
        let merged = NotePageData.merge(base: NotePageData.decode(nil), mine: store.doc(note), theirs: theirs)
        store.set(note, merged)
        canvas.show(comments: BoardComments.stored(in: store.doc(note)))
        #expect(canvas.threads.first?.replies.map(\.id) == ["c-phone", "c-ai"])
        #expect(canvas.isMine(phone) && !canvas.isMine(ai))
        #expect(canvas.unseen, "an AI's reply shows the dot; your own don't")
        canvas.showingComments = true
        #expect(!canvas.unseen)

        // Resolved: kept, marked, version up.
        canvas.resolve(c.id)
        let kept = BoardComments.stored(in: store.doc(note))
        #expect(kept.first { $0.id == c.id }.map { ($0.resolved, $0.version) } ?? (false, 0) == (true, 2))
        #expect(kept.count == 3)
    }

    /// The first look at a board marks what it has as seen (no dot for old comments); a new one
    /// from someone else shows it; seen is remembered per board.
    @Test func theDotIsForNewCommentsFromOthers() {
        let defaults = TestDefaults()
        let board = UUID()
        let old = BoardComment(id: "c-old", x: 0, y: 0, by: "u2", name: "Sara", text: "Old", created: "2026-11-14T09:00:00Z")
        let canvas = CanvasController()
        canvas.noteID = board
        canvas.seenStore = BoardComments.Seen(defaults: defaults)
        canvas.author = BoardComments.Author(id: "u1", name: "Emil")
        canvas.show(comments: [old])
        #expect(!canvas.unseen)
        let mine = BoardComment(id: "c-mine", x: 0, y: 0, by: "u1", name: "Emil", text: "Mine", created: "2026-11-15T09:00:00Z")
        canvas.show(comments: [old, mine])
        #expect(!canvas.unseen)
        let new = BoardComment(id: "c-new", thread: "c-old", by: "u2", name: "Sara", text: "New", created: "2026-11-15T09:01:00Z")
        canvas.show(comments: [old, mine, new])
        #expect(canvas.unseen)
        // The board opened again later (a new page): still unseen until looked at.
        let again = CanvasController()
        again.noteID = board
        again.seenStore = BoardComments.Seen(defaults: defaults)
        again.author = canvas.author
        again.show(comments: [old, mine, new])
        #expect(again.unseen)
        again.open(thread: "c-old")
        #expect(!again.unseen && BoardComments.Seen(defaults: defaults).ids(board)?.contains("c-new") == true)
    }

    /// Posting needs a place and words; the popover closing by itself just after another opened
    /// (a click on a second pin) doesn't close the new one.
    @Test func composingAndClosing() throws {
        let canvas = CanvasController()
        canvas.author = BoardComments.Author(id: "u1", name: "Emil")
        var kept: [BoardComment] = []
        canvas.onComments = { kept += $0 }
        #expect(canvas.post("No place") == nil)
        canvas.receive(["comment": ["new": ["x": 10, "y": 20]]])
        #expect(canvas.post("   ") == nil && canvas.draft != nil)
        canvas.receive(["commentAt": ["id": "draft", "x": 100, "y": 80, "width": 24, "height": 24]])
        #expect(canvas.commentAnchor == CGRect(x: 100, y: 80, width: 24, height: 24))
        let c = try #require(canvas.post("Here"))
        #expect(kept == [c] && canvas.openThread == c.id)
        canvas.popoverClosed()
        #expect(canvas.openThread == c.id, "just opened: a close from the one before")
        canvas.closeThread()
        #expect(canvas.openThread == nil && canvas.draft == nil && canvas.commentAnchor == nil)
        // A pin's click opens its thread; an unknown one opens nothing.
        canvas.receive(["comment": ["open": c.id]])
        #expect(canvas.openThread == c.id)
        canvas.receive(["comment": ["open": "c-nope"]])
        #expect(canvas.openThread == c.id)
        #expect(CanvasCommentAnchor.placed(CGRect(x: -40, y: 900, width: 24, height: 24), in: CGSize(width: 800, height: 600)) == CGRect(x: 0, y: 576, width: 24, height: 24))
    }
}

/// Comments when a board starts and stops being shared, through the library and the fake server
/// (as SharedBoardAITests).
@MainActor @Suite struct BoardCommentsSharingTests {
    let server = FakeCollabServer()
    let owner = UUID(uuidString: "0A000000-0000-4000-8000-0000000000C1")!
    let member = UUID(uuidString: "0A000000-0000-4000-8000-0000000000C2")!
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

    /// Emil's own board had comments (one from before he signed in): sharing it takes them into
    /// the document, as his; Sara has them and replies; stopping sharing keeps all of them, as a
    /// board of his own again.
    @Test func sharingTakesTheCommentsAlongAndStoppingKeepsThem() async throws {
        let emil = try device(owner)
        let note = CanvasNote.make(in: .all, context: emil.context, scene: BoardCommentsTests.scene, named: "Launch plan")
        let before = BoardComment(id: "c-1", on: "a", by: "me", name: "Emil", text: "Bigger?", created: "2026-11-14T09:00:00Z")
        let older = BoardComment(id: "c-0", x: 0, y: 0, by: "me", name: "Emil", text: "Done", created: "2026-11-13T09:00:00Z", resolved: true, version: 2)
        BoardComments.keep([before, older], for: note.id)
        try await emil.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let e = try await emil.library.becomeShared(note, nk: nk)
        #expect(e.boardComments.map(\.id) == ["c-0", "c-1"])
        #expect(e.boardComments.allSatisfy { $0.by == owner.uuidString }, "his account's now, so others see his name")
        #expect(e.boardComments.first { $0.id == "c-0" }?.resolved == true)
        server.add(member, to: note.id)
        await e.refreshMembers()

        let phone = try device(member)
        let mine = try await phone.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let s = try #require(phone.library.session(for: mine))
        #expect(s.boardComments == e.boardComments)
        s.commentLocal([BoardComment(id: "c-2", thread: "c-1", by: member.uuidString, name: "Sara", text: "Yes", created: "2026-11-15T09:00:00Z")])
        await waitUntil { s.isSent }
        await e.catchUp().value
        #expect(e.boardComments.count == 3)

        emil.library.removeLocally(note)
        let kept = BoardComments.stored(in: NotePageDataStore.shared.doc(note.id))
        #expect(kept.map(\.id) == ["c-0", "c-1", "c-2"])
        #expect(kept.first { $0.id == "c-2" }?.name == "Sara")
        // The drawing stays as it was, without them.
        let elements = ((NotePageDataStore.shared.doc(note.id)["values"] as? [String: Any])?["scene"] as? [String: Any])?["elements"] as? [[String: Any]]
        #expect(elements?.count == 2)
    }
}
