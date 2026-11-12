#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
import ZIPFoundation
@testable import Pane

/// Before and after pictures for the persona council's import round (W5, 4 November 2026): the
/// opaque bar over a scrolled note, a Notion database as one note with a typed table and the
/// preview before importing, Apple Notes' and Obsidian's previews and last pages, and Trip costs.
/// The before is drawn on the branch's base (persona/editor-1.3) with the after-only parts
/// compiled out (PERSONA_BEFORE); the after on the branch. Offscreen windows, never shown.
/// Runs only when PERSONA_SHOTS is set:
/// `TEST_RUNNER_PERSONA_SHOTS=/tmp/shots TEST_RUNNER_PERSONA_SIDE=after scripts/qa-test.sh PaneTests/PersonaImportShots`
@MainActor @Suite(.serialized) struct PersonaImportShots {
    static var dir: URL? { PersonaEditorShots.dir }
    static let modes = PersonaEditorShots.modes
    static let sheet = CGSize(width: 540, height: 560)

    static func url(_ slug: String, _ name: String) throws -> URL { try PersonaEditorShots.url(slug, name) }

    // MARK: - 1. The bar over a scrolled note

    /// A long note in Travel scrolled to its end, so its text passes under the bar (Travel, the
    /// buttons). Lisbon was too short to scroll under it. The before is drawn with the base's
    /// NoteDetailView.swift, the one file that draws the bar's cover.
    @Test func barOverScrolledText() async throws {
        guard Self.dir != nil else { return }
        let c = try PersonaEditorShots.library()
        let travel = try #require(c.mainContext.allFolders().first { $0.name == "Travel" })
        let lines = (1...140).map { "Line \($0): the long read goes on and on, words across the whole column, so some are always under the bar." }
        _ = c.mainContext.createNote(in: .folder(travel.id), body: "Long read\n\n" + lines.joined(separator: "\n"))
        try c.mainContext.save()
        try await PersonaEditorShots.keeping([]) {
            for m in Self.modes {
                try await PersonaEditorShots.window(c, note: "Long read", dark: m.dark) { w in
                    try await PersonaEditorShots.scrollToEnd(w)
                    try PersonaEditorShots.save(try PersonaEditorShots.picture(w), "opaque-bar", "long-note-end-\(m.name)")
                }
            }
        }
    }

    // MARK: - 2. A Notion database (Notion switchers)

    /// A small workspace export as Notion sends it: a .zip of two .zip parts, a page with a
    /// subpage and a reading list database (title, text, select, number, date and checkbox
    /// columns) whose rows each have a page.
    static func notionExport() throws -> URL {
        let fm = FileManager.default
        let base = fm.temporaryDirectory.appending(path: "notion-shots-\(UUID().uuidString)")
        let id = "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
        let home = "Home \(id)", trip = "Trip to Lisbon 2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e", reading = "Reading list 3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f"
        func write(_ part: String, _ path: String, _ text: String) throws {
            let url = base.appending(path: "\(part)/\(path)")
            try fm.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try text.write(to: url, atomically: true, encoding: .utf8)
        }
        func enc(_ s: String) -> String { s.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? s }
        try write("part1", "\(home).md", "# Home\n\nPlans and lists.\n\n[Trip to Lisbon](\(enc(home))/\(enc(trip)).md)\n\n[Reading list](\(enc(home))/\(enc(reading)).csv)\n")
        try write("part1", "\(home)/\(trip).md", "# Trip to Lisbon\n\nCreated: October 2, 2026 9:15 AM\nTags: travel\n\nFour days in May.\n")
        let csv = """
        Name,Author,Status,Pages,Finished,Owned
        Dune,Frank Herbert,Read,412,"September 12, 2026",Yes
        The Overstory,Richard Powers,Reading,502,,No
        Piranesi,Susanna Clarke,Read,272,"October 3, 2026",Yes
        Klara and the Sun,Kazuo Ishiguro,To read,303,,No
        """
        try write("part2", "\(home)/\(reading).csv", csv + "\n")
        try write("part2", "\(home)/\(reading)_all.csv", csv + "\n")
        let rows: [(String, String, String, String, String, String, String)] = [
            ("Dune 4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a", "Dune", "Frank Herbert", "Read", "412", "September 12, 2026", "Spice must flow. Reread the appendix on ecology."),
            ("The Overstory 5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", "The Overstory", "Richard Powers", "Reading", "502", "", ""),
            ("Piranesi 6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c", "Piranesi", "Susanna Clarke", "Read", "272", "October 3, 2026", "The house is endless."),
            ("Klara and the Sun 7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d", "Klara and the Sun", "Kazuo Ishiguro", "To read", "303", "", ""),
        ]
        for r in rows {
            let finished = r.5.isEmpty ? "" : "Finished: \(r.5)\n"
            try write("part2", "\(home)/\(reading)/\(r.0).md", "# \(r.1)\n\nAuthor: \(r.2)\nStatus: \(r.3)\nPages: \(r.4)\n\(finished)\n\(r.6)\n")
        }
        let parts = base.appending(path: "download")
        try fm.createDirectory(at: parts, withIntermediateDirectories: true)
        try fm.zipItem(at: base.appending(path: "part1"), to: parts.appending(path: "Export-5e6f7a8b-Part-1.zip"), shouldKeepParent: false)
        try fm.zipItem(at: base.appending(path: "part2"), to: parts.appending(path: "Export-5e6f7a8b-Part-2.zip"), shouldKeepParent: false)
        let zip = base.appending(path: "8a1f2b3c_Export-5e6f7a8b.zip")
        try fm.zipItem(at: parts, to: zip, shouldKeepParent: false)
        return zip
    }

    /// The demo library with the Notion export imported.
    static func notionLibrary() async throws -> ModelContainer {
        let c = try PersonaEditorShots.library()
        // The demo's own Reading list (in Ideas) goes, so the window opens on Notion's.
        for n in try c.mainContext.fetch(FetchDescriptor<Note>()) where n.title == "Reading list" { c.mainContext.delete(n) }
        try c.mainContext.save()
        let source = ImportKind.notion.inspect(try notionExport())
        _ = await MarkdownImporter(context: c.mainContext).run([source], into: .perSource)
        try c.mainContext.save()
        WikiDirectory.invalidate()
        return c
    }

    /// The notes window on Home (where the database is), the database itself and one row.
    @Test func notionDatabase() async throws {
        guard Self.dir != nil else { return }
        let c = try await Self.notionLibrary()
        let titles = Set(((try? c.mainContext.fetch(FetchDescriptor<Note>())) ?? []).map(\.title))
        try await PersonaEditorShots.keeping([]) {
            for m in Self.modes {
                for (note, name) in [("Home", "home"), ("Reading list", "database"), ("Dune", "row")] where titles.contains(note) {
                    try await PersonaEditorShots.window(c, note: note, dark: m.dark) { w in
                        try PersonaEditorShots.save(try PersonaEditorShots.picture(w), "notion-database", "\(name)-\(m.name)")
                    }
                }
            }
        }
    }

    /// Notion's guide with the download picked (the page before Import) and its last page.
    @Test func notionPreview() async throws {
        guard Self.dir != nil else { return }
        let zip = try Self.notionExport()
        let source = ImportKind.notion.inspect(zip)
        let guide = try #require(ImportGuide.live(.notion))
        for m in Self.modes {
            #if PERSONA_BEFORE
            let found = (zip.lastPathComponent, "\(source.notes) notes", "Import \(source.notes) Notes")
            let foundPage = ImportGuideSheet(guide: guide, page: .drop(.found), found: found, height: Self.sheet.height)
            let brought = source.notes
            #else
            let found = ImportGuideFlow.found([source], notes: source.notes, kind: .notion)
            let foundPage = ImportGuideSheet(guide: guide, page: .drop(.found), found: found,
                                             foundNote: ImportGuideFlow.foundNote([source], kind: .notion), foundRows: ImportGuideFlow.foundRows([source], kind: .notion), height: Self.sheet.height)
            let brought = source.notes + (source.preview?.databases ?? 0)
            #endif
            try await VersionHistorySnapshots.shoot(foundPage, to: try Self.url("notion-preview", "found-\(m.name)"), size: Self.sheet, dark: m.dark)
            try await VersionHistorySnapshots.shoot(ImportGuideSheet(guide: guide, page: .success, brought: brought, height: Self.sheet.height),
                                                    to: try Self.url("notion-preview", "done-\(m.name)"), size: Self.sheet, dark: m.dark)
        }
    }

    // MARK: - 3. Apple Notes and Obsidian: what will come, what came

    /// Apple Notes' sheet with the made-up library, as it opens and when it's done.
    @Test func appleNotesPreview() async throws {
        guard Self.dir != nil else { return }
        AppleNotesBridge.forceDemo = true
        DateBucket.locale = Locale(identifier: "en_US")
        defer { AppleNotesBridge.forceDemo = false; AppleNotesImportView.demoWithoutAccess = false; AppleNotesImportView.demoPage = nil; DateBucket.locale = .autoupdatingCurrent }
        #if !PERSONA_BEFORE
        // Two locked notes in the library: the base's made-up library had none to say.
        AppleNotesImportView.demoLocked = true
        defer { AppleNotesImportView.demoLocked = false }
        #endif
        let c = try ImportSheetSnapshots.container()
        for m in Self.modes {
            for (name, page, without) in [("choose", AppleNotesImportView.DemoPage?.none, false), ("choose-no-database", nil, true), ("done", .finished, false)] {
                AppleNotesImportView.demoPage = page
                AppleNotesImportView.demoWithoutAccess = without
                let view = AppleNotesImportView().modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.locale, Locale(identifier: "en_US"))
                try await VersionHistorySnapshots.shoot(view, to: try Self.url("import-preview", "apple-notes-\(name)-\(m.name)"),
                                                        size: CGSize(width: 540, height: AppleNotesImportView.guideHeight), dark: m.dark)
            }
        }
    }

    /// Obsidian's guide with a vault picked and its last page.
    @Test func obsidianPreview() async throws {
        guard Self.dir != nil else { return }
        let guide = ImportGuide.obsidian(picture: nil)
        for m in Self.modes {
            #if PERSONA_BEFORE
            let found = ("Second brain", "1,126 notes", "Import Second brain")
            let foundPage = ImportGuideSheet(guide: guide, page: .drop(.found), found: found, height: Self.sheet.height)
            let donePage = ImportGuideSheet(guide: guide, page: .success, brought: 1_126, height: Self.sheet.height)
            #else
            let found = ImportGuideFlow.found([Self.vault], notes: Self.vault.notes, kind: .obsidian).map { ($0.name, $0.detail, "Import Second brain") }
            let foundPage = ImportGuideSheet(guide: guide, page: .drop(.found), found: found, foundRows: ImportGuideFlow.foundRows([Self.vault], kind: .obsidian), height: Self.sheet.height)
            let line = [guide.success.line.replacingOccurrences(of: "{folder}", with: "Second brain"), ImportGuideFlow.leftLine([Self.vault], kind: .obsidian)].compactMap { $0 }.joined(separator: " ")
            let donePage = ImportGuideSheet(guide: guide, page: .success, brought: 1_126, broughtLine: line, height: Self.sheet.height)
            #endif
            try await VersionHistorySnapshots.shoot(foundPage, to: try Self.url("import-preview", "obsidian-found-\(m.name)"), size: Self.sheet, dark: m.dark)
            try await VersionHistorySnapshots.shoot(donePage, to: try Self.url("import-preview", "obsidian-done-\(m.name)"), size: Self.sheet, dark: m.dark)
        }
    }

    #if !PERSONA_BEFORE
    /// A vault as Obsidian's inspect finds it: 1,126 notes, 14 of them with embedded notes, 3 canvases.
    static var vault: ImportSource {
        var s = ImportSource(url: URL(fileURLWithPath: "/Users/sara/Documents/Second brain"), name: "Second brain", notes: 1_126, bytes: 48_000_000)
        s.preview = ImportPreview(notes: 1_126, embeds: 14, canvases: 3, files: 212)
        return s
    }
    #endif

    // MARK: - 4. Trip costs (Sara)

    /// A trip's costs in a table with Paid by: what Make It an App offers for it.
    static let tripCosts = """
    Lisbon costs

    | What | Paid by | Amount |
    | --- | --- | --- |
    | Flat, four nights | Sara | 480 |
    | Dinner at Ramiro | Leo | 96 |
    | Train to Sintra | Sara | 18 |
    """

    @Test func makeAnAppForCosts() async throws {
        guard Self.dir != nil else { return }
        defer { MakeAppSheet.stateForPictures = nil }
        MakeAppSheet.stateForPictures = "chatgpt"
        for m in Self.modes {
            let view = MakeAppSheet(noteID: UUID(), title: "Lisbon costs", body_: Self.tripCosts)
                .environment(\.controlActiveState, .key)
                .fixedSize()
            let host = NSHostingView(rootView: view)
            host.appearance = NSAppearance(named: m.dark ? .darkAqua : .aqua)
            host.frame = CGRect(origin: .zero, size: host.fittingSize)
            try await Task.sleep(for: .milliseconds(500))
            let size = host.fittingSize
            try await VersionHistorySnapshots.shoot(view, to: try Self.url("trip-costs", "make-an-app-\(m.name)"), size: size, dark: m.dark)
        }
    }

    /// Templates, as the sidebar opens them: every one, and (after) Trip costs open.
    @Test func templates() async throws {
        guard Self.dir != nil else { return }
        let catalog = TemplateCatalog.shipped
        for m in Self.modes {
            try await VersionHistorySnapshots.shoot(TemplateLibraryView(catalog: catalog, ais: [.chatgpt, .claude], open: nil).environment(\.inSheet, true),
                                                    to: try Self.url("trip-costs", "templates-\(m.name)"), size: TemplateLibraryView.size, dark: m.dark)
            if let costs = catalog.entries.first(where: { $0.slug == "trip-costs" }) {
                try await VersionHistorySnapshots.shoot(TemplateLibraryView(catalog: catalog, ais: [.chatgpt, .claude], open: costs).environment(\.inSheet, true),
                                                        to: try Self.url("trip-costs", "templates-open-\(m.name)"), size: TemplateLibraryView.size, dark: m.dark)
            }
        }
    }
}
#endif
