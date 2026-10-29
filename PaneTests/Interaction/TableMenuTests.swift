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
        #expect(t.perform(.addRowBelow, at: GridCell(row: 1, column: 0)) == GridCell(row: 1, column: 0))
        #expect(t.rows == [["a", "b"], ["1", "2"], ["", ""]])
        // Above the header, the row goes under it: the header stays the header.
        #expect(t.perform(.addRowAbove, at: GridCell(row: 0, column: 1)) == GridCell(row: 0, column: 1))
        #expect(t.rows.first == ["a", "b"] && t.rows.count == 4)
        #expect(t.perform(.addColumnBefore, at: GridCell(row: 0, column: 0)) == GridCell(row: 0, column: 1))
        #expect(t.rows[0] == ["", "a", "b"])
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
        #expect(menu.items.map(\.title) == ["Add Row Above", "Add Row Below", "Add Column Before", "Add Column After", "Delete Row", "Delete Column", "Delete Table"])
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
        let widths = table.columnWidths(available: host.frame.width - GridMetrics.handle)
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
        h.controller.pickTableLine(.row(2), grid: 0, cell: GridCell(row: 2, column: 0))
        try #require(h.controller.lastTableMenu?.item("Delete Row")).run()
        #expect(await h.until { h.text == Self.note }, "the blank row is gone: \(h.text.debugDescription)")

        h.controller.pickTableLine(.column(0), grid: 0, cell: GridCell(row: 1, column: 0))
        let columnMenu = try #require(h.controller.lastTableMenu)
        #expect(columnMenu.items.map(\.title) == ["Add Column Before", "Add Column After", "Delete Column"])
        try #require(columnMenu.item("Add Column After")).run()
        #expect(await h.until { h.text.contains("| Shortcut |   | Does |") && h.text.contains("| ⌘B |   | Bold |") }, "a blank column after the first: \(h.text.debugDescription)")
        // The toolbar's table menu does the same for the cell with the keyboard.
        let toolbar = try #require(h.controller.currentTableMenu)
        #expect(h.controller.table?.cell == GridCell(row: 1, column: 0))
        h.controller.pickTableLine(.column(1), grid: 0, cell: GridCell(row: 1, column: 1))
        try #require(h.controller.lastTableMenu?.item("Delete Column")).run()
        #expect(await h.until { h.text == Self.note }, "the blank column is gone: \(h.text.debugDescription)")
        #expect(toolbar.item("Delete Row")?.enabled == true)
        #expect(h.gridCount == 1)
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
#endif
