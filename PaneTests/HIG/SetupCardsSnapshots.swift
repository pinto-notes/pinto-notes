#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The first run as cards over the real notes window (round 7), every card, light and dark.
/// Offscreen: nothing touches the screen. Runs only when AMBER_HIG_SHOTS is set:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/SetupCardsSnapshots`.
@MainActor @Suite(.serialized) struct SetupCardsSnapshots {
    static let size = CGSize(width: 1180, height: 760)

    /// No notes yet: signed out, and before the import.
    static func empty() throws -> ModelContainer {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: false, welcome: false)
        try? c.mainContext.save()
        return c
    }

    private func shot(_ card: some View, _ name: String, library: ModelContainer, dark: Bool) async throws {
        let view = ZStack {
            RootView().environment(\.behindSetupCard, true).allowsHitTesting(false)
            card
        }
        .modelContainer(library)
        try await AppSnapshotTests.shoot(view, name: "setup-\(name)-\(dark ? "dark" : "light")", size: Self.size, dark: dark, wait: 1.0)
    }

    /// The Connect your AI study (Emil, 2 November 2026): three looks beside today's.
    @Test(arguments: [false, true])
    func connectLooks(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let full = try AppSnapshotTests.container()
        let backend = Backend()
        let store = OnboardingStore(defaults: TestDefaults())
        defer { SetupCards.connectLook = .likeImport }
        for look in SetupCards.ConnectLook.allCases {
            SetupCards.connectLook = look
            try await shot(SetupCardsFlow(store: store, backend: backend, preview: .init(card: .connect), finish: { _ in }), "4-connect-\(look.rawValue)", library: full, dark: dark)
        }
        // With the brand buttons, the three ways to the other AIs.
        SetupCards.connectLook = .brandButtons
        defer { SetupCards.moreLook = .row }
        for more in SetupCards.MoreLook.allCases {
            SetupCards.moreLook = more
            try await shot(SetupCardsFlow(store: store, backend: backend, preview: .init(card: .connect, more: more == .expand), finish: { _ in }), "4-more-\(more.rawValue)", library: full, dark: dark)
        }
        try await shot(ConnectAISheet(client: CaptureScreen.client, preview: [], previewFound: []).frame(width: 560, height: 620), "4-more-sheet-list", library: full, dark: dark)
    }

    @Test(arguments: [false, true])
    func cards(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let backend = Backend()
        let store = OnboardingStore(defaults: TestDefaults())
        let empty = try Self.empty(), full = try AppSnapshotTests.container()
        func flow(_ p: SetupCardsFlow.Preview) -> SetupCardsFlow { SetupCardsFlow(store: store, backend: backend, preview: p, finish: { _ in }) }
        try await shot(SetupSignInCard(backend: backend), "1-signin", library: empty, dark: dark)
        try await shot(flow(.init(card: .bring)), "2-bring", library: empty, dark: dark)
        try await shot(flow(.init(card: .bring, source: .files(.obsidian))), "2-bring-obsidian", library: empty, dark: dark)
        try await shot(flow(.init(card: .importing)), "3-importing", library: full, dark: dark)
        try await shot(flow(.init(card: .connect)), "4-connect", library: full, dark: dark)
        try await shot(flow(.init(card: .connect, ai: .claude)), "4-connect-claude", library: full, dark: dark)
        try await shot(flow(.init(card: .waiting)), "5-waiting", library: full, dark: dark)
        try await shot(flow(.init(card: .waiting, ai: .claude)), "5-waiting-claude", library: full, dark: dark)
        try await shot(flow(.init(card: .connected)), "6-connected", library: full, dark: dark)
        try await shot(flow(.init(card: .set)), "7-set", library: full, dark: dark)
        try await shot(flow(.init(card: .gallery)), "8-gallery", library: full, dark: dark)
        try await shot(flow(.init(card: .gallery, ai: .claude)), "8-gallery-claude", library: full, dark: dark)
        try await shot(flow(.init(card: .gallery, ai: .other)), "8-gallery-other", library: full, dark: dark)
        try await shot(flow(.init(card: .prompt, ai: .other, pick: SetupCards.picks[0])), "9-prompt", library: full, dark: dark)
    }
}
#endif
