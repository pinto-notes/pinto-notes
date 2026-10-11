#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The toolbar's Aa popover against Apple Notes' (the 2026-10-11 pass), light and dark, with the
/// alternative look. Offscreen: `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/FormatPopoverSnapshots`.
@MainActor @Suite(.serialized) struct FormatPopoverSnapshots {
    /// The Aa popover with the caret on a heading, and the alternative with the row of four first.
    @Test(arguments: [false, true])
    func formatPopover(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let controller = EditorController()
        try await AppSnapshotTests.render(FormatPopover(controller: controller, current: .heading, close: {}), name: "mac-look-format-\(mode)", dark: dark)
        try await AppSnapshotTests.render(FormatPopover(controller: controller, current: .heading, formatsFirst: true, close: {}), name: "mac-look-format-alt-row-first-\(mode)", dark: dark)
    }
}
#endif
