import SwiftData
#if os(macOS)
import SwiftUI
import WebKit

/// The website's templates, in the app (2026-10-30): every one, by kind, opened from Templates in
/// the sidebar. A copy of the site's list ships with the app (Pane/Resources/Templates, made by
/// scripts/template-catalog.py; web/lib/template-catalog.test.ts fails while it's behind).
struct TemplateCatalog: Sendable {
    struct Entry: Decodable, Identifiable, Equatable, Sendable {
        let slug: String
        let title: String
        let tagline: String
        let description: String
        let category: String
        let app: Bool
        let ground: String
        let ask: String
        /// The note after the AI has filled it in: what it looks like in use.
        let example: String
        /// The note Make adds (an app's note is also what its app reads), and the folder it goes in.
        var note: String?
        var folder: String?
        /// The templates for the same need, nearest first, as the site lists them under this one.
        var related: [String]?
        /// A sub-note of the example, whole, for the stage to show open beside the note that
        /// lists it (Recipe box: its index says a recipe is filed; the recipe is what you get).
        var opened: String?
        /// What a person might say when this is what they want, in groups, each with the line
        /// saying why it fits those words; and the ask that carries their words. The library's
        /// Search reads them (TemplateAsk); web/content/template-words.json.
        var fits: [Fit]?
        var tailor: String?
        struct Fit: Decodable, Equatable, Sendable {
            let words: [String]
            let why: String
            /// Less than 1 for words that fit this template less well than they fit another.
            var weight: Double?
        }
        var id: String { slug }

        /// An app's compiled project (as a note's page holds it) and its starting data, as the site has them.
        var appProject: String? {
            guard app, let url = Bundle.main.url(forResource: "template-app-\(slug).project", withExtension: "json") else { return nil }
            return try? String(contentsOf: url, encoding: .utf8)
        }

        var appData: NotePageData.Doc {
            guard app, let url = Bundle.main.url(forResource: "template-app-\(slug).data", withExtension: "json") else { return [:] }
            return NotePageData.decode(try? Data(contentsOf: url))
        }

        /// An app's picture on the library's stage, in the look asked for: the app on its starting
        /// data at exactly the size its live view has there (scripts/template-stage-pictures.ts), so
        /// the live app replaces it without a jump. The site's own pictures are the app at 1280 px.
        func appPicture(dark: Bool, narrow: Bool = false) -> NSImage? {
            guard app, let url = Bundle.main.url(forResource: "template-app-\(slug)-stage\(narrow ? "-narrow" : "")-\(dark ? "dark" : "light")", withExtension: "jpg") else { return nil }
            return NSImage(contentsOf: url)
        }

        /// The description as the library shows it, under the template's name in the app: without
        /// the site's "A free … in a note:" and "in Pinto Notes", which read as ad copy inside Pinto
        /// Notes (council round 3).
        var shownDescription: String {
            var d = description
            if d.hasPrefix("A free "), let colon = d.range(of: ": "), d.distance(from: d.startIndex, to: colon.lowerBound) < 80 {
                d = String(d[colon.upperBound...])
                d = d.prefix(1).uppercased() + d.dropFirst()
            }
            return d.replacingOccurrences(of: " in Pinto Notes", with: "")
        }

        /// As a pick of the setup gallery, so it draws with the same card.
        var pick: SetupCards.Pick { pick(asking: ask) }
        /// The pick with another ask than the catalog's (the everyday one, for an app you have).
        func pick(asking ask: String) -> SetupCards.Pick {
            SetupCards.Pick(slug: slug, title: title, line: tagline, cover: "template-cover-\(slug)",
                            ground: UInt32(ground, radix: 16) ?? 0x5B5651, ask: "use my \(title) note. \(Self.sendable(ask))")
        }

        /// An ask with a gap for your own words ("Here are my notes from the pricing sync: …") is
        /// sent without the "…": ChatGPT sends what it's given, and a literal "…" read as the notes.
        static func sendable(_ ask: String) -> String {
            var s = ask.trimmingCharacters(in: .whitespaces)
            guard s.hasSuffix("\u{2026}") || s.hasSuffix("...") else { return s }
            s = String(s.dropLast(s.hasSuffix("...") ? 3 : 1)).trimmingCharacters(in: .whitespaces)
            while s.hasSuffix(",") { s = String(s.dropLast()).trimmingCharacters(in: .whitespaces) }
            return s
        }

        /// What Make adds, from the app's own copy: the note in its folder, and an app's project,
        /// starting data and pictures, as the site's /templates/<slug>.json gives them. Nil when
        /// this copy has no note.
        func draft(apps: Bool = NoteApps.enabled) -> NoteDraft? {
            guard let note, !note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
            var d = NoteDraft(link: NoteSourceLink(kind: .template, slug: slug), title: title, body: note, leftOut: 0)
            d.description = description
            d.folder = folder
            d.ask = ask
            if apps, let project = appProject, NotePageProject.parse(project) != nil {
                d.appProject = project
                d.appData = Bundle.main.url(forResource: "template-app-\(slug).data", withExtension: "json").flatMap { try? Data(contentsOf: $0) }
                d.preview = Bundle.main.url(forResource: "template-app-\(slug)-light", withExtension: "jpg").flatMap { try? Data(contentsOf: $0) }
                d.previewDark = Bundle.main.url(forResource: "template-app-\(slug)-dark", withExtension: "jpg").flatMap { try? Data(contentsOf: $0) }
            }
            return d
        }
    }

    let entries: [Entry]

    static let shipped = TemplateCatalog(bundle: .main)

    init(bundle: Bundle) {
        let url = bundle.url(forResource: "catalog", withExtension: "json")
        entries = url.flatMap { try? Data(contentsOf: $0) }.flatMap { try? JSONDecoder().decode([Entry].self, from: $0) } ?? []
    }

    /// A kind's name, one word each (the site's full names are longer): on a template's page.
    static func label(_ filter: String) -> String {
        switch filter {
        case "Habits and health": "Health"
        case "Home and life": "Personal"
        default: filter
        }
    }
}

/// A line's last two words kept together, so it never ends on one word alone on its last line
/// (council round 5: "why.", "budget.", "next." alone under a cover's caption, "it in." split).
/// Lines of even length: a caption or a description is set at the narrowest width that keeps its
/// line count, so no line is a short scrap between two long ones ("items from", "and the"), as
/// CSS's text-wrap: balance does (council round 6).
nonisolated enum Balanced {
    static func lines(_ s: String, font: NSFont, width: CGFloat) -> Int {
        let h = (s as NSString).boundingRect(with: NSSize(width: width, height: 10_000), options: [.usesLineFragmentOrigin], attributes: [.font: font]).height
        let line = font.ascender - font.descender + font.leading
        return max(1, Int((h / line).rounded()))
    }

    /// The narrowest width, up to `width`, at which `s` takes as many lines as at `width`.
    static func width(_ s: String, font: NSFont, width: CGFloat) -> CGFloat {
        let count = lines(s, font: font, width: width)
        guard count > 1 else { return width }
        var lo = width / 2, hi = width
        while hi - lo > 1 {
            let mid = (lo + hi) / 2
            if lines(s, font: font, width: mid) > count { lo = mid } else { hi = mid }
        }
        // A point to spare, since the view sets text a hair wider than the string measures.
        return min(width, hi.rounded(.up) + 1)
    }
}

extension View {
    /// The text in it set balanced (Balanced), within `width`, from the leading edge.
    func balanced(_ s: String, font: NSFont, width: CGFloat) -> some View {
        frame(width: Balanced.width(s, font: font, width: width), alignment: .leading)
            .frame(width: width, alignment: .leading)
    }
}

/// With `phrases`, for the panel's description and ask, phrases stay whole too (council round 7:
/// "quick / add." and "on the / left" split once balanced): a sentence's last two words stay
/// together, as the text's last two do, and a short word that leans on the next ("on", "the")
/// never ends a line. The cards' captions are too narrow for it: they keep the last two only.
nonisolated enum NoWidow {
    /// Words a line never ends on: they belong with the word after them.
    static let leaning: Set<String> = ["a", "an", "the", "of", "on", "in", "to", "at", "by", "for"]

    static func kept(_ s: String, phrases: Bool = false) -> String {
        // A hyphenated word stays whole ("check-in" broke as "check- / in" once balanced).
        let t = s.trimmingCharacters(in: .whitespaces)
            .replacingOccurrences(of: #"(\p{L})-(\p{L})"#, with: "$1\u{2011}$2", options: .regularExpression)
        let words = t.components(separatedBy: " ")
        guard words.count > 1 else { return t }
        let ends: Set<Character> = [".", "?", "!"]
        var out = words[0]
        for i in 1..<words.count {
            let before = words[i - 1], word = words[i]
            // The text's last word, or with `phrases` a sentence's, keeps the word before it if
            // it's short enough not to leave a gap in the line above; a leaning word keeps the next.
            let last = i == words.count - 1
            let closes = (last || (phrases && word.last.map(ends.contains) == true && before.last.map(ends.contains) != true)) && word.count <= 14
            let leans = phrases && leaning.contains(before.lowercased())
            out += (closes || leans ? "\u{00A0}" : " ") + word
        }
        return out
    }
}

enum TemplateLibraryWords {
    static let title = "Templates"
    /// Back, from a template's page: the button says "Templates"; VoiceOver hears where it goes.
    static let back = "Back to Templates"
    /// On the stage: what you see is filled in; Make adds an empty one that your AI fills.
    static let example = "Example"
    /// Over an app's example, which is live: a tick there changes its numbers, and none of it is
    /// kept (council, 10 November 2026: "am I editing a demonstration or preparing my tracker?").
    static let exampleApp = "Example \u{00B7} try it, nothing is saved"
    static func example(_ e: TemplateCatalog.Entry) -> String { e.app ? exampleApp : example }
    /// Before an app's line under its cover, and after its kind on its page.
    static let app = "App"
    static let moreLike = "More like this"
    /// The arrow beside the button, to VoiceOver.
    static let more = "More ways to make it"
    static let withoutAI = "Add without AI"
    static let copy = "Copy the prompt"
    static let copied = "Prompt copied"
    static let clear = "Clear search"

    /// Make with an AI by name (the button, and the arrow's menu); with none that opens with the
    /// ask, what it adds.
    static func make(_ e: TemplateCatalog.Entry, _ ai: SetupCards.AI) -> String {
        ai.asks ? "Make with \(ai.name)" : e.app ? "Add the app" : "Add the note"
    }

    /// The page's one button. Make with your AI. With no AI, or while sync is away (the AI can't
    /// see a note that hasn't synced), it says what it does: Add the note. For a template you made
    /// and still have, it opens that one, by its name: "Make with ChatGPT" over "Already in Notes"
    /// said two things (council, 10 November 2026).
    static func primary(_ e: TemplateCatalog.Entry, _ ai: SetupCards.AI, _ mode: TemplateLibraryView.Mode) -> String {
        switch mode {
        case .have: "Open \(e.title)"
        case .make: make(e, ai)
        case .plain: make(e, .other)
        }
    }

    /// The second button, for doing it yourself: it says what you do next ("Add without AI"
    /// undersold it: the person who only wants to tick habits couldn't tell it was theirs).
    static func addMyself(_ e: TemplateCatalog.Entry) -> String { e.app ? "Add and set it up myself" : "Add and fill it in myself" }

    /// In the arrow's menu for a template you have: ask an AI about it.
    static func ask(_ ai: SetupCards.AI) -> String { "Ask \(ai.name)" }

    /// What an AI is asked about an app you already have: the everyday ask, not the one that sets
    /// it up (the catalog's `ask` for an app is its set-up). A note's ask is its everyday one.
    static let everyday: [String: String] = [
        "habit-tracker": "Ask which habits I did today and which I skipped, then tick them in my tracker.",
        "budget-log": "Ask what I spent today and on what, then log it in my budget.",
        "trip-plan": "Ask what has changed in my trip, then update the days and bookings.",
    ]
    static func everydayAsk(_ e: TemplateCatalog.Entry) -> String { everyday[e.slug] ?? e.ask }

    /// A template's kind as a small label: "Health", and "App" after it for one with an app.
    static func kind(_ e: TemplateCatalog.Entry) -> String {
        TemplateCatalog.label(e.category) + (e.app ? " \u{00B7} \(app)" : "")
    }

    /// Over the prompt: whose it is. Sent with Make: "What ChatGPT is asked". Yours to copy (no
    /// AI that opens with the ask, or sync is away): "What to ask your AI".
    static func asked(_ ai: SetupCards.AI, sent: Bool = true) -> String {
        ai.asks ? (sent ? "What \(ai.name) is asked" : "What to ask \(ai.name)") : "What to ask your AI"
    }
    static let copyShort = "Copy"
    static let copiedShort = "Copied"

    /// Each template in a few words, for the one line under its cover in the gallery: short
    /// enough to show whole there (the site's lines are written for a wider card, and every one
    /// was cut short). SetupCardsTests' everyCoverLineShowsWhole checks each fits.
    static let lines: [String: String] = [
        "habit-tracker": "Small habits, every day",
        "meeting-notes": "Decisions and action items",
        "daily-standup": "Yesterday, today, blockers",
        "meal-plan": "Dinners and the shopping",
        "reading-list": "To read, reading, finished",
        "mood-energy-log": "A short evening check-in",
        "job-hunt": "Applications and next steps",
        "trip-plan": "Days, bookings, packing",
        "study-flashcards": "Cards from your notes",
        "decision-log": "What you chose, and why",
        "workout-log": "Sessions and personal bests",
        "budget-log": "This month's spending",
        "one-on-one-notes": "Topics and follow-ups",
        "book-notes": "The big idea, the best lines",
        "bug-triage": "Bugs, sorted by severity",
        "weekly-review": "Five questions, once a week",
        "recipe-box": "Recipes, cleaned up and filed",
        "content-calendar": "What goes out, and when",
        "home-maintenance": "Chores and repairs, when due",
        "gift-ideas": "By person, with sizes and likes",
        "cornell-notes": "Notes, questions, summary",
        "daily-journal": "Four questions, every day",
        "grocery-list": "One list, sorted by aisle",
    ]

    /// The line under a cover: its few words (the site's line for a template these don't know
    /// yet). An app's has the app's mark before it, drawn by the card, never as words in the line
    /// ("App · " in the line's own grey was lost among the words; council, 10 November 2026).
    static func line(_ e: TemplateCatalog.Entry) -> String { lines[e.slug] ?? e.tagline }

    /// The line under Make, in three parts around the folder's tag, saying plainly what Make
    /// does: "Adds an empty note to (folder) Work, then opens ChatGPT." (the example beside it is
    /// filled in; what you get is not). An app's says "Adds the app to (folder) Work, then opens
    /// ChatGPT to set it up.": "an empty app" read as losing the example's habits, and its first
    /// screen suggests them. The folder is where New Note would put a note: the one you're in, or
    /// your first. With no AI that opens with the ask, only what it adds and where. While sync is
    /// away the note is still added, and the line says when the AI can fill it. A template you
    /// made and still have isn't added again: the line says where it is.
    static func caption(_ e: TemplateCatalog.Entry, ai: SetupCards.AI, folder: String, have: String? = nil, reach: SyncEngine.Reach = .online) -> (lead: String, folder: String, rest: String) {
        if let have { return ("Already in ", have, ".") }
        return caption(app: e.app, ai: ai, folder: folder, reach: reach)
    }
    static func caption(app: Bool, ai: SetupCards.AI, folder: String, reach: SyncEngine.Reach = .online) -> (lead: String, folder: String, rest: String) {
        let lead = app ? "Adds the app to " : "Adds an empty note to "
        guard ai.asks else { return (lead, folder, ".") }
        guard reach == .online else { return (lead, folder, ". Ask \(ai.name) after it syncs.") }
        return (lead, folder, app ? ", then opens \(ai.name) to set it up." : ", then opens \(ai.name).")
    }
    /// Under Make's line with no AI connected: the way to get one (any of the four the dialog offers).
    static let connect = "Connect your AI to have it filled in for you."
}

/// Making a template from the library: your AIs to offer, and what Make does.
enum TemplateMaking {
    /// Your connected AIs, the one used last first, as the library offers them: ChatGPT and
    /// Claude open with the ask; any other (Codex CLI, Claude Code, another app) gets it to paste.
    static func ais(_ connections: [Connection]) -> [SetupCards.AI] {
        var ais: [SetupCards.AI] = []
        for c in MakeAnApp.choices(connections, chosen: nil) {
            let ai: SetupCards.AI = switch c.name { case "ChatGPT": .chatgpt; case "Claude": .claude; default: .other }
            if !ais.contains(ai) { ais.append(ai) }
        }
        return ais.isEmpty ? [.other] : ais
    }

    /// Where Make puts a template: where New Note would put a note, the folder you're in, or with
    /// All Notes your first folder (never "Shared with me"). Nil with no folder yet: "Notes" is made.
    @MainActor static func folder(in context: ModelContext, scope: Scope?) -> Folder? {
        if case .folder(let id) = scope, let f = context.folder(id), f.deletedAt == nil { return f }
        return context.allFolders().filter { $0.parent == nil && $0.deletedAt == nil && !ModelContext.isSharedWithMe($0) }.min { $0.sortIndex < $1.sortIndex }
    }
    static let firstFolder = "Notes"

    /// The folder of the note this template made, if you still have it: Make opens that one.
    @MainActor static func have(_ e: TemplateCatalog.Entry, context: ModelContext, account: UUID?) -> String? {
        NoteSourceLedger(account: account).existing(NoteSourceLink(kind: .template, slug: e.slug), in: context).map { $0.folder?.name ?? firstFolder }
    }

    /// The template's note is added (as the setup gallery and the website add it); for ChatGPT or
    /// Claude the ask goes on the clipboard and the AI opens with it. Returns the new note, to open.
    /// The note comes from the app's own copy, so Make is instant and works offline (8 November
    /// 2026: it waited on up to five requests to the site, and offline opened the AI on a note that
    /// was never added). A template you added and still have is opened, not added again: the ask
    /// names the note, and two of the same name leave the AI guessing. No note, no ask.
    /// `into` is the folder it goes to (the library's: New Note's folder); nil is the template's own.
    @MainActor static func make(_ e: TemplateCatalog.Entry, with ai: SetupCards.AI, context: ModelContext, account: UUID?, into: FolderChoice? = nil,
                                reach: SyncEngine.Reach = .online, prompt: String? = nil,
                                source: any NoteSourceFetching = ShippedTemplates(), ledger: NoteSourceLedger? = nil,
                                copy: (String) -> Void = ConnectClipboard.set, open: (URL) -> Void) async -> UUID? {
        let link = NoteSourceLink(kind: .template, slug: e.slug)
        let ledger = ledger ?? NoteSourceLedger(account: account)
        var note = ledger.existing(link, in: context)?.id
        // One you have is asked about as it's used, not set up again.
        let pick = note == nil ? e.pick : e.pick(asking: TemplateLibraryWords.everydayAsk(e))
        if note == nil {
            let model = NoteSourceModel(link: link, source: source, ledger: ledger)
            model.folder = into
            await model.load(context: context)
            model.add(context: context, again: true)
            if case .added(_, let id, _) = model.phase {
                note = id
                SyncSignal.changed()
            }
        }
        guard let note else { return nil }
        // Without an AI that opens with the ask, Make only adds the note: the prompt is the
        // page's to copy ("Copy the prompt"), never put on the clipboard unasked.
        if ai.asks {
            // `prompt`: the front page's, which carries the words typed in Search.
            copy(prompt ?? SetupCards.prompt(pick))
            // While sync is away the AI isn't opened: it can't see a note that hasn't synced, and
            // with no network its page is a browser error. The note is here and the ask is on the
            // clipboard; the page's line says so (`TemplateLibraryWords.caption`).
            if reach == .online, let page = prompt.map({ TryIt.page(for: ai.name, prompt: $0) }) ?? SetupCards.page(ai, pick) { open(page) }
        }
        return note
    }
}

/// Templates as Make adds them: the app's own copy (TemplateCatalog), else the site's.
struct ShippedTemplates: NoteSourceFetching {
    var catalog = TemplateCatalog.shipped
    var apps = NoteApps.enabled
    var site: any NoteSourceFetching = WebNoteSource()

    func draft(for link: NoteSourceLink) async throws -> NoteDraft {
        if link.kind == .template, let d = catalog.entries.first(where: { $0.slug == link.slug })?.draft(apps: apps) { return d }
        return try await site.draft(for: link)
    }
}

/// Every template, in a sheet over the notes (a quick visit, like Settings), in two pages (Emil,
/// 9 November 2026: "page navigation instead of the template being a thing that shows up on the
/// right side ... notion templates, apple app store").
///
/// The gallery is the front page (TemplateFrontPage, Emil, 12 November 2026: "the editorial
/// style"): a question and a wide field, then shelves of covers, apps and rows, every template on
/// it once; Search takes plain words and offers a new note when nothing matches. Nothing is picked
/// at rest; the arrow keys move a ring through the cards and Return opens the one it's on.
///
/// A template's page, opened by a click or Return: its example large in a frame, and beside it
/// its name, what it is, the button that makes it, what that does, and what your AI is asked;
/// under them, more like it. Back, Esc and ⌘[ return to the gallery as it was left (it stays
/// under the page: its scroll and search are kept).
struct TemplateLibraryView: View {
    var catalog = TemplateCatalog.shipped
    /// Your connected AIs, the one you used last first: Make uses the first, or the one picked
    /// from the arrow beside it.
    var ais: [SetupCards.AI] = [.chatgpt]
    /// The template whose page is open; nil is the gallery.
    @State var open: TemplateCatalog.Entry?
    /// The folder Make adds to: New Note's (the one you're in, or your first).
    var folder = TemplateMaking.firstFolder
    /// The folder of the note a template made, if you still have it.
    var have: (TemplateCatalog.Entry) -> String? = { _ in nil }
    var make: (TemplateCatalog.Entry, SetupCards.AI) -> Void = { _, _ in }
    /// The front page's Search: Make with an ask that carries the words typed in Search, and a
    /// new note named from the words when no template is it.
    var makeAsking: ((TemplateCatalog.Entry, SetupCards.AI, String) -> Void)? = nil
    var makeBlank: ((String, SetupCards.AI) -> Void)? = nil
    /// Opens Connect an AI; nil where there's none to open (a picture, a test).
    var connect: (() -> Void)? = nil
    /// Something is shown over the library (Connect an AI): its keys are that thing's.
    var covered = false
    /// Esc while something is over the library: that thing goes (the library had the key and
    /// did nothing with it: Connect stayed up; a real key on the Air, 10 November 2026).
    var uncover: () -> Void = {}
    var close: () -> Void = {}
    /// What's typed in Search.
    @State var query = ""
    /// The cover the arrow keys are on; nil until one is pressed (nothing is picked at rest).
    @State var focused: TemplateCatalog.Entry?
    @State private var picked: SetupCards.AI?
    private var ai: SetupCards.AI { picked ?? ais.first ?? .other }
    @State private var copied = false
    /// The sheet's size, fitted to the window it's on.
    @State var size = Self.size
    /// What has the keys: on the front page Search (the arrow keys move a ring through the cards
    /// meanwhile, and what's typed anywhere goes into the field); on a template's page a view of
    /// no size beside it, so Tab walks the page's own buttons. Its other keys (Esc, ⌘[, Return,
    /// and the arrows to the template before and after) are its buttons' shortcuts.
    enum Keys: Hashable { case search, page }
    @FocusState private var keys: Keys?
    /// The examples with more under their frame's foot than shows: the foot fades while there is.
    @State private var below: Set<String> = []
    /// The page's button the Tab key is on; nil until Tab is pressed (no ring at rest).
    @State var stop: Stop?
    /// Each app example's own page, by its template, to give it the keys.
    @State private var webs: [String: UUID] = [:]
    @State private var anchor = TemplateMenuAnchor.Box()
    /// The pages whose button has been pressed, with where each template's note was then (nil: none).
    @State private var pressed: [String: String?] = [:]

    /// Makes a template, the page keeping what it says while it's made.
    private func press(_ e: TemplateCatalog.Entry, _ ai: SetupCards.AI) {
        if pressed[e.slug] == nil { pressed[e.slug] = .some(have(e)) }
        make(e, ai)
    }

    /// Makes a template from a front page row: with the words typed in Search in its ask, when
    /// there are some and the front page's ask can carry them.
    private func act(_ e: TemplateCatalog.Entry, _ with: SetupCards.AI, _ prompt: String?) {
        guard let prompt, let makeAsking else { return press(e, with) }
        if pressed[e.slug] == nil { pressed[e.slug] = .some(have(e)) }
        makeAsking(e, with, prompt)
    }

    /// The order the keys walk on the front page, and a page's left and right arrows: what Search
    /// found, or the front page's.
    private var order: [TemplateCatalog.Entry] { TemplateFrontPage.order(query, catalog: catalog) }
    /// The examples scrolled down from their top: the top fades while one is.
    @State private var above: Set<String> = []
    /// Counts the moves, so one overtaken by the next stops where it is.
    @State private var move = 0
    /// The page being got ready: laid out and drawn out of sight, under what's showing, until its
    /// example is there to see (an app has drawn; a note is there at once). Then it's shown whole.
    @State private var loading: TemplateCatalog.Entry?
    /// The pages whose example has drawn.
    @State private var ready: Set<String> = []
    /// The page of the cover the pointer rests on, got ready out of sight before any click: a
    /// click then finds it there, and the move starts at once (an app takes a quarter of a second
    /// to draw; without this the gallery sat still that long after the click).
    @State private var warm: TemplateCatalog.Entry?
    /// The cover the pointer is on.
    @State private var pointed: String?
    @Environment(\.colorScheme) private var scheme
    @Environment(\.inSheet) private var inSheet
    @Environment(\.networkReach) private var reach
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static let size = CGSize(width: 1040, height: 680)
    static let gap: CGFloat = 16

    /// The sheet's size on a window: the full size where it fits, never wider or taller than the
    /// window less a margin, and never so small a template's page loses its button. It doesn't
    /// grow past the full size on a large window.
    static func size(on window: CGSize) -> CGSize {
        CGSize(width: min(size.width, max(720, window.width - 80)), height: min(size.height, max(500, window.height - 60)))
    }

    // MARK: The page's parts

    /// One outer margin for the whole library, on all four sides of the gallery and of a
    /// template's page: with no lines on the sheet, the margin is its frame (Emil, 10 November
    /// 2026: "nice padding around the outline of all content"). Nothing that doesn't scroll sits
    /// closer to the sheet's edge: the sheet's name, the kinds, Search, the close circle, Back's
    /// chevron, the example's label and panel, the words' right edge, "More like this" and its
    /// tiles. On a small sheet (narrow or short) it's 24, the same on every side.
    static let margin: CGFloat = 32
    static let marginSmall: CGFloat = 24
    static func margin(for size: CGSize) -> CGFloat { narrow(size) || short(size) ? marginSmall : margin }
    /// The row at the top of both pages: its controls' height (the kinds, Search, Back, the close
    /// circle), a margin under the sheet's top. The x never moves between the two pages.
    static let controls: CGFloat = 28
    static func topRow(for size: CGSize) -> CGFloat { margin(for: size) + controls }
    /// A narrow sheet (a small window): the words beside the stage need a larger share of it, and
    /// an app is laid out in its one-column width.
    static func narrow(_ size: CGSize) -> Bool { size.width < 900 }
    /// The stage takes six tenths of the page's width, the words beside it the rest; on a narrow
    /// sheet a little less, so the button keeps its whole name ("Make with Cha…" at 0.6).
    static func stageWidth(for size: CGSize) -> CGFloat { (size.width * (narrow(size) ? 0.55 : 0.6)).rounded() }
    /// "More like this", under the stage and the words, on a sheet tall enough for it: the gap
    /// over its heading, the heading (15), 10 under it, a tile (72, its cover with 8 of wash over
    /// and under), and the margin under the cover.
    static func moreHeight(for size: CGSize) -> CGFloat { gap(for: size) + 15 + 10 + 72 + margin(for: size) - 8 }
    static func showsMore(_ size: CGSize) -> Bool { size.height > 560 }
    /// The one gap between the page's regions: the example's panel and the words beside it, the
    /// page's body and "More like this" under it. The margin's own measure.
    static func gap(for size: CGSize) -> CGFloat { margin(for: size) }
    /// The stage's height: what the top row and "More like this" leave (with none, the margin).
    static func stageHeight(for size: CGSize) -> CGFloat { size.height - topRow(for: size) - (showsMore(size) ? moreHeight(for: size) : margin(for: size)) }
    /// The "Example" label's row, over the panel. On the full sheet the panel is 576 by 428.5 pt:
    /// the shape an app's picture is drawn in (832 by 619 px).
    static let exampleRow: CGFloat = 38.5
    /// What the panel is narrower than the stage's share of the sheet by, each side.
    static func frameInset(for size: CGSize) -> CGFloat { narrow(size) ? 14 : 24 }
    static let frameRadius: CGFloat = 12
    /// What a template's note or app has to show itself in: the panel.
    static func window(for size: CGSize) -> CGSize {
        CGSize(width: stageWidth(for: size) - frameInset(for: size) * 2, height: stageHeight(for: size) - exampleRow)
    }
    /// A note's own margin inside the panel, the same on all four sides, and an app's (35 px at
    /// the stage's 69%, in template-stage.css).
    static let notePadding: CGFloat = 24
    /// A table's type and its cells' inset in an example on a sheet.
    static func tableSize(for size: CGSize) -> CGFloat { narrow(size) ? PageType.tableNarrow : PageType.table }
    static func tableInset(for size: CGSize) -> CGFloat { narrow(size) ? 6 : 8 }
    /// The list's share of the frame when a sub-note shows open beside it.
    static let listWidth: CGFloat = 252

    /// The page's type: one large thing (the name, over twice the body's size), the body, and
    /// small quiet labels; with the button's own size, four sizes, in three weights (bold for the
    /// name, semibold for labels and the button, regular).
    enum PageType {
        static let name: CGFloat = 23
        /// On a short sheet (a small window).
        static let nameShort: CGFloat = 20
        static let body: CGFloat = 13
        static let small: CGFloat = 12
        /// A table in an example: its words at the body's size, near enough (they were the
        /// system's footnote, 10 pt, beside 13 pt lines).
        static let table: CGFloat = 12
        /// On a narrow sheet, where five columns share 320 pt: a size smaller, and closer cells.
        static let tableNarrow: CGFloat = 11
    }
    /// How tall the fade at the frame's foot is, while the example has more under it.
    static let footFade: CGFloat = 40
    /// Where in the fade it has reached the panel's ground: its last 16 pt are solid.
    static let footSolid = 0.6
    /// The room a note's lines have in the frame: its width less the note's margins.
    static func lineRoom(for size: CGSize) -> CGFloat { window(for: size).width - notePadding * 2 }
    /// The room the words beside the stage have.
    static func wordsWidth(for size: CGSize) -> CGFloat { size.width - margin(for: size) - window(for: size).width - gap(for: size) - margin(for: size) }
    /// The name's size on every page of a sheet: one size for all (never a smaller one for a
    /// longer name, which read as less), beside its cover.
    static func nameSize(for size: CGSize) -> CGFloat { short(size) ? PageType.nameShort : PageType.name }
    /// How many lines the names take on a sheet: one where the longest fits beside the cover (the
    /// full sheet), two where it doesn't. Every page keeps room for that many, so Make never moves.
    static func nameLines(_ names: [String], size: CGFloat, room: CGFloat) -> Int {
        let font = NSFont.systemFont(ofSize: size, weight: .bold)
        return names.contains { ($0 as NSString).size(withAttributes: [.font: font]).width > room } ? 2 : 1
    }
    /// The head's height: the cover's, or the name's lines and the kind under them if taller.
    static func headHeight(lines: Int, name: CGFloat, cover: CGFloat) -> CGFloat {
        max(cover, CGFloat(lines) * (name * 1.2).rounded(.up) + 3 + 15)
    }
    /// The room a name has beside its cover.
    static func nameRoom(for size: CGSize) -> CGFloat { wordsWidth(for: size) - nameCover(for: size) - headGap }
    static let headGap: CGFloat = 14
    /// A short sheet (a small window): the words beside the stage sit closer, under a smaller
    /// cover, so the prompt still shows whole under the buttons.
    static func short(_ size: CGSize) -> Bool { size.height < 600 }
    /// The cover over the name: the small cover of "More like this", smaller on a short sheet.
    static func nameCover(for size: CGSize) -> CGFloat { short(size) ? 40 : moreCover }
    /// How many lines the description keeps room for, so what's under it never moves: three on
    /// the full sheet (the longest takes three), four where the words are narrow.
    static func descriptionLines(for size: CGSize) -> Int { narrow(size) ? 4 : 3 }
    /// The description's room: its lines at the body's size, with the 2 pt between them.
    static func descriptionHeight(for size: CGSize) -> CGFloat {
        let font = NSFont.systemFont(ofSize: PageType.body)
        let line = (font.ascender - font.descender + font.leading).rounded(.up)
        let lines = CGFloat(descriptionLines(for: size))
        return line * lines + 2 * (lines - 1)
    }
    /// How many lines Make's line takes on a sheet with this folder and AI: as many as an app's
    /// (the longer) needs, the same on every page so what's under it never moves. Its folder's
    /// name wraps with the rest: a long one has a line to itself.
    static func captionLines(for size: CGSize, ai: SetupCards.AI, folder: String, reach: SyncEngine.Reach = .online) -> Int {
        let c = TemplateLibraryWords.caption(app: true, ai: ai, folder: shownFolder(folder), reach: reach)
        let wide = ((c.lead + "\u{2009}" + c.folder + c.rest) as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: PageType.small)]).width + 16
        return min(3, max(1, Int((wide / (wordsWidth(for: size) - 6)).rounded(.up))))
    }
    /// A folder's name as Make's line shows it: whole, or with a very long one's middle left out,
    /// so both its start and its end show ("Everything f…ve in March"); the whole name is its help tag.
    static func shownFolder(_ name: String) -> String {
        guard name.count > 26 else { return name }
        return name.prefix(12).trimmingCharacters(in: .whitespaces) + "\u{2026}" + name.suffix(12).trimmingCharacters(in: .whitespaces)
    }

    // MARK: Moving between pages

    /// Between the gallery and a template's page, both ways, and from one template to the next,
    /// the sheet changes at once, in one frame: no fade and no slide. Dissolved one over the
    /// other, the covers' names showed through the page's example for eight frames; faded out
    /// and then in, the sheet was empty in between, a white flash in the light and a blink in
    /// the dark (60 fps frames from the Air, 9 and 10 November 2026).
    /// A page shows once its example is there, never before: an app is drawn first, out of sight
    /// (its picture stood in for it, a picture of another day: on a Tuesday the ring read "2 of 4"
    /// and then "6 of 8", a change you could see). What's showing stays as it is meanwhile; a
    /// page that still isn't ready `readyBy` after the click shows anyway, with its picture.
    static let readyBy: Double = 0.5
    /// How long the pointer rests on a cover before its page is got ready.
    static let warmAfter: Double = 0.12
    /// The pages laid out: the open one, the one being got ready for a click made, and the one
    /// got ready for the cover under the pointer; each once.
    static func pages(warm: TemplateCatalog.Entry?, loading: TemplateCatalog.Entry?, open: TemplateCatalog.Entry?) -> [TemplateCatalog.Entry] {
        var out: [TemplateCatalog.Entry] = []
        for e in [warm, loading, open] { if let e, !out.contains(e) { out.append(e) } }
        return out
    }
    /// The template the arrow keys move to: one along for left and right, a row for up and down.
    /// With nothing picked yet, the first.
    static func step(_ shown: [TemplateCatalog.Entry], from at: TemplateCatalog.Entry?, by: Int) -> TemplateCatalog.Entry? {
        guard !shown.isEmpty else { return nil }
        guard let at, let i = shown.firstIndex(of: at) else { return shown.first }
        let to = i + by
        return shown.indices.contains(to) ? shown[to] : at
    }

    /// The order a page's left and right arrows walk: the gallery's, as it's filtered now; all of
    /// them when the open template isn't in it (it was opened from "More like this").
    static func walk(_ shown: [TemplateCatalog.Entry], all: [TemplateCatalog.Entry], open: TemplateCatalog.Entry) -> [TemplateCatalog.Entry] {
        shown.contains(open) ? shown : all
    }

    /// Where an arrow key moves the ring on the front page: one card along its order for any
    /// arrow; nowhere for left and right while they'd move the cursor in what's typed in Search.
    static func arrow(_ order: [TemplateCatalog.Entry], from at: TemplateCatalog.Entry?, by: Int, sideways: Bool, query: String) -> TemplateCatalog.Entry? {
        if sideways, !query.isEmpty { return nil }
        return step(order, from: at.flatMap { order.contains($0) ? $0 : nil }, by: by)
    }

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 20, style: .continuous)
        let shown = order
        ZStack {
            // Under a page the front page keeps its place, out of sight, and takes no clicks or VoiceOver.
            front
                .opacity(open == nil ? 1 : 0)
                // Nor while a page is being got ready: a second click then would start a second move.
                .allowsHitTesting(open == nil && loading == nil)
                .accessibilityHidden(open != nil)
            // The open page, and under it, out of sight, the one being got ready. Each keeps its
            // own view from the moment it's laid out, so the app that drew out of sight is the app shown.
            ZStack {
                ForEach(Self.pages(warm: warm, loading: loading, open: open), id: \.slug) { e in
                    page(e, shown: shown)
                        .opacity(e == open ? 1 : 0)
                        .allowsHitTesting(e == open)
                        .accessibilityHidden(e != open)
                        .zIndex(e == open ? 2 : 1)
                }
            }
            // While a page is open the keys are with a view of no size beside it, so Tab walks the
            // page's own buttons (TemplateLibraryView.stops) whatever the Mac's keyboard navigation
            // setting, and the ring on a button is the cue. Beside the page, never around it: a
            // button inside something that has the keys counts as focused, and every one of them
            // drew its ring at once (real keys on the Air, 10 November 2026).
            .background {
                Color.clear.frame(width: 1, height: 1)
                    .focusable(open != nil, interactions: .edit)
                    .focused($keys, equals: .page)
                    .focusEffectDisabled()
                    .accessibilityHidden(true)
            }
        }
        .frame(width: size.width, height: size.height)
        // In a sheet the sheet is the panel and macOS dims the window (popupSheet).
        .background { if !inSheet { shape.fill(SetupCards.ground).shadow(color: .black.opacity(0.2), radius: 30, y: 20) } }
        .clipShape(inSheet ? RoundedRectangle(cornerRadius: 0) : shape)
        .overlay { if !inSheet { shape.strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5) } }
        .onKeyPress(.upArrow) { arrow(shown, by: -1, sideways: false) }
        .onKeyPress(.downArrow) { arrow(shown, by: 1, sideways: false) }
        .onKeyPress(.leftArrow) { arrow(shown, by: -1, sideways: true) }
        .onKeyPress(.rightArrow) { arrow(shown, by: 1, sideways: true) }
        // Esc with the keys inside an app's example (after a click in it): the same as Esc
        // anywhere on the page, back to the gallery. There the key is the example's first, and
        // what it didn't use closed the whole sheet (real keys on the Air, 10 November 2026).
        // Esc inside the example leaves the example (the ring is on it then); again, it goes back.
        .onExitCommand {
            guard !covered else { return uncover() }
            if open != nil, Self.inExample() { leaveExample() } else if open != nil { show(nil) } else { close() }
        }
        // On a page Return is Make, the page's default button; with the ring on another, that one.
        .onKeyPress(.return) { pressStop() || openFromKeys() ? .handled : .ignored }
        .onKeyPress(.space) { pressStop() ? .handled : .ignored }
        .onKeyPress(keys: [.tab, Self.backTab]) { tab($0) }
        // Typing anywhere on the front page types into the field, and brings the page back to it.
        .onKeyPress(characters: .alphanumerics.union(.punctuationCharacters), phases: .down) { press in
            guard open == nil, !covered, keys != .search, press.modifiers.subtracting(.shift).isEmpty else { return .ignored }
            query += press.characters
            keys = .search
            return .handled
        }
        .onAppear {
            if inSheet, let window = NSApp.mainWindow { size = Self.size(on: window.frame.size) }
            keys = open == nil ? .search : nil
        }
        // The keys go back to Search with the front page.
        .onChange(of: open) { _, now in
            keys = now == nil ? .search : .page
            stop = nil
        }
        // What's typed changes what shows: the ring goes.
        .onChange(of: query) { _, _ in focused = nil }
    }

    /// An arrow key: on the front page it moves the ring through the cards; on a page, left and
    /// right go to the template before and after in the front page's order (or Search's).
    private func arrow(_ shown: [TemplateCatalog.Entry], by: Int, sideways: Bool) -> KeyPress.Result {
        guard !covered else { return .ignored }
        if let open {
            guard sideways else { return .ignored }
            let order = Self.walk(shown, all: catalog.entries, open: open)
            if let to = Self.step(order, from: open, by: by), to != open {
                // The ring follows, so going back shows where you are.
                if focused != nil || shown.contains(to) { focused = shown.contains(to) ? to : nil }
                show(to)
            }
            return .handled
        }
        guard let to = Self.arrow(shown, from: focused, by: by, sideways: sideways, query: query) else { return .ignored }
        focused = to
        return .handled
    }

    /// Return, on the front page or in Search: opens the card the ring is on; with something
    /// typed and no ring, the best match.
    private func openFromKeys() -> Bool {
        let shown = order
        guard open == nil, !covered else { return false }
        if let to = focused.flatMap({ shown.contains($0) ? $0 : nil }) { show(to); return true }
        if case .results(let answers) = TemplateFrontPage.showing(query, in: catalog.entries), let first = answers.first { show(first.entry); return true }
        return false
    }

    /// Opens a template's page, goes from one template's to another's, or (nil) back to the
    /// gallery: each in one frame.
    private func show(_ e: TemplateCatalog.Entry?) {
        copied = false
        guard e != open || loading != nil else { return }
        move += 1
        let mine = move
        var instant = Transaction()
        instant.disablesAnimations = true
        guard let e else {
            // Back by a key (Esc, ⌘[, Return on Back): the ring is on the cover you came from.
            if let from = open, NSApp.currentEvent?.type == .keyDown, order.contains(from) { focused = from }
            withTransaction(instant) {
                loading = nil
                warm = nil
                open = nil
            }
            return
        }
        guard e != open else {
            loading = nil
            return
        }
        // The page is laid out and drawn out of sight first, and shown when its example is there.
        // The one the pointer rested on is there already.
        if warm != e { ready.remove(e.slug) }
        withTransaction(instant) {
            loading = e
            warm = nil
        }
        Task { @MainActor in
            let start = ContinuousClock.now
            while mine == move, !ready.contains(e.slug), start.duration(to: .now) < .seconds(Self.readyBy) { try? await Task.sleep(for: .milliseconds(12)) }
            guard mine == move else { return }
            withTransaction(instant) {
                open = e
                loading = nil
            }
        }
    }

    /// The pointer came onto a cover or left it: once it has rested there, that template's page
    /// is laid out and drawn out of sight, ready for the click.
    private func point(_ e: TemplateCatalog.Entry, _ on: Bool) {
        guard on else {
            if pointed == e.slug { pointed = nil }
            return
        }
        pointed = e.slug
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(Self.warmAfter))
            guard pointed == e.slug, open == nil, loading == nil, warm != e else { return }
            ready.remove(e.slug)
            var instant = Transaction()
            instant.disablesAnimations = true
            withTransaction(instant) { warm = e }
        }
    }

    // MARK: The front page

    /// The front page (TemplateFrontPage): it gets the library's parts and its keys, and opens a
    /// template's page here.
    private var front: some View {
        TemplateFrontPage(catalog: catalog, ai: ai, folder: folder, size: size, covered: covered, query: $query, focused: focused, keys: $keys,
                          held: { pressed[$0.slug] ?? have($0) }, act: { act($0, $1, $2) }, makeBlank: makeBlank, connect: connect, close: close,
                          open: { e in
                              focused = nil
                              show(e)
                          },
                          point: { point($0, $1) }, submit: { _ = openFromKeys() })
    }

    // MARK: A template's page

    private func page(_ e: TemplateCatalog.Entry, shown: [TemplateCatalog.Entry]) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Button { show(nil) } label: {
                    HStack(spacing: 5) {
                        Image(systemName: "chevron.left").font(.system(size: PageType.small, weight: .semibold))
                        Text(TemplateLibraryWords.title)
                    }
                }
                .buttonStyle(.quiet)
                .overlay { ring(.back, on: e, radius: 8) }
                // Esc goes back, and ⌘[ (the hidden button under it).
                .keyboardShortcut(e == open && !covered ? .cancelAction : nil)
                .background {
                    Group {
                        Button("") { show(nil) }.keyboardShortcut(e == open && !covered ? KeyboardShortcut("[", modifiers: .command) : nil)
                        // The arrows, to the template before and after in the gallery's order.
                        Button("") { _ = arrow(shown, by: -1, sideways: true) }.keyboardShortcut(e == open ? KeyboardShortcut(.leftArrow, modifiers: []) : nil)
                        Button("") { _ = arrow(shown, by: 1, sideways: true) }.keyboardShortcut(e == open ? KeyboardShortcut(.rightArrow, modifiers: []) : nil)
                    }
                    .opacity(0).accessibilityHidden(true)
                }
                .accessibilityLabel(TemplateLibraryWords.back)
                .accessibilityIdentifier("templates.back")
                Spacer(minLength: 0)
                CardCloseButton(cancels: false, action: close)
                    .overlay { ring(.close, on: e, radius: 13) }
            }
            // Back's chevron on the margin: the quiet button has 9 pt of its own inside it.
            .padding(.leading, Self.margin(for: size) - 9)
            .padding(.trailing, Self.margin(for: size))
            .frame(height: Self.controls)
            .padding(.top, Self.margin(for: size))
            // One surface, and no lines on it: the example in its panel, the words a clear gap
            // beside it, "More like this" set off by the space over its heading (Emil, 10
            // November 2026: "many divider lines ... makes it look cheap").
            HStack(spacing: 0) {
                stage(e)
                words(e)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .frame(height: Self.stageHeight(for: size))
            if Self.showsMore(size) {
                more(e)
                    .frame(height: Self.moreHeight(for: size))
                    // A template with none like it (one the site adds later): the room stays.
                    .opacity(Self.related(e, in: catalog.entries).isEmpty ? 0 : 1)
            }
        }
        .frame(width: size.width, height: size.height, alignment: .topLeading)
    }

    /// What an example sits on in its panel: the notes' own ground, white, or black in the dark,
    /// so a note there is the note you get and an app's own cards show as they do in your notes.
    private var frameGround: Color { scheme == .dark ? .black : .white }

    /// The stage: the template in use, large, in a rounded panel on the sheet itself, under a
    /// small label: "Example" (what Make adds is empty, and your AI fills it in), and for an app,
    /// which is live there, that nothing you try is kept. No band behind the panel and no line
    /// around it: in the dark its black is a shade under the sheet's grey; in the light, white on
    /// white, a very soft shadow lifts it. A note's lines keep their own margin in the panel and
    /// scroll in it when there are more than fit, its foot fading while there's more under it; an
    /// app takes the panel's whole width, with its own tabs at the foot, and scrolls as it does
    /// in your notes.
    private func stage(_ e: TemplateCatalog.Entry) -> some View {
        let window = Self.window(for: size), inset = Self.margin(for: size)
        let frame = RoundedRectangle(cornerRadius: Self.frameRadius, style: .continuous)
        return VStack(alignment: .leading, spacing: 0) {
            Text(TemplateLibraryWords.example(e))
                .font(.system(size: PageType.small, weight: .semibold))
                .foregroundStyle(Color.muted)
                .lineLimit(1)
                .frame(height: Self.exampleRow - 10, alignment: .bottomLeading)
                .padding(.bottom, 10)
                .accessibilityIdentifier("templates.example")
            inUse(e)
                .frame(width: window.width, height: window.height, alignment: .topLeading)
                .background(frameGround)
                .clipShape(frame)
                // The light look's lift: a close soft edge and a wider, fainter one. None in the
                // dark, where a shadow shows nothing and the panel is darker than the sheet.
                .shadow(color: .black.opacity(scheme == .dark ? 0 : Self.panelShadow.near), radius: 1.5, y: 0.5)
                .shadow(color: .black.opacity(scheme == .dark ? 0 : Self.panelShadow.far), radius: 14, y: 4)
                .overlay { ring(.example, on: e, radius: Self.frameRadius) }
                .accessibilityLabel("\(e.title), an example")
        }
        .padding(.leading, inset)
        .frame(width: inset + window.width, height: Self.stageHeight(for: size), alignment: .topLeading)
    }

    /// The panel's shadow in the light: how dark its close edge and its wider fall are.
    static let panelShadow = (near: 0.10, far: 0.07)

    /// The app itself when it is one, running on its sample; otherwise the filled-in note, drawn
    /// as the app draws notes.
    @ViewBuilder private func inUse(_ e: TemplateCatalog.Entry) -> some View {
        let window = Self.window(for: size)
        if let project = TemplateFiles.project(e) {
            // Tick, add, change tabs and scroll as you would; nothing it does is kept. Its picture
            // shows while it starts, so the stage is never blank.
            TemplateAppPreview(entry: e, project: project, narrow: Self.narrow(size)) { id in
                ready.insert(e.slug)
                webs[e.slug] = id
            }
        } else if let opened = TemplateFiles.opened(e), !Self.narrow(size) {
            // A note that files sub-notes, with one of them open beside it: the list on the left,
            // its open row picked, and the sub-note it leads to on the right, as the two panes of
            // the notes window.
            scrolls(e) {
                HStack(alignment: .top, spacing: 0) {
                    NotePreview(markdown: e.example, given: TemplateFiles.example(e, room: Self.listWidth - Self.notePadding * 2), whole: true,
                                margin: Self.notePadding, tableSize: PageType.table, picked: TemplateFiles.openedName(e))
                        .frame(width: Self.listWidth, alignment: .topLeading)
                    // No line between the two: the picked row says which one is open beside it.
                    NotePreview(markdown: e.opened ?? "", given: opened, whole: true, margin: Self.notePadding, tableSize: PageType.table)
                        .frame(maxWidth: .infinity, alignment: .topLeading)
                }
                .frame(minHeight: window.height, alignment: .topLeading)
            }
            .onAppear { ready.insert(e.slug) }
        } else {
            // All of the example, at the frame's width: what doesn't fit is a scroll away, under
            // the fade at the foot.
            scrolls(e) {
                NotePreview(markdown: e.example, given: TemplateFiles.example(e, room: Self.lineRoom(for: size)), whole: true,
                            margin: Self.notePadding, tableSize: Self.tableSize(for: size), tableRoom: Self.lineRoom(for: size), tableInset: Self.tableInset(for: size))
            }
            // A note is there as soon as it's laid out.
            .onAppear { ready.insert(e.slug) }
        }
    }

    /// A note's example in its frame: it scrolls when it's taller than the frame, and while there
    /// is more under the foot the foot fades into the frame's ground, so a line the foot cuts is
    /// never a hard edge and the fade says there's more (council, 10 November 2026: an example
    /// stopped at whole blocks with nothing to say the rest was there).
    private func scrolls(_ e: TemplateCatalog.Entry, @ViewBuilder _ content: () -> some View) -> some View {
        ScrollView(.vertical) {
            content()
                .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .onScrollGeometryChange(for: Bool.self, of: { Self.more(content: $0.contentSize.height, offset: $0.contentOffset.y, room: $0.containerSize.height) }) { _, more in
            if more { below.insert(e.slug) } else { below.remove(e.slug) }
        }
        .onScrollGeometryChange(for: Bool.self, of: { $0.contentOffset.y > 1 }) { _, scrolled in
            if scrolled { above.insert(e.slug) } else { above.remove(e.slug) }
        }
        .overlay(alignment: .bottom) {
            // Solid over the panel's last 16 pt: a line the foot cuts is under it, so what shows
            // ends on a whole line, fading (it showed half a line at the edge).
            LinearGradient(stops: [.init(color: frameGround.opacity(0), location: 0), .init(color: frameGround, location: Self.footSolid), .init(color: frameGround, location: 1)], startPoint: .top, endPoint: .bottom)
                .frame(height: Self.footFade)
                .opacity(below.contains(e.slug) ? 1 : 0)
                .allowsHitTesting(false)
                .accessibilityHidden(true)
        }
        // Scrolled, its top fades the same way: a line the panel's top cuts is never a hard edge
        // either (real scrolling on the Air, 10 November 2026: a table's header cut through).
        .overlay(alignment: .top) {
            LinearGradient(stops: [.init(color: frameGround, location: 0), .init(color: frameGround, location: 1 - Self.footSolid), .init(color: frameGround.opacity(0), location: 1)], startPoint: .top, endPoint: .bottom)
                .frame(height: Self.footFade)
                .opacity(above.contains(e.slug) ? 1 : 0)
                .allowsHitTesting(false)
                .accessibilityHidden(true)
        }
    }

    /// Whether an example has more under its frame's foot than shows.
    static func more(content: CGFloat, offset: CGFloat, room: CGFloat) -> Bool { content - offset - room > 1 }

    /// A note on the stage as it looks in use, under the name the page gives it: without its title
    /// and its opening lines, from its first heading (council rounds 2 and 3: the stage repeated
    /// the title and the description). A note with no heading keeps its lines. A table keeps its
    /// first `stageColumns` columns, and of those only as many as their words fit in `room`.
    static func staged(_ markdown: String, room: CGFloat = lineRoom(for: size)) -> [NotePreview.Block] {
        var blocks = NotePreview.blocks(markdown)
        if case .title = blocks.first { blocks.removeFirst() }
        let opening = { (b: NotePreview.Block) -> Bool in if case .paragraph = b { return true }; return b == .gap }
        if blocks.contains(where: { !opening($0) }) {
            while let first = blocks.first, opening(first) { blocks.removeFirst() }
        }
        while blocks.first == .gap { blocks.removeFirst() }
        // A section still empty ("## Weekend" straight over "## Baking") shows nothing in use, and
        // its heading can't end the stage, so it left a gap there (council round 6).
        var i = 0
        while i < blocks.count {
            if case .heading(let level, _) = blocks[i] {
                var j = i + 1
                while j < blocks.count, blocks[j] == .gap { j += 1 }
                let empty: Bool = { guard j < blocks.count else { return true }; if case .heading(let next, _) = blocks[j] { return next <= level }; return false }()
                if empty { blocks.removeSubrange(i..<j); continue }
            }
            i += 1
        }
        while blocks.last == .gap { blocks.removeLast() }
        // Every column shows, at any width: where a row's cells don't fit on one line each, they
        // wrap (on the smallest sheet Job hunt lost "Next step", the column its page sells).
        return blocks
    }

    // MARK: The page's buttons

    /// What the page's button does: Make with your AI; with no AI that opens with the ask, or
    /// while sync is away, it only adds; for a template you made and still have, it opens it.
    enum Mode: Equatable { case make, plain, have }
    static func mode(ai: SetupCards.AI, reach: SyncEngine.Reach, have: String?) -> Mode {
        have != nil ? .have : ai.asks && reach == .online ? .make : .plain
    }

    /// The arrow's menu: your other AIs to make it with (for one you have: your AIs to ask about
    /// it), and under them the prompt to copy. Empty when Copy would be all of it: then there's no
    /// arrow, and Copy is beside the prompt (council, 10 November 2026: a menu of one item).
    enum MenuItem: Equatable { case make(SetupCards.AI), ask(SetupCards.AI), divider, copy }
    static func menu(_ mode: Mode, ai: SetupCards.AI, ais: [SetupCards.AI], reach: SyncEngine.Reach = .online) -> [MenuItem] {
        let others: [MenuItem] = switch mode {
        case .make: ais.filter { $0 != ai && $0.asks }.map { .make($0) }
        case .have: reach == .online ? ais.filter(\.asks).map { .ask($0) } : []
        case .plain: []
        }
        return others.isEmpty ? [] : others + [.divider, .copy]
    }

    /// The page's buttons in the order Tab walks them: its own first (Make, the arrow, the second
    /// button, the link, Copy), then Back and Close, the tiles under "More like this", and last
    /// the example, one stop: Return goes into an app there and Esc comes out. Tab used to go
    /// into the example's app and never reach Make (council, 10 November 2026).
    enum Stop: Hashable { case make, arrow, secondary, connect, copy, back, close, more(String), example }
    static func stops(arrow: Bool, secondary: Bool, connect: Bool, copy: Bool, related: [String], example: Bool) -> [Stop] {
        [.make] + (arrow ? [.arrow] : []) + (secondary ? [.secondary] : []) + (connect ? [.connect] : []) + (copy ? [.copy] : [])
            + [.back, .close] + related.map { .more($0) } + (example ? [.example] : [])
    }
    /// The stop after this one (before it, by -1), around the ends; from none, the first (the last).
    static func next(_ stops: [Stop], from at: Stop?, by: Int) -> Stop? {
        guard !stops.isEmpty else { return nil }
        guard let at, let i = stops.firstIndex(of: at) else { return by < 0 ? stops.last : stops.first }
        return stops[(i + by + stops.count) % stops.count]
    }
    static let backTab = KeyEquivalent("\u{19}")

    /// What a page shows, worked out once: its button's mode, the arrow's menu, and which of the
    /// other things are there.
    struct Parts {
        let mode: Mode
        let menu: [MenuItem]
        let have: String?
        let connect: Bool
        var arrow: Bool { !menu.isEmpty }
        var secondary: Bool { mode == .make }
        var copy: Bool { menu.isEmpty }
    }
    private func parts(_ e: TemplateCatalog.Entry) -> Parts {
        // Once its button is pressed a page stays as it was: the note is made at once, and while
        // the library waited for an app's first screen the page turned to "Open Habit tracker,
        // Already in Notes" for a third of a second (real frames from the Air, 10 November 2026).
        let had = pressed[e.slug] ?? have(e)
        let mode = Self.mode(ai: ai, reach: reach, have: had)
        return Parts(mode: mode, menu: Self.menu(mode, ai: ai, ais: ais, reach: reach), have: had, connect: mode == .plain && !ai.asks && connect != nil)
    }
    private func stops(_ e: TemplateCatalog.Entry) -> [Stop] {
        let p = parts(e)
        return Self.stops(arrow: p.arrow, secondary: p.secondary, connect: p.connect, copy: p.copy,
                          related: Self.showsMore(size) ? Self.related(e, in: catalog.entries).map(\.slug) : [], example: e.app)
    }

    /// The ring on the button Tab is on: the covers' own ring.
    @ViewBuilder private func ring(_ s: Stop, on e: TemplateCatalog.Entry, radius: CGFloat) -> some View {
        if stop == s, e == open {
            RoundedRectangle(cornerRadius: radius + 3, style: .continuous).strokeBorder(Color.paneAccent, lineWidth: 2.5).padding(-4)
                .allowsHitTesting(false)
                .accessibilityHidden(true)
        }
    }

    private func tab(_ press: KeyPress) -> KeyPress.Result {
        guard let open, !covered else { return .ignored }
        let back = press.modifiers.contains(.shift) || press.key == Self.backTab
        stop = Self.next(stops(open), from: stop, by: back ? -1 : 1)
        return .handled
    }

    /// Return or Space with the ring on a button: presses it.
    private func pressStop() -> Bool {
        guard let e = open, let s = stop, !covered else { return false }
        switch s {
        case .make: primary(e, parts(e))
        case .arrow: popMenu(e, parts(e))
        case .secondary: press(e, .other)
        case .connect: connect?()
        case .copy: copy(e)
        case .back: show(nil)
        case .close: close()
        case .more(let slug): if let r = catalog.entries.first(where: { $0.slug == slug }) { show(r) }
        case .example: enterExample(e)
        }
        return true
    }

    /// The keys go into the example's app: Tab then walks its own controls.
    private func enterExample(_ e: TemplateCatalog.Entry) {
        guard let id = webs[e.slug], let web = NotePageLive.view(id), let window = web.window else { return }
        window.makeFirstResponder(web)
    }

    /// Whether the keys are in an example's app.
    static func inExample() -> Bool {
        var view = NSApp.keyWindow?.firstResponder as? NSView
        while let v = view {
            if v is WKWebView { return true }
            view = v.superview
        }
        return false
    }

    /// The keys come back from the example's app to the page, the ring on the example.
    private func leaveExample() {
        NSApp.keyWindow?.makeFirstResponder(nil)
        keys = nil
        stop = .example
        DispatchQueue.main.async { keys = .page }
    }

    /// Beside the stage, each thing once: the cover with the name and the kind beside it, on one
    /// row; what it is; the button that makes it, with the line saying what it adds, where, and
    /// what opens right under it, so the line is Make's; then, apart and plainly second, the way
    /// to do it yourself; and what your AI is asked, quoted. Everything down to the buttons keeps
    /// its place from one template to the next (the name is one size on every page and keeps room
    /// for the longest, the description for its longest), so paging with the arrows never moves it.
    private func words(_ e: TemplateCatalog.Entry) -> some View {
        let wide = Self.wordsWidth(for: size), short = Self.short(size)
        let p = parts(e)
        let cover = Self.nameCover(for: size), name = Self.nameSize(for: size)
        let lines = Self.nameLines(catalog.entries.map(\.title), size: name, room: Self.nameRoom(for: size))
        return VStack(alignment: .leading, spacing: 0) {
            // The cover you clicked, small, beside its name: the page is that card's.
            HStack(alignment: .center, spacing: Self.headGap) {
                Self.thumbnail(e.pick, side: cover)
                VStack(alignment: .leading, spacing: 3) {
                    Text(e.title).font(.system(size: name, weight: .bold)).foregroundStyle(Color.ink)
                        .lineLimit(lines)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                        .accessibilityIdentifier("templates.name")
                    kind(e, have: p.have)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(height: Self.headHeight(lines: lines, name: name, cover: cover), alignment: .leading)
            Text(NoWidow.kept(e.shownDescription, phrases: true)).font(.system(size: PageType.body)).foregroundStyle(Color.ink)
                .lineSpacing(2)
                .lineLimit(Self.descriptionLines(for: size))
                .fixedSize(horizontal: false, vertical: true)
                // One height whatever its lines: the room the system keeps for a line count
                // leaves out the spacing between lines, and a three-line description put the
                // button 4 pt lower than a two-line one (every page side by side, 10 November 2026).
                .frame(height: Self.descriptionHeight(for: size), alignment: .topLeading)
                .padding(.top, short ? 10 : 12)
            actions(e, p)
                .padding(.top, short ? 10 : 14)
            // What Make does, right under Make: never under the other button, where it read as
            // that one's.
            caption(e, p)
                .padding(.top, 8)
            if p.connect, let connect {
                // No AI connected: the way to get one, quietly, under what Add does. It opens over
                // this page, and the page is here when it closes.
                Button(TemplateLibraryWords.connect, action: connect)
                    .buttonStyle(.textLink)
                    .overlay { ring(.connect, on: e, radius: 4) }
                    .padding(.top, 4)
                    .accessibilityIdentifier("templates.connect")
            }
            if p.secondary {
                // The other way, plainly second: lower and quieter than Make, and named for what
                // you do next.
                Button(TemplateLibraryWords.addMyself(e)) { press(e, .other) }
                    .buttonStyle(.secondaryQuiet)
                    .overlay { ring(.secondary, on: e, radius: 10) }
                    .padding(.top, short ? 8 : 14)
                    .accessibilityIdentifier("templates.withoutAI")
            }
            asked(e, p)
                .padding(.top, short ? 12 : 18)
            Spacer(minLength: 0)
        }
        .frame(width: wide, alignment: .leading)
        .padding(.leading, Self.gap(for: size))
        .padding(.trailing, Self.margin(for: size))
        // The cover's top level with the panel's (on a short sheet, with the label over it).
        .padding(.top, short ? 16 : Self.exampleRow)
    }

    /// Under the name: the kind, and for a template you made and still have, where it is.
    private func kind(_ e: TemplateCatalog.Entry, have: String?) -> some View {
        Group {
            if let have {
                Text("\(TemplateLibraryWords.kind(e)) \u{00B7} Already in ")
                    + Text(Image(systemName: "folder")).foregroundStyle(Color.paneAccent.opacity(0.85))
                    + Text("\u{2009}\(Self.shownFolder(have))").foregroundStyle(Color.ink)
            } else {
                Text(TemplateLibraryWords.kind(e))
            }
        }
        .font(.system(size: PageType.small)).foregroundStyle(Color.muted)
        .lineLimit(1)
        .accessibilityIdentifier("templates.kind")
    }

    /// What your AI is asked: a small label naming it, and under it the words that get sent, in
    /// quotation marks, small and in the labels' grey: a quotation, not a second description (in
    /// ink it read as one; in a box, as a field). Where there's no arrow with its menu, Copy is
    /// beside the label.
    private func asked(_ e: TemplateCatalog.Entry, _ p: Parts) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 10) {
                Text(TemplateLibraryWords.asked(ai, sent: p.arrow || p.mode == .make)).font(.system(size: PageType.small, weight: .semibold)).foregroundStyle(Color.muted)
                if p.copy {
                    Button(copied ? TemplateLibraryWords.copiedShort : TemplateLibraryWords.copyShort) { copy(e) }
                        .buttonStyle(.textLink)
                        .overlay { ring(.copy, on: e, radius: 4) }
                        .accessibilityLabel(TemplateLibraryWords.copy)
                        .accessibilityIdentifier("templates.copy")
                }
            }
            .frame(height: 16)
            Text("\u{201C}\(NoWidow.kept(TemplateCatalog.Entry.sendable(prompt(e, p)), phrases: true))\u{201D}")
                .font(.system(size: PageType.small)).foregroundStyle(Color.muted)
                .lineSpacing(2)
                .lineLimit(5)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier("templates.ask")
        }
    }

    /// The ask a page shows and copies: the template's; for one you have, the everyday one.
    private func prompt(_ e: TemplateCatalog.Entry, _ p: Parts) -> String { p.mode == .have ? TemplateLibraryWords.everydayAsk(e) : e.ask }

    /// What Make does, plainly, right under it: "Adds an empty note to (folder) Work, then opens
    /// ChatGPT." The folder is Go to Note's tag: a small folder in the accent, then its name, whole
    /// (a long one wraps onto a line of its own; a very long one loses its middle, and its help
    /// tag has all of it). As many lines on every page of a sheet, so nothing under it moves.
    private func caption(_ e: TemplateCatalog.Entry, _ p: Parts) -> some View {
        let lines = Self.captionLines(for: size, ai: ai, folder: folder, reach: reach)
        let c = TemplateLibraryWords.caption(e, ai: ai, folder: folder, have: p.have, reach: reach)
        return Group {
            if copied, p.arrow {
                Text("\(Image(systemName: "checkmark")) \(TemplateLibraryWords.copied)")
            } else {
                Text(c.lead)
                    + Text(Image(systemName: "folder")).foregroundStyle(Color.paneAccent.opacity(0.85))
                    + Text("\u{2009}\(Self.shownFolder(c.folder))").foregroundStyle(Color.ink)
                    + Text(c.rest)
            }
        }
        .font(.system(size: PageType.small)).foregroundStyle(Color.muted)
        .lineLimit(lines)
        .fixedSize(horizontal: false, vertical: true)
        // One height whatever it says (the folder's glyph makes a line a hair taller).
        .frame(height: CGFloat(lines) * 17, alignment: .topLeading)
        .help(c.folder)
        .accessibilityIdentifier("templates.caption")
    }

    /// The button: Make with the AI shown (or what it adds, or Open for one you have), and where
    /// there's more than the prompt to offer, an arrow with your other AIs and the prompt to copy.
    @ViewBuilder private func actions(_ e: TemplateCatalog.Entry, _ p: Parts) -> some View {
        if p.arrow {
            HStack(spacing: 1) {
                Button { primary(e, p) } label: { makeLabel(e, p) }
                    .buttonStyle(.amberProminent(.regular, wide: true, joined: .leading))
                    .overlay { ring(.make, on: e, radius: 10) }
                    // Return makes the open template.
                    .keyboardShortcut(e == open && !covered ? .defaultAction : nil)
                    .accessibilityIdentifier("templates.make")
                // The menu is the system's, put up by hand: its right edge on the arrow's (the
                // button's own menu hung 75 pt past the sheet), and Return opens it from the keys.
                Button { popMenu(e, p) } label: {
                    Image(systemName: "chevron.down").font(.system(size: PageType.small, weight: .semibold))
                }
                .buttonStyle(.amberProminent(.regular, joined: .trailing))
                .fixedSize()
                .background(TemplateMenuAnchor(box: anchor))
                .overlay { ring(.arrow, on: e, radius: 10) }
                .accessibilityLabel(TemplateLibraryWords.more)
                .accessibilityIdentifier("templates.makeWith")
            }
        } else {
            Button { primary(e, p) } label: { makeLabel(e, p) }
                .buttonStyle(.amberProminent(.regular, wide: true))
                .overlay { ring(.make, on: e, radius: 10) }
                .keyboardShortcut(e == open && !covered ? .defaultAction : nil)
                .accessibilityIdentifier("templates.make")
        }
    }

    private func primary(_ e: TemplateCatalog.Entry, _ p: Parts) { press(e, p.mode == .have ? .other : ai) }

    /// The arrow's menu, its right edge on the arrow's.
    private func popMenu(_ e: TemplateCatalog.Entry, _ p: Parts) {
        guard let view = anchor.view else { return }
        let menu = NSMenu()
        menu.autoenablesItems = false
        var actions: [MenuAction] = []
        func add(_ title: String, _ image: NSImage?, _ run: @escaping () -> Void) {
            let action = MenuAction(run)
            actions.append(action)
            let item = NSMenuItem(title: title, action: #selector(MenuAction.fire), keyEquivalent: "")
            item.target = action
            // The picture is in the row's own words: a menu put up by hand showed no item's
            // image (a real menu on the Air, 10 November 2026), and an AI named is an AI shown.
            item.attributedTitle = Self.menuTitle(title, image)
            menu.addItem(item)
        }
        for item in p.menu {
            switch item {
            case .divider: menu.addItem(.separator())
            // An AI's mark is its own picture, in its colours; the copy symbol takes the menu's ink.
            case .make(let other): add(TemplateLibraryWords.make(e, other), AIGlyph.menuPicture(other.name, dark: scheme == .dark)) { picked = other; press(e, other) }
            case .ask(let asked): add(TemplateLibraryWords.ask(asked), AIGlyph.menuPicture(asked.name, dark: scheme == .dark)) { press(e, asked) }
            case .copy: add(TemplateLibraryWords.copy, NSImage(systemSymbolName: "doc.on.doc", accessibilityDescription: nil)) { copy(e) }
            }
        }
        // On the next turn, once the arrow's own press is over: put up inside it, the menu
        // sometimes closed as it opened (a real click on the Air, 10 November 2026).
        // (And with the keys out of the example's app: while it had them, after a click in it,
        // the menu closed as it opened.)
        if Self.inExample() { view.window?.makeFirstResponder(nil) }
        DispatchQueue.main.async {
            menu.popUp(positioning: nil, at: NSPoint(x: view.bounds.maxX - menu.size.width, y: view.bounds.maxY + 6), in: view)
            _ = actions
        }
    }

    /// A menu row's words with its picture before them, at the menu's size.
    static func menuTitle(_ title: String, _ image: NSImage?) -> NSAttributedString {
        let out = NSMutableAttributedString()
        if let image {
            let picture = NSTextAttachment()
            picture.image = image
            picture.bounds = CGRect(x: 0, y: -3, width: 16, height: 16)
            out.append(NSAttributedString(attachment: picture))
            out.append(NSAttributedString(string: "  "))
        }
        out.append(NSAttributedString(string: title))
        out.addAttribute(.font, value: NSFont.menuFont(ofSize: 0), range: NSRange(location: 0, length: out.length))
        return out
    }

    /// "Make with ChatGPT" with ChatGPT's mark: an AI named is an AI shown.
    private func makeLabel(_ e: TemplateCatalog.Entry, _ p: Parts) -> some View {
        HStack(spacing: 7) {
            if p.mode == .make { AIGlyph(ai: ai.name, size: 15, monochrome: true) }
            Text(TemplateLibraryWords.primary(e, ai, p.mode))
        }
    }

    private func copy(_ e: TemplateCatalog.Entry) {
        ConnectClipboard.set(SetupCards.prompt(e.pick(asking: prompt(e, parts(e)))))
        copied = true
        Task {
            try? await Task.sleep(for: .seconds(1.6))
            copied = false
        }
    }

    /// More like this, under the page: three or four for the same need, a small cover, a name and
    /// its line from the gallery each, the names on one line across the row. Each takes an even share of the row (three
    /// take a third each: a quarter each left a hole where a fourth would be). A click swaps the
    /// page to it.
    private func more(_ e: TemplateCatalog.Entry) -> some View {
        let related = Self.related(e, in: catalog.entries)
        let share = (size.width - Self.margin(for: size) * 2 - Self.gap * CGFloat(max(related.count, 1) - 1)) / CGFloat(max(related.count, 1))
        return VStack(alignment: .leading, spacing: 10) {
            Text(TemplateLibraryWords.moreLike).font(.system(size: PageType.small, weight: .semibold)).foregroundStyle(Color.muted)
            HStack(alignment: .top, spacing: Self.gap) {
                ForEach(related) { r in
                    Button { show(r) } label: {
                        // The name starts level with its cover's top on every tile, whether it
                        // takes one line or two, with a kind under it or none.
                        HStack(alignment: .top, spacing: 12) {
                            Self.thumbnail(r.pick)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(r.title).font(.system(size: PageType.body, weight: .semibold)).foregroundStyle(Color.ink).lineLimit(1)
                                // Its line from its card in the gallery, on every tile: one
                                // pattern (a kind showed on some tiles and not on others).
                                HStack(spacing: SetupTemplateCard.markGap) {
                                    if r.app { AppMarkView(size: SetupTemplateCard.markSize) }
                                    Text(TemplateLibraryWords.line(r)).font(.system(size: PageType.small)).foregroundStyle(Color.muted).lineLimit(1)
                                }
                            }
                            .multilineTextAlignment(.leading)
                            .padding(.top, 10)
                            Spacer(minLength: 0)
                        }
                        .padding(.vertical, 8)
                        .padding(.trailing, 8)
                        // The cover sits on the margin; the tile's wash reaches 8 pt past it.
                        .frame(width: share - 8, alignment: .leading)
                        .padding(.leading, 8)
                        // All of the tile takes the click: without a shape of its own, a press
                        // between the cover and the name, or beside them, did nothing (real clicks
                        // on the Air, 9 November 2026).
                        .contentShape(.rect)
                    }
                    .buttonStyle(.tile(radius: 14))
                    .overlay { ring(.more(r.slug), on: e, radius: 14) }
                    .accessibilityIdentifier("templates.more.\(r.slug)")
                }
            }
            // The first cover on the margin, its tile's wash 8 pt past it.
            .padding(.leading, -8)
        }
        .padding(.leading, Self.margin(for: size))
        // The covers end a margin over the sheet's foot (a tile's wash reaches 8 pt under its
        // cover); the heading starts the page's gap under the example's panel.
        .padding(.bottom, Self.margin(for: size) - 8)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
    }

    static let moreCover: CGFloat = 56

    /// A template's cover, small: beside its name on its page, and under "More like this". The
    /// whole picture, the same in light and dark.
    static func thumbnail(_ pick: SetupCards.Pick, side: CGFloat = moreCover) -> some View {
        Color(rgb: pick.ground)
            .frame(width: side, height: side)
            .overlay(alignment: .top) { pick.image.resizable().scaledToFill().frame(width: side, height: side) }
            .clipShape(.rect(cornerRadius: 10, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(Color.primary.opacity(0.12), lineWidth: 0.5))
            .accessibilityHidden(true)
    }

    /// More like this: the templates for the same need, nearest first, as the site lists them for
    /// this one (web/content/templates, `related`; the app's copy carries them). Never one from
    /// the same kind only to fill the row (Habit tracker under Reading list).
    static func related(_ e: TemplateCatalog.Entry, in all: [TemplateCatalog.Entry]) -> [TemplateCatalog.Entry] {
        (e.related ?? []).compactMap { slug in all.first { $0.slug == slug && $0 != e } }.prefix(4).map { $0 }
    }
}

/// Where the arrow's menu goes up from: the arrow's own place in the window.
struct TemplateMenuAnchor: NSViewRepresentable {
    final class Box { weak var view: NSView? }
    final class Flipped: NSView { override var isFlipped: Bool { true } }
    let box: Box

    func makeNSView(context: Context) -> NSView { Flipped() }
    func updateNSView(_ view: NSView, context: Context) { box.view = view }
}

/// A menu row's action.
final class MenuAction: NSObject {
    let run: () -> Void
    init(_ run: @escaping () -> Void) { self.run = run }
    @objc func fire() { run() }
}

/// A template's files, read once: each pass of the library used to read the app's project and
/// starting data and decode its picture again (a key typed, a card picked, the pointer moving).
@MainActor enum TemplateFiles {
    private static var projects: [String: String?] = [:]
    private static var starts: [String: NotePageData.Doc] = [:]
    private static var samples: [String: NotePageData.Doc] = [:]
    private static var pictures: [String: NSImage?] = [:]

    /// The app as the stage runs it: its project with template-stage.css in its page's head (no
    /// tab bar, titles under the sheet's own). Make adds the project as it is, never this.
    static func project(_ e: TemplateCatalog.Entry) -> String? {
        if let p = projects[e.slug] { return p }
        let p = e.appProject.map { staged($0) }
        projects[e.slug] = .some(p)
        return p
    }

    /// template-stage.css, as scripts/template-stage-pictures.ts puts it in the pictures' page.
    nonisolated static let stageCSS: String = Bundle.main.url(forResource: "template-stage", withExtension: "css")
        .flatMap { try? String(contentsOf: $0, encoding: .utf8) } ?? ""
    /// template-stage.js: only whole blocks above the stage's foot (council round 5), as the
    /// pictures' page runs it too.
    nonisolated static let stageScript: String = Bundle.main.url(forResource: "template-stage", withExtension: "js")
        .flatMap { try? String(contentsOf: $0, encoding: .utf8) } ?? ""

    /// A stored project with the stage's stylesheet and script in its page's head.
    nonisolated static func staged(_ project: String, css: String = stageCSS, script: String = stageScript) -> String {
        guard var p = (try? JSONSerialization.jsonObject(with: Data(project.utf8))) as? [String: Any],
              var files = p["files"] as? [String: Any], let page = files["/index.html"] as? String, page.contains("</head>"),
              !css.isEmpty else { return project }
        let run = script.isEmpty ? "" : "<script>\(script)</script>"
        files["/index.html"] = page.replacingOccurrences(of: "</head>", with: "<style>\(css)</style>\(run)</head>")
        p["files"] = files
        return (try? JSONSerialization.data(withJSONObject: p)).map { String(decoding: $0, as: UTF8.self) } ?? project
    }

    /// The app in use, for the stage only: its sample data (scripts/template-samples.py), with
    /// every date moved from the day it was written for to today, so what it ticked "today" is
    /// ticked today. Make adds the starting data, never this (council round 4: "0 of 4 done
    /// today", "No trip yet", "0 kr spent"). An app with no sample shows its starting data.
    static func sample(_ e: TemplateCatalog.Entry, today: Date = .now) -> NotePageData.Doc {
        if let d = samples[e.slug] { return d }
        let d = Bundle.main.url(forResource: "template-app-\(e.slug).sample", withExtension: "json")
            .flatMap { try? Data(contentsOf: $0) }
            .flatMap { try? JSONSerialization.jsonObject(with: $0) }
            .map { TemplateSample.moved($0, days: TemplateSample.days(to: today)) }
            .flatMap { try? JSONSerialization.data(withJSONObject: $0) }
            .map { NotePageData.decode($0) } ?? start(e)
        samples[e.slug] = d
        return d
    }

    /// A note's example as the stage shows it: its dates moved to today (TemplateExample), without
    /// its title and opening lines, tables trimmed to the stage (TemplateLibraryView.staged).
    static func example(_ e: TemplateCatalog.Entry, room: CGFloat = TemplateLibraryView.lineRoom(for: TemplateLibraryView.size), today: Date = .now) -> [NotePreview.Block] {
        let days = TemplateExample.wholeWeeks(TemplateSample.days(to: today))
        let key = "\(e.slug)-\(days)-\(Int(room))"
        if let b = examples[key] { return b }
        let b = TemplateLibraryView.staged(TemplateExample.moved(e.example, days: days), room: room)
        examples[key] = b
        return b
    }
    private static var examples: [String: [NotePreview.Block]] = [:]

    /// The sub-note the stage shows open beside a note that lists it: under its name as a heading,
    /// its lines as they are, its dates moved as the note's.
    static func opened(_ e: TemplateCatalog.Entry, today: Date = .now) -> [NotePreview.Block]? {
        guard let text = e.opened else { return nil }
        let days = TemplateExample.wholeWeeks(TemplateSample.days(to: today))
        let key = "\(e.slug)-opened-\(days)"
        if let b = examples[key] { return b }
        var b = NotePreview.blocks(TemplateExample.moved(text, days: days))
        if case .title(let name) = b.first { b[0] = .heading(2, name) }
        while b.last == .gap { b.removeLast() }
        examples[key] = b
        return b
    }

    /// The name of the sub-note shown open: its row in the list beside it is the picked one.
    static func openedName(_ e: TemplateCatalog.Entry) -> String? {
        guard let text = e.opened, case .title(let name)? = NotePreview.blocks(text).first else { return nil }
        return name
    }

    static func start(_ e: TemplateCatalog.Entry) -> NotePageData.Doc {
        if let d = starts[e.slug] { return d }
        let d = e.appData
        starts[e.slug] = d
        return d
    }

    static func picture(_ e: TemplateCatalog.Entry, dark: Bool, narrow: Bool = false) -> NSImage? {
        let key = "\(e.slug)-\(dark)-\(narrow)"
        if let p = pictures[key] { return p }
        let p = e.appPicture(dark: dark, narrow: narrow)
        pictures[key] = .some(p)
        return p
    }
}

/// A template app's sample data is written for one day (scripts/template-samples.py, ANCHOR) and
/// shown as of today: every "yyyy-mm-dd", as a value or a key, moves by the days between. The
/// pictures move it the same way (scripts/template-stage-pictures.ts).
nonisolated enum TemplateSample {
    static let anchor = "2026-11-08"

    private static func day(_ s: String) -> Date? {
        guard s.count == 10, s.wholeMatch(of: /\d{4}-\d{2}-\d{2}/) != nil else { return nil }
        var c = DateComponents()
        let p = s.split(separator: "-").compactMap { Int($0) }
        guard p.count == 3 else { return nil }
        (c.year, c.month, c.day, c.hour) = (p[0], p[1], p[2], 12)
        return Calendar(identifier: .gregorian).date(from: c)
    }

    private static func text(_ d: Date) -> String {
        let c = Calendar(identifier: .gregorian).dateComponents([.year, .month, .day], from: d)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    /// The days from the sample's day to `today`, in the device's calendar.
    static func days(to today: Date) -> Int {
        guard let a = day(anchor) else { return 0 }
        let cal = Calendar(identifier: .gregorian)
        return cal.dateComponents([.day], from: cal.startOfDay(for: a), to: cal.startOfDay(for: today)).day ?? 0
    }

    static func moved(_ value: Any, days: Int) -> Any {
        let shift = { (s: String) -> String in
            guard days != 0, let d = day(s), let to = Calendar(identifier: .gregorian).date(byAdding: .day, value: days, to: d) else { return s }
            return text(to)
        }
        switch value {
        case let s as String: return shift(s)
        case let a as [Any]: return a.map { moved($0, days: days) }
        case let o as [String: Any]:
            var out: [String: Any] = [:]
            for (k, v) in o { out[shift(k)] = moved(v, days: days) }
            return out
        default: return value
        }
    }
}

/// A template's example with its dates moved to today: each is written for the samples' day
/// (TemplateSample.anchor, in web/content/templates) and shown as many days later as today is, so
/// "today" on the stage is today and nothing there is weeks old (9 November 2026: the examples
/// said "30 September" in November). A date keeps its form: "2026-11-08", "8 Nov", "8 November",
/// "Sun 8 Nov", "Sunday 8 November" (its weekday worked out again), and "Week of 2 November"
/// stays on its week's Monday.
nonisolated enum TemplateExample {
    static let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    /// From Sunday, as Calendar counts weekdays.
    static let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    /// A date as an example writes it: an ISO date, or a day and a month's name, with "Week of"
    /// or a weekday before it.
    static let pattern: NSRegularExpression = {
        let month = (months + months.map { String($0.prefix(3)) }).joined(separator: "|")
        let weekday = (weekdays + weekdays.map { String($0.prefix(3)) }).joined(separator: "|")
        return try! NSRegularExpression(pattern: #"\b(\d{4})-(\d{2})-(\d{2})\b|(Week of )?(?:\b("# + weekday + #") )?\b(\d{1,2}) ("# + month + #")\b(?: (\d{4})\b)?"#)
    }()

    private static let calendar = Calendar(identifier: .gregorian)

    /// A note's example moves by whole weeks, so its weekdays stay its own (a standup on a Friday,
    /// a review on a Sunday): it reads as of the last Sunday, never more than six days old. Moved
    /// by exact days, a standup read "Sunday 8 November" on a Tuesday. An app's sample moves by
    /// exact days: it shows today.
    static func wholeWeeks(_ days: Int) -> Int { days / 7 * 7 }

    private static func date(_ year: Int, _ month: Int, _ day: Int) -> Date? {
        var c = DateComponents()
        (c.year, c.month, c.day, c.hour) = (year, month, day, 12)
        return calendar.date(from: c)
    }

    /// The dates the text holds, as it writes them (for the tests: every month it names is one).
    static func dates(in text: String) -> [String] {
        pattern.matches(in: text, range: NSRange(text.startIndex..., in: text)).compactMap { Range($0.range, in: text).map { String(text[$0]) } }
    }

    static func moved(_ text: String, days: Int, anchor: String = TemplateSample.anchor) -> String {
        let a = anchor.split(separator: "-").compactMap { Int($0) }
        guard a.count == 3, let anchorDay = date(a[0], a[1], a[2]) else { return text }
        var out = text
        for m in pattern.matches(in: text, range: NSRange(text.startIndex..., in: text)).reversed() {
            guard let whole = Range(m.range, in: out) else { continue }
            func group(_ i: Int) -> String? { Range(m.range(at: i), in: text).map { String(text[$0]) } }
            if let y = group(1).flatMap({ Int($0) }), let mo = group(2).flatMap({ Int($0) }), let d = group(3).flatMap({ Int($0) }) {
                guard let from = date(y, mo, d), let to = calendar.date(byAdding: .day, value: days, to: from) else { continue }
                let c = calendar.dateComponents([.year, .month, .day], from: to)
                out.replaceSubrange(whole, with: String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0))
                continue
            }
            guard let d = group(6).flatMap({ Int($0) }), let name = group(7),
                  let mo = months.firstIndex(where: { $0 == name || $0.prefix(3) == name }) else { continue }
            // The year it's written with ("20 Nov 2025": last year's service, which moves to its
            // own new year with the rest); with none written, the one that puts the date nearest
            // the samples' day.
            let year = group(8).flatMap { Int($0) }
            let candidates = (year.map { [$0] } ?? [a[0] - 1, a[0], a[0] + 1]).compactMap { date($0, mo + 1, d) }
            guard let from = candidates.min(by: { abs($0.timeIntervalSince(anchorDay)) < abs($1.timeIntervalSince(anchorDay)) }),
                  var to = calendar.date(byAdding: .day, value: days, to: from) else { continue }
            let week = group(4) != nil
            if week {
                // A week is named by its Monday.
                let back = (calendar.component(.weekday, from: to) + 5) % 7
                to = calendar.date(byAdding: .day, value: -back, to: to) ?? to
            }
            let c = calendar.dateComponents([.year, .month, .day, .weekday], from: to)
            let short = name.count == 3 && name != "May"
            let month = short ? String(months[(c.month ?? 1) - 1].prefix(3)) : months[(c.month ?? 1) - 1]
            var s = "\(c.day ?? 0) \(month)"
            if let w = group(5) {
                let day = weekdays[(c.weekday ?? 1) - 1]
                s = (w.count == 3 ? String(day.prefix(3)) : day) + " " + s
            }
            if year != nil { s += " \(c.year ?? 0)" }
            out.replaceSubrange(whole, with: (week ? "Week of " : "") + s)
        }
        return out
    }
}

/// A template's app running in the library, on its own copy of its sample data: changes stay
/// in this view and go when it closes. It reads the note and stores data, and nothing else.
struct TemplateAppPreview: View {
    let entry: TemplateCatalog.Entry
    let project: String
    /// On a narrow sheet's stage: the app in its one-column layout, and its picture of that.
    var narrow = false
    /// The app has drawn: its page can be shown. With its own id, to give it the keys (NotePageLive).
    var drew: (UUID) -> Void = { _ in }
    @State private var doc: NotePageData.Doc?
    /// Its own id, never a note's.
    @State private var id = UUID()
    /// Until the app has drawn, its picture shows in its place, so the stage is never blank; the
    /// app's page is see-through, so the picture fades out as the app fades in.
    @State private var ready = false
    @Environment(\.colorScheme) private var scheme

    /// The width the app is laid out at on the stage, in CSS pixels: wide enough for its two
    /// columns, drawn at 75% in the full sheet's 624 pt stage, so its text is about the Mac's
    /// 13 pt and the whole app shows (9 November 2026: at 533 px in a 400 pt window it showed one
    /// habit of four). The pictures are drawn at this width (scripts/template-stage-pictures.ts).
    /// A narrow sheet's stage is 396 to 495 pt wide: the app in its one column, 533 px wide, at
    /// 74 to 93% (in two columns there it would be at half size, its text 8 pt).
    static func cssWidth(narrow: Bool = false) -> CGFloat { narrow ? 533 : 832 }

    /// The live app's zoom in a window: as wide as its CSS width, whatever the window's width, so
    /// the app keeps one layout and fills the window exactly (0.75 on the full sheet).
    static func zoom(for window: CGSize, narrow: Bool = false) -> CGFloat { window.width / cssWidth(narrow: narrow) }

    /// The live app's size in CSS pixels in a window, and so the picture's: it's drawn for this.
    static func css(for window: CGSize, narrow: Bool = false) -> CGSize {
        CGSize(width: cssWidth(narrow: narrow), height: (window.height / zoom(for: window, narrow: narrow)).rounded())
    }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .topLeading) {
                if !ready, let picture = TemplateFiles.picture(entry, dark: scheme == .dark, narrow: narrow) {
                    // Its own shape at the live app's width, from the top (a sheet smaller than
                    // the full one cuts it at the stage's foot).
                    Image(nsImage: picture).resizable()
                        .frame(width: geo.size.width, height: (geo.size.width * picture.size.height / max(picture.size.width, 1)).rounded())
                        .accessibilityHidden(true)
                        .transition(.opacity)
                }
                NotePageView(noteID: id, html: project, text: entry.note ?? entry.example, onUpdate: { _ in },
                             onData: { message in try data(message) }, preview: doc ?? TemplateFiles.sample(entry),
                             onReady: {
                                 // At once: the page is shown only now, so there's no picture to fade from.
                                 ready = true
                                 drew(id)
                             },
                             zoom: Self.zoom(for: geo.size, narrow: narrow))
                    .frame(width: geo.size.width, height: geo.size.height)
            }
            .frame(width: geo.size.width, height: geo.size.height, alignment: .topLeading)
            .clipped()
        }
    }

    @MainActor private func data(_ message: Any) throws -> [String: Any] {
        let (after, made) = try NotePageData.apply(try NotePageData.Op(message), to: doc ?? TemplateFiles.sample(entry))
        doc = after
        return ["data": after].merging(made.map { ["id": $0] } ?? [:]) { a, _ in a }
    }
}
#endif
