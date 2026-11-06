#if os(macOS)
import AppKit
import PDFKit
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

    /// Space after "[]" or "[ ]" makes a checklist item, on a plain line or after a dash; "- [ ]"
    /// is one already, and brackets in code or text stay brackets (round 20).
    @Test func typedBracketsMakeAChecklistItem() async {
        func typed(_ before: String, rest: String = "") -> String? {
            let at = NSRange(location: (before as NSString).length, length: 0)
            let text = before + rest
            guard let e = ListEditing.spaceKey(in: text, selection: at) else { return nil }
            return (text as NSString).replacingCharacters(in: e.range, with: e.replacement)
        }
        #expect(typed("Trip\n[]") == "Trip\n- [ ] ")
        #expect(typed("Trip\n[ ]") == "Trip\n- [ ] ")
        #expect(typed("[x]") == "- [x] ")
        #expect(typed("  [ ]") == "  - [ ] ", "keeps its indent")
        #expect(typed("- []") == "- [ ] ", "after a dash")
        #expect(typed("[ ]", rest: "Hat") == "- [ ] Hat", "words after the caret stay")
        #expect(typed("- [ ]") == nil, "the space makes it an item by itself")
        #expect(typed("See [ ]") == nil, "not in the middle of a line")
        #expect(typed("```\n[ ]") == nil, "not in code")
        let h = await EditorHarness("Trip\n")
        defer { h.close() }
        await h.select((h.view.string as NSString).length)
        for c in "[ ] Hat" { await h.type(String(c)) }
        #expect(h.view.string == "Trip\n- [ ] Hat")
    }

    /// Print and Export as PDF: the note in pages, its tables drawn on them (round 21: the words
    /// were in the file, hidden, and the table was a hole), and the note's look back afterwards,
    /// in dark mode as well (round 20: neither was in the File menu).
    @Test func theNoteExportsAsAPDF() async throws {
        /// How much of the page is dark ink, and the file's pages.
        func exported(_ text: String) async throws -> (ink: Int, pages: Int, words: String) {
            let h = await EditorHarness(text)
            defer { h.close() }
            await h.settle(0.3)
            h.view.appearance = NSAppearance(named: .darkAqua)
            await h.settle(0.2)
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".pdf")
            defer { try? FileManager.default.removeItem(at: url) }
            h.view.writePDF(to: url)
            #expect(h.view.appearance?.name == .darkAqua, "the look is back")
            #expect(h.view.subviews.allSatisfy { !($0 is NSImageView) }, "the stand-in pictures are gone")
            #expect(h.view.subviews.allSatisfy { !($0 is GridHostingView && $0.isHidden) }, "the tables are back")
            let pdf = try #require(PDFDocument(url: url))
            let page = try #require(pdf.page(at: 0))
            let size = page.bounds(for: .mediaBox).size
            let image = page.thumbnail(of: CGSize(width: size.width * 2, height: size.height * 2), for: .mediaBox)
            let rep = try #require(image.tiffRepresentation.flatMap(NSBitmapImageRep.init(data:)))
            var ink = 0
            for y in stride(from: 0, to: rep.pixelsHigh, by: 2) {
                for x in stride(from: 0, to: rep.pixelsWide, by: 2) {
                    if let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.sRGB), c.brightnessComponent < 0.5 { ink += 1 }
                }
            }
            return (ink, pdf.pageCount, pdf.string ?? "")
        }
        let top = "Lisbon\n\nTram 28\n\n"
        let plain = try await exported(top + "End\n")
        let table = try await exported(top + "| Place | Dish |\n| --- | --- |\n| Manteigaria | Pastel de nata |\n| Time Out Market | A bit of everything |\n\nEnd\n")
        #expect(plain.pages == 1)
        #expect(plain.words.contains("Tram 28"), "\(plain.words)")
        #expect(plain.ink > 50, "dark ink on the page in dark mode: \(plain.ink)")
        #expect(Double(table.ink) > Double(plain.ink) * 1.3, "the table is drawn: \(table.ink) against \(plain.ink)")
        #expect(PaneTextView.fileName(for: "# Plan / May\nText") == "Plan - May")
        #expect(PaneTextView.fileName(for: "") == "New Note")
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
