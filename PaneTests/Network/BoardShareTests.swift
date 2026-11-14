import CoreGraphics
import Foundation
import ImageIO
import SwiftData
import Testing
import UniformTypeIdentifiers
@testable import Pane

extension NetworkFaults {
/// A shared whiteboard's web page (14 November 2026): it showed an empty page titled "Whiteboard",
/// as the board's drawing is page data and its text only its title. Now the page's copy is the
/// board's words and the page shows a picture of the board, made from the open board here and
/// kept current as the drawing changes (against StubSupabase).
@MainActor @Suite(.sealedAccount) struct BoardShareTests {
    let user = SealedAccount.user
    let slug = "boardBOARDboardBOARDboar"

    init() {
        StubSupabase.reset()
        NetFault.config = .init()
        BoardPicture.reset()
    }

    struct Device {
        let context: ModelContext
        let engine: SyncEngine
    }

    func device() throws -> Device {
        let context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        let engine = SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com", userID: user), context: context, defaults: MemoryDefaults())
        return Device(context: context, engine: engine)
    }

    /// An open board, as the note pane joins one: it makes whatever picture and scene the test
    /// gives it.
    @MainActor final class OpenBoard {
        let controller = CanvasController()
        var picture: Data?
        var scene: Data?
        private(set) var asked: [(format: CanvasExport, selected: Bool, light: Bool, page: String?)] = []
        init(picture: Data?, scene: Data? = BoardShareTests.file(["Idea"])) {
            self.picture = picture
            self.scene = scene
            controller.exporter = { [unowned self] format, selected, light, page in
                self.asked.append((format, selected, light, page))
                return format == .excalidraw ? self.scene : self.picture
            }
        }
    }

    /// An .excalidraw file with these words on the board.
    nonisolated static func file(_ words: [String]) -> Data {
        try! JSONSerialization.data(withJSONObject: ["type": "excalidraw", "version": 2, "elements": words.enumerated().map { ["type": "text", "id": "t\($0.offset)", "x": 0, "y": $0.offset * 40, "text": $0.element] }, "files": [String: Any]()], options: [.sortedKeys])
    }

    /// A PNG of `width`×`height` in one colour.
    static func png(_ width: Int, _ height: Int, gray: CGFloat = 0.9) -> Data {
        let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(),
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.setFillColor(CGColor(gray: gray, alpha: 1))
        ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
        return encode(ctx.makeImage()!)
    }

    static func encode(_ image: CGImage) -> Data {
        let out = NSMutableData()
        let dest = CGImageDestinationCreateWithData(out, UTType.png.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(dest, image, nil)
        CGImageDestinationFinalize(dest)
        return out as Data
    }

    static func size(_ png: Data) -> (Int, Int)? {
        guard let src = CGImageSourceCreateWithData(png as CFData, nil),
              let p = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any],
              let w = p[kCGImagePropertyPixelWidth] as? Int, let h = p[kCGImagePropertyPixelHeight] as? Int else { return nil }
        return (w, h)
    }

    /// A board with these words on it, a text each.
    static func scene(_ words: [String]) -> [String: Any] {
        CanvasTests.scene(words.enumerated().map { ["type": "text", "id": "t\($0.offset)", "x": 0, "y": $0.offset * 40, "text": $0.element] })
    }

    /// The board's data, as its page saves it.
    static func doc(_ words: [String]) -> NotePageData.Doc { ["values": ["scene": scene(words)], "collections": [String: Any]()] }

    private func plantShare(_ note: UUID) {
        StubSupabase.insert("note_shares", ["slug": slug, "note_id": note.uuidString.lowercased(), "user_id": user.uuidString.lowercased(),
                                            "include_subnotes": false, "share_tag": Wire.sealer!.shareTag(note: note, slug: slug, includeSubNotes: false),
                                            "revoked_at": NSNull()])
    }

    private func answerSharing() {
        let slug = self.slug
        StubSupabase.answer("share_slug") { _ in slug }
        StubSupabase.answer("share_note") { _ in ["slug": slug, "missing_files": [String]()] }
        StubSupabase.answer("publish_share") { _ in ["slug": slug, "missing_files": [String]()] }
    }

    private var pictures: [[String: Any]] { StubSupabase.rpcCalls.filter { $0.name == "publish_share_picture" }.map(\.params) }
    private var copies: [String] {
        StubSupabase.rpcCalls.filter { ["share_note", "publish_share"].contains($0.name) }.compactMap { ($0.params["p_copy"] as? [String: Any])?["body"] as? String }
    }
    private func sent(_ p: [String: Any]) -> Data? { (p["p_content"] as? String).flatMap { Data(base64Encoded: $0) } }
    private var scenes: [[String: Any]] { StubSupabase.rpcCalls.filter { $0.name == "publish_share_scene" }.map(\.params) }
    private func sentScene(_ p: [String: Any]) -> Data? { (p["p_content"] as? String).map { Data($0.utf8) } }

    // MARK: The page's text

    @Test func aBoardsPageCopyIsItsTitleAndItsWordsAsPlainText() throws {
        let a = try device()
        let n = CanvasNote.make(in: .all, context: a.context, scene: CanvasTests.scene([
            ["type": "text", "x": 0, "y": 0, "text": "# Goals"],
            ["type": "rectangle", "id": "r", "x": 0, "y": 40, "width": 160, "height": 60, "label": ["text": "1. Plan *it*"]],
            ["type": "text", "x": 0, "y": 120, "text": "Double-click a shape to type", "customData": ["pintoHint": true]],
            ["type": "text", "x": 0, "y": 160, "text": "Gone", "isDeleted": true],
            ["type": "text", "x": 0, "y": 200, "text": "Ready?"],
        ]), named: "Launch plan")
        let copy = try #require(SharePublisher.copy(of: n.id, includeSubNotes: false, in: a.context))
        #expect(copy.title == "Launch plan")
        #expect(copy.body == "Launch plan\n\n\\# Goals\n\n1\\. Plan \\*it\\*\n\nReady?", "its words, a paragraph each, never markdown; not the how-to line or a deleted word")
        #expect(copy.pages.isEmpty && copy.files.isEmpty)
        // A board with nothing written on it is its title, as before.
        let empty = CanvasNote.make(in: .all, context: a.context)
        #expect(SharePublisher.copy(of: empty.id, includeSubNotes: false, in: a.context)?.body == CanvasNote.title)
        // A note is its text, as before.
        let note = a.context.createNote(in: .all, body: "Trip\n# Day one")
        #expect(SharePublisher.copy(of: note.id, includeSubNotes: false, in: a.context)?.body == "Trip\n# Day one")
        // Markdown in a word stays a word.
        #expect(BoardPicture.escaped("- milk") == "\\- milk" && BoardPicture.escaped("[x](y)") == "\\[x\\](y)" && BoardPicture.escaped("Plain words") == "Plain words")
        #expect(BoardPicture.escaped("2) Ship") == "2\\) Ship" && BoardPicture.escaped("<b>&amp;") == "\\<b\\>\\&amp;")
    }

    @Test func theConsentPromptSaysWhatABoardsPageShows() {
        let board = ShareLinkStore.consent(board: true), note = ShareLinkStore.consent(board: false)
        #expect(board.contains("picture of this whiteboard") && board.contains("outside your encryption") && board.contains("name and email"))
        #expect(board.contains("download the drawing"), "the page offers its .excalidraw file")
        #expect(!board.contains("files"), "a board's page has no files")
        #expect(note == "Anyone with the link can read it and its files, outside your encryption, until you stop sharing. The page shows your name and email.")
    }

    // MARK: The picture

    @Test func sharingAnOpenBoardPublishesItsPictureAndEachDrawingChangeRepublishesIt() async throws {
        let saved = SyncEngine.publishDelay
        SyncEngine.publishDelay = .milliseconds(100)
        defer { SyncEngine.publishDelay = saved }
        let a = try device()
        let n = CanvasNote.make(in: .all, context: a.context, scene: Self.scene(["Idea"]), named: "Launch plan")
        await a.engine.sync()
        answerSharing()
        let first = Self.png(400, 200), second = Self.png(600, 300, gray: 0.8)
        let board = OpenBoard(picture: first)
        BoardPicture.opened(board.controller, note: n.id)

        // Share Link… from the board: the copy is its words, then its picture goes up.
        #expect(try await SharePublisher.share(note: n.id, includeSubNotes: false, client: StubSupabase.client(), container: a.context.container, user: user) == slug)
        #expect(copies == ["Launch plan\n\nIdea"])
        #expect(pictures.count == 1 && pictures[0]["p_slug"] as? String == slug)
        #expect(sent(pictures[0]) == first)
        #expect(board.asked.first.map { $0.format == .png && !$0.selected && $0.light } == true, "the whole board, light whatever the appearance")

        // The drawing changes: it goes up, and 2 s later (here 0.1) the page gets its words and picture.
        plantShare(n.id)
        a.engine.shareChanged(n.id, includesSubNotes: false, slug: slug)
        board.picture = second
        NotePageDataStore.shared.set(n.id, Self.doc(["Idea", "Draft"]))
        await a.engine.sync(pulling: false)
        await a.engine.publishesSettled()
        #expect(copies.last == "Launch plan\n\nIdea\n\nDraft", "the words follow the drawing")
        #expect(pictures.count == 2 && sent(pictures[1]) == second, "and the picture")

        // Published again with nothing new drawn: the picture isn't sent again.
        #expect(await SharePublisher.republish(root: n.id, client: StubSupabase.client(), context: a.context, user: user) == slug)
        #expect(pictures.count == 2)
        // Copy Link puts the page right: the picture goes whatever was sent.
        _ = try await SharePublisher.share(note: n.id, includeSubNotes: false, client: StubSupabase.client(), container: a.context.container, user: user)
        #expect(pictures.count == 3 && sent(pictures[2]) == second)

        // Trashed, the server took the page down with its picture; restored, it's sent again.
        n.trashedAt = .now
        #expect(await SharePublisher.republish(root: n.id, client: StubSupabase.client(), context: a.context, user: user) == nil)
        n.trashedAt = nil
        #expect(await SharePublisher.republish(root: n.id, client: StubSupabase.client(), context: a.context, user: user) == slug)
        #expect(pictures.count == 4 && sent(pictures[3]) == second)

        // Rubbed out: the page shows no picture.
        board.picture = nil
        board.controller.receive(["empty": true])
        #expect(await SharePublisher.republish(root: n.id, client: StubSupabase.client(), context: a.context, user: user) == slug)
        #expect(pictures.count == 5 && pictures[4]["p_slug"] as? String == slug && pictures[4]["p_content"] == nil)

        // Closed: the drawing still changes the words (an AI, another device), and the page keeps
        // the last picture: nothing draws the board here.
        BoardPicture.closed(board.controller, note: n.id)
        NotePageDataStore.shared.set(n.id, Self.doc(["Idea", "Draft", "Ship"]))
        await a.engine.sync(pulling: false)
        await a.engine.publishesSettled()
        #expect(copies.last == "Launch plan\n\nIdea\n\nDraft\n\nShip")
        #expect(pictures.count == 5)
        await a.engine.stop()
    }

    @Test func aDrawingThatArrivesFromAnAIRepublishesTheOpenBoardsPage() async throws {
        let saved = SyncEngine.publishDelay
        SyncEngine.publishDelay = .milliseconds(100)
        defer { SyncEngine.publishDelay = saved }
        let a = try device()
        let n = CanvasNote.make(in: .all, context: a.context, named: "Launch plan")
        // The board's row as the server keeps it, with the columns its defaults fill (the stub
        // fills none): what this device pushes goes into it.
        let before = Date.now.addingTimeInterval(-60)
        StubSupabase.insert("note_pages", ["note_id": n.id.uuidString.lowercased(), "client": "Mac",
                                           "page_ct": Wire.sealer!.seal(CanvasNote.project, context: E2EE.page(n.id))!,
                                           "updated_at": StubSupabase.stamp(before), "server_updated_at": StubSupabase.stamp(before)])
        await a.engine.sync()
        #expect(!NotePageDataStore.shared.dirty.contains(n.id), "the board went up")
        answerSharing()
        plantShare(n.id)
        let board = OpenBoard(picture: Self.png(300, 300))
        BoardPicture.opened(board.controller, note: n.id)

        // Claude draws through MCP: the row comes down sealed, as the server writes it.
        let row = try #require(StubSupabase.rows("note_pages").first { ($0["note_id"] as? String)?.lowercased() == n.id.uuidString.lowercased() })
        let json = String(decoding: NotePageData.encode(Self.doc(["From Claude"])), as: UTF8.self)
        var theirs = row
        theirs["data_ct"] = Wire.sealer!.seal(json, context: E2EE.pageData(n.id))!
        theirs["client"] = "Claude"
        theirs["updated_at"] = StubSupabase.stamp(.now)
        theirs["server_updated_at"] = StubSupabase.stamp(.now.addingTimeInterval(1))
        StubSupabase.insert("note_pages", theirs)
        await a.engine.sync()
        await a.engine.publishesSettled()
        #expect(CanvasSketch.of(n.id)?.preview == "From Claude", "the drawing came down")
        #expect(copies.last == "Launch plan\n\nFrom Claude")
        #expect(pictures.count == 1 && pictures[0]["p_slug"] as? String == slug)
        await a.engine.stop()
    }

    /// The page shows the board's name once and offers its file (whiteboard council, round 3): the
    /// picture is asked for without the board's title when it says the page's heading (the note's
    /// name), and the .excalidraw file, without the how-to line, goes up beside it, sent when it
    /// changes, left out when it's over the limit and taken away with the picture.
    @Test func aBoardsSceneGoesUpBesideItsPictureAndThePictureLeavesOutItsTitle() async throws {
        let a = try device()
        let n = CanvasNote.make(in: .all, context: a.context, scene: Self.scene(["Idea"]), named: "Launch plan")
        await a.engine.sync()
        answerSharing()
        let picture = Self.png(400, 200)
        let board = OpenBoard(picture: picture, scene: Self.file(["Idea"]))
        board.controller.title = "Whiteboard"
        BoardPicture.opened(board.controller, note: n.id)

        #expect(try await SharePublisher.share(note: n.id, includeSubNotes: false, client: StubSupabase.client(), container: a.context.container, user: user) == slug)
        #expect(pictures.count == 1 && sent(pictures[0]) == picture)
        #expect(scenes.count == 1 && scenes[0]["p_slug"] as? String == slug && sentScene(scenes[0]) == Self.file(["Idea"]))
        // Both made for the page, whose heading is the note's name (not what the board calls itself).
        #expect(board.asked.map { "\($0.format.rawValue) \($0.light) \($0.page ?? "-")" } == ["png true Launch plan", "excalidraw false Launch plan"])

        // Published again with nothing new: neither is sent again.
        plantShare(n.id)
        #expect(await SharePublisher.republish(root: n.id, client: StubSupabase.client(), context: a.context, user: user) == slug)
        #expect(pictures.count == 1 && scenes.count == 1)
        // Only the file changed (a how-to line's words, say): only it goes.
        board.scene = Self.file(["Idea", "Draft"])
        #expect(await SharePublisher.republish(root: n.id, client: StubSupabase.client(), context: a.context, user: user) == slug)
        #expect(pictures.count == 1 && scenes.count == 2 && sentScene(scenes[1]) == Self.file(["Idea", "Draft"]))
        // Over the limit (pictures pasted on the board): the page offers no file, and keeps its picture.
        board.scene = Data(repeating: 0x20, count: BoardPicture.maxSceneBytes + 1)
        #expect(await SharePublisher.republish(root: n.id, client: StubSupabase.client(), context: a.context, user: user) == slug)
        #expect(pictures.count == 1 && scenes.count == 3 && scenes[2]["p_content"] == nil)
        #expect(BoardPicture.maxSceneBytes == 4 * 1024 * 1024, "the server's limit")
        // Copy Link puts the page right: both go, whatever was sent.
        board.scene = Self.file(["Idea"])
        _ = try await SharePublisher.share(note: n.id, includeSubNotes: false, client: StubSupabase.client(), container: a.context.container, user: user)
        #expect(pictures.count == 2 && scenes.count == 4 && sentScene(scenes[3]) == Self.file(["Idea"]))
        // Trashed, the server took both down; restored, both are sent again.
        n.trashedAt = .now
        #expect(await SharePublisher.republish(root: n.id, client: StubSupabase.client(), context: a.context, user: user) == nil)
        n.trashedAt = nil
        #expect(await SharePublisher.republish(root: n.id, client: StubSupabase.client(), context: a.context, user: user) == slug)
        #expect(pictures.count == 3 && scenes.count == 5)
        // Rubbed out: no picture and no file.
        board.picture = nil
        board.controller.receive(["empty": true])
        #expect(await SharePublisher.republish(root: n.id, client: StubSupabase.client(), context: a.context, user: user) == slug)
        #expect(pictures.count == 4 && pictures[3]["p_content"] == nil && scenes.count == 6 && scenes[5]["p_content"] == nil)
        // Without a heading given, the page is named for the board.
        board.picture = picture
        board.controller.receive(["empty": false])
        #expect(await BoardPicture.publish(note: n.id, slug: slug, client: StubSupabase.client(), force: true) == .sent)
        #expect(board.asked.last?.page == "Whiteboard")
        await a.engine.stop()
    }

    @Test func anotherAppsDataChangingDoesntRepublishItsPage() async throws {
        let saved = SyncEngine.publishDelay
        SyncEngine.publishDelay = .milliseconds(50)
        defer { SyncEngine.publishDelay = saved }
        let a = try device()
        let n = a.context.createNote(in: .all, body: "Habits")
        n.dirty = true
        NotePageStore.shared.setHere(n.id, .init(html: "<!doctype html><p>Habits</p>", by: "Claude", at: .now))
        await a.engine.sync()
        answerSharing()
        plantShare(n.id)
        a.engine.shareChanged(n.id, includesSubNotes: false, slug: slug)
        NotePageDataStore.shared.set(n.id, ["values": ["done": 3], "collections": [String: Any]()])
        await a.engine.sync(pulling: false)
        await a.engine.publishesSettled()
        #expect(NotePageDataStore.shared.dirty.contains(n.id) == false, "it went up")
        #expect(copies.isEmpty, "its page is its text, which didn't change")
        await a.engine.stop()
    }

    @Test func aPictureOverTheLimitIsSentSmaller() throws {
        // Noise doesn't compress: a PNG about as big as its pixels.
        let w = 600, h = 400
        var px = [UInt8](repeating: 255, count: w * h * 4)
        var seed: UInt64 = 42
        for i in px.indices where i % 4 != 3 { seed = seed &* 6364136223846793005 &+ 1442695040888963407; px[i] = UInt8(truncatingIfNeeded: seed >> 33) }
        let ctx = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(),
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        let big = Self.encode(ctx.makeImage()!)
        let limit = big.count / 3
        let fitted = try #require(BoardPicture.fitted(big, limit: limit))
        #expect(fitted.count <= limit, "\(fitted.count) over \(limit)")
        let (fw, fh) = try #require(Self.size(fitted))
        #expect(fw < w && fh < h && abs(Double(fw) / Double(fh) - 1.5) < 0.02, "smaller, the same shape: \(fw)×\(fh)")
        #expect(BoardPicture.fitted(big) == big, "under the limit it's sent as it is")
        #expect(BoardPicture.fitted(Data("not a picture".utf8), limit: 4) == nil)
        #expect(BoardPicture.maxBytes == 4 * 1024 * 1024, "the server's limit")
    }

    @Test func onlyAnOpenBoardMakesThePicture() async throws {
        let n = UUID()
        let board = OpenBoard(picture: Self.png(10, 10))
        #expect(await BoardPicture.publish(note: n, slug: slug, client: StubSupabase.client()) == .notOpen)
        BoardPicture.opened(board.controller, note: n)
        #expect(BoardPicture.board(n) === board.controller)
        // Another board in its place (the note opened in another window) isn't closed by the first going.
        let other = OpenBoard(picture: nil)
        BoardPicture.opened(other.controller, note: n)
        BoardPicture.closed(board.controller, note: n)
        #expect(BoardPicture.board(n) === other.controller)
        BoardPicture.closed(other.controller, note: n)
        #expect(BoardPicture.board(n) == nil)
        // Open in two windows, the one still open makes it when the other closes.
        BoardPicture.opened(board.controller, note: n)
        BoardPicture.opened(other.controller, note: n)
        #expect(BoardPicture.board(n) === other.controller, "the one opened last")
        BoardPicture.closed(other.controller, note: n)
        #expect(BoardPicture.board(n) === board.controller)
        BoardPicture.closed(board.controller, note: n)
        // A page that isn't ready (no picture, not reported empty) keeps the last picture.
        let loading = OpenBoard(picture: nil)
        BoardPicture.opened(loading.controller, note: n)
        #expect(await BoardPicture.publish(note: n, slug: slug, client: StubSupabase.client()) == .failed)
        #expect(pictures.isEmpty)
    }
}
}
