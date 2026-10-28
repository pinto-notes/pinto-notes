#if os(iOS)
import SwiftUI

/// iPhone, signed out: the welcome is a note being written. Today's date and a blinking caret;
/// "Welcome" types itself, then two lines; then ChatGPT and Claude, each with its own caret and
/// name tag, write "Get started" and three to-dos, each landing on a soft highlight with a light
/// tap. The checkboxes are real (they're only ticked by hand). Then the way in rises at the foot of
/// the page. Tapping the note skips to the end; with Reduce Motion it's finished from the start.
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

    @State private var head = 0
    @State private var line1 = 0
    @State private var line2 = 0
    @State private var section = 0
    @State private var todo = [0, 0, 0]
    /// The to-dos that have come in, their sublines, and the ones still lit.
    @State private var shown = 0
    @State private var subs: Set<Int> = []
    @State private var lit: Set<Int> = []
    @State private var you: Field? = .head
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

    enum Field: Equatable { case head, line1, line2, section, todo(Int) }

    /// Who writes: ChatGPT "Get started", Claude the first to-do, ChatGPT the second, Claude the third.
    enum Writer {
        case chatGPT, claude
        var name: String { self == .chatGPT ? "ChatGPT" : "Claude" }
        var color: Color { self == .chatGPT ? Color(red: 0.063, green: 0.639, blue: 0.498) : Color(red: 0.851, green: 0.467, blue: 0.341) }
    }
    static let order: [Writer] = [.chatGPT, .claude, .chatGPT, .claude]

    private let items = WelcomeNote.items(for: .iPhone)

    var body: some View {
        ScrollViewReader { reader in
            ScrollView {
                WelcomeNotePage(head: head, line1: line1, line2: line2, section: section, todo: todo, shown: shown, subs: subs, lit: lit,
                                you: you, ai: ai.map { ($0.0, $0.1) }, ticked: $ticked)
                    .padding(.bottom, 24)
                Color.clear.frame(height: 1).id(Self.end)
            }
            .onChange(of: wayInHeight) { _, _ in if scrolledToEnd { reader.scrollTo(Self.end, anchor: .bottom) } }
        }
        .scrollBounceBehavior(.basedOnSize)
        // On a small phone the note scrolls under the way in, never behind it.
        .contentMargins(.bottom, wayIn ? wayInHeight : 0, for: .scrollContent)
        .contentShape(.rect)
        .onTapGesture { if !done { finish() } }
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
        .background(WelcomeNotePage.paper.ignoresSafeArea())
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
        .background(WelcomeNotePage.paper.ignoresSafeArea(edges: .bottom))
    }

    static let end = "welcome.end"
    static let appleID = "welcome.apple"
    static let googleID = "welcome.google"
    static let emailID = "welcome.email"

    private func google() {
        WelcomeHandoff.shared.arm(ticked: ticked)
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
        WelcomeHandoff.shared.arm(ticked: ticked)
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
            try await type(WelcomeNote.title, into: .head, every: 75, spaces: true)
            try await pause(260)
            try await type(WelcomeNote.lines[0], into: .line1, every: 30, spaces: true)
            try await pause(200)
            try await type(WelcomeNote.lines[1], into: .line2, every: 30, spaces: true)
            try await pause(450)
            you = nil
            ai = (.section, Self.order[0])
            try await type(WelcomeNote.section, into: .section, every: 32)
            try await pause(250)
            for i in items.indices {
                withAnimation(.spring(response: 0.42, dampingFraction: 0.62)) { shown = i + 1 }
                lit.insert(i)
                landed += 1
                ai = (.todo(i), Self.order[i + 1])
                try await type(items[i].title, into: .todo(i), every: 26)
                withAnimation(.easeOut(duration: 0.3)) { _ = subs.insert(i) }
                // The highlight settles over about 1.6 s.
                withAnimation(.easeOut(duration: 1.6)) { _ = lit.remove(i) }
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
        head = WelcomeNote.title.count
        line1 = WelcomeNote.lines[0].count
        line2 = WelcomeNote.lines[1].count
        section = WelcomeNote.section.count
        todo = items.map(\.title.count)
        shown = items.count
        subs = Set(items.indices)
        lit = []
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

    private struct Skipped: Error {}

    private func pause(_ ms: Int) async throws {
        try await Task.sleep(for: .milliseconds(Double(ms) * Self.pace))
        if done { throw Skipped() }
    }

    /// One character at a time, a little uneven, as a person types (a little longer on spaces).
    private func type(_ text: String, into field: Field, every ms: Int, spaces: Bool = false) async throws {
        if case .head = field {} else if you != nil { you = field }
        for n in 1...text.count {
            set(field, n)
            let ch = text[text.index(text.startIndex, offsetBy: n - 1)]
            let extra = spaces && ch == " " ? Double(ms) * 0.6 : 0
            try await pause(Int(Double(ms) + extra + Double.random(in: 0...(Double(ms) * (spaces ? 0.5 : 0.6)))))
        }
    }

    private func set(_ field: Field, _ n: Int) {
        switch field {
        case .head: head = n
        case .line1: line1 = n
        case .line2: line2 = n
        case .section: section = n
        case .todo(let i): todo[i] = n
        }
    }
}

/// The note itself, at any point of its writing: also what folds into the list after sign-in.
struct WelcomeNotePage: View {
    var head = WelcomeNote.title.count
    var line1 = WelcomeNote.lines[0].count
    var line2 = WelcomeNote.lines[1].count
    var section = WelcomeNote.section.count
    var todo = WelcomeNote.items(for: .iPhone).map(\.title.count)
    var shown = 3
    var subs: Set<Int> = [0, 1, 2]
    var lit: Set<Int> = []
    var you: WelcomeNoteView.Field? = nil
    var ai: (WelcomeNoteView.Field, WelcomeNoteView.Writer)? = nil
    @Binding var ticked: Set<Int>
    var date = Date.now

    private let items = WelcomeNote.items(for: .iPhone)

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(Self.dateLine(date))
                .font(.footnote)
                .foregroundStyle(Color.muted)
                .frame(maxWidth: .infinity)
                .padding(.bottom, 14)
            typed(WelcomeNote.title, head, at: .head)
                .font(.system(.largeTitle, weight: .heavy))
                .tracking(-0.6)
                .foregroundStyle(Color.ink)
                .frame(minHeight: 40, alignment: .leading)
                .padding(.bottom, 10)
                .accessibilityAddTraits(.isHeader)
            typed(WelcomeNote.lines[0], line1, at: .line1).font(.body).foregroundStyle(Color.ink).frame(minHeight: 27, alignment: .leading)
            typed(WelcomeNote.lines[1], line2, at: .line2).font(.body).foregroundStyle(Color.ink).frame(minHeight: 27, alignment: .leading)
            typed(WelcomeNote.section, section, at: .section)
                .font(.footnote.weight(.bold))
                .foregroundStyle(Color.muted)
                .frame(minHeight: 16, alignment: .leading)
                .padding(.top, 18)
                .padding(.bottom, 6)
            ForEach(items.indices, id: \.self) { i in
                if i < shown { row(i).transition(.offset(y: 14).combined(with: .opacity)) }
            }
        }
        .padding(.horizontal, 26)
        .padding(.top, 20)
        .frame(maxWidth: WelcomeFlow.readableWidth, alignment: .leading)
        .frame(maxWidth: .infinity)
    }

    /// "28 October 2026 at 09:41", as Notes dates a note.
    static func dateLine(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_GB")
        f.dateFormat = "d MMMM yyyy 'at' HH:mm"
        return f.string(from: date)
    }

    private func row(_ i: Int) -> some View {
        let on = ticked.contains(i)
        return HStack(alignment: .top, spacing: 12) {
            Button {
                if on { ticked.remove(i) } else { ticked.insert(i) }
            } label: {
                ZStack {
                    Circle().strokeBorder(on ? Color.clear : Color.muted.opacity(0.45), lineWidth: 1.6)
                    if on {
                        Circle().fill(Color(Palette.amber))
                        Image(systemName: "checkmark").font(.system(size: 12, weight: .heavy)).foregroundStyle(.white)
                            .transition(.scale(scale: 0.3).combined(with: .opacity))
                    }
                }
                .frame(width: 24, height: 24)
                .frame(width: 44, height: 44)
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, -10)
            .padding(.vertical, -10)
            .sensoryFeedback(.impact(weight: .light), trigger: on)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: on)
            .accessibilityLabel(items[i].title)
            .accessibilityValue(on ? "Done" : "Not done")
            .accessibilityAddTraits(.isButton)
            VStack(alignment: .leading, spacing: 2) {
                typed(items[i].title, todo[i], at: .todo(i))
                    .font(.body)
                    .foregroundStyle(on ? Color.muted : Color.ink)
                    .strikethrough(on, color: Color.muted)
                Text(items[i].detail)
                    .font(.footnote)
                    .foregroundStyle(Color.muted)
                    .opacity(subs.contains(i) ? 1 : 0)
            }
            .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 7)
        .padding(.horizontal, 8)
        .background(lit.contains(i) ? Self.highlight : .clear, in: .rect(cornerRadius: 10, style: .continuous))
        .padding(.horizontal, -8)
    }

    /// The welcome's paper: the note's in the light, the app's warm dark ground in the dark rather
    /// than pure black.
    static let paper = Color(light: Color.notePage, dark: Color(Palette.sheetGround))

    /// The soft accent an AI's new line lands on.
    static let highlight = Color(light: Color(Palette.amber).opacity(0.14), dark: Color(Palette.amber).opacity(0.18))

    /// `text` up to `count` characters, with your caret or an AI's at the end when it's writing there.
    /// The whole line is laid out from the start (the rest in clear ink) and the caret floats over
    /// it, so nothing moves while it's written: not the line, not the lines below it.
    private func typed(_ text: String, _ count: Int, at field: WelcomeNoteView.Field) -> some View {
        let shown = String(text.prefix(count))
        return (Text(shown) + Text(String(text.dropFirst(count))).foregroundStyle(.clear))
            .overlay(alignment: .topLeading) {
                if you == field || ai?.0 == field {
                    HStack(alignment: .firstTextBaseline, spacing: 1) {
                        // A zero-width space keeps the line's baseline before the first letter.
                        Text(shown.isEmpty ? "\u{200B}" : shown).hidden()
                        if you == field { YourCaret() }
                        if let ai, ai.0 == field { AICaret(writer: ai.1) }
                    }
                    .fixedSize()
                    .allowsHitTesting(false)
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(shown)
    }
}

/// Your caret: the accent, blinking once a second.
private struct YourCaret: View {
    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.5)) { context in
            let on = Int(context.date.timeIntervalSinceReferenceDate * 2) % 2 == 0
            Rectangle().fill(Color(Palette.amber)).frame(width: 2, height: 22).offset(y: 3).opacity(on ? 1 : 0)
        }
        .accessibilityHidden(true)
    }
}

/// An AI's caret: its colour, with its name on a small tag above, like a collaborator's.
private struct AICaret: View {
    let writer: WelcomeNoteView.Writer
    var body: some View {
        Rectangle().fill(writer.color).frame(width: 2, height: 21).offset(y: 3)
            .overlay(alignment: .topLeading) {
                Text(writer.name)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 5).padding(.vertical, 2)
                    .background(writer.color, in: UnevenRoundedRectangle(topLeadingRadius: 4, bottomLeadingRadius: 0, bottomTrailingRadius: 4, topTrailingRadius: 4))
                    .fixedSize()
                    .offset(y: -15)
            }
            .accessibilityHidden(true)
    }
}

/// Over everything after a sign-in from the welcome note (WelcomeHandoff): the finished note
/// folds into its row in the list, ticks and all, or slides away for an account from before.
struct WelcomeHandoffOverlay: View {
    @State private var handoff = WelcomeHandoff.shared
    @State private var folded = false
    @State private var faded = false
    @State private var gone = false
    @State private var ticked: Set<Int> = []

    var body: some View {
        GeometryReader { g in
            let top = g.safeAreaInsets.top
            let w = g.size.width, h = g.size.height + top + g.safeAreaInsets.bottom
            // The row, in the screen's coordinates; until it's known, the whole screen.
            let t = handoff.target ?? CGRect(x: 0, y: 0, width: w, height: h)
            WelcomeNotePage(ticked: $ticked)
                .padding(.top, top)
                .frame(width: w, height: h, alignment: .top)
                .background(WelcomeNotePage.paper)
                .clipShape(RoundedRectangle(cornerRadius: folded ? 46 : 0, style: .continuous))
                // Folding: down to the row's size and place, the note's corner on the row's.
                .scaleEffect(x: folded ? t.width / w : 1, y: folded ? t.height / h : 1, anchor: .topLeading)
                .offset(x: folded ? t.minX : 0, y: folded ? t.minY : (gone ? h : 0))
                .opacity(faded ? 0 : 1)
                .frame(width: w, height: h, alignment: .topLeading)
                .ignoresSafeArea()
        }
        .allowsHitTesting(false)
        .onAppear { ticked = handoff.ticked }
        .onChange(of: handoff.target) { _, _ in handoff.fold() }
        .onChange(of: handoff.noteID) { _, _ in handoff.fold() }
        .onChange(of: handoff.phase) { _, phase in
            switch phase {
            case .folding:
                withAnimation(.timingCurve(0.65, 0, 0.35, 1, duration: 0.5)) { folded = true }
                withAnimation(.easeIn(duration: 0.22).delay(0.32)) { faded = true }
                Task { try? await Task.sleep(for: .milliseconds(520)); handoff.done() }
            case .leaving:
                withAnimation(.timingCurve(0.4, 0, 0.2, 1, duration: 0.36)) { gone = true }
                Task { try? await Task.sleep(for: .milliseconds(380)); handoff.done() }
            default:
                break
            }
        }
        .task {
            // The first sync can be slow: past a while, the note steps aside rather than hold the screen.
            while handoff.phase == .waiting {
                try? await Task.sleep(for: .milliseconds(500))
                if handoff.waitedTooLong { handoff.leave() }
            }
        }
    }
}
#endif
