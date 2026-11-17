#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The WarmGreySnapshots suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/WarmGreySnapshots.swift.
@MainActor @Suite(.serialized) struct WarmGreySnapshots {
    /// Captured by window id (screencapture), which needs the window on screen: set only by CI's
    /// snapshots workflow, and the gate for every on-screen shot (AppSnapshotTests.onScreenAllowed).
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_DEMO_FRAMES"].map { URL(fileURLWithPath: $0) } }
}
#endif
