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
            #expect(Self.hex(Palette.primaryButton, .aqua) == Palette.buildAccent.fill)
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
            #expect(Self.hex(PColor.paneAccent, .aqua) == 0x0957AE)
            #expect(Self.hex(Palette.primaryButton, .aqua) == 0x0957AE)
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

    // MARK: The accessibility matrix (docs/Technical/theme-accessibility-audit.md)

    /// WCAG 2.2 contrast of two hex colours.
    static func ratio(_ a: UInt32, _ b: UInt32) -> Double { AmberButtonTests.contrast(Palette.rgb(a), Palette.rgb(b)) }

    /// The sidebar's selected-folder pill (`Hover.selected`, SwiftUI's tertiary fill) over a
    /// theme's solid sidebar: about 4% black in the light and 4% white in the dark, measured from
    /// an offscreen render (F5F5F5 over white, 0D0D0D over black).
    static func pill(_ sidebar: UInt32, dark: Bool) -> UInt32 { Palette.Accent.mix(sidebar, dark ? 0xFFFFFF : 0x000000, 0.04) }

    /// Settings' and onboarding's sheet ground and a grouped form row: not themed, but a theme's
    /// text, accent and focus rings are drawn on them.
    static func unthemed(dark: Bool) -> [(String, UInt32)] {
        dark ? [("the sheet ground", 0x141414), ("a form row", 0x2A2A2A)] : [("the sheet ground", 0xF7F7F7), ("a form row", 0xFFFFFF)]
    }

    /// A theme's colours as Palette draws them for a look (Increase Contrast included).
    @dynamicMemberLookup struct Drawn {
        let look: ThemeLook
        subscript(dynamicMember key: KeyPath<Theme.Colors, Theme.Hex>) -> Theme.Hex { look.hex(key)! }
    }

    struct Pair {
        let what: String, fore: UInt32, back: UInt32
        /// Text needs 4.5:1 (7:1 in High contrast); a control or a mark that carries meaning 3:1.
        let text: Bool
    }

    /// Every colour pair a theme draws with this accent, as the code draws it: the text on each
    /// ground, links (the accent) wherever a note shows them, the selected folder's name on its
    /// pill, an AI's line (`amberInk`) and dot on the list and the selected row, the primary
    /// button's white label, a ticked checkbox on the page, and focus rings and swatch rings on
    /// Settings' unthemed ground.
    static func pairs(_ theme: Theme, _ choice: AccentChoice, dark: Bool, increaseContrast: Bool = false) -> [Pair] {
        let look = ThemeLook(theme: theme, accent: choice, increaseContrast: increaseContrast)
        let c = Drawn(look: look), a = look.accentShades
        func v(_ h: Theme.Hex) -> UInt32 { dark ? h.dark : h.light }
        let grounds = [("page", v(c.page)), ("list", v(c.list)), ("sidebar", v(c.sidebar)), ("card", v(c.card)),
                       ("code", v(c.code)), ("table", v(c.panel)), ("selected row", v(c.selection))]
        let link = dark ? a.dark : a.light, aiInk = dark ? a.ink.1 : a.ink.0
        var out: [Pair] = []
        // Increase Contrast: the hairlines, now the muted text's colour, mark boundaries (3:1).
        if increaseContrast {
            for (g, back) in [("page", v(c.page)), ("list", v(c.list)), ("card", v(c.card)), ("sidebar", v(c.sidebar))] {
                out.append(Pair(what: "hairline on \(g)", fore: v(c.line), back: back, text: false))
            }
        }
        // The tick on a ticked checkbox, over the accent's disc (as drawCheckbox draws it).
        let tick = ThemeTests.hex(CheckTick.color, dark ? .darkAqua : .aqua)
        out.append(Pair(what: "tick on a ticked checkbox", fore: tick, back: link, text: false))
        for (g, back) in grounds {
            out.append(Pair(what: "ink on \(g)", fore: v(c.ink), back: back, text: true))
            out.append(Pair(what: "muted on \(g)", fore: v(c.muted), back: back, text: true))
        }
        // The selected row's date: the ink at 85% (NoteRow).
        out.append(Pair(what: "date on the selected row", fore: Palette.Accent.mix(v(c.selection), v(c.ink), 0.85), back: v(c.selection), text: true))
        for (g, back) in [("page", v(c.page)), ("card", v(c.card)), ("table", v(c.panel)), ("table header", v(c.code))] {
            out.append(Pair(what: "link on \(g)", fore: link, back: back, text: true))
        }
        out.append(Pair(what: "selected folder's name on its pill", fore: link, back: pill(v(c.sidebar), dark: dark), text: true))
        out.append(Pair(what: "AI line on the list", fore: aiInk, back: v(c.list), text: true))
        out.append(Pair(what: "AI line on the selected row", fore: aiInk, back: v(c.selection), text: true))
        // The accent fill under a white label: the primary button in the light, amberButton in both.
        out.append(Pair(what: "white label on the accent button", fore: 0xFFFFFF, back: a.fill, text: true))
        out.append(Pair(what: "AI dot on the list", fore: link, back: v(c.list), text: false))
        out.append(Pair(what: "AI dot on the selected row", fore: link, back: v(c.selection), text: false))
        out.append(Pair(what: "ticked checkbox on the page", fore: link, back: v(c.page), text: false))
        for (g, back) in unthemed(dark: dark) {
            out.append(Pair(what: "ink on \(g)", fore: v(c.ink), back: back, text: true))
            out.append(Pair(what: "muted on \(g)", fore: v(c.muted), back: back, text: true))
            out.append(Pair(what: "focus ring on \(g)", fore: link, back: back, text: false))
        }
        return out
    }

    /// Points 1 and 2 of the audit: every theme but Default, light and dark, with its own accent
    /// and each of the picker's: text 4.5:1, controls and marks 3:1. Fails on the values before
    /// the audit (the selected folder's name on Sepia's sidebar was 3.8:1, links in a table's
    /// header 4.3:1, an AI's line on Slate's dark selected row 3.4:1).
    /// With Increase Contrast on (`increaseContrast`) the same pairs hold, and the hairlines too.
    @Test(arguments: Theme.allCases.filter { $0 != .standard })
    func everyThemeReads(_ theme: Theme) {
        for dark in [false, true] {
            for choice in AccentChoice.allCases {
                for boost in [false, true] {
                    for p in Self.pairs(theme, choice, dark: dark, increaseContrast: boost) {
                        let r = Self.ratio(p.fore, p.back), need = p.text ? 4.5 : 3
                        #expect(r >= need, "\(theme) \(dark ? "dark" : "light"), accent \(choice)\(boost ? ", Increase Contrast" : ""): \(p.what) is \(String(format: "%.2f", r)):1, needs \(need)")
                    }
                }
            }
            let c = theme.colors!
            func v(_ h: Theme.Hex) -> UInt32 { dark ? h.dark : h.light }
            // A ground step you can see: the selection off the list, the code fill off the page.
            #expect(Self.ratio(v(c.selection), v(c.list)) > 1.1, "\(theme) \(dark ? "dark" : "light"): the selection shows")
            #expect(Self.ratio(v(c.code), v(c.page)) > 1.05, "\(theme) \(dark ? "dark" : "light"): the code block shows")
        }
    }

    /// Point 3: High contrast holds every text pair to 7:1 (AAA), light and dark. Fails on the
    /// dark selection before the audit (grey text 6.8:1, the AI line 6.0:1), and with a picker
    /// accent before High contrast kept its own (red in a table header 6.1:1).
    /// Every stored accent, now: High contrast always draws with its own (audit point 5).
    @Test func highContrastIsAAA() {
        for dark in [false, true] {
            for choice in AccentChoice.allCases {
                for p in Self.pairs(.contrast, choice, dark: dark) where p.text {
                    let r = Self.ratio(p.fore, p.back)
                    #expect(r >= 7, "High contrast \(dark ? "dark" : "light"), accent \(choice): \(p.what) is \(String(format: "%.2f", r)):1")
                }
            }
            // Its dividers mark boundaries: solid, far above 3:1.
            let c = Theme.contrast.colors!
            #expect(Self.ratio(dark ? c.line.dark : c.line.light, dark ? c.page.dark : c.page.light) >= 3)
        }
    }

    /// Point 6: the picker. VoiceOver says each swatch's name ("Sepia", "Blue", never "button"),
    /// every name is different, and the views use these names (AppearanceSettings: the label,
    /// the tooltip, and the selected trait on the chosen one). SwiftUI builds no accessibility
    /// tree for a window that is never shown, so the trait itself is read in the code, not here.
    @Test func thePickerNamesEverySwatch() {
        let themes = Theme.allCases.map(\.spokenName), accents = AccentChoice.allCases.map(\.spokenName)
        for name in themes + accents {
            #expect(!name.isEmpty && !name.lowercased().contains("button"), "\(name)")
        }
        #expect(Set(themes).count == themes.count && Set(accents).count == accents.count)
        #expect(Theme.sepia.spokenName == "Sepia" && AccentChoice.blue.spokenName == "Blue")
    }

    /// The picker's accents read on Default's page too.
    @Test func theAccentsReadOnDefault() {
        for choice in AccentChoice.allCases where choice != .theme {
            let a = ThemeLook(theme: .standard, accent: choice).accentShades
            #expect(AmberButtonTests.contrast(Palette.rgb(a.light), .white) >= 4.5, "\(choice) on white")
            #expect(AmberButtonTests.contrast(Palette.rgb(a.dark), .black) >= 4.5, "\(choice) on black")
        }
    }

    // MARK: Emil's picks from the before-and-after study (pinto-internal/evidence/a11y-picks)

    /// Pick 2: the tick on a ticked checkbox is white in the light and near-black in the dark, as
    /// drawCheckbox draws it, and reads on every accent's disc in both (Default's included).
    @Test func theTickFollowsTheMode() throws {
        #expect(Self.hex(CheckTick.color, .aqua) == 0xFFFFFF)
        #expect(Self.hex(CheckTick.color, .darkAqua) == 0x141414)
        for (name, dark) in [("aqua", false), ("dark", true)] {
            let px = try Self.drawnTick(dark: dark)
            #expect(px == (dark ? 0x141414 : 0xFFFFFF), "the tick drawCheckbox draws, \(name): \(String(px, radix: 16))")
        }
        Self.within(.standard) {
            let disc = Self.hex(PColor.paneAccent, .darkAqua)
            #expect(Self.ratio(0x141414, disc) >= 3, "Default's tick in the dark")
            #expect(Self.ratio(0xFFFFFF, Self.hex(PColor.paneAccent, .aqua)) >= 3, "Default's tick in the light")
        }
    }

    /// The colour at the tick's corner when drawCheckbox draws a ticked box in `dark` or light.
    static func drawnTick(dark: Bool) throws -> UInt32 {
        let side = 100
        let ctx = try #require(CGContext(data: nil, width: side, height: side, bitsPerComponent: 8, bytesPerRow: side * 4,
                                         space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
        NSAppearance(named: dark ? .darkAqua : .aqua)!.performAsCurrentDrawingAppearance {
            Self.within(ThemeLook(theme: .sepia, accent: .theme)) {
                DecoratedLayoutFragment.drawCheckbox(checked: true, in: CGRect(x: 0, y: 0, width: side, height: side), ctx: ctx)
            }
        }
        // The tick's corner, (0.44, 0.66) of the box; the context's rows run bottom up, its memory top down.
        let bytes = try #require(ctx.data).assumingMemoryBound(to: UInt8.self)
        let i = ((side - 1 - 66) * side + 44) * 4
        return UInt32(bytes[i]) << 16 | UInt32(bytes[i + 1]) << 8 | UInt32(bytes[i + 2])
    }

    /// Pick 5: High contrast draws with its own accent.
    @Test func highContrastKeepsItsOwnAccent() throws {
        let own = try #require(Theme.contrast.colors?.accent)
        for choice in AccentChoice.allCases {
            let look = ThemeLook(theme: .contrast, accent: choice)
            #expect(look.accentShades.light == own.light && look.accentShades.dark == own.dark, "\(choice)")
            Self.within(look) { #expect(Self.hex(PColor.paneAccent, .darkAqua) == own.dark) }
        }
    }

    /// The Accent row is gone (Emil, 7 November 2026): each theme draws its own accent, Default
    /// the amber, and an accent chosen before is forgotten at start.
    @Test func eachThemeCarriesItsOwnAccent() throws {
        let d = try #require(UserDefaults(suiteName: "ThemeTests-\(UUID().uuidString)"))
        d.set("red", forKey: ThemeStore.accentKey)
        d.set("sepia", forKey: ThemeStore.themeKey)
        let store = ThemeStore(defaults: d)
        #expect(store.current.accent == .theme, "the old choice no longer draws")
        #expect(d.object(forKey: ThemeStore.accentKey) == nil, "and is removed")
        #expect(store.current.accentShades.light == Theme.sepia.colors!.accent.light)
        for theme in Theme.allCases {
            store.theme = theme
            let want = theme.preview.accent
            #expect(store.current.accentShades.light == want.light && store.current.accentShades.dark == want.dark, "\(theme)")
        }
        store.theme = .standard
        #expect(store.current.accentShades.light == Palette.buildAccent.light, "Default stays amber")
        #expect(d.object(forKey: ThemeStore.accentKey) == nil, "never written again")
        #expect(!SettingsIndex.all.contains { $0.label.lowercased().contains("accent") }, "no Accent row to search for")
    }

    /// The theme cards' bubbles are the theme's own page, sidebar and accent, light and dark (the
    /// chosen card has the border; the bubbles have no rings).
    @Test func themeCardSwatchesAreTheThemesColours() {
        for theme in Theme.allCases {
            let c = theme.preview
            let light = ThemeSwatch.colors(theme, dark: false), dark = ThemeSwatch.colors(theme, dark: true)
            #expect(light.page == c.page.light && light.sidebar == c.sidebar.light && light.accent == c.accent.light, "\(theme) light")
            #expect(dark.page == c.page.dark && dark.sidebar == c.sidebar.dark && dark.accent == c.accent.dark, "\(theme) dark")
        }
    }

    /// Pick 6: with Increase Contrast on, a theme's muted text is its ink and its hairlines the
    /// muted text's colour; Default draws as always. The store follows the system's setting live.
    @Test func increaseContrastStrengthensMutedAndLines() throws {
        let sepia = try #require(Theme.sepia.colors)
        Self.within(ThemeLook(theme: .sepia, accent: .theme, increaseContrast: true)) {
            for (mode, pick) in [(NSAppearance.Name.aqua, \Theme.Hex.light), (.darkAqua, \Theme.Hex.dark)] {
                #expect(Self.hex(Palette.muted, mode) == sepia.ink[keyPath: pick])
                #expect(Self.hex(Palette.line, mode) == sepia.muted[keyPath: pick])
                #expect(Self.alpha(Palette.line, mode) == 1, "solid")
                #expect(Self.hex(Palette.ink, mode) == sepia.ink[keyPath: pick])
            }
        }
        Self.within(ThemeLook(theme: .sepia, accent: .theme)) {
            #expect(Self.hex(Palette.muted, .aqua) == sepia.muted.light)
            #expect(Self.hex(Palette.line, .aqua) == sepia.line.light)
        }
        Self.within(ThemeLook(theme: .standard, accent: .theme, increaseContrast: true)) {
            #expect(Self.hex(Palette.muted, .aqua) == 0x6A6A6A && Self.hex(Palette.line, .aqua) == 0xE5E5E5, "Default as always")
        }
        // Live: the store reads the setting, and again when the system says it changed.
        let d = try #require(UserDefaults(suiteName: "ThemeTests-\(UUID().uuidString)"))
        let store = ThemeStore(defaults: d), center = NotificationCenter()
        nonisolated(unsafe) var on = false
        store.followSystemContrast(read: { on }, center: center)
        #expect(!store.current.increaseContrast)
        on = true
        center.post(name: NSWorkspace.accessibilityDisplayOptionsDidChangeNotification, object: nil)
        #expect(store.current.increaseContrast)
        store.theme = .forest
        #expect(store.current.increaseContrast, "a theme change keeps it")
        #expect(d.string(forKey: ThemeStore.themeKey) == "forest")
        on = false
        center.post(name: NSWorkspace.accessibilityDisplayOptionsDidChangeNotification, object: nil)
        #expect(!store.current.increaseContrast)
    }


    /// The choice is kept per device, and Default writes nothing.
    @Test func theChoiceIsKept() throws {
        let d = try #require(UserDefaults(suiteName: "ThemeTests-\(UUID().uuidString)"))
        #expect(ThemeStore(defaults: d).current == .standard)
        d.set("forest", forKey: ThemeStore.themeKey)
        d.set("purple", forKey: ThemeStore.accentKey)
        #expect(ThemeStore(defaults: d).current == ThemeLook(theme: .forest, accent: .theme), "an old accent no longer draws")
        d.set("nonsense", forKey: ThemeStore.themeKey)
        #expect(ThemeStore(defaults: d).current.theme == .standard)
    }
}
#endif
