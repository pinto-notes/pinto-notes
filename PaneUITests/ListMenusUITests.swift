#if os(iOS)
import XCTest

/// The iPhone note list's menus, as in Apple Notes (Emil, 30 October 2026), on the demo library:
/// a note's long-press menu, the list's ••• menu with Select Notes, Group By Date per folder, and
/// Edit in Recently Deleted. PANE_SHOTS (TEST_RUNNER_ prefixed) keeps the pictures.
final class ListMenusUITests: XCTestCase {
    var app: XCUIApplication!
    var env: [String: String] { ProcessInfo.processInfo.environment }

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-showFolders"]
        app.launch()
        XCTAssertTrue(folderList.waitForExistence(timeout: 8))
    }

    var folderList: XCUIElement { app.navigationBars["Folders"] }
    var backButton: XCUIElement { app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0) }
    func row(_ id: String) -> XCUIElement { app.cells.containing(.any, identifier: id).firstMatch }

    private func shot(_ name: String) {
        Thread.sleep(forTimeInterval: 0.6)
        let s = XCUIScreen.main.screenshot()
        let a = XCTAttachment(screenshot: s)
        a.name = name
        a.lifetime = .keepAlways
        add(a)
        if let dir = env["PANE_SHOTS"] { try? s.pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(name).png")) }
    }

    private func open(_ folder: String, title: String) {
        row(folder).tap()
        XCTAssertTrue(app.navigationBars[title].waitForExistence(timeout: 5), title)
    }

    private func backToFolders() {
        var tries = 0
        while !folderList.exists && tries < 4 { backButton.tap(); _ = folderList.waitForExistence(timeout: 1.5); tries += 1 }
        XCTAssertTrue(folderList.exists, "back reaches the folder list")
    }

    /// Top to bottom on screen, as the menu shows them.
    private func assertOrder(_ labels: [String], file: StaticString = #filePath, line: UInt = #line) {
        let ys = labels.map { label -> CGFloat in
            let e = app.buttons[label].firstMatch
            XCTAssertTrue(e.waitForExistence(timeout: 3), "\(label) is in the menu", file: file, line: line)
            return e.frame.minY
        }
        XCTAssertEqual(ys, ys.sorted(), "in this order: \(labels)", file: file, line: line)
    }

    private func dismissMenu() {
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.06)).tap()
        Thread.sleep(forTimeInterval: 0.5)
    }

    func testLongPressIsNotesMenuWithThePreview() {
        open("sidebar.all", title: "All Notes")
        let groceries = app.staticTexts["Groceries"].firstMatch
        XCTAssertTrue(groceries.waitForExistence(timeout: 5))
        groceries.press(forDuration: 1.0)
        XCTAssertTrue(app.buttons["Share"].firstMatch.waitForExistence(timeout: 3))
        shot("iphone-list-long-press")
        // The row of three, side by side, then the rest under it.
        let share = app.buttons["Share"].firstMatch.frame, move = app.buttons["Move"].firstMatch.frame, delete = app.buttons["Delete"].firstMatch.frame
        XCTAssertEqual(share.midY, move.midY, accuracy: 4)
        XCTAssertEqual(move.midY, delete.midY, accuracy: 4)
        XCTAssertTrue(share.midX < move.midX && move.midX < delete.midX, "Share, Move, Delete from the left")
        // Groceries is pinned in the demo library.
        assertOrder(["Move", "Unpin Note", "Lock Note", "Duplicate Note"])
        XCTAssertFalse(app.buttons["Select"].exists, "a long-press doesn't start selecting")
        XCTAssertTrue(app.otherElements["note.preview"].exists || app.staticTexts["Groceries"].exists, "the note shows over the menu")
        // Duplicate makes a second Groceries in the list.
        let before = app.staticTexts.matching(identifier: "note.Groceries").count
        app.buttons["Duplicate Note"].firstMatch.tap()
        let more = NSPredicate(format: "count > %d", before)
        expectation(for: more, evaluatedWith: app.staticTexts.matching(identifier: "note.Groceries"))
        waitForExpectations(timeout: 3)
    }

    func testMoreMenuOrderAndSelectNotes() {
        open("folder.Notes", title: "Notes")
        app.buttons["list.more"].firstMatch.tap()
        assertOrder(["Select Notes", "Sort By", "Group By Date", "Add Files to \u{201C}Notes\u{201D}\u{2026}"])
        XCTAssertFalse(app.buttons["Add Files\u{2026}"].exists, "the old name is gone")
        XCTAssertFalse(app.buttons["Show Attachments"].exists || app.buttons["View as Gallery"].exists)
        shot("iphone-list-more-menu")
        app.buttons["Select Notes"].firstMatch.tap()
        let done = app.buttons["list.done"]
        XCTAssertTrue(done.waitForExistence(timeout: 3), "a checkmark ends selecting")
        let move = app.buttons["list.moveSelected"], delete = app.buttons["list.deleteSelected"]
        XCTAssertTrue(move.exists && delete.exists)
        XCTAssertFalse(move.isEnabled || delete.isEnabled, "nothing selected yet")
        // Two notes of the demo library's Notes folder (the first cell may be the tip).
        let titles = ["Groceries", "Snippets"]
        app.staticTexts[titles[0]].firstMatch.tap()
        app.staticTexts[titles[1]].firstMatch.tap()
        XCTAssertTrue(delete.label.contains("2"), delete.label)
        shot("iphone-list-selecting")
        move.tap()
        let travel = app.buttons["moveTo.folder.Travel"]
        XCTAssertTrue(travel.waitForExistence(timeout: 3), "Move asks for a folder")
        shot("iphone-list-move-sheet")
        travel.tap()
        XCTAssertTrue(app.buttons["list.more"].waitForExistence(timeout: 3), "selecting ends after the move")
        XCTAssertFalse(app.staticTexts[titles[0]].firstMatch.waitForExistence(timeout: 1), "\(titles[0]) left the folder")
        // Select Notes, then Delete.
        app.buttons["list.more"].firstMatch.tap()
        app.buttons["Select Notes"].firstMatch.tap()
        let first = "Welcome to Pinto Notes"
        app.staticTexts[first].firstMatch.tap()
        delete.tap()
        XCTAssertFalse(app.staticTexts[first].firstMatch.waitForExistence(timeout: 1.5), "deleted")
        XCTAssertTrue(app.buttons["list.more"].waitForExistence(timeout: 2))
    }

    func testGroupByDateIsPerFolder() {
        open("sidebar.all", title: "All Notes")
        XCTAssertTrue(app.staticTexts["Today"].waitForExistence(timeout: 3), "grouped by date to start")
        app.buttons["list.more"].firstMatch.tap()
        app.buttons["Group By Date"].firstMatch.tap()
        XCTAssertTrue(app.buttons["Off"].firstMatch.waitForExistence(timeout: 3))
        shot("iphone-list-group-by-date")
        app.buttons["Off"].firstMatch.tap()
        XCTAssertFalse(app.staticTexts["Today"].waitForExistence(timeout: 1.5), "no date headings in All Notes")
        backToFolders()
        open("folder.Notes", title: "Notes")
        XCTAssertTrue(app.staticTexts["Today"].waitForExistence(timeout: 3), "another folder keeps its own")
        // The next launch.
        app.terminate()
        app.launch()
        XCTAssertTrue(folderList.waitForExistence(timeout: 8))
        open("sidebar.all", title: "All Notes")
        XCTAssertTrue(app.cells.firstMatch.waitForExistence(timeout: 3))
        XCTAssertFalse(app.staticTexts["Today"].exists, "still off in All Notes after a relaunch")
        app.buttons["list.more"].firstMatch.tap()
        app.buttons["Group By Date"].firstMatch.tap()
        app.buttons["On"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Today"].waitForExistence(timeout: 3))
    }

    func testRecentlyDeletedEdit() {
        open("folder.Travel", title: "Travel")
        for title in ["Packing", "Lisbon"] {
            let note = app.staticTexts[title].firstMatch
            XCTAssertTrue(note.waitForExistence(timeout: 3))
            note.swipeLeft()
            app.buttons["Delete"].firstMatch.tap()
            XCTAssertFalse(app.staticTexts[title].firstMatch.waitForExistence(timeout: 1.5))
        }
        XCTAssertTrue(app.buttons["list.more"].exists && !app.buttons["list.edit"].exists, "Edit is only in Recently Deleted")
        backToFolders()
        open("sidebar.trash", title: "Recently Deleted")
        let edit = app.buttons["list.edit"]
        XCTAssertTrue(edit.waitForExistence(timeout: 3))
        XCTAssertFalse(app.buttons["list.more"].exists, "no ••• here, Edit instead")
        edit.tap()
        XCTAssertTrue(app.buttons["Move All"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["Delete All"].exists)
        XCTAssertTrue(app.buttons["list.done"].exists)
        shot("iphone-trash-edit")
        app.staticTexts["Lisbon"].firstMatch.tap()
        XCTAssertTrue(app.buttons["Move"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.buttons["Delete"].exists && !app.buttons["Delete All"].exists)
        shot("iphone-trash-edit-selected")
        // Delete from here is for good: it asks.
        app.buttons["list.deleteSelected"].tap()
        let forever = app.buttons["Delete Forever"].firstMatch
        XCTAssertTrue(forever.waitForExistence(timeout: 3), "asks before deleting for good")
        shot("iphone-trash-delete-confirm")
        forever.tap()
        XCTAssertFalse(app.staticTexts["Lisbon"].firstMatch.waitForExistence(timeout: 1.5))
        // Move All brings the rest back.
        edit.tap()
        app.buttons["Move All"].tap()
        let travel = app.buttons["moveTo.folder.Travel"]
        XCTAssertTrue(travel.waitForExistence(timeout: 3))
        travel.tap()
        XCTAssertFalse(app.staticTexts["Packing"].firstMatch.waitForExistence(timeout: 1.5), "Packing left Recently Deleted")
        backToFolders()
        open("folder.Travel", title: "Travel")
        XCTAssertTrue(app.staticTexts["Packing"].firstMatch.waitForExistence(timeout: 3), "and is back in Travel")
    }
}
#endif
