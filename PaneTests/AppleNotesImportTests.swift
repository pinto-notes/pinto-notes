#if os(macOS)
import Foundation
import SQLite3
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The Apple Notes import against what Notes really hands over: `body of note` as Notes on
/// macOS 15.7 returned it for made-up notes, and one note's row from its database.
@MainActor @Suite(.serialized) struct AppleNotesImportTests {
    /// "Weekend list", typed by hand in Notes: a checklist (two ticked, one nested), a bulleted list, three empty lines,
    /// then a dashed list with a numbered list straight after it.
    static let weekendHTML = """
    <div><h1>Weekend list</h1></div>
    <ul>
    <li>Buy oat milk</li>
    <li>Call the plumber</li>
    <li>Book train</li>
    <ul>
    <li>Window seat</li>
    </ul>
    </ul>
    <div>Bullets below</div>
    <ul>
    <li>Bullet a</li>
    <li>Bullet b</li>
    </ul>
    <div>Gap next</div>
    <div><br></div>
    <div><br></div>
    <div><br></div>
    <div>After three empty lines</div>
    <ul class="Apple-dash-list">
    <li>Dash a</li>
    <li>Dash b</li>
    <li>Num a</li>
    <li>Num b</li>
    </ul>
    <div>Last line</div>
    """

    /// The same note as Notes stores it (ZICNOTEDATA.ZDATA): gzip around a protocol buffer.
    static let weekendStored = "1F8B0800000000000013E36010BAC7C1C120C020759D43681563786A6A766A5E8A424E667109975369A5427E6289426E664E369773624E8E424946AA42414E696E526A1197537E7EB642495162661E5778665E4A7EB942716A2248534E4E6A49B142526A4E7E3994A79008632471B9271628E4A55694700181635A496A11D0D0A2D45485D4DC82924AA0BD79A9C55C2E89C519403D602A89CBAF3417C80191495C3E89C52560455C52025C2C2077035D0EA63518C1228C4011292930ADC10415911210048B306A304345B405B8A16A58A02266023C6011260D5629412E5620AB9151201DAA884D4A182CF48251801D22A4C0A8C12E2504D6E924600717E380EA6D005A06B592534A8C0B14C0FF81801FE858385B49964B9A4B6065A9E48C430BDCD7F5BD9AC1C1B4AFD2588899E33DA3101307B3960207AF9018078304A39740EBD5CEE8BD55CE4C331605FFCC5FCD209EB1F4D3BA6B6C5A6640153A1CE9128C5A225C026BB50E6B88BAFB7C5B63EEF3CAF8A09E970083974053FBE7E4EA7D7EC79BDFFE93BB7570EAA18C65507D3C087D4A0A9C865F4FBAEDDCD999B9C8627E7D9B00D0BEDD519F7F179EF2DBD27C4D79D35679E7B9707DAC24EA5B0ED5C78DD0D7E57BFD759E900FFFDCF00BB5057B3D1F82DCF9CE28DD2747D75DA7356EE60C9EC88487507D164077EA81F42980755EDBAC7166829DBF7CDF993307263D2D6904D9E8CDC07C5EE58CDFDD8902374302DB25F8A03AE538F884444021679ABFC3A057C9BFB7275CEA0AC32ABD95195BC1F20A1C9CC0B04D01A9D8F6E4CC66E1854E0B16D8192B3F358DCAC55471E32D43DED330CFAD5D0FA32AB58FC7184255C8713042ECF86C5DF29BE99CABCF626BEF55824C17B7C1E59571C86F83DAC00EB42115A4E247EAC67D9397F926779FFC73F7FEC4158733B6A3AB78D4F1657DC806EF6FFB566CB2C8F892C70F55A1C4C12624C19126C1680154B3A0AA22E954B063F03AA5BF89A266EF17C14D61039A92063265D33787FC8313BC25E74D0DBF77F9AF950D54851C5005D8A5D3FB58F5B7C578DCD978D4EDD693B5F7F3E0F2CC38E477A08604863C389D0200D449EBA263040000"

    /// Every text style, a three-deep list, numbers and a table, each written the way Notes
    /// returned it (headings as sized bold spans, nested lists beside their item, the table in an
    /// `<object>`).
    static let formatsHTML = """
    <div><b><span style="font-size: 24px">Formats</span></b></div>
    <div><b><span style="font-size: 18px">Heading here</span></b></div>
    <div><b>Subheading here</b></div>
    <div>Plain with <b>bold</b>, <i>italic</i>, <u>underline</u>, <strike>strike</strike> and <a href="https://example.com/page">a link</a>.</div>
    <div><br></div>
    <div>After one blank line.</div>
    <ul>
    <li>Bullet one</li>
    <li>Bullet two</li>
    <ul>
    <li>Nested bullet</li>
    <ul>
    <li>Third level</li>
    </ul>
    </ul>
    </ul>
    <ol>
    <li>First</li>
    <li>Second</li>
    <ol>
    <li>Nested number</li>
    </ol>
    </ol>
    <div><font face="Courier"><span style="font-size: 12px">mono line</span></font><br></div>
    <div><object><table cellspacing="0" cellpadding="0" style="border-collapse: collapse; direction: ltr">
    <tbody>
    <tr><td valign="top" style="border-style: solid; border-width: 1.0px 1.0px 1.0px 1.0px; border-color: #ccc; padding: 3.0px 5.0px 3.0px 5.0px; min-width: 70px"><div>Name</div>
    </td><td valign="top" style="border-style: solid; border-width: 1.0px 1.0px 1.0px 1.0px; border-color: #ccc; padding: 3.0px 5.0px 3.0px 5.0px; min-width: 70px"><div>Score</div>
    </td></tr>
    <tr><td valign="top" style="border-style: solid; border-width: 1.0px 1.0px 1.0px 1.0px; border-color: #ccc; padding: 3.0px 5.0px 3.0px 5.0px; min-width: 70px"><div>Ann</div>
    </td><td valign="top" style="border-style: solid; border-width: 1.0px 1.0px 1.0px 1.0px; border-color: #ccc; padding: 3.0px 5.0px 3.0px 5.0px; min-width: 70px"><div>5</div>
    </td></tr>
    </tbody>
    </table></object><br></div>
    <div>The end.</div>
    """

    /// A one-pixel PNG, the way Notes inlines a pasted picture.
    static let pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    static var photoHTML: String {
        """
        <div><h1>Links and photo</h1></div>
        <div>https://example.com/typed and words after</div>
        <div>Photo next</div>
        <div><img style="max-width: 100%; max-height: 100%;" src="data:image/png;base64,\(pixel)"/><br></div>
        <div>After photo</div>
        <div>the map<br></div>
        """
    }

    /// "Links and photo" as Notes stores it: a typed address, a picture, and "the map" linked
    /// to https://example.com/named with Edit, Add Link. The HTML above has only its words.
    static let photoStored = "1F8B0800000000000013E360103AC5C2C120C02075984528D627332FBB5821312F45A12023BF249F2BA3A4A4A0D84A5F3FB52231B72027552F393F57BFA4B2203505ACA63CBF2805A83AAD24B5882B00A45E212FB5A284EBFDFE3D5C8E2041A8212519A90AB989055C52025C609B807681690D46B0082350C4550A44336A3041455C0518C1224C1ACC5011770111B00883060B54C40DAA864183554A8C8B0368E27F20E0079A0E672BC970497109AC2C959C716881FBBABE57333898F6551A0B3171440331B3961487809018078304A397C089ED5A6F6D77B8B6EF0D98537FD8E7EC3C2D630E49211190CCFA180397B71BDCDCA6047E96D9B87852889724CE40D192E090C1AE492B888311BB4C9211978A9191A393918B8BB3AE93ABB385AE89A993A9AEA5A1AB91AEB3ABB19BA98BB1918591859910574169524E66B25E415E7AC6DAAFEBAEB169C971F06037336303541E879D19877AD603E52D39D849F1625E626E6A4AC615B056095C460300E9CCE5414F020000"

    static func data(hex: String) -> Data {
        var out = Data(capacity: hex.count / 2)
        var i = hex.startIndex
        while i < hex.endIndex {
            let j = hex.index(i, offsetBy: 2)
            out.append(UInt8(hex[i..<j], radix: 16)!)
            i = j
        }
        return out
    }

    static var weekendItems: [RichTextToMarkdown.ListItem] { AppleNoteText.listItems(inStored: data(hex: weekendStored)) }

    // MARK: What the HTML says, and doesn't

    @Test func emptyLinesComeOverAsWritten() {
        let md = RichTextToMarkdown.markdown(fromHTML: Self.weekendHTML, keepBlankLines: true)
        #expect(md.contains("Gap next\n\n\n\nAfter three empty lines"), "three empty lines stay three")
        // A paste from a web page still folds them.
        #expect(RichTextToMarkdown.markdown(fromHTML: Self.weekendHTML).contains("Gap next\n\nAfter three empty lines"))
    }

    @Test func oneEmptyLineStaysOneAroundListsAndTables() {
        let md = RichTextToMarkdown.markdown(fromHTML: Self.formatsHTML, keepBlankLines: true)
        #expect(md.contains("a link](https://example.com/page).\n\nAfter one blank line.\n* Bullet one"))
        #expect(!md.contains("\n\n\n"), "nothing in this note has two empty lines in a row")
    }

    @Test func theHTMLAloneCannotTellAChecklistFromBullets() {
        // What an import without Notes' database gets: the text, every item, as bullets.
        let md = RichTextToMarkdown.markdown(fromHTML: Self.weekendHTML, keepBlankLines: true)
        #expect(md.hasPrefix("# Weekend list\n* Buy oat milk\n* Call the plumber\n* Book train\n  * Window seat\n\nBullets below"))
        #expect(md.contains("- Dash a\n- Dash b\n- Num a\n- Num b"), "Notes itself writes the numbered items as dashes")
    }

    @Test func headingsStylesListsAndTablesSurvive() {
        let md = RichTextToMarkdown.markdown(fromHTML: Self.formatsHTML, keepBlankLines: true)
        #expect(md.hasPrefix("# Formats\n## Heading here\n**Subheading here**\n"))
        #expect(md.contains("Plain with **bold**, *italic*, <u>underline</u>, ~~strike~~ and [a link](https://example.com/page)."))
        #expect(md.contains("* Bullet one\n* Bullet two\n  * Nested bullet\n    * Third level"), "a third level is still a bullet, not a dash")
        #expect(md.contains("1. First\n2. Second\n  1. Nested number"))
        #expect(md.contains("```\nmono line\n```"))
        #expect(md.contains("| Name | Score |") && md.contains("| Ann | 5 |"), "Notes wraps a table in <object>; it comes over all the same")
        #expect(md.hasSuffix("The end."))
    }

    // MARK: What Notes' database adds

    @Test func readsListItemsFromTheStoredNote() {
        #expect(Self.weekendItems == [
            .init(text: "Buy oat milk", kind: .check(done: false)),
            .init(text: "Call the plumber", kind: .check(done: true)),
            .init(text: "Book train", kind: .check(done: false)),
            .init(text: "Window seat", kind: .check(done: true), indent: 1),
            .init(text: "Bullet a", kind: .bullet),
            .init(text: "Bullet b", kind: .bullet),
            .init(text: "Dash a", kind: .dash),
            .init(text: "Dash b", kind: .dash),
            .init(text: "Num a", kind: .number),
            .init(text: "Num b", kind: .number),
        ])
    }

    @Test func checklistsKeepTheirTicksAndNumbersTheirNumbers() {
        let md = RichTextToMarkdown.markdown(fromHTML: Self.weekendHTML, keepBlankLines: true, listItems: Self.weekendItems)
        #expect(md == """
        # Weekend list
        - [ ] Buy oat milk
        - [x] Call the plumber
        - [ ] Book train
          - [x] Window seat

        Bullets below
        * Bullet a
        * Bullet b

        Gap next



        After three empty lines
        - Dash a
        - Dash b
        1. Num a
        2. Num b

        Last line
        """)
    }

    @Test func aHintIsOnlyUsedWhereTheTextMatches() {
        // The database is a version behind the HTML (an item was added): nothing shifts by one.
        var items = Self.weekendItems
        items.remove(at: 1)
        let md = RichTextToMarkdown.markdown(fromHTML: Self.weekendHTML, keepBlankLines: true, listItems: items)
        #expect(md.contains("- [ ] Buy oat milk\n* Call the plumber\n- [ ] Book train\n  - [x] Window seat"))
        #expect(md.contains("* Bullet a") && md.contains("1. Num a\n2. Num b"))
    }

    @Test func readsNamedLinksFromTheStoredNote() {
        #expect(AppleNoteText.links(inStored: Self.data(hex: Self.photoStored)) == [.init(text: "the map", url: "https://example.com/named")])
        #expect(AppleNoteText.links(inStored: Self.data(hex: Self.weekendStored)).isEmpty)
    }

    @Test func namedLinksGetTheirAddressBackWhereTheirWordsStand() {
        let links = [AppleNoteText.Link(text: "the map", url: "https://example.com/a b"), .init(text: "the map", url: "https://example.com/2"), .init(text: "gone", url: "https://example.com/3")]
        #expect(AppleNotesImporter.name(links, in: "See the map and the map.\nThen the map.") == "See [the map](https://example.com/a%20b) and [the map](https://example.com/2).\nThen the map.")
        #expect(AppleNotesImporter.name([links[1]], in: "[the map](https://x.example) the map") == "[the map](https://x.example) [the map](https://example.com/2)")
    }

    @Test func damagedStoredTextReadsAsNothing() {
        #expect(AppleNoteText.listItems(inStored: Data()).isEmpty)
        #expect(AppleNoteText.listItems(inStored: Data([0x1F, 0x8B, 8, 0, 0, 0, 0, 0, 0, 0x13, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).isEmpty)
        #expect(AppleNoteText.listItems(inStored: Self.data(hex: Self.weekendStored).prefix(200)).isEmpty)
    }

    // MARK: The import itself

    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    /// A stand-in for NoteStore.sqlite holding the Weekend list as note 10, pinned.
    static func store() throws -> URL {
        let dir = FileManager.default.temporaryDirectory.appending(path: "notes-fixture-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "NoteStore.sqlite")
        var db: OpaquePointer?
        #expect(sqlite3_open(url.path, &db) == SQLITE_OK)
        defer { sqlite3_close(db) }
        let sql = """
        create table Z_PRIMARYKEY (Z_ENT INTEGER, Z_NAME TEXT);
        insert into Z_PRIMARYKEY values (12, 'ICNote');
        create table ZICCLOUDSYNCINGOBJECT (Z_PK INTEGER PRIMARY KEY, Z_ENT INTEGER, ZISPINNED INTEGER, ZTITLE1 TEXT);
        insert into ZICCLOUDSYNCINGOBJECT values (10, 12, 1, 'Weekend list'), (11, 12, 0, 'Links and photo');
        create table ZICNOTEDATA (Z_PK INTEGER PRIMARY KEY, ZNOTE INTEGER, ZDATA BLOB);
        insert into ZICNOTEDATA values (3, 10, x'\(weekendStored)'), (4, 11, x'\(photoStored)');
        """
        #expect(sqlite3_exec(db, sql, nil, nil, nil) == SQLITE_OK)
        return url
    }

    static let day = Date(timeIntervalSinceReferenceDate: 800_000_000)
    static var notes: [AppleNote] {
        [
            AppleNote(id: "x-coredata://3060958B/ICNote/p10", name: "Weekend list", folder: "Notes", modified: day.addingTimeInterval(3600), created: day),
            AppleNote(id: "x-coredata://3060958B/ICNote/p11", name: "Links and photo", folder: "Porto", modified: day.addingTimeInterval(7200), created: day.addingTimeInterval(60), parents: ["Travel"]),
            AppleNote(id: "x-coredata://3060958B/ICNote/p12", name: "Passport numbers", folder: "Travel", modified: day, created: day, locked: true),
            AppleNote(id: "x-coredata://3060958B/ICNote/p13", name: "Gone", folder: "Notes", modified: day, created: day),
        ]
    }

    static func importer(_ context: ModelContext, store: URL?) -> AppleNotesImporter {
        var importer = AppleNotesImporter(context: context)
        let weekend = weekendHTML, photo = photoHTML
        importer.body = { id in
            if id.hasSuffix("p10") { return weekend }
            if id.hasSuffix("p11") { return photo }
            throw AppleNotesBridge.Failure.script("Notes got an error.")
        }
        importer.openStore = { store.flatMap { try? AppleNoteStore.open(at: $0).get() } }
        return importer
    }

    @Test func importsWithTheDatabaseKeepChecklistsPinsDatesFoldersAndPictures() async throws {
        let container = try Self.container()
        let context = container.mainContext
        let url = try Self.store()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        var steps: [Int] = []
        let summary = await Self.importer(context, store: url).run(Self.notes, keepFolders: true) { done, _ in steps.append(done) }

        #expect(summary.readStore && summary.noteIDs.count == 2)
        #expect(summary.asked == 4)
        #expect(summary.notImported == [
            .init(name: "Passport numbers", why: "Locked in Apple Notes"),
            .init(name: "Gone", why: "Apple Notes didn't hand it over: Notes got an error."),
        ], "what didn't come is named, with why")
        #expect(summary.line(locale: Locale(identifier: "en_US")) == "Imported 2 of 4 notes")
        #expect(summary.leftLine(locale: Locale(identifier: "en_US")) == "2 could not be imported:")
        #expect(summary.pictures == 1 && summary.picturesLeftOut == 0)
        #expect(steps == [0, 1, 2, 3])

        let all = try context.fetch(FetchDescriptor<Note>())
        let weekend = try #require(all.first { $0.title == "Weekend list" })
        #expect(weekend.body.contains("- [x] Call the plumber") && weekend.body.contains("  - [x] Window seat"))
        #expect(weekend.body.contains("Gap next\n\n\n\nAfter three empty lines"))
        #expect(weekend.isPinned)
        #expect(weekend.createdAt == Self.day && weekend.updatedAt == Self.day.addingTimeInterval(3600), "written then, last edited then")
        #expect(weekend.folder?.name == "Notes")

        let photo = try #require(all.first { $0.title == "Links and photo" })
        #expect(!photo.isPinned && photo.folder?.name == "Porto" && photo.folder?.parent?.name == "Travel", "a folder inside a folder stays inside it")
        let file = try #require(try context.fetch(FetchDescriptor<Pane.Attachment>()).first)
        #expect(file.isImage)
        #expect(photo.body.contains("Photo next\n\(file.markdown)\nAfter photo\n[the map](https://example.com/named)"), "the picture sits where it was, on a line of its own, and the link leads somewhere again")
        #expect(photo.body.contains("\nhttps://example.com/typed and words after\n"), "a typed address stays as typed")
        #expect(try Data(contentsOf: FileStore.url(for: file.id, filename: file.filename)) == Data(base64Encoded: Self.pixel))
        try? FileManager.default.removeItem(at: FileStore.url(for: file.id, filename: file.filename).deletingLastPathComponent())
    }

    @Test func importsWithoutTheDatabaseStillBringEverythingElse() async throws {
        let container = try Self.container()
        let context = container.mainContext
        let summary = await Self.importer(context, store: nil).run(Array(Self.notes.prefix(1)), keepFolders: false) { _, _ in }
        #expect(!summary.readStore && summary.noteIDs.count == 1)
        let weekend = try #require(try context.fetch(FetchDescriptor<Note>()).first)
        #expect(weekend.body.contains("* Buy oat milk") && !weekend.isPinned)
        #expect(weekend.folder?.id == context.defaultFolder().id, "without folders, notes go where new notes go")
    }

    /// What the note list holds after each save, as NoteListView reads it.
    @MainActor final class ListWatch {
        let library = LibraryNotes()
        let context: ModelContext
        var lists: [[NoteEntry]] = []

        init(_ context: ModelContext) {
            self.context = context
            _ = library.entries(in: context)
        }

        func look() { lists.append(library.entries(in: context)) }
    }

    /// The flicker of 1.2.4 (2026-10-11): each note was made dated now and saved, so it showed at
    /// the top of the list under Today, then jumped to its own day when the next one's save
    /// arrived: 18 notes, 18 jumps behind the sheet. Whatever the list shows during an import is
    /// where it stays: no note is ever listed under a date that isn't its own, none moves, and
    /// the list is worked out a few times, not once for every note.
    @Test func noNoteMovesInTheListWhileNotesComeIn() async throws {
        let container = try Self.container()
        let context = container.mainContext
        let watch = ListWatch(context)
        let saves = NotificationCenter.default.addObserver(forName: ModelContext.didSave, object: context, queue: nil) { [weak watch] _ in
            MainActor.assumeIsolated { watch?.look() }
        }
        defer { NotificationCenter.default.removeObserver(saves) }
        // Twenty notes in two folders, each a day older than the one before.
        let notes = (0..<20).map {
            AppleNote(id: "x-coredata://3060958B/ICNote/p\(100 + $0)", name: "Note \($0)", folder: $0 % 3 == 0 ? "Recipes" : "Notes",
                      modified: Self.day.addingTimeInterval(-Double($0) * 86_400))
        }
        var importer = AppleNotesImporter(context: context)
        importer.body = { id in "<div><h1>Note \((Int(id.split(separator: "p").last ?? "") ?? 0) - 100)</h1></div><div>Some text</div>" }
        importer.openStore = { nil }
        let summary = await importer.run(notes, keepFolders: true) { _, _ in }
        #expect(summary.noteIDs.count == notes.count)

        let last = try #require(watch.lists.last)
        #expect(last.count == notes.count)
        let place = Dictionary(uniqueKeysWithValues: last.enumerated().map { ($1.id, $0) })
        let date = Dictionary(uniqueKeysWithValues: last.map { ($0.id, $0.date) })
        for (i, list) in watch.lists.enumerated() {
            #expect(list.allSatisfy { date[$0.id] == $0.date }, "save \(i): a note is listed under a date that isn't its own")
            let places = list.compactMap { place[$0.id] }
            #expect(places == places.sorted(), "save \(i): a note is above one it ends up below")
        }
        #expect(watch.lists.count <= 4, "the list was worked out \(watch.lists.count) times for 20 notes")
    }

    @Test func theSameNotesAgainAreNotCopied() async throws {
        let container = try Self.container()
        let context = container.mainContext
        let first = await Self.importer(context, store: nil).run(Array(Self.notes.prefix(1)), keepFolders: true) { _, _ in }
        #expect(first.noteIDs.count == 1)
        let again = await Self.importer(context, store: nil).run(Array(Self.notes.prefix(1)), keepFolders: true) { _, _ in }
        #expect(again.noteIDs.isEmpty && again.alreadyImported == 1)
        // A note brought in by 1.2.4 was dated by its last edit; it still counts as the same.
        let old = Note(body: "Links and photo\n", folder: context.defaultFolder())
        old.createdAt = Self.notes[1].modified
        context.insert(old)
        try context.save()
        let mixed = await Self.importer(context, store: nil).run(Array(Self.notes.prefix(2)), keepFolders: true) { _, _ in }
        #expect(mixed.noteIDs.isEmpty && mixed.alreadyImported == 2)
    }

    @Test func aNoteListedUnderAFolderAndTheOneInsideItIsKeptOnceInTheDeeperOne() {
        let outer = AppleNote(id: "a", name: "Tickets", folder: "Travel", modified: Self.day)
        let inner = AppleNote(id: "a", name: "Tickets", folder: "Porto", modified: Self.day, parents: ["Travel"])
        let other = AppleNote(id: "b", name: "Other", folder: "Travel", modified: Self.day)
        #expect(AppleNote.unique([outer, other, inner]) == [inner, other])
        #expect(AppleNote.unique([inner, outer]) == [inner])
    }

    // MARK: Every note is offered (2026-10-11: 17 of 35 notes never came)

    /// What the listing script returns for a library like the one that lost notes: an iCloud
    /// account with five folders (one with a slash in its name, one inside another), a second
    /// account with a folder named like one of iCloud's, a locked note, and a folder that failed.
    static func library() -> NSAppleEventDescriptor {
        func list(_ items: [NSAppleEventDescriptor]) -> NSAppleEventDescriptor {
            let l = NSAppleEventDescriptor.list()
            for (i, item) in items.enumerated() { l.insert(item, at: i + 1) }
            return l
        }
        func text(_ s: String) -> NSAppleEventDescriptor { NSAppleEventDescriptor(string: s) }
        var made = 0
        func folder(_ name: String, _ count: Int, parents: [String] = [], account: String = "iCloud", locked: Set<Int> = []) -> NSAppleEventDescriptor {
            let ids = (0..<count).map { _ -> Int in made += 1; return made }
            return list([
                text(name),
                list(ids.map { text("x-coredata://LIB/ICNote/p\($0)") }),
                list(ids.map { text("\(name) note \($0)") }),
                list(ids.map { NSAppleEventDescriptor(date: day.addingTimeInterval(Double($0) * 60)) }),
                list(ids.map { NSAppleEventDescriptor(date: day.addingTimeInterval(Double($0))) }),
                list(ids.indices.map { NSAppleEventDescriptor(boolean: locked.contains($0)) }),
                list(parents.map(text)),
                text(account),
            ])
        }
        return list([
            text("iCloud"),
            list([
                folder("Notes", 18),
                folder("Claude Code / Notes", 5),
                folder("Brain", 9, locked: [0]),
                folder("Life", 2),
                folder("Journal", 1),
                folder("Deep", 1, parents: ["Brain"]),
                folder("Empty", 0),
                folder("Notes", 3, account: "Google"),
            ]),
            list([list([text("Scans"), text("Notes got an error: AppleEvent timed out.")])]),
        ])
    }

    @Test func everyNoteOfEveryAccountAndFolderIsOfferedAndPicked() {
        let listing = AppleNotesBridge.listing(from: Self.library())
        #expect(listing.notes.count == 39, "18 + 5 + 9 + 2 + 1 + 1 in iCloud, 3 in Google")
        #expect(listing.mainAccount == "iCloud" && listing.accounts == ["iCloud", "Google"])
        let groups = listing.groups()
        #expect(groups.map(\.heading) == ["Notes", "Claude Code / Notes", "Brain", "Life", "Journal", "Brain \u{203A} Deep", "Google \u{203A} Notes"], "in Apple Notes' own order")
        #expect(groups.map(\.notes.count) == [18, 5, 9, 2, 1, 1, 3], "each group's count is its folder's")
        #expect(Set(groups.flatMap(\.notes).map(\.id)) == Set(listing.notes.map(\.id)) && groups.flatMap(\.notes).count == 39, "every note is in exactly one group")
        // Nothing is left unpicked for being further down: all of it, but the locked note.
        let picked = listing.pickedAtFirst(keys: [])
        #expect(picked.count == 38)
        #expect(listing.notes.filter { !picked.contains($0.id) }.map(\.name) == ["Brain note 24"] && listing.notes.first { $0.name == "Brain note 24" }?.locked == true)
        #expect(listing.unreadFolders == [.init(folder: "Scans", why: "Notes got an error: AppleEvent timed out.")], "a folder that failed is said, not dropped")
    }

    @Test func foldersComeAsTheyAreAcrossAccountsWithASlashInAName() async throws {
        let container = try Self.container()
        let context = container.mainContext
        let listing = AppleNotesBridge.listing(from: Self.library())
        var importer = AppleNotesImporter(context: context)
        importer.body = { id in "<div><h1>Note \(id.suffix(4))</h1></div><div>Text.</div>" }
        importer.openStore = { nil }
        // Newest first, as the sheet hands them over: folder order must not depend on that.
        let summary = await importer.run(listing.notes.sorted { $0.modified > $1.modified }, listing: listing, keepFolders: true) { _, _ in }
        #expect(summary.noteIDs.count == 38 && summary.asked == 39)
        #expect(summary.notImported == [.init(name: "Brain note 24", why: "Locked in Apple Notes")])
        #expect(summary.line(locale: Locale(identifier: "en_US")) == "Imported 38 of 39 notes")

        let folders = context.allFolders().filter { $0.deletedAt == nil }
        let top = folders.filter { $0.parent == nil }.sorted { $0.sortIndex < $1.sortIndex }.map(\.name)
        #expect(top == ["Notes", "Claude Code / Notes", "Brain", "Life", "Journal", "Google"], "top folders in Apple Notes' order, the other account's under its name")
        let slash = try #require(folders.first { $0.name == "Claude Code / Notes" })
        #expect(slash.parent == nil && slash.liveChildren.isEmpty, "a slash in a name doesn't make two folders")
        #expect(!folders.contains { $0.name == "Claude Code" || $0.name == "Notes" && $0.parent?.name == "Claude Code " })
        let notes = try context.fetch(FetchDescriptor<Note>())
        func count(_ path: [String]) -> Int {
            notes.filter { n in
                var names: [String] = []
                var f = n.folder
                while let g = f { names.insert(g.name, at: 0); f = g.parent }
                return names == path
            }.count
        }
        #expect(count(["Notes"]) == 18 && count(["Claude Code / Notes"]) == 5 && count(["Brain"]) == 8 && count(["Life"]) == 2 && count(["Journal"]) == 1)
        #expect(count(["Brain", "Deep"]) == 1 && count(["Google", "Notes"]) == 3, "the two folders named Notes stay two")
    }

    @Test func importingAgainBringsOnlyWhatIsMissing() async throws {
        let container = try Self.container()
        let context = container.mainContext
        let listing = AppleNotesBridge.listing(from: Self.library())
        // As 1.2.4 left it: the 18 notes of "Notes", each dated by its last edit.
        let had = context.createFolder(named: "Notes")
        for n in listing.notes where n.folder == "Notes" && n.account == "iCloud" {
            let note = Note(body: "\(n.name)\nText.\n", folder: had)
            note.createdAt = n.modified
            note.updatedAt = n.modified
            context.insert(note)
        }
        try context.save()
        let keys = AppleNotesListing.keysOfNotes(in: context)
        let picked = listing.pickedAtFirst(keys: keys)
        #expect(picked.count == 20, "the sheet opens with the 20 that can come and aren't here: 39, less 18 here, less 1 locked")
        var importer = AppleNotesImporter(context: context)
        importer.body = { id in "<div><h1>Note</h1></div><div>Text.</div>" }
        importer.openStore = { nil }
        // Even with everything asked for, the 18 aren't copied.
        let summary = await importer.run(listing.notes, listing: listing, keepFolders: true) { _, _ in }
        #expect(summary.noteIDs.count == 20 && summary.alreadyImported == 18)
        #expect(summary.line(locale: Locale(identifier: "en_US")) == "Imported 20 of 39 notes \u{00B7} 18 already here")
        #expect(try context.fetch(FetchDescriptor<Note>()).count == 38)
        #expect(context.allFolders().filter { $0.name == "Notes" && $0.parent == nil }.count == 1, "the folder that was here is used, not made again")
    }

    @Test func theSameNoteByBothRoutesIsOneNote() async throws {
        let container = try Self.container()
        let context = container.mainContext
        let url = try Self.store()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        // First from AppleScript alone, then again with Notes' database readable.
        let first = await Self.importer(context, store: nil).run(Array(Self.notes.prefix(2)), keepFolders: true) { _, _ in }
        let second = await Self.importer(context, store: url).run(Array(Self.notes.prefix(2)), keepFolders: true) { _, _ in }
        #expect(first.noteIDs.count == 2 && second.noteIDs.isEmpty && second.alreadyImported == 2)
        #expect(try context.fetch(FetchDescriptor<Note>()).count == 2)
        let files = try context.fetch(FetchDescriptor<Pane.Attachment>())
        for f in files { try? FileManager.default.removeItem(at: FileStore.url(for: f.id, filename: f.filename).deletingLastPathComponent()) }
    }

    @Test func theLineAfterAnImportSaysWhatCameAndWhatStayed() {
        let en = Locale(identifier: "en_US")
        var s = AppleNotesImportSummary()
        s.noteIDs = (0..<18).map { _ in UUID() }
        s.asked = 18
        #expect(s.line(locale: en) == "Imported 18 notes" && s.leftLine(locale: en) == nil)
        s.noteIDs = (0..<31).map { _ in UUID() }
        s.asked = 35
        s.notImported = (0..<4).map { .init(name: "Note \($0)", why: AppleNotesImportSummary.lockedWhy) }
        #expect(s.line(locale: en) == "Imported 31 of 35 notes" && s.leftLine(locale: en) == "4 could not be imported:")
        s = AppleNotesImportSummary()
        s.asked = 1_284
        s.alreadyImported = 1_284
        #expect(s.line(locale: en) == "No new notes imported \u{00B7} 1,284 already here")
        s.picturesLeftOut = 1
        s.noteIDs = [UUID()]
        s.asked = 1
        s.alreadyImported = 0
        #expect(s.line(locale: en) == "Imported 1 note \u{00B7} 1 picture too big to keep")
    }

    @Test func theSelectionCountReadsPlainly() {
        let en = Locale(identifier: "en_US")
        #expect(AppleNotesImportView.count(35, of: 35, locale: en) == "35 of 35 notes selected")
        #expect(AppleNotesImportView.count(0, of: 1_284, locale: en) == "1,284 notes, none selected")
        #expect(AppleNotesImportView.count(1, of: 1, locale: en) == "1 of 1 note selected")
    }

    @Test func everySourceIsListedByNameWithObsidianAndBearAsMarkdown() {
        #expect(ImportOrigin.all.map(\.name) == ["Apple Notes", "Obsidian", "Bear", "Evernote", "Google Keep", "Markdown or text files"])
        #expect(ImportKind.obsidian.isMarkdown && ImportKind.bear.isMarkdown && ImportKind.markdown.isMarkdown)
        #expect(!ImportKind.evernote.isMarkdown && !ImportKind.keep.isMarkdown)
        #expect(ImportKind.obsidian.contentTypes == ImportKind.markdown.contentTypes)
        // An icon comes from the app on this Mac or not at all: nothing of another app's ships here.
        #expect(ImportOrigin.appleNotes.bundleIdentifier == "com.apple.Notes")
        #expect(ImportOrigin.files(.keep).bundleIdentifier == nil && ImportOrigin.files(.markdown).bundleIdentifier == nil)
    }

    // MARK: Asking Apple Notes only after a press that names it (2026-10-12)

    /// Draws a view in an offscreen window and lets its tasks run.
    static func draw(_ view: some View) async {
        let host = NSHostingView(rootView: view)
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 560, height: 640), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        host.layoutSubtreeIfNeeded()
        try? await Task.sleep(for: .seconds(0.8))
        window.close()
    }

    @Test func nothingAsksAppleNotesBeforeAPressThatNamesIt() async throws {
        let c = try Self.container()
        AppleNotesBridge.calls = 0
        // Made here: the stand-in answers on the bridge's own thread.
        nonisolated(unsafe) let library = Self.library()
        AppleNotesBridge.standIn = { _ in library }
        defer { AppleNotesBridge.standIn = nil }
        // Every place that offers the import, drawn as it is before anything is pressed.
        await Self.draw(ImportSourceList { _ in })
        await Self.draw(ImportChoiceSheet { _ in }.modelContainer(c))
        await Self.draw(SetupCard(progress: SetupProgress(), celebrating: false, onImport: {}, onImportFrom: { _ in }, onSkip: {}, onConnect: {}, onHide: {}))
        // The first-run flow's Bring your notes step, with its Apple Notes row.
        await Self.draw(OnboardingSnapshots.flow(OnboardingSnapshots.Shot(name: "x", step: .bring)))
        #expect(AppleNotesBridge.calls == 0, "Apple Notes is only asked once its sheet is open")
        // The press on Apple Notes opens its sheet, and that is where Notes is asked: once.
        await Self.draw(AppleNotesImportView().modelContainer(c))
        #expect(AppleNotesBridge.calls == 1)
    }

    @Test func theOneButtonSaysWhatItWillDo() {
        let en = Locale(identifier: "en_US")
        #expect(AppleNotesImportView.importTitle(picked: 35, new: 35, all: 35, locale: en) == "Import All 35 Notes")
        #expect(AppleNotesImportView.importTitle(picked: 17, new: 17, all: 35, locale: en) == "Import 17 New Notes", "a second run brings only what is missing")
        #expect(AppleNotesImportView.importTitle(picked: 3, new: 17, all: 35, locale: en) == "Import 3 Notes")
        #expect(AppleNotesImportView.importTitle(picked: 0, new: 0, all: 35, locale: en) == "Import")
        #expect(AppleNotesImportView.folderLine(coming: 18, of: 18, locale: en) == "18 notes")
        #expect(AppleNotesImportView.folderLine(coming: 8, of: 9, locale: en) == "8 of 9 notes")
    }

    @Test func picturesAreCutOutBeforeTheTextIsRead() {
        let (html, pictures) = AppleNotesImporter.takePictures(from: Self.photoHTML)
        #expect(pictures.count == 1 && pictures[0].picture.type == .png)
        #expect(!html.contains("base64") && html.contains(pictures[0].token))
        #expect(AppleNotesImporter.place("![a](pane-file:1)", for: "TOKEN", in: "before TOKEN after\nnext") == "before\n![a](pane-file:1)\nafter\nnext")
        #expect(AppleNotesImporter.place("", for: "TOKEN", in: "a\nTOKEN\nb") == "a\nb", "a picture too big to keep leaves no gap")
    }
}
#endif
