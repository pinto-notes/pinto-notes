#if os(iOS)
import XCTest

/// iPhone, the foot of a note (`-demoLinks`): Lisbon is linked from Weekend plans (twice) and
/// Packing list, and Trip documents mentions it. Its foot shows under the last line; Unlinked
/// mentions opens with a tap; a line opens its note. A screenshot per step goes to $PANE_SHOTS,
/// named with $PANE_APPEARANCE (light, dark).
final class NoteLinksUITests: XCTestCase {
    var app: XCUIApplication!
    var step = 0

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-demoLinks", "-open", "Lisbon"]
        app.launch()
    }

    func shot(_ name: String) {
        step += 1
        let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] ?? NSTemporaryDirectory()
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        let mode = ProcessInfo.processInfo.environment["PANE_APPEARANCE"] ?? "light"
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/iphone-links-\(mode)-\(String(format: "%02d", step))-\(name).png"))
    }

    func pause(_ s: Double = 1.0) { Thread.sleep(forTimeInterval: s) }

    func testTheFootOfANote() throws {
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        let header = app.buttons["noteLinks.linked"]
        for _ in 0..<6 where !(header.exists && header.isHittable) { editor.swipeUp(velocity: .fast) }
        XCTAssertTrue(header.waitForExistence(timeout: 5), "Linked from shows under the last line")
        XCTAssertTrue(header.label.contains("Linked from 2 notes"), header.label)
        pause()
        shot("linked")

        let mentions = app.buttons["noteLinks.mentions"]
        XCTAssertTrue(mentions.waitForExistence(timeout: 5), "Trip documents mentions Lisbon")
        let link = app.buttons["noteLinks.link.Trip documents"]
        // Folded at first; as it was left on later runs.
        if !link.exists { mentions.tap() }
        if !link.waitForExistence(timeout: 3) { editor.swipeUp(velocity: .slow) }
        XCTAssertTrue(link.waitForExistence(timeout: 5))
        pause()
        shot("mentions")
        link.tap()
        XCTAssertTrue(app.buttons["noteLinks.undo"].waitForExistence(timeout: 3), "Link says where, with Undo")
        pause(0.6)
        shot("linked-mention")
        // Undo puts the text back, so the next run starts the same.
        app.buttons["noteLinks.undo"].tap()
        XCTAssertTrue(link.waitForExistence(timeout: 5), "the mention is back")

        // A line opens its note, at the link.
        let line = app.buttons["noteLinks.line.Weekend plans.1"]
        for _ in 0..<3 where !line.isHittable { editor.swipeDown(velocity: .slow) }
        XCTAssertTrue(line.waitForExistence(timeout: 3))
        line.tap()
        XCTAssertTrue(app.textViews["editor"].staticTexts.firstMatch.waitForExistence(timeout: 5))
        let back = app.buttons["note.linkBack"]
        XCTAssertTrue(back.waitForExistence(timeout: 5), "opened by a link: Back returns to Lisbon")
        pause()
        shot("opened")
    }
}
#endif
