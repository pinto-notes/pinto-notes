#if os(iOS)
import SwiftData
import SwiftUI
import Testing
import UIKit
@testable import Pane

/// The create buttons on iPhone, in pictures (CreateButtonsTests has their behaviour).
@MainActor @Suite(.serialized) struct CreateButtonsShots {
    /// iPhone pictures: the list with the three in the bottom bar and Today at the top left, the
    /// empty library, and New App. `TEST_RUNNER_AMBER_HIG_SHOTS=/path xcodebuild test … -only-testing:PaneHIGTests/CreateButtonsShots`.
    @Test(arguments: [false, true]) func iPhonePictures(dark: Bool) async throws {
        guard ListLayoutSnapshots.dir != nil else { return }
        let (c, _) = try ListLayoutSnapshots.container()
        let list = NavigationStack { NoteListView(scope: .all, selection: .constant([]), onNewNote: {}) }
            .modelContainer(c)
            .environment(\.stackedNotes, true)
        try await ListLayoutSnapshots.shoot(list, "create-bar", dark: dark, wait: 1.5)
        let empty = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let emptyList = NavigationStack { NoteListView(scope: .all, selection: .constant([]), onNewNote: {}) }
            .modelContainer(empty)
            .environment(\.stackedNotes, true)
            .environment(\.importActions, ImportActions(appleNotes: {}, from: { _ in }))
        try await ListLayoutSnapshots.shoot(emptyList, "create-empty", dark: dark, wait: 1.5)
        MakeAppSheet.stateForPictures = "chatgpt"
        defer { MakeAppSheet.stateForPictures = nil }
        let start = AppStart.make(in: .all, context: empty.mainContext)
        defer { AppStart.shared.finish(start.id) }
        let page = NavigationStack {
            Color.clear.navigationDestination(isPresented: .constant(true)) {
                MakeAppSheet(start: start.id, title: start.title).navigationTitle("").navigationBarTitleDisplayMode(.inline)
            }
        }
        .modelContainer(empty)
        try await ListLayoutSnapshots.shoot(page, "create-newapp", dark: dark, wait: 1.5)
    }
}
#endif
