#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The sidebar study (`SidebarStudy`, 2026-10-30): your AIs in the sidebar, Templates and Import,
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
        let both = SidebarStudy(ais: ["ChatGPT", "Claude"])
        let lib = try Self.library()
        try await AppSnapshotTests.withLastNote(lib, "Trip documents") { try await shots(both, lib: lib, mode: mode, dark: dark) }
    }

    private func shots(_ both: SidebarStudy, lib: ModelContainer, mode: String, dark: Bool) async throws {
        try await AppSnapshotTests.shoot(window(both, library: lib), name: "study-A-ais-first-\(mode)", size: Self.size, dark: dark, wait: 1.0)
        try await AppSnapshotTests.shoot(window(SidebarStudy(ais: ["ChatGPT", "Claude"], aisFirst: false), library: lib), name: "study-B-ais-under-\(mode)", size: Self.size, dark: dark, wait: 1.0)
        try await AppSnapshotTests.shoot(window(SidebarStudy(ais: ["ChatGPT"]), library: lib), name: "study-A-one-ai-\(mode)", size: Self.size, dark: dark, wait: 1.0)
        // Templates in the sidebar opens the same gallery as the last setup card.
        let gallery = SetupCardsFlow(store: OnboardingStore(defaults: TestDefaults()), backend: Backend(), preview: .init(card: .gallery), finish: { _ in })
        try await AppSnapshotTests.shoot(window(both, library: lib, over: gallery), name: "study-templates-\(mode)", size: Self.size, dark: dark, wait: 1.0)
    }

    /// The study is off in the app until it's picked: no AI section, no mark on the notes.
    @Test func theStudyIsOffByDefault() {
        #expect(EnvironmentValues().sidebarStudy == nil)
    }
}
#endif
