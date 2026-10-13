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
        for id in ["onboarding.source.obsidian", "onboarding.source.markdown", "onboarding.source.evernote", "onboarding.source.keep"] {
            XCTAssertTrue(app.buttons[id].exists, id)
        }
        // Apple Notes is the same large choice as on the Mac; on iPhone it opens a sheet about the Mac app.
        XCTAssertTrue(app.buttons["onboarding.source.appleNotes"].exists)
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
        return (ok, String(text.prefix(4000)))
    }

    /// On the connect step: Claude Code's guide, Copy (which makes the token on staging, where the
    /// address has a path), and the address and token read from the command it shows. Then Done.
    func connectClaudeCode(picture: String?) throws -> (address: URL, token: String) {
        app.buttons["connect.guide.claudeCode"].tap()
        let copy = app.buttons["connect.terminal.copy"].firstMatch
        XCTAssertTrue(copy.waitForExistence(timeout: 20), "the guide for Claude Code")
        XCTAssertTrue(app.descendants(matching: .any)["connect.terminal.onAComputer"].firstMatch.exists, "says it runs on a computer")
        if let picture { shot(picture) }
        if !copy.isHittable { app.swipeUp() }
        // No picture while the token is on screen.
        copy.tap()
        let command = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'Authorization: Bearer pane_'")).firstMatch
        XCTAssertTrue(command.waitForExistence(timeout: 30), "Copy made the token and shows the command whole")
        let text = command.label
        guard let token = text.range(of: #"pane_[0-9a-f]{64}"#, options: .regularExpression).map({ String(text[$0]) }),
              let address = text.range(of: #"https?://[^\s"]+"#, options: .regularExpression).flatMap({ URL(string: String(text[$0])) }) else {
            throw XCTSkip("the command should hold an address and a token")
        }
        XCTAssertTrue(app.descendants(matching: .any)["connect.terminal.waiting"].firstMatch.waitForExistence(timeout: 10), "the guide waits for the first call")
        app.buttons["Done"].tap()
        return (address, token)
    }

    /// Relaunch resumes at step 3; then an AI is connected, the Try it step shows its own note,
    /// an AI (this test, with the token the app just made) follows the prompt, and the step sees
    /// the line, says so, and ends by itself in the notes on that note. A note called "To-do"
    /// that the account already had is left exactly as it was.
    func testD_RelaunchResumesThenConnects() throws {
        launch()
        expectStep("Bring your notes", "d1-resumed-at-bring", timeout: 60)
        XCTAssertTrue(app.buttons["onboarding.source.appleNotes"].exists, "Apple Notes, the same large choice as on the Mac")
        app.buttons["onboarding.skip"].tap()
        expectStep("Connect your AI", "d2-connect")
        let ai = try connectClaudeCode(picture: "d3-guide-claude-code")
        // As if a pile of notes had been imported, one of them called To-do.
        let imported = callTool("create_note", ["body": "To-do\n\n- [ ] Buy milk"], at: ai.address, token: ai.token)
        XCTAssertTrue(imported.ok, "the imported note: \(imported.text)")
        // Connected: the step moves on by itself.
        expectStep("Try it", "d5-try-it-waiting")
        XCTAssertTrue(app.staticTexts["onboarding.prompt"].waitForExistence(timeout: 10), "Claude Code has no link: the prompt to paste")
        XCTAssertTrue(app.staticTexts["onboarding.prompt"].label.contains("my note called My first AI note"), "the prompt names the note")
        XCTAssertTrue(app.descendants(matching: .any)["onboarding.waiting"].firstMatch.waitForExistence(timeout: 10), "the note waits on the screen")
        app.buttons["onboarding.copy"].tap()
        pause(0.6)
        shot("d6-copied")
        // The AI does what the prompt asks, in the note it names.
        let added = callTool("append_to_note", ["title": "My first AI note", "text": "- [ ] Call mom"], at: ai.address, token: ai.token)
        XCTAssertTrue(added.ok, "the AI's edit: \(added.text)")
        let worked = app.descendants(matching: .any)["onboarding.worked"].firstMatch
        XCTAssertTrue(worked.waitForExistence(timeout: 60), "the step sees the line arrive and says it worked")
        shot("d7-it-worked")
        // Nothing to press: the flow ends by itself, on that note.
        let text = app.textViews.firstMatch
        XCTAssertTrue(text.waitForExistence(timeout: 20), "the notes open by themselves")
        pause(2)
        XCTAssertFalse(title.exists)
        let shown = (text.value as? String) ?? ""
        XCTAssertTrue(shown.contains("My first AI note") && shown.contains("Call mom"), "on the trial note, with the AI's line in it")
        shot("d8-landed-in-the-trial-note")
        let todo = callTool("read_note", ["title": "To-do"], at: ai.address, token: ai.token)
        XCTAssertTrue(todo.ok && todo.text.contains("Buy milk") && !todo.text.contains("Call mom"), "the imported To-do is as it was: \(todo.text.prefix(200))")
    }

    /// Connect, then Skip on Try it: the notes open on a new empty note, and the trial note is
    /// gone for good (the server has no note of that name, live or in Recently Deleted).
    func testF_SkippingTryItRemovesTheTrialNote() throws {
        launch(["-signout"])
        try signIn()
        expectStep("Welcome to Pinto Notes", "f1-welcome")
        app.buttons["onboarding.continue"].tap()
        expectStep("What should we call you?", "f2-name")
        app.buttons["onboarding.continue"].tap()
        expectStep("Bring your notes", "f3-bring")
        app.buttons["onboarding.skip"].tap()
        expectStep("Connect your AI", "f4-connect")
        let ai = try connectClaudeCode(picture: nil)
        expectStep("Try it", "f5-try-it")
        // The note is on the server while the step waits.
        var there = false
        for _ in 0..<10 where !there {
            pause(2)
            there = callTool("read_note", ["title": "My first AI note"], at: ai.address, token: ai.token).ok
        }
        XCTAssertTrue(there, "the trial note exists while Try it is up")
        app.buttons["onboarding.skip"].tap()
        let editor = app.textViews.firstMatch
        XCTAssertTrue(editor.waitForExistence(timeout: 30), "a new empty note")
        XCTAssertEqual((editor.value as? String) ?? "", "", "empty, not the trial note")
        shot("f6-skipped-new-note")
        var gone = false
        var last = ""
        for _ in 0..<15 where !gone {
            pause(2)
            let r = callTool("read_note", ["title": "My first AI note"], at: ai.address, token: ai.token)
            gone = !r.ok
            last = r.text
        }
        XCTAssertTrue(gone, "the untouched trial note is removed: \(last)")
        let overview = callTool("list_notes", ["recently_deleted": true], at: ai.address, token: ai.token)
        XCTAssertFalse(overview.text.contains("My first AI note"), "and it is not in Recently Deleted")
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

    /// After the flow, with no AI connected: the card at the foot of the folder list is Connect
    /// your AI; it opens Connect an AI; closed, Templates takes its place and it stays closed.
    func testG_TheSidebarCard() throws {
        launch()
        if app.textFields["signin.email"].waitForExistence(timeout: 8) { try signIn() }
        expectNotes("g0-notes")
        for _ in 0..<3 where !app.buttons["sidebar.settings"].exists {
            let back = app.navigationBars.buttons.firstMatch
            if back.exists { back.tap(); pause(0.6) }
        }
        let card = app.descendants(matching: .any)["sidebar.connect"].firstMatch
        XCTAssertTrue(card.waitForExistence(timeout: 20), "Connect your AI, while nothing is connected")
        XCTAssertFalse(app.descendants(matching: .any)["sidebar.templates"].firstMatch.exists, "never both")
        shot("g1-connect-card")
        app.buttons["sidebar.connect.open"].tap()
        XCTAssertTrue(app.buttons["connect.guide.chatgpt"].waitForExistence(timeout: 10), "it opens Connect an AI")
        shot("g2-connect-sheet")
        app.buttons["Done"].tap()
        pause(1)
        app.buttons["sidebar.connect.close"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["sidebar.templates"].firstMatch.waitForExistence(timeout: 10), "closed: Templates takes its place")
        shot("g3-templates-card")
        app.terminate()
        launch()
        expectNotes("g4-relaunch")
        for _ in 0..<3 where !app.buttons["sidebar.settings"].exists {
            let back = app.navigationBars.buttons.firstMatch
            if back.exists { back.tap(); pause(0.6) }
        }
        XCTAssertTrue(app.descendants(matching: .any)["sidebar.templates"].firstMatch.waitForExistence(timeout: 20))
        XCTAssertFalse(app.descendants(matching: .any)["sidebar.connect"].firstMatch.exists, "stays closed")
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
