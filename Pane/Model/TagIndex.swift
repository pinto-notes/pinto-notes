import Foundation
import SwiftData

/// Every tag in the library and how many notes list it, for the sidebar's Tags and the tags
/// offered while one is typed. Read once (off the main thread for a large library), then kept up
/// with each save: only the notes a save touched are read again. Notes are read without telling
/// Observation, as LibraryNotes reads them, so nothing that shows the tags depends on every note.
@MainActor @Observable
final class TagIndex {
    /// Goes up with each change to the tags; reading it is what updates the sidebar.
    private var generation = 0
    /// Each live note's tags (notes without tags aren't kept).
    @ObservationIgnored private var byNote: [PersistentIdentifier: [String]] = [:]
    @ObservationIgnored private var cached: [Tags.Entry]?
    @ObservationIgnored private weak var context: ModelContext?
    @ObservationIgnored private var observer: NSObjectProtocol?
    @ObservationIgnored private var loading = false

    /// Every tag, by name, with its count.
    func entries(in context: ModelContext) -> [Tags.Entry] {
        if self.context !== context { start(context) }
        _ = generation
        if let cached { return cached }
        let made = Tags.collect(Array(byNote.values))
        cached = made
        return made
    }

    /// Tags for what's typed after a `#`: only those that can be written that way (a label with a
    /// space can't).
    func suggestions(_ typed: String, in context: ModelContext) -> [String] {
        Tags.suggestions(typed, from: entries(in: context).filter { Tags.writable($0.name) })
    }

    /// The name a tag is listed by (its most common spelling), for a tag as written in a note.
    func listedName(_ tag: String, in context: ModelContext) -> String {
        entries(in: context).first { $0.name.lowercased() == tag.lowercased() }?.name ?? tag
    }

    @ObservationIgnored private var experimentObserver: NSObjectProtocol?

    private func start(_ context: ModelContext) {
        self.context = context
        // Tags on or off (Experiments): labels count, or don't, from now.
        if experimentObserver == nil {
            experimentObserver = NotificationCenter.default.addObserver(forName: Experiments.didChange, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { if let self, let c = self.context { self.load(c) } }
            }
        }
        if ((try? context.fetchCount(FetchDescriptor<Note>())) ?? 0) > LibraryNotes.readHere { loadElsewhere(context.container) } else { load(context) }
        if let observer { NotificationCenter.default.removeObserver(observer) }
        observer = NotificationCenter.default.addObserver(forName: ModelContext.didSave, object: context, queue: nil) { [weak self] n in
            func ids(_ key: ModelContext.NotificationKey) -> [PersistentIdentifier] { (n.userInfo?[key.rawValue] as? [PersistentIdentifier]) ?? [] }
            let changed = ids(.insertedIdentifiers) + ids(.updatedIdentifiers), deleted = ids(.deletedIdentifiers)
            guard !changed.isEmpty || !deleted.isEmpty, Thread.isMainThread else { return }
            MainActor.assumeIsolated { self?.take(changed: changed, deleted: deleted) }
        }
    }

    /// A note's tags, read without Observation hearing of it: its labels (NoteLabels) and the tags
    /// written in its text. None for a note in Recently Deleted.
    nonisolated private static func tags(of note: Note) -> [String] {
        guard note.getValue(forKey: \.deletedAt) == nil, note.getValue(forKey: \.trashedAt) == nil else { return [] }
        let labels = Experiments.isOn(.tags) ? NoteLabels.labels(in: note.getValue(forKey: \.frontMatter)) : []
        let body = note.getValue(forKey: \.body)
        let written = body.contains("#") ? Tags.names(in: body) : []
        guard !labels.isEmpty else { return written }
        let have = Set(labels.map { $0.lowercased() })
        return labels + written.filter { !have.contains($0.lowercased()) }
    }

    private func load(_ context: ModelContext) {
        var read: [PersistentIdentifier: [String]] = [:]
        for n in (try? context.fetch(FetchDescriptor<Note>())) ?? [] {
            let t = Self.tags(of: n)
            if !t.isEmpty { read[n.persistentModelID] = t }
        }
        install(read)
    }

    private func loadElsewhere(_ container: ModelContainer) {
        loading = true
        Task.detached(priority: .utility) { [weak self] in
            let context = ModelContext(container)
            var read: [PersistentIdentifier: [String]] = [:]
            for n in (try? context.fetch(FetchDescriptor<Note>())) ?? [] {
                let t = TagIndex.tags(of: n)
                if !t.isEmpty { read[n.persistentModelID] = t }
            }
            let done = read
            await MainActor.run {
                guard let self else { return }
                self.loading = false
                // Saves while it was read are read again here.
                let since = self.byNote
                self.install(done.merging(since) { _, new in new })
            }
        }
    }

    private func install(_ read: [PersistentIdentifier: [String]]) {
        byNote = read
        cached = nil
        generation += 1
    }

    private func take(changed: [PersistentIdentifier], deleted: [PersistentIdentifier]) {
        guard let context else { return }
        var any = false
        for id in deleted where byNote.removeValue(forKey: id) != nil { any = true }
        for id in changed {
            guard let n = context.model(for: id) as? Note else { continue }
            let t = n.modelContext == nil ? [] : Self.tags(of: n)
            let was = byNote[id] ?? []
            guard t != was else { continue }
            byNote[id] = t.isEmpty ? nil : t
            any = true
        }
        guard any else { return }
        cached = nil
        generation += 1
    }
}

extension Tags {
    /// The notes a tag's list shows: live notes with the tag or one nested under it. The store
    /// finds the few whose text holds `#tag`; only those are read.
    static func noteIDs(tagged tag: String, in context: ModelContext) -> Set<PersistentIdentifier> {
        var out = Set<PersistentIdentifier>()
        if writable(tag) {
            let needle = "#" + tag
            let found = (try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.body.localizedStandardContains(needle) }))) ?? []
            out.formUnion(found.filter { has(tag, in: $0.getValue(forKey: \.body)) }.map(\.persistentModelID))
        }
        // Labels: only notes with front matter have any, a few in most libraries. None with Tags off.
        guard Experiments.isOn(.tags) else { return out }
        let withProps = (try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.frontMatter != nil }))) ?? []
        for n in withProps where NoteLabels.labels(in: n.getValue(forKey: \.frontMatter)).contains(where: { matches($0, tag) }) {
            out.insert(n.persistentModelID)
        }
        return out
    }
}
