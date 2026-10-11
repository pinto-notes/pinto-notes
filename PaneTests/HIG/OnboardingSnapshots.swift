import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// Every step of the first-run flow, in the real views, light and dark: the Mac's card window,
/// and an iPhone at the default and the largest text size. The two choice steps come in both
/// layouts (`rows` and `grid`). Offscreen: nothing touches the screen. Runs only when
/// AMBER_HIG_SHOTS is set. Mac: `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh
/// PaneTests/OnboardingSnapshots`; iPhone: the same test on a simulator.
@MainActor @Suite(.serialized) struct OnboardingSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    struct Shot {
        let name: String
        let step: Onboarding.Step
        var layout: OnboardingFlow.Layout = .rows
        var preview = OnboardingFlow.Preview()
    }

    static let shots: [Shot] = [
        Shot(name: "1-welcome", step: .welcome),
        Shot(name: "2-name-prefilled", step: .name, preview: .init(name: "Sara Lindqvist")),
        Shot(name: "2-name-empty", step: .name),
        Shot(name: "3-bring-A-rows", step: .bring),
        Shot(name: "3-bring-B-grid", step: .bring, layout: .grid),
        Shot(name: "3-bring-A-after-import", step: .bring, preview: .init(brought: 18)),
        Shot(name: "4-connect-A-rows", step: .connect),
        Shot(name: "4-connect-B-grid", step: .connect, layout: .grid),
        Shot(name: "4-connect-A-connected", step: .connect, preview: .init(connected: ["Claude Code"])),
        Shot(name: "4-connect-B-connected", step: .connect, layout: .grid, preview: .init(connected: ["Claude Code"])),
        Shot(name: "5-try-it", step: .tryIt, preview: .init(connected: ["ChatGPT"])),
    ]

    static func flow(_ shot: Shot) -> some View {
        let store = OnboardingStore(defaults: TestDefaults())
        store.showForPreview(shot.step)
        return OnboardingFlow(store: store, backend: Backend(), layout: shot.layout, preview: shot.preview, finish: { _ in })
            .tint(Color(PColor.paneAccent))
            .environment(\.locale, Locale(identifier: "en_US"))
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func mac(dark: Bool) async throws {
        guard Self.dir != nil else { return }
        for shot in Self.shots {
            try await WelcomeSnapshots.shoot(Self.flow(shot), name: "mac-\(shot.name)-\(dark ? "dark" : "light")", dark: dark)
        }
        let store = OnboardingStore(defaults: TestDefaults())
        try await WelcomeSnapshots.shoot(OnboardingWait(store: store), name: "mac-0-wait-\(dark ? "dark" : "light")", dark: dark)
    }
    #endif

    #if os(iOS)
    /// On an iPhone simulator (no Simulator window needed):
    /// `TEST_RUNNER_AMBER_HIG_SHOTS=/path xcodebuild test -scheme Pane -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
    /// -only-testing:PaneTests/OnboardingSnapshots CODE_SIGNING_ALLOWED=NO`.
    @Test func iPhone() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let pad = UIDevice.current.userInterfaceIdiom == .pad
        let size = scene.screen.bounds.size
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for shot in Self.shots {
            for (label, type) in [("default", DynamicTypeSize.large), ("largest", .accessibility5)] {
                for dark in [false, true] {
                    let window = UIWindow(windowScene: scene)
                    window.frame = CGRect(origin: .zero, size: size)
                    window.overrideUserInterfaceStyle = dark ? .dark : .light
                    window.rootViewController = UIHostingController(rootView: Self.flow(shot).dynamicTypeSize(type))
                    window.isHidden = false
                    try? await Task.sleep(for: .seconds(0.9))
                    let format = UIGraphicsImageRendererFormat()
                    format.scale = 3
                    let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                        window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                    }
                    window.isHidden = true
                    try #require(image.pngData()).write(to: dir.appending(path: "\(pad ? "ipad" : "iphone")-\(shot.name)-\(label)-\(dark ? "dark" : "light").png"))
                }
            }
        }
    }
    #endif
}
