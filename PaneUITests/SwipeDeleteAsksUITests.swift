#if os(iOS)
import XCTest

/// A swipe's Delete that asks first, on the iPhone: a shared note ("Delete for everyone?") and a
/// note in Recently Deleted ("Delete Forever"). The app crashed on the owner's phone (1.4,
/// 2026-11-20, SIGABRT from UIKit with no frame of ours but main) the moment a shared note's
/// swipe Delete was confirmed: the button had the destructive role, which takes the row out of
/// the list as the swipe ends, before the question is answered, and the list's real delete then
/// came after it: UICollectionView's batch update assertion (NSInternalInconsistencyException).
/// It took the last row of a date section with more than one row ("Trip documents" under Today
/// in the demo library); the row also vanished while the question was up, and stayed gone after
/// Cancel. The note goes, the app stays up, and the next delete works too.
final class SwipeDeleteAsksUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-showFolders", "-sharedNote", "Trip documents"]
        app.launch()
        XCTAssertTrue(app.navigationBars["Folders"].waitForExistence(timeout: 8))
    }

    func row(_ id: String) -> XCUIElement { app.cells.containing(.any, identifier: id).firstMatch }
    var backButton: XCUIElement { app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0) }

    private func open(_ folder: String, title: String) {
        row(folder).tap()
        XCTAssertTrue(app.navigationBars[title].waitForExistence(timeout: 5), title)
    }

    private func backToFolders() {
        var tries = 0
        while !app.navigationBars["Folders"].exists && tries < 4 { backButton.tap(); _ = app.navigationBars["Folders"].waitForExistence(timeout: 1.5); tries += 1 }
        XCTAssertTrue(app.navigationBars["Folders"].exists, "back reaches the folder list")
    }

    /// Still running, a moment after the delete (a crash takes the app down within it).
    private func assertAlive(_ what: String, file: StaticString = #filePath, line: UInt = #line) {
        Thread.sleep(forTimeInterval: 1.5)
        XCTAssertEqual(app.state, .runningForeground, "the app is still up after \(what)", file: file, line: line)
        XCTAssertTrue(app.navigationBars.firstMatch.waitForExistence(timeout: 2), "the app is still up after \(what)", file: file, line: line)
    }

    /// The crash didn't come every time on the simulator (it came on the last row of a date
    /// section with a row above it): the first and the last row of a section, each shared and
    /// deleted from a fresh library, again and again.
    func testSwipeDeletingASharedNoteAgainAndAgain() {
        for (attempt, title) in Array(repeating: ["Hotel booking", "Trip documents"], count: 4).joined().enumerated() {
            app.terminate()
            app.launchArguments = ["-uitest", "-demo", "-showFolders", "-sharedNote", title]
            app.launch()
            XCTAssertTrue(app.navigationBars["Folders"].waitForExistence(timeout: 8))
            open("folder.Travel", title: "Travel")
            let row = app.staticTexts[title].firstMatch
            XCTAssertTrue(row.waitForExistence(timeout: 3))
            row.swipeLeft()
            XCTAssertTrue(app.buttons["Delete"].firstMatch.waitForExistence(timeout: 2), "the swipe shows Delete")
            app.buttons["Delete"].firstMatch.tap()
            let ask = app.alerts["Delete \u{201C}\(title)\u{201D} for everyone?"]
            XCTAssertTrue(ask.waitForExistence(timeout: 3), "it asks first")
            ask.buttons["sharedDelete.confirm"].firstMatch.tap()
            assertAlive("deleting \(title), try \(attempt + 1)")
            XCTAssertFalse(app.staticTexts[title].firstMatch.exists, "\(title) went, try \(attempt + 1)")
        }
    }

    func testSwipeDeletingASharedNoteAsksThenDeletes() {
        open("folder.Travel", title: "Travel")
        let shared = app.staticTexts["Trip documents"].firstMatch
        XCTAssertTrue(shared.waitForExistence(timeout: 3))
        shared.swipeLeft()
        app.buttons["Delete"].firstMatch.tap()
        let ask = app.alerts["Delete \u{201C}Trip documents\u{201D} for everyone?"]
        XCTAssertTrue(ask.waitForExistence(timeout: 3), "a shared note asks first")
        let rowStayedWhileAsking = app.staticTexts["Trip documents"].firstMatch.exists
        ask.buttons["sharedDelete.confirm"].firstMatch.tap()
        assertAlive("deleting the shared note")
        XCTAssertTrue(rowStayedWhileAsking, "the row stays while it asks")
        XCTAssertFalse(app.staticTexts["Trip documents"].firstMatch.exists, "the shared note went")

        // The next delete, straight after.
        let lisbon = app.staticTexts["Lisbon"].firstMatch
        XCTAssertTrue(lisbon.waitForExistence(timeout: 3))
        lisbon.swipeLeft()
        app.buttons["Delete"].firstMatch.tap()
        assertAlive("deleting the next note")
        XCTAssertFalse(app.staticTexts["Lisbon"].firstMatch.waitForExistence(timeout: 1), "and the next one")

        backToFolders()
        open("sidebar.trash", title: "Recently Deleted")
        XCTAssertTrue(app.staticTexts["Trip documents"].firstMatch.waitForExistence(timeout: 3), "in Recently Deleted")
    }

    func testCancellingTheQuestionKeepsTheRow() {
        open("folder.Travel", title: "Travel")
        let shared = app.staticTexts["Trip documents"].firstMatch
        XCTAssertTrue(shared.waitForExistence(timeout: 3))
        shared.swipeLeft()
        app.buttons["Delete"].firstMatch.tap()
        let ask = app.alerts["Delete \u{201C}Trip documents\u{201D} for everyone?"]
        XCTAssertTrue(ask.waitForExistence(timeout: 3))
        ask.buttons["Cancel"].tap()
        assertAlive("cancelling")
        XCTAssertTrue(app.staticTexts["Trip documents"].firstMatch.exists, "the note stays")
        // Deleting it after all still works.
        app.staticTexts["Trip documents"].firstMatch.swipeLeft()
        app.buttons["Delete"].firstMatch.tap()
        XCTAssertTrue(ask.waitForExistence(timeout: 3))
        ask.buttons["sharedDelete.confirm"].firstMatch.tap()
        assertAlive("deleting it after a cancel")
        XCTAssertFalse(app.staticTexts["Trip documents"].firstMatch.exists)
    }

    /// Share's people on the iPhone: Remove from a swipe asks first, the same way. Cancel leaves the
    /// person in the list (with the destructive role the row went as the swipe ended).
    func testCancellingRemoveFromASwipeKeepsThePerson() {
        app.terminate()
        app.launchArguments = ["-uitest", "-collabGallery", "-share"]
        app.launch()
        let jonas = app.staticTexts["Jonas Berg"].firstMatch
        XCTAssertTrue(jonas.waitForExistence(timeout: 8))
        jonas.swipeLeft()
        let remove = app.buttons["Remove"].firstMatch
        XCTAssertTrue(remove.waitForExistence(timeout: 2), "the swipe shows Remove")
        remove.tap()
        let ask = app.alerts["Remove Jonas?"]
        XCTAssertTrue(ask.waitForExistence(timeout: 3), "it asks first")
        let rowStayedWhileAsking = app.staticTexts["Jonas Berg"].firstMatch.exists
        ask.buttons["Cancel"].tap()
        Thread.sleep(forTimeInterval: 1.5)
        XCTAssertEqual(app.state, .runningForeground, "the app is still up after cancelling Remove")
        XCTAssertTrue(rowStayedWhileAsking, "the person stays while it asks")
        XCTAssertTrue(app.staticTexts["Jonas Berg"].firstMatch.exists, "the person stays after Cancel")
    }

    func testDeleteForeverFromASwipeInRecentlyDeleted() {
        open("folder.Travel", title: "Travel")
        let lisbon = app.staticTexts["Lisbon"].firstMatch
        XCTAssertTrue(lisbon.waitForExistence(timeout: 3))
        lisbon.swipeLeft()
        app.buttons["Delete"].firstMatch.tap()
        XCTAssertFalse(app.staticTexts["Lisbon"].firstMatch.waitForExistence(timeout: 1.5))
        backToFolders()
        open("sidebar.trash", title: "Recently Deleted")
        let gone = app.staticTexts["Lisbon"].firstMatch
        XCTAssertTrue(gone.waitForExistence(timeout: 3))
        gone.swipeLeft()
        app.buttons["Delete Forever\u{2026}"].firstMatch.tap()
        let forever = app.buttons["Delete Forever"].firstMatch
        XCTAssertTrue(forever.waitForExistence(timeout: 3), "it asks first")
        forever.tap()
        assertAlive("deleting forever")
        XCTAssertFalse(app.staticTexts["Lisbon"].firstMatch.exists, "gone for good")
    }
}
#endif
