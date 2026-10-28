import Foundation
import Testing
@testable import Pane

/// The sidebar's AI section (`SidebarAI`, `ConnectedAIs`): one row per AI however many grants it
/// holds, the order people know them in, read only only when no grant can edit, revoked grants
/// left out, the quiet "Connect an AI" row only when nothing is connected, and a row's click
/// opening Settings at AI.
@MainActor
@Suite struct SidebarAITests {
    static func grant(_ name: String, kind: String = "oauth", host: String? = nil, write: Bool = true, revoked: Bool = false) -> Connection {
        Connection(id: UUID(), name: name, kind: kind, can_write: write, created_at: .now, last_used_at: nil,
                   revoked_at: revoked ? .now : nil, redirect_host: host)
    }

    static let mixed: [Connection] = [
        grant("Codex", kind: "token", revoked: true),
        grant("Claude", host: "claude.ai", write: false),
        grant("Claude Code", kind: "token"),
        grant("ChatGPT", host: "chatgpt.com"),
        grant("Claude", host: "claude.ai", write: true),
    ]

    @Test func oneRowPerAIInTheOrderPeopleKnowThem() {
        let rows = ConnectedAIs.rows(Self.mixed)
        #expect(rows.map(\.title) == ["ChatGPT", "Claude", "Claude Code"], "revoked Codex is left out")
        let claude = try? #require(rows.first { $0.title == "Claude" })
        #expect(claude?.ids.count == 2, "both of Claude's grants are one row")
        #expect(claude?.canWrite == true, "one grant that can edit makes the row read and edit")
    }

    @Test func readOnlyWhenNoGrantCanEdit() {
        let rows = ConnectedAIs.rows([Self.grant("ChatGPT", host: "chatgpt.com", write: false)])
        #expect(rows.first?.canWrite == false)
        #expect(SidebarAI.accessibilityValue(canWrite: false).contains("read your notes only"))
    }

    @Test func anyOtherAppComesAfterTheKnownOnesByName() {
        let rows = ConnectedAIs.rows([Self.grant("Zed", kind: "token"), Self.grant("ChatGPT", host: "chatgpt.com"), Self.grant("Access", kind: "token")])
        #expect(rows.map(\.title) == ["ChatGPT", "Access", "Zed"])
    }

    @Test func theConnectRowOnlyWhenNothingIsConnectedAndNothingElseAsks() {
        #expect(SidebarAI.showsPrompt(rows: 0, hidden: false, cardAsks: false))
        #expect(!SidebarAI.showsPrompt(rows: 1, hidden: false, cardAsks: false), "an AI is connected")
        #expect(!SidebarAI.showsPrompt(rows: 0, hidden: true, cardAsks: false), "hidden from its menu")
        #expect(!SidebarAI.showsPrompt(rows: 0, hidden: false, cardAsks: true), "the Connect card already asks")
        // Never the Welcome note's own to-do word for word, on the same first screen.
        #expect(SidebarAI.prompt == "Connect an AI")
    }

    @Test func hidingTheConnectRowIsPerAccount() {
        let a = UUID(), b = UUID()
        defer { for id in [a, b] { UserDefaults.standard.removeObject(forKey: "sidebar.ai.prompt.hidden.\(id.uuidString)") } }
        SidebarAI.hidePrompt(a)
        #expect(SidebarAI.promptHidden(a))
        #expect(!SidebarAI.promptHidden(b))
    }

    @Test func clickingAnAIOpensSettingsAtAI() throws {
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "sidebar-ai-\(UUID())")!)
        let row = try #require(ConnectedAIs.rows([Self.grant("ChatGPT", host: "chatgpt.com")]).first)
        SidebarAI.open(row, route: route)
        #expect(route.target == .ai)
        #expect(route.tab == .ai)
    }

    @Test func aPreviewIsKnownAndNeverAsksTheServer() async {
        let ais = ConnectedAIs(preview: [])
        #expect(ais.known, "a preview with nothing connected shows the Connect row at once")
        await ais.refresh(nil)
        ais.update(Self.mixed)
        #expect(ais.rows.isEmpty, "a preview keeps its own list")
        let live = ConnectedAIs()
        #expect(!live.known, "nothing is shown until the server answers")
        live.update(Self.mixed)
        #expect(live.rows.count == 3)
    }
}
