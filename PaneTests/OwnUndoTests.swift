import Foundation
import Testing
@testable import Pane

/// Undo in a shared note takes back only your own edits, and your steps move with everyone else's.
@Suite struct OwnUndoTests {
    /// Applies an edit to a text, as the editor would.
    static func apply(_ e: TextDiff.Edit, to text: String) -> String { (text as NSString).replacingCharacters(in: e.range, with: e.replacement) }

    /// You type at `at`, one character at a time, as keystrokes arrive.
    static func type(_ s: String, at: Int, into text: inout String, undo: OwnUndo) {
        var at = at
        for ch in s {
            let e = TextDiff.Edit(range: NSRange(location: at, length: 0), replacement: String(ch))
            undo.record(e, in: text)
            text = apply(e, to: text)
            at += (String(ch) as NSString).length
        }
    }

    /// Someone else's edit arriving.
    static func theirs(_ e: TextDiff.Edit, into text: inout String, undo: OwnUndo) {
        text = apply(e, to: text)
        undo.transform(through: e)
    }

    @Test func undoTakesBackYourTypingAndLeavesTheirs() throws {
        let undo = OwnUndo()
        var text = "Agenda\n"
        Self.type("Coffee", at: 7, into: &text, undo: undo)
        // Sara adds a line above while you type.
        Self.theirs(.init(range: NSRange(location: 7, length: 0), replacement: "Lunch\n"), into: &text, undo: undo)
        #expect(text == "Agenda\nLunch\nCoffee")
        let e = try #require(undo.undo(in: text))
        text = Self.apply(e, to: text)
        #expect(text == "Agenda\nLunch\n")
        // Nothing else of yours to undo: Sara's line stays.
        #expect(undo.undo(in: text) == nil)
        // Redo puts yours back where it is now.
        text = Self.apply(try #require(undo.redo(in: text)), to: text)
        #expect(text == "Agenda\nLunch\nCoffee")
    }

    /// Typing in a row is one step; a new line starts the next, as the system groups typing.
    @Test func typingInARowIsOneStep() throws {
        let undo = OwnUndo()
        var text = ""
        Self.type("Milk", at: 0, into: &text, undo: undo)
        Self.type("\n", at: 4, into: &text, undo: undo)
        Self.type("Eggs", at: 5, into: &text, undo: undo)
        #expect(undo.undos.count == 3)
        text = Self.apply(try #require(undo.undo(in: text)), to: text)
        #expect(text == "Milk\n")
    }

    /// Backspace right after typing takes from what you typed, so Undo removes what's there now.
    @Test func backspaceTakesFromWhatYouJustTyped() throws {
        let undo = OwnUndo()
        var text = "List: "
        Self.type("Teh", at: 6, into: &text, undo: undo)
        for _ in 0..<2 {
            let e = TextDiff.Edit(range: NSRange(location: (text as NSString).length - 1, length: 1), replacement: "")
            undo.record(e, in: text)
            text = Self.apply(e, to: text)
        }
        Self.type("he", at: 7, into: &text, undo: undo)
        #expect(text == "List: The")
        text = Self.apply(try #require(undo.undo(in: text)), to: text)
        #expect(text == "List: ")
    }

    /// A deletion of yours comes back where the text now is, after others typed before it.
    @Test func aDeletionComesBack() throws {
        let undo = OwnUndo()
        undo.now = { Date(timeIntervalSince1970: 0) }
        var text = "Bring laptop and charger"
        let cut = TextDiff.Edit(range: NSRange(location: 12, length: 12), replacement: "")
        undo.record(cut, in: text)
        text = Self.apply(cut, to: text)
        Self.theirs(.init(range: NSRange(location: 0, length: 0), replacement: "- "), into: &text, undo: undo)
        #expect(text == "- Bring laptop")
        text = Self.apply(try #require(undo.undo(in: text)), to: text)
        #expect(text == "- Bring laptop and charger")
    }

    /// When someone changes the very text you typed, that step can't be undone cleanly: it's
    /// dropped, and Undo goes to your step before it.
    @Test func aStepTheyChangedIsDropped() throws {
        let undo = OwnUndo()
        var clock = Date(timeIntervalSince1970: 0)
        undo.now = { clock }
        var text = ""
        Self.type("One", at: 0, into: &text, undo: undo)
        clock += 10
        Self.type(" two", at: 3, into: &text, undo: undo)
        // Sara rewrites "two".
        Self.theirs(.init(range: NSRange(location: 4, length: 3), replacement: "2"), into: &text, undo: undo)
        #expect(text == "One 2")
        text = Self.apply(try #require(undo.undo(in: text)), to: text)
        #expect(text == " 2")
        #expect(undo.undo(in: text) == nil)
    }

    /// Their typing right after yours doesn't move or drop your step.
    @Test func theirTypingRightAfterYoursLeavesYourStep() throws {
        let undo = OwnUndo()
        var text = ""
        Self.type("Hi", at: 0, into: &text, undo: undo)
        Self.theirs(.init(range: NSRange(location: 2, length: 0), replacement: " Sara here"), into: &text, undo: undo)
        text = Self.apply(try #require(undo.undo(in: text)), to: text)
        #expect(text == " Sara here")
    }

    /// Emoji and other characters outside the basic plane count as the editor counts (UTF-16).
    @Test func emojiCountAsTheEditorCounts() throws {
        let undo = OwnUndo()
        var text = "🍕 "
        Self.type("pizza", at: 3, into: &text, undo: undo)
        Self.theirs(.init(range: NSRange(location: 0, length: 0), replacement: "🎉"), into: &text, undo: undo)
        text = Self.apply(try #require(undo.undo(in: text)), to: text)
        #expect(text == "🎉🍕 ")
    }
}
