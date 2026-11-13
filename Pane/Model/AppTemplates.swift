import Foundation
import SwiftData

/// The three things you can make, each one press away (Emil, 13 November 2026: "where do I click
/// to create each one"): a note, a canvas and an app. One place for their names, glyphs and keys,
/// so the toolbar, the File menu, the empty library and the tests agree.
enum CreateKind: String, CaseIterable, Identifiable {
    case note, canvas, app

    var id: String { rawValue }

    /// The button's name and the File menu item.
    var title: String {
        switch self {
        case .note: "New Note"
        case .canvas: "New Canvas"
        case .app: "New App"
        }
    }

    /// The File menu says New App… (it opens a sheet with a choice).
    var menuTitle: String { self == .app ? "New App\u{2026}" : title }

    /// One word, on the empty library's cards.
    var noun: String {
        switch self {
        case .note: "Note"
        case .canvas: "Canvas"
        case .app: "App"
        }
    }

    /// What each one is, in a line (the empty library).
    var line: String {
        switch self {
        case .note: "Write anything. Lists, tables, links."
        case .canvas: "Draw, sketch and arrange on a board."
        case .app: "A habit tracker, a budget, anything."
        }
    }

    var symbol: String {
        switch self {
        case .note: "square.and.pencil"
        case .canvas: CanvasNote.symbol
        // A verb, not the apps' grid: the grid read as "show all", not "make an app" (Emil,
        // 13 November 2026: "the app icon sucks"). A new app starts from a template or a wish to
        // your AI. Apps in the list keep the grid (NoteAppMark).
        case .app: "wand.and.sparkles"
        }
    }

    /// ⌘N, ⌥⌘N, ⌃⌘N: New Note's key with one modifier more. ⇧⌘N stays New Folder, as in Notes.
    var keys: String {
        switch self {
        case .note: "\u{2318}N"
        case .canvas: "\u{2325}\u{2318}N"
        case .app: "\u{2303}\u{2318}N"
        }
    }

    /// The help tag: the name and its key, as a menu shows them.
    var help: String { "\(title) (\(keys))" }

    var identifier: String {
        switch self {
        case .note: "list.newNote"
        case .canvas: "list.newCanvas"
        case .app: "list.newApp"
        }
    }

    /// Canvas and App are apps underneath: they show only while apps are on.
    var shown: Bool { self == .note || NoteApps.enabled }

    /// Makes it, in the window: a note (its own New Note), a canvas, or New App's start page.
    @MainActor func run(newNote: () -> Void) {
        switch self {
        case .note: newNote()
        case .canvas: NewCanvas.shared.ask()
        case .app: NewApp.shared.ask()
        }
    }
}

/// The apps New App makes in one press, with no AI and no network: the app templates bundled in
/// Pane/Resources/Templates (catalog.json, made by scripts/template-catalog.py). Each becomes a
/// note with the template's app (project), its starting data and its pictures, as the template
/// library's Make adds it, then opens at once.
struct AppTemplate: Decodable, Identifiable, Equatable, Sendable {
    let slug: String
    let title: String
    let tagline: String
    let app: Bool
    var note: String?
    var folder: String?
    var description: String?
    var ask: String?
    var id: String { slug }

    /// The card's name: the short one (the catalog's names are the site's, made for search).
    var name: String { Self.names[slug] ?? title }
    /// The card's line, a few words.
    var line: String { Self.lines[slug] ?? tagline }

    static let names = ["study-flashcards": "Flashcards", "budget-log": "Budget"]
    static let lines = [
        "habit-tracker": "Tick off a few habits each day",
        "trip-plan": "Countdown, days and packing",
        "study-flashcards": "Study with cards that flip",
        "budget-log": "Spending by category",
    ]

    /// The card's picture: the app on its starting data, in the look asked for.
    func picture(dark: Bool, bundle: Bundle = .main) -> URL? {
        bundle.url(forResource: "template-app-\(slug)-\(dark ? "dark" : "light")", withExtension: "jpg")
    }

    /// The note and its app, from the bundle only. Nil when this copy has no app for it.
    func draft(bundle: Bundle = .main) -> NoteDraft? {
        guard let note, !note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let url = bundle.url(forResource: "template-app-\(slug).project", withExtension: "json"),
              let project = try? String(contentsOf: url, encoding: .utf8), NotePageProject.parse(project) != nil else { return nil }
        var d = NoteDraft(link: NoteSourceLink(kind: .template, slug: slug), title: title, body: note, leftOut: 0)
        d.description = description
        d.folder = folder
        d.ask = ask
        d.appProject = project
        d.appData = bundle.url(forResource: "template-app-\(slug).data", withExtension: "json").flatMap { try? Data(contentsOf: $0) }
        d.preview = picture(dark: false, bundle: bundle).flatMap { try? Data(contentsOf: $0) }
        d.previewDark = picture(dark: true, bundle: bundle).flatMap { try? Data(contentsOf: $0) }
        return d
    }
}

enum AppTemplates {
    /// The app templates in the bundle, in the catalog's order, those that can be made here.
    static func all(bundle: Bundle = .main) -> [AppTemplate] {
        guard let url = bundle.url(forResource: "catalog", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let entries = try? JSONDecoder().decode([AppTemplate].self, from: data) else { return [] }
        return entries.filter { $0.app && $0.draft(bundle: bundle) != nil }
    }

    static let shipped = all()

    /// The template, made into `note` in place: the template's text, its app and its starting
    /// data, from the bundle (no AI, no network). The note stays where it is; New App's start page
    /// turns into the app. False when this copy has no app for it.
    @MainActor @discardableResult
    static func apply(_ t: AppTemplate, to note: Note, context: ModelContext, bundle: Bundle = .main,
                      pages: NotePageStore = .shared, data: NotePageDataStore = .shared, start: AppStart = .shared) -> Bool {
        guard !note.isLocked, let d = t.draft(bundle: bundle), let project = d.appProject else { return false }
        note.body = d.body
        note.touch()
        if let json = d.appData { data.set(note.id, NotePageData.decode(json)) }
        pages.setHere(note.id, .init(html: project, by: FirstOpen.templateWriter, at: .now))
        _ = context.saveOrReport()
        start.finish(note.id)
        Usage.count(.fromTemplate)
        SyncSignal.changed()
        return true
    }

    /// The template from the bundle; never the network.
    struct Bundled: NoteSourceFetching {
        let template: AppTemplate
        let bundle: Bundle

        func draft(for link: NoteSourceLink) async throws -> NoteDraft {
            guard let d = template.draft(bundle: bundle) else { throw NoteSourceError.from(URLError(.fileDoesNotExist)) }
            return d
        }
    }
}

/// New App's start (create study, 13 November 2026: "the new app should be a page instead, just
/// like note and canvas"). New App makes a note titled "New app" at once, in the folder you're in,
/// and opens it; while it has no app, the note pane shows the start page (MakeAppSheet `start`)
/// in its place: the ready-made apps, and your own idea for your AI. A template makes it the app in
/// place; handed to an AI, the page waits and turns into the app when it arrives. Left untouched,
/// it goes away like an empty new note (RootView.discardIfEmpty).
///
/// Which notes are starts is this device's to know (kept in its defaults): to any other device or
/// an AI, a start is a note titled "New app".
@MainActor @Observable
final class AppStart {
    static let shared = AppStart()
    static let key = "appStarts"
    static let title = "New app"

    /// Each start, and the AI it was handed to ("" before that).
    private(set) var starts: [UUID: String]
    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        let saved = defaults.dictionary(forKey: Self.key) as? [String: String] ?? [:]
        starts = Dictionary(uniqueKeysWithValues: saved.compactMap { k, v in UUID(uuidString: k).map { ($0, v) } })
    }

    /// The note pane shows the start page for this note: a start with no app yet.
    func shows(_ id: UUID, pages: NotePageStore = .shared) -> Bool {
        starts[id] != nil && pages[id] == nil
    }

    /// A start nobody picked for or handed to an AI: it goes when you leave it.
    func untouched(_ id: UUID, pages: NotePageStore = .shared) -> Bool {
        starts[id] == "" && pages[id] == nil
    }

    func waitingFor(_ id: UUID) -> String? { starts[id].flatMap { $0.isEmpty ? nil : $0 } }

    func begin(_ id: UUID) { starts[id] = ""; save() }
    func wait(_ id: UUID, for ai: String) { starts[id] = ai; save() }
    func finish(_ id: UUID) { guard starts.removeValue(forKey: id) != nil else { return }; save() }

    private func save() {
        defaults.set(Dictionary(uniqueKeysWithValues: starts.map { ($0.key.uuidString, $0.value) }), forKey: Self.key)
    }

    /// The new note, titled "New app" ("New app 2" beside another start, so your AI can tell them
    /// apart), in `scope`'s folder, marked as a start.
    @discardableResult
    static func make(in scope: Scope, context: ModelContext, start: AppStart = .shared) -> Note {
        let taken = Set(((try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.trashedAt == nil && $0.deletedAt == nil }))) ?? [])
            .filter { start.starts[$0.id] != nil }.map(\.title))
        var name = title, n = 2
        while taken.contains(name) { name = "\(title) \(n)"; n += 1 }
        let note = context.createNote(in: scope, body: name)
        start.begin(note.id)
        return note
    }
}
