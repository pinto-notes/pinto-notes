#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The `/` menu open under the caret, unfiltered and filtered, light and dark, drawn from a window
/// that is never shown (far off screen) straight into PNGs.
/// `TEST_RUNNER_PANE_SLASH_SHOTS=/path scripts/qa-test.sh PaneTests/SlashMenuShots`
@MainActor @Suite(.serialized) struct SlashMenuShots {
    static let note = """
    Week plan

    Dentist at ten, then lunch with Sara.

    - [ ] Send the invoice
    - [ ] Book flights to Lisbon

    """

    /// The text's layout fragments (layers cacheDisplay skips), then the views laid over the text
    /// (the menu) at their frames.
    static func render(_ tv: NSTextView, dark: Bool, height: CGFloat) throws -> Data {
        let tlm = try #require(tv.textLayoutManager)
        tlm.ensureLayout(for: tlm.documentRange)
        let size = CGSize(width: tv.bounds.width, height: height)
        let scale: CGFloat = 2
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width * scale), pixelsHigh: Int(size.height * scale), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        rep.size = size
        let ctx = try #require(NSGraphicsContext(bitmapImageRep: rep))
        let saved = NSGraphicsContext.current
        let cg = ctx.cgContext
        cg.translateBy(x: 0, y: size.height)
        cg.scaleBy(x: 1, y: -1)
        NSGraphicsContext.current = NSGraphicsContext(cgContext: cg, flipped: true)
        let appearance = NSAppearance(named: dark ? .darkAqua : .aqua)!
        appearance.performAsCurrentDrawingAppearance {
            (dark ? NSColor.black : NSColor.white).setFill()
            CGRect(origin: .zero, size: size).fill()
            let origin = tv.textContainerOrigin
            tlm.enumerateTextLayoutFragments(from: tlm.documentRange.location, options: [.ensuresLayout]) { f in
                let o = CGPoint(x: origin.x + f.layoutFragmentFrame.minX, y: origin.y + f.layoutFragmentFrame.minY)
                if o.y > size.height { return false }
                f.draw(at: o, in: cg)
                return true
            }
            for v in tv.subviews where v is NSHostingView<SlashCommandList> {
                v.layoutSubtreeIfNeeded()
                guard let sub = v.bitmapImageRepForCachingDisplay(in: v.bounds) else { continue }
                v.cacheDisplay(in: v.bounds, to: sub)
                guard let image = sub.cgImage else { continue }
                cg.saveGState()
                // The bitmap is upright; the context is flipped.
                cg.translateBy(x: v.frame.minX, y: v.frame.maxY)
                cg.scaleBy(x: 1, y: -1)
                cg.draw(image, in: CGRect(origin: .zero, size: v.frame.size))
                cg.restoreGState()
            }
        }
        NSGraphicsContext.current = saved
        return try #require(rep.representation(using: .png, properties: [:]))
    }

    @Test func states() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_SLASH_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            let mode = dark ? "dark" : "light"
            for (name, typed, height) in [("open", "/", 600.0), ("filtered", "/ch", 360.0), ("lists", "/li", 400.0)] {
                let h = await EditorHarness(Self.note, width: 720, height: 900, dark: dark)
                defer { h.close() }
                await h.select((h.text as NSString).length)
                await h.type(typed)
                // In the list of lists, the arrow has moved the choice down one.
                if name == "lists" { await h.press(EditorHarness.down) }
                await h.settle(0.3)
                #expect(!h.controller.slashCommands.isEmpty)
                try Self.render(h.view, dark: dark, height: height).write(to: dir.appending(path: "slash-\(name)-\(mode).png"))
            }
        }
    }
}
#endif
