import Foundation

/// A Notion database as its Markdown & CSV export has it: a `.csv` of its rows (the title first,
/// then each property as Notion shows it), beside a folder with a page per row. Imported as one
/// note with a typed table (persona council 11-04): text, numbers, dates, checkboxes (Notion's
/// Yes and No) and selects (a few words that repeat) get their column types, each row's title links
/// to that row's page, and the pages still come in as notes of their own. Views, formulas and
/// rollups don't come over as such: what the export wrote for them is kept as text.
enum NotionDatabase {
    /// The database a file at `path` is, by its key (its folders and its name without Notion's id),
    /// or nil for a file that isn't one. Notion writes `Name <id>.csv` and, since 2024,
    /// `Name <id>_all.csv` with every row; both are the same database.
    static func key(_ path: [String]) -> String? {
        guard let last = path.last, (last as NSString).pathExtension.lowercased() == "csv" else { return nil }
        var stem = (last as NSString).deletingPathExtension
        if stem.hasSuffix("_all") { stem.removeLast(4) }
        let name = MarkdownImporter.cleanName(stem)
        guard name != stem, !name.isEmpty else { return nil }
        return (path.dropLast().map(MarkdownImporter.cleanName) + [name]).joined(separator: "/").lowercased()
    }

    /// The name the database's note gets: its file name without Notion's id.
    static func title(_ fileName: String) -> String {
        var stem = (fileName as NSString).deletingPathExtension
        if stem.hasSuffix("_all") { stem.removeLast(4) }
        return MarkdownImporter.cleanName(stem)
    }

    // MARK: Reading the CSV

    /// The rows of a CSV as RFC 4180 has them: commas between cells, quotes around a cell with a
    /// comma, quote or line break in it, a quote inside one written twice.
    static func rows(_ csv: String) -> [[String]] {
        var rows: [[String]] = []
        var row: [String] = []
        var cell = ""
        var quoted = false
        var chars = Array(csv.hasPrefix("\u{FEFF}") ? String(csv.dropFirst()) : csv)
        if chars.last != "\n" { chars.append("\n") }
        var i = 0
        while i < chars.count {
            let c = chars[i]
            if quoted {
                if c == "\"" {
                    if i + 1 < chars.count, chars[i + 1] == "\"" { cell.append("\""); i += 1 } else { quoted = false }
                } else {
                    cell.append(c)
                }
            } else if c == "\"" {
                quoted = true
            } else if c == "," {
                row.append(cell); cell = ""
            } else if c == "\n" || c == "\r\n" || c == "\r" {
                if c == "\r", i + 1 < chars.count, chars[i + 1] == "\n" { i += 1 }
                row.append(cell); cell = ""
                if !(row.count == 1 && row[0].isEmpty) { rows.append(row) }
                row = []
            } else {
                cell.append(c)
            }
            i += 1
        }
        return rows
    }

    // MARK: Columns

    /// One column of the table: its name (a unit added for numbers written with one, "Price (€)"),
    /// its type and its cells as the table writes them.
    struct Column: Equatable {
        var name: String
        var type: TypedTable.ColumnType
        var cells: [String]
    }

    /// The type a column's values have, and the cells written for it: dates as yyyy-MM-dd, numbers
    /// without their thousands separators or currency sign. The first column is the title: text.
    static func column(_ name: String, _ values: [String], title: Bool = false) -> Column {
        let header = safeName(name)
        let filled = values.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        guard !title, !filled.isEmpty else { return Column(name: header, type: .text, cells: values) }
        if filled.allSatisfy({ $0 == "Yes" || $0 == "No" }) {
            return Column(name: header, type: .choice(["Yes", "No"]), cells: values)
        }
        if let days = dates(values) { return Column(name: header, type: .date, cells: days) }
        if let (numbers, unit) = numbers(values) {
            return Column(name: unit.map { "\(header) (\($0))" } ?? header, type: .number, cells: numbers)
        }
        // A select: a few short values that repeat. Several in one cell (a multi-select, "a, b")
        // stay text.
        var options: [String] = []
        for v in filled where !options.contains(v) { options.append(v) }
        let short = filled.allSatisfy { $0.count <= 40 && !$0.contains(", ") && !$0.contains("|") && $0.split(separator: " ").count <= 4 }
        if short, options.count <= 10, options.count < filled.count {
            // A first answer of "Yes" draws as a checkbox; a select that only starts with Yes isn't one.
            if options.first?.lowercased() == "yes", options.count > 1 { options.append(options.removeFirst()) }
            return Column(name: header, type: .choice(options), cells: values)
        }
        return Column(name: header, type: .text, cells: values)
    }

    /// A column name the table's type line can hold (`Name=type; …`).
    static func safeName(_ name: String) -> String {
        let n = name.replacingOccurrences(of: ";", with: ",").replacingOccurrences(of: "=", with: "-")
            .replacingOccurrences(of: "|", with: "/").replacingOccurrences(of: "-->", with: "->")
            .trimmingCharacters(in: .whitespaces)
        return n.isEmpty ? "Column" : n
    }

    /// Every filled value a day ("September 12, 2026", "Sep 12, 2026", "2026-09-12"): the cells as
    /// yyyy-MM-dd. Nil when any has a time or is a range ("→"): those stay as Notion wrote them.
    static func dates(_ values: [String]) -> [String]? {
        var out: [String] = []
        for raw in values {
            let v = raw.trimmingCharacters(in: .whitespaces)
            if v.isEmpty { out.append(""); continue }
            guard !v.contains("→"), let d = day(v) else { return nil }
            out.append(d)
        }
        return out
    }

    nonisolated(unsafe) private static let dayFormats: [DateFormatter] = ["MMMM d, yyyy", "MMM d, yyyy", "yyyy-MM-dd", "yyyy/MM/dd"].map { f in
        let d = DateFormatter()
        d.locale = Locale(identifier: "en_US_POSIX")
        d.timeZone = TimeZone(identifier: "UTC")
        d.dateFormat = f
        d.isLenient = false
        return d
    }

    /// "September 12, 2026" as 2026-09-12; nil for anything else (a time, a word).
    static func day(_ s: String) -> String? {
        for f in dayFormats {
            // Read back the same, so "Sept 12" or "12/9" never turns into some other day.
            guard let d = f.date(from: s), f.string(from: d).caseInsensitiveCompare(s) == .orderedSame else { continue }
            var utc = Calendar(identifier: .gregorian)
            utc.timeZone = TimeZone(identifier: "UTC")!
            return TypedTable.day(d, calendar: utc)
        }
        return nil
    }

    /// Every filled value a number, written the same way ("1,234.50", "$12", "40%", "-3"): the
    /// cells as plain numbers ("1234.50") and the sign or unit they shared, if any. Nil otherwise.
    static func numbers(_ values: [String]) -> ([String], String?)? {
        var out: [String] = []
        var unit: String?? = .none
        for raw in values {
            let v = raw.trimmingCharacters(in: .whitespaces)
            if v.isEmpty { out.append(""); continue }
            guard let m = v.wholeMatch(of: /(-?)\s*([$€£¥]|kr\s?)?\s*(-?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?\s*(%|\s?kr)?/) else { return nil }
            let sign = m.1.isEmpty && m.3.isEmpty ? "" : "-"
            let mark = (m.2.map(String.init) ?? m.6.map(String.init))?.trimmingCharacters(in: .whitespaces)
            if case .some(let seen) = unit, seen != mark { return nil }
            unit = .some(mark)
            out.append(sign + m.4.replacingOccurrences(of: ",", with: "") + (m.5.map(String.init) ?? ""))
        }
        return (out, unit ?? nil)
    }

    // MARK: The note

    /// The database as a typed table. `link` gives what a cell becomes when it names another page
    /// (the title column's row pages, a relation's "Title (path.md)"): a wiki link, or nil to keep
    /// the words. Nil for a CSV without a header.
    static func table(_ csv: String, link: (_ column: Int, _ row: Int, _ text: String, _ path: String?) -> String?) -> TypedTable? {
        let all = rows(csv)
        guard let header = all.first, !header.isEmpty else { return nil }
        let width = header.count
        let body = all.dropFirst().map { r in Array((r + Array(repeating: "", count: max(0, width - r.count))).prefix(width)) }
        var columns: [Column] = []
        for c in 0..<width {
            var cells = body.map { $0[c].replacingOccurrences(of: "\n", with: " ") }
            // Pages named in a cell: the row's own page in the title column, a relation's pages in another.
            for (r, cell) in cells.enumerated() {
                if c == 0 {
                    if let l = link(0, r, cell, nil) { cells[r] = l }
                } else if cell.contains(".md)") {
                    cells[r] = relations(cell) { text, path in link(c, r, text, path) }
                }
            }
            // A column that links pages stays text, so its links aren't read as a select.
            let linked = c > 0 && cells.contains { $0.contains("[[") }
            columns.append(linked ? Column(name: safeName(header[c]), type: .text, cells: cells) : column(header[c], cells, title: c == 0))
        }
        let rows = (0..<body.count).map { r in columns.map { $0.cells[r] } }
        return TypedTable(columns: columns.map { TypedTable.Column(name: $0.name, type: $0.type) }, rows: rows)
    }

    /// "Dune (Books%20abc/Dune%20def.md), Emma (…)": each page as `link` makes it, else its title.
    static func relations(_ cell: String, link: (String, String) -> String?) -> String {
        cell.components(separatedBy: ", ").map { part in
            guard let m = part.wholeMatch(of: /(.+?) \(([^()]+\.md)\)/) else { return part }
            return link(String(m.1), String(m.2)) ?? String(m.1)
        }.joined(separator: ", ")
    }
}
