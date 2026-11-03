#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// A plain press on a note row selects it, and so opens its note, on the press (2026-10-12: nothing
/// on screen changed for 170 to 190 ms after a press; 3 November 2026: the note waited for the lift).
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
        return (table, rows, window)
    }

    private func press(_ window: NSWindow, clicks: Int = 1, flags: NSEvent.ModifierFlags = []) -> NSEvent {
        NSEvent.mouseEvent(with: .leftMouseDown, location: NSPoint(x: 20, y: 20), modifierFlags: flags, timestamp: 0,
                           windowNumber: window.windowNumber, context: nil, eventNumber: 0, clickCount: clicks, pressure: 1)!
    }

    @Test func aPressSelectsTheRowAtOnce() {
        let (table, _, window) = list()
        PressSelect.press(press(window), on: table, row: 3)
        #expect(table.selectedRowIndexes == [3], "selected on the press, so its note opens then")
        PressSelect.lifted()
        #expect(table.selectedRowIndexes == [3], "the lift changes nothing")
    }

    @Test func aPressThatBecomesADragPutsTheSelectionBack() async throws {
        let (table, _, window) = list()
        PressSelect.press(press(window), on: table, row: 4)
        PressSelect.dragged()
        #expect(table.selectedRowIndexes == [0], "the note that was open is the selection again, for a drop into its text")
    }

    @Test func otherPressesAreLeftToTheList() {
        let (table, rows, window) = list()
        rows.unselectable = [2]
        PressSelect.press(press(window, flags: .command), on: table, row: 3)
        PressSelect.press(press(window, flags: .shift), on: table, row: 3)
        PressSelect.press(press(window), on: table, row: 2)
        #expect(table.selectedRowIndexes == [0], "⌘, ⇧ and a heading select nothing on the press")
        // A row of a multi-selection: the press may drag them all.
        table.selectRowIndexes([1, 3], byExtendingSelection: false)
        PressSelect.press(press(window), on: table, row: 3)
        #expect(table.selectedRowIndexes == [1, 3])
        PressSelect.lifted()
    }

    /// Two quick clicks on two notes: the system counts the second as a double click, and the
    /// list selects nothing for it. The press still selects the note it lands on.
    @Test func aQuickSecondClickOnAnotherNoteSelectsIt() async throws {
        let (table, _, window) = list()
        PressSelect.press(press(window, clicks: 2), on: table, row: 4)
        #expect(table.selectedRowIndexes == [4])
        PressSelect.lifted()
        // A double click on the open note's row changes nothing.
        PressSelect.press(press(window, clicks: 2), on: table, row: 4)
        #expect(table.selectedRowIndexes == [4])
    }

    /// A folder opens on the press too, like a note (3 November 2026, "fix that on folders too").
    @Test func aFolderSelectsOnThePressToo() {
        let (table, _, window) = list(style: .sourceList)
        PressSelect.press(press(window), on: table, row: 3)
        #expect(table.selectedRowIndexes == [3])
        PressSelect.lifted()
    }

    /// A press on a folder's arrow opens or closes it and selects nothing.
    @Test func aPressOnAFoldersArrowSelectsNothing() {
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 300, height: 300), styleMask: [.titled], backing: .buffered, defer: false)
        let outline = Arrows(frame: window.contentView!.bounds)
        window.contentView!.addSubview(outline)
        let at = { (p: NSPoint) in
            NSEvent.mouseEvent(with: .leftMouseDown, location: outline.convert(p, to: nil), modifierFlags: [], timestamp: 0,
                               windowNumber: window.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1)!
        }
        #expect(PressSelect.onArrow(at(NSPoint(x: 10, y: 10)), outline, row: 1))
        #expect(!PressSelect.onArrow(at(NSPoint(x: 150, y: 10)), outline, row: 1))
    }

    /// An outline whose arrow sits in the first 20 pt of each row.
    final class Arrows: NSOutlineView {
        override func frameOfOutlineCell(atRow row: Int) -> NSRect { NSRect(x: 0, y: 0, width: 20, height: 20) }
    }
}
#endif
