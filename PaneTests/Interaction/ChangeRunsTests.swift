#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// The highlight over a line an AI changed covers every line it wraps onto (persona council r7,
/// bug 2: past the wrap, each line got a sliver at its start).
@MainActor @Suite(.serialized) struct ChangeRunsTests {
    @Test func aWrappedChangeIsHighlightedOnEveryLine() async throws {
        let long = "Sara books the hotel near Ribeira for the 23rd to 25 May, with the late checkout asked for and breakfast"
        let h = await EditorHarness("Porto\n\n\(long)\n\nAfter", width: 300, focus: false)
        defer { h.close() }
        let layout = try #require(h.view.textLayoutManager)
        let content = try #require(layout.textContentManager)
        let loc = try #require(content.location(content.documentRange.location, offsetBy: (h.text as NSString).range(of: "Sara").location))
        layout.ensureLayout(for: NSTextRange(location: loc))
        let fragment = try #require(layout.textLayoutFragment(for: loc) as? DecoratedLayoutFragment)
        let lines = fragment.textLineFragments.count
        #expect(lines >= 3, "it wraps: \(lines) lines")
        let runs = fragment.changeRuns(at: .zero)
        #expect(runs.count == lines, "\(runs)")
        // Every full line is most of the column wide; only the last may be short.
        for r in runs.dropLast() { #expect(r.width > 200, "\(runs)") }
        // Each line's run starts where its words start, at the left of the text.
        let lefts = runs.map(\.minX)
        #expect((lefts.max() ?? 0) - (lefts.min() ?? 0) < 2, "\(lefts)")
    }
}
#endif
