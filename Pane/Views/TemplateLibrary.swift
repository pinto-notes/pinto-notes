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

    /// The filters, in the site's order: everything, the ones with an app, then each kind.
    static let filters = ["All", "Apps", "Habits and health", "Work", "Learning", "Home and life"]

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
    /// Back, from a template's page: the button says "Templates"; VoiceOver hears where it goes.
    static let back = "Back to Templates"
    /// The gallery when no template matches the kind and the search.
    static let none = "No templates match"
    /// On the stage: what you see is filled in; Make adds an empty one that your AI fills.
    static let example = "Example"
    /// The small tag on a cover with an app, so you can tell one from a note before you open it.
    static let app = "App"
    static let asked = "What your AI is asked"
    static let moreLike = "More like this"
    /// The arrow beside the button, to VoiceOver.
    static let more = "More ways to add it"
    static let withoutAI = "Add without AI"
    static let copy = "Copy the prompt"
    static let copied = "Prompt copied"

    /// The one button: Make with your AI; with none that opens with the ask, what it adds.
    static func make(_ e: TemplateCatalog.Entry, _ ai: SetupCards.AI) -> String {
        ai.asks ? "Make with \(ai.name)" : e.app ? "Add the app" : "Add the note"
    }

    /// A template's kind as a small label: "Health", and "App" after it for one with an app.
    static func kind(_ e: TemplateCatalog.Entry) -> String {
        TemplateCatalog.label(e.category) + (e.app ? " \u{00B7} \(app)" : "")
    }

    /// What each template's AI asks you first, as the caption ends: "then ChatGPT asks (this)."
    /// From the ask Make sends ("Ask which habits I did today and which I skipped, then ..."),
    /// said to you and kept short. SetupCardsTests' everyTemplateHasItsCaption checks all are here.
    static let asks: [String: String] = [
        "habit-tracker": "which habits you did today",
        "meeting-notes": "for your meeting notes",
        "daily-standup": "what you did yesterday",
        "meal-plan": "what you feel like this week",
        "reading-list": "which book to add",
        "mood-energy-log": "how your day went",
        "job-hunt": "for the job ad",
        "trip-plan": "where and when you're going",
        "study-flashcards": "for your study notes",
        "decision-log": "what you decided",
        "workout-log": "how the workout went",
        "budget-log": "what you spent today",
        "one-on-one-notes": "what you want to raise",
        "book-notes": "which book you're reading",
        "bug-triage": "for the customer's report",
        "weekly-review": "this week's five questions",
        "recipe-box": "for the recipe",
        "content-calendar": "for your content idea",
        "home-maintenance": "which job to track",
        "gift-ideas": "who the gift is for",
        "cornell-notes": "for your lecture notes",
        "daily-journal": "today's four questions",
        "grocery-list": "what groceries you need",
    ]

    /// The quiet line under the button, in three parts around the folder's tag: what Make does
    /// and where the note goes ("Adds to", the folder, ", then ChatGPT asks which habits you did
    /// today."). With no AI that opens with the ask, only where it goes.
    static func caption(_ e: TemplateCatalog.Entry, ai: SetupCards.AI) -> (lead: String, folder: String, rest: String) {
        let folder = e.folder ?? "Notes"
        guard ai.asks else { return ("Adds to ", folder, ".") }
        let asks = asks[e.slug].map { "asks \($0)" } ?? "fills it in with you"
        return ("Adds to ", folder, ", then \(ai.name) \(asks).")
    }
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

    /// The template's note is added (as the setup gallery and the website add it); for ChatGPT or
    /// Claude the ask goes on the clipboard and the AI opens with it. Returns the new note, to open.
    /// The note comes from the app's own copy, so Make is instant and works offline (8 November
    /// 2026: it waited on up to five requests to the site, and offline opened the AI on a note that
    /// was never added). A template you added and still have is opened, not added again: the ask
    /// names the note, and two of the same name leave the AI guessing. No note, no ask.
    @MainActor static func make(_ e: TemplateCatalog.Entry, with ai: SetupCards.AI, context: ModelContext, account: UUID?,
                                source: any NoteSourceFetching = ShippedTemplates(), ledger: NoteSourceLedger? = nil,
                                copy: (String) -> Void = ConnectClipboard.set, open: (URL) -> Void) async -> UUID? {
        let link = NoteSourceLink(kind: .template, slug: e.slug)
        let ledger = ledger ?? NoteSourceLedger(account: account)
        var note = ledger.existing(link, in: context)?.id
        if note == nil {
            let model = NoteSourceModel(link: link, source: source, ledger: ledger)
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
/// The gallery: the covers across the sheet's whole width, each with its name, filtered in place
/// by a kind and by Search. Nothing is picked at rest; the arrow keys move a ring through the
/// covers and Return opens the one it's on.
///
/// A template's page, opened by a click or Return: its example large on a plain stage, and beside
/// it its name, what it is, the one button that makes it and what your AI is asked; under them,
/// more like it. Back, Esc and ⌘[ return to the gallery as it was left (it stays under the page:
/// its scroll, kind and search are kept).
struct TemplateLibraryView: View {
    var catalog = TemplateCatalog.shipped
    /// Your connected AIs, the one you used last first: Make uses the first, or the one picked
    /// from the arrow beside it.
    var ais: [SetupCards.AI] = [.chatgpt]
    /// The template whose page is open; nil is the gallery.
    @State var open: TemplateCatalog.Entry?
    var make: (TemplateCatalog.Entry, SetupCards.AI) -> Void = { _, _ in }
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
    /// Search has the keys on the gallery. On a template's page nothing has: its keys (Esc, ⌘[,
    /// Return, and the arrows to the template before and after) are its buttons' shortcuts, which
    /// need no focus. With `onKeyPress` alone the arrows went nowhere there, and a page that took
    /// the focus drew focus rings on Back and Make (real keys on the Air, 9 November 2026).
    @FocusState private var searching: Bool
    @Environment(\.colorScheme) private var scheme
    @Environment(\.inSheet) private var inSheet
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static let size = CGSize(width: 1040, height: 680)
    static let gap: CGFloat = 16

    /// The sheet's size on a window: the full size where it fits, never wider or taller than the
    /// window less a margin, and never so small a template's page loses its button.
    static func size(on window: CGSize) -> CGSize {
        CGSize(width: min(size.width, max(720, window.width - 80)), height: min(size.height, max(500, window.height - 60)))
    }

    // MARK: The page's parts

    /// The row over a template's page: Back and the close x.
    static let topRow: CGFloat = 52
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
    /// The "Example" label's row at the stage's top.
    static let exampleRow: CGFloat = 30
    /// What a template's note or app has to show itself in, under the label.
    static func window(for size: CGSize) -> CGSize {
        CGSize(width: stageWidth(for: size), height: stageHeight(for: size) - exampleRow)
    }
    /// One measure everywhere: the sheet's margin (the gallery's, the page's stage and words, and
    /// "More like this") and the gap between things (`gap`). The sheet's name, Back, the stage's
    /// lines and "More like this" all start on the margin.
    static let margin: CGFloat = 24

    /// The page's type: one large thing (the name, over twice the body's size), the body, and
    /// small quiet labels; with the button's own size, four sizes, in three weights (bold for the
    /// name, semibold for labels and the button, regular).
    enum PageType {
        static let name: CGFloat = 28
        static let body: CGFloat = 13
        static let small: CGFloat = 12
    }
    /// How tall the fade at the stage's foot is.
    static let footFade: CGFloat = 12
    /// A table on the stage shows at most this many columns (the stage's own trim), and fewer
    /// where the stage is too narrow for their words: never a column cut at the stage's side.
    static let stageColumns = 5
    /// The room a note's lines have on the stage: its width less the margins.
    static func lineRoom(for size: CGSize) -> CGFloat { window(for: size).width - margin * 2 }

    // MARK: Moving between pages

    /// One quick move between the gallery and a template's page: the page comes in over the
    /// gallery, which stays whole under it, and goes the same way. None with Reduce Motion.
    /// From one template to the next the page changes at once, in one frame: dissolved, the two
    /// pages' words showed over each other for a tenth of a second (two names, two examples),
    /// which is the flicker the old panel had (60 fps frames from the Air, 9 November 2026).
    static let moveDuration: Double = 0.16
    static func move(reduceMotion: Bool) -> Animation? { reduceMotion ? nil : .easeOut(duration: moveDuration) }
    static func pageTransition(reduceMotion: Bool) -> AnyTransition { reduceMotion ? .identity : .opacity }
    /// Whether going from one page to another is animated: only to and from the gallery.
    static func animates(from: TemplateCatalog.Entry?, to: TemplateCatalog.Entry?) -> Bool { from == nil || to == nil }

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

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 20, style: .continuous)
        let shown = catalog.shown(filter: filter, query: query)
        let layers = [open].compactMap { $0 }
        ZStack {
            gallery(shown)
                // Under a page it keeps its place, and takes no clicks or VoiceOver.
                .allowsHitTesting(open == nil)
                .accessibilityHidden(open != nil)
            ForEach(Array(layers.enumerated()), id: \.element.slug) { i, e in
                page(e, shown: shown)
                    // Opaque: the gallery never shows through a page, nor one page through another.
                    .background(SetupCards.ground)
                    .zIndex(Double(i + 1))
                    .allowsHitTesting(e == open)
                    .accessibilityHidden(e != open)
                    .transition(Self.pageTransition(reduceMotion: reduceMotion))
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
        // On a page Return is Make, the page's default button.
        .onKeyPress(.return) { openFromKeys() ? .handled : .ignored }
        .onAppear {
            if inSheet, let window = NSApp.mainWindow { size = Self.size(on: window.frame.size) }
            searching = open == nil
        }
        // Search has the keys on the gallery, and gives them up under a page.
        .onChange(of: open) { _, now in searching = now == nil }
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
        if along != 0, !Self.arrowsMoveCovers(searching: searching, query: query) { return .ignored }
        focused = Self.step(shown, from: focused.flatMap { shown.contains($0) ? $0 : nil }, by: along + rows * columns)
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

    /// Opens a template's page, goes from one template's to another's, or (nil) back to the gallery.
    private func show(_ e: TemplateCatalog.Entry?) {
        copied = false
        guard e != open else { return }
        guard Self.animates(from: open, to: e), let animation = Self.move(reduceMotion: reduceMotion) else {
            // At once: with Reduce Motion, and from one template to the next.
            var instant = Transaction()
            instant.disablesAnimations = true
            withTransaction(instant) { open = e }
            return
        }
        withAnimation(animation) { open = e }
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
                // Nothing matches: one plain line where the covers were.
                Text(TemplateLibraryWords.none)
                    .font(.system(size: 13)).foregroundStyle(Color.muted)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .accessibilityIdentifier("templates.none")
            } else {
                grid(shown)
            }
        }
    }

    /// One row: the sheet's name, the kinds, Search and the close x. A sheet too narrow for all
    /// four leaves the name out (the kinds and Search say what it is).
    private var header: some View {
        ViewThatFits(in: .horizontal) {
            headerRow(named: true)
            headerRow(named: false)
        }
        .padding(.horizontal, Self.margin)
        .frame(height: Self.headerHeight)
    }

    static let headerHeight: CGFloat = 60

    private func headerRow(named: Bool) -> some View {
        HStack(spacing: 14) {
            if named {
                Text(TemplateLibraryWords.title).font(.system(size: 20, weight: .bold)).foregroundStyle(Color.ink)
                    .fixedSize()
                    .accessibilityAddTraits(.isHeader)
            }
            Picker("Kind", selection: $filter) {
                ForEach(TemplateCatalog.filters, id: \.self) { Text(TemplateCatalog.label($0)).tag($0) }
            }
            .pickerStyle(.segmented)
            // As tall as Search, 28 pt.
            .controlSize(.large)
            .labelsHidden()
            .fixedSize()
            Spacer(minLength: 0)
            search
            // Esc is this x's while the gallery shows; on a page it's Back's.
            CardCloseButton(cancels: open == nil, action: close)
        }
    }

    /// Search, focused when the library opens: type to narrow, Esc clears what's typed and only
    /// then closes, as a Mac search field does.
    private var search: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
            TextField("Search", text: $query).textFieldStyle(.plain)
                .focused($searching)
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
        .frame(minWidth: 140, maxWidth: 220)
        .frame(height: 28)
        .background(Color.primary.opacity(0.06), in: .rect(cornerRadius: 8, style: .continuous))
    }

    private func grid(_ shown: [TemplateCatalog.Entry]) -> some View {
        GeometryReader { geo in
            // The row the cards really get: less than the pane when a mouse is attached and the
            // scroll bar takes its own room (the cards then left a column's gap).
            let width = Self.cardWidth(row: row > 0 ? row : geo.size.width - Self.margin * 2, gap: Self.gap)
            ScrollViewReader { scroller in
                ScrollView {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: width, maximum: width), spacing: Self.gap, alignment: .top)], alignment: .leading, spacing: Self.gap) {
                        ForEach(shown) { e in
                            // The art and its name; the ring is the arrow keys', never a pick.
                            SetupTemplateCard(pick: e.pick, width: width, selected: focused == e, words: .name, tag: e.app ? TemplateLibraryWords.app : nil) {
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
                    .padding(.vertical, Self.gap)
                    .coordinateSpace(.named(Self.space))
                }
                .onScrollGeometryChange(for: CGRect.self, of: { $0.visibleRect }) { [seen] _, now in seen.visible = now }
                // The cover the keys are on is always in full view: it comes in by the nearest
                // edge, no further than it must.
                .onChange(of: focused?.slug) { _, slug in
                    guard let slug, let anchor = Self.revealAnchor(cell: seen.cards[slug], visible: seen.visible) else { return }
                    if reduceMotion { scroller.scrollTo(slug, anchor: anchor) } else { withAnimation(.snappy(duration: 0.2)) { scroller.scrollTo(slug, anchor: anchor) } }
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    /// Where a cover the keys moved to comes into view: nowhere when it's in view with a gap to
    /// spare; by the foot when the foot cuts it; otherwise by the top. A cover not laid out yet
    /// (a lazy grid's) comes in by the foot: the keys only reach one by going down.
    static func revealAnchor(cell: CGRect?, visible: CGRect) -> UnitPoint? {
        guard let cell, !visible.isEmpty else { return .bottom }
        let above = cell.minY - gap < visible.minY - 0.5, below = cell.maxY + gap > visible.maxY + 0.5
        guard above || below else { return nil }
        return above ? .top : .bottom
    }

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
        .frame(width: size.width, height: size.height, alignment: .top)
    }

    private var stageGround: Color { scheme == .dark ? .black : .white }

    /// The stage: the template in use, large, on a plain surface (black, or white), under a small
    /// "Example" label: what Make adds is empty, and your AI fills it in. A note's lines start at
    /// the words' margin; an app takes the stage's whole width. Its foot fades into the surface, so
    /// no line is cut through there.
    private func stage(_ e: TemplateCatalog.Entry) -> some View {
        let window = Self.window(for: size)
        return VStack(alignment: .leading, spacing: 0) {
            Text(TemplateLibraryWords.example)
                .font(.system(size: PageType.small, weight: .semibold))
                .foregroundStyle(Color.muted)
                .padding(.leading, Self.margin)
                .frame(height: Self.exampleRow, alignment: .bottomLeading)
                .accessibilityIdentifier("templates.example")
            inUse(e)
                .frame(width: window.width, height: window.height, alignment: .topLeading)
                .clipped()
                .accessibilityLabel("\(e.title), an example")
        }
        .frame(width: Self.stageWidth(for: size), height: Self.stageHeight(for: size), alignment: .topLeading)
        .background(stageGround)
        .overlay(alignment: .bottom) {
            LinearGradient(colors: [stageGround.opacity(0), stageGround], startPoint: .top, endPoint: .bottom)
                .frame(height: Self.footFade)
                .allowsHitTesting(false)
                .accessibilityHidden(true)
        }
    }

    /// The app itself when it is one, running on its sample; otherwise the filled-in note, drawn
    /// as the app draws notes.
    @ViewBuilder private func inUse(_ e: TemplateCatalog.Entry) -> some View {
        if let project = TemplateFiles.project(e) {
            // Tick, add and scroll as you would; nothing it does is kept. Its picture shows while
            // it starts, so the stage is never blank.
            TemplateAppPreview(entry: e, project: project, narrow: Self.narrow(size))
        } else {
            // Whole blocks only: no line cut through at the stage's foot, no heading left without
            // its first line, and tables laid out at the stage's width.
            NotePreview(markdown: e.example, given: TemplateFiles.example(e, room: Self.lineRoom(for: size)), whole: true)
                .padding(.horizontal, Self.margin - 20)
        }
    }

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
            while count > 2, NotePreview.leastWidths(header: Array(header.prefix(count)), rows: rows.map { Array($0.prefix(count)) }).reduce(0, +) > room { count -= 1 }
            guard count < header.count else { return block }
            return .table(header: Array(header.prefix(count)), rows: rows.map { Array($0.prefix(count)) })
        }
    }

    /// Beside the stage: the name, its kind, what it is, the one button that makes it with what
    /// that does under it, and what your AI is asked, as plain words.
    private func words(_ e: TemplateCatalog.Entry) -> some View {
        let wide = size.width - Self.stageWidth(for: size) - 1 - Self.margin * 2
        return VStack(alignment: .leading, spacing: 0) {
            // The cover you clicked, small, beside its name: the page is that card's.
            HStack(alignment: .center, spacing: 14) {
                Self.thumbnail(e.pick)
                VStack(alignment: .leading, spacing: 3) {
                    Text(e.title).font(.system(size: PageType.name, weight: .bold)).foregroundStyle(Color.ink)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                        .accessibilityIdentifier("templates.name")
                    Text(TemplateLibraryWords.kind(e)).font(.system(size: PageType.small)).foregroundStyle(Color.muted)
                        .accessibilityIdentifier("templates.kind")
                }
            }
            Text(NoWidow.kept(e.shownDescription, phrases: true)).font(.system(size: PageType.body)).foregroundStyle(Color.ink)
                .lineSpacing(2)
                .lineLimit(4)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 14)
            actions(e)
                .padding(.top, 20)
            caption(e)
                .padding(.top, 10)
            Divider().padding(.vertical, 22)
            Text(TemplateLibraryWords.asked).font(.system(size: PageType.small, weight: .semibold)).foregroundStyle(Color.muted)
            // The prompt as words, not a field: nothing here is typed in or pressed.
            Text("\u{201C}\(NoWidow.kept(TemplateCatalog.Entry.sendable(e.ask), phrases: true))\u{201D}")
                .font(.system(size: PageType.body)).foregroundStyle(Color.ink)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 6)
                .accessibilityIdentifier("templates.ask")
            Spacer(minLength: 0)
        }
        .frame(width: wide, alignment: .leading)
        .padding(.horizontal, Self.margin)
        .padding(.top, 26)
    }

    /// What Make does and where the note goes, quietly, under the button: "Adds to (folder)
    /// Health, then ChatGPT asks which habits you did today." The folder is Go to Note's tag: a
    /// small folder in the accent, then its name. "Copied" takes its place for a moment after
    /// Copy the prompt.
    private func caption(_ e: TemplateCatalog.Entry) -> some View {
        Group {
            if copied {
                Text("\(Image(systemName: "checkmark")) \(TemplateLibraryWords.copied)")
            } else {
                let c = TemplateLibraryWords.caption(e, ai: ai)
                Text(c.lead)
                    + Text(Image(systemName: "folder")).foregroundStyle(Color.paneAccent.opacity(0.85))
                    + Text("\u{2009}\(c.folder)").foregroundStyle(Color.ink)
                    + Text(c.rest)
            }
        }
        .font(.system(size: PageType.small)).foregroundStyle(Color.muted)
        .lineLimit(2)
        .fixedSize(horizontal: false, vertical: true)
        .accessibilityIdentifier("templates.caption")
    }

    /// The one button: Make with the AI shown (or, with none, Add the note or Add the app), and
    /// an arrow with the other ways: another AI, without one, and the prompt to copy.
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
                        if let mark = AIGlyph.menuImage(other.name, dark: scheme == .dark) {
                            Label { Text(TemplateLibraryWords.make(e, other)) } icon: { mark }
                        } else {
                            Text(TemplateLibraryWords.make(e, other))
                        }
                    }
                }
                if ai.asks {
                    Button(TemplateLibraryWords.withoutAI) { make(e, .other) }
                    Divider()
                }
                Button(TemplateLibraryWords.copy) { copy(e) }
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

    /// More like this, under the page: four of the same need or kind, a small cover and a name
    /// each. A click swaps the page to it.
    private func more(_ e: TemplateCatalog.Entry) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(TemplateLibraryWords.moreLike).font(.system(size: PageType.small, weight: .semibold)).foregroundStyle(Color.muted)
            HStack(spacing: Self.gap) {
                ForEach(Self.related(e, in: catalog.entries)) { r in
                    Button { show(r) } label: {
                        HStack(spacing: 12) {
                            Self.thumbnail(r.pick)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(r.title).font(.system(size: PageType.body, weight: .semibold)).foregroundStyle(Color.ink).lineLimit(2)
                                Text(TemplateLibraryWords.kind(r)).font(.system(size: PageType.small)).foregroundStyle(Color.muted).lineLimit(1)
                            }
                            .multilineTextAlignment(.leading)
                            Spacer(minLength: 0)
                        }
                        .padding(.vertical, 8)
                        .padding(.trailing, 8)
                        // A quarter of the row each, so three sit where three of four would. The
                        // cover sits on the margin; the tile's wash reaches 8 pt past it.
                        .frame(width: (size.width - Self.margin * 2 - Self.gap * 3) / 4 - 8, alignment: .leading)
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

    /// A template's cover, small: beside its name on its page, and under "More like this".
    static func thumbnail(_ pick: SetupCards.Pick) -> some View {
        Color(rgb: pick.ground)
            .frame(width: moreCover, height: moreCover)
            .overlay(alignment: .top) { pick.image.resizable().scaledToFill().frame(width: moreCover, height: moreCover) }
            .clipShape(.rect(cornerRadius: 10, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(Color.primary.opacity(0.12), lineWidth: 0.5))
            .accessibilityHidden(true)
    }

    /// More like this: templates for the same need, said for each one, nearest first. Never one
    /// from the same kind only to fill the row (Habit tracker under Reading list): three where
    /// only three belong.
    static let like: [String: [String]] = [
        "habit-tracker": ["mood-energy-log", "workout-log", "daily-journal", "weekly-review"],
        "meeting-notes": ["one-on-one-notes", "daily-standup", "decision-log"],
        "daily-standup": ["meeting-notes", "one-on-one-notes", "weekly-review"],
        "meal-plan": ["grocery-list", "recipe-box", "budget-log"],
        "reading-list": ["book-notes", "study-flashcards", "cornell-notes"],
        "mood-energy-log": ["daily-journal", "habit-tracker", "weekly-review"],
        "job-hunt": ["decision-log", "weekly-review", "meeting-notes"],
        "trip-plan": ["budget-log", "gift-ideas", "daily-journal"],
        "study-flashcards": ["cornell-notes", "reading-list", "book-notes"],
        "decision-log": ["meeting-notes", "one-on-one-notes", "bug-triage", "weekly-review"],
        "workout-log": ["habit-tracker", "mood-energy-log", "meal-plan"],
        "budget-log": ["meal-plan", "grocery-list", "home-maintenance", "gift-ideas"],
        "one-on-one-notes": ["meeting-notes", "daily-standup", "decision-log"],
        "book-notes": ["reading-list", "study-flashcards", "cornell-notes"],
        "bug-triage": ["daily-standup", "decision-log", "meeting-notes"],
        "weekly-review": ["daily-journal", "mood-energy-log", "habit-tracker", "daily-standup"],
        "recipe-box": ["meal-plan", "grocery-list", "budget-log"],
        "content-calendar": ["meeting-notes", "weekly-review", "daily-standup"],
        "home-maintenance": ["budget-log", "grocery-list", "meal-plan"],
        "gift-ideas": ["budget-log", "trip-plan", "grocery-list"],
        "cornell-notes": ["study-flashcards", "book-notes", "reading-list"],
        "daily-journal": ["mood-energy-log", "weekly-review", "habit-tracker"],
        "grocery-list": ["meal-plan", "recipe-box", "budget-log", "home-maintenance"],
    ]

    /// The templates to offer under one: its list's, those of them the catalog has.
    static func related(_ e: TemplateCatalog.Entry, in all: [TemplateCatalog.Entry]) -> [TemplateCatalog.Entry] {
        (like[e.slug] ?? []).compactMap { slug in all.first { $0.slug == slug } }.prefix(4).map { $0 }
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
        let days = TemplateSample.days(to: today)
        let key = "\(e.slug)-\(days)-\(Int(room))"
        if let b = examples[key] { return b }
        let b = TemplateLibraryView.staged(TemplateExample.moved(e.example, days: days), room: room)
        examples[key] = b
        return b
    }
    private static var examples: [String: [NotePreview.Block]] = [:]

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
        return try! NSRegularExpression(pattern: #"\b(\d{4})-(\d{2})-(\d{2})\b|(Week of )?(?:\b("# + weekday + #") )?\b(\d{1,2}) ("# + month + #")\b"#)
    }()

    private static let calendar = Calendar(identifier: .gregorian)

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
            // No year is written: the one that puts the date nearest the samples' day.
            let candidates = [a[0] - 1, a[0], a[0] + 1].compactMap { date($0, mo + 1, d) }
            guard let from = candidates.min(by: { abs($0.timeIntervalSince(anchorDay)) < abs($1.timeIntervalSince(anchorDay)) }),
                  var to = calendar.date(byAdding: .day, value: days, to: from) else { continue }
            let week = group(4) != nil
            if week {
                // A week is named by its Monday.
                let back = (calendar.component(.weekday, from: to) + 5) % 7
                to = calendar.date(byAdding: .day, value: -back, to: to) ?? to
            }
            let c = calendar.dateComponents([.month, .day, .weekday], from: to)
            let short = name.count == 3 && name != "May"
            let month = short ? String(months[(c.month ?? 1) - 1].prefix(3)) : months[(c.month ?? 1) - 1]
            var s = "\(c.day ?? 0) \(month)"
            if let w = group(5) {
                let day = weekdays[(c.weekday ?? 1) - 1]
                s = (w.count == 3 ? String(day.prefix(3)) : day) + " " + s
            }
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
                             onReady: { withAnimation(.easeOut(duration: 0.15)) { ready = true } },
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
