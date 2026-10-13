import Foundation
import SwiftData
import Testing
@testable import Pane

/// The sub-notes that live inside their parent are worked out once and kept (SubNoteIndex): the
/// answer must still be what asking each sub-note gives (`isNested`), after every kind of change,
/// saved or not.
@MainActor @Suite(.serialized) struct SubNoteIndexTests {
    /// Kept for the test's whole run: a context whose container has gone can't be read.
    let container = try! ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))

    func library() throws -> (ModelContext, Folder, Note, Note) {
        let c = container
        let ctx = c.mainContext
        SubNoteIndex.invalidate()
        let folder = ctx.createFolder(named: "Notes")
        let parent = ctx.createNote(in: .folder(folder.id), body: "Passport\n\nCharger")
        let sub = ctx.createSubNote(of: parent, body: "Visa\n\nForms")
        parent.body += "\n" + ModelContext.subNoteLine(for: sub)
        try ctx.save()
        return (ctx, folder, parent, sub)
    }

    /// What asking each sub-note one by one gives.
    func oneByOne(_ ctx: ModelContext) throws -> Set<UUID> {
        Set(try ctx.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.parentID != nil && $0.deletedAt == nil })).filter { ctx.isNested($0) }.map(\.id))
    }

    @Test func followsEveryKindOfChange() throws {
        let (ctx, folder, parent, sub) = try library()
        func check(_ what: Comment) throws {
            #expect(Set(SubNoteIndex.nestedIDs(in: ctx)) == (try oneByOne(ctx)), what)
            #expect(SidebarView.listedNotes(in: folder, context: ctx) == folder.liveNotes.count { !ctx.isNested($0) }, what)
        }
        try check("as made")
        #expect(SubNoteIndex.nestedIDs(in: ctx) == [sub.id])

        // The parent's text loses the link, not saved yet: the sub-note is a note of its own at once.
        let linked = parent.body
        parent.body = "Passport\n\nCharger"
        try check("the link removed, unsaved")
        #expect(SubNoteIndex.nestedIDs(in: ctx).isEmpty)
        parent.body = linked
        try check("the link back")

        // A second sub-note, made and linked.
        let second = ctx.createSubNote(of: parent, body: "Tickets")
        try check("a sub-note made, not linked yet")
        parent.body += "\n" + ModelContext.subNoteLine(for: second)
        try check("and linked")
        #expect(Set(SubNoteIndex.nestedIDs(in: ctx)) == [sub.id, second.id])

        // A note becomes a sub-note by its parent being set (as sync and Undo do), then saved.
        let other = ctx.createNote(in: .folder(folder.id), body: "Insurance")
        parent.body += "\n" + ModelContext.subNoteLine(for: other)
        try ctx.save()
        other.parentID = parent.id
        try ctx.save()
        try check("re-parented")

        // The parent deleted for good, and a sub-note deleted for good.
        ctx.purge(second)
        try check("a sub-note deleted for good")
        parent.deletedAt = .now
        try check("the parent gone, unsaved")
        #expect(SubNoteIndex.nestedIDs(in: ctx).isEmpty)
    }

    /// The counts take the sub-notes' trash state as it is now, saved or not.
    @Test func countsFollowTheTrash() throws {
        let (ctx, _, parent, sub) = try library()
        #expect(SidebarView.counts(in: ctx) == (live: 1, trashed: 0))
        parent.trashedAt = .now
        sub.trashedAt = .now
        #expect(SidebarView.counts(in: ctx) == (live: 0, trashed: 1))
    }

    /// Asked again and again with nothing changing, the answer is kept: no fetch for each sub-note.
    @Test func isKeptWhileNothingChanges() throws {
        let (ctx, _, _, _) = try library()
        let first = SubNoteIndex.nestedIDs(in: ctx)
        let clock = ContinuousClock()
        let t = clock.measure { for _ in 0..<1000 { _ = SubNoteIndex.nestedIDs(in: ctx) } }
        #expect(SubNoteIndex.nestedIDs(in: ctx) == first)
        #expect(t < .milliseconds(50), "a thousand asks of a kept answer")
    }
}
