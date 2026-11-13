import Foundation

/// Where every note links, with the lookups the other way kept beside it: which notes have a link
/// by a name, and which name a note by its id. Linked From (the note's ••• menu) reads the few
/// notes that can link to a note instead of resolving every link in the library (at 20,000 notes,
/// tens of thousands of links each time it was asked). Kept note by note as notes are saved.
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

extension WikiLinks {
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
