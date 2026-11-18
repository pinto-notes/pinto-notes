import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// Shared folders (Pane/Collab/FolderSharing.swift, design section 8): Maja shares her Recipes
/// folder with Jonas by its link. Two accounts, two devices, CollabStore over the in-memory server;
/// offscreen, no network.
@MainActor
@Suite struct SharedFoldersTests {
    let server = MemoryCollabServer()

    struct Device {
        let id: UUID
        let store: CollabStore
        let context: ModelContext
        let container: ModelContainer
        @MainActor var folders: FolderSharing { store.folders! }
    }

    private func device(_ user: UUID, name: String) throws -> Device {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, SharedDocument.self,
                                           configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let key = SymmetricKey(size: .bits256)
        let store = CollabStore(name: name, transport: server.transport(for: user), dataKey: { key }, book: CollabKeyBook(account: user, defaults: TestDefaults()))
        store.folderDefaults = nil
        store.context = container.mainContext
        let root = FileManager.default.temporaryDirectory.appending(path: "shared-folders-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        store.library!.files.root = root
        store.library!.files.lookEvery = 0
        return Device(id: user, store: store, context: container.mainContext, container: container)
    }

    private func note(_ body: String, in folder: Folder, on d: Device) -> Note {
        let n = Note(body: body, folder: folder)
        d.context.insert(n)
        return n
    }

    private func notes(in folder: Folder) -> [String] {
        folder.notes.filter { $0.deletedAt == nil && $0.trashedAt == nil }.map(\.title).sorted()
    }

    /// A look on each device, as the half-minute check does.
    private func look(_ devices: Device...) async {
        for d in devices { await d.store.checkMemberships() }
        await server.settle()
    }

    /// Maja's Recipes (two notes, and Desserts with one), shared with Jonas by an Edit link.
    private func recipes(role: ShareState.Access = .edit) async throws -> (maja: Device, jonas: Device, recipes: Folder, desserts: Folder) {
        let maja = try device(server.account("Maja"), name: "Maja"), jonas = try device(server.account("Jonas"), name: "Jonas")
        let recipes = Folder(name: "Recipes"), desserts = Folder(name: "Desserts", parent: recipes)
        maja.context.insert(recipes)
        maja.context.insert(desserts)
        _ = note("Pancakes\nFlour, milk, eggs", in: recipes, on: maja)
        _ = note("Lentil soup\nRed lentils, cumin", in: recipes, on: maja)
        _ = note("Tiramisu\nMascarpone", in: desserts, on: maja)
        try await maja.folders.setAccess(role, for: recipes)
        let url = try #require(maja.folders.linkURL(recipes.id))
        let outcome = await jonas.store.join(url)
        guard case .joinedFolder = outcome else { Issue.record("joined: \(outcome)"); throw CancellationError() }
        await look(maja, jonas)
        return (maja, jonas, recipes, desserts)
    }

    private func folder(_ name: String, on d: Device) -> Folder? {
        d.context.allFolders().first { $0.name == name }
    }

    // MARK: Formats

    @Test func folderBoxesOpenOnlyWithTheirKeyAndPlace() throws {
        let fk = SymmetricKey(size: .bits256), root = UUID(), sub = UUID(), note = UUID(), nk = SymmetricKey(size: .bits256)
        let name = try CollabCrypto.sealFolderName("Desserts", fk: fk, root: root, epoch: 2, folder: sub)
        #expect(name.hasPrefix("amb3f.2."))
        #expect(try CollabCrypto.openFolderName(name, fk: fk, root: root, folder: sub) == "Desserts")
        // Moved onto another folder's row, or opened with another key, it doesn't open.
        #expect(throws: CollabCrypto.Failure.wrongKey) { try CollabCrypto.openFolderName(name, fk: fk, root: root, folder: UUID()) }
        #expect(throws: CollabCrypto.Failure.wrongKey) { try CollabCrypto.openFolderName(name, fk: SymmetricKey(size: .bits256), root: root, folder: sub) }

        let wrap = try CollabCrypto.sealNoteKeyUnderFolder(nk, fk: fk, root: root, epoch: 2, note: note, noteEpoch: 3)
        #expect(wrap.hasPrefix("amb3w.2.3."))
        let opened = try CollabCrypto.openNoteKeyUnderFolder(wrap, fk: fk, root: root, note: note)
        #expect(E2EE.bytes(opened.nk) == E2EE.bytes(nk) && opened.noteEpoch == 3 && opened.folderEpoch == 2)
        #expect(throws: CollabCrypto.Failure.wrongKey) { try CollabCrypto.openNoteKeyUnderFolder(wrap, fk: fk, root: root, note: UUID()) }

        let dk = SymmetricKey(size: .bits256)
        let selfWrap = try CollabCrypto.folderSelfWrap(fk, dataKey: dk, root: root, epoch: 2)
        #expect(E2EE.bytes(try CollabCrypto.openFolderSelfWrap(selfWrap, dataKey: dk, root: root, epoch: 2)) == E2EE.bytes(fk))
        // A note key's context never opens a folder key's box.
        #expect(throws: CollabCrypto.Failure.wrongKey) { try CollabCrypto.openSelfWrap(selfWrap, dataKey: dk, note: root, epoch: 2) }
    }

    @Test func aMembersFolderHasAnIdOfItsOwnTheSameOnEachDevice() {
        let dk = SymmetricKey(size: .bits256), shared = UUID()
        #expect(SharedFolders.folderID(for: shared, dataKey: dk) == SharedFolders.folderID(for: shared, dataKey: dk))
        #expect(SharedFolders.folderID(for: shared, dataKey: dk) != shared)
        #expect(SharedFolders.folderID(for: shared, dataKey: dk) != SharedNotes.noteID(for: shared, dataKey: dk))
    }

    // MARK: Joining

    @Test func joiningAFoldersLinkBringsItsFoldersAndNotes() async throws {
        let (maja, jonas, _, _) = try await recipes()
        let theirs = try #require(folder("Recipes", on: jonas))
        #expect(theirs.parent == nil)
        #expect(theirs.id != maja.folders.roots.keys.first)
        #expect(notes(in: theirs) == ["Lentil soup", "Pancakes"])
        let desserts = try #require(theirs.liveChildren.first { $0.name == "Desserts" })
        #expect(notes(in: desserts) == ["Tiramisu"])
        // Each is a shared note Jonas can open, with Maja's text.
        let pancakes = try #require(theirs.notes.first { $0.title == "Pancakes" })
        #expect(pancakes.isShared)
        #expect(jonas.store.sessions[pancakes.id]?.text == "Pancakes\nFlour, milk, eggs")
        // Nothing reached the server readable.
        #expect(!server.everythingStored.contains("Desserts") && !server.everythingStored.contains("Pancakes"))
    }

    @Test func bothEditANoteInTheFolder() async throws {
        let (maja, jonas, recipes, _) = try await recipes()
        let mine = try #require(recipes.notes.first { $0.title == "Pancakes" })
        let theirs = try #require(folder("Recipes", on: jonas)?.notes.first { $0.title == "Pancakes" })
        let a = try #require(maja.store.sessions[mine.id]), b = try #require(jonas.store.sessions[theirs.id])
        b.local(b.text + "\nA pinch of salt", selection: nil)
        a.local("Pancakes (Sunday)\nFlour, milk, eggs", selection: nil)
        await server.eventually { a.text == b.text && a.text.contains("salt") && a.text.contains("Sunday") }
        #expect(a.text == "Pancakes (Sunday)\nFlour, milk, eggs\nA pinch of salt")
    }

    // MARK: What goes in

    @Test func aNoteMadeInTheFolderIsSharedWithEveryone() async throws {
        let (maja, jonas, recipes, _) = try await recipes()
        let theirs = try #require(folder("Recipes", on: jonas))
        _ = note("Shakshuka\nEggs, tomatoes", in: theirs, on: jonas)
        await look(jonas, maja)
        #expect(notes(in: recipes) == ["Lentil soup", "Pancakes", "Shakshuka"])
        let arrived = try #require(recipes.notes.first { $0.title == "Shakshuka" })
        // It's Jonas's note, shared into Maja's folder.
        #expect(arrived.sharedNoteID != nil && arrived.sharedNoteID != arrived.id)
    }

    @Test func aSubfolderMadeAndRenamedReachesEveryone() async throws {
        let (maja, jonas, recipes, _) = try await recipes()
        let breakfast = Folder(name: "Breakfast", parent: recipes)
        maja.context.insert(breakfast)
        await look(maja, jonas)
        let theirs = try #require(folder("Recipes", on: jonas))
        let b = try #require(theirs.liveChildren.first { $0.name == "Breakfast" })
        b.name = "Brunch"
        b.touch()
        await look(jonas, maja)
        #expect(breakfast.name == "Brunch")
    }

    @Test func aNoteMovedBetweenItsFoldersMovesForEveryone() async throws {
        let (maja, jonas, recipes, desserts) = try await recipes()
        let pancakes = try #require(recipes.notes.first { $0.title == "Pancakes" })
        pancakes.folder = desserts
        pancakes.touch()
        await look(maja, jonas)
        let theirs = try #require(folder("Desserts", on: jonas))
        #expect(notes(in: theirs) == ["Pancakes", "Tiramisu"])
    }

    @Test func aPhotoInAFoldersNoteOpensForEveryoneInTheFolder() async throws {
        let maja = try device(server.account("Maja"), name: "Maja"), jonas = try device(server.account("Jonas"), name: "Jonas")
        let recipes = Folder(name: "Recipes")
        maja.context.insert(recipes)
        // A recipe with a photo, before the folder is shared.
        let bytes = Data("pancake photo bytes".utf8)
        let pic = Pane.Attachment(filename: "pancakes.jpg", contentType: "public.jpeg", size: Int64(bytes.count))
        let url = FileStore.url(for: pic.id, filename: pic.filename, in: maja.store.library!.files.root)
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try bytes.write(to: url)
        maja.context.insert(pic)
        let pancakes = note("Pancakes\n" + pic.markdown + "\n", in: recipes, on: maja)
        try await maja.folders.setAccess(.edit, for: recipes)
        // Shared into the folder, photo and all.
        #expect(pancakes.isShared)
        await maja.store.library!.files.settled()
        _ = await jonas.store.join(try #require(maja.folders.linkURL(recipes.id)))
        let his = try #require(folder("Recipes", on: jonas)?.notes.first { $0.title == "Pancakes" })
        let session = try #require(jonas.store.sessions[his.id])
        await server.eventually {
            if jonas.context.attachment(pic.id) == nil { jonas.store.library!.files.follow(session) }
            return jonas.context.attachment(pic.id) != nil
        }
        let theirs = try #require(jonas.context.attachment(pic.id))
        #expect(await jonas.store.library!.files.download(theirs))
        #expect(try Data(contentsOf: FileStore.url(for: theirs.id, filename: theirs.filename, in: jonas.store.library!.files.root)) == bytes)
        #expect(!server.everythingStored.contains("pancake photo"))

        // Maja stops sharing: the recipe is hers again, text and photo (on the Air it came back empty).
        let root = try #require(maja.folders.roots.keys.first)
        try await Wire.$testSealer.withValue(Sealer(key: .init(size: .bits256), user: maja.id)) {
            try await maja.folders.stopSharing(root)
        }
        await look(maja, jonas)
        #expect(pancakes.deletedAt == nil)
        #expect(pancakes.sharedNoteID == nil)
        #expect(pancakes.body.hasPrefix("Pancakes\n![") && pancakes.body.contains("pane-file:"))
        let kept = try #require(SharedFiles.fileIDs(in: pancakes.body).first.flatMap { maja.context.attachment($0) })
        #expect(try Data(contentsOf: FileStore.url(for: kept.id, filename: kept.filename, in: maja.store.library!.files.root)) == bytes)
    }

    // MARK: What comes out

    @Test func aNoteMovedOutLeavesTheFolderForEveryoneAndTheMoverKeepsACopy() async throws {
        let (maja, jonas, recipes, _) = try await recipes()
        let mine = Folder(name: "My recipes")
        jonas.context.insert(mine)
        let theirs = try #require(folder("Recipes", on: jonas))
        let soup = try #require(theirs.notes.first { $0.title == "Lentil soup" })
        soup.folder = mine
        soup.touch()
        await look(jonas, maja)
        // Jonas has a copy of his own in his folder, no longer shared.
        #expect(notes(in: mine) == ["Lentil soup"])
        #expect(mine.notes.first { $0.deletedAt == nil }?.isShared == false)
        #expect(notes(in: theirs) == ["Pancakes"])
        // Maja made it: she keeps it, out of the shared folder.
        #expect(notes(in: recipes) == ["Pancakes"])
        let hers = try #require(maja.context.everyNote().first { $0.title == "Lentil soup" && $0.deletedAt == nil })
        #expect(hers.folder?.id != recipes.id && hers.trashedAt == nil)
    }

    // MARK: People

    @Test func leavingTakesTheFolderAndKeepsYourOwnNotes() async throws {
        let (maja, jonas, recipes, _) = try await recipes()
        let theirs = try #require(folder("Recipes", on: jonas))
        _ = note("Shakshuka\nEggs", in: theirs, on: jonas)
        await look(jonas, maja)
        let root = try #require(maja.folders.roots.keys.first)
        try await jonas.folders.leave(root)
        await look(jonas, maja)
        // Jonas: Maja's notes are gone; his own note stays, in a folder of his with its name.
        let left = jonas.context.allFolders().filter { $0.name == "Recipes" }
        #expect(left.flatMap { notes(in: $0) } == ["Shakshuka"])
        #expect(jonas.context.everyNote().filter { $0.deletedAt == nil && $0.title == "Pancakes" }.isEmpty)
        // Maja: his note left with him, and the folder has a new key without him.
        #expect(notes(in: recipes) == ["Lentil soup", "Pancakes"])
        #expect(server.folders.memberships(maja.id).first?.epoch == 2)
        #expect(server.folders.memberships(jonas.id).isEmpty)
    }

    /// As on the Air: Jonas writes in a recipe, leaves (a new key), comes back by a new link, and
    /// then Maja stops sharing. Her recipes are hers again with every word.
    @Test func stoppingAfterSomeoneLeftAndCameBackKeepsTheOwnersText() async throws {
        let (maja, jonas, recipes, _) = try await recipes()
        let mine = try #require(recipes.notes.first { $0.title == "Pancakes" })
        let theirs = try #require(folder("Recipes", on: jonas)?.notes.first { $0.title == "Pancakes" })
        let a = try #require(maja.store.sessions[mine.id]), b = try #require(jonas.store.sessions[theirs.id])
        b.local(b.text + "\nA pinch of salt", selection: nil)
        a.local(a.text + "\nServe with berries", selection: nil)
        await server.eventually { a.text.contains("salt") && a.text.contains("berries") }
        let root = try #require(maja.folders.roots.keys.first)
        try await jonas.folders.leave(root)
        await look(jonas, maja)
        await look(maja)
        try await maja.folders.setAccess(.off, for: recipes)
        try await maja.folders.setAccess(.edit, for: recipes)
        _ = await jonas.store.join(try #require(maja.folders.linkURL(recipes.id)))
        await look(maja, jonas)
        #expect(folder("Recipes", on: jonas)?.notes.contains { $0.title == "Pancakes" } == true)
        try await Wire.$testSealer.withValue(Sealer(key: .init(size: .bits256), user: maja.id)) {
            try await maja.folders.stopSharing(root)
        }
        await look(maja, jonas)
        await look(maja, jonas)
        let kept = recipes.notes.filter { $0.deletedAt == nil }
        #expect(kept.map(\.title).sorted() == ["Lentil soup", "Pancakes"])
        let pancakes = kept.first { $0.title == "Pancakes" }
        #expect(pancakes?.sharedNoteID == nil)
        #expect(pancakes?.body.contains("A pinch of salt") == true && pancakes?.body.contains("Serve with berries") == true)
    }

    @Test func whoeverStaysKeepsTheFolderAfterItsNewKey() async throws {
        let (maja, jonas, recipes, _) = try await recipes()
        let ana = try device(server.account("Ana"), name: "Ana")
        let url = try #require(maja.folders.linkURL(recipes.id))
        _ = await ana.store.join(url)
        await look(maja, jonas, ana)
        let root = try #require(maja.folders.roots.keys.first)
        try await jonas.folders.leave(root)
        await look(maja, ana)
        await look(maja, ana)
        #expect(server.folders.memberships(ana.id).first?.epoch == 2)
        // A new subfolder, named under the new key, reaches Ana by its name.
        let breakfast = Folder(name: "Breakfast", parent: recipes)
        maja.context.insert(breakfast)
        await look(maja, ana)
        let hers = try #require(folder("Recipes", on: ana))
        #expect(Set(hers.liveChildren.map(\.name)) == ["Breakfast", "Desserts"])
        #expect(notes(in: hers) == ["Lentil soup", "Pancakes"])
    }

    @Test func removingSomeoneTakesTheFolderFromThemAndTellsThem() async throws {
        let (maja, jonas, _, _) = try await recipes()
        var told: [FolderRemoval] = []
        jonas.folders.onLost = { told.append($0) }
        let root = try #require(maja.folders.roots.keys.first)
        try await maja.folders.remove(jonas.id, from: root)
        await look(jonas)
        #expect(folder("Recipes", on: jonas) == nil)
        #expect(told.map(\.reason) == ["removed"])
        #expect(server.folders.memberships(maja.id).first?.epoch == 2)
        // The notes he was in through the folder are gone too.
        #expect(jonas.context.everyNote().filter { $0.deletedAt == nil }.isEmpty)
    }

    @Test func stoppingSharingTakesItFromEveryoneElseAndKeepsItForTheOwner() async throws {
        let (maja, jonas, recipes, _) = try await recipes()
        // Jonas wrote in it first: that stays in Maja's note too.
        let mine = try #require(recipes.notes.first { $0.title == "Pancakes" })
        let theirs = try #require(folder("Recipes", on: jonas)?.notes.first { $0.title == "Pancakes" })
        let a = try #require(maja.store.sessions[mine.id]), b = try #require(jonas.store.sessions[theirs.id])
        b.local(b.text + "\nA pinch of salt", selection: nil)
        await server.eventually { a.text.contains("salt") }
        let root = try #require(maja.folders.roots.keys.first)
        // Her notes' text is sealed for her own sync again (the app's account key).
        try await Wire.$testSealer.withValue(Sealer(key: .init(size: .bits256), user: maja.id)) {
            try await maja.folders.stopSharing(root)
        }
        await look(maja, jonas)
        #expect(folder("Recipes", on: jonas) == nil)
        #expect(notes(in: recipes) == ["Lentil soup", "Pancakes"])
        #expect(maja.folders.roots.isEmpty)
        // Ordinary notes again, with every word in them (on the Air, Pancakes came back empty).
        let kept = recipes.notes.filter { $0.deletedAt == nil }
        #expect(kept.allSatisfy { $0.sharedNoteID == nil })
        #expect(kept.first { $0.title == "Pancakes" }?.body == "Pancakes\nFlour, milk, eggs\nA pinch of salt")
        #expect(kept.first { $0.title == "Lentil soup" }?.body.hasPrefix("Lentil soup\n") == true)
    }

    @Test func aViewerCantAddNotesToTheFolder() async throws {
        let (maja, jonas, recipes, _) = try await recipes(role: .view)
        let theirs = try #require(folder("Recipes", on: jonas))
        _ = note("Shakshuka\nEggs", in: theirs, on: jonas)
        await look(jonas, maja)
        #expect(notes(in: recipes) == ["Lentil soup", "Pancakes"])
        #expect(!server.calls.contains("folder_note_add") || server.folders.notesIn(maja.id, root: recipes.id).count == 3)
    }

    // MARK: Share Folder

    @Test func shareFolderIsInTheFoldersMenuInAGroupOfItsOwn() {
        let groups = SidebarView.folderMenu(isNotes: false, newWindow: true, reorders: true, shares: true)
        #expect(groups[2] == [.share])
        #expect(FolderAction.share.title == "Share Folder")
        #expect(!SidebarView.folderMenu(isNotes: false, newWindow: true, reorders: true).flatMap { $0 }.contains(.share))
    }

    @Test func theShareSheetSharesTheFolderAndStopsIt() async throws {
        let maja = try device(server.account("Maja"), name: "Maja"), jonas = try device(server.account("Jonas"), name: "Jonas")
        let recipes = Folder(name: "Recipes")
        maja.context.insert(recipes)
        _ = note("Pancakes\nFlour", in: recipes, on: maja)
        let backend = FolderShareBackend(folder: recipes, sharing: maja.folders, store: maja.store)
        let share = ShareController(note: backend.standIn, backend: backend, hasApp: { false })
        share.isFolder = true
        share.stopSharing = { try await backend.stop() }
        #expect(share.isOwner && share.state.notSharedYet)
        #expect(ShareCopy.folderLink(share.state).contains("every note in it"))
        await share.shareLink()
        #expect(share.state.problem == nil)
        let url = try #require(share.state.link)
        #expect(maja.folders.sharedFolderIDs == [recipes.id])

        _ = await jonas.store.join(url)
        let theirs = try #require(folder("Recipes", on: jonas))
        let his = FolderShareBackend(folder: theirs, sharing: jonas.folders, store: jonas.store)
        let hisShare = ShareController(note: his.standIn, backend: his, hasApp: { false })
        #expect(!hisShare.isOwner)

        await share.confirmStop()
        share.askStop()
        await share.confirmStop()
        #expect(share.state.problem == nil && share.stopped)
        await look(jonas)
        #expect(folder("Recipes", on: jonas) == nil)
        #expect(maja.folders.sharedFolderIDs.isEmpty)
    }
}

extension ModelContext {
    func everyNote() -> [Note] { (try? fetch(FetchDescriptor<Note>())) ?? [] }
}
