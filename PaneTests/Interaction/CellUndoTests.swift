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
        // Typing in the note first, keyboard up: a step that must survive the cell's.
        v.becomeFirstResponder()
        v.selectedRange = NSRange(location: ("Porto" as NSString).length, length: 0)
        v.insertText(" weekend")
        try? await Task.sleep(for: .seconds(0.4))
        let beforeCell: String = v.text ?? ""
        #expect(beforeCell.hasPrefix("Porto weekend"))
        v.resignFirstResponder()
        #expect(!v.isFirstResponder, "the cell has the keyboard, not the note")
        var at = (beforeCell as NSString).range(of: "| Sat | ").location + 8
        for ch in "Ribeira walk" {
            v.apply(TextEdit(range: NSRange(location: at, length: 0), replacement: String(ch), caret: -1))
            at += 1
            try? await Task.sleep(for: .seconds(0.05))
        }
        // The cell's field is laid over the text, inside it, and has the keyboard. It records its
        // typing letter by letter with the undo manager it finds up its responder chain.
        let field = UITextField(frame: CGRect(x: 0, y: 0, width: 100, height: 30))
        v.addSubview(field)
        #expect(field.becomeFirstResponder())
        field.undoManager?.registerUndo(withTarget: field) { $0.text = "Ribeira wal" }
        let undo = try #require(v.noteStack)
        #expect(field.undoManager !== undo, "the cell's letters stay off the note's steps")
        let typed: String = v.text ?? ""
        #expect(typed.contains("| Sat | Ribeira walk |"))
        #expect(undo.canUndo)
        // The bar's Undo.
        v.undoStep(redo: false)
        try? await Task.sleep(for: .seconds(0.1))
        #expect(v.text == beforeCell, "all of it, not one letter: \(String(describing: v.text))")
        #expect(undo.canUndo, "the note's typing before it is still there to undo")
        v.undoStep(redo: false)
        try? await Task.sleep(for: .seconds(0.1))
        #expect(v.text == Self.body, "and a second Undo takes it back: \(String(describing: v.text))")
        undo.redo(); undo.redo()
        try? await Task.sleep(for: .seconds(0.1))
        #expect(v.text == typed, "and back")
    }
}
#endif
