#if os(macOS)
import AppKit
import SQLite3
import SwiftData
import SwiftUI
import Testing
import ZIPFoundation
@testable import Pane

/// Persona council round 7 (4 November 2026): the Mac stills the judges asked for, one folder per
/// capture (c1-ai-review, c2-writing, c3-search, c7-apple-notes-import, c8-obsidian). Real notes
/// windows and sheets drawn offscreen; nothing is shown on the screen or touches it. The review
/// card's Review, Keep and Undo are pressed through the accessibility API in this process, in a
/// borderless window far off every screen (OffscreenAX). Fictional notes and fixtures only:
/// Apple Notes is never read (its import runs on the import tests' fixtures).
/// Runs only when PERSONA_R7_SHOTS is set:
/// `TEST_RUNNER_PERSONA_R7_SHOTS=<shots>/r7 scripts/qa-test.sh PaneTests/PersonaR7Shots`
/// PERSONA_R7_SUFFIX=-v2 names a re-take's files `<name>-v2.png` (and its text files the same way),
/// next to the first take's, which stay.
@MainActor @Suite(.serialized) struct PersonaR7Shots {
    static var dir: URL? { ProcessInfo.processInfo.environment["PERSONA_R7_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static var suffix: String { ProcessInfo.processInfo.environment["PERSONA_R7_SUFFIX"] ?? "" }

    static func url(_ folder: String, _ name: String) throws -> URL {
        try file(folder, name, "png")
    }

    /// `<folder>/<name><suffix>.<ext>` in the shots folder.
    static func file(_ folder: String, _ name: String, _ ext: String) throws -> URL {
        let f = try #require(dir).appending(path: folder, directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: f, withIntermediateDirectories: true)
        return f.appending(path: "\(name)\(suffix).\(ext)")
    }

    static func save(_ rep: NSBitmapImageRep, _ folder: String, _ name: String) throws {
        try #require(rep.representation(using: .png, properties: [:])).write(to: url(folder, name))
    }

    static func note(_ c: ModelContainer, _ title: String) throws -> Note {
        try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == title && $0.deletedAt == nil })
    }

    /// The notes window in a borderless window far off screen, ordered in so its buttons can be
    /// pressed through the accessibility API (a titled window off screen is pulled back onto it).
    static func pressable(_ c: ModelContainer, note: String, dark: Bool, _ body: (OffscreenAX) async throws -> Void) async throws {
        try await AppSnapshotTests.withLastNote(c, note) {
            let ax = OffscreenAX(RootView().modelContainer(c).environment(SetupStore()).environment(\.controlActiveState, .key),
                                 size: PersonaEditorShots.size, dark: dark)
            defer { ax.close() }
            await ax.settle(1600)
            if let split = AIEditSplit.find(in: ax.window.contentView) {
                split.setPosition(220, ofDividerAt: 0)
                split.setPosition(540, ofDividerAt: 1)
            }
            await ax.settle(800)
            try await body(ax)
        }
    }

    /// The borderless window as drawn, from the notes list rightwards (as PersonaEditorShots'
    /// pictures are: the sidebar's glass can't be drawn off screen), at 2x.
    static func picture(_ ax: OffscreenAX) throws -> NSBitmapImageRep {
        let v = try #require(ax.window.contentView)
        var hidden: [NSView] = []
        func hide(_ view: NSView) {
            let name = String(describing: type(of: view))
            if !view.isHidden, ["BackdropView", "PortalView", "PocketMask", "LuminanceAdjustment", "_NSScrollViewContentBackgroundView", "NSGlassContainerView"].contains(name) {
                view.isHidden = true; hidden.append(view)
            }
            view.subviews.forEach(hide)
        }
        hide(v)
        defer { hidden.forEach { $0.isHidden = false } }
        v.layoutSubtreeIfNeeded()
        v.displayIfNeeded()
        let rep = try #require(v.bitmapImageRepForCachingDisplay(in: v.bounds))
        v.cacheDisplay(in: v.bounds, to: rep)
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: rep.pixelsWide, pixelsHigh: rep.pixelsHigh, bitsPerSample: 8, samplesPerPixel: 4,
                                                hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = rep.size
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        (ax.window.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor.black : NSColor.white).setFill()
        CGRect(origin: .zero, size: rep.size).fill()
        rep.draw(in: CGRect(origin: .zero, size: rep.size), from: .zero, operation: .sourceOver, fraction: 1, respectFlipped: false, hints: nil)
        NSGraphicsContext.current = saved
        let table = try MacEmptyDetailTests.list(ax.window)
        let left = table.convert(table.bounds, to: nil).minX
        let scale = CGFloat(out.pixelsWide) / v.bounds.width
        let image = try #require(out.cgImage?.cropping(to: CGRect(x: (left * scale).rounded(), y: 0, width: CGFloat(out.pixelsWide) - (left * scale).rounded(), height: CGFloat(out.pixelsHigh))))
        return NSBitmapImageRep(cgImage: image)
    }

    // MARK: - C1. The AI's edit on the Mac (light)

    /// The demo library with "Lisbon trip" in Travel, as `-seedTrip` makes it on the iPhone.
    static func tripLibrary() throws -> ModelContainer {
        let c = try PersonaEditorShots.library()
        let travel = try #require(c.mainContext.allFolders().first { $0.name == "Travel" })
        let trip = c.mainContext.createNote(in: .folder(travel.id), body: Capture.lisbonTrip)
        trip.updatedAt = .now.addingTimeInterval(-20 * 60)
        try c.mainContext.save()
        return c
    }

    /// The note before, ChatGPT's edit landing (the highlight, the margin ticks and the receipt),
    /// the review card, then the dates kept, the sentence undone and the tasks kept.
    @Test func c1AIReviewOnTheMac() async throws {
        guard Self.dir != nil else { return }
        let folder = "c1-ai-review"
        ChangeTint.holdForCapture = true
        defer { ChangeTint.holdForCapture = false }
        let c = try Self.tripLibrary()
        try await Self.pressable(c, note: "Lisbon trip", dark: false) { ax in
            try Self.save(try Self.picture(ax), folder, "mac-light-01-note-before")
            Capture.aiEdit(c.mainContext, title: "Lisbon trip", scene: "lisbontrip", by: "ChatGPT")
            await ax.settle(2400)
            try Self.save(try Self.picture(ax), folder, "mac-light-02-edit-landed")
            let review = try #require(ax.find("receipt.review"), "Review on the receipt")
            review.press()
            await ax.settle(1600)
            try Self.save(try Self.picture(ax), folder, "mac-light-03-review-card")
            for (id, name) in [("review.keep.0", "04-kept-dates"), ("review.undo.1", "05-undid-sentence"), ("review.keep.2", "06-kept-tasks")] {
                let button = try #require(ax.find(id), "\(id) on the card")
                button.press()
                await ax.settle(1600)
                try Self.save(try Self.picture(ax), folder, "mac-light-\(name)")
            }
            await ax.settle(2400)
            try Self.save(try Self.picture(ax), folder, "mac-light-07-note-after")
            let body = try Self.note(c, "Lisbon trip").body
            #expect(body.contains("21 May") && body.contains("Sara wants one slow morning") && body.contains("Lisboa cards"), "dates kept, sentence back, tasks kept")
        }
    }

    /// The other choice for the deleted sentence: keep the deletion. The sentence beside it stays,
    /// and is still there when the note is opened again.
    @Test func c1KeepingTheDeletionOnTheMac() async throws {
        guard Self.dir != nil else { return }
        let folder = "c1-ai-review"
        ChangeTint.holdForCapture = true
        defer { ChangeTint.holdForCapture = false }
        let c = try Self.tripLibrary()
        try await Self.pressable(c, note: "Lisbon trip", dark: false) { ax in
            Capture.aiEdit(c.mainContext, title: "Lisbon trip", scene: "lisbontrip", by: "ChatGPT")
            await ax.settle(2400)
            let review = try #require(ax.find("receipt.review"), "Review on the receipt")
            review.press()
            await ax.settle(1600)
            for (id, name) in [("review.keep.0", "08-kept-dates-again"), ("review.keep.1", "09-kept-the-deletion"), ("review.keep.2", "10-kept-everything")] {
                let button = try #require(ax.find(id), "\(id) on the card")
                button.press()
                await ax.settle(1600)
                try Self.save(try Self.picture(ax), folder, "mac-light-\(name)")
            }
        }
        try await Self.pressable(c, note: "Lisbon trip", dark: false) { ax in
            await ax.settle(1600)
            try Self.save(try Self.picture(ax), folder, "mac-light-11-reopened-after-deletion")
        }
        let body = try Self.note(c, "Lisbon trip").body
        #expect(body.contains("Tiles, trams and pastries"), "the sentence beside it stays")
        #expect(!body.contains("Sara wants one slow morning"), "the kept deletion stays deleted")
    }

    // MARK: - C2. Writing on the Mac (dark)

    /// A new note written with the keys' own commands (Return, Tab, Shift-Tab go through the
    /// editor as the keys do), a key at a time with a turn of the run loop after each, as typing
    /// has: # heading, - [ ] checklist, an item indented and outdented, **bold**, [[ with its
    /// suggestions, a web address typed on its own line, a code fence, and a table typed in
    /// Markdown; then Undo, as ⌘Z sends it to the text view. (The first take, 4 November, put the
    /// address in at once and left Undo out: typed, the address split, and Undo crashed the
    /// harness; both fixed on 5 November.)
    @Test func c2WritingOnTheMac() async throws {
        guard Self.dir != nil else { return }
        let folder = "c2-writing"
        let c = try PersonaEditorShots.library()
        let n = c.mainContext.createNote(in: .all, body: "Porto weekend")
        n.updatedAt = .now
        try c.mainContext.save()
        WikiDirectory.invalidate()
        try await PersonaEditorShots.window(c, note: "Porto weekend", dark: true) { w in
            let tv = try PersonaEditorShots.editor(w)
            w.makeFirstResponder(tv)
            tv.setSelectedRange(NSRange(location: (tv.string as NSString).length, length: 0))
            @MainActor func type(_ s: String) async {
                for ch in s {
                    tv.insertText(String(ch), replacementRange: tv.selectedRange())
                    await MacWindowChromeTests.settle(w, 1)
                }
            }
            @MainActor func key(_ sel: Selector) async {
                tv.doCommand(by: sel)
                await MacWindowChromeTests.settle(w, 1)
            }
            let ret = #selector(NSResponder.insertNewline(_:))
            await key(ret); await type("# Saturday"); await key(ret)
            await type("- [ ] Train to Porto at 8:10"); await key(ret)
            await type("Pack the camera")
            await key(#selector(NSResponder.insertTab(_:)))
            await MacWindowChromeTests.settle(w, 6)
            try Self.save(try PersonaEditorShots.picture(w), folder, "mac-dark-01-heading-checklist-indented")
            await key(#selector(NSResponder.insertBacktab(_:)))
            await key(ret); await type("Ask Ana about dinner"); await key(ret); await key(ret)
            await type("Meet **Ana** at São Bento at 10."); await key(ret)
            await type("Ideas from [[Lis")
            await MacWindowChromeTests.settle(w, 8)
            try Self.save(try PersonaEditorShots.picture(w), folder, "mac-dark-02-link-suggestions")
            await key(ret)
            await key(ret)
            await type("https://www.visitporto.travel/en-GB")
            await MacWindowChromeTests.settle(w, 2)
            await key(ret); await key(ret)
            for line in ["```", "rsync -av ~/Pictures/Porto/ ~/Backup/", "```"] { await type(line); await key(ret) }
            await key(ret)
            for line in ["| Day | Plan |", "| --- | --- |", "| Saturday | Ribeira walk |", "| Sunday | Serralves |"] { await type(line); await key(ret) }
            await MacWindowChromeTests.settle(w, 10)
            try Self.save(try PersonaEditorShots.picture(w), folder, "mac-dark-03-written")
            DebouncedSave.flushAll()
            let body = try Self.note(c, "Porto weekend").body
            try body.write(to: try Self.file(folder, "mac-dark-note-as-stored", "md"), atomically: true, encoding: .utf8)
            // Undo, as ⌘Z sends it to the text view.
            tv.undoManager?.undo()
            await MacWindowChromeTests.settle(w, 10)
            try Self.save(try PersonaEditorShots.picture(w), folder, "mac-dark-04-after-undo")
            DebouncedSave.flushAll()
            let undone = try Self.note(c, "Porto weekend").body
            try undone.write(to: try Self.file(folder, "mac-dark-note-after-undo", "md"), atomically: true, encoding: .utf8)
        }
    }

    // MARK: - C3. Search on the Mac (dark)

    /// The iPhone search's library: the 1,284 notes imported from Apple Notes and the four written
    /// for it. Go to Note (⌘O) with a phrase deep in one of them.
    @Test func c3SearchOnTheMac() async throws {
        guard Self.dir != nil else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let notes = ctx.createFolder(named: "Notes")
        DemoData.loadImportedLibrary(into: ctx, main: notes)
        var lines = (1...42).map { "Day \($0): " + ["Measured the wall by the window again.", "Called the plumber about the sink.", "Looked at handles for the drawers.", "Read about worktops; oak needs oil twice a year."][$0 % 4] }
        lines.insert("Order the blue tiles from Viúva Lamego.", at: 31)
        for body in ["Kitchen renovation\n\nWhat we've decided so far, and what's left.\n\n" + lines.joined(separator: "\n"),
                     "Weekend errands\n\n- [ ] Return the library books\n- [ ] Pick up the dry cleaning\n- [ ] Buy a birthday card for Leo\n- [x] Pay the electricity bill",
                     "Porto in October\n\nThree days, mostly walking. The Livraria Lello queue is long before ten.",
                     "Lisbon 7 day plan\n\nA whole week: Alfama, Belém, Sintra, Cascais, LX Factory, then two slow days."] {
            _ = ctx.createNote(in: .folder(notes.id), body: body)
        }
        try ctx.save()
        let count = try ctx.fetchCount(FetchDescriptor<Note>())
        // A typo too (5 November): the notes list's search forgives one; Go to Note is shown as it is.
        for (query, name) in [("blue tiles", "buried-phrase"), ("Lisbon 7", "exact-title"), ("renovaton", "typo")] {
            let hits = await QuickOpen.textHits(for: query, in: c)
            let panel = QuickOpenPanel(notes: QuickOpen.noteItems(in: ctx), commands: [], choose: { _ in }, close: {}, initialQuery: query, initialTextHits: hits)
            let rep = try await PersonaAIShots.shoot(panel.padding(20), size: CGSize(width: QuickOpenPanel.Metrics.width + 40, height: 460), dark: true, wait: 1.5)
            try Self.save(rep, "c3-search", "mac-dark-go-to-note-\(name)")
        }
        try "\(count) notes in the library\n".write(to: try Self.file("c3-search", "mac-library-count", "txt"), atomically: true, encoding: .utf8)
    }

    // MARK: - C7. Apple Notes import (light)

    /// A generated photo (a dusk sky over a roofline), as a pasted picture would be.
    static func photoPNG() -> Data { DemoData.samplePNG() }

    /// "Weekend list", the import tests' note as Notes hands it over (its HTML and its stored
    /// checklist), with a table and a photo put in it, as Notes would write them.
    static var weekendWithTableAndPhoto: String {
        let photo = photoPNG().base64EncodedString()
        let cell = "valign=\"top\" style=\"border-style: solid; border-width: 1.0px 1.0px 1.0px 1.0px; border-color: #ccc; padding: 3.0px 5.0px 3.0px 5.0px; min-width: 70px\""
        func row(_ a: String, _ b: String) -> String { "<tr><td \(cell)><div>\(a)</div>\n</td><td \(cell)><div>\(b)</div>\n</td></tr>" }
        return """
        <div><h1>Weekend list</h1></div>
        <ul>
        <li>Buy oat milk</li>
        <li>Call the plumber</li>
        <li>Book train</li>
        <ul>
        <li>Window seat</li>
        </ul>
        </ul>
        <div><br></div>
        <div>Who brings what on Saturday</div>
        <div><object><table cellspacing="0" cellpadding="0" style="border-collapse: collapse; direction: ltr">
        <tbody>
        \(row("Sara", "Bread and cheese"))
        \(row("Jonas", "Wine"))
        \(row("Leo", "Dessert"))
        </tbody>
        </table></object><br></div>
        <div>The view from the cabin last time</div>
        <div><img style="max-width: 100%; max-height: 100%;" src="data:image/png;base64,\(photo)"/><br></div>
        <div>Leave by nine.</div>
        """
    }

    /// A stand-in for Notes' database holding that note's stored checklist (the import tests').
    static func store() throws -> URL {
        let dir = FileManager.default.temporaryDirectory.appending(path: "r7-notes-fixture-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "NoteStore.sqlite")
        var db: OpaquePointer?
        #expect(sqlite3_open(url.path, &db) == SQLITE_OK)
        defer { sqlite3_close(db) }
        let sql = """
        create table Z_PRIMARYKEY (Z_ENT INTEGER, Z_NAME TEXT);
        insert into Z_PRIMARYKEY values (12, 'ICNote');
        create table ZICCLOUDSYNCINGOBJECT (Z_PK INTEGER PRIMARY KEY, Z_ENT INTEGER, ZISPINNED INTEGER, ZTITLE1 TEXT);
        insert into ZICCLOUDSYNCINGOBJECT values (10, 12, 1, 'Weekend list');
        create table ZICNOTEDATA (Z_PK INTEGER PRIMARY KEY, ZNOTE INTEGER, ZDATA BLOB);
        insert into ZICNOTEDATA values (3, 10, x'\(AppleNotesImportTests.weekendStored)');
        """
        #expect(sqlite3_exec(db, sql, nil, nil, nil) == SQLITE_OK)
        return url
    }

    /// The import sheet over its made-up library (13 notes in five folders, and two locked notes):
    /// the first page, Choose notes, partway, and done. Then the real importer on the fixtures,
    /// and the converted note with its checklist, table and photo in the notes window.
    @Test func c7AppleNotesImport() async throws {
        guard Self.dir != nil else { return }
        let folder = "c7-apple-notes-import"
        AppleNotesBridge.forceDemo = true
        AppleNotesImportView.demoLocked = true
        DateBucket.locale = Locale(identifier: "en_US")
        defer {
            AppleNotesBridge.forceDemo = false; AppleNotesImportView.demoLocked = false; AppleNotesImportView.demoWithoutAccess = false
            AppleNotesImportView.demoPage = nil; DateBucket.locale = .autoupdatingCurrent
        }
        let sheetLibrary = try ImportSheetSnapshots.container()
        for (name, page, size) in [("01-first-page", AppleNotesImportView.DemoPage?.none, CGSize(width: 540, height: AppleNotesImportView.guideHeight)),
                                   ("02-choose-notes", .choosing, AppleNotesImportView.pickerSize),
                                   ("03-importing", .importing, CGSize(width: 540, height: AppleNotesImportView.guideHeight)),
                                   ("04-done-names-locked-notes", .finished, CGSize(width: 540, height: AppleNotesImportView.guideHeight))] {
            AppleNotesImportView.demoPage = page
            let view = AppleNotesImportView().modelContainer(sheetLibrary).tint(Color(PColor.paneAccent)).environment(\.locale, Locale(identifier: "en_US"))
            try await VersionHistorySnapshots.shoot(view, to: try Self.url(folder, "mac-light-\(name)"), size: size, dark: false)
        }
        AppleNotesImportView.demoPage = nil

        // The real importer, on the fixtures: the note, and the two locked notes it names.
        let c = try PersonaEditorShots.library()
        let ctx = c.mainContext
        for n in try ctx.fetch(FetchDescriptor<Note>()) where n.title == "Weekend list" { ctx.delete(n) }
        try ctx.save()
        let url = try Self.store()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        var importer = AppleNotesImporter(context: ctx)
        let html = Self.weekendWithTableAndPhoto
        importer.body = { id in
            if id.hasSuffix("p10") { return html }
            throw AppleNotesBridge.Failure.script("Notes got an error.")
        }
        importer.openStore = { try? AppleNoteStore.open(at: url).get() }
        let day = Date.now.addingTimeInterval(-3 * 86_400)
        let notes = [
            AppleNote(id: "x-coredata://R7/ICNote/p10", name: "Weekend list", folder: "Notes", modified: day.addingTimeInterval(3600), created: day),
            AppleNote(id: "x-coredata://R7/ICNote/p11", name: "Journal", folder: "Notes", modified: day, created: day, locked: true),
            AppleNote(id: "x-coredata://R7/ICNote/p12", name: "Surprise party for Leo", folder: "Home", modified: day, created: day, locked: true),
        ]
        let summary = await importer.run(notes, keepFolders: true) { _, _ in }
        try ctx.save()
        let en = Locale(identifier: "en_US")
        let said = [summary.line(locale: en), summary.leftLine(locale: en) ?? "", AppleNotesImportView.successLine(locked: summary.notImported.map(\.name), locale: en)]
            + summary.notImported.map { "\($0.name): \($0.why)" }
        try said.joined(separator: "\n").write(to: try #require(Self.dir).appending(path: "\(folder)/mac-import-summary.txt"), atomically: true, encoding: .utf8)
        let weekend = try Self.note(c, "Weekend list")
        try weekend.body.write(to: try #require(Self.dir).appending(path: "\(folder)/mac-converted-note-as-stored.md"), atomically: true, encoding: .utf8)
        #expect(weekend.body.contains("- [x] Call the plumber"), "the checklist with its ticks")
        try await PersonaEditorShots.window(c, note: "Weekend list", dark: false) { w in
            try Self.save(try PersonaEditorShots.picture(w), folder, "mac-light-05-converted-note")
            try await PersonaEditorShots.scrollToEnd(w)
            try Self.save(try PersonaEditorShots.picture(w), folder, "mac-light-06-converted-note-photo")
        }
    }

    // MARK: - C8. An Obsidian vault in and out (dark)

    /// A small made-up vault: nested folders, [[wikilinks]] (one with an alias, one to a heading),
    /// tags in front matter and inline, two images, tasks, and Obsidian's settings folder.
    static func vault() throws -> URL {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appending(path: "r7-vault-\(UUID().uuidString)/Garden vault")
        func write(_ path: String, _ text: String) throws {
            let u = root.appending(path: path)
            try fm.createDirectory(at: u.deletingLastPathComponent(), withIntermediateDirectories: true)
            try text.write(to: u, atomically: true, encoding: .utf8)
        }
        try write(".obsidian/app.json", "{\"attachmentFolderPath\": \"Attachments\"}\n")
        try write("Home.md", """
        ---
        tags: [garden, home]
        created: 2026-03-02
        aliases: [Garden home]
        ---
        # Home

        Everything about the garden, in one place.

        - [[Greenhouse]] for this season's jobs
        - [[Plot plan]] for the allotment
        - [[Seed catalogue|Seeds to order]]
        - What to do first: [[Greenhouse#Jobs]]

        #garden
        """)
        try write("Projects/Greenhouse.md", """
        ---
        tags: [garden/greenhouse]
        status: active
        ---
        # Greenhouse

        ![[greenhouse.png]]

        ## Jobs
        - [ ] Fix the vent window before the frost
        - [ ] Move the tomatoes to bigger pots
        - [x] Order tomato seeds from the [[Seed catalogue]]

        Back to [[Home]].
        """)
        try write("Projects/Allotment/Plot plan.md", """
        # Plot plan

        ![[plot.png]]

        | Bed | This year |
        | --- | --- |
        | 1 | Potatoes |
        | 2 | Beans and peas |
        | 3 | Onions |

        #allotment
        """)
        try write("Reading/Seed catalogue.md", """
        ---
        tags: [reading, seeds]
        ---
        # Seed catalogue

        - Tomato, Gardener's Delight
        - Runner bean, Firestorm
        - Sweet pea, Matucana
        """)
        try fm.createDirectory(at: root.appending(path: "Attachments"), withIntermediateDirectories: true)
        try DemoData.samplePNG().write(to: root.appending(path: "Attachments/greenhouse.png"))
        try Self.plotPNG().write(to: root.appending(path: "Attachments/plot.png"))
        return root
    }

    /// Three beds from above.
    static func plotPNG() -> Data {
        let w = 720, h = 360
        guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(),
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return Data() }
        ctx.setFillColor(CGColor(red: 0.55, green: 0.42, blue: 0.3, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
        let greens = [CGColor(red: 0.36, green: 0.55, blue: 0.27, alpha: 1), CGColor(red: 0.45, green: 0.62, blue: 0.3, alpha: 1), CGColor(red: 0.6, green: 0.68, blue: 0.32, alpha: 1)]
        for (i, g) in greens.enumerated() { ctx.setFillColor(g); ctx.fill(CGRect(x: 30 + i * 230, y: 40, width: 200, height: 280)) }
        guard let img = ctx.makeImage() else { return Data() }
        let rep = NSBitmapImageRep(cgImage: img)
        return rep.representation(using: .png, properties: [:]) ?? Data()
    }

    /// Text as a plain editor shows it, for the exported files: monospaced, on the page.
    struct PlainText: View {
        let title: String
        let text: String
        var body: some View {
            VStack(alignment: .leading, spacing: 10) {
                Text(title).font(.system(size: 12, weight: .semibold)).foregroundStyle(.secondary)
                Text(text).font(.system(size: 13, design: .monospaced)).foregroundStyle(.primary).fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(Color(nsColor: .textBackgroundColor), in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color(nsColor: .separatorColor)))
            }
            .padding(20)
        }
    }

    /// The folder as a tree, as `tree` draws one.
    static func tree(_ url: URL, prefix: String = "") -> [String] {
        let items = ((try? FileManager.default.contentsOfDirectory(at: url, includingPropertiesForKeys: [.isDirectoryKey])) ?? [])
            .filter { !$0.lastPathComponent.hasPrefix(".") }
            .sorted { $0.lastPathComponent.localizedStandardCompare($1.lastPathComponent) == .orderedAscending }
        var out: [String] = []
        for (i, item) in items.enumerated() {
            let last = i == items.count - 1
            let isDir = (try? item.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) ?? false
            out.append(prefix + (last ? "└── " : "├── ") + item.lastPathComponent + (isDir ? "/" : ""))
            if isDir { out += tree(item, prefix: prefix + (last ? "    " : "│   ")) }
        }
        return out
    }

    /// The vault through Obsidian's import (what it found, done), its notes in the window, a link
    /// followed, then Export All Notes and what it wrote.
    @Test func c8ObsidianInAndOut() async throws {
        guard Self.dir != nil else { return }
        let folder = "c8-obsidian"
        let vault = try Self.vault()
        defer { try? FileManager.default.removeItem(at: vault.deletingLastPathComponent()) }
        let source = ImportKind.obsidian.inspect(vault)
        let guide = ImportGuide.obsidian(picture: nil)
        let sheet = PersonaImportShots.sheet
        let found = ImportGuideFlow.found([source], notes: source.notes, kind: .obsidian).map { ($0.name, $0.detail, "Import \(source.name)") }
        try await VersionHistorySnapshots.shoot(ImportGuideSheet(guide: guide, page: .drop(.found), found: found, foundRows: ImportGuideFlow.foundRows([source], kind: .obsidian), height: sheet.height),
                                                to: try Self.url(folder, "mac-dark-01-import-found"), size: sheet, dark: true)
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: false, welcome: false)
        let summary = await ImportKind.obsidian.run([source], into: .perSource, context: c.mainContext, progress: { _, _ in }, shouldStop: { false })
        try c.mainContext.save()
        WikiDirectory.invalidate()
        let line = [guide.success.line.replacingOccurrences(of: "{folder}", with: source.name), ImportGuideFlow.leftLine([source], kind: .obsidian)].compactMap { $0 }.joined(separator: " ")
        try await VersionHistorySnapshots.shoot(ImportGuideSheet(guide: guide, page: .success, brought: summary.notes, broughtLine: line, height: sheet.height),
                                                to: try Self.url(folder, "mac-dark-02-import-done"), size: sheet, dark: true)
        for n in try c.mainContext.fetch(FetchDescriptor<Note>()) {
            try? n.body.write(to: try #require(Self.dir).appending(path: "\(folder)/mac-imported-\(NoteExport.safeName(n.title)).md"), atomically: true, encoding: .utf8)
        }
        try await PersonaEditorShots.window(c, note: "Home", dark: true) { w in
            try Self.save(try PersonaEditorShots.picture(w), folder, "mac-dark-03-home-imported")
            let tv = try PersonaEditorShots.editor(w)
            let r = (tv.string as NSString).range(of: "Greenhouse")
            if r.location != NSNotFound, let link = tv.textStorage?.attribute(.link, at: r.location, effectiveRange: nil) {
                _ = tv.textView(tv, clickedOnLink: link, at: r.location)
            }
            await MacWindowChromeTests.settle(w, 24)
            try Self.save(try PersonaEditorShots.picture(w), folder, "mac-dark-04-followed-link-greenhouse")
        }
        try await PersonaEditorShots.window(c, note: "Plot plan", dark: true) { w in
            try Self.save(try PersonaEditorShots.picture(w), folder, "mac-dark-05-nested-folder-note")
        }

        // Out again: Export All Notes, unzipped, as any other app would see it.
        let made = try await NoteExport.make(c.mainContext)
        let out = FileManager.default.temporaryDirectory.appending(path: "r7-export-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: out); try? FileManager.default.removeItem(at: made.zip.deletingLastPathComponent()) }
        try FileManager.default.unzipItem(at: made.zip, to: out)
        let top = try #require(try FileManager.default.contentsOfDirectory(at: out, includingPropertiesForKeys: nil).first { !$0.lastPathComponent.hasPrefix(".") && !$0.lastPathComponent.hasPrefix("__") })
        let treeText = ([top.lastPathComponent + "/"] + Self.tree(top)).joined(separator: "\n")
        try treeText.write(to: try #require(Self.dir).appending(path: "\(folder)/mac-export-tree.txt"), atomically: true, encoding: .utf8)
        let treeHeight = CGFloat(treeText.components(separatedBy: "\n").count) * 17 + 110
        try Self.save(try await PersonaAIShots.shoot(PlainText(title: "\(made.zip.lastPathComponent), unzipped: \(made.notes) notes, \(made.files) files", text: treeText),
                                                    size: CGSize(width: 760, height: treeHeight), dark: true, wait: 0.8), folder, "mac-dark-06-export-tree")
        let greenhouse = try #require(FileManager.default.enumerator(at: top, includingPropertiesForKeys: nil)?.compactMap { $0 as? URL }.first { $0.lastPathComponent == "Greenhouse.md" })
        let text = try String(contentsOf: greenhouse, encoding: .utf8)
        try text.write(to: try #require(Self.dir).appending(path: "\(folder)/mac-export-Greenhouse.md"), atomically: true, encoding: .utf8)
        let relative = greenhouse.path.replacingOccurrences(of: top.deletingLastPathComponent().path + "/", with: "")
        let height = CGFloat(text.components(separatedBy: "\n").count) * 17 + 110
        try Self.save(try await PersonaAIShots.shoot(PlainText(title: relative, text: text), size: CGSize(width: 760, height: height), dark: true, wait: 0.8),
                      folder, "mac-dark-07-exported-greenhouse-md")
        // Home had aliases and a created date in its front matter: what came out of them.
        let home = try #require(FileManager.default.enumerator(at: top, includingPropertiesForKeys: nil)?.compactMap { $0 as? URL }.first { $0.lastPathComponent == "Home.md" })
        try String(contentsOf: home, encoding: .utf8).write(to: try #require(Self.dir).appending(path: "\(folder)/mac-export-Home.md"), atomically: true, encoding: .utf8)
    }
}
#endif
