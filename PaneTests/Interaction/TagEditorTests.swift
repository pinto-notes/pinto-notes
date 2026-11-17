#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Tags in the real Mac editor: accent-coloured text that shows its notes on click, never in
/// code, headings' marks, links or the title, and offered from the library as you type `#`.
@MainActor @Suite(.serialized, .experiment(.tags, on: false)) struct TagEditorTests {
    static let text = """
    Trip planning #notatag
    Book the flights #travel and ask Sara (#family/sara).
    ## Packing
    Not in `#code`, not a [link](#anchor), not issue #42.
    https://example.com/#frag
    """

    func range(_ s: String, in h: EditorHarness) -> NSRange { (h.text as NSString).range(of: s) }

    func color(_ h: EditorHarness, at s: String) -> String {
        IncrementalStyleTests.resolve(h.view.textStorage!.attribute(.foregroundColor, at: range(s, in: h).location, effectiveRange: nil))
    }

    func link(_ h: EditorHarness, at s: String) -> LinkPolicy.Action {
        LinkPolicy.action(for: h.view.textStorage!.attribute(.link, at: range(s, in: h).location, effectiveRange: nil) as Any)
    }

    @Test func tagsShowInTheAccentAndLinkToTheirNotes() async {
        let h = await EditorHarness(Self.text, focus: false)
        defer { h.close() }
        let accent = IncrementalStyleTests.resolve(PColor.paneLinkText)
        #expect(color(h, at: "#travel") == accent)
        #expect(color(h, at: "travel and") == accent, "the name shows, coloured, with its #")
        #expect(link(h, at: "#travel") == .tag("travel"))
        #expect(link(h, at: "#family/sara") == .tag("family/sara"))
        #expect(color(h, at: " and ask") != accent)
        // Not tags: the title line, inline code, a link's address, a number, an address.
        #expect(color(h, at: "#notatag") != accent)
        #expect(link(h, at: "#code") == .nothing)
        #expect(color(h, at: "#42") != accent)
        #expect(link(h, at: "#frag") != .tag("frag"))
        #expect(link(h, at: "#anchor") != .tag("anchor"))
        await h.snapshot("tags-light")
    }

    @Test func aTagInACodeBlockIsCode() async {
        let h = await EditorHarness("Note\n```\n#notatag\n```\nAfter #real", focus: false)
        defer { h.close() }
        #expect(link(h, at: "#notatag") == .nothing)
        #expect(link(h, at: "#real") == .tag("real"))
    }

    @Test func clickingATagShowsItsNotes() async {
        let h = await EditorHarness(Self.text, focus: false)
        defer { h.close() }
        var opened: [String] = []
        h.controller.openTag = { opened.append($0) }
        for word in ["#travel", "#family/sara"] {
            let r = range(word, in: h)
            let screen = h.view.firstRect(forCharacterRange: NSRange(location: r.location + 2, length: 1), actualRange: nil)
            let p = h.view.convert(h.window.convertFromScreen(screen), from: nil)
            await h.click(CGPoint(x: p.midX, y: p.midY))
        }
        #expect(opened == ["travel", "family/sara"])
    }

    /// While the caret is in a tag it's being written: still coloured, but no link, so a click
    /// there moves the caret instead of leaving the note.
    @Test func aTagBeingWrittenIsNotALink() async {
        let h = await EditorHarness(Self.text)
        defer { h.close() }
        await h.caret(after: "#trav")
        #expect(color(h, at: "#travel") == IncrementalStyleTests.resolve(PColor.paneLinkText))
        #expect(link(h, at: "#travel") == .nothing)
        #expect(link(h, at: "#family/sara") == .tag("family/sara"))
    }

    @Test func typingAHashOffersTheLibrarysTags() async {
        let h = await EditorHarness("Plan\n")
        defer { h.close() }
        h.controller.suggestTags = { typed in Tags.suggestions(typed, from: [Tags.Entry(name: "work", count: 4), Tags.Entry(name: "work/clients", count: 2), Tags.Entry(name: "home", count: 1)]) }
        await h.select((h.text as NSString).length)
        await h.type("# ")
        #expect(h.controller.wikiSuggestions.isEmpty, "a heading being typed brings nothing up")
        await h.press(EditorHarness.delete)
        await h.press(EditorHarness.delete)
        await h.type("Call #wo")
        #expect(h.controller.wikiTags)
        #expect(h.controller.wikiSuggestions == ["work", "work/clients"])
        #expect(h.view.subviews.contains { $0 is NSHostingView<WikiSuggestionList> }, "the list shows under the caret")
        await h.snapshot("tag-suggestions-light")
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.returnKey)
        #expect(h.text == "Plan\nCall #work/clients ", "the tag goes in with a space after it")
        #expect(h.selection == NSRange(location: (h.text as NSString).length, length: 0))
        #expect(h.controller.wikiSuggestions.isEmpty)
        // Typed in full, nothing more to offer: Return makes a new line.
        await h.type("#home")
        #expect(h.controller.wikiSuggestions.isEmpty)
        await h.press(EditorHarness.returnKey)
        #expect(h.text.hasPrefix("Plan\nCall #work/clients #home\n"))
    }

    @Test func darkMode() async {
        let h = await EditorHarness(Self.text, dark: true, focus: false)
        defer { h.close() }
        #expect(color(h, at: "#travel") == IncrementalStyleTests.resolve(PColor.paneLinkText))
        await h.snapshot("tags-dark")
    }
}
#endif
