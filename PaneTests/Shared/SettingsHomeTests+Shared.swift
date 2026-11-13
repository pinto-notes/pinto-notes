#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
import Carbon.HIToolbox
@testable import Pane

/// The SettingsHomeTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/SettingsHomeTests.swift.
@MainActor @Suite(.serialized) struct SettingsHomeTests {
    static func source(_ path: String) throws -> String {
        try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().appending(path: path), encoding: .utf8)
    }
}
#endif
