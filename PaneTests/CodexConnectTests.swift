import Foundation
import Supabase
import Testing
@testable import Pane

/// Connecting Codex (or Claude Code) from Connect an AI on the Mac, as Emil did on 13 October 2026:
/// the row says the browser is about to open, one sign-in runs, the Allow sheet names the AI it
/// started, and one request shows one sheet.
@MainActor @Suite struct CodexConnectTests {
    /// What Codex 0.159 prints from `codex mcp add` for a server with sign-in (Windows probe,
    /// 13 October 2026, against a public server).
    static let codexPrinted = """
        Added global MCP server 'pinto-notes'.
        Detected OAuth support. Starting OAuth flow…
        Authorize `pinto-notes` by opening this URL in your browser:
        https://mcp.pintonotes.com/authorize?response_type=code&client_id=https%3A%2F%2Fchatgpt.com%2Foauth%2Fcodex%2Fclient.json&state=q6coy-SGV4u92eR5uSf_8g&code_challenge=rBZjaEjPR96TK-h5fN8gkyO8SViurBicaOB2kXWuW_Y&code_challenge_method=S256&redirect_uri=http%3A%2F%2F127.0.0.1%3A57505%2Fcallback&resource=https%3A%2F%2Fmcp.pintonotes.com%2Fmcp

        """
    /// What `claude mcp login` prints.
    static let claudeCodePrinted = """
        Starting authentication for "pinto-notes"…
        If the browser didn't open, visit:
          https://mcp.pintonotes.com/authorize?response_type=code&client_id=https%3A%2F%2Fclaude.ai%2Foauth%2Fclaude-code-client-metadata&code_challenge=GWXC&code_challenge_method=S256&redirect_uri=http%3A%2F%2Flocalhost%3A45422%2Fcallback&state=ClbvvSiMTosTzox5semwrn16FB3EQrGXdf4X4OgcuUo
        Waiting for authorization… (^C to cancel)
        """

    /// The request Emil's Allow sheet showed: Codex's sign-in, opened with the page's button on this
    /// Mac, calling itself Codex.
    static func request(state: String = "q6coy-SGV4u92eR5uSf_8g", redirect: String = "http://127.0.0.1:57505/callback",
                        claimed: String = "Codex", loopback: Bool = true) -> ConnectRequest {
        ConnectRequest(id: UUID(), client_name: "127.0.0.1", redirect_host: URL(string: redirect)!.host!, redirect_uri: redirect,
                       claimed_name: claimed, loopback: loopback, wants_write: true, asked: true, started_at: .now,
                       started_from: "Chrome on a Mac", state: state, iss: "https://mcp.pintonotes.com", scan: true, browser_key: "")
    }

    static var codexSignIn: ConnectOwnSignIn {
        ConnectOwnSignIn(ai: "Codex", authorization: ConnectOwnSignIn.authorization(in: codexPrinted)!)!
    }

    // MARK: Recognizing the sign-in the app started

    @Test func theAddressCodexAndClaudeCodePrintIsFound() throws {
        let codex = try #require(ConnectOwnSignIn.authorization(in: Self.codexPrinted))
        #expect(codex.host == "mcp.pintonotes.com")
        let own = try #require(ConnectOwnSignIn(ai: "Codex", authorization: codex))
        #expect(own.state == "q6coy-SGV4u92eR5uSf_8g" && own.redirectURI == "http://127.0.0.1:57505/callback")
        let claude = try #require(ConnectOwnSignIn.authorization(in: Self.claudeCodePrinted))
        #expect(ConnectOwnSignIn(ai: "Claude Code", authorization: claude)?.redirectURI == "http://localhost:45422/callback")
        #expect(ConnectOwnSignIn.authorization(in: "Added global MCP server 'pinto-notes'.\nhttps://example.com/docs") == nil)
    }

    @Test func onlyASignInThatReturnsToThisComputerCounts() {
        let web = URL(string: "https://mcp.pintonotes.com/authorize?state=q6coy-SGV4u92eR5uSf_8g&redirect_uri=https%3A%2F%2Fevil.example%2Fcb")!
        #expect(ConnectOwnSignIn(ai: "Codex", authorization: web) == nil)
        let short = URL(string: "https://mcp.pintonotes.com/authorize?state=abc&redirect_uri=http%3A%2F%2F127.0.0.1%3A1%2Fcb")!
        #expect(ConnectOwnSignIn(ai: "Codex", authorization: short) == nil, "a state too short to be a secret ties nothing")
    }

    @Test func theRequestFromTheAppsOwnSignInIsShownAsThatAI() {
        let r = ConnectOwnSignIn.mark(Self.request(), by: Self.codexSignIn)
        #expect(r.startedHere == "Codex" && r.verifiedAI == "Codex")
        #expect(ConsentSheet.title(r) == "Allow Codex to use your notes?")
        let line = ConsentSheet.detail(r)
        #expect(!line.contains("doesn\u{2019}t recognize") && !line.contains("calls itself"))
        #expect(line == "You started connecting Codex on this Mac. Locked notes stay private.")
        #expect(ConnectRun.approvalCounts(r.verifiedAI, for: .codex), "allowing it finishes Codex's row")
        #expect(!ConnectRun.approvalCounts(r.verifiedAI, for: .chatgpt))
    }

    @Test func aNameAloneIsNeverRecognized() {
        let own = Self.codexSignIn
        // Calls itself Codex, from another sign-in: another state, or the same state to another port.
        for r in [Self.request(state: "someone-elses-state-123"), Self.request(redirect: "http://127.0.0.1:57506/callback"),
                  Self.request(loopback: false)] {
            let shown = ConnectOwnSignIn.mark(r, by: own)
            #expect(shown.startedHere == nil && shown.verifiedAI == nil)
            #expect(ConsentSheet.title(shown) == "Allow an app on this computer to use your notes?" || !r.loopback)
            #expect(ConsentSheet.detail(shown).contains("doesn\u{2019}t recognize this app. It calls itself Codex."))
        }
        #expect(ConnectOwnSignIn.mark(Self.request(), by: nil).startedHere == nil, "nothing started here")
    }

    @Test func theSignInIsRecognizedOnlyWhileItRuns() {
        let at = Date.now.addingTimeInterval(-ConnectOwnSignIn.lasts - 1)
        let old = ConnectOwnSignIn(ai: "Codex", authorization: ConnectOwnSignIn.authorization(in: Self.codexPrinted)!, at: at)!
        #expect(ConnectOwnSignIn.mark(Self.request(), by: old).startedHere == nil, "Codex stopped waiting after ten minutes")
    }

    @Test func theServerCantSayItWasStartedHere() throws {
        let json = #"{"id":"5a0f6c1e-2b1d-4c36-9e0a-6b6f0c1a2b3c","client_name":"127.0.0.1","redirect_host":"127.0.0.1","loopback":true,"wants_write":true,"startedHere":"Codex"}"#
        let r = try AnyJSON.decoder.decode(ConnectRequest.self, from: Data(json.utf8))
        #expect(r.startedHere == nil && r.verifiedAI == nil)
    }

    // MARK: One request, one sheet

    private func quietCenter() -> ConnectCenter {
        let c = ConnectCenter()
        #if os(macOS)
        c.activate = {}
        #endif
        return c
    }

    private func link(_ id: UUID, scan: Bool = false) -> URL {
        URL(string: "ambernotes://connect?request=\(id.uuidString.lowercased())\(scan ? "#s=AbCdEfGhIjKlMnOpQrSt_-&k=AAAA" : "")")!
    }

    @Test func aRequestAnsweredHereNeverOpensASecondSheet() {
        let center = quietCenter()
        let id = UUID()
        center.receive(link(id))
        #expect(center.pending == id)
        center.receive(link(id, scan: true))
        #expect(center.pending == id && center.queue.isEmpty, "the page's button pressed again while it shows")
        center.answering(id)
        center.sheetClosed()
        center.receive(link(id))
        center.showNext()
        #expect(center.pending == nil && center.queue.isEmpty, "the same request after it was answered")
        center.offer(ConnectAsk(request_id: id, browser_key: "", started_from: "Chrome on a Mac", created_at: .now,
                                expires_at: .now.addingTimeInterval(600)))
        center.showAsk(id)
        #expect(center.pending == nil, "nor as an ask, or from its notification")
    }

    @Test func aRequestClosedWithoutAnAnswerCanBeOpenedAgain() {
        let center = quietCenter()
        let id = UUID()
        center.receive(link(id))
        center.sheetClosed()
        center.receive(link(id))
        #expect(center.pending == id, "the person pressed Open Pinto Notes again")
    }

    // MARK: The row and the one sign-in

    #if os(macOS)
    /// Records what the run asked of the shell, and what the row said at the time.
    final class Shell: @unchecked Sendable {
        var signIns: [ConnectAISection.Guide] = []
        var adds = 0
        var lineAtSignIn: String?
    }

    /// The sign-in is answered as soon as it prints the address it opens, while it keeps running.
    @Test func aSignInIsAnsweredWhenItPrintsTheAddress() async throws {
        let printed = Self.codexPrinted.replacingOccurrences(of: "`", with: "")
        let clock = ContinuousClock(), start = clock.now
        let launch = await ConnectShell.launch("printf '%s' \"$PRINTED\"; sleep 8", env: ["PRINTED": printed])
        #expect(launch == .opened(ConnectOwnSignIn.authorization(in: Self.codexPrinted)))
        #expect(clock.now - start < .seconds(8), "not waiting for it to end")
        let failed = await ConnectShell.launch("echo not-found; exit 127", env: [:])
        guard case .exited(127, let text) = failed else { Issue.record("\(failed)"); return }
        #expect(text.contains("not-found"))
    }

    @Test func codexSaysTheBrowserOpensThenSignsInOnce() async throws {
        let center = ConnectCenter.shared
        center.ownSignIn = nil
        let shell = Shell()
        let run = ConnectRun()
        run.address = "https://mcp.pintonotes.com"  // no path: signs in through the browser
        run.browserNotice = .milliseconds(50)
        let printed = ConnectOwnSignIn.authorization(in: Self.codexPrinted)
        run.shell = .init(isAvailable: { true }, exists: { _ in true },
                          add: { _, _, _ in shell.adds += 1; return .added },
                          signIn: { g, _ in
                              await MainActor.run {
                                  shell.signIns.append(g)
                                  if case .waiting(let line) = run.phase { shell.lineAtSignIn = line }
                              }
                              return .opened(printed)
                          })
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        run.start(.codex, client: client, open: { _ in Issue.record("Codex opens the browser itself") })
        #expect(run.phase == .waiting(ConnectCopy.opensBrowser(.codex)), "said before anything runs")
        #expect(ConnectCopy.opensBrowser(.codex) == "Codex opens your browser to sign in. Then allow it here.")
        for _ in 0..<100 where run.phase != .waiting(ConnectCopy.allowInBrowser) { try await Task.sleep(for: .milliseconds(20)) }
        #expect(run.phase == .waiting(ConnectCopy.allowInBrowser))
        #expect(shell.signIns == [.codex], "one sign-in, so one request and one Allow")
        #expect(shell.adds == 0, "Codex's add is its sign-in; nothing runs a second one")
        #expect(shell.lineAtSignIn == ConnectCopy.opensBrowser(.codex), "the row said so before the browser opened")
        #expect(center.ownSignIn?.ai == "Codex" && center.ownSignIn?.state == "q6coy-SGV4u92eR5uSf_8g")
        run.stop()
        center.ownSignIn = nil
    }

    @Test func claudeCodeSaysTheBrowserOpensToo() async throws {
        let center = ConnectCenter.shared
        center.ownSignIn = nil
        let shell = Shell()
        let run = ConnectRun()
        run.address = "https://mcp.pintonotes.com"  // no path: signs in through the browser
        run.browserNotice = .zero
        run.claudeCodeOnly = { true }
        let printed = ConnectOwnSignIn.authorization(in: Self.claudeCodePrinted)
        run.shell = .init(isAvailable: { true }, exists: { _ in true }, add: { _, _, _ in .added },
                          signIn: { g, _ in
                              await MainActor.run {
                                  shell.signIns.append(g)
                                  if case .waiting(let line) = run.phase { shell.lineAtSignIn = line }
                              }
                              return .opened(printed)
                          })
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        run.start(.claude, client: client, open: { _ in })
        for _ in 0..<100 where run.phase != .waiting(ConnectCopy.allowInBrowser) { try await Task.sleep(for: .milliseconds(20)) }
        #expect(shell.signIns == [.claudeCode])
        #expect(shell.lineAtSignIn == "Claude Code opens your browser to sign in. Then allow it here.")
        #expect(center.ownSignIn?.ai == "Claude Code")
        run.stop()
        center.ownSignIn = nil
    }
    #endif
}
