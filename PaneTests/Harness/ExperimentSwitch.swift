import Foundation
import Testing
@testable import Pane

/// An experiment (Settings › Experimental) switched on or off around a suite or a test, and put
/// back as it was after. The test host keeps its settings in UserDefaults.standard, the same file
/// as a Pinto Notes installed outside the App Store (dev.emilwagman.pane). A switch a suite turned
/// on and left on (13 November 2026) turned Tags on for the suites after it (TagEditorTests,
/// MenuLookTests) and for the installed app.
struct ExperimentSwitch: SuiteTrait, TestTrait, TestScoping {
    let key: String
    let on: Bool

    func provideScope(for test: Test, testCase: Test.Case?, performing function: @Sendable () async throws -> Void) async throws {
        let defaults = UserDefaults.standard
        let before = defaults.object(forKey: key) as? Bool
        defaults.set(on, forKey: key)
        defer {
            if let before { defaults.set(before, forKey: key) } else { defaults.removeObject(forKey: key) }
        }
        try await function()
    }
}

extension Trait where Self == ExperimentSwitch {
    /// `experiment` on (or off) while the suite or test runs, as it was again after.
    static func experiment(_ experiment: Experiment, on: Bool = true) -> Self { .init(key: experiment.key, on: on) }
}
