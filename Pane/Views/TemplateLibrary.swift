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

        /// An app's picture in use (the site's), in the look asked for.
        func appPicture(dark: Bool) -> NSImage? {
            guard app, let url = Bundle.main.url(forResource: "template-app-\(slug)-\(dark ? "dark" : "light")", withExtension: "jpg") else { return nil }
            return NSImage(contentsOf: url)
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
    /// What Make does, over the ask it sends: said once, where the ask is.
    static func opensWith(_ ai: SetupCards.AI) -> String { ai.asks ? "Adds the note, then opens \(ai.name) with" : "Adds the note. Then ask your AI" }
    static let clear = "Clear Search"
    static func none(_ q: String) -> String { "No templates match \u{201C}\(q)\u{201D}" }
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
    static func stage(for size: CGSize) -> CGFloat { size.height <= 560 ? 150 : 300 }
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
                    if let current { detail(current) } else { Color.clear }
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
                    Text(TemplateLibraryWords.line).font(.system(size: 13)).foregroundStyle(Color.muted)
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
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: width, maximum: width), spacing: Self.gap, alignment: .top)], alignment: .leading, spacing: Self.gap - 2 * Self.clearance) {
                        ForEach(shown) { e in
                            SetupTemplateCard(pick: e.pick, width: width, selected: current == e) {
                                open = e
                                copied = false
                            }
                            // Scrolled to with room above and below: the cell (what scrollTo
                            // finds) is the card and 16 pt either side, and the rows overlap by
                            // that much, so the cards keep their 16 pt gap.
                            .padding(.vertical, Self.clearance)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .onGeometryChange(for: CGFloat.self, of: { $0.size.width }) { row = $0 }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 24 - Self.clearance)
                }
                // The open card is always in full view: on opening, on every pick, arrow key,
                // kind and search (council, 8 November 2026: it was a 23 pt sliver, or off screen).
                .onAppear {
                    guard let slug = current?.slug else { return }
                    scroller.scrollTo(slug)
                    DispatchQueue.main.async { scroller.scrollTo(slug) }
                }
                .onChange(of: current?.slug) { _, slug in
                    guard let slug else { return }
                    if open?.slug != slug { open = current }
                    withAnimation(.snappy(duration: 0.2)) { scroller.scrollTo(slug) }
                }
                .onChange(of: filter) { if let slug = current?.slug { scroller.scrollTo(slug) } }
                // Again once the grid has its real width: a scroll before the first layout lands
                // on the card's estimated place, without its room.
                .onChange(of: row) { if let slug = current?.slug { scroller.scrollTo(slug) } }
            }
        }
        .frame(maxWidth: .infinity)
    }

    /// Room kept around the open card when it's scrolled to.
    static let clearance: CGFloat = 16

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
    private func detail(_ e: TemplateCatalog.Entry) -> some View {
        let small = Self.small(size)
        let text: CGFloat = small ? 12 : 12.5
        return VStack(alignment: .leading, spacing: 0) {
            stageView(e)
                // A new template swaps in place, quickly: no slide, nothing else moves.
                .id(e.slug)
                .transition(.opacity.animation(.easeOut(duration: 0.12)))
            VStack(alignment: .leading, spacing: 0) {
                // Its name, for notes too: a note's own title can be off the stage (council).
                Text(e.title).font(.system(size: small ? 17 : 20, weight: .bold)).foregroundStyle(Color.ink)
                    .lineLimit(1)
                    .accessibilityAddTraits(.isHeader)
                Text(e.description).font(.system(size: text)).foregroundStyle(Color.muted)
                    .lineLimit(3, reservesSpace: true)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 4)
                Spacer(minLength: small ? 8 : 12)
                // What Make does, and the ask it sends, as you'd say it.
                VStack(alignment: .leading, spacing: 5) {
                    Text(TemplateLibraryWords.opensWith(ai)).font(.system(size: 11, weight: .semibold)).foregroundStyle(Color.muted)
                    // As it's sent: without a trailing "…" gap.
                    Text(TemplateCatalog.Entry.sendable(e.ask))
                        .font(.system(size: text)).foregroundStyle(Color.ink)
                        .lineLimit(2, reservesSpace: true)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 12).padding(.vertical, small ? 6 : 8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.primary.opacity(0.07), in: .rect(cornerRadius: 12, style: .continuous))
                }
                actions(e)
                    .padding(.top, small ? 12 : 16)
            }
            .padding(.horizontal, 20)
            .padding(.top, small ? 12 : 18)
            .padding(.bottom, 20)
            .frame(maxHeight: .infinity, alignment: .top)
        }
    }

    /// The stage: the cover's picture, with the template in use as a window on it, inset from
    /// the top and sides, fading out at the stage's foot. The picture is drawn over the stage,
    /// never sizing it (it was a square, which cut the window's top off in a small sheet).
    private func stageView(_ e: TemplateCatalog.Entry) -> some View {
        let inset: CGFloat = Self.small(size) ? 16 : 20
        let fade = 24 / max(stage - inset, 1)
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
                    .mask {
                        LinearGradient(stops: [.init(color: .black, location: 0), .init(color: .black, location: 1 - fade), .init(color: .clear, location: 1)],
                                       startPoint: .top, endPoint: .bottom)
                    }
                    .shadow(color: .black.opacity(0.25), radius: 18, y: 8)
                    .padding(.horizontal, inset)
                    .padding(.top, inset)
                    .accessibilityLabel("\(e.title), in use")
            }
            .frame(width: panel, height: stage)
            .clipped()
    }

    private func actions(_ e: TemplateCatalog.Entry) -> some View {
        HStack(spacing: 8) {
            // A split button: Make with the AI shown, and an arrow to make it with another
            // (remembered while the library is open).
            HStack(spacing: 1) {
                Button { if !ai.asks { copy(e) }; make(e, ai) } label: { makeLabel(ai) }
                    .buttonStyle(ais.count > 1 ? .amberProminent(.compact, wide: true, joined: .leading) : .amberProminent(.compact, wide: true))
                    .keyboardShortcut(.defaultAction)
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
            TemplateAppPreview(entry: e, project: project)
                .id(e.slug)
        } else {
            NotePreview(markdown: e.example)
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

    static func picture(_ e: TemplateCatalog.Entry, dark: Bool) -> NSImage? {
        let key = "\(e.slug)-\(dark)"
        if let p = pictures[key] { return p }
        let p = e.appPicture(dark: dark)
        pictures[key] = .some(p)
        return p
    }
}

/// A template's app running in the library, on its own copy of the starting data: changes stay
/// in this view and go when it closes. It reads the note and stores data, and nothing else.
struct TemplateAppPreview: View {
    let entry: TemplateCatalog.Entry
    let project: String
    @State private var doc: NotePageData.Doc?
    /// Its own id, never a note's.
    @State private var id = UUID()
    /// Until the app has drawn, its picture (the site's) shows in its place, so the stage is
    /// never blank; the app's page is see-through, so the picture goes once it's ready.
    @State private var ready = false
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        ZStack(alignment: .topLeading) {
            if !ready, let picture = TemplateFiles.picture(entry, dark: scheme == .dark) {
                // The whole app, its full width in the window: never cut at the right edge
                // (council, 8 November 2026: "11-", "Princip").
                Color.clear
                    .overlay(alignment: .top) { Image(nsImage: picture).resizable().scaledToFit() }
                    .clipped()
                    .accessibilityHidden(true)
                    .transition(.opacity)
            }
            NotePageView(noteID: id, html: project, text: entry.note ?? entry.example, onUpdate: { _ in },
                         onData: { message in try data(message) }, preview: doc ?? TemplateFiles.start(entry),
                         onReady: { withAnimation(.easeOut(duration: 0.15)) { ready = true } })
        }
    }

    @MainActor private func data(_ message: Any) throws -> [String: Any] {
        let (after, made) = try NotePageData.apply(try NotePageData.Op(message), to: doc ?? TemplateFiles.start(entry))
        doc = after
        return ["data": after].merging(made.map { ["id": $0] } ?? [:]) { a, _ in a }
    }
}
#endif
