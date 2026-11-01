#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Link card study (11-01): three ways to draw a web link, a note link and a file as a card,
/// on a note page, light and dark. Drawn with ImageRenderer: nothing appears on the display.
/// `TEST_RUNNER_PANE_CARD_STUDY=/dir scripts/qa-test.sh PaneTests/LinkCardStudy`
@MainActor struct LinkCardStudy {
    struct Item {
        var title: String
        var detail: String
        var source: String
        var glyph: String
        var tint: Color
        var image: NSImage?
    }

    static var photo: NSImage? { NSImage(data: DemoData.samplePNG()) }
    static var page: NSImage? {
        guard let rep = NSPDFImageRep(data: DemoData.samplePDF()) else { return nil }
        let i = NSImage(size: rep.size); i.addRepresentation(rep); return i
    }
    static var items: [Item] {
        [
            Item(title: "Visit Lisboa: the official guide to Lisbon", detail: "Where to stay, what to eat and how to get around the city of seven hills.",
                 source: "visitlisboa.com", glyph: "globe", tint: .blue, image: photo),
            Item(title: "Hotel booking", detail: "Memmo Príncipe Real, 14 to 17 May. Breakfast included.",
                 source: "Travel", glyph: "note.text", tint: Color(PColor.paneAccent), image: nil),
            Item(title: "Flight itinerary.pdf", detail: "PDF · 48 KB",
                 source: "File", glyph: "doc.richtext", tint: .red, image: page),
        ]
    }

    // A: picture on the left, three lines of text.
    struct CardA: View {
        let item: Item
        var body: some View {
            HStack(spacing: 12) {
                Thumb(item: item).frame(width: 52, height: 52).clipShape(.rect(cornerRadius: 8, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.title).font(.system(size: 13, weight: .semibold)).lineLimit(1)
                    Text(item.detail).font(.system(size: 12)).foregroundStyle(.secondary).lineLimit(1)
                    Label(item.source, systemImage: item.glyph).labelStyle(Small()).font(.system(size: 11)).foregroundStyle(.tertiary)
                }
                Spacer(minLength: 0)
            }
            .padding(10)
            .frame(height: 72)
            .background(Color(PColor.paneFill), in: .rect(cornerRadius: 12, style: .continuous))
        }
    }

    // B: text on the left, the picture filling the right edge (a bookmark).
    struct CardB: View {
        let item: Item
        var body: some View {
            HStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.title).font(.system(size: 13, weight: .semibold)).lineLimit(1)
                    Text(item.detail).font(.system(size: 12)).foregroundStyle(.secondary).lineLimit(2)
                    Spacer(minLength: 0)
                    Label(item.source, systemImage: item.glyph).labelStyle(Small()).font(.system(size: 11)).foregroundStyle(.tertiary)
                }
                .padding(12)
                Spacer(minLength: 0)
                if item.image != nil {
                    Thumb(item: item).frame(width: 150).clipped()
                }
            }
            .frame(height: 88)
            .background(Color(PColor.paneFill))
            .clipShape(.rect(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(.primary.opacity(0.06)))
        }
    }

    // C: one line, as wide as it needs: almost a link, a little more.
    struct CardC: View {
        let item: Item
        var body: some View {
            HStack(spacing: 8) {
                Thumb(item: item, small: true).frame(width: 22, height: 22).clipShape(.rect(cornerRadius: 5, style: .continuous))
                Text(item.title).font(.system(size: 13, weight: .medium)).lineLimit(1)
                Text(item.source).font(.system(size: 12)).foregroundStyle(.tertiary).lineLimit(1)
            }
            .padding(.leading, 6).padding(.trailing, 12)
            .frame(height: 34)
            .background(Color(PColor.paneFill), in: .capsule)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    struct Thumb: View {
        let item: Item
        var small = false
        var body: some View {
            if let image = item.image, !small || item.glyph != "globe" {
                Image(nsImage: image).resizable().scaledToFill()
                    .background(Color.white)
            } else {
                ZStack {
                    Rectangle().fill(item.tint.opacity(0.15))
                    Image(systemName: item.glyph).font(.system(size: small ? 11 : 20, weight: .medium)).foregroundStyle(item.tint)
                }
            }
        }
    }

    struct Small: LabelStyle {
        func makeBody(configuration: Configuration) -> some View {
            HStack(spacing: 4) { configuration.icon.imageScale(.small); configuration.title }
        }
    }

    struct Page<Card: View>: View {
        let name: String
        let card: (Item) -> Card
        var body: some View {
            VStack(alignment: .leading, spacing: 14) {
                Text(name).font(.system(size: 13, weight: .semibold)).foregroundStyle(.secondary)
                Text("Lisbon trip").font(.system(size: 26, weight: .bold))
                Text("Three days in May. Everything we need is linked below.").font(.system(size: 13))
                ForEach(Array(LinkCardStudy.items.enumerated()), id: \.offset) { _, item in card(item) }
                Text("A link in a sentence stays a link: see [the tram map](https://carris.pt) before we go.").font(.system(size: 13))
            }
            .padding(32)
            .frame(width: 600, alignment: .leading)
        }
    }

    static func render(_ view: some View, dark: Bool) -> NSImage? {
        let r = ImageRenderer(content: view.foregroundStyle(.primary)
            .background(dark ? Color.black : Color.white)
            .environment(\.colorScheme, dark ? .dark : .light))
        r.scale = 2
        let appearance = NSAppearance(named: dark ? .darkAqua : .aqua)!
        var out: NSImage?
        appearance.performAsCurrentDrawingAppearance { out = r.nsImage }
        return out
    }

    @Test func study() throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_CARD_STUDY"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let pages: [(String, AnyView)] = [
            ("A", AnyView(Page(name: "A · picture left") { CardA(item: $0) })),
            ("B", AnyView(Page(name: "B · bookmark, picture right") { CardB(item: $0) })),
            ("C", AnyView(Page(name: "C · one line") { CardC(item: $0) })),
        ]
        for (key, page) in pages {
            let both = HStack(spacing: 0) {
                page.background(Color.white).environment(\.colorScheme, .light)
                page.background(Color.black).environment(\.colorScheme, .dark)
            }
            let r = ImageRenderer(content: both)
            r.scale = 2
            let image = try #require(r.cgImage)
            let rep = NSBitmapImageRep(cgImage: image)
            try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "cards-\(key).png"))
        }
    }
}
#endif
