#if os(iOS)
import XCTest

/// The first-run flow, end to end against a real backend (staging or the local stack, never
/// production), in a headless simulator. The store is the real one, so each step is its own
/// launch: run the tests one at a time, in the order a script gives them (the proof's script
/// makes the accounts, and uninstalls the app between "devices").
///
/// Needs TEST_RUNNER_PANE_EMAIL and TEST_RUNNER_PANE_PASSWORD. Screenshots go to $PANE_SHOTS.
final class OnboardingFlowUITests: XCTestCase {
    var app: XCUIApplication!
    var env: [String: String] { ProcessInfo.processInfo.environment }

    override func setUp() { continueAfterFailure = false }

    override func tearDown() {
        if (testRun?.failureCount ?? 0) > 0 { shot("failed-\(name.split(separator: " ").last?.dropLast() ?? "step")") }
    }

    func launch(_ extra: [String] = []) {
        app = XCUIApplication()
        app.launchArguments = ["-muteAudio", "-skipWelcome"] + extra
        app.launch()
    }

    func shot(_ name: String) {
        guard let dir = env["PANE_SHOTS"] else { return }
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(name).png"))
    }

    func pause(_ s: Double) { Thread.sleep(forTimeInterval: s) }

    var title: XCUIElement { app.staticTexts["onboarding.title"] }

    /// Email and password, then the key screen's Continue if this device is new to the account.
    func signIn() throws {
        guard let email = env["PANE_EMAIL"], let password = env["PANE_PASSWORD"] else { throw XCTSkip("no account") }
        let field = app.textFields["signin.email"]
        XCTAssertTrue(field.waitForExistence(timeout: 30), "the sign-in screen")
        field.tap()
        // A fresh simulator introduces its keyboard once.
        if app.buttons["Continue"].waitForExistence(timeout: 2) { app.buttons["Continue"].tap(); field.tap() }
        field.typeText(email)
        app.buttons["signin.submit"].tap()
        let pw = app.secureTextFields["signin.password"]
        XCTAssertTrue(pw.waitForExistence(timeout: 30), "the password step")
        pw.tap()
        pw.typeText(password)
        app.buttons["signin.submit"].tap()
        let go = app.buttons["e2ee.continue"]
        if go.waitForExistence(timeout: 45) { go.tap() }
    }

    func expectStep(_ words: String, _ picture: String, timeout: TimeInterval = 45) {
        let step = app.staticTexts.matching(NSPredicate(format: "identifier == 'onboarding.title' AND label == %@", words)).firstMatch
        XCTAssertTrue(step.waitForExistence(timeout: timeout), "the step \"\(words)\"")
        pause(0.8)
        shot(picture)
    }

    /// The notes are on screen and the flow is not.
    func expectNotes(_ picture: String) {
        let notes = app.buttons["sidebar.settings"].firstMatch
        let list = app.buttons["list.newNote"].firstMatch
        let editor = app.textViews.firstMatch
        let deadline = Date().addingTimeInterval(60)
        while Date() < deadline, !(notes.exists || list.exists || editor.exists) { pause(0.3) }
        XCTAssertTrue(notes.exists || list.exists || editor.exists, "the notes")
        pause(4)   // long enough for a late flow or sheet to show itself
        XCTAssertFalse(title.exists, "the first-run flow must not be showing")
        XCTAssertFalse(app.staticTexts["How did you hear about Pinto Notes?"].exists, "no ask right after the flow")
        shot(picture)
    }

    // MARK: A new account, skipping everything

    func testA_NewAccountSkipsEverything() throws {
        launch(["-signout"])
        try signIn()
        expectStep("Welcome to Pinto Notes", "a1-welcome")
        app.buttons["onboarding.continue"].tap()
        expectStep("What should we call you?", "a2-name-empty")
        let name = app.textFields["onboarding.name"]
        XCTAssertEqual(name.value as? String, "Your name", "an email sign-up has no name: the field shows its placeholder")
        XCTAssertTrue(app.staticTexts["onboarding.noName"].exists, "an empty name is allowed, and nudged")
        app.buttons["onboarding.continue"].tap()
        expectStep("Bring your notes", "a3-bring")
        for id in ["onboarding.source.markdown", "onboarding.source.evernote", "onboarding.source.keep"] {
            XCTAssertTrue(app.buttons[id].exists, id)
        }
        // Apple Notes on iPhone is not a choice like those: it says where it is easy.
        XCTAssertTrue(app.descendants(matching: .any)["onboarding.source.appleNotes.sendDownload"].firstMatch.exists)
        app.buttons["onboarding.skip"].tap()
        expectStep("Connect your AI", "a4-connect")
        for id in ["chatgpt", "claude", "claudeCode", "codex", "other"] { XCTAssertTrue(app.buttons["connect.guide.\(id)"].exists, id) }
        app.buttons["onboarding.skip"].tap()
        // Done: a new empty note with the cursor in it.
        let editor = app.textViews.firstMatch
        XCTAssertTrue(editor.waitForExistence(timeout: 30), "a new note is open")
        let keyboard = app.keyboards.firstMatch
        XCTAssertTrue(keyboard.waitForExistence(timeout: 10), "the cursor is in it: the keyboard is up")
        pause(4)
        XCTAssertFalse(title.exists)
        XCTAssertFalse(app.staticTexts["How did you hear about Pinto Notes?"].exists)
        shot("a5-landed-in-new-note")
    }

    /// The same account, launched again (and again on a wiped install): the notes, never the flow.
    func testB_ReturningAccountSeesNotes() throws {
        launch()
        if app.textFields["signin.email"].waitForExistence(timeout: 8) { try signIn() }
        expectNotes(env["PANE_SHOT_NAME"] ?? "b-returning")
    }

    // MARK: A new account whose name is known; quitting midway; connecting an AI

    func testC_NamedAccountQuitsAtBring() throws {
        launch(["-signout"])
        try signIn()
        expectStep("Welcome to Pinto Notes", "c1-welcome")
        app.buttons["onboarding.continue"].tap()
        expectStep("What should we call you?", "c2-name-prefilled")
        let expected = env["PANE_NAME"] ?? "Sara Lindqvist"
        let name = app.textFields["onboarding.name"]
        let deadline = Date().addingTimeInterval(15)
        while Date() < deadline, name.value as? String != expected { pause(0.3) }
        XCTAssertEqual(name.value as? String, expected, "the name the account already has")
        XCTAssertFalse(app.staticTexts["onboarding.noName"].exists)
        app.buttons["onboarding.continue"].tap()
        expectStep("Bring your notes", "c3-bring-before-quit")
        app.terminate()
    }

    /// One tool call to the notes server, as a connected AI makes it. Nothing of the token is logged.
    func callTool(_ tool: String, _ args: [String: Any], at address: URL, token: String) -> (ok: Bool, text: String) {
        var req = URLRequest(url: address, timeoutInterval: 90)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "content-type")
        req.setValue("application/json, text/event-stream", forHTTPHeaderField: "accept")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "authorization")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": ["name": tool, "arguments": args]])
        let done = expectation(description: tool)
        var ok = false
        var text = ""
        URLSession.shared.dataTask(with: req) { data, _, _ in
            let raw = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
            // A plain JSON answer, or one "data:" line of an event stream.
            let json = raw.split(separator: "\n").last { $0.hasPrefix("data:") }.map { String($0.dropFirst(5)) } ?? raw
            let obj = (try? JSONSerialization.jsonObject(with: Data(json.utf8))) as? [String: Any]
            let result = obj?["result"] as? [String: Any]
            text = ((result?["content"] as? [[String: Any]]) ?? []).compactMap { $0["text"] as? String }.joined(separator: " ")
            ok = result != nil && result?["isError"] as? Bool != true
            if let e = obj?["error"] as? [String: Any] { text = e["message"] as? String ?? "error" }
            done.fulfill()
        }.resume()
        wait(for: [done], timeout: 100)
        return (ok, String(text.prefix(300)))
    }

    /// Relaunch resumes at step 3; then an AI is connected, the Try it step shows the To-do note,
    /// an AI (this test, with the token the app just made) adds a line, and the step sees it,
    /// says so, and ends by itself in the notes on that note.
    func testD_RelaunchResumesThenConnects() throws {
        launch()
        expectStep("Bring your notes", "d1-resumed-at-bring", timeout: 60)
        XCTAssertTrue(app.descendants(matching: .any)["onboarding.source.appleNotes.sendDownload"].firstMatch.exists, "Apple Notes says where it is easy, and how to get there")
        XCTAssertTrue(app.buttons["onboarding.source.appleNotes.oneByOne"].exists, "and keeps the slow way small")
        app.buttons["onboarding.skip"].tap()
        expectStep("Connect your AI", "d2-connect")
        app.buttons["connect.guide.claudeCode"].tap()
        let create = app.buttons["Create Access Token"].firstMatch
        XCTAssertTrue(create.waitForExistence(timeout: 20), "the guide for Claude Code")
        shot("d3-guide-claude-code")
        if !create.isHittable { app.swipeUp() }
        // No picture while the token is on screen.
        create.tap()
        let snippet = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'Authorization: Bearer pane_'")).firstMatch
        XCTAssertTrue(snippet.waitForExistence(timeout: 30), "a token was made")
        let command = snippet.label
        guard let token = command.range(of: #"pane_[0-9a-f]{64}"#, options: .regularExpression).map({ String(command[$0]) }),
              let address = command.range(of: #"https?://[^\s"]+"#, options: .regularExpression).flatMap({ URL(string: String(command[$0])) }) else {
            return XCTFail("the command should hold an address and a token")
        }
        app.buttons["Done"].tap()
        let go = app.buttons["onboarding.continue"]
        XCTAssertTrue(go.waitForExistence(timeout: 30), "connected: Continue takes Skip's place")
        pause(0.8)
        shot("d4-connected")
        go.tap()
        expectStep("Try it", "d5-try-it-waiting")
        XCTAssertTrue(app.staticTexts["onboarding.prompt"].waitForExistence(timeout: 10), "Claude Code has no link: the prompt to paste")
        XCTAssertTrue(app.descendants(matching: .any)["onboarding.waiting"].firstMatch.waitForExistence(timeout: 10), "the To-do note waits on the screen")
        app.buttons["onboarding.copy"].tap()
        pause(0.6)
        shot("d6-copied")
        // The AI does what the prompt asks.
        let added = callTool("append_to_note", ["title": "To-do", "text": "- [ ] Call mom"], at: address, token: token)
        XCTAssertTrue(added.ok, "the AI's edit: \(added.text)")
        let worked = app.descendants(matching: .any)["onboarding.worked"].firstMatch
        XCTAssertTrue(worked.waitForExistence(timeout: 60), "the step sees the line arrive and says it worked")
        shot("d7-it-worked")
        // Nothing to press: the flow ends by itself, on the To-do note.
        let text = app.textViews.firstMatch
        XCTAssertTrue(text.waitForExistence(timeout: 20), "the notes open by themselves")
        pause(2)
        XCTAssertFalse(title.exists)
        XCTAssertTrue(((text.value as? String) ?? "").contains("Call mom"), "on the To-do note, with the AI's line in it")
        shot("d8-landed-in-to-do")
    }

    func openSettingsPage(_ name: String) {
        let row = app.buttons[name].firstMatch.exists ? app.buttons[name].firstMatch : app.staticTexts[name].firstMatch
        if row.waitForExistence(timeout: 5) { row.tap() }
    }

    func openSettings() {
        for _ in 0..<3 where !app.buttons["sidebar.settings"].exists {
            let back = app.navigationBars.buttons.firstMatch
            if back.exists { back.tap(); pause(0.6) }
        }
        app.buttons["sidebar.settings"].tap()
    }

    /// Settings › Show Setup Guide plays the flow again, and leaving it changes nothing.
    func testE_ReplayFromSettings() throws {
        launch()
        if app.textFields["signin.email"].waitForExistence(timeout: 8) { try signIn() }
        expectNotes("e0-notes")
        // Back to the folder list if a note or a folder is open, then the account button.
        openSettings()
        let guide = app.buttons["settings.setupGuide"]
        openSettingsPage("General")
        for _ in 0..<6 where !guide.exists { app.swipeUp() }
        XCTAssertTrue(guide.waitForExistence(timeout: 10), "Show Setup Guide")
        guide.tap()
        expectStep("Welcome to Pinto Notes", "e1-replay-welcome")
    }
}
#endif
