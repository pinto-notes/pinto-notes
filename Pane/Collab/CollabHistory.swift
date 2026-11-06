import Automerge
import Foundation

/// A shared note's versions. They're the document's own changes: every device holds them all,
/// sealed like the note, so the list needs no server and works offline.
///
/// Each change says who made it in its message: "u:<their id>", "r:<their id>" when it restored a
/// version, or an AI's byline ("Sara's Claude", written by the MCP server). Its time is the
/// clock of the device that made it, in seconds.
enum CollabHistory {
    /// The same person's edits, each within this long of the next, are one version.
    static let burst = HistoryGrouping.burst
    /// Two people editing closer together than this are writing together: one version, under both
    /// names. A longer gap is one person's edit after another's, and each can be gone back to.
    static let together: TimeInterval = 10
    /// How many of the newest changes are read: about a long day's typing in a busy note.
    static let limit = 20_000

    static func stamp(_ user: UUID, restored: Bool = false) -> String {
        (restored ? "r:" : "u:") + user.uuidString
    }

    /// One version, and the point in the document's history that holds its text.
    struct Run {
        var version: NoteVersion
        var heads: Set<ChangeHash>
    }

    private enum Who: Equatable {
        case person(UUID)
        case ai(String)
        case unknown
    }

    private static func parse(_ message: String?) -> (who: Who, restored: Bool) {
        guard let message, !message.isEmpty else { return (.unknown, false) }
        if message.hasPrefix("u:") || message.hasPrefix("r:"), let id = UUID(uuidString: String(message.dropFirst(2))) {
            return (.person(id), message.hasPrefix("r:"))
        }
        return (.ai(message), false)
    }

    /// The document's versions, the current one first, newest first. `name` gives someone's first
    /// name; a change older than the stamps has no time, and takes the time of the change before
    /// it (the first takes `start`).
    static func runs(in doc: Document, me: UUID, start: Date, now: Date = .now, name: (UUID) -> String) -> [Run] {
        let hashes = doc.getHistory()
        let first = max(0, hashes.count - limit)
        var heads = first == 0 ? [] : Set(doc.change(hash: hashes[first])?.deps ?? [])
        var open: (who: [Who], restored: Bool, end: Date, last: Int, heads: Set<ChangeHash>)?
        var closed: [(who: [Who], restored: Bool, end: Date, last: Int, heads: Set<ChangeHash>)] = []
        var clock = start
        for i in first..<hashes.count {
            guard let change = doc.change(hash: hashes[i]) else { continue }
            heads.subtract(change.deps)
            heads.insert(change.hash)
            // Clocks differ between devices: time only goes forward here, and never past now.
            if change.timestamp.timeIntervalSince1970 > 0 { clock = min(now, max(clock, change.timestamp)) }
            let (who, restored) = parse(change.message)
            if var run = open, !restored, !run.restored, !isAI(who), !run.who.contains(where: isAI) {
                let gap = clock.timeIntervalSince(run.end)
                // One person's own pauses are allowed for. Writing together lasts while it's that close.
                if run.who == [who] ? gap <= burst : gap < together {
                    if !run.who.contains(who) { run.who.append(who) }
                    run.end = clock
                    run.last = i
                    run.heads = heads
                    open = run
                    continue
                }
            }
            if let run = open { closed.append(run) }
            open = (who: [who], restored: restored, end: clock, last: i, heads: heads)
        }
        if let run = open { closed.append(run) }
        return closed.reversed().enumerated().map { index, run in
            Run(version: NoteVersion(version: Int64(run.last), madeAt: run.end, author: author(run.who, me: me, name: name),
                                     restored: run.restored, isCurrent: index == 0),
                heads: run.heads)
        }
    }

    private static func isAI(_ who: Who) -> Bool { if case .ai = who { true } else { false } }

    private static func author(_ who: [Who], me: UUID, name: (UUID) -> String) -> VersionAuthor {
        if who.count == 1, case .ai(let byline) = who[0] { return .ai(byline) }
        if who == [.person(me)] { return .you(device: nil) }
        // You first: "You and Sara".
        let names = who.sorted { a, _ in a == .person(me) }.map { w -> String in
            switch w {
            case .person(me): "You"
            case .person(let id): name(id)
            case .ai(let byline): byline
            case .unknown: "Someone"
            }
        }
        var seen = Set<String>()
        return .person(names.filter { seen.insert($0).inserted }.formatted(.list(type: .and)))
    }
}

/// A shared note's history, read from its open document. Restoring writes the old text into the
/// document as a new edit, so it reaches everyone in the note and can itself be gone back on.
@MainActor
final class SharedHistoryStore: NoteHistoryStore {
    private let session: CollabSession
    /// Where each listed version is. Others' changes arriving can reorder the document's history,
    /// so a version keeps the place it was listed with.
    private var heads: [Int64: Set<ChangeHash>] = [:]

    init(session: CollabSession) { self.session = session }

    var liveText: String? { session.text }
    var canRestore: Bool { session.canWrite }

    func versions(of note: UUID) async throws -> [NoteVersion] {
        let runs = session.historyRuns()
        heads = Dictionary(runs.map { ($0.version.version, $0.heads) }, uniquingKeysWith: { a, _ in a })
        return runs.map(\.version)
    }

    func body(of note: UUID, version: Int64) async throws -> String {
        guard let at = heads[version], let text = session.text(at: at) else { throw HistoryError.gone }
        return text
    }

    func restore(note: UUID, version: Int64) async throws -> NoteDTO? {
        guard canRestore else { throw HistoryError.other("You can view this note, not change it.") }
        session.restore(try await body(of: note, version: version))
        return nil
    }
}
