import Supabase
import SwiftUI

/// The first-run flow (see `Onboarding`): a welcome, your name, bring your notes, connect your
/// AI, and, once an AI is connected, the prompt to try. It has the whole window: on the Mac the
/// welcome's card with its picture, on iPhone and iPad the picture on top, as the sign-in before it.
struct OnboardingFlow: View {
    /// Captures: fixed values in place of the account's.
    struct Preview {
        var name = ""
        /// Titles of the AIs shown as connected.
        var connected: [String] = []
        var brought = 0
        /// The Try it step: the AI the prompt was handed to, the To-do note's text, and how far along.
        var asked: String? = nil
        var note = SetupProgress.toDoBody
        var arrived = false
        var late = false
        var copied = false
        /// iPhone: Apple Notes under the other sources instead of above them.
        var appleNotesLast = false
    }

    let store: OnboardingStore
    let backend: Backend
    var setup: SetupStore?
    var preview: Preview?
    /// The Try it step is on screen: the To-do note its prompt writes to has to exist now.
    var prepareTryIt: () -> UUID? = { nil }
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
    /// Titles of the AIs that are connected, as the server lists them.
    @State private var connectedTitles: Set<String> = []
    @State private var brought = 0
    @State private var copied = false
    // The Try it step: the To-do note, what it held when the step began, and how far along it is.
    @State private var tryNote: UUID?
    @State private var tryStart: (body: String, edits: Int)?
    @State private var tryBody = SetupProgress.toDoBody
    @State private var asked: String?
    @State private var arrived = false
    @State private var late = false
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    @Environment(\.openURL) private var openURL
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
            // The Try it step watches the To-do note until the AI's line is in it.
            .task(id: step) { if step == .tryIt, preview == nil { await watchToDo() } }
            .onChange(of: step, initial: true) { _, now in
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
            .connectGuides(client: backend.client)
    }

    // MARK: The window

    @ViewBuilder private var screen: some View {
        #if os(macOS)
        CardLayout {
            page
                .padding(.horizontal, 52)
                .padding(.top, 26)
                .padding(.bottom, 36)
        }
        #else
        ScrollView {
            VStack(spacing: 0) {
                phoneArt(share: artShare)
                VStack(alignment: .leading, spacing: Metrics.gap) {
                    progress
                    heading
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
    private var page: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 12) {
                back
                Spacer(minLength: 0)
                progress.frame(width: 96)
            }
            .frame(height: 24)
            VStack(alignment: .leading, spacing: Metrics.gap) {
                if step == .welcome { AppMark(size: 56).padding(.bottom, 8) }
                heading
                middle
            }
            .padding(.top, step == .welcome ? 72 : 28)
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .id(step)
            .transition(stepTransition)
            Spacer(minLength: 16)
            actions
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
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
        case .connect: ConnectChoices.why
        case .tryIt: "Ask your AI to add a line to your To-do note. You\u{2019}ll see it arrive here."
        }
    }

    /// Under the empty name field: allowed, and what it means.
    static let noNameNote = "You can leave this empty. Your account then shows your email address."

    static let skipBring = "Skip, I\u{2019}ll start empty"
    static let skipConnect = "Skip for now"

    private var heading: some View {
        VStack(alignment: .leading, spacing: Metrics.headingGap) {
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
        .multilineTextAlignment(.leading)
        .fixedSize(horizontal: false, vertical: true)
    }

    // MARK: The step

    @ViewBuilder private var middle: some View {
        switch step {
        case .welcome: EmptyView()
        case .name: nameField
        case .bring: choices(sources)
        case .connect: connect
        case .tryIt: tryIt
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

    // MARK: Try it

    private var shownAsked: String? { preview?.asked ?? asked }
    private var shownArrived: Bool { preview?.arrived ?? arrived }
    private var shownLate: Bool { preview?.late ?? late }
    private var tryConnected: Set<String> { Set(preview?.connected ?? Array(connectedTitles)) }

    /// The To-do note on the screen, the one click that hands the prompt to the AI, and one line
    /// that says where things are. The step ends by itself when the AI's line is in the note.
    private var tryIt: some View {
        let start = preview != nil ? SetupProgress.toDoBody : (tryStart?.body ?? tryBody)
        return VStack(alignment: .leading, spacing: 12) {
            ToDoPreview(lines: TryIt.lines(of: preview?.note ?? tryBody, since: start), waiting: !shownArrived)
            if shownArrived {
                HStack(spacing: 10) {
                    DrawnCheck(animated: preview == nil && !reduceMotion).frame(width: 26, height: 26)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(TryIt.worked).font(BigChoices.Metrics.title).foregroundStyle(Color.ink)
                        Text(TryIt.workedLine).font(.footnote).foregroundStyle(Color.muted)
                    }
                }
                .accessibilityElement(children: .combine)
                .accessibilityIdentifier("onboarding.worked")
                .transition(.opacity)
            } else {
                ForEach(TryIt.ways(connected: tryConnected)) { way in
                    switch way {
                    case .ask(let ai):
                        VStack(alignment: .leading, spacing: 6) {
                            askButton(ai)
                            if ai == "Claude", shownAsked == nil {
                                Text(TryIt.claudeNote).font(.footnote).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    case .paste:
                        promptToPaste
                    }
                }
                if shownLate {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(TryIt.late).font(.footnote).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
                        if !TryIt.ways(connected: tryConnected).contains(.paste) { copyLink }
                    }
                    .accessibilityIdentifier("onboarding.late")
                } else if shownAsked != nil || shownCopied {
                    Text(TryIt.afterAsking(shownAsked)).font(.footnote).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("onboarding.asked")
                }
            }
        }
        .animation(reduceMotion ? nil : .smooth(duration: 0.3), value: shownArrived)
    }

    private var shownCopied: Bool { preview?.copied ?? copied }

    /// "Ask ChatGPT": opens the AI with the prompt in it. The first one offered is the amber
    /// button; a second one is quieter beside it.
    @ViewBuilder private func askButton(_ ai: String) -> some View {
        let first = TryIt.ways(connected: tryConnected).first == .ask(ai: ai)
        let label = HStack(spacing: 8) {
            // The AI's own mark on its white tile, so it reads on the amber.
            AITile(ai: ai, size: Metrics.askMark)
            Text(TryIt.askTitle(ai))
        }
        if first {
            Button { ask(ai) } label: { label }
                .buttonStyle(.amberProminent(height: SignInView.Row.height, cornerRadius: SignInView.Row.radius))
                .keyboardShortcut(.defaultAction)
                .accessibilityIdentifier("onboarding.ask.\(ai)")
        } else {
            Button { ask(ai) } label: {
                Text(TryIt.askTitle(ai)).frame(maxWidth: .infinity, minHeight: Metrics.quietHeight).contentShape(.rect)
            }
            .buttonStyle(.hoverLink)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.tint)
            .accessibilityIdentifier("onboarding.ask.\(ai)")
        }
    }

    /// For an AI no link can reach (Claude Code, Codex, another MCP app): the one line to paste.
    private var promptToPaste: some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.tileRadius, style: .continuous)
        return HStack(alignment: .center, spacing: 10) {
            Text(Onboarding.prompt)
                .font(Metrics.prompt)
                .foregroundStyle(Color.ink)
                .textSelection(.enabled)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("onboarding.prompt")
            Spacer(minLength: 4)
            Button(shownCopied ? "Copied" : "Copy", action: copy)
                .buttonStyle(.amberProminent)
                .fixedSize()
                .accessibilityIdentifier("onboarding.copy")
        }
        .padding(.leading, Metrics.tilePadding)
        .padding(.trailing, 8)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(Palette.field), in: shape)
        .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
    }

    private var copyLink: some View {
        Button(shownCopied ? "Copied" : "Copy the prompt", action: copy)
            .buttonStyle(.hoverLink)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.tint)
            .accessibilityIdentifier("onboarding.copy")
    }

    // MARK: Choices

    /// Where notes can come from, as equal choices: on the Mac, Apple Notes first (it reads the
    /// Notes app directly), then the kinds the import sheet knows. On iPhone and iPad Apple Notes
    /// is not one of them: see `appleNotesOnMac`.
    private var sources: [BigChoice] {
        var list: [BigChoice] = []
        #if os(macOS)
        list.append(BigChoice(id: "onboarding.source.appleNotes", title: "Apple Notes", detail: "Read from the Notes app on this Mac", mark: .symbol("note.text")) { importingAppleNotes = true })
        #endif
        for kind in Self.sourceOrder {
            list.append(BigChoice(id: "onboarding.source.\(kind.rawValue)", title: Self.sourceTitle(kind), detail: Self.sourceDetail(kind), mark: .symbol(kind.symbol)) { importing = kind })
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

    /// Connect an AI, the same view Settings shows, without its list of what's connected: here a
    /// connected AI is marked on its own choice.
    @ViewBuilder private var connect: some View {
        if let preview {
            ConnectChoices(client: CaptureScreen.client, guides: Self.guides, listsConnected: false, preview: Self.connections(preview.connected))
        } else if let client = backend.client {
            ConnectChoices(client: client, guides: Self.guides, listsConnected: false) { titles in
                connectedTitles = titles
                Task { await setup?.refresh(force: true) }
            }
        }
    }

    /// Captures: connections by those names.
    static func connections(_ titles: [String]) -> [Connection] {
        titles.map { Connection(id: UUID(), name: $0, kind: "token", can_write: true, created_at: .now, last_used_at: nil, revoked_at: nil, redirect_host: nil) }
    }

    private func choices(_ list: [BigChoice]) -> some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            #if os(iOS)
            if preview?.appleNotesLast != true { appleNotesOnMac }
            #endif
            BigChoices(list: list)
            #if os(iOS)
            if preview?.appleNotesLast == true { appleNotesOnMac }
            #endif
            if step == .bring, broughtCount > 0 {
                Label(broughtCount == 1 ? "1 note brought in" : "\(broughtCount.formatted()) notes brought in", systemImage: "checkmark.circle.fill")
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(Color.muted)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityIdentifier("onboarding.brought")
            }
        }
    }

    #if os(iOS)
    static let appleNotesTitle = "Apple Notes"
    static let appleNotesLine = "Easiest on a Mac. Open Pinto Notes on your Mac and import there. Your notes then appear here."
    static let sendDownload = "Send the Mac download to myself"
    static let shareOneByOne = "Or share notes one at a time from the Notes app"
    static let macDownload = URL(string: "https://pintonotes.com/download")!

    /// Apple Notes on iPhone and iPad, said as it is: an iPhone can only take notes one at a time
    /// through Share, so this is not a choice like the others. It says where it is easy, gives
    /// the way to get there (the Mac download, sent to yourself), and keeps the slow way small.
    private var appleNotesOnMac: some View {
        let shape = RoundedRectangle(cornerRadius: BigChoices.Metrics.radius, style: .continuous)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "note.text")
                    .font(.system(size: BigChoices.Metrics.rowMark * 0.46, weight: .medium))
                    .foregroundStyle(Color.amberInk)
                    .frame(width: BigChoices.Metrics.rowMark, height: BigChoices.Metrics.rowMark)
                    .background(.fill.tertiary, in: .rect(cornerRadius: BigChoices.Metrics.rowMark * 0.3, style: .continuous))
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(Self.appleNotesTitle).font(BigChoices.Metrics.title).foregroundStyle(Color.ink)
                    Text(Self.appleNotesLine).font(BigChoices.Metrics.detail).foregroundStyle(Color.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .accessibilityElement(children: .combine)
            }
            ShareLink(item: Self.macDownload, subject: Text("Pinto Notes for Mac"), message: Text("Pinto Notes for Mac")) {
                Label(Self.sendDownload, systemImage: "square.and.arrow.up")
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(Color.amberSoft, in: .rect(cornerRadius: 10, style: .continuous))
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .foregroundStyle(Color.amberInk)
            .accessibilityIdentifier("onboarding.source.appleNotes.sendDownload")
            Button { sharingHowTo = true } label: {
                Text(Self.shareOneByOne)
                    .font(.footnote.weight(.medium))
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, minHeight: 32, alignment: .leading)
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.tint)
            .accessibilityIdentifier("onboarding.source.appleNotes.oneByOne")
        }
        .padding(BigChoices.Metrics.padding)
        .background(Color(Palette.field), in: shape)
        .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("onboarding.source.appleNotes")
    }
    #endif

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
                // Nothing to press when it works: the step ends by itself. This is for not now.
                if !shownArrived { quiet("Skip", id: "onboarding.skip", action: next) }
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

    /// One click: the AI's site opens with the prompt in it. The prompt is copied as well, for
    /// an app that opens without it.
    private func ask(_ ai: String) {
        guard let page = TryIt.page(for: ai) else { return }
        ConnectClipboard.set(Onboarding.prompt)
        openURL(page)
        withAnimation(.snappy(duration: 0.2)) { asked = ai }
    }

    /// Until the AI's line is in the To-do note: looks every two seconds, asks for a sync now and
    /// then (the live channel usually brings it), and after a while says what to check. When the
    /// line is in, "It worked" shows for a moment and the flow ends in the notes, on that note.
    private func watchToDo() async {
        arrived = false
        late = false
        asked = nil
        if connectedTitles.isEmpty, let client = backend.client,
           let rows: [Connection] = try? await client.from("mcp_tokens").select().execute().value {
            connectedTitles = Set(rows.filter { $0.revoked_at == nil }.map(\.title))
        }
        tryNote = prepareTryIt()
        guard let id = tryNote, let note = context.note(id) else { return }
        tryBody = note.body
        tryStart = (note.body, setup?.progress?.aiEdits ?? 0)
        let began = Date.now
        var round = 0
        while !Task.isCancelled, step == .tryIt {
            try? await Task.sleep(for: .seconds(2))
            guard !Task.isCancelled, step == .tryIt, let note = context.note(id), let start = tryStart else { return }
            round += 1
            if round % 3 == 0 {
                sync?.schedule()
                await setup?.refresh(force: true)
            }
            if note.body != tryBody { withAnimation(reduceMotion ? nil : .smooth(duration: 0.35)) { tryBody = note.body } }
            if TryIt.arrived(body: note.body, since: start.body, aiEdits: setup?.progress?.aiEdits ?? 0, editsAtStart: start.edits) {
                // The count can lead the note by a sync: wait for the line itself, a little.
                if TryIt.lines(of: note.body, since: start.body).contains(where: \.fresh) || round % 3 == 0 {
                    withAnimation(reduceMotion ? nil : .smooth(duration: 0.3)) { arrived = true }
                    try? await Task.sleep(for: .seconds(Self.workedHold))
                    if !Task.isCancelled, step == .tryIt { finish(true) }
                    return
                }
            }
            if !late, Date.now.timeIntervalSince(began) > TryIt.lateAfter { withAnimation { late = true } }
        }
    }

    /// How long "It worked" stays before the notes open.
    static var workedHold: Double = 2.4

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
    }

    enum Metrics {
        #if os(macOS)
        static let title = Font.system(size: 28, weight: .heavy)
        static let prompt = Font.system(size: 15, weight: .medium)
        static let gap: CGFloat = 20
        static let headingGap: CGFloat = 10
        static let tileRadius: CGFloat = 10
        static let tilePadding: CGFloat = 12
        static let quietHeight: CGFloat = 32
        static let askMark: CGFloat = 20
        #else
        static let title = Font.title.weight(.heavy)
        static let prompt = Font.body.weight(.medium)
        static let gap: CGFloat = 20
        static let headingGap: CGFloat = 10
        static let tileRadius: CGFloat = 14
        static let tilePadding: CGFloat = 16
        static let quietHeight: CGFloat = 44
        static let askMark: CGFloat = 26
        #endif
    }
}

/// The To-do note on the Try it step, small and real: its title, its lines as the app draws
/// them, and the line an AI just added on the tint the app gives an AI's addition. While nothing
/// has arrived, a quiet row holds the place where it will.
struct ToDoPreview: View {
    let lines: [TryIt.Line]
    var waiting = true

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous)
        VStack(alignment: .leading, spacing: Metrics.gap) {
            ForEach(lines) { line in row(line) }
            if waiting {
                HStack(spacing: 8) {
                    ProgressView().controlSize(.small)
                    Text(TryIt.waiting).font(Metrics.text).foregroundStyle(Color.muted)
                }
                .padding(.vertical, 3)
                .accessibilityElement(children: .combine)
                .accessibilityIdentifier("onboarding.waiting")
            }
        }
        .padding(Metrics.padding)
        .frame(maxWidth: .infinity, minHeight: Metrics.minHeight, alignment: .topLeading)
        .background(Color.notePage, in: shape)
        .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
        .shadow(color: Color(red: 0.24, green: 0.12, blue: 0.02).opacity(0.08), radius: 8, y: 3)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("onboarding.todo")
    }

    @ViewBuilder private func row(_ line: TryIt.Line) -> some View {
        switch line.kind {
        case .title:
            Text(line.text).font(Metrics.title).foregroundStyle(Color.ink)
        case .todo(let done):
            fresh(line, HStack(alignment: .firstTextBaseline, spacing: 8) {
                Image(systemName: done ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(done ? AnyShapeStyle(.tint) : AnyShapeStyle(.tertiary))
                    .accessibilityHidden(true)
                Text(line.text).foregroundStyle(Color.ink)
            })
        case .bullet:
            fresh(line, HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text("\u{2022}").foregroundStyle(Color.muted).accessibilityHidden(true)
                Text(line.text).foregroundStyle(Color.ink)
            })
        case .text:
            fresh(line, Text(line.text).foregroundStyle(Color.ink))
        }
    }

    private func fresh(_ line: TryIt.Line, _ content: some View) -> some View {
        content
            .font(Metrics.text)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.vertical, 3)
            .padding(.horizontal, 6)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(line.fresh ? Color.amberSoft : .clear, in: .rect(cornerRadius: 6, style: .continuous))
            .padding(.horizontal, -6)
            .transition(.opacity.combined(with: .offset(y: 6)))
            .accessibilityIdentifier(line.fresh ? "onboarding.todo.fresh" : "onboarding.todo.line")
    }

    enum Metrics {
        #if os(macOS)
        static let title = Font.system(size: 17, weight: .bold)
        static let text = Font.system(size: 13)
        static let padding: CGFloat = 14
        static let gap: CGFloat = 4
        static let radius: CGFloat = 10
        static let minHeight: CGFloat = 96
        #else
        static let title = Font.title3.weight(.bold)
        static let text = Font.body
        static let padding: CGFloat = 16
        static let gap: CGFloat = 4
        static let radius: CGFloat = 14
        static let minHeight: CGFloat = 120
        #endif
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

    static let limit: Double = 20
}
