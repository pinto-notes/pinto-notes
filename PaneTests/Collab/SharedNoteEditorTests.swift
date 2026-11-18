#if os(macOS)
import AppKit
import CryptoKit
import SwiftData
import SwiftUI
import Testing
import UniformTypeIdentifiers
@testable import Pane

extension NetworkFaults {
/// The real note view, offscreen, on a shared note: what you type goes into the shared document,
/// never into the note as an ordinary edit for sync; and a shared note whose document isn't on
/// this device takes nothing typed (it would be lost, or worse, sent as the note's text).
@MainActor @Suite struct SharedNoteEditorTests {
    let server = FakeCollabServer()
    let me = UUID()
    let nk = SymmetricKey(size: .bits256)
    let dataKey = SymmetricKey(size: .bits256)

    init() {
        CollabSession.snapshotEvery = 200
        CollabSession.snapshotQuiet = 5
    }

    func host(_ note: Note, in container: ModelContainer, controller: EditorController = EditorController()) -> (NSWindow, PaneTextView) {
        let view = NavigationStack { NoteDetailView(note: note, controller: controller, onNewNote: {}) }
            .modelContainer(container)
            .frame(width: 720, height: 800)
        let w = KeyableWindow(contentRect: NSRect(x: -30000, y: -30000, width: 720, height: 800), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        let hosting = NSHostingView(rootView: view)
        w.contentView = hosting
        hosting.layoutSubtreeIfNeeded()
        w.displayIfNeeded()
        return (w, Self.textView(in: hosting)!)
    }

    static func textView(in v: NSView) -> PaneTextView? {
        if let t = v as? PaneTextView { return t }
        for s in v.subviews { if let t = textView(in: s) { return t } }
        return nil
    }

    func waitUntil(_ seconds: Double = 5, _ done: () -> Bool) async {
        let end = Date.now.addingTimeInterval(seconds)
        while !done(), Date.now < end { try? await Task.sleep(for: .milliseconds(20)) }
    }

    func type(_ s: String, at end: Bool = true, into view: PaneTextView) {
        view.setSelectedRange(NSRange(location: (view.string as NSString).length, length: 0))
        view.insertText(s, replacementRange: view.selectedRange())
    }

    @Test func typingInASharedNoteGoesToItsDocumentOnly() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = c.mainContext
        let transport = FakeCollabTransport(server: server, me: me)
        let key = dataKey
        let store = CollabStore(name: "Emil", transport: transport, dataKey: { key })
        store.context = context
        let previous = CollabStore.shared
        CollabStore.shared = store
        defer { CollabStore.shared = previous; store.stop() }

        let note = context.createNote(in: .all, body: "Groceries\nMilk")
        try context.save()
        try await transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let session = try await #require(store.library).becomeShared(note, nk: nk)
        note.dirty = false
        let (w, text) = host(note, in: c)
        defer { w.close() }
        await waitUntil { text.string == "Groceries\nMilk" }

        type("\nEggs", into: text)
        await waitUntil { session.text == "Groceries\nMilk\nEggs" && session.isSent }
        #expect(session.text == "Groceries\nMilk\nEggs")
        #expect(server.updates(of: note.id).count >= 1, "the keystrokes went up as changes to the document")
        try await Task.sleep(for: .seconds(DebouncedSave.delay + 0.3))
        // The note follows the document (the list, search), and isn't marked as an edit to sync:
        // its title didn't change, so its pointer has nothing new.
        #expect(note.body == "Groceries\nMilk\nEggs")
        #expect(!note.dirty)
    }

    /// Seen in the two-phone run: Emil restored a version with a line Sara had typed before. Her
    /// document took it and her editor kept showing the newer line, as an echo of her own typing,
    /// and her next keystroke would have written that line back.
    @Test func theDocumentGoingBackToWhatYouTypedShowsInTheEditor() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = c.mainContext
        let transport = FakeCollabTransport(server: server, me: me)
        let key = dataKey
        let store = CollabStore(name: "Emil", transport: transport, dataKey: { key })
        store.context = context
        let previous = CollabStore.shared
        CollabStore.shared = store
        defer { CollabStore.shared = previous; store.stop() }

        let note = context.createNote(in: .all, body: "Groceries\nMilk")
        try context.save()
        try await transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let session = try await #require(store.library).becomeShared(note, nk: nk)
        note.dirty = false
        let (w, text) = host(note, in: c)
        defer { w.close() }
        await waitUntil { text.string == "Groceries\nMilk" && text.isEditable }

        type("\nEggs", into: text)
        await waitUntil { session.text == "Groceries\nMilk\nEggs" }
        type("\nTea", into: text)
        await waitUntil { session.text == "Groceries\nMilk\nEggs\nTea" }

        session.restore("Groceries\nMilk\nEggs")
        await waitUntil { text.string == "Groceries\nMilk\nEggs" }
        #expect(text.string == "Groceries\nMilk\nEggs")
        // And what's typed next builds on it.
        type("\nJam", into: text)
        await waitUntil { session.text == "Groceries\nMilk\nEggs\nJam" }
        #expect(session.text == "Groceries\nMilk\nEggs\nJam")
    }

    /// A cold launch or a widget tap: the note is drawn before sharing has started. Once the store
    /// is up with the note's document, the open note takes typing into it without being reopened
    /// (persona council rounds 4 to 6).
    @Test func aNoteDrawnBeforeSharingStartsTakesTypingOnceItOpens() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = c.mainContext
        let transport = FakeCollabTransport(server: server, me: me)
        let key = dataKey
        let store = CollabStore(name: "Emil", transport: transport, dataKey: { key })
        store.context = context
        let previous = CollabStore.shared
        CollabStore.shared = nil
        defer { CollabStore.shared = previous; store.stop() }

        let note = context.createNote(in: .all, body: "Groceries\nMilk")
        try context.save()
        try await transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let session = try await #require(store.library).becomeShared(note, nk: nk)
        note.dirty = false
        let controller = EditorController()
        let (w, text) = host(note, in: c, controller: controller)
        defer { w.close() }
        await waitUntil(1) { controller.readOnly }
        #expect(controller.readOnly, "no store yet: the note takes nothing typed")

        CollabStore.shared = store
        await waitUntil { !controller.readOnly && controller.ownUndo != nil }
        #expect(!controller.readOnly)
        #expect(controller.ownUndo != nil)
        // The view takes keys on the next pass of the window, after the controller says so.
        await waitUntil { text.isEditable }
        type("\nEggs", into: text)
        await waitUntil { session.text == "Groceries\nMilk\nEggs" }
        #expect(session.text == "Groceries\nMilk\nEggs")
    }

    /// One editor serves every note in a window. Open one shared note, then another: a change
    /// arriving for the first doesn't show in the second, so your next keystroke can't write the
    /// first note's text into the second (an Air run, two notes in a shared folder, 11-18).
    @Test func aChangeToTheNoteYouLeftDoesntShowInTheOneYouOpened() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = c.mainContext
        let transport = FakeCollabTransport(server: server, me: me)
        let key = dataKey
        let store = CollabStore(name: "Emil", transport: transport, dataKey: { key })
        store.context = context
        let previous = CollabStore.shared
        CollabStore.shared = store
        defer { CollabStore.shared = previous; store.stop() }

        let soup = context.createNote(in: .all, body: "Lentil soup\nRed lentils")
        let pancakes = context.createNote(in: .all, body: "Pancakes\nFlour")
        try context.save()
        let library = try #require(store.library)
        try await transport.share(note: soup.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let soupSession = try await library.becomeShared(soup, nk: nk)
        try await transport.share(note: pancakes.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let pancakeSession = try await library.becomeShared(pancakes, nk: nk)
        soup.dirty = false; pancakes.dirty = false

        // As the main window does: one editor, the note view made again for each note.
        let picked = Picked(soup)
        let controller = EditorController()
        let view = NavigationStack { PickedNote(picked: picked, controller: controller) }
            .modelContainer(c).frame(width: 720, height: 800)
        let w = KeyableWindow(contentRect: NSRect(x: -30000, y: -30000, width: 720, height: 800), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        let hosting = NSHostingView(rootView: view)
        w.contentView = hosting
        defer { w.close() }
        hosting.layoutSubtreeIfNeeded()
        w.displayIfNeeded()
        await waitUntil { controller.wiredSession == ObjectIdentifier(soupSession) }
        await waitUntil { soupSession.onRemoteText != nil }
        #expect(soupSession.onRemoteText != nil, "the soup's editor is wired to its session")

        picked.note = pancakes
        hosting.layoutSubtreeIfNeeded()
        await waitUntil { controller.wiredSession == ObjectIdentifier(pancakeSession) }
        w.displayIfNeeded()
        await waitUntil { Self.textView(in: hosting)?.string == "Pancakes\nFlour" }
        let text = try #require(Self.textView(in: hosting))
        await waitUntil { text.isEditable }
        // The editor drives the text view on screen, as in the app's window (offscreen, the
        // weak reference isn't kept through the swap).
        controller.target = text
        #expect(text.string == "Pancakes\nFlour")

        // Someone types in the soup.
        soupSession.onRemoteText?("Lentil soup\nRed lentils\nA pinch of salt")
        try await Task.sleep(for: .milliseconds(200))
        #expect(text.string == "Pancakes\nFlour")
        type("\nMilk", into: text)
        await waitUntil { pancakeSession.text == "Pancakes\nFlour\nMilk" }
        #expect(pancakeSession.text == "Pancakes\nFlour\nMilk")
        #expect(soupSession.text == "Lentil soup\nRed lentils")
    }

    /// Signing in to another account takes the old library away while a shared note of it is being
    /// opened: the opening finds the note gone and stops, the app doesn't crash (an Air run, 11-18).
    @Test func aSharedNoteWhoseStoreWentAwayIsNotOpened() async throws {
        let transport = FakeCollabTransport(server: server, me: me)
        let key = dataKey
        let store = CollabStore(name: "Emil", transport: transport, dataKey: { key })
        defer { store.stop() }
        var note: Note? = nil
        do {
            let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
            let context = c.mainContext
            store.context = context
            let n = context.createNote(in: .all, body: "Groceries\nMilk")
            try context.save()
            try await transport.share(note: n.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
            let session = try await #require(store.library).becomeShared(n, nk: nk)
            session.close()
            store.library?.closeAll()
            store.sessions = [:]
            note = n
            // Asked for while its store is still here; the opening runs after it's gone.
            _ = store.session(for: n)
            store.context = nil
        }
        for _ in 0..<20 { await Task.yield() }
        try await Task.sleep(for: .milliseconds(200))
        // The note's store really went away (what the crash needed), and the app is still here.
        #expect(note?.modelContext == nil)
    }

    /// The same, further along: the note's document was downloading when the account changed. The
    /// download finishes into a closed library and stops there (an Air run, 11-18).
    @Test func aDownloadThatFinishesAfterSigningOutStops() async throws {
        let transport = FakeCollabTransport(server: server, me: me)
        let key = dataKey
        let store = CollabStore(name: "Emil", transport: transport, dataKey: { key })
        defer { store.stop() }
        var note: Note? = nil
        var download: Task<CollabSession?, Never>? = nil
        do {
            let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
            let context = c.mainContext
            store.context = context
            let n = context.createNote(in: .all, body: "Groceries\nMilk")
            try context.save()
            try await transport.share(note: n.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
            let library = try #require(store.library)
            let session = try await library.becomeShared(n, nk: nk)
            session.close()
            library.closeAll()
            store.sessions = [:]
            // As on a device that has the pointer and not the document yet.
            n.sharedDocument?.saved = Data()
            let noteKey = nk
            let fresh = SharedLibrary(context: context, transport: transport, name: "Emil", dataKey: { key }, openKey: { _ in noteKey })
            fresh.networkUp = { true }
            note = n
            download = Task { await fresh.ensureDocument(n, force: true) }
            await Task.yield()
            fresh.closeAll()
        }
        // Nothing opened into the closed library, and no crash on the way.
        let opened = await download?.value
        #expect(opened == nil)
        _ = note
    }

    /// Sharing starts at launch, before any view has loaded your profile: your caret and "In this
    /// note" still carry your name, from the profile's cached copy, not "Someone".
    @Test func sharingAtLaunchUsesYourCachedName() throws {
        let defaults = try #require(UserDefaults(suiteName: "shared-name-\(UUID().uuidString)"))
        let account = UUID()
        #expect(CollabStore.myName(account: account, bound: nil, defaults: defaults) == "Someone")
        defaults.set("Emil", forKey: "profile.name.\(account.uuidString.lowercased())")
        #expect(ProfileStore.cachedName(for: account, defaults: defaults) == "Emil")
        #expect(CollabStore.myName(account: account, bound: nil, defaults: defaults) == "Emil")
        #expect(CollabStore.myName(account: account, bound: "Emil W", defaults: defaults) == "Emil W")
        #expect(CollabStore(name: CollabStore.myName(account: account, bound: nil, defaults: defaults)).name == "Emil")
    }

    @Test func aSharedNoteWithoutItsDocumentTakesNothingTyped() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = c.mainContext
        let previous = CollabStore.shared
        CollabStore.shared = nil
        defer { CollabStore.shared = previous }
        // A pointer that came by sync before its document did (or with collaboration off here).
        let note = context.createNote(in: .all, body: SharedNotes.placeholder(title: "Plans"))
        note.sharedNoteID = UUID()
        note.dirty = false
        try context.save()
        let (w, text) = host(note, in: c)
        defer { w.close() }
        type("\nSomething new", into: text)
        try await Task.sleep(for: .seconds(DebouncedSave.delay + 0.3))
        DebouncedSave.flushAll()
        #expect(note.body == SharedNotes.placeholder(title: "Plans"))
        #expect(!note.dirty)
    }

    /// A file dropped, pasted or attached into a shared note you can edit is taken, as into a note
    /// of your own (SharedFiles then puts it in the note for everyone). One you can only view takes
    /// none (SharedNoteLimitsTests.filesGoIntoSharedNotesYouCanEdit).
    @Test func aSharedNoteTakesFiles() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = c.mainContext
        let previous = CollabStore.shared
        CollabStore.shared = nil
        defer { CollabStore.shared = previous }
        let file = FileManager.default.temporaryDirectory.appending(path: "shared-limit-\(UUID().uuidString).txt")
        try Data("hello".utf8).write(to: file)
        defer { try? FileManager.default.removeItem(at: file) }

        let shared = context.createNote(in: .all, body: "Packing\nSocks")
        shared.sharedNoteID = UUID()
        try context.save()
        let controller = EditorController()
        let (w, _) = host(shared, in: c, controller: controller)
        defer { w.close() }
        let added = controller.addFiles([file])
        #expect(added.count == 1)
        defer { for a in added { FileStore.remove(a) } }
        #expect(added.first?.sharedNoteID == nil, "your file stays yours")
    }
}
}
#endif

@MainActor @Observable private final class Picked {
    var note: Note
    init(_ note: Note) { self.note = note }
}

/// The main window's way: the note view keyed by its note, the editor kept.
private struct PickedNote: View {
    let picked: Picked
    let controller: EditorController
    var body: some View {
        NoteDetailView(note: picked.note, controller: controller, onNewNote: {}).id(picked.note.id)
    }
}
