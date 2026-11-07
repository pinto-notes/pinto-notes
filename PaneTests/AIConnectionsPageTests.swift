#if os(macOS)
import Foundation
import SwiftUI
import Testing
@testable import Pane

/// AI Connections as Bluetooth has its devices (Emil, 7 November 2026): what is connected as rows,
/// each opening its own page with Disconnect…; Add an AI…; with nothing connected, the AIs as rows
/// with Connect…, the one on this Mac first; never Mistral.
@MainActor @Suite(.serialized) struct AIConnectionsPageTests {
    static func connection(_ name: String = "ChatGPT", host: String? = "chatgpt.com", used: Date? = .now.addingTimeInterval(-300)) -> Connection {
        Connection(id: UUID(), name: name, kind: host == nil ? "token" : "oauth", created_at: .now.addingTimeInterval(-86400 * 3),
                   last_used_at: used, revoked_at: nil, redirect_host: host)
    }

    static func ids(_ view: some View, height: CGFloat = 1100) async -> [String] {
        let ax = OffscreenAX(view.environment(\.networkReach, .online), size: CGSize(width: SettingsCard.pageWidth, height: height))
        defer { ax.close() }
        await ax.settle(500)
        var ids = ax.ids()
        for _ in 0..<10 {
            await ax.settle(250)
            let again = ax.ids()
            if !again.isEmpty, Set(again) == Set(ids) { break }
            ids = again
        }
        return ids
    }

    /// Nothing connected: one plain line, then every AI as a row with Connect…, Other apps last, and
    /// the line on what is sent and to whom.
    @Test func theEmptyPageListsTheAIsWithConnect() async {
        let ids = await Self.ids(AIConnectionsPage(client: CaptureScreen.client, preview: [], previewInstalled: []))
        for id in ["connect.intro", "connect.ai.chatgpt", "connect.ai.claude", "connect.ai.grok", "connect.ai.other", "connect.sent"] {
            #expect(ids.contains(id), "\(id): \(ids)")
        }
        #expect(!ids.contains("connect.addAI"), "the AIs are right there, not one click away")
        #expect(AIList.intro == "Connect your AI so it knows your notes, and you stop explaining things twice.")
    }

    /// A connected AI is a row saying when it was last used, opening its own page; Disconnect is never
    /// in the list. Add an AI… comes after.
    @Test func aConnectedAIIsARowWithItsLastUseAndNoDisconnect() async {
        let gpt = Self.connection()
        let ids = await Self.ids(AIConnectionsPage(client: CaptureScreen.client, preview: [gpt], previewInstalled: []))
        #expect(ids.contains("connect.connected.\(gpt.id.uuidString)"), "\(ids)")
        #expect(ids.contains("connect.addAI") && ids.contains("connect.sent"))
        #expect(!ids.contains("connect.disconnect"), "Disconnect is on the AI's own page")
        #expect(!ids.contains("connect.ai.chatgpt"), "the list of AIs to add is behind Add an AI…")
        #expect(AIList.used(gpt) == "Used 5 minutes ago")
        #expect(AIList.name(gpt) == "ChatGPT")
        #expect(AIList.tryIt(gpt) == nil, "used already: nothing to try")
    }

    /// Its own page: what it can do, when it was last used, and Disconnect….
    @Test func anAIsPageHasDisconnect() async {
        let gpt = Self.connection()
        AISelection.shared.select(gpt)
        let ids = await Self.ids(AIConnectionPage(client: CaptureScreen.client, preview: [gpt]))
        #expect(ids.contains("connect.disconnect"), "\(ids)")
        #expect(ids.contains("connect.sent"))
        #expect(SettingsPage.aiConnection.title == "ChatGPT", "the page is called by the AI's name")
        #expect(SettingsPage.aiConnection.parent == .ai)
    }

    /// The page's title and the AI it shows always agree, even when it falls back to the first one.
    @Test func thePageIsNamedAfterTheAIItShows() async {
        AISelection.shared.select(Self.connection())
        let claude = Self.connection("Claude", host: "claude.ai")
        _ = await Self.ids(AIConnectionPage(client: CaptureScreen.client, preview: [claude]))
        #expect(SettingsPage.aiConnection.title == "Claude")
    }

    /// Add an AI… opens a page one level down with the onboarding picker's AIs as rows.
    @Test func addAnAIOpensThePicker() async {
        #expect(SettingsPage.addAI.parent == .ai && SettingsPage.addAI.title == "Add an AI")
        let ids = await Self.ids(AddAIPage(client: CaptureScreen.client, preview: [Self.connection()], previewInstalled: []))
        for t in SetupCards.connectTiles { #expect(ids.contains("connect.ai.\(t.rawValue)"), "\(t): \(ids)") }
        #expect(SetupCards.connectTiles == SetupCards.brands + [.other], "the same AIs as the onboarding card")
        let available = SettingsPage.available(signedIn: true, hasClient: true)
        #expect(available.isSuperset(of: [.ai, .aiConnection, .addAI]))
        #expect(!SettingsPage.available(signedIn: false, hasClient: true).contains(.addAI))
    }

    /// An AI on this Mac goes first and says so; Other apps is always last.
    @Test func anInstalledAIGoesFirst() {
        #expect(AIList.choices(installed: []) == [.chatgpt, .claude, .grok, .other])
        #expect(AIList.choices(installed: [.claude]) == [.claude, .chatgpt, .grok, .other])
        #expect(AIList.choices(installed: [.claude, .chatgpt]) == [.chatgpt, .claude, .grok, .other])
        #expect(AIList.line(.claude, installed: true) == "On this Mac")
        #expect(AIList.line(.chatgpt, installed: false) == "Made by OpenAI")
        #expect(AIList.line(.other, installed: false) == "Cursor, Codex and more")
    }

    /// Never Mistral (Emil, 2 November 2026), anywhere in the list.
    @Test func mistralIsNeverListed() {
        let names = AIList.choices(installed: Set(SetupCards.AI.allCases)).map(AIList.title)
        #expect(!names.contains { $0.localizedCaseInsensitiveContains("mistral") || $0.localizedCaseInsensitiveContains("le chat") }, "\(names)")
    }

    /// Just connected and not used yet: one thing to ask it, with Copy; gone once it has been used.
    @Test func aNewOneShowsWhatToAskIt() async {
        let fresh = Self.connection("Claude", host: "claude.ai", used: nil)
        #expect(AIList.tryIt(fresh) == "Ask Claude: \u{201C}What\u{2019}s in my Welcome note?\u{201D}")
        let ids = await Self.ids(AIConnectionsPage(client: CaptureScreen.client, preview: [fresh], previewInstalled: []))
        #expect(ids.contains("connect.tryIt.copy"), "\(ids)")
        #expect(AIList.tryIt(Self.connection("My tool", host: "localhost", used: nil)) == nil, "an app the list can't name gets no ask")
        #expect(AIList.used(fresh) == "Not used yet")
    }

    /// The most recently used first; a disconnected one isn't listed.
    @Test func connectedIsMostRecentlyUsedFirst() {
        let old = Self.connection("Claude", host: "claude.ai", used: .now.addingTimeInterval(-86400))
        let new = Self.connection()
        var gone = Self.connection("Grok", host: "grok.com")
        gone = Connection(id: gone.id, name: gone.name, kind: gone.kind, created_at: gone.created_at, last_used_at: gone.last_used_at, revoked_at: .now, redirect_host: gone.redirect_host)
        #expect(AIList.connected([old, gone, new]).map(\.id) == [new.id, old.id])
    }

    /// The new pages are counted by closed words, never by which AI.
    @Test func theNewPagesHaveTelemetryWords() {
        #expect(SettingsPageWord(.aiConnection).rawValue == "ai_connection")
        #expect(SettingsPageWord(.addAI).rawValue == "add_ai")
    }
}
#endif
