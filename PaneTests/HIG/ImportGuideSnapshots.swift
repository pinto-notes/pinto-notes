import SwiftUI
import Testing
@testable import Pane

#if os(macOS)
/// Every live guide page at the designed height and at the smallest window's, light and dark, to
/// look at. Offscreen; runs only when AMBER_HIG_SHOTS is set:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh "PaneTests/ImportGuideSnapshots"`.
@MainActor @Suite(.serialized) struct ImportGuideSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    @Test func mac() async throws {
        guard let dir = Self.dir else { return }
        for kind in ImportKind.allCases {
            let guide = try #require(ImportGuide.live(kind))
            let pages: [(String, ImportGuidePage)] = [("0-intro", .intro)] + guide.steps.indices.map { ("\($0 + 1)-step", .step($0)) }
                + [("7-drop", .drop(.empty)), ("8-found", .drop(.found)), ("9-success", .success)]
            for height: CGFloat in [560, 480] {
                for (name, page) in pages {
                    try await VersionHistorySnapshots.shoot(ImportGuideSheet(guide: guide, page: page, height: height),
                                                            to: dir.appending(path: "\(guide.id)/mac-\(Int(height))-\(name).png"),
                                                            size: CGSize(width: 540, height: height), dark: false)
                }
            }
        }
        for (name, page) in [("denied", ImportNoticePage.notesDenied), ("empty", .notesEmpty)] {
            var short = page
            short.height = 480
            try await VersionHistorySnapshots.shoot(short, to: dir.appending(path: "apple-notes/mac-480-\(name).png"),
                                                    size: CGSize(width: 540, height: 480), dark: true)
        }
    }
}
#endif
