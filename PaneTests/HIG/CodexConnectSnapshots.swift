import Supabase
import SwiftUI
import Testing
@testable import Pane

/// Connecting Codex from Connect an AI on the Mac, before and after 13 October 2026: the Allow
/// sheet for Codex's own sign-in (it said "doesn't recognize this app"; now it names Codex) and the
/// Codex row (it said "Adding it to Codex…" while the browser opened). Light and dark, offscreen;
/// runs only when AMBER_HIG_SHOTS is set:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/CodexConnectSnapshots`.
@MainActor @Suite(.serialized) struct CodexConnectSnapshots {
    static let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")

    /// Codex's sign-in, opened with the page's button on this Mac.
    static let codex = ConnectRequest(id: UUID(), client_name: "127.0.0.1", redirect_host: "127.0.0.1",
                                      redirect_uri: "http://127.0.0.1:57505/callback", claimed_name: "Codex", loopback: true,
                                      wants_write: true, asked: true, started_at: .now, started_from: "Chrome on a Mac",
                                      state: "q6coy-SGV4u92eR5uSf_8g", iss: "https://mcp.pintonotes.com", scan: true,
                                      browser_key: ConnectJourneySnapshots.pageKey.base64EncodedString())

    static func sheet(_ r: ConnectRequest) -> ConsentSheet {
        ConsentSheet(client: client, requestID: r.id, initial: .asking(r), finish: { _ in }, scan: ConnectJourneySnapshots.scan)
    }

    static func row(_ line: String) -> some View {
        Form {
            ConnectChoices(client: client, listsConnected: false, preview: [], previewFound: [.codex, .claudeCode],
                           previewPhase: (.codex, .waiting(line)))
        }
        .formStyle(.grouped)
        .frame(width: 520)
        .environment(ConnectGuideRoute())
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func mac(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        var own = Self.codex
        own.startedHere = "Codex"
        try await AppSnapshotTests.render(Self.sheet(Self.codex), name: "before-allow-sheet-\(mode)", dark: dark, wait: 1.4)
        try await AppSnapshotTests.render(Self.sheet(own), name: "after-allow-sheet-\(mode)", dark: dark, wait: 1.4)
        try await AppSnapshotTests.render(Self.row(ConnectCopy.adding(.codex)), name: "before-row-\(mode)", dark: dark, wait: 1)
        try await AppSnapshotTests.render(Self.row(ConnectCopy.opensBrowser(.codex)), name: "after-row-1-before-browser-\(mode)", dark: dark, wait: 1)
        try await AppSnapshotTests.render(Self.row(ConnectCopy.allowInBrowser), name: "after-row-2-browser-open-\(mode)", dark: dark, wait: 1)
    }
    #endif
}
