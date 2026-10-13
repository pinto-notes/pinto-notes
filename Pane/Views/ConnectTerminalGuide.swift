import Supabase
import SwiftUI

/// Connecting an AI that lives in a terminal or its own settings (Claude Code, Codex, another
/// MCP app): what to copy, where it goes, and what happens next, with no step of its own for a
/// token and no word about request headers.
///
/// Two forms, by the server's address. At an address with no path (production's
/// https://mcp.pintonotes.com) Claude Code and Codex sign in through the browser like ChatGPT and
/// Claude do: the command holds no secret. Checked on 2026-10-11 with Claude Code 2.1.296 and
/// Codex 0.159.3 against staging served at such an address: both found the server, registered
/// themselves and reached the consent page (the approval after it was not driven by hand). At an
/// address with a path (a Supabase function's own, as staging and local stacks use) Claude Code
/// asks the host instead of the function where to register and gets a 404, so there the command
/// carries an access token, made when Copy is pressed and never drawn on screen.
enum TerminalConnect {
    enum Way: Equatable {
        /// The app signs in through the browser; nothing secret in what is copied.
        case signIn
        /// The command carries an access token.
        case token
    }

    static func way(server: String) -> Way {
        guard let url = URL(string: server), url.scheme == "https" else { return .token }
        return url.path.isEmpty || url.path == "/" ? .signIn : .token
    }

    /// What is copied. With a token still to be made, dots stand where it goes.
    static func command(_ guide: ConnectAISection.Guide, server: String, way: Way, token: String? = nil) -> String {
        let secret = token ?? hidden
        switch (guide, way) {
        case (.claudeCode, .signIn):
            return "claude mcp add --scope user --transport http \(ConnectSnippets.serverName) \(server) && claude mcp login \(ConnectSnippets.serverName)"
        case (.claudeCode, .token):
            return ConnectSnippets.claudeCode(url: server, token: secret)
        case (.codex, .signIn):
            return "codex mcp add \(ConnectSnippets.serverName) --url \(server)"
        case (.codex, .token):
            return ConnectSnippets.codex(url: server, token: secret)
        case (_, .token):
            return "\(server)\nAuthorization: Bearer \(secret)"
        default:
            return server
        }
    }

    static let hidden = "\u{2022}\u{2022}\u{2022}\u{2022}\u{2022}\u{2022}"

    /// The numbered steps, in plain words. The first is the one with the Copy button.
    static func steps(_ guide: ConnectAISection.Guide, way: Way) -> [String] {
        switch (guide, way) {
        case (.claudeCode, .signIn), (.codex, .signIn):
            return ["Copy this command", "Paste it in your terminal and press Return", "Your browser opens. Sign in and choose Allow in Pinto Notes"]
        case (.claudeCode, .token):
            return ["Copy this command", "Paste it in your terminal and press Return", "Start Claude Code and ask it about your notes"]
        case (.codex, .token):
            return ["Copy these lines", "Paste them at the end of the file ~/.codex/config.toml", "Start Codex and ask it about your notes"]
        case (_, .token):
            return ["Copy the address and the line under it", "In your AI app, add the address as an MCP server", "Where it asks for a header or a token, paste the second line"]
        default:
            return ["Copy this address", "In your AI app, add it as an MCP server", "If it asks you to sign in, choose Allow in Pinto Notes"]
        }
    }

    static func intro(_ guide: ConnectAISection.Guide) -> String {
        switch guide {
        case .claudeCode: "Three steps in your terminal. It then works in every project."
        case .codex: "Three steps on your computer."
        default: "Any app that speaks MCP can use your notes."
        }
    }

    /// True for someone signed in to Claude Code with their Claude account: Claude Code loads
    /// that account's connectors.
    static let alreadyHasIt = "Connected Claude already? Claude Code signed in to the same account has Pinto Notes too."

    static func runsOnAComputer(_ guide: ConnectAISection.Guide) -> String {
        "\(guide.title) runs on your computer. Send yourself the command, or do this from Pinto Notes on your Mac, where it is easier."
    }

    static let privateNote = "The command holds a private key to your notes. Send it only to yourself."
    static let waiting = "Waiting for it to connect\u{2026}"
    static let connected = "Connected"

    /// The connection this guide was waiting for is there: a sign-in from this computer made
    /// since the guide opened, or the first call with the token it made.
    static func isConnected(_ rows: [Connection], guide: ConnectAISection.Guide, way: Way, since: Date) -> Bool {
        let live = rows.filter { $0.revoked_at == nil && $0.created_at >= since.addingTimeInterval(-2) }
        switch way {
        case .signIn: return live.contains { $0.isOAuth && Connection.isLoopback($0.redirect_host ?? "") }
        case .token: return live.contains { !$0.isOAuth && $0.name == guide.title && $0.last_used_at != nil }
        }
    }
}

struct TerminalConnectGuide: View {
    let guide: ConnectAISection.Guide
    let client: SupabaseClient
    /// Captures: fixed values in place of the server's.
    struct Preview {
        var server = "https://mcp.pintonotes.com"
        var copied = false
        var connected = false
        var optionsOpen = false
    }
    var preview: Preview?

    @State private var token: String?
    @State private var copied = false
    @State private var working = false
    @State private var problem: String?
    @State private var readOnly = false
    @State private var optionsOpen = false
    @State private var wantsToken = false
    @State private var connected = false
    @State private var opened = Date.now
    @State private var installed: String?
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var server: String { preview?.server ?? BackendConfig.mcpPublicURL?.absoluteString ?? "" }
    /// Another AI signs in when it can; its Options has the token for an app that asks for one.
    private var way: TerminalConnect.Way { guide == .other ? (wantsToken ? .token : .signIn) : TerminalConnect.way(server: server) }
    private var shownCopied: Bool { preview?.copied ?? copied }
    private var shownConnected: Bool { preview?.connected ?? connected }
    private var shownOptions: Bool { preview?.optionsOpen ?? optionsOpen }

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            Text(TerminalConnect.intro(guide))
                .font(Metrics.line)
                .foregroundStyle(Color.muted)
                .fixedSize(horizontal: false, vertical: true)
            #if os(iOS)
            if guide != .other {
                Text(TerminalConnect.runsOnAComputer(guide))
                    .font(Metrics.line)
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("connect.terminal.onAComputer")
            }
            #else
            if guide == .claudeCode, ClaudeCodeInstaller.isAvailable, preview == nil || preview?.server.isEmpty == false { addForMe }
            #endif
            steps
            status
            if guide == .claudeCode {
                Text(TerminalConnect.alreadyHasIt)
                    .font(.footnote)
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            options
        }
        .task { await watch() }
        .animation(reduceMotion ? nil : .smooth(duration: 0.3), value: shownConnected)
    }

    // MARK: Steps

    private var steps: some View {
        let lines = TerminalConnect.steps(guide, way: way)
        return VStack(alignment: .leading, spacing: 12) {
            ForEach(Array(lines.enumerated()), id: \.offset) { i, line in
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text("\(i + 1)")
                            .font(Metrics.number).monospacedDigit()
                            .foregroundStyle(.tint)
                            .frame(width: Metrics.numberSize, height: Metrics.numberSize)
                            .background(.tint.opacity(0.15), in: .circle)
                        Text(line).font(Metrics.step).foregroundStyle(Color.ink).fixedSize(horizontal: false, vertical: true)
                    }
                    .accessibilityElement(children: .combine)
                    if i == 0 { commandBox.padding(.leading, Metrics.numberSize + 10) }
                }
            }
        }
    }

    /// What is copied, in one box with its Copy button. Until Copy makes the token, dots stand
    /// where it goes; after, the command is shown whole, once, as it is on the clipboard.
    private var commandBox: some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous)
        return VStack(alignment: .leading, spacing: 8) {
            Text(TerminalConnect.command(guide, server: server, way: way, token: token))
                .font(.system(Metrics.mono, design: .monospaced))
                .foregroundStyle(Color.ink)
                .textSelection(.enabled)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("connect.terminal.command")
            HStack(spacing: 12) {
                Button(shownCopied ? "Copied" : working ? "Copying\u{2026}" : "Copy") { Task { await copy() } }
                    .buttonStyle(.amberProminent)
                    .fixedSize()
                    .disabled(working)
                    .accessibilityIdentifier("connect.terminal.copy")
                #if os(iOS)
                if guide != .other, let text = shareable {
                    ShareLink(item: text) { Label("Send to my computer", systemImage: "square.and.arrow.up") }
                        .font(.subheadline.weight(.semibold))
                        .accessibilityIdentifier("connect.terminal.send")
                }
                #endif
            }
            if way == .token, token != nil || shownCopied {
                Text(TerminalConnect.privateNote).font(.footnote).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
            }
            if let problem {
                Label(problem, systemImage: "exclamationmark.triangle.fill").font(.footnote).foregroundStyle(.orange)
            }
        }
        .padding(Metrics.padding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(Palette.field), in: shape)
        .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
    }

    /// What can be sent to another device: a command with no secret, or one whose token was
    /// just made by Copy (the private line is under it then).
    private var shareable: String? {
        switch way {
        case .signIn: TerminalConnect.command(guide, server: server, way: way)
        case .token: token.map { TerminalConnect.command(guide, server: server, way: way, token: $0) }
        }
    }

    @ViewBuilder private var status: some View {
        if shownConnected {
            HStack(spacing: 10) {
                DrawnCheck(animated: preview == nil && !reduceMotion).frame(width: 24, height: 24)
                Text(TerminalConnect.connected).font(Metrics.step.weight(.semibold)).foregroundStyle(Color.ink)
            }
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier("connect.terminal.connected")
            .transition(.opacity)
        } else if shownCopied || installed != nil {
            HStack(spacing: 8) {
                ProgressView().controlSize(.small)
                Text(installed ?? TerminalConnect.waiting).font(.footnote).foregroundStyle(Color.muted)
            }
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier("connect.terminal.waiting")
        }
    }

    // MARK: Options

    /// Out of the way: read only for a connection made with a token, and for another AI the
    /// token itself, for an app that asks for one instead of signing in.
    @ViewBuilder private var options: some View {
        if way == .token || guide == .other {
            VStack(alignment: .leading, spacing: 8) {
                Button { withAnimation(.snappy(duration: 0.2)) { optionsOpen.toggle() } } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.right").font(.caption2.weight(.semibold)).rotationEffect(.degrees(shownOptions ? 90 : 0))
                        Text("Options")
                    }
                    .frame(minHeight: Metrics.optionsHeight)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Color.muted)
                .accessibilityIdentifier("connect.terminal.options")
                if shownOptions {
                    VStack(alignment: .leading, spacing: 6) {
                        if guide == .other {
                            Toggle("The app asks for a token instead of signing in", isOn: $wantsToken)
                                .accessibilityIdentifier("connect.terminal.wantsToken")
                        }
                        if way == .token {
                            Toggle("Read only: it can read your notes, not change them", isOn: $readOnly)
                                .disabled(token != nil)
                                .accessibilityIdentifier("connect.terminal.readOnly")
                        }
                    }
                    .font(.footnote)
                    .toggleStyle(.switch)
                    .controlSize(.small)
                    .padding(.leading, 14)
                }
            }
        }
    }

    #if os(macOS)
    /// The Mac download can run the command itself: one press, nothing to paste.
    private var addForMe: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(working ? "Adding\u{2026}" : "Add to Claude Code for me") { Task { await addToClaudeCode() } }
                .buttonStyle(.amberProminent(height: 36, cornerRadius: 8))
                .disabled(working)
                .accessibilityIdentifier("connect.addClaudeCode")
            Text("Or do it yourself:").font(.footnote).foregroundStyle(Color.muted)
        }
    }

    private func addToClaudeCode() async {
        working = true
        problem = nil
        defer { working = false }
        guard let t = await makeToken() else { return }
        ConnectFunnel.started(guide.funnel)
        let outcome = await ClaudeCodeInstaller.install(url: server, token: t)
        if outcome.ok { installed = "Added. Start Claude Code and ask it about your notes." } else {
            problem = outcome.message
            ConnectFunnel.failed(guide.funnel, .other)
        }
    }
    #endif

    // MARK: Doing it

    /// One press: a token is made if this way needs one, and the whole thing is on the clipboard.
    private func copy() async {
        guard preview == nil else { return }
        problem = nil
        var text = TerminalConnect.command(guide, server: server, way: way)
        if way == .token {
            working = true
            defer { working = false }
            guard let t = await makeToken() else { return }
            text = TerminalConnect.command(guide, server: server, way: way, token: t)
        }
        ConnectClipboard.set(text)
        withAnimation(.snappy(duration: 0.15)) { copied = true }
        ConnectFunnel.started(guide.funnel)
    }

    private func makeToken() async -> String? {
        if let token { return token }
        do {
            let t = try await ConnectTokens.create(client, name: guide.title, write: !readOnly) { try AccountCrypto.shared.accessToken() }
            token = t
            Telemetry.shared.record(.aiConnected(AIKind(verified: guide.title)))
            return t
        } catch {
            problem = "Couldn\u{2019}t get it ready. Check your connection and try again."
            ConnectFunnel.failed(guide.funnel, FailureSummary(error).kind)
            return nil
        }
    }

    /// Looks every few seconds for the connection this guide is waiting for; when it is there,
    /// says so and closes.
    private func watch() async {
        guard preview == nil else { return }
        opened = .now
        ConnectCenter.shared.expectAsks()
        defer { ConnectCenter.shared.stopExpectingAsks() }
        while !Task.isCancelled, !connected {
            try? await Task.sleep(for: .seconds(2.5))
            guard !Task.isCancelled, copied || installed != nil || way == .signIn else { continue }
            guard let rows: [Connection] = try? await client.from("mcp_tokens").select().execute().value else { continue }
            if TerminalConnect.isConnected(rows, guide: guide, way: way, since: opened) {
                withAnimation(reduceMotion ? nil : .smooth(duration: 0.3)) { connected = true }
                ConnectFunnel.connected(guide.funnel)
                try? await Task.sleep(for: .seconds(1.6))
                if !Task.isCancelled { dismiss() }
            }
        }
    }

    enum Metrics {
        #if os(macOS)
        static let line = Font.system(size: 13)
        static let step = Font.system(size: 14)
        static let number = Font.system(size: 12, weight: .semibold)
        static let numberSize: CGFloat = 22
        static let mono = Font.TextStyle.footnote
        static let gap: CGFloat = 16
        static let padding: CGFloat = 12
        static let radius: CGFloat = 10
        static let optionsHeight: CGFloat = 22
        #else
        static let line = Font.body
        static let step = Font.body
        static let number = Font.callout.weight(.semibold)
        static let numberSize: CGFloat = 26
        static let mono = Font.TextStyle.footnote
        static let gap: CGFloat = 18
        static let padding: CGFloat = 14
        static let radius: CGFloat = 14
        static let optionsHeight: CGFloat = 44
        #endif
    }
}

/// The sheet around `TerminalConnectGuide`, like Connect an AI's own: the title, Done at the top,
/// the app's backdrop.
struct TerminalConnectSheet: View {
    let guide: ConnectAISection.Guide
    let client: SupabaseClient
    var preview: TerminalConnectGuide.Preview?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        #if os(macOS)
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("Connect \(guide.title)")
                    .font(.system(size: 22, weight: .heavy))
                    .tracking(-0.3)
                    .foregroundStyle(Color.ink)
                    .accessibilityAddTraits(.isHeader)
                Spacer()
                Button("Done") { dismiss() }
                    .buttonStyle(.hoverText)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.tint)
                    .keyboardShortcut(.cancelAction)
                    .accessibilityIdentifier("connect.done")
            }
            .padding(.bottom, 8)
            TerminalConnectGuide(guide: guide, client: client, preview: preview)
        }
        .padding(28)
        .frame(width: 520)
        .fixedSize(horizontal: false, vertical: true)
        .background { Backdrop() }
        .consentHost(client: client)
        #else
        NavigationStack {
            ScrollView {
                TerminalConnectGuide(guide: guide, client: client, preview: preview)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
            }
            .background { Backdrop() }
            .navigationTitle("Connect \(guide.title)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        .consentHost(client: client)
        #endif
    }
}
