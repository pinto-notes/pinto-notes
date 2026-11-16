import SwiftUI

/// Comments on a whiteboard, the app's side (BoardComments, 15 November 2026): a thread opens in a
/// popover by its pin, a new comment is written in one, and the toolbar's Comments lists every
/// thread. Solid, plain and quiet, as the Mac's own popovers are: space between comments, never
/// lines; a reply field at the foot; Resolve at the top, as the thread's one action.
enum BoardCommentUI {
    static let width: CGFloat = 300
    static let listWidth: CGFloat = 320
    #if os(iOS)
    // iPhone: the system's text sizes (Dynamic Type), and taps 44 points square (the HIG).
    static let avatar: CGFloat = 28
    static let nameFont = Font.subheadline.weight(.semibold)
    static let textFont = Font.body
    static let mentionFont = Font.body.weight(.semibold)
    static let metaFont = Font.footnote
    static let tagFont = Font.caption.weight(.semibold)
    static let target: CGFloat = 44
    #else
    static let avatar: CGFloat = 22
    static let nameFont = Font.system(size: 13, weight: .semibold)
    static let textFont = Font.system(size: 13)
    static let mentionFont = Font.system(size: 13, weight: .semibold)
    static let metaFont = Font.system(size: 12)
    static let tagFont = Font.system(size: 11, weight: .semibold)
    #endif
    /// How much of the board stays in sight above an iPhone thread's sheet: its pin moves up into it.
    static let sheetRoom = 0.45
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
    static let showChange = "Show change"
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
                out[a..<b].font = mentionFont
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
                        .font(BoardCommentUI.nameFont)
                        .foregroundStyle(Color.ink)
                        .lineLimit(1)
                    Text(BoardComments.when(comment, now: canvas.now()) + (comment.edited != nil && !comment.deleted ? " \u{00B7} " + BoardCommentUI.edited : ""))
                        .font(BoardCommentUI.metaFont)
                        .foregroundStyle(Color.muted)
                        .lineLimit(1)
                        .accessibilityIdentifier(comment.edited != nil ? "comment.edited" : "comment.when")
                    Spacer(minLength: 0)
                    if mine, canvas.editingComment != comment.id, canvas.deletingComment != comment.id {
                        Menu { actions } label: {
                            Image(systemName: "ellipsis")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Color.muted)
                                #if os(iOS)
                                .frame(width: BoardCommentUI.target, height: BoardCommentUI.target)
                                #else
                                .frame(width: 22, height: 18)
                                #endif
                                .contentShape(.rect)
                        }
                        .menuStyle(.button)
                        .buttonStyle(.plain)
                        .menuIndicator(.hidden)
                        .fixedSize()
                        .hoverHighlight(RoundedRectangle(cornerRadius: 6, style: .continuous))
                        #if os(macOS)
                        // Faint until the pointer is on the comment: there to find, and to VoiceOver.
                        .opacity(hovering ? 1 : 0.45)
                        .help("Edit or delete")
                        #else
                        // Room for a 44-point tap without pushing the line down.
                        .padding(.vertical, -13)
                        .padding(.trailing, -12)
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
                        .font(BoardCommentUI.textFont.italic())
                        .foregroundStyle(Color.muted)
                        .accessibilityIdentifier("comment.deleted")
                } else {
                    Text(BoardCommentUI.text(comment.text, mentions: canvas.names(of: comment.mentions)))
                        .font(BoardCommentUI.textFont)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                        .textSelection(.enabled)
                        .accessibilityIdentifier("comment.text")
                    // An AI's reply about its change: that change, outlined and brought into view
                    // (round 13: "nothing in the thread links to the change"), after reopening too;
                    // when it's gone from the board, the thread says so (round 14).
                    if canvas.changeLink(for: comment) == .gone {
                        Text(CanvasController.changeGone)
                            .font(BoardCommentUI.metaFont)
                            .foregroundStyle(Color.muted)
                            .padding(.top, 2)
                            .accessibilityIdentifier("comment.changeGone")
                    } else if case .show(let change)? = canvas.changeLink(for: comment) {
                        Button {
                            #if os(iOS)
                            canvas.closeThread()
                            #endif
                            canvas.show(change)
                        } label: {
                            Label(BoardCommentUI.showChange, systemImage: "scope")
                                .font(BoardCommentUI.metaFont.weight(.medium))
                                .foregroundStyle(Color.paneAccent)
                                #if os(iOS)
                                .frame(minHeight: BoardCommentUI.target)
                                #endif
                                .contentShape(.rect)
                        }
                        .buttonStyle(.hoverLink)
                        .padding(.top, 2)
                        #if os(macOS)
                        .help("Outline what \(change.by) changed, and bring it into view")
                        #endif
                        .accessibilityIdentifier("comment.showChange")
                    }
                }
                #if os(macOS)
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
                #endif
            }
        }
        .contentShape(.rect)
        .onHover { hovering = $0 }
        .contextMenu { if mine { actions } }
        #if os(iOS)
        // Delete asks once, as iPhone asks: a sheet of choices from the foot.
        .confirmationDialog(BoardCommentUI.deleteQuestion, isPresented: Binding(get: { canvas.deletingComment == comment.id },
                                                                               set: { if !$0, canvas.deletingComment == comment.id { canvas.deletingComment = nil } }),
                            titleVisibility: .visible) {
            Button(BoardCommentUI.deleteConfirm, role: .destructive) { canvas.delete(comment.id) }
                .accessibilityIdentifier("comment.deleteConfirm")
            Button(BoardCommentUI.cancel, role: .cancel) { canvas.deletingComment = nil }
        } message: {
            Text(comment.isReply ? "The reply goes for everyone on the board." : "Its replies stay, under \u{201C}\(BoardComments.deletedText)\u{201D}.")
        }
        #endif
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
                                    .font(BoardCommentUI.mentionFont)
                                    .foregroundStyle(Color.ink)
                                Spacer(minLength: 0)
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            #if os(iOS)
                            .frame(minHeight: BoardCommentUI.target)
                            #endif
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
                .font(BoardCommentUI.textFont)
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
                    #if os(iOS)
                    .font(.system(size: 28))
                    .frame(width: BoardCommentUI.target, height: BoardCommentUI.target)
                    #else
                    .font(.system(size: 20))
                    #endif
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
            if canvas.canComment {
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
        BoardThreadRow(canvas: canvas, thread: t) {
            canvas.showingComments = false
            // After the list has closed: a popover opening while another closes doesn't show.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { canvas.open(thread: t.id) }
        }
    }
}

/// A thread in the Comments list: who started it and when, what it says, and where it is with its
/// replies ("on Idea · 2 replies · last reply 2 min ago"). The same on the Mac and iPhone.
struct BoardThreadRow: View {
    let canvas: CanvasController
    let thread: BoardThread
    let open: () -> Void

    var body: some View {
        let t = thread
        let now = canvas.now()
        let foot = BoardCommentUI.foot(place: canvas.place(of: t), replies: t.replies.count, last: t.replies.last.map { BoardComments.when($0, now: now) })
        return Button(action: open) {
            HStack(alignment: .top, spacing: 8) {
                BoardCommentAvatar(letter: BoardComments.initial(t.first), color: canvas.color(of: t.first), ai: t.first.ai)
                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text(canvas.byline(t.first))
                            .font(BoardCommentUI.nameFont)
                            .foregroundStyle(Color.ink)
                            .lineLimit(1)
                        // When it was started: the first comment's time, beside the first comment.
                        Text(BoardComments.when(t.first, now: now))
                            .font(BoardCommentUI.metaFont)
                            .foregroundStyle(Color.muted)
                            .lineLimit(1)
                            .accessibilityIdentifier("comments.row.when")
                        Spacer(minLength: 0)
                        if canvas.unreadMention(t) {
                            Text(BoardCommentUI.mentionsYou)
                                .font(BoardCommentUI.tagFont)
                                .foregroundStyle(Color.amberInk)
                                .accessibilityIdentifier("comments.row.mention")
                        } else if t.resolved {
                            Text(BoardCommentUI.resolvedTag)
                                .font(BoardCommentUI.tagFont.weight(.medium))
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
                    .font(BoardCommentUI.textFont)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    Text(foot)
                        .font(BoardCommentUI.metaFont)
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

    /// About how big the open thread's popover is: its width, and a height for its comments.
    static func popoverSize(_ canvas: CanvasController) -> CGSize {
        let n = canvas.openThread.map { id in canvas.comments.filter { $0.id == id || $0.thread == id }.count } ?? 0
        return CGSize(width: BoardCommentUI.width + 4, height: min(420, 76 + CGFloat(max(n, 1)) * 56))
    }

    /// Where a popover of `size` hanging off `anchor` lands on each side (`edge` is the side it
    /// opens on, as AppKit hangs one, with its 13 pt arrow), slid along that side to stay in the board.
    static func frame(_ edge: Edge, anchor a: CGRect, size: CGSize, area: CGSize) -> CGRect {
        let arrow: CGFloat = 13
        var f: CGRect
        switch edge {
        case .trailing: f = CGRect(x: a.maxX + arrow, y: a.midY - size.height / 2, width: size.width, height: size.height)
        case .leading: f = CGRect(x: a.minX - arrow - size.width, y: a.midY - size.height / 2, width: size.width, height: size.height)
        case .top: f = CGRect(x: a.midX - size.width / 2, y: a.minY - arrow - size.height, width: size.width, height: size.height)
        case .bottom: f = CGRect(x: a.midX - size.width / 2, y: a.maxY + arrow, width: size.width, height: size.height)
        }
        if edge == .top || edge == .bottom { f.origin.x = min(max(f.minX, 4), max(4, area.width - 4 - f.width)) }
        else { f.origin.y = min(max(f.minY, 4), max(4, area.height - 4 - f.height)) }
        return f
    }

    struct Placement: Equatable {
        /// What the popover hangs off: the pin, or the shape the comment is on.
        var anchor: CGRect
        /// The side it opens on.
        var edge: Edge
    }

    /// Where the thread hangs: beside its pin (right, left, above, below), else off the commented
    /// shape's own edges (its arrow still points at the shape), on the first side where it covers
    /// none of the shape and what's drawn near it (round 13, comments-2-thread-open: it hid Draft
    /// and its arrows). With no side clear, the side that covers least, beside the pin.
    static func placement(pin: CGRect, around: CanvasController.CommentSurroundings, area: CGSize, size: CGSize) -> Placement {
        let sides: [Edge] = [.trailing, .leading, .top, .bottom]
        let keep = around.near + (around.on.map { [$0] } ?? [])
        func fits(_ f: CGRect) -> Bool { f.minX >= 0 && f.minY >= 0 && f.maxX <= area.width && f.maxY <= area.height }
        func covered(_ f: CGRect) -> CGFloat {
            var sum: CGFloat = 0
            for k in around.near { let i = f.intersection(k.insetBy(dx: -6, dy: -6)); if !i.isNull { sum += max(i.width * i.height, 1) } }
            // The commented shape counts four times what's near it.
            if let on = around.on { let i = f.intersection(on.insetBy(dx: -6, dy: -6)); if !i.isNull { sum += max(i.width * i.height, 1) * 4 } }
            return sum
        }
        var anchors = [pin]
        if let on = around.on, !keep.isEmpty { anchors.append(placed(on, in: area)) }
        for a in anchors {
            for e in sides {
                let f = frame(e, anchor: a, size: size, area: area)
                if fits(f), covered(f) == 0 { return Placement(anchor: a, edge: e) }
            }
        }
        let scored = sides.map { e -> (Edge, CGFloat, Bool) in
            let f = frame(e, anchor: pin, size: size, area: area)
            return (e, covered(f), fits(f))
        }
        let fitting = scored.filter(\.2)
        return Placement(anchor: pin, edge: (fitting.isEmpty ? scored : fitting).min { $0.1 < $1.1 }?.0 ?? .trailing)
    }

    /// The clear spot over the pin: never takes a click (the pin under it does).
    static func spot(_ r: CGRect) -> some View {
        Color.clear
            .frame(width: max(r.width, 1), height: max(r.height, 1))
            .allowsHitTesting(false)
            .position(x: r.midX, y: r.midY)
    }

    var body: some View {
        #if os(iOS)
        // iPhone: a thread, or a new comment, is a sheet over the lower half (BoardCommentPhone),
        // with its pin moved up above it. The board stays live round it: another pin, or a tap
        // with the Comment tool, changes what the sheet shows.
        Color.clear
            .frame(width: 1, height: 1)
            .allowsHitTesting(false)
            .sheet(isPresented: Binding(get: { canvas.openThread != nil || canvas.draft != nil }, set: { if !$0 { canvas.closeThread() } })) {
                BoardThreadSheet(canvas: canvas)
            }
            .onAppear { canvas.focusRoom = BoardCommentUI.sheetRoom }
            .accessibilityHidden(true)
        #else
        let pin = Self.placed(canvas.commentAnchor ?? CGRect(x: -100, y: -100, width: 1, height: 1), in: area)
        let where_ = Self.placement(pin: pin, around: canvas.commentAround, area: area, size: Self.popoverSize(canvas))
        let r = where_.anchor, edge = where_.edge
        Color.clear
            .frame(width: max(r.width, 1), height: max(r.height, 1))
            .allowsHitTesting(false)
            .popover(item: Binding(get: { shown }, set: { if $0 == nil { canvas.popoverClosed() } }), arrowEdge: edge) { s in
                switch s {
                case .draft: BoardCommentComposer(canvas: canvas)
                case .thread(let id): BoardThreadView(canvas: canvas, id: id)
                }
            }
            .position(x: r.midX, y: r.midY)
            .accessibilityHidden(true)
        #endif
    }
}

private extension View {
    /// The Comment tool picked: the button in the accent, as a picked tool is; otherwise untouched,
    /// so it dims with the window like the toolbar's other buttons.
    @ViewBuilder func commentToolPicked(_ on: Bool) -> some View {
        if on { foregroundStyle(Color.amberInk) } else { self }
    }
}
