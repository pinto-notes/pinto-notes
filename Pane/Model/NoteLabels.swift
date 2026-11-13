import Foundation

/// A note's labels: tags put on the note from its right-click (Emil, 12 November 2026: "I just
/// want to right click a note and basically mark it with a label"), not written in its text. They
/// live in the note's front matter as `tags:`, as Obsidian keeps a note's tags, so they sync sealed
/// with the note (`props_ct`) and a Markdown export carries them. A label is a tag like `#work` in
/// the text: the sidebar's Tags list both, with one colour each (TagColors), and a tag's list
/// shows the notes with either. A label may have spaces ("Needs review").
enum NoteLabels {
    static let key = "tags"

    /// The labels in a note's front matter, in order, each once (case aside), without a leading `#`.
    static func labels(in frontMatter: String?) -> [String] {
        guard let frontMatter, frontMatter.localizedCaseInsensitiveContains("tags") else { return [] }
        let found = MarkdownNote.frontMatter(frontMatter.components(separatedBy: "\n"))[key] ?? []
        var seen = Set<String>()
        return found.compactMap { raw in
            var name = raw.trimmingCharacters(in: .whitespaces)
            while name.hasPrefix("#") { name.removeFirst() }
            guard !name.isEmpty, seen.insert(name.lowercased()).inserted else { return nil }
            return name
        }
    }

    /// The front matter with `labels` as its `tags:` (none: no `tags:` at all), every other key as
    /// it was. Nil when nothing is left.
    static func setting(_ labels: [String], in frontMatter: String?) -> String? {
        let others = frontMatter.flatMap { MarkdownNote.kept($0.components(separatedBy: "\n"), without: [key]) }
        guard !labels.isEmpty else { return others }
        let tags = ([key + ":"] + labels.map { "  - " + yamlScalar($0) }).joined(separator: "\n")
        return [others, tags].compactMap { $0 }.joined(separator: "\n")
    }

    /// A YAML value: as it is when it can't be misread, else in double quotes (as NoteExport writes
    /// them; that one is the main actor's, and labels are read and written off it too).
    static func yamlScalar(_ s: String) -> String {
        if s.wholeMatch(of: /[\p{L}\p{N}][\p{L}\p{N} _.,()\/-]*/) != nil, !s.hasSuffix(" ") { return s }
        return "\"" + s.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"") + "\""
    }

    /// Whether the note has `tag` as a label (case aside; not one nested under it).
    static func has(_ tag: String, in frontMatter: String?) -> Bool {
        labels(in: frontMatter).contains { $0.lowercased() == tag.lowercased() }
    }

    /// A name typed for a new label: trimmed, spaces kept (one between words), a leading `#` gone.
    /// Nil when there's nothing with a letter, a digit or `_` in it.
    static func typedName(_ typed: String) -> String? {
        var s = typed.trimmingCharacters(in: .whitespacesAndNewlines)
        while s.hasPrefix("#") { s.removeFirst() }
        let name = s.split(whereSeparator: \.isWhitespace).joined(separator: " ")
        guard name.contains(where: { $0.isLetter || $0.isNumber || $0 == "_" }), name.count <= 60 else { return nil }
        return name
    }
}

extension Tags {
    /// Whether a tag's name can be written in text as `#name`: a label with a space can't.
    static func writable(_ name: String) -> Bool { !name.contains(where: \.isWhitespace) }
}
