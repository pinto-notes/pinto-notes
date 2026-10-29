import Foundation
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// Email sign-in on the iPhone welcome (WelcomeEmailModel, WelcomeEmailForm), driven by the
/// offline stand-in: nothing reaches a server and no email is sent.
@MainActor @Suite struct WelcomeEmailTests {
    /// The stand-in, counting the calls that sign in and the ones that gave up.
    final class Calls {
        var armed = 0, disarmed = 0
    }

    func model(_ flow: EmailSignInFlow = EmailSignInFlow()) -> (WelcomeEmailModel, Calls) {
        let m = WelcomeEmailModel(auth: .standIn, flow: flow)
        let calls = Calls()
        m.arm = { calls.armed += 1 }
        m.disarm = { calls.disarmed += 1 }
        return (m, calls)
    }

    @Test func useEmailStartsInTheField() {
        let (m, _) = model()
        #expect(m.focus == .email)
        #expect(m.title == "Continue with email")
    }

    @Test func continueWaitsForAnAddressThatLooksReal() async {
        let (m, _) = model()
        for typed in ["", "sara", "sara@", "sara@example", "sara @example.com"] {
            m.flow.email = typed
            #expect(!m.canContinue, "\(typed)")
            await m.primary()
            #expect(m.flow.step == .email, "Return does nothing for \(typed)")
        }
        m.flow.email = " sara@example.com "
        #expect(m.canContinue)
    }

    @Test func anExistingAccountAsksForItsPassword() async {
        let (m, calls) = model()
        m.flow.email = "sara@example.com"
        await m.primary()
        #expect(m.flow.step == .signIn(fallback: false))
        #expect(m.focus == .password)
        #expect(m.title == "Welcome back")
        m.flow.password = "wrong"
        await m.primary()
        #expect(m.error == "That email and password didn't match.")
        #expect(calls.armed == 1 && calls.disarmed == 1, "a failed sign-in leaves the welcome as it was")
        m.flow.password = "right one"
        await m.primary()
        #expect(m.error == nil)
        #expect(calls.armed == 2 && calls.disarmed == 1, "signing in takes the welcome note's ticks along")
    }

    @Test func aNewAccountGoesOnToTheCode() async {
        let (m, calls) = model()
        m.flow.email = "new@example.com"
        await m.primary()
        #expect(m.flow.step == .create)
        #expect(m.title == "Create your account")
        m.flow.password = String(repeating: "p", count: 12)
        await m.primary()
        #expect(m.flow.step == .confirm)
        #expect(m.title == "Check your email")
        #expect(m.focus == .code)
        #expect(m.flow.resendWait(now: .now) > 50, "Resend code counts down the minute")
        #expect(calls.disarmed == 1, "no session until the code is in")
    }

    @Test func aWrongCodeSaysSoUnderTheBoxes() async {
        let (m, calls) = model(EmailSignInFlow(step: .confirm, email: "new@example.com", codeSentAt: .now))
        m.flow.code = "11111"
        await m.codeChanged()
        #expect(m.error == nil, "five digits wait for the sixth")
        m.flow.code = "111111"
        await m.codeChanged()
        #expect(m.error == "That code is wrong or has expired. Check the newest email from Pinto Notes, or press Resend code.")
        #expect(m.flow.code.isEmpty && m.shakes == 1)
        #expect(m.focus == .code)
        #expect(calls.disarmed == 1)
        // A paste of the right one: checked at once, the error gone.
        m.flow.code = "123 456"
        await m.codeChanged()
        #expect(m.error == nil)
        #expect(calls.armed == 2 && calls.disarmed == 1)
    }

    @Test func aSecondWrongCodeAsksForTheCodeAgain() async {
        let (m, _) = model(EmailSignInFlow(step: .confirm, email: "new@example.com"))
        let before = m.focusAsks
        m.flow.code = "111111"
        await m.codeChanged()
        m.flow.code = "222222"
        await m.codeChanged()
        #expect(m.focusAsks == before + 2, "the cursor goes back to the boxes each time")
    }

    @Test func changeEmailGoesBackToTheField() async {
        let (m, _) = model(EmailSignInFlow(step: .confirm, email: "new@example.com", code: "123"))
        m.error = "x"
        m.changeEmail()
        #expect(m.flow.step == .email)
        #expect(m.flow.email == "new@example.com", "kept, to correct")
        #expect(m.flow.code.isEmpty && m.error == nil)
        #expect(m.focus == .email)
        #expect(m.canContinue)
    }

    @Test func noConnectionSaysSo() async {
        let (m, _) = model()
        m.flow.email = "offline@example.com"
        await m.primary()
        #expect(m.flow.step == .signIn(fallback: true), "nobody is stuck: a password, and Create an account")
        #expect(m.title == "Sign in")
        m.flow.password = "x"
        await m.primary()
        #expect(m.error == WelcomeEmailModel.offline)
    }

    @Test func resendWaitsAndThenSendsANewCode() async {
        let (m, _) = model(EmailSignInFlow(step: .confirm, email: "new@example.com", codeSentAt: .now))
        await m.resend()
        #expect(m.notice == nil, "not before the minute is up")
        m.flow.codeSentAt = .now.addingTimeInterval(-61)
        await m.resend()
        #expect(m.notice == "New code sent. Only the newest one works.")
        #expect(m.flow.resendWait(now: .now) > 50)
    }

    @Test func anAppleAccountIsSentBackToTheButtons() async {
        let (m, _) = model()
        m.flow.email = "apple@example.com"
        await m.primary()
        #expect(m.flow.step == .apple)
        #expect(m.focus == nil)
    }

    #if os(iOS)
    /// The email field is the one Apple's own forms use: the email keyboard, email autofill, no
    /// autocorrection or capitals, Return says Continue; and the cursor is in it at once.
    @Test func theFieldIsAnEmailFieldWithTheCursorInIt() async throws {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        let (m, _) = model()
        window.rootViewController = UIHostingController(rootView: WelcomeNoteView(backend: Backend(), finished: true, email: m))
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        var field: UITextField?
        for _ in 0..<40 {
            field = Self.textField(in: window)
            if field?.isFirstResponder == true { break }
            try await Task.sleep(for: .milliseconds(100))
        }
        let f = try #require(field)
        #expect(f.isFirstResponder)
        #expect(f.keyboardType == .emailAddress)
        #expect(f.textContentType == .emailAddress)
        #expect(f.autocorrectionType == .no)
        #expect(f.autocapitalizationType == .none)
        #expect(f.returnKeyType == .continue)
    }

    /// The one text field on screen (SwiftUI keeps the identifier off the UIKit view).
    static func textField(in view: UIView) -> UITextField? {
        if let f = view as? UITextField { return f }
        for sub in view.subviews { if let f = textField(in: sub) { return f } }
        return nil
    }
    #endif
}
