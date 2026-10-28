import SwiftUI

/// iPhone and iPad: the welcome as three pages you swipe, each a real Pinto note with something
/// happening in it (PN design's direction, 28 October 2026, after Emil called the old welcome "a
/// printed static image"). One button stays put at the thumb; the person swipes, nothing
/// autoplays between pages. Each page's demo plays once when the page settles, then rests on its
/// last frame. With Reduce Motion the pages show their last frames and only fade.
///
/// Four looks to choose from (`WelcomeStyle`): A, the note card on the cream ground with the
/// words under it; B, the app's own screen running off the bottom edge, the words above; C, A's
/// card over the paper-craft picture, which fades into the ground behind the words; D, A bolder:
/// a warm amber wash, a bigger headline, and pages with their own shapes (an edge-to-edge list, a
/// real bottom sheet), already moving on the first frame.
enum WelcomeStyle: String, CaseIterable, Sendable {
    case card, device, scene, bold

    /// The look the app uses. A debug build takes `PINTO_WELCOME_STYLE=card|device|scene|bold` first.
    static var current: WelcomeStyle {
        #if DEBUG
        if let forced { return forced }
        if let s = ProcessInfo.processInfo.environment["PINTO_WELCOME_STYLE"].flatMap(WelcomeStyle.init(rawValue:)) { return s }
        #endif
        return .device
    }

    #if DEBUG
    nonisolated(unsafe) static var forced: WelcomeStyle?
    #endif
}

/// What each page says and shows.
enum WelcomePage: Int, CaseIterable, Identifiable, Sendable {
    case writes, appleNotes, asksFirst

    var id: Int { rawValue }

    var title: String {
        switch self {
        case .writes: "Your AI writes in your notes."
        case .appleNotes: "Feels like Apple Notes."
        case .asksFirst: "Nothing changes without you."
        }
    }

    /// The title as it's set: broken where it balances ("Your AI writes / in your notes.").
    var shownTitle: String {
        switch self {
        case .writes: "Your AI writes\nin your notes."
        case .appleNotes: "Feels like\nApple Notes."
        case .asksFirst: "Nothing changes\nwithout you."
        }
    }

    var line: String {
        switch self {
        case .writes: "Ask ChatGPT or Claude to plan, list or remember something. It lands right here."
        case .appleNotes: "Folders, checklists and tables, synced to your Mac. Bring your Apple Notes along."
        case .asksFirst: "Your AI asks before it reads or edits. Every change can be undone."
        }
    }

    /// How many steps the page's demo has; the last one is where it rests.
    var stages: Int {
        switch self {
        case .writes: 4
        case .appleNotes: 5
        case .asksFirst: 3
        }
    }
}

#if os(iOS)
/// The three pages, the dots and the way in.
struct WelcomePages: View {
    var style: WelcomeStyle = .current
    /// Captures: the page shown, and its demo held at a step (nil: as it plays).
    var page: WelcomePage = .writes
    var frozenStage: Int? = nil
    let start: () -> Void
    let haveAccount: () -> Void

    /// The way in, for UI tests (EmailConfirmUITests presses Get started).
    static let startID = "welcome.start"
    static let haveAccountID = "welcome.haveAccount"

    @State private var selection: WelcomePage
    @State private var stages: [WelcomePage: Int] = [:]
    @State private var startTaps = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize

    /// Captures: how far D's typing line has got (nil: all of it once frozen).
    var typingProgress: Double? = nil

    init(style: WelcomeStyle = .current, page: WelcomePage = .writes, frozenStage: Int? = nil, typingProgress: Double? = nil,
         start: @escaping () -> Void, haveAccount: @escaping () -> Void) {
        self.style = style
        self.page = page
        self.frozenStage = frozenStage
        self.typingProgress = typingProgress
        self.start = start
        self.haveAccount = haveAccount
        _selection = State(initialValue: page)
    }

    var body: some View {
        GeometryReader { screen in
            if style == .device, !typeSize.isAccessibilitySize {
                // B: the app's screen runs to the bottom edge, behind the way in, which floats on
                // the screen's fade into the page.
                pages(screen.size)
                    .ignoresSafeArea(.container, edges: .bottom)
                    .overlay(alignment: .bottom) { actions }
            } else {
                VStack(spacing: 0) {
                    pages(screen.size)
                    actions
                }
            }
        }
        .background {
            GeometryReader { g in
                ZStack(alignment: .top) {
                    ground
                    backdrop(stageHeight: (g.size.height + g.safeAreaInsets.top) * 0.5)
                }
                .ignoresSafeArea()
            }
        }
        .environment(\.welcomeTyping, frozenStage == nil ? nil : (typingProgress ?? 1))
        // Past this the headline and the button no longer fit beside anything else; the pages
        // scroll from the accessibility sizes on (`pageView`).
        .dynamicTypeSize(...DynamicTypeSize.accessibility2)
        .sensoryFeedback(.selection, trigger: selection)
        .task(id: selection) { await play(selection) }
        .accessibilityIdentifier("welcome.pages")
    }

    private func pages(_ size: CGSize) -> some View {
        TabView(selection: $selection) {
            ForEach(WelcomePage.allCases) { p in
                pageView(p, screen: size)
                    .tag(p)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .never))
    }

    /// The room the way in takes at the foot of B's screen (dots, Get started, I have an account).
    static let actionsRoom: CGFloat = 170

    // MARK: A page

    @ViewBuilder private func pageView(_ p: WelcomePage, screen: CGSize) -> some View {
        if typeSize.isAccessibilitySize {
            // The largest text sizes: the words need the room, so they come first and are never
            // cut; the demo follows at a fixed size (an illustration, with its own VoiceOver label)
            // and the page scrolls.
            ScrollView {
                VStack(spacing: 28) {
                    Words(page: p, centred: true, big: style == .bold).padding(.horizontal, 24)
                    WelcomeDemo(page: p, stage: stage(of: p), hero: true)
                        .dynamicTypeSize(.large)
                        .padding(.horizontal, 20)
                        .frame(maxWidth: 520)
                }
                .padding(.vertical, 24)
                .frame(maxWidth: .infinity)
            }
            .scrollBounceBehavior(.basedOnSize)
        } else {
            styled(p, screen: screen)
                // The demos are illustrations: their text grows a little with the setting, not past it.
                .dynamicTypeSize(...DynamicTypeSize.xLarge)
        }
    }

    @ViewBuilder private func styled(_ p: WelcomePage, screen: CGSize) -> some View {
        let stage = stage(of: p)
        let words = Words(page: p, centred: true, big: style == .bold)
        let stageHeight = screen.height * 0.5
        switch style {
        case .card, .scene, .bold:
            ZStack(alignment: .top) {
                VStack(spacing: 0) {
                    // The card's top is at one height on every page and it grows downward, so
                    // nothing jumps between pages or lifts as a line arrives. The words below keep
                    // their place too.
                    let edge = style == .bold && p == .appleNotes
                    WelcomeDemo(page: p, stage: stage, hero: true, edge: edge, sheet: style == .bold && p == .asksFirst,
                                typing: style == .bold)
                        .padding(.horizontal, edge ? 0 : 20)
                        .frame(maxWidth: edge ? .infinity : 520)
                        .padding(.top, 16)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                        .frame(height: stageHeight * 1.16)
                    words.padding(.horizontal, 28).padding(.top, 8)
                    Spacer(minLength: 0)
                }
            }
        case .device:
            VStack(spacing: 0) {
                // Every headline is two lines and every line two, so the screen starts at the
                // same height on every page.
                Words(page: p, centred: true, big: true, reserves: true).padding(.horizontal, 28).padding(.top, 20)
                // The app's own screen, full width, running to the bottom edge: not a drawn phone.
                // Its content stops above the way in; what's under the buttons fades into the page.
                AppScreen {
                    WelcomeDemo(page: p, stage: stage, onScreen: true, hero: true, sheet: p == .asksFirst, more: true)
                        // The sheet stands clear of the fade, so its buttons read at full strength.
                        .padding(.bottom, Self.actionsRoom + (p == .asksFirst ? 90 : 16))
                }
                .padding(.top, 24)
                .overlay(alignment: .bottom) {
                    LinearGradient(stops: [.init(color: Color(Palette.sheetGround).opacity(0), location: 0),
                                           .init(color: Color(Palette.sheetGround), location: 0.4)],
                                   startPoint: .top, endPoint: .bottom)
                        // Fades over 120 pt and is solid by the dots, so nothing shows behind them.
                        .frame(height: 300)
                        .allowsHitTesting(false)
                }
            }
        }
    }

    /// What lies behind the card: nothing (A), the paper-craft picture fading into the ground
    /// behind the words (C), or a warm amber wash (D).
    /// Behind the pages, not on them, so it reaches under the status bar and stays put as they swipe.
    @ViewBuilder private func backdrop(stageHeight: CGFloat) -> some View {
        switch style {
        case .scene:
            WelcomeFlow.picture()
                .frame(maxWidth: .infinity)
                .frame(height: stageHeight * 1.3)
                .clipped()
                .mask(LinearGradient(stops: [.init(color: .black, location: 0), .init(color: .black, location: 0.62), .init(color: .clear, location: 1)],
                                     startPoint: .top, endPoint: .bottom))
                .ignoresSafeArea(edges: .top)
        case .bold:
            LinearGradient(stops: [.init(color: Color(Palette.amber).opacity(0.32), location: 0),
                                   .init(color: Color(Palette.amber).opacity(0.14), location: 0.55),
                                   .init(color: .clear, location: 1)],
                           startPoint: .top, endPoint: .bottom)
                .frame(height: stageHeight * 1.5)
                .ignoresSafeArea(edges: .top)
        default:
            EmptyView()
        }
    }

    private struct Words: View {
        let page: WelcomePage
        let centred: Bool
        /// D's and B's headline: bigger and heavier.
        var big = false
        /// B: two lines held for the headline and two for the line, filled or not.
        var reserves = false

        var body: some View {
            VStack(alignment: centred ? .center : .leading, spacing: 10) {
                Text(page.shownTitle)
                    .font(.system(size: big ? 40 : 34, weight: big ? .heavy : .bold))
                    .tracking(big ? -1 : -0.6)
                    .foregroundStyle(Color.ink)
                    .lineLimit(2)
                    .minimumScaleFactor(0.7)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityLabel(page.title)
                    .accessibilityIdentifier("welcome.title")
                Text(page.line)
                    .font(.body)
                    .foregroundStyle(Color.muted)
                    .lineSpacing(2)
                    .lineLimit(reserves ? 2 : 4, reservesSpace: reserves)
                    .accessibilityIdentifier("welcome.line")
            }
            .multilineTextAlignment(centred ? .center : .leading)
            .frame(maxWidth: 440, alignment: centred ? .center : .leading)
            .frame(maxWidth: .infinity, alignment: centred ? .center : .leading)
            .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: The way in

    private var actions: some View {
        VStack(spacing: 14) {
            Dots(count: WelcomePage.allCases.count, on: selection.rawValue)
            Button {
                startTaps += 1
                start()
            } label: {
                Text("Get started")
            }
            // Pressed it darkens and settles to 0.97 (ButtonChrome).
            .buttonStyle(.amberProminent(.form, wide: true))
            .sensoryFeedback(.impact(weight: .light), trigger: startTaps)
            .accessibilityIdentifier(Self.startID)
            Button("I have an account", action: haveAccount)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.amberInk)
                .frame(minHeight: 36)
                .accessibilityIdentifier(Self.haveAccountID)
        }
        .padding(.horizontal, 24)
        .padding(.top, 8)
        .padding(.bottom, 4)
        .frame(maxWidth: WelcomeFlow.readableWidth)
        .frame(maxWidth: .infinity)
    }

    private var ground: some View {
        Color(Palette.sheetGround).ignoresSafeArea()
    }

    // MARK: The demo's clock

    private func stage(of p: WelcomePage) -> Int {
        if let frozenStage { return p == page ? frozenStage : p.stages - 1 }
        if reduceMotion { return p.stages - 1 }
        return stages[p] ?? opening(p)
    }

    /// Where a page's demo starts. D's first page is already moving on the very first frame:
    /// Claude is editing and its line is typing in.
    private func opening(_ p: WelcomePage) -> Int {
        style == .bold && p == .writes ? 2 : 0
    }

    /// Plays a page's demo once, after the swipe has settled; a page seen before stays as it ended.
    private func play(_ p: WelcomePage) async {
        guard frozenStage == nil, !reduceMotion, stages[p] == nil else { return }
        let first = opening(p)
        stages[p] = first
        // D's first page types from the first frame: its next step waits for the line to finish.
        try? await Task.sleep(for: .milliseconds(first > 0 ? 1300 : 450))
        for s in (first + 1)..<p.stages {
            guard !Task.isCancelled else {
                stages[p] = p.stages - 1
                return
            }
            withAnimation(.spring(response: 0.42, dampingFraction: 0.8)) { stages[p] = s }
            try? await Task.sleep(for: .milliseconds(p.pause(after: s)))
        }
    }
}

private extension WelcomePage {
    /// How long each step holds before the next.
    func pause(after stage: Int) -> Int {
        switch (self, stage) {
        case (.writes, 1): 650
        case (.appleNotes, _): 260
        case (.asksFirst, 1): 700
        default: 800
        }
    }
}

/// The page dots: the one you're on is a short amber bar.
private struct Dots: View {
    let count: Int
    let on: Int

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<count, id: \.self) { i in
                Capsule()
                    .fill(i == on ? AnyShapeStyle(Color(Palette.amber)) : AnyShapeStyle(Color.ink.opacity(0.18)))
                    .frame(width: i == on ? 20 : 7, height: 7)
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: on)
        .accessibilityElement()
        .accessibilityLabel("Page \(on + 1) of \(count)")
    }
}

/// B's hero: the app's own screen, full width, its top corners rounded like the display's, running
/// off the bottom of the page.
private struct AppScreen<Content: View>: View {
    @ViewBuilder var content: Content

    /// White on the cream page; in the dark a step lighter than the page, so it reads as a screen.
    private var ground: Color { AppScreenLook.ground }
    private var edge: Color { AppScreenLook.edge }

    var body: some View {
        let shape = UnevenRoundedRectangle(topLeadingRadius: 34, topTrailingRadius: 34, style: .continuous)
        // The content is drawn over the screen, not sized by it: a longer list runs on under the
        // fade and never pushes the headline above it off the page.
        Color.clear
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .overlay(alignment: .top) { content.padding(.top, 10) }
            .background(ground, in: shape)
            .overlay(shape.stroke(edge, lineWidth: 0.5))
            .clipShape(shape)
            .shadow(color: .black.opacity(0.08), radius: 24, y: -2)
    }
}

private enum AppScreenLook {
    static let ground = Color(light: .white, dark: Color(Palette.card))
    static let edge = Color(light: Color(uiColor: .separator).opacity(0.5), dark: Color.white.opacity(0.14))
}

// MARK: The demos

/// One page's live moment, built from the app's own parts. `stage` runs from 0 to the page's
/// last step, where it rests.
struct WelcomeDemo: View {
    let page: WelcomePage
    let stage: Int
    /// Inside B's phone: the note fills the screen instead of floating as a card.
    var onScreen = false
    /// A's note card: wide, at the editor's own sizes (17 pt text, 28 pt title), with the note's
    /// navigation row above the title, as the app draws it.
    var hero = false
    /// D, page 2: the list runs edge to edge instead of sitting in a card.
    var edge = false
    /// D, page 3: the Allow sheet rises from the bottom like the system's own sheet.
    var sheet = false
    /// D: Claude's line types itself into the note instead of rolling in.
    var typing = false
    /// B: more of the note or the list, so the screen is full down to where it fades.
    var more = false

    var body: some View {
        switch page {
        case .writes: WritesDemo(stage: stage, look: look)
        case .appleNotes: AppleNotesDemo(stage: stage, look: look)
        case .asksFirst: AsksFirstDemo(stage: stage, look: look)
        }
    }

    private var look: DemoLook { DemoLook(onScreen: onScreen, hero: hero, edge: edge, sheet: sheet, typing: typing, more: more) }
}

struct DemoLook {
    var onScreen = false
    var hero = false
    var edge = false
    var sheet = false
    var typing = false
    var more = false

    var title: Font { hero ? .system(size: 28, weight: .bold) : onScreen ? .title3.weight(.bold) : .title2.weight(.bold) }
}

/// The soft amber behind an AI's line: the app's own in the light; in the dark the accent at 18%,
/// which reads as amber rather than brown.
private let freshFill = Color(light: Color(Palette.amberSoft), dark: Color(Palette.amber).opacity(0.18))

/// A note page as a card: the note's own ground, a hairline and the shared soft shadow.
private struct NoteCard<Content: View>: View {
    var look = DemoLook()
    /// The note's navigation row: where Back goes.
    var back: String? = nil
    @ViewBuilder var content: Content

    var body: some View {
        let flat = look.onScreen || look.edge
        let shape = RoundedRectangle(cornerRadius: flat ? 0 : look.hero ? 24 : 20, style: .continuous)
        VStack(alignment: .leading, spacing: 0) {
            if look.hero, let back {
                HStack(spacing: 4) {
                    Image(systemName: "chevron.left").font(.body.weight(.semibold))
                    Text(back).font(.body)
                    Spacer(minLength: 0)
                    Image(systemName: "square.and.arrow.up").font(.body)
                }
                .foregroundStyle(Color(Palette.amber))
                .padding(.bottom, 14)
            }
            content
        }
        .padding(.horizontal, look.hero ? 20 : 18)
        .padding(.top, look.hero ? 14 : 18)
        .padding(.bottom, look.hero ? 22 : 18)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        // On B's screen the screen is the ground.
        .background(look.onScreen ? Color.clear : Color.card, in: shape)
        .overlay {
            if look.edge {
                // Edge to edge, like a list: hairlines above and below, no corners.
                VStack { Divider(); Spacer(); Divider() }
            } else if !look.onScreen {
                shape.strokeBorder(Color.line, lineWidth: 0.5)
            }
        }
        .shadow(color: flat ? .clear : Color(Palette.shadow), radius: 22, y: 10)
    }
}

/// A checklist line as the editor draws it.
private struct CheckRow: View {
    let text: String
    var done = false
    var fresh = false
    /// The line types itself in (D).
    var typing = false

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.body)
                .foregroundStyle(done ? AnyShapeStyle(Color(Palette.amber)) : AnyShapeStyle(Color.muted.opacity(0.6)))
            TypingText(text: text, typing: typing)
                .font(.body)
                .foregroundStyle(done ? Color.muted : Color.ink)
                .strikethrough(done, color: Color.muted)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 5)
        .padding(.horizontal, 8)
        .background(fresh ? freshFill : .clear, in: .rect(cornerRadius: 8, style: .continuous))
        .padding(.horizontal, -8)
    }
}

/// "Claude" on its tile, as a pill: who is at work in the note.
private struct AIBadge: View {
    let ai: String
    let text: String

    var body: some View {
        HStack(spacing: 7) {
            AITile(ai: ai, size: 22)
            Text(text).font(.footnote.weight(.semibold)).foregroundStyle(Color.amberInk)
        }
        .padding(.leading, 4)
        .padding(.trailing, 12)
        .padding(.vertical, 4)
        .background(freshFill, in: .capsule)
    }
}

/// The receipt the editor shows after an AI's edit: what changed, and Undo.
private struct UndoChip: View {
    let ai: String
    let text: String

    var body: some View {
        HStack(spacing: 10) {
            AIGlyph(ai: ai, size: 15)
            Text(text).font(.subheadline.weight(.semibold)).foregroundStyle(Color.ink)
            Divider().frame(height: 16)
            Text("Undo").font(.subheadline.weight(.semibold)).foregroundStyle(Color.amberInk)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.card, in: .capsule)
        .overlay(Capsule().strokeBorder(Color.line, lineWidth: 0.5))
        .shadow(color: Color(Palette.shadow), radius: 12, y: 5)
    }
}

/// The trial note, the same one Try it uses later: one thread through the onboarding.
enum RunningPlan {
    static let title = "Running plan"
    static let lines = ["Easy 5 km on Monday", "Intervals on Wednesday", "Long run on Sunday, 14 km"]
    static let added = "Rest day Thursday, 10 min stretch"
    /// The note goes on below the checklist, as a real one does.
    static let notes = "Goal: the half marathon on 14 March."
}

/// Page 3's note: a different one, so the page isn't page 1 again.
enum LisbonTrip {
    static let title = "Lisbon trip"
    static let lines = ["Flights on the 12th, 07:40", "Book the tram tour", "Pastéis de nata in Belém"]
}

/// Page 1: Claude starts editing, a line rolls into the plan with the AI's soft amber, and the
/// receipt with Undo rises over the card's foot.
private struct WritesDemo: View {
    let stage: Int
    let look: DemoLook

    var body: some View {
        NoteCard(look: look, back: "Notes") {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(RunningPlan.title).font(look.title).foregroundStyle(Color.ink)
                    Spacer(minLength: 8)
                    AIBadge(ai: "Claude", text: "Editing")
                        .opacity(stage >= 1 ? 1 : 0)
                        .scaleEffect(stage >= 1 ? 1 : 0.6, anchor: .trailing)
                }
                .padding(.bottom, 6)
                CheckRow(text: RunningPlan.lines[0], done: true)
                CheckRow(text: RunningPlan.lines[1])
                if stage >= 2 {
                    CheckRow(text: RunningPlan.added, fresh: true, typing: look.typing)
                        .transition(look.typing ? .opacity : .asymmetric(insertion: .offset(y: 14).combined(with: .opacity), removal: .opacity))
                }
                CheckRow(text: RunningPlan.lines[2])
                if look.more {
                    Text(RunningPlan.notes)
                        .font(.body)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 12)
                }
            }
            // Room under the last line for the receipt that sits over the card's edge.
            .padding(.bottom, 12)
        }
        .overlay(alignment: .bottom) {
            UndoChip(ai: "Claude", text: "Claude added a line")
                .opacity(stage >= 3 ? 1 : 0)
                .scaleEffect(stage >= 3 ? 1 : 0.25)
                .blur(radius: stage >= 3 ? 0 : 4)
                // Half on the card, half off it, like the editor's own receipt.
                .offset(y: 21)
        }
        .padding(.bottom, 21)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("A note called Running plan. Claude adds a line to it, and you can undo it.")
    }
}

/// Page 2: your Apple Notes, counted under their icon, roll in one by one.
private struct AppleNotesDemo: View {
    let stage: Int
    let look: DemoLook

    static let count = 142
    static let rows: [(String, String)] = [("Groceries", "Oat milk, lemons, rice"), ("Books to read", "The Overstory, Piranesi"),
                                           ("Lisbon trip", "Flights on the 12th"), ("Gift ideas", "Mum: a good teapot")]
    /// B: the list goes on into the fade.
    static let moreRows: [(String, String)] = [("Recipes", "Sunday dal, green curry"), ("Garden", "Plant the garlic in November")]

    private var shownRows: [(String, String)] { look.more ? Self.rows + Self.moreRows : Self.rows }

    var body: some View {
        NoteCard(look: look, back: "Folders") {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 12) {
                    ImportSourceIcon(origin: .appleNotes, size: look.hero ? 40 : 30)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("From Apple Notes").font(look.hero ? .title3.weight(.bold) : .headline).foregroundStyle(Color.ink)
                        Text("\(Self.count) notes").font(.subheadline).foregroundStyle(Color.muted)
                    }
                }
                .padding(.bottom, 14)
                .accessibilityElement(children: .combine)
                ForEach(Array(shownRows.enumerated()), id: \.offset) { i, row in
                    // The rows past the first four are already there (they run into the fade).
                    let shown = stage > i || i >= Self.rows.count
                    VStack(alignment: .leading, spacing: 2) {
                        Divider().padding(.bottom, 9)
                        Text(row.0).font(.body.weight(.semibold)).foregroundStyle(Color.ink)
                        Text(row.1).font(.subheadline).foregroundStyle(Color.muted).lineLimit(1)
                    }
                    .padding(.bottom, 9)
                    // Each row keeps its room, so the card never grows as they arrive.
                    .opacity(shown ? 1 : 0)
                    .offset(y: shown ? 0 : 14)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Your Apple Notes arrive in Pinto Notes, \(Self.count) of them.")
    }
}

/// Page 3: another note dims as Claude asks to edit it; the Allow sheet rises over it, and the
/// page rests with Allow pressed: nothing happens until you say so.
private struct AsksFirstDemo: View {
    let stage: Int
    let look: DemoLook

    var body: some View {
        if look.sheet { sheetLayout } else { cardLayout }
    }

    private var note: some View {
        NoteCard(look: look, back: "Notes") {
            VStack(alignment: .leading, spacing: 4) {
                Text(LisbonTrip.title).font(look.title).foregroundStyle(Color.ink).padding(.bottom, 6)
                ForEach(LisbonTrip.lines, id: \.self) { CheckRow(text: $0) }
            }
            .padding(.bottom, look.sheet ? 0 : look.hero ? 64 : 40)
        }
    }

    /// D: the note dims and the sheet rises from the bottom of the page's picture, floating with
    /// the system's margins and grabber, as a sheet does in iOS 26.
    private var sheetLayout: some View {
        ZStack(alignment: .bottom) {
            note
                .blur(radius: stage >= 1 ? 2 : 0)
                .opacity(stage >= 1 ? 0.5 : 1)
                .frame(maxHeight: .infinity, alignment: .top)
            if stage >= 1 {
                AllowCard(note: LisbonTrip.title, pressed: stage >= 2, sheet: true)
                    .padding(.horizontal, look.onScreen ? 8 : -12)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .frame(maxHeight: .infinity)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Claude asks to edit your note Lisbon trip, and waits for you to allow it.")
    }

    private var cardLayout: some View {
        note
        .blur(radius: stage >= 1 ? 2 : 0)
        .opacity(stage >= 1 ? 0.5 : 1)
        .overlay(alignment: .bottom) {
            if stage >= 1 {
                AllowCard(note: LisbonTrip.title, pressed: stage >= 2)
                    .padding(.horizontal, look.onScreen ? 6 : 12)
                    .offset(y: 28)
                    .transition(.asymmetric(insertion: .offset(y: 40).combined(with: .opacity), removal: .opacity))
            }
        }
        .padding(.bottom, 28)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Claude asks to edit your note Lisbon trip, and waits for you to allow it.")
    }
}

/// The Allow sheet, small: who asks, for which note, and the two answers.
private struct AllowCard: View {
    let note: String
    let pressed: Bool
    /// As a system sheet: larger corners, the grabber, more room.
    var sheet = false

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: sheet ? 34 : 22, style: .continuous)
        VStack(spacing: 12) {
            if sheet {
                Capsule().fill(Color.muted.opacity(0.35)).frame(width: 36, height: 5).padding(.top, -6).padding(.bottom, 4)
            }
            AITile(ai: "Claude", size: sheet ? 48 : 40)
            Text("Claude wants to edit \u{201C}\(note)\u{201D}")
                .font(.headline)
                .foregroundStyle(Color.ink)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 10) {
                Text("Don\u{2019}t allow")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color.ink)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(Color.soft, in: .capsule)
                Text("Allow")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    // Pressed: darker and a touch smaller, as the app's own button.
                    .background(Color(Palette.amberButton), in: .capsule)
                    .overlay { if pressed { Capsule().fill(.black.opacity(0.14)) } }
                    .scaleEffect(pressed ? 0.97 : 1)
            }
        }
        .padding(sheet ? 20 : 16)
        .background(Color.card, in: shape)
        .overlay(shape.strokeBorder(Color.line, lineWidth: 0.5))
        .shadow(color: Color(Palette.shadow), radius: sheet ? 30 : 20, y: sheet ? -4 : 8)
    }
}

/// How far a typing line has got: nil while it types live; captures set a fraction (1 = all).
private struct WelcomeTypingKey: EnvironmentKey { static let defaultValue: Double? = nil }

extension EnvironmentValues {
    var welcomeTyping: Double? {
        get { self[WelcomeTypingKey.self] }
        set { self[WelcomeTypingKey.self] = newValue }
    }
}

/// A line that types itself in, about 30 characters a second, keeping its full size from the
/// start so nothing around it moves. Reduce Motion shows it whole.
private struct TypingText: View {
    let text: String
    var typing = false
    @State private var started = Date.now
    @Environment(\.welcomeTyping) private var fixed
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static let duration = 1.1

    var body: some View {
        if !typing || reduceMotion {
            Text(text)
        } else if let fixed {
            shown(fixed)
        } else {
            TimelineView(.animation(paused: false)) { context in
                shown(min(1, context.date.timeIntervalSince(started) / Self.duration))
            }
        }
    }

    private func shown(_ fraction: Double) -> some View {
        let count = Int((Double(text.count) * fraction).rounded())
        return ZStack(alignment: .topLeading) {
            Text(text).hidden()
            Text(String(text.prefix(count))) + Text(fraction < 1 ? "\u{258F}" : "").foregroundStyle(Color(Palette.amber))
        }
    }
}
#endif
