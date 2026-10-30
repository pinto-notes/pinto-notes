import Foundation
import SwiftData
import Testing
import ZIPFoundation
@testable import Pane

/// The Markdown and text import: front matter, titles, dates and tags; links and embeds from
/// Obsidian, Notion, Bear, Joplin and Logseq; and each app's export tree imported end to end.
@MainActor @Suite(.serialized) struct MarkdownImportTests {
    /// Export trees as the apps write them (PaneTests/Fixtures/Markdown), copied somewhere writable.
    static func fixture(_ name: String) throws -> URL {
        let src = try #require(Bundle(for: MarkdownFixtureToken.self).url(forResource: "Markdown", withExtension: nil)).appending(path: name)
        let dir = FileManager.default.temporaryDirectory.appending(path: "md-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let dest = dir.appending(path: name)
        try FileManager.default.copyItem(at: src, to: dest)
        return dest
    }

    @MainActor struct Imported {
        let container: ModelContainer
        let summary: ImportSummary
        var context: ModelContext { container.mainContext }
        var notes: [Note] { ((try? context.fetch(FetchDescriptor<Note>())) ?? []).filter { $0.deletedAt == nil } }
        var files: [Pane.Attachment] { (try? context.fetch(FetchDescriptor<Pane.Attachment>())) ?? [] }
        func note(_ title: String) throws -> Note { try #require(notes.first { $0.title == title }, "no note \(title)") }
        func path(_ n: Note) -> String {
            var parts: [String] = []
            var f = n.folder
            while let x = f { parts.insert(x.name, at: 0); f = x.parent }
            return parts.joined(separator: "/")
        }
        func cleanUp() { for f in files { try? FileManager.default.removeItem(at: FileStore.url(for: f.id, filename: f.filename).deletingLastPathComponent()) } }
    }

    static func importing(_ urls: [URL], into destination: ImportDestination = .perSource, container: ModelContainer? = nil) async throws -> Imported {
        let c = try container ?? ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let sources = urls.map(MarkdownImporter.inspect)
        let summary = await MarkdownImporter(context: c.mainContext).run(sources, into: destination)
        return Imported(container: c, summary: summary)
    }

    static func utc(_ s: String) -> Date { ISO8601DateFormatter().date(from: s)! }

    // MARK: Parsing

    @Test func frontMatterTitleDatesAndTags() {
        let n = MarkdownNote.parse("---\ntitle: \"Trip: Porto\"\ncreated: 2024-03-02T09:15:00Z\nupdated: 2024-03-05 18:40:00Z\ntags:\n  - travel\n  - \"family time\"\naliases: [Porto]\n---\n\nFlights on Friday.\n", fileName: "porto")
        #expect(n.title == "Trip: Porto")
        #expect(n.created == Self.utc("2024-03-02T09:15:00Z") && n.updated == Self.utc("2024-03-05T18:40:00Z"))
        #expect(n.tags == ["travel", "family time"])
        #expect(n.body.trimmingCharacters(in: .newlines) == "Flights on Friday.")
        #expect(MarkdownNote.parse("---\ntags: [a, \"b c\"]\ndate: 2023-01-05\n---\nx", fileName: "f").tags == ["a", "b c"])
        #expect(MarkdownNote.parse("---\ntags: #one #two\n---\nx", fileName: "f").tags == ["one", "two"])
    }

    /// Keys Pinto has no use for stay with the note as written, for the export to write back;
    /// the title, dates and tags it takes don't.
    @Test func frontMatterKeepsWhatPintoDoesntUse() {
        let n = MarkdownNote.parse("---\ntitle: Porto\ncreated: 2024-03-02\ntags:\n- travel\naliases:\n  - Oporto\n  - \"Porto trip\"\nsource: https://example.com\nmeta:\n  rating: 5\ndate: someday\n---\nFlights.\n", fileName: "porto")
        #expect(n.tags == ["travel"], "an unindented list is a list")
        #expect(n.aliases == ["Oporto", "Porto trip"])
        #expect(n.kept == "aliases:\n  - Oporto\n  - \"Porto trip\"\nsource: https://example.com\nmeta:\n  rating: 5\ndate: someday", "a date that isn't one stays as written")
        #expect(MarkdownNote.parse("---\ntitle: x\ntags: [a]\n---\nx", fileName: "f").kept == nil)
        #expect(MarkdownNote.parse("No front matter", fileName: "f").kept == nil)
        #expect(MarkdownNote.unquote("\"say \\\"hi\\\"\"") == "say \"hi\"" && MarkdownNote.unquote("'it''s'") == "it's")
    }

    /// Tags already in the text aren't added again (an exported note has them in both places).
    @Test func tagsInTheTextArentRepeated() {
        #expect(ImportWriter.tagLine(["home", "Big ideas", "work"], besides: "Plan #home\n\n#big-ideas") == "#work")
        #expect(ImportWriter.tagLine(["home"], besides: "Plan #home") == nil)
        #expect(ImportWriter.tagLine(["home"], besides: "Plan [x](#home)") == "#home", "only a hashtag counts")
    }

    @Test func theTitleIsTheFirstHeadingElseNone() {
        let h = MarkdownNote.parse("\n# Kitchen remodel\n\nPlan.\n## Budget\n", fileName: "kitchen")
        #expect(h.title == "Kitchen remodel" && h.body.hasPrefix("\nPlan."))
        let none = MarkdownNote.parse("Plan first.\n# Later heading\n", fileName: "kitchen")
        #expect(none.title == nil, "a heading further down isn't the title; the file name is")
        #expect(MarkdownNote.parse("# Not a heading in text\nx", fileName: "f", plainText: true).title == nil)
    }

    /// Air test 10-13: Obsidian's "Weekly review" came in titled "What went well", its first section.
    @Test func aSectionHeadingIsNotTheTitle() {
        let n = MarkdownNote.parse("## What went well\n\nShipped.\n", fileName: "Weekly review")
        #expect(n.title == nil, "the file name is the title")
        #expect(n.body.hasPrefix("## What went well"))
        #expect(MarkdownNote.parse("## Weekly review\n\nShipped.", fileName: "Weekly review").title == "Weekly review", "a heading that repeats the name is the title")
    }

    @Test func logseqPropertiesAndTasks() {
        let n = MarkdownNote.parse("tags:: reading, friends\nalias:: Books\n\n- TODO pick a book\n- DONE invites\n  id:: 65f2a1b0\n\t- LATER table\n- CANCELED party\n```\n- TODO in code\n```", fileName: "Book club")
        #expect(n.tags == ["reading", "friends"])
        #expect(n.body == "- [ ] pick a book\n- [x] invites\n\t- [ ] table\n- [x] party\n```\n- TODO in code\n```")
    }

    @Test func notionPropertiesGiveDatesAndTagsAndKeepTheRest() {
        let n = MarkdownNote.parse("# Dune\n\nCreated: September 12, 2023 3:04 PM\nAuthor: Frank Herbert\nTags: books, sci-fi\n\nSpice.", fileName: "Dune", notion: true)
        #expect(n.title == "Dune" && n.tags == ["books", "sci-fi"])
        #expect(n.created != nil)
        #expect(n.body == "Author: Frank Herbert\n\nSpice.")
    }

    @Test func dates() {
        #expect(MarkdownNote.date("2023-04-11 10:24:32Z") == Self.utc("2023-04-11T10:24:32Z"))
        #expect(MarkdownNote.date("2023-04-11T10:24:32.120+02:00") != nil)
        #expect(MarkdownNote.date("1710400000") == Date(timeIntervalSince1970: 1_710_400_000))
        #expect(MarkdownNote.date("1710400000000") == Date(timeIntervalSince1970: 1_710_400_000))
        #expect(MarkdownNote.date("2023-04-11") != nil && MarkdownNote.date("next week") == nil)
    }

    @Test func linksAndEmbeds() {
        var missing = 0
        let files = ["cabin.png": "![cabin.png](pane-file:1)", "Trip%20abc/IMG.png": "![IMG.png](pane-file:2)", "plan.pdf": "[plan.pdf](pane-file:3)"]
        let out = MarkdownNote.rewriteLinks("""
        See [[Projects/Kitchen remodel|the kitchen]], [[Reading list]] and [[Kitchen remodel#Budget]].
        ![[cabin.png]]
        ![[cabin.png|300]] after
        Text ![photo](Trip%20abc/IMG.png "Porto") and [the plan](plan.pdf) and [web](https://example.com/a) and [top](#top).
        - ![[gone.png]]
        <img src="cabin.png" width="200"> and [Packing](Packing%20list%20abc.md)
        ```
        [[code]] ![[cabin.png]]
        ```
        `[[in code]]` stays
        """, file: { files[$0] }, note: { raw, wiki in
            wiki ? ["Projects/Kitchen remodel": "Kitchen remodel", "Kitchen remodel": "Kitchen remodel"][raw] : raw.hasPrefix("Packing") ? "Packing list" : nil
        }, missing: { missing += 1 })
        #expect(out == """
        See [[Kitchen remodel|the kitchen]], [[Reading list]] and [[Kitchen remodel#Budget]].
        ![cabin.png](pane-file:1)
        after
        ![cabin.png](pane-file:1)
        Text  and the plan and [web](https://example.com/a) and [top](#top).
        ![IMG.png](pane-file:2)
        [plan.pdf](pane-file:3)
        and [[Packing list|Packing]]
        ![cabin.png](pane-file:1)
        ```
        [[code]] ![[cabin.png]]
        ```
        `[[in code]]` stays
        """)
        #expect(missing == 1)
        #expect(MarkdownImporter.cleanName("Trip to Porto 3f2a9c1b7d4e4f0a8b6c5d4e3f2a1b0c") == "Trip to Porto")
    }

    // MARK: Each app's export

    @Test func obsidianVault() async throws {
        let r = try await Self.importing([try Self.fixture("Obsidian vault")])
        defer { r.cleanUp() }
        let s = r.summary
        #expect(s.notes == 4 && s.trashed == 1 && s.attachments == 2 && s.filesMissing == 1 && s.notNotes == 0)
        let welcome = try r.note("Welcome")
        let cabin = try #require(r.files.first { $0.filename == "cabin.png" })
        #expect(welcome.body == """
        Welcome
        This vault is for the [[Kitchen remodel|kitchen]] and [[Reading list]].

        \(cabin.markdown)

        - [ ] Call the carpenter
        - [x] Order tiles

        | Room | Budget |
        | --- | --- |
        | Kitchen | 4,000 € |

        ```
        [[not a link]] stays as typed
        ```

        [[Kitchen remodel]]

        #inbox #ideas

        """)
        #expect(welcome.createdAt == Self.utc("2024-03-02T09:15:00Z") && welcome.updatedAt == Self.utc("2024-03-05T18:40:00Z"))
        #expect(r.path(welcome) == "Obsidian vault")
        let kitchen = try r.note("Kitchen remodel")
        #expect(r.path(kitchen) == "Obsidian vault/Projects")
        let plan = try #require(r.files.first { $0.filename == "floor plan.pdf" })
        #expect(kitchen.body.hasPrefix("Kitchen remodel\nPlan below. #home\n\n\(plan.markdown)"))
        #expect(try r.note("2024-03-02").body == "2024-03-02\nMet Jonas about the [[Kitchen remodel#Budget|budget]].\n")
        #expect(r.path(try r.note("2024-03-02")) == "Obsidian vault/Daily")
        #expect(!r.notes.contains { $0.title == "Old idea" }, "the vault's trash stays out")
        #expect(FileStore.exists(cabin) && cabin.contentType == "public.png")
    }

    @Test func notionExportFolderAndZip() async throws {
        let folder = try Self.fixture("Notion export")
        let zip = folder.deletingLastPathComponent().appending(path: "Export-1a2b3c.zip")
        try FileManager.default.zipItem(at: folder, to: zip, shouldKeepParent: true)
        for url in [folder, zip] {
            let r = try await Self.importing([url])
            defer { r.cleanUp() }
            #expect(r.summary.notes == 3 && r.summary.attachments == 1 && r.summary.notNotes == 1, "the database CSV is left out, its pages kept")
            let trip = try r.note("Trip to Porto")
            let img = try #require(r.files.first { $0.filename == "IMG_0042.png" })
            #expect(trip.body == "Trip to Porto\nFlights on **Friday**. See [[Packing list]].\n\n\(img.markdown)\n\nHotel: [Casa do Rio](https://example.com/casa-do-rio)\n\n#travel #family\n")
            var september = DateComponents(year: 2023, month: 9, day: 12, hour: 15, minute: 4)
            september.timeZone = .current
            #expect(trip.createdAt == Calendar.current.date(from: september))
            let source = url == zip ? "Export-1a2b3c" : "Notion export"
            #expect(r.path(trip) == source, "Notion's ids are dropped from names")
            #expect(r.path(try r.note("Packing list")) == "\(source)/Trip to Porto")
            let dune = try r.note("Dune")
            #expect(r.path(dune) == "\(source)/Books" && dune.body == "Dune\nAuthor: Frank Herbert\nStatus: Read\n\nSpice must flow.\n")
        }
    }

    #if os(macOS)
    /// Air test 10-13: notes from a .zip came in two hours ahead in Sweden. Zips keep the time of
    /// day where they were made; it was read as UTC.
    @Test func aZipKeepsTheTimeOfDayItWasMadeIn() async throws {
        let dir = FileManager.default.temporaryDirectory.appending(path: "md-\(UUID().uuidString)/Notes")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let file = dir.appending(path: "Groceries.md")
        try "Milk\n".write(to: file, atomically: true, encoding: .utf8)
        let written = Self.utc("2026-10-01T08:00:00Z")
        try FileManager.default.setAttributes([.modificationDate: written, .creationDate: written], ofItemAtPath: file.path)
        // Zipped as Finder and `zip` do: the Mac's own time of day in the .zip.
        let zip = dir.deletingLastPathComponent().appending(path: "Notes.zip")
        let p = Process()
        p.executableURL = URL(fileURLWithPath: "/usr/bin/zip")
        p.currentDirectoryURL = dir.deletingLastPathComponent()
        p.arguments = ["-qr", "Notes.zip", "Notes"]
        try p.run()
        p.waitUntilExit()
        #expect(p.terminationStatus == 0)
        let r = try await Self.importing([zip])
        defer { r.cleanUp() }
        #expect(abs(try r.note("Groceries").createdAt.timeIntervalSince(written)) <= 2, "the time it was written, not hours off")

        let stockholm = TimeZone(identifier: "Europe/Stockholm")!
        #expect(ZipTimes.local(fromStored: Self.utc("2026-10-01T10:00:00Z"), in: stockholm) == Self.utc("2026-10-01T08:00:00Z"))
        #expect(ZipTimes.local(fromStored: Self.utc("2026-12-01T10:00:00Z"), in: stockholm) == Self.utc("2026-12-01T09:00:00Z"))
    }
    #endif

    @Test func bearExportWithATextBundle() async throws {
        let r = try await Self.importing([try Self.fixture("Bear export")])
        defer { r.cleanUp() }
        #expect(r.summary.notes == 3 && r.summary.attachments == 2 && r.summary.notNotes == 0)
        #expect(try r.note("Groceries").body == "Groceries\n- [ ] Oat milk\n- [x] Lemons\n\n#shopping #home/weekly\n", "Bear's own tags stay where they are")
        let photo = try #require(r.files.first { $0.filename == "photo.png" })
        #expect(try r.note("Saffron buns").body == "Saffron buns\n\(photo.markdown)\n\nBake at 225 °C.\n")
        let map = try #require(r.files.first { $0.filename == "map.png" })
        let trip = try r.note("Trip notes")
        #expect(trip.body == "Trip notes\nThe route:\n\n\(map.markdown)\n" && r.path(trip) == "Bear export")
    }

    @Test func joplinWithFrontMatterAndResources() async throws {
        let r = try await Self.importing([try Self.fixture("Joplin")])
        defer { r.cleanUp() }
        #expect(r.summary.notes == 2 && r.summary.attachments == 1 && r.summary.notNotes == 0)
        let meeting = try r.note("Meeting notes 2023-04-11")
        let diagram = try #require(r.files.first)
        #expect(meeting.body == "Meeting notes 2023-04-11\nDecisions:\n\n1. Ship on Monday\n2. Hire one designer\n\n\(diagram.markdown)\n\n#work #meetings\n")
        #expect(meeting.createdAt == Self.utc("2023-04-10T08:00:00Z") && meeting.updatedAt == Self.utc("2023-04-11T10:24:32Z"))
        let garden = try r.note("Garden")
        #expect(r.path(meeting) == "Joplin/Work" && r.path(garden) == "Joplin/Personal")
        #expect(try r.note("Garden").body == "Garden\nTomatoes on the south side.\n")
    }

    @Test func logseqGraph() async throws {
        let r = try await Self.importing([try Self.fixture("Logseq graph")])
        defer { r.cleanUp() }
        #expect(r.summary.notes == 2 && r.summary.attachments == 1 && r.summary.notNotes == 0, "logseq/ settings are skipped, not counted")
        let club = try r.note("Book club")
        let photo = try #require(r.files.first)
        #expect(club.body == "Book club\n- Next meeting [[Mar 14th, 2024]]\n- [ ] pick the next book\n- [x] send invites\n\t- [ ] book a table\n\(photo.markdown)\n\n#reading #friends\n")
        #expect(r.path(club) == "Logseq graph/pages")
        #expect(try r.note("2024_03_14").body == "2024_03_14\n- Talked about [[Book club]]\n- #reading Piranesi chapter 3\n")
    }

    @Test func simplenoteText() async throws {
        let r = try await Self.importing([try Self.fixture("Simplenote")])
        defer { r.cleanUp() }
        #expect(r.summary.notes == 2 && r.summary.trashed == 1 && r.summary.notNotes == 1)
        let list = try r.note("Shopping list")
        #expect(list.body == "Shopping list\nmilk\neggs\n", "the first line is the title, not repeated")
        #expect(r.path(list) == "Simplenote", "the notes/ folder every note shares isn't repeated")
    }

    @Test func standardNotesText() async throws {
        let r = try await Self.importing([try Self.fixture("Standard Notes")])
        defer { r.cleanUp() }
        #expect(r.summary.notes == 2 && r.summary.notNotes == 1, "the JSON backup isn't a note")
        #expect(try r.note("Ideas").body == "Ideas\nApp that waters plants\nBike route to work\n")
        #expect(try r.note("Wishlist").body == "Wishlist\nRain jacket\n")
        #expect(r.path(try r.note("Ideas")) == "Standard Notes")
        #expect(MarkdownImporter.inspect(try Self.fixture("Standard Notes")).notes == 2)
    }

    // MARK: Shared rules

    @Test func countsAndProblems() throws {
        #expect(MarkdownImporter.inspect(try Self.fixture("Obsidian vault")).notes == 4, "the vault trash and settings aren't counted")
        let empty = FileManager.default.temporaryDirectory.appending(path: "md-empty-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: empty, withIntermediateDirectories: true)
        try Data("x,y".utf8).write(to: empty.appending(path: "table.csv"))
        #expect(MarkdownImporter.inspect(empty).problem != nil)
    }

    @Test func importingAgainMakesNoCopiesAndAPickedFolderTakesTheTree() async throws {
        let vault = try Self.fixture("Obsidian vault")
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let mine = c.mainContext.createFolder(named: "From Obsidian")
        let first = try await Self.importing([vault], into: .folder(mine.id), container: c)
        defer { first.cleanUp() }
        #expect(first.summary.notes == 4)
        #expect(first.path(try first.note("Kitchen remodel")) == "From Obsidian/Projects")
        #expect(first.path(try first.note("Welcome")) == "From Obsidian")
        let again = try await Self.importing([vault], container: c)
        #expect(again.summary.notes == 0 && again.summary.alreadyImported == 4 && again.summary.attachments == 0)
        #expect(again.files.count == 2, "no copies of the files either")
    }
}

/// A 5,000-note Obsidian vault, made for the test: 100 folders two deep, front matter on every
/// note (dates, tags, aliases, keys Pinto doesn't use), wiki links by name, by alias and by path,
/// markdown links, embedded images, and ten notes with the same title in different folders.
@MainActor @Suite(.serialized) struct MarkdownVaultScaleTests {
    nonisolated static let count = 5_000
    nonisolated static let images = 500

    nonisolated static func folder(_ i: Int) -> String { "Area \((i % 100) / 10)/Project \(i % 10)" }

    nonisolated static func makeVault() throws -> URL {
        let root = FileManager.default.temporaryDirectory.appending(path: "vault-\(UUID().uuidString)").appending(path: "Big vault")
        let fm = FileManager.default
        try fm.createDirectory(at: root.appending(path: ".obsidian"), withIntermediateDirectories: true)
        try Data("{}".utf8).write(to: root.appending(path: ".obsidian/app.json"))
        try fm.createDirectory(at: root.appending(path: "attachments"), withIntermediateDirectories: true)
        for k in 0..<images { try Data("png \(k)".utf8).write(to: root.appending(path: "attachments/image-\(k).png")) }
        for a in 0..<10 { for p in 0..<10 { try fm.createDirectory(at: root.appending(path: "Area \(a)/Project \(p)"), withIntermediateDirectories: true) } }
        let iso = ISO8601DateFormatter()
        for i in 0..<count {
            let created = Date(timeIntervalSince1970: 1_700_000_000 + Double(i) * 60)
            let k = (i + 29) % count
            let rel = "../../\(folder(k))/Note \(k).md".addingPercentEncoding(withAllowedCharacters: .urlPathAllowed)!
            var text = """
            ---
            created: \(iso.string(from: created))
            updated: \(iso.string(from: created.addingTimeInterval(3600)))
            tags: [topic-\(i % 20), shared]
            aliases: [Alias \(i)]
            source: https://example.com/\(i)
            cssclasses:
              - wide
            ---
            Some text for note \(i).
            Next: [[Note \((i + 1) % count)]]. Also [[Alias \((i + 7) % count)]] and [[\(folder((i + 13) % count))/Note \((i + 13) % count)]].
            See [the plan](\(rel)).

            """
            if i % 10 == 0 { text += "![[image-\(i / 10).png]]\n" }
            if i % 100 < 10, i % 7 == 0 { text += "Notes from [[Meeting]].\n" }
            try Data(text.utf8).write(to: root.appending(path: "\(folder(i))/Note \(i).md"))
        }
        for p in 0..<10 { try Data("Agenda for project \(p).\n".utf8).write(to: root.appending(path: "Area 0/Project \(p)/Meeting.md")) }
        return root
    }

    /// The import's wall time and the longest the main thread went without a turn (what the
    /// progress bar and the window wait on), printed as PERF lines. Timing never gates.
    @Test func importsAFiveThousandNoteVault() async throws {
        let vault = try await Task.detached { try Self.makeVault() }.value
        defer { try? FileManager.default.removeItem(at: vault.deletingLastPathComponent()) }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let source = MarkdownImporter.inspect(vault)
        #expect(source.notes == Self.count + 10)

        let clock = ContinuousClock()
        let stalls = StallMeter()
        let ticker = Task { @MainActor in await stalls.run() }
        var reports = 0
        let start = clock.now
        let summary = await MarkdownImporter(context: c.mainContext).run([source], into: .perSource, progress: { _, _ in reports += 1 })
        let took = clock.now - start
        stalls.running = false
        await ticker.value
        print("PERF markdown import 5,000 notes: \(took) total, longest main-thread stall \(stalls.longest)")

        let r = MarkdownImportTests.Imported(container: c, summary: summary)
        defer { r.cleanUp() }
        #expect(summary.notes == Self.count + 10 && summary.attachments == Self.images && summary.filesMissing == 0)
        #expect(reports >= Self.count)
        let titles = Set(r.notes.map { WikiLinks.key($0.title) })
        let byTitle = Dictionary(r.notes.map { ($0.title, $0) }, uniquingKeysWith: { a, _ in a })
        for i in [0, 1, 7, 70, 4_999] {
            let n = try #require(byTitle["Note \(i)"])
            #expect(r.path(n) == "Big vault/\(Self.folder(i))")
            #expect(n.body.contains("Next: [[Note \((i + 1) % Self.count)]]."))
            #expect(n.body.contains("Also [[Note \((i + 7) % Self.count)|Alias \((i + 7) % Self.count)]]"), "an alias leads to its note")
            #expect(n.body.contains("and [[Note \((i + 13) % Self.count)]]."), "a path names a note")
            #expect(n.body.contains("See [[Note \((i + 29) % Self.count)|the plan]]."))
            #expect(n.body.hasSuffix("#topic-\(i % 20) #shared\n"))
            #expect(n.createdAt == Date(timeIntervalSince1970: 1_700_000_000 + Double(i) * 60))
            #expect(n.frontMatter == "aliases: [Alias \(i)]\nsource: https://example.com/\(i)\ncssclasses:\n  - wide", "what Pinto doesn't use is kept")
        }
        #expect(try #require(byTitle["Note 7"]).body.contains("[[Project 7/Meeting]]"), "the nearest of two same-named notes")
        #expect(try #require(byTitle["Note 10"]).body.contains(try #require(r.files.first { $0.filename == "image-1.png" }).markdown))
        // Every wiki link in every note leads to a note.
        var unresolved: [String] = []
        for n in r.notes {
            for m in n.body.matches(of: /\[\[([^\]|#]+)/) {
                let name = WikiLinks.name(of: String(m.1))
                if !titles.contains(WikiLinks.key(name)) { unresolved.append("\(n.title): \(m.1)") }
            }
        }
        #expect(unresolved.isEmpty, "\(unresolved.prefix(5))")
    }

    /// The vault imported, exported, and the export imported again: the same notes in the same
    /// folders, with the same text, links, tags, dates, files and front matter.
    @Test func anExportImportedAgainIsTheSameNotes() async throws {
        let vault = try await Task.detached { try Self.makeVault() }.value
        defer { try? FileManager.default.removeItem(at: vault.deletingLastPathComponent()) }
        let first = try await MarkdownImportTests.importing([vault])
        defer { first.cleanUp() }
        #expect(first.summary.notes == Self.count + 10)

        let clock = ContinuousClock()
        let start = clock.now
        let made = try await NoteExport.make(first.context, vault: NoteVault(keyStore: MemoryKeyStore(), defaults: MemoryDefaults()))
        print("PERF markdown export 5,000 notes: \(clock.now - start)")
        defer { try? FileManager.default.removeItem(at: made.zip.deletingLastPathComponent()) }
        #expect(made.notes == Self.count + 10 && made.files == Self.images && made.missingFiles == 0)

        let again = try await MarkdownImportTests.importing([made.zip])
        defer { again.cleanUp() }
        #expect(again.summary.notes == Self.count + 10 && again.summary.attachments == Self.images && again.summary.filesMissing == 0)

        // A file's link names a copy of its own in each library: compared by the file's name.
        func text(_ n: Note, in r: MarkdownImportTests.Imported) -> String {
            n.body.replacing(/pane-file:([0-9a-fA-F-]{36})/) { m in
                UUID(uuidString: String(m.1)).flatMap { r.context.attachment($0)?.filename } ?? "?"
            }
        }
        // Folders below the top one (the vault's name, then the export's).
        func place(_ n: Note, in r: MarkdownImportTests.Imported) -> String { r.path(n).split(separator: "/").dropFirst().joined(separator: "/") }
        let before = Dictionary(first.notes.map { ("\(place($0, in: first))/\($0.title)", $0) }, uniquingKeysWith: { a, _ in a })
        let after = Dictionary(again.notes.map { ("\(place($0, in: again))/\($0.title)", $0) }, uniquingKeysWith: { a, _ in a })
        #expect(before.count == Self.count + 10 && Set(before.keys) == Set(after.keys))
        var different: [String] = []
        for (key, a) in before {
            guard let b = after[key] else { continue }
            if text(a, in: first) != text(b, in: again) { different.append("\(key) text:\n\(text(a, in: first))\n---\n\(text(b, in: again))") }
            if a.frontMatter != b.frontMatter { different.append("\(key) front matter: \(a.frontMatter ?? "nil") / \(b.frontMatter ?? "nil")") }
            if Int(a.createdAt.timeIntervalSince1970.rounded()) != Int(b.createdAt.timeIntervalSince1970.rounded())
                || Int(a.updatedAt.timeIntervalSince1970.rounded()) != Int(b.updatedAt.timeIntervalSince1970.rounded()) { different.append("\(key) dates") }
        }
        #expect(different.isEmpty, "\(different.count) differ: \(different.prefix(3))")
    }
}

/// The longest gap between turns of the main thread while it runs.
@MainActor final class StallMeter {
    var longest = Duration.zero
    var running = true
    func run() async {
        let clock = ContinuousClock()
        var last = clock.now
        while running {
            try? await Task.sleep(for: .milliseconds(5))
            let now = clock.now
            longest = max(longest, now - last)
            last = now
        }
    }
}

private final class MarkdownFixtureToken {}
