#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
import WebKit
@testable import Pane

@MainActor @Suite(.serialized) struct BackForwardTests {
    func ms(_ duration: Duration) -> Double {
        Double(duration.components.seconds) * 1000 + Double(duration.components.attoseconds) / 1e15
    }

    func update(_ window: NSWindow) async {
        for _ in 0..<4 { await Task.yield() }
        window.contentView?.layoutSubtreeIfNeeded()
        window.displayIfNeeded()
    }

    /// Offscreen windows do not draw automatically. Drive each turn until the destination has
    /// a real frame, before letting unrelated teardown work run through four more yields.
    func firstFrame(_ note: Note, in window: NSWindow) async throws {
        for _ in 0..<12 {
            window.contentView?.layoutSubtreeIfNeeded()
            window.displayIfNeeded()
            if let text = window.contentView.flatMap({ MacWindowChromeTests.find(PaneTextView.self, in: $0) }),
               text.string.contains(note.title) { return }
            await Task.yield()
        }
        Issue.record("The destination editor did not render")
    }

    func press(_ label: String, in window: NSWindow) throws {
        let item = try #require(window.toolbar?.items.first { $0.label == label })
        #expect(item.isEnabled)
        try #require(MacWindowChromeTests.press(item))
    }

    @Test func backAndForwardUpdateOnlyTheNote() async throws {
        let (window, container, notes) = try NoteOpenTests.window(notes: 40)
        defer { window.close() }
        _ = container
        await NoteOpenTests.open(notes[1], in: window)
        await NoteOpenTests.settle(window)
        await NoteOpenTests.open(notes[2], in: window)
        await NoteOpenTests.settle(window)
        await PerfTiming.quietMainQueue()
        let viewport = try #require(window.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) }?.enclosingScrollView)
        let expectedFrame = viewport.convert(viewport.bounds, to: nil)
        RenderProbe.begin(in: container.mainContext)
        defer { RenderProbe.end(in: container.mainContext) }
        var times: [Double] = []
        let clock = ContinuousClock()
        let profiling = ProcessInfo.processInfo.environment["PANE_PROFILE_HISTORY"] != nil
        if profiling {
            try String(ProcessInfo.processInfo.processIdentifier).write(toFile: "/tmp/pinto-back-forward-host.pid", atomically: true, encoding: .utf8)
        }
        for _ in 0..<(profiling ? 40 : 8) {
            for (label, note) in [("Back", notes[1]), ("Forward", notes[2])] {
                let start = clock.now
                try press(label, in: window)
                await update(window)
                times.append(ms(clock.now - start))
                let text = try #require(window.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
                #expect(text.string.contains(note.title))
                let scroll = try #require(text.enclosingScrollView)
                #expect(scroll.convert(scroll.bounds, to: nil) == expectedFrame, "history leaves the editor viewport in place")
                try? await Task.sleep(for: .milliseconds(20))
            }
        }
        let counts = RenderProbe.values(in: container.mainContext)
        print("PERF history: median \(PerfTiming.median(times)) ms, max \(times.max() ?? 0); bodies \(counts.sorted { $0.key < $1.key })")
        #expect(PerfTiming.median(times) < 100 * PerfBudget.slack)
        #expect(counts["SidebarView"] == nil, "history leaves the sidebar alone")
        #expect((counts["NoteListView"] ?? 0) <= times.count, "the list updates at most once per selection")
        #expect((counts["RootView"] ?? 0) <= times.count, "history acknowledgement does not rebuild the window")
        #expect((counts["NoteDetailView"] ?? 0) == times.count, "the destination pane is built once per step")
    }

    @Test func noSelectionRemovesTheNoteToolbar() async throws {
        let oldScope = UserDefaults.standard.object(forKey: "lastScope")
        let oldNote = UserDefaults.standard.object(forKey: "lastNote")
        UserDefaults.standard.removeObject(forKey: "lastScope")
        UserDefaults.standard.removeObject(forKey: "lastNote")
        defer {
            UserDefaults.standard.set(oldScope, forKey: "lastScope")
            UserDefaults.standard.set(oldNote, forKey: "lastNote")
        }
        let (window, container, notes) = try NoteOpenTests.window()
        defer { window.close() }
        _ = container
        await NoteOpenTests.settle(window)
        let split = try #require(window.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
        let list = try #require(split.arrangedSubviews.dropFirst().first.flatMap { MacWindowChromeTests.find(NSTableView.self, in: $0) })
        list.deselectAll(nil)
        await NoteOpenTests.settle(window)
        let clock = ContinuousClock()
        let start = clock.now
        await NoteOpenTests.open(notes[1], in: window)
        print("PERF first note from empty: \(ms(clock.now - start)) ms")
        await NoteOpenTests.settle(window)
        list.deselectAll(nil)
        await NoteOpenTests.settle(window)
        let items = try MacWindowChromeTests.items(window).filter { $0.column == 2 && $0.frame.width > 1 }
        print("PERF empty detail toolbar: \(items.map(\.label))")
        #expect(items.isEmpty, "native note items and their glass are hidden in the empty pane")
    }

    @Test func anUntouchedNewNoteLeavesWithAnAnimation() async throws {
        let (window, container, notes) = try NoteOpenTests.window()
        defer { window.close(); RenderProbe.noteListTransaction = nil }
        await NoteOpenTests.open(notes[1], in: window)
        await NoteOpenTests.settle(window)
        // New Note shares the list's toolbar item with its ••• (7 November 2026): pressed by its button.
        try #require(await MacWindowChromeTests.pressNewNote(window), "New Note in the toolbar")
        await NoteOpenTests.settle(window)
        let empty = try #require(try container.mainContext.fetch(FetchDescriptor<Note>()).first { $0.body.isEmpty && $0.deletedAt == nil })
        var removalAnimated = false
        RenderProbe.noteListTransaction = { context, ids, transaction in
            guard context === container.mainContext else { return }
            if !ids.contains(empty.id), transaction.animation != nil, !transaction.disablesAnimations {
                removalAnimated = true
            }
        }
        let clock = ContinuousClock()
        let start = clock.now
        NoteOpener.shared.request = notes[2].id
        for _ in 0..<12 {
            window.contentView?.layoutSubtreeIfNeeded()
            window.displayIfNeeded()
            if window.contentView.flatMap({ MacWindowChromeTests.find(PaneTextView.self, in: $0) })?.string.contains(notes[2].title) == true { break }
            await Task.yield()
        }
        let elapsed = ms(clock.now - start)
        let text = try #require(window.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
        #expect(text.string.contains(notes[2].title), "the destination is open before the row animation finishes")
        await NoteOpenTests.settle(window)
        #expect(empty.deletedAt != nil)
        #expect(removalAnimated, "the list removes the empty row inside an animation transaction")
        print("PERF open while discarding empty note: \(elapsed) ms; animated \(removalAnimated)")
        #expect(elapsed < 100 * PerfBudget.slack)
    }

    @Test func leavingAnAppNote() async throws {
        let (window, container, notes) = try NoteOpenTests.window()
        let note = notes[1]
        NotePageStore.shared[note.id] = .init(html: "<!doctype html><h1>Local app fixture</h1>", by: "Test", at: .now)
        defer { window.close(); NotePageStore.shared[note.id] = nil }
        _ = container
        var times: [Double] = [], frames: [Double] = []
        let clock = ContinuousClock()
        let profiling = ProcessInfo.processInfo.environment["PANE_PROFILE_APP_EXIT"] != nil
        if profiling {
            try String(ProcessInfo.processInfo.processIdentifier).write(toFile: "/tmp/pinto-app-exit-host.pid", atomically: true, encoding: .utf8)
        }
        for _ in 0..<(profiling ? 25 : 5) {
            await NoteOpenTests.open(notes[2], in: window)
            let labels: Set<String> = ["Format", "Checklist", "Table", "Attach"]
            await NoteOpenTests.open(note, in: window)
            await NoteOpenTests.settle(window)
            weak var departed: WKWebView?
            do {
                let web = try #require(window.contentView.flatMap { MacWindowChromeTests.find(WKWebView.self, in: $0) })
                #expect(web.frame.width > 0)
                departed = web
            }
            let visibleTools = (window.toolbar?.items ?? []).filter { labels.contains($0.label) && !$0.isHidden && $0.view?.window != nil }.map(\.label)
            #expect(visibleTools.isEmpty, "app notes hide native writing items, including their glass")
            let pendingPrewarm = NotePageSandbox.respareTask
            let start = clock.now
            try press("Back", in: window)
            try await firstFrame(notes[2], in: window)
            frames.append(ms(clock.now - start))
            await update(window)
            times.append(ms(clock.now - start))
            if let pendingPrewarm {
                #expect(pendingPrewarm.isCancelled, "navigation postpones a spare instead of launching WebKit during the step")
            }
            let restored = (window.toolbar?.items ?? []).filter { labels.contains($0.label) }
            #expect(restored.count == 4 && restored.allSatisfy { !$0.isHidden })
            #expect(window.contentView.flatMap { MacWindowChromeTests.find(WKWebView.self, in: $0) } == nil)
            await NoteOpenTests.settle(window)
            #expect(departed == nil, "leaving releases the old web view, including its callbacks and loading timeout")
        }
        print("PERF leave app history: first frame \(PerfTiming.median(frames)) ms; settled median \(PerfTiming.median(times)) ms, each \(times)")
        #expect(PerfTiming.median(frames) < 100 * PerfBudget.slack, "the destination frame precedes WebKit teardown")
        #expect(PerfTiming.median(times) < 150 * PerfBudget.slack, "including teardown and native toolbar layout")
    }
}
#endif
