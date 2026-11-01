import SwiftUI

/// Settings › Appearance: the theme and the accent, for this device only. Each theme follows the
/// mode above it (System, Light or Dark).
struct AppearanceSection: View {
    var body: some View {
        let look = ThemeStore.shared.look
        Section {
            LazyVGrid(columns: AppearanceGrid.columns, alignment: .leading, spacing: 10) {
                ForEach(Theme.allCases) { theme in
                    ThemeTile(theme: theme, selected: look.theme == theme) { ThemeStore.shared.theme = theme }
                }
            }
            .padding(.vertical, 4)
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Theme")
            LabeledContent("Accent") {
                HStack(spacing: 8) {
                    ForEach(AccentChoice.allCases) { choice in
                        AccentDot(choice: choice, theme: look.theme, selected: look.accent == choice) { ThemeStore.shared.accent = choice }
                    }
                }
            }
        } header: {
            Text("Theme")
        } footer: {
            Text("Set on each device.")
        }
    }
}

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

extension Theme.Hex {
    var color: Color { Color(Palette.pair(light, dark)) }
}

/// A small picture of the window in a theme: the sidebar, the page with two lines of text and
/// a tick in the accent. Selected: a ring in the accent, as in System Settings.
private struct ThemeTile: View {
    let theme: Theme
    let selected: Bool
    let pick: () -> Void

    var body: some View {
        let c = theme.preview
        let shape = RoundedRectangle(cornerRadius: 7, style: .continuous)
        Button(action: pick) {
            VStack(spacing: 5) {
                HStack(spacing: 0) {
                    c.sidebar.color.frame(width: 16)
                    ZStack(alignment: .topLeading) {
                        c.page.color
                        VStack(alignment: .leading, spacing: 4) {
                            Capsule().fill(c.ink.color).frame(width: 26, height: 4)
                            HStack(spacing: 3) {
                                Circle().fill(c.accent.color).frame(width: 6, height: 6)
                                Capsule().fill(c.muted.color).frame(width: 18, height: 3)
                            }
                            Capsule().fill(c.code.color).frame(width: 30, height: 6)
                        }
                        .padding(6)
                    }
                }
                .frame(height: 42)
                .clipShape(shape)
                .overlay(shape.strokeBorder(Color(PColor.paneSeparator), lineWidth: 1))
                .padding(2)
                .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous)
                    .strokeBorder(selected ? Color(PColor.paneAccent) : .clear, lineWidth: 2))
                Text(theme.title)
                    .font(.caption)
                    .foregroundStyle(selected ? Color.ink : Color.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(theme.spokenName)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier("settings.theme.\(theme.rawValue)")
    }
}

/// One accent: a solid dot, ringed when chosen. The first is the theme's own.
private struct AccentDot: View {
    let choice: AccentChoice
    let theme: Theme
    let selected: Bool
    let pick: () -> Void

    var body: some View {
        let hex = choice.hex ?? theme.preview.accent
        Button(action: pick) {
            Circle()
                .fill(hex.color)
                .frame(width: 16, height: 16)
                .padding(3)
                .overlay(Circle().strokeBorder(selected ? hex.color : .clear, lineWidth: 2))
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .help(choice.spokenName)
        .accessibilityLabel(choice.spokenName)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier("settings.accent.\(choice.rawValue)")
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
    }
}
