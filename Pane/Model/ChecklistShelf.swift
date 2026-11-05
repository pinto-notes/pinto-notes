import Foundation

// Checklists within reach (2026-11-04): the Home Screen widget, Siri and Shortcuts. Foundation
// only: the app, the widget extension and the tests all build this file.

/// One checklist item in a note, as the widget shows it.
struct ChecklistLine: Codable, Hashable, Sendable {
    /// The item's text, without its markers (bold, links and the like read as plain words).
    var text: String
    var done: Bool
    /// Which checklist item of the note it is, counting from 0, so a tick finds it again.
    var index: Int
}

/// Checklist items in a note's markdown: reading them, ticking one, adding one. Pure functions
/// over the text, like ListEditing.
enum Checklist {
    /// `- [ ] item`, `* [x] item`, indented or not. Groups: indent, mark, text.
    private static let pattern = try! NSRegularExpression(pattern: #"^([ \t]*)[-*+] \[([ xX])\] (.*)$"#)

    private struct Found {
        var line: Int
        var indent: String
        var done: Bool
        var raw: String
    }

    /// Every checklist line, in the note's order. Lines in code blocks don't count.
    private static func found(_ lines: [String]) -> [Found] {
        var out: [Found] = []
        var fenced = false
        for (i, line) in lines.enumerated() {
            if line.trimmingCharacters(in: .whitespaces).hasPrefix("```") { fenced.toggle(); continue }
            guard !fenced else { continue }
            let ns = line as NSString
            guard let m = pattern.firstMatch(in: line, range: NSRange(location: 0, length: ns.length)) else { continue }
            out.append(Found(line: i, indent: ns.substring(with: m.range(at: 1)), done: ns.substring(with: m.range(at: 2)) != " ",
                             raw: ns.substring(with: m.range(at: 3))))
        }
        return out
    }

    private static func lines(_ body: String) -> [String] {
        body.components(separatedBy: "\n")
    }

    /// The note's checklist items, in its order.
    static func items(in body: String) -> [ChecklistLine] {
        found(lines(body)).enumerated().map { i, f in ChecklistLine(text: plain(f.raw), done: f.done, index: i) }
    }

    /// Whether the note has a checklist at all.
    static func has(_ body: String) -> Bool {
        body.contains("[ ] ") || body.contains("[x] ") || body.contains("[X] ") ? !items(in: body).isEmpty : false
    }

    /// The body with one item ticked (or unticked): the item at `index` when its text is still
    /// `text`, otherwise the first item with that text. Like a tick in the editor, a ticked item
    /// sinks below the open ones of its list (ListEditing.sortChecklist). Nil when the item is
    /// gone; the body unchanged when it's already that way.
    static func setting(_ done: Bool, index: Int, text: String, in body: String) -> String? {
        var all = lines(body)
        let items = found(all)
        let at: Found
        if items.indices.contains(index), plain(items[index].raw) == text {
            at = items[index]
        } else if let same = items.first(where: { plain($0.raw) == text && $0.done != done }) ?? items.first(where: { plain($0.raw) == text }) {
            at = same
        } else {
            return nil
        }
        guard at.done != done else { return body }
        all[at.line] = "\(at.indent)- [\(done ? "x" : " ")] \(at.raw)"
        sortRun(around: at.line, in: &all)
        return all.joined(separator: "\n")
    }

    /// Open items first, ticked ones after, in the flat run of items around `line` (same indent,
    /// nothing nested in it); as the editor does after a tick.
    private static func sortRun(around line: Int, in all: inout [String]) {
        func item(_ i: Int) -> (indent: String, done: Bool)? {
            guard all.indices.contains(i) else { return nil }
            let ns = all[i] as NSString
            guard let m = pattern.firstMatch(in: all[i], range: NSRange(location: 0, length: ns.length)) else { return nil }
            return (ns.substring(with: m.range(at: 1)), ns.substring(with: m.range(at: 2)) != " ")
        }
        guard let mine = item(line) else { return }
        var lo = line, hi = line
        while let p = item(lo - 1), p.indent == mine.indent { lo -= 1 }
        while let p = item(hi + 1), p.indent == mine.indent { hi += 1 }
        // A deeper line just after the run belongs to its last item: leave the run as it is.
        if all.indices.contains(hi + 1) {
            let next = all[hi + 1]
            let indent = next.prefix { $0 == " " || $0 == "\t" }
            if !next.trimmingCharacters(in: .whitespaces).isEmpty, indent.count > mine.indent.count { return }
        }
        let run = Array(lo...hi)
        let order = run.filter { item($0)?.done == false } + run.filter { item($0)?.done == true }
        let text = order.map { all[$0] }
        for (i, j) in run.enumerated() { all[j] = text[i] }
    }

    /// The body with `item` added as an open checklist item: after the last open item of the
    /// note's last checklist (above its ticked ones), or at the end. Each line of `item` is one item.
    static func adding(_ item: String, to body: String) -> String {
        let new = item.components(separatedBy: .newlines)
            .map { line -> String in
                var s = line.trimmingCharacters(in: .whitespaces)
                // "- [ ] milk" or "- milk" said or pasted: the words only.
                if let r = s.range(of: #"^([-*+] \[[ xX]\] |[-*+] )"#, options: .regularExpression) { s.removeSubrange(r) }
                return s
            }
            .filter { !$0.isEmpty }
        guard !new.isEmpty else { return body }
        var all = lines(body)
        let items = found(all)
        guard let last = items.last else {
            let trimmed = String(body.reversed().drop(while: \.isWhitespace).reversed())
            let added = new.map { "- [ ] \($0)" }.joined(separator: "\n")
            return trimmed.isEmpty ? added + "\n" : trimmed + "\n\n" + added + "\n"
        }
        // The last checklist's run: the items at the last one's indent, going up while they follow on.
        var start = items.count - 1
        while start > 0, items[start - 1].line == items[start].line - 1, items[start - 1].indent == last.indent { start -= 1 }
        let run = items[start...]
        // Under the last open item; with every item ticked, above the first one.
        let after = run.last(where: { !$0.done }).map { $0.line + 1 } ?? run.first!.line
        all.insert(contentsOf: new.map { "\(last.indent)- [ ] \($0)" }, at: after)
        return all.joined(separator: "\n")
    }

    /// The first item whose words contain `query` (any case), open ones first.
    static func match(_ query: String, in body: String) -> ChecklistLine? {
        let q = normalized(query)
        guard !q.isEmpty else { return nil }
        let all = items(in: body)
        let exact = all.filter { normalized($0.text) == q }
        let near = all.filter { normalized($0.text).contains(q) }
        return exact.first { !$0.done } ?? near.first { !$0.done } ?? exact.first ?? near.first
    }

    private static func normalized(_ s: String) -> String {
        s.lowercased().split(whereSeparator: \.isWhitespace).joined(separator: " ")
    }

    /// An item's words without markdown: links read as their text, emphasis and code marks go.
    static func plain(_ raw: String) -> String {
        var s = raw.replacingOccurrences(of: #"\[\[([^\]|]*)\|([^\]]*)\]\]"#, with: "$2", options: .regularExpression)
            .replacingOccurrences(of: #"\[\[([^\]]*)\]\]"#, with: "$1", options: .regularExpression)
            .replacingOccurrences(of: #"\[([^\]]*)\]\([^)]*\)"#, with: "$1", options: .regularExpression)
            .replacingOccurrences(of: #"</?[a-zA-Z][^>]*>"#, with: "", options: .regularExpression)
        for token in ["**", "__", "~~", "==", "`"] { s = s.replacingOccurrences(of: token, with: "") }
        s = s.replacingOccurrences(of: #"(?<![\w*])[*_](?=\S)(.+?)(?<=\S)[*_](?![\w*])"#, with: "$1", options: .regularExpression)
        return s.trimmingCharacters(in: .whitespaces)
    }
}

/// What the app leaves in the App Group for the widget and the share sheet, and what they leave
/// for the app: checklist notes (titles and items), the recent notes (titles), and ticks made on
/// the Home Screen, waiting to be written into their notes. Locked notes never come here.
enum ChecklistShelf {
    /// A checklist note, as the widget draws it.
    struct List: Codable, Hashable, Sendable, Identifiable {
        var id: UUID
        var title: String
        var items: [ChecklistLine]
        var updatedAt: Date
        var pinned = false

        var open: Int { items.filter { !$0.done }.count }
    }

    /// Any note, as the widget draws one without a checklist: its title and first lines, read as
    /// text (Emil, 4 November 2026: "maybe you want to just have a note that you often write down").
    struct Preview: Codable, Hashable, Sendable, Identifiable {
        var id: UUID
        var title: String
        var lines: [String]
        var updatedAt: Date
    }

    /// A note the share sheet can add to.
    struct Recent: Codable, Hashable, Sendable, Identifiable {
        var id: UUID
        var title: String
        var updatedAt: Date
        /// Its folder and first line after the title, so a list of notes to pick from reads like
        /// the notes list (Emil, 4 November 2026: the share sheet's Add to showed titles only).
        var folder: String? = nil
        var snippet: String? = nil
    }

    /// A tick made in the widget. `done` is what it was set to (not a toggle), so applying it
    /// twice does no harm.
    struct Tick: Codable, Hashable, Sendable {
        var id = UUID()
        var note: UUID
        var index: Int
        var text: String
        var done: Bool
        var at = Date()
    }

    /// Lists kept for the widget, newest first; enough for anyone's checklists.
    static let listLimit = 200
    /// Items kept per list: the medium widget shows 7.
    static let itemLimit = 24
    /// Notes the share sheet can search by title: enough for an imported vault of a thousand
    /// notes and more (300 hid older notes, and the search then said no note had that name).
    static let recentLimit = 3000

    /// Tests point it at a temporary folder (unsigned test builds have no app group).
    nonisolated(unsafe) static var rootOverride: URL?

    static var root: URL? {
        if let rootOverride { return rootOverride }
        #if os(macOS)
        return nil
        #else
        return FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: AppIdentity.appGroup)?
            .appending(path: "Shelf", directoryHint: .isDirectory)
        #endif
    }

    private static func file(_ name: String) -> URL? { root?.appending(path: name) }

    private static func read<T: Decodable>(_ name: String, as: T.Type) -> T? {
        guard let url = file(name), let data = try? Data(contentsOf: url) else { return nil }
        let d = JSONDecoder()
        d.dateDecodingStrategy = .secondsSince1970
        return try? d.decode(T.self, from: data)
    }

    /// Writes only when it changed; says whether it did.
    @discardableResult
    private static func write<T: Encodable>(_ value: T, to name: String) -> Bool {
        guard let url = file(name) else { return false }
        let e = JSONEncoder()
        e.dateEncodingStrategy = .secondsSince1970
        e.outputFormatting = .sortedKeys
        guard let data = try? e.encode(value) else { return false }
        if let old = try? Data(contentsOf: url), old == data { return false }
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        return (try? data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])) != nil
    }

    // MARK: Lists (the app writes, the widget reads)

    static func lists() -> [List] { read("Lists.json", as: [List].self) ?? [] }

    /// Leaves the lists for the widget. True when they changed (the widget should redraw). Ticks
    /// still waiting for the app stay shown as made.
    @discardableResult
    static func saveLists(_ lists: [List]) -> Bool {
        var lists = lists
        for t in ticks() {
            guard let l = lists.firstIndex(where: { $0.id == t.note }),
                  let i = lists[l].items.firstIndex(where: { $0.index == t.index && $0.text == t.text }) ?? lists[l].items.firstIndex(where: { $0.text == t.text })
            else { continue }
            lists[l].items[i].done = t.done
        }
        return write(lists, to: "Lists.json")
    }

    static func list(_ id: UUID) -> List? { lists().first { $0.id == id } }

    /// The list a widget shows when none was picked: a pinned one, else the one changed last.
    static func defaultList(in lists: [List]) -> List? {
        lists.first(where: \.pinned) ?? lists.first
    }

    /// A list as the app leaves it: its items capped, open ones kept first so the widget has them.
    static func list(id: UUID, title: String, body: String, updatedAt: Date, pinned: Bool) -> List? {
        let items = Checklist.items(in: body)
        guard !items.isEmpty else { return nil }
        let open = items.filter { !$0.done }, done = items.filter(\.done)
        let kept = Array((open + done).prefix(itemLimit)).sorted { $0.index < $1.index }
        return List(id: id, title: title.isEmpty ? "New Note" : title, items: kept, updatedAt: updatedAt, pinned: pinned)
    }

    // MARK: Recent notes (the app writes, the share sheet reads)

    static func recents() -> [Recent] { read("Recent.json", as: [Recent].self) ?? [] }

    @discardableResult
    static func saveRecents(_ notes: [Recent]) -> Bool { write(Array(notes.prefix(recentLimit)), to: "Recent.json") }

    /// The share sheet's search: titles with every word typed, newest first.
    static func search(_ query: String, in notes: [Recent]) -> [Recent] {
        let words = query.lowercased().split(whereSeparator: \.isWhitespace)
        guard !words.isEmpty else { return notes }
        return notes.filter { n in words.allSatisfy { n.title.lowercased().contains($0) } }
    }

    // MARK: Note previews (the app writes, the widget reads)

    /// The newest notes kept as previews, so most picks show at once; a widget's other pick is
    /// asked for (`want`) and left the next time the app runs.
    static let previewLimit = 40
    /// Lines kept per preview: the medium widget shows about 6.
    static let previewLines = 8

    static func previews() -> [Preview] { read("Previews.json", as: [Preview].self) ?? [] }

    @discardableResult
    static func savePreviews(_ notes: [Preview]) -> Bool { write(notes, to: "Previews.json") }

    /// A note as the widget shows it: its lines after the title, blank ones left out.
    static func preview(id: UUID, title: String, readable: String, updatedAt: Date) -> Preview {
        let lines = readable.split(separator: "\n", omittingEmptySubsequences: true)
            .dropFirst().map { String($0).trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        return Preview(id: id, title: title.isEmpty ? "New Note" : title, lines: Array(lines.prefix(previewLines)), updatedAt: updatedAt)
    }

    /// Notes a widget was set to show that the app hasn't left a preview of yet.
    static func wanted() -> [UUID] { read("Wanted.json", as: [UUID].self) ?? [] }

    /// The widget asks for a note it has nothing for.
    static func want(_ id: UUID) {
        var w = wanted()
        guard !w.contains(id) else { return }
        w.append(id)
        write(Array(w.suffix(20)), to: "Wanted.json")
    }

    // MARK: Ticks (the widget writes, the app applies)

    static func ticks() -> [Tick] { read("Ticks.json", as: [Tick].self) ?? [] }

    /// A tick from the widget: kept for the app, and shown at once in the list the widget reads.
    static func tick(note: UUID, index: Int, text: String, done: Bool) {
        var waiting = ticks()
        // A later tick of the same item replaces the earlier one.
        waiting.removeAll { $0.note == note && $0.index == index && $0.text == text }
        waiting.append(Tick(note: note, index: index, text: text, done: done))
        write(waiting, to: "Ticks.json")
        var all = lists()
        if let l = all.firstIndex(where: { $0.id == note }), let i = all[l].items.firstIndex(where: { $0.index == index && $0.text == text }) {
            all[l].items[i].done = done
            saveLists(all)
        }
    }

    /// Takes the waiting ticks away (the app has applied them).
    static func clearTicks(_ applied: [Tick]) {
        let ids = Set(applied.map(\.id))
        write(ticks().filter { !ids.contains($0.id) }, to: "Ticks.json")
    }
}
