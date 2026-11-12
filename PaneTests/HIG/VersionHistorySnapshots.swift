#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The Mac's version history sheet over the demo history, light and dark, at 2x. Offscreen;
/// nothing touches the screen. Runs only when AMBER_HIG_SHOTS is set:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/VersionHistorySnapshots`.
extension VersionHistorySnapshots {
    @Test(arguments: [false, true])
    func sheet(dark: Bool) async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try AppSnapshotTests.container()
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
        let history = NoteHistory(store: DemoHistoryStore(context: c.mainContext), context: c.mainContext, sync: nil)
        let mode = dark ? "dark" : "light"
        for (title, slug, pick) in [("Groceries", "groceries", 1), ("Groceries", "groceries-burst", 2), ("Snippets", "empty", 0)] {
            let note = try #require(notes.first { $0.title == title })
            let model = VersionHistoryModel(note: note, history: history)
            await model.load()
            if pick < model.entries.count { await model.select(model.entries[pick].id) }
            try await Self.shoot(MacVersionHistory(model: model, close: {}).frame(width: 900, height: 600),
                                 to: dir.appending(path: "mac-history-\(slug)-\(mode).png"), size: CGSize(width: 900, height: 600), dark: dark)
        }
        let offline = DemoHistoryStore(context: c.mainContext)
        offline.offline = true
        let model = VersionHistoryModel(note: try #require(notes.first { $0.title == "Groceries" }),
                                        history: NoteHistory(store: offline, context: c.mainContext, sync: nil))
        await model.load()
        try await Self.shoot(MacVersionHistory(model: model, close: {}).frame(width: 900, height: 600),
                             to: dir.appending(path: "mac-history-offline-\(mode).png"), size: CGSize(width: 900, height: 600), dark: dark)
    }

}
#endif
