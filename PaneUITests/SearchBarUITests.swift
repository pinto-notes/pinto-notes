#if os(iOS)
import XCTest

/// The note list's search is a full field alone in the bottom bar (iOS 26 Notes/Mail; new note is
/// the round + at the top since 29 October 2026), and there is only one search entry.
final class SearchBarUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo"]
        app.launch()
    }

    func shot(_ name: String) {
        let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] ?? NSTemporaryDirectory()
        let idiom = UIDevice.current.userInterfaceIdiom == .pad ? "ipad" : "iphone"
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/search-\(idiom)-\(name).png"))
    }

    func testSearchIsAFullBarOnItsOwn() throws {
        XCTAssertTrue(app.buttons["list.newNote"].waitForExistence(timeout: 5))
        let field = app.searchFields.firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 3), "a search field, not a minimised button")
        XCTAssertEqual(app.searchFields.count, 1, "one search entry")
        let compose = app.buttons["list.newNote"].firstMatch
        let screen = app.windows.firstMatch.frame
        // iPhone: the bottom bar, like Notes and Mail. iPad keeps the system's placement at the top of the column.
        if UIDevice.current.userInterfaceIdiom == .phone {
            XCTAssertGreaterThan(field.frame.minY, screen.height * 0.8, "search sits in the bottom bar")
            XCTAssertLessThan(compose.frame.maxY, screen.height * 0.2, "new note is at the top, not beside search")
            XCTAssertGreaterThan(field.frame.width, screen.width * 0.75, "search alone spans the bar")
        }
        if UIDevice.current.userInterfaceIdiom == .pad {
            XCTAssertGreaterThan(compose.frame.midX, app.collectionViews.firstMatch.frame.midX, "new note sits at the trailing edge on iPad")
            Thread.sleep(forTimeInterval: 1)
        }
        shot("rest")
        let restY = field.frame.minY
        field.tap()
        Thread.sleep(forTimeInterval: 1)
        let focusedY = app.searchFields.firstMatch.frame.minY
        // With the software keyboard up the bar rides on top of it (a hardware keyboard shows none).
        if UIDevice.current.userInterfaceIdiom == .phone, app.keyboards.firstMatch.exists { XCTAssertLessThan(focusedY, restY, "the bar rises with the keyboard") }
        shot("keyboard")
        app.searchFields.firstMatch.typeText("Lisbon")
        Thread.sleep(forTimeInterval: 1)
        XCTAssertTrue(app.staticTexts["Trip documents"].firstMatch.exists, "matches show while typing")
        shot("query")
    }
}
#endif
