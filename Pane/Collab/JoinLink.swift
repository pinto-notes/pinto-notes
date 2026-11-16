import Foundation
import Observation
import SwiftUI

/// Opening a note's link in the app (`<site>/s/<id>#<secret>`, a universal link, or
/// `<scheme>://s/<id>#<secret>` from the link's web page): you join with the link's role and the
/// note opens (Can view shows it read-only), as a Google Docs link does. A note you're already in
/// just opens.
///
/// It used to ask first ("Join “Team offsite”? Emil shared it with you"), because any web page can
/// send the app a link and joining shows the owner your name and photo. Emil dropped the question
/// on 16 November 2026: you open the link to be in the note, and the question was in the way. What
/// protects you now is the line that comes up as soon as you've joined, "You joined Emil's note.
/// People in it see your name and photo.", with Leave beside it. Leave leaves the note the way
/// Share's Leave Note does, and the line goes by itself after `noticeFor`.
///
/// What the person sees: a short "Opening shared note…" while it joins. Signed out, the link waits
/// until you've signed in, then goes on by itself. A link that was turned off or changed, or no
/// connection, says so in words. Nothing spins for more than `timeout`.
@MainActor
@Observable
final class JoinCenter {
    static let shared = JoinCenter()

    enum Phase: Equatable { case idle, joining, failed(String) }
    private(set) var phase: Phase = .idle
    /// The line after joining ("You joined Emil's note…", with Leave), then while and after leaving.
    private(set) var notice: JoinNotice?
    /// A link waiting for the account to be ready (signed out, or still starting).
    @ObservationIgnored private(set) var pending: URL?
    @ObservationIgnored var timeout: Duration = .seconds(20)
    /// How long a link waits for you to sign in before it's dropped.
    @ObservationIgnored var signInWait: Duration = .seconds(15 * 60)
    /// How long the line after joining or leaving stays.
    @ObservationIgnored var noticeFor: Duration = .seconds(6)
    /// Joins with the link and opens the note. The live store by default.
    @ObservationIgnored var join: @MainActor (URL) async -> JoinOutcome = { @MainActor url in
        guard let store = CollabStore.shared else { return .failed(JoinCopy.unavailable) }
        return await store.join(url)
    }
    /// Leaves a note you joined, as Share's Leave Note does; nil when it worked, otherwise what to
    /// tell the person. The live store by default.
    @ObservationIgnored var leave: @MainActor (UUID) async -> String? = { @MainActor id in
        guard let store = CollabStore.shared else { return ShareController.failed(.leave) }
        return await JoinCenter.leave(id, in: store)
    }
    /// The account can join now (signed in, sharing started).
    @ObservationIgnored var ready: @MainActor () -> Bool = { @MainActor in CollabStore.shared?.isReady == true }
    @ObservationIgnored private var waiting: Task<Void, Never>?
    @ObservationIgnored private var noticeTask: Task<Void, Never>?

    /// A note's link, as the app reads it. Anything else isn't one.
    nonisolated static func isNoteLink(_ url: URL) -> Bool { CollabStore.parseLink(url) != nil }

    /// A link was opened: join now, or once you're signed in.
    func open(_ url: URL) {
        guard CollabFeature.isOn, Self.isNoteLink(url) else { return }
        Funnel.record(.shareStep(.inviteOpened))
        pending = url
        waiting?.cancel()
        waiting = Task { await go() }
    }

    @MainActor private final class Outcome { var value: JoinOutcome = .failed(JoinCopy.slow) }

    func dismissProblem() { if case .failed = phase { phase = .idle } }

    private func go() async {
        let started = ContinuousClock.now
        while !ready() {
            guard !Task.isCancelled, ContinuousClock.now - started < signInWait else { pending = nil; return }
            try? await Task.sleep(for: .milliseconds(300))
        }
        guard let url = pending, !Task.isCancelled else { return }
        pending = nil
        show(nil)
        phase = .joining
        let result = Outcome()
        do {
            try await ShareController.within(timeout) { result.value = await self.join(url) }
        } catch {
            result.value = .failed(JoinCopy.slow)
        }
        switch result.value {
        case .joined(let note, let owner):
            Funnel.record(.shareStep(.inviteAccepted))
            phase = .idle
            show(JoinNotice(kind: .joined, text: JoinCopy.joined(owner: owner), note: note))
        case .opened:
            phase = .idle
        case .failed(let why):
            phase = .failed(why)
        }
    }

    /// Leave, on the line after joining: out of the note again, as Share's Leave Note does.
    func leaveJoined() async {
        guard let n = notice, n.canLeave else { return }
        // "Leaving…" stays until it's done; it doesn't go by itself.
        show(JoinNotice(kind: .leaving, text: ShareCopy.working(.leave), note: n.note))
        if let problem = await leave(n.note) {
            show(JoinNotice(kind: .failed, text: problem, note: n.note))
        } else {
            show(JoinNotice(kind: .left, text: JoinCopy.left, note: n.note))
        }
    }

    /// Leaves the note with this id in your library through Share's own Leave Note
    /// (ShareController.confirmLeave): nil when it worked, otherwise what to tell the person.
    static func leave(_ id: UUID, in store: CollabStore) async -> String? {
        guard let note = store.context?.note(id), note.deletedAt == nil else { return ShareController.failed(.leave) }
        let share = ShareController(note: note, backend: store)
        // Never your own note: that one you stop sharing, from Share.
        guard !share.isOwner else { return ShareController.failed(.leave) }
        await share.confirmLeave()
        return share.state.problem
    }

    private func show(_ n: JoinNotice?) {
        noticeTask?.cancel()
        notice = n
        guard let n, n.kind != .leaving else { return }
        noticeTask = Task { [weak self, noticeFor] in
            try? await Task.sleep(for: noticeFor)
            guard !Task.isCancelled, let self, self.notice?.id == n.id else { return }
            self.notice = nil
        }
    }
}

/// What opening a note's link did.
enum JoinOutcome: Equatable, Sendable {
    /// You joined: the note is in your notes and open. `note` is its id in your library.
    case joined(note: UUID, owner: String?)
    /// You were in it already: it just opened.
    case opened
    /// It didn't open: what to tell the person.
    case failed(String)

    var worked: Bool { if case .failed = self { false } else { true } }
}

/// The line at the foot of the window after a link joined a note: what happened, and Leave.
struct JoinNotice: Equatable, Identifiable {
    enum Kind: Equatable { case joined, leaving, left, failed }
    let id = UUID()
    var kind: Kind
    var text: String
    /// The note joined, in your library: Leave leaves it.
    var note: UUID
    /// Leave shows after joining, and again when leaving didn't work.
    var canLeave: Bool { kind == .joined || kind == .failed }
}

enum JoinCopy {
    /// "You joined Emil's note. People in it see your name and photo."
    static func joined(owner: String?) -> String {
        let whose = owner.map { "\(ShareCopy.first($0))'s note" } ?? "the note"
        return "You joined \(whose). People in it see your name and photo."
    }

    static let leave = "Leave"
    static let left = "You left the note."
    static let joining = "Opening shared note…"
    static let failedTitle = "The shared note didn’t open"
    static let failed = "This link didn’t open. Ask for a new one."
    static let slow = "Opening the note took too long. Check your connection and open the link again."
    static let unavailable = "Sharing isn't available in this version of Pinto Notes."
}

/// Listens for note links wherever the app is (signed in or not), shows the short "Opening…"
/// line while it joins, the line with Leave once it has, and says plainly when a link doesn't open.
struct JoinLinkHandler: ViewModifier {
    @State var center = JoinCenter.shared
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .onOpenURL { url in center.open(url) }
            .overlay(alignment: .top) {
                if center.phase == .joining {
                    JoiningBanner()
                        .padding(.top, 12)
                        .transition(.opacity)
                }
            }
            .overlay(alignment: .bottom) {
                if let n = center.notice {
                    JoinedToast(notice: n) { Task { await center.leaveJoined() } }
                        .padding(.horizontal, 24)
                        #if os(macOS)
                        .padding(.bottom, 20)
                        #else
                        // Clear of the foot of the screen, as the note's own notices are.
                        .padding(.bottom, 64)
                        #endif
                        .transition(.opacity)
                }
            }
            .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: center.phase)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: center.notice)
            .alert(JoinCopy.failedTitle, isPresented: Binding(get: { if case .failed = center.phase { true } else { false } },
                                                              set: { if !$0 { center.dismissProblem() } })) {
                Button("OK", role: .cancel) { center.dismissProblem() }
            } message: {
                if case .failed(let why) = center.phase { Text(why) }
            }
    }
}

/// "You joined Emil's note. People in it see your name and photo." with Leave: the app's one toast,
/// at the foot of the window, gone by itself after a few seconds.
struct JoinedToast: View {
    let notice: JoinNotice
    let leave: () -> Void

    private var kind: Toast.Kind {
        switch notice.kind {
        case .joined, .left: .done
        case .leaving: .working
        case .failed: .failed
        }
    }

    var body: some View {
        Toast(text: notice.text, kind: kind, lines: 2, undo: notice.canLeave ? leave : nil,
              actionTitle: JoinCopy.leave, actionID: "collab.joined.leave")
            .accessibilityIdentifier("collab.joined")
            .task(id: notice.id) { AccessibilityNotification.Announcement(notice.text).post() }
    }
}

/// "Opening shared note…": solid, small, at the top, gone as soon as the note opens.
struct JoiningBanner: View {
    var body: some View {
        HStack(spacing: 8) {
            ProgressView().controlSize(.small)
            Text(JoinCopy.joining).font(.callout)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(Color(Palette.page), in: .capsule)
        .overlay(Capsule().strokeBorder(Color.primary.opacity(0.12)))
        .shadow(color: .black.opacity(0.12), radius: 8, y: 2)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("collab.joining")
    }
}

extension View {
    func joinLinkHandler() -> some View { modifier(JoinLinkHandler()) }
}
