import Foundation

/// One command of the `/` menu: type `/` at the start of a line or after a space, then pick what
/// the line becomes or what goes in (Notion's habit). Each runs what the Format menu runs.
enum SlashCommand: String, CaseIterable, Identifiable, Sendable {
    case title, heading, subheading, body
    case checklist, bulleted, dashed, numbered, quote, callout, codeBlock, highlight
    case table, divider, date, link, noteLink, attach

    var id: String { rawValue }

    /// What the row says, in sentence case.
    var name: String {
        switch self {
        case .title: "Title"
        case .heading: "Heading"
        case .subheading: "Subheading"
        case .body: "Body"
        case .checklist: "Checklist"
        case .bulleted: "Bulleted List"
        case .dashed: "Dashed List"
        case .numbered: "Numbered List"
        case .quote: "Block Quote"
        case .callout: "Callout"
        case .highlight: "Highlight"
        case .codeBlock: "Code Block"
        case .table: "Table"
        case .divider: "Divider"
        case .date: "Date"
        case .link: "Link"
        case .noteLink: "Link to Note"
        case .attach: "Attach File"
        }
    }

    /// The row's SF Symbol (the same glyphs as the Format panel and the keyboard bar).
    var symbol: String {
        switch self {
        case .title: "textformat.size.larger"
        case .heading: "textformat.size"
        case .subheading: "textformat.size.smaller"
        case .body: "text.alignleft"
        case .checklist: "checklist"
        case .bulleted: "list.bullet"
        case .dashed: "list.dash"
        case .numbered: "list.number"
        case .quote: "text.quote"
        case .callout: "info.square"
        case .highlight: "highlighter"
        case .codeBlock: "chevron.left.forwardslash.chevron.right"
        case .table: "tablecells"
        case .divider: "minus"
        case .date: "calendar"
        case .link: "link"
        case .noteLink: "doc.text"
        case .attach: "paperclip"
        }
    }

    /// Other words that find it: Markdown and Notion habits ("h1", "todo", "hr").
    var aliases: [String] {
        switch self {
        case .title: ["h1", "heading 1"]
        case .heading: ["h2", "heading 2"]
        case .subheading: ["h3", "heading 3"]
        case .body: ["text", "plain", "paragraph", "normal"]
        case .checklist: ["todo", "to-do", "task", "checkbox", "tick"]
        case .bulleted: ["bullet", "ul", "unordered"]
        case .dashed: ["dash"]
        case .numbered: ["number", "ol", "ordered"]
        case .quote: ["blockquote"]
        // Every type's name, so `/warning` finds it and inserts that type (Callouts.kind(typed:)).
        case .callout: ["note", "info", "tip", "success", "question", "warning", "danger", "bug", "example", "quote", "error", "caution", "hint", "faq", "admonition", "box"]
        case .highlight: ["marker", "mark", "yellow"]
        case .codeBlock: ["monostyled", "pre", "snippet", "fence"]
        case .table: ["grid", "columns"]
        case .divider: ["hr", "line", "rule", "separator"]
        case .date: ["today", "day", "now"]
        case .link: ["url", "web"]
        case .noteLink: ["wiki", "page", "mention", "backlink", "[["]
        case .attach: ["file", "image", "photo", "upload"]
        }
    }

    /// The Format menu's shortcut, shown dimmed on the Mac like a menu's.
    var shortcut: String? {
        switch self {
        case .title: "\u{21E7}\u{2318}T"
        case .heading: "\u{21E7}\u{2318}H"
        case .subheading: "\u{21E7}\u{2318}J"
        case .body: "\u{21E7}\u{2318}B"
        case .checklist: "\u{21E7}\u{2318}L"
        case .bulleted: "\u{21E7}\u{2318}7"
        case .dashed: "\u{21E7}\u{2318}8"
        case .numbered: "\u{21E7}\u{2318}9"
        case .quote: "\u{2318}'"
        case .highlight: "\u{21E7}\u{2318}E"
        case .table: "\u{2325}\u{2318}T"
        case .date: "\u{21E7}\u{2318}D"
        case .link: "\u{2318}K"
        case .attach: "\u{21E7}\u{2318}A"
        case .codeBlock, .divider, .callout, .noteLink: nil
        }
    }

    /// The commands this device offers, in menu order. Attaching a file from the menu is the Mac's
    /// (the iPhone has its paperclip in the keyboard bar).
    static var available: [SlashCommand] {
        #if os(macOS)
        allCases
        #else
        allCases.filter { $0 != .attach }
        #endif
    }
}

/// Finding the `/query` being typed and the commands it names. Pure, so it's tested on its own.
enum SlashCommands {
    /// The longest query looked at: past this it's a sentence, not a command.
    static let maxQuery = 24

    /// The `/query` the caret is at the end of (the slash included), or nil. The slash starts a
    /// line or follows a space; never in a code block, inline code, a URL (`https://`) or a table row.
    static func query(in text: String, caret: Int) -> NSRange? {
        let ns = text as NSString
        guard caret >= 1, caret <= ns.length else { return nil }
        var start = 0, end = 0, contentsEnd = 0
        ns.getLineStart(&start, end: &end, contentsEnd: &contentsEnd, for: NSRange(location: caret, length: 0))
        // A caret just past a line break is on the next line, which has no slash before it yet.
        if caret < start || caret > contentsEnd { return nil }
        let from = max(start, caret - maxQuery - 1)
        let before = ns.substring(with: NSRange(location: from, length: caret - from)) as NSString
        let slash = before.range(of: "/", options: .backwards)
        guard slash.location != NSNotFound else { return nil }
        let at = from + slash.location
        let typed = ns.substring(with: NSRange(location: at + 1, length: caret - at - 1))
        // `/ ` closes it; so does a second word that names nothing (checked with the matches).
        if typed.hasPrefix(" ") || typed.contains("\t") { return nil }
        if at > start {
            let prev = ns.character(at: at - 1)
            guard prev == 0x20 || prev == 0x09 else { return nil }
        }
        let line = ns.substring(with: NSRange(location: start, length: at - start))
        if line.trimmingCharacters(in: .whitespaces).hasPrefix("|") { return nil }
        // Inside `inline code`: an odd number of backticks before it on the line.
        if line.filter({ $0 == "`" }).count % 2 == 1 { return nil }
        if ListEditing.codeBlock(in: ns, at: at) != nil { return nil }
        return NSRange(location: at, length: caret - at)
    }

    /// The commands `typed` (the text after the slash) names, best first: names that start with
    /// it, then names with a word that does, then aliases; with none of those, names with its
    /// letters in order ("chk" finds Checklist, as Notion's menu doesn't). Ties go to the ones used last (`recent`),
    /// then the menu's order. With nothing typed, the recent ones lead (council round 12: Emil
    /// wants / to be how you format on the Mac).
    static func matches(_ typed: String, in commands: [SlashCommand] = SlashCommand.available, recent: [SlashCommand] = []) -> [SlashCommand] {
        let q = typed.lowercased().trimmingCharacters(in: .whitespaces)
        func rank(_ c: SlashCommand) -> Int { recent.firstIndex(of: c) ?? recent.count }
        guard !q.isEmpty else {
            return commands.enumerated().sorted { (rank($0.element), $0.offset) < (rank($1.element), $1.offset) }.map(\.element)
        }
        func score(_ c: SlashCommand) -> Int? {
            let name = c.name.lowercased()
            if name.hasPrefix(q) { return 0 }
            if name.split(separator: " ").contains(where: { $0.hasPrefix(q) }) { return 1 }
            if c.aliases.contains(where: { $0.hasPrefix(q) }) { return 2 }
            return nil
        }
        let found = commands.enumerated()
            .compactMap { i, c in score(c).map { (s: $0, r: rank(c), i: i, c: c) } }
            .sorted { ($0.s, $0.r, $0.i) < ($1.s, $1.r, $1.i) }
            .map(\.c)
        // Letters in order only when nothing starts with them, so they help a shorthand and
        // never crowd a real match ("line" is Divider, not also Link to note).
        guard found.isEmpty, q.count >= 2 else { return found }
        return commands.enumerated()
            .filter { inOrder(q, in: $0.element.name.lowercased()) }
            .sorted { (rank($0.element), $0.offset) < (rank($1.element), $1.offset) }
            .map(\.element)
    }

    /// Whether every letter of `q` is in `name`, in order, starting with its first letter.
    static func inOrder(_ q: String, in name: String) -> Bool {
        guard let first = q.first, name.first == first else { return false }
        var rest = Substring(name)
        for ch in q {
            guard let i = rest.firstIndex(of: ch) else { return false }
            rest = rest[rest.index(after: i)...]
        }
        return true
    }

    /// What the menu shows for the text and caret: where the `/query` is and the commands it
    /// names. Nil when there's nothing to show (no query, or a space after a query that names
    /// nothing: the slash was just a slash).
    static func active(in text: String, selection: NSRange, commands: [SlashCommand] = SlashCommand.available, recent: [SlashCommand] = []) -> (query: NSRange, commands: [SlashCommand])? {
        guard selection.length == 0, let q = query(in: text, caret: selection.location) else { return nil }
        let typed = (text as NSString).substring(with: NSRange(location: q.location + 1, length: q.length - 1))
        let found = matches(typed, in: commands, recent: recent)
        guard !found.isEmpty else { return nil }
        return (q, found)
    }
}

/// The commands used last, newest first, so the menu offers them first (three, as Notion's
/// "Recently used" does). Kept on this device.
enum SlashRecents {
    static let key = "slashRecent"
    static let limit = 3
    nonisolated(unsafe) static var defaults: UserDefaults = .standard

    static var commands: [SlashCommand] {
        (defaults.stringArray(forKey: key) ?? []).compactMap(SlashCommand.init(rawValue:))
    }

    static func used(_ c: SlashCommand) {
        defaults.set(Array(([c] + commands.filter { $0 != c }).prefix(limit)).map(\.rawValue), forKey: key)
        defaults.set(uses + 1, forKey: usesKey)
    }

    /// How many times a command has been run from the menu here; the "Type /" hint stops once
    /// it's been learned (council round 14).
    static let usesKey = "slashUses"
    static let learned = 5
    static var uses: Int { defaults.integer(forKey: usesKey) }

    static func clear() { defaults.removeObject(forKey: key); defaults.removeObject(forKey: usesKey) }
}
