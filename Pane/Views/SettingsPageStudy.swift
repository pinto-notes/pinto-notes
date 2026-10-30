import SwiftUI

extension EnvironmentValues {
    /// Inside a Settings page that has its own title, so a page's first section needs none.
    @Entry var settingsAsPage = false
}

#if os(macOS)

/// Design study (2026-10-30): Settings as a page of the window, not a sheet. While it is open the
/// sidebar lists Settings' pages instead of folders, and the page fills the rest (T3 Code's,
/// System Settings'). Adds Appearance: light or dark, and a theme. Off unless a capture shows it.
enum SettingsStudyPage: Hashable, Identifiable {
    case place(SettingsPlace)
    case appearance
    var id: String { title }

    var title: String {
        switch self {
        case .place(let p): p.title
        case .appearance: "Appearance"
        }
    }

    var symbol: String {
        switch self {
        case .place(let p): p.symbol
        case .appearance: "paintpalette"
        }
    }

    /// The sidebar's groups: what you do most first, then you and your data, then help.
    static func groups(available: Set<SettingsPlace>) -> [[SettingsStudyPage]] {
        [[.place(.ai), .appearance, .place(.general)],
         [.place(.security), .place(.storage), .place(.account)],
         [.place(.help)]]
            .map { $0.filter { if case .place(let p) = $0 { available.contains(p) } else { true } } }
            .filter { !$0.isEmpty }
    }
}

struct SettingsPageStudy: View {
    let available: Set<SettingsPlace>
    let page: (SettingsStudyPage) -> AnyView
    @State var selected: SettingsStudyPage = .place(.ai)
    var back: () -> Void = {}
    @State private var profile = ProfileStore.shared
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        HStack(spacing: 0) {
            sidebar
                .frame(width: 259)
                .frame(maxHeight: .infinity)
                .background(Color.primary.opacity(0.045), in: .rect(cornerRadius: 14, style: .continuous))
                .padding(8)
            VStack(alignment: .leading, spacing: 0) {
                Text(selected.title)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(Color.ink)
                    .accessibilityAddTraits(.isHeader)
                    .padding(.horizontal, 20)
                    .padding(.top, 44)
                page(selected)
                    .environment(\.settingsAsPage, true)
                    .frame(maxHeight: .infinity, alignment: .top)
            }
            .frame(maxWidth: SettingsStudyLayout.page, maxHeight: .infinity, alignment: .topLeading)
            .padding(.leading, 16)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        // The notes' own ground: white, and pure black in the dark.
        .background(scheme == .dark ? Color.black : Color.white)
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button(action: back) {
                Label("Back to notes", systemImage: "chevron.left")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.muted)
                    .frame(maxWidth: .infinity, minHeight: 28, alignment: .leading)
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .keyboardShortcut(.cancelAction)
            .accessibilityIdentifier("settings.backToNotes")
            .padding(.top, 44)
            .padding(.bottom, 10)
            you.padding(.bottom, 12)
            ForEach(Array(SettingsStudyPage.groups(available: available).enumerated()), id: \.offset) { i, group in
                if i > 0 { Divider().padding(.vertical, 8).padding(.trailing, 4) }
                ForEach(group) { row($0) }
            }
            Spacer()
        }
        .padding(.leading, 14)
        .padding(.trailing, 10)
    }

    /// You, at the top: photo and name, opening Profile.
    private var you: some View {
        Button { selected = .place(.profile) } label: {
            HStack(spacing: 10) {
                AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 34)
                VStack(alignment: .leading, spacing: 1) {
                    Text(AccountName.shown(profile.name)).font(.system(size: 13, weight: .semibold)).foregroundStyle(Color.ink)
                    Text("Name, photo and sign in").font(.system(size: 11)).foregroundStyle(Color.muted)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 7)
            .padding(.vertical, 6)
            .background(highlight(selected == .place(.profile)))
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("settings.profile")
    }

    private func row(_ p: SettingsStudyPage) -> some View {
        Button { selected = p } label: {
            Label {
                Text(p.title).foregroundStyle(Color.ink)
            } icon: {
                SidebarIcon(name: p.symbol, selected: selected == p)
            }
            .sidebarRowLabel()
            .padding(.horizontal, 7)
            .frame(maxWidth: .infinity, minHeight: 30, alignment: .leading)
            .background(highlight(selected == p))
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected == p ? .isSelected : [])
        .accessibilityIdentifier("settings.\(p.id)")
    }

    private func highlight(_ on: Bool) -> some View {
        RoundedRectangle(cornerRadius: 8, style: .continuous).fill(on ? Color.primary.opacity(0.08) : .clear)
    }
}

enum SettingsStudyLayout {
    /// The page's width: room for the library and the theme cards, never a full-width line.
    static let page: CGFloat = 660
}

/// Appearance: light, dark or as the Mac is; and a theme, each card a note drawn in its colours.
struct AppearanceStudyPage: View {
    enum Mode: String, CaseIterable, Identifiable {
        case system = "Automatic", light = "Light", dark = "Dark"
        var id: String { rawValue }
    }

    /// A look for notes and the window. Plain is today's; the others are what a theme could be.
    struct Theme: Identifiable, Equatable {
        let name: String
        let line: String
        let light: (ground: Color, ink: Color, muted: Color, accent: Color)
        let dark: (ground: Color, ink: Color, muted: Color, accent: Color)
        var id: String { name }
        static func == (a: Theme, b: Theme) -> Bool { a.name == b.name }

        static let all: [Theme] = [
            Theme(name: "Plain", line: "White and black",
                  light: (.white, .black, Color(white: 0.45), Color(red: 0.85, green: 0.45, blue: 0.12)),
                  dark: (.black, .white, Color(white: 0.6), .white)),
            Theme(name: "Paper", line: "Warm, like a notebook",
                  light: (Color(red: 0.98, green: 0.96, blue: 0.92), Color(red: 0.16, green: 0.11, blue: 0.06), Color(red: 0.48, green: 0.40, blue: 0.32), Color(red: 0.80, green: 0.44, blue: 0.16)),
                  dark: (Color(red: 0.11, green: 0.10, blue: 0.09), Color(red: 0.96, green: 0.94, blue: 0.90), Color(red: 0.66, green: 0.60, blue: 0.54), Color(red: 0.90, green: 0.60, blue: 0.30))),
            Theme(name: "Graphite", line: "Soft greys, less contrast",
                  light: (Color(white: 0.95), Color(white: 0.18), Color(white: 0.48), Color(red: 0.30, green: 0.45, blue: 0.70)),
                  dark: (Color(white: 0.13), Color(white: 0.88), Color(white: 0.55), Color(red: 0.50, green: 0.65, blue: 0.90))),
        ]
    }

    @State var mode: Mode = .system
    @State var theme = Theme.all[0]
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Form {
            Section {
                HStack(spacing: 14) {
                    ForEach(Mode.allCases) { m in
                        pick(m.rawValue, on: mode == m) { mode = m } preview: { modePreview(m) }
                    }
                }
                .padding(.vertical, 6)
            } header: {
                Text("Light or dark")
            }
            Section {
                HStack(spacing: 14) {
                    ForEach(Theme.all) { t in
                        pick(t.name, line: t.line, on: theme == t) { theme = t } preview: { themePreview(t) }
                    }
                }
                .padding(.vertical, 6)
            } header: {
                Text("Theme")
            } footer: {
                Text("A theme colours your notes and the window, on this Mac.")
                    .font(.system(size: 12)).foregroundStyle(Color.muted)
            }
        }
        .formStyle(.grouped)
        .scrollContentBackground(.hidden)
    }

    /// A card you click: its picture, then its name, with a ring when it's the one.
    private func pick(_ name: String, line: String? = nil, on: Bool, action: @escaping () -> Void, @ViewBuilder preview: () -> some View) -> some View {
        Button(action: action) {
            VStack(spacing: 8) {
                preview()
                    .frame(height: 92)
                    .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous).strokeBorder(Color.primary.opacity(0.12), lineWidth: 0.5))
                    .padding(3)
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(on ? Color.accentColor : .clear, lineWidth: 2.5))
                VStack(spacing: 1) {
                    Text(name).font(.system(size: 12, weight: on ? .semibold : .regular)).foregroundStyle(Color.ink)
                    if let line { Text(line).font(.system(size: 11)).foregroundStyle(Color.muted).lineLimit(1) }
                }
            }
            .frame(maxWidth: .infinity)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(line.map { "\(name), \($0)" } ?? name)
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    private func modePreview(_ m: Mode) -> some View {
        let t = theme
        return GeometryReader { geo in
            switch m {
            case .light: Self.window(t.light)
            case .dark: Self.window(t.dark)
            case .system:
                ZStack {
                    Self.window(t.light)
                    Self.window(t.dark).mask(alignment: .trailing) { Rectangle().frame(width: geo.size.width / 2) }
                }
            }
        }
    }

    private func themePreview(_ t: Theme) -> some View {
        Self.window(mode == .dark || (mode == .system && scheme == .dark) ? t.dark : t.light)
    }

    /// A small window: a sidebar strip and a note with a title, lines and a ticked box.
    static func window(_ c: (ground: Color, ink: Color, muted: Color, accent: Color)) -> some View {
        HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 5) {
                ForEach(0..<4, id: \.self) { i in
                    Capsule().fill(i == 1 ? c.accent : c.muted.opacity(0.5)).frame(width: i == 1 ? 26 : 22, height: 3.5)
                }
            }
            .padding(8)
            .frame(width: 44, alignment: .topLeading)
            .frame(maxHeight: .infinity, alignment: .top)
            .background(c.muted.opacity(0.10))
            VStack(alignment: .leading, spacing: 6) {
                Capsule().fill(c.ink).frame(width: 52, height: 6)
                Capsule().fill(c.muted.opacity(0.7)).frame(width: 74, height: 3.5)
                Capsule().fill(c.muted.opacity(0.7)).frame(width: 60, height: 3.5)
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(c.accent).frame(width: 7, height: 7)
                    Capsule().fill(c.muted.opacity(0.7)).frame(width: 40, height: 3.5)
                }
            }
            .padding(10)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .background(c.ground)
    }
}
#endif
