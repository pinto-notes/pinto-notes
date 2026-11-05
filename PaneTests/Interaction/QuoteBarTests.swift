#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// A quote's bar runs the height of its text, not a dot (council round 15: it was measured from
/// the hidden "> " in its tiny font, and came out a few points tall).
@MainActor @Suite(.serialized) struct QuoteBarTests {
    func bar(_ body: String, at word: String, width: CGFloat = 640) async throws -> (CGRect, Int) {
        let h = await EditorHarness(body, width: width, focus: false)
        defer { h.close() }
        let layout = try #require(h.view.textLayoutManager)
        let content = try #require(layout.textContentManager)
        let loc = try #require(content.location(content.documentRange.location, offsetBy: (h.text as NSString).range(of: word).location))
        layout.ensureLayout(for: NSTextRange(location: loc))
        let fragment = try #require(layout.textLayoutFragment(for: loc) as? DecoratedLayoutFragment)
        return (fragment.quoteBarRect(), fragment.textLineFragments.count)
    }

    @Test func aOneLineQuotesBarIsAsTallAsItsText() async throws {
        let (bar, lines) = try await bar("Lisbon\n\n> Pack comfortable shoes. The hills are real.\n\nAfter", at: "Pack")
        #expect(lines == 1)
        #expect(bar.height >= EditorMetrics.body, "a line's height at least: \(bar)")
        #expect(bar.height < EditorMetrics.body * 2.5, "and not the gap below it: \(bar)")
    }

    /// Return in a quote leaves "> " alone on a line: the bar is a line tall, not a dot, and the
    /// caret stands where the first letter will (persona council r7d, the real Mac window).
    @Test func anEmptyQuoteLineHasAFullBarAndItsCaretInTheTextColumn() async throws {
        let body = "Lisbon\n\n> Pack shoes.\n> \n\nAfter"
        let h = await EditorHarness(body, width: 640, focus: true)
        defer { h.close() }
        let layout = try #require(h.view.textLayoutManager)
        let content = try #require(layout.textContentManager)
        let ns = h.text as NSString
        let empty = ns.range(of: "> \n").location
        let loc = try #require(content.location(content.documentRange.location, offsetBy: empty))
        layout.ensureLayout(for: NSTextRange(location: loc))
        let fragment = try #require(layout.textLayoutFragment(for: loc) as? DecoratedLayoutFragment)
        #expect(fragment.quoteBarRect().height >= EditorMetrics.body, "a line tall: \(fragment.quoteBarRect())")

        func caretX(_ at: Int) throws -> CGFloat {
            let l = try #require(content.location(content.documentRange.location, offsetBy: at))
            var x: CGFloat?
            layout.enumerateTextSegments(in: NSTextRange(location: l), type: .selection, options: [.rangeNotRequired]) { _, r, _, _ in
                x = r.minX; return false
            }
            return try #require(x)
        }
        let letter = try caretX(ns.range(of: "Pack").location)
        #expect(abs(try caretX(empty + 2) - letter) < 1, "under the letters above")
    }

    @Test func aWrappedQuotesBarRunsEveryLine() async throws {
        let long = "> Pack comfortable shoes, because the hills are real and the pavements are polished stone that gets slippery when it rains"
        let (bar, lines) = try await bar("Lisbon\n\n\(long)\n\nAfter", at: "Pack", width: 300)
        #expect(lines >= 2)
        #expect(bar.height >= EditorMetrics.body * CGFloat(lines), "every line: \(bar), \(lines) lines")
    }
}
#endif
