#if os(iOS)
import XCTest

/// iPhone: Select mode in the note list, then Delete and Move for the selection.
final class MultiSelectUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo"]
        app.launch()
    }

    func shot(_ name: String) {
        let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] ?? NSTemporaryDirectory()
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/multi-\(name).png"))
    }

    func testSelectAndDeleteSeveralNotes() throws {
        // Long-press a note, Select: it starts selected, a tap adds the next.
        let groceries = app.staticTexts["Groceries"].firstMatch
        XCTAssertTrue(groceries.waitForExistence(timeout: 5))
        groceries.press(forDuration: 1.0)
        let select = app.buttons["Select"].firstMatch
        XCTAssertTrue(select.waitForExistence(timeout: 3))
        select.tap()
        app.staticTexts["Standup notes"].firstMatch.tap()
        let delete = app.buttons["list.deleteSelected"]
        XCTAssertTrue(delete.waitForExistence(timeout: 2))
        XCTAssertTrue(delete.label.contains("2"), "the button counts the selection: \(delete.label)")
        shot("selecting")
        delete.tap()
        XCTAssertFalse(app.staticTexts["Groceries"].waitForExistence(timeout: 1.5), "deleted notes leave the list")
        XCTAssertTrue(app.buttons["list.newNote"].waitForExistence(timeout: 2), "Select mode ends after deleting")
        shot("after-delete")
    }
}
#endif
