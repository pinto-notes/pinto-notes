import Foundation
import Observation
import Testing
@testable import Pane

/// The account's startup work (key check, sync, asks) follows the sign-in state from the app
/// itself, not from a window's view: an app opened in the background has no window.
@MainActor @Suite struct AppSessionTests {
    @Observable final class Box { var value = 0 }

    private func wait(_ what: String, until done: @MainActor () -> Bool) async throws {
        for _ in 0 ..< 400 where !done() { try await Task.sleep(for: .milliseconds(10)) }
        #expect(done(), "\(what)")
    }

    @Test func theWorkRunsWithNoViewAndAgainOnEachChange() async throws {
        let box = Box()
        var runs: [Int] = []
        var cancelled = 0
        let following = AppSession.follow({ box.value }) {
            runs.append(box.value)
            // Long work, as a first sync is: a change cancels it and starts the next run.
            do { try await Task.sleep(for: .seconds(60)) } catch { cancelled += 1 }
        }
        try await wait("runs at once, with no view on screen") { runs == [0] }
        box.value = 1
        try await wait("runs again for the new value, the run before it cancelled") { runs == [0, 1] && cancelled == 1 }
        // Set to what it already is: not a change.
        box.value = 1
        try await Task.sleep(for: .milliseconds(50))
        #expect(runs == [0, 1])
        box.value = 2
        try await wait("and again") { runs == [0, 1, 2] && cancelled == 2 }
        following.cancel()
        try await wait("stopping it stops the work under way") { cancelled == 3 }
        box.value = 3
        try await Task.sleep(for: .milliseconds(50))
        #expect(runs == [0, 1, 2], "nothing follows any more")
    }

    @Test func changedReturnsOnlyWhenTheValueDiffers() async throws {
        let box = Box()
        var returned = false
        let waiting = Task { @MainActor in
            await AppSession.changed { box.value }
            returned = true
        }
        try await Task.sleep(for: .milliseconds(50))
        #expect(!returned)
        box.value = 0
        try await Task.sleep(for: .milliseconds(50))
        #expect(!returned, "the same value again isn't a change")
        box.value = 5
        try await wait("a different value is") { returned }
        waiting.cancel()
    }
}
