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
        return [iso, title(for: now, locale: locale, calendar: calendar), weekdayFormatter(locale: locale, calendar: calendar).string(from: now)]
    }

    /// Whether a title is a date, the way daily notes are named: 2026-10-30, or 30 October 2026.
    static func isDateTitle(_ t: String, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> Bool {
        if t.wholeMatch(of: /\d{4}-\d{2}-\d{2}/) != nil { return true }
        if weekdayFormatter(locale: locale, calendar: calendar).date(from: t) != nil { return true }
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

    /// The title of the note for `day` in the chosen form: "7 November 2026", "2026-11-07" or
    /// "Saturday, 7 November", in the person's language.
    static func title(for day: Date, as form: TodaysNoteSettings.Title, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> String {
        switch form {
        case .long: return title(for: day, locale: locale, calendar: calendar)
        case .iso: return todaysTitles(day, locale: locale, calendar: calendar)[0]
        case .weekday: return weekdayFormatter(locale: locale, calendar: calendar).string(from: day)
        }
    }

    /// "Saturday, 7 November" in the person's language (no year, as Notes' and Obsidian's).
    static func weekdayFormatter(locale: Locale, calendar: Calendar) -> DateFormatter {
        let f = DateFormatter()
        f.locale = locale
        f.calendar = calendar
        f.timeZone = calendar.timeZone
        f.setLocalizedDateFormatFromTemplate("EEEEdMMMM")
        return f
    }

    /// A new today's note: the date as its title, then the template's text (without the
    /// template's own title line) with {{date}}, {{time}} and {{title}} filled in.
    static func body(title: String, template: String?, now: Date, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> String {
        guard let template else { return title + "\n" }
        var lines = template.components(separatedBy: "\n")
        // The template's first line is its own title ("Daily template"), not part of the day.
        if let first = lines.firstIndex(where: { !$0.trimmingCharacters(in: .whitespaces).isEmpty }) { lines.removeSubrange(...first) }
        let rest = fill(lines.joined(separator: "\n"), title: title, now: now, locale: locale, calendar: calendar)
        let trimmed = rest.drop { $0 == "\n" }
        return trimmed.isEmpty ? title + "\n" : title + "\n" + trimmed
    }

    /// {{date}} is the day as its title is written, {{time}} the time ("14:05"), {{title}} the
    /// note's title, and Obsidian's {{date:YYYY-MM-DD}} or {{time:HH:mm}} in that form.
    static func fill(_ text: String, title: String, now: Date, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current) -> String {
        func formatted(_ moment: String) -> String {
            let f = DateFormatter()
            f.locale = locale
            f.calendar = calendar
            f.timeZone = calendar.timeZone
            f.dateFormat = momentToICU(moment)
            return f.string(from: now)
        }
        // The time as the person's clock shows it, hours padded as Obsidian's HH:mm: "09:41".
        let time = DateFormatter()
        time.locale = locale
        time.calendar = calendar
        time.timeZone = calendar.timeZone
        time.setLocalizedDateFormatFromTemplate("jjmm")
        var out = text
        out = out.replacing(/\{\{\s*(date|time):([^}]+)\}\}/) { formatted(String($0.output.2)) }
        out = out.replacing(/\{\{\s*date\s*\}\}/) { _ in title }
        out = out.replacing(/\{\{\s*time\s*\}\}/) { _ in time.string(from: now) }
        out = out.replacing(/\{\{\s*title\s*\}\}/) { _ in title }
        return out
    }

    /// Obsidian's (Moment.js) date tokens in Apple's date format: YYYY-MM-DD is yyyy-MM-dd.
    static func momentToICU(_ m: String) -> String {
        var out = "", i = m.startIndex
        let tokens: [(String, String)] = [("YYYY", "yyyy"), ("YY", "yy"), ("dddd", "EEEE"), ("ddd", "EEE"), ("Do", "d"),
                                          ("DD", "dd"), ("D", "d"), ("A", "a"), ("a", "a")]
        while i < m.endIndex {
            if m[i] == "[" , let close = m[i...].firstIndex(of: "]") {
                // [literal] text.
                let lit = m[m.index(after: i)..<close].replacingOccurrences(of: "'", with: "''")
                out += "'\(lit)'"
                i = m.index(after: close)
                continue
            }
            if let (from, to) = tokens.first(where: { m[i...].hasPrefix($0.0) }) {
                out += to
                i = m.index(i, offsetBy: from.count)
                continue
            }
            let c = m[i]
            // MMMM, MM, HH, mm, ss mean the same in both.
            out += c.isLetter && !"MHhmsE".contains(c) ? "'\(c)'" : String(c)
            i = m.index(after: i)
        }
        return out
    }

    /// Whether `a` and `b` name the same folder: "daily" is "Daily".
    static func same(_ a: String, _ b: String) -> Bool { a.compare(b, options: [.caseInsensitive, .diacriticInsensitive]) == .orderedSame }
}

/// Today's note as set in Settings › General, on this device: its folder, how its title is
/// written, the note it starts from, and whether Pinto opens on it.
struct TodaysNoteSettings: Equatable {
    enum Title: String, CaseIterable, Identifiable, Sendable {
        case long, iso, weekday
        var id: String { rawValue }
    }

    var folder = DailyNotes.folderName
    var title = Title.long
    /// The note new days start from; nil starts with the date alone.
    var template: UUID?
    var openOnLaunch = false

    static let folderKey = "today.folder", titleKey = "today.title", templateKey = "today.template", launchKey = "today.openOnLaunch"

    /// Unit tests never read or write the person's own settings.
    @MainActor static var store: UserDefaults = PaneApp.isUnitTestHost ? MemoryDefaults() : .standard

    @MainActor static func load(_ d: UserDefaults = store) -> TodaysNoteSettings {
        var s = TodaysNoteSettings()
        if let f = d.string(forKey: folderKey), !f.trimmingCharacters(in: .whitespaces).isEmpty { s.folder = f }
        s.title = d.string(forKey: titleKey).flatMap(Title.init) ?? .long
        s.template = d.string(forKey: templateKey).flatMap(UUID.init)
        s.openOnLaunch = d.bool(forKey: launchKey)
        return s
    }
}

/// Open it when Pinto starts: once a launch, in the first window that restores a note.
@MainActor
final class TodaysNoteLaunch {
    static let shared = TodaysNoteLaunch()
    private var taken = false

    /// Whether this window opens on today's note: the setting is on and no window has yet.
    func take(_ settings: TodaysNoteSettings) -> Bool {
        guard settings.openOnLaunch, !taken else { return false }
        taken = true
        return true
    }
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
    func todaysNote(now: Date = .now, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current, settings: TodaysNoteSettings = .load()) -> Note? {
        let daily = namedFolder(settings.folder)
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

    /// Today's note, made now if it wasn't yet: in its folder (Daily unless Settings says other;
    /// made too, the first time), with the date as its title and the template's text under it.
    /// `made` says which.
    func openTodaysNote(now: Date = .now, locale: Locale = .autoupdatingCurrent, calendar: Calendar = .current, settings: TodaysNoteSettings = .load()) -> (note: Note, made: Bool) {
        if let note = todaysNote(now: now, locale: locale, calendar: calendar, settings: settings) { return (note, false) }
        // New notes in All Notes go to the first folder: that stays Notes, not Daily.
        _ = defaultFolder()
        let daily = namedFolder(settings.folder) ?? createFolder(named: settings.folder)
        let title = DailyNotes.title(for: now, as: settings.title, locale: locale, calendar: calendar)
        let template = settings.template.flatMap { note($0) }.flatMap { $0.deletedAt == nil && !$0.isLocked ? $0.body : nil }
        let made = Note(body: DailyNotes.body(title: title, template: template, now: now, locale: locale, calendar: calendar), folder: daily)
        made.createdAt = now
        made.updatedAt = now
        insert(made)
        saveOrReport()
        return (made, true)
    }
}

/// Today's Note in the notes window it's chosen in: the calendar button and the compose button's
/// menu read it from the environment, File › Today's Note from the window in front.
/// Equal whatever its closure, as ImportActions: one made on an earlier pass opens the same note.
struct TodaysNoteAction: Equatable {
    var open: () -> Void
    static func == (a: TodaysNoteAction, b: TodaysNoteAction) -> Bool { true }
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
