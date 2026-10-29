import Foundation
import SwiftData
import SwiftUI
import Testing
#if os(iOS)
import UIKit
#else
import AppKit
#endif
@testable import Pane

/// Restoring a version shows it in the open note at once (Emil, 29 October 2026). The editor
/// took the restored text for an echo of its own typing whenever you had typed that text in this
/// sitting, so the note kept showing what you had until you opened it again, and the next
/// keystroke saved that back over the restore.
@MainActor @Suite(.serialized) struct RestoreVersionTests {
    static let older = "Lisbon, 4 days in May\n\n- [ ] Day 1: Alfama and the castle\n- [ ] Day 2: Belém"

    /// A history with one earlier version and no server: restoring writes it here, as the app
    /// does signed out, through the same `NoteHistory.restore` the sheet's Restore calls.
    final class OneVersion: NoteHistoryStore {
        var body: String
        init(_ body: String) { self.body = body }
        func versions(of note: UUID) async throws -> [NoteVersion] {
            [NoteVersion(version: 3, madeAt: .now, author: .you(device: "Mac"), isCurrent: true),
             NoteVersion(version: 2, madeAt: .now.addingTimeInterval(-600), author: .you(device: "Mac"))]
        }
        func body(of note: UUID, version: Int64) async throws -> String { body }
        func restore(note: UUID, version: Int64) async throws -> NoteDTO? { nil }
    }

    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    static func noteView(_ note: Note, _ c: ModelContainer, _ controller: EditorController) -> some View {
        NavigationStack { NoteDetailView(note: note, controller: controller, onNewNote: {}) }.modelContainer(c)
    }

    /// Restore, as the history sheet does: load, pick the earlier version, Restore.
    static func restore(_ note: Note, to body: String, in c: ModelContainer) async throws {
        let history = NoteHistory(store: OneVersion(body), context: c.mainContext, sync: nil)
        let model = VersionHistoryModel(note: note, history: history)
        await model.load()
        #expect(model.selected?.version.version == 2)
        #expect(await model.restore(), "restored: \(model.restoreError ?? "")")
    }

    static var settle: Duration { .seconds(0.8) }

    @Test func theMenuItemReadsVersionHistory() {
        #if os(macOS)
        #expect(NoteMoreMenu.historyTitle == "Version History…")
        #else
        #expect(NoteMoreMenu.historyTitle == "Version History")
        #endif
        #expect(!NoteMoreMenu.historyTitle.contains("Show"))
    }

    #if os(macOS)
    static func open(_ note: Note, _ c: ModelContainer) -> (NSWindow, EditorController) {
        let controller = EditorController()
        let window = NSWindow(contentRect: NSRect(x: -20000, y: -20000, width: 700, height: 800), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = NSHostingView(rootView: noteView(note, c, controller))
        return (window, controller)
    }

    static func text(_ controller: EditorController) throws -> String { try #require(controller.target as? PaneTextView).string }
    static func canUndo(_ controller: EditorController) throws -> Bool { try #require(controller.target as? PaneTextView).undoManager?.canUndo ?? false }

    static func typeAtEnd(_ s: String, _ controller: EditorController) throws {
        let view = try #require(controller.target as? PaneTextView)
        view.insertText(s, replacementRange: NSRange(location: (view.string as NSString).length, length: 0))
    }
    #else
    static func open(_ note: Note, _ c: ModelContainer) throws -> (UIWindow, EditorController) {
        let controller = EditorController()
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(rootView: noteView(note, c, controller))
        window.isHidden = false
        return (window, controller)
    }

    static func text(_ controller: EditorController) throws -> String { try #require(controller.target as? PaneTextView).text }
    static func canUndo(_ controller: EditorController) throws -> Bool { try #require(controller.target as? PaneTextView).undoManager?.canUndo ?? false }

    static func typeAtEnd(_ s: String, _ controller: EditorController) throws {
        let view = try #require(controller.target as? PaneTextView)
        view.selectedRange = NSRange(location: (view.text as NSString).length, length: 0)
        view.insertText(s)
    }
    #endif

    /// You type, then restore the text you had when you opened the note: the open note shows it
    /// without being opened again, there's nothing to undo back into, and typing on keeps it.
    @Test func theOpenNoteShowsTheRestoredVersionAtOnce() async throws {
        let c = try Self.container()
        let note = c.mainContext.createNote(in: .all, body: Self.older)
        let (window, controller) = try Self.open(note, c)
        defer { Self.close(window) }
        try await Task.sleep(for: Self.settle)
        try Self.typeAtEnd("\n- [ ] Day 3: LX Factory", controller)
        try await Task.sleep(for: Self.settle)
        #expect(note.body.hasSuffix("LX Factory"), "the typing was saved")

        try await Self.restore(note, to: Self.older, in: c)
        try await Task.sleep(for: Self.settle)
        #expect(note.body == Self.older)
        #expect(try Self.text(controller) == Self.older, "the open note shows the restored version")
        #expect(try !Self.canUndo(controller), "undo can't bring back the text that was replaced")

        try Self.typeAtEnd("!", controller)
        try await Task.sleep(for: Self.settle)
        #expect(note.body == Self.older + "!", "typing on builds on the restored version")
    }

    /// An AI's edit is marked in the open note; restoring the version before it shows that
    /// version and the marking goes.
    @Test func restoringOverAnAIsEditShowsItAndClearsTheMarking() async throws {
        let c = try Self.container()
        let note = c.mainContext.createNote(in: .all, body: Self.older)
        AIEditTests.arrive(note, body: AIChangesTests.after, by: "ChatGPT")
        let (window, controller) = try Self.open(note, c)
        defer { Self.close(window) }
        try await Task.sleep(for: .seconds(1.2))
        #expect(controller.isTinted, "what the AI changed is marked")

        try await Self.restore(note, to: Self.older, in: c)
        try await Task.sleep(for: Self.settle)
        #expect(try Self.text(controller) == Self.older)
        #expect(!controller.isTinted, "the marking goes with the AI's text")
        #if os(iOS)
        #expect(AIChangesTests.undoItem(in: window) == nil, "and so does Undo")
        #endif
    }

    #if os(macOS)
    static func close(_ w: NSWindow) { w.close() }
    #else
    static func close(_ w: UIWindow) { w.isHidden = true }
    #endif
}
