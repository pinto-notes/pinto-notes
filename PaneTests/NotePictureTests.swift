import CoreGraphics
import Foundation
import ImageIO
import Testing
import UniformTypeIdentifiers
#if os(macOS)
import AppKit
import SwiftUI
#endif
@testable import Pane

/// Share as Picture: what goes on it and how it's drawn. Off screen, nothing is shown.
/// `TEST_RUNNER_PANE_PICTURE_SHOTS=/path scripts/qa-test.sh PaneTests/NotePictureTests` writes the pictures.
@MainActor @Suite(.serialized) struct NotePictureTests {
    static let note = """
    Trip to Lisbon

    ## This week

    - [x] Book the flat near Graça
    - [ ] Ask Ana about the tram
    - Pack the **good** camera

    > Slow mornings, long lunches.

    | Day | Plan |
    | --- | --- |
    | Friday | Alfama |
    | Saturday | Belém |

    ```swift
    let budget = 600
    print(budget)
    ```

    The end.
    """

    static func request(_ text: String, selection: NSRange? = nil, imageURL: @escaping (UUID) -> URL? = { _ in nil }) -> NotePicture.Request {
        NotePicture.Request(title: "Trip to Lisbon", passage: NotePicture.passage(in: text, selection: selection), imageURL: imageURL)
    }

    static func range(_ text: String, of part: String) -> NSRange { (text as NSString).range(of: part) }

    // MARK: Passage

    @Test func noSelectionIsTheWholeNote() {
        for selection in [nil, NSRange(location: 3, length: 0), NSRange(location: NSNotFound, length: 0)] as [NSRange?] {
            let p = NotePicture.passage(in: Self.note, selection: selection)
            #expect(p.text == Self.note)
            #expect(p.startsAtTitle)
            #expect(!p.isSelection)
        }
    }

    @Test func onlyBlankSpaceSelectedIsTheWholeNote() {
        let text = "Title\n\n\nBody"
        let p = NotePicture.passage(in: text, selection: NSRange(location: 6, length: 2))
        #expect(p.text == text)
        #expect(!p.isSelection)
    }

    @Test func aSelectionBecomesWholeLines() {
        let p = NotePicture.passage(in: Self.note, selection: Self.range(Self.note, of: "the flat"))
        #expect(p.text == "- [x] Book the flat near Graça")
        #expect(p.isSelection)
        #expect(!p.startsAtTitle, "the title style is for the note's first line")
    }

    @Test func aSelectionFromTheTopKeepsTheTitle() {
        let p = NotePicture.passage(in: Self.note, selection: Self.range(Self.note, of: "Lisbon"))
        #expect(p.text == "Trip to Lisbon")
        #expect(p.startsAtTitle)
    }

    @Test func partOfATableBringsTheWholeTable() {
        let p = NotePicture.passage(in: Self.note, selection: Self.range(Self.note, of: "Alfama"))
        #expect(p.text == "| Day | Plan |\n| --- | --- |\n| Friday | Alfama |\n| Saturday | Belém |")
    }

    @Test func aTypedTableKeepsTheLineNamingItsColumns() {
        let text = "Title\n\n<!-- pane-table: text, number -->\n| A | B |\n| --- | --- |\n| x | 1 |\n\nAfter"
        let p = NotePicture.passage(in: text, selection: Self.range(text, of: "x"))
        #expect(p.text.hasPrefix("<!-- pane-table"))
        #expect(p.text.hasSuffix("| x | 1 |"))
    }

    @Test func partOfACodeBlockBringsTheWholeBlock() {
        let p = NotePicture.passage(in: Self.note, selection: Self.range(Self.note, of: "budget)"))
        #expect(p.text == "```swift\nlet budget = 600\nprint(budget)\n```")
    }

    @Test func aCodeBlockNotClosedRunsToTheEnd() {
        let text = "Title\n\n```\none\ntwo"
        let p = NotePicture.passage(in: text, selection: Self.range(text, of: "one"))
        #expect(p.text == "```\none\ntwo")
    }

    @Test func aSelectionNextToABlockLeavesItOut() {
        let p = NotePicture.passage(in: Self.note, selection: Self.range(Self.note, of: "The end"))
        #expect(p.text == "The end.")
    }

    @Test func aFileNameFromTheTitle() {
        #expect(NotePicture.filename(title: "Plans: a/b") == "Plans  a b.png")
        #expect(NotePicture.filename(title: "  ") == "Note.png")
    }

    // MARK: Drawing

    /// How many pixels in a rectangle (from the top left, 0...1 of the picture) are close to `dark` or to
    /// light ink: the text's own pixels on a plain card.
    static func pixels(_ image: CGImage, in r: CGRect, _ test: (UInt8, UInt8, UInt8) -> Bool) -> Int {
        let w = image.width, h = image.height
        let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
        let data = ctx.data!.assumingMemoryBound(to: UInt8.self)
        var n = 0
        for y in Int(r.minY * CGFloat(h))..<Int(r.maxY * CGFloat(h)) {
            for x in Int(r.minX * CGFloat(w))..<Int(r.maxX * CGFloat(w)) {
                let i = y * w * 4 + x * 4
                if test(data[i], data[i + 1], data[i + 2]) { n += 1 }
            }
        }
        return n
    }

    static let cardBody = CGRect(x: 0.2, y: 0.2, width: 0.6, height: 0.6)

    /// On the Mac a view's own snapshot draws these lines blank; the picture has to show the words.
    @Test func theTextIsActuallyDrawn() throws {
        let light = try #require(NotePicture.render(Self.request(Self.note), look: .init(background: .paper)))
        #expect(Self.pixels(light.image, in: Self.cardBody) { $0 < 90 && $1 < 90 && $2 < 90 } > 1000, "dark words on the light card")
        let dark = try #require(NotePicture.render(Self.request(Self.note), look: .init(background: .paper, dark: true)))
        #expect(Self.pixels(dark.image, in: Self.cardBody) { $0 > 170 && $1 > 170 && $2 > 170 } > 1000, "light words on the dark card")
    }

    @Test func theSizeFollowsTheRules() throws {
        let short = try #require(NotePicture.render(Self.request("Just one line"), look: .init()))
        #expect(short.image.width == NotePicture.pixelWidth)
        #expect(short.image.height == NotePicture.pixelWidth * 3 / 4, "a line or two still shows the scene")
        #expect(!short.fadesOut)
    }

    @Test func aLongNoteStopsAtFourByFiveAndFades() throws {
        let long = "Long\n\n" + (1...400).map { "Line number \($0)" }.joined(separator: "\n\n")
        let picture = try #require(NotePicture.render(Self.request(long), look: .init()))
        #expect(picture.fadesOut)
        let tall = CGFloat(picture.image.height) / CGFloat(picture.image.width)
        #expect(abs(tall - NotePicture.tallest) < 0.01)
    }

    @Test func aFadedPictureEndsInThePlainCard() throws {
        let long = "Long\n\n" + (1...400).map { "Line number \($0)" }.joined(separator: "\n\n")
        let picture = try #require(NotePicture.render(Self.request(long), look: .init(background: .paper, showsMark: false)))
        // The card's last stretch, just above its bottom padding: nothing is left of the words.
        let foot = CGRect(x: 0.2, y: 0.85, width: 0.6, height: 0.01)
        #expect(Self.pixels(picture.image, in: foot) { $0 < 120 && $1 < 120 && $2 < 120 } == 0)
    }

    @Test func theMarkCanBeTurnedOff() throws {
        let on = try #require(NotePicture.render(Self.request("One line"), look: .init(background: .paper, showsMark: true)))
        let off = try #require(NotePicture.render(Self.request("One line"), look: .init(background: .paper, showsMark: false)))
        let whole = CGRect(x: 0, y: 0, width: 1, height: 1)
        let orange: (UInt8, UInt8, UInt8) -> Bool = { r, g, b in r > 200 && g < 170 && b < 90 }
        #expect(Self.pixels(on.image, in: whole, orange) > 200, "the mark's orange")
        #expect(Self.pixels(off.image, in: whole, orange) == 0)
    }

    /// A table fills the card's column and shows its words, not its pipes (the text-column
    /// fallback stopped partway across and cut its last row).
    @Test func aTableIsDrawnAcrossTheColumn() throws {
        let text = "| Day | Plan |\n| --- | --- |\n| Friday | Alfama |\n| Saturday | Belém |"
        let picture = try #require(NotePicture.render(Self.request(text), look: .init(background: .paper, showsMark: false)))
        let grey: (UInt8, UInt8, UInt8) -> Bool = { r, g, b in r > 225 && r < 250 && r == g && g == b }
        // The header's fill reaches the card's right-hand side.
        #expect(Self.pixels(picture.image, in: CGRect(x: 0.72, y: 0.3, width: 0.1, height: 0.4), grey) > 500)
        // The last of the three rows has words in the table's lower third.
        let dark: (UInt8, UInt8, UInt8) -> Bool = { r, g, b in r < 90 && g < 90 && b < 90 }
        #expect(Self.pixels(picture.image, in: CGRect(x: 0.1, y: 0.55, width: 0.8, height: 0.12), dark) > 200)
    }

    /// The line between columns is as light as the lines between rows, in every column.
    @Test func aTablesDividersKeepTheirColour() throws {
        let text = "| A | B | C |\n| --- | --- | --- |\n| 1 | 2 | 3 |"
        let picture = try #require(NotePicture.render(Self.request(text), look: .init(background: .paper, showsMark: false)))
        // Only the words are this dark, and no column of pixels is all words: a full-height dark line would be.
        let w = picture.image.width, h = picture.image.height
        let dark: (UInt8, UInt8, UInt8) -> Bool = { r, g, b in r < 90 && g < 90 && b < 90 }
        let tall = (Int(0.15 * CGFloat(w))..<Int(0.85 * CGFloat(w))).filter { x in
            Self.pixels(picture.image, in: CGRect(x: CGFloat(x) / CGFloat(w), y: 0.3, width: 1 / CGFloat(w), height: 0.4), dark) > h / 10
        }
        #expect(tall.isEmpty, "a dark divider at \(tall.prefix(4))")
    }

    /// In the real app a link came out system blue: a text view colours its links, and here there's none.
    @Test func aLinkIsNotSystemBlue() throws {
        let picture = try #require(NotePicture.render(Self.request("Title\n\nSee [the hotel booking page](https://example.com) for details"), look: .init(background: .paper)))
        let blue: (UInt8, UInt8, UInt8) -> Bool = { r, g, b in b > 170 && r < 90 && g < 150 }
        #expect(Self.pixels(picture.image, in: CGRect(x: 0, y: 0, width: 1, height: 1), blue) == 0)
    }

    @Test func columnsFillTheWidth() {
        #expect(NotePicture.fitted([50, 150], to: 400) == [100, 300], "room to spare goes to each")
    }

    /// A long cell took the width and the short columns read "I…", "F…".
    @Test func shortColumnsKeepTheirWordsWhenItsTight() {
        #expect(NotePicture.fitted([40, 60, 500], to: 300) == [40, 60, 200])
        #expect(NotePicture.fitted([40, 400, 500], to: 300) == [40, 130, 130])
        #expect(NotePicture.fitted([200, 200], to: 300) == [150, 150])
    }

    @Test func everySceneIsInTheApp() {
        for background in NotePicture.Background.allCases {
            if let asset = background.asset { #expect(NotePicture.artwork(asset) != nil, "\(asset)") }
        }
    }

    @Test func nothingToDrawForAnEmptyNote() {
        #expect(NotePicture.render(Self.request("  \n "), look: .init()) == nil)
    }

    @Test func aPictureInTheNoteIsDrawn() throws {
        let folder = FileManager.default.temporaryDirectory.appending(path: "NotePictureTests-\(UUID())")
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: folder) }
        let url = folder.appending(path: "red.png")
        let ctx = CGContext(data: nil, width: 400, height: 300, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.setFillColor(CGColor(srgbRed: 1, green: 0, blue: 0, alpha: 1))
        ctx.fill(CGRect(x: 0, y: 0, width: 400, height: 300))
        try #require(NotePicture.png(ctx.makeImage()!)).write(to: url)
        let id = UUID()
        let text = "Title\n\n![red.png](pane-file:\(id.uuidString))\n\nAfter"
        let picture = try #require(NotePicture.render(Self.request(text) { $0 == id ? url : nil }, look: .init(background: .paper)))
        #expect(Self.pixels(picture.image, in: Self.cardBody) { $0 > 200 && $1 < 60 && $2 < 60 } > 10000)
    }

    /// The sheet itself, drawn from a window that's never shown.
    #if os(macOS)
    @Test func sheetShots() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_PICTURE_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let long = "A long note\n\n" + (1...60).map { "- Thing to remember, number \($0)" }.joined(separator: "\n")
        for (name, text, dark) in [("sheet-light", Self.note, false), ("sheet-dark", Self.note, true), ("sheet-long", long, false)] {
            let view = NotePictureSheet(request: Self.request(text))
            let host = NSHostingView(rootView: AnyView(view.environment(\.colorScheme, dark ? .dark : .light).background(dark ? Color.black : Color.white)))
            let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 560, height: 640), styleMask: [.borderless], backing: .buffered, defer: true)
            window.isReleasedWhenClosed = false
            window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            window.contentView = host
            host.setFrameSize(host.fittingSize)
            try await Task.sleep(for: .seconds(0.5))
            host.setFrameSize(host.fittingSize)
            host.layoutSubtreeIfNeeded()
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "\(name).png"))
            window.close()
        }
    }
    #endif

    /// The pictures themselves, for a person to look at.
    @Test func shots() throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_PICTURE_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let long = "A long note\n\n" + (1...60).map { "- Thing to remember, number \($0), with a few more words" }.joined(separator: "\n")
        let quote = "> The best notes are the ones you come back to. Write less, and write it where you'll find it."
        let scenes: [(String, NotePicture.Request, NotePicture.Look)] = [
            ("note-hills", Self.request(Self.note), .init(background: .hills)),
            ("note-dusk-dark", Self.request(Self.note), .init(background: .dusk, dark: true)),
            ("list-sea", Self.request(Self.note, selection: Self.range(Self.note, of: "the flat near Graça\n- [ ] Ask")), .init(background: .sea)),
            ("quote-orchard", Self.request(quote), .init(background: .orchard)),
            ("table-paper", Self.request(Self.note, selection: Self.range(Self.note, of: "Alfama")), .init(background: .paper)),
            ("code-ink-dark", Self.request(Self.note, selection: Self.range(Self.note, of: "budget)")), .init(background: .ink, dark: true)),
            ("long-hills", Self.request(long), .init(background: .hills)),
            ("wide-table-paper", Self.request("Costs\n\n| Item | Where | **Price** | Note |\n| --- | --- | --- | --- |\n| Flat | Graça, near the tram | 600 | *Paid* in full |\n| Flights | `TAP` | 240 | A very long note in this cell that cannot possibly fit on one line |\n"), .init(background: .paper)),
            ("embeds-hills", Self.request("Links\n\nBefore the link.\n\nhttps://www.pintonotes.com/help\n\n![[Other note]]\n\nAfter them."), .init(background: .hills)),
            ("nomark-sea", Self.request("Trip to Lisbon\n\nSlow mornings, long lunches."), .init(background: .sea, showsMark: false)),
        ]
        for (name, request, look) in scenes {
            let start = Date()
            let picture = try #require(NotePicture.render(request, look: look))
            let drawn = Date().timeIntervalSince(start)
            let png = try #require(NotePicture.png(picture.image))
            try png.write(to: dir.appending(path: "\(name).png"))
            print("PICTURE \(name) \(picture.image.width)x\(picture.image.height) draw \(Int(drawn * 1000)) ms, png \(png.count / 1024) KB")
        }
    }
}
