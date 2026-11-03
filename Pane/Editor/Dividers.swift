import Foundation

/// Divider lines: `---` on a line of its own, drawn as a hairline across the note
/// (LineDecoration.rule). Format › Divider puts one in (Emil, 3 November 2026: "I also want
/// divider lines").
enum Dividers {
    /// A divider under the caret's line, or in place of it when the line is empty; the caret goes
    /// to the line after it. Markdown reads `---` right under text as that text's heading
    /// underline, so a blank line always comes between them.
    static func insert(in text: String, selection: NSRange) -> TextEdit {
        let ns = text as NSString
        let at = min(NSMaxRange(selection), ns.length)
        let line = ns.lineRange(for: NSRange(location: at, length: 0))
        var content = line
        if content.length > 0, ns.character(at: NSMaxRange(content) - 1) == 0x0A { content.length -= 1 }
        let blank = ns.substring(with: content).trimmingCharacters(in: .whitespaces).isEmpty
        let atEnd = NSMaxRange(content) >= ns.length

        if blank {
            // Above it: the line before, if it has text, needs a blank line between.
            var lead = ""
            if content.location > 0 {
                let prev = ns.lineRange(for: NSRange(location: content.location - 1, length: 0))
                if !ns.substring(with: prev).trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { lead = "\n" }
            }
            let body = lead + "---" + (atEnd ? "\n\n" : "")
            let caret = content.location + (body as NSString).length + (atEnd ? 0 : 1)
            return TextEdit(range: content, replacement: body, caret: caret)
        }
        // A blank line on both sides, as a divider typed by hand has: the text after it doesn't sit
        // tight under the line.
        let end = NSRange(location: NSMaxRange(content), length: 0)
        if atEnd {
            let body = "\n\n---\n\n"
            return TextEdit(range: end, replacement: body, caret: end.location + (body as NSString).length)
        }
        // Before a following line the old newline ends the divider's line; a blank line goes in
        // after it unless the next line is blank already. The caret goes to the next line.
        let next = ns.lineRange(for: NSRange(location: NSMaxRange(line), length: 0))
        let nextBlank = NSMaxRange(line) >= ns.length || ns.substring(with: next).trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        let body = "\n\n---" + (nextBlank ? "" : "\n")
        return TextEdit(range: end, replacement: body, caret: end.location + (body as NSString).length + 1)
    }
}
