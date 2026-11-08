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
        Case(name: "a long line of bold", element: Array(repeating: "some **bold** and *more* words", count: 6).joined(separator: " "), caretInElement: 30),
        Case(name: "a long line of links", element: Array(repeating: "see [[Lisbon]] and [a site](https://example.com/a/long/path)", count: 3).joined(separator: " "), caretInElement: 8),
        Case(name: "a long heading", element: "## " + Array(repeating: "A heading that runs on", count: 4).joined(separator: " "), caretInElement: 8),
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

    /// Selecting across the element (from the line above into the line below, then shift-arrowing
    /// on) moves nothing below either.
    @Test(arguments: cases)
    func selectingAcrossMovesNothing(_ c: Case) async throws {
        let text = Self.note(c)
        let h = await EditorHarness(text)
        defer { h.close() }
        let ns = text as NSString
        let last = ns.range(of: "The last line.").location
        let from = ns.range(of: "the element.").location
        await h.select(from)
        await h.settle(0.1)
        let rest = h.lineRect(at: last).minY
        await h.select(from, ns.range(of: "Below").location + 3 - from)
        await h.settle(0.1)
        #expect(abs(h.lineRect(at: last).minY - rest) < 0.5, "\(c.name): selected across, the last line moved from \(rest) to \(h.lineRect(at: last).minY)")
        await h.press(EditorHarness.left, .shift)
        await h.settle(0.1)
        #expect(abs(h.lineRect(at: last).minY - rest) < 0.5, "\(c.name): a shift-arrow on, the last line moved")
        await h.select(last)
        await h.settle(0.1)
        #expect(abs(h.lineRect(at: last).minY - rest) < 0.5, "\(c.name): after the selection, the last line moved")
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

    nonisolated static let typed: [String] = ["# ", "## ", "### ", "- ", "* ", "1. ", "- [ ] ", "[] ", "> ", "**", "`", "[[", "```\n", "```swift\n", "---\n"]

    /// Typing the Markdown that makes an element, then its first letter: the caret stands where
    /// the letter lands, and the letter moves nothing below (the element took its height as the
    /// marker was typed).
    @Test(arguments: typed)
    func typingAnElementsMarkdown(_ marker: String) async throws {
        let text = "Title\n\nAbove.\n\n\n\nBelow.\n\nThe last line."
        let h = await EditorHarness(text)
        defer { h.close() }
        let ns = text as NSString
        await h.select(ns.range(of: "Above.").location + 8)
        for ch in marker {
            if ch == "\n" { await h.press(EditorHarness.returnKey) } else { await h.type(String(ch)) }
        }
        await h.settle(0.1)
        let lastAt = (h.text as NSString).range(of: "The last line.").location
        let caret = h.view.firstRect(forCharacterRange: h.selection, actualRange: nil)
        let before = h.lineRect(at: lastAt).minY
        let at = h.selection.location
        await h.type("W")
        await h.settle(0.1)
        let letter = h.view.firstRect(forCharacterRange: NSRange(location: at, length: 1), actualRange: nil)
        let after = h.lineRect(at: (h.text as NSString).range(of: "The last line.").location).minY
        #expect((h.text as NSString).substring(with: NSRange(location: at, length: 1)) == "W", "\(marker): the letter went where the caret was: \(h.text.debugDescription)")
        #expect(abs(caret.minX - letter.minX) < 1, "\(marker): the caret stood at \(caret.minX), the letter landed at \(letter.minX)")
        #expect(abs(before - after) < 0.5, "\(marker): the first letter moved the last line from \(before) to \(after)")
    }

    /// Walking the caret along a long wrapped line letter by letter: each mark it passes is
    /// written out, and none of them may wrap a word onto a new line.
    @Test(arguments: [
        Array(repeating: "some **bold** and *more* words", count: 7).joined(separator: " "),
        Array(repeating: "see [[Lisbon]] and [a site](https://example.com/p) and `code`", count: 4).joined(separator: " "),
        "## " + Array(repeating: "A heading that runs on", count: 4).joined(separator: " "),
    ])
    func walkingALongLineMovesNothing(_ line: String) async throws {
        let text = "Title\n\nAbove.\n\n\(line)\n\nThe last line."
        let h = await EditorHarness(text, width: 560)
        defer { h.close() }
        let ns = text as NSString
        let last = ns.range(of: "The last line.").location
        let start = ns.range(of: line).location
        await h.select(start - 2)
        await h.settle(0.1)
        let rest = h.lineRect(at: last).minY
        // A link's address is written out while the caret is in it, to edit it: that may wrap.
        // Everywhere else, the words included, nothing below moves.
        let addresses = try NSRegularExpression(pattern: #"\]\([^)]*\)"#).matches(in: text, range: NSRange(location: 0, length: ns.length)).map(\.range)
        var moved: [String] = []
        await h.select(start)
        while h.selection.location < start + (line as NSString).length {
            let y = h.lineRect(at: last).minY
            let at = h.selection.location
            let inAddress = addresses.contains { at > $0.location && at < NSMaxRange($0) }
            if !inAddress, abs(y - rest) >= 0.5 { moved.append("\(at - start): \(y - rest)") }
            let before = h.selection.location
            await h.press(EditorHarness.right)
            if h.selection.location <= before { break }
        }
        #expect(moved.isEmpty, "the last line moved with the caret at \(moved.prefix(8)) (of \(line.prefix(30)))")
    }

    /// With the caret on a divider its dashes show, and the line after them runs level with
    /// them, not above (Emil, 8 November 2026: "why is the --- and the divider line not aligned").
    @Test func theDividerLineIsLevelWithItsDashes() async throws {
        let text = "Plan\n\n---\n\nAfter"
        let h = await EditorHarness(text)
        defer { h.close() }
        let at = (text as NSString).range(of: "---").location
        await h.select(at + 1)
        await h.settle(0.2)
        let line = h.lineRect(at: at)
        let view = h.view
        let rep = try #require(view.bitmapImageRepForCachingDisplay(in: view.bounds))
        view.cacheDisplay(in: view.bounds, to: rep)
        let scale = CGFloat(rep.pixelsWide) / view.bounds.width
        // The middle row of the ink in a band of columns, within the divider's line.
        func middle(_ xs: ClosedRange<CGFloat>) -> CGFloat? {
            var rows: [Int] = []
            for y in Int(line.minY * scale)..<Int(line.maxY * scale) {
                for x in stride(from: Int(xs.lowerBound * scale), through: Int(xs.upperBound * scale), by: 1) {
                    // The text view draws on a clear ground: ink is whatever is drawn at all.
                    if let c = rep.colorAt(x: x, y: y), c.alphaComponent > 0.04 { rows.append(y); break }
                }
            }
            guard let lo = rows.min(), let hi = rows.max() else { return nil }
            return CGFloat(lo + hi) / 2 / scale
        }
        let x0 = line.minX
        let dashes = try #require(middle((x0 + 2)...(x0 + 14)), "the dashes are drawn")
        let rule = try #require(middle((x0 + 60)...(x0 + 120)), "the line is drawn")
        #expect(abs(dashes - rule) <= 1, "dashes at \(dashes), line at \(rule)")
    }

    static func lineIndex(_ s: String, _ at: Int) -> Int {
        (s as NSString).substring(to: min(at, (s as NSString).length)).filter { $0 == "\n" }.count
    }
}
#endif
