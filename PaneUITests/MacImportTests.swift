#if os(macOS)
import XCTest

/// Imports one real Apple Note into an in-memory library and captures how it renders.
final class MacImportTests: XCTestCase {
    func testImportOneNote() throws {
        let target = ProcessInfo.processInfo.environment["PANE_IMPORT_NOTE"] ?? "Buy list"
        let app = XCUIApplication()
        app.launchArguments = ["-uitest"]
        app.launch()
        app.activate()
        app.menuBars.menuBarItems["File"].click()
        app.menuItems["Import from Apple Notes…"].click()
        let search = app.textFields["Search"].firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 15))
        // Everything is picked when the sheet opens: clear that, then pick the one note.
        search.click()
        search.typeText(target)
        let all = app.buttons["import.selectAll"].firstMatch
        XCTAssertTrue(all.waitForExistence(timeout: 10))
        if all.label == "Deselect All" { all.click() }
        let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", target)).firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 10))
        row.click()
        app.buttons["import.start"].click()
        // The sheet closes by itself and the window says what came over.
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "import.doneLine").firstMatch.waitForExistence(timeout: 30))
        let title = target.hasPrefix("# ") ? String(target.dropFirst(2)) : target
        app.descendants(matching: .any).matching(identifier: "note.\(title)").firstMatch.click()
        Thread.sleep(forTimeInterval: 1.5)
        let a = XCTAttachment(screenshot: app.windows.firstMatch.screenshot())
        a.name = "01-imported"
        a.lifetime = .keepAlways
        add(a)
        let editor = app.textViews["editor"].firstMatch
        let text = editor.value as? String ?? ""
        let b = XCTAttachment(string: text)
        b.name = "02-markdown"
        b.lifetime = .keepAlways
        add(b)
    }
}
#endif
