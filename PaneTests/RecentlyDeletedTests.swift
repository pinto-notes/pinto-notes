import Foundation
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// What Recently Deleted and deleting a folder say, and that a deleted note stays as it is
/// (2026-10-12: a deleted folder read as recoverable; deleted notes could be edited).
@MainActor @Suite struct RecentlyDeletedTests {
    @Test func deletingAFolderSaysTheFolderGoesAndWhatWaits() {
        #expect(SidebarView.deleteMessage(subfolders: 0, notes: 0, files: 0) == "The folder goes away.")
        #expect(SidebarView.deleteMessage(subfolders: 0, notes: 9, files: 0)
                == "The folder goes away. Its 9 notes move to Recently Deleted, where you can recover them for 30 days.")
        #expect(SidebarView.deleteMessage(subfolders: 0, notes: 1, files: 0)
                == "The folder goes away. Its 1 note moves to Recently Deleted, where you can recover it for 30 days.")
        #expect(SidebarView.deleteMessage(subfolders: 2, notes: 9, files: 3)
                == "The folder and its 2 subfolders go away. Their 9 notes and 3 files move to Recently Deleted, where you can recover them for 30 days.")
        #expect(SidebarView.deleteMessage(subfolders: 1, notes: 0, files: 0) == "The folder and its 1 subfolder go away.")
        for m in [SidebarView.deleteMessage(subfolders: 2, notes: 9, files: 3)] { #expect(!m.contains("\u{2014}") && !m.contains("\u{2013}")) }
    }

    @Test func aFoldersContentsCountSubfolders() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let brain = ctx.createFolder(named: "Brain")
        let deep = ctx.createFolder(named: "Deep", parent: brain)
        _ = ctx.createFolder(named: "Deeper", parent: deep)
        for i in 0..<3 { _ = ctx.createNote(in: .folder(brain.id), body: "Note \(i)") }
        _ = ctx.createNote(in: .folder(deep.id), body: "Inside")
        let gone = ctx.createNote(in: .folder(deep.id), body: "Already deleted")
        ctx.trash(gone)
        let count = SidebarView.contents(of: brain, files: { $0 == deep.id ? 2 : 0 })
        #expect(count.subfolders == 2 && count.notes == 4 && count.files == 2, "notes already in Recently Deleted aren't counted again")
        // And it is true: the folders go, the notes wait in Recently Deleted.
        ctx.trash(brain)
        #expect(ctx.allFolders().filter { $0.deletedAt == nil }.isEmpty)
        #expect(SidebarView.counts(in: ctx) == (live: 0, trashed: 5))
    }

    @Test func recentlyDeletedSaysHowLongInItsCountLine() {
        #expect(NoteListView.countText(notes: 9, files: 0, capitalized: false, trash: true) == "9 notes \u{00B7} Deleted after 30 days")
        #expect(NoteListView.countText(notes: 1, files: 2, capitalized: true, trash: true) == "1 Note, 2 Files \u{00B7} Deleted after 30 days")
        #expect(NoteListView.countText(notes: 0, files: 0, capitalized: false, trash: true) == "0 notes", "nothing to say when it's empty")
        #expect(NoteListView.countText(notes: 9, files: 0, capitalized: false, trash: false) == "9 notes")
    }

    final class Target: EditorTarget {
        var currentText = "Plan\n- [ ] Milk"
        var currentSelection = NSRange(location: 5, length: 0)
        var applied = 0
        func apply(_ edit: TextEdit) { applied += 1 }
        func focusEditor() {}
        func insertGrid() {}
        func leaveGrid(_ index: Int, below: Bool) {}
        func tintChanges(from previous: String) {}
        func clearTint() {}
        func syncExternal(_ new: String) {}
        func showRemoteCarets(_ carets: [RemoteCaret]) {}
    }

    @Test func aDeletedNotesEditorChangesNothing() {
        let controller = EditorController()
        let target = Target()
        controller.target = target
        controller.checklist()
        #expect(target.applied == 1)
        controller.readOnly = true
        controller.checklist()
        controller.insertTable()
        #expect(target.applied == 1, "Format, Checklist and Table do nothing to a note in Recently Deleted")
    }

    #if os(macOS)
    /// The banner over a deleted note, light and dark (offscreen; AMBER_HIG_SHOTS only).
    @Test func trashBannerPicture() async throws {
        guard let dir = ImportSheetSnapshots.dir else { return }
        for dark in [false, true] {
            let view = TrashBanner {}.frame(width: 700).background(Color.notePage)
            try await VersionHistorySnapshots.shoot(view, to: dir.appending(path: "80-trash-banner-after-\(dark ? "dark" : "light").png"), size: CGSize(width: 700, height: 74), dark: dark)
        }
    }
    #endif
}

extension RecentlyDeletedTests {
    /// After 30 days in Recently Deleted a note goes for good, at launch; the store picks them.
    @Test func notesPastThirtyDaysGoForGood() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let day: TimeInterval = 24 * 3600
        let old = ctx.createNote(in: .all, body: "Old")
        old.trashedAt = .now.addingTimeInterval(-31 * day)
        let recent = ctx.createNote(in: .all, body: "Recent")
        recent.trashedAt = .now.addingTimeInterval(-29 * day)
        let live = ctx.createNote(in: .all, body: "Live")
        try ctx.save()
        ctx.purgeExpiredTrash()
        #expect(old.deletedAt != nil, "past 30 days")
        #expect(recent.deletedAt == nil && recent.trashedAt != nil, "still in Recently Deleted")
        #expect(live.deletedAt == nil && live.trashedAt == nil)
    }
}
