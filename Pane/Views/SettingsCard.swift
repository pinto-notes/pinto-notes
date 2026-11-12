import SwiftUI

extension EnvironmentValues {
    /// Inside a Settings page that has its own title, so a page's first section needs none.
    @Entry var settingsAsPage = false
    /// Mac: Settings fills a window of its own (SettingsWindow), not a sheet.
    @Entry var settingsInWindow = false
}

#if os(macOS)
/// Settings on the Mac is a window of its own, like System Settings (Emil, 7 November 2026: "lets
/// make it a separate window again. I like it now"; it was a sheet for a day).
@MainActor enum SettingsWindow {
    static let id = "settings"
    /// The window's content size: the card's, the sidebar and one page column.
    // 720 tall so Appearance (text size and its sample) and Privacy and security fit without
    // scrolling (council round 6, 11-04: both ran past the bottom at 600). Fits a 13-inch Mac.
    static let size = CGSize(width: 760, height: 640)
    /// Where the window's buttons end, from its top: a unified toolbar's height puts them 19 to
    /// 33 pt down (measured on macOS 27).
    static let buttonsEnd: CGFloat = 33
    /// The sidebar's search, a quiet 16 pt under the window's buttons (Emil, 7 November 2026: "some
    /// tasteful gap").
    static let sidebarTop: CGFloat = buttonsEnd + 16
    /// Back, Forward and the page's title on the line of the window's buttons (centred 26 pt down),
    /// as System Settings has them.
    static let headerTop: CGFloat = 12
    /// The title bar's safe area on a hidden-title-bar window.
    static let titleBarInset: CGFloat = 32
    /// Tests: how often it was asked to open. The test host makes no windows of its own.
    static var opened = 0
}

/// Navigation uses this card's State storage, so an earlier callback reads the current path.
/// Comparing the closure itself rebuilt the unchanged page on every search-field edit.
struct OpenSettingsPage: Equatable {
    var open: (SettingsPage) -> Void
    func callAsFunction(_ place: SettingsPage) { open(place) }
    static func == (a: Self, b: Self) -> Bool { true }
}

extension EnvironmentValues {
    /// Opens a page of Settings one level down (General's Keys for apps).
    @Entry var openSettingsPage: OpenSettingsPage? = nil
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
    let available: Set<SettingsPage>
    let page: (SettingsPage) -> AnyView
    /// Advanced protection is on Security (AdvancedProtection.shown), so search finds it.
    var advancedProtection = false
    /// The recovery key is on Security (RecoveryKeyOffer), so search finds it.
    var recoveryKey = false
    var route: SettingsRoute = .shared
    /// The page to open on; the first in the sidebar when nil.
    var start: SettingsPage?
    /// Over the notes window: closes it. Nil: Settings is in a sheet of its own (over another
    /// sheet, such as Make an app's), and closes that.
    var close: (() -> Void)?
    /// Captures: a search already typed.
    var search = ""

    /// Where you have been: Back and Forward walk it, and its place is what's shown (the sidebar
    /// page first, then any pages one level down from it, such as Account's Personal information).
    @State private var history = SettingsHistory()
    @State private var query = ""
    @State private var profile = ProfileStore.shared
    /// In a sheet: the size of the window it hangs on, measured once when it opens and again only
    /// when that window is resized. Measuring the main or key window on every redraw made the card
    /// change size when the app lost and regained focus (the sheet's own window became key, then
    /// none was).
    @State private var parent: CGSize?
    @Environment(\.dismiss) private var dismiss
    @Environment(\.settingsInWindow) private var inWindow
    #if DEBUG || QA
    @Environment(\.modelContext) private var context
    #endif

    /// Copied from System Settings, measured on macOS 27 (Emil, 7 November 2026: "copy someone"):
    /// its sidebar's width, field, account row and rows, its page margins, title and cards. Solid,
    /// as Emil chose over glass and tabs.
    static let size = SettingsWindow.size
    static let sidebarWidth: CGFloat = 232
    /// Room around the card on a window smaller than it.
    static let margin: CGFloat = 24
    /// The content column's widest: the rows read as one column, centred in the page area, not a
    /// stretch across the card (Emil, 2 November 2026).
    static let contentWidth: CGFloat = 488
    /// How far a page's own content sits in from its edges.
    static let pageInset: CGFloat = 20
    /// A page's widest: the content column and the page's own inset each side.
    static let pageWidth: CGFloat = contentWidth + 2 * pageInset
    /// Between the page and the card's sides on a narrow card, room for Back left of the title.
    static let gutter: CGFloat = 0
    /// Between two tabs, so their selection fill never touches the hover of the next.
    static let tabGap: CGFloat = 3
    /// Between the sidebar's groups, as wide as System Settings' (about a row's height less a
    /// little): 12 pt beside 3 pt row gaps read as a flaw, not a group (Emil, 7 November 2026).
    static let groupGap: CGFloat = 22
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
    static func first(_ available: Set<SettingsPage>) -> SettingsPage {
        SettingsPage.groups(available: available).first?.first ?? .appearance
    }

    /// While searching, the page beside the results is the first result's (rounds 20 to 23: "sync"
    /// listed Account's rows beside Appearance). Clearing the search goes back to where you were.
    static func pageWhileSearching(_ found: [SettingsIndex.Entry]) -> SettingsPage? { firstPage(of: found)?.page }
    /// That result, the one row that looks chosen (round 24: every row on its page did).
    static func firstPage(of found: [SettingsIndex.Entry]) -> SettingsIndex.Entry? { found.first { $0.menu == nil } }

    private var shown: SettingsPage {
        if !query.isEmpty, let hit = Self.pageWhileSearching(found) { return hit }
        return place.last ?? current
    }

    /// The place shown: the sidebar page, then the pages one level down from it.
    private var place: [SettingsPage] {
        if let p = history.place { return p }
        let first = start.flatMap { available.contains($0) ? $0 : nil } ?? Self.first(available)
        return first.parent.map { [$0, first] } ?? [first]
    }

    private var found: [SettingsIndex.Entry] {
        let settings = SettingsIndex.matches(query, available: available, advancedProtection: advancedProtection, recoveryKey: recoveryKey)
        guard available.contains(.shortcuts), !query.isEmpty else { return settings }
        return settings + SettingsIndex.shortcuts(query, in: Shortcuts.groups(in: shortcutMenus()))
    }

    /// The menu bar the shortcuts are read from; tests give their own.
    var shortcutMenus: () -> NSMenu? = { NSApp.mainMenu }
    private var current: SettingsPage { place.first ?? Self.first(available) }

    var body: some View {
        #if DEBUG || QA
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
            open(target)
            route.target = nil
        }
        .task(id: backend.state) { await profile.bind(backend) }
        .onChange(of: shown, initial: true) { _, now in
            route.page = now
            // The window opens where you left it.
            if inWindow, query.isEmpty, now.parent == nil { route.tab = now }
        }
        .onDisappear { route.page = nil }
    }

    private func open(_ place: SettingsPage) {
        guard available.contains(place) else { return }
        history.open(place, from: self.place)
    }

    /// A result: its page, or the menu item it moved to, run once Settings has closed.
    private func pick(_ entry: SettingsIndex.Entry) {
        guard let menu = entry.menu else { open(entry.page); return }
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
            sidebar
                .frame(width: Self.sidebarWidth)
                .frame(maxHeight: .infinity, alignment: .top)
                .background(SettingsInk.group)
            ColumnHairline.line
                .frame(maxHeight: .infinity)
                .settingsProbe("divider")
            pageArea
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

    /// The page beside the sidebar: its title, then the page's own form (it scrolls), one column
    /// no wider than `pageWidth`, centred.
    private var pageArea: some View {
        VStack(spacing: 0) {
            header
            page(shown)
                .onAppear { SettingsUsage.shared.opened(SettingsPageWord(shown)) }
                .environment(\.settingsAsPage, true)
                .environment(\.openSettingsPage, OpenSettingsPage { open($0) })
                .frame(maxWidth: Self.pageWidth, maxHeight: .infinity, alignment: .top)
                .settingsProbe("page")
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .padding(.horizontal, Self.gutter)
                // Not while searching: the page changes as you type, and this took the keyboard from
                // the search field, so "sync" stopped at "s" (round 24).
                .background { if query.isEmpty { NoInitialFocus() } }
                .id(shown)
                // The page scrolls under its own edge, never over the title and arrows above it
                // (Emil, 8 November 2026: the window's pictures drew over Appearance's title).
                .clipped()
        }
        .settingsProbe("area")
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }

    /// The page's name over the left edge of its content, the one line on what it's for under it,
    /// Back (one level down) just left of it, and × (Esc) at the card's corner.
    private var header: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 10) {
                arrows
                HStack(spacing: 6) {
                    // A page one level down names the page it's in, which takes you back to it
                    // (Emil, 8 November 2026: breadcrumbs, so a sub-page reads as one). The
                    // parent's name stays exactly where it was as that page's title: going deeper
                    // adds to the line, it doesn't move it (Emil, the same day).
                    if let up = shown.parent {
                        SettingsCrumb(title: up.title) { open(up) }
                            .settingsProbe("crumb")
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(SettingsInk.muted)
                            .accessibilityHidden(true)
                    }
                    Text(shown.title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(SettingsInk.text)
                        .lineLimit(1)
                        .accessibilityAddTraits(.isHeader)
                        .settingsProbe("title")
                }
                Spacer(minLength: 0)
            }
            .frame(minHeight: 28)
        }
        .padding(.horizontal, Self.pageInset)
        .frame(maxWidth: Self.pageWidth)
        .frame(maxWidth: .infinity)
        .padding(.horizontal, Self.gutter)
        .overlay(alignment: .topTrailing) {
            // The cards' one close × (CardCloseButton), solid like the card (Emil, 2 November 2026).
            // A window closes with its own button and ⌘W.
            if !inWindow {
                CardCloseButton(size: 24, action: closeNow)
                    .accessibilityIdentifier("settings.done")
                    .settingsProbe("close")
                    .padding(.trailing, 14)
            }
        }
        .padding(.top, inWindow ? SettingsWindow.headerTop : 12)
        .padding(.bottom, 6)
        // Solid and above the page, so nothing scrolled shows through it; the page fades itself out
        // under it (SettingsPageForm), as the notes list's soft edge.
        .background(SettingsInk.ground)
        .zIndex(1)
    }

    /// Back and Forward, as System Settings has them: one capsule, two chevrons, each greyed at its
    /// end of where you have been. ⌘[ and ⌘].
    private var arrows: some View {
        HStack(spacing: 0) {
            HistoryArrow(symbol: "chevron.left", label: "Back", id: "settings.back", key: "[", leading: true, enabled: history.canGoBack) { history.back() }
            SettingsInk.hairline.frame(width: 1, height: 14)
            HistoryArrow(symbol: "chevron.right", label: "Forward", id: "settings.forward", key: "]", leading: false, enabled: history.canGoForward) { history.forward() }
        }
        .frame(height: 28)
        .background(Capsule().fill(SettingsInk.group))
        .clipShape(Capsule())
        .overlay(Capsule().strokeBorder(SettingsInk.hairline, lineWidth: 0.5))
        .settingsProbe("arrows")
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 0) {
            searchField.padding(.bottom, 10)
            if query.isEmpty {
                if available.contains(.account) { accountRow.padding(.bottom, Self.groupGap - 6) }
                ForEach(Array(SettingsPage.groups(available: available).map { $0.filter { $0 != .account } }.filter { !$0.isEmpty }.enumerated()), id: \.offset) { i, group in
                    if i > 0 { Color.clear.frame(height: Self.groupGap) }
                    VStack(spacing: Self.tabGap) { ForEach(group) { row($0) } }
                }
            } else {
                results
            }
            // The version is at the top of General now, with updates (Emil, 7 November 2026).
            Spacer(minLength: 0)
        }
        .padding(.top, inWindow ? SettingsWindow.sidebarTop : 14)
        .padding(.horizontal, 10)
        .padding(.bottom, 12)
    }

    /// Search: a soft field, as quiet as the rows under it.
    private var searchField: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass").font(.system(size: 12)).foregroundStyle(SettingsInk.muted)
            TextField("Search", text: $query, prompt: Text("Search").foregroundStyle(SettingsInk.muted))
                .textFieldStyle(.plain)
                .focusEffectDisabled()
                .accessibilityLabel("Search Settings")
                .accessibilityIdentifier("settings.search")
            if !query.isEmpty {
                Button { query = "" } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(.tertiary) }
                    .buttonStyle(.quietIcon)
                    .accessibilityLabel("Clear search")
            }
        }
        .font(.system(size: 13))
        .padding(.horizontal, 8)
        .frame(height: 28)
        .background(SettingsInk.group, in: Capsule())
        .overlay(Capsule().strokeBorder(SettingsInk.hairline, lineWidth: 0.5))
    }

    /// What search finds: each setting by its words, with the page it's on; a click opens the page.
    @ViewBuilder private var results: some View {
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
                                icon(entry.page, on: shown == entry.page)
                            }
                            VStack(alignment: .leading, spacing: 1) {
                                Text(entry.label).font(.system(size: 13)).foregroundStyle(SettingsInk.text).lineLimit(1)
                                Text(entry.whereItIs).font(.system(size: 11)).foregroundStyle(SettingsInk.muted).lineLimit(1)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(highlight(entry.menu == nil && entry == Self.firstPage(of: found)))
                        .contentShape(.rect)
                        .hoverRow(reach: EdgeInsets())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(entry.label), \(entry.whereItIs)")
                    .accessibilityIdentifier(entry.menu.map { "settings.result.menu.\($0.rawValue)" } ?? "settings.result.\(entry.page.rawValue)")
                }
            }
        }
        .scrollBounceBehavior(.basedOnSize)
    }

    /// A page's icon in the accent, as iPhone's Settings rows have them; Account is your photo.
    @ViewBuilder private func icon(_ p: SettingsPage, on: Bool) -> some View {
        Group {
            if p == .account, case .signedIn = backend.state {
                AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 18)
            } else {
                Image(systemName: p.symbol).font(.system(size: 14)).foregroundStyle(SettingsInk.text)  // the text's colour, not the accent (Emil, 7 November 2026)
            }
        }
        .frame(width: 20)
    }

    /// Who you are, at the top, as System Settings has it: a photo, your name and the email you sign in with.
    private var accountRow: some View {
        let on = current == .account
        let named = AccountName.isSet(profile.name)
        return Button { open(.account) } label: {
            HStack(spacing: 9) {
                AvatarView(photo: profile.shownPhoto, name: named ? profile.name : nil, size: 36)
                VStack(alignment: .leading, spacing: 0) {
                    Text(named ? (profile.name ?? "Account") : "Account").font(.system(size: 13, weight: .semibold)).foregroundStyle(SettingsInk.text).lineLimit(1)
                    Text(Self.accountLine(backend)).font(.system(size: 11.5)).foregroundStyle(SettingsInk.muted).lineLimit(1).truncationMode(.middle)
                        .privateBlur(Self.accountLine(backend))
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 6)
            .frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
            .background(highlight(on))
            .contentShape(.rect)
            .hoverRow(reach: EdgeInsets())
        }
        .buttonStyle(.plain)
        .opensOnPress { open(.account) }
        .accessibilityAddTraits(on ? .isSelected : [])
        .accessibilityIdentifier("settings.account")
        .settingsProbe("tab.account")
    }

    /// Under your name: the email you sign in with (a label saying what kind of account said nothing), or how to sign in.
    static func accountLine(_ backend: Backend) -> String {
        if case .signedIn(let email) = backend.state { return accountLine(email: backend.displayEmail ?? email) }
        return "Sign in to sync"
    }

    /// An email to show under your name. Apple's relay address ("f7k6w27tsh@privaterelay.appleid.com")
    /// is random letters nobody knows, so it says how you sign in instead.
    static func accountLine(email: String) -> String { AccountLine.shown(email: email) }

    private func row(_ p: SettingsPage) -> some View {
        let on = current == p
        return Button { open(p) } label: {
            HStack(spacing: 8) {
                icon(p, on: on)
                Text(p.title)
                    .font(.system(size: 13, weight: on ? .medium : .regular))
                    .foregroundStyle(SettingsInk.text)
                    .lineLimit(1)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 8)
            .frame(maxWidth: .infinity, minHeight: 29, alignment: .leading)
            .background(highlight(on))
            .contentShape(.rect)
            .hoverRow(reach: EdgeInsets())
        }
        .buttonStyle(.plain)
        .opensOnPress { open(p) }
        .accessibilityAddTraits(on ? .isSelected : [])
        .accessibilityIdentifier("settings.\(p.rawValue)")
        .settingsProbe("tab.\(p.rawValue)")
    }

    private func highlight(_ on: Bool) -> some View {
        RoundedRectangle(cornerRadius: 10, style: .continuous).fill(on ? SettingsInk.selection : .clear)
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
        let key = NSApp.keyWindow
        guard route.presenting, Self.takes(active: appearsActive, key: key.map { .init(settings: $0.identifier?.rawValue.hasPrefix(SettingsWindow.id) == true, sheet: $0.sheetParent != nil) })
        else { return }
        route.presenting = false
        opening()
        // Its own window (SettingsWindow); one already open comes to the front at the page asked.
        SettingsWindow.opened += 1
        if !PaneApp.isUnitTestHost { openWindow(id: SettingsWindow.id) }
    }

    /// Whether a notes window takes a Settings request: it's in front, or no window is key (as at
    /// launch), or Settings itself is in front (⌘, or a link from there), or a sheet is (the
    /// sign-in card: signed out, ⌘, did nothing and the footer's "Turn off in Settings" led
    /// nowhere, council round 7).
    static func takes(active: Bool, key: KeyWindow?) -> Bool {
        guard !active, let key else { return true }
        return key.settings || key.sheet
    }

    /// What matters about the key window: whether it's Settings, or a sheet.
    struct KeyWindow { var settings = false, sheet = false }
}

/// One half of Back and Forward. Its hover fills exactly its half of the capsule, as System
/// Settings does, not a square inside it (Emil, 7 November 2026).
private struct HistoryArrow: View {
    let symbol: String, label: String, id: String
    let key: KeyEquivalent
    let leading: Bool
    let enabled: Bool
    let go: () -> Void
    @State private var hover = false

    var body: some View {
        let r: CGFloat = 14
        let half = UnevenRoundedRectangle(topLeadingRadius: leading ? r : 0, bottomLeadingRadius: leading ? r : 0,
                                          bottomTrailingRadius: leading ? 0 : r, topTrailingRadius: leading ? 0 : r, style: .continuous)
        Button(action: go) {
            Image(systemName: symbol).font(.system(size: 12, weight: .semibold))
                .foregroundStyle(enabled ? SettingsInk.text : SettingsInk.muted.opacity(0.5))
                .frame(width: 30, height: 28)
                .background(half.fill(SettingsInk.selection).opacity(hover && enabled ? 1 : 0))
                .contentShape(half)
        }
        .buttonStyle(.plain)
        .onHover { hover = $0 }
        .disabled(!enabled)
        .keyboardShortcut(key, modifiers: .command)
        .help(label)
        .accessibilityLabel(label)
        .accessibilityIdentifier(id)
    }
}

/// The Settings window's edge in dark mode: 1 pt of white at 10% inside the window's own corners
/// (a 2 pt stroke on its edge, half of it clipped by the window).
struct SettingsWindowEdge: View {
    @Environment(\.colorScheme) private var scheme
    static let opacity = 0.1

    var body: some View {
        if scheme == .dark {
            ConcentricRectangle()
                .stroke(Color.white.opacity(Self.opacity), lineWidth: 2)
                .ignoresSafeArea()
                .allowsHitTesting(false)
                .accessibilityHidden(true)
        }
    }
}
#endif

#if os(macOS)
/// The page a sub-page is in, before its title: muted, full strength under the pointer, and a
/// click goes back to it.
struct SettingsCrumb: View {
    let title: String
    let action: () -> Void
    @State private var hover = false

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(hover ? SettingsInk.text : SettingsInk.muted)
                .lineLimit(1)
                .frame(height: 26)
                // The hover reaches past the word, so the word itself never moves.
                .background(RoundedRectangle(cornerRadius: 6, style: .continuous).fill(SettingsInk.selection).opacity(hover ? 1 : 0).padding(.horizontal, -6))
                .contentShape(Rectangle().inset(by: -6))
        }
        .buttonStyle(.plain)
        .opensOnPress(action)
        .onHover { hover = $0 }
        .accessibilityLabel(title)
        .accessibilityHint("Goes back to \(title)")
        .accessibilityIdentifier("settings.crumb")
    }
}

extension View {
    /// Goes to its page as the button goes down, not when it comes back up, as System Settings'
    /// sidebar does (Emil, 8 November 2026: on release "it just makes it feel slower", with a hover
    /// already saying where you'll land). VoiceOver and the keyboard still press the button itself.
    func opensOnPress(_ action: @escaping () -> Void) -> some View { modifier(OpensOnPress(action: action)) }
}

private struct OpensOnPress: ViewModifier {
    let action: () -> Void
    @State private var down = false

    func body(content: Content) -> some View {
        content.highPriorityGesture(DragGesture(minimumDistance: 0)
            .onChanged { _ in if !down { down = true; action() } }
            .onEnded { _ in down = false })
    }
}
#endif
