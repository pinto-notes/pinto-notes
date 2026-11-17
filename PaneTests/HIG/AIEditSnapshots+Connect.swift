#if os(macOS)
import Supabase
import SwiftUI
import Testing
@testable import Pane

// AIEditSnapshots' pictures of the Connect an AI sheets, the consent sheet and the Settings sync
// line (they were in ConnectAITests.swift and SetupTests.swift, in another test target).
extension AIEditSnapshots {
    /// The consent sheet for ChatGPT, Claude, and a client that only calls itself ChatGPT.
    @Test func consentHeaders() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        for (name, uri, file) in [("ChatGPT", "https://chatgpt.com/connector_platform_oauth_redirect", "consent-chatgpt"),
                                  ("Claude", "https://claude.ai/api/mcp/auth_callback", "consent-claude"),
                                  ("ChatGPT", "https://chatgpt-login.example.com/cb", "consent-spoofed-name")] {
            let r = ConnectRequest(id: UUID(), client_name: name, redirect_host: URL(string: uri)!.host()!, redirect_uri: uri, loopback: false)
            try await AppSnapshotTests.render(ConsentSheet(client: client, requestID: r.id, initial: .asking(r), finish: { _ in }), name: file, dark: false)
        }
    }
}

extension AIEditSnapshots {
    /// Connect an AI: nothing found, Claude and Codex found, one connected, and Having trouble?.
    @Test func connectSheet() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        let claude = Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now, last_used_at: nil, revoked_at: nil, redirect_host: "claude.ai")
        for dark in [false, true] {
            let d = dark ? "-dark" : ""
            try await AppSnapshotTests.render(ConnectAISheet(client: client, preview: [], previewFound: []), name: "connect-sheet-none\(d)", dark: dark)
            try await AppSnapshotTests.render(ConnectAISheet(client: client, preview: [], previewFound: [.claude, .codex]), name: "connect-sheet-found\(d)", dark: dark)
            try await AppSnapshotTests.render(ConnectAISheet(client: client, preview: [claude], previewFound: [.claude, .codex]), name: "connect-sheet-connected\(d)", dark: dark)
        }
        try await AppSnapshotTests.render(ConnectHelpSheet(topic: HelpTopic(guide: .codex), client: client), name: "connect-help-codex", dark: false)
    }
}
extension AIEditSnapshots {
    /// The list, and the consent sheet a local app gets (named by where access goes).
    @Test func localAppConsent() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        try await AppSnapshotTests.render(Form { ConnectAISection(client: client, preview: []) }.formStyle(.grouped).frame(width: 560, height: 560),
                                          name: "connect-list", dark: false)
        let local = ConnectRequest(id: UUID(), client_name: "An app on this computer", redirect_host: "127.0.0.1",
                                   redirect_uri: "http://127.0.0.1:53682/callback", claimed_name: "incredible", loopback: true)
        try await AppSnapshotTests.render(ConsentSheet(client: client, requestID: local.id, initial: .asking(local), finish: { _ in }),
                                          name: "consent-local-app", dark: false)
    }
}

extension AIEditSnapshots {
    /// The Settings sync line, as it reads once synced.
    @Test func syncStatusLine() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let form = Form { LabeledContent("Sync") { SyncStatusLabel(status: .synced(.now.addingTimeInterval(-300))) } }
            .formStyle(.grouped).frame(width: 520)
        try await AppSnapshotTests.render(form, name: "settings-sync-line", dark: false)
    }
}
#endif
