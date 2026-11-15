import Foundation
import SwiftData
import SwiftUI
import Testing
import WebKit
#if os(iOS)
import UIKit
#endif
@testable import Pane

extension NetworkFaults {
/// A board you can trust to sync (whiteboard council, round 12: "show it syncing between the Mac
/// and the iPhone, offline, and after reconnecting"). The Mac's notes window, signed in to the
/// in-memory server (StubSupabase) through the app's own sync: a drawing made on the iPhone arrives
/// on the open board; offline the board says so and keeps what's drawn; back online it says so,
/// the drawing goes up, and it says Synced. Pictures with WHITEBOARD_SHOTS
/// (TEST_RUNNER_WHITEBOARD_SHOTS=dir for xcodebuild); offscreen, nothing posts input.
@MainActor @Suite(.sealedAccount) struct BoardSyncPictureTests {
    init() {
        StubSupabase.reset()
        NetFault.config = .init()
        NetFault.resetLog()
    }

    #if os(macOS)
    /// The notes window as the app makes it: the sync's reach and last sync handed down as the app
    /// hands them (PaneApp).
    struct Window: View {
        let engine: SyncEngine
        let container: ModelContainer

        var body: some View {
            RootView().modelContainer(container).environment(SetupStore())
                .environment(engine)
                .environment(\.networkReach, engine.reach)
                .environment(\.syncedAt, engine.syncedAt)
                .tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key)
        }
    }

    #endif

    /// The board's drawing as the page has it, full elements.
    static func scene(_ web: WKWebView) async throws -> [String: Any] {
        let json = try #require(try await web.evaluateJavaScript("JSON.stringify({ type: 'excalidraw', version: 2, elements: amber._canvas.api.getSceneElementsIncludingDeleted(), files: amber._canvas.api.getFiles(), appState: {} })") as? String)
        return try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
    }

    static func says(_ web: WKWebView, _ words: String) async -> Bool {
        (try? await web.evaluateJavaScript("amber._canvas.api.getSceneElements().some((e) => e.type === 'text' && e.text.replace(/\\n/g, ' ') === '\(words)')") as? Bool) == true
    }

    /// What the server holds of the board's drawing, opened.
    static func onServer(_ id: UUID) -> String? {
        let row = StubSupabase.rows("note_pages").first { ($0["note_id"] as? String)?.lowercased() == id.uuidString.lowercased() }
        return (row?["data_ct"] as? String).flatMap { Wire.sealer?.open($0, context: E2EE.pageData(id)) }
    }

    /// The board's row as the server keeps it, with the columns its defaults fill (the stub fills
    /// none): what a device pushes goes into it (as BoardShareTests).
    static func plantRow(_ board: UUID, by client: String) {
        let made = Date.now.addingTimeInterval(-600)
        StubSupabase.insert("note_pages", ["note_id": board.uuidString.lowercased(), "client": client,
                                           "page_ct": Wire.sealer!.seal(CanvasNote.project, context: E2EE.page(board))!,
                                           "updated_at": StubSupabase.stamp(made), "server_updated_at": StubSupabase.stamp(made)])
    }

    /// Another device's drawing of the board, sent as it sends one: sealed, into the board's row
    /// (the stub stamps the row as the server does, so the next pull brings it).
    static func sendFromOtherDevice(_ board: UUID, scene: [String: Any], client: String) async throws {
        let doc = NotePageData.encode(["values": ["scene": scene], "collections": [String: Any]()])
        let box = try #require(Wire.sealer?.seal(String(decoding: doc, as: UTF8.self), context: E2EE.pageData(board)))
        try await StubSupabase.client().from("note_pages").update(["data_ct": box, "client": client]).eq("note_id", value: board).execute()
    }

    /// The board on another device, given what's there now, with a note added there.
    static func drawnElsewhere(_ now: [String: Any], adding words: String, y: Int) async throws -> [String: Any] {
        let other = try await CanvasNativeUITests.Joined(scene: now)
        defer { other.close() }
        try await other.ready()
        _ = try await other.js("amber._canvasCommand({ op: 'insert', elements: [{ type: 'rectangle', x: 880, y: \(y), width: 210, height: 100, backgroundColor: '#ffec99', fillStyle: 'solid', roundness: { type: 3 }, label: { text: '\(words)' } }] }); 1")
        for _ in 0..<100 where !(await Self.says(other.web, words)) { try await Task.sleep(for: .milliseconds(30)) }
        #expect(await Self.says(other.web, words))
        return try await Self.scene(other.web)
    }

    #if os(macOS)
    @Test func aBoardSyncsWithTheIPhoneAndSaysWhenItsOfflineAndBack() async throws {
        let dir = ProcessInfo.processInfo.environment["WHITEBOARD_SHOTS"].map { URL(fileURLWithPath: $0) }
        if let dir { try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true) }
        let c = try AppSnapshotTests.container()
        let path = NetworkPath()
        let engine = SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com", userID: SealedAccount.user),
                                context: c.mainContext, defaults: MemoryDefaults(), path: path)
        defer { Task { await engine.stop() } }
        let board = CanvasNote.make(in: .all, context: c.mainContext, named: "Product launch")
        NotePageDataStore.shared.set(board.id, ["values": ["scene": CanvasNativeUITests.flowchart], "collections": [String: Any]()])
        defer { NotePageDataStore.shared.set(board.id, nil) }
        Self.plantRow(board.id, by: "Mac")
        try c.mainContext.save()
        await engine.sync()
        #expect(!NotePageDataStore.shared.dirty.contains(board.id), "the board went up")
        #expect(Self.onServer(board.id)?.contains("Ready?") == true)

        try await AppSnapshotTests.withLastNote(c, "Product launch") {
            let size = CGSize(width: 1400, height: 900)
            let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                             styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
            w.isReleasedWhenClosed = false
            w.appearance = NSAppearance(named: .aqua)
            w.contentViewController = NSHostingController(rootView: Window(engine: engine, container: c))
            w.setContentSize(size)
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            var found: WKWebView?
            for _ in 0..<100 where found == nil {
                found = NotePageLive.view(board.id)
                if found == nil { await MacWindowChromeTests.settle(w, 1) }
            }
            let web = try #require(found as? NotePageWebView, "the board opened")
            try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvas)")
            let canvas = try #require(web.canvas)
            for _ in 0..<100 where canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
            @MainActor func shot(_ name: String) async throws {
                guard let dir else { return }
                _ = try? await web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
                await MacWindowChromeTests.settle(w, 10)
                _ = try? await CanvasNativeUITests.settledView(w, web)
                let image = try await web.takeSnapshot(configuration: WKSnapshotConfiguration())
                let cover = NSImageView(frame: web.bounds)
                cover.image = image
                cover.imageScaling = .scaleAxesIndependently
                web.addSubview(cover)
                defer { cover.removeFromSuperview() }
                w.contentView?.layoutSubtreeIfNeeded()
                w.displayIfNeeded()
                let png = try #require(try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:]))
                try png.write(to: dir.appending(path: "\(name).png"))
            }
            try await shot("38-sync-1-on-the-mac")

            // On the iPhone, the same board gets a note: drawn there, it goes up as the iPhone
            // sends it (sealed, its own row), and comes down to the open board here.
            try await Self.sendFromOtherDevice(board.id, scene: try await Self.drawnElsewhere(try await Self.scene(web), adding: "Added on iPhone", y: 230), client: "iPhone")
            let rows = StubSupabase.rows("note_pages").filter { ($0["note_id"] as? String)?.lowercased() == board.id.uuidString.lowercased() }
            #expect(rows.count == 1 && Self.onServer(board.id)?.contains("Added on iPhone") == true, "the iPhone's drawing is on the server: \(rows.count) rows")
            await engine.sync()
            let stored = String(decoding: NotePageDataStore.shared.peek(board.id) ?? Data(), as: UTF8.self)
            #expect(stored.contains("Added on iPhone"), "it came down to this Mac (dirty: \(NotePageDataStore.shared.dirty.contains(board.id)))")
            for _ in 0..<100 where !(await Self.says(web, "Added on iPhone")) { await MacWindowChromeTests.settle(w, 1) }
            #expect(await Self.says(web, "Added on iPhone"), "the iPhone's note is on the open board")
            #expect(await Self.says(web, "Ready?"), "and what was there stays")
            try await shot("38-sync-2-from-the-iphone")

            // Offline: the board says so, and what's drawn is kept here until it can go up.
            path.force(down: true)
            await MacWindowChromeTests.settle(w, 5)
            #expect(engine.reach == .offline)
            _ = try await web.evaluateJavaScript("amber._canvasCommand({ op: 'insert', elements: [{ type: 'rectangle', x: 880, y: 380, width: 210, height: 100, backgroundColor: '#a5d8ff', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Drawn offline' } }] }); 1")
            for _ in 0..<100 where !NotePageDataStore.shared.dirty.contains(board.id) { await MacWindowChromeTests.settle(w, 1) }
            #expect(NotePageDataStore.shared.dirty.contains(board.id), "saved on this Mac")
            // The whole board in view for the pictures (adding it zoomed to the new note).
            _ = try await web.evaluateJavaScript("amber._canvas.api.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.8, animate: false }); 1")
            await engine.sync()
            #expect(NotePageDataStore.shared.dirty.contains(board.id) && Self.onServer(board.id)?.contains("Drawn offline") == false, "nothing goes up offline")
            #expect(BoardSync.now(reach: engine.reach, backAt: nil, syncedAt: engine.syncedAt) == .away(.offline))
            try await shot("39-offline-saved-on-this-mac")

            // Back: said at once; the drawing goes up with the next sync; then Synced.
            let hold = BoardSyncLine.hold
            BoardSyncLine.hold = .seconds(60)
            defer { BoardSyncLine.hold = hold }
            path.force(down: false)
            await MacWindowChromeTests.settle(w, 5)
            #expect(engine.reach == .online)
            try await shot("40-back-online-syncing")
            await engine.sync()
            #expect(!NotePageDataStore.shared.dirty.contains(board.id), "it went up")
            let server = try #require(Self.onServer(board.id))
            #expect(server.contains("Drawn offline") && server.contains("Added on iPhone") && server.contains("Ready?"), "the server has the whole board")
            #expect(engine.syncedAt != nil)
            await MacWindowChromeTests.settle(w, 5)
            try await shot("40-back-online-synced")
        }
    }
    #endif

    #if os(iOS)
    nonisolated(unsafe) static var keptStores: [ModelContainer] = []

    /// A board on the iPhone, with the sync's reach and last sync handed down as the app hands them.
    struct Phone: View {
        let engine: SyncEngine
        let note: Note

        var body: some View {
            NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }
                .environment(engine)
                .environment(\.networkReach, engine.reach)
                .environment(\.syncedAt, engine.syncedAt)
                .tint(Color(PColor.paneAccent))
        }
    }

    /// The iPhone's side: what the Mac draws arrives on the open board; offline, the board says so
    /// above its dock; back, Synced once the next sync is through.
    @Test func aBoardOnTheIPhoneTakesTheMacsDrawingAndSaysWhenItsOfflineAndBack() async throws {
        let dir = (ProcessInfo.processInfo.environment["WHITEBOARD_SHOTS"] ?? ProcessInfo.processInfo.environment["CANVAS_SHOTS"]).map { URL(fileURLWithPath: $0) }
        if let dir { try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true) }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Self.keptStores.append(c)
        let path = NetworkPath()
        let engine = SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com", userID: SealedAccount.user),
                                context: c.mainContext, defaults: MemoryDefaults(), path: path)
        defer { Task { await engine.stop() } }
        let board = CanvasNote.make(in: .all, context: c.mainContext, named: "Product launch")
        NotePageDataStore.shared.set(board.id, ["values": ["scene": CanvasNativeUITests.flowchart], "collections": [String: Any]()])
        defer { NotePageDataStore.shared.set(board.id, nil) }
        Self.plantRow(board.id, by: "iPhone")
        try c.mainContext.save()
        await engine.sync()
        #expect(!NotePageDataStore.shared.dirty.contains(board.id), "the board went up")

        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
        window.overrideUserInterfaceStyle = .light
        window.rootViewController = UIHostingController(rootView: Phone(engine: engine, note: board).modelContainer(c))
        window.isHidden = false
        defer { window.isHidden = true; window.rootViewController = nil }
        try await Task.sleep(for: .seconds(3))
        @MainActor func find(_ v: UIView) -> WKWebView? { (v as? WKWebView) ?? v.subviews.lazy.compactMap(find).first }
        let web = try #require(find(window))
        try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvas)")
        @MainActor func fit() async throws { _ = try await web.evaluateJavaScript("amber._canvas.api.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.85 }); 1") }
        @MainActor func shot(_ name: String) async throws {
            guard let dir else { return }
            try await Task.sleep(for: .seconds(1))
            let format = UIGraphicsImageRendererFormat()
            format.scale = 3
            let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
            }
            try #require(image.pngData()).write(to: dir.appending(path: "\(name).png"))
        }
        try await fit()
        try await shot("41-sync-iphone-1-board")

        // On the Mac, a note is added: it comes down to the open board here.
        try await Self.sendFromOtherDevice(board.id, scene: try await Self.drawnElsewhere(try await Self.scene(web), adding: "Added on the Mac", y: 230), client: "Mac")
        await engine.sync()
        for _ in 0..<150 where !(await Self.says(web, "Added on the Mac")) { try await Task.sleep(for: .milliseconds(50)) }
        #expect(await Self.says(web, "Added on the Mac"), "the Mac's note is on the open board")
        #expect(await Self.says(web, "Ready?"))
        try await fit()
        try await shot("41-sync-iphone-2-from-the-mac")

        // Offline: said above the dock; back: Synced once the next sync is through.
        path.force(down: true)
        try await Task.sleep(for: .milliseconds(300))
        #expect(engine.reach == .offline)
        try await shot("41-sync-iphone-3-offline")
        let hold = BoardSyncLine.hold
        BoardSyncLine.hold = .seconds(60)
        defer { BoardSyncLine.hold = hold }
        path.force(down: false)
        try await Task.sleep(for: .milliseconds(300))
        await engine.sync()
        #expect(engine.syncedAt != nil)
        try await shot("41-sync-iphone-4-synced")
    }
    #endif
}
}
