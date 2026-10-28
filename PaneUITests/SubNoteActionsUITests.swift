#if os(iOS)
import XCTest

/// iPhone: a sub-note has the actions any note has, wherever it shows. Emil, 2026-10-28: "How do
/// I delete a subnote? I can't even hold to get a context menu." Holding the sub-note's card in
/// its parent opens the note list's menu with a preview, Delete sends it to Recently Deleted and
/// Undo brings it back into its parent. A screenshot per step goes to $PANE_SHOTS.
final class SubNoteActionsUITests: XCTestCase {
    var app: XCUIApplication!
    var step = 0

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-open", "Lisbon"]
        app.launch()
    }

    func shot(_ name: String) {
        step += 1
        let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] ?? NSTemporaryDirectory()
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        let mode = ProcessInfo.processInfo.environment["PANE_APPEARANCE"] ?? "light"
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/subnote-\(mode)-\(String(format: "%02d", step))-\(name).png"))
    }

    func pause(_ s: Double = 1.0) { Thread.sleep(forTimeInterval: s) }

    /// The sub-note's card in Lisbon's text.
    var card: XCUIElement { app.descendants(matching: .any)["subnote.Hotel booking"].firstMatch }

    func openMenu() {
        XCTAssertTrue(card.waitForExistence(timeout: 15), "Lisbon opens with its sub-note's card")
        pause(1.2)
        card.press(forDuration: 1.3)
    }

    func testHoldingASubNoteOpensTheNoteMenu() throws {
        openMenu()
        let delete = app.buttons["Delete"].firstMatch
        XCTAssertTrue(delete.waitForExistence(timeout: 5), "holding the card opens the menu")
        for item in ["Move to", "Duplicate", "Move Out of Note", "Open Sub-note"] {
            XCTAssertTrue(app.buttons[item].firstMatch.exists, "the menu has \(item)")
        }
        pause(0.6)
        shot("menu")
    }

    func testDeletingASubNoteFromItsCardThenUndo() throws {
        openMenu()
        let delete = app.buttons["Delete"].firstMatch
        XCTAssertTrue(delete.waitForExistence(timeout: 5))
        delete.tap()
        let undo = app.buttons["subnote.undoDelete"].firstMatch
        XCTAssertTrue(undo.waitForExistence(timeout: 5), "deleting says so, with Undo")
        XCTAssertFalse(card.exists, "the card leaves the parent")
        shot("deleted")
        undo.tap()
        XCTAssertTrue(card.waitForExistence(timeout: 5), "Undo puts it back in its parent")
        shot("undone")
    }
}
#endif
