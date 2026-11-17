import CryptoKit
import Foundation
import Supabase
import SwiftData
import Testing
@testable import Pane

/// A whiteboard edited at once in the app and in a browser, against the local stack only. Runs only
/// when TEST_RUNNER_BOARD_WEB_LIVE names a JSON file `{url, anon_key, owner: {email, password,
/// data_key}, dir}`, made by scripts/board-web-e2e.sh, which also runs the browser side
/// (scripts/board-web-e2e.ts, headless Chromium on the site at /s/<id>). The two meet through files
/// in `dir`:
///
/// 1. The app (Emil, the owner) shares a board with an Edit link and writes `link.txt`.
/// 2. The browser opens the link (the board shows, read only), signs up with an email code, joins,
///    draws a rectangle and moves its pointer, and writes `browser.json` {user, element}.
/// 3. The app has the rectangle and the browser's pointer. It moves its box, points at it, and
///    comments on it mentioning the browser's person; `mac.json` {comment, colors}: the colour the
///    app gives each of them, which the browser's avatars, pointers and pins must have too.
/// 4. The browser has the move, the app's pointer and the comment, and replies; `reply.json`.
/// 5. The app has the reply, sealed and in its thread: `done.txt`.
/// 6. The browser presents (its More menu, Present): `presenting.json`. The app sees "Sara is
///    presenting · Launch · 1 of 2" and follows; the browser's bar says "Emil is following" and
///    steps on; the app sees the second step: `followed.txt`. Done: `presented.json`.
/// 7. The app turns the link to Can comment: `comment-link.txt`. A second browser person signs in
///    through it, has no drawing tools, comments on the box and edits it from its ⋯ menu:
///    `commenter.json` {user, text}. The app has it live, from the comment stream, stamped
///    commenter, and no change of the drawing from her: `commented.txt`.
@MainActor
@Suite(.enabled(if: BoardWebLive.config != nil), .serialized)
struct BoardWebLiveTests {
    typealias Board = SharedBoardTests

    private func until(_ seconds: Double, _ condition: () -> Bool) async {
        let end = Date.now.addingTimeInterval(seconds)
        while !condition(), Date.now < end { try? await Task.sleep(for: .milliseconds(100)) }
    }

    private func file(_ name: String, within seconds: Double) async -> Data? {
        let c = BoardWebLive.config!
        let url = URL(fileURLWithPath: c.dir).appendingPathComponent(name)
        await until(seconds) { FileManager.default.fileExists(atPath: url.path) }
        return FileManager.default.contents(atPath: url.path)
    }

    private func write(_ name: String, _ body: String) throws {
        let c = BoardWebLive.config!
        try Data(body.utf8).write(to: URL(fileURLWithPath: c.dir).appendingPathComponent(name), options: .atomic)
    }

    @Test func theAppAndABrowserEditOneBoardAndSeeEachOther() async throws {
        let c = try #require(BoardWebLive.config)
        let client = SupabaseClient(supabaseURL: c.url, supabaseKey: c.anon_key,
                                    options: SupabaseClientOptions(auth: .init(storage: GoogleSignInTests.MemoryStorage(), autoRefreshToken: false)))
        let signedIn = try await client.auth.signIn(email: c.owner.email, password: c.owner.password)
        let me = signedIn.user.id
        let dataKey = SymmetricKey(data: try #require(Data(base64Encoded: c.owner.data_key)))
        let store = CollabStore(name: "Emil Wagman", transport: SupabaseCollabTransport(client: client, me: me), dataKey: { dataKey },
                                book: CollabKeyBook(account: me, defaults: TestDefaults()))
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        store.context = container.mainContext
        defer { store.stop() }

        // 1. Shared with an Edit link, a box on it, in the first of two frames.
        @MainActor func box(x: Double, version: Int = 1, nonce: Int = 1) -> [String: Any] {
            Board.shape("mac-1", x: x, y: 80, version: version, nonce: nonce, text: nil).merging(["frameId": "launch"]) { _, b in b }
        }
        @MainActor func frame(_ id: String, _ name: String, x: Double, index: String) -> [String: Any] {
            Board.shape(id, x: x, y: 0, index: index, type: "frame").merging(["width": 520, "height": 320, "name": name]) { _, b in b }
        }
        let note = CanvasNote.make(in: .all, context: container.mainContext,
                                   scene: Board.scene([box(x: 40), frame("launch", "Launch", x: 0, index: "a1"), frame("plan", "Plan", x: 700, index: "a2")]), named: "Launch plan")
        try await store.setAccess(.edit, for: note)
        let link = try #require(store.linkURL(note))
        let e = try #require(store.session(for: note.id))
        #expect(e.isBoard)
        try write("link.txt", link.absoluteString)

        // 2. The browser drew, as a member, and its pointer is here in its colour.
        let said = try #require(await file("browser.json", within: 300), "the browser never said it drew")
        let browser = try #require(try JSONSerialization.jsonObject(with: said) as? [String: String])
        let user = try #require(browser["user"].flatMap(UUID.init(uuidString:))), drawn = try #require(browser["element"])
        await until(30) { Board.element(drawn, in: e) != nil }
        let rect = try #require(Board.element(drawn, in: e), "the browser's rectangle reached the app: \(Board.said(e))")
        #expect(rect["type"] as? String == "rectangle")
        await until(30) { e.boardPeers.contains { $0.id == user && $0.pointer != nil } }
        let peer = try #require(e.boardPeers.first { $0.id == user }, "the browser's pointer reached the app")
        #expect(peer.name == "Sara")
        #expect(peer.color == String(format: "#%06X", CollabSession.palette[e.paletteSlot(of: user)].light))
        // The accounts are the pictures' Emil and Sara (scripts/board-web-e2e.sh), with their colours.
        #expect(me == TestPeople.emil && user == TestPeople.sara, "\(me) \(user)")
        #expect(e.boardColors(of: me).light == TestPeople.color(me).light && peer.color == TestPeople.color(user).light)
        let members = try await store.transport!.members(of: note.id)
        #expect(Set(members.map(\.user_id)) == [me, user], "the browser's account joined the board")
        let row = try #require(members.first { $0.user_id == user })
        #expect(row.role == "editor" && row.accepted)

        // 3. The app moves its box, points at it, and asks the browser's person about it.
        e.boardLocal([box(x: 260, version: 2, nonce: 5)])
        e.boardPresence(pointer: CGPoint(x: 300, y: 110), selection: ["mac-1"])
        let ask = BoardComment(id: BoardComments.newID(), on: "mac-1", x: 1, y: 0, by: me.uuidString, name: "Emil",
                               text: "@Sara does this read right?", created: BoardComments.stamp(), mentions: [user.uuidString])
        e.commentLocal([ask])
        await until(10) { e.unsent == 0 }
        try write("mac.json", #"{"comment":"\#(ask.id)","colors":{"emil":"\#(e.boardColors(of: me).light)","sara":"\#(e.boardColors(of: user).light)"}}"#)
        // The pointer keeps beating while the browser looks.
        for _ in 0..<5 where !FileManager.default.fileExists(atPath: URL(fileURLWithPath: c.dir).appendingPathComponent("reply.json").path) {
            e.boardPresence(pointer: CGPoint(x: 302, y: 112), selection: ["mac-1"])
            try await Task.sleep(for: .seconds(1))
            e.boardPresence(pointer: CGPoint(x: 300, y: 110), selection: ["mac-1"])
            try await Task.sleep(for: .seconds(1))
        }

        // 4 and 5. The browser's reply, in the thread, by its person, mentioning Emil.
        _ = await file("reply.json", within: 120)
        await until(30) { e.boardComments.contains { $0.thread == ask.id } }
        let reply = try #require(e.boardComments.first { $0.thread == ask.id }, "the browser's reply reached the app")
        #expect(reply.by.uppercased() == user.uuidString && reply.name == "Sara" && reply.text.contains("@Emil"))
        #expect(reply.mentions == [me.uuidString], "the reply mentions Emil, by his id as the app writes it")
        let thread = try #require(BoardComments.threads(e.boardComments).first { $0.id == ask.id })
        #expect(thread.replies.map(\.id) == [reply.id])
        // The browser's change is in the app's history as its person's.
        let stored: [Collab.Update] = try await client.from("note_updates").select("id,note_id,author_id,epoch,ct,client")
            .eq("note_id", value: note.id.uuidString.lowercased()).execute().value
        #expect(stored.contains { $0.author_id == user } && stored.allSatisfy { !$0.ct.contains("rectangle") && !$0.ct.contains("Sara") }, "sealed")
        try write("done.txt", "ok")

        // 6. The browser presents: the app sees her frame and step, as its banner says them, and
        // follows; she steps on, and the app has that too. Then Done.
        _ = await file("presenting.json", within: 120)
        @MainActor func hers() -> BoardPresenting? { e.boardPeople.first { $0.id == user }?.presenting }
        await until(30) { hers() != nil }
        let shown = try #require(hers(), "the browser's Present reached the app")
        #expect(shown.frame == "launch" && shown.i == 0 && shown.n == 2, "\(shown)")
        let names = Dictionary(uniqueKeysWithValues: ((e.boardScene()["elements"] as? [[String: Any]]) ?? []).compactMap { el -> (String, String)? in
            guard el["type"] as? String == "frame", let id = el["id"] as? String, let name = el["name"] as? String else { return nil }
            return (id, name)
        })
        let banner = try #require(BoardFollow.banner(people: e.boardPeople, following: nil, presentingHere: false))
        #expect(banner.words { names[$0] } == "Sara is presenting \u{00B7} Launch \u{00B7} 1 of 2")
        e.boardFollow(user)
        await until(60) { hers()?.i == 1 }
        #expect(hers()?.frame == "plan" && hers()?.i == 1, "her next step reached the app: \(String(describing: hers()))")
        try write("followed.txt", "ok")
        _ = await file("presented.json", within: 60)
        await until(30) { hers() == nil }
        #expect(hers() == nil, "Done reached the app")
        e.boardFollow(nil)

        // 7. Can comment, on the same link: Cleo signs in through it in a browser and comments.
        try await store.setAccess(.comment, for: note)
        #expect(store.access(note) == .comment)
        try write("comment-link.txt", try #require(store.linkURL(note)).absoluteString)
        let saidC = try #require(await file("commenter.json", within: 300), "the commenter never said she commented")
        let commenter = try #require(try JSONSerialization.jsonObject(with: saidC) as? [String: String])
        let cleo = try #require(commenter["user"].flatMap(UUID.init(uuidString:))), words = try #require(commenter["text"])
        // Live: well inside the 20 seconds between pulls.
        await until(10) { e.boardComments.contains { $0.by.uppercased() == cleo.uuidString && $0.text == words } }
        let hers = try #require(e.boardComments.first { $0.by.uppercased() == cleo.uuidString }, "her comment reached the app live: \(e.boardComments.map(\.text))")
        #expect(hers.name == "Cleo" && hers.on == "mac-1" && hers.text == words && hers.edited != nil)
        let cleoRow = try #require(try await store.transport!.members(of: note.id).first { $0.user_id == cleo }, "she joined")
        #expect(cleoRow.role == "commenter")
        let entries: [Collab.CommentRow] = try await client.from("note_comments").select("id,note_id,author_id,role,epoch,ct,client")
            .eq("note_id", value: note.id.uuidString.lowercased()).execute().value
        #expect(entries.contains { $0.author_id == cleo && $0.role == "commenter" }, "her entries, stamped commenter")
        #expect(entries.allSatisfy { !$0.ct.contains("twice") && !$0.ct.contains("Cleo") }, "sealed")
        let changes: [Collab.Update] = try await client.from("note_updates").select("id,note_id,author_id,epoch,ct,client")
            .eq("note_id", value: note.id.uuidString.lowercased()).execute().value
        #expect(!changes.contains { $0.author_id == cleo }, "nothing of the drawing from her")
        #if os(macOS)
        // Her comment as the app shows it, from what arrived live: the Mac's thread, next to the
        // browser's pictures (build/repro/board-web/14-mac-sees-the-commenter.png).
        let macBoard = CanvasController()
        macBoard.author = BoardComments.Author(id: me.uuidString, name: "Emil")
        macBoard.seenStore = BoardComments.Seen(defaults: TestDefaults())
        macBoard.show(comments: e.boardComments)
        let picture = try await BoardCommentsCanvasTests.popover(BoardThreadView(canvas: macBoard, id: hers.id), dark: false)
        let out = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appending(path: "build/repro/board-web/14-mac-sees-the-commenter.png")
        try #require(picture.representation(using: .png, properties: [:])).write(to: out)
        #endif
        try write("commented.txt", "ok")

        // 8. An AI's reply to her comment, naming what it changed (a box it added on Plan): in her
        // browser, Show change outlines it and brings it into view; once the box is gone, her
        // thread says the change is no longer on the board, as the app's does (round 16).
        let added = Board.shape("ai-1", x: 820, y: 140, index: "a3").merging(["frameId": "plan", "backgroundColor": "#b2f2bb"]) { _, b in b }
        e.boardLocal([added])
        let aiReply = BoardComment(id: BoardComments.newID(), thread: hers.id, by: me.uuidString, name: "Emil", ai: "Claude",
                                   text: "I added a box on Plan for the wider layout.", created: BoardComments.stamp(), changes: ["ai-1"])
        e.commentLocal([aiReply])
        await until(10) { e.unsent == 0 }
        try write("ai.json", #"{"thread":"\#(hers.id)","reply":"\#(aiReply.id)"}"#)
        _ = try #require(await file("shown.json", within: 180), "the browser never showed the change")
        e.boardLocal([added.merging(["isDeleted": true, "version": 2, "versionNonce": 11]) { _, b in b }])
        await until(10) { e.unsent == 0 }
        try write("ai-gone.txt", "ok")
        _ = try #require(await file("gone-seen.json", within: 120), "the browser never said the change had gone")
    }
}

/// Where the browser test runs, from TEST_RUNNER_BOARD_WEB_LIVE.
enum BoardWebLive {
    struct Config: Decodable, Sendable {
        struct Owner: Decodable, Sendable { let email: String; let password: String; let data_key: String }
        let url: URL
        let anon_key: String
        let owner: Owner
        let dir: String
    }

    static var config: Config? {
        guard let path = ProcessInfo.processInfo.environment["BOARD_WEB_LIVE"], let data = FileManager.default.contents(atPath: path),
              let c = try? JSONDecoder().decode(Config.self, from: data), c.url.host() == "127.0.0.1" else { return nil }
        return c
    }
}
