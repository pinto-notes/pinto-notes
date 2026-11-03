#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Settings on the Mac as built (direction A of the 3 November 2026 study): every page over the
/// notes window, light and dark, then a contact sheet of them. Windows far off screen, never
/// ordered in.
/// `TEST_RUNNER_PANE_SETTINGS_SHOTS=/path LIMIT=900 scripts/qa-test.sh PaneTests/SettingsShots`
@MainActor @Suite(.serialized) struct SettingsShots {
    static let size = CGSize(width: 1180, height: 760)
    static var dir: URL? { ProcessInfo.processInfo.environment["PANE_SETTINGS_SHOTS"].map { URL(fileURLWithPath: $0) } }

    /// The real notes window behind, as SidebarStudySnapshots draws it.
    private func window(_ over: some View, library: ModelContainer) -> some View {
        ZStack(alignment: .topLeading) {
            Color(nsColor: .windowBackgroundColor)
            RootView().allowsHitTesting(false)
            NavigationStack { SidebarView(scope: .constant(.all), onNewNote: {}) }
                .overlay(alignment: .bottomLeading) { SidebarStudySnapshots.foot }
                .frame(width: 259, height: Self.size.height - 16)
                .background(Color(nsColor: .windowBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .padding(8)
            over
        }
        .environment(\.sidebarStudy, SidebarStudy())
        .environment(\.controlActiveState, .key)
        .tint(Color(PColor.paneAccent))
        .modelContainer(library)
    }

    private func shoot(_ view: some View, dark: Bool, wait: Double = 1.4) async throws -> NSBitmapImageRep {
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
        (dark ? NSColor(white: 0.04, alpha: 1) : NSColor(white: 0.82, alpha: 1)).setFill()
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
        defer {
            ProfileStore.shared.showForPreview(name: nil, photo: nil)
            ThemeStore.shared.set(kept, persist: false)
        }
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        let fixture = try await AppSnapshotTests.settingsFixture()
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        let crypto = try await AddDeviceSnapshots.ready(backedUp: true, recoverySaved: true)
        defer { crypto.signedOut() }
        let devices = AddDeviceSnapshots.devices([SecurityPageSnapshots.mac, SecurityPageSnapshots.phone])
        func view(_ place: SettingsPlace, connections: [Connection] = SecurityPageSnapshots.ais, backend: Backend? = nil) -> SettingsView {
            var v = SettingsView(backend: backend ?? fixture.backend, sync: nil, crypto: crypto, devices: devices, connections: connections,
                                 route: SettingsRoute(defaults: UserDefaults(suiteName: "settings-a-\(UUID())")!))
            v.start = place
            v.close = {}
            return v
        }
        let pages: [(SettingsPlace, String)] = [(.account, "account"), (.ai, "connect"), (.appearance, "appearance"),
                                                 (.security, "security"), (.storage, "storage"), (.help, "help")]
        var rows: [[(String, NSBitmapImageRep)]] = []
        try await AppSnapshotTests.withLastNote(lib, "Trip documents") {
            for (place, name) in pages {
                var row: [(String, NSBitmapImageRep)] = []
                for dark in [false, true] {
                    let rep = try await shoot(window(view(place), library: lib), dark: dark)
                    try save(rep, "\(name)-\(dark ? "dark" : "light")", in: dir)
                    row.append(("\(place.title), \(dark ? "dark" : "light")", rep))
                }
                rows.append(row)
            }
            // Before any AI is connected, and signed out.
            let none = try await shoot(window(view(.ai, connections: []), library: lib), dark: false)
            try save(none, "connect-none-light", in: dir)
            let out = try await shoot(window(view(.account, backend: Backend()), library: lib), dark: false)
            try save(out, "account-signed-out-light", in: dir)
            rows.append([("Connect an AI, nothing connected", none), ("Account, signed out", out)])
        }
        // Each page whole, as it scrolls, so nothing under the card's edge goes unseen.
        for (place, name) in pages {
            for dark in [false, true] {
                let host = NSHostingView(rootView: view(place).place(place)
                    .padding(20).frame(width: SettingsCard.pageWidth).background(SettingsInk.ground)
                    .environment(\.settingsAsPage, true).tint(Color(PColor.paneAccent)).modelContainer(lib))
                host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: SettingsCard.pageWidth, height: 1600), styleMask: [.borderless], backing: .buffered, defer: false)
                w.isReleasedWhenClosed = false
                w.contentView = host
                host.frame = CGRect(origin: .zero, size: host.fittingSize)
                w.setContentSize(host.fittingSize)
                try? await Task.sleep(for: .seconds(1.2))
                host.layoutSubtreeIfNeeded()
                host.frame = CGRect(origin: .zero, size: host.fittingSize)
                let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
                host.cacheDisplay(in: host.bounds, to: rep)
                try save(rep, "\(name)-full-\(dark ? "dark" : "light")", in: dir)
                w.close()
            }
        }
        try ThemeShots.sheet("Settings, direction A as built", rows: rows, scale: 0.5).write(to: dir.appending(path: "sheet.png"))
    }
}
#endif
