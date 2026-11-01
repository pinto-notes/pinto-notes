#if os(macOS)
import AppKit
import SwiftData
import Supabase
import SwiftUI
import Testing
@testable import Pane

/// The sidebar study (`SidebarStudy`, 2026-10-30): Templates and Import above your profile,
/// and the AI's mark on the notes it made, in the real window, light and dark. Offscreen:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/SidebarStudySnapshots`.
@MainActor @Suite(.serialized) struct SidebarStudySnapshots {
    static let size = CGSize(width: 1180, height: 760)

    /// The real sidebar, laid where the window's own is: an offscreen capture draws the window's
    /// sidebar glass as a blank panel, and the sidebar on its own draws as it does on screen.
    private func window(_ study: SidebarStudy, library: ModelContainer, over card: (some View)? = Optional<EmptyView>.none) -> some View {
        ZStack(alignment: .topLeading) {
            RootView().allowsHitTesting(false)
            NavigationStack { SidebarView(scope: .constant(.all), onNewNote: {}) }
                .overlay(alignment: .bottomLeading) { Self.foot }
                .frame(width: 259, height: Self.size.height - 16)
                .background(Color(nsColor: .windowBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .padding(8)
            if let card { card.frame(maxWidth: .infinity, maxHeight: .infinity) }
        }
        .environment(\.sidebarStudy, study)
        .environment(\.controlActiveState, .key)
        .tint(Color(PColor.paneAccent))
        .modelContainer(library)
    }

    /// The sidebar's foot as the signed-in app draws it: Templates and Import, then you. Drawn
    /// over the sidebar because a signed-in sidebar draws no folders offscreen (the Mac look's
    /// own signed-in shots are blank too, 2026-10-30).
    static var foot: some View {
        VStack(alignment: .leading, spacing: 4) {
            SidebarStudyRows()
            .padding(.leading, SidebarStyle.edge(nested: true))
            .padding(.bottom, 4)
            AccountButton(backend: backend)
                .padding(.leading, SidebarStyle.edge(nested: true) - 8)
        }
        .padding(.trailing, 10)
        .padding(.bottom, 8)
    }

    /// Signed in, so the foot shows you.
    static let backend: Backend = {
        let b = Backend()
        b.showSignedInForPreview(email: "sara@example.com")
        return b
    }()

    /// The demo library with three notes your AIs made, already read (the mark stays after).
    static func library() throws -> ModelContainer {
        let c = try AppSnapshotTests.container()
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
        for (title, ai) in [("Trip documents", "ChatGPT"), ("Groceries", "Claude"), ("Evening tracker", "ChatGPT")] {
            guard let n = notes.first(where: { $0.title == title }) else { continue }
            n.aiEditor = ai
            n.aiEditedAt = .now
            n.aiSeenAt = n.aiEditedAt
        }
        try c.mainContext.save()
        return c
    }

    @Test(arguments: [false, true])
    func study(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let both = SidebarStudy()
        let lib = try Self.library()
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        try await AppSnapshotTests.withLastNote(lib, "Trip documents") { try await shots(both, lib: lib, mode: mode, dark: dark) }
    }

    private func shots(_ both: SidebarStudy, lib: ModelContainer, mode: String, dark: Bool) async throws {
        try await AppSnapshotTests.shoot(window(both, library: lib), name: "study-marks-\(mode)", size: Self.size, dark: dark, wait: 1.0)
        let sidebar = NavigationStack { SidebarView(scope: .constant(.all), onNewNote: {}) }
            .overlay(alignment: .bottomLeading) { Self.foot }
            .frame(width: 260, height: 560)
            .environment(\.sidebarStudy, both)
            .environment(\.controlActiveState, .key)
            .tint(Color(PColor.paneAccent))
            .modelContainer(lib)
        try await AppSnapshotTests.render(sidebar, name: "study-sidebar-\(mode)", dark: dark)
        // Connect an AI opens the sheet: ChatGPT and Claude checked, every other AI to add.
        // Settings → AI lists them too, each with Disconnect.
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        let connected = [Connection(id: UUID(), name: "ChatGPT", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "chatgpt.com"),
                         Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "claude.ai")]
        try await AppSnapshotTests.render(ConnectAISheet(client: client, preview: connected, previewFound: []), name: "study-connect-sheet-\(mode)", dark: dark)
        try await AppSnapshotTests.render(Form { ConnectAISection(client: client, preview: connected) }.formStyle(.grouped).frame(width: 520, height: 640)
            .environment(ConnectGuideRoute()), name: "study-settings-ai-\(mode)", dark: dark, wait: 1)
        // One design for both (`connectStudy`): your AIs, two Claude accounts among them, then
        // every AI to add, the line on what is sent under them.
        let three = connected + [Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now.addingTimeInterval(-86_400 * 12), last_used_at: .now.addingTimeInterval(-86_400 * 2), revoked_at: nil, redirect_host: "claude.ai")]
        try await AppSnapshotTests.render(ConnectAISheet(client: client, preview: three, previewFound: []).environment(\.connectStudy, true), name: "study-yours-sheet-\(mode)", dark: dark)
        try await AppSnapshotTests.render(Form { ConnectAISection(client: client, preview: three) }.formStyle(.grouped).frame(width: 520, height: 640)
            .environment(ConnectGuideRoute()).environment(\.connectStudy, true), name: "study-yours-settings-\(mode)", dark: dark, wait: 1)
        // Templates in the sidebar opens the same gallery as the last setup card.
        let gallery = SetupCardsFlow(store: OnboardingStore(defaults: TestDefaults()), backend: Backend(), preview: .init(card: .gallery), finish: { _ in })
        try await AppSnapshotTests.shoot(window(both, library: lib, over: gallery), name: "study-templates-\(mode)", size: Self.size, dark: dark, wait: 1.0)
    }

    /// Settings, the card over the notes (SettingsCard): Appearance in Default light and dark and
    /// in Sepia dark, General, and a search for "theme". Into docs/Evidence/settings-card with
    /// `TEST_RUNNER_AMBER_HIG_SHOTS=$PWD/docs/Evidence/settings-card scripts/qa-test.sh 'PaneTests/SidebarStudySnapshots/settingsCard()'`.
    @Test func settingsCard() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let lib = try Self.library()
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        let kept = ThemeStore.shared.current
        defer {
            ProfileStore.shared.showForPreview(name: nil, photo: nil)
            ThemeStore.shared.set(kept, persist: false)
        }
        let three = [Connection(id: UUID(), name: "ChatGPT", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "chatgpt.com"),
                     Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "claude.ai")]
        // Signed in with everything there: every page in the sidebar.
        let fixture = try await AppSnapshotTests.settingsFixture()
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        func card(_ start: SettingsPlace, search: String = "") -> SettingsView {
            var v = fixture
            v.connections = three
            v.start = start
            v.search = search
            v.close = {}
            return v
        }
        let shots: [(String, SettingsPlace, String, Theme, Bool)] = [
            ("appearance-default-light", .appearance, "", .standard, false),
            ("appearance-default-dark", .appearance, "", .standard, true),
            ("appearance-sepia-dark", .appearance, "", .sepia, true),
            ("general-light", .general, "", .standard, false),
            ("search-theme-light", .appearance, "theme", .standard, false),
            ("ai-light", .ai, "", .standard, false),
        ]
        try await AppSnapshotTests.withLastNote(lib, "Trip documents") {
            for (name, start, search, theme, dark) in shots {
                ThemeStore.shared.set(ThemeLook(theme: theme, accent: .theme), persist: false)
                let view = window(SidebarStudy(), library: lib, over: card(start, search: search))
                try await AppSnapshotTests.shoot(view, name: "mac-settings-card-\(name)", size: Self.size, dark: dark, wait: 1.2)
            }
        }
    }

    /// Settings › Security and Help and feedback (feature/settings-help), in the card over the
    /// notes and as whole pages, light and dark: Security with Pinto Notes keeping a copy of the
    /// key (most accounts) and without one, offline, and Help signed in and out. Into
    /// docs/Evidence/settings-help with `TEST_RUNNER_AMBER_HIG_SHOTS=$PWD/docs/Evidence/settings-help
    /// scripts/qa-test.sh 'PaneTests/SidebarStudySnapshots/settingsHelp()'`.
    @Test func settingsHelp() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let lib = try Self.library()
        let fixture = try await AppSnapshotTests.settingsFixture()
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let withCopy = await AddDeviceSnapshots.readyWithCopy()
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "settings-help-\(UUID())")!)
        var copy = SettingsView(backend: fixture.backend, sync: nil, crypto: withCopy, devices: AddDeviceSnapshots.devices([AddDeviceSnapshots.stale]), route: route)
        copy.close = {}
        var signedOut = SettingsView(backend: Backend(), sync: nil, route: route)
        signedOut.close = {}
        func card(_ v: SettingsView, _ start: SettingsPlace) -> SettingsView {
            var v = v
            v.start = start
            v.close = {}
            return v
        }
        let cards: [(String, SettingsView, SettingsPlace)] = [
            ("security-copy", copy, .security), ("security-nocopy", fixture, .security),
            ("help", fixture, .help), ("help-signedout", signedOut, .help),
        ]
        try await AppSnapshotTests.withLastNote(lib, "Trip documents") {
            for (name, v, start) in cards {
                for dark in [false, true] {
                    let view = window(SidebarStudy(), library: lib, over: card(v, start))
                    try await AppSnapshotTests.shoot(view, name: "mac-\(name)-\(dark ? "dark" : "light")", size: Self.size, dark: dark, wait: 1.2)
                }
            }
        }
        // Whole pages, as tall as they are, at the card's page width.
        let pages: [(String, AnyView, Bool, CGFloat)] = [
            ("security-copy-full", AnyView(copy.page(.security)), false, 1180), ("security-copy-full", AnyView(copy.page(.security)), true, 1180),
            ("security-nocopy-full", AnyView(fixture.page(.security)), false, 1180),
            ("security-offline-full", AnyView(copy.page(.security).environment(\.networkReach, .offline)), false, 1180),
            ("help-full", AnyView(fixture.page(.help)), false, 820), ("help-full", AnyView(fixture.page(.help)), true, 820),
        ]
        for (name, page, dark, height) in pages {
            try await AppSnapshotTests.render(page.frame(width: 600, height: height).tint(Color(PColor.paneAccent)),
                                              name: "mac-\(name)-\(dark ? "dark" : "light")", dark: dark, wait: 1.0)
        }
    }

    /// Templates in the sidebar opens every template as a page of the window, and a card opens
    /// its template with Make with the AI you use.
    @Test(arguments: [false, true])
    func templateLibrary(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let lib = try Self.library()
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let catalog = TemplateCatalog.shipped
        let picks: [(String, TemplateCatalog.Entry?)] = [("templates-library", nil),
                                                         ("templates-open", catalog.entries.first { $0.slug == "meeting-notes" }),
                                                         ("templates-open-app", catalog.entries.first { $0.slug == "trip-plan" })]
        try await AppSnapshotTests.withLastNote(lib, "Trip documents") {
            for (name, open) in picks {
                let view = window(SidebarStudy(), library: lib, over: TemplateLibraryView(catalog: catalog, ais: [.chatgpt, .claude], open: open))
                try await AppSnapshotTests.shoot(view, name: "\(name)-\(mode)", size: Self.size, dark: dark, wait: 1.0)
            }
        }
    }

    /// The app carries every template of the website, and the kinds and search narrow them.
    @Test func theLibraryHasEveryTemplate() {
        let c = TemplateCatalog.shipped
        #expect(c.entries.count >= 23)
        #expect(c.shown(filter: "All", query: "").count == c.entries.count)
        let apps = c.shown(filter: "Apps", query: "").allSatisfy(\.app)
        let work = c.shown(filter: "Work", query: "").allSatisfy { $0.category == "Work" }
        let found = c.shown(filter: "All", query: "trip").map(\.slug)
        let covers = c.entries.filter { Bundle.main.url(forResource: "template-cover-\($0.slug)", withExtension: "jpg") == nil }.map(\.slug)
        #expect(apps && work)
        #expect(found.contains("trip-plan"))
        #expect(covers.isEmpty)
        #expect(SetupCards.prompt(c.entries[0].pick).hasPrefix("In Pinto Notes, use my Habit tracker note."))
        // In use: every template has its filled-in note, and every app its picture.
        // The cards fill the row: five across 1000 pt, none narrower than the gallery's.
        let w = TemplateLibraryView.cardWidth(row: 992, gap: 16)
        #expect(w >= SetupTemplateCard.size.width && 5 * w + 4 * 16 <= 992 && 5 * w + 4 * 16 > 992 - 5)
        let bare = c.entries.filter { $0.example.isEmpty || ($0.app && $0.appPicture(dark: false) == nil) }.map(\.slug)
        #expect(bare.isEmpty)
    }

    /// The study is off in the app until it's picked: no AI section, no mark on the notes.
    @Test func theStudyIsOffByDefault() {
        #expect(EnvironmentValues().sidebarStudy == nil)
    }

}
#endif
