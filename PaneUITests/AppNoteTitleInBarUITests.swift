import XCTest

/// iPhone: a note showing its app names itself in the bar, after its folder (Notes › Doom). iOS's
/// back button shows only a chevron, so before this the bar said nothing about where you were.
final class AppNoteTitleInBarUITests: XCTestCase {
    func testTheBarSaysTheFolderAndTheNoteWhileItsAppShows() throws {
        #if os(iOS)
        let dir = NSTemporaryDirectory()
        let note = dir + "doom-note.md", page = dir + "doom-page.html"
        try "Doom\n".write(toFile: note, atomically: true, encoding: .utf8)
        try "<!doctype html><h1>Doom</h1><p>A game.</p>".write(toFile: page, atomically: true, encoding: .utf8)
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-seedNote", note, "-seedPage", "Doom=\(page)", "-open", "Doom"]
        app.launch()
        let folder = app.buttons["note.crumb.0"].firstMatch
        XCTAssertTrue(folder.waitForExistence(timeout: 30), "the bar shows the note's folder")
        XCTAssertEqual(folder.label, "Notes")
        let title = app.staticTexts["note.crumb.title"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 5), "and the note's title")
        XCTAssertEqual(title.label, "Doom")
        #endif
    }
}
