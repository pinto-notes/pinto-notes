import Foundation
import Testing
@testable import Pane

@Suite struct TypedTableTests {
    let source = """
    Evening tracker

    <!-- pane-table: Date=date; Energy (1-10)=scale 1-10; Diet=choice Yes|No|N/A; Hours=number; Notes=text -->
    | Date | Energy (1-10) | Diet | Hours | Notes |
    | --- | --- | --- | --- | --- |
    | 2026-09-26 | 6 | No | 5 | Tired \\| slow |
    | 2026-09-27 | 8 | Yes | 7.5 |  |

    after
    """

    @Test func parsesSchemaAndRows() throws {
        let t = try #require(TypedTable.find(in: source).first)
        #expect(t.columns.map(\.name) == ["Date", "Energy (1-10)", "Diet", "Hours", "Notes"])
        #expect(t.columns[1].type == .scale(1, 10))
        #expect(t.columns[2].type == .choice(["Yes", "No", "N/A"]))
        #expect(t.rows.count == 2)
        #expect(t.rows[0][4] == "Tired | slow")
        #expect(t.rows[1][4] == "")
        #expect((source as NSString).substring(with: t.range).hasPrefix("<!-- pane-table"))
        #expect((source as NSString).substring(with: t.range).hasSuffix("|  |"))
    }

    @Test func roundTripsMarkdown() throws {
        let t = try #require(TypedTable.find(in: source).first)
        let again = try #require(TypedTable.find(in: t.markdown).first)
        #expect(again.columns == t.columns)
        #expect(again.rows == t.rows)
    }

    @Test func summarisesRecentRows() throws {
        let t = try #require(TypedTable.find(in: source).first)
        let s = Dictionary(uniqueKeysWithValues: t.summary())
        #expect(s["Energy"] == "7")
        #expect(s["Diet"] == "1/2")
        #expect(s["Hours"] == TypedTable.format(6.25))
        #expect(TypedTable.format(6.25).contains("3"))
    }

    @Test func pointsAreSortedAndSkipInvalidRows() throws {
        let markdown = """
        <!-- pane-table: Date=date; Hours=number -->
        | Date | Hours |
        | --- | --- |
        | 2026-09-28 | 3 |
        | 2026-09-26 | 2,5 |
        | not-a-date | 4 |
        | 2026-09-27 | not-a-number |
        """
        let table = try #require(TypedTable.find(in: markdown).first)
        let points = table.points(for: 1)

        #expect(points.map { TypedTable.day($0.0) } == ["2026-09-26", "2026-09-28"])
        #expect(points.map(\.1) == [2.5, 3])
    }

    @Test func countsChoicesWithoutRegardToCase() throws {
        let markdown = """
        <!-- pane-table: Date=date; Diet=choice Yes|No|N/A -->
        | Date | Diet |
        | --- | --- |
        | 2026-09-26 | yes |
        | 2026-09-27 | No |
        | 2026-09-28 | Yes |
        | 2026-09-29 | N/A |
        """
        let table = try #require(TypedTable.find(in: markdown).first)

        let counts = table.counts(for: 1)
        #expect(counts.map(\.0) == ["Yes", "No", "N/A"])
        #expect(counts.map(\.1) == [2, 1, 1])
    }

    @Test func trendPointsAreSortedAndSkipInvalidRows() throws {
        let table = TypedTable(
            columns: [
                .init(name: "Date", type: .date),
                .init(name: "Hours", type: .number)
            ],
            rows: [
                ["2026-09-28", "12,5"],
                ["", "8"],
                ["2026-09-26", "not a number"],
                ["2026-09-27", "6"],
                ["not-a-date", "3.75"],
                ["2026-09-29", ""]
            ]
        )

        let points = table.points(for: 1)
        #expect(points.map { TypedTable.day($0.0) } == ["2026-09-27", "2026-09-28"])
        #expect(points.map(\.1) == [6, 12.5])
    }

    @Test func trendCountsMatchChoicesWithoutRegardToCase() {
        let table = TypedTable(
            columns: [
                .init(name: "Date", type: .date),
                .init(name: "Diet", type: .choice(["Yes", "No"]))
            ],
            rows: [
                ["2026-09-26", "yes"],
                ["2026-09-27", "Yes"],
                ["2026-09-28", "YES"],
                ["2026-09-29", "No"],
                ["2026-09-30", "no"]
            ]
        )

        let counts = table.counts(for: 1)
        #expect(counts.map(\.0) == ["Yes", "No"])
        #expect(counts.map(\.1) == [3, 2])
    }

    @Test func blankRowHasToday() throws {
        let t = try #require(TypedTable.find(in: source).first)
        let day = TypedTable.date(from: "2026-10-01")!.addingTimeInterval(23 * 3600 + 50 * 60) // 23:50 local
        #expect(t.blankRow(today: day)[0] == "2026-10-01")
        #expect(t.rowIndex(for: TypedTable.date(from: "2026-09-27")!) == 1)
    }

    @Test func ignoresPlainTables() {
        #expect(TypedTable.find(in: "| a | b |\n| --- | --- |\n| 1 | 2 |").isEmpty)
    }
}

/// Note previews in the list (TestFlight 1.1.1 showed `<!-- pane-table: Date=date; …`).
@Suite struct ListPreviewTests {
    static let runningLog = "Running log\n\n<!-- pane-table: Date=date; Distance km=number; Minutes=number; Feel=scale 1-5 -->\n| Date | Distance km | Minutes | Feel |\n| --- | --- | --- | --- |\n| 2026-09-22 | 5 | 27 | 4 |\n| 2026-09-27 | 10 | 56 | 5 |\n"
    static let hiring = "Hiring: product designer\n\n<!-- pane-table: Name=text; Date=date; Verdict=choice Hire|Maybe|No -->\n| Name | Date | Verdict |\n| --- | --- | --- |\n| Sara Lind | 2026-09-15 | Maybe |\n\nNext step: portfolio review with Jonas on Monday.\n"

    /// A note that is only a table previews its latest row, read with its columns.
    @Test func aTableOnlyNotePreviewsItsLatestRow() {
        let day = Date(timeIntervalSince1970: 1_790_467_200).formatted(Date.FormatStyle(timeZone: .gmt).day().month(.abbreviated)) // 2026-09-27
        #expect(NoteText.title(of: Self.runningLog) == "Running log")
        #expect(NoteText.preview(of: Self.runningLog) == "\(day) · 10 km · Minutes 56 · Feel 5")
        #expect(NoteHead.of(Self.runningLog).preview == NoteText.preview(of: Self.runningLog), "the sealed head says the same")
        #expect(!NoteText.preview(of: Self.runningLog).contains("pane-table"))
    }

    /// Text after the table says more than the table does.
    @Test func textAfterATableWins() {
        #expect(NoteText.title(of: Self.hiring) == "Hiring: product designer")
        #expect(NoteText.preview(of: Self.hiring) == "Next step: portfolio review with Jonas on Monday.")
    }

    @Test func aHeaderOnlyTableShowsItsNames() {
        #expect(NoteText.preview(of: "Plan\n\n| A | B |\n| --- | --- |\n") == "A · B")
    }

    @Test func commentsAreLeftOutLikeTheServer() {
        #expect(NoteText.title(of: "<!-- hidden -->\nTitle") == "Title")
        #expect(NoteText.title(of: "Before <!-- note -->after") == "Before after")
        #expect(NoteText.preview(of: "Title\n<!-- an open comment") == "No additional text")
    }

    @Test func plainNotesAreUnchanged() {
        #expect(NoteText.preview(of: "Groceries\n\n- [ ] Oat milk\n") == "Oat milk")
        #expect(NoteText.preview(of: "| a | b |\nrest") == "rest", "a table as the first line is the title")
    }
}
