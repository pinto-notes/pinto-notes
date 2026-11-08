#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// Nothing below moves when the caret enters or leaves a text element (Emil, 8 November 2026:
/// "the whole note moves when i put my caret on the divider"; "its the quality in all of these
/// micro interactions that matter"). Each case puts the caret just outside the element, then on
/// it, and measures where the lines under it sit.
@MainActor @Suite(.serialized) struct TextMicroInteractionTests {
    struct Case: CustomStringConvertible, Sendable {
        let name: String
        let element: String
        /// Where in `element` the caret goes when it's on it.
        let caretInElement: Int
        var description: String { name }
    }

    nonisolated static let cases: [Case] = [
        Case(name: "divider", element: "---", caretInElement: 0),
        Case(name: "divider end", element: "---", caretInElement: 3),
        Case(name: "heading 1", element: "# Heading", caretInElement: 4),
        Case(name: "heading 2", element: "## Heading", caretInElement: 5),
        Case(name: "heading 3", element: "### Heading", caretInElement: 6),
        Case(name: "bullet", element: "- An item", caretInElement: 4),
        Case(name: "star bullet", element: "* An item", caretInElement: 4),
        Case(name: "numbered", element: "1. An item", caretInElement: 5),
        Case(name: "checklist", element: "- [ ] A task", caretInElement: 8),
        Case(name: "ticked", element: "- [x] Done task", caretInElement: 8),
        Case(name: "quote", element: "> A quote", caretInElement: 4),
        Case(name: "bold", element: "Some **bold** words", caretInElement: 9),
        Case(name: "italic", element: "Some *italic* words", caretInElement: 8),
        Case(name: "inline code", element: "Some `code` words", caretInElement: 7),
        Case(name: "strikethrough", element: "Some ~~gone~~ words", caretInElement: 8),
        Case(name: "link", element: "See [the site](https://example.com) now", caretInElement: 8),
        Case(name: "wikilink", element: "See [[Lisbon]] now", caretInElement: 8),
        Case(name: "code block", element: "```swift\nlet a = 1\n```", caretInElement: 12),
        Case(name: "code block fence", element: "```swift\nlet a = 1\n```", caretInElement: 2),
    ]

    static func note(_ c: Case) -> String { "Title\n\nAbove the element.\n\n\(c.element)\n\nBelow the element.\n\nThe last line." }

    @Test(arguments: cases)
    func nothingBelowMovesWhenTheCaretComesOn(_ c: Case) async throws {
        let text = Self.note(c)
        let h = await EditorHarness(text)
        defer { h.close() }
        let ns = text as NSString
        let element = ns.range(of: c.element)
        let last = ns.range(of: "The last line.").location
        let below = ns.range(of: "Below the element.").location
        // Off: on the line above, at its end.
        await h.select(NSMaxRange(ns.range(of: "Above the element.")))
        await h.settle(0.1)
        let restLast = h.lineRect(at: last), restBelow = h.lineRect(at: below)
        // On it.
        await h.select(element.location + c.caretInElement)
        await h.settle(0.1)
        let onLast = h.lineRect(at: last), onBelow = h.lineRect(at: below)
        #expect(abs(onLast.minY - restLast.minY) < 0.5, "\(c.name): the last line moved from \(restLast.minY) to \(onLast.minY) with the caret on it")
        #expect(abs(onBelow.minY - restBelow.minY) < 0.5, "\(c.name): the next line moved from \(restBelow.minY) to \(onBelow.minY)")
        // And back off, from below (the clip's path: the line under it, then onto it).
        await h.select(below)
        await h.settle(0.1)
        #expect(abs(h.lineRect(at: last).minY - restLast.minY) < 0.5, "\(c.name): back off it, the last line is where it was")
    }
}
#endif
