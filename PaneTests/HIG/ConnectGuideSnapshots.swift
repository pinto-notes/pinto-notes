import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// Every page of Connect ChatGPT (both versions: the custom server, and the public plugin once it
/// is live) and Connect another AI, to look at. Offscreen; runs only when AMBER_HIG_SHOTS is set,
/// like `ImportGuideSnapshots`:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh "PaneTests/ConnectGuideSnapshots"`.
extension ConnectGuideSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    #if os(macOS)
    /// The Other page study (Emil, 2 November 2026).
    @Test func otherLooks() async throws {
        guard let dir = Self.dir else { return }
        defer { ConnectWebGuide.otherLook = .steps }
        let apps = ConnectWebGuide.App.allCases
        for look in ConnectWebGuide.OtherLook.allCases {
            ConnectWebGuide.otherLook = look
            for dark in [false, true] {
                for (state, copied) in [("0", false), ("1-copied", true)] {
                    let run = ConnectGuideRun(ai: .other, guide: nil, apps: apps, server: Self.server, stage: .step(0), opened: [], copied: copied, picked: nil)
                    try await VersionHistorySnapshots.shoot(ConnectWebGuideSheet(run: run, height: 560),
                                                            to: dir.appending(path: "other-\(look.rawValue)-\(state)-\(dark ? "dark" : "light").png"),
                                                            size: CGSize(width: 540, height: 560), dark: dark)
                }
            }
        }
    }

    @Test func mac() async throws {
        guard let dir = Self.dir else { return }
        for dark in [false, true] {
            for (name, run) in Self.pages() {
                try await VersionHistorySnapshots.shoot(ConnectWebGuideSheet(run: run, height: 560),
                                                        to: dir.appending(path: "mac-\(dark ? "dark" : "light")-\(name).png"),
                                                        size: CGSize(width: 540, height: 560), dark: dark)
            }
        }
        // The smallest window's height: the picture gives way, never the words.
        for (name, run) in Self.pages() {
            try await VersionHistorySnapshots.shoot(ConnectWebGuideSheet(run: run, height: 480),
                                                    to: dir.appending(path: "mac-light-480-\(name).png"),
                                                    size: CGSize(width: 540, height: 480), dark: false)
        }
    }
    #endif

    #if os(iOS)
    @Test func iPhone() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        for dark in [false, true] {
            for (name, run) in Self.pages() {
                try await ImportGuideSnapshots.shoot(ConnectWebGuideSheet(run: run), to: dir.appending(path: "iphone-\(dark ? "dark" : "light")-\(name).png"),
                                                     dark: dark, scene: scene)
            }
        }
    }
    #endif
}
