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

/// The three create buttons (create study, 13 November 2026): New Note, New Canvas and New App,
/// one press each where compose was, with their keys in the File menu; New App's ready-made apps,
/// made here with no AI and no network; and "Make your first one" on an empty library.
@MainActor @Suite(.serialized) struct CreateButtonsTests {
    static func empty() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    static var dir: URL? {
        let env = ProcessInfo.processInfo.environment
        return (env["PANE_SNAPSHOT_DIR"] ?? env["AMBER_HIG_SHOTS"]).map { URL(fileURLWithPath: $0) }
    }

    // MARK: The three

    @Test func theThreeHaveTheirOwnNamesGlyphsAndKeys() {
        #expect(CreateKind.allCases.map(\.title) == ["New Note", "New Canvas", "New App"])
        #expect(CreateKind.app.menuTitle == "New App\u{2026}")
        #expect(CreateKind.allCases.map(\.keys) == ["\u{2318}N", "\u{2325}\u{2318}N", "\u{2303}\u{2318}N"])
        #expect(CreateKind.canvas.help == "New Canvas (\u{2325}\u{2318}N)")
        // Three different pictures, and the canvas's is no pencil or scribble beside compose's.
        #expect(Set(CreateKind.allCases.map(\.symbol)).count == 3)
        #expect(!CanvasNote.symbol.contains("pencil") && !CanvasNote.symbol.contains("scribble"))
        #expect(CreateKind.canvas.symbol == CanvasNote.symbol, "the list marks a canvas with the button's glyph")
        #expect(CreateKind.app.symbol == NoteAppMark.symbol)
        #expect(Set(CreateKind.allCases.map(\.identifier)) == ["list.newNote", "list.newCanvas", "list.newApp"])
    }

    /// Each button makes its own kind: New Note runs the window's New Note, New Canvas and New App
    /// ask the window for a canvas or an app's start page (it makes and opens them: the window
    /// tests below). Two windows hearing one ask make one.
    @Test func eachButtonAsksForItsOwnKind() {
        var notes = 0
        let canvases = NewCanvas.shared.asks, apps = NewApp.shared.asks
        CreateKind.note.run { notes += 1 }
        #expect(notes == 1 && NewCanvas.shared.asks == canvases && NewApp.shared.asks == apps)
        CreateKind.canvas.run { notes += 1 }
        #expect(notes == 1)
        #expect(NewCanvas.shared.asks == canvases + (NoteApps.enabled ? 1 : 0))
        _ = NewCanvas.shared.claim()
        CreateKind.app.run { notes += 1 }
        #expect(notes == 1 && NewApp.shared.asks == apps + (NoteApps.enabled ? 1 : 0))
        #expect(NewApp.shared.claim() == NoteApps.enabled)
        #expect(!NewApp.shared.claim(), "a second window doesn't make a second start")
    }

    // MARK: New App's start

    static func starts() -> AppStart { AppStart(defaults: UserDefaults(suiteName: "CreateButtonsTests.\(UUID())")!) }

    /// New App makes a note titled "New app" at once, marked as a start: the note pane shows the
    /// start page until it is an app. Another start beside it is "New app 2", so an AI can tell
    /// them apart. Left untouched it goes; handed to an AI it stays, waiting.
    @Test func newAppMakesAStartNote() throws {
        let c = try Self.empty()
        let ctx = c.mainContext
        let suite = "CreateButtonsTests.\(UUID())"
        let start = AppStart(defaults: UserDefaults(suiteName: suite)!)
        let pages = NotePageStore(file: nil)
        let a = AppStart.make(in: .all, context: ctx, start: start)
        #expect(a.title == "New app" && a.folder != nil)
        #expect(start.shows(a.id, pages: pages) && start.untouched(a.id, pages: pages))
        let b = AppStart.make(in: .all, context: ctx, start: start)
        #expect(b.title == "New app 2")
        start.wait(b.id, for: "ChatGPT")
        #expect(start.shows(b.id, pages: pages) && !start.untouched(b.id, pages: pages), "waiting for its AI: kept")
        #expect(start.waitingFor(b.id) == "ChatGPT")
        // The AI's app arrives: the page is the app now.
        pages.setHere(b.id, .init(html: "<!doctype html><p>Water</p>", by: "ChatGPT", at: .now))
        #expect(!start.shows(b.id, pages: pages))
        // Remembered on this device across launches.
        let again = AppStart(defaults: UserDefaults(suiteName: suite)!)
        #expect(again.untouched(a.id, pages: pages) && again.waitingFor(b.id) == "ChatGPT")
        start.finish(a.id)
        #expect(!start.shows(a.id, pages: pages))
    }

    // MARK: New App's ready-made apps

    @Test func theBundleHasTheFourAppTemplatesWithPictures() {
        let all = AppTemplates.shipped
        #expect(all.map(\.slug) == ["habit-tracker", "trip-plan", "study-flashcards", "budget-log"])
        #expect(all.map(\.name) == ["Habit tracker", "Trip plan", "Flashcards", "Budget"])
        for t in all {
            #expect(t.picture(dark: false) != nil && t.picture(dark: true) != nil, "\(t.slug) has light and dark pictures")
            #expect(!t.line.isEmpty)
        }
    }

    /// A press makes the start note itself a working app, in place, from the bundle: its text, its
    /// app (a valid project) and its starting data. No new note, and the source is the bundle only,
    /// so it works with no network at all, and no AI is asked.
    @Test func pickingATemplateMakesTheStartTheAppWithNoNetwork() async throws {
        let c = try Self.empty()
        let ctx = c.mainContext
        let work = ctx.createFolder(named: "Work")
        let start = Self.starts()
        let pages = NotePageStore(file: nil), data = NotePageDataStore(file: nil)
        for t in AppTemplates.shipped {
            // The source answers from the bundle, for any link: no request is made.
            let d = try await AppTemplates.Bundled(template: t, bundle: .main).draft(for: NoteSourceLink(kind: .template, slug: t.slug))
            #expect(d.appProject != nil && d.appData != nil)
            let note = AppStart.make(in: .folder(work.id), context: ctx, start: start)
            let count = try ctx.fetchCount(FetchDescriptor<Note>())
            #expect(AppTemplates.apply(t, to: note, context: ctx, pages: pages, data: data, start: start))
            #expect(try ctx.fetchCount(FetchDescriptor<Note>()) == count, "\(t.slug): the same note, no new one")
            #expect(note.folder?.id == work.id, "where it was made")
            #expect(note.title == t.title)
            let page = try #require(pages[note.id], "\(t.slug) is an app now")
            let project = try #require(NotePageProject.parse(page.html))
            #expect(project.problem == nil, "\(t.slug)'s app opens")
            #expect(!data.doc(note.id).isEmpty, "\(t.slug) starts with its data")
            #expect(NoteAppMark.has(note, in: pages), "the list marks it as an app")
            #expect(!start.shows(note.id, pages: pages), "the start page is gone: the note is the app")
        }
    }

    // MARK: An empty library

    @Test func makeYourFirstOneShowsOnlyWithNoNotes() throws {
        let c = try Self.empty()
        let ctx = c.mainContext
        #expect(FirstOneView.libraryIsEmpty(ctx))
        let note = ctx.createNote(in: .all, body: "Hello")
        #expect(!FirstOneView.libraryIsEmpty(ctx))
        ctx.trash(note)
        #expect(FirstOneView.libraryIsEmpty(ctx), "Recently Deleted doesn't count")
        #expect(FirstOneView.title == "Make your first one")
    }

    #if os(macOS)
    // MARK: Shortcuts

    @Test func theFileMenusKeysAreWiredAndFree() throws {
        #expect(PaneCommands.shortcut(.note) == KeyboardShortcut("n"))
        #expect(PaneCommands.shortcut(.canvas) == KeyboardShortcut("n", modifiers: [.command, .option]))
        #expect(PaneCommands.shortcut(.app) == KeyboardShortcut("n", modifiers: [.command, .control]))
        // Nothing else in the app takes N with a modifier: New Note, New Canvas, New App, New Folder.
        let sources = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: "Pane")
        guard FileManager.default.fileExists(atPath: sources.path) else { return }
        var uses = 0
        for case let url as URL in FileManager.default.enumerator(at: sources, includingPropertiesForKeys: nil)! where url.pathExtension == "swift" {
            let text = try String(contentsOf: url, encoding: .utf8)
            uses += text.components(separatedBy: #".keyboardShortcut("n""#).count - 1
            uses += text.components(separatedBy: #".keyboardShortcut(Self.shortcut("#).count - 1
        }
        #expect(uses == 4, "⌘N, ⌥⌘N, ⌃⌘N and ⇧⌘N, once each (\(uses))")
    }

    // MARK: In the window

    static let size = CGSize(width: 1469, height: 920)

    /// The words of the list's selected row in this window (its title first), as VoiceOver reads
    /// them. Read from the window itself: "lastNote" is shared by every window a test run leaves
    /// alive, and one of them wrote it in a full run.
    static func selectedRow(_ w: NSWindow) -> String {
        guard let table = try? MacEmptyDetailTests.list(w), table.selectedRowIndexes.count == 1,
              let row = table.rowView(atRow: table.selectedRow, makeIfNecessary: false) else { return "" }
        var words: [String] = []
        func look(_ e: Any, _ depth: Int) {
            guard depth < 30, let o = e as? NSObject else { return }
            for key in ["accessibilityLabel", "accessibilityValue"] where o.responds(to: NSSelectorFromString(key)) {
                if let t = o.value(forKey: key) as? String, !t.isEmpty { words.append(t) }
            }
            if o.responds(to: #selector(NSAccessibilityProtocol.accessibilityChildren)) {
                for c in o.value(forKey: "accessibilityChildren") as? [Any] ?? [] { look(c, depth + 1) }
            }
        }
        look(row, 0)
        return words.joined(separator: " ")
    }

    /// Waits up to 3 seconds (a busy machine) for the list's selected row to be `title`.
    static func waitUntilOpen(_ title: String, in w: NSWindow) async -> Bool {
        let enhanced = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
        NSApp.accessibilitySetValue(true, forAttribute: enhanced)
        defer { NSApp.accessibilitySetValue(false, forAttribute: enhanced) }
        for _ in 0..<30 {
            if selectedRow(w).contains(title) { return true }
            await MacWindowChromeTests.settle(w, 1)
        }
        print("selected row: \(selectedRow(w))")
        return false
    }

    /// `id` anywhere in the window, its toolbar included (MacEmptyDetailTests looks in the content only).
    static func find(_ id: String, in w: NSWindow) async -> NSObject? {
        let enhanced = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
        NSApp.accessibilitySetValue(true, forAttribute: enhanced)
        defer { NSApp.accessibilitySetValue(false, forAttribute: enhanced) }
        for _ in 0..<30 {
            await MacWindowChromeTests.settle(w, 1)
            if let found = MacEmptyDetailTests.element(id, in: w) { return found }
            if let frame = w.contentView?.superview, let found = MacEmptyDetailTests.element(id, in: frame) { return found }
        }
        return nil
    }

    /// The list's toolbar has the three, one press each: New Note makes a note and opens it, New
    /// Canvas a canvas, New App opens its sheet. Pictures light and dark.
    @Test func theListsToolbarMakesEachKind() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            for dark in [false, true] {
                let w = MacWindowChromeTests.window(c, size: Self.size)
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                defer { w.close() }
                await MacWindowChromeTests.settle(w)
                if let dir = Self.dir {
                    try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                    try #require(try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:])).write(to: dir.appending(path: "create-mac-toolbar-\(dark ? "dark" : "light").png"))
                }
                guard !dark else { continue }
                let ctx = c.mainContext
                func live() throws -> [Note] { try ctx.fetch(FetchDescriptor<Note>()).filter { $0.trashedAt == nil && $0.deletedAt == nil } }
                let before = try live().count
                for id in ["list.newNote", "list.newCanvas", "list.newApp"] {
                    #expect(await Self.find(id, in: w) != nil, "\(id) is in the toolbar")
                }
                // New Canvas: a canvas, open.
                let canvas = try #require(await Self.find("list.newCanvas", in: w))
                _ = canvas.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 8)
                let made = try live()
                #expect(made.count == before + 1, "a new canvas")
                let newest = try #require(made.max { $0.createdAt < $1.createdAt })
                #expect(CanvasNote.has(newest), "it is a canvas")
                #expect(await Self.waitUntilOpen(newest.title, in: w), "and it is open")
                // New Note: a note, open, with the cursor in it.
                let note = try #require(await Self.find("list.newNote", in: w))
                _ = note.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 6)
                #expect(try live().count == before + 2, "a new note")
                let editor = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) }, "and it's open")
                #expect(editor.string.isEmpty)
                // New App: a "New app" note, open on its start page in the note pane (not a sheet).
                let app = try #require(await Self.find("list.newApp", in: w))
                _ = app.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 8)
                // The untouched new note before it goes, as an empty note does; the start is there.
                #expect(try live().count == before + 2, "a new app note, and the empty note left behind is gone")
                let started = try #require(try live().max { $0.createdAt < $1.createdAt })
                defer { AppStart.shared.finish(started.id) }
                #expect(started.title == "New app" && AppStart.shared.shows(started.id))
                #expect(await Self.waitUntilOpen("New app", in: w), "and it is open")
                #expect(await Self.find("newApp.page", in: w) != nil, "on its start page")
            }
        }
    }

    /// A new account: "Make your first one" in the note pane, its cards make each kind. With notes
    /// it never shows.
    @Test func theEmptyLibraryOffersTheThree() async throws {
        let c = try Self.empty()
        let d = UserDefaults.standard
        let keepNote = d.object(forKey: "lastNote"), keepScope = d.object(forKey: "lastScope")
        defer {
            if let keepNote { d.set(keepNote, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let keepScope { d.set(keepScope, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        d.removeObject(forKey: "lastNote")
        d.removeObject(forKey: "lastScope")
        for dark in [false, true] {
            let w = MacWindowChromeTests.window(c, size: Self.size)
            w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 12)
            #expect(await MacEmptyDetailTests.waitForElement("firstOne", in: w) != nil, "Make your first one")
            for kind in CreateKind.allCases {
                #expect(await MacEmptyDetailTests.waitForElement("firstOne.\(kind.rawValue)", in: w) != nil, "its \(kind.noun) card")
            }
            if let dir = Self.dir {
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                try #require(try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:])).write(to: dir.appending(path: "create-mac-empty-\(dark ? "dark" : "light").png"))
            }
        }
        // Its Canvas card makes a canvas, and then the cards are gone.
        let w = MacWindowChromeTests.window(c, size: Self.size)
        defer { w.close() }
        await MacWindowChromeTests.settle(w, 8)
        let card = try #require(await MacEmptyDetailTests.waitForElement("firstOne.canvas", in: w))
        _ = card.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
        await MacWindowChromeTests.settle(w, 8)
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
        #expect(notes.count == 1 && CanvasNote.has(notes[0]), "the card made a canvas")
        #expect(MacEmptyDetailTests.element("firstOne", in: try #require(w.contentView)) == nil, "and the cards are gone")
    }

    @Test func notWithNotes() async throws {
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = MacWindowChromeTests.window(c, size: Self.size)
            defer { w.close() }
            await MacWindowChromeTests.settle(w)
            try await MacEmptyDetailTests.deselect(w)
            #expect(await MacEmptyDetailTests.waitForElement("detail.newNote", in: w) != nil, "nothing selected: the usual empty pane")
            #expect(MacEmptyDetailTests.element("firstOne", in: try #require(w.contentView)) == nil, "not the first-run cards")
        }
    }

    /// New App's start page, in the window: the four ready-made apps and "Or describe it". A
    /// template turns the same note into the app in place; a start left untouched goes away when
    /// another note opens. Pictures, light and dark, with ChatGPT connected and with none.
    @Test func theNewAppPage() async throws {
        defer { MakeAppSheet.stateForPictures = nil }
        let c = try AppSnapshotTests.container()
        let ctx = c.mainContext
        func live() throws -> [Note] { try ctx.fetch(FetchDescriptor<Note>()).filter { $0.trashedAt == nil && $0.deletedAt == nil } }
        let note = AppStart.make(in: .all, context: ctx)
        defer { AppStart.shared.finish(note.id) }
        try ctx.save()
        try await AppSnapshotTests.withLastNote(c, "New app") {
            for state in ["chatgpt", "none"] {
                for dark in [false, true] {
                    MakeAppSheet.stateForPictures = state
                    let w = MacWindowChromeTests.window(c, size: Self.size)
                    w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                    defer { w.close() }
                    await MacWindowChromeTests.settle(w)
                    #expect(await Self.find("newApp.page", in: w) != nil, "the start page is in the note pane")
                    if let dir = Self.dir {
                        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                        try #require(try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:])).write(to: dir.appending(path: "create-mac-newapp-page-\(state)-\(dark ? "dark" : "light").png"))
                    }
                }
            }
            MakeAppSheet.stateForPictures = "chatgpt"
            let w = MacWindowChromeTests.window(c, size: Self.size)
            w.appearance = NSAppearance(named: .aqua)
            defer { w.close() }
            await MacWindowChromeTests.settle(w)
            for t in AppTemplates.shipped {
                #expect(await Self.find("newApp.template.\(t.slug)", in: w) != nil, "\(t.slug) card")
            }
            #expect(await Self.find("newApp.templates", in: w) == nil, "no link to the website")
            // A template: the same note becomes the app, where it is, still open.
            let count = try live().count
            let card = try #require(await Self.find("newApp.template.habit-tracker", in: w))
            _ = card.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
            await MacWindowChromeTests.settle(w, 10)
            #expect(try live().count == count, "no new note")
            #expect(note.title == "Habit tracker" && NotePageStore.shared[note.id] != nil, "the start is the app now")
            #expect(!AppStart.shared.shows(note.id))
            #expect(await Self.waitUntilOpen("Habit tracker", in: w), "still open, no jump")
            #expect(MacEmptyDetailTests.element("newApp.page", in: try #require(w.contentView)) == nil, "the start page has gone")
            if let dir = Self.dir {
                try #require(try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:])).write(to: dir.appending(path: "create-mac-newapp-made-light.png"))
            }
            // Another start, left untouched for a note: it goes, as an empty new note does.
            let app = try #require(await Self.find("list.newApp", in: w))
            _ = app.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
            await MacWindowChromeTests.settle(w, 8)
            let started = try #require(try live().first { AppStart.shared.shows($0.id) }, "a second start")
            #expect(try live().count == count + 1)
            let newNote = try #require(await Self.find("list.newNote", in: w))
            _ = newNote.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
            await MacWindowChromeTests.settle(w, 10)
            #expect(ctx.note(started.id).map { $0.deletedAt != nil } ?? true, "the untouched start is gone")
            #expect(AppStart.shared.starts[started.id] == nil)
            #expect(try live().count == count + 1, "and the new note is there")
        }
    }
    #endif

    #if os(iOS)
    /// iPhone pictures: the list with the three in the bottom bar and Today at the top left, the
    /// empty library, and New App. `TEST_RUNNER_AMBER_HIG_SHOTS=/path xcodebuild test … -only-testing:PaneTests/CreateButtonsTests`.
    @Test(arguments: [false, true]) func iPhonePictures(dark: Bool) async throws {
        guard ListLayoutSnapshots.dir != nil else { return }
        let (c, _) = try ListLayoutSnapshots.container()
        let list = NavigationStack { NoteListView(scope: .all, selection: .constant([]), onNewNote: {}) }
            .modelContainer(c)
            .environment(\.stackedNotes, true)
        try await ListLayoutSnapshots.shoot(list, "create-bar", dark: dark, wait: 1.5)
        let empty = try Self.empty()
        let emptyList = NavigationStack { NoteListView(scope: .all, selection: .constant([]), onNewNote: {}) }
            .modelContainer(empty)
            .environment(\.stackedNotes, true)
            .environment(\.importActions, ImportActions(appleNotes: {}, from: { _ in }))
        try await ListLayoutSnapshots.shoot(emptyList, "create-empty", dark: dark, wait: 1.5)
        MakeAppSheet.stateForPictures = "chatgpt"
        defer { MakeAppSheet.stateForPictures = nil }
        let start = AppStart.make(in: .all, context: empty.mainContext)
        defer { AppStart.shared.finish(start.id) }
        let page = NavigationStack {
            Color.clear.navigationDestination(isPresented: .constant(true)) {
                MakeAppSheet(start: start.id, title: start.title).navigationTitle("").navigationBarTitleDisplayMode(.inline)
            }
        }
        .modelContainer(empty)
        try await ListLayoutSnapshots.shoot(page, "create-newapp", dark: dark, wait: 1.5)
    }
    #endif
}
