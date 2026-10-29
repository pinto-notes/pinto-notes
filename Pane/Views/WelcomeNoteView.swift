#if os(iOS)
import SwiftUI

/// iPhone, signed out: the welcome is a note being written, in the note editor itself (read-only
/// while it plays), so it looks exactly as the note will when it opens. Today's date; a caret;
/// "Welcome" types itself, then two lines; then ChatGPT and Claude, each with its own caret and
/// name flag, write "Get started" and three to-dos, each line lit as an AI's edit is, with a light
/// tap. The checkboxes are real (ticked by hand only). Then the way in rises at the foot of the
/// page. Tapping the note skips to the end; with Reduce Motion it's finished from the start.
/// Timings from the prototype (welcome-note-v3.html, "ChatGPT + Claude").
struct WelcomeNoteView: View {
    let backend: Backend
    /// Captures: the finished note with the way in, at once, and scrolled to its end.
    var finished = false
    var scrolledToEnd = false
    let useEmail: () -> Void

    init(backend: Backend, finished: Bool = false, scrolledToEnd: Bool = false, useEmail: @escaping () -> Void) {
        self.backend = backend
        self.finished = finished
        self.scrolledToEnd = scrolledToEnd
        self.useEmail = useEmail
    }

    @State private var progress = WelcomeNote.Progress()
    @State private var you: Field? = .title
    @State private var ai: (Field, Writer)?
    @State private var done = false
    @State private var wayIn = false
    @State private var ticked: Set<Int> = []
    @State private var landed = 0
    @State private var working = false
    @State private var pressed: SignInView.Way?
    @State private var error: String?
    @State private var wayInHeight: CGFloat = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    enum Field: Equatable { case title, line1, line2, section, todo(Int) }

    /// Who writes: ChatGPT "Get started", Claude the first to-do, ChatGPT the second, Claude the third.
    enum Writer {
        case chatGPT, claude
        var name: String { self == .chatGPT ? "ChatGPT" : "Claude" }
        var color: Color { self == .chatGPT ? Color(red: 0.063, green: 0.639, blue: 0.498) : Color(red: 0.851, green: 0.467, blue: 0.341) }
    }
    static let order: [Writer] = [.chatGPT, .claude, .chatGPT, .claude]

    private let items = WelcomeNote.items(for: .iPhone)

    var body: some View {
        WelcomeEditorPage(progress: progress, ticked: $ticked, you: you, ai: ai, bottomReserve: wayIn ? wayInHeight : 0,
                          scrolledToEnd: scrolledToEnd && wayIn)
            .simultaneousGesture(TapGesture().onEnded { if !done { finish() } })
            .overlay(alignment: .bottom) {
                if !done {
                    Text("Tap to skip")
                        .font(.footnote)
                        .foregroundStyle(Color.muted)
                        .padding(.bottom, 24)
                        .allowsHitTesting(false)
                }
            }
            .overlay(alignment: .bottom) {
                if wayIn {
                    wayInBlock
                        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { wayInHeight = $0 }
                        // Rises like the keyboard; no fade.
                        .transition(.move(edge: .bottom))
                }
            }
            .sensoryFeedback(.impact(weight: .light), trigger: landed)
            .onChange(of: ticked) { _, now in WelcomeNote.ticked = now }
            .task { await play() }
            .accessibilityIdentifier("welcome.note")
    }

    // MARK: The way in

    /// On the note's own paper, part of the page: what the app is, Apple, Google, email, the terms.
    private var wayInBlock: some View {
        VStack(spacing: 12) {
            Text("Notes you and your AI share.")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.muted)
                .padding(.bottom, 4)
                .accessibilityIdentifier("welcome.tagline")
            AppleAuthButton(label: .continue, height: SignInView.Row.height, cornerRadius: SignInView.Row.radius, title: "Continue with Apple",
                            busy: working && pressed == .apple) { result in
                switch result {
                case .success(let credential): signIn(credential)
                case .failure(let failure):
                    error = AppleSignIn.message(for: failure)
                    WelcomeHandoff.shared.disarm()
                }
            }
            .disabled(working)
            .accessibilityIdentifier(WelcomeNoteView.appleID)
            if SignInView.offersGoogle {
                GoogleAuthButton(title: "Continue with Google", busy: working && pressed == .google, action: google)
                    .disabled(working)
                    .accessibilityIdentifier(WelcomeNoteView.googleID)
            }
            if let error {
                Text(error).font(.footnote).foregroundStyle(.red).multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Button("Use email", action: useEmail)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.amberInk)
                .buttonStyle(.plain)
                .frame(minHeight: 44)
                .accessibilityIdentifier(WelcomeNoteView.emailID)
            // Two short lines: the terms, then what the app sends about itself (App Review asks
            // for it on this screen).
            VStack(spacing: 2) {
                Text(Legal.shortConsent)
                Text(DiagnosticsCopy.welcome)
            }
            .font(.caption)
            .foregroundStyle(Color.muted)
            .tint(Color(PColor.paneAccent))
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier("welcome.legal")
        }
        .padding(.horizontal, 22)
        .padding(.top, 18)
        .padding(.bottom, 8)
        // At the largest sizes the way in would cover the note: it grows only so far, and the
        // note above it still scrolls at full size.
        .dynamicTypeSize(...DynamicTypeSize.xxLarge)
        .frame(maxWidth: WelcomeFlow.readableWidth)
        .frame(maxWidth: .infinity)
        .background(Color.notePage.ignoresSafeArea(edges: .bottom))
    }

    static let end = "welcome.end"
    static let appleID = "welcome.apple"
    static let googleID = "welcome.google"
    static let emailID = "welcome.email"

    private func google() {
        WelcomeHandoff.shared.arm(ticked: ticked, way: .google)
        working = true
        pressed = .google
        error = nil
        Task {
            do { try await backend.signInWithGoogle() } catch where !Backend.isCanceled(error) {
                self.error = Backend.googleMessage(for: error)
                WelcomeHandoff.shared.disarm()
            } catch {
                WelcomeHandoff.shared.disarm()
            }
            working = false
            pressed = nil
        }
    }

    private func signIn(_ credential: AppleSignIn.Credential) {
        WelcomeHandoff.shared.arm(ticked: ticked, way: .apple)
        working = true
        pressed = .apple
        error = nil
        Task {
            do { try await backend.signInWithApple(credential) } catch {
                self.error = Backend.appleMessage(for: error, linking: false)
                WelcomeHandoff.shared.disarm()
            }
            working = false
            pressed = nil
        }
    }

    // MARK: The writing

    private func play() async {
        if finished || reduceMotion { finish(animated: false); return }
        do {
            try await pause(500)
            try await type(WelcomeNote.title.count, into: .title, every: 75, text: WelcomeNote.title)
            try await pause(260)
            try await type(WelcomeNote.lines[0].count, into: .line1, every: 30, text: WelcomeNote.lines[0])
            try await pause(200)
            try await type(WelcomeNote.lines[1].count, into: .line2, every: 30, text: WelcomeNote.lines[1])
            try await pause(450)
            you = nil
            ai = (.section, Self.order[0])
            try await type(WelcomeNote.section.count, into: .section, every: 32)
            try await pause(250)
            for i in items.indices {
                progress.todos.append(0)
                landed += 1
                ai = (.todo(i), Self.order[i + 1])
                try await type(items[i].title.count, into: .todo(i), every: 26)
                try await pause(280)
            }
            ai = nil
            // Not done until the way in is up: a pause after done would read as a skip and stop here.
            try await pause(700)
            finish()
        } catch {}
    }

    /// Everything written at once, and the way in up.
    private func finish(animated: Bool = true) {
        progress = .finished(.iPhone)
        you = nil
        ai = nil
        done = true
        if animated {
            withAnimation(.spring(response: 0.42, dampingFraction: 0.75)) { wayIn = true }
        } else {
            wayIn = true
        }
        Self.wayInShown += 1
    }

    /// How fast the note writes itself (tests play it through at a hundredth of the time), and how
    /// often the way in has come up (the test that plays it to the end checks it did).
    static var pace = 1.0
    static var wayInShown = 0
    /// Tests: called after every pause of the writing, with what was shown during it on screen.
    static var stepped: (() -> Void)?

    private struct Skipped: Error {}

    private func pause(_ ms: Int) async throws {
        try await Task.sleep(for: .milliseconds(Double(ms) * Self.pace))
        Self.stepped?()
        if done { throw Skipped() }
    }

    /// One character at a time, a little uneven, as a person types (a little longer on spaces).
    private func type(_ count: Int, into field: Field, every ms: Int, text: String? = nil) async throws {
        if you != nil { you = field }
        for n in 1...count {
            set(field, n)
            let space = text.map { $0[$0.index($0.startIndex, offsetBy: n - 1)] == " " } ?? false
            let extra = space ? Double(ms) * 0.6 : 0
            try await pause(Int(Double(ms) + extra + Double.random(in: 0...(Double(ms) * (text == nil ? 0.6 : 0.5)))))
        }
    }

    private func set(_ field: Field, _ n: Int) {
        switch field {
        case .title: progress.title = n
        case .line1: progress.line1 = n
        case .line2: progress.line2 = n
        case .section: progress.section = n
        case .todo(let i): progress.todos[i] = n
        }
    }
}

/// The welcome note in the note editor, read-only, as far as it's written: the editor's own date
/// line, title, label and checklist, so it's the note itself when it opens. Your caret and the
/// AIs' are drawn by the editor as a collaborator's are; a to-do an AI starts lights up as an AI's
/// edit does. Ticking still works.
struct WelcomeEditorPage: View {
    var progress = WelcomeNote.Progress.finished(.iPhone)
    @Binding var ticked: Set<Int>
    var you: WelcomeNoteView.Field? = nil
    var ai: (WelcomeNoteView.Field, WelcomeNoteView.Writer)? = nil
    var bottomReserve: CGFloat = 0
    var scrolledToEnd = false
    var date = Date.now
    @State private var controller: EditorController = {
        let c = EditorController()
        c.readOnly = true
        c.inert = true
        return c
    }()
    @State private var lit = -1
    @State private var blink = true

    private var text: String { WelcomeNote.text(progress, for: .iPhone, ticked: ticked) }

    /// The paper reaches up under the status bar. The hand-off's page leaves that to its own paper,
    /// which fades to show the note screen's buttons.
    var paperToTop = true

    var body: some View {
        // No bar: the date sits just under the status bar. The note screen puts it a bar lower
        // (WelcomeHandoffPage settles it there when the note opens).
        MarkdownEditor(initialText: text, header: DateBucket.header(date), controller: controller, identifier: "welcome.editor") { new in
            // A tick by hand: the only change the read-only editor makes.
            let now = WelcomeNote.ticks(in: new, for: .iPhone)
            if now != ticked { ticked = now }
        }
        .ignoresSafeArea(.container, edges: .bottom)
        .background(Color.notePage.ignoresSafeArea(edges: paperToTop ? .all : .bottom))
        // Read in the view as it is now: a closure kept from before would draw a caret where the
        // text was then (the blink once put yours back at the start of the note).
        .onChange(of: text, initial: true) { _, _ in carets() }
        .onChange(of: blink) { _, _ in carets() }
        .onChange(of: you) { _, _ in carets() }
        .onChange(of: ai?.0) { _, _ in carets() }
        .onChange(of: ai?.1) { _, _ in carets() }
        .onChange(of: bottomReserve, initial: true) { _, r in controller.bottomReserve = r }
        // Only while it's being written, one to-do at a time: a note finished at once has nothing lit.
        .onChange(of: progress.todos.count) { old, count in if count == old + 1 { light(count - 1) } }
        .onChange(of: scrolledToEnd) { _, end in
            if end, let tv = controller.target as? UITextView {
                tv.layoutIfNeeded()
                tv.setContentOffset(CGPoint(x: 0, y: max(0, tv.contentSize.height - tv.bounds.height + tv.adjustedContentInset.bottom)), animated: false)
            }
        }
        .task(id: you == nil) {
            // Your caret blinks, once a second, as a text field's does.
            while you != nil, !Task.isCancelled {
                try? await Task.sleep(for: .milliseconds(500))
                blink.toggle()
            }
        }
    }

    /// Where the field being written ends in the text, as an offset (UTF-16).
    private func end(of field: WelcomeNoteView.Field) -> Int {
        let ns = text as NSString
        switch field {
        case .title: return (String(WelcomeNote.title.prefix(progress.title)) as NSString).length
        case .line1, .line2, .section:
            let target: String = switch field {
            case .line1: String(WelcomeNote.lines[0].prefix(progress.line1))
            case .line2: String(WelcomeNote.lines[1].prefix(progress.line2))
            default: "### " + String(WelcomeNote.section.prefix(progress.section))
            }
            var lineStart = 0
            for line in text.components(separatedBy: "\n") {
                if line == target, !target.isEmpty || field != .title { return lineStart + (line as NSString).length }
                lineStart += (line as NSString).length + 1
            }
            return ns.length
        case .todo: return ns.length
        }
    }

    private func carets() {
        var out: [RemoteCaret] = []
        if let you, blink {
            let at = end(of: you)
            out.append(RemoteCaret(id: Self.yours, name: "", color: Color(Palette.amber), range: NSRange(location: at, length: 0), showsName: false))
        }
        if let (field, writer) = ai {
            out.append(RemoteCaret(id: Self.theirs, name: writer.name, color: writer.color, range: NSRange(location: end(of: field), length: 0)))
        }
        if controller.remoteCarets != out { controller.remoteCarets = out }
    }

    /// The to-do an AI just started lights up as an AI's edit does, then settles.
    private func light(_ i: Int) {
        guard i >= 0, i != lit else { return }
        lit = i
        let before = WelcomeNote.text(WelcomeNote.Progress(title: progress.title, line1: progress.line1, line2: progress.line2,
                                                           section: progress.section, todos: Array(progress.todos.prefix(i))),
                                      for: .iPhone, ticked: ticked)
        Task {
            // Once its first letters are in, so the tint has a line to sit on.
            try? await Task.sleep(for: .milliseconds(120))
            (controller.target as? PaneTextView)?.tintChanges(from: before)
        }
    }

    static let yours = UUID(uuidString: "00000000-0000-0000-0000-00000000C0DE")!
    static let theirs = UUID(uuidString: "00000000-0000-0000-0000-0000000000A1")!
}

/// The finished welcome over the note screen as it opens. It starts where the welcome was, the
/// date just under the status bar; settled, it is a bar lower, exactly where the note screen puts
/// the note, and the paper over the screen's bars has faded so their buttons show. Each bar's height
/// is read from an empty note screen drawn out of sight, so it is the screen's own.
struct WelcomeHandoffPage: View {
    @Binding var ticked: Set<Int>
    var settled = false
    var date = Date.now
    /// The safe area here, and under the note screen's bars.
    @State private var outside = EdgeInsets()
    @State private var inside = EdgeInsets()

    /// How much lower the note screen starts the note than the welcome does: its top bar.
    var drop: CGFloat { max(0, inside.top - outside.top) }

    var body: some View {
        ZStack(alignment: .top) {
            NavigationStack {
                Color.clear
                    .ignoresSafeArea()
                    .onGeometryChange(for: EdgeInsets.self) { $0.safeAreaInsets } action: { inside = $0 }
                    .navigationTitle("")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar(.visible, for: .navigationBar)
                    .toolbar { ToolbarItem(placement: .bottomBar) { Image(systemName: "square") } }
            }
            .opacity(0)
            .accessibilityHidden(true)
            // Over the bars: fades as the page settles, so the buttons under it come up.
            Color.notePage.opacity(settled ? 0 : 1).ignoresSafeArea()
            WelcomeEditorPage(ticked: $ticked, date: date, paperToTop: false)
                .offset(y: settled ? drop : 0)
                // Never over the bottom bar: its buttons come up with the top bar's.
                .mask { Rectangle().padding(.top, -1000).padding(.bottom, inside.bottom) }
        }
        .background { Color.clear.ignoresSafeArea().onGeometryChange(for: EdgeInsets.self) { $0.safeAreaInsets } action: { outside = $0 } }
    }
}

/// Over everything after a sign-in from the welcome note (WelcomeHandoff). A new account: the
/// finished note, exactly as the welcome showed it, stays while the account is made; then the note
/// opens in the editor underneath, the way in drops away, the page settles a bar lower as the
/// bar's buttons fade in (with Reduce Motion, the welcome fades into the note instead), and this
/// goes, so the welcome simply becomes the note. An account from before: the note slides away to
/// its notes.
struct WelcomeHandoffOverlay: View {
    @State private var handoff = WelcomeHandoff.shared
    @State private var gone = false
    @State private var wayInGone = false
    @State private var settled = false
    /// The note is written: the button says done for a moment before the note opens.
    @State private var signedIn = false
    @State private var ticked: Set<Int> = []
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// How long "done" shows, how long the editor takes to open under the note, and the settle.
    static let doneHold = 0.4
    static let openHold = 0.4
    static let settle = 0.35

    var body: some View {
        GeometryReader { g in
            let h = g.size.height + g.safeAreaInsets.top + g.safeAreaInsets.bottom
            ZStack {
                WelcomeHandoffPage(ticked: $ticked, settled: settled && !reduceMotion)
                    .opacity(settled && reduceMotion ? 0 : 1)
                    .offset(y: gone ? h : 0)
                ZStack(alignment: .bottom) {
                    Color.clear
                    HandoffWayIn(way: handoff.way, done: signedIn)
                        .padding(.bottom, g.safeAreaInsets.bottom)
                        .offset(y: gone || wayInGone ? h : 0)
                }
                .ignoresSafeArea()
            }
        }
        .allowsHitTesting(false)
        .onAppear { ticked = handoff.ticked }
        .onChange(of: handoff.noteID) { _, id in
            guard let id else { return }
            withAnimation(.snappy(duration: 0.2)) { signedIn = true }
            Task {
                try? await Task.sleep(for: .seconds(Self.doneHold))
                // The note opens in the editor, under this: the same note, a bar lower.
                NoteOpener.shared.open(id)
                withAnimation(.timingCurve(0.4, 0, 0.2, 1, duration: 0.3)) { wayInGone = true }
                try? await Task.sleep(for: .seconds(Self.openHold))
                // One eased move, no bounce: the page settles under the bar as its buttons come up.
                withAnimation(.timingCurve(0.4, 0, 0.2, 1, duration: Self.settle)) { settled = true }
                try? await Task.sleep(for: .seconds(Self.settle + 0.05))
                handoff.opened()
            }
        }
        .onChange(of: handoff.phase) { _, phase in
            if phase == .leaving {
                withAnimation(.timingCurve(0.4, 0, 0.2, 1, duration: 0.36)) { gone = true }
                Task { try? await Task.sleep(for: .milliseconds(380)); handoff.done() }
            }
        }
        .task {
            // The key and the first sync can be slow: past a while, the note steps aside rather
            // than hold the screen.
            while handoff.phase == .waiting {
                try? await Task.sleep(for: .milliseconds(500))
                if handoff.waitedTooLong { handoff.leave() }
            }
        }
    }
}

/// The welcome's way in after its button was pressed: the tagline, and that button working (a
/// spinner in its mark's place), then done (a tick: "Signed in").
struct HandoffWayIn: View {
    let way: WelcomeHandoff.Way
    let done: Bool
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let apple = way == .apple
        let shape = RoundedRectangle(cornerRadius: SignInView.Row.radius, style: .continuous)
        // Apple's button is black, white in the dark; Google's the soft fill, as on the welcome.
        let fill: Color = apple ? (scheme == .dark ? .white : .black) : Color.soft
        let ink: Color = apple ? (scheme == .dark ? .black : .white) : Color.ink
        VStack(spacing: 12) {
            Text("Notes you and your AI share.")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.muted)
            HStack(spacing: 8) {
                if done {
                    Image(systemName: "checkmark").font(.body.weight(.bold)).transition(.scale.combined(with: .opacity))
                } else {
                    ProgressView().controlSize(.small).tint(ink)
                }
                Text(done ? "Signed in" : (apple ? "Continue with Apple" : "Continue with Google"))
                    .font(.system(size: 17, weight: .semibold))
                    .contentTransition(.opacity)
            }
            .foregroundStyle(ink)
            .frame(maxWidth: .infinity, minHeight: SignInView.Row.height)
            .background(fill, in: shape)
            .accessibilityElement(children: .combine)
            .accessibilityLabel(done ? "Signed in" : "Signing in")
            .accessibilityIdentifier("welcome.handoff.button")
        }
        .padding(.horizontal, 22)
        .padding(.top, 18)
        .padding(.bottom, 24)
        .frame(maxWidth: WelcomeFlow.readableWidth)
        .frame(maxWidth: .infinity)
        .background(Color.notePage)
    }
}
#endif
