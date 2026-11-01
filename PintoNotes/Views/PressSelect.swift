#if os(macOS)
import AppKit
import Observation
import QuartzCore

/// A press on a note row selects it at once, as in Apple Notes: its fill is on screen the frame
/// after the press, and the note opens when the button comes up.
///
/// The list itself selects when the button comes up (its click recognizer), and the fill came with
/// the note: in 30 fps films of the window on the Air (2026-10-12) nothing changed for 170 to 190 ms
/// after a press, in every build, and a click that shows nothing reads as a click that was lost.
/// Here the row is selected on the press while the note pane keeps the note it had (`DetailHold`),
/// so the list's pass is small and its frame is sent at once. On the lift the pane opens the note,
/// with the list's work already done. A press that becomes a drag puts the selection back as it
/// was, so a note dragged into the open note's text finds that note still open.
///
/// Only a plain single press on a row that isn't selected yet: ⌘ and ⇧ clicks, double clicks and a
/// press on a row of a multi-selection (it may start dragging them all) are left to the list. Not
/// the sidebar: a folder's press stays a click.
@MainActor
enum PressSelect {
    /// The press that selected a row, and the rows selected before it.
    private static var pressed: (table: NSTableView, before: IndexSet)?

    /// The press on a row, before the list sees it. `table` and `row`: where it landed.
    static func press(_ event: NSEvent, on table: NSTableView, row: Int) {
        if pressed != nil { lifted() }
        guard event.clickCount == 1,
              event.modifierFlags.intersection([.command, .shift, .control, .option]).isEmpty,
              !isSidebar(table), !table.selectedRowIndexes.contains(row),
              let window = event.window, accepts(table, row: row) else { return }
        let before = table.selectedRowIndexes
        DetailHold.shared.hold()
        table.selectRowIndexes(IndexSet(integer: row), byExtendingSelection: false)
        guard table.selectedRowIndexes == IndexSet(integer: row) else {
            DetailHold.shared.release()
            return
        }
        pressed = (table, before)
        // The list's pass now, with the note pane held: the fill, and nothing else, goes out.
        window.displayIfNeeded()
        CATransaction.flush()
    }

    /// The button came up: the note opens.
    static func lifted() {
        guard pressed != nil else { return }
        pressed = nil
        DetailHold.shared.releaseAfterCommit()
    }

    /// The press became a drag: the selection goes back to what it was, and the pane never changed.
    static func dragged() {
        guard let (table, before) = pressed else { return }
        pressed = nil
        table.selectRowIndexes(before, byExtendingSelection: false)
        DetailHold.shared.releaseAfterCommit()
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

/// What the note pane shows while a row is pressed: the selection it had before the press
/// (PressSelect). Nil the rest of the time: the pane shows the selection.
@MainActor @Observable
final class DetailHold {
    static let shared = DetailHold()

    private(set) var held: Set<UUID>?
    /// The selection the pane shows now, kept by RootView.
    @ObservationIgnored var current: Set<UUID> = []
    @ObservationIgnored private var timer: Timer?

    func hold() {
        timer?.invalidate()
        held = current
    }

    func release() {
        timer?.invalidate()
        timer = nil
        held = nil
    }

    /// Lets go once the run loop has drawn and sent what's pending: a timer, which fires only after
    /// the loop's wait (and the commit before it), where a block on the main queue can run first.
    func releaseAfterCommit() {
        timer?.invalidate()
        let t = Timer(timeInterval: 0.001, repeats: false) { _ in MainActor.assumeIsolated { DetailHold.shared.release() } }
        RunLoop.main.add(t, forMode: .common)
        timer = t
    }
}
#endif
