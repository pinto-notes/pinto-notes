import Supabase
import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

// What connecting ChatGPT and Claude takes, and watching for the sign-in. The
// choices themselves (one row per AI, its state, the press) are `ConnectChoices`.
//
// Pinto Notes is listed in Claude's connector directory (since 2 October 2026), so for Claude the
// press opens the listing and the person chooses Connect. Claude's install link for its Add custom
// connector dialog stays as the fallback (Having trouble?). ChatGPT has no such link: the press
// opens a guide (ConnectWebGuide) that walks through adding it on ChatGPT's Plugins page. Both are added on the web or desktop,
// once; after that they work in the phone apps too. claude.ai doesn't hand /directory links to
// its iPhone app, so iPhone sends the link to the computer.
//
// Sources: claude.ai/directory/amber-notes (the listing),
// claude.com/docs/connectors/building/directory-vs-custom (install link),
// developers.openai.com/api/docs/guides/developer-mode (ChatGPT: Plus and up, on the web).

// MARK: Pure pieces (tested)

/// What connecting one web AI takes, and where.
struct WebConnectPlan: Equatable {
    let ai: String
    /// True when the page opens on Amber Notes itself, so there's no address to paste.
    let prefills: Bool
    let steps: [String]
    /// Who can do it at all.
    let plans: String
    /// A first request that proves the connection, and where to ask it.
    let testPrompt: String
    let testPage: URL
    private let page: @Sendable (String) -> URL
    /// Another way to add it, for apps that don't show the main page: a line, a button, the page.
    var fallback: (line: String, button: String, page: @Sendable (String) -> URL)? = nil

    static func == (a: WebConnectPlan, b: WebConnectPlan) -> Bool { a.ai == b.ai }

    /// The most specific page that exists for adding Amber Notes.
    func setupPage(server: String) -> URL { page(server) }

    @MainActor static func forAI(_ ai: String) -> WebConnectPlan? {
        switch ai {
        case "ChatGPT": chatgpt
        case "Claude": claude
        default: nil
        }
    }

    /// The page's last step. In the app: the page shows a code to scan, and on a Mac it also opens
    /// Pinto Notes here. On the web (the server keeps the key's copy): sign in there and Allow.
    static func allowStep(onWeb: Bool) -> String { BrowserConnect.allowStep(onWeb: onWeb, kind: InstallID.kind) }

    static let testPrompt = "Search my Pinto Notes and tell me what I wrote most recently."

    @MainActor static var chatgpt: WebConnectPlan { chatgpt(onWeb: BrowserConnect.onWeb) }
    @MainActor static var claude: WebConnectPlan { claude(onWeb: BrowserConnect.onWeb) }

    static func chatgpt(onWeb: Bool) -> WebConnectPlan { WebConnectPlan(
        ai: "ChatGPT",
        prefills: false,
        steps: [
            "In Plugins, choose Add, then Add custom MCP server.",
            "Name it Pinto Notes and paste the address under Connection.",
            "Tick I understand and want to continue, then choose Create as a plugin.",
            allowStep(onWeb: onWeb),
        ],
        plans: "Needs ChatGPT Plus, Pro, Business, Enterprise or Edu, on the web.",
        testPrompt: testPrompt,
        testPage: prefilled("https://chatgpt.com/", testPrompt),
        page: { _ in URL(string: "https://chatgpt.com/plugins")! }) }

    static func claude(onWeb: Bool) -> WebConnectPlan { WebConnectPlan(
        ai: "Claude",
        prefills: true,
        steps: [
            "Claude opens Pinto Notes in its connector directory. Choose Connect to Claude.",
            allowStep(onWeb: onWeb),
        ],
        plans: "Pinto Notes is in Claude's connector directory. On Team and Enterprise, an Owner may need to allow it first.",
        testPrompt: testPrompt,
        testPage: prefilled("https://claude.ai/new", testPrompt),
        page: { _ in directoryListing },
        fallback: (line: "Using an older Claude app, or it doesn't show Pinto Notes? Add it as a custom connector instead. That works on every plan; Free includes one.",
                   button: "Add as Custom Connector",
                   page: installLink)) }

    /// Amber Notes in Claude's connector directory. Its Connect to Claude button adds it.
    static let directoryListing = URL(string: "https://claude.ai/directory/amber-notes")!

    /// Claude's documented install link: the Add custom connector dialog, prefilled. The person still confirms.
    static func installLink(server: String) -> URL {
        // Fully percent-encoded, as the link wants (URLComponents would leave ":" and "/" as they are).
        let encode = { (s: String) in s.addingPercentEncoding(withAllowedCharacters: .alphanumerics.union(.init(charactersIn: "-._~"))) ?? "" }
        return URL(string: "https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=\(encode("Pinto Notes"))&connectorUrl=\(encode(server))")!
    }

    /// A new chat with the question typed in. Not documented by either app, so the question is
    /// also copied.
    static func prefilled(_ page: String, _ prompt: String) -> URL {
        var c = URLComponents(string: page)!
        c.queryItems = [URLQueryItem(name: "q", value: prompt)]
        return c.url!
    }

    /// The steps as plain text, for sending to yourself.
    func message(server: String) -> String {
        var lines = ["Connect \(ai) to Pinto Notes (on a computer, once):", "", "1. Open \(setupPage(server: server).absoluteString)"]
        for (i, s) in steps.enumerated() { lines.append("\(i + 2). \(s)") }
        if !prefills { lines += ["", "Address:", server] }
        if let fallback { lines += ["", fallback.line, fallback.page(server).absoluteString] }
        lines += ["", "After that, Pinto Notes works in the \(ai) app on your phone too."]
        return lines.joined(separator: "\n")
    }
}

// MARK: The connect funnel

extension ConnectAIKind {
    /// From the name a guide goes by ("ChatGPT", "Claude Code"). Any other name is `other`.
    init(guideName: String) {
        switch guideName {
        case "ChatGPT": self = .chatgpt
        case "Claude": self = .claude
        case "Claude Code": self = .claudeCode
        case "Codex": self = .codex
        default: self = .other
        }
    }
}

/// How far connecting each AI got, for the connect funnel (`connect_step`): each step once for
/// each time its row is pressed (`ConnectRun`) or its guide opened, and `gave_up`
/// when it stops after it was started and before the AI was connected.
@MainActor
enum ConnectFunnel {
    private struct Progress { var started = false, waiting = false, connected = false }
    private static var open: [ConnectAIKind: Progress] = [:]

    static func opened(_ ai: ConnectAIKind) {
        open[ai] = Progress()
        Funnel.record(.connectStep(ai, .opened))
    }

    /// The press that starts it: the AI's row, or its guide's button.
    static func started(_ ai: ConnectAIKind) { mark(ai, \.started, .started) }
    /// The request to allow it is here.
    static func waiting(_ ai: ConnectAIKind) { mark(ai, \.waiting, .waiting) }
    static func connected(_ ai: ConnectAIKind) { mark(ai, \.connected, .connected) }

    static func failed(_ ai: ConnectAIKind, _ kind: FailureKind) {
        Funnel.record(.connectStep(ai, .failed, kind: kind))
    }

    /// The guide closed, or the row stopped.
    static func closed(_ ai: ConnectAIKind) {
        guard let progress = open.removeValue(forKey: ai) else { return }
        if progress.started, !progress.connected { Funnel.record(.connectStep(ai, .gaveUp)) }
    }

    private static func mark(_ ai: ConnectAIKind, _ key: WritableKeyPath<Progress, Bool>, _ step: ConnectFunnelStep) {
        // A guide reached another way (Handoff) counts from where it is.
        var progress = open[ai] ?? Progress()
        guard !progress[keyPath: key] else { return }
        progress[keyPath: key] = true
        open[ai] = progress
        Funnel.record(.connectStep(ai, step))
    }
}

/// Handing the guide from iPhone to Mac with Handoff.
enum ConnectHandoff {
    static let activityType = "dev.emilwagman.pane.connect"
    static let key = "ai"
}

// MARK: Watching for the sign-in

/// Says when the new connection exists: at once when it's approved on this device or the server
/// says an AI connected (`ConnectCenter.connectionNews`), and by asking the server every two
/// seconds, so approving on the Mac also finishes the guide on iPhone.
@MainActor
@Observable
final class ConnectWatch {
    /// The name an approval on this device carries for this guide: the AI, or nil for an app
    /// Pinto Notes can't vouch for (one on this computer).
    let approvedAs: String?
    let since = Date.now.addingTimeInterval(-5)
    private(set) var connected: Connection?
    private(set) var approvedHere = false
    private let find: ([Connection], Date) -> Connection?
    /// Approvals here and news of new connections; tests give their own.
    @ObservationIgnored var center = ConnectCenter.shared

    convenience init(ai: String) {
        self.init(approvedAs: ai) { ConnectCompletion.newConnection($0, ai: ai, since: $1) }
    }

    init(approvedAs: String?, find: @escaping ([Connection], Date) -> Connection?) {
        self.approvedAs = approvedAs
        self.find = find
    }

    var isConnected: Bool { connected != nil || approvedHere }

    func run(client: SupabaseClient) async {
        while !Task.isCancelled, connected == nil {
            let seen = center.connectionNews
            if let a = center.approved, a.ai == approvedAs, a.at >= since { approvedHere = true }
            if let rows: [Connection] = try? await client.from("mcp_tokens").select().order("created_at", ascending: false).limit(20).execute().value {
                connected = find(rows, since)
            }
            await center.news(after: seen, within: approvedHere ? .seconds(1) : ConnectCenter.look)
        }
    }

    #if DEBUG
    /// Captures: pretend it just worked.
    func pretendConnected() { approvedHere = true }
    #endif
}

/// One numbered step of a guide.
struct ConnectStep: View {
    let number: Int
    let text: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text("\(number)").font(.callout.weight(.semibold)).monospacedDigit().foregroundStyle(.tint).frame(width: 16)
            Text(text)
        }
        .accessibilityElement(children: .combine)
    }
}

enum ConnectClipboard {
    static func set(_ s: String) {
        #if os(iOS)
        UIPasteboard.general.string = s
        #else
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(s, forType: .string)
        #endif
    }
}


