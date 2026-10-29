import Supabase
import SwiftUI

// Connect ChatGPT or Claude when the whole yes happens in the browser (29 October 2026). For an
// account whose key the server keeps a copy of, pintonotes.com/connect signs the person in, shows
// what is shared and with whom, and makes the connection when they choose Allow: no app, no
// number. So starting in Pinto is one screen with one button: pick the AI, read one sentence, open
// its connector page. The sheet waits and says Connected by itself when the server's connection
// appears (ConnectGuideRun's watch: the ai_connected notice, or the list every two seconds).
//
// Accounts without a copy on the server (Advanced protection, or not chosen yet) keep the guides
// and the Allow sheet in the app: nothing here is used for them.

/// Whether the yes happens on the web, and what the browser sheet says. Pure, apart from `onWeb`.
enum BrowserConnect {
    typealias Guide = ConnectAISection.Guide

    /// The account's key is kept on the server too, so the connect page allows it by itself.
    @MainActor static var onWeb: Bool { AccountCrypto.shared.serverCopy }

    /// The AIs the sheet offers. On iPhone only ChatGPT: Claude is added on a computer until its
    /// new listing is out (Mac first, 28 October 2026), and its row keeps sending the link there.
    static func offered(compact: Bool = ConnectBrowserSheet.compact) -> [Guide] { compact ? [.chatgpt] : [.chatgpt, .claude] }

    /// Pressing this AI's row opens the browser sheet instead of the guide or the row's own start.
    static func opensSheet(_ g: Guide, onWeb: Bool, compact: Bool = ConnectBrowserSheet.compact) -> Bool {
        onWeb && offered(compact: compact).contains(g)
    }

    static let title = "Connect an AI"

    /// The one sentence: what the button does, and what to do there.
    static func line(_ g: Guide, listing: URL? = ChatGPTPlugin.listing) -> String {
        switch g {
        case .claude:
            return "Claude opens Pinto Notes in its connector directory. Choose Connect, then sign in and choose Allow on the Pinto Notes page."
        default:
            // Pinto Notes is one of ChatGPT's apps (published 28 October 2026): its page there, as
            // ConnectWebGuide.chatgpt says it. Without the listing, the plugins with the address.
            let click = ConnectWebGuide.click
            if listing != nil { return "ChatGPT opens Pinto Notes in its apps. \(click) Connect, then sign in and choose Allow on the Pinto Notes page." }
            return "ChatGPT opens its plugins with the address copied. \(click) Add and paste it, then sign in and choose Allow on the Pinto Notes page."
        }
    }

    /// The company that gets what the AI opens.
    static func maker(_ g: Guide) -> String { ConnectTrust.makers[g.title] ?? g.title }

    /// What leaves and who gets it, and that nothing does before Allow (App Review 5.1.1, 5.1.2).
    static func sharedLead(_ g: Guide) -> String { "Shared with \(maker(g))." }
    static func shared(_ g: Guide) -> String {
        "The notes \(g.title) opens, with their text and files, are sent to \(maker(g)) and handled under \(maker(g))\u{2019}s privacy policy. Nothing is shared until you choose Allow."
    }

    /// ChatGPT's button names where it goes once Pinto Notes is listed, as the ChatGPT guide's does.
    // MARK: The Mac's popup: the wide Allow sheet, without the number (Emil, 29 October 2026)

    /// The popup's title, as the Allow sheet asks it.
    static func question(_ g: Guide) -> String { "Connect \(g.title) to your notes?" }
    /// Under the title: what happens after Connect.
    static func next(_ g: Guide) -> String { "\(g.title) opens next. Choose Connect there." }
    /// The Allow sheet's words for what is sent, word for word (ConsentSheet.sent).
    static func sent(_ g: Guide) -> String {
        "The notes \(g.title) opens, with their text and files, are sent to \(maker(g)) and handled under \(maker(g))\u{2019}s privacy policy."
    }
    static let lockedLead = "Locked notes stay private."
    static func lockedDetail(_ g: Guide) -> String { "\(g.title) can\u{2019}t open them." }
    static func instead(_ g: Guide) -> String { "Connect \(g.title) instead" }

    static func button(_ g: Guide, listing: URL? = ChatGPTPlugin.listing) -> String {
        g == .chatgpt && listing != nil ? "Open Pinto Notes in ChatGPT" : "Open \(g.title)"
    }
    static func waiting(_ g: Guide) -> String { "Waiting for \(g.title)\u{2026}" }
    static func connected(_ g: Guide) -> String { "\(g.title) is connected" }
    static let noticed = "Pinto noticed the connection. Ask it about your notes:"
    /// Claude's fallback: its Add custom connector dialog, filled in.
    static let customConnector = "Add as a custom connector instead"

    // MARK: Connect here is the Allow (29 October 2026)

    /// Connect in this sheet counts as the Allow: the server keeps a pre-approval for this AI for
    /// 10 minutes, and the AI's page opens through pintonotes.com/connect/start, which keeps the
    /// key to it in that browser. When the AI's sign-in reaches the Pinto Notes page, the page
    /// shows a brief Connected and goes straight back (supabase/functions/mcp/oauth.ts,
    /// preapprove). Nil when the server says no or can't be reached: the AI's page opens as it
    /// did, and the web page signs in and asks.
    static func oneClick(_ link: URL, ai: Guide, send: ConnectAPI.Send) async -> URL? {
        guard ai == .chatgpt || ai == .claude,
              let data = try? await send("/connect/preapprove", "POST", ["ai": ai.title]),
              let body = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let start = (body["start"] as? String).flatMap(URL.init(string:)),
              start.scheme == "https" || ["127.0.0.1", "localhost"].contains(start.host ?? "")
        else { return nil }
        return through(start, to: link)
    }

    /// The start page's address with the AI's page added to its fragment (`to`), next to the ticket.
    static func through(_ start: URL, to link: URL) -> URL {
        guard var c = URLComponents(url: start, resolvingAgainstBaseURL: false) else { return link }
        let to = link.absoluteString.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? ""
        c.percentEncodedFragment = [c.percentEncodedFragment, "to=\(to)"].compactMap { $0?.isEmpty == false ? $0 : nil }.joined(separator: "&")
        return c.url ?? link
    }

    // MARK: Approving on the web, said wherever the app used to say "allow it here"

    /// The connect page's step: the code to scan (in the app), or signing in there (on the web).
    static func allowStep(onWeb: Bool, compact: Bool = ConnectBrowserSheet.compact, kind: String = "iPhone") -> String {
        if onWeb { return "Sign in on the Pinto Notes page that opens, then choose Allow." }
        return compact ? "Scan the code it shows with this \(kind), then choose Allow." : "Choose Open Pinto Notes on this Mac, or scan the code with your iPhone. Then choose Allow."
    }

    /// After the ChatGPT guide's form, or an app's row in Another AI.
    static func allowWhere(onWeb: Bool) -> String { onWeb ? "Choose Allow on the Pinto Notes page." : "Choose Allow when Pinto Notes asks." }
}

extension ConnectWebGuide {
    /// The browser sheet's one page for an AI: its button opens the AI's connector page, and the
    /// page waits once it's open.
    static func browser(_ g: ConnectAISection.Guide, listing: URL? = ChatGPTPlugin.listing) -> ConnectWebGuide {
        let step: Step
        if g == .claude {
            step = Step(title: BrowserConnect.title, text: BrowserConnect.line(.claude), art: .listing,
                        action: BrowserConnect.button(.claude), link: WebConnectPlan.directoryListing, waits: true)
        } else if let listing {
            step = Step(title: BrowserConnect.title, text: BrowserConnect.line(.chatgpt, listing: listing), art: .listing,
                        action: BrowserConnect.button(.chatgpt, listing: listing), link: listing, waits: true)
        } else {
            step = Step(title: BrowserConnect.title, text: BrowserConnect.line(.chatgpt, listing: nil), art: .addMenu,
                        action: BrowserConnect.button(.chatgpt, listing: nil), link: ChatGPTPlugin.plugins, copiesAndMovesOn: true, waits: true)
        }
        return ConnectWebGuide(ai: g, introTitle: BrowserConnect.title, introLine: "", steps: [step], single: true,
                               doneTitle: BrowserConnect.connected(g))
    }
}

// MARK: The sheet

/// Connect ChatGPT or Claude, approved in the browser: the choice, one sentence, what is shared,
/// one button. Presented by `ConnectGuides` for accounts where `BrowserConnect.onWeb`.
struct ConnectBrowserSheet: View {
    typealias Guide = ConnectAISection.Guide
    @State var run: ConnectGuideRun
    var client: SupabaseClient?
    var offered: [Guide]
    /// Another AI was picked here: the funnel follows it (ConnectGuideRoute.guideSwitched).
    var switched: (Guide) -> Void = { _ in }
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    /// The note's page colour, which follows the window's look (DesignLook): white and pure black
    /// in the Mac's plain look, not the fixed cream of `sheetGround`.
    static var ground: Color { Color(Palette.page) }

    #if os(iOS)
    nonisolated static let compact = true
    #else
    nonisolated static let compact = false
    #endif

    init(ai: Guide, client: SupabaseClient, switched: @escaping (Guide) -> Void = { _ in }) {
        _run = State(initialValue: ConnectGuideRun(ai: ai, guide: .browser(ai)))
        self.client = client
        self.offered = BrowserConnect.offered()
        self.switched = switched
    }

    /// Captures and tests: a run as it is.
    init(run: ConnectGuideRun, offered: [Guide] = BrowserConnect.offered()) {
        _run = State(initialValue: run)
        self.offered = offered
    }

    var body: some View {
        content
            #if os(macOS)
            .frame(width: 720)
            .fixedSize(horizontal: false, vertical: true)
            #endif
            .foregroundStyle(Color.ink)
            .background(Self.ground)
            .tint(Color(Palette.amber))
            .presentationBackground(Self.ground)
            #if os(iOS)
            .presentationDetents([.medium, .large])
            #endif
            .onAppear { hook(run) }
            .onDisappear { run.stop() }
            // Should the page hand the yes to the app after all (the server's switch is off), the
            // request to allow shows over this sheet.
            .modifier(ConsentHostIf(client: client))
            .animation(.snappy(duration: 0.2), value: run.stage)
            .animation(.snappy(duration: 0.2), value: run.opened)
    }

    private func hook(_ r: ConnectGuideRun) {
        let link = r.guide?.steps.first?.link
        r.open = { url in
            // The AI's page, opened by Connect: through the start page, so Connect here is the Allow.
            guard let client, url == link else { return openURL(url) }
            Task { openURL(await BrowserConnect.oneClick(url, ai: r.ai, send: ConnectAPI.sender(client)) ?? url) }
        }
        r.close = { dismiss() }
        if let client { r.watch(client) }
    }

    /// Another AI picked before or after its button: a new run for it, watching again.
    private func pick(_ g: Guide) {
        guard g != run.ai, run.stage != .connected else { return }
        run.stop()
        let next = ConnectGuideRun(ai: g, guide: .browser(g), server: run.server)
        run = next
        hook(next)
        switched(g)
    }

    @ViewBuilder private var content: some View {
        #if os(macOS)
        wide
        #else
        stacked
        #endif
    }

    /// The Mac: the wide Allow sheet. Who on the left (the marks, the question, what happens
    /// next), what is shared on the right, Cancel and Connect at the bottom right. Connected keeps
    /// the frame; the question becomes the answer.
    private var wide: some View {
        let done = run.stage == .connected
        return VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top, spacing: 0) {
                VStack(alignment: .leading, spacing: 0) {
                    pair(done: done)
                    Text(done ? BrowserConnect.connected(run.ai) : BrowserConnect.question(run.ai))
                        .font(.system(size: 22, weight: .bold))
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 16)
                        .accessibilityAddTraits(.isHeader)
                        .accessibilityIdentifier(done ? "connect.connected" : "connect.browser.title")
                    if !done {
                        Text(BrowserConnect.next(run.ai)).font(.system(size: 13)).foregroundStyle(Color.muted)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 6)
                            .accessibilityIdentifier("connect.browser.line")
                        if offered.count > 1, let other = offered.first(where: { $0 != run.ai }) {
                            Button(BrowserConnect.instead(other)) { pick(other) }
                                .buttonStyle(.hoverLink)
                                .font(.system(size: 13, weight: .medium))
                                .padding(.top, 10)
                                .accessibilityIdentifier("connect.browser.\(other.rawValue)")
                        }
                    }
                }
                .frame(width: 250, alignment: .leading)
                Rectangle().fill(Color.line).frame(width: 1).padding(.horizontal, 28)
                VStack(alignment: .leading, spacing: 12) {
                    if done {
                        Text("\(BrowserConnect.noticed) \u{201C}\(WebConnectPlan.testPrompt)\u{201D}")
                            .font(.system(size: 14)).foregroundStyle(Color.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        wideFact("paperplane", lead: BrowserConnect.sharedLead(run.ai), BrowserConnect.sent(run.ai))
                            .accessibilityIdentifier("connect.browser.shared")
                        wideFact("lock", lead: BrowserConnect.lockedLead, BrowserConnect.lockedDetail(run.ai))
                            .accessibilityIdentifier("connect.browser.locked")
                        if run.waits { waitingRow.frame(height: 30) }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .topLeading)
            }
            .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 8) {
                Spacer(minLength: 0)
                if done {
                    Button("Ask \(run.ai.title)") { openURL(run.ai == .claude ? WebConnectPlan.claude.testPage : WebConnectPlan.chatgpt.testPage) }
                        .buttonStyle(.secondary(.regular))
                    Button("Done") { dismiss() }
                        .buttonStyle(.amberProminent(.regular))
                        .keyboardShortcut(.defaultAction)
                        .accessibilityIdentifier("connect.browser.primary")
                } else {
                    Button("Cancel") { dismiss() }
                        .buttonStyle(.secondary(.regular))
                        .keyboardShortcut(.cancelAction)
                        .accessibilityIdentifier("connect.browser.close")
                    Button(run.waits ? "Open \(run.ai.title) again" : "Connect") { run.waits ? run.quiet() : run.primary() }
                        .buttonStyle(.amberProminent(.regular))
                        .keyboardShortcut(.defaultAction)
                        .accessibilityIdentifier("connect.browser.primary")
                }
            }
            .padding(.top, 24)
        }
        .padding(24)
    }

    /// The AI's tile, three dots (a tick once connected) and Pinto's icon.
    private func pair(done: Bool) -> some View {
        HStack(spacing: 7) {
            AITile(ai: run.ai.title, size: 40).accessibilityLabel(run.ai.title)
            Group {
                if done {
                    Image(systemName: "checkmark.circle.fill").font(.system(size: 16))
                        .symbolRenderingMode(.palette).foregroundStyle(.white, Color(Palette.amberButton))
                } else {
                    HStack(spacing: 3) { ForEach(0..<3, id: \.self) { _ in Circle().fill(Color.muted.opacity(0.5)).frame(width: 3, height: 3) } }
                }
            }
            .accessibilityHidden(true)
            AppMark(size: 40)
        }
        .padding(2)
    }

    /// A fact as a plain line with its glyph: never a box, so it never reads as a choice.
    private func wideFact(_ symbol: String, lead: String, _ detail: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Image(systemName: symbol).foregroundStyle(Color.muted).frame(minWidth: 16).accessibilityHidden(true)
            (Text(lead).fontWeight(.semibold).foregroundColor(Color.ink) + Text(" " + detail))
                .foregroundStyle(Color.muted)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .font(.system(size: 14))
        .accessibilityElement(children: .combine)
    }

    private var stacked: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(run.stage == .connected ? BrowserConnect.connected(run.ai) : BrowserConnect.title)
                    .font(.system(size: Self.compact ? 22 : 17, weight: .bold))
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier(run.stage == .connected ? "connect.connected" : "connect.browser.title")
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                        .frame(width: 26, height: 26)
                        .background(Color.line.opacity(0.6), in: .circle)
                }
                .buttonStyle(.plain)
                .keyboardShortcut(.cancelAction)
                .accessibilityLabel("Close")
                .accessibilityIdentifier("connect.browser.close")
            }
            .padding(.bottom, 16)
            if run.stage == .connected { connected } else { asking }
        }
        .padding(Self.compact ? 22 : 24)
    }

    /// What the button says: the page's own (it knows whether Pinto Notes is listed).
    private var action: String { run.guide?.steps.first?.action ?? BrowserConnect.button(run.ai) }

    private var asking: some View {
        VStack(alignment: .leading, spacing: 16) {
            if offered.count > 1 { choices }
            Text(run.guide?.steps.first?.text ?? BrowserConnect.line(run.ai))
                .font(Self.compact ? .body : .system(size: 14))
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("connect.browser.line")
            shared
            VStack(spacing: 4) {
                if run.waits {
                    waitingRow
                    quiet(run.ai == .claude ? BrowserConnect.customConnector : "\(action) again") {
                        if run.ai == .claude { openURL(WebConnectPlan.installLink(server: run.server)) } else { run.quiet() }
                    }
                } else {
                    primary(action, symbol: "arrow.up.right") { run.primary() }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 4)
        }
    }

    /// ChatGPT or Claude, side by side; the picked one lit.
    private var choices: some View {
        HStack(spacing: BigChoices.Metrics.gap) {
            ForEach(offered) { g in
                let shape = RoundedRectangle(cornerRadius: BigChoices.Metrics.radius, style: .continuous)
                Button { pick(g) } label: {
                    HStack(spacing: 10) {
                        AITile(ai: g.title, size: BigChoices.Metrics.rowMark)
                        Text(g.title).font(BigChoices.Metrics.title).foregroundStyle(Color.ink)
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, BigChoices.Metrics.padding)
                    .frame(maxWidth: .infinity, minHeight: BigChoices.Metrics.rowHeight, alignment: .leading)
                    .choiceCard(shape, lit: run.ai == g)
                }
                .buttonStyle(CardPress())
                .accessibilityAddTraits(run.ai == g ? .isSelected : [])
                .accessibilityIdentifier("connect.browser.\(g.rawValue)")
            }
        }
    }

    /// What is shared and with whom, always in view.
    private var shared: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Image(systemName: "paperplane")
                .font(Self.compact ? .callout : .system(size: 13))
                .foregroundStyle(Color.muted)
                .accessibilityHidden(true)
            (Text(BrowserConnect.sharedLead(run.ai)).fontWeight(.semibold).foregroundColor(Color.ink) + Text(" " + BrowserConnect.shared(run.ai)))
                .font(Self.compact ? .callout : .system(size: 13))
                .foregroundStyle(Color.muted)
                .lineSpacing(1.5)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("connect.browser.shared")
    }

    private var waitingRow: some View {
        HStack(spacing: 8) {
            ProgressView().controlSize(.small)
            Text(BrowserConnect.waiting(run.ai)).font(.system(size: Self.compact ? 15 : 13, weight: .medium)).foregroundStyle(Color.muted)
        }
        .frame(height: Self.compact ? 50 : 40)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("connect.waiting")
    }

    private var connected: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 14) {
                ZStack(alignment: .bottomTrailing) {
                    AITile(ai: run.ai.title, size: 48)
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20))
                        .symbolRenderingMode(.palette)
                        .foregroundStyle(.white, Color(Palette.amberButton))
                        .background(Circle().fill(Self.ground).padding(-2))
                        .offset(x: 6, y: 5)
                }
                .accessibilityHidden(true)
                Text("\(BrowserConnect.noticed) \u{201C}\(WebConnectPlan.testPrompt)\u{201D}")
                    .font(Self.compact ? .body : .system(size: 14))
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            VStack(spacing: 4) {
                primary("Done") { dismiss() }
                quiet("Ask \(run.ai.title)") { openURL(run.ai == .claude ? WebConnectPlan.claude.testPage : WebConnectPlan.chatgpt.testPage) }
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func primary(_ title: String, symbol: String? = nil, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(title)
                if let symbol { Image(systemName: symbol).font(.system(size: 12, weight: .bold)) }
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.amberProminent(Self.compact ? .big : .regular, wide: true))
        .keyboardShortcut(.defaultAction)
        .accessibilityIdentifier("connect.browser.primary")
    }

    private func quiet(_ title: String, _ action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .buttonStyle(.hoverLink)
            .font(.system(size: Self.compact ? 15 : 13, weight: .medium))
            .foregroundStyle(Color.muted)
            .frame(height: 30)
            .accessibilityIdentifier("connect.browser.quiet")
    }
}
