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
        func appPicture(dark: Bool, small: Bool = false) -> NSImage? {
            guard app, let url = Bundle.main.url(forResource: "template-app-\(slug)-stage\(small ? "-small" : "")-\(dark ? "dark" : "light")", withExtension: "jpg") else { return nil }
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

enum TemplateLibraryWords {
    static let title = "Templates"
    static let line = "Notes and small apps your AI fills in and keeps up to date."
    static func make(_ ai: SetupCards.AI) -> String { ai.asks ? "Make with \(ai.name)" : "Add the note" }
    static let another = "Make with another AI"
    static let copy = "Copy Prompt"
    static let copied = "Copied"
    /// What Make does, over the ask it sends: said once, where the ask is, ending on the ask
    /// (council round 2: it ended on "with", in a heading's weight).
    static func opensWith(_ ai: SetupCards.AI) -> String { ai.asks ? "Adds the note, then asks \(ai.name):" : "Adds the note. Then ask your AI:" }
    static let clear = "Clear Search"
    /// No match, in the words a Mac search uses.
    static func none(_ q: String) -> String { "No Results for \u{201C}\(q)\u{201D}" }
    static let noneHint = "Check the spelling or try a new search."
    /// Beside the open template's name when nothing matches the search.
    static let kept = "Previously selected"
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

    /// The template's note is added (as the setup gallery and the website add it), the ask goes on
    /// the clipboard, and ChatGPT or Claude opens with it. Returns the new note, to open.
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
        copy(SetupCards.prompt(e.pick))
        if let page = SetupCards.page(ai, e.pick) { open(page) }
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

/// Every template, in a sheet over the notes (a quick visit, like Settings: Esc goes back).
/// One template is always open on the right, as it looks in use: the note your AI filled in, or
/// the app. The grid beside it keeps its width, so picking a card never moves the others
/// (Emil, 8 November 2026: the cards jumped from five across to three on the first click).
struct TemplateLibraryView: View {
    var catalog = TemplateCatalog.shipped
    /// Your connected AIs, the one you used last first: Make uses the first, or the one picked
    /// from the arrow beside it.
    var ais: [SetupCards.AI] = [.chatgpt]
    /// The template that's open; nil opens the first one shown.
    @State var open: TemplateCatalog.Entry?
    var make: (TemplateCatalog.Entry, SetupCards.AI) -> Void = { _, _ in }
    var close: () -> Void = {}
    /// Captures: the kind picked and what's typed in Search.
    @State var filter = "All"
    @State var query = ""
    @State private var picked: SetupCards.AI?
    private var ai: SetupCards.AI { picked ?? ais.first ?? .other }
    @State private var copied = false
    /// The grid's measured row, inside the scroll bar.
    @State private var row: CGFloat = 0
    /// The sheet's size, fitted to the window it's on.
    @State var size = Self.size
    @FocusState private var searching: Bool
    @Environment(\.colorScheme) private var scheme
    @Environment(\.inSheet) private var inSheet

    static let size = CGSize(width: 1040, height: 680)
    static let gap: CGFloat = 16

    /// The open template's panel: narrower on a small sheet, so the grid keeps two columns there
    /// instead of one card blown up to 231 pt (council, 8 November 2026).
    static func panel(for size: CGSize) -> CGFloat { size.width < 900 ? 360 : 440 }
    /// The stage the template shows on, above its name: a set height, so nothing under it moves
    /// from one template to the next.
    /// A small sheet hides the subtitle and gives its room to the stage (council round 2). The big
    /// stage takes the panel's spare height, so the words under it sit together (council round 3:
    /// 45 to 75 pt of nothing between the description and the ask).
    /// A sheet between the two sizes keeps 356 pt for the header and the words, so the buttons
    /// are never cut.
    static func stage(for size: CGSize) -> CGFloat { size.height <= 560 ? 172 : min(324, size.height - 356) }
    /// A small sheet: the panel's words at a smaller size, so all of them fit.
    static func small(_ size: CGSize) -> Bool { size.height <= 560 }
    private var panel: CGFloat { Self.panel(for: size) }

    /// The sheet's size on a window: the full size where it fits, never wider or taller than the
    /// window less a margin, and never so small the open template loses its buttons.
    static func size(on window: CGSize) -> CGSize {
        CGSize(width: min(size.width, max(720, window.width - 80)), height: min(size.height, max(500, window.height - 60)))
    }

    /// The template the arrow keys move to: one along for left and right, a row for up and down.
    static func step(_ shown: [TemplateCatalog.Entry], from open: TemplateCatalog.Entry?, by: Int) -> TemplateCatalog.Entry? {
        guard !shown.isEmpty else { return nil }
        guard let open, let i = shown.firstIndex(of: open) else { return shown.first }
        let to = i + by
        return shown.indices.contains(to) ? shown[to] : open
    }

    /// The template shown open: the one picked while it's in the list, otherwise the first. When
    /// nothing matches a search the last one stays open, so the panel never leaves and comes back
    /// (council, 8 November 2026: no match hid the panel, and clearing the search slid it in again).
    static func showing(_ shown: [TemplateCatalog.Entry], open: TemplateCatalog.Entry?) -> TemplateCatalog.Entry? {
        if let open, shown.contains(open) { return open }
        return shown.first ?? open
    }

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 20, style: .continuous)
        let shown = catalog.shown(filter: filter, query: query)
        let current = Self.showing(shown, open: open ?? catalog.entries.first)
        VStack(spacing: 0) {
            header
            Divider()
            HStack(spacing: 0) {
                if shown.isEmpty {
                    // Nothing matches: the message and the way back in the grid's place; the
                    // open template stays where it is.
                    VStack(spacing: 10) {
                        Image(systemName: "magnifyingglass").font(.system(size: 28, weight: .regular)).foregroundStyle(Color.muted)
                        Text(TemplateLibraryWords.none(query)).font(.system(size: 15, weight: .semibold)).foregroundStyle(Color.ink)
                            .multilineTextAlignment(.center)
                        Text(TemplateLibraryWords.noneHint).font(.system(size: 13)).foregroundStyle(Color.muted)
                            .multilineTextAlignment(.center)
                        Button(TemplateLibraryWords.clear) { query = ""; filter = "All" }
                            .buttonStyle(.secondary(.compact))
                            .padding(.top, 4)
                    }
                    .padding(24)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .accessibilityIdentifier("templates.none")
                } else {
                    grid(shown, current: current)
                }
                Divider()
                Group {
                    if let current { detail(current, kept: shown.isEmpty) } else { Color.clear }
                }
                .frame(width: panel)
                .frame(maxHeight: .infinity, alignment: .top)
                .clipped()
            }
            .frame(maxHeight: .infinity)
        }
        .frame(width: size.width, height: size.height)
        // In a sheet the sheet is the panel and macOS dims the window (popupSheet).
        .background { if !inSheet { shape.fill(SetupCards.ground).shadow(color: .black.opacity(0.2), radius: 30, y: 20) } }
        .clipShape(inSheet ? RoundedRectangle(cornerRadius: 0) : shape)
        .overlay { if !inSheet { shape.strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5) } }
        .onKeyPress(.upArrow) { move(shown, current, by: -columns); return .handled }
        .onKeyPress(.downArrow) { move(shown, current, by: columns); return .handled }
        .onKeyPress(.leftArrow) { guard !searching else { return .ignored }; move(shown, current, by: -1); return .handled }
        .onKeyPress(.rightArrow) { guard !searching else { return .ignored }; move(shown, current, by: 1); return .handled }
        .onAppear {
            if inSheet, let window = NSApp.mainWindow { size = Self.size(on: window.frame.size) }
            searching = true
        }
    }

    private var columns: Int {
        let r = row > 0 ? row : size.width - panel - 49
        let w = Self.cardWidth(row: r, gap: Self.gap)
        return max(1, Int((r + Self.gap) / (w + Self.gap)))
    }

    private func move(_ shown: [TemplateCatalog.Entry], _ current: TemplateCatalog.Entry?, by: Int) {
        guard let to = Self.step(shown, from: current, by: by), to != current else { return }
        open = to
        copied = false
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(TemplateLibraryWords.title).font(.system(size: 22, weight: .bold)).foregroundStyle(Color.ink)
                        .accessibilityAddTraits(.isHeader)
                    // A small sheet keeps its height for the template (council round 2: the
                    // header took 125 of 500 pt).
                    if !Self.small(size) {
                        Text(TemplateLibraryWords.line).font(.system(size: 13)).foregroundStyle(Color.muted)
                    }
                }
                Spacer(minLength: 16)
                CardCloseButton(action: close)
            }
            // Search sits on the kinds' row, away from the close x: the two x's were 36 pt apart
            // while searching (council, 8 November 2026).
            HStack(spacing: 12) {
                Picker("Kind", selection: $filter) {
                    ForEach(TemplateCatalog.filters, id: \.self) { Text(TemplateCatalog.label($0)).tag($0) }
                }
                .pickerStyle(.segmented)
                // As tall as Search and the buttons, 28 pt (it was 24 beside a 28 pt Search).
                .controlSize(.large)
                .labelsHidden()
                .fixedSize()
                Spacer(minLength: 0)
                search
            }
        }
        .padding(.horizontal, 24)
        .padding(.top, 22)
        .padding(.bottom, 16)
    }

    /// Search, focused when the library opens: type to narrow, Esc clears what's typed and only
    /// then closes, as a Mac search field does.
    private var search: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
            TextField("Search", text: $query).textFieldStyle(.plain)
                .focused($searching)
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
        .frame(minWidth: 160, maxWidth: 220)
        .frame(height: 28)
        .background(Color.primary.opacity(0.06), in: .rect(cornerRadius: 8, style: .continuous))
    }

    private func grid(_ shown: [TemplateCatalog.Entry], current: TemplateCatalog.Entry?) -> some View {
        GeometryReader { geo in
            // The row the cards really get: less than the pane when a mouse is attached and the
            // scroll bar takes its own room (the cards then left a column's gap).
            let width = Self.cardWidth(row: row > 0 ? row : geo.size.width - 48, gap: Self.gap)
            ScrollViewReader { scroller in
                ScrollView {
                    // 16 pt between rows as between columns (council round 2: the rows were 32 pt
                    // apart, since a grid takes no negative spacing, and the grid looked finished
                    // at six cards).
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: width, maximum: width), spacing: Self.gap, alignment: .top)], alignment: .leading, spacing: 0) {
                        ForEach(shown) { e in
                            SetupTemplateCard(pick: e.pick, width: width, selected: current == e) {
                                open = e
                                copied = false
                            }
                            // Half the gap above and below: the cell (what scrollTo finds) is the
                            // card and 8 pt either side; with the scroll view's 8 pt margin, a row
                            // brought to the top sits 16 pt under the header, one gap, so none of
                            // the row above shows.
                            .padding(.vertical, Self.gap / 2)
                            // Where each card is in the grid, kept without drawing again.
                            .onGeometryChange(for: CGRect.self, of: { $0.frame(in: .named(Self.space)) }) { [seen] in seen.cards[e.slug] = $0 }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .onGeometryChange(for: CGFloat.self, of: { $0.size.width }) { row = $0 }
                    .onGeometryChange(for: CGFloat.self, of: { $0.size.height }) { gridHeight = $0 }
                    .padding(.horizontal, 24)
                    .padding(.top, Self.rest - Self.gap / 2 - Self.margin)
                    .padding(.bottom, Self.bottom(visible: geo.size.height, grid: gridHeight, rows: (shown.count + columns - 1) / max(columns, 1)))
                    .coordinateSpace(.named(Self.space))
                }
                .safeAreaPadding(.vertical, Self.margin)
                .onScrollGeometryChange(for: CGRect.self, of: { $0.visibleRect }) { [seen] _, now in seen.visible = now }
                // The open card is always in full view: on opening, on every pick, arrow key,
                // kind and search (council, 8 November 2026: it was a 23 pt sliver, or off screen).
                // One already in view stays put; one that isn't brings its row to the top, where
                // the first row rests, never a sliver of the row above (council round 3).
                .onAppear {
                    guard let slug = current?.slug else { return }
                    reveal(slug, scroller)
                    DispatchQueue.main.async { reveal(slug, scroller, again: true) }
                }
                .onChange(of: current?.slug) { _, slug in
                    guard let slug else { return }
                    if open?.slug != slug { open = current }
                    reveal(slug, scroller, animated: true)
                }
                .onChange(of: filter) { if let slug = current?.slug { reveal(slug, scroller) } }
                // Again once the grid has its real width: a scroll before the first layout lands
                // on the card's estimated place, without its room.
                .onChange(of: row) { if let slug = current?.slug { reveal(slug, scroller, again: true) } }
            }
        }
        .frame(maxWidth: .infinity)
    }

    /// `again`: once more after layout, for a row already brought to the top, whose first scroll
    /// landed on the lazy grid's estimate of where it was.
    private func reveal(_ slug: String, _ scroller: ScrollViewProxy, animated: Bool = false, again: Bool = false) {
        let anchor = again && seen.topped == slug ? .top : Self.revealAnchor(cell: seen.cards[slug], visible: seen.visible)
        guard let anchor else { return }
        seen.topped = slug
        if animated { withAnimation(.snappy(duration: 0.2)) { scroller.scrollTo(slug, anchor: anchor) } } else { scroller.scrollTo(slug, anchor: anchor) }
    }

    /// Where the open card's row goes: nowhere when the card is already in view with 16 pt to
    /// spare, otherwise to the top. `cell` is the card's cell (the card and 8 pt above and below);
    /// a card not laid out yet (a lazy grid's) isn't in view.
    static func revealAnchor(cell: CGRect?, visible: CGRect) -> UnitPoint? {
        guard let cell, !visible.isEmpty else { return .top }
        let room = 16 - gap / 2
        return cell.minY - room >= visible.minY - 0.5 && cell.maxY + room <= visible.maxY + 0.5 ? nil : .top
    }

    /// Where the grid's cards are and what's in view, kept outside the view's state so scrolling
    /// never draws the library again.
    final class Seen { var cards: [String: CGRect] = [:]; var visible: CGRect = .zero; var topped: String? }
    @State private var seen = Seen()
    static let space = "templates.grid"

    /// Room kept around the open card when it's scrolled to: half the gap in its cell, and the
    /// scroll view's margin.
    static let clearance: CGFloat = gap / 2 + margin
    /// The scroll view's margin: a row brought to the top sits a gap (16 pt) under the header, so
    /// no sliver of the row above shows (council round 3: a 24 pt strip of cut captions).
    static let margin: CGFloat = 8
    /// Where the first row rests, under the header, before anything is scrolled.
    static let rest: CGFloat = 24
    /// Room under the last row, so the last cards never sit on the sheet's foot.
    static let foot: CGFloat = 35

    /// The grid's room under its last row: at least the foot, and as much more as lets the last
    /// rows come to the top like any other, so scrolled to its end the grid stops on a row, never
    /// on a sliver of the one above (council round 3). `grid` is the rows' height, cells included.
    static func bottom(visible: CGFloat, grid: CGFloat, rows: Int) -> CGFloat {
        let least = foot - gap / 2 - margin
        guard rows > 0, grid > 0, visible > 0 else { return least }
        let cell = grid / CGFloat(rows)
        let top = rest - gap / 2 - margin
        let natural = top + grid + least
        // All of it in view: nothing scrolls.
        guard natural > visible - margin * 2 else { return least }
        // The least content height that ends with a row at the top: scrolled to the end, row j's
        // cell sits at the top margin when the content is cell j's top less a margin, plus the view.
        for j in 0..<rows {
            let content = top + CGFloat(j) * cell - margin * 2 + visible
            if content >= natural - 0.5 { return least + (content - natural) }
        }
        return least
    }
    @State private var gridHeight: CGFloat = 0

    /// As many cards of at least the gallery's width as fit, widened to fill the row exactly. A
    /// narrow row (a small sheet) takes two smaller cards, never one big one.
    static func cardWidth(row: CGFloat, gap: CGFloat) -> CGFloat {
        let least: CGFloat = row < 400 ? 140 : SetupTemplateCard.size.width
        let count = max(1, ((row + gap) / (least + gap)).rounded(.down))
        return ((row - gap * (count - 1)) / count).rounded(.down)
    }

    private var stage: CGFloat { Self.stage(for: size) }

    /// One template as it looks in use, on its cover like the website's template page: the
    /// filled-in note (or the app) as a window on the cover's picture, then its name, what Make
    /// sends, and Make at the foot. Every part has a set height, so nothing moves from one
    /// template to the next (council, 8 November 2026: the gap over the buttons went 43 to 102 pt).
    private func detail(_ e: TemplateCatalog.Entry, kept: Bool) -> some View {
        let small = Self.small(size)
        let text: CGFloat = small ? 12 : 12.5
        return VStack(alignment: .leading, spacing: 0) {
            stageView(e)
                // A new template swaps in place, quickly: no slide, nothing else moves.
                .id(e.slug)
                .transition(.opacity.animation(.easeOut(duration: 0.12)))
            VStack(alignment: .leading, spacing: 0) {
                // Its name, once: a note's own title is left off the stage, so it isn't named
                // three times with the card (council round 2). 17 pt semibold, under the
                // sheet's 22 pt title.
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(e.title).font(.system(size: Self.panelTitle, weight: .semibold)).foregroundStyle(Color.ink)
                        .lineLimit(1)
                        .accessibilityAddTraits(.isHeader)
                    // Nothing matches the search: the template open before it stays, and says so
                    // (council round 3: an open template beside "No Results" read as a match).
                    if kept {
                        Text(TemplateLibraryWords.kept).font(.system(size: 11)).foregroundStyle(Color.muted)
                            .lineLimit(1)
                            .accessibilityIdentifier("templates.kept")
                    }
                }
                Text(e.shownDescription).font(.system(size: text)).foregroundStyle(Color.muted)
                    .lineLimit(3, reservesSpace: true)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 4)
                Spacer(minLength: small ? 8 : 16)
                // What Make does, and the ask it sends, as you'd say it. The box fits its words
                // and sits on the buttons: a box kept two lines tall read as a field to type in.
                VStack(alignment: .leading, spacing: 6) {
                    Text(TemplateLibraryWords.opensWith(ai)).font(.system(size: 12)).foregroundStyle(Color.muted)
                    Text(TemplateCatalog.Entry.sendable(e.ask))
                        .font(.system(size: text)).foregroundStyle(Color.ink)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 12).padding(.vertical, small ? 6 : 8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.primary.opacity(0.07), in: .rect(cornerRadius: 8, style: .continuous))
                        .accessibilityIdentifier("templates.ask")
                }
                actions(e, kept: kept)
                    .padding(.top, 12)
            }
            .padding(.horizontal, 20)
            .padding(.top, small ? 12 : 18)
            .padding(.bottom, 20)
            .frame(maxHeight: .infinity, alignment: .top)
        }
    }

    static let panelTitle: CGFloat = 17
    /// Whether Return makes the open template: not while it's only kept open beside No Results.
    static func returnMakes(kept: Bool) -> Bool { !kept }
    /// The window on the stage: inset from its top and sides, running off its foot.
    static func inset(for size: CGSize) -> CGFloat { small(size) ? 16 : 20 }
    /// The window's visible size on the stage: what a template's app or note has to show itself in.
    static func window(for size: CGSize) -> CGSize {
        CGSize(width: panel(for: size) - inset(for: size) * 2, height: stage(for: size) - inset(for: size))
    }

    /// The stage: the cover's picture, with the template in use as an opaque window on it, inset
    /// from the top and sides and running off the stage's foot, with a line under it. Nothing
    /// fades, so the art never shows through the words (council round 2: cart wheels over a list,
    /// sneakers under the habit app). The picture is drawn over the stage, never sizing it.
    private func stageView(_ e: TemplateCatalog.Entry) -> some View {
        let inset = Self.inset(for: size)
        return Color(rgb: e.pick.ground)
            .overlay(alignment: .top) {
                e.pick.image.resizable().scaledToFill()
                    .frame(width: panel, height: panel)
                    .accessibilityHidden(true)
            }
            .overlay(alignment: .top) {
                inUse(e)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .background(scheme == .dark ? Color.black : Color.white)
                    .clipShape(UnevenRoundedRectangle(topLeadingRadius: 12, topTrailingRadius: 12, style: .continuous))
                    .shadow(color: .black.opacity(0.25), radius: 18, y: 8)
                    .padding(.horizontal, inset)
                    .padding(.top, inset)
                    .accessibilityLabel("\(e.title), in use")
            }
            .frame(width: panel, height: stage)
            .clipped()
            .overlay(alignment: .bottom) { Divider() }
    }

    /// A note on the stage as it looks in use, under the name and description the panel gives it:
    /// without its title and its opening lines, from its first heading, so the stage shows the
    /// note filled in (council rounds 2 and 3: the stage repeated the title and the description).
    /// A note with no heading keeps its lines.
    static func staged(_ markdown: String) -> [NotePreview.Block] {
        var blocks = NotePreview.blocks(markdown)
        if case .title = blocks.first { blocks.removeFirst() }
        let opening = { (b: NotePreview.Block) -> Bool in if case .paragraph = b { return true }; return b == .gap }
        if blocks.contains(where: { !opening($0) }) {
            while let first = blocks.first, opening(first) { blocks.removeFirst() }
        }
        while blocks.first == .gap { blocks.removeFirst() }
        return blocks
    }

    private func actions(_ e: TemplateCatalog.Entry, kept: Bool) -> some View {
        HStack(spacing: 8) {
            // A split button: Make with the AI shown, and an arrow to make it with another
            // (remembered while the library is open).
            HStack(spacing: 1) {
                Button { if !ai.asks { copy(e) }; make(e, ai) } label: { makeLabel(ai) }
                    .buttonStyle(ais.count > 1 ? .amberProminent(.compact, wide: true, joined: .leading) : .amberProminent(.compact, wide: true))
                    // Return makes the open template, but not one kept open while nothing matches
                    // the search: there's nothing picked to make (council round 3).
                    .keyboardShortcut(Self.returnMakes(kept: kept) ? .defaultAction : nil)
                    .accessibilityIdentifier("templates.make")
                if ais.count > 1 {
                    Menu {
                        ForEach(ais) { other in
                            Button { picked = other; if !other.asks { copy(e) }; make(e, other) } label: {
                                if let mark = AIGlyph.menuImage(other.name, dark: scheme == .dark) {
                                    Label { Text(TemplateLibraryWords.make(other)) } icon: { mark }
                                } else {
                                    Text(TemplateLibraryWords.make(other))
                                }
                            }
                        }
                    } label: {
                        Image(systemName: "chevron.down").font(.system(size: 11, weight: .bold))
                    }
                    .menuStyle(.button)
                    .menuIndicator(.hidden)
                    .buttonStyle(.amberProminent(.compact, joined: .trailing))
                    .fixedSize()
                    .accessibilityLabel(TemplateLibraryWords.another)
                    .accessibilityIdentifier("templates.makeWith")
                }
            }
            // On a small sheet Copy is its icon, so Make keeps its whole name.
            if Self.small(size) {
                Button { copy(e) } label: { Image(systemName: copied ? "checkmark" : "doc.on.doc").frame(width: 16) }
                    .buttonStyle(.secondary(.compact))
                    .help(TemplateLibraryWords.copy)
                    .accessibilityLabel(copied ? TemplateLibraryWords.copied : TemplateLibraryWords.copy)
                    .accessibilityIdentifier("templates.copy")
            } else {
                Button(copied ? TemplateLibraryWords.copied : TemplateLibraryWords.copy) { copy(e) }
                    .buttonStyle(.secondary(.compact))
                    .accessibilityIdentifier("templates.copy")
            }
        }
    }

    /// The app's own picture when it is one; otherwise the filled-in note, drawn as the app draws notes.
    @ViewBuilder private func inUse(_ e: TemplateCatalog.Entry) -> some View {
        if let project = TemplateFiles.project(e) {
            // The app itself, running on its starting data: tick, add and scroll as you would.
            // Nothing it does is kept. Its picture shows while it starts, so the stage is never blank.
            TemplateAppPreview(entry: e, project: project, small: Self.small(size))
                .id(e.slug)
        } else {
            // Whole blocks only: no line cut through at the stage's foot, no heading left without
            // its first line, and tables laid out at the window's width (council round 3).
            NotePreview(markdown: e.example, given: Self.staged(e.example), whole: true)
        }
    }

    /// "Make with ChatGPT" with ChatGPT's mark: an AI named is an AI shown.
    private func makeLabel(_ ai: SetupCards.AI) -> some View {
        HStack(spacing: 7) {
            if ai != .other { AIGlyph(ai: ai.name, size: 13, monochrome: true) }
            Text(TemplateLibraryWords.make(ai))
        }
    }

    private func copy(_ e: TemplateCatalog.Entry) {
        ConnectClipboard.set(SetupCards.prompt(e.pick))
        withAnimation(.snappy(duration: 0.2)) { copied = true }
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
    private static var pictures: [String: NSImage?] = [:]

    static func project(_ e: TemplateCatalog.Entry) -> String? {
        if let p = projects[e.slug] { return p }
        let p = e.appProject
        projects[e.slug] = .some(p)
        return p
    }

    static func start(_ e: TemplateCatalog.Entry) -> NotePageData.Doc {
        if let d = starts[e.slug] { return d }
        let d = e.appData
        starts[e.slug] = d
        return d
    }

    static func picture(_ e: TemplateCatalog.Entry, dark: Bool, small: Bool) -> NSImage? {
        let key = "\(e.slug)-\(dark)-\(small)"
        if let p = pictures[key] { return p }
        let p = e.appPicture(dark: dark, small: small)
        pictures[key] = .some(p)
        return p
    }
}

/// A template's app running in the library, on its own copy of the starting data: changes stay
/// in this view and go when it closes. It reads the note and stores data, and nothing else.
struct TemplateAppPreview: View {
    let entry: TemplateCatalog.Entry
    let project: String
    /// On a small sheet's stage: its own picture, drawn for that stage's window.
    var small = false
    @State private var doc: NotePageData.Doc?
    /// Its own id, never a note's.
    @State private var id = UUID()
    /// Until the app has drawn, its picture shows in its place, so the stage is never blank; the
    /// app's page is see-through, so the picture fades out as the app fades in.
    @State private var ready = false
    @Environment(\.colorScheme) private var scheme

    /// The width the app is laid out at on the stage, in CSS pixels: its narrow layout, the same
    /// on both sheets. The picture is drawn at this width too (scripts/template-stage-pictures.ts).
    static let cssWidth: CGFloat = 400

    /// The live app's zoom in a window: as wide as cssWidth, whatever the window's width, so the
    /// app keeps one layout and fills the window exactly (1 on the big stage, 0.82 on the small).
    static func zoom(for window: CGSize) -> CGFloat { window.width / cssWidth }

    /// The small stage's app is laid out this tall and runs off the stage's foot, like a note's
    /// window: laid out only as tall as the 156 pt it shows, its tab bar took half of it and cut
    /// its first card (council round 3 asked for whole rows there).
    static let smallCSSHeight: CGFloat = 340

    /// The live app's size in CSS pixels in a window, and so the picture's: it's drawn for this.
    static func css(for window: CGSize, small: Bool) -> CGSize {
        CGSize(width: cssWidth, height: small ? smallCSSHeight : (window.height / zoom(for: window)).rounded())
    }

    /// The live app's frame in a window, and the picture's: from the top left, at the live app's
    /// scale, so the one replaces the other without moving (council round 3: the site's 1280 px
    /// picture drawn at a third, then the live app at full size in another layout). On the small
    /// stage it runs on below the window's foot.
    static func frame(in window: CGSize, small: Bool) -> CGRect {
        let css = css(for: window, small: small)
        return CGRect(x: 0, y: 0, width: window.width, height: (css.height * zoom(for: window)).rounded())
    }

    var body: some View {
        GeometryReader { geo in
            let frame = Self.frame(in: geo.size, small: small)
            ZStack(alignment: .topLeading) {
                if !ready, let picture = TemplateFiles.picture(entry, dark: scheme == .dark, small: small) {
                    // Its own shape at the live app's width: the live app's frame on both stages
                    // (a sheet between the two sizes cuts it at the window's foot).
                    Image(nsImage: picture).resizable()
                        .frame(width: frame.width, height: (frame.width * picture.size.height / max(picture.size.width, 1)).rounded())
                        .accessibilityHidden(true)
                        .transition(.opacity)
                }
                NotePageView(noteID: id, html: project, text: entry.note ?? entry.example, onUpdate: { _ in },
                             onData: { message in try data(message) }, preview: doc ?? TemplateFiles.start(entry),
                             onReady: { withAnimation(.easeOut(duration: 0.15)) { ready = true } },
                             zoom: Self.zoom(for: geo.size))
                    .frame(width: frame.width, height: frame.height)
            }
            .frame(width: geo.size.width, height: geo.size.height, alignment: .topLeading)
            .clipped()
        }
    }

    @MainActor private func data(_ message: Any) throws -> [String: Any] {
        let (after, made) = try NotePageData.apply(try NotePageData.Op(message), to: doc ?? TemplateFiles.start(entry))
        doc = after
        return ["data": after].merging(made.map { ["id": $0] } ?? [:]) { a, _ in a }
    }
}
#endif
