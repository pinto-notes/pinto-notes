#if os(macOS)
import Foundation
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The first run of a build with no backend (scripts/setup.sh --local-only, docs/MAKE-IT-YOURS.md):
/// the app opens on its notes with the welcome note in them, and a note made there is still there
/// after the app quits and opens again. With AMBER_HIG_SHOTS set it also draws what that first
/// window shows: `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/LocalOnlyFirstRunTests`.
@MainActor @Suite(.serialized) struct LocalOnlyFirstRunTests {
    /// The library on disk, as the app opens it, in a folder of the test's own.
    static func open(_ dir: URL) throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Attachment.self,
                           configurations: ModelConfiguration(url: dir.appending(path: "Library.store")))
    }

    @Test func notesMadeWithSyncOffAreKeptAcrossARestart() throws {
        let dir = FileManager.default.temporaryDirectory.appending(path: "local-first-run-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dir) }

        // First launch: what PaneApp does when there's no backend client.
        do {
            let c = try Self.open(dir)
            Seed.ensureLibrary(c.mainContext, demo: false)
            let titles = (try c.mainContext.fetch(FetchDescriptor<Note>())).map(\.title)
            #expect(titles.contains("Welcome to Pinto Notes"))
            #expect(c.mainContext.allFolders().map(\.name) == ["Notes"])
            c.mainContext.createNote(in: .all, body: "Groceries\n\n- [ ] Oat milk")
            try c.mainContext.save()
        }
        // Opened again: the note is there, and nothing is seeded twice.
        let c = try Self.open(dir)
        Seed.ensureLibrary(c.mainContext, demo: false)
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
        #expect(notes.contains { $0.title == "Groceries" && $0.body.contains("Oat milk") })
        #expect(notes.filter { $0.title == "Welcome to Pinto Notes" }.count == 1)
        #expect(c.mainContext.allFolders().count == 1)
    }

    /// The first window, light and dark, for docs/MAKE-IT-YOURS.md and a look by eye.
    @Test(arguments: [false, true]) func theFirstWindow(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: false)
        try c.mainContext.save()
        try await AppSnapshotTests.withLastNote(c, "Welcome to Pinto Notes") {
            try await AppSnapshotTests.shoot(RootView().modelContainer(c), name: "local-only-first-run-\(dark ? "dark" : "light")",
                                             size: CGSize(width: 1180, height: 760), dark: dark)
        }
    }
}
#endif
