#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The VersionHistorySnapshots suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/VersionHistorySnapshots.swift.
@MainActor @Suite(.serialized) struct VersionHistorySnapshots {
    /// Draws `view` in an offscreen window and writes a PNG at twice its size.
    static func shoot(_ view: some View, to url: URL, size: CGSize, dark: Bool) async throws {
        // Drawn as the key window's sheet would be: its default button in the accent colour.
        let host = NSHostingView(rootView: view.environment(\.controlActiveState, .key))
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                              styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.appearance = host.appearance
        window.contentView = host
        host.frame = CGRect(origin: .zero, size: size)
        // Never ordered front: drawn offscreen with cacheDisplay (AppSnapshotTests.onScreenAllowed).
        try? await Task.sleep(for: .seconds(0.8))
        defer { window.close() }
        host.layoutSubtreeIfNeeded()
        let bounds = host.bounds
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(bounds.width * 2), pixelsHigh: Int(bounds.height * 2),
                                                bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                                                colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        rep.size = bounds.size
        host.appearance!.performAsCurrentDrawingAppearance { host.cacheDisplay(in: bounds, to: rep) }
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try #require(rep.representation(using: .png, properties: [:])).write(to: url)
    }
}
#endif
