#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Settings on the Mac as built (7 November 2026, iPhone's list: Account, AI Connections, General,
/// Appearance, Privacy, Storage, Help and feedback): every page over the notes window, light and dark, then a contact sheet. Windows far off screen, never
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
        func view(_ place: SettingsPage, connections: [Connection] = SecurityPageSnapshots.ais, backend: Backend? = nil) -> SettingsView {
            var v = SettingsView(backend: backend ?? fixture.backend, sync: nil, crypto: crypto, devices: devices, connections: connections,
                                 route: SettingsRoute(defaults: UserDefaults(suiteName: "settings-a-\(UUID())")!))
            v.start = place
            v.close = {}
            return v
        }
        let pages: [(SettingsPage, String)] = [(.account, "account"), (.ai, "connect"), (.general, "general"), (.appearance, "appearance"),
                                                (.security, "privacy"), (.storage, "storage"), (.help, "help"),
                                                (.personal, "personal"), (.signIn, "signin"), (.encryption, "encryption")]
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
            // Connect an AI, a card per AI (7 November 2026): two ChatGPT accounts, Claude, an app on this Mac.
            if ProcessInfo.processInfo.environment["PANE_CONNECT_LOOKS"] != nil {
                let more = SecurityPageSnapshots.ais + [
                    Connection(id: UUID(), name: "ChatGPT", kind: "oauth", created_at: .now.addingTimeInterval(-86400 * 9), last_used_at: .now.addingTimeInterval(-86400 * 3), revoked_at: nil, redirect_host: "chatgpt.com"),
                    Connection(id: UUID(), name: "Cursor", kind: "oauth", created_at: .now.addingTimeInterval(-86400 * 2), last_used_at: nil, revoked_at: nil, redirect_host: "localhost")]
                for dark in [true, false] {
                    try save(try await shoot(window(view(.ai, connections: more), library: lib), dark: dark), "connect-cards-\(dark ? "dark" : "light")", in: dir)
                }
                return
            }
            // Before any AI is connected, signed out, and nearly full.
            let none = try await shoot(window(view(.ai, connections: []), library: lib), dark: false)
            try save(none, "connect-none-light", in: dir)
            let out = try await shoot(window(view(.account, backend: Backend()), library: lib), dark: false)
            try save(out, "account-signed-out-light", in: dir)
            rows.append([("Connect an AI, nothing connected", none), ("Account, signed out", out)])
            let privacyOut = try await shoot(window(view(.security, backend: Backend()), library: lib), dark: true)
            try save(privacyOut, "privacy-signed-out-dark", in: dir)
            let kept = StorageStore.shared.usage
            let g: Int64 = 1_073_741_824
            StorageStore.shared.usage = StorageUsage(used: 2 * g - g / 10, limit: 2 * g, notes: 41_000_000, files: g, apps: 0, deleted: 400_000_000, versions: 60_000_000)
            let full = try await shoot(window(view(.account), library: lib), dark: false)
            StorageStore.shared.usage = kept
            try save(full, "account-almost-full-light", in: dir)
            rows.append([("Privacy and security, signed out", privacyOut), ("Account, almost full", full)])
        }
        // Each page whole, as it scrolls, so nothing under the card's edge goes unseen.
        for (place, name) in pages {
            for dark in [false, true] {
                // A form scrolls, so it is drawn in a window as tall as any page is.
                let size = CGSize(width: SettingsCard.pageWidth, height: 1300)
                let host = NSHostingView(rootView: view(place).page(place)
                    .frame(width: size.width, height: size.height).background(SettingsInk.ground)
                    .environment(\.settingsAsPage, true).tint(Color(PColor.paneAccent)).modelContainer(lib))
                host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                let w = NSWindow(contentRect: CGRect(origin: CGPoint(x: -20000, y: -20000), size: size), styleMask: [.borderless], backing: .buffered, defer: false)
                w.isReleasedWhenClosed = false
                w.contentView = host
                host.frame = CGRect(origin: .zero, size: size)
                try? await Task.sleep(for: .seconds(1.2))
                host.layoutSubtreeIfNeeded()
                let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
                host.cacheDisplay(in: host.bounds, to: rep)
                try save(rep, "\(name)-full-\(dark ? "dark" : "light")", in: dir)
                w.close()
            }
        }
        try ThemeShots.sheet("Settings, four pages", rows: rows, scale: 0.5).write(to: dir.appending(path: "sheet.png"))
    }
}
#endif
