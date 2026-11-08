import SwiftData
#if os(macOS)
import SwiftUI

/// The website's templates, in the app (2026-10-30): every one, by kind, opened from Templates in
/// the sidebar. A copy of the site's list ships with the app (Pane/Resources/Templates, made by
/// scripts/template-catalog.py; web/lib/template-catalog.test.ts fails while it's behind).
struct TemplateCatalog {
    struct Entry: Decodable, Identifiable, Equatable {
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
        /// An app's note, which its app reads (nil for a plain note).
        var note: String?
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
                            ground: UInt32(ground, radix: 16) ?? 0x5B5651, ask: "use my \(title) note. \(ask)")
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
        case "Home and life": "Home"
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
    static let line = "Notes your AI fills in and keeps up to date."
    static func make(_ ai: SetupCards.AI) -> String { ai.asks ? "Make with \(ai.name)" : "Add the note" }
    static let another = "Make with another AI"
    static let copy = "Copy prompt"
    static let copied = "Copied"
    static let tryAsking = "Then ask"
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
    @MainActor static func make(_ e: TemplateCatalog.Entry, with ai: SetupCards.AI, context: ModelContext, account: UUID?, open: (URL) -> Void) async -> UUID? {
        let model = NoteSourceModel(link: NoteSourceLink(kind: .template, slug: e.slug), source: WebNoteSource(), ledger: NoteSourceLedger(account: account))
        await model.load(context: context)
        model.add(context: context, again: true)
        var note: UUID?
        if case .added(_, let id, _) = model.phase {
            note = id
            SyncSignal.changed()
        }
        ConnectClipboard.set(SetupCards.prompt(e.pick))
        if let page = SetupCards.page(ai, e.pick) { open(page) }
        return note
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
    static let panel: CGFloat = 440
    static let gap: CGFloat = 16

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

    /// The template shown open: the one picked while it's in the list, otherwise the first.
    static func showing(_ shown: [TemplateCatalog.Entry], open: TemplateCatalog.Entry?) -> TemplateCatalog.Entry? {
        if let open, shown.contains(open) { return open }
        return shown.first
    }

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 20, style: .continuous)
        let shown = catalog.shown(filter: filter, query: query)
        let current = Self.showing(shown, open: open)
        VStack(spacing: 0) {
            header
            Divider()
            if shown.isEmpty {
                // Nothing matches: one message across the sheet, and the way back.
                VStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").font(.system(size: 28, weight: .regular)).foregroundStyle(Color.muted)
                    Text(TemplateLibraryWords.none(query)).font(.system(size: 15, weight: .semibold)).foregroundStyle(Color.ink)
                    Button(TemplateLibraryWords.clear) { query = ""; filter = "All" }
                        .buttonStyle(.secondary(.regular))
                        .padding(.top, 4)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.bottom, 40)
            } else {
                HStack(spacing: 0) {
                    grid(shown, current: current)
                    Divider()
                    Group {
                        if let current { detail(current) } else { Color.clear }
                    }
                    .frame(width: Self.panel)
                    .frame(maxHeight: .infinity, alignment: .top)
                    .clipped()
                }
                .frame(maxHeight: .infinity)
            }
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
        let w = Self.cardWidth(row: row > 0 ? row : size.width - Self.panel - 49, gap: Self.gap)
        return max(1, Int(((row > 0 ? row : size.width - Self.panel - 49) + Self.gap) / (w + Self.gap)))
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
                search
                CardCloseButton(action: close)
            }
            Picker("Kind", selection: $filter) {
                ForEach(TemplateCatalog.filters, id: \.self) { Text(TemplateCatalog.label($0)).tag($0) }
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            .fixedSize()
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
        .frame(width: 220, height: 30)
        .background(Color.primary.opacity(0.06), in: .rect(cornerRadius: 8, style: .continuous))
    }

    private func grid(_ shown: [TemplateCatalog.Entry], current: TemplateCatalog.Entry?) -> some View {
        GeometryReader { geo in
            // The row the cards really get: less than the pane when a mouse is attached and the
            // scroll bar takes its own room (the cards then left a column's gap).
            let width = Self.cardWidth(row: row > 0 ? row : geo.size.width - 48, gap: Self.gap)
            ScrollViewReader { scroller in
                ScrollView {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: width, maximum: width), spacing: Self.gap, alignment: .top)], alignment: .leading, spacing: Self.gap) {
                        ForEach(shown) { e in
                            SetupTemplateCard(pick: e.pick, width: width, selected: current == e) {
                                open = e
                                copied = false
                            }
                            .id(e.slug)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .onGeometryChange(for: CGFloat.self, of: { $0.size.width }) { row = $0 }
                    .padding(24)
                }
                .onChange(of: current?.slug) { _, slug in
                    guard let slug else { return }
                    withAnimation(.snappy(duration: 0.2)) { scroller.scrollTo(slug) }
                }
                .onChange(of: filter) { scroller.scrollTo(shown.first?.slug, anchor: .top) }
            }
        }
        .frame(maxWidth: .infinity)
    }

    /// As many cards of at least the gallery's width as fit, widened to fill the row exactly.
    static func cardWidth(row: CGFloat, gap: CGFloat) -> CGFloat {
        let least = SetupTemplateCard.size.width
        let count = max(1, ((row + gap) / (least + gap)).rounded(.down))
        return ((row - gap * (count - 1)) / count).rounded(.down)
    }

    /// The stage's height: 290 in the full sheet, less in a smaller window, so the words and
    /// Make under it always fit (at 330 an app's longer words pushed the whole sheet up).
    private var stage: CGFloat { min(290, (size.height * 0.42).rounded()) }

    /// One template as it looks in use, on its cover like the website's template page: the
    /// filled-in note (or the app) on the cover's picture and ground, then its name, what to ask,
    /// and Make at the foot.
    private func detail(_ e: TemplateCatalog.Entry) -> some View {
        let ground = Color(rgb: e.pick.ground)
        return VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .top) {
                ground
                e.pick.image.resizable().scaledToFill()
                    .frame(width: Self.panel, height: Self.panel)
                    .frame(maxHeight: .infinity, alignment: .top)
                    .clipped()
                    .accessibilityHidden(true)
                inUse(e)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(scheme == .dark ? Color.black : Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .shadow(color: .black.opacity(0.3), radius: 24, y: 14)
                    .padding(.horizontal, 28)
                    .padding(.top, 72)
                    // It runs off the stage's foot, as a window seen past the cover.
                    .padding(.bottom, -40)
                    .accessibilityLabel("\(e.title), in use")
            }
            .frame(height: stage)
            .clipped()
            // A new template swaps in place, quickly: no slide, nothing else moves.
            .id(e.slug)
            .transition(.opacity.animation(.easeOut(duration: 0.12)))
            VStack(alignment: .leading, spacing: 12) {
                VStack(alignment: .leading, spacing: 5) {
                    // A note shows its own title at its top; an app's picture may not.
                    if e.app {
                        Text(e.title).font(.system(size: 20, weight: .heavy)).tracking(-0.2).foregroundStyle(Color.ink)
                    }
                    Text(e.description).font(.system(size: 12.5)).foregroundStyle(Color.muted)
                        .lineLimit(3).fixedSize(horizontal: false, vertical: true)
                }
                // What you'd say next, as you'd say it: a message on the right.
                VStack(alignment: .trailing, spacing: 4) {
                    Text(TemplateLibraryWords.tryAsking).font(.system(size: 11, weight: .semibold)).foregroundStyle(Color.muted)
                    Text(e.ask)
                        .font(.system(size: 12.5)).foregroundStyle(Color.ink)
                        .lineLimit(2)
                        // Two lines, never cut to one by the panel's height.
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .background(Color.primary.opacity(0.07), in: .rect(cornerRadius: 14, style: .continuous))
                }
                .frame(maxWidth: .infinity, alignment: .trailing)
                Spacer(minLength: 0)
                actions(e)
            }
            .padding(20)
            .frame(maxHeight: .infinity, alignment: .top)
        }
    }

    private func actions(_ e: TemplateCatalog.Entry) -> some View {
        HStack(spacing: 8) {
            // A split button: Make with the AI shown, and an arrow to make it with another
            // (remembered while the library is open).
            HStack(spacing: 1) {
                Button { if !ai.asks { copy(e) }; make(e, ai) } label: { makeLabel(ai) }
                    .buttonStyle(ais.count > 1 ? .amberProminent(.regular, wide: true, joined: .leading) : .amberProminent(.regular, wide: true))
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
                        Image(systemName: "chevron.down").font(.system(size: 12, weight: .bold))
                    }
                    .menuStyle(.button)
                    .menuIndicator(.hidden)
                    .buttonStyle(.amberProminent(.regular, joined: .trailing))
                    .fixedSize()
                    .accessibilityLabel(TemplateLibraryWords.another)
                    .accessibilityIdentifier("templates.makeWith")
                }
            }
            Button(copied ? TemplateLibraryWords.copied : TemplateLibraryWords.copy) { copy(e) }
                .buttonStyle(.secondary(.regular))
                .accessibilityIdentifier("templates.copy")
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
            if ai != .other { AIGlyph(ai: ai.name, size: 15, monochrome: true) }
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
                // From its left edge at a size you can read, never widening the panel.
                Color.clear
                    .overlay(alignment: .topLeading) { Image(nsImage: picture).resizable().scaledToFit().frame(width: 560) }
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
