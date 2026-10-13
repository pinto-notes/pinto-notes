import Foundation
import Supabase
import SwiftUI
import Testing
@testable import Pane

/// Connecting Codex from Connect an AI on the Mac (13 October 2026). The Codex row with no browser:
/// before, adding, added with Show details open (what `codex mcp get` says), connected. And the
/// browser route kept for an old Codex: the Allow sheet for Codex's own sign-in, before ("doesn't
/// recognize this app") and after (names Codex). Light and dark, offscreen; runs only when
/// AMBER_HIG_SHOTS is set: `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/CodexConnectSnapshots`.
@MainActor @Suite(.serialized) struct CodexConnectSnapshots {
    static let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")

    /// Codex's sign-in, opened with the page's button on this Mac.
    static let codex = ConnectRequest(id: UUID(), client_name: "127.0.0.1", redirect_host: "127.0.0.1",
                                      redirect_uri: "http://127.0.0.1:57505/callback", claimed_name: "Codex", loopback: true,
                                      wants_write: true, asked: true, started_at: .now, started_from: "Chrome on a Mac",
                                      state: "q6coy-SGV4u92eR5uSf_8g", iss: "https://mcp.pintonotes.com", scan: true,
                                      browser_key: ConnectJourneySnapshots.pageKey.base64EncodedString())
    /// What `codex mcp get pinto-notes` printed for the entry on fleet-win (Codex 0.159.3), less its
    /// empty lines.
    static let listed = """
        pinto-notes
          enabled: true
          transport: streamable_http
          url: https://mcp.pintonotes.com
          http_headers: Authorization=*****
        """
    static let used = Connection(id: UUID(), name: "Codex", kind: "token", can_write: true, created_at: .now, last_used_at: .now,
                                 revoked_at: nil, redirect_host: nil)

    static func sheet(_ r: ConnectRequest) -> ConsentSheet {
        ConsentSheet(client: client, requestID: r.id, initial: .asking(r), finish: { _ in }, scan: ConnectJourneySnapshots.scan)
    }

    static func row(phase: ConnectRun.Phase? = nil, connected: Bool = false, details: Bool = false) -> some View {
        ConnectChoices(client: client, guides: [.codex, .claudeCode], listsConnected: false, preview: connected ? [used] : [],
                       previewFound: [.codex, .claudeCode], previewPhase: phase.map { (.codex, $0) }, previewShowsDetails: details, compact: true)
            .padding(20)
            .frame(width: 480)
            .environment(ConnectGuideRoute())
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func mac(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let rows: [(String, AnyView)] = [
            ("1-before", AnyView(Self.row())),
            ("2-adding", AnyView(Self.row(phase: .waiting(ConnectCopy.adding(.codex))))),
            ("3-added", AnyView(Self.row(phase: .added(ConnectCopy.added(.codex), details: Self.listed)))),
            ("4-added-details", AnyView(Self.row(phase: .added(ConnectCopy.added(.codex), details: Self.listed), details: true))),
            ("5-connected", AnyView(Self.row(connected: true))),
        ]
        for (name, view) in rows {
            try await AppSnapshotTests.render(view, name: "token-row-\(name)-\(mode)", dark: dark, wait: 1)
        }
        var own = Self.codex
        own.startedHere = "Codex"
        try await AppSnapshotTests.render(Self.sheet(Self.codex), name: "before-allow-sheet-\(mode)", dark: dark, wait: 1.4)
        try await AppSnapshotTests.render(Self.sheet(own), name: "after-allow-sheet-\(mode)", dark: dark, wait: 1.4)
    }
    #endif
}
