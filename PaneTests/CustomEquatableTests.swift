import Foundation
import Testing
@testable import Pane

/// A hand-written `==` on a type ties every file that uses `==` to that type: adding a private
/// function to NoteListView rebuilt 246 of the app's 268 files and every test file. The app's
/// hand-written comparisons go through CustomEquatable (Pane/Model/CustomEquatable.swift).
@MainActor @Suite struct CustomEquatableTests {
    private struct ByID: CustomEquatable {
        var id: Int
        var note: String
        static func isEqual(_ a: ByID, _ b: ByID) -> Bool { a.id == b.id }
    }

    @Test func equalityIsTheTypesOwnComparison() {
        #expect(ByID(id: 1, note: "a") == ByID(id: 1, note: "b"))
        #expect(ByID(id: 1, note: "a") != ByID(id: 2, note: "a"))
    }

    @Test func noAppTypeWritesItsOwnEqualsOperator() throws {
        let declared = try Regex(#"^\s*(?:@\w+\s+|private\s+|fileprivate\s+|public\s+|nonisolated\s+)*(?:static\s+)?func\s+==\s*[(<]"#)
        var found: [String] = []
        for (name, text) in try AmberButtonTests.appSources() where name != "Model/CustomEquatable.swift" {
            for (i, line) in text.split(separator: "\n", omittingEmptySubsequences: false).enumerated()
            where line.firstMatch(of: declared) != nil {
                found.append("\(name):\(i + 1)")
            }
        }
        #expect(found.isEmpty, "Conform to CustomEquatable and write static func isEqual instead of ==: \(found)")
    }
}
