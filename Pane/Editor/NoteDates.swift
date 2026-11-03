import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

extension NSAttributedString.Key {
    /// A date in the text, drawn as a chip by `DecoratedLayoutFragment` (value: `DateChip`).
    static let paneDate = NSAttributedString.Key("pane.date")
}

/// Dates in a note. The note keeps a plain ISO date (`2026-11-03`), so sync, Markdown export and
/// the AI tools see a normal date; the editor shows it as a chip that says Today, Tomorrow, a
/// weekday or "3 Nov" (Emil, 3 November 2026: "it would say Today, if its today").
enum NoteDates {
    struct Found: Equatable {
        var range: NSRange
        var year: Int, month: Int, day: Int
    }

    /// `2026-11-03` on its own: not inside a longer number, word, path or timestamp.
    private static let regex = try! NSRegularExpression(pattern: #"(?<![\w\-/.:])(\d{4})-(\d{2})-(\d{2})(?![\w\-/:]|\.\d)"#)

    static func dates(in text: String, range: NSRange? = nil) -> [Found] {
        let ns = text as NSString
        let scope = range ?? NSRange(location: 0, length: ns.length)
        guard ns.length > 0, scope.length >= 10 else { return [] }
        return regex.matches(in: text, range: scope).compactMap { m in
            guard let y = Int(ns.substring(with: m.range(at: 1))), let mo = Int(ns.substring(with: m.range(at: 2))),
                  let d = Int(ns.substring(with: m.range(at: 3))), valid(y, mo, d) else { return nil }
            return Found(range: m.range, year: y, month: mo, day: d)
        }
    }

    /// A real day (no 2026-02-30), in a sensible span of years.
    static func valid(_ y: Int, _ m: Int, _ d: Int) -> Bool {
        guard (1900...2200).contains(y), (1...12).contains(m), d >= 1 else { return false }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        guard let date = cal.date(from: DateComponents(year: y, month: m, day: 1)),
              let days = cal.range(of: .day, in: .month, for: date) else { return false }
        return days.contains(d)
    }

    /// The day as a date at its start, in `calendar`'s time zone.
    static func date(_ f: Found, calendar: Calendar = .current) -> Date? {
        calendar.date(from: DateComponents(year: f.year, month: f.month, day: f.day))
    }

    /// What the note stores for a day.
    static func text(for date: Date, calendar: Calendar = .current) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    enum Tone: Equatable { case today, past, future }

    /// Days from today to the date, by calendar day (so 23:59 to 00:01 is one day).
    static func days(to f: Found, now: Date = .now, calendar: Calendar = .current) -> Int? {
        guard let d = date(f, calendar: calendar) else { return nil }
        return calendar.dateComponents([.day], from: calendar.startOfDay(for: now), to: calendar.startOfDay(for: d)).day
    }

    /// Today, Tomorrow, Yesterday; a weekday in the coming week; else "3 Nov", with the year when
    /// it isn't this year.
    static func label(for f: Found, now: Date = .now, calendar: Calendar = .current, locale: Locale = .current) -> String {
        guard let d = date(f, calendar: calendar), let n = days(to: f, now: now, calendar: calendar) else {
            return String(format: "%04d-%02d-%02d", f.year, f.month, f.day)
        }
        switch n {
        case 0: return "Today"
        case 1: return "Tomorrow"
        case -1: return "Yesterday"
        default: break
        }
        let fmt = DateFormatter()
        fmt.calendar = calendar
        fmt.timeZone = calendar.timeZone
        fmt.locale = locale
        if (2...6).contains(n) {
            fmt.setLocalizedDateFormatFromTemplate("EEEE")
        } else if calendar.component(.year, from: d) == calendar.component(.year, from: now) {
            fmt.setLocalizedDateFormatFromTemplate("dMMM")
        } else {
            fmt.setLocalizedDateFormatFromTemplate("dMMMy")
        }
        return fmt.string(from: d)
    }

    static func tone(for f: Found, now: Date = .now, calendar: Calendar = .current) -> Tone {
        guard let n = days(to: f, now: now, calendar: calendar) else { return .future }
        return n == 0 ? .today : n < 0 ? .past : .future
    }

    /// Whether the selection is inside a date, so it shows as written to be edited. A caret at
    /// either edge leaves the chip.
    static func editing(_ r: NSRange, selection: NSRange) -> Bool {
        guard selection.location != NSNotFound else { return false }
        if selection.length == 0 { return selection.location > r.location && selection.location < NSMaxRange(r) }
        return NSIntersectionRange(r, selection).length > 0
    }

    /// Today's date at the caret (Format › Date). A space keeps the next word apart.
    static func insertToday(in text: String, selection: NSRange, now: Date = .now, calendar: Calendar = .current) -> TextEdit {
        let ns = text as NSString
        let day = Self.text(for: now, calendar: calendar)
        let end = NSMaxRange(selection)
        let before = selection.location > 0 ? ns.character(at: selection.location - 1) : 0x0A
        let after = end < ns.length ? ns.character(at: end) : 0x0A
        func space(_ c: unichar) -> Bool { c == 0x20 || c == 0x0A || c == 0x09 }
        let lead = space(before) ? "" : " "
        let trail = after == 0x20 ? "" : " "
        let body = lead + day + trail
        return TextEdit(range: selection, replacement: body, caret: selection.location + (body as NSString).length + (after == 0x20 ? 1 : 0))
    }

    /// Backspace right after a chip (or Delete right before one) takes the whole date, like an
    /// attachment, rather than one hidden digit.
    /// `isChip`: whether the date shows as a chip (not in code, a link or the title).
    static func delete(in text: String, selection: NSRange, forward: Bool, isChip: (NSRange) -> Bool = { _ in true }) -> TextEdit? {
        guard selection.length == 0 else { return nil }
        let ns = text as NSString
        let line = ns.lineRange(for: NSRange(location: min(selection.location, ns.length), length: 0))
        for f in dates(in: text, range: line) {
            let hit = forward ? f.range.location == selection.location : NSMaxRange(f.range) == selection.location
            if hit, isChip(f.range) { return TextEdit(range: f.range, replacement: "", caret: f.range.location) }
        }
        return nil
    }

    /// The date whose chip covers `index`, if any.
    static func date(at index: Int, in text: String) -> Found? {
        let ns = text as NSString
        guard index >= 0, index <= ns.length else { return nil }
        let line = ns.lineRange(for: NSRange(location: min(index, ns.length), length: 0))
        return dates(in: text, range: line).first { NSLocationInRange(index, $0.range) }
    }
}

/// How a date chip looks: its label, tone and the text size it stands in for.
final class DateChip: NSObject {
    let label: String
    let tone: NoteDates.Tone
    let fontSize: CGFloat
    let weight: PFont.Weight

    init(label: String, tone: NoteDates.Tone, fontSize: CGFloat, weight: PFont.Weight = .regular) {
        self.label = label
        self.tone = tone
        self.fontSize = fontSize
        self.weight = weight
    }

    /// Room either side of the label inside the chip, and outside it before the next letter.
    static let padding: CGFloat = 6
    static let gap: CGFloat = 2

    var font: PFont { .systemFont(ofSize: fontSize * 0.94, weight: tone == .today ? .semibold : (weight == .regular ? .medium : weight)) }

    var labelWidth: CGFloat { ceil((label as NSString).size(withAttributes: [.font: font]).width) }
    /// The chip's drawn width.
    var chipWidth: CGFloat { labelWidth + Self.padding * 2 }
    /// The room the hidden date takes in the line: the chip and a little air after it.
    var width: CGFloat { chipWidth + Self.gap * 2 }

    var fill: PColor {
        switch tone {
        case .today: PColor.paneAccent.withAlphaComponent(0.16)
        case .past, .future: PColor.paneFill
        }
    }

    var ink: PColor {
        switch tone {
        case .today: PColor.paneAccent
        case .future: PColor.paneLabel
        case .past: PColor.paneSecondary
        }
    }

    override func isEqual(_ object: Any?) -> Bool {
        guard let o = object as? DateChip else { return false }
        return o.label == label && o.tone == tone && o.fontSize == fontSize && o.weight == weight
    }
    override var hash: Int { label.hashValue ^ fontSize.hashValue }
}

#if os(macOS)
/// The calendar a date chip opens on the Mac, like the one in Calendar and Reminders.
final class DatePickerPopover: NSViewController {
    private let day: Date
    private let picked: (Date) -> Void
    private(set) var picker: NSDatePicker!

    init(day: Date, picked: @escaping (Date) -> Void) {
        self.day = day
        self.picked = picked
        super.init(nibName: nil, bundle: nil)
    }
    required init?(coder: NSCoder) { fatalError() }

    override func loadView() {
        let p = NSDatePicker()
        p.datePickerStyle = .clockAndCalendar
        p.datePickerElements = .yearMonthDay
        p.datePickerMode = .single
        p.isBordered = false
        p.drawsBackground = false
        p.dateValue = day
        p.target = self
        p.action = #selector(changed)
        p.setAccessibilityIdentifier("editor.datePicker")
        p.sizeToFit()
        picker = p
        let v = NSView(frame: NSRect(x: 0, y: 0, width: p.frame.width + 16, height: p.frame.height + 16))
        p.frame.origin = NSPoint(x: 8, y: 8)
        v.addSubview(p)
        view = v
    }

    @objc private func changed() { picked(picker.dateValue) }
}
#endif
