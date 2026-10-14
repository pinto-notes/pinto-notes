import Foundation
import Observation
import SwiftUI

/// Opening a note's link in the app (`<site>/s/<id>#<secret>`, a universal link, or
/// `<scheme>://s/<id>#<secret>` from the link's web page): you join the note with the link's
/// role and it opens. Can edit lets you type in it; Can view shows it read-only.
///
/// What the person sees: a short "Opening shared note…" while it joins, then the note. Signed
/// out, the link waits until you've signed in, then goes on by itself. A link that was turned off
/// or changed, or no connection, says so in words. Nothing spins for more than `timeout`.
@MainActor
@Observable
final class JoinCenter {
    static let shared = JoinCenter()

    enum Phase: Equatable { case idle, joining, failed(String) }
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
        let result = Outcome()
        do {
            try await ShareController.within(timeout) { result.problem = await self.join(url) }
        } catch {
            result.problem = JoinCopy.slow
        }
        phase = result.problem.map(Phase.failed) ?? .idle
    }
}

enum JoinCopy {
    static let joining = "Opening shared note…"
    static let failedTitle = "The shared note didn't open"
    static let failed = "This link didn't open. Ask for a new one."
    static let slow = "Opening the note took too long. Check your connection and open the link again."
    static let unavailable = "Sharing isn't available in this version of Pinto Notes."
}

/// Listens for note links wherever the app is (signed in or not), shows the short "Opening…"
/// line while it joins, and says plainly when a link doesn't open.
struct JoinLinkHandler: ViewModifier {
    @State private var center = JoinCenter.shared
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
            .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: center.phase)
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
