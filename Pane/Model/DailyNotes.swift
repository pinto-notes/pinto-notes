import Foundation
import SwiftData
import SwiftUI

/// Today's note, at Obsidian's core level: nothing to set up.
///
/// Today's note is a normal note in a normal folder named "Daily", made the first time it's asked
/// for each day. Its title is the date, written out in the person's language ("30 October 2026"),
/// and that's all it starts with. It's found again by the day it was made and its folder, never
/// by its title alone: renamed, it is still today's note, and asking again doesn't make a second one.
enum DailyNotes {
    static let folderName = "Daily"

    /// Today's date as a note can be named by it: ISO, as Obsidian names daily notes, and long form.
    static func todaysTitles(_ now: Date, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> [String] {
        let d = calendar.dateComponents([.year, .month, .day], from: now)
        let iso = String(format: "%04d-%02d-%02d", d.year ?? 0, d.month ?? 0, d.day ?? 0)
        return [iso, title(for: now, locale: locale, calendar: calendar)]
    }

    /// Whether a title is a date, the way daily notes are named: 2026-10-30, or 30 October 2026.
    static func isDateTitle(_ t: String, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> Bool {
        if t.wholeMatch(of: /\d{4}-\d{2}-\d{2}/) != nil { return true }
        var style = Date.FormatStyle(date: .long, time: .omitted, locale: locale, calendar: calendar)
        style.timeZone = calendar.timeZone
        return (try? style.parse(t)) != nil
    }

    /// The title of the note for `day`: the date, long form, in the person's language.
    static func title(for day: Date, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> String {
        var style = Date.FormatStyle(date: .long, time: .omitted, locale: locale, calendar: calendar)
        style.timeZone = calendar.timeZone
        return day.formatted(style)
    }

    /// Whether `a` and `b` name the same folder: "daily" is "Daily".
    static func same(_ a: String, _ b: String) -> Bool { a.compare(b, options: [.caseInsensitive, .diacriticInsensitive]) == .orderedSame }
}

@MainActor
extension ModelContext {
    /// The folder with this name: one at the top first, else the one nearest the top (an
    /// Obsidian vault imported as a folder keeps its Daily inside it).
    func namedFolder(_ name: String) -> Folder? {
        func depth(_ f: Folder) -> Int { var d = 0, p = f.parent; while let q = p { d += 1; p = q.parent }; return d }
        return allFolders().filter { DailyNotes.same($0.name, name) }
            .min { (depth($0), $0.sortIndex, $0.createdAt) < (depth($1), $1.sortIndex, $1.createdAt) }
    }

    /// Today's note, if it was made: the first note made today in the Daily folder.
    ///
    /// Notes brought from Obsidian are named by their date ("2026-10-30") and were made on another
    /// day: one titled with today's date, ISO or long form, is today's note too, in Daily or in
    /// an imported folder whose notes are all named by dates.
    func todaysNote(now: Date = .now, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> Note? {
        let daily = namedFolder(DailyNotes.folderName)
        if let made = daily?.liveNotes.filter({ calendar.isDate($0.createdAt, inSameDayAs: now) }).min(by: { $0.createdAt < $1.createdAt }) { return made }
        let titles = DailyNotes.todaysTitles(now, locale: locale, calendar: calendar)
        let iso = titles[0], long = titles[1]
        let byTitle = #Predicate<Note> { $0.summaryTitle == iso || $0.summaryTitle == long }
        let fetched: [Note] = (try? fetch(FetchDescriptor<Note>(predicate: byTitle))) ?? []
        let named = fetched.filter { $0.trashedAt == nil && $0.deletedAt == nil && !$0.isLocked && titles.contains($0.title) }
            .sorted { $0.createdAt < $1.createdAt }
        if let daily, let inDaily = named.first(where: { $0.folder?.id == daily.id }) { return inDaily }
        return named.first { note in
            guard let folder = note.folder else { return false }
            return folder.liveNotes.allSatisfy { DailyNotes.isDateTitle($0.title, locale: locale, calendar: calendar) }
        }
    }

    /// Today's note, made now if it wasn't yet: in the Daily folder (made too, the first time),
    /// with the date as its title. `made` says which.
    func openTodaysNote(now: Date = .now, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> (note: Note, made: Bool) {
        if let note = todaysNote(now: now, locale: locale, calendar: calendar) { return (note, false) }
        // New notes in All Notes go to the first folder: that stays Notes, not Daily.
        _ = defaultFolder()
        let daily = namedFolder(DailyNotes.folderName) ?? createFolder(named: DailyNotes.folderName)
        let title = DailyNotes.title(for: now, locale: locale, calendar: calendar)
        let made = Note(body: title + "\n", folder: daily)
        made.createdAt = now
        made.updatedAt = now
        insert(made)
        saveOrReport()
        return (made, true)
    }
}

/// Today's Note in the notes window it's chosen in: the calendar button and the compose button's
/// menu read it from the environment, File › Today's Note from the window in front.
struct TodaysNoteAction {
    var open: () -> Void
}

private struct TodaysNoteFocusKey: FocusedValueKey {
    typealias Value = TodaysNoteAction
}

extension EnvironmentValues {
    @Entry var todaysNote: TodaysNoteAction? = nil
}

extension FocusedValues {
    var todaysNote: TodaysNoteAction? {
        get { self[TodaysNoteFocusKey.self] }
        set { self[TodaysNoteFocusKey.self] = newValue }
    }
}
