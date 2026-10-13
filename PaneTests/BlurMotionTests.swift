import Testing
@testable import Pane

@MainActor @Suite struct BlurMotionTests {
    /// The recording stage never shows outside a capture.
    @Test func demoOnlyWhenAskedFor() {
        #expect(BlurDemo.spot == nil)
    }

    /// iPhone: only the flow's first step has the picture on top (Emil, 13 October 2026).
    @Test func onlyTheFirstStepHasThePicture() {
        #expect(OnboardingFlow.showsArt(.name, first: .name))
        for step in [Onboarding.Step.bring, .connect, .tryIt] {
            #expect(!OnboardingFlow.showsArt(step, first: .name))
        }
        // A known name starts at Bring: that is the first step then.
        #expect(OnboardingFlow.showsArt(.bring, first: .bring))
        #expect(!OnboardingFlow.showsArt(.connect, first: .bring))
    }
}
