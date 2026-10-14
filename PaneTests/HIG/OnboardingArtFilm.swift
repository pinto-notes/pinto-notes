#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// A short film of the desk set filling up: sign-in, then each first-run step in turn, the steps'
/// own transitions with the picture crossfading beside them. Offscreen frames with the time each
/// was taken, the motion slowed `pace` times so the frames are close together; the shell stitches
/// them at real speed. Runs only when ONBOARDING_CLIP is set:
/// `TEST_RUNNER_ONBOARDING_CLIP=/path scripts/qa-test.sh PaneTests/OnboardingArtFilm`.
@MainActor @Suite(.serialized) struct OnboardingArtFilm {
    static let pace = 4.0

    @Test func deskLight() async throws {
        guard let dir = ProcessInfo.processInfo.environment["ONBOARDING_CLIP"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        OnboardingArt.forced = .desk
        defer { OnboardingArt.forced = nil }
        ConnectFinder.fixed = [.claude, .codex]
        defer { ConnectFinder.fixed = nil }
        var times: [(String, Double)] = []
        let start = Date.now

        func window(_ view: some View) -> (NSWindow, NSHostingView<AnyView>) {
            let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: WelcomeFlow.size.width, height: WelcomeFlow.size.height),
                             styleMask: [.borderless], backing: .buffered, defer: false)
            w.isReleasedWhenClosed = false
            w.appearance = NSAppearance(named: .aqua)
            let host = NSHostingView(rootView: AnyView(view.ignoresSafeArea()))
            host.appearance = w.appearance
            host.frame = CGRect(origin: .zero, size: WelcomeFlow.size)
            w.contentView = host
            return (w, host)
        }
        func grab(_ host: NSHostingView<AnyView>) throws {
            host.layoutSubtreeIfNeeded()
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            let name = String(format: "f-%04d.png", times.count)
            try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: name))
            times.append((name, Date.now.timeIntervalSince(start) / Self.pace))
        }
        func roll(_ host: NSHostingView<AnyView>, seconds: Double) async throws {
            let end = Date.now.addingTimeInterval(seconds * Self.pace)
            while Date.now < end {
                try grab(host)
                try? await Task.sleep(for: .milliseconds(30))
            }
        }

        // Sign-in, held.
        let (signIn, signInHost) = window(WelcomeFlow(backend: Backend(), stage: .signIn(returning: false)).tint(Color(PColor.paneAccent)))
        try? await Task.sleep(for: .seconds(1))
        try await roll(signInHost, seconds: 1.2)
        signIn.close()

        // The steps, each held, then on to the next.
        let store = OnboardingStore(defaults: TestDefaults())
        store.showForPreview(.name)
        let flow = OnboardingFlow(store: store, backend: Backend(), preview: OnboardingFlow.Preview(name: "Sara Lindqvist", connected: ["Claude"], brought: 35), finish: { _ in })
            .tint(Color(PColor.paneAccent))
            .environment(\.locale, Locale(identifier: "en_US"))
        let (steps, host) = window(flow)
        defer { steps.close() }
        try? await Task.sleep(for: .seconds(1))
        OnboardingFlow.stepPace = Self.pace
        defer { OnboardingFlow.stepPace = 1 }
        try await roll(host, seconds: 1.0)
        for next in [Onboarding.Step.bring, .connect, .tryIt] {
            store.showForPreview(next)
            try await roll(host, seconds: 1.6)
        }
        // ffmpeg's concat list: each frame for as long as it stood.
        var list = ""
        for (i, (name, t)) in times.enumerated() {
            let d = i + 1 < times.count ? max(times[i + 1].1 - t, 0.001) : 0.5
            list += "file '\(name)'\nduration \(String(format: "%.4f", d))\n"
        }
        list += "file '\(times.last!.0)'\n"
        try list.write(to: dir.appending(path: "frames.txt"), atomically: true, encoding: .utf8)
    }
}
#endif
