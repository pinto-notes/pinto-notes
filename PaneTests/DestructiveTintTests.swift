import Foundation
import SwiftUI
import Testing
@testable import Pane

/// A destructive item's icon is red like its title, as in Apple Notes (Emil, 30 October 2026: a
/// black trash can beside a red "Delete" in a note's long-press menu). Menus here are tinted with
/// the label colour, and that tint reached the icons of destructive items; every destructive
/// button with an icon carries `destructiveTint()`, which puts them back in red.
/// PaneUITests/ListMenusUITests checks the pixels of the long-press menu's Delete.
@Suite struct DestructiveTintTests {
    @Test func theTintIsTheSystemRed() {
        #expect(DestructiveTint.color == .red)
    }

    /// Every Button in the app's code with a destructive role (or one chosen at run time) and an
    /// icon is followed, before the next Button, by `.destructiveTint(`.
    @Test func everyDestructiveItemWithAnIconIsTintedRed() throws {
        var checked = 0
        var missing: [String] = []
        for folder in ["Views", "Editor", "App", "Model", "Sync", "Collab"] {
            guard let root = try? TestFiles.url(folder) else { continue }
            let files = FileManager.default.enumerator(at: root, includingPropertiesForKeys: nil)?.compactMap { $0 as? URL }.filter { $0.pathExtension == "swift" } ?? []
            for file in files {
                let lines = try String(contentsOf: file, encoding: .utf8).components(separatedBy: "\n")
                for (i, line) in lines.enumerated() where line.contains("Button(") && line.contains("systemImage") && line.contains(".destructive") {
                    checked += 1
                    // The button's own modifiers: up to the next Button, at most 10 lines on.
                    var after = String(line[line.range(of: "Button(")!.upperBound...])
                    for next in lines.dropFirst(i + 1).prefix(10) {
                        if next.contains("Button(") { break }
                        after += "\n" + next
                    }
                    if !after.contains(".destructiveTint(") { missing.append("\(file.lastPathComponent):\(i + 1)") }
                }
            }
        }
        #expect(checked >= 15, "the scan found the app's destructive items (\(checked))")
        #expect(missing.isEmpty, "a destructive item whose icon isn't red: \(missing)")
    }
}
