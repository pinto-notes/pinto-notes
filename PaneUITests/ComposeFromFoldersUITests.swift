#if os(iOS)
import XCTest

/// Compose and search from the iPhone folder list (TestFlight 1.1.1): with the account's
/// connection alerts up as the notes first showed, the launch restore's push was dropped while
/// the folder and note stayed selected. The folder list then showed the note's toolbar, compose
/// added a note no editor opened (and it was discarded later), and search raised the keyboard
/// for a field that wasn't on screen.
final class ComposeFromFoldersUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    func shot(_ name: String) {
        guard let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] else { return }
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/compose-\(name).png"))
    }

    var folderList: XCUIElement { app.navigationBars["Folders"] }

    /// Launches the way 1.1.1 was opened after unlocking: a note to restore and an alert on top.
    func launchUnderAlert() {
        app.launchArguments = ["-uitest", "-demo", "-open", "Groceries", "-launchAlert"]
        app.launch()
        let ok = app.alerts.buttons["OK"].firstMatch
        XCTAssertTrue(ok.waitForExistence(timeout: 5))
        ok.tap()
        XCTAssertTrue(folderList.waitForExistence(timeout: 3), "the folder list stays")
        Thread.sleep(forTimeInterval: 1)
    }

    func testFolderListKeepsItsOwnToolbarUnderALaunchAlert() {
        launchUnderAlert()
        shot("folders-after-alert")
        XCTAssertFalse(app.buttons["Checklist"].exists, "no note toolbar on the folder list")
        XCTAssertFalse(app.buttons["list.newNote"].exists, "no note list toolbar on the folder list")
        XCTAssertTrue(app.buttons["sidebar.newFolder"].exists, "the folder list's own New Folder")
        XCTAssertTrue(app.buttons["sidebar.newNote"].exists, "the folder list's own New Note")
        // The folder list has a search of its own now (29 October 2026): one field, on screen.
        XCTAssertLessThanOrEqual(app.searchFields.count, 1, "no second search for a list that isn't on screen")
    }

    func testComposeOpensTheNewNote() {
        launchUnderAlert()
        let count = app.descendants(matching: .any).matching(identifier: "sidebar.all").firstMatch.value as? String
        app.buttons["New Note"].firstMatch.tap()
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 3), "compose opens the new note's editor")
        shot("editor")
        // Leaving it empty discards it, so the count is back where it was.
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        XCTAssertTrue(folderList.waitForExistence(timeout: 3))
        let all = app.descendants(matching: .any).matching(identifier: "sidebar.all").firstMatch
        XCTAssertEqual(all.value as? String, count, "an empty new note left behind is discarded")
    }

    func testComposeKeepsATypedNote() {
        app.launchArguments = ["-uitest", "-demo", "-showFolders"]
        app.launch()
        XCTAssertTrue(folderList.waitForExistence(timeout: 5))
        let all = app.descendants(matching: .any).matching(identifier: "sidebar.all").firstMatch
        let before = Int((all.value as? String ?? "").split(separator: " ").first ?? "") ?? -1
        app.buttons["New Note"].firstMatch.tap()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        editor.typeText("Kept note")
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.staticTexts["Kept note"].firstMatch.waitForExistence(timeout: 3), "back shows the note in its folder")
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        XCTAssertTrue(folderList.waitForExistence(timeout: 3))
        XCTAssertEqual(all.value as? String, "\(before + 1) notes")
    }

    // MARK: The folders screen (Emil, 29 October 2026)

    func launchFolders(_ extra: [String] = []) {
        app.launchArguments = ["-uitest", "-demo", "-showFolders", "-captureAccount"] + extra
        app.launch()
        XCTAssertTrue(folderList.waitForExistence(timeout: 5))
    }

    var screen: CGRect { app.windows.firstMatch.frame }

    /// The search field in the bottom bar (a field, or the button it starts as).
    var searchField: XCUIElement {
        app.searchFields.firstMatch.exists ? app.searchFields.firstMatch : app.buttons["Search"].firstMatch
    }

    /// Titled "Folders", with no "Folders" heading over the list.
    func testTitleIsFoldersWithoutAHeading() {
        launchFolders()
        shot("folders")
        XCTAssertTrue(app.navigationBars["Folders"].exists)
        let list = app.collectionViews.firstMatch
        XCTAssertTrue(list.waitForExistence(timeout: 3))
        XCTAssertFalse(list.staticTexts["Folders"].exists, "no Folders heading over the list")
        XCTAssertFalse(list.staticTexts["FOLDERS"].exists, "no Folders heading over the list")
        XCTAssertFalse(app.navigationBars["Pinto Notes"].exists)
    }

    /// New Folder at the top left: its name is ready to type, and the folder opens.
    func testNewFolderAtTheTopLeft() {
        launchFolders()
        let button = app.buttons["sidebar.newFolder"].firstMatch
        XCTAssertTrue(button.isHittable)
        XCTAssertLessThan(button.frame.midX, screen.midX, "on the left")
        XCTAssertLessThan(button.frame.maxY, screen.height * 0.2, "in the top bar")
        XCTAssertEqual(button.label, "New Folder")
        button.tap()
        let field = app.alerts.textFields.firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 3))
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 3), "the name is ready to type")
        app.typeText("Ideas")
        app.alerts.buttons["Create"].tap()
        XCTAssertTrue(app.navigationBars["Ideas"].waitForExistence(timeout: 3), "the new folder opens")
    }

    /// Your photo at the top right, at least 36 pt across, on the New Folder button's line; it opens Settings.
    func testProfileAtTheTopRight() throws {
        launchFolders()
        let profile = app.buttons["sidebar.settings"].firstMatch
        XCTAssertTrue(profile.waitForExistence(timeout: 3))
        XCTAssertTrue(profile.isHittable)
        XCTAssertTrue(profile.label.hasPrefix("Account"), profile.label)
        XCTAssertGreaterThan(profile.frame.midX, screen.midX, "on the right")
        XCTAssertGreaterThanOrEqual(profile.frame.width, 43.5, "a finger's target")
        XCTAssertGreaterThanOrEqual(profile.frame.height, 43.5, "a finger's target")
        let newFolder = app.buttons["sidebar.newFolder"].firstMatch
        XCTAssertEqual(profile.frame.midY, newFolder.frame.midY, accuracy: 2, "on one line with New Folder")
        let drawn = try XCTUnwrap(Self.drawnWidth(profile.screenshot().image), "the photo is drawn")
        XCTAssertGreaterThanOrEqual(drawn, 36, "the photo is at least 36 pt across")
        XCTAssertLessThanOrEqual(drawn, 40, "and no more than 40")
        profile.tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5), "it opens Settings, as before")
    }

    /// Search at the bottom finds notes in every folder, and opens one in its folder.
    func testSearchFromTheFolders() {
        launchFolders()
        let field = searchField
        XCTAssertTrue(field.waitForExistence(timeout: 3))
        XCTAssertGreaterThan(field.frame.minY, screen.height * 0.8, "in the bottom bar")
        field.tap()
        app.typeText("Lisbon")
        let found = app.buttons.matching(identifier: "folders.found").firstMatch
        XCTAssertTrue(found.waitForExistence(timeout: 3), "the search finds the note in Travel")
        shot("folders-search")
        found.tap()
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 3), "the found note opens")
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.navigationBars["Travel"].waitForExistence(timeout: 3), "back leads to its folder")
    }

    /// New Note at the bottom right makes a note in Notes and opens it.
    func testNewNoteFromTheFolders() {
        launchFolders()
        let compose = app.buttons["sidebar.newNote"].firstMatch
        XCTAssertTrue(compose.isHittable)
        XCTAssertEqual(compose.label, "New Note")
        XCTAssertGreaterThan(compose.frame.minX, screen.width * 0.7, "at the right")
        XCTAssertGreaterThan(compose.frame.minY, screen.height * 0.8, "in the bottom bar")
        XCTAssertLessThan(searchField.frame.maxX, compose.frame.minX + 1, "Search is to its left")
        compose.tap()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 3), "the new note opens")
        editor.typeText("From the folders")
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.navigationBars["Notes"].waitForExistence(timeout: 3), "it was made in Notes")
        XCTAssertTrue(app.staticTexts["From the folders"].firstMatch.exists)
    }

    /// At the largest text size the bars' buttons, the title and search don't overlap.
    func testLargestTextNothingOverlaps() {
        launchFolders(["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"])
        shot("folders-xxxl")
        let items: [(String, XCUIElement)] = [
            ("New Folder", app.buttons["sidebar.newFolder"].firstMatch),
            ("Profile", app.buttons["sidebar.settings"].firstMatch),
            ("Search", searchField),
            ("New Note", app.buttons["sidebar.newNote"].firstMatch),
            ("Title", app.navigationBars["Folders"].staticTexts["Folders"].firstMatch),
        ]
        for (name, e) in items { XCTAssertTrue(e.exists && e.isHittable || name == "Title" && e.exists, "\(name) is on screen") }
        for i in items.indices {
            for j in items.indices where j > i {
                XCTAssertFalse(items[i].1.frame.intersects(items[j].1.frame), "\(items[i].0) and \(items[j].0) overlap")
            }
        }
    }

    /// How wide the drawing in a button's picture is, in points: the middle row's run of pixels
    /// that differ from its corner (the bar behind it).
    static func drawnWidth(_ image: UIImage) -> CGFloat? {
        guard let cg = image.cgImage else { return nil }
        let w = cg.width, h = cg.height
        var px = [UInt8](repeating: 0, count: w * h * 4)
        let drew = px.withUnsafeMutableBytes { buf -> Bool in
            guard let c = CGContext(data: buf.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                    space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
            c.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
            return true
        }
        guard drew else { return nil }
        func at(_ x: Int, _ y: Int) -> [Int] { let i = (y * w + x) * 4; return [Int(px[i]), Int(px[i + 1]), Int(px[i + 2])] }
        let ground = at(0, 0), y = h / 2
        let differs = (0..<w).filter { x in zip(at(x, y), ground).contains { abs($0 - $1) > 24 } }
        guard let first = differs.first, let last = differs.last else { return nil }
        return CGFloat(last - first + 1) / image.scale
    }

    /// Settings scrolled: the rows pass under the title, not through it (a picture to look at).
    func testSettingsScrolledUnderTheTitle() {
        app.launchArguments = ["-uitest", "-captureScreen", "settings"]
        app.launch()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))
        app.swipeUp()
        Thread.sleep(forTimeInterval: 1.5)
        shot("settings-scrolled")
    }
}
#endif
