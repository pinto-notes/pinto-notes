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
    static let help = "Comments"
    static let add = "Add Comment"
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

/// A writer's mark: their initial on their colour, solid (an AI's on the accent's brown).
struct BoardCommentAvatar: View {
    let letter: String
    let color: String
    var size: CGFloat = BoardCommentUI.avatar

    var body: some View {
        Text(letter)
            .font(.system(size: size * 0.48, weight: .semibold))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(BoardCommentUI.color(color), in: .circle)
            .accessibilityHidden(true)
    }
}

/// One comment in a thread: who, when, what.
struct BoardCommentRow: View {
    let canvas: CanvasController
    let comment: BoardComment

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            BoardCommentAvatar(letter: BoardComments.initial(comment), color: canvas.color(of: comment))
            VStack(alignment: .leading, spacing: 2) {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(canvas.byline(comment))
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.ink)
                        .lineLimit(1)
                    Text(BoardComments.when(comment, now: canvas.now()))
                        .font(.system(size: 12))
                        .foregroundStyle(Color.muted)
                        .lineLimit(1)
                }
                Text(comment.text)
                    .font(.system(size: 13))
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .textSelection(.enabled)
            }
            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("comment.row")
    }
}

/// The field a comment or a reply is written in: grows to a few lines; Return posts, Option-Return
/// starts a new line; the arrow posts too.
struct BoardCommentField: View {
    let prompt: String
    var focusOnAppear = false
    let post: (String) -> Bool
    @State private var text = ""
    @FocusState private var focused: Bool

    private var empty: Bool { CanvasController.clean(text) == nil }

    var body: some View {
        HStack(alignment: .bottom, spacing: 6) {
            TextField(prompt, text: $text, prompt: Text(prompt), axis: .vertical)
                .textFieldStyle(.plain)
                .font(.system(size: 13))
                .lineLimit(1...6)
                .focused($focused)
                .onSubmit(send)
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
            .help("Post")
            #endif
            .accessibilityLabel("Post")
            .accessibilityIdentifier("comment.post")
        }
        .padding(.leading, 10)
        .padding(.trailing, 4)
        .padding(.vertical, 2)
        .background(Color.soft, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .onAppear { if focusOnAppear { DispatchQueue.main.async { focused = true } } }
    }

    private func send() {
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
                    BoardCommentField(prompt: BoardCommentUI.replyPrompt) { canvas.reply(to: thread.id, $0) != nil }
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
            BoardCommentField(prompt: BoardCommentUI.newPrompt, focusOnAppear: true) { canvas.post($0) != nil }
        }
        .padding(12)
        .frame(width: BoardCommentUI.width)
        .accessibilityIdentifier("comment.composer")
    }
}

/// Every thread on the board, newest last; resolved ones only with Show resolved. A row opens its
/// thread by its pin.
struct BoardCommentsList: View {
    let canvas: CanvasController

    var body: some View {
        let all = canvas.threads
        let shown = all.filter { canvas.showResolved || !$0.resolved }
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
            .padding(.bottom, 6)
            if shown.isEmpty {
                VStack(spacing: 12) {
                    Text(canvas.canComment ? BoardCommentUI.empty : BoardCommentUI.emptyViewer)
                        .font(.system(size: 13))
                        .foregroundStyle(Color.muted)
                        .accessibilityIdentifier("comments.empty")
                    if canvas.canComment, !canvas.viewOnly {
                        Button(BoardCommentUI.add) {
                            canvas.showingComments = false
                            canvas.startCommenting()
                        }
                        .accessibilityIdentifier("comments.add")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .padding(.bottom, 4)
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 2) {
                        ForEach(shown.reversed()) { row($0) }
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
        .accessibilityIdentifier("comments.list")
    }

    private func row(_ t: BoardThread) -> some View {
        Button {
            canvas.showingComments = false
            // After the list has closed: a popover opening while another closes doesn't show.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { canvas.open(thread: t.id) }
        } label: {
            HStack(alignment: .top, spacing: 8) {
                BoardCommentAvatar(letter: BoardComments.initial(t.first), color: canvas.color(of: t.first))
                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text(canvas.byline(t.first))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color.ink)
                            .lineLimit(1)
                        Text(BoardComments.when(t.replies.last ?? t.first, now: canvas.now()))
                            .font(.system(size: 12))
                            .foregroundStyle(Color.muted)
                            .lineLimit(1)
                        Spacer(minLength: 0)
                        if t.resolved {
                            Text(BoardCommentUI.resolvedTag)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(Color.muted)
                        }
                    }
                    Text(t.first.text)
                        .font(.system(size: 13))
                        .foregroundStyle(Color.ink)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    if !t.replies.isEmpty {
                        Text(BoardCommentUI.replies(t.replies.count))
                            .font(.system(size: 12))
                            .foregroundStyle(Color.muted)
                    }
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

/// The toolbar's Comments: the list in a popover, and a quiet dot when someone else wrote one you
/// haven't seen. Viewers have it too: they read comments.
struct CanvasCommentsButton: View {
    let canvas: CanvasController

    var body: some View {
        Button { canvas.showingComments.toggle() } label: {
            Label(BoardCommentUI.title, systemImage: BoardCommentUI.symbol)
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
