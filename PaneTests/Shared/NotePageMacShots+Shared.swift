#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
import WebKit
@testable import Pane

/// The NotePageMacShots suite's declaration, and the helpers of it that tests in other test targets
/// use (a test target can't see another's code): a library with a note app of each kind. Its
/// pictures are made in PaneTests/HIG/NotePageMacShots.swift.
@MainActor @Suite(.serialized) struct NotePageMacShots {
    static let demo = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        .appending(path: "demo/note-pages")

    static func library() throws -> ModelContainer {
        let c = try AppSnapshotTests.container()
        let ctx = c.mainContext
        let budget = ctx.createNote(in: .all, body: Capture.budgetNote)
        budget.updatedAt = .now.addingTimeInterval(-90)
        let habits = ctx.createNote(in: .all, body: Capture.habitNote())
        habits.isPinned = true
        try ctx.save()
        NotePageStore.shared[habits.id] = .init(html: try String(contentsOf: demo.appending(path: "habit-tracker.html"), encoding: .utf8), by: "Claude", at: .now)
        NotePageStore.shared[budget.id] = .init(html: try String(contentsOf: demo.appending(path: "budget.html"), encoding: .utf8), by: "Claude", at: .now)
        let training = ctx.createNote(in: .all, body: try String(contentsOf: demo.appending(path: "training.md"), encoding: .utf8))
        training.updatedAt = .now.addingTimeInterval(-7200)
        NotePageStore.shared[training.id] = .init(html: try String(contentsOf: demo.appending(path: "training-react.json"), encoding: .utf8), by: "Claude", at: .now)
        let stack = ctx.createNote(in: .all, body: try String(contentsOf: demo.appending(path: "reading-stack.md"), encoding: .utf8))
        stack.updatedAt = .now.addingTimeInterval(-3600)
        try ctx.save()
        NotePageStore.shared[stack.id] = .init(html: try String(contentsOf: demo.appending(path: "reading-stack.html"), encoding: .utf8), by: "Claude", at: .now)
        return c
    }
}
#endif
