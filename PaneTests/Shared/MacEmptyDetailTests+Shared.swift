#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The MacEmptyDetailTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/MacEmptyDetailTests.swift.
@MainActor @Suite(.serialized) struct MacEmptyDetailTests {
    static let size = CGSize(width: 1469, height: 920)

    /// The notes list (the split view's middle column).
    static func list(_ w: NSWindow) throws -> NSTableView {
        try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSTableView.self, in: $0) { $0.numberOfRows > 0 && $0.style != .sourceList && $0.accessibilityLabel() != "Sidebar" } })
    }

    /// The window as drawn, title bar and toolbar included, at 2x.
    /// Off screen the scroll views' backdrops (the sidebar's glass, the soft edge's portal) come
    /// out white over everything under them; they're hidden for the picture.
    static func picture(_ w: NSWindow) throws -> NSBitmapImageRep {
        let frame = try #require(w.contentView?.superview)
        var hidden: [NSView] = []
        func hide(_ v: NSView) {
            let name = String(describing: type(of: v))
            // The window's grey title bar under the toolbar (a hard pocket) is what's looked for: kept.
            if name == "NSHardPocketView" { return }
            if !v.isHidden, ["BackdropView", "PortalView", "PocketMask", "LuminanceAdjustment", "_NSScrollViewContentBackgroundView"].contains(name) { v.isHidden = true; hidden.append(v) }
            v.subviews.forEach(hide)
        }
        hide(frame)
        defer { hidden.forEach { $0.isHidden = false } }
        frame.wantsLayer = true
        let scale: CGFloat = 2
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(frame.bounds.width * scale), pixelsHigh: Int(frame.bounds.height * scale),
                                                bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        let ctx = try #require(NSGraphicsContext(bitmapImageRep: rep))
        ctx.cgContext.scaleBy(x: scale, y: scale)
        frame.layer?.render(in: ctx.cgContext)
        return rep
    }

    /// Nothing selected: the list deselects, as a click on its blank space does.
    static func deselect(_ w: NSWindow) async throws {
        try list(w).deselectAll(nil)
        await MacWindowChromeTests.settle(w, 8)
    }

    /// As `element`, for a window just opened. SwiftUI builds its accessibility tree once an
    /// assistive app asks, a moment later on a busy machine: says one did, and looks for 3 seconds.
    /// (A fixed wait, or a tree left over from the test before, made these pass or fail by order.)
    static func waitForElement(_ id: String, in w: NSWindow) async -> NSObject? {
        let enhanced = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
        NSApp.accessibilitySetValue(true, forAttribute: enhanced)
        defer { NSApp.accessibilitySetValue(false, forAttribute: enhanced) }
        for _ in 0..<30 {
            await MacWindowChromeTests.settle(w, 1)
            if let root = w.contentView, let found = element(id, in: root) { return found }
        }
        return nil
    }

    static func element(_ id: String, in element: Any, depth: Int = 0) -> NSObject? {
        guard depth < 60, let e = element as? NSObject else { return nil }
        if e.responds(to: #selector(NSAccessibilityProtocol.accessibilityIdentifier)), e.value(forKey: "accessibilityIdentifier") as? String == id { return e }
        guard e.responds(to: #selector(NSAccessibilityProtocol.accessibilityChildren)) else { return nil }
        for child in e.value(forKey: "accessibilityChildren") as? [Any] ?? [] {
            if let found = Self.element(id, in: child, depth: depth + 1) { return found }
        }
        return nil
    }
}
#endif
