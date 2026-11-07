#if os(macOS)
import AppKit
import SwiftUI

/// Settings on the Mac in the System Settings form Emil picked on 3 November 2026 (direction A of
/// the study): a flat sidebar on the card's own white or pure black, a hairline beside it, and
/// the pages' grouped forms (SettingsPageForm). These are its few colours.
enum SettingsInk {
    static func dynamic(_ light: NSColor, _ dark: NSColor) -> Color {
        Color(nsColor: NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? dark : light })
    }

    /// The theme's page: Settings follows the theme like the notes do (Emil, 6 November 2026).
    static var ground: Color { Color(Palette.page) }
    /// A box of rows, a summary: a step off the ground.
    static let group = dynamic(NSColor(white: 0, alpha: 0.04), NSColor(white: 1, alpha: 0.085))
    /// The selected page in the sidebar: the one selection look.
    static let selection = dynamic(NSColor(white: 0, alpha: 0.07), NSColor(white: 1, alpha: 0.13))
    static let hairline = dynamic(NSColor(white: 0, alpha: 0.09), NSColor(white: 1, alpha: 0.13))
    /// A button on a row: white, a step up from black in the dark.
    static let raised = dynamic(.white, NSColor(white: 0.16, alpha: 1))
    /// A button's and the card's own edge.
    static let edge = dynamic(NSColor(white: 0, alpha: 0.12), NSColor(white: 1, alpha: 0.18))
    static var text: Color { Color.ink }
    static var muted: Color { Color.muted }
    static let icon = dynamic(NSColor(white: 0.32, alpha: 1), NSColor(white: 0.72, alpha: 1))
    /// A switch that is on: the accent, as on iPhone (Emil, 7 November 2026), like the sidebar's
    /// icons. Where the accent is light (amber in the dark), a deeper shade of it, so the white knob
    /// still stands out at 3:1 (a grey at 2.7:1 read as switched off, council round 3, 11-04).
    static var switchOn: Color {
        Color(nsColor: NSColor(name: nil) { appearance in
            var c = NSColor.black
            appearance.performAsCurrentDrawingAppearance { c = PColor.paneAccent.usingColorSpace(.sRGB) ?? .black }
            for _ in 0..<12 where knobContrast(c) < 3 { c = c.blended(withFraction: 0.12, of: .black) ?? c }
            return c
        })
    }

    /// How far a white knob stands out from `track`.
    static func knobContrast(_ track: NSColor) -> CGFloat {
        guard let c = track.usingColorSpace(.sRGB) else { return 21 }
        func lin(_ v: CGFloat) -> CGFloat { v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
        return 1.05 / (0.2126 * lin(c.redComponent) + 0.7152 * lin(c.greenComponent) + 0.0722 * lin(c.blueComponent) + 0.05)
    }
}

#endif
