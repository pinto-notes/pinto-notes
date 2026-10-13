import AuthenticationServices
import Foundation
import Testing
@testable import Pane

extension FunnelTests {
    /// The sign-in funnel (`sign_in_step`): each step once, where it happens.
    @MainActor @Suite struct SignInFunnel {
        @Test func aBrowserSignInSaysChosenOpenedAndSucceeded() async throws {
            let steps = FunnelSteps()
            let ok = try await steps.watch { try await Backend.reporting(.google, browser: true) { "session" } }
            #expect(ok == "session")
            #expect(steps.count(.signInStep(.google, .methodChosen)) == 1)
            #expect(steps.count(.signInStep(.google, .browserOpened)) == 1)
            #expect(steps.count(.signInStep(.google, .succeeded)) == 1)
            #expect(steps.events.count == 3)
        }

        @Test func appleThroughTheWebIsItsOwnMethod() async throws {
            let steps = FunnelSteps()
            _ = try await steps.watch { try await Backend.reporting(.appleWeb, browser: true) { 1 } }
            #expect(steps.count(.signInStep(.appleWeb, .browserOpened)) == 1)
            #expect(steps.count(.signInStep(.appleWeb, .succeeded)) == 1)
        }

        @Test func aFailureSaysItsKindAndAClosedSheetIsCancelled() async {
            let steps = FunnelSteps()
            await steps.watch {
                _ = try? await Backend.reporting(.google, browser: true) { () async throws -> Int in throw URLError(.notConnectedToInternet) }
                _ = try? await Backend.reporting(.google, browser: true) { () async throws -> Int in throw ASWebAuthenticationSessionError(.canceledLogin) }
            }
            #expect(steps.count(.signInStep(.google, .failed, kind: .network)) == 1)
            #expect(steps.count(.signInStep(.google, .cancelled)) == 1)
            #expect(steps.count(.signInStep(.google, .succeeded)) == 0)
        }

        @Test func aSignUpWaitingForItsCodeHasntSucceeded() async throws {
            let steps = FunnelSteps()
            _ = try await steps.watch { try await Backend.reporting(.email, chosen: false, signedIn: { (_: Bool) in false }) { true } }
            #expect(steps.events.isEmpty, "email is chosen in the flow, and a sign-up waiting for its code isn't in yet")
        }

        @Test func theEmailFlowSaysChosenPasswordAndCodeSent() {
            let steps = FunnelSteps()
            steps.watch {
                var flow = EmailSignInFlow()
                flow.email = "sara@example.com"
                let first = flow.beginCheck(), second = flow.beginCheck()
                #expect(first)
                #expect(!second, "a second Continue while checking does nothing")
                flow.finishCheck(.new)
                flow.password = String(repeating: "p", count: 12)
                flow.needsConfirmation(sentAt: .now)
                // Without a code sent (an account never confirmed), nothing until Resend code sends one.
                var other = EmailSignInFlow()
                other.email = "jonas@example.com"
                _ = other.beginCheck()
                other.finishCheck(.appleOnly)
                other.needsConfirmation(sentAt: nil)
            }
            #expect(steps.count(.signInStep(.email, .methodChosen)) == 2)
            #expect(steps.count(.signInStep(.email, .passwordShown)) == 1, "an Apple-only email shows no password")
            #expect(steps.count(.signInStep(.email, .codeSent)) == 1)
        }
    }
}
