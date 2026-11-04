import Foundation
import SwiftData
import Testing
@testable import Pane

/// The library on disk as builds before shared notes left it (origin/dev, 14 October 2026): the
/// same models without `Note.sharedNoteID`, `Note.sharedDocument` and `SharedDocument`.
enum LibraryBeforeSharing {
    @Model final class Folder {
        @Attribute(.unique) var id: UUID
        var name: String
        var createdAt: Date
        var updatedAt: Date
        var sortIndex: Double
        var parent: Folder?
        @Relationship(deleteRule: .cascade, inverse: \Folder.parent) var children: [Folder] = []
        @Relationship(deleteRule: .nullify, inverse: \Note.folder) var notes: [Note] = []
        var deletedAt: Date?
        var dirty: Bool = true
        var serverVersion: Int64 = 0
        init(name: String) { id = UUID(); self.name = name; createdAt = .now; updatedAt = .now; sortIndex = 0 }
    }

    @Model final class Note {
        @Attribute(.unique) var id: UUID
        var body: String
        var createdAt: Date
        var updatedAt: Date
        var isPinned: Bool
        var folder: Folder?
        var parentID: UUID?
        var trashedAt: Date?
        var deletedAt: Date?
        var dirty: Bool = true
        var serverVersion: Int64 = 0
        var lockedBody: String?
        var summaryTitle: String?
        var summaryPreview: String?
        init(body: String, folder: Folder?) { id = UUID(); self.body = body; createdAt = .now; updatedAt = .now; isPinned = false; self.folder = folder }
    }

    @Model final class Attachment {
        @Attribute(.unique) var id: UUID
        var filename: String
        var contentType: String
        var size: Int64
        var createdAt: Date
        var deletedAt: Date?
        var uploaded: Bool = false
        var dirty: Bool = true
        var folderID: UUID?
        var trashedAt: Date?
        var modifiedAt: Date?
        var contentVersion: Int = 0
        var bytesEdited: Bool = false
        init(filename: String) { id = UUID(); self.filename = filename; contentType = "public.data"; size = 0; createdAt = .now }
    }
}

/// Shared notes add to the library's storage (a property and a relationship on Note, and the
/// SharedDocument model). A library written by an earlier build opens as it was, with nothing
/// lost, and takes shared documents from then on.
@MainActor @Suite struct LibraryUpgradeTests {
    @Test func aLibraryFromBeforeSharedNotesOpensWithEverythingInIt() throws {
        let dir = FileManager.default.temporaryDirectory.appending(path: "library-upgrade-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dir) }
        let url = dir.appending(path: "Pane.store")
        var noteID = UUID(), folderID = UUID()
        do {
            let old = try ModelContainer(for: LibraryBeforeSharing.Folder.self, LibraryBeforeSharing.Note.self, LibraryBeforeSharing.Attachment.self,
                                         configurations: ModelConfiguration(url: url))
            let context = ModelContext(old)
            let folder = LibraryBeforeSharing.Folder(name: "Travel")
            context.insert(folder)
            let note = LibraryBeforeSharing.Note(body: "Lisbon\nPastéis at 9", folder: folder)
            note.isPinned = true
            context.insert(note)
            context.insert(LibraryBeforeSharing.Attachment(filename: "tickets.pdf"))
            try context.save()
            noteID = note.id
            folderID = folder.id
        }

        let new = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(url: url))
        let context = ModelContext(new)
        let note = try #require(context.note(noteID))
        #expect(note.body == "Lisbon\nPastéis at 9" && note.isPinned && note.folder?.id == folderID)
        #expect(!note.isShared && note.sharedDocument == nil)
        #expect(try context.fetchCount(FetchDescriptor<Pane.Attachment>()) == 1)
        // And it takes a shared document now.
        let record = SharedDocument(id: noteID, epoch: 1, role: "owner", saved: Data([1, 2, 3]))
        context.insert(record)
        note.sharedNoteID = noteID
        note.sharedDocument = record
        try context.save()
        let again = ModelContext(new)
        #expect(again.sharedDocument(noteID)?.saved == Data([1, 2, 3]))
        #expect(again.note(noteID)?.sharedDocument?.id == noteID)
    }
}
