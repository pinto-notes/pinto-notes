import Foundation
import Testing
#if os(iOS)
import UIKit
#else
import AppKit
#endif
@testable import Pane

/// Dates in notes: stored as `2026-11-03`, shown as a chip that says Today, Tomorrow, a weekday
/// or "3 Nov" (Emil, 3 November 2026).
@Suite struct NoteDatesTests {
    static var calendar: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "Europe/Stockholm")!
        return c
    }
    static let locale = Locale(identifier: "en_GB")
    /// Tuesday 3 November 2026, 14:00 in Stockholm.
    static var now: Date { calendar.date(from: DateComponents(year: 2026, month: 11, day: 3, hour: 14))! }

    func label(_ text: String, now: Date = Self.now) -> String? {
        NoteDates.dates(in: text).first.map { NoteDates.label(for: $0, now: now, calendar: Self.calendar, locale: Self.locale) }
    }

    @Test func todayTomorrowYesterday() {
        #expect(label("2026-11-03") == "Today")
        #expect(label("2026-11-04") == "Tomorrow")
        #expect(label("2026-11-02") == "Yesterday")
    }

    @Test func theComingWeekByWeekday() {
        #expect(label("2026-11-05") == "Thursday")
        #expect(label("2026-11-09") == "Monday")
        // A week out it's a date again: "Tuesday" would read as today's weekday.
        #expect(label("2026-11-10") == "10 Nov")
        // Last week isn't a weekday: "Friday" reads as the coming one.
        #expect(label("2026-10-30") == "30 Oct")
    }

    @Test func anotherYearShowsTheYear() {
        #expect(label("2027-01-04") == "4 Jan 2027")
        #expect(label("2025-12-24") == "24 Dec 2025")
    }

    @Test func byCalendarDayAroundMidnight() {
        let late = Self.calendar.date(from: DateComponents(year: 2026, month: 11, day: 3, hour: 23, minute: 59))!
        let early = Self.calendar.date(from: DateComponents(year: 2026, month: 11, day: 4, hour: 0, minute: 1))!
        #expect(label("2026-11-04", now: late) == "Tomorrow")
        #expect(label("2026-11-04", now: early) == "Today")
        #expect(label("2026-11-03", now: early) == "Yesterday")
        // New Year's Eve: tomorrow is next year, still "Tomorrow".
        let nye = Self.calendar.date(from: DateComponents(year: 2026, month: 12, day: 31, hour: 22))!
        #expect(label("2027-01-01", now: nye) == "Tomorrow")
    }

    @Test func tones() {
        let f = { (s: String) in NoteDates.tone(for: NoteDates.dates(in: s)[0], now: Self.now, calendar: Self.calendar) }
        #expect(f("2026-11-03") == .today)
        #expect(f("2026-11-01") == .past)
        #expect(f("2026-11-20") == .future)
    }

    @Test func findsDatesInText() {
        let text = "Call Anna on 2026-11-05, then 2026-11-12."
        #expect(NoteDates.dates(in: text).map { "\($0.year)/\($0.month)/\($0.day)" } == ["2026/11/5", "2026/11/12"])
        let found = NoteDates.dates(in: text)[0]
        #expect((text as NSString).substring(with: found.range) == "2026-11-05")
    }

    @Test func leavesOtherNumbersAlone() {
        for s in ["12026-11-03", "2026-11-033", "2026-13-01", "2026-02-30", "v2026-11-03", "2026-11-03T10:00",
                  "notes/2026-11-03.md", "https://x.com/2026-11-03", "1.2026-11-03", "2026-11-03-2", "build-2026-11-03"] {
            #expect(NoteDates.dates(in: s).isEmpty, "\(s)")
        }
        // A leap day is a real day.
        #expect(NoteDates.dates(in: "2028-02-29").count == 1)
        // At a sentence's end, in brackets, after a colon and space.
        #expect(NoteDates.dates(in: "Due 2026-11-03.").count == 1)
        #expect(NoteDates.dates(in: "(2026-11-03)").count == 1)
        #expect(NoteDates.dates(in: "Due: 2026-11-03").count == 1)
    }

    @Test func insertTodayAtTheCaret() {
        func run(_ text: String, _ at: Int) -> (String, Int) {
            let e = NoteDates.insertToday(in: text, selection: NSRange(location: at, length: 0), now: Self.now, calendar: Self.calendar)
            return ((text as NSString).replacingCharacters(in: e.range, with: e.replacement), e.caret)
        }
        #expect(run("", 0) == ("2026-11-03 ", 11))
        #expect(run("Due ", 4) == ("Due 2026-11-03 ", 15))
        // No space before it: one goes in.
        #expect(run("Due", 3) == ("Due 2026-11-03 ", 15))
        // A space after it already: the caret goes past it, no second space.
        #expect(run("Due  call", 4) == ("Due 2026-11-03 call", 15))
    }

    @Test func backspaceTakesTheWholeDate() {
        let text = "Due 2026-11-03 call"
        let after = NoteDates.delete(in: text, selection: NSRange(location: 14, length: 0), forward: false)
        #expect(after == TextEdit(range: NSRange(location: 4, length: 10), replacement: "", caret: 4))
        let before = NoteDates.delete(in: text, selection: NSRange(location: 4, length: 0), forward: true)
        #expect(before == TextEdit(range: NSRange(location: 4, length: 10), replacement: "", caret: 4))
        // Inside it, or not a chip (in code), it's an ordinary backspace.
        #expect(NoteDates.delete(in: text, selection: NSRange(location: 10, length: 0), forward: false) == nil)
        #expect(NoteDates.delete(in: text, selection: NSRange(location: 14, length: 0), forward: false, isChip: { _ in false }) == nil)
    }

    @Test func showsAsWrittenOnlyWithTheCaretInside() {
        let r = NSRange(location: 4, length: 10)
        #expect(!NoteDates.editing(r, selection: NSRange(location: 4, length: 0)))
        #expect(!NoteDates.editing(r, selection: NSRange(location: 14, length: 0)))
        #expect(NoteDates.editing(r, selection: NSRange(location: 8, length: 0)))
        #expect(NoteDates.editing(r, selection: NSRange(location: 0, length: 6)))
        #expect(!NoteDates.editing(r, selection: NSRange(location: NSNotFound, length: 0)))
    }

    @MainActor @Test func stylerDrawsAChipInTheDatesPlace() {
        var styler = MarkdownStyler()
        styler.dateNow = { Self.now }
        let text = "Plan\n\nDentist 2026-11-03 at ten\n\n`2026-11-03` stays code"
        let storage = NSTextStorage(string: text)
        _ = styler.apply(to: storage, active: NSRange(location: NSNotFound, length: 0))
        let ns = text as NSString
        let date = ns.range(of: "2026-11-03")
        let chip = storage.attribute(.paneDate, at: date.location, effectiveRange: nil) as? DateChip
        #expect(chip?.tone == .today)
        #expect(chip?.label == "Today")
        // The digits are kept, hidden, and take the chip's room.
        #expect(storage.string == text)
        #expect((storage.attribute(.foregroundColor, at: date.location, effectiveRange: nil) as? PColor) == PColor.clear)
        // Inline code stays as written.
        let code = ns.range(of: "2026-11-03", range: NSRange(location: NSMaxRange(date), length: ns.length - NSMaxRange(date)))
        #expect(storage.attribute(.paneDate, at: code.location, effectiveRange: nil) == nil)

        // The caret inside the date: it shows as written, in the accent.
        _ = styler.apply(to: storage, active: NSRange(location: date.location + 3, length: 0))
        #expect(storage.attribute(.paneDate, at: date.location, effectiveRange: nil) == nil)
        #expect((storage.attribute(.foregroundColor, at: date.location, effectiveRange: nil) as? PColor) == PColor.paneAccent)
    }

    @MainActor @Test func aTickedItemsLineStopsAtTheChip() {
        var styler = MarkdownStyler()
        styler.dateNow = { Self.now }
        let text = "Plan\n\n- [x] Pay rent 2026-11-02"
        let storage = NSTextStorage(string: text)
        _ = styler.apply(to: storage, active: NSRange(location: NSNotFound, length: 0))
        let ns = text as NSString
        #expect(storage.attribute(.strikethroughStyle, at: ns.range(of: "rent").location, effectiveRange: nil) != nil)
        let date = ns.range(of: "2026-11-02")
        #expect(storage.attribute(.paneDate, at: date.location, effectiveRange: nil) != nil)
        #expect(storage.attribute(.strikethroughStyle, at: date.location, effectiveRange: nil) == nil)
    }

    /// A table's dates are the grid's to draw: no chip on its hidden markdown, which showed one
    /// under the table (persona council 11-04, a Notion reading list with a Finished column).
    @MainActor @Test func aTablesDatesHaveNoChip() {
        var styler = MarkdownStyler()
        styler.dateNow = { Self.now }
        let text = "Reading list\n\n<!-- pane-table: Name=text; Finished=date -->\n| Name | Finished |\n| --- | --- |\n| Dune | 2026-09-12 |\n| Piranesi | 2026-10-03 |\n\nNext: 2026-11-03"
        let storage = NSTextStorage(string: text)
        let shown = styler.apply(to: storage, active: NSRange(location: NSNotFound, length: 0))
        #expect(shown.grids.count == 1)
        let ns = text as NSString
        for date in ["2026-09-12", "2026-10-03"] {
            #expect(storage.attribute(.paneDate, at: ns.range(of: date).location, effectiveRange: nil) == nil, "\(date) is in the table")
        }
        #expect(storage.attribute(.paneDate, at: ns.range(of: "2026-11-03").location, effectiveRange: nil) != nil, "a date after the table is still a chip")
    }

    @MainActor @Test func aDateTitleStaysTheTitle() {
        var styler = MarkdownStyler()
        styler.dateNow = { Self.now }
        let storage = NSTextStorage(string: "2026-11-03\n\nNotes for the day")
        _ = styler.apply(to: storage, active: NSRange(location: NSNotFound, length: 0))
        #expect(storage.attribute(.paneDate, at: 0, effectiveRange: nil) == nil)
    }
}
