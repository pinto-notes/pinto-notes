#if os(macOS)
import Testing
import CoreGraphics
@testable import Pane

/// The AI change mark isn't colour alone (round 14 of the UI council): a 2 pt tick in the margin,
/// 8 pt left of the text, as tall as the changed lines.
@Suite struct AIChangeTickTests {
    @Test func theTickSitsInTheMarginAsTallAsTheChangedLines() throws {
        let runs = [CGRect(x: 30, y: 10, width: 80, height: 20), CGRect(x: 30, y: 34, width: 120, height: 20)]
        let tick = try #require(DecoratedLayoutFragment.tick(for: runs, textLeft: 0))
        #expect(tick.width == 2)
        #expect(tick.maxX == -8, "8 pt left of the text: \(tick)")
        #expect(tick.minY == 10 && tick.maxY == 54, "from the first changed line to the last: \(tick)")
        #expect(DecoratedLayoutFragment.tick(for: [], textLeft: 0) == nil, "nothing changed, no tick")
        #expect(DecoratedLayoutFragment.changeLead >= DecoratedLayoutFragment.tickGap + DecoratedLayoutFragment.tickWidth,
                "the fragment draws far enough left for the tick")
    }
}
#endif
