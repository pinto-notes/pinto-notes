import Foundation
import Observation
import SwiftData
import Testing
@testable import Pane

/// The note list's entries (LibraryNotes): read without Observation, watched a slice at a time
/// after, and taken in or dropped one by one when a save adds or deletes notes.
@MainActor @Suite(.serialized) struct LibraryNotesTests {
    /// Kept for the test's whole run: a context whose container has gone can't be read.
    let container = try! ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))

    func library(_ count: Int) throws -> (ModelContext, [Note]) {
        let ctx = container.mainContext
        var notes: [Note] = []
        for i in 0..<count {
            let n = Note(body: "Note \(i)")
            n.updatedAt = Date(timeIntervalSinceNow: -Double(i) * 60)
            ctx.insert(n)
            notes.append(n)
        }
        try ctx.save()
        return (ctx, notes)
    }

    final class Flag: @unchecked Sendable { var on = false }

    /// Read inside a view's body (an Observation scope), the entries leave the body depending on
    /// the list's own counter, not on every note: in the app, any note's change used to work the
    /// whole list out again, and watching 20,000 notes inside the body took seconds.
    @Test func readingTheEntriesDoesNotMakeTheReaderWatchEveryNote() async throws {
        let (ctx, notes) = try library(50)
        let library = LibraryNotes()
        let fired = Flag()
        withObservationTracking { _ = library.entries(in: ctx) } onChange: { fired.on = true }
        // A note changes in a way the list doesn't show (its text): nothing tells the reader.
        notes[10].body = "Changed"
        #expect(!fired.on, "the reader isn't told of a note's text")
        // A change the list shows does reach it, through the list's counter.
        try? await Task.sleep(for: .milliseconds(100))
        notes[10].isPinned = true
        try? await Task.sleep(for: .milliseconds(100))
        #expect(fired.on, "a pin moves the note: the list says so")
    }

    /// A note that changes after the first read but before its watch began is still caught.
    @Test func aChangeBeforeTheWatchBeganIsCaught() async throws {
        let (ctx, notes) = try library(3 * LibraryNotes.watchSlice)
        let library = LibraryNotes()
        _ = library.entries(in: ctx)
        // In the same turn as the read: no note is watched yet.
        let last = notes[notes.count - 1]
        last.updatedAt = .now
        last.isPinned = true
        try? await Task.sleep(for: .milliseconds(300))
        let entries = library.entries(in: ctx)
        #expect(entries.first?.id == last.id, "the changed note moved to the top")
        #expect(entries.first?.pinned == true)
    }

    /// A note added or deleted for good is taken in or dropped where it goes, not by reading
    /// every note again; many at once (an import) still read everything.
    @Test func addedAndDeletedNotesAreTakenOneByOne() async throws {
        let (ctx, notes) = try library(400)
        let library = LibraryNotes()
        _ = library.entries(in: ctx)
        try? await Task.sleep(for: .milliseconds(100))
        let made = ctx.createNote(in: .all, body: "New")
        try ctx.save()
        var entries = library.entries(in: ctx)
        #expect(entries.first?.id == made.id)
        #expect(entries.count == 401)
        let gone = notes[5]
        ctx.delete(gone)
        try ctx.save()
        entries = library.entries(in: ctx)
        #expect(entries.count == 400)
        #expect(!entries.contains { $0.id == gone.id })
        // The new note is watched too.
        made.isPinned = true
        try? await Task.sleep(for: .milliseconds(100))
        #expect(library.entries(in: ctx).first { $0.id == made.id }?.pinned == true)
        let wholesale = library.wholesale
        for i in 0..<(LibraryNotes.wholesaleChange + 1) { ctx.insert(Note(body: "Imported \(i)")) }
        try ctx.save()
        #expect(library.entries(in: ctx).count == 400 + LibraryNotes.wholesaleChange + 1)
        #expect(library.wholesale == wholesale + 1, "an import is a new list")
    }
}

extension LibraryNotesTests {
    /// The sidebar's folder counts come from the list's notes: live notes in the folder, without
    /// the sub-notes inside their parent, and each folder hears when its own count changes.
    @Test func folderCountsFollowTheNotes() async throws {
        let ctx = container.mainContext
        SubNoteIndex.invalidate()
        let work = ctx.createFolder(named: "Work"), home = ctx.createFolder(named: "Home")
        let a = ctx.createNote(in: .folder(work.id), body: "A")
        let b = ctx.createNote(in: .folder(work.id), body: "B")
        _ = ctx.createNote(in: .folder(home.id), body: "C")
        let sub = ctx.createSubNote(of: a, body: "Sub")
        a.body += "\n" + ModelContext.subNoteLine(for: sub)
        try ctx.save()
        let library = LibraryNotes()
        #expect(library.listedCount(inFolder: work.id, context: ctx) == 2, "A and B; the sub-note lives inside A")
        #expect(library.listedCount(inFolder: home.id, context: ctx) == 1)

        let heard = Flag()
        withObservationTracking { _ = library.listedCount(inFolder: home.id, context: ctx) } onChange: { heard.on = true }
        ctx.trash(b)
        try? await Task.sleep(for: .milliseconds(100))
        #expect(library.listedCount(inFolder: work.id, context: ctx) == 1, "B went to Recently Deleted")
        #expect(!heard.on, "Home's row isn't told of Work's change")
        ctx.move(a, to: home)
        try? await Task.sleep(for: .milliseconds(100))
        for f in [work, home] {
            #expect(library.listedCount(inFolder: f.id, context: ctx) == SidebarView.listedNotes(in: f, context: ctx), "the same as the folder's own notes say")
        }
        #expect(library.listedCount(inFolder: home.id, context: ctx) == 2)
        #expect(heard.on, "Home's row hears of the note that came")
    }
}
