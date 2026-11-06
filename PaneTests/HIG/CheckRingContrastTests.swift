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

    /// The ring's line never goes hairline-thin on the Mac: at 0.75 pt it read faint at any colour.
    @Test func theRingIsAtLeastOnePointThick() {
        #expect(EditorMetrics.checkStroke >= 1)
    }
}
#else
import Testing
import UIKit
@testable import Pane

/// An empty checklist circle on iPhone and iPad: at least 3:1 on white and on black (the iPad pass,
/// 3 November 2026: the rings read 1.97:1 and 2.6:1).
@MainActor @Suite struct CheckRingContrastTests {
    static func luminance(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat) -> Double {
        func ch(_ v: CGFloat) -> Double { let v = Double(v); return v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
        return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
    }

    @Test func theRingReadsInBothModes() {
        for (style, ground) in [(UIUserInterfaceStyle.light, CGFloat(1)), (.dark, CGFloat(0))] {
            var (r, g, b, a) = (CGFloat(0), CGFloat(0), CGFloat(0), CGFloat(0))
            PColor.paneCheckRing.resolvedColor(with: UITraitCollection(userInterfaceStyle: style)).getRed(&r, green: &g, blue: &b, alpha: &a)
            let over = { (c: CGFloat) in a * c + (1 - a) * ground }
            let ring = Self.luminance(over(r), over(g), over(b)), back = Self.luminance(ground, ground, ground)
            let ratio = (max(ring, back) + 0.05) / (min(ring, back) + 0.05)
            #expect(ratio >= 3, "\(style.rawValue): \(ratio):1")
        }
    }

    /// The foot under a note lines up with the text: the text view's padding counts too (the iPad
    /// pass: the foot sat about 5 points left of the text).
    @Test func theFootLinesUpWithTheText() {
        let f = PaneTextView.footFrame(inset: UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 16), padding: 5, width: 400, y: 100, height: 40)
        #expect(f == CGRect(x: 21, y: 100, width: 358, height: 40))
    }
}
#endif
