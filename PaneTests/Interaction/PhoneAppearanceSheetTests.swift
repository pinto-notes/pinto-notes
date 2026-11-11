import Foundation
import SwiftUI
import Testing
#if os(iOS)
import UIKit
#else
import AppKit
#endif
@testable import Pane

/// iPhone 1.3 (Emil, 11 November 2026): picking a theme on Appearance restyled the app behind the
/// sheet, and not all of the sheet: the font menu's arrows kept the old accent until it opened again.
@MainActor @Suite(.serialized) struct PhoneAppearanceSheetTests {
    #if os(macOS)
    /// The Mac's Appearance page takes a pick at once too: drawn just after picking Forest, it is the
    /// page a fresh open draws in Forest.
    @Test func theMacPageRestylesOnAPick() async throws {
        let before = ThemeStore.shared.theme
        defer { ThemeStore.shared.theme = before }
        ThemeStore.shared.theme = .standard
        let live = Self.host()
        _ = try await Self.draw(live)
        let standard = try await Self.draw(live)
        ThemeStore.shared.theme = .forest
        let picked = try await Self.draw(live)
        let forest = try await Self.draw(Self.host())
        let changed = Self.differing(standard, forest)
        #expect(changed > 200, "Default and Forest draw the page alike (\(changed) pixels apart)")
        let stale = Self.differing(picked, forest)
        #expect(stale < 8, "\(stale) pixels of the open page still in Default after picking Forest")
    }

    static func host() -> NSHostingView<some View> {
        let host = NSHostingView(rootView: AppearanceSettingsPage().followsTheme().environment(\.controlActiveState, .key))
        host.appearance = NSAppearance(named: .aqua)
        host.frame = CGRect(x: 0, y: 0, width: 640, height: 1100)
        return host
    }

    static func draw(_ host: NSView) async throws -> [UInt8] {
        host.layoutSubtreeIfNeeded()
        try await Task.sleep(for: .milliseconds(600))
        host.layoutSubtreeIfNeeded()
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(host.bounds.width), pixelsHigh: Int(host.bounds.height),
                                                bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                                                colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 32))
        rep.size = host.bounds.size
        host.cacheDisplay(in: host.bounds, to: rep)
        return Array(UnsafeBufferPointer(start: rep.bitmapData, count: rep.bytesPerRow * rep.pixelsHigh))
    }
    #endif

    /// Pixels whose colour differs by more than a little.
    static func differing(_ a: [UInt8], _ b: [UInt8]) -> Int {
        guard a.count == b.count else { return Int.max }
        var n = 0
        for i in stride(from: 0, to: a.count, by: 4) {
            let d = abs(Int(a[i]) - Int(b[i])) + abs(Int(a[i + 1]) - Int(b[i + 1])) + abs(Int(a[i + 2]) - Int(b[i + 2]))
            if d > 24 { n += 1 }
        }
        return n
    }

    #if os(iOS)
    /// The folders' screen as the app builds it: it isn't worked out again when the theme changes
    /// (`SidebarView` is `.equatable()`), and Settings is a sheet from it.
    struct Presenter: View, Equatable {
        let route: SettingsRoute
        nonisolated static func == (a: Presenter, b: Presenter) -> Bool { true }
        var body: some View {
            Color.clear.sheet(isPresented: .constant(true)) {
                SettingsView(backend: Backend(), sync: nil, route: route)
            }
        }
    }

    /// A pick restyles the open sheet at once: drawn just after the pick, it is the sheet a fresh
    /// open draws in that theme.
    @Test func theSheetRestylesOnAPick() async throws {
        let before = ThemeStore.shared.theme
        defer { ThemeStore.shared.theme = before }
        ThemeStore.shared.theme = .standard

        let live = try await Self.window()
        defer { live.isHidden = true }
        let standard = try Self.draw(live)
        ThemeStore.shared.theme = .forest
        try? await Task.sleep(for: .milliseconds(800))
        let picked = try Self.draw(live)

        let fresh = try await Self.window()
        defer { fresh.isHidden = true }
        let forest = try Self.draw(fresh)

        let changed = Self.differing(standard, forest)
        #expect(changed > 200, "Default and Forest draw the sheet alike (\(changed) pixels apart)")
        let stale = Self.differing(picked, forest)
        // 51 before: the font menu's arrows stayed amber beside its green "Default".
        #expect(stale < 8, "\(stale) pixels of the open sheet still in Default after picking Forest")
    }

    static func window() async throws -> UIWindow {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        // Tall enough for the whole page, the font row at its foot too.
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 1400)
        window.overrideUserInterfaceStyle = .light
        // Settings opens at Appearance, as a pick from its list leaves it.
        let route = SettingsRoute(defaults: TestDefaults())
        route.target = .appearance
        window.rootViewController = UIHostingController(rootView: Presenter(route: route).equatable().followsTheme())
        window.makeKeyAndVisible()
        try? await Task.sleep(for: .seconds(1.5))
        return window
    }

    /// The window, sheet and all, at 1 pt a pixel: RGBA bytes.
    static func draw(_ window: UIWindow) throws -> [UInt8] {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let image = try #require(UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }.cgImage)
        let w = image.width, h = image.height
        var data = [UInt8](repeating: 0, count: w * h * 4)
        let ctx = CGContext(data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
        return data
    }

    #endif
}
