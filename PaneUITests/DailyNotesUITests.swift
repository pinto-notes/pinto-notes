#if os(iOS)
import XCTest

/// Today's note and templates on the iPhone, from holding New Note on the folders screen (DailyNotes):
/// the menu offers New Note, Today's Note and the templates; New Template… makes one in Templates;
/// Today's Note opens the day's note in Daily, and asking again opens the same note.
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

    func testTodaysNoteAndTemplatesFromHoldingNewNote() {
        hold()
        XCTAssertTrue(app.buttons["New Note"].firstMatch.exists)
        XCTAssertTrue(app.buttons["New Template\u{2026}"].firstMatch.exists)
        shot("daily-menu-empty")

        // A template, written like any note.
        app.buttons["New Template\u{2026}"].firstMatch.tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        editor.typeText("Meeting\nOn {{date}}\nWith ")
        backToFolders()
        XCTAssertTrue(app.staticTexts["Templates"].firstMatch.waitForExistence(timeout: 3), "a Templates folder")
        // Its row lines up with the other top folders' rows, folder icon and all.
        XCTAssertEqual(app.staticTexts["Templates"].firstMatch.frame.minX, app.staticTexts["Ideas"].firstMatch.frame.minX, accuracy: 1)
        XCTAssertTrue(app.cells.containing(.any, identifier: "folder.Templates").images.firstMatch.exists, "the Templates row has its folder icon")

        // The menu lists it, and a note made from it has the date filled in.
        hold()
        XCTAssertTrue(app.buttons["Meeting"].firstMatch.waitForExistence(timeout: 3), "the template is in the menu")
        XCTAssertFalse(app.buttons["About templates"].exists, "the folder's explainer isn't a template")
        shot("daily-menu-templates")
        app.buttons["Meeting"].firstMatch.tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        let today = Date().formatted(date: .long, time: .omitted)
        XCTAssertTrue((editor.value as? String ?? "").contains("On \(today)"), "{{date}} is filled in: \(editor.value ?? "")")
        shot("daily-template-filled")
        backToFolders()

        // Today's note in one press: the calendar beside New Note. In Daily, titled with the date.
        let calendar = app.buttons["sidebar.today"].firstMatch
        XCTAssertTrue(calendar.exists, "the calendar button is in the bottom bar")
        XCTAssertEqual(calendar.label, "Today\u{2019}s note")
        XCTAssertEqual(calendar.frame.midY, compose.frame.midY, accuracy: 4, "beside New Note")
        shot("daily-folders-calendar")
        calendar.tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        XCTAssertTrue((editor.value as? String ?? "").hasPrefix(today), "titled with the date: \(editor.value ?? "")")
        editor.typeText("Slept well")
        shot("daily-today-note")
        backToFolders()

        // The Templates folder explains itself.
        app.cells.containing(.any, identifier: "folder.Templates").firstMatch.tap()
        XCTAssertTrue(app.staticTexts["About templates"].firstMatch.waitForExistence(timeout: 3), "the folder's first note says what it's for")
        XCTAssertTrue(app.buttons["list.today"].firstMatch.exists, "a folder's notes have the calendar too")
        shot("daily-templates-folder")
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
