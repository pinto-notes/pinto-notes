#if os(iOS)
import XCTest

/// Signing in opens the notes on a new device (docs/Technical/recoverable-key.md), in simulators,
/// against a backend that isn't production (staging or a local stack) with throwaway accounts.
/// Each test is one step on one simulator; the caller runs them in order on the right ones:
///
/// 1. First device: sign in to a new account. The welcome says signing in opens the notes on
///    other devices; Security shows the copy Pinto Notes keeps, and the switch, off.
/// 2. Second device: sign in. No "Link this iPhone to open your notes", no code: the note is there.
/// 3. First device: Advanced protection. The copy's row goes, Add a device comes back.
/// 4. A third device then signs in and is asked to link, as every device was before.
/// 5. A device of an account from before, updated to this build: it is asked first, and Continue
///    answers the question.
/// 6. Another device of that account, waiting at the linking screen: it opens by itself once
///    step 5 is done.
///
/// Needs PANE_EMAIL and PANE_PASSWORD (TEST_RUNNER_ prefixed); PANE_SHOTS keeps the screenshots.
final class KeyCopyUITests: XCTestCase {
    var app: XCUIApplication!
    var env: [String: String] { ProcessInfo.processInfo.environment }

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    private func shot(_ name: String) {
        let s = XCUIScreen.main.screenshot()
        let a = XCTAttachment(screenshot: s)
        a.name = name
        a.lifetime = .keepAlways
        add(a)
        if let dir = env["PANE_SHOTS"] {
            try? s.pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(name).png"))
        }
    }

    private func text(_ part: String) -> XCUIElement {
        app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", part)).firstMatch
    }

    private func dismissFirstRunSheets() {
        for id in ["e2ee.continue", "heardFrom.skip", "shareAsk.notNow", "whatsNew.dismiss"] {
            let b = app.buttons[id]
            if b.waitForExistence(timeout: 1.5) { b.tap() }
        }
    }

    private func back() {
        app.navigationBars.element(boundBy: 0).buttons.element(boundBy: 0).tap()
    }

    private func toList() {
        let compose = app.buttons["list.newNote"]
        for _ in 0..<3 where !compose.waitForExistence(timeout: 2) { back() }
    }

    private func toFolders() {
        for _ in 0..<3 where !app.navigationBars["Pinto Notes"].exists { back(); _ = app.navigationBars["Pinto Notes"].waitForExistence(timeout: 1.5) }
    }

    /// Types the email and the password; what comes next is the test's to look at.
    private func signIn(_ email: String, _ password: String) {
        let field = app.textFields["signin.email"]
        XCTAssertTrue(field.waitForExistence(timeout: 20))
        field.tap()
        field.typeText(email)
        app.buttons["signin.submit"].tap()
        let pw = app.secureTextFields["signin.password"]
        XCTAssertTrue(pw.waitForExistence(timeout: 15))
        pw.tap()
        pw.typeText(password)
        app.buttons["signin.submit"].tap()
    }

    private func openSecurity() {
        toFolders()
        app.buttons["sidebar.settings"].tap()
        let security = app.descendants(matching: .any)["settings.security"].firstMatch
        XCTAssertTrue(security.waitForExistence(timeout: 10))
        security.tap()
        XCTAssertTrue(app.descendants(matching: .any)["privacy.summary"].firstMatch.waitForExistence(timeout: 10))
        // The key's state comes with the next check of the server.
        Thread.sleep(forTimeInterval: 3)
    }

    private func credentials() throws -> (String, String) {
        guard let email = env["PANE_EMAIL"], let password = env["PANE_PASSWORD"] else { throw XCTSkip("No account configured") }
        return (email, password)
    }

    func test1_TheFirstDeviceStoresACopy() throws {
        let (email, password) = try credentials()
        app.launchArguments = ["-signout", "-skipWelcome"]
        app.launch()
        signIn(email, password)
        XCTAssertTrue(app.buttons["e2ee.continue"].waitForExistence(timeout: 40), "the key was made")
        XCTAssertTrue(text("Signing in opens them on your other devices").waitForExistence(timeout: 5), "and the welcome says what a copy means")
        shot("1-first-device-welcome")
        dismissFirstRunSheets()
        toList()
        let compose = app.buttons["list.newNote"]
        XCTAssertTrue(compose.waitForExistence(timeout: 10))
        compose.tap()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 5))
        editor.typeText("Groceries\nMilk, eggs, oat milk")
        back()
        Thread.sleep(forTimeInterval: 10)
        openSecurity()
        XCTAssertTrue(app.descendants(matching: .any)["privacy.serverCopy"].firstMatch.waitForExistence(timeout: 15), "Pinto Notes keeps a copy")
        XCTAssertTrue(text("Signing in opens your notes on a new device").exists)
        XCTAssertFalse(app.buttons["privacy.addDevice"].exists, "nothing to add: a new device signs in")
        shot("1-first-device-security")
        let strict = app.switches["privacy.strict"].firstMatch
        for _ in 0..<6 where !(strict.exists && strict.isHittable) { app.swipeUp() }
        XCTAssertTrue(strict.exists)
        XCTAssertEqual(strict.value as? String, "0")
        shot("1-first-device-switch")
    }

    /// On the account's only device, with no recovery key saved: Advanced protection doesn't turn on
    /// until the recovery key has been shown and saved. Then it's turned off again, for the steps after.
    func test1b_AdvancedProtectionShowsTheRecoveryKeyFirst() throws {
        _ = try credentials()
        app.launchArguments = ["-skipWelcome", "-ownerConfirmed"]
        app.launch()
        dismissFirstRunSheets()
        openSecurity()
        let strict = app.switches["privacy.strict"].firstMatch
        for _ in 0..<6 where !(strict.exists && strict.isHittable) { app.swipeUp() }
        func turn() { if strict.switches.firstMatch.exists { strict.switches.firstMatch.tap() } else { strict.coordinate(withNormalizedOffset: CGVector(dx: 0.92, dy: 0.5)).tap() } }
        turn()
        let confirm = app.buttons["privacy.confirmStrict"].firstMatch
        XCTAssertTrue(confirm.waitForExistence(timeout: 5))
        confirm.tap()
        // Nothing else could open the notes: it asks for the recovery key to be saved first.
        let saveFirst = app.buttons["privacy.saveFirst"].firstMatch
        XCTAssertTrue(saveFirst.waitForExistence(timeout: 15), "asked to save the recovery key first: \(app.debugDescription.prefix(600))")
        XCTAssertEqual(app.switches["privacy.strict"].firstMatch.value as? String, "0", "not on yet")
        shot("1b-save-first")
        saveFirst.tap()
        let key = app.descendants(matching: .any)["recovery.key"].firstMatch
        XCTAssertTrue(key.waitForExistence(timeout: 10), "the recovery key is shown")
        shot("1b-recovery-key")
        app.buttons["recovery.copy"].firstMatch.tap()
        Thread.sleep(forTimeInterval: 2)
        if app.buttons["Done"].firstMatch.exists { app.buttons["Done"].firstMatch.tap() }
        // Saved: now it turns on, and the copy's row goes.
        let on = NSPredicate(format: "value == '1'")
        XCTAssertEqual(XCTWaiter().wait(for: [XCTNSPredicateExpectation(predicate: on, object: app.switches["privacy.strict"].firstMatch)], timeout: 20), .completed, "on once the key was saved")
        shot("1b-strict-on")
        // Off again: a copy goes back, said as the person's choice.
        turn()
        let off = app.buttons["privacy.confirmStandard"].firstMatch
        XCTAssertTrue(off.waitForExistence(timeout: 5))
        off.tap()
        let isOff = NSPredicate(format: "value == '0'")
        XCTAssertEqual(XCTWaiter().wait(for: [XCTNSPredicateExpectation(predicate: isOff, object: app.switches["privacy.strict"].firstMatch)], timeout: 20), .completed, "off again")
        shot("1b-strict-off")
    }

    func test2_TheSecondDeviceOpensBySigningIn() throws {
        let (email, password) = try credentials()
        app.launchArguments = ["-signout", "-skipWelcome"]
        app.launch()
        signIn(email, password)
        XCTAssertTrue(app.buttons["e2ee.continue"].waitForExistence(timeout: 40), "the notes open: \(app.debugDescription.prefix(600))")
        XCTAssertFalse(text("Link this iPhone to open your notes").exists, "no linking screen")
        XCTAssertFalse(app.descendants(matching: .any)["e2ee.useRecovery"].firstMatch.exists, "no recovery key asked")
        shot("2-second-device-welcome")
        dismissFirstRunSheets()
        toList()
        XCTAssertTrue(text("Groceries").waitForExistence(timeout: 40), "the first device's note is here")
        shot("2-second-device-notes")
        openSecurity()
        XCTAssertTrue(app.descendants(matching: .any)["privacy.serverCopy"].firstMatch.waitForExistence(timeout: 15))
        shot("2-second-device-security")
    }

    func test3_AdvancedProtection() throws {
        _ = try credentials()
        // The simulator has no passcode to confirm the change with (DeviceOwner, debug builds only).
        app.launchArguments = ["-skipWelcome", "-ownerConfirmed"]
        app.launch()
        dismissFirstRunSheets()
        openSecurity()
        let strict = app.switches["privacy.strict"].firstMatch
        for _ in 0..<6 where !(strict.exists && strict.isHittable) { app.swipeUp() }
        XCTAssertTrue(strict.exists)
        // The switch itself, at the row's trailing edge: a tap on the label doesn't turn it.
        if strict.switches.firstMatch.exists { strict.switches.firstMatch.tap() } else { strict.coordinate(withNormalizedOffset: CGVector(dx: 0.92, dy: 0.5)).tap() }
        let confirm = app.buttons["privacy.confirmStrict"].firstMatch
        XCTAssertTrue(confirm.waitForExistence(timeout: 5), "asked once more")
        shot("3-strict-question")
        confirm.tap()
        Thread.sleep(forTimeInterval: 6)
        shot("3-strict-after-confirm")
        XCTAssertEqual(app.switches["privacy.strict"].firstMatch.value as? String, "1", "on")
        shot("3-strict-on")
        for _ in 0..<4 { app.swipeDown() }
        XCTAssertFalse(app.descendants(matching: .any)["privacy.serverCopy"].firstMatch.exists, "the copy is gone")
        XCTAssertTrue(app.buttons["privacy.addDevice"].waitForExistence(timeout: 5), "and a new device is added from here again")
        shot("3-strict-security")
    }

    func test4_ANewDeviceOfAStrictAccountIsAskedToLink() throws {
        let (email, password) = try credentials()
        app.launchArguments = ["-signout", "-skipWelcome"]
        app.launch()
        signIn(email, password)
        XCTAssertTrue(text("Link this iPhone to open your notes").waitForExistence(timeout: 40), "the linking screen, as before")
        XCTAssertFalse(app.descendants(matching: .any)["e2ee.waitForOther"].firstMatch.exists, "nothing else will open it")
        Thread.sleep(forTimeInterval: 2)
        shot("4-strict-new-device")
    }

    func test5_AnAccountFromBeforeIsAskedFirst() throws {
        _ = try credentials()
        // Signed in by the build from before, which made the key; this build is installed over it.
        app.launchArguments = ["-skipWelcome"]
        app.launch()
        let ask = text("Signing in now opens your notes")
        XCTAssertTrue(ask.waitForExistence(timeout: 40), "asked before anything is copied: \(app.debugDescription.prefix(600))")
        Thread.sleep(forTimeInterval: 1)
        shot("5-from-before-asked")
        app.buttons["keyAsk.continue"].firstMatch.tap()
        let gone = NSPredicate(format: "exists == false")
        XCTAssertEqual(XCTWaiter().wait(for: [XCTNSPredicateExpectation(predicate: gone, object: app.buttons["keyAsk.continue"].firstMatch)], timeout: 30), .completed, "the question is gone")
        shot("5-from-before-answered")
        // That the copy is stored is step 6's to show: the device waiting there opens by itself.
    }

    func test6_AWaitingDeviceOpensByItself() throws {
        let (email, password) = try credentials()
        app.launchArguments = ["-signout", "-skipWelcome"]
        app.launch()
        signIn(email, password)
        XCTAssertTrue(text("Link this iPhone to open your notes").waitForExistence(timeout: 40), "nothing is copied yet, so it waits")
        XCTAssertTrue(app.descendants(matching: .any)["e2ee.waitForOther"].firstMatch.waitForExistence(timeout: 20), "and says what else opens it")
        Thread.sleep(forTimeInterval: 1)
        shot("6-waiting")
        // The other device answers the question meanwhile (step 5): nothing is touched here.
        XCTAssertTrue(app.buttons["e2ee.continue"].waitForExistence(timeout: 420), "it opened by itself")
        XCTAssertFalse(text("Link this iPhone to open your notes").exists)
        shot("6-opened-by-itself")
    }
}
#endif
