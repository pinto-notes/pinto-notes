#if os(iOS)
import SwiftData
import SwiftUI
import UIKit
import Testing
@testable import Pane

/// The caret on the iPhone is always the size of what you're about to type (Emil, 30 October
/// 2026: in a new note it was small before the first letter and big after it; on the line after
/// the title it was big, then small once you typed). And the first tap into a note puts the caret
/// where you tapped.
@MainActor @Suite(.serialized) struct EditorCaretTests {
    func make(_ text: String, dark: Bool = false) async throws -> (UIWindow, PaneTextView) {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.rootViewController = UIViewController()
        window.isHidden = false
        let v = PaneTextView(frame: window.bounds)
        v.configure(text: text, header: "")
        window.rootViewController!.view.addSubview(v)
        v.layoutIfNeeded()
        return (window, v)
    }

    func settle() async { try? await Task.sleep(for: .seconds(0.15)) }

    /// The caret as drawn: the cursor view UIKit shows, which follows caretRect(for:).
    func caret(_ v: PaneTextView) -> CGRect {
        v.caretRect(for: v.selectedTextRange!.end)
    }

    @Test(arguments: [false, true])
    func aNewNotesCaretIsTitleSizedBeforeAndAfterTheFirstLetter(dark: Bool) async throws {
        let (window, v) = try await make("", dark: dark)
        defer { window.isHidden = true }
        v.becomeFirstResponder()
        await settle()
        let before = caret(v).height
        v.insertText("T")
        await settle()
        let after = caret(v).height
        #expect(abs(before - after) < 0.5, "empty \(before), after a letter \(after)")
        #expect(abs(before - MarkdownStyler.titleFont.lineHeight) < 3, "empty \(before), the title's line \(MarkdownStyler.titleFont.lineHeight)")
        await shot(window, "caret-new-note-\(dark ? "dark" : "light")")
    }

    /// Return at the end of the title: the new line's caret is the body's. (With a blank line above
    /// the title, UIKit's caret there was 29 pt, the body's line and its spacing, and 22 once you typed.)
    @Test(arguments: [false, true])
    func theLineAfterTheTitleHasABodyCaretBeforeAndAfterTyping(dark: Bool) async throws {
        let (window, v) = try await make("\nWeekend", dark: dark)
        defer { window.isHidden = true }
        v.becomeFirstResponder()
        await settle()
        v.selectedRange = NSRange(location: 8, length: 0)
        await settle()
        let title = caret(v).height
        v.insertText("\n")
        await settle()
        let empty = caret(v).height
        v.insertText("b")
        await settle()
        let typed = caret(v).height
        let body = v.core.styler.bodyFont.lineHeight
        #expect(title > body + 10, "the title's caret is big: \(title)")
        #expect(abs(empty - typed) < 0.5, "new line \(empty), after a letter \(typed)")
        #expect(abs(empty - body) < 3, "new line \(empty), the body's line \(body)")
        await shot(window, "caret-body-line-\(dark ? "dark" : "light")")
    }

    /// On an empty line between two lines of text, the caret sits where the letter will be drawn:
    /// the same y before and after it's typed. TextKit counts the empty line's spacing in the line
    /// and put the caret at its top, 6⅔ pt above the letter (Emil, 30 October 2026).
    @Test(arguments: [("Weekend\nBody", "Weekend"), ("Weekend\n\nFirst day\nSecond day", "First day")])
    func anEmptyLinesCaretSitsWhereTheLetterWillBe(text: String, after: String) async throws {
        let (window, v) = try await make(text)
        defer { window.isHidden = true }
        v.becomeFirstResponder()
        v.selectedRange = NSRange(location: NSMaxRange((text as NSString).range(of: after)), length: 0)
        await settle()
        v.insertText("\n")
        await settle()
        let empty = caret(v)
        v.insertText("b")
        await settle()
        let typed = caret(v)
        #expect(abs(empty.minY - typed.minY) < 0.5, "empty line \(empty.minY), after a letter \(typed.minY)")
        #expect(abs(empty.maxY - typed.maxY) < 0.5, "empty line ends \(empty.maxY), after a letter \(typed.maxY)")
    }

    /// An empty first line above the text is the title's line: typing there makes the title.
    @Test func anEmptyFirstLineHasATitleCaret() async throws {
        let (window, v) = try await make("\nSome text")
        defer { window.isHidden = true }
        v.becomeFirstResponder()
        v.selectedRange = NSRange(location: 0, length: 0)
        await settle()
        #expect(abs(caret(v).height - MarkdownStyler.titleFont.lineHeight) < 3, "\(caret(v).height)")
        // A blank line lower down is a body line.
        v.selectedRange = NSRange(location: (v.text as NSString).length, length: 0)
        v.insertText("\n")
        await settle()
        #expect(abs(caret(v).height - v.core.styler.bodyFont.lineHeight) < 3, "\(caret(v).height)")
    }

    // MARK: The date

    /// The note screen as the app shows it, in a window off screen.
    func noteScreen(_ body: String, dark: Bool) async throws -> (UIWindow, PaneTextView, UILabel) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = c.mainContext.createNote(in: .all, body: body)
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.rootViewController = UIHostingController(rootView: NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c))
        window.isHidden = false
        try await Task.sleep(for: .seconds(1.2))
        func find<T: UIView>(_ type: T.Type, in v: UIView, where ok: (T) -> Bool = { _ in true }) -> T? {
            if let t = v as? T, ok(t) { return t }
            for s in v.subviews { if let t = find(type, in: s, where: ok) { return t } }
            return nil
        }
        let editor = try #require(find(PaneTextView.self, in: window))
        let label = try #require(find(UILabel.self, in: editor) { $0.accessibilityIdentifier == "editor.date" })
        return (window, editor, label)
    }

    /// The top of what you can see of the text, in the text view's coordinates (under the bar).
    func visibleTop(_ v: PaneTextView) -> CGFloat { v.contentOffset.y + v.adjustedContentInset.top }

    /// A note opens at its title: the date is just above the top, and the title sits where the date
    /// began, with no gap (Emil, 30 October 2026: "by default you only see the title").
    /// Pulled down past the top, the date shows.
    @Test(arguments: [false, true])
    func theDateShowsOnlyWhenPulledDown(dark: Bool) async throws {
        let (window, v, date) = try await noteScreen("Lisbon\n\nFour days of tiles, trams and pastries in May.", dark: dark)
        defer { window.isHidden = true }
        #expect(!(date.text ?? "").isEmpty)
        #expect(date.frame.maxY <= visibleTop(v) + 0.5, "the date \(date.frame) is above the top \(visibleTop(v))")
        let title = v.caretRect(for: v.beginningOfDocument)
        #expect(abs(title.minY - visibleTop(v) - DateFold.labelTop) < 1.5, "the title is \(title.minY - visibleTop(v)) pt under the top, the date began \(DateFold.labelTop)")
        await shot(window, "date-folded-\(dark ? "dark" : "light")")

        // A pull down past the top.
        v.delegate?.scrollViewWillBeginDragging?(v)
        v.contentOffset = CGPoint(x: 0, y: -v.adjustedContentInset.top)
        v.setNeedsLayout()
        v.layoutIfNeeded()
        #expect(date.frame.minY >= visibleTop(v) - 0.5, "pulled down, the date \(date.frame) shows under the top \(visibleTop(v))")
        await shot(window, "date-pulled-\(dark ? "dark" : "light")")
    }

    /// The note the welcome becomes keeps the date in view, as the welcome showed it.
    @Test func theWelcomesNoteOpensWithItsDate() async throws {
        let kept = WelcomeNote.ticked
        defer { WelcomeNote.ticked = kept }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = c.mainContext.createNote(in: .all, body: WelcomeNote.body(for: .iPhone))
        WelcomeHandoff.shared.arm(ticked: [])
        WelcomeHandoff.shared.settled(note.id)
        defer { WelcomeHandoff.shared.done() }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(rootView: NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c))
        window.isHidden = false
        defer { window.isHidden = true }
        try await Task.sleep(for: .seconds(1.2))
        func find<T: UIView>(_ type: T.Type, in v: UIView) -> T? {
            if let t = v as? T { return t }
            for s in v.subviews { if let t = find(type, in: s) { return t } }
            return nil
        }
        let v = try #require(find(PaneTextView.self, in: window))
        #expect(v.contentOffset.y <= -v.adjustedContentInset.top + 0.5, "opened at the very top, offset \(v.contentOffset.y)")
    }

    // MARK: The first tap

    /// The first tap into a note that isn't being edited: UIKit makes the text view first responder
    /// and then puts the caret where you tapped. Becoming first responder restyled the text there
    /// and then, and UIKit dropped the tap's caret: it stayed at the end of the note (Emil, 30
    /// October 2026). So nothing touches the text until the tap's caret is in.
    /// (PaneUITests/EditorTapUITests taps for real.)
    @Test func becomingFirstResponderLeavesTheTextAloneUntilTheTapsCaretIsIn() async throws {
        let (window, v) = try await make("Groceries\n\nFor the weekend.\n\n- [ ] Oat milk\n- [ ] Lemons")
        defer { window.isHidden = true }
        await settle()
        var edits = 0
        let watch = NotificationCenter.default.addObserver(forName: NSTextStorage.didProcessEditingNotification, object: v.textStorage, queue: nil) { _ in edits += 1 }
        defer { NotificationCenter.default.removeObserver(watch) }
        #expect(v.becomeFirstResponder())
        #expect(edits == 0, "the text was restyled while the tap was still placing the caret")
        // As the tap does next: the caret at the tapped character, here in "weekend".
        let tapped = (v.text as NSString).range(of: "weekend").location
        v.selectedRange = NSRange(location: tapped, length: 0)
        await settle()
        #expect(v.selectedRange == NSRange(location: tapped, length: 0))
        #expect(edits > 0, "the caret's line was styled for editing once the caret was in")
    }

    func shot(_ window: UIWindow, _ name: String) async {
        guard let dir = ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try? await Task.sleep(for: .seconds(0.3))
        let image = UIGraphicsImageRenderer(bounds: window.bounds).image { _ in window.drawHierarchy(in: window.bounds, afterScreenUpdates: true) }
        try? image.pngData()?.write(to: dir.appending(path: "\(name).png"))
    }
}
#endif

#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// The Mac shares the editor's core: a new note's caret is the title's size before the first
/// letter as well as after it, and a new body line's is the body's.
@MainActor @Suite(.serialized) struct EditorCaretMacTests {
    /// The caret's line as the text system reports it (what the caret and the input methods use).
    func caretHeight(_ h: EditorHarness) -> CGFloat {
        h.view.firstRect(forCharacterRange: h.view.selectedRange(), actualRange: nil).height
    }

    @Test(arguments: [false, true])
    func aNewNotesCaretIsTitleSizedBeforeAndAfterTheFirstLetter(dark: Bool) async {
        let h = await EditorHarness("", dark: dark)
        defer { h.close() }
        let before = caretHeight(h)
        await h.type("T")
        let after = caretHeight(h)
        #expect(abs(before - after) < 0.5, "empty \(before), after a letter \(after)")
        await h.type("itle")
        await h.press(EditorHarness.returnKey)
        let line = caretHeight(h)
        await h.type("b")
        let typed = caretHeight(h)
        #expect(abs(line - typed) < 0.5, "new line \(line), after a letter \(typed)")
        #expect(after > typed + 8, "title \(after), body \(typed)")
        await h.snapshot("caret-mac-\(dark ? "dark" : "light")")
    }

    /// On an empty line between two lines, the caret's baseline is the letter's: the bottom of its
    /// rect (screen coordinates count up from the bottom) is the same before and after typing.
    @Test func anEmptyLinesCaretSitsWhereTheLetterWillBe() async {
        let h = await EditorHarness("Weekend\nBody")
        defer { h.close() }
        await h.caret(after: "Weekend")
        await h.press(EditorHarness.returnKey)
        let empty = h.view.firstRect(forCharacterRange: h.view.selectedRange(), actualRange: nil)
        await h.type("b")
        let typed = h.view.firstRect(forCharacterRange: h.view.selectedRange(), actualRange: nil)
        #expect(abs(empty.minY - typed.minY) < 0.5, "empty line's baseline \(empty.minY), after a letter \(typed.minY)")
    }
}
#endif
