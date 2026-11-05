#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// VoiceOver reads a note's words, not its markdown, and finds its headings and links by rotor
/// (council rounds 13 and 14).
@MainActor @Suite(.serialized) struct EditorAccessibilityTests {
    static let note = "Lisbon\n## Plan\n- [ ] Tram 28\n**Pastries** in May\nSee [the site](https://example.com) and [[Hotel booking]]\n\n"

    func line(_ h: EditorHarness, _ n: Int) -> NSRange {
        let ns = h.view.string as NSString
        var lines: [NSRange] = []
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byLines, .substringNotRequired]) { _, r, _, _ in lines.append(r) }
        return lines[n]
    }

    @Test func linesReadAsTheyLook() async {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await h.select((h.view.string as NSString).length)
        let v = h.view
        #expect(v.accessibilityString(for: line(h, 1)) == "Plan", "no hashes")
        #expect(v.accessibilityString(for: line(h, 2)) == "Tram 28", "no \"- [ ]\": the checkbox says it")
        #expect(v.accessibilityString(for: line(h, 3)) == "Pastries in May", "no asterisks")
        let links = v.accessibilityString(for: line(h, 4)) ?? ""
        #expect(!links.contains("https") && !links.contains("[") && !links.contains("("), "\(links)")
        #expect(links.contains("the site") && links.contains("Hotel booking"), "\(links)")
        #expect(v.accessibilityAttributedString(for: line(h, 1))?.string == "Plan")
        // The ranges are the note's own: the text keeps its characters for editing.
        #expect(v.accessibilityNumberOfCharacters() == (v.string as NSString).length)
    }

    /// A line straight under a list item belongs to it, and the parser placed its bold and links
    /// 6 characters late: "ri" in "Pastries" was hidden and the asterisks showed (round 15).
    @Test func markupUnderAListItemIsHiddenWhereItIs() async {
        for item in ["- [ ] Tram 28", "- Tram 28", "1. Tram 28", "  - [x] Tram 28"] {
            let h = await EditorHarness("Lisbon\n\(item)\n**Pastries** and *tiles* in `May` [site](https://example.com)\n\n")
            defer { h.close() }
            await h.select((h.view.string as NSString).length)
            let storage = h.view.textStorage!, ns = h.view.string as NSString
            let l = line(h, 2)
            var hidden = ""
            storage.enumerateAttribute(.foregroundColor, in: l) { c, r, _ in
                if let c = c as? NSColor, (c.usingColorSpace(.sRGB)?.alphaComponent ?? 1) == 0 { hidden += ns.substring(with: r) }
            }
            #expect(hidden == "******``[](https://example.com)", "\(item): hidden \(hidden.debugDescription)")
            let bold = (storage.attribute(.font, at: l.location + 2, effectiveRange: nil) as? NSFont)?.fontDescriptor.symbolicTraits.contains(.bold)
            #expect(bold == true, "\(item): the P is bold")
        }
    }

    @Test func rotorsFindHeadingsAndLinks() async {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await h.select((h.view.string as NSString).length)
        let v = h.view
        #expect(v.accessibilityCustomRotors().map(\.type) == [.heading, .link])
        let title = v.rotorResult(heading: true, from: nil, next: true)
        #expect(title?.customLabel == "Lisbon", "the title first")
        let plan = v.rotorResult(heading: true, from: title?.targetRange, next: true)
        #expect(plan?.customLabel == "Plan")
        #expect(v.rotorResult(heading: true, from: plan?.targetRange, next: true) == nil, "no more")
        #expect(v.rotorResult(heading: true, from: plan?.targetRange, next: false)?.customLabel == "Lisbon", "and back")
        var links: [String] = []
        var at: NSRange?
        while links.count < 10, let r = v.rotorResult(heading: false, from: at, next: true) {
            links.append(r.customLabel ?? ""); at = r.targetRange
        }
        #expect(links == ["the site", "Hotel booking"], "\(links)")
        #expect(v.rotorResult(heading: false, from: nil, next: true, filter: "hotel")?.customLabel == "Hotel booking")
    }
}
#endif
