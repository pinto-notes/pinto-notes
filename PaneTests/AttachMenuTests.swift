import Foundation
import Testing
@testable import Pane

/// Attach › Link to a Note… makes the link that typing `[[` makes: one kind of link to a note.
@Suite struct AttachMenuTests {
    func insert(_ title: String, into text: String, at selected: String = "") -> (String, Int) {
        let ns = text as NSString
        let sel = selected.isEmpty ? NSRange(location: ns.length, length: 0) : ns.range(of: selected)
        let e = WikiLinks.insertion(of: title, in: text, selection: sel)
        return (ns.replacingCharacters(in: e.range, with: e.replacement), e.caret)
    }

    @Test func theLinkIsAWikiLinkAtTheCaret() {
        let (text, caret) = insert("Reading list", into: "See ")
        #expect(text == "See [[Reading list]]")
        #expect(caret == (text as NSString).length, "the caret ends after the link")
        #expect(WikiLinks.links(in: text).map(\.target) == ["Reading list"], "the editor reads it as a link to that note")
    }

    @Test func selectedWordsBecomeWhatTheLinkShows() {
        let (text, _) = insert("Kitchen remodel", into: "Talk about the budget today", at: "the budget")
        #expect(text == "Talk about [[Kitchen remodel|the budget]] today")
        let link = WikiLinks.links(in: text)[0]
        #expect(link.target == "Kitchen remodel")
        #expect(WikiLinks.display(link) == "the budget")
        // The title itself selected, or words a link can't hold: a plain link.
        #expect(insert("Kitchen remodel", into: "kitchen remodel", at: "kitchen remodel").0 == "[[Kitchen remodel]]")
        #expect(insert("Plan", into: "a|b", at: "a|b").0 == "[[Plan]]")
    }

    @Test func aStaleSelectionIsHeldInsideTheText() {
        let e = WikiLinks.insertion(of: "Plan", in: "abc", selection: NSRange(location: 9, length: 4))
        #expect(e.range == NSRange(location: 3, length: 0))
    }

    @Test func returnTakesTheHighlightedTitleOrTheFirst() {
        #expect(NoteLinkPicker.choice(in: ["A", "B"], highlighted: 1) == "B")
        #expect(NoteLinkPicker.choice(in: ["A", "B"], highlighted: 7) == "A")
        #expect(NoteLinkPicker.choice(in: [], highlighted: 0) == nil)
    }
}
