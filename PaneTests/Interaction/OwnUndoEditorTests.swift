#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// Undo in a shared note, in the real Mac editor: Edit › Undo takes back your typing and leaves
/// what arrived from someone else, and it's enabled only when there's something of yours.
@MainActor @Suite(.serialized) struct OwnUndoEditorTests {
    @Test func undoLeavesTheirText() async throws {
        let h = await EditorHarness("Team offsite\n")
        h.controller.ownUndo = OwnUndo()
        h.view.allowsUndo = false
        await h.select(13)
        await h.type("Bring snacks")
        // Sara's line arrives above, through the same path as any text from elsewhere.
        h.view.syncExternal("Team offsite\nAgenda first\nBring snacks")
        await h.settle()
        #expect(h.text == "Team offsite\nAgenda first\nBring snacks")
        let item = NSMenuItem(title: "Undo", action: #selector(PaneTextView.undo(_:)), keyEquivalent: "z")
        #expect(h.view.validateUserInterfaceItem(item))
        h.view.undo(nil)
        await h.settle()
        #expect(h.text == "Team offsite\nAgenda first\n")
        // Nothing of yours left: Undo is off, and pressing it changes nothing.
        #expect(!h.view.validateUserInterfaceItem(item))
        h.view.undo(nil)
        #expect(h.text == "Team offsite\nAgenda first\n")
        // Redo brings yours back, below Sara's line.
        h.view.redo(nil)
        await h.settle()
        #expect(h.text == "Team offsite\nAgenda first\nBring snacks")
    }

    /// An undo is reported like typing, so it's saved and sent to the others.
    @Test func anUndoIsReportedLikeTyping() async throws {
        let h = await EditorHarness("Notes\n")
        h.controller.ownUndo = OwnUndo()
        var reported: [String] = []
        h.view.core.onChange = { reported.append($0) }
        await h.select(6)
        await h.type("hello")
        h.view.undo(nil)
        await h.settle()
        #expect(reported.last == "Notes\n")
        // And an undo isn't itself a step to undo.
        #expect(h.controller.ownUndo?.canUndo == false && h.controller.ownUndo?.canRedo == true)
    }
}
#endif
