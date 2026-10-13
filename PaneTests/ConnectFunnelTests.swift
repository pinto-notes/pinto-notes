import Foundation
import Supabase
import Testing
@testable import Pane

extension FunnelTests {
    /// Connecting an AI says each step once for each time its guide is opened, and that it was
    /// given up when the guide closes after it started and before the AI was connected.
    @MainActor @Suite struct ConnectFunnelSteps {
        /// No guide left open by another test.
        private func reset() {
            for ai in ConnectAIKind.allCases { ConnectFunnel.closed(ai) }
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

        #if os(macOS)
        /// A row that runs Claude Code's command, stood in for: no shell, nothing opened.
        private func claudeCodeRun(installed: Bool = true) -> (ConnectRun, SupabaseClient) {
            let run = ConnectRun()
            run.address = "https://mcp.example.com"
            run.claudeCodeOnly = { true }
            run.shell = .init(isAvailable: { true }, exists: { _ in installed }, add: { _, _, _ in .added }, signIn: { _ in })
            return (run, SupabaseClient(supabaseURL: URL(string: "http://localhost")!, supabaseKey: "test"))
        }

        private func settle(_ run: ConnectRun, until done: () -> Bool) async throws {
            for _ in 0..<100 where !done() { try await Task.sleep(for: .milliseconds(20)) }
        }

        /// A row: pressed, waiting, connected, each once; Claude straight to Claude Code counts as
        /// Claude Code. Closing the sheet after that isn't giving up.
        @Test func aRowSaysEachStepOnce() async throws {
            reset()
            let steps = FunnelSteps()
            let (run, client) = claudeCodeRun()
            try await steps.watch {
                run.start(.claude, client: client, open: { _ in })
                try await settle(run) { run.phase == .waiting(ConnectCopy.allowInBrowser) }
                run.done(.claude)
                run.stop()
            }
            #expect(steps.events == [.connectStep(.claudeCode, .opened), .connectStep(.claudeCode, .started),
                                     .connectStep(.claudeCode, .waiting), .connectStep(.claudeCode, .connected)])
        }

        /// The sheet closes while the row waits: given up, once. Trying the same AI again isn't.
        @Test func aRowStoppedWhileWaitingIsGivingUp() async throws {
            reset()
            let steps = FunnelSteps()
            let (run, client) = claudeCodeRun()
            try await steps.watch {
                run.start(.claude, client: client, open: { _ in })
                try await settle(run) { run.phase == .waiting(ConnectCopy.allowInBrowser) }
                run.start(.claude, client: client, open: { _ in })      // pressed again
                try await settle(run) { run.phase == .waiting(ConnectCopy.allowInBrowser) }
                run.stop()
                run.stop()
            }
            #expect(steps.count(.connectStep(.claudeCode, .gaveUp)) == 1)
            #expect(steps.count(.connectStep(.claudeCode, .opened)) == 2)
        }

        /// Claude Code isn't on this Mac: the row fails, and says so.
        @Test func aRowThatFailsSaysSo() async throws {
            reset()
            let steps = FunnelSteps()
            let (run, client) = claudeCodeRun(installed: false)
            try await steps.watch {
                run.start(.claude, client: client, open: { _ in })
                try await settle(run) { if case .failed = run.phase { true } else { false } }
                run.stop()
            }
            #expect(steps.count(.connectStep(.claudeCode, .failed, kind: .other)) == 1)
            #expect(steps.count(.connectStep(.claudeCode, .gaveUp)) == 1, "started and never connected")
        }
        #endif

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
