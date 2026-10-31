#if os(iOS)
import XCTest

/// Today's note on the iPhone (DailyNotes): the calendar button beside New Note on the folders
/// screen and in a folder's notes opens the day's note in Daily, titled with the date; holding
/// New Note offers New Note, Today's Note and New App; asking again opens the same note.
/// PANE_SCHEME (light or dark) and PANE_SHOTS, TEST_RUNNER_ prefixed, pick the look and keep pictures.
final class DailyNotesUITests: XCTestCase {
    var app: XCUIApplication!
    var env: [String: String] { ProcessInfo.processInfo.environment }

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-showFolders", "-scheme", env["PANE_SCHEME"] ?? "light"]
        app.launch()
        XCTAssertTrue(folderList.waitForExistence(timeout: 8))
    }

    var folderList: XCUIElement { app.navigationBars["Folders"] }
    var compose: XCUIElement { app.buttons["sidebar.newNote"].firstMatch }
    var editor: XCUIElement { app.textViews["editor"] }

    private func shot(_ name: String) {
        Thread.sleep(forTimeInterval: 0.6)
        let s = XCUIScreen.main.screenshot()
        let a = XCTAttachment(screenshot: s)
        a.name = name
        a.lifetime = .keepAlways
        add(a)
        if let dir = env["PANE_SHOTS"] { try? s.pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(name)-\(env["PANE_SCHEME"] ?? "light").png")) }
    }

    private func backToFolders() {
        var tries = 0
        while !folderList.exists && tries < 4 { app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap(); _ = folderList.waitForExistence(timeout: 1.5); tries += 1 }
        XCTAssertTrue(folderList.exists, "back reaches the folder list")
    }

    private func hold() {
        compose.press(forDuration: 1.0)
        XCTAssertTrue(app.buttons["Today\u{2019}s Note"].firstMatch.waitForExistence(timeout: 3), "holding New Note offers Today's Note")
    }

    func testTodaysNoteFromTheCalendarAndTheMenu() {
        // Holding New Note: New Note, Today's Note, New App, and nothing about templates.
        hold()
        XCTAssertTrue(app.buttons["New Note"].firstMatch.exists)
        XCTAssertTrue(app.buttons["New App"].firstMatch.exists)
        XCTAssertFalse(app.buttons["New Template\u{2026}"].exists)
        shot("daily-menu")
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.06)).tap()
        Thread.sleep(forTimeInterval: 0.5)

        // Today's note in one press: the calendar beside New Note. In Daily, titled with the date.
        let today = Date().formatted(date: .long, time: .omitted)
        let calendar = app.buttons["sidebar.today"].firstMatch
        XCTAssertTrue(calendar.exists, "the calendar button is in the bottom bar")
        XCTAssertEqual(calendar.label, "Today\u{2019}s note")
        XCTAssertEqual(calendar.frame.midY, compose.frame.midY, accuracy: 4, "beside New Note")
        shot("daily-folders-calendar")
        calendar.tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        XCTAssertEqual((editor.value as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines), today, "just the date as its title")
        editor.typeText("Slept well")
        shot("daily-today-note")
        backToFolders()

        // A folder's notes have the calendar too.
        app.cells.containing(.any, identifier: "folder.Ideas").firstMatch.tap()
        XCTAssertTrue(app.buttons["list.today"].firstMatch.waitForExistence(timeout: 3), "a folder's notes have the calendar too")
        shot("daily-list-calendar")
        backToFolders()

        // Again, from the menu: the same note, not a second one.
        hold()
        app.buttons["Today\u{2019}s Note"].firstMatch.tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        XCTAssertTrue((editor.value as? String ?? "").contains("Slept well"), "the same note opens again")
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.navigationBars["Daily"].waitForExistence(timeout: 3), "it lives in Daily")
        XCTAssertEqual(app.cells.containing(.staticText, identifier: "note.\(today)").count, 1, "one note for today")
        shot("daily-folder")
    }

    /// The calendar, twice: today's note opens, and the second press opens the same note.
    func testTheCalendarOpensTheSameNoteTwice() {
        let calendar = app.buttons["sidebar.today"].firstMatch
        XCTAssertTrue(calendar.waitForExistence(timeout: 3))
        Thread.sleep(forTimeInterval: 1.0)
        calendar.tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        Thread.sleep(forTimeInterval: 0.8)
        editor.typeText("Slept well. Call Anna about Saturday.")
        Thread.sleep(forTimeInterval: 1.0)
        backToFolders()
        Thread.sleep(forTimeInterval: 1.2)
        calendar.tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        XCTAssertTrue((editor.value as? String ?? "").contains("Call Anna"), "the same note opens again")
        Thread.sleep(forTimeInterval: 2.0)
    }
}
#endif
