import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// A note, or a part of it, drawn as a picture to post: the text as the editor styles it, on a
/// card, over a cut-paper scene. Drawn from its own text layout, off screen, so it needs no window.
@MainActor
enum NotePicture {
    /// What goes on the picture.
    struct Request: Identifiable {
        let id = UUID()
        let title: String
        let passage: Passage
        /// Where a picture in the note is on this device.
        var imageURL: (UUID) -> URL? = { _ in nil }
        /// The note is showing its app: a picture of the app, not of the note's text.
        var app: UUID?
    }

    struct Passage: Equatable {
        var text: String
        /// It starts at the note's first line, so that line is drawn as the title.
        var startsAtTitle: Bool
        var isSelection: Bool
    }

    enum Background: String, CaseIterable, Identifiable {
        case hills, sea, dusk, orchard, paper, ink
        var id: String { rawValue }

        var name: String {
            switch self {
            case .hills: "Hills"
            case .sea: "Sea"
            case .dusk: "Dusk"
            case .orchard: "Orchard"
            case .paper: "Paper"
            case .ink: "Ink"
            }
        }

        /// The asset's name; the two plain ones have none.
        var asset: String? {
            switch self {
            case .hills: "NotePictureHills"
            case .sea: "NotePictureSea"
            case .dusk: "NotePictureDusk"
            case .orchard: "NotePictureOrchard"
            case .paper, .ink: nil
            }
        }

        var plain: UInt32 { self == .ink ? 0x20140C : 0xF5EEDF }
    }

    struct Look: Equatable {
        var background: Background = .hills
        var dark = false
        var showsMark = true
    }

    struct Rendered {
        let image: CGImage
        /// The text didn't fit, so it fades out where the picture ends.
        let fadesOut: Bool
    }

    /// Wide enough to stay sharp when a site scales it, and what a site keeps without shrinking it much.
    static let pixelWidth = 2400
    /// The tallest a picture gets: 4:5. A taller one is cropped in a feed and unreadable when it isn't.
    static let tallest: CGFloat = 1.25
    /// The shortest: 4:3, so that a line or two still shows the scene around it.
    static let shortest: CGFloat = 0.75
    /// The text column, in lines of body text. About 10 pixels of body text on a post shown 400 wide.
    static let columnInBodies: CGFloat = 28

    // MARK: What goes on it

    /// The selection as whole lines, with every table and code block it touches whole, since part of
    /// one doesn't read as one. No selection, or only blank space selected: the whole note.
    static func passage(in text: String, selection: NSRange?) -> Passage {
        let ns = text as NSString
        let whole = NSRange(location: 0, length: ns.length)
        func make(_ r: NSRange, isSelection: Bool) -> Passage {
            let title = MarkdownStyler.titleLocation(ns)
            return Passage(text: ns.substring(with: r).trimmingCharacters(in: .whitespacesAndNewlines),
                           startsAtTitle: r.location <= title, isSelection: isSelection)
        }
        guard let selection, selection.location != NSNotFound, selection.length > 0, NSMaxRange(selection) <= ns.length,
              !ns.substring(with: selection).trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return make(whole, isSelection: false)
        }
        var r = ns.lineRange(for: selection)
        for block in blocks(in: text) where NSIntersectionRange(block, r).length > 0 { r = NSUnionRange(r, block) }
        return make(r, isSelection: r.location > 0 || NSMaxRange(r) < ns.length)
    }

    /// Each table (with the line naming its column types) and code block, as whole lines.
    private static func blocks(in text: String) -> [NSRange] {
        let ns = text as NSString
        var out = GridTable.find(in: text).map { table -> NSRange in
            var r = ns.lineRange(for: table.range)
            if r.location > 0 {
                let above = ns.lineRange(for: NSRange(location: r.location - 1, length: 0))
                if ns.substring(with: above).hasPrefix("<!-- pane-table") { r = NSUnionRange(r, above) }
            }
            return r
        }
        var open: NSRange?
        var fence = ""
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byLines]) { line, _, enclosing, _ in
            let trimmed = (line ?? "").trimmingCharacters(in: .whitespaces)
            if let start = open {
                if trimmed.hasPrefix(fence), trimmed.drop(while: { String($0) == fence.prefix(1) }).isEmpty {
                    out.append(NSUnionRange(start, enclosing))
                    open = nil
                }
            } else if trimmed.hasPrefix("```") || trimmed.hasPrefix("~~~") {
                open = enclosing
                fence = String(trimmed.prefix(3))
            }
        }
        // Not closed yet: to the end of the note, as the editor reads it.
        if let open { out.append(NSRange(location: open.location, length: ns.length - open.location)) }
        return out
    }

    // MARK: Drawing

    /// `apps`: pictures of the apps embedded in the note, by note.
    static func render(_ request: Request, look: Look, apps: [UUID: CGImage] = [:], pixelWidth: Int = NotePicture.pixelWidth) -> Rendered? {
        guard !request.passage.text.isEmpty else { return nil }
        return withAppearance(dark: look.dark) { draw(request, look: look, apps: apps, pixelWidth: pixelWidth) }
    }

    /// Where an app's picture goes, in points of a canvas `canvasWidth` wide. The whole app always
    /// shows: fading out suits text, not controls. A tall one gets a narrower card, and more scene.
    static func appLayout(aspect: CGFloat, canvasWidth: CGFloat = 1000, footer: CGFloat) -> (canvasHeight: CGFloat, card: CGRect) {
        let margin = (canvasWidth * 0.08).rounded()
        var width = canvasWidth - margin * 2
        let tallest = canvasWidth * Self.tallest - margin * 2
        if width * aspect + footer > tallest { width = ((tallest - footer) / max(aspect, 0.01)).rounded() }
        let height = (width * aspect + footer).rounded()
        let canvas = max(height + margin * 2, canvasWidth * shortest).rounded()
        return (canvas, CGRect(x: ((canvasWidth - width) / 2).rounded(), y: ((canvas - height) / 2).rounded(), width: width, height: height))
    }

    /// An app, as it is on screen, on the same card and scene as a note.
    static func render(app image: CGImage, look: Look, pixelWidth: Int = NotePicture.pixelWidth) -> Rendered? {
        withAppearance(dark: look.dark) {
            let canvasWidth: CGFloat = 1000
            let footer: CGFloat = look.showsMark ? 60 : 0
            let layout = appLayout(aspect: CGFloat(image.height) / max(CGFloat(image.width), 1), canvasWidth: canvasWidth, footer: footer)
            let scale = CGFloat(pixelWidth) / canvasWidth
            guard let ctx = canvas(width: pixelWidth, points: layout.canvasHeight, scale: scale) else { return nil }
            drawBackground(look.background, in: CGRect(x: 0, y: 0, width: canvasWidth, height: layout.canvasHeight), ctx: ctx)
            let shape = CGPath(roundedRect: layout.card, cornerWidth: 28, cornerHeight: 28, transform: nil)
            drawCard(shape, dark: look.dark, scale: scale, ctx: ctx)
            ctx.saveGState()
            ctx.addPath(shape)
            ctx.clip()
            drawImage(image, in: CGRect(x: layout.card.minX, y: layout.card.minY, width: layout.card.width, height: layout.card.height - footer), ctx: ctx)
            ctx.restoreGState()
            if look.showsMark {
                withTextContext(ctx) {
                    drawMark(at: CGPoint(x: layout.card.minX + 28, y: layout.card.maxY - 44), size: 28, body: 20, ctx: ctx)
                }
            }
            strokeCardEdge(shape, dark: look.dark, ctx: ctx)
            return ctx.makeImage().map { Rendered(image: $0, fadesOut: false) }
        }
    }

    /// Top left, y down, in points: what the text system draws in.
    private static func canvas(width: Int, points: CGFloat, scale: CGFloat) -> CGContext? {
        guard let ctx = CGContext(data: nil, width: width, height: Int((points * scale).rounded()), bitsPerComponent: 8, bytesPerRow: 0,
                                  space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        ctx.translateBy(x: 0, y: CGFloat(ctx.height))
        ctx.scaleBy(x: scale, y: -scale)
        ctx.setShouldAntialias(true)
        ctx.interpolationQuality = .high
        return ctx
    }

    private static func drawCard(_ shape: CGPath, dark: Bool, scale: CGFloat, ctx: CGContext) {
        ctx.saveGState()
        // A shadow's offset is in device pixels, whatever the transform: down is negative.
        ctx.setShadow(offset: CGSize(width: 0, height: -10 * scale), blur: 36 * scale, color: CGColor(gray: 0, alpha: dark ? 0.45 : 0.22))
        ctx.addPath(shape)
        ctx.setFillColor(PColor.panePage.cgColor)
        ctx.fillPath()
        ctx.restoreGState()
    }

    /// The card's edge, on a dark scene.
    private static func strokeCardEdge(_ shape: CGPath, dark: Bool, ctx: CGContext) {
        guard dark else { return }
        ctx.addPath(shape)
        ctx.setStrokeColor(CGColor(gray: 1, alpha: 0.1))
        ctx.setLineWidth(1)
        ctx.strokePath()
    }

    private static func draw(_ request: Request, look: Look, apps: [UUID: CGImage], pixelWidth: Int) -> Rendered? {
        let body = EditorMetrics.body
        let column = (body * columnInBodies).rounded()
        let pad = body * 2
        let cardWidth = column + pad * 2
        let margin = (cardWidth * 0.1).rounded()
        let canvasWidth = cardWidth + margin * 2
        let footer = look.showsMark ? (body * 2.6).rounded() : 0

        // The text, laid out as the editor lays it out. The layout objects stay alive while it draws.
        let storage = NSTextStorage(string: request.passage.text)
        let content = NSTextContentStorage()
        content.textStorage = storage
        let layout = NSTextLayoutManager()
        let delegate = DecoratingLayoutDelegate()
        layout.delegate = delegate
        content.addTextLayoutManager(layout)
        let container = NSTextContainer(size: CGSize(width: column, height: 0))
        container.lineFragmentPadding = 0
        layout.textContainer = container
        var styler = MarkdownStyler()
        styler.firstLineIsTitle = request.passage.startsAtTitle
        let styled = styler.apply(to: storage, active: NSRange(location: NSNotFound, length: 0))
        let embeds = placeEmbeds(styled.embeds, storage: storage, column: column, imageURL: request.imageURL, apps: apps)
        placeTables(styled.grids, storage: storage)
        drawLinksAsTheEditorDoes(storage)

        layout.ensureLayout(for: layout.documentRange)
        var textHeight: CGFloat = 0
        layout.enumerateTextLayoutFragments(from: layout.documentRange.location, options: [.ensuresLayout]) { fragment in
            textHeight = max(textHeight, fragment.layoutFragmentFrame.maxY)
            return true
        }
        textHeight = ceil(textHeight)

        let room = canvasWidth * tallest - margin * 2 - pad * 2 - footer
        let fadesOut = textHeight > room
        let shownText = min(textHeight, room)
        let cardHeight = shownText + pad * 2 + footer
        let canvasHeight = max(cardHeight + margin * 2, canvasWidth * shortest).rounded()

        let scale = CGFloat(pixelWidth) / canvasWidth
        guard let ctx = canvas(width: pixelWidth, points: canvasHeight, scale: scale) else { return nil }

        drawBackground(look.background, in: CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight), ctx: ctx)

        let card = CGRect(x: margin, y: ((canvasHeight - cardHeight) / 2).rounded(), width: cardWidth, height: cardHeight)
        let shape = CGPath(roundedRect: card, cornerWidth: 20, cornerHeight: 20, transform: nil)
        let page = PColor.panePage.cgColor
        drawCard(shape, dark: look.dark, scale: scale, ctx: ctx)

        let origin = CGPoint(x: card.minX + pad, y: card.minY + pad)
        withTextContext(ctx) {
            ctx.saveGState()
            ctx.clip(to: CGRect(x: card.minX, y: origin.y - 8, width: card.width, height: shownText + 8))
            layout.enumerateTextLayoutFragments(from: layout.documentRange.location, options: [.ensuresLayout]) { fragment in
                let frame = fragment.layoutFragmentFrame
                if frame.minY > shownText { return false }
                fragment.draw(at: CGPoint(x: origin.x + frame.minX, y: origin.y + frame.minY), in: ctx)
                return true
            }
            drawEmbeds(embeds, layout: layout, content: content, origin: origin, column: column, ctx: ctx)
            drawTables(styled.grids, layout: layout, content: content, origin: origin, column: column, ctx: ctx)
            ctx.restoreGState()
            if fadesOut { drawFade(page, bottom: origin.y + shownText, x: card.minX, width: card.width, height: body * 6, ctx: ctx) }
            if look.showsMark {
                drawMark(at: CGPoint(x: origin.x, y: origin.y + shownText + pad * 0.6), size: (body * 1.35).rounded(), body: body, ctx: ctx)
            }
        }
        strokeCardEdge(shape, dark: look.dark, ctx: ctx)
        return ctx.makeImage().map { Rendered(image: $0, fadesOut: fadesOut) }
    }

    /// A file's card, a link and a picture on their own line: a slot of the height this picture
    /// wants, whatever the size of the editor's window.
    private struct PlacedEmbed {
        let embed: LineEmbed
        let image: CGImage?
        let size: CGSize
    }

    private static func placeEmbeds(_ embeds: [LineEmbed], storage: NSTextStorage, column: CGFloat, imageURL: (UUID) -> URL?, apps: [UUID: CGImage]) -> [PlacedEmbed] {
        guard !embeds.isEmpty else { return [] }
        let ns = storage.string as NSString
        storage.beginEditing()
        defer { storage.endEditing() }
        return embeds.map { embed in
            var image: CGImage?
            var size = CGSize(width: column, height: (EditorMetrics.body * 3).rounded())
            func fit(_ loaded: CGImage) -> CGSize {
                let aspect = CGFloat(loaded.width) / max(CGFloat(loaded.height), 1)
                var height = column / max(aspect, 0.01)
                let cap = column * 0.9
                var width = column
                if height > cap { height = cap; width = height * aspect }
                return CGSize(width: width.rounded(), height: max(height.rounded(), 40))
            }
            switch embed.kind {
            case .image(let id, _):
                if let url = imageURL(id), let loaded = loadImage(url) {
                    image = loaded
                    size = fit(loaded)
                } else {
                    // Not on this device: its name in a panel.
                    size.height = (column * 0.3).rounded()
                }
            case .note(let id, _):
                // An app in the note, when there's a picture of it. Otherwise its name.
                if let shot = apps[id] {
                    image = shot
                    size = fit(shot)
                }
            default:
                break
            }
            let line = ns.lineRange(for: embed.range)
            let style = NSMutableParagraphStyle()
            style.minimumLineHeight = size.height
            style.maximumLineHeight = size.height
            style.paragraphSpacingBefore = 4
            style.paragraphSpacing = 8
            storage.addAttribute(.paragraphStyle, value: style, range: line)
            return PlacedEmbed(embed: embed, image: image, size: size)
        }
    }

    /// A text view colours its links itself; with none here they would come out system blue. The
    /// picture isn't clickable, so the words keep the look and lose the link.
    private static func drawLinksAsTheEditorDoes(_ storage: NSTextStorage) {
        let whole = NSRange(location: 0, length: storage.length)
        var links: [NSRange] = []
        storage.enumerateAttribute(.link, in: whole) { value, range, _ in if value != nil { links.append(range) } }
        guard !links.isEmpty else { return }
        storage.beginEditing()
        for range in links {
            storage.removeAttribute(.link, range: range)
            storage.addAttribute(.foregroundColor, value: PColor.paneLinkText, range: range)
            storage.addAttributes(MarkdownStyler.linkUnderline, range: range)
        }
        storage.endEditing()
    }

    /// A table's row here: the editor's has room for its handles, and these aren't touched.
    private static var tableRow: CGFloat { (EditorMetrics.body * 2.3).rounded() }

    /// The styler folds a table's lines under a slot for the editor's live grid. Here the slot fits this table.
    private static func placeTables(_ tables: [GridTable], storage: NSTextStorage) {
        guard !tables.isEmpty else { return }
        let ns = storage.string as NSString
        storage.beginEditing()
        defer { storage.endEditing() }
        for table in tables {
            let lines = ns.lineRange(for: table.range)
            let first = ns.lineRange(for: NSRange(location: table.range.location, length: 0))
            var folded = 0
            let rest = NSRange(location: NSMaxRange(first), length: NSMaxRange(lines) - NSMaxRange(first))
            if rest.length > 0 {
                ns.enumerateSubstrings(in: rest, options: [.byParagraphs, .substringNotRequired]) { _, _, _, _ in folded += 1 }
            }
            let style = NSMutableParagraphStyle()
            style.minimumLineHeight = max(tableRow * CGFloat(table.rows.count) - CGFloat(folded) * MarkdownStyler.foldedLine, 1)
            style.maximumLineHeight = style.minimumLineHeight
            style.paragraphSpacingBefore = 4
            // What the folded lines take, and the space under a block.
            style.paragraphSpacing = 8
            storage.addAttribute(.paragraphStyle, value: style, range: first)
        }
    }

    /// A table across the column: a filled header, a line between rows, the cells' own bold, italics
    /// and code. Wide tables share out the width; a cell that still doesn't fit ends in an ellipsis.
    private static func drawTables(_ tables: [GridTable], layout: NSTextLayoutManager, content: NSTextContentStorage, origin: CGPoint, column: CGFloat, ctx: CGContext) {
        let row = tableRow
        for table in tables {
            guard !table.rows.isEmpty, let location = content.location(content.documentRange.location, offsetBy: table.range.location),
                  let fragment = layout.textLayoutFragment(for: location) else { continue }
            let inset: CGFloat = 10
            let natural = (0..<table.columns).map { c in
                table.rows.map { c < $0.count ? ceil(cellText($0[c], header: false).size().width) + inset * 2 + 2 : inset * 2 }.max() ?? inset * 2
            }
            let widths = fitted(natural, to: column)
            let rect = CGRect(x: origin.x, y: origin.y + fragment.layoutFragmentFrame.minY + 4, width: column, height: row * CGFloat(table.rows.count))
            let shape = CGPath(roundedRect: rect, cornerWidth: 10, cornerHeight: 10, transform: nil)
            ctx.saveGState()
            ctx.addPath(shape)
            ctx.clip()
            ctx.setFillColor(PColor.paneFill.cgColor)
            ctx.fill(CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: row))
            ctx.setFillColor(PColor.paneSeparator.cgColor)
            for r in 1..<max(table.rows.count, 1) {
                ctx.fill(CGRect(x: rect.minX, y: rect.minY + row * CGFloat(r), width: rect.width, height: 0.5))
            }
            var x = rect.minX
            for (c, width) in widths.enumerated() {
                if c > 0 {
                    // Set again: drawing a cell's text leaves its own colour behind.
                    ctx.setFillColor(PColor.paneSeparator.cgColor)
                    ctx.fill(CGRect(x: x, y: rect.minY, width: 0.5, height: rect.height))
                }
                for (r, cells) in table.rows.enumerated() where c < cells.count {
                    let text = cellText(cells[c], header: r == 0)
                    let box = CGRect(x: x + inset, y: rect.minY + row * CGFloat(r), width: max(width - inset * 2, 1), height: row)
                    let height = ceil(text.boundingRect(with: CGSize(width: box.width, height: 200), options: [.usesLineFragmentOrigin], context: nil).height)
                    text.draw(with: CGRect(x: box.minX, y: box.midY - height / 2, width: box.width, height: height), options: [.usesLineFragmentOrigin, .truncatesLastVisibleLine], context: nil)
                }
                x += width
            }
            ctx.restoreGState()
            ctx.addPath(shape)
            ctx.setStrokeColor(PColor.paneSeparator.cgColor)
            ctx.setLineWidth(0.5)
            ctx.strokePath()
        }
    }

    /// The columns' widths, filling the column exactly. Room to spare goes to each in proportion. Too
    /// little comes out of the widest first, so that short columns keep their words.
    static func fitted(_ widths: [CGFloat], to column: CGFloat) -> [CGFloat] {
        let total = widths.reduce(0, +)
        guard total > 0 else { return widths }
        guard total > column else { return widths.map { $0 * column / total } }
        // The one width no column goes over: columns narrower than it keep their own.
        var left = column
        var rest = widths.count
        var level = column / CGFloat(max(rest, 1))
        for width in widths.sorted() {
            guard width < level else { break }
            left -= width
            rest -= 1
            level = left / CGFloat(max(rest, 1))
        }
        return widths.map { min($0, level) }
    }

    private static func cellText(_ markdown: String, header: Bool) -> NSAttributedString {
        let body = EditorMetrics.body
        let base = PFont.systemFont(ofSize: body, weight: header ? .semibold : .regular)
        let style = NSMutableParagraphStyle()
        style.lineBreakMode = .byTruncatingTail
        let out = NSMutableAttributedString()
        let cell = CellText.attributed(markdown)
        for run in cell.runs {
            var attributes: [NSAttributedString.Key: Any] = [.font: base, .foregroundColor: PColor.paneLabel, .paragraphStyle: style]
            let intent = run.inlinePresentationIntent ?? []
            if intent.contains(.code) { attributes[.font] = PFont.monospacedSystemFont(ofSize: body * 0.88, weight: .regular) }
            else if intent.contains(.stronglyEmphasized) { attributes[.font] = PFont.systemFont(ofSize: body, weight: .bold) }
            else if intent.contains(.emphasized) { attributes[.font] = italic(base) }
            if intent.contains(.strikethrough) { attributes[.strikethroughStyle] = NSUnderlineStyle.single.rawValue }
            if run.underlineStyle != nil { attributes[.underlineStyle] = NSUnderlineStyle.single.rawValue }
            if run.link != nil { attributes[.foregroundColor] = PColor.paneLinkText }
            out.append(NSAttributedString(string: String(cell[run.range].characters), attributes: attributes))
        }
        return out
    }

    private static func italic(_ font: PFont) -> PFont {
        #if os(iOS)
        font.fontDescriptor.withSymbolicTraits(.traitItalic).map { PFont(descriptor: $0, size: font.pointSize) } ?? font
        #else
        PFont(descriptor: font.fontDescriptor.withSymbolicTraits(.italic), size: font.pointSize) ?? font
        #endif
    }

    private static func loadImage(_ url: URL) -> CGImage? {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, [kCGImageSourceShouldCache: false] as CFDictionary) else { return nil }
        let options: [CFString: Any] = [kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceCreateThumbnailWithTransform: true,
                                        kCGImageSourceThumbnailMaxPixelSize: pixelWidth]
        return CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
    }

    private static func drawEmbeds(_ embeds: [PlacedEmbed], layout: NSTextLayoutManager, content: NSTextContentStorage, origin: CGPoint, column: CGFloat, ctx: CGContext) {
        for placed in embeds {
            guard let location = content.location(content.documentRange.location, offsetBy: placed.embed.range.location),
                  let fragment = layout.textLayoutFragment(for: location) else { continue }
            let frame = fragment.layoutFragmentFrame
            // Under the space before the line (placeEmbeds).
            let rect = CGRect(x: origin.x, y: origin.y + frame.minY + 4,
                              width: placed.size.width, height: placed.size.height)
            let path = CGPath(roundedRect: rect, cornerWidth: 10, cornerHeight: 10, transform: nil)
            ctx.saveGState()
            ctx.addPath(path)
            ctx.clip()
            if let image = placed.image {
                drawImage(image, in: rect, ctx: ctx)
            } else {
                ctx.setFillColor(PColor.paneFill.cgColor)
                ctx.fill(rect)
                let text = NSAttributedString(string: Self.name(of: placed.embed), attributes: [
                    .font: PFont.systemFont(ofSize: EditorMetrics.body), .foregroundColor: PColor.paneSecondary])
                let at = CGPoint(x: rect.minX + 12, y: rect.midY - text.size().height / 2)
                DecoratedLayoutFragment.draw(text, at: at, in: ctx)
            }
            ctx.restoreGState()
        }
    }

    static func name(of embed: LineEmbed) -> String {
        switch embed.kind {
        case .file(_, let name), .note(_, let name): ImageSizes.label(name).name
        case .image(_, let name): ImageSizes.label(name).name
        case .link(let url): url.host() ?? url.absoluteString
        case .wiki(let title): title
        }
    }

    private static func drawBackground(_ background: Background, in rect: CGRect, ctx: CGContext) {
        if let asset = background.asset, let image = artwork(asset) {
            // Fills the canvas, centred; a tall picture crops the sides.
            let scale = max(rect.width / CGFloat(image.width), rect.height / CGFloat(image.height))
            let size = CGSize(width: CGFloat(image.width) * scale, height: CGFloat(image.height) * scale)
            drawImage(image, in: CGRect(x: rect.midX - size.width / 2, y: rect.midY - size.height / 2, width: size.width, height: size.height), ctx: ctx)
        } else {
            let p = background.plain
            ctx.setFillColor(CGColor(srgbRed: CGFloat(p >> 16 & 255) / 255, green: CGFloat(p >> 8 & 255) / 255, blue: CGFloat(p & 255) / 255, alpha: 1))
            ctx.fill(rect)
        }
    }

    /// The context is y down; an image's own origin is at its foot.
    private static func drawImage(_ image: CGImage, in rect: CGRect, ctx: CGContext) {
        ctx.saveGState()
        ctx.translateBy(x: rect.minX, y: rect.maxY)
        ctx.scaleBy(x: 1, y: -1)
        ctx.draw(image, in: CGRect(origin: .zero, size: rect.size))
        ctx.restoreGState()
    }

    private static func drawFade(_ page: CGColor, bottom: CGFloat, x: CGFloat, width: CGFloat, height: CGFloat, ctx: CGContext) {
        guard let clear = page.copy(alpha: 0),
              let gradient = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [clear, page] as CFArray, locations: [0, 1]) else { return }
        ctx.saveGState()
        ctx.clip(to: CGRect(x: x, y: bottom - height, width: width, height: height))
        ctx.drawLinearGradient(gradient, start: CGPoint(x: x, y: bottom - height), end: CGPoint(x: x, y: bottom), options: [])
        ctx.restoreGState()
    }

    /// The small mark at the card's foot.
    private static func drawMark(at point: CGPoint, size: CGFloat, body: CGFloat, ctx: CGContext) {
        let rect = CGRect(origin: point, size: CGSize(width: size, height: size))
        if let mark = artwork("MarkTight") {
            ctx.saveGState()
            ctx.addPath(CGPath(roundedRect: rect, cornerWidth: size * 0.2237, cornerHeight: size * 0.2237, transform: nil))
            ctx.clip()
            drawImage(mark, in: rect, ctx: ctx)
            ctx.restoreGState()
        }
        let text = NSAttributedString(string: "Pinto Notes", attributes: [
            .font: PFont.systemFont(ofSize: body * 0.85, weight: .semibold), .foregroundColor: PColor.paneSecondary])
        DecoratedLayoutFragment.draw(text, at: CGPoint(x: rect.maxX + body * 0.5, y: rect.midY - text.size().height / 2), in: ctx)
    }

    // MARK: Platforms

    static func artwork(_ name: String) -> CGImage? {
        #if os(iOS)
        UIImage(named: name)?.cgImage
        #else
        NSImage(named: name)?.cgImage(forProposedRect: nil, context: nil, hints: nil)
        #endif
    }

    /// Colours resolve as this picture is light or dark, whatever the app is showing.
    private static func withAppearance<T>(dark: Bool, _ work: () -> T) -> T {
        var result: T?
        #if os(iOS)
        UITraitCollection(userInterfaceStyle: dark ? .dark : .light).performAsCurrent { result = work() }
        #else
        NSAppearance(named: dark ? .darkAqua : .aqua)!.performAsCurrentDrawingAppearance { result = work() }
        #endif
        return result!
    }

    /// Lets the system's text drawing find this context.
    private static func withTextContext(_ ctx: CGContext, _ work: () -> Void) {
        #if os(iOS)
        UIGraphicsPushContext(ctx)
        work()
        UIGraphicsPopContext()
        #else
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: true)
        work()
        NSGraphicsContext.current = saved
        #endif
    }

    // MARK: Files

    /// PNG bytes. Takes a moment at this size, so off the main thread.
    nonisolated static func png(_ image: CGImage) -> Data? {
        let data = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(data, UTType.png.identifier as CFString, 1, nil) else { return nil }
        CGImageDestinationAddImage(destination, image, nil)
        return CGImageDestinationFinalize(destination) ? data as Data : nil
    }

    /// A file name from the note's title.
    nonisolated static func filename(title: String) -> String {
        let clean = title.components(separatedBy: CharacterSet(charactersIn: "/:\\\n\r\t")).joined(separator: " ").trimmingCharacters(in: .whitespaces)
        return (clean.isEmpty ? "Note" : String(clean.prefix(80))) + ".png"
    }
}
