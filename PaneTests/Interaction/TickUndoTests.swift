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

    /// Round 18's capture, at its pace: tick Passport (it sinks), tick Rain jacket, Undo, move Rain
    /// jacket up, Undo. The last Undo left "- [ ] Rain jack- [ ] Chargers" and lost Passport.
    /// Undoing a move leaves a caret where it was, not the two swapped lines selected (round 18's
    /// shot had them highlighted), and Redo takes the caret along with the item.
    @Test func undoingAMovePutsTheCaretBack() async throws {
        let body = "Packing\n\n- [ ] Passport\n- [ ] Chargers\n- [ ] Rain jacket"
        let h = await EditorHarness(body)
        defer { h.close() }
        let undo = try #require(h.view.undoManager)
        let at = (body as NSString).range(of: "Rain").location + 2
        h.view.setSelectedRange(NSRange(location: at, length: 0))
        h.controller.moveItem(up: true)
        await h.settle(0.2)
        #expect(h.text == "Packing\n\n- [ ] Passport\n- [ ] Rain jacket\n- [ ] Chargers")
        let moved = h.selection
        #expect(moved.length == 0)
        #expect(undo.undoActionName == "Move Item")
        undo.undo()
        await h.settle(0.2)
        #expect(h.text == body)
        #expect(h.selection == NSRange(location: at, length: 0))
        undo.redo()
        await h.settle(0.2)
        #expect(h.selection == moved)
    }

    @Test func undoingAMoveAfterTicksKeepsTheText() async throws {
        let body = "Packing\n\n- [ ] Passport\n- [ ] Chargers\n- [ ] Rain jacket"
        let h = await EditorHarness(body)
        defer { h.close() }
        let undo = try #require(h.view.undoManager)
        undo.groupsByEvent = false
        defer { undo.groupsByEvent = true }
        func step(_ work: () async -> Void) async {
            undo.beginUndoGrouping()
            await work()
            undo.endUndoGrouping()
        }
        await step { await h.click(circle(h, "Passport")) }
        await h.settle(1.2)
        await step { await h.click(circle(h, "Rain jacket")) }
        await h.settle(1.2)
        undo.undo()
        await h.settle(1)
        await h.caret(after: "Rain jacket")
        await step { h.controller.moveItem(up: true) }
        await h.settle(1.5)
        undo.undo()
        await h.settle(Self.settle)
        #expect(h.text == "Packing\n\n- [ ] Chargers\n- [ ] Rain jacket\n- [x] Passport")
    }

    /// The same steps with no pause: a sort still waiting when Undo and the move run. It used to
    /// rewrite the text from stale line positions, outside Undo, and the next Undo damaged the note.
    @Test(arguments: [0.0, 0.1, 0.3, 0.5, 0.7])
    func undoAndMoveWhileASortWaits(gap: Double) async throws {
        let h = await EditorHarness("Packing\n\n- [ ] Passport\n- [ ] Chargers\n- [ ] Rain jacket")
        defer { h.close() }
        let undo = try #require(h.view.undoManager)
        undo.groupsByEvent = false
        defer { undo.groupsByEvent = true }
        func step(_ work: () async -> Void) async {
            undo.beginUndoGrouping()
            await work()
            undo.endUndoGrouping()
            if gap > 0 { await h.settle(gap) }
        }
        await step { await h.click(circle(h, "Passport")) }
        await step { await h.click(circle(h, "Chargers")) }
        undo.undo(); if gap > 0 { await h.settle(gap) }
        await h.caret(after: "Rain jacket")
        await step { h.controller.moveItem(up: true) }
        await h.settle(1.0)
        undo.undo()
        await h.settle(Self.settle)
        let lines = h.text.components(separatedBy: "\n")
        #expect(lines.count == 5, "\(h.text)")
        for item in ["Passport", "Chargers", "Rain jacket"] {
            #expect(lines.contains { $0.hasSuffix("] \(item)") }, "\(item) in \(h.text)")
        }
    }

    /// A click on a circle ticks it even with the keyboard elsewhere, as in Notes (round 18: on the
    /// Air the first click after opening a note did nothing).
    @Test func theFirstClickOnACircleTicks() async {
        let h = await EditorHarness("Packing\n\n- [ ] Passport\n- [ ] Chargers", focus: false)
        defer { h.close() }
        await h.click(circle(h, "Passport"))
        await h.settle(0.1)
        #expect(h.text.contains("- [x] Passport"), "\(h.text)")
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
