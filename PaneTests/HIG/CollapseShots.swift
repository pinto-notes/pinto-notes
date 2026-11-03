#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Collapsible sections: a note open with the pointer over a heading (its chevron shows), and the
/// same note with two sections collapsed, drawn from a window that is never shown (far off screen,
/// never ordered in) straight into PNGs. Tables and pictures are live views these drawings leave
/// out; HeadingFoldInteractionTests checks a collapsed section hides them.
/// `TEST_RUNNER_PANE_COLLAPSE_SHOTS=/path scripts/qa-test.sh PaneTests/CollapseShots`
@MainActor @Suite(.serialized) struct CollapseShots {
    static let note = """
    Lisbon trip

    Four days in October, flying out Thursday morning.

    ## Packing
    - [ ] Passport
    - [ ] Charger and adapter
    - [x] Rain jacket

    ## Days
    ### Thursday
    Land at 11, tram 28 to Alfama, dinner at Taberna da Rua.
    ### Friday
    Belém in the morning, then the LX Factory.
    ### Saturday
    Sintra by train, back for sunset at the miradouro.

    ## Budget
    About 600 for the four days, food included.

    ## After
    Send Sara the photos.
    """

    func loc(_ tv: NSTextView, _ s: String) -> Int { (tv.string as NSString).range(of: s).location }

    @Test func states() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_COLLAPSE_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let saved = FoldStore.defaults
        FoldStore.defaults = TestDefaults()
        defer { FoldStore.defaults = saved }
        for dark in [false, true] {
            let c = try AppSnapshotTests.container()
            let n = c.mainContext.createNote(in: .all, body: Self.note)
            n.updatedAt = .now.addingTimeInterval(600)
            try c.mainContext.save()
            try await AppSnapshotTests.withLastNote(c, "Lisbon trip") {
                let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 1000))
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                let tv = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
                w.makeFirstResponder(nil)
                let mode = dark ? "dark" : "light"
                // The pointer over "Days": its chevron shows in the margin.
                tv.changeFolds { $0.hovered = self.loc(tv, "## Days") }
                await MacWindowChromeTests.settle(w, 6)
                try CodeBlockShots.render(tv, dark: dark).write(to: dir.appending(path: "collapse-open-hover-\(mode).png"))
                // Packing and Days collapsed, the pointer gone.
                tv.changeFolds { $0.hovered = nil }
                tv.toggleFold(loc(tv, "## Packing"))
                tv.toggleFold(loc(tv, "## Days"))
                await MacWindowChromeTests.settle(w, 6)
                try CodeBlockShots.render(tv, dark: dark).write(to: dir.appending(path: "collapse-collapsed-\(mode).png"))
                // The same, with the pointer over the open Budget heading.
                tv.changeFolds { $0.hovered = self.loc(tv, "## Budget") }
                await MacWindowChromeTests.settle(w, 6)
                try CodeBlockShots.render(tv, dark: dark).write(to: dir.appending(path: "collapse-collapsed-hover-\(mode).png"))
                #expect(tv.string == Self.note)
            }
        }
    }
}
#endif
