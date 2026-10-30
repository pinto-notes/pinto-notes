import Foundation
import Observation
import SwiftData
import SwiftUI
import Testing
#if os(iOS)
import UIKit
#endif
@testable import Pane

/// An Undo button beside Share and More, once you've changed the note (Emil, 29 October 2026):
/// one step a tap, Redo on a long press, and never back past the note as it was when you opened
/// it. Before you've changed anything it undoes an AI's edit instead; there's never two.
@MainActor @Suite(.serialized) struct NoteUndoButtonTests {
    static let body = "Weekend\n\n- [ ] Market for bread\n- [ ] Call Mum"

    // MARK: Which undo the one button is

    @Test func oneButtonYoursFirstThenTheAIsNeverTwo() {
        let ai = AIEdit.Receipt(noteID: UUID(), by: "ChatGPT", at: .now, previous: "", lines: 2)
        func button(_ canUndo: Bool, redo: Bool = false, _ r: AIEdit.Receipt?, page: Bool = false, trashed: Bool = false) -> NoteAIUndo.Button? {
            NoteAIUndo.button(canUndo: canUndo, canRedo: redo, receipt: r, showingPage: page, trashed: trashed)
        }
        #expect(button(false, nil) == nil, "opened, nothing changed: no button")
        #expect(button(false, redo: true, nil) == nil, "everything undone: it goes, even with Redo left")
        #expect(button(true, nil, trashed: true) == nil, "Recently Deleted is read only")
        #if os(iOS)
        #expect(button(true, nil) == .yours(canRedo: false))
        #expect(button(true, redo: true, nil) == .yours(canRedo: true))
        #expect(button(false, ai) == .ai(ai), "an AI's edit and nothing of yours: it undoes the AI's")
        #expect(button(true, ai) == .yours(canRedo: false), "once you've changed something it's your Undo")
        #expect(button(true, nil, page: true) == nil, "over a note's app the text's Undo isn't offered")
        #else
        #expect(button(true, nil) == nil, "the Mac has Edit › Undo and its receipt")
        #expect(button(false, ai) == nil)
        #endif
    }

    #if os(iOS)
    // MARK: The real note screen

    @Observable final class Shown {
        var note: Note
        init(_ note: Note) { self.note = note }
    }

    /// The note screen as RootView shows it: one controller, a new pane for each note.
    struct Screen: View {
        let shown: Shown
        let controller: EditorController
        var body: some View {
            NavigationStack {
                NoteDetailView(note: shown.note, controller: controller, onNewNote: {}).id(shown.note.id)
            }
        }
    }

    static func open(_ note: Note, _ c: ModelContainer) throws -> (UIWindow, EditorController, Shown) {
        let controller = EditorController()
        let shown = Shown(note)
        let window = try AIChangesTests.window(Screen(shown: shown, controller: controller).modelContainer(c), dark: false)
        return (window, controller, shown)
    }

    static func yours(in window: UIWindow) -> UIBarButtonItem? {
        AIChangesTests.yourUndoItem(in: window)
    }

    static func editor(_ controller: EditorController) throws -> PaneTextView {
        try #require(controller.target as? PaneTextView)
    }

    /// Types `s` at `location` (the end when nil), as its own step of Undo.
    static func type(_ s: String, at location: Int? = nil, _ controller: EditorController) async throws {
        let view = try editor(controller)
        if !view.isFirstResponder { view.becomeFirstResponder() }
        view.selectedRange = NSRange(location: location ?? (view.text as NSString).length, length: 0)
        view.insertText(s)
        try? await Task.sleep(for: .seconds(0.4))
    }

    @Test func hiddenOnOpenThenUndoesStepByStepUntilItGoes() async throws {
        let c = try AIChangesTests.container()
        let note = c.mainContext.createNote(in: .all, body: Self.body)
        let (window, controller, _) = try Self.open(note, c)
        defer { window.isHidden = true }
        try? await Task.sleep(for: .seconds(1.2))
        #expect(Self.yours(in: window) == nil, "nothing to undo when the note opens; items: \(AIChangesTests.barItems(in: window).map { $0.accessibilityIdentifier ?? $0.title ?? "?" })")
        #expect(AIChangesTests.undoItem(in: window) == nil)

        try await Self.type(" and eggs", at: (Self.body as NSString).range(of: "bread").upperBound, controller)
        try await Self.type("Sat: ", at: 0, controller)
        let view = try Self.editor(controller)
        #expect(view.text.hasPrefix("Sat: Weekend"))
        let undo = try #require(Self.yours(in: window), "a change brings Undo")
        #expect(undo.menu == nil, "nothing to redo yet: a plain button")
        #expect(AIChangesTests.aiUndoItem(in: window) == nil, "never two")

        AIChangesTests.tap(undo)
        try? await Task.sleep(for: .seconds(0.4))
        #expect(view.text == "Weekend\n\n- [ ] Market for bread and eggs\n- [ ] Call Mum", "one step back")
        let again = try #require(Self.yours(in: window), "still something to undo")
        AIChangesTests.tap(again)
        try? await Task.sleep(for: .seconds(0.4))
        #expect(view.text == Self.body, "back to the note as it opened")
        #expect(Self.yours(in: window) == nil, "and the button goes")
        controller.undo()
        try? await Task.sleep(for: .seconds(0.3))
        #expect(view.text == Self.body, "nothing before the note opened is undone")
    }

    @Test func aLongPressRedoes() async throws {
        let c = try AIChangesTests.container()
        let note = c.mainContext.createNote(in: .all, body: Self.body)
        let (window, controller, _) = try Self.open(note, c)
        defer { window.isHidden = true }
        try? await Task.sleep(for: .seconds(1.2))
        try await Self.type("!", controller)
        try await Self.type("Sat: ", at: 0, controller)
        AIChangesTests.tap(try #require(Self.yours(in: window)))
        try? await Task.sleep(for: .seconds(0.4))
        let view = try Self.editor(controller)
        #expect(!view.text.hasPrefix("Sat: "))
        #expect(controller.canRedo)
        let item = try #require(Self.yours(in: window))
        // SwiftUI builds the long press menu when it opens; Redo in it calls the controller's redo.
        #expect(item.menu != nil, "a long press offers Redo")
        controller.redo()
        try? await Task.sleep(for: .seconds(0.4))
        #expect(view.text.hasPrefix("Sat: Weekend"), "redone")
        #expect(view.text.hasSuffix("Call Mum!"))
        #expect(!controller.canRedo)
        #expect(Self.yours(in: window)?.menu == nil, "nothing left to redo: a plain button again")
    }

    @Test func switchingNotesStartsAFreshUndo() async throws {
        let c = try AIChangesTests.container()
        let first = c.mainContext.createNote(in: .all, body: Self.body)
        let second = c.mainContext.createNote(in: .all, body: "Ideas\n\nA shelf for the hall")
        let (window, controller, shown) = try Self.open(first, c)
        defer { window.isHidden = true }
        try? await Task.sleep(for: .seconds(1.2))
        try await Self.type("!", controller)
        #expect(Self.yours(in: window) != nil)

        shown.note = second
        try? await Task.sleep(for: .seconds(1.2))
        let view = try Self.editor(controller)
        #expect(view.text == "Ideas\n\nA shelf for the hall")
        #expect(!controller.canUndo, "the other note's typing isn't on this note's stack")
        #expect(Self.yours(in: window) == nil)
        controller.undo()
        try? await Task.sleep(for: .seconds(0.3))
        #expect(view.text == "Ideas\n\nA shelf for the hall")
    }

    @Test func aRemoteUpdateIsTheNewFloor() async throws {
        let c = try AIChangesTests.container()
        let note = c.mainContext.createNote(in: .all, body: Self.body)
        let (window, controller, _) = try Self.open(note, c)
        defer { window.isHidden = true }
        try? await Task.sleep(for: .seconds(1.2))
        try await Self.type("!", controller)
        try? await Task.sleep(for: .seconds(0.6))
        #expect(Self.yours(in: window) != nil)

        // Another device's change arrives while the note is open.
        let remote = Self.body + "!\n- [ ] Post the letter"
        note.body = remote
        try? await Task.sleep(for: .seconds(0.6))
        #expect(try Self.editor(controller).text == remote)
        #expect(!controller.canUndo, "nothing from before the sync can be undone into it")
        #expect(Self.yours(in: window) == nil)

        try await Self.type(" today", controller)
        #expect(try Self.editor(controller).text == remote + " today", "what you type after a sync stays")
        AIChangesTests.tap(try #require(Self.yours(in: window)))
        try? await Task.sleep(for: .seconds(0.4))
        let view = try Self.editor(controller)
        #expect(view.text == remote, "undo stops at what arrived")
        #expect(Self.yours(in: window) == nil)
    }

    /// A tick with the keyboard down is a step too.
    @Test func aTickIsAStep() async throws {
        let c = try AIChangesTests.container()
        let note = c.mainContext.createNote(in: .all, body: Self.body)
        let (window, controller, _) = try Self.open(note, c)
        defer { window.isHidden = true }
        try? await Task.sleep(for: .seconds(1.2))
        try await Self.type("!", controller)
        let view = try Self.editor(controller)
        view.resignFirstResponder()
        let line = (view.text as NSString).range(of: "- [ ] Market").location
        let edit = try #require(ListEditing.toggleCheckbox(in: view.text, lineStart: line))
        view.apply(edit)
        try? await Task.sleep(for: .seconds(0.4))
        #expect(view.text.contains("- [x] Market"))
        AIChangesTests.tap(try #require(Self.yours(in: window)))
        try? await Task.sleep(for: .seconds(0.4))
        #expect(view.text == Self.body + "!", "the tick undone, the typing kept")
        // A change made with the keyboard down is a new floor: the text view drops its typing
        // steps when its text changes that way.
        #expect(Self.yours(in: window) == nil)
        controller.undo()
        try? await Task.sleep(for: .seconds(0.3))
        #expect(view.text == Self.body + "!", "never past it")
    }

    // MARK: With an AI's edit

    @Test func anAIsChangeThenYourTypingUndoesOnlyTheTyping() async throws {
        let c = try AIChangesTests.container()
        let note = AIChangesTests.aiEdited(c, by: "ChatGPT")
        let (window, controller, _) = try Self.open(note, c)
        defer { window.isHidden = true }
        try? await Task.sleep(for: .seconds(1.5))
        let ai = try #require(AIChangesTests.aiUndoItem(in: window), "the AI's Undo first")
        #expect(ai.title == "Undo ChatGPT's changes")
        #expect(Self.yours(in: window) == nil)

        try await Self.type(" (book ahead)", controller)
        #expect(AIChangesTests.aiUndoItem(in: window) == nil, "your first keystroke makes the AI's change yours")
        AIChangesTests.tap(try #require(Self.yours(in: window), "and the same place is your Undo"))
        try? await Task.sleep(for: .seconds(0.6))
        let view = try Self.editor(controller)
        #expect(view.text == AIChangesTests.after, "only the typing is undone")
        #expect(Self.yours(in: window) == nil)
        #expect(AIChangesTests.aiUndoItem(in: window) == nil)
    }

    // MARK: Pictures

    static let shotsDir = ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"]

    @Test(arguments: [false, true])
    func pictures(dark: Bool) async throws {
        guard Self.shotsDir != nil else { return }
        let mode = dark ? "dark" : "light"
        let c = try AIChangesTests.container()
        let note = c.mainContext.createNote(in: .all, body: Self.body)
        let controller = EditorController()
        let window = try AIChangesTests.window(Screen(shown: Shown(note), controller: controller).modelContainer(c), dark: dark)
        defer { window.isHidden = true }
        try? await Task.sleep(for: .seconds(1.2))
        try Self.editor(controller).resignFirstResponder()
        try? await Task.sleep(for: .seconds(0.4))
        try AIChangesTests.shot(window, "undo-1-opened-\(mode)")
        try await Self.type(" and eggs", at: (Self.body as NSString).range(of: "bread").upperBound, controller)
        try Self.editor(controller).resignFirstResponder()
        try? await Task.sleep(for: .seconds(0.6))
        try AIChangesTests.shot(window, "undo-2-changed-\(mode)")
        window.isHidden = true

        let edited = AIChangesTests.aiEdited(c)
        let aiController = EditorController()
        let aiWindow = try AIChangesTests.window(Screen(shown: Shown(edited), controller: aiController).modelContainer(c), dark: dark)
        defer { aiWindow.isHidden = true }
        try? await Task.sleep(for: .seconds(1.5))
        try AIChangesTests.shot(aiWindow, "undo-3-ai-change-\(mode)")
    }
    #endif
}
