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
@MainActor @Suite(.serialized) struct ConnectGuideSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static let server = "https://mcp.pintonotes.com"

    static func pages() -> [(String, ConnectGuideRun)] {
        let chatgpt = ConnectWebGuide.chatgpt(listing: nil)
        let live = ConnectWebGuide.chatgpt(listing: URL(string: "https://chatgpt.com/plugins/pinto-notes"))
        let apps = ConnectWebGuide.App.allCases
        func r(_ ai: ConnectAISection.Guide, _ g: ConnectWebGuide? = nil, _ stage: ConnectGuideRun.Stage, opened: Set<Int> = [],
               copied: Bool = false, picked: ConnectWebGuide.App? = nil) -> ConnectGuideRun {
            ConnectGuideRun(ai: ai, guide: g, apps: apps, server: server, stage: stage, opened: opened, copied: copied, picked: picked)
        }
        let done = r(.chatgpt, chatgpt, .intro)
        done.connected("ChatGPT")
        let otherDone = r(.other, nil, .step(0), picked: .cursor)
        otherDone.connected(nil)
        return [
            ("chatgpt-0-intro", r(.chatgpt, chatgpt, .intro)),
            ("chatgpt-1-open", r(.chatgpt, chatgpt, .step(0))),
            ("chatgpt-2-paste-waiting", r(.chatgpt, chatgpt, .step(1), opened: [0], copied: false)),
            ("chatgpt-2-paste-copied-again", r(.chatgpt, chatgpt, .step(1), opened: [0], copied: true)),
            ("chatgpt-1-back-opened", r(.chatgpt, chatgpt, .step(0), opened: [0])),
            ("chatgpt-9-connected", done),
            ("plugin-0-open", r(.chatgpt, live, .step(0))),
            ("plugin-1-waiting", r(.chatgpt, live, .step(0), opened: [0])),
            ("other-0-apps", r(.other, nil, .step(0))),
            ("other-1-cursor-waiting", r(.other, nil, .step(0), picked: .cursor)),
            ("other-2-copied-waiting", r(.other, nil, .step(0), copied: true)),
            ("other-9-connected", otherDone),
        ]
    }

    #if os(macOS)
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
