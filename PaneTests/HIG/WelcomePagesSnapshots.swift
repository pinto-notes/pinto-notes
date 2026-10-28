#if os(iOS)
import SwiftUI
import Testing
import UIKit
@testable import Pane

/// The iPhone welcome's three looks (WelcomeStyle), each page at its resting step, light and dark;
/// the largest text for the note card; and page 1's demo step by step, to review the motion.
/// Runs only when AMBER_HIG_SHOTS is set:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path xcodebuild test -scheme Pane -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
/// -only-testing:'PaneTests/WelcomePagesSnapshots/iPhone()' CODE_SIGNING_ALLOWED=NO`.
@MainActor @Suite(.serialized) struct WelcomePagesSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    static func shoot(_ view: some View, _ name: String, dark: Bool, type: DynamicTypeSize = .large, scene: UIWindowScene, dir: URL) async throws {
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.rootViewController = UIHostingController(rootView: view.dynamicTypeSize(type).tint(Color(PColor.paneAccent))
            .environment(\.locale, Locale(identifier: "en_US")))
        window.isHidden = false
        try? await Task.sleep(for: .seconds(0.8))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        window.isHidden = true
        try #require(image.pngData()).write(to: dir.appending(path: "\(name).png"))
    }

    @Test func iPhone() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let letter: [WelcomeStyle: String] = [.card: "A", .device: "B", .scene: "C"]
        for style in WelcomeStyle.allCases {
            for page in WelcomePage.allCases {
                for dark in [false, true] {
                    let view = WelcomePages(style: style, page: page, frozenStage: page.stages - 1, start: {}, haveAccount: {})
                    try await Self.shoot(view, "welcome-\(letter[style]!)-\(page.rawValue + 1)-\(dark ? "dark" : "light")", dark: dark, scene: scene, dir: dir)
                }
            }
        }
        for page in WelcomePage.allCases {
            let view = WelcomePages(style: .card, page: page, frozenStage: page.stages - 1, start: {}, haveAccount: {})
            try await Self.shoot(view, "welcome-A-\(page.rawValue + 1)-largest", dark: false, type: .accessibility3, scene: scene, dir: dir)
        }
        for page in WelcomePage.allCases {
            for stage in 0..<page.stages {
                let view = WelcomePages(style: .card, page: page, frozenStage: stage, start: {}, haveAccount: {})
                try await Self.shoot(view, "welcome-A-\(page.rawValue + 1)-step\(stage)", dark: false, scene: scene, dir: dir)
            }
        }
    }
}
#endif
