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
