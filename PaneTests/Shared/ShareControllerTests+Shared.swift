import Foundation
import SwiftUI
import Testing
@testable import Pane

/// The ShareControllerTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/ShareControllerTests.swift.
@MainActor @Suite(.serialized) struct ShareControllerTests {
    static let me = CollabGallery.emil
    static let sara = CollabGallery.sara
    static func owner(link: ShareState.Access = .off) -> ShareState {
        ShareState(link: link == .off ? nil : URL(string: "https://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw"), access: link, people: [
            .init(id: me, name: "Emil Wagman", isMe: true, role: "owner"),
            .init(id: sara, name: "Sara Lind", role: "editor", safetyCode: "4821 0937 5512"),
        ])
    }

    static func member() -> ShareState {
        ShareState(people: [
            .init(id: sara, name: "Sara Lind", isMe: true, role: "editor"),
            .init(id: me, name: "Emil Wagman", role: "owner", safetyCode: "4821 0937 5512"),
        ])
    }
}
