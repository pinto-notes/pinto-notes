#if os(macOS)
import AppKit
import UniformTypeIdentifiers

/// What VoiceOver gets from the note on the Mac: the words as they're drawn, and rotors for its
/// headings and links, as Notes gives them (council rounds 13 and 14: VoiceOver read "## Plan"
/// and "- [ ]" on every line).
///
/// The text keeps its characters, so every range VoiceOver asks about is the note's own and
/// editing with VoiceOver lands where it should; only what's spoken for a range leaves out the
/// markdown the styler hides (drawn in a clear colour: "## ", "- [ ] ", "**", a link's URL).
extension PaneTextView {
    /// The note on pages: its width fits the page, on light paper in dark mode too.
    /// The PDF's Title and the print job's name: the note's, not the window's (round 22: "All Notes").
    override var printJobTitle: String { Self.fileName(for: string) }

    private func printOperation(_ info: NSPrintInfo) -> NSPrintOperation {
        if let manager = textLayoutManager { manager.ensureLayout(for: manager.documentRange) }
        info.horizontalPagination = .fit
        info.verticalPagination = .automatic
        info.isHorizontallyCentered = false
        info.isVerticallyCentered = false
        return NSPrintOperation(view: self, printInfo: info)
    }

    func printNote() {
        let op = printOperation(NSPrintInfo.shared.copy() as! NSPrintInfo)
        op.jobTitle = Self.fileName(for: string)
        onPaper(op)
    }

    /// The PDF of the note at `url`, with no panels.
    func writePDF(to url: URL) {
        let info = NSPrintInfo.shared.copy() as! NSPrintInfo
        info.jobDisposition = .save
        info.dictionary()[NSPrintInfo.AttributeKey.jobSavingURL] = url
        let op = printOperation(info)
        op.showsPrintPanel = false
        op.showsProgressPanel = false
        onPaper(op)
    }

    func exportPDF() {
        guard let window else { return }
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.pdf]
        panel.nameFieldStringValue = Self.fileName(for: string)
        panel.beginSheetModal(for: window) { [weak self] answer in
            guard answer == .OK, let url = panel.url else { return }
            self?.writePDF(to: url)
        }
    }

    /// The note's title as a file name: its first line, without its markdown or a path's slash.
    static func fileName(for text: String) -> String {
        let first = text.split(separator: "\n", maxSplits: 1).first.map(String.init) ?? ""
        let plain = first.drop { $0 == "#" || $0 == " " }.replacingOccurrences(of: "/", with: "-").replacingOccurrences(of: ":", with: "-")
        return plain.isEmpty ? "New Note" : plain
    }
}

extension PaneTextView: NSAccessibilityCustomRotorItemSearchDelegate {
    /// The part of `text` in `range` as it reads on screen: hidden characters left out.
    static func spoken(_ text: NSAttributedString, in range: NSRange) -> NSAttributedString {
        let r = NSIntersectionRange(range, NSRange(location: 0, length: text.length))
        let out = NSMutableAttributedString()
        guard r.length > 0 else { return out }
        text.enumerateAttributes(in: r) { a, run, _ in
            if let c = a[.foregroundColor] as? NSColor, (c.usingColorSpace(.sRGB)?.alphaComponent ?? 1) == 0 { return }
            // Hidden marks are also this small, and a quote gives its whole line a colour, so colour
            // alone read a quote's marks out (first real VoiceOver pass).
            if let f = a[.font] as? NSFont, f.pointSize < 0.1 { return }
            out.append(text.attributedSubstring(from: run))
        }
        // A table's lines are hidden under its grid: read as a line, a row says its cells, not nothing
        // (round 22: six blank lines). Across lines, the table's own element has them.
        if out.string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
           let row = spokenTableRow((text.string as NSString).substring(with: r)) {
            return NSAttributedString(string: row)
        }
        return out
    }

    /// A line as VoiceOver says it: what kind of line it is, then its words. A ticked item and an
    /// unticked one otherwise sound the same (first real VoiceOver pass, 6 November 2026).
    static func spokenLine(_ text: NSAttributedString, in range: NSRange) -> NSAttributedString {
        let words = spoken(text, in: range)
        let ns = text.string as NSString
        let r = NSIntersectionRange(range, NSRange(location: 0, length: ns.length))
        guard r.length > 0, r.location == 0 || ns.character(at: r.location - 1) == 10,
              let lead = spokenLead(ns.substring(with: ns.lineRange(for: NSRange(location: r.location, length: 0)))) else { return words }
        let out = NSMutableAttributedString(string: lead)
        out.append(words)
        return out
    }

    /// "Checked, " for "- [x] Done". Nil for a plain line.
    static func spokenLead(_ line: String) -> String? {
        let t = line.drop { $0 == " " || $0 == "\t" }
        for (start, lead) in [("- [x] ", "Checked, "), ("- [X] ", "Checked, "), ("* [x] ", "Checked, "), ("- [ ] ", "Unchecked, "), ("* [ ] ", "Unchecked, "), ("> ", "Quote, ")]
        where t.hasPrefix(start) { return lead }
        let hashes = t.prefix { $0 == "#" }.count
        if (1...6).contains(hashes), t.dropFirst(hashes).first == " " { return "Heading, " }
        return nil
    }

    /// "Place, Dish" for "| Place | Dish |"; "Table" for the line under its header. Nil if it isn't
    /// one line of a table.
    static func spokenTableRow(_ line: String) -> String? {
        let t = line.trimmingCharacters(in: .whitespacesAndNewlines)
        guard t.hasPrefix("|"), !t.contains("\n") else { return nil }
        let cells = t.split(separator: "|", omittingEmptySubsequences: false).dropFirst()
            .map { $0.trimmingCharacters(in: .whitespaces) }
        let filled = (t.hasSuffix("|") ? Array(cells.dropLast()) : cells)
        if filled.allSatisfy({ !$0.isEmpty && $0.allSatisfy { "-:".contains($0) } }) { return "Table" }
        return filled.map { $0.isEmpty ? "blank" : $0 }.joined(separator: ", ")
    }

    override func accessibilityString(for range: NSRange) -> String? {
        guard let storage = textStorage else { return super.accessibilityString(for: range) }
        return Self.spokenLine(storage, in: range).string
    }

    override func accessibilityAttributedString(for range: NSRange) -> NSAttributedString? {
        guard let storage = textStorage else { return super.accessibilityAttributedString(for: range) }
        return Self.spokenLine(storage, in: range)
    }

    override func accessibilityCustomRotors() -> [NSAccessibilityCustomRotor] {
        [NSAccessibilityCustomRotor(rotorType: .heading, itemSearchDelegate: self),
         NSAccessibilityCustomRotor(rotorType: .link, itemSearchDelegate: self)]
    }

    /// The headings' words: the title line, then every `#` line, without its hashes.
    func headingRanges() -> [NSRange] {
        let ns = string as NSString
        var out: [NSRange] = []
        var first = true
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byLines, .substringNotRequired]) { _, line, _, _ in
            defer { first = false }
            var start = line.location
            let end = NSMaxRange(line)
            var hashes = 0
            while start < end, ns.character(at: start) == 0x23, hashes < 7 { start += 1; hashes += 1 }
            let isHeading = (1...6).contains(hashes) && start < end && [0x20, 0x09].contains(ns.character(at: start))
            guard isHeading || (first && line.length > 0) else { return }
            while start < end, [0x20, 0x09].contains(ns.character(at: start)) { start += 1 }
            if start < end { out.append(NSRange(location: start, length: end - start)) }
        }
        return out
    }

    /// Every link in the note, in order: web links, note links and tags.
    func linkRanges() -> [NSRange] {
        guard let storage = textStorage else { return [] }
        var out: [NSRange] = []
        storage.enumerateAttribute(.link, in: NSRange(location: 0, length: storage.length)) { link, r, _ in
            guard link != nil, !Self.spoken(storage, in: r).string.isEmpty else { return }
            out.append(r)
        }
        return out
    }

    nonisolated func rotor(_ rotor: NSAccessibilityCustomRotor, resultFor search: NSAccessibilityCustomRotor.SearchParameters) -> NSAccessibilityCustomRotor.ItemResult? {
        let heading = rotor.type == .heading, from = search.currentItem?.targetRange
        let next = search.searchDirection == .next, filter = search.filterString
        // VoiceOver asks on the main thread; the result isn't Sendable, so it's handed out as is.
        nonisolated(unsafe) var out: NSAccessibilityCustomRotor.ItemResult?
        MainActor.assumeIsolated { out = rotorResult(heading: heading, from: from, next: next, filter: filter) }
        return out
    }

    func rotorResult(heading: Bool, from: NSRange?, next: Bool, filter: String = "") -> NSAccessibilityCustomRotor.ItemResult? {
        guard let storage = textStorage else { return nil }
        var items = heading ? headingRanges() : linkRanges()
        if !filter.isEmpty { items = items.filter { Self.spoken(storage, in: $0).string.localizedCaseInsensitiveContains(filter) } }
        let pick = next ? items.first { from == nil || $0.location > from!.location }
                        : items.last { from == nil || $0.location < from!.location }
        guard let r = pick else { return nil }
        let result = NSAccessibilityCustomRotor.ItemResult(targetElement: self)
        result.targetRange = r
        result.customLabel = Self.spoken(storage, in: r).string
        return result
    }
}
#endif
