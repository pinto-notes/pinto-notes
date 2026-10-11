import SwiftUI
#if os(macOS)
import AppKit
#endif

/// A place notes can come from, as the Import Notes choice lists it: Apple Notes (read directly
/// on the Mac), then the apps whose exports are read from files.
enum ImportOrigin: Identifiable, Hashable {
    case appleNotes
    case files(ImportKind)

    static let all: [ImportOrigin] = [.appleNotes] + ImportKind.allCases.map(ImportOrigin.files)

    var id: String {
        switch self {
        case .appleNotes: "appleNotes"
        case .files(let kind): kind.rawValue
        }
    }

    /// The name on its row.
    var name: String {
        switch self {
        case .appleNotes: "Apple Notes"
        case .files(.markdown): "Markdown or text files"
        case .files(let kind): kind.sourceName
        }
    }

    /// The symbol on its tile when the app's own icon can't be shown.
    var symbol: String {
        switch self {
        case .appleNotes: "note.text"
        case .files(let kind): kind.symbol
        }
    }

    /// The Mac app whose icon stands for this source, when there is one.
    var bundleIdentifier: String? {
        switch self {
        case .appleNotes: "com.apple.Notes"
        case .files(.obsidian): "md.obsidian"
        case .files(.bear): "net.shinyfrog.bear"
        case .files(.evernote): "com.evernote.Evernote"
        case .files(.keep), .files(.markdown): nil
        }
    }
}

extension ImportOrigin {
    /// The icon in a menu, which takes an image and nothing else: the app's own at menu size when
    /// it's on this Mac, a symbol otherwise.
    var menuImage: Image {
        #if os(macOS)
        if let icon = bundleIdentifier.flatMap(ImportSourceIcon.installedIcon), let small = icon.copy() as? NSImage {
            small.size = NSSize(width: 16, height: 16)
            return Image(nsImage: small)
        }
        #endif
        return Image(systemName: symbol)
    }
}

/// A source's icon. On the Mac it is the app's own icon when that app is on this Mac, drawn by the
/// system from the installed copy (Apple Notes always is). Otherwise, and on iPhone, it is a tile in
/// this app's colours with a plain symbol: no other app's artwork ships inside Pinto Notes.
struct ImportSourceIcon: View {
    let origin: ImportOrigin
    var size: CGFloat = 24

    #if os(macOS)
    /// The icon of the installed app with this bundle identifier (captures and tests set their own).
    nonisolated(unsafe) static var installedIcon: (String) -> NSImage? = { id in
        NSWorkspace.shared.urlForApplication(withBundleIdentifier: id).map { NSWorkspace.shared.icon(forFile: $0.path) }
    }
    #endif

    var body: some View {
        #if os(macOS)
        if let icon = origin.bundleIdentifier.flatMap(Self.installedIcon) {
            Image(nsImage: icon)
                .resizable()
                .interpolation(.high)
                .frame(width: size, height: size)
                .accessibilityHidden(true)
        } else {
            tile
        }
        #else
        tile
        #endif
    }

    private var tile: some View {
        // Inset like a Mac app icon, so tiles and real icons sit on one grid.
        let side = size * 0.84
        return RoundedRectangle(cornerRadius: side * 0.23, style: .continuous)
            .fill(Color.amberSoft)
            .overlay(RoundedRectangle(cornerRadius: side * 0.23, style: .continuous).strokeBorder(Color.line, lineWidth: 0.5))
            .overlay(Image(systemName: origin.symbol).font(.system(size: side * 0.5, weight: .semibold)).foregroundStyle(Color.amberInk))
            .frame(width: side, height: side)
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}

/// The Import Notes choice: every source on a row of its own, with its icon.
struct ImportSourceList: View {
    /// The sources offered here (the iPhone has no direct Apple Notes import unless it explains one).
    var origins: [ImportOrigin] = ImportOrigin.all
    var choose: (ImportOrigin) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Import from")
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color.muted)
                .padding(.horizontal, Metrics.inset)
                .padding(.top, 4)
                .padding(.bottom, 2)
            ForEach(origins) { origin in
                Button { choose(origin) } label: {
                    HStack(spacing: Metrics.gap) {
                        ImportSourceIcon(origin: origin, size: Metrics.icon)
                        Text(origin.name).foregroundStyle(Color.ink)
                        Spacer(minLength: 12)
                    }
                    .font(.body)
                    .frame(minHeight: Metrics.row)
                    .padding(.horizontal, Metrics.inset)
                    .contentShape(.rect)
                    #if os(macOS)
                    .hoverHighlight(RoundedRectangle(cornerRadius: 6, style: .continuous))
                    #endif
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("setup.import.\(origin.id)")
            }
        }
        .padding(6)
        .frame(minWidth: Metrics.width, alignment: .leading)
    }

    private enum Metrics {
        #if os(iOS)
        static let icon: CGFloat = 30, row: CGFloat = 44, inset: CGFloat = 12, gap: CGFloat = 12, width: CGFloat = 260
        #else
        static let icon: CGFloat = 26, row: CGFloat = 34, inset: CGFloat = 8, gap: CGFloat = 10, width: CGFloat = 230
        #endif
    }
}
