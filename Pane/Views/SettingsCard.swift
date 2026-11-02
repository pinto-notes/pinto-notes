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
    /// A page's widest: the rows read as one column, not a stretch across the card.
    static let pageWidth: CGFloat = 640

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
            VStack(alignment: .leading, spacing: 0) {
                header
                page(shown)
                    .environment(\.settingsAsPage, true)
                    .environment(\.openSettingsPlace, OpenSettingsPlace { path.append($0) })
                    .frame(maxWidth: Self.pageWidth, maxHeight: .infinity, alignment: .topLeading)
                    .id(shown)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .background {
            if framed { shape.fill(SetupCards.ground).shadow(color: .black.opacity(0.2), radius: 30, y: 20) } else { SetupCards.ground }
        }
        .clipShape(shape)
        .overlay { if framed { shape.strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5) } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Settings")
        .accessibilityAddTraits(.isModal)
    }

    /// Back (on a page one level down), the page's name, and × (Esc).
    private var header: some View {
        HStack(alignment: .center, spacing: 6) {
            if !path.isEmpty {
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
            Text(shown.title)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Color.ink)
                .lineLimit(1)
                .accessibilityAddTraits(.isHeader)
            Spacer(minLength: 16)
            // The cards' one close × (CardCloseButton), solid like the card (Emil, 2 November 2026).
            CardCloseButton(size: 28, action: closeNow)
                .accessibilityIdentifier("settings.done")
        }
        // In line with the rows of the page's form under it.
        .padding(.leading, path.isEmpty ? 30 : 22)
        .padding(.trailing, 16)
        .padding(.top, 18)
        .padding(.bottom, 2)
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 0) {
            searchField.padding(.bottom, 12)
            if query.isEmpty {
                if available.contains(.profile) { you.padding(.bottom, 10) }
                ForEach(Array(SettingsPlace.groups(available: available).enumerated()), id: \.offset) { i, group in
                    if i > 0 { Divider().padding(.vertical, 8).padding(.horizontal, 7) }
                    ForEach(group) { row($0) }
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
            VStack(alignment: .leading, spacing: 0) {
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
                    // In a view of its own that has the mouse while it's up (PopupHost): its tabs
                    // lit the folders behind them, and the note's text cursor showed over it.
                    PopupHost(content: SettingsView(backend: backend, sync: sync, route: route, close: { withAnimation(.snappy(duration: 0.2)) { showing = false } }))
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
