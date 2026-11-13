import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// The OnboardingSnapshots suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/OnboardingSnapshots.swift.
@MainActor @Suite(.serialized) struct OnboardingSnapshots {
    struct Shot {
        let name: String
        let step: Onboarding.Step
        var preview = OnboardingFlow.Preview()
        /// Where the flow began: Bring when the name was known.
        var first: Onboarding.Step = .name
    }

    static let withAboutMe = TrialNote.body + TrialNote.sample
    static let shots: [Shot] = [
        Shot(name: "2-name-prefilled", step: .name, preview: .init(name: "Sara Lindqvist")),
        Shot(name: "2-name-empty", step: .name),
        Shot(name: "3-bring", step: .bring),
        Shot(name: "3-bring-after-import", step: .bring, preview: .init(brought: 35)),
        Shot(name: "3-bring-name-known", step: .bring, first: .bring),
        Shot(name: "4-connect", step: .connect),
        Shot(name: "4-connect-connected", step: .connect, preview: .init(connected: ["Claude Code"])),
        Shot(name: "5-try-it-chatgpt", step: .tryIt, preview: .init(connected: ["ChatGPT"])),
        Shot(name: "5-try-it-chatgpt-asked", step: .tryIt, preview: .init(connected: ["ChatGPT"], asked: "ChatGPT")),
        Shot(name: "5-try-it-claude", step: .tryIt, preview: .init(connected: ["Claude"])),
        Shot(name: "5-try-it-claude-asked", step: .tryIt, preview: .init(connected: ["Claude"], asked: "Claude")),
        Shot(name: "5-try-it-both", step: .tryIt, preview: .init(connected: ["ChatGPT", "Claude"])),
        Shot(name: "5-try-it-claude-code", step: .tryIt, preview: .init(connected: ["Claude Code"])),
        Shot(name: "5-try-it-claude-code-copied", step: .tryIt, preview: .init(connected: ["Claude Code"], copied: true)),
        Shot(name: "5-try-it-it-worked", step: .tryIt, preview: .init(connected: ["ChatGPT"], asked: "ChatGPT", note: withAboutMe, arrived: true)),
        Shot(name: "5-try-it-nothing-yet", step: .tryIt, preview: .init(connected: ["ChatGPT"], asked: "ChatGPT", late: true)),
    ]
    static func flow(_ shot: Shot) -> some View {
        let store = OnboardingStore(defaults: TestDefaults())
        store.showForPreview(shot.step, first: shot.first)
        return OnboardingFlow(store: store, backend: Backend(), preview: shot.preview, finish: { _ in })
            .tint(Color(PColor.paneAccent))
            .environment(\.locale, Locale(identifier: "en_US"))
    }

    static let twoConnected: [Connection] = [
        Connection(id: UUID(), name: "ChatGPT", kind: "oauth", created_at: .now.addingTimeInterval(-86_400 * 3),
                   last_used_at: .now.addingTimeInterval(-3_600), revoked_at: nil, redirect_host: "chatgpt.com"),
        Connection(id: UUID(), name: "Claude Code", kind: "token", created_at: .now.addingTimeInterval(-86_400),
                   last_used_at: nil, revoked_at: nil, redirect_host: nil),
    ]
}
