#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The toolbar's Aa popover against Apple Notes' (the 2026-10-11 pass), light and dark. Offscreen: `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/FormatPopoverSnapshots`.
@MainActor @Suite(.serialized) struct FormatPopoverSnapshots {
    /// The Aa popover with the caret on a body line and on a heading.
    @Test(arguments: [false, true])
    func formatPopover(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let controller = EditorController()
        try await AppSnapshotTests.render(FormatPopover(controller: controller, current: .body, close: {}), name: "mac-look-format-\(mode)", dark: dark)
        try await AppSnapshotTests.render(FormatPopover(controller: controller, current: .heading, close: {}), name: "mac-look-format-heading-\(mode)", dark: dark)
    }

    /// Attach › Link to a Note…: the picker with a few titles, and with nothing found.
    @Test(arguments: [false, true])
    func noteLinkPicker(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let titles = ["Kitchen remodel", "Reading list", "Porto in October", "Standup notes"]
        try await AppSnapshotTests.render(NoteLinkPicker(titles: { _ in titles }, pick: { _ in }), name: "mac-look-note-link-\(mode)", dark: dark)
        try await AppSnapshotTests.render(NoteLinkPicker(titles: { _ in [] }, pick: { _ in }), name: "mac-look-note-link-empty-\(mode)", dark: dark)
    }
}
#endif
