import Foundation
import Testing
@testable import Pane

/// The AIReviewTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/AIReviewTests.swift.
@Suite struct AIReviewTests {
    static let before = """
    Sync rewrite

    Plan
    - [ ] Queue the writes
    - [ ] Retry on reconnect

    Notes
    Keep the old path for a week.
    """
    /// Claude rewrote one item, added one, and replaced the notes line with two.
    static let after = """
    Sync rewrite

    Plan
    - [ ] Queue the writes offline, in order
    - [ ] Retry on reconnect
    - [ ] Have Codex review it

    Notes
    Drop the old path now.
    Tell Leo.
    """
}
