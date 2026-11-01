#if os(iOS)
import XCTest

/// The first tap in a note that isn't being edited puts the caret where you tapped, like Notes
/// (Emil, 30 October 2026: "where I click on the note doesn't matter for the caret, it always
/// appears last"). A letter typed after the tap lands at the start of the title that was tapped.
final class EditorTapUITests: XCTestCase {
    func testFirstTapPutsTheCaretWhereYouTapped() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-open", "Groceries"]
        app.launch()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        Thread.sleep(forTimeInterval: 1)
        XCTAssertEqual(app.keyboards.count, 0, "the note opens without the keyboard")
        // Just inside the start of the title, "Groceries", at the top of the note.
        editor.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: 22, dy: 30)).tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        Thread.sleep(forTimeInterval: 0.6)
        app.typeText("Q")
        Thread.sleep(forTimeInterval: 0.6)
        let value = editor.value as? String ?? ""
        XCTAssertFalse(value.hasSuffix("Q"), "the letter went to the end of the note")
        XCTAssertTrue(value.hasPrefix("QGroceries"), "the letter went where the tap was: \(value.prefix(40))")
    }
}
#endif
