import Foundation
import Testing

/// The app was called Amber Notes until October 2026. Nothing a person reads may say so: no string
/// in the app's Swift code and no Localizable file. Comments may (they explain the rename), and so
/// may the few strings that must stay as they were, listed in `kept`.
@Suite struct OldNameTests {
    static let oldName = "Amber Notes"

    /// Strings that keep the old name on purpose, by file and the exact string.
    static let kept: Set<String> = [
        // The Mac download's bundle before the rename, which an update renames.
        "BundleRename.swift: Amber Notes.app",
        // What a locked note's password is checked against: changing it locks people out.
        "NoteLock.swift: Amber Notes locked notes",
    ]

    /// The app's and the share extension's code, copied into the test bundle (project.yml).
    static let folders = ["App", "Model", "Editor", "Sync", "Telemetry", "Views", "PaneShare"]

    @Test func noStringInTheCodeSaysTheOldName() throws {
        var found: [String] = []
        var files = 0
        for folder in Self.folders {
            let root = try TestFiles.url(folder)
            for case let url as URL in FileManager.default.enumerator(at: root, includingPropertiesForKeys: nil)! where url.pathExtension == "swift" {
                files += 1
                for literal in Self.stringLiterals(in: try String(contentsOf: url, encoding: .utf8)) where literal.contains(Self.oldName) {
                    let entry = "\(url.lastPathComponent): \(literal)"
                    if !Self.kept.contains(entry) { found.append(entry) }
                }
            }
        }
        #expect(files > 100, "the app's code is in the test bundle")
        #expect(found.isEmpty, "\(found.joined(separator: "\n"))")
    }

    /// Localizable.strings, .stringsdict and .xcstrings in the app (the test host) and its plug-ins.
    @Test func noLocalizableFileSaysTheOldName() throws {
        let app = Bundle.main.bundleURL
        var found: [String] = []
        for case let url as URL in FileManager.default.enumerator(at: app, includingPropertiesForKeys: nil)!
        where ["strings", "stringsdict", "xcstrings"].contains(url.pathExtension) {
            // Compiled .strings files are property lists; read them as such, whatever their format.
            let text: String
            if let dict = NSDictionary(contentsOf: url) { text = dict.description } else { text = (try? String(contentsOf: url, encoding: .utf8)) ?? "" }
            if text.contains(Self.oldName) { found.append(url.lastPathComponent) }
        }
        #expect(found.isEmpty, "\(found)")
    }

    @Test func theScannerFindsStringsButNotComments() {
        let code = #"""
        // Amber Notes in a comment
        /* Amber Notes in a block
           comment */ let a = "one"
        let b = "two // not a comment" // Amber Notes after code
        Text("Open \(name) in Amber Notes")
        let c = """
            Amber Notes in a multi-line string
            """
        let d = "escaped \" Amber Notes"
        """#
        #expect(Self.stringLiterals(in: code) == ["one", "two // not a comment", "Open \\(name) in Amber Notes", "escaped \\\" Amber Notes"])
    }

    /// The single-line string literals in Swift source, as written (escapes kept), skipping
    /// comments and multi-line strings.
    static func stringLiterals(in source: String) -> [String] {
        var out: [String] = []
        let chars = Array(source)
        var i = 0
        var block = 0
        func at(_ k: Int, _ s: String) -> Bool { k + s.count <= chars.count && String(chars[k..<k + s.count]) == s }
        while i < chars.count {
            if block > 0 {
                if at(i, "*/") { block -= 1; i += 2 } else if at(i, "/*") { block += 1; i += 2 } else { i += 1 }
            } else if at(i, "//") {
                while i < chars.count, chars[i] != "\n" { i += 1 }
            } else if at(i, "/*") {
                block = 1; i += 2
            } else if at(i, "\"\"\"") {
                i += 3
                while i < chars.count, !at(i, "\"\"\"") { i += 1 }
                i += 3
            } else if chars[i] == "\"" {
                var j = i + 1
                var literal = ""
                while j < chars.count, chars[j] != "\"", chars[j] != "\n" {
                    if chars[j] == "\\", j + 1 < chars.count { literal.append(chars[j]); literal.append(chars[j + 1]); j += 2 } else { literal.append(chars[j]); j += 1 }
                }
                out.append(literal)
                i = j + 1
            } else {
                i += 1
            }
        }
        return out
    }
}
