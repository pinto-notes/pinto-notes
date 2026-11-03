#if os(iOS)
import XCTest

/// Pictures of the app on iPad in both orientations, for the iPad and iPhone Duo work (Emil,
/// 3 November 2026). Runs on an iPad simulator; writes PNGs to $PANE_SHOTS. Skipped on iPhone.
///   PANE_SHOTS=<dir> xcodebuild test … -only-testing:PaneUITests/TabletShotsTests
final class TabletShotsTests: XCTestCase {
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = true
        try XCTSkipUnless(UIDevice.current.userInterfaceIdiom == .pad, "iPad only")
    }

    override func tearDown() {
        XCUIDevice.shared.orientation = .portrait
        app?.terminate()
    }

    private func launch(_ extra: [String] = []) {
        app = XCUIApplication()
        let look = ProcessInfo.processInfo.environment["PANE_COLUMN_LOOK"].map { ["-columnLook", $0] } ?? []
        app.launchArguments = ["-uitest", "-demo"] + look + extra
        app.launch()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10))
        Thread.sleep(forTimeInterval: 2.5)
    }

    private func shot(_ name: String) {
        let dir = ProcessInfo.processInfo.environment["PANE_SHOTS"] ?? "/tmp/pane-shots"
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        let png = XCUIScreen.main.screenshot().pngRepresentation
        let device = ProcessInfo.processInfo.environment["SIMULATOR_DEVICE_NAME"] ?? "ipad"
        try? png.write(to: URL(fileURLWithPath: "\(dir)/\(device)-\(name).png"))
    }

    private func rotate(_ o: UIDeviceOrientation) {
        XCUIDevice.shared.orientation = o
        Thread.sleep(forTimeInterval: 1.5)
    }

    func testOrientations() {
        launch(["-open", "Lisbon"])
        shot("portrait-note")
        rotate(.landscapeLeft)
        shot("landscape-note")
        rotate(.portrait)
        shot("portrait-back")
    }

    func testLandscapeList() {
        XCUIDevice.shared.orientation = .landscapeLeft
        launch()
        shot("landscape-list")
        launch(["-open", "Groceries"])
        shot("landscape-groceries")
    }
}
#endif
