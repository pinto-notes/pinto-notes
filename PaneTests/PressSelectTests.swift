#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// A plain press on a note row selects it on the press, with the note pane held until the lift
/// (2026-10-12: nothing on screen changed for 170 to 190 ms after a press on a note).
@MainActor @Suite(.serialized) struct PressSelectTests {
    final class Rows: NSObject, NSTableViewDataSource, NSTableViewDelegate {
        var unselectable: Set<Int> = []
        func numberOfRows(in tableView: NSTableView) -> Int { 6 }
        func tableView(_ tableView: NSTableView, shouldSelectRow row: Int) -> Bool { !unselectable.contains(row) }
    }

    /// A list in a window that is never shown, its rows 30 pt tall, with row 0 selected.
    private func list(style: NSTableView.Style = .inset) -> (NSTableView, Rows, NSWindow) {
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 300, height: 300), styleMask: [.titled], backing: .buffered, defer: false)
        let table = NSTableView(frame: window.contentView!.bounds)
        table.style = style
        table.rowHeight = 30
        table.addTableColumn(NSTableColumn(identifier: .init("c")))
        let rows = Rows()
        table.dataSource = rows
        table.delegate = rows
        window.contentView!.addSubview(table)
        table.reloadData()
        table.selectRowIndexes([0], byExtendingSelection: false)
        DetailHold.shared.release()
        DetailHold.shared.current = [UUID()]
        return (table, rows, window)
    }

    private func press(_ window: NSWindow, clicks: Int = 1, flags: NSEvent.ModifierFlags = []) -> NSEvent {
        NSEvent.mouseEvent(with: .leftMouseDown, location: NSPoint(x: 20, y: 20), modifierFlags: flags, timestamp: 0,
                           windowNumber: window.windowNumber, context: nil, eventNumber: 0, clickCount: clicks, pressure: 1)!
    }

    @Test func aPressSelectsTheRowAndHoldsTheNoteUntilTheLift() async throws {
        let (table, _, window) = list()
        let open = DetailHold.shared.current
        PressSelect.press(press(window), on: table, row: 3)
        #expect(table.selectedRowIndexes == [3], "selected on the press")
        #expect(DetailHold.shared.held == open, "the pane keeps the open note while the fill goes out")
        PressSelect.lifted()
        try await Task.sleep(for: .milliseconds(50))
        #expect(DetailHold.shared.held == nil, "the note opens after the lift")
        #expect(table.selectedRowIndexes == [3])
    }

    @Test func aPressThatBecomesADragPutsTheSelectionBack() async throws {
        let (table, _, window) = list()
        PressSelect.press(press(window), on: table, row: 4)
        PressSelect.dragged()
        #expect(table.selectedRowIndexes == [0], "the note that was open stays the selection, for a drop into its text")
        try await Task.sleep(for: .milliseconds(50))
        #expect(DetailHold.shared.held == nil)
    }

    @Test func otherPressesAreLeftToTheList() {
        let (table, rows, window) = list()
        rows.unselectable = [2]
        PressSelect.press(press(window, flags: .command), on: table, row: 3)
        PressSelect.press(press(window, flags: .shift), on: table, row: 3)
        PressSelect.press(press(window, clicks: 2), on: table, row: 3)
        PressSelect.press(press(window), on: table, row: 2)
        #expect(table.selectedRowIndexes == [0], "⌘, ⇧, a double click and a heading select nothing on the press")
        #expect(DetailHold.shared.held == nil)
        // A row of a multi-selection: the press may drag them all.
        table.selectRowIndexes([1, 3], byExtendingSelection: false)
        PressSelect.press(press(window), on: table, row: 3)
        #expect(table.selectedRowIndexes == [1, 3])
        PressSelect.lifted()
    }

    @Test func theSidebarIsLeftAlone() {
        let (table, _, window) = list(style: .sourceList)
        PressSelect.press(press(window), on: table, row: 3)
        #expect(table.selectedRowIndexes == [0])
        #expect(DetailHold.shared.held == nil)
    }
}
#endif
