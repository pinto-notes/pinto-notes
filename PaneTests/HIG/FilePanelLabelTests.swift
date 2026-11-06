#if os(macOS)
import Foundation
import Testing
@testable import Pane

/// Each file panel says what it does. Export All Notes' "Export" stays on its own panel: set on the
/// window, it reached Attach File's open panel too (council round 16, `a12-attach-picture`).
@MainActor @Suite struct FilePanelLabelTests {
    @Test func exportsLabelStaysOnItsPanel() throws {
        let src = try SettingsHomeTests.source("Pane/Views/DeleteAccount.swift")
        let panels = try #require(src.range(of: "func noteExportPanels").map { String(src[$0.lowerBound...].prefix(900)) })
        let background = try #require(panels.range(of: "return background {"))
        let label = try #require(panels.range(of: ".fileDialogConfirmationLabel(\"Export\")"))
        #expect(background.upperBound < label.lowerBound, "the label is set inside the panel's own background view")
        let close = try #require(panels[label.upperBound...].range(of: "\n        }"))
        #expect(!panels[label.upperBound..<close.lowerBound].contains(".alert("), "and closes before the rest of the window")
    }

    /// The sample note's first tip: "Click" on the Mac, "Tap" on iPhone (council round 16).
    @Test func theWelcomeSaysClickOnTheMac() {
        #expect(Seed.welcome.contains("- [ ] Click a circle to check it off"))
        #expect(!Seed.welcome.contains("Tap a circle"))
    }
}
#endif
