import Foundation
import SwiftData
import Testing
@testable import Pane

/// Today's note and templates (DailyNotes): one note a day in Daily, found again after a rename,
/// made from the Daily template; templates are the notes in Templates, with {{date}}, {{time}}
/// and {{title}} filled in, and the menus list them.
@MainActor @Suite struct DailyNotesTests {
    let context: ModelContext
    let calendar: Calendar
    let locale = Locale(identifier: "en_GB")
    /// 30 October 2026, 9:41 in Stockholm.
    let morning: Date

    init() throws {
        context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "Europe/Stockholm")!
        calendar = c
        morning = c.date(from: DateComponents(year: 2026, month: 10, day: 30, hour: 9, minute: 41))!
    }

    private func today(_ at: Date) -> (note: Note, made: Bool) {
        context.openTodaysNote(now: at, locale: locale, calendar: calendar)
    }

    @Test func theTitleIsTheLongDateInThePersonsLanguage() {
        #expect(DailyNotes.title(for: morning, locale: locale, calendar: calendar) == "30 October 2026")
        #expect(DailyNotes.title(for: morning, locale: Locale(identifier: "en_US"), calendar: calendar) == "October 30, 2026")
        #expect(DailyNotes.title(for: morning, locale: Locale(identifier: "sv_SE"), calendar: calendar) == "30 oktober 2026")
    }

    @Test func todaysNoteIsMadeOnceADayInDaily() throws {
        _ = context.createFolder(named: "Notes")
        let first = today(morning)
        #expect(first.made)
        #expect(first.note.folder?.name == "Daily")
        #expect(first.note.folder?.parent == nil, "a normal folder at the top")
        #expect(first.note.title == "30 October 2026")
        #expect(first.note.body == "30 October 2026\n", "the title, and the cursor under it")
        // Later the same day: the same note, no second Daily folder.
        let again = today(morning.addingTimeInterval(8 * 3600))
        #expect(!again.made && again.note.id == first.note.id)
        #expect(context.allFolders().filter { $0.name == "Daily" }.count == 1)
        // New notes in All Notes still go to Notes, not Daily.
        #expect(context.defaultFolder().name == "Notes")
        // Tomorrow: a new one, in the same folder.
        let tomorrow = today(calendar.date(byAdding: .day, value: 1, to: morning)!)
        #expect(tomorrow.made && tomorrow.note.id != first.note.id)
        #expect(tomorrow.note.title == "31 October 2026" && tomorrow.note.folder?.id == first.note.folder?.id)
    }

    @Test func aRenamedTodaysNoteIsStillTodaysNote() {
        let first = today(morning).note
        first.body = "Friday, slow start\n\n- [ ] Call Anna"
        first.touch()
        let again = today(morning.addingTimeInterval(3600))
        #expect(!again.made && again.note.id == first.id, "found by its day and folder, not its title")
        // A note dated today elsewhere isn't it; one moved out of Daily isn't either.
        context.move(first, to: context.createFolder(named: "Work"))
        let moved = today(morning.addingTimeInterval(7200))
        #expect(moved.made && moved.note.id != first.id)
        // Deleted: made again.
        context.trash(moved.note)
        #expect(today(morning.addingTimeInterval(7300)).made)
    }

    @Test func aDailyFolderAlreadyThereIsUsed() {
        // An imported Obsidian vault keeps its folders inside one; a lower-case one counts too.
        let vault = context.createFolder(named: "Vault")
        let daily = context.createFolder(named: "daily", parent: vault)
        let note = today(morning).note
        #expect(note.folder?.id == daily.id)
        #expect(context.allFolders().count == 2, "no second Daily")
    }

    /// The time as the person's clock writes it ("09:41", or "9:41 AM").
    var clock: String { DailyNotes.time(morning, locale: locale, calendar: calendar) }

    @Test func theDailyTemplateIsUsed() {
        let templates = context.createFolder(named: "Templates")
        context.createNote(in: .folder(templates.id), body: "Daily\n\n## Plan\n- [ ] \n\n## Notes\nStarted {{time}} on {{date}}.")
        let note = today(morning).note
        #expect(note.body == "30 October 2026\n\n## Plan\n- [ ] \n\n## Notes\nStarted \(clock) on 30 October 2026.")
        #expect(note.folder?.name == "Daily")
        // A heading keeps its #, and a first line with words of its own fills them in.
        #expect(DailyNotes.fill("# Daily\nbody", title: "30 October 2026") == "# 30 October 2026\nbody")
        #expect(DailyNotes.fill("{{title}} journal\n{{date}}", title: "Today", now: morning, locale: locale, calendar: calendar) == "Today journal\n30 October 2026")
        #expect(DailyNotes.fill("", title: "Today") == "Today\n")
    }

    @Test func templateWordsAreFilledIn() {
        #expect(clock.contains("41"))
        let filled = DailyNotes.fill("Meeting {{date}}\nAt {{time}}\n{{title}}|{{unknown}}", title: nil, now: morning, locale: locale, calendar: calendar)
        #expect(filled == "Meeting 30 October 2026\nAt \(clock)\n|{{unknown}}", "three words, nothing else")
        // A first line of {{title}} is left empty for the title.
        #expect(DailyNotes.fill("{{title}}\nAttendees:\n- ", title: nil) == "\nAttendees:\n- ")
    }

    @Test func newFromTemplateIsInTheFolderYoureIn() throws {
        let work = context.createFolder(named: "Work")
        let templates = context.createFolder(named: "Templates")
        let meeting = context.createNote(in: .folder(templates.id), body: "Meeting notes\n\nDate: {{date}}\n- ")
        let made = try #require(context.createNote(fromTemplate: meeting.id, in: .folder(work.id), now: morning, locale: locale, calendar: calendar))
        #expect(made.folder?.id == work.id)
        #expect(made.body == "Meeting notes\n\nDate: 30 October 2026\n- ")
        #expect(meeting.body == "Meeting notes\n\nDate: {{date}}\n- ", "the template stays as it was")
        // All Notes: the first folder, as New Note.
        let anywhere = try #require(context.createNote(fromTemplate: meeting.id, in: .all))
        #expect(anywhere.folder?.id == context.defaultFolder().id)
        // A template that's gone makes nothing.
        context.trash(meeting)
        #expect(context.createNote(fromTemplate: meeting.id, in: .all) == nil)
    }

    @Test func templatesAreTheNotesInTemplates() {
        #expect(context.noteTemplates().isEmpty)
        // New Template… makes the folder the first time, then uses it.
        let first = context.createTemplate()
        #expect(first.folder?.name == "Templates" && first.folder?.parent == nil)
        first.body = "Weekly review\n- "
        let second = context.createTemplate()
        second.body = "{{title}}\nAttendees:"
        let locked = context.createTemplate()
        locked.body = "Secret"
        locked.lockedBody = "sealed"
        context.createNote(in: .folder(context.createFolder(named: "Work").id), body: "Not a template")
        try? context.save()
        #expect(context.allFolders().filter { $0.name == "Templates" }.count == 1)
        // By name; one that starts with {{title}} goes by the line under it.
        #expect(context.noteTemplates().map(\.name) == ["Attendees:", "Weekly review"])
        #expect(DailyNotes.name(of: "{{title}}") == "Untitled Template")
    }

    /// The compose button's menu and File › New from Template list them, kept by TemplateShelf.
    @Test func theMenusListTheTemplates() throws {
        let shelf = TemplateShelf()
        shelf.start(context)
        #expect(shelf.templates.isEmpty)
        let t = context.createTemplate()
        t.body = "Meeting\n- "
        try context.save()
        #expect(shelf.templates.map(\.name) == ["Meeting"], "read again after the save")
        t.body = "Standup\n- "
        try context.save()
        #expect(shelf.templates == [TemplateItem(id: t.id, name: "Standup")])
        context.trash(t)
        try context.save()
        #expect(shelf.templates.isEmpty)
    }
}
