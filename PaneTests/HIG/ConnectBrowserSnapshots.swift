import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// The browser connect sheet's states, to look at: each AI before its button, waiting, and
/// connected. Offscreen; runs only when AMBER_HIG_SHOTS is set, like `ConnectGuideSnapshots`:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh "PaneTests/ConnectBrowserSnapshots"`.
@MainActor @Suite(.serialized) struct ConnectBrowserSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static let server = "https://mcp.pintonotes.com"

    static func states() -> [(String, ConnectGuideRun)] {
        func r(_ ai: ConnectAISection.Guide, opened: Set<Int> = []) -> ConnectGuideRun {
            ConnectGuideRun(ai: ai, guide: .browser(ai, listing: nil), server: server, stage: .step(0), opened: opened)
        }
        var list: [(String, ConnectGuideRun)] = []
        for ai in BrowserConnect.offered() {
            let done = r(ai)
            done.connected(ai.title)
            list += [("\(ai.rawValue)-0-open", r(ai)), ("\(ai.rawValue)-1-waiting", r(ai, opened: [0])), ("\(ai.rawValue)-2-connected", done)]
        }
        return list
    }

    #if os(macOS)
    @Test func mac() async throws {
        guard let dir = Self.dir else { return }
        for dark in [false, true] {
            for (name, run) in Self.states() {
                try await VersionHistorySnapshots.shoot(
                    ConnectBrowserSheet(run: run).frame(width: 460, height: 400, alignment: .top).background(Color(Palette.sheetGround)),
                    to: dir.appending(path: "mac-\(dark ? "dark" : "light")-\(name).png"), size: CGSize(width: 460, height: 400), dark: dark)
            }
        }
    }
    #endif

    #if os(iOS)
    @Test func iPhone() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        for dark in [false, true] {
            for (name, run) in Self.states() {
                try await ImportGuideSnapshots.shoot(ConnectBrowserSheet(run: run), to: dir.appending(path: "iphone-\(dark ? "dark" : "light")-\(name).png"),
                                                     dark: dark, scene: scene)
            }
        }
    }
    #endif
}
