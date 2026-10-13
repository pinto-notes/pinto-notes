#if os(macOS)
import AppKit

/// A press on a list row that moves a point or two before it lifts is a click, as in every Mac
/// list. A row that can be dragged (`.draggable`, a note or a folder) took the press as a drag the
/// moment the pointer moved at all, which it does under a hand: the drag ended where it began and
/// the click selected nothing. In a recording of 1.2.4 (2026-10-11), 9 of 13 clicks on notes did
/// nothing, and it read as the app being slow.
///
/// Here the pointer's first few points of travel during a press on a row are kept from the row:
/// it sees a press that stays put, then a lift, and selects. Past `distance` the moves go through
/// and the drag starts, from where the pointer then is.
@MainActor
enum RowPressSlop {
    /// How far the pointer may travel during a press and still click, in points.
    static let distance: CGFloat = 4

    private static var monitor: Any?
    /// Where the press now held began, when it began on a row and hasn't become a drag.
    private static var origin: NSPoint?

    /// Starts watching the app's own mouse events, once.
    static func start() {
        guard monitor == nil else { return }
        monitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .leftMouseDragged, .leftMouseUp]) { event in
            let through = MainActor.assumeIsolated {
                let pressed = event.type == .leftMouseDown ? row(under: event) : nil
                // A plain press on a note selects it now (PressSelect), before the list sees it.
                if let pressed { PressSelect.press(event, on: pressed.table, row: pressed.row) }
                let through = passes(event.type, at: event.locationInWindow, onRow: pressed != nil)
                if event.type == .leftMouseUp { PressSelect.lifted() }
                if event.type == .leftMouseDragged, through { PressSelect.dragged() }
                return through
            }
            return through ? event : nil
        }
    }

    /// Whether the row gets this event. `onRow`: a press that lands on a list row.
    static func passes(_ type: NSEvent.EventType, at point: NSPoint, onRow: Bool = false) -> Bool {
        switch type {
        case .leftMouseDown:
            origin = onRow ? point : nil
        case .leftMouseDragged:
            guard let from = origin else { return true }
            if hypot(point.x - from.x, point.y - from.y) < distance { return false }
            origin = nil
        case .leftMouseUp:
            origin = nil
        default:
            break
        }
        return true
    }

    /// The row of a list in its window the press is over, if any. Asked of the lists themselves, by
    /// where their rows are: the view under the pointer isn't always inside the list (a row near
    /// the bottom of the note list sits under the window's bottom bar, and is still what's pressed).
    private static func row(under event: NSEvent) -> (table: NSTableView, row: Int)? {
        guard let window = event.window, let content = window.contentView else { return nil }
        func found(in view: NSView) -> (table: NSTableView, row: Int)? {
            if let table = view as? NSTableView {
                let p = table.convert(event.locationInWindow, from: nil)
                let row = table.row(at: p)
                return table.visibleRect.contains(p) && row >= 0 ? (table, row) : nil
            }
            for sub in view.subviews where !sub.isHidden {
                if let hit = found(in: sub) { return hit }
            }
            return nil
        }
        return found(in: content)
    }
}
#endif
