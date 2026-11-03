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
/// it is still a press on a note that isn't open, so it selects here. Not the sidebar: a folder's
/// press stays a click.
@MainActor
enum PressSelect {
    /// The press that selected a row, and the rows selected before it.
    private static var pressed: (table: NSTableView, before: IndexSet)?

    /// The press on a row, before the list sees it. `table` and `row`: where it landed.
    static func press(_ event: NSEvent, on table: NSTableView, row: Int) {
        if pressed != nil { lifted() }
        guard event.clickCount >= 1,
              event.modifierFlags.intersection([.command, .shift, .control, .option]).isEmpty,
              !isSidebar(table), !table.selectedRowIndexes.contains(row),
              let window = event.window, accepts(table, row: row) else { return }
        let before = table.selectedRowIndexes
        table.selectRowIndexes(IndexSet(integer: row), byExtendingSelection: false)
        guard table.selectedRowIndexes == IndexSet(integer: row) else { return }
        pressed = (table, before)
        // The fill now; the note follows in the same turn, not on the lift.
        window.displayIfNeeded()
        CATransaction.flush()
    }

    /// The button came up: the press is over (the note opened on it).
    static func lifted() {
        pressed = nil
    }

    /// The press became a drag: the selection, and so the open note, go back to what they were.
    static func dragged() {
        guard let (table, before) = pressed else { return }
        pressed = nil
        table.selectRowIndexes(before, byExtendingSelection: false)
    }

    /// The folders' list, by its style (SwiftUI's `.sidebar`) or its name.
    private static func isSidebar(_ table: NSTableView) -> Bool {
        table.style == .sourceList || table.accessibilityLabel() == "Sidebar"
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
