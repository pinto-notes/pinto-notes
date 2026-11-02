#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Every click on a note in the list opens that note in the editor, wherever in the row it lands,
/// however fast the clicks come, and with the list scrolled (Emil, 11-02: "clicking a note
/// sometimes doesn't open it").
///
/// The cause: with the list scrolled, its date heading stayed pinned at the top, over the first
/// note on screen. The heading has no ground, so the note showed through it, and the heading took
/// every click on the upper part of that note. A launch that reopened a note further down the list
/// scrolled the list's top under the toolbar, so it happened from the first click.
///
/// The whole window (sidebar, list, note), never shown. Clicks go into the app's own event queue
/// for this window and are handled as a person's are (the list's recognizers, PressSelect). The
/// window says it is key, so they select instead of only bringing it forward; the app is never
/// activated, so this runs on any Mac without taking the keyboard from anyone.
@MainActor @Suite(.serialized) struct NoteOpenClickTests {
    /// A window that takes clicks as the key window would, without the app coming to the front.
    final class ClickWindow: NSWindow {
        override var canBecomeKey: Bool { true }
        override var canBecomeMain: Bool { true }
        override var isKeyWindow: Bool { true }
    }

    @MainActor struct Rig {
        let window: ClickWindow
        let list: NSTableView
        let notes: [Note]

        /// The note rows, in order (headings left out).
        var rows: [Int] { (0 ..< list.numberOfRows).filter { !list.isHeadingRow($0) } }

        /// The title of the note open in the editor.
        var open: String {
            let e = window.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) }
            return e.map { String($0.string.prefix { $0 != "\n" }) } ?? "no note"
        }

        /// Waits until `title` is open, up to 4 s (a busy Mac), and says whether it is. With
        /// `settle`, then waits until nothing else opens for 0.6 s, so a click that opens another
        /// note late is seen.
        func opens(_ title: String, settle: Bool = false) async -> Bool {
            let clock = ContinuousClock(), start = clock.now
            while clock.now - start < .seconds(4), open != title { try? await Task.sleep(for: .milliseconds(20)) }
            if settle {
                var last = open, since = clock.now
                while clock.now - since < .milliseconds(600), clock.now - start < .seconds(6) {
                    try? await Task.sleep(for: .milliseconds(20))
                    if open != last { last = open; since = clock.now }
                }
            }
            return open == title
        }

        /// A press and a lift at `fx`, `fy` of the row (0 to 1 across and down), queued for the window.
        func click(row: Int, fx: CGFloat = 0.5, fy: CGFloat = 0.5, clickCount: Int = 1) {
            let r = list.rect(ofRow: row)
            let p = list.convert(NSPoint(x: r.minX + r.width * fx, y: r.minY + r.height * fy), to: nil)
            for type in [NSEvent.EventType.leftMouseDown, .leftMouseUp] {
                NSApp.postEvent(NSEvent.mouseEvent(with: type, location: p, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                                   windowNumber: window.windowNumber, context: nil, eventNumber: 0, clickCount: clickCount,
                                                   pressure: type == .leftMouseDown ? 1 : 0)!, atStart: false)
            }
        }

        /// Scrolls the list so `row`'s top sits `below` points under the toolbar.
        func scrollList(toRow row: Int, below: CGFloat) {
            let scroll = list.enclosingScrollView!
            let clip = scroll.contentView
            clip.scroll(to: NSPoint(x: clip.bounds.origin.x, y: list.rect(ofRow: row).minY - scroll.contentInsets.top - below))
            scroll.reflectScrolledClipView(clip)
        }
    }

    /// 16 notes ("Note 0" newest) in date sections, the oldest one open, as a launch restores it.
    static func rig() async throws -> (Rig, ModelContainer, () -> Void) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let folder = ctx.createFolder(named: "Notes")
        var notes: [Note] = []
        for i in 0..<16 {
            // Long notes and short ones: a long one takes a moment to build.
            let lines = (0..<(i % 3 == 0 ? 300 : 4)).map { "- [ ] Item \($0) with **bold** and a [link](https://example.com)" }.joined(separator: "\n")
            let n = ctx.createNote(in: .folder(folder.id), body: "Note \(i)\n\n\(lines)")
            n.updatedAt = i < 8 ? .now.addingTimeInterval(-Double(i + 1) * 60) : .now.addingTimeInterval(-Double(i) * 86_400 / 3)
            notes.append(n)
        }
        try ctx.save()
        let d = UserDefaults.standard
        let keep = (d.object(forKey: "lastNote"), d.object(forKey: "lastScope"))
        let restore = {
            if let v = keep.0 { d.set(v, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let v = keep.1 { d.set(v, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        d.set(try JSONEncoder().encode(Scope.folder(folder.id)), forKey: "lastScope")
        d.set(notes[15].id.uuidString, forKey: "lastNote")
        let w = ClickWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1180, height: 760),
                            styleMask: [.titled, .closable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore()))
        w.setContentSize(CGSize(width: 1180, height: 760))
        await MacWindowChromeTests.settle(w, 15)
        let list = try MacEmptyDetailTests.list(w)
        let rig = Rig(window: w, list: list, notes: notes)
        try #require(rig.rows.count == 16, "16 note rows (rows: \(list.numberOfRows))")
        try #require(rig.open == "Note 15", "the window opens with Note 15 (open: \(rig.open))")
        return (rig, c, { w.close(); restore() })
    }

    /// Clicks spread over the rows (the far left, the top and bottom edges, the ••• corner), with
    /// the list at rest and scrolled so a date heading would sit over the top row.
    @Test func everyClickOpensItsNoteWhereverItLands() async throws {
        let (rig, _, done) = try await Self.rig()
        defer { done() }
        let scroll = try #require(rig.list.enclosingScrollView)
        // The reopened note's row is shown without pushing the list's top under the toolbar.
        #expect(scroll.contentView.bounds.origin.y >= -scroll.contentInsets.top - 0.5)

        let spots: [(CGFloat, CGFloat)] = [(0.03, 0.5), (0.5, 0.1), (0.5, 0.9), (0.97, 0.2), (0.3, 0.5), (0.8, 0.6)]
        var misses: [String] = []
        rig.scrollList(toRow: rig.rows[0], below: 60)
        await MacWindowChromeTests.settle(rig.window, 2)
        for (k, i) in [0, 3, 1, 6, 2, 7, 4, 5].enumerated() {
            let (fx, fy) = spots[k % spots.count]
            rig.click(row: rig.rows[i], fx: fx, fy: fy)
            if await !rig.opens("Note \(i)") { misses.append("Note \(i) at (\(fx), \(fy)) opened \(rig.open)") }
        }
        #expect(misses.isEmpty, "clicks with the list at its top: \(misses)")

        // Scrolled: the top note on screen, a few points under the toolbar.
        misses = []
        for i in [2, 5, 9, 12] {
            let row = rig.rows[i]
            for fy in [0.1, 0.4, 0.8] {
                rig.scrollList(toRow: row, below: 6)
                await MacWindowChromeTests.settle(rig.window, 2)
                rig.click(row: row, fx: 0.5, fy: fy)
                if await !rig.opens("Note \(i)") { misses.append("Note \(i), the top row, at \(fy) opened \(rig.open)") }
                // Another note in between, so each click is a change.
                rig.click(row: rig.rows[i + 2])
                _ = await rig.opens("Note \(i + 2)")
            }
        }
        #expect(misses.isEmpty, "the top note of a scrolled list: \(misses)")
    }

    /// Quick clicks, the next before the last note is built: the last one clicked is the one open.
    /// The system counts quick clicks as double and triple clicks, so they come both ways.
    @Test func fastClicksEndOnTheLastNoteClicked() async throws {
        let (rig, _, done) = try await Self.rig()
        defer { done() }
        rig.scrollList(toRow: rig.rows[0], below: 60)
        await MacWindowChromeTests.settle(rig.window, 2)
        for counted in [false, true] {
            for gap in [120, 40, 5, 0] {
                for (k, i) in [6, 0, 3, 1].enumerated() {
                    rig.click(row: rig.rows[i], fx: 0.4, fy: [0.2, 0.5, 0.8, 0.15][k], clickCount: counted ? k + 1 : 1)
                    if gap > 0 { try await Task.sleep(for: .milliseconds(gap)) }
                }
                let last = await rig.opens("Note 1", settle: true)
                #expect(last, "4 clicks \(gap) ms apart\(counted ? ", counted as 1 to 4 clicks" : ""): the last one's note is open (open: \(rig.open))")
                rig.click(row: rig.rows[7])
                #expect(await rig.opens("Note 7"))
            }
        }
    }
}
#endif
