import Foundation
#if os(macOS)
import AppKit
#endif
import Testing
@testable import Pane

/// A line an AI took out leaves a mark in the note, where it was (persona council r7, bug 3:
/// only the review sheet showed it).
@MainActor @Suite(.serialized) struct RemovalMarkTests {
    typealias R = ChangeTint.Removal

    @Test func aRemovedLineMarksTheGapUnderIt() {
        let old = "Porto\nHotel near Ribeira.\nSara can't come on Friday.\nTrain at 9."
        let new = "Porto\nHotel near Ribeira.\nTrain at 9."
        let r = ChangeTint.removals(from: old, to: new)
        let train = (new as NSString).range(of: "Train at 9.")
        #expect(r == [R(paragraph: train, below: false)], "\(r)")
    }

    @Test func theNotesEndGoingMarksUnderTheLastLine() {
        let r = ChangeTint.removals(from: "Porto\nA\nB", to: "Porto\nA\n")
        #expect(r == [R(paragraph: NSRange(location: 6, length: 2), below: true)], "\(r)")
    }

    @Test func aRewriteOrAMoveIsNoRemoval() {
        #expect(ChangeTint.removals(from: "T\nA\nB", to: "T\nA changed\nB").isEmpty, "a rewrite is tinted instead")
        #expect(ChangeTint.removals(from: "T\nA\nB", to: "T\nB\nA").isEmpty, "a move")
        #expect(ChangeTint.removals(from: "T\nA\n\nB", to: "T\nA\nB").isEmpty, "a blank line")
        #expect(ChangeTint.removals(from: "T\nA", to: "T\nA\nB").isEmpty, "an addition")
    }

    #if os(macOS)
    @Test func theEditorDrawsTheMarkAndClearsIt() async throws {
        let old = "Porto\n\nHotel near Ribeira.\n\nSara can't come on Friday.\n\nTrain at 9."
        let new = "Porto\n\nHotel near Ribeira.\n\nTrain at 9."
        let h = await EditorHarness(new, focus: false)
        defer { h.close() }
        let tint = h.view.core.layoutDelegate.tint
        h.view.tintChanges(from: old, untilCleared: true)
        await h.settle(0.9)
        let train = (h.text as NSString).range(of: "Train").location
        let layout = try #require(h.view.textLayoutManager)
        let content = try #require(layout.textContentManager)
        func fragment(_ at: Int) throws -> DecoratedLayoutFragment {
            let loc = try #require(content.location(content.documentRange.location, offsetBy: at))
            layout.ensureLayout(for: NSTextRange(location: loc))
            return try #require(layout.textLayoutFragment(for: loc) as? DecoratedLayoutFragment)
        }
        let marked = try fragment(train)
        let (gap, strength) = try #require(marked.removalMark, "the line after the gap is marked")
        #expect(strength > 0)
        #expect(tint.strength(at: train) == 0, "and not tinted: it didn't change")
        let rect = marked.removalRect(gap, at: .zero)
        let line = try #require(marked.textLineFragments.first)
        let capTop = line.typographicBounds.minY + line.glyphOrigin.y - NSFont.systemFont(ofSize: EditorMetrics.body).capHeight
        #expect(rect.maxY < capTop && rect.minY > line.typographicBounds.minY - 6, "in the seam above the line's letters: \(rect), caps at \(capTop)")
        #expect(try fragment(0).removalMark == nil)
        await h.snapshot("removal-mark")
        tint.stop()
        #expect(marked.removalMark == nil, "gone once cleared")
    }

    /// The seam mark sits in the margin left of the checkbox, out of the text column, so it
    /// can't read as an underline (council r3; r1 had it under the circle, r3 under the words).
    @Test func inAChecklistTheMarkSitsInTheMargin() async throws {
        let old = "Groceries\n\n- [ ] Oat milk\n- [ ] Lemons\n- [ ] Eggs"
        let new = "Groceries\n\n- [ ] Oat milk\n- [ ] Eggs"
        let h = await EditorHarness(new, focus: false)
        defer { h.close() }
        h.view.tintChanges(from: old, untilCleared: true)
        await h.settle(0.9)
        let eggs = (h.text as NSString).range(of: "- [ ] Eggs").location
        let layout = try #require(h.view.textLayoutManager)
        let content = try #require(layout.textContentManager)
        let loc = try #require(content.location(content.documentRange.location, offsetBy: eggs))
        layout.ensureLayout(for: NSTextRange(location: loc))
        let marked = try #require(layout.textLayoutFragment(for: loc) as? DecoratedLayoutFragment)
        let (gap, _) = try #require(marked.removalMark)
        let line = try #require(marked.textLineFragments.first)
        let rect = marked.removalRect(gap, at: .zero)
        let d = try #require(marked.decoration)
        #expect(rect.maxX <= marked.checkboxRect(d).minX, "left of the circle, clear of the words")
        #expect(rect.width <= 16)
        #expect(marked.renderingSurfaceBounds.contains(rect), "drawn, not clipped")
        _ = line
        h.view.core.layoutDelegate.tint.stop()
    }
    #endif
}
