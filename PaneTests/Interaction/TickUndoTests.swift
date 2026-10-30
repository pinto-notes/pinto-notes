import Testing
#if os(macOS)
import AppKit
#else
import UIKit
#endif
@testable import Pane

/// Tick an item, it sinks below the open ones, then Undo once: it's back where it was, unticked,
/// and Undo still reaches what you did before (Apple Notes). On 30 October 2026 the iPhone's Undo
/// put the item back at the top still ticked, and then had nothing left to undo.
@MainActor @Suite(.serialized) struct TickUndoTests {
    static let body = "Groceries\n\n- [ ] Oat milk\n- [ ] Lemons\n- [ ] Eggs"
    /// After typing " today" in the title: the step before the tick.
    static let typed = "Groceries today\n\n- [ ] Oat milk\n- [ ] Lemons\n- [ ] Eggs"
    static let sunk = "Groceries today\n\n- [ ] Lemons\n- [ ] Eggs\n- [x] Oat milk"
    static let settle = ListEditing.sortDelay + ReorderSlide.duration + 0.4

    #if os(macOS)
    func circle(_ h: EditorHarness, _ s: String) -> CGPoint {
        let ns = h.text as NSString
        let line = ns.lineRange(for: NSRange(location: ns.range(of: s).location, length: 0)).location
        let r = h.view.core.checkboxRect(line: line, layout: h.view.textLayoutManager)!
        return CGPoint(x: r.midX + h.view.textContainerOrigin.x, y: r.midY + h.view.textContainerOrigin.y)
    }

    @Test func oneCommandZPutsTheTickAndTheMoveBack() async throws {
        let h = await EditorHarness(Self.body)
        defer { h.close() }
        // Each event's group of Undo, by hand: the offscreen harness delivers no events, and
        // AppKit closes an event's group only after it handles one.
        let undo = try #require(h.view.undoManager)
        undo.groupsByEvent = false
        defer { undo.groupsByEvent = true }
        await h.caret(after: "Groceries")
        undo.beginUndoGrouping()
        await h.type(" today")
        h.view.breakUndoCoalescing()
        undo.endUndoGrouping()
        undo.beginUndoGrouping()
        await h.click(circle(h, "Oat milk"))
        undo.endUndoGrouping()
        await h.settle(Self.settle)
        #expect(h.text == Self.sunk, "ticked and sunk")

        undo.undo()
        await h.settle(0.2)
        #expect(h.text == Self.typed, "one ⌘Z: unticked, back at the top")
        #expect(undo.canUndo, "the typing before it is still there to undo")
        undo.undo()
        await h.settle(0.2)
        #expect(h.text == Self.body)

        undo.redo()
        await h.settle(0.2)
        #expect(h.text == Self.typed)
        undo.redo()
        await h.settle(0.2)
        #expect(h.text == Self.sunk, "redo ticks and sinks it again")
    }
    #endif

    #if os(iOS)
    final class Tap: UITapGestureRecognizer {
        var at = CGPoint.zero
        override func location(in view: UIView?) -> CGPoint { at }
    }

    func make() -> (UIWindow, PaneTextView) {
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        let view = PaneTextView(frame: window.bounds)
        view.configure(text: Self.body, header: "")
        window.addSubview(view)
        window.isHidden = false
        view.layoutIfNeeded()
        return (window, view)
    }

    func tapCircle(_ v: PaneTextView, _ s: String) {
        let ns = v.text as NSString
        let line = ns.lineRange(for: NSRange(location: ns.range(of: s).location, length: 0)).location
        let r = v.core.checkboxRect(line: line, layout: v.textLayoutManager)!
        let t = Tap()
        t.at = CGPoint(x: r.midX + v.textContainerInset.left, y: r.midY + v.textContainerInset.top)
        v.perform(NSSelectorFromString("handleTap:"), with: t)
    }

    /// With the keyboard down (the recording) and up.
    @Test(arguments: [false, true])
    func oneUndoPutsTheTickAndTheMoveBack(keyboardUp: Bool) async throws {
        let (window, v) = make()
        defer { window.isHidden = true }
        v.becomeFirstResponder()
        v.selectedRange = NSRange(location: ("Groceries" as NSString).length, length: 0)
        v.insertText(" today")
        try? await Task.sleep(for: .seconds(0.3))
        if !keyboardUp { v.resignFirstResponder() }
        tapCircle(v, "Oat milk")
        try? await Task.sleep(for: .seconds(Self.settle))
        #expect(v.text == Self.sunk, "ticked and sunk")
        #expect(v.isFirstResponder == keyboardUp, "a tick leaves the keyboard as it was")
        let undo = try #require(v.undoManager)

        // The top bar's Undo.
        v.undoStep(redo: false)
        try? await Task.sleep(for: .seconds(0.3))
        #expect(v.text == Self.typed, "one Undo: unticked, back at the top")
        #expect(undo.canUndo, "the typing before it is still there to undo")
        v.undoStep(redo: false)
        try? await Task.sleep(for: .seconds(0.3))
        #expect(v.text == Self.body)

        v.undoStep(redo: true)
        try? await Task.sleep(for: .seconds(0.3))
        #expect(v.text == Self.typed)
        v.undoStep(redo: true)
        try? await Task.sleep(for: .seconds(0.3))
        #expect(v.text == Self.sunk, "redo ticks and sinks it again")
    }

    /// Undo before the item has sunk: it's unticked where it is, and nothing moves afterwards.
    @Test func undoBeforeItSinks() async throws {
        let (window, v) = make()
        defer { window.isHidden = true }
        tapCircle(v, "Oat milk")
        try? await Task.sleep(for: .seconds(0.1))
        v.undoStep(redo: false)
        try? await Task.sleep(for: .seconds(Self.settle))
        #expect(v.text == Self.body)
    }
    #endif
}
