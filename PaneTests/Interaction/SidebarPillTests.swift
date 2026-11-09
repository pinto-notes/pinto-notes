#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// Emil, 9 November 2026: the selected folder's pill flashed between two shades during a
/// three-finger swipe. The pill was the system's `.fill.tertiary`, vibrant in the sidebar's glass,
/// and macOS stops drawing vibrancy while it moves or scales a window. Checked by hand on the Air
/// in Mission Control; here the pill has to stay a plain colour.
@MainActor @Suite(.serialized) struct SidebarPillTests {
    private static func rgba(_ c: NSColor, _ appearance: NSAppearance.Name) -> [Int] {
        var out: [Int] = []
        NSAppearance(named: appearance)!.performAsCurrentDrawingAppearance {
            let s = c.usingColorSpace(.sRGB)!
            out = [s.redComponent, s.greenComponent, s.blueComponent, s.alphaComponent].map { Int(($0 * 1000).rounded()) }
        }
        return out
    }

    /// Black over the light sidebar, white over the dark one, at the strengths the vibrant pills
    /// had at rest; the hover fainter than the selection.
    @Test func thePillsArePlainColoursAtTheirRestingStrength() {
        ThemeStore.$override.withValue(.standard) {
            #expect(Self.rgba(Palette.rowPill, .aqua) == [0, 0, 0, 59])
            #expect(Self.rgba(Palette.rowPill, .darkAqua) == [1000, 1000, 1000, 64])
            #expect(Self.rgba(Palette.rowPillHover, .aqua) == [0, 0, 0, 35])
            #expect(Self.rgba(Palette.rowPillHover, .darkAqua) == [1000, 1000, 1000, 45])
        }
    }

    /// Increase Contrast makes both stronger, as it did the system's fills.
    @Test func increaseContrastStrengthensThem() {
        var look = ThemeLook.standard
        look.increaseContrast = true
        ThemeStore.$override.withValue(look) {
            #expect(Self.rgba(Palette.rowPill, .aqua)[3] > 59)
            #expect(Self.rgba(Palette.rowPill, .darkAqua)[3] > 64)
            #expect(Self.rgba(Palette.rowPillHover, .aqua)[3] > 35)
            #expect(Self.rgba(Palette.rowPillHover, .darkAqua)[3] > 45)
        }
    }

    /// No vibrant (hierarchical) fill comes back for a row's pill or the sidebar's cards: in the
    /// glass it changes shade whenever macOS moves the window.
    @Test func noVibrantFillUnderARowOrASidebarCard() throws {
        let hover = try String(contentsOf: try TestFiles.url("Views/Hover.swift"), encoding: .utf8)
        let reader = try #require(hover.range(of: "struct HoverRowReader")).upperBound
        let readerEnd = try #require(hover.range(of: "struct HoverSwap")).lowerBound
        let selected = try #require(hover.range(of: "static var selected")).upperBound
        let selectedEnd = try #require(hover.range(of: "static let pillRadius")).lowerBound
        let cards = try String(contentsOf: try TestFiles.url("Views/SidebarCards.swift"), encoding: .utf8)
        let vibrant = try Regex(#"\.fill\.(primary|secondary|tertiary|quaternary|quinary)"#)
        for (name, text) in [("HoverRowReader", hover[reader..<readerEnd]), ("Hover.selected and rowHover", hover[selected..<selectedEnd]),
                             ("SidebarCards", cards[...])] {
            #expect(text.firstMatch(of: vibrant) == nil, "\(name) uses a vibrant fill")
        }
    }
}
#endif
