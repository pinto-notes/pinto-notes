import Foundation
import SwiftData
import Testing
@testable import Pane

/// Today's note (DailyNotes): one note a day in Daily, titled with the date and nothing else,
/// found again after a rename, and an imported note named by today's date (ISO or long form) is it.
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
        #expect(first.note.body == "30 October 2026\n", "just the title, and the cursor under it")
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

    /// Obsidian names daily notes 2026-10-30; imported, they were made on other days.
    @Test func anImportedNoteNamedByTodaysDateIsTodaysNote() throws {
        let daily = context.createFolder(named: "Daily")
        let old = context.createNote(in: .folder(daily.id), body: "2026-10-30\n\nFrom Obsidian")
        old.createdAt = morning.addingTimeInterval(-40 * 86400)
        let yesterday = context.createNote(in: .folder(daily.id), body: "2026-10-29\n")
        yesterday.createdAt = morning.addingTimeInterval(-86400)
        try context.save()
        let found = today(morning)
        #expect(!found.made && found.note.id == old.id, "ISO title in Daily")
        // The long form too.
        old.body = "30 October 2026\nrenamed by hand"
        try context.save()
        #expect(today(morning).note.id == old.id)
    }

    @Test func aDateNamedNoteInAnImportedJournalFolderCounts() throws {
        let journal = context.createFolder(named: "Journal")
        let a = context.createNote(in: .folder(journal.id), body: "2026-10-28\n")
        let b = context.createNote(in: .folder(journal.id), body: "2026-10-30\n")
        for n in [a, b] { n.createdAt = morning.addingTimeInterval(-90 * 86400) }
        // A note named by today's date among notes that aren't dates isn't today's note.
        let work = context.createFolder(named: "Work")
        let stray = context.createNote(in: .folder(work.id), body: "2026-10-30\n")
        context.createNote(in: .folder(work.id), body: "Q4 plan\n")
        stray.createdAt = morning.addingTimeInterval(-86400)
        try context.save()
        let found = today(morning)
        #expect(!found.made && found.note.id == b.id)
        #expect(DailyNotes.isDateTitle("30 October 2026", locale: locale, calendar: calendar))
        #expect(!DailyNotes.isDateTitle("Q4 plan", locale: locale, calendar: calendar))
        // Without it, a new note in Daily, titled the long way.
        context.trash(b)
        try context.save()
        let made = today(morning)
        #expect(made.made && made.note.title == "30 October 2026" && made.note.folder?.name == "Daily")
    }

    @Test func aDailyFolderAlreadyThereIsUsed() {
        // An imported Obsidian vault keeps its folders inside one; a lower-case one counts too.
        let vault = context.createFolder(named: "Vault")
        let daily = context.createFolder(named: "daily", parent: vault)
        let note = today(morning).note
        #expect(note.folder?.id == daily.id)
        #expect(context.allFolders().count == 2, "no second Daily")
    }

    // MARK: Settings › General › Today's note

    @Test func theTitleCanBeWrittenThreeWays() {
        #expect(DailyNotes.title(for: morning, as: .long, locale: locale, calendar: calendar) == "30 October 2026")
        #expect(DailyNotes.title(for: morning, as: .iso, locale: locale, calendar: calendar) == "2026-10-30")
        #expect(DailyNotes.title(for: morning, as: .weekday, locale: locale, calendar: calendar) == "Friday 30 October")
        for form in TodaysNoteSettings.Title.allCases {
            #expect(DailyNotes.isDateTitle(DailyNotes.title(for: morning, as: form, locale: locale, calendar: calendar), locale: locale, calendar: calendar), "\(form) reads as a date")
        }
    }

    @Test func todaysNoteGoesInTheChosenFolderWithTheChosenTitle() throws {
        var settings = TodaysNoteSettings()
        settings.folder = "Journal"
        settings.title = .iso
        let first = context.openTodaysNote(now: morning, locale: locale, calendar: calendar, settings: settings)
        #expect(first.made && first.note.folder?.name == "Journal" && first.note.title == "2026-10-30")
        let again = context.openTodaysNote(now: morning.addingTimeInterval(3600), locale: locale, calendar: calendar, settings: settings)
        #expect(!again.made && again.note.id == first.note.id, "found again in its folder, not made twice")
        #expect(context.namedFolder("Daily") == nil, "no Daily made")
    }

    @Test func aNewDayStartsFromTheTemplateWithTheDateAndTimeFilledIn() throws {
        let templates = context.createFolder(named: "Templates")
        let template = context.createNote(in: .folder(templates.id), body: "Daily template\n## Plan for {{date}}\n- [ ] \n\nStarted {{time}}, {{date:YYYY-MM-DD}}")
        var settings = TodaysNoteSettings()
        settings.template = template.id
        let day = context.openTodaysNote(now: morning, locale: locale, calendar: calendar, settings: settings).note
        #expect(day.body == "30 October 2026\n## Plan for 30 October 2026\n- [ ] \n\nStarted 09:41, 2026-10-30", "the template's title line left out, the rest filled in")
        #expect(day.title == "30 October 2026")
        // A template deleted since: the day starts with its date alone.
        template.deletedAt = .now
        let tomorrow = morning.addingTimeInterval(86400)
        #expect(context.openTodaysNote(now: tomorrow, locale: locale, calendar: calendar, settings: settings).note.body == "31 October 2026\n")
    }

    @Test func obsidianDateFormatsFillIn() {
        #expect(DailyNotes.momentToICU("YYYY-MM-DD") == "yyyy-MM-dd")
        #expect(DailyNotes.momentToICU("dddd, D MMMM") == "EEEE, d MMMM")
        #expect(DailyNotes.fill("{{date:ddd D MMM}} {{ title }}", title: "T", now: morning, locale: locale, calendar: calendar) == "Fri 30 Oct T")
        #expect(DailyNotes.fill("[[{{date:YYYY-MM-DD}}]] at {{time:HH:mm}}", title: "T", now: morning, locale: locale, calendar: calendar) == "[[2026-10-30]] at 09:41")
        #expect(DailyNotes.fill("no tags", title: "T", now: morning, locale: locale, calendar: calendar) == "no tags")
    }

    @Test func settingsAreReadFromThisDevice() {
        let d = MemoryDefaults()
        #expect(TodaysNoteSettings.load(d) == TodaysNoteSettings(), "Daily, the long date, no template, not on launch")
        let id = UUID()
        d.set("Journal", forKey: TodaysNoteSettings.folderKey)
        d.set("weekday", forKey: TodaysNoteSettings.titleKey)
        d.set(id.uuidString, forKey: TodaysNoteSettings.templateKey)
        d.set(true, forKey: TodaysNoteSettings.launchKey)
        #expect(TodaysNoteSettings.load(d) == TodaysNoteSettings(folder: "Journal", title: .weekday, template: id, openOnLaunch: true))
        d.set("  ", forKey: TodaysNoteSettings.folderKey)
        #expect(TodaysNoteSettings.load(d).folder == "Daily", "a blank folder name falls back to Daily")
    }

    @Test func openOnLaunchOpensTodaysNoteOnceALaunch() {
        let launch = TodaysNoteLaunch()
        #expect(!launch.take(TodaysNoteSettings()), "off: the note you were on reopens")
        var on = TodaysNoteSettings()
        on.openOnLaunch = true
        #expect(launch.take(on), "the first window opens on today's note")
        #expect(!launch.take(on), "a second window opens as usual")
    }

    @Test func settingsOffersYourFoldersAndTemplates() throws {
        _ = context.createFolder(named: "Notes")
        let choices = GeneralChoices(context: context)
        #expect(choices.folders(keeping: "Daily") == ["Daily", "Notes"], "Daily offered before it's made")
        let a = context.createNote(in: .all, body: "Groceries\n- milk")
        let b = context.createNote(in: .all, body: "Weekly review\nWins")
        #expect(Set(choices.templates(keeping: "").map(\.id)) == [a.id, b.id], "no Templates folder: your latest notes")
        let templates = context.createFolder(named: "Templates")
        let t = context.createNote(in: .folder(templates.id), body: "Daily template\n{{date}}")
        #expect(choices.templates(keeping: "").map(\.title) == ["Daily template"], "a Templates folder: its notes")
        #expect(choices.templates(keeping: a.id.uuidString).map(\.id) == [a.id, t.id], "the chosen one stays listed")
    }
}
