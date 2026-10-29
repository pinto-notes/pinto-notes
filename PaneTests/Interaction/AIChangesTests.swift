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

/// See what your AI changed in a note, and undo it in one tap (Emil, 29 October 2026). The list
/// marks the note until you open it; inside, the lines the AI changed stay tinted and Undo stays
/// offered while you read, and both go quietly once you type, undo or leave the note.
@MainActor @Suite(.serialized) struct AIChangesTests {
    static let before = "Lisbon, 4 days in May\n\n- [ ] Day 1: Alfama and the castle\n- [ ] Day 2: Belém and the tile museum\n- [ ] Day 3: LX Factory"
    static let after = "Lisbon, 4 days in May\n\n- [ ] Day 1: Alfama and the castle\n- [ ] Day 2: Belém and the tile museum\n- [ ] Day 3: Sintra, Pena Palace first\n- [ ] Day 4: LX Factory and a late lunch"

    /// A note this device had, then an AI's edit synced onto it, as the sync engine records it.
    static func aiEdited(_ c: ModelContainer, by ai: String = "ChatGPT") -> Note {
        let note = c.mainContext.createNote(in: .all, body: before)
        AIEditTests.arrive(note, body: after, by: ai)
        return note
    }

    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    // MARK: What stays, and for how long

    @Test func anAIsTextEditStaysUntilYouEditTheAppMomentsDont() {
        let edit = AIEdit.Receipt(noteID: UUID(), by: "ChatGPT", at: .now, previous: "", lines: 2)
        #expect(edit.staysUntilEdited)
        for kind: AIEdit.Receipt.Kind in [.pageEdit, .dataEdit, .pageMade, .pageChanged, .reverted, .heldBack] {
            var r = edit
            r.kind = kind
            #expect(!r.staysUntilEdited, "\(kind) goes on its own")
        }
        #expect(edit.undoLabel == "Undo ChatGPT's changes")
        var wrote = edit
        wrote.created = true
        #expect(wrote.undoLabel == "Undo, removes the note ChatGPT wrote")
    }

    /// Where Undo lives: in the iPhone's navigation bar for an AI's text edit (no pill); the Mac
    /// keeps its receipt.
    @Test func undoSitsInTheBarOnTheIPhoneOnly() {
        let edit = AIEdit.Receipt(noteID: UUID(), by: "Claude", at: .now, previous: "", lines: 1)
        var page = edit
        page.kind = .pageChanged
        #if os(iOS)
        #expect(NoteAIUndo.inBar(edit, showingPage: false))
        #else
        #expect(!NoteAIUndo.inBar(edit, showingPage: false))
        #endif
        #expect(!NoteAIUndo.inBar(edit, showingPage: true), "over a note's app the compact receipt stays")
        #expect(!NoteAIUndo.inBar(page, showingPage: false))
        #expect(!NoteAIUndo.inBar(nil, showingPage: false))
    }

    /// The list: "Edited by Claude" (or "Written by") in place of the preview, until you open it.
    @Test func theListSaysWhoUntilYouOpenIt() throws {
        let c = try Self.container()
        let n = Self.aiEdited(c, by: "Claude")
        #expect(AIEdit.isUnseen(n))
        #expect(AIEdit.listLine(n, by: "Claude") == "Edited by Claude")
        _ = AIEdit.markSeen(n)
        #expect(!AIEdit.isUnseen(n), "opening it is seeing it")
        let wrote = Note(body: "Packing list\n\n- [ ] Passport")
        wrote.aiEditor = "ChatGPT"
        wrote.aiEditedAt = .now
        AIEdit.arrived(wrote, previousBody: nil, previousEditAt: nil, quiet: false)
        #expect(AIEdit.listLine(wrote, by: "ChatGPT") == "Written by ChatGPT")
    }

    #if os(macOS)
    /// The real editor: an AI's tint holds well past when the old one faded, and typing clears it.
    @Test func theTintStaysWhileYouReadAndGoesWhenYouType() async {
        let h = await EditorHarness(Self.after, focus: false)
        defer { h.close() }
        let tint = h.view.core.layoutDelegate.tint
        h.view.tintChanges(from: Self.before, untilCleared: true)
        let day3 = (Self.after as NSString).range(of: "- [ ] Day 3").location
        let day1 = (Self.after as NSString).range(of: "- [ ] Day 1").location
        await h.settle(6.5)
        #expect(tint.strength(at: day3) == 1, "still marked")
        #expect(tint.strength(at: day1) == 0, "an untouched line isn't")
        #expect(h.view.isTinted)
        await h.caret(after: "late lunch")
        await h.type("!")
        #expect(!h.view.isTinted, "typing makes it yours")
    }

    /// The note as the app shows it: opened with an AI's edit waiting, the tint is there and stays;
    /// your first keystroke takes it away; opened again, nothing is marked.
    @Test func theOpenNoteKeepsTheMarkUntilYouType() async throws {
        let c = try Self.container()
        let note = Self.aiEdited(c)
        func open() -> (NSWindow, EditorController) {
            let controller = EditorController()
            let window = NSWindow(contentRect: NSRect(x: -20000, y: -20000, width: 700, height: 800), styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.contentView = NSHostingView(rootView: NavigationStack { NoteDetailView(note: note, controller: controller, onNewNote: {}) }.modelContainer(c))
            return (window, controller)
        }
        let (window, controller) = open()
        try? await Task.sleep(for: .seconds(1.2))
        #expect(controller.isTinted, "what the AI changed is marked")
        #expect(!AIEdit.isUnseen(note), "and the list's mark is gone")
        try? await Task.sleep(for: .seconds(6))
        #expect(controller.isTinted, "still marked while you read")
        let view = try #require(controller.target as? PaneTextView)
        view.insertText("!", replacementRange: NSRange(location: (view.string as NSString).length, length: 0))
        try? await Task.sleep(for: .seconds(0.3))
        #expect(!controller.isTinted, "typing clears it")
        window.close()

        let (again, second) = open()
        defer { again.close() }
        try? await Task.sleep(for: .seconds(1.2))
        #expect(!second.isTinted, "seen once, it doesn't come back")
    }
    #endif

    #if os(iOS)
    // MARK: iPhone, the real note screen

    static let size = CGSize(width: 402, height: 874)

    static func window(_ view: some View, dark: Bool) throws -> UIWindow {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: size)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.rootViewController = UIHostingController(rootView: view.tint(Color(PColor.paneAccent)).environment(\.locale, Locale(identifier: "en_US")))
        window.isHidden = false
        return window
    }

    static func shot(_ window: UIWindow, _ name: String) throws {
        guard let dir = ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try image.pngData()?.write(to: dir.appending(path: "\(name).png"))
    }

    /// The navigation bar's buttons on screen, whichever way SwiftUI placed them.
    static func barItems(in window: UIWindow) -> [UIBarButtonItem] {
        func controllers(_ vc: UIViewController?) -> [UIViewController] {
            guard let vc else { return [] }
            return [vc] + vc.children.flatMap(controllers) + controllers(vc.presentedViewController)
        }
        return controllers(window.rootViewController).flatMap { vc -> [UIBarButtonItem] in
            let item = vc.navigationItem
            return (item.rightBarButtonItems ?? []) + (item.leftBarButtonItems ?? []) + (item.trailingItemGroups + item.leadingItemGroups).flatMap(\.barButtonItems)
        }
    }

    static func undoItem(in window: UIWindow) -> UIBarButtonItem? {
        barItems(in: window).first { $0.accessibilityIdentifier == NoteAIUndo.identifier || $0.title == "Undo" }
    }

    static func tap(_ item: UIBarButtonItem) {
        if let action = item.primaryAction {
            action.performWithSender(nil, target: nil)
        } else if let selector = item.action {
            UIApplication.shared.sendAction(selector, to: item.target, from: item, for: nil)
        }
    }

    static func listView(_ c: ModelContainer) -> some View {
        NavigationStack { NoteListView(scope: .all, selection: .constant([]), onNewNote: {}) }.modelContainer(c)
    }

    static func noteView(_ note: Note, _ c: ModelContainer, _ controller: EditorController) -> some View {
        NavigationStack { NoteDetailView(note: note, controller: controller, onNewNote: {}) }.modelContainer(c)
    }

    /// The whole flow on the iPhone, light and dark: the list marks the note, the note marks what
    /// changed and offers Undo in the bar, and Undo puts it back. Pictures with AMBER_HIG_SHOTS.
    @Test(arguments: [false, true])
    func listNoteAndUndo(dark: Bool) async throws {
        let mode = dark ? "dark" : "light"
        let c = try Self.container()
        Seed.ensureLibrary(c.mainContext, demo: false, welcome: false)
        for body in ["Groceries\n\nOat milk, lemons, eggs", "Books to read\n\nPiranesi, The Overstory"] {
            let n = c.mainContext.createNote(in: .all, body: body)
            n.updatedAt = .now.addingTimeInterval(-3600)
        }
        let note = Self.aiEdited(c)

        let list = try Self.window(Self.listView(c), dark: dark)
        try? await Task.sleep(for: .seconds(1.5))
        #expect(AIEdit.isUnseen(note), "the list shows the mark until the note is opened")
        try Self.shot(list, "1-list-\(mode)")
        list.isHidden = true

        let controller = EditorController()
        let open = try Self.window(Self.noteView(note, c, controller), dark: dark)
        defer { open.isHidden = true }
        try? await Task.sleep(for: .seconds(1.5))
        #expect(!AIEdit.isUnseen(note))
        #expect(controller.isTinted, "what the AI changed is tinted")
        let undo = try #require(Self.undoItem(in: open), "Undo is in the bar; items: \(Self.barItems(in: open).map { $0.title ?? $0.accessibilityIdentifier ?? "?" })")
        try Self.shot(open, "2-note-\(mode)")
        try? await Task.sleep(for: .seconds(6))
        #expect(controller.isTinted, "still tinted while you read")
        #expect(Self.undoItem(in: open) != nil, "and Undo still there")

        Self.tap(undo)
        try? await Task.sleep(for: .seconds(1.0))
        #expect(note.body == Self.before, "Undo put the note back")
        #expect(!controller.isTinted)
        #expect(Self.undoItem(in: open) == nil, "the marking is gone")
        #expect(!AIEdit.isUnseen(note), "undoing doesn't mark it again")
        try Self.shot(open, "3-after-undo-\(mode)")
    }

    /// Typing on the iPhone: the first keystroke takes the tint and Undo away.
    @Test func typingClearsTheMarkOnTheIPhone() async throws {
        let c = try Self.container()
        let note = Self.aiEdited(c, by: "Claude")
        let controller = EditorController()
        let open = try Self.window(Self.noteView(note, c, controller), dark: false)
        defer { open.isHidden = true }
        try? await Task.sleep(for: .seconds(1.5))
        #expect(controller.isTinted)
        #expect(Self.undoItem(in: open) != nil)
        let view = try #require(controller.target as? PaneTextView)
        view.selectedRange = NSRange(location: (view.text as NSString).length, length: 0)
        view.insertText("!")
        try? await Task.sleep(for: .seconds(0.6))
        #expect(!controller.isTinted, "typing makes it yours")
        #expect(Self.undoItem(in: open) == nil, "Undo goes with it")
        #expect(note.body != Self.before, "nothing was undone")
    }
    #endif
}
