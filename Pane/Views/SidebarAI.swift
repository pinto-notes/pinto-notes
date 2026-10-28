import Supabase
import SwiftUI

/// The AIs that can use your notes, as the server lists them: shown in the sidebar under the
/// folders, so you can see at a glance who has access (Emil, 2026-10-28: "show the AI connectors
/// in the sidebar"). Asked again when the app comes to the front and whenever Connect an AI or
/// Settings → AI loads its own list.
@MainActor
@Observable
final class ConnectedAIs {
    static let shared = ConnectedAIs()

    /// One row: an AI, however many grants it holds (Claude on the web and in the desktop app).
    struct Row: Identifiable, Equatable {
        /// Its mark's name ("ChatGPT", "Claude Code"), or where access went for any other app.
        let title: String
        /// The grant whose mark and glyph the row shows.
        let mark: Connection
        let canWrite: Bool
        let ids: [UUID]
        var id: String { title }

        static func == (a: Row, b: Row) -> Bool { a.title == b.title && a.canWrite == b.canWrite && a.ids == b.ids }
    }

    /// The live grants. Nil until the server has answered once.
    private(set) var connections: [Connection]?
    /// Captures and tests: these instead of the server's.
    let preview: [Connection]?

    init(preview: [Connection]? = nil) { self.preview = preview }

    var rows: [Row] { Self.rows(preview ?? connections ?? []) }
    /// Whether the server has answered (or this is a preview), so "nothing connected" is known.
    var known: Bool { preview != nil || connections != nil }

    /// The AIs, one row each, in the order people know them; any other app after them by name.
    nonisolated static func rows(_ all: [Connection]) -> [Row] {
        let live = all.filter { $0.revoked_at == nil }
        var groups: [String: [Connection]] = [:]
        for c in live { groups[c.mark ?? c.title, default: []].append(c) }
        let known = ["ChatGPT", "Claude", "Claude Code", "Codex", "Incredible"]
        let order = groups.keys.sorted { a, b in
            switch (known.firstIndex(of: a), known.firstIndex(of: b)) {
            case let (x?, y?): x < y
            case (_?, nil): true
            case (nil, _?): false
            default: a.localizedStandardCompare(b) == .orderedAscending
            }
        }
        return order.compactMap { title in
            guard let cs = groups[title], let first = cs.first else { return nil }
            return Row(title: title, mark: first, canWrite: cs.contains(where: \.can_write), ids: cs.map(\.id))
        }
    }

    func refresh(_ client: SupabaseClient?) async {
        guard preview == nil, let client else { return }
        // Offline or signed out: keep what was shown; it is asked again on the next activation.
        if let rows: [Connection] = try? await client.from("mcp_tokens").select().is("revoked_at", value: nil).execute().value {
            connections = rows
        }
    }

    /// Connect an AI and Settings → AI loaded the list themselves: the sidebar follows at once.
    func update(_ rows: [Connection]) {
        guard preview == nil else { return }
        connections = rows
    }

    func forget() { connections = nil }

    /// Disconnects every grant of a row: it loses access at once.
    func disconnect(_ row: Row, client: SupabaseClient?) async throws {
        guard preview == nil, let client else { return }
        for id in row.ids { try await ConnectRevoke.revoke(client, id: id) }
        await refresh(client)
    }
}

/// The sidebar's AI section: on unless turned off (`defaults write … PintoSidebarAI -bool NO`).
enum SidebarAI {
    static var enabled: Bool { UserDefaults.standard.object(forKey: "PintoSidebarAI") as? Bool ?? true }

    /// The quiet "Connect an AI" row, hidden from its own menu, per account.
    static func promptHidden(_ account: UUID?) -> Bool {
        guard let account else { return false }
        return UserDefaults.standard.bool(forKey: "sidebar.ai.prompt.hidden.\(account.uuidString)")
    }

    static func hidePrompt(_ account: UUID?) {
        guard let account else { return }
        UserDefaults.standard.set(true, forKey: "sidebar.ai.prompt.hidden.\(account.uuidString)")
    }

    /// The quiet row shows when nothing is connected, it wasn't hidden, and the Connect card at
    /// the sidebar's foot isn't already asking (one ask on screen, never two).
    nonisolated static func showsPrompt(rows: Int, hidden: Bool, cardAsks: Bool) -> Bool {
        rows == 0 && !hidden && !cardAsks
    }

    /// A row's click: Settings → AI, where it can be set to read only or disconnected.
    @MainActor static func open(_ row: ConnectedAIs.Row, route: SettingsRoute = .shared) {
        route.open(.ai)
    }

    /// Not "Connect ChatGPT or Claude": that is the Welcome note's own to-do, on the same first screen.
    static let prompt = "Connect an AI"
    static let header = "AI"

    /// What VoiceOver reads for a row: "ChatGPT, can read and edit your notes".
    nonisolated static func accessibilityValue(canWrite: Bool) -> String {
        canWrite ? "Connected, can read and edit your notes" : "Connected, can read your notes only"
    }
}

/// An AI in the sidebar: its mark, its name, and a green dot (or "Read only").
struct SidebarAIRow: View {
    let row: ConnectedAIs.Row

    var body: some View {
        Label {
            SidebarRowText(title: row.title) {
                if row.canWrite {
                    Circle().fill(Color.green).frame(width: 7, height: 7)
                        .help("Can read and edit your notes")
                } else {
                    Text("Read only").font(.system(size: 11)).foregroundStyle(.secondary)
                        .help("Can read your notes, not edit them")
                }
            }
        } icon: {
            SidebarAIMark(connection: row.mark)
        }
        .sidebarRowLabel()
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(row.title)
        .accessibilityValue(SidebarAI.accessibilityValue(canWrite: row.canWrite))
        .accessibilityHint("Opens AI settings")
        .accessibilityAddTraits(.isButton)
    }
}

/// The AI's own mark at the size of a folder's icon; a plain glyph for any other app.
struct SidebarAIMark: View {
    let connection: Connection

    var body: some View {
        if let ai = connection.mark {
            AIGlyph(ai: ai, size: 15)
        } else {
            SidebarIcon(name: connection.symbol == "key.fill" ? "key" : connection.symbol)
        }
    }
}

/// Nothing connected: one quiet row, in the secondary colour with a small plus.
struct SidebarAIPrompt: View {
    var body: some View {
        Label {
            Text(SidebarAI.prompt).foregroundStyle(.secondary)
        } icon: {
            Image(systemName: "plus").font(.system(size: 12, weight: .medium)).foregroundStyle(.secondary)
        }
        .sidebarRowLabel()
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(SidebarAI.prompt)
        .accessibilityAddTraits(.isButton)
    }
}
