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
/// text to 7:1 (ThemeTests; docs/Technical/theme-accessibility-audit.md).
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

    /// The WCAG 2.2 contrast ratio of two sRGB colours.
    static func contrast(_ a: UInt32, _ b: UInt32) -> Double {
        func lum(_ h: UInt32) -> Double {
            func lin(_ v: UInt32) -> Double { let c = Double(v & 0xFF) / 255; return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4) }
            return 0.2126 * lin(h >> 16) + 0.7152 * lin(h >> 8) + 0.0722 * lin(h)
        }
        let (x, y) = (lum(a), lum(b))
        return (max(x, y) + 0.05) / (min(x, y) + 0.05)
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

/// What the colours follow right now: a theme, an accent, and the system's Increase Contrast.
struct ThemeLook: Hashable, Sendable {
    var theme: Theme
    var accent: AccentChoice
    /// The system's Increase Contrast (macOS) or Darken Colors (iPhone) is on: a theme's muted
    /// text takes its ink and its hairlines the muted text's colour, solid. Not stored: the store
    /// follows the system (`ThemeStore.followSystemContrast`). Default draws as always.
    var increaseContrast = false

    static let standard = ThemeLook(theme: .standard, accent: .theme)

    /// Default with the theme's own accent: every colour exactly as it always was.
    var isStock: Bool { theme == .standard && accent == .theme }
    /// The theme's colours, nil for Default.
    var colors: Theme.Colors? { theme.colors }

    /// The accent that draws: High contrast always uses its own blue and yellow (7:1 on its every
    /// ground), whatever is stored; the stored choice comes back with another theme.
    var drawnAccent: AccentChoice { theme == .contrast ? .theme : accent }

    /// The accent's shades: the chosen accent, else the theme's, else the build's own.
    var accentShades: Palette.Accent {
        if let hex = drawnAccent.hex ?? theme.colors?.accent { return Palette.Accent(light: hex.light, dark: hex.dark) }
        return Palette.buildAccent
    }

    /// The theme's colour for `key` as drawn: with Increase Contrast on, muted text is the ink and
    /// a hairline the muted text's colour. Nil for Default.
    func hex(_ key: KeyPath<Theme.Colors, Theme.Hex>) -> Theme.Hex? {
        guard let c = colors else { return nil }
        if increaseContrast {
            if key == \Theme.Colors.muted { return c.ink }
            if key == \Theme.Colors.line { return c.muted }
        }
        return c[keyPath: key]
    }
}

/// The tick on a ticked checkbox, over the accent's disc: white on the deep accents of light mode,
/// near-black on the bright ones of dark mode, where white reads at 1.4 to 2.5:1 (accessibility
/// audit 2026-11-01, point 2; Emil picked it the same day).
enum CheckTick {
    static let light: UInt32 = 0xFFFFFF
    static let dark: UInt32 = 0x141414
    /// Drawn by DecoratedLayoutFragment.drawCheckbox and CheckPop, Mac and iPhone.
    static let color: PColor = Palette.pair(light, dark)
}

/// The look the app is in, kept per device in UserDefaults. Observable, so a SwiftUI view that
/// reads a Palette colour in its body draws again when the theme changes; AppKit and UIKit views
/// are asked to redraw (`ThemeStore.didChange`). Readable from any thread.
final class ThemeStore: Observable, @unchecked Sendable {
    static let shared = ThemeStore()
    static let themeKey = "PintoTheme"
    /// Where an accent chosen apart from the theme was kept, before each theme carried its own:
    /// removed at start.
    static let accentKey = "PintoAccent"
    /// Posted on the main thread after the look changes.
    static let didChange = Notification.Name("PintoThemeDidChange")

    private let registrar = ObservationRegistrar()
    private let lock = NSLock()
    private var _look: ThemeLook
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        // Each theme carries its own accent: the Accent row is gone (Emil, 7 November 2026), and an
        // accent chosen before is forgotten, so the theme's own draws.
        _look = ThemeLook(theme: defaults.string(forKey: Self.themeKey).flatMap(Theme.init(rawValue:)) ?? .standard, accent: .theme)
        defaults.removeObject(forKey: Self.accentKey)
    }

    private var contrastWatch: NSObjectProtocol?

    /// Follows the system's Increase Contrast from now on: reads it, and again each time it
    /// changes, and every view draws again (`didChange`). The app's root calls it once; `read` and
    /// `center` are for tests.
    func followSystemContrast(read: @escaping @Sendable () -> Bool = { EditorMetrics.increasedContrast },
                              center: NotificationCenter? = nil) {
        guard lock.withLock({ contrastWatch == nil }) else { return }
        #if os(iOS)
        let center = center ?? .default
        let name = UIAccessibility.darkerSystemColorsStatusDidChangeNotification
        #else
        let center = center ?? NSWorkspace.shared.notificationCenter
        let name = NSWorkspace.accessibilityDisplayOptionsDidChangeNotification
        #endif
        let watch = center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in self?.setIncreaseContrast(read()) }
        lock.withLock { contrastWatch = watch }
        setIncreaseContrast(read())
    }

    private func setIncreaseContrast(_ on: Bool) {
        var l = lock.withLock { _look }
        l.increaseContrast = on
        set(l, persist: false)
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

    /// Sets the look, saves it, and tells every view. A saved look keeps the system's Increase
    /// Contrast; with `persist` false (captures, and the system's setting itself) it is taken whole.
    func set(_ new: ThemeLook, persist: Bool = true) {
        var new = new
        if !new.increaseContrast, persist { new.increaseContrast = lock.withLock { _look.increaseContrast } }
        guard new != current else { return }
        registrar.withMutation(of: self, keyPath: \.look) { lock.withLock { _look = new } }
        if persist {
            defaults.set(new.theme == .standard ? nil : new.theme.rawValue, forKey: Self.themeKey)
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
        live(name) { look in look.hex(key).map { pair($0.light, $0.dark) } ?? stock() }
    }
}
