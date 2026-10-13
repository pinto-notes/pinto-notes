import Testing
@testable import Pane

/// The blur prototype stays off unless it is asked for at launch.
@MainActor @Suite struct BlurMotionTests {
    @Test func offUnlessLaunchedWithTheSwitch() {
        #expect(!BlurMotion.on)
        #expect(!BlurMotion.staggered)
        #expect(BlurDemo.spot == nil)
    }
}
