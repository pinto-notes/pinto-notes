import Foundation
import Testing
@testable import Pane

/// The Templates card at the foot of the sidebar: who sees it, and that closing it holds.
@MainActor @Suite struct TemplatesCardTests {
    private let account = UUID()

    @Test func shownToASignedInAccountInATallSidebar() {
        #expect(TemplatesPromo.shows(account: account, closedHere: false, progress: SetupProgress(), sidebarHeight: 760, arguments: []))
        // Before the server has answered, too: the card doesn't wait on the network.
        #expect(TemplatesPromo.shows(account: account, closedHere: false, progress: nil, sidebarHeight: 760, arguments: []))
        #expect(!TemplatesPromo.shows(account: nil, closedHere: false, progress: nil, sidebarHeight: 760, arguments: []), "signed out: no card")
    }

    /// Every state the old setup card could have left an account in sees it: it never depended on that card.
    @Test(arguments: [
        SetupProgress(), SetupProgress(imported: true), SetupProgress(imported: true, connected: true),
        SetupProgress(dismissed: true), SetupProgress(imported: true, connected: true, aiEdits: 3, celebrated: true),
    ])
    func everyOldSetupStateSeesIt(progress: SetupProgress) {
        #expect(TemplatesPromo.shows(account: account, closedHere: false, progress: progress, sidebarHeight: 760, arguments: []))
    }

    @Test func closingItHoldsOnTheNextLaunch() {
        let defaults = TestDefaults()
        #expect(!TemplatesPromo.isClosedHere(account, defaults: defaults))
        TemplatesPromo.closeHere(account, defaults: defaults)
        #expect(TemplatesPromo.isClosedHere(account, defaults: defaults))
        #expect(!TemplatesPromo.shows(account: account, closedHere: TemplatesPromo.isClosedHere(account, defaults: defaults),
                                      progress: SetupProgress(), sidebarHeight: 760, arguments: []))
        #expect(!TemplatesPromo.isClosedHere(UUID(), defaults: defaults), "another account on this device still sees it")
    }

    @Test func closingItOnAnotherDeviceClosesItHere() {
        #expect(!TemplatesPromo.shows(account: account, closedHere: false, progress: SetupProgress(templatesClosed: true), sidebarHeight: 760, arguments: []))
    }

    @Test func aShortSidebarLeavesItOut() {
        #expect(!TemplatesPromo.shows(account: account, closedHere: false, progress: nil, sidebarHeight: TemplatesPromo.minimumSidebarHeight - 1, arguments: []))
        #expect(TemplatesPromo.shows(account: account, closedHere: false, progress: nil, sidebarHeight: TemplatesPromo.minimumSidebarHeight, arguments: []))
        #expect(!TemplatesPromo.shows(account: account, closedHere: false, progress: nil, sidebarHeight: 0, arguments: []), "before the sidebar has a size")
    }

    @Test func theLargestTextSizesLeaveItOut() {
        #expect(!TemplatesPromo.shows(account: account, closedHere: false, progress: nil, sidebarHeight: 760, largestText: true, arguments: []))
    }

    @Test func itsPicturesAreInTheApp() {
        for name in TemplatesCard.covers { #expect(PImage(named: name) != nil, "\(name)") }
    }

    @Test func capturesLeaveItOut() {
        #expect(!TemplatesPromo.shows(account: account, closedHere: false, progress: nil, sidebarHeight: 760, arguments: ["-uitest"]))
    }

    @Test func itOpensTheWebsitesTemplates() throws {
        let parts = try #require(URLComponents(url: TemplatesPromo.url, resolvingAgainstBaseURL: false))
        #expect(parts.scheme == "https")
        #expect(parts.host == "pintonotes.com")
        #expect(parts.path == "/templates")
        #expect(parts.queryItems?.contains(URLQueryItem(name: "utm_source", value: "app")) == true)
    }

    @Test func theWordsArePlain() {
        #expect(TemplatesPromo.line == "Trackers, plans and lists your AI can keep")
        for w in [TemplatesPromo.title, TemplatesPromo.line, TemplatesPromo.button] {
            #expect(!w.contains("\u{2014}") && !w.contains("\u{2013}") && !w.contains("!"))
        }
    }
}
