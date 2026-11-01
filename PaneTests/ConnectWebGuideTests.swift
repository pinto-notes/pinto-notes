import Foundation
import Testing
@testable import Pane

/// Connect ChatGPT and Connect another AI (Emil's pick, 13 October 2026): one orange button per
/// page that opens exactly the right place, the sheet moving on by itself, a spinner only while
/// something is waited for, and Connected by itself.
@MainActor @Suite struct ConnectWebGuideTests {
    typealias Run = ConnectGuideRun
    typealias App = ConnectWebGuide.App
    static let server = "https://mcp.pintonotes.com"

    final class Box { var opened: [URL] = []; var copied: [String] = []; var closed = 0 }

    /// A guide with its links and copies caught instead of opened.
    private func run(_ ai: ConnectAISection.Guide, listing: URL? = nil, apps: [App] = App.allCases) -> (Run, Box) {
        let box = Box()
        let r = Run(ai: ai, guide: ai == .chatgpt ? .chatgpt(listing: listing) : nil, apps: apps, server: Self.server)
        r.open = { box.opened.append($0) }
        r.copy = { box.copied.append($0) }
        r.close = { box.closed += 1 }
        return (r, box)
    }

    @Test func chatgptAndAnotherAIOpenGuides() {
        #expect(ConnectWebGuide.opensSheet(.chatgpt))
        #expect(ConnectWebGuide.opensSheet(.other))
        for g in [ConnectAISection.Guide.claude, .claudeCode, .codex, .incredible] { #expect(!ConnectWebGuide.opensSheet(g)) }
    }

    @Test func openChatGPTCopiesOpensAndMovesOn() {
        let (r, box) = run(.chatgpt)
        #expect(r.stage == .intro)
        #expect(r.guide?.steps.count == 2)
        #expect(box.opened.isEmpty, "opening the guide opens no browser")

        r.primary()                                  // Show Me How
        #expect(r.stage == .step(0) && box.opened.isEmpty && box.copied.isEmpty)
        #expect(!r.waits)
        r.primary()                                  // Open ChatGPT
        #expect(box.opened == [ChatGPTPlugin.plugins])
        #expect(box.copied == [Self.server], "the address is copied for the form")
        #expect(r.stage == .step(1), "the sheet moves on by itself")
        #expect(r.waits, "the form page waits for ChatGPT")
        r.primary()
        #expect(r.stage == .step(1) && box.opened.count == 1, "the waiting page has nothing orange to press")

        r.quiet()                                    // Copy the address again
        #expect(box.copied == [Self.server, Self.server] && r.copied)

        r.back()
        #expect(r.stage == .step(0) && !r.waits)
        r.primary()                                  // Open ChatGPT Again
        #expect(box.opened.count == 2 && r.stage == .step(1))
        r.back(); r.back()
        #expect(r.stage == .intro)
    }

    @Test func connectedChatGPTAsksAndCloses() {
        let (r, box) = run(.chatgpt)
        r.primary(); r.primary()
        r.connected("ChatGPT")
        #expect(r.stage == .connected && !r.waits)
        r.back()
        #expect(r.stage == .connected, "no going back from Connected")
        r.primary()                                  // Ask ChatGPT
        #expect(box.opened.last == WebConnectPlan.chatgpt.testPage)
        r.quiet()                                    // Done
        #expect(box.closed == 1)
    }

    @Test func publicPluginIsOnePage() throws {
        let listing = try #require(URL(string: "https://chatgpt.com/plugins/pinto-notes"))
        let (r, box) = run(.chatgpt, listing: listing)
        #expect(r.guide?.single == true)
        #expect(r.stage == .step(0), "no intro: the one page")
        #expect(!r.waits, "nothing opened yet: no spinner")
        r.primary()
        #expect(box.opened == [listing])
        #expect(r.waits)
        r.quiet()                                    // open it again
        #expect(box.opened == [listing, listing])
    }

    /// The plugin is live (28 October 2026): Connect ChatGPT opens its page in one step, not the
    /// custom MCP server walk-through.
    @Test func connectChatGPTOpensThePublishedPlugin() {
        #expect(ChatGPTPlugin.listed?.absoluteString.hasPrefix("https://chatgpt.com/plugins/") == true)
        #expect(ConnectWebGuide.chatgpt().single)
        #expect(ConnectWebGuide.chatgpt(listing: nil).single == false)
    }

    @Test func anotherAIAppPressOpensItsLinkAndWaits() {
        let (r, box) = run(.other)
        #expect(r.stage == .step(0))
        #expect(!r.waits, "nothing pressed: no spinner")
        r.pick(.cursor)
        #expect(box.opened == [App.cursor.link(server: Self.server)])
        #expect(r.picked == .cursor && r.waits)
        r.connected(nil)
        #expect(r.stage == .connected && r.connectedAs == "Cursor")
        r.primary()
        #expect(box.closed == 1, "no orange button on Connected: Done closes")
    }

    @Test func somethingElseCopiesTheAddress() {
        let (r, box) = run(.other)
        r.quiet()
        #expect(box.copied == [Self.server] && r.copied)
        #expect(box.opened.isEmpty)
        #expect(r.waits, "copied: waiting for whatever app it goes into")
    }

    @Test func appLinksCarryTheAddress() throws {
        let claude = App.claude.link(server: Self.server).absoluteString
        #expect(claude.hasPrefix("https://claude.ai/customize/connectors?modal=add-custom-connector"))
        #expect(claude.contains("mcp.pintonotes.com"))

        let cursor = try #require(URLComponents(url: App.cursor.link(server: Self.server), resolvingAgainstBaseURL: false))
        #expect(cursor.scheme == "cursor" && cursor.host == "anysphere.cursor-deeplink" && cursor.path == "/mcp/install")
        #expect(cursor.queryItems?.first { $0.name == "name" }?.value == ConnectSnippets.serverName)
        let config = try #require(cursor.queryItems?.first { $0.name == "config" }?.value.flatMap { Data(base64Encoded: $0) })
        let json = try #require(try JSONSerialization.jsonObject(with: config) as? [String: String])
        #expect(json == ["url": Self.server])

        let vscode = App.vscode.link(server: Self.server).absoluteString
        #expect(vscode.hasPrefix("vscode:mcp/install?"))
        let body = try #require(String(vscode.dropFirst("vscode:mcp/install?".count)).removingPercentEncoding)
        let v = try #require(try JSONSerialization.jsonObject(with: Data(body.utf8)) as? [String: String])
        #expect(v == ["name": ConnectSnippets.serverName, "type": "http", "url": Self.server])
    }

    @Test func claudeIsAlwaysOffered() {
        #expect(App.here(server: Self.server).first == .claude)
    }

    @Test func waitingWords() {
        #expect(ConnectWebGuide.waiting(.chatgpt) == "Waiting for ChatGPT\u{2026}")
        #expect(ConnectWebGuide.waiting(.other) == "Waiting for your AI\u{2026}")
    }
}

extension FunnelTests {
    /// The guides say each connect step once: opened (the route), started at the first press that
    /// does something, waiting when the page waits, connected; closing before that is giving up.
    @MainActor @Suite struct ConnectWebGuideFunnel {
        private func reset() { for ai in ConnectAIKind.allCases { ConnectFunnel.closed(ai) } }

        @Test func chatgptSaysEachStepOnce() {
            reset()
            let steps = FunnelSteps()
            steps.watch {
                let route = ConnectGuideRoute()
                route.guideOpened(.chatgpt)
                let r = ConnectGuideRun(ai: .chatgpt, guide: .chatgpt(listing: nil), server: "https://mcp.example.com")
                r.open = { _ in }
                r.copy = { _ in }
                r.primary(); r.primary()              // Show Me How, Open ChatGPT
                r.quiet()                             // copy again
                r.back(); r.primary()                 // Open ChatGPT Again
                r.connected("ChatGPT")
                route.guideClosed()
            }
            #expect(steps.events == [.connectStep(.chatgpt, .opened), .connectStep(.chatgpt, .started),
                                     .connectStep(.chatgpt, .waiting), .connectStep(.chatgpt, .connected)])
        }

        @Test func anotherAIClosedWhileWaitingIsGivingUp() {
            reset()
            let steps = FunnelSteps()
            steps.watch {
                let route = ConnectGuideRoute()
                route.guideOpened(.other)
                let r = ConnectGuideRun(ai: .other, apps: [.claude], server: "https://mcp.example.com")
                r.copy = { _ in }
                r.open = { _ in }
                r.pick(.claude)
                route.guideClosed()
            }
            #expect(steps.events == [.connectStep(.other, .opened), .connectStep(.other, .started),
                                     .connectStep(.other, .waiting), .connectStep(.other, .gaveUp)])
        }

        @Test func lookingIsNotStarting() {
            reset()
            let steps = FunnelSteps()
            steps.watch {
                let route = ConnectGuideRoute()
                route.guideOpened(.chatgpt)
                let r = ConnectGuideRun(ai: .chatgpt, guide: .chatgpt(listing: nil), server: "https://mcp.example.com")
                r.primary(); r.back()                 // Show Me How, Back: nothing opened or copied
                route.guideClosed()
            }
            #expect(steps.events == [.connectStep(.chatgpt, .opened)])
        }
    }
}
