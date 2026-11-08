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

    /// The arrow keys, line by line from the top of the note to the bottom and back: at every
    /// step the last line stays put, and the caret only ever moves one line (never skips one
    /// or jumps back).
    @Test(arguments: cases)
    func arrowingThroughMovesNothing(_ c: Case) async throws {
        let text = Self.note(c)
        let h = await EditorHarness(text)
        defer { h.close() }
        let ns = text as NSString
        let last = ns.range(of: "The last line.").location
        await h.select(ns.range(of: "Above").location)
        await h.settle(0.1)
        let rest = h.lineRect(at: last).minY
        var lines: [Int] = []
        for _ in 0..<12 {
            await h.press(EditorHarness.down)
            await h.settle(0.05)
            let y = h.lineRect(at: last).minY
            #expect(abs(y - rest) < 0.5, "\(c.name): down onto \(h.selection.location), the last line moved from \(rest) to \(y)")
            lines.append(Self.lineIndex(h.text, h.selection.location))
            if h.selection.location >= last { break }
        }
        #expect(h.selection.location >= last, "\(c.name): the arrows reach the last line: \(lines)")
        #expect(zip(lines, lines.dropFirst()).allSatisfy { $1 >= $0 }, "\(c.name): down never goes back up: \(lines)")
        for _ in 0..<12 {
            await h.press(EditorHarness.up)
            await h.settle(0.05)
            let y = h.lineRect(at: last).minY
            #expect(abs(y - rest) < 0.5, "\(c.name): up onto \(h.selection.location), the last line moved from \(rest) to \(y)")
            if h.selection.location <= ns.range(of: "Above").location { break }
        }
    }

    /// Return and Delete at an element's edges, pressed as keys, as Notes does them: every press
    /// does something you can see.
    struct Edge: CustomStringConvertible, Sendable {
        let name: String
        let element: String
        /// The caret, as an offset into `element`.
        let caret: Int
        let keys: [String]
        /// What `element` has become.
        let expected: String
        /// The caret afterwards, as an offset into `element`'s spot.
        let caretAfter: Int
        var description: String { name }
    }

    nonisolated static let edges: [Edge] = [
        Edge(name: "return after a bullet continues the list", element: "- An item", caret: 9, keys: ["return"], expected: "- An item\n- ", caretAfter: 12),
        // A blank line closes the list, or Markdown would take the next line into the last item.
        Edge(name: "return on an empty bullet ends the list", element: "- An item", caret: 9, keys: ["return", "return"], expected: "- An item\n\n", caretAfter: 11),
        Edge(name: "delete before a bullet's text takes the bullet", element: "- An item", caret: 2, keys: ["delete"], expected: "An item", caretAfter: 0),
        Edge(name: "return after a task adds a task", element: "- [ ] A task", caret: 12, keys: ["return"], expected: "- [ ] A task\n- [ ] ", caretAfter: 19),
        Edge(name: "delete before a task's text takes the box", element: "- [ ] A task", caret: 6, keys: ["delete"], expected: "A task", caretAfter: 0),
        Edge(name: "return after a number counts on", element: "1. An item", caret: 10, keys: ["return"], expected: "1. An item\n2. ", caretAfter: 14),
        Edge(name: "return after a heading is body text", element: "# Heading", caret: 9, keys: ["return"], expected: "# Heading\n", caretAfter: 10),
        Edge(name: "return after a quote continues it", element: "> A quote", caret: 9, keys: ["return"], expected: "> A quote\n> ", caretAfter: 12),
        Edge(name: "return on an empty quote line ends it", element: "> A quote", caret: 9, keys: ["return", "return"], expected: "> A quote\n", caretAfter: 10),
        Edge(name: "delete before a quote's text takes the quote", element: "> A quote", caret: 2, keys: ["delete"], expected: "A quote", caretAfter: 0),
        Edge(name: "left from a quote's text goes to the line above", element: "> A quote", caret: 2, keys: ["left"], expected: "> A quote", caretAfter: -1),
        Edge(name: "left from a bullet's text goes to the line above", element: "- An item", caret: 2, keys: ["left"], expected: "- An item", caretAfter: -1),
        Edge(name: "return after a divider starts a line under it", element: "---", caret: 3, keys: ["return"], expected: "---\n", caretAfter: 4),
        Edge(name: "return in code stays in the block", element: "```\nlet a = 1\n```", caret: 13, keys: ["return"], expected: "```\nlet a = 1\n\n```", caretAfter: 14),
    ]

    @Test(arguments: edges)
    func edgesDoWhatNotesDoes(_ e: Edge) async throws {
        let text = "Title\n\nAbove.\n\n\(e.element)\n\nBelow."
        let h = await EditorHarness(text)
        defer { h.close() }
        let start = (text as NSString).range(of: e.element).location
        await h.select(start + e.caret)
        for k in e.keys {
            switch k {
            case "return": await h.press(EditorHarness.returnKey)
            case "delete": await h.press(EditorHarness.delete)
            default: await h.press(EditorHarness.left)
            }
        }
        #expect(h.text == "Title\n\nAbove.\n\n\(e.expected)\n\nBelow.", "\(e.name): \(h.text.debugDescription)")
        #expect(h.selection.location == start + e.caretAfter, "\(e.name): the caret at \(h.selection.location - start)")
    }

    static func lineIndex(_ s: String, _ at: Int) -> Int {
        (s as NSString).substring(to: min(at, (s as NSString).length)).filter { $0 == "\n" }.count
    }
}
#endif
