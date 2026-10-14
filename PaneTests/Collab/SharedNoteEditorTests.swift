#if os(macOS)
import AppKit
import CryptoKit
import SwiftData
import SwiftUI
import Testing
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

    func host(_ note: Note, in container: ModelContainer) -> (NSWindow, PaneTextView) {
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }
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
}
}
#endif
