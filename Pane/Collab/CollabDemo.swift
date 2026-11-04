import Foundation

/// What the screenshot gallery (CollabGallery) and the two-device check (CollabScript, Amber Notes
/// Beta only) share with the app: two sample notes, and the notifications that open and close the
/// open note's Share sheet or popover as its Share button does. The scripted demo against the old
/// local relay, and the invitation alert for email invites, are gone (email invites are parked).
@MainActor
enum CollabDemo {
    static let closeShare = Notification.Name("pane.collabDemoCloseShare")
    static let showShare = Notification.Name("pane.collabDemoShowShare")

    static let offsite = """
    Team offsite, 14 November

    ## Agenda
    - 09:00 Coffee and goals for Q1
    - 10:30 Roadmap review
    - 12:30 Lunch at Tranan

    ## Bring
    - [ ] Laptop and charger
    - [ ] Printed customer quotes
    """

    /// Fourteen days of habits ending today, as on the note-pages branch (Capture.habitNote).
    static func habitNote(today: Date = .now) -> String {
        let marks = ["✓✓·✓", "✓✓✓✓", "·✓✓·", "✓✓✓✓", "✓·✓✓", "✓✓✓·", "··✓✓", "✓✓✓✓", "✓✓·✓", "✓✓✓✓", "✓·✓✓", "✓✓✓✓", "✓✓✓·", "✓✓✓✓", "✓···"]
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        let rows = marks.enumerated().map { i, m in
            let d = Calendar.current.date(byAdding: .day, value: i - (marks.count - 1), to: today)!
            return "| \(f.string(from: d)) | " + m.map { $0 == "✓" ? "✓" : " " }.joined(separator: " | ") + " |"
        }
        return "Habit tracker\n\nSmall things, most days. A ✓ means done.\n\n| Date | Walk | Read | Stretch | No phone in bed |\n| --- | --- | --- | --- | --- |\n"
            + rows.joined(separator: "\n") + "\n"
    }
}
