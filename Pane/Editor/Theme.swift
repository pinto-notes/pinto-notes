import Foundation
import Observation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// A colour theme for the notes window: the page, the sidebar and list grounds, the text, the
/// accent, the selection and the code block fill, each in light and dark (the system's appearance
/// picks one). Default is the app as it always was and stays the default for everyone. Every other
/// theme is solid colours and holds all its text to 4.5:1 and controls to 3:1, High contrast its
/// text to 7:1 (ThemeTests; docs/Evidence/themes/accessibility-audit.md).
/// Chosen per device in Settings › General › Appearance; never synced.
enum Theme: String, CaseIterable, Identifiable, Sendable {
    case standard = "default"
    /// A warm off-white page and a warm near-black, with the amber accent.
    case paper
    /// A reading app's sepia: tan page, brown ink.
    case sepia
    /// Cool slate blue greys with a steel blue accent.
    case slate
    /// Soft green-grey grounds with a forest green accent.
    case forest
    /// Black on white and white on black, blue links, a strong selection.
    case contrast

    var id: String { rawValue }

    var title: String {
        switch self {
        case .standard: "Default"
        case .paper: "Paper"
        case .sepia: "Sepia"
        case .slate: "Slate"
        case .forest: "Forest"
        case .contrast: "High contrast"
        }
    }

    /// One colour in the light and one in the dark.
    struct Hex: Equatable, Sendable {
        let light: UInt32, dark: UInt32
        init(_ light: UInt32, _ dark: UInt32) { self.light = light; self.dark = dark }
    }

    /// What a theme sets. Everything else in Palette keeps its Default value.
    struct Colors: Sendable {
        /// The note page.
        let page: Hex
        /// The folders' ground (the Mac's sidebar, the iPhone's folder list).
        let sidebar: Hex
        /// The notes list's ground.
        let list: Hex
        /// The selected note row, and a grouped row's fill on iPhone in the dark.
        let selection: Hex
        let ink: Hex
        let muted: Hex
        /// Hairlines and the soft fill of chips and secondary buttons.
        let line: Hex
        let soft: Hex
        /// A raised card or popover.
        let card: Hex
        /// The fill behind code (blocks and inline) and a table's header row.
        let code: Hex
        /// A table's cells.
        let panel: Hex
        /// The accent: `light` fills primary buttons under a white label and colours links on the
        /// light page; `dark` is links and ticks on the dark page.
        let accent: Hex
    }

    /// Nil for Default: it keeps every value Palette has always had.
    var colors: Colors? {
        switch self {
        case .standard: nil
        case .paper: Colors(page: Hex(0xFBF8F1, 0x1A1815), sidebar: Hex(0xEEE7DA, 0x24201C), list: Hex(0xF6F1E7, 0x1F1C18),
                            selection: Hex(0xE6DCCB, 0x37312A), ink: Hex(0x2B241C, 0xEDE5D8), muted: Hex(0x6B5D4C, 0xADA190),
                            line: Hex(0xE4DACA, 0x37322B), soft: Hex(0xEFE8DB, 0x2E2A24), card: Hex(0xFFFDF8, 0x26231F),
                            code: Hex(0xF0E9DC, 0x2A2622), panel: Hex(0xF8F4EC, 0x211E1A), accent: Hex(0x974E00, 0xF2A940))
        case .sepia: Colors(page: Hex(0xF4ECD8, 0x241E16), sidebar: Hex(0xE6DABE, 0x1A160F), list: Hex(0xEDE3CB, 0x1F1A13),
                            selection: Hex(0xDACCA9, 0x3A3124), ink: Hex(0x3A2C1A, 0xE9DCC2), muted: Hex(0x66543A, 0xB5A589),
                            line: Hex(0xDBCDAE, 0x3A3125), soft: Hex(0xE8DCC0, 0x30281D), card: Hex(0xFAF4E6, 0x2C251B),
                            code: Hex(0xEADFC4, 0x30281D), panel: Hex(0xF0E7D1, 0x29221A), accent: Hex(0x8E4411, 0xE0975A))
        case .slate: Colors(page: Hex(0xF6F8FB, 0x242933), sidebar: Hex(0xE4E9F0, 0x2E3440), list: Hex(0xEEF1F6, 0x2A303B),
                            selection: Hex(0xD6DEEA, 0x3C4454), ink: Hex(0x232A36, 0xECEFF4), muted: Hex(0x4C566A, 0xB8C0CE),
                            line: Hex(0xD8DEE8, 0x3B4252), soft: Hex(0xE5EAF1, 0x353C4A), card: Hex(0xFFFFFF, 0x2E3440),
                            code: Hex(0xE9EDF3, 0x333A47), panel: Hex(0xF1F4F8, 0x2B313C), accent: Hex(0x3D6394, 0x88C0D0))
        case .forest: Colors(page: Hex(0xFAFBF9, 0x111511), sidebar: Hex(0xE8ECE5, 0x1A1F1A), list: Hex(0xF2F4F0, 0x161A16),
                             selection: Hex(0xDAE3D4, 0x2A342A), ink: Hex(0x1E261F, 0xE2E8E0), muted: Hex(0x55605A, 0xA0AC9F),
                             line: Hex(0xDDE3D9, 0x2A322A), soft: Hex(0xE9EDE6, 0x232A23), card: Hex(0xFFFFFF, 0x1C221C),
                             code: Hex(0xEDF0EA, 0x1F251F), panel: Hex(0xF5F7F3, 0x191E19), accent: Hex(0x287045, 0x6CC690))
        // High contrast: black and white only, solid dividers, no grey text, a yellow highlighter
        // for the selection, and yellow links on black (Emil, 2026-11-01: "doesn't look any different").
        // Its text holds 7:1 (AAA) on every ground, the dark selection included (accessibility audit
        // 2026-11-01: the selection was 0x5C4B00, where grey text and yellow made 6.0 to 6.8).
        case .contrast: Colors(page: Hex(0xFFFFFF, 0x000000), sidebar: Hex(0xFFFFFF, 0x000000), list: Hex(0xFFFFFF, 0x000000),
                               selection: Hex(0xFFE14D, 0x4F4100), ink: Hex(0x000000, 0xFFFFFF), muted: Hex(0x1F1F1F, 0xE6E6E6),
                               line: Hex(0x000000, 0xFFFFFF), soft: Hex(0xEBEBEB, 0x262626), card: Hex(0xFFFFFF, 0x000000),
                               code: Hex(0xF0F0F0, 0x1C1C1C), panel: Hex(0xFFFFFF, 0x000000), accent: Hex(0x0033A0, 0xFFD60A))
        }
    }
}

/// The accent, chosen apart from the theme: the theme's own, or one of a few that read on every
/// theme's grounds (ThemeTests): 4.5:1 as text on the page, cards, tables, code, the sidebar's
/// selected folder and the selected note, light and dark. Each was deepened (light) or lifted (dark)
/// a little for that in the accessibility audit of 2026-11-01.
enum AccentChoice: String, CaseIterable, Identifiable, Sendable {
    case theme, blue, green, purple, red, graphite

    var id: String { rawValue }

    var title: String {
        switch self {
        case .theme: "Theme"
        case .blue: "Blue"
        case .green: "Green"
        case .purple: "Purple"
        case .red: "Red"
        case .graphite: "Graphite"
        }
    }

    /// Nil for the theme's own.
    var hex: Theme.Hex? {
        switch self {
        case .theme: nil
        case .blue: Theme.Hex(0x0957AE, 0x74B7FF)
        case .green: Theme.Hex(0x23653D, 0x6CC690)
        case .purple: Theme.Hex(0x6841AF, 0xBCA4FF)
        case .red: Theme.Hex(0xA72A25, 0xFF958D)
        case .graphite: Theme.Hex(0x555555, 0xB2B2B2)
        }
    }
}

/// What the colours follow right now: a theme and an accent.
struct ThemeLook: Hashable, Sendable {
    var theme: Theme
    var accent: AccentChoice

    static let standard = ThemeLook(theme: .standard, accent: .theme)

    /// Default with the theme's own accent: every colour exactly as it always was.
    var isStock: Bool { self == .standard }
    /// The theme's colours, nil for Default.
    var colors: Theme.Colors? { theme.colors }

    /// The accent's shades: the chosen accent, else the theme's, else the build's own.
    var accentShades: Palette.Accent {
        if theme == .contrast, accent != .theme, A11yStudy.contrastAccent != .stock {
            if A11yStudy.contrastAccent == .hidden, let own = theme.colors?.accent { return Palette.Accent(light: own.light, dark: own.dark) }
            if let hex = A11yStudy.contrastShades[accent] { return Palette.Accent(light: hex.light, dark: hex.dark) }
        }
        if A11yStudy.distinctAccents, accent == .purple { return Palette.Accent(light: A11yStudy.magenta.light, dark: A11yStudy.magenta.dark) }
        if A11yStudy.distinctAccents, theme == .forest, accent == .theme { return Palette.Accent(light: A11yStudy.moss.light, dark: A11yStudy.moss.dark) }
        if let hex = accent.hex ?? theme.colors?.accent { return Palette.Accent(light: hex.light, dark: hex.dark) }
        if A11yStudy.defaultAmber == .deepText { return Palette.Accent(light: A11yStudy.deepAmber, dark: Palette.buildAccent.dark) }
        return Palette.buildAccent
    }
}

/// The look the app is in, kept per device in UserDefaults. Observable, so a SwiftUI view that
/// reads a Palette colour in its body draws again when the theme changes; AppKit and UIKit views
/// are asked to redraw (`ThemeStore.didChange`). Readable from any thread.
final class ThemeStore: Observable, @unchecked Sendable {
    static let shared = ThemeStore()
    static let themeKey = "PintoTheme"
    static let accentKey = "PintoAccent"
    /// Posted on the main thread after the look changes.
    static let didChange = Notification.Name("PintoThemeDidChange")

    private let registrar = ObservationRegistrar()
    private let lock = NSLock()
    private var _look: ThemeLook
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        _look = ThemeLook(theme: defaults.string(forKey: Self.themeKey).flatMap(Theme.init(rawValue:)) ?? .standard,
                          accent: defaults.string(forKey: Self.accentKey).flatMap(AccentChoice.init(rawValue:)) ?? .theme)
    }

    /// The look, read where SwiftUI is watching.
    var look: ThemeLook {
        get { registrar.access(self, keyPath: \.look); return current }
        set { set(newValue) }
    }

    /// The look without telling SwiftUI (colour providers, drawing).
    var current: ThemeLook { Self.override ?? lock.withLock { _look } }

    /// Tests: a look for the colours resolved inside `withValue`, without touching the app's.
    @TaskLocal static var override: ThemeLook?

    var theme: Theme {
        get { look.theme }
        set { var l = current; l.theme = newValue; set(l) }
    }

    var accent: AccentChoice {
        get { look.accent }
        set { var l = current; l.accent = newValue; set(l) }
    }

    /// Sets the look, saves it, and (unless `persist` is false, as in captures) tells every view.
    func set(_ new: ThemeLook, persist: Bool = true) {
        guard new != current else { return }
        registrar.withMutation(of: self, keyPath: \.look) { lock.withLock { _look = new } }
        if persist {
            defaults.set(new.theme == .standard ? nil : new.theme.rawValue, forKey: Self.themeKey)
            defaults.set(new.accent == .theme ? nil : new.accent.rawValue, forKey: Self.accentKey)
        }
        let post = { NotificationCenter.default.post(name: Self.didChange, object: nil) }
        if Thread.isMainThread { post() } else { DispatchQueue.main.async(execute: post) }
    }
}

extension Palette {
    /// The colours that follow the theme, by name, built once per look.
    private nonisolated(unsafe) static var built: [String: [ThemeLook: PColor]] = [:]
    /// What callers hold: one colour per name and look, so SwiftUI sees a new colour when the look
    /// changes, and each always draws the current look, so AppKit text attributes and layers made
    /// under an older look draw the new one.
    private nonisolated(unsafe) static var handles: [String: [ThemeLook: PColor]] = [:]
    private static let liveLock = NSRecursiveLock()

    /// A colour that follows the theme. `build` makes it for a look; for Default it must give
    /// exactly the value Palette has always had.
    static func live(_ name: String, _ build: @escaping @Sendable (ThemeLook) -> PColor) -> PColor {
        let look = ThemeStore.shared.look
        return liveLock.withLock {
            if let h = handles[name]?[look] { return h }
            let resolve: @Sendable () -> PColor = { built(name, ThemeStore.shared.current, build) }
            #if os(iOS)
            let h = UIColor { resolve().resolvedColor(with: $0) }
            #else
            let h = NSColor(name: nil) { _ in resolve() }
            #endif
            handles[name, default: [:]][look] = h
            return h
        }
    }

    private static func built(_ name: String, _ look: ThemeLook, _ build: (ThemeLook) -> PColor) -> PColor {
        liveLock.withLock {
            if let c = built[name]?[look] { return c }
            let c = build(look)
            built[name, default: [:]][look] = c
            return c
        }
    }

    /// The theme's colour for `key`, or `stock` for Default.
    static func surface(_ name: String, _ key: KeyPath<Theme.Colors, Theme.Hex> & Sendable, stock: @escaping @Sendable () -> PColor) -> PColor {
        live(name) { look in
            // The Increase Contrast study: muted text takes the ink, hairlines the muted text's colour.
            if A11yStudy.increaseContrast, let c = look.colors {
                if key == \Theme.Colors.muted { return pair(c.ink.light, c.ink.dark) }
                if key == \Theme.Colors.line { return pair(c.muted.light, c.muted.dark) }
            }
            return look.colors.map { pair($0[keyPath: key].light, $0[keyPath: key].dark) } ?? stock()
        }
    }

    /// Captures only: the colours were built under other study switches (A11yStudy).
    static func forgetBuiltColours() { liveLock.withLock { built = [:] } }
}

/// Design study switches for the accessibility before-and-after pictures
/// (docs/Evidence/a11y-before-after): what each suggested fix would draw, with the app's own views.
/// All off in the app. Only those captures turn them on, in debug builds, then call
/// `Palette.forgetBuiltColours()`.
enum A11yStudy {
    /// How the selected note row is marked: today's fill, or the fill plus a 3 pt accent bar on the
    /// leading edge, a 1 pt outline, or a stronger fill.
    enum Selection: Sendable { case fill, bar, outline, strongerFill }
    /// Default's amber: as today, a deeper amber for text and links, or ink text on amber fills.
    enum DefaultAmber: Sendable { case stock, deepText, inkOnFill }
    /// High contrast with a picked accent: as today, the theme's own (the row hidden), or its own shades.
    enum ContrastAccent: Sendable { case stock, hidden, shades }

    #if DEBUG
    nonisolated(unsafe) static var selection = Selection.fill
    /// A near-black tick on a ticked checkbox in dark mode.
    nonisolated(unsafe) static var darkTick = false
    /// The iPhone Format panel's "on" segment in dark mode: the light accent under a near-black glyph.
    nonisolated(unsafe) static var formatOn = false
    nonisolated(unsafe) static var defaultAmber = DefaultAmber.stock
    nonisolated(unsafe) static var contrastAccent = ContrastAccent.stock
    /// What Increase Contrast would do to a theme: muted text to ink, solid hairlines, the bar.
    nonisolated(unsafe) static var increaseContrast = false
    /// Purple moved to magenta and Forest's own accent to moss, so no two look alike.
    nonisolated(unsafe) static var distinctAccents = false
    /// A tick on the chosen accent swatch, so the choice doesn't rely on its ring's hue.
    nonisolated(unsafe) static var swatchTick = false
    #else
    static let selection = Selection.fill
    static let darkTick = false
    static let formatOn = false
    static let defaultAmber = DefaultAmber.stock
    static let contrastAccent = ContrastAccent.stock
    static let increaseContrast = false
    static let distinctAccents = false
    static let swatchTick = false
    #endif

    /// Default's amber for text and links: 4.5:1 on white and on the selected folder's pill.
    static let deepAmber: UInt32 = 0xA34E00
    /// A tick on a light fill in dark mode, and the Format panel's glyph on the light accent.
    static let darkGlyph: UInt32 = 0x141414
    static let magenta = Theme.Hex(0x93246F, 0xFF9AD5)
    static let moss = Theme.Hex(0x4A6A12, 0xB4D16A)
    /// High contrast's shade of each picker accent: 7:1 on its every ground, its selection included.
    static let contrastShades: [AccentChoice: Theme.Hex] = [
        .blue: Theme.Hex(0x003A8C, 0xC2E0FF), .green: Theme.Hex(0x0B4A26, 0xB0EBC4), .purple: Theme.Hex(0x4B2390, 0xE0D6FF),
        .red: Theme.Hex(0x7D1410, 0xFFCFC9), .graphite: Theme.Hex(0x2E2E2E, 0xDCDCDC),
    ]
}
