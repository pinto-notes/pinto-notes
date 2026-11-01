#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import PintoNotes

/// Code blocks at rest and while edited, drawn from a window that is never shown (far off screen,
/// never ordered in) straight into PNGs. Nothing appears on the display.
/// `TEST_RUNNER_PANE_CODE_SHOTS=/path scripts/qa-test.sh PintoNotesTests/CodeBlockShots`
@MainActor @Suite(.serialized) struct CodeBlockShots {
    static let note = """
    Code editing

    A block with a language:

    ```swift
    let greeting = "Hello"
    print(greeting)
    ```

    One line:

    ```swift
    let budget = 600
    ```

    A block without one:

    ```
    npm install
    npm run dev
    ```

    Text after the blocks.

    A block still being typed, not closed yet:

    ```python
    def hello():
        return "hi"
    """

    /// The editor's lines are layers that cacheDisplay skips, so each layout fragment draws itself
    /// into a bitmap, the same call the layer makes.
    static func render(_ tv: NSTextView, dark: Bool) throws -> Data {
        let tlm = try #require(tv.textLayoutManager)
        tlm.ensureLayout(for: tlm.documentRange)
        let size = CGSize(width: tv.bounds.width, height: min(tv.bounds.height, 620))
        let scale: CGFloat = 2
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width * scale), pixelsHigh: Int(size.height * scale), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        rep.size = size
        let ctx = try #require(NSGraphicsContext(bitmapImageRep: rep))
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = ctx
        let cg = ctx.cgContext
        cg.translateBy(x: 0, y: size.height)
        cg.scaleBy(x: 1, y: -1)
        let flipped = NSGraphicsContext(cgContext: cg, flipped: true)
        NSGraphicsContext.current = flipped
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
        guard let dir = ProcessInfo.processInfo.environment["PANE_CODE_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let scenes: [(String, String?)] = [("rest", nil), ("inside", "print(greeting)"), ("openfence", "```swift"), ("closefence", "```\n\nA block without"), ("unclosed", "def hello")]
        for dark in [false, true] {
            let c = try AppSnapshotTests.container()
            let n = c.mainContext.createNote(in: .all, body: Self.note)
            n.updatedAt = .now.addingTimeInterval(600)
            try c.mainContext.save()
            try await AppSnapshotTests.withLastNote(c, "Code editing") {
                let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 1000))
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                let tv = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PintoNotesTextView.self, in: $0) })
                for (name, caret) in scenes where dark ? name == "rest" || name == "inside" : true {
                    let ns = tv.string as NSString
                    if let caret {
                        let r = ns.range(of: caret)
                        tv.setSelectedRange(NSRange(location: r.location + min(2, r.length), length: 0))
                        w.makeFirstResponder(tv)
                    } else {
                        w.makeFirstResponder(nil)
                    }
                    await MacWindowChromeTests.settle(w, 6)
                    try Self.render(tv, dark: dark).write(to: dir.appending(path: "code-\(name)-\(dark ? "dark" : "light").png"))
                }
            }
        }
    }
}
#endif
