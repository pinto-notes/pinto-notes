#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The FileRowClickTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/Interaction/FileRowClickTests.swift.
@MainActor @Suite(.serialized) struct FileRowClickTests {
    static var onCI: Bool { ProcessInfo.processInfo.environment["PANE_SNAPSHOTS"] == "1" }

    /// A borderless window that can be key, so clicks select instead of activating.
    final class KeyWindow: NSWindow {
        override var canBecomeKey: Bool { true }
        override var canBecomeMain: Bool { true }
    }

    static func table(in view: NSView?) -> NSTableView? {
        guard let view else { return nil }
        if let t = view as? NSTableView { return t }
        for v in view.subviews { if let t = table(in: v) { return t } }
        return nil
    }
}
#endif
