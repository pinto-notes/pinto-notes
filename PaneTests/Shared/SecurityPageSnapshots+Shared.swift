import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// The SecurityPageSnapshots suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/SecurityPageSnapshots.swift.
@MainActor @Suite(.serialized) struct SecurityPageSnapshots {
    static let mac = KeyDevice(id: UUID(), name: "Sara\u{2019}s MacBook Air (sample)", platform: "macos", how: .added, backedUp: false,
                               addedAt: .now.addingTimeInterval(-6 * 86400), seenAt: .now, removing: false)
    static let phone = KeyDevice(id: UUID(), name: "Work iPhone (sample)", platform: "ios", how: .keychain, backedUp: true,
                                 addedAt: .now.addingTimeInterval(-200 * 86400), seenAt: .now.addingTimeInterval(-3 * 86400), removing: false)
    static let ais = [Connection(id: UUID(), name: "ChatGPT", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "chatgpt.com"),
                      Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "claude.ai")]
}
