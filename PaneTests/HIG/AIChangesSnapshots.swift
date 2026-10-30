import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// AI Changes and Compare with… over the demo history, light and dark. Offscreen; runs only when
/// AMBER_HIG_SHOTS is set. Mac:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/AIChangesSnapshots`; iPhone:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path xcodebuild test -scheme Pane -destination 'platform=iOS Simulator,name=…'
/// -only-testing:PaneTests/AIChangesSnapshots CODE_SIGNING_ALLOWED=NO`.
@MainActor @Suite(.serialized) struct AIChangesSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    /// The demo history's AI edits, and a note an AI made and one it moved, as the server lists them.
    final class Shown: AIChangesStore {
        let edits: HistoryAIChangesStore
        let extra: [AIChange]
        var empty = false
        init(_ edits: HistoryAIChangesStore, extra: [AIChange]) { self.edits = edits; self.extra = extra }
        func changes(before: Date?, limit: Int, ai: String?) async throws -> [AIChange] {
            if empty { return [] }
            let all = try await edits.changes(before: before, limit: limit, ai: ai) + extra.filter { ai == nil || $0.ai == ai }
            return all.sorted { $0.at > $1.at }
        }
    }

    static func library() throws -> (ModelContainer, NoteHistory, Shown) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: true)
        try? c.mainContext.save()
        let demo = DemoHistoryStore(context: c.mainContext)
        let history = NoteHistory(store: demo, context: c.mainContext, sync: nil)
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
        let folders = try c.mainContext.fetch(FetchDescriptor<Folder>())
        var extra: [AIChange] = []
        if let made = notes.first(where: { $0.title == "Standup notes" }) {
            extra.append(AIChange(id: "e1", kind: .created, noteID: made.id, ai: "Claude Code", at: .now.addingTimeInterval(-25 * 60)))
        }
        if let moved = notes.first(where: { $0.title == "Lisbon" }), let to = moved.folder {
            extra.append(AIChange(id: "e2", kind: .moved, noteID: moved.id, ai: "ChatGPT", at: .now.addingTimeInterval(-3.2 * 3600),
                                  fromFolder: folders.first { $0.id != to.id }?.id, toFolder: to.id))
        }
        return (c, history, Shown(HistoryAIChangesStore(history: demo, context: c.mainContext), extra: extra))
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func mac(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let mode = dark ? "dark" : "light"
        let size = CGSize(width: 940, height: 620)
        let (c, history, store) = try Self.library()
        let model = AIChangesModel(store: store, history: history, connected: ["ChatGPT", "Claude Code"])
        await model.load()
        try await VersionHistorySnapshots.shoot(MacAIChanges(model: model, close: {}, open: { _ in }).frame(width: size.width, height: size.height),
                                                to: dir.appending(path: "mac-ai-changes-edit-\(mode).png"), size: size, dark: dark)
        if let moved = model.changes.first(where: { $0.kind == .moved }) {
            await model.select(moved.id)
            try await VersionHistorySnapshots.shoot(MacAIChanges(model: model, close: {}, open: { _ in }).frame(width: size.width, height: size.height),
                                                    to: dir.appending(path: "mac-ai-changes-moved-\(mode).png"), size: size, dark: dark)
        }
        await model.setFilter("Claude Code")
        try await VersionHistorySnapshots.shoot(MacAIChanges(model: model, close: {}, open: { _ in }).frame(width: size.width, height: size.height),
                                                to: dir.appending(path: "mac-ai-changes-filtered-\(mode).png"), size: size, dark: dark)
        store.empty = true
        let empty = AIChangesModel(store: store, history: history)
        await empty.load()
        try await VersionHistorySnapshots.shoot(MacAIChanges(model: empty, close: {}, open: { _ in }).frame(width: size.width, height: size.height),
                                                to: dir.appending(path: "mac-ai-changes-empty-\(mode).png"), size: size, dark: dark)

        // Compare with…: an earlier version against an older one.
        let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Groceries" })
        let versions = VersionHistoryModel(note: note, history: history)
        await versions.load()
        await versions.select(versions.entries[1].id)
        await versions.compare(with: versions.entries[3].id)
        try await VersionHistorySnapshots.shoot(MacVersionHistory(model: versions, close: {}).frame(width: 900, height: 600),
                                                to: dir.appending(path: "mac-history-compare-\(mode).png"), size: CGSize(width: 900, height: 600), dark: dark)

        // The receipt on a note, with See all changes.
        let receipt = AIEdit.Receipt(noteID: note.id, by: "ChatGPT", at: .now, previous: "", lines: 3)
        try await VersionHistorySnapshots.shoot(AIReceipt(receipt: receipt, seeAll: {}, undo: {}).padding(30).background(Color.notePage),
                                                to: dir.appending(path: "mac-receipt-see-all-\(mode).png"), size: CGSize(width: 520, height: 100), dark: dark)
    }
    #endif

    #if os(iOS)
    @Test func iPhone() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        for dark in [false, true] {
            let mode = dark ? "dark" : "light"
            let (c, history, store) = try Self.library()
            let model = AIChangesModel(store: store, history: history, connected: ["ChatGPT", "Claude Code"])
            await model.load()
            try await ImportGuideSnapshots.shoot(PhoneAIChanges(model: model, close: {}, open: { _ in }),
                                                 to: dir.appending(path: "iphone-ai-changes-list-\(mode).png"), dark: dark, scene: scene)
            if let first = model.changes.first(where: { $0.changesText }) {
                await model.select(first.id)
                try await ImportGuideSnapshots.shoot(NavigationStack { PhoneAIChangeDetail(model: model, id: first.id, open: { _ in }) },
                                                     to: dir.appending(path: "iphone-ai-changes-edit-\(mode).png"), dark: dark, scene: scene)
            }
            store.empty = true
            let empty = AIChangesModel(store: store, history: history)
            await empty.load()
            try await ImportGuideSnapshots.shoot(PhoneAIChanges(model: empty, close: {}, open: { _ in }),
                                                 to: dir.appending(path: "iphone-ai-changes-empty-\(mode).png"), dark: dark, scene: scene)
            let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Groceries" })
            let versions = VersionHistoryModel(note: note, history: history)
            await versions.load()
            await versions.select(versions.entries[1].id)
            await versions.compare(with: versions.entries[3].id)
            try await ImportGuideSnapshots.shoot(NavigationStack { PhoneVersionPreview(model: versions, id: versions.entries[1].id, close: {}) },
                                                 to: dir.appending(path: "iphone-history-compare-\(mode).png"), dark: dark, scene: scene)
        }
    }
    #endif
}
