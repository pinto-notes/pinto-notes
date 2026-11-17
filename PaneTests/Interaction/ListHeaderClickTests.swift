#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The notes list's header band (the folder's name, its count, and the bar's frosted band where
/// scrolled rows pass under it) takes no part in the list: a click there selected the note
/// scrolled under it (Emil, 12 November 2026, Mac 1.3.2: "clicking up here should not make you
/// click on the note behind it"). The window hands such a press to the bar, but the app's own
/// press watcher (RowPressSlop) finds rows by position, and the list runs on under the bar, so it
/// selected the row there. Clicks go to this test's own offscreen window through the app's own
/// event queue; no global events.
@MainActor @Suite(.serialized) struct ListHeaderClickTests {
    @MainActor struct Band {
        let rig: NoteOpenClickTests.Rig
        let scroll: NSScrollView
        let frame: NSView

        init(_ rig: NoteOpenClickTests.Rig) throws {
            self.rig = rig
            scroll = try #require(rig.list.enclosingScrollView)
            frame = try #require(rig.window.contentView?.superview)
        }

        /// A point in the band over the list, `fx` across the list's column (left of More and New
        /// Note) and `dy` down from the window's top, in window coordinates.
        func point(fx: CGFloat, dy: CGFloat) -> NSPoint {
            let column = scroll.convert(scroll.bounds, to: nil)
            let left = column.minX + scroll.contentInsets.left
            let right = column.maxX - NoteListView.islandRoom
            return NSPoint(x: left + (right - left) * fx, y: frame.bounds.maxY - dy)
        }

        /// The band's depth: the list's top inset, under the bar.
        var depth: CGFloat { scroll.contentInsets.top }

        func post(_ type: NSEvent.EventType, at p: NSPoint) {
            NSApp.postEvent(NSEvent.mouseEvent(with: type, location: p, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                               windowNumber: rig.window.windowNumber, context: nil, eventNumber: 0, clickCount: 1,
                                               pressure: type == .leftMouseDown ? 1 : 0)!, atStart: false)
        }

        func click(_ p: NSPoint) {
            post(.leftMouseDown, at: p)
            post(.leftMouseUp, at: p)
        }

        /// The row of the list at `p`, -1 for none.
        func row(at p: NSPoint) -> Int { rig.list.row(at: rig.list.convert(p, from: nil)) }

        /// The list scrolled so its first note sits 44 pt up under the bar (its top 8 pt from the
        /// window's top).
        func scrollUnder() async {
            rig.scrollList(toRow: rig.rows[0], below: -44)
            await MacWindowChromeTests.settle(rig.window, 2)
        }

        /// The list at its top: nothing under the band.
        func scrollToTop() async {
            let clip = scroll.contentView
            clip.scroll(to: NSPoint(x: clip.bounds.minX, y: -scroll.contentInsets.top))
            scroll.reflectScrolledClipView(clip)
            await MacWindowChromeTests.settle(rig.window, 2)
        }
    }

    static let spots: [(fx: CGFloat, dy: CGFloat)] = [(0.05, 20), (0.1, 30), (0.4, 12), (0.5, 40), (0.9, 26), (0.3, 48)]

    /// A press in the band over a scrolled row is no press on that row: the window hands it to
    /// the bar, and the app's press watcher (RowPressSlop, which finds rows by position) finds no
    /// row there. A click leaves the open note and the selection as they were, scrolled or at rest.
    @Test func aClickInTheBandReachesNoNote() async throws {
        let (rig, _, done) = try await NoteOpenClickTests.rig()
        defer { done() }
        let band = try Band(rig)
        // The window opens on Note 15, the list scrolled to it: Note 3 first, from the list's top.
        await band.scrollToTop()
        rig.click(row: rig.rows[3])
        try #require(await rig.opens("Note 3", settle: true), "Note 3 opens first: \(rig.open)")
        var misses: [String] = []
        for scrolled in [true, false] {
            for (fx, dy) in Self.spots {
                if scrolled { await band.scrollUnder() } else { await band.scrollToTop() }
                let p = band.point(fx: fx, dy: dy)
                if scrolled {
                    try #require(band.row(at: p) >= 0, "a row under the band at \(p)")
                    let hit = band.frame.hitTest(p)
                    #expect(hit.map { !$0.isDescendant(of: rig.list) } ?? true, "the band at (\(fx), \(dy)) hit \(String(describing: hit)) in the list")
                    let press = try #require(NSEvent.mouseEvent(with: .leftMouseDown, location: p, modifierFlags: [], timestamp: 0, windowNumber: rig.window.windowNumber,
                                                                context: nil, eventNumber: 0, clickCount: 1, pressure: 1))
                    #expect(RowPressSlop.row(under: press) == nil, "a press at (\(fx), \(dy)) found row \(String(describing: RowPressSlop.row(under: press)?.row))")
                }
                let open = rig.open, selected = rig.list.selectedRowIndexes
                band.click(p)
                if await rig.opens(open, settle: true), rig.list.selectedRowIndexes == selected { continue }
                misses.append("\(scrolled ? "scrolled" : "at rest") (\(fx), \(dy)): \(open) open before, \(rig.open) after, selection \(Array(selected)) to \(Array(rig.list.selectedRowIndexes))")
            }
        }
        #expect(misses.isEmpty, "clicks in the band: \(misses)")
        // Under the band, a click on the row itself still opens it.
        await band.scrollUnder()
        let row = rig.rows[1]
        rig.click(row: row, fx: 0.5, fy: 0.5)
        #expect(await rig.opens("Note 1"), "a row below the band still opens: \(rig.open)")
    }

    /// The scroll wheel over the band still scrolls the list, as in Notes: the list under the band
    /// still takes the wheel, only presses are refused there.
    @Test func theWheelOverTheBandScrollsTheList() async throws {
        let (rig, _, done) = try await NoteOpenClickTests.rig()
        defer { done() }
        let band = try Band(rig)
        await band.scrollUnder()
        let before = band.scroll.contentView.bounds.minY
        let p = band.point(fx: 0.5, dy: 30)
        let target = try #require(band.scroll.hitTest(band.scroll.superview!.convert(p, from: nil)), "something under the band")
        let cg = try #require(CGEvent(scrollWheelEvent2Source: nil, units: .pixel, wheelCount: 1, wheel1: 60, wheel2: 0, wheel3: 0))
        let wheel = try #require(NSEvent(cgEvent: cg))
        target.scrollWheel(with: wheel)
        await MacWindowChromeTests.settle(rig.window, 3)
        #expect(band.scroll.contentView.bounds.minY < before - 1, "the list scrolled up: \(before) to \(band.scroll.contentView.bounds.minY)")
    }
}
#endif
