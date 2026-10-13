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

    /// A white app icon (Evernote, Google Keep), which needs a drawn edge on a white row.
    var lightFace: Bool { self == .files(.evernote) || self == .files(.keep) }

    /// The app's own icon, shipped for when the app isn't installed (sources: docs/Technical/import-source-icons.md).
    var bundledIcon: String? {
        switch self {
        case .files(.evernote): "ImportIconEvernote"
        case .files(.bear): "ImportIconBear"
        case .files(.obsidian): "ImportIconObsidian"
        case .files(.keep): "ImportIconKeep"
        default: nil
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
/// system from the installed copy (Apple Notes always is). Evernote, Bear, Obsidian and Google Keep
/// ship their own icons for when the app isn't there and for iPhone (sources and terms:
/// docs/Technical/import-source-icons.md). Apple's never ship: on iPhone Apple Notes is a drawn
/// notes page. Markdown files are a drawn document everywhere.
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
        if origin == .files(.markdown) {
            // Drawn, not Finder's: Finder's page is too faint beside app icons at row size.
            documentTile
        } else if let icon = origin.bundleIdentifier.flatMap(Self.installedIcon) {
            Image(nsImage: icon)
                .resizable()
                .interpolation(.high)
                .frame(width: size, height: size)
                .accessibilityHidden(true)
        } else if let bundled = origin.bundledIcon {
            image(bundled)
        } else {
            tile
        }
        #else
        // Apple's own icons are never shipped (App Review): Apple Notes is a drawn notes page,
        // Markdown a drawn document like the Files app's.
        if let bundled = origin.bundledIcon {
            image(bundled)
        } else if origin == .appleNotes {
            notesTile
        } else if origin == .files(.markdown) {
            documentTile
        } else {
            tile
        }
        #endif
    }

    /// A notes page on the app-icon grid: white, a yellow band on top, a few ruled lines. It
    /// says Notes at a glance without being Apple's icon.
    private var notesTile: some View {
        let side = size * 0.805
        let shape = RoundedRectangle(cornerRadius: side * 0.2237, style: .continuous)
        return shape
            .fill(LinearGradient(colors: [Color(white: 1), Color(white: 0.95)], startPoint: .top, endPoint: .bottom))
            .overlay(alignment: .top) {
                LinearGradient(colors: [Color(red: 1, green: 0.84, blue: 0.24), Color(red: 0.99, green: 0.76, blue: 0.05)], startPoint: .top, endPoint: .bottom)
                    .frame(height: side * 0.27)
            }
            .overlay(alignment: .top) {
                VStack(spacing: side * 0.115) {
                    ForEach(0..<4, id: \.self) { _ in
                        Rectangle().fill(Color(white: 0.84)).frame(height: max(0.5, side * 0.022))
                    }
                }
                .padding(.horizontal, side * 0.12)
                .padding(.top, side * 0.4)
            }
            .clipShape(shape)
            .frame(width: side, height: side)
            .overlay { Self.edge(size) }
            .shadow(color: .black.opacity(0.2), radius: size * 0.018, y: size * 0.012)
            .frame(width: size, height: size)
            .environment(\.colorScheme, .light)
            .accessibilityHidden(true)
    }

    /// A document, as the Files app and Finder draw one: a white page with its corner folded and
    /// a few lines of text, a little narrower than an app icon.
    private var documentTile: some View {
        let height = size * 0.9
        let width = height * 0.8
        let fold = width * 0.3
        return ZStack(alignment: .topTrailing) {
            FoldedPage(fold: fold)
                .fill(LinearGradient(colors: [Color(white: 1), Color(white: 0.93)], startPoint: .top, endPoint: .bottom))
                .overlay(FoldedPage(fold: fold).stroke(Color.black.opacity(0.28), lineWidth: max(0.75, size / 40)))
                .overlay(alignment: .topLeading) {
                    VStack(alignment: .leading, spacing: height * 0.075) {
                        ForEach([0.62, 0.62, 0.62, 0.4], id: \.self) { share in
                            Capsule().fill(Color(white: 0.6)).frame(width: width * share, height: max(1, height * 0.05))
                        }
                    }
                    .padding(.leading, width * 0.17)
                    .padding(.top, height * 0.4)
                }
            FoldCorner(fold: fold)
                .fill(LinearGradient(colors: [Color(white: 0.95), Color(white: 0.8)], startPoint: .bottomLeading, endPoint: .topTrailing))
                .overlay(FoldCorner(fold: fold).stroke(Color.black.opacity(0.28), lineWidth: max(0.75, size / 40)))
                .frame(width: fold, height: fold)
        }
        .frame(width: width, height: height)
        .shadow(color: .black.opacity(0.25), radius: size * 0.02, y: size * 0.012)
        .frame(width: size, height: size)
        .environment(\.colorScheme, .light)
        .accessibilityHidden(true)
    }

    private func image(_ name: String) -> some View {
        Image(name)
            .resizable()
            .interpolation(.high)
            .frame(width: size, height: size)
            .overlay { if origin.lightFace { Self.edge(size) } }
            .accessibilityHidden(true)
    }

    /// The edge of a white icon on the app-icon grid (824 of 1024, Apple's corner), so a white
    /// face doesn't melt into a white row. The coloured icons carry their own.
    static func edge(_ size: CGFloat) -> some View {
        let side = size * 0.805
        return RoundedRectangle(cornerRadius: side * 0.2237, style: .continuous)
            .strokeBorder(Color.black.opacity(0.16), lineWidth: max(0.5, size / 48))
            .frame(width: side, height: side)
            .environment(\.colorScheme, .light)
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

/// A page with its top right corner cut for the fold.
private struct FoldedPage: Shape {
    let fold: CGFloat
    func path(in r: CGRect) -> Path {
        let c = r.width * 0.08
        var p = Path()
        p.move(to: CGPoint(x: r.minX + c, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX - fold, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX, y: r.minY + fold))
        p.addLine(to: CGPoint(x: r.maxX, y: r.maxY - c))
        p.addQuadCurve(to: CGPoint(x: r.maxX - c, y: r.maxY), control: CGPoint(x: r.maxX, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX + c, y: r.maxY))
        p.addQuadCurve(to: CGPoint(x: r.minX, y: r.maxY - c), control: CGPoint(x: r.minX, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX, y: r.minY + c))
        p.addQuadCurve(to: CGPoint(x: r.minX + c, y: r.minY), control: CGPoint(x: r.minX, y: r.minY))
        p.closeSubpath()
        return p
    }
}

/// The folded corner: a triangle under the cut.
private struct FoldCorner: Shape {
    let fold: CGFloat
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX + r.width * 0.12, y: r.maxY))
        p.addQuadCurve(to: CGPoint(x: r.minX, y: r.maxY - r.height * 0.12), control: CGPoint(x: r.minX, y: r.maxY))
        p.closeSubpath()
        return p
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
