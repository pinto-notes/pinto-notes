#if os(macOS)
import AppKit

/// What VoiceOver gets from the note on the Mac: the words as they're drawn, and rotors for its
/// headings and links, as Notes gives them (council rounds 13 and 14: VoiceOver read "## Plan"
/// and "- [ ]" on every line).
///
/// The text keeps its characters, so every range VoiceOver asks about is the note's own and
/// editing with VoiceOver lands where it should; only what's spoken for a range leaves out the
/// markdown the styler hides (drawn in a clear colour: "## ", "- [ ] ", "**", a link's URL).
extension PaneTextView: NSAccessibilityCustomRotorItemSearchDelegate {
    /// The part of `text` in `range` as it reads on screen: hidden characters left out.
    static func spoken(_ text: NSAttributedString, in range: NSRange) -> NSAttributedString {
        let r = NSIntersectionRange(range, NSRange(location: 0, length: text.length))
        let out = NSMutableAttributedString()
        guard r.length > 0 else { return out }
        text.enumerateAttribute(.foregroundColor, in: r) { color, run, _ in
            if let c = color as? NSColor, (c.usingColorSpace(.sRGB)?.alphaComponent ?? 1) == 0 { return }
            out.append(text.attributedSubstring(from: run))
        }
        return out
    }

    override func accessibilityString(for range: NSRange) -> String? {
        guard let storage = textStorage else { return super.accessibilityString(for: range) }
        return Self.spoken(storage, in: range).string
    }

    override func accessibilityAttributedString(for range: NSRange) -> NSAttributedString? {
        guard let storage = textStorage else { return super.accessibilityAttributedString(for: range) }
        return Self.spoken(storage, in: range)
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
