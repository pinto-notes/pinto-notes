import Foundation
import SwiftData
import Testing
import ZIPFoundation
@testable import Pane

/// The KeepImportTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/KeepImportTests.swift.
@MainActor @Suite(.serialized) struct KeepImportTests {
    /// A Takeout download: Takeout/Keep with a .json and .html per note, images and Labels.txt.
    static func takeout() throws -> URL {
        let src = try #require(Bundle(for: KeepFixtureToken.self).url(forResource: "Keep", withExtension: nil))
        let dir = FileManager.default.temporaryDirectory.appending(path: "keep-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try FileManager.default.copyItem(at: src.appending(path: "Takeout"), to: dir.appending(path: "Takeout"))
        return dir.appending(path: "Takeout")
    }
}

/// Finds this test target's own bundle (Bundle(for:)), where its fixtures are copied.
final class KeepFixtureToken {}
