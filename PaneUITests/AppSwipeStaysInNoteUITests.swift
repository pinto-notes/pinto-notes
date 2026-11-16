import XCTest

/// iPhone: dragging right inside a note's app is the app's (a game's pad, a slider, a drawing), not
/// iOS 26's swipe back from anywhere. Before this, pushing right on Doom's pad slid the note away
/// toward its folder. The swipe from the screen's left edge still goes back.
final class AppSwipeStaysInNoteUITests: XCTestCase {
    private func openApp() throws -> XCUIApplication {
        let dir = NSTemporaryDirectory()
        let note = dir + "pad-note.md", page = dir + "pad-page.html"
        try "Pad\n".write(toFile: note, atomically: true, encoding: .utf8)
        try """
        <!doctype html><meta name="viewport" content="width=device-width">
        <style>html,body{margin:0;height:100%}#pad{position:fixed;inset:0;touch-action:none;background:#eee}</style>
        <div id="pad">Pad</div>
        <script>let n=0;pad.addEventListener("pointermove",()=>{pad.textContent="moved "+(++n)});</script>
        """.write(toFile: page, atomically: true, encoding: .utf8)
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-seedNote", note, "-seedPage", "Pad=\(page)", "-open", "Pad"]
        app.launch()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 30), "the note's app is open")
        return app
    }

    func testDraggingRightInsideTheAppStaysInTheNote() throws {
        #if os(iOS)
        let app = try openApp()
        let window = app.windows.firstMatch
        // A quick drag with no pause first, as a thumb pushes a pad: the kind iOS takes as a swipe back.
        let from = window.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.6))
        let to = window.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.6))
        from.press(forDuration: 0, thenDragTo: to, withVelocity: 800, thenHoldForDuration: 0.3)
        sleep(1)
        XCTAssertTrue(app.webViews.firstMatch.exists, "still in the note after the drag")
        XCTAssertTrue(app.webViews.firstMatch.isHittable, "still in the note after the drag")
        #endif
    }

    func testTheSwipeFromTheLeftEdgeStillGoesBack() throws {
        #if os(iOS)
        let app = try openApp()
        let window = app.windows.firstMatch
        let from = window.coordinate(withNormalizedOffset: CGVector(dx: 0.0, dy: 0.6)).withOffset(CGVector(dx: 2, dy: 0))
        let to = window.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.6))
        from.press(forDuration: 0.05, thenDragTo: to, withVelocity: 800, thenHoldForDuration: 0.05)
        let gone = NSPredicate(format: "exists == false")
        expectation(for: gone, evaluatedWith: app.webViews.firstMatch)
        waitForExpectations(timeout: 5)
        #endif
    }
}
