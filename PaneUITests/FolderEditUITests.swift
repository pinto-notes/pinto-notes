#if os(iOS)
import XCTest

/// The iPhone folders screen as Notes has it (Emil, 30 October 2026): your photo at the top left,
/// New Folder and Edit at the right. Edit dims All Notes, Notes and Recently Deleted, and gives
/// every other folder a ••• menu and a handle; a long-press shows the folder's first notes and
/// Move, Delete and Rename. Move puts a folder inside another, or back at the top level.
final class FolderEditUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    func shot(_ name: String) {
        guard let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] else { return }
        let prefix = ProcessInfo.processInfo.environment["SHOT_PREFIX"] ?? ""
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(prefix)folders-\(name).png"))
    }

    func launch() {
        app.launchArguments = ["-uitest", "-demo", "-showFolders", "-captureAccount"]
        app.launch()
        XCTAssertTrue(app.navigationBars["Folders"].waitForExistence(timeout: 5))
    }

    func row(_ name: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: "folder.\(name)").firstMatch }
    var screen: CGRect { app.windows.firstMatch.frame }

    /// A menu item by its identifier, or its title (a ControlGroup's buttons may drop the identifier).
    func menuItem(_ id: String, _ title: String) -> XCUIElement {
        let byID = app.buttons[id].firstMatch
        return byID.exists ? byID : app.buttons[title].firstMatch
    }

    func edit() {
        let edit = app.buttons["sidebar.edit"].firstMatch
        XCTAssertTrue(edit.waitForExistence(timeout: 3))
        edit.tap()
        XCTAssertTrue(app.buttons["sidebar.done"].waitForExistence(timeout: 3), "Edit turns into Done")
    }

    func done() {
        app.buttons["sidebar.done"].firstMatch.tap()
        XCTAssertTrue(app.buttons["sidebar.edit"].waitForExistence(timeout: 3), "Done turns back into Edit")
    }

    func testTopBarPhotoLeftNewFolderAndEditRight() {
        launch()
        shot("top")
        let photo = app.buttons["sidebar.settings"].firstMatch
        let newFolder = app.buttons["sidebar.newFolder"].firstMatch
        let edit = app.buttons["sidebar.edit"].firstMatch
        for e in [photo, newFolder, edit] { XCTAssertTrue(e.waitForExistence(timeout: 3) && e.isHittable) }
        XCTAssertLessThan(photo.frame.midX, screen.midX, "the photo at the left")
        XCTAssertGreaterThan(newFolder.frame.midX, screen.midX, "New Folder at the right")
        XCTAssertLessThan(newFolder.frame.maxX, edit.frame.minX, "Edit right of New Folder")
        XCTAssertEqual(edit.frame.midY, newFolder.frame.midY, accuracy: 2, "on one line")
        XCTAssertEqual(photo.frame.midY, newFolder.frame.midY, accuracy: 2, "the photo too")
        XCTAssertEqual(edit.label, "Edit")
    }

    func testEditDimsTheBuiltInRowsAndOffersEachFolderItsMenu() {
        launch()
        XCTAssertFalse(app.buttons["folder.more.Travel"].exists, "no ••• outside Edit")
        edit()
        XCTAssertEqual(app.buttons["sidebar.done"].firstMatch.label, "Done")
        shot("edit")
        for builtIn in ["sidebar.all", "folder.Notes"] {
            let e = app.descendants(matching: .any).matching(identifier: builtIn).firstMatch
            XCTAssertTrue(e.exists, builtIn)
            XCTAssertEqual(e.value as? String, "Can't be edited", "\(builtIn) has no count while editing")
        }
        XCTAssertFalse(app.buttons["folder.more.Notes"].exists, "Notes has no •••")
        XCTAssertTrue(app.buttons["folder.more.Travel"].exists, "a folder has its •••")
        XCTAssertTrue(app.buttons["folder.more.Q4 planning"].exists, "so does a folder inside another")
        // A built-in row does nothing while editing.
        app.descendants(matching: .any).matching(identifier: "sidebar.all").firstMatch.tap()
        XCTAssertFalse(app.navigationBars["All Notes"].waitForExistence(timeout: 1), "All Notes doesn't open while editing")
        // A subfolder sits a level in.
        XCTAssertGreaterThan(row("Q4 planning").frame.minX + 1, row("Work").frame.minX)
        done()
        XCTAssertFalse(app.buttons["folder.more.Travel"].exists, "the ••• go with Edit")
        XCTAssertNotEqual(row("Travel").value as? String, "Can't be edited")
    }

    func testMoreMenuRenamesAndOffersMoveAndDelete() {
        launch()
        edit()
        app.buttons["folder.more.Travel"].firstMatch.tap()
        XCTAssertTrue(menuItem("folderMenu.move", "Move").waitForExistence(timeout: 3))
        XCTAssertTrue(menuItem("folderMenu.delete", "Delete").exists)
        XCTAssertTrue(menuItem("folderMenu.rename", "Rename").exists)
        shot("edit-more")
        menuItem("folderMenu.rename", "Rename").tap()
        XCTAssertTrue(app.alerts["Rename Folder"].waitForExistence(timeout: 3))
        let field = app.alerts.textFields.firstMatch
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 3))
        field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 12) + "Trips")
        app.alerts.buttons["Save"].tap()
        XCTAssertTrue(row("Trips").waitForExistence(timeout: 3), "renamed")
        XCTAssertTrue(app.buttons["sidebar.done"].exists, "still editing")
    }

    func testDraggingAHandleReordersAndTheOrderStays() {
        launch()
        edit()
        let ideas = row("Ideas"), travel = row("Travel")
        XCTAssertLessThan(ideas.frame.minY, travel.frame.minY, "Ideas is above Travel to start with")
        let handles = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Reorder'"))
        XCTAssertGreaterThan(handles.count, 0, "folders have handles")
        let travelHandle = handles.allElementsBoundByIndex.first { abs($0.frame.midY - travel.frame.midY) < 8 }
        let ideasHandle = handles.allElementsBoundByIndex.first { abs($0.frame.midY - ideas.frame.midY) < 8 }
        guard let travelHandle, let ideasHandle else { return XCTFail("no handle on Travel or Ideas") }
        travelHandle.press(forDuration: 0.6, thenDragTo: ideasHandle, withVelocity: .slow, thenHoldForDuration: 0.4)
        Thread.sleep(forTimeInterval: 0.5)
        XCTAssertLessThan(row("Travel").frame.minY, row("Ideas").frame.minY, "Travel moved above Ideas")
        XCTAssertLessThan(row("Notes").frame.minY, row("Travel").frame.minY, "Notes stays first")
        done()
        XCTAssertLessThan(row("Travel").frame.minY, row("Ideas").frame.minY, "the order stays after Done")
        // Out to a folder and back: the order is the folders', not this screen's.
        row("Ideas").tap()
        XCTAssertTrue(app.navigationBars["Ideas"].waitForExistence(timeout: 3))
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.navigationBars["Folders"].waitForExistence(timeout: 3))
        XCTAssertLessThan(row("Travel").frame.minY, row("Ideas").frame.minY, "and when you come back")
    }

    func testLongPressShowsTheFolderAndMoveDeleteRename() {
        launch()
        row("Travel").press(forDuration: 1.0)
        XCTAssertTrue(menuItem("folderMenu.move", "Move").waitForExistence(timeout: 3))
        XCTAssertTrue(menuItem("folderMenu.delete", "Delete").exists)
        XCTAssertTrue(menuItem("folderMenu.rename", "Rename").exists)
        XCTAssertFalse(app.buttons["Share"].exists, "no Share: folders aren't shared in Pinto")
        // The preview (the folder's first notes, its name and count) isn't in the accessibility
        // tree while the menu is up: the capture shows it.
        shot("long-press")
        // Move is under Delete's neighbour, Rename under them: the row of two is above Rename.
        XCTAssertLessThan(menuItem("folderMenu.move", "Move").frame.maxY, menuItem("folderMenu.rename", "Rename").frame.minY + 1)
    }

    func testMoveIntoAnotherFolderAndBackToTheTop() {
        launch()
        row("Travel").press(forDuration: 1.0)
        menuItem("folderMenu.move", "Move").tap()
        let into = app.buttons["moveFolder.Work"].firstMatch
        XCTAssertTrue(into.waitForExistence(timeout: 3), "the sheet lists the folders")
        XCTAssertFalse(app.buttons["moveFolder.Travel"].exists, "not into itself")
        shot("move-sheet")
        into.tap()
        XCTAssertTrue(row("Travel").waitForExistence(timeout: 3))
        Thread.sleep(forTimeInterval: 0.5)
        XCTAssertGreaterThan(row("Travel").frame.minY, row("Work").frame.minY, "under Work")
        edit()
        XCTAssertGreaterThan(row("Travel").frame.minX, row("Work").frame.minX + 4, "a level in")
        shot("edit-nested")
        app.buttons["folder.more.Travel"].firstMatch.tap()
        menuItem("folderMenu.move", "Move").tap()
        let top = app.buttons["moveFolder.top"].firstMatch
        XCTAssertTrue(top.waitForExistence(timeout: 3))
        XCTAssertFalse(app.buttons["moveFolder.Work"].isEnabled, "where it is now is ticked, not a choice")
        top.tap()
        Thread.sleep(forTimeInterval: 0.5)
        XCTAssertEqual(row("Travel").frame.minX, row("Work").frame.minX, accuracy: 2, "back at the top level")
    }
}
#endif
