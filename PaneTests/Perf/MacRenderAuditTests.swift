#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Debug measurements of real windows, never ordered on screen. Body budgets are scoped to
/// each in-memory library. Timings include four yields and layout/display, but no settling sleep.
@MainActor @Suite(.serialized) struct MacRenderAuditTests {
    func ms(_ d: Duration) -> Double {
        Double(d.components.seconds) * 1000 + Double(d.components.attoseconds) / 1e15
    }

    func update(_ window: NSWindow) async {
        for _ in 0..<4 { await Task.yield() }
        window.contentView?.layoutSubtreeIfNeeded()
        window.displayIfNeeded()
    }

    func report(_ path: String, _ times: [Double], _ context: ModelContext) {
        print("AUDIT \(path): median \(msText(PerfTiming.median(times))) ms; samples \(times.map(msText)); bodies \(RenderProbe.values(in: context).sorted { $0.key < $1.key })")
    }

    func msText(_ value: Double) -> String { String(format: "%.3f", value) }

    func field(in window: NSWindow, matching predicate: @MainActor (NSTextField) -> Bool = { $0.isEditable }) throws -> NSTextField {
        try #require(window.contentView.flatMap { MacWindowChromeTests.find(NSTextField.self, in: $0, where: predicate) })
    }

    /// SwiftUI's native field delegate receives the same notification as an edit. No input event
    /// is posted and the window never becomes key. This also works with the app's search field.
    func edit(_ field: NSTextField, to value: String) {
        field.stringValue = value
        field.delegate?.controlTextDidChange?(Notification(name: NSControl.textDidChangeNotification, object: field))
    }

    @Test func typingInFiveThousandWords() async throws {
        let (window, container, notes) = try NoteOpenTests.window(notes: 40)
        defer { window.close() }
        notes[1].body = "Long note\n\n" + Array(repeating: "one two three four five six seven eight nine ten", count: 500).joined(separator: "\n")
        try container.mainContext.save()
        await NoteOpenTests.open(notes[1], in: window)
        await NoteOpenTests.settle(window)
        let text = try #require(window.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
        text.setSelectedRange(NSRange(location: 80, length: 0))
        await NoteOpenTests.settle(window)
        let context = container.mainContext
        RenderProbe.begin(in: context)
        defer { RenderProbe.end(in: context) }
        var times: [Double] = [], native: [Double] = []
        let clock = ContinuousClock()
        let title = window.title
        for _ in 0..<12 {
            let start = clock.now
            text.insertText("a", replacementRange: text.selectedRange())
            native.append(ms(clock.now - start))
            await update(window)
            times.append(ms(clock.now - start))
        }
        report("typing 5000 words, 12 keys", times, context)
        print("AUDIT native keystroke: median \(msText(PerfTiming.median(native))) ms")
        let counts = RenderProbe.values(in: context)
        #expect(counts["RootView"] == nil)
        #expect(window.title == title, "typing does not update the empty window title")
        // This note (25,000 characters) is styled in three parts since the first part shrank to
        // 6,000 characters for opening speed (ac0772a9, fast delete branch): one geometry request
        // for each part's turn, shared within it.
        #expect(counts["PaneTextView.layoutCards", default: 0] <= 36, "styling and later geometry share requests within each turn")
        DebouncedSave.flushAll()
        await NoteOpenTests.settle(window)
        RenderProbe.begin(in: context)
        times = []
        for _ in 0..<12 {
            let start = clock.now
            text.insertText("b", replacementRange: text.selectedRange())
            DebouncedSave.flushAll()
            await update(window)
            times.append(ms(clock.now - start))
            #expect(notes[1].body == text.string)
        }
        report("typing 5000 words with a model save, 12 keys", times, context)
        #expect(RenderProbe.values(in: context)["RootView"] == nil)
        #expect(RenderProbe.values(in: context)["NoteDetailView"] == nil)
        #expect(RenderProbe.values(in: context)["NoteToolbarStage"] == nil)
        RenderProbe.begin(in: context)
        for _ in 0..<10 { text.setFrameSize(text.frame.size) }
        await update(window)
        #expect(RenderProbe.values(in: context)["PaneTextView.layoutCards"] == 1, "ten frame requests in one turn produce one overlay pass")
    }

    @Test func folderSwitchingAndScrollingTwoThousandNotes() async throws {
        let (window, container, notes) = try NoteOpenTests.window(notes: 2_000)
        defer { window.close() }
        let context = container.mainContext
        let folder = context.createFolder(named: "Small")
        for note in notes.prefix(25) { note.folder = folder }
        try context.save()
        await NoteOpenTests.open(notes[1_500], in: window)
        await NoteOpenTests.settle(window)
        let split = try #require(window.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
        let sidebar = try #require(split.arrangedSubviews.first.flatMap { MacWindowChromeTests.find(NSTableView.self, in: $0) })
        RenderProbe.begin(in: context)
        defer { RenderProbe.end(in: context) }
        let clock = ContinuousClock()
        var times: [Double] = []
        // The sidebar list is a heading, All Notes and the two folders. The final row is Small.
        for _ in 0..<5 {
            for row in [sidebar.numberOfRows - 1, 1] {
                let start = clock.now
                sidebar.selectRowIndexes(IndexSet(integer: row), byExtendingSelection: false)
                await update(window)
                times.append(ms(clock.now - start))
            }
        }
        report("folder switches, 10 steps", times, context)
        let list = try #require(split.arrangedSubviews.dropFirst().first.flatMap { MacWindowChromeTests.find(NSTableView.self, in: $0) })
        #expect(list.numberOfRows > 2_000, "All Notes contains the full library and headings")
        RenderProbe.begin(in: context)
        times = []
        for row in stride(from: 0, to: list.numberOfRows, by: 100) {
            let start = clock.now
            list.scrollRowToVisible(row)
            await update(window)
            times.append(ms(clock.now - start))
        }
        report("scroll 2000 notes, 100-row jumps", times, context)
        let counts = RenderProbe.values(in: context)
        #expect(counts["RootView"] == nil)
        #expect(counts["SidebarView"] == nil)
        #expect(counts["NoteListView"] == nil)
    }

    @Test func listSearchAndQuickOpen() async throws {
        let (window, container, notes) = try NoteOpenTests.window(notes: 2_000)
        defer { window.close() }
        await NoteOpenTests.open(notes[1], in: window)
        await NoteOpenTests.settle(window)
        let context = container.mainContext
        let clock = ContinuousClock()
        NotificationCenter.default.post(name: .paneSearchNotes, object: "")
        await NoteOpenTests.settle(window)
        let search = try field(in: window)
        RenderProbe.begin(in: context)
        defer { RenderProbe.end(in: context) }
        var times: [Double] = []
        for query in ["n", "no", "not", "note", "note ", "note 1", "note 19"] {
            let start = clock.now
            edit(search, to: query)
            await update(window)
            times.append(ms(clock.now - start))
        }
        report("list search, 7 keys", times, context)
        let split = try #require(window.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
        let list = try #require(split.arrangedSubviews.dropFirst().first.flatMap { MacWindowChromeTests.find(NSTableView.self, in: $0) })
        #expect(list.numberOfRows < 300, "the native edits changed the search binding")
        edit(search, to: "")
        NotificationCenter.default.post(name: .paneSearchNotes, object: nil)
        await NoteOpenTests.settle(window)
        NotificationCenter.default.post(name: .paneQuickOpen, object: nil)
        await NoteOpenTests.settle(window)
        let quick = try field(in: window, matching: { $0.placeholderString == "Go to a note, or type a command" })
        RenderProbe.begin(in: context)
        times = []
        for query in ["s", "so", "som", "some", "some ", "some t", "some te"] {
            let start = clock.now
            edit(quick, to: query)
            await update(window)
            times.append(ms(clock.now - start))
        }
        report("QuickOpen, 7 keys before text debounce", times, context)
        let counts = RenderProbe.values(in: context)
        #expect(counts["QuickOpenPanel", default: 0] >= times.count, "the query changed on every key")
        #expect(counts["RootView"] == nil)
        #expect(counts["SidebarView"] == nil)
        #expect(counts["NoteListView"] == nil)
        let start = clock.now
        try? await Task.sleep(for: QuickOpen.textDelay)
        await NoteOpenTests.settle(window)
        print("AUDIT QuickOpen text results, including debounce and settle: \(msText(ms(clock.now - start))) ms; bodies \(RenderProbe.values(in: context))")
        #expect(RenderProbe.values(in: context)["QuickOpenPanel", default: 0] > counts["QuickOpenPanel", default: 0], "the text search delivered its results")
        let hitsStart = clock.now
        let hits = await QuickOpen.textHits(for: "some te", in: container)
        print("AUDIT QuickOpen store search 2000 notes: \(msText(ms(clock.now - hitsStart))) ms")
        #expect(hits.count == QuickOpen.textLimit)
    }

    /// The real environment consumer on a stable Settings page. Searching the sidebar should
    /// not rebuild this page just because its navigation callback was allocated again.
    final class SettingsNavigation {
        var open: ((SettingsPage) -> Void)?
    }

    struct ProbePage: View {
        let place: Pane.SettingsPage
        let navigation: SettingsNavigation
        @Environment(\.modelContext) private var context
        @Environment(\.openSettingsPage) private var open
        var body: some View {
            let _ = RenderProbe.count("SettingsPage", context: context)
            let _ = { navigation.open = { open?($0) } }()
            Button(place.title) { open?(.shortcuts) }
        }
    }

    @Test func settingsSearchLeavesThePageAlone() async throws {
        let (container, _) = try AppPerfTests().library(notes: 1, big: false)
        let route = SettingsRoute()
        let navigation = SettingsNavigation()
        let card = SettingsCard(backend: Backend(), available: [.account, .appearance, .security, .shortcuts],
                                page: { AnyView(ProbePage(place: $0, navigation: navigation)) }, route: route, start: .account, close: {})
        let (window, _) = AppPerfTests().window(card.modelContainer(container), width: 1100)
        defer { window.close() }
        await NoteOpenTests.settle(window)
        let search = try field(in: window)
        let context = container.mainContext
        RenderProbe.begin(in: context)
        defer { RenderProbe.end(in: context) }
        var times: [Double] = []
        let clock = ContinuousClock()
        for query in ["a", "ap", "app", "apps", "app", "ap", "a", ""] {
            let start = clock.now
            edit(search, to: query)
            await update(window)
            times.append(ms(clock.now - start))
        }
        report("Settings sidebar search, 8 edits", times, context)
        let counts = RenderProbe.values(in: context)
        #expect(counts["SettingsCard", default: 0] >= times.count)
        // The page beside the results is the first result's (round 24): it changes when that does
        // (here Account, Appearance, back to Account when nothing matches "apps", and so on) and
        // doesn't follow each key: one render per change of page, none per key.
        let queries = ["a", "ap", "app", "apps", "app", "ap", "a", ""]
        let pages = queries.map { q in
            q.isEmpty ? .account : SettingsCard.pageWhileSearching(SettingsIndex.matches(q, available: [.account, .appearance, .security, .shortcuts])) ?? .account
        }
        let changes = zip([Pane.SettingsPage.account] + pages, pages).filter { $0 != $1 }.count
        #expect(changes < queries.count)
        #expect(counts["SettingsPage", default: 0] <= changes,
                "the page doesn't follow the search field: \(counts["SettingsPage", default: 0]) renders for \(changes) changes of page")
        let earlier = try #require(navigation.open)
        earlier(.shortcuts)
        await update(window)
        #expect(route.page == .shortcuts, "the retained callback still navigates")
        earlier(.appearance)
        await update(window)
        #expect(route.page == .appearance, "the earlier callback appends to the current path")
    }

    @Test func openingTablesAndCards() async throws {
        let (window, container, notes) = try NoteOpenTests.window(notes: 3)
        defer { window.close() }
        // Note cards use synthetic titles and do not fetch external link metadata.
        notes[1].body = PerfFixtures.blockyNote().replacingOccurrences(of: #"https://example.com/\d+/\d+"#, with: "![[Fixture $0]]", options: .regularExpression)
        #expect(LineEmbed.find(in: notes[1].body).count == 20)
        try container.mainContext.save()
        await NoteOpenTests.open(notes[0], in: window)
        await NoteOpenTests.settle(window)
        let context = container.mainContext
        RenderProbe.begin(in: context)
        defer { RenderProbe.end(in: context) }
        let clock = ContinuousClock()
        let start = clock.now
        await NoteOpenTests.open(notes[1], in: window)
        await update(window)
        report("open 10 tables and 20 cards", [ms(clock.now - start)], context)
        let text = try #require(window.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
        #expect(text.string == notes[1].body)
        #expect(RenderProbe.values(in: context)["CardHost.created", default: 0] < 30, "opening does not construct every offscreen block")
        let firstHost = try #require(text.subviews.first { $0 is GridHostingView })
        #expect(!text.renderedCardKeys.contains("g9"))
        text.core.gridFocus = GridFocusRequest(grid: 9, cell: GridCell(row: 0, column: 0))
        text.layoutCards(animated: false)
        #expect(text.renderedCardKeys.contains("g9"), "a new offscreen table with a focus request gets its host immediately")
        text.core.gridFocus = nil
        for (key, offset) in text.core.grids.map({ ("g\($0.index)", $0.range.location) }) + text.core.embeds.map({ ($0.key, $0.range.location) }) {
            text.reveal(offset)
            window.displayIfNeeded()
            #expect(text.renderedCardKeys.contains(key), "the first scrolled display includes \(key)")
            await update(window)
            #expect(text.renderedCardKeys.contains(key), "scrolling creates \(key)")
        }
        #expect(text.subviews.contains { $0 === firstHost }, "scrolling retains an existing table and its editing state")
        text.frame.size.width -= 100
        await update(window)
        text.frame.size.width += 100
        await update(window)
        #expect(text.renderedCardKeys.count == 30)
        text.core.gridFocus = GridFocusRequest(grid: 0, cell: GridCell(row: 0, column: 0))
        text.layoutCards(animated: false)
        #expect(text.renderedCardKeys.contains("g0"), "a requested table has a live host even away from the viewport")
    }

    @Test func firstOpenFromEmpty() async throws {
        let (window, container, notes) = try NoteOpenTests.window(notes: 3)
        defer { window.close() }
        await NoteOpenTests.open(notes[0], in: window)
        await NoteOpenTests.settle(window)
        let split = try #require(window.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
        let list = try #require(split.arrangedSubviews.dropFirst().first.flatMap { MacWindowChromeTests.find(NSTableView.self, in: $0) })
        let context = container.mainContext
        var times: [Double] = []
        let clock = ContinuousClock()
        RenderProbe.begin(in: context)
        defer { RenderProbe.end(in: context) }
        for _ in 0..<6 {
            list.deselectAll(nil)
            await NoteOpenTests.settle(window)
            #expect(try MacWindowChromeTests.items(window).filter { $0.column == 2 && $0.frame.width > 1 }.isEmpty)
            let start = clock.now
            await NoteOpenTests.open(notes[1], in: window)
            times.append(ms(clock.now - start))
            await NoteOpenTests.settle(window)
        }
        report("open from empty, 6 samples", times, context)
    }
}
#endif
