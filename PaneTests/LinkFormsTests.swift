import Foundation
import Testing
@testable import Pane

/// A link alone on its line: a link, compact or a card, and back (Emil, 11-01).
struct LinkFormsTests {
    @Test func webLinks() throws {
        let bare = try #require(LinkForms.parse("https://visitlisboa.com"))
        #expect(bare.style == .compact)
        #expect(LinkForms.choices(for: bare) == [.link, .card])
        #expect(LinkForms.write(bare, as: .card) == "<https://visitlisboa.com>")
        #expect(LinkForms.write(bare, as: .link, title: "Visit Lisboa") == "[Visit Lisboa](https://visitlisboa.com)")
        let card = try #require(LinkForms.parse("  <https://visitlisboa.com/en>"))
        #expect(card.style == .card)
        #expect(LinkForms.write(card, as: .compact) == "  https://visitlisboa.com/en", "the indent is kept")
        let link = try #require(LinkForms.parse("[Visit Lisboa](https://visitlisboa.com)"))
        #expect(link.style == .link)
        #expect(LinkForms.write(link, as: .card) == "<https://visitlisboa.com>")
        #expect(LinkForms.parse("See https://visitlisboa.com today") == nil, "a link in a sentence is just a link")
    }

    @Test func noteLinks() throws {
        let link = try #require(LinkForms.parse("[[Hotel booking]]"))
        #expect(link.style == .link && LinkForms.choices(for: link) == [.card])
        #expect(LinkForms.write(link, as: .card) == "![[Hotel booking]]")
        let card = try #require(LinkForms.parse("![[Hotel booking]]"))
        #expect(LinkForms.write(card, as: .link) == "[[Hotel booking]]")
    }

    @Test func files() throws {
        let id = UUID()
        let line = "[Flight itinerary.pdf](pane-file:\(id.uuidString.lowercased()))"
        let compact = try #require(LinkForms.parse(line))
        #expect(compact.style == .compact)
        #expect(LinkForms.write(compact, as: .card) == "!" + line)
        #expect(LinkForms.parse("![Sunset.png](pane-file:\(id.uuidString.lowercased()))") == nil, "a picture is a picture")
    }

    #if os(macOS)
    @Test func rightClickOffersTheOtherStyles() {
        #expect(PaneTextView.linkStyles(for: "[[Hotel booking]]").map(\.line) == ["![[Hotel booking]]"])
        #expect(PaneTextView.linkStyles(for: "[Visit Lisboa](https://visitlisboa.com)").map(\.title) == ["Show Compact", "Show as Card"])
        #expect(PaneTextView.linkStyles(for: "Plain text").isEmpty)
        #expect(PaneTextView.linkStyles(for: "https://visitlisboa.com").isEmpty, "a compact link has its own menu")
    }
    #endif

    @Test func embedsFollowTheForm() {
        let id = UUID().uuidString.lowercased()
        func card(_ line: String) -> Bool? { LineEmbed.find(in: line).first?.card }
        #expect(card("https://visitlisboa.com") == false)
        #expect(card("<https://visitlisboa.com>") == true)
        #expect(card("[Flight.pdf](pane-file:\(id))") == false)
        #expect(card("![Flight.pdf](pane-file:\(id))") == true)
        #expect(LineEmbed.find(in: "![[Hotel booking]]").first?.kind == .wiki("Hotel booking"))
        #expect(LineEmbed.find(in: "[[Hotel booking]]").isEmpty, "a note link is a link")
        #expect(LineEmbed.find(in: "[Visit Lisboa](https://visitlisboa.com)").isEmpty, "a written link is a link")
        if case .image = LineEmbed.find(in: "![Sunset.png](pane-file:\(id))").first?.kind {} else { Issue.record("a picture stays a picture") }
        #expect(LineEmbed.find(in: "<https://a.com>").first.map { $0.height } == LineEmbed.cardHeight)
        #expect(LineEmbed.find(in: "https://a.com").first.map { $0.height } == LineEmbed.compactHeight)
    }
}

#if os(macOS)
import AppKit

/// A written link's markup stays hidden with the caret beside it, and shows only when the caret is
/// inside it to edit (council round 16: the URL popped out with the caret at the end of the line).
@MainActor @Suite(.serialized) struct LinkMarkupRevealTests {
    @Test func theMarkupShowsOnlyWithTheCaretInside() async {
        let text = "Trip\n\nSee [Visit Lisboa](https://visitlisboa.com)\n\nAfter"
        let h = await EditorHarness(text)
        defer { h.close() }
        let ns = text as NSString
        let link = ns.range(of: "[Visit Lisboa](https://visitlisboa.com)")
        let bracket = ns.range(of: "](").location
        func shows() -> Bool {
            let c = h.view.textStorage?.attribute(.foregroundColor, at: bracket, effectiveRange: nil) as? NSColor
            return c == PColor.paneTertiary
        }
        await h.select(NSMaxRange(link))
        await h.settle(0.2)
        #expect(!shows(), "caret after the link, at the end of its line")
        await h.select(link.location - 2)
        await h.settle(0.2)
        #expect(!shows(), "caret earlier on the same line")
        await h.select(ns.range(of: "Lisboa]").location)
        await h.settle(0.2)
        #expect(!shows(), "caret in the link's words: written out, the address rewrapped the paragraph (8 November 2026)")
        await h.select(bracket + 5)
        await h.settle(0.2)
        #expect(shows(), "caret inside the link's address")
        await h.select(ns.range(of: "After").location)
        await h.settle(0.2)
        #expect(!shows(), "caret on another line")
    }
}
#endif
