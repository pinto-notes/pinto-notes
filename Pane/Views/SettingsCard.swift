import SwiftUI

extension EnvironmentValues {
    /// Inside a Settings page that has its own title, so a page's first section needs none.
    @Entry var settingsAsPage = false
    /// Mac: Settings fills a window of its own (SettingsWindow), not a sheet.
    @Entry var settingsInWindow = false
}

#if os(macOS)
/// Settings on the Mac is a window of its own, opened by ⌘, like Notes', Obsidian's and the
/// system's (UI council, 11-04): the note stays in view and live beside it, so a theme, accent or
/// text size is seen as it changes. A sheet hid the note and took the whole window.
@MainActor enum SettingsWindow {
    static let id = "settings"
    /// The window's content size: the card's, the sidebar and one page column.
    static let size = CGSize(width: 880, height: 600)
    /// Room above the sidebar for the window's buttons (it runs to the top, like System Settings').
    static let titleBar: CGFloat = 38
    /// The title bar's safe area on a hidden-title-bar window.
    static let titleBarInset: CGFloat = 32
    /// Tests: how often it was asked to open. The test host makes no windows of its own.
    static var opened = 0
}

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

/// Settings on the Mac: a big card over the notes window, like Templates, in the System Settings
/// form Emil picked on 3 November 2026: a flat sidebar on the card's own white or pure black (search,
/// then the groups of pages), a hairline, and the page beside it with its title and one plain line
/// on what it's for. Closes with ×, Esc or a click outside.
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
    /// Pages one level down from the selected one (Connect an AI's Keys for apps).
    @State private var path: [SettingsPlace] = []
    @State private var query = ""
    @State private var profile = ProfileStore.shared
    /// In a sheet: the size of the window it hangs on, measured once when it opens and again only
    /// when that window is resized. Measuring the main or key window on every redraw made the card
    /// change size when the app lost and regained focus (the sheet's own window became key, then
    /// none was).
    @State private var parent: CGSize?
    @Environment(\.dismiss) private var dismiss
    @Environment(\.networkReach) private var reach
    @Environment(\.settingsInWindow) private var inWindow
    #if DEBUG
    @Environment(\.modelContext) private var context
    #endif

    /// The same card as Templates, so the two read as one kind of place.
    static let size = TemplateLibraryView.size
    static let sidebarWidth: CGFloat = 210
    /// Room around the card on a window smaller than it.
    static let margin: CGFloat = 24
    /// The content column's widest: the rows read as one column, centred in the page area, not a
    /// stretch across the card (Emil, 2 November 2026).
    static let contentWidth: CGFloat = 580
    /// How far a page's own content sits in from its edges.
    static let pageInset: CGFloat = 20
    /// A page's widest: the content column and the page's own inset each side.
    static let pageWidth: CGFloat = contentWidth + 2 * pageInset
    /// Between the page and the card's sides on a narrow card, room for Back left of the title.
    static let gutter: CGFloat = 16
    /// Between two tabs, so their selection fill never touches the hover of the next.
    static let tabGap: CGFloat = 3
    /// The card's coordinate space, for `settingsProbe`.
    static let space = "settings.card"

    /// The window under a sheet, as first seen: the main window, else the key one. Tests stand in
    /// for it. Read once, when the card first shows (`parent`), never on a redraw.
    @MainActor static var frontWindowSize: () -> CGSize? = { (NSApp.mainWindow ?? NSApp.keyWindow)?.frame.size }

    /// The card's size in `space`: its own, or smaller on a small window, never too small to use.
    static func fitted(_ space: CGSize) -> CGSize {
        CGSize(width: min(size.width, max(600, space.width - 2 * margin)),
               height: min(size.height, max(420, space.height - 2 * margin)))
    }

    /// Where Settings opens: Account, else the first page there is.
    static func first(_ available: Set<SettingsPlace>) -> SettingsPlace {
        SettingsPlace.groups(available: available).first?.first ?? .appearance
    }

    private var shown: SettingsPlace { path.last ?? current }
    private var current: SettingsPlace { selected ?? start.flatMap { available.contains($0) ? $0 : nil } ?? Self.first(available) }

    var body: some View {
        #if DEBUG
        let _ = RenderProbe.count("SettingsCard", context: context)
        #endif
        Group {
            if inWindow {
                // The whole window, title bar too: the window is its content plus the title bar's
                // safe area, so the content asks for that much less and runs up under it.
                card(framed: false)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .settingsProbe("card")
                    .ignoresSafeArea()
                    .frame(width: SettingsWindow.size.width, height: SettingsWindow.size.height - SettingsWindow.titleBarInset)
            } else if let close {
                GeometryReader { geo in
                    let fit = Self.fitted(geo.size)
                    card(framed: true)
                        .frame(width: fit.width, height: fit.height)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .background(Color.black.opacity(0.18).onTapGesture(perform: close))
            } else {
                // In a sheet: as big as the window under it allows, measured once (`parent`).
                let fit = Self.fitted(parent ?? Self.size)
                card(framed: false)
                    .frame(width: fit.width, height: fit.height)
                    .settingsProbe("card")
                    .background(SheetParentReader { window in
                        if let size = window?.frame.size, size != parent { parent = size }
                    })
            }
        }
        .onAppear {
            if parent == nil { parent = Self.frontWindowSize() }
            if !search.isEmpty { query = search }
        }
        // A link into Settings (the account menu, a card, the storage warning) opens its page.
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

    /// A result: its page, or the menu item it moved to, run once Settings has closed.
    private func pick(_ entry: SettingsIndex.Entry) {
        guard let menu = entry.menu else { open(entry.place); return }
        if menu.closesSettings {
            closeNow()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { menu.run() }
        } else {
            menu.run()
        }
    }

    private func closeNow() {
        if let close { close() } else { dismiss() }
    }

    @ViewBuilder private func card(framed: Bool) -> some View {
        let shape = RoundedRectangle(cornerRadius: framed ? 22 : 0, style: .continuous)
        HStack(spacing: 0) {
            // Flat, on the card's own ground, like System Settings' sidebar (direction A).
            sidebar
                .frame(width: Self.sidebarWidth)
                .frame(maxHeight: .infinity, alignment: .top)
            SettingsInk.hairline.frame(width: 0.5)
            VStack(spacing: 0) {
                header
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        if reach != .online {
                            Label(OfflineCopy.settings, systemImage: OfflineCopy.symbol(reach))
                                .font(.system(size: 12.5))
                                .foregroundStyle(SettingsInk.muted)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.horizontal, 4)
                                .accessibilityIdentifier("settings.offline")
                        }
                        page(shown)
                            .environment(\.settingsAsPage, true)
                            .environment(\.openSettingsPlace, OpenSettingsPlace { path.append($0) })
                    }
                    .padding(.horizontal, Self.pageInset)
                    .padding(.top, 14)
                    .padding(.bottom, 28)
                    .frame(maxWidth: Self.pageWidth, alignment: .top)
                    .settingsProbe("page")
                    .frame(maxWidth: .infinity, alignment: .top)
                    .padding(.horizontal, Self.gutter)
                }
                .scrollIndicators(.automatic)
                .scrollBounceBehavior(.basedOnSize)
                .background(NoInitialFocus())
                .id(shown)
            }
            .settingsProbe("area")
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .coordinateSpace(.named(Self.space))
        .background {
            if framed { shape.fill(SettingsInk.ground).shadow(color: .black.opacity(0.22), radius: 30, y: 18) } else { SettingsInk.ground }
        }
        .clipShape(shape)
        .overlay { if framed { shape.strokeBorder(SettingsInk.edge, lineWidth: 0.5) } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Settings")
        .accessibilityAddTraits(inWindow ? [] : .isModal)
    }

    /// The page's name over the left edge of its content, the one line on what it's for under it,
    /// Back (one level down) just left of it, and × (Esc) at the card's corner.
    private var header: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 0) {
                Text(shown.title)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(SettingsInk.text)
                    .lineLimit(1)
                    .accessibilityAddTraits(.isHeader)
                    .settingsProbe("title")
                Spacer(minLength: 0)
            }
            .frame(minHeight: 28)
            .overlay(alignment: .leading) { if !path.isEmpty { back.offset(x: -34) } }
            Text(shown.intro)
                .font(.system(size: 13))
                .foregroundStyle(SettingsInk.muted)
                .lineLimit(2)
                .accessibilityIdentifier("settings.intro")
        }
        .padding(.horizontal, Self.pageInset)
        .frame(maxWidth: Self.pageWidth)
        .frame(maxWidth: .infinity)
        .padding(.horizontal, Self.gutter)
        .overlay(alignment: .topTrailing) {
            // The cards' one close × (CardCloseButton), solid like the card (Emil, 2 November 2026).
            // A window closes with its own button and ⌘W.
            if !inWindow {
                CardCloseButton(size: 28, action: closeNow)
                    .accessibilityIdentifier("settings.done")
                    .settingsProbe("close")
                    .padding(.trailing, 16)
            }
        }
        .padding(.top, inWindow ? SettingsWindow.titleBar : 18)
    }

    private var back: some View {
        Button { path.removeLast() } label: {
            Image(systemName: "chevron.left").font(.system(size: 14, weight: .semibold)).foregroundStyle(SettingsInk.text)
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
            searchField.padding(.bottom, 14)
            if query.isEmpty {
                ForEach(Array(SettingsPlace.groups(available: available).enumerated()), id: \.offset) { i, group in
                    if i > 0 { Color.clear.frame(height: 14) }
                    VStack(spacing: Self.tabGap) { ForEach(group) { row($0) } }
                }
            } else {
                results
            }
            Spacer(minLength: 0)
            // The version, small, where it's found when something goes wrong (Help's page went).
            Text("Version \(AboutSection.version)")
                .font(.system(size: 11))
                .foregroundStyle(SettingsInk.muted)
                .monospacedDigit()
                .textSelection(.enabled)
                .padding(.horizontal, 8)
                .accessibilityIdentifier("settings.version")
        }
        .padding(.top, inWindow ? SettingsWindow.titleBar + 8 : 18)
        .padding(.horizontal, 12)
        .padding(.bottom, 12)
    }

    /// Search on the sidebar's own ground: a hairline, no fill of its own.
    private var searchField: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass").font(.system(size: 12)).foregroundStyle(SettingsInk.muted)
            TextField("Search", text: $query, prompt: Text("Search").foregroundStyle(SettingsInk.muted))
                .textFieldStyle(.plain)
                .focusEffectDisabled()
                .accessibilityIdentifier("settings.search")
            if !query.isEmpty {
                Button { query = "" } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(.tertiary) }
                    .buttonStyle(.quietIcon)
                    .accessibilityLabel("Clear search")
            }
        }
        .font(.system(size: 13))
        .padding(.horizontal, 9)
        .frame(height: 28)
        .overlay(RoundedRectangle(cornerRadius: 7, style: .continuous).strokeBorder(SettingsInk.hairline, lineWidth: 1))
    }

    /// What search finds: each setting by its words, with the page it's on; a click opens the page.
    @ViewBuilder private var results: some View {
        let found = SettingsIndex.matches(query, available: available, advancedProtection: advancedProtection, recoveryKey: recoveryKey)
        if found.isEmpty {
            Text("No settings match \u{201C}\(query)\u{201D}")
                .font(.system(size: 12))
                .foregroundStyle(SettingsInk.muted)
                .padding(.horizontal, 8)
        }
        ScrollView {
            VStack(alignment: .leading, spacing: Self.tabGap) {
                ForEach(found, id: \.self) { entry in
                    Button { pick(entry) } label: {
                        HStack(spacing: 9) {
                            if let menu = entry.menu {
                                Image(systemName: menu.symbol).font(.system(size: 13)).foregroundStyle(SettingsInk.icon).frame(width: 20)
                            } else {
                                icon(entry.place, on: shown == entry.place)
                            }
                            VStack(alignment: .leading, spacing: 1) {
                                Text(entry.label).font(.system(size: 13)).foregroundStyle(SettingsInk.text).lineLimit(1)
                                Text(entry.whereItIs).font(.system(size: 11)).foregroundStyle(SettingsInk.muted).lineLimit(1)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(highlight(entry.menu == nil && shown == entry.place))
                        .contentShape(.rect)
                        .hoverRow(reach: EdgeInsets())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(entry.label), \(entry.whereItIs)")
                    .accessibilityIdentifier(entry.menu.map { "settings.result.menu.\($0.rawValue)" } ?? "settings.result.\(entry.place.rawValue)")
                }
            }
        }
        .scrollBounceBehavior(.basedOnSize)
    }

    /// A page's icon: monochrome; Account is your photo.
    @ViewBuilder private func icon(_ p: SettingsPlace, on: Bool) -> some View {
        Group {
            if p == .account, case .signedIn = backend.state {
                AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 20)
            } else {
                Image(systemName: p.symbol).font(.system(size: 13)).foregroundStyle(on ? SettingsInk.text : SettingsInk.icon)
            }
        }
        .frame(width: 20)
    }

    private func row(_ p: SettingsPlace) -> some View {
        let on = current == p
        return Button { open(p) } label: {
            HStack(spacing: 9) {
                icon(p, on: on)
                Text(p.title)
                    .font(.system(size: 13, weight: on ? .semibold : .regular))
                    .foregroundStyle(SettingsInk.text)
                    .lineLimit(1)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 8)
            .frame(maxWidth: .infinity, minHeight: 30, alignment: .leading)
            .background(highlight(on))
            .contentShape(.rect)
            .hoverRow(reach: EdgeInsets())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(on ? .isSelected : [])
        .accessibilityIdentifier("settings.\(p.rawValue)")
        .settingsProbe("tab.\(p.rawValue)")
    }

    private func highlight(_ on: Bool) -> some View {
        RoundedRectangle(cornerRadius: 7, style: .continuous).fill(on ? SettingsInk.selection : .clear)
    }
}

extension View {
    /// Settings' window (SettingsWindow) when it's asked for (⌘,, the account row, a link or a
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
    @Environment(\.appearsActive) private var appearsActive
    @Environment(\.openWindow) private var openWindow

    func body(content: Content) -> some View {
        content
            .onChange(of: route.presenting, initial: true) { take() }
            .onChange(of: appearsActive) { take() }
    }

    /// The request, if this is the window in front (or no window is key, as at launch). A request
    /// no window takes is dropped after a moment (SettingsRoute.show).
    private func take() {
        guard route.presenting, appearsActive || NSApp.keyWindow == nil || Self.settingsIsKey else { return }
        route.presenting = false
        opening()
        // Its own window (SettingsWindow); one already open comes to the front at the page asked.
        SettingsWindow.opened += 1
        if !PaneApp.isUnitTestHost { openWindow(id: SettingsWindow.id) }
    }

    /// ⌘, or a link while Settings itself is in front: the request is still the notes window's.
    private static var settingsIsKey: Bool {
        NSApp.keyWindow?.identifier?.rawValue.hasPrefix(SettingsWindow.id) ?? false
    }
}
#endif
