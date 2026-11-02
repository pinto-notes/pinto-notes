#if os(iOS)
import SwiftData
import SwiftUI
import Testing
import UIKit
@testable import Pane

/// The iPhone app's rendering, measured in the simulator (docs/Investigations/ios-render-audit-2026-11-02.md).
/// The real RootView at iPhone size in a window of the test host, on an in-memory library. Notes
/// open the way the menu bar and links open them (NoteOpener), Back pops the navigation stack as
/// the back button does, and keys go into the editor the way the keyboard puts them there: no
/// input events. Each test counts the bodies of the big views (RenderProbe) along one path.
@MainActor @Suite(.serialized) struct PhoneRenderTests {
    static func ms(_ d: Duration) -> Double {
        Double(d.components.seconds) * 1000 + Double(d.components.attoseconds) / 1e15
    }

    static func library(notes count: Int) throws -> (ModelContainer, [Note]) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let folder = Folder(name: "Notes")
        ctx.insert(folder)
        var notes: [Note] = []
        for i in 0..<count {
            let n = Note(body: "Note \(i)\n\nSome text for note \(i), with **bold** and a list:\n- one\n- two\n", folder: folder)
            n.updatedAt = Date().addingTimeInterval(Double(-i * 3600))
            ctx.insert(n)
            notes.append(n)
        }
        try ctx.save()
        return (c, notes)
    }

    /// The notes window as the app shows it on an iPhone 17 Pro, opened on All Notes.
    static func window(notes count: Int) throws -> (UIWindow, ModelContainer, [Note]) {
        UserDefaults.standard.removeObject(forKey: "lastScope")
        UserDefaults.standard.removeObject(forKey: "lastNote")
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let (c, notes) = try library(notes: count)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(rootView: RootView().modelContainer(c))
        window.isHidden = false
        return (window, c, notes)
    }

    static func update(_ window: UIWindow) async {
        for _ in 0..<4 { await Task.yield() }
        window.layoutIfNeeded()
    }

    static func settle(_ window: UIWindow, seconds: Double = 0.5) async {
        let clock = ContinuousClock()
        let end = clock.now + .milliseconds(Int(seconds * 1000))
        while clock.now < end {
            try? await Task.sleep(for: .milliseconds(30))
            window.layoutIfNeeded()
        }
    }

    static func find<T: UIView>(_ type: T.Type, in view: UIView) -> T? {
        if let v = view as? T { return v }
        for s in view.subviews { if let v = find(type, in: s) { return v } }
        return nil
    }

    static func all<T: UIView>(_ type: T.Type, in view: UIView) -> [T] {
        var out: [T] = []
        if let v = view as? T { out.append(v) }
        for s in view.subviews { out += all(type, in: s) }
        return out
    }

    static func editor(in window: UIWindow) -> PaneTextView? {
        all(PaneTextView.self, in: window).first { $0.window != nil && !$0.isHidden }
    }

    static func navigation(in window: UIWindow) -> UINavigationController? {
        func walk(_ vc: UIViewController) -> UINavigationController? {
            if let n = vc as? UINavigationController, n.viewControllers.count > 1 { return n }
            for c in vc.children { if let n = walk(c) { return n } }
            return nil
        }
        return window.rootViewController.flatMap(walk)
    }

    /// Opens a note and waits until its editor shows it.
    static func open(_ note: Note, in window: UIWindow) async throws {
        NoteOpener.shared.request = note.id
        for _ in 0..<60 {
            await update(window)
            if editor(in: window)?.text.contains(note.title) == true { return }
            try? await Task.sleep(for: .milliseconds(5))
        }
        Issue.record("The note \(note.title) did not open")
    }

    /// Back, as the back button does it, and waits until the editor has gone.
    static func back(in window: UIWindow) async throws {
        let nav = try #require(navigation(in: window), "a navigation stack with the note on it")
        nav.popViewController(animated: false)
        for _ in 0..<60 {
            await update(window)
            if editor(in: window) == nil { return }
            try? await Task.sleep(for: .milliseconds(5))
        }
        Issue.record("Back left the editor up")
    }

    static func line(_ counts: [String: Int]) -> String {
        counts.sorted { $0.key < $1.key }.map { "\($0.key) \($0.value)" }.joined(separator: ", ")
    }

    /// The import actions reach the folders and the list through the environment, which compares a
    /// new value with the old one bit by bit. With closures in it, every pass of the window made a
    /// value that differed, unless a freed closure's memory happened to be reused: the folders and
    /// the list were worked out again on some note opens and not others (3 runs in 7 on 2026-11-02).
    /// One reference to the window's box is the same bits on every pass.
    @Test func importActionsAreOneReference() {
        #expect(MemoryLayout<ImportActions>.size == MemoryLayout<AnyObject>.size, "no closures in the value itself")
        let box = ImportActions.Box()
        var calls = 0
        box.appleNotes = { calls += 1 }
        let a = ImportActions(box: box), b = ImportActions(box: box)
        #expect(a == b)
        withUnsafeBytes(of: a) { x in withUnsafeBytes(of: b) { y in #expect(Array(x) == Array(y), "the same bits from two passes") } }
        box.appleNotes = { calls += 10 }
        a.appleNotes()
        #expect(calls == 10, "the newest action runs")
    }

    // MARK: Paths

    @Test func launchToTheList() async throws {
        let clock = ContinuousClock()
        let start = clock.now
        let (c, notes) = try Self.library(notes: 200)
        RenderProbe.begin(in: c.mainContext)
        defer { RenderProbe.end(in: c.mainContext) }
        UserDefaults.standard.removeObject(forKey: "lastScope")
        UserDefaults.standard.removeObject(forKey: "lastNote")
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(rootView: RootView().modelContainer(c))
        window.isHidden = false
        defer { window.isHidden = true }
        var shown: Double?
        for _ in 0..<200 {
            await Self.update(window)
            // An iPhone launch reopens the note edited last, over its list (RootView.restoreNote).
            if Self.editor(in: window)?.text.contains(notes[0].title) == true { shown = Self.ms(clock.now - start); break }
            try? await Task.sleep(for: .milliseconds(5))
        }
        await Self.settle(window, seconds: 1)
        let counts = RenderProbe.values(in: c.mainContext)
        print("PERF iphone launch: last note shown \(shown ?? -1) ms; bodies \(Self.line(counts))")
        // Printed, not judged: the counts at launch change from run to run (the scene's own
        // environment settling), between 5 and 12 for the list with the same code.
        #expect(shown != nil)
    }

    @Test func openAndBack() async throws {
        let (window, c, notes) = try Self.window(notes: 200)
        defer { window.isHidden = true }
        await Self.settle(window, seconds: 1)
        try await Self.open(notes[0], in: window)
        await Self.settle(window)
        try await Self.back(in: window)
        await Self.settle(window)
        var opens: [Double] = [], backs: [Double] = []
        var openCounts: [String: Int] = [:], backCounts: [String: Int] = [:]
        let clock = ContinuousClock()
        let rounds = 5
        for i in 1...rounds {
            RenderProbe.begin(in: c.mainContext)
            var t = clock.now
            try await Self.open(notes[i], in: window)
            opens.append(Self.ms(clock.now - t))
            await Self.settle(window)
            openCounts.merge(RenderProbe.values(in: c.mainContext), uniquingKeysWith: +)
            RenderProbe.begin(in: c.mainContext)
            t = clock.now
            try await Self.back(in: window)
            backs.append(Self.ms(clock.now - t))
            await Self.settle(window)
            backCounts.merge(RenderProbe.values(in: c.mainContext), uniquingKeysWith: +)
        }
        RenderProbe.end(in: c.mainContext)
        print("PERF iphone open: median \(PerfTiming.median(opens)) ms; bodies over \(rounds) opens \(Self.line(openCounts))")
        print("PERF iphone back: median \(PerfTiming.median(backs)) ms; bodies over \(rounds) backs \(Self.line(backCounts))")
        // The folders lie under the stack: neither an open nor Back works them out (they were
        // 4 and 1 times over five each, because the import actions counted as changed every pass).
        #expect(openCounts["SidebarView"] == nil, "opening a note leaves the folders alone")
        #expect(backCounts["SidebarView"] == nil, "and so does Back")
        // The list follows the selection once per step (it was 7 times for five opens).
        #expect((openCounts["NoteListView"] ?? 0) <= rounds, "the list updates once per note opened")
        #expect((backCounts["NoteListView"] ?? 0) <= rounds, "and once per Back")
        #expect((openCounts["NoteDetailView"] ?? 0) <= rounds, "the opened note's pane is built once")
        #expect(backCounts["NoteDetailView"] == nil, "the note being left isn't worked out again on its way out")
        // Loose: the counts above are the guard; this catches a step many times slower.
        #expect(PerfTiming.median(opens) < 500 * PerfBudget.slack)
        #expect(PerfTiming.median(backs) < 400 * PerfBudget.slack)
    }

    @Test func typing() async throws {
        let (window, c, notes) = try Self.window(notes: 200)
        defer { window.isHidden = true }
        await Self.settle(window, seconds: 1)
        try await Self.open(notes[3], in: window)
        await Self.settle(window)
        let text = try #require(Self.editor(in: window))
        text.becomeFirstResponder()
        await Self.settle(window)
        text.selectedRange = NSRange(location: (text.text as NSString).length, length: 0)
        await Self.settle(window, seconds: 0.6)
        HoverProbe.enabled = true
        RenderProbe.counts = [:]
        RenderProbe.begin(in: c.mainContext)
        defer { HoverProbe.enabled = false; RenderProbe.counts = [:]; RenderProbe.end(in: c.mainContext) }
        let keys = 10
        var times: [Double] = []
        let clock = ContinuousClock()
        for _ in 0..<keys {
            let t = clock.now
            text.insertText("a")
            await Self.update(window)
            times.append(Self.ms(clock.now - t))
            try? await Task.sleep(for: .milliseconds(40))
        }
        let perKey = RenderProbe.values(in: c.mainContext).merging(RenderProbe.counts.filter { $0.key == "FormatBar" }, uniquingKeysWith: +)
        RenderProbe.begin(in: c.mainContext)
        RenderProbe.counts = [:]
        // The editor writes the note once typing pauses.
        await Self.settle(window, seconds: 1)
        let save = RenderProbe.values(in: c.mainContext).merging(RenderProbe.counts.filter { $0.key == "FormatBar" }, uniquingKeysWith: +)
        print("PERF iphone typing: median key \(PerfTiming.median(times)) ms; bodies over \(keys) keys \(Self.line(perKey)); after the save \(Self.line(save))")
        // A key reaches the editor and nothing above it: no window, no list row, no keyboard bar.
        let both = perKey.merging(save, uniquingKeysWith: +)
        #expect(both["RootView"] == nil, "typing never works the window out")
        #expect(both["NoteRow"] == nil, "nor a row of the list under the note")
        #expect((both["FormatBar"] ?? 0) <= 1, "nor the bar above the keyboard, past its first update")
        #expect((perKey["NoteDetailView"] ?? 0) <= 1, "the note pane only for Undo becoming possible")
        // Left as it is (see the audit): each save still works out the folders under the stack up
        // to three times, from SwiftData's queries. More than that is a new trigger.
        #expect((save["SidebarView"] ?? 0) <= 3)
        text.resignFirstResponder()
    }

    @Test func searchAndScroll() async throws {
        let (window, c, _) = try Self.window(notes: 2000)
        defer { window.isHidden = true }
        await Self.settle(window, seconds: 1.5)
        try await Self.back(in: window)
        await Self.settle(window, seconds: 0.5)
        let list = try #require(Self.all(UICollectionView.self, in: window).max { $0.visibleCells.count < $1.visibleCells.count })
        RenderProbe.begin(in: c.mainContext)
        var steps: [Double] = []
        let clock = ContinuousClock()
        for i in 1...20 {
            let t = clock.now
            list.setContentOffset(CGPoint(x: 0, y: CGFloat(i) * 400), animated: false)
            list.layoutIfNeeded()
            await Self.update(window)
            steps.append(Self.ms(clock.now - t))
        }
        await Self.settle(window, seconds: 0.3)
        let scroll = RenderProbe.values(in: c.mainContext)
        print("PERF iphone scroll 2000: median step \(PerfTiming.median(steps)) ms, max \(steps.max() ?? 0); bodies over 20 steps \(Self.line(scroll))")
        #expect(scroll["NoteListView"] == nil && scroll["RootView"] == nil, "scrolling works out rows coming into view, never the list")
        #expect(scroll["NotePreviewCard"] == nil, "a row's long-press card is made when it's pressed, not as the row shows")
        // About six rows come into view per 400 pt step; a list that rebuilt its rows would be thousands.
        #expect((scroll["NoteRow"] ?? 0) <= 20 * 12, "only the rows that come into view")
        list.setContentOffset(.zero, animated: false)
        await Self.settle(window, seconds: 0.5)

        let field = try #require(Self.all(UISearchTextField.self, in: window).first { $0.window != nil }, "the list's search field")
        field.becomeFirstResponder()
        await Self.settle(window, seconds: 0.5)
        RenderProbe.begin(in: c.mainContext)
        var chars: [Double] = []
        for ch in "note 12" {
            let t = clock.now
            field.insertText(String(ch))
            await Self.update(window)
            chars.append(Self.ms(clock.now - t))
            try? await Task.sleep(for: .milliseconds(60))
        }
        await Self.settle(window, seconds: 0.5)
        let search = RenderProbe.values(in: c.mainContext)
        RenderProbe.end(in: c.mainContext)
        print("PERF iphone search 7 chars: median \(PerfTiming.median(chars)) ms, max \(chars.max() ?? 0); bodies \(Self.line(search))")
        #expect((search["NoteListView"] ?? 0) <= 7, "the list once per character")
        #expect(search["RootView"] == nil && search["SidebarView"] == nil, "search stays in the list")
        field.resignFirstResponder()
    }

    /// A spare web view waiting to start waits on while you move between notes: starting one
    /// launches a web content process on the main thread, and on iPhone it landed in the middle of
    /// the next open or Back (only the Mac told the spare that navigation happened).
    ///
    /// Without WebKit: in the iPhone test host the sandbox's rule list never finishes compiling, so
    /// an app note never gets its web view here (the Mac's BackForwardTests checks that a departed
    /// web view is released; that code is shared).
    @Test func navigationPostponesTheSpareWebView() async throws {
        let (window, _, notes) = try Self.window(notes: 40)
        defer { window.isHidden = true }
        await Self.settle(window, seconds: 1)
        try await Self.back(in: window)
        await Self.settle(window)
        for i in 1...3 {
            // A spare waiting to start, as after an app note took the last one.
            NotePageSandbox.prewarmAfterLaunch()
            var pending = try #require(NotePageSandbox.respareTask)
            try await Self.open(notes[i], in: window)
            #expect(pending.isCancelled, "opening a note postpones the spare")
            pending = try #require(NotePageSandbox.respareTask, "to after navigation rests")
            try await Self.back(in: window)
            #expect(pending.isCancelled, "and so does Back")
            #expect(NotePageSandbox.respareTask != nil)
        }
    }

    /// At launch the spare web view waits for quiet: made at once, its web content process started
    /// on the main thread during the first frames.
    @Test func launchLeavesTheSpareWebViewForLater() async throws {
        let before = NotePageSandbox.respareTask
        NotePageSandbox.prewarmAfterLaunch()
        let scheduled = try #require(NotePageSandbox.respareTask, "a spare is scheduled, not started")
        #expect(scheduled != before)
        NotePageSandbox.navigationOccurred()
        #expect(scheduled.isCancelled, "a note opened during launch postpones it")
        #expect(NotePageSandbox.respareTask != nil, "to after the navigation rests")
    }
}
#endif
