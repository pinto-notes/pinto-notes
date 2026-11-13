#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// A press on a list row that moves a little is a click: the row never hears of the first few
/// points of travel (2026-10-11: 9 of 13 clicks on notes selected nothing in 1.2.4).
@MainActor @Suite(.serialized) struct RowPressSlopTests {
    /// With Go to Note over the list, a press on the panel never reaches the row beneath it.
    @Test func aDragsSwallowedLiftIsHandedBack() throws {
        #expect(!RowPressSlop.liftIsLost(releasedTicks: 0) && !RowPressSlop.liftIsLost(releasedTicks: 1), "a real lift may still be queued")
        #expect(RowPressSlop.liftIsLost(releasedTicks: 2))
        let drag = try #require(NSEvent.mouseEvent(with: .leftMouseDragged, location: NSPoint(x: 30, y: 40), modifierFlags: [], timestamp: 0,
                                                   windowNumber: 7, context: nil, eventNumber: 3, clickCount: 1, pressure: 1))
        let up = try #require(RowPressSlop.lift(after: drag))
        #expect(up.type == .leftMouseUp && up.locationInWindow == drag.locationInWindow && up.windowNumber == 7)
    }

    /// A dragged note's chip sits on the pointer, wherever on the row the press began (Emil,
    /// 13 November 2026: grabbed at the row's right end, it trailed far off to the left). As a
    /// session begins, AppKit reads its items' frames from the pointer: zero is the pointer.
    @Test func aDragRidesOnThePointer() throws {
        #expect(DragUnderPointer.centered(NSRect(x: 0, y: 0, width: 200, height: 30), on: NSPoint(x: 400, y: 50))
                == NSRect(x: 300, y: 35, width: 200, height: 30))
        // SwiftUI's item is the row's width, the chip drawn at its left: the chip is what's centred.
        let row = NSDraggingItem(pasteboardWriter: "row" as NSString)
        row.setDraggingFrame(NSRect(x: -261, y: 1077, width: 272, height: 65), contents: nil)
        let drawn = NSDraggingImageComponent(key: .icon)
        drawn.frame = NSRect(x: 71.25, y: 18.5, width: 129.5, height: 28)
        row.imageComponentsProvider = { [drawn] }
        DragUnderPointer.center(row)
        let part = try #require(row.imageComponents?.first)
        let shown = part.frame.offsetBy(dx: row.draggingFrame.minX, dy: row.draggingFrame.minY)
        #expect(abs(shown.midX) < 0.01 && abs(shown.midY) < 0.01, "the chip's middle on the pointer: \(shown)")
        #expect(shown.size == NSSize(width: 129.5, height: 28))
        // An item that draws nothing yet keeps its size, centred.
        let plain = NSDraggingItem(pasteboardWriter: "plain" as NSString)
        plain.draggingFrame = NSRect(x: 40, y: 40, width: 160, height: 30)
        DragUnderPointer.center(plain)
        #expect(plain.draggingFrame == NSRect(x: -80, y: -15, width: 160, height: 30))
        // SwiftUI's drags move; a text view's drag doesn't.
        #expect(!DragUnderPointer.moves(from: NSTextView()) && !DragUnderPointer.moves(from: nil))
        #expect(DragUnderPointer.moves(from: NSHostingView(rootView: Text("row"))))
        // Installed, every session that begins goes through it.
        DragUnderPointer.install()
        let begin = try #require(class_getInstanceMethod(NSDraggingSession.self, NSSelectorFromString("setStartLocation:")))
        let ours = try #require(class_getInstanceMethod(NSDraggingSession.self, #selector(NSDraggingSession.pinto_setStartLocation(_:))))
        #expect(method_getImplementation(begin) != method_getImplementation(ours))
    }

    @Test func aPressUnderGoToNoteIsntOnARow() {
        final class Rows: NSTableView { override func row(at point: NSPoint) -> Int { 0 } }
        let table = Rows(frame: CGRect(x: 0, y: 0, width: 200, height: 100))
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 200, height: 100), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentView = table
        w.orderFrontRegardless()
        defer { w.close(); RowPressSlop.covered = false }
        let press = NSEvent.mouseEvent(with: .leftMouseDown, location: NSPoint(x: 50, y: 90), modifierFlags: [], timestamp: 0,
                                       windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1)!
        #expect(RowPressSlop.row(under: press)?.row != nil, "over the row with nothing on top")
        RowPressSlop.covered = true
        #expect(RowPressSlop.row(under: press) == nil)
        // Go to Note's own area only (Emil, 9 November 2026: the app stays usable beside it).
        RowPressSlop.covered = false
        defer { RowPressSlop.cover = nil }
        RowPressSlop.cover = (w.windowNumber, CGRect(x: 0, y: 0, width: 100, height: 40), 100)
        #expect(RowPressSlop.row(under: press) == nil, "under the panel: y 10 from the top")
        let beside = NSEvent.mouseEvent(with: .leftMouseDown, location: NSPoint(x: 150, y: 90), modifierFlags: [], timestamp: 0,
                                        windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1)!
        #expect(RowPressSlop.row(under: beside)?.row != nil, "beside the panel the row is pressed")
    }

    @Test func aPressThatMovesALittleStaysAClick() {
        let p = NSPoint(x: 300, y: 400)
        #expect(RowPressSlop.passes(.leftMouseDown, at: p, onRow: true))
        // The travel of a hand during a click: a point or three, any direction.
        for (dx, dy) in [(1.0, 0.0), (2.0, 1.0), (-2.0, -2.0), (3.0, 2.0), (0.0, -3.5)] {
            #expect(!RowPressSlop.passes(.leftMouseDragged, at: NSPoint(x: p.x + dx, y: p.y + dy)), "the row hears nothing of \(dx), \(dy)")
        }
        #expect(RowPressSlop.passes(.leftMouseUp, at: NSPoint(x: p.x + 2, y: p.y + 1)), "the lift always arrives")
    }

    @Test func pastTheDistanceItIsADragFromThereOn() {
        let p = NSPoint(x: 300, y: 400)
        _ = RowPressSlop.passes(.leftMouseDown, at: p, onRow: true)
        #expect(!RowPressSlop.passes(.leftMouseDragged, at: NSPoint(x: p.x + 3, y: p.y)))
        #expect(RowPressSlop.passes(.leftMouseDragged, at: NSPoint(x: p.x + RowPressSlop.distance, y: p.y)), "the drag starts")
        // Once it is a drag, coming back near the start doesn't stop it.
        #expect(RowPressSlop.passes(.leftMouseDragged, at: NSPoint(x: p.x + 1, y: p.y)))
        #expect(RowPressSlop.passes(.leftMouseUp, at: p))
    }

    @Test func pressesElsewhereAreLeftAlone() {
        let p = NSPoint(x: 800, y: 300)
        // In the editor, a toolbar, a sheet: every move goes through (selecting text starts at once).
        _ = RowPressSlop.passes(.leftMouseDown, at: p, onRow: false)
        #expect(RowPressSlop.passes(.leftMouseDragged, at: NSPoint(x: p.x + 1, y: p.y)))
        _ = RowPressSlop.passes(.leftMouseUp, at: p)
        // And a press on a row doesn't leak into the next one elsewhere.
        _ = RowPressSlop.passes(.leftMouseDown, at: p, onRow: true)
        _ = RowPressSlop.passes(.leftMouseUp, at: p)
        _ = RowPressSlop.passes(.leftMouseDown, at: p, onRow: false)
        #expect(RowPressSlop.passes(.leftMouseDragged, at: NSPoint(x: p.x + 1, y: p.y)))
    }
}
#endif
