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
        var id: String { slug }

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
    static func make(_ ai: SetupCards.AI) -> String { ai == .other ? "Add the note" : "Make with \(ai.name)" }
    static let another = "Make with another AI"
    static let copy = "Copy prompt"
    static let copied = "Copied"
    static let tryAsking = "Then ask"
    static func none(_ q: String) -> String { "No templates match \u{201C}\(q)\u{201D}" }
}

/// Every template, in a big card over the notes (a quick visit, like Settings: Esc goes back).
/// A template opens on the right as it looks in use: the note your AI filled in, or the app.
struct TemplateLibraryView: View {
    var catalog = TemplateCatalog.shipped
    /// Your connected AIs, the one you used last first: Make uses the first, or the one picked
    /// from the arrow beside it.
    var ais: [SetupCards.AI] = [.chatgpt]
    /// Captures: the template that's open.
    @State var open: TemplateCatalog.Entry?
    var make: (TemplateCatalog.Entry, SetupCards.AI) -> Void = { _, _ in }
    @State private var picked: SetupCards.AI?
    private var ai: SetupCards.AI { picked ?? ais.first ?? .other }
    var close: () -> Void = {}
    @State private var filter = "All"
    @State private var query = ""
    @State private var copied = false
    @Environment(\.colorScheme) private var scheme

    static let size = CGSize(width: 1040, height: 680)
    static let panel: CGFloat = 440

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 20, style: .continuous)
        VStack(spacing: 0) {
            header
            Divider().opacity(0.6)
            HStack(spacing: 0) {
                grid
                if let open {
                    Divider().opacity(0.6)
                    detail(open)
                        .frame(width: Self.panel)
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                }
            }
        }
        .frame(width: Self.size.width, height: Self.size.height)
        .background { shape.fill(SetupCards.ground).shadow(color: .black.opacity(0.2), radius: 30, y: 20) }
        .clipShape(shape)
        .overlay(shape.strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5))
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.28).onTapGesture(perform: close))
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
                HStack(spacing: 6) {
                    Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                    TextField("Search", text: $query).textFieldStyle(.plain)
                        .accessibilityIdentifier("templates.search")
                }
                .font(.system(size: 13))
                .padding(.horizontal, 10)
                .frame(width: 200, height: 30)
                .background(Color.primary.opacity(0.06), in: .rect(cornerRadius: 8, style: .continuous))
                Button(action: close) {
                    Image(systemName: "xmark").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                        .frame(width: 28, height: 28).contentShape(Circle())
                }
                .buttonStyle(.quietIcon)
                .keyboardShortcut(.cancelAction)
                .accessibilityLabel("Close")
            }
            Picker("Kind", selection: $filter) {
                ForEach(TemplateCatalog.filters, id: \.self) { Text($0).tag($0) }
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            .fixedSize()
        }
        .padding(.horizontal, 24)
        .padding(.top, 22)
        .padding(.bottom, 16)
    }

    private var grid: some View {
        GeometryReader { geo in
            let gap: CGFloat = 16
            let row = geo.size.width - 48
            let width = Self.cardWidth(row: row, gap: gap)
            ScrollView {
                let shown = catalog.shown(filter: filter, query: query)
                if shown.isEmpty {
                    Text(TemplateLibraryWords.none(query)).foregroundStyle(Color.muted).padding(.top, 20)
                }
                LazyVGrid(columns: [GridItem(.adaptive(minimum: width, maximum: width), spacing: gap, alignment: .top)], alignment: .leading, spacing: gap) {
                    ForEach(shown) { e in
                        SetupTemplateCard(pick: e.pick, width: width, selected: open == e) {
                            withAnimation(.snappy(duration: 0.28)) { open = e; copied = false }
                        }
                    }
                }
                .padding(24)
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
            .frame(height: 330)
            .clipped()
            VStack(alignment: .leading, spacing: 12) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(e.title).font(.system(size: 20, weight: .heavy)).tracking(-0.2).foregroundStyle(Color.ink)
                    Text(e.description).font(.system(size: 12.5)).foregroundStyle(Color.muted)
                        .lineLimit(3).fixedSize(horizontal: false, vertical: true)
                }
                // What you'd say next, as you'd say it: a message on the right.
                VStack(alignment: .trailing, spacing: 4) {
                    Text(TemplateLibraryWords.tryAsking).font(.system(size: 11, weight: .semibold)).foregroundStyle(Color.muted)
                    Text(e.ask)
                        .font(.system(size: 12.5)).foregroundStyle(Color.ink)
                        .lineLimit(2)
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .background(Color.primary.opacity(0.07), in: .rect(cornerRadius: 14, style: .continuous))
                }
                .frame(maxWidth: .infinity, alignment: .trailing)
                Spacer(minLength: 0)
                HStack(spacing: 8) {
                    // A split button: Make with the AI shown, and an arrow to make it with another
                    // (remembered while the library is open).
                    HStack(spacing: 2) {
                        Button { make(e, ai) } label: { makeLabel(ai) }
                            .buttonStyle(.amberProminent(.regular, wide: true))
                            .keyboardShortcut(.defaultAction)
                            .accessibilityIdentifier("templates.make")
                        if ais.count > 1 {
                            Menu {
                                ForEach(ais) { other in
                                    Button { picked = other; make(e, other) } label: {
                                        if let asset = AIGlyph.asset(other.name) {
                                            Label { Text(TemplateLibraryWords.make(other)) } icon: { Image(asset) }
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
                            .buttonStyle(.amberProminent(.regular))
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
            .padding(20)
        }
    }

    /// The app's own picture when it is one; otherwise the filled-in note, drawn as the app draws notes.
    @ViewBuilder private func inUse(_ e: TemplateCatalog.Entry) -> some View {
        if let picture = e.appPicture(dark: scheme == .dark) {
            // The whole app, fitted to the panel's width, never widening it.
            // The app from its left edge, at a size you can read; the rest runs off the window.
            Color.clear
                .overlay(alignment: .topLeading) { Image(nsImage: picture).resizable().scaledToFit().frame(width: 560) }
                .clipped()
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
#endif
