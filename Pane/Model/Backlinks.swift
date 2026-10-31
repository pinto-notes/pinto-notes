import Foundation
import SwiftData

/// Where every note links, with the lookups the other way kept beside it: which notes have a link
/// by a name, and which name a note by its id. "Linked from" reads the few notes that can link to
/// a note instead of resolving every link in the library (at 20,000 notes, tens of thousands of
/// links each time a note opened). Kept note by note as notes are saved.
struct LinkGraph: Sendable {
    private(set) var links: [UUID: OutgoingLinks] = [:]
    private var byName: [String: Set<UUID>] = [:]
    private var byNote: [UUID: Set<UUID>] = [:]

    init(_ links: [UUID: OutgoingLinks] = [:]) {
        for (id, l) in links { self[id] = l }
    }

    var count: Int { links.count }

    subscript(id: UUID) -> OutgoingLinks? {
        get { links[id] }
        set {
            let old = links[id]
            // Most saves are typing that doesn't touch a link.
            guard old != newValue else { return }
            if let old {
                for k in old.names { byName[k]?.remove(id); if byName[k]?.isEmpty == true { byName[k] = nil } }
                for n in old.noteLinks { byNote[n]?.remove(id); if byNote[n]?.isEmpty == true { byNote[n] = nil } }
            }
            links[id] = newValue
            if let new = newValue {
                for k in new.names { byName[k, default: []].insert(id) }
                for n in new.noteLinks { byNote[n, default: []].insert(id) }
            }
        }
    }

    /// Notes with a wiki link whose name (or whole target) has this key (`WikiLinks.key`).
    func linking(named key: String) -> Set<UUID> { byName[key] ?? [] }
    /// Notes with a note link to `id`.
    func linking(note id: UUID) -> Set<UUID> { byNote[id] ?? [] }
}

/// One line of a note as it reads, for "Linked from" and "Unlinked mentions": markdown out of
/// sight, links shown as their text, and the link (or the mention) marked.
struct LinkLine: Equatable, Hashable, Sendable, Identifiable {
    var text: String
    /// What's marked, in `text`.
    var marks: [NSRange]
    /// Where the first mark is in the note's text: opening the note goes there.
    var location: Int
    /// What's marked, in the note's text (mentions: what "Link" turns into a link).
    var spots: [NSRange]
    var id: Int { location }
}

/// A note that links to (or mentions) another, with the lines it does it on.
struct LinkingNote: Identifiable, Equatable, Sendable {
    var id: UUID
    var title: String
    var folders: [String]
    var updated: Date
    var lines: [LinkLine]
}

enum LinkSnippets {
    /// Longer lines are cut around the mark.
    static let maxLength = 160
    /// A note shows at most this many of its lines.
    static let maxLines = 5

    nonisolated(unsafe) private static let prefix = try! NSRegularExpression(pattern: #"^\s*(?:>\s*)*(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)?"#)
    nonisolated(unsafe) private static let markdownLink = try! NSRegularExpression(pattern: #"!?\[([^\]\n]*)\]\(([^)\n]*)\)"#)
    nonisolated(unsafe) private static let markers = try! NSRegularExpression(pattern: #"\*\*|__|~~|==|`"#)

    /// The lines of `body` that hold `spots`, one entry each, in order, up to `maxLines`.
    static func lines(_ body: String, spots: [NSRange]) -> [LinkLine] {
        let ns = body as NSString
        var out: [LinkLine] = []
        var byLine: [(line: NSRange, spots: [NSRange])] = []
        for s in spots.sorted(by: { $0.location < $1.location }) where NSMaxRange(s) <= ns.length {
            let line = ns.lineRange(for: NSRange(location: s.location, length: 0))
            if let last = byLine.last, last.line == line { byLine[byLine.count - 1].spots.append(s) } else { byLine.append((line, [s])) }
        }
        for (line, s) in byLine.prefix(maxLines) { out.append(self.line(ns, lineRange: line, spots: s)) }
        return out
    }

    /// One line as plain text, `spots` (ranges in the note's text, on that line) marked.
    static func line(_ body: NSString, lineRange: NSRange, spots: [NSRange]) -> LinkLine {
        var range = lineRange
        while range.length > 0, let c = Unicode.Scalar(body.character(at: NSMaxRange(range) - 1)), CharacterSet.newlines.contains(c) { range.length -= 1 }
        let raw = body.substring(with: range)
        let rawNS = raw as NSString
        let local = spots.map { NSRange(location: $0.location - range.location, length: $0.length) }
        struct Edit { var range: NSRange; var with: String; var link: Bool }
        var edits: [Edit] = []
        func free(_ r: NSRange) -> Bool { !edits.contains { NSIntersectionRange($0.range, r).length > 0 || ($0.range.location == r.location && r.length == 0) } }
        if let m = prefix.firstMatch(in: raw, range: NSRange(location: 0, length: rawNS.length)), m.range.length > 0 {
            edits.append(Edit(range: m.range, with: "", link: false))
        }
        for link in WikiLinks.links(in: raw) where free(link.range) {
            edits.append(Edit(range: link.range, with: WikiLinks.display(link), link: true))
        }
        for m in markdownLink.matches(in: raw, range: NSRange(location: 0, length: rawNS.length)) where free(m.range) {
            edits.append(Edit(range: m.range, with: rawNS.substring(with: m.range(at: 1)), link: true))
        }
        for m in markers.matches(in: raw, range: NSRange(location: 0, length: rawNS.length)) where free(m.range) {
            edits.append(Edit(range: m.range, with: "", link: false))
        }
        edits.sort { $0.range.location < $1.range.location }

        // The text with the edits made, and where each place in the line ends up.
        let out = NSMutableString()
        var at = 0
        var starts: [(raw: Int, out: Int, edit: Edit?)] = []
        for e in edits {
            if e.range.location > at {
                starts.append((at, out.length, nil))
                out.append(rawNS.substring(with: NSRange(location: at, length: e.range.location - at)))
            }
            starts.append((e.range.location, out.length, e))
            out.append(e.with)
            at = NSMaxRange(e.range)
        }
        if at < rawNS.length {
            starts.append((at, out.length, nil))
            out.append(rawNS.substring(from: at))
        }
        func map(_ p: Int) -> Int {
            guard let s = starts.last(where: { $0.raw <= p }) else { return 0 }
            if let e = s.edit { return s.out + (p >= NSMaxRange(e.range) ? (e.with as NSString).length : 0) }
            return s.out + (p - s.raw)
        }
        var marks: [NSRange] = []
        for s in local {
            // A mark on a link marks the link's text, all of it.
            if let e = edits.first(where: { $0.link && NSIntersectionRange($0.range, s).length > 0 }) {
                let start = map(e.range.location)
                marks.append(NSRange(location: start, length: (e.with as NSString).length))
            } else {
                let a = map(s.location), b = map(NSMaxRange(s))
                if b > a { marks.append(NSRange(location: a, length: b - a)) }
            }
        }
        var text = out as String
        // Spaces at the ends go; a long line is cut around its first mark.
        let lead = (text as NSString).length - (text.drop { $0 == " " || $0 == "\t" } as Substring).utf16.count
        if lead > 0 { text = String(text.dropFirst(lead)); marks = marks.map { NSRange(location: max(0, $0.location - lead), length: $0.length) } }
        while text.last == " " || text.last == "\t" { text.removeLast() }
        let length = (text as NSString).length
        if length > maxLength {
            let first = marks.first?.location ?? 0
            var start = max(0, min(first - 40, length - maxLength))
            let tns = text as NSString
            // At a word's start.
            if start > 0 {
                let space = tns.rangeOfCharacter(from: .whitespaces, options: [], range: NSRange(location: start, length: min(20, length - start)))
                if space.location != NSNotFound { start = space.location + 1 }
            }
            let end = min(length, start + maxLength)
            var cut = tns.substring(with: NSRange(location: start, length: end - start))
            var shift = -start
            if start > 0 { cut = "\u{2026}" + cut; shift += 1 }
            if end < length { cut += "\u{2026}" }
            let cutLength = (cut as NSString).length
            marks = marks.compactMap {
                let loc = $0.location + shift
                let r = NSIntersectionRange(NSRange(location: loc, length: $0.length), NSRange(location: 0, length: cutLength))
                return r.length > 0 ? r : nil
            }
            text = cut
        }
        return LinkLine(text: text, marks: marks, location: spots.first?.location ?? range.location, spots: spots)
    }
}

/// A note's title (or one of its aliases) in another note's text as words of their own, not
/// as a link: what "Unlinked mentions" lists, and "Link" turns into a link.
enum Mentions {
    /// Names shorter than this aren't looked for: every note would mention "AI".
    static let shortest = 3

    nonisolated(unsafe) private static let markdownLink = try! NSRegularExpression(pattern: #"!?\[[^\]\n]*\]\([^)\n]*\)"#)
    nonisolated(unsafe) private static let inlineCode = try! NSRegularExpression(pattern: #"(`+)(?:(?!\1).)+?\1"#)
    nonisolated(unsafe) private static let url = try! NSRegularExpression(pattern: #"[a-zA-Z][a-zA-Z0-9+.-]*://\S+|pane-note:\S+"#)

    /// The names a note is mentioned by: its title and the aliases its front matter gives it.
    static func names(title: String, frontMatter: String?) -> [String] {
        var out: [String] = []
        var seen = Set<String>()
        let aliases = frontMatter.map { MarkdownNote.frontMatter($0.components(separatedBy: "\n")) }.map { ($0["aliases"] ?? []) + ($0["alias"] ?? []) } ?? []
        for n in [title] + aliases {
            let name = n.trimmingCharacters(in: .whitespaces)
            let key = WikiLinks.key(name)
            guard key.count >= shortest, key != "new note", seen.insert(key).inserted else { continue }
            out.append(name)
        }
        return out
    }

    /// Where `body` mentions any of `names` as words of their own, case and accents aside: not in
    /// a link, code or an address, and not on its first line (its title). Longer names first.
    static func find(_ names: [String], in body: String) -> [NSRange] {
        let ns = body as NSString
        guard ns.length > 0, !names.isEmpty else { return [] }
        let all = NSRange(location: 0, length: ns.length)
        var off: [NSRange] = [ns.lineRange(for: NSRange(location: 0, length: 0))]
        off += WikiLinks.allLinkRanges(in: body)
        off += markdownLink.matches(in: body, range: all).map(\.range)
        off += inlineCode.matches(in: body, range: all).map(\.range)
        off += url.matches(in: body, range: all).map(\.range)
        off += WikiLinks.fencedCode(in: body)
        var found: [NSRange] = []
        for name in names.sorted(by: { $0.count > $1.count }) {
            var from = 0
            while from < ns.length {
                let r = ns.range(of: name, options: [.caseInsensitive, .diacriticInsensitive], range: NSRange(location: from, length: ns.length - from))
                guard r.location != NSNotFound, r.length > 0 else { break }
                from = NSMaxRange(r)
                if r.location > 0, isWordCharacter(ns.character(at: r.location - 1)) { continue }
                if NSMaxRange(r) < ns.length, isWordCharacter(ns.character(at: NSMaxRange(r))) { continue }
                if off.contains(where: { NSIntersectionRange($0, r).length > 0 }) { continue }
                if found.contains(where: { NSIntersectionRange($0, r).length > 0 }) { continue }
                found.append(r)
            }
        }
        return found.sorted { $0.location < $1.location }
    }

    private static func isWordCharacter(_ c: unichar) -> Bool {
        guard let s = Unicode.Scalar(c) else { return true }
        return CharacterSet.alphanumerics.contains(s) || c == 0x5F
    }

    /// The notes that mention one of `names` without linking, newest first, read on a context of
    /// its own (off the main thread): at most `limit`, and whether there were more.
    nonisolated static func search(_ names: [String], excluding id: UUID, container: ModelContainer, limit: Int = 200) -> (notes: [LinkingNote], more: Bool) {
        guard !names.isEmpty else { return ([], false) }
        let context = ModelContext(container)
        var hits: [UUID: Note] = [:]
        for name in names {
            // The store narrows it down; whole words, links and code are told apart here.
            let predicate = #Predicate<Note> { n in n.body.localizedStandardContains(name) }
            for n in (try? context.fetch(FetchDescriptor<Note>(predicate: predicate))) ?? []
            where n.id != id && n.deletedAt == nil && n.trashedAt == nil && n.lockedBody == nil { hits[n.id] = n }
        }
        var paths: [UUID: [String]] = [:]
        func path(_ f: Folder?) -> [String] {
            guard let f else { return [] }
            if let p = paths[f.id] { return p }
            var parts: [String] = [], seen = Set<UUID>(), at: Folder? = f
            while let x = at, seen.insert(x.id).inserted { parts.insert(x.name, at: 0); at = x.parent }
            paths[f.id] = parts
            return parts
        }
        var out: [LinkingNote] = []
        for n in hits.values.sorted(by: { $0.updatedAt > $1.updatedAt }) {
            let spots = find(names, in: n.body)
            guard !spots.isEmpty else { continue }
            if out.count == limit { return (out, true) }
            out.append(LinkingNote(id: n.id, title: n.summaryTitle ?? NoteText.head(of: n.body).title, folders: path(n.folder), updated: n.updatedAt,
                                   lines: LinkSnippets.lines(n.body, spots: spots)))
        }
        return (out, false)
    }
}

extension WikiLinks {
    /// Where every `[[…]]` is, code or not (a mention inside one is never a mention).
    static func allLinkRanges(in text: String) -> [NSRange] {
        guard text.contains("[[") else { return [] }
        let ns = text as NSString
        return anyLink.matches(in: text, range: NSRange(location: 0, length: ns.length)).map(\.range)
    }
    nonisolated(unsafe) private static let anyLink = try! NSRegularExpression(pattern: #"!?\[\[[^\[\]\n]*\]\]"#)

    /// Fenced code blocks, fences and all.
    static func fencedCode(in text: String) -> [NSRange] {
        guard text.contains("```") || text.contains("~~~") else { return [] }
        let ns = text as NSString
        var out: [NSRange] = []
        var open: (fence: String, at: Int)?
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byLines, .substringNotRequired]) { _, line, enclosing, _ in
            let s = ns.substring(with: line).trimmingCharacters(in: .whitespaces)
            if let o = open {
                if s.hasPrefix(o.fence) { out.append(NSRange(location: o.at, length: NSMaxRange(enclosing) - o.at)); open = nil }
            } else if s.hasPrefix("```") { open = ("```", line.location) } else if s.hasPrefix("~~~") { open = ("~~~", line.location) }
        }
        if let o = open { out.append(NSRange(location: o.at, length: ns.length - o.at)) }
        return out
    }

    /// The headings of a note's text, in order, outside code: what `[[Note#` offers.
    static func headings(in body: String) -> [String] {
        guard body.contains("#") else { return [] }
        let code = fencedCode(in: body)
        var out: [String] = []
        var location = 0
        for (i, line) in body.components(separatedBy: "\n").enumerated() {
            defer { location += (line as NSString).length + 1 }
            // The first line is the note's title, whatever it's written as.
            guard i > 0, line.hasPrefix("#"), let m = line.range(of: #"^#{1,6}\s+"#, options: .regularExpression) else { continue }
            if code.contains(where: { NSLocationInRange(location, $0) }) { continue }
            let h = String(line[m.upperBound...]).trimmingCharacters(in: CharacterSet(charactersIn: "# "))
            if !h.isEmpty { out.append(h) }
        }
        return out
    }

    /// While a heading is being typed after `[[Note#`: the note part as written, and where the
    /// typed part of the heading is.
    static func typingHeading(in text: String, caret: Int) -> (target: String, query: NSRange)? {
        let ns = text as NSString
        guard caret >= 3, caret <= ns.length else { return nil }
        let line = ns.lineRange(for: NSRange(location: caret, length: 0))
        let start = max(line.location, caret - 160)
        let before = ns.substring(with: NSRange(location: start, length: caret - start))
        guard let open = before.range(of: "[[", options: .backwards) else { return nil }
        let typed = before[open.upperBound...]
        guard let hash = typed.firstIndex(of: "#"), !typed.contains(where: { "[]|\n".contains($0) }) else { return nil }
        let target = String(typed[..<hash]).trimmingCharacters(in: .whitespaces)
        let heading = typed[typed.index(after: hash)...]
        guard !target.isEmpty, !heading.contains("#") else { return nil }
        let at = caret - heading.utf16.count
        return (target, NSRange(location: at, length: caret - at))
    }
}

@MainActor
extension ModelContext {
    /// The notes that link to `note`, newest first, each with the lines it links on (the link
    /// marked): what "Linked from" shows. `limit` notes get their lines; `total` counts them all.
    func linkingNotes(to note: Note, limit: Int = 20) -> (notes: [LinkingNote], total: Int) {
        linkingNotes(backlinkIDs(to: note), to: note, limit: limit)
    }

    /// The same for the notes already found to link here (`backlinkIDs(to:)`, newest first):
    /// only the first `limit` are read.
    func linkingNotes(_ ids: [UUID], to note: Note, limit: Int = 20) -> (notes: [LinkingNote], total: Int) {
        guard !ids.isEmpty, let index = WikiDirectory.ready(self) else { return ([], 0) }
        let first = Array(ids.prefix(limit))
        let read = (try? fetch(FetchDescriptor<Note>(predicate: #Predicate { first.contains($0.id) }))) ?? []
        let byID = Dictionary(read.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        let found = first.compactMap { byID[$0] }.filter { $0.deletedAt == nil && $0.trashedAt == nil && !$0.isLocked }
        let id = note.id
        let noteLink = "pane-note:\(id.uuidString)"
        var out: [LinkingNote] = []
        for other in found {
            let body = other.body
            let from = folderPath(other.folder)
            var spots = WikiLinks.links(in: body).filter { index.resolve($0.target, from: from) == id }.map(\.range)
            if body.range(of: "pane-note:", options: .caseInsensitive) != nil {
                spots += Self.noteLinkSpots(in: body, link: noteLink)
            }
            out.append(LinkingNote(id: other.id, title: other.title, folders: from, updated: other.updatedAt, lines: LinkSnippets.lines(body, spots: spots)))
        }
        return (out, ids.count)
    }

    /// Where a note link (`[text](pane-note:…)`, or the bare address) names `link`, case aside.
    private static func noteLinkSpots(in body: String, link: String) -> [NSRange] {
        let ns = body as NSString
        var out: [NSRange] = []
        var from = 0
        while from < ns.length {
            let r = ns.range(of: link, options: .caseInsensitive, range: NSRange(location: from, length: ns.length - from))
            guard r.location != NSNotFound else { break }
            from = NSMaxRange(r)
            // The whole `[text](…)` when it's in one.
            let line = ns.lineRange(for: r)
            let before = ns.substring(with: NSRange(location: line.location, length: r.location - line.location))
            if before.hasSuffix("("), let close = before.dropLast().lastIndex(of: "]"), let open = before[..<close].lastIndex(of: "[") {
                var start = line.location + before.utf16.distance(from: before.startIndex, to: open)
                // An embed's `!` with it.
                if start > line.location, ns.character(at: start - 1) == 0x21 { start -= 1 }
                let end = NSMaxRange(r) < ns.length && ns.character(at: NSMaxRange(r)) == 0x29 ? NSMaxRange(r) + 1 : NSMaxRange(r)
                out.append(NSRange(location: start, length: end - start))
            } else {
                out.append(r)
            }
        }
        return out
    }

    /// The link a mention of `note` in `other` becomes: `[[Title]]` when it's written as the
    /// title, `[[Title|as written]]` otherwise (an alias, other capitals), with the folders in
    /// front when the title alone would lead to another note from where `other` is.
    func mentionLink(to note: Note, from other: Note, written: String) -> String {
        let title = note.title
        let from = folderPath(other.folder)
        let index = WikiDirectory.index(self)
        var target = title
        if index.resolve(title, from: from) != note.id {
            let path = folderPath(note.folder)
            if !path.isEmpty { target = (path + [title]).joined(separator: "/") }
        }
        return WikiLinks.markdown(target: target, alias: written == title && target == title ? nil : written)
    }

    /// Turns the mentions of `note` at `spots` in `other` into links to it. Returns the text
    /// before and after, for Undo; nil when none of them is a mention any more.
    func linkMentions(of note: Note, in other: Note, at spots: [NSRange]) -> (before: String, after: String)? {
        guard !other.isLocked, other.deletedAt == nil else { return nil }
        let before = other.body
        let ns = before as NSString
        let now = Mentions.find(Mentions.names(title: note.title, frontMatter: note.frontMatter), in: before)
        let take = now.filter { spots.contains($0) }
        guard !take.isEmpty else { return nil }
        var after = before
        for r in take.reversed() {
            after = (after as NSString).replacingCharacters(in: r, with: mentionLink(to: note, from: other, written: ns.substring(with: r)))
        }
        other.body = after
        other.touch()
        try? save()
        return (before, after)
    }

    /// Undoes `linkMentions`, when the note is still as it left it.
    @discardableResult
    func undoLinkMentions(in other: Note, before: String, after: String) -> Bool {
        guard other.body == after else { return false }
        other.body = before
        other.touch()
        try? save()
        return true
    }
}
