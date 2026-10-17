import Foundation
import Supabase
import SwiftUI
import Testing
@testable import Pane

/// The account's connections as the server lists them (`mcp_tokens`), one list per test: each
/// test's client has a host of its own, so tests side by side never see each other's rows.
final class ConnectionList: @unchecked Sendable {
    let host = "connections-\(UUID().uuidString.lowercased().prefix(8)).test"

    /// A sign-in to `redirectHost` made now, as the server writes it when the person allows it.
    func add(oauth redirectHost: String, name: String = "An AI", at: Date = .now) {
        add(["id": UUID().uuidString.lowercased(), "name": name, "kind": "oauth", "can_write": true,
             "created_at": StubSupabase.stamp(at), "last_used_at": NSNull(), "revoked_at": NSNull(), "redirect_host": redirectHost])
    }

    func add(_ row: [String: Any]) { Server.add(row, for: host) }

    var supabase: SupabaseClient {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [Server.self]
        return SupabaseClient(supabaseURL: URL(string: "http://\(host)")!, supabaseKey: "test",
                              options: SupabaseClientOptions(auth: .init(storage: MemoryAuthStorage(), autoRefreshToken: false,
                                                                         emitLocalSessionAsInitialSession: true),
                                                             global: .init(session: URLSession(configuration: config))))
    }

    final class Server: URLProtocol, @unchecked Sendable {
        nonisolated(unsafe) private static var lists: [String: [[String: Any]]] = [:]
        private static let lock = NSLock()

        static func add(_ row: [String: Any], for host: String) {
            lock.withLock { lists[host, default: []].insert(row, at: 0) }
        }

        override class func canInit(with request: URLRequest) -> Bool { request.url?.host?.hasSuffix(".test") == true }
        override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
        override func stopLoading() {}

        override func startLoading() {
            let url = request.url!
            let rows = Self.lock.withLock { Self.lists[url.host ?? ""] ?? [] }
            let body = url.path.hasSuffix("/mcp_tokens") ? (try? JSONSerialization.data(withJSONObject: rows)) ?? Data("[]".utf8) : Data("[]".utf8)
            let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: body)
            client?.urlProtocolDidFinishLoading(self)
        }
    }
}

extension FunnelTests {
    /// Real users (16 October 2026, 1.2.31 on the Mac) allowed ChatGPT and Claude while the guide
    /// waited, and the guide never said connected: they gave up, then `ai_connected` came seconds
    /// later. A guide now hears a new connection within two seconds, whichever AI and wherever it
    /// was allowed, with the app in the background, and the request to allow shows over the guide.
    @MainActor @Suite struct ConnectDetect {
        private func reset() { for ai in ConnectAIKind.allCases { ConnectFunnel.closed(ai) } }

        /// A row that waits for ChatGPT or Claude in the browser: nothing copied or opened for real.
        private func row(_ center: ConnectCenter) -> ConnectRun {
            let run = ConnectRun()
            run.center = center
            run.address = "https://mcp.example.com"
            run.copy = { _ in }
            #if os(macOS)
            run.claudeCodeOnly = { false }
            #endif
            return run
        }

        /// Seconds until `done`, or nil if it didn't happen within `limit`.
        private func time(within limit: Double, _ done: () -> Bool) async throws -> Double? {
            let start = ContinuousClock.now
            while !done() {
                let waited = ContinuousClock.now - start
                if waited > .seconds(limit) { return nil }
                try await Task.sleep(for: .milliseconds(20))
            }
            let d = (ContinuousClock.now - start).components
            return Double(d.seconds) + Double(d.attoseconds) / 1e18
        }

        private static let hosts: [ConnectAISection.Guide: String] = [.chatgpt: "chatgpt.com", .claude: "claude.ai"]
        private static let names: [ConnectAISection.Guide: String] = [.chatgpt: "ChatGPT", .claude: "Claude"]

        /// Allowed on this Mac (the consent sheet over the guide): the row says connected at once,
        /// and the funnel hears `connected`, never `gave_up`.
        @Test(arguments: [ConnectAISection.Guide.chatgpt, .claude])
        func aRowHearsAnApprovalHereAtOnce(_ ai: ConnectAISection.Guide) async throws {
            reset()
            let steps = FunnelSteps()
            let center = ConnectCenter()
            let list = ConnectionList()
            let run = row(center)
            var connected: [ConnectAISection.Guide] = []
            run.connected = { connected.append($0) }
            try await steps.watch {
                run.start(ai, client: list.supabase, open: { _ in })
                try await Task.sleep(for: .milliseconds(300))
                list.add(oauth: Self.hosts[ai]!)
                center.approvedHere(Self.names[ai])
                let took = try await time(within: 2) { !connected.isEmpty }
                #expect(took.map { $0 < 0.5 } == true, "\(ai): connected \(took.map { "\($0) s" } ?? "never") after Allow")
                run.stop()
            }
            #expect(connected == [ai])
            #expect(steps.count(.connectStep(ai.funnel, .connected)) == 1)
            #expect(steps.count(.connectStep(ai.funnel, .gaveUp)) == 0)
        }

        /// Allowed on another device, or the browser's page: the server's list has it. Heard at
        /// once with the server's "AI connected" notice, and within two seconds without it.
        @Test(arguments: [ConnectAISection.Guide.chatgpt, .claude])
        func aRowHearsTheServerWithinTwoSeconds(_ ai: ConnectAISection.Guide) async throws {
            reset()
            for notice in [true, false] {
                let center = ConnectCenter()
                let list = ConnectionList()
                let run = row(center)
                var connected = false
                run.connected = { _ in connected = true }
                run.start(ai, client: list.supabase, open: { _ in })
                try await Task.sleep(for: .milliseconds(300))
                list.add(oauth: Self.hosts[ai]!)
                if notice { center.connectionMayHaveAppeared() }
                let took = try await time(within: 3) { connected }
                #expect(took.map { $0 < (notice ? 0.5 : 2.2) } == true,
                        "\(ai), notice \(notice): connected \(took.map { "\($0) s" } ?? "never") after the server had it")
                run.stop()
            }
        }

        /// Each row knows only its own AI: Claude allowed, or a Claude sign-in on the server, doesn't
        /// finish ChatGPT's wait.
        @Test func aRowWaitsForItsOwnAI() async throws {
            reset()
            let center = ConnectCenter()
            let list = ConnectionList()
            let run = row(center)
            var connected = false
            run.connected = { _ in connected = true }
            run.start(.chatgpt, client: list.supabase, open: { _ in })
            list.add(oauth: "claude.ai")
            center.approvedHere("Claude")
            #expect(try await time(within: 2.5) { connected } == nil)
            list.add(oauth: "chatgpt.com")
            center.connectionMayHaveAppeared()
            #expect(try await time(within: 1) { connected } != nil)
            run.stop()
        }

        /// Claude Code and Codex: added with a token, connected at its first call. The server
        /// noting the call reaches the row within two seconds.
        #if os(macOS)
        @Test(arguments: [ConnectAISection.Guide.codex, .claudeCode])
        func aTerminalAIIsHeardAtItsFirstCall(_ ai: ConnectAISection.Guide) async throws {
            reset()
            let center = ConnectCenter()
            let list = ConnectionList()
            let run = row(center)
            run.shell = .init(isAvailable: { true }, exists: { _ in true }, add: { _, _, _ in .added }, signIn: { _, _ in .opened(nil) },
                              addToken: { _, _, _ in .added(details: "pinto-notes") })
            run.makeToken = { _, _ in "pane_test" }
            run.browserNotice = .zero
            var connected = false
            run.connected = { _ in connected = true }
            run.start(ai, client: list.supabase, open: { _ in })
            _ = try await time(within: 2) { if case .added = run.phase { true } else { false } }
            list.add(["id": UUID().uuidString.lowercased(), "name": ConnectCopy.tokenName(ai), "kind": "token", "can_write": true,
                      "created_at": StubSupabase.stamp(.now), "last_used_at": StubSupabase.stamp(.now), "revoked_at": NSNull(), "redirect_host": NSNull()])
            let took = try await time(within: 3) { connected }
            #expect(took.map { $0 < 2.2 } == true, "\(ai): \(took.map { "\($0) s" } ?? "never")")
            run.stop()
        }
        #endif

        /// The ChatGPT and Another AI guide sheets: the server's "AI connected" notice, as
        /// `AccountNotices` hears it, moves the page to Connected at once. One signal for both.
        @Test(arguments: [ConnectAISection.Guide.chatgpt, .other])
        func theGuideSheetHearsTheServersNotice(_ ai: ConnectAISection.Guide) async throws {
            reset()
            let steps = FunnelSteps()
            let center = ConnectCenter()
            let list = ConnectionList()
            let guide = ConnectGuideRun(ai: ai, apps: [.cursor], server: "https://mcp.example.com")
            guide.center = center
            guide.copy = { _ in }
            let notices = AccountNotices(client: list.supabase, user: UUID(), defaults: MemoryDefaults(), approvedHere: { nil },
                                         aiConnected: { center.connectionMayHaveAppeared() }, connection: { _ in .active("ChatGPT") })
            try await steps.watch {
                guide.watch(list.supabase)
                try await Task.sleep(for: .milliseconds(300))
                list.add(oauth: ai == .chatgpt ? "chatgpt.com" : "cursor.example")
                await notices.take([AccountNotice(id: 7, kind: .aiConnected, grant_id: UUID(), created_at: .now)])
                let took = try await time(within: 2) { guide.stage == .connected }
                #expect(took.map { $0 < 0.5 } == true, "\(ai): \(took.map { "\($0) s" } ?? "never")")
                guide.stop()
            }
            #expect(steps.count(.connectStep(ai.funnel, .connected)) == 1)
            await notices.stop()
        }

        /// Incredible's guide: a new sign-in to this computer, heard at once with the notice.
        @Test func incredibleIsHeardAtOnce() async throws {
            let center = ConnectCenter()
            let list = ConnectionList()
            let watch = ConnectWatch(approvedAs: nil) { IncredibleConnect.newConnection($0, since: $1) }
            watch.center = center
            let client = list.supabase
            let running = Task { await watch.run(client: client) }
            try await Task.sleep(for: .milliseconds(300))
            list.add(oauth: "127.0.0.1")
            center.connectionMayHaveAppeared()
            let took = try await time(within: 2) { watch.isConnected }
            #expect(took.map { $0 < 0.5 } == true, "\(took.map { "\($0) s" } ?? "never")")
            running.cancel()
        }

        /// The notice for an approval made on this device isn't shown again, but the guides still
        /// hear it: it's the same connection appearing.
        @Test func aNoticeAboutThisDevicesOwnApprovalStillReachesTheGuides() async {
            final class Count { var heard = 0 }
            let count = Count()
            let notices = AccountNotices(client: ConnectionList().supabase, user: UUID(), defaults: MemoryDefaults(),
                                         approvedHere: { .now }, aiConnected: { count.heard += 1 }, connection: { _ in .active("ChatGPT") })
            await notices.take([AccountNotice(id: 1, kind: .aiConnected, grant_id: UUID(), created_at: .now)])
            #expect(count.heard == 1)
            #expect(notices.current == nil, "this device's own approval isn't news to show")
            await notices.take([AccountNotice(id: 2, kind: .deviceAdded, created_at: .now)])
            #expect(count.heard == 1, "only AI connections")
            await notices.stop()
        }

        /// Waiting for news ends at the news, at the limit, or when the guide goes.
        @Test func waitingForNewsEndsAtTheNewsTheLimitOrTheGuideGoing() async throws {
            let center = ConnectCenter()
            var seen = center.connectionNews
            let soon = Task { try? await Task.sleep(for: .milliseconds(100)); center.connectionMayHaveAppeared() }
            var start = ContinuousClock.now
            await center.news(after: seen, within: .seconds(5))
            #expect(ContinuousClock.now - start < .seconds(1), "woken by the news")
            _ = await soon.value
            seen = center.connectionNews
            start = ContinuousClock.now
            await center.news(after: seen, within: .milliseconds(200))
            #expect(ContinuousClock.now - start < .seconds(2), "the limit")
            start = ContinuousClock.now
            let waiting = Task { await center.news(after: seen, within: .seconds(10)) }
            try await Task.sleep(for: .milliseconds(50))
            waiting.cancel()
            await waiting.value
            #expect(ContinuousClock.now - start < .seconds(2), "the guide went")
            start = ContinuousClock.now
            await center.news(after: seen - 1, within: .seconds(5))
            #expect(ContinuousClock.now - start < .seconds(1), "news since the last look: at once")
        }

        /// While a guide waits the app stays awake (no App Nap): the person is in the browser.
        @Test func theAppStaysAwakeWhileAGuideWaits() {
            let center = ConnectCenter()
            #expect(!center.keptAwake)
            center.expectAsks()
            center.expectAsks()
            #expect(center.keptAwake)
            center.stopExpectingAsks()
            #expect(center.keptAwake, "one guide still waits")
            center.stopExpectingAsks()
            #expect(!center.keptAwake)
        }

        #if os(macOS)
        /// The request to allow shows over a sheet on the Mac too (Settings, Connect an AI, a guide):
        /// a sheet's content is a host, and the top one.
        @Test func aSheetOnTheMacHostsTheConsentSheet() async throws {
            let center = ConnectCenter.shared
            let before = center.hosts
            let host = NSHostingView(rootView: Color.clear.frame(width: 200, height: 200).consentHost(client: ConnectionList().supabase))
            // Off screen, borderless and never ordered front: nothing appears on a developer's Mac.
            let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 200, height: 200), styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.contentView = host
            host.layoutSubtreeIfNeeded()
            _ = try await time(within: 2) { center.hosts.count > before.count }
            let added = center.hosts.filter { !before.contains($0) }
            #expect(added.count == 1, "the sheet's content registered as a host")
            if let id = added.first { #expect(center.presents(host: id), "and it's the one that presents") }
            window.contentView = nil
            window.close()
        }
        #endif
    }
}
