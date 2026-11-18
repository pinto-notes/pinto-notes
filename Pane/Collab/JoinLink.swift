import Foundation
import Observation
import SwiftUI

/// Opening a note's link in the app: you join with the link's role and the note opens (Can view
/// shows it read-only), as a Google Docs link does. A note you're already in just opens. How it
/// asks depends on how the link came:
///
/// - `<site>/s/<id>#<secret>` as a universal link joins straight away. The system opens the app
///   with one only when a person taps the link, so the tap is the yes.
/// - `<scheme>://s/<id>#<secret>`, the app's own scheme, asks first: "Join “Team offsite”? Emil
///   shared it with you. People in it see your name and photo." Any web page can send the app
///   one without a tap (the link's own page does when the universal link didn't open the app, as
///   when the link is pasted into the address bar), and joining shows the owner your name and photo.
///
/// Until 16 November 2026 every link asked. Emil dropped the question for the tapped link: you
/// open the link to be in the note, and the question was in the way. What protects you then is the
/// line that comes up as soon as you've joined, "You joined Emil's note. People in it see your name
/// and photo.", with Leave beside it (after Join on the question too). Leave leaves the note the
/// way Share's Leave Note does, and the line goes by itself after `noticeFor`.
///
/// Every way a link reaches the app goes through `ConnectCenter.receive` (onOpenURL, the
/// universal link's user activity, and on the Mac the URL Apple event it takes for itself), which
/// hands note links here. The scheme is what tells the two apart.
///
/// What the person sees: a short "Opening shared note…" while the link is read and while it
/// joins. Signed out, the link waits until you've signed in, then goes on by itself. A link that
/// was turned off or changed, or no connection, says so in words. Nothing spins for more than
/// `timeout`.
@MainActor
@Observable
final class JoinCenter {
    static let shared = JoinCenter()

    enum Phase: Equatable { case idle, joining, asking(JoinPreview), failed(String) }
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
    /// What a link leads to, before joining: asked only for a link by the app's own scheme. The
    /// live store by default.
    @ObservationIgnored var preview: @MainActor (URL) async -> Result<JoinPreview, JoinFailure> = { @MainActor url in
        guard let store = CollabStore.shared else { return .failure(JoinFailure(JoinCopy.unavailable)) }
        return await store.preview(url)
    }
    /// The link being asked about.
    @ObservationIgnored private var asked: URL?
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

    /// A link by the app's own scheme, which any web page can send without a tap: it asks first.
    /// The site's https link comes as a universal link, which needs a person's tap: it joins.
    nonisolated static func asksFirst(_ url: URL) -> Bool { url.scheme?.lowercased() == AppIdentity.scheme.lowercased() }

    /// A link was opened: join now (or ask, for the app's own scheme), or once you're signed in.
    func open(_ url: URL) {
        guard CollabFeature.isOn, Self.isNoteLink(url) else { return }
        // The same link twice (two of the app's handlers saw it): once is enough.
        guard url != pending, url != working else { return }
        Funnel.record(.shareStep(.inviteOpened))
        pending = url
        waiting?.cancel()
        waiting = Task { await go() }
    }

    @MainActor private final class Outcome { var value: JoinOutcome = .failed(JoinCopy.slow) }
    @MainActor private final class Found { var value: Result<JoinPreview, JoinFailure> = .failure(JoinFailure(JoinCopy.slow)) }
    /// The link being read or joined right now.
    @ObservationIgnored private var working: URL?

    func dismissProblem() { if case .failed = phase { phase = .idle } }

    private func go() async {
        let started = ContinuousClock.now
        while !ready() {
            guard !Task.isCancelled, ContinuousClock.now - started < signInWait else { pending = nil; return }
            try? await Task.sleep(for: .milliseconds(300))
        }
        guard let url = pending, !Task.isCancelled else { return }
        pending = nil
        working = url
        defer { if working == url { working = nil } }
        show(nil)
        phase = .joining
        guard Self.asksFirst(url) else { await joinNow(url); return }
        let found = Found()
        do {
            try await ShareController.within(timeout) { found.value = await self.preview(url) }
        } catch {
            phase = .failed(JoinCopy.slow)
            return
        }
        switch found.value {
        case .failure(let f): phase = .failed(f.message)
        // Already in it: nothing to ask, it just opens.
        case .success(let p) where p.alreadyIn: await joinNow(url)
        case .success(let p):
            asked = url
            phase = .asking(p)
        }
    }

    /// Join, on the question.
    func accept() {
        guard case .asking = phase, let url = asked else { return }
        asked = nil
        // The question goes at once and the "Opening…" line takes its place.
        phase = .joining
        working = url
        Task {
            await joinNow(url)
            if working == url { working = nil }
        }
    }

    /// Not Now: nothing happens, and nobody learns the link was opened.
    func decline() {
        guard case .asking = phase else { return }
        asked = nil
        phase = .idle
    }

    private func joinNow(_ url: URL) async {
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
        case .joinedFolder(let folder, let owner):
            Funnel.record(.shareStep(.inviteAccepted))
            phase = .idle
            show(JoinNotice(kind: .joinedFolder, text: JoinCopy.joinedFolder(owner: owner), note: folder))
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
    /// You joined a shared folder: it's at the top of your folders. `folder` is its id in your library.
    case joinedFolder(folder: UUID, owner: String?)
    /// You were in it already: it just opened.
    case opened
    /// It didn't open: what to tell the person.
    case failed(String)

    var worked: Bool { if case .failed = self { false } else { true } }
}

/// What a note's link leads to, shown before joining a link by the app's own scheme.
struct JoinPreview: Equatable, Sendable {
    var title: String?
    var owner: String?
    var canEdit: Bool
    var alreadyIn = false
    /// A shared folder's link, not a note's.
    var isFolder = false
}

/// Why a link didn't open, in words for the person.
struct JoinFailure: Error, Equatable {
    let message: String
    init(_ message: String) { self.message = message }
}

/// The line at the foot of the window after a link joined a note: what happened, and Leave.
struct JoinNotice: Equatable, Identifiable {
    enum Kind: Equatable { case joined, joinedFolder, leaving, left, failed }
    let id = UUID()
    var kind: Kind
    var text: String
    /// The note joined, in your library: Leave leaves it.
    var note: UUID
    /// Leave shows after joining, and again when leaving didn't work.
    var canLeave: Bool { kind == .joined || kind == .failed }
}

enum JoinCopy {
    /// "Join “Team offsite”?", or with no title "Join the note Emil shared?".
    static func askTitle(_ p: JoinPreview) -> String {
        if p.isFolder {
            if let t = p.title { return "Join the folder \u{201C}\(t)\u{201D}?" }
            if let o = p.owner { return "Join the folder \(ShareCopy.first(o)) shared?" }
            return "Join this shared folder?"
        }
        if let t = p.title { return "Join \u{201C}\(t)\u{201D}?" }
        if let o = p.owner { return "Join the note \(ShareCopy.first(o)) shared?" }
        return "Join this shared note?"
    }

    static func askMessage(_ p: JoinPreview) -> String {
        let who = p.owner.map { "\(ShareCopy.first($0)) shared it with you. " } ?? ""
        return who + "People in it see your name and photo."
    }

    /// "You joined Emil's note. People in it see your name and photo."
    static func joined(owner: String?) -> String {
        let whose = owner.map { "\(ShareCopy.first($0))'s note" } ?? "the note"
        return "You joined \(whose). People in it see your name and photo."
    }

    /// "You joined Emil's folder. People in it see your name and photo."
    static func joinedFolder(owner: String?) -> String {
        let whose = owner.map { "\(ShareCopy.first($0))'s folder" } ?? "the folder"
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

/// Wherever the app is (signed in or not): the short "Opening…" line while a link joins, the
/// question for a link by the app's own scheme, the line with Leave once it has joined, and plainly
/// when a link doesn't open. The links themselves come through ConnectCenter.receive.
struct JoinLinkHandler: ViewModifier {
    @State var center = JoinCenter.shared
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var asking: JoinPreview? { if case .asking(let p) = center.phase { p } else { nil } }

    func body(content: Content) -> some View {
        content
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
            .alert(asking.map(JoinCopy.askTitle) ?? "", isPresented: Binding(get: { asking != nil }, set: { if !$0 { center.decline() } })) {
                Button("Not Now", role: .cancel) { center.decline() }
                Button("Join") { center.accept() }
                    #if os(macOS)
                    // Return joins on the Mac. Not on iPhone: there the default action turns the
                    // button the system's blue, with the app's amber text on it.
                    .keyboardShortcut(.defaultAction)
                    #endif
                    .accessibilityIdentifier("collab.join")
            } message: {
                if let asking { Text(JoinCopy.askMessage(asking)) }
            }
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
        case .joined, .joinedFolder, .left: .done
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
