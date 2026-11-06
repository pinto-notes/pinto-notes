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
            // SwiftUI builds its accessibility tree once an assistive app asks; say one did.
            NSApp.accessibilitySetValue(true, forAttribute: NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface"))
            defer { NSApp.accessibilitySetValue(false, forAttribute: NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")) }
            await MacWindowChromeTests.settle(w, 2)
            let item = try #require(w.toolbar?.items.first { $0.label == "New Note" && !$0.isHidden }, "New Note in the toolbar")
            let view = try #require(item.view)
            let button = try #require(MacEmptyDetailTests.element("list.newNote", in: view) ?? MacEmptyDetailTests.element("list.newNote", in: w.contentView!.superview!),
                                      "the New Note button")
            // A menu with a primary action is a segmented control: its click is its segment's press.
            let segment = (button.value(forKey: "accessibilityChildren") as? [NSObject])?.first ?? button
            _ = segment.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
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
