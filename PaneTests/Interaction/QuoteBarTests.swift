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

    @Test func aWrappedQuotesBarRunsEveryLine() async throws {
        let long = "> Pack comfortable shoes, because the hills are real and the pavements are polished stone that gets slippery when it rains"
        let (bar, lines) = try await bar("Lisbon\n\n\(long)\n\nAfter", at: "Pack", width: 300)
        #expect(lines >= 2)
        #expect(bar.height >= EditorMetrics.body * CGFloat(lines), "every line: \(bar), \(lines) lines")
    }
}
#endif
