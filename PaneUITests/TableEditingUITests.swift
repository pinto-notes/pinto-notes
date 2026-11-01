#if os(iOS)
import XCTest

/// Tables on iPhone, the way a person edits one: a cell, the Table button's menu over the
/// keyboard, a row and a column picked by their handles (taps at the edge of each handle's
/// 44-point target), and Delete Table with its Undo. A screenshot per step goes to $PANE_SHOTS.
/// The note comes from $TABLE_NOTE (scripts: TEST_RUNNER_TABLE_NOTE), a markdown file.
final class TableEditingUITests: XCTestCase {
    var app: XCUIApplication!
    let shots = ProcessInfo.processInfo.environment["PANE_SHOTS"] ?? "/tmp/pane-shots"

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        let note = ProcessInfo.processInfo.environment["TABLE_NOTE"] ?? ""
        app.launchArguments = ["-uitest", "-seedNote", note, "-open", "Trip to Lisbon"]
        app.launch()
    }

    func shot(_ name: String) {
        try? FileManager.default.createDirectory(atPath: shots, withIntermediateDirectories: true)
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(shots)/\(name).png"))
    }

    func pause(_ s: Double = 0.8) { Thread.sleep(forTimeInterval: s) }

    func element(_ id: String) -> XCUIElement { app.descendants(matching: .any)[id].firstMatch }

    /// Taps `e` at a point given in points from its top-left corner.
    func tap(_ e: XCUIElement, x: CGFloat, y: CGFloat) {
        e.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: x, dy: y)).tap()
    }

    /// Closes an open menu without choosing from it.
    func closeMenu() {
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.12)).tap()
        pause(0.6)
    }

    func testTableMenusHandlesAndDelete() throws {
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15), "the note opens")
        pause(1.5)
        let cell = element("grid.2.1")
        XCTAssertTrue(cell.waitForExistence(timeout: 5), "the table shows as a grid")
        cell.tap()
        // A fresh simulator's keyboard first explains slide to type.
        let onboarding = app.buttons["Continue"].firstMatch
        if onboarding.waitForExistence(timeout: 2) { onboarding.tap(); pause(0.6) }

        // The Table button over the keyboard is the table's menu.
        let tableMenu = element("editor.tableMenu")
        XCTAssertTrue(tableMenu.waitForExistence(timeout: 5), "the table bar is over the keyboard")
        pause()
        tableMenu.tap()
        let delete = app.buttons["Delete Table"].firstMatch
        XCTAssertTrue(delete.waitForExistence(timeout: 3), "the menu has Delete Table")
        for t in ["Add Row Above", "Add Row Below", "Add Column Before", "Add Column After", "Delete Row", "Delete Column"] {
            XCTAssertTrue(app.buttons[t].firstMatch.exists, "the menu has \(t)")
        }
        pause()
        shot("table-menu")
        closeMenu()

        // A tap at the far edge of the row handle's 44-point target, over the cell's text, picks the row.
        let row = element("grid.handle.row")
        XCTAssertTrue(row.waitForExistence(timeout: 3))
        XCTAssertGreaterThanOrEqual(row.frame.width, 44)
        XCTAssertGreaterThanOrEqual(row.frame.height, 44)
        tap(row, x: row.frame.width - 2, y: row.frame.height - 2)
        XCTAssertTrue(app.buttons["Delete Row"].firstMatch.waitForExistence(timeout: 3), "the row's menu shows")
        XCTAssertTrue(row.isSelected, "the row is picked")
        pause()
        shot("row-selected")
        closeMenu()

        // A tap at the top edge of the column handle's target, over the line above the table, picks the column.
        let column = element("grid.handle.column")
        XCTAssertTrue(column.waitForExistence(timeout: 3))
        XCTAssertGreaterThanOrEqual(column.frame.width, 44)
        XCTAssertGreaterThanOrEqual(column.frame.height, 44)
        tap(column, x: 2, y: 2)
        XCTAssertTrue(app.buttons["Delete Column"].firstMatch.waitForExistence(timeout: 3), "the column's menu shows")
        XCTAssertTrue(column.isSelected, "the column is picked")
        pause()
        shot("column-selected")

        // Add a column after from the column's menu, and delete it again.
        app.buttons["Add Column After"].firstMatch.tap()
        XCTAssertTrue(element("grid.0.3").waitForExistence(timeout: 3), "a fourth column")
        pause()
        element("grid.handle.column").tap()
        XCTAssertTrue(app.buttons["Delete Column"].firstMatch.waitForExistence(timeout: 3))
        app.buttons["Delete Column"].firstMatch.tap()
        pause()
        XCTAssertFalse(element("grid.0.3").exists, "back to three columns")

        // Delete Table: gone at once, a notice with Undo, and Undo brings it back.
        element("editor.tableMenu").tap()
        XCTAssertTrue(app.buttons["Delete Table"].firstMatch.waitForExistence(timeout: 3))
        app.buttons["Delete Table"].firstMatch.tap()
        let undo = element("toast.undo")
        XCTAssertTrue(undo.waitForExistence(timeout: 3), "a notice says the table was deleted, with Undo")
        XCTAssertFalse(element("grid.2.1").exists, "the table is gone")
        pause(0.4)
        shot("table-deleted")
        undo.tap()
        XCTAssertTrue(element("grid.2.1").waitForExistence(timeout: 3), "Undo brings the table back")
        pause()
        shot("table-restored")
    }

    /// Hide keyboard over a cell puts the keyboard away, like Notes. It moved the caret to the end of
    /// the note instead and the keyboard stayed (Emil's table walkthrough, 1 November 2026).
    func testHideKeyboardInATableHidesIt() throws {
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15), "the note opens")
        pause(1.5)
        element("grid.2.1").tap()
        let onboarding = app.buttons["Continue"].firstMatch
        if onboarding.waitForExistence(timeout: 2) { onboarding.tap(); pause(0.6) }
        XCTAssertTrue(element("editor.tableMenu").waitForExistence(timeout: 5), "the table bar is over the keyboard")
        pause()
        element("editor.done").tap()
        pause(1.2)
        shot("hide-keyboard-after")
        XCTAssertEqual(app.keyboards.count, 0, "the keyboard is put away")
    }

    /// Stills (Emil, 1 November 2026): at rest, a cell being edited (column lines and the add bars
    /// show), a row added from the menu, a row and a column added from the bars, a new table.
    func testStills() throws {
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15), "the note opens")
        pause(2)
        XCTAssertFalse(element("grid.add.row").exists, "no add bars at rest")
        shot("stills-1-rest")
        element("grid.2.1").tap()
        let onboarding = app.buttons["Continue"].firstMatch
        if onboarding.waitForExistence(timeout: 2) { onboarding.tap(); pause(0.6) }
        pause()
        shot("stills-2-editing")
        func said(_ e: XCUIElement) -> String { (e.value as? String ?? "") + " " + e.label }

        // Add Row Below from the table menu: typing goes into the new row.
        element("editor.tableMenu").tap()
        XCTAssertTrue(app.buttons["Add Row Below"].firstMatch.waitForExistence(timeout: 3))
        app.buttons["Add Row Below"].firstMatch.tap()
        pause()
        app.typeText("Mon")
        pause()
        XCTAssertTrue(said(element("grid.3.0")).contains("Mon"), "typing after Add Row Below goes into the new row: \(said(element("grid.3.0")))")
        XCTAssertFalse(said(element("grid.2.1")).contains("Mon"), "not into the cell you were in")
        shot("stills-3-row-added")

        // The bar under the table adds a row at the bottom; the one at its right, a column.
        let addRow = element("grid.add.row")
        XCTAssertTrue(addRow.waitForExistence(timeout: 3), "the add-row bar shows while editing")
        addRow.tap()
        pause()
        app.typeText("Tue")
        pause()
        XCTAssertTrue(said(element("grid.5.0")).contains("Tue"), "a row at the bottom, keyboard in it: \(said(element("grid.5.0")))")
        let addColumn = element("grid.add.column")
        XCTAssertTrue(addColumn.waitForExistence(timeout: 3), "the add-column bar shows while editing")
        addColumn.tap()
        pause()
        app.typeText("Paid")
        pause()
        XCTAssertTrue(said(element("grid.0.3")).contains("Paid"), "a column at the end, keyboard in its header: \(said(element("grid.0.3")))")
        shot("stills-4-bars")

        element("editor.done").tap()
        pause()
        XCTAssertEqual(app.keyboards.count, 0, "Hide keyboard puts it away")
        XCTAssertFalse(element("grid.add.row").exists, "the bars go with the keyboard")
        shot("stills-5-done")
        app.textViews["editor"].coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.95)).tap()
        pause()
        if app.buttons["Table"].firstMatch.waitForExistence(timeout: 3) {
            app.buttons["Table"].firstMatch.tap()
            pause()
            shot("stills-6-new-table")
        }
    }

    /// The whole experience for a recording (Emil, 11-01): read, type in a cell, move to the next,
    /// pick a row and add one, scroll a wide table, and make a new table from the bar.
    func testWalkthrough() throws {
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15), "the note opens")
        pause(2)
        shot("walk-1-rest")
        let cell = element("grid.2.1")
        XCTAssertTrue(cell.waitForExistence(timeout: 5), "the table shows as a grid")
        cell.tap()
        let onboarding = app.buttons["Continue"].firstMatch
        if onboarding.waitForExistence(timeout: 2) { onboarding.tap(); pause(0.6) }
        pause()
        app.typeText(" by train")
        pause()
        shot("walk-2-typing")
        element("grid.2.2").tap()
        pause()
        app.typeText("0")
        pause()
        shot("walk-3-next-cell")

        let row = element("grid.handle.row")
        XCTAssertTrue(row.waitForExistence(timeout: 3))
        row.tap()
        XCTAssertTrue(app.buttons["Add Row Below"].firstMatch.waitForExistence(timeout: 3))
        pause()
        shot("walk-4-row-menu")
        app.buttons["Add Row Below"].firstMatch.tap()
        pause()
        shot("walk-5a-row-added-caret")
        element("grid.3.0").tap()
        pause(0.5)
        app.typeText("Mon")
        pause()
        shot("walk-5-row-added")

        // The wide table, keyboard down: swipe its columns along.
        element("editor.done").tap()
        pause()
        let wide = app.descendants(matching: .any).matching(identifier: "grid.1.1").element(boundBy: 1)
        if wide.waitForExistence(timeout: 2) {
            wide.swipeLeft()
            pause()
            shot("walk-6-wide-scrolled")
        }

        // Out of the table, onto the last line, and a new table from the bar's Table button.
        let editor = app.textViews["editor"]
        editor.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.98)).tap()
        pause()
        let insert = app.buttons["Table"].firstMatch
        if insert.waitForExistence(timeout: 3) {
            insert.tap()
            pause()
            app.typeText("Item")
            pause()
            shot("walk-7-new-table")
        }
        element("editor.done").tap()
        pause()
        shot("walk-8-done")
    }
}
#endif
