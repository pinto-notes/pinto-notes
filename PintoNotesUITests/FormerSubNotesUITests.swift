#if os(iOS)
import XCTest

/// iPhone, a library that held sub-notes before they were removed (2026-10-28): the demo's Hotel
/// booking made under Lisbon as an older build made it (`-demoSubNotes`). It shows as an ordinary
/// note in a folder named Lisbon, inside Travel; Lisbon links it with an ordinary link, which
/// opens it; and its row has the note list's menu, Delete included. A screenshot per step goes
/// to $PANE_SHOTS.
final class FormerSubNotesUITests: XCTestCase {
    var app: XCUIApplication!
    var step = 0

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-demoSubNotes", "-showFolders"]
        app.launch()
    }

    func shot(_ name: String) {
        step += 1
        let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] ?? NSTemporaryDirectory()
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        let mode = ProcessInfo.processInfo.environment["PANE_APPEARANCE"] ?? "light"
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/iphone-\(mode)-\(String(format: "%02d", step))-\(name).png"))
    }

    func pause(_ s: Double = 1.0) { Thread.sleep(forTimeInterval: s) }

    var folderList: XCUIElement { app.navigationBars["Folders"] }

    func back() {
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        pause(0.8)
    }

    func row(_ title: String) -> XCUIElement { app.cells.containing(.staticText, identifier: title).firstMatch }

    func testAFormerSubNoteIsAnOrdinaryNoteInAFolder() throws {
        XCTAssertTrue(folderList.waitForExistence(timeout: 10))
        let folder = app.cells.containing(.any, identifier: "folder.Lisbon").firstMatch
        if !folder.waitForExistence(timeout: 3) {
            // A subfolder shows under its folder once that one is open (the disclosure).
            app.cells.containing(.any, identifier: "folder.Travel").firstMatch.buttons.firstMatch.tap()
        }
        XCTAssertTrue(folder.waitForExistence(timeout: 3), "the folder named after the note it was under is in the folder list")
        pause()
        shot("folders")

        // Its folder lists it, and its row has the list's menu.
        folder.tap()
        XCTAssertTrue(app.navigationBars["Lisbon"].waitForExistence(timeout: 5))
        XCTAssertTrue(row("Hotel booking").waitForExistence(timeout: 5))
        pause()
        shot("folder")
        row("Hotel booking").press(forDuration: 1.2)
        let delete = app.buttons["Delete"].firstMatch
        XCTAssertTrue(delete.waitForExistence(timeout: 5), "holding its row opens the note menu")
        XCTAssertTrue(app.buttons["Pin Note"].firstMatch.exists && app.buttons["Duplicate"].firstMatch.exists)
        pause(0.6)
        shot("menu")
        delete.tap()
        pause()
        XCTAssertFalse(row("Hotel booking").exists, "deleted like any note")
        shot("deleted")

        // The note it was under, opened at launch: an ordinary link to it, no card, and the link
        // opens it. (In All Notes the former sub-note's row says its folder, Lisbon, too.)
        app.terminate()
        app.launchArguments = ["-uitest", "-demo", "-demoSubNotes", "-open", "Lisbon"]
        app.launch()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        XCTAssertFalse(app.descendants(matching: .any)["subnote.Hotel booking"].exists, "no sub-note card")
        let link = editor.links["Hotel booking"]
        if !link.waitForExistence(timeout: 3) { editor.swipeUp(velocity: .slow) }
        XCTAssertTrue(link.waitForExistence(timeout: 5), "an ordinary link to it")
        pause()
        shot("parent-link")
        link.tap()
        let deadline = Date.now.addingTimeInterval(5)
        while !((editor.value as? String) ?? "").hasPrefix("Hotel booking"), Date.now < deadline { pause(0.2) }
        XCTAssertTrue(((editor.value as? String) ?? "").hasPrefix("Hotel booking"), "the link opens it")
        pause()
        shot("opened")
    }
}
#endif
