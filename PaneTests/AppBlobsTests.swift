import CryptoKit
import Foundation
import Testing
@testable import Pane

/// A note app's binary files kept once on the device (AppBlobs), and its versions naming them
/// (NotePageProject.blobs): what note-pages.json and the files folder hold over saves, restores
/// and older apps (2026-11-15).
@MainActor @Suite struct AppBlobsTests {
    let sealer = Sealer(key: SymmetricKey(size: .bits256), user: UUID())
    let dir = FileManager.default.temporaryDirectory.appending(path: "app-blobs-\(UUID().uuidString)")
    let blobs: AppBlobs
    let store: NotePageStore
    let id = UUID()

    init() {
        blobs = AppBlobs(folder: dir.appending(path: "app-files"))
        store = NotePageStore(file: dir.appending(path: "note-pages.json"), blobs: blobs)
    }

    static func random(_ n: Int) -> Data { Data((0 ..< n).map { _ in UInt8.random(in: 0 ... 255) }) }
    let wasm = random(4_000)
    let wad = random(400_000)

    func game(main: String = "start()", wasm: Data? = nil) -> NotePageStore.Page {
        let p = NotePageProject(files: ["/index.html": "<canvas></canvas>", "/main.js": main],
                                binary: ["/doom.wasm": NotePageProject.pack(wasm ?? self.wasm), "/doom1.wad": NotePageProject.pack(wad)])
        return .init(html: p.stored, by: "You", at: .now)
    }

    func served(_ path: String, _ page: NotePageStore.Page?) -> Data? {
        page.flatMap { NotePageProject.parse($0.html) }?.serve(path, blobs: blobs)?.data
    }

    var pagesFileSize: Int { (try? Data(contentsOf: dir.appending(path: "note-pages.json")).count) ?? 0 }

    @Test func savingTwiceWithOneChangedFileStoresOneNewFile() {
        defer { try? FileManager.default.removeItem(at: dir) }
        store.setHere(id, game(), sealer: sealer)
        #expect(blobs.all.count == 2)
        let page = store[id]!
        #expect(page.html.contains("\"hash\"") && !page.html.contains(NotePageProject.pack(wad)), "the app names its files")
        #expect(served("/doom1.wad", page) == wad)
        // A text change: no file stored again.
        store.setHere(id, game(main: "start(); fast()"), sealer: sealer)
        #expect(blobs.all.count == 2)
        // A new engine: one more file; the old one stays for the version that names it.
        store.setHere(id, game(main: "start(); fast()", wasm: Self.random(4_000)), sealer: sealer)
        #expect(blobs.all.count == 3)
        #expect(store.history[id]?.count == 2)
        // Three versions of a 400 KB game: the file once, and three small texts.
        #expect(pagesFileSize < 10_000, "note-pages.json is \(pagesFileSize) bytes")
    }

    @Test func restoringAnOldVersionGivesBackItsExactFiles() {
        defer { try? FileManager.default.removeItem(at: dir) }
        store.setHere(id, game(), sealer: sealer)
        let engine2 = Self.random(4_000)
        store.setHere(id, game(wasm: engine2), sealer: sealer)
        #expect(served("/doom.wasm", store.live(id)) == engine2)
        store.restorePrevious(id)
        #expect(served("/doom.wasm", store.live(id)) == wasm)
        #expect(served("/doom1.wad", store.live(id)) == wad)
        // And forward again: nothing was lost on the way.
        store.restorePrevious(id)
        #expect(served("/doom.wasm", store.live(id)) == engine2)
        // Kept across a launch.
        let again = NotePageStore(file: dir.appending(path: "note-pages.json"), blobs: AppBlobs(folder: dir.appending(path: "app-files")))
        #expect(again[id] == store[id])
        #expect(again.live(id).flatMap { NotePageProject.parse($0.html) }?.serve("/doom.wasm", blobs: again.blobs)?.data == engine2)
    }

    @Test func anOldFormatVersionStillOpens() {
        defer { try? FileManager.default.removeItem(at: dir) }
        // A version from before files were kept apart (its bytes inside its text), as a device kept it.
        let old = game()
        store[id] = old
        #expect(blobs.all.isEmpty)
        #expect(served("/doom1.wad", store.live(id)) == wad)
        // A newer one from here keeps its files apart; the old version is still whole.
        store.setHere(id, game(main: "start(); fast()"), sealer: sealer)
        #expect(blobs.all.count == 2)
        store.restorePrevious(id)
        #expect(store[id] == old)
        #expect(served("/doom1.wad", store.live(id)) == wad)
        #expect(served("/doom.wasm", store.live(id)) == wasm)
        // Without the account's key (signed out) an app keeps its bytes inside, as before.
        store.setHere(id, game(main: "offline()"), sealer: nil)
        #expect(store[id]!.html.contains(NotePageProject.pack(wad)))
    }

    @Test func aFileNoVersionNamesAnyMoreGoes() {
        defer { try? FileManager.default.removeItem(at: dir) }
        store.setHere(id, game(), sealer: sealer)
        let first = NotePageProject.blobNames(in: store[id]!.html)
        // Eleven new engines: the first leaves the last 10 versions, and its file goes with it.
        for _ in 0 ... NotePageStore.keep { store.setHere(id, game(wasm: Self.random(4_000)), sealer: sealer) }
        #expect(store.history[id]?.count == NotePageStore.keep)
        let named = store.namedBlobs
        #expect(blobs.all == named)
        #expect(first.filter { !named.contains($0) }.count == 1, "the first engine went; the WAD every version names stayed")
        store.forgetAll()
        #expect(blobs.all.isEmpty)
    }

    @Test func anAppFromTheServerWaitsForItsFiles() async throws {
        defer { try? FileManager.default.removeItem(at: dir) }
        let hash = sealer.blobName(wad)
        let html = NotePageProject(files: ["/index.html": "<p>"], blobs: ["/doom1.wad": .init(hash: hash, size: wad.count)]).stored
        let row = NotePageDTO(note_id: id, page_ct: sealer.seal(html, context: E2EE.page(id)), client: "Claude", updated_at: .now)
        try await Wire.$testSealer.withValue(sealer) {
            store.take(row)
            #expect(store[id] == nil, "never shown half there")
            #expect(store.wantedBlobs == [hash])
            store.blobsArrived()
            #expect(store[id] == nil)
            blobs.put(hash, packed: try #require(Data(base64Encoded: NotePageProject.pack(wad))))
            store.blobsArrived()
            #expect(store[id]?.html == html)
            #expect(store.waiting.isEmpty)
            #expect(served("/doom1.wad", store.live(id)) == wad)
        }
    }

    @Test func aProjectNamingItsFilesReadsBackTheSame() throws {
        let p = NotePageProject(files: ["/index.html": "<p>"], binary: ["/a.png": NotePageProject.pack(Data([1, 2, 3]))],
                                blobs: ["/doom1.wad": .init(hash: String(repeating: "a", count: 64), size: 10)])
        #expect(NotePageProject.parse(p.stored) == p)
        #expect(NotePageProject.blobNames(in: p.stored) == [String(repeating: "a", count: 64)])
        // A name that isn't one, or a file named twice, isn't an app.
        var bad = p
        bad.blobs["/x.bin"] = .init(hash: "../etc", size: 1)
        #expect(NotePageProject.parse(bad.stored) == nil)
        bad = p
        bad.blobs["/a.png"] = .init(hash: String(repeating: "b", count: 64), size: 1)
        #expect(bad.problem != nil)
        // A file this device doesn't have isn't served (the app then fails here and the one before runs).
        #expect(p.serve("/doom1.wad", blobs: AppBlobs(folder: nil)) == nil)
    }
}
