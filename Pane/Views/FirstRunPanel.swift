#if os(macOS)
import AppKit
import Supabase
import SwiftData
import SwiftUI

/// The Mac's first run over the real app (`FirstRun`): the app dimmed behind, the panel on top,
/// and what the panel starts (sign-in, an import, connecting an AI, the prompt) done for real.
/// The panel steps aside while a sheet is up: an import, or the Allow sheet when an AI asks for
/// your notes (strict accounts; everyone else allows on the web).
struct FirstRunOverlay: View {
    let model: FirstRunModel
    let backend: Backend
    var sync: SyncEngine?
    /// The panel has landed: the gate ends the flow and the notes open on `landing`.
    let finish: (Onboarding.Landing?) -> Void

    @Environment(\.modelContext) private var context
    @Environment(\.openURL) private var openURL
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var center = ConnectCenter.shared
    @State private var run = ConnectRun()
    /// Another app's import sheet.
    @State private var importing: ImportKind?
    @State private var watch: Task<Void, Never>?
    /// The panel is going into the note.
    @State private var landed = false
    /// "Pinto noticed ChatGPT": while its Allow sheet is up (strict accounts), or for a moment
    /// when it connects without one (allowed on the web, the usual way).
    @State private var noticed: String?
    @State private var noticedDone = false

    /// A sheet the panel opened, or the Allow sheet, is over the window.
    private var sheetUp: Bool { importing != nil || center.pending != nil }

    var body: some View {
        ZStack(alignment: .top) {
            // The app shows through, a step darker, and takes no clicks while the panel asks.
            Color.black.opacity(landed ? 0 : Self.dim)
                .ignoresSafeArea()
                .contentShape(.rect)
                .onTapGesture {}
                .accessibilityHidden(true)
            if !sheetUp {
                FirstRunPanel(model: model, backend: backend, perform: perform, skip: skip)
                    .scaleEffect(landed && !reduceMotion ? 0.72 : 1, anchor: .topTrailing)
                    .offset(x: landed && !reduceMotion ? 120 : 0, y: landed && !reduceMotion ? -40 : 0)
                    .opacity(landed ? 0 : 1)
                    .padding(.top, Self.top)
                    .transition(.opacity)
            }
        }
        .overlay(alignment: .bottom) {
            if let noticed {
                Toast(text: "Pinto noticed \(noticed)", kind: noticedDone ? .done : .working)
                    .padding(.bottom, 28)
                    .transition(.opacity.combined(with: .offset(y: 6)))
                    .accessibilityIdentifier("firstRun.noticed")
            }
        }
        .animation(.easeOut(duration: 0.2), value: sheetUp)
        .animation(.easeOut(duration: 0.25), value: noticed)
        .sheet(item: $importing) { kind in
            ImportFlow(kind: kind) { ids in model.importFinished(count: ids.count) }
        }
        .onAppear {
            Funnel.record(.signInStep(nil, .shown))
            run.asksToFinish = false
            run.connected = { g in model.connected(g) }
            // Claude Code and Codex: their own command took the access token.
            run.added = { g in model.connected(g) }
        }
        .onDisappear { run.stop(givingUp: false) }
        .onChange(of: run.phase) { _, phase in
            guard let g = run.guide else { return }
            switch phase {
            case .waiting(let line): model.connecting(g, line: line)
            case .failed(let line, _): model.connectFailed(line)
            case .added, nil: break
            }
        }
        // An AI asked for your notes while the panel waits for it: said, under its Allow sheet.
        .onChange(of: center.pending) { _, pending in
            if pending != nil, model.step == .ai, let working = model.working {
                noticed = ConnectAISection.Guide(rawValue: working)?.title ?? "your AI"
                noticedDone = false
            } else if !noticedDone {
                noticed = nil
            }
        }
        // Connected, however it was allowed: said for a moment, then the panel's next question.
        .onChange(of: model.connected) { before, after in
            guard let g = FirstRun.noticed(before: before, after: after) else { return }
            noticed = g.title
            noticedDone = true
            Task {
                try? await Task.sleep(for: .seconds(2.4))
                if noticedDone, noticed == g.title { noticed = nil; noticedDone = false }
            }
        }
        .onChange(of: model.step) { _, step in
            if step != .ai { run.stop(givingUp: false) }
            if step != .ai && step != .tryIt { watch?.cancel() }
        }
        .onChange(of: model.landing != nil) { _, landing in if landing { land() } }
    }

    static let dim = 0.22
    static let top: CGFloat = 112

    // MARK: Doing what a row says

    private func perform(_ action: FirstRun.Action) {
        switch action {
        case .signIn(.apple): signInWithApple()
        case .signIn(.google): signInWithGoogle()
        case .email: model.chooseEmail()
        case .importAppleNotes: importAppleNotes()
        case .otherApps: model.go(.otherApps)
        case .importFrom(let kind): importing = kind
        case .openPrivacy: NSWorkspace.shared.open(FirstRun.automationSettings)
        case .back: model.back()
        case .connect(let g): connect(g)
        case .terminal: model.go(.terminal)
        case .proceed: model.proceed()
        case .ask(let g): ask(g)
        }
    }

    private func skip() {
        if model.step == .ai { run.stop(givingUp: true) }
        model.skip()
    }

    private func signInWithApple() {
        model.signInStarted("apple")
        #if DIRECT
        // The Mac download signs in with Apple on the web (no entitlement in Developer ID).
        Task {
            do {
                try await backend.signInWithAppleOnTheWeb()
                if case .signedIn = backend.state {} else { model.signInFailed(nil) }
            } catch {
                model.signInFailed(Backend.isCanceled(error) ? nil : Backend.appleMessage(for: error, linking: false))
            }
        }
        #else
        let raw = AppleSignIn.makeNonce()
        AppleAuthorizer.shared.run(nonce: raw) { result in
            switch AppleSignIn.credential(from: result, rawNonce: raw) {
            case .success(let credential):
                Task {
                    do { try await backend.signInWithApple(credential) } catch {
                        model.signInFailed(Backend.appleMessage(for: error, linking: false))
                    }
                }
            case .failure(let failure):
                if case .canceled = failure { Funnel.record(.signInStep(.apple, .cancelled)) }
                model.signInFailed(AppleSignIn.message(for: failure))
            }
        }
        #endif
    }

    private func signInWithGoogle() {
        model.signInStarted("google")
        Task {
            do {
                _ = try await backend.signInWithGoogle()
                if case .signedIn = backend.state {} else { model.signInFailed(nil) }
            } catch {
                model.signInFailed(Backend.isCanceled(error) ? nil : Backend.googleMessage(for: error))
            }
        }
    }

    /// Reads Apple Notes (macOS asks the first time, after this press that names Apple Notes),
    /// then brings every note that isn't here yet in, behind the panel, which goes on meanwhile.
    private func importAppleNotes() {
        model.appleNotesReading()
        AppleNotesFunnel.opened()
        Task {
            let result: Result<AppleNotesListing, Error> = await Task.detached { Result { try AppleNotesBridge.list() } }.value
            AppleNotesFunnel.read(result)
            switch result {
            case .failure(AppleNotesBridge.Failure.denied):
                model.appleNotesDenied()
            case .failure(let error):
                model.appleNotesFailed(error.localizedDescription)
            case .success(let listing):
                guard !listing.notes.isEmpty else { model.appleNotesEmpty(); return }
                let existing = AppleNotesListing.keysOfNotes(in: context)
                let picked = listing.pickedAtFirst(keys: existing)
                // The picked notes, and the locked ones nobody could pick: they're named afterwards.
                let chosen = listing.notes.filter { picked.contains($0.id) || $0.locked }
                model.importStarted(from: "Apple Notes", total: chosen.count)
                AppleNotesFunnel.importing()
                let context = self.context
                model.background = Task { @MainActor in
                    let summary = await AppleNotesImporter(context: context).run(chosen, listing: listing, keepFolders: true) { done, total in
                        model.importProgress(done: done, total: total)
                    }
                    AppleNotesFunnel.finished(summary)
                    // Notes already here from before count: they are in.
                    let count = summary.noteIDs.count > 0 ? summary.noteIDs.count : summary.alreadyImported
                    model.importFinished(count: count, line: summary.noteIDs.isEmpty && count > 0 ? "Your Apple Notes are already here" : summary.line())
                }
            }
        }
    }

    /// ChatGPT: its page in the browser, and the panel waiting on one line until the connection
    /// shows up, however it was allowed. The rest: the same run Connect an AI uses (Claude in the
    /// browser, Claude Code and Codex by command).
    private func connect(_ g: ConnectAISection.Guide) {
        guard let client = backend.client else { return }
        run.stop(givingUp: run.guide != nil)
        watch?.cancel()
        if g == .chatgpt {
            model.connecting(.chatgpt, line: FirstRun.chatgptWaiting())
            openURL(FirstRun.chatgptPage())
            watch = Task {
                let w = ConnectWatch(ai: "ChatGPT")
                await w.run(client: client)
                guard !Task.isCancelled, w.isConnected else { return }
                model.connected(.chatgpt)
            }
            return
        }
        model.connecting(g, line: g == .claude ? ConnectCopy.waiting(.claude) : ConnectCopy.adding(g))
        run.start(g, client: client) { openURL($0) }
    }

    /// The prompt goes to the AI (a link for ChatGPT and Claude, the clipboard for the rest), and
    /// the panel waits for the note it writes.
    private func ask(_ g: ConnectAISection.Guide) {
        ConnectClipboard.set(FirstRun.prompt)
        if let page = TryIt.page(for: g.title, prompt: FirstRun.prompt) { openURL(page) }
        model.asking(g)
        let since = Date.now.addingTimeInterval(-10)
        watch?.cancel()
        watch = Task {
            var round = 0
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                round += 1
                // The live channel usually brings it; a sync now and then in case it doesn't.
                if round % 4 == 0 { sync?.schedule() }
                if let id = FirstRun.written(AIEditStore.shared.entries, since: since), let note = context.note(id),
                   note.deletedAt == nil, note.trashedAt == nil {
                    model.noteArrived(id)
                    return
                }
            }
        }
    }

    private func land() {
        guard let landing = model.landing else { return }
        withAnimation(reduceMotion ? .easeOut(duration: 0.2) : .easeIn(duration: 0.42)) { landed = true }
        Task {
            try? await Task.sleep(for: .seconds(reduceMotion ? 0.2 : 0.45))
            finish(landing)
        }
    }
}

/// The panel itself: the question with its count, the rows, and the foot with the keys, what
/// runs behind it and Skip for now.
struct FirstRunPanel: View {
    let model: FirstRunModel
    let backend: Backend
    let perform: (FirstRun.Action) -> Void
    let skip: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var typed = ""
    @State private var keys = FirstRunKeys()
    /// Where the pointer was when these rows came up (see `FirstRun.hoverPicks`).
    @State private var restingAt: CGPoint?

    /// Tests: the question appears at once instead of being typed out.
    nonisolated(unsafe) static var typesQuestion = true

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous)
        VStack(spacing: 0) {
            header
            Divider().overlay(Color.line)
            if model.page == .email {
                email
            } else {
                rows
            }
            if let disclosure = model.disclosure {
                Text(disclosure)
                    .font(.footnote)
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 18)
                    .padding(.bottom, 10)
                    .accessibilityIdentifier("firstRun.disclosure")
            }
            if let problem = model.problem {
                Text(problem)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 18)
                    .padding(.bottom, 10)
                    .accessibilityIdentifier("firstRun.problem")
            }
            if model.step == .signIn, model.page == .signIn {
                ConsentFooter()
                    .padding(.horizontal, 18)
                    .padding(.bottom, 8)
            }
            foot
        }
        .frame(width: Metrics.width)
        .background(Color.card, in: shape)
        .clipShape(shape)
        .overlay(shape.strokeBorder(Color.line, lineWidth: 1))
        .shadow(color: .black.opacity(0.22), radius: 30, y: 14)
        .shadow(color: .black.opacity(0.08), radius: 3, y: 1)
        .animation(reduceMotion ? nil : .smooth(duration: 0.28), value: model.page)
        .animation(reduceMotion ? nil : .smooth(duration: 0.2), value: model.importStatus)
        .background(FirstRunKeyMonitor(keys: keys))
        .onAppear { keys.handle = handle }
        .onChange(of: model.page) { _, _ in keys.handle = handle }
        .task(id: model.question) { await type(model.question) }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Set up Pinto Notes")
        .accessibilityIdentifier("firstRun.panel")
    }

    // MARK: Parts

    private var header: some View {
        HStack(spacing: 12) {
            AppMark(size: 28)
            Text(typed)
                .font(.system(size: 21))
                .foregroundStyle(Color.ink)
                .lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityLabel(model.question)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("firstRun.question")
            Text(model.count)
                .font(.system(size: 11, weight: .medium))
                .monospacedDigit()
                .foregroundStyle(Color.muted)
                .accessibilityLabel("Step \(model.step.rawValue) of \(FirstRun.Step.allCases.count)")
                .accessibilityIdentifier("firstRun.count")
        }
        .padding(.horizontal, 18)
        .frame(minHeight: 60)
    }

    private var rows: some View {
        VStack(spacing: 2) {
            ForEach(Array(model.rows.enumerated()), id: \.element.id) { i, row in
                FirstRunRow(row: row, selected: i == model.selection, working: model.working == row.id) {
                    model.select(i)
                    perform(row.action)
                }
                .onHover { inside in
                    let here = NSEvent.mouseLocation
                    guard inside, FirstRun.hoverPicks(restingAt: restingAt, here: here) else { return }
                    restingAt = nil
                    model.select(i)
                }
            }
        }
        .onChange(of: model.rows.map(\.id), initial: true) { restingAt = NSEvent.mouseLocation }
        .padding(6)
        .id(model.page)
        .transition(.opacity)
    }

    private var email: some View {
        VStack(alignment: .leading, spacing: 10) {
            SignInView(backend: backend, heading: .beside(title: SignInView.startTitle, line: SignInView.startLine), emailOnly: true)
            Button("Back to Apple and Google") { model.back() }
                .buttonStyle(.hoverLink)
                .font(.footnote)
                .foregroundStyle(.tint)
                .accessibilityIdentifier("firstRun.emailBack")
        }
        .padding(.horizontal, 22)
        .padding(.vertical, 16)
    }

    private var foot: some View {
        HStack(spacing: 12) {
            if model.page != .email {
                keycaps(["\u{2191}", "\u{2193}"], "choose")
                keycaps(["\u{23CE}"], "pick")
            }
            Spacer(minLength: 8)
            if let line = model.statusLine {
                HStack(spacing: 6) {
                    switch model.importStatus {
                    case .running(_, let done, let total):
                        ProgressView(value: Double(done), total: Double(max(total, 1)))
                            .progressViewStyle(.circular).controlSize(.mini)
                    case .finished:
                        Image(systemName: "checkmark").foregroundStyle(.green)
                    case .failed:
                        Image(systemName: "exclamationmark.triangle.fill").symbolRenderingMode(.multicolor)
                    case nil:
                        EmptyView()
                    }
                    Text(line).monospacedDigit().lineLimit(1)
                }
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Color.ink)
                .accessibilityElement(children: .combine)
                .accessibilityIdentifier("firstRun.status")
            }
            if model.canSkip {
                Button(action: skip) {
                    HStack(spacing: 5) {
                        Keycap("esc")
                        Text(FirstRun.skip)
                    }
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(Color.muted)
                .accessibilityLabel(FirstRun.skip)
                .accessibilityIdentifier("firstRun.skip")
            }
        }
        .padding(.horizontal, 14)
        .frame(height: 34)
        .background(Color.soft)
    }

    private func keycaps(_ caps: [String], _ word: String) -> some View {
        HStack(spacing: 3) {
            ForEach(caps, id: \.self) { Keycap($0) }
            Text(word).padding(.leading, 2)
        }
        .font(.system(size: 11))
        .foregroundStyle(Color.muted)
        .accessibilityHidden(true)
    }

    // MARK: Keys

    /// Arrows move the pick, Return does it, Esc skips. On the email page the form has the keys,
    /// and Esc goes back to the rows.
    private func handle(_ key: FirstRunKeys.Key) -> Bool {
        if model.page == .email {
            guard key == .escape else { return false }
            model.back()
            return true
        }
        switch key {
        case .up: model.move(-1)
        case .down: model.move(1)
        case .enter:
            guard let action = model.returnPressed() else { return false }
            perform(action)
        case .escape:
            guard model.canSkip else { return false }
            skip()
        }
        return true
    }

    /// The question, typed out with a caret, as in the prototype.
    private func type(_ text: String) async {
        guard Self.typesQuestion, !reduceMotion else { typed = text; return }
        typed = ""
        for ch in text {
            typed.append(ch)
            try? await Task.sleep(for: .milliseconds(14))
            if Task.isCancelled { typed = text; return }
        }
    }

    enum Metrics {
        static let width: CGFloat = 600
        static let radius: CGFloat = 14
    }
}

/// One row: the mark, the words, and ⏎ on the one Return picks.
struct FirstRunRow: View {
    let row: FirstRun.Row
    let selected: Bool
    var working = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                FirstRunMark(mark: row.mark)
                VStack(alignment: .leading, spacing: 2) {
                    Text(row.title)
                        .font(.system(size: row.quote ? 14 : 15, weight: .semibold))
                        .fixedSize(horizontal: false, vertical: true)
                    Text(row.detail)
                        .font(.system(size: 12))
                        .opacity(selected ? 0.85 : 1)
                        .foregroundStyle(selected ? Color.white : Color.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .foregroundStyle(selected ? Color.white : Color.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
                Group {
                    if working {
                        ProgressView().controlSize(.small).tint(selected ? .white : nil)
                    } else if selected {
                        Text("\u{23CE}")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 26, height: 22)
                            .background(.white.opacity(0.2), in: .rect(cornerRadius: 5))
                    }
                }
                .frame(width: 28)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 9)
            .frame(maxWidth: .infinity, minHeight: 54, alignment: .leading)
            .background(selected ? Color(Palette.amberButton) : .clear, in: .rect(cornerRadius: 9, style: .continuous))
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(row.title)
        .accessibilityValue(row.detail)
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
        .accessibilityIdentifier("firstRun.row.\(row.id)")
    }
}

/// A row's mark: the app's own icon, the AI's mark, or a quiet symbol.
struct FirstRunMark: View {
    let mark: FirstRun.Mark
    static let size: CGFloat = 34

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 8, style: .continuous)
        switch mark {
        case .origin(let origin):
            ImportSourceIcon(origin: origin, size: Self.size)
        case .ai(let ai):
            AITile(ai: ai, size: Self.size)
        case .apple:
            Image(systemName: "applelogo").font(.system(size: 17, weight: .medium)).foregroundStyle(.white)
                .frame(width: Self.size, height: Self.size).background(Color.black, in: shape)
                .overlay(shape.strokeBorder(.white.opacity(0.12), lineWidth: 1))
        case .google:
            Image("GoogleG").resizable().interpolation(.high).frame(width: 17, height: 17)
                .frame(width: Self.size, height: Self.size).background(Color.white, in: shape)
                .overlay(shape.strokeBorder(.black.opacity(0.1), lineWidth: 1))
        case .check:
            Image(systemName: "checkmark").font(.system(size: 14, weight: .bold)).foregroundStyle(.white)
                .frame(width: Self.size, height: Self.size).background(Color(Palette.amberButton), in: shape)
                .overlay(shape.strokeBorder(.white.opacity(0.25), lineWidth: 1))
        default:
            Image(systemName: symbol).font(.system(size: 14, weight: .medium)).foregroundStyle(Color.muted)
                .frame(width: Self.size, height: Self.size).background(Color.soft, in: shape)
        }
    }

    private var symbol: String {
        switch mark {
        case .email: "envelope"
        case .more: "ellipsis"
        case .back: "chevron.left"
        case .settings: "gearshape"
        case .retry: "arrow.clockwise"
        default: "circle"
        }
    }
}

/// A key's cap, in the panel's foot.
struct Keycap: View {
    let key: String
    init(_ key: String) { self.key = key }

    var body: some View {
        Text(key)
            .font(.system(size: 10, weight: .semibold))
            .foregroundStyle(Color.ink)
            .padding(.horizontal, 5)
            .frame(minWidth: 18, minHeight: 17)
            .background(Color.card, in: .rect(cornerRadius: 4))
            .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(Color.line, lineWidth: 1))
    }
}

/// The panel's keys, read from this window's own key presses (an app-local monitor: nothing
/// system-wide, and only while no sheet is over the window).
@MainActor
final class FirstRunKeys {
    enum Key: Equatable { case up, down, enter, escape }
    var handle: (Key) -> Bool = { _ in false }

    static func key(_ code: UInt16) -> Key? {
        switch code {
        case 126: .up
        case 125: .down
        case 36, 76: .enter
        case 53: .escape
        default: nil
        }
    }
}

private struct FirstRunKeyMonitor: NSViewRepresentable {
    let keys: FirstRunKeys

    final class Coordinator {
        var monitor: Any?
        deinit { if let monitor { NSEvent.removeMonitor(monitor) } }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        let keys = keys
        context.coordinator.monitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak view] event in
            // Only what's needed crosses to the main actor: the event itself isn't Sendable.
            let number = event.windowNumber, code = event.keyCode
            let plain = event.modifierFlags.intersection([.command, .option, .control]).isEmpty
            let taken = MainActor.assumeIsolated { () -> Bool in
                guard plain, let window = view?.window, window.windowNumber == number, window.attachedSheet == nil,
                      let key = FirstRunKeys.key(code) else { return false }
                return keys.handle(key)
            }
            return taken ? nil : event
        }
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {}
}
#endif
