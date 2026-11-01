#if os(iOS)
import XCTest

/// A note in Recently Deleted on the iPhone, the Notes way (Emil, 10-30): no banner over it, no
/// New Note or Share; a tap into it asks "Recently deleted notes can't be edited." with Cancel and
/// Recover, and Recover puts it back, open, so the next tap writes. PANE_SHOTS (TEST_RUNNER_
/// prefixed) keeps the pictures, named with SHOT_PREFIX (light-, dark-).
final class RecentlyDeletedUITests: XCTestCase {
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
        if let dir = env["PANE_SHOTS"] { try? s.pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(env["SHOT_PREFIX"] ?? "")\(name).png")) }
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

    func testTappingADeletedNoteAsksToRecover() {
        open("folder.Travel", title: "Travel")
        let packing = app.staticTexts["Packing"].firstMatch
        XCTAssertTrue(packing.waitForExistence(timeout: 3))
        packing.swipeLeft()
        app.buttons["Delete"].firstMatch.tap()
        XCTAssertFalse(app.staticTexts["Packing"].firstMatch.waitForExistence(timeout: 1.5))
        backToFolders()
        open("sidebar.trash", title: "Recently Deleted")
        XCTAssertFalse(app.buttons["list.newNote"].exists, "no New Note in Recently Deleted")
        shot("iphone-trash-list")

        app.staticTexts["Packing"].firstMatch.tap()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 5))
        let before = editor.value as? String ?? ""
        XCTAssertFalse(app.staticTexts["This note is in Recently Deleted."].exists, "no banner")
        XCTAssertFalse(app.buttons["editor.share"].exists, "no Share for a deleted note")
        shot("iphone-trash-note")

        // A tap into the text asks, and Cancel leaves it as it was.
        editor.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3)).tap()
        let alert = app.alerts["Recently deleted notes can't be edited."]
        XCTAssertTrue(alert.waitForExistence(timeout: 3), "a tap asks to recover")
        XCTAssertTrue(alert.staticTexts["To edit this note, you'll need to recover it."].exists)
        XCTAssertEqual(app.keyboards.count, 0, "no keyboard")
        shot("iphone-trash-prompt")
        alert.buttons["Cancel"].tap()
        XCTAssertFalse(alert.waitForExistence(timeout: 1))
        XCTAssertEqual(editor.value as? String ?? "", before)

        // Recover: the note stays open and the next tap writes.
        editor.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3)).tap()
        XCTAssertTrue(alert.waitForExistence(timeout: 3))
        alert.buttons["Recover"].tap()
        XCTAssertFalse(alert.waitForExistence(timeout: 1))
        XCTAssertTrue(editor.waitForExistence(timeout: 3), "still open")
        editor.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3)).tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), "editable again")
        XCTAssertFalse(app.alerts.firstMatch.exists, "no more asking")
        shot("iphone-recovered")
    }
}
#endif
