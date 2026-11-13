import Foundation
@testable import Pane

// Privacy mode helpers the suites in more than one test target use (a test target can't see
// another's code).

/// A detector the test drives: it says sharing started or stopped when told.
@MainActor final class FakeShareDetector: ScreenShareDetector {
    private var changed: (@MainActor (Bool) -> Void)?
    private(set) var started = false
    func start(_ changed: @escaping @MainActor (Bool) -> Void) { self.changed = changed; started = true }
    func stop() { changed = nil; started = false }
    func say(_ sharing: Bool) { changed?(sharing) }
}

/// Leaves the app's privacy mode off, asking, watching nothing (shared by the suites).
@MainActor enum PrivacyModeInteractionReset {
    static func reset() {
        let m = PrivacyMode.shared
        m.stopWatching()
        m.sharingChanged(false)
        m.setManual(false)
        m.whenShared = .ask
    }
}
