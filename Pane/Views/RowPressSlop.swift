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
/// A note or a folder is being dragged out of a list: Recently Deleted shows even when empty.
@MainActor @Observable final class NoteDragging {
    static let shared = NoteDragging()
    private(set) var active = false
    private var ends = 0
    /// The drop lands after the lift, so the row outlasts it.
    static let linger: Duration = .milliseconds(900)

    func began() { ends += 1; if !active { active = true } }
    func ended() {
        ends += 1
        let this = ends
        Task { @MainActor in
            try? await Task.sleep(for: Self.linger)
            if ends == this { active = false }
        }
    }
}

@MainActor
enum RowPressSlop {
    /// How far the pointer may travel during a press and still click, in points.
    static let distance: CGFloat = 4

    /// Go to Note is open over the lists: a press on it isn't a press on the row beneath (round 17:
    /// clicking its field opened the note under the pointer). This asks the lists by position, so
    /// it doesn't know what lies on top of them; sheets are windows of their own and don't count.
    /// `covered` covers everything; `cover` only the panel's own frame (SwiftUI's global, in its
    /// window of that height), as presses beside it go to the lists (Emil, 9 November 2026: the
    /// app stays usable with it open).
    static var covered = false
    static var cover: (window: Int, frame: CGRect, height: CGFloat)?

    private static var monitor: Any?
    /// A ⌘ or ⇧ press PressSelect picked with: the list doesn't see it, nor its drag or lift.
    private static var picked = false
    /// The press now held began on a row.
    private static var pressedRow = false
    /// Where the press now held began, when it began on a row and hasn't become a drag.
    private static var origin: NSPoint?

    /// Starts watching the app's own mouse events, once.
    static func start() {
        guard monitor == nil else { return }
        monitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .leftMouseDragged, .leftMouseUp]) { event in
            let through = MainActor.assumeIsolated {
                if event.type == .leftMouseDown { PressSelect.pressBegan() }
                if picked, event.type != .leftMouseDown {
                    if event.type == .leftMouseUp { picked = false }
                    return false
                }
                picked = false
                let pressed = event.type == .leftMouseDown ? row(under: event) : nil
                // A ⌘ or ⇧ press on a note picks it now, and the list never sees the click.
                if let pressed, PressSelect.pick(event, on: pressed.table, row: pressed.row) {
                    picked = true
                    return false
                }
                // A plain press on a note selects it now (PressSelect), before the list sees it.
                if let pressed { PressSelect.press(event, on: pressed.table, row: pressed.row) }
                let through = passes(event.type, at: event.locationInWindow, onRow: pressed != nil)
                if event.type == .leftMouseUp { PressSelect.lifted() }
                if event.type == .leftMouseDown { pressedRow = pressed != nil }
                if event.type == .leftMouseDragged, through {
                    PressSelect.dragged()
                    watchForLostLift(event)
                    if pressedRow { NoteDragging.shared.began() }
                }
                if event.type == .leftMouseUp {
                    stopWatchingLift()
                    if pressedRow { NoteDragging.shared.ended() }
                    pressedRow = false
                }
                return through
            }
            return through ? event : nil
        }
    }

    // MARK: The lift a drag swallows

    private static var liftWatch: Timer?
    private static var lastDrag: NSEvent?
    private static var releasedTicks = 0

    /// The drag session takes the button's lift, so the list goes on waiting for it, and the
    /// keys wait behind the list: ⌘Z after a drop did nothing until the next click (round 23,
    /// logged on the real app: no key reached the app, and Undo's group stayed open). Once the
    /// button is up and no lift has come, the app hands the list one of its own.
    private static func watchForLostLift(_ event: NSEvent) {
        lastDrag = event
        guard liftWatch == nil else { return }
        releasedTicks = 0
        let timer = Timer(timeInterval: 0.05, repeats: true) { _ in
            MainActor.assumeIsolated {
                releasedTicks = NSEvent.pressedMouseButtons & 1 == 0 ? releasedTicks + 1 : 0
                guard liftIsLost(releasedTicks: releasedTicks) else { return }
                let from = lastDrag
                stopWatchingLift()
                if let from, let up = lift(after: from) { NSApp.postEvent(up, atStart: true) }
            }
        }
        RunLoop.main.add(timer, forMode: .common)
        liftWatch = timer
    }

    private static func stopWatchingLift() {
        liftWatch?.invalidate()
        liftWatch = nil
        lastDrag = nil
    }

    /// Two looks with the button up: a real lift is still in the queue at the first.
    static func liftIsLost(releasedTicks: Int) -> Bool { releasedTicks >= 2 }

    /// The lift to post, in the app only, where the drag last was.
    static func lift(after drag: NSEvent) -> NSEvent? {
        NSEvent.mouseEvent(with: .leftMouseUp, location: drag.locationInWindow, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                           windowNumber: drag.windowNumber, context: nil, eventNumber: drag.eventNumber, clickCount: 1, pressure: 0)
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
    static func row(under event: NSEvent) -> (table: NSTableView, row: Int)? {
        guard !covered, let window = event.window, let content = window.contentView else { return nil }
        if let cover, cover.window == event.windowNumber,
           !QuickOpen.isOutside(event.locationInWindow, of: cover.frame, windowHeight: cover.height) { return nil }
        func found(in view: NSView) -> (table: NSTableView, row: Int)? {
            if let table = view as? NSTableView {
                let p = table.convert(event.locationInWindow, from: nil)
                let row = table.row(at: p)
                // Not under the window's bar: the list scrolls on under the folder's name and its
                // band, and a press there opened the note behind it (Emil, 12 November 2026:
                // "clicking up here should not make you click on the note behind it").
                guard table.visibleRect.contains(p), row >= 0, !ListEdgeLine.underBar(table, table.convert(p, to: table.superview)) else { return nil }
                return (table, row)
            }
            for sub in view.subviews where !sub.isHidden {
                if let hit = found(in: sub) { return hit }
            }
            return nil
        }
        return found(in: content)
    }
}
/// What a drag carries sits on the pointer, wherever on the row the press began. SwiftUI kept the
/// chip at the press's offset from the row, so a note grabbed at the right of a wide row trailed
/// its chip far to the left of the pointer (Emil, 13 November 2026). SwiftUI's rows start their
/// drags their own way: on the Air neither `NSView.beginDraggingSession` nor the table's
/// `draggingSession(_:willBeginAt:)` ran. Every session sets where it starts as the drag begins,
/// and there its items' frames are read across from the pointer (tried on the Air: an x of zero
/// is the pointer). Only SwiftUI's drags are moved: text dragged out
/// of a note keeps its place, as in every Mac text view.
@MainActor
enum DragUnderPointer {
    private static var installed = false

    static func install() {
        guard !installed else { return }
        installed = true
        guard let own = class_getInstanceMethod(NSDraggingSession.self, NSSelectorFromString("setStartLocation:")),
              let ours = class_getInstanceMethod(NSDraggingSession.self, #selector(NSDraggingSession.pinto_setStartLocation(_:)))
        else { return }
        method_exchangeImplementations(own, ours)
    }

    /// Whether a drag from `source` is moved: SwiftUI's views only (the rows, the sidebar, files).
    nonisolated static func moves(from source: Any?) -> Bool {
        guard let source else { return false }
        return NSStringFromClass(type(of: source as AnyObject)).contains("SwiftUI")
    }

    /// Every item of a session that's beginning, onto the pointer.
    nonisolated static func center(_ session: NSDraggingSession) {
        // KVC reads the source and the image's offset without naming AppKit's private accessors.
        guard moves(from: session.value(forKey: "source")) else { return }
        let below = (session.value(forKey: "draggingImageOffset") as? NSValue)?.pointValue.y
        session.enumerateDraggingItems(options: [], for: nil, classes: [NSPasteboardItem.self], searchOptions: [:]) { item, _, _ in
            center(item, bottomFromPointer: below)
        }
    }

    /// The middle of what the item draws onto the pointer. SwiftUI's item is the row, with the chip
    /// in its middle, and stays where the row was against the pointer. Across, the item's x is read
    /// from the pointer. Up and down AppKit keeps the item where it is and ignores a y set here (on
    /// the Air, five values drew the chip in the same place); the session's image offset says how
    /// far the item's bottom is from the pointer (-58 pressed near a row's top, 1 near its
    /// bottom), so the chip moves inside the item by the difference.
    nonisolated static func center(_ item: NSDraggingItem, bottomFromPointer below: CGFloat?) {
        let parts = item.imageComponents ?? []
        let drawn = parts.reduce(NSRect.null) { $0.union($1.frame) }
        guard !drawn.isNull, !drawn.isEmpty else {
            item.draggingFrame.origin.x = -item.draggingFrame.width / 2
            return
        }
        item.draggingFrame.origin.x = -drawn.midX
        guard let below else { return }
        let up = -below - drawn.midY
        for part in parts { part.frame.origin.y += up }
        item.imageComponentsProvider = { parts }
    }
}

extension NSDraggingSession {
    /// Swapped with AppKit's `setStartLocation:` by DragUnderPointer: calling it here calls
    /// AppKit's own.
    @objc func pinto_setStartLocation(_ point: NSPoint) {
        pinto_setStartLocation(point)
        DragUnderPointer.center(self)
    }
}
#endif
