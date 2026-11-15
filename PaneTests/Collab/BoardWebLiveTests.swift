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
///    comments on it mentioning the browser's person; `mac.json` {comment}.
/// 4. The browser has the move, the app's pointer and the comment, and replies; `reply.json`.
/// 5. The app has the reply, sealed and in its thread: `done.txt`.
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

        // 1. Shared with an Edit link, a box on it.
        let note = CanvasNote.make(in: .all, context: container.mainContext,
                                   scene: Board.scene([Board.shape("mac-1", x: 40, y: 80, text: nil)]), named: "Launch plan")
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
        let members = try await store.transport!.members(of: note.id)
        #expect(Set(members.map(\.user_id)) == [me, user], "the browser's account joined the board")
        let row = try #require(members.first { $0.user_id == user })
        #expect(row.role == "editor" && row.accepted)

        // 3. The app moves its box, points at it, and asks the browser's person about it.
        e.boardLocal([Board.shape("mac-1", x: 260, y: 80, version: 2, nonce: 5)])
        e.boardPresence(pointer: CGPoint(x: 300, y: 110), selection: ["mac-1"])
        let ask = BoardComment(id: BoardComments.newID(), on: "mac-1", x: 1, y: 0, by: me.uuidString, name: "Emil",
                               text: "@Sara does this read right?", created: BoardComments.stamp(), mentions: [user.uuidString])
        e.commentLocal([ask])
        await until(10) { e.unsent == 0 }
        try write("mac.json", #"{"comment":"\#(ask.id)"}"#)
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
