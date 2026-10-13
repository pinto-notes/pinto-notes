import Supabase
import SwiftUI

/// One thing to pick from a short list of large choices: a place notes come from, or an AI.
struct BigChoice: Identifiable {
    enum Mark { case symbol(String), ai(String), origin(ImportOrigin) }
    let id: String
    let title: String
    let detail: String
    let mark: Mark
    /// Done already (an AI that is connected): a green check takes the chevron's place.
    var done = false
    var hint: String? = nil
    let action: () -> Void
}

/// Large choices, one design wherever they appear: the first-run flow's two choice steps and
/// Connect an AI. Wide rows: the mark, the name over one plain line.
struct BigChoices: View {
    let list: [BigChoice]
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.isEnabled) private var isEnabled

    var body: some View {
        VStack(spacing: Metrics.gap) { ForEach(list) { row($0) } }
            .opacity(isEnabled ? 1 : 0.5)
    }

    /// A wide row: the mark, the name over one line about it, and a chevron (a check once done).
    private func row(_ choice: BigChoice) -> some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous)
        let words = VStack(alignment: .leading, spacing: 2) {
            Text(choice.title).font(Metrics.title).foregroundStyle(Color.ink)
            Text(choice.detail).font(Metrics.detail).foregroundStyle(Color.muted)
        }
        .multilineTextAlignment(.leading)
        .fixedSize(horizontal: false, vertical: true)
        return Button(action: choice.action) {
            Group {
                if typeSize.isAccessibilitySize {
                    // The largest text sizes: the mark over the words, which get the row's width.
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            mark(choice.mark, size: Metrics.rowMark)
                            Spacer(minLength: 8)
                            trailing(choice)
                        }
                        words
                    }
                } else {
                    HStack(spacing: 12) {
                        mark(choice.mark, size: Metrics.rowMark)
                        words
                        Spacer(minLength: 8)
                        trailing(choice)
                    }
                }
            }
            .padding(.horizontal, Metrics.padding)
            .padding(.vertical, Metrics.rowPadding)
            .frame(maxWidth: .infinity, minHeight: Metrics.rowHeight, alignment: .leading)
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
            .hoverOverlay(shape, Color.primary.opacity(0.05))
            .contentShape(shape)
        }
        .buttonStyle(BigChoicePress())
        .modifier(Said(choice: choice))
    }

    /// What VoiceOver and tests see: one button, named by its words.
    private struct Said: ViewModifier {
        let choice: BigChoice
        func body(content: Content) -> some View {
            content
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("\(choice.title). \(choice.detail)")
                .accessibilityHint(choice.hint ?? "")
                .accessibilityAddTraits(.isButton)
                .accessibilityIdentifier(choice.id)
        }
    }

    @ViewBuilder private func trailing(_ choice: BigChoice) -> some View {
        if choice.done {
            check
        } else {
            Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary)
        }
    }

    private var check: some View {
        Image(systemName: "checkmark.circle.fill")
            .font(.system(size: Metrics.check, weight: .semibold))
            .foregroundStyle(.white, Color.green)
            .accessibilityHidden(true)
    }

    /// An AI's own mark on its white tile; a source's symbol on a quiet tile of the same size.
    @ViewBuilder private func mark(_ mark: BigChoice.Mark, size: CGFloat) -> some View {
        switch mark {
        case .ai(let ai):
            AITile(ai: ai, size: size)
        case .origin(let origin):
            // The app's own icon when it is installed (from NSWorkspace: nothing is asked of it).
            ImportSourceIcon(origin: origin, size: size)
        case .symbol(let name):
            Image(systemName: name)
                .font(.system(size: size * 0.46, weight: .medium))
                .foregroundStyle(Color.amberInk)
                .frame(width: size, height: size)
                .background(.fill.tertiary, in: .rect(cornerRadius: size * 0.3, style: .continuous))
                .accessibilityHidden(true)
        }
    }

    enum Metrics {
        #if os(macOS)
        static let title = Font.system(size: 14, weight: .semibold)
        static let detail = Font.system(size: 12)
        static let gap: CGFloat = 8
        static let radius: CGFloat = 10
        static let padding: CGFloat = 12
        static let rowPadding: CGFloat = 8
        static let rowHeight: CGFloat = 52
        static let rowMark: CGFloat = 32
        static let check: CGFloat = 16
        #else
        static let title = Font.body.weight(.semibold)
        static let detail = Font.subheadline
        static let gap: CGFloat = 10
        static let radius: CGFloat = 14
        static let padding: CGFloat = 16
        static let rowPadding: CGFloat = 10
        static let rowHeight: CGFloat = 64
        static let rowMark: CGFloat = 40
        static let check: CGFloat = 20
        #endif
    }
}

/// A big choice dips a little when pressed (the app's `PressScale` is sized for small buttons).
private struct BigChoicePress: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.snappy(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: Finding the AIs

/// Which AIs are on this device, asking nothing of the person: no dialog, no permission.
/// Mac: installed apps by bundle id (Launch Services), and the `claude` and `codex` commands as
/// files where their installers put them. iPhone: the apps' link schemes, declared in
/// LSApplicationQueriesSchemes, which shows nothing either. A sandboxed build can't see the
/// commands (they live outside its container), so there Codex counts only as an app.
@MainActor
enum ConnectFinder {
    typealias Guide = ConnectAISection.Guide

    #if os(macOS)
    static let claudeApp = "com.anthropic.claudefordesktop"
    static let apps: [(Guide, String)] = [(.chatgpt, "com.openai.chat"), (.claude, claudeApp), (.codex, "com.openai.codex")]
    static let commands: [(Guide, String)] = [(.claude, "claude"), (.codex, "codex")]

    /// Where installers put the commands. An app started from the Dock has a short PATH, so the
    /// usual places are looked at too.
    static func places() -> [String] {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        let path = (ProcessInfo.processInfo.environment["PATH"] ?? "").split(separator: ":").map(String.init)
        return path + ["/opt/homebrew/bin", "/usr/local/bin", "\(home)/.local/bin", "\(home)/.claude/local",
                       "\(home)/.npm-global/bin", "\(home)/.bun/bin", "\(home)/.volta/bin"]
    }

    static func hasApp(_ id: String) -> Bool { NSWorkspace.shared.urlForApplication(withBundleIdentifier: id) != nil }

    static func hasCommand(_ name: String) -> Bool {
        places().contains { FileManager.default.isExecutableFile(atPath: "\($0)/\(name)") }
    }

    private static func look() -> [Guide] {
        var out: Set<Guide> = []
        for (g, id) in apps where hasApp(id) { out.insert(g) }
        for (g, name) in commands where hasCommand(name) { out.insert(g) }
        return Guide.allCases.filter(out.contains)
    }

    /// Claude Code without the Claude app: Claude is then added to Claude Code directly (a
    /// hidden `claude mcp add`), on a claude.ai login and on an API key alike. With the app there
    /// too, Claude's connector covers both (code.claude.com/docs/en/mcp).
    static func claudeCodeOnly() -> Bool {
        ConnectShell.isAvailable && !hasApp(claudeApp) && hasCommand("claude")
    }
    #else
    static let schemes: [(Guide, String)] = [(.chatgpt, "chatgpt://"), (.claude, "claude://")]

    private static func look() -> [Guide] {
        schemes.filter { UIApplication.shared.canOpenURL(URL(string: $0.1)!) }.map(\.0)
    }

    static func claudeCodeOnly() -> Bool { false }
    #endif

    /// Tests: what counts as found, in place of looking.
    static var fixed: [Guide]?
    private static var last: [Guide]?

    /// Looks again (on each appearance), and remembers it for `known`.
    static func found() -> [Guide] {
        let now = fixed ?? look()
        last = now
        return now
    }

    /// What the last look found (looking now if there was none), for a list's first frame: rows
    /// that change after it appears move in the middle of the step's transition.
    static var known: [Guide] { last ?? found() }
}

// MARK: Connecting one

/// One AI being connected: what was started, what the row says while the other side works, and
/// watching for the new connection. Every step of a connection passes through here (start,
/// waiting, connected, failed), so this is the one place that knows where a connection is.
@MainActor
@Observable
final class ConnectRun {
    typealias Guide = ConnectAISection.Guide
    enum Phase: Equatable { case waiting(String), failed(String, fix: String) }

    private(set) var guide: Guide?
    private(set) var phase: Phase?
    /// Claude went straight to Claude Code (only the command is on this Mac).
    private(set) var direct = false
    private(set) var since = Date.now
    @ObservationIgnored private var watching: Task<Void, Never>?
    @ObservationIgnored private var expecting = false
    /// Told when the connection exists, so the list loads again.
    @ObservationIgnored var connected: (Guide) -> Void = { _ in }
    #if os(macOS)
    /// Claude Code's and Codex's commands, and the address; tests give their own.
    @ObservationIgnored var shell = ConnectShell.Steps.live
    @ObservationIgnored var claudeCodeOnly: @MainActor () -> Bool = ConnectFinder.claudeCodeOnly
    #endif
    @ObservationIgnored var address: String?

    var server: String { address ?? BackendConfig.mcpPublicURL?.absoluteString ?? "" }

    /// The press on an AI's row.
    func start(_ g: Guide, client: SupabaseClient, open: @escaping (URL) -> Void) {
        // Trying the same AI again isn't giving up on it.
        stop(givingUp: guide != g)
        guide = g
        since = .now.addingTimeInterval(-5)
        #if os(macOS)
        direct = g == .claude && claudeCodeOnly()
        #else
        direct = false
        #endif
        if let ai = funnelAI {
            ConnectFunnel.opened(ai)
            ConnectFunnel.started(ai)
        }
        expect()
        #if os(macOS)
        switch g {
        case .chatgpt:
            ConnectClipboard.set(server)
            open(WebConnectPlan.chatgpt.setupPage(server: server))
            wait(client, ConnectCopy.waiting(.chatgpt))
        case .claude:
            if direct {
                add(.claudeCode, client: client)
            } else {
                open(WebConnectPlan.directoryListing)
                wait(client, ConnectCopy.waiting(.claude))
            }
        case .claudeCode, .codex:
            add(g, client: client)
        case .other, .incredible:
            ConnectClipboard.set(server)
            wait(client, ConnectCopy.waiting(.other))
        }
        #else
        if g == .other {
            ConnectClipboard.set(server)
            wait(client, ConnectCopy.waiting(.other))
        } else {
            // The link went to the computer (ShareLink): it finishes there, and shows here too.
            wait(client, ConnectCopy.onComputer)
        }
        #endif
    }

    /// The fix a failed row offers.
    func fix(client: SupabaseClient, open: @escaping (URL) -> Void) {
        guard let g = guide else { return }
        if case .failed(_, let fix) = phase, fix == ConnectCopy.getCodex {
            open(ConnectCopy.codexPage)
            return
        }
        start(g, client: client, open: open)
    }

    /// The row stops: the sheet closed, or another row was pressed. `givingUp`: the connect funnel
    /// hears that it was given up on, when it was started and isn't connected.
    func stop(givingUp: Bool = true) {
        watching?.cancel()
        watching = nil
        if expecting { ConnectCenter.shared.stopExpectingAsks(); expecting = false }
        if givingUp, let ai = funnelAI { ConnectFunnel.closed(ai) }
        guide = nil
        phase = nil
    }

    /// The AI as the connect funnel names it: Claude straight to Claude Code is Claude Code.
    private var funnelAI: ConnectAIKind? { guide.map { direct ? .claudeCode : $0.funnel } }

    private func expect() {
        if !expecting { ConnectCenter.shared.expectAsks(); expecting = true }
    }

    private func wait(_ client: SupabaseClient, _ line: String) {
        phase = .waiting(line)
        if let ai = funnelAI { ConnectFunnel.waiting(ai) }
        guard let g = guide else { return }
        let since = since
        watching?.cancel()
        watching = Task { [weak self] in
            while !Task.isCancelled {
                let here = ConnectCenter.shared.approved.map { $0.at >= since && ConnectRun.approvalCounts($0.ai, for: g) } ?? false
                if let rows: [Connection] = try? await client.from("mcp_tokens").select().order("created_at", ascending: false).limit(20).execute().value,
                   ConnectRun.isNew(rows, for: g, since: since) || here {
                    self?.done(g)
                    return
                }
                try? await Task.sleep(for: .seconds(here ? 1 : 3))
            }
        }
    }

    /// An access token: connected at its first call.
    private func waitForToken(_ client: SupabaseClient, _ ai: Guide, _ line: String) {
        phase = .waiting(line)
        if let kind = funnelAI { ConnectFunnel.waiting(kind) }
        guard let g = guide else { return }
        let since = since
        watching?.cancel()
        watching = Task { [weak self] in
            while !Task.isCancelled {
                if let rows: [Connection] = try? await client.from("mcp_tokens").select().order("created_at", ascending: false).limit(20).execute().value,
                   TerminalConnect.isConnected(rows, guide: ai, way: .token, since: since) {
                    self?.done(g)
                    return
                }
                try? await Task.sleep(for: .seconds(3))
            }
        }
    }

    /// Connected. Internal for tests: the app gets here from the server's list.
    func done(_ g: Guide) {
        if let ai = funnelAI { ConnectFunnel.connected(ai) }
        stop()
        connected(g)
    }

    private func fail(_ line: String, fix: String) {
        watching?.cancel()
        phase = .failed(line, fix: fix)
        if let ai = funnelAI { ConnectFunnel.failed(ai, .other) }
    }

    /// Claude Code or Codex: Pinto Notes adds itself with their own command, out of sight, and
    /// starts their sign-in, which opens our page in the browser; Allow happens in Pinto Notes.
    private func add(_ g: Guide, client: SupabaseClient) {
        let ai = g == .codex ? Guide.codex : .claudeCode
        #if os(macOS)
        guard shell.isAvailable() else {
            // A sandboxed build can't start a shell: the command is copied for Terminal instead.
            ConnectClipboard.set(ConnectShell.command(ai, server: server))
            wait(client, ConnectCopy.pasteInTerminal)
            return
        }
        phase = .waiting(ConnectCopy.adding(ai))
        let server = server
        // At an address with a path (staging, a local stack) the AI can't sign in through the
        // browser, so it gets an access token instead (see TerminalConnect).
        let way = TerminalConnect.way(server: server)
        // The row that was pressed: Claude's, when Claude goes straight to Claude Code.
        let pressed = guide
        let shell = shell
        Task { [weak self] in
            guard await shell.exists(ai) else {
                self?.fail(ConnectCopy.notOnThisMac(ai), fix: ai == .codex ? ConnectCopy.getCodex : ConnectCopy.tryAgain)
                return
            }
            var token: String?
            if way == .token {
                if ai == .codex {
                    // Codex takes a token only in its config file: copied, to paste there.
                    guard let t = try? await ConnectTokens.create(client, name: ai.title, write: true, make: { try AccountCrypto.shared.accessToken() }) else {
                        self?.fail(ConnectCopy.refused(ai), fix: ConnectCopy.tryAgain); return
                    }
                    ConnectClipboard.set(ConnectSnippets.codex(url: server, token: t))
                    self?.waitForToken(client, ai, ConnectCopy.pasteInCodexConfig)
                    return
                }
                token = try? await ConnectTokens.create(client, name: ai.title, write: true, make: { try AccountCrypto.shared.accessToken() })
                if token == nil { self?.fail(ConnectCopy.refused(ai), fix: ConnectCopy.tryAgain); return }
            }
            let result = await shell.add(ai, server, token)
            guard let self, self.guide == pressed else { return }
            switch result {
            case .added where token != nil:
                self.waitForToken(client, ai, ConnectCopy.askIt(ai))
            case .added:
                shell.signIn(ai)
                self.wait(client, ConnectCopy.allowInBrowser)
            case .notFound:
                self.fail(ConnectCopy.notOnThisMac(ai), fix: ai == .codex ? ConnectCopy.getCodex : ConnectCopy.tryAgain)
            case .refused:
                self.fail(ConnectCopy.refused(ai), fix: ConnectCopy.tryAgain)
            }
        }
        #endif
    }

    /// A new connection for this AI, made since the press.
    nonisolated static func isNew(_ rows: [Connection], for g: Guide, since: Date) -> Bool {
        let fresh = rows.filter { $0.revoked_at == nil && $0.created_at >= since }
        switch g {
        case .chatgpt, .claude:
            if fresh.contains(where: { owner(of: $0) == g }) { return true }
            // Claude straight to Claude Code: a sign-in from this computer.
            return g == .claude && fresh.contains { $0.isOAuth && Connection.isLoopback($0.redirect_host ?? "") }
        case .claudeCode, .codex:
            return fresh.contains { $0.isOAuth && Connection.isLoopback($0.redirect_host ?? "") }
        case .other, .incredible:
            return !fresh.isEmpty
        }
    }

    /// An approval made on this device that finishes this AI's wait. The consent sheet reports the
    /// AI it could vouch for (ChatGPT, Claude); anything else reports none.
    nonisolated static func approvalCounts(_ ai: String?, for g: Guide) -> Bool {
        switch g {
        case .chatgpt: ai == "ChatGPT"
        case .claude: ai == "Claude" || ai == nil
        default: ai == nil
        }
    }

    /// Which row a connection belongs to. ChatGPT and Claude by where the approval went; others
    /// by the name they gave (shown as a hint on the row, never trusted for anything else).
    nonisolated static func owner(of c: Connection) -> Guide {
        if c.isOAuth, let ai = ConnectTrust.verifiedAI(host: c.redirect_host ?? "", loopback: false) {
            return ai == "ChatGPT" ? .chatgpt : ai == "Claude" ? .claude : .other
        }
        let n = c.name.lowercased()
        if n.contains("codex") { return .codex }
        if n.contains("claude") { return .claude }
        if n.contains("incredible") { return .incredible }
        return .other
    }
}

#if os(macOS)
/// Runs Claude Code's and Codex's own commands in the person's login shell (a GUI app doesn't see
/// their PATH). Outside the sandbox only: a sandboxed app can't start a shell.
enum ConnectShell {
    static var isAvailable: Bool { ProcessInfo.processInfo.environment["APP_SANDBOX_CONTAINER_ID"] == nil }

    enum Result: Equatable { case added, notFound, refused }

    /// What a connection asks of the shell, so tests can stand in for it.
    struct Steps: Sendable {
        var isAvailable: @Sendable () -> Bool
        var exists: @Sendable (ConnectAISection.Guide) async -> Bool
        var add: @Sendable (ConnectAISection.Guide, String, String?) async -> Result
        var signIn: @Sendable (ConnectAISection.Guide) -> Void

        static let live = Steps(isAvailable: { ConnectShell.isAvailable }, exists: { await ConnectShell.exists($0) },
                                add: { await ConnectShell.add($0, server: $1, token: $2) }, signIn: { ConnectShell.signIn($0) })
    }

    static func tool(_ g: ConnectAISection.Guide) -> String { g == .codex ? "codex" : "claude" }

    /// Adds the server under its name, replacing an entry made before (under this name or the
    /// old one), so nobody ends up with the same notes listed twice.
    static func addScript(_ g: ConnectAISection.Guide) -> String {
        let name = ConnectSnippets.serverName, old = ConnectSnippets.oldServerName
        return g == .codex ? """
            command -v codex >/dev/null 2>&1 || { echo "not-found"; exit 127; }
            codex mcp remove \(old) >/dev/null 2>&1
            codex mcp remove \(name) >/dev/null 2>&1
            codex mcp add \(name) --url "$PINTO_URL"
            """ : """
            command -v claude >/dev/null 2>&1 || { echo "not-found"; exit 127; }
            claude mcp remove --scope user \(old) >/dev/null 2>&1
            claude mcp remove --scope user \(name) >/dev/null 2>&1
            claude mcp add --scope user --transport http \(name) "$PINTO_URL"
            """
    }

    /// The same, as one line for Terminal (Having trouble?, and the sandboxed build).
    static func command(_ g: ConnectAISection.Guide, server: String) -> String {
        let name = ConnectSnippets.serverName
        return g == .codex ? "codex mcp add \(name) --url \(server) && codex mcp login \(name)"
            : "claude mcp add --scope user --transport http \(name) \(server) && claude mcp login \(name)"
    }

    /// Whether the person's shell finds the command.
    static func exists(_ g: ConnectAISection.Guide) async -> Bool {
        await run("command -v \(tool(g))", env: [:], waits: true).0 == 0
    }

    static func add(_ g: ConnectAISection.Guide, server: String, token: String? = nil) async -> Result {
        var script = addScript(g)
        if token != nil { script += " --header \"Authorization: Bearer $PINTO_TOKEN\"" }
        let (status, text) = await run(script, env: ["PINTO_URL": server, "PINTO_TOKEN": token ?? ""], waits: true)
        if status == 0 { return .added }
        return text.contains("not-found") ? .notFound : .refused
    }

    /// Starts the AI's sign-in: it opens our page in the browser and waits for the answer, so it
    /// isn't waited for here. It is stopped after ten minutes if nothing came.
    static func signIn(_ g: ConnectAISection.Guide) {
        Task { _ = await run("\(tool(g)) mcp login \(ConnectSnippets.serverName)", env: [:], waits: false) }
    }

    /// A sign-in left running, stopped later from another task.
    private final class Running: @unchecked Sendable {
        private let process: Process
        init(_ process: Process) { self.process = process }
        func stop() { if process.isRunning { process.terminate() } }
    }

    private static func run(_ script: String, env: [String: String], waits: Bool) async -> (Int32, String) {
        await Task.detached {
            let p = Process()
            p.executableURL = URL(fileURLWithPath: ProcessInfo.processInfo.environment["SHELL"] ?? "/bin/zsh")
            p.arguments = ["-l", "-i", "-c", script]
            p.environment = ProcessInfo.processInfo.environment.merging(env) { $1 }
            let out = Pipe()
            p.standardOutput = out
            p.standardError = out
            p.standardInput = FileHandle.nullDevice
            do { try p.run() } catch { return (Int32(-1), "") }
            guard waits else {
                let running = Running(p)
                Task.detached { try? await Task.sleep(for: .seconds(600)); running.stop() }
                return (0, "")
            }
            p.waitUntilExit()
            return (p.terminationStatus, String(data: out.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? "")
        }.value
    }
}
#endif

// MARK: The words

enum ConnectCopy {
    typealias Guide = ConnectAISection.Guide
    static let why = "Your AI can then read and write your notes when you ask it to."
    #if os(macOS)
    static let here = "On this Mac"
    #else
    static let here = "On this iPhone"
    #endif
    static let others = "Other AIs"
    static let trouble = "Having trouble?"
    static let connected = "Connected"

    static func waiting(_ g: Guide) -> String {
        switch g {
        case .chatgpt: "Finish on chatgpt.com. The link is copied."
        case .claude: "Finish in Claude: choose Connect."
        default: "Link copied. Paste it in your AI app."
        }
    }

    static let onComputer = "Finish on your computer. This shows when it\u{2019}s done."
    static let pasteInTerminal = "Command copied. Paste it in Terminal."
    static let allowInBrowser = "In your browser: choose Open Pinto Notes, then Allow."
    static let pasteInCodexConfig = "Copied. Paste it at the end of ~/.codex/config.toml."
    static func askIt(_ g: Guide) -> String { "Added. Ask \(g.title) about your notes." }
    static func adding(_ g: Guide) -> String { "Adding it to \(g.title)\u{2026}" }
    static func notOnThisMac(_ g: Guide) -> String { "\(g.title) isn\u{2019}t on this Mac yet." }
    static func refused(_ g: Guide) -> String { "\(g.title) didn\u{2019}t take it. Having trouble? has the command." }
    static let tryAgain = "Try Again"
    static let getCodex = "Get Codex"
    static let codexPage = URL(string: "https://chatgpt.com/codex")!
}

// MARK: The choices

/// Connect an AI, the same wherever it is offered (the first-run flow, Settings, the sheet the
/// sidebar card, the File menu and Make an App open): the AIs found on this device first, as large
/// choices; every other AI in a quiet list under them. Each row is the button that connects it,
/// says what that AI is for, then where to finish while the other side works, then Connected.
/// Nothing dims: after one is connected, every other stays there to press. The view around it has
/// the one orange button to go on (Continue, Done). Anything technical is behind Having trouble?.
struct ConnectChoices: View {
    typealias Guide = ConnectAISection.Guide
    let client: SupabaseClient
    /// The ways offered, in order.
    var guides: [Guide] = Guide.offered
    /// Settings: what is connected, each with Disconnect, under the choices.
    var listsConnected = true
    /// Captures: shows these instead of asking the server.
    var preview: [Connection]? = nil
    /// Captures: what counts as found on this device.
    var previewFound: [Guide]? = nil
    /// A short sheet (Make an App): no headings and no Having trouble? (Settings has both).
    var compact = false
    /// Tells the view around it what is connected, each time it has been asked again.
    var onLoaded: (Set<String>) -> Void = { _ in }

    @State private var connections: [Connection] = []
    @State private var removing: Connection?
    @State private var error: String?
    @State private var center = ConnectCenter.shared
    @State private var run = ConnectRun()
    @State private var found = ConnectFinder.known
    @Environment(ConnectGuideRoute.self) private var route: ConnectGuideRoute?
    @Environment(\.networkReach) private var reach
    @Environment(\.openURL) private var openURL
    @Environment(\.dynamicTypeSize) private var typeSize

    static let why = ConnectCopy.why

    private var active: [Connection] { (preview ?? connections).filter { $0.revoked_at == nil } }
    private var connectedGuides: Set<Guide> { Set(active.map(ConnectRun.owner(of:))) }
    private var shownFound: [Guide] { previewFound ?? found }
    /// On top: what is on this device; with nothing found, the two most people use.
    private var top: [Guide] {
        let here = guides.filter(shownFound.contains)
        return here.isEmpty ? guides.filter { [.chatgpt, .claude].contains($0) } : here
    }
    private var rest: [Guide] { guides.filter { !top.contains($0) } }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let ask = center.waiting().first {
                ConnectWaitingRow(ask: ask)
            }
            if !compact, !shownFound.filter(guides.contains).isEmpty { header(ConnectCopy.here) }
            VStack(spacing: Metrics.gap) { ForEach(top) { big($0) } }
            if let g = run.guide, top.contains(g) { fixButton }
            if !rest.isEmpty {
                if !compact { header(ConnectCopy.others).padding(.top, 10) }
                quietList.padding(.top, compact ? 2 : 0)
                if let g = run.guide, rest.contains(g) { fixButton }
            }
            if reach != .online {
                Text(OfflineCopy.needsNetwork("connect an AI")).font(.footnote).foregroundStyle(Color.muted)
            }
            if let error, reach == .online {
                Text(error).font(.footnote).foregroundStyle(.red)
            }
            if !compact {
                Button(ConnectCopy.trouble) { route?.help = HelpTopic(guide: run.guide) }
                    .buttonStyle(.hoverLink)
                    .font(Metrics.quiet)
                    .foregroundStyle(Color.muted)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 4)
                    .accessibilityIdentifier("connect.trouble")
            }
            if listsConnected, !active.isEmpty { connectedList.padding(.top, 8) }
        }
        .disabled(reach != .online)
        .onAppear {
            if previewFound == nil { found = ConnectFinder.found() }
            run.connected = { _ in Task { await load() } }
        }
        .onDisappear { run.stop() }
        // Asks again when a sheet over it closes and when back online.
        .task(id: "\(route?.closed ?? 0)\(reach == .online)") { await load() }
        .confirmationDialog("Disconnect \(removing?.title ?? "")?", isPresented: Binding(get: { removing != nil }, set: { if !$0 { removing = nil } }), titleVisibility: .visible) {
            Button("Disconnect", role: .destructive) { if let r = removing { Task { await revoke(r) } } }
        } message: {
            Text("It loses access to your notes right away.")
        }
    }

    private func header(_ text: String) -> some View {
        Text(text).font(Metrics.header).foregroundStyle(Color.muted).accessibilityAddTraits(.isHeader)
    }

    // MARK: Rows

    enum RowState: Equatable { case rest, waiting(String), failed(String), connected }

    private func state(_ g: Guide) -> RowState {
        if run.guide == g, let phase = run.phase {
            switch phase {
            case .waiting(let line): return .waiting(line)
            case .failed(let line, _): return .failed(line)
            }
        }
        return connectedGuides.contains(g) ? .connected : .rest
    }

    private func detail(_ g: Guide) -> String {
        switch state(g) {
        case .rest: g.line
        case .waiting(let line), .failed(let line): line
        case .connected: ConnectCopy.connected
        }
    }

    private func press(_ g: Guide) {
        if g == .incredible { route?.guide = .incredible; return }
        run.start(g, client: client) { openURL($0) }
    }

    private var anyConnected: Bool { !connectedGuides.isEmpty }

    /// The fix for a row that failed: the orange button while nothing is connected, else quiet,
    /// so Continue (or Done) stays the one orange control.
    @ViewBuilder private var fixButton: some View {
        if case .failed(_, let fix) = run.phase {
            if anyConnected {
                Button(fix) { run.fix(client: client) { openURL($0) } }
                    .buttonStyle(.hoverLink).font(Metrics.quiet).foregroundStyle(Color.amberInk)
                    .accessibilityIdentifier("connect.fix")
            } else {
                Button(fix) { run.fix(client: client) { openURL($0) } }
                    .buttonStyle(.amberProminent(height: SignInView.Row.height, cornerRadius: SignInView.Row.radius))
                    .accessibilityIdentifier("connect.fix")
            }
        }
    }

    private func trailing(_ g: Guide, size: CGFloat) -> some View { Accessory(state: state(g), size: size) }

    /// The mark at a row's end. Hidden from VoiceOver: the row's words say the same, and the
    /// spinner would make the whole row a busy indicator instead of a button.
    struct Accessory: View {
        let state: RowState
        let size: CGFloat
        var body: some View {
            Group {
                switch state {
                case .waiting: ProgressView().controlSize(.small)
                case .connected:
                    Image(systemName: "checkmark.circle.fill").font(.system(size: size, weight: .semibold)).foregroundStyle(.white, .green)
                case .failed:
                    Image(systemName: "exclamationmark.circle.fill").font(.system(size: size, weight: .semibold)).foregroundStyle(.white, .red)
                case .rest:
                    Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary)
                }
            }
            .accessibilityHidden(true)
        }
    }

    private func lit(_ g: Guide) -> Bool { if case .waiting = state(g) { return true }; return false }

    /// The row as a button; on iPhone, the AIs added on a computer send the link there (ShareLink).
    @ViewBuilder private func pressable(_ g: Guide, @ViewBuilder label: () -> some View) -> some View {
        #if os(iOS)
        if g != .other, g != .incredible, state(g) != .connected {
            ShareLink(item: ConnectCopy.message(g, server: run.server), subject: Text("Connect \(g.title) to Pinto Notes"),
                      preview: SharePreview("Connect \(g.title) to Pinto Notes", icon: Image("Mark"))) { label() }
                .buttonStyle(BigChoicePress())
                .simultaneousGesture(TapGesture().onEnded { press(g) })
        } else {
            Button { press(g) } label: { label() }.buttonStyle(BigChoicePress())
        }
        #else
        Button { press(g) } label: { label() }.buttonStyle(BigChoicePress())
        #endif
    }

    private func big(_ g: Guide) -> some View {
        let shape = RoundedRectangle(cornerRadius: BigChoices.Metrics.radius, style: .continuous)
        let words = VStack(alignment: .leading, spacing: 2) {
            Text(g.title).font(BigChoices.Metrics.title).foregroundStyle(Color.ink)
            Text(detail(g)).font(BigChoices.Metrics.detail).foregroundStyle(state(g) == .rest ? Color.muted : Color.ink)
        }
        .multilineTextAlignment(.leading)
        .fixedSize(horizontal: false, vertical: true)
        return pressable(g) {
            Group {
                if typeSize.isAccessibilitySize {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack { AITile(ai: g.title, size: BigChoices.Metrics.rowMark); Spacer(minLength: 8); trailing(g, size: BigChoices.Metrics.check) }
                        words
                    }
                } else {
                    HStack(spacing: 12) {
                        AITile(ai: g.title, size: BigChoices.Metrics.rowMark)
                        words
                        Spacer(minLength: 8)
                        trailing(g, size: BigChoices.Metrics.check)
                    }
                }
            }
            .padding(.horizontal, BigChoices.Metrics.padding)
            .padding(.vertical, BigChoices.Metrics.rowPadding)
            .frame(maxWidth: .infinity, minHeight: BigChoices.Metrics.rowHeight, alignment: .leading)
            .background(lit(g) ? Color.amberSoft : Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(lit(g) ? Color(Palette.amber) : Color(Palette.fieldHairline), lineWidth: lit(g) ? 1.5 : 1))
            .hoverOverlay(shape, Color.primary.opacity(0.05))
            .contentShape(shape)
        }
        .modifier(Said(id: "connect.guide.\(g.rawValue)", label: "\(g.title). \(detail(g))"))
    }

    private var quietList: some View {
        let shape = RoundedRectangle(cornerRadius: BigChoices.Metrics.radius, style: .continuous)
        return VStack(spacing: 0) {
            ForEach(Array(rest.enumerated()), id: \.element) { i, g in
                if i > 0 { Divider().padding(.leading, Metrics.smallMark + 22) }
                small(g)
            }
        }
        .background(Color(Palette.field))
        .clipShape(shape)
        .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
    }

    private func small(_ g: Guide) -> some View {
        let words = VStack(alignment: .leading, spacing: 1) {
            Text(g.title).font(Metrics.smallTitle).foregroundStyle(Color.ink)
            Text(detail(g)).font(Metrics.smallDetail).foregroundStyle(state(g) == .rest ? Color.muted : Color.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
        .multilineTextAlignment(.leading)
        return pressable(g) {
            Group {
                if typeSize.isAccessibilitySize {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack { AITile(ai: g.title, size: Metrics.smallMark); Spacer(); trailing(g, size: Metrics.smallCheck) }
                        words
                    }
                } else {
                    HStack(spacing: 10) {
                        AITile(ai: g.title, size: Metrics.smallMark)
                        words
                        Spacer(minLength: 8)
                        trailing(g, size: Metrics.smallCheck)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, Metrics.smallPad)
            .frame(maxWidth: .infinity, minHeight: Metrics.smallHeight, alignment: .leading)
            .background(lit(g) ? Color.amberSoft : .clear)
            .hoverOverlay(Rectangle(), Color.primary.opacity(0.05))
            .contentShape(.rect)
        }
        .modifier(Said(id: "connect.guide.\(g.rawValue)", label: "\(g.title). \(detail(g))"))
    }

    /// What VoiceOver and tests see: one button, named by its words. Named on the button itself:
    /// a new element in its place (`accessibilityElement(children: .ignore)`) can't be pressed.
    struct Said: ViewModifier {
        let id: String
        let label: String
        func body(content: Content) -> some View {
            content
                .accessibilityLabel(label)
                .accessibilityIdentifier(id)
        }
    }

    // MARK: What is connected (Settings)

    /// What is connected: a plain list under the choices, each with Disconnect.
    private var connectedList: some View {
        VStack(alignment: .leading, spacing: 6) {
            header(ConnectCopy.connected)
            VStack(spacing: 0) {
                ForEach(Array(active.enumerated()), id: \.element.id) { i, c in
                    if i > 0 { Divider().padding(.leading, Metrics.rowInset) }
                    row(c)
                }
            }
        }
    }

    private func row(_ c: Connection) -> some View {
        HStack(spacing: 10) {
            // The mark comes from where the approval went, never from the name.
            ConnectionTile(connection: c, size: 26)
            VStack(alignment: .leading, spacing: 2) {
                Text(c.title).font(Metrics.rowTitle).foregroundStyle(Color.ink)
                Text(Self.detail(c)).font(.caption).foregroundStyle(Color.muted).monospacedDigit()
                    .fixedSize(horizontal: false, vertical: true)
            }
            // The name and details read as one; Disconnect stays its own button for VoiceOver.
            .accessibilityElement(children: .combine)
            Spacer(minLength: 8)
            Button("Disconnect…") { removing = c }
                .buttonStyle(.hoverText)
                .font(Metrics.rowTitle)
                .foregroundStyle(.tint)
                .accessibilityLabel("Disconnect \(c.title)")
                .accessibilityIdentifier("connect.disconnect")
        }
        .padding(.vertical, 8)
    }

    static func detail(_ c: Connection) -> String {
        var parts = [c.can_write ? "Can read and edit" : "Can read only"]
        // Where access went: the proof of who this is, whatever it calls itself.
        if c.isOAuth, let host = c.redirect_host, !host.isEmpty, host != c.title { parts.insert(host, at: 0) }
        parts.append(c.last_used_at.map { "Used \($0.formatted(.relative(presentation: .named)))" } ?? "Not used yet")
        return parts.joined(separator: " · ")
    }

    private func load() async {
        if let preview {
            onLoaded(Set(preview.filter { $0.revoked_at == nil }.map(\.title)))
            return
        }
        do {
            connections = try await client.from("mcp_tokens").select().order("created_at", ascending: false).execute().value
            error = nil
            onLoaded(Set(active.map(\.title)))
        } catch {
            // Offline isn't a failure: it is asked again once the server answers.
            self.error = "Couldn\u{2019}t load what\u{2019}s connected. Check your connection."
        }
    }

    private func revoke(_ c: Connection) async {
        do {
            try await ConnectRevoke.revoke(client, id: c.id)
            removing = nil
            await load()
        } catch {
            self.error = "Couldn\u{2019}t disconnect \(c.name). Try again."
        }
    }

    enum Metrics {
        #if os(macOS)
        static let header = Font.system(size: 12, weight: .semibold)
        static let rowTitle = Font.system(size: 13)
        static let quiet = Font.system(size: 13, weight: .medium)
        static let smallTitle = Font.system(size: 12, weight: .semibold)
        static let smallDetail = Font.system(size: 11)
        static let gap: CGFloat = 8
        static let rowInset: CGFloat = 36
        static let smallMark: CGFloat = 22
        static let smallPad: CGFloat = 6
        static let smallHeight: CGFloat = 38
        static let smallCheck: CGFloat = 13
        #else
        static let header = Font.footnote.weight(.semibold)
        static let rowTitle = Font.body
        static let quiet = Font.subheadline.weight(.medium)
        static let smallTitle = Font.subheadline.weight(.semibold)
        static let smallDetail = Font.footnote
        static let gap: CGFloat = 10
        static let rowInset: CGFloat = 36
        static let smallMark: CGFloat = 28
        static let smallPad: CGFloat = 8
        static let smallHeight: CGFloat = 50
        static let smallCheck: CGFloat = 17
        #endif
    }
}

extension ConnectCopy {
    /// iPhone: what is sent to the computer for an AI that is added there.
    static func message(_ g: Guide, server: String) -> String {
        switch g {
        case .chatgpt, .claude:
            WebConnectPlan.forAI(g.title)?.message(server: server) ?? server
        default:
            "Connect \(g.title) to Pinto Notes, on your computer, in Terminal:\n\n\(TerminalConnect.command(g == .codex ? .codex : .claudeCode, server: server, way: .signIn))"
        }
    }
}

/// Which help to show: one AI's, or all of it.
struct HelpTopic: Identifiable {
    let guide: ConnectAISection.Guide?
    var id: String { guide?.rawValue ?? "all" }
}

// MARK: Having trouble?

/// Everything technical, behind the one quiet link: the address, the commands, ChatGPT's own
/// steps, Claude's custom connector, an access token for an app that asks for one.
struct ConnectHelpSheet: View {
    typealias Guide = ConnectAISection.Guide
    let topic: HelpTopic
    let client: SupabaseClient
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    @State private var copied: String?
    @State private var token: String?
    @State private var readOnly = false
    @State private var problem: String?

    private var server: String { BackendConfig.mcpPublicURL?.absoluteString ?? "" }
    private var order: [Guide] {
        let all: [Guide] = [.chatgpt, .claude, .claudeCode, .codex, .other]
        guard let g = topic.guide, all.contains(g) else { return all }
        return [g] + all.filter { $0 != g }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    copyRow(server, id: "address")
                } header: { Text("The address") } footer: { Text("Any AI app that can add a connector (an MCP server) can use it. It holds no password.") }
                ForEach(order) { section($0) }
            }
            .formStyle(.grouped)
            .navigationTitle(ConnectCopy.trouble)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        #if os(macOS)
        .frame(width: 520, height: 560)
        #endif
    }

    @ViewBuilder private func section(_ g: Guide) -> some View {
        switch g {
        case .chatgpt:
            Section("ChatGPT") {
                Text(WebConnectPlan.chatgpt.steps.dropLast().joined(separator: " ")).fixedSize(horizontal: false, vertical: true)
                Text(WebConnectPlan.chatgpt.plans).font(.footnote).foregroundStyle(.secondary)
            }
        case .claude:
            Section("Claude") {
                Text("Pinto Notes isn\u{2019}t in your Claude app\u{2019}s directory? Add it as a custom connector. Free includes one.")
                    .fixedSize(horizontal: false, vertical: true)
                Button("Add as Custom Connector", systemImage: "plus.circle") { openURL(WebConnectPlan.installLink(server: server)) }
                    .accessibilityIdentifier("connect.help.custom")
            }
        case .claudeCode, .codex:
            Section(g == .codex ? "Codex" : "Claude Code") {
                Text(g == .codex ? "Paste this in Terminal. Codex in the ChatGPT app, in Terminal and in your editor share it."
                                 : "Claude Code on an API key, or the Claude connector doesn\u{2019}t show in it? Paste this in Terminal.")
                    .fixedSize(horizontal: false, vertical: true)
                #if os(macOS)
                copyRow(ConnectShell.command(g, server: server), id: g.rawValue)
                #else
                copyRow(TerminalConnect.command(g, server: server, way: .signIn), id: g.rawValue)
                #endif
            }
        case .other:
            Section {
                Text("If it asks for a token instead of signing in, make one here. It is shown once.")
                    .fixedSize(horizontal: false, vertical: true)
                Toggle("Read only: it can read your notes, not change them", isOn: $readOnly)
                if let token {
                    copyRow(token, id: "token")
                } else {
                    Button("Make an Access Token", systemImage: "key") { Task { await makeToken() } }
                        .accessibilityIdentifier("connect.help.token")
                }
                if let problem { Text(problem).font(.footnote).foregroundStyle(.red) }
            } header: { Text("An app that asks for a token") }
        case .incredible:
            EmptyView()
        }
    }

    private func copyRow(_ value: String, id: String) -> some View {
        HStack(alignment: .top) {
            Text(value).font(.system(.callout, design: .monospaced)).textSelection(.enabled).fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 8)
            Button(copied == id ? "Copied" : "Copy") {
                ConnectClipboard.set(value)
                withAnimation(.snappy) { copied = id }
            }
            .accessibilityIdentifier("connect.help.copy.\(id)")
        }
    }

    private func makeToken() async {
        do {
            token = try await ConnectTokens.create(client, name: "Another AI", write: !readOnly) { try AccountCrypto.shared.accessToken() }
            problem = nil
        } catch {
            problem = "Couldn\u{2019}t make a token. Check your connection and try again."
        }
    }
}

/// Connect an AI as its own sheet (the sidebar card, the File menu, a note that asks for an AI):
/// the title, why, the choices; Done, the one orange button, once something is connected.
struct ConnectAISheet: View {
    let client: SupabaseClient
    /// Captures: shows these instead of asking the server.
    var preview: [Connection]? = nil
    var previewFound: [ConnectAISection.Guide]? = nil
    @Environment(\.dismiss) private var dismiss
    @State private var anyConnected = false

    static let title = "Connect an AI"

    private var choices: some View {
        ConnectChoices(client: client, listsConnected: false, preview: preview, previewFound: previewFound) { titles in
            anyConnected = !titles.isEmpty
        }
    }

    private var done: some View {
        Button("Done") { dismiss() }
            .buttonStyle(.amberProminent(height: SignInView.Row.height, cornerRadius: SignInView.Row.radius))
            .keyboardShortcut(.defaultAction)
            .accessibilityIdentifier("connect.done")
    }

    var body: some View {
        #if os(macOS)
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text(Self.title)
                    .font(.system(size: 22, weight: .heavy))
                    .tracking(-0.3)
                    .foregroundStyle(Color.ink)
                    .accessibilityAddTraits(.isHeader)
                Spacer()
                if !anyConnected {
                    Button("Close") { dismiss() }
                        .buttonStyle(.hoverText)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.muted)
                        .keyboardShortcut(.cancelAction)
                        .accessibilityIdentifier("connect.close")
                }
            }
            Text(ConnectCopy.why)
                .font(.system(size: 13))
                .foregroundStyle(Color.muted)
                .padding(.top, 6)
                .padding(.bottom, 16)
            choices
            if anyConnected { done.padding(.top, 16) }
        }
        .padding(28)
        .frame(width: 480)
        .fixedSize(horizontal: false, vertical: true)
        .background { Backdrop() }
        .connectGuides(client: client)
        .consentHost(client: client)
        #else
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(ConnectCopy.why)
                        .font(.body)
                        .foregroundStyle(Color.muted)
                        .fixedSize(horizontal: false, vertical: true)
                    choices
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
            }
            .safeAreaInset(edge: .bottom) {
                if anyConnected { done.padding(.horizontal, 20).padding(.bottom, 8) }
            }
            .background { Backdrop() }
            .navigationTitle(Self.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if !anyConnected { ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } } }
            }
        }
        .connectGuides(client: client)
        .consentHost(client: client)
        #endif
    }
}
