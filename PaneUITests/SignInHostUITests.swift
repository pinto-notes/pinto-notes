#if os(iOS)
import XCTest

/// The system asks before a web sign-in opens: "Pinto Notes" Wants to Use "<host>" to Sign In.
/// With PANE_AUTH_HOST set for the build's backend, that host is the project's own domain rather
/// than <ref>.supabase.co. Taps Sign in with Google, reads the prompt, lets the page load and
/// closes it: nothing is typed and nobody signs in. Needs PANE_EXPECT_AUTH_HOST (the host the
/// prompt should name, for a build made with that configuration); skips without it.
final class SignInHostUITests: XCTestCase {
    func testThePromptNamesTheSignInHost() throws {
        let env = ProcessInfo.processInfo.environment
        guard let host = env["PANE_EXPECT_AUTH_HOST"], !host.isEmpty else { throw XCTSkip("no host to expect") }
        func shot(_ name: String) {
            guard let dir = env["PANE_SHOTS"] else { return }
            try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/signin-host-\(name).png"))
        }
        let app = XCUIApplication()
        app.launchArguments = ["-synctest", "-signout", "-skipWelcome"]
        app.launch()
        let google = app.descendants(matching: .any)["signin.google"].firstMatch
        XCTAssertTrue(google.waitForExistence(timeout: 15))
        google.tap()

        let prompt = XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch
        XCTAssertTrue(prompt.waitForExistence(timeout: 10), "the system asks before the sign-in opens")
        let words = ([prompt.label] + prompt.staticTexts.allElementsBoundByIndex.map(\.label)).joined(separator: " ")
        shot("prompt")
        XCTAssertTrue(words.contains(host), "the prompt names \(host): \(words)")
        XCTAssertFalse(words.contains("supabase.co") && !host.contains("supabase.co"), "the prompt doesn't name the backend's own host: \(words)")

        // On to the provider's page, to see that the address really opens there. Then out again.
        prompt.buttons["Continue"].tap()
        let page = app.webViews.firstMatch
        XCTAssertTrue(page.waitForExistence(timeout: 20), "the sign-in page opens")
        XCTAssertTrue(page.staticTexts.firstMatch.waitForExistence(timeout: 20), "the provider's page loads")
        Thread.sleep(forTimeInterval: 2)
        shot("page")
        let cancel = app.buttons["Cancel"].firstMatch
        if cancel.waitForExistence(timeout: 5) { cancel.tap() }
        XCTAssertTrue(google.waitForExistence(timeout: 10), "closing the page comes back to the sign-in screen, with no error")
    }
}
#endif
