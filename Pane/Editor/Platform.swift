#if os(iOS)
import UIKit
typealias PFont = UIFont
typealias PColor = UIColor
typealias PFontDescriptor = UIFontDescriptor

extension PFontDescriptor.SymbolicTraits {
    static let paneBold: Self = .traitBold
    static let paneItalic: Self = .traitItalic
    static let paneMonoSpace: Self = .traitMonoSpace
}

extension PFont {
    func with(_ traits: UIFontDescriptor.SymbolicTraits) -> PFont {
        guard let d = fontDescriptor.withSymbolicTraits(fontDescriptor.symbolicTraits.union(traits)) else { return self }
        return PFont(descriptor: d, size: pointSize)
    }
}

extension PColor {
    static var paneLabel: PColor { Palette.ink }
    static var paneSecondary: PColor { Palette.muted }
    static var paneTertiary: PColor { .tertiaryLabel }
    static var paneFill: PColor { .secondarySystemBackground }
    static var panePanel: PColor { UIColor { $0.userInterfaceStyle == .dark ? UIColor(white: 0.13, alpha: 1) : UIColor(white: 0.975, alpha: 1) } }
    static var paneSeparator: PColor { .separator }
}
#else
import AppKit
typealias PFont = NSFont
typealias PColor = NSColor
typealias PFontDescriptor = NSFontDescriptor

extension PFontDescriptor.SymbolicTraits {
    static let paneBold: Self = .bold
    static let paneItalic: Self = .italic
    static let paneMonoSpace: Self = .monoSpace
}

extension PFont {
    func with(_ traits: NSFontDescriptor.SymbolicTraits) -> PFont {
        let d = fontDescriptor.withSymbolicTraits(fontDescriptor.symbolicTraits.union(traits))
        return PFont(descriptor: d, size: pointSize) ?? self
    }
}

extension PColor {
    static var paneLabel: PColor { Palette.ink }
    static var paneSecondary: PColor { Palette.muted }
    static var paneTertiary: PColor { .tertiaryLabelColor }
    static var paneFill: PColor { NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(white: 0.19, alpha: 1) : NSColor(white: 0.94, alpha: 1) } }
    static var panePanel: PColor { NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(white: 0.15, alpha: 1) : NSColor(white: 0.975, alpha: 1) } }
    static var paneSeparator: PColor { .separatorColor }
}
#endif

extension PColor {
    /// An empty checklist circle: Notes' light grey ring (systemGray3), a touch lighter than secondary text.
    static var paneCheckRing: PColor {
        #if os(iOS)
        // The welcome note's ring: the muted brown-grey, faint.
        Palette.pair(0x74604C, 0.45, 0xBCB0A3, 0.45)
        #else
        NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(white: 0.36, alpha: 1) : NSColor(white: 0.77, alpha: 1) }
        #endif
    }

    /// The warm amber accent: deeper in light mode so it still reads on white.
    static var paneAccent: PColor { PColor(named: "AccentColor") ?? Palette.amber }
    /// A link to a note that doesn't exist yet.
    static var paneAccentFaded: PColor { Palette.amberFaded }
    /// The note's page, for colours mixed over it by hand.
    static var panePage: PColor { Palette.page }
}

/// Type sizes for the editor. iOS reads at arm's length; the Mac at a desk.
enum EditorMetrics {
    #if os(iOS)
    // Follows the reader's text size (Dynamic Type), from 17 pt at the default size, like Notes.
    static var body: CGFloat { UIFontMetrics(forTextStyle: .body).scaledValue(for: 17) }
    // The welcome note's look, for every note (Emil, 28 October 2026): a large heavy title and
    // roomier lines.
    static var title: CGFloat { UIFontMetrics(forTextStyle: .largeTitle).scaledValue(for: 34) }
    static var lineSpacing: CGFloat { UIFontMetrics(forTextStyle: .body).scaledValue(for: 6.5) }
    /// A ### heading: the welcome's small bold label ("Get started").
    static var label: CGFloat { UIFontMetrics(forTextStyle: .footnote).scaledValue(for: 13) }
    #else
    // Apple Notes on the Mac: 13 pt body, ~20 pt title, tight lines. The candidates (DesignLook)
    // give the title the display size the website gives a headline's one line.
    static let body: CGFloat = 13
    /// A ### heading: a small bold label, as on the iPhone ("Get started").
    static let label: CGFloat = 11
    static var title: CGFloat {
        switch DesignLook.current {
        case .control: 20
        case .warm: 24
        case .paper: 26
        case .calm: 24
        case .reading: 28
        }
    }
    static let lineSpacing: CGFloat = 1.5
    #endif
    static var gutter: CGFloat { body * 1.6 }
    // Checklists, measured from Apple Notes (.shots/checklist/reference.md), as ratios of the body size.
    #if os(iOS)
    // iPhone: the welcome note's checklist, larger and airier than Notes' (24 pt circles, 38 pt apart).
    static var checkSize: CGFloat { body * 1.41 }
    static var checkGap: CGFloat { body * 0.7 }
    static var checkPitch: CGFloat { body * 2.24 }
    #else
    /// Circle diameter: 20.3 pt at iOS's 17 pt body.
    static var checkSize: CGFloat { body * 1.2 }
    /// From the circle's right edge to the text.
    static var checkGap: CGFloat { body * 0.64 }
    /// Distance from one item's baseline to the next.
    static var checkPitch: CGFloat { body * 1.76 }
    #endif
    /// The empty circle's hairline: about 1.1 pt on iPhone, never under 1 pt.
    static var checkStroke: CGFloat {
        #if os(macOS)
        // D (reading page): a lighter ring, so a list of open items doesn't read as a form.
        if DesignLook.readingPage { return 0.75 }
        #endif
        #if os(iOS)
        return max(1, body * 0.094)
        #else
        return max(1, body * 0.065)
        #endif
    }
    /// How far from the circle's centre a click still ticks it (a 24 pt target at least).
    static var checkHitRadius: CGFloat { max(checkSize / 2 + 3, 12) }
    static var nestStep: CGFloat { body * 1.4 }

    /// Increase Contrast is on: outlines drawn by hand use the label colour.
    nonisolated static var increasedContrast: Bool {
        #if os(iOS)
        UIAccessibility.isDarkerSystemColorsEnabled
        #else
        NSWorkspace.shared.accessibilityDisplayShouldIncreaseContrast
        #endif
    }
}

/// iPhone: a note opens with its date just above the top, like Notes; you pull down to see it.
enum DateFold {
    static let labelTop: CGFloat = 12
    static let labelHeight: CGFloat = 18
    /// How far the note starts scrolled: the date and a little air under it.
    static let hide: CGFloat = labelTop + labelHeight + 2

    /// The content offset that puts the date just out of view.
    static func offset(top: CGFloat) -> CGFloat { -top + hide }

    /// The extra room a short note needs at the bottom so it can still scroll past the date.
    static func bottomInset(viewHeight: CGFloat, contentHeight: CGFloat, top: CGFloat, bottom: CGFloat) -> CGFloat {
        max(0, viewHeight - top - bottom + hide - contentHeight)
    }

    /// Captures: `-uitest -showDate` opens notes with the date in view (as if pulled down).
    #if os(iOS)
    /// iPhone: the date shows at the top when a note opens, as on the welcome note (Emil, 28 October 2026).
    static let showOnOpen = true
    #else
    static let showOnOpen = ProcessInfo.processInfo.arguments.contains("-uitest") && ProcessInfo.processInfo.arguments.contains("-showDate")
    #endif

    /// Captures: a line to open scrolled to.
    static let scrollToText: String? = {
        let a = ProcessInfo.processInfo.arguments
        guard a.contains("-uitest"), let i = a.firstIndex(of: "-scrollToText"), i + 1 < a.count else { return nil }
        return a[i + 1]
    }()
}
