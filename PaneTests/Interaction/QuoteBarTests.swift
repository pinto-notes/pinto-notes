#if os(macOS)
import Testing
import AppKit
@testable import Pane

/// A quote's bar sits centred on its text (Emil, 4 November 2026: it ran the fragment's full
/// height, line spacing included, and sat high beside the words).
@MainActor
struct QuoteBarTests {
    @Test func theQuoteBarIsCentredOnItsText() async throws {
        let h = await EditorHarness("Lisbon\n\n> Pack comfortable shoes. The hills are real.\n\nAfter", focus: false)
        defer { h.close() }
        let ns = h.text as NSString
        let line = ns.range(of: "> Pack").location
        let q = try #require(h.view.core.quoteBar(line: line, layout: h.view.textLayoutManager))
        let textMid = (q.text.lowerBound + q.text.upperBound) / 2
        #expect(abs(q.bar.midY - textMid) < 1, "bar \(q.bar), text \(q.text)")
        #expect(q.bar.minY <= q.text.lowerBound && q.bar.maxY >= q.text.upperBound, "the bar covers the letters")
    }
}
#endif
