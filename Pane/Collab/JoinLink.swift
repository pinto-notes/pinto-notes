import Foundation
import Observation
import SwiftUI

/// Opening a note's link in the app (`<site>/s/<id>#<secret>`, a universal link, or
/// `<scheme>://s/<id>#<secret>` from the link's web page): it asks first, "Join “Team offsite”?
/// Emil shared it with you", because any web page can send the app a link, and joining shows
/// the owner your name and photo. Join: you join with the link's role and the note opens (Can
/// view shows it read-only). A note you're already in just opens.
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
    /// A link waiting for the account to be ready (signed out, or still starting).
    @ObservationIgnored private(set) var pending: URL?
    @ObservationIgnored var timeout: Duration = .seconds(20)
    /// How long a link waits for you to sign in before it's dropped.
    @ObservationIgnored var signInWait: Duration = .seconds(15 * 60)
    /// Joins with the link; nil when it worked, otherwise what to tell the person. The live store by default.
    @ObservationIgnored var join: @MainActor (URL) async -> String? = { @MainActor url in
        guard let store = CollabStore.shared else { return JoinCopy.unavailable }
        return await store.join(url) ? nil : store.joinProblem ?? JoinCopy.failed
    }
    /// What the link leads to, before joining; nil when it doesn't open (with `problem` saying why).
    @ObservationIgnored var preview: @MainActor (URL) async -> JoinPreview? = { @MainActor url in
        await CollabStore.shared?.preview(url)
    }
    @ObservationIgnored var problem: @MainActor () -> String = { @MainActor in CollabStore.shared?.joinProblem ?? JoinCopy.failed }
    /// The link being asked about.
    @ObservationIgnored private var asked: URL?
    /// The account can join now (signed in, sharing started).
    @ObservationIgnored var ready: @MainActor () -> Bool = { @MainActor in CollabStore.shared?.isReady == true }
    @ObservationIgnored private var waiting: Task<Void, Never>?

    /// A note's link, as the app reads it. Anything else isn't one.
    nonisolated static func isNoteLink(_ url: URL) -> Bool { CollabStore.parseLink(url) != nil }

    /// A link was opened: join now, or once you're signed in.
    func open(_ url: URL) {
        guard CollabFeature.isOn, Self.isNoteLink(url) else { return }
        pending = url
        waiting?.cancel()
        waiting = Task { await go() }
    }

    @MainActor private final class Outcome { var problem: String? }

    func dismissProblem() { if case .failed = phase { phase = .idle } }

    private func go() async {
        let started = ContinuousClock.now
        while !ready() {
            guard !Task.isCancelled, ContinuousClock.now - started < signInWait else { pending = nil; return }
            try? await Task.sleep(for: .milliseconds(300))
        }
        guard let url = pending, !Task.isCancelled else { return }
        pending = nil
        phase = .joining
        let found = Found()
        do {
            try await ShareController.within(timeout) { found.preview = await self.preview(url) }
        } catch {
            phase = .failed(JoinCopy.slow)
            return
        }
        guard let preview = found.preview else { phase = .failed(problem()); return }
        // Already in it: nothing to ask, it just opens.
        if preview.alreadyIn { await joinNow(url); return }
        asked = url
        phase = .asking(preview)
    }

    @MainActor private final class Found { var preview: JoinPreview? }

    /// Join, on the question.
    func accept() {
        guard case .asking = phase, let url = asked else { return }
        asked = nil
        // The question goes at once and the "Opening…" line takes its place.
        phase = .joining
        Task { await joinNow(url) }
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
            try await ShareController.within(timeout) { result.problem = await self.join(url) }
        } catch {
            result.problem = JoinCopy.slow
        }
        phase = result.problem.map(Phase.failed) ?? .idle
    }
}

/// What a note's link leads to, shown before joining.
struct JoinPreview: Equatable, Sendable {
    var title: String?
    var owner: String?
    var canEdit: Bool
    var alreadyIn = false
}

enum JoinCopy {
    /// "Join “Team offsite”?", or with no title "Join the note Emil shared?".
    static func askTitle(_ p: JoinPreview) -> String {
        if let t = p.title { return "Join \u{201C}\(t)\u{201D}?" }
        if let o = p.owner { return "Join the note \(ShareCopy.first(o)) shared?" }
        return "Join this shared note?"
    }

    static func askMessage(_ p: JoinPreview) -> String {
        let who = p.owner.map { "\(ShareCopy.first($0)) shared it with you. " } ?? ""
        return who + "People in it see your name and photo."
    }

    static let joining = "Opening shared note…"
    static let failedTitle = "The shared note didn't open"
    static let failed = "This link didn't open. Ask for a new one."
    static let slow = "Opening the note took too long. Check your connection and open the link again."
    static let unavailable = "Sharing isn't available in this version of Pinto Notes."
}

/// Listens for note links wherever the app is (signed in or not), shows the short "Opening…"
/// line while it joins, and says plainly when a link doesn't open.
struct JoinLinkHandler: ViewModifier {
    @State var center = JoinCenter.shared
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var asking: JoinPreview? { if case .asking(let p) = center.phase { p } else { nil } }

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
            .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: center.phase)
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
