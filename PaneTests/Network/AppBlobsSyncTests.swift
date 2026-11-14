import Foundation
import SwiftData
import Testing
@testable import Pane

extension NetworkFaults {
/// A note app's binary files over sync (20261115090000_note_app_blobs.sql): a device sends each
/// file once, before the app that names it; a device that pulls an app fetches the files it
/// doesn't have, and shows the app only once they're all here.
@MainActor @Suite(.sealedAccount) struct AppBlobsSyncTests {
    let context: ModelContext
    let engine: SyncEngine

    init() throws {
        StubSupabase.reset()
        NetFault.config = .init()
        NetFault.resetLog()
        UserDefaults.standard.removeObject(forKey: "syncCursor.none")
        UserDefaults.standard.removeObject(forKey: "syncCursor.none.pages")
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        context = ModelContext(c)
        engine = SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com"), context: context)
    }

    private func finish() async {
        await engine.stop()
        NetFault.config = .init()
    }

    private static func random(_ n: Int) -> Data { Data((0 ..< n).map { _ in UInt8.random(in: 0 ... 255) }) }
    private var blobPosts: Int { StubSupabase.requests.filter { $0.hasPrefix("POST /rest/v1/note_app_blobs") }.count }

    @Test func aDeviceSendsEachFileOnceAndTheAppNamesThem() async throws {
        let sealer = try #require(Wire.sealer)
        let id = UUID()
        let wasm = Self.random(5_000), wad = Self.random(300_000)
        var p = NotePageProject(files: ["/index.html": "<canvas></canvas>", "/main.js": "start()"], binary: ["/doom.wasm": NotePageProject.pack(wasm), "/doom1.wad": NotePageProject.pack(wad)])
        NotePageStore.shared.setHere(id, .init(html: p.stored, by: "You", at: .now), sealer: sealer)
        let names = NotePageProject.blobNames(in: try #require(NotePageStore.shared[id]).html)
        #expect(names.count == 2)
        await engine.sync()
        #expect(blobPosts == 2)
        let row = try #require(StubSupabase.rows("note_pages").first { ($0["note_id"] as? String)?.lowercased() == id.uuidString.lowercased() })
        #expect(Set(row["page_blobs"] as? [String] ?? []) == names)
        let box = try #require(row["page_ct"] as? String)
        let sent = try #require(sealer.open(box, context: E2EE.page(id)))
        #expect(sent.utf8.count < 2_000, "the app's text names its files and doesn't hold them: \(sent.utf8.count) bytes")
        for blob in StubSupabase.rows("note_app_blobs") {
            let hash = try #require(blob["hash"] as? String)
            #expect(names.contains(hash))
            let sealed = try #require(blob["blob_ct"] as? String)
            #expect(sealer.openBlob(sealed, hash: hash) != nil)
        }
        // Saved again with one text file changed: the app goes up, no file does.
        p.files["/main.js"] = "start(); // faster"
        NotePageStore.shared.setHere(id, .init(html: p.stored, by: "You", at: .now), sealer: sealer)
        await engine.sync()
        #expect(blobPosts == 2)
        #expect(StubSupabase.rows("note_app_blobs").count == 2)
        #expect(StubSupabase.rows("note_pages").filter { ($0["note_id"] as? String)?.lowercased() == id.uuidString.lowercased() }.count == 1)
        await finish()
    }

    @Test func anAppFromAnotherDeviceOpensOnceItsFilesAreHere() async throws {
        let sealer = try #require(Wire.sealer)
        let id = UUID(), broken = UUID()
        let wad = Self.random(200_000)
        let hash = sealer.blobName(wad)
        // Another device (or the AI) sent the file, then the app.
        let packed = try #require(Data(base64Encoded: NotePageProject.pack(wad)))
        StubSupabase.insert("note_app_blobs", ["hash": hash, "blob_ct": try #require(sealer.sealBlob(packed, hash: hash))])
        let html = NotePageProject(files: ["/index.html": "<p>game</p>"], blobs: ["/doom1.wad": .init(hash: hash, size: wad.count)]).stored
        let missing = String(repeating: "e", count: 64)
        let gone = NotePageProject(files: ["/index.html": "<p>gone</p>"], blobs: ["/x.bin": .init(hash: missing, size: 3)]).stored
        let now = StubSupabase.stamp(.now)
        for (note, text) in [(id, html), (broken, gone)] {
            StubSupabase.insert("note_pages", ["note_id": note.uuidString.lowercased(), "page_ct": try #require(sealer.seal(text, context: E2EE.page(note))),
                                               "client": "Claude", "updated_at": now, "server_updated_at": now])
        }
        #expect(!NotePageStore.shared.blobs.has(hash))
        await engine.sync()
        let page = try #require(NotePageStore.shared[id], "the app came down with its file")
        #expect(NotePageStore.shared.waiting[id] == nil)
        #expect(NotePageProject.parse(page.html)?.serve("/doom1.wad", blobs: NotePageStore.shared.blobs)?.data == wad)
        // One naming a file the server doesn't have either still arrives (it then fails to open
        // here, and the version before it runs), rather than waiting forever.
        #expect(NotePageStore.shared[broken] != nil)
        #expect(NotePageStore.shared.waiting[broken] == nil)
        await finish()
    }
}
}
