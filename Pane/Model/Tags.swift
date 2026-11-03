import Foundation

/// Tags written in a note's text (`#work`, `#work/clients`), the way Obsidian and Bear write
/// them. The note keeps them as plain text, so sync, Markdown export and the AI tools see a normal
/// hashtag; the editor shows them in the accent colour, and a tag opens the list of every note
/// that has it (Scope.tag).
///
/// Obsidian's rules: a `#` at the start of a line or after a space or an opening mark like `(`,
/// then letters, digits, `_`, `-` and `/` (nested tags), with at least one letter or `_`. Not a
/// heading (`# Title`), not `#123`, not in code, links or web addresses, not in the title line.
enum Tags {
    struct Found: Equatable {
        /// The whole tag, `#` included.
        var range: NSRange
        /// The name, without the `#` ("work/clients").
        var name: String
    }

    /// One tag across the notes: its name as most notes write it, and how many notes list it
    /// (those with the tag or one nested under it, as its list shows them).
    struct Entry: Equatable, Hashable {
        var name: String
        var count: Int
    }

    /// Characters a tag's name is made of.
    private static let nameChars = #"[\p{L}\p{M}\p{N}_\-/]"#
    /// What may come right before the `#`: the start, a space, or an opening mark.
    private static let lead = #"(?<![^\s(,;"“‘'*~])"#
    private static let regex = try! NSRegularExpression(pattern: lead + "#([\\p{L}\\p{M}\\p{N}_]" + nameChars + "*)")

    /// Places tags never are: fenced code, inline code, links' addresses, wiki links, web addresses.
    private static let inlineCode = try! NSRegularExpression(pattern: #"``[^\n]*?``|`[^`\n]*`"#)
    private static let linkTarget = try! NSRegularExpression(pattern: #"\]\([^)\n]*\)|\[\[[^\]\n]*\]\]|<[^>\s]+>|\b[A-Za-z][A-Za-z0-9+.\-]*://\S+"#)

    /// Every tag in `text` (or in `range` of it, whole lines), in order.
    /// `blocks`: leave out code blocks and the title line, read from the whole text. The editor
    /// passes false: its styler knows those from its own parse.
    static func find(in text: String, range: NSRange? = nil, blocks: Bool = true) -> [Found] {
        let ns = text as NSString
        let scope = range ?? NSRange(location: 0, length: ns.length)
        guard scope.length > 1, ns.range(of: "#", options: [], range: scope).location != NSNotFound else { return [] }
        let skip = excluded(in: text, scope: scope, blocks: blocks)
        return regex.matches(in: text, range: scope).compactMap { m in
            var name = ns.substring(with: m.range(at: 1))
            while name.hasSuffix("/") { name.removeLast() }
            guard name.contains(where: { $0.isLetter || $0 == "_" }) else { return nil }
            let r = NSRange(location: m.range.location, length: (name as NSString).length + 1)
            if skip.contains(where: { NSIntersectionRange($0, r).length > 0 }) { return nil }
            return Found(range: r, name: name)
        }
    }

    /// A note's tags, each once (the first way it's written), in order.
    static func names(in text: String) -> [String] {
        var seen = Set<String>()
        return find(in: text).map(\.name).filter { seen.insert($0.lowercased()).inserted }
    }

    /// Whether a tag lists under `query`: the same tag (in any case) or one nested under it, so
    /// `#work` lists notes tagged `#work/clients` too, as in Obsidian.
    static func matches(_ tag: String, _ query: String) -> Bool {
        let t = tag.lowercased(), q = query.lowercased()
        return t == q || t.hasPrefix(q + "/")
    }

    /// Whether a note's text has `tag` (or one nested under it).
    static func has(_ tag: String, in text: String) -> Bool {
        text.localizedStandardContains("#" + tag) && find(in: text).contains { matches($0.name, tag) }
    }

    /// Each tag in the notes, given each note's tags, with how many notes list it, by name.
    static func collect(_ notes: [[String]]) -> [Entry] {
        var counts: [String: Int] = [:]
        // Each way a tag is written, and how often: the most common shows.
        var spellings: [String: [String: Int]] = [:]
        for tags in notes {
            var listed = Set<String>()
            for tag in tags {
                let key = tag.lowercased()
                spellings[key, default: [:]][tag, default: 0] += 1
                // The tag and every tag it's nested under list this note.
                var parts = key.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
                while !parts.isEmpty {
                    listed.insert(parts.joined(separator: "/"))
                    parts.removeLast()
                }
            }
            for key in listed { counts[key, default: 0] += 1 }
        }
        return spellings.map { key, ways in
            let name = ways.max { a, b in a.value != b.value ? a.value < b.value : a.key > b.key }!.key
            return Entry(name: name, count: counts[key] ?? 0)
        }
        .sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
    }

    /// The tag being typed right before the caret (`#wo|`): the part after the `#`. At least one
    /// character, so a `#` typed for a heading (`# Title`) never brings the list up.
    static func typingQuery(in text: String, caret: Int) -> NSRange? {
        let ns = text as NSString
        guard caret > 1, caret <= ns.length else { return nil }
        // The caret ends the word: not in the middle of a tag.
        if caret < ns.length, let next = Unicode.Scalar(ns.character(at: caret)), isNameChar(next) { return nil }
        let line = ns.lineRange(for: NSRange(location: caret - 1, length: 0))
        var i = caret
        while i > line.location, let c = Unicode.Scalar(ns.character(at: i - 1)), isNameChar(c) { i -= 1 }
        guard i > line.location, i < caret, ns.character(at: i - 1) == 0x23 else { return nil }
        let typed = NSRange(location: i, length: caret - i)
        guard let tag = find(in: text, range: line).first(where: { $0.range.location == i - 1 }),
              (tag.name as NSString).length >= typed.length else { return nil }
        return typed
    }

    /// Tags for what's typed after a `#`, best first: those that start with it, then those with a
    /// part that does (`cli` finds `work/clients`). Not the one already typed in full.
    static func suggestions(_ typed: String, from entries: [Entry], limit: Int = 6) -> [String] {
        let q = typed.lowercased()
        guard !q.isEmpty else { return [] }
        let others = entries.filter { $0.name.lowercased() != q }
        let starts = others.filter { $0.name.lowercased().hasPrefix(q) }
        let parts = others.filter { e in
            !e.name.lowercased().hasPrefix(q) && e.name.lowercased().split(separator: "/").contains { $0.hasPrefix(q) }
        }
        func byUse(_ a: Entry, _ b: Entry) -> Bool { a.count != b.count ? a.count > b.count : a.name.localizedStandardCompare(b.name) == .orderedAscending }
        return Array((starts.sorted(by: byUse) + parts.sorted(by: byUse)).prefix(limit).map(\.name))
    }

    private static func isNameChar(_ c: Unicode.Scalar) -> Bool {
        CharacterSet.letters.contains(c) || CharacterSet.decimalDigits.contains(c) || CharacterSet.nonBaseCharacters.contains(c) || c == "_" || c == "-" || c == "/"
    }

    /// Code, links' addresses and the note's title line: never tags.
    private static func excluded(in text: String, scope: NSRange, blocks: Bool) -> [NSRange] {
        let ns = text as NSString
        var out = inlineCode.matches(in: text, range: scope).map(\.range) + linkTarget.matches(in: text, range: scope).map(\.range)
        guard blocks else { return out }
        var fence: NSRange?
        var sawTitle = false
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byLines, .substringNotRequired]) { _, line, _, _ in
            let trimmed = ns.substring(with: line).trimmingCharacters(in: .whitespaces)
            let isFence = trimmed.hasPrefix("```") || trimmed.hasPrefix("~~~")
            if let open = fence {
                if isFence { out.append(NSRange(location: open.location, length: NSMaxRange(line) - open.location)); fence = nil }
                return
            }
            if isFence { fence = line; sawTitle = true; return }
            if !sawTitle, !trimmed.isEmpty {
                sawTitle = true
                // The first plain line is the note's title (MarkdownStyler): a line that starts
                // with a `#`, `>` or a list marker isn't one.
                let plain = !trimmed.hasPrefix("#") && !trimmed.hasPrefix(">") && !trimmed.hasPrefix("<") && ListPrefix(line: ns.substring(with: line)) == nil
                if plain { out.append(line) }
            }
        }
        if let open = fence { out.append(NSRange(location: open.location, length: ns.length - open.location)) }
        return out
    }
}
