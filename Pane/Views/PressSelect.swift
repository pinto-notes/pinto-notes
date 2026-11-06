#if os(macOS)
import AppKit
import Observation
import QuartzCore

/// A press on a note row opens it at once, as in Apple Notes: the fill and the note are on screen
/// on the press, not when the button comes up.
///
/// The list itself selects when the button comes up (its click recognizer): in 30 fps films of the
/// window on the Air (2026-10-12) nothing changed for 170 to 190 ms after a press, and a click that
/// shows nothing reads as a click that was lost. Until 3 November 2026 the row was selected on the
/// press but the note pane waited for the lift (`DetailHold`), so a note still took as long as the
/// button was held, about a tenth of a second (Emil: "it feels too slow"); drawing a note takes
/// about 30 ms. Now the note opens on the press too. A press that becomes a drag puts the
/// selection back as it was, so a note dragged into the open note's text finds that note open again.
///
/// Only a plain press on a row that isn't selected yet: ⌘ and ⇧ clicks and a press on a row of a
/// multi-selection (it may start dragging them all) are left to the list. A quick second click on
/// another note counts as a double click (clickCount 2), and the list selects nothing for those:
/// it is still a press on a note that isn't open, so it selects here. Folders in the sidebar too
/// (3 November 2026, "fix that on folders too"), but not a press on a folder's open or close arrow.
@MainActor
enum PressSelect {
    /// The press that selected a row, and the rows selected before it.
    private static var pressed: (table: NSTableView, before: IndexSet)?

    /// The press now over, or still held, became a drag.
    private(set) static var draggedFromRow = false

    /// A new press: whatever the last one dragged is over.
    static func pressBegan() { draggedFromRow = false }

    /// What the list's selection becomes when it asks for `new`. The list ends a drag by selecting
    /// from the dragged row to the row level with the pointer, the row beside the folder it was
    /// dropped on (round 21: a note dragged to a folder left "2 Notes Selected"). A drag from a row
    /// carries notes and selects none; ⌘ and ⇧ pick several, and the keyboard still can.
    static func selection<ID: Hashable>(from old: Set<ID>, asking new: Set<ID>, byKey: Bool = false) -> Set<ID> {
        guard draggedFromRow, !byKey, !old.isEmpty, new.count > old.count, new.isSuperset(of: old) else { return new }
        return old
    }

    /// The press on a row, before the list sees it. `table` and `row`: where it landed.
    static func press(_ event: NSEvent, on table: NSTableView, row: Int) {
        if pressed != nil || narrowing != nil { lifted() }
        // A plain press on one of several picked notes may start dragging them all, so they stay
        // picked; if the button comes up without a drag, that note alone is picked (`lifted`).
        if event.modifierFlags.intersection([.command, .shift, .control, .option]).isEmpty,
           table.selectedRowIndexes.count > 1, table.selectedRowIndexes.contains(row) {
            narrowing = (table, row)
            return
        }
        guard event.clickCount >= 1,
              event.modifierFlags.intersection([.command, .shift, .control, .option]).isEmpty,
              !table.selectedRowIndexes.contains(row), !onArrow(event, table, row: row),
              let window = event.window, accepts(table, row: row) else { return }
        let before = table.selectedRowIndexes
        table.selectRowIndexes(IndexSet(integer: row), byExtendingSelection: false)
        guard table.selectedRowIndexes == IndexSet(integer: row) else { return }
        pressed = (table, before)
        anchors.setObject(NSNumber(value: row), forKey: table)
        // The fill now; the note follows in the same turn, not on the lift.
        window.displayIfNeeded()
        CATransaction.flush()
    }

    /// Where a ⇧-click's range starts, per list: the row last picked with a plain or ⌘ press.
    private static let anchors = NSMapTable<NSTableView, NSNumber>.weakToStrongObjects()

    /// A ⌘ or ⇧ press on a row of a list that picks several (the notes): ⌘ adds the row or takes it
    /// out, ⇧ picks every row from the last one picked to this one, as in Notes and Finder. Done on
    /// the press, and the list never sees the click, so it can't count it a second time; true when
    /// it was done here. The list did these itself on the lift, and missed some (Emil, 3 November
    /// 2026: "shift clicking has the click registering problem").
    static func pick(_ event: NSEvent, on table: NSTableView, row: Int) -> Bool {
        let flags = event.modifierFlags.intersection([.command, .shift, .control, .option])
        guard flags == .command || flags == .shift, table.allowsMultipleSelection,
              !onArrow(event, table, row: row), accepts(table, row: row) else { return false }
        if pressed != nil { lifted() }
        var rows = table.selectedRowIndexes
        if flags == .command {
            if rows.contains(row) { rows.remove(row) } else { rows.insert(row); anchors.setObject(NSNumber(value: row), forKey: table) }
        } else {
            let anchor = anchors.object(forKey: table)?.intValue ?? (table.selectedRow >= 0 ? table.selectedRow : row)
            let from = min(anchor, row), to = max(anchor, row)
            rows = IndexSet((from...to).filter { $0 < table.numberOfRows && accepts(table, row: $0) })
            if anchors.object(forKey: table) == nil { anchors.setObject(NSNumber(value: anchor), forKey: table) }
        }
        table.window?.makeFirstResponder(table)
        table.selectRowIndexes(rows, byExtendingSelection: false)
        table.window?.displayIfNeeded()
        CATransaction.flush()
        return true
    }

    /// A plain press on one of several picked rows, waiting for the lift.
    private static var narrowing: (table: NSTableView, row: Int)?

    /// The button came up: the press is over (the note opened on it). A press on one of several
    /// picked notes that didn't become a drag leaves that note alone picked, as in Notes; the list
    /// did that on its own lift, and missed some.
    static func lifted() {
        pressed = nil
        if let (table, row) = narrowing {
            narrowing = nil
            table.selectRowIndexes(IndexSet(integer: row), byExtendingSelection: false)
            anchors.setObject(NSNumber(value: row), forKey: table)
        }
    }

    /// The press became a drag: the selection, and so the open note, go back to what they were.
    static func dragged() {
        draggedFromRow = true
        narrowing = nil
        guard let (table, before) = pressed else { return }
        pressed = nil
        table.selectRowIndexes(before, byExtendingSelection: false)
    }

    /// Whether the press is on a folder's open or close arrow: that opens or closes the folder, and
    /// selects nothing.
    static func onArrow(_ event: NSEvent, _ table: NSTableView, row: Int) -> Bool {
        guard let outline = table as? NSOutlineView else { return false }
        let p = outline.convert(event.locationInWindow, from: nil)
        if outline.frameOfOutlineCell(atRow: row).insetBy(dx: -4, dy: -4).contains(p) { return true }
        // SwiftUI draws the arrow as a button in the row.
        return outline.window?.contentView?.hitTest(event.locationInWindow).map { hit in
            sequence(first: hit, next: \.superview).prefix { $0 !== outline }.contains { $0 is NSButton }
        } ?? false
    }

    /// Whether the list would select this row by itself: never a heading, a tip or anything marked
    /// `.selectionDisabled()`.
    private static func accepts(_ table: NSTableView, row: Int) -> Bool {
        guard let delegate = table.delegate else { return true }
        if delegate.selectionShouldChange?(in: table) == false { return false }
        let proposed = IndexSet(integer: row)
        if let chosen = delegate.tableView?(table, selectionIndexesForProposedSelection: proposed) { return chosen == proposed }
        if let outline = table as? NSOutlineView, let item = outline.item(atRow: row),
           let allowed = (delegate as? NSOutlineViewDelegate)?.outlineView?(outline, shouldSelectItem: item) {
            return allowed
        }
        return delegate.tableView?(table, shouldSelectRow: row) ?? true
    }
}
#endif
