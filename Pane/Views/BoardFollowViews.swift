import SwiftUI

/// Following someone on a shared whiteboard, the app's side (BoardFollow): the banner at the top of
/// the board, the outline round it while you follow, and the presenter's count of followers.
enum BoardFollowUI {
    /// The outline round the board while you follow someone, in their colour (FigJam's observe).
    static let outline: CGFloat = 3
    #if os(iOS)
    static let height: CGFloat = 44
    static let font = Font.subheadline.weight(.semibold)
    #else
    static let height: CGFloat = 32
    static let font = Font.system(size: 13, weight: .semibold)
    #endif

    /// Where a banner at the top of the board stands: under the Mac's tool palette while it's on
    /// the board; just under the window's bar while the tools are up in it (`toolsInBar`).
    @MainActor static func top(_ canvas: CanvasController, toolsInBar: Bool = false) -> CGFloat {
        #if os(macOS)
        CanvasToolPalette.shows(canvas) && !toolsInBar ? CanvasToolPalette.below : 12
        #else
        12
        #endif
    }
}

/// The banner over a shared board: "Sara is presenting" with Follow, or "Following Sara" with Stop
/// following. Solid, in their colour, white words; it takes clicks on itself only. While you follow,
/// a thin outline in their colour runs round the board.
struct CanvasFollowBanner: View {
    let canvas: CanvasController
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    #if os(macOS)
    @Environment(\.boardTools) private var place
    private var top: CGFloat { BoardFollowUI.top(canvas, toolsInBar: place.tools.inBar) }
    #else
    private var top: CGFloat { BoardFollowUI.top(canvas) }
    #endif

    var body: some View {
        let banner = canvas.followBanner
        ZStack(alignment: .top) {
            if case .following(let p)? = banner {
                Rectangle()
                    .strokeBorder(BoardCommentUI.color(p.color), lineWidth: BoardFollowUI.outline)
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
                    .transition(.opacity)
            }
            if let banner {
                bar(banner)
                    .padding(.top, top)
                    .transition(.opacity)
            }
        }
        // At the top of the board whether or not the outline fills it.
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: banner)
    }

    private func bar(_ banner: BoardFollow.Banner) -> some View {
        let tint = BoardCommentUI.color(banner.person.color)
        let frames = canvas.state.frames
        return HStack(spacing: 10) {
            Text(banner.words { id in frames.first { $0.id == id }?.name })
                .font(BoardFollowUI.font)
                .foregroundStyle(Color.white)
                .lineLimit(1)
                .accessibilityIdentifier("canvas.follow.line")
            Button {
                switch banner {
                case .presenting(let p): canvas.follow(p.id)
                case .following: canvas.stopFollowing()
                }
            } label: {
                Text(banner.action)
                    .font(BoardFollowUI.font)
                    .foregroundStyle(tint)
                    .padding(.horizontal, 12)
                    #if os(iOS)
                    .frame(minHeight: 32)
                    #else
                    .frame(minHeight: 22)
                    #endif
                    .background(Color.white, in: .capsule)
                    .contentShape(.capsule)
            }
            .buttonStyle(.plain)
            #if os(iOS)
            // A tap 44 points tall, as the HIG asks, though the pill is drawn smaller.
            .frame(minHeight: BoardFollowUI.height)
            .contentShape(.rect)
            #else
            .hoverHighlight(Capsule())
            .help(banner.action == BoardFollow.stop ? "Stop following (Esc)" : "Your view moves with \(banner.person.name)\u{2019}s")
            #endif
            .modifier(StopKey(on: banner.action == BoardFollow.stop))
            .accessibilityIdentifier(banner.action == BoardFollow.stop ? "canvas.follow.stop" : "canvas.follow.start")
        }
        .padding(.leading, 14)
        .padding(.trailing, 5)
        .frame(minHeight: BoardFollowUI.height)
        .background(tint, in: .capsule)
        .fixedSize()
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("canvas.follow")
    }

    /// Escape stops following, wherever the keys are (the board takes it too, when it has them).
    private struct StopKey: ViewModifier {
        let on: Bool
        func body(content: Content) -> some View {
            #if os(macOS)
            if on { content.keyboardShortcut(.cancelAction) } else { content }
            #else
            content
            #endif
        }
    }
}

/// The presenter's word on who follows them, in the Present bar: "Sara is following", "3 following".
struct CanvasFollowers: View {
    let canvas: CanvasController

    var body: some View {
        if let line = BoardFollow.followersLine(canvas.followers) {
            Label(line, systemImage: "eye")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.secondary)
                .labelStyle(.titleAndIcon)
                .lineLimit(1)
                .fixedSize()
                .padding(.leading, 6)
                .accessibilityIdentifier("canvas.present.followers")
        }
    }
}

/// The people menu's Follow items on a shared board: each person here, to follow their view (as
/// FigJam's observe), or to stop.
struct CanvasFollowItems: View {
    let canvas: CanvasController

    var body: some View {
        ForEach(canvas.people.filter { !$0.stale }) { p in
            if canvas.following == p.id {
                Button("Stop Following \(p.name)", systemImage: "eye.slash") { canvas.stopFollowing() }
                    .accessibilityIdentifier("collab.unfollow.\(p.name)")
            } else {
                Button("Follow \(p.name)", systemImage: "eye") { canvas.follow(p.id) }
                    .accessibilityIdentifier("collab.follow.\(p.name)")
            }
        }
    }
}
