import Foundation
import SwiftData
import Testing
@testable import Pane

/// The NoteSourceTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/NoteSourceTests.swift.
@MainActor
@Suite struct NoteSourceTests {
    /// The site's real template file (web/content/templates/habit-tracker.json, as served).
    nonisolated static var habitTrackerFixture: URL { Bundle(for: NoteSourceFixtureToken.self).url(forResource: "habit-tracker", withExtension: "json")! }
}

/// Finds this test target's own bundle (Bundle(for:)), where its fixtures are copied.
final class NoteSourceFixtureToken {}
