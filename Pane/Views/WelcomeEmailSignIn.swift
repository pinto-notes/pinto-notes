import SwiftUI

/// The calls email sign-in makes, so the form can be driven without a server: the app's Backend,
/// or a stand-in for tests and captures (`-mockEmailAuth`), which never sends an email.
@MainActor
struct EmailAuth {
    var status: (String) async throws -> AccountStatus
    var signIn: (_ email: String, _ password: String) async throws -> Void
    /// True when a code is on its way and the address must be confirmed first.
    var signUp: (_ email: String, _ password: String) async throws -> Bool
    var confirm: (_ email: String, _ code: String) async throws -> Void
    var resend: (String) async throws -> Void
    var reset: (String) async throws -> Void

    static func live(_ backend: Backend) -> EmailAuth {
        EmailAuth(status: { try await backend.accountStatus(email: $0) },
                  signIn: { try await backend.signIn(email: $0, password: $1) },
                  signUp: { try await backend.signUp(email: $0, password: $1) },
                  confirm: { try await backend.confirmSignUp(email: $0, code: $1) },
                  resend: { try await backend.resendSignUpCode(email: $0) },
                  reset: { try await backend.requestPasswordReset(email: $0) })
    }

    /// Offline answers for UI tests and captures. An address starting "new" is new, "apple" signs
    /// in with Apple, "offline" can't reach the server; anything else has a password. The password
    /// "wrong" doesn't match; the code 123456 works and any other is wrong.
    static let standIn = EmailAuth(
        status: { email in
            if email.hasPrefix("offline") { throw URLError(.notConnectedToInternet) }
            return email.hasPrefix("new") ? .new : email.hasPrefix("apple") ? .appleOnly : .password
        },
        signIn: { email, password in
            if email.hasPrefix("offline") { throw URLError(.notConnectedToInternet) }
            if password == "wrong" { throw StandInError("Invalid login credentials") }
        },
        signUp: { _, _ in true },
        confirm: { _, code in if code != "123456" { throw StandInError("Token has expired or is invalid") } },
        resend: { _ in },
        reset: { _ in })

    struct StandInError: LocalizedError {
        let errorDescription: String?
        init(_ message: String) { errorDescription = message }
    }
}

/// Email sign-in in place, on the welcome note: the email, then a password (or a new one), then
/// the 6-digit code a new account confirms with. The steps are EmailSignInFlow's; this holds what
/// the screen adds to them (the error under the field, the work under way) and runs the calls.
@MainActor @Observable
final class WelcomeEmailModel {
    var flow: EmailSignInFlow
    /// In plain words, under the field it's about.
    var error: String?
    var working = false
    var resending = false
    /// Under the code: a new one went out.
    var notice: String?
    /// Bumped on a wrong code: the boxes shake once.
    var shakes = 0
    /// Where the cursor should go next; the view follows it, each time it's asked (a second wrong
    /// code asks for the code again).
    var focus: Focus? = .email { didSet { focusAsks += 1 } }
    private(set) var focusAsks = 0

    enum Focus: Equatable { case email, password, code }

    @ObservationIgnored let auth: EmailAuth
    /// Just before a call that signs in: the welcome note's ticks go with it (WelcomeHandoff).
    @ObservationIgnored var arm: () -> Void = {}
    /// That call failed: the welcome stays.
    @ObservationIgnored var disarm: () -> Void = {}

    init(auth: EmailAuth, flow: EmailSignInFlow = EmailSignInFlow(), error: String? = nil) {
        self.auth = auth
        self.flow = flow
        self.error = error
        focus = Self.focus(for: flow.step)
    }

    static func focus(for step: EmailSignInFlow.Step) -> Focus? {
        switch step {
        case .email, .checking: .email
        case .signIn, .create: .password
        case .confirm: .code
        default: nil
        }
    }

    var canContinue: Bool { flow.buttonEnabled && !working }

    /// Continue, Sign in, Create account, Email me a link: the full-width button, or Return.
    func primary() async {
        guard canContinue else { return }
        error = nil
        switch flow.action {
        case .check:
            guard flow.beginCheck() else { return }
            let email = flow.email
            let status = try? await auth.status(email)
            guard flow.step == .checking, flow.email == email else { return }
            flow.finishCheck(status)
            focus = Self.focus(for: flow.step)
        case .signIn, .create:
            let creating = flow.action == .create
            let (email, password) = (flow.email, flow.password)
            working = true
            defer { working = false }
            arm()
            do {
                if creating {
                    if try await auth.signUp(email, password) {
                        disarm()
                        flow.needsConfirmation(sentAt: .now)
                        focus = .code
                    }
                } else {
                    try await auth.signIn(email, password)
                }
            } catch where Backend.isEmailNotConfirmed(error) {
                // Made earlier and never confirmed: the code step, with a new code.
                disarm()
                flow.needsConfirmation(sentAt: nil)
                focus = .code
                working = false
                await resend()
            } catch {
                disarm()
                self.error = Backend.message(for: error, signingUp: creating)
            }
        case .verify:
            await verify()
        case .sendReset:
            guard flow.beginReset() else { return }
            do {
                try await auth.reset(flow.email)
                flow.finishReset(sent: true)
            } catch {
                flow.finishReset(sent: false)
                self.error = Self.offline
            }
        case .backToSignIn:
            flow.backToSignIn()
            focus = .password
        case nil:
            break
        }
    }

    /// Six digits, typed, pasted or filled in from Mail: checked straight away.
    func codeChanged() async {
        guard flow.step == .confirm, flow.code.count == EmailSignInFlow.codeLength, !working else { return }
        await verify()
    }

    private func verify() async {
        let (email, code) = (flow.email, flow.code)
        working = true
        notice = nil
        error = nil
        arm()
        do {
            try await auth.confirm(email, code)
        } catch {
            disarm()
            self.error = Backend.confirmMessage(for: error)
            shakes += 1
            flow.code = ""
            focus = .code
        }
        working = false
    }

    func resend() async {
        guard flow.step == .confirm, !resending, flow.resendWait(now: .now) == 0 else { return }
        resending = true
        error = nil
        notice = nil
        do {
            try await auth.resend(flow.email)
            flow.codeResent(at: .now)
            notice = "New code sent. Only the newest one works."
            focus = .code
        } catch {
            self.error = Backend.confirmMessage(for: error)
        }
        resending = false
    }

    /// Change email: back to the field, the address kept to correct.
    func changeEmail() {
        flow.back()
        error = nil
        notice = nil
        focus = .email
    }

    func forgotPassword() {
        flow.forgotPassword()
        error = nil
    }

    func backToSignIn() {
        flow.backToSignIn()
        error = nil
        focus = .password
    }

    func chooseCreate() {
        flow.chooseCreate()
        error = nil
        focus = .password
    }

    static let offline = "Can't reach the server. Check your connection."

    /// The words over the form at each step.
    var title: String {
        switch flow.step {
        case .email, .checking: "Continue with email"
        // The server couldn't say whether the email has an account.
        case .signIn(fallback: true): "Sign in"
        case .signIn, .apple, .forgot, .forgotSent: "Welcome back"
        case .create: "Create your account"
        case .confirm: "Check your email"
        }
    }
}

#if os(iOS)
/// The welcome's way in after Use email: the same block, now one form. No new screen, no picture:
/// the note stays above it. One field and one black (white in the dark) button per step, the
/// address once it's chosen with Change beside it, the error in plain words under the field it's
/// about, and Use Apple or Google to go back.
struct WelcomeEmailForm: View {
    @State var model: WelcomeEmailModel
    let back: () -> Void
    @FocusState private var focus: SignInView.Field?
    @State private var passwordFocused = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static let titleID = "signin.title"

    var body: some View {
        VStack(spacing: 12) {
            Text(model.title)
                .font(.headline)
                .foregroundStyle(Color.ink)
                .multilineTextAlignment(.center)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier(Self.titleID)
                .contentTransition(.opacity)
                .padding(.bottom, 2)
            if !model.flow.showsEmailField { address }
            step
        }
        .textFieldStyle(.plain)
        .animation(reduceMotion ? nil : .snappy(duration: 0.25), value: model.flow.step)
        .animation(.snappy(duration: 0.2), value: model.error)
        .animation(.snappy(duration: 0.2), value: model.notice)
        .onChange(of: model.focusAsks, initial: true) { apply(model.focus) }
        .onChange(of: model.flow.code) { Task { await model.codeChanged() } }
    }

    /// Focusing in the same update a field appears in is lost: once it's on screen.
    private func apply(_ target: WelcomeEmailModel.Focus?) {
        Task {
            try? await Task.sleep(for: .milliseconds(60))
            switch target {
            case .email: focus = .email
            case .code: focus = .code
            case .password: passwordFocused = true
            case nil: break
            }
        }
    }

    /// The address chosen, with Change beside it: plain text, not a field.
    private var address: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 6) { addressText; changeButton }
            VStack(spacing: 2) { addressText; changeButton }
        }
        .font(.subheadline)
        .transition(.opacity)
    }

    private var addressText: some View {
        Text(model.flow.email)
            .foregroundStyle(Color.muted)
            .lineLimit(1)
            .truncationMode(.middle)
            .accessibilityIdentifier("signin.lockedEmail")
    }

    private var changeButton: some View {
        Button("Change") { model.changeEmail() }
            .fontWeight(.semibold)
            .foregroundStyle(Color.amberInk)
            .buttonStyle(.plain)
            .frame(minHeight: 44)
            .contentShape(.rect)
            .accessibilityLabel("Change email")
            .accessibilityIdentifier("signin.back")
    }

    @ViewBuilder private var step: some View {
        switch model.flow.step {
        case .email, .checking:
            field(focused: focus == .email) {
                TextField("Email", text: Binding(get: { model.flow.email }, set: { if !model.flow.emailLocked { model.flow.email = $0 } }),
                          prompt: Text("Email address").foregroundStyle(Color(Palette.placeholder)))
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($focus, equals: .email)
                    .submitLabel(.continue)
                    .onSubmit(primary)
                    .accessibilityIdentifier("signin.email")
            }
            errorLine
            mainButton("Continue")
            link("Use Apple or Google", id: "signin.otherWays", action: back)
        case .signIn, .create:
            let creating = model.flow.step == .create
            field(focused: passwordFocused) {
                let prompt = creating ? "Create a password" : "Password"
                PasswordField(prompt, text: $model.flow.password, prompt: Text(prompt).foregroundStyle(Color(Palette.placeholder)),
                              kind: creating ? .new : .current, id: "signin.password", focused: $passwordFocused)
                    .submitLabel(.go)
                    .onSubmit(primary)
            }
            if creating { passwordRule }
            errorLine
            mainButton(creating ? "Create account" : "Sign in")
            if model.flow.offersReset {
                link("Forgot password?", id: "signin.forgot") { model.forgotPassword() }
            }
            if model.flow.step == .signIn(fallback: true) {
                link("New here? Create an account", id: "signin.create") { model.chooseCreate() }
            }
        case .apple:
            line(SignInView.noPasswordNote, id: "signin.appleOnly")
            Button("Use Apple or Google", action: back)
                .buttonStyle(.inkProminent(.form, wide: true))
                .accessibilityIdentifier("signin.submit")
        case .forgot:
            line("We'll email you a link to choose a new password.", id: "signin.forgotNote")
            errorLine
            mainButton("Email me a link")
            link("Back to sign in", id: "signin.backToSignIn") { model.backToSignIn() }
        case .forgotSent:
            line("If an account uses this email, we've sent it a link. Open it on any device to choose a new password. The link works for one hour.",
                 id: "signin.resetSent")
            mainButton("Back to sign in")
        case .confirm:
            line("Enter the 6-digit code we sent to this address.", id: "signin.codeLine")
            CodeBoxes(code: $model.flow.code, focus: $focus, disabled: model.working, shakes: model.shakes, ring: Color.ink)
            if model.working {
                HStack(spacing: 8) {
                    ProgressView().controlSize(.small)
                    Text("Checking the code…")
                }
                .font(.footnote)
                .foregroundStyle(Color.muted)
                .accessibilityElement(children: .combine)
                .accessibilityIdentifier("signin.checking")
            }
            errorLine
            if let notice = model.notice {
                line(notice, id: "signin.codeSent")
            }
            resendRow
        }
    }

    /// The error under the field, red, in words a person can act on. Read out when it comes.
    @ViewBuilder private var errorLine: some View {
        if let error = model.error {
            Label(error, systemImage: "exclamationmark.circle.fill")
                .font(.footnote)
                .foregroundStyle(.red)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)
                .transition(.opacity)
                .accessibilityIdentifier("signin.error")
                .onAppear { AccessibilityNotification.Announcement(error).post() }
        }
    }

    private var passwordRule: some View {
        let met = model.flow.password.count >= EmailSignInFlow.minimumPassword
        return Label(SignInView.passwordRuleText, systemImage: met ? "checkmark.circle.fill" : "circle")
            .font(.footnote)
            .foregroundStyle(met ? Color.ink : Color.muted)
            .contentTransition(.symbolEffect(.replace))
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityLabel(SignInView.passwordRuleText)
            .accessibilityValue(met ? "Met" : "Not met yet")
            .accessibilityIdentifier("signin.passwordRule")
    }

    /// Resend code, counting down the minute between codes, and Change email beside it.
    private var resendRow: some View {
        TimelineView(.periodic(from: .now, by: 1)) { context in
            let wait = model.flow.resendWait(now: context.date)
            Button {
                Task { await model.resend() }
            } label: {
                Text(model.resending ? "Sending a new code…" : wait > 0 ? "Resend code in \(wait) s" : "Resend code")
                    .monospacedDigit()
                    .frame(minHeight: 44)
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(wait > 0 || model.resending ? Color.muted : Color.amberInk)
            .disabled(wait > 0 || model.resending || model.working)
            .accessibilityIdentifier("signin.resend")
        }
    }

    private func primary() { Task { await model.primary() } }

    private func mainButton(_ title: String) -> some View {
        let busy = model.working || model.flow.step == .checking || model.flow.step == .forgot(sending: true)
        return Button(title, action: primary)
            .buttonStyle(.inkProminent(.form, wide: true))
            .amberBusy(busy)
            .disabled(!model.canContinue)
            .animation(.easeOut(duration: 0.15), value: model.canContinue)
            .accessibilityIdentifier("signin.submit")
    }

    private func link(_ title: String, id: String, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(Color.amberInk)
            .buttonStyle(.plain)
            .frame(minHeight: 44)
            .contentShape(.rect)
            .accessibilityIdentifier(id)
    }

    private func line(_ text: String, id: String) -> some View {
        Text(text)
            .font(.subheadline)
            .foregroundStyle(Color.muted)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .transition(.opacity)
            .accessibilityIdentifier(id)
    }

    /// One input, the buttons' height and corners: no coloured ring, a firmer edge while typing.
    private func field(focused: Bool, @ViewBuilder _ content: () -> some View) -> some View {
        let shape = RoundedRectangle(cornerRadius: SignInView.Row.radius, style: .continuous)
        return content()
            .font(.body)
            .padding(.horizontal, 14)
            .frame(minHeight: SignInView.Row.height)
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(focused ? Color.ink.opacity(0.6) : Color(Palette.fieldHairline), lineWidth: focused ? 1.5 : 1))
            .animation(.easeOut(duration: 0.12), value: focused)
    }
}
#endif
