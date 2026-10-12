#if os(iOS)
import XCTest

/// iPad: a note dragged from the list and dropped into the open note's text is linked there and
/// stays in the list. A screenshot per step goes to $PANE_SHOTS.
/// (Not here: a note dropped on another note's row. A drag made by the test never reached the
/// row as a drop target on iPad; the rules of that drop are in NoteDropTests.)
final class NoteDropUITests: XCTestCase {
    var app: XCUIApplication!
    var step = 0

    override func setUp() {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .landscapeLeft
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo"]
        app.launch()
    }

    func shot(_ name: String) {
        step += 1
        let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] ?? NSTemporaryDirectory()
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/drop-text-\(String(format: "%02d", step))-\(name).png"))
    }

    /// A note's row in the list (not its title in the open note).
    func row(_ title: String) -> XCUIElement {
        app.collectionViews.cells.containing(.staticText, identifier: title).firstMatch
    }

    /// Drags `from` over `to`, takes a picture while it hovers, and lets go.
    func drag(_ from: XCUIElement, to: XCUICoordinate, picture: String, press: TimeInterval = 0.52) {
        DispatchQueue.global().asyncAfter(deadline: .now() + 2.6) { [self] in shot(picture) }
        from.coordinate(withNormalizedOffset: CGVector(dx: 0.4, dy: 0.5))
            .press(forDuration: press, thenDragTo: to, withVelocity: .fast, thenHoldForDuration: 2.5)
        Thread.sleep(forTimeInterval: 1.5)
    }

    func testANoteDroppedIntoTextIsLinkedAndStaysInTheList() throws {
        XCTAssertTrue(row("Standup notes").waitForExistence(timeout: 10))
        row("Standup notes").tap()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 5))
        Thread.sleep(forTimeInterval: 1.0)
        let before = (editor.value as? String) ?? ""
        shot("before")
        drag(row("Groceries"), to: editor.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)), picture: "over-the-text")
        let after = (editor.value as? String) ?? ""
        XCTAssertNotEqual(before, after, "the text changed")
        XCTAssertTrue(after.contains("Groceries"), "a link to the dropped note is in the text: \(after)")
        XCTAssertTrue(row("Groceries").exists, "and the note is still in the list: nothing moved")
        shot("after-drop")
    }
}
#endif
