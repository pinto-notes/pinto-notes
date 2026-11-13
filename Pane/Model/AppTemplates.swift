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
        case .app: NoteAppMark.symbol
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

    /// Makes it: a note in the window (its own New Note), a canvas, or the New App sheet.
    @MainActor func run(newNote: () -> Void) {
        switch self {
        case .note: newNote()
        case .canvas: NewCanvas.shared.ask()
        case .app: NewApp.shared.open()
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

    /// Where New App puts it: the folder you're in, or with All Notes your first folder (never
    /// "Shared with me"), as New Note and the template library do. None yet: "Notes" is made.
    @MainActor static func folder(in context: ModelContext, scope: Scope?) -> FolderChoice {
        if case .folder(let id) = scope, let f = context.folder(id), f.deletedAt == nil { return .existing(f.id) }
        let top = context.allFolders().filter { $0.parent == nil && $0.deletedAt == nil && !ModelContext.isSharedWithMe($0) }
        return top.min { $0.sortIndex < $1.sortIndex }.map { .existing($0.id) } ?? .new("Notes")
    }

    /// The app, made here and now: the note, its app and data, sealed and synced like any app.
    /// Always a new one (a second habit tracker is a second note). Returns the note to open.
    @MainActor static func make(_ t: AppTemplate, into folder: FolderChoice, context: ModelContext, bundle: Bundle = .main) async -> UUID? {
        let link = NoteSourceLink(kind: .template, slug: t.slug)
        let model = NoteSourceModel(link: link, source: Bundled(template: t, bundle: bundle), ledger: NoteSourceLedger(account: nil))
        model.folder = folder
        await model.load(context: context)
        model.add(context: context, again: true)
        guard case .added(_, let id, _) = model.phase else { return nil }
        SyncSignal.changed()
        return id
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
