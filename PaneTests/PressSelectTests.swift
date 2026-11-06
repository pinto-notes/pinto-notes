#if os(macOS)
import AppKit
import Observation
import SwiftData
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

    @Test func aDropPutsOutEveryLitRow() {
        let work = UUID(), ideas = UUID()
        #expect(SidebarView.dropTarget(nil, over: true, id: work, dropped: false) == work)
        #expect(SidebarView.dropTarget(work, over: true, id: ideas, dropped: false) == ideas)
        #expect(SidebarView.dropTarget(ideas, over: false, id: work, dropped: false) == ideas, "leaving another row")
        #expect(SidebarView.dropTarget(work, over: false, id: ideas, dropped: true) == nil, "dropped on Ideas with Work lit")
        #expect(SidebarView.dropTarget(nil, over: true, id: work, dropped: false, buttonDown: false) == nil, "said after the drop")
    }

    @Test func theEndOfADragSelectsNothingMore() {
        let (table, _, window) = list()
        PressSelect.pressBegan()
        #expect(PressSelect.selection(from: [1], asking: [1, 2]) == [1, 2], "no drag: the list may extend")
        PressSelect.press(press(window), on: table, row: 3)
        PressSelect.dragged()
        #expect(PressSelect.selection(from: [1], asking: [1, 2]) == [1], "the row beside the folder it was dropped on")
        #expect(PressSelect.selection(from: [1], asking: [2, 3]) == [1], "rows the drag crossed, without the first")
        #expect(PressSelect.selection(from: [1], asking: [2]) == [2], "another note opened is not an extension")
        #expect(PressSelect.selection(from: [1], asking: [1, 2], byKey: true) == [1, 2], "⌘A after a drag")
        PressSelect.lifted()
        PressSelect.pressBegan()
        #expect(PressSelect.selection(from: [1], asking: [1, 2]) == [1, 2], "a new press starts clean")
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

    /// ⌘ adds a note or takes it out, ⇧ picks every note from the last one picked, on the press,
    /// and the list never sees the click (Emil, 3 November 2026: shift-clicks didn't register).
    @Test func commandAndShiftPressesPickNotes() {
        let (table, rows, window) = list()
        table.allowsMultipleSelection = true
        rows.unselectable = [2]
        PressSelect.press(press(window), on: table, row: 1)
        PressSelect.lifted()
        #expect(PressSelect.pick(press(window, flags: .shift), on: table, row: 4))
        #expect(table.selectedRowIndexes == [1, 3, 4], "from the note picked last to this one, a heading left out")
        #expect(PressSelect.pick(press(window, flags: .command), on: table, row: 3))
        #expect(table.selectedRowIndexes == [1, 4], "⌘ takes a picked note out")
        #expect(PressSelect.pick(press(window, flags: .command), on: table, row: 5))
        #expect(table.selectedRowIndexes == [1, 4, 5], "and adds one")
        #expect(PressSelect.pick(press(window, flags: .shift), on: table, row: 3))
        #expect(table.selectedRowIndexes == [3, 4, 5], "⇧ runs from the note ⌘ added last")
        // A plain click on one of them: it alone is picked when the button comes up, and a drag
        // takes them all.
        PressSelect.press(press(window), on: table, row: 4)
        #expect(table.selectedRowIndexes == [3, 4, 5], "still all picked while the button is down")
        PressSelect.dragged()
        PressSelect.lifted()
        #expect(table.selectedRowIndexes == [3, 4, 5], "a drag takes them all")
        PressSelect.press(press(window), on: table, row: 4)
        PressSelect.lifted()
        #expect(table.selectedRowIndexes == [4], "a click picks that one alone")
        #expect(!PressSelect.pick(press(window), on: table, row: 0), "a plain press is the list's")
        #expect(!PressSelect.pick(press(window, flags: .command), on: table, row: 2), "nor a heading")
        table.allowsMultipleSelection = false
        #expect(!PressSelect.pick(press(window, flags: .command), on: table, row: 1), "nor a list that picks one at a time")
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

extension PressSelectTests {
    /// A row hears the drag move on by itself, without the sidebar being worked out again (rounds
    /// 21 to 24: the first row crossed stayed lit).
    @Test func aRowHearsTheDragMoveOn() {
        let drops = FolderDropState()
        drops.id = UUID()
        final class Heard: @unchecked Sendable { var yes = false }
        let heard = Heard()
        withObservationTracking { _ = drops.id } onChange: { heard.yes = true }
        drops.id = UUID()
        #expect(heard.yes)
    }

    /// A note moves with a move's cursor; a file from Finder is copied in (round 24: the green +).
    @Test func aRowsDropSaysMoveForOurOwnItems() {
        #expect(FolderDrop.operation(ours: true) == .move)
        #expect(FolderDrop.operation(ours: false) == .copy)
    }

    /// The line under the note names where ⌘Z took it (round 24).
    @Test func undoingAMoveSaysWhereItWent() {
        #expect(ModelContext.movedBackLine(["Travel"]) == "Moved back to Travel")
        #expect(ModelContext.movedBackLine(["Travel", "Travel"]) == "Moved back to Travel")
        #expect(ModelContext.movedBackLine(["Travel", "Ideas"]) == "Moved back")
        #expect(ModelContext.movedBackLine([nil]) == "Moved back")
    }

    /// A slash row says its shortcut in words: symbols aren't read out (round 22).
    @Test func aSlashRowSaysItsShortcut() {
        #expect(SlashCommandList.spokenShortcut("\u{21E7}\u{2318}H") == "Shift Command H")
        #expect(SlashCommandList.spokenShortcut("\u{2325}\u{2318}T") == "Option Command T")
        #expect(SlashCommandList.spokenShortcut("\u{2318}'") == "Command '")
    }

    @Test func aTableLineIsReadAsItsCells() {
        #expect(PaneTextView.spokenTableRow("| Place | Dish |\n") == "Place, Dish")
        #expect(PaneTextView.spokenTableRow("| --- | :-: |") == "Table")
        #expect(PaneTextView.spokenTableRow("| Ramiro |  |") == "Ramiro, blank")
        #expect(PaneTextView.spokenTableRow("Plain text") == nil)
    }
}
#endif
