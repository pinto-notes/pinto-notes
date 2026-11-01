#if os(iOS)
import XCTest

/// iPhone: Select Notes in the note list, then Delete for the selection.
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
        // Select Notes in the list's ••• menu, as in Notes (a long-press opens the note's menu).
        let groceries = app.staticTexts["Groceries"].firstMatch
        XCTAssertTrue(groceries.waitForExistence(timeout: 5))
        app.buttons["list.more"].firstMatch.tap()
        let select = app.buttons["list.selectNotes"].firstMatch
        XCTAssertTrue(select.waitForExistence(timeout: 3))
        select.tap()
        groceries.tap()
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
