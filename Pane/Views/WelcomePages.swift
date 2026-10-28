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
        return .scene
    }

    #if DEBUG
    nonisolated(unsafe) static var forced: WelcomeStyle?
    #endif
}

/// How C's desk scene meets the words (Emil liked C but not its fade): C1 the scene framed in an
/// inset rounded picture; C2 edge to edge at the top, ending in a straight line; C3 the whole
/// screen, the words on a solid sheet over it; C4 like C2 with an arched foot; C5 no note card,
/// a few small pieces of the app floating on the framed scene like stickers; C6 a collage of round
/// crops of the desk, the words above; C7 the website's own look: its paper-craft art framed, the
/// chat from its "Plan it with ChatGPT" film floating over it, and its highlighter on the headline.
enum SceneLook: String, CaseIterable, Sendable {
    case framed, hardEdge, sheet, arch, fragments, collage, site

    /// A debug build takes `PINTO_WELCOME_SCENE=framed|hardEdge|…` first.
    static var current: SceneLook {
        #if DEBUG
        if let s = ProcessInfo.processInfo.environment["PINTO_WELCOME_SCENE"].flatMap(SceneLook.init(rawValue:)) { return s }
        #endif
        return .site
    }

    /// "C1" to "C7", as the review names them.
    var name: String { "C\((Self.allCases.firstIndex(of: self) ?? 0) + 1)" }

    /// The scene carries the note card (C1 to C4); C5 and C6 show pieces of the app instead.
    var hasCard: Bool { ![.fragments, .collage, .site].contains(self) }
}

/// C7's foot, after Emil found the dots, the full-width amber button and the link under it
/// unprofessional: F1 a dark capsule with "Already have an account? Sign in"; F2 Apple's own
/// controls; F3 Continue page by page, Sign in at the top; F4 from "WanderWise": a compact amber
/// capsule, the wordmark on top, small dots under the line; F5 from "Family, Simplified": bars
/// across the top with Back, a compact dark "Next".
enum WelcomeFooter: String, CaseIterable, Sendable {
    case f1, f2, f3, f4, f5, f6

    static var current: WelcomeFooter {
        #if DEBUG
        if let s = ProcessInfo.processInfo.environment["PINTO_WELCOME_FOOTER"].flatMap(WelcomeFooter.init(rawValue:)) { return s }
        #endif
        return .f4
    }

    var name: String { rawValue.uppercased() }
    /// Sign in sits at the top right instead of under the button.
    var signInOnTop: Bool { [.f3, .f4, .f5, .f6].contains(self) }
    /// The main button moves page by page (Continue, Next) and says Get started on the last.
    var stepsThrough: Bool { [.f3, .f5, .f6].contains(self) }
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
    /// C's treatment of the scene.
    var sceneLook: SceneLook = .current
    /// Segmented bars at the top in place of the dots (tried on C5).
    var bars = false
    /// C7's foot.
    var footer: WelcomeFooter = .current
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
    @State private var finishTaps = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize

    /// Captures: how far D's typing line has got (nil: all of it once frozen).
    var typingProgress: Double? = nil
    /// Captures: F6's Next part way to Get started (0 to 1).
    var widenProgress: Double? = nil

    init(style: WelcomeStyle = .current, sceneLook: SceneLook = .current, bars: Bool = false, footer: WelcomeFooter = .current,
         page: WelcomePage = .writes,
         frozenStage: Int? = nil, typingProgress: Double? = nil, widenProgress: Double? = nil,
         start: @escaping () -> Void, haveAccount: @escaping () -> Void) {
        self.style = style
        self.sceneLook = sceneLook
        self.bars = bars
        self.footer = footer
        self.page = page
        self.frozenStage = frozenStage
        self.typingProgress = typingProgress
        self.widenProgress = widenProgress
        self.start = start
        self.haveAccount = haveAccount
        _selection = State(initialValue: page)
    }

    var body: some View {
        GeometryReader { screen in
            if isSite, !typeSize.isAccessibilitySize {
                siteLayout(screen.size)
            } else if style == .device, !typeSize.isAccessibilitySize {
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
                    backdrop(stageHeight: (g.size.height + g.safeAreaInsets.top) * 0.5, top: g.safeAreaInsets.top, height: g.size.height,
                             width: g.size.width)
                }
                .ignoresSafeArea()
            }
        }
        .overlay(alignment: .top) {
            if bars { Bars(count: WelcomePage.allCases.count, on: selection.rawValue).padding(.horizontal, 24).padding(.top, 6) }
        }
        .environment(\.welcomeTyping, frozenStage == nil ? nil : (typingProgress ?? 1))
        // Past this the headline and the button no longer fit beside anything else; the pages
        // scroll from the accessibility sizes on (`pageView`).
        .dynamicTypeSize(...DynamicTypeSize.accessibility2)
        .sensoryFeedback(.selection, trigger: selection)
        .task(id: selection) { await play(selection) }
        .accessibilityIdentifier("welcome.pages")
    }

    private var isSite: Bool { style == .scene && sceneLook == .site }

    /// C7: the top row (wordmark, Sign in, bars), the pages, and the foot, which sits a set
    /// distance above the home indicator on every page.
    private func siteLayout(_ size: CGSize) -> some View {
        VStack(spacing: 0) {
            siteTop
            pages(size)
            siteFoot
                .padding(.horizontal, 24)
                .padding(.bottom, 20)
        }
    }

    private var last: Bool { selection == WelcomePage.allCases.last }

    @ViewBuilder private var siteTop: some View {
        switch footer {
        case .f1, .f2:
            EmptyView()
        case .f3, .f6:
            HStack { Spacer(); signInLink(ink: footer == .f6) }.padding(.horizontal, 20).frame(height: 40)
        case .f4:
            ZStack {
                HStack(spacing: 7) {
                    AppMark(size: 24)
                    Text("Pinto Notes").font(.system(size: 17, weight: .semibold)).foregroundStyle(Color.ink)
                }
                .accessibilityElement(children: .combine)
                HStack { Spacer(); signInLink(ink: false) }
            }
            .padding(.horizontal, 20)
            .frame(height: 44)
        case .f5:
            HStack(spacing: 12) {
                if selection != .writes {
                    Button { back() } label: {
                        Image(systemName: "chevron.left").font(.subheadline.weight(.semibold)).foregroundStyle(Color.ink)
                            .frame(width: 36, height: 36)
                            .background(Color.card, in: .circle)
                            .shadow(color: Color(Palette.shadow), radius: 8, y: 3)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Back")
                    .transition(.opacity)
                }
                Bars(count: WelcomePage.allCases.count, on: selection.rawValue, ink: true)
                signInLink(ink: true)
            }
            .padding(.horizontal, 20)
            .frame(height: 44)
            .animation(.easeOut(duration: 0.2), value: selection)
        }
    }

    @ViewBuilder private var siteFoot: some View {
        VStack(spacing: 0) {
            switch footer {
            case .f1:
                SmallDots(count: WelcomePage.allCases.count, on: selection.rawValue, size: 7, active: Color.ink, rest: Color.ink.opacity(0.22))
                    .padding(.top, 20).padding(.bottom, 28)
                startButton.buttonStyle(.welcomeCapsule(.darkWide))
                Button(action: haveAccount) {
                    (Text("Already have an account? ").foregroundStyle(Color.muted) + Text("Sign in").fontWeight(.semibold).foregroundStyle(Color.ink))
                        .font(.subheadline)
                }
                .buttonStyle(.plain)
                .frame(minHeight: 44)
                .padding(.top, 6)
                .accessibilityIdentifier(Self.haveAccountID)
            case .f2:
                SmallDots(count: WelcomePage.allCases.count, on: selection.rawValue, size: 8, active: Color.primary, rest: Color.primary.opacity(0.25))
                    .padding(.top, 20).padding(.bottom, 28)
                startButton
                    .frame(maxWidth: .infinity)
                    .modifier(WelcomeNativeProminent())
                Button("Sign in", action: haveAccount)
                    .buttonStyle(.borderless)
                    .frame(minHeight: 44)
                    .padding(.top, 4)
                    .accessibilityIdentifier(Self.haveAccountID)
            case .f3:
                SmallDots(count: WelcomePage.allCases.count, on: selection.rawValue, size: 7, active: Color(Palette.amber), rest: Color.ink.opacity(0.18))
                    .padding(.top, 28).padding(.bottom, 20)
                startButton.buttonStyle(.amberProminent(.form, wide: true))
            case .f4:
                SmallDots(count: WelcomePage.allCases.count, on: selection.rawValue, size: 6, active: Color(Palette.amber), rest: Color.ink.opacity(0.16))
                    .padding(.top, 20).padding(.bottom, 36)
                startButton.buttonStyle(.welcomeCapsule(.amberCompact))
            case .f5:
                startButton.buttonStyle(.welcomeCapsule(.darkCompact))
                    .padding(.top, 56)
            case .f6:
                // One row: the bars at the left, Next at the right. On the last page the bars give
                // way and Next widens into Get started.
                GeometryReader { g in
                    let wide = widenProgress ?? (last ? 1 : 0)
                    HStack(spacing: 0) {
                        JumpBars(count: WelcomePage.allCases.count, on: selection.rawValue) { i in
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.82)) { selection = WelcomePage(rawValue: i) ?? .writes }
                        }
                        .opacity(1 - wide)
                        // The bars give up their room as Next widens.
                        .frame(width: JumpBars.width * (1 - wide), alignment: .leading)
                        .clipped()
                        Spacer(minLength: 0)
                        startButton
                            .buttonStyle(.welcomeCapsule(.morph(last: wide > 0.5)))
                            .frame(width: Self.nextWidth + (g.size.width - Self.nextWidth) * wide)
                    }
                    .frame(height: g.size.height)
                    .animation(.spring(response: 0.35, dampingFraction: 0.85), value: last)
                }
                .frame(height: ButtonSize.big.height)
                .padding(.top, 36)
                .padding(.horizontal, 4)
                .sensoryFeedback(.success, trigger: finishTaps)
            }
        }
    }

    /// F6's Next, hugging its words.
    static let nextWidth: CGFloat = 112

    /// The foot's main button: Get started, or on F3, F5 and F6 the next page until the last.
    private var startButton: some View {
        Button {
            if footer.stepsThrough, !last {
                startTaps += 1
                advance(from: selection)
            } else {
                if footer == .f6 { finishTaps += 1 } else { startTaps += 1 }
                start()
            }
        } label: {
            switch footer {
            case .f3: Text(last ? "Get started" : "Continue")
            case .f5, .f6: Text(last ? (footer == .f6 ? "Get started" : "Get started \u{2192}") : "Next \u{2192}")
            default: Text("Get started").frame(maxWidth: footer == .f2 ? .infinity : nil)
            }
        }
        .sensoryFeedback(.impact(weight: .light), trigger: startTaps)
        .accessibilityIdentifier(Self.startID)
    }

    private func signInLink(ink: Bool) -> some View {
        Button("Sign in", action: haveAccount)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(ink ? Color.ink : Color.amberInk)
            .buttonStyle(.plain)
            .frame(minWidth: 44, minHeight: 44)
            .accessibilityIdentifier(Self.haveAccountID)
    }

    private func back() {
        let prev = WelcomePage(rawValue: max(0, selection.rawValue - 1)) ?? .writes
        withAnimation(.spring(response: 0.4, dampingFraction: 0.82)) { selection = prev }
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

    /// Tapping the picture moves on, so a tap there never does nothing; the last page goes back
    /// to the first.
    private func advance(from p: WelcomePage) {
        let next = WelcomePage(rawValue: (p.rawValue + 1) % WelcomePage.allCases.count) ?? .writes
        withAnimation(.spring(response: 0.4, dampingFraction: 0.82)) { selection = next }
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
        case .scene where sceneLook == .fragments:
            VStack(spacing: 0) {
                Fragments(page: p, stage: stage)
                    .frame(height: stageHeight * 1.16)
                    .contentShape(.rect)
                    .onTapGesture { advance(from: p) }
                    .accessibilityAddTraits(.isButton)
                    .accessibilityHint("Shows the next page")
                words.padding(.horizontal, 28).padding(.top, 8)
                Spacer(minLength: 0)
            }
        case .scene where sceneLook == .site:
            // The art takes whatever the words leave, so the words end right above the foot on
            // every page: no band of empty page between them.
            VStack(spacing: 28) {
                SiteArt(page: p, stage: stage)
                    .padding(.horizontal, 16)
                    .frame(maxHeight: .infinity)
                    .contentShape(.rect)
                    .onTapGesture { advance(from: p) }
                    .accessibilityAddTraits(.isButton)
                    .accessibilityHint("Shows the next page")
                MarkedWords(page: p, footer: footer).padding(.horizontal, 28)
            }
            .padding(.top, 4)
        case .scene where sceneLook == .collage:
            VStack(spacing: 0) {
                words.padding(.horizontal, 28).padding(.top, 28)
                Collage(page: p, stage: stage)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .contentShape(.rect)
                    .onTapGesture { advance(from: p) }
                    .accessibilityAddTraits(.isButton)
                    .accessibilityHint("Shows the next page")
            }
        case .card, .scene, .bold:
            ZStack(alignment: .top) {
                VStack(spacing: 0) {
                    // The card's top is at one height on every page and it grows downward, so
                    // nothing jumps between pages or lifts as a line arrives. The words below keep
                    // their place too.
                    let edge = style == .bold && p == .appleNotes
                    WelcomeDemo(page: p, stage: stage, hero: true, edge: edge, sheet: style == .bold && p == .asksFirst,
                                typing: style == .bold)
                        // A card set down on the desk, a little askew: a picture, not a window.
                        .rotationEffect(.degrees(edge ? 0 : -2.5))
                        .padding(.horizontal, edge ? 0 : screen.width * 0.06)
                        .frame(maxWidth: edge ? .infinity : 520)
                        .contentShape(.rect)
                        .onTapGesture { advance(from: p) }
                        .accessibilityAddTraits(.isButton)
                        .accessibilityHint("Shows the next page")
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
    @ViewBuilder private func backdrop(stageHeight: CGFloat, top: CGFloat, height: CGFloat, width: CGFloat) -> some View {
        // Where the words begin, from the top of the screen: the scene ends above them.
        let wordsTop = top + height * 0.58
        // Bars across the top push the framed picture down below them.
        let barsRoom: CGFloat = bars ? 18 : 0
        switch typeSize.isAccessibilitySize ? WelcomeStyle.card : style {
        case .scene:
            switch sceneLook {
            case .framed, .fragments:
                // C1, C5: a picture set into the page, with margins and a clean foot.
                desk
                    .frame(width: width - 32, height: wordsTop - top - 24 - barsRoom)
                    .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                    .padding(.top, top + 4 + barsRoom)
            case .hardEdge:
                // C2: edge to edge under the status bar, ending in a straight line.
                desk.frame(width: width, height: wordsTop - 20).clipped()
            case .arch:
                // C4: as C2, its foot a gentle arch.
                desk.frame(width: width, height: wordsTop + 8).clipShape(ArchFoot(depth: 36))
            case .sheet:
                // C3: the scene fills the screen; the words and the way in sit on a solid sheet.
                ZStack(alignment: .top) {
                    desk.frame(width: width, height: top + height + 40).clipped()
                    UnevenRoundedRectangle(topLeadingRadius: 32, topTrailingRadius: 32, style: .continuous)
                        .fill(Color(Palette.sheetGround))
                        .padding(.top, wordsTop - 28)
                }
            case .collage, .site:
                EmptyView()
            }
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

    /// The desk scene, quieter than anything set on it: a little soft and less saturated.
    private var desk: some View {
        WelcomeFlow.picture()
            .blur(radius: 1.5)
            .saturation(0.88)
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
            if !bars { Dots(count: WelcomePage.allCases.count, on: selection.rawValue) }
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
            // C5's pieces rise one after another, quickly.
            try? await Task.sleep(for: .milliseconds(style == .scene && sceneLook == .fragments ? 160 : p.pause(after: s)))
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

/// C4's scene: a rectangle whose foot bows down in a gentle arch.
struct ArchFoot: Shape {
    var depth: CGFloat

    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: r.origin)
        p.addLine(to: CGPoint(x: r.maxX, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX, y: r.maxY - depth))
        p.addQuadCurve(to: CGPoint(x: r.minX, y: r.maxY - depth), control: CGPoint(x: r.midX, y: r.maxY + depth))
        p.closeSubpath()
        return p
    }
}

/// A small piece of the app, like a sticker: a mark and a few words on a white pill.
private struct Fragment: View {
    enum Mark { case symbol(String), ai(String), appleNotes, none }
    let mark: Mark
    let text: String

    var body: some View {
        HStack(spacing: 8) {
            switch mark {
            case .symbol(let name):
                Image(systemName: name).font(.subheadline.weight(.semibold)).foregroundStyle(Color(Palette.amber))
            case .ai(let ai):
                AIGlyph(ai: ai, size: 16)
            case .appleNotes:
                ImportSourceIcon(origin: .appleNotes, size: 20)
            case .none:
                EmptyView()
            }
            Text(text).font(.subheadline.weight(.semibold)).foregroundStyle(Color.ink).lineLimit(1)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.card, in: .capsule)
        .shadow(color: .black.opacity(0.06), radius: 1.5, y: 1)
        .shadow(color: Color(Palette.shadow).opacity(1.3), radius: 18, y: 10)
    }

    /// Each page's pieces, and where they lie on the scene (fractions of its width and height)
    /// and how askew.
    static func pieces(_ page: WelcomePage) -> [(Fragment, CGPoint, Double)] {
        switch page {
        case .writes:
            [(Fragment(mark: .symbol("checkmark.circle.fill"), text: RunningPlan.lines[0]), CGPoint(x: 0.36, y: 0.24), -4),
             (Fragment(mark: .symbol("circle"), text: RunningPlan.lines[2]), CGPoint(x: 0.6, y: 0.48), 3),
             (Fragment(mark: .ai("Claude"), text: "Claude added a line"), CGPoint(x: 0.42, y: 0.72), -2)]
        case .appleNotes:
            [(Fragment(mark: .appleNotes, text: "From Apple Notes \u{00B7} 142"), CGPoint(x: 0.42, y: 0.26), -3),
             (Fragment(mark: .none, text: "Groceries"), CGPoint(x: 0.66, y: 0.5), 4),
             (Fragment(mark: .none, text: "Books to read"), CGPoint(x: 0.38, y: 0.72), -2)]
        case .asksFirst:
            [(Fragment(mark: .ai("Claude"), text: "Claude wants to edit \u{201C}\(LisbonTrip.title)\u{201D}"), CGPoint(x: 0.5, y: 0.36), -3),
             (Fragment(mark: .symbol("checkmark.circle.fill"), text: "Allowed"), CGPoint(x: 0.64, y: 0.62), 3)]
        }
    }
}

/// C5: no note card; the page's pieces float on the scene, rising in one after another.
private struct Fragments: View {
    let page: WelcomePage
    let stage: Int

    var body: some View {
        GeometryReader { g in
            ForEach(Array(Fragment.pieces(page).enumerated()), id: \.offset) { i, piece in
                let shown = stage > i || stage >= page.stages - 1
                piece.0
                    .rotationEffect(.degrees(piece.2))
                    .position(x: g.size.width * piece.1.x, y: g.size.height * piece.1.y)
                    .opacity(shown ? 1 : 0)
                    .offset(y: shown ? 0 : 14)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Fragment.pieces(page).map(\.0.text).joined(separator: ". "))
    }
}

/// C6: round crops of the desk at different sizes and zooms, overlapping, with one piece of the
/// app across them.
private struct Collage: View {
    let page: WelcomePage
    let stage: Int

    var body: some View {
        GeometryReader { g in
            let w = min(g.size.width, 420)
            let crops = Self.crops[page] ?? []
            ZStack {
                ForEach(Array(crops.enumerated()), id: \.offset) { _, c in
                    crop(size: w * c.size, zoom: c.zoom, focus: c.focus).position(x: g.size.width * c.at.x, y: g.size.height * c.at.y)
                }
                Fragment.pieces(page)[0].0
                    .rotationEffect(.degrees(-3))
                    .position(x: g.size.width * 0.5, y: g.size.height * 0.8)
                    .opacity(stage >= 1 || stage >= page.stages - 1 ? 1 : 0)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Fragment.pieces(page).map(\.0.text).joined(separator: ". "))
    }

    /// Each page's three crops: where on the picture each looks (0 to 1 across and down), how close,
    /// how big (of the width) and where it sits (fractions of the space).
    struct Crop { let focus: CGPoint; let zoom: CGFloat; let size: CGFloat; let at: CGPoint }
    static let crops: [WelcomePage: [Crop]] = [
        .writes: [Crop(focus: CGPoint(x: 0.5, y: 0.45), zoom: 1.5, size: 0.58, at: CGPoint(x: 0.4, y: 0.42)),
                  Crop(focus: CGPoint(x: 0.82, y: 0.12), zoom: 2.4, size: 0.38, at: CGPoint(x: 0.73, y: 0.24)),
                  Crop(focus: CGPoint(x: 0.12, y: 0.1), zoom: 2.8, size: 0.3, at: CGPoint(x: 0.74, y: 0.6))],
        .appleNotes: [Crop(focus: CGPoint(x: 0.78, y: 0.16), zoom: 1.7, size: 0.58, at: CGPoint(x: 0.4, y: 0.42)),
                      Crop(focus: CGPoint(x: 0.5, y: 0.5), zoom: 2.2, size: 0.38, at: CGPoint(x: 0.73, y: 0.24)),
                      Crop(focus: CGPoint(x: 0.15, y: 0.88), zoom: 2.6, size: 0.3, at: CGPoint(x: 0.74, y: 0.6))],
        .asksFirst: [Crop(focus: CGPoint(x: 0.2, y: 0.18), zoom: 1.6, size: 0.58, at: CGPoint(x: 0.4, y: 0.42)),
                     Crop(focus: CGPoint(x: 0.72, y: 0.55), zoom: 2.6, size: 0.38, at: CGPoint(x: 0.73, y: 0.24)),
                     Crop(focus: CGPoint(x: 0.85, y: 0.1), zoom: 2.8, size: 0.3, at: CGPoint(x: 0.74, y: 0.6))],
    ]

    /// A round crop: the picture at `zoom` times the circle's size (3:4), moved so `focus` sits in
    /// the middle.
    private func crop(size: CGFloat, zoom: CGFloat, focus: CGPoint) -> some View {
        let w = size * zoom, h = w * 4 / 3
        return WelcomeFlow.picture()
            .frame(width: w, height: h)
            .offset(x: (0.5 - focus.x) * w, y: (0.5 - focus.y) * h)
            .frame(width: size, height: size)
            .clipShape(Circle())
            .overlay(Circle().strokeBorder(Color.card, lineWidth: 4))
            .shadow(color: Color(Palette.shadow).opacity(1.3), radius: 16, y: 8)
    }
}

/// Segmented bars across the top, in place of the dots (tried on C5): the ones behind and the
/// one you're on are amber.
private struct Bars: View {
    let count: Int
    let on: Int
    /// F5: the filled bars in the ink, thin, rather than amber.
    var ink = false

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<count, id: \.self) { i in
                Capsule().fill(i <= on ? AnyShapeStyle(ink ? Color.ink : Color(Palette.amber)) : AnyShapeStyle(Color.ink.opacity(0.15))).frame(height: ink ? 3 : 4)
            }
        }
        .animation(.easeOut(duration: 0.25), value: on)
        .accessibilityElement()
        .accessibilityLabel("Page \(on + 1) of \(count)")
    }
}

/// C7's headline and line, with the website's highlighter: a soft amber band behind the key words.
private struct MarkedWords: View {
    let page: WelcomePage
    var footer: WelcomeFooter = .f1

    /// The headline in three parts: before the marked words, the marked words, after.
    private var parts: (String, String, String) {
        switch page {
        case .writes: ("", "Your AI", " writes\nin your notes.")
        case .appleNotes: ("Feels like\n", "Apple Notes", ".")
        case .asksFirst: ("Nothing changes\n", "without you", ".")
        }
    }

    private var titleSize: CGFloat {
        switch footer {
        case .f4, .f6: 32
        case .f5: 30
        default: 34
        }
    }

    private var titleWeight: Font.Weight { [.f4, .f5, .f6].contains(footer) ? .bold : .heavy }

    static let line = Color(light: Color(red: 0.36, green: 0.29, blue: 0.22), dark: Color.muted)

    var body: some View {
        let (a, m, b) = parts
        VStack(spacing: 10) {
            (Text(a) + Text(m).customAttribute(Marker()) + Text(b))
                .textRenderer(SiteMarker(color: Color(Palette.underline)))
                .font(.system(size: titleSize, weight: titleWeight))
                .tracking([.f4, .f5, .f6].contains(footer) ? -0.5 : -0.8)
                .lineSpacing(footer == .f5 ? -2 : 0)
                .foregroundStyle(Color.ink)
                .lineLimit(2)
                .minimumScaleFactor(0.7)
                .accessibilityAddTraits(.isHeader)
                .accessibilityLabel(page.title)
                .accessibilityIdentifier("welcome.title")
            Text(page.line)
                .font(footer == .f4 ? .system(size: 15) : footer == .f5 ? .system(size: 16) : .body)
                // A step darker than the app's muted grey on the cream, for contrast.
                .foregroundStyle(footer == .f5 ? Color.ink.opacity(0.75) : MarkedWords.line)
                .lineSpacing(2)
                .lineLimit(3, reservesSpace: true)
                // F4: about 30 characters a line.
                .frame(maxWidth: footer == .f4 ? 250 : .infinity)
                .accessibilityIdentifier("welcome.line")
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: 440)
        .frame(maxWidth: .infinity)
        .fixedSize(horizontal: false, vertical: true)
    }
}

/// The website's highlighter (hero.module.css `.mark`): a band across the lower half of the
/// x-height, a little past both ends of the marked words.
private struct SiteMarker: TextRenderer {
    let color: Color

    func draw(layout: Text.Layout, in context: inout GraphicsContext) {
        for line in layout {
            for run in line {
                if run[Marker.self] != nil {
                    let b = run.typographicBounds
                    let baseline = b.rect.minY + b.ascent
                    // The x-height is about 0.55 of the ascent in SF at heavy weights.
                    let x = b.ascent * 0.55
                    let band = CGRect(x: b.rect.minX - 3, y: baseline - x * 0.62, width: b.rect.width + 6, height: x * 0.58)
                    context.fill(Path(roundedRect: band, cornerRadius: 2), with: .color(color))
                }
                context.draw(run)
            }
        }
    }
}

/// C7's art: the website's paper-craft pictures in a rounded frame, with pieces of its film
/// floating over the frame's foot, clearly a picture.
private struct SiteArt: View {
    let page: WelcomePage
    let stage: Int

    /// The picture, and where across it the subject is (0 left, 1 right) for a tall crop.
    private var art: (String, CGFloat) {
        switch page {
        case .writes: ("Welcome-site-hero", 0.66)
        case .appleNotes: ("Welcome-site-bring", 0.5)
        case .asksFirst: ("Welcome-site-lisbon", 0.42)
        }
    }

    var body: some View {
        GeometryReader { g in
            let (name, focus) = art
            let h = g.size.height - 28
            let w = h * 16 / 9
            ZStack(alignment: .topLeading) {
                Image(name)
                    .resizable()
                    .interpolation(.high)
                    .frame(width: w, height: h)
                    .offset(x: min(0, max(g.size.width - w, g.size.width / 2 - focus * w)))
                    .frame(width: g.size.width, height: h, alignment: .leading)
                    .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                    .accessibilityHidden(true)
                pieces(in: CGSize(width: g.size.width, height: h))
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
    }

    private var label: String {
        switch page {
        case .writes: "You ask ChatGPT to plan four runs a week, and it writes the plan into your note."
        case .appleNotes: "Your Apple Notes arrive in Pinto Notes, 142 of them."
        case .asksFirst: "Claude asks to edit your note Lisbon trip, and you allow it."
        }
    }

    /// What floats on the picture; each rises in on its own step.
    @ViewBuilder private func pieces(in size: CGSize) -> some View {
        let at = { (x: CGFloat, y: CGFloat) in CGPoint(x: size.width * x, y: size.height * y) }
        switch page {
        case .writes:
            SiteMe(text: "Plan four runs a week for my half marathon")
                .frame(maxWidth: size.width * 0.72, alignment: .trailing)
                .position(at(0.6, 0.58)).modifier(Rise(on: stage >= 1))
            SiteAI(name: "ChatGPT", glyph: "ChatGPT", busy: "Writing in Pinto Notes")
                .position(at(0.4, 0.78)).modifier(Rise(on: stage >= 2))
            CaretLine(text: "Easy 5 km on Monday")
                .rotationEffect(.degrees(-2))
                .position(at(0.5, 1.0)).modifier(Rise(on: stage >= 3))
        case .appleNotes:
            ForEach(Array(Fragment.pieces(page).enumerated()), id: \.offset) { i, piece in
                piece.0.rotationEffect(.degrees(piece.2))
                    .position(at(piece.1.x, [0.62, 0.8, 0.98][i]))
                    .modifier(Rise(on: stage > i || stage >= page.stages - 1))
            }
        case .asksFirst:
            ForEach(Array(Fragment.pieces(page).enumerated()), id: \.offset) { i, piece in
                piece.0.rotationEffect(.degrees(piece.2))
                    .position(at(piece.1.x, [0.8, 0.99][i]))
                    .modifier(Rise(on: stage > i || stage >= page.stages - 1))
            }
        }
    }
}

/// Shown, or a little lower and gone: a piece rising into place.
private struct Rise: ViewModifier {
    let on: Bool
    func body(content: Content) -> some View {
        content.opacity(on ? 1 : 0).offset(y: on ? 0 : 12)
    }
}

/// Your line in the chat, as on the website: a dark bubble, its corner by you.
private struct SiteMe: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.subheadline.weight(.medium))
            .foregroundStyle(Color(red: 1, green: 0.965, blue: 0.918))
            .padding(.horizontal, 14).padding(.vertical, 10)
            .background(Color(red: 0.11, green: 0.086, blue: 0.063).opacity(0.92),
                        in: UnevenRoundedRectangle(topLeadingRadius: 18, bottomLeadingRadius: 18, bottomTrailingRadius: 5, topTrailingRadius: 18, style: .continuous))
            .shadow(color: Color(red: 0.16, green: 0.08, blue: 0.02).opacity(0.4), radius: 14, y: 8)
    }
}

/// The AI's line: its name, what it's doing, and the website's three dots.
private struct SiteAI: View {
    let name: String
    let glyph: String
    let busy: String
    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                AIGlyph(ai: glyph, size: 12)
                Text(name).font(.caption.weight(.bold)).foregroundStyle(Color(red: 0.42, green: 0.37, blue: 0.33))
            }
            HStack(spacing: 5) {
                Text(busy).font(.subheadline)
                HStack(spacing: 3) { ForEach(0..<3, id: \.self) { _ in Circle().frame(width: 4, height: 4) } }
            }
            .foregroundStyle(Color(red: 0.11, green: 0.106, blue: 0.098))
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
        .background(Color.white,
                    in: UnevenRoundedRectangle(topLeadingRadius: 18, bottomLeadingRadius: 5, bottomTrailingRadius: 18, topTrailingRadius: 18, style: .continuous))
        .shadow(color: Color(red: 0.16, green: 0.08, blue: 0.02).opacity(0.35), radius: 14, y: 8)
        .environment(\.colorScheme, .light)
    }
}

/// One checklist line with ChatGPT's caret and green name tag in it, as the website draws an AI
/// writing like a collaborator.
private struct CaretLine: View {
    let text: String
    static let green = Color(red: 0.063, green: 0.639, blue: 0.498)

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "circle").font(.subheadline).foregroundStyle(Color.muted.opacity(0.6))
            HStack(spacing: 1) {
                Text(text).font(.subheadline.weight(.semibold)).foregroundStyle(Color.ink)
                Rectangle().fill(Self.green).frame(width: 2, height: 18)
                    .overlay(alignment: .bottomLeading) {
                        HStack(spacing: 3) {
                            AIGlyph(ai: "ChatGPT", size: 9).environment(\.colorScheme, .dark)
                            Text("ChatGPT").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                        }
                        .padding(.horizontal, 5).frame(height: 15)
                        .background(Self.green, in: UnevenRoundedRectangle(topLeadingRadius: 4, bottomLeadingRadius: 0, bottomTrailingRadius: 4, topTrailingRadius: 4))
                        .fixedSize()
                        .offset(y: -18)
                    }
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
        .background(Color.card, in: .capsule)
        .shadow(color: .black.opacity(0.06), radius: 1.5, y: 1)
        .shadow(color: Color(Palette.shadow).opacity(1.3), radius: 18, y: 10)
    }
}

/// F6's bars: short, the current one twice as long in the accent; each jumps to its page.
private struct JumpBars: View {
    /// Two short bars, the long one and the gaps.
    static let width: CGFloat = 18 * 2 + 36 + 6 * 2
    let count: Int
    let on: Int
    let jump: (Int) -> Void

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<count, id: \.self) { i in
                Button { jump(i) } label: {
                    Capsule().fill(i == on ? AnyShapeStyle(Color(Palette.amber)) : AnyShapeStyle(Color.ink.opacity(0.2)))
                        .frame(width: i == on ? 36 : 18, height: 4)
                        .frame(height: 44)
                        .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Page \(i + 1)")
                .accessibilityAddTraits(i == on ? .isSelected : [])
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.85), value: on)
    }
}

/// Round dots all the same size, the one you're on in `active` (F1 to F4).
private struct SmallDots: View {
    let count: Int
    let on: Int
    let size: CGFloat
    let active: Color
    let rest: Color

    var body: some View {
        HStack(spacing: size + 3) {
            ForEach(0..<count, id: \.self) { i in
                Circle().fill(i == on ? active : rest).frame(width: size, height: size)
            }
        }
        .animation(.easeOut(duration: 0.2), value: on)
        .accessibilityElement()
        .accessibilityLabel("Page \(on + 1) of \(count)")
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
    @ViewBuilder var content: Content

    var body: some View {
        let flat = look.onScreen || look.edge
        let shape = RoundedRectangle(cornerRadius: flat ? 0 : look.hero ? 24 : 20, style: .continuous)
        VStack(alignment: .leading, spacing: 0) {
            content
        }
        .padding(.horizontal, look.hero ? 20 : 18)
        .padding(.top, look.hero ? 20 : 18)
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
        // A card lying on the desk: a tight contact shadow and a long, soft one under it, not a
        // window's.
        .shadow(color: flat ? .clear : .black.opacity(look.hero ? 0.08 : 0), radius: 1.5, y: 1)
        .shadow(color: flat ? .clear : Color(Palette.shadow).opacity(look.hero ? 1.4 : 1), radius: look.hero ? 34 : 22, y: look.hero ? 22 : 10)
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

    // A label, not the editor's receipt: no Undo to press in a picture.
    var body: some View {
        HStack(spacing: 8) {
            AIGlyph(ai: ai, size: 15)
            Text(text).font(.subheadline.weight(.semibold)).foregroundStyle(Color.ink)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
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
        NoteCard(look: look) {
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
        NoteCard(look: look) {
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
        NoteCard(look: look) {
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
            // A picture of the ask, not buttons: nothing here looks pressable. It rests on the
            // answer.
            Group {
                if pressed {
                    Label("Allowed", systemImage: "checkmark.circle.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.amberInk)
                } else {
                    Text("Waiting for your answer")
                        .font(.subheadline)
                        .foregroundStyle(Color.muted)
                }
            }
            .frame(minHeight: 22)
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
