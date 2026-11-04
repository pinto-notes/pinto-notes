import Foundation
import SwiftUI

/// A table cell's text as it reads at rest: its inline markdown drawn (bold, italic,
/// strikethrough, code, links, and `<u>` underline), the marks hidden. While the cell is being
/// edited it shows the markdown as written, like a code block (Emil, 1 November 2026: cells had
/// no formatting at all).
enum CellText {
    /// The note a click lands on, `x` from the start of the cell's text, when it lands on a wiki
    /// link's words (`[[Dune]]` in a Notion database's row, naming the row's page).
    static func link(in written: String, at x: CGFloat, font: PFont) -> String? {
        let found = WikiLinks.links(in: written).filter { !$0.embed }
        guard !found.isEmpty, x >= 0 else { return nil }
        let (text, ranges) = wikiShown(written)
        func width(_ n: Int) -> CGFloat { (String(text.prefix(n)) as NSString).size(withAttributes: [.font: font]).width }
        for (link, r) in zip(found, ranges) where x >= width(r.lowerBound) && x <= width(r.upperBound) {
            return link.heading.map { "\(link.target)#\($0)" } ?? link.target
        }
        return nil
    }

    /// `[[Dune]]` reads "Dune", in the colour links have in notes. It isn't a `.link`: a click on it
    /// is the grid's own (TableGridView opens the note), so the cell never hands the address to
    /// the system.
    static func wikiShown(_ markdown: String) -> (text: String, links: [Range<Int>]) {
        let found = WikiLinks.links(in: markdown).filter { !$0.embed }
        guard !found.isEmpty else { return (markdown, []) }
        let ns = markdown as NSString
        var text = "", ranges: [Range<Int>] = []
        var last = 0
        for link in found {
            text += ns.substring(with: NSRange(location: last, length: link.range.location - last))
            let shown = link.alias ?? link.name
            ranges.append(text.count..<(text.count + shown.count))
            text += shown
            last = NSMaxRange(link.range)
        }
        text += ns.substring(from: last)
        return (text, ranges)
    }

    static func attributed(_ written: String) -> AttributedString {
        let (markdown, linked) = wikiShown(written)
        guard !linked.isEmpty else { return attributedMarkdown(markdown) }
        // The links' words, found in order in what the markdown draws (marks around them move them).
        var out = attributedMarkdown(markdown)
        var from = out.startIndex
        for r in linked {
            let words = String(markdown.dropFirst(r.lowerBound).prefix(r.count))
            guard let found = out[from...].range(of: words) else { continue }
            out[found].foregroundColor = Color(PColor.paneLinkText)
            from = found.upperBound
        }
        return out
    }

    private static func attributedMarkdown(_ markdown: String) -> AttributedString {
        // Underline isn't markdown: `<u>…</u>` marks it (FormatState.toggle). Its marks are taken
        // out first and the ranges they held are underlined after parsing.
        var plain = ""
        var underlined: [Range<Int>] = []
        var rest = Substring(markdown)
        while let open = rest.range(of: "<u>", options: .caseInsensitive),
              let close = rest[open.upperBound...].range(of: "</u>", options: .caseInsensitive) {
            plain += rest[..<open.lowerBound]
            let inner = rest[open.upperBound..<close.lowerBound]
            underlined.append(plain.count..<(plain.count + inner.count))
            plain += inner
            rest = rest[close.upperBound...]
        }
        plain += rest
        var out = (try? AttributedString(markdown: plain, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)))
            ?? AttributedString(plain)
        guard !underlined.isEmpty else { return out }
        // Markdown marks around the underlined words change where they land: find each
        // underlined run's text in the parsed string instead, in order.
        var from = out.startIndex
        for r in underlined {
            let start = plain.index(plain.startIndex, offsetBy: r.lowerBound)
            let end = plain.index(plain.startIndex, offsetBy: r.upperBound)
            let words = String(plain[start..<end])
                .replacingOccurrences(of: "**", with: "").replacingOccurrences(of: "~~", with: "")
                .replacingOccurrences(of: "*", with: "").replacingOccurrences(of: "`", with: "")
            guard !words.isEmpty, let found = out[from...].range(of: words) else { continue }
            out[found].underlineStyle = .single
            from = found.upperBound
        }
        return out
    }
}
