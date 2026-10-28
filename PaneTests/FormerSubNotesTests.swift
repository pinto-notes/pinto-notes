import Foundation
import SwiftData
import Testing
@testable import Pane

/// Sub-notes were removed as a feature on 2026-10-28 (Emil: "delete sub notes as a feature").
/// Nothing in either app makes one any more, and the ones that exist (made by an older build, or
/// by an AI writing "Work/Acme/Agenda.md" next to "Work/Acme.md") are ordinary notes in a folder
/// named after the note they were under: shown, opened, edited, moved and deleted like any note.
/// Their text, files, links and apps are kept, and so are the files of the note they were under.
@MainActor @Suite struct FormerSubNotesTests {
    let container: ModelContainer
    var ctx: ModelContext { container.mainContext }

    init() throws {
        container = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    private func link(_ n: Note) -> String { "[\(n.title)](pane-note:\(n.id.uuidString.lowercased()))" }

    /// A note under another, as an older build or the server made one: it names its parent, and
    /// the parent's text links it on a line of its own.
    @discardableResult
    private func subNote(_ body: String, under parent: Note) -> Note {
        let n = Note(body: body, folder: parent.folder)
        n.parentID = parent.id
        ctx.insert(n)
        parent.body += "\n" + link(n) + "\n"
        return n
    }

    private func listed(_ scope: Scope) throws -> [String] {
        NoteListView.scoped(try ctx.fetch(FetchDescriptor<Note>()).map(NoteEntry.init), to: scope, context: ctx).compactMap { $0.note(in: ctx)?.title }.sorted()
    }

    // MARK: Where an existing sub-note goes

    @Test func anExistingSubNoteIsANoteInAFolderNamedAfterItsParent() throws {
        let work = ctx.createFolder(named: "Work")
        let acme = ctx.createNote(in: .folder(work.id), body: "Acme")
        let agenda = subNote("Agenda\n- [ ] budget", under: acme)
        let minutes = subNote("Minutes", under: agenda)
        let old = subNote("Old plan", under: acme)
        old.trashedAt = .now
        let acmeText = acme.body, agendaText = agenda.body
        try ctx.save()
        for n in [acme, agenda, minutes, old] { n.dirty = false }

        #expect(ctx.foldSubNotesIntoFolders() == 3)
        let acmeFolder = try #require(agenda.folder)
        #expect(acmeFolder.name == "Acme" && acmeFolder.parent?.id == work.id, "Work/Acme/, beside the note Acme")
        let agendaFolder = try #require(minutes.folder)
        #expect(agendaFolder.name == "Agenda" && agendaFolder.parent?.id == acmeFolder.id, "a note under a sub-note: Work/Acme/Agenda/")
        #expect(old.folder?.id == acmeFolder.id && old.trashedAt != nil, "one in Recently Deleted waits there, and comes back into the folder")
        #expect([agenda, minutes, old].allSatisfy { $0.parentID == nil && $0.dirty }, "no parent any more, and that syncs")
        #expect(acme.parentID == nil && acme.folder?.id == work.id && !acme.dirty, "the note they were under stays as it was")
        #expect(acme.body == acmeText && agenda.body == agendaText, "no text changes")
        #expect(acme.body.contains(link(agenda)), "the line in the other note is an ordinary link now")
        #expect(acmeFolder.dirty && agendaFolder.dirty, "the new folders sync")

        // Shown as ordinary notes, in their folders and counts.
        #expect(try listed(.folder(acmeFolder.id)) == ["Agenda"])
        #expect(try listed(.folder(agendaFolder.id)) == ["Minutes"])
        #expect(try listed(.folder(work.id)) == ["Acme"])
        #expect(try listed(.all) == ["Acme", "Agenda", "Minutes"])
        #expect(try listed(.trash) == ["Old plan"], "and the deleted one is in Recently Deleted")
        #expect(SidebarView.listedNotes(in: acmeFolder, context: ctx) == 1)
        #expect(SidebarView.counts(in: ctx) == (live: 3, trashed: 1))

        // Done once: the next launch or sync changes nothing.
        #expect(ctx.foldSubNotesIntoFolders() == 0)
        #expect(ctx.allFolders().filter { $0.name == "Acme" }.count == 1)
    }

    @Test func aFolderThatIsAlreadyThereIsUsedWhateverItsCase() throws {
        let work = ctx.createFolder(named: "Work")
        let there = ctx.createFolder(named: "acme", parent: work)
        let acme = ctx.createNote(in: .folder(work.id), body: "Acme")
        let agenda = subNote("Agenda", under: acme)
        // A note under a note at the top level, and one whose parent is gone for good.
        let top = Note(body: "Inbox")
        ctx.insert(top)
        let loose = subNote("Loose", under: top)
        let gone = ctx.createNote(in: .folder(work.id), body: "Gone")
        let orphan = subNote("Orphan", under: gone)
        gone.deletedAt = .now
        try ctx.save()
        #expect(ctx.foldSubNotesIntoFolders() == 3)
        #expect(agenda.folder?.id == there.id && ctx.allFolders().filter { $0.name.lowercased() == "acme" }.count == 1)
        #expect(loose.folder?.name == "Inbox" && loose.folder?.parent == nil, "a top-level folder for a note at the top level")
        #expect(orphan.parentID == nil && orphan.folder?.id == work.id, "under a note that's gone: stays where it is")
    }

    // MARK: Every note action works on it

    @Test func aFormerSubNoteIsOpenedEditedMovedAndDeletedLikeAnyNote() throws {
        let work = ctx.createFolder(named: "Work"), home = ctx.createFolder(named: "Home")
        let acme = ctx.createNote(in: .folder(work.id), body: "Acme")
        let agenda = subNote("Agenda", under: acme)
        try ctx.save()
        ctx.foldSubNotesIntoFolders()
        let folder = try #require(agenda.folder)

        // Opened: the More menu is a note's, with nothing of sub-notes.
        let groups = NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: false, hasApp: false, appsEnabled: true, linkedFrom: true, phone: true, dev: false)
        #expect(groups == [[.pin, .lock, .makeApp], [.moveTo, .linkedFrom, .share, .history, .delete]])
        // Its own text is just its text: no card, nothing hidden.
        #expect(LineEmbed.find(in: acme.body).isEmpty, "the link to it in the other note is no card")

        agenda.body = "Agenda\n- [x] budget"
        agenda.touch()
        #expect(agenda.title == "Agenda")
        ctx.togglePin(agenda)
        #expect(agenda.isPinned)
        ctx.move(agenda, to: home)
        #expect(try listed(.folder(home.id)) == ["Agenda"] && (try listed(.folder(folder.id))).isEmpty)
        ctx.trash(agenda)
        #expect(try listed(.trash) == ["Agenda"] && acme.trashedAt == nil, "deleting it takes nothing else")
        ctx.restore(agenda)
        #expect(agenda.trashedAt == nil && agenda.folder?.id == home.id)
        // The note it was under goes alone too.
        ctx.trash(acme)
        #expect(agenda.trashedAt == nil)
        ctx.remove([agenda])
        ctx.remove([agenda])
        #expect(agenda.deletedAt != nil, "and it can be deleted for good from Recently Deleted")
    }

    // MARK: Files are unchanged

    /// A note's folder also holds its files ("Work/Acme/contract.pdf"). Folding its sub-notes into
    /// a folder of the same name leaves its files, the folder's own files and how they show alone.
    @Test func filesOfTheNoteAndOfTheFolderStayAsTheyAre() throws {
        let work = ctx.createFolder(named: "Work")
        let contract = Attachment(filename: "contract.pdf", contentType: "com.adobe.pdf", size: 10)
        let kept = Attachment(filename: "Paper.pdf", contentType: "com.adobe.pdf", size: 10)
        kept.folderID = work.id
        ctx.insert(contract); ctx.insert(kept)
        let acme = ctx.createNote(in: .folder(work.id), body: "Acme\n\n" + contract.markdown + "\n")
        let agenda = subNote("Agenda", under: acme)
        try ctx.save()
        let before = (acme.body, contract.folderID, kept.folderID, contract.filename, kept.filename)

        ctx.foldSubNotesIntoFolders()
        let folder = try #require(agenda.folder)
        #expect(acme.body == before.0)
        #expect(contract.folderID == before.1 && contract.folderID == nil, "the note's file stays the note's")
        #expect(kept.folderID == before.2 && ctx.files(in: work.id).map(\.filename) == ["Paper.pdf"], "the folder's file stays in its folder")
        #expect(ctx.files(in: folder.id).isEmpty, "nothing moves into the new folder")
        #expect(contract.filename == before.3 && kept.filename == before.4)
        // The note still shows its file as a card, and its link to the former sub-note as a link.
        let embeds = LineEmbed.find(in: acme.body)
        #expect(embeds.count == 1)
        if case .file(let id, let name)? = embeds.first?.kind { #expect(id == contract.id && name == "contract.pdf") } else { Issue.record("the file is a card") }
        #expect(NoteVault.blocker(for: acme) == .hasFiles, "a note with files still can't be locked")
        // Its file goes on its shared page; the former sub-note doesn't.
        let copy = try #require(SharePublisher.copy(of: acme.id, includeSubNotes: true, in: ctx))
        #expect(copy.files == [contract.id.uuidString.lowercased()] && copy.pages.isEmpty)
    }

    // MARK: Links and note apps keep working

    @Test func linksToAFormerSubNoteLeadToItInItsFolder() throws {
        let work = ctx.createFolder(named: "Work")
        let acme = ctx.createNote(in: .folder(work.id), body: "Acme")
        let agenda = subNote("Agenda\nWhat we cover", under: acme)
        let plan = ctx.createNote(in: .folder(work.id), body: "Plan\nSee [[Agenda]] and [[Agenda|the list]] and [[Agenda#Budget]].")
        try ctx.save()
        ctx.foldSubNotesIntoFolders()
        WikiDirectory.invalidate()

        // Tapping a wiki link, from a note in another folder, and the note link in the old parent.
        #expect(ctx.resolveWikiLink("Agenda", from: plan)?.id == agenda.id)
        #expect(WikiLinks.links(in: plan.body).map(\.target) == ["Agenda", "Agenda", "Agenda"])
        #expect(LinkPolicy.action(for: URL(string: "pane-note:\(agenda.id.uuidString.lowercased())")!) == .note(agenda.id))
        // Autocomplete offers it.
        #expect(WikiDirectory.suggestions("Agen", excluding: plan.id, in: ctx).contains("Agenda"))
        // "Linked from": both notes, the one it was under included.
        #expect(Set(ctx.backlinks(to: agenda).map(\.id)) == [plan.id, acme.id])
        // Renamed: the wiki links follow, and the note link still leads to it by its id.
        agenda.body = "Meeting agenda\nWhat we cover"
        agenda.touch()
        try ctx.save()
        #expect(ctx.retargetWikiLinks(to: agenda, renamedFrom: "Agenda") == 1)
        #expect(plan.body.contains("[[Meeting agenda]]") && !plan.body.contains("[[Agenda]]"))
        WikiDirectory.invalidate()
        #expect(ctx.resolveWikiLink("Meeting agenda", from: plan)?.id == agenda.id)
    }

    @Test func aFormerSubNoteThatIsAnAppKeepsItsApp() throws {
        let acme = ctx.createNote(in: .all, body: "Acme")
        let habits = subNote(Capture.habitNote(), under: acme)
        try ctx.save()
        let store = NotePageStore(file: nil)
        let page = NotePageStore.Page(html: "<p>Habits</p>", by: "Claude", at: .now)
        store[habits.id] = page
        ctx.foldSubNotesIntoFolders()
        #expect(store[habits.id] == page && NoteApps.page(habits.id, in: store, enabled: true) == page)
        #expect(NoteAppMark.has(habits, in: store, enabled: true), "its row says App, like any note's with an app")
        #expect(habits.folder?.name == "Acme")
        // The note it was under still shows it as its live widget: apps inside a note are kept.
        NoteWidgets.update(habits.id, html: page.html, enabled: true)
        defer { NoteWidgets.update(habits.id, html: nil) }
        let embeds = LineEmbed.find(in: acme.body)
        #expect(embeds.count == 1)
        if case .note(let id, _)? = embeds.first?.kind { #expect(id == habits.id) } else { Issue.record("the app is a widget in the note") }
        // A link to a note that isn't an app is a link, not a card.
        let plain = ctx.createNote(in: .all, body: "Plain")
        #expect(LineEmbed.find(in: "Acme\n" + link(plain) + "\n").isEmpty)
    }

    // MARK: Nothing makes one

    /// No way to make a sub-note is left in either app: no menu item, shortcut, button, drop or
    /// function. Read from the app's own code (copied into the test bundle, as OldNameTests does).
    @Test func noCodePathMakesASubNote() throws {
        let gone = ["createSubNote", "newSubNote", "New Sub-note", "\"Sub-note\"", "SubNoteDropTarget", "SubNoteChip",
                    "NoteDrop.nest", "func nest(", "moveOut", "Move Out of Note", "Include Sub-notes", "setIncludesSubNotes", "SubNoteIndex", "isNested"]
        var found: [String] = []
        var files = 0
        for folder in OldNameTests.folders {
            for case let url as URL in FileManager.default.enumerator(at: try TestFiles.url(folder), includingPropertiesForKeys: nil)! where url.pathExtension == "swift" {
                files += 1
                let text = try String(contentsOf: url, encoding: .utf8)
                for g in gone where text.contains(g) { found.append("\(url.lastPathComponent): \(g)") }
            }
        }
        #expect(files > 100, "the app's code is in the test bundle")
        #expect(found.isEmpty, "\(found.joined(separator: "\n"))")
        // A link to a note on a line of its own is a link, not a sub-note's card.
        #expect(LineEmbed.find(in: "Trip\n[Hotel](pane-note:\(UUID().uuidString.lowercased()))\n").isEmpty)
    }
}
