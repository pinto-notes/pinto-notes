import Foundation
import SwiftData
import Testing
@testable import Pane

/// Opening the library (LibraryStore): one that won't open is kept, moved aside, and the app
/// starts on an empty one instead of stopping; today's libraries open as version 1 untouched.
@MainActor @Suite struct LibraryStoreTests {
    let folder: URL
    let store: URL

    init() throws {
        folder = FileManager.default.temporaryDirectory.appending(path: "library-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        store = folder.appending(path: "Pane.store")
    }

    private func cleanUp() {
        _ = try? FileManager.default.setAttributes([.posixPermissions: 0o644], ofItemAtPath: store.path)
        try? FileManager.default.removeItem(at: folder)
    }

    private func entries() -> [String] { (try? FileManager.default.contentsOfDirectory(atPath: folder.path)) ?? [] }

    @Test func aLibraryThatWontOpenIsMovedAsideAndAnEmptyOneOpens() throws {
        defer { cleanUp() }
        let damaged = Data("This is not a library. ".utf8) + Data(repeating: 0xA5, count: 4096)
        try damaged.write(to: store)
        try damaged.prefix(64).write(to: URL(fileURLWithPath: store.path + "-wal"))
        var failures = 0
        let opened = try LibraryStore.open(ModelConfiguration(url: store)) { _ in failures += 1 }
        #expect(failures == 1, "the failure is reported")
        let aside = try #require(opened.movedAside)
        #expect(aside.deletingLastPathComponent().standardizedFileURL == folder.standardizedFileURL)
        #expect(aside.lastPathComponent.hasPrefix("Library that didn't open "))
        // Kept as it was, journal included, under its own names.
        #expect(try Data(contentsOf: aside.appending(path: "Pane.store")) == damaged)
        #expect(FileManager.default.fileExists(atPath: aside.appending(path: "Pane.store-wal").path))
        // The empty library works.
        let context = opened.container.mainContext
        #expect(try context.fetchCount(FetchDescriptor<Note>()) == 0)
        context.insert(Note(body: "Written after"))
        try context.save()
        #expect(try context.fetchCount(FetchDescriptor<Note>()) == 1)
    }

    @Test func aLibraryMadeBeforeVersioningOpensAsVersionOneWithItsNotes() throws {
        defer { cleanUp() }
        let id: UUID
        do {
            // As every build before this one made it.
            let old = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: store))
            let f = Folder(name: "Trips")
            let n = Note(body: "Packing list\n- passport")
            n.folder = f
            n.dirty = true
            old.mainContext.insert(f)
            old.mainContext.insert(n)
            try old.mainContext.save()
            id = n.id
        }
        var failed: Error?
        let opened = try LibraryStore.open(ModelConfiguration(url: store)) { failed = $0 }
        #expect(failed == nil && opened.movedAside == nil)
        let notes = try opened.container.mainContext.fetch(FetchDescriptor<Note>())
        #expect(notes.map(\.id) == [id])
        #expect(notes.first?.body == "Packing list\n- passport" && notes.first?.dirty == true && notes.first?.folder?.name == "Trips")
        #expect(!entries().contains { $0.hasPrefix("Library that didn't open") })
    }

    /// A library last opened by a build whose notes had fewer properties (before shared notes,
    /// front matter and summaries) still opens, migrated, with its notes.
    @Test func aLibraryFromAnOlderModelOpensWithItsNotes() throws {
        defer { cleanUp() }
        let id = UUID()
        do {
            let old = try ModelContainer(for: OlderLibrary.Note.self, configurations: ModelConfiguration(url: store))
            old.mainContext.insert(OlderLibrary.Note(id: id, body: "Written last year"))
            try old.mainContext.save()
        }
        var failed: Error?
        let opened = try LibraryStore.open(ModelConfiguration(url: store)) { failed = $0 }
        #expect(failed == nil && opened.movedAside == nil, "\(String(describing: failed))")
        let notes = try opened.container.mainContext.fetch(FetchDescriptor<Note>())
        #expect(notes.map(\.id) == [id] && notes.first?.body == "Written last year" && notes.first?.dirty == true)
        // And opens with the plan from then on.
        _ = try ModelContainer(for: LibraryStore.schema, migrationPlan: LibraryMigrationPlan.self, configurations: ModelConfiguration(url: store))
    }

    @Test func aLibraryThatCantBeReadAtAllIsLeftWhereItIs() throws {
        defer { cleanUp() }
        try Data("locked".utf8).write(to: store)
        try FileManager.default.setAttributes([.posixPermissions: 0], ofItemAtPath: store.path)
        #expect(throws: (any Error).self) { try LibraryStore.open(ModelConfiguration(url: store)) }
        #expect(FileManager.default.fileExists(atPath: store.path))
        #expect(!entries().contains { $0.hasPrefix("Library that didn't open") })
    }

    @Test func movingAsideTwiceInASecondKeepsBoth() throws {
        defer { cleanUp() }
        let now = Date.now
        try Data("one".utf8).write(to: store)
        let first = try LibraryStore.moveAside(store, now: now)
        try Data("two".utf8).write(to: store)
        let second = try LibraryStore.moveAside(store, now: now)
        #expect(first != second)
        #expect(try Data(contentsOf: first.appending(path: "Pane.store")) == Data("one".utf8))
        #expect(try Data(contentsOf: second.appending(path: "Pane.store")) == Data("two".utf8))
    }
}

/// A library as an older build made it: notes alone, with fewer properties.
enum OlderLibrary {
    @Model final class Note {
        @Attribute(.unique) var id: UUID
        var body: String
        var createdAt: Date
        var updatedAt: Date
        var isPinned: Bool
        var trashedAt: Date?
        var deletedAt: Date?
        var dirty: Bool = true
        var serverVersion: Int64 = 0

        init(id: UUID, body: String) {
            self.id = id
            self.body = body
            createdAt = .now
            updatedAt = .now
            isPinned = false
        }
    }
}
