#if os(iOS)
import XCTest

/// iPhone: the note list's top bar, laid out like a chat app's (29 October 2026). ••• on the left
/// (with Select in it), the folder's name centred with the count under it, a round + on the right
/// that makes a note and opens it. Search alone in the bottom bar, and no new note in the editor.
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

    func testMoreIsLeftNewNoteIsRightTitleBetween() {
        let more = app.buttons["list.more"].firstMatch
        let plus = app.buttons["list.newNote"].firstMatch
        XCTAssertTrue(more.exists)
        XCTAssertEqual(more.label, "More")
        XCTAssertEqual(plus.label, "New Note")
        let width = app.windows.firstMatch.frame.width
        XCTAssertLessThan(more.frame.midX, width / 2, "••• on the left")
        XCTAssertGreaterThan(plus.frame.midX, width / 2, "+ on the right")
        // The ••• reports its glyph's frame, not its 44 pt glass; the + is all circle.
        XCTAssertGreaterThanOrEqual(plus.frame.height, 44, "a 44 pt target")
        let title = app.navigationBars.staticTexts["All Notes"].firstMatch
        XCTAssertTrue(title.exists)
        XCTAssertEqual(title.frame.midX, width / 2, accuracy: 4, "the title is centred, inline")
        XCTAssertTrue(app.navigationBars.staticTexts.matching(NSPredicate(format: "label ENDSWITH 'notes'")).firstMatch.exists, "the count under the title")
        XCTAssertFalse(app.toolbars.buttons["New Note"].exists, "no compose beside Search")
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
        // Back to the list and in again, out of the keyboard.
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        let row = app.staticTexts["Top bar note"].firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 3), "the new note is in the list")
        row.tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        XCTAssertFalse(app.buttons["New Note"].exists, "no new note inside a note")
        // The tools come up with the keyboard (a short new note may open with it up), and still
        // no new note among them.
        if app.keyboards.count == 0 { editor.tap() }
        XCTAssertTrue(app.buttons["Checklist"].firstMatch.waitForExistence(timeout: 5), "the bar above the keyboard")
        XCTAssertTrue(app.buttons["Table"].firstMatch.exists)
        XCTAssertFalse(app.buttons["New Note"].exists, "no new note inside a note")
        XCTAssertFalse(app.buttons["list.newNote"].exists)
        shot("editor")
    }
}
#endif
