import Supabase
import SwiftUI

/// The first-run flow (see `Onboarding`): a welcome, your name, bring your notes, connect your
/// AI, and, once an AI is connected, the prompt to try. It has the whole window: on the Mac the
/// welcome's card with its picture, on iPhone and iPad the picture on top, as the sign-in before it.
struct OnboardingFlow: View {
    /// How the two choice steps are laid out. `rows`: a list of wide rows beside the picture.
    /// `grid`: tiles across the whole window, without the picture.
    enum Layout: String { case rows, grid }

    /// Captures: fixed values in place of the account's.
    struct Preview {
        var name = ""
        /// Titles of the AIs shown as connected.
        var connected: [String] = []
        var brought = 0
        var copied = false
    }

    let store: OnboardingStore
    let backend: Backend
    var setup: SetupStore?
    var layout: Layout = .rows
    var preview: Preview?
    /// The Try it step is on screen: the To-do note its prompt writes to has to exist now.
    var prepareTryIt: () -> Void = {}
    /// The flow is over. `connected`: an AI is connected, so the notes open on the To-do note.
    let finish: (_ connected: Bool) -> Void

    @State private var name = ""
    /// You typed in the name field: what the account holds no longer replaces it.
    @State private var nameEdited = false
    @State private var profile = ProfileStore.shared
    @FocusState private var nameFocused: Bool
    @State private var importing: ImportKind?
    @State private var importingAppleNotes = false
    @State private var sharingHowTo = false
    @State private var guide: ConnectAISection.Guide?
    /// Titles of the AIs that are connected, as the server lists them.
    @State private var connectedTitles: Set<String> = []
    @State private var brought = 0
    @State private var copied = false
    @State private var forward = true
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.modelContext) private var context

    private var step: Onboarding.Step { store.step ?? .welcome }

    private var connected: Bool {
        if let preview { return !preview.connected.isEmpty }
        return setup?.progress?.connected == true || !connectedTitles.isEmpty
    }

    private var broughtCount: Int { preview?.brought ?? brought }

    var body: some View {
        screen
            .animation(reduceMotion ? .easeOut(duration: 0.15) : .smooth(duration: 0.35), value: step)
            .task { await loadAccount() }
            .onChange(of: step, initial: true) { _, now in
                if now == .tryIt, preview == nil { prepareTryIt() }
                #if os(macOS)
                if now == .name { nameFocused = true }
                #endif
            }
            #if os(macOS)
            .sheet(isPresented: $importingAppleNotes) {
                AppleNotesImportView { ids in notesBrought(ids.count) }
            }
            #else
            .sheet(isPresented: $sharingHowTo) { ShareHowToSheet() }
            #endif
            .sheet(item: $importing, onDismiss: EvernoteInbox.clear) { kind in
                ImportSheet(kind) { ids in notesBrought(ids.count) }
            }
            .sheet(item: $guide, onDismiss: { Task { await loadConnections() } }) { g in
                if let client = backend.client { GuideSheet(guide: g, client: client) }
            }
    }

    // MARK: The window

    /// The two choice steps drop the picture in the grid layout; every other step keeps it.
    private var showsArt: Bool { layout == .rows || !(step == .bring || step == .connect) }

    @ViewBuilder private var screen: some View {
        #if os(macOS)
        if showsArt {
            CardLayout {
                page(alignment: .leading)
                    .padding(.horizontal, 52)
                    .padding(.top, 26)
                    .padding(.bottom, 36)
            }
        } else {
            page(alignment: .center)
                .padding(.horizontal, 56)
                .padding(.top, 26)
                .padding(.bottom, 36)
                .frame(minWidth: WelcomeFlow.size.width, maxWidth: .infinity, maxHeight: .infinity)
                .background { Backdrop() }
        }
        #else
        ScrollView {
            VStack(spacing: 0) {
                if showsArt {
                    phoneArt(share: artShare)
                } else {
                    AppMark(size: 48).padding(.top, 72)
                }
                VStack(alignment: showsArt ? .leading : .center, spacing: Metrics.gap) {
                    progress
                    heading(alignment: showsArt ? .leading : .center)
                    middle
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 24)
                .frame(maxWidth: WelcomeFlow.readableWidth, alignment: .leading)
                .id(step)
                .transition(stepTransition)
            }
            .frame(maxWidth: .infinity)
        }
        .scrollBounceBehavior(.basedOnSize)
        .scrollDismissesKeyboard(.interactively)
        .safeAreaInset(edge: .bottom) {
            actions
                .padding(.horizontal, 24)
                .padding(.top, 8)
                .padding(.bottom, 8)
                .frame(maxWidth: WelcomeFlow.readableWidth)
                .frame(maxWidth: .infinity)
                .background { Backdrop() }
        }
        .ignoresSafeArea(.container, edges: .top)
        .overlay(alignment: .topLeading) { phoneBack }
        .background { Backdrop() }
        #endif
    }

    #if os(macOS)
    /// One step in the Mac's window: Back and the progress on top, the words and the choices in
    /// the middle, the buttons at the foot.
    private func page(alignment: HorizontalAlignment) -> some View {
        VStack(alignment: alignment, spacing: 0) {
            HStack(spacing: 12) {
                back
                Spacer(minLength: 0)
                progress.frame(width: 96)
            }
            .frame(height: 24)
            VStack(alignment: alignment, spacing: Metrics.gap) {
                if step == .welcome { AppMark(size: 56).padding(.bottom, 8) }
                heading(alignment: alignment)
                middle
            }
            .padding(.top, step == .welcome ? 72 : (showsArt ? 28 : 0))
            // Without the picture, the words and the tiles sit in the middle of the window.
            .frame(maxWidth: .infinity, maxHeight: showsArt ? nil : .infinity, alignment: alignment == .leading ? .topLeading : .center)
            .id(step)
            .transition(stepTransition)
            if showsArt { Spacer(minLength: 16) }
            actions.frame(maxWidth: showsArt ? .infinity : 320)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: alignment == .leading ? .topLeading : .top)
    }

    @ViewBuilder private var back: some View {
        if Onboarding.previous(before: step) != nil {
            Button(action: goBack) {
                Label("Back", systemImage: "chevron.left")
                    .frame(minHeight: 24)
                    .contentShape(.rect)
            }
            .buttonStyle(.hoverText)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.tint)
            .keyboardShortcut(.cancelAction)
            .accessibilityIdentifier("onboarding.back")
        }
    }
    #else
    /// Less of the picture as the steps need more room, and at the largest text sizes.
    private var artShare: CGFloat {
        if typeSize.isAccessibilitySize { return step == .welcome ? 0.3 : 0.16 }
        switch step {
        case .welcome: return 0.5
        case .name, .tryIt: return 0.24
        case .bring, .connect: return 0.16
        }
    }

    private func phoneArt(share: CGFloat) -> some View {
        Color.clear
            .containerRelativeFrame(.vertical) { height, _ in height * share }
            .overlay { WelcomeFlow.picture }
            .clipped()
            .animation(reduceMotion ? nil : .smooth(duration: 0.35), value: share)
    }

    @ViewBuilder private var phoneBack: some View {
        if Onboarding.previous(before: step) != nil {
            Button(action: goBack) {
                Image(systemName: "chevron.left")
                    .font(.body.weight(.semibold))
                    .frame(width: 44, height: 44)
                    .contentShape(.circle)
            }
            .buttonStyle(.plain)
            .foregroundStyle(Color.ink)
            .glassEffect(.regular.interactive(), in: .circle)
            .accessibilityLabel("Back")
            .accessibilityIdentifier("onboarding.back")
            .padding(.leading, 16)
            .padding(.top, 4)
            .transition(.opacity)
        }
    }
    #endif

    private var stepTransition: AnyTransition {
        if reduceMotion { return .opacity }
        return .asymmetric(insertion: .opacity.combined(with: .offset(x: forward ? 24 : -24)), removal: .opacity)
    }

    // MARK: Progress

    /// Three short segments (your name, your notes, your AI): amber for the one you're on and
    /// the ones behind you. The welcome, before them, shows none.
    @ViewBuilder private var progress: some View {
        let steps = Onboarding.Step.counted
        if step != .welcome {
            let done = step == .tryIt ? steps.count : (steps.firstIndex(of: step) ?? 0) + 1
            HStack(spacing: 4) {
                ForEach(steps.indices, id: \.self) { i in
                    Capsule()
                        .fill(i < done ? AnyShapeStyle(.tint) : AnyShapeStyle(.fill.secondary))
                        .frame(height: 4)
                }
            }
            #if os(iOS)
            .frame(width: 96)
            #endif
            .accessibilityElement()
            .accessibilityLabel("Step \(min(done, steps.count)) of \(steps.count)")
        }
    }

    // MARK: The words

    static func title(_ step: Onboarding.Step) -> String {
        switch step {
        case .welcome: "Welcome to Pinto Notes"
        case .name: "What should we call you?"
        case .bring: "Bring your notes"
        case .connect: "Connect your AI"
        case .tryIt: "Try it"
        }
    }

    static func line(_ step: Onboarding.Step) -> String {
        switch step {
        case .welcome: "Your notes, in an app your AI can read and write when you ask it to."
        case .name: "Your name shows on your account and on notes you share."
        case .bring: "Choose where they are now. Nothing changes there."
        case .connect: "Your AI can then read and write your notes when you ask it to."
        case .tryIt: "Ask your AI this. It adds a line to the To-do note in your notes."
        }
    }

    /// Under the empty name field: allowed, and what it means.
    static let noNameNote = "You can leave this empty. Your account then shows your email address."

    static let skipBring = "Skip, I\u{2019}ll start empty"
    static let skipConnect = "Skip for now"

    private func heading(alignment: HorizontalAlignment) -> some View {
        VStack(alignment: alignment, spacing: Metrics.headingGap) {
            Text(Self.title(step))
                .font(step == .welcome ? WelcomeFlow.titleFont : Metrics.title)
                .tracking(step == .welcome ? -0.8 : -0.4)
                .foregroundStyle(Color.ink)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("onboarding.title")
            Text(Self.line(step))
                .font(WelcomeFlow.lineFont)
                .foregroundStyle(Color.muted)
                .lineSpacing(2)
        }
        .multilineTextAlignment(alignment == .center ? .center : .leading)
        .fixedSize(horizontal: false, vertical: true)
    }

    // MARK: The step

    @ViewBuilder private var middle: some View {
        switch step {
        case .welcome: EmptyView()
        case .name: nameField
        case .bring: choices(sources)
        case .connect: choices(ais)
        case .tryIt:
            VStack(spacing: 10) {
                promptBox
                primary(preview?.copied ?? copied ? "Copied" : "Copy prompt", id: "onboarding.copy", action: copy)
            }
        }
    }

    private var nameField: some View {
        let shape = RoundedRectangle(cornerRadius: SignInView.Row.radius, style: .continuous)
        return VStack(alignment: .leading, spacing: 8) {
            TextField("Your name", text: Binding(get: { name }, set: { name = $0; nameEdited = true }))
                .textFieldStyle(.plain)
                #if os(macOS)
                .font(.system(size: SignInView.Row.text))
                #else
                // The body size, so it grows with the text size setting like the words around it.
                .font(.body)
                .padding(.vertical, 10)
                #endif
                #if os(iOS)
                .textContentType(.name)
                .textInputAutocapitalization(.words)
                .submitLabel(.continue)
                #endif
                .autocorrectionDisabled()
                .focused($nameFocused)
                .onSubmit(next)
                .padding(.horizontal, 12)
                .frame(minHeight: SignInView.Row.height)
                .background(Color(Palette.field), in: shape)
                .overlay(shape.strokeBorder(nameFocused ? Color(Palette.amber) : Color(Palette.fieldHairline), lineWidth: nameFocused ? 2 : 1))
                .accessibilityLabel("Your name")
                .accessibilityIdentifier("onboarding.name")
            if ProfileName.normalized(name) == nil {
                Text(Self.noNameNote)
                    .font(.footnote)
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("onboarding.noName")
            }
        }
    }

    private var promptBox: some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.tileRadius, style: .continuous)
        return Text(Onboarding.prompt)
            .font(Metrics.prompt)
            .foregroundStyle(Color.ink)
            .textSelection(.enabled)
            .fixedSize(horizontal: false, vertical: true)
            .padding(Metrics.tilePadding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
            .accessibilityIdentifier("onboarding.prompt")
    }

    // MARK: Choices

    /// One thing to pick on a choice step: a place notes come from, or an AI.
    struct Choice: Identifiable {
        enum Mark { case symbol(String), ai(String) }
        let id: String
        let title: String
        let detail: String
        let mark: Mark
        var done = false
        let action: () -> Void
    }

    /// Where notes can come from: Apple Notes first, then the kinds the import sheet knows.
    private var sources: [Choice] {
        var list: [Choice] = []
        #if os(macOS)
        list.append(Choice(id: "source.appleNotes", title: "Apple Notes", detail: "Read from the Notes app on this Mac", mark: .symbol("note.text")) { importingAppleNotes = true })
        #else
        list.append(Choice(id: "source.appleNotes", title: "Apple Notes", detail: "Share notes from the Notes app", mark: .symbol("note.text")) { sharingHowTo = true })
        #endif
        for kind in Self.sourceOrder {
            list.append(Choice(id: "source.\(kind.rawValue)", title: Self.sourceTitle(kind), detail: Self.sourceDetail(kind), mark: .symbol(kind.symbol)) { importing = kind })
        }
        return list
    }

    /// The import sheet's kinds, the folder of Markdown first; a kind added there later follows.
    static var sourceOrder: [ImportKind] {
        let first: [ImportKind] = [.markdown, .evernote, .keep]
        return first + ImportKind.allCases.filter { !first.contains($0) }
    }

    static func sourceTitle(_ kind: ImportKind) -> String {
        kind == .markdown ? "Obsidian or Markdown" : kind.sourceName
    }

    static func sourceDetail(_ kind: ImportKind) -> String {
        // A kind the import sheet gains later says it in the sheet's own words.
        sourceDetails[kind] ?? kind.subtitle
    }

    private static let sourceDetails: [ImportKind: String] = [
        .markdown: "A folder or .zip of Markdown or text files",
        .evernote: "Notebooks you exported as .enex files",
        .keep: "Your Google Takeout download",
    ]

    /// Every way an AI connects, each leading to its guide.
    static let guides: [ConnectAISection.Guide] = [.chatgpt, .claude, .claudeCode, .codex, .other]

    static func guideDetail(_ guide: ConnectAISection.Guide) -> String {
        switch guide {
        case .chatgpt: "Its apps and the web"
        case .claude: "Its apps and the web"
        case .claudeCode: "In your terminal"
        case .codex: "In your terminal"
        case .other: "Anything that speaks MCP"
        case .incredible: guide.subtitle
        }
    }

    private var ais: [Choice] {
        let shown = Set(preview?.connected ?? Array(connectedTitles))
        return Self.guides.map { g in
            Choice(id: "ai.\(g.rawValue)", title: g.title, detail: shown.contains(g.title) ? "Connected" : Self.guideDetail(g),
                   mark: .ai(g.title), done: shown.contains(g.title)) { guide = g }
        }
    }

    @ViewBuilder private func choices(_ list: [Choice]) -> some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            switch layout {
            case .rows:
                VStack(spacing: Metrics.tileGap) { ForEach(list) { row($0) } }
            case .grid:
                LazyVGrid(columns: gridColumns(list.count), spacing: Metrics.tileGap) { ForEach(list) { tile($0) } }
            }
            if step == .bring, broughtCount > 0 {
                Label(broughtCount == 1 ? "1 note brought in" : "\(broughtCount.formatted()) notes brought in", systemImage: "checkmark.circle.fill")
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(Color.muted)
                    .frame(maxWidth: .infinity, alignment: layout == .grid ? .center : .leading)
                    .accessibilityIdentifier("onboarding.brought")
            }
        }
    }

    private func gridColumns(_ count: Int) -> [GridItem] {
        #if os(macOS)
        Array(repeating: GridItem(.flexible(), spacing: Metrics.tileGap), count: count)
        #else
        Array(repeating: GridItem(.flexible(), spacing: Metrics.tileGap), count: typeSize.isAccessibilitySize ? 1 : 2)
        #endif
    }

    /// A wide row: the mark, the name over one line about it, and a chevron (a check once done).
    private func row(_ choice: Choice) -> some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.tileRadius, style: .continuous)
        let words = VStack(alignment: .leading, spacing: 2) {
            Text(choice.title).font(Metrics.choiceTitle).foregroundStyle(Color.ink)
            Text(choice.detail).font(Metrics.choiceDetail).foregroundStyle(Color.muted)
        }
        .fixedSize(horizontal: false, vertical: true)
        return Button(action: choice.action) {
            Group {
                if typeSize.isAccessibilitySize {
                    // The largest text sizes: the mark over the words, which get the row's width.
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            mark(choice.mark, size: Metrics.rowMark)
                            Spacer(minLength: 8)
                            trailing(choice)
                        }
                        words
                    }
                } else {
                    HStack(spacing: 12) {
                        mark(choice.mark, size: Metrics.rowMark)
                        words
                        Spacer(minLength: 8)
                        trailing(choice)
                    }
                }
            }
            .padding(.horizontal, Metrics.tilePadding)
            .padding(.vertical, Metrics.rowPadding)
            .frame(maxWidth: .infinity, minHeight: Metrics.rowHeight, alignment: .leading)
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
            .hoverOverlay(shape, Color.primary.opacity(0.05))
            .contentShape(shape)
        }
        .buttonStyle(ChoicePress())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(choice.title). \(choice.detail)")
        .accessibilityAddTraits(.isButton)
        .accessibilityIdentifier("onboarding.\(choice.id)")
    }

    /// A tile: the mark on top, the name and one line under it.
    private func tile(_ choice: Choice) -> some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.tileRadius, style: .continuous)
        return Button(action: choice.action) {
            VStack(spacing: 10) {
                mark(choice.mark, size: Metrics.tileMark)
                VStack(spacing: 3) {
                    Text(choice.title).font(Metrics.choiceTitle).foregroundStyle(Color.ink)
                    Text(choice.detail).font(Metrics.choiceDetail).foregroundStyle(Color.muted)
                }
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 10)
            .padding(.top, Metrics.tileTop)
            .padding(.bottom, Metrics.tilePadding)
            // From the top, so the marks line up whether the line under a name is one row or two.
            // One height for every tile; at the largest text sizes each grows to fit its words.
            .frame(maxWidth: .infinity, minHeight: Metrics.tileHeight, maxHeight: typeSize.isAccessibilitySize ? nil : Metrics.tileHeight, alignment: .top)
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
            .overlay(alignment: .topTrailing) { if choice.done { check.padding(8) } }
            .hoverOverlay(shape, Color.primary.opacity(0.05))
            .contentShape(shape)
        }
        .buttonStyle(ChoicePress())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(choice.title). \(choice.detail)")
        .accessibilityAddTraits(.isButton)
        .accessibilityIdentifier("onboarding.\(choice.id)")
    }

    @ViewBuilder private func trailing(_ choice: Choice) -> some View {
        if choice.done {
            check
        } else {
            Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary)
        }
    }

    private var check: some View {
        Image(systemName: "checkmark.circle.fill")
            .font(.system(size: Metrics.check, weight: .semibold))
            .foregroundStyle(.white, Color.green)
            .accessibilityHidden(true)
    }

    /// An AI's own mark on its white tile; a source's symbol on a quiet tile of the same size.
    @ViewBuilder private func mark(_ mark: Choice.Mark, size: CGFloat) -> some View {
        switch mark {
        case .ai(let ai):
            AITile(ai: ai, size: size)
        case .symbol(let name):
            Image(systemName: name)
                .font(.system(size: size * 0.46, weight: .medium))
                .foregroundStyle(Color.amberInk)
                .frame(width: size, height: size)
                .background(.fill.tertiary, in: .rect(cornerRadius: size * 0.3, style: .continuous))
                .accessibilityHidden(true)
        }
    }

    // MARK: Buttons

    /// The step's main button and, on the two steps you may skip, the quiet way past.
    @ViewBuilder private var actions: some View {
        VStack(spacing: 6) {
            switch step {
            case .welcome, .name:
                primary("Continue", id: "onboarding.continue", action: next)
            case .bring:
                if broughtCount > 0 {
                    primary("Continue", id: "onboarding.continue", action: next)
                } else {
                    quiet(Self.skipBring, id: "onboarding.skip", action: next)
                }
            case .connect:
                if connected {
                    primary("Continue", id: "onboarding.continue", action: next)
                } else {
                    quiet(Self.skipConnect, id: "onboarding.skip", action: next)
                }
            case .tryIt:
                // Copy sits under the prompt it copies; this is the way on.
                quiet("Open my notes", id: "onboarding.open", action: next)
            }
        }
    }

    private func primary(_ title: String, id: String, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .buttonStyle(.amberProminent(height: SignInView.Row.height, cornerRadius: SignInView.Row.radius))
            .keyboardShortcut(.defaultAction)
            .accessibilityIdentifier(id)
    }

    private func quiet(_ title: String, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .frame(maxWidth: .infinity, minHeight: Metrics.quietHeight)
                .contentShape(.rect)
        }
        .buttonStyle(.hoverLink)
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(.tint)
        .accessibilityIdentifier(id)
    }

    // MARK: What the buttons do

    private func next() {
        forward = true
        if step == .name {
            nameFocused = false
            let typed = name
            if preview == nil { Task { await profile.setName(typed) } }
        }
        if !store.advance(connected: connected) { finish(connected) }
    }

    private func goBack() {
        forward = false
        store.back()
    }

    /// An import finished with notes: the flow moves on to the next step under its sheet.
    private func notesBrought(_ count: Int) {
        guard count > 0 else { return }
        brought += count
        if step == .bring { next() }
    }

    private func copy() {
        ConnectClipboard.set(Onboarding.prompt)
        withAnimation(.snappy(duration: 0.15)) { copied = true }
        Task {
            try? await Task.sleep(for: .seconds(2))
            withAnimation(.snappy(duration: 0.15)) { copied = false }
        }
    }

    /// The name the account already has (from Apple, Google or Settings) fills the field, unless
    /// you have typed; and which AIs are connected already.
    private func loadAccount() async {
        #if os(macOS)
        // The Mac puts the cursor in the field; an iPhone keeps its keyboard down until asked.
        if step == .name { nameFocused = true }
        #endif
        if let preview {
            name = preview.name
            return
        }
        if let known = profile.name, !nameEdited { name = known }
        await profile.bind(backend)
        if let known = profile.name, !nameEdited { name = known }
        await loadConnections()
    }

    /// After a guide closes: what is connected now. The step shows it and offers Continue.
    private func loadConnections() async {
        guard preview == nil, let client = backend.client else { return }
        await setup?.refresh(force: true)
        guard let rows: [Connection] = try? await client.from("mcp_tokens").select().execute().value else { return }
        connectedTitles = Set(rows.filter { $0.revoked_at == nil }.map(\.title))
    }

    enum Metrics {
        #if os(macOS)
        static let title = Font.system(size: 28, weight: .heavy)
        static let prompt = Font.system(size: 15, weight: .medium)
        static let choiceTitle = Font.system(size: 14, weight: .semibold)
        static let choiceDetail = Font.system(size: 12)
        static let gap: CGFloat = 20
        static let headingGap: CGFloat = 10
        static let tileGap: CGFloat = 8
        static let tileRadius: CGFloat = 10
        static let tilePadding: CGFloat = 12
        static let rowPadding: CGFloat = 8
        static let rowHeight: CGFloat = 52
        static let rowMark: CGFloat = 32
        static let tileHeight: CGFloat = 148
        static let tileTop: CGFloat = 24
        static let tileMark: CGFloat = 44
        static let check: CGFloat = 16
        static let quietHeight: CGFloat = 32
        #else
        static let title = Font.title.weight(.heavy)
        static let prompt = Font.body.weight(.medium)
        static let choiceTitle = Font.body.weight(.semibold)
        static let choiceDetail = Font.subheadline
        static let gap: CGFloat = 20
        static let headingGap: CGFloat = 10
        static let tileGap: CGFloat = 10
        static let tileRadius: CGFloat = 14
        static let tilePadding: CGFloat = 16
        static let rowPadding: CGFloat = 10
        static let rowHeight: CGFloat = 64
        static let rowMark: CGFloat = 40
        static let tileHeight: CGFloat = 172
        static let tileTop: CGFloat = 22
        static let tileMark: CGFloat = 48
        static let check: CGFloat = 20
        static let quietHeight: CGFloat = 44
        #endif
    }
}

/// A big choice dips a little when pressed (the app's `PressScale` is sized for small buttons).
private struct ChoicePress: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.snappy(duration: 0.15), value: configuration.isPressed)
    }
}

/// The window while a possibly new account's first sync is still answering: the welcome's
/// picture and nothing to read, so the notes never flash by before the flow.
struct OnboardingWait: View {
    let store: OnboardingStore

    var body: some View {
        #if os(macOS)
        CardLayout { ProgressView().controlSize(.small) }
            .task { await giveUp() }
        #else
        ProgressView()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background { Backdrop() }
            .task { await giveUp() }
        #endif
    }

    /// A first sync that never answers (no network, sync held back) must not keep the notes shut.
    private func giveUp() async {
        try? await Task.sleep(for: .seconds(Self.limit))
        if !Task.isCancelled { store.giveUpWaiting() }
    }

    static let limit: Double = 12
}
