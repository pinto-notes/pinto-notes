#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The sidebar's AI section, offscreen, light and dark: two AIs connected (one read only), three,
/// and nothing connected (the quiet Connect an AI row). An offscreen window doesn't draw a List's
/// rows (the sidebar shots elsewhere come out empty here too), so `section` lays the real rows
/// out the way the sidebar does, under three folder rows for scale; `aiSection` also renders the
/// whole sidebar for CI's on-screen run.
///   `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/SidebarAISnapshots`
@MainActor @Suite(.serialized) struct SidebarAISnapshots {
    static func sidebar(_ c: ModelContainer, backend: Backend, ais: ConnectedAIs, scope: Scope) -> some View {
        NavigationStack { SidebarView(scope: .constant(scope), onNewNote: {}) }
            .frame(width: 260, height: 520)
            .modelContainer(c)
            .environment(backend)
            .environment(ais)
            .tint(Color(PColor.paneAccent))
            .environment(\.controlActiveState, .key)
    }

    @Test(arguments: [false, true])
    func aiSection(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let backend = Backend()
        backend.showSignedInForPreview(email: "sara@example.com", account: UUID())
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let c = try AppSnapshotTests.container()
        let ideas = try #require(c.mainContext.allFolders().first { $0.name == "Ideas" })
        let two = ConnectedAIs(preview: [
            SidebarAITests.grant("ChatGPT", host: "chatgpt.com"),
            SidebarAITests.grant("Claude", host: "claude.ai", write: false),
        ])
        let three = ConnectedAIs(preview: [
            SidebarAITests.grant("ChatGPT", host: "chatgpt.com"),
            SidebarAITests.grant("Claude", host: "claude.ai"),
            SidebarAITests.grant("Claude Code", kind: "token"),
        ])
        try await AppSnapshotTests.render(Self.sidebar(c, backend: backend, ais: two, scope: .folder(ideas.id)), name: "sidebar-ai-two-\(mode)", dark: dark, wait: 0.8)
        try await AppSnapshotTests.render(Self.sidebar(c, backend: backend, ais: three, scope: .folder(ideas.id)), name: "sidebar-ai-three-\(mode)", dark: dark, wait: 0.8)
        try await AppSnapshotTests.render(Self.sidebar(c, backend: backend, ais: ConnectedAIs(preview: []), scope: .folder(ideas.id)), name: "sidebar-ai-none-\(mode)", dark: dark, wait: 0.8)
    }

    /// The rows as the sidebar lays them out: a heading, rows 28 pt tall, icons on one edge.
    struct Section: View {
        let rows: [ConnectedAIs.Row]
        var prompt = false

        private func heading(_ t: String) -> some View {
            Text(t).font(.system(size: 11, weight: .semibold)).foregroundStyle(.secondary)
                .padding(.leading, SidebarStyle.edge(nested: false) - 6).padding(.top, 12).padding(.bottom, 4)
        }

        var body: some View {
            VStack(alignment: .leading, spacing: 0) {
                heading("Folders")
                ForEach(["Journal", "Ideas", "Travel"], id: \.self) { name in
                    Label { SidebarRowText(title: name) { Text("\(name.count * 7)").foregroundStyle(.secondary) } } icon: { SidebarIcon(name: "folder") }
                        .sidebarRowLabel().frame(height: 28).padding(.horizontal, 15)
                }
                heading(SidebarAI.header)
                ForEach(rows) { row in SidebarAIRow(row: row).frame(height: 28).padding(.horizontal, 15) }
                if prompt { SidebarAIPrompt().frame(height: 28).padding(.horizontal, 15) }
            }
            .font(.system(size: 13))
            .padding(.vertical, 10)
            .frame(width: 240, alignment: .leading)
            .background(Color(Palette.sidebarWarmth))
            .tint(Color(PColor.paneAccent))
            .environment(\.controlActiveState, .key)
        }
    }

    @Test(arguments: [false, true])
    func section(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let two = ConnectedAIs.rows([SidebarAITests.grant("ChatGPT", host: "chatgpt.com"), SidebarAITests.grant("Claude", host: "claude.ai", write: false)])
        let three = ConnectedAIs.rows([SidebarAITests.grant("ChatGPT", host: "chatgpt.com"), SidebarAITests.grant("Claude", host: "claude.ai"),
                                       SidebarAITests.grant("Claude Code", kind: "token")])
        try await AppSnapshotTests.render(Section(rows: two), name: "section-two-\(mode)", dark: dark)
        try await AppSnapshotTests.render(Section(rows: three), name: "section-three-\(mode)", dark: dark)
        try await AppSnapshotTests.render(Section(rows: [], prompt: true), name: "section-none-\(mode)", dark: dark)
    }
}
#endif
