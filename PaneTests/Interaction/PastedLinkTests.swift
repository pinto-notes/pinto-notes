#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// A web address pasted into a sentence is a link straight away (persona council r7, bug 5).
@MainActor @Suite(.serialized) struct PastedLinkTests {
    static let before = "Saturday\n- [ ] Train to Porto at 8:10\n\nMeet **Ana** at São Bento at 10.\nIdeas from [[Lisbon]] and "
    static let url = "https://www.visitporto.travel/en-GB"

    func isLink(_ h: EditorHarness) -> Bool {
        let at = (h.text as NSString).range(of: "visitporto").location
        return h.view.textStorage?.attribute(.link, at: at, effectiveRange: nil) != nil
    }

    @Test func aPastedAddressIsALinkAtOnce() async {
        let h = await EditorHarness(Self.before)
        defer { h.close() }
        await h.select((h.text as NSString).length)
        let pb = NSPasteboard.general
        let saved = pb.string(forType: .string)
        defer { pb.clearContents(); if let saved { pb.setString(saved, forType: .string) } }
        pb.clearContents(); pb.setString(Self.url, forType: .string)
        h.view.paste(nil)
        await h.settle(0.2)
        #expect(h.text == Self.before + Self.url)
        #expect(isLink(h), "pasted, caret after it")
    }

    /// Where an address ends, and where one isn't.
    @Test func theLinkStopsWhereTheAddressDoes() async {
        let h = await EditorHarness("T\n\nSee https://example.com/a_(b). Or (https://example.org), and `https://code.example`.\n[site](https://example.net) too", focus: false)
        defer { h.close() }
        let storage = h.view.textStorage!, ns = h.text as NSString
        func link(_ s: String) -> URL? { storage.attribute(.link, at: ns.range(of: s).location, effectiveRange: nil) as? URL }
        #expect(link("https://example.com")?.absoluteString == "https://example.com/a_(b)")
        #expect(link("https://example.org")?.absoluteString == "https://example.org")
        #expect(link("code.example") == nil, "in code")
        #expect(link("site")?.absoluteString == "https://example.net", "a markdown link as it was")
        let dot = ns.range(of: "). Or").location + 1
        #expect(storage.attribute(.link, at: dot, effectiveRange: nil) == nil, "the full stop isn't part of it")
    }

    @Test func anAddressInASentenceIsALink() async {
        let h = await EditorHarness(Self.before + Self.url)
        defer { h.close() }
        await h.select((h.text as NSString).length)
        #expect(isLink(h), "opened with the caret after it")
    }
}
#endif
