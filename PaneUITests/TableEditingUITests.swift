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
}
#endif
