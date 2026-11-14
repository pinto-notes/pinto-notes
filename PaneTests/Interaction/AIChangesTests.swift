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
extension AIChangesTests {
    @Test func aConnectedAIShowsItsMark() {
        #expect(SecurityContent.aiMark("Claude", title: "My helper") == "Claude")
        #expect(SecurityContent.aiMark(nil, title: "ChatGPT") == "ChatGPT", "by its name")
        #expect(SecurityContent.aiMark(nil, title: "My helper") == nil, "no mark to show")
    }

    /// One AI's edits in a row read as one change; anything between them keeps them apart (round 20).
    @Test func editsInARowAreOneSession() {
        let note = UUID(), other = UUID()
        let t = Date(timeIntervalSince1970: 1_000_000)
        func edit(_ id: String, _ before: Int64, _ after: Int64?, ago: TimeInterval, ai: String = "ChatGPT", note n: UUID? = nil) -> AIChange {
            AIChange(id: id, kind: .edit, noteID: n ?? note, ai: ai, at: t.addingTimeInterval(-ago), beforeVersion: before, afterVersion: after)
        }
        let one = AIChangeCopy.sessions([edit("c", 3, nil, ago: 0), edit("b", 2, 3, ago: 60), edit("a", 1, 2, ago: 120)])
        #expect(one.count == 1)
        #expect(one[0].id == "c" && one[0].edits == 3)
        #expect(one[0].beforeVersion == 1 && one[0].afterVersion == nil, "from before the first to after the last")
        #expect(AIChangeCopy.sessions([edit("b", 3, nil, ago: 0), edit("a", 1, 2, ago: 60)]).count == 2, "someone else's version between them")
        #expect(AIChangeCopy.sessions([edit("b", 2, nil, ago: 0, ai: "Claude"), edit("a", 1, 2, ago: 60)]).count == 2, "another AI")
        #expect(AIChangeCopy.sessions([edit("b", 2, nil, ago: 0, note: other), edit("a", 1, 2, ago: 60)]).count == 2, "another note")
        #expect(AIChangeCopy.sessions([edit("b", 2, nil, ago: 0), edit("a", 1, 2, ago: AIChangeCopy.sessionGap + 1)]).count == 2, "hours apart")
        // The gap counts from the edit next to it, so a long session stays one.
        let long = AIChangeCopy.sessions([edit("c", 3, nil, ago: 0), edit("b", 2, 3, ago: 500), edit("a", 1, 2, ago: 1000)])
        #expect(long.count == 1)
    }

    #if os(macOS)
    /// The AI Changes window: Return opens the note, never undoes (a stray Return while reading
    /// changed the note, council 11-04), and the summary has room to say what the AI did.
    @Test func returnOpensTheNoteAndUndoIsAClickOfItsOwn() throws {
        let src = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appending(path: "Pane/Views/AIChangesView.swift"), encoding: .utf8)
        let bar = try #require(src.range(of: "private func actions(_ c: AIChange) -> some View").map { String(src[$0.lowerBound...].prefix(2200)) })
        let undo = try #require(bar.range(of: "Button(\"Undo This Change\")"))
        let open = try #require(bar.range(of: "Button(\"Open Note\")"))
        let undoPart = String(bar[undo.lowerBound..<open.lowerBound])
        let openPart = String(bar[open.lowerBound...].prefix(400))
        #expect(!undoPart.contains(".defaultAction"), "Undo is never the Return button")
        #expect(openPart.contains(".keyboardShortcut(.defaultAction)"), "Return opens the note")
        let detail = try #require(src.range(of: "private var detail: some View").map { String(src[$0.lowerBound...].prefix(1400)) })
        // The summary above Undo on up to three lines (council round 8: two cut it off; round 11: a
        // long one pushed the preview down), all of it in the tooltip.
        let summary = try #require(detail.range(of: "Text(model.summary(c))").map { String(detail[$0.lowerBound...].prefix(320)) })
        #expect(summary.contains(".lineLimit(3)") && summary.contains(".fixedSize(horizontal: false, vertical: true)") && summary.contains(".help(model.summary(c))"))
        // And in the list, before a change is picked: its own two lines, the byline without it.
        let row = try #require(src.range(of: "struct AIChangeRow").map { String(src[$0.lowerBound...].prefix(2600)) })
        #expect(row.contains("Text(model.summary(change)).font(summaryFont).lineLimit(2).truncationMode(.middle)"), "a long name keeps its \"and 2 more\"")
        #expect(row.contains("var parts = [change.ai, VersionHistoryModel.time(change.at)]"), "the byline is who and when")
        #expect(row.contains("private let lineFont = Font.system(size: 12)"), "who and when at 12 pt, read before Undo (round 4)")
        #expect(!src.contains("NSColor(white:") && src.contains("Rectangle().fill(Color.line)"), "the theme's dividers, solid in High contrast (council round 11)")
        #expect(!src.contains("windowBackgroundColor"), "the list and the bar on the note's ground, not a grey beside black")
        // One accent (round 5): Undo and the filter in ink, the list's quiet grey selection. Round 16: a
        // card's × in the corner closes it, like the app's other sheets; no Done bar along the bottom.
        #expect(src.components(separatedBy: "Button(\"Done\"").count == 2, "only the iPhone's toolbar Done")
        #expect(src.contains("CardCloseButton(size: 28, action: close)"))
        #expect(undoPart.contains(".tint(.primary)") && !undoPart.contains("amberProminent"))
        #expect(src.contains(".hoverRow(\"aiChange\", reach: Hover.noteRowReach, selected: model.selection == c.id)") && src.contains(".quietSelection()"))
        let filter = try #require(src.range(of: "struct AIChangesFilter").map { String(src[$0.lowerBound...].prefix(600)) })
        #expect(filter.contains(".tint(.primary)"))
        // The receipt says its whole line ("ChatGPT changed 3 li…" in round 5).
        let marks = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appending(path: "Pane/Views/AIMarks.swift"), encoding: .utf8)
        let receipt = try #require(marks.range(of: "Text(compact ? receipt.shortSummary : receipt.summary").map { String(marks[$0.lowerBound...].prefix(400)) })
        #expect(receipt.contains(".fixedSize(horizontal: true, vertical: false)"))
    }
    #endif

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
        // It fades in a third of a second rather than cutting out (council r1).
        await h.settle(0.5)
        #expect(!h.view.isTinted, "typing makes it yours")
    }

    /// The note as the app shows it: opened with an AI's edit waiting, the tint is there, then
    /// fades on its own while you read (Emil, 12 November 2026: it stayed until you typed, and that
    /// was annoying); opened again, nothing is marked.
    @Test func theOpenNoteMarksTheChangeThenLetsItGo() async throws {
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
        #expect(!controller.isTinted, "gone by itself, without typing")
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

    /// The note's one Undo, whichever it undoes. (SwiftUI hands the bar item its title, not its
    /// identifier.)
    static func undoItem(in window: UIWindow) -> UIBarButtonItem? {
        barItems(in: window).first { $0.title?.hasPrefix("Undo") == true }
    }

    /// That Undo while it undoes an AI's edit: titled "Undo ChatGPT's changes".
    static func aiUndoItem(in window: UIWindow) -> UIBarButtonItem? {
        barItems(in: window).first { $0.title?.hasPrefix("Undo ") == true || $0.title?.hasPrefix("Undo,") == true }
    }

    /// That Undo while it undoes your own changes.
    static func yourUndoItem(in window: UIWindow) -> UIBarButtonItem? {
        barItems(in: window).first { $0.title == "Undo" }
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
        let undo = try #require(Self.aiUndoItem(in: open), "Undo is in the bar; items: \(Self.barItems(in: open).map { $0.title ?? $0.accessibilityIdentifier ?? "?" })")
        #expect(undo.title == "Undo ChatGPT's changes", "VoiceOver says whose change it undoes")
        #expect(Self.yourUndoItem(in: open) == nil, "never two")
        try Self.shot(open, "2-note-\(mode)")
        // The tint fades on its own after a few seconds (Emil, 12 November 2026; the Mac's
        // theOpenNoteMarksTheChangeThenLetsItGo): Undo is taken while the change is marked.
        Self.tap(undo)
        try? await Task.sleep(for: .seconds(1.0))
        #expect(note.body == Self.before, "Undo put the note back")
        #expect(!controller.isTinted)
        #expect(Self.undoItem(in: open) == nil, "the marking is gone")
        #expect(!AIEdit.isUnseen(note), "undoing doesn't mark it again")
        try Self.shot(open, "3-after-undo-\(mode)")
    }

    /// Typing on the iPhone: the first keystroke takes the tint and the AI's Undo away; the same
    /// place is then your own Undo (NoteUndoButtonTests).
    @Test func typingClearsTheMarkOnTheIPhone() async throws {
        let c = try Self.container()
        let note = Self.aiEdited(c, by: "Claude")
        let controller = EditorController()
        let open = try Self.window(Self.noteView(note, c, controller), dark: false)
        defer { open.isHidden = true }
        try? await Task.sleep(for: .seconds(1.5))
        #expect(controller.isTinted)
        #expect(Self.aiUndoItem(in: open) != nil)
        let view = try #require(controller.target as? PaneTextView)
        view.selectedRange = NSRange(location: (view.text as NSString).length, length: 0)
        view.insertText("!")
        try? await Task.sleep(for: .seconds(0.6))
        #expect(!controller.isTinted, "typing makes it yours")
        #expect(Self.aiUndoItem(in: open) == nil, "the AI's Undo goes with it")
        #expect(Self.yourUndoItem(in: open) != nil, "your typing is what Undo undoes now")
        #expect(note.body != Self.before, "nothing was undone")
    }
    #endif
}
