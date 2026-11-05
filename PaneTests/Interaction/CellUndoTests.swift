#if os(iOS)
import Testing
import UIKit
@testable import Pane

/// Typing in a table cell on the iPhone goes into the note with the note's text view not first
/// responder. One Undo takes back what was typed, not one letter, and the Undo button stays while
/// there's more to undo (persona council r7, bug 4).
@MainActor @Suite(.serialized) struct CellUndoTests {
    static let body = "Porto\n\n| Day | Plan |\n| --- | --- |\n| Sat |  |\n"

    @Test func oneUndoTakesBackWhatWasTypedInACell() async throws {
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        let v = PaneTextView(frame: window.bounds)
        v.configure(text: Self.body, header: "")
        window.addSubview(v)
        window.isHidden = false
        defer { window.isHidden = true }
        v.layoutIfNeeded()
        #expect(!v.isFirstResponder, "the cell has the keyboard, not the note")
        var at = (Self.body as NSString).range(of: "| Sat | ").location + 8
        for ch in "Ribeira walk" {
            v.apply(TextEdit(range: NSRange(location: at, length: 0), replacement: String(ch), caret: -1))
            at += 1
            try? await Task.sleep(for: .seconds(0.05))
        }
        let typed: String = v.text ?? ""
        #expect(typed.contains("| Sat | Ribeira walk |"))
        let undo = try #require(v.undoManager)
        #expect(undo.canUndo)
        undo.undo()
        try? await Task.sleep(for: .seconds(0.1))
        #expect(v.text == Self.body, "all of it, not one letter: \(String(describing: v.text))")
        #expect(undo.canRedo)
        undo.redo()
        try? await Task.sleep(for: .seconds(0.1))
        #expect(v.text == typed, "and back")
    }
}
#endif
