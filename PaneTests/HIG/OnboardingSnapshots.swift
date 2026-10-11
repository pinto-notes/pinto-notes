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

    // MARK: Connect an AI, the sheet (Settings and notes open the same view)

    static let twoConnected: [Connection] = [
        Connection(id: UUID(), name: "ChatGPT", kind: "oauth", can_write: true, created_at: .now.addingTimeInterval(-86_400 * 3),
                   last_used_at: .now.addingTimeInterval(-3_600), revoked_at: nil, redirect_host: "chatgpt.com"),
        Connection(id: UUID(), name: "Claude Code", kind: "token", can_write: false, created_at: .now.addingTimeInterval(-86_400),
                   last_used_at: nil, revoked_at: nil, redirect_host: nil),
    ]

    static let sheets: [(name: String, layout: BigChoices.Layout, rows: [Connection])] = [
        ("7-connect-sheet-A-none", .rows, []), ("7-connect-sheet-A-two-connected", .rows, twoConnected),
        ("7-connect-sheet-B-none", .grid, []), ("7-connect-sheet-B-two-connected", .grid, twoConnected),
    ]

    static func sheet(_ layout: BigChoices.Layout, _ rows: [Connection]) -> some View {
        ConnectAISheet(client: CaptureScreen.client, preview: rows, layout: layout)
            .tint(Color(PColor.paneAccent))
            .environment(\.locale, Locale(identifier: "en_US"))
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func macConnectSheet(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        for s in Self.sheets {
            try await AppSnapshotTests.render(Self.sheet(s.layout, s.rows), name: "mac-\(s.name)-\(mode)", dark: dark, wait: 0.8)
        }
        // Settings › AI: the same view as a section of the form.
        for (name, rows) in [("none", [Connection]()), ("two-connected", Self.twoConnected)] {
            let form = Form { ConnectAISection(client: CaptureScreen.client, preview: rows) }.formStyle(.grouped).frame(width: 520).fixedSize(horizontal: false, vertical: true)
                .tint(Color(PColor.paneAccent))
            try await AppSnapshotTests.render(form, name: "mac-7-connect-settings-\(name)-\(mode)", dark: dark, wait: 0.8)
        }
    }
    #endif

    #if os(iOS)
    @Test func iPhoneConnectSheet() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for s in Self.sheets {
            for (label, type) in [("default", DynamicTypeSize.large), ("largest", .accessibility5)] {
                for dark in [false, true] {
                    let window = UIWindow(windowScene: scene)
                    window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
                    window.overrideUserInterfaceStyle = dark ? .dark : .light
                    window.rootViewController = UIHostingController(rootView: Self.sheet(s.layout, s.rows).dynamicTypeSize(type))
                    window.isHidden = false
                    try? await Task.sleep(for: .seconds(0.9))
                    let format = UIGraphicsImageRendererFormat()
                    format.scale = 3
                    let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                        window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                    }
                    window.isHidden = true
                    try #require(image.pngData()).write(to: dir.appending(path: "iphone-\(s.name)-\(label)-\(dark ? "dark" : "light").png"))
                }
            }
        }
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
