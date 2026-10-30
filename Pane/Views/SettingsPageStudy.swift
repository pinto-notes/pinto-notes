import SwiftUI

extension EnvironmentValues {
    /// Inside a Settings page that has its own title, so a page's first section needs none.
    @Entry var settingsAsPage = false
}

#if os(macOS)

/// Design study (2026-10-30): Settings as a big card over the notes, like Templates, with its
/// own sidebar of pages and the page beside it (System Settings', T3 Code's). Emil picked this
/// over a full page of the window. Off unless a capture shows it.
enum SettingsStudyPage: Hashable, Identifiable {
    case place(SettingsPlace)
    var id: String { title }

    var title: String {
        switch self {
        case .place(let p): p.title
        }
    }

    var symbol: String {
        switch self {
        case .place(let p): p.symbol
        }
    }

    /// The sidebar's groups: what you do most first, then you and your data, then help.
    static func groups(available: Set<SettingsPlace>) -> [[SettingsStudyPage]] {
        [[.place(.ai), .place(.general)],
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
    var close: () -> Void = {}
    @State private var profile = ProfileStore.shared

    /// The same card as Templates, so the two read as one kind of place.
    static let size = TemplateLibraryView.size

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 20, style: .continuous)
        HStack(spacing: 0) {
            sidebar
                .frame(width: 230)
                .frame(maxHeight: .infinity)
                .background(Color.primary.opacity(0.04))
            Divider().opacity(0.6)
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    Text(selected.title)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(Color.ink)
                        .accessibilityAddTraits(.isHeader)
                    Spacer(minLength: 16)
                    Button(action: close) {
                        Image(systemName: "xmark").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                            .frame(width: 28, height: 28).contentShape(Circle())
                    }
                    .buttonStyle(.quietIcon)
                    .keyboardShortcut(.cancelAction)
                    .accessibilityLabel("Close")
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                page(selected)
                    .environment(\.settingsAsPage, true)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
        }
        .frame(width: Self.size.width, height: Self.size.height)
        .background { shape.fill(SetupCards.ground).shadow(color: .black.opacity(0.2), radius: 30, y: 20) }
        .clipShape(shape)
        .overlay(shape.strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5))
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.28).onTapGesture(perform: close))
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 0) {
            you.padding(.bottom, 12)
            ForEach(Array(SettingsStudyPage.groups(available: available).enumerated()), id: \.offset) { i, group in
                if i > 0 { Divider().padding(.vertical, 8).padding(.trailing, 4) }
                ForEach(group) { row($0) }
            }
            Spacer()
        }
        .padding(.top, 16)
        .padding(.leading, 12)
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
#endif
