import Foundation
import SwiftData
import Testing
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Pane

/// Every account's first note (WelcomeNote): its words per device, written once, by one device,
/// never for an account from before; and the iPhone's hand-off after a sign-in from it.
@MainActor @Suite(.serialized) struct WelcomeNoteTests {
    /// The title is the note's first line (the editor's title), "Get started" its small ### label.
    /// On iPhone only ChatGPT connects for now.
    @Test func theIPhoneNoteSendsYouToTheMac() {
        #expect(WelcomeNote.body(for: .iPhone) == """
        Welcome

        This is your notebook.
        Your AI writes in it too.

        ### Get started
        - [ ] Get Pinto on your Mac
        - [ ] Bring your Apple Notes over
        - [ ] Connect ChatGPT

        """)
    }

    /// Part-way through, the text is always the start of the finished note's, so the editor only
    /// ever gains characters while it plays.
    @Test func everyStageIsTheStartOfTheNote() {
        let done = WelcomeNote.text(.finished(.iPhone), for: .iPhone)
        let n = WelcomeNote.items(for: .iPhone).map(\.title.count)
        let stages: [WelcomeNote.Progress] = [
            .init(), .init(title: 4), .init(title: 7, line1: 10), .init(title: 7, line1: 22, line2: 25, section: 3),
            .init(title: 7, line1: 22, line2: 25, section: 11, todos: [0]), .init(title: 7, line1: 22, line2: 25, section: 11, todos: [n[0], 6]),
        ]
        for (k, p) in stages.enumerated() { #expect(done.hasPrefix(WelcomeNote.text(p, for: .iPhone)), "stage \(k)") }
    }

    @Test func ticksAreReadBackByTitle() {
        let text = WelcomeNote.text(.finished(.iPhone), for: .iPhone, ticked: [2])
        #expect(WelcomeNote.ticks(in: text, for: .iPhone) == [2])
        // The editor may move a ticked item: it's found by its words, not its place.
        let moved = "Welcome\n\n### Get started\n- [ ] Get Pinto on your Mac\n- [x] Connect ChatGPT\n- [ ] Bring your Apple Notes over"
        #expect(WelcomeNote.ticks(in: moved, for: .iPhone) == [2])
    }

    @Test func theMacNoteSendsYouToTheIPhoneLast() {
        let items = WelcomeNote.items(for: .mac).map(\.title)
        #expect(items == ["Bring your Apple Notes over", "Connect ChatGPT or Claude", "Get Pinto on your iPhone"])
        #expect(WelcomeNote.body(for: .mac).hasPrefix("Welcome\n\nThis is your notebook.\nYour AI writes in it too.\n\n### Get started\n"))
        #if os(macOS)
        #expect(WelcomeNote.thisDevice == .mac)
        #else
        #expect(WelcomeNote.thisDevice == .iPhone)
        #endif
    }

    @Test func theSavedNoteKeepsTicksAndSaysNothingElse() {
        let body = WelcomeNote.body(for: .iPhone, ticked: [0, 2])
        #expect(body.contains("- [x] Get Pinto on your Mac"))
        #expect(body.contains("- [ ] Bring your Apple Notes over"))
        #expect(body.contains("- [x] Connect ChatGPT"))
        for name in ["ChatGPT", "Claude"] {
            #expect(!body.replacingOccurrences(of: "Connect ChatGPT", with: "").contains(name), "no word of who wrote it")
        }
        #expect(NoteText.head(of: body).title == "Welcome")
    }

    // MARK: Once per account

    private func account() -> (UUID, UserDefaults) { (UUID(), TestDefaults()) }

    @Test func aNewAccountsFirstDeviceWritesIt() async {
        let (me, defaults) = account()
        var written: [String] = []
        let id = await WelcomeNote.settle(account: me, defaults: defaults, claim: { true }, write: { written.append($0); return UUID() })
        #expect(id != nil)
        #expect(written == [WelcomeNote.body(for: WelcomeNote.thisDevice)])
    }

    @Test func anAccountFromBeforeOrAnotherDeviceWritesNothing() async {
        let (me, defaults) = account()
        var written = 0
        let id = await WelcomeNote.settle(account: me, defaults: defaults, claim: { false }, write: { _ in written += 1; return UUID() })
        #expect(id == nil)
        #expect(written == 0)
    }

    @Test func itAsksOnceAndTriesAgainOnlyAfterAFailure() async {
        let (me, defaults) = account()
        var asked = 0
        struct Offline: Error {}
        _ = await WelcomeNote.settle(account: me, defaults: defaults, claim: { asked += 1; throw Offline() }, write: { _ in UUID() })
        #expect(asked == 1)
        let id = await WelcomeNote.settle(account: me, defaults: defaults, claim: { asked += 1; return true }, write: { _ in UUID() })
        #expect(asked == 2 && id != nil, "a failed ask is tried again")
        _ = await WelcomeNote.settle(account: me, defaults: defaults, claim: { asked += 1; return true }, write: { _ in UUID() })
        #expect(asked == 2, "an answer is remembered: no second note, no second ask")
    }

    @Test func ticksFromTheWelcomeGoIntoTheNote() async {
        let (me, defaults) = account()
        WelcomeNote.ticked = [1]
        var body = ""
        _ = await WelcomeNote.settle(account: me, defaults: defaults, claim: { true }, write: { body = $0; return UUID() })
        #expect(body.contains("- [x] \(WelcomeNote.items(for: WelcomeNote.thisDevice)[1].title)"))
        #expect(WelcomeNote.ticked.isEmpty, "used once")
    }

    // MARK: The iPhone's hand-off

    /// A new account: the welcome becomes the note in the editor (Emil, 28 October 2026: "why
    /// don't we open immediately into the welcome note?").
    @Test func aNewAccountsNoteOpens() {
        let h = WelcomeHandoff()
        h.arm(ticked: [0])
        #expect(h.phase == .waiting)
        let id = UUID()
        h.settled(id)
        #expect(h.phase == .opening && h.noteID == id)
        h.opened()
        #expect(h.phase == .idle)
    }

    @Test func anAccountFromBeforeSlidesAway() {
        let h = WelcomeHandoff()
        h.arm(ticked: [])
        h.settled(nil)
        #expect(h.phase == .leaving)
        h.done()
        #expect(h.phase == .idle && h.noteID == nil)
    }

    @Test func aCancelledSignInLeavesTheWelcome() {
        let h = WelcomeHandoff()
        h.arm(ticked: [2])
        h.disarm()
        #expect(h.phase == .idle)
        h.settled(UUID())
        #expect(h.phase == .idle, "nothing to open")
    }

    // MARK: The AI's first edit

    /// The receipt the open note shows ("Claude changed 1 line", Undo) comes on the Welcome note's
    /// first AI edit like any other note's: the app writing the note doesn't count as an AI's edit.
    @Test func theFirstAIEditOfTheWelcomeNoteGetsItsReceipt() throws {
        let note = Note(body: WelcomeNote.body(for: .iPhone))
        // Written by Pinto: no AI named on it (the server keeps it so: welcome.pglite.test.ts).
        #expect(note.aiEditor == nil && note.aiEditedAt == nil)
        #expect(!AIEdit.isUnseen(note))
        let old = note.body, oldAt = note.aiEditedAt
        note.body = old + "- [ ] Buy milk\n"
        note.aiEditor = "Claude"
        note.aiEditedAt = .now
        AIEdit.arrived(note, previousBody: old, previousEditAt: oldAt, quiet: false)
        #expect(AIEdit.isUnseen(note))
        let receipt = try #require(AIEdit.markSeen(note))
        #expect(receipt.summary == "Claude changed 1 line")
        #expect(!receipt.created, "it changed the note, it didn't write it")
    }

    #if os(iOS)
    /// Played to the end without a tap, the way in comes up (it once never did: the last pause read
    /// the note being done as a skip).
    @Test func playedToTheEndTheWayInComesUp() async throws {
        WelcomeNoteView.pace = 0.01
        defer { WelcomeNoteView.pace = 1 }
        let before = WelcomeNoteView.wayInShown
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 393, height: 852))
        window.rootViewController = UIHostingController(rootView: WelcomeNoteView(backend: Backend()))
        window.isHidden = false
        defer { window.isHidden = true }
        for _ in 0..<40 where WelcomeNoteView.wayInShown == before { try await Task.sleep(for: .milliseconds(100)) }
        #expect(WelcomeNoteView.wayInShown == before + 1)
    }

    /// While it writes, the only carets are the writers': yours, then ChatGPT's and Claude's, each
    /// at the end of what it has typed, through every pause. The editor's own caret never shows,
    /// and no caret goes back to the start of the note (Emil, 29 October 2026: "in between emulated
    /// typing, the caret resets back to the first position in the note"; the blink redrew your
    /// caret where the note began).
    @Test func whileItWritesEveryCaretStaysAtTheEndOfItsText() async throws {
        WelcomeNoteView.pace = 0.4
        defer { WelcomeNoteView.pace = 1; WelcomeNoteView.stepped = nil }
        let before = WelcomeNoteView.wayInShown
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(rootView: WelcomeNoteView(backend: Backend()))
        window.isHidden = false
        defer { window.isHidden = true }
        func editor(in view: UIView) -> PaneTextView? {
            if let tv = view as? PaneTextView { return tv }
            for v in view.subviews { if let tv = editor(in: v) { return tv } }
            return nil
        }
        var steps = 0, carets = 0
        var problems: [String] = []
        WelcomeNoteView.stepped = {
            guard let tv = editor(in: window) else { return }
            steps += 1
            if tv.isFirstResponder || tv.isEditable { problems.append("step \(steps): the editor's own caret could show") }
            let length = (tv.text as NSString).length
            guard length > 0 else { return }
            let end = tv.caretRect(for: tv.endOfDocument), start = tv.caretRect(for: tv.beginningOfDocument)
            for id in [WelcomeEditorPage.yours, WelcomeEditorPage.theirs] {
                guard let bar = tv.remoteCaretFrame(id) else { continue }
                carets += 1
                // A caret is drawn a point left of its place (see layoutRemoteCarets); one sampled a
                // keystroke early is a letter short of the end.
                if abs(bar.minY - end.minY) > 1 || abs(bar.minX + 1 - end.minX) > 14 {
                    problems.append("step \(steps): caret at \(bar.origin), the text ends at \(end.origin), the note starts at \(start.origin)")
                }
            }
        }
        for _ in 0..<100 where WelcomeNoteView.wayInShown == before { try await Task.sleep(for: .milliseconds(100)) }
        #expect(WelcomeNoteView.wayInShown == before + 1, "played to the end")
        #expect(steps > 60 && carets > 60, "sampled \(steps) steps, \(carets) carets")
        #expect(problems.isEmpty, "\(problems.prefix(5))")
    }


    static func textView(in view: UIView) -> PaneTextView? {
        if let tv = view as? PaneTextView { return tv }
        for v in view.subviews { if let tv = textView(in: v) { return tv } }
        return nil
    }

    static func window(_ view: some View) throws -> UIWindow {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: size)
        window.rootViewController = UIHostingController(rootView: view)
        window.isHidden = false
        return window
    }

    /// Signed out, the welcome is only shown (Emil, 29 October 2026: a tap brought up the keyboard
    /// bar, and its to-dos ticked): a tap on the note or a checkbox changes nothing, nothing takes
    /// focus, there's no keyboard bar, no selection and nothing for VoiceOver to edit.
    @Test func signedOutTheWelcomeCantBeTouched() async throws {
        let window = try Self.window(WelcomeNoteView(backend: Backend(), finished: true))
        defer { window.isHidden = true }
        window.makeKey()
        try? await Task.sleep(for: .seconds(1))
        let tv = try #require(Self.textView(in: window))
        let before = tv.text
        let line = try #require(before?.range(of: "- [ ] Bring")).lowerBound.utf16Offset(in: before ?? "")
        let box = try #require(tv.checkboxCenter(line: line), "the second to-do's circle")
        tv.tapCheckbox(at: box)
        #expect(!tv.becomeFirstResponder(), "the note takes no focus")
        try? await Task.sleep(for: .milliseconds(300))
        #expect(tv.text == before, "nothing ticked or changed")
        #expect(!tv.isFirstResponder && tv.inputAccessoryView?.window == nil, "no keyboard, no keyboard bar")
        // Not editable: VoiceOver reads the text as text and offers nothing to edit.
        #expect(!tv.isEditable && !tv.isSelectable, "no caret, selection, menu, link taps or edit actions")
        #expect(!tv.accessibilityElementsHidden, "VoiceOver still reads it")
    }

    /// Handed over, it's an ordinary note: a tick works and so does typing.
    @Test func handedOverTheNoteTicksAndEdits() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = c.mainContext.createNote(in: .all, body: WelcomeNote.body(for: .iPhone))
        let window = try Self.window(NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c))
        defer { window.isHidden = true }
        window.makeKey()
        try? await Task.sleep(for: .seconds(1))
        let tv = try #require(Self.textView(in: window))
        let text = tv.text ?? ""
        let line = try #require(text.range(of: "- [ ] Bring")).lowerBound.utf16Offset(in: text)
        tv.tapCheckbox(at: try #require(tv.checkboxCenter(line: line)))
        #expect(tv.text.contains("- [x] Bring your Apple Notes over"), "ticked")
        #expect(tv.becomeFirstResponder(), "it takes focus")
        tv.selectedRange = NSRange(location: (tv.text as NSString).length, length: 0)
        tv.insertText("Buy milk")
        #expect(tv.text.hasSuffix("Buy milk"), "typing works")
        tv.resignFirstResponder()
    }

    /// One picture of `view` in an offscreen window the size of an iPhone 17 Pro, with where the
    /// editor's date line is, the top of the safe area, and the bottom of the navigation bar (if any).
    struct Drawn {
        let image: CGImage
        let dateY: CGFloat
        let safeTop: CGFloat
        let barBottom: CGFloat?
    }

    static let size = CGSize(width: 402, height: 874)
    static let date = Date(timeIntervalSince1970: 1_800_000_000)
    static let ticked: Set<Int> = [0]

    static func draw(_ view: some View, dark: Bool = false) async throws -> Drawn {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: size)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.rootViewController = UIHostingController(rootView: view.tint(Color(PColor.paneAccent)).environment(\.locale, Locale(identifier: "en_US")))
        window.isHidden = false
        defer { window.isHidden = true }
        try? await Task.sleep(for: .seconds(1.2))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        func find<T: UIView>(_ type: T.Type, in v: UIView, where ok: (T) -> Bool = { _ in true }) -> T? {
            if let t = v as? T, ok(t), !t.isHidden { return t }
            for s in v.subviews { if let t = find(type, in: s, where: ok) { return t } }
            return nil
        }
        let label = try #require(find(UILabel.self, in: window) { $0.accessibilityIdentifier == "editor.date" }, "the date line")
        return Drawn(image: try #require(image.cgImage), dateY: label.convert(label.bounds, to: window).minY, safeTop: window.safeAreaInsets.top,
                     barBottom: find(UINavigationBar.self, in: window).map { $0.convert($0.bounds, to: window).maxY })
    }

    static func editor(dark: Bool = false) async throws -> Drawn {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = c.mainContext.createNote(in: .all, body: WelcomeNote.body(for: .iPhone, ticked: ticked))
        note.updatedAt = date
        // As the hand-off opens it: with its date in view (another note opens at its title).
        let kept = WelcomeNote.ticked
        WelcomeHandoff.shared.arm(ticked: ticked)
        WelcomeHandoff.shared.settled(note.id)
        defer { WelcomeHandoff.shared.done(); WelcomeNote.ticked = kept }
        return try await draw(NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c), dark: dark)
    }

    /// The hand-off's page settled, over the paper of the note screen opening under it.
    static func settled(dark: Bool = false) async throws -> Drawn {
        try await draw(WelcomeHandoffPage(ticked: .constant(ticked), settled: true, date: date).background(Color.notePage.ignoresSafeArea()), dark: dark)
    }

    /// The welcome starts high: its date sits under the status bar as far as the note screen's date
    /// sits under its bar, with no room kept for a bar (Emil, 29 October 2026: "you made it have the
    /// top section but invisible during welcome screen. it looks a bit odd").
    @Test func theWelcomesDateSitsJustUnderTheStatusBar() async throws {
        let welcome = try await Self.draw(WelcomeEditorPage(ticked: .constant(Self.ticked), date: Self.date))
        let editor = try await Self.editor()
        let barBottom = try #require(editor.barBottom, "the note screen has its bar")
        let spacing = editor.dateY - barBottom
        #expect(spacing > 0 && spacing < 30, "the note screen's date is \(spacing) pt under its bar")
        #expect(welcome.safeTop > 20, "a window with a status bar")
        #expect(welcome.dateY >= welcome.safeTop, "under the status bar")
        #expect(welcome.dateY - welcome.safeTop <= spacing + 2, "the welcome's date is \(welcome.dateY - welcome.safeTop) pt under the status bar")
    }

    /// Settled after a sign-in, the note is exactly where the note screen puts it.
    @Test func afterTheHandOffTheNoteIsWhereTheEditorPutsIt() async throws {
        let settled = try await Self.settled()
        let editor = try await Self.editor()
        #expect(abs(settled.dateY - editor.dateY) < 0.5, "date at \(settled.dateY), the editor's at \(editor.dateY)")
    }

    /// The welcome, finished, and the editor showing the saved note are the same picture where the
    /// note is (Emil, 28 October 2026: "why does the welcome note look different when actually
    /// open?"), so the welcome turning into the note can't be seen: the welcome a bar higher, and
    /// the hand-off's page settled exactly. Drawn in the same window, light and dark; the note's
    /// region (below the top buttons, above the bottom ones) compared pixel by pixel.
    @Test(arguments: [false, true])
    func theWelcomeIsTheNoteAsTheEditorShowsIt(dark: Bool) async throws {
        let welcome = try await Self.draw(WelcomeEditorPage(ticked: .constant(Self.ticked), date: Self.date), dark: dark)
        let settled = try await Self.settled(dark: dark)
        let editor = try await Self.editor(dark: dark)
        if let dir = ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map({ URL(fileURLWithPath: $0) }) {
            for (name, d) in [("welcome", welcome), ("settled", settled), ("editor", editor)] {
                try UIImage(cgImage: d.image).pngData()?.write(to: dir.appending(path: "welcome-match-\(name)-\(dark ? "dark" : "light").png"))
            }
        }
        let region = CGRect(x: 0, y: 110, width: Self.size.width, height: 400)
        // The welcome is the note a bar higher: the one shift for the whole page.
        let shift = editor.dateY - welcome.dateY
        #expect(shift > 30 && shift < 80, "the note screen's bar is \(shift) pt")
        let shifted = try Self.difference(welcome.image, editor.image, in: region.offsetBy(dx: 0, dy: -shift.rounded()), region)
        #expect(shifted < 0.01, "mean difference \(shifted) in the note's region, the welcome \(shift) pt higher")
        let exact = try Self.difference(settled.image, editor.image, in: region)
        #expect(exact < 0.01, "mean difference \(exact) in the note's region, settled")
    }

    /// The mean difference of two images in `region` (of `b`, `regionB` when it's elsewhere), 0
    /// (the same) to 1, over RGB.
    static func difference(_ a: CGImage, _ b: CGImage, in region: CGRect, _ regionB: CGRect? = nil) throws -> Double {
        func pixels(_ image: CGImage, _ region: CGRect) throws -> [UInt8] {
            let w = Int(region.width), h = Int(region.height)
            var data = [UInt8](repeating: 0, count: w * h * 4)
            let ctx = try #require(CGContext(data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                             space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
            ctx.draw(image, in: CGRect(x: -region.minX, y: -(CGFloat(image.height) - region.maxY), width: CGFloat(image.width), height: CGFloat(image.height)))
            return data
        }
        let p = try pixels(a, region), q = try pixels(b, regionB ?? region)
        var total = 0.0
        for i in stride(from: 0, to: p.count, by: 4) {
            total += Double(abs(Int(p[i]) - Int(q[i])) + abs(Int(p[i + 1]) - Int(q[i + 1])) + abs(Int(p[i + 2]) - Int(q[i + 2]))) / (3 * 255)
        }
        return total / Double(p.count / 4)
    }
    #endif
}

/// After a sign-in from the welcome note (Emil, 28 October 2026: the key screens came up between
/// signing in and the note, and the library flashed by). A new account's key, made here, needs
/// nobody: no key screen, and the note stays until it opens. An account from before that needs the
/// person (another device, the recovery key) gets its screens, and the note steps aside.
@MainActor @Suite struct WelcomeKeyGateTests {
    /// Every state a new account's key passes through on the way: none shows the gate.
    @Test func aNewAccountFromTheWelcomeNoteNeverSeesTheKeyGate() {
        let h = WelcomeHandoff()
        h.arm(ticked: [], way: .apple)
        for (phase, needsWelcome, keyIsAccounts) in [(AccountCrypto.Phase.off, false, false), (.checking, false, false), (.checking, false, true),
                                                     (.unreachable, false, true), (.ready, true, true), (.ready, false, true)] {
            let needs = AppGate.keyNeedsPerson(phase: phase, asksBeforeFetch: false, needsSignIn: false)
            #expect(!needs, "\(phase): nothing for the person to do")
            #expect(!AppGate.gateShown(phase: phase, needsWelcome: needsWelcome, keyIsAccounts: keyIsAccounts, handingOff: true, needsPerson: needs),
                    "\(phase): the key screen stays behind the note")
            if needs { h.leave() }
        }
        #expect(h.phase == .waiting, "the hand-off isn't left: the note will open")
        // "Your notes are encrypted" is marked as said, for a key made here only.
        #expect(AppGate.welcomesSilently(handingOff: true, phase: .ready, needsWelcome: true, arrivedHow: .made))
        #expect(!AppGate.welcomesSilently(handingOff: true, phase: .ready, needsWelcome: true, arrivedHow: .signIn), "a key fetched for an account from before")
        #expect(!AppGate.welcomesSilently(handingOff: false, phase: .ready, needsWelcome: true, arrivedHow: .made), "no hand-off, the screen says it")
    }

    @Test func anAccountThatNeedsItsRecoveryKeyGetsTheGateAndTheNoteStepsAside() {
        let h = WelcomeHandoff()
        h.arm(ticked: [], way: .google)
        for (phase, asks, signIn) in [(AccountCrypto.Phase.waiting, false, false), (.mismatch, false, false), (.accountGone, false, false),
                                      (.checking, true, false), (.ready, false, true)] {
            let needs = AppGate.keyNeedsPerson(phase: phase, asksBeforeFetch: asks, needsSignIn: signIn)
            #expect(needs, "\(phase): the person has something to do")
            #expect(AppGate.gateShown(phase: phase == .ready ? .checking : phase, needsWelcome: false, keyIsAccounts: true, handingOff: true, needsPerson: needs))
        }
        h.leave()
        #expect(h.phase == .leaving, "the note steps aside")
        h.done()
        #expect(AppGate.gateShown(phase: .waiting, needsWelcome: false, keyIsAccounts: true, handingOff: false, needsPerson: true))
    }

    /// Without a hand-off the gate is what it was.
    @Test func withoutAHandOffTheGateIsUnchanged() {
        #expect(AppGate.gateShown(phase: .checking, needsWelcome: false, keyIsAccounts: true, handingOff: false, needsPerson: false))
        #expect(AppGate.gateShown(phase: .ready, needsWelcome: true, keyIsAccounts: true, handingOff: false, needsPerson: false))
        #expect(!AppGate.gateShown(phase: .ready, needsWelcome: false, keyIsAccounts: true, handingOff: false, needsPerson: false))
        #expect(AppGate.gateShown(phase: .ready, needsWelcome: false, keyIsAccounts: false, handingOff: false, needsPerson: false))
    }
}
