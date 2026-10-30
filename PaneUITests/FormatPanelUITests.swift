#if os(iOS)
import XCTest

/// The Format panel on iPhone, the way a person uses it: write a line, open Format, set bold and a
/// list, watch the panel follow, close it and get the keyboard back. A screenshot per step goes to
/// $PANE_SHOTS (scripts: TEST_RUNNER_PANE_SHOTS), named with $SHOT_PREFIX (light-, dark-).
final class FormatPanelUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-open", "-new"]
        // Captures of the Reduce Motion version: TEST_RUNNER_REDUCE_MOTION=1.
        if ProcessInfo.processInfo.environment["REDUCE_MOTION"] == "1" { app.launchArguments.append("-reduceMotion") }
        app.launch()
    }

    func shot(_ name: String) {
        let env = ProcessInfo.processInfo.environment
        let dir = env["PANE_SHOTS"] ?? "/tmp/pane-shots"
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(env["SHOT_PREFIX"] ?? "")\(name).png"))
    }

    func pause(_ s: Double = 0.8) { Thread.sleep(forTimeInterval: s) }

    func isOn(_ label: String) -> Bool { app.buttons[label].firstMatch.isSelected }

    func mark(_ name: String) {
        let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] ?? "/tmp/pane-shots"
        try? "\(Date().timeIntervalSince1970)".write(toFile: "\(dir)/mark-\(name).txt", atomically: true, encoding: .utf8)
    }

    /// Open and close, for a recording of the panel and the keyboard trading places
    /// (scripts record the simulator around it; the marks time the taps).
    func testOpenAndClose() throws {
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        if app.keyboards.count == 0 { editor.tap() }
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        app.typeText("Weekend in Lisbon\nTrams, tiles and pastries")
        pause(1.5)
        mark("open")
        app.buttons["editor.format"].tap()
        pause(2)
        mark("close")
        XCTAssertTrue(app.descendants(matching: .any)["format.panel"].firstMatch.waitForExistence(timeout: 3))
        XCTAssertEqual(app.keyboards.count, 0)
        app.buttons["format.close"].tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), "closing brings the keyboard back")
        pause(2)
    }

    func testFormatPanel() throws {
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        if app.keyboards.count == 0 { editor.tap() }
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        app.typeText("Weekend in Lisbon\nTrams, tiles and pastries")
        pause()
        shot("1-keyboard")

        app.buttons["editor.format"].tap()
        pause(1.2)
        shot("2-format")

        let panel = app.descendants(matching: .any)["format.panel"].firstMatch
        XCTAssertTrue(panel.waitForExistence(timeout: 3), "the Format panel opens")
        XCTAssertEqual(app.keyboards.count, 0, "the keyboard goes down under the panel")
        XCTAssertTrue(isOn("Body"), "the caret's line is body text")

        app.buttons["Bold"].tap()
        pause()
        XCTAssertTrue(isOn("Bold"), "the word under the caret is bold now")
        shot("3-bold")

        app.buttons["Bulleted List"].tap()
        pause()
        XCTAssertTrue(isOn("Bulleted List"))
        XCTAssertTrue(isOn("Bold"), "still on the bold word")
        shot("4-bulleted")

        app.buttons["Heading"].tap()
        pause()
        XCTAssertTrue(isOn("Heading"))
        XCTAssertFalse(isOn("Bulleted List"), "a heading is not a list item")
        shot("5-heading")

        app.buttons["format.close"].tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), "closing brings the keyboard back")
        pause()
        XCTAssertFalse(panel.exists)
        shot("6-closed")
    }
}
#endif
