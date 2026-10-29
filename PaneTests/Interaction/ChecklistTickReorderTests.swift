#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// Ticking the welcome note's to-dos fast, as Emil did on 29 October 2026: the checkmark floated
/// off over "Get started", a row vanished mid-move, and a click during the move ticked the item
/// the text had at that place, not the one drawn there.
@MainActor @Suite(.serialized) struct ChecklistTickReorderTests {
    static let welcome = WelcomeNote.body(for: .mac)

    func lineStart(_ h: EditorHarness, _ s: String) -> Int {
        (h.text as NSString).lineRange(for: NSRange(location: (h.text as NSString).range(of: s).location, length: 0)).location
    }

    /// The circle's centre for the checklist line containing `s`, as laid out now.
    func circle(_ h: EditorHarness, _ s: String) -> CGPoint {
        let r = h.view.core.checkboxRect(line: lineStart(h, s), layout: h.view.textLayoutManager)!
        return CGPoint(x: r.midX + h.view.textContainerOrigin.x, y: r.midY + h.view.textContainerOrigin.y)
    }

    func ticked(_ h: EditorHarness, _ s: String) -> Bool {
        let ns = h.text as NSString
        return ListPrefix(line: ns.substring(with: ns.lineRange(for: NSRange(location: ns.range(of: s).location, length: 0))))?.checkbox == true
    }

    var items: [String] { WelcomeNote.items(for: .mac).map(\.title) }

    /// The slide's row pictures, in the order of the rows before the move.
    func pictures(_ h: EditorHarness) -> [CALayer] {
        h.view.layer?.sublayers?.filter { $0.zPosition >= 21 } ?? []
    }

    /// The pictures' indices from the one drawn lowest to the one on top, as Core Animation
    /// stacks siblings: by zPosition, then by the order they were added.
    func stacked(_ h: EditorHarness) -> [Int] {
        let p = pictures(h)
        return p.indices.sorted { (p[$0].zPosition, $0) < (p[$1].zPosition, $1) }
    }

    /// The item drawn at `y`, worked out from the pictures alone: the one on top there.
    func drawn(_ h: EditorHarness, at y: CGFloat, old: [String]) -> String? {
        let p = pictures(h)
        for i in stacked(h).reversed() {
            let f = p[i].presentation()?.frame ?? p[i].frame
            if f.minY <= y && y < f.maxY { return old[i] }
        }
        return nil
    }

    /// How much of picture `i`'s height shows, the pictures above it taken away.
    func visibleShare(_ h: EditorHarness, _ i: Int) -> CGFloat {
        let p = pictures(h)
        let order = stacked(h)
        let f = p[i].presentation()?.frame ?? p[i].frame
        let above = order[(order.firstIndex(of: i)! + 1)...].map { p[$0].presentation()?.frame ?? p[$0].frame }
        // Sample the row's height in fine steps.
        let steps = 200
        let shown = (0..<steps).filter { k in
            let y = f.minY + f.height * (CGFloat(k) + 0.5) / CGFloat(steps)
            return !above.contains { $0.minY <= y && y < $0.maxY }
        }.count
        return CGFloat(shown) / CGFloat(steps)
    }

    /// Once nothing moves, what's drawn is the text: no pictures over it, and every row's
    /// circle drawn ticked exactly when its line says so.
    func settledMatchesText(_ h: EditorHarness) {
        #expect(h.view.layer?.sublayers?.contains { $0.zPosition >= 20 } != true, "no slide left over the text")
        for item in items {
            let at = lineStart(h, item)
            h.view.textLayoutManager!.ensureLayout(for: h.view.textLayoutManager!.textContentManager!.documentRange)
            let loc = h.view.textLayoutManager!.textContentManager!.location(h.view.textLayoutManager!.textContentManager!.documentRange.location, offsetBy: at)!
            let frag = h.view.textLayoutManager!.textLayoutFragment(for: loc) as? DecoratedLayoutFragment
            guard case .checkbox(let checked)? = frag?.decoration?.kind else { Issue.record("\(item): no circle"); continue }
            #expect(checked == ticked(h, item), "\(item): drawn \(checked), text \(ticked(h, item))")
        }
    }

    @Test func tickThenTickAgainAtTheSamePointUnticksTheSameItem() async {
        let h = await EditorHarness(Self.welcome, focus: false)
        defer { h.close() }
        let p = circle(h, items[0])
        await h.click(p)
        #expect(ticked(h, items[0]))
        await h.click(p)
        #expect(!ticked(h, items[0]), "the second click is on the same row, still drawn there")
        await h.settle(ListEditing.sortDelay + ReorderSlide.duration + 0.3)
        #expect(h.text == Self.welcome, "nothing ticked, nothing moved")
        settledMatchesText(h)
    }

    @Test func quickTicksSettleOnceTogether() async {
        let h = await EditorHarness(Self.welcome, focus: false)
        defer { h.close() }
        await h.click(circle(h, items[0]))
        await h.settle(ListEditing.sortDelay * 0.6)
        // Still where it was: the wait starts again with each tick.
        await h.click(circle(h, items[1]))
        await h.settle(ListEditing.sortDelay * 0.6)
        #expect(h.text.contains("- [x] \(items[0])\n- [x] \(items[1])\n- [ ] \(items[2])"), "nothing moves while ticking")
        await h.settle(ListEditing.sortDelay + ReorderSlide.duration + 0.3)
        #expect(h.text.contains("- [ ] \(items[2])\n- [x] \(items[0])\n- [x] \(items[1])"))
        settledMatchesText(h)
    }

    /// The click during the slide is for the row drawn under the pointer, which the slide's
    /// pictures decide, not the reordered text below them.
    @Test func clickDuringTheSlideTogglesTheRowDrawnThere() async {
        guard !CheckPop.reduceMotion else { return }
        let h = await EditorHarness(Self.welcome, focus: false)
        defer { h.close() }
        let p = circle(h, items[0])
        await h.click(p)
        #expect(await h.until(3) { !pictures(h).isEmpty }, "the rows slide")
        let target = drawn(h, at: p.y, old: items)
        #expect(target == items[0], "just after the slide starts, the ticked row is still drawn there")
        let before = items.map { ticked(h, $0) }
        await h.click(p)
        for (i, item) in items.enumerated() {
            #expect(ticked(h, item) == (item == target ? !before[i] : before[i]), "\(item) after the click")
        }
        #expect(pictures(h).isEmpty, "the slide gives way to the text at once")
        await h.settle(ListEditing.sortDelay + ReorderSlide.duration + 0.3)
        settledMatchesText(h)
    }

    /// Emil's clip: four clicks at the first row, 0.5, 1.3 and 1.3 s apart. Every click toggles
    /// the row drawn there at that moment.
    @Test func emilsFourClicks() async {
        let h = await EditorHarness(Self.welcome, focus: false)
        defer { h.close() }
        let p = circle(h, items[0])
        for wait in [0, 0.5, 1.3, 1.3] {
            await h.settle(wait)
            // What's drawn under the pointer: a sliding picture's row, or else the laid-out row.
            var expected = items.first { abs(circle(h, $0).y - p.y) < 4 }
            if let slide = h.view.core.slides.first {
                let layers = pictures(h)
                for i in stacked(h).reversed() {
                    let f = layers[i].presentation()?.frame ?? layers[i].frame
                    if f.minY <= p.y && p.y < f.maxY { expected = items.first { lineStart(h, $0) == slide.lines[i] }; break }
                }
            }
            let before = expected.map { ticked(h, $0) }
            await h.click(p)
            if let expected, let before { #expect(ticked(h, expected) == !before, "click after \(wait) s toggles \(expected)") }
        }
        await h.settle(ListEditing.sortDelay + ReorderSlide.duration + 0.3)
        settledMatchesText(h)
    }

    @Test func thePopSitsOnTheTickedCircle() async {
        guard !CheckPop.reduceMotion else { return }
        let h = await EditorHarness(Self.welcome, focus: false)
        defer { h.close() }
        let c = circle(h, items[0])
        await h.click(c)
        let pop = h.view.layer?.sublayers?.first { $0.zPosition == 10 }
        #expect(pop != nil, "the tick pops")
        if let f = pop?.frame {
            #expect(abs(f.midY - c.y) < 1 && abs(f.midX - c.x) < 1, "pop at \(f.midX),\(f.midY), circle at \(c.x),\(c.y)")
        }
        await h.snapshot("checklist-tick-pop")
    }

    /// Sampled through the slide: every row is there, as one picture with its circle and words,
    /// moving from its old place to its new one, and it lands exactly on its line.
    @Test func noRowGoesMissingMidMove() async throws {
        guard !CheckPop.reduceMotion else { return }
        let h = await EditorHarness(Self.welcome, focus: false)
        defer { h.close() }
        let before = items.map { h.lineRect(at: lineStart(h, $0)) }
        await h.click(circle(h, items[0]))
        #expect(await h.until(3) { !pictures(h).isEmpty })
        let layers = pictures(h)
        #expect(layers.count == 3, "three rows slide, got \(layers.count)")
        let slide = try #require(h.view.core.slides.first)
        var sampled = 0
        var shares: [[CGFloat]] = Array(repeating: [], count: layers.count)
        while !pictures(h).isEmpty {
            for (i, l) in layers.enumerated() {
                let f = l.presentation()?.frame ?? l.frame
                #expect(l.superlayer != nil && l.opacity == 1 && !l.isHidden, "row \(i) in sample \(sampled)")
                let lo = min(before[i].minY, l.frame.minY) - 1, hi = max(before[i].minY, l.frame.minY) + 1
                #expect(f.minY >= lo && f.minY <= hi, "row \(i) between its places: \(f.minY) not in \(lo)...\(hi)")
                shares[i].append(visibleShare(h, i))
            }
            sampled += 1
            await h.settle(0.02)
        }
        #expect(sampled >= 3, "sampled the move \(sampled) times")
        // In sight all the way. The ticked row, travelling furthest, is drawn whole over the
        // others (before, the two rising rows covered it for the middle of the move); they pass
        // under it, hidden at most for the moment it crosses them.
        #expect(shares[0].allSatisfy { $0 > 0.99 }, "the ticked row shows whole: \(shares[0])")
        for i in 1..<shares.count {
            let mean = shares[i].reduce(0, +) / CGFloat(max(shares[i].count, 1))
            #expect(mean > 0.6 && shares[i].filter { $0 < 0.05 }.count <= 1, "\(items[i]) mostly in sight: \(shares[i])")
        }
        // Each picture shows its row: the circle and the words.
        for (i, l) in layers.enumerated() {
            let image = try #require(l.contents.map { $0 as! CGImage })
            let rep = NSBitmapImageRep(cgImage: image)
            let scale = CGFloat(rep.pixelsWide) / l.bounds.width
            func inked(_ x: ClosedRange<CGFloat>) -> Bool {
                let bg = rep.colorAt(x: rep.pixelsWide - 2, y: 1)!
                for px in Int(x.lowerBound * scale)..<Int(x.upperBound * scale) {
                    for py in 0..<rep.pixelsHigh {
                        guard let c = rep.colorAt(x: px, y: py) else { continue }
                        if abs(c.redComponent - bg.redComponent) + abs(c.greenComponent - bg.greenComponent) + abs(c.blueComponent - bg.blueComponent) > 0.3 { return true }
                    }
                }
                return false
            }
            let cx = circle(h, items[i]).x
            #expect(inked(cx - 6...cx + 6), "row \(i) has its circle")
            #expect(inked(cx + 20...cx + 120), "row \(i) has its words")
        }
        // Each lands on its line as the text now has it.
        for (i, l) in layers.enumerated() {
            let line = h.lineRect(at: slide.lines[i])
            #expect(abs(l.frame.minY - line.minY) < 0.5, "row \(i) lands at \(l.frame.minY), its line is at \(line.minY)")
            #expect((h.text as NSString).substring(from: slide.lines[i]).hasPrefix("- [") &&
                    (h.text as NSString).substring(from: slide.lines[i]).contains(items[i]), "row \(i) is \(items[i])")
        }
        await h.settle(ReorderSlide.duration + 0.2)
        settledMatchesText(h)
        await h.snapshot("checklist-tick-after")
    }

    @Test func tickedItemsAreMutedAndStruckThroughOnTheMac() async {
        let h = await EditorHarness(Self.welcome, focus: false)
        defer { h.close() }
        await h.click(circle(h, items[0]))
        let at = (h.text as NSString).range(of: items[0]).location
        let storage = h.view.textStorage!
        #expect((storage.attribute(.strikethroughStyle, at: at, effectiveRange: nil) as? Int) == NSUnderlineStyle.single.rawValue)
        #expect((storage.attribute(.foregroundColor, at: at, effectiveRange: nil) as? NSColor) == Palette.muted)
        let open = (h.text as NSString).range(of: items[1]).location
        #expect(storage.attribute(.strikethroughStyle, at: open, effectiveRange: nil) == nil, "open items stay as they are")
        await h.snapshot("checklist-tick-style")
    }
}
#endif

#if os(iOS)
import UIKit
import Testing
@testable import Pane

/// The iPhone editor shares the tick, the wait and the slide with the Mac: the same taps,
/// through its own tap handler, in a window off screen.
@MainActor @Suite(.serialized) struct ChecklistTickReorderPhoneTests {
    final class Tap: UITapGestureRecognizer {
        var at = CGPoint.zero
        override func location(in view: UIView?) -> CGPoint { at }
    }

    static let welcome = WelcomeNote.body(for: .iPhone)
    var items: [String] { WelcomeNote.items(for: .iPhone).map(\.title) }

    func make() -> (UIWindow, PaneTextView) {
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        let view = PaneTextView(frame: window.bounds)
        view.configure(text: Self.welcome, header: "")
        window.addSubview(view)
        window.isHidden = false
        view.layoutIfNeeded()
        return (window, view)
    }

    func lineStart(_ v: PaneTextView, _ s: String) -> Int {
        (v.text as NSString).lineRange(for: NSRange(location: (v.text as NSString).range(of: s).location, length: 0)).location
    }

    func circle(_ v: PaneTextView, _ s: String) -> CGPoint {
        let r = v.core.checkboxRect(line: lineStart(v, s), layout: v.textLayoutManager)!
        return CGPoint(x: r.midX + v.textContainerInset.left, y: r.midY + v.textContainerInset.top)
    }

    func ticked(_ v: PaneTextView, _ s: String) -> Bool {
        let ns = v.text as NSString
        return ListPrefix(line: ns.substring(with: ns.lineRange(for: NSRange(location: ns.range(of: s).location, length: 0))))?.checkbox == true
    }

    func tap(_ v: PaneTextView, _ p: CGPoint) {
        let t = Tap()
        t.at = p
        v.perform(NSSelectorFromString("handleTap:"), with: t)
    }

    @Test func tapTwiceAtTheSamePointUnticksTheSameItem() async {
        let (window, v) = make()
        defer { window.isHidden = true }
        let p = circle(v, items[0])
        tap(v, p)
        #expect(ticked(v, items[0]))
        tap(v, p)
        #expect(!ticked(v, items[0]))
        try? await Task.sleep(for: .seconds(ListEditing.sortDelay + ReorderSlide.duration + 0.3))
        #expect(v.text == Self.welcome, "nothing ticked, nothing moved")
    }

    /// Right as the rows move, the tap toggles the row drawn under the finger: a sliding
    /// picture's row while the slide plays, the laid-out row otherwise (offscreen, the
    /// simulator may take no pictures, and the rows then jump).
    @Test func tapAsTheRowsMoveTogglesTheRowDrawnThere() async {
        let (window, v) = make()
        defer { window.isHidden = true }
        let p = circle(v, items[0])
        tap(v, p)
        let end = Date.now.addingTimeInterval(3)
        while v.text.contains("- [x] \(items[0])\n- [ ] \(items[1])") && Date.now < end { try? await Task.sleep(for: .seconds(0.01)) }
        let drawn: String?
        if let slide = v.core.slides.first {
            drawn = slide.line(atY: p.y).flatMap { at in items.first { lineStart(v, $0) == at } }
        } else {
            drawn = items.first { abs(circle(v, $0).y - p.y) < 4 }
        }
        let target = try? #require(drawn)
        let before = items.map { ticked(v, $0) }
        tap(v, p)
        for (i, item) in items.enumerated() {
            #expect(ticked(v, item) == (item == target ? !before[i] : before[i]), "\(item) after the tap")
        }
        #expect(v.core.slides.isEmpty, "no slide left over the text")
    }

    @Test func theLastRowsBandIsOneRowHigh() {
        let (window, v) = make()
        defer { window.isHidden = true }
        let starts = items.map { lineStart(v, $0) }
        let bands = ReorderSlide.bands(starts, layout: v.textLayoutManager, origin: .zero, width: 100)
        #expect(bands.count == 3)
        if bands.count == 3 { #expect(abs(bands[2].height - bands[1].height) < 0.5, "last \(bands[2].height), others \(bands[1].height)") }
    }
}
#endif
