import Foundation
import Testing
@testable import PintoNotes

/// Pictures in a note (Emil, 11-01): as wide as the text but never larger than themselves, at most
/// 60% of the window's height, and small or a cover banner by choice, written after the name.
@MainActor @Suite(.serialized) struct PictureSizeTests {
    func picture(_ label: String, aspect: CGFloat, natural: CGFloat) -> LineEmbed {
        let id = UUID()
        ImageSizes.aspect[id] = aspect
        ImageSizes.natural[id] = natural
        return LineEmbed(kind: .image(id, name: label), range: NSRange(location: 0, length: 1), index: 0)
    }

    func box(_ width: CGFloat, _ height: CGFloat, _ body: () -> Void) {
        let keep = (ImageSizes.column, ImageSizes.viewHeight)
        ImageSizes.column = width
        ImageSizes.viewHeight = height
        defer { (ImageSizes.column, ImageSizes.viewHeight) = keep }
        body()
    }

    @Test func fitsTheTextWidth() {
        box(800, 1000) {
            let photo = ImageSizes.size(for: picture("Porch.jpg", aspect: 4 / 3, natural: 4032))
            #expect(photo.width == 800 && abs(photo.height - 600) < 0.5, "a big photo fills the text's width: \(photo)")
            let small = ImageSizes.size(for: picture("Icon.png", aspect: 1, natural: 120))
            #expect(small.width == 120, "a small picture is never made larger: \(small)")
            let tall = ImageSizes.size(for: picture("Receipt.png", aspect: 0.3, natural: 1200))
            #expect(abs(tall.height - 600) < 0.5 && tall.width < 800, "a tall picture stops at 60% of the window: \(tall)")
        }
    }

    @Test func smallAndCover() {
        box(800, 1000) {
            let small = ImageSizes.size(for: picture("Porch.jpg|small", aspect: 4 / 3, natural: 4032))
            #expect(small.width == 260, "small is about a third: \(small)")
            let cover = ImageSizes.size(for: picture("Porch.jpg|cover", aspect: 1, natural: 4032))
            #expect(cover.width == 800 && cover.height < 400 && cover.height > 200, "a cover is a banner across the text: \(cover)")
        }
    }

    @Test func theLabelHoldsTheSize() {
        #expect(ImageSizes.label("Porch.jpg|small").name == "Porch.jpg")
        #expect(ImageSizes.label("Porch.jpg|cover").size == .cover)
        #expect(ImageSizes.label("Porch.jpg").size == .fit)
        #expect(ImageSizes.label("a|b.jpg").name == "a|b.jpg", "a bar in a name is just a bar")
        let id = UUID().uuidString.lowercased()
        #expect(ImageSizes.relabel("![Porch.jpg](pane-file:\(id))", to: .small) == "![Porch.jpg|small](pane-file:\(id))")
        #expect(ImageSizes.relabel("![Porch.jpg|small](pane-file:\(id))", to: .fit) == "![Porch.jpg](pane-file:\(id))")
        #expect(LineEmbed.isImageName("Porch.jpg|cover"), "still a picture with its size written")
        if case .image = LineEmbed.find(in: "![Porch.jpg|small](pane-file:\(id))").first?.kind {} else { Issue.record("a sized picture is a picture") }
    }
}
