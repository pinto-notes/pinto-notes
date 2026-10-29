import ImageIO
import LinkPresentation
import SwiftUI
import UniformTypeIdentifiers

/// A file, image or link that lives on its own line in a note.
struct EmbedView: View {
    let embed: LineEmbed
    let controller: EditorController?
    let remove: () -> Void

    var body: some View {
        switch embed.kind {
        case .file(let id, let name):
            FileChip(id: id, name: name, controller: controller, remove: remove)
        case .image(let id, let name):
            ImageEmbed(id: id, name: name, controller: controller, remove: remove)
        case .link(let url):
            LinkCard(url: url, remove: remove)
        case .note(let id, let name):
            // Only a note that is an app is an embed (LineEmbed): its live widget.
            NoteAppWidget(id: id, name: name, controller: controller, remove: remove)
        }
    }
}

private struct FileChip: View {
    let id: UUID
    let name: String
    let controller: EditorController?
    let remove: () -> Void

    var body: some View {
        let file = controller?.resolveAttachment(id)
        Button { controller?.openAttachment(id) } label: {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .fill(tint(file).opacity(0.16))
                    Image(systemName: icon(file))
                        .font(.system(size: 18, weight: .medium))
                        .foregroundStyle(tint(file))
                }
                .frame(width: 40, height: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(file?.filename ?? name)
                        .font(.system(size: EditorMetrics.body, weight: .medium))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    Text(file.map { "\($0.kindText) · \($0.sizeText)" } ?? "File not on this device yet")
                        .font(.system(size: EditorMetrics.body * 0.78))
                        .foregroundStyle(.secondary)
                        .monospacedDigit()
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                if controller?.downloading.contains(id) == true {
                    ProgressView().controlSize(.small)
                } else {
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.tertiary)
                }
            }
            .padding(.horizontal, 10)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .hoverHighlight(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(PressScale())
        // Content, not a control: a solid surface (glass is for the navigation layer).
        .background(Color.paneChip, in: .rect(cornerRadius: 12, style: .continuous))
        .contextMenu { EmbedMenu(open: { controller?.openAttachment(id) }, remove: remove) }
        .accessibilityIdentifier("file.\(name)")
    }

    private func icon(_ f: Attachment?) -> String { f?.symbol ?? "doc" }

    private func tint(_ f: Attachment?) -> Color { f?.tint ?? .secondary }
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
    let remove: () -> Void

    var body: some View {
        let url = controller?.resolveAttachment(id).map { FileStore.url(for: $0.id, filename: $0.filename) }
        // Read so the image is drawn when its bytes arrive (fetched as the note opened, or by a tap).
        let _ = controller?.imagesArrived
        Button { controller?.openAttachment(id) } label: {
            // The image fills the slot without changing its size.
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
        .buttonStyle(PressScale())
        .contextMenu { EmbedMenu(open: { controller?.openAttachment(id) }, remove: remove) }
        .accessibilityLabel("Image, \((name as NSString).deletingPathExtension)")
        .accessibilityHint("Opens it in Quick Look")
        .accessibilityIdentifier("image.\(name)")
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
        Button("Remove from Note", systemImage: "trash", role: .destructive, action: remove)
    }
}

/// A rich preview for a link on its own line, using the page's title and icon.
private struct LinkCard: View {
    let url: URL
    let remove: () -> Void
    @State private var meta: LinkMeta?

    var body: some View {
        Link(destination: url) {
            HStack(spacing: 12) {
                Group {
                    if let icon = meta?.icon { icon.resizable().scaledToFit().padding(8) }
                    else { Image(systemName: "globe").font(.system(size: 18)).foregroundStyle(.secondary) }
                }
                .frame(width: 44, height: 44)
                .background(.fill.tertiary, in: .rect(cornerRadius: 10, style: .continuous))
                VStack(alignment: .leading, spacing: 3) {
                    Text(meta?.title ?? url.host() ?? url.absoluteString)
                        .font(.system(size: EditorMetrics.body, weight: .medium))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    Text(url.host()?.replacingOccurrences(of: "www.", with: "") ?? url.absoluteString)
                        .font(.system(size: EditorMetrics.body * 0.78))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 12)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .hoverHighlight(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(PressScale())
        // Content, not a control: a solid surface (glass is for the navigation layer).
        .background(Color.paneChip, in: .rect(cornerRadius: 12, style: .continuous))
        .contextMenu {
            Link(destination: url) { Label("Open Link", systemImage: "safari") }
            Button("Remove Preview", systemImage: "trash", role: .destructive, action: remove)
        }
        .task(id: url) { meta = await LinkMeta.fetch(url) }
        .accessibilityIdentifier("link.\(url.host() ?? "")")
    }
}

/// Title and icon for a URL, cached for the session.
struct LinkMeta {
    var title: String?
    var icon: Image?

    @MainActor private static var cache: [URL: LinkMeta] = [:]

    @MainActor
    static func fetch(_ url: URL) async -> LinkMeta {
        if let hit = cache[url] { return hit }
        let provider = LPMetadataProvider()
        provider.timeout = 8
        var result = LinkMeta()
        if let m = try? await provider.startFetchingMetadata(for: url) {
            result.title = m.title
            if let p = m.iconProvider ?? m.imageProvider {
                result.icon = await loadImage(p)
            }
        }
        cache[url] = result
        return result
    }

    @MainActor
    private static func loadImage(_ provider: NSItemProvider) async -> Image? {
        let data: Data? = await withCheckedContinuation { cont in
            _ = provider.loadDataRepresentation(for: .image) { d, _ in cont.resume(returning: d) }
        }
        guard let data else { return nil }
        #if os(iOS)
        return UIImage(data: data).map { Image(uiImage: $0) }
        #else
        return NSImage(data: data).map { Image(nsImage: $0) }
        #endif
    }
}
