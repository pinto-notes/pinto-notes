import Supabase
import SwiftData
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
    /// What the question is about: a folder by name, every note, or one note.
    enum Subject: Equatable {
        case folder(String)
        case all
        /// One note, by its title and folder, with what it holds (round 2 of the councils: Ask
        /// about this note, with questions fit to it).
        case note(NoteAbout)

        /// "“Running”", "Your Notes" or "This Note" in a menu title.
        var menuName: String {
            switch self {
            case .folder(let name): "\u{201C}\(name)\u{201D}"
            case .all: "Your Notes"
            case .note: "This Note"
            }
        }

        /// In a sentence: "“Running”", "your notes", or the note's title.
        var inLine: String {
            switch self {
            case .folder(let name): "\u{201C}\(name)\u{201D}"
            case .all: "your notes"
            case .note(let n): "\u{201C}\(n.title)\u{201D}"
            }
        }
    }

    /// A note as Ask sees it: what it's called, where it is, and what it holds.
    struct NoteAbout: Equatable {
        var title: String
        var folder: String?
        /// It has tick items, or its title says it's a plan or a to-do list.
        var plan = false
        /// It has a markdown table.
        var table = false

        init(title: String, folder: String? = nil, plan: Bool = false, table: Bool = false) {
            self.title = title
            self.folder = folder
            self.plan = plan
            self.table = table
        }

        /// From the note's text: its first line is its title.
        init(body: String, folder: String?) {
            let lines = body.components(separatedBy: "\n")
            let title = (lines.first ?? "").replacingOccurrences(of: #"^#+\s*"#, with: "", options: .regularExpression).trimmingCharacters(in: .whitespaces)
            self.init(title: title, folder: folder,
                      plan: Self.isPlan(title: title, lines: lines),
                      table: lines.contains { $0.wholeMatch(of: /\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*/) != nil })
        }

        static func isPlan(title: String, lines: [String]) -> Bool {
            if lines.contains(where: { $0.firstMatch(of: /^\s*[-*+]\s+\[( |x|X)\]\s/) != nil }) { return true }
            let words = title.lowercased()
            return words.firstMatch(of: /\b(plan|plans|planning|to-?do|to-dos|todos|checklist)\b/) != nil
        }

        /// "my note “Week plan” in “Running”": enough for the AI to find it by title.
        var named: String {
            if let folder, !folder.isEmpty { return "my note \u{201C}\(title)\u{201D} in \u{201C}\(folder)\u{201D}" }
            return "my note \u{201C}\(title)\u{201D}"
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

    /// The questions, fit to what's asked about. Each names Pinto Notes and the folder or note, so
    /// the AI reads the right notes without being told twice. A folder (or all notes) asks about
    /// the week only when something in it changed in the last seven days (`recent`): a folder
    /// nobody touched this week has no week to check (round 1 of the councils). A note gets
    /// questions for what it holds: a plan or checklist "Check my progress" and "Update this plan",
    /// a table "Make this a tracker", plain text "Make flashcards from this"; and "Find related notes".
    static func questions(_ s: Subject, recent: Bool = true) -> [Question] {
        switch s {
        case .folder:
            let read = "In Pinto Notes, read my folder \(s.inLine)"
            let list = Question(id: "list", title: "Make a list from it", prompt: "\(read) and make a checklist of what to do next. Put it in a new note in that folder.")
            guard recent else {
                return [
                    Question(id: "summary", title: "Summarize it", prompt: "\(read) and summarize what\u{2019}s in it."),
                    list,
                    Question(id: "stale", title: "Find what\u{2019}s out of date", prompt: "\(read) and tell me what looks out of date or unfinished."),
                ]
            }
            return [
                Question(id: "week", title: "Check my week against it", prompt: "\(read) and check my week against it: what I did, what I missed, and what to do next."),
                Question(id: "summary", title: "Summarize this week", prompt: "\(read) and summarize what changed in it in the last seven days."),
                list,
            ]
        case .all:
            guard recent else {
                return [
                    Question(id: "open", title: "Find what\u{2019}s unfinished", prompt: "In Pinto Notes, look through my notes and list what\u{2019}s unfinished: open to-dos and plans I didn\u{2019}t finish."),
                    Question(id: "list", title: "Make a list from them", prompt: "In Pinto Notes, read my notes and make a checklist of what to do next. Put it in a new note."),
                ]
            }
            return [
                Question(id: "week", title: "Check my week", prompt: "In Pinto Notes, read my notes from the last seven days and check how my week went: what I did, what I missed, and what to do next."),
                Question(id: "summary", title: "Summarize this week", prompt: "In Pinto Notes, summarize what changed in my notes in the last seven days."),
                Question(id: "list", title: "Make a list from them", prompt: "In Pinto Notes, read my notes from the last seven days and make a checklist of what to do next. Put it in a new note."),
            ]
        case .note(let n):
            let read = "In Pinto Notes, read \(n.named)"
            var out: [Question] = []
            if n.plan {
                out.append(Question(id: "progress", title: "Check my progress", prompt: "\(read) and check my progress: what\u{2019}s done, what\u{2019}s left, and what to do next."))
                out.append(Question(id: "update", title: "Update this plan", prompt: "\(read), ask me what changed, then update the plan in that note."))
            }
            if n.table {
                out.append(Question(id: "tracker", title: "Make this a tracker", prompt: "\(read) and make its table a tracker: give each column a type, keep every row, and tell me how to add today\u{2019}s."))
            }
            if !n.plan, !n.table {
                out.append(Question(id: "flashcards", title: "Make flashcards from this", prompt: "\(read) and make flashcards from it: a question and its answer for each thing worth remembering. Put them in a new note called \u{201C}\(n.title) flashcards\u{201D} next to it."))
            }
            out.append(Question(id: "related", title: "Find related notes", prompt: "\(read) and find my other notes that relate to it. List them with a line on how each one relates, and offer to link them from it."))
            return Array(out.prefix(3))
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
        case .note(let n): return "In Pinto Notes, read \(n.named). \(text)"
        }
    }

    /// How far back "this week" reaches for a folder's week questions.
    static let recentWindow: TimeInterval = 7 * 24 * 60 * 60

    /// Something in these notes changed in the last seven days.
    static func recent(_ notes: [Note], now: Date = .now) -> Bool {
        notes.contains { $0.trashedAt == nil && $0.deletedAt == nil && now.timeIntervalSince($0.updatedAt) < recentWindow }
    }

    /// Something in this folder, or a folder inside it, changed in the last seven days.
    @MainActor static func recent(_ folder: Folder, now: Date = .now) -> Bool {
        recent(folder.liveNotes, now: now) || folder.liveChildren.contains { recent($0, now: now) }
    }

    /// Some note changed in the last seven days, for All Notes.
    @MainActor static func recent(in context: ModelContext, now: Date = .now) -> Bool {
        let since = now.addingTimeInterval(-recentWindow)
        let d = FetchDescriptor<Note>(predicate: #Predicate { $0.updatedAt > since && $0.deletedAt == nil })
        // Recently Deleted's own aren't this week's work.
        return ((try? context.fetch(d)) ?? []).contains { $0.trashedAt == nil }
    }

    /// Whether a note can be asked about: not locked (an AI can't read it), not deleted, and with
    /// words in it (an empty note has nothing to ask about, nor a title to find it by).
    static func asks(about note: Note) -> Bool {
        !note.isLocked && note.trashedAt == nil && note.deletedAt == nil && note.body.contains { !$0.isWhitespace }
    }

    /// The note as Ask names it: by the title the list shows (its first line with words in it).
    @MainActor static func subject(_ note: Note) -> Subject {
        var about = NoteAbout(body: note.body, folder: note.folder?.name)
        about.title = note.title
        return .note(about)
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
    /// True once a list has come back (or there's no account to ask): before that an empty list
    /// means "not known yet", after it "none" (council round 11: the sidebar kept a disconnected
    /// AI's last change because it couldn't tell the two apart).
    private(set) var loaded = false

    /// The connected AIs' names, or nil while not known yet.
    var knownNames: [String]? { loaded ? connections.map(\.name) : nil }

    var targets: [AskAI.Target] { AskAI.targets(connections) }

    func set(_ rows: [Connection]) { connections = rows.filter { $0.revoked_at == nil }; loaded = true }

    func refresh(_ client: SupabaseClient?) async {
        guard let client else { set([]); return }
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
    /// Something in the folder changed this week: its week questions are offered (AskAI.questions).
    var recent = true
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
            ForEach(AskAI.questions(subject, recent: recent)) { q in
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
    /// The Ask popover, from this view, while `target` is set. `recent` is worked out as it opens.
    func askAIPopover(_ target: Binding<AskAI.Target?>, subject: @autoclosure @escaping () -> AskAI.Subject,
                      recent: @autoclosure @escaping () -> Bool = true, arrowEdge: Edge = .bottom) -> some View {
        popover(item: target, arrowEdge: arrowEdge) { t in
            AskAIPopover(target: t, subject: subject(), recent: recent(), close: { target.wrappedValue = nil })
                .presentationCompactAdaptation(.popover)
        }
    }
}

/// Ask about the open note, in its toolbar: the AI's mark for one AI (it opens the popover), a
/// menu of the AIs for several, nothing for none. 28 points on the Mac, 44 on iPhone, as the
/// bar's other buttons (round 2 of the councils).
struct AskAINoteButton: View {
    let targets: [AskAI.Target]
    let ask: (AskAI.Target) -> Void

    var body: some View {
        if targets.count == 1, let t = targets.first {
            Button { ask(t) } label: { label(AskAI.title(t, .note(.init(title: ""))), ai: t.ai) }
                .help(AskAI.title(t, .note(.init(title: ""))))
                .accessibilityIdentifier("editor.ask")
        } else if targets.count > 1 {
            Menu {
                ForEach(targets) { t in
                    Button(AskAI.submenuItem(t)) { ask(t) }.accessibilityIdentifier("editor.ask.\(t.ai)")
                }
            } label: {
                Label(AskAI.submenuTitle(.note(.init(title: ""))), systemImage: "sparkles")
            }
            #if os(macOS)
            .menuIndicator(.hidden)
            #endif
            .help(AskAI.submenuTitle(.note(.init(title: ""))))
            .accessibilityIdentifier("editor.ask")
        }
    }

    @ViewBuilder private func label(_ title: String, ai: String) -> some View {
        if let mark = Self.mark(ai) {
            Label { Text(title) } icon: { mark }
        } else {
            Label(title, systemImage: "sparkles")
        }
    }

    /// The bar's glyph size: the marks fill their square where a symbol leaves room around it, so
    /// a point or so under the bar's symbols reads the same (iPhone's bar glyphs are about 22).
    #if os(macOS)
    static let markSize: CGFloat = 16
    #else
    static let markSize: CGFloat = 21
    #endif

    /// The AI's mark as a bar button's picture: drawn at the bar's size and left to the bar to
    /// colour, as its symbols are. A bar takes a picture at its own size, not a frame.
    static func mark(_ ai: String) -> Image? {
        guard !AIGlyph.storeSafe, let asset = AIGlyph.asset(ai) else { return nil }
        let side = markSize
        #if os(macOS)
        guard let base = NSImage(named: asset), let image = base.copy() as? NSImage else { return nil }
        image.size = NSSize(width: side, height: side)
        image.isTemplate = true
        return Image(nsImage: image)
        #else
        guard let base = UIImage(named: asset) else { return nil }
        let image = UIGraphicsImageRenderer(size: CGSize(width: side, height: side)).image { _ in
            base.draw(in: CGRect(x: 0, y: 0, width: side, height: side))
        }
        return Image(uiImage: image.withRenderingMode(.alwaysTemplate))
        #endif
    }
}
