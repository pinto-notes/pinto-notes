import ImageIO
import LinkPresentation
import SwiftUI
import UniformTypeIdentifiers

/// A file, image or link that lives on its own line in a note.
struct EmbedView: View {
    let embed: LineEmbed
    let controller: EditorController?
    /// The text's selection takes it in: it shows selected (SelectionTint).
    var selected = false
    /// A click selects it rather than opening it (pictures and files on the Mac, as in Notes).
    var select: (() -> Void)?
    let remove: () -> Void
    /// Writes the line again (a link shown another way, LinkForms).
    var rewrite: (String) -> Void = { _ in }

    var body: some View {
        Group {
            switch embed.kind {
            case .file(let id, let name):
                FileEmbed(id: id, name: name, card: embed.card, controller: controller, select: select, remove: remove, restyle: restyle)
            case .image(let id, let name):
                ImageEmbed(id: id, name: name, controller: controller, select: select, remove: remove, resize: resize)
            case .link(let url):
                LinkEmbed(url: url, card: embed.card, remove: remove, restyle: restyle)
            case .note(let id, let name):
                // Only a note that is an app is an embed (LineEmbed): its live widget.
                NoteAppWidget(id: id, name: name, controller: controller, remove: remove)
                    .selectionTint(RoundedRectangle(cornerRadius: 14, style: .continuous))
            case .wiki(let title):
                NoteCardEmbed(title: title, controller: controller, remove: remove, restyle: restyle)
            }
        }
        .environment(\.embedSelected, selected)
    }

    /// Shows this picture at another size (ImageSizes), written into its line.
    private var resize: (ImageSize) -> Void {
        let line = controller?.target.map { ($0.currentText as NSString) }.flatMap { ns in
            NSMaxRange(embed.range) <= ns.length ? ns.substring(with: embed.range) : nil
        }
        let rewrite = self.rewrite
        return { size in
            if let line, let new = ImageSizes.relabel(line, to: size) { rewrite(new) }
        }
    }

    /// The other ways this line can be shown, as menu items.
    private var restyle: Restyle {
        let line = controller?.target.map { ($0.currentText as NSString) }.flatMap { ns in
            NSMaxRange(embed.range) <= ns.length ? ns.substring(with: embed.range) : nil
        }
        return Restyle(line: line.flatMap(LinkForms.parse), rewrite: rewrite)
    }
}

/// Turning a link line into another style (LinkForms): the menu items and what they write.
@MainActor
struct Restyle {
    let line: LinkForms.Line?
    let rewrite: (String) -> Void

    @ViewBuilder func items(title: String? = nil) -> some View {
        if let line {
            let rewrite = self.rewrite
            ForEach(LinkForms.choices(for: line), id: \.self) { style in
                Button(LinkForms.title(style), systemImage: Restyle.symbol(style)) {
                    rewrite(LinkForms.write(line, as: style, title: title))
                }
            }
        }
    }

    nonisolated static func symbol(_ style: LinkForms.Style) -> String {
        switch style {
        case .link: "link"
        case .compact: "capsule"
        case .card: "rectangle.portrait.topthird.inset.filled"
        }
    }
}

/// One line: a small picture, the name, where it's from. Barely more than a link (Emil, 11-01).
struct CompactEmbed<Picture: View, Menu: View>: View {
    let title: String
    let source: String
    let open: () -> Void
    var select: (() -> Void)? = nil
    @ViewBuilder let picture: Picture
    @ViewBuilder let menu: Menu

    var body: some View {
        EmbedPress(open: open, select: select) {
            HStack(spacing: 8) {
                picture
                    .frame(width: 22, height: 22)
                    .clipShape(.rect(cornerRadius: 5, style: .continuous))
                Text(title)
                    .font(.system(size: EditorMetrics.body, weight: .medium))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Text(source)
                    .font(.system(size: EditorMetrics.body * 0.92))
                    .foregroundStyle(.tertiary)
                    .lineLimit(1)
                    .layoutPriority(-1)
            }
            .padding(.leading, 6)
            .padding(.trailing, 12)
            .frame(height: LineEmbed.compactHeight)
            .hoverHighlight(Capsule())
        }
        .background(Color.paneChip, in: .capsule)
        .selectionTint(Capsule())
        .contextMenu { menu }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A card: a picture on the left, the name, a line about it, and where it's from (Emil, 11-01).
struct CardEmbed<Picture: View, Menu: View>: View {
    let title: String
    let detail: String?
    let source: String
    let sourceSymbol: String
    let open: () -> Void
    var select: (() -> Void)? = nil
    @ViewBuilder let picture: Picture
    @ViewBuilder let menu: Menu

    var body: some View {
        EmbedPress(open: open, select: select) {
            HStack(spacing: 12) {
                picture
                    .frame(width: 52, height: 52)
                    .clipShape(.rect(cornerRadius: 8, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: EditorMetrics.body, weight: .semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    if let detail, !detail.isEmpty {
                        Text(detail)
                            .font(.system(size: EditorMetrics.body * 0.92))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    HStack(spacing: 4) {
                        Image(systemName: sourceSymbol).imageScale(.small)
                        Text(source).lineLimit(1)
                    }
                    .font(.system(size: EditorMetrics.body * 0.85))
                    .foregroundStyle(.tertiary)
                }
                Spacer(minLength: 0)
            }
            .padding(10)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .hoverHighlight(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        // Content, not a control: a solid surface (glass is for the navigation layer).
        .background(Color.paneChip, in: .rect(cornerRadius: 12, style: .continuous))
        .selectionTint(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .contextMenu { menu }
    }
}

/// What a click on an embed does: opens it, or (with `select`) selects it, and a double-click opens
/// it, as Notes does with an attachment. A picture opening in Quick Look at a stray click was too
/// much for a click meant to put the caret near it (Emil, 8 November 2026).
struct EmbedPress<Label: View>: View {
    let open: () -> Void
    let select: (() -> Void)?
    @ViewBuilder let label: Label

    var body: some View {
        if let select {
            label
                .contentShape(.rect)
                .gesture(TapGesture(count: 2).onEnded { open() })
                .simultaneousGesture(TapGesture().onEnded { select() })
                .accessibilityElement(children: .combine)
                .accessibilityAddTraits(.isButton)
                .accessibilityAction { open() }
        } else {
            Button(action: open) { label }
                .buttonStyle(PressScale())
        }
    }
}

extension EnvironmentValues {
    /// The embed being drawn is in the text's selection (EmbedView).
    @Entry var embedSelected = false
}

extension View {
    /// The selection's tint over an embed in it, in its shape, as Notes tints a selected attachment.
    func selectionTint<S: InsettableShape>(_ shape: S) -> some View { modifier(SelectionTint(shape: shape)) }
}

private struct SelectionTint<S: InsettableShape>: ViewModifier {
    let shape: S
    @Environment(\.embedSelected) private var selected

    func body(content: Content) -> some View {
        content.overlay {
            if selected {
                shape.fill(Self.fill)
                    .overlay(shape.strokeBorder(Color(PColor.paneAccent), lineWidth: 2))
                    .allowsHitTesting(false)
            }
        }
    }

    /// The text selection's own colour, so a picture and the words around it read as one selection.
    private static var fill: Color {
        #if os(macOS)
        Color(nsColor: .selectedTextBackgroundColor).opacity(0.35)
        #else
        Color(PColor.paneAccent).opacity(0.25)
        #endif
    }
}

/// A glyph on a tinted square, for a card or a compact line with no picture of its own.
struct EmbedGlyph: View {
    let symbol: String
    let tint: Color
    var body: some View {
        GeometryReader { g in
            ZStack {
                Rectangle().fill(tint.opacity(0.15))
                Image(systemName: symbol)
                    .font(.system(size: g.size.width * 0.42, weight: .medium))
                    .foregroundStyle(tint)
            }
        }
    }
}

/// A file alone on its line: compact, or a card with its first page (Emil, 11-01).
private struct FileEmbed: View {
    let id: UUID
    let name: String
    let card: Bool
    let controller: EditorController?
    let select: (() -> Void)?
    let remove: () -> Void
    let restyle: Restyle

    var body: some View {
        let file = controller?.resolveAttachment(id)
        let open: () -> Void = { controller?.openAttachment(id) }
        let downloading = controller?.downloading.contains(id) == true
        let detail = downloading ? "Downloading\u{2026}" : file.map { "\($0.kindText) · \($0.sizeText)" } ?? "Not on this device yet"
        Group {
            if card {
                CardEmbed(title: file?.filename ?? name, detail: detail, source: "File", sourceSymbol: "paperclip", open: open, select: select) {
                    picture(file, page: true)
                } menu: { menu(open) }
            } else {
                CompactEmbed(title: file?.filename ?? name, source: downloading ? "Downloading\u{2026}" : file?.sizeText ?? "", open: open, select: select) {
                    picture(file, page: false)
                } menu: { menu(open) }
            }
        }
        .accessibilityIdentifier("file.\(name)")
    }

    @ViewBuilder private func picture(_ f: Attachment?, page: Bool) -> some View {
        if page, let f {
            FileThumbnail(file: f, side: 52)
        } else {
            EmbedGlyph(symbol: f?.symbol ?? "doc", tint: f?.tint ?? .secondary)
        }
    }

    @ViewBuilder private func menu(_ open: @escaping () -> Void) -> some View {
        Button("Open", systemImage: "eye", action: open)
        restyle.items()
        Divider()
        DestructiveMenuButton("Remove from Note", systemImage: "trash", action: remove)
    }
}

/// `![[Title]]`: the note's card. Its first lines and folder, and a click opens it.
private struct NoteCardEmbed: View {
    let title: String
    let controller: EditorController?
    let remove: () -> Void
    let restyle: Restyle

    var body: some View {
        let id = controller?.wiki?.index.resolve(title, from: controller?.wiki?.from ?? [])
        let about = id.flatMap { controller?.notePreview($0) }
        CardEmbed(title: title, detail: id == nil ? "No note with this name yet" : about?.preview,
                  source: about?.folder ?? "Notes", sourceSymbol: "folder", open: { controller?.openWiki(title) }) {
            EmbedGlyph(symbol: "note.text", tint: Color(PColor.paneAccent))
        } menu: {
            Button("Open Note", systemImage: "arrow.up.right") { controller?.openWiki(title) }
            restyle.items()
            Divider()
            DestructiveMenuButton("Remove from Note", systemImage: "trash", action: remove)
        }
        .accessibilityIdentifier("noteCard.\(title)")
    }
}

extension Color {
    /// A quiet fill for chips inside a note.
    /// A file's card in a note: the system's fill, or in the candidates (DesignLook)
    /// the soft fill, so it stays warm on a warm page.
    static var paneChip: Color { DesignLook.isCandidate ? Color.soft : Color(PColor.paneFill) }
}

private struct ImageEmbed: View {
    let id: UUID
    let name: String
    let controller: EditorController?
    let select: (() -> Void)?
    let remove: () -> Void
    let resize: (ImageSize) -> Void

    var body: some View {
        let url = controller?.resolveAttachment(id).map { FileStore.url(for: $0.id, filename: $0.filename) }
        let (shown, size) = ImageSizes.label(name)
        // Read so the image is drawn when its bytes arrive (fetched as the note opened, or by a tap).
        let _ = controller?.imagesArrived
        EmbedPress(open: { controller?.openAttachment(id) }, select: select) {
            // The image fills the slot (a cover is cropped to it).
            Color.clear
                .overlay {
                    if let url, let image = PlatformImage.load(url) {
                        image.resizable().scaledToFill()
                    } else {
                        ZStack {
                            Rectangle().fill(.fill.tertiary)
                            Image(systemName: "photo").foregroundStyle(.tertiary)
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipShape(.rect(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(.primary.opacity(0.08), lineWidth: 1))
            .hoverOverlay(RoundedRectangle(cornerRadius: 14), .hoverDarken)
        }
        .selectionTint(RoundedRectangle(cornerRadius: 14))
        .contextMenu {
            Button("Open", systemImage: "eye") { controller?.openAttachment(id) }
            // Three sizes (Emil, 11-01): small, the text's width, or a banner across it.
            Picker("Size", systemImage: "arrow.up.left.and.arrow.down.right", selection: Binding(get: { size }, set: { resize($0) })) {
                ForEach(ImageSize.allCases, id: \.self) { Text($0.title).tag($0) }
            }
            Divider()
            DestructiveMenuButton("Remove from Note", systemImage: "trash", action: remove)
        }
        .accessibilityLabel("Image, \((shown as NSString).deletingPathExtension)")
        .accessibilityHint("Opens it in Quick Look")
        .accessibilityIdentifier("image.\(shown)")
    }
}

private enum PlatformImage {
    static func load(_ url: URL) -> Image? {
        if let i = EmbedImages.cached(url) {
            #if os(iOS)
            return Image(uiImage: UIImage(cgImage: i))
            #else
            return Image(nsImage: NSImage(cgImage: i, size: .zero))
            #endif
        }
        // Not decoded yet: the file as it is, which the system decodes as it draws (no slower
        // than before), and a decode at the shown size for the next time.
        EmbedImages.keep(url)
        #if os(iOS)
        guard let i = UIImage(contentsOfFile: url.path) else { return nil }
        return Image(uiImage: i)
        #else
        guard let i = NSImage(contentsOf: url) else { return nil }
        return Image(nsImage: i)
        #endif
    }
}

/// The pictures in notes, decoded at the size a note shows them and kept.
///
/// A picture was read from disk and decoded whole each time its view was worked out, on the main
/// thread: a camera photo is 4032 x 3024, and a note with three of them took 75 ms longer to open
/// than one without (2026-10-12). Here each is decoded once, off the main thread and no larger than
/// a note draws it: after it was first shown, or before its note opens (NotePreload, when the
/// pointer rests on the note's row).
enum EmbedImages {
    /// The longest side, in pixels: an image is at most 520 x 560 points, at 2x.
    static let maxPixels = 1200
    nonisolated(unsafe) private static let cache: NSCache<NSString, CGImage> = {
        let c = NSCache<NSString, CGImage>()
        c.totalCostLimit = 96 << 20
        return c
    }()

    nonisolated static func cached(_ url: URL) -> CGImage? { cache.object(forKey: url.path as NSString) }

    /// Decodes one picture off the main thread, for the next time it is shown.
    static func keep(_ url: URL) {
        Task { await warm([url]) }
    }

    /// Decodes the pictures that aren't kept yet, off the main thread. Files not on this device
    /// are skipped: nothing is fetched.
    static func warm(_ urls: [URL]) async {
        let todo = urls.filter { cached($0) == nil && FileManager.default.fileExists(atPath: $0.path) }
        guard !todo.isEmpty else { return }
        await Task.detached(priority: .userInitiated) {
            for url in todo where !Task.isCancelled { _ = decode(url) }
        }.value
    }

    nonisolated private static func decode(_ url: URL) -> CGImage? {
        guard let src = CGImageSourceCreateWithURL(url as CFURL, [kCGImageSourceShouldCache: false] as CFDictionary) else { return nil }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceShouldCacheImmediately: true,
            kCGImageSourceThumbnailMaxPixelSize: maxPixels,
        ]
        guard let image = CGImageSourceCreateThumbnailAtIndex(src, 0, options as CFDictionary) else { return nil }
        cache.setObject(image, forKey: url.path as NSString, cost: image.bytesPerRow * image.height)
        return image
    }
}

private struct EmbedMenu: View {
    let open: () -> Void
    let remove: () -> Void
    var body: some View {
        Button("Open", systemImage: "eye", action: open)
        Divider()
        DestructiveMenuButton("Remove from Note", systemImage: "trash", action: remove)
    }
}

/// A web address alone on its line: compact (icon, page title, site) or a card with the page's
/// picture and summary (Emil, 11-01).
private struct LinkEmbed: View {
    let url: URL
    let card: Bool
    let remove: () -> Void
    let restyle: Restyle
    @State private var meta: LinkMeta?
    @Environment(\.openURL) private var openURL

    var body: some View {
        let site = url.host()?.replacingOccurrences(of: "www.", with: "") ?? url.absoluteString
        let title = meta?.title ?? site
        let open = { openURL(url) }
        Group {
            if card {
                CardEmbed(title: title, detail: meta?.summary, source: site, sourceSymbol: "globe", open: open) {
                    if let image = meta?.image ?? meta?.icon {
                        image.resizable().scaledToFill()
                    } else {
                        EmbedGlyph(symbol: "globe", tint: .blue)
                    }
                } menu: { menu(title: meta?.title) }
            } else {
                CompactEmbed(title: title, source: meta?.title == nil ? "" : site, open: open) {
                    if let icon = meta?.icon {
                        icon.resizable().scaledToFit().padding(2)
                    } else {
                        EmbedGlyph(symbol: "globe", tint: .blue)
                    }
                } menu: { menu(title: meta?.title) }
            }
        }
        .task(id: url) { meta = await LinkMeta.fetch(url) }
        .accessibilityIdentifier("link.\(url.host() ?? "")")
    }

    @ViewBuilder private func menu(title: String?) -> some View {
        Link(destination: url) { Label("Open Link", systemImage: "safari") }
        Button("Copy Link", systemImage: "doc.on.doc") { Clipboard.copy(url.absoluteString) }
        restyle.items(title: title)
        Divider()
        DestructiveMenuButton("Remove from Note", systemImage: "trash", action: remove)
    }
}

/// A page's title, summary, icon and picture. Kept for the session and on disk (Caches), so a
/// note's links show at once the next time and nothing is fetched again for a week.
struct LinkMeta {
    var title: String?
    var summary: String?
    var icon: Image?
    var image: Image?

    private struct Stored: Codable {
        var title: String?
        var summary: String?
        var icon: Data?
        var image: Data?
        var fetched: Date
    }

    @MainActor private static var cache: [URL: LinkMeta] = [:]

    @MainActor
    static func fetch(_ url: URL) async -> LinkMeta {
        if let hit = cache[url] { return hit }
        if let stored = load(url), stored.fetched > .now.addingTimeInterval(-7 * 86400) {
            let m = LinkMeta(stored)
            cache[url] = m
            return m
        }
        let provider = LPMetadataProvider()
        provider.timeout = 8
        var stored = Stored(fetched: .now)
        if let m = try? await provider.startFetchingMetadata(for: url) {
            stored.title = m.title
            if let p = m.iconProvider { stored.icon = await data(p) }
            if let p = m.imageProvider { stored.image = await data(p).flatMap(shrink) }
        }
        stored.summary = await summary(url)
        let result = LinkMeta(stored)
        cache[url] = result
        save(stored, for: url)
        return result
    }

    private init(_ s: Stored) {
        title = s.title
        summary = s.summary
        icon = s.icon.flatMap(Self.image)
        image = s.image.flatMap(Self.image)
    }

    /// The page's own one-line description (og:description or description), first 300 KB only.
    private static func summary(_ url: URL) async -> String? {
        var request = URLRequest(url: url, timeoutInterval: 8)
        request.setValue("bytes=0-300000", forHTTPHeaderField: "Range")
        guard let (data, _) = try? await URLSession.shared.data(for: request),
              let html = String(data: data.prefix(300_000), encoding: .utf8) ?? String(data: data.prefix(300_000), encoding: .isoLatin1) else { return nil }
        return description(in: html)
    }

    static func description(in html: String) -> String? {
        for name in ["og:description", "twitter:description", "description"] {
            let patterns = [
                #"<meta[^>]+(?:property|name)=["']\#(name)["'][^>]*content=["']([^"']+)["']"#,
                #"<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']\#(name)["']"#,
            ]
            for p in patterns {
                if let r = html.range(of: p, options: [.regularExpression, .caseInsensitive]) {
                    let tag = String(html[r])
                    if let c = tag.range(of: #"content=["']([^"']+)["']"#, options: .regularExpression) {
                        let value = tag[c].dropFirst(9).dropLast()
                        let text = String(value).replacingOccurrences(of: "&amp;", with: "&").replacingOccurrences(of: "&#39;", with: "'")
                            .replacingOccurrences(of: "&quot;", with: "\"").trimmingCharacters(in: .whitespacesAndNewlines)
                        if !text.isEmpty { return text }
                    }
                }
            }
        }
        return nil
    }

    @MainActor
    private static func data(_ provider: NSItemProvider) async -> Data? {
        await withCheckedContinuation { cont in
            _ = provider.loadDataRepresentation(for: .image) { d, _ in cont.resume(returning: d) }
        }
    }

    /// A page's picture at card size (a card shows it 52 points square), so the cache stays small.
    private static func shrink(_ data: Data) -> Data? {
        guard let src = CGImageSourceCreateWithData(data as CFData, nil),
              let image = CGImageSourceCreateThumbnailAtIndex(src, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceThumbnailMaxPixelSize: 320,
                kCGImageSourceCreateThumbnailWithTransform: true,
              ] as CFDictionary) else { return nil }
        let out = NSMutableData()
        guard let dest = CGImageDestinationCreateWithData(out, UTType.jpeg.identifier as CFString, 1, nil) else { return nil }
        CGImageDestinationAddImage(dest, image, [kCGImageDestinationLossyCompressionQuality: 0.8] as CFDictionary)
        return CGImageDestinationFinalize(dest) ? out as Data : nil
    }

    private static func image(_ data: Data) -> Image? {
        #if os(iOS)
        return UIImage(data: data).map { Image(uiImage: $0) }
        #else
        return NSImage(data: data).map { Image(nsImage: $0) }
        #endif
    }

    private static var folder: URL? {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?.appending(path: "LinkMeta", directoryHint: .isDirectory)
    }

    private static func file(_ url: URL) -> URL? {
        let key = url.absoluteString.utf8.reduce(UInt64(1469598103934665603)) { ($0 ^ UInt64($1)) &* 1099511628211 }
        return folder?.appending(path: String(key, radix: 16) + ".json")
    }

    private static func load(_ url: URL) -> Stored? {
        guard let f = file(url), let data = try? Data(contentsOf: f) else { return nil }
        return try? JSONDecoder().decode(Stored.self, from: data)
    }

    private static func save(_ s: Stored, for url: URL) {
        guard let folder, let f = file(url) else { return }
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        try? JSONEncoder().encode(s).write(to: f)
    }
}

/// Puts text on the clipboard.
enum Clipboard {
    static func copy(_ text: String) {
        #if os(iOS)
        UIPasteboard.general.string = text
        #else
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        #endif
    }
}
