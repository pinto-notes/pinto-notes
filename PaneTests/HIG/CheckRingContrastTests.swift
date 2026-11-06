#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// An empty checklist circle is a control: at least 3:1 on white, and clearly there on black
/// (council round 16, `a11-ai-changes-dark`: the rings read faint in dark mode).
@MainActor @Suite struct CheckRingContrastTests {
    static func luminance(_ c: NSColor) -> Double {
        let c = c.usingColorSpace(.sRGB)!
        func ch(_ v: CGFloat) -> Double { let v = Double(v); return v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
        return 0.2126 * ch(c.redComponent) + 0.7152 * ch(c.greenComponent) + 0.0722 * ch(c.blueComponent)
    }
    static func ratio(_ a: Double, _ b: Double) -> Double { (max(a, b) + 0.05) / (min(a, b) + 0.05) }

    @Test func theRingReadsInBothModes() {
        for (name, ground, least) in [(NSAppearance.Name.aqua, 1.0, 3.0), (.darkAqua, 0.0, 5.0)] {
            var ring = 0.0
            NSAppearance(named: name)!.performAsCurrentDrawingAppearance { ring = Self.luminance(PColor.paneCheckRing) }
            let r = Self.ratio(ring, ground)
            #expect(r >= least, "\(name.rawValue): \(r):1")
        }
    }
}
#endif
