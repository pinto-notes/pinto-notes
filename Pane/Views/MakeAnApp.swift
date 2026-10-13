import SwiftUI
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// "Make It an App…" in a note's More menu (see NotePage): apps are made by the person's own AI, so
/// this hands their AI a ready prompt for this note, or, with no AI connected yet, leads to
/// connecting one. The menu is the only way in: a pill at the bottom of a note is for status (an AI
/// changed this, with Undo), never for an offer. One that said "Make this an app" was removed.
enum MakeAnApp {
    /// The ways to connect an AI the sheet offers when none is connected: those that can build
    /// an app (not "Another AI", whose steps are Settings').
    /// As two large choices, ChatGPT and Claude (the two most people have), and the rest in a
    /// menu under them: those that can build an app (not "Another AI", whose steps are Settings').
    static var connectGuides: [ConnectAISection.Guide] { [.chatgpt, .claude, .codex] }

    /// What kind of app the note would make, from what it holds.
    enum Kind: Equatable { case budget, tracker, cards, checklist, plain }

    static func kind(for body: String) -> Kind {
        let lines = body.components(separatedBy: "\n")
        if let t = NotePage.tables(in: lines).first {
            let names = t.columns.map { $0.name.lowercased() }
            if names.contains(where: { $0.contains("amount") || $0.contains("cost") || $0.contains("price") || $0 == "kr" }) { return .budget }
            return names.contains("date") ? .tracker : .cards
        }
        return lines.contains(where: { ListPrefix(line: $0)?.checkbox != nil }) ? .checklist : .plain
    }

    /// What to ask for, as the words after "an app: ". Nothing when the note holds neither a table
    /// nor a checklist.
    static func idea(for body: String) -> String? {
        switch kind(for: body) {
        case .budget: "a budget with the total, spending by category, and a quick way to add an expense"
        case .tracker: "a tracker with today's entry at the top, streaks, and a chart of the last weeks"
        case .cards: "cards of this table that I can sort, filter and add to"
        case .checklist: "a checklist that shows what's left, groups the items, and lets me add and tick them"
        case .plain: nil
        }
    }

    /// One connected AI, and how the words reach it: a chat that opens with them (ChatGPT, Claude),
    /// or, for anything else (Claude Code, Codex, another MCP client), the words to paste.
    struct AI: Equatable, Identifiable {
        var name: String
        var isChat: Bool { ["ChatGPT", "Claude"].contains(name) }
        var id: String { name }
    }

    /// The device's memory of which AI was chosen here last ("Use another AI").
    static let chosenKey = "makeAppAI"

    /// The connected AIs, the one to offer first: the one chosen here last time if it is still
    /// connected, else the one used most recently, else (none used yet) the one connected most
    /// recently. The rest follow in that same order. Each AI once, by name.
    static func choices(_ connections: [Connection], chosen: String? = UserDefaults.standard.string(forKey: chosenKey)) -> [AI] {
        let live = connections.filter { $0.revoked_at == nil }.sorted { a, b in
            switch (a.last_used_at, b.last_used_at) {
            case let (x?, y?): x > y
            case (_?, nil): true
            case (nil, _?): false
            case (nil, nil): a.created_at > b.created_at
            }
        }
        var names: [String] = []
        for c in live { let n = c.mark ?? c.title; if !names.contains(n) { names.append(n) } }
        if let chosen, let i = names.firstIndex(of: chosen) { names.insert(names.remove(at: i), at: 0) }
        return names.map(AI.init(name:))
    }

    /// New App's words: the AI makes the note and its app.
    static func newAppPrompt(_ idea: String) -> String {
        let what = idea.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "."))
        return "In Pinto Notes, make me a new note that is an app: \(what). Make it with create (type app, a short title), read the app's README.md, then build it and look at it with see_app."
    }

    /// Examples to start New App from: the app-shaped templates on the site.
    static let examples: [(name: String, idea: String)] = [
        ("Habit tracker", "a habit tracker with today's habits to tick, streaks, and a week at a glance"),
        ("Trip plan", "a trip plan with the dates, a day-by-day plan, a packing list and a countdown"),
        ("Workout log", "a workout log where I add sets and reps, with my last session and progress over the weeks"),
    ]

    /// The template gallery: the site this build shares to (staging for the beta), else pintonotes.com.
    static var templatesPage: URL {
        (ShareLinkConfig.baseURL ?? URL(string: "https://pintonotes.com")!).appending(path: "templates")
    }

    /// The chat with the prompt typed in (WebConnectPlan.prefilled, the same link Try It uses).
    static func chat(_ ai: String, prompt: String) -> URL {
        WebConnectPlan.prefilled(ai == "ChatGPT" ? "https://chatgpt.com/" : "https://claude.ai/new", prompt)
    }

    static func prompt(title: String, body: String) -> String {
        "In Pinto Notes, make my note \u{201C}\(title)\u{201D} an app\(idea(for: body).map { ": \($0)" } ?? ""). Read the note, start its app with create (type app), read the app's README.md, and keep what the note's table or checklist holds in the app's data.json."
    }
}

/// Make It an App: one click hands the prompt to the person's AI, and the sheet then waits for the
/// app and closes itself when it is here (the note opens as the app). With no AI connected, one
/// button connects one and the sheet comes back ready. On the app's own ground, as tall as what
/// it says.
struct MakeAppSheet: View {
    /// The note to make an app of; nil for New App, where the AI makes the note too.
    let noteID: UUID?
    let title: String
    let body_: String
    /// New App: what the person asked for.
    @State private var idea = ""
    /// New App: the notes that already had an app when the words were handed over, so the new
    /// one is told apart.
    @State private var appsBefore: Set<UUID> = []
    @FocusState private var ideaFocused: Bool
    @Environment(Backend.self) private var backend: Backend?
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    /// The connected AIs, the one offered first (nil until known).
    @State private var ais: [MakeAnApp.AI]?
    /// Handed to this AI (or pasted somewhere): waiting for the app.
    @State private var waitingFor: String?
    /// Waited long enough with no app: say what to check, and offer the words again.
    @State private var late = false
    @State private var copied = false
    @State private var connecting = false
    @State private var height: CGFloat = 320

    /// How long the sheet waits for the app before it says what to check (it goes on waiting).
    static let patience: Duration = .seconds(180)

    #if DEBUG || QA
    /// Pictures of each state without an account:
    /// `-makeAppState none | chatgpt | claude | both | code | waiting | waiting-claude | late`.
    nonisolated(unsafe) static var stateForPictures: String? = Capture.argument("-makeAppState")
    /// `-makeAppPatience 5`: seconds before the waiting line changes, for tests.
    nonisolated(unsafe) static var patienceForTests: Duration? = Capture.argument("-makeAppPatience").flatMap(Double.init).map { .seconds($0) }
    /// The small sketch of the note as an app, compared with and without (`-makeAppSketch NO`).
    nonisolated(unsafe) static var sketch = Capture.argument("-makeAppSketch") != "NO"
    #else
    static let stateForPictures: String? = nil
    static let patienceForTests: Duration? = nil
    static let sketch = true
    #endif

    /// Make It an App for a note.
    init(noteID: UUID, title: String, body_: String) { self.noteID = noteID; self.title = title; self.body_ = body_ }
    /// New App: one question, and the AI makes the note and its app. Nothing is made here until
    /// the app arrives, so closing the sheet or waiting in vain leaves no empty note behind.
    init(newApp: Void) { noteID = nil; title = ""; body_ = "" }

    private var isNew: Bool { noteID == nil }
    private var prompt: String { isNew ? MakeAnApp.newAppPrompt(idea) : MakeAnApp.prompt(title: title, body: body_) }
    /// New App needs an answer before anything can be handed over.
    private var ready: Bool { !isNew || !idea.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            words
            if isNew {
                if waitingFor == nil { question }
            } else if Self.sketch {
                MakeAppSketch(title: title, kind: MakeAnApp.kind(for: body_))
            }
            step
            if isNew, waitingFor == nil { templatesLink }
        }
        .padding(.horizontal, Metrics.padding)
        .padding(.top, Metrics.top)
        .padding(.bottom, Metrics.padding)
        .overlay(alignment: .topTrailing) { close.padding(Metrics.closeInset) }
        .background(Color(Palette.sheetGround))
        #if os(macOS)
        .frame(width: 420)
        #else
        .fixedSize(horizontal: false, vertical: true)
        .onGeometryChange(for: CGFloat.self, of: \.size.height) { height = $0 }
        .presentationDetents([.height(height)])
        .presentationDragIndicator(.hidden)
        #endif
        .tint(Color(PColor.paneAccent))
        .task { await check() }
        // The app is here (made by the AI, arrived by sync): done. The note shows it.
        .onChange(of: noteID.map { NotePageStore.shared[$0] != nil } ?? false) { _, here in if here { dismiss() } }
        // New App: a note that had no app before has one now. Open it.
        .onChange(of: NotePageStore.shared.pages.count) { _, _ in arrivedNew() }
        // While waiting, ask for changes every few seconds as well as hearing of them.
        .task(id: waitingFor) {
            guard waitingFor != nil else { return }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(4))
                sync?.schedule()
            }
        }
        // No app after about three minutes: what to check, and the words again. Still waiting.
        .task(id: waitingFor) {
            guard waitingFor != nil, !late else { return }
            try? await Task.sleep(for: Self.patienceForTests ?? Self.patience)
            if !Task.isCancelled { withAnimation(.smooth(duration: 0.25)) { late = true } }
        }
        .sheet(isPresented: $connecting, onDismiss: { Task { await check() } }) {
            if let backend { SettingsView(backend: backend, sync: sync) }
        }
    }

    private var words: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(isNew ? "New App" : "Make this note an app")
                .font(Metrics.title)
                .tracking(-0.3)
                .foregroundStyle(Color.ink)
                .accessibilityAddTraits(.isHeader)
                .padding(.trailing, Metrics.closeSize + 8)
            Text(isNew
                 ? (ais?.isEmpty == true ? "An AI you connect builds it, as a new note. Choose yours to connect it." : "Your AI builds it, as a new note.")
                 : (ais?.isEmpty == true ? "An AI you connect builds it from what this note holds. Choose yours to connect it." : "Your AI builds it from what this note holds. You can undo it."))
                .font(Metrics.line)
                .foregroundStyle(Color.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    /// The one next step.
    @ViewBuilder private var step: some View {
        if let waitingFor {
            waiting(for: waitingFor)
        } else if let ais {
            if let ai = ais.first {
                VStack(alignment: .leading, spacing: Metrics.stepGap) {
                    if ai.isChat {
                        Button { hand(to: ai.name) } label: { Text("Make it with \(ai.name)").frame(maxWidth: .infinity) }
                            .buttonStyle(.amberProminent(.regular, wide: true))
                            .disabled(!ready)
                            .accessibilityIdentifier("makeApp.with.\(ai.name)")
                        if ai.name == "Claude" {
                            Text("Claude shows a caution note for prompts that arrive by link. Press send to continue.")
                                .font(Metrics.hint)
                                .foregroundStyle(Color.muted)
                                .multilineTextAlignment(.center)
                                .fixedSize(horizontal: false, vertical: true)
                                .frame(maxWidth: .infinity)
                                .accessibilityIdentifier("makeApp.claudeNote")
                        }
                    } else {
                        wordsToPaste(for: ai.name)
                    }
                    // Several connected: the others, by name. The one picked is offered first from now on.
                    if ais.count > 1 {
                        Menu {
                            ForEach(ais.dropFirst()) { other in
                                Button(other.name) { choose(other) }.accessibilityIdentifier("makeApp.use.\(other.name)")
                            }
                        } label: {
                            Text("Use another AI").font(Metrics.hint).foregroundStyle(Color.muted)
                        }
                        .menuStyle(.button)
                        .buttonStyle(.plain)
                        .menuIndicator(.hidden)
                        .fixedSize()
                        .frame(maxWidth: .infinity, alignment: .center)
                        .accessibilityIdentifier("makeApp.another")
                    }
                }
            } else if let client = backend?.client ?? (Self.stateForPictures != nil ? CaptureScreen.client : nil) {
                // No AI yet: the ways to connect one, right here, each one press (newcomer audit
                // #14: a lone button that opened Settings was a dead end). Once one is connected
                // the sheet goes on to "Make it with …".
                // Two large choices and the rest in one quiet menu, so the sheet stays short
                // (owner: no tall sheets).
                VStack(spacing: Metrics.stepGap) {
                    ConnectChoices(client: client, guides: MakeAnApp.connectGuides, listsConnected: false,
                                   preview: Self.stateForPictures != nil ? [] : nil,
                                   previewFound: Self.stateForPictures != nil ? [] : nil, compact: true) { connected in
                        if !connected.isEmpty { Task { await check() } }
                    }
                }
                .connectGuides(client: client)
                .accessibilityIdentifier("makeApp.connect")
            } else {
                Button { connecting = true } label: { Text(isNew ? "Connect Your AI" : "Connect an AI").frame(maxWidth: .infinity) }
                    .buttonStyle(.amberProminent(.regular, wide: true))
                    .accessibilityIdentifier("makeApp.connect")
            }
        } else {
            // Finding out which AIs are connected: the button's own height, so nothing jumps.
            ProgressView().controlSize(.small).frame(maxWidth: .infinity).frame(height: Metrics.button)
        }
    }

    /// For an AI that has no chat to open (Claude Code, Codex, another MCP client): the words, and Copy.
    private func wordsToPaste(for ai: String) -> some View {
        VStack(alignment: .leading, spacing: Metrics.stepGap) {
            Text(prompt)
                .font(Metrics.prompt)
                .foregroundStyle(Color.ink)
                .textSelection(.enabled)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.amberSoft, in: .rect(cornerRadius: Metrics.radius, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
                .accessibilityIdentifier("makeApp.prompt")
            Button { appsBefore = Set(NotePageStore.shared.pages.keys); copy(); withAnimation(.smooth(duration: 0.25)) { waitingFor = ai } } label: {
                Label("Copy for \(ai)", systemImage: "doc.on.doc").frame(maxWidth: .infinity)
            }
            .buttonStyle(.amberProminent(.regular, wide: true))
            .disabled(!ready)
            .accessibilityIdentifier("makeApp.copy")
        }
    }

    /// What the person does in the AI after the click, as it really is (checked 2026-10-11 on the
    /// web, signed in to Claude, signed out of ChatGPT): ChatGPT sends a prompt that arrives by
    /// link at once; Claude puts it in the box under a caution note and waits for send.
    static func afterHandOver(_ ai: String) -> String {
        switch ai {
        case "ChatGPT": "ChatGPT has the message. This closes when the app is here."
        case "Claude": "Press send in Claude, under its caution note. This closes when the app is here."
        default: "Paste the words into \(ai) and send them. This closes when the app is here."
        }
    }

    /// Handed over: one calm line while the AI works. The sheet closes itself when the app is here.
    /// After about three minutes without one: what to check, and the words to copy again.
    @ViewBuilder private func waiting(for ai: String) -> some View {
        VStack(spacing: 8) {
            HStack(spacing: 10) {
                ProgressView().controlSize(.small)
                Text(late ? "Still waiting for \(ai)" : "Waiting for \(ai) to build it…")
                    .font(Metrics.wait)
                    .foregroundStyle(Color.ink)
            }
            .frame(maxWidth: .infinity).frame(minHeight: Metrics.button)
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier(late ? "makeApp.late" : "makeApp.waiting")
            Text(late ? "Nothing has arrived yet. Check that \(ai) got the message and that it is connected to Pinto Notes, or give it the words again." : Self.afterHandOver(ai))
                .font(Metrics.hint)
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity)
            if late {
                Button { copy(); withAnimation(.smooth(duration: 0.2)) { copied = true } } label: {
                    Label(copied ? "Copied" : "Copy the Words", systemImage: copied ? "checkmark" : "doc.on.doc").frame(maxWidth: .infinity)
                }
                .buttonStyle(.secondary(.compact, wide: true))
                .padding(.top, 4)
                .accessibilityIdentifier("makeApp.copyAgain")
            }
        }
    }

    /// New App: "What should it do?", and examples to start from (the app templates on the site).
    private var question: some View {
        VStack(alignment: .leading, spacing: 8) {
            TextField("What should it do?", text: $idea, axis: .vertical)
                .lineLimit(2...4)
                .font(Metrics.prompt)
                .textFieldStyle(.plain)
                .focused($ideaFocused)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(Color(Palette.field), in: .rect(cornerRadius: Metrics.radius, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous).strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
                .accessibilityIdentifier("newApp.idea")
            HStack(spacing: 6) {
                ForEach(MakeAnApp.examples, id: \.name) { e in
                    Button { idea = e.idea } label: {
                        Text(e.name).font(Metrics.hint).foregroundStyle(Color.ink)
                            .padding(.horizontal, 10).frame(height: Metrics.chip)
                            .background(Color.amberSoft, in: .capsule)
                            .overlay(Capsule().strokeBorder(Color.line, lineWidth: 1))
                            .contentShape(.capsule)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("newApp.example.\(e.name)")
                }
            }
        }
        .onAppear { ideaFocused = true }
    }

    /// New App: the templates, in the gallery on the site (each opens in the app).
    private var templatesLink: some View {
        Button("Or start from a template") { openURL(MakeAnApp.templatesPage) }
            .buttonStyle(.hoverLink)
            .font(Metrics.hint)
            .foregroundStyle(Color.muted)
            .frame(maxWidth: .infinity, alignment: .center)
            .accessibilityIdentifier("newApp.templates")
    }

    /// New App: the first note to get an app since the words were handed over is the one.
    private func arrivedNew() {
        guard isNew, waitingFor != nil, let id = NotePageStore.shared.pages.keys.first(where: { !appsBefore.contains($0) }) else { return }
        NoteOpener.shared.open(id)
        dismiss()
    }

    private var close: some View {
        Button { dismiss() } label: {
            Image(systemName: "xmark")
                .font(.system(size: Metrics.closeGlyph, weight: .semibold))
                .foregroundStyle(Color.muted)
                .frame(width: Metrics.closeSize, height: Metrics.closeSize)
                .background(Color(Palette.sheetGround).opacity(0.9), in: .circle)
                .overlay(Circle().strokeBorder(Color.line, lineWidth: 1))
                .contentShape(.circle)
        }
        .buttonStyle(.plain)
        .keyboardShortcut(.cancelAction)
        .accessibilityLabel("Close")
        .accessibilityIdentifier("makeApp.close")
    }

    /// Mac: the system's sheet sizes. iPhone: the list's own type sizes.
    private enum Metrics {
        #if os(macOS)
        static let title = Font.system(size: 20, weight: .bold)
        static let line = Font.system(size: 13)
        static let prompt = Font.system(size: 13)
        static let hint = Font.system(size: 12)
        static let wait = Font.system(size: 13, weight: .medium)
        static let padding: CGFloat = 24
        static let top: CGFloat = 24
        static let gap: CGFloat = 16
        static let stepGap: CGFloat = 10
        static let radius: CGFloat = 10
        static let button: CGFloat = 34
        static let closeSize: CGFloat = 22
        static let closeGlyph: CGFloat = 9
        static let closeInset: CGFloat = 22
        static let chip: CGFloat = 24
        #else
        static let title = Font.title2.weight(.bold)
        static let line = Font.subheadline
        static let prompt = Font.callout
        static let hint = Font.footnote
        static let wait = Font.body.weight(.medium)
        static let padding: CGFloat = 24
        static let top: CGFloat = 24
        static let gap: CGFloat = 18
        static let stepGap: CGFloat = 12
        static let radius: CGFloat = 14
        static let button: CGFloat = 50
        static let closeSize: CGFloat = 30
        static let closeGlyph: CGFloat = 12
        static let closeInset: CGFloat = 20
        static let chip: CGFloat = 34
        #endif
    }

    /// Which AIs are connected to this account.
    private func check() async {
        if let state = Self.stateForPictures {
            let named = { (names: [String]) in names.map(MakeAnApp.AI.init(name:)) }
            switch state {
            case "chatgpt": ais = named(["ChatGPT"])
            case "claude": ais = named(["Claude"])
            case "both": ais = named(["ChatGPT", "Claude Code"])
            case "three": ais = named(["Claude Code", "ChatGPT", "Claude"])
            case "code": ais = named(["Claude Code"])
            case "waiting": ais = named(["ChatGPT"]); waitingFor = "ChatGPT"
            case "waiting-claude": ais = named(["Claude"]); waitingFor = "Claude"
            case "late": ais = named(["ChatGPT"]); waitingFor = "ChatGPT"; late = true
            default: ais = []
            }
            return
        }
        if ProcessInfo.processInfo.arguments.contains("-aiConnected") { ais = [.init(name: "ChatGPT")]; return }
        guard let client = backend?.client else { ais = []; return }
        let rows: [Connection] = (try? await client.from("mcp_tokens").select().execute().value) ?? []
        ais = MakeAnApp.choices(rows)
    }

    /// "Use another AI": that one is offered first, here and the next time, on this device.
    private func choose(_ ai: MakeAnApp.AI) {
        UserDefaults.standard.set(ai.name, forKey: MakeAnApp.chosenKey)
        guard var all = ais, let i = all.firstIndex(of: ai) else { return }
        all.insert(all.remove(at: i), at: 0)
        withAnimation(.smooth(duration: 0.2)) { ais = all }
    }

    /// One click: the AI opens with the words (see afterHandOver for what each does with them), and
    /// the sheet waits for the app. The words are copied too: neither app documents the link, and
    /// their Mac and iPhone apps were not tried, so pasting is the way if nothing arrives there.
    private func hand(to ai: String) {
        appsBefore = Set(NotePageStore.shared.pages.keys)
        ideaFocused = false
        copy()
        // Captures and UI tests stay in the app.
        if !ProcessInfo.processInfo.arguments.contains("-uitest") { openURL(MakeAnApp.chat(ai, prompt: prompt)) }
        withAnimation(.smooth(duration: 0.25)) { waitingFor = ai }
    }

    private func copy() {
        #if os(iOS)
        UIPasteboard.general.string = prompt
        #else
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(prompt, forType: .string)
        #endif
    }
}

/// The note as an app, sketched: its own title over the shapes of the kind of app it would make
/// (a tracker's ring and week, a budget's total and bars, a checklist's progress and rows, a
/// table's cards). Shapes only: nobody else's app, and no numbers that aren't the person's.
struct MakeAppSketch: View {
    let title: String
    let kind: MakeAnApp.Kind

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Text(title.isEmpty ? "Your note" : title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Color.ink)
                    .lineLimit(1)
                AppMarkView(size: 12)
            }
            shapes
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.notePage, in: .rect(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
        .accessibilityElement()
        .accessibilityLabel("\(title) as an app, sketched")
    }

    private func bar(_ width: CGFloat, _ color: Color = Color.line, height: CGFloat = 8) -> some View {
        Capsule().fill(color).frame(width: width, height: height)
    }

    @ViewBuilder private var shapes: some View {
        switch kind {
        case .tracker:
            HStack(spacing: 14) {
                Circle().trim(from: 0, to: 0.7).stroke(Color.amberInk, style: .init(lineWidth: 6, lineCap: .round)).rotationEffect(.degrees(-90))
                    .background(Circle().stroke(Color.line, lineWidth: 6)).frame(width: 40, height: 40).padding(3)
                VStack(alignment: .leading, spacing: 8) {
                    bar(110, Color.ink.opacity(0.55))
                    HStack(spacing: 5) { ForEach(0..<7, id: \.self) { i in bar(18, i < 5 ? Color.amberInk : Color.line, height: 6) } }
                }
            }
        case .budget:
            VStack(alignment: .leading, spacing: 8) {
                bar(90, Color.ink.opacity(0.55), height: 12)
                ForEach([150.0, 96, 58], id: \.self) { w in HStack(spacing: 8) { bar(44); bar(w, Color.amberInk) } }
            }
        case .checklist:
            VStack(alignment: .leading, spacing: 8) {
                ZStack(alignment: .leading) { bar(200); bar(120, Color.amberInk) }
                ForEach(0..<3, id: \.self) { i in
                    HStack(spacing: 8) {
                        Circle().strokeBorder(i == 0 ? Color.amberInk : Color.line, lineWidth: 1.5).background(Circle().fill(i == 0 ? Color.amberInk : .clear)).frame(width: 14, height: 14)
                        bar([120.0, 150, 90][i], Color.ink.opacity(i == 0 ? 0.25 : 0.5))
                    }
                }
            }
        case .cards, .plain:
            HStack(spacing: 8) {
                ForEach(0..<3, id: \.self) { i in
                    VStack(alignment: .leading, spacing: 6) { bar(50, Color.ink.opacity(0.55)); bar(70); bar([40.0, 56, 30][i], Color.amberInk) }
                        .padding(10).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(Palette.sheetGround), in: .rect(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }
}

// MARK: App settings

/// App Info: what only Amber Notes can do for a note's app. An app's own settings are the app's
/// (it draws them, and keeps them in its data); this holds the internet (which addresses it may
/// reach, what it sent, the libraries it downloaded), Previous App and Remove App.
struct AppInfoSheet: View {
    let noteID: UUID
    let html: String
    var hasPrevious = false
    var previous: () -> Void = {}
    var remove: () -> Void = {}
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                if let draft = NotePageStore.shared.drafts[noteID] {
                    Section {
                        Label("\(draft.by) is working on a new version", systemImage: "hammer")
                        Text("It didn't pass its checks yet, so this one keeps running. \(draft.problems)")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                }
                internet
                Section {
                    if hasPrevious {
                        Button("Previous App") { previous(); dismiss() }
                            .accessibilityIdentifier("appInfo.previous")
                    }
                    Button("Remove App", role: .destructive) { remove(); dismiss() }
                        .foregroundStyle(.red)
                        .accessibilityIdentifier("appInfo.remove")
                } footer: {
                    Text(hasPrevious ? "Removing the app keeps the note as it is. Previous App brings the one before back." : "Removing the app keeps the note as it is.")
                }
            }
            .formStyle(.grouped)
            .navigationTitle("App Info")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }.accessibilityIdentifier("appInfo.done")
                }
            }
        }
        #if os(macOS)
        .frame(minWidth: 420, minHeight: 320)
        #endif
    }

    /// Which addresses the app may reach, and its last requests (keys hidden).
    @ViewBuilder
    private var internet: some View {
        let log = NotePageNetLog.shared
        let hosts = (log.approved[noteID] ?? []).sorted()
        let entries = Array((log.entries[noteID] ?? []).suffix(8).reversed())
        let libs = NotePageLibraries.downloaded(for: html)
        Section {
            if hosts.isEmpty && entries.isEmpty && libs.isEmpty {
                Text("This app hasn't used the internet.").foregroundStyle(.secondary)
            }
            ForEach(libs, id: \.self) { l in Label("Downloaded library: \(l)", systemImage: "shippingbox") }
            ForEach(hosts, id: \.self) { h in Label(h, systemImage: "checkmark.circle") }
            ForEach(entries) { e in
                VStack(alignment: .leading, spacing: 3) {
                    HStack {
                        Text(e.method).font(.caption.monospaced().weight(.semibold))
                        Text(e.status.map(String.init) ?? e.error ?? "").font(.caption).foregroundStyle(.secondary)
                        Spacer()
                        Text(e.at, style: .time).font(.caption).foregroundStyle(.secondary)
                    }
                    Text(e.url).font(.caption.monospaced()).lineLimit(3).textSelection(.enabled)
                    if e.carriesNoteText {
                        Label("Includes text from this note", systemImage: "text.quote").font(.caption.weight(.semibold)).foregroundStyle(Color.amberInk)
                    }
                }
            }
            if !hosts.isEmpty {
                Button("Forget Allowed Addresses", role: .destructive) { log.forget(noteID) }
            }
        } header: {
            Text("Internet")
        } footer: {
            Text("The app asks before it reaches a new address. Everything it sends is listed here.")
        }
    }

}

import Supabase

/// Settings › Apps in Notes: whether an AI may preview a note's app with the note's real data
/// (pages-ai-tooling's preview_app; profiles.app_previews_real). Off by default: previews use made-up
/// data shaped like the note. Hidden on a backend without the setting.
struct AppPreviewSection: View {
    let client: SupabaseClient
    @State private var on = false
    @State private var available = false
    @State private var saving = false

    private struct Row: Codable { var user_id: UUID?; var app_previews_real: Bool }

    var body: some View {
        Group {
            if available {
                Section {
                    Toggle("Let AIs preview apps with my notes", isOn: Binding(get: { on }, set: { v in on = v; Task { await save(v) } }))
                        .disabled(saving)
                        .accessibilityIdentifier("settings.appPreviewsReal")
                } header: {
                    Text("Apps in Notes")
                } footer: {
                    Text("When your AI checks an app it made, it sees a picture of it. With this off, the picture uses made-up data shaped like your note. With it on, it shows your note's real data, decrypted for that check only.")
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        guard let user = client.auth.currentUser?.id else { return }
        let rows: [Row]? = try? await client.from("profiles").select("app_previews_real").eq("user_id", value: user).execute().value
        guard let rows else { return }
        on = rows.first?.app_previews_real ?? false
        available = true
    }

    private func save(_ v: Bool) async {
        guard let user = client.auth.currentUser?.id else { return }
        saving = true
        defer { saving = false }
        do {
            try await client.from("profiles").upsert(Row(user_id: user, app_previews_real: v), onConflict: "user_id").execute()
        } catch {
            on = !v
        }
    }
}

