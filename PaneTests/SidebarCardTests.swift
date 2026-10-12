import Foundation
import Testing
@testable import Pane

/// The one card at the foot of the sidebar: Connect your AI until an AI is connected, then
/// Templates; never both, and closing either holds.
@MainActor @Suite struct SidebarCardTests {
    private let account = UUID()

    private func pick(_ progress: SetupProgress?, connectHere: Bool = false, templatesHere: Bool = false,
                      height: CGFloat = 760, largest: Bool = false, args: [String] = []) -> SidebarCard? {
        SidebarCard.pick(account: account, progress: progress, connectClosedHere: connectHere, templatesClosedHere: templatesHere,
                         sidebarHeight: height, largestText: largest, arguments: args)
    }

    @Test func connectFirstThenTemplatesNeverBoth() {
        #expect(pick(SetupProgress()) == .connect, "nothing connected: Connect your AI")
        #expect(pick(SetupProgress(connected: true)) == .templates, "an AI is connected: Templates")
        #expect(pick(SetupProgress(connectCardClosed: true)) == .templates, "Connect closed: Templates")
        #expect(pick(SetupProgress(), connectHere: true) == .templates)
        #expect(pick(SetupProgress(connected: true, templatesClosed: true)) == nil)
        #expect(pick(SetupProgress(templatesClosed: true, connectCardClosed: true)) == nil)
    }

    @Test func nothingUntilTheServerHasSaid() {
        #expect(pick(nil) == nil, "no card flashes and swaps")
        #expect(SidebarCard.pick(account: nil, progress: SetupProgress(), connectClosedHere: false, templatesClosedHere: false, sidebarHeight: 760, arguments: []) == nil)
    }

    /// Every state the old setup card could have left an account in gets a card.
    @Test(arguments: [
        SetupProgress(), SetupProgress(imported: true), SetupProgress(imported: true, connected: true),
        SetupProgress(dismissed: true), SetupProgress(imported: true, connected: true, aiEdits: 3, celebrated: true),
    ])
    func everyOldSetupStateGetsACard(progress: SetupProgress) {
        #expect(pick(progress) == (progress.connected ? .templates : .connect))
    }

    @Test func closingHoldsPerAccountOnTheNextLaunch() {
        let defaults = TestDefaults()
        SidebarCard.closeHere(.connect, account, defaults: defaults)
        #expect(SidebarCard.isClosedHere(.connect, account, defaults: defaults))
        #expect(!SidebarCard.isClosedHere(.templates, account, defaults: defaults), "one card closed, not the other")
        #expect(!SidebarCard.isClosedHere(.connect, UUID(), defaults: defaults), "another account still sees it")
        #expect(SidebarCard.connect.mark == "connect_card_closed" && SidebarCard.templates.mark == "templates_closed")
    }

    @Test func smallSidebarsLargestTextAndCapturesLeaveItOut() {
        #expect(pick(SetupProgress(), height: SidebarCard.minimumSidebarHeight - 1) == nil)
        #expect(pick(SetupProgress(), height: 0) == nil, "before the sidebar has a size")
        #expect(pick(SetupProgress(), largest: true) == nil)
        #expect(pick(SetupProgress(), args: ["-uitest"]) == nil)
    }

    @Test func itsPicturesAreInTheApp() {
        for name in TemplatesPromo.covers { #expect(PImage(named: name) != nil, "\(name)") }
    }

    @Test func templatesOpensTheWebsite() throws {
        let parts = try #require(URLComponents(url: TemplatesPromo.url, resolvingAgainstBaseURL: false))
        #expect(parts.host == "pintonotes.com" && parts.path == "/templates")
    }

    @Test func theWordsArePlain() {
        #expect(ConnectCardWords.line == "ChatGPT, Claude and others can read and write your notes when you ask.")
        for w in [TemplatesPromo.title, TemplatesPromo.line, TemplatesPromo.button, ConnectCardWords.title, ConnectCardWords.line, ConnectCardWords.button] {
            #expect(!w.contains("\u{2014}") && !w.contains("\u{2013}") && !w.contains("!") && !w.contains("MCP"))
        }
    }

    @Test func aServerThatHasNotTheConnectMarkStillDecodes() throws {
        let json = #"{"imported":false,"connected":false,"ai_edits":0,"dismissed":true,"celebrated":false,"templates_closed":false}"#
        let p = try JSONDecoder().decode(SetupProgress.self, from: Data(json.utf8))
        #expect(!p.connectCardClosed)
        let with = #"{"connected":false,"connect_card_closed":true}"#
        #expect(try JSONDecoder().decode(SetupProgress.self, from: Data(with.utf8)).connectCardClosed)
    }
}
