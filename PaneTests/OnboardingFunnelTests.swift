import Foundation
import Testing
@testable import Pane

extension FunnelTests {
    /// The first-run flow says each screen once as it's shown, and how it was left.
    @MainActor @Suite struct OnboardingFunnel {
        private let now = Date(timeIntervalSince1970: 1_800_000_000)
        private var justNow: Date { now.addingTimeInterval(-30) }

        private func started(_ defaults: UserDefaults = TestDefaults()) -> OnboardingStore {
            let s = OnboardingStore(defaults: defaults, steps: Onboarding.steps(mac: true))
            s.attach(account: UUID(), created: justNow, holdsNothing: true, now: now)
            s.settle(accountIsNew: true, progress: SetupProgress())
            return s
        }

        /// iPhone and iPad have no steps: a new account that has signed in counts as finished,
        /// and nothing else is said.
        @Test func withoutStepsANewAccountCountsAsFinished() {
            let steps = FunnelSteps()
            steps.watch {
                let s = OnboardingStore(defaults: TestDefaults(), steps: Onboarding.steps(mac: false))
                s.attach(account: UUID(), created: justNow, holdsNothing: true, now: now)
                s.settle(accountIsNew: true, progress: SetupProgress())
            }
            #expect(steps.count(.onboardingStep(.done, .shown)) == 1)
            #expect(steps.events.count == 1)
        }

        @Test func eachScreenIsShownOnceAndLeftOnce() {
            let steps = FunnelSteps()
            steps.watch {
                let s = started()
                s.advance(connected: false)                 // name: Continue
                s.advance(connected: false, skipped: true)  // bring: Skip, I'll start empty
                s.back()                                    // connect: Back
                s.advance(connected: false)                 // bring again: Continue
                #expect(!s.advance(connected: false, skipped: true), "connect: Skip for now ends it")
                s.finish(landing: .newNote)
            }
            #expect(steps.count(.onboardingStep(.name, .shown)) == 1)
            #expect(steps.count(.onboardingStep(.name, .continued)) == 1)
            #expect(steps.count(.onboardingStep(.bring, .shown)) == 2)
            #expect(steps.count(.onboardingStep(.bring, .skipped)) == 1)
            #expect(steps.count(.onboardingStep(.bring, .continued)) == 1)
            #expect(steps.count(.onboardingStep(.connect, .shown)) == 2)
            #expect(steps.count(.onboardingStep(.connect, .back)) == 1)
            #expect(steps.count(.onboardingStep(.connect, .skipped)) == 1)
            #expect(steps.count(.onboardingStep(.done, .shown)) == 1)
            #expect(steps.events.count == 11)
        }

        @Test func connectedGoesOnToTryIt() {
            let steps = FunnelSteps()
            steps.watch {
                let s = started()
                s.advance(connected: false)
                s.advance(connected: false)
                s.advance(connected: true)
                #expect(!s.advance(connected: true), "the AI's line arrived: Try it ends")
                s.finish(landing: nil)
            }
            #expect(steps.count(.onboardingStep(.connect, .continued)) == 1)
            #expect(steps.count(.onboardingStep(.tryIt, .shown)) == 1)
            #expect(steps.count(.onboardingStep(.tryIt, .continued)) == 1)
            #expect(steps.count(.onboardingStep(.done, .shown)) == 1)
        }

        @Test func aResumedFlowIsShownAgainWhereItWas() {
            let defaults = TestDefaults()
            let account = UUID()
            let first = OnboardingStore(defaults: defaults, steps: Onboarding.steps(mac: true))
            first.attach(account: account, created: justNow, holdsNothing: true, now: now)
            first.settle(accountIsNew: true, progress: SetupProgress())
            first.advance(connected: false)
            let steps = FunnelSteps()
            steps.watch {
                OnboardingStore(defaults: defaults, steps: Onboarding.steps(mac: true)).attach(account: account, created: justNow, holdsNothing: false, now: now)
            }
            #expect(steps.events == [.onboardingStep(.bring, .shown)])
        }

        @Test func aReplayFromHelpSaysNothing() {
            let s = OnboardingStore(defaults: TestDefaults(), steps: Onboarding.steps(mac: true))
            s.attach(account: UUID(), created: nil, holdsNothing: false, now: now)
            let steps = FunnelSteps()
            steps.watch {
                s.startReplay()
                s.advance(connected: false)
                s.finish(landing: nil)
            }
            #expect(steps.events.isEmpty)
        }
    }
}
