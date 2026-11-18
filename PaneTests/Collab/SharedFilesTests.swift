import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// Files and photos in shared notes (SharedFiles, 20261118130000_shared_note_files.sql): a couple
/// shares a recipe with a photo. Whoever can edit adds a file; everyone in the note sees and opens
/// it, offline once fetched; a note with files can be shared; a new key seals the file keys again;
/// leaving or stopping sharing never loses the owner's files. Two or more accounts, each on a
/// device of its own with its own file folder, against the in-memory server. Offscreen.
@MainActor
@Suite struct SharedFilesTests {
    let server = MemoryCollabServer()

    struct Device {
        let id: UUID
        let store: CollabStore
        let context: ModelContext
        let container: ModelContainer
        let root: URL
        @MainActor var files: SharedFiles { store.library!.files }
    }

    private func device(_ user: UUID, name: String) throws -> Device {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let dataKey = SymmetricKey(size: .bits256)
        let store = CollabStore(name: name, transport: server.transport(for: user), dataKey: { dataKey }, book: CollabKeyBook(account: user, defaults: TestDefaults()))
        store.context = container.mainContext
        let root = FileManager.default.temporaryDirectory.appending(path: "shared-files-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        store.library!.files.root = root
        store.library!.files.lookEvery = 0
        return Device(id: user, store: store, context: container.mainContext, container: container, root: root)
    }

    /// A photo of your own, on this device (as dropping or pasting one makes it).
    private func photo(_ d: Device, _ name: String, bytes: Data) throws -> Pane.Attachment {
        let a = Pane.Attachment(filename: name, contentType: "public.jpeg", size: Int64(bytes.count))
        let url = FileStore.url(for: a.id, filename: name, in: d.root)
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try bytes.write(to: url)
        d.context.insert(a)
        return a
    }

    private func bytes(_ d: Device, _ a: Pane.Attachment) -> Data? { try? Data(contentsOf: FileStore.url(for: a.id, filename: a.filename, in: d.root)) }

    private func session(_ d: Device, _ note: Note) throws -> CollabSession {
        let id = d.context.pointer(forShared: note.id)?.id ?? note.id
        return try #require(d.store.session(for: id))
    }

    /// Emil shares `note` with an Edit link (or a View link); `name` opens it and joins.
    private func join(_ emil: Device, _ note: Note, _ name: String, view: Bool = false) async throws -> Device {
        let id = server.account(name)
        let d = try device(id, name: name)
        if view { try await emil.store.setAccess(.view, for: note) }
        let url = try #require(emil.store.linkURL(note))
        #expect(await d.store.join(url).worked)
        return d
    }

    private func emilShares(_ body: String, before: ((Device, Note) throws -> Void)? = nil) async throws -> (Device, Note) {
        let emil = try device(server.account("Emil"), name: "Emil")
        let note = Note(body: body)
        emil.context.insert(note)
        try before?(emil, note)
        try await emil.store.setAccess(.edit, for: note)
        return (emil, note)
    }

    /// Waits until `d` has the shared note's file `id` placed (its text can arrive before the file's row).
    private func placed(_ d: Device, _ note: Note, _ id: UUID) async throws -> Pane.Attachment {
        let s = try session(d, note)
        await server.eventually {
            if d.context.attachment(id) == nil { d.files.follow(s) }
            return d.context.attachment(id) != nil
        }
        await d.files.settled()
        return try #require(d.context.attachment(id))
    }

    static let lasagne = Data("lasagne photo bytes, layer upon layer".utf8)

    @Test func aPhotoEmilAddsToASharedRecipeOpensForSaraAndStaysOffline() async throws {
        let (emil, note) = try await emilShares("Lasagne\n\nLayers of pasta.\n")
        let sara = try await join(emil, note, "Sara")
        let mine = try session(emil, note)
        let pic = try photo(emil, "lasagne.jpg", bytes: Self.lasagne)
        mine.local(mine.text + pic.markdown + "\n", selection: nil)
        await server.eventually { server.noteFiles[note.id]?[pic.id] != nil }
        await emil.files.settled()
        // Uploaded once, sealed: nothing of the photo or its name reaches the server.
        #expect(server.blobCount(note.id) == 1)
        #expect(!server.everythingStored.contains("lasagne photo") && !server.everythingStored.contains("lasagne.jpg"))
        #expect(server.noteFiles[note.id]?[pic.id]?.added_by == emil.id)
        // Emil's photo is still his own file, as before.
        #expect(pic.sharedNoteID == nil)

        let hers = try await placed(sara, note, pic.id)
        #expect(hers.sharedNoteID == note.id && hers.filename == "lasagne.jpg" && hers.isImage && hers.uploaded && !hers.dirty)
        #expect(sara.files.arrived > 0)
        #expect(bytes(sara, hers) == nil, "the bytes come when it's opened")
        #expect(await sara.files.download(hers))
        #expect(bytes(sara, hers) == Self.lasagne)
        // On the plane: still there.
        server.offline = true
        defer { server.offline = false }
        #expect(sara.files.isHere(hers) && bytes(sara, hers) == Self.lasagne)
    }

    @Test func aNoteWithFilesCanBeSharedAndItsFilesOpenForEveryone() async throws {
        var pdf: Pane.Attachment!
        let menu = Data("%PDF-1.4 dinner menu".utf8)
        let (emil, note) = try await emilShares("Dinner\n") { emil, note in
            pdf = try self.photo(emil, "menu.pdf", bytes: menu)
            pdf.contentType = "com.adobe.pdf"
            note.body += pdf.markdown + "\n"
        }
        await server.eventually { server.noteFiles[note.id]?[pdf.id] != nil }
        let sara = try await join(emil, note, "Sara")
        let hers = try await placed(sara, note, pdf.id)
        #expect(hers.filename == "menu.pdf" && !hers.isImage)
        #expect(await sara.files.download(hers))
        #expect(bytes(sara, hers) == menu)
        // Emil's file stays his own file.
        #expect(emil.context.attachment(pdf.id)?.sharedNoteID == nil)
    }

    @Test func saraAddsAPhotoAndEmilSeesItAViewerToo() async throws {
        let (emil, note) = try await emilShares("Lasagne\n")
        let sara = try await join(emil, note, "Sara")
        let jonas = try await join(emil, note, "Jonas", view: true)
        let theirs = try session(sara, note)
        let pic = try photo(sara, "from-sara.jpg", bytes: Self.lasagne)
        theirs.local(theirs.text + pic.markdown + "\n", selection: nil)
        await server.eventually { server.noteFiles[note.id]?[pic.id] != nil }
        #expect(server.noteFiles[note.id]?[pic.id]?.added_by == sara.id)
        // Her photo stays in her own files too.
        #expect(pic.sharedNoteID == nil)
        for d in [emil, jonas] {
            let a = try await placed(d, note, pic.id)
            #expect(a.sharedNoteID == note.id)
            #expect(await d.files.download(a))
            #expect(bytes(d, a) == Self.lasagne)
        }
        // Jonas can only view: no file goes in from him, and the server would refuse one.
        #expect(try session(jonas, note).isViewOnly)
        await #expect(throws: (any Error).self) {
            try await server.transport(for: jonas.id).uploadNoteFile(owner: emil.id, note: note.id, blob: UUID(), data: Data([1]))
        }
    }

    @Test func removingSomeoneSealsTheFileKeysAgainAndANewMemberOpensThem() async throws {
        let (emil, note) = try await emilShares("Lasagne\n")
        let sara = try await join(emil, note, "Sara")
        let jonas = try await join(emil, note, "Jonas")
        let mine = try session(emil, note)
        let pic = try photo(emil, "lasagne.jpg", bytes: Self.lasagne)
        mine.local(mine.text + pic.markdown + "\n", selection: nil)
        await server.eventually { server.noteFiles[note.id]?[pic.id] != nil }
        let his = try await placed(jonas, note, pic.id)
        #expect(await jonas.files.download(his))

        try await emil.store.remove(jonas.id, from: note)
        #expect(mine.epoch == 2)
        #expect(server.noteFiles[note.id]?[pic.id]?.epoch == 2, "sealed again under the new key")
        // A file added now is sealed under the new key.
        let second = try photo(emil, "plated.jpg", bytes: Data("plated".utf8))
        mine.local(mine.text + second.markdown + "\n", selection: nil)
        await server.eventually { server.noteFiles[note.id]?[second.id] != nil }
        #expect(server.noteFiles[note.id]?[second.id]?.epoch == 2)
        // Jonas keeps what he had fetched; he can't fetch anything more.
        #expect(bytes(jonas, his) == Self.lasagne)
        await #expect(throws: (any Error).self) {
            try await server.transport(for: jonas.id).downloadNoteFile(owner: emil.id, note: note.id, blob: server.noteFiles[note.id]![second.id]!.blob)
        }
        // Someone joining now holds only the new key, and opens both.
        let ola = try await join(emil, note, "Ola")
        for id in [pic.id, second.id] {
            let a = try await placed(ola, note, id)
            #expect(await ola.files.download(a))
        }
        _ = sara
    }

    @Test func stoppingSharingKeepsEveryFileForTheOwner() async throws {
        let (emil, note) = try await emilShares("Lasagne\n")
        let sara = try await join(emil, note, "Sara")
        let mine = try session(emil, note)
        let own = try photo(emil, "emil.jpg", bytes: Data("emil's".utf8))
        mine.local(mine.text + own.markdown + "\n", selection: nil)
        await server.eventually { server.noteFiles[note.id]?[own.id] != nil }
        let theirs = try session(sara, note)
        await server.eventually { theirs.text.contains(own.id.uuidString.lowercased()) }
        let hers = try photo(sara, "sara.jpg", bytes: Self.lasagne)
        theirs.local(theirs.text + hers.markdown + "\n", selection: nil)
        await server.eventually { server.noteFiles[note.id]?[hers.id] != nil && mine.text.contains(hers.id.uuidString.lowercased()) }

        try await Wire.$testSealer.withValue(Sealer(key: .init(size: .bits256), user: emil.id)) {
            try await emil.store.library!.unshare(note)
        }
        #expect(!note.isShared)
        // Sara's photo is Emil's own file now: a new id (hers is still her own), the text links to
        // it, its bytes are here, and it goes up with his files.
        let ids = SharedFiles.fileIDs(in: note.body)
        #expect(ids.count == 2 && ids.contains(own.id) && !ids.contains(hers.id))
        let kept = try #require(ids.first { $0 != own.id }.flatMap { emil.context.attachment($0) })
        #expect(kept.sharedNoteID == nil && kept.filename == "sara.jpg" && !kept.uploaded && kept.dirty)
        #expect(bytes(emil, kept) == Self.lasagne)
        #expect(emil.context.attachment(hers.id) == nil, "the note's copy here went")
        #expect(emil.context.attachment(own.id)?.sharedNoteID == nil)
        // The note's copies went from the server.
        #expect(server.noteFiles[note.id] == nil && server.blobCount(note.id) == 0)
    }

    @Test func sharingDoesntStopWhileAFileCantBeFetched() async throws {
        let (emil, note) = try await emilShares("Lasagne\n")
        let sara = try await join(emil, note, "Sara")
        let theirs = try session(sara, note)
        let hers = try photo(sara, "sara.jpg", bytes: Self.lasagne)
        theirs.local(theirs.text + hers.markdown + "\n", selection: nil)
        let mine = try session(emil, note)
        await server.eventually { server.noteFiles[note.id]?[hers.id] != nil && mine.text.contains(hers.id.uuidString.lowercased()) }
        server.dropBlobs(note.id)
        await #expect(throws: SharedFiles.Problem.notHere) {
            try await Wire.$testSealer.withValue(Sealer(key: .init(size: .bits256), user: emil.id)) { try await emil.store.library!.unshare(note) }
        }
        #expect(note.isShared && server.noteFiles[note.id]?[hers.id] != nil)
    }

    @Test func leavingTakesTheFilesFromYouNotFromTheOwner() async throws {
        let (emil, note) = try await emilShares("Lasagne\n")
        let sara = try await join(emil, note, "Sara")
        let mine = try session(emil, note)
        let pic = try photo(emil, "lasagne.jpg", bytes: Self.lasagne)
        mine.local(mine.text + pic.markdown + "\n", selection: nil)
        await server.eventually { server.noteFiles[note.id]?[pic.id] != nil }
        let hers = try await placed(sara, note, pic.id)
        #expect(await sara.files.download(hers))
        let pointer = try #require(sara.context.pointer(forShared: note.id))
        try await sara.store.leave(pointer)
        sara.files.sweep(asking: false)
        #expect(sara.context.attachment(pic.id) == nil && !FileManager.default.fileExists(atPath: FileStore.url(for: pic.id, filename: "lasagne.jpg", in: sara.root).path))
        // Emil's file, and the note's copy, are untouched.
        #expect(emil.context.attachment(pic.id) != nil && bytes(emil, pic) == Self.lasagne)
        #expect(server.noteFiles[note.id]?[pic.id] != nil && server.blobCount(note.id) == 1)
    }

    /// Keep a Copy after losing access: the files you had here go with the copy, as files of your
    /// own (new ids); ones never fetched stay links to nothing. A place nobody's note shows goes.
    @Test func keepACopyKeepsTheFilesYouHad() throws {
        let d = try device(UUID(), name: "Sara")
        let shared = UUID()
        func place(_ name: String, here: Bool) throws -> Pane.Attachment {
            let a = Pane.Attachment(filename: name, contentType: "public.jpeg", size: 3)
            a.sharedNoteID = shared
            a.uploaded = true
            a.dirty = false
            d.context.insert(a)
            if here {
                let url = FileStore.url(for: a.id, filename: name, in: d.root)
                try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
                try Data("abc".utf8).write(to: url)
            }
            return a
        }
        let fetched = try place("fetched.jpg", here: true), never = try place("never.jpg", here: false), unseen = try place("unseen.jpg", here: true)
        let copy = "Lasagne\n\(fetched.markdown)\n\(never.markdown)\n"
        let removal = SharedRemoval(id: UUID(), title: "Lasagne", owner: "Emil", copy: copy, folder: nil)
        let note = try #require(SharedRemovals.shared.keep(removal, in: d.context, files: d.root))
        let ids = SharedFiles.fileIDs(in: note.body)
        #expect(ids.count == 2 && ids.contains(never.id) && !ids.contains(fetched.id))
        let kept = try #require(ids.first { $0 != never.id }.flatMap { d.context.attachment($0) })
        #expect(kept.sharedNoteID == nil && kept.filename == "fetched.jpg" && kept.dirty && !kept.uploaded)
        #expect(FileManager.default.fileExists(atPath: FileStore.url(for: kept.id, filename: kept.filename, in: d.root).path))
        // The note it came from isn't in the library: its places go, except what the copy shows.
        d.files.sweep(asking: false)
        #expect(d.context.attachment(unseen.id) == nil && d.context.attachment(fetched.id) == nil)
        #expect(d.context.attachment(never.id) != nil, "the copy still links to it")
        #expect(d.context.attachment(kept.id) != nil)
    }

    /// The formats: a file key opens only with its note key, for its note, epoch and file; its
    /// bytes only with its own key, for its note and file.
    @Test func aFileKeyAndBytesOpenOnlyWhereTheyBelong() throws {
        let nk = SymmetricKey(size: .bits256), other = SymmetricKey(size: .bits256)
        let note = UUID(), file = UUID()
        let meta = SharedFileCrypto.Meta(key: E2EE.bytes(SymmetricKey(size: .bits256)).base64EncodedString(), name: "a.jpg", type: "public.jpeg", size: 3)
        let ct = try SharedFileCrypto.sealKey(meta, nk: nk, note: note, epoch: 3, file: file)
        #expect(ct.hasPrefix("amb3x.3.") && !ct.contains("a.jpg"))
        #expect(SharedFileCrypto.epoch(of: ct) == 3)
        #expect(try SharedFileCrypto.openKey(ct, nk: nk, note: note, file: file) == meta)
        #expect(throws: SharedFileCrypto.Failure.wrongKey) { try SharedFileCrypto.openKey(ct, nk: other, note: note, file: file) }
        #expect(throws: SharedFileCrypto.Failure.wrongKey) { try SharedFileCrypto.openKey(ct, nk: nk, note: UUID(), file: file) }
        #expect(throws: SharedFileCrypto.Failure.wrongKey) { try SharedFileCrypto.openKey(ct, nk: nk, note: note, file: UUID()) }
        let moved = ct.replacingOccurrences(of: "amb3x.3.", with: "amb3x.2.")
        #expect(throws: SharedFileCrypto.Failure.wrongKey) { try SharedFileCrypto.openKey(moved, nk: nk, note: note, file: file) }
        let fk = try SharedFileCrypto.fileKey(meta)
        let sealed = try SharedFileCrypto.sealBytes(Data("abc".utf8), key: fk, note: note, file: file)
        #expect(sealed.prefix(5) == Data("amb3b".utf8))
        #expect(try SharedFileCrypto.openBytes(sealed, key: fk, note: note, file: file) == Data("abc".utf8))
        #expect(throws: SharedFileCrypto.Failure.wrongKey) { try SharedFileCrypto.openBytes(sealed, key: fk, note: note, file: UUID()) }
        #expect(SharedFiles.relink("![a](pane-file:\(file.uuidString.lowercased())) [b](pane-file:\(note.uuidString))", [file: note])
                == "![a](pane-file:\(note.uuidString.lowercased())) [b](pane-file:\(note.uuidString))")
    }

    /// Someone else's file in your shared note is never sent as yours (it isn't), nor marked to go
    /// up again with your library.
    @Test func someoneElsesFileNeverGoesUpAsYours() throws {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = container.mainContext
        let mine = try FileStore.importData(Data("mine".utf8), filename: "mine.txt", type: .plainText)
        let theirs = try FileStore.importData(Data("theirs".utf8), filename: "theirs.txt", type: .plainText)
        defer { FileStore.remove(mine); FileStore.remove(theirs) }
        theirs.sharedNoteID = UUID()
        theirs.uploaded = true
        theirs.dirty = false
        mine.uploaded = true
        mine.dirty = false
        context.insert(mine)
        context.insert(theirs)
        SyncEngine.markAllForUpload(context)
        #expect(!mine.uploaded && mine.dirty)
        #expect(theirs.uploaded && !theirs.dirty)
    }
}
