import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// The CollabShareSnapshots suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/CollabShareSnapshots.swift.
@MainActor @Suite(.serialized) struct CollabShareSnapshots {
    static let me = CollabGallery.emil, sara = CollabGallery.sara, jonas = CollabGallery.jonas
    static func owner(_ access: ShareState.Access = .edit) -> ShareState {
        ShareState(link: access == .off ? nil : URL(string: "https://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw"), access: access, people: [
            .init(id: me, name: "Emil Wagman", isMe: true, role: "owner"),
            .init(id: sara, name: "Sara Lind", role: "editor", safetyCode: "4821 0937 5512"),
            .init(id: jonas, name: "Jonas Berg", role: "viewer", safetyCode: "0712 8461 3495"),
        ])
    }

    /// A controller over sample state, put into the moment the picture shows.
    static func controller(_ state: ShareState, _ moment: Moment = .rest) async -> ShareController {
        let backend = SampleShare(state)
        let share = ShareController(note: Note(body: "Team offsite"), backend: backend)
        switch moment {
        case .rest: break
        case .making:
            backend.delay = .seconds(30)
            Task { await share.shareLink() }
            try? await Task.sleep(for: .milliseconds(50))
        case .confirmRemove: share.askRemove(state.people[1])
        case .confirmLeave: share.askLeave()
        case .failed:
            backend.fails = true
            await share.setAccess(.view)
        }
        return share
    }

    enum Moment { case rest, making, confirmRemove, confirmLeave, failed }
}
