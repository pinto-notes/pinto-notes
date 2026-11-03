#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Divider lines at rest and on the caret's line, drawn offscreen into PNGs.
/// `TEST_RUNNER_PANE_DIVIDER_SHOTS=/path scripts/qa-test.sh PaneTests/DividerShots`
@MainActor @Suite(.serialized) struct DividerShots {
    static let note = """
    Trip notes

    Flights and hotel are booked.

    ---

    ## Packing

    - [ ] Passport
    - [ ] Charger

    ***

    Ideas for the last day.
    """

    @Test func states() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_DIVIDER_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            let c = try AppSnapshotTests.container()
            let n = c.mainContext.createNote(in: .all, body: Self.note)
            n.updatedAt = .now.addingTimeInterval(600)
            try c.mainContext.save()
            try await AppSnapshotTests.withLastNote(c, "Trip notes") {
                let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 1000))
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                let tv = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
                w.makeFirstResponder(nil)
                await MacWindowChromeTests.settle(w, 6)
                try CodeBlockShots.render(tv, dark: dark).write(to: dir.appending(path: "divider-rest-\(dark ? "dark" : "light").png"))
                guard !dark else { return }
                // The caret on a divider's line: the dashes show, faint, to edit.
                let r = (tv.string as NSString).range(of: "---")
                tv.setSelectedRange(NSRange(location: r.location + 1, length: 0))
                w.makeFirstResponder(tv)
                await MacWindowChromeTests.settle(w, 6)
                try CodeBlockShots.render(tv, dark: false).write(to: dir.appending(path: "divider-editing-light.png"))
                // Format › Divider from the last line.
                let last = (tv.string as NSString).range(of: "Ideas for the last day.")
                tv.setSelectedRange(NSRange(location: NSMaxRange(last), length: 0))
                tv.controller?.insertDivider()
                tv.insertText("Back home.", replacementRange: tv.selectedRange())
                w.makeFirstResponder(nil)
                await MacWindowChromeTests.settle(w, 6)
                try CodeBlockShots.render(tv, dark: false).write(to: dir.appending(path: "divider-inserted-light.png"))
            }
        }
    }
}
#endif
