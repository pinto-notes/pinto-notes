import Foundation
import Testing
@testable import Pane

/// Review an AI's edit part by part (persona council, 4 November 2026: Jonas, Maya, Marcus): the
/// parts in order, Keep and Undo for each, Keep All and Undo All, the count at the end, and a part
/// you changed since refused with the reason, your typing kept.
@Suite struct AIReviewTests {
    static let before = """
    Sync rewrite

    Plan
    - [ ] Queue the writes
    - [ ] Retry on reconnect

    Notes
    Keep the old path for a week.
    """
    /// Claude rewrote one item, added one, and replaced the notes line with two.
    static let after = """
    Sync rewrite

    Plan
    - [ ] Queue the writes offline, in order
    - [ ] Retry on reconnect
    - [ ] Have Codex review it

    Notes
    Drop the old path now.
    Tell Leo.
    """

    @Test func thePartsComeInOrderWithWhatWasThere() throws {
        let r = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        #expect(r.parts.count == 3)
        #expect(r.parts[0].removed == ["- [ ] Queue the writes"] && r.parts[0].added == ["- [ ] Queue the writes offline, in order"])
        #expect(r.parts[1].removed.isEmpty && r.parts[1].added == ["- [ ] Have Codex review it"])
        #expect(r.parts[2].removed == ["Keep the old path for a week."] && r.parts[2].added == ["Drop the old path now.", "Tell Leo."])
        #expect(r.title == "Claude changed 3 parts" && r.position == "1 of 3")
    }

    @Test func undoingOnePartLeavesTheOthers() throws {
        var r = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        r.keep(0)
        #expect(r.focus == 1, "moves on to the next part")
        var text = try r.undo(1, in: Self.after)
        #expect(!text.contains("Have Codex review it"))
        #expect(text.contains("Queue the writes offline, in order") && text.contains("Drop the old path now."))
        text = try r.undo(2, in: text)
        #expect(text.contains("Keep the old path for a week.") && !text.contains("Tell Leo."))
        #expect(r.isFinished && r.result == "Kept 1, undid 2")
    }

    @Test func undoAllPutsItAllBackAndKeepAllChangesNothing() throws {
        var r = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        let (text, refused) = r.undoAll(in: Self.after)
        #expect(refused == 0 && text == Self.before && r.result == "Undid 3")
        var k = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        k.keepAll()
        #expect(k.isFinished && k.result == "Kept 3")
        // Leaving midway leaves the rest as the AI wrote it, and says so.
        var m = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        _ = try m.undo(0, in: Self.after)
        #expect(m.result == "Undid 1 \u{00B7} 2 parts left as Claude wrote them")
    }

    /// Round 1 of the councils: Done with parts undecided kept them without a word. The closing
    /// line now counts them; a part whose Undo was refused stays as you changed it, so it counts
    /// as kept, not as left.
    @Test func doneSaysWhatWasLeftAsTheAIWroteIt() throws {
        let r = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        #expect(r.left == 3 && r.result == "3 parts left as Claude wrote them")
        var one = AIReview(by: "ChatGPT", previous: Self.before, after: Self.after)
        one.keep(0)
        one.keep(1)
        #expect(one.result == "Kept 2 \u{00B7} 1 part left as ChatGPT wrote it")
        var mixed = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        mixed.keep(0)
        _ = try mixed.undo(1, in: Self.after)
        #expect(mixed.result == "Kept 1, undid 1 \u{00B7} 1 part left as Claude wrote it")
        // A refused part: kept, not left.
        var c = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        let typed = Self.after.replacingOccurrences(of: "Tell Leo.", with: "Tell Leo and Maya.")
        _ = try? c.undo(2, in: typed)
        let text = try c.undo(1, in: typed)
        _ = try c.undo(0, in: text)
        #expect(c.left == 0 && c.result == "Kept 1, undid 2")
    }

    /// You typed above a part and below it since: undoing it still finds it, and your lines stay.
    @Test func typingElsewhereStays() throws {
        var r = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        let typed = Self.after.replacingOccurrences(of: "Sync rewrite\n", with: "Sync rewrite\nTonight.\n") + "\nP.S. ship Friday"
        let text = try r.undo(2, in: typed)
        #expect(text.contains("Tonight.") && text.hasSuffix("P.S. ship Friday"), "your typing stays")
        #expect(text.contains("Keep the old path for a week.") && !text.contains("Tell Leo."))
        // And a part further up, after that.
        let again = try r.undo(0, in: text)
        #expect(again.contains("- [ ] Queue the writes\n") && again.contains("Tonight.") && again.contains("Have Codex review it"))
    }

    /// You changed the part itself since: Undo says why and changes nothing.
    @Test func aPartYouChangedSinceIsRefused() throws {
        var r = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        let typed = Self.after.replacingOccurrences(of: "Tell Leo.", with: "Tell Leo and Maya.")
        #expect(throws: AIReview.Failure.changedSince) { try r.undo(2, in: typed) }
        #expect(r.parts[2].conflict && r.parts[2].decision == nil)
        #expect(AIReview.conflictLine.contains("You changed this part since"))
        // The other parts still undo.
        let text = try r.undo(1, in: typed)
        #expect(text.contains("Tell Leo and Maya.") && !text.contains("Have Codex"))
        // A line typed inside a part counts as changing it.
        var s = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        let inside = Self.after.replacingOccurrences(of: "Drop the old path now.\n", with: "Drop the old path now.\nAsk first.\n")
        #expect(throws: AIReview.Failure.changedSince) { try s.undo(2, in: inside) }
    }

    /// A part that only took lines out comes back where they were.
    @Test func aRemovedLineComesBack() throws {
        let before = "List\n- [ ] Milk\n- [ ] Eggs\n- [ ] Bread"
        let after = "List\n- [ ] Milk\n- [ ] Bread"
        var r = AIReview(by: "ChatGPT", previous: before, after: after)
        #expect(r.parts.count == 1 && r.parts[0].removed == ["- [ ] Eggs"] && r.parts[0].added.isEmpty)
        #expect(try r.undo(0, in: after) == before)
        // With a line typed at the top since.
        var t = AIReview(by: "ChatGPT", previous: before, after: after)
        #expect(try t.undo(0, in: "Today\n" + after) == "Today\n" + before)
    }

    @Test func aReceiptReviewsOnlyAnEditOfTheText() {
        let edit = AIEdit.Receipt(noteID: UUID(), by: "Claude", at: .now, previous: Self.before, after: Self.after, lines: 4)
        #expect(AIReview(edit)?.parts.count == 3)
        var wrote = edit
        wrote.created = true
        #expect(AIReview(wrote) == nil, "a note it wrote is undone whole")
        var page = edit
        page.kind = .pageEdit
        #expect(AIReview(page) == nil)
        var noAfter = edit
        noAfter.after = nil
        #expect(AIReview(noAfter) == nil)
    }

    @Test func blankLinesAloneAreNotAPart() {
        let r = AIReview(by: "Claude", previous: "A\nB", after: "A\n\nB\nC")
        #expect(r.parts.map(\.added) == [["C"]])
    }

    @Test func keysMoveAndTheLocationFollowsYourTyping() throws {
        var r = AIReview(by: "Claude", previous: Self.before, after: Self.after)
        r.move(1); r.move(5)
        #expect(r.focus == 2)
        r.move(-9)
        #expect(r.focus == 0)
        let at = try #require(r.location(of: 2, in: Self.after))
        #expect((Self.after as NSString).substring(from: at).hasPrefix("Drop the old path now."))
        let typed = "Tonight.\n" + Self.after
        let moved = try #require(r.location(of: 2, in: typed))
        #expect((typed as NSString).substring(from: moved).hasPrefix("Drop the old path now."))
    }
}
