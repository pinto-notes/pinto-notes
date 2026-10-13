import Foundation
import SwiftData

/// A folder of notes. Folders nest, like Apple Notes.
@Model
final class Folder {
    @Attribute(.unique) var id: UUID
    var name: String
    var createdAt: Date
    var updatedAt: Date
    var sortIndex: Double
    var parent: Folder?
    @Relationship(deleteRule: .cascade, inverse: \Folder.parent) var children: [Folder] = []
    @Relationship(deleteRule: .nullify, inverse: \Note.folder) var notes: [Note] = []
    /// Soft delete, so sync can carry the deletion to other devices.
    var deletedAt: Date?
    /// Changed here and not yet pushed.
    var dirty: Bool = true
    /// The server's version when we last synced; 0 = never uploaded.
    var serverVersion: Int64 = 0

    init(name: String, parent: Folder? = nil, sortIndex: Double = 0) {
        id = UUID()
        self.name = name
        createdAt = .now
        updatedAt = .now
        self.sortIndex = sortIndex
        self.parent = parent
    }

    var liveChildren: [Folder] {
        children.filter { $0.deletedAt == nil }.sorted { $0.sortIndex < $1.sortIndex }
    }

    var liveNotes: [Note] { notes.filter { $0.trashedAt == nil && $0.deletedAt == nil } }

    /// Marks a local change for sync.
    @MainActor func touch() {
        updatedAt = .now
        dirty = true
        SyncSignal.changed()
    }
}

/// A note. The body is the whole markdown source; the title is its first line.
@Model
final class Note {
    @Attribute(.unique) var id: UUID
    var body: String
    var createdAt: Date
    var updatedAt: Date
    var isPinned: Bool
    var folder: Folder?
    /// Set for a sub-note: the note that links to it.
    var parentID: UUID?
    /// Moved to Recently Deleted. Purged after 30 days.
    var trashedAt: Date?
    /// Gone for good; kept only as a tombstone for sync.
    var deletedAt: Date?
    /// Changed here and not yet pushed.
    var dirty: Bool = true
    /// The server's version when we last synced; 0 = never uploaded.
    var serverVersion: Int64 = 0
    /// Set for a locked note: its text, sealed (see NoteVault). `body` is then its title only.
    var lockedBody: String?
    /// The title and the line under it in the list, as of the last save: worked out from the text
    /// as the note is saved (NoteSummaries), so the list, links and the AI tools never work them out
    /// from every note's text. Nil for a note last saved by a build from before them: worked out
    /// from the text when asked, and filled in once after launch (NoteSummaries.fill).
    var summaryTitle: String?
    var summaryPreview: String?

    init(body: String = "", folder: Folder? = nil) {
        NoteSummaries.install()
        id = UUID()
        self.body = body
        createdAt = .now
        updatedAt = .now
        isPinned = false
        self.folder = folder
    }

    /// Marks a local change for sync.
    @MainActor func touch() {
        updatedAt = .now
        dirty = true
        SyncSignal.changed()
    }

    var isLocked: Bool { lockedBody != nil }

    /// The saved summary while the note has no changes waiting to be saved; worked out from the
    /// text otherwise (a note being typed in, or one saved before summaries were kept). The list
    /// asks for every row's title whenever it changes: one stored value each, nothing more.
    var title: String {
        if let title = summaryTitle, !hasChanges { return title }
        return NoteText.summary(of: self).title
    }

    var preview: String {
        if let preview = summaryPreview, !hasChanges { return preview }
        return NoteText.summary(of: self).preview
    }

    /// Works the summary out from the text again (NoteSummaries, as the note is saved).
    func summarize() {
        let head = NoteText.head(of: body)
        let title = head.title, preview = head.preview ?? NoteText.noPreview
        if summaryTitle != title { summaryTitle = title }
        if summaryPreview != preview { summaryPreview = preview }
    }
}

/// Keeps each note's saved summary (`Note.summaryTitle`, `summaryPreview`) in step with its text.
///
/// The text is written in about forty places (the editor, sync, imports, the AI, links that follow
/// a rename) and a model's property observers aren't called, so the summary is worked out where
/// every write ends up: as the context saves, for each note the save inserts or changes. Changes
/// made there go into the same save. A save posts this on the thread that saves, so a context of
/// its own (`fill`) is worked out on its own thread.
enum NoteSummaries {
    nonisolated(unsafe) private static let observer: NSObjectProtocol = NotificationCenter.default.addObserver(forName: ModelContext.willSave, object: nil, queue: nil) { n in
        guard let context = n.object as? ModelContext else { return }
        for case let note as Note in context.insertedModelsArray + context.changedModelsArray { note.summarize() }
    }

    /// Before the library is opened, and before any note is made. Once is enough; more is harmless.
    static func install() { _ = observer }

    /// Notes saved before summaries were kept get theirs, a batch at a time, on a context of their
    /// own off the main thread: the main context hears of them as of any other save elsewhere.
    /// Returns how many were filled in.
    @discardableResult
    static func fill(_ container: ModelContainer, batch: Int = 500) -> Int {
        install()
        let context = ModelContext(container)
        context.autosaveEnabled = false
        var filled = 0
        while true {
            var missing = FetchDescriptor<Note>(predicate: #Predicate { $0.summaryTitle == nil })
            missing.fetchLimit = batch
            guard let notes = try? context.fetch(missing), !notes.isEmpty else { break }
            for n in notes { n.summarize() }
            guard (try? context.save()) != nil else { break }
            filled += notes.count
        }
        return filled
    }
}

/// Lets model changes nudge the sync engine without depending on it.
@MainActor
enum SyncSignal {
    static var onChange: (() -> Void)?
    static func changed() { onChange?() }
}

/// Plain-text helpers shared by the list, search and the AI tools.
enum NoteText {
    private struct Summary { var body: String; var title: String; var preview: String }
    nonisolated(unsafe) private static var summaries: [UUID: Summary] = [:]

    /// A note's title and preview, worked out again only when the note's text changes:
    /// the list shows them for every note on every update. Kept by the text itself. Kept by the
    /// note's date and the text's length, a change that arrived by sync with the same date and
    /// the same length left the row showing the text from before.
    static func summary(of note: Note) -> (title: String, preview: String) {
        let body = note.body
        if let s = summaries[note.id], s.body == body { return (s.title, s.preview) }
        let head = head(of: body)
        let title = head.title
        let preview = head.preview ?? noPreview
        summaries[note.id] = Summary(body: body, title: title, preview: preview)
        return (title, preview)
    }

    static func title(of body: String) -> String {
        firstLines(of: body, count: 1).first ?? "New Note"
    }

    static func preview(of body: String) -> String {
        head(of: body).preview ?? noPreview
    }

    /// A note's second line in the list when it has nothing after its title.
    static let noPreview = "No additional text"

    /// The title and the line under it in the list. A table never previews as its header row:
    /// the first line of text after it does, or, with none, its latest row ("27 Sep · 10 km · Minutes 56").
    static func head(of body: String) -> (title: String, preview: String?) {
        var title: String?
        var table: [[String]] = []
        var inTable = false
        var rest = body[...]
        while !rest.isEmpty {
            // As in firstLines: found by byte, capped by scalar.
            let end = rest.utf8.firstIndex(of: UInt8(ascii: "\n")) ?? rest.endIndex
            let line = Substring(rest[..<end].unicodeScalars.prefix(2000))
            rest = end < rest.endIndex ? rest[rest.index(after: end)...] : rest[rest.endIndex...]
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.isEmpty { inTable = false; continue }
            if title != nil, trimmed.hasPrefix("|") {
                // Only the first table counts; its separator row says nothing.
                if table.isEmpty || inTable, let cells = tableCells(trimmed) { table.append(cells) }
                inTable = true
                continue
            }
            inTable = false
            let cleaned = stripMarkup(String(line))
            guard !cleaned.isEmpty else { continue }
            let capped = String(String(cleaned.unicodeScalars.prefix(600)).prefix(300))
            // The preview reads wiki links as their text; the title keeps the server's rules.
            if let title { return (title, WikiLinks.plain(capped)) }
            title = capped
        }
        return (title ?? "New Note", tablePreview(table))
    }

    /// A table row's cells, or nil for the separator row.
    private static func tableCells(_ line: String) -> [String]? {
        var cells = line.split(separator: "|", omittingEmptySubsequences: false).map { $0.trimmingCharacters(in: .whitespaces) }
        if cells.first == "" { cells.removeFirst() }
        if cells.last == "" { cells.removeLast() }
        if !cells.isEmpty, cells.allSatisfy({ !$0.isEmpty && $0.allSatisfy { "-: ".contains($0) } }) { return nil }
        return cells.map(stripMarkup)
    }

    /// The table's latest row, each value read with its column: a date short, a number with its
    /// unit ("Distance km" → "10 km") or its column's name ("Minutes 56"). Just a header: its names.
    private static func tablePreview(_ rows: [[String]]) -> String? {
        guard let header = rows.first else { return nil }
        guard rows.count > 1, let last = rows.last else {
            let names = header.filter { !$0.isEmpty }
            return names.isEmpty ? nil : names.joined(separator: " · ")
        }
        let parts = last.enumerated().compactMap { i, value -> String? in
            guard !value.isEmpty else { return nil }
            if let day = shortDay(value) { return day }
            let name = i < header.count ? header[i] : ""
            guard Double(value) != nil, !name.isEmpty else { return value }
            let words = name.split(separator: " ")
            if words.count > 1, let unit = words.last, unit.count <= 3 { return "\(value) \(unit)" }
            return "\(name) \(value)"
        }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    /// "2026-09-27" → "27 Sep" (in the reader's language), or nil when it isn't a date.
    private static func shortDay(_ s: String) -> String? {
        guard s.count == 10, let d = try? Date(s, strategy: Date.ISO8601FormatStyle().year().month().day().dateSeparator(.dash)) else { return nil }
        // Parsed as midnight UTC, so shown in UTC: the day written, wherever you are.
        return d.formatted(Date.FormatStyle(timeZone: .gmt).day().month(.abbreviated))
    }

    /// The first `count` lines that still say something once markup is stripped.
    /// Reads only as far as it needs: the list asks for every note on every update.
    static func firstLines(of body: String, count: Int) -> [String] {
        var out: [String] = []
        var rest = body[...]
        while out.count < count, !rest.isEmpty {
            // Found by byte, not by character: walking grapheme clusters (emoji families,
            // zalgo) across a huge line is slow.
            let end = rest.utf8.firstIndex(of: UInt8(ascii: "\n")) ?? rest.endIndex
            // A title is at most 300 characters (as on the server), so a megabyte-long first
            // line costs no more than a short one.
            // Capped by scalar, not character: one "character" can carry thousands of combining marks.
            let line = Substring(rest[..<end].unicodeScalars.prefix(2000))
            rest = end < rest.endIndex ? rest[rest.index(after: end)...] : rest[rest.endIndex...]
            guard !line.allSatisfy({ $0 == " " || $0 == "\t" }) else { continue }
            let cleaned = stripMarkup(String(line))
            if !cleaned.isEmpty { out.append(String(String(cleaned.unicodeScalars.prefix(600)).prefix(300))) }
        }
        return out
    }

    /// Removes the markdown syntax that should not show in a one-line summary.
    static func stripMarkup(_ line: String) -> String {
        // Comments (a table's `<!-- pane-table: … -->` column types) are hidden in the editor, and
        // tags such as <u>, <details> and <summary> never show in a summary.
        var s = line.replacingOccurrences(of: #"<!--.*?(-->|$)"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"</?[a-zA-Z][^>]*>"#, with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespaces)
        for prefix in ["###### ", "##### ", "#### ", "### ", "## ", "# ", "> ", "- [ ] ", "- [x] ", "- [X] ", "- ", "* ", "+ "] where s.hasPrefix(prefix) {
            s.removeFirst(prefix.count)
            break
        }
        if let r = s.range(of: #"^\d+[.)] "#, options: .regularExpression) { s.removeSubrange(r) }
        if s.hasPrefix("```") || s.allSatisfy({ "-*_|:= ".contains($0) }) { return "" }
        s = s.replacingOccurrences(of: #"\[([^\]]*)\]\([^)]*\)"#, with: "$1", options: .regularExpression)
        for token in ["**", "__", "~~", "`"] { s = s.replacingOccurrences(of: token, with: "") }
        s = s.replacingOccurrences(of: #"(?<![\w*])[*_](?=\S)(.+?)(?<=\S)[*_](?![\w*])"#, with: "$1", options: .regularExpression)
        if s.hasPrefix("|") { s = s.split(separator: "|").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }.joined(separator: "  ") }
        return s.trimmingCharacters(in: .whitespaces)
    }
}
