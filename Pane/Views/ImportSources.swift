import SwiftUI
import UniformTypeIdentifiers
#if os(macOS)
import AppKit
#endif

/// A place notes can come from, as the Import Notes choice lists it: Apple Notes (read directly
/// on the Mac), then the apps whose exports are read from files.
enum ImportOrigin: Identifiable, Hashable {
    case appleNotes
    case files(ImportKind)

    static var all: [ImportOrigin] { [.appleNotes] + ImportKind.listed.map(ImportOrigin.files) }

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

    /// The app's own icon, shipped for when the app isn't installed (sources: docs/Technical/import-source-icons.md).
    /// The coloured set ships Evernote's alone: its terms are the only ones that allow it.
    var bundledIcon: String? {
        switch self {
        case .files(.evernote): "ImportIconEvernote"
        case .files(.bear): ImportSourceIcon.coloured ? nil : "ImportIconBear"
        default: nil
        }
    }

    /// The drawn tile's colours, top to bottom, in the app's own colour family, and its symbol,
    /// which is a plain one and never the app's mark. Apple Notes is a white face with a yellow
    /// symbol, so it never reads as Google Keep's yellow tile beside it.
    var tileTop: Color {
        switch self {
        case .appleNotes: Color(white: 1)
        case .files(.obsidian): Color(red: 0.62, green: 0.50, blue: 0.98)
        case .files(.bear): Color(red: 0.96, green: 0.42, blue: 0.38)
        case .files(.evernote): Color(red: 0.13, green: 0.78, blue: 0.40)
        case .files(.keep): Color(red: 1.0, green: 0.80, blue: 0.20)
        case .files(.markdown): Color(red: 0.56, green: 0.60, blue: 0.66)
        }
    }

    var tileBottom: Color {
        switch self {
        case .appleNotes: Color(white: 0.92)
        case .files(.obsidian): Color(red: 0.40, green: 0.24, blue: 0.80)
        case .files(.bear): Color(red: 0.82, green: 0.24, blue: 0.22)
        case .files(.evernote): Color(red: 0.0, green: 0.58, blue: 0.27)
        case .files(.keep): Color(red: 0.96, green: 0.62, blue: 0.0)
        case .files(.markdown): Color(red: 0.33, green: 0.36, blue: 0.42)
        }
    }

    var tileSymbol: String {
        switch self {
        case .appleNotes: "note.text"
        case .files(.obsidian): "point.3.filled.connected.trianglepath.dotted"
        case .files(.bear): "pawprint.fill"
        case .files(.evernote): "book.closed.fill"
        case .files(.keep): "pin.fill"
        case .files(.markdown): "doc.text.fill"
        }
    }

    /// The symbol's colour: white on a coloured tile, yellow on Apple Notes' white one.
    var tileInk: Color {
        self == .appleNotes ? Color(red: 0.96, green: 0.66, blue: 0.0) : .white
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

extension ImportKind {
    /// The order every list of sources uses: apps on this Mac first, then by how many people come
    /// from each (Evernote, Google Keep, Obsidian, Bear), Markdown files last as the catch-all.
    /// Finding an installed app asks nothing of the person: no permission dialog, nothing opened.
    static var listed: [ImportKind] { listed(installed: isInstalled) }

    static let byPopularity: [ImportKind] = [.evernote, .keep, .obsidian, .bear, .markdown]

    static func listed(installed: (ImportKind) -> Bool) -> [ImportKind] {
        let apps = byPopularity.filter { $0 != .markdown }
        return apps.filter(installed) + apps.filter { !installed($0) } + [.markdown]
    }

    /// Whether this kind's app is on this Mac (tests set their own). Always false on iPhone.
    nonisolated(unsafe) static var isInstalled: (ImportKind) -> Bool = { kind in
        #if os(macOS)
        guard let id = ImportOrigin.files(kind).bundleIdentifier else { return false }
        return NSWorkspace.shared.urlForApplication(withBundleIdentifier: id) != nil
        #else
        return false
        #endif
    }
}

extension ImportOrigin {
    /// The icon in a menu, which takes an image and nothing else: the app's own at menu size when
    /// it's on this Mac, a symbol otherwise.
    @MainActor var menuImage: Image {
        #if os(macOS)
        // The same icon as the list's, at menu size: real where it can be, the drawn tile otherwise.
        let renderer = ImageRenderer(content: ImportSourceIcon(origin: self, size: 16))
        renderer.scale = 2
        if let image = renderer.nsImage {
            image.size = NSSize(width: 16, height: 16)
            return Image(nsImage: image)
        }
        #endif
        return Image(systemName: symbol)
    }
}

/// A source's icon. On the Mac it is the app's own icon when that app is on this Mac, drawn by the
/// system from the installed copy (Apple Notes always is), and Finder's document icon for Markdown
/// files. Otherwise, and on iPhone, it is a tile drawn on an app icon's grid with a plain symbol.
/// Evernote's terms allow its icon to show compatibility but publish no file; Bear publishes no
/// terms; Google requires a request for any product icon (checked 2026-10-12). So no other
/// company's artwork ships inside Pinto Notes until one of them grants it.
struct ImportSourceIcon: View {
    let origin: ImportOrigin
    var size: CGFloat = 24

    /// The tiles under study for the Bring step (`BringDesign`): each in its app's colour family
    /// instead of grey, and on iPhone Apple Notes drawn too. Release keeps today's grey tiles.
    static var coloured: Bool { BringDesign.current != .today }

    #if os(macOS)
    /// The icon of the installed app with this bundle identifier (captures and tests set their own).
    nonisolated(unsafe) static var installedIcon: (String) -> NSImage? = { id in
        NSWorkspace.shared.urlForApplication(withBundleIdentifier: id).map { NSWorkspace.shared.icon(forFile: $0.path) }
    }

    /// The icon for files of this kind, as Finder draws it (captures and tests set their own).
    nonisolated(unsafe) static var documentIcon: () -> NSImage? = {
        NSWorkspace.shared.icon(for: UTType(filenameExtension: "md") ?? .plainText)
    }
    #endif

    var body: some View {
        #if os(macOS)
        if let icon = origin.bundleIdentifier.flatMap(Self.installedIcon) ?? (origin == .files(.markdown) ? Self.documentIcon() : nil) {
            Image(nsImage: icon)
                .resizable()
                .interpolation(.high)
                .frame(width: size, height: size)
                .accessibilityHidden(true)
        } else if let bundled = origin.bundledIcon {
            image(bundled)
        } else if Self.coloured {
            colouredTile
        } else {
            tile
        }
        #else
        if let bundled = origin.bundledIcon { image(bundled) } else if Self.coloured { colouredTile } else { tile }
        #endif
    }

    private func image(_ name: String) -> some View {
        Image(name)
            .resizable()
            .interpolation(.high)
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }

    /// Drawn on the grid of a real app icon (Apple's 824 of 1024, the same corner, the same light
    /// face and soft shadow), so a row without its app's own icon reads as one of the set. It is
    /// a plain symbol, not anyone's mark: no other company's artwork is copied or imitated.
    private var tile: some View {
        let side = size * 0.805
        let shape = RoundedRectangle(cornerRadius: side * 0.2237, style: .continuous)
        return shape
            .fill(LinearGradient(colors: [Color(white: 1), Color(white: 0.9)], startPoint: .top, endPoint: .bottom))
            .overlay(shape.strokeBorder(Color.black.opacity(0.08), lineWidth: max(0.5, size / 64)))
            .overlay(
                Image(systemName: origin.symbol)
                    .font(.system(size: side * 0.5, weight: .medium))
                    .foregroundStyle(LinearGradient(colors: [Color(white: 0.42), Color(white: 0.26)], startPoint: .top, endPoint: .bottom))
            )
            .frame(width: side, height: side)
            .shadow(color: .black.opacity(0.2), radius: size * 0.018, y: size * 0.012)
            .frame(width: size, height: size)
            .environment(\.colorScheme, .light)
            .accessibilityHidden(true)
    }
}

extension ImportSourceIcon {
    /// The same grid as `tile` (824 of 1024, the same corner and shadow), filled in the app's own
    /// colour family with a plain white symbol, so the drawn ones sit beside a real icon as a set.
    var colouredTile: some View {
        let side = size * 0.805
        let shape = RoundedRectangle(cornerRadius: side * 0.2237, style: .continuous)
        return shape
            .fill(LinearGradient(colors: [origin.tileTop, origin.tileBottom], startPoint: .top, endPoint: .bottom))
            .overlay(shape.strokeBorder(Color.black.opacity(origin == .appleNotes ? 0.1 : 0.06), lineWidth: max(0.5, size / 64)))
            .overlay(
                Image(systemName: origin.tileSymbol)
                    .font(.system(size: side * (origin == .appleNotes ? 0.56 : 0.48), weight: origin == .appleNotes ? .bold : .semibold))
                    .foregroundStyle(origin.tileInk)
                    .shadow(color: .black.opacity(origin == .appleNotes ? 0 : 0.12), radius: size * 0.01, y: size * 0.01)
            )
            .frame(width: side, height: side)
            .shadow(color: .black.opacity(0.2), radius: size * 0.018, y: size * 0.012)
            .frame(width: size, height: size)
            .environment(\.colorScheme, .light)
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

#if os(macOS)
/// The Import choice as a sheet of its own (the list's More menu can't hold a popover).
struct ImportChoiceSheet: View {
    @Environment(\.dismiss) private var dismiss
    var choose: (ImportOrigin) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ImportSourceList(choose: choose)
            HStack {
                Spacer()
                Button("Cancel") { dismiss() }.keyboardShortcut(.cancelAction)
            }
            .padding([.horizontal, .bottom], 14)
        }
        .frame(width: 300)
        .foregroundStyle(Color.ink)
        .background(Color(Palette.sheetGround))
        .presentationBackground(Color(Palette.sheetGround))
    }
}
#endif
