import Supabase
import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

// What connecting ChatGPT, Claude and Incredible takes, and watching for the sign-in. The
// choices themselves (one row per AI, its state, the press) are `ConnectChoices`.
//
// Pinto Notes is listed in Claude's connector directory (since 2 October 2026), so for Claude the
// press opens the listing and the person chooses Connect. Claude's install link for its Add custom
// connector dialog stays as the fallback (Having trouble?). ChatGPT has no such link: the press
// copies the address and opens ChatGPT's Plugins page. Both are added on the web or desktop,
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

    static func forAI(_ ai: String) -> WebConnectPlan? {
        switch ai {
        case "ChatGPT": chatgpt
        case "Claude": claude
        default: nil
        }
    }

    /// The page shows a code to scan; on a Mac it also opens Amber Notes here.
    #if os(macOS)
    static let allowStep = "Choose Open Pinto Notes on this Mac, or scan the code with your iPhone. Then choose Allow."
    #else
    static var allowStep: String { "Scan the code it shows with this \(InstallID.kind), then choose Allow." }
    #endif

    static let testPrompt = "Search my Pinto Notes and tell me what I wrote most recently."

    static let chatgpt = WebConnectPlan(
        ai: "ChatGPT",
        prefills: false,
        steps: [
            "Turn on Developer mode in Settings, Security and login (once).",
            "In Plugins, choose + and name it Pinto Notes.",
            "Paste the address, choose OAuth, then Create.",
            allowStep,
        ],
        plans: "Needs ChatGPT Plus, Pro, Business, Enterprise or Edu, on the web.",
        testPrompt: testPrompt,
        testPage: prefilled("https://chatgpt.com/", testPrompt),
        page: { _ in URL(string: "https://chatgpt.com/plugins")! })

    static let claude = WebConnectPlan(
        ai: "Claude",
        prefills: true,
        steps: [
            "Claude opens Pinto Notes in its connector directory. Choose Connect to Claude.",
            allowStep,
        ],
        plans: "Pinto Notes is in Claude's connector directory. On Team and Enterprise, an Owner may need to allow it first.",
        testPrompt: testPrompt,
        testPage: prefilled("https://claude.ai/new", testPrompt),
        page: { _ in directoryListing },
        fallback: (line: "Using an older Claude app, or it doesn't show Pinto Notes? Add it as a custom connector instead. That works on every plan; Free includes one.",
                   button: "Add as Custom Connector",
                   page: installLink))

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
        case IncredibleConnect.ai: self = .incredible
        default: self = .other
        }
    }
}

/// How far connecting each AI got, for the connect funnel (`connect_step`): each step once for
/// each time its row is pressed (`ConnectRun`) or its guide opened (Incredible), and `gave_up`
/// when it stops after it was started and before the AI was connected.
@MainActor
enum ConnectFunnel {
    private struct Progress { var started = false, waiting = false, connected = false }
    private static var open: [ConnectAIKind: Progress] = [:]

    static func opened(_ ai: ConnectAIKind) {
        open[ai] = Progress()
        Funnel.record(.connectStep(ai, .opened))
    }

    /// The press that starts it: the AI's row, or Incredible's guide button.
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

/// Says when the new connection exists: at once when it's approved on this device, and by
/// asking the server every few seconds, so approving on the Mac also finishes the guide on iPhone.
@MainActor
@Observable
final class ConnectWatch {
    /// The name an approval on this device carries for this guide: the AI, or nil for an app
    /// Amber Notes can't vouch for (Incredible).
    let approvedAs: String?
    let since = Date.now.addingTimeInterval(-5)
    private(set) var connected: Connection?
    private(set) var approvedHere = false
    private let find: ([Connection], Date) -> Connection?

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
            if let a = ConnectCenter.shared.approved, a.ai == approvedAs, a.at >= since { approvedHere = true }
            if let rows: [Connection] = try? await client.from("mcp_tokens").select().order("created_at", ascending: false).limit(20).execute().value {
                connected = find(rows, since)
            }
            try? await Task.sleep(for: .seconds(approvedHere ? 1 : 3))
        }
    }

    #if DEBUG
    /// Captures: pretend it just worked.
    func pretendConnected() { approvedHere = true }
    #endif
}

/// One numbered step of Incredible's guide.
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


// MARK: Incredible

// Incredible (incredible.one) is a desktop app for Mac and Windows. From the release that lists
// Amber Notes as one of its apps, it's in Apps: search, Connect, sign in. Older versions add it
// as an MCP server of your own: Add an MCP server, paste the address, Sign in. Either way the
// sign-in comes back to 127.0.0.1 on the person's own computer, which can't prove which app is
// listening, so the consent sheet shows it as an app on this computer, like any other local app.
// The guide says so up front, and knows it worked when a new sign-in to this computer appears.

/// What connecting Incredible takes (tested).
enum IncredibleConnect {
    static let ai = "Incredible"
    /// Incredible's Mac app, to open it from the guide. Its incredible:// links are only for its
    /// own sign-in and billing, so the guide opens the app itself.
    static let bundleID = "one.incredible.new"
    static let site = URL(string: "https://incredible.one")!

    /// Amber Notes as one of Incredible's apps (Incredible's built-in, found by search).
    static let steps = [
        "Open Apps and search for notes, then choose the notes app with the orange leaf.",
        "Choose Connect. Your browser opens Pinto Notes.",
        allowStep,
        "Back in Incredible, choose Let's go.",
    ]

    /// The guide is read on the Mac next to Incredible, or on the iPhone that scans the code.
    static var allowStep: String {
        #if os(macOS)
        "Scan the code it shows with your iPhone (or open Pinto Notes on this Mac), then choose Allow."
        #else
        "Scan the code it shows with this \(InstallID.kind), then choose Allow."
        #endif
    }

    /// Versions of Incredible from before Amber Notes was one of its apps.
    static let olderVersion = "If Pinto Notes isn't in Apps, add it as your own MCP server: choose Add it here at the bottom of Apps (or Add another MCP server), paste the address, choose Continue, then Sign in. After you choose Allow, choose Add server."

    /// What Amber Notes shows when Incredible asks, since it can't name Incredible for sure.
    static let consentNote = "Pinto Notes asks to allow an app on this computer that calls itself \u{201C}incredible\u{201D}. It can't prove which app that is, so only allow it if you just chose Connect. Choose Allow. Options has Read only, if Incredible should only look things up."

    /// The newest sign-in that went back to an app on the person's own computer since the guide
    /// opened. That's where Incredible's answer goes; the name it registered decides nothing.
    static func newConnection(_ rows: [Connection], since: Date) -> Connection? {
        rows.filter { c in
            c.isOAuth && c.revoked_at == nil && c.created_at >= since
                && ["localhost", "127.0.0.1", "[::1]", "::1"].contains(c.redirect_host?.lowercased() ?? "")
        }
        .max { $0.created_at < $1.created_at }
    }

    /// The steps as plain text, for sending to yourself.
    static func message(server: String) -> String {
        var lines = ["Connect Incredible to Pinto Notes (in Incredible on your computer, once):", ""]
        for (i, s) in steps.enumerated() { lines.append("\(i + 1). \(s)") }
        lines += ["", "On a Windows PC, scan the code on the Pinto Notes page that opens with your iPhone, then choose Allow.",
                  "", olderVersion, "", "Address:", server]
        return lines.joined(separator: "\n")
    }

    #if os(macOS)
    /// Where Incredible is installed on this Mac, if it is.
    static var appURL: URL? { NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleID) }

    static func open() {
        guard let url = appURL else { return }
        NSWorkspace.shared.openApplication(at: url, configuration: NSWorkspace.OpenConfiguration())
    }
    #endif
}

/// Connect Incredible: the steps in Incredible, what Amber Notes will ask, the address for older
/// versions, then "connected".
struct IncredibleGuide: View {
    let client: SupabaseClient
    @State private var watch: ConnectWatch
    @State private var copied = false
    @State private var copiedQuestion = false
    @State private var started: Bool
    /// Mac: whether Incredible is on this Mac, so the button can open it.
    private let installed: Bool

    init(client: SupabaseClient, started: Bool = false, connected: Bool = false, installed: Bool? = nil) {
        self.client = client
        _started = State(initialValue: started)
        let w = ConnectWatch(approvedAs: nil) { IncredibleConnect.newConnection($0, since: $1) }
        #if DEBUG
        if connected { w.pretendConnected() }
        #endif
        _watch = State(initialValue: w)
        #if os(macOS)
        self.installed = installed ?? (IncredibleConnect.appURL != nil)
        #else
        self.installed = installed ?? false
        #endif
    }

    private var server: String { BackendConfig.mcpPublicURL?.absoluteString ?? "" }

    var body: some View {
        Group {
            if watch.isConnected {
                connectedSection
            } else {
                #if os(iOS)
                onAComputer
                #else
                start
                #endif
                stepsSection
                olderVersionSection
            }
        }
        .task { await watch.run(client: client) }
        .onChange(of: watch.isConnected, initial: true) { _, connected in if connected { ConnectFunnel.connected(.incredible) } }
    }

    #if os(iOS)
    /// iPhone: Incredible runs on a computer. Say so up front.
    private var onAComputer: some View {
        Section {
            Label {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Takes a minute on your computer, once.").font(.body.weight(.semibold))
                    Text("Incredible is a desktop app for Mac and Windows. You connect Pinto Notes in Incredible there.").foregroundStyle(.secondary)
                }
            } icon: {
                Image(systemName: "laptopcomputer").foregroundStyle(.tint)
            }
            ShareLink(item: IncredibleConnect.message(server: server), subject: Text("Connect Incredible to Pinto Notes"),
                      preview: SharePreview("Connect Incredible to Pinto Notes", icon: Image("Mark"))) {
                Label("Send Steps to Yourself", systemImage: "paperplane")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.amberProminent)
            .controlSize(.large)
            .simultaneousGesture(TapGesture().onEnded { ConnectFunnel.started(.incredible) })
            .accessibilityIdentifier("connect.sendSteps")
        }
    }
    #endif

    #if os(macOS)
    /// The one button: open Incredible when it's on this Mac, or get it.
    private var start: some View {
        Section {
            if installed {
                Button {
                    IncredibleConnect.open()
                    started = true
                    ConnectFunnel.started(.incredible)
                } label: {
                    Label(started ? "Open Incredible Again" : "Open Incredible", systemImage: "arrow.up.forward.app")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.amberProminent)
                .controlSize(.large)
                .accessibilityIdentifier("connect.open")
            } else {
                Link(destination: IncredibleConnect.site) {
                    Label("Get Incredible", systemImage: "arrow.up.forward.app")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.amberProminent)
                .controlSize(.large)
                .accessibilityIdentifier("connect.get")
            }
            if started {
                Label("Waiting for you to choose Allow…", systemImage: "hourglass")
                    .foregroundStyle(.secondary)
                    .accessibilityIdentifier("connect.waiting")
            }
        } footer: {
            Text(installed ? "On a Windows PC, follow the same steps in Incredible there." : "Incredible isn't on this Mac. It's a desktop app for Mac and Windows from incredible.one.")
        }
    }
    #endif

    private var stepsSection: some View {
        Section {
            ForEach(Array(IncredibleConnect.steps.enumerated()), id: \.offset) { i, line in
                ConnectStep(number: i + 1, text: line)
            }
        } header: {
            Text("In Incredible")
        } footer: {
            Text(IncredibleConnect.consentNote)
        }
    }

    /// Before Amber Notes was one of Incredible's apps: the address, pasted as an MCP server.
    private var olderVersionSection: some View {
        Section {
            Text(IncredibleConnect.olderVersion).font(.callout).foregroundStyle(.secondary)
            Text(server).font(.system(.callout, design: .monospaced)).textSelection(.enabled)
            Button(copied ? "Copied" : "Copy Address", systemImage: copied ? "checkmark" : "doc.on.doc") { copy() }
                .accessibilityIdentifier("connect.copyAddress")
        } header: {
            Text("On an older version of Incredible")
        } footer: {
            Text("The address holds no password. Access is granted only when you choose Allow in Pinto Notes.")
        }
    }

    /// Named the way Settings lists it: Amber Notes can't vouch that the app on this computer is Incredible.
    @ViewBuilder
    private var connectedSection: some View {
        Section {
            HStack(spacing: 12) {
                Image(systemName: "desktopcomputer")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(.secondary)
                    .frame(width: 40, height: 40)
                    .background(.fill.tertiary, in: .rect(cornerRadius: 40 * 0.3, style: .continuous))
                Image(systemName: "checkmark.circle.fill").font(.title2).foregroundStyle(.green)
                AppMark(size: 40)
            }
            .frame(maxWidth: .infinity)
            .accessibilityHidden(true)
            Text("Connected")
                .font(.title3.weight(.semibold))
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("connect.connected")
            Text("Back in Incredible, choose Let's go (Add server on an older version). In Settings, it's listed as An app on this computer.")
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
        }
        Section {
            Text("\u{201C}\(WebConnectPlan.testPrompt)\u{201D}").foregroundStyle(.primary)
            #if os(macOS)
            if installed {
                Button("Copy Question and Open Incredible", systemImage: "arrow.up.forward.app") {
                    ConnectClipboard.set(WebConnectPlan.testPrompt)
                    IncredibleConnect.open()
                }
                .accessibilityIdentifier("connect.tryIt")
            }
            #endif
            Button(copiedQuestion ? "Copied" : "Copy Question", systemImage: copiedQuestion ? "checkmark" : "doc.on.doc") {
                ConnectClipboard.set(WebConnectPlan.testPrompt)
                withAnimation(.snappy) { copiedQuestion = true }
            }
        } header: {
            Text("Try it")
        } footer: {
            Text("Ask Incredible this. You can disconnect it in Settings any time.")
        }
    }

    private func copy() {
        ConnectClipboard.set(server)
        withAnimation(.snappy) { copied = true }
    }
}
