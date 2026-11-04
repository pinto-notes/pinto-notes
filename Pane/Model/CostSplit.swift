import Foundation

/// A note's table of who paid what (a "Paid by" column and an amount) made into the Trip costs app
/// in one press, with no AI (persona council, 4 November 2026: Sara's trip costs were offered as a
/// budget). The app is the Trip costs template's, shipped with the app
/// (`Pane/Resources/Templates/template-app-trip-costs.*`, built from web/content/templates/trip-costs.app);
/// its data is the table's rows: everyone who paid, and each cost split equally between them all,
/// which the app lets you change.
enum CostSplit {
    static let slug = "trip-costs"
    /// Who made the app, as the note's receipt says it ("Pinto Notes made this note an app", Undo).
    static let writer = "Pinto Notes"

    /// The template's compiled app, as a note's page holds it; nil when the build doesn't carry it.
    static var project: String? {
        Bundle.main.url(forResource: "template-app-\(slug).project", withExtension: "json").flatMap { try? String(contentsOf: $0, encoding: .utf8) }
    }

    /// Which of a table's columns say what, who paid, how much and when.
    struct Columns: Equatable {
        var what: Int?
        var paidBy: Int
        var amount: Int
        var date: Int?
    }

    static func columns(_ names: [String]) -> Columns? {
        let n = names.map { $0.lowercased().trimmingCharacters(in: .whitespaces) }
        guard let paid = n.firstIndex(where: { $0.hasPrefix("paid by") || ["who paid", "payer", "paid by whom"].contains($0) }),
              let amount = n.firstIndex(where: { $0.contains("amount") || $0.contains("cost") || $0.contains("price") || $0.hasPrefix("sum") || $0 == "kr" || $0 == "total" }),
              amount != paid else { return nil }
        let date = n.firstIndex(where: { ["date", "day", "when"].contains($0) })
        let what = n.indices.first { ![paid, amount, date].contains($0) }
        return Columns(what: what, paidBy: paid, amount: amount, date: date)
    }

    /// The first table in the note that is one, with its columns.
    static func table(in body: String) -> (table: NotePage.Table, columns: Columns)? {
        for t in NotePage.tables(in: body.components(separatedBy: "\n")) {
            if let c = columns(t.columns.map(\.name)) { return (t, c) }
        }
        return nil
    }

    /// "€480", "1,200 kr", "42.50", "42,50", "1.200,50": the number. Nil for a cell that isn't one.
    static func amount(_ cell: String) -> Double? {
        var s = cell.trimmingCharacters(in: .whitespaces)
        s = s.filter { $0.isNumber || $0 == "." || $0 == "," || $0 == "-" }
        guard !s.isEmpty else { return nil }
        // Both marks: the last one is the decimal ("1,200.50", "1.200,50").
        if let dot = s.lastIndex(of: "."), let comma = s.lastIndex(of: ",") {
            s = comma > dot ? s.replacingOccurrences(of: ".", with: "").replacingOccurrences(of: ",", with: ".") : s.replacingOccurrences(of: ",", with: "")
        } else if let comma = s.lastIndex(of: ","), s.distance(from: comma, to: s.endIndex) == 3 { s = s.replacingOccurrences(of: ",", with: ".") }
        else { s = s.replacingOccurrences(of: ",", with: "") }
        return Double(s)
    }

    /// The currency the table is in: a sign in its amounts or its column's name, else none.
    static func currency(header: String, cells: [String]) -> String {
        let text = ([header] + cells).joined(separator: " ")
        for sign in ["€", "$", "£", "¥", "₹"] where text.contains(sign) { return sign }
        let words = text.lowercased()
        for (word, sign) in [("kr", "kr"), ("sek", "kr"), ("nok", "kr"), ("dkk", "kr"), ("eur", "€"), ("usd", "$"), ("gbp", "£"), ("chf", "CHF")] where words.range(of: "\\b\(word)\\b", options: .regularExpression) != nil { return sign }
        return ""
    }

    /// The app's data from the note: its title as the trip's name, everyone who paid, and each
    /// row with a payer and an amount as a cost split between everyone. Nil without such a table.
    static func data(title: String, body: String) -> NotePageData.Doc? {
        guard let (t, c) = table(in: body) else { return nil }
        var people: [[String: Any]] = []
        var ids: [String: String] = [:]
        var costs: [[String: Any]] = []
        for row in t.rows {
            let payer = row[c.paidBy].trimmingCharacters(in: .whitespaces)
            guard !payer.isEmpty, let amount = amount(row[c.amount]), amount > 0 else { continue }
            let key = payer.lowercased()
            if ids[key] == nil {
                ids[key] = "p\(people.count + 1)"
                people.append(["id": ids[key]!, "name": payer])
            }
            var cost: [String: Any] = ["id": "c\(costs.count + 1)", "what": c.what.map { row[$0].trimmingCharacters(in: .whitespaces) }.flatMap { $0.isEmpty ? nil : $0 } ?? "Cost \(costs.count + 1)",
                                       "amount": (amount * 100).rounded() / 100, "paidBy": ids[key]!, "split": "equal"]
            if let d = c.date, let day = TypedTable.date(from: row[d].trimmingCharacters(in: .whitespaces)) { cost["date"] = TypedTable.day(day) }
            costs.append(cost)
        }
        guard !costs.isEmpty else { return nil }
        let name = title.trimmingCharacters(in: .whitespaces)
        let values: [String: Any] = ["name": name.isEmpty ? "Trip costs" : name,
                                     "currency": currency(header: t.columns[c.amount].name, cells: t.rows.map { $0[c.amount] }),
                                     "people": people, "costs": costs, "payments": [Any]()]
        return ["values": values, "collections": [String: Any]()]
    }
}
