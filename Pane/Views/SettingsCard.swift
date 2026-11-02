import SwiftUI

extension EnvironmentValues {
    /// Inside a Settings page that has its own title, so a page's first section needs none.
    @Entry var settingsAsPage = false
}

#if os(macOS)
/// Navigation uses this card's State storage, so an earlier callback reads the current path.
/// Comparing the closure itself rebuilt the unchanged page on every search-field edit.
struct OpenSettingsPlace: Equatable {
    var open: (SettingsPlace) -> Void
    func callAsFunction(_ place: SettingsPlace) { open(place) }
    static func == (a: Self, b: Self) -> Bool { true }
}

extension EnvironmentValues {
    /// Opens a page of Settings one level down (General's Keys for apps).
    @Entry var openSettingsPlace: OpenSettingsPlace? = nil
    /// Tests: told where the card's parts land (the title, the page, each tab), in the card's space.
    @Entry var settingsLayoutProbe: ((String, CGRect) -> Void)? = nil
}

extension View {
    /// Reports this view's frame in the Settings card to `settingsLayoutProbe`, when a test set one.
    func settingsProbe(_ name: String) -> some View { modifier(SettingsProbe(name: name)) }
}

private struct SettingsProbe: ViewModifier {
    let name: String
    @Environment(\.settingsLayoutProbe) private var probe

    func body(content: Content) -> some View {
        if let probe {
            content.onGeometryChange(for: CGRect.self) { $0.frame(in: .named(SettingsCard.space)) } action: { probe(name, $0) }
        } else {
            content
        }
    }
}

/// Settings on the Mac: a big card over the notes window, like Templates, with a sidebar of pages
/// (search, you, then the groups) and the page beside it, as System Settings has (Emil picked it
/// on 2026-10-30). Closes with ×, Esc or a click outside.
struct SettingsCard: View {
    let backend: Backend
    let available: Set<SettingsPlace>
    let page: (SettingsPlace) -> AnyView
    /// Advanced protection is on Security (AdvancedProtection.shown), so search finds it.
    var advancedProtection = false
    /// The recovery key is on Security (RecoveryKeyOffer), so search finds it.
    var recoveryKey = false
    var route: SettingsRoute = .shared
    /// The page to open on; the first in the sidebar when nil.
    var start: SettingsPlace?
    /// Over the notes window: closes it. Nil: Settings is in a sheet of its own (over another
    /// sheet, such as Make an app's), and closes that.
    var close: (() -> Void)?
    /// Captures: a search already typed.
    var search = ""

    @State private var selected: SettingsPlace?
    /// Pages one level down from the selected one (General's Keys for apps).
    @State private var path: [SettingsPlace] = []
    @State private var query = ""
    @State private var profile = ProfileStore.shared
    @Environment(\.dismiss) private var dismiss
    #if DEBUG
    @Environment(\.modelContext) private var context
    #endif

    /// The same card as Templates, so the two read as one kind of place.
    static let size = TemplateLibraryView.size
    static let sidebarWidth: CGFloat = 240
    /// Room around the card on a window smaller than it.
    static let margin: CGFloat = 24
    /// The content column's widest: the rows read as one column, centred in the page area, not a
    /// stretch across the card (Emil, 2 November 2026).
    static let contentWidth: CGFloat = 580
    /// How far a page's own content sits in from its edges: a grouped form's boxes, and the custom
    /// pages (Security, Connect an AI) pad the same.
    static let pageInset: CGFloat = 20
    /// A page's widest: the content column and the page's own inset each side.
    static let pageWidth: CGFloat = contentWidth + 2 * pageInset
    /// Between the page and the card's sides on a narrow card, room for Back left of the title.
    static let gutter: CGFloat = 16
    /// Between two tabs, so their hover and selection fills never touch.
    static let tabGap: CGFloat = 3
    /// The card's coordinate space, for `settingsProbe`.
    static let space = "settings.card"

    /// The card's size in `space`: its own, or smaller on a small window, never too small to use.
    static func fitted(_ space: CGSize) -> CGSize {
        CGSize(width: min(size.width, max(600, space.width - 2 * margin)),
               height: min(size.height, max(420, space.height - 2 * margin)))
    }

    /// Where Settings opens: Connect an AI when it's there, else the first page there is.
    static func first(_ available: Set<SettingsPlace>) -> SettingsPlace {
        SettingsPlace.groups(available: available).first?.first ?? .general
    }

    private var shown: SettingsPlace { path.last ?? current }
    private var current: SettingsPlace { selected ?? start.flatMap { available.contains($0) ? $0 : nil } ?? Self.first(available) }

    var body: some View {
        #if DEBUG
        let _ = RenderProbe.count("SettingsCard", context: context)
        #endif
        Group {
            if let close {
                GeometryReader { geo in
                    let fit = Self.fitted(geo.size)
                    card(framed: true)
                        .frame(width: fit.width, height: fit.height)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .background(Color.black.opacity(0.18).onTapGesture(perform: close))
            } else {
                // In a sheet: as big as the window under it allows.
                let fit = Self.fitted((NSApp.mainWindow ?? NSApp.keyWindow)?.frame.size ?? Self.size)
                card(framed: false).frame(width: fit.width, height: fit.height)
            }
        }
        .onAppear { if !search.isEmpty { query = search } }
        // A link into Settings (the account row, a card, the storage warning) opens its page.
        .onChange(of: route.target, initial: true) { _, target in
            guard let target else { return }
            open(SettingsPlace(target))
            route.target = nil
        }
        .task(id: backend.state) { await profile.bind(backend) }
        .onChange(of: shown, initial: true) { _, now in route.page = now }
        .onDisappear { route.page = nil }
    }

    private func open(_ place: SettingsPlace) {
        guard available.contains(place) else { return }
        path = []
        selected = place
    }

    private func closeNow() {
        if let close { close() } else { dismiss() }
    }

    @ViewBuilder private func card(framed: Bool) -> some View {
        let shape = RoundedRectangle(cornerRadius: framed ? 26 : 0, style: .continuous)
        HStack(spacing: 0) {
            // The sidebar sits inside the card on a soft solid ground: glass only where macOS puts
            // it (the window's toolbar and sidebar), solid inside our own cards (Emil, 2 November 2026).
            sidebar
                .frame(width: Self.sidebarWidth)
                .frame(maxHeight: .infinity)
                .background(Color.soft, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                .padding(8)
            VStack(spacing: 0) {
                header
                // The page in one column, centred; its title above its left edge (header).
                page(shown)
                    .environment(\.settingsAsPage, true)
                    .environment(\.openSettingsPlace, OpenSettingsPlace { path.append($0) })
                    .frame(maxWidth: Self.pageWidth, maxHeight: .infinity, alignment: .top)
                    .settingsProbe("page")
                    .id(shown)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .padding(.horizontal, Self.gutter)
            }
            .settingsProbe("area")
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .coordinateSpace(.named(Self.space))
        .background {
            if framed { shape.fill(SetupCards.ground).shadow(color: .black.opacity(0.2), radius: 30, y: 20) } else { SetupCards.ground }
        }
        .clipShape(shape)
        .overlay { if framed { shape.strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5) } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Settings")
        .accessibilityAddTraits(.isModal)
    }

    /// The page's name over the left edge of its content, Back (one level down) just left of it,
    /// and × (Esc) at the card's corner.
    private var header: some View {
        HStack(spacing: 0) {
            Text(shown.title)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Color.ink)
                .lineLimit(1)
                .accessibilityAddTraits(.isHeader)
                .settingsProbe("title")
            Spacer(minLength: 0)
        }
        .frame(minHeight: 28)
        .overlay(alignment: .leading) { if !path.isEmpty { back.offset(x: -34) } }
        .padding(.horizontal, Self.pageInset)
        .frame(maxWidth: Self.pageWidth)
        .frame(maxWidth: .infinity)
        .padding(.horizontal, Self.gutter)
        .overlay(alignment: .trailing) {
            // The cards' one close × (CardCloseButton), solid like the card (Emil, 2 November 2026).
            CardCloseButton(size: 28, action: closeNow)
                .accessibilityIdentifier("settings.done")
                .padding(.trailing, 16)
        }
        .padding(.top, 18)
        .padding(.bottom, 2)
    }

    private var back: some View {
        Button { path.removeLast() } label: {
            Image(systemName: "chevron.left").font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.ink)
                .frame(width: 28, height: 28).contentShape(Circle())
        }
        .buttonStyle(.quietIcon)
        .keyboardShortcut("[", modifiers: .command)
        .help("Back")
        .accessibilityLabel("Back")
        .accessibilityIdentifier("settings.back")
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 0) {
            searchField.padding(.bottom, 12)
            if query.isEmpty {
                if available.contains(.profile) { you.padding(.bottom, 10) }
                ForEach(Array(SettingsPlace.groups(available: available).enumerated()), id: \.offset) { i, group in
                    if i > 0 { Divider().padding(.vertical, 8).padding(.horizontal, 7) }
                    VStack(spacing: Self.tabGap) { ForEach(group) { row($0) } }
                }
            } else {
                results
            }
            Spacer(minLength: 0)
        }
        .padding(.top, 16)
        .padding(.horizontal, 10)
    }

    /// Search, in a fill of its own so it never reads as one of the rows.
    private var searchField: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
            TextField("Search", text: $query).textFieldStyle(.plain)
                .accessibilityIdentifier("settings.search")
            if !query.isEmpty {
                Button { query = "" } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(.tertiary) }
                    .buttonStyle(.quietIcon)
                    .accessibilityLabel("Clear search")
            }
        }
        .font(.system(size: 13))
        .padding(.horizontal, 9)
        .frame(height: 30)
        .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(Color(Palette.searchFill)))
    }

    /// What search finds: each setting by its words, with the page it's on; a click opens the page.
    @ViewBuilder private var results: some View {
        let found = SettingsIndex.matches(query, available: available, advancedProtection: advancedProtection, recoveryKey: recoveryKey)
        if found.isEmpty {
            Text("No settings match \u{201C}\(query)\u{201D}")
                .font(.system(size: 12))
                .foregroundStyle(Color.muted)
                .padding(.horizontal, 7)
        }
        ScrollView {
            VStack(alignment: .leading, spacing: Self.tabGap) {
                ForEach(found, id: \.self) { entry in
                    Button { open(entry.place) } label: {
                        HStack(spacing: 8) {
                            SidebarIcon(name: entry.place.symbol, selected: shown == entry.place)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(entry.label).font(.system(size: 13)).foregroundStyle(Color.ink).lineLimit(1)
                                Text(entry.place.title).font(.system(size: 11)).foregroundStyle(Color.muted).lineLimit(1)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 7)
                        .padding(.vertical, 5)
                        .background(highlight(shown == entry.place))
                        .contentShape(.rect)
                        .hoverRow(reach: EdgeInsets())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(entry.label), \(entry.place.title)")
                    .accessibilityIdentifier("settings.result.\(entry.place.rawValue)")
                }
            }
        }
        .scrollBounceBehavior(.basedOnSize)
    }

    /// You, at the top: photo and name, opening Profile.
    private var you: some View {
        Button { open(.profile) } label: {
            HStack(spacing: 10) {
                AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 34)
                VStack(alignment: .leading, spacing: 1) {
                    Text(AccountName.shown(profile.name)).font(.system(size: 13, weight: .semibold)).foregroundStyle(Color.ink).lineLimit(1)
                    Text("Name, photo and sign in").font(.system(size: 11)).foregroundStyle(Color.muted).lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 7)
            .padding(.vertical, 6)
            .background(highlight(current == .profile))
            .contentShape(.rect)
            .hoverRow(reach: EdgeInsets())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(AccountName.shown(profile.name)). Name, photo and sign in")
        .accessibilityAddTraits(current == .profile ? .isSelected : [])
        .accessibilityIdentifier("settings.profile")
    }

    private func row(_ p: SettingsPlace) -> some View {
        Button { open(p) } label: {
            Label {
                Text(p.title).foregroundStyle(Color.ink)
            } icon: {
                SidebarIcon(name: p.symbol, selected: current == p)
            }
            .sidebarRowLabel()
            .padding(.horizontal, 7)
            .frame(maxWidth: .infinity, minHeight: 30, alignment: .leading)
            .background(highlight(current == p))
            .contentShape(.rect)
            .hoverRow(reach: EdgeInsets())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(current == p ? .isSelected : [])
        .accessibilityIdentifier("settings.\(p.rawValue)")
        .settingsProbe("tab.\(p.rawValue)")
    }

    private func highlight(_ on: Bool) -> some View {
        RoundedRectangle(cornerRadius: 8, style: .continuous).fill(on ? Color.primary.opacity(0.08) : .clear)
    }
}

extension View {
    /// Settings as a card over this window when it's asked for (⌘,, the account row, a link or a
    /// card: SettingsRoute) and this is the window in front. `opening`: close what it replaces.
    func settingsCard(backend: Backend?, sync: SyncEngine?, route: SettingsRoute = .shared, opening: @escaping () -> Void = {}) -> some View {
        modifier(SettingsCardHost(backend: backend, sync: sync, route: route, opening: opening))
    }
}

struct SettingsCardHost: ViewModifier {
    let backend: Backend?
    let sync: SyncEngine?
    let route: SettingsRoute
    let opening: () -> Void
    @State private var showing = false
    @Environment(\.appearsActive) private var appearsActive

    func body(content: Content) -> some View {
        content
            .overlay {
                if showing, let backend {
                    SettingsView(backend: backend, sync: sync, route: route, close: { withAnimation(.snappy(duration: 0.2)) { showing = false } })
                        // Over the top bar too: the card and its dimming reach the window's top edge.
                        .ignoresSafeArea()
                        // Grows in a little as it fades, as a sheet does; leaves the same way.
                        .transition(.opacity.combined(with: .scale(scale: 0.97)))
                }
            }
            .onChange(of: route.presenting, initial: true) { take() }
            .onChange(of: appearsActive) { take() }
    }

    /// The request, if this is the window in front (or no window is key, as at launch). A request
    /// no window takes is dropped after a moment (SettingsRoute.show).
    private func take() {
        guard route.presenting, appearsActive || NSApp.keyWindow == nil else { return }
        route.presenting = false
        withAnimation(.snappy(duration: 0.2)) {
            opening()
            showing = true
        }
    }
}
#endif
