#if os(macOS)
import AppKit
import SwiftUI
import Testing
import UniformTypeIdentifiers
@testable import Pane

/// The small things around a picture, a file, a link card or a note's card in a note, the way
/// Notes does them: getting the caret past one, selecting one, deleting one and getting it back,
/// putting one in, and nothing in the note moving while you do.
@MainActor @Suite(.serialized) struct AttachmentInteractionTests {
    static let fileID = UUID(uuidString: "6F1E2D3C-4B5A-4978-8695-A4B3C2D1E0F9")!
    static let fileLine = "[Report.pdf](pane-file:\(fileID.uuidString.lowercased()))"
    static let text = "Title\nBefore\n\(fileLine)\nAfter\n"
    var fileKey: String { "f\(Self.fileID)" }

    func embedRange(_ h: EditorHarness, _ line: String = Self.fileLine) -> NSRange { (h.text as NSString).range(of: line) }
    func offset(of s: String, _ h: EditorHarness) -> Int { (h.text as NSString).range(of: s).location }

    func isSelected(_ h: EditorHarness, _ key: String) -> Bool {
        if case .embed(_, _, _, let selected) = h.view.cardContent[key] { return selected }
        return false
    }

    /// The mean colour (red + green + blue) of what an embed draws, only where it draws (a
    /// compact file is a chip at the left of a line-wide view), to tell whether it looks different.
    func brightness(_ h: EditorHarness, _ key: String) async -> CGFloat {
        await h.settle(0.15)
        guard let host = h.view.cardHosts[key], let rep = host.bitmapImageRepForCachingDisplay(in: host.bounds) else { return -1 }
        host.cacheDisplay(in: host.bounds, to: rep)
        var sum: CGFloat = 0, n: CGFloat = 0
        for x in stride(from: 0, to: rep.pixelsWide, by: 2) {
            for y in stride(from: 0, to: rep.pixelsHigh, by: 2) {
                guard let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB), c.alphaComponent > 0.5 else { continue }
                sum += c.redComponent + c.greenComponent + c.blueComponent
                n += 1
            }
        }
        return n > 0 ? sum / n : -1
    }

    // MARK: The caret goes around it

    @Test func arrowsStepOverAFile() async {
        let h = await EditorHarness(Self.text)
        defer { h.close() }
        let e = embedRange(h)
        await h.caret(after: "Before")
        await h.press(EditorHarness.down)
        #expect(h.selection.location == offset(of: "After", h), "down from the line above lands on the line below")
        await h.press(EditorHarness.up)
        #expect(h.selection.location < e.location, "up from below lands above, never inside the file's line")
        await h.caret(after: "Before")
        await h.press(EditorHarness.right)
        #expect(h.selection.location == offset(of: "After", h))
        await h.press(EditorHarness.left)
        #expect(h.selection.location == offset(of: "Before", h) + 6)
    }

    // MARK: Selecting it

    /// Select All takes in the file: it shows selected, as Notes tints an attachment in a selection,
    /// and stops when the selection goes.
    @Test func aSelectionAcrossAFileShowsIt() async {
        let h = await EditorHarness(Self.text)
        defer { h.close() }
        let plain = await brightness(h, fileKey)
        #expect(!isSelected(h, fileKey))
        await h.select(0, (h.text as NSString).length)
        #expect(isSelected(h, fileKey), "in the selection")
        let tinted = await brightness(h, fileKey)
        #expect(abs(tinted - plain) > 0.03, "and it looks selected: \(plain) then \(tinted)")
        await h.snapshot("attachment-file-selected")
        await h.caret(after: "After")
        #expect(!isSelected(h, fileKey), "a caret elsewhere: no longer")
    }

    /// A click on a file selects it, like Notes (its double-click opens it): the text has the
    /// keyboard, so Delete takes it away with its line.
    @Test func aClickedFileIsSelectedAndDeleteRemovesIt() async {
        let h = await EditorHarness(Self.text)
        defer { h.close() }
        h.view.selectEmbed(fileKey)
        await h.settle()
        #expect(h.selection == embedRange(h))
        #expect(h.window.firstResponder === h.view)
        #expect(isSelected(h, fileKey))
        await h.press(EditorHarness.delete)
        #expect(h.text == "Title\nBefore\nAfter\n", "the file and its line, not an empty line where it was")
        #expect(h.selection.location == offset(of: "After", h))
    }

    @Test func arrowsGoOnFromASelectedFile() async {
        let h = await EditorHarness(Self.text)
        defer { h.close() }
        h.view.selectEmbed(fileKey)
        await h.settle()
        await h.press(EditorHarness.left)
        #expect(h.selection == NSRange(location: offset(of: "Before", h) + 6, length: 0), "← goes before it")
        h.view.selectEmbed(fileKey)
        await h.settle()
        await h.press(EditorHarness.right)
        #expect(h.selection == NSRange(location: offset(of: "After", h), length: 0), "→ goes after it")
    }

    /// Space on a selected file opens it in Quick Look, as in Notes and the Finder; the text stays.
    @Test func spaceOpensASelectedFile() async throws {
        let file = try FileStore.importData(Data("%PDF-1.4".utf8), filename: "Report.pdf", type: .pdf)
        defer { FileStore.remove(file) }
        let line = FileStore.markdown(id: file.id, filename: file.filename, image: false)
        let h = await EditorHarness("Title\nBefore\n\(line)\nAfter\n")
        defer { h.close() }
        h.controller.resolveAttachment = { $0 == file.id ? file : nil }
        h.view.selectEmbed("f\(file.id)")
        await h.settle()
        let before = h.text
        await h.key(49, " ")
        #expect(h.text == before, "nothing typed")
        #expect(h.controller.previewURL == FileStore.url(for: file.id, filename: file.filename))
    }

    // MARK: Delete and Undo

    @Test func backspaceRemovesTheFileAndUndoBringsItBack() async throws {
        let h = await EditorHarness(Self.text)
        defer { h.close() }
        let undo = try #require(h.view.undoManager)
        undo.groupsByEvent = false
        defer { undo.groupsByEvent = true }
        let afterY = h.lineRect(at: offset(of: "After", h)).minY
        #expect(h.overlays.count == 1)
        await h.select(offset(of: "After", h))
        undo.beginUndoGrouping()
        await h.press(EditorHarness.delete)
        undo.endUndoGrouping()
        #expect(h.text == "Title\nBefore\nAfter\n")
        #expect(h.overlays.isEmpty)
        undo.undo()
        await h.settle(0.1)
        #expect(h.text == Self.text)
        #expect(h.overlays.count == 1, "the file shows again")
        #expect(abs(h.lineRect(at: offset(of: "After", h)).minY - afterY) < 0.5, "the line below is back where it was")
        let e = embedRange(h)
        #expect(!(h.selection.length == 0 && h.selection.location >= e.location && h.selection.location <= NSMaxRange(e)) || h.selection.location == e.location - 1,
                "the caret isn't left inside its hidden line: \(h.selection)")
    }

    // MARK: Pictures

    /// A flat PNG of `width` x `height` pixels, in Pane's files.
    func picture(_ width: Int, _ height: Int) throws -> Pane.Attachment {
        let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(),
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.setFillColor(CGColor(red: 0.2, green: 0.5, blue: 0.3, alpha: 1))
        ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
        let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
        return try FileStore.importData(rep.representation(using: .png, properties: [:])!, filename: "Garden.png", type: .png)
    }

    /// A clicked picture shows selected, and Delete takes it away with its line.
    @Test func aClickedPictureShowsSelected() async throws {
        let image = try picture(800, 400)
        defer { FileStore.remove(image) }
        let line = FileStore.markdown(id: image.id, filename: image.filename, image: true)
        let h = await EditorHarness("Title\nBefore\n\(line)\nAfter\n")
        defer { h.close() }
        h.controller.resolveAttachment = { $0 == image.id ? image : nil }
        h.view.core.resolveAttachment = h.controller.resolveAttachment
        h.view.setImages(1)
        await h.settle(0.2)
        let key = "f\(image.id)"
        let plain = await brightness(h, key)
        h.view.selectEmbed(key)
        await h.settle()
        #expect(isSelected(h, key))
        let tinted = await brightness(h, key)
        #expect(abs(tinted - plain) > 0.03, "it looks selected: \(plain) then \(tinted)")
        await h.snapshot("attachment-picture-selected")
        await h.press(EditorHarness.delete)
        #expect(h.text == "Title\nBefore\nAfter\n")
    }

    /// A picture above what you're reading that arrives from the server (its size known only
    /// then): what you're reading stays where it is on screen.
    @Test func aPictureArrivingAboveDoesntMoveWhatYoureReading() async throws {
        let image = try picture(1000, 1000)
        defer { FileStore.remove(image) }
        let line = FileStore.markdown(id: image.id, filename: image.filename, image: true)
        let lines = (1...80).map { "Line \($0)" }.joined(separator: "\n")
        let h = await EditorHarness("Title\n\(line)\n" + lines + "\n", height: 500)
        defer { h.close() }
        let clip = h.scroll.contentView
        h.view.scrollRangeToVisible(NSRange(location: offset(of: "Line 50", h), length: 0))
        await h.settle(0.1)
        let shown = h.lineRect(at: offset(of: "Line 50", h)).minY - clip.bounds.minY
        // Its bytes arrive: the line is laid out at the picture's own height now.
        h.controller.resolveAttachment = { $0 == image.id ? image : nil }
        h.view.core.resolveAttachment = h.controller.resolveAttachment
        h.view.setImages(1)
        await h.settle(0.3)
        #expect(ImageSizes.aspect[image.id] == 1, "its size is known")
        let now = h.lineRect(at: offset(of: "Line 50", h)).minY - clip.bounds.minY
        #expect(abs(now - shown) < 1, "Line 50 was \(shown) from the top, now \(now)")
    }

    // MARK: Putting one in

    /// A file put in where you're typing, far down a long note: the note doesn't move under you
    /// (once, or twice as a table's did), and the caret is under the file.
    @Test func puttingAFileInDoesntMoveTheNote() async {
        let lines = (1...80).map { "Line \($0)" }.joined(separator: "\n")
        let h = await EditorHarness("Title\n" + lines + "\n", height: 600)
        defer { h.close() }
        await h.caret(after: "Line 40")
        h.view.scrollRangeToVisible(h.selection)
        await h.settle(0.1)
        let clip = h.scroll.contentView
        let line40 = h.lineRect(at: offset(of: "Line 40", h)).minY - clip.bounds.minY
        var seen: [CGFloat] = []
        h.controller.insertLines([Self.fileLine])
        for _ in 0..<8 { seen.append(clip.bounds.minY); await h.settle(0.04) }
        #expect(h.text.contains("Line 40\n\(Self.fileLine)\nLine 41"))
        #expect(Set(seen.map { Int($0.rounded()) }).count == 1, "the note moved while the file went in: \(seen)")
        #expect(abs(h.lineRect(at: offset(of: "Line 40", h)).minY - clip.bounds.minY - line40) < 1, "the line above stays put")
        let caret = h.lineRect(at: h.selection.location)
        #expect(caret.minY >= clip.bounds.minY && caret.maxY <= clip.bounds.maxY, "the caret is on screen")
    }
}
#endif
