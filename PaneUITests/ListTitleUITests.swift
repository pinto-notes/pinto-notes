#if os(iOS)
import XCTest

/// iPhone: the note list's bars (29 October 2026). Back on the left, the folder's name centred with
/// the count under it, ••• on the right; Search with new note beside it at the bottom, which makes a
/// note and opens it. No Select button, and no new note in the editor.
final class ListTitleUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo"]
        app.launch()
        XCTAssertTrue(app.buttons["list.newNote"].firstMatch.waitForExistence(timeout: 5))
    }

    func shot(_ name: String) {
        guard let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] else { return }
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/topbar-\(name).png"))
    }

    func testMoreIsRightTitleCentredNewNoteBesideSearch() {
        let more = app.buttons["list.more"].firstMatch
        let compose = app.buttons["list.newNote"].firstMatch
        XCTAssertTrue(more.exists)
        XCTAssertEqual(more.label, "More")
        XCTAssertEqual(compose.label, "New Note")
        let screen = app.windows.firstMatch.frame
        XCTAssertGreaterThan(more.frame.midX, screen.width / 2, "••• on the right")
        XCTAssertLessThan(more.frame.maxY, screen.height * 0.2, "••• in the top bar")
        let back = app.navigationBars.buttons.element(boundBy: 0)
        XCTAssertLessThan(back.frame.midX, screen.width / 2, "back on the left")
        let title = app.navigationBars.staticTexts["All Notes"].firstMatch
        XCTAssertTrue(title.exists)
        XCTAssertEqual(title.frame.midX, screen.width / 2, accuracy: 4, "the title is centred, inline")
        XCTAssertTrue(app.navigationBars.staticTexts.matching(NSPredicate(format: "label ENDSWITH 'notes'")).firstMatch.exists, "the count under the title")
        // New note at the bottom right, beside Search and as tall as it.
        let field = app.searchFields.firstMatch
        XCTAssertGreaterThan(compose.frame.minY, screen.height * 0.8, "new note in the bottom bar")
        XCTAssertGreaterThan(compose.frame.minX, field.frame.maxX, "right of Search")
        XCTAssertEqual(compose.frame.midY, field.frame.midY, accuracy: 3, "level with Search")
        shot("list")
    }

    /// No Select button, in the bar or in the •••: selecting starts from a row (Emil, 29 October 2026).
    func testNoSelectButton() {
        XCTAssertFalse(app.buttons["Select"].exists, "no Select in the bar")
        app.buttons["list.more"].firstMatch.tap()
        XCTAssertTrue(app.buttons["Add Files…"].firstMatch.waitForExistence(timeout: 3), "the ••• menu is open")
        XCTAssertFalse(app.buttons["Select"].exists, "no Select in the ••• menu")
    }

    /// Long-press a note, Select: that note is selected, a tap adds another, Delete takes both.
    func testLongPressSelectThenDeleteBoth() {
        let groceries = app.staticTexts["Groceries"].firstMatch
        XCTAssertTrue(groceries.waitForExistence(timeout: 3))
        groceries.press(forDuration: 1.0)
        // A menu item carries no identifier: found by its name, the first of the menu.
        let select = app.buttons["Select"].firstMatch
        XCTAssertTrue(select.waitForExistence(timeout: 3), "Select is in the long-press menu")
        XCTAssertEqual(app.buttons.firstMatch.label, "Select", "and heads it")
        select.tap()
        let delete = app.buttons["list.deleteSelected"].firstMatch
        XCTAssertTrue(delete.waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["list.done"].firstMatch.exists, "Done where + was while selecting")
        XCTAssertTrue(delete.label.contains("1"), "the pressed note is selected: \(delete.label)")
        app.staticTexts["Standup notes"].firstMatch.tap()
        XCTAssertTrue(delete.label.contains("2"), "a tap adds the next: \(delete.label)")
        shot("selecting")
        delete.tap()
        XCTAssertFalse(app.staticTexts["Groceries"].waitForExistence(timeout: 1.5))
        XCTAssertFalse(app.staticTexts["Standup notes"].exists, "both deleted")
        XCTAssertTrue(app.buttons["list.newNote"].firstMatch.waitForExistence(timeout: 3), "selecting ends")
    }

    func testDoneEndsSelecting() {
        app.staticTexts["Groceries"].firstMatch.press(forDuration: 1.0)
        let select = app.buttons["Select"].firstMatch
        XCTAssertTrue(select.waitForExistence(timeout: 3))
        select.tap()
        let done = app.buttons["list.done"].firstMatch
        XCTAssertTrue(done.waitForExistence(timeout: 3))
        done.tap()
        XCTAssertTrue(app.buttons["list.newNote"].firstMatch.waitForExistence(timeout: 3))
        XCTAssertFalse(app.buttons["list.deleteSelected"].exists)
    }

    func testNewNoteOpensANoteWithNoComposeInIt() {
        app.buttons["list.newNote"].firstMatch.tap()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 3), "+ opens the new note")
        editor.tap()
        editor.typeText("Top bar note")
        // Back to the list and in again, out of the keyboard, so the editor's bottom bar shows.
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        let row = app.staticTexts["Top bar note"].firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 3), "the new note is in the list")
        row.tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["Checklist"].firstMatch.waitForExistence(timeout: 3), "the editor's bar is up")
        XCTAssertTrue(app.buttons["Table"].firstMatch.exists)
        XCTAssertFalse(app.buttons["New Note"].exists, "no new note inside a note")
        XCTAssertFalse(app.buttons["list.newNote"].exists)
        shot("editor")
    }
}
#endif
