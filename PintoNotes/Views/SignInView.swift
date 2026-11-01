import SwiftUI

/// Sign in: Sign in with Apple, Sign in with Google, or email first. Type your email, Continue, and the screen asks
/// for your password or for a new one, depending on whether the email has an account.
/// Signed out, it sits beside the welcome's picture (WelcomeFlow); on its own (captures and
/// snapshots) it's the old card: the whole window on the Mac, a glass card on iPhone.
struct SignInView: View {
    let backend: Backend
    let heading: Heading
    /// Captures: start with the cursor in the email field, to show its focused state.
    var focusEmail = false
    @State private var flow: EmailSignInFlow
    @State private var working = false
    /// Which way in is working: its own button spins, never another one.
    @State private var pressed: Way?
    @State private var error: String?
    /// The cursor is in the password field (PasswordField keeps its own two fields in step).
    @State private var passwordFocused = false
    /// Resend code: a new code is on its way.
    @State private var resending = false
    /// Under the code: a new code went out (Resend code's "done").
    @State private var codeNotice: String?
    /// A wrong or expired code: the boxes shake once per try.
    @State private var codeShakes = 0
    @FocusState private var focus: Field?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    enum Field { case email, code }

    enum Way { case apple, google }

    /// The words above the form: the card's own (icon, title and promise, centred), or a title
    /// and a line from the welcome flow, which sets the form beside its picture, or just the icon
    /// and one short title, centred, for the first run's card over the notes window (SetupCards).
    enum Heading: Equatable {
        case card
        case beside(title: String, line: String)
        case short(String)
    }

    /// `error`: captures only, the screen as it looks after a failed try.
    /// `pressed`: captures only, a way in that is under way.
    init(backend: Backend, flow: EmailSignInFlow = EmailSignInFlow(), heading: Heading = .card, focusEmail: Bool = false, error: String? = nil, pressed: Way? = nil) {
        self.backend = backend
        self.heading = heading
        self.focusEmail = focusEmail
        _flow = State(initialValue: flow)
        _error = State(initialValue: error)
        _pressed = State(initialValue: pressed)
        _working = State(initialValue: pressed != nil)
    }

    /// Email sign-in sits under Sign in with Apple.
    static let emailFallback = true

    /// Sign in with Google sits directly under Sign in with Apple.
    static let offersGoogle = true

    /// One size and shape for every row (Apple button, fields, the main button), so the card reads
    /// as one form: the design system's form size (40 pt on the Mac, 50 on iPhone, `md` corners).
    enum Row {
        static let height = ButtonSize.form.height
        static let radius = ButtonSize.form.radius
        #if os(macOS)
        static let text: CGFloat = 14
        #else
        static let text: CGFloat = 17
        #endif
    }

    var body: some View {
        Group {
            if heading != .card {
                // The welcome flow, or the setup card, places it.
                card
            } else {
                cardScreen
            }
        }
        // The sign-in funnel starts here: the form is on screen, no way chosen yet.
        .onAppear { Funnel.record(.signInStep(nil, .shown)) }
    }

    private var cardScreen: some View {
        #if os(macOS)
        card
            .padding(.horizontal, 36)
            .padding(.vertical, 56)
            .frame(width: 380)
        #else
        // Top-anchored in a scroll view: the card keeps one place for the whole flow. The keyboard
        // only scrolls it when it would cover the field you're typing in.
        ScrollView {
            card
                .padding(28)
                .frame(minWidth: 300, maxWidth: 380)
                .glassEffect(.regular, in: .rect(cornerRadius: 28))
                .padding(20)
                .padding(.top, 20)
                .frame(maxWidth: .infinity)
        }
        .scrollBounceBehavior(.basedOnSize)
        .scrollDismissesKeyboard(.interactively)
        .background { Backdrop() }
        #endif
    }

    private var shortHeading: Bool {
        if case .short = shownHeading { return true }
        return false
    }

    private var card: some View {
        VStack(spacing: shortHeading ? 20 : 24) {
            switch shownHeading {
            case .card:
                VStack(spacing: 14) {
                    AppMark(size: 72)
                    // The website's display type: heavy and tight.
                    Text("Sign in to Pinto Notes")
                        .font(.title2.weight(.heavy))
                        .tracking(-0.6)
                        .foregroundStyle(Color.ink)
                        .multilineTextAlignment(.center)
                    promise
                }
            case .beside(let title, let line):
                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.title2.weight(.heavy))
                        .tracking(-0.6)
                        .foregroundStyle(Color.ink)
                        .accessibilityAddTraits(.isHeader)
                        .accessibilityIdentifier("signin.title")
                    if !line.isEmpty {
                        Text(line)
                            .font(.subheadline)
                            .foregroundStyle(Color.muted)
                    }
                }
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            case .short(let title):
                VStack(spacing: 12) {
                    AppMark(size: 44)
                    Text(title)
                        .font(.system(size: 19, weight: .bold))
                        .tracking(-0.2)
                        .foregroundStyle(Color.ink)
                        .multilineTextAlignment(.center)
                        .accessibilityAddTraits(.isHeader)
                        .accessibilityIdentifier("signin.title")
                }
            }

            VStack(spacing: 12) {
                // Asking for a password, the Apple and Google rows fold away as the password row comes in,
                // so the main button keeps its place and the whole form fits above the keyboard.
                if flow.showsApple {
                    VStack(spacing: 12) {
                        AppleAuthButton(label: .signIn, height: Row.height, cornerRadius: Row.radius, title: "Sign in with Apple", web: webSignIn,
                                        busy: working && pressed == .apple) { result in
                            switch result {
                            case .success(let credential): signIn(credential)
                            case .failure(let failure):
                                error = AppleSignIn.message(for: failure)
                                // Apple's own sheet closed or failed before a credential came back.
                                if case .canceled = failure { Funnel.record(.signInStep(.apple, .cancelled)) }
                                else { Funnel.record(.signInStep(.apple, .failed, kind: .other)) }
                            }
                        }
                        .disabled(working)
                        .opacity(working && pressed != .apple ? 0.6 : 1)
                        .accessibilityIdentifier("signin.apple")

                        // Directly under Apple, which stays first (App Review guideline 4.8).
                        if Self.offersGoogle {
                            GoogleAuthButton(busy: working && pressed == .google, action: signInWithGoogle)
                                .disabled(working)
                                .accessibilityIdentifier("signin.google")
                        }

                        if Self.emailFallback { orDivider }
                    }
                    .transition(.opacity)
                }

                if Self.emailFallback {
                    emailSection
                }

                // Always there, a line high when empty, so an error coming or going moves nothing. On
                // a setup card (the short heading) the card grows for an error instead: no blank
                // line above the small print.
                if error != nil || !shortHeading {
                    Text(error ?? " ")
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .opacity(error == nil ? 0 : 1)
                        .accessibilityHidden(error == nil)
                        .accessibilityIdentifier(error == nil ? "" : "signin.error")
                }
            }

            ConsentFooter()
        }
        .animation(.snappy(duration: 0.2), value: error)
        .animation(.snappy(duration: 0.2), value: codeNotice)
        .animation(reduceMotion ? nil : .smooth(duration: 0.3), value: flow.step)
        // Once the password field is there (focusing it in the same update as it appears is
        // lost, and a paste then lands on the email row).
        .onChange(of: flow.showsPassword) { _, shows in if shows { passwordFocused = true } }
        .onChange(of: flow.step) { _, step in if step == .confirm { focus = .code } }
        // Six digits, typed or filled in from the email by iOS: confirm straight away.
        .onChange(of: flow.code) { _, code in if code.count == EmailSignInFlow.codeLength, flow.step == .confirm { primary() } }
        .task {
            if focusEmail { focus = .email }
            if flow.step == .confirm { focus = .code }
        }
    }

    /// Beside the welcome's picture the heading follows what the email turned out to be: Welcome
    /// back with the address for an account, Create your account for a new email. "Check your
    /// email" replaces it while the code is asked for, in both layouts.
    private var shownHeading: Heading {
        if flow.step == .confirm { return .beside(title: Self.confirmTitle, line: Self.confirmLine) }
        guard case .beside = heading else { return heading }
        switch flow.step {
        // The address is in the row under it already, so the line never repeats it.
        case .signIn(fallback: false): return .beside(title: Self.existingTitle, line: Self.existingLine)
        case .apple, .forgot, .forgotSent: return .beside(title: Self.existingTitle, line: "")
        case .create: return .beside(title: Self.newTitle, line: Self.newLine)
        default: return heading
        }
    }

    static let passwordRuleText = "At least \(EmailSignInFlow.minimumPassword) characters"

    /// Under a new password, all the time: the rule, ticked once the password meets it, so a grey
    /// Create account always says why.
    private var passwordRule: some View {
        let met = flow.password.count >= EmailSignInFlow.minimumPassword
        return Label(Self.passwordRuleText, systemImage: met ? "checkmark.circle.fill" : "circle")
            .font(.footnote)
            .foregroundStyle(met ? AnyShapeStyle(.tint) : AnyShapeStyle(Color.muted))
            .contentTransition(.symbolEffect(.replace))
            .frame(maxWidth: .infinity, alignment: .leading)
            .animation(.snappy(duration: 0.15), value: met)
            .accessibilityLabel(Self.passwordRuleText)
            .accessibilityValue(met ? "Met" : "Not met yet")
            .accessibilityIdentifier("signin.passwordRule")
    }

    static let startTitle = "Sign in or sign up"
    static let startLine = "Enter your email to continue."
    static let existingTitle = "Welcome back"
    static let existingLine = "Enter your password to sign in."
    static let newTitle = "Create your account"
    static let newLine = "Choose a password for this email."

    static let confirmTitle = "Check your email"
    static let confirmLine = "We sent a 6-digit code to this address. Type it here to confirm it's yours."

    /// The website's one-line promise, with its low amber marker under "your AI".
    private var promise: some View {
        VStack(spacing: 3) {
            Text("The notes app \(Text("your AI").foregroundStyle(Color.ink).customAttribute(Marker())) can use.")
                .textRenderer(Marker.Renderer(color: Color(Palette.underline)))
            // Where the notes live, said once and plainly.
            Text("Your notes sync between iPhone and Mac.")
                .font(.footnote)
                .foregroundStyle(Color.muted.opacity(0.85))
                .accessibilityIdentifier("signin.sync")
        }
        .font(.subheadline)
        .foregroundStyle(Color.muted)
        .multilineTextAlignment(.center)
        .padding(.top, -6)
    }

    private var emailSection: some View {
        VStack(spacing: 10) {
            // One row for the email: a field, then (once it's checked) the address as text. Both
            // stay in place and swap at once (no cross-fade of two texts), so the row itself can
            // ease up when Sign in with Apple folds away, and the keyboard goes straight on to
            // the password field.
            field(focused: focus == .email && flow.showsEmailField) {
                ZStack(alignment: .leading) {
                    // Edits while it's being checked are ignored, so the answer matches the email.
                    TextField("Email", text: Binding(get: { flow.email }, set: { if !flow.emailLocked { flow.email = $0 } }),
                              prompt: Text("Email").foregroundStyle(Color(Palette.placeholder)))
                        .textContentType(.username)
                        #if os(iOS)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        #endif
                        .autocorrectionDisabled()
                        .focused($focus, equals: .email)
                        .submitLabel(.continue)
                        .onSubmit(primary)
                        .animation(nil) { $0.opacity(flow.showsEmailField ? 1 : 0) }
                        .allowsHitTesting(flow.showsEmailField)
                        .accessibilityHidden(!flow.showsEmailField)
                        .accessibilityIdentifier("signin.email")
                    Text(flow.email)
                        .lineLimit(1)
                        .truncationMode(.middle)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .animation(nil) { $0.opacity(flow.showsEmailField ? 0 : 1) }
                        .accessibilityHidden(flow.showsEmailField)
                        .accessibilityIdentifier("signin.lockedEmail")
                }
            }
            if !flow.showsEmailField {
                // On its own line, so a long address keeps the whole row.
                Button {
                    flow.back()
                    error = nil
                    codeNotice = nil
                    focus = .email
                } label: {
                    // The whole row takes the tap, not just the words.
                    Text("Use a different email")
                        .frame(maxWidth: .infinity, minHeight: 24, alignment: .leading)
                        .contentShape(.rect)
                }
                .buttonStyle(.hoverLink)
                .font(.footnote)
                .foregroundStyle(.tint)
                .accessibilityIdentifier("signin.back")
                .transition(.opacity)
            }

            if flow.showsPassword {
                field(focused: passwordFocused) {
                    let prompt = flow.step == .create ? "Create a password" : "Password"
                    PasswordField(prompt, text: $flow.password, prompt: Text(prompt).foregroundStyle(Color(Palette.placeholder)),
                                  kind: flow.step == .create ? .new : .current, id: "signin.password", focused: $passwordFocused)
                        .submitLabel(.go)
                        .onSubmit(primary)
                }
                .transition(.opacity)
                if flow.step == .create { passwordRule.transition(.opacity) }
            }

            if flow.step == .confirm {
                codeField
                    .transition(.opacity)
            }

            if case .forgot = flow.step {
                note("We'll email you a link to choose a new password.", id: "signin.forgotNote")
            }

            if flow.step == .forgotSent {
                note("If an account uses this email, we've sent it a link. Open it on any device to choose a new password. The link works for one hour.", id: "signin.resetSent")
            }

            if flow.step == .apple {
                Text(Self.noPasswordNote)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .transition(.opacity)
                    .accessibilityIdentifier("signin.appleOnly")
            }

            if let title = flow.buttonTitle {
                mainButton(title)
            }

            if flow.step == .confirm {
                resendRow
                    .transition(.opacity)
            }

            if flow.offersReset {
                smallButton("Forgot password?", id: "signin.forgot") {
                    flow.forgotPassword()
                    error = nil
                }
            }

            if flow.step == .forgot(sending: false) {
                smallButton("Back to sign in", id: "signin.backToSignIn") {
                    flow.backToSignIn()
                    error = nil
                    passwordFocused = true
                }
            }

            if flow.step == .signIn(fallback: true) {
                smallButton("New? Create an account", id: "signin.create") {
                    flow.chooseCreate()
                    error = nil
                    passwordFocused = true
                }
            }
        }
        .textFieldStyle(.plain)
    }

    /// The 6-digit code as six boxes (CodeBoxes). One-time-code content, so iOS offers the code
    /// from Mail above the keyboard.
    private var codeField: some View {
        VStack(spacing: 8) {
            CodeBoxes(code: $flow.code, focus: $focus, disabled: working, shakes: codeShakes, onSubmit: primary)
            if let codeNotice {
                note(codeNotice, id: "signin.codeSent")
            }
        }
    }

    /// Resend code, waiting out the minute between codes; then "Use a different email" above
    /// is the other way out.
    private var resendRow: some View {
        TimelineView(.periodic(from: .now, by: 1)) { context in
            let wait = flow.resendWait(now: context.date)
            Button(action: resendCode) {
                HStack(spacing: 6) {
                    if resending { ProgressView().controlSize(.small) }
                    Text(resending ? "Sending a new code…" : wait > 0 ? "Resend code in \(wait) s" : "Resend code")
                        .monospacedDigit()
                }
                .frame(minHeight: 28)
                .contentShape(.rect)
            }
            .buttonStyle(.hoverLink)
            .font(.footnote)
            .foregroundStyle(wait > 0 || resending ? AnyShapeStyle(.secondary) : AnyShapeStyle(.tint))
            .disabled(wait > 0 || resending || working)
            .accessibilityIdentifier("signin.resend")
        }
    }

    private func resendCode() {
        guard flow.step == .confirm, !resending, flow.resendWait(now: .now) == 0 else { return }
        resending = true
        error = nil
        codeNotice = nil
        let email = flow.email
        Task {
            do {
                try await backend.resendSignUpCode(email: email)
                flow.codeResent(at: .now)
                codeNotice = "New code sent. Only the newest one works."
                focus = .code
            } catch {
                self.error = Backend.confirmMessage(for: error)
            }
            resending = false
        }
    }

    /// A line of explanation under the email, in the card's quiet voice.
    private func note(_ text: String, id: String) -> some View {
        Text(text)
            .font(.footnote)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .fixedSize(horizontal: false, vertical: true)
            .transition(.opacity)
            .accessibilityIdentifier(id)
    }

    /// A text button under the main one, still big enough to hit.
    private func smallButton(_ title: String, id: String, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .buttonStyle(.hoverLink)
            .font(.footnote)
            .foregroundStyle(.tint)
            .frame(minHeight: 28)
            .contentShape(.rect)
            .transition(.opacity)
            .accessibilityIdentifier(id)
    }

    private func mainButton(_ title: String) -> some View {
        // Only for its own work: Apple and Google spin on their own buttons.
        let busy = (working && pressed == nil) || flow.step == .checking || flow.step == .forgot(sending: true)
        let enabled = flow.buttonEnabled && !working
        return Button(title, action: primary)
        .buttonStyle(.amberProminent(.form, wide: true))
        .amberBusy(busy)
        .disabled(!enabled)
        .animation(.easeOut(duration: 0.15), value: enabled)
        .keyboardShortcut(.defaultAction)
        .accessibilityIdentifier("signin.submit")
        .padding(.top, 2)
    }

    /// One input, the same height and corners as the buttons: a white field with a warm border,
    /// and an amber ring while you type in it.
    private func field(focused: Bool = false, @ViewBuilder _ content: () -> some View) -> some View {
        let shape = RoundedRectangle(cornerRadius: Row.radius, style: .continuous)
        return content()
            .font(.system(size: Row.text))
            .padding(.horizontal, 12)
            .frame(height: Row.height)
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(focused ? Color(Palette.amber) : Color(Palette.fieldHairline), lineWidth: focused ? 2 : 1))
            .animation(.easeOut(duration: 0.12), value: focused)
    }

    /// "or" between the two ways in.
    private var orDivider: some View {
        HStack(spacing: 10) {
            Rectangle().fill(.separator).frame(height: 1)
            Text("or").font(.footnote).foregroundStyle(.secondary)
            Rectangle().fill(.separator).frame(height: 1)
        }
        .padding(.vertical, 2)
        .accessibilityHidden(true)
    }

    /// The Mac download signs in with Apple on the web; everywhere else the native sheet does it.
    private var webSignIn: (@MainActor () -> Void)? {
        #if DIRECT
        return {
            working = true
            pressed = .apple
            error = nil
            Task {
                do { try await backend.signInWithAppleOnTheWeb() } catch where !Backend.isCanceled(error) {
                    self.error = Backend.appleMessage(for: error, linking: false)
                } catch {}
                working = false
                pressed = nil
            }
        }
        #else
        return nil
        #endif
    }

    /// An account with no password signs in with Apple or Google; which one isn't said, so the
    /// screen tells nobody more about an email than that it has an account.
    static let noPasswordNote = "This email signs in with Apple or Google. Use one of the buttons above."

    private func signInWithGoogle() {
        working = true
        pressed = .google
        error = nil
        Task {
            do { try await backend.signInWithGoogle() } catch where !Backend.isCanceled(error) {
                self.error = Backend.googleMessage(for: error)
            } catch {}
            working = false
            pressed = nil
        }
    }

    private func signIn(_ credential: AppleSignIn.Credential) {
        working = true
        pressed = .apple
        error = nil
        Task {
            do { try await backend.signInWithApple(credential) } catch { self.error = Backend.appleMessage(for: error, linking: false) }
            working = false
            pressed = nil
        }
    }

    /// The full-width button, or Return in either field.
    private func primary() {
        guard flow.buttonEnabled, !working else { return }
        error = nil
        switch flow.action {
        case .check:
            guard flow.beginCheck() else { return }
            let email = flow.email
            Task {
                let status = try? await backend.accountStatus(email: email)
                guard flow.step == .checking, flow.email == email else { return }
                flow.finishCheck(status)
            }
        case .signIn, .create:
            let creating = flow.action == .create
            let (email, password) = (flow.email, flow.password)
            working = true
            Task {
                do {
                    if creating {
                        // Confirmation on: no session yet, a code is on its way.
                        if try await backend.signUp(email: email, password: password) {
                            flow.needsConfirmation(sentAt: .now)
                        }
                    } else {
                        try await backend.signIn(email: email, password: password)
                    }
                } catch where Backend.isEmailNotConfirmed(error) {
                    // An account made earlier and never confirmed: the code screen, with a new code.
                    flow.needsConfirmation(sentAt: nil)
                    working = false
                    resendCode()
                    return
                } catch {
                    self.error = Backend.message(for: error, signingUp: creating)
                }
                working = false
            }
        case .verify:
            let (email, code) = (flow.email, flow.code)
            working = true
            codeNotice = nil
            Task {
                do {
                    // The session that comes back signs in; the app moves on from there.
                    try await backend.confirmSignUp(email: email, code: code)
                } catch {
                    self.error = Backend.confirmMessage(for: error)
                    codeShakes += 1
                    flow.code = ""
                    focus = .code
                }
                working = false
            }
        case .sendReset:
            guard flow.beginReset() else { return }
            let email = flow.email
            Task {
                do {
                    try await backend.requestPasswordReset(email: email)
                    flow.finishReset(sent: true)
                } catch {
                    flow.finishReset(sent: false)
                    self.error = "Can't reach the server. Check your connection."
                }
            }
        case .backToSignIn:
            flow.backToSignIn()
            passwordFocused = true
        case nil:
            break
        }
    }
}

/// The website's low marker: a band behind the lower part of the words, from the middle of the
/// lowercase letters to just under the baseline, so it reads as a highlighter stroke, not a box.
struct Marker: TextAttribute {
    struct Renderer: TextRenderer {
        let color: Color

        func draw(layout: Text.Layout, in context: inout GraphicsContext) {
            for line in layout {
                for run in line {
                    if run[Marker.self] != nil {
                        let r = run.typographicBounds.rect
                        let band = CGRect(x: r.minX - 1, y: r.minY + r.height * 0.52, width: r.width + 2, height: r.height * 0.32)
                        context.fill(Path(band), with: .color(color))
                    }
                    context.draw(run)
                }
            }
        }
    }
}

/// A plain, warm ground in either appearance: no glows, no fades.
struct Backdrop: View {
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Self.color(scheme).ignoresSafeArea()
    }

    static func color(_ scheme: ColorScheme) -> Color {
        Color(Palette.sheetGround)
    }
}
