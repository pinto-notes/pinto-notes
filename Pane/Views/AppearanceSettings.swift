import SwiftUI

extension Theme {
    /// The colours a tile shows: the theme's own, or Default's.
    var preview: Colors {
        colors ?? Colors(page: Hex(0xFFFFFF, 0x000000), sidebar: Hex(0xEEEEED, 0x1E1E1E), list: Hex(0xFFFFFF, 0x0D0D0D),
                         selection: Hex(0xEBEBEB, 0x262626), ink: Hex(0x262626, 0xD9D9D9), muted: Hex(0x6A6A6A, 0x999999),
                         line: Hex(0xE5E5E5, 0x333333), soft: Hex(0xF2F2F2, 0x2C2C2C), card: Hex(0xFFFFFF, 0x1C1C1C),
                         code: Hex(0xF0F0F0, 0x303030), panel: Hex(0xF9F9F9, 0x262626),
                         accent: Hex(Palette.buildAccent.light, Palette.buildAccent.dark))
    }
}

extension Theme {
    /// What VoiceOver says for the theme's tile.
    var spokenName: String { title }
}

extension AccentChoice {
    /// What VoiceOver and the tooltip say for the accent's dot.
    var spokenName: String { self == .theme ? "The theme's own" : title }
}

extension AccentChoice {
    /// The swatch's colour: this accent, or the theme's own.
    func swatch(_ theme: Theme) -> Theme.Hex { hex ?? theme.preview.accent }
}

extension Theme.Hex {
    var color: Color { Color(Palette.pair(light, dark)) }

    /// A tick drawn on this colour: white or near-black, whichever reads better, in each mode.
    var tickOn: Theme.Hex {
        func pick(_ ground: UInt32) -> UInt32 {
            return Theme.contrast(CheckTick.light, ground) >= Theme.contrast(CheckTick.dark, ground) ? CheckTick.light : CheckTick.dark
        }
        return Theme.Hex(pick(light), pick(dark))
    }
}

extension View {
    /// The app's root: the accent as the tint, drawn again when the theme changes.
    func followsTheme() -> some View { modifier(FollowsTheme()) }
}

private struct FollowsTheme: ViewModifier {
    func body(content: Content) -> some View {
        // Reading the look here makes this body run again when it changes.
        _ = ThemeStore.shared.look
        return content
            .tint(Color(PColor.paneAccent))
            .onReceive(NotificationCenter.default.publisher(for: ThemeStore.didChange)) { _ in ThemeRedraw.all() }
            // The system's Increase Contrast, live (not in the unit-test host, so the Mac's own
            // setting never changes what other tests draw).
            .onAppear { if !PaneApp.isUnitTestHost { ThemeStore.shared.followSystemContrast() } }
    }
}
