import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Converts rich text (from Apple Notes, web pages, Pages…) into Pane's markdown.
/// Handles headings (by relative size), bold, italic, strikethrough, code,
/// links, nested bulleted and numbered lists, checklists and, on the Mac, tables.
enum RichTextToMarkdown {
    /// What a list item is, when a source knows better than its HTML does. Apple Notes writes a
    /// checklist as a plain `<ul>`, and a numbered list straight after a dashed one as more dashes.
    struct ListItem: Equatable {
        enum Kind: Equatable { case bullet, dash, number, check(done: Bool) }
        var text: String
        var kind: Kind
        var indent = 0
    }

    /// `keepBlankLines`: empty lines come over as written (an Apple Notes import) instead of being
    /// folded into one (a paste from a web page). `listItems`: the note's list items in order, from
    /// a source that knows their kind; an item is used only where its text matches the HTML's.
    @MainActor
    static func markdown(fromHTML html: String, keepBlankLines: Bool = false, listItems: [ListItem] = []) -> String {
        guard let data = OfflineHTML.strip(markDashLists(html)).data(using: .utf8),
              let attributed = try? NSAttributedString(
                data: data,
                options: [.documentType: NSAttributedString.DocumentType.html, .characterEncoding: String.Encoding.utf8.rawValue],
                documentAttributes: nil)
        else { return html }
        return markdown(from: attributed, keepBlankLines: keepBlankLines, listItems: listItems)
    }

    /// What two sources agree on about an item's text: everything but its spaces and line breaks.
    private static func comparable(_ s: String) -> String {
        String(String.UnicodeScalarView(s.unicodeScalars.filter { !CharacterSet.whitespacesAndNewlines.contains($0) && !CharacterSet.controlCharacters.contains($0) && $0 != "\u{FFFC}" }))
    }

    /// Apple Notes' HTML, made readable for the HTML importer.
    ///
    /// Notes marks its Dashed List as `<ul class="Apple-dash-list">`, a class WebKit drops. A square
    /// marker survives the trip and becomes `-`; every other `<ul>` is pinned to a disc, since a
    /// plain one nested three deep would turn square by itself. Notes also wraps each table in an
    /// `<object>`, which the offline rule would remove whole, table and all.
    static func markDashLists(_ html: String) -> String {
        var s = html.replacingOccurrences(of: #"<object>\s*(<table[\s\S]*?</table>)\s*</object>"#, with: "$1", options: [.regularExpression, .caseInsensitive])
        s = s.replacingOccurrences(of: "<ul>", with: #"<ul style="list-style-type: disc">"#, options: [.caseInsensitive])
        return s.replacingOccurrences(of: #"<ul([^>]*class="[^"]*Apple-dash-list[^"]*"[^>]*)>"#,
                                      with: #"<ul$1 style="list-style-type: square">"#, options: [.regularExpression, .caseInsensitive])
    }

    static func markdown(from text: NSAttributedString, keepBlankLines: Bool = false, listItems: [ListItem] = []) -> String {
        let ns = text.string as NSString
        // Markdown typed into Apple Notes' Monospaced style is already the source.
        if monospacedShare(text) >= 0.8 {
            var out: [String] = []
            for l in text.string.components(separatedBy: .newlines) {
                let line = l.replacingOccurrences(of: "\u{00A0}", with: " ")
                if line.trimmingCharacters(in: .whitespaces).isEmpty {
                    if keepBlankLines ? !out.isEmpty : !(out.last?.isEmpty ?? true) { out.append("") }
                } else { out.append(line) }
            }
            while out.last?.isEmpty == true { out.removeLast() }
            return out.joined(separator: "\n")
        }
        let bodySize = dominantFontSize(text)
        var code: [String] = []
        func flushCode(into lines: inout [String]) {
            guard !code.isEmpty else { return }
            while code.last?.isEmpty == true { code.removeLast() }
            if !lines.isEmpty, lines.last != "" { lines.append("") }
            lines.append("```")
            lines += code
            lines.append("```")
            code.removeAll()
        }
        var lines: [String] = []
        var index = 0
        var orderedCounters: [Int: Int] = [:]
        var inList = false
        // A blank line the converter added itself (after a list, around a table). A written one
        // that follows takes its place instead of doubling it.
        var addedBlank: Int?
        func separate() {
            guard !lines.isEmpty, lines.last != "" else { return }
            lines.append("")
            addedBlank = lines.count - 1
        }
        let hints = listItems.map { (comparable($0.text), $0) }
        var nextHint = 0
        /// The known kind of the list item with this text: the next one in order, or the first
        /// later one that matches (the two sources can disagree about empty items).
        func hint(for item: String) -> ListItem? {
            let key = comparable(item)
            guard !key.isEmpty, let at = hints[nextHint...].firstIndex(where: { $0.0 == key }) else { return nil }
            nextHint = at + 1
            return hints[at].1
        }

        while index < ns.length {
            let para = ns.paragraphRange(for: NSRange(location: index, length: 0))
            index = NSMaxRange(para)
            let content = trimmedParagraph(para, ns: ns)
            let style = content.length > 0 ? text.attribute(.paragraphStyle, at: content.location, effectiveRange: nil) as? NSParagraphStyle : nil

            #if os(macOS)
            if let block = style?.textBlocks.first as? NSTextTableBlock {
                let (tableLines, end) = table(starting: para, block: block, in: text)
                flushCode(into: &lines)
                separate()
                lines += tableLines
                lines.append("")
                addedBlank = lines.count - 1
                index = end
                continue
            }
            #endif

            if content.length == 0 {
                inList = false
                if !code.isEmpty { code.append(""); continue }
                orderedCounters.removeAll()
                if keepBlankLines {
                    if addedBlank == lines.count - 1 { addedBlank = nil } else if !lines.isEmpty { lines.append("") }
                } else if lines.last != "" { lines.append("") }
                continue
            }

            let raw = ns.substring(with: content)
            if isMonospaced(text, content) {
                code.append(raw)
                continue
            }
            flushCode(into: &lines)
            let lists = style?.textLists ?? []

            if let list = lists.last {
                // The item's own text, without the marker, is what a hint is matched on.
                let known = hint(for: (raw as NSString).substring(from: renderedMarkerLength(raw)))
                let depth = known?.indent ?? lists.count - 1
                let indent = String(repeating: "  ", count: depth)
                // Cut the marker the HTML importer rendered ("\t•\t", "1.\t") before
                // formatting, so a bold item doesn't wrap its bullet in the bold.
                let marker = renderedMarkerLength(raw)
                let body = NSRange(location: content.location + marker, length: content.length - marker)
                let item = String(ns.substring(with: body).drop { $0 == " " || $0 == "\t" })
                let inline = softBreaks(inlineMarkdown(text, range: body), continuation: indent + "  ")
                let format = list.markerFormat.rawValue.lowercased()
                let kind: ListItem.Kind
                if let known {
                    kind = known.kind
                } else if format.contains("decimal") || format.contains("roman") || format.contains("alpha") {
                    kind = .number
                } else if let checked = checklistState(item, list: list) {
                    kind = .check(done: checked)
                } else {
                    // Notes' Dashed List is a hyphen list; its Bulleted List uses discs.
                    kind = format.contains("hyphen") || format.contains("dash") || format.contains("square") ? .dash : .bullet
                }
                // Deeper numbering starts again under each item; a list of another kind ends this one.
                for d in Array(orderedCounters.keys) where d > depth || (d == depth && kind != .number) { orderedCounters[d] = nil }
                switch kind {
                case .number:
                    let n = (orderedCounters[depth] ?? (known == nil ? list.startingItemNumber - 1 : 0)) + 1
                    orderedCounters[depth] = n
                    lines.append("\(indent)\(n). \(inline)")
                case .check(let done):
                    lines.append("\(indent)- [\(done ? "x" : " ")] \(stripCheckGlyph(inline))")
                case .dash: lines.append("\(indent)- \(inline)")
                case .bullet: lines.append("\(indent)* \(inline)")
                }
                inList = true
                continue
            }
            orderedCounters.removeAll()
            // A line straight after a list would join its last item in markdown.
            if inList { separate() }
            inList = false
            let inline = softBreaks(inlineMarkdown(text, range: content), continuation: "")

            // Headings: a paragraph set wholly in a larger size.
            let size = maxFontSize(text, content)
            let level: Int = size >= bodySize * 1.6 ? 1 : size >= bodySize * 1.3 ? 2 : (size >= bodySize * 1.1 && isWholly(.paneBold, text, content)) ? 3 : 0
            if level > 0 {
                lines.append(String(repeating: "#", count: level) + " " + plainHeading(inline))
                continue
            }

            if let bullet = leadingBullet(raw) {
                lines.append("* " + String(inline.dropFirst(bullet)).trimmingCharacters(in: .whitespaces))
                continue
            }
            lines.append(inline)
        }

        flushCode(into: &lines)
        // Collapse runs of blank lines (unless they're kept as written) and trim.
        var out: [String] = []
        for l in lines where keepBlankLines ? !(l.isEmpty && out.isEmpty) : !(l.isEmpty && (out.last?.isEmpty ?? true)) { out.append(l) }
        while out.last?.isEmpty == true { out.removeLast() }
        return out.joined(separator: "\n")
    }

    // MARK: Inline

    /// How a run of text is formatted. Neighbouring runs that look the same are
    /// written as one, so "**a****b**" never happens.
    private struct Look: Equatable {
        var bold = false, italic = false, strike = false, underline = false, mono = false
        var link: String?
    }

    static func inlineMarkdown(_ text: NSAttributedString, range: NSRange) -> String {
        let ns = text.string as NSString
        var runs: [(look: Look, text: String)] = []
        text.enumerateAttributes(in: range) { attrs, r, _ in
            let traits = (attrs[.font] as? PFont)?.fontDescriptor.symbolicTraits ?? []
            var look = Look()
            look.mono = traits.contains(.paneMonoSpace)
            look.bold = traits.contains(.paneBold)
            look.italic = traits.contains(.paneItalic)
            look.strike = (attrs[.strikethroughStyle] as? Int ?? 0) != 0
            if let link = attrs[.link] {
                let url = (link as? URL)?.absoluteString ?? (link as? String) ?? ""
                if !url.isEmpty { look.link = url }
            }
            look.underline = (attrs[.underlineStyle] as? Int ?? 0) != 0 && look.link == nil
            let piece = ns.substring(with: r)
            if let last = runs.last, last.look == look { runs[runs.count - 1].text += piece } else { runs.append((look, piece)) }
        }
        var result = ""
        for (look, raw) in runs {
            let piece = raw.replacingOccurrences(of: "\u{00A0}", with: " ")
            // Formatting on bare whitespace (a bold line break) means nothing in markdown.
            if piece.trimmingCharacters(in: blank).isEmpty { result += piece; continue }
            // Keep surrounding spaces outside the markers so markdown parses.
            let lead = String(piece.prefix { blank.contains($0.unicodeScalars.first!) })
            let trail = String(piece.reversed().prefix { blank.contains($0.unicodeScalars.first!) }.reversed())
            let core = String(piece.dropFirst(lead.count).dropLast(trail.count))
            var s: String
            if look.mono { s = "`" + core + "`" } else {
                s = escape(core)
                if look.bold { s = "**\(s)**" }
                if look.italic { s = "*\(s)*" }
                if look.strike { s = "~~\(s)~~" }
                if look.underline { s = "<u>\(s)</u>" }
            }
            if let url = look.link { s = "[\(s)](\(url))" }
            result += lead + s + trail
        }
        return result
    }

    private static let blank = CharacterSet.whitespacesAndNewlines.union(CharacterSet(charactersIn: "\u{2028}\u{2029}"))

    /// Escapes only what would otherwise turn into markdown, since every
    /// backslash is visible while you edit: `snake_case` stays as typed.
    static func escape(_ s: String) -> String {
        let chars = Array(s)
        let linkLike = s.contains("](")
        var out = ""
        for (i, c) in chars.enumerated() {
            let before = i > 0 ? chars[i - 1] : " ", after = i + 1 < chars.count ? chars[i + 1] : " "
            var needs = false
            switch c {
            case "`": needs = true
            case "*": needs = i == 0 || !(before.isWhitespace && after.isWhitespace)
            case "_": needs = !(before.isLetter || before.isNumber) || !(after.isLetter || after.isNumber)
            case "[", "]": needs = linkLike
            case "\\": needs = after.isPunctuation || after.isSymbol
            default: break
            }
            if needs { out.append("\\") }
            out.append(c)
        }
        return out
    }

    // MARK: Helpers

    private static func trimmedParagraph(_ para: NSRange, ns: NSString) -> NSRange {
        var r = para
        while r.length > 0, let u = Unicode.Scalar(ns.character(at: NSMaxRange(r) - 1)), CharacterSet.newlines.contains(u) { r.length -= 1 }
        return r
    }

    private static func dominantFontSize(_ text: NSAttributedString) -> CGFloat {
        var counts: [CGFloat: Int] = [:]
        text.enumerateAttribute(.font, in: NSRange(location: 0, length: text.length)) { v, r, _ in
            if let f = v as? PFont { counts[f.pointSize.rounded(), default: 0] += r.length }
        }
        return counts.max { $0.value < $1.value }?.key ?? 13
    }

    /// Share of visible characters set in a monospaced face.
    private static func monospacedShare(_ text: NSAttributedString) -> Double {
        var mono = 0, total = 0
        text.enumerateAttribute(.font, in: NSRange(location: 0, length: text.length)) { v, r, _ in
            let visible = (text.string as NSString).substring(with: r).filter { !$0.isWhitespace && !$0.isNewline }.count
            total += visible
            if (v as? PFont)?.fontDescriptor.symbolicTraits.contains(.paneMonoSpace) == true { mono += visible }
        }
        return total == 0 ? 0 : Double(mono) / Double(total)
    }

    private static func maxFontSize(_ text: NSAttributedString, _ r: NSRange) -> CGFloat {
        var m: CGFloat = 0
        text.enumerateAttribute(.font, in: r) { v, _, _ in if let f = v as? PFont { m = max(m, f.pointSize) } }
        return m
    }

    private static func isWholly(_ trait: PFontDescriptor.SymbolicTraits, _ text: NSAttributedString, _ r: NSRange) -> Bool {
        var all = true
        text.enumerateAttribute(.font, in: r) { v, sub, stop in
            let blank = (text.string as NSString).substring(with: sub).trimmingCharacters(in: .whitespaces).isEmpty
            if !blank, (v as? PFont)?.fontDescriptor.symbolicTraits.contains(trait) != true { all = false; stop.pointee = true }
        }
        return all
    }

    private static func isMonospaced(_ text: NSAttributedString, _ r: NSRange) -> Bool {
        isWholly(.paneMonoSpace, text, r)
    }

    private static func plainHeading(_ s: String) -> String {
        s.replacingOccurrences(of: "**", with: "")
    }

    /// Length of the list marker the HTML importer writes into an item's text.
    private static func renderedMarkerLength(_ raw: String) -> Int {
        guard let r = raw.range(of: #"^\t?\s*([•◦▪︎▫︎·\-–—*⁃]|\d+[.)]?|[a-zA-Z][.)]|[ivxlcIVXLC]+[.)]?)\t"#, options: .regularExpression) else { return 0 }
        return raw[r].utf16.count
    }

    /// A line break inside a paragraph (Shift-Return in Notes) becomes a new
    /// markdown line; inside a list item the next line is indented to stay in it.
    /// Breaks at either end are dropped.
    private static func softBreaks(_ s: String, continuation: String) -> String {
        let breaks = CharacterSet(charactersIn: "\u{2028}\u{2029}")
        let parts = s.components(separatedBy: breaks).map { $0.trimmingCharacters(in: .whitespaces) }
        let kept = parts.drop { $0.isEmpty || $0 == "****" }.reversed().drop { $0.isEmpty || $0 == "****" }.reversed()
        return kept.enumerated().map { i, line in i == 0 || line.isEmpty ? line : continuation + line }.joined(separator: "\n")
    }

    private static let checkGlyphs = CharacterSet(charactersIn: "☐☑☒✓✔︎◯○●⃝")

    private static func checklistState(_ raw: String, list: NSTextList) -> Bool? {
        let body = raw.drop { $0 == "\t" || $0 == " " }
        guard let first = body.unicodeScalars.first else { return nil }
        if "☑☒✓✔".unicodeScalars.contains(first) { return true }
        if "☐○◯".unicodeScalars.contains(first) { return false }
        return nil
    }

    private static func stripCheckGlyph(_ s: String) -> String {
        String(s.drop { $0 == " " || $0 == "\t" || String($0).unicodeScalars.allSatisfy { checkGlyphs.contains($0) } })
    }

    private static func leadingBullet(_ raw: String) -> Int? {
        guard let r = raw.range(of: #"^\s*[•◦▪·]\s+"#, options: .regularExpression) else { return nil }
        return raw.distance(from: raw.startIndex, to: r.upperBound)
    }

    #if os(macOS)
    /// Reads consecutive table-cell paragraphs into a GFM table.
    private static func table(starting para: NSRange, block: NSTextTableBlock, in text: NSAttributedString) -> ([String], Int) {
        let ns = text.string as NSString
        let tableRef = block.table
        var cells: [[String]] = []
        var index = para.location
        while index < ns.length {
            let p = ns.paragraphRange(for: NSRange(location: index, length: 0))
            let content = trimmedParagraph(p, ns: ns)
            let at = content.length > 0 ? content.location : p.location
            guard let style = text.attribute(.paragraphStyle, at: at, effectiveRange: nil) as? NSParagraphStyle,
                  let b = style.textBlocks.first as? NSTextTableBlock, b.table === tableRef else { break }
            while cells.count <= b.startingRow { cells.append([]) }
            while cells[b.startingRow].count <= b.startingColumn { cells[b.startingRow].append("") }
            let cellText = inlineMarkdown(text, range: content).replacingOccurrences(of: "|", with: "\\|")
            let existing = cells[b.startingRow][b.startingColumn]
            cells[b.startingRow][b.startingColumn] = existing.isEmpty ? cellText : existing + "<br>" + cellText
            index = NSMaxRange(p)
        }
        let cols = max(cells.map(\.count).max() ?? 1, 1)
        var lines: [String] = []
        for (i, row) in cells.enumerated() {
            let padded = row + Array(repeating: "", count: cols - row.count)
            lines.append("| " + padded.map { $0.isEmpty ? " " : $0 }.joined(separator: " | ") + " |")
            if i == 0 { lines.append("|" + Array(repeating: " --- ", count: cols).joined(separator: "|") + "|") }
        }
        return (lines, index)
    }
    #endif
}
