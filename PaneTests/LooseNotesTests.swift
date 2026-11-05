import Foundation
import SwiftData
import Testing
@testable import Pane

/// An AI's note at the top of the notebook (no folder) is in a list: with one folder the sidebar
/// had no "All Notes", so the note was on the Mac and in no list (council round 15, signed-in captures).
@MainActor struct LooseNotesTests {
    @Test func allNotesShowsWhileANoteIsInNoFolder() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let notes = Folder(name: "Notes")
        ctx.insert(notes)
        let welcome = Note(body: "Welcome")
        welcome.folder = notes
        ctx.insert(welcome)
        try ctx.save()
        #expect(!SidebarView.showsAllNotes(folders: 1, context: ctx), "one folder holding every note: no row")
        let groceries = Note(body: "Groceries")
        ctx.insert(groceries)
        try ctx.save()
        #expect(SidebarView.showsAllNotes(folders: 1, context: ctx), "a note in no folder")
        #expect(ModelContext.lists(.all, groceries) == true, "and All Notes lists it")
        groceries.trashedAt = .now
        try ctx.save()
        #expect(!SidebarView.showsAllNotes(folders: 1, context: ctx), "not for a deleted one")
        #expect(SidebarView.showsAllNotes(folders: 2, context: ctx))
    }
}
