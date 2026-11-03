#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Settings redesigned from scratch (SettingsStudy, 3 November 2026): directions A, B and C, each
/// drawn at Account, Connect an AI and Appearance over the notes window, light and dark; the
/// account menu at the sidebar's foot; then a contact sheet per page. Windows far off screen,
/// never ordered in.
/// `TEST_RUNNER_PANE_SETTINGS_STUDY=/path LIMIT=900 scripts/qa-test.sh PaneTests/SettingsStudyShots`
@MainActor @Suite(.serialized) struct SettingsStudyShots {
    static let size = CGSize(width: 1180, height: 760)
    static var dir: URL? { ProcessInfo.processInfo.environment["PANE_SETTINGS_STUDY"].map { URL(fileURLWithPath: $0) } }

    /// The real notes window behind, as SidebarStudySnapshots draws it, dimmed as under the card.
    private func window(_ over: some View, library: ModelContainer, hover: Set<String> = [], dim: Bool = true) -> some View {
        ZStack(alignment: .topLeading) {
            Color(nsColor: .windowBackgroundColor)
            RootView().allowsHitTesting(false)
            NavigationStack { SidebarView(scope: .constant(.all), onNewNote: {}) }
                .overlay(alignment: .bottomLeading) { SidebarStudySnapshots.foot.environment(\.hoverPreview, hover) }
                .frame(width: 259, height: Self.size.height - 16)
                .background(Color(nsColor: .windowBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .padding(8)
            if dim { Color.black.opacity(0.18) }
            over
        }
        .environment(\.sidebarStudy, SidebarStudy())
        .environment(\.controlActiveState, .key)
        .tint(Color(PColor.paneAccent))
        .modelContainer(library)
    }

    private func shoot(_ view: some View, dark: Bool, dimmed: Bool = true, wait: Double = 1.2) async throws -> NSBitmapImageRep {
        let w = NSWindow(contentRect: CGRect(origin: CGPoint(x: -20000, y: -20000), size: Self.size), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let host = NSHostingView(rootView: view.frame(width: Self.size.width, height: Self.size.height))
        host.appearance = w.appearance
        host.frame = CGRect(origin: .zero, size: Self.size)
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(wait))
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        // On an opaque ground: offscreen, the list's table leaves its column see-through.
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: rep.pixelsWide, pixelsHigh: rep.pixelsHigh, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = rep.size
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        // The dimmed list under the card: the window's ground, then the card's dim.
        (dimmed ? (dark ? NSColor(white: 0.04, alpha: 1) : NSColor(white: 0.82, alpha: 1)) : (dark ? NSColor.black : NSColor.white)).setFill()
        CGRect(origin: .zero, size: rep.size).fill()
        rep.draw(in: CGRect(origin: .zero, size: rep.size), from: .zero, operation: .sourceOver, fraction: 1, respectFlipped: false, hints: nil)
        return out
    }

    private func save(_ rep: NSBitmapImageRep, _ name: String, in dir: URL) throws {
        try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "\(name).png"))
    }

    @Test func pictures() async throws {
        guard let dir = Self.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let lib = try SidebarStudySnapshots.library()
        let kept = ThemeStore.shared.current
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer {
            ProfileStore.shared.showForPreview(name: nil, photo: nil)
            ThemeStore.shared.set(kept, persist: false)
        }
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        let pages: [(SettingsStudy.Page, String)] = [(.account, "account"), (.ai, "connect"), (.appearance, "appearance")]
        var sheets: [String: [[(String, NSBitmapImageRep)]]] = [:]
        try await AppSnapshotTests.withLastNote(lib, "Trip documents") {
            for (page, name) in pages {
                for study in SettingsStudy.allCases {
                    var row: [(String, NSBitmapImageRep)] = []
                    for dark in [false, true] {
                        let card = SettingsStudyCard(study: study, page: page).frame(maxWidth: .infinity, maxHeight: .infinity)
                        let rep = try await shoot(window(card, library: lib), dark: dark)
                        let file = "\(study.rawValue.uppercased())-\(name)-\(dark ? "dark" : "light")"
                        try save(rep, file, in: dir)
                        row.append(("\(study.title), \(dark ? "dark" : "light")", rep))
                    }
                    sheets[name, default: []].append(row)
                }
            }
            // The account menu over the sidebar's foot, its row under the pointer.
            var menu: [(String, NSBitmapImageRep)] = []
            for dark in [false, true] {
                let over = AccountMenuStudy()
                    .padding(.leading, 18)
                    .padding(.bottom, 58)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
                let rep = try await shoot(window(over, library: lib, hover: ["sidebar.account"], dim: false), dark: dark, dimmed: false)
                try save(rep, "menu-\(dark ? "dark" : "light")", in: dir)
                menu.append(("Account menu, \(dark ? "dark" : "light")", rep))
            }
            sheets["menu"] = [menu]
        }
        let titles = ["account": "Account: A, B and C", "connect": "Connect an AI: A, B and C", "appearance": "Appearance: A, B and C",
                      "menu": "The account row opens a menu (B's sidebar foot)"]
        for (name, rows) in sheets {
            try ThemeShots.sheet(titles[name] ?? name, rows: rows, scale: 0.5).write(to: dir.appending(path: "sheet-\(name).png"))
        }
    }
}
#endif
