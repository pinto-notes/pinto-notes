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

    /// Each button makes its own kind: New Note runs the window's New Note, New Canvas asks the
    /// window for a canvas (it makes and opens it: CanvasTests, and the window test below), New App
    /// opens its sheet.
    @Test func eachButtonAsksForItsOwnKind() {
        var notes = 0
        let asks = NewCanvas.shared.asks
        CreateKind.note.run { notes += 1 }
        #expect(notes == 1 && NewCanvas.shared.asks == asks && !NewApp.shared.showing)
        CreateKind.canvas.run { notes += 1 }
        #expect(notes == 1)
        #expect(NewCanvas.shared.asks == asks + (NoteApps.enabled ? 1 : 0))
        _ = NewCanvas.shared.claim()
        CreateKind.app.run { notes += 1 }
        #expect(notes == 1 && NewApp.shared.showing == NoteApps.enabled)
        NewApp.shared.showing = false
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

    /// A press makes a working app note at once, from the bundle: the note, its app (a valid
    /// project) and its starting data, in the folder shown. The source is the bundle only, so it
    /// works with no network at all, and no AI is asked.
    @Test func pickingATemplateMakesAWorkingAppNoteWithNoNetwork() async throws {
        let c = try Self.empty()
        let ctx = c.mainContext
        let work = ctx.createFolder(named: "Work")
        for t in AppTemplates.shipped {
            // The source answers from the bundle, for any link: no request is made.
            let d = try await AppTemplates.Bundled(template: t, bundle: .main).draft(for: NoteSourceLink(kind: .template, slug: t.slug))
            #expect(d.appProject != nil && d.appData != nil)
            let folder = AppTemplates.folder(in: ctx, scope: .folder(work.id))
            #expect(folder == .existing(work.id), "New App puts it in the folder shown")
            let id = try #require(await AppTemplates.make(t, into: folder, context: ctx), "\(t.slug) made")
            let note = try #require(ctx.note(id))
            #expect(note.folder?.id == work.id)
            #expect(note.title == t.title)
            let page = try #require(NotePageStore.shared[id], "\(t.slug) is an app from the start")
            let project = try #require(NotePageProject.parse(page.html))
            #expect(project.problem == nil, "\(t.slug)'s app opens")
            #expect(!NotePageDataStore.shared.doc(id).isEmpty, "\(t.slug) starts with its data")
            #expect(NoteAppMark.has(note), "the list marks it as an app")
        }
        // A second of the same is a second note, not the first opened again.
        let t = try #require(AppTemplates.shipped.first)
        let a = await AppTemplates.make(t, into: .existing(work.id), context: ctx)
        let b = await AppTemplates.make(t, into: .existing(work.id), context: ctx)
        #expect(a != nil && b != nil && a != b)
    }

    @Test func withAllNotesItGoesInTheFirstFolderOrANewNotesFolder() throws {
        let c = try Self.empty()
        let ctx = c.mainContext
        #expect(AppTemplates.folder(in: ctx, scope: .all) == .new("Notes"))
        let first = ctx.createFolder(named: "Personal")
        #expect(AppTemplates.folder(in: ctx, scope: .all) == .existing(first.id))
        #expect(AppTemplates.folder(in: ctx, scope: nil) == .existing(first.id))
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
                #expect(UserDefaults.standard.string(forKey: "lastNote") == newest.id.uuidString, "and it is open")
                // New Note: a note, open, with the cursor in it.
                let note = try #require(await Self.find("list.newNote", in: w))
                _ = note.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 6)
                #expect(try live().count == before + 2, "a new note")
                let editor = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) }, "and it's open")
                #expect(editor.string.isEmpty)
                // New App: its sheet.
                let app = try #require(await Self.find("list.newApp", in: w))
                _ = app.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 2)
                #expect(NewApp.shared.showing, "New App opens its sheet")
                NewApp.shared.showing = false
                await MacWindowChromeTests.settle(w, 4)
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

    /// New App: title, line, the four ready-made apps, "Or describe it" and one orange button.
    @Test func theNewAppSheet() async throws {
        defer { MakeAppSheet.stateForPictures = nil }
        for state in ["chatgpt", "three", "none"] {
            for dark in [false, true] {
                MakeAppSheet.stateForPictures = state
                let host = NSHostingView(rootView: MakeAppSheet(newApp: ()).modelContainer(try Self.empty()).environment(\.controlActiveState, .key).fixedSize())
                host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 800, height: 700), styleMask: [.borderless], backing: .buffered, defer: false)
                window.isReleasedWhenClosed = false
                window.contentView = host
                defer { window.close() }
                host.frame = CGRect(origin: .zero, size: host.fittingSize)
                try await Task.sleep(for: .milliseconds(500))
                host.frame = CGRect(origin: .zero, size: host.fittingSize)
                host.layoutSubtreeIfNeeded()
                #expect(host.fittingSize.width == 760)
                #expect(host.fittingSize.height < (state == "none" ? 720 : 600), "\(state) is \(host.fittingSize.height) pt tall")
                if state == "chatgpt" {
                    let enhanced = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
                    NSApp.accessibilitySetValue(true, forAttribute: enhanced)
                    defer { NSApp.accessibilitySetValue(false, forAttribute: enhanced) }
                    try await Task.sleep(for: .milliseconds(300))
                    for t in AppTemplates.shipped {
                        #expect(MacEmptyDetailTests.element("newApp.template.\(t.slug)", in: host) != nil, "\(t.slug) card")
                    }
                    #expect(MacEmptyDetailTests.element("newApp.templates", in: host) == nil, "no link to the website")
                }
                guard let dir = Self.dir else { continue }
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
                host.cacheDisplay(in: host.bounds, to: rep)
                try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "create-mac-newapp-\(state)-\(dark ? "dark" : "light").png"))
            }
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
        let sheet = Color(Palette.listGround).ignoresSafeArea().sheet(isPresented: .constant(true)) { MakeAppSheet(newApp: ()).modelContainer(empty) }
        try await ListLayoutSnapshots.shoot(sheet, "create-newapp", dark: dark, wait: 1.5)
    }
    #endif
}
