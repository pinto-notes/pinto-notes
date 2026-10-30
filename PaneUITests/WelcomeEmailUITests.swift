#if os(iOS)
import XCTest

/// Use email on the iPhone welcome, in the real app, offline: the email sign-in answers come from
/// a stand-in (`-mockEmailAuth`), so nothing reaches a server and no email is sent. With
/// PANE_SHOTS set, each step is saved there as a screenshot (keyboard and all), named with
/// PANE_SHOT_SUFFIX (light, dark, largest).
final class WelcomeEmailUITests: XCTestCase {
    let env = ProcessInfo.processInfo.environment

    override func setUp() { continueAfterFailure = false }

    func shot(_ name: String) {
        guard let dir = env["PANE_SHOTS"] else { return }
        Thread.sleep(forTimeInterval: 1.2)
        let suffix = env["PANE_SHOT_SUFFIX"].map { "-\($0)" } ?? ""
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(name)\(suffix).png"))
    }

    /// The welcome, skipped to its end, then Use email.
    func openEmail(_ extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-captureSignedOut", "-mockEmailAuth"] + extra
        app.launch()
        let useEmail = app.buttons["welcome.email"]
        for _ in 0..<20 where !useEmail.exists {
            app.windows.firstMatch.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3)).tap() // Tap to skip
            _ = useEmail.waitForExistence(timeout: 1)
        }
        if !useEmail.waitForExistence(timeout: 10) { print("TREE\n" + app.debugDescription) }
        XCTAssertTrue(useEmail.exists, "the way in")
        shot("0-welcome")
        useEmail.tap()
        return app
    }

    /// Played to its end, the way in comes up on its spring (scripts record it).
    func testTheWayInComesUp() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-captureSignedOut", "-mockEmailAuth"]
        app.launch()
        XCTAssertTrue(app.buttons["welcome.email"].waitForExistence(timeout: 20), "the way in")
        Thread.sleep(forTimeInterval: 1.5)
        shot("way-in")
    }

    func hasFocus(_ e: XCUIElement) -> Bool { (e.value(forKey: "hasKeyboardFocus") as? Bool) == true }

    func testUseEmailIsAFieldInPlaceThenTheCode() throws {
        let app = openEmail()
        let email = app.textFields["signin.email"]
        XCTAssertTrue(email.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["welcome.legal"].exists || app.otherElements["welcome.legal"].exists, "still the welcome: no new screen")
        XCTAssertFalse(app.buttons["welcome.apple"].exists, "Apple and Google give way to the email")
        let focus = NSPredicate { _, _ in self.hasFocus(email) }
        expectation(for: focus, evaluatedWith: email)
        waitForExpectations(timeout: 5)
        let keyboard = app.keyboards.firstMatch
        XCTAssertTrue(keyboard.waitForExistence(timeout: 5), "the keyboard is up")
        // The whole way in rises above the keyboard, the terms included.
        let legal = app.staticTexts["welcome.legal"]
        var gap = CGFloat.zero
        for _ in 0..<30 {
            gap = legal.frame.maxY - keyboard.frame.minY
            if gap <= 0 { break }
            Thread.sleep(forTimeInterval: 0.1)
        }
        XCTAssertLessThanOrEqual(gap, 0, "the terms are \(gap) pt under the keyboard")
        shot("1-email")

        let submit = app.buttons["signin.submit"]
        XCTAssertEqual(submit.label, "Continue")
        XCTAssertFalse(submit.isEnabled)
        email.typeText("new@exam")
        XCTAssertFalse(submit.isEnabled, "not an address yet")
        email.typeText("ple.com")
        XCTAssertTrue(submit.isEnabled)
        shot("2-email-typed")
        email.typeText("\n") // Return continues

        let password = app.secureTextFields["signin.password"]
        XCTAssertTrue(password.waitForExistence(timeout: 5), "a new email chooses a password")
        XCTAssertEqual(app.staticTexts["signin.title"].label, "Create your account")
        XCTAssertEqual(app.staticTexts["signin.lockedEmail"].label, "new@example.com")
        password.typeText("correct horse battery")
        shot("3-create")
        submit.tap()

        let code = app.textFields["signin.code"]
        XCTAssertTrue(code.waitForExistence(timeout: 5), "the code step")
        XCTAssertEqual(app.staticTexts["signin.title"].label, "Check your email")
        XCTAssertFalse(app.buttons["signin.resend"].isEnabled, "Resend code counts down")
        XCTAssertTrue(app.buttons["signin.resend"].label.hasPrefix("Resend code in"))
        XCTAssertFalse(app.buttons["signin.submit"].exists, "six digits confirm on their own")
        shot("4-code")

        code.typeText("111111")
        let error = app.staticTexts["signin.error"]
        XCTAssertTrue(error.waitForExistence(timeout: 5), "a wrong code says so")
        XCTAssertTrue(error.label.contains("wrong or has expired"))
        shot("5-wrong-code")

        app.buttons["signin.back"].tap() // Change
        XCTAssertTrue(email.waitForExistence(timeout: 5), "back to the field")
        XCTAssertEqual(email.value as? String, "new@example.com", "the address kept, to correct")
        expectation(for: focus, evaluatedWith: email)
        waitForExpectations(timeout: 5)
        shot("6-changed")
    }

    func testAnExistingAccountWithNoConnectionAndTheWayBack() throws {
        let app = openEmail()
        let email = app.textFields["signin.email"]
        XCTAssertTrue(email.waitForExistence(timeout: 5))
        email.typeText("offline@example.com\n")
        let password = app.secureTextFields["signin.password"]
        XCTAssertTrue(password.waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["signin.title"].label, "Sign in", "no answer about the email: no Welcome back")
        shot("7-password")
        password.typeText("hunter2\n")
        let error = app.staticTexts["signin.error"]
        XCTAssertTrue(error.waitForExistence(timeout: 5))
        XCTAssertTrue(error.label.contains("Check your connection"))
        shot("8-no-connection")

        app.buttons["signin.back"].tap() // Change
        XCTAssertTrue(email.waitForExistence(timeout: 5))
        app.buttons["signin.otherWays"].tap()
        XCTAssertTrue(app.buttons["welcome.apple"].waitForExistence(timeout: 5), "Use Apple or Google brings the buttons back")
        XCTAssertTrue(app.buttons["welcome.email"].exists)
    }

    /// The largest text size: the form still fits above the keyboard, or scrolls, and its
    /// button is never cut off.
    func testTheLargestTextSize() throws {
        let app = openEmail(["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"])
        let email = app.textFields["signin.email"]
        XCTAssertTrue(email.waitForExistence(timeout: 5))
        email.typeText("new@example.com")
        let submit = app.buttons["signin.submit"]
        XCTAssertTrue(submit.isHittable, "Continue is on screen, above the keyboard")
        shot("9-largest-email")
        submit.tap()
        let password = app.secureTextFields["signin.password"]
        XCTAssertTrue(password.waitForExistence(timeout: 5))
        password.typeText("correct horse battery")
        if !submit.isHittable { app.swipeUp() }
        submit.tap()
        XCTAssertTrue(app.textFields["signin.code"].waitForExistence(timeout: 5))
        shot("9-largest-code")
    }
}
#endif
