#if os(iOS)
import XCTest

/// Labels from a note's long-press, on the demo library (Emil, 12 November 2026: "I just want to
/// right click a note and basically mark it with a label"): New Tag… puts one on the note, its row
/// and its bar show it in colour, the Folders list has it under Tags, its long-press picks its
/// colour, and the next note's menu offers it. PANE_SHOTS (TEST_RUNNER_ prefixed) keeps the pictures; PANE_PACE
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

        // New Tag…: a name (a space is fine) and a colour.
        let field = app.textFields["newTag.name"]
        XCTAssertTrue(field.waitForExistence(timeout: 3))
        dismissKeyboardTip()
        field.typeText("Needs review")
        wait()
        shot("04-new-tag")
        app.buttons["newTag.color.red"].tap()
        wait()
        shot("04b-new-tag-red")
        app.buttons["newTag.add"].tap()
        wait()

        // The row shows it; the note shows it in its bar, and its text is as it was.
        wait()
        shot("05-row-with-label")
        weekend.tap()
        let text = app.textViews.firstMatch
        XCTAssertTrue(text.waitForExistence(timeout: 5))
        XCTAssertTrue(app.descendants(matching: .any)["label.Needs review"].firstMatch.waitForExistence(timeout: 5), "the label is in the note's bar")
        XCTAssertFalse((text.value as? String ?? "").contains("#"), "the note's text is untouched")
        wait()
        shot("05b-note-with-label")

        // A second tag on the same note, from the menu again.
        backButton.tap()
        XCTAssertTrue(weekend.waitForExistence(timeout: 5))
        weekend.press(forDuration: 1.0)
        app.buttons["Tags"].firstMatch.tap()
        app.buttons["New Tag…"].firstMatch.tap()
        let field2 = app.textFields["newTag.name"]
        XCTAssertTrue(field2.waitForExistence(timeout: 3))
        field2.typeText("Lisbon trip")
        app.buttons["newTag.add"].tap()
        wait()

        // Another note: the menu offers the tags, not ticked.
        let packing = noteRow("Packing")
        XCTAssertTrue(packing.waitForExistence(timeout: 5))
        packing.press(forDuration: 1.0)
        app.buttons["Tags"].firstMatch.tap()
        let offered = app.buttons["Needs review"].firstMatch
        XCTAssertTrue(offered.waitForExistence(timeout: 3), "the library's tags are offered")
        shot("06-tags-menu-offered")
        offered.tap()
        wait()

        // The Folders list: Tags, each with its colour and count.
        backToFolders()
        let tagRow = row("tag.Needs review")
        app.swipeUp()
        XCTAssertTrue(tagRow.waitForExistence(timeout: 5), "the tag is in the sidebar")
        wait()
        shot("07-sidebar-tags")

        // Its long-press changes its colour.
        tagRow.press(forDuration: 1.0)
        let blue = app.buttons["Blue"].firstMatch
        XCTAssertTrue(blue.waitForExistence(timeout: 3), "the colours are offered")
        shot("08-colour-menu")
        blue.tap()
        wait()
        shot("09-sidebar-blue")

        // The tag's list, and the note in its new colour.
        tagRow.tap()
        XCTAssertTrue(noteRow("Hotel booking").waitForExistence(timeout: 5))
        wait()
        shot("10-tag-list")
        noteRow("Hotel booking").tap()
        XCTAssertTrue(app.textViews.firstMatch.waitForExistence(timeout: 5))
        wait()
        shot("11-note-blue-label")
        wait(1.5)
        // Xcode keeps its screen recording of a run only when it fails: for a film of this flow,
        // PANE_KEEP_VIDEO ends it as one on purpose. Never set in CI or the local check.
        if env["PANE_KEEP_VIDEO"] != nil { XCTFail("Ended as a failure on purpose so Xcode keeps the recording (PANE_KEEP_VIDEO).") }
    }
}
#endif
