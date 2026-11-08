import Foundation
import Testing
@testable import Pane

/// Release notes live on the website's changes page; the app never shows them by itself.
@Suite struct WhatsNewTests {
    @Test func whatsNewIsTheWebsitesChangesPage() {
        #expect(WhatsNew.changelogURL.absoluteString == "https://pintonotes.com/changelog")
        #expect(WhatsNew.title == "What\u{2019}s New")
        #expect(WhatsNew.row == "What\u{2019}s new", "sentence case in Settings")
    }

    /// A build installed by hand never claims the App Store updates it (Emil saw that on a dev build).
    @Test func theUpdateLineSaysWhereUpdatesReallyComeFrom() {
        #expect(GeneralCopy.updatesLine(.release) == GeneralCopy.updatesFromAppStore)
        #expect(GeneralCopy.updatesLine(.debug) == GeneralCopy.updatesWithInstall)
        #expect(GeneralCopy.updatesLine(.beta) == GeneralCopy.updatesWithInstall)
    }
}
