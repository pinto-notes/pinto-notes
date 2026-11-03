#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Callouts and highlights at rest, with the caret inside a callout, and after Format › Callout,
/// drawn from a window that is never shown (far off screen, never ordered in) straight into PNGs.
/// `TEST_RUNNER_PANE_CALLOUT_SHOTS=/path scripts/qa-test.sh PaneTests/CalloutShots`
@MainActor @Suite(.serialized) struct CalloutShots {
    static let note = """
    Lisbon trip

    We land at ==10:40 on Friday==, and the flat is two streets from the river.

    > [!warning] Check the passport
    > It expires in March. Renew it ==before we book anything else==.

    > [!tip]
    > Pack light: the flat has a washing machine.

    ## Days

    - [ ] Alfama and the castle
    - [ ] Belém, and pastéis at the old bakery

    > [!info] Tram 28
    > It gets packed after ten. Go early, or walk.

    > [!success] Booked
    > Dinner at the taberna on Saturday at eight.

    > [!danger] Pickpockets
    > Keep phones in a front pocket on the tram.

    > [!question] Day trip to Sintra?
    > Ask Sara if she wants to come.

    > [!example]
    > Coffee, one museum, a long lunch, the sunset at a miradouro.

    > [!quote] Fernando Pessoa
    > Life is what we make of it. Travel is the traveller.
    """

    /// The text view as drawn, up to `maxHeight` points tall (CodeBlockShots.render stops at 620).
    static func render(_ tv: NSTextView, dark: Bool, maxHeight: CGFloat = 1000) throws -> Data {
        let tlm = try #require(tv.textLayoutManager)
        tlm.ensureLayout(for: tlm.documentRange)
        var bottom: CGFloat = 0
        tlm.enumerateTextLayoutFragments(from: tlm.documentRange.location, options: [.ensuresLayout]) { f in
            bottom = max(bottom, f.layoutFragmentFrame.maxY)
            return true
        }
        let size = CGSize(width: tv.bounds.width, height: min(maxHeight, bottom + tv.textContainerOrigin.y + 30))
        let scale: CGFloat = 2
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width * scale), pixelsHigh: Int(size.height * scale), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        rep.size = size
        let ctx = try #require(NSGraphicsContext(bitmapImageRep: rep))
        let saved = NSGraphicsContext.current
        let cg = ctx.cgContext
        cg.translateBy(x: 0, y: size.height)
        cg.scaleBy(x: 1, y: -1)
        NSGraphicsContext.current = NSGraphicsContext(cgContext: cg, flipped: true)
        (tv.appearance ?? NSAppearance(named: dark ? .darkAqua : .aqua))!.performAsCurrentDrawingAppearance {
            (dark ? NSColor.black : NSColor.white).setFill()
            CGRect(origin: .zero, size: size).fill()
            let origin = tv.textContainerOrigin
            tlm.enumerateTextLayoutFragments(from: tlm.documentRange.location, options: [.ensuresLayout]) { f in
                let o = CGPoint(x: origin.x + f.layoutFragmentFrame.minX, y: origin.y + f.layoutFragmentFrame.minY)
                if o.y > size.height { return false }
                f.draw(at: o, in: cg)
                return true
            }
        }
        NSGraphicsContext.current = saved
        return try #require(rep.representation(using: .png, properties: [:]))
    }

    @Test func states() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_CALLOUT_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            let c = try AppSnapshotTests.container()
            let n = c.mainContext.createNote(in: .all, body: Self.note)
            n.updatedAt = .now.addingTimeInterval(600)
            try c.mainContext.save()
            try await AppSnapshotTests.withLastNote(c, "Lisbon trip") {
                let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 1200))
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                let tv = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
                let mode = dark ? "dark" : "light"
                w.makeFirstResponder(nil)
                await MacWindowChromeTests.settle(w, 6)
                try Self.render(tv, dark: dark).write(to: dir.appending(path: "callouts-rest-\(mode).png"))
                // The caret in a callout's title: its `> [!warning]` shows, dimmed, to edit.
                let title = (tv.string as NSString).range(of: "Check the passport")
                tv.setSelectedRange(NSRange(location: title.location + 6, length: 0))
                w.makeFirstResponder(tv)
                await MacWindowChromeTests.settle(w, 6)
                try Self.render(tv, dark: dark).write(to: dir.appending(path: "callouts-caret-title-\(mode).png"))
                // The caret in a body line with a highlight: its `> ` and `==` show.
                let body = (tv.string as NSString).range(of: "Renew it")
                tv.setSelectedRange(NSRange(location: body.location + 3, length: 0))
                await MacWindowChromeTests.settle(w, 6)
                try Self.render(tv, dark: dark).write(to: dir.appending(path: "callouts-caret-body-\(mode).png"))
                guard !dark else { return }
                // Format › Callout on a plain line, then Format › Highlight on a word.
                let line = (tv.string as NSString).range(of: "We land at")
                tv.setSelectedRange(NSRange(location: line.location + 3, length: 0))
                tv.controller?.insertCallout()
                let flat = (tv.string as NSString).range(of: "flat")
                tv.setSelectedRange(NSRange(location: flat.location + 1, length: 0))
                tv.controller?.highlight()
                w.makeFirstResponder(nil)
                await MacWindowChromeTests.settle(w, 6)
                try Self.render(tv, dark: false).write(to: dir.appending(path: "callouts-inserted-light.png"))
            }
        }
    }
}
#endif
