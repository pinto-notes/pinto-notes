import Supabase
import SwiftUI

// Connect ChatGPT and Connect another AI, to the guided imports' bar (13 October 2026): a sheet of
// pages, each with a picture and one orange button, Back, and a page that says it worked. Nothing
// opens a browser unless a button says it will. ChatGPT is added on chatgpt.com as a custom MCP
// server until OpenAI lists Pinto Notes in its plugins (in review since 13 October); then the guide
// is one step, Open Pinto Notes in ChatGPT, and Connect. Another AI is one page: the address,
// where to paste it, and the token way behind Having trouble?.

/// Pinto Notes in ChatGPT's plugin directory, once OpenAI has approved it.
enum ChatGPTPlugin {
    /// The plugin's page in ChatGPT. Nil until the listing is live: the guide then walks through
    /// adding Pinto Notes as a custom MCP server. Set it here when OpenAI approves the plugin
    /// (id pinto-notes); `defaults write <bundle id> ChatGPTPluginListing <url>` tries it first.
    static let listed: URL? = nil

    static var listing: URL? {
        UserDefaults.standard.string(forKey: "ChatGPTPluginListing").flatMap { URL(string: $0) }.flatMap { $0.scheme == "https" ? $0 : nil } ?? listed
    }

    /// ChatGPT's plugins, where Add custom MCP server is.
    static let plugins = URL(string: "https://chatgpt.com/plugins")!
}

/// A connect guide's words and pictures, page by page.
struct ConnectWebGuide {
    typealias Guide = ConnectAISection.Guide
    var ai: Guide
    var introTitle: String
    var introLine: String
    /// Who can do it, under the intro's line.
    var note: String?
    var steps: [Step]
    var doneTitle: String

    struct Step {
        var title: String
        var text: String
        var art: ConnectDrawing.Kind
        /// What the step's button opens, said on it ("Open ChatGPT"), and where it goes.
        var action: String?
        var link: URL?
        /// The address, with Copy, under the words.
        var copiesAddress = false
        /// Allow comes next: the page waits for the AI to connect.
        var waits = false
    }

    /// The AIs that open a guide of their own instead of starting from the row.
    static func opensSheet(_ g: Guide) -> Bool { g == .chatgpt || g == .other }

    #if os(macOS)
    static let click = "Click", device = "this Mac"
    #else
    static let click = "Tap", device = "this iPhone"
    #endif

    static func chatgpt(listing: URL? = ChatGPTPlugin.listing) -> ConnectWebGuide {
        let intro = "ChatGPT can then find, read and write your notes when you ask it to."
        if let listing {
            return ConnectWebGuide(
                ai: .chatgpt, introTitle: "Connect ChatGPT",
                introLine: "\(intro) It takes a minute, once, and then works in the ChatGPT apps too.",
                note: nil,
                steps: [Step(title: "Open Pinto Notes in ChatGPT",
                             text: "ChatGPT shows Pinto Notes in its plugins. \(click) Connect, then choose Allow when \(device) asks.",
                             art: .listing, action: "Open ChatGPT", link: listing, waits: true)],
                doneTitle: "ChatGPT is connected")
        }
        return ConnectWebGuide(
            ai: .chatgpt, introTitle: "Connect ChatGPT",
            introLine: "\(intro) You add Pinto Notes once on chatgpt.com, in about a minute, and then it works in the ChatGPT apps too.",
            note: "Needs ChatGPT Plus, Pro, Business, Enterprise or Edu.",
            steps: [
                Step(title: "Open ChatGPT\u{2019}s plugins",
                     text: "Sign in if ChatGPT asks. The Plugins page opens, with Add at the top right.",
                     art: .plugins, action: "Open ChatGPT", link: ChatGPTPlugin.plugins),
                Step(title: "Add a custom MCP server",
                     text: "\(click) Add, then Add custom MCP server. A form opens.",
                     art: .addMenu),
                Step(title: "Paste the address",
                     text: "Name it Pinto Notes and paste this under Connection. Tick I understand and want to continue, then \(click.lowercased()) Create as a plugin.",
                     art: .form, copiesAddress: true),
                Step(title: "Allow it in Pinto Notes",
                     text: "Your browser opens a Pinto Notes page. Choose Open Pinto Notes, then Allow when \(device) asks.",
                     art: .allow, waits: true),
            ],
            doneTitle: "ChatGPT is connected")
    }

    /// Another AI: one page, so only its words live here.
    enum Other {
        static let title = "Connect another AI"
        static let line = "Add Pinto Notes in your AI app as a connector (also called an MCP server), with this address."
        static let whereTitle = "Where it goes"
        static let places: [(String, String)] = [
            ("Claude", "Settings \u{2192} Connectors \u{2192} Add custom connector"),
            ("VS Code", "Command Palette \u{2192} MCP: Add Server \u{2192} HTTP"),
            ("Cursor and others", "Their settings, under MCP or connectors"),
        ]
    }

    static func waiting(_ g: Guide) -> String {
        g == .other ? "Waiting for your AI to connect\u{2026}" : "Waiting for \(g.title) to connect\u{2026}"
    }
}

// MARK: Running a guide

/// One guide on screen: the page, the presses, copying, and watching for the connection. Every
/// step of the connect funnel passes through here (`started` at the first press that does
/// something, `waiting` when the page says it waits, `connected`); the sheet's route records
/// `opened` and, on closing before it worked, `gave_up`.
@MainActor
@Observable
final class ConnectGuideRun {
    typealias Guide = ConnectAISection.Guide
    enum Stage: Equatable { case intro, step(Int), connected }

    let ai: Guide
    /// ChatGPT's pages; Another AI has one page and none of these.
    let guide: ConnectWebGuide?
    private(set) var stage: Stage
    private(set) var trail: [Stage] = []
    /// Steps whose link was opened.
    private(set) var opened: Set<Int> = []
    /// What was just copied: the address, or the question to try.
    private(set) var copied: Copied?
    /// What connected: its name as the server lists it.
    private(set) var connectedAs: String?
    let since = Date.now.addingTimeInterval(-5)
    let server: String

    enum Copied: Equatable { case address, question }

    @ObservationIgnored var open: (URL) -> Void = { _ in }
    @ObservationIgnored var copy: (String) -> Void = ConnectClipboard.set
    /// The sheet closes (Done, after it worked).
    @ObservationIgnored var close: () -> Void = {}
    @ObservationIgnored private var watching: Task<Void, Never>?
    @ObservationIgnored private var expecting = false
    @ObservationIgnored private var saidWaiting = false

    init(ai: Guide, guide: ConnectWebGuide? = nil, server: String = BackendConfig.mcpPublicURL?.absoluteString ?? "",
         stage: Stage? = nil, opened: Set<Int> = [], copied: Copied? = nil) {
        self.ai = ai
        self.guide = ai == .other ? nil : (guide ?? .chatgpt())
        self.server = server
        self.stage = stage ?? (ai == .other ? .step(0) : .intro)
        self.opened = opened
        self.copied = copied
    }

    var step: ConnectWebGuide.Step? {
        if case .step(let i) = stage, let guide, guide.steps.indices.contains(i) { guide.steps[i] } else { nil }
    }

    /// The page waits for the AI, and says so with a spinner: only once there is something to
    /// wait for (ChatGPT's last step, or the address copied for another AI).
    var waits: Bool {
        if ai == .other { return stage == .step(0) && copied == .address }
        guard case .step(let i) = stage, let s = step, s.waits else { return false }
        return s.action == nil || opened.contains(i)
    }

    // MARK: Presses

    func primary() {
        switch stage {
        case .intro:
            go(.step(0))
        case .step(let i):
            if ai == .other { copyAddress(); return }
            guard let s = step else { return }
            if s.action != nil, !opened.contains(i) { openLink(i) } else if !waits { next(after: i) }
        case .connected:
            close()
        }
    }

    func quiet() {
        switch stage {
        case .intro:
            // Added it already: straight to the step that waits for Allow.
            if let last = guide?.steps.indices.last { go(.step(last)) }
        case .step(let i):
            guard let s = step else { return }
            if s.action != nil, !opened.contains(i), !s.waits { next(after: i) }
            else if s.action != nil, opened.contains(i) { openLink(i) }
        case .connected:
            copy(WebConnectPlan.testPrompt)
            copied = .question
        }
    }

    func back() {
        guard stage != .connected, let last = trail.popLast() else { return }
        stage = last
        said()
    }

    func copyAddress() {
        copy(server)
        copied = .address
        ConnectFunnel.started(ai.funnel)
        said()
    }

    private func go(_ next: Stage) {
        trail.append(stage)
        stage = next
        said()
    }

    private func next(after i: Int) {
        if let guide, i + 1 < guide.steps.count { go(.step(i + 1)) }
    }

    private func openLink(_ i: Int) {
        guard let link = guide?.steps[i].link else { return }
        opened.insert(i)
        ConnectFunnel.started(ai.funnel)
        open(link)
        said()
    }

    /// The funnel hears `waiting` the first time the page waits.
    private func said() {
        if waits, !saidWaiting {
            saidWaiting = true
            ConnectFunnel.waiting(ai.funnel)
        }
    }

    // MARK: Watching

    /// Watches for the connection while the sheet is up: at once when it's allowed on this
    /// device, else from the server's list every few seconds.
    func watch(_ client: SupabaseClient) {
        if !expecting { ConnectCenter.shared.expectAsks(); expecting = true }
        let ai = ai, since = since
        watching?.cancel()
        watching = Task { [weak self] in
            while !Task.isCancelled {
                let here = ConnectCenter.shared.approved.map { $0.at >= since && ConnectRun.approvalCounts($0.ai, for: ai) } ?? false
                let rows: [Connection]? = try? await client.from("mcp_tokens").select().order("created_at", ascending: false).limit(20).execute().value
                if let rows, ConnectRun.isNew(rows, for: ai, since: since) || here {
                    self?.connected(Self.newest(rows, for: ai, since: since)?.title)
                    return
                }
                if here { self?.connected(nil); return }
                try? await Task.sleep(for: .seconds(3))
            }
        }
    }

    func stop() {
        watching?.cancel()
        watching = nil
        if expecting { ConnectCenter.shared.stopExpectingAsks(); expecting = false }
    }

    /// Connected. Internal for tests: the app gets here from the server's list.
    func connected(_ name: String?) {
        guard stage != .connected else { return }
        stop()
        connectedAs = name
        trail = []
        copied = nil
        stage = .connected
        ConnectFunnel.connected(ai.funnel)
    }

    nonisolated static func newest(_ rows: [Connection], for g: Guide, since: Date) -> Connection? {
        rows.filter { ConnectRun.isNew([$0], for: g, since: since) }.max { $0.created_at < $1.created_at }
    }
}

// MARK: The sheet

/// Connect ChatGPT, or another AI, as a sheet of pages. Presented by `ConnectGuides`.
struct ConnectWebGuideSheet: View {
    @State var run: ConnectGuideRun
    var client: SupabaseClient?
    /// The sheet's height when it is set here (renders); otherwise fitted to the window.
    var height: CGFloat?
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    @State private var help: HelpTopic?
    #if os(macOS)
    @State private var fit = ImportSheetFit.height(NSApp.mainWindow)
    #endif

    init(ai: ConnectAISection.Guide, client: SupabaseClient) {
        _run = State(initialValue: ConnectGuideRun(ai: ai))
        self.client = client
    }

    /// Captures and tests: a page as it is.
    init(run: ConnectGuideRun, height: CGFloat? = nil) {
        _run = State(initialValue: run)
        self.height = height
    }

    #if os(iOS)
    static let compact = true
    #else
    static let compact = false
    #endif

    private var sheetHeight: CGFloat {
        #if os(macOS)
        min(ImportSheetFit.designed, height ?? fit)
        #else
        ImportSheetFit.designed
        #endif
    }

    private var shortBy: CGFloat { Self.compact ? 0 : ImportSheetFit.designed - sheetHeight }

    var body: some View {
        pages
            #if os(macOS)
            .frame(width: 540, height: sheetHeight)
            .background(SheetParentReader { fit = ImportSheetFit.height($0) })
            #endif
            .foregroundStyle(Color.ink)
            .background(Color(Palette.sheetGround))
            .tint(Color(Palette.amber))
            .presentationBackground(Color(Palette.sheetGround))
            .onAppear {
                run.open = { openURL($0) }
                run.close = { dismiss() }
                if let client { run.watch(client) }
            }
            .onDisappear { run.stop() }
            .sheet(item: $help) { topic in
                if let client { ConnectHelpSheet(topic: topic, client: client).consentHost(client: client) }
            }
            .modifier(ConsentHostIf(client: client))
    }

    /// The page without the sheet's frame.
    var pages: some View {
        VStack(spacing: 0) {
            topBar
            content.frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .animation(.snappy(duration: 0.2), value: run.copied)
    }

    // MARK: Parts

    private var steps: [ConnectWebGuide.Step] { run.guide?.steps ?? [] }

    private var topBar: some View {
        HStack {
            if case .step = run.stage, run.ai != .other {
                Button { run.back() } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
                        Text("Back")
                    }
                }
                .buttonStyle(.hoverText)
                .foregroundStyle(Color.muted)
                .accessibilityIdentifier("connect.guide.back")
            } else {
                Color.clear.frame(width: 1, height: 1)
            }
            Spacer()
            if run.stage != .connected, !steps.isEmpty {
                HStack(spacing: 6) {
                    ForEach(0...steps.count, id: \.self) { i in
                        Capsule()
                            .fill(i == pageIndex ? Color(Palette.amber) : Color.line)
                            .frame(width: i == pageIndex ? 18 : 6, height: 6)
                    }
                }
                .accessibilityHidden(true)
            }
            Spacer()
            Button { dismiss() } label: {
                Image(systemName: "xmark").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                    .frame(width: 26, height: 26)
                    .background(Color.line.opacity(0.6), in: .circle)
            }
            .buttonStyle(.plain)
            .keyboardShortcut(.cancelAction)
            .accessibilityLabel("Close")
            .accessibilityIdentifier("connect.guide.close")
        }
        .frame(height: 30)
        .padding(.horizontal, Self.compact ? 20 : 18)
        .padding(.top, 14)
    }

    private var pageIndex: Int {
        switch run.stage {
        case .intro: 0
        case .step(let i): i + 1
        case .connected: steps.count + 1
        }
    }

    @ViewBuilder private var content: some View {
        switch run.stage {
        case .intro: intro
        case .step(let i): if run.ai == .other { other } else { step(steps[i], number: i + 1) }
        case .connected: connected
        }
    }

    /// The AI's mark and Pinto Notes', side by side.
    private var marks: some View {
        HStack(spacing: 14) {
            AITile(ai: run.ai == .other ? "" : run.ai.title, size: Self.compact ? 64 : 60)
            Image(systemName: "arrow.left.arrow.right").font(.system(size: 15, weight: .semibold)).foregroundStyle(Color.muted)
            AppMark(size: Self.compact ? 64 : 60)
        }
        .accessibilityHidden(true)
    }

    private var intro: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            marks.padding(.bottom, 22)
            Text(run.guide?.introTitle ?? "")
                .font(.display(Self.compact ? 30 : 28))
                .tracking(Palette.tracking(28))
                .multilineTextAlignment(.center)
                .padding(.bottom, 10)
            Text(run.guide?.introLine ?? "")
                .font(Self.compact ? .body : .system(size: 15))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 400)
            if let note = run.guide?.note {
                Text(note)
                    .font(Self.compact ? .footnote : .system(size: 12))
                    .foregroundStyle(Color.muted.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.top, 10)
            }
            Spacer(minLength: 0)
            primary("Show Me How")
            quiet(steps.count > 1 ? "I\u{2019}ve added it already" : " ").opacity(steps.count > 1 ? 1 : 0)
        }
        .padding(.horizontal, 40)
        .padding(.bottom, Self.compact ? 12 : 26)
    }

    @ViewBuilder
    private func step(_ s: ConnectWebGuide.Step, number: Int) -> some View {
        let opened = run.opened.contains(number - 1)
        // Drawn at the picture's full height; the page with the address shrinks it to make room.
        let full = Self.compact ? 280 : ImportSheetFit.picture
        VStack(spacing: 0) {
            ImportSheetFit.scaled(art(s.art), to: full - (s.copiesAddress ? 60 : 0) - shortBy, from: full)
                .padding(.top, 8)
                .padding(.bottom, 18)
            VStack(alignment: .leading, spacing: 8) {
                Text(ImportGuideSheet.stepLabel(number, of: steps.count))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.muted)
                Text(s.title).font(.system(size: Self.compact ? 24 : 21, weight: .bold)).tracking(-0.3)
                    .accessibilityAddTraits(.isHeader)
                Text(s.text)
                    .font(Self.compact ? .body : .system(size: 14))
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .lineSpacing(2)
                if s.copiesAddress { address(large: false).padding(.top, 4) }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Spacer(minLength: 12)
            if run.waits {
                waitingRow
                quiet(s.action.map { "\($0) again" } ?? ConnectCopy.trouble)
            } else if let action = s.action, !opened {
                primary(action, symbol: "arrow.up.right")
                quiet(s.waits ? ConnectCopy.trouble : "Next")
            } else {
                primary("Next")
                if let action = s.action { quiet("\(action) again") } else { quiet(" ").hidden() }
            }
        }
        .padding(.horizontal, Self.compact ? 24 : 36)
        .padding(.bottom, Self.compact ? 12 : 26)
    }

    /// Another AI: the address to copy, where it goes, and the wait once it's copied.
    private var other: some View {
        VStack(spacing: 0) {
            // A short window gives up the marks, never the words.
            if shortBy < 40 { marks.padding(.top, Self.compact ? 18 : 6).padding(.bottom, 16) }
            Text(ConnectWebGuide.Other.title)
                .font(.display(Self.compact ? 28 : 26))
                .tracking(Palette.tracking(26))
                .multilineTextAlignment(.center)
                .accessibilityAddTraits(.isHeader)
                .padding(.bottom, 8)
            Text(ConnectWebGuide.Other.line)
                .font(Self.compact ? .body : .system(size: 14))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 420)
                .padding(.bottom, 16)
            address(large: true)
            if run.copied == .address {
                primary("Copied", symbol: "checkmark").padding(.top, 10)
            } else {
                primary("Copy Address").padding(.top, 10)
            }
            places.padding(.top, 18)
            Spacer(minLength: 8)
            if run.waits { waitingRow } else { Color.clear.frame(height: 24) }
            quiet(ConnectCopy.trouble)
        }
        .padding(.horizontal, Self.compact ? 24 : 36)
        .padding(.bottom, Self.compact ? 12 : 22)
    }

    private var places: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(ConnectWebGuide.Other.whereTitle)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color.muted)
                .accessibilityAddTraits(.isHeader)
            ForEach(ConnectWebGuide.Other.places, id: \.0) { name, path in
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text(name).font(.system(size: Self.compact ? 15 : 13, weight: .semibold)).frame(width: 120, alignment: .leading)
                        Text(path).font(.system(size: Self.compact ? 15 : 13)).foregroundStyle(Color.muted)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(name).font(.system(size: Self.compact ? 15 : 13, weight: .semibold))
                        Text(path).font(.system(size: Self.compact ? 15 : 13)).foregroundStyle(Color.muted)
                    }
                }
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityElement(children: .combine)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(Palette.field).opacity(0.6), in: RoundedRectangle(cornerRadius: Self.compact ? 12 : 10, style: .continuous))
    }

    /// The address in a field to select, and on ChatGPT's step its own Copy button.
    private func address(large: Bool) -> some View {
        let shape = RoundedRectangle(cornerRadius: Self.compact ? 12 : 10, style: .continuous)
        return HStack(spacing: 10) {
            Text(run.server)
                .font(.system(size: large ? (Self.compact ? 18 : 17) : 14, weight: .medium, design: .monospaced))
                .textSelection(.enabled)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .frame(maxWidth: .infinity, alignment: large ? .center : .leading)
            if !large {
                Button {
                    run.copyAddress()
                } label: {
                    Label(run.copied == .address ? "Copied" : "Copy", systemImage: run.copied == .address ? "checkmark" : "doc.on.doc")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(run.copied == .address ? Color(Palette.amberInk) : Color.ink)
                        .padding(.horizontal, 10).padding(.vertical, 5)
                        .background(Color.line.opacity(0.6), in: .capsule)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("connect.address.copy")
            }
        }
        .padding(.horizontal, 14)
        .frame(height: large ? (Self.compact ? 56 : 50) : 40)
        .background(Color(Palette.field), in: shape)
        .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Address, \(run.server)")
    }

    /// Something is being waited for, and only then: the spinner, and what for.
    private var waitingRow: some View {
        HStack(spacing: 8) {
            ProgressView().controlSize(.small)
            Text(ConnectWebGuide.waiting(run.ai)).font(.system(size: Self.compact ? 15 : 13, weight: .medium)).foregroundStyle(Color.muted)
        }
        .frame(height: Self.compact ? 50 : 40)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("connect.waiting")
    }

    private var connected: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            ZStack(alignment: .bottomTrailing) {
                if run.ai == .other { AppMark(size: 76) } else { AITile(ai: run.ai.title, size: 76) }
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 28))
                    .symbolRenderingMode(.palette)
                    .foregroundStyle(.white, Color(Palette.amberButton))
                    .background(Circle().fill(Color(Palette.sheetGround)).padding(-3))
                    .offset(x: 8, y: 6)
            }
            .accessibilityHidden(true)
            .padding(.bottom, 22)
            Text(doneTitle)
                .font(.display(Self.compact ? 28 : 26))
                .tracking(Palette.tracking(26))
                .multilineTextAlignment(.center)
                .padding(.bottom, 10)
                .accessibilityIdentifier("connect.connected")
            Text("Ask it about your notes, like this: \u{201C}\(WebConnectPlan.testPrompt)\u{201D}")
                .font(Self.compact ? .body : .system(size: 15))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 400)
            Spacer(minLength: 0)
            primary("Done")
            quiet(run.copied == .question ? "Copied" : "Copy the Question")
        }
        .padding(.horizontal, 40)
        .padding(.bottom, Self.compact ? 12 : 26)
    }

    private var doneTitle: String {
        if let guide = run.guide { return guide.doneTitle }
        if let name = run.connectedAs, !name.isEmpty { return "\(name) is connected" }
        return "Your AI is connected"
    }

    // MARK: Buttons

    /// The one filled button on the page.
    private func primary(_ title: String, symbol: String? = nil) -> some View {
        Button { run.primary() } label: {
            HStack(spacing: 6) {
                Text(title)
                if let symbol { Image(systemName: symbol).font(.system(size: 12, weight: .bold)) }
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.amberProminent(height: Self.compact ? 50 : 40, cornerRadius: Self.compact ? 14 : 10))
        .keyboardShortcut(.defaultAction)
        .frame(maxWidth: Self.compact ? .infinity : 320)
        .accessibilityIdentifier("connect.guide.primary")
    }

    /// Everything else: quiet text. Having trouble? opens the help.
    private func quiet(_ title: String) -> some View {
        Button(title) {
            if title == ConnectCopy.trouble { help = HelpTopic(guide: run.ai) } else { run.quiet() }
        }
        .buttonStyle(.hoverLink)
        .font(.system(size: Self.compact ? 15 : 13, weight: .medium))
        .foregroundStyle(Color.muted)
        .frame(height: 34)
        .padding(.top, 6)
        .accessibilityIdentifier("connect.guide.quiet")
    }

    private func art(_ kind: ConnectDrawing.Kind) -> some View {
        let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)
        return ConnectDrawing(kind: kind, server: run.server)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(Palette.page))
            .clipShape(shape)
            .overlay(shape.strokeBorder(Color.line, lineWidth: 1))
            .accessibilityHidden(true)
    }
}

/// The consent sheet can show over the guide (Allow comes while it is up). Not in captures.
private struct ConsentHostIf: ViewModifier {
    let client: SupabaseClient?
    func body(content: Content) -> some View {
        if let client { content.consentHost(client: client) } else { content }
    }
}

// MARK: Drawn pictures

/// ChatGPT's pages drawn plainly, as the import guides draw Google's: greys, the one thing to
/// click as it is labelled there, ringed in amber. No other company's logo or screenshot.
struct ConnectDrawing: View {
    enum Kind { case plugins, addMenu, form, allow, listing }
    var kind: Kind
    var server = "https://mcp.pintonotes.com"

    var body: some View {
        switch kind {
        case .plugins:
            browser("chatgpt.com/plugins") {
                VStack(alignment: .leading, spacing: 12) {
                    header(addRinged: true)
                    pluginGrid
                }
            }
        case .addMenu:
            browser("chatgpt.com/plugins") {
                VStack(alignment: .leading, spacing: 12) {
                    header(addRinged: false)
                    pluginGrid
                }
                .overlay(alignment: .topTrailing) {
                    VStack(alignment: .leading, spacing: 8) {
                        menuItem("at", "Create plugin").opacity(0.55)
                        menuItem("doc.badge.plus", "Upload plugin archive").opacity(0.55)
                        ring { menuItem("link", "Add custom MCP server").fontWeight(.semibold) }
                    }
                    .padding(10)
                    .background(paper, in: .rect(cornerRadius: 9))
                    .shadow(color: .black.opacity(0.18), radius: 8, y: 3)
                    .offset(y: 30)
                }
            }
        case .form:
            browser("chatgpt.com/plugins") {
                VStack(alignment: .leading, spacing: 7) {
                    Text("Add custom MCP server").font(.system(size: 12, weight: .semibold)).foregroundStyle(ink)
                    fieldRow("Name", "Pinto Notes")
                    Text("Connection").font(.system(size: 9.5, weight: .medium)).foregroundStyle(ink.opacity(0.6))
                    ring { field(server, strong: true).frame(width: 250) }
                    fieldRow("Authentication", "OAuth")
                    HStack(spacing: 6) {
                        RoundedRectangle(cornerRadius: 3).fill(ink)
                            .overlay { Image(systemName: "checkmark").font(.system(size: 7, weight: .heavy)).foregroundStyle(.white) }
                            .frame(width: 11, height: 11)
                        Text("I understand and want to continue").font(.system(size: 9.5, weight: .medium)).foregroundStyle(ink)
                    }
                    HStack(spacing: 6) {
                        Spacer()
                        pill("Cancel", filled: false)
                        pill("Create as a plugin", filled: true)
                    }
                }
            }
        case .allow:
            ZStack(alignment: .bottomTrailing) {
                browser("pintonotes.com/connect") {
                    VStack(alignment: .leading, spacing: 10) {
                        AppMark(size: 28)
                        Text("Connect ChatGPT to Pinto Notes").font(.system(size: 12, weight: .semibold)).foregroundStyle(ink)
                        bar(150, 6)
                        ring { pill("Open Pinto Notes", filled: true, amber: true) }
                    }
                }
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 6) {
                        AppMark(size: 16)
                        Text("Allow ChatGPT?").font(.system(size: 11, weight: .bold)).foregroundStyle(ink)
                    }
                    bar(130, 5); bar(100, 5)
                    HStack(spacing: 6) {
                        Spacer()
                        pill("Cancel", filled: false)
                        ring { pill("Allow", filled: true, amber: true) }
                    }
                }
                .padding(12)
                .frame(width: 170)
                .background(paper, in: .rect(cornerRadius: 10))
                .shadow(color: .black.opacity(0.22), radius: 12, y: 4)
                .padding(.trailing, 14)
                .padding(.bottom, 2)
                .environment(\.colorScheme, .light)
            }
        case .listing:
            browser("chatgpt.com/plugins") {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 10) {
                        AppMark(size: 34)
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Pinto Notes").font(.system(size: 13, weight: .semibold)).foregroundStyle(ink)
                            bar(110, 5)
                        }
                        Spacer()
                        ring { pill("Connect", filled: true) }
                    }
                    bar(240, 6); bar(200, 6); bar(220, 6)
                }
            }
        }
    }

    // ChatGPT's Plugins header: the title, search, and Add.
    private func header(addRinged: Bool) -> some View {
        HStack(spacing: 8) {
            Text("Plugins").font(.system(size: 14, weight: .bold)).foregroundStyle(ink)
            Spacer()
            Capsule().strokeBorder(Color.gray.opacity(0.35)).frame(width: 90, height: 18)
            if addRinged { ring { addButton } } else { addButton }
        }
    }

    private var addButton: some View {
        HStack(spacing: 3) {
            Text("Add")
            Image(systemName: "chevron.down").font(.system(size: 7, weight: .bold))
        }
        .font(.system(size: 10.5, weight: .semibold))
        .foregroundStyle(ink)
        .padding(.horizontal, 10).padding(.vertical, 4)
        .background(Color.gray.opacity(0.18), in: .capsule)
    }

    private var pluginGrid: some View {
        VStack(alignment: .leading, spacing: 9) {
            ForEach(0..<3, id: \.self) { _ in
                HStack(spacing: 22) {
                    pluginRow
                    pluginRow
                }
            }
        }
    }

    private var pluginRow: some View {
        HStack(spacing: 7) {
            RoundedRectangle(cornerRadius: 5).fill(Color.gray.opacity(0.25)).frame(width: 18, height: 18)
            VStack(alignment: .leading, spacing: 3) { bar(54, 5, dark: true); bar(76, 4) }
            Spacer(minLength: 0)
            Image(systemName: "plus").font(.system(size: 8, weight: .semibold)).foregroundStyle(ink.opacity(0.4))
        }
        .frame(width: 140)
    }

    private func menuItem(_ symbol: String, _ title: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: symbol).font(.system(size: 9))
            Text(title).font(.system(size: 10.5))
        }
        .foregroundStyle(ink)
    }

    private func fieldRow(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label).font(.system(size: 9.5, weight: .medium)).foregroundStyle(ink.opacity(0.6))
            field(value, strong: label == "Name")
        }
    }

    private func field(_ value: String, strong: Bool) -> some View {
        Text(value)
            .font(.system(size: 10, weight: strong ? .medium : .regular))
            .foregroundStyle(ink.opacity(strong ? 1 : 0.6))
            .lineLimit(1)
            .padding(.horizontal, 8).padding(.vertical, 4)
            .frame(width: 250, alignment: .leading)
            .background(Color.gray.opacity(0.10), in: .rect(cornerRadius: 5))
    }

    // A browser window, drawn plainly: the address, and the page under it.
    private func browser(_ address: String, @ViewBuilder _ page: () -> some View) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                ForEach(0..<3, id: \.self) { _ in Circle().fill(Color.gray.opacity(0.35)).frame(width: 7, height: 7) }
                Text(address)
                    .font(.system(size: 10, weight: .medium)).foregroundStyle(ink.opacity(0.6))
                    .padding(.horizontal, 10).padding(.vertical, 3)
                    .frame(maxWidth: .infinity)
                    .background(Color.gray.opacity(0.14), in: .capsule)
                    .padding(.horizontal, 26)
            }
            .padding(.horizontal, 10)
            .frame(height: 26)
            .background(Color.gray.opacity(0.08))
            page()
                .padding(16)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .background(paper)
        .clipShape(.rect(cornerRadius: 9))
        .shadow(color: .black.opacity(0.12), radius: 10, y: 4)
        .padding(.horizontal, 28)
        .padding(.top, 20)
        .padding(.bottom, -10)
        .environment(\.colorScheme, .light)
    }

    private let ink = Color(white: 0.15)
    private let paper = Color(white: 0.99)

    private func bar(_ w: CGFloat, _ h: CGFloat, dark: Bool = false) -> some View {
        Capsule().fill(Color.gray.opacity(dark ? 0.45 : 0.22)).frame(width: w, height: h)
    }

    private func ring(@ViewBuilder _ content: () -> some View) -> some View {
        content()
            .padding(.horizontal, 5).padding(.vertical, 4)
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color(Palette.amberButton), lineWidth: 2.5).padding(-2))
    }

    private func pill(_ title: String, filled: Bool, amber: Bool = false) -> some View {
        let fill = amber ? Color(Palette.amberButton) : ink
        return Text(title).font(.system(size: 10, weight: .semibold))
            .foregroundStyle(filled ? .white : ink)
            .padding(.horizontal, 11).padding(.vertical, 5)
            .background(filled ? fill : Color.gray.opacity(0.14), in: .capsule)
    }
}
