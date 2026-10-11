#if os(macOS)
import Foundation
import SQLite3
import SwiftData
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
        """
    }

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
        insert into ZICNOTEDATA values (3, 10, x'\(weekendStored)');
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
        #expect(summary.locked == 1, "a locked note is left in Apple Notes, and counted")
        #expect(summary.unreadable == ["Gone"])
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
        #expect(photo.body.contains("Photo next\n\(file.markdown)\nAfter photo"), "the picture sits where it was, on a line of its own")
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

    @Test func picturesAreCutOutBeforeTheTextIsRead() {
        let (html, pictures) = AppleNotesImporter.takePictures(from: Self.photoHTML)
        #expect(pictures.count == 1 && pictures[0].picture.type == .png)
        #expect(!html.contains("base64") && html.contains(pictures[0].token))
        #expect(AppleNotesImporter.place("![a](pane-file:1)", for: "TOKEN", in: "before TOKEN after\nnext") == "before\n![a](pane-file:1)\nafter\nnext")
        #expect(AppleNotesImporter.place("", for: "TOKEN", in: "a\nTOKEN\nb") == "a\nb", "a picture too big to keep leaves no gap")
    }
}
#endif
