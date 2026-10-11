import XCTest

/// Note apps, end to end against a real backend (staging, never production): sign in, make an access
/// token in the app, and with that token an AI makes an app in a note, changes it and changes its
/// data, while the app shows each step. The store is the real one, so the steps are separate
/// launches: run the tests one at a time, in order.
///
/// Needs TEST_RUNNER_PANE_EMAIL and TEST_RUNNER_PANE_PASSWORD (an account that exists), and
/// TEST_RUNNER_PANE_TOKEN_FILE, a path the first step writes the token to and the others read.
/// Screenshots go to $PANE_SHOTS; none is taken while the token is on screen.
final class NoteAppsStagingUITests: XCTestCase {
    var app: XCUIApplication!
    var env: [String: String] { ProcessInfo.processInfo.environment }
    static let noteTitle = "Water tracker"

    /// Set while the token is on screen: no picture then, not even of a failure.
    var tokenShowing = false

    override func setUp() { continueAfterFailure = false }

    override func tearDown() {
        if (testRun?.failureCount ?? 0) > 0, !tokenShowing { shot("failed-\(name.split(separator: " ").last?.dropLast() ?? "step")") }
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

    func web(_ label: String) -> XCUIElement {
        app.webViews.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
    }

    /// The number the water tracker shows.
    func count() -> Int {
        let n = app.webViews.staticTexts.matching(NSPredicate(format: "label MATCHES '[0-9]+'")).firstMatch
        return n.waitForExistence(timeout: 5) ? Int(n.label) ?? 0 : 0
    }

    /// The token and the server's address, as the first step saved them: "<address>\n<token>".
    func connection() throws -> (url: URL, token: String) {
        guard let path = env["PANE_TOKEN_FILE"], let saved = try? String(contentsOfFile: path, encoding: .utf8) else { throw XCTSkip("No token yet: run testA first.") }
        let lines = saved.split(separator: "\n").map(String.init)
        guard lines.count == 2, let url = URL(string: lines[0]) else { throw XCTSkip("No token yet: run testA first.") }
        return (url, lines[1])
    }

    /// One tool call. Returns the result's structured content, or its text under "text".
    @discardableResult
    func mcp(_ tool: String, _ args: [String: Any]) throws -> [String: Any] {
        let c = try connection()
        var req = URLRequest(url: c.url, timeoutInterval: 90)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "content-type")
        req.setValue("application/json, text/event-stream", forHTTPHeaderField: "accept")
        req.setValue("Bearer \(c.token)", forHTTPHeaderField: "authorization")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": ["name": tool, "arguments": args]])
        let done = expectation(description: tool)
        var out: [String: Any] = [:]
        URLSession.shared.dataTask(with: req) { data, _, _ in
            let obj = data.flatMap { try? JSONSerialization.jsonObject(with: $0) } as? [String: Any]
            let result = obj?["result"] as? [String: Any]
            out = result?["structuredContent"] as? [String: Any] ?? [:]
            let text = ((result?["content"] as? [[String: Any]]) ?? []).compactMap { $0["text"] as? String }.joined(separator: "\n")
            if !text.isEmpty { out["text"] = text }
            if result?["isError"] as? Bool == true { out["isError"] = true }
            if let e = obj?["error"] as? [String: Any] { out["isError"] = true; out["text"] = e["message"] as? String ?? "error" }
            done.fulfill()
        }.resume()
        wait(for: [done], timeout: 100)
        if let dir = env["PANE_SHOTS"] {
            let line = "\(tool): \(out["isError"] as? Bool == true ? "ERROR " : "ok ")\(String(describing: out["text"] ?? "").prefix(1500))\n\n"
            let url = URL(fileURLWithPath: "\(dir)/mcp.log")
            let before = (try? String(contentsOf: url, encoding: .utf8)) ?? ""
            try? (before + line).write(to: url, atomically: true, encoding: .utf8)
        }
        XCTAssertNil(out["isError"], "\(tool) failed: \(out["text"] ?? "")")
        return out
    }

    /// The note of that title, if the account has one.
    func noteID(_ title: String = noteTitle) throws -> String? {
        let found = try mcp("search_notes", ["query": title])
        let notes = (found["notes"] as? [[String: Any]]) ?? (found["results"] as? [[String: Any]]) ?? []
        return notes.first(where: { ($0["title"] as? String) == title })?["id"] as? String
    }

    /// The note of that title: the one there, or a new one with this text under the title.
    func note(_ title: String, text: String) throws -> String {
        if let id = try noteID(title) { return id }
        let made = try mcp("create_note", ["body": "\(title)\n\n\(text)"])
        let id = ((made["created"] as? [String: Any])?["id"] as? String) ?? ""
        XCTAssertFalse(id.isEmpty, "create_note should return the note's id: \(made)")
        return id
    }

    /// Opens the note from the list. The iPhone app comes back to the note it had open, so the
    /// note may be on screen already.
    func openNote(_ title: String = noteTitle) {
        let row = app.staticTexts[title].firstMatch
        let deadline = Date().addingTimeInterval(40)
        while Date() < deadline, !row.exists {
            if app.buttons["editor.more"].firstMatch.exists {
                if app.webViews.staticTexts[title].firstMatch.exists || (app.textViews["editor"].firstMatch.value as? String ?? "").hasPrefix(title) { return }
                app.navigationBars.buttons.element(boundBy: 0).tap() // another note is open: back to the list
            }
            pause(1)
        }
        XCTAssertTrue(row.exists, "the note should reach the list by sync")
        // A new account is asked where it heard of the app, over the list.
        pause(1.5)
        if app.buttons["heardFrom.skip"].firstMatch.exists { app.buttons["heardFrom.skip"].firstMatch.tap(); pause(1) }
        row.tap()
    }

    /// Cards a new account meets on the way in (the encryption card, where it heard of the app,
    /// the first-open card): each is answered until the note list shows.
    func passFirstRunCards() {
        let deadline = Date().addingTimeInterval(75)
        var quiet = 0
        while Date() < deadline, quiet < 3 {
            pause(1.5)
            var tapped = false
            for id in ["heardFrom.skip", "firstOpen.start"] where app.buttons[id].firstMatch.exists { app.buttons[id].firstMatch.tap(); tapped = true }
            let go = app.buttons["Continue"].firstMatch
            if !tapped, go.exists, go.isHittable, !app.textFields["signin.email"].exists { go.tap(); tapped = true }
            if tapped { quiet = 0 } else if app.buttons["list.newNote"].firstMatch.exists || app.buttons["sidebar.settings"].firstMatch.exists { quiet += 1 }
        }
    }

    static let v1 = """
    <!doctype html><html><head><meta charset="utf-8"><title>Water</title>
    <style>body{font:17px -apple-system,system-ui;margin:24px;color:var(--amber-text,#222)}button{font:inherit;padding:12px 18px;border-radius:12px;border:1px solid #8884;background:#f5a62333}#n{font-size:64px;font-weight:700;margin:16px 0}</style></head>
    <body><h1>Water tracker</h1><p>Glasses today</p><div id="n">0</div><button id="add">Add a glass</button>
    <script>
    const show = () => { document.getElementById("n").textContent = String((amber.data.values || {}).glasses || 0); };
    amber.onChange(show);
    document.getElementById("add").onclick = () => amber.store.set("glasses", ((amber.data.values || {}).glasses || 0) + 1);
    </script></body></html>
    """

    // MARK: The steps

    /// Signs in and makes a Claude Code access token in Settings. Nothing of it is logged or pictured.
    func testA_SignInAndMakeAToken() throws {
        guard let email = env["PANE_EMAIL"], let password = env["PANE_PASSWORD"], let tokenFile = env["PANE_TOKEN_FILE"] else { throw XCTSkip("no account") }
        launch(["-signout"])
        let field = app.textFields["signin.email"]
        XCTAssertTrue(field.waitForExistence(timeout: 15))
        field.tap(); field.typeText(email)
        app.buttons["signin.submit"].tap()
        let pw = app.secureTextFields["signin.password"]
        XCTAssertTrue(pw.waitForExistence(timeout: 15), "an existing account asks for its password")
        pw.tap(); pw.typeText(password)
        app.buttons["signin.submit"].tap()
        passFirstRunCards()
        // A real new account starts with an empty Notes folder and the setup card.
        XCTAssertTrue(app.buttons["list.newNote"].firstMatch.waitForExistence(timeout: 10) || app.buttons["sidebar.settings"].firstMatch.exists, "signed in, the note list shows")
        shot("01-signed-in-list")
        let settings = app.buttons["sidebar.settings"].firstMatch
        if !settings.exists { app.navigationBars.buttons.element(boundBy: 0).tap() }
        XCTAssertTrue(settings.waitForExistence(timeout: 8))
        settings.tap()
        let ai = app.descendants(matching: .any)["settings.ai"].firstMatch
        XCTAssertTrue(ai.waitForExistence(timeout: 8))
        ai.tap()
        let guide = app.descendants(matching: .any)["connect.guide.claudeCode"].firstMatch
        XCTAssertTrue(guide.waitForExistence(timeout: 8))
        guide.tap()
        let make = app.buttons["Create Access Token"].firstMatch
        XCTAssertTrue(make.waitForExistence(timeout: 8))
        tokenShowing = true
        make.tap()
        let snippet = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'Authorization: Bearer pane_'")).firstMatch
        XCTAssertTrue(snippet.waitForExistence(timeout: 20), "the command with the token should show")
        let text = snippet.label
        guard let token = text.range(of: #"pane_[0-9a-f]{64}"#, options: .regularExpression).map({ String(text[$0]) }),
              let address = text.range(of: #"https?://[^\s"]+"#, options: .regularExpression).map({ String(text[$0]) }) else {
            XCTFail("The command should hold an address and a token.")
            return
        }
        try "\(address)\n\(token)".write(toFile: tokenFile, atomically: true, encoding: .utf8)
        try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: tokenFile)
    }

    /// The AI makes a note and gives it an app; the app shows it, and a tap in it is kept.
    func testB_AnAppMadeOverMCPRunsAndKeepsItsData() throws {
        _ = try connection()
        let id = try note(Self.noteTitle, text: "Glasses of water, counted by the app.")
        try mcp("set_note_page", ["id": id, "html": Self.v1])
        launch()
        openNote()
        let add = web("Add a glass")
        XCTAssertTrue(add.waitForExistence(timeout: 30), "the note should open as its app")
        pause(1)
        shot("02-app-made-by-ai")
        let before = count()
        add.tap(); pause(0.8); add.tap()
        XCTAssertTrue(web("\(before + 2)").waitForExistence(timeout: 8), "two taps should count two more")
        pause(1)
        shot("03-two-glasses")
        // The app's data reaches the server, where the AI reads it.
        var seen = false, waited = 0.0
        while !seen, waited < 60 {
            pause(3); waited += 3
            seen = "\(try mcp("get_page_data", ["id": id])["data"] ?? "")".contains("glasses")
        }
        XCTAssertTrue(seen, "the AI should read what the app saved within a minute")
        if let dir = env["PANE_SHOTS"] { try? "data reached the server after about \(Int(waited)) s\n".write(toFile: "\(dir)/data-push.txt", atomically: true, encoding: .utf8) }
    }

    /// After a relaunch the count is still there; the AI changes the app while it's open, and Undo
    /// brings the app before back.
    func testC_DataSurvivesRelaunchAndAnAIEditArrivesWithUndo() throws {
        let id = try XCTUnwrap(try noteID())
        launch()
        openNote()
        XCTAssertTrue(app.webViews.staticTexts[Self.noteTitle].firstMatch.waitForExistence(timeout: 30))
        // What the server holds is what the last launch counted: it shows again after the relaunch.
        let kept = (((try mcp("get_page_data", ["id": id])["data"] as? [String: Any])?["values"] as? [String: Any])?["glasses"] as? Int) ?? -1
        XCTAssertGreaterThanOrEqual(kept, 2)
        XCTAssertTrue(web("\(kept)").waitForExistence(timeout: 8), "the count should survive a relaunch")
        shot("04-after-relaunch")
        // A wording this device has never run (a rerun starts from whatever the last run left).
        let was = app.webViews.buttons.firstMatch.label
        let becomes = "Drink one (\(Int.random(in: 100...999)))"
        let edits = [["old_text": "\(was)</button>", "new_text": "\(becomes)</button>"]]
        try mcp("edit_note_page", ["id": id, "edits": edits])
        // The changed app arrives while the note is open, with a receipt that offers Undo for a
        // few seconds.
        let undo = app.buttons["Undo"].firstMatch
        let sent = Date()
        var receiptAt: Double?, appAt: Double?
        while Date().timeIntervalSince(sent) < 45, receiptAt == nil || appAt == nil {
            let t = Date().timeIntervalSince(sent)
            if receiptAt == nil, undo.exists { receiptAt = t; shot("05-ai-changed-the-app") }
            if appAt == nil, web(becomes).exists { appAt = t }
            if let r = receiptAt, appAt == nil, t - r > 3.5 { break } // the receipt is about to go: use it
            pause(0.2)
        }
        if let dir = env["PANE_SHOTS"] {
            try? "receipt with Undo after \(receiptAt.map { String(format: "%.1f", $0) } ?? "never") s, changed app on screen after \(appAt.map { String(format: "%.1f", $0) } ?? "not yet") s\n".write(toFile: "\(dir)/ai-edit-timing.txt", atomically: true, encoding: .utf8)
        }
        XCTAssertNotNil(receiptAt, "a change by an AI offers Undo")
        undo.tap()
        XCTAssertTrue(web(was).waitForExistence(timeout: 15), "Undo should bring the app before back")
        XCTAssertFalse(web(becomes).exists)
        pause(0.6)
        shot("06-undone")
        // The AI changes the data too: the app shows it at once.
        try mcp("update_page_data", ["id": id, "values": ["glasses": kept + 3]])
        XCTAssertTrue(web("\(kept + 3)").waitForExistence(timeout: 40), "a data change by the AI should show in the open app")
        shot("07-ai-changed-the-data")
    }

    /// With `-noteApps NO` the same note is its text, and the app waits untouched.
    func testD_SwitchedOffTheNoteIsItsText() throws {
        _ = try connection()
        launch(["-noteApps", "NO"])
        openNote()
        let editor = app.textViews["editor"].firstMatch
        XCTAssertTrue(editor.waitForExistence(timeout: 15), "switched off, the note opens as text")
        XCTAssertFalse(app.webViews.firstMatch.exists, "no app runs while apps are off")
        XCTAssertTrue((editor.value as? String ?? "").contains("Glasses of water"))
        pause(0.6)
        shot("08-switched-off-text")
        app.buttons["editor.more"].firstMatch.tap()
        pause(0.8)
        XCTAssertFalse(app.buttons["editor.makeApp"].firstMatch.exists || app.buttons["editor.appInfo"].firstMatch.exists, "no app items in More while off")
        shot("09-switched-off-more-menu")
    }

    /// On again, the app and its data are back as they were.
    func testE_OnAgainTheAppIsBack() throws {
        _ = try connection()
        launch()
        openNote()
        XCTAssertTrue(app.webViews.staticTexts[Self.noteTitle].firstMatch.waitForExistence(timeout: 30))
        XCTAssertGreaterThanOrEqual(count(), 2, "the app's data is back with it")
        shot("10-on-again")
    }

    /// The path the server teaches AIs: a React project started with create_app, changed with
    /// edit_app_file, checked with check_app, then opened in the app.
    func testF_AReactProjectAppBuildsAndRuns() throws {
        _ = try connection()
        let id = try note("Reading log", text: "Books, kept by the app.")
        try mcp("get_page_guide", [:])
        try mcp("create_app", ["id": id, "replace": true])
        let files = try mcp("list_app_files", ["id": id])
        XCTAssertTrue("\(files)".contains("App.tsx"), "the project should have src/App.tsx: \(files)")
        // The new project comes with tests of its starting screen; they go with that screen. (A save
        // that fails the project's tests is held back as a draft, and the last passing version stays.)
        if "\(files)".contains("/tests/app.test.tsx") { try mcp("delete_app_file", ["id": id, "path": "/tests/app.test.tsx"]) }
        let saved = try mcp("write_app_file", ["id": id, "path": "/src/App.tsx", "content": """
        import { useStore } from "@/lib/amber";
        import { Button } from "@/components/ui/button";

        export default function App() {
          const [books, setBooks] = useStore<number>("books", 0);
          return (
            <main className="p-6 space-y-4">
              <h1 className="text-2xl font-semibold">Reading log</h1>
              <p className="text-5xl font-bold">{books}</p>
              <Button onClick={() => setBooks(books + 1)}>Finished a book</Button>
            </main>
          );
        }
        """])
        XCTAssertFalse("\(saved["live"] ?? "")".hasPrefix("Held back"), "the save should pass its checks and go live: \(saved["errors"] ?? "")")
        let checked = try mcp("check_app", ["id": id])
        XCTAssertNotNil(checked["browser_checked"], "check_app should have opened the app in the render service's browser")
        let preview = try mcp("preview_app", ["id": id])
        XCTAssertTrue("\(preview["text"] ?? "")".contains("Finished a book"), "preview_app should describe what it rendered")
        launch()
        openNote("Reading log")
        let button = web("Finished a book")
        XCTAssertTrue(button.waitForExistence(timeout: 40), "the React app should run in the note")
        let before = count()
        button.tap()
        XCTAssertTrue(web("\(before + 1)").waitForExistence(timeout: 8))
        pause(0.8)
        shot("11-react-project-app")
    }

    /// The address is put together in the app: the server refuses a page with an outside address
    /// written in it, which an app that means to leak would get around the same way.
    static let reaching = """
    <!doctype html><html lang="en"><head><meta charset="utf-8"><title>Reach</title>
    <style>body{font:17px -apple-system,system-ui;margin:24px;color:var(--amber-text,#222)}button{font:inherit;display:block;margin:12px 0;padding:12px 18px;border-radius:12px;border:1px solid #8884;background:transparent;color:inherit}</style></head>
    <body><h1>Reach test</h1>
    <button id="link">Open the site</button><button id="remind">Remind me</button><button id="where">Where am I</button>
    <p id="out">Nothing yet</p>
    <script>
    const say = (r) => { document.getElementById("out").textContent = r && r.ok ? "It went ahead" : (r && r.error) || "No answer"; };
    amber.onChange(() => {});
    document.getElementById("link").onclick = () => amber.device.openURL(["https:", "", "example.org", "?note=" + encodeURIComponent(amber.note.title)].join("/")).then(say);
    document.getElementById("remind").onclick = () => amber.device.reminders.create({ title: "Water" }).then(say);
    document.getElementById("where").onclick = () => amber.device.location.once().then(say);
    </script></body></html>
    """

    /// What an app can reach outside itself: a link only once the person has seen all of it and
    /// agreed, each time; and nothing of the device, with a plain answer.
    func testG_ALinkIsAskedAboutAndTheDeviceIsNotAvailable() throws {
        _ = try connection()
        let id = try note("Reach test", text: "An app that reaches outside itself.")
        try mcp("set_note_page", ["id": id, "html": Self.reaching])
        launch()
        openNote("Reach test")
        XCTAssertTrue(web("Remind me").waitForExistence(timeout: 30))
        // The device: refused in the app, by name, with no system permission prompt.
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        web("Remind me").tap()
        XCTAssertTrue(web("Reminders aren't available in apps yet.").waitForExistence(timeout: 8))
        web("Where am I").tap()
        XCTAssertTrue(web("Location isn't available in apps yet.").waitForExistence(timeout: 8))
        XCTAssertFalse(springboard.alerts.firstMatch.exists, "no permission is asked for")
        shot("12-device-not-available")
        // A link: the whole address, and a choice. Refused, nothing opens.
        web("Open the site").tap()
        let ask = app.alerts["This app wants to open a link"]
        XCTAssertTrue(ask.waitForExistence(timeout: 8))
        XCTAssertTrue(ask.staticTexts.containing(NSPredicate(format: "label CONTAINS 'https://example.org/?note=Reach%20test'")).firstMatch.exists, "the whole address shows")
        shot("13-link-asked-about")
        ask.buttons["Don't Allow"].tap()
        XCTAssertTrue(web("You didn't open that link.").waitForExistence(timeout: 8))
        XCTAssertEqual(app.state, .runningForeground)
        // Asked again the next time, and opened only on Open.
        web("Open the site").tap()
        XCTAssertTrue(ask.waitForExistence(timeout: 8), "every link is asked about, not once per site")
        ask.buttons["Open"].tap()
        XCTAssertTrue(XCUIApplication(bundleIdentifier: "com.apple.mobilesafari").wait(for: .runningForeground, timeout: 15), "agreed to, the link opens in the browser")
    }
}
