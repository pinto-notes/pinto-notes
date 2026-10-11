import Foundation
import SwiftData
import SwiftUI
import Observation
import Supabase

/// What the server knows about an account's setup, the same on every device: an import finished
/// (marked by the app), an AI connection exists (mcp_tokens), an AI has edited a note (counted on
/// the server), the first-run flow ended (`dismissed`; `celebrated` is how the setup card of
/// earlier versions ended), and the Templates card in the sidebar was closed.
struct SetupProgress: Equatable, Decodable {
    var imported = false
    var connected = false
    var aiEdits = 0
    var dismissed = false
    var celebrated = false
    var templatesClosed = false

    enum CodingKeys: String, CodingKey {
        case imported, connected, dismissed, celebrated
        case aiEdits = "ai_edits"
        case templatesClosed = "templates_closed"
    }

    init(imported: Bool = false, connected: Bool = false, aiEdits: Int = 0, dismissed: Bool = false, celebrated: Bool = false, templatesClosed: Bool = false) {
        self.imported = imported
        self.connected = connected
        self.aiEdits = aiEdits
        self.dismissed = dismissed
        self.celebrated = celebrated
        self.templatesClosed = templatesClosed
    }

    /// Every key is optional: a server that doesn't know a mark yet simply doesn't send it.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        imported = try c.decodeIfPresent(Bool.self, forKey: .imported) ?? false
        connected = try c.decodeIfPresent(Bool.self, forKey: .connected) ?? false
        aiEdits = try c.decodeIfPresent(Int.self, forKey: .aiEdits) ?? 0
        dismissed = try c.decodeIfPresent(Bool.self, forKey: .dismissed) ?? false
        celebrated = try c.decodeIfPresent(Bool.self, forKey: .celebrated) ?? false
        templatesClosed = try c.decodeIfPresent(Bool.self, forKey: .templatesClosed) ?? false
    }
}

/// Where those facts come from (the server; tests swap it).
protocol SetupService: Sendable {
    func progress() async throws -> SetupProgress
    func mark(_ step: String) async throws
}

struct SupabaseSetup: SetupService {
    let client: SupabaseClient
    func progress() async throws -> SetupProgress {
        try await client.rpc("pane_setup_state").execute().value
    }
    func mark(_ step: String) async throws {
        try await client.rpc("pane_setup_mark", params: ["step": step]).execute()
    }
}

@MainActor
@Observable
final class SetupStore {
    private(set) var progress: SetupProgress?
    @ObservationIgnored private var service: SetupService?
    @ObservationIgnored private var account: UUID?

    init(service: SetupService? = nil, progress: SetupProgress? = nil) {
        self.service = service
        self.progress = progress
    }

    /// A new account (or none) resets everything.
    func attach(account: UUID?, service: SetupService?) {
        guard account != self.account else { return }
        self.account = account
        self.service = service
        progress = nil
    }

    @ObservationIgnored private var lastRefresh: Date = .distantPast

    /// Asks the server again, at most every few seconds unless forced.
    func refresh(force: Bool = false) async {
        guard let service else { return }
        guard force || Date.now.timeIntervalSince(lastRefresh) > 4 else { return }
        lastRefresh = .now
        guard let fresh = try? await service.progress() else { return }
        progress = fresh
    }

    func apply(_ fresh: SetupProgress) { progress = fresh }

    /// Marks a step here at once and on the server. A server that doesn't know the step yet
    /// refuses it, and nothing else changes.
    func mark(_ step: String) async {
        switch step {
        case "imported": progress?.imported = true
        case "dismissed": progress?.dismissed = true
        case "templates_closed": progress?.templatesClosed = true
        default: return
        }
        try? await service?.mark(step)
    }
}

extension Notification.Name {
    /// Notes arrived from outside: an Apple Notes import, or items shared into the app.
    static let paneNotesBrought = Notification.Name("pane.notesBrought")
}

/// A random id for this install, used only to count how many devices an account uses.
/// It isn't a device identifier and says nothing about the device.
enum InstallID {
    private static let key = "paneInstallID"

    static var value: UUID {
        if let s = UserDefaults.standard.string(forKey: key), let id = UUID(uuidString: s) { return id }
        let id = UUID()
        UserDefaults.standard.set(id.uuidString, forKey: key)
        return id
    }

    static var platform: String {
        #if os(iOS)
        "ios"
        #else
        "macos"
        #endif
    }

    /// Once per launch, after sign-in.
    static func report(_ client: SupabaseClient) async {
        _ = try? await client.rpc("pane_seen_device", params: ["device": value.uuidString.lowercased(), "platform": platform]).execute()
    }
}

extension ModelContext {
    /// The "To-do" note the first-run flow's prompt writes to, made only when the account has none anywhere: in any folder,
    /// not just the one on screen. Call it only once the account's notes have come down
    /// (`SyncEngine.knowsAccount`). Nil when there is one already.
    @MainActor @discardableResult
    func makeToDoNoteIfMissing() -> Note? {
        let notes = (try? fetch(FetchDescriptor<Note>())) ?? []
        let exists = notes.contains { $0.deletedAt == nil && $0.trashedAt == nil && $0.title.caseInsensitiveCompare(SetupProgress.toDoTitle) == .orderedSame }
        guard !exists else { return nil }
        let home = allFolders().first { $0.name == "Notes" && $0.parent == nil }
        return createNote(in: home.map { .folder($0.id) } ?? .all, body: SetupProgress.toDoBody)
    }
}

extension SetupProgress {
    static let toDoTitle = "To-do"
    /// The note exactly as the app makes it: a title and nothing else.
    static let toDoBody = "To-do\n\n"
}
