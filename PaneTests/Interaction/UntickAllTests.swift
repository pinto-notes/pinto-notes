import Foundation
import Testing
#if os(macOS)
import AppKit
#endif
@testable import Pane

/// Untick All (persona council 11-04, the household's packing and groceries lists): Format ›
/// Untick All (⌥⇧⌘L), Untick All in This List on a right-click or a long press. Like Notes'
/// Uncheck All: the list the caret is in, every item where it is, one step of Undo.
@MainActor @Suite(.serialized) struct UntickAllTests {
    static let packing = """
    Packing

    Clothes
    - [x] Rain jacket
    - [ ] Swimsuit
    \t- [x] Goggles
    - [x] Good shoes

    Groceries
    - [x] Oat milk
    - [ ] Lemons
    """

    /// The list at the caret only; nested items too; open items and the other list untouched.
    @Test func unticksTheListAtTheCaretOnly() throws {
        let ns = Self.packing as NSString
        let at = ns.range(of: "Swimsuit").location
        #expect(ListEditing.tickedCount(in: Self.packing, at: at) == 3)
        let u = try #require(ListEditing.untickAll(in: Self.packing, at: at))
        #expect(u.count == 3)
        let after = ns.replacingCharacters(in: u.edit.range, with: u.edit.replacement)
        #expect(after == """
        Packing

        Clothes
        - [ ] Rain jacket
        - [ ] Swimsuit
        \t- [ ] Goggles
        - [ ] Good shoes

        Groceries
        - [x] Oat milk
        - [ ] Lemons
        """)
        #expect((u.edit.replacement as NSString).length == u.edit.range.length, "every line keeps its length: the caret stays put")
        #expect(u.edit.caret == -1)
    }

    /// Nothing ticked, not a checklist, or the empty line after the list: nothing to do.
    @Test func nothingToUntick() {
        let ns = Self.packing as NSString
        #expect(ListEditing.untickAll(in: Self.packing, at: ns.range(of: "Clothes").location) == nil, "a plain line")
        #expect(ListEditing.untickAll(in: Self.packing, at: 0) == nil, "the title")
        let open = "List\n- [ ] One\n- [ ] Two"
        #expect(ListEditing.untickAll(in: open, at: (open as NSString).length) == nil, "nothing ticked")
        #expect(ListEditing.tickedCount(in: open, at: 6) == 0)
        let trailing = "List\n- [x] One\n"
        #expect(ListEditing.untickAll(in: trailing, at: (trailing as NSString).length) == nil, "the empty line under the list")
        #expect(ListEditing.untickAll(in: trailing, at: 6)?.count == 1)
        #expect(EditorController.untickedNotice(1) == "Unticked 1 item")
        #expect(EditorController.untickedNotice(12) == "Unticked 12 items")
    }

    #if os(macOS)
    /// Format › Untick All: on in a list with ticks, off elsewhere; it unticks, says how many with
    /// Undo, and Edit › Undo Untick All puts every tick back in one step.
    @Test func formatMenuUnticksAndUndoesInOneStep() async throws {
        let h = await EditorHarness(Self.packing)
        defer { h.close() }
        let undo = try #require(h.view.undoManager)
        undo.groupsByEvent = false
        defer { undo.groupsByEvent = true }
        await h.caret(after: "Clothes")
        #expect(!h.controller.canUntickAll, "off on a plain line")
        await h.caret(after: "Swimsuit")
        #expect(h.controller.canUntickAll, "on in a list with ticks")
        let before = h.text
        let caret = h.selection

        undo.beginUndoGrouping()
        h.controller.untickAll()
        undo.endUndoGrouping()
        await h.settle(0.2)
        #expect(!h.text.contains("- [x] Rain jacket") && !h.text.contains("- [x] Good shoes") && !h.text.contains("\t- [x] Goggles"))
        #expect(h.text.contains("- [x] Oat milk"), "the groceries list stays as it was")
        #expect(h.selection == caret, "the caret stays where it was")
        #expect(h.controller.notice?.text == "Unticked 3 items")
        #expect(h.controller.notice?.canUndo == true)
        #expect(!h.controller.canUntickAll, "nothing left to untick here")
        #expect(undo.undoActionName == "Untick All", "Edit › Undo Untick All")
        await h.snapshot("untick-all-done-light")

        undo.undo()
        await h.settle(0.2)
        #expect(h.text == before, "one Undo puts all three ticks back")
        #expect(undo.redoActionName == "Untick All")
        undo.redo()
        await h.settle(0.2)
        #expect(!h.text.contains("- [x] Rain jacket"))
        // The notice's Undo does the same.
        h.controller.undoNotice()
        await h.settle(0.2)
        #expect(h.text == before)
    }

    /// Right-click a ticked list's circle or text: Untick All in This List, first in the menu; it
    /// unticks the list clicked, wherever the caret is. Not offered on a list with nothing ticked.
    @Test func rightClickOffersUntickAllInThisList() async throws {
        let h = await EditorHarness(Self.packing, focus: false)
        defer { h.close() }
        func rightClick(on s: String, circle: Bool) -> NSMenu? {
            let ns = h.text as NSString
            let line = ns.lineRange(for: NSRange(location: ns.range(of: s).location, length: 0)).location
            let p: CGPoint
            if circle, let r = h.view.core.checkboxRect(line: line, layout: h.view.textLayoutManager) {
                p = CGPoint(x: r.midX + h.view.textContainerOrigin.x, y: r.midY + h.view.textContainerOrigin.y)
            } else {
                let rect = h.lineRect(at: ns.range(of: s).location + 2)
                p = CGPoint(x: rect.minX + 60, y: rect.midY)
            }
            // An event made here and handed to the view, never posted anywhere.
            let e = NSEvent.mouseEvent(with: .rightMouseDown, location: h.view.convert(p, to: nil), modifierFlags: [], timestamp: 0,
                                       windowNumber: h.window.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1)
            return e.flatMap { h.view.menu(for: $0) }
        }
        let onCircle = try #require(rightClick(on: "Good shoes", circle: true))
        #expect(onCircle.items.first?.title == "Untick All in This List")
        let onText = try #require(rightClick(on: "Swimsuit", circle: false))
        #expect(onText.items.first?.title == "Untick All in This List", "on the item's words too")
        let plain = try #require(rightClick(on: "Clothes", circle: false))
        #expect(!plain.items.contains { $0.title == "Untick All in This List" }, "not on a plain line")

        // A right-click puts the caret where it lands (AppKit, as in TextEdit); Untick All leaves it there.
        await h.caret(after: "Packing")
        let item = try #require(onCircle.items.first)
        (item.representedObject as? TableMenuAction)?.fire()
        await h.settle(0.2)
        #expect(!h.text.contains("- [x] Good shoes") && !h.text.contains("- [x] Rain jacket"))
        #expect(h.text.contains("- [x] Oat milk"))
        #expect(h.selection.location == NSMaxRange((h.text as NSString).range(of: "Packing")), "the list clicked, not the caret's line; the caret stays in the title")
        let afterwards = try #require(rightClick(on: "Swimsuit", circle: false))
        #expect(!afterwards.items.contains { $0.title == "Untick All in This List" }, "nothing ticked there now")
    }

    /// Recently Deleted: shown, never changed; no Untick All.
    @Test func notInANoteYouCantChange() async throws {
        let h = await EditorHarness(Self.packing)
        defer { h.close() }
        h.controller.readOnly = true
        await h.caret(after: "Swimsuit")
        #expect(!h.controller.canUntickAll)
        h.controller.untickAll()
        #expect(h.text == Self.packing)
        #expect(h.view.untickMenuItem(at: (h.text as NSString).range(of: "Swimsuit").location) == nil)
    }
    #endif
}

#if os(macOS)
/// Share as Picture in the selection's menu.
@MainActor @Suite struct SharePictureMenuTests {
    @Test func offeredForSelectedTextOnly() async throws {
        let h = await EditorHarness("Title\n\nSome words here")
        defer { h.close() }
        var asked = 0
        h.controller.canSharePicture = { true }
        h.controller.sharePicture = { asked += 1 }
        h.view.setSelectedRange(NSRange(location: 8, length: 0))
        #expect(h.view.sharePictureMenuItem() == nil, "a caret alone selects nothing")
        h.view.setSelectedRange(NSRange(location: 7, length: 4))
        let item = try #require(h.view.sharePictureMenuItem())
        #expect(item.title == EditorController.sharePictureTitle)
        _ = item.target?.perform(item.action, with: item)
        #expect(asked == 1)
    }

    @Test func notInALockedOrDeletedNote() async throws {
        let h = await EditorHarness("Title\n\nSome words here")
        defer { h.close() }
        h.controller.canSharePicture = { false }
        h.view.setSelectedRange(NSRange(location: 7, length: 4))
        #expect(h.view.sharePictureMenuItem() == nil)
    }
}
#endif
