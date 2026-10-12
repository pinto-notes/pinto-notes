import Foundation
import Testing
@testable import Pane

/// The Aa popover ticks the style of the line the caret is on.
@Suite struct FormatPopoverTests {
    func style(_ text: String, at needle: String) -> ListEditing.ParagraphStyle {
        ListEditing.paragraphStyle(in: text, selection: NSRange(location: (text as NSString).range(of: needle).location, length: 0))
    }

    @Test func theCaretsLineHasOneStyle() {
        let note = "Weekend\n\nplain text\n## Groceries\n### Ideas\n# Big\n* milk\n- eggs\n1. first\n- [ ] todo\n- [x] done\n> said"
        #expect(style(note, at: "Weekend") == .title, "the first written line is the title")
        #expect(style(note, at: "plain") == .body)
        #expect(style(note, at: "## Groceries") == .heading)
        #expect(style(note, at: "### Ideas") == .subheading)
        #expect(style(note, at: "# Big") == .title)
        #expect(style(note, at: "milk") == .bulleted)
        #expect(style(note, at: "eggs") == .dashed)
        #expect(style(note, at: "first") == .numbered)
        #expect(style(note, at: "todo") == .checklist)
        #expect(style(note, at: "done") == .checklist)
        #expect(style(note, at: "said") == .quote)
    }

    @Test func emptyNotesAndTagsAreBody() {
        #expect(ListEditing.paragraphStyle(in: "", selection: NSRange(location: 0, length: 0)) == .body)
        #expect(style("Title\n#tag not a heading", at: "#tag") == .body)
        // A caret past the end (the text changed under it) is the last line.
        #expect(ListEditing.paragraphStyle(in: "Title\nbody", selection: NSRange(location: 99, length: 0)) == .body)
    }
}
