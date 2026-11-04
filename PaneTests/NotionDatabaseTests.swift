import Foundation
import SwiftData
import Testing
import ZIPFoundation
@testable import Pane

/// Persona council 11-04 (Notion switchers): a Notion database comes in as one note with a typed
/// table, its columns typed from the CSV Notion writes, each row's title a link to its page.
@MainActor struct NotionDatabaseTests {
    @Test func readsTheCSVAsNotionWritesIt() {
        let csv = "\u{FEFF}Name,Notes,Tags\r\n\"Dune, the first\",\"Said \"\"spice\"\"\nand more\",\"sci-fi, classic\"\r\nEmma,,\r\n"
        #expect(NotionDatabase.rows(csv) == [["Name", "Notes", "Tags"], ["Dune, the first", "Said \"spice\"\nand more", "sci-fi, classic"], ["Emma", "", ""]])
        #expect(NotionDatabase.rows("a,b") == [["a", "b"]], "no line break at the end")
    }

    @Test func typesEachColumnFromItsValues() {
        #expect(NotionDatabase.column("Owned", ["Yes", "No", "", "Yes"]).type == .choice(["Yes", "No"]), "Notion's checkbox: Yes and No, a checkbox here")
        let finished = NotionDatabase.column("Finished", ["September 12, 2026", "", "Oct 3, 2026", "2026-11-01"])
        #expect(finished.type == .date && finished.cells == ["2026-09-12", "", "2026-10-03", "2026-11-01"])
        #expect(NotionDatabase.column("Met", ["September 12, 2026 3:00 PM"]).type == .text, "a time stays as written")
        #expect(NotionDatabase.column("Trip", ["May 12, 2026 → May 15, 2026"]).type == .text, "a range stays as written")
        let pages = NotionDatabase.column("Pages", ["412", "1,024", "", "-3"])
        #expect(pages.type == .number && pages.cells == ["412", "1024", "", "-3"])
        let price = NotionDatabase.column("Price", ["$12.50", "$1,200", "$3"])
        #expect(price.type == .number && price.name == "Price ($)" && price.cells == ["12.50", "1200", "3"], "the currency goes to the column's name")
        #expect(NotionDatabase.column("Done", ["40%", "100%"]).name == "Done (%)")
        #expect(NotionDatabase.column("Mixed", ["$3", "€4"]).type == .text, "two currencies aren't one number column")
        #expect(NotionDatabase.column("Status", ["Read", "Reading", "Read", "To read"]).type == .choice(["Read", "Reading", "To read"]), "a select: a few short values that repeat")
        #expect(NotionDatabase.column("Author", ["Frank Herbert", "Richard Powers"]).type == .text, "no repeats: text")
        #expect(NotionDatabase.column("Tags", ["sci-fi, classic", "sci-fi", "classic"]).type == .text, "a multi-select stays text")
        #expect(NotionDatabase.column("Name", ["Yes", "No"], title: true).type == .text, "the title is always text")
        #expect(NotionDatabase.column("Answer", ["Yes", "Maybe", "Yes"]).type == .choice(["Maybe", "Yes"]), "a select starting with Yes isn't drawn as a checkbox")
        #expect(NotionDatabase.safeName("Cost; per=night | €") == "Cost, per-night / €", "the type line's own marks can't be in a name")
    }

    @Test func aDatabaseIsATypedTableWithItsRowsLinked() throws {
        let csv = """
        Name,Author,Status,Pages,Finished,Owned,Series
        Dune,Frank Herbert,Read,412,"September 12, 2026",Yes,"Dune Messiah (Reading%20list%20abc/Dune%20Messiah%20def.md)"
        Piranesi,Susanna Clarke,Read,272,,No,
        Untitled row,Nobody,To read,,,No,
        """
        let table = try #require(NotionDatabase.table(csv) { column, _, text, path in
            if column == 0 { return text == "Untitled row" ? nil : "[[\(text)]]" }
            return path.map { _ in "[[\(text)]]" }
        })
        #expect(table.columns.map(\.name) == ["Name", "Author", "Status", "Pages", "Finished", "Owned", "Series"])
        #expect(table.columns.map(\.type) == [.text, .text, .choice(["Read", "To read"]), .number, .date, .choice(["Yes", "No"]), .text])
        #expect(table.rows[0] == ["[[Dune]]", "Frank Herbert", "Read", "412", "2026-09-12", "Yes", "[[Dune Messiah]]"])
        #expect(table.rows[2][0] == "Untitled row", "a row without a page keeps its title as words")
        // As the note writes it, read back the same.
        let back = try #require(TypedTable.find(in: "Reading list\n\n" + table.markdown).first)
        #expect(back.columns == table.columns && back.rows == table.rows)
    }

    @Test func aDatabaseIsKnownByItsFileWithNotionsId() {
        let id = "7d6c5b4a39281706f5e4d3c2b1a09f8e"
        #expect(NotionDatabase.key(["Home 0f1e2d3c4b5a69788796a5b4c3d2e1f0", "Reading list \(id).csv"]) == "home/reading list")
        #expect(NotionDatabase.key(["Home 0f1e2d3c4b5a69788796a5b4c3d2e1f0", "Reading list \(id)_all.csv"]) == "home/reading list", "the _all file is the same database")
        #expect(NotionDatabase.key(["budget.csv"]) == nil, "a .csv without Notion's id is a file")
        #expect(NotionDatabase.title("Reading list \(id)_all.csv") == "Reading list")
    }

    /// Two databases, one relating to the other: each row links its own page, and the relation
    /// links the page it names, in the other database.
    @Test func aRelationLinksThePageItNames() async throws {
        let fm = FileManager.default
        let base = fm.temporaryDirectory.appending(path: "notion-db-\(UUID().uuidString)/Notion export")
        defer { try? fm.removeItem(at: base.deletingLastPathComponent()) }
        let books = "Books 1a2b3c4d5e6f708192a3b4c5d6e7f809", authors = "Authors 2b3c4d5e6f708192a3b4c5d6e7f8091a"
        let herbert = "Frank Herbert 3c4d5e6f708192a3b4c5d6e7f8091a2b"
        func write(_ path: String, _ text: String) throws {
            let url = base.appending(path: path)
            try fm.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try text.write(to: url, atomically: true, encoding: .utf8)
        }
        func enc(_ s: String) -> String { s.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed)! }
        try write("\(books).csv", "Name,Author\nDune,\"Frank Herbert (\(enc(authors))/\(enc(herbert)).md)\"\nEmma,\n")
        try write("\(books)/Dune 4d5e6f708192a3b4c5d6e7f8091a2b3c.md", "# Dune\n\nSpice.\n")
        try write("\(books)/Emma 5e6f708192a3b4c5d6e7f8091a2b3c4d.md", "# Emma\n\nA match.\n")
        try write("\(authors).csv", "Name\nFrank Herbert\n")
        try write("\(authors)/\(herbert).md", "# Frank Herbert\n\nWrote Dune.\n")
        let r = try await MarkdownImportTests.importing([base])
        defer { r.cleanUp() }
        #expect(r.summary.failedFiles.isEmpty && r.summary.notes == 5, "three pages and two databases")
        let table = try #require(TypedTable.find(in: try r.note("Books").body).first)
        #expect(table.rows == [["[[Dune]]", "[[Frank Herbert]]"], ["[[Emma]]", ""]])
        #expect(try r.note("Authors").body.contains("| [[Frank Herbert]] |"))
    }
}
