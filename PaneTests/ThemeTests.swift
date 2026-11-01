#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Colour themes (Settings › General › Appearance): Default keeps every colour the app has always
/// had, another theme changes what Palette gives, a colour taken before a switch draws the new
/// theme (the editor's text keeps the colours it was styled with), and every theme and accent
/// reads: body text 4.5:1, controls 3:1, light and dark. Looks are set with `ThemeStore.override`,
/// so the app's own choice and other suites never see them.
@MainActor @Suite struct ThemeTests {
    static func hex(_ c: NSColor, _ appearance: NSAppearance.Name) -> UInt32 {
        let s = AmberButtonTests.resolved(c, appearance)
        return [s.redComponent, s.greenComponent, s.blueComponent].reduce(0) { $0 << 8 | UInt32(($1 * 255).rounded()) }
    }

    static func alpha(_ c: NSColor, _ appearance: NSAppearance.Name) -> CGFloat {
        AmberButtonTests.resolved(c, appearance).alphaComponent
    }

    static func within(_ look: ThemeLook, _ body: () throws -> Void) rethrows {
        try ThemeStore.$override.withValue(look, operation: body)
    }

    /// Today's Mac window, value by value (plain: white and black, no cream, no warm grey).
    @Test func defaultIsTodaysColours() {
        Self.within(.standard) {
            let expected: [(String, NSColor, UInt32, UInt32)] = [
                ("page", Palette.page, 0xFFFFFF, 0x000000),
                ("list", Palette.listGround, 0xFFFFFF, 0x0D0D0D),
                ("selection", Palette.rowSelection, 0xEBEBEB, 0x262626),
                ("ink", Palette.ink, 0x262626, 0xD9D9D9),
                ("muted", Palette.muted, 0x6A6A6A, 0x999999),
                ("line", Palette.line, 0xE5E5E5, 0x333333),
                ("soft", Palette.soft, 0xF2F2F2, 0x2C2C2C),
                ("card", Palette.card, 0xFFFFFF, 0x1C1C1C),
                ("accent", Palette.amber, Palette.buildAccent.light, Palette.buildAccent.dark),
                ("amberInk", Palette.amberInk, Palette.buildAccent.ink.0, Palette.buildAccent.ink.1),
                ("code", PColor.paneFill, 0xF0F0F0, 0x303030),
                ("panel", PColor.panePanel, 0xF9F9F9, 0x262626),
            ]
            for (name, c, light, dark) in expected {
                #expect(Self.hex(c, .aqua) == light, "\(name) in the light")
                #expect(Self.hex(c, .darkAqua) == dark, "\(name) in the dark")
            }
            // Buttons: the accent under white in the light, white under black in the dark.
            #expect(Self.hex(Palette.primaryButton, .aqua) == Palette.buildAccent.light)
            #expect(Self.hex(Palette.primaryButton, .darkAqua) == 0xFFFFFF)
            // The sidebar keeps its 5% black over the glass, and none in the dark.
            #expect(Self.hex(Palette.sidebarWarmth, .aqua) == 0x000000 && abs(Self.alpha(Palette.sidebarWarmth, .aqua) - 0.05) < 0.002)
            #expect(Self.alpha(Palette.sidebarWarmth, .darkAqua) == 0)
            // The system controls keep the AccentColor asset.
            #expect(Self.hex(PColor.paneAccent, .aqua) == Self.hex(NSColor(named: "AccentColor")!, .aqua))
            #expect(Palette.accent.light == Palette.buildAccent.light)
        }
    }

    @Test func aThemeChangesWhatPaletteGives() {
        let sepia = try! #require(Theme.sepia.colors)
        Self.within(ThemeLook(theme: .sepia, accent: .theme)) {
            #expect(Self.hex(Palette.page, .aqua) == sepia.page.light)
            #expect(Self.hex(Palette.page, .darkAqua) == sepia.page.dark)
            #expect(Self.hex(Palette.ink, .aqua) == sepia.ink.light)
            #expect(Self.hex(Palette.listGround, .darkAqua) == sepia.list.dark)
            #expect(Self.hex(Palette.rowSelection, .aqua) == sepia.selection.light)
            #expect(Self.hex(PColor.paneFill, .aqua) == sepia.code.light)
            #expect(Self.hex(PColor.paneAccent, .aqua) == sepia.accent.light)
            #expect(Self.hex(Palette.sidebarWarmth, .aqua) == sepia.sidebar.light && Self.alpha(Palette.sidebarWarmth, .aqua) == 1, "solid, never over the glass")
            #expect(Palette.accent.light == sepia.accent.light)
        }
        // The accent apart from the theme.
        Self.within(ThemeLook(theme: .standard, accent: .blue)) {
            #expect(Self.hex(PColor.paneAccent, .aqua) == 0x0A64C8)
            #expect(Self.hex(Palette.primaryButton, .aqua) == 0x0A64C8)
            #expect(Self.hex(Palette.page, .aqua) == 0xFFFFFF, "the page stays Default's")
        }
    }

    /// A colour stored before the switch (a text attribute, a layer's colour) draws the theme of
    /// the moment, and SwiftUI gets a different colour for each look, so it draws again.
    @Test func aColourTakenEarlierDrawsTheCurrentTheme() {
        var early: NSColor!
        Self.within(.standard) { early = Palette.ink }
        let paper = try! #require(Theme.paper.colors)
        Self.within(ThemeLook(theme: .paper, accent: .theme)) {
            #expect(Self.hex(early, .aqua) == paper.ink.light)
            #expect(Palette.ink !== early, "a new colour for SwiftUI")
            #expect(Palette.ink === Palette.ink, "the same one while the look holds")
        }
        Self.within(.standard) { #expect(Self.hex(early, .aqua) == 0x262626) }
    }

    /// Every theme, with its own accent and with each of the picker's: text 4.5:1 on every ground
    /// it sits on, the primary button's white label 3:1, light and dark.
    @Test(arguments: Theme.allCases.filter { $0 != .standard })
    func everyThemeReads(_ theme: Theme) {
        let c = theme.colors!
        func l(_ a: UInt32, _ b: UInt32) -> Double { AmberButtonTests.contrast(Palette.rgb(a), Palette.rgb(b)) }
        for (mode, pick) in [("light", \Theme.Hex.light), ("dark", \Theme.Hex.dark)] {
            for (ground, g) in [("page", c.page), ("list", c.list), ("sidebar", c.sidebar), ("selection", c.selection), ("code", c.code), ("card", c.card), ("panel", c.panel)] {
                #expect(l(c.ink[keyPath: pick], g[keyPath: pick]) >= 4.5, "\(theme) \(mode): ink on \(ground)")
            }
            for (ground, g) in [("page", c.page), ("list", c.list), ("sidebar", c.sidebar), ("selection", c.selection)] {
                #expect(l(c.muted[keyPath: pick], g[keyPath: pick]) >= 4.5, "\(theme) \(mode): muted on \(ground)")
            }
            // A ground step you can see: the selection off the list, the code fill off the page.
            #expect(l(c.selection[keyPath: pick], c.list[keyPath: pick]) > 1.1, "\(theme) \(mode): the selection shows")
            #expect(l(c.code[keyPath: pick], c.page[keyPath: pick]) > 1.05, "\(theme) \(mode): the code block shows")
        }
        for choice in AccentChoice.allCases {
            let a = ThemeLook(theme: theme, accent: choice).accentShades
            #expect(l(a.light, 0xFFFFFF) >= 3, "\(theme)/\(choice): white on the button")
            #expect(l(a.light, c.page.light) >= 4.5, "\(theme)/\(choice): links on the light page")
            #expect(l(a.dark, c.page.dark) >= 4.5, "\(theme)/\(choice): links on the dark page")
            #expect(l(a.light, c.selection.light) >= 3, "\(theme)/\(choice): a tick on the selection")
        }
    }

    /// The picker's accents read on Default's page too.
    @Test func theAccentsReadOnDefault() {
        for choice in AccentChoice.allCases where choice != .theme {
            let a = ThemeLook(theme: .standard, accent: choice).accentShades
            #expect(AmberButtonTests.contrast(Palette.rgb(a.light), .white) >= 4.5, "\(choice) on white")
            #expect(AmberButtonTests.contrast(Palette.rgb(a.dark), .black) >= 4.5, "\(choice) on black")
        }
    }

    /// The choice is kept per device, and Default writes nothing.
    @Test func theChoiceIsKept() throws {
        let d = try #require(UserDefaults(suiteName: "ThemeTests-\(UUID().uuidString)"))
        #expect(ThemeStore(defaults: d).current == .standard)
        d.set("forest", forKey: ThemeStore.themeKey)
        d.set("purple", forKey: ThemeStore.accentKey)
        #expect(ThemeStore(defaults: d).current == ThemeLook(theme: .forest, accent: .purple))
        d.set("nonsense", forKey: ThemeStore.themeKey)
        #expect(ThemeStore(defaults: d).current.theme == .standard)
    }
}
#endif
