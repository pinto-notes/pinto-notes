import Foundation
import Testing
@testable import Pane

extension FunnelTests {
    /// Connecting an AI says each step once for each time its guide is opened, and that it was
    /// given up when the guide closes after it started and before the AI was connected.
    @MainActor @Suite struct ConnectFunnelSteps {
        /// No guide left open by another test.
        private func reset() {
            for ai in ConnectAIKind.allCases { ConnectFunnel.closed(ai) }
            ConnectCenter.shared.panelAI = nil
        }

        @Test func eachStepOnceThenConnected() {
            reset()
            let steps = FunnelSteps()
            steps.watch {
                let route = ConnectGuideRoute()
                route.guideOpened(.chatgpt)
                ConnectFunnel.started(.chatgpt)
                ConnectFunnel.started(.chatgpt)       // Open ChatGPT Again
                ConnectFunnel.waiting(.chatgpt)
                ConnectFunnel.waiting(.chatgpt)       // the stage is read again
                ConnectFunnel.connected(.chatgpt)
                ConnectFunnel.connected(.chatgpt)
                route.guideClosed()
            }
            #expect(steps.events == [.connectStep(.chatgpt, .opened), .connectStep(.chatgpt, .started),
                                     .connectStep(.chatgpt, .waiting), .connectStep(.chatgpt, .connected)],
                    "connected, so closing it isn't giving up")
        }

        @Test func closedAfterStartingIsGivingUp() {
            reset()
            let steps = FunnelSteps()
            steps.watch {
                let route = ConnectGuideRoute()
                route.guideOpened(.claudeCode)
                ConnectFunnel.started(.claudeCode)
                route.guideClosed()
                route.guideClosed()                   // closed once only
            }
            #expect(steps.count(.connectStep(.claudeCode, .gaveUp)) == 1)
        }

        @Test func closedWithoutStartingIsJustLooking() {
            reset()
            let steps = FunnelSteps()
            steps.watch {
                let route = ConnectGuideRoute()
                route.guideOpened(.claude)
                route.guideClosed()
            }
            #expect(steps.events == [.connectStep(.claude, .opened)])
        }

        @Test func theFloatingWindowCarriesTheGuideOn() {
            reset()
            let steps = FunnelSteps()
            steps.watch {
                let route = ConnectGuideRoute()
                route.guideOpened(.claude)
                ConnectFunnel.started(.claude)
                // Mac: the button hands the guide to the floating window, then the sheet closes.
                ConnectCenter.shared.panelAI = "Claude"
                route.guideClosed()
                #expect(steps.count(.connectStep(.claude, .gaveUp)) == 0)
                // The window closes before it's connected.
                ConnectFunnel.closed(ConnectAIKind(guideName: "Claude"))
            }
            ConnectCenter.shared.panelAI = nil
            #expect(steps.count(.connectStep(.claude, .gaveUp)) == 1)
        }

        @Test func aFailureSaysItsKind() {
            reset()
            let steps = FunnelSteps()
            steps.watch { ConnectFunnel.failed(.codex, FailureSummary(URLError(.notConnectedToInternet)).kind) }
            #expect(steps.events == [.connectStep(.codex, .failed, kind: .offline)])
        }

        @Test func guideNamesMapToTheFunnelsAIs() {
            #expect(ConnectAIKind(guideName: "ChatGPT") == .chatgpt)
            #expect(ConnectAIKind(guideName: "Claude") == .claude)
            #expect(ConnectAIKind(guideName: "Claude Code") == .claudeCode)
            #expect(ConnectAIKind(guideName: "Codex") == .codex)
            #expect(ConnectAIKind(guideName: IncredibleConnect.ai) == .incredible)
            #expect(ConnectAIKind(guideName: "Another AI") == .other)
            for g in ConnectAISection.Guide.allCases where g != .other {
                #expect(ConnectAIKind(guideName: g.title) == g.funnel, "\(g)")
            }
        }
    }
}
