import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// The EvernoteImportTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/EvernoteImportTests.swift.
@MainActor @Suite(.serialized) struct EvernoteImportTests {
    /// Six notes, as Evernote 10 writes them: a recipe with an image and nested lists, a
    /// checklist in both of Evernote's styles, a table with code and unicode, an encrypted
    /// section, a PDF with an unplaced and a missing file, and an empty note.
    static var recipes: URL { Bundle(for: EvernoteFixtureToken.self).url(forResource: "Recipes", withExtension: "enex")! }
}

/// Finds this test target's own bundle (Bundle(for:)), where its fixtures are copied.
final class EvernoteFixtureToken {}
