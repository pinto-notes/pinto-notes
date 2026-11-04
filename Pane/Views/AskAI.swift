import Supabase
import SwiftUI
#if os(macOS)
import AppKit
#endif

// Ask an AI about a folder (persona council, 4 November 2026: Maya, Elena, the household). A
// folder's menu and the list's ••• menu offer "Ask ChatGPT About “Running”…" with the AI's mark,
// in a submenu when more than one AI is connected, and nothing when none is. It opens a small
// popover of questions fit to the folder; picking one opens ChatGPT or Claude with it typed in
// (WebConnectPlan.prefilled, as Try it does) and copies it too, since neither app is known to take
// the text from a link. Claude Code, Codex and the rest get it copied, to paste. The popover says
// what happened ("Opened in ChatGPT") and closes.

/// What Ask offers and says. Pure, so it is unit-tested (AskAITests).
enum AskAI {
    /// What the question is about: a folder by name, or every note.
    enum Subject: Equatable {
        case folder(String)
        case all

        /// "“Running”", or "Your Notes" in a menu title.
        var menuName: String {
            switch self {
            case .folder(let name): "\u{201C}\(name)\u{201D}"
            case .all: "Your Notes"
            }
        }

        /// In a sentence: "“Running”", or "your notes".
        var inLine: String {
            switch self {
            case .folder(let name): "\u{201C}\(name)\u{201D}"
            case .all: "your notes"
            }
        }
    }

    /// An AI that can be asked: by its mark, once however many accounts are connected.
    struct Target: Hashable, Identifiable {
        let ai: String
        var id: String { ai }
        /// ChatGPT and Claude: their site opens with the question typed in. The rest: copied.
        var opensPage: Bool { TryIt.askable.contains(ai) }
    }

    /// The order the AIs are offered in: the two whose page opens first.
    static let order = ["ChatGPT", "Claude", "Grok", "Claude Code", "Codex"]

    /// The AIs to offer, from what's connected now. Only AIs Pinto can name (an app it can't vouch
    /// for, or a bare access token, has no mark and no way to be asked).
    static func targets(_ connections: [Connection]) -> [Target] {
        let marks = Set(connections.filter { $0.revoked_at == nil }.compactMap(\.mark))
        return order.filter(marks.contains).map(Target.init(ai:))
    }

    /// The menu item for one AI: "Ask ChatGPT About “Running”…".
    static func title(_ t: Target, _ s: Subject) -> String { "Ask \(t.ai) About \(s.menuName)\u{2026}" }
    /// With several AIs, the submenu: "Ask an AI About “Running”", its items the AIs' names.
    static func submenuTitle(_ s: Subject) -> String { "Ask an AI About \(s.menuName)" }
    static func submenuItem(_ t: Target) -> String { "\(t.ai)\u{2026}" }

    /// The popover's heading.
    static func heading(_ t: Target, _ s: Subject) -> String { "Ask \(t.ai) about \(s.inLine)" }

    struct Question: Equatable, Identifiable {
        let id: String
        let title: String
        let prompt: String
    }

    /// The questions, fit to what's asked about. Each names Pinto Notes and the folder, so the AI
    /// reads the right notes without being told twice.
    static func questions(_ s: Subject) -> [Question] {
        switch s {
        case .folder:
            let read = "In Pinto Notes, read my folder \(s.inLine)"
            return [
                Question(id: "week", title: "Check my week against it", prompt: "\(read) and check my week against it: what I did, what I missed, and what to do next."),
                Question(id: "summary", title: "Summarise this week", prompt: "\(read) and summarise what changed in it this week."),
                Question(id: "list", title: "Make a list from it", prompt: "\(read) and make a checklist of what to do next. Put it in a new note in that folder."),
            ]
        case .all:
            return [
                Question(id: "week", title: "Check my week", prompt: "In Pinto Notes, read my notes from this week and check how it went: what I did, what I missed, and what to do next."),
                Question(id: "summary", title: "Summarise this week", prompt: "In Pinto Notes, summarise what changed in my notes this week."),
                Question(id: "list", title: "Make a list from them", prompt: "In Pinto Notes, read my notes from this week and make a checklist of what to do next. Put it in a new note."),
            ]
        }
    }

    static let ownPlaceholder = "Write your own"

    /// A question typed in the popover, with where to look in front of it.
    static func own(_ typed: String, _ s: Subject) -> String? {
        let text = typed.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return nil }
        switch s {
        case .folder: return "In Pinto Notes, read my folder \(s.inLine). \(text)"
        case .all: return "In Pinto Notes, read my notes. \(text)"
        }
    }

    /// The AI's page with the question typed in, for ChatGPT and Claude.
    static func page(_ t: Target, prompt: String) -> URL? { t.opensPage ? TryIt.page(for: t.ai, prompt: prompt) : nil }

    /// Under the questions, before one is picked: what picking does.
    static func how(_ t: Target) -> String {
        t.opensPage ? "Opens \(t.ai) with it typed in. It\u{2019}s copied too." : "Copies it to paste into \(t.ai)."
    }

    /// After: the confirmation.
    static func done(_ t: Target) -> String { t.opensPage ? "Opened in \(t.ai)" : "Copied. Paste it into \(t.ai)." }

    /// How long the confirmation shows before the popover closes: longer when there's something
    /// left to do (paste it).
    static func closesAfter(_ t: Target) -> Duration { t.opensPage ? .milliseconds(1400) : .milliseconds(2400) }

    /// The AI's mark for a menu row, monochrome as every mark in a menu or button is (30 October 2026).
    @MainActor static func menuIcon(_ ai: String, dark: Bool) -> Image? {
        #if os(macOS)
        // A menu draws a template picture dark whatever its own colour: a finished one, in the
        // menu's text colour.
        guard AIGlyph.asset(ai) != nil else { return nil }
        let renderer = ImageRenderer(content: AIGlyph(ai: ai, size: 16, monochrome: true)
            .foregroundStyle(dark ? Color.white : Color.black)
            .environment(\.colorScheme, dark ? .dark : .light))
        renderer.scale = 2
        guard let image = renderer.nsImage else { return nil }
        image.isTemplate = false
        return Image(nsImage: image)
        #else
        return AIGlyph.asset(ai).map { Image($0).renderingMode(.template) }
        #endif
    }
}

/// The AIs connected now, for Ask. Loaded when the sidebar appears and when a connection may have
/// come or gone (the ai_connected notice); Settings' lists keep it current as they load.
@MainActor @Observable final class ConnectedAIs {
    static let shared = ConnectedAIs()
    private(set) var connections: [Connection] = []

    var targets: [AskAI.Target] { AskAI.targets(connections) }

    func set(_ rows: [Connection]) { connections = rows.filter { $0.revoked_at == nil } }

    func refresh(_ client: SupabaseClient?) async {
        guard let client else { connections = []; return }
        if let rows = try? await Connection.list(client) { set(rows) }
    }
}

/// The menu items: one for one AI, a submenu for several, nothing for none.
struct AskAIMenuItems: View {
    let subject: AskAI.Subject
    let targets: [AskAI.Target]
    let ask: (AskAI.Target) -> Void
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        if targets.count == 1, let t = targets.first {
            item(AskAI.title(t, subject), t)
                .accessibilityIdentifier("ask.\(t.ai)")
        } else if targets.count > 1 {
            Menu {
                ForEach(targets) { t in
                    item(AskAI.submenuItem(t), t).accessibilityIdentifier("ask.\(t.ai)")
                }
            } label: {
                Label(AskAI.submenuTitle(subject), systemImage: "sparkles")
            }
            .accessibilityIdentifier("ask.menu")
        }
    }

    private func item(_ title: String, _ t: AskAI.Target) -> some View {
        Button { ask(t) } label: {
            if let mark = AskAI.menuIcon(t.ai, dark: scheme == .dark) {
                Label { Text(title) } icon: { mark }
            } else {
                Label(title, systemImage: "sparkles")
            }
        }
    }
}

/// The popover: a few questions fit to the folder, and one to write. Picking one opens the AI
/// with it typed in (or copies it), says so, and closes.
struct AskAIPopover: View {
    let target: AskAI.Target
    let subject: AskAI.Subject
    /// Opens a page; the app's own openURL unless a test listens.
    var open: ((URL) -> Void)? = nil
    var copy: (String) -> Void = Clipboard.copy
    var close: () -> Void = {}
    /// Captures: shows the confirmation as if a question was picked.
    var previewDone = false
    @Environment(\.openURL) private var openURL
    @State private var typed = ""
    @State private var done = false
    @FocusState private var typing: Bool

    static let width: CGFloat = 280

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                AIGlyph(ai: target.ai, size: 16, monochrome: true).foregroundStyle(Color.ink)
                Text(AskAI.heading(target, subject))
                    .font(.system(size: Self.compact ? 15 : 13, weight: .semibold))
                    .foregroundStyle(Color.ink)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)
            }
            .padding(.horizontal, 12)
            .padding(.top, 12)
            .padding(.bottom, 6)
            ForEach(AskAI.questions(subject)) { q in
                Button { pick(q.prompt) } label: {
                    HStack(spacing: 8) {
                        Text(q.title).foregroundStyle(Color.ink)
                        Spacer(minLength: 8)
                        Image(systemName: target.opensPage ? "arrow.up.right" : "doc.on.doc")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(Color.muted)
                            .accessibilityHidden(true)
                    }
                    .font(.system(size: Self.compact ? 16 : 13))
                    .padding(.horizontal, 8)
                    .frame(maxWidth: .infinity, minHeight: Self.compact ? 44 : 28, alignment: .leading)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .hoverRow("ask.\(q.id)", reach: EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 0))
                .padding(.horizontal, 4)
                .disabled(done)
                .accessibilityIdentifier("ask.question.\(q.id)")
            }
            HStack(spacing: 6) {
                TextField(AskAI.ownPlaceholder, text: $typed)
                    .textFieldStyle(.plain)
                    .font(.system(size: Self.compact ? 16 : 13))
                    .focused($typing)
                    .onSubmit(pickOwn)
                    .disabled(done)
                    .accessibilityIdentifier("ask.own")
                Button(action: pickOwn) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: Self.compact ? 24 : 18))
                        .foregroundStyle(AskAI.own(typed, subject) == nil ? Color.muted.opacity(0.5) : Color.ink)
                        .frame(minWidth: Self.compact ? 44 : 22, minHeight: Self.compact ? 44 : 22)
                        .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .hoverHighlight(Circle())
                .disabled(AskAI.own(typed, subject) == nil || done)
                .accessibilityLabel("Ask")
                .accessibilityIdentifier("ask.ownSend")
            }
            .padding(.leading, 8)
            .padding(.trailing, 4)
            .frame(minHeight: Self.compact ? 44 : 30)
            .background(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
            .padding(.horizontal, 8)
            .padding(.top, 6)
            Group {
                if done || previewDone {
                    Label(AskAI.done(target), systemImage: "checkmark.circle.fill")
                        .foregroundStyle(Color.ink)
                        .accessibilityIdentifier("ask.done")
                } else {
                    Text(AskAI.how(target)).foregroundStyle(Color.muted)
                }
            }
            .font(.system(size: Self.compact ? 13 : 11.5))
            .fixedSize(horizontal: false, vertical: true)
            .padding(.horizontal, 12)
            .padding(.top, 8)
            .padding(.bottom, 12)
            .accessibilityAddTraits(.updatesFrequently)
        }
        .frame(width: Self.width)
        .background(Color.card)
    }

    #if os(iOS)
    static let compact = true
    #else
    static let compact = false
    #endif

    private func pickOwn() {
        guard let prompt = AskAI.own(typed, subject) else { return }
        pick(prompt)
    }

    private func pick(_ prompt: String) {
        guard !done else { return }
        copy(prompt)
        if let page = AskAI.page(target, prompt: prompt) { (open ?? { openURL($0) })(page) }
        withAnimation(.smooth(duration: 0.2)) { done = true }
        let after = AskAI.closesAfter(target)
        Task { @MainActor in
            try? await Task.sleep(for: after)
            close()
        }
    }
}

extension View {
    /// The Ask popover, from this view, while `target` is set.
    func askAIPopover(_ target: Binding<AskAI.Target?>, subject: AskAI.Subject, arrowEdge: Edge = .bottom) -> some View {
        popover(item: target, arrowEdge: arrowEdge) { t in
            AskAIPopover(target: t, subject: subject, close: { target.wrappedValue = nil })
                .presentationCompactAdaptation(.popover)
        }
    }
}
