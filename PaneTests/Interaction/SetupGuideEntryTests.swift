import Foundation
import Testing
@testable import Pane

/// Show Setup Guide did nothing on iPhone (Emil, 11 November 2026): iPhone and iPad have no setup
/// steps (Emil, 28 October 2026). It is no row in Help and feedback anywhere; the Mac keeps it in
/// its Help menu, where Settings search finds it.
@MainActor @Suite struct SetupGuideEntryTests {
    @Test func theSetupGuideIsOnTheMacOnly() {
        #expect(!HelpSettingsPage.offersSetupGuide, "no Show Setup Guide row on Help and feedback")
        #if os(macOS)
        let found = SettingsIndex.all.first { $0.label == HelpCopy.setupGuide }
        #expect(found?.menu == .setupGuide && found?.whereItIs == "Help menu", "the Mac's Settings search still finds it, in the Help menu")
        #endif
    }
}
