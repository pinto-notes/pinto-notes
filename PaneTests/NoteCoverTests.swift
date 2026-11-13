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

    @Test func addIconPutsASelectedEmojiBeforeTheTitle() {
        let text = "\nLemon pasta\nBoil."
        let edit = NoteCover.iconEdit("🍋", in: text)
        let applied = (text as NSString).replacingCharacters(in: edit.range, with: edit.replacement)
        #expect(applied == "\n🍋 Lemon pasta\nBoil.")
        #expect(edit.selection == NSRange(location: 1, length: 2), "the icon is selected, so the emoji panel's pick replaces it")
        #expect(NoteCover.iconLength("🍋 Lemon pasta") != nil, "and it reads as the icon")
        #expect(EditorController.startIcons.allSatisfy { NoteCover.iconLength($0 + " Title") != nil }, "every starting icon counts as one")
    }

    #if os(macOS)
    @Test func listThumbnailsAreDecodedSharp() throws {
        let dir = FileManager.default.temporaryDirectory.appending(path: "thumb-\(UUID())")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dir) }
        let url = dir.appending(path: "photo.png")
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1500, pixelsHigh: 1000, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        try #require(rep.representation(using: .png, properties: [:])).write(to: url)
        let image = try #require(FileThumbnail.decode(url, pixels: 32 * 2 * 2))
        #expect(min(image.width, image.height) >= 64, "the short side still fills a 32-point square at 2x: \(image.width)x\(image.height)")
        #expect(max(image.width, image.height) <= 128, "and no bigger than needed")
    }
    #endif

    /// The banner stays a banner in a wide, tall window: 220 points at most, under a third of it.
    @Test func theCoverNeverTakesTheScreen() {
        let keep = (ImageSizes.column, ImageSizes.viewHeight)
        defer { (ImageSizes.column, ImageSizes.viewHeight) = keep }
        let e = LineEmbed(kind: .image(id, name: "x.jpg|cover"), range: NSRange(location: 0, length: 1), index: 0)
        ImageSizes.column = 760; ImageSizes.viewHeight = 840
        #expect(ImageSizes.size(for: e).height == 220)
        ImageSizes.column = 760; ImageSizes.viewHeight = 500
        #expect(ImageSizes.size(for: e).height == 150)
        ImageSizes.column = 400; ImageSizes.viewHeight = 900
        #expect(ImageSizes.size(for: e).height == 125)
    }

    /// The picker's icon goes in front of the title, replaces the one there, and Remove takes it
    /// away with its space; the cover line under the title stays.
    @Test func pickingAnIconSetsReplacesAndRemovesIt() {
        let text = "Green curry\n" + line + "\nThai basil."
        let one = NoteCover.settingIcon("🍛", in: text)
        #expect(one == "🍛 Green curry\n" + line + "\nThai basil.")
        #expect(NoteCover.icon(of: one) == "🍛")
        let two = NoteCover.settingIcon("🥘", in: one)
        #expect(two == "🥘 Green curry\n" + line + "\nThai basil.")
        #expect(NoteCover.settingIcon(nil, in: two) == text)
        #expect(NoteCover.icon(of: text) == nil)
    }

    /// Search finds emojis by their names, every word typed.
    @Test func iconSearchFindsByName() {
        #expect(IconEmoji.search("curry").contains("🍛"))
        #expect(IconEmoji.search("lemon").contains("🍋"))
        #expect(IconEmoji.search("zzzz nothing").isEmpty)
        // The recording's "cart" found nothing: 🛒 sat outside every kind's range.
        #expect(IconEmoji.search("cart").contains("🛒"))
        #expect(IconEmoji.search("rocket").contains("🚀"))
        #expect(Set(IconEmoji.search("lemon")).count == IconEmoji.search("lemon").count, "each emoji once")
        #expect(IconEmoji.groups[0].emojis.contains("🍝"), "food first")
    }
}
