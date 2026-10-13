import Supabase
import SwiftUI

/// The first-run flow (see `Onboarding`): your name (unless it is known), bring your notes,
/// connect your AI, and, once an AI is connected, the prompt to try. It has the whole window: on
/// the Mac the welcome's card with its picture, on iPhone and iPad the picture on top, as the
/// sign-in before it. The picture keeps one size and crop through every step.
struct OnboardingFlow: View {
    /// Captures: fixed values in place of the account's.
    struct Preview {
        var name = ""
        /// Titles of the AIs shown as connected.
        var connected: [String] = []
        var brought = 0
        /// The Try it step: the AI the prompt was handed to, the trial note's text, and how far along.
        var asked: String? = nil
        var note = TrialNote.body
        var arrived = false
        var late = false
        var copied = false
    }

    let store: OnboardingStore
    let backend: Backend
    var setup: SetupStore?
    var preview: Preview?
    /// The Try it step is on screen: the trial note its prompt writes to has to exist now.
    var prepareTryIt: () -> UUID? = { nil }
    /// The flow is over. `connected`: an AI is connected, so the notes open on the trial note.
    let finish: (_ connected: Bool) -> Void

    @State private var name = ""
    /// You typed in the name field: what the account holds no longer replaces it.
    @State private var nameEdited = false
    @State private var profile = ProfileStore.shared
    @FocusState private var nameFocused: Bool
    @State private var importing: ImportKind?
    @State private var importingAppleNotes = false
    /// iPhone: the sheet that says Apple Notes come in from the Mac app (`AppleNotesOnMacSheet`).
    @State private var appleNotesOnMac = false
    /// Titles of the AIs that are connected, as the server lists them.
    @State private var connectedTitles: Set<String> = []
    @State private var brought = 0
    /// An import brought notes: the flow moves on when its sheet closes (`importClosed`).
    @State private var moveOnAfterImport = false
    @State private var copied = false
    // The Try it step: the trial note, what it held when the step began, and how far along it is.
    @State private var tryNote: UUID?
    @State private var tryStart: (body: String, edits: Int)?
    @State private var tryBody = TrialNote.body
    @State private var asked: String?
    @State private var arrived = false
    @State private var late = false
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    @Environment(\.openURL) private var openURL
    @State private var forward = true
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.modelContext) private var context

    private var step: Onboarding.Step { store.step ?? store.first }

    private var connected: Bool {
        if let preview { return !preview.connected.isEmpty }
        return setup?.progress?.connected == true || !connectedTitles.isEmpty
    }

    private var broughtCount: Int { preview?.brought ?? brought }

    var body: some View {
        screen
            .animation(reduceMotion ? .easeOut(duration: 0.2 * Self.stepPace) : .smooth(duration: 0.35 * Self.stepPace), value: step)
            .task { await loadAccount() }
            // The Try it step watches the trial note until the AI's line is in it.
            .task(id: step) { if step == .tryIt, preview == nil { await watchToDo() } }
            // The cursor in the name field as the step opens, so typing goes there. A moment after
            // it appears: focus set in the same update as the field is lost.
            .task(id: step) {
                guard step == .name else { return }
                try? await Task.sleep(for: .milliseconds(120))
                if !Task.isCancelled, step == .name { nameFocused = true }
            }
            // The name is kept as it is typed (a pause of half a second), not only on Continue:
            // quitting at this step keeps it.
            .task(id: name) {
                guard step == .name, nameEdited, preview == nil else { return }
                try? await Task.sleep(for: .milliseconds(500))
                if !Task.isCancelled { await profile.setName(name) }
            }
            #if os(macOS)
            .sheet(isPresented: $importingAppleNotes, onDismiss: importClosed) {
                AppleNotesImportView(onImported: { ids in notesBrought(ids.count) })
            }
            #else
            .sheet(isPresented: $appleNotesOnMac) { AppleNotesOnMacSheet() }
            #endif
            .sheet(item: $importing, onDismiss: { EvernoteInbox.clear(); importClosed() }) { kind in
                ImportFlow(kind: kind) { ids in notesBrought(ids.count) }
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
                phoneArt
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
                heading
                middle
            }
            .padding(.top, 28)
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .id(step)
            .transition(stepTransition)
            Spacer(minLength: 16)
            actions
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    @ViewBuilder private var back: some View {
        if Onboarding.previous(before: step, first: store.first) != nil {
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
    /// The picture's part of the screen: one size for every step, so it never jumps between
    /// them. Less of it at the largest text sizes, where the words need the room.
    static func artShare(accessibilitySize: Bool) -> CGFloat { accessibilitySize ? 0.12 : 0.2 }

    private var phoneArt: some View {
        Color.clear
            .containerRelativeFrame(.vertical) { height, _ in height * Self.artShare(accessibilitySize: typeSize.isAccessibilitySize) }
            .overlay { WelcomeFlow.picture }
            .clipped()
    }

    @ViewBuilder private var phoneBack: some View {
        if Onboarding.previous(before: step, first: store.first) != nil {
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

    /// The step going out fades in the first part of the move; the one coming in shows only
    /// after, sliding in from the side it is on. Two steps are never readable at once (they were
    /// when both faded over the same time). One value drives both, so the whole step moves as one.
    private var stepTransition: AnyTransition { stepTransition(dx: reduceMotion ? 0 : (forward ? 24 : -24)) }

    private func stepTransition(dx: CGFloat) -> AnyTransition {
        .asymmetric(insertion: .modifier(active: StepMove(shown: 0, incoming: true, dx: dx), identity: StepMove(shown: 1, incoming: true, dx: dx)),
                    removal: .modifier(active: StepMove(shown: 0, incoming: false, dx: 0), identity: StepMove(shown: 1, incoming: false, dx: 0)))
    }

    /// Tests: slows the step transition down, to see it frame by frame.
    static var stepPace: Double = 1

    /// A step coming in or going out: `shown` runs from 0 (off) to 1 (on screen) with the
    /// transition's animation. The step going out is gone by `split`; the one coming in starts there.
    nonisolated struct StepMove: ViewModifier, Animatable {
        var shown: Double
        let incoming: Bool
        let dx: CGFloat
        static let split = 0.3

        var animatableData: Double {
            get { shown }
            set { shown = newValue }
        }

        func body(content: Content) -> some View {
            let t = incoming ? max(0, (shown - Self.split) / (1 - Self.split)) : max(0, (shown - (1 - Self.split)) / Self.split)
            content
                .opacity(t)
                .offset(x: incoming ? dx * (1 - t) : 0)
        }
    }

    // MARK: Progress

    /// Short segments (your name, your notes, your AI; two when the name was known): amber for
    /// the ones behind you, a light amber for the one you're on (`Onboarding.segments`).
    private var progress: some View {
        let segments = Onboarding.segments(on: step, first: store.first)
        let steps = Onboarding.Step.counted(from: store.first)
        let done = step == .tryIt ? steps.count : (steps.firstIndex(of: step) ?? 0) + 1
        return HStack(spacing: 4) {
            ForEach(segments.indices, id: \.self) { i in
                Capsule()
                    .fill(Self.segmentFill(segments[i]))
                    .frame(height: 4)
            }
        }
        #if os(iOS)
        .frame(width: 96)
        #endif
        .accessibilityElement()
        .accessibilityLabel("Step \(min(done, steps.count)) of \(steps.count)")
    }

    private static func segmentFill(_ segment: Onboarding.Segment) -> AnyShapeStyle {
        switch segment {
        case .done: AnyShapeStyle(.tint)
        case .current: AnyShapeStyle(.tint.opacity(0.4))
        case .ahead: AnyShapeStyle(.fill.secondary)
        }
    }

    // MARK: The words

    static func title(_ step: Onboarding.Step) -> String {
        switch step {
        case .name: "What should we call you?"
        case .bring: "Bring your notes"
        case .connect: "Connect your AI"
        case .tryIt: "Try it"
        }
    }

    static func line(_ step: Onboarding.Step) -> String {
        switch step {
        case .name: "Your name shows on your account and on notes you share."
        case .bring: "Choose where they are now. Nothing changes there."
        case .connect: ConnectChoices.why
        case .tryIt: "Ask your AI to add a to-do to this note. You\u{2019}ll see it arrive here."
        }
    }

    static let skipBring = "Skip, I\u{2019}ll start empty"
    static let skipConnect = "Skip for now"

    private var heading: some View {
        VStack(alignment: .leading, spacing: Metrics.headingGap) {
            Text(Self.title(step))
                .font(Metrics.title)
                .tracking(-0.4)
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
        case .name: nameField
        case .bring: bring
        case .connect: connect
        case .tryIt: tryIt
        }
    }

    private var nameField: some View {
        let shape = RoundedRectangle(cornerRadius: SignInView.Row.radius, style: .continuous)
        // Only a real change counts as typing: focusing the field writes the same text back.
        return TextField("Your name", text: Binding(get: { name }, set: { if $0 != name { name = $0; nameEdited = true } }))
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
            .onSubmit { next() }
            .padding(.horizontal, 12)
            .frame(minHeight: SignInView.Row.height)
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(nameFocused ? Color(Palette.amber) : Color(Palette.fieldHairline), lineWidth: nameFocused ? 2 : 1))
            .accessibilityLabel("Your name")
            .accessibilityIdentifier("onboarding.name")
    }

    // MARK: Try it

    private var shownAsked: String? { preview?.asked ?? asked }
    private var shownArrived: Bool { preview?.arrived ?? arrived }
    private var shownLate: Bool { preview?.late ?? late }
    private var tryConnected: Set<String> { Set(preview?.connected ?? Array(connectedTitles)) }

    /// The trial note on the screen, the one click that hands the prompt to the AI, and one line
    /// that says where things are. The step ends by itself when the AI's line is in the note.
    private var tryIt: some View {
        let start = preview != nil ? TrialNote.body : (tryStart?.body ?? tryBody)
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

    /// Where notes can come from. Apple Notes first and large, where most notes are (on the Mac
    /// it reads the Notes app directly; on iPhone and iPad it opens `AppleNotesOnMacSheet`), then
    /// the kinds the import sheet knows, one quiet line each, so the step fits with its button.
    private var bring: some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            #if os(macOS)
            BigChoices(list: [BigChoice(id: "onboarding.source.appleNotes", title: "Apple Notes", detail: "Read from the Notes app on this Mac", mark: .origin(.appleNotes)) { importingAppleNotes = true }])
            #else
            BigChoices(list: [BigChoice(id: "onboarding.source.appleNotes", title: "Apple Notes", detail: Self.appleNotesLine, mark: .origin(.appleNotes)) { appleNotesOnMac = true }])
            #endif
            otherSources
            if broughtCount > 0 {
                Label(Self.broughtLine(broughtCount), systemImage: "checkmark.circle.fill")
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(Color.muted)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .transition(.opacity)
                    .accessibilityIdentifier("onboarding.brought")
            }
        }
        .animation(reduceMotion ? nil : .smooth(duration: 0.3), value: broughtCount)
    }

    static func broughtLine(_ count: Int) -> String {
        count == 1 ? "1 note brought in" : "\(count.formatted()) notes brought in"
    }

    static let otherSourcesTitle = "From another app"

    /// The other sources as one grouped list: the app's icon and its name, a line each. What
    /// each one needs is said in the import sheet it opens (and to VoiceOver here).
    private var otherSources: some View {
        let shape = RoundedRectangle(cornerRadius: BigChoices.Metrics.radius, style: .continuous)
        return VStack(alignment: .leading, spacing: 6) {
            Text(Self.otherSourcesTitle)
                .font(.footnote.weight(.medium))
                .foregroundStyle(Color.muted)
                .accessibilityAddTraits(.isHeader)
            VStack(spacing: 0) {
                ForEach(Array(Self.sourceOrder.enumerated()), id: \.element) { i, kind in
                    if i > 0 { Divider().padding(.leading, Metrics.sourceIcon + Metrics.sourceInset + 10) }
                    sourceRow(kind)
                }
            }
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
            .clipShape(shape)
        }
    }

    private func sourceRow(_ kind: ImportKind) -> some View {
        Button { importing = kind } label: {
            HStack(spacing: 10) {
                ImportSourceIcon(origin: .files(kind), size: Metrics.sourceIcon)
                Text(Self.sourceTitle(kind))
                    .font(Metrics.sourceName)
                    .foregroundStyle(Color.ink)
                Spacer(minLength: 8)
                Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary)
            }
            .padding(.horizontal, Metrics.sourceInset)
            .frame(maxWidth: .infinity, minHeight: Metrics.sourceRow, alignment: .leading)
            .contentShape(.rect)
            .hoverOverlay(Rectangle(), Color.primary.opacity(0.05))
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Self.sourceTitle(kind))
        .accessibilityHint(Self.sourceDetail(kind))
        .accessibilityAddTraits(.isButton)
        .accessibilityIdentifier("onboarding.source.\(kind.rawValue)")
    }

    /// The import sheet's kinds, in its own order: apps on this Mac first, then by popularity.
    static var sourceOrder: [ImportKind] { ImportKind.listed }

    static func sourceTitle(_ kind: ImportKind) -> String { kind.sourceName }

    static func sourceDetail(_ kind: ImportKind) -> String {
        // A kind the import sheet gains later says it in the sheet's own words.
        sourceDetails[kind] ?? kind.subtitle
    }

    private static let sourceDetails: [ImportKind: String] = [
        .obsidian: "Your vault folder, links and all",
        .bear: "Notes you exported from Bear",
        .markdown: "A folder or .zip of Markdown or text files",
        .evernote: "Notebooks you exported as .enex files",
        .keep: "Your Google Takeout download",
    ]

    /// Every way an AI connects.
    static let guides: [ConnectAISection.Guide] = [.chatgpt, .claude, .codex, .other]

    /// Connect an AI, the same view Settings shows, without its list of what's connected: here a
    /// connected AI is marked on its own row. Nothing moves on by itself: with an AI connected the
    /// step's one button is Continue, and every other AI can still be connected first.
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

    #if os(iOS)
    static let appleNotesLine = "From your Mac"
    static let macDownload = URL(string: "https://pintonotes.com/download")!
    #endif

    // MARK: Buttons

    /// The step's main button and, on the two steps you may skip, the quiet way past.
    @ViewBuilder private var actions: some View {
        VStack(spacing: 6) {
            switch action {
            case .proceed: primary("Continue", id: "onboarding.continue", action: { next() })
            case .skip(let title): quiet(title, id: "onboarding.skip", action: skip)
            case .none: EmptyView()
            }
        }
        // The same button stays put from step to step; a different one takes over the way the
        // step does, never on top of the one before.
        .id(action)
        .transition(stepTransition(dx: 0))
    }

    private enum Action: Hashable { case proceed, skip(String), none }

    private var action: Action {
        switch step {
        case .name: .proceed
        case .bring: broughtCount > 0 ? .proceed : .skip(Self.skipBring)
        case .connect: connected ? .proceed : .skip(Self.skipConnect)
        // Nothing to press when it works: the step ends by itself. This is for not now.
        case .tryIt: shownArrived ? .none : .skip("Skip")
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

    /// The quiet way past a step: the same as Continue, said apart in the onboarding funnel.
    private func skip() { next(skipped: true) }

    private func next(skipped: Bool = false) {
        forward = true
        if step == .name {
            nameFocused = false
            let typed = name
            if preview == nil { Task { await profile.setName(typed) } }
        }
        if !store.advance(connected: connected, skipped: skipped) { finish(connected) }
    }

    private func goBack() {
        forward = false
        store.back()
    }

    /// An import finished with notes: counted now, and the flow moves on once its sheet has closed.
    private func notesBrought(_ count: Int) {
        guard count > 0 else { return }
        brought += count
        if step == .bring { moveOnAfterImport = true }
    }

    /// The import's sheet has closed. After an import that brought notes, "35 notes brought in"
    /// shows for a moment on this step, then the flow moves on by itself.
    private func importClosed() {
        guard moveOnAfterImport else { return }
        moveOnAfterImport = false
        Task {
            try? await Task.sleep(for: .seconds(Self.broughtHold))
            if step == .bring { next() }
        }
    }

    /// How long "35 notes brought in" shows before the flow moves on.
    static var broughtHold: Double = 1.2

    /// One click: the AI's site opens with the prompt in it. The prompt is copied as well, for
    /// an app that opens without it.
    private func ask(_ ai: String) {
        guard let page = TryIt.page(for: ai) else { return }
        ConnectClipboard.set(Onboarding.prompt)
        openURL(page)
        withAnimation(.snappy(duration: 0.2)) { asked = ai }
    }

    /// Until the AI's line is in the trial note: looks every two seconds, asks for a sync now and
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
                    if !Task.isCancelled, step == .tryIt { next() }
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
        if let preview {
            name = preview.name
            return
        }
        #if os(macOS)
        // Until the account says otherwise (Apple sends a name only at an app's very first
        // sign-in): the name this Mac's user goes by, to keep or change.
        if !nameEdited, let mine = Self.macUserName() { name = mine }
        #endif
        if let known = profile.name, !nameEdited { name = known }
        await profile.bind(backend)
        if let known = profile.name, !nameEdited { name = known }
    }

    #if os(macOS)
    /// The Mac user's full name, as the system has it. NSFullUserName can come back empty in the
    /// sandbox; the user's record says it then.
    static func macUserName() -> String? {
        if let name = ProfileName.normalized(NSFullUserName()) { return name }
        guard let entry = getpwuid(getuid()), let gecos = entry.pointee.pw_gecos else { return nil }
        return ProfileName.normalized(String(cString: gecos).components(separatedBy: ",").first ?? "")
    }
    #endif

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
        static let sourceIcon: CGFloat = 20
        static let sourceRow: CGFloat = 34
        static let sourceInset: CGFloat = 12
        static let sourceName = Font.system(size: 13, weight: .medium)
        #else
        static let title = Font.title.weight(.heavy)
        static let prompt = Font.body.weight(.medium)
        static let gap: CGFloat = 20
        static let headingGap: CGFloat = 10
        static let tileRadius: CGFloat = 14
        static let tilePadding: CGFloat = 16
        static let quietHeight: CGFloat = 44
        static let askMark: CGFloat = 26
        static let sourceIcon: CGFloat = 30
        static let sourceRow: CGFloat = 48
        static let sourceInset: CGFloat = 16
        static let sourceName = Font.body
        #endif
    }
}

/// The trial note on the Try it step, small and real: its title, its lines as the app draws
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

#if os(iOS)
/// iPhone: Apple Notes come in from the Mac app, said in one sentence, with one thing to do
/// (send yourself the Mac download) and, quieter, the one-note-at-a-time way.
struct AppleNotesOnMacSheet: View {
    @State private var sharingHowTo = false
    @Environment(\.dynamicTypeSize) private var typeSize
    static let title = "Your Apple Notes come in from the Mac app"
    static let line = "Import them in Pinto Notes on your Mac. They show up here a moment later."
    static let send = "Send the Mac link to myself"
    static let oneByOne = "Share one note at a time instead"

    var body: some View {
        ScrollView {
            content
        }
        .scrollBounceBehavior(.basedOnSize)
        .background(Color(Palette.sheetGround))
        .presentationDetents(typeSize.isAccessibilitySize ? [.large] : [.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationBackground(Color(Palette.sheetGround))
        .sheet(isPresented: $sharingHowTo) { ShareHowToSheet() }
    }

    private var content: some View {
        VStack(spacing: 14) {
            ImportSourceIcon(origin: .appleNotes, size: 64)
            Text(Self.title)
                .font(.title3.weight(.bold))
                .foregroundStyle(Color.ink)
                .multilineTextAlignment(.center)
                .accessibilityAddTraits(.isHeader)
            Text(Self.line)
                .font(.subheadline)
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
            ShareLink(item: OnboardingFlow.macDownload, subject: Text("Pinto Notes for Mac"), message: Text("Pinto Notes for Mac")) {
                Text(Self.send)
            }
            .buttonStyle(.amberProminent(height: SignInView.Row.height, cornerRadius: SignInView.Row.radius))
            .padding(.top, 8)
            .accessibilityIdentifier("onboarding.appleNotes.send")
            Button(Self.oneByOne) { sharingHowTo = true }
                .font(.subheadline.weight(.medium))
                .foregroundStyle(Color.muted)
                .frame(minHeight: 44)
                .accessibilityIdentifier("onboarding.appleNotes.oneByOne")
        }
        .fixedSize(horizontal: false, vertical: true)
        .padding(.horizontal, 28)
        .padding(.top, 32)
        .padding(.bottom, 16)
        .frame(maxWidth: .infinity, alignment: .top)
    }
}
#endif
