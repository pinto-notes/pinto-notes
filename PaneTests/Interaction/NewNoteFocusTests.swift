#if os(macOS)
import AppKit
import SwiftData
import Testing
@testable import Pane

/// New Note with a note open puts the cursor in the new note at once, so what you type goes in,
/// as in Notes (council round 16: "Trip files" typed after ⌘N went nowhere, and only later
/// typing landed). Clicked in this test's own offscreen window; no global events.
@MainActor @Suite(.serialized) struct NewNoteFocusTests {
    @Test func newNoteFromAnOpenNoteHasTheCursorAtOnce() async throws {
        let c = try AppSnapshotTests.container()
        let before = try c.mainContext.fetchCount(FetchDescriptor<Note>())
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1280, height: 800))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 4)
            // The list's New Note, in the toolbar item it shares with the list's ••• (7 November 2026).
            #expect(await MacWindowChromeTests.composeItem(w) != nil, "New Note in the toolbar")
            try #require(await MacWindowChromeTests.pressNewNote(w), "the New Note button")
            let clock = ContinuousClock(), start = clock.now
            func focused() -> PaneTextView? {
                guard let v = w.firstResponder as? PaneTextView, v.string.isEmpty else { return nil }
                return v
            }
            while clock.now - start < .seconds(3), focused() == nil { try? await Task.sleep(for: .milliseconds(20)) }
            let took = clock.now - start
            print("PERF new note has the cursor after \(took)")
            #expect(try c.mainContext.fetchCount(FetchDescriptor<Note>()) == before + 1, "a new note")
            #expect(focused() != nil, "the new note has the cursor: \(String(describing: w.firstResponder))")
            #expect(took < .milliseconds(500), "at once, not later: \(took)")
        }
    }
}
#endif
