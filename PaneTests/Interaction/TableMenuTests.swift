import Foundation
import Testing
@testable import Pane

/// Where a table's row and column handles take taps (iPhone: 44-point targets around small grips),
/// worked out the same way on both platforms.
@Suite struct GridHandleTargetTests {
    /// A tap anywhere in a target, right up to its edges, picks that handle when nothing else is near.
    @Test func everyEdgeOfEachFortyFourPointTargetPicksItsHandle() {
        let h = GridHandles(widths: [160, 160, 160], rows: 4, cell: GridCell(row: 2, column: 1), strip: 16, reach: 14, hit: 44)
        #expect(h.grips.count == 2)
        for g in h.grips {
            #expect(g.hit.width >= 44 && g.hit.height >= 44, "\(g.line) target is \(g.hit.size)")
            let r = g.hit.insetBy(dx: 0.5, dy: 0.5)
            let edges = [CGPoint(x: r.minX, y: r.midY), CGPoint(x: r.maxX, y: r.midY), CGPoint(x: r.midX, y: r.minY), CGPoint(x: r.midX, y: r.maxY),
                         CGPoint(x: r.minX, y: r.minY), CGPoint(x: r.maxX, y: r.maxY)]
            for p in edges { #expect(h.line(at: p) == g.line, "\(p) should pick \(g.line)") }
            #expect(h.line(at: CGPoint(x: g.hit.maxX + 1, y: g.hit.maxY + 1)) != g.line, "just past the corner is not \(g.line)")
        }
        #expect(h.grips.contains { $0.line == .column(1) } && h.grips.contains { $0.line == .row(2) })
    }

    /// Targets stay inside the table's own area: the row handle's starts at the left edge, the
    /// column handle's at the top of the reach band.
    @Test func targetsStayInsideTheTable() {
        let h = GridHandles(widths: [100, 100], rows: 2, cell: GridCell(row: 0, column: 0), rowHeight: 32, strip: 16, reach: 14, hit: 44)
        for g in h.grips {
            #expect(g.hit.minX >= 0 && g.hit.minY >= 0, "\(g.line) at \(g.hit)")
            #expect(g.hit.maxX <= 216 && g.hit.maxY <= 14 + 16 + 64, "\(g.line) at \(g.hit)")
        }
    }

    /// Narrow columns crowd the first column's handle into the first row's: wherever the targets
    /// overlap, a tap goes to the nearer grip, never the other one.
    @Test func crowdedHandlesNeverStealEachOthersTaps() {
        for width in stride(from: 44.0, through: 90.0, by: 2.0) {
            let h = GridHandles(widths: [width, width, width, width], rows: 3, cell: GridCell(row: 0, column: 0), rowHeight: 32, strip: 16, reach: 14, hit: 44)
            let a = h.grips[0], b = h.grips[1]
            #expect(a.hit.intersects(b.hit) || width > 60, "the test means to cover overlapping targets (width \(width))")
            for x in stride(from: 0.0, through: 120.0, by: 1.0) {
                for y in stride(from: 0.0, through: 80.0, by: 1.0) {
                    let p = CGPoint(x: x, y: y)
                    guard let picked = h.line(at: p) else { continue }
                    let near = [a, b].filter { $0.hit.contains(p) }.min { hypot($0.center.x - x, $0.center.y - y) < hypot($1.center.x - x, $1.center.y - y) }!
                    #expect(picked == near.line, "width \(width): \(p) picked \(picked)")
                }
            }
            // Each grip itself is always its own.
            #expect(h.line(at: a.center) == a.line && h.line(at: b.center) == b.line)
        }
    }

    @Test func noCellNoHandles() {
        #expect(GridHandles(widths: [100], rows: 2, cell: nil).grips.isEmpty)
        #expect(GridHandles(widths: [100], rows: 2, cell: GridCell(row: 5, column: 0)).grips.isEmpty)
    }

    @Test func rowAndColumnActions() throws {
        var t = try #require(GridTable.find(in: "| a | b |\n| --- | --- |\n| 1 | 2 |").first)
        #expect(t.perform(.addRowBelow, at: GridCell(row: 1, column: 1)) == GridCell(row: 2, column: 0), "into the new row")
        #expect(t.rows == [["a", "b"], ["1", "2"], ["", ""]])
        // Above the header, the row goes under it: the header stays the header.
        #expect(t.perform(.addRowAbove, at: GridCell(row: 0, column: 1)) == GridCell(row: 1, column: 0), "into the new row, under the header")
        #expect(t.rows.first == ["a", "b"] && t.rows.count == 4)
        #expect(t.perform(.addColumnBefore, at: GridCell(row: 2, column: 0)) == GridCell(row: 0, column: 0), "into the new column's header")
        #expect(t.rows[0] == ["", "a", "b"])
        var after = t
        #expect(after.perform(.addColumnAfter, at: GridCell(row: 1, column: 1)) == GridCell(row: 0, column: 2), "into the new column's header")
        #expect(t.perform(.deleteColumn, at: GridCell(row: 0, column: 0)) == GridCell(row: 0, column: 0))
        #expect(t.rows[0] == ["a", "b"])
        #expect(t.perform(.deleteRow, at: GridCell(row: 3, column: 0)) == GridCell(row: 2, column: 0))
        #expect(t.rows.count == 3)
        var one = try #require(GridTable.find(in: "| a |\n| --- |").first)
        #expect(!one.allows(.deleteRow) && !one.allows(.deleteColumn))
        one.perform(.deleteColumn, at: GridCell(row: 0, column: 0))
        #expect(one.rows == [["a"]], "the last column stays: Delete Table removes a table")
    }
}

#if os(macOS)
import AppKit

/// The table menus in the real editor (offscreen): the Table button's menu while a cell has the
/// keyboard, and a handle's menu after a tap on its target.
@MainActor @Suite(.serialized) struct TableMenuTests {
    static let note = TableInteractionTests.note

    /// Into the table's first cell, then down to row `row`.
    private func enter(_ h: EditorHarness, row: Int = 0) async {
        h.controller.presentsTableMenus = false
        await h.caret(after: "is here.")
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.down)
        #expect(await h.until { h.gridHasFocus && h.controller.table != nil }, "the keyboard is in the table")
        for r in 0..<row {
            let from = h.focusedGridField
            await h.press(EditorHarness.down)
            #expect(await h.until { h.focusedGridField.map { $0 !== from } ?? false && h.controller.table?.cell.row == r + 1 })
        }
    }

    /// Delete Table removes it at once, puts the keyboard back in the text, says so, and Undo
    /// brings it back exactly (before, the only way was Delete twice beside it).
    @Test func deleteATableFromTheTableMenuThenUndo() async throws {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await enter(h, row: 1)
        let menu = try #require(h.controller.currentTableMenu)
        let delete = try #require(menu.item("Delete Table"))
        #expect(delete.destructive && delete.enabled)
        #expect(menu.items.map(\.title) == ["Add Row Below", "Add Row Above", "Add Column After", "Add Column Before", "Delete Row", "Delete Column", "Delete Table"],
                "what you add most comes first, nearest the Table button")
        delete.run()
        await h.settle(0.2)
        #expect(!h.text.contains("| ⌘B"), "the table is gone: \(h.text.debugDescription)")
        #expect(h.text == "Shortcuts\n\nEverything you can do from the keyboard is here.\n\n\nAfter the table")
        #expect(h.gridCount == 0)
        #expect(h.window.firstResponder === h.view, "the keyboard is back in the text")
        #expect(h.controller.table == nil)
        let notice = try #require(h.controller.notice, "a notice says the table was deleted")
        #expect(notice.text == "Table deleted" && notice.canUndo)
        await h.snapshot("table-deleted")

        h.controller.undoNotice()
        await h.settle(0.2)
        #expect(h.text == Self.note, "Undo brings the table back: \(h.text.debugDescription)")
        #expect(await h.until { h.gridCount == 1 })
        #expect(h.controller.notice == nil)
    }

    /// Each handle's target is the full size where the editor lays it out (the frames the table
    /// view reports for it, GridHitBox), and a tap anywhere in it, out to its edges, picks that row
    /// or column: the view's tap picks with the same layout, from where the tap lands. Picking it
    /// tints the row or column, asks for its menu, and leaves the keyboard in the cell.
    @Test func aTapAtTheEdgeOfEachHandlesTargetPicksItsRowOrColumn() async throws {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await enter(h, row: 1)
        let host = try #require(h.overlays.first)
        let table = try #require(GridTable.find(in: h.text).first)
        let cell = try #require(h.controller.table?.cell)
        let widths = table.columnWidths(available: host.frame.width - GridMetrics.handle - GridMetrics.growRight)
        let handles = GridHandles(widths: widths, rows: table.rows.count, cell: cell)
        #expect(handles.grips.count == 2)
        let box = try #require(h.view.core.gridBoxes[0])
        #expect(await h.until { box.targets.count == 2 }, "both handles are laid out: \(box.targets)")
        for g in handles.grips {
            let laid = try #require(box.targets[g.line], "\(g.line) is on screen")
            #expect(laid.width >= GridMetrics.handleHit - 0.5 && laid.height >= GridMetrics.handleHit - 0.5, "\(g.line)'s target is \(laid.size)")
            #expect(abs(laid.minX - g.hit.minX) < 1 && abs(laid.minY - g.hit.minY) < 1, "\(g.line) is laid out at \(laid), the layout says \(g.hit)")
            let r = laid.insetBy(dx: 0.5, dy: 0.5)
            for p in [CGPoint(x: r.minX, y: r.midY), CGPoint(x: r.maxX, y: r.midY), CGPoint(x: r.midX, y: r.minY), CGPoint(x: r.midX, y: r.maxY),
                      CGPoint(x: r.minX, y: r.minY), CGPoint(x: r.maxX, y: r.maxY)] {
                #expect(handles.line(at: p) == g.line, "a tap at \(p) is \(g.line)'s")
            }
            h.controller.lastTableMenu = nil
            h.controller.pickTableLine(g.line, grid: 0, cell: cell)
            #expect(h.controller.lastTableMenu?.line == g.line, "\(g.line)'s menu is asked for")
            #expect(h.controller.table?.selected == g.line, "\(g.line) is picked")
            #expect(h.gridHasFocus, "the keyboard stays in the cell")
            await h.snapshot(g.line == .row(1) ? "table-row-picked" : "table-column-picked")
        }
    }

    /// ⌫ handed out by the app, as a key typed in its window is (in-process: nothing is posted to
    /// the system). `h.press` gives it to the window directly, past the app's key watchers.
    private func deleteThroughTheApp(_ h: EditorHarness) async {
        let e = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                 windowNumber: h.window.windowNumber, context: nil, characters: "\u{7F}", charactersIgnoringModifiers: "\u{7F}",
                                 isARepeat: false, keyCode: 51)!
        NSApp.sendEvent(e)
        await h.settle()
    }

    /// Delete on a row or column picked by its handle empties its cells, as in Numbers: the row or
    /// column stays, still picked, the table keeps its shape, and one Undo brings the words back.
    /// (Before, Delete with a row picked did nothing; 8 November 2026.)
    @Test func deleteOnAPickedRowOrColumnClearsItsCells() async throws {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await enter(h, row: 1)
        let cell = try #require(h.controller.table?.cell)

        h.controller.pickTableLine(.row(1), grid: 0, cell: cell)
        await deleteThroughTheApp(h)
        #expect(await h.until { h.text.contains("| Shortcut | Does |\n| --- | --- |\n|   |   |\n| ⌘⇧L | Checklist |") },
                "row 1 is empty, the others as they were: \(h.text.debugDescription)")
        #expect(h.gridCount == 1 && GridTable.find(in: h.text).first?.rows.count == 3, "the row stays")
        #expect(h.controller.table?.selected == .row(1), "the row is still picked")
        h.window.makeFirstResponder(h.view)
        await h.settle()
        h.view.undoManager?.undo()
        #expect(await h.until(5) { h.text == Self.note }, "one Undo brings the row's words back: \(h.text.debugDescription)")

        await enter(h, row: 1)
        h.controller.pickTableLine(.column(1), grid: 0, cell: GridCell(row: 1, column: 1))
        await deleteThroughTheApp(h)
        #expect(await h.until { h.text.contains("| Shortcut |   |") && h.text.contains("| ⌘B |   |") && h.text.contains("| ⌘⇧L |   |") },
                "the column is empty, header too: \(h.text.debugDescription)")
        #expect(GridTable.find(in: h.text).first?.columns == 2, "the column stays")

        // Nothing picked: Delete is the cell's own key, not a clear.
        var g = try #require(GridTable.find(in: Self.note).first)
        g.clear(.row(7))
        #expect(g.rows == GridTable.find(in: Self.note).first?.rows, "a row that isn't there changes nothing")
    }

    /// From a handle's menu: a row added below and deleted again, a column added after and
    /// deleted again, the keyboard in the table all along.
    @Test func addAndDeleteARowAndAColumnFromTheMenus() async throws {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await enter(h, row: 1)
        let cell = try #require(h.controller.table?.cell)
        #expect(cell == GridCell(row: 1, column: 0))

        h.controller.pickTableLine(.row(1), grid: 0, cell: cell)
        try #require(h.controller.lastTableMenu?.item("Add Row Below")).run()
        #expect(await h.until { h.text.contains("| ⌘B | Bold |\n|   |   |\n| ⌘⇧L | Checklist |") }, "a blank row under ⌘B: \(h.text.debugDescription)")
        #expect(await h.until { h.gridHasFocus }, "the keyboard stays in the table")
        #expect(h.controller.table?.cell == GridCell(row: 2, column: 0), "the caret goes to the new row")
        h.controller.pickTableLine(.row(2), grid: 0, cell: GridCell(row: 2, column: 0))
        try #require(h.controller.lastTableMenu?.item("Delete Row")).run()
        #expect(await h.until { h.text == Self.note }, "the blank row is gone: \(h.text.debugDescription)")

        h.controller.pickTableLine(.column(0), grid: 0, cell: GridCell(row: 1, column: 0))
        let columnMenu = try #require(h.controller.lastTableMenu)
        #expect(columnMenu.items.map(\.title) == ["Add Column Before", "Add Column After", "Delete Column", "Delete Table"])
        try #require(columnMenu.item("Add Column After")).run()
        #expect(await h.until { h.text.contains("| Shortcut |   | Does |") && h.text.contains("| ⌘B |   | Bold |") }, "a blank column after the first: \(h.text.debugDescription)")
        // The toolbar's table menu does the same for the cell with the keyboard.
        let toolbar = try #require(h.controller.currentTableMenu)
        #expect(h.controller.table?.cell == GridCell(row: 0, column: 1), "the caret goes to the new column's header")
        h.controller.pickTableLine(.column(1), grid: 0, cell: GridCell(row: 1, column: 1))
        try #require(h.controller.lastTableMenu?.item("Delete Column")).run()
        #expect(await h.until { h.text == Self.note }, "the blank column is gone: \(h.text.debugDescription)")
        #expect(toolbar.item("Delete Row")?.enabled == true)
        #expect(h.gridCount == 1)
    }

    /// With another table after it, Delete Table still leaves the keyboard in the text: the next
    /// table took over the deleted one's view, cell with the keyboard and all, and the keyboard
    /// jumped into it (Emil's table walkthrough, 1 November 2026). Undo brings both back.
    @Test func deletingATableLeavesTheNextOneAlone() async throws {
        let two = Self.note + "\n\n| Booking | Ref | From |\n| --- | --- | --- |\n| Flight | TP1 | Stockholm |\n| Flat | AF-88 | Fri |\n\nEnd"
        let h = await EditorHarness(two)
        defer { h.close() }
        #expect(await h.until { h.gridCount == 2 })
        await enter(h, row: 1)
        try #require(h.controller.currentTableMenu?.item("Delete Table")).run()
        await h.settle(0.6)
        #expect(h.gridCount == 1)
        #expect(h.window.firstResponder === h.view, "the keyboard is back in the text, not in the next table")
        #expect(!h.gridHasFocus)
        #expect(h.controller.table == nil)
        h.controller.undoNotice()
        await h.settle(0.3)
        #expect(h.text == two, "Undo brings the table back: \(h.text.debugDescription)")
        #expect(await h.until { h.gridCount == 2 })
    }

    /// In a cell the editing commands act on the cell (Emil, 1 November 2026: no formatting in a
    /// table was "a real miss"): Bold wraps the selected words in the cell, Link writes a link
    /// there, a heading or a list does nothing (a cell can't hold one), and Checklist turns the
    /// column into ticks, the keyboard moving to its header.
    @Test func formattingInACell() async throws {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await enter(h, row: 1)
        #expect(await h.until { h.controller.cell != nil }, "the cell is what the commands act on")
        // Into the second column: "Bold".
        await h.press(EditorHarness.tab)
        #expect(await h.until { h.controller.table?.cell == GridCell(row: 1, column: 1) })
        await h.settle(0.2)
        CellField.select(NSRange(location: 0, length: 4))
        #expect(CellField.selection() == NSRange(location: 0, length: 4), "the cell's field says what's selected")
        h.controller.bold()
        #expect(await h.until { h.text.contains("| ⌘B | **Bold** |") }, "bold in the cell: \(h.text.debugDescription)")
        #expect(h.gridCount == 1, "still a table")

        let before = h.text
        h.controller.heading(2)
        h.controller.bulletList()
        await h.settle(0.2)
        #expect(h.text == before, "no heading or list in a cell")
        var state = FormatState.at("# Bold", selection: NSRange(location: 2, length: 0))
        state.inCell = true
        #expect(state.isOn(.body) && !state.isOn(.title) && !state.isOn(.heading), "a cell's style reads Body, not the note line's")
        #expect(!state.isEnabled(.heading) && !state.isEnabled(.bulleted) && state.isEnabled(.bold), "the Format panel offers what a cell can hold")

        h.controller.checklist()
        #expect(await h.until { h.text.contains("Does=choice Yes|No") }, "the column is ticks: \(h.text.debugDescription)")
        #expect(await h.until { h.controller.table?.cell == GridCell(row: 0, column: 1) }, "the keyboard in its header")
        #expect(h.gridCount == 1)
        h.controller.checklist()
        #expect(await h.until { !h.text.contains("pane-table") }, "and plain again: \(h.text.debugDescription)")
    }

    /// The add bars show while a cell is being edited, a click on one adds a row or a column with
    /// the keyboard in it, and a click in the strips around the table off the bars goes to the text.
    @Test func theAddBarsAddARowAndAColumn() async throws {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        let host = try #require(h.overlays.first as? GridHostingView)
        let box = try #require(h.view.core.gridBoxes[0])
        #expect(box.adds.isEmpty, "no bars at rest")
        // At rest the strip under the table is the text's.
        let below = NSPoint(x: host.frame.midX, y: host.frame.maxY - 4)
        #expect(host.hitTest(below) == nil, "a click under the table goes to the text")
        await enter(h, row: 1)
        #expect(await h.until { box.adds.count == 2 }, "both bars show while editing: \(box.adds)")
        let rows = try #require(GridTable.find(in: h.text).first).rows.count
        try await h.clickAdd(.row, box: box, host: host)
        #expect(await h.until { GridTable.find(in: h.text).first?.rows.count == rows + 1 }, "a row at the bottom: \(h.text.debugDescription)")
        #expect(await h.until { h.controller.table?.cell == GridCell(row: rows, column: 0) }, "the keyboard in its first cell")
        let columns = try #require(GridTable.find(in: h.text).first).columns
        try await h.clickAdd(.column, box: box, host: host)
        #expect(await h.until { GridTable.find(in: h.text).first?.columns == columns + 1 }, "a column at the end: \(h.text.debugDescription)")
        #expect(await h.until { h.controller.table?.cell == GridCell(row: 0, column: columns) }, "the keyboard in its header")
    }

    /// The handles a table shows (••• above, ⋮ beside) each end with Delete Table: on a one-cell
    /// table nothing else in them could remove it (Emil, 8 November 2026: "there is no obvious
    /// way for me to delete this table"). Running it removes the table, and Undo brings it back.
    @Test func eachHandleMenuEndsWithDeleteTable() async throws {
        let note = "Title\n\n| only |\n| --- |\n\nAfter"
        let h = await EditorHarness(note)
        defer { h.close() }
        h.controller.presentsTableMenus = false
        await h.caret(after: "Title")
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.down)
        #expect(await h.until { h.controller.table != nil })
        let cell = try #require(h.controller.table?.cell)
        for line in [GridLine.row(cell.row), .column(cell.column)] {
            h.controller.pickTableLine(line, grid: 0, cell: cell)
            let menu = try #require(h.controller.lastTableMenu)
            let delete = try #require(menu.item("Delete Table"), "\(line)'s menu has Delete Table: \(menu.items.map(\.title))")
            #expect(delete.destructive && delete.enabled)
            #expect(menu.sections.last?.map(\.title) == ["Delete Table"], "on its own, last")
        }
        try #require(h.controller.lastTableMenu?.item("Delete Table")).run()
        await h.settle(0.2)
        #expect(h.gridCount == 0 && !h.text.contains("| only |"), "the table is gone: \(h.text.debugDescription)")
        h.controller.undoNotice()
        await h.settle(0.2)
        #expect(h.text == note, "Undo brings it back: \(h.text.debugDescription)")
    }

    /// A new table where the caret is, with room for it on screen, doesn't move the note at all;
    /// and the note never moves more than once (Emil, 8 November 2026: "when I create the table,
    /// the whole scroll view moves twice, looks janky").
    @Test(arguments: [200, 560] as [CGFloat]) func insertingATableDoesNotMoveTheNoteTwice(fromTop: CGFloat) async throws {
        let paragraphs = (1...40).map { "Paragraph \($0) with a few words in it so it reads like a note." }
        let note = "Title\n\n" + paragraphs.joined(separator: "\n\n")
        let h = await EditorHarness(note, height: 600)
        defer { h.close() }
        h.controller.presentsTableMenus = false
        await h.caret(after: "Paragraph 20 with a few words in it so it reads like a note.")
        // The caret's line a third of the way down the window.
        // (TextKit 2 only: asking for the view's layoutManager would switch it to TextKit 1.)
        let lineY = h.lineRect(at: max(h.view.selectedRange().location - 1, 0)).minY
        h.scroll.contentView.scroll(to: NSPoint(x: 0, y: max(0, lineY - fromTop)))
        h.scroll.reflectScrolledClipView(h.scroll.contentView)
        await h.settle(0.2)
        let start = h.scroll.contentView.bounds.origin.y
        var seen: [CGFloat] = [start]
        h.controller.insertTable()
        for _ in 0..<60 {
            await h.settle(0.016)
            let y = h.scroll.contentView.bounds.origin.y
            if abs(y - (seen.last ?? y)) > 0.5 { seen.append(y) }
        }
        let focused = await h.until(5) { h.gridHasFocus }
        #expect(focused, "the keyboard is in the new table")
        #expect(seen.count <= 2, "the note moved \(seen.count - 1) times: \(seen)")
        if fromTop < 400 { #expect(seen.count == 1, "the table had room on screen, so the note stays where it was: \(seen)") }
        else { #expect(seen.count == 2, "no room under the caret: the note moves once to show the table: \(seen)") }
        // Wherever it ended up, the whole new table shows.
        let table = try #require(h.overlays.first)
        let visible = h.scroll.contentView.bounds
        #expect(table.frame.maxY - GridMetrics.growBelow <= visible.maxY + 1, "the new table shows whole: \(table.frame) in \(visible), moves \(seen)")
    }

    /// A row added or deleted changes the table's height at once, with the text under it: a
    /// table gliding to its new height while the text below had already moved overlapped that
    /// text, or left a gap, for a fifth of a second. Sampled every frame, never in between.
    @Test func aTableChangesHeightInOneStepWithTheTextBelow() async throws {
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await enter(h, row: 1)
        let cell = try #require(h.controller.table?.cell)
        let host = try #require(h.overlays.first)
        let before = host.frame.height
        // From the first frame after the change: every height the table shows on the way.
        func heights() async -> [CGFloat] {
            await h.settle(0.016)
            var seen: [CGFloat] = [host.frame.height]
            for _ in 0..<30 {
                await h.settle(0.016)
                if abs(host.frame.height - seen.last!) > 0.5 { seen.append(host.frame.height) }
            }
            return seen
        }
        h.controller.pickTableLine(.row(1), grid: 0, cell: cell)
        try #require(h.controller.lastTableMenu?.item("Add Row Below")).run()
        let grew = await heights()
        #expect(grew.count == 1 && grew[0] > before + 20, "one step to the taller table: \(before) then \(grew)")
        h.controller.pickTableLine(.row(2), grid: 0, cell: GridCell(row: 2, column: 0))
        try #require(h.controller.lastTableMenu?.item("Delete Row")).run()
        let shrank = await heights()
        #expect(shrank.count == 1 && abs(shrank[0] - before) < 0.5, "one step back: \(shrank)")
    }

    /// The last row and column have no Delete: Delete Table removes a table.
    @Test func theLastRowAndColumnCantBeDeleted() async throws {
        let h = await EditorHarness("Title\n\n| only |\n| --- |\n\nAfter")
        defer { h.close() }
        h.controller.presentsTableMenus = false
        await h.caret(after: "Title")
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.down)
        #expect(await h.until { h.controller.table != nil })
        let menu = try #require(h.controller.currentTableMenu)
        #expect(menu.item("Delete Row")?.enabled == false && menu.item("Delete Column")?.enabled == false)
        #expect(menu.item("Delete Table")?.enabled == true)
    }
}
extension EditorHarness {
    /// A click on the middle of a table's add bar: it must hit-test to the table, not the text
    /// under it; then what the bar's button calls (an offscreen window takes no clicks).
    func clickAdd(_ kind: GridAdd, box: GridHitBox, host: GridHostingView) async throws {
        let r = try #require(box.adds[kind])
        let local = NSPoint(x: r.midX, y: host.isFlipped ? r.midY : host.bounds.height - r.midY)
        let hit = try #require(host.hitTest(host.convert(local, to: host.superview)), "the bar takes the click")
        #expect(hit === host || hit.isDescendant(of: host))
        controller.addToTable(kind, grid: 0)
        try? await Task.sleep(for: .milliseconds(300))
    }
}
#endif

