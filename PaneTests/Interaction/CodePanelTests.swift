#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// A code block's lines keep their descenders: the panel behind a line never reaches up over the
/// line above, which it's drawn on top of (council round 15: "greeting" read "greetina").
@MainActor @Suite struct CodePanelTests {
    @Test func innerPanelsOverlapDownwardsOnly() {
        for first in [false, true] {
            for last in [false, true] {
                let e = DecoratedLayoutFragment.panelEdges(first: first, last: last, outside: 0)
                #expect(e.top >= 0, "never over the line above: first \(first), last \(last)")
                if !last { #expect(e.bottom < 0, "into the next line, so no seam between them") }
            }
        }
        // An open block's edge reaches out past the text, as before.
        #expect(DecoratedLayoutFragment.panelEdges(first: true, last: true, outside: 8) == (-6, -6))
    }
}
#endif
