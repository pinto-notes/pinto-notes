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

    /// Settings as a page of the window (`SettingsPageStudy`): Connect an AI and Appearance.
    @Test(arguments: [false, true])
    func settingsPage(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        let three = [Connection(id: UUID(), name: "ChatGPT", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "chatgpt.com"),
                     Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "claude.ai"),
                     Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now.addingTimeInterval(-86_400 * 12), last_used_at: .now.addingTimeInterval(-86_400 * 2), revoked_at: nil, redirect_host: "claude.ai")]
        let settings = SettingsView(backend: Self.backend, sync: nil)
        let available: Set<SettingsPlace> = [.profile, .ai, .security, .storage, .account, .general, .help]
        func page(_ p: SettingsStudyPage) -> AnyView {
            switch p {
            case .appearance: AnyView(AppearanceStudyPage())
            case .place(.ai): AnyView(Form { ConnectAISection(client: client, preview: three) }.formStyle(.grouped).scrollContentBackground(.hidden)
                .environment(ConnectGuideRoute()).environment(\.connectStudy, true))
            case .place(let place): AnyView(settings.place(place))
            }
        }
        for (name, start) in [("settings-page-ai", SettingsStudyPage.place(.ai)), ("settings-page-appearance", .appearance)] {
            let view = SettingsPageStudy(available: available, page: page, selected: start)
                .environment(\.controlActiveState, .key)
                .tint(Color(PColor.paneAccent))
            try await AppSnapshotTests.shoot(view, name: "\(name)-\(mode)", size: Self.size, dark: dark, wait: 1.0)
        }
    }

    /// The study is off in the app until it's picked: no AI section, no mark on the notes.
    @Test func theStudyIsOffByDefault() {
        #expect(EnvironmentValues().sidebarStudy == nil)
    }

    /// Settings as a page lists every page there is, Appearance among them, and leaves out the
    /// ones that aren't there.
    @Test func theSettingsPageListsEveryPage() {
        let all = SettingsStudyPage.groups(available: [.ai, .security, .storage, .account, .general, .help]).flatMap { $0 }
        #expect(all.contains(.appearance) && all.contains(.place(.ai)) && all.count == 7)
        #expect(!SettingsStudyPage.groups(available: [.ai, .general, .help]).flatMap { $0 }.contains(.place(.security)))
    }
}
#endif
