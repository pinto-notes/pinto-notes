import Foundation
import SwiftData

/// Today's note and templates, at Obsidian's core level: nothing to set up.
///
/// Today's note is a normal note in a normal folder named "Daily", made the first time it's asked
/// for each day. Its title is the date, written out in the person's language ("30 October 2026").
/// It's found again by the day it was made and its folder, never by its title: renamed, it is
/// still today's note, and asking again doesn't make a second one.
///
/// Every note in a folder named "Templates" is a template. A new note from one gets its text, in
/// the folder you're in, with three words filled in: {{date}}, {{time}} and {{title}}. A template
/// whose first line is just {{title}} leaves that line empty, the cursor in it. The template
/// named "Daily" is what today's note starts from.
enum DailyNotes {
    static let folderName = "Daily"
    static let templatesFolderName = "Templates"
    /// The template today's note is made from, when there is one.
    static let dailyTemplateName = "Daily"

    /// The title of the note for `day`: the date, long form, in the person's language.
    static func title(for day: Date, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> String {
        var style = Date.FormatStyle(date: .long, time: .omitted, locale: locale, calendar: calendar)
        style.timeZone = calendar.timeZone
        return day.formatted(style)
    }

    static func time(_ date: Date, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> String {
        var style = Date.FormatStyle(date: .omitted, time: .shortened, locale: locale, calendar: calendar)
        style.timeZone = calendar.timeZone
        return date.formatted(style)
    }

    /// A template's text with its words filled in. With a `title` (today's note: the date), the
    /// note's first line is that title: the template's own first line is its name ("Daily"),
    /// unless it has words to fill in itself ("# {{date}}"). A heading's # stays. Without one,
    /// {{title}} is left empty for the person to type.
    static func fill(_ template: String, title: String?, now: Date = .now, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> String {
        func words(_ s: String) -> String {
            s.replacingOccurrences(of: "{{date}}", with: Self.title(for: now, locale: locale, calendar: calendar))
                .replacingOccurrences(of: "{{time}}", with: time(now, locale: locale, calendar: calendar))
                .replacingOccurrences(of: "{{title}}", with: title ?? "")
        }
        guard let title else { return words(template) }
        var lines = template.components(separatedBy: "\n")
        guard let first = lines.firstIndex(where: { !$0.trimmingCharacters(in: .whitespaces).isEmpty }) else { return title + "\n" }
        let line = lines[first]
        if !line.contains("{{") {
            let marks = line.prefix { $0 == "#" }
            lines[first] = marks.isEmpty ? title : "\(marks) \(title)"
        }
        return words(lines.joined(separator: "\n"))
    }

    /// The name a template goes by in the menus: its title, or for one that starts with
    /// {{title}}, the line under it.
    static func name(of body: String) -> String {
        let head = NoteText.head(of: body)
        let title = head.title.replacingOccurrences(of: "{{title}}", with: "").trimmingCharacters(in: .whitespaces)
        if !title.isEmpty { return head.title }
        if let preview = head.preview, preview != NoteText.noPreview { return preview }
        return "Untitled Template"
    }

    /// Whether `a` and `b` name the same folder or template: "daily" is "Daily".
    static func same(_ a: String, _ b: String) -> Bool { a.compare(b, options: [.caseInsensitive, .diacriticInsensitive]) == .orderedSame }
}

/// A template as the menus list it.
struct TemplateItem: Identifiable, Equatable, Sendable {
    let id: UUID
    let name: String
}

@MainActor
extension ModelContext {
    /// The folder with this name: one at the top first, else the one nearest the top (an
    /// Obsidian vault imported as a folder keeps its Daily and Templates inside it).
    func namedFolder(_ name: String) -> Folder? {
        func depth(_ f: Folder) -> Int { var d = 0, p = f.parent; while let q = p { d += 1; p = q.parent }; return d }
        return allFolders().filter { DailyNotes.same($0.name, name) }
            .min { (depth($0), $0.sortIndex, $0.createdAt) < (depth($1), $1.sortIndex, $1.createdAt) }
    }

    /// Today's note, if it was made: the first note made today in the Daily folder.
    func todaysNote(now: Date = .now, calendar: Calendar = .current) -> Note? {
        guard let daily = namedFolder(DailyNotes.folderName) else { return nil }
        return daily.liveNotes.filter { calendar.isDate($0.createdAt, inSameDayAs: now) }.min { $0.createdAt < $1.createdAt }
    }

    /// Today's note, made now if it wasn't yet: in the Daily folder (made too, the first time),
    /// from the Daily template when there is one. `made` says which.
    func openTodaysNote(now: Date = .now, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> (note: Note, made: Bool) {
        if let note = todaysNote(now: now, calendar: calendar) { return (note, false) }
        // New notes in All Notes go to the first folder: that stays Notes, not Daily.
        _ = defaultFolder()
        let daily = namedFolder(DailyNotes.folderName) ?? createFolder(named: DailyNotes.folderName)
        let title = DailyNotes.title(for: now, locale: locale, calendar: calendar)
        let template = noteTemplates().first { DailyNotes.same($0.name, DailyNotes.dailyTemplateName) }.flatMap { note($0.id) }
        let body = template.map { DailyNotes.fill($0.body, title: title, now: now, locale: locale, calendar: calendar) } ?? title + "\n"
        let made = Note(body: body, folder: daily)
        made.createdAt = now
        made.updatedAt = now
        insert(made)
        saveOrReport()
        return (made, true)
    }

    /// Every template: the notes in the Templates folder, by name. Locked ones keep their text to themselves.
    func noteTemplates() -> [TemplateItem] {
        guard let folder = namedFolder(DailyNotes.templatesFolderName) else { return [] }
        return folder.liveNotes.filter { !$0.isLocked }
            .map { TemplateItem(id: $0.id, name: DailyNotes.name(of: $0.body)) }
            .sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
    }

    /// A new note from a template, in `scope`'s folder (All Notes: the first folder).
    @discardableResult
    func createNote(fromTemplate id: UUID, in scope: Scope, now: Date = .now, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> Note? {
        guard let template = note(id), template.trashedAt == nil, template.deletedAt == nil, !template.isLocked else { return nil }
        return createNote(in: scope, body: DailyNotes.fill(template.body, title: nil, now: now, locale: locale, calendar: calendar))
    }

    /// New Template…: an empty note in the Templates folder, made the first time.
    func createTemplate() -> Note {
        _ = defaultFolder()
        let folder = namedFolder(DailyNotes.templatesFolderName) ?? createFolder(named: DailyNotes.templatesFolderName)
        return createNote(in: .folder(folder.id))
    }
}

/// The templates, kept for the menus (the compose button's, File › New from Template): read again
/// after each save, and changed only when they did, so the menus are drawn again only then.
@MainActor @Observable
final class TemplateShelf {
    static let shared = TemplateShelf()
    private(set) var templates: [TemplateItem] = []
    @ObservationIgnored private weak var context: ModelContext?
    @ObservationIgnored private var observer: NSObjectProtocol?

    func start(_ context: ModelContext) {
        guard self.context !== context else { return }
        self.context = context
        if let observer { NotificationCenter.default.removeObserver(observer) }
        observer = NotificationCenter.default.addObserver(forName: ModelContext.didSave, object: context, queue: nil) { [weak self] _ in
            MainActor.assumeIsolated { self?.refresh() }
        }
        refresh()
    }

    func refresh() {
        let now = context?.noteTemplates() ?? []
        if now != templates { templates = now }
    }
}

extension Notification.Name {
    /// Today's Note (File menu, the compose button's menu): the notes window opens it.
    static let paneTodaysNote = Notification.Name("pane.todaysNote")
    /// New from Template: a new note from the template whose id is the object.
    static let paneNewFromTemplate = Notification.Name("pane.newFromTemplate")
    /// New Template…: an empty note in Templates.
    static let paneNewTemplate = Notification.Name("pane.newTemplate")
}
