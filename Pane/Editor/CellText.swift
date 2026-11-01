import Foundation
import SwiftUI

/// A table cell's text as it reads at rest: its inline markdown drawn (bold, italic,
/// strikethrough, code, links, and `<u>` underline), the marks hidden. While the cell is being
/// edited it shows the markdown as written, like a code block (Emil, 1 November 2026: cells had
/// no formatting at all).
enum CellText {
    static func attributed(_ markdown: String) -> AttributedString {
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
