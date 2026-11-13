import Foundation
#if os(macOS)
import AppKit
#else
import UIKit
#endif
import Testing
@testable import Pane

/// A note's cover and icon (NoteCover, Emil 2026-11-13): a Cover-size picture on the line after the
/// title is drawn above the title; an emoji the title starts with is its icon. Both stay Markdown.
@MainActor @Suite(.serialized) struct NoteCoverTests {
    let id = UUID(uuidString: "11111111-2222-3333-4444-555555555555")!
    var line: String { NoteCover.line(id: id, filename: "Lemons.jpg") }

    @Test func coverLineIsAPictureAtCoverSize() {
        #expect(line == "![Lemons.jpg|cover](pane-file:11111111-2222-3333-4444-555555555555)")
        #expect(NoteCover.line(id: id, filename: "a|b.png").contains("[a-b.png|cover]"), "a bar in the name can't read as a size")
    }

    @Test func onlyTheLineAfterTheTitleIsTheCover() {
        #expect(NoteCover.find(in: "Lemon pasta\n\(line)\nBoil.")?.id == id)
        #expect(NoteCover.find(in: "\n\nLemon pasta\n\n\(line)\n")?.id == id, "blank lines around the title don't count")
        #expect(NoteCover.find(in: "Lemon pasta\nBoil.\n\(line)") == nil, "lower down it's a banner in the text, not the cover")
        #expect(NoteCover.find(in: "Lemon pasta\n![Lemons.jpg](pane-file:\(id.uuidString))") == nil, "a picture at its own size isn't a cover")
        #expect(NoteCover.find(in: "\(line)\nLemon pasta") == nil, "a picture as the first line isn't under a title")
    }

    @Test func addingPutsItRightAfterTheTitle() {
        #expect(NoteCover.setting(line, in: "Lemon pasta\nBoil.") == "Lemon pasta\n\(line)\nBoil.")
        #expect(NoteCover.setting(line, in: "Lemon pasta") == "Lemon pasta\n\(line)\n")
        #expect(NoteCover.setting(line, in: "") == "New Note\n\(line)\n")
    }

    @Test func changingReplacesTheOldOne() {
        let old = NoteCover.line(id: UUID(), filename: "Old.jpg")
        #expect(NoteCover.setting(line, in: "Lemon pasta\n\(old)\nBoil.") == "Lemon pasta\n\(line)\nBoil.")
    }

    @Test func aPictureInTheTextMovesUpToBeTheCover() {
        let text = "Lemon pasta\nBoil.\n![Lemons.jpg](pane-file:\(id.uuidString.lowercased()))\nServe."
        let range = (text as NSString).range(of: "![Lemons.jpg]")
        let lineRange = (text as NSString).lineRange(for: range)
        let picture = NSRange(location: lineRange.location, length: lineRange.length - 1)
        #expect(NoteCover.setting(line, in: text, moving: picture) == "Lemon pasta\n\(line)\nBoil.\nServe.")
    }

    @Test func removingTakesOnlyTheCoverLine() {
        #expect(NoteCover.removing(from: "Lemon pasta\n\(line)\nBoil.") == "Lemon pasta\nBoil.")
        #expect(NoteCover.removing(from: "Lemon pasta\nBoil.") == "Lemon pasta\nBoil.")
    }

    @Test func oneEditKeepsTheCaretOnItsWord() throws {
        let old = "Lemon pasta\nBoil the water."
        let new = NoteCover.setting(line, in: old)
        let caret = (old as NSString).range(of: "water").location
        let edit = try #require(NoteCover.edit(from: old, to: new, selection: NSRange(location: caret, length: 0)))
        let applied = (old as NSString).replacingCharacters(in: edit.range, with: edit.replacement)
        #expect(applied == new)
        #expect((applied as NSString).substring(with: NSRange(location: edit.caret, length: 5)) == "water")
    }

    @Test func anEmojiStartingTheTitleIsTheIcon() {
        #expect(NoteCover.iconLength("🍋 Lemon pasta") == 3, "the lemon (2 UTF-16 units) and its space")
        #expect(NoteCover.iconLength("👩‍🍳 Mormor") == "👩‍🍳".utf16.count + 1, "a joined emoji is one icon")
        #expect(NoteCover.iconLength("🍋") == 2, "an icon alone is the whole title")
        #expect(NoteCover.iconLength("Lemon pasta") == nil)
        #expect(NoteCover.iconLength("1 Lemon") == nil, "a digit isn't an emoji")
        #expect(NoteCover.iconLength("🍋Lemon") == nil, "it needs its space to be an icon")
        #expect(NoteCover.iconLength("© 2026") == nil, "a text symbol isn't an icon")
    }

    @Test func theEditorLeavesRoomAboveTheTitleForTheBanner() throws {
        let text = "Lemon pasta\n\(line)\nBoil."
        let cover = try #require(NoteCover.find(LineEmbed.find(in: text), in: text as NSString))
        let core = EditorCore()
        let storage = NSTextStorage(string: text)
        core.restyle(storage, selection: nil, force: true)
        #expect(abs(core.coverRoom - (cover.height + NoteCover.gap)) < 0.5, "room for the banner: \(core.coverRoom)")
        let coverLine = try #require(storage.attribute(.paragraphStyle, at: cover.range.location, effectiveRange: nil) as? NSParagraphStyle)
        #expect(coverLine.maximumLineHeight < 1, "the cover's own line takes no room")
        storage.replaceCharacters(in: NSRange(location: 0, length: storage.length), with: NoteCover.removing(from: text))
        core.restyle(storage, selection: nil, force: true)
        #expect(core.coverRoom == 0, "no cover, no room")
    }
}
