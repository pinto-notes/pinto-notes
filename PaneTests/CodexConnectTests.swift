import Foundation
import Supabase
import Testing
@testable import Pane

/// Connecting Codex (or Claude Code) from Connect an AI on the Mac, as Emil did on 13 October 2026:
/// the row says the browser is about to open, one sign-in runs, the Allow sheet names the AI it
/// started, and one request shows one sheet.
#if os(macOS)
private extension Process {
    /// Runs a program to its end; what it printed.
    @discardableResult static func run(_ path: String, _ args: [String]) -> String {
        let p = Process(), out = Pipe()
        p.executableURL = URL(fileURLWithPath: path)
        p.arguments = args
        p.standardOutput = out
        p.standardError = FileHandle.nullDevice
        guard (try? p.run()) != nil else { return "" }
        p.waitUntilExit()
        return String(decoding: out.fileHandleForReading.readDataToEndOfFile(), as: UTF8.self)
    }
}
#endif

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
        #expect(line == "You started connecting Codex on this Mac. The notes Codex opens, with their text and files, are sent to OpenAI and handled under OpenAI\u{2019}s privacy policy. Locked notes stay private.")
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
        var tokenAdds: [ConnectAISection.Guide] = []
        var tokens: [String] = []
        var tokensMade: [String] = []
        var dropped: [String] = []
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

    /// A run that makes no real token and runs no real command.
    private func run(_ shell: Shell, addToken: ConnectShell.TokenAdd, claudeCodeOnly: Bool = false) -> (ConnectRun, SupabaseClient) {
        let run = ConnectRun()
        run.address = "https://mcp.pintonotes.com"
        run.browserNotice = .milliseconds(50)
        run.claudeCodeOnly = { claudeCodeOnly }
        run.makeToken = { _, name in shell.tokensMade.append(name); return "pane_test" }
        run.dropToken = { _, name, _ in shell.dropped.append(name) }
        let printed = ConnectOwnSignIn.authorization(in: Self.codexPrinted)
        run.shell = .init(isAvailable: { true }, exists: { _ in true },
                          add: { _, _, _ in shell.adds += 1; return .added },
                          signIn: { g, _ in
                              await MainActor.run {
                                  shell.signIns.append(g)
                                  if case .waiting(let line) = run.phase { shell.lineAtSignIn = line }
                              }
                              return .opened(printed)
                          },
                          addToken: { g, _, token in
                              await MainActor.run { shell.tokenAdds.append(g); shell.tokens.append(token) }
                              return addToken
                          })
        return (run, SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test"))
    }

    private func settle(_ done: () -> Bool) async throws {
        for _ in 0..<150 where !done() { try await Task.sleep(for: .milliseconds(20)) }
    }

    /// Pressing Codex adds it with a token made here: no browser, no Allow, and the row says what
    /// Codex itself lists for it.
    @Test func codexIsAddedWithATokenAndNoBrowser() async throws {
        let shell = Shell()
        let details = "pinto-notes\n  url: https://mcp.pintonotes.com\n  http_headers: Authorization=*****"
        let (run, client) = run(shell, addToken: .added(details: details))
        run.start(.codex, client: client, open: { _ in Issue.record("nothing opens") })
        #expect(run.phase == .waiting(ConnectCopy.adding(.codex)))
        try await settle { if case .added = run.phase { true } else { false } }
        #expect(run.phase == .added("Added to Codex. Ask it about your notes to finish.", details: details))
        #expect(shell.tokensMade == [ConnectCopy.tokenName(.codex)] && shell.tokenAdds == [.codex] && shell.tokens == ["pane_test"])
        #expect(shell.signIns.isEmpty && shell.adds == 0, "no sign-in, no browser")
        run.stop()
    }

    /// A Codex too old to take the token: its token goes, and it signs in through the browser,
    /// once, after the row says so.
    @Test func anOldCodexSignsInThroughTheBrowserOnce() async throws {
        let center = ConnectCenter.shared
        center.ownSignIn = nil
        let shell = Shell()
        let (run, client) = run(shell, addToken: .refused)
        run.start(.codex, client: client, open: { _ in Issue.record("Codex opens the browser itself") })
        try await settle { run.phase == .waiting(ConnectCopy.allowInBrowser) }
        #expect(run.phase == .waiting(ConnectCopy.allowInBrowser))
        #expect(ConnectCopy.opensBrowser(.codex) == "Codex opens your browser to sign in. Then allow it here.")
        #expect(shell.dropped == [ConnectCopy.tokenName(.codex)], "the token it couldn't take is revoked")
        #expect(shell.signIns == [.codex], "one sign-in, so one request and one Allow")
        #expect(shell.adds == 0, "Codex's add is its sign-in; nothing runs a second one")
        #expect(shell.lineAtSignIn == ConnectCopy.opensBrowser(.codex), "the row said so before the browser opened")
        #expect(center.ownSignIn?.ai == "Codex" && center.ownSignIn?.state == "q6coy-SGV4u92eR5uSf_8g")
        run.stop()
        center.ownSignIn = nil
    }

    /// In first run (Try it comes next) the row only says it was added, and tells the view around
    /// it at once, so Continue shows before Codex's first call. Elsewhere it asks for a try.
    @Test func inFirstRunTheRowSaysAddedAndContinueCanShow() async throws {
        for asks in [false, true] {
            let shell = Shell()
            let (run, client) = run(shell, addToken: .added(details: "pinto-notes"))
            run.asksToFinish = asks
            var told: [ConnectAISection.Guide] = []
            run.added = { told.append($0) }
            run.start(.codex, client: client, open: { _ in })
            try await settle { if case .added = run.phase { true } else { false } }
            #expect(run.phase == .added(asks ? "Added to Codex. Ask it about your notes to finish." : "Added to Codex.", details: "pinto-notes"))
            #expect(told == [.codex], "the view around it hears at once, before the first call")
            run.stop()
        }
    }

    /// Claude straight to Claude Code: the same token route, as Claude Code.
    @Test func claudeCodeIsAddedWithATokenToo() async throws {
        let shell = Shell()
        let (run, client) = run(shell, addToken: .added(details: "pinto-notes:\n  Status: \u{2714} Connected"), claudeCodeOnly: true)
        run.start(.claude, client: client, open: { _ in })
        try await settle { if case .added = run.phase { true } else { false } }
        #expect(shell.tokenAdds == [.claudeCode] && shell.tokensMade == [ConnectCopy.tokenName(.claudeCode)] && shell.signIns.isEmpty)
        if case .added(let line, _) = run.phase { #expect(line == "Added to Claude Code. Ask it about your notes to finish.") }
        run.stop()
    }

    /// A token is named for the Mac it's on, connects its own row, and fits the server's 80 characters.
    @Test func aTokenIsNamedForThisMac() {
        #expect(ConnectCopy.tokenName(.codex, device: "Emil\u{2019}s MacBook Pro") == "Codex on Emil\u{2019}s MacBook Pro")
        let long = AddDeviceNames.clean(String(repeating: "M", count: 200))
        #expect(ConnectCopy.tokenName(.claudeCode, device: long).count <= 80)
        func row(_ name: String) -> Connection {
            Connection(id: UUID(), name: name, kind: "token", can_write: true, created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: nil)
        }
        let since = Date.now.addingTimeInterval(-60)
        #expect(TerminalConnect.isConnected([row("Codex on Studio")], guide: .codex, way: .token, since: since))
        #expect(!TerminalConnect.isConnected([row("Claude Code on Studio")], guide: .codex, way: .token, since: since))
        #expect(ConnectRun.owner(of: row("Codex on Studio")) == .codex)
    }

    /// What the command printed is shown in its own words, never with the token, never coloured.
    @Test func theDetailsAreTheCommandsOwnWordsWithoutTheToken() {
        let out = "Added HTTP MCP server\n\(ConnectShell.detailsMark)\n\npinto-notes:\n  Status: \u{1B}[32m\u{2714} Connected\u{1B}[39m\n  Headers:\n    Authorization: Bearer pane_secret123\n\n"
        let shown = ConnectShell.details(out, token: "pane_secret123")
        #expect(shown == "pinto-notes:\n  Status: \u{2714} Connected\n  Headers:\n    Authorization: Bearer \(TerminalConnect.hidden)")
        #expect(ConnectShell.details("no mark here", token: "x") == nil, "nothing listed: not added")
        for g in [ConnectAISection.Guide.codex, .claudeCode] {
            let script = ConnectShell.tokenScript(g)
            #expect(script.contains("$PINTO_TOKEN") && !script.contains("pane_"), "the token only from the environment")
        }
        #expect(ConnectShell.tokenScript(.codex).contains("chmod 600"))
    }

    /// The real Codex, when this Mac has it, in a Codex home and a keychain of its own: the
    /// entry it can read, the token in the keychain and not in config.toml, the helper Codex runs
    /// handing it over, and the token nowhere in what's shown. (End to end, on 13 October 2026:
    /// `codex app-server`'s mcpServerStatus/list against a local server got "Authorization: Bearer
    /// <token>" on initialize and tools/list through this helper.)
    @Test func theRealCodexTakesTheToken() async throws {
        guard await ConnectShell.exists(.codex) else { return }
        let home = FileManager.default.temporaryDirectory.appending(path: "pinto-codex-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: home, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: home) }
        let keychain = home.appending(path: "test.keychain-db").path
        let made = await ConnectShell.launch("/usr/bin/security create-keychain -p test '\(keychain)' && /usr/bin/security unlock-keychain -p test '\(keychain)'", env: [:])
        guard case .exited(0, _) = made else { Issue.record("no keychain: \(made)"); return }
        defer { _ = Process.run("/usr/bin/security", ["delete-keychain", keychain]) }
        setenv("CODEX_HOME", home.path, 1)
        setenv("PINTO_KEYCHAIN", keychain, 1)
        defer { unsetenv("CODEX_HOME"); unsetenv("PINTO_KEYCHAIN") }
        let token = "pane_" + UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
        let result = await ConnectShell.addToken(.codex, server: "https://mcp.example.com", token: token)
        guard case .added(let details) = result else { Issue.record("\(result)"); return }
        #expect(details.contains("url: https://mcp.example.com") && details.contains("http_headers_helper: <redacted>"))
        #expect(!details.contains(token))
        let config = home.appending(path: "config.toml")
        #expect(!(try String(contentsOf: config, encoding: .utf8)).contains(token), "no secret in config.toml")
        let mode = try FileManager.default.attributesOfItem(atPath: config.path)[.posixPermissions] as? Int
        #expect(mode == 0o600)
        #expect(!FileManager.default.fileExists(atPath: config.path + ".pinto-before"))
        let helper = home.appending(path: "pinto-notes-token.sh").path
        #expect(Process.run("/bin/sh", [helper]) == "{\"Authorization\":\"Bearer \(token)\"}")
        // Pressed again: one entry, and the helper hands over the new token.
        let again = await ConnectShell.addToken(.codex, server: "https://mcp.example.com", token: token + "2")
        #expect(again != .refused)
        let text = try String(contentsOf: config, encoding: .utf8)
        #expect(text.components(separatedBy: "[mcp_servers.pinto-notes]").count == 2)
        #expect(Process.run("/bin/sh", [helper]) == "{\"Authorization\":\"Bearer \(token)2\"}")
    }
    #endif
}
