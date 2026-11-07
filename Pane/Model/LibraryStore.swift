import Foundation
import SwiftData
import os

/// The library's models as they are today, version 1. A change SwiftData can't make by itself
/// (a type change, a required property without a default, a split relationship) gets a
/// `LibrarySchemaV2` with its own copies of the models and a stage in `LibraryMigrationPlan`.
enum LibrarySchemaV1: VersionedSchema {
    static let versionIdentifier = Schema.Version(1, 0, 0)
    static var models: [any PersistentModel.Type] { [Folder.self, Note.self, Attachment.self, SharedDocument.self] }
}

/// How a library from an older version becomes today's. One version so far, so nothing to do.
enum LibraryMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] { [LibrarySchemaV1.self] }
    static var stages: [MigrationStage] { [] }
}

/// Opens the library. A library on disk that's there and readable yet won't open (it can't be
/// migrated, or it's damaged) is moved aside, whole and untouched, into a folder beside it named
/// "Library that didn't open <date>", and an empty one is opened in its place: sync brings the
/// account's notes down again. One that can't be read at all (the device is locked, no
/// permission) isn't the library's fault and is left where it is.
enum LibraryStore {
    private static let log = Logger(subsystem: "dev.emilwagman.pane", category: "library")

    static let schema = Schema(versionedSchema: LibrarySchemaV1.self)

    struct Opened {
        let container: ModelContainer
        /// The folder the library that didn't open was moved into; nil when it opened.
        let movedAside: URL?
    }

    /// `failed`: told of the first failure, before anything is moved (for the report).
    static func open(_ config: ModelConfiguration, failed: (Error) -> Void = { _ in }) throws -> Opened {
        do {
            return Opened(container: try container(config), movedAside: nil)
        } catch {
            failed(error)
            guard !config.isStoredInMemoryOnly, isReadable(config.url) else { throw error }
            let aside = try moveAside(config.url)
            log.error("the library didn't open and was moved aside: \(String(describing: error), privacy: .public)")
            return Opened(container: try container(config), movedAside: aside)
        }
    }

    /// With the migration plan; then, for a library an older build left with models from before
    /// version 1 (which the plan doesn't know), with SwiftData's own migration, as every build
    /// before this one opened it.
    static func container(_ config: ModelConfiguration) throws -> ModelContainer {
        do {
            return try ModelContainer(for: schema, migrationPlan: LibraryMigrationPlan.self, configurations: config)
        } catch {
            guard !config.isStoredInMemoryOnly else { throw error }
            return try ModelContainer(for: schema, configurations: config)
        }
    }

    /// Whether the store's file is there and its first bytes can be read.
    static func isReadable(_ url: URL) -> Bool {
        guard let handle = try? FileHandle(forReadingFrom: url) else { return false }
        defer { try? handle.close() }
        return (try? handle.read(upToCount: 16)) != nil
    }

    /// Moves the store and its journal files (-wal, -shm), with their names, into a new folder
    /// beside it, so the three still open together as the library they were.
    static func moveAside(_ url: URL, now: Date = .now) throws -> URL {
        let fm = FileManager.default
        let stamp = now.formatted(Date.ISO8601FormatStyle(timeZone: .current).year().month().day().time(includingFractionalSeconds: false).timeSeparator(.omitted))
        var folder = url.deletingLastPathComponent().appending(path: "Library that didn't open \(stamp)", directoryHint: .isDirectory)
        var n = 2
        while fm.fileExists(atPath: folder.path) {
            folder = url.deletingLastPathComponent().appending(path: "Library that didn't open \(stamp) \(n)", directoryHint: .isDirectory)
            n += 1
        }
        try fm.createDirectory(at: folder, withIntermediateDirectories: true)
        for suffix in ["", "-wal", "-shm"] {
            let file = URL(fileURLWithPath: url.path + suffix)
            guard fm.fileExists(atPath: file.path) else { continue }
            try fm.moveItem(at: file, to: folder.appending(path: file.lastPathComponent))
        }
        return folder
    }
}
