import Foundation
import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#endif

/// A shared note takes typing only when its document is open here and you can edit it: until the
/// document opens (or with sharing off) and for someone who can only view, the editor is read-only,
/// so nothing typed is lost or refused.
@MainActor @Suite(.serialized) struct SharedReadOnlyTests {
    @Test func whenTheEditorTakesTyping() {
        // An ordinary note.
        #expect(!SharedEditing.readOnly(trashed: false, shared: false, viewOnly: nil))
        #expect(SharedEditing.readOnly(trashed: true, shared: false, viewOnly: nil))
        // Shared: not open yet, open to edit, open to view.
        #expect(SharedEditing.readOnly(trashed: false, shared: true, viewOnly: nil))
        #expect(!SharedEditing.readOnly(trashed: false, shared: true, viewOnly: false))
        #expect(SharedEditing.readOnly(trashed: false, shared: true, viewOnly: true))
    }

    #if os(macOS)
    /// The real note view: a shared note whose document isn't here can't be typed in at all.
    @Test func aSharedNoteNotOpenYetIsReadOnly() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let previous = CollabStore.shared
        CollabStore.shared = nil
        defer { CollabStore.shared = previous }
        let note = c.mainContext.createNote(in: .all, body: SharedNotes.placeholder(title: "Plans"))
        note.sharedNoteID = UUID()
        let plain = c.mainContext.createNote(in: .all, body: "Mine\n")
        try c.mainContext.save()
        for (n, editable) in [(note, false), (plain, true)] {
            let view = NavigationStack { NoteDetailView(note: n, controller: EditorController(), onNewNote: {}) }
                .modelContainer(c).frame(width: 720, height: 800)
            let w = KeyableWindow(contentRect: NSRect(x: -30000, y: -30000, width: 720, height: 800), styleMask: [.borderless], backing: .buffered, defer: false)
            w.isReleasedWhenClosed = false
            let host = NSHostingView(rootView: view)
            w.contentView = host
            host.layoutSubtreeIfNeeded()
            try await Task.sleep(for: .seconds(0.5))
            let text = try #require(NetworkFaults.SharedNoteEditorTests.textView(in: host))
            #expect(text.isEditable == editable, "\(n.title)")
            w.close()
        }
    }
    #endif
}
