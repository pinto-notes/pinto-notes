#if os(macOS)
import AppKit
import Supabase
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The AppSnapshotTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/AppSnapshotTests.swift.
@MainActor @Suite(.serialized) struct AppSnapshotTests {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    /// Shots that need a real window on screen (a toolbar, a key window, a capture by window id)
    /// run only where nobody is using the screen: with AMBER_DEMO_FRAMES set, which only CI's
    /// snapshots workflow sets (WarmGreySnapshots.dir). Everywhere else every test window is
    /// borderless, at -20000,-20000, and never ordered front or made key.
    static var onScreenAllowed: Bool { WarmGreySnapshots.dir != nil }

    /// `variable`'s path, for a shot that needs an on-screen window: nil unless on-screen shots run.
    static func onScreenDir(_ variable: String) -> URL? {
        guard onScreenAllowed else { return nil }
        return ProcessInfo.processInfo.environment[variable].map { URL(fileURLWithPath: $0) }
    }

    /// A demo library in memory.
    static func container() throws -> ModelContainer {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: true)
        try? c.mainContext.save()
        return c
    }

    /// Draws `view` at `size` and writes `name`.png. The window is borderless, far off every
    /// screen (-20000, -20000) and never ordered front or made key: a titled window placed off
    /// screen gets pulled back onto the display, where it showed up on a developer's Mac.
    /// No window chrome is drawn. `card`: edge to edge, as the signed-out window shows it.
    /// `toolbar` is kept for the callers; nothing draws a toolbar any more.
    static func shoot(_ view: some View, name: String, size: CGSize, dark: Bool, toolbar: Bool = true, card: Bool = false, wait: Double = 0.8) async throws {
        guard let dir else { return }
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                              styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let host = NSHostingView(rootView: AnyView(card ? AnyView(view.ignoresSafeArea()) : AnyView(view)))
        host.appearance = window.appearance
        host.frame = CGRect(origin: .zero, size: size)
        window.contentView = host
        try? await Task.sleep(for: .seconds(wait))
        defer { window.close() }
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "\(name).png"))
    }

    /// Draws a view in a bare hosting view at its fitting size (forms and sheets).
    static func render(_ view: some View, name: String, dark: Bool, wait: Double = 0.5) async throws {
        guard let dir else { return }
        let host = NSHostingView(rootView: view.background(Color(nsColor: .windowBackgroundColor)))
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 600, height: 900), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        host.frame = CGRect(origin: .zero, size: host.fittingSize)
        window.setContentSize(host.fittingSize)
        try? await Task.sleep(for: .seconds(wait))
        defer { window.close() }
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "\(name).png"))
    }

    /// Opens `title` (via the remembered-note key), restoring the user's own value afterwards.
    static func withLastNote<T>(_ c: ModelContainer, _ title: String, _ body: () async throws -> T) async rethrows -> T {
        let d = UserDefaults.standard
        let keepNote = d.object(forKey: "lastNote"), keepScope = d.object(forKey: "lastScope")
        defer {
            if let keepNote { d.set(keepNote, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let keepScope { d.set(keepScope, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        d.removeObject(forKey: "lastScope")
        let notes = (try? c.mainContext.fetch(FetchDescriptor<Note>())) ?? []
        if let n = notes.first(where: { $0.title == title }) { d.set(n.id.uuidString, forKey: "lastNote") }
        return try await body()
    }

    /// Settings as a signed-in account with everything filled in: a name, two AIs connected, a
    /// key kept on two other devices, and 1.15 GB used.
    static func settingsFixture() async throws -> SettingsView {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        StorageStore.shared.usage = StorageUsage(used: 1_240_000_000, limit: 2_147_483_648, notes: 41_000_000, files: 900_000_000, apps: 12_000_000,
                                                 deleted: 230_000_000, versions: 64_000_000)
        let crypto = try await AddDeviceSnapshots.ready(backedUp: true, recoverySaved: true)
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "settings-shots-\(UUID())")!)
        return SettingsView(backend: backend, sync: nil, crypto: crypto, devices: AddDeviceSnapshots.devices([AddDeviceSnapshots.added, AddDeviceSnapshots.stale]),
                            connections: CaptureScreen.connections, route: route)
    }

    /// The Settings window at `tab`, drawn the way the Settings scene draws it: toolbar tabs with
    /// a symbol and a title, the window as tall as the page.
    static func settingsWindow(_ view: SettingsView, tab: SettingsPage, dark: Bool) -> NSWindow {
        let tabs = NSTabViewController()
        tabs.tabStyle = .toolbar
        for t in view.pages {
            let page = NSHostingController(rootView: view.page(t).tint(Color(PColor.paneAccent)))
            page.sizingOptions = .preferredContentSize
            page.title = t.title
            let item = NSTabViewItem(viewController: page)
            item.label = t.title
            item.image = NSImage(systemSymbolName: t.symbol, accessibilityDescription: nil)
            tabs.addTabViewItem(item)
        }
        tabs.selectedTabViewItemIndex = view.pages.firstIndex(of: tab) ?? 0
        let window = NSWindow(contentViewController: tabs)
        window.styleMask = [.titled, .closable]
        window.toolbarStyle = .preference
        window.isReleasedWhenClosed = false
        window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        window.setFrameOrigin(CGPoint(x: -30000, y: -30000))
        return window
    }
}
#endif
