#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The welcome and its sign-in step at the Mac window's size, light and dark.
/// Runs only when AMBER_HIG_SHOTS is set: `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/WelcomeSnapshots`.
@MainActor @Suite(.serialized) struct WelcomeSnapshots {
    /// As the app shows it signed out: the whole window, edge to edge. Offscreen
    /// (AppSnapshotTests.shoot), so no window chrome is drawn.
    static func shoot(_ view: some View, name: String, dark: Bool) async throws {
        try await AppSnapshotTests.shoot(view.containerBackground(for: .window) { Backdrop() }, name: name, size: WelcomeFlow.size,
                                         dark: dark, toolbar: false, card: true, wait: 0.9)
    }

    @Test(arguments: [false, true])
    func welcome(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let backend = Backend()
        for (name, stage) in [("welcome", WelcomeFlow.Stage.welcome), ("signin", .signIn(returning: false)), ("signin-returning", .signIn(returning: true))] {
            try await Self.shoot(WelcomeFlow(backend: backend, stage: stage), name: "mac-\(name)-\(mode)", dark: dark)
        }
        try await Self.shoot(WelcomeFlow(backend: backend, stage: .signIn(returning: false), focusEmail: true), name: "mac-signin-focused-\(mode)", dark: dark)
        // Newcomer audit 8, 23, 24: the password rule, the spinner on the button pressed, the email said once.
        for (name, flow, pressed) in Self.signInStates {
            try await Self.shoot(WelcomeFlow(backend: backend, stage: .signIn(returning: false), flow: flow, pressed: pressed), name: "mac-\(name)-\(mode)", dark: dark)
        }
    }

    static var signInStates: [(String, EmailSignInFlow, SignInView.Way?)] {
        func flow(_ step: EmailSignInFlow.Step, password: String = "") -> EmailSignInFlow {
            var f = EmailSignInFlow()
            f.email = "sara.lindqvist@example.com"
            f.step = step
            f.password = password
            return f
        }
        return [
            ("signin-existing", flow(.signIn(fallback: false)), nil),
            ("signin-create-short", flow(.create, password: "123456789"), nil),
            ("signin-create-met", flow(.create, password: "123456789abc"), nil),
            ("signin-google-busy", EmailSignInFlow(), .google),
        ]
    }
}
#endif
