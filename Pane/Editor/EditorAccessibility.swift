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
        let ns = text.string as NSString
        let r = NSIntersectionRange(range, NSRange(location: 0, length: ns.length))
        guard r.length > 0 else { return NSAttributedString() }
        let line = ns.lineRange(for: NSRange(location: r.location, length: 0))
        let wholeLine = r.location == line.location && NSMaxRange(r) <= NSMaxRange(line) && (NSMaxRange(r) == NSMaxRange(line) || ns.substring(with: NSRange(location: NSMaxRange(r), length: NSMaxRange(line) - NSMaxRange(r))).allSatisfy(\.isNewline))
        guard wholeLine else { return spokenInPlace(text, in: r) }
        let words = spoken(text, in: r)
        guard let lead = spokenLead(ns.substring(with: line)) else { return words }
        let out = NSMutableAttributedString(string: lead)
        out.append(words)
        return out
    }

    /// The range's text at its own length, hidden characters as spaces. VoiceOver reads a note in
    /// windows and counts its way on by what comes back: shorter text lost its place, and reading
    /// aloud stopped mid-word at the first checklist item (trace on the Air, 6 November 2026).
    /// A checklist's six hidden marks have room to say its state.
    static func spokenInPlace(_ text: NSAttributedString, in range: NSRange) -> NSAttributedString {
        let out = NSMutableAttributedString(attributedString: text.attributedSubstring(from: range))
        text.enumerateAttributes(in: range) { a, run, _ in
            let clear = (a[.foregroundColor] as? NSColor).map { ($0.usingColorSpace(.sRGB)?.alphaComponent ?? 1) == 0 } ?? false
            let tiny = (a[.font] as? NSFont).map { $0.pointSize < 0.1 } ?? false
            guard clear || tiny else { return }
            let here = NSRange(location: run.location - range.location, length: run.length)
            out.replaceCharacters(in: here, with: String(repeating: " ", count: run.length))
        }
        let ns = text.string as NSString
        var at = range.location
        while at < NSMaxRange(range) {
            let line = ns.lineRange(for: NSRange(location: at, length: 0))
            defer { at = max(NSMaxRange(line), at + 1) }
            let seen = NSIntersectionRange(line, range)
            let raw = ns.substring(with: line)
            let here = NSRange(location: seen.location - range.location, length: seen.length)
            // A table's text is hidden under its grid: read aloud it's still there, without its
            // pipes. A window can start part way along a row.
            if raw.hasPrefix("|") {
                let part = ns.substring(with: seen)
                let plain = spokenTableRow(raw) == "Table" ? String(repeating: " ", count: seen.length)
                    : part.replacingOccurrences(of: "|", with: " ")
                out.replaceCharacters(in: here, with: plain)
                continue
            }
            let word = raw.lowercased().hasPrefix("- [x] ") ? "Done, " : raw.hasPrefix("- [ ] ") ? "To do " : nil
            if let word, seen.location == line.location, seen.length >= 6 {
                out.replaceCharacters(in: NSRange(location: here.location, length: 6), with: word)
            }
        }
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
         NSAccessibilityCustomRotor(rotorType: .link, itemSearchDelegate: self),
         NSAccessibilityCustomRotor(label: Self.checklistRotorLabel, itemSearchDelegate: self)]
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

    /// The way to an item's line: walking the text goes word by word, one line at a time. Landed
    /// on one, ⇧⌘U ticks it.
    static let checklistRotorLabel = "Checklist items"

    func checklistRotorResult(from: NSRange?, next: Bool, filter: String = "") -> NSAccessibilityCustomRotor.ItemResult? {
        let ns = string as NSString
        var boxes = checklistCheckboxes()
        if !filter.isEmpty { boxes = boxes.filter { ($0.accessibilityLabel() ?? "").localizedCaseInsensitiveContains(filter) } }
        // By line: the range handed back starts after the item's marks, on its words.
        let at = from.map { ns.lineRange(for: NSRange(location: $0.location, length: 0)).location }
        guard let box = next ? boxes.first(where: { at == nil || $0.line > at! }) : boxes.last(where: { at == nil || $0.line < at! })
        else { return nil }
        let line = ns.lineRange(for: NSRange(location: box.line, length: 0))
        let words = ns.range(of: box.accessibilityLabel() ?? "", options: [], range: line)
        let result = NSAccessibilityCustomRotor.ItemResult(targetElement: self)
        result.targetRange = words.location == NSNotFound ? NSRange(location: box.line, length: 0) : words
        result.customLabel = (box.checked ? "Checked, " : "Unchecked, ") + (box.accessibilityLabel() ?? "")
        return result
    }

    nonisolated func rotor(_ rotor: NSAccessibilityCustomRotor, resultFor search: NSAccessibilityCustomRotor.SearchParameters) -> NSAccessibilityCustomRotor.ItemResult? {
        if rotor.type == .custom {
            let next = search.searchDirection == .next, filter = search.filterString
            let from = search.currentItem?.targetRange
            nonisolated(unsafe) var out: NSAccessibilityCustomRotor.ItemResult?
            MainActor.assumeIsolated { out = checklistRotorResult(from: from, next: next, filter: filter) }
            return out
        }
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
