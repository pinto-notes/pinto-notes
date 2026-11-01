import Foundation

/// A text replacement the editor should perform instead of the default one.
struct TextEdit: Equatable {
    var range: NSRange
    var replacement: String
    /// Caret location after the edit.
    var caret: Int
    /// What stays selected after the edit, where the edit was made to a selection of lines.
    var selection: NSRange? = nil
}

/// Editing rules that make lists and checklists feel like Apple Notes.
/// Pure functions over the markdown source, so they are unit-tested.
enum ListEditing {
    /// Return inside a list item continues the list; on an empty item it ends it.
    static func returnKey(in text: String, selection: NSRange) -> TextEdit? {
        let ns = text as NSString
        guard selection.location <= ns.length else { return nil }
        let lineRange = ns.lineRange(for: NSRange(location: selection.location, length: 0))
        let line = ns.substring(with: lineRange).trimmingCharacters(in: .newlines)
        if let leave = leavingStyle(ns, line: line, lineStart: lineRange.location, selection: selection) { return leave }
        if let quote = line.range(of: #"^[ \t]*>[ \t]?"#, options: .regularExpression) {
            let prefixLen = (line[quote] as Substring).utf16.count
            guard selection.location >= lineRange.location + prefixLen else { return nil }
            if line[quote.upperBound...].trimmingCharacters(in: .whitespaces).isEmpty {
                return TextEdit(range: NSRange(location: lineRange.location, length: (line as NSString).length), replacement: "", caret: lineRange.location)
            }
            let insert = "\n> "
            return TextEdit(range: selection, replacement: insert, caret: selection.location + 3)
        }
        guard let list = ListPrefix(line: line), selection.location >= lineRange.location + list.length else { return nil }

        let content = (line as NSString).substring(from: list.length)
        if content.trimmingCharacters(in: .whitespaces).isEmpty {
            // Empty item: outdent one level, or leave the list.
            if list.level > 0 {
                let newIndent = String(list.indent.dropFirst(min(2, list.indent.count)))
                let replacement = newIndent + String(line.dropFirst(list.indent.count))
                return TextEdit(range: NSRange(location: lineRange.location, length: (line as NSString).length), replacement: replacement, caret: lineRange.location + (replacement as NSString).length)
            }
            // Leaving a list keeps a blank line after it, so what follows isn't swallowed by the last item.
            let afterList = lineRange.location > 0 && ListPrefix(line: ns.substring(with: ns.lineRange(for: NSRange(location: lineRange.location - 1, length: 0)))) != nil
            let replacement = afterList ? "\n" : ""
            return TextEdit(range: NSRange(location: lineRange.location, length: (line as NSString).length), replacement: replacement, caret: lineRange.location + (replacement as NSString).length)
        }
        let insert = "\n" + list.continuation
        return TextEdit(range: selection, replacement: insert, caret: selection.location + (insert as NSString).length)
    }

    /// The closing markers Bold, Italic and the rest put after the caret.
    private static let closers = ["**", "~~", "</u>", "`", "*"]

    /// Return typed just inside a style's closing marker, at the end of the line ("**bold|**"):
    /// the new line starts after the marker. Left where it was, the marker moved down to the
    /// next line and both halves showed as literal asterisks. An empty pair ("**|**", Bold
    /// tapped and nothing typed) is taken away.
    private static func leavingStyle(_ ns: NSString, line: String, lineStart: Int, selection: NSRange) -> TextEdit? {
        guard selection.length == 0 else { return nil }
        let column = selection.location - lineStart
        let l = line as NSString
        guard column >= 0, column <= l.length else { return nil }
        let rest = l.substring(from: column), before = l.substring(to: column)
        // A marker with a space before it closes nothing ("2 * 3 *").
        guard let closer = closers.first(where: { rest == $0 }), before.last?.isWhitespace != true else { return nil }
        let opener = closer == "</u>" ? "<u>" : closer
        let o = (opener as NSString).length, c = (closer as NSString).length
        if before.hasSuffix(opener) {
            let pair = NSRange(location: selection.location - o, length: o + c)
            let without = ns.replacingCharacters(in: pair, with: "")
            let at = NSRange(location: pair.location, length: 0)
            guard let e = returnKey(in: without, selection: at) else {
                return TextEdit(range: pair, replacement: "\n", caret: pair.location + 1)
            }
            // The same edit, said against the text that still has the pair.
            let grown = NSRange(location: min(e.range.location, pair.location), length: NSMaxRange(pair) - min(e.range.location, pair.location))
            guard e.range.location <= pair.location, NSMaxRange(e.range) == pair.location else {
                return TextEdit(range: pair, replacement: "\n", caret: pair.location + 1)
            }
            return TextEdit(range: grown, replacement: e.replacement, caret: e.caret)
        }
        // An opener earlier on the line that this closer answers: an odd number of them before the caret.
        guard before.components(separatedBy: opener).count % 2 == 0 else { return nil }
        let after = NSRange(location: selection.location + c, length: 0)
        return returnKey(in: ns as String, selection: after) ?? TextEdit(range: after, replacement: "\n", caret: after.location + 1)
    }

    /// Backspace right after a list marker removes the marker, keeping the text.
    static func backspace(in text: String, selection: NSRange) -> TextEdit? {
        guard selection.length == 0 else { return nil }
        let ns = text as NSString
        let lineRange = ns.lineRange(for: NSRange(location: selection.location, length: 0))
        let line = ns.substring(with: lineRange).trimmingCharacters(in: .newlines)
        guard let list = ListPrefix(line: line), selection.location == lineRange.location + list.length else { return nil }
        // Nested items outdent first; top-level items lose the marker.
        if list.level > 0 {
            let drop = min(2, list.indent.count)
            return TextEdit(range: NSRange(location: lineRange.location, length: drop), replacement: "", caret: selection.location - drop)
        }
        return TextEdit(range: NSRange(location: lineRange.location, length: list.length), replacement: "", caret: lineRange.location)
    }

    /// Tab / Shift-Tab on a list item nests or un-nests it.
    static func indent(in text: String, selection: NSRange, outdent: Bool) -> TextEdit? {
        let ns = text as NSString
        let lineRange = ns.lineRange(for: NSRange(location: selection.location, length: 0))
        let line = ns.substring(with: lineRange)
        guard let list = ListPrefix(line: line) else { return nil }
        if outdent {
            let drop = min(2, list.indent.count)
            guard drop > 0 else { return nil }
            return TextEdit(range: NSRange(location: lineRange.location, length: drop), replacement: "", caret: max(lineRange.location, selection.location - drop))
        }
        return TextEdit(range: NSRange(location: lineRange.location, length: 0), replacement: "  ", caret: selection.location + 2)
    }

    /// Flips the checkbox on the line starting at `lineStart`.
    static func toggleCheckbox(in text: String, lineStart: Int) -> TextEdit? {
        let ns = text as NSString
        guard lineStart <= ns.length else { return nil }
        let lineRange = ns.lineRange(for: NSRange(location: lineStart, length: 0))
        let line = ns.substring(with: lineRange)
        guard let list = ListPrefix(line: line), let checked = list.checkbox else { return nil }
        let boxAt = (line as NSString).range(of: "[", options: [], range: NSRange(location: (list.indent as NSString).length, length: list.length - (list.indent as NSString).length))
        guard boxAt.location != NSNotFound else { return nil }
        let target = NSRange(location: lineRange.location + boxAt.location + 1, length: 1)
        return TextEdit(range: target, replacement: checked ? " " : "x", caret: -1)
    }

    /// How long a tick stays in place before the item moves, so you see it land.
    static let sortDelay: TimeInterval = 0.6

    /// Like Notes, ticked items sink below the open ones. Rewrites the run of
    /// checklist lines around `location`: open items first, ticked ones after,
    /// each group in its written order. Nil when it's already in that order or
    /// the list is nested (moving a parent would split it from its children).
    /// `caret` follows the text it was in.
    static func sortChecklist(in text: String, around location: Int, caret: Int) -> TextEdit? {
        let ns = text as NSString
        guard location <= ns.length else { return nil }
        var lines: [NSRange] = []
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byLines, .substringNotRequired]) { _, _, r, _ in lines.append(r) }
        guard let here = lines.firstIndex(where: { NSLocationInRange(location, $0) || $0.location == location }) else { return nil }
        func item(_ i: Int) -> ListPrefix? {
            guard let p = ListPrefix(line: ns.substring(with: lines[i])), p.checkbox != nil else { return nil }
            return p
        }
        guard let mine = item(here) else { return nil }
        var lo = here, hi = here
        while lo > 0, let p = item(lo - 1), p.indent == mine.indent { lo -= 1 }
        while hi + 1 < lines.count, let p = item(hi + 1), p.indent == mine.indent { hi += 1 }
        // A nested line right after the run belongs to its last item: leave it alone.
        if hi + 1 < lines.count, let next = ListPrefix(line: ns.substring(with: lines[hi + 1])), next.level > mine.level { return nil }
        let run = Array(lo...hi)
        let order = run.filter { item($0)?.checkbox == false } + run.filter { item($0)?.checkbox == true }
        guard order != run else { return nil }
        // Every line keeps its own text; the last one may lack a newline.
        func body(_ i: Int) -> String { ns.substring(with: lines[i]).trimmingCharacters(in: .newlines) }
        let whole = NSRange(location: lines[lo].location, length: NSMaxRange(lines[hi]) - lines[lo].location)
        let trailing = ns.substring(with: whole).hasSuffix("\n") ? "\n" : ""
        let replacement = order.map(body).joined(separator: "\n") + trailing
        var newCaret = -1
        if let from = run.first(where: { NSLocationInRange(caret, lines[$0]) || (caret == NSMaxRange(lines[$0]) && $0 == hi) }) {
            let offset = min(caret - lines[from].location, (body(from) as NSString).length)
            var at = whole.location
            for i in order {
                if i == from { newCaret = at + offset; break }
                at += (body(i) as NSString).length + 1
            }
        }
        return TextEdit(range: whole, replacement: replacement, caret: newCaret)
    }

    /// The caret never sits inside a list line's hidden marker: it steps over it,
    /// forwards to the text, or back to the previous line when moving left.
    static func caretOutsideMarker(in text: String, selection: NSRange, previous: NSRange?) -> Int? {
        guard selection.length == 0 else { return nil }
        let ns = text as NSString
        guard selection.location <= ns.length else { return nil }
        let line = ns.lineRange(for: NSRange(location: selection.location, length: 0))
        guard let p = ListPrefix(line: ns.substring(with: line)), !p.ordered else { return nil }
        let start = line.location + p.length
        guard selection.location < start else { return nil }
        if let previous, previous.length == 0, previous.location == start, line.location > 0 { return line.location - 1 }
        return start
    }

    /// The whole lines a selection touches. A selection that ends at the start of a line (the line
    /// break before it is the last thing selected) doesn't take that line, like Notes.
    static func lines(in ns: NSString, touching selection: NSRange) -> NSRange {
        let location = min(selection.location, ns.length)
        let length = min(selection.length, ns.length - location)
        return ns.lineRange(for: NSRange(location: location, length: max(0, length - 1)))
    }

    /// Rewrites the prefix of every line in `span` that has text, and keeps those lines selected.
    /// `prefix` is given a line, and returns how much of its start to replace, and with what.
    private static func restyle(_ ns: NSString, span: NSRange, prefix: (String) -> (length: Int, new: String)) -> TextEdit {
        var out = "", at = span.location
        while at < NSMaxRange(span) {
            var start = 0, end = 0, contentsEnd = 0
            ns.getLineStart(&start, end: &end, contentsEnd: &contentsEnd, for: NSRange(location: at, length: 0))
            let line = ns.substring(with: NSRange(location: start, length: contentsEnd - start))
            let ending = ns.substring(with: NSRange(location: contentsEnd, length: end - contentsEnd))
            if line.trimmingCharacters(in: .whitespaces).isEmpty {
                out += line + ending
            } else {
                let p = prefix(line)
                out += p.new + (line as NSString).substring(from: p.length) + ending
            }
            at = max(end, at + 1)
        }
        let length = (out as NSString).length
        let selected = out.hasSuffix("\n") ? length - 1 : length
        return TextEdit(range: span, replacement: out, caret: span.location + selected, selection: NSRange(location: span.location, length: selected))
    }

    /// The lines of `span` that have text, when a selection reaches over more than one line
    /// (nil otherwise: the caret's line is then the one to change).
    private static func selectedLines(_ ns: NSString, in span: NSRange, selection: NSRange) -> [String]? {
        guard selection.length > 0 else { return nil }
        let all = ns.substring(with: span).trimmingCharacters(in: .newlines).components(separatedBy: .newlines)
        let written = all.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        return all.count > 1 && !written.isEmpty ? written : nil
    }

    /// Turns the caret's line into a checklist item, or back into plain text. With several lines
    /// selected, all of them, like Notes: bullets, dashes, numbers and plain lines become
    /// checklist items; when every one already is, they go back to plain text.
    static func toggleChecklist(in text: String, selection: NSRange) -> TextEdit {
        let ns = text as NSString
        let span = lines(in: ns, touching: selection)
        if let all = selectedLines(ns, in: span, selection: selection) {
            let isChecklist = all.allSatisfy { ListPrefix(line: $0)?.checkbox != nil }
            return restyle(ns, span: span) { line in
                guard let list = ListPrefix(line: line) else { return (0, "- [ ] ") }
                if isChecklist { return (list.length, list.indent) }
                // An item that is already ticked or unticked stays as it is.
                return list.checkbox != nil ? (0, "") : (list.length, list.indent + "- [ ] ")
            }
        }
        let lineRange = ns.lineRange(for: NSRange(location: selection.location, length: 0))
        let line = ns.substring(with: lineRange).trimmingCharacters(in: .newlines)
        if let list = ListPrefix(line: line) {
            if list.checkbox != nil {
                return TextEdit(range: NSRange(location: lineRange.location, length: list.length), replacement: list.indent, caret: max(lineRange.location, selection.location - list.length + (list.indent as NSString).length))
            }
            let new = list.indent + "- [ ] "
            return TextEdit(range: NSRange(location: lineRange.location, length: list.length), replacement: new, caret: selection.location - list.length + (new as NSString).length)
        }
        return TextEdit(range: NSRange(location: lineRange.location, length: 0), replacement: "- [ ] ", caret: selection.location + 6)
    }

    /// Wraps the selection in <u>…</u>, or unwraps it.
    static func underline(in text: String, selection: NSRange) -> TextEdit {
        let ns = text as NSString
        var sel = selection
        if sel.length == 0, let w = wordRange(in: ns, at: sel.location) { sel = w }
        let selected = ns.substring(with: sel)
        if sel.location >= 3, NSMaxRange(sel) + 4 <= ns.length,
           ns.substring(with: NSRange(location: sel.location - 3, length: 3)).lowercased() == "<u>",
           ns.substring(with: NSRange(location: NSMaxRange(sel), length: 4)).lowercased() == "</u>" {
            return TextEdit(range: NSRange(location: sel.location - 3, length: sel.length + 7), replacement: selected, caret: sel.location - 3 + sel.length)
        }
        let wrapped = "<u>" + selected + "</u>"
        return TextEdit(range: sel, replacement: wrapped, caret: sel.length == 0 ? sel.location + 3 : sel.location + (wrapped as NSString).length)
    }

    /// Wraps the selection in a markdown delimiter, or unwraps it.
    static func wrap(in text: String, selection: NSRange, with token: String) -> TextEdit {
        let ns = text as NSString
        if selection.length == 0, let word = wordRange(in: ns, at: selection.location) {
            // No selection: act on the word under the caret.
            var e = wrap(in: text, selection: word, with: token)
            e.caret = selection.location + (e.replacement.count > word.length ? (token as NSString).length : -(token as NSString).length)
            return e
        }
        let t = (token as NSString).length
        let selected = ns.substring(with: selection)
        if selected.hasPrefix(token), selected.hasSuffix(token), selection.length >= t * 2 {
            let inner = (selected as NSString).substring(with: NSRange(location: t, length: selection.length - t * 2))
            return TextEdit(range: selection, replacement: inner, caret: selection.location + (inner as NSString).length)
        }
        if selection.location >= t, NSMaxRange(selection) + t <= ns.length,
           ns.substring(with: NSRange(location: selection.location - t, length: t)) == token,
           ns.substring(with: NSRange(location: NSMaxRange(selection), length: t)) == token {
            return TextEdit(range: NSRange(location: selection.location - t, length: selection.length + t * 2), replacement: selected, caret: selection.location - t + selection.length)
        }
        let wrapped = token + selected + token
        let caret = selection.length == 0 ? selection.location + t : selection.location + (wrapped as NSString).length
        return TextEdit(range: selection, replacement: wrapped, caret: caret)
    }

    static func wordRange(in ns: NSString, at location: Int) -> NSRange? {
        let letters = CharacterSet.alphanumerics
        func isWord(_ i: Int) -> Bool {
            guard i >= 0, i < ns.length, let u = Unicode.Scalar(ns.character(at: i)) else { return false }
            return letters.contains(u)
        }
        guard isWord(location) || isWord(location - 1) else { return nil }
        var a = location, b = location
        while isWord(a - 1) { a -= 1 }
        while isWord(b) { b += 1 }
        return NSRange(location: a, length: b - a)
    }

    enum LineStyle: Sendable { case bulleted, dashed, numbered, quote }

    /// A line's style, with its indent and how long its prefix is. A checklist item has no line
    /// style of its own: choosing one turns it into that.
    private static func lineStyle(of line: String) -> (style: LineStyle?, indent: String, length: Int) {
        if let q = line.range(of: #"^[ \t]*>[ \t]?"#, options: .regularExpression) {
            return (.quote, "", (line[q] as Substring).utf16.count)
        }
        if let list = ListPrefix(line: line) {
            return (list.ordered ? .numbered : list.checkbox != nil ? nil : list.marker == "-" ? .dashed : .bulleted, list.indent, list.length)
        }
        return (nil, "", 0)
    }

    /// Format → Bulleted List / Dashed List / Numbered List / Block Quote, like Notes: the caret's line
    /// takes that style, switching from another list style; choosing the style it
    /// already has turns it back into body text. With several lines selected, all of them take it
    /// (a checklist too), numbered in order; when every one already has it, they go back to body text.
    static func toggleLineStyle(in text: String, selection: NSRange, _ style: LineStyle) -> TextEdit {
        let ns = text as NSString
        let span = lines(in: ns, touching: selection)
        if let all = selectedLines(ns, in: span, selection: selection) {
            let has = all.allSatisfy { lineStyle(of: $0).style == style }
            // Numbers count up within each depth, and start again under a new parent.
            var counts: [Int: Int] = [:]
            return restyle(ns, span: span) { line in
                let now = lineStyle(of: line)
                if has { return (now.length, now.indent) }
                switch style {
                case .bulleted: return (now.length, now.indent + "* ")
                case .dashed: return (now.length, now.indent + "- ")
                case .quote: return (now.length, "> ")
                case .numbered:
                    let depth = now.indent.replacingOccurrences(of: "\t", with: "  ").count / 2
                    for deeper in counts.keys where deeper > depth { counts[deeper] = nil }
                    counts[depth, default: 0] += 1
                    return (now.length, now.indent + "\(counts[depth]!). ")
                }
            }
        }
        let lineRange = ns.lineRange(for: NSRange(location: selection.location, length: 0))
        let line = ns.substring(with: lineRange).trimmingCharacters(in: .newlines)
        let (current, indent, prefixLen) = lineStyle(of: line)
        let new: String
        if current == style {
            new = indent
        } else {
            switch style {
            case .bulleted: new = indent + "* "
            case .dashed: new = indent + "- "
            case .numbered: new = indent + "1. "
            case .quote: new = "> "
            }
        }
        let delta = (new as NSString).length - prefixLen
        return TextEdit(range: NSRange(location: lineRange.location, length: prefixLen), replacement: new, caret: max(lineRange.location + (new as NSString).length, selection.location + delta))
    }

    /// How much of a line's start marks its style: a heading's `## `, a list item's `* ` or
    /// `- [ ] ` (with its indent), a quote's `> `.
    private static func stylePrefixLength(_ line: String) -> Int {
        if let h = line.range(of: #"^#{1,6}( +|$)"#, options: .regularExpression) { return (line[h] as Substring).utf16.count }
        if let q = line.range(of: #"^[ \t]*>[ \t]?"#, options: .regularExpression) { return (line[q] as Substring).utf16.count }
        return ListPrefix(line: line)?.length ?? 0
    }

    /// Format → Title / Heading / Subheading / Body (level 1, 2, 3 or 0), like Notes: the caret's
    /// line (or every selected line) becomes that, whatever it was: a list item or a quote loses
    /// its marker. Choosing it again changes nothing.
    static func paragraph(in text: String, selection: NSRange, level: Int) -> TextEdit {
        let ns = text as NSString
        let new = level == 0 ? "" : String(repeating: "#", count: level) + " "
        let span = lines(in: ns, touching: selection)
        if selectedLines(ns, in: span, selection: selection) != nil {
            return restyle(ns, span: span) { (stylePrefixLength($0), new) }
        }
        let lineRange = ns.lineRange(for: NSRange(location: min(selection.location, ns.length), length: 0))
        let line = ns.substring(with: lineRange).trimmingCharacters(in: .newlines)
        let old = stylePrefixLength(line)
        let n = (new as NSString).length
        let at = lineRange.location + n + max(0, selection.location - lineRange.location - old)
        let length = min(selection.length, max(0, NSMaxRange(selection) - lineRange.location - old))
        return TextEdit(range: NSRange(location: lineRange.location, length: old), replacement: new, caret: at + length,
                        selection: length > 0 ? NSRange(location: at, length: length) : nil)
    }

    /// Whether the caret's line, or a selected line, is a heading (`#` to `######`).
    static func touchesHeading(in text: String, selection: NSRange) -> Bool {
        let ns = text as NSString
        return ns.substring(with: lines(in: ns, touching: selection)).components(separatedBy: .newlines)
            .contains { $0.range(of: #"^#{1,6}( |$)"#, options: .regularExpression) != nil }
    }

    /// The fenced code block (```` ``` ```` or `~~~`) the line at `location` is in, fences included:
    /// its opening fence line and its closing one (nil while it isn't closed yet).
    static func codeBlock(in ns: NSString, at location: Int) -> (open: NSRange, close: NSRange?)? {
        let target = ns.lineRange(for: NSRange(location: min(location, ns.length), length: 0)).location
        var open: (range: NSRange, fence: String)?
        var at = 0
        while at < ns.length {
            let line = ns.lineRange(for: NSRange(location: at, length: 0))
            let text = ns.substring(with: line).trimmingCharacters(in: .newlines)
            let fence = text.range(of: #"^ {0,3}(`{3,}|~{3,})"#, options: .regularExpression).map { String(text[$0]).trimmingCharacters(in: .whitespaces) }
            if let o = open {
                if let f = fence, f.first == o.fence.first, f.count >= o.fence.count, text.trimmingCharacters(in: .whitespaces) == f {
                    if target >= o.range.location && target <= line.location { return (o.range, line) }
                    open = nil
                }
            } else if let f = fence {
                open = (line, f)
            }
            if line.location > target, open == nil { return nil }
            at = NSMaxRange(line)
        }
        if let o = open, target >= o.range.location { return (o.range, nil) }
        return nil
    }

    /// Format → Monostyled, like Notes: the caret's line (or the selected lines) goes into a code
    /// block; in one already, the block's fences go and its lines are text again.
    static func toggleCodeBlock(in text: String, selection: NSRange) -> TextEdit {
        let ns = text as NSString
        if let block = codeBlock(in: ns, at: selection.location) {
            let openLength = block.open.length
            let inner: NSRange
            if let close = block.close {
                inner = NSRange(location: NSMaxRange(block.open), length: close.location - NSMaxRange(block.open))
            } else {
                inner = NSRange(location: NSMaxRange(block.open), length: ns.length - NSMaxRange(block.open))
            }
            var body = ns.substring(with: inner)
            let whole = NSRange(location: block.open.location, length: NSMaxRange(block.close ?? inner) - block.open.location)
            // The closing fence was the last line: the line before it keeps no extra line break.
            if let close = block.close, NSMaxRange(close) == ns.length, !ns.substring(with: close).hasSuffix("\n"), body.hasSuffix("\n") { body.removeLast() }
            let length = (body as NSString).length
            func map(_ p: Int) -> Int { block.open.location + min(max(0, p - block.open.location - openLength), length) }
            let a = map(selection.location), b = map(NSMaxRange(selection))
            return TextEdit(range: whole, replacement: body, caret: b, selection: b > a ? NSRange(location: a, length: b - a) : nil)
        }
        let span = lines(in: ns, touching: selection)
        let content = ns.substring(with: span)
        let replacement = content.hasSuffix("\n") ? "```\n" + content + "```\n" : "```\n" + content + "\n```"
        return TextEdit(range: span, replacement: replacement, caret: NSMaxRange(selection) + 4,
                        selection: selection.length > 0 ? NSRange(location: selection.location + 4, length: selection.length) : nil)
    }

    /// Format → Increase / Decrease Indent: nests the caret's list item (or every selected one)
    /// a level deeper or shallower, as Tab and Shift-Tab do. Lines that aren't list items stay.
    static func indentLines(in text: String, selection: NSRange, outdent: Bool) -> TextEdit? {
        let ns = text as NSString
        let span = lines(in: ns, touching: selection)
        guard selectedLines(ns, in: span, selection: selection) != nil else { return indent(in: text, selection: selection, outdent: outdent) }
        var changed = false
        let edit = restyle(ns, span: span) { line in
            guard let list = ListPrefix(line: line) else { return (0, "") }
            if !outdent { changed = true; return (0, "  ") }
            let drop = list.indent.hasPrefix("\t") ? 1 : min(2, list.indent.prefix { $0 == " " }.count)
            if drop > 0 { changed = true }
            return (drop, "")
        }
        return changed ? edit : nil
    }

    /// Sets the caret line's heading level (0 = body text).
    static func heading(in text: String, selection: NSRange, level: Int) -> TextEdit {
        let ns = text as NSString
        let lineRange = ns.lineRange(for: NSRange(location: selection.location, length: 0))
        let line = ns.substring(with: lineRange).trimmingCharacters(in: .newlines)
        var existing = 0
        while existing < line.count, line[line.index(line.startIndex, offsetBy: existing)] == "#" { existing += 1 }
        var prefixLen = existing
        if existing > 0, prefixLen < line.count, line[line.index(line.startIndex, offsetBy: prefixLen)] == " " { prefixLen += 1 }
        let newPrefix = level == 0 || level == existing ? "" : String(repeating: "#", count: level) + " "
        let delta = (newPrefix as NSString).length - prefixLen
        return TextEdit(range: NSRange(location: lineRange.location, length: prefixLen), replacement: newPrefix, caret: max(lineRange.location, selection.location + delta))
    }
}

/// A table or embed: one block in the text that the caret goes around.
struct EditorBlock: Equatable {
    /// The block's lines, without the final newline.
    var range: NSRange
    /// The grid's index when the block is a table.
    var grid: Int?

    /// Positions inside the block's hidden markdown, both ends included.
    func contains(_ location: Int) -> Bool { location >= range.location && location <= NSMaxRange(range) }

    static func find(in text: String) -> [EditorBlock] { NoteStructure(text).blocks }
}

/// What to do with a caret that landed where it can't be.
enum CaretFix: Equatable {
    case move(Int)
    /// A table or embed ends the note: add a line after it for the caret.
    case newLineAfter(Int)
    /// A table or embed starts the note: add a line before it.
    case newLineBefore(Int)
    case enterGrid(Int, GridCell)
}

/// A request for a grid to take the keyboard, at a cell.
struct GridFocusRequest: Equatable {
    var grid: Int
    var cell: GridCell
    var token = UUID()
}

/// Fenced code blocks, which never hold tables or embeds.
enum CodeRanges {
    static func find(in text: String) -> [NSRange] {
        let ns = text as NSString
        var out: [NSRange] = []
        var start: Int?
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byParagraphs, .substringNotRequired]) { _, r, _, _ in
            let t = ns.substring(with: r).trimmingCharacters(in: .whitespaces)
            guard t.hasPrefix("```") || t.hasPrefix("~~~") else { return }
            if let s = start { out.append(NSRange(location: s, length: NSMaxRange(r) - s)); start = nil } else { start = r.location }
        }
        return out
    }
}

/// What Delete does next to a block.
enum BlockDelete: Equatable {
    /// Mark the table (it shows selected); a second press removes it.
    case arm(Int)
    case delete(TextEdit)
}
