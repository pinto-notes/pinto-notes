import Foundation
import Observation
import Supabase

/// A whiteboard's version history (round 12: "open History on a board, pick an earlier version,
/// the board shows it, Restore"). A note's History reads its text; a board's drawing is its page
/// data, which the server keeps the last ten versions of as it changes, at most one a minute
/// (note_page_versions, 20261007160600_app_file_writes_coalesce.sql), sealed like the board.
/// A version is opened here and drawn by the board's own page; Restore puts it back on the board
/// as one step Undo takes back, which syncs as any change does (and the server keeps the drawing
/// it replaced as a version of its own).
struct BoardVersion: Identifiable, Hashable, Sendable {
    /// The kept row's id; `current` for the board as it is now.
    var id: Int64
    /// When the board was last changed before this version was replaced: how it looked from then.
    var madeAt: Date
    var author: VersionAuthor
    var isCurrent: Bool { id == Self.current }

    static let current: Int64 = 0

    /// Who changed it: a device's name is you there, any other name an AI's connection.
    static func author(_ client: String?) -> VersionAuthor {
        guard let c = client?.trimmingCharacters(in: .whitespaces), !c.isEmpty else { return .you(device: nil) }
        return VersionAuthor.devices.contains(c) ? .you(device: c) : .ai(c)
    }
}

/// Reads a board's kept versions: the server in the app, given ones in tests and pictures.
@MainActor
protocol BoardHistoryStore: AnyObject {
    /// The earlier versions, newest first.
    func versions(of board: UUID) async throws -> [BoardVersion]
    /// A version's page data, opened (its drawing is `values.scene`).
    func doc(of board: UUID, version: Int64) async throws -> NotePageData.Doc
}

@MainActor
final class SupabaseBoardHistory: BoardHistoryStore {
    let client: SupabaseClient
    init(client: SupabaseClient) { self.client = client }

    struct Row: Decodable { var id: Int64; var made_at: Date; var client: String? }

    func versions(of board: UUID) async throws -> [BoardVersion] {
        let rows: [Row] = try await client.from("note_page_versions").select("id,made_at,client")
            .eq("note_id", value: board).order("id", ascending: false).limit(10).execute().value
        return rows.map { BoardVersion(id: $0.id, madeAt: $0.made_at, author: BoardVersion.author($0.client)) }
    }

    func doc(of board: UUID, version: Int64) async throws -> NotePageData.Doc {
        struct Box: Decodable { var data_ct: String? }
        let rows: [Box] = try await client.from("note_page_versions").select("data_ct")
            .eq("note_id", value: board).eq("id", value: Int(version)).limit(1).execute().value
        guard let row = rows.first else { throw HistoryError.gone }
        // Kept before anything was drawn: an empty board.
        guard let box = row.data_ct else { return NotePageData.empty() }
        guard let json = Wire.sealer?.open(box, context: E2EE.pageData(board)) else {
            throw HistoryError.other("This version couldn\u{2019}t be opened on this device.")
        }
        return NotePageData.decode(Data(json.utf8))
    }
}

/// Given versions, for tests, pictures and a board with no account.
@MainActor
final class MemoryBoardHistory: BoardHistoryStore {
    var kept: [(version: BoardVersion, doc: NotePageData.Doc)]
    init(_ kept: [(version: BoardVersion, doc: NotePageData.Doc)] = []) { self.kept = kept }
    func versions(of board: UUID) async throws -> [BoardVersion] { kept.map(\.version).sorted { $0.madeAt > $1.madeAt } }
    func doc(of board: UUID, version: Int64) async throws -> NotePageData.Doc {
        guard let k = kept.first(where: { $0.version.id == version }) else { throw HistoryError.gone }
        return k.doc
    }
}

@MainActor
@Observable
final class BoardHistoryModel {
    enum Phase: Equatable { case loading, loaded, failed(String) }

    private(set) var phase: Phase = .loading
    /// The board as it is now, then the kept versions, newest first.
    private(set) var versions: [BoardVersion] = []
    private(set) var selection: Int64?
    /// The selected version as the board draws it.
    private(set) var picture: Data?
    private(set) var previewFailed: String?
    /// The selected version has nothing drawn.
    private(set) var emptyVersion = false
    /// Versions are drawn as the board shows them in dark mode.
    var dark = false

    /// The app's store, set up at launch; nil signed out (a board's History then has nothing).
    static var store: BoardHistoryStore?

    let board: UUID
    let title: String
    let store: BoardHistoryStore
    let canvas: CanvasController
    /// When the board was last changed, for the current version's row.
    let changedAt: Date
    private var docs: [Int64: NotePageData.Doc] = [:]
    private let data: NotePageDataStore

    init(board: UUID, title: String, changedAt: Date, store: BoardHistoryStore, canvas: CanvasController, data: NotePageDataStore = .shared) {
        self.board = board
        self.title = title
        self.changedAt = changedAt
        self.store = store
        self.canvas = canvas
        self.data = data
    }

    var selected: BoardVersion? { versions.first { $0.id == selection } }
    /// Nothing kept yet: only the board as it is.
    var isEmpty: Bool { versions.allSatisfy(\.isCurrent) }

    /// The versions by day, newest first ("Today", "Yesterday", a date).
    var days: [(title: String, versions: [BoardVersion])] {
        var out: [(title: String, versions: [BoardVersion])] = []
        for v in versions {
            let t = HistoryGrouping.title(for: v.madeAt)
            if out.last?.title == t { out[out.count - 1].versions.append(v) } else { out.append((t, [v])) }
        }
        return out
    }

    func load() async {
        phase = .loading
        do {
            let kept = try await store.versions(of: board)
            versions = [BoardVersion(id: BoardVersion.current, madeAt: changedAt, author: .you(device: nil))] + kept
            phase = .loaded
            // The newest earlier version is what you most likely came for.
            if let first = kept.first ?? versions.first { await select(first.id) }
        } catch {
            phase = .failed(HistoryError.from(error).localizedDescription)
        }
    }

    func select(_ id: Int64?) async {
        selection = id
        picture = nil
        previewFailed = nil
        emptyVersion = false
        guard let id else { return }
        do {
            let doc = try await doc(id)
            guard selection == id else { return }
            let scene = Self.scene(doc)
            let live = (scene["elements"] as? [[String: Any]] ?? []).filter { $0["isDeleted"] as? Bool != true }
            if live.isEmpty { emptyVersion = true; return }
            let png = await canvas.picture(of: scene, dark: dark)
            guard selection == id else { return }
            if let png { picture = png } else { previewFailed = "This version couldn\u{2019}t be drawn." }
        } catch {
            guard selection == id else { return }
            previewFailed = HistoryError.from(error).localizedDescription
        }
    }

    private func doc(_ id: Int64) async throws -> NotePageData.Doc {
        if id == BoardVersion.current { return data.doc(board) }
        if let d = docs[id] { return d }
        let d = try await store.doc(of: board, version: id)
        docs[id] = d
        return d
    }

    /// A page data document's drawing.
    static func scene(_ doc: NotePageData.Doc) -> [String: Any] {
        ((doc["values"] as? [String: Any])?["scene"] as? [String: Any]) ?? ["elements": [Any](), "files": [String: Any]()]
    }

    /// "Today at 14:02".
    static func heading(_ v: BoardVersion) -> String {
        v.isCurrent ? "Current version" : "\(HistoryGrouping.title(for: v.madeAt)) at \(VersionHistoryModel.time(v.madeAt))"
    }

    /// What the board says once a version is back, with Undo beside it: as a note's History says it.
    static let restoredLine = "Version restored"

    /// Puts the selected version back on the board, as one step Undo takes back. True when the
    /// history can close.
    func restore() async -> Bool {
        guard let v = selected, !v.isCurrent, let doc = try? await doc(v.id) else { return false }
        let scene = Self.scene(doc)
        guard let json = try? JSONSerialization.data(withJSONObject: scene) else { return false }
        FeatureUse.mark(.versionHistory)
        canvas.send(.restoreVersion(json))
        canvas.confirm(Self.restoredLine, for: .seconds(6)) { [weak canvas] in
            canvas?.run(.undo)
            canvas?.notice = nil
            canvas?.noticeUndo = nil
        }
        return true
    }
}
