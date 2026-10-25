import AppIntents
import SwiftData

/// Shortcuts and Siri: read, create and add to notes. Locked notes stay out of reach.
struct NoteEntity: AppEntity {
    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Note"
    static let defaultQuery = NoteQuery()
    var id: UUID
    var title: String
    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(title)") }

    init(_ n: Note) { id = n.id; title = n.title }
}

struct NoteQuery: EntityStringQuery {
    @MainActor private func live() -> [Note] {
        guard let c = PaneApp.sharedContainer else { return [] }
        let all = (try? c.mainContext.fetch(FetchDescriptor<Note>(sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]))) ?? []
        return all.filter { $0.deletedAt == nil && $0.trashedAt == nil && !$0.isLocked }
    }

    @MainActor func entities(for identifiers: [UUID]) async throws -> [NoteEntity] {
        live().filter { identifiers.contains($0.id) }.map(NoteEntity.init)
    }

    @MainActor func entities(matching string: String) async throws -> [NoteEntity] {
        live().filter { $0.title.localizedCaseInsensitiveContains(string) }.prefix(30).map(NoteEntity.init)
    }

    @MainActor func suggestedEntities() async throws -> [NoteEntity] {
        live().prefix(20).map(NoteEntity.init)
    }
}

struct FolderEntity: AppEntity {
    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Folder"
    static let defaultQuery = FolderQuery()
    var id: UUID
    var name: String
    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(name)") }

    init(_ folder: Folder) {
        id = folder.id
        name = folder.name
    }
}

struct FolderQuery: EntityStringQuery {
    @MainActor private func live() -> [Folder] {
        guard let c = PaneApp.sharedContainer else { return [] }
        let all = (try? c.mainContext.fetch(FetchDescriptor<Folder>(sortBy: [SortDescriptor(\.sortIndex)]))) ?? []
        return all.filter { $0.deletedAt == nil }
    }

    @MainActor func entities(for identifiers: [UUID]) async throws -> [FolderEntity] {
        live().filter { identifiers.contains($0.id) }.map(FolderEntity.init)
    }

    @MainActor func entities(matching string: String) async throws -> [FolderEntity] {
        live().filter { $0.name.localizedCaseInsensitiveContains(string) }.prefix(30).map(FolderEntity.init)
    }

    @MainActor func suggestedEntities() async throws -> [FolderEntity] {
        live().prefix(20).map(FolderEntity.init)
    }
}

enum NoteIntentError: Error, CustomLocalizedStringResourceConvertible {
    case gone, locked, folderGone, other(String)
    var localizedStringResource: LocalizedStringResource {
        switch self {
        case .gone: "That note isn't in Pinto Notes any more."
        case .locked: "That note is locked. Open it in Pinto Notes."
        case .folderGone: "That folder isn't in Pinto Notes any more."
        case .other(let message): LocalizedStringResource(stringLiteral: message)
        }
    }
}

struct ReadNoteIntent: AppIntent {
    static let title: LocalizedStringResource = "Read Note"
    static let description = IntentDescription("Gets a note's text, as markdown.")
    @Parameter(title: "Note") var note: NoteEntity

    @MainActor func perform() async throws -> some IntentResult & ReturnsValue<String> {
        guard let n = try NoteIntents.find(note.id) else { throw NoteIntentError.gone }
        guard !n.isLocked else { throw NoteIntentError.locked }
        return .result(value: n.body)
    }
}

struct AppendToNoteIntent: AppIntent {
    static let title: LocalizedStringResource = "Add to Note"
    static let description = IntentDescription("Adds text to the end of a note or under a heading.")
    @Parameter(title: "Note") var note: NoteEntity
    @Parameter(title: "Text", inputOptions: String.IntentInputOptions(multiline: true)) var text: String
    @Parameter(title: "Heading") var heading: String?

    static var parameterSummary: some ParameterSummary { Summary("Add \(\.$text) to \(\.$note) under \(\.$heading)") }

    @MainActor func perform() async throws -> some IntentResult & ReturnsValue<NoteEntity> {
        guard let n = try NoteIntents.find(note.id) else { throw NoteIntentError.gone }
        guard !n.isLocked else { throw NoteIntentError.locked }
        n.body = try NoteIntents.appending(text, to: n.body, underHeading: heading)
        n.touch()
        n.modelContext?.saveOrReport()
        return .result(value: NoteEntity(n))
    }
}

struct CreateNoteIntent: AppIntent {
    static let title: LocalizedStringResource = "Create Note"
    static let description = IntentDescription("Creates a note from text. The first line becomes its title.")
    @Parameter(title: "Text", inputOptions: String.IntentInputOptions(multiline: true)) var text: String
    @Parameter(title: "Folder") var folder: FolderEntity?

    static var parameterSummary: some ParameterSummary { Summary("Create note with \(\.$text) in \(\.$folder)") }

    @MainActor func perform() async throws -> some IntentResult & ReturnsValue<NoteEntity> {
        guard let container = PaneApp.sharedContainer else { throw NoteIntentError.gone }
        let context = container.mainContext
        let scope: Scope
        if let folder {
            guard let target = context.folder(folder.id), target.deletedAt == nil else { throw NoteIntentError.folderGone }
            scope = .folder(target.id)
        } else {
            scope = .all
        }
        let note = context.createNote(in: scope, body: text)
        return .result(value: NoteEntity(note))
    }
}

@MainActor
enum NoteIntents {
    static func find(_ id: UUID) throws -> Note? {
        guard let c = PaneApp.sharedContainer else { return nil }
        let n = try c.mainContext.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.id == id })).first
        return n?.deletedAt == nil && n?.trashedAt == nil ? n : nil
    }

    /// Appends text at the end of the note, or at the end of a heading's section.
    nonisolated static func appending(_ text: String, to body: String, underHeading: String? = nil) throws -> String {
        let addition = trailingWhitespaceTrimmed(text)
        guard !addition.isEmpty else { return body }
        guard let underHeading, !underHeading.isEmpty else {
            let trimmed = trailingWhitespaceTrimmed(body)
            return trimmed.isEmpty ? addition + "\n" : "\(trimmed)\n\(needsGap(after: trimmed, before: addition) ? "\n" : "")\(addition)\n"
        }

        var lines = body.components(separatedBy: "\n")
        let wanted = normalize(underHeading)
        guard let heading = lines.firstIndex(where: {
            guard let match = $0.range(of: #"^#{1,6}\s+"#, options: .regularExpression) else { return false }
            return normalize(String($0[match.upperBound...])) == wanted
        }) else {
            let headings = lines.compactMap { line -> String? in
                guard let match = line.range(of: #"^#{1,6}\s+"#, options: .regularExpression) else { return nil }
                return String(line[match.upperBound...])
            }
            throw NoteIntentError.other("No heading \"\(underHeading)\". Headings in this note: \(headings.isEmpty ? "none" : headings.joined(separator: ", ")).")
        }

        let level = lines[heading].prefix { $0 == "#" }.count
        var end = lines.count
        for index in (heading + 1)..<lines.count {
            let line = lines[index]
            let hashes = line.prefix { $0 == "#" }.count
            if hashes > 0, hashes <= 6, line.dropFirst(hashes).first?.isWhitespace == true && hashes <= level {
                end = index
                break
            }
        }
        var insertion = end
        while insertion > heading + 1 && lines[insertion - 1].trimmingCharacters(in: .whitespaces).isEmpty {
            insertion -= 1
        }
        lines.insert(addition, at: insertion)
        return lines.joined(separator: "\n")
    }

    private nonisolated static func needsGap(after previous: String, before addition: String) -> Bool {
        let list = #"^\s*([-*+]|\d+[.)])\s"#
        let last = previous.split(separator: "\n", omittingEmptySubsequences: false).last.map(String.init) ?? ""
        return last.range(of: list, options: .regularExpression) == nil
            || addition.range(of: list, options: .regularExpression) == nil
    }

    private nonisolated static func normalize(_ text: String) -> String {
        NoteText.stripMarkup(text).lowercased().split(whereSeparator: \.isWhitespace).joined(separator: " ")
    }

    private nonisolated static func trailingWhitespaceTrimmed(_ text: String) -> String {
        String(text.reversed().drop(while: \.isWhitespace).reversed())
    }
}

struct AmberShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: AppendToNoteIntent(), phrases: ["Add to a note in \(.applicationName)"], shortTitle: "Add to Note", systemImageName: "text.append")
        AppShortcut(intent: CreateNoteIntent(), phrases: ["Create a note in \(.applicationName)"], shortTitle: "Create Note", systemImageName: "square.and.pencil")
        AppShortcut(intent: ReadNoteIntent(), phrases: ["Read a note in \(.applicationName)"], shortTitle: "Read Note", systemImageName: "doc.text")
    }
}
