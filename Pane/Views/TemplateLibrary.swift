import SwiftData
#if os(macOS)
import SwiftUI

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
        var pick: SetupCards.Pick {
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

    /// The filters: everything, each kind, and last, set apart, the ones with an app: "Apps" is a
    /// format, not a topic, and among the topics it read as one of them (council, 10 November 2026).
    static let filters = ["All", "Habits and health", "Work", "Learning", "Home and life", "Apps"]
    /// The filters that are topics: every one but All and Apps.
    static let topics = filters.filter { $0 != "All" && $0 != "Apps" }

    /// A kind's name on its segment: one word each, so the six fit a small window (the site's
    /// full names made the control 750 pt wide, wider than the sheet in a small window).
    static func label(_ filter: String) -> String {
        switch filter {
        case "Habits and health": "Health"
        case "Home and life": "Personal"
        default: filter
        }
    }

    func shown(filter: String, query: String) -> [Entry] {
        entries.filter { e in
            (filter == "All" || (filter == "Apps" ? e.app : e.category == filter))
                && (query.isEmpty || e.title.localizedStandardContains(query) || e.tagline.localizedStandardContains(query) || e.description.localizedStandardContains(query))
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
    /// Under the sheet's name: what these are, and what an "App" is (council, 10 November 2026:
    /// without it the gallery is coloured pictures and a word). "Can": your AI fills one in when
    /// you ask it to, not by itself ("fills in and keeps up to date" read as a standing service).
    static let subtitle = "Notes and small apps your AI can fill in and keep up to date."
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

    /// The gallery when nothing matches: what was typed, and the kind when one is picked
    /// ("No Work templates for “zebra”"). Clear search is beside it.
    static func none(query: String, filter: String) -> String {
        let kind = filter == "All" ? "" : filter == "Apps" ? "app " : "\(TemplateCatalog.label(filter)) "
        let q = query.trimmingCharacters(in: .whitespaces)
        return q.isEmpty ? "No \(kind)templates" : "No \(kind)templates for \u{201C}\(q)\u{201D}"
    }

    /// The one button: Make with your AI; with none that opens with the ask, what it adds.
    static func make(_ e: TemplateCatalog.Entry, _ ai: SetupCards.AI) -> String {
        ai.asks ? "Make with \(ai.name)" : e.app ? "Add the app" : "Add the note"
    }

    /// A template's kind as a small label: "Health", and "App" after it for one with an app.
    static func kind(_ e: TemplateCatalog.Entry) -> String {
        TemplateCatalog.label(e.category) + (e.app ? " \u{00B7} \(app)" : "")
    }

    /// Over the prompt: whose it is. With no AI that opens with the ask, it's yours to copy.
    static func asked(_ ai: SetupCards.AI) -> String {
        ai.asks ? "What \(ai.name) is asked" : "What to ask your AI"
    }

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
    /// does, on one line: "Adds an empty note to (folder) Work, then opens ChatGPT." (the example
    /// beside it is filled in; what you get is not). The folder is where New Note would put a
    /// note: the one you're in, or your first (never the template's own: three makes made three
    /// folders of one note each; council, 10 November 2026). With no AI that opens with the ask,
    /// only what it adds and where. A template you made and still have isn't added again: the
    /// line says where it is and that this opens it.
    static func caption(_ e: TemplateCatalog.Entry, ai: SetupCards.AI, folder: String, have: String? = nil) -> (lead: String, folder: String, rest: String) {
        if let have { return ("Already in ", have, ai.asks ? ". This opens it, then \(ai.name)." : ". This opens it.") }
        return ("Adds an empty \(e.app ? "app" : "note") to ", folder, ai.asks ? ", then opens \(ai.name)." : ".")
    }
    /// Under Make's line with no AI connected: the way to get one.
    static let connect = "Connect ChatGPT or Claude to have it filled in for you."
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
                                source: any NoteSourceFetching = ShippedTemplates(), ledger: NoteSourceLedger? = nil,
                                copy: (String) -> Void = ConnectClipboard.set, open: (URL) -> Void) async -> UUID? {
        let link = NoteSourceLink(kind: .template, slug: e.slug)
        let ledger = ledger ?? NoteSourceLedger(account: account)
        var note = ledger.existing(link, in: context)?.id
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
            copy(SetupCards.prompt(e.pick))
            if let page = SetupCards.page(ai, e.pick) { open(page) }
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
/// The gallery: under the sheet's name and one line saying what these are, the covers across its
/// whole width, each with its name and a few words under it, filtered in place by a kind and by
/// Search. Nothing is picked at rest; the arrow keys move a ring through the covers and Return
/// opens the one it's on.
///
/// A template's page, opened by a click or Return: its example large in a frame, and beside it
/// its name, what it is, the button that makes it, what that does, and what your AI is asked;
/// under them, more like it. Back, Esc and ⌘[ return to the gallery as it was left (it stays
/// under the page: its scroll, kind and search are kept).
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
    /// Opens Connect an AI; nil where there's none to open (a picture, a test).
    var connect: (() -> Void)? = nil
    var close: () -> Void = {}
    /// Captures: the kind picked and what's typed in Search.
    @State var filter = "All"
    @State var query = ""
    /// The cover the arrow keys are on; nil until one is pressed (nothing is picked at rest).
    @State var focused: TemplateCatalog.Entry?
    @State private var picked: SetupCards.AI?
    private var ai: SetupCards.AI { picked ?? ais.first ?? .other }
    @State private var copied = false
    /// The grid's measured row, inside the scroll bar.
    @State private var row: CGFloat = 0
    /// The sheet's size, fitted to the window it's on.
    @State var size = Self.size
    /// What has the keys on the gallery: Search (its caret shows), or the covers (the ring shows).
    /// One cue at a time: the arrows take the keys from Search to the covers, and Search has no
    /// caret while the ring is out (council, 10 November 2026: a caret and a ring at once). On a
    /// template's page nothing has them: its keys (Esc, ⌘[, Return, and the arrows to the template
    /// before and after) are its buttons' shortcuts, which need no focus.
    enum Keys: Hashable { case search, covers }
    @FocusState private var keys: Keys?
    /// The examples with more under their frame's foot than shows: the foot fades while there is.
    @State private var below: Set<String> = []
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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static let size = CGSize(width: 1040, height: 680)
    static let gap: CGFloat = 16

    /// The largest the sheet grows to, on a large window.
    static let largest = CGSize(width: 1280, height: 860)

    /// The sheet's size on a window: the full size where it fits, never wider or taller than the
    /// window less a margin, and never so small a template's page loses its button. On a window
    /// with room to spare it grows with it, up to `largest`, keeping 120 pt of the window either
    /// side and 80 above and below, so a large window shows another column and another row (it
    /// stayed 1040 by 680 in a window twice that; council, 10 November 2026).
    static func size(on window: CGSize) -> CGSize {
        let width = max(min(size.width, window.width - 80), min(largest.width, window.width - 240))
        let height = max(min(size.height, window.height - 60), min(largest.height, window.height - 160))
        return CGSize(width: max(720, width), height: max(500, height))
    }

    // MARK: The page's parts

    /// The row at the top of both pages, one height: the sheet's name, the kinds, Search and the
    /// close x on the gallery; Back and the x on a template's page. The x never moves between them.
    static let topRow: CGFloat = 52
    /// The gallery's one line under its name.
    static let subtitleRow: CGFloat = 22
    /// A narrow sheet (a small window): the words beside the stage need a larger share of it, and
    /// an app is laid out in its one-column width.
    static func narrow(_ size: CGSize) -> Bool { size.width < 900 }
    /// The stage takes six tenths of the page's width, the words beside it the rest; on a narrow
    /// sheet a little less, so the button keeps its whole name ("Make with Cha…" at 0.6).
    static func stageWidth(for size: CGSize) -> CGFloat { (size.width * (narrow(size) ? 0.55 : 0.6)).rounded() }
    /// "More like this", under the stage and the words: on a sheet tall enough for it.
    static let moreHeight: CGFloat = 132
    static func showsMore(_ size: CGSize) -> Bool { size.height > 560 }
    /// The stage's height: what the top row and "More like this" leave.
    static func stageHeight(for size: CGSize) -> CGFloat { size.height - topRow - 1 - (showsMore(size) ? moreHeight + 1 : 0) }
    /// The "Example" label's row, over the frame. With the frame's inset under it, the frame on the
    /// full sheet is 576 by 428.5 pt: the shape an app's picture is drawn in (832 by 619 px).
    static let exampleRow: CGFloat = 41.5
    /// The frame's inset in the stage's pane: the sheet's margin; less on a narrow sheet, where
    /// the example needs the width.
    static func frameInset(for size: CGSize) -> CGFloat { narrow(size) ? 14 : margin }
    static let frameRadius: CGFloat = 12
    /// What a template's note or app has to show itself in: the frame.
    static func window(for size: CGSize) -> CGSize {
        let inset = frameInset(for: size)
        return CGSize(width: stageWidth(for: size) - inset * 2, height: stageHeight(for: size) - exampleRow - inset)
    }
    /// One measure everywhere: the sheet's margin (the gallery's, the page's stage and words, and
    /// "More like this") and the gap between things (`gap`). The sheet's name, Back, the frame
    /// and "More like this" all start on the margin.
    static let margin: CGFloat = 24
    /// A note's own margin inside the frame: less than a note has in its window (20), so a table
    /// has the width for its words at the body's size.
    static let notePadding: CGFloat = 16
    /// The list's share of the frame when a sub-note shows open beside it.
    static let listWidth: CGFloat = 236

    /// The page's type: one large thing (the name, over twice the body's size), the body, and
    /// small quiet labels; with the button's own size, four sizes, in three weights (bold for the
    /// name, semibold for labels and the button, regular).
    enum PageType {
        static let name: CGFloat = 28
        static let body: CGFloat = 13
        static let small: CGFloat = 12
        /// The name's size on a sheet too narrow for the longest name at 28 pt: the largest of
        /// these at which every name takes one line. One size on every page of a sheet, never a
        /// smaller one for a longer name (council, 10 November 2026: "Study notes and
        /// flashcards" was set smaller than "Habit tracker", and read as less).
        static let names: [CGFloat] = [28, 26, 24, 22, 20, 18]
        /// A table in an example: its words at the body's size, near enough (they were the
        /// system's footnote, 10 pt, beside 13 pt lines).
        static let table: CGFloat = 12
    }
    /// How tall the fade at the frame's foot is, while the example has more under it.
    static let footFade: CGFloat = 28
    /// A table on the stage shows at most this many columns (the stage's own trim), and fewer
    /// where the frame is too narrow for their words: never a column cut at the frame's side.
    static let stageColumns = 5
    /// The room a note's lines have in the frame: its width less the note's margins.
    static func lineRoom(for size: CGSize) -> CGFloat { window(for: size).width - notePadding * 2 }
    /// The room the words beside the stage have.
    static func wordsWidth(for size: CGSize) -> CGFloat { size.width - stageWidth(for: size) - 1 - margin * 2 }
    /// The name's size on every page of a sheet: the largest of the steps at which the longest
    /// name takes one line, under its cover, at the words' full width.
    static func nameSize(for names: [String], room: CGFloat) -> CGFloat {
        let key = "\(names.count)-\(Int(room))"
        if let size = nameSizes[key] { return size }
        func wide(_ name: String, _ size: CGFloat) -> CGFloat { (name as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: size, weight: .bold)]).width }
        let size = PageType.names.first { size in names.allSatisfy { wide($0, size) <= room } } ?? PageType.names.last ?? PageType.name
        nameSizes[key] = size
        return size
    }
    private static var nameSizes: [String: CGFloat] = [:]
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
    /// The line under the buttons takes one line on the full sheet, two where the words are narrow.
    static func captionLines(for size: CGSize) -> Int { narrow(size) ? 2 : 1 }

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

    /// Whether the left and right arrows move through the covers: not while they'd move the
    /// cursor in what's typed in Search.
    static func arrowsMoveCovers(searching: Bool, query: String) -> Bool { !searching || query.isEmpty }

    /// Where an arrow key takes the keys on the gallery: to a cover (the ring), back to Search
    /// (up from the first row), or nowhere (up with no ring out; left and right while they move
    /// the cursor in Search).
    enum ArrowTo: Equatable { case cover(TemplateCatalog.Entry), search, nowhere }
    static func arrow(_ shown: [TemplateCatalog.Entry], from at: TemplateCatalog.Entry?, rows: Int, along: Int, columns: Int, searching: Bool, query: String) -> ArrowTo {
        if along != 0, !arrowsMoveCovers(searching: searching, query: query) { return .nowhere }
        let at = at.flatMap { shown.contains($0) ? $0 : nil }
        if rows < 0 {
            guard let at, let i = shown.firstIndex(of: at) else { return .nowhere }
            if i < columns { return .search }
        }
        return step(shown, from: at, by: along + rows * columns).map { .cover($0) } ?? .nowhere
    }

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 20, style: .continuous)
        let shown = catalog.shown(filter: filter, query: query)
        ZStack {
            // Under a page the gallery keeps its place, out of sight, and takes no clicks or VoiceOver.
            gallery(shown)
                .opacity(open == nil ? 1 : 0)
                // Nor while a page is being got ready: a second click then would start a second move.
                .allowsHitTesting(open == nil && loading == nil)
                .accessibilityHidden(open != nil)
            // The open page, and under it, out of sight, the one being got ready. Each keeps its
            // own view from the moment it's laid out, so the app that drew out of sight is the app shown.
            ForEach(Self.pages(warm: warm, loading: loading, open: open), id: \.slug) { e in
                page(e, shown: shown)
                    .opacity(e == open ? 1 : 0)
                    .allowsHitTesting(e == open)
                    .accessibilityHidden(e != open)
                    .zIndex(e == open ? 2 : 1)
            }
        }
        .frame(width: size.width, height: size.height)
        // In a sheet the sheet is the panel and macOS dims the window (popupSheet).
        .background { if !inSheet { shape.fill(SetupCards.ground).shadow(color: .black.opacity(0.2), radius: 30, y: 20) } }
        .clipShape(inSheet ? RoundedRectangle(cornerRadius: 0) : shape)
        .overlay { if !inSheet { shape.strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5) } }
        .onKeyPress(.upArrow) { arrow(shown, rows: -1, along: 0) }
        .onKeyPress(.downArrow) { arrow(shown, rows: 1, along: 0) }
        .onKeyPress(.leftArrow) { arrow(shown, rows: 0, along: -1) }
        .onKeyPress(.rightArrow) { arrow(shown, rows: 0, along: 1) }
        // Esc with the keys inside an app's example (after a click in it): the same as Esc
        // anywhere on the page, back to the gallery. There the key is the example's first, and
        // what it didn't use closed the whole sheet (real keys on the Air, 10 November 2026).
        .onExitCommand { if open != nil { show(nil) } else { close() } }
        // On a page Return is Make, the page's default button.
        .onKeyPress(.return) { openFromKeys() ? .handled : .ignored }
        // With the ring out, what's typed still goes to Search, and the ring to its first match.
        .onKeyPress(phases: .down) { typed($0) }
        .onAppear {
            if inSheet, let window = NSApp.mainWindow { size = Self.size(on: window.frame.size) }
            keys = open == nil ? .search : nil
        }
        // The keys go back to the gallery with it: to the ring if it's out, else to Search.
        .onChange(of: open) { _, now in keys = now == nil ? (focused == nil ? .search : .covers) : nil }
        // Search with the keys shows its caret: the ring goes.
        .onChange(of: keys) { _, now in if now == .search { focused = nil } }
    }

    /// An arrow key: in the gallery it moves the ring through the covers; on a page, left and
    /// right go to the template before and after in the gallery's order.
    private func arrow(_ shown: [TemplateCatalog.Entry], rows: Int, along: Int) -> KeyPress.Result {
        if let open {
            guard along != 0 else { return .ignored }
            let order = Self.walk(shown, all: catalog.entries, open: open)
            if let to = Self.step(order, from: open, by: along), to != open {
                // The ring follows, so going back shows where you are.
                if focused != nil || shown.contains(to) { focused = shown.contains(to) ? to : nil }
                show(to)
            }
            return .handled
        }
        switch Self.arrow(shown, from: focused, rows: rows, along: along, columns: columns, searching: keys == .search, query: query) {
        case .nowhere: return .ignored
        case .search:
            focused = nil
            keys = .search
        case .cover(let to):
            focused = to
            keys = .covers
        }
        return .handled
    }

    /// A letter, a digit or a space typed while the ring is out goes on the end of what's in
    /// Search, and Delete takes the last one off; the ring moves to the first match.
    private func typed(_ press: KeyPress) -> KeyPress.Result {
        guard open == nil, keys == .covers, press.modifiers.subtracting(.shift).isEmpty else { return .ignored }
        if press.key == .delete {
            guard !query.isEmpty else { return .ignored }
            query.removeLast()
        } else if let c = press.characters.first, press.characters.count == 1, c.isLetter || c.isNumber || c == " " {
            query.append(c)
        } else {
            return .ignored
        }
        focused = catalog.shown(filter: filter, query: query).first
        return .handled
    }

    /// Return, on the gallery or in Search: opens the cover the ring is on; with something typed
    /// and no ring, the first match.
    private func openFromKeys() -> Bool {
        let shown = catalog.shown(filter: filter, query: query)
        guard open == nil, let to = focused.flatMap({ shown.contains($0) ? $0 : nil }) ?? (query.isEmpty ? nil : shown.first) else { return false }
        show(to)
        return true
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

    // MARK: The gallery

    private var columns: Int {
        let r = row > 0 ? row : size.width - 49
        let w = Self.cardWidth(row: r, gap: Self.gap)
        return max(1, Int((r + Self.gap) / (w + Self.gap)))
    }

    private func gallery(_ shown: [TemplateCatalog.Entry]) -> some View {
        VStack(spacing: 0) {
            header
            Divider()
            if shown.isEmpty {
                // Nothing matches: what was looked for, and the way back, where the covers were.
                HStack(spacing: 12) {
                    Text(TemplateLibraryWords.none(query: query, filter: filter))
                        .font(.system(size: 13)).foregroundStyle(Color.muted)
                        .accessibilityIdentifier("templates.none")
                    if !query.isEmpty {
                        Button(TemplateLibraryWords.clear) {
                            query = ""
                            keys = .search
                        }
                        .buttonStyle(.secondary)
                        .accessibilityIdentifier("templates.clear")
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                grid(shown)
            }
        }
    }

    /// The top row (the sheet's name, the kinds, Search and the close x; on a sheet too narrow
    /// for all four at their sizes Search is shorter, and the name always shows: without it the
    /// smallest sheet opened on "All, Apps, Health" with nothing saying what they were), and
    /// under the name one line saying what these are.
    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            ViewThatFits(in: .horizontal) {
                headerRow(search: Self.searchWidth)
                headerRow(search: Self.searchNarrow)
            }
            .frame(height: Self.topRow)
            Text(TemplateLibraryWords.subtitle)
                .font(.system(size: 13)).foregroundStyle(Color.muted)
                .lineLimit(1)
                // Close under the name: the row over it centres its own things.
                .offset(y: -6)
                .frame(height: Self.subtitleRow, alignment: .top)
                .accessibilityIdentifier("templates.subtitle")
        }
        .padding(.horizontal, Self.margin)
    }

    /// Search's least width: on the full sheet, and on one too narrow for that beside the name.
    static let searchWidth: CGFloat = 140
    static let searchNarrow: CGFloat = 84

    private func headerRow(search least: CGFloat) -> some View {
        HStack(spacing: least < Self.searchWidth ? 10 : 14) {
            Text(TemplateLibraryWords.title).font(.system(size: 20, weight: .bold)).foregroundStyle(Color.ink)
                .fixedSize()
                .accessibilityAddTraits(.isHeader)
            TemplateKinds(filter: $filter)
            Spacer(minLength: 0)
            search(least: least)
            // Esc is this x's while the gallery shows; on a page it's Back's.
            CardCloseButton(cancels: open == nil, action: close)
        }
    }

    /// Search, focused when the library opens: type to narrow, Esc clears what's typed and only
    /// then closes, as a Mac search field does.
    private func search(least: CGFloat) -> some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
            TextField("Search", text: $query).textFieldStyle(.plain)
                .focused($keys, equals: .search)
                .onSubmit { _ = openFromKeys() }
                .accessibilityIdentifier("templates.search")
                .onKeyPress(.escape) {
                    guard !query.isEmpty else { return .ignored }
                    query = ""
                    return .handled
                }
            if !query.isEmpty {
                SearchClearButton { query = "" }
            }
        }
        .font(.system(size: 13))
        .padding(.leading, 10)
        .padding(.trailing, 6)
        .frame(minWidth: least, maxWidth: 220)
        .frame(height: 28)
        .background(Color.primary.opacity(0.06), in: .rect(cornerRadius: 8, style: .continuous))
    }

    /// Between the covers' rows: a little more than between the covers, since each has its words under it.
    static let rowGap: CGFloat = 18

    private func grid(_ shown: [TemplateCatalog.Entry]) -> some View {
        GeometryReader { geo in
            // The row the cards really get: less than the pane when a mouse is attached and the
            // scroll bar takes its own room (the cards then left a column's gap).
            let width = Self.cardWidth(row: row > 0 ? row : geo.size.width - Self.margin * 2, gap: Self.gap)
            ScrollViewReader { scroller in
                ScrollView {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: width, maximum: width), spacing: Self.gap, alignment: .top)], alignment: .leading, spacing: Self.rowGap) {
                        ForEach(shown) { e in
                            // The art, and under it its name and a few words; the ring is the
                            // arrow keys', never a pick.
                            SetupTemplateCard(pick: e.pick, width: width, captionBelow: true, selected: focused == e, line: TemplateLibraryWords.line(e), app: e.app,
                                              pointer: { on in point(e, on) }) {
                                focused = nil
                                show(e)
                            }
                            // Where each card is in the grid, kept without drawing again.
                            .onGeometryChange(for: CGRect.self, of: { $0.frame(in: .named(Self.space)) }) { [seen] in seen.cards[e.slug] = $0 }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .onGeometryChange(for: CGFloat.self, of: { $0.size.width }) { row = $0 }
                    .padding(.horizontal, Self.margin)
                    .padding(.top, Self.gridTop)
                    // Under the last row, the sheet's margin: its names and lines end clear of the foot.
                    .padding(.bottom, Self.margin)
                    .coordinateSpace(.named(Self.space))
                }
                .onScrollGeometryChange(for: CGRect.self, of: { $0.visibleRect }) { [seen] _, now in seen.visible = now }
                // The cover the keys are on is always in full view: it comes in by the nearest
                // edge, no further than it must.
                .onChange(of: focused?.slug, initial: true) { _, slug in
                    guard let slug, let anchor = Self.revealAnchor(cell: seen.cards[slug], visible: seen.visible) else { return }
                    if reduceMotion { scroller.scrollTo(slug, anchor: anchor) } else { withAnimation(.snappy(duration: 0.2)) { scroller.scrollTo(slug, anchor: anchor) } }
                }
            }
        }
        .frame(maxWidth: .infinity)
        // The covers take the keys from Search when an arrow moves the ring onto one. No ring of
        // the system's around the grid: the ring on the cover is the cue.
        .focusable(true, interactions: .edit)
        .focused($keys, equals: .covers)
        .focusEffectDisabled()
    }

    /// Where a cover the keys moved to comes into view: nowhere when it's in view with a gap to
    /// spare; by the foot when the foot cuts it; otherwise by the top. A cover not laid out yet
    /// (a lazy grid's) comes in by the foot: the keys only reach one by going down.
    static func revealAnchor(cell: CGRect?, visible: CGRect) -> UnitPoint? {
        guard let cell, !visible.isEmpty else { return .bottom }
        // With less to spare than the grid has over its first row: at rest the first row is in
        // view, and the first arrow press scrolled it up by its own top margin (real keys on the
        // Air, 10 November 2026).
        let above = cell.minY - revealSpare < visible.minY - 0.5, below = cell.maxY + revealSpare > visible.maxY + 0.5
        guard above || below else { return nil }
        return above ? .top : .bottom
    }

    static let revealSpare: CGFloat = 8
    /// The grid's margin over its first row.
    static let gridTop: CGFloat = 14

    /// Where the grid's cards are and what's in view, kept outside the view's state so scrolling
    /// never draws the library again.
    final class Seen { var cards: [String: CGRect] = [:]; var visible: CGRect = .zero }
    @State private var seen = Seen()
    static let space = "templates.grid"

    /// As many cards of at least the gallery's width as fit, widened to fill the row exactly: five
    /// across the full sheet, three on the smallest.
    static func cardWidth(row: CGFloat, gap: CGFloat) -> CGFloat {
        let least = SetupTemplateCard.size.width
        let count = max(1, ((row + gap) / (least + gap)).rounded(.down))
        return ((row - gap * (count - 1)) / count).rounded(.down)
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
                // Esc goes back, and ⌘[ (the hidden button under it).
                .keyboardShortcut(e == open ? .cancelAction : nil)
                .background {
                    Group {
                        Button("") { show(nil) }.keyboardShortcut(e == open ? KeyboardShortcut("[", modifiers: .command) : nil)
                        // The arrows, to the template before and after in the gallery's order.
                        Button("") { _ = arrow(shown, rows: 0, along: -1) }.keyboardShortcut(e == open ? KeyboardShortcut(.leftArrow, modifiers: []) : nil)
                        Button("") { _ = arrow(shown, rows: 0, along: 1) }.keyboardShortcut(e == open ? KeyboardShortcut(.rightArrow, modifiers: []) : nil)
                    }
                    .opacity(0).accessibilityHidden(true)
                }
                .accessibilityLabel(TemplateLibraryWords.back)
                .accessibilityIdentifier("templates.back")
                Spacer(minLength: 0)
                CardCloseButton(cancels: false, action: close)
            }
            // Back's chevron on the margin: the quiet button has 9 pt of its own inside it.
            .padding(.leading, Self.margin - 9)
            .padding(.trailing, Self.margin)
            .frame(height: Self.topRow)
            Divider()
            HStack(spacing: 0) {
                stage(e)
                Divider()
                words(e)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .frame(height: Self.stageHeight(for: size))
            if Self.showsMore(size) {
                Divider()
                more(e)
                    .frame(height: Self.moreHeight)
                    // A template with none like it (one the site adds later): the room stays.
                    .opacity(Self.related(e, in: catalog.entries).isEmpty ? 0 : 1)
            }
        }
        .frame(width: size.width, height: size.height, alignment: .topLeading)
    }

    /// What an example sits on in its frame: the notes' own ground, white, or black in the dark.
    private var frameGround: Color { scheme == .dark ? .black : .white }
    /// The pane around the frame: a quiet tint of the sheet, a shade off the frame in both looks,
    /// so the example reads as a picture of the template and its buttons as the template's own
    /// (council, 10 November 2026: flush on the sheet, white on white in the light and a black
    /// slab in the dark, an app's "Add expense" read as the page's button).
    static let pane = Color(nsColor: NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(white: 0.145, alpha: 1) : NSColor(white: 0.955, alpha: 1) })

    /// The stage: the template in use, large, in a frame (rounded, a hairline around it) on a
    /// quiet pane, the same in light and dark, under a small label: "Example" (what Make adds is
    /// empty, and your AI fills it in), and for an app, which is live there, that nothing you try
    /// is kept. A note's lines keep their own margin in the frame and scroll in it when there are
    /// more than fit, its foot fading while there's more under it; an app takes the frame's whole
    /// width, with its own tabs at the foot, and scrolls as it does in your notes.
    private func stage(_ e: TemplateCatalog.Entry) -> some View {
        let window = Self.window(for: size), inset = Self.frameInset(for: size)
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
                .overlay(frame.strokeBorder(Color.primary.opacity(0.12), lineWidth: 0.5))
                .accessibilityLabel("\(e.title), an example")
        }
        .padding(.horizontal, inset)
        .frame(width: Self.stageWidth(for: size), height: Self.stageHeight(for: size), alignment: .topLeading)
        .background(Self.pane)
    }

    /// The app itself when it is one, running on its sample; otherwise the filled-in note, drawn
    /// as the app draws notes.
    @ViewBuilder private func inUse(_ e: TemplateCatalog.Entry) -> some View {
        let window = Self.window(for: size)
        if let project = TemplateFiles.project(e) {
            // Tick, add, change tabs and scroll as you would; nothing it does is kept. Its picture
            // shows while it starts, so the stage is never blank.
            TemplateAppPreview(entry: e, project: project, narrow: Self.narrow(size)) { ready.insert(e.slug) }
        } else if let opened = TemplateFiles.opened(e), !Self.narrow(size) {
            // A note that files sub-notes, with one of them open beside it: the list on the left,
            // its open row picked, and the sub-note it leads to on the right, as the two panes of
            // the notes window.
            scrolls(e) {
                HStack(alignment: .top, spacing: 0) {
                    NotePreview(markdown: e.example, given: TemplateFiles.example(e, room: Self.listWidth - Self.notePadding * 2), whole: true,
                                margin: Self.notePadding, tableSize: PageType.table, picked: TemplateFiles.openedName(e))
                        .frame(width: Self.listWidth, alignment: .topLeading)
                    Divider()
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
                            margin: Self.notePadding, tableSize: PageType.table)
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
        .overlay(alignment: .bottom) {
            LinearGradient(colors: [frameGround.opacity(0), frameGround], startPoint: .top, endPoint: .bottom)
                .frame(height: Self.footFade)
                .opacity(below.contains(e.slug) ? 1 : 0)
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
        return blocks.map { block in
            guard case .table(let header, let rows) = block else { return block }
            var count = min(header.count, stageColumns)
            while count > 2, NotePreview.leastWidths(header: Array(header.prefix(count)), rows: rows.map { Array($0.prefix(count)) }, size: PageType.table).reduce(0, +) > room { count -= 1 }
            guard count < header.count else { return block }
            return .table(header: Array(header.prefix(count)), rows: rows.map { Array($0.prefix(count)) })
        }
    }

    /// Beside the stage, each thing once: the cover, and under it the name at the words' full
    /// width, and the kind; what it is; the button that makes it, with the line saying what it
    /// adds, where, and what opens right under it, so the line is Make's; then, apart, the plain
    /// way without an AI, a button like any other; and what your AI is asked, quietly, in a box of
    /// its own. Everything down to the buttons keeps its place from one template to the next (the
    /// name is one size and one line on every page, the description keeps room for its longest),
    /// so paging with the arrows never moves it.
    private func words(_ e: TemplateCatalog.Entry) -> some View {
        let wide = Self.wordsWidth(for: size), short = Self.short(size)
        let name = Self.nameSize(for: catalog.entries.map(\.title), room: wide)
        return VStack(alignment: .leading, spacing: 0) {
            // The cover you clicked, small, over its name: the page is that card's.
            Self.thumbnail(e.pick, side: Self.nameCover(for: size))
            Text(e.title).font(.system(size: name, weight: .bold)).foregroundStyle(Color.ink)
                .lineLimit(1)
                .frame(height: (name * 1.22).rounded(.up), alignment: .bottomLeading)
                .padding(.top, short ? 8 : 12)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("templates.name")
            Text(TemplateLibraryWords.kind(e)).font(.system(size: PageType.small)).foregroundStyle(Color.muted)
                .padding(.top, 3)
                .accessibilityIdentifier("templates.kind")
            Text(NoWidow.kept(e.shownDescription, phrases: true)).font(.system(size: PageType.body)).foregroundStyle(Color.ink)
                .lineSpacing(2)
                .lineLimit(Self.descriptionLines(for: size))
                .fixedSize(horizontal: false, vertical: true)
                // One height whatever its lines: the room the system keeps for a line count
                // leaves out the spacing between lines, and a three-line description put the
                // button 4 pt lower than a two-line one (every page side by side, 10 November 2026).
                .frame(height: Self.descriptionHeight(for: size), alignment: .topLeading)
                .padding(.top, short ? 10 : 14)
            actions(e)
                .padding(.top, short ? 12 : 18)
            // What Make does, right under Make: never under the other button, where it read as
            // that one's ("Adds… then opens ChatGPT" under Add without AI; council, 10 November 2026).
            caption(e)
                .padding(.top, 8)
            if !ai.asks, let connect {
                // No AI connected: the way to get one, quietly, under what Add does.
                Button(TemplateLibraryWords.connect, action: connect)
                    .buttonStyle(.textLink)
                    .padding(.top, 4)
                    .accessibilityIdentifier("templates.connect")
            }
            if ai.asks {
                // The other way, in plain sight and plainly a button: these work without an AI.
                Button(TemplateLibraryWords.withoutAI) { make(e, .other) }
                    .buttonStyle(.secondary(.regular, wide: true))
                    .padding(.top, short ? 10 : 16)
                    .accessibilityIdentifier("templates.withoutAI")
            }
            asked(e)
                .padding(.top, short ? 12 : 20)
            Spacer(minLength: 0)
        }
        .frame(width: wide, alignment: .leading)
        .padding(.horizontal, Self.margin)
        .padding(.top, short ? 16 : 24)
    }

    /// What your AI is asked: a small label naming it, and the prompt under it as a quotation,
    /// in ink beside a 2 pt rule. No box: in a filled box with a field's corners it read as
    /// something to type in, and its grey words on the grey fill were hard to read in the dark
    /// (council, 10 November 2026). Words, not a field: nothing here is typed in.
    private func asked(_ e: TemplateCatalog.Entry) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(TemplateLibraryWords.asked(ai)).font(.system(size: PageType.small, weight: .semibold)).foregroundStyle(Color.muted)
            Text("\u{201C}\(NoWidow.kept(TemplateCatalog.Entry.sendable(e.ask), phrases: true))\u{201D}")
                .font(.system(size: PageType.small)).foregroundStyle(Color.ink)
                .lineSpacing(2)
                .lineLimit(5)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, 12)
                .overlay(alignment: .leading) { RoundedRectangle(cornerRadius: 1).fill(Color.primary.opacity(Self.askRule)).frame(width: 2) }
                .accessibilityIdentifier("templates.ask")
        }
    }

    /// Make's line with a folder's name too long for it cut short with "…", so the line keeps
    /// its end ("…, then opens ChatGPT.") in the room it has; a name that fits is whole.
    static func fitted(_ c: (lead: String, folder: String, rest: String), room: CGFloat) -> (lead: String, folder: String, rest: String) {
        let font = NSFont.systemFont(ofSize: PageType.small)
        // The words, the folder's glyph (16 pt with room to spare) and its thin space.
        func wide(_ folder: String) -> CGFloat { ((c.lead + "\u{2009}" + folder + c.rest) as NSString).size(withAttributes: [.font: font]).width + 16 }
        guard wide(c.folder) > room else { return c }
        var name = c.folder
        while name.count > 3, wide(name + "\u{2026}") > room { name.removeLast() }
        return (c.lead, name.trimmingCharacters(in: .whitespaces) + "\u{2026}", c.rest)
    }

    /// The rule beside the prompt: a quiet grey, never the accent (it isn't a thing to press).
    static let askRule = 0.22

    /// What Make does, plainly, under the buttons, on one line: "Adds an empty note to (folder)
    /// Reading, then opens ChatGPT." The folder is Go to Note's tag: a small folder in the accent,
    /// then its name. One line on the full sheet for every template and AI; a narrow sheet has
    /// room for two. "Prompt copied" takes its place for a moment after Copy the prompt.
    private func caption(_ e: TemplateCatalog.Entry) -> some View {
        Group {
            if copied {
                Text("\(Image(systemName: "checkmark")) \(TemplateLibraryWords.copied)")
            } else {
                let c = Self.fitted(TemplateLibraryWords.caption(e, ai: ai, folder: folder, have: have(e)), room: Self.wordsWidth(for: size) * CGFloat(Self.captionLines(for: size)) - (Self.captionLines(for: size) > 1 ? 40 : 0))
                Text(c.lead)
                    + Text(Image(systemName: "folder")).foregroundStyle(Color.paneAccent.opacity(0.85))
                    + Text("\u{2009}\(c.folder)").foregroundStyle(Color.ink)
                    + Text(c.rest)
            }
        }
        .font(.system(size: PageType.small)).foregroundStyle(Color.muted)
        .lineLimit(Self.captionLines(for: size))
        .fixedSize(horizontal: false, vertical: true)
        // One height whatever it says (the folder's glyph makes a line a hair taller).
        .frame(height: Self.captionLines(for: size) == 1 ? 17 : 34, alignment: .topLeading)
        .accessibilityIdentifier("templates.caption")
    }

    /// The button: Make with the AI shown (or, with none, Add the note or Add the app), and an
    /// arrow with your other AIs, each with its mark, and the prompt to copy.
    private func actions(_ e: TemplateCatalog.Entry) -> some View {
        HStack(spacing: 1) {
            Button { make(e, ai) } label: { makeLabel(e, ai) }
                .buttonStyle(.amberProminent(.regular, wide: true, joined: .leading))
                // Return makes the open template.
                .keyboardShortcut(e == open ? .defaultAction : nil)
                .accessibilityIdentifier("templates.make")
            Menu {
                ForEach(ais.filter { $0 != ai && $0.asks }) { other in
                    Button { picked = other; make(e, other) } label: {
                        // A menu row is its picture and its words: the mark is a finished picture
                        // (AIGlyph.menuImage), shown whatever the menu's own style for icons.
                        Label { Text(TemplateLibraryWords.make(e, other)) } icon: { AIGlyph.menuImage(other.name, dark: scheme == .dark) ?? Image(systemName: "sparkle") }
                            .labelStyle(.titleAndIcon)
                    }
                }
                if ais.contains(where: { $0 != ai && $0.asks }) { Divider() }
                Button { copy(e) } label: {
                    // In the menu's own ink, never the accent: only an AI's mark carries colour here.
                    Label { Text(TemplateLibraryWords.copy) } icon: { Self.menuSymbol("doc.on.doc", dark: scheme == .dark) }
                        .labelStyle(.titleAndIcon)
                }
            } label: {
                Image(systemName: "chevron.down").font(.system(size: PageType.small, weight: .semibold))
            }
            .menuStyle(.button)
            .menuIndicator(.hidden)
            .buttonStyle(.amberProminent(.regular, joined: .trailing))
            .fixedSize()
            .accessibilityLabel(TemplateLibraryWords.more)
            .accessibilityIdentifier("templates.makeWith")
        }
    }

    /// A symbol for a menu row as a finished picture in the menu's ink: a template symbol there
    /// takes the sheet's tint, and "Copy the prompt" drew in amber beside the AIs' marks.
    static func menuSymbol(_ name: String, dark: Bool) -> Image {
        let config = NSImage.SymbolConfiguration(pointSize: 13, weight: .regular).applying(.init(paletteColors: [dark ? .white : .black]))
        guard let image = NSImage(systemSymbolName: name, accessibilityDescription: nil)?.withSymbolConfiguration(config) else { return Image(systemName: name) }
        image.isTemplate = false
        return Image(nsImage: image)
    }

    /// "Make with ChatGPT" with ChatGPT's mark: an AI named is an AI shown.
    private func makeLabel(_ e: TemplateCatalog.Entry, _ ai: SetupCards.AI) -> some View {
        HStack(spacing: 7) {
            if ai.asks { AIGlyph(ai: ai.name, size: 15, monochrome: true) }
            Text(TemplateLibraryWords.make(e, ai))
        }
    }

    private func copy(_ e: TemplateCatalog.Entry) {
        ConnectClipboard.set(SetupCards.prompt(e.pick))
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
        let share = (size.width - Self.margin * 2 - Self.gap * CGFloat(max(related.count, 1) - 1)) / CGFloat(max(related.count, 1))
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
                    .accessibilityIdentifier("templates.more.\(r.slug)")
                }
            }
            // The first cover on the margin, its tile's wash 8 pt past it.
            .padding(.leading, -8)
        }
        .padding(.leading, Self.margin)
        .padding(.top, Self.gap)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
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

/// The kinds, as one row of words in a quiet track: the picked one on a raised pill in the
/// sheet's own greys, its word in ink. Drawn here, not the system's segmented picker: in a key
/// window that one filled its pick with the accent under white words (white on amber, about 2:1,
/// in the real app; grey in a window that isn't key, so the pictures showed another control;
/// council, 10 November 2026). Every kind has a hover look; the arrow keys are the covers'.
struct TemplateKinds: View {
    @Binding var filter: String
    @Environment(\.colorScheme) private var scheme

    static let height: CGFloat = 28
    /// The raised pill under the picked kind: white on the light track, a lighter grey on the dark.
    static func pill(dark: Bool) -> Color { dark ? Color(white: 0.34) : .white }

    var body: some View {
        HStack(spacing: 2) {
            ForEach(TemplateCatalog.filters, id: \.self) { kind in
                // Apps is a format among topics: a hairline sets it apart.
                if kind == "Apps" {
                    Rectangle().fill(Color.primary.opacity(0.14)).frame(width: 1, height: 14).padding(.horizontal, 4)
                        .accessibilityHidden(true)
                }
                Kind(name: TemplateCatalog.label(kind), on: filter == kind) { filter = kind }
                    .accessibilityIdentifier("templates.kind.\(TemplateCatalog.label(kind))")
            }
        }
        .padding(2)
        .background(Color.primary.opacity(0.06), in: .rect(cornerRadius: 9, style: .continuous))
        .fixedSize()
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Kind")
    }

    private struct Kind: View {
        let name: String
        let on: Bool
        let action: () -> Void
        @State private var hover = false
        @Environment(\.colorScheme) private var scheme

        var body: some View {
            Button(action: action) {
                Text(name)
                    .font(.system(size: 13, weight: on ? .semibold : .regular))
                    .foregroundStyle(on ? Color.ink : Color.ink.opacity(0.8))
                    .padding(.horizontal, 13)
                    .frame(height: TemplateKinds.height - 4)
                    .background {
                        let shape = RoundedRectangle(cornerRadius: 7, style: .continuous)
                        if on {
                            shape.fill(TemplateKinds.pill(dark: scheme == .dark))
                                .shadow(color: .black.opacity(scheme == .dark ? 0 : 0.12), radius: 1.5, y: 0.5)
                        } else if hover {
                            shape.fill(Color.primary.opacity(0.07))
                        }
                    }
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .onHover { hover = $0 }
            .accessibilityAddTraits(on ? .isSelected : [])
        }
    }
}

/// The × in Search that clears it, with a hover look like every clickable.
private struct SearchClearButton: View {
    let action: () -> Void
    @State private var hover = false

    var body: some View {
        Button(action: action) {
            Image(systemName: "xmark.circle.fill")
                .font(.system(size: 13))
                .foregroundStyle(hover ? Color.ink.opacity(0.7) : Color.muted.opacity(0.7))
                .frame(width: 18, height: 18)
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .onHover { hover = $0 }
        .accessibilityLabel("Clear search")
        .help("Clear search")
    }
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
    /// The app has drawn: its page can be shown.
    var drew: () -> Void = {}
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
                                 drew()
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
