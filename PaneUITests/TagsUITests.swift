#if os(iOS)
import XCTest

/// Tags from a note's long-press, on the demo library (Emil, 12 November 2026: "just right click a
/// note, and then I have it there as an option"): New Tag… adds one, the note shows it as a coloured
/// label, the Folders list has it under Tags, its long-press picks its colour, and the next note's
/// menu offers it ticked or not. PANE_SHOTS (TEST_RUNNER_ prefixed) keeps the pictures; PANE_PACE
/// slows each step down for a recording.
final class TagsUITests: XCTestCase {
    var app: XCUIApplication!
    var env: [String: String] { ProcessInfo.processInfo.environment }
    var pace: TimeInterval { Double(env["PANE_PACE"] ?? "") ?? 0.4 }

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
    func noteRow(_ title: String) -> XCUIElement { app.cells.containing(.staticText, identifier: title).firstMatch }

    private func shot(_ name: String) {
        Thread.sleep(forTimeInterval: max(0.6, pace))
        let s = XCUIScreen.main.screenshot()
        let a = XCTAttachment(screenshot: s)
        a.name = name
        a.lifetime = .keepAlways
        add(a)
        if let dir = env["PANE_SHOTS"] { try? s.pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(name).png")) }
    }

    /// The simulator's first-keyboard tip ("slide to type") over the alert: the system's, not ours.
    private func dismissKeyboardTip() {
        let tip = app.buttons["Continue"].firstMatch
        if tip.waitForExistence(timeout: 1) { tip.tap() }
    }

    private func wait(_ t: TimeInterval? = nil) { Thread.sleep(forTimeInterval: t ?? pace) }

    private func backToFolders() {
        var tries = 0
        while !folderList.exists && tries < 4 { backButton.tap(); _ = folderList.waitForExistence(timeout: 1.5); tries += 1 }
        XCTAssertTrue(folderList.exists, "back reaches the folder list")
    }

    func testTagANoteFromItsMenu() {
        row("folder.Travel").tap()
        XCTAssertTrue(app.navigationBars["Travel"].waitForExistence(timeout: 5))
        wait()
        shot("01-travel-list")

        // Long-press a note: Tags is in its menu.
        let weekend = noteRow("Hotel booking")
        XCTAssertTrue(weekend.waitForExistence(timeout: 5))
        weekend.press(forDuration: 1.0)
        let tags = app.buttons["Tags"].firstMatch
        XCTAssertTrue(tags.waitForExistence(timeout: 4), "Tags is in the note's menu")
        shot("02-note-menu")
        tags.tap()
        let newTag = app.buttons["New Tag…"].firstMatch
        XCTAssertTrue(newTag.waitForExistence(timeout: 3))
        shot("03-tags-menu-empty")
        newTag.tap()

        // New Tag…: a name with a space is fine.
        let field = app.alerts.textFields.firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 3))
        field.tap()
        dismissKeyboardTip()
        field.typeText("Needs review")
        shot("04-new-tag")
        app.alerts.buttons["Add"].tap()
        wait()

        // The note has it, as a label under its title.
        weekend.tap()
        let label = app.textViews.firstMatch
        XCTAssertTrue(label.waitForExistence(timeout: 5))
        XCTAssertTrue((label.value as? String ?? "").contains("#Needs-review"), "the tag is in the note")
        wait()
        shot("05-note-with-label")

        // A second tag on the same note, from the menu again.
        backButton.tap()
        XCTAssertTrue(weekend.waitForExistence(timeout: 5))
        weekend.press(forDuration: 1.0)
        app.buttons["Tags"].firstMatch.tap()
        app.buttons["New Tag…"].firstMatch.tap()
        let field2 = app.alerts.textFields.firstMatch
        XCTAssertTrue(field2.waitForExistence(timeout: 3))
        field2.tap()
        dismissKeyboardTip()
        field2.typeText("Lisbon trip")
        app.alerts.buttons["Add"].tap()
        wait()

        // Another note: the menu offers the tags, not ticked.
        let packing = noteRow("Packing")
        XCTAssertTrue(packing.waitForExistence(timeout: 5))
        packing.press(forDuration: 1.0)
        app.buttons["Tags"].firstMatch.tap()
        let offered = app.buttons["Needs-review"].firstMatch
        XCTAssertTrue(offered.waitForExistence(timeout: 3), "the library's tags are offered")
        shot("06-tags-menu-offered")
        offered.tap()
        wait()

        // The Folders list: Tags, each with its colour and count.
        backToFolders()
        let tagRow = row("tag.Needs-review")
        app.swipeUp()
        XCTAssertTrue(tagRow.waitForExistence(timeout: 5), "the tag is in the sidebar")
        wait()
        shot("07-sidebar-tags")

        // Its long-press picks its colour.
        tagRow.press(forDuration: 1.0)
        let red = app.buttons["Red"].firstMatch
        XCTAssertTrue(red.waitForExistence(timeout: 3), "the colours are offered")
        shot("08-colour-menu")
        red.tap()
        wait()
        shot("09-sidebar-red")

        // The tag's list, and the note in its new colour.
        tagRow.tap()
        XCTAssertTrue(noteRow("Hotel booking").waitForExistence(timeout: 5))
        wait()
        shot("10-tag-list")
        noteRow("Hotel booking").tap()
        XCTAssertTrue(app.textViews.firstMatch.waitForExistence(timeout: 5))
        wait()
        shot("11-note-red-label")
        wait(1.5)
        // Xcode keeps its screen recording of a run only when it fails: for a film of this flow,
        // PANE_KEEP_VIDEO ends it as one on purpose. Never set in CI or the local check.
        if env["PANE_KEEP_VIDEO"] != nil { XCTFail("Ended as a failure on purpose so Xcode keeps the recording (PANE_KEEP_VIDEO).") }
    }
}
#endif
