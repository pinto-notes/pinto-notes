#if os(iOS)
import XCTest

/// Sign Out and Remove Notes from This iPhone, in the simulator, against a backend that isn't
/// production (staging or a local stack), with a throwaway account. Run one test at a time, in
/// order; between them the caller looks at the app's container on disk:
///
/// 1. Sign in, write two notes and get a file (`-offlineSampleFile`); they sync.
/// 2. The sign-out dialog, for its picture (PANE_SHOT names it: the caller sets the text size).
/// 3. Sign out and remove: the sign-in screen comes back. On disk the library and files are gone.
/// 4. Sign in again: the notes come back.
/// 5. With the key on this iPhone only and no recovery key saved: the choice isn't offered, the
///    dialog says why, and a button leads to the recovery key.
///
/// Needs PANE_EMAIL and PANE_PASSWORD (TEST_RUNNER_ prefixed); PANE_SHOTS keeps the screenshots.
final class SignOutRemoveUITests: XCTestCase {
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

    private func dismissFirstRunSheets() {
        for id in ["e2ee.continue", "heardFrom.skip", "shareAsk.notNow"] {
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

    private func newNote(_ text: String) {
        toList()
        let compose = app.buttons["list.newNote"]
        XCTAssertTrue(compose.waitForExistence(timeout: 10))
        compose.tap()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 5))
        editor.typeText(text)
        back()
    }

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
        dismissFirstRunSheets()
    }

    /// Settings › Account › Sign Out…, with the dialog showing.
    private func openSignOutDialog() {
        toFolders()
        app.buttons["sidebar.settings"].tap()
        let account = app.descendants(matching: .any)["settings.account"].firstMatch
        XCTAssertTrue(account.waitForExistence(timeout: 10))
        account.tap()
        let signOut = app.buttons["settings.signOut"]
        for _ in 0..<12 where !(signOut.exists && signOut.isHittable) { app.swipeUp() }
        XCTAssertTrue(signOut.waitForExistence(timeout: 5))
        signOut.tap()
        XCTAssertTrue(app.buttons["Sign Out"].waitForExistence(timeout: 5))
        Thread.sleep(forTimeInterval: 0.8)
    }

    func test1_SignInAndWrite() throws {
        guard let email = env["PANE_EMAIL"], let password = env["PANE_PASSWORD"] else { throw XCTSkip("No account configured") }
        app.launchArguments = ["-signout", "-skipWelcome", "-offlineSampleFile"]
        app.launch()
        signIn(email, password)
        newNote("Packing list\n- [ ] Passport\n- [ ] Charger")
        newNote("Ideas for the trip\nWalk the old town first.")
        // Everything goes up, the sample file with it.
        Thread.sleep(forTimeInterval: 12)
        shot("notes-before")
    }

    func test2_TheDialog() throws {
        guard env["PANE_EMAIL"] != nil else { throw XCTSkip("No account configured") }
        app.launchArguments = ["-skipWelcome"]
        app.launch()
        dismissFirstRunSheets()
        openSignOutDialog()
        shot(env["PANE_SHOT"] ?? "dialog")
    }

    func test3_SignOutAndRemove() throws {
        guard env["PANE_EMAIL"] != nil else { throw XCTSkip("No account configured") }
        app.launchArguments = ["-skipWelcome"]
        app.launch()
        dismissFirstRunSheets()
        openSignOutDialog()
        let remove = app.buttons["Sign Out and Remove Notes from This iPhone"].firstMatch
        XCTAssertTrue(remove.exists && remove.isEnabled, "offered")
        remove.tap()
        XCTAssertTrue(app.textFields["signin.email"].waitForExistence(timeout: 60), "signed out")
        Thread.sleep(forTimeInterval: 2)
        shot("signed-out")
    }

    func test4_SignInAgainAndTheNotesComeBack() throws {
        guard let email = env["PANE_EMAIL"], let password = env["PANE_PASSWORD"] else { throw XCTSkip("No account configured") }
        app.launchArguments = ["-skipWelcome"]
        app.launch()
        signIn(email, password)
        toList()
        let packing = app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "Packing list")).firstMatch
        XCTAssertTrue(packing.waitForExistence(timeout: 40), "the notes came back")
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "Ideas for the trip")).firstMatch.waitForExistence(timeout: 10))
        Thread.sleep(forTimeInterval: 5)
        shot("notes-after")
    }

    func test5_AKeyOnThisIPhoneOnlyNeedsARecoveryKeyFirst() throws {
        // Signed in, with the key kept on this iPhone only (an unsigned simulator build has no
        // Keychain group, or `-keyFault synced`), and no recovery key saved.
        guard env["PANE_EMAIL"] != nil else { throw XCTSkip("No account configured") }
        app.launchArguments = ["-skipWelcome"]
        app.launch()
        dismissFirstRunSheets()
        openSignOutDialog()
        // iOS leaves a disabled choice out of the dialog altogether, so the message says why it
        // isn't there; the Mac shows it greyed.
        let remove = app.buttons["Sign Out and Remove Notes from This iPhone"].firstMatch
        XCTAssertFalse(remove.exists && remove.isEnabled, "not offered: nothing else holds the key")
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "Save your recovery key first")).firstMatch.exists, "and the dialog says why")
        let save = app.buttons["Save a Recovery Key\u{2026}"].firstMatch
        XCTAssertTrue(save.exists)
        save.tap()
        XCTAssertTrue(app.descendants(matching: .any)["privacy.saveRecovery"].firstMatch.waitForExistence(timeout: 10), "it opens Security, where the recovery key is saved")
        shot("security-from-dialog")
    }
}
#endif
