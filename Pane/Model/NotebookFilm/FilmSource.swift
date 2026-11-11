import Foundation
import Supabase
import SwiftData

/// Where the notebook film's input comes from: the notes on this device and their links, and who
/// wrote what, from each note's history on the server. Only times and authors are read, never a
/// text, and nothing leaves the device but those reads.
enum FilmSource {
    /// A version of a note: when it was written and by whom (the columns of `note_revisions` and
    /// `notes` that say so; see SupabaseHistoryStore.versions for what they mean).
    struct Row: Decodable, Sendable {
        var note_id: UUID
        var at: Date
        var source: String?
        var client: String?
    }

    /// What the server holds for the notes: their versions, and their texts now.
    protocol Service: Sendable {
        func rows(notes: [UUID]) async throws -> [Row]
    }

    /// Each note's edits, oldest first: one per version kept (history is thinned as it ages, so
    /// a busy day counts as one edit or a few; AI edits are kept for 90 days).
    static func edits(_ rows: [Row]) -> [UUID: [FilmEdit]] {
        var out: [UUID: [FilmEdit]] = [:]
        for r in rows {
            let author = VersionAuthor(source: r.source, client: r.client)
            let ai: String? = if case .ai(let name) = author { name } else { nil }
            out[r.note_id, default: []].append(FilmEdit(at: r.at, ai: ai))
        }
        for k in out.keys { out[k]!.sort { $0.at < $1.at } }
        return out
    }

    /// The notes here as the film sees them: live ones (not deleted, in the trash or locked), with
    /// their top folder and the one inside it, and the notes they link to (wiki links resolved as the app resolves them,
    /// and links by id).
    nonisolated static func notes(_ context: ModelContext, edits: [UUID: [FilmEdit]], now: Date = .now) -> FilmInput {
        let read = WikiDirectory.read(using: context)
        let index = WikiIndex(read.entries)
        let folders = Dictionary(read.entries.map { ($0.id, $0.folders) }, uniquingKeysWith: { a, _ in a })
        let live = (try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil }))) ?? []
        var out: [FilmNote] = []
        for n in live where n.lockedBody == nil {
            let from = folders[n.id] ?? []
            var links: [UUID] = []
            if let l = read.outgoing[n.id] {
                for t in l.wikiTargets { if let id = index.resolve(t, from: from), id != n.id, !links.contains(id) { links.append(id) } }
                for id in l.noteLinks.sorted(by: { $0.uuidString < $1.uuidString }) where id != n.id && !links.contains(id) { links.append(id) }
            }
            var e = edits[n.id] ?? []
            if e.isEmpty { e = [FilmEdit(at: n.createdAt, ai: nil)] }
            out.append(FilmNote(id: n.id, folder: from.first ?? "", created: min(n.createdAt, e.first?.at ?? n.createdAt), edits: e.filter { $0.at <= now }, links: links,
                                subfolder: from.count > 1 ? from[1] : nil))
        }
        return FilmInput(notes: out, now: now)
    }

    /// Quick, on this device only: could the account be ready? Saves the server reads when it can't.
    nonisolated static func mightBeReady(_ context: ModelContext, now: Date = .now) -> Bool {
        let notes = (try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil }))) ?? []
        guard notes.count >= FilmEligibility.minNotes, let first = notes.map(\.createdAt).min() else { return false }
        let age = now.timeIntervalSince(first)
        return age >= Double(FilmEligibility.minDays - 1) * 86_400 && age <= Double(FilmEligibility.maxDays + 1) * 86_400
    }
}

struct SupabaseFilmSource: FilmSource.Service {
    let client: SupabaseClient

    private struct Revision: Decodable {
        var note_id: UUID
        var created_at: Date
        var source: String?
        var client: String?
        var body_source: String?
        var body_client: String?
        var body_at: Date?
    }
    private struct Current: Decodable {
        var id: UUID
        var updated_at: Date
        var body_source: String?
        var body_client: String?
        var body_at: Date?
    }

    /// A hundred notes a read, through the per-note index; each note's text now is a version too.
    func rows(notes: [UUID]) async throws -> [FilmSource.Row] {
        var out: [FilmSource.Row] = []
        for start in stride(from: 0, to: notes.count, by: 100) {
            let ids = Array(notes[start..<min(notes.count, start + 100)]).map(\.uuidString)
            async let revisions: [Revision] = client.from("note_revisions")
                .select("note_id,created_at,source,client,body_source,body_client,body_at")
                .in("note_id", values: ids).limit(20_000).execute().value
            async let current: [Current] = client.from("notes")
                .select("id,updated_at,body_source,body_client,body_at")
                .in("id", values: ids).execute().value
            for r in try await revisions {
                // The text a revision keeps was written by `body_*`; rows from before authors were
                // recorded say who wrote the next text instead, which is near enough to count.
                out.append(.init(note_id: r.note_id, at: r.body_at ?? r.created_at, source: r.body_source ?? r.source, client: r.body_client ?? r.client))
            }
            for c in try await current {
                out.append(.init(note_id: c.id, at: c.body_at ?? c.updated_at, source: c.body_source, client: c.body_client))
            }
        }
        return out
    }
}
