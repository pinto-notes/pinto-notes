import Foundation
import SwiftData
import Testing
import ZIPFoundation
@testable import Pane

/// The MarkdownImportTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/MarkdownImportTests.swift.
@MainActor @Suite(.serialized) struct MarkdownImportTests {
    /// Export trees as the apps write them (PaneTests/Fixtures/Markdown), copied somewhere writable.
    static func fixture(_ name: String) throws -> URL {
        let src = try #require(Bundle(for: MarkdownFixtureToken.self).url(forResource: "Markdown", withExtension: nil)).appending(path: name)
        let dir = FileManager.default.temporaryDirectory.appending(path: "md-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let dest = dir.appending(path: name)
        try FileManager.default.copyItem(at: src, to: dest)
        return dest
    }
}

/// Finds this test target's own bundle (Bundle(for:)), where its fixtures are copied.
final class MarkdownFixtureToken {}
