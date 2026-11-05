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

    /// With the caret in a block its fences show, with room around them. That room is the block's
    /// own: the panel never covers the line above, here a quote (council round 16, `a3-slash-code`:
    /// the grey reached over "Pack comfortable shoes", cutting its descenders).
    @Test func anOpenBlockKeepsOffTheLineAbove() async throws {
        let text = "Lisbon\n\n> Pack shoes, gypsy.\n```\nlet count = 1\n```\n\nAfter"
        let h = await EditorHarness(text, width: 640, height: 500)
        defer { h.close() }
        let ns = text as NSString
        await h.select(ns.range(of: "count").location)
        await h.settle(0.3)
        await h.snapshot("code-open")
        let target = h.scroll
        let rep = try #require(target.bitmapImageRepForCachingDisplay(in: target.bounds))
        target.cacheDisplay(in: target.bounds, to: rep)
        func rgb(_ x: Int, _ y: Int) -> (CGFloat, CGFloat, CGFloat) {
            guard let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) else { return (1, 1, 1) }
            return (c.redComponent, c.greenComponent, c.blueComponent)
        }
        func isGrey(_ c: (CGFloat, CGFloat, CGFloat)) -> Bool {
            let l = (c.0 + c.1 + c.2) / 3
            return l > 0.82 && l < 0.975 && abs(c.0 - c.2) < 0.03
        }
        // The quote's bar: the orange column at the left of the text.
        var bar: (x: Int, top: Int, bottom: Int)?
        scan: for x in 0..<(rep.pixelsWide / 4) {
            var top: Int?, bottom = 0
            for y in 0..<rep.pixelsHigh {
                let c = rgb(x, y)
                if c.0 > 0.7, c.0 - c.2 > 0.3 { if top == nil { top = y }; bottom = y }
            }
            if let top, bottom - top > 10 { bar = (x, top, bottom); break scan }
        }
        let b = try #require(bar, "the quote's bar")
        func greyShare(_ y: Int) -> Double {
            var grey = 0, all = 0
            for x in stride(from: b.x + 40, to: rep.pixelsWide - 40, by: 2) { all += 1; if isGrey(rgb(x, y)) { grey += 1 } }
            return Double(grey) / Double(max(all, 1))
        }
        let scale = CGFloat(rep.pixelsWide) / target.bounds.width
        for dy in [1, 3, 5] {
            let y = b.bottom - Int(CGFloat(dy) * scale)
            #expect(greyShare(y) < 0.3, "\(dy) pt above the quote's bottom: \(greyShare(y)) under the code panel")
        }
        // The panel below still has room over its first fence.
        let panelTop = try #require((b.bottom..<rep.pixelsHigh).first { greyShare($0) > 0.7 }, "the code panel")
        let firstInk = try #require((panelTop..<rep.pixelsHigh).first { y in
            stride(from: b.x + 10, to: b.x + Int(60 * scale), by: 1).contains { x in let c = rgb(x, y); return (c.0 + c.1 + c.2) / 3 < 0.6 }
        }, "the fence's text")
        #expect(CGFloat(firstInk - panelTop) / scale >= 5, "room above the fence: \(CGFloat(firstInk - panelTop) / scale) pt")
    }
}
#endif
