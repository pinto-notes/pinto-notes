import SwiftUI

// Design study, not for shipping: three ways to connect an AI, drawn with the app's own pieces
// (fonts, palette, the amber button, the AI tiles, the welcome picture) so the pictures show what
// the real thing would look like. Every state is an input; nothing here talks to a server.
// Rendered by PaneTests/HIG/ConnectDesignSnapshots.swift and played in the lab window
// (-connectDesignLab A|B|C) for the screen recordings.

enum ConnectDesign {
    enum Alt: String, CaseIterable { case a = "A", b = "B", c = "C" }

    enum AI: String, CaseIterable, Identifiable {
        case chatgpt, claude, claudeCode, codex, other
        var id: String { rawValue }
        var title: String {
            switch self {
            case .chatgpt: "ChatGPT"
            case .claude: "Claude"
            case .claudeCode: "Claude Code"
            case .codex: "Codex"
            case .other: "Another AI"
            }
        }
        /// Runs in a terminal: the Mac app can add it itself.
        var terminal: Bool { self == .claudeCode || self == .codex }

        /// The one button that starts it.
        var connect: String {
            switch self {
            case .other: "Copy Link for Your AI"
            default: "Connect \(title)"
            }
        }

        /// What happens, in one plain line, before the press.
        var promise: String {
            #if os(macOS)
            switch self {
            case .chatgpt: "ChatGPT needs Pinto Notes added once. We show you where."
            case .claude: "Claude opens. Choose Connect, then Allow."
            case .claudeCode: "Pinto Notes adds itself to Claude Code. Then choose Allow."
            case .codex: "Pinto Notes adds itself to Codex. Then choose Allow."
            case .other: "Paste the link where your AI app adds apps."
            }
            #else
            switch self {
            case .chatgpt: "ChatGPT needs Pinto Notes added once, on a computer."
            case .claude: "Claude adds it once, on a computer. Then it works here too."
            case .claudeCode, .codex: "\(title) runs on your computer. Your Mac adds it in one click."
            case .other: "Paste the link where your AI app adds apps."
            }
            #endif
        }

        /// While it is happening.
        var waiting: String {
            #if os(macOS)
            switch self {
            case .chatgpt: "Follow the steps next to ChatGPT."
            case .claude: "Choose Connect in Claude, then Allow."
            case .claudeCode, .codex: "Your browser opened. Choose Allow."
            case .other: "Link copied. Paste it in your AI app."
            }
            #else
            switch self {
            case .other: "Link copied. Paste it in your AI app."
            default: "Open the link on your computer. This finishes by itself."
            }
            #endif
        }

        /// Why it stopped, said plainly.
        var failed: String {
            #if os(iOS)
            if self != .other { return "\(title) didn\u{2019}t finish on your computer." }
            #endif
            switch self {
            case .chatgpt: "ChatGPT didn\u{2019}t finish adding Pinto Notes."
            case .claude: "Claude didn\u{2019}t finish. The page may have closed."
            case .claudeCode: "Claude Code isn\u{2019}t on this Mac yet."
            case .codex: "Codex isn\u{2019}t on this Mac yet."
            case .other: "Nothing asked to connect yet."
            }
        }
    }

    enum Phase: String, CaseIterable { case rest, waiting, connected, failed, disconnecting }
    enum Place: String, CaseIterable { case flow, sheet, settings }

    /// One picture's worth of state.
    struct Look {
        var alt: Alt
        var place: Place = .flow
        var ai: AI? = nil
        var phase: Phase = .rest
        /// Already connected before this (sheet and Settings list them).
        var connected: [AI] = []
        /// C: what was found on this device.
        var found: [AI] = Look.foundHere
        /// C: the found ones that are done, while the rest are still going.
        var foundDone: [AI] = []
        /// C: "Use a different AI" is open.
        var picking = false
        /// The lab: the press itself (the button held down).
        var pressed = false

        #if os(macOS)
        static let foundHere: [AI] = [.claude, .claudeCode]
        #else
        static let foundHere: [AI] = [.chatgpt]
        #endif
    }

    static let title = "Connect your AI"
    static let line = "Your AI can then read and write your notes when you ask it to."
    static let trouble = "Having trouble?"
    static let skip = "Skip for now"
    static let link = "https://mcp.pintonotes.com"
}

// MARK: Shared pieces

extension ConnectDesign {
    /// An AI's mark; Claude Code and Codex carry a small terminal badge so they don't read as twins.
    struct Mark: View {
        let ai: AI
        var size: CGFloat
        var body: some View {
            AITile(ai: ai.title, size: size)
                .overlay(alignment: .bottomTrailing) {
                    if ai.terminal {
                        Image(systemName: "apple.terminal.fill")
                            .font(.system(size: size * 0.24, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: size * 0.4, height: size * 0.4)
                            .background(Color(white: 0.18), in: .rect(cornerRadius: size * 0.1, style: .continuous))
                            .offset(x: size * 0.1, y: size * 0.1)
                    }
                }
        }
    }

    /// The single amber control.
    struct Primary: View {
        let title: String
        var busy = false
        var pressed = false
        var action: () -> Void = {}
        var body: some View {
            Button(title, action: action)
                .buttonStyle(.amberProminent(height: SignInView.Row.height + 6, cornerRadius: SignInView.Row.radius + 2))
                .amberBusy(busy)
                .scaleEffect(pressed ? 0.97 : 1)
                .opacity(pressed ? 0.85 : 1)
        }
    }

    /// A quiet way: grey words, no fill.
    struct Quiet: View {
        let title: String
        var action: () -> Void = {}
        var body: some View {
            Button(action: action) {
                Text(title).frame(minHeight: Metrics.quietHeight).contentShape(.rect)
            }
            .buttonStyle(.hoverLink)
            .font(Metrics.quiet)
            .foregroundStyle(Color.muted)
        }
    }

    /// A state line under a choice: a spinner while waiting, a check once connected.
    struct Status: View {
        let phase: Phase
        let text: String
        var body: some View {
            HStack(spacing: 6) {
                switch phase {
                case .waiting, .disconnecting: ProgressView().controlSize(.small).scaleEffect(0.8).frame(width: 14, height: 14)
                case .connected: Image(systemName: "checkmark.circle.fill").foregroundStyle(.white, .green)
                case .failed: Image(systemName: "exclamationmark.circle.fill").foregroundStyle(.white, Color(red: 0.86, green: 0.33, blue: 0.24))
                case .rest: EmptyView()
                }
                Text(text).foregroundStyle(phase == .rest ? Color.muted : Color.ink)
            }
            .font(Metrics.status)
        }
    }

    enum Metrics {
        #if os(macOS)
        static let title = Font.system(size: 28, weight: .heavy)
        static let line = Font.system(size: 15)
        static let name = Font.system(size: 13, weight: .semibold)
        static let status = Font.system(size: 12)
        static let quiet = Font.system(size: 13, weight: .medium)
        static let quietHeight: CGFloat = 28
        static let sheetTitle = Font.system(size: 22, weight: .heavy)
        #else
        static let title = Font.title.weight(.heavy)
        static let line = Font.body
        static let name = Font.subheadline.weight(.semibold)
        static let status = Font.footnote
        static let quiet = Font.subheadline.weight(.medium)
        static let quietHeight: CGFloat = 44
        static let sheetTitle = Font.title2.weight(.heavy)
        #endif
    }

    /// What is connected, at the top of the sheet and Settings: each with a quiet Disconnect.
    struct ConnectedList: View {
        let rows: [AI]
        /// The one being disconnected right now.
        var going: AI? = nil
        var body: some View {
            VStack(spacing: 0) {
                ForEach(Array(rows.enumerated()), id: \.element) { i, ai in
                    if i > 0 { Divider().padding(.leading, 44) }
                    HStack(spacing: 10) {
                        Mark(ai: ai, size: 28)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(ai.title).font(Metrics.name).foregroundStyle(Color.ink)
                            Text(going == ai ? "Disconnecting\u{2026}" : "Connected").font(Metrics.status).foregroundStyle(Color.muted)
                        }
                        Spacer(minLength: 8)
                        if going == ai {
                            ProgressView().controlSize(.small)
                        } else {
                            Button("Disconnect") {}
                                .buttonStyle(.hoverText)
                                .font(Metrics.status)
                                .foregroundStyle(Color.muted)
                        }
                    }
                    .padding(.vertical, 9)
                    .padding(.horizontal, 12)
                    .opacity(going == ai ? 0.7 : 1)
                }
            }
            .background(Color(Palette.field), in: .rect(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
        }
    }
}

// MARK: A: the step is the connector

/// Big AI tiles. Pressing one opens that AI and the tile itself says what is happening.
struct ConnectDesignA: View {
    let look: ConnectDesign.Look
    typealias AI = ConnectDesign.AI

    private func phase(_ ai: AI) -> ConnectDesign.Phase {
        if look.ai == ai { return look.phase }
        return look.connected.contains(ai) ? .connected : .rest
    }

    private var columns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: Self.gap), count: 3)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            LazyVGrid(columns: columns, spacing: Self.gap) {
                ForEach(AI.allCases) { ai in tile(ai) }
            }
            if let ai = look.ai, look.phase != .rest {
                Text(line(ai))
                    .font(ConnectDesign.Metrics.status)
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .transition(.opacity)
            }
        }
    }

    private func line(_ ai: AI) -> String {
        switch look.phase {
        case .waiting: ai.waiting
        case .failed: ai.failed
        case .connected: "Ask \(ai.title) about your notes any time."
        case .disconnecting: "\(ai.title) loses access right away."
        case .rest: ""
        }
    }

    private func tile(_ ai: AI) -> some View {
        let p = phase(ai)
        let active = look.ai == ai && p == .waiting
        let shape = RoundedRectangle(cornerRadius: Self.radius, style: .continuous)
        return Button {} label: {
            VStack(spacing: 8) {
                ConnectDesign.Mark(ai: ai, size: Self.mark)
                    .overlay(alignment: .topTrailing) {
                        if p == .connected {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: Self.mark * 0.38, weight: .semibold))
                                .foregroundStyle(.white, .green)
                                .offset(x: Self.mark * 0.18, y: -Self.mark * 0.18)
                        }
                    }
                Text(ai.title).font(ConnectDesign.Metrics.name).foregroundStyle(Color.ink).lineLimit(1).minimumScaleFactor(0.8)
                status(ai, p)
            }
            .frame(maxWidth: .infinity, minHeight: Self.height)
            .padding(.vertical, 10)
            .background(active ? Color.amberSoft : Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(active ? Color(Palette.amber) : Color(Palette.fieldHairline), lineWidth: active ? 1.5 : 1))
            .scaleEffect(look.pressed && look.ai == ai ? 0.96 : 1)
            .opacity(look.ai != nil && look.ai != ai && look.phase == .waiting ? 0.45 : 1)
            .contentShape(shape)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder private func status(_ ai: AI, _ p: ConnectDesign.Phase) -> some View {
        switch p {
        case .rest: Text(" ").font(ConnectDesign.Metrics.status)
        case .waiting: ConnectDesign.Status(phase: .waiting, text: "Waiting\u{2026}")
        case .connected:
            if look.place == .flow {
                Text("Connected").font(ConnectDesign.Metrics.status).foregroundStyle(Color.muted)
            } else {
                Text("Disconnect").font(ConnectDesign.Metrics.status).foregroundStyle(Color.muted).underline()
            }
        case .failed: Text("Try again").font(ConnectDesign.Metrics.status.weight(.semibold)).foregroundStyle(Color.amberInk)
        case .disconnecting: ConnectDesign.Status(phase: .disconnecting, text: "Disconnecting\u{2026}")
        }
    }

    #if os(macOS)
    static let gap: CGFloat = 10, radius: CGFloat = 12, mark: CGFloat = 40, height: CGFloat = 92
    #else
    static let gap: CGFloat = 10, radius: CGFloat = 16, mark: CGFloat = 46, height: CGFloat = 104
    #endif
}

// MARK: B: which AI do you use?

/// A row of small icons; picking one shows one big button that does it.
struct ConnectDesignB: View {
    let look: ConnectDesign.Look
    typealias AI = ConnectDesign.AI

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top, spacing: 0) {
                ForEach(AI.allCases) { ai in icon(ai).frame(maxWidth: .infinity) }
            }
            if let ai = look.ai {
                VStack(alignment: .leading, spacing: 12) {
                    switch look.phase {
                    case .rest:
                        Text(ai.promise).font(ConnectDesign.Metrics.line).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
                        ConnectDesign.Primary(title: ai.connect, pressed: look.pressed)
                    case .waiting:
                        Text(ai.waiting).font(ConnectDesign.Metrics.line).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
                        waitingBar(ai)
                    case .connected:
                        done(ai)
                    case .failed:
                        ConnectDesign.Status(phase: .failed, text: ai.failed)
                        ConnectDesign.Primary(title: "Try Again")
                    case .disconnecting:
                        ConnectDesign.Status(phase: .disconnecting, text: "Disconnecting \(ai.title)\u{2026}")
                    }
                }
                .transition(.opacity.combined(with: .offset(y: 6)))
            } else {
                Text("Pick yours. You can add more later.")
                    .font(ConnectDesign.Metrics.line).foregroundStyle(Color.muted)
            }
        }
    }

    /// The button turned quiet while it works: no second thing to press.
    private func waitingBar(_ ai: AI) -> some View {
        HStack(spacing: 10) {
            ProgressView().controlSize(.small)
            Text("Waiting for \(ai.title)\u{2026}").font(ConnectDesign.Metrics.name).foregroundStyle(Color.ink)
        }
        .frame(maxWidth: .infinity, minHeight: SignInView.Row.height + 6)
        .background(Color(Palette.field), in: .rect(cornerRadius: SignInView.Row.radius + 2, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: SignInView.Row.radius + 2, style: .continuous).strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
    }

    private func done(_ ai: AI) -> some View {
        HStack(spacing: 12) {
            ConnectDesign.Mark(ai: ai, size: 36)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(ai.title) is connected").font(ConnectDesign.Metrics.name).foregroundStyle(Color.ink)
                Text(look.place == .flow ? "Moving on\u{2026}" : "Ask \(ai.title) about your notes any time.")
                    .font(ConnectDesign.Metrics.status).foregroundStyle(Color.muted)
            }
            Spacer(minLength: 0)
            Image(systemName: "checkmark.circle.fill").font(.title2).foregroundStyle(.white, .green)
        }
        .padding(12)
        .background(Color(Palette.field), in: .rect(cornerRadius: 12, style: .continuous))
    }

    private func icon(_ ai: AI) -> some View {
        let picked = look.ai == ai
        let dim = look.ai != nil && !picked
        return VStack(spacing: 6) {
            ConnectDesign.Mark(ai: ai, size: Self.mark)
                .padding(4)
                .overlay(RoundedRectangle(cornerRadius: Self.mark * 0.36, style: .continuous)
                    .strokeBorder(picked ? Color(Palette.amber) : .clear, lineWidth: 2))
                .overlay(alignment: .topTrailing) {
                    if look.connected.contains(ai) {
                        Image(systemName: "checkmark.circle.fill").font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white, .green).offset(x: 3, y: -3)
                    }
                }
            Text(ai.title)
                .font(.system(size: Self.label, weight: picked ? .semibold : .regular))
                .foregroundStyle(picked ? Color.ink : Color.muted)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .opacity(dim ? 0.5 : 1)
    }

    #if os(macOS)
    static let mark: CGFloat = 40, label: CGFloat = 11
    #else
    static let mark: CGFloat = 44, label: CGFloat = 12
    #endif
}

// MARK: C: what's already here

/// Looks for AI apps on this device and offers the ones it found as one sentence and one button.
/// Every other AI is one quiet link away.
struct ConnectDesignC: View {
    let look: ConnectDesign.Look
    typealias AI = ConnectDesign.AI

    private var found: [AI] { look.found }

    private var names: String {
        switch found.count {
        case 0: ""
        case 1: found[0].title
        case 2: "\(found[0].title) and \(found[1].title)"
        default: found.dropLast().map(\.title).joined(separator: ", ") + " and " + found.last!.title
        }
    }

    #if os(macOS)
    private static let here = "this Mac"
    #else
    private static let here = "this iPhone"
    #endif

    private var button: String {
        #if os(macOS)
        found.count == 1 ? found[0].connect : found.count == 2 ? "Connect Both" : "Connect All \(found.count)"
        #else
        "Send to My Mac"
        #endif
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if look.picking || found.isEmpty {
                ConnectDesignB(look: .init(alt: .b, place: look.place, ai: look.ai, phase: look.phase, connected: look.connected, pressed: look.pressed))
                if !found.isEmpty { ConnectDesign.Quiet(title: "Back to what we found") }
            } else {
                hero
                if look.phase == .rest || look.phase == .failed { ConnectDesign.Quiet(title: "Use a different AI") }
            }
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: -8) {
                ForEach(found) { ai in ConnectDesign.Mark(ai: ai, size: 48).zIndex(ai == found.first ? 1 : 0) }
            }
            Text("\(names) \(found.count == 1 ? "is" : "are") on \(Self.here).")
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            if look.phase == .rest {
                #if os(macOS)
                Text(found.allSatisfy(\.terminal) ? "Pinto Notes adds itself. Then choose Allow." : "One click each. Then choose Allow.")
                    .font(ConnectDesign.Metrics.line).foregroundStyle(Color.muted)
                #else
                Text("Connecting it takes a computer, once. Your Mac does it in one click.")
                    .font(ConnectDesign.Metrics.line).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
                #endif
                ConnectDesign.Primary(title: button, pressed: look.pressed)
            } else {
                rows
                if look.phase == .failed { ConnectDesign.Primary(title: "Try Again") }
            }
        }
    }

    /// Each found AI ticks on its own.
    private var rows: some View {
        VStack(spacing: 0) {
            ForEach(Array(found.enumerated()), id: \.element) { i, ai in
                if i > 0 { Divider().padding(.leading, 46) }
                HStack(spacing: 10) {
                    ConnectDesign.Mark(ai: ai, size: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(ai.title).font(ConnectDesign.Metrics.name).foregroundStyle(Color.ink)
                        ConnectDesign.Status(phase: phase(ai), text: text(ai))
                    }
                    Spacer(minLength: 0)
                }
                .padding(.vertical, 9)
                .padding(.horizontal, 12)
            }
        }
        .background(Color(Palette.field), in: .rect(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
    }

    private func phase(_ ai: AI) -> ConnectDesign.Phase {
        if look.foundDone.contains(ai) { return .connected }
        if look.ai == nil || look.ai == ai { return look.phase }
        return .waiting
    }

    private func text(_ ai: AI) -> String {
        switch phase(ai) {
        case .waiting: ai.waiting
        case .connected: "Connected"
        case .failed: ai.failed
        case .disconnecting: "Disconnecting\u{2026}"
        case .rest: ""
        }
    }
}

// MARK: Where they sit

/// One alternative in one place: the first-run step, the Connect an AI sheet, or Settings.
struct ConnectDesignScreen: View {
    let look: ConnectDesign.Look
    @Environment(\.colorScheme) private var scheme

    @ViewBuilder var content: some View {
        if look.ai == .chatgpt, look.phase == .waiting {
            ChatGPTIntro(started: true)
        } else {
            switch look.alt {
            case .a: ConnectDesignA(look: look)
            case .b: ConnectDesignB(look: look)
            case .c: ConnectDesignC(look: look)
            }
        }
    }

    /// The sheet and Settings list what is connected; A shows it on the tiles instead.
    private var listed: [ConnectDesign.AI] {
        guard look.alt != .a else { return [] }
        var rows = look.connected
        if look.phase == .disconnecting, let ai = look.ai, !rows.contains(ai) { rows.insert(ai, at: 0) }
        return rows
    }

    /// The step's one amber button lives at the foot only in A (Continue once connected).
    @ViewBuilder private var foot: some View {
        VStack(spacing: 8) {
            if look.place == .flow, look.alt == .a, look.phase == .connected {
                ConnectDesign.Primary(title: "Continue")
            }
            HStack(spacing: 28) {
                if look.place == .flow, look.phase != .connected { ConnectDesign.Quiet(title: ConnectDesign.skip) }
                ConnectDesign.Quiet(title: ConnectDesign.trouble)
            }
        }
        .frame(maxWidth: .infinity)
    }

    var body: some View {
        switch look.place {
        case .flow: flow
        case .sheet: sheet
        case .settings: settings
        }
    }

    private var sheetTitle: String { look.alt == .b && listed.isEmpty ? "Which AI do you use?" : "Connect an AI" }

    private var heading: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(look.alt == .b ? "Which AI do you use?" : ConnectDesign.title)
                .font(ConnectDesign.Metrics.title).tracking(-0.4).foregroundStyle(Color.ink)
            Text(ConnectDesign.line)
                .font(ConnectDesign.Metrics.line).foregroundStyle(Color.muted).lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var progress: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { _ in Capsule().fill(.tint).frame(height: 4) }
        }
        .frame(width: 96)
    }

    @ViewBuilder private var flow: some View {
        #if os(macOS)
        CardLayout {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Label("Back", systemImage: "chevron.left").font(.subheadline.weight(.semibold)).foregroundStyle(Color.muted)
                    Spacer()
                    progress
                }
                .frame(height: 24)
                VStack(alignment: .leading, spacing: 20) {
                    heading
                    content
                }
                .padding(.top, 28)
                Spacer(minLength: 12)
                foot
            }
            .padding(.horizontal, 52)
            .padding(.top, 26)
            .padding(.bottom, 24)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        #else
        ScrollView {
            VStack(spacing: 0) {
                Color.clear.frame(height: 150).overlay { WelcomeFlow.picture }.clipped()
                VStack(alignment: .leading, spacing: 20) {
                    progress
                    heading
                    content
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
            }
        }
        .safeAreaInset(edge: .bottom) { foot.padding(.horizontal, 24).background { Backdrop() } }
        .ignoresSafeArea(.container, edges: .top)
        .background { Backdrop() }
        #endif
    }

    @ViewBuilder private var sheet: some View {
        #if os(macOS)
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text(sheetTitle).font(ConnectDesign.Metrics.sheetTitle).tracking(-0.3).foregroundStyle(Color.ink)
                Spacer()
                Image(systemName: "xmark").font(.system(size: 12, weight: .bold)).foregroundStyle(Color.muted)
                    .frame(width: 26, height: 26).background(.fill.tertiary, in: .circle)
            }
            Text(ConnectDesign.line).font(.system(size: 13)).foregroundStyle(Color.muted).padding(.top, 6).padding(.bottom, 18)
            VStack(alignment: .leading, spacing: 16) {
                if !listed.isEmpty {
                    ConnectDesign.ConnectedList(rows: listed, going: look.phase == .disconnecting ? look.ai : nil)
                    Text("Connect another").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                }
                content
            }
            ConnectDesign.Quiet(title: ConnectDesign.trouble).padding(.top, 14).frame(maxWidth: .infinity)
        }
        .padding(28)
        .frame(width: 480)
        .fixedSize(horizontal: false, vertical: true)
        .background(Color(Palette.sheetGround))
        #else
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text(ConnectDesign.line).foregroundStyle(Color.muted)
                    if !listed.isEmpty { ConnectDesign.ConnectedList(rows: listed, going: look.phase == .disconnecting ? look.ai : nil) }
                    content
                    ConnectDesign.Quiet(title: ConnectDesign.trouble).frame(maxWidth: .infinity)
                }
                .padding(20)
            }
            .background(Color(Palette.sheetGround))
            .navigationTitle(sheetTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") {}.foregroundStyle(Color.muted) } }
        }
        #endif
    }

    @ViewBuilder private var settings: some View {
        #if os(macOS)
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                Text("Connect an AI").font(.system(size: 15, weight: .bold)).foregroundStyle(Color.ink)
                HStack {
                    Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold)).foregroundStyle(Color.muted)
                        .frame(width: 28, height: 28).background(.fill.tertiary, in: .circle)
                    Spacer()
                    Text("Done").font(.system(size: 13, weight: .semibold)).foregroundStyle(Color.muted)
                }
            }
            .padding(.bottom, 18)
            VStack(alignment: .leading, spacing: 16) {
                if !listed.isEmpty {
                    Text("Connected").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                    ConnectDesign.ConnectedList(rows: listed, going: look.phase == .disconnecting ? look.ai : nil)
                }
                Text(listed.isEmpty ? ConnectDesign.line : "Connect another").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                content
            }
            Spacer(minLength: 16)
            ConnectDesign.Quiet(title: ConnectDesign.trouble).frame(maxWidth: .infinity)
        }
        .padding(20)
        .frame(width: 460, height: 660, alignment: .topLeading)
        .background(Color(Palette.sheetGround))
        #else
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if !listed.isEmpty {
                        Text("CONNECTED").font(.footnote).foregroundStyle(Color.muted)
                        ConnectDesign.ConnectedList(rows: listed, going: look.phase == .disconnecting ? look.ai : nil)
                    }
                    Text(listed.isEmpty ? ConnectDesign.line : "Connect another").font(.footnote).foregroundStyle(Color.muted)
                    content
                    ConnectDesign.Quiet(title: ConnectDesign.trouble).frame(maxWidth: .infinity)
                }
                .padding(20)
            }
            .background(Color(Palette.sheetGround))
            .navigationTitle("Connect an AI")
            .navigationBarTitleDisplayMode(.large)
        }
        #endif
    }
}

// MARK: ChatGPT: the guided path

/// ChatGPT has no listing yet (in review), so the person adds Pinto Notes in ChatGPT once. First a
/// short promise with the one button; the steps then float next to ChatGPT (Mac) while it happens.
struct ChatGPTIntro: View {
    var started = false
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                ConnectDesign.Mark(ai: .chatgpt, size: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Add Pinto Notes in ChatGPT").font(.system(size: 15, weight: .bold)).foregroundStyle(Color.ink)
                    Text("Once, about a minute. Needs ChatGPT Plus or higher.").font(ConnectDesign.Metrics.status).foregroundStyle(Color.muted)
                }
            }
            #if os(macOS)
            Text(started ? "The steps are next to ChatGPT. This finishes by itself when you choose Allow."
                         : "We open ChatGPT and copy the link. The steps stay next to it, with pictures.")
                .font(ConnectDesign.Metrics.line).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
            if started {
                HStack(spacing: 10) {
                    ProgressView().controlSize(.small)
                    Text("Waiting for ChatGPT\u{2026}").font(ConnectDesign.Metrics.name).foregroundStyle(Color.ink)
                }
            } else {
                ConnectDesign.Primary(title: "Open ChatGPT")
            }
            ConnectDesign.Quiet(title: "I know how, just copy the link")
            #else
            Text("ChatGPT only lets you add it on a computer. Send yourself the link; it opens the same steps there.")
                .font(ConnectDesign.Metrics.line).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
            if started {
                ConnectDesign.Status(phase: .waiting, text: "Waiting for ChatGPT on your computer\u{2026}")
            } else {
                ConnectDesign.Primary(title: "Send to My Computer")
            }
            #endif
        }
    }
}

/// One step of the ChatGPT path, with the picture of that screen in ChatGPT.
struct ChatGPTStep: Identifiable {
    let id: Int
    let words: String
    /// A real screenshot of ChatGPT (asset name), or nil: a marked placeholder until one is captured.
    let shot: String?
    let what: String
    var copyLink = false

    static let all: [ChatGPTStep] = [
        .init(id: 1, words: "In ChatGPT, choose + next to Plugins, then Add custom MCP server.", shot: nil, what: "chatgpt.com/plugins, the + menu"),
        .init(id: 2, words: "Name it Pinto Notes and paste the link. We copied it for you.", shot: nil, what: "the name and URL fields", copyLink: true),
        .init(id: 3, words: "Choose I understand and want to continue, then Create.", shot: nil, what: "the risk notice and Create"),
        .init(id: 4, words: "ChatGPT opens Pinto Notes. Choose Allow.", shot: "consent", what: "Pinto Notes asks to allow ChatGPT"),
    ]
}

/// Mac: the small window that floats over the browser (where ConnectPanel sits today), one step at
/// a time with its picture. It finishes by itself.
struct ChatGPTFloatingGuide: View {
    var step: Int = 1
    var connected = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                ConnectDesign.Mark(ai: .chatgpt, size: 22)
                Text("Add Pinto Notes in ChatGPT").font(.system(size: 13, weight: .bold)).foregroundStyle(Color.ink)
                Spacer()
                Image(systemName: "xmark").font(.system(size: 10, weight: .bold)).foregroundStyle(Color.muted)
            }
            if connected {
                VStack(spacing: 10) {
                    Image(systemName: "checkmark.circle.fill").font(.system(size: 40)).foregroundStyle(.white, .green)
                    Text("ChatGPT is connected").font(.system(size: 15, weight: .bold)).foregroundStyle(Color.ink)
                    Text("This closes by itself.").font(.system(size: 12)).foregroundStyle(Color.muted)
                }
                .frame(maxWidth: .infinity, minHeight: 260)
            } else {
                let s = ChatGPTStep.all[step - 1]
                shot(s)
                Text(s.words).font(.system(size: 13)).foregroundStyle(Color.ink).fixedSize(horizontal: false, vertical: true)
                if s.copyLink {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark").foregroundStyle(.green)
                        Text("Link copied").foregroundStyle(Color.muted)
                        Text("Copy again").underline().foregroundStyle(Color.muted)
                    }
                    .font(.system(size: 12))
                }
                HStack {
                    HStack(spacing: 5) {
                        ForEach(1...4, id: \.self) { i in Circle().fill(i == step ? Color(Palette.amber) : Color.line).frame(width: 6, height: 6) }
                    }
                    Spacer()
                    if step > 1 { Text("Back").font(.system(size: 12, weight: .medium)).foregroundStyle(Color.muted) }
                    Text(step < 4 ? "Next" : "Waiting\u{2026}").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted).padding(.leading, 10)
                }
            }
        }
        .padding(16)
        .frame(width: 340)
        .background(Color(Palette.sheetGround))
    }

    @ViewBuilder private func shot(_ s: ChatGPTStep) -> some View {
        let shape = RoundedRectangle(cornerRadius: 8, style: .continuous)
        if s.shot == "consent" {
            // Our own sheet, drawn small: the real one is in ConnectAI.swift.
            VStack(spacing: 8) {
                HStack(spacing: 10) { AITile(ai: "ChatGPT", size: 30); Image(systemName: "arrow.left.arrow.right").foregroundStyle(Color.muted); AppMark(size: 30) }
                Text("Allow ChatGPT to use your notes?").font(.system(size: 12, weight: .bold)).foregroundStyle(Color.ink)
                Text("Allow").font(.system(size: 12, weight: .semibold)).foregroundStyle(.white)
                    .frame(width: 120, height: 24).background(Color(Palette.amberButton), in: .rect(cornerRadius: 6))
            }
            .frame(maxWidth: .infinity, minHeight: 170)
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(Color.line))
        } else {
            VStack(spacing: 6) {
                Image(systemName: "photo").font(.system(size: 22)).foregroundStyle(Color.muted)
                Text("PLACEHOLDER: real ChatGPT screenshot").font(.system(size: 10, weight: .bold)).foregroundStyle(Color.amberInk)
                Text(s.what).font(.system(size: 11)).foregroundStyle(Color.muted)
            }
            .frame(maxWidth: .infinity, minHeight: 170)
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(Color.amberInk.opacity(0.6), style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
        }
    }
}

// MARK: Having trouble?

/// Everything technical, for one AI, behind the one quiet link.
struct ConnectTroubleSheet: View {
    let ai: ConnectDesign.AI

    private var items: [(String, String?)] {
        switch ai {
        case .chatgpt: [("Add it by hand in ChatGPT: Plugins, +, Add custom MCP server. Name: Pinto Notes. Authentication: OAuth.", nil),
                        ("The link", ConnectDesign.link),
                        ("Only + Create plugin in the menu? Turn on Developer mode in ChatGPT Settings, Security and login.", nil)]
        case .claude: [("Older Claude app, or Pinto Notes isn\u{2019}t in its list? Add it as a custom connector instead:", nil),
                       ("Add as custom connector", "claude.ai/customize/connectors"),
                       ("The link", ConnectDesign.link)]
        case .claudeCode: [("Run this in your terminal yourself:", nil),
                           ("Command", "claude mcp add --scope user --transport http pinto-notes \(ConnectDesign.link) && claude mcp login pinto-notes")]
        case .codex: [("Run this in your terminal yourself:", nil),
                      ("Command", "codex mcp add pinto-notes --url \(ConnectDesign.link)")]
        case .other: [("Any app that can add an MCP server can use your notes. Give it this address; when it asks, choose Allow in Pinto Notes.", nil),
                      ("The link", ConnectDesign.link),
                      ("App wants a token instead? Make one under Options in the next step.", nil)]
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Having trouble with \(ai.title)?").font(.system(size: 17, weight: .bold)).foregroundStyle(Color.ink)
                Spacer()
                Image(systemName: "xmark").font(.system(size: 12, weight: .bold)).foregroundStyle(Color.muted)
                    .frame(width: 26, height: 26).background(.fill.tertiary, in: .circle)
            }
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                if let value = item.1 {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(item.0).font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                        HStack(alignment: .top) {
                            Text(value).font(.system(size: 12, design: .monospaced)).foregroundStyle(Color.ink).textSelection(.enabled)
                                .fixedSize(horizontal: false, vertical: true)
                            Spacer(minLength: 8)
                            Text("Copy").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                        }
                        .padding(10)
                        .background(Color(Palette.field), in: .rect(cornerRadius: 8))
                    }
                } else {
                    Text(item.0).font(.system(size: 13)).foregroundStyle(Color.ink).fixedSize(horizontal: false, vertical: true)
                }
            }
            Toggle("Read only", isOn: .constant(false)).font(.system(size: 13)).foregroundStyle(Color.ink)
            Text("Read only lets the AI look things up but not change notes.").font(.system(size: 11)).foregroundStyle(Color.muted)
        }
        .padding(24)
        #if os(macOS)
        .frame(width: 440)
        #endif
        .background(Color(Palette.sheetGround))
    }
}

// MARK: The sidebar card, per alternative

/// What the sidebar card says. A and B keep today's card (it opens their sheet); C names what it
/// found, so the card itself is the one-click offer.
struct ConnectDesignCard: View {
    let alt: ConnectDesign.Alt
    var body: some View {
        if alt == .c {
            SidebarCardShell(id: "design.card", title: "Connect Claude", line: "It\u{2019}s on this Mac. One click.",
                             button: "Connect", opensWeb: false, action: {}, onClose: {}) { size in
                ForEach(Array(["Claude", "Claude Code"].enumerated()), id: \.offset) { i, ai in
                    AITile(ai: ai, size: size * 0.86).rotationEffect(.degrees(Double(i) * 9 - 4)).offset(x: CGFloat(i) * size * 0.42 - size * 0.2)
                }
            }
        } else {
            ConnectCard(onConnect: {}, onClose: {})
        }
    }
}

// MARK: The lab window (recordings)

/// Plays one press in one alternative on a loop, in a real window: rest, the press, waiting,
/// connected. Opened with -connectDesignLab A|B|C.
struct ConnectDesignLab: View {
    let alt: ConnectDesign.Alt
    @State private var look: ConnectDesign.Look

    init(alt: ConnectDesign.Alt) {
        self.alt = alt
        _look = State(initialValue: Self.start(alt))
    }

    static func start(_ alt: ConnectDesign.Alt) -> ConnectDesign.Look {
        switch alt {
        case .a: .init(alt: .a)
        case .b: .init(alt: .b)
        case .c: .init(alt: .c)
        }
    }

    var body: some View {
        ConnectDesignScreen(look: look)
            .tint(Color(PColor.paneAccent))
            .task { await play() }
    }

    private func set(_ change: (inout ConnectDesign.Look) -> Void) {
        withAnimation(.smooth(duration: 0.3)) { change(&look) }
    }

    private func play() async {
        while !Task.isCancelled {
            look = Self.start(alt)
            try? await Task.sleep(for: .seconds(1.2))
            switch alt {
            case .a:
                set { $0.ai = .claude; $0.pressed = true }
                try? await Task.sleep(for: .seconds(0.18))
                set { $0.pressed = false; $0.phase = .waiting }
                try? await Task.sleep(for: .seconds(2.2))
                set { $0.phase = .connected }
            case .b:
                set { $0.ai = .claude }
                try? await Task.sleep(for: .seconds(1.0))
                set { $0.pressed = true }
                try? await Task.sleep(for: .seconds(0.18))
                set { $0.pressed = false; $0.phase = .waiting }
                try? await Task.sleep(for: .seconds(2.2))
                set { $0.phase = .connected }
            case .c:
                set { $0.pressed = true }
                try? await Task.sleep(for: .seconds(0.18))
                set { $0.pressed = false; $0.phase = .waiting }
                try? await Task.sleep(for: .seconds(1.4))
                set { $0.foundDone = [.claudeCode] }
                try? await Task.sleep(for: .seconds(1.4))
                set { $0.foundDone = [.claudeCode, .claude]; $0.phase = .connected }
            }
            try? await Task.sleep(for: .seconds(2.0))
        }
    }
}
