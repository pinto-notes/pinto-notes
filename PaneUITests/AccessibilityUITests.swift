#if os(iOS)
import XCTest

/// What VoiceOver hears on the main screens.
final class AccessibilityUITests: XCTestCase {
    func testLabelsOnListAndTable() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo"]
        app.launch()
        XCTAssertTrue(app.buttons["list.newNote"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.buttons["list.more"].label, "More")
        XCTAssertEqual(app.buttons["list.newNote"].label, "New Note")
        let pinned = app.descendants(matching: .any)["note.Evening tracker"].firstMatch
        XCTAssertTrue(pinned.waitForExistence(timeout: 3))
        XCTAssertEqual(pinned.value as? String, "Pinned")
        app.staticTexts["Welcome to Pinto Notes"].firstMatch.tap()
        let cell = app.descendants(matching: .any)["grid.1.0"].firstMatch
        XCTAssertTrue(cell.waitForExistence(timeout: 5))
        XCTAssertEqual(cell.label, "⌘B, Shortcut, row 1")
        // No tools at the foot while you read: they come up with the keyboard, named (the
        // unnamed-buttons test below goes through them).
        XCTAssertFalse(app.buttons["Checklist"].exists, "no writing tools while reading")
    }

    /// Folder rows read as their name and count; the icon is decoration (it used to read "Move").
    func testFolderRowsReadAsTheirNames() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-showFolders"]
        app.launch()
        XCTAssertTrue(app.navigationBars["Pinto Notes"].waitForExistence(timeout: 5))
        let travel = app.cells.containing(.any, identifier: "folder.Travel").firstMatch
        XCTAssertTrue(travel.waitForExistence(timeout: 3))
        let row = app.descendants(matching: .any).matching(identifier: "folder.Travel").firstMatch
        XCTAssertEqual(row.label, "Travel")
        XCTAssertEqual(row.value as? String, "4 notes")
        XCTAssertEqual(row.elementType, .other, "the row is one element, not an icon and two texts")
    }

    /// The largest accessibility text size: the folder list, a note list and a note stay usable.
    func testLargestDynamicType() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-showFolders", "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        XCTAssertTrue(app.navigationBars["Pinto Notes"].waitForExistence(timeout: 5))
        keep(app, "xxxl-folders")
        app.cells.containing(.any, identifier: "folder.Travel").firstMatch.tap()
        XCTAssertTrue(app.navigationBars["Travel"].waitForExistence(timeout: 3))
        keep(app, "xxxl-list")
        // The centred title stops short of ••• and + (it truncates rather than runs under them).
        let title = app.navigationBars.staticTexts["Travel"].firstMatch.frame
        for id in ["list.more", "list.newNote"] {
            let button = app.buttons[id].firstMatch
            XCTAssertTrue(button.isHittable, "\(id) stays reachable")
            XCTAssertFalse(title.intersects(button.frame), "the title clears \(id)")
        }
        let lisbon = app.staticTexts["Lisbon"].firstMatch
        // Two notes fill the screen at this size: Lisbon is further down.
        for _ in 0..<4 where !(lisbon.exists && lisbon.isHittable) { app.collectionViews.firstMatch.swipeUp() }
        XCTAssertTrue(lisbon.waitForExistence(timeout: 3))
        lisbon.tap()
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 3))
        keep(app, "xxxl-note")
        XCTAssertTrue(app.navigationBars.buttons.element(boundBy: 0).isHittable, "back stays reachable")
    }

    /// Every button on the list and note screens has a spoken name, not a symbol name or nothing.
    /// One known exception is system-built: the sub-folder disclosure chevron. (The format bar's Menu was
    /// the second until 2026-10-28; Format is a plain button now.)
    func testButtonsAreNamed() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-showFolders"]
        app.launch()
        XCTAssertTrue(app.navigationBars["Pinto Notes"].waitForExistence(timeout: 5))
        var unnamed = Self.unnamedButtons(app, screen: "folders")
        app.cells.containing(.any, identifier: "folder.Travel").firstMatch.tap()
        XCTAssertTrue(app.buttons["list.newNote"].waitForExistence(timeout: 5))
        unnamed += Self.unnamedButtons(app, screen: "list")
        app.staticTexts["Lisbon"].firstMatch.tap()
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 3))
        unnamed += Self.unnamedButtons(app, screen: "note")
        app.textViews["editor"].tap()
        XCTAssertTrue(app.buttons["editor.format"].waitForExistence(timeout: 3))
        unnamed += Self.unnamedButtons(app, screen: "editing")
        XCTAssertEqual(unnamed.count, 1, "only the known one: \(unnamed)")
    }

    static func unnamedButtons(_ app: XCUIApplication, screen: String) -> [String] {
        // Symbol names VoiceOver would read out as if they were words.
        let symbolish = try! NSRegularExpression(pattern: "^[a-z]+(\\.[a-z0-9]+)+$")
        return app.buttons.allElementsBoundByIndex.compactMap { b in
            guard b.exists, b.frame.width > 0 else { return nil }
            let label = b.label
            let bad = label.isEmpty || symbolish.firstMatch(in: label, range: NSRange(label.startIndex..., in: label)) != nil
            return bad ? "\(screen): \(b.identifier) '\(label)' at \(b.frame)" : nil
        }
    }

    private func keep(_ app: XCUIApplication, _ name: String) {
        let a = XCTAttachment(screenshot: app.screenshot())
        a.name = name
        a.lifetime = .keepAlways
        add(a)
        if let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] {
            try? app.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(name).png"))
        }
    }
}
#endif
