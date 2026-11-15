import SwiftUI

/// Comments on a whiteboard, the app's side (BoardComments, 15 November 2026): a thread opens in a
/// popover by its pin, a new comment is written in one, and the toolbar's Comments lists every
/// thread. Solid, plain and quiet, as the Mac's own popovers are: space between comments, never
/// lines; a reply field at the foot; Resolve at the top, as the thread's one action.
enum BoardCommentUI {
    static let width: CGFloat = 300
    static let avatar: CGFloat = 22
    static let listWidth: CGFloat = 320
    static let title = "Comments"
    /// The action: the selection bar's, the right-click menu's.
    static let comment = "Comment"
    static let help = "Comments (C to add one)"
    static let add = "Add Comment"
    /// The list's first action: picks the Comment tool, as C does.
    static let new = "New Comment"
    static let edit = "Edit"
    static let delete = "Delete\u{2026}"
    static let deleteQuestion = "Delete this comment?"
    static let deleteConfirm = "Delete"
    static let cancel = "Cancel"
    static let edited = "edited"
    static let mentionsYou = "Mentions you"
    static let save = "Save"
    static let empty = "No comments yet"
    static let emptyViewer = "No comments on this board"
    static let showResolved = "Show resolved"
    static let replyPrompt = "Reply"
    static let newPrompt = "Add a comment"
    static let resolve = "Resolve"
    static let reopen = "Open Again"
    static let resolvedTag = "Resolved"
    static let symbol = "text.bubble"

    /// "1 reply", "3 replies".
    static func replies(_ n: Int) -> String { n == 1 ? "1 reply" : "\(n) replies" }

    /// A list row's foot: where the thread is, its replies and when the last came. "on Idea ·
    /// 2 replies · last reply 2 min ago"; "on the board".
    static func foot(place: String, replies n: Int, last: String?) -> String {
        var parts = [place]
        if n > 0 { parts.append(replies(n)) }
        if n > 0, let last, !last.isEmpty { parts.append("last reply " + (last == "Now" ? "now" : last)) }
        return parts.joined(separator: " \u{00B7} ")
    }

    /// A comment's text with each mention ("@Sara") of someone in `people` set apart: semibold, in
    /// the accent's ink.
    static func text(_ text: String, mentions names: [String]) -> AttributedString {
        var out = AttributedString(text)
        for name in names {
            for r in BoardComments.mentionRanges(of: name, in: text) {
                let lower = text.distance(from: text.startIndex, to: r.lowerBound), length = text.distance(from: r.lowerBound, to: r.upperBound)
                let a = out.index(out.startIndex, offsetByCharacters: lower), b = out.index(a, offsetByCharacters: length)
                out[a..<b].foregroundColor = Color.amberInk
                out[a..<b].font = .system(size: 13, weight: .semibold)
            }
        }
        return out
    }

    /// "#RRGGBB" as a colour (an unreadable one is the palette's blue), in its dark-mode shade in
    /// dark mode when the presence palette pairs it with one (BoardComments.dark(of:)).
    static func color(_ hex: String) -> Color {
        let light = rgb(hex) ?? 0x2D639A
        if let dark = BoardComments.dark(of: hex).flatMap(rgb) { return Color(Palette.pair(light, dark)) }
        return Color(red: Double(light >> 16 & 0xFF) / 255, green: Double(light >> 8 & 0xFF) / 255, blue: Double(light & 0xFF) / 255)
    }

    private static func rgb(_ hex: String) -> UInt32? {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        return UInt32(s, radix: 16)
    }
}

/// A writer's mark: their initial on their colour, solid. An AI's is its own mark (as the AI tag
/// and Ask AI show it) on neutral graphite, white on it; light grey with the mark in black in dark
/// mode (round 12: an orange "C" read as the accent, and as a person).
struct BoardCommentAvatar: View {
    let letter: String
    let color: String
    var ai: String? = nil
    var size: CGFloat = BoardCommentUI.avatar

    var body: some View {
        Group {
            if let ai, AIGlyph.asset(ai) != nil, !AIGlyph.storeSafe {
                AIGlyph(ai: ai, size: size * 0.56, monochrome: true)
                    .foregroundStyle(Color(light: .white, dark: Color(red: 0.11, green: 0.11, blue: 0.12)))
                    .accessibilityIdentifier("comment.aiMark")
            } else {
                Text(letter)
                    .font(.system(size: size * 0.48, weight: .semibold))
                    .foregroundStyle(ai == nil ? Color.white : Color(light: .white, dark: Color(red: 0.11, green: 0.11, blue: 0.12)))
            }
        }
        .frame(width: size, height: size)
        .background(BoardCommentUI.color(color), in: .circle)
        .accessibilityHidden(true)
    }
}

/// One comment in a thread: who, when, what. Your own has Edit and Delete, from a right-click or
/// its ⋯ (shown as the pointer passes over it); Delete asks once, in place. A deleted one reads
/// "Comment deleted".
struct BoardCommentRow: View {
    let canvas: CanvasController
    let comment: BoardComment
    @State private var hovering = false

    private var mine: Bool { canvas.isMine(comment) && !comment.deleted && canvas.canComment }

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            BoardCommentAvatar(letter: BoardComments.initial(comment), color: canvas.color(of: comment), ai: comment.ai)
            VStack(alignment: .leading, spacing: 2) {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(canvas.byline(comment))
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.ink)
                        .lineLimit(1)
                    Text(BoardComments.when(comment, now: canvas.now()) + (comment.edited != nil && !comment.deleted ? " \u{00B7} " + BoardCommentUI.edited : ""))
                        .font(.system(size: 12))
                        .foregroundStyle(Color.muted)
                        .lineLimit(1)
                        .accessibilityIdentifier(comment.edited != nil ? "comment.edited" : "comment.when")
                    Spacer(minLength: 0)
                    if mine, canvas.editingComment != comment.id, canvas.deletingComment != comment.id {
                        Menu { actions } label: {
                            Image(systemName: "ellipsis")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Color.muted)
                                .frame(width: 22, height: 18)
                                .contentShape(.rect)
                        }
                        .menuStyle(.button)
                        .buttonStyle(.plain)
                        .menuIndicator(.hidden)
                        .fixedSize()
                        .hoverHighlight(RoundedRectangle(cornerRadius: 6, style: .continuous))
                        // Faint until the pointer is on the comment: there to find, and to VoiceOver.
                        .opacity(hovering ? 1 : 0.45)
                        #if os(macOS)
                        .help("Edit or delete")
                        #endif
                        .accessibilityLabel("More")
                        .accessibilityIdentifier("comment.more")
                    }
                }
                if canvas.editingComment == comment.id {
                    BoardCommentField(prompt: BoardCommentUI.replyPrompt, initial: comment.text, focusOnAppear: true, people: canvas.mentionable,
                                      action: BoardCommentUI.save, cancel: { canvas.editingComment = nil }) { canvas.edit(comment.id, $0) != nil || canvas.editingComment == nil }
                        .padding(.top, 2)
                        .accessibilityElement(children: .contain)
                        .accessibilityIdentifier("comment.editor")
                } else if comment.deleted {
                    Text(BoardComments.deletedText)
                        .font(.system(size: 13).italic())
                        .foregroundStyle(Color.muted)
                        .accessibilityIdentifier("comment.deleted")
                } else {
                    Text(BoardCommentUI.text(comment.text, mentions: canvas.names(of: comment.mentions)))
                        .font(.system(size: 13))
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                        .textSelection(.enabled)
                        .accessibilityIdentifier("comment.text")
                }
                if canvas.deletingComment == comment.id {
                    HStack(spacing: 8) {
                        Text(BoardCommentUI.deleteQuestion)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color.ink)
                            .accessibilityIdentifier("comment.deleteQuestion")
                        Spacer(minLength: 4)
                        Button(BoardCommentUI.cancel) { canvas.deletingComment = nil }
                            .controlSize(.small)
                            .keyboardShortcut(.cancelAction)
                            .accessibilityIdentifier("comment.deleteCancel")
                        Button(BoardCommentUI.deleteConfirm, role: .destructive) { canvas.delete(comment.id) }
                            .controlSize(.small)
                            .keyboardShortcut(.defaultAction)
                            .accessibilityIdentifier("comment.deleteConfirm")
                    }
                    .padding(.top, 6)
                    .accessibilityElement(children: .contain)
                    .accessibilityIdentifier("comment.deleteAsk")
                }
            }
        }
        .contentShape(.rect)
        .onHover { hovering = $0 }
        .contextMenu { if mine { actions } }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(mine ? "comment.row.mine" : "comment.row")
    }

    @ViewBuilder private var actions: some View {
        Button(BoardCommentUI.edit, systemImage: "pencil") { canvas.deletingComment = nil; canvas.editingComment = comment.id }
            .accessibilityIdentifier("comment.edit")
        Button(BoardCommentUI.delete, systemImage: "trash", role: .destructive) { canvas.editingComment = nil; canvas.deletingComment = comment.id }
            .accessibilityIdentifier("comment.delete")
    }
}

/// The field a comment or a reply is written in: grows to a few lines; Return posts, Option-Return
/// starts a new line; the arrow posts too. Typing @ offers the board's people (`people`): a click
/// or Return puts in "@Sara ". Editing a comment (`cancel`): Escape keeps it as it was.
struct BoardCommentField: View {
    let prompt: String
    var initial = ""
    var focusOnAppear = false
    var people: [BoardComments.Person] = []
    /// The send button's name ("Post", or "Save" while editing).
    var action = "Post"
    var cancel: (() -> Void)? = nil
    let post: (String) -> Bool
    @State private var text = ""
    @State private var began = false
    @FocusState private var focused: Bool

    private var empty: Bool { CanvasController.clean(text) == nil }

    /// The people offered for the mention being typed.
    var offered: [BoardComments.Person] {
        guard !people.isEmpty, let m = BoardComments.mentionQuery(in: text) else { return [] }
        return Array(BoardComments.suggestions(m.query, from: people).prefix(5))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            field
            let offered = offered
            if !offered.isEmpty {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(offered) { p in
                        Button { pick(p) } label: {
                            HStack(spacing: 6) {
                                Text("@" + p.name)
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(Color.ink)
                                Spacer(minLength: 0)
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        .hoverHighlight(RoundedRectangle(cornerRadius: 6, style: .continuous))
                        .accessibilityIdentifier("comment.mention.\(p.name)")
                    }
                }
                .padding(4)
                .background(Color.soft, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("comment.mentions")
            }
        }
        .onAppear {
            guard !began else { return }
            began = true
            text = initial
        }
    }

    private func pick(_ p: BoardComments.Person) {
        text = BoardComments.complete(text, with: p)
        focused = true
    }

    private var field: some View {
        HStack(alignment: .bottom, spacing: 6) {
            TextField(prompt, text: $text, prompt: Text(prompt), axis: .vertical)
                .textFieldStyle(.plain)
                .font(.system(size: 13))
                .lineLimit(1...6)
                .focused($focused)
                .onSubmit { if let first = offered.first { pick(first) } else { send() } }
                #if os(macOS)
                .onExitCommand { cancel?() }
                #endif
                .padding(.vertical, 5)
                .accessibilityIdentifier("comment.field")
            Button(action: send) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 20))
                    .symbolRenderingMode(.palette)
                    .foregroundStyle(.white, empty ? Color.muted.opacity(0.5) : Color.paneAccent)
                    .contentShape(.circle)
            }
            .buttonStyle(.plain)
            .disabled(empty)
            .hoverHighlight(Circle())
            #if os(macOS)
            .help(action)
            #endif
            .accessibilityLabel(action)
            .accessibilityIdentifier("comment.post")
        }
        .padding(.leading, 10)
        .padding(.trailing, 4)
        .padding(.vertical, 2)
        .background(Color.soft, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .onAppear { if focusOnAppear { DispatchQueue.main.async { focused = true } } }
    }

    func send() {
        guard !empty else { return }
        if post(text) { text = "" }
    }
}

/// A thread, by its pin: the first comment and its replies, a reply field for anyone who can
/// comment, and Resolve.
struct BoardThreadView: View {
    let canvas: CanvasController
    let id: String

    var body: some View {
        if let thread = canvas.threads.first(where: { $0.id == id }) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 4) {
                    BoardCommentRow(canvas: canvas, comment: thread.first)
                    if canvas.canComment {
                        Button { canvas.resolve(thread.id, !thread.resolved) } label: {
                            Image(systemName: thread.resolved ? "checkmark.circle.fill" : "checkmark.circle")
                                .font(.system(size: 16))
                                .foregroundStyle(thread.resolved ? Color.paneAccent : Color.amberInk)
                                .frame(width: 26, height: 26)
                                .contentShape(.circle)
                        }
                        .buttonStyle(.plain)
                        .hoverHighlight(Circle())
                        #if os(macOS)
                        .help(thread.resolved ? BoardCommentUI.reopen : BoardCommentUI.resolve)
                        #endif
                        .accessibilityLabel(thread.resolved ? BoardCommentUI.reopen : BoardCommentUI.resolve)
                        .accessibilityIdentifier("comment.resolve")
                    }
                }
                if !thread.replies.isEmpty {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(thread.replies) { BoardCommentRow(canvas: canvas, comment: $0) }
                        }
                    }
                    .scrollBounceBehavior(.basedOnSize)
                    .frame(maxHeight: 320)
                    .fixedSize(horizontal: false, vertical: true)
                }
                if canvas.canComment {
                    BoardCommentField(prompt: BoardCommentUI.replyPrompt, people: canvas.mentionable) { canvas.reply(to: thread.id, $0) != nil }
                }
            }
            .padding(14)
            .frame(width: BoardCommentUI.width, alignment: .leading)
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("comment.thread")
        }
    }
}

/// A new comment where its pin stands: one field, focused.
struct BoardCommentComposer: View {
    let canvas: CanvasController

    var body: some View {
        HStack(alignment: .center, spacing: 8) {
            BoardCommentAvatar(letter: String(canvas.author.name.trimmingCharacters(in: .whitespaces).first.map { String($0).uppercased() } ?? "?"),
                               color: canvas.colorOf(canvas.author.id))
            BoardCommentField(prompt: BoardCommentUI.newPrompt, focusOnAppear: true, people: canvas.mentionable) { canvas.post($0) != nil }
        }
        .padding(12)
        .frame(width: BoardCommentUI.width)
        .accessibilityIdentifier("comment.composer")
    }
}

/// Every thread on the board, the latest activity first; resolved ones only with Show resolved.
/// New Comment at its top picks the Comment tool (as C does). A row says who started it and when,
/// what it says, and where it is with its replies ("on Idea · 2 replies · last reply 2 min ago");
/// a click opens the thread by its pin.
struct BoardCommentsList: View {
    let canvas: CanvasController

    /// The order rows show in: the thread with the latest word first.
    static func ordered(_ threads: [BoardThread]) -> [BoardThread] {
        threads.sorted { a, b in
            let x = a.latestDate ?? .distantPast, y = b.latestDate ?? .distantPast
            return x != y ? x > y : a.id < b.id
        }
    }

    var body: some View {
        let all = canvas.threads
        let shown = Self.ordered(all.filter { canvas.showResolved || !$0.resolved })
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text(BoardCommentUI.title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.ink)
                    .accessibilityAddTraits(.isHeader)
                Spacer(minLength: 8)
                if all.contains(where: \.resolved) || canvas.showResolved {
                    Toggle(BoardCommentUI.showResolved, isOn: Bindable(canvas).showResolved)
                        #if os(macOS)
                        .toggleStyle(.checkbox)
                        #endif
                        .font(.system(size: 12))
                        .controlSize(.small)
                        .accessibilityIdentifier("comments.showResolved")
                }
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 4)
            if canvas.canComment, !canvas.viewOnly {
                Button { canvas.newComment() } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "plus.bubble")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.amberInk)
                            .frame(width: BoardCommentUI.avatar, height: BoardCommentUI.avatar)
                        Text(BoardCommentUI.new)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color.amberInk)
                        Spacer(minLength: 8)
                        Text("C")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.muted)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                    .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
                .buttonStyle(.plain)
                .hoverHighlight(RoundedRectangle(cornerRadius: 8, style: .continuous))
                #if os(macOS)
                .help("Click the board where the comment goes (C)")
                #endif
                .accessibilityIdentifier("comments.new")
                .padding(.horizontal, 6)
            }
            if shown.isEmpty {
                Text(canvas.canComment ? BoardCommentUI.empty : BoardCommentUI.emptyViewer)
                    .font(.system(size: 13))
                    .foregroundStyle(Color.muted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
                    .padding(.bottom, 4)
                    .accessibilityIdentifier("comments.empty")
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 2) {
                        ForEach(shown) { row($0) }
                    }
                    .padding(.horizontal, 6)
                    .padding(.bottom, 8)
                }
                .scrollBounceBehavior(.basedOnSize)
                .frame(maxHeight: 420)
                .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(width: BoardCommentUI.listWidth)
        .onAppear { canvas.markSeen() }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("comments.list")
    }

    private func row(_ t: BoardThread) -> some View {
        let now = canvas.now()
        let foot = BoardCommentUI.foot(place: canvas.place(of: t), replies: t.replies.count, last: t.replies.last.map { BoardComments.when($0, now: now) })
        return Button {
            canvas.showingComments = false
            // After the list has closed: a popover opening while another closes doesn't show.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { canvas.open(thread: t.id) }
        } label: {
            HStack(alignment: .top, spacing: 8) {
                BoardCommentAvatar(letter: BoardComments.initial(t.first), color: canvas.color(of: t.first), ai: t.first.ai)
                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text(canvas.byline(t.first))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color.ink)
                            .lineLimit(1)
                        // When it was started: the first comment's time, beside the first comment.
                        Text(BoardComments.when(t.first, now: now))
                            .font(.system(size: 12))
                            .foregroundStyle(Color.muted)
                            .lineLimit(1)
                            .accessibilityIdentifier("comments.row.when")
                        Spacer(minLength: 0)
                        if canvas.unreadMention(t) {
                            Text(BoardCommentUI.mentionsYou)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(Color.amberInk)
                                .accessibilityIdentifier("comments.row.mention")
                        } else if t.resolved {
                            Text(BoardCommentUI.resolvedTag)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(Color.muted)
                        }
                    }
                    Group {
                        if t.first.deleted {
                            Text(BoardComments.deletedText).italic().foregroundStyle(Color.muted)
                        } else {
                            Text(BoardCommentUI.text(t.first.text, mentions: canvas.names(of: t.first.mentions))).foregroundStyle(Color.ink)
                        }
                    }
                    .font(.system(size: 13))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    Text(foot)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.muted)
                        .lineLimit(1)
                        .accessibilityIdentifier("comments.row.foot")
                }
            }
            .opacity(t.resolved ? 0.6 : 1)
            .padding(.horizontal, 8)
            .padding(.vertical, 7)
            .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .hoverHighlight(RoundedRectangle(cornerRadius: 8, style: .continuous))
        .accessibilityIdentifier("comments.row")
    }
}

/// The toolbar's one Comments button (round 12: Comment and Comments were two near-identical
/// bubbles with Library between them; FigJam has one). A click opens the list, with New Comment at
/// its top; C picks the Comment tool; the button is tinted while it's picked. A quiet dot when
/// someone else wrote one you haven't seen, or mentioned you. Viewers have it too: they read
/// comments.
struct CanvasCommentsButton: View {
    let canvas: CanvasController

    var body: some View {
        let picked = canvas.state.tool == .comment
        Button { canvas.showingComments.toggle() } label: {
            Label(BoardCommentUI.title, systemImage: BoardCommentUI.symbol)
                .commentToolPicked(picked)
                .overlay(alignment: .topTrailing) {
                    if canvas.unseen {
                        Circle()
                            .fill(Color.paneAccent)
                            .frame(width: 7, height: 7)
                            .offset(x: 3, y: -1)
                            .accessibilityIdentifier("canvas.comments.dot")
                    }
                }
        }
        #if os(macOS)
        .help(canvas.unseen ? "Comments (new)" : BoardCommentUI.help)
        #endif
        .accessibilityValue(canvas.unseen ? "New comments" : "")
        .accessibilityAddTraits(picked ? .isSelected : [])
        .accessibilityIdentifier("canvas.comments")
        .popover(isPresented: Bindable(canvas).showingComments, arrowEdge: .bottom) { BoardCommentsList(canvas: canvas) }
    }
}

/// Where the open thread's popover hangs: a clear spot over its pin, which takes no click (the
/// pin under it does). Placed by the page as the pin moves.
struct CanvasCommentAnchor: View {
    let canvas: CanvasController
    let area: CGSize

    enum Shown: Hashable, Identifiable {
        case draft, thread(String)
        var id: Self { self }
    }

    private var shown: Shown? {
        guard canvas.commentAnchor != nil else { return nil }
        if let id = canvas.openThread { return .thread(id) }
        return canvas.draft == nil ? nil : .draft
    }

    /// The pin's rect, kept in the board (a pin scrolled off leaves its popover at the edge).
    static func placed(_ r: CGRect, in area: CGSize) -> CGRect {
        let w = min(r.width, area.width), h = min(r.height, area.height)
        return CGRect(x: min(max(r.minX, 0), max(area.width - w, 0)), y: min(max(r.minY, 0), max(area.height - h, 0)), width: w, height: h)
    }

    /// The clear spot over the pin: never takes a click (the pin under it does).
    static func spot(_ r: CGRect) -> some View {
        Color.clear
            .frame(width: max(r.width, 1), height: max(r.height, 1))
            .allowsHitTesting(false)
            .position(x: r.midX, y: r.midY)
    }

    var body: some View {
        let r = Self.placed(canvas.commentAnchor ?? CGRect(x: -100, y: -100, width: 1, height: 1), in: area)
        Color.clear
            .frame(width: max(r.width, 1), height: max(r.height, 1))
            .allowsHitTesting(false)
            .popover(item: Binding(get: { shown }, set: { if $0 == nil { canvas.popoverClosed() } }), arrowEdge: .trailing) { s in
                Group {
                    switch s {
                    case .draft: BoardCommentComposer(canvas: canvas)
                    case .thread(let id): BoardThreadView(canvas: canvas, id: id)
                    }
                }
                #if os(iOS)
                .presentationCompactAdaptation(.popover)
                #endif
            }
            .position(x: r.midX, y: r.midY)
            .accessibilityHidden(true)
    }
}

private extension View {
    /// The Comment tool picked: the button in the accent, as a picked tool is; otherwise untouched,
    /// so it dims with the window like the toolbar's other buttons.
    @ViewBuilder func commentToolPicked(_ on: Bool) -> some View {
        if on { foregroundStyle(Color.amberInk) } else { self }
    }
}
