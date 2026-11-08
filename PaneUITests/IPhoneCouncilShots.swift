#if os(iOS)
import XCTest

/// Pictures of the iPhone app for the switcher councils (2026-11-04): the screens a person meets in
/// a normal week, on the demo notes, in the look PANE_SCHEME asks for. Run headless by
/// scripts/iphone-council-shots.sh (no Simulator window); pictures go to PANE_SHOTS as
/// `<name>-<scheme>.png`. Not a check: each test only fails when its screen can't be reached.
final class IPhoneCouncilShots: XCTestCase {
    private var env: [String: String] { ProcessInfo.processInfo.environment }
    private var scheme: String { env["PANE_SCHEME"] ?? "light" }

    override func setUp() {
        continueAfterFailure = false
    }

    private func launch(_ args: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-scheme", scheme, "-noPagePrewarm"] + args
        app.launch()
        return app
    }

    private func shot(_ name: String, _ app: XCUIApplication) {
        let dir = env["PANE_SHOTS"] ?? "/tmp/pane-council-shots"
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        let s = XCUIScreen.main.screenshot()
        try? s.pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(name)-\(scheme).png"))
        if env["PANE_TREE"]?.isEmpty == false {
            try? app.debugDescription.write(toFile: "\(dir)/\(name)-\(scheme).txt", atomically: true, encoding: .utf8)
        }
        let a = XCTAttachment(screenshot: s)
        a.name = name
        a.lifetime = .keepAlways
        add(a)
    }

    private func pause(_ s: Double = 1) { Thread.sleep(forTimeInterval: s) }

    // MARK: Notes

    func test01NotesList() {
        let app = launch()
        XCTAssertTrue(app.staticTexts["Groceries"].firstMatch.waitForExistence(timeout: 15))
        pause(1.5)
        shot("01-notes-list", app)
    }

    func test02Checklist() {
        let app = launch(["-open", "Groceries"])
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15))
        pause(1.5)
        shot("02-note-checklist", app)
    }

    func test03Table() {
        let app = launch(["-open", "Lisbon"])
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 15))
        pause(1)
        // The table is under Food, at the foot of the note.
        editor.swipeUp(velocity: .slow)
        pause(1.5)
        shot("03-note-table", app)
    }

    func test04TypedTable() {
        let app = launch(["-open", "Evening tracker"])
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15))
        pause(2)
        shot("04-note-tracker", app)
    }

    func test05EditorKeyboard() {
        let app = launch(["-open", "Groceries"])
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 15))
        pause(1)
        // In the list, at the end of "Olive oil" (61% down the screen), as you'd add the next thing.
        editor.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.608)).tap()
        XCTAssertTrue(app.buttons["editor.done"].waitForExistence(timeout: 8), "the bar above the keyboard")
        _ = app.keyboards.firstMatch.waitForExistence(timeout: 5)
        pause(1.5)
        shot("05-editor-keyboard", app)
    }

    func test06Search() {
        let app = launch()
        XCTAssertTrue(app.staticTexts["Groceries"].firstMatch.waitForExistence(timeout: 15))
        pause(1)
        let field = app.searchFields.firstMatch
        if !field.exists, app.buttons["Search"].firstMatch.exists { app.buttons["Search"].firstMatch.tap() }
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap()
        field.typeText("lisbon")
        pause(2)
        shot("06-search", app)
    }

    func test07Share() {
        let app = launch(["-open", "Lisbon"])
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15))
        pause(1)
        let share = app.buttons["editor.share"].firstMatch
        XCTAssertTrue(share.waitForExistence(timeout: 5))
        share.tap()
        pause(1.2)
        shot("07-share-menu", app)
        // Send a Copy: the system's share sheet.
        let send = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Send'")).firstMatch
        if send.waitForExistence(timeout: 3) {
            send.tap()
            pause(2.5)
            shot("08-share-sheet", app)
        }
    }

    /// Share › Send a Copy › Pinto Notes: the share extension's sheet. Since 2026-11-04 it has
    /// Add to (a new note, or the end of one of the five newest notes, or one found by its title).
    func test19ShareExtension() {
        let app = launch(["-open", "Lisbon"])
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15))
        pause(1)
        app.buttons["editor.share"].firstMatch.tap()
        let send = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Send'")).firstMatch
        XCTAssertTrue(send.waitForExistence(timeout: 5))
        send.tap()
        let pinto = app.descendants(matching: .any).matching(NSPredicate(format: "label == 'Pinto Notes'")).firstMatch
        XCTAssertTrue(pinto.waitForExistence(timeout: 8), "Pinto Notes in the share sheet")
        pinto.tap()
        let save = app.buttons["share.save"].firstMatch
        XCTAssertTrue(save.waitForExistence(timeout: 10), "the share extension's sheet")
        pause(2)
        shot("19-share-extension", app)
        // Add to (this branch): pick the newest note, then search for another.
        let recent = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'share.note.' AND identifier != 'share.note.new'")).firstMatch
        if recent.waitForExistence(timeout: 2) {
            recent.tap()
            pause(1)
            shot("20-share-add-to-picked", app)
            let search = app.textFields["share.search"].firstMatch
            search.tap()
            search.typeText("trip")
            pause(1.2)
            shot("21-share-add-to-search", app)
        }
    }

    // MARK: Settings and connecting an AI

    /// Settings as the demo build has it: no account (sync is off in tests).
    func test09SettingsDemo() {
        let app = launch(["-openSettings"])
        pause(3)
        shot("09-settings-demo", app)
    }

    /// Settings as a signed-in account sees it (`-captureScreen settings`), with a notes password
    /// set (`-lockCapture locked`), which is when iPhone shows Privacy and security without the
    /// account's key here.
    func test10SettingsSignedIn() {
        let app = launch(["-captureScreen", "settings", "-lockCapture", "locked"])
        pause(3)
        shot("10-settings", app)
        let privacy = app.buttons["settings.security"].firstMatch.exists ? app.buttons["settings.security"].firstMatch
            : app.descendants(matching: .any)["settings.security"].firstMatch
        if privacy.waitForExistence(timeout: 3) {
            privacy.tap()
            pause(2)
            shot("11-privacy-security", app)
            app.navigationBars.buttons.element(boundBy: 0).tap()
            pause(1)
        }
        let ai = app.descendants(matching: .any)["settings.ai"].firstMatch
        if ai.waitForExistence(timeout: 3) {
            ai.tap()
            pause(2)
            shot("12-settings-connect-ai", app)
        }
    }

    /// Connect an AI with ChatGPT and Claude Code connected (`-captureScreen connect`).
    func test13ConnectList() {
        let app = launch(["-captureScreen", "connect"])
        pause(3)
        shot("13-connect-ai-connected", app)
    }

    /// Connect an AI before anything is connected: the guide (`-captureScreen connect-chatgpt`).
    func test14ConnectGuide() {
        let app = launch(["-captureScreen", "connect-chatgpt"])
        pause(3)
        shot("14-connect-ai", app)
    }

    /// Settings › AI with ChatGPT, Claude and Grok connected (`-captureScreen ai-page`), then the
    /// Disconnect swipe on the first row and its confirmation. iPhone connects nothing (8 November 2026).
    func test20AIPage() {
        let app = launch(["-captureScreen", "ai-page"])
        pause(3)
        shot("20-ai-page", app)
        let row = app.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH 'connect.connected.'")).firstMatch
        guard row.waitForExistence(timeout: 3) else { return }
        row.swipeLeft()
        pause(1)
        shot("20b-ai-page-swipe", app)
        let swipe = app.buttons["Disconnect"].firstMatch
        if swipe.waitForExistence(timeout: 2) {
            swipe.tap()
            pause(1)
            shot("20c-ai-page-confirm", app)
        }
    }

    /// Settings › AI with nothing connected: one line (`-captureScreen ai-page-empty`).
    func test21AIPageEmpty() {
        let app = launch(["-captureScreen", "ai-page-empty"])
        pause(3)
        shot("21-ai-page-empty", app)
    }

    // MARK: Note apps

    /// The four app templates, each a note that is its app: TEST_RUNNER_PANE_TEMPLATES holds
    /// `<slug>.md`, `<slug>.project.json` and `<slug>.data.json` (the app's bundled copies).
    func test15HabitTracker() { openTemplate("habit-tracker", title: "Habit tracker", n: 15) }
    func test16TripPlan() { openTemplate("trip-plan", title: "Trip plan", n: 16) }
    func test17Flashcards() { openTemplate("study-flashcards", title: "Study notes and flashcards", n: 17) }
    func test18Budget() { openTemplate("budget-log", title: "Budget and expenses", n: 18) }

    private func openTemplate(_ slug: String, title: String, n: Int) {
        let dir = try! XCTUnwrap(env["PANE_TEMPLATES"], "PANE_TEMPLATES")
        let app = launch(["-seedNote", "\(dir)/\(slug).md", "-seedPage", "\(title)=\(dir)/\(slug).project.json",
                          "-seedData", "\(title)=\(dir)/\(slug).data.json", "-open", title])
        pause(7)
        shot("\(n)-app-\(slug)", app)
    }
}
#endif
