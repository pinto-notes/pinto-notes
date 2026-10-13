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

/// Connect an AI, the same wherever it is offered (the first-run flow, Settings, the sheet a note
/// opens): every way to connect as a large choice with the product's own mark and one plain line
/// about what happens, what is connected (only when something is) with Disconnect, and one quiet
/// line of reassurance. The steps and anything technical are in the guide a choice opens.
struct ConnectChoices: View {
    let client: SupabaseClient
    /// The ways offered, in order.
    var guides: [ConnectAISection.Guide] = ConnectAISection.Guide.offered
    /// The first-run flow marks a connected AI on its choice and leaves the list out.
    var listsConnected = true
    /// Captures: shows these instead of asking the server.
    var preview: [Connection]? = nil
    /// Tells the flow what is connected, each time it has been asked again.
    var onLoaded: (Set<String>) -> Void = { _ in }

    @State private var connections: [Connection] = []
    @State private var removing: Connection?
    @State private var error: String?
    @State private var center = ConnectCenter.shared
    /// Which guide is open, held by the view around this one (`connectGuides`).
    @Environment(ConnectGuideRoute.self) private var route: ConnectGuideRoute?
    @Environment(\.networkReach) private var reach

    static let another = "Connect another"
    static let reassurance = "You approve each AI, and every change can be undone."
    static let why = "Your AI can then read and write your notes when you ask it to."

    private var active: [Connection] { (preview ?? connections).filter { $0.revoked_at == nil } }

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            if let ask = center.waiting().first {
                ConnectWaitingRow(ask: ask)
            }
            // With something connected, that comes first, each with its Disconnect; the ways to
            // connect follow under their own small heading.
            if listsConnected, !active.isEmpty {
                connected
                Text(Self.another)
                    .font(Metrics.header)
                    .foregroundStyle(Color.muted)
                    .padding(.top, 4)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier("connect.another")
            }
            BigChoices(list: choices)
                .disabled(reach != .online)
            if reach != .online {
                Text(OfflineCopy.needsNetwork("connect an AI")).font(.footnote).foregroundStyle(Color.muted)
            }
            if let error, reach == .online {
                Text(error).font(.footnote).foregroundStyle(.red)
            }
            Text(Self.reassurance)
                .font(.footnote)
                .foregroundStyle(Color.muted)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier("connect.reassurance")
        }
        // Asks again when a guide closes (it may have connected something) and when back online.
        .task(id: "\(route?.closed ?? 0)\(reach == .online)") { await load() }
        .confirmationDialog("Disconnect \(removing?.title ?? "")?", isPresented: Binding(get: { removing != nil }, set: { if !$0 { removing = nil } }), titleVisibility: .visible) {
            Button("Disconnect", role: .destructive) { if let r = removing { Task { await revoke(r) } } }
        } message: {
            Text("It loses access to your notes right away.")
        }
    }

    private var choices: [BigChoice] {
        let titles = Set(active.map(\.title))
        return guides.map { g in
            let done = !listsConnected && titles.contains(g.title)
            return BigChoice(id: "connect.guide.\(g.rawValue)", title: g.title, detail: done ? "Connected" : g.plain,
                             mark: .ai(g.title), done: done, hint: g.subtitle) { route?.guide = g }
        }
    }

    /// What is connected: a plain list under the choices, each with Disconnect.
    private var connected: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Connected")
                .font(Metrics.header)
                .foregroundStyle(Color.muted)
                .accessibilityAddTraits(.isHeader)
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
        static let gap: CGFloat = 12
        static let rowInset: CGFloat = 36
        #else
        static let header = Font.footnote.weight(.semibold)
        static let rowTitle = Font.body
        static let gap: CGFloat = 14
        static let rowInset: CGFloat = 36
        #endif
    }
}

/// Connect an AI as its own sheet (from a note that asks for an AI): the title, why, the choices.
struct ConnectAISheet: View {
    let client: SupabaseClient
    /// Captures: shows these instead of asking the server.
    var preview: [Connection]? = nil
    @Environment(\.dismiss) private var dismiss

    static let title = "Connect an AI"

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
                Button("Done") { dismiss() }
                    .buttonStyle(.hoverText)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.tint)
                    .keyboardShortcut(.defaultAction)
                    .accessibilityIdentifier("connect.done")
            }
            Text(ConnectChoices.why)
                .font(.system(size: 13))
                .foregroundStyle(Color.muted)
                .padding(.top, 6)
                .padding(.bottom, 18)
            ConnectChoices(client: client, preview: preview)
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
                    Text(ConnectChoices.why)
                        .font(.body)
                        .foregroundStyle(Color.muted)
                        .fixedSize(horizontal: false, vertical: true)
                    ConnectChoices(client: client, preview: preview)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
            }
            .background { Backdrop() }
            .navigationTitle(Self.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
        }
        .connectGuides(client: client)
        .consentHost(client: client)
        #endif
    }
}
