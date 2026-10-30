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
        var id: String { slug }

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
    static let copy = "Copy prompt"
    static let copied = "Copied"
    static let tryAsking = "Then try asking"
    static func none(_ q: String) -> String { "No templates match \u{201C}\(q)\u{201D}" }
}

/// Every template, as a page of the window: search, the kinds, a grid of the site's cards. A card
/// opens its template: what it is, what to ask, and Make with the AI you use.
struct TemplateLibraryView: View {
    var catalog = TemplateCatalog.shipped
    /// The AI a template is made with: the one you used last.
    var ai: SetupCards.AI = .chatgpt
    /// Captures: the template that's open.
    @State var open: TemplateCatalog.Entry?
    var make: (TemplateCatalog.Entry) -> Void = { _ in }
    @State private var filter = "All"
    @State private var query = ""
    @State private var copied = false
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                Picker("Kind", selection: $filter) {
                    ForEach(TemplateCatalog.filters, id: \.self) { Text($0).tag($0) }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .fixedSize()
                let shown = catalog.shown(filter: filter, query: query)
                if shown.isEmpty {
                    Text(TemplateLibraryWords.none(query)).foregroundStyle(Color.muted).padding(.top, 20)
                }
                LazyVGrid(columns: [GridItem(.adaptive(minimum: SetupTemplateCard.size.width, maximum: SetupTemplateCard.size.width), spacing: 16)],
                          alignment: .leading, spacing: 16) {
                    ForEach(shown) { e in
                        SetupTemplateCard(pick: e.pick) { withAnimation(.snappy(duration: 0.25)) { open = e } }
                    }
                }
            }
            .padding(.horizontal, 32)
            .padding(.top, 44)
            .padding(.bottom, 32)
        }
        .background(scheme == .dark ? Color.black : Color.white)
        .overlay { if let open { detail(open) } }
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 4) {
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
            .frame(width: 220, height: 30)
            .background(Color.primary.opacity(0.06), in: .rect(cornerRadius: 8, style: .continuous))
        }
    }

    /// One template, over the grid: its card, what it is, what to ask, Make and Copy prompt.
    private func detail(_ e: TemplateCatalog.Entry) -> some View {
        ZStack {
            Color.black.opacity(0.28).ignoresSafeArea()
                .onTapGesture { close() }
            HStack(alignment: .top, spacing: 24) {
                SetupTemplateCard(pick: e.pick) {}
                    .allowsHitTesting(false)
                VStack(alignment: .leading, spacing: 12) {
                    Text(e.title).font(.system(size: 20, weight: .bold)).foregroundStyle(Color.ink)
                    Text(e.description).font(.system(size: 13)).foregroundStyle(Color.muted)
                        .fixedSize(horizontal: false, vertical: true)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(TemplateLibraryWords.tryAsking).font(.system(size: 11, weight: .semibold)).foregroundStyle(Color.muted)
                        Text("\u{201C}\(e.ask)\u{201D}").font(.system(size: 13)).foregroundStyle(Color.ink)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.top, 4)
                    Spacer(minLength: 8)
                    VStack(spacing: 8) {
                        Button { make(e) } label: {
                            HStack(spacing: 7) {
                                if ai != .other { AIGlyph(ai: ai.name, size: 14) }
                                Text(TemplateLibraryWords.make(ai))
                            }
                        }
                        .buttonStyle(.amberProminent(.regular, wide: true))
                        .keyboardShortcut(.defaultAction)
                        .accessibilityIdentifier("templates.make")
                        Button(copied ? TemplateLibraryWords.copied : TemplateLibraryWords.copy) { copy(e) }
                            .buttonStyle(.quiet(.regular))
                            .accessibilityIdentifier("templates.copy")
                    }
                }
                .frame(width: 300, alignment: .leading)
                .frame(minHeight: SetupTemplateCard.size.height)
            }
            // As tall as the card or its words, whichever is more; never the window.
            .fixedSize(horizontal: false, vertical: true)
            .padding(24)
            .background {
                RoundedRectangle(cornerRadius: 20, style: .continuous).fill(SetupCards.ground)
                    .shadow(color: .black.opacity(0.16), radius: 25, y: 18)
            }
            .overlay(alignment: .topTrailing) {
                Button { close() } label: {
                    Image(systemName: "xmark").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                        .frame(width: 28, height: 28).contentShape(Circle())
                }
                .buttonStyle(.quietIcon)
                .keyboardShortcut(.cancelAction)
                .accessibilityLabel("Close")
                .padding(10)
            }
        }
        .transition(.opacity)
    }

    private func close() { withAnimation(.snappy(duration: 0.2)) { open = nil; copied = false } }

    private func copy(_ e: TemplateCatalog.Entry) {
        ConnectClipboard.set(SetupCards.prompt(e.pick))
        withAnimation(.snappy(duration: 0.2)) { copied = true }
    }
}
#endif
