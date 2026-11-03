#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Date chips at rest, with the caret inside one, and the calendar a click opens, drawn from a
/// window that is never shown (far off screen, never ordered in) straight into PNGs.
/// `TEST_RUNNER_PANE_DATE_SHOTS=/path scripts/qa-test.sh PaneTests/DateChipShots`
@MainActor @Suite(.serialized) struct DateChipShots {
    static func day(_ n: Int) -> String {
        NoteDates.text(for: Calendar.current.date(byAdding: .day, value: n, to: .now)!)
    }

    static var note: String {
        """
        Week plan

        Dentist \(day(0)) at ten, then lunch with Sara.

        - [ ] Send the invoice \(day(1))
        - [ ] Book flights to Lisbon \(day(3))
        - [ ] Renew passport \(day(16))
        - [x] Pay rent \(day(-1))

        **Deadline \(day(0))**

        Next year's trip: \(day(400))
        """
    }

    @Test func states() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_DATE_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            let c = try AppSnapshotTests.container()
            let n = c.mainContext.createNote(in: .all, body: Self.note)
            n.updatedAt = .now.addingTimeInterval(600)
            try c.mainContext.save()
            try await AppSnapshotTests.withLastNote(c, "Week plan") {
                let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 1000))
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                let tv = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
                w.makeFirstResponder(nil)
                await MacWindowChromeTests.settle(w, 6)
                try CodeBlockShots.render(tv, dark: dark).write(to: dir.appending(path: "dates-rest-\(dark ? "dark" : "light").png"))
                guard !dark else { return }
                // The caret inside the first date: it shows as written, to edit by hand.
                let r = (tv.string as NSString).range(of: Self.day(0))
                tv.setSelectedRange(NSRange(location: r.location + 4, length: 0))
                w.makeFirstResponder(tv)
                await MacWindowChromeTests.settle(w, 6)
                try CodeBlockShots.render(tv, dark: false).write(to: dir.appending(path: "dates-editing-light.png"))
                // Format › Date at the end of a line: today's date goes in as a chip.
                let line = (tv.string as NSString).range(of: "then lunch with Sara.")
                tv.setSelectedRange(NSRange(location: NSMaxRange(line), length: 0))
                tv.controller?.insertDate()
                tv.setSelectedRange(NSRange(location: 0, length: 0))
                w.makeFirstResponder(nil)
                await MacWindowChromeTests.settle(w, 6)
                try CodeBlockShots.render(tv, dark: false).write(to: dir.appending(path: "dates-inserted-light.png"))
            }
        }
        // The calendar a click on a chip opens.
        for dark in [false, true] {
            let pop = DatePickerPopover(day: Calendar.current.date(byAdding: .day, value: 3, to: .now)!) { _ in }
            let v = pop.view
            v.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            v.layoutSubtreeIfNeeded()
            let rep = try #require(v.bitmapImageRepForCachingDisplay(in: v.bounds))
            v.appearance!.performAsCurrentDrawingAppearance {
                v.cacheDisplay(in: v.bounds, to: rep)
            }
            try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "dates-picker-\(dark ? "dark" : "light").png"))
        }
    }
}
#endif
