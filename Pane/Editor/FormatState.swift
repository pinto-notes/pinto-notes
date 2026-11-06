import Foundation
import Markdown

/// One control of the iPhone Format panel, laid out like Notes' own: the paragraph styles in one
/// scrolling row, then rows of grouped pills. Only what a note's markdown can hold: no text colour,
/// which Notes has and a markdown note can't store. Highlight is Obsidian's `==text==`.
enum FormatControl: String, CaseIterable, Identifiable, Sendable {
    case title, heading, subheading, body, monostyled
    case bold, italic, underline, strikethrough, highlight
    case bulleted, dashed, numbered
    case outdent, indent
    case quote, divider, callout

    var id: String { rawValue }

    /// The paragraph styles, each drawn in its own face in the panel.
    static let styles: [FormatControl] = [.title, .heading, .subheading, .body, .monostyled]
    /// The rows under the styles; each inner list is one pill of segments side by side.
    static let rows: [[[FormatControl]]] = [
        // Highlight sits beside the four, as Notes' highlighter does.
        [[.bold, .italic, .underline, .strikethrough], [.highlight]],
        [[.bulleted, .dashed, .numbered], [.outdent, .indent]],
        // Callout on the quote's row: eight segments on one row were under 44 pt wide.
        [[.quote, .divider], [.callout]],
    ]

    /// What it's called, on screen and to VoiceOver.
    var name: String {
        switch self {
        case .title: "Title"
        case .heading: "Heading"
        case .subheading: "Subheading"
        case .body: "Body"
        case .monostyled: "Monostyled"
        case .bold: "Bold"
        case .italic: "Italic"
        case .underline: "Underline"
        case .strikethrough: "Strikethrough"
        case .highlight: "Highlight"
        case .bulleted: "Bulleted List"
        case .dashed: "Dashed List"
        case .numbered: "Numbered List"
        case .outdent: "Decrease Indent"
        case .indent: "Increase Indent"
        case .quote: "Block Quote"
        case .divider: "Divider"
        case .callout: "Callout"
        }
    }

    /// The SF Symbol of a pill segment (the styles are words).
    var symbol: String {
        switch self {
        case .bold: "bold"
        case .italic: "italic"
        case .underline: "underline"
        case .strikethrough: "strikethrough"
        case .highlight: "highlighter"
        case .bulleted: "list.bullet"
        case .dashed: "list.dash"
        case .numbered: "list.number"
        case .outdent: "decrease.indent"
        case .indent: "increase.indent"
        case .quote: "text.quote"
        case .divider: "minus"
        case .callout: "text.bubble"
        default: "textformat"
        }
    }

    /// The heading level a paragraph style writes (`#`, `##`, `###`; 0 for body text).
    var headingLevel: Int? {
        switch self {
        case .title: 1
        case .heading: 2
        case .subheading: 3
        case .body: 0
        default: nil
        }
    }

    var inline: FormatState.Inline? {
        switch self {
        case .bold: .bold
        case .italic: .italic
        case .underline: .underline
        case .strikethrough: .strikethrough
        case .highlight: .highlight
        default: nil
        }
    }

    var lineStyle: ListEditing.LineStyle? {
        switch self {
        case .bulleted: .bulleted
        case .dashed: .dashed
        case .numbered: .numbered
        case .quote: .quote
        default: nil
        }
    }
}

/// What the Format panel shows as on, for the caret's line and the selection: the line's style
/// (Title, Heading…), whether it's in a code block, and the inline formats around the selection.
struct FormatState: Equatable, Sendable {
    enum Inline: Hashable, Sendable { case bold, italic, underline, strikethrough, highlight }

    var paragraph: ListEditing.ParagraphStyle = .body
    /// The caret's line is in a fenced code block (Monostyled).
    var monostyled = false
    /// The caret's line is the note's first written line: its title, whatever marks it has.
    var firstLine = false
    var inline: Set<Inline> = []
    var canIndent = false
    var canOutdent = false
    /// In a table cell: only what a cell can hold (bold, italic, underline, strikethrough, highlight).
    var inCell = false
    /// The caret's line is in a callout (Callouts).
    var callout = false

    func isOn(_ control: FormatControl) -> Bool {
        // A cell's text is body text: its style row shows Body, never the note line's style
        // (Title showed picked in a cell).
        if inCell, control.inline == nil { return control == .body }
        return switch control {
        case .title: !monostyled && paragraph == .title
        case .heading: !monostyled && paragraph == .heading
        case .subheading: !monostyled && paragraph == .subheading
        // A list item or a quote is body text with a list or quote on it, as in Notes.
        case .body: !monostyled && ![.title, .heading, .subheading].contains(paragraph)
        case .monostyled: monostyled
        case .bulleted: !monostyled && paragraph == .bulleted
        case .dashed: !monostyled && paragraph == .dashed
        case .numbered: !monostyled && paragraph == .numbered
        // A callout is a quote underneath; it shows as Callout, not Block Quote.
        case .quote: !monostyled && paragraph == .quote && !callout
        case .callout: !monostyled && callout
        case .bold, .italic, .underline, .strikethrough, .highlight: inline.contains(control.inline!)
        case .outdent, .indent, .divider: false
        }
    }

    func isEnabled(_ control: FormatControl) -> Bool {
        // A markdown cell holds one line of inline text: no styles, lists, quotes or indents.
        if inCell { return control.inline != nil }
        return switch control {
        // Lines nest only as list items: markdown has no indented paragraph.
        case .indent: canIndent
        case .outdent: canOutdent
        // A fence above the first line would become the note's title.
        case .monostyled: !firstLine || monostyled
        // Markdown inside a code block is shown as written.
        case .bold, .italic, .underline, .strikethrough, .highlight: !monostyled
        // In a code block `---` is code, and `> [!note]` too.
        case .divider, .callout: !monostyled
        default: true
        }
    }

    static func at(_ text: String, selection: NSRange) -> FormatState {
        let ns = text as NSString
        let location = min(max(0, selection.location), ns.length)
        let sel = NSRange(location: location, length: min(max(0, selection.length), ns.length - location))
        var s = FormatState()
        s.paragraph = ListEditing.paragraphStyle(in: text, selection: sel)
        s.monostyled = ListEditing.codeBlock(in: ns, at: location) != nil
        var start = 0, end = 0, contentsEnd = 0
        ns.getLineStart(&start, end: &end, contentsEnd: &contentsEnd, for: NSRange(location: location, length: 0))
        let line = ns.substring(with: NSRange(location: start, length: contentsEnd - start))
        s.firstLine = ns.substring(to: start).trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        if !s.monostyled, Callouts.quotePrefix(line) != nil {
            s.callout = Callouts.lines(in: ns, range: NSRange(location: start, length: contentsEnd - start))[start] != nil
        }
        if !s.monostyled, let list = ListPrefix(line: line) {
            s.canIndent = true
            s.canOutdent = !list.indent.isEmpty
        }
        if !s.monostyled, NSMaxRange(sel) <= contentsEnd {
            for span in spans(in: text, selection: sel) { s.inline.insert(span.kind) }
        }
        return s
    }

    /// An inline format written around some text: `**…**`, `*…*`, `~~…~~`, `==…==` or `<u>…</u>`.
    struct Span: Equatable {
        var kind: Inline
        /// With its delimiters.
        var outer: NSRange
        var lead: Int
        var trail: Int
        var inner: NSRange { NSRange(location: outer.location + lead, length: max(0, outer.length - lead - trail)) }

        /// The selection is inside it (a caret at either end of its text counts), or is exactly it.
        func covers(_ sel: NSRange) -> Bool {
            sel == outer || (sel.location >= inner.location && NSMaxRange(sel) <= NSMaxRange(inner))
        }
    }

    /// The inline formats around the selection, on the caret's line.
    static func spans(in text: String, selection: NSRange) -> [Span] {
        let ns = text as NSString
        var start = 0, end = 0, contentsEnd = 0
        ns.getLineStart(&start, end: &end, contentsEnd: &contentsEnd, for: NSRange(location: min(selection.location, ns.length), length: 0))
        let full = ns.substring(with: NSRange(location: start, length: contentsEnd - start))
        // Parsed without its indent: a nested list item four spaces in would read as code.
        let lead = (full.prefix { $0 == " " || $0 == "\t" } as Substring).utf16.count
        let line = (full as NSString).substring(from: lead)
        let base = start + lead
        var found: [Span] = []
        var walker = SpanWalker(map: UTF16Map(line, base: base), line: line as NSString, base: base)
        walker.visit(Document(parsing: line, options: [.disableSmartOpts]))
        found += walker.spans
        for m in underline.matches(in: line, range: NSRange(location: 0, length: (line as NSString).length)) {
            found.append(Span(kind: .underline, outer: NSRange(location: base + m.range.location, length: m.range.length), lead: 3, trail: 4))
        }
        for h in Highlights.spans(in: line) {
            found.append(Span(kind: .highlight, outer: NSRange(location: base + h.outer.location, length: h.outer.length), lead: 2, trail: 2))
        }
        // A pair with nothing in it yet (B with no word under the caret): the next letters typed are bold.
        if selection.length == 0 {
            let c = selection.location
            func around(_ open: String, _ close: String) -> Bool {
                let a = (open as NSString).length, b = (close as NSString).length
                return c - a >= start && c + b <= contentsEnd
                    && ns.substring(with: NSRange(location: c - a, length: a)).lowercased() == open
                    && ns.substring(with: NSRange(location: c, length: b)).lowercased() == close
            }
            if around("**", "**") { found.append(Span(kind: .bold, outer: NSRange(location: c - 2, length: 4), lead: 2, trail: 2)) }
            else if around("*", "*") { found.append(Span(kind: .italic, outer: NSRange(location: c - 1, length: 2), lead: 1, trail: 1)) }
            if around("~~", "~~") { found.append(Span(kind: .strikethrough, outer: NSRange(location: c - 2, length: 4), lead: 2, trail: 2)) }
            if around("==", "==") { found.append(Span(kind: .highlight, outer: NSRange(location: c - 2, length: 4), lead: 2, trail: 2)) }
            if around("<u>", "</u>") { found.append(Span(kind: .underline, outer: NSRange(location: c - 3, length: 7), lead: 3, trail: 4)) }
        }
        return found.filter { $0.covers(selection) }
    }

    /// The closing marks the caret can step past (underline's are tags, and stay as they were).
    private static func stepToken(_ kind: Inline) -> String? {
        switch kind {
        case .bold: "**"
        case .italic: "*"
        case .strikethrough: "~~"
        case .highlight: "=="
        case .underline: nil
        }
    }

    private static let underline = try! NSRegularExpression(pattern: #"<u>(.*?)</u>"#, options: [.caseInsensitive])

    /// Bold, italic, underline, strikethrough or highlight, on or off, for the selection (or the word under
    /// the caret). Taking it off removes the marks around the text it's in. What was selected stays
    /// selected, on the same letters, so the panel shows it on and a second tap takes it off.
    /// `stepsPast`: with the caret at the end of the format, step out of it and keep it, for what's
    /// typed next. Off right after the toggle that made it: pressed twice, it comes off again.
    static func toggle(_ kind: Inline, in text: String, selection: NSRange, stepsPast: Bool = true) -> TextEdit {
        if stepsPast, selection.length == 0, let token = stepToken(kind),
           let past = ListEditing.stepPastClose(in: text, at: selection.location, token: token) { return past }
        // "bold " and ⌘B: "**bold **" isn't bold either. The space comes out past the marks.
        if stepsPast, selection.length == 0, let token = stepToken(kind) {
            let ns = text as NSString, t = (token as NSString).length, at = selection.location
            if at >= 2, at + t <= ns.length, ns.substring(with: NSRange(location: at - 1, length: 1)) == " ",
               ns.substring(with: NSRange(location: at, length: t)) == token,
               let past = ListEditing.stepPastClose(in: ns.replacingCharacters(in: NSRange(location: at - 1, length: 1), with: ""), at: at - 1, token: token), past.caret == at - 1 + t {
                return TextEdit(range: NSRange(location: at - 1, length: 1 + t), replacement: token + " ", caret: at + t)
            }
        }
        if let span = spans(in: text, selection: selection).first(where: { $0.kind == kind }) {
            let inner = span.inner
            func map(_ p: Int) -> Int { span.outer.location + min(max(0, p - inner.location), inner.length) }
            let a = map(selection.location), b = map(NSMaxRange(selection))
            return TextEdit(range: span.outer, replacement: (text as NSString).substring(with: inner), caret: b,
                            selection: b > a ? NSRange(location: a, length: b - a) : nil)
        }
        // Marks of their own, even beside another format's (italic inside bold is `***…***`).
        let (open, close): (String, String) = switch kind {
        case .underline: ("<u>", "</u>")
        case .bold: ("**", "**")
        case .italic: ("*", "*")
        case .strikethrough: ("~~", "~~")
        case .highlight: ("==", "==")
        }
        let ns = text as NSString
        var target = selection
        if target.length == 0, let word = ListEditing.wordRange(in: ns, at: target.location) { target = word }
        let lead = (open as NSString).length
        let replacement = open + ns.substring(with: target) + close
        if selection.length > 0 {
            let kept = NSRange(location: target.location + lead, length: target.length)
            return TextEdit(range: target, replacement: replacement, caret: NSMaxRange(kept), selection: kept)
        }
        // The caret stays on its letter, inside the marks.
        return TextEdit(range: target, replacement: replacement, caret: selection.location + lead)
    }
}

/// Collects the inline formats of one line.
private struct SpanWalker: MarkupWalker {
    let map: UTF16Map
    let line: NSString
    let base: Int
    var spans: [FormatState.Span] = []

    private func range(_ r: SourceRange?) -> NSRange? {
        guard let r = map.range(r), r.location >= base, NSMaxRange(r) <= base + line.length else { return nil }
        return r
    }

    mutating func visitStrong(_ strong: Strong) {
        if let r = range(strong.range) { spans.append(FormatState.Span(kind: .bold, outer: r, lead: 2, trail: 2)) }
        descendInto(strong)
    }

    mutating func visitEmphasis(_ emphasis: Emphasis) {
        if let r = range(emphasis.range) { spans.append(FormatState.Span(kind: .italic, outer: r, lead: 1, trail: 1)) }
        descendInto(emphasis)
    }

    mutating func visitStrikethrough(_ s: Strikethrough) {
        if let r = range(s.range) {
            var n = 0
            while n < r.length, line.character(at: r.location - base + n) == 0x7E { n += 1 }
            spans.append(FormatState.Span(kind: .strikethrough, outer: r, lead: n, trail: n))
        }
        descendInto(s)
    }

    mutating func visitInlineCode(_ code: InlineCode) {}
}
