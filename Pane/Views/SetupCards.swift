#if os(macOS)
import AppKit
import Supabase
import SwiftUI

/// The first run as one small card over the notes window (design round 7): no welcome picture,
/// no window of its own. The app opens on the real, empty notes; one card asks one thing at a
/// time and changes size between steps; the notes fill in behind it. It drives the same
/// `OnboardingStore` as the card window (`OnboardingFlow`), so resuming, the funnel and Help ›
/// Show Setup Guide work the same.
///
///     Sign in to Pinto.  ->  Bring in your notes?  ->  Connect your AI.  ->  You're set.
///                                                       -> (an AI connected) What should ChatGPT make first?
///
/// The name step is never asked here: the name comes from Apple or Google, or the Mac's own.
enum SetupCards {
    /// On: the first run is the card over the notes. Off (`defaults write … setup.cards -bool NO`):
    /// the card window as before.
    static var on: Bool { UserDefaults.standard.object(forKey: "setup.cards") as? Bool ?? true }

    /// What the card shows.
    enum Card: Hashable {
        case signIn, bring, importing, connect, waiting, connected, set, gallery, making, prompt
    }

    /// The card's width for each: just enough for its one line and its choice. The gallery is the
    /// one wide card.
    static func width(_ card: Card) -> CGFloat {
        switch card {
        case .signIn: 340
        case .bring: 420
        case .importing, .waiting, .connected: 340
        case .connect: 400
        case .set: 300
        case .gallery: 736
        case .making: 320
        case .prompt: 380
        }
    }

    // MARK: Your notes

    /// The places notes can come from, Apple Notes first (`ImportOrigin.all`).
    static var sources: [ImportOrigin] { ImportOrigin.all }

    /// The tile's name: short, so six fit in three columns.
    static func tileName(_ origin: ImportOrigin) -> String {
        switch origin {
        case .files(.markdown): "Markdown files"
        default: origin.name
        }
    }

    /// The main button names what it will do with the source picked.
    static func importTitle(_ origin: ImportOrigin) -> String {
        switch origin {
        case .appleNotes: "Import from Apple Notes"
        case .files(.obsidian): "Choose Obsidian vault\u{2026}"
        case .files(.bear): "Choose Bear export\u{2026}"
        case .files(.evernote): "Choose .enex files\u{2026}"
        case .files(.keep): "Choose Takeout folder\u{2026}"
        case .files(.markdown): "Choose Markdown folder\u{2026}"
        }
    }

    static let bringTitle = "Bring in your notes?"
    static let bringingTitle = "Bringing in your notes."

    static func brought(_ count: Int) -> String {
        count == 1 ? "1 note brought in" : "\(count.formatted()) notes brought in"
    }

    // MARK: Your AI

    enum AI: String, CaseIterable, Identifiable {
        case chatgpt, claude, other
        var id: String { rawValue }

        /// The name in sentences ("Finish in ChatGPT.") and on its tile.
        var name: String {
            switch self {
            case .chatgpt: "ChatGPT"
            case .claude: "Claude"
            case .other: "your AI"
            }
        }

        var tile: String { self == .other ? "Another AI" : name }
        /// At the start of a sentence.
        var Name: String { self == .other ? "Your AI" : name }
        /// The mark `AITile` draws.
        var mark: String { self == .other ? "Another AI" : name }

        var button: String { self == .other ? "Connect another AI" : "Connect \(name)" }

        /// What App Review asks every screen before an AI to say: what it can do, and that you decide.
        var reads: String { "\(Name) can read and edit your notes when you ask. Disconnect anytime." }

        var guide: ConnectAISection.Guide {
            switch self {
            case .chatgpt: .chatgpt
            case .claude: .claude
            case .other: .other
            }
        }

        /// ChatGPT and Claude open from a link with the ask in them (`TryIt.page`). Another AI
        /// gets the gallery too, and the ask to copy.
        var asks: Bool { self != .other }
    }

    static let connectTitle = "Connect your AI."
    static func finishTitle(_ ai: AI) -> String { "Finish in \(ai.name)." }
    static func connectedTitle(_ ai: AI) -> String { "\(ai.Name) is connected." }
    /// Another AI: the address is on the clipboard, to paste into it.
    static let otherLine = "The address is copied. Paste it into your AI\u{2019}s connector settings."
    static let setTitle = "You\u{2019}re set."

    // MARK: The first note

    /// One of the website's templates (web/content/templates), with its cover and the first thing
    /// to ask. Picking it adds the template's note, then opens the AI with the ask in it.
    struct Pick: Identifiable, Equatable {
        let slug: String
        let title: String
        let line: String
        let cover: String
        /// The flat colour under the cover's picture (web/lib/template-covers.ts).
        let ground: UInt32
        let ask: String
        var id: String { slug }

        /// Light words on a dark ground, like the site's `inkOn`.
        var lightInk: Bool { SetupCards.luminance(ground) <= 0.3 }

        /// The cover: an asset, or a small copy of the site's (Pane/Resources/Templates).
        var image: Image {
            if let url = Bundle.main.url(forResource: cover, withExtension: "jpg"), let i = NSImage(contentsOf: url) { return Image(nsImage: i) }
            return Image(cover)
        }
    }

    static let picks: [Pick] = [
        Pick(slug: "trip-plan", title: "Trip plan", line: "Days, bookings and the packing list in one place.", cover: "SetupCoverTripPlan", ground: 0x2E5339,
             ask: "fill in my Trip plan: Lisbon, 4 days in May. I like food, views and walking. Not museums."),
        Pick(slug: "meal-plan", title: "Meal plan and groceries", line: "This week\u{2019}s dinners and the shopping list.", cover: "SetupCoverMealPlan", ground: 0xFBB433,
             ask: "plan this week\u{2019}s dinners in my Meal plan. We\u{2019}re out on Friday, and no mushrooms."),
        Pick(slug: "weekly-review", title: "Weekly review", line: "Five questions every Sunday, written up for you.", cover: "SetupCoverWeeklyReview", ground: 0xE5837F,
             ask: "do my Weekly review from what I wrote this week."),
        Pick(slug: "reading-list", title: "Reading list", line: "Every book you want to read, with a line on why.", cover: "SetupCoverReadingList", ground: 0x3F5C86,
             ask: "start my Reading list with five novels I\u{2019}d like, and a line on why."),
    ]

    static func galleryTitle(_ ai: AI) -> String { "What should \(ai.name) make first?" }
    static let allTemplates = "All templates"
    static func makingTitle(_ pick: Pick) -> String { "Making your \(pick.title)." }
    /// Another AI: no link opens it, so the ask is shown to copy.
    static let promptTitle = "Paste this into your AI."
    static let copyPrompt = "Copy prompt"
    static let copied = "Copied"

    /// What the AI is asked: in Pinto Notes, by the note's name, so it reaches for the connection.
    static func prompt(_ pick: Pick) -> String { "In Pinto Notes, \(pick.ask)" }

    static func page(_ ai: AI, _ pick: Pick) -> URL? { ai.asks ? TryIt.page(for: ai.name, prompt: prompt(pick)) : nil }

    static func luminance(_ rgb: UInt32) -> Double {
        let c = [Double((rgb >> 16) & 255), Double((rgb >> 8) & 255), Double(rgb & 255)].map { v -> Double in
            let s = v / 255
            return s <= 0.03928 ? s / 12.92 : pow((s + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    }

    // MARK: Looks

    /// White in light, the system's raised grey in dark: a card over the pure black notes.
    static let ground = Color(nsColor: NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(white: 0.11, alpha: 1) : .white })
    static let soft = Color(nsColor: NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(white: 0.17, alpha: 1) : NSColor(white: 0.935, alpha: 1) })
    /// One spring for every change of size: lands with a little overshoot.
    static let resize = Animation.spring(duration: 0.44, bounce: 0.26)
}

// MARK: - The card

/// The one card: a white (dark: raised grey) rounded panel with a soft shadow. It takes the width
/// its step asks for and grows or shrinks to it with one spring; the words cross-fade.
struct SetupCard<Content: View>: View {
    let card: SetupCards.Card
    @ViewBuilder var content: Content
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 16, style: .continuous)
        content
            .id(card)
            .transition(.opacity.animation(.easeOut(duration: 0.18)))
            .padding(.horizontal, card == .gallery ? 24 : 26)
            .padding(.top, 26)
            .padding(.bottom, 22)
            .frame(width: SetupCards.width(card))
            // The shadow is the card's shape's alone: on the whole card SwiftUI casts it again under
            // every tile, word and button inside, a grey smear on the white (2026-10-30).
            .background {
                shape.fill(SetupCards.ground)
                    .shadow(color: .black.opacity(0.16), radius: 25, y: 18)
                    .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
            }
            .overlay(shape.strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5))
            .animation(reduceMotion ? .easeOut(duration: 0.2) : SetupCards.resize, value: card)
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("setup.card")
    }
}

/// One choice in a grid of three: the app's or the AI's own mark over its name.
private struct SetupTile<Mark: View>: View {
    let title: String
    let on: Bool
    let id: String
    let action: () -> Void
    @ViewBuilder var mark: Mark

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 12, style: .continuous)
        Button(action: action) {
            VStack(spacing: 7) {
                mark
                Text(title)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
            }
            .padding(.horizontal, 6)
            .frame(maxWidth: .infinity, minHeight: 76)
            .background(SetupCards.soft, in: shape)
            .overlay(shape.strokeBorder(Color.primary, lineWidth: on ? 2 : 0))
            .contentShape(shape)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityAddTraits(on ? .isSelected : [])
        .accessibilityIdentifier(id)
    }
}

/// One template on the gallery card: its cover, its name and its line on the cover's own ground,
/// like the website's cards. It lifts a little under the pointer.
struct SetupTemplateCard: View {
    let pick: SetupCards.Pick
    /// Wider in the template library, where the cards share the row; the height keeps the shape.
    var width: CGFloat = size.width
    /// The template library's look: the art alone, its name and line under it in the page's own
    /// text colours, so every card reads the same (Emil, 2026-10-30: not dark words on some, light on others).
    var captionBelow = false
    /// The open one, ringed.
    var selected = false
    let action: () -> Void
    @State private var hover = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static let size = CGSize(width: 164, height: 228)

    var body: some View {
        if captionBelow { below } else { onCover }
    }

    private var below: some View {
        let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)
        return Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                ZStack {
                    Color(rgb: pick.ground)
                    pick.image.resizable().scaledToFill()
                }
                .frame(width: width, height: width * 0.8)
                .clipShape(shape)
                .overlay(shape.strokeBorder(Color.black.opacity(0.12), lineWidth: 0.5))
                .overlay {
                    if selected { RoundedRectangle(cornerRadius: 17, style: .continuous).strokeBorder(Color.accentColor, lineWidth: 2.5).padding(-3) }
                }
                .shadow(color: .black.opacity(hover ? 0.22 : 0), radius: 12, y: 10)
                .offset(y: hover && !reduceMotion ? -3 : 0)
                VStack(alignment: .leading, spacing: 2) {
                    Text(pick.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.ink)
                    Text(pick.line).font(.system(size: 12)).foregroundStyle(Color.muted)
                        .lineLimit(2, reservesSpace: true)
                }
                .multilineTextAlignment(.leading)
                .padding(.horizontal, 2)
            }
            .frame(width: width, alignment: .leading)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .onHover { h in withAnimation(.smooth(duration: 0.2)) { hover = h } }
        .accessibilityLabel("\(pick.title). \(pick.line)")
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier("templates.\(pick.slug)")
    }

    private var onCover: some View {
        let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)
        let ink = pick.lightInk ? Color(red: 1, green: 0.957, blue: 0.902) : Color(red: 0.165, green: 0.114, blue: 0.063)
        return Button(action: action) {
            ZStack(alignment: .bottomLeading) {
                Color(rgb: pick.ground)
                VStack(spacing: 0) {
                    pick.image
                        .resizable()
                        .scaledToFill()
                        .frame(width: width, height: width)
                        .clipped()
                    Spacer(minLength: 0)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(pick.title)
                        .font(.system(size: 16, weight: .heavy))
                        .tracking(-0.2)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(pick.line)
                        .font(.system(size: 11.5, weight: .medium))
                        .opacity(0.86)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .foregroundStyle(ink)
                .multilineTextAlignment(.leading)
                .padding(.horizontal, 14)
                .padding(.bottom, 14)
            }
            .frame(width: width, height: width * Self.size.height / Self.size.width)
            .clipShape(shape)
            .overlay(shape.strokeBorder(Color.black.opacity(0.12), lineWidth: 0.5))
            .shadow(color: .black.opacity(hover ? 0.28 : 0), radius: 14, y: 12)
            .offset(y: hover && !reduceMotion ? -3 : 0)
            .contentShape(shape)
        }
        .buttonStyle(.plain)
        .onHover { h in withAnimation(.smooth(duration: 0.2)) { hover = h } }
        .accessibilityLabel("\(pick.title). \(pick.line)")
        .accessibilityIdentifier("setup.template.\(pick.slug)")
    }
}

extension Color {
    init(rgb: UInt32) {
        self.init(red: Double((rgb >> 16) & 255) / 255, green: Double((rgb >> 8) & 255) / 255, blue: Double(rgb & 255) / 255)
    }
}

// MARK: - Signed out

/// Signed out: the notes window, empty, with the sign-in card on it.
struct SetupSignInCard: View {
    let backend: Backend

    var body: some View {
        SetupCard(card: .signIn) {
            SignInView(backend: backend, heading: .short("Sign in to Pinto."))
        }
    }
}

// MARK: - The flow

/// The steps after sign-in, as cards over the notes (`SetupCards`).
struct SetupCardsFlow: View {
    /// Captures: a fixed card and what it shows.
    struct Preview {
        var card: SetupCards.Card
        var source: ImportOrigin = .appleNotes
        var ai: SetupCards.AI = .chatgpt
        var progress = 0.62
        var brought = 0
        var pick: SetupCards.Pick?
    }

    let store: OnboardingStore
    let backend: Backend
    var setup: SetupStore?
    var preview: Preview?
    /// The flow is over: the notes open on `landing`.
    let finish: (_ landing: Onboarding.Landing?) -> Void

    private enum Connecting: Equatable { case choosing, waiting, connected, set(connected: Bool) }

    @State private var source: ImportOrigin = .appleNotes
    @State private var ai: SetupCards.AI = .chatgpt
    @State private var connecting: Connecting = .choosing
    @State private var importingAppleNotes = false
    @State private var importing: ImportKind?
    @State private var brought = 0
    @State private var moveOnAfterImport = false
    @State private var making: SetupCards.Pick?
    /// Another AI's template: its note is added, and the ask waits to be copied.
    @State private var prompting: (pick: SetupCards.Pick, landing: Onboarding.Landing)?
    @State private var copied = false
    @State private var run = ConnectRun()
    @Environment(\.openURL) private var openURL
    @Environment(\.modelContext) private var context

    private var card: SetupCards.Card {
        if let preview { return preview.card }
        if prompting != nil { return .prompt }
        if making != nil { return .making }
        switch store.step ?? .bring {
        case .name, .bring: return importingAppleNotes || importing != nil ? .importing : .bring
        case .connect:
            switch connecting {
            case .choosing: return .connect
            case .waiting: return .waiting
            case .connected: return .connected
            case .set: return .set
            }
        case .tryIt: return .gallery
        }
    }

    private var shownSource: ImportOrigin { preview?.source ?? source }
    private var shownAI: SetupCards.AI { preview?.ai ?? ai }
    private var shownBrought: Int { preview?.brought ?? brought }

    var body: some View {
        SetupCard(card: card) { content }
            .task(id: store.step) { await skipName() }
            .sheet(isPresented: $importingAppleNotes, onDismiss: importClosed) {
                AppleNotesImportView(onImported: { ids in notesBrought(ids.count) })
            }
            .sheet(item: $importing, onDismiss: { EvernoteInbox.clear(); importClosed() }) { kind in
                ImportFlow(kind: kind) { ids in notesBrought(ids.count) }
            }
            .connectGuides(client: backend.client)
            .onAppear {
                run.asksToFinish = false
                run.connected = { _ in connectedNow() }
            }
            .onDisappear { run.stop(givingUp: false) }
    }

    @ViewBuilder private var content: some View {
        switch card {
        case .signIn: EmptyView()
        case .bring: bring
        case .importing: importingCard
        case .connect: connect
        case .waiting: waiting
        case .connected: connectedCard
        case .set: set
        case .gallery: gallery
        case .making: makingCard
        case .prompt: promptCard
        }
    }

    // MARK: Cards

    private func title(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 19, weight: .bold))
            .tracking(-0.2)
            .foregroundStyle(Color.ink)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityAddTraits(.isHeader)
            .accessibilityIdentifier("setup.title")
    }

    private let three = Array(repeating: GridItem(.flexible(), spacing: 8), count: 3)

    private var bring: some View {
        VStack(spacing: 16) {
            title(SetupCards.bringTitle)
            LazyVGrid(columns: three, spacing: 8) {
                ForEach(SetupCards.sources) { origin in
                    SetupTile(title: SetupCards.tileName(origin), on: shownSource == origin, id: "setup.source.\(origin.id)", action: { source = origin }) {
                        ImportSourceIcon(origin: origin, size: 30)
                    }
                }
            }
            if shownBrought > 0 {
                Label(SetupCards.brought(shownBrought), systemImage: "checkmark.circle.fill")
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(Color.muted)
            }
            HStack(spacing: 8) {
                Button("Skip") { skipBring() }
                    .buttonStyle(.secondary(.regular))
                    .accessibilityIdentifier("setup.skip")
                Button(SetupCards.importTitle(shownSource)) { startImport() }
                    .buttonStyle(.amberProminent(.regular, wide: true))
                    .keyboardShortcut(.defaultAction)
                    .accessibilityIdentifier("setup.import")
            }
        }
    }

    private var importingCard: some View {
        VStack(spacing: 14) {
            ImportSourceIcon(origin: shownSource, size: 44)
            title(SetupCards.bringingTitle)
            ProgressView(value: preview?.progress ?? 0.5)
                .progressViewStyle(.linear)
                .tint(Color.primary)
                .opacity(preview == nil ? 0 : 1)
            ProgressView().controlSize(.small).opacity(preview == nil ? 1 : 0).frame(height: preview == nil ? nil : 0)
        }
    }

    private var connect: some View {
        VStack(spacing: 16) {
            title(SetupCards.connectTitle)
            LazyVGrid(columns: three, spacing: 8) {
                ForEach(SetupCards.AI.allCases) { choice in
                    SetupTile(title: choice.tile, on: shownAI == choice, id: "setup.ai.\(choice.rawValue)", action: { ai = choice }) {
                        AITile(ai: choice.mark, size: 30)
                    }
                }
            }
            HStack(spacing: 8) {
                Button("Not now") { withAnimation { connecting = .set(connected: false) } }
                    .buttonStyle(.secondary(.regular))
                    .accessibilityIdentifier("setup.notNow")
                Button(shownAI.button) { startConnect() }
                    .buttonStyle(.amberProminent(.regular, wide: true))
                    .keyboardShortcut(.defaultAction)
                    .accessibilityIdentifier("setup.connect")
            }
            Text(shownAI.reads)
                .font(.system(size: 11))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("setup.reads")
        }
    }

    private var pair: some View {
        HStack(spacing: 10) {
            AppMark(size: 44)
            Text("\u{00B7}\u{00B7}\u{00B7}").font(.system(size: 15)).foregroundStyle(.tertiary)
            AITile(ai: shownAI.mark, size: 44)
        }
        .accessibilityHidden(true)
    }

    private var waiting: some View {
        VStack(spacing: 14) {
            pair
            title(SetupCards.finishTitle(shownAI))
            if shownAI == .other {
                Text(SetupCards.otherLine).font(.footnote).foregroundStyle(Color.muted).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            }
            HStack(spacing: 8) {
                ProgressView().controlSize(.small)
                Text("Waiting for \(shownAI.name)").font(.system(size: 13, weight: .medium)).foregroundStyle(Color.muted)
            }
            .frame(maxWidth: .infinity, minHeight: 34)
            .background(SetupCards.soft, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
            Button("Cancel") { run.stop(); withAnimation { connecting = .choosing } }
                .buttonStyle(.hoverLink)
                .font(.footnote)
                .foregroundStyle(Color.muted)
        }
    }

    private var connectedCard: some View {
        VStack(spacing: 14) {
            AITile(ai: shownAI.mark, size: 52)
                .overlay(alignment: .bottomTrailing) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(.white, .green)
                        .background(Circle().fill(SetupCards.ground).padding(-2.5))
                        .offset(x: 6, y: 6)
                }
            title(SetupCards.connectedTitle(shownAI))
        }
    }

    private var set: some View {
        VStack(spacing: 16) {
            title(SetupCards.setTitle)
            Button("Done") { done() }
                .buttonStyle(.amberProminent(.regular, wide: true))
                .keyboardShortcut(.defaultAction)
                .accessibilityIdentifier("setup.done")
        }
    }

    private var gallery: some View {
        VStack(spacing: 18) {
            title(SetupCards.galleryTitle(shownAI))
            HStack(spacing: 12) {
                ForEach(SetupCards.picks) { pick in
                    SetupTemplateCard(pick: pick) { make(pick) }
                }
            }
            HStack {
                Button(SetupCards.allTemplates) { openURL(TemplatesPromo.url) }
                    .buttonStyle(.hoverLink)
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(.tint)
                Spacer()
                Button("Skip") { finish(.newNote) }
                    .buttonStyle(.hoverLink)
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(Color.muted)
                    .accessibilityIdentifier("setup.skip")
            }
        }
    }

    private var makingCard: some View {
        VStack(spacing: 14) {
            ProgressView().controlSize(.regular)
            title(making.map(SetupCards.makingTitle) ?? "")
        }
    }

    private var promptCard: some View {
        let pick = preview?.pick ?? prompting?.pick ?? SetupCards.picks[0]
        return VStack(spacing: 14) {
            title(SetupCards.promptTitle)
            Text(SetupCards.prompt(pick))
                .font(.system(size: 13))
                .foregroundStyle(Color.ink)
                .textSelection(.enabled)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(SetupCards.soft, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                .accessibilityIdentifier("setup.prompt")
            Button { copyPrompt(pick) } label: {
                Label(copied ? SetupCards.copied : SetupCards.copyPrompt, systemImage: copied ? "checkmark" : "doc.on.doc")
            }
            .buttonStyle(.amberProminent(.regular, wide: true))
            .keyboardShortcut(.defaultAction)
            .accessibilityIdentifier("setup.copyPrompt")
        }
    }

    // MARK: What the buttons do

    /// The name is never asked on the card: Apple's or Google's, else the Mac's own.
    private func skipName() async {
        guard preview == nil, store.step == .name else { return }
        let profile = ProfileStore.shared
        await profile.bind(backend)
        if profile.name == nil, let mine = OnboardingFlow.macUserName() { await profile.setName(mine) }
        if store.step == .name { store.advance(connected: false) }
    }

    private func skipBring() {
        store.advance(connected: false, skipped: true)
    }

    private func startImport() {
        switch source {
        case .appleNotes: importingAppleNotes = true
        case .files(let kind): importing = kind
        }
    }

    private func notesBrought(_ count: Int) {
        guard count > 0 else { return }
        brought += count
        moveOnAfterImport = true
    }

    /// The import's sheet closed: after one that brought notes, the count shows a moment, then on.
    private func importClosed() {
        guard moveOnAfterImport else { return }
        moveOnAfterImport = false
        Task {
            try? await Task.sleep(for: .seconds(1.2))
            if store.step == .bring { store.advance(connected: false) }
        }
    }

    private func startConnect() {
        guard let client = backend.client else { return }
        withAnimation { connecting = .waiting }
        run.start(ai.guide, client: client, open: { openURL($0) })
    }

    private func connectedNow() {
        withAnimation { connecting = .connected }
        Task { await setup?.refresh(force: true) }
        Task {
            try? await Task.sleep(for: .seconds(1.4))
            if connecting == .connected { withAnimation { connecting = .set(connected: true) } }
        }
    }

    /// You're set: the gallery once an AI is connected, else the notes.
    private func done() {
        guard case .set(let connected) = connecting else { return }
        if connected, store.advance(connected: true) { return }
        finish(.newNote)
    }

    /// The template's note is added (as the website's "Use template" adds it), the AI opens with
    /// the ask in it, and the notes open on the note.
    private func make(_ pick: SetupCards.Pick) {
        guard preview == nil else { return }
        withAnimation { making = pick }
        Task {
            let model = NoteSourceModel(link: NoteSourceLink(kind: .template, slug: pick.slug), source: WebNoteSource(), ledger: NoteSourceLedger(account: backend.userID))
            await model.load(context: context)
            model.add(context: context, again: true)
            var landing: Onboarding.Landing = .newNote
            if case .added(_, let id, _) = model.phase {
                landing = .note(id)
                SyncSignal.changed()
            }
            if let page = SetupCards.page(ai, pick) {
                ConnectClipboard.set(SetupCards.prompt(pick))
                openURL(page)
                finish(landing)
            } else {
                withAnimation { prompting = (pick, landing) }
            }
        }
    }

    /// Copied, said on the button a moment, then the notes open on the template's note.
    private func copyPrompt(_ pick: SetupCards.Pick) {
        guard preview == nil, let landing = prompting?.landing else { return }
        ConnectClipboard.set(SetupCards.prompt(pick))
        withAnimation(.snappy(duration: 0.2)) { copied = true }
        Task {
            try? await Task.sleep(for: .seconds(0.9))
            finish(landing)
        }
    }
}
#endif
