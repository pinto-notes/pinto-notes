#if os(iOS)
import SwiftUI

/// Comments on the iPhone board (BoardComments), the same document and sync as the Mac's, laid
/// out for a phone (16 November 2026):
/// - the Comment tool on the dock: tap it, then tap a shape or a spot, and a comment is pinned
///   there (on the shape under it, so it moves with it). Tap the tool again to put it down;
/// - while the tool is picked, a bar above the dock says so and opens the Comments list;
/// - the list in a sheet: Show resolved and New Comment at its top, then the same rows as the
///   Mac's (who and when, what it says, "on Idea · 2 replies · last reply 2 min ago", Mentions you);
/// - a tap on a shape pins the comment to the shape's top right corner, where every pin on a
///   shape sits (round 14);
/// - a thread in a sheet over the lower half, its pin moved up above it, the board live round it;
/// - someone who can only view the board gets a Comments button where the dock would be: they
///   read comments and don't write them (BoardComments says why);
/// - someone who can comment (a Comment link) gets the Comment tool and the Comments button there:
///   no drawing tools, and comments as everyone writes them.
/// Every tap is 44 points square at least.

/// The Comment tool on the dock, with the quiet dot when someone else wrote one you haven't seen.
struct CanvasCommentDockButton: View {
    let canvas: CanvasController
    var well: Namespace.ID? = nil

    var body: some View {
        let picked = canvas.state.tool == .comment
        Button { picked ? canvas.pick(.selection) : canvas.startCommenting() } label: {
            CanvasWell(selected: picked, well: well) { Image(systemName: BoardCommentUI.symbol) }
                .overlay(alignment: .topTrailing) { if canvas.unseen { CanvasCommentDot().offset(x: -4, y: 5) } }
        }
        .buttonStyle(CanvasPressStyle())
        .disabled(!canvas.canComment)
        .accessibilityLabel(BoardCommentUI.comment)
        .accessibilityValue(canvas.unseen ? "New comments" : "")
        .accessibilityAddTraits(picked ? .isSelected : [])
        .accessibilityIdentifier("canvas.tool.comment")
    }
}

/// The unread dot: solid accent.
struct CanvasCommentDot: View {
    var body: some View {
        Circle()
            .fill(Color.paneAccent)
            .frame(width: 8, height: 8)
            .accessibilityIdentifier("canvas.comments.dot")
    }
}

/// Above the dock, while the Comment tool is picked: what to do, and the Comments list. For a
/// viewer, in place of the dock: the Comments list alone. The list's sheet hangs here.
struct CanvasPhoneComments: View {
    let canvas: CanvasController
    /// The thread a row of the list opened, once the list has gone (a sheet can't open while another closes).
    @State private var opening: String?

    static let hint = "Tap a shape or a spot to comment"

    var body: some View {
        // A container that's there when it shows nothing, so the list's sheet always hangs here.
        VStack(spacing: 0) {
            if canvas.viewOnly && !canvas.commentsOnly {
                listButton(alone: true)
                    .padding(6)
                    .glassEffect(.regular, in: .capsule)
                    .padding(.bottom, CanvasDock.margin)
            } else {
                if canvas.state.tool == .comment {
                    HStack(spacing: 4) {
                        Text(Self.hint)
                            .font(.subheadline)
                            .foregroundStyle(Color.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.85)
                            .padding(.leading, 14)
                            .accessibilityIdentifier("canvas.comment.hint")
                        listButton(alone: false)
                    }
                    .padding(.trailing, 4)
                    .frame(minHeight: BoardCommentUI.target)
                    .glassEffect(.regular, in: .capsule)
                    .padding(.bottom, 8)
                    .transition(.opacity)
                }
                // Can comment: no drawing tools, so the dock is the Comment tool and the list.
                if canvas.commentsOnly {
                    HStack(spacing: 2) {
                        CanvasCommentDockButton(canvas: canvas)
                        listButton(alone: true)
                    }
                    .padding(6)
                    .glassEffect(.regular, in: .capsule)
                    .padding(.bottom, CanvasDock.margin)
                    // A container: its buttons keep their own names (the identifier alone would
                    // be given to each of them).
                    .accessibilityElement(children: .contain)
                    .accessibilityIdentifier("canvas.commentDock")
                }
            }
        }
        .sheet(isPresented: Bindable(canvas).showingComments, onDismiss: {
            guard let id = opening else { return }
            opening = nil
            canvas.open(thread: id)
        }) {
            BoardCommentsSheet(canvas: canvas) { id in
                opening = id
                canvas.showingComments = false
            }
        }
    }

    /// Opens the list: "Comments", with the dot when there's something new.
    private func listButton(alone: Bool) -> some View {
        Button { canvas.showingComments = true } label: {
            HStack(spacing: 6) {
                Image(systemName: alone ? BoardCommentUI.symbol : "list.bullet")
                Text(BoardCommentUI.title)
                if canvas.unseen { CanvasCommentDot() }
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(Color.amberInk)
            .padding(.horizontal, 12)
            .frame(minHeight: BoardCommentUI.target)
            .contentShape(.capsule)
        }
        .buttonStyle(CanvasPressStyle())
        .accessibilityValue(canvas.unseen ? "New comments" : "")
        .accessibilityIdentifier("canvas.comments")
    }
}

/// Every thread on the board, in a sheet: Show resolved and New Comment at its top as on the Mac,
/// then the latest activity first, resolved ones with Show resolved. A tap opens the thread.
struct BoardCommentsSheet: View {
    let canvas: CanvasController
    let open: (String) -> Void

    var body: some View {
        let all = canvas.threads
        let shown = BoardCommentsList.ordered(all.filter { canvas.showResolved || !$0.resolved })
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 4) {
                    if all.contains(where: \.resolved) || canvas.showResolved {
                        Toggle(BoardCommentUI.showResolved, isOn: Bindable(canvas).showResolved)
                            .font(.body)
                            .frame(minHeight: BoardCommentUI.target)
                            .padding(.horizontal, 8)
                            .accessibilityIdentifier("comments.showResolved")
                    }
                    // New Comment, as at the top of the Mac's list (round 14, comments-iphone-4): the
                    // list goes and the Comment tool is picked, so the next tap places it.
                    if canvas.canComment {
                        Button { canvas.newComment() } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "plus.bubble")
                                    .font(.body.weight(.medium))
                                    .frame(width: BoardCommentUI.avatar, height: BoardCommentUI.avatar)
                                    .accessibilityHidden(true)
                                Text(BoardCommentUI.new)
                                    .font(.body.weight(.semibold))
                                Spacer(minLength: 0)
                            }
                            .foregroundStyle(Color.amberInk)
                            .padding(.horizontal, 8)
                            .frame(minHeight: BoardCommentUI.target)
                            .contentShape(.rect)
                        }
                        .buttonStyle(CanvasPressStyle())
                        .accessibilityIdentifier("comments.new")
                    }
                    if shown.isEmpty {
                        Text(canvas.canComment ? CanvasPhoneComments.hint : BoardCommentUI.emptyViewer)
                            .font(.body)
                            .foregroundStyle(Color.muted)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 32)
                            .accessibilityIdentifier("comments.empty")
                    } else {
                        ForEach(shown) { t in
                            BoardThreadRow(canvas: canvas, thread: t) { open(t.id) }
                                .frame(minHeight: BoardCommentUI.target)
                        }
                    }
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 16)
            }
            .navigationTitle(BoardCommentUI.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { canvas.showingComments = false }
                        .accessibilityIdentifier("comments.done")
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationBackground(Color(Palette.sheetGround))
        .onAppear { canvas.markSeen() }
        .accessibilityIdentifier("comments.list")
    }
}

/// The open thread, or the comment being written, in a sheet over the lower half of the board.
struct BoardThreadSheet: View {
    let canvas: CanvasController

    var body: some View {
        NavigationStack {
            Group {
                if let id = canvas.openThread, let t = canvas.threads.first(where: { $0.id == id }) {
                    thread(t)
                } else if canvas.draft != nil {
                    composer
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        // Solid, so the words never sit over the drawing.
        .presentationBackground(Color(Palette.sheetGround))
        // The board stays live above it: another pin, or the Comment tool, changes what it shows.
        .presentationBackgroundInteraction(.enabled(upThrough: .medium))
    }

    private func thread(_ t: BoardThread) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ForEach(t.all) { BoardCommentRow(canvas: canvas, comment: $0) }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .safeAreaInset(edge: .bottom) {
            if canvas.canComment {
                BoardCommentField(prompt: BoardCommentUI.replyPrompt, people: canvas.mentionable) { canvas.reply(to: t.id, $0) != nil }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
            }
        }
        .navigationTitle(BoardCommentUI.comment)
        .navigationSubtitle(BoardCommentUI.foot(place: canvas.place(of: t), replies: t.replies.count, last: nil))
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button(role: .close) { canvas.closeThread() }
                    .accessibilityIdentifier("comment.close")
            }
            if canvas.canComment {
                ToolbarItem(placement: .confirmationAction) {
                    Button(t.resolved ? BoardCommentUI.reopen : BoardCommentUI.resolve, systemImage: t.resolved ? "checkmark.circle.fill" : "checkmark.circle") {
                        canvas.resolve(t.id, !t.resolved)
                    }
                    .accessibilityIdentifier("comment.resolve")
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("comment.thread")
    }

    private var composer: some View {
        HStack(alignment: .top, spacing: 10) {
            BoardCommentAvatar(letter: String(canvas.author.name.trimmingCharacters(in: .whitespaces).first.map { String($0).uppercased() } ?? "?"),
                               color: canvas.colorOf(canvas.author.id))
                .padding(.top, 8)
            BoardCommentField(prompt: BoardCommentUI.newPrompt, focusOnAppear: true, people: canvas.mentionable) { canvas.post($0) != nil }
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .navigationTitle(BoardCommentUI.add)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button(role: .close) { canvas.closeThread() }
                    .accessibilityIdentifier("comment.close")
            }
        }
        .accessibilityIdentifier("comment.composer")
    }
}
#endif
