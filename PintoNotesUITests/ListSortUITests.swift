#if os(iOS)
import XCTest

/// The list's menu on iPhone: Sort By and Group By Date, on the demo library (no account, no
/// network). PANE_SHOTS (TEST_RUNNER_ prefixed) keeps the pictures.
final class ListSortUITests: XCTestCase {
    var app: XCUIApplication!
    var env: [String: String] { ProcessInfo.processInfo.environment }

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    private func shot(_ name: String) {
        let s = XCUIScreen.main.screenshot()
        let a = XCTAttachment(screenshot: s)
        a.name = name
        a.lifetime = .keepAlways
        add(a)
        if let dir = env["PANE_SHOTS"] { try? s.pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(name).png")) }
    }

    private func choose(_ menu: String, _ item: String, picture: String? = nil) {
        app.buttons["list.more"].firstMatch.tap()
        let sub = app.buttons[menu].firstMatch
        XCTAssertTrue(sub.waitForExistence(timeout: 5), menu)
        if picture != nil { Thread.sleep(forTimeInterval: 0.6); shot("iphone-list-menu") }
        sub.tap()
        let choice = app.buttons[item].firstMatch
        XCTAssertTrue(choice.waitForExistence(timeout: 5), item)
        if let picture { Thread.sleep(forTimeInterval: 0.6); shot(picture) }
        choice.tap()
        Thread.sleep(forTimeInterval: 1)
    }

    private func titles() -> [String] {
        app.cells.allElementsBoundByIndex.prefix(8).compactMap { $0.staticTexts.firstMatch.exists ? $0.staticTexts.firstMatch.label : nil }
    }

    func testSortByTitleAndBack() {
        app.launchArguments = ["-uitest", "-demo", "-open", "Groceries"]
        app.launch()
        // Back from the open note to its folder's list.
        let more = app.buttons["list.more"].firstMatch
        for _ in 0..<3 where !more.waitForExistence(timeout: 3) { app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap() }
        XCTAssertTrue(more.waitForExistence(timeout: 5), "the list has its menu")
        shot("iphone-list-by-date-edited")
        let byDate = titles()
        choose("Sort By", "Title", picture: "iphone-list-menu-sort-by")
        shot("iphone-list-by-title")
        let byTitle = titles()
        XCTAssertFalse(byTitle.isEmpty)
        XCTAssertNotEqual(byTitle, byDate, "the list is in another order")
        XCTAssertFalse(app.staticTexts["Today"].exists || app.staticTexts["Previous 7 Days"].exists, "no date headings over titles")
        choose("Sort By", "Z to A")
        shot("iphone-list-by-title-z-to-a")
        // The app is quit and opened again: the choice is still there.
        app.terminate()
        app.launch()
        for _ in 0..<3 where !more.waitForExistence(timeout: 3) { app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap() }
        XCTAssertFalse(app.staticTexts["Today"].exists || app.staticTexts["Previous 7 Days"].exists, "still by title after a relaunch")
        // And back to how the list has always been.
        choose("Sort By", "Date Edited")
        choose("Sort By", "Newest First")
        XCTAssertTrue(app.staticTexts["Today"].waitForExistence(timeout: 5), "the date headings are back")
    }
}
#endif
