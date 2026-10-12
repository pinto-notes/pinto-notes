import Foundation
import Testing
@testable import Pane

/// Release notes live on the website's changes page; the app never shows them by itself.
@Suite struct WhatsNewTests {
    @Test func whatsNewIsTheWebsitesChangesPage() {
        #expect(WhatsNew.changelogURL.absoluteString == "https://pintonotes.com/changelog")
        #expect(WhatsNew.title == "What\u{2019}s New")
    }
}
