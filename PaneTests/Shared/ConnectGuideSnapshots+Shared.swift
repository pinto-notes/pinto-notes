import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// The ConnectGuideSnapshots suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/ConnectGuideSnapshots.swift.
@MainActor @Suite(.serialized) struct ConnectGuideSnapshots {
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
        let grok = ConnectWebGuide.grok(onWeb: true)
        let grokDone = r(.grok, grok, .step(1), opened: [0])
        grokDone.connected("Grok")
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
            ("grok-0-intro", r(.grok, grok, .intro)),
            ("grok-1-open", r(.grok, grok, .step(0))),
            ("grok-2-form-waiting", r(.grok, grok, .step(1), opened: [0])),
            ("grok-9-connected", grokDone),
            ("other-0-apps", r(.other, nil, .step(0))),
            ("other-1-cursor-waiting", r(.other, nil, .step(0), picked: .cursor)),
            ("other-2-copied-waiting", r(.other, nil, .step(0), copied: true)),
            ("other-9-connected", otherDone),
        ]
    }

    static let server = "https://mcp.pintonotes.com"
}
