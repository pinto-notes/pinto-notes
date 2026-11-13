#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The ThemeShots suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/ThemeShots.swift.
@MainActor @Suite(.serialized) struct ThemeShots {
    /// A SwiftUI view drawn alone in a borderless window far off screen (MacLookSnapshots' way:
    /// the split view's columns don't draw their rows through the window's cacheDisplay).
    static func host(_ view: some View, size: CGSize, dark: Bool, wait: Double = 1.0, layers: Bool = false) async throws -> NSBitmapImageRep {
        let host = NSHostingView(rootView: view.frame(width: size.width, height: size.height).background(Color(nsColor: .windowBackgroundColor)))
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let w = NSWindow(contentRect: CGRect(origin: CGPoint(x: -20000, y: -20000), size: size), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(wait))
        host.layoutSubtreeIfNeeded()
        host.displayIfNeeded()
        if layers, let table = MacWindowChromeTests.find(NSTableView.self, in: host) {
            // The list: its ground, then each row as it draws itself (offscreen, the scroll view's
            // edge effect paints over the rows in a whole-view capture).
            let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width * 2), pixelsHigh: Int(size.height * 2), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
            rep.size = size
            let saved = NSGraphicsContext.current
            NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
            defer { NSGraphicsContext.current = saved }
            host.effectiveAppearance.performAsCurrentDrawingAppearance {
                Palette.listGround.setFill()
                CGRect(origin: .zero, size: size).fill()
            }
            // The cells only: offscreen, a row view lays a white background of its own under them.
            for row in table.subviews where !row.isHidden && row.frame.height > 0 {
                for cell in row.subviews.filter({ !String(describing: type(of: $0)).contains("Separator") }).flatMap({ $0.subviews.isEmpty ? [$0] : $0.subviews }) {
                    let r = cell.convert(cell.bounds, to: host)
                    guard let layer = cell.layer else { continue }
                    let y = host.isFlipped ? size.height - r.maxY : r.minY
                    let cg = NSGraphicsContext.current!.cgContext
                    cg.saveGState()
                    cg.translateBy(x: r.minX, y: y + r.height)
                    cg.scaleBy(x: 1, y: -1)
                    layer.render(in: cg)
                    cg.restoreGState()
                }
            }
            return rep
        }
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        return rep
    }
}
#endif
