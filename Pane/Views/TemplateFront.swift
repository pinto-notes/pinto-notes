import SwiftData
#if os(macOS)
import SwiftUI

/// The library's work, counted for the scroll test (TemplateScrollTests): how often a body runs
/// and a geometry or scroll callback fires. Nothing in a release build.
@MainActor enum TemplateProbe {
    #if DEBUG
    static var counts: [String: Int] = [:]
    #endif
    @inline(__always) static func hit(_ what: String) {
        #if DEBUG
        counts[what, default: 0] += 1
        #endif
    }
}

/// The front page's type: four sizes, and nothing set at any other. The largest is the question
/// that leads the page; then headings (the sheet's name, a shelf); then an item's name; then every
/// secondary line. Bold for the first two, semibold for names, regular for lines.
nonisolated enum TemplateType {
    static let hero: CGFloat = 30
    static let heading: CGFloat = 20
    static let item: CGFloat = 15
    static let line: CGFloat = 13
}

/// The front page's edit: the shelves under its field, each with a heading, a line under it
/// saying why it is there, and one kind of card. Every template is on it. Fixed here for now; it
/// would move into the catalog (web/content/templates) with the rest of a template's words.
struct TemplateFront: Sendable {
    struct Shelf: Identifiable, Sendable {
        /// Two card designs for the whole page. `covers`: a large cover with the name and a line
        /// under it, three across. `rows`: a compact list, a small cover, the name and a line.
        /// `apps` is the cover card with one thing added: beside the cover, quietly, a picture of
        /// the app in use.
        enum Kind: Sendable { case covers, apps, rows }
        let title: String
        let line: String
        let kind: Kind
        let slugs: [String]
        var id: String { "shelf.\(title)" }
    }

    let shelves: [Shelf]

    static let shipped = TemplateFront(shelves: [
        Shelf(title: "Start here", line: "Three notes that are useful from the first day.", kind: .covers,
              slugs: ["meeting-notes", "reading-list", "meal-plan"]),
        Shelf(title: "Small apps that live in a note", line: "Open the note and the app is there. Tick, add and change things yourself, or ask your AI to.", kind: .apps,
              slugs: ["habit-tracker", "budget-log", "trip-plan", "study-flashcards"]),
        Shelf(title: "For work", line: "Meetings, decisions and bugs, written up and kept in order.", kind: .rows,
              slugs: ["daily-standup", "one-on-one-notes", "decision-log", "bug-triage", "content-calendar", "job-hunt"]),
        Shelf(title: "For the week", line: "A few lines each day, then five questions on Sunday.", kind: .covers,
              slugs: ["daily-journal", "weekly-review", "mood-energy-log"]),
        Shelf(title: "For home and health", line: "Lists and logs for the things that come round again.", kind: .rows,
              slugs: ["grocery-list", "recipe-box", "home-maintenance", "gift-ideas", "workout-log"]),
        Shelf(title: "For reading and study", line: "Keep what a book or a lecture taught you.", kind: .rows,
              slugs: ["book-notes", "cornell-notes"]),
    ])

    /// The shelves as the page shows them for a catalog: each with the templates it names that
    /// the catalog has, and last a shelf of any the edit doesn't name yet (one the site added), so
    /// no template is ever missing from the front page.
    func shelves(for catalog: TemplateCatalog) -> [(shelf: Shelf, entries: [TemplateCatalog.Entry])] {
        var out: [(shelf: Shelf, entries: [TemplateCatalog.Entry])] = []
        var placed: Set<String> = []
        for shelf in shelves {
            let entries = shelf.slugs.compactMap { slug in catalog.entries.first { $0.slug == slug } }
            placed.formUnion(shelf.slugs)
            if !entries.isEmpty { out.append((shelf, entries)) }
        }
        let rest = catalog.entries.filter { !placed.contains($0.slug) }
        if !rest.isEmpty { out.append((Shelf(title: "More templates", line: "Newly added.", kind: .rows, slugs: rest.map(\.slug)), rest)) }
        return out
    }

    /// Every template once, in the front page's order: each shelf's, left to right.
    func order(for catalog: TemplateCatalog) -> [TemplateCatalog.Entry] {
        shelves(for: catalog).flatMap(\.entries)
    }
}

/// The covers at the sizes the front page draws them, and an app's card picture.
@MainActor enum TemplateArt {
    /// The widest tile the 360 px cover draws sharp in, at two pixels a point.
    static let smallUpTo: CGFloat = 180

    /// The cover at 800 px (the 360 px copy is made for a 190 pt card): the front page's cover
    /// cards draw it up to 260 pt across (scripts/template-catalog.py makes both).
    static func large(_ e: TemplateCatalog.Entry) -> Image {
        let key = "template-cover-\(e.slug)-large"
        if let i = SetupCards.Pick.covers.object(forKey: key as NSString) { return Image(nsImage: i) }
        if let url = Bundle.main.url(forResource: key, withExtension: "jpg"), let i = NSImage(contentsOf: url) {
            TemplateProbe.hit("load")
            SetupCards.Pick.covers.setObject(i, forKey: key as NSString)
            return Image(nsImage: i)
        }
        return e.pick.image
    }

    /// The cover in a tile of exactly `width` by `height`: its picture from the top at the tile's
    /// width, on its own ground. The tile's size is fixed: nothing beside it can squeeze it.
    static func tile(_ e: TemplateCatalog.Entry, width: CGFloat, height: CGFloat, radius: CGFloat) -> some View {
        Color(rgb: e.pick.ground)
            .frame(width: width, height: height)
            // Up to 180 pt across, the 360 px cover is sharp; only larger tiles read the 800 px one.
            .overlay(alignment: .top) { (width <= smallUpTo ? e.pick.image : large(e)).resizable().scaledToFill().frame(width: width, height: width) }
            .clipShape(.rect(cornerRadius: radius, style: .continuous))
            .fixedSize()
            .accessibilityHidden(true)
    }

    /// An app in use for its card on the front page ("stage-card", 533 by 520 px): its whole
    /// blocks ending close over its own tabs, shown without the tabs (the top 454 px), so the
    /// picture ends cleanly and full. scripts/template-stage-pictures.ts draws it.
    static func card(_ e: TemplateCatalog.Entry, dark: Bool) -> NSImage? {
        let key = "template-app-\(e.slug)-stage-card-\(dark ? "dark" : "light")"
        if let i = pictures[key] { return i }
        let i = Bundle.main.url(forResource: key, withExtension: "jpg").flatMap { NSImage(contentsOf: $0) }
        pictures[key] = .some(i)
        return i
    }
    private static var pictures: [String: NSImage?] = [:]
    /// The card picture as drawn (533 by 520 px), and what shows of it: its top, without the
    /// app's own tabs (66 px), so 533 by 454.
    static let cardDrawn = CGSize(width: 533, height: 520)
    static let cardShape: CGFloat = (520.0 - 66.0) / 533.0
    /// The largest type in an app's picture, in its own pixels (template-stage.css: its figures
    /// at 1.75rem of a 17 px root). On a card it is drawn smaller than an item's name.
    static let cardLargestType: CGFloat = 1.75 * 17
}

/// The front page's two buttons, and no third: the app's own compact primary (amber in the light,
/// white in the dark) and its compact secondary (a soft fill, an ink word).
struct TemplateButton: View {
    enum Look { case primary, quiet }
    let title: String
    /// The AI's mark before the title.
    var ai: SetupCards.AI? = nil
    var look: Look = .quiet
    /// Working: a spinner and the word for what it's doing ("Adding…") in the title's place.
    var working: String? = nil
    /// The title's least width, so Make, Add and Open are one size down a list.
    var least: CGFloat = 0
    var isDefault = false
    var id = "templates.button"
    let action: () -> Void

    var body: some View {
        Group {
            switch look {
            case .primary: Button(action: action) { label }.buttonStyle(.amberProminent(.compact))
            case .quiet: Button(action: action) { label }.buttonStyle(.secondary(.compact))
            }
        }
        .keyboardShortcut(isDefault ? .defaultAction : nil)
        .allowsHitTesting(working == nil)
        .accessibilityIdentifier(id)
    }

    private var label: some View {
        HStack(spacing: 6) {
            if let working {
                TemplateSpinner()
                Text(working)
            } else {
                if let ai, ai.asks { AIGlyph(ai: ai.name, size: 13, monochrome: true) }
                Text(title)
            }
        }
        .frame(minWidth: least)
    }
}

/// The working state's spinner: an arc in the button's own label colour that turns; still with
/// Reduce Motion.
private struct TemplateSpinner: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { context in
            let turn = reduceMotion ? 0 : context.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 0.9) / 0.9
            Circle().trim(from: 0, to: 0.72)
                .stroke(style: StrokeStyle(lineWidth: 1.8, lineCap: .round))
                .frame(width: 11, height: 11)
                .rotationEffect(.degrees(turn * 360))
        }
        .accessibilityHidden(true)
    }
}

/// The library's front page, in the editorial style (leap/editorial, Emil, 12 November 2026:
/// "the editorial style" for the gallery; a template's page stays as it is).
///
/// Under the sheet's bar, centred, the question and a wide field close under it; then shelves,
/// each with a heading, a line saying why it's there and its own kind of card (large covers, the
/// apps beside a picture of them in use, compact rows). Every template is on it once. Scrolled,
/// the bar gets the system's band, a hairline and the sheet's name.
///
/// Search takes plain words (TemplateAsk): what's typed finds the templates that answer it, each
/// with the line saying why, and beside them a new note for the words; with no match, that new
/// note, which the AI shapes from the words. Every card and row opens the template's page
/// (TemplateLibraryView's); a row's button, under the pointer, makes it at once, the words typed
/// in Search in its ask.
struct TemplateFrontPage: View {
    var catalog = TemplateCatalog.shipped
    var front = TemplateFront.shipped
    /// The AI Make uses, and all of yours.
    var ai: SetupCards.AI = .chatgpt
    var folder = TemplateMaking.firstFolder
    var size = TemplateLibraryView.size
    /// Something is over the library (Connect an AI).
    var covered = false
    @Binding var query: String
    /// The card the arrow keys are on (the library's).
    var focused: TemplateCatalog.Entry?
    var keys: FocusState<TemplateLibraryView.Keys?>.Binding
    /// The folder of the note a template made, or of the one being made now.
    var held: (TemplateCatalog.Entry) -> String? = { _ in nil }
    /// Make, Add or Open from a row: the AI, and the ask with the typed words when there are some.
    var act: (TemplateCatalog.Entry, SetupCards.AI, String?) -> Void = { _, _, _ in }
    /// A new note named from the words, when no template is it; nil where there's none to make.
    var makeBlank: ((String, SetupCards.AI) -> Void)? = nil
    var connect: (() -> Void)? = nil
    var close: () -> Void = {}
    /// Opens a template's page.
    var open: (TemplateCatalog.Entry) -> Void = { _ in }
    /// The pointer came onto a card or left it (the library gets its page ready).
    var point: (TemplateCatalog.Entry, Bool) -> Void = { _, _ in }
    /// Return in the field.
    var submit: () -> Void = {}

    @State private var working: String?
    @State private var askOpen = false
    @State private var frontAt = ScrollPosition(edge: .top)
    @State private var under = Under()
    @State private var offsets = Offsets()
    @Environment(\.colorScheme) private var scheme
    @Environment(\.networkReach) private var reach
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// Something is scrolled under the bar: kept apart from the page's state, so the band turning
    /// on or off draws the band again and nothing else.
    @Observable final class Under { var now = false }
    /// How far the page is scrolled, kept without drawing anything again.
    final class Offsets { var search: CGFloat = 0 }

    // MARK: Measures

    /// Between cards across a shelf.
    static let gap: CGFloat = 20
    static func shelfGap(_ size: CGSize) -> CGFloat { small(size) ? 40 : 52 }
    static func headingGap(_ size: CGSize) -> CGFloat { small(size) ? 12 : 14 }
    static let headingLine: CGFloat = 3
    /// Over what Search found, under the field.
    static let resultsTop: CGFloat = 28
    /// The page's room over the question, inside the bar's.
    static let pageTop: CGFloat = 24
    /// The band reaches this far under the bar's controls.
    static let bandBelow: CGFloat = 12
    static func under(_ g: ScrollGeometry, first: CGFloat) -> Bool { g.contentOffset.y + g.contentInsets.top > first - bandBelow + 0.5 }
    static let rowCover: CGFloat = 44
    /// The tile over a new note's name, when nothing matches.
    static func blankIcon(_ size: CGSize) -> CGFloat { small(size) ? 64 : 84 }
    static func small(_ size: CGSize) -> Bool { TemplateLibraryView.narrow(size) || TemplateLibraryView.short(size) }

    private var margin: CGFloat { TemplateLibraryView.margin(for: size) }
    private var narrow: Bool { TemplateLibraryView.narrow(size) }
    private var width: CGFloat { size.width - margin * 2 }

    /// The front page's lead (Emil, 11 November 2026: "replace the big banner with the search bar
    /// ... centered, nice, takes up space", then "too many rows"): two rows, a question and a wide
    /// field close under it, the placeholder an example. The shelves under them are the picking.
    static let question = "What do you want to track, plan or write?"
    static let searchPrompt = "Running, meeting notes, a trip to Lisbon"
    /// The field's height, and the widest the field and the question's column get.
    static let fieldHeight: CGFloat = 52
    static let column: CGFloat = 640
    /// The field's shape, filled and outlined.
    static let fieldShape = Capsule(style: .circular)
    /// Room over the question, under the bar; between the question and the field, close; and air
    /// between the field and the first shelf's heading (which brings its own shelfGap).
    static func overQuestion(_ size: CGSize) -> CGFloat { small(size) ? 20 : 48 }
    static func overField(_ size: CGSize) -> CGFloat { small(size) ? 14 : 18 }
    static func underField(_ size: CGSize) -> CGFloat { small(size) ? 4 : 12 }

    // MARK: What shows

    /// The front page's three states: its shelves; what Search found; or nothing found.
    enum Showing: Equatable { case front, results([TemplateAsk.Answer]), none }
    static func showing(_ query: String, in entries: [TemplateCatalog.Entry]) -> Showing {
        // Nothing typed yet, or only words that say nothing ("my", "a"): the shelves stay.
        guard !TemplateAsk.tokens(query).filter({ !TemplateAsk.stop.contains($0) }).isEmpty else { return .front }
        let answers = TemplateAsk.answers(query, in: entries)
        if !answers.isEmpty { return .results(answers) }
        // A letter or two that starts nothing is still being typed.
        return TemplateAsk.cleaned(query).count >= 3 ? .none : .front
    }
    private var showing: Showing { Self.showing(query, in: catalog.entries) }

    /// The order the keys walk: what Search found, or the shelves', left to right.
    static func order(_ query: String, catalog: TemplateCatalog, front: TemplateFront = .shipped) -> [TemplateCatalog.Entry] {
        if case .results(let answers) = showing(query, in: catalog.entries) { return answers.map(\.entry) }
        return front.order(for: catalog)
    }

    /// The words typed in Search that a template's ask carries (none for one you have).
    private func words(_ e: TemplateCatalog.Entry) -> String { held(e) == nil ? TemplateAsk.carried(query, for: e) : "" }

    // MARK: What a row's button does

    /// A row's button follows the state, as the page's does: Make with your AI; with no AI that
    /// opens with the ask, or while sync is away, Add; Open for one you have.
    enum Primary: Equatable { case make, add, open }
    static func primary(ai: SetupCards.AI, reach: SyncEngine.Reach, have: String?) -> Primary {
        switch TemplateLibraryView.mode(ai: ai, reach: reach, have: have) {
        case .have: .open
        case .make: .make
        case .plain: .add
        }
    }
    static func title(_ p: Primary, app: Bool, ai: SetupCards.AI, row: Bool = false) -> String {
        switch p {
        case .make: row ? "Make" : "Make with \(ai.name)"
        case .add: row ? "Add" : app ? "Add the app" : "Add the note"
        case .open: row ? "Open" : "Open your note"
        }
    }
    static func working(_ p: Primary) -> String { p == .open ? "Opening\u{2026}" : "Adding\u{2026}" }
    /// A row's button is as wide for Make, Add and Open: the title's room inside its padding.
    static let pillLeast: CGFloat = 36
    static let pillWidth: CGFloat = pillLeast + ButtonSize.compact.padding * 2

    /// Make with the AI (the typed words in its ask), or what it adds; Open for one you have opens
    /// the note and no AI. The button says what it's doing meanwhile; the library closes on the note.
    private func make(_ e: TemplateCatalog.Entry) {
        guard working == nil else { return }
        let p = Self.primary(ai: ai, reach: reach, have: held(e))
        working = e.slug
        let with: SetupCards.AI = p == .open ? .other : ai
        let typed = words(e)
        act(e, with, with.asks && !typed.isEmpty ? TemplateAsk.ask(e, words: typed).text : nil)
        release()
    }

    private func blank(with: SetupCards.AI) {
        guard working == nil, let makeBlank else { return }
        working = "blank"
        makeBlank(query, with)
        release()
    }

    /// The library closes on the new note; if it's still here after a while, the button comes back.
    private func release() {
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(4))
            working = nil
        }
    }

    /// The state-following button, small, in a row.
    private func pill(_ e: TemplateCatalog.Entry) -> some View {
        let p = Self.primary(ai: ai, reach: reach, have: held(e))
        return TemplateButton(title: Self.title(p, app: e.app, ai: ai, row: true), look: .quiet,
                              working: working == e.slug ? Self.working(p) : nil, least: Self.pillLeast, id: "templates.get.\(e.slug)") { make(e) }
            .accessibilityLabel("\(Self.title(p, app: e.app, ai: ai)): \(e.title)")
    }

    // MARK: The page

    /// One scroll view under the bar: the question and the field at its top, and under them the
    /// shelves or, once something is typed, what Search found. The field is the same view whatever
    /// shows under it, so it keeps the keys and its place while what's typed changes what shows.
    var body: some View {
        TemplateProbe.hit("front")
        return ScrollViewReader { scroller in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    asked
                        .id("asked")
                    switch showing {
                    case .front: shelves
                    case .results(let answers): results(answers)
                    case .none: noMatch
                    }
                }
                .padding(.horizontal, margin)
                .padding(.top, Self.pageTop)
                .padding(.bottom, margin)
            }
            .scrollPosition($frontAt)
            .onScrollGeometryChange(for: Bool.self, of: { Self.under($0, first: Self.pageTop) }) { [under] _, now in under.now = now }
            .onScrollGeometryChange(for: CGFloat.self, of: { $0.contentOffset.y + $0.contentInsets.top }) { [offsets] _, y in offsets.search = y }
            .onChange(of: focused) { _, e in
                guard let e, case .front = showing else { return }
                let id = frontID(e)
                if reduceMotion { scroller.scrollTo(id, anchor: .center) } else { withAnimation(.snappy(duration: 0.2)) { scroller.scrollTo(id, anchor: .center) } }
            }
        }
        .modifier(HeaderBand(under: under, height: TemplateLibraryView.topRow(for: size)) { bar })
        // What's typed changes what shows: back to the field if the page was scrolled away from it.
        .onChange(of: query) { _, _ in
            if offsets.search > 0.5 { frontAt.scrollTo(edge: .top) }
            askOpen = false
        }
        // ⌘F: to the field, wherever the page is.
        .background {
            Button("") { toField() }.keyboardShortcut("f", modifiers: .command).hidden().accessibilityHidden(true)
        }
    }

    /// The keys to the field, and the page back to it.
    private func toField() {
        guard !covered else { return }
        keys.wrappedValue = .search
        if offsets.search > 0.5 { frontAt.scrollTo(edge: .top) }
    }

    /// The top row. At rest only the close x: the question leads. Once the page is under the bar
    /// it has the system's band (HeaderBand) and the sheet's name.
    private var bar: some View {
        let named = under.now
        return HStack(spacing: 14) {
            Text(TemplateLibraryWords.title).font(.system(size: TemplateType.heading, weight: .bold)).foregroundStyle(Color.ink)
                .fixedSize()
                .opacity(named ? 1 : 0)
                .accessibilityHidden(!named)
                .accessibilityAddTraits(.isHeader)
                .animation(.easeOut(duration: 0.15), value: named)
            Spacer(minLength: 0)
            // Esc is this x's while the front page shows; on a page it's Back's.
            CardCloseButton(cancels: !covered, action: close)
        }
        .frame(height: TemplateLibraryView.controls)
        .padding(.horizontal, margin)
        .padding(.top, margin)
    }

    /// The question and the field close under it, centred: the same place whatever shows under them.
    private var asked: some View {
        VStack(spacing: 0) {
            Text(Self.question)
                .font(.system(size: TemplateType.hero, weight: .bold)).foregroundStyle(Color.ink)
                .lineLimit(1).minimumScaleFactor(0.8)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("templates.question")
            search
                .frame(width: min(Self.column, width))
                .padding(.top, Self.overField(size))
        }
        .frame(width: width)
        .padding(.top, Self.overQuestion(size))
    }

    /// The field: wide and tall, Settings' soft fill and hairline (so it shows on the ground in
    /// the dark), the caret in it when the library opens.
    private var search: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass").font(.system(size: 17, weight: .medium)).foregroundStyle(SettingsInk.muted)
                .accessibilityHidden(true)
            TextField(Self.searchPrompt, text: $query, prompt: Text(Self.searchPrompt).foregroundStyle(SettingsInk.muted)).textFieldStyle(.plain)
                .font(.system(size: TemplateType.heading))
                .foregroundStyle(Color.ink)
                .focusEffectDisabled()
                .focused(keys, equals: .search)
                .onSubmit(submit)
                .accessibilityLabel(Self.question)
                .accessibilityIdentifier("templates.search")
                // Esc clears what's typed, and only then closes, as a Mac search field does.
                .onKeyPress(.escape) {
                    guard !query.isEmpty else { return .ignored }
                    query = ""
                    return .handled
                }
            if !query.isEmpty {
                Button { query = ""; keys.wrappedValue = .search } label: {
                    Image(systemName: "xmark.circle.fill").font(.system(size: 16)).foregroundStyle(Color.muted.opacity(0.8))
                        .frame(width: 24, height: 24)
                        .contentShape(.rect)
                }
                .buttonStyle(.quietIcon)
                .accessibilityLabel(TemplateLibraryWords.clear)
                .accessibilityIdentifier("templates.clear")
            }
        }
        .padding(.leading, 18)
        .padding(.trailing, 12)
        .frame(height: Self.fieldHeight)
        // One shape for the fill and its hairline: a stroked Capsule drew its ends flatter than the
        // filled one, a short line standing off each end of the field (12 November 2026).
        .background(SettingsInk.group, in: Self.fieldShape)
        .overlay(Self.fieldShape.strokeBorder(SettingsInk.hairline, lineWidth: 0.5))
    }

    /// The shelves under the field, at their own sizes.
    private var shelves: some View {
        let shelves = front.shelves(for: catalog)
        return VStack(alignment: .leading, spacing: 0) {
            ForEach(shelves.indices, id: \.self) { i in
                shelf(shelves[i].shelf, shelves[i].entries)
            }
        }
        .padding(.top, Self.underField(size))
    }

    /// Where a template is on the front page, for the keys' ring to bring it into view.
    private func frontID(_ e: TemplateCatalog.Entry) -> String {
        front.shelves.contains { $0.kind == .apps && $0.slugs.contains(e.slug) } ? "app.\(e.slug)" : e.slug
    }

    /// The ring the arrow keys put on a card.
    @ViewBuilder private func ring(_ e: TemplateCatalog.Entry, radius: CGFloat) -> some View {
        if focused == e {
            RoundedRectangle(cornerRadius: radius + 3, style: .continuous).strokeBorder(Color.paneAccent, lineWidth: 2.5).padding(-3)
                .allowsHitTesting(false)
        }
    }

    /// A shelf: its heading, under it the line saying why it's there, and its cards.
    private func shelf(_ shelf: TemplateFront.Shelf, _ entries: [TemplateCatalog.Entry]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(shelf.title).font(.system(size: TemplateType.heading, weight: .bold)).foregroundStyle(Color.ink)
                .lineLimit(1)
                .frame(height: 24, alignment: .bottomLeading)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("templates.\(shelf.id)")
            Text(shelf.line).font(.system(size: TemplateType.line)).foregroundStyle(Color.muted)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, Self.headingLine)
            Group {
                switch shelf.kind {
                case .covers: across(entries, columns: 3) { e, w in coverCard(e, width: w) }
                case .apps: across(entries, columns: 2) { e, w in appCard(e, width: w) }
                case .rows: rows(entries, columns: narrow ? 2 : 3, width: width)
                }
            }
            .padding(.top, Self.headingGap(size))
        }
        .frame(width: width, alignment: .leading)
        .padding(.top, Self.shelfGap(size))
        .id(shelf.id)
    }

    /// Cards in rows of `columns`, each an even share of the page's width.
    private func across(_ entries: [TemplateCatalog.Entry], columns: Int, @ViewBuilder card: @escaping (TemplateCatalog.Entry, CGFloat) -> some View) -> some View {
        let cw = ((width - Self.gap * CGFloat(columns - 1)) / CGFloat(columns)).rounded(.down)
        let lines = stride(from: 0, to: entries.count, by: columns).map { Array(entries[$0..<min($0 + columns, entries.count)]) }
        return VStack(alignment: .leading, spacing: Self.gap + 4) {
            ForEach(lines.indices, id: \.self) { i in
                HStack(alignment: .top, spacing: Self.gap) {
                    ForEach(lines[i]) { e in card(e, cw) }
                }
            }
        }
    }

    private func coverCard(_ e: TemplateCatalog.Entry, width w: CGFloat) -> some View {
        EditorialCoverCard(entry: e, width: w, line: TemplateLibraryWords.line(e), pointer: { point(e, $0) }) { open(e) }
            .overlay(alignment: .top) { ring(e, radius: 14).frame(height: EditorialCover.art(w)) }
            .id(e.slug)
    }

    private func appCard(_ e: TemplateCatalog.Entry, width w: CGFloat) -> some View {
        EditorialAppCard(entry: e, width: w, line: TemplateLibraryWords.line(e), picture: TemplateArt.card(e, dark: scheme == .dark),
                         pointer: { point(e, $0) }) { open(e) }
            .overlay(alignment: .top) { ring(e, radius: 14).frame(height: EditorialAppCard.sizes(w).height) }
            .id("app.\(e.slug)")
    }

    /// A compact list: a small cover, the name and a line, in columns. No lines between rows:
    /// each has its own wash under the pointer. A row opens the template's page.
    private func rows(_ entries: [TemplateCatalog.Entry], columns: Int, width w: CGFloat, why: [String: String] = [:]) -> some View {
        let cw = ((w - Self.gap * CGFloat(columns - 1)) / CGFloat(columns)).rounded(.down)
        let lines = stride(from: 0, to: entries.count, by: columns).map { Array(entries[$0..<min($0 + columns, entries.count)]) }
        return VStack(alignment: .leading, spacing: 0) {
            ForEach(lines.indices, id: \.self) { i in
                HStack(alignment: .top, spacing: Self.gap - 16) {
                    ForEach(lines[i]) { e in row(e, width: cw, why: why[e.slug]) }
                }
            }
        }
        // Each cover on the page's measure; a row's wash reaches 8 pt past it.
        .padding(.horizontal, -8)
    }

    /// A row. At rest it is its cover, its name and its line and nothing else; under the pointer,
    /// or with the keys on it, its button shows at its right (Make, Add or Open).
    private func row(_ e: TemplateCatalog.Entry, width w: CGFloat, why: String? = nil) -> some View {
        EditorialRow(entry: e, width: w, line: why ?? TemplateLibraryWords.line(e), lines: why == nil ? 1 : 2,
                     keys: focused == e, pointer: { point(e, $0) }, action: { open(e) }) { pill(e) }
            .overlay { ring(e, radius: 14) }
            .id(e.slug)
    }

    // MARK: Search

    /// What Search found, best first: rows in the front page's own style, each with the line
    /// saying why it answers what was typed, and in the last place the way on when none of them
    /// is it. A row opens the template's page.
    private func results(_ answers: [TemplateAsk.Answer]) -> some View {
        let columns = narrow ? 1 : 2
        return VStack(alignment: .leading, spacing: 0) {
            Text(answers.count == 1 ? "1 template for \u{201C}\(TemplateAsk.cleaned(query))\u{201D}"
                                    : "\(answers.count) templates for \u{201C}\(TemplateAsk.cleaned(query))\u{201D}")
                .font(.system(size: TemplateType.heading, weight: .bold)).foregroundStyle(Color.ink)
                .lineLimit(1)
                .frame(height: 24)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("templates.results")
            resultsGrid(answers, columns: columns)
                .padding(.top, 10)
        }
        .frame(width: width, alignment: .leading)
        .padding(.top, Self.resultsTop)
    }

    /// A result's row with its two lines of why.
    static let resultRow: CGFloat = 68

    private func resultsGrid(_ answers: [TemplateAsk.Answer], columns: Int) -> some View {
        let cw = ((width - Self.gap * CGFloat(columns - 1)) / CGFloat(columns)).rounded(.down)
        let slots: [TemplateAsk.Answer?] = answers.map { $0 } + (makeBlank == nil ? [] : [nil])
        let lines = stride(from: 0, to: slots.count, by: columns).map { Array(slots[$0..<min($0 + columns, slots.count)]) }
        return VStack(alignment: .leading, spacing: 0) {
            ForEach(lines.indices, id: \.self) { i in
                HStack(alignment: .top, spacing: Self.gap - 16) {
                    ForEach(lines[i].indices, id: \.self) { j in
                        if let a = lines[i][j] {
                            row(a.entry, width: cw, why: a.why).frame(minHeight: Self.resultRow, alignment: .top)
                        } else {
                            blankRow(width: cw).padding(8)
                        }
                    }
                }
            }
        }
        .padding(.horizontal, -8)
    }

    /// Beside the matches: a new note for the words, when none of them is it.
    private func blankRow(width w: CGFloat) -> some View {
        HStack(spacing: 12) {
            blankTile(Self.rowCover)
            VStack(alignment: .leading, spacing: 2) {
                Text(TemplateAsk.blankRow(query)).font(.system(size: TemplateType.item, weight: .semibold)).foregroundStyle(Color.ink).lineLimit(1)
                Text(TemplateAsk.blankRowLine(ai)).font(.system(size: TemplateType.line)).foregroundStyle(Color.muted).lineLimit(1)
            }
            Spacer(minLength: 12)
            TemplateButton(title: TemplateAsk.blankButton(ai, online: reach == .online), look: .quiet,
                           working: working == "blank" ? Self.working(.add) : nil, id: "templates.blank.row") { blank(with: ai) }
        }
        .frame(width: w, alignment: .leading)
        .accessibilityElement(children: .contain)
    }

    private func blankTile(_ side: CGFloat) -> some View {
        Image(systemName: "square.and.pencil").font(.system(size: side * 0.38, weight: .medium)).foregroundStyle(Color.muted)
            .frame(width: side, height: side)
            .background(Color.primary.opacity(scheme == .dark ? 0.12 : 0.06), in: .rect(cornerRadius: (side * 0.225).rounded(), style: .continuous))
            .accessibilityHidden(true)
    }

    /// Nothing matches: a new note named from the words, said in four things near the top. What
    /// it's called, what happens, where it goes and the button; the whole ask is behind one line.
    private var noMatch: some View {
        let title = TemplateAsk.blankTitle(query)
        let asks = ai.asks && reach == .online
        let c = TemplateAsk.blankCaption(ai, folder: folder, reach: reach)
        return VStack(alignment: .leading, spacing: 0) {
            Text(TemplateAsk.none(query)).font(.system(size: TemplateType.line)).foregroundStyle(Color.muted)
                .accessibilityIdentifier("templates.none")
            if makeBlank != nil {
                HStack(alignment: .top, spacing: 16) {
                    blankTile(Self.blankIcon(size))
                    VStack(alignment: .leading, spacing: 0) {
                        Text(title).font(.system(size: TemplateType.hero, weight: .bold)).foregroundStyle(Color.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                            .accessibilityAddTraits(.isHeader)
                        Text("New note").font(.system(size: TemplateType.line)).foregroundStyle(Color.muted)
                            .padding(.top, 1)
                        Text(TemplateAsk.blankLine(ai)).font(.system(size: TemplateType.line)).foregroundStyle(Color.ink)
                            .padding(.top, 5)
                    }
                }
                .padding(.top, 14)
                HStack(spacing: 8) {
                    TemplateButton(title: TemplateAsk.blankButton(ai, online: reach == .online), ai: asks ? ai : nil, look: .primary,
                                   working: working == "blank" ? Self.working(.add) : nil, isDefault: !covered, id: "templates.blank.make") { blank(with: ai) }
                    if asks {
                        TemplateButton(title: TemplateAsk.blankMyself, look: .quiet, id: "templates.blank.myself") { blank(with: .other) }
                    }
                    folderLine(c).padding(.leading, 6)
                }
                .padding(.top, 16)
                if ai.asks {
                    disclosure(TemplateLibraryWords.asked(ai, sent: asks), TemplateAsk.blankAsk(query))
                        .padding(.top, 12)
                } else if let connect {
                    Button(TemplateLibraryWords.connect, action: connect).buttonStyle(.textLink)
                        .padding(.top, 12)
                        .accessibilityIdentifier("templates.connect")
                }
            }
            Button("Or look through all \(catalog.entries.count) templates") { query = ""; keys.wrappedValue = .search }
                .buttonStyle(.textLink)
                .font(.system(size: TemplateType.line))
                .padding(.top, 14)
                .accessibilityIdentifier("templates.seeAll")
        }
        .frame(width: width, alignment: .leading)
        .padding(.top, Self.resultsTop)
    }

    /// A quiet line that opens to the whole ask under it: its label, and a chevron.
    private func disclosure(_ label: String, _ ask: TemplateAsk.Ask) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Button { askOpen.toggle() } label: {
                HStack(spacing: 5) {
                    Text(label)
                    Image(systemName: "chevron.down").font(.system(size: 9, weight: .bold)).rotationEffect(.degrees(askOpen ? 180 : 0))
                }
            }
            .buttonStyle(.quiet)
            .padding(.leading, -QuietButtonStyle.inset)
            .accessibilityIdentifier("templates.ask.open")
            if askOpen { askText(ask) }
        }
    }

    /// The ask, whole, as it's sent: quoted, quiet, the person's own words in ink.
    private func askText(_ ask: TemplateAsk.Ask) -> some View {
        (Text("\u{201C}\(ask.lead)") + Text(ask.words ?? "").foregroundStyle(Color.ink) + Text("\(ask.rest)\u{201D}"))
            .font(.system(size: TemplateType.line)).foregroundStyle(Color.muted)
            .lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: 760, alignment: .leading)
            .textSelection(.enabled)
            .accessibilityIdentifier("templates.ask")
    }

    /// A folder's name in a line: whole, on two lines if it must, up to 44 letters; a longer one
    /// keeps whole words from its start and from its end around "…", never half a word
    /// ("Everything f…ove in March").
    static func shownFolder(_ name: String) -> String {
        guard name.count > 44 else { return name }
        let words = name.split(separator: " ").map(String.init)
        var head: [String] = [], tail: [String] = []
        for w in words {
            guard (head + [w]).joined(separator: " ").count <= 20 else { break }
            head.append(w)
        }
        for w in words.reversed() {
            guard ([w] + tail).joined(separator: " ").count <= 20 else { break }
            tail.insert(w, at: 0)
        }
        guard !head.isEmpty, !tail.isEmpty, head.count + tail.count < words.count else { return TemplateLibraryView.shownFolder(name) }
        return head.joined(separator: " ") + " \u{2026} " + tail.joined(separator: " ")
    }

    /// "Adds an empty note to (folder) Notes, then opens ChatGPT.": the folder's mark stays with
    /// its name, and a long name keeps its start and its end (its help tag has all of it).
    private func folderLine(_ c: (lead: String, folder: String, rest: String)) -> some View {
        (Text(c.lead) + Text(Image(systemName: "folder")).foregroundStyle(Color.paneAccent.opacity(0.85))
            + Text("\u{202F}\(Self.shownFolder(c.folder))").foregroundStyle(Color.ink) + Text(c.rest))
            .font(.system(size: TemplateType.line)).foregroundStyle(Color.muted)
            .lineLimit(2)
            .fixedSize(horizontal: false, vertical: true)
            .help(c.folder)
            .accessibilityIdentifier("templates.caption")
    }
}

/// What a card on the front page does under the pointer: a quiet ring and its picture a touch
/// deeper or brighter, as the gallery's covers did. Nothing lifts or moves.
private struct CardHover: ViewModifier {
    let over: Bool
    let radius: CGFloat
    @Environment(\.colorScheme) private var scheme

    func body(content: Content) -> some View {
        let _ = TemplateProbe.hit("hover")
        let dark = scheme == .dark
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        content
            .brightness(SetupTemplateCard.quietBrightness(dark: dark, hover: over))
            .overlay(shape.strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5))
            .overlay(shape.strokeBorder((dark ? Color.white : Color.black).opacity(SetupTemplateCard.quietRing(dark: dark, hover: over)), lineWidth: 1.5))
    }
}

/// The header over a scrolling page, as the notes list's toolbar edge (measured 7 November 2026:
/// one frosted band, a hairline under the bar). The page passes under the bar: the bar's room is
/// the page's top inset, and the bar lies over it, its band reaching `bandBelow` under the
/// controls. At rest, with nothing under it, there's no band and no line, as in Notes; once the
/// page scrolls under it, the bar has the system's bar material and a 1 px hairline in the
/// separator colour. Built, not the system's scroll edge: in this sheet a `safeAreaBar` drew a
/// hairline with nothing under the bar too (offscreen, 10 November 2026).
private struct HeaderBand<Bar: View>: ViewModifier {
    let under: TemplateFrontPage.Under
    /// The bar's height: the sheet's margin over its row of controls.
    let height: CGFloat
    @ViewBuilder let bar: () -> Bar
    @Environment(\.displayScale) private var scale

    func body(content: Content) -> some View {
        let _ = TemplateProbe.hit("band")
        let under = under.now
        content
            .safeAreaPadding(.top, height)
            .scrollEdgeEffectHidden(true, for: .top)
            .overlay(alignment: .top) {
                bar()
                    .frame(maxWidth: .infinity)
                    // The band's air under the controls: empty, and at rest it has nothing in it
                    // that takes a click (a view at no opacity takes none).
                    .padding(.bottom, TemplateFrontPage.bandBelow)
                    .background { Rectangle().fill(.bar).opacity(under ? 1 : 0).accessibilityHidden(true) }
                    .overlay(alignment: .bottom) {
                        Rectangle().fill(Color(nsColor: .separatorColor)).frame(height: 1 / scale).opacity(under ? 1 : 0).accessibilityHidden(true)
                    }
                    .animation(.easeOut(duration: 0.15), value: under)
            }
    }
}

/// The cover card's measures: its art is 0.7 of its width; under it 10 pt, then the name (one
/// line at the item size) and its line (the secondary size), 2 pt apart.
enum EditorialCover {
    static func art(_ width: CGFloat) -> CGFloat { (width * 0.7).rounded() }
    static let words: CGFloat = 10 + 18 + 2 + 16
    static func height(width: CGFloat) -> CGFloat { art(width) + words }
}

/// The first of the page's two cards: a large cover, and under it the name and one line, on the
/// sheet's own ground. It opens the template's page.
private struct EditorialCoverCard: View {
    let entry: TemplateCatalog.Entry
    let width: CGFloat
    let line: String
    var pointer: (Bool) -> Void = { _ in }
    let action: () -> Void
    @State private var hover = false
    @Environment(\.hoverPreview) private var preview

    var body: some View {
        let _ = TemplateProbe.hit("card")
        let over = hover || preview.contains("templates.\(entry.slug)")
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                TemplateArt.tile(entry, width: width, height: EditorialCover.art(width), radius: 14)
                    .modifier(CardHover(over: over, radius: 14))
                EditorialNameAndLine(name: entry.title, line: line)
                    .padding(.horizontal, 2)
            }
            .frame(width: width, alignment: .leading)
            .contentShape(.rect)
        }
        .buttonStyle(CardPress())
        .onHover { h in
            withAnimation(.smooth(duration: 0.15)) { hover = h }
            pointer(h)
        }
        .accessibilityLabel("\(entry.title). \(line)")
        .accessibilityIdentifier("templates.\(entry.slug)")
    }
}

/// An item's two levels of words, the same on every card and row: its name, and one line.
private struct EditorialNameAndLine: View {
    let name: String
    let line: String
    var lines = 1
    var app = false

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(name).font(.system(size: TemplateType.item, weight: .semibold)).foregroundStyle(Color.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.9)
            HStack(alignment: .firstTextBaseline, spacing: SetupTemplateCard.markGap) {
                if app { AppMarkView(size: SetupTemplateCard.markSize) }
                Text(line).font(.system(size: TemplateType.line)).foregroundStyle(Color.muted)
                    .lineLimit(lines)
                    .minimumScaleFactor(0.92)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .multilineTextAlignment(.leading)
    }
}

/// The cover card for an app: the same large cover with the name and one line under it, and
/// beside the cover, second, a picture of the app in use. The picture is drawn small (its
/// largest figure is smaller than the card's name), ends cleanly (its whole blocks, without the
/// app's own tabs) and carries no label: the template's page says it's an example.
private struct EditorialAppCard: View {
    let entry: TemplateCatalog.Entry
    let width: CGFloat
    let line: String
    let picture: NSImage?
    var pointer: (Bool) -> Void = { _ in }
    let action: () -> Void
    @State private var hover = false
    @Environment(\.hoverPreview) private var preview
    @Environment(\.colorScheme) private var scheme

    static let between: CGFloat = 10
    /// The cover and the picture share the card's width; both are as tall as the picture's shape.
    static func sizes(_ width: CGFloat) -> (cover: CGFloat, picture: CGFloat, height: CGFloat) {
        let picture = ((width - between) * 0.51).rounded()
        return (width - between - picture, picture, (picture * TemplateArt.cardShape).rounded(.down))
    }

    var body: some View {
        let _ = TemplateProbe.hit("card")
        let over = hover || preview.contains("templates.\(entry.slug)")
        let ground: Color = scheme == .dark ? .black : .white
        let s = Self.sizes(width)
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: Self.between) {
                    TemplateArt.tile(entry, width: s.cover, height: s.height, radius: 14)
                        .modifier(CardHover(over: over, radius: 14))
                    ground
                        .frame(width: s.picture, height: s.height)
                        .overlay(alignment: .top) {
                            if let picture {
                                Image(nsImage: picture).resizable().interpolation(.high)
                                    .frame(width: s.picture, height: (s.picture * TemplateArt.cardDrawn.height / TemplateArt.cardDrawn.width).rounded())
                            }
                        }
                        .clipShape(.rect(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5))
                        .accessibilityHidden(true)
                }
                EditorialNameAndLine(name: entry.title, line: line)
                    .padding(.horizontal, 2)
            }
            .frame(width: width, alignment: .leading)
            .contentShape(.rect)
        }
        .buttonStyle(CardPress())
        .onHover { h in
            withAnimation(.smooth(duration: 0.15)) { hover = h }
            pointer(h)
        }
        .accessibilityLabel("\(entry.title). App. \(line)")
        .accessibilityIdentifier("templates.app.\(entry.slug)")
    }
}

/// The second of the page's two cards: a row. A small cover, the name and one line. No button at
/// rest: the row opens the template's page. Under the pointer, or with the keys on it, its quick
/// button shows at its right, in room kept for it, so nothing in the row moves.
private struct EditorialRow<Pill: View>: View {
    let entry: TemplateCatalog.Entry
    let width: CGFloat
    let line: String
    var lines = 1
    /// The arrow keys are on it.
    var keys = false
    var pointer: (Bool) -> Void = { _ in }
    let action: () -> Void
    @ViewBuilder let pill: () -> Pill
    @State private var hover = false
    @Environment(\.hoverPreview) private var preview

    var body: some View {
        let _ = TemplateProbe.hit("card")
        let over = hover || keys || preview.contains("templates.\(entry.slug)")
        Button(action: action) {
            HStack(spacing: 0) {
                TemplateArt.tile(entry, width: TemplateFrontPage.rowCover, height: TemplateFrontPage.rowCover, radius: 10)
                    .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(Color.primary.opacity(0.12), lineWidth: 0.5))
                    .padding(.trailing, 12)
                EditorialNameAndLine(name: entry.title, line: line, lines: lines, app: entry.app)
                Spacer(minLength: 8)
                // The quick button's room.
                Color.clear.frame(width: TemplateFrontPage.pillWidth, height: ButtonSize.compact.height)
            }
            .padding(8)
            .frame(width: width + 16, alignment: .leading)
            .contentShape(.rect)
        }
        .buttonStyle(.tile(radius: 14))
        .overlay(alignment: .trailing) { if over { pill().padding(.trailing, 8) } }
        .onHover { h in
            hover = h
            pointer(h)
        }
        .accessibilityIdentifier("templates.\(entry.slug)")
    }
}
#endif
