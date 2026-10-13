import Foundation
import Testing
@testable import Pane

/// Connect ChatGPT and Connect another AI (13 October 2026): pages in order, a browser opened only
/// by a button that says so, Copy that says Copied, and a spinner only while something is waited for.
@MainActor @Suite struct ConnectWebGuideTests {
    typealias Run = ConnectGuideRun

    /// A guide with its links and copies caught instead of opened.
    private func run(_ ai: ConnectAISection.Guide, listing: URL? = nil) -> (Run, Box) {
        let box = Box()
        let r = Run(ai: ai, guide: ai == .chatgpt ? .chatgpt(listing: listing) : nil, server: "https://mcp.pintonotes.com")
        r.open = { box.opened.append($0) }
        r.copy = { box.copied.append($0) }
        r.close = { box.closed += 1 }
        return (r, box)
    }

    final class Box { var opened: [URL] = []; var copied: [String] = []; var closed = 0 }

    @Test func chatgptAndAnotherAIOpenGuides() {
        #expect(ConnectWebGuide.opensSheet(.chatgpt))
        #expect(ConnectWebGuide.opensSheet(.other))
        for g in [ConnectAISection.Guide.claude, .claudeCode, .codex, .incredible] { #expect(!ConnectWebGuide.opensSheet(g)) }
    }

    @Test func chatgptWalksItsFourSteps() {
        let (r, box) = run(.chatgpt)
        #expect(r.stage == .intro)
        #expect(r.guide?.steps.map(\.title) == ["Open ChatGPT\u{2019}s plugins", "Add a custom MCP server", "Paste the address", "Allow it in Pinto Notes"])
        #expect(box.opened.isEmpty, "opening the guide opens no browser")

        r.primary()                                  // Show Me How
        #expect(r.stage == .step(0))
        #expect(box.opened.isEmpty)
        r.primary()                                  // Open ChatGPT
        #expect(box.opened == [ChatGPTPlugin.plugins], "only the button that says Open ChatGPT opens it")
        #expect(r.stage == .step(0) && r.opened == [0])
        r.primary()                                  // Next
        #expect(r.stage == .step(1))
        r.primary()
        #expect(r.stage == .step(2))
        #expect(r.step?.copiesAddress == true)
        r.copyAddress()
        #expect(box.copied == ["https://mcp.pintonotes.com"])
        #expect(r.copied == .address, "Copy says Copied")
        r.primary()
        #expect(r.stage == .step(3))
        #expect(r.waits)
        r.primary()
        #expect(r.stage == .step(3), "the waiting page has nothing to press on")
        #expect(box.opened.count == 1)

        r.back()
        #expect(r.stage == .step(2))
        r.back(); r.back(); r.back()
        #expect(r.stage == .intro)
        r.back()
        #expect(r.stage == .intro)
    }

    @Test func noSpinnerUntilSomethingIsWaitedFor() {
        let (r, _) = run(.chatgpt)
        #expect(!r.waits)
        r.primary()
        for _ in 0..<3 {
            #expect(!r.waits, "step \(r.stage) waits for nothing")
            r.primary(); if r.stage == .step(0) { r.primary() }
        }
        #expect(r.stage == .step(3) && r.waits)

        let (other, box) = run(.other)
        #expect(other.stage == .step(0), "another AI is one page")
        #expect(!other.waits, "nothing copied yet: nothing to wait for")
        other.primary()                              // Copy Address
        #expect(box.copied == ["https://mcp.pintonotes.com"])
        #expect(other.copied == .address)
        #expect(other.waits)
    }

    @Test func addedAlreadyGoesToAllow() {
        let (r, _) = run(.chatgpt)
        r.quiet()
        #expect(r.stage == .step(3) && r.waits)
        r.back()
        #expect(r.stage == .intro)
    }

    @Test func stepsWithALinkCanSkipOrOpenAgain() {
        let (r, box) = run(.chatgpt)
        r.primary()
        r.quiet()                                    // Next, without opening
        #expect(r.stage == .step(1) && box.opened.isEmpty)
        r.back()
        r.primary()                                  // Open ChatGPT
        r.quiet()                                    // Open ChatGPT again
        #expect(box.opened.count == 2 && r.stage == .step(0))
    }

    @Test func publicPluginIsOneStep() throws {
        let listing = try #require(URL(string: "https://chatgpt.com/plugins/pinto-notes"))
        let (r, box) = run(.chatgpt, listing: listing)
        #expect(r.guide?.steps.count == 1)
        #expect(r.guide?.steps.first?.title == "Open Pinto Notes in ChatGPT")
        #expect(r.guide?.note == nil)
        r.primary()
        #expect(!r.waits, "not opened yet")
        r.primary()
        #expect(box.opened == [listing])
        #expect(r.waits)
        r.quiet()                                    // Open ChatGPT again
        #expect(box.opened == [listing, listing])
    }

    @Test func listingIsOffByDefault() {
        #expect(ChatGPTPlugin.listed == nil)
        #expect(ConnectWebGuide.chatgpt(listing: nil).steps.count == 4)
    }

    @Test func connectedPageCopiesTheQuestionAndCloses() {
        let (r, box) = run(.chatgpt)
        r.primary()
        r.connected("ChatGPT")
        #expect(r.stage == .connected && !r.waits)
        r.back()
        #expect(r.stage == .connected, "no going back from Connected")
        r.quiet()
        #expect(box.copied == [WebConnectPlan.testPrompt] && r.copied == .question)
        r.primary()
        #expect(box.closed == 1)
    }

    @Test func waitingWords() {
        #expect(ConnectWebGuide.waiting(.chatgpt) == "Waiting for ChatGPT to connect\u{2026}")
        #expect(ConnectWebGuide.waiting(.other) == "Waiting for your AI to connect\u{2026}")
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
                r.primary(); r.primary()
                r.copyAddress(); r.copyAddress()
                r.primary()                           // the waiting page
                r.back(); r.primary()                 // and to it again
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
                let r = ConnectGuideRun(ai: .other, server: "https://mcp.example.com")
                r.copy = { _ in }
                r.primary()
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
                r.primary(); r.quiet(); r.quiet()     // Show Me How, Next, Next: nothing opened or copied
                route.guideClosed()
            }
            #expect(steps.events == [.connectStep(.chatgpt, .opened)])
        }
    }
}
