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
    // website's cream and tan read brown on the app's grey window).
    static let ink = pair(0x2A1D10, 0xF6EFE7)
    static let muted = pair(0x74604C, 0xBCB0A3)

    /// The deeper amber: accent, links and an AI's tint (AccentColor.colorset holds the same).
    static let amber = pair(0xD96A06, 0xF4AD33)
    /// The fill of amber primary buttons, in light and dark alike: the deeper amber, so their
    /// white label stays readable (the dark-mode amber is too light under white).
    static let amberButton = pair(0xD96A06, 0xD96A06)
    /// A primary button that can't be pressed yet: a quiet warm grey with muted text, not a faded
    /// amber, so it reads as "not yet" rather than as broken.
    static let disabledButton = pair(brown, 0.13, 0xFFFFFF, 0.11)
    static let disabledButtonLabel = pair(0x6A5743, 0xB0A498)
    /// The fill of destructive primary buttons (Start fresh), in light and dark alike: a red deep
    /// enough for the same white label.
    static let destructiveButton = pair(0xC62828, 0xC62828)
    /// A wiki link to a note that doesn't exist yet: the accent, faded toward the page (solid,
    /// so it reads the same over any background).
    static let amberFaded = pair(0xE69E5D, 0xAA7B2B)
    /// Amber as text beside an AI's mark: dark enough to read on white.
    static let amberInk = pair(0xA85700, 0xF4AD33)
    /// The soft amber fill behind an AI's receipt.
    static let amberSoft = pair(0xFFF1DC, 0x423014)
    /// A solid hairline: card edges and dividers that read the same over any surface.
    static let line = pair(0xE6DCD2, 0x3A3633)

    /// The fill of secondary buttons and chips (the website's `--soft`): a step into the brown
    /// from every ground it sits on, so it reads as a button without a border.
    static let soft = pair(0xF2EAE1, 0x36322E)
    /// A raised card, popover or toast (the website's `--card`): a step lighter than its ground,
    /// with the shared shadow (`Depth`) instead of a border.
    static let card = pair(0xFFFEFB, 0x2C2A27)
    /// The tint of the shared shadow's long, soft part: the brown, never grey.
    static let shadow = pair(0x3C1E05, 0.13, 0x000000, 0.45)

    /// The note itself: nearly white, and nearly native in the dark. Candidate B (`paper`) lays
    /// a soft cream page instead, like the website's cards.
    #if os(iOS)
    static let page = looks(control: (0xFFFEFD, 0x000000), warm: (0xFFFEFD, 0x000000), paper: (0xFFFAF3, 0x000000))
    #else
    static let page = looks(control: (0xFFFEFD, 0x1F1E1D), warm: (0xFFFEFC, 0x22201D), paper: (0xFFFAF2, 0x26231F),
                            calm: (0xFFFEFC, 0x25231F), reading: (0xFFFAF2, 0x282521))
    #endif

    #if os(iOS)
    /// The folders' ground (the most warmth) and the notes list's (less). Pure black in the dark.
    static let foldersGround = pair(0xEFEBE9, 0x000000)
    static let listGround = pair(0xF2F0EE, 0x000000)
    /// A grouped row on either ground; in the dark the rows are where the warmth shows.
    static let row = pair(0xFDFCFB, 0x1F1E1D)
    #else
    /// Laid inside the sidebar's glass, so it keeps its vibrancy: about 5.5% toward the brown
    /// (5% in the dark, where more reads as brown).
    static let sidebarWarmth = looks(control: (brown, 0.055, brown, 0.05), warm: (brown, 0.075, brown, 0.055), paper: (brown, 0.085, brown, 0.06))
    /// The notes list: a little warmth, less than the sidebar.
    /// C and D: a clear step below the page, light and dark, so list and note read as two grounds
    /// without a line between them.
    static let listGround = looks(control: (0xFCFAF8, 0x252423), warm: (0xFBF8F4, 0x282522), paper: (0xF8F2EA, 0x2A2622),
                                  calm: (0xF3EEE8, 0x1C1A18), reading: (0xF1EAE0, 0x1C1A18))
    #endif

    // Sign-in.
    /// The email field: white with a warm border on the cream ground, so it reads as a field at a
    /// glance; in the dark, a lighter translucent fill with a border of its own.
    static let field = pair(0xFFFFFF, 1, 0xFFFAF5, 0.10)
    static let fieldHairline = pair(brown, 0.30, 0xFFFFFF, 0.22)
    /// A field's placeholder: the muted text, dimmed, still about 4:1 on the field.
    static let placeholder = pair(0x74604C, 0.85, 0xBCB0A3, 0.80)
    /// Settings' search field: a step darker than the sheet's ground and its rows, in the brown,
    /// so it never reads as one of the rows.
    static let searchFill = pair(brown, 0.10, 0x000000, 0.36)
    /// A switch that is on, in Settings: the brand's brown, so the page keeps at most one orange
    /// control (owner, 2026-10-13).
    static let switchOn = pair(brown, 1, 0xA8774F, 1)
    /// A solid sheet's ground (How did you hear about Amber Notes?): the sign-in screen's cream,
    /// and its warm near-black in the dark.
    /// (The dark one was 0x1B1A1C, a cool grey with a hint of violet: DESIGN.md says warm, never neutral.)
    static let sheetGround = pair(0xF9F7F4, 0x1D1B19)
    /// The website's low marker under "your AI".
    static let underline = pair(0xF0901A, 0.42, 0xF5A53A, 0.50)

    /// Tracking for display type (heavy and tight, as on the website) at `size`: about -0.03 em.
    static func tracking(_ size: CGFloat) -> CGFloat { -size * 0.03 }

    // MARK: Building colours

    /// A colour that follows the look being tried (`DesignLook`): each look's light and dark hex.
    /// C and D default to A's and B's values.
    static func looks(control: (UInt32, UInt32), warm: (UInt32, UInt32), paper: (UInt32, UInt32),
                      calm: (UInt32, UInt32)? = nil, reading: (UInt32, UInt32)? = nil) -> PColor {
        func four(_ p: (UInt32, UInt32)) -> (UInt32, CGFloat, UInt32, CGFloat) { (p.0, 1, p.1, 1) }
        return looks(control: four(control), warm: four(warm), paper: four(paper), calm: calm.map(four), reading: reading.map(four))
    }

    static func looks(control: (UInt32, CGFloat, UInt32, CGFloat), warm: (UInt32, CGFloat, UInt32, CGFloat),
                      paper: (UInt32, CGFloat, UInt32, CGFloat), calm: (UInt32, CGFloat, UInt32, CGFloat)? = nil,
                      reading: (UInt32, CGFloat, UInt32, CGFloat)? = nil) -> PColor {
        let c = calm ?? warm, r = reading ?? paper
        let all: [DesignLook: (PColor, PColor)] = [
            .control: (rgb(control.0, control.1), rgb(control.2, control.3)),
            .warm: (rgb(warm.0, warm.1), rgb(warm.2, warm.3)),
            .paper: (rgb(paper.0, paper.1), rgb(paper.2, paper.3)),
            .calm: (rgb(c.0, c.1), rgb(c.2, c.3)),
            .reading: (rgb(r.0, r.1), rgb(r.2, r.3)),
        ]
        #if os(iOS)
        return UIColor { t in let c = all[DesignLook.current]!; return t.userInterfaceStyle == .dark ? c.1 : c.0 }
        #else
        return NSColor(name: nil) { a in let c = all[DesignLook.current]!; return a.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? c.1 : c.0 }
        #endif
    }

    static func rgb(_ hex: UInt32, _ alpha: CGFloat = 1) -> PColor {
        PColor(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
               blue: CGFloat(hex & 0xFF) / 255, alpha: alpha)
    }

    static func pair(_ light: UInt32, _ dark: UInt32) -> PColor { pair(light, 1, dark, 1) }

    static func pair(_ light: UInt32, _ lightAlpha: CGFloat, _ dark: UInt32, _ darkAlpha: CGFloat) -> PColor {
        let l = rgb(light, lightAlpha), d = rgb(dark, darkAlpha)
        #if os(iOS)
        return UIColor { $0.userInterfaceStyle == .dark ? d : l }
        #else
        return NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? d : l }
        #endif
    }
}

/// The main window's look while the owner chooses between candidates (DESIGN.md, "How design
/// decisions get made"): today's (`control`), A (`warm`: warmer neutrals, lighter icons, display
/// title) and B (`paper`: A on a cream page with the website's type voice in the note). Release
/// builds always draw `control`; a debug build reads `PINTO_LOOK=warm|paper` or the `PintoLook`
/// default. Captures set `current` directly.
enum DesignLook: String, CaseIterable, Sendable {
    case control, warm, paper
    /// C: A with a calm list (no brand mark in the sidebar, two-line rows without hairlines, a
    /// card-fill selection, quiet date headings) and a clear ground step between list and page.
    case calm
    /// D: C with a reading page: a centred column, a display title, lighter checklist rings and
    /// open tables, on B's cream.
    case reading

    nonisolated(unsafe) static var current: DesignLook = initial

    /// Any candidate: the shared parts of all of them.
    static var isCandidate: Bool { current != .control }
    /// C and D: the calm list.
    static var calmList: Bool { current == .calm || current == .reading }
    /// D: the reading page.
    static var readingPage: Bool { current == .reading }

    private static var initial: DesignLook {
        #if DEBUG
        let raw = ProcessInfo.processInfo.environment["PINTO_LOOK"] ?? UserDefaults.standard.string(forKey: "PintoLook")
        return raw.flatMap(DesignLook.init(rawValue:)) ?? .control
        #else
        return .control
        #endif
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
