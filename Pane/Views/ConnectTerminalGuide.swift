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
        // Named "Codex", or "Codex on <this Mac>" when the app added it itself.
        case .token: return live.contains { !$0.isOAuth && ($0.name == guide.title || $0.name.hasPrefix("\(guide.title) on ")) && $0.last_used_at != nil }
        }
    }
}
