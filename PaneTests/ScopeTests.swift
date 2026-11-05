import Foundation
import SwiftData
import Testing
@testable import Pane

/// Where the sidebar points after folders come and go.
@MainActor @Suite struct ScopeTests {
    let a = UUID()
    let b = UUID()

    @Test func theFolderListKeepsNoSelection() {
        // nil is the iPhone folder list: never select a row there without pushing it.
        #expect(Scope.settled(nil, liveFolders: [a]) == nil)
        #expect(Scope.settled(nil, liveFolders: [a, b]) == nil)
    }

    @Test func aSingleFolderStandsInForAllNotes() {
        #expect(Scope.settled(.all, liveFolders: [a]) == .folder(a))
        #expect(Scope.settled(.all, liveFolders: [a, b]) == .all)
        #expect(Scope.settled(.trash, liveFolders: [a]) == .trash)
    }

    /// Round 15: a new Mac opened on Notes (1 note) while the AI's three notes, in no folder,
    /// synced in after it and showed in no list. All Notes comes back for them; a folder you
    /// picked stays.
    @Test func aLooseNoteBringsAllNotesBack() {
        let first = Scope.settled(.all, liveFolders: [a], loose: false, standIn: nil)
        #expect(first.scope == .folder(a) && first.standIn == a)
        let synced = Scope.settled(first.scope, liveFolders: [a], loose: true, standIn: first.standIn)
        #expect(synced.scope == .all && synced.standIn == nil, "the AI's notes arrived: All Notes")
        #expect(Scope.settled(.all, liveFolders: [a], loose: true, standIn: nil).scope == .all, "loose from the start")
        #expect(Scope.settled(.folder(a), liveFolders: [a], loose: true, standIn: nil).scope == .folder(a), "picked, kept")
        #expect(Scope.settled(.folder(a), liveFolders: [a], loose: true, standIn: b).scope == .folder(a), "another stand-in is not this pick")
    }

    /// Recently Deleted is in the sidebar only while something is in it, like Notes (2026-10-11:
    /// it was listed with 0 for an account that had never deleted anything).
    @Test func recentlyDeletedIsListedOnlyWhileItHoldsSomething() {
        #expect(!SidebarView.showsTrash(notes: 0, files: 0))
        #expect(SidebarView.showsTrash(notes: 1, files: 0))
        #expect(SidebarView.showsTrash(notes: 0, files: 2), "a deleted file counts")
        // Open when its last note leaves: the list goes back to the notes. Otherwise nothing moves.
        #expect(SidebarView.leavingEmptyTrash(.trash, showsTrash: false) == .all)
        #expect(SidebarView.leavingEmptyTrash(.trash, showsTrash: true) == nil)
        #expect(SidebarView.leavingEmptyTrash(.folder(a), showsTrash: false) == nil)
        #expect(SidebarView.leavingEmptyTrash(nil, showsTrash: false) == nil)
    }

    /// What the sidebar counts after an import, a delete of everything and a second import (the
    /// "Notes 18, Recently Deleted 18" of 2026-10-11): bringing notes in puts nothing in Recently
    /// Deleted, and its count is the notes that were deleted, no more.
    @Test func importedNotesAreNotCountedAsDeleted() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let folder = ctx.createFolder(named: "Notes")
        let day = Date(timeIntervalSinceReferenceDate: 800_000_000)
        func bringIn() -> [Note] {
            (0..<18).compactMap { i -> Note? in
                // As the Apple Notes import does: skip a note that is already here, unchanged.
                if ctx.hasImported(title: "Note \(i)", modified: day) { return nil }
                let n = ctx.createNote(in: .folder(folder.id), body: "Note \(i)\n\nText")
                n.createdAt = day
                n.updatedAt = day
                return n
            }
        }
        let first = bringIn()
        try ctx.save()
        #expect(SidebarView.counts(in: ctx) == (live: 18, trashed: 0))
        #expect(!SidebarView.showsTrash(notes: SidebarView.counts(in: ctx).trashed, files: 0))
        #expect(bringIn().isEmpty, "the same notes again bring nothing in")
        ctx.remove(first)
        #expect(SidebarView.counts(in: ctx) == (live: 0, trashed: 18))
        // Deleted notes are gone as far as an import knows: it brings them in again.
        #expect(bringIn().count == 18)
        #expect(SidebarView.counts(in: ctx) == (live: 18, trashed: 18))
        // Emptying Recently Deleted takes its row away.
        ctx.remove(first)
        #expect(SidebarView.counts(in: ctx) == (live: 18, trashed: 0))
    }

    @Test func aFolderInsideAnotherIsANewFolderToo() {
        #expect(SidebarView.nameAlertTitle(renaming: false, inside: true) == "New Folder", "a folder inside another is a New Folder too")
        #expect(SidebarView.nameAlertTitle(renaming: false, inside: false) == "New Folder")
        #expect(SidebarView.nameAlertTitle(renaming: true, inside: false) == "Rename Folder")
    }

    @Test func aFolderThatIsGoneFallsBack() {
        #expect(Scope.settled(.folder(b), liveFolders: [a, UUID()]) == .all)
        #expect(Scope.settled(.folder(b), liveFolders: [a]) == .folder(a))
        #expect(Scope.settled(.folder(a), liveFolders: [a, b]) == .folder(a))
    }

    /// Deleting Work while Q4 planning (inside it) was open used to leave you in a ghost
    /// folder, and a new note went into it, out of every folder's sight.
    @Test func aNewNoteNeverLandsInADeletedFolder() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = ModelContext(c)
        let home = ctx.createFolder(named: "Notes")
        let work = ctx.createFolder(named: "Work")
        let q4 = ctx.createFolder(named: "Q4 planning", parent: work)
        ctx.trash(work)
        #expect(q4.deletedAt != nil)
        let n = ctx.createNote(in: .folder(q4.id), body: "Typed after the delete")
        #expect(n.folder?.id == home.id)
        #expect(Scope.settled(.folder(q4.id), liveFolders: ctx.allFolders().map(\.id)) == .folder(home.id))
    }

    /// Compose on the iPhone folder list opens the new note inside its folder (TestFlight 1.1.1
    /// added a note there that no editor showed).
    @Test func composeFromTheFolderListOpensTheNotesFolder() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = ModelContext(c)
        let travel = ctx.createFolder(named: "Travel")
        _ = ctx.createFolder(named: "Personal")
        let n = ctx.createNote(in: .all)
        #expect(Scope.opening(n) == .folder(travel.id))
        #expect(Scope.settled(Scope.opening(n), liveFolders: ctx.allFolders().map(\.id)) == .folder(travel.id))
    }

    /// Relaunching on a blank note you never typed in discards it and opens the last real one,
    /// instead of an empty page (the 1.1.1 relaunch).
    @Test func aBlankNoteLeftOpenIsDiscardedAtLaunch() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = ModelContext(c)
        let folder = ctx.createFolder(named: "Notes")
        let real = ctx.createNote(in: .folder(folder.id), body: "Groceries\n\n- [ ] Eggs\n")
        let blank = ctx.createNote(in: .folder(folder.id))
        blank.updatedAt = .now.addingTimeInterval(10)
        #expect(ctx.noteToReopen(last: blank.id)?.id == real.id)
        #expect(blank.deletedAt != nil, "discarded, so it syncs away too")
        #expect(ctx.noteToReopen(last: real.id)?.id == real.id)
        #expect(ctx.noteToReopen(last: nil)?.id == real.id)
    }

    /// Reopening on Recently Deleted, on the deleted note you were on: that note opens, not one
    /// the list beside it doesn't hold (MacEmptyDetailTests saw no note open there).
    @Test func aDeletedNoteReopensInRecentlyDeleted() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = ModelContext(c)
        let live = ctx.createNote(in: .all, body: "Lisbon\n\nTrams")
        let gone = ctx.createNote(in: .all, body: "Groceries\n\n- [ ] Eggs")
        ctx.trash(gone)
        #expect(ctx.noteToReopen(last: gone.id, inTrash: true)?.id == gone.id)
        #expect(ctx.noteToReopen(last: gone.id)?.id == live.id, "elsewhere, a deleted note doesn't reopen")
        #expect(ctx.noteToReopen(last: live.id, inTrash: true)?.id == live.id)
    }

    /// A new note in All Notes went into "Shared with me" for anyone who had it: it sorts first.
    @Test func aNewNoteNeverGoesIntoSharedWithMe() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = ModelContext(c)
        let notes = ctx.createFolder(named: "Notes")
        let shared = Folder(name: "Shared with me")
        shared.sortIndex = -1
        ctx.insert(shared)
        #expect(ctx.createNote(in: .all, body: "Plan").folder?.id == notes.id)
        // Only Shared with me: a folder of your own is made for it.
        let c2 = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx2 = ModelContext(c2)
        let only = Folder(name: "Shared with me"); only.sortIndex = -1; ctx2.insert(only)
        let n = ctx2.createNote(in: .all, body: "Plan")
        #expect(n.folder?.name == "Notes")
    }
}
