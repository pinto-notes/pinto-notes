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

    /// Settings in a window of its own as the app makes it (hidden title bar, a unified toolbar),
    /// drawn with the window's buttons, so the gap under them can be looked at.
    private func windowShot(_ view: SettingsView, library: ModelContainer, dark: Bool) async throws -> NSBitmapImageRep {
        let w = NSWindow(contentRect: NSRect(x: -20000, y: -20000, width: SettingsWindow.size.width, height: SettingsWindow.size.height - SettingsWindow.titleBarInset),
                         styleMask: [.titled, .closable, .miniaturizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.titlebarAppearsTransparent = true
        w.titleVisibility = .hidden
        w.toolbar = NSToolbar(identifier: "settings-shot")
        w.toolbarStyle = .unified
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        w.contentViewController = NSHostingController(rootView: view.environment(\.settingsInWindow, true).tint(Color(PColor.paneAccent)).modelContainer(library))
        w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
        defer { w.close() }
        try? await Task.sleep(for: .seconds(1.4))
        let frame = try #require(w.contentView?.superview)
        frame.layoutSubtreeIfNeeded()
        let rep = try #require(frame.bitmapImageRepForCachingDisplay(in: frame.bounds))
        frame.cacheDisplay(in: frame.bounds, to: rep)
        return rep
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
        // A standard account, as most are: Pinto Notes keeps a copy of the key, no recovery key
        // (Emil, 7 November 2026: the recovery key in every picture read as everyone's). One
        // Advanced protection picture of Encryption is drawn on its own, below.
        let crypto = await AddDeviceSnapshots.readyWithCopy()
        defer { crypto.signedOut() }
        let advanced = try await AddDeviceSnapshots.ready(backedUp: true, recoverySaved: true)
        defer { advanced.signedOut() }
        let fixtureCrypto = crypto
        let devices = AddDeviceSnapshots.devices([SecurityPageSnapshots.mac, SecurityPageSnapshots.phone])
        func view(_ place: SettingsPage, connections: [Connection] = SecurityPageSnapshots.ais, backend: Backend? = nil, crypto: AccountCrypto? = nil) -> SettingsView {
            var v = SettingsView(backend: backend ?? fixture.backend, sync: nil, crypto: crypto ?? fixtureCrypto, devices: devices, connections: connections,
                                 route: SettingsRoute(defaults: UserDefaults(suiteName: "settings-a-\(UUID())")!))
            v.start = place
            v.close = {}
            return v
        }
        let pages: [(SettingsPage, String)] = [(.account, "account"), (.ai, "connect"), (.general, "general"), (.appearance, "appearance"),
                                                (.security, "privacy"), (.storage, "storage"), (.help, "help"),
                                                (.personal, "personal"), (.signIn, "signin"), (.encryption, "encryption"),
                                                (.todaysNote, "todays-note"), (.shortcuts, "shortcuts"),
                                                (.aiConnection, "ai-connection"), (.addAI, "add-ai")]
        var rows: [[(String, NSBitmapImageRep)]] = []
        try await AppSnapshotTests.withLastNote(lib, "Trip documents") {
            for (place, name) in pages {
                // The AI's page is named after the AI it shows: the first in the list.
                if place == .aiConnection, let first = AIList.connected(SecurityPageSnapshots.ais).first { AISelection.shared.select(first) }
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
            try save(try await shoot(window(view(.ai, connections: []), library: lib), dark: true), "connect-none-dark", in: dir)
            // Just connected, not used yet: what to ask it, with Copy.
            let fresh = [Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now, last_used_at: nil, revoked_at: nil, redirect_host: "claude.ai")]
            for dark in [false, true] {
                try save(try await shoot(window(view(.ai, connections: fresh), library: lib), dark: dark), "connect-new-\(dark ? "dark" : "light")", in: dir)
            }
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
            for dark in [false, true] {
                try save(try await shoot(window(view(.encryption, crypto: advanced), library: lib), dark: dark), "encryption-advanced-\(dark ? "dark" : "light")", in: dir)
                try save(try await windowShot(view(.general), library: lib, dark: dark), "window-\(dark ? "dark" : "light")", in: dir)
            }
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
                // The rows' hover, drawn on every row at once (a capture has no pointer).
                if ["help", "signin", "account", "connect", "encryption"].contains(name) {
                    let hovered = NSHostingView(rootView: view(place).page(place)
                        .frame(width: size.width, height: size.height).background(SettingsInk.ground)
                        .environment(\.settingsAsPage, true).environment(\.hoverPreview, ["settingsRow"]).tint(Color(PColor.paneAccent)).modelContainer(lib))
                    hovered.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                    let hw = NSWindow(contentRect: CGRect(origin: CGPoint(x: -20000, y: -20000), size: size), styleMask: [.borderless], backing: .buffered, defer: false)
                    hw.isReleasedWhenClosed = false
                    hw.contentView = hovered
                    hovered.frame = CGRect(origin: .zero, size: size)
                    try? await Task.sleep(for: .seconds(1.2))
                    hovered.layoutSubtreeIfNeeded()
                    let hrep = try #require(hovered.bitmapImageRepForCachingDisplay(in: hovered.bounds))
                    hovered.cacheDisplay(in: hovered.bounds, to: hrep)
                    try save(hrep, "\(name)-hover-\(dark ? "dark" : "light")", in: dir)
                    hw.close()
                }
            }
        }
        try ThemeShots.sheet("Settings, four pages", rows: rows, scale: 0.5).write(to: dir.appending(path: "sheet.png"))
    }

    private func scrollViews(in view: NSView) -> [NSScrollView] {
        view.subviews.flatMap { sub -> [NSScrollView] in (sub as? NSScrollView).map { [$0] } ?? [] + scrollViews(in: sub) }
    }

    private func draw(_ view: NSView) throws -> NSBitmapImageRep {
        view.layoutSubtreeIfNeeded()
        let rep = try #require(view.bitmapImageRepForCachingDisplay(in: view.bounds))
        view.cacheDisplay(in: view.bounds, to: rep)
        return rep
    }

    @Test func aScrolledPageNeverDrawsOverTheTitle() async throws {
        let lib = try SidebarStudySnapshots.library()
        let fixture = try await AppSnapshotTests.settingsFixture()
        let crypto = await AddDeviceSnapshots.readyWithCopy()
        defer { crypto.signedOut() }
        var v = SettingsView(backend: fixture.backend, sync: nil, crypto: crypto, devices: AddDeviceSnapshots.devices([]), connections: [],
                             route: SettingsRoute(defaults: UserDefaults(suiteName: "settings-scroll-\(UUID())")!))
        v.start = .appearance
        v.close = {}
        let size = CGSize(width: SettingsWindow.size.width, height: 420) // short, so Appearance has to scroll
        let w = NSWindow(contentRect: NSRect(origin: CGPoint(x: -20000, y: -20000), size: size),
                         styleMask: [.titled, .closable, .fullSizeContentView], backing: .buffered, defer: false)
        w.titlebarAppearsTransparent = true
        w.titleVisibility = .hidden
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: .darkAqua)
        w.contentViewController = NSHostingController(rootView: v.environment(\.settingsInWindow, true).modelContainer(lib))
        w.setContentSize(size)
        w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
        defer { w.close() }
        try? await Task.sleep(for: .seconds(1.4))
        let content = try #require(w.contentView)
        let before = try draw(content)

        let page = try #require(scrollViews(in: content).max { ($0.documentView?.frame.height ?? 0) < ($1.documentView?.frame.height ?? 0) })
        let doc = try #require(page.documentView)
        #expect(doc.frame.height > page.contentView.bounds.height + 100, "Appearance should be taller than the short window")
        page.contentView.scroll(to: NSPoint(x: 0, y: doc.isFlipped ? 220 : doc.frame.height - page.contentView.bounds.height - 220))
        page.reflectScrolledClipView(page.contentView)
        try? await Task.sleep(for: .seconds(0.5))
        let after = try draw(content)

        // The header band right of the sidebar: the arrows and the page title.
        let scale = CGFloat(before.pixelsWide) / content.bounds.width
        var changed = 0, total = 0
        for y in stride(from: 0, to: Int(44 * scale), by: 2) {
            for x in stride(from: Int((SettingsCard.sidebarWidth + 8) * scale), to: before.pixelsWide - 4, by: 3) {
                total += 1
                guard let a = before.colorAt(x: x, y: y), let b = after.colorAt(x: x, y: y) else { continue }
                if abs(a.redComponent - b.redComponent) + abs(a.greenComponent - b.greenComponent) + abs(a.blueComponent - b.blueComponent) > 0.06 { changed += 1 }
            }
        }
        #expect(changed == 0, "\(changed) of \(total) header pixels changed when the page scrolled")

        // And it lies under the arrows for clicks too: the page's scroll view used to reach over
        // them, so Back and Forward took no clicks (Emil, 8 November 2026: "I cant click").
        let y = content.isFlipped ? SettingsWindow.headerTop + 14 : content.bounds.height - SettingsWindow.headerTop - 14
        for x in stride(from: SettingsCard.sidebarWidth + 10, to: SettingsCard.sidebarWidth + 160, by: 10) {
            var hit = content.hitTest(content.convert(NSPoint(x: x, y: y), to: content.superview))
            var inPage = false
            while let v = hit { if v is NSScrollView { inPage = true }; hit = v.superview }
            #expect(!inPage, "a click at x \(x) on the header lands in the page's scroll view")
        }
    }

}
#endif
