import SwiftUI

/// iPhone and iPad: the welcome as three pages you swipe, each a real Pinto note with something
/// happening in it (PN design's direction, 28 October 2026, after Emil called the old welcome "a
/// printed static image"). One button stays put at the thumb; the person swipes, nothing
/// autoplays between pages. Each page's demo plays once when the page settles, then rests on its
/// last frame. With Reduce Motion the pages show their last frames and only fade.
///
/// Three looks to choose from (`WelcomeStyle`): A, the note card on the cream ground with the
/// words under it; B, a phone screen as the hero, cut off by the bottom edge, the words above;
/// C, the paper-craft picture behind a floating note card.
enum WelcomeStyle: String, CaseIterable, Sendable {
    case card, device, scene

    /// The look the app uses. A debug build takes `PINTO_WELCOME_STYLE=card|device|scene` first.
    static var current: WelcomeStyle {
        #if DEBUG
        if let forced { return forced }
        if let s = ProcessInfo.processInfo.environment["PINTO_WELCOME_STYLE"].flatMap(WelcomeStyle.init(rawValue:)) { return s }
        #endif
        return .card
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

    init(style: WelcomeStyle = .current, page: WelcomePage = .writes, frozenStage: Int? = nil,
         start: @escaping () -> Void, haveAccount: @escaping () -> Void) {
        self.style = style
        self.page = page
        self.frozenStage = frozenStage
        self.start = start
        self.haveAccount = haveAccount
        _selection = State(initialValue: page)
    }

    var body: some View {
        GeometryReader { screen in
            VStack(spacing: 0) {
                TabView(selection: $selection) {
                    ForEach(WelcomePage.allCases) { p in
                        pageView(p, screen: screen.size)
                            .tag(p)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                actions
            }
        }
        .background { ground }
        .sensoryFeedback(.selection, trigger: selection)
        .task(id: selection) { await play(selection) }
        .accessibilityIdentifier("welcome.pages")
    }

    // MARK: A page

    @ViewBuilder private func pageView(_ p: WelcomePage, screen: CGSize) -> some View {
        if typeSize.isAccessibilitySize {
            // The largest text sizes: the words need the room. The demo keeps a fixed size (it's
            // an illustration, with its own VoiceOver label) and the page scrolls.
            ScrollView {
                VStack(spacing: 28) {
                    WelcomeDemo(page: p, stage: stage(of: p))
                        .dynamicTypeSize(.large)
                        .padding(.horizontal, 28)
                        .frame(maxWidth: 420)
                    Words(page: p, centred: true).padding(.horizontal, 24)
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
        let words = Words(page: p, centred: style != .device)
        let stageHeight = screen.height * 0.5
        switch style {
        case .card:
            VStack(spacing: 0) {
                // The card sits a fixed gap above the words, whatever its height, so the
                // headline never moves between pages.
                WelcomeDemo(page: p, stage: stage)
                    .padding(.horizontal, 28)
                    .frame(maxWidth: 420)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                    // A little lower than the other looks: the card and the words sit as one group
                    // nearer the middle, without a band of ground above the dots.
                    .frame(height: stageHeight * 1.1)
                words.padding(.horizontal, 28).padding(.top, 36)
                Spacer(minLength: 0)
            }
        case .device:
            VStack(spacing: 0) {
                words.padding(.horizontal, 28).padding(.top, 28)
                Spacer(minLength: 20)
                PhoneScreen { WelcomeDemo(page: p, stage: stage, onScreen: true) }
                    .frame(width: min(screen.width * 0.82, 340), height: stageHeight + 60, alignment: .top)
                    .frame(maxWidth: .infinity)
                    // The phone runs on past the page: only its top shows.
                    .frame(height: stageHeight * 1.02, alignment: .top)
                    .clipped()
            }
        case .scene:
            VStack(spacing: 0) {
                ZStack {
                    WelcomeFlow.picture()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .clipped()
                        .overlay(alignment: .bottom) {
                            // The picture eases into the ground under it rather than ending on a hard line.
                            LinearGradient(colors: [.clear, Color(Palette.sheetGround)], startPoint: .top, endPoint: .bottom)
                                .frame(height: 64)
                        }
                    WelcomeDemo(page: p, stage: stage)
                        .padding(.horizontal, 40)
                        .frame(maxWidth: 400)
                        .padding(.top, 36)
                }
                .frame(height: stageHeight + 36)
                .ignoresSafeArea(edges: .top)
                words.padding(.horizontal, 28).padding(.top, 4)
                Spacer(minLength: 0)
            }
        }
    }

    private struct Words: View {
        let page: WelcomePage
        let centred: Bool

        var body: some View {
            VStack(alignment: centred ? .center : .leading, spacing: 10) {
                Text(page.title)
                    .font(.system(size: 34, weight: .bold))
                    .tracking(-0.6)
                    .foregroundStyle(Color.ink)
                    .lineLimit(2)
                    .minimumScaleFactor(0.7)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier("welcome.title")
                Text(page.line)
                    .font(.body)
                    .foregroundStyle(Color.muted)
                    .lineSpacing(2)
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
        return stages[p] ?? 0
    }

    /// Plays a page's demo once, after the swipe has settled; a page seen before stays as it ended.
    private func play(_ p: WelcomePage) async {
        guard frozenStage == nil, !reduceMotion, stages[p] == nil else { return }
        stages[p] = 0
        try? await Task.sleep(for: .milliseconds(450))
        for s in 1..<p.stages {
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

/// B's hero: a phone's screen in a dark frame, with the island, the demo inside it as the app.
private struct PhoneScreen<Content: View>: View {
    @ViewBuilder var content: Content
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let outer = RoundedRectangle(cornerRadius: 46, style: .continuous)
        let inner = RoundedRectangle(cornerRadius: 38, style: .continuous)
        content
            .padding(.top, 52)
            .padding(.horizontal, 12)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .background(Color(Palette.listGround), in: inner)
            .overlay(alignment: .top) {
                Capsule().fill(.black).frame(width: 84, height: 24).padding(.top, 10)
            }
            .clipShape(inner)
            .padding(7)
            .background(Color(white: scheme == .dark ? 0.26 : 0.12), in: outer)
            // No shadow: the page cuts the phone off at its foot, and a cut shadow shows as a box.
    }
}

// MARK: The demos

/// One page's live moment, built from the app's own parts. `stage` runs from 0 to the page's
/// last step, where it rests.
struct WelcomeDemo: View {
    let page: WelcomePage
    let stage: Int
    /// Inside B's phone: the note fills the screen instead of floating as a card.
    var onScreen = false

    var body: some View {
        switch page {
        case .writes: WritesDemo(stage: stage, onScreen: onScreen)
        case .appleNotes: AppleNotesDemo(stage: stage, onScreen: onScreen)
        case .asksFirst: AsksFirstDemo(stage: stage, onScreen: onScreen)
        }
    }
}

/// A note page as a card: the note's own ground, a hairline and the shared soft shadow.
private struct NoteCard<Content: View>: View {
    var onScreen = false
    @ViewBuilder var content: Content

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: onScreen ? 0 : 20, style: .continuous)
        content
            .padding(.horizontal, 18)
            .padding(.vertical, 18)
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .background(onScreen ? Color.notePage : Color.card, in: shape)
            .overlay { if !onScreen { shape.strokeBorder(Color.line, lineWidth: 0.5) } }
            .shadow(color: onScreen ? .clear : Color(Palette.shadow), radius: 22, y: 10)
    }
}

/// A checklist line as the editor draws it.
private struct CheckRow: View {
    let text: String
    var done = false
    var fresh = false

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.body)
                .foregroundStyle(done ? AnyShapeStyle(Color(Palette.amber)) : AnyShapeStyle(Color.muted.opacity(0.6)))
            Text(text)
                .font(.body)
                .foregroundStyle(done ? Color.muted : Color.ink)
                .strikethrough(done, color: Color.muted)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 5)
        .padding(.horizontal, 8)
        .background(fresh ? Color.amberSoft : .clear, in: .rect(cornerRadius: 8, style: .continuous))
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
        .background(Color.amberSoft, in: .capsule)
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
}

/// Page 1: Claude starts editing, a line rolls into the plan with the AI's soft amber, and the
/// receipt with Undo rises under it.
private struct WritesDemo: View {
    let stage: Int
    let onScreen: Bool

    var body: some View {
        VStack(spacing: 14) {
            NoteCard(onScreen: onScreen) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(RunningPlan.title).font(onScreen ? .title3.weight(.bold) : .title2.weight(.bold)).foregroundStyle(Color.ink)
                        Spacer(minLength: 8)
                        AIBadge(ai: "Claude", text: "Editing")
                            .opacity(stage >= 1 ? 1 : 0)
                            .scaleEffect(stage >= 1 ? 1 : 0.6, anchor: .trailing)
                    }
                    .padding(.bottom, 6)
                    CheckRow(text: RunningPlan.lines[0], done: true)
                    CheckRow(text: RunningPlan.lines[1])
                    if stage >= 2 {
                        CheckRow(text: RunningPlan.added, fresh: true)
                            .transition(.asymmetric(insertion: .offset(y: 14).combined(with: .opacity), removal: .opacity))
                    }
                    CheckRow(text: RunningPlan.lines[2])
                }
            }
            UndoChip(ai: "Claude", text: "Claude added a line")
                .opacity(stage >= 3 ? 1 : 0)
                .scaleEffect(stage >= 3 ? 1 : 0.25)
                .blur(radius: stage >= 3 ? 0 : 4)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("A note called Running plan. Claude adds a line to it, and you can undo it.")
    }
}

/// Page 2: the notes list, and Apple Notes arriving under "Imported".
private struct AppleNotesDemo: View {
    let stage: Int
    let onScreen: Bool

    static let rows: [(String, String)] = [("Groceries", "Oat milk, lemons, rice"), ("Books to read", "The Overstory, Piranesi"),
                                           ("Lisbon trip", "Flights on the 12th"), ("Gift ideas", "Mum: a good teapot")]

    var body: some View {
        NoteCard(onScreen: onScreen) {
            VStack(alignment: .leading, spacing: 0) {
                Text("Notes").font(onScreen ? .title3.weight(.bold) : .title2.weight(.bold)).foregroundStyle(Color.ink).padding(.bottom, 12)
                HStack(spacing: 8) {
                    ImportSourceIcon(origin: .appleNotes, size: 20)
                    Text("Imported from Apple Notes").font(.footnote.weight(.semibold)).foregroundStyle(Color.muted)
                    Spacer(minLength: 0)
                    if stage >= Self.rows.count {
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(Color(Palette.amber))
                            .transition(.scale.combined(with: .opacity))
                    }
                }
                .padding(.bottom, 8)
                ForEach(Array(Self.rows.enumerated()), id: \.offset) { i, row in
                    if stage > i {
                        VStack(alignment: .leading, spacing: 2) {
                            if i > 0 { Divider().padding(.bottom, 8) }
                            Text(row.0).font(.body.weight(.semibold)).foregroundStyle(Color.ink)
                            Text(row.1).font(.subheadline).foregroundStyle(Color.muted).lineLimit(1)
                        }
                        .padding(.bottom, 8)
                        .transition(.asymmetric(insertion: .offset(y: 14).combined(with: .opacity), removal: .opacity))
                    } else {
                        // Holds the row's room, so the card doesn't grow as rows arrive.
                        VStack(alignment: .leading, spacing: 2) {
                            if i > 0 { Divider().padding(.bottom, 8) }
                            Text(row.0).font(.body.weight(.semibold))
                            Text(row.1).font(.subheadline)
                        }
                        .padding(.bottom, 8)
                        .hidden()
                    }
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Your Apple Notes arrive in Pinto Notes.")
    }
}

/// Page 3: Claude asks to edit the plan; Allow is pressed; the line lands, marked as allowed.
private struct AsksFirstDemo: View {
    let stage: Int
    let onScreen: Bool

    var body: some View {
        ZStack(alignment: .bottom) {
            NoteCard(onScreen: onScreen) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(RunningPlan.title).font(onScreen ? .title3.weight(.bold) : .title2.weight(.bold)).foregroundStyle(Color.ink)
                        Spacer(minLength: 8)
                        if stage >= 2 {
                            AIBadge(ai: "Claude", text: "Allowed").transition(.scale(scale: 0.6, anchor: .trailing).combined(with: .opacity))
                        }
                    }
                    .padding(.bottom, 6)
                    CheckRow(text: RunningPlan.lines[0], done: true)
                    CheckRow(text: RunningPlan.lines[1])
                    CheckRow(text: RunningPlan.added, fresh: stage >= 2)
                        .opacity(stage >= 2 ? 1 : 0)
                    CheckRow(text: RunningPlan.lines[2])
                }
            }
            .blur(radius: stage < 2 ? 1.5 : 0)
            .opacity(stage < 2 ? 0.55 : 1)
            if stage < 2 {
                AllowCard(pressed: stage == 1)
                    .padding(.horizontal, onScreen ? 6 : 10)
                    .offset(y: 26)
                    .transition(.asymmetric(insertion: .opacity, removal: .offset(y: 40).combined(with: .opacity)))
            }
        }
        .padding(.bottom, stage < 2 ? 26 : 0)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Claude asks to edit your note. You allow it, and the change lands.")
    }
}

/// The Allow sheet, small: who asks, for which note, and the two answers.
private struct AllowCard: View {
    let pressed: Bool

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 22, style: .continuous)
        VStack(spacing: 12) {
            AITile(ai: "Claude", size: 40)
            Text("Claude wants to edit \u{201C}\(RunningPlan.title)\u{201D}")
                .font(.headline)
                .foregroundStyle(Color.ink)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 10) {
                Text("Don\u{2019}t allow")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color.ink)
                    .frame(maxWidth: .infinity, minHeight: 40)
                    .background(Color.soft, in: .capsule)
                Text("Allow")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 40)
                    .background(Color(Palette.amberButton).opacity(pressed ? 0.8 : 1), in: .capsule)
                    .scaleEffect(pressed ? 0.95 : 1)
            }
        }
        .padding(16)
        .background(Color.card, in: shape)
        .overlay(shape.strokeBorder(Color.line, lineWidth: 0.5))
        .shadow(color: Color(Palette.shadow), radius: 20, y: 8)
    }
}
#endif
