import SwiftUI
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Amber Notes' warm grey: a hint of the icon's brown (#8A4A1C) in the greys themselves, never a
/// layer over them. The sidebar takes the most, the list less, and the note page almost none.
/// On iPhone in dark mode the grounds stay pure black beside the Dynamic Island; only rows warm.
/// Always grey with a hint of warmth, never brown: dark surfaces lean 2–3% at most.
/// Compiled into the share extension too (with Platform.swift), so nothing here reaches app code.
enum Palette {
    /// The brown the greys lean toward.
    static let brown: UInt32 = 0x8A4A1C

    // Ink and muted text: the website's warm brown in the light; in the dark, warm greys (the
    // website's cream and tan read brown on the app's grey window). E (`plain`, the Mac's): neutral,
    // like Apple Notes. The ink is the system label colour laid on the page (85% black, 85% white),
    // solid so it reads the same on any surface; the muted text a neutral grey a little darker than
    // the system's secondary label in the light, which sits under 4:1 on white (5.4:1 on white
    // here and 4.5:1 on the selected row, 7.4:1 on black).
    static let ink = warm(0x2A1D10, 0xF6EFE7, plain: (0x262626, 0xD9D9D9))
    static let muted = warm(0x74604C, 0xBCB0A3, plain: (0x6A6A6A, 0x999999))

    /// The accent, in one place: amber. To recolour the app, set this to
    /// `Accent(light: 0x…, dark: 0x…)` and give the AccentColor asset the same two colours
    /// (docs/MAKE-IT-YOURS.md). Everything below that leans toward amber follows it.
    static let accent = Accent.amber

    /// The accent's shades. `light` fills the primary buttons under a white label, so it stays
    /// deep enough for 3:1 against white; `dark` is the accent on black (ticks, links, an AI's tint).
    struct Accent {
        let light: UInt32, dark: UInt32
        /// A wiki link to a note that doesn't exist yet: the accent faded toward the page.
        let faded: (UInt32, UInt32)
        /// The accent as text beside an AI's mark: dark enough to read on white.
        let ink: (UInt32, UInt32)
        /// The soft fill behind an AI's receipt, a lit choice and a selected suggestion (light mode).
        let soft: UInt32

        /// Amber, tuned by hand.
        static let amber = Accent(light: 0xD96A06, dark: 0xF4AD33, faded: (0xE69E5D, 0xAA7B2B),
                                  ink: (0xA85700, 0xF4AD33), soft: 0xFFF1DC)

        /// Any other accent: the other shades worked out from the two.
        init(light: UInt32, dark: UInt32) {
            self.init(light: light, dark: dark, faded: (Self.mix(light, 0xFFFFFF, 0.35), Self.mix(dark, 0x000000, 0.3)),
                      ink: (Self.mix(light, 0x000000, 0.22), dark), soft: Self.mix(light, 0xFFFFFF, 0.88))
        }

        private init(light: UInt32, dark: UInt32, faded: (UInt32, UInt32), ink: (UInt32, UInt32), soft: UInt32) {
            self.light = light; self.dark = dark; self.faded = faded; self.ink = ink; self.soft = soft
        }

        /// `a` moved `t` of the way toward `b`, channel by channel.
        static func mix(_ a: UInt32, _ b: UInt32, _ t: Double) -> UInt32 {
            [16, 8, 0].reduce(0) { sum, shift in
                let x = Double((a >> shift) & 0xFF), y = Double((b >> shift) & 0xFF)
                return sum | UInt32((x + (y - x) * t).rounded()) << shift
            }
        }
    }

    /// The accent: links, ticks and an AI's tint (AccentColor.colorset holds the same).
    static let amber = pair(accent.light, accent.dark)
    /// The fill of amber primary buttons, in light and dark alike: the deeper amber, so their
    /// white label stays readable (the dark-mode amber is too light under white).
    static let amberButton = pair(accent.light, accent.light)
    /// The primary button: the deeper amber with a white label in the light; in the dark the ink
    /// button, white with a black label (Emil, 2026-10-28: dark mode is pure black, its buttons
    /// white or black, never amber). Under the pointer a touch lighter in the light, a touch greyer
    /// in the dark.
    static let primaryButton = byAppearance(light: amberButton, dark: inkButton)
    static let primaryButtonLabel = byAppearance(light: rgb(0xFFFFFF), dark: inkButtonLabel)
    static let primaryButtonHover = pair(0xFFFFFF, 0.12, 0x000000, 0.08)
    /// What a secondary or quiet button, or a choice card, lays over its fill under the pointer and
    /// when pressed: a lean toward amber in the light, toward white in the dark.
    static let buttonHover = pair(accent.light, 0.12, 0xFFFFFF, 0.08)
    static let buttonPressed = pair(accent.light, 0.2, 0xFFFFFF, 0.14)
    static let quietPressed = pair(accent.light, 0.14, 0xFFFFFF, 0.10)
    static let choiceHover = pair(accent.light, 0.07, 0xFFFFFF, 0.06)
    /// A primary button that can't be pressed yet: a quiet warm grey with muted text, not a faded
    /// amber, so it reads as "not yet" rather than as broken.
    static let disabledButton = warm(brown, 0.13, 0xFFFFFF, 0.11, plain: (0x000000, 0.08, 0xFFFFFF, 0.11))
    static let disabledButtonLabel = warm(0x6A5743, 0xB0A498, plain: (0x6A6A6A, 0x999999))
    /// The black-and-white primary button (`inkProminent`), the colours of Sign in with Apple.
    static let inkButton = pair(0x000000, 0xFFFFFF)
    static let inkButtonLabel = pair(0xFFFFFF, 0x000000)
    /// The fill of destructive primary buttons (Start fresh), in light and dark alike: a red deep
    /// enough for the same white label.
    static let destructiveButton = pair(0xC62828, 0xC62828)
    /// A wiki link to a note that doesn't exist yet: the accent, faded toward the page (solid,
    /// so it reads the same over any background).
    static let amberFaded = pair(accent.faded.0, accent.faded.1)
    /// Amber as text beside an AI's mark: dark enough to read on white.
    static let amberInk = pair(accent.ink.0, accent.ink.1)
    /// The soft amber fill behind an AI's receipt, a lit choice and a selected suggestion. In the
    /// dark a neutral grey a step above the cards, never a brown-amber (dark mode is pure black).
    static let amberSoft = pair(accent.soft, 0x3A3A3A)
    /// A solid hairline: card edges and dividers that read the same over any surface.
    static let line = warm(0xE6DCD2, 0x3A3633, plain: (0xE5E5E5, 0x333333))

    /// The fill of secondary buttons and chips (the website's `--soft`): a step into the brown
    /// from every ground it sits on, so it reads as a button without a border.
    static let soft = warm(0xF2EAE1, 0x36322E, plain: (0xF2F2F2, 0x2C2C2C))
    /// A raised card, popover or toast (the website's `--card`): a step lighter than its ground,
    /// with the shared shadow (`Depth`) instead of a border.
    static let card = warm(0xFFFEFB, 0x2C2A27, plain: (0xFFFFFF, 0x1C1C1C))
    /// The tint of the shared shadow's long, soft part: the brown, never grey.
    static let shadow = warm(0x3C1E05, 0.13, 0x000000, 0.45, plain: (0x000000, 0.12, 0x000000, 0.45))

    /// The note itself: nearly white, and nearly native in the dark. Candidate B (`paper`) lays
    /// a soft cream page instead, like the website's cards. E (`plain`, the Mac's): white and black.
    #if os(iOS)
    static let page = looks(control: (0xFFFEFD, 0x000000), warm: (0xFFFEFD, 0x000000), paper: (0xFFFAF3, 0x000000))
    #else
    static let page = looks(control: (0xFFFEFD, 0x1F1E1D), warm: (0xFFFEFC, 0x22201D), paper: (0xFFFAF2, 0x26231F),
                            calm: (0xFFFEFC, 0x25231F), reading: (0xFFFAF2, 0x282521), plain: (0xFFFFFF, 0x000000))
    #endif

    #if os(iOS)
    /// The folders' ground (the most warmth) and the notes list's (less). Pure black in the dark.
    static let foldersGround = pair(0xEFEBE9, 0x000000)
    static let listGround = pair(0xF2F0EE, 0x000000)
    /// A grouped row on either ground; in the dark the rows are where the warmth shows.
    static let row = pair(0xFDFCFB, 0x1F1E1D)
    #else
    /// Laid inside the sidebar's glass, so it keeps its vibrancy: about 5.5% toward the brown
    /// (5% in the dark, where more reads as brown). E (`plain`): none, the native glass.
    static let sidebarWarmth = looks(control: (brown, 0.055, brown, 0.05), warm: (brown, 0.075, brown, 0.055), paper: (brown, 0.085, brown, 0.06),
                                     plain: (brown, 0, brown, 0))
    /// The notes list: a little warmth, less than the sidebar.
    /// C and D: a clear step below the page, light and dark, so list and note read as two grounds
    /// without a line between them. E (`plain`): the page's white, and in the dark a neutral step off
    /// the note's black (#0D0D0D, Emil's pick 10-30), with the split view's own divider between them.
    static let listGround = looks(control: (0xFCFAF8, 0x252423), warm: (0xFBF8F4, 0x282522), paper: (0xF8F2EA, 0x2A2622),
                                  calm: (0xF3EEE8, 0x1C1A18), reading: (0xF1EAE0, 0x1C1A18), plain: (0xFFFFFF, 0x0D0D0D))
    /// The selected note row in C, D and E: the card in C and D (a step lighter than their list);
    /// in E, whose list is the card's white, a neutral grey a step off the list instead.
    static let rowSelection = looks(control: (0xFFFEFB, 0x2C2A27), warm: (0xFFFEFB, 0x2C2A27), paper: (0xFFFEFB, 0x2C2A27),
                                    plain: (0xEBEBEB, 0x262626))
    #endif

    // Sign-in.
    /// The email field: white with a warm border on the cream ground, so it reads as a field at a
    /// glance; in the dark, a lighter translucent fill with a border of its own.
    static let field = warm(0xFFFFFF, 1, 0xFFFAF5, 0.10, plain: (0xFFFFFF, 1, 0xFFFFFF, 0.10))
    static let fieldHairline = warm(brown, 0.30, 0xFFFFFF, 0.22, plain: (0x000000, 0.22, 0xFFFFFF, 0.22))
    /// A field's placeholder: the muted text, dimmed, still about 4:1 on the field.
    static let placeholder = warm(0x74604C, 0.85, 0xBCB0A3, 0.80, plain: (0x6A6A6A, 0.85, 0x999999, 0.80))
    /// Settings' search field: a step darker than the sheet's ground and its rows, in the brown,
    /// so it never reads as one of the rows.
    static let searchFill = warm(brown, 0.10, 0x000000, 0.36, plain: (0x000000, 0.06, 0x000000, 0.36))
    /// A switch that is on, in Settings: the brand's brown, so the page keeps at most one orange
    /// control (owner, 2026-10-13).
    static let switchOn = pair(brown, 1, 0xA8774F, 1)
    /// A solid sheet's ground (How did you hear about Amber Notes?): the sign-in screen's cream,
    /// and its warm near-black in the dark.
    /// (The dark one was 0x1B1A1C, a cool grey with a hint of violet: DESIGN.md says warm, never neutral.)
    /// E (`plain`): a neutral step off white, and a near-black under the black window.
    static let sheetGround = warm(0xF9F7F4, 0x1D1B19, plain: (0xF7F7F7, 0x141414))
    /// The website's low marker under "your AI".
    static let underline = pair(0xF0901A, 0.42, 0xF5A53A, 0.50)

    /// Tracking for display type (heavy and tight, as on the website) at `size`: about -0.03 em.
    static func tracking(_ size: CGFloat) -> CGFloat { -size * 0.03 }

    // MARK: Building colours

    /// A colour that follows the look being tried (`DesignLook`): each look's light and dark hex.
    /// C and D default to A's and B's values, E to D's.
    static func looks(control: (UInt32, UInt32), warm: (UInt32, UInt32), paper: (UInt32, UInt32),
                      calm: (UInt32, UInt32)? = nil, reading: (UInt32, UInt32)? = nil, plain: (UInt32, UInt32)? = nil) -> PColor {
        func four(_ p: (UInt32, UInt32)) -> (UInt32, CGFloat, UInt32, CGFloat) { (p.0, 1, p.1, 1) }
        return looks(control: four(control), warm: four(warm), paper: four(paper), calm: calm.map(four), reading: reading.map(four), plain: plain.map(four))
    }

    static func looks(control: (UInt32, CGFloat, UInt32, CGFloat), warm: (UInt32, CGFloat, UInt32, CGFloat),
                      paper: (UInt32, CGFloat, UInt32, CGFloat), calm: (UInt32, CGFloat, UInt32, CGFloat)? = nil,
                      reading: (UInt32, CGFloat, UInt32, CGFloat)? = nil, plain: (UInt32, CGFloat, UInt32, CGFloat)? = nil) -> PColor {
        let c = calm ?? warm, r = reading ?? paper, e = plain ?? r
        let all: [DesignLook: (PColor, PColor)] = [
            .control: (rgb(control.0, control.1), rgb(control.2, control.3)),
            .warm: (rgb(warm.0, warm.1), rgb(warm.2, warm.3)),
            .paper: (rgb(paper.0, paper.1), rgb(paper.2, paper.3)),
            .calm: (rgb(c.0, c.1), rgb(c.2, c.3)),
            .reading: (rgb(r.0, r.1), rgb(r.2, r.3)),
            .plain: (rgb(e.0, e.1), rgb(e.2, e.3)),
        ]
        #if os(iOS)
        return UIColor { t in let c = all[DesignLook.current]!; return t.userInterfaceStyle == .dark ? c.1 : c.0 }
        #else
        return NSColor(name: nil) { a in let c = all[DesignLook.current]!; return a.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? c.1 : c.0 }
        #endif
    }

    /// One colour in the light and another in the dark.
    static func byAppearance(light: PColor, dark: PColor) -> PColor {
        #if os(iOS)
        UIColor { $0.userInterfaceStyle == .dark ? dark.resolvedColor(with: $0) : light.resolvedColor(with: $0) }
        #else
        NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? dark : light }
        #endif
    }

    static func rgb(_ hex: UInt32, _ alpha: CGFloat = 1) -> PColor {
        PColor(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
               blue: CGFloat(hex & 0xFF) / 255, alpha: alpha)
    }

    static func pair(_ light: UInt32, _ dark: UInt32) -> PColor { pair(light, 1, dark, 1) }

    /// A warm colour every look shares, but neutral in E (`plain`) on the Mac. The iPhone keeps
    /// the warm one.
    static func warm(_ light: UInt32, _ dark: UInt32, plain: (UInt32, UInt32)) -> PColor {
        #if os(iOS)
        pair(light, dark)
        #else
        looks(control: (light, dark), warm: (light, dark), paper: (light, dark), plain: plain)
        #endif
    }

    /// The same, with alphas.
    static func warm(_ light: UInt32, _ lightAlpha: CGFloat, _ dark: UInt32, _ darkAlpha: CGFloat,
                     plain: (UInt32, CGFloat, UInt32, CGFloat)) -> PColor {
        #if os(iOS)
        pair(light, lightAlpha, dark, darkAlpha)
        #else
        looks(control: (light, lightAlpha, dark, darkAlpha), warm: (light, lightAlpha, dark, darkAlpha),
              paper: (light, lightAlpha, dark, darkAlpha), plain: plain)
        #endif
    }

    static func pair(_ light: UInt32, _ lightAlpha: CGFloat, _ dark: UInt32, _ darkAlpha: CGFloat) -> PColor {
        let l = rgb(light, lightAlpha), d = rgb(dark, darkAlpha)
        #if os(iOS)
        return UIColor { $0.userInterfaceStyle == .dark ? d : l }
        #else
        return NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? d : l }
        #endif
    }
}

/// The main window's look. E (`plain`) ships on the Mac, D (`reading`) on iPhone; the others stay for
/// comparison in debug builds: the old look (`control`), A (`warm`: warmer neutrals, lighter icons,
/// display title), B (`paper`: A on a cream page with the website's type voice in the note), C
/// (`calm`: A with the calm list), D (`reading`: C with the reading page on cream).
/// A debug build reads `PINTO_LOOK=control|warm|paper|calm|reading|plain` or the `PintoLook` default.
/// Captures set `current` directly.
enum DesignLook: String, CaseIterable, Sendable {
    case control, warm, paper
    /// C: A with a calm list (no brand mark in the sidebar, two-line rows without hairlines, a
    /// card-fill selection, quiet date headings) and a clear ground step between list and page.
    case calm
    /// D: C with a reading page: a centred column, a display title, lighter checklist rings and
    /// open tables, on B's cream.
    case reading
    /// E: D in plain white and black: no cream page, no warm list, no brown in the sidebar's glass.
    case plain

    nonisolated(unsafe) static var current: DesignLook = initial

    /// Any candidate: the shared parts of all of them.
    static var isCandidate: Bool { current != .control }
    /// C and D: the calm list.
    static var calmList: Bool { current == .calm || current == .reading || current == .plain }
    /// D and E: the reading page.
    static var readingPage: Bool { current == .reading || current == .plain }

    /// What ships: on the Mac E, D's window in plain white and black (Emil, 2026-10-29: no cream);
    /// on iPhone D, the reading page (Emil, 2026-10-13: "get this all out"), whose grounds were
    /// already white and black. A debug build can still show any look for comparison.
    #if os(iOS)
    static let shipped = DesignLook.reading
    #else
    static let shipped = DesignLook.plain
    #endif

    private static var initial: DesignLook {
        #if DEBUG
        let raw = ProcessInfo.processInfo.environment["PINTO_LOOK"] ?? UserDefaults.standard.string(forKey: "PintoLook")
        return raw.flatMap(DesignLook.init(rawValue:)) ?? shipped
        #else
        return shipped
        #endif
    }
}

extension Palette {
    /// The iPhone Format panel's colours (FormatPanel). It sits on the system's keyboard sheet, a
    /// cool grey in light mode, so its pills are white there with the system's label colour, as in
    /// Notes (the warm `soft` clashed with that sheet); in dark mode, the app's warm pill and ink.
    /// What's on (a selected segment, the line's style) is a solid amber with a white glyph, so it
    /// reads at a glance (2026-10-28: the soft amber tint was too faint to tell). Each is picked by
    /// appearance and Increase Contrast; FormatPanelTests holds them to 3:1 against each other.
    enum Format {
        static func pill(dark: Bool, highContrast: Bool) -> UInt32 {
            dark ? (highContrast ? 0x262321 : 0x36322E) : 0xFFFFFF
        }
        /// A glyph that's off: the label colour on light, ink on dark.
        static func glyph(dark: Bool, highContrast: Bool) -> UInt32 { dark ? 0xF6EFE7 : 0x000000 }
        /// What's on: the primary buttons' amber; deeper with Increase Contrast in light mode.
        static func on(dark: Bool, highContrast: Bool) -> UInt32 { !dark && highContrast ? accent.ink.0 : accent.light }
        static let onGlyph: UInt32 = 0xFFFFFF
    }
}

extension Color {
    static let ink = Color(Palette.ink)
    static let muted = Color(Palette.muted)
    static let amberInk = Color(Palette.amberInk)
    static let amberSoft = Color(Palette.amberSoft)
    static let line = Color(Palette.line)
    static let soft = Color(Palette.soft)
    static let card = Color(Palette.card)
    /// The note itself sits on a lighter page than the list and sidebar, like Apple Notes.
    static let notePage = Color(Palette.page)

    init(light: Color, dark: Color) {
        #if os(macOS)
        self.init(nsColor: NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(dark) : NSColor(light) })
        #else
        self.init(uiColor: UIColor { $0.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light) })
        #endif
    }
}

extension Font {
    /// The website's display type: heavy and tight. For the app's name, a note's title and
    /// iPhone's large titles only.
    static func display(_ size: CGFloat) -> Font { .system(size: size, weight: .heavy) }
}
