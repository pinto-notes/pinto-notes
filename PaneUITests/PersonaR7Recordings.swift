#if os(iOS)
import XCTest

/// Persona council round 7 (4 November 2026): the iPhone videos the judges asked for, one test per
/// clip, recorded from outside by `xcrun simctl io recordVideo` on a headless simulator
/// (scripts/persona-r7-videos.sh). Paced like a person: a beat to look before each tap.
///
/// Each test writes its key moments to `$PN_R7_OUT/<clip>/marks.tsv` (name, then the time in
/// seconds since 1970) with a screenshot of each, which become the clip's stills. What only the
/// Mac can do to the simulator (a Face ID match, a shake) is asked for with a file the script's
/// watcher answers and removes: `$PN_R7_OUT/ask/<what>`.
///
/// Not a check: a test fails only when its screen can't be reached. Fictional notes only.
final class PersonaR7Recordings: XCTestCase {
    static let out = ProcessInfo.processInfo.environment["PN_R7_OUT"] ?? "/tmp/pn-r7"
    private var clip = "clip"
    private var shots = 0

    override func setUp() { continueAfterFailure = false }

    // MARK: - Helpers

    private func launch(_ args: [String]) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-noPagePrewarm"] + args
        app.launch()
        return app
    }

    private func pause(_ s: Double) { Thread.sleep(forTimeInterval: s) }

    private var dir: String { "\(Self.out)/\(clip)" }

    /// The clip starts: its folder (the script empties it first) and the first mark.
    private func begin(_ name: String) {
        clip = name
        shots = 0
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        record("begin")
    }

    private func record(_ name: String) {
        let line = "\(name)\t\(String(format: "%.3f", Date().timeIntervalSince1970))\n"
        let url = URL(fileURLWithPath: "\(dir)/marks.tsv")
        if let h = try? FileHandle(forWritingTo: url) {
            h.seekToEndOfFile()
            h.write(Data(line.utf8))
            try? h.close()
        } else {
            try? line.write(to: url, atomically: true, encoding: .utf8)
        }
    }

    /// A key moment: its time, and a screenshot of it.
    private func mark(_ name: String) {
        record(name)
        shots += 1
        let png = XCUIScreen.main.screenshot().pngRepresentation
        try? png.write(to: URL(fileURLWithPath: "\(dir)/\(String(format: "%02d", shots))-\(name).png"))
    }

    /// What the app's screen holds, for working out a step that didn't go.
    private func dump(_ app: XCUIApplication, _ name: String) {
        try? app.debugDescription.write(toFile: "\(dir)/tree-\(name).txt", atomically: true, encoding: .utf8)
    }

    /// Asks the Mac side for something only it can do to the simulator, and waits until it's done.
    @discardableResult
    private func ask(_ what: String, timeout: Double = 15) -> Bool {
        let askDir = "\(Self.out)/ask"
        try? FileManager.default.createDirectory(atPath: askDir, withIntermediateDirectories: true)
        let path = "\(askDir)/\(what)"
        FileManager.default.createFile(atPath: path, contents: Data())
        record("ask-\(what)")
        let end = Date().addingTimeInterval(timeout)
        while FileManager.default.fileExists(atPath: path), Date() < end { pause(0.2) }
        return !FileManager.default.fileExists(atPath: path)
    }

    private func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any)[id].firstMatch
    }

    private func typeSlowly(_ app: XCUIApplication, _ text: String, beat: Double = 0.04) {
        // A few characters at a time, so the video shows the line being written.
        var chunk = ""
        for c in text {
            chunk.append(c)
            if chunk.count >= 3 || c == "\n" || c == " " {
                app.typeText(chunk)
                chunk = ""
                pause(beat)
            }
        }
        if !chunk.isEmpty { app.typeText(chunk) }
    }

    /// A fresh simulator's keyboard first explains slide to type.
    private func passKeyboardTip(_ app: XCUIApplication) {
        let tip = app.buttons["Continue"].firstMatch
        if tip.waitForExistence(timeout: 2) { tip.tap(); pause(0.6) }
    }

    private func searchField(_ app: XCUIApplication) -> XCUIElement {
        let field = app.searchFields.firstMatch
        if !field.exists, app.buttons["Search"].firstMatch.exists { app.buttons["Search"].firstMatch.tap() }
        XCTAssertTrue(field.waitForExistence(timeout: 5), "the list's search field")
        return field
    }

    private func clear(_ field: XCUIElement) {
        let clearButton = field.buttons["Clear text"].firstMatch
        if clearButton.exists { clearButton.tap(); pause(0.4); return }
        if let value = field.value as? String, !value.isEmpty {
            field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: value.count))
        }
    }

    /// Fictional notes, written for the app to read with `-seedNote` (the simulator shares the
    /// Mac's files).
    private func seed(_ name: String, _ body: String) -> String {
        let folder = NSTemporaryDirectory() + "pn-r7-seeds"
        try? FileManager.default.createDirectory(atPath: folder, withIntermediateDirectories: true)
        let path = "\(folder)/\(name).md"
        try? body.write(toFile: path, atomically: true, encoding: .utf8)
        return path
    }

    /// Springboard's alert asking to allow something, if one is up.
    private func allowIfAsked(_ titles: [String] = ["Allow", "OK", "Allow While Using App", "Continue"]) {
        let sb = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for t in titles {
            let b = sb.alerts.buttons[t].firstMatch
            if b.exists { b.tap(); pause(0.8); return }
        }
    }

    // MARK: - C1. AI change review (iPhone, dark)

    /// ChatGPT edits "Lisbon trip" while it's open: it moves the dates a week, takes out a
    /// sentence and adds three tasks. The highlight and margin ticks, then "ChatGPT changed N
    /// lines ›": keep the dates, undo the sentence (it comes back), keep the tasks.
    func testC1AIReview() {
        begin("c1-ai-review")
        let app = launch(["-seedTrip", "-open", "Lisbon trip", "-aiEdit", "Lisbon trip", "-aiScene", "lisbontrip", "-aiBy", "ChatGPT", "-aiAfter", "14"])
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 20))
        pause(1.5)
        mark("note-before")
        let review = app.buttons["note.aiReview"].firstMatch
        XCTAssertTrue(review.waitForExistence(timeout: 20), "ChatGPT's edit lands with its button")
        pause(1.5)
        mark("edit-landed")
        pause(3)
        review.tap()
        let card = element(app, "review.card")
        XCTAssertTrue(card.waitForExistence(timeout: 8), "the review sheet")
        pause(2.5)
        mark("review-sheet")
        dump(app, "review")
        let keepDates = app.buttons["review.keep.0"].firstMatch
        XCTAssertTrue(keepDates.waitForExistence(timeout: 4), "Keep on the dates")
        keepDates.tap()
        pause(2)
        mark("kept-dates")
        let undoSentence = app.buttons["review.undo.1"].firstMatch
        XCTAssertTrue(undoSentence.waitForExistence(timeout: 4), "Undo on the sentence taken out")
        if !undoSentence.isHittable { card.swipeUp(); pause(1) }
        undoSentence.tap()
        pause(2)
        mark("undid-sentence")
        let keepTasks = app.buttons["review.keep.2"].firstMatch
        if keepTasks.waitForExistence(timeout: 4) {
            if !keepTasks.isHittable { card.swipeUp(); pause(1); mark("tasks-part") }
            pause(1)
            keepTasks.tap()
        } else {
            dump(app, "no-third-part")
            app.buttons["review.done"].firstMatch.tap()
        }
        pause(1.2)
        mark("result")
        pause(3.5)
        mark("note-after")
        // Up to the top: the dates kept, the sentence back.
        app.textViews["editor"].swipeDown()
        pause(2)
        mark("note-after-top")
        pause(1.5)
        record("end")
    }

    // MARK: - C2. Writing (iPhone, light)

    /// A new note, written as a person would: a heading with #, a checklist with - [ ], an item
    /// indented and outdented, **bold**, a [[ link to Lisbon, a pasted link, a table cell, Undo,
    /// then the keyboard away.
    func testC2Writing() {
        begin("c2-writing")
        let app = launch([])
        XCTAssertTrue(app.staticTexts["Groceries"].firstMatch.waitForExistence(timeout: 20))
        pause(1.5)
        mark("list")
        let compose = app.buttons["list.newNote"].firstMatch
        XCTAssertTrue(compose.waitForExistence(timeout: 5))
        compose.tap()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        pause(1)
        passKeyboardTip(app)
        typeSlowly(app, "Porto weekend\n")
        pause(0.5)
        typeSlowly(app, "# Saturday\n")
        pause(1)
        typeSlowly(app, "- [ ] Train to Porto at 8:10\n")
        pause(0.8)
        typeSlowly(app, "Pack the camera")
        pause(0.8)
        mark("checklist-typed")
        // Indent the item from the Format panel, then outdent it again.
        let format = app.buttons["editor.format"].firstMatch
        XCTAssertTrue(format.waitForExistence(timeout: 5), "Format over the keyboard")
        format.tap()
        let indent = app.buttons["format.indent"].firstMatch
        XCTAssertTrue(indent.waitForExistence(timeout: 5), "Indent in the Format panel")
        pause(1.2)
        indent.tap()
        pause(1.5)
        mark("indented")
        app.buttons["format.outdent"].firstMatch.tap()
        pause(1.5)
        mark("outdented")
        let close = app.buttons["format.close"].firstMatch
        if close.exists { close.tap() }
        pause(1)
        typeSlowly(app, "\nAsk Ana about dinner\n\n")
        pause(0.8)
        typeSlowly(app, "Meet **Ana** at São Bento at 10.\n")
        pause(1.2)
        mark("bold")
        typeSlowly(app, "Ideas from [[Lis")
        pause(1.5)
        mark("link-suggestions")
        let suggestion = app.buttons["wiki.suggestion.0"].firstMatch
        if suggestion.waitForExistence(timeout: 3) {
            suggestion.tap()
        } else {
            dump(app, "no-suggestion")
            typeSlowly(app, "bon]]")
        }
        pause(1.2)
        typeSlowly(app, " and ")
        // A link copied elsewhere, pasted. The caret is at the end of the text, so a tap below the
        // text lands on it, and a second tap there shows the menu with Paste (a long press, if not).
        UIPasteboard.general.string = "https://www.visitporto.travel/en-GB"
        pause(0.5)
        let below = editor.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.9))
        let paste = app.descendants(matching: .any).matching(NSPredicate(format: "label == 'Paste'")).firstMatch
        for hold in [0.0, 0.0, 1.0] where !paste.exists {
            if hold > 0 { below.press(forDuration: hold) } else { below.tap() }
            _ = paste.waitForExistence(timeout: 1.5)
        }
        if paste.exists {
            pause(0.8)
            paste.tap()
            allowIfAsked(["Allow Paste"])
        } else {
            dump(app, "no-paste")
            record("typed-not-pasted")
            typeSlowly(app, "https://www.visitporto.travel/en-GB")
        }
        pause(1.5)
        mark("pasted-link")
        typeSlowly(app, "\n")
        // A table: the bar's Table button, then a cell.
        let table = app.buttons["Table"].firstMatch
        XCTAssertTrue(table.waitForExistence(timeout: 5), "Table over the keyboard")
        table.tap()
        pause(1.5)
        mark("table-inserted")
        dump(app, "table")
        let first = element(app, "grid.0.0")
        if first.waitForExistence(timeout: 3) {
            first.tap()
            pause(0.8)
        }
        typeSlowly(app, "Day")
        pause(0.8)
        let next = element(app, "grid.0.1")
        if next.waitForExistence(timeout: 2) { next.tap(); pause(0.8) }
        typeSlowly(app, "Plan")
        pause(0.8)
        let cell = element(app, "grid.1.1")
        if cell.waitForExistence(timeout: 2) { cell.tap(); pause(0.8) }
        typeSlowly(app, "Ribeira walk")
        pause(1.2)
        mark("table-cell-edited")
        // Undo, from the note's bar.
        let undo = app.buttons["note.undo"].firstMatch
        if undo.waitForExistence(timeout: 3) {
            pause(0.8)
            undo.tap()
            pause(1.5)
        } else {
            dump(app, "no-undo")
            ask("shake")
            let alertUndo = app.alerts.buttons["Undo"].firstMatch
            if alertUndo.waitForExistence(timeout: 3) { alertUndo.tap() }
            pause(1.5)
        }
        mark("undone")
        let done = app.buttons["editor.done"].firstMatch
        if done.exists { done.tap() }
        pause(2)
        mark("keyboard-away")
        app.swipeDown()
        pause(1.5)
        mark("note-top")
        pause(1)
        record("end")
    }

    /// The keyboard and its bar over a note being written, for a still.
    func testC2KeyboardStill() {
        begin("c2-keyboard-still")
        let app = launch(["-open", "Groceries"])
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 20))
        pause(1)
        editor.tap()
        passKeyboardTip(app)
        XCTAssertTrue(app.buttons["editor.done"].waitForExistence(timeout: 5), "the bar above the keyboard")
        pause(1.5)
        mark("keyboard-and-bar")
        record("end")
    }

    // MARK: - C3. Search (iPhone, dark)

    /// The largest demo library there is: 1,284 notes as imported from Apple Notes (many with
    /// near-identical titles), and four notes written for this. An exact title, a phrase deep in
    /// a note, a word from a checklist and a typo; then a result opened, edited, and back.
    func testC3Search() {
        begin("c3-search")
        var lines = (1...42).map { "Day \($0): " + ["Measured the wall by the window again.", "Called the plumber about the sink.", "Looked at handles for the drawers.", "Read about worktops; oak needs oil twice a year."][$0 % 4] }
        lines.insert("Order the blue tiles from Viúva Lamego.", at: 31)
        let kitchen = seed("kitchen", "Kitchen renovation\n\nWhat we've decided so far, and what's left.\n\n" + lines.joined(separator: "\n"))
        let errands = seed("errands", "Weekend errands\n\n- [ ] Return the library books\n- [ ] Pick up the dry cleaning\n- [ ] Buy a birthday card for Leo\n- [x] Pay the electricity bill")
        let porto = seed("porto", "Porto in October\n\nThree days, mostly walking. The Livraria Lello queue is long before ten.")
        let lisbon7 = seed("lisbon7", "Lisbon 7 day plan\n\nA whole week: Alfama, Belém, Sintra, Cascais, LX Factory, then two slow days.")
        var args = ["-importedLibrary"]
        for s in [kitchen, errands, porto, lisbon7] { args += ["-seedNote", s] }
        let app = launch(args)
        // The imported library pins notes of its own, so the seeded ones are further down: the
        // list's header (with the count) says it's in.
        let header = app.staticTexts.matching(NSPredicate(format: "label ENDSWITH ' notes'")).firstMatch
        XCTAssertTrue(header.waitForExistence(timeout: 30), "the library")
        record("count: \(header.label)")
        pause(2)
        mark("library")
        let field = searchField(app)
        field.tap()
        pause(0.8)
        func search(_ q: String, _ name: String) {
            clear(field)
            pause(0.5)
            typeSlowly(app, q, beat: 0.08)
            pause(2.5)
            mark(name)
            pause(1)
        }
        search("Lisbon 7", "exact-title")
        search("blue tiles", "buried-phrase")
        search("dry cleaning", "checklist-word")
        search("renovaton", "typo")
        search("blue tiles", "again")
        dump(app, "results")
        let hit = app.cells.containing(NSPredicate(format: "label CONTAINS 'Kitchen renovation'")).firstMatch
        let row = hit.exists ? hit : app.staticTexts["Kitchen renovation"].firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 5), "the kitchen note in the results")
        row.tap()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        pause(3)
        mark("opened-at-the-line")
        dump(app, "opened")
        // An edit at the end of the line it found (the note opens with that line in the middle).
        editor.coordinate(withNormalizedOffset: CGVector(dx: 0.96, dy: 0.5)).tap()
        passKeyboardTip(app)
        pause(1)
        typeSlowly(app, " Ask for a sample.")
        pause(1.5)
        mark("edited")
        let done = app.buttons["editor.done"].firstMatch
        if done.exists { done.tap(); pause(0.8) }
        let back = app.navigationBars.buttons.element(boundBy: 0)
        XCTAssertTrue(back.waitForExistence(timeout: 5))
        back.tap()
        pause(2.5)
        mark("back-to-results")
        pause(1)
        record("end")
    }

    // MARK: - C4. Share sheet (iPhone, light)

    /// A real recipe page in Safari (BBC Good Food, ads and all, or PN_RECIPE_URL): Share › Pinto
    /// Notes › Add to "Recipes" › Add. Then a paragraph of it selected and shared as a new note.
    /// Back in Pinto: both opened, and their links followed.
    func testC4ShareSheet() {
        begin("c4-share-sheet")
        let recipes = seed("recipes", "Recipes\n\nThings to cook again.\n\n- Cardamom buns, Grandma's way\n- Weeknight curry with chickpeas\n- Pasta night for eight")
        let app = launch(["-seedNote", recipes])
        XCTAssertTrue(app.staticTexts["Recipes"].firstMatch.waitForExistence(timeout: 20), "the Recipes note in the list")
        pause(2)
        mark("pinto-list")
        let url = ProcessInfo.processInfo.environment["PN_RECIPE_URL"] ?? "https://www.bbcgoodfood.com/recipes/easy-pancakes"
        XCUIDevice.shared.press(.home)
        pause(1.2)
        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        safari.open(URL(string: url)!)
        XCTAssertTrue(safari.wait(for: .runningForeground, timeout: 20))
        XCTAssertTrue(safari.webViews.firstMatch.waitForExistence(timeout: 30), "the page")
        pause(6)
        dump(safari, "page")
        // Safari's first-run tip, then the site's cookie question (as a visitor from Europe sees
        // it), accepted: the free way past it.
        let tip = safari.buttons["xmark.circle.fill"].firstMatch
        if tip.exists { tip.tap(); pause(1) }
        let consent = safari.webViews.buttons.matching(NSPredicate(format: "label BEGINSWITH[c] 'Accept' OR label IN {'Agree', 'I Agree', 'I agree', 'Allow all', 'Got it'}")).firstMatch
        if consent.waitForExistence(timeout: 4) && consent.isHittable {
            pause(1.5)
            mark("cookie-question")
            consent.tap()
            pause(4)
        }
        mark("recipe-page")
        pause(1.5)
        func shareButton() -> XCUIElement {
            var share = safari.buttons["ShareButton"].firstMatch
            if !share.exists { share = safari.buttons["Share"].firstMatch }
            if !share.exists {
                let tip = safari.buttons["xmark.circle.fill"].firstMatch
                if tip.exists { tip.tap(); pause(0.8) }
                let more = safari.buttons["MoreMenuButton"].firstMatch
                if more.exists { more.tap(); pause(1.2) }
                share = safari.buttons.matching(NSPredicate(format: "label == 'Share' OR identifier == 'ShareButton'")).firstMatch
            }
            return share
        }
        func pickPinto() {
            let pinto = safari.descendants(matching: .any).matching(NSPredicate(format: "label == 'Pinto Notes'")).firstMatch
            if !pinto.waitForExistence(timeout: 5) {
                let row = safari.collectionViews.firstMatch
                for _ in 0..<3 where !pinto.exists { row.swipeLeft(); pause(0.8) }
            }
            XCTAssertTrue(pinto.waitForExistence(timeout: 5), "Pinto Notes in the share sheet")
            pause(1.2)
            pinto.tap()
        }
        let share = shareButton()
        XCTAssertTrue(share.waitForExistence(timeout: 5), "Safari's share button")
        share.tap()
        pause(1.5)
        mark("share-menu")
        pickPinto()
        let save = safari.buttons["share.save"].firstMatch
        XCTAssertTrue(save.waitForExistence(timeout: 15), "Pinto's share sheet")
        pause(2.5)
        mark("share-sheet-page")
        let addTo = safari.buttons["share.addTo"].firstMatch
        if addTo.waitForExistence(timeout: 3) {
            addTo.tap()
            pause(1.5)
            mark("add-to-list")
            let note = safari.buttons["share.note.Recipes"].firstMatch
            if !note.exists {
                let find = safari.searchFields.firstMatch
                if find.waitForExistence(timeout: 3) { find.tap(); pause(0.5); find.typeText("Recipes"); pause(1.5) }
            }
            XCTAssertTrue(note.waitForExistence(timeout: 5), "Recipes in Add to")
            note.tap()
            pause(1.5)
        }
        mark("add-to-recipes")
        save.tap()
        pause(1.2)
        mark("saved-to-recipes")
        pause(2)
        // A paragraph of the method, selected and shared as a note of its own.
        let paragraph = safari.webViews.staticTexts.matching(NSPredicate(format: "label BEGINSWITH 'Put 100g plain flour'")).firstMatch
        for _ in 0..<12 where !(paragraph.exists && paragraph.isHittable && paragraph.frame.midY < safari.frame.height * 0.7) {
            safari.webViews.firstMatch.swipeUp(velocity: .slow)
            pause(0.8)
        }
        pause(1.5)
        mark("method-paragraph")
        dump(safari, "method")
        // Touch and hold its first word, then drag to its last. Safari puts the selection's end
        // about two lines above the finger, so the drag ends that far below the last line.
        let rest = safari.webViews.staticTexts.matching(NSPredicate(format: "label BEGINSWITH 'to a smooth batter'")).firstMatch
        if paragraph.exists && rest.exists {
            let start = paragraph.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: 10, dy: 10))
            let end = rest.coordinate(withNormalizedOffset: CGVector(dx: 0.97, dy: 0.75)).withOffset(CGVector(dx: 0, dy: 43))
            start.press(forDuration: 1.2, thenDragTo: end)
            pause(1.5)
        }
        mark("paragraph-selected")
        dump(safari, "selected")
        // Share… is in the menu's second part, behind its arrow.
        let shareText = safari.descendants(matching: .any).matching(NSPredicate(format: "label == 'Share…'")).firstMatch
        if !shareText.exists {
            let more = safari.buttons["Forward"].firstMatch
            if more.exists { more.tap(); pause(1.2); mark("selection-menu") }
        }
        if shareText.waitForExistence(timeout: 3) {
            shareText.tap()
            pause(1.5)
            mark("share-text-menu")
            pickPinto()
            XCTAssertTrue(save.waitForExistence(timeout: 15), "Pinto's share sheet for the text")
            pause(2.5)
            mark("share-sheet-text")
            save.tap()
            pause(1.2)
            mark("saved-text")
            pause(2)
        } else {
            dump(safari, "no-share-text")
        }
        // Back in Pinto: what came.
        app.activate()
        pause(2.5)
        mark("pinto-after")
        let recipesRow = app.staticTexts["Recipes"].firstMatch
        if recipesRow.waitForExistence(timeout: 5) { recipesRow.tap() }
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        pause(2.5)
        mark("recipes-note")
        dump(app, "recipes")
        let link = editor.links.firstMatch
        if link.exists {
            pause(1)
            link.tap()
            pause(4)
            mark("followed-recipe-link")
            app.activate()
            pause(2)
        }
        let back = app.navigationBars.buttons.element(boundBy: 0)
        if back.exists { back.tap() }
        pause(2)
        mark("list-after")
        dump(app, "list-after")
        // The new note from the paragraph: the newest in the list.
        let textNote = app.cells.containing(NSPredicate(format: "label CONTAINS 'Put 100g plain flour' OR label CONTAINS 'plain flour'")).firstMatch
        let textRow = textNote.exists ? textNote : app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'plain flour'")).firstMatch
        if textRow.waitForExistence(timeout: 5) {
            textRow.tap()
            XCTAssertTrue(editor.waitForExistence(timeout: 10))
            pause(2.5)
            mark("text-note")
            dump(app, "text-note")
            let source = editor.links.firstMatch
            if source.exists {
                source.tap()
                pause(4)
                mark("followed-text-link")
                app.activate()
                pause(1.5)
            }
        }
        pause(1)
        record("end")
    }

    // MARK: - C5. Locked note (iPhone, dark)

    /// Bank details, locked: the list with its lock, the locked page, Face ID; an edit, Lock Now;
    /// opened again with the password (Face ID not recognised first), and locked again at the end.
    func testC5LockedNote() {
        begin("c5-locked-note")
        let app = launch(["-lockCapture", "locked", "-lockFaceID"])
        let row = app.staticTexts["Bank details"].firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 20), "the locked note in the list")
        pause(2.5)
        mark("list-with-lock")
        row.tap()
        XCTAssertTrue(element(app, "lock.heading").waitForExistence(timeout: 8), "This note is locked.")
        pause(1)
        mark("locked-page")
        // Face ID asks first, as Notes does. The first time, the system asks to allow it.
        pause(1.5)
        allowIfAsked(["OK", "Allow"])
        pause(1)
        mark("face-id")
        ask("faceid-match")
        let editor = app.textViews["editor"]
        if !editor.waitForExistence(timeout: 6) {
            dump(app, "after-match")
            // Face ID through the page's own button.
            let button = app.buttons["lock.biometrics"].firstMatch
            if button.exists {
                button.tap()
                pause(1.5)
                allowIfAsked(["OK", "Allow"])
                ask("faceid-match")
            }
        }
        XCTAssertTrue(editor.waitForExistence(timeout: 8), "the note opens after Face ID")
        pause(2)
        mark("unlocked")
        // An edit at the end.
        editor.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.9)).tap()
        passKeyboardTip(app)
        pause(0.8)
        typeSlowly(app, "\nNew card arrives Friday")
        pause(1.5)
        mark("edited")
        let done = app.buttons["editor.done"].firstMatch
        if done.exists { done.tap(); pause(0.8) }
        // Lock it again: More › Lock Now.
        let more = app.buttons["editor.more"].firstMatch
        XCTAssertTrue(more.waitForExistence(timeout: 5), "the note's More button")
        more.tap()
        pause(1.2)
        mark("more-menu")
        let lockNow = app.buttons["editor.lockNow"].firstMatch
        XCTAssertTrue(lockNow.waitForExistence(timeout: 4), "Lock Now")
        lockNow.tap()
        pause(1.5)
        mark("locked-again")
        // The page asks Face ID again; this time it isn't recognised, and the password opens it.
        ask("faceid-nomatch")
        pause(1.5)
        mark("face-not-recognised")
        let cancel = XCUIApplication(bundleIdentifier: "com.apple.springboard").buttons["Cancel"].firstMatch
        if cancel.waitForExistence(timeout: 3) { cancel.tap() } else if app.buttons["Cancel"].firstMatch.exists { app.buttons["Cancel"].firstMatch.tap() }
        pause(1.5)
        let back = app.navigationBars.buttons.element(boundBy: 0)
        if back.exists { back.tap(); pause(2) }
        mark("list-locked")
        row.tap()
        XCTAssertTrue(element(app, "lock.heading").waitForExistence(timeout: 8))
        pause(1.5)
        ask("faceid-nomatch")
        pause(1.2)
        if cancel.waitForExistence(timeout: 3) { cancel.tap() }
        pause(1.2)
        let password = element(app, "lock.password")
        XCTAssertTrue(password.waitForExistence(timeout: 5), "the password field")
        if !(password.value(forKey: "hasKeyboardFocus") as? Bool ?? false) { password.tap() }
        pause(0.8)
        typeSlowly(app, "demo", beat: 0.15)
        pause(1)
        mark("password-typed")
        app.buttons["lock.view"].firstMatch.tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 8), "the note opens with the password")
        pause(2.5)
        mark("open-with-password")
        // And locked at the end.
        more.tap()
        pause(1)
        lockNow.tap()
        pause(1.5)
        ask("faceid-nomatch")
        pause(1)
        if cancel.waitForExistence(timeout: 3) { cancel.tap() }
        pause(1)
        if back.exists { back.tap(); pause(2) }
        mark("ends-locked")
        pause(1)
        record("end")
    }

    // MARK: - C6. Widget (iPhone, light)

    /// The Note widget on the Home Screen: added, set to Packing, an item ticked on it (Pinto opens
    /// on the note, ticked), the note edited in Pinto, and Home again. Needs a Home Screen without
    /// the widget (the script erases the simulator first).
    func testC6Widget() {
        begin("c6-widget")
        let app = launch(["-open", "Packing"])
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 20))
        pause(2)
        mark("pinto-packing")
        XCUIDevice.shared.press(.home)
        let sb = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        pause(1.5)
        mark("home-screen")
        sb.swipeLeft()
        pause(0.8)
        sb.press(forDuration: 1.6)
        pause(1.5)
        dump(sb, "1-jiggle")
        let edit = sb.buttons["Edit"].firstMatch
        let addItem = sb.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS[c] 'Add Widget'")).firstMatch
        for _ in 0..<3 where !addItem.exists {
            if edit.exists { edit.tap() } else { sb.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: 72, dy: 33)).tap() }
            pause(1.5)
        }
        dump(sb, "2-edit")
        if addItem.exists { addItem.tap(); pause(2) }
        mark("widget-gallery")
        let search = sb.searchFields.firstMatch
        if search.waitForExistence(timeout: 3) { search.tap(); search.typeText("Pinto"); pause(1.5) }
        dump(sb, "3-search")
        let pinto = sb.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS 'Pinto'")).element(boundBy: search.exists ? 1 : 0)
        if pinto.waitForExistence(timeout: 3) { pinto.tap(); pause(2) }
        dump(sb, "4-pinto")
        // The small size: Packing's four lines fit.
        mark("widget-sizes")
        let addW = sb.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Add Widget'")).firstMatch
        if addW.waitForExistence(timeout: 3) { addW.tap(); pause(2) }
        dump(sb, "5-added")
        mark("widget-added")
        // Choose the note. Still editing the Home Screen, a tap on the widget opens its settings
        // (touch and hold opens a menu SpringBoard never reports settled, so each step after it
        // waited 60 s).
        let choose = sb.buttons["Choose"].firstMatch
        let placed = sb.icons.matching(NSPredicate(format: "value == 'Widget' AND label CONTAINS 'Pinto'")).firstMatch
        if placed.waitForExistence(timeout: 5) {
            placed.tap()
            pause(2)
        }
        if !choose.waitForExistence(timeout: 3) {
            // The menu's way, slow as said.
            let widget = sb.descendants(matching: .any).matching(NSPredicate(format: "identifier BEGINSWITH 'widget.'")).firstMatch
            if widget.waitForExistence(timeout: 5) {
                widget.press(forDuration: 1.4)
                pause(1.5)
                dump(sb, "7-menu")
                let editWidget = sb.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Edit Widget' OR label CONTAINS[c] 'Edit \"Note\"'")).firstMatch
                if editWidget.waitForExistence(timeout: 3) { editWidget.tap(); pause(2) }
            }
        }
        mark("edit-widget")
        dump(sb, "8-config")
        if choose.waitForExistence(timeout: 3) {
            choose.tap()
            pause(2)
            dump(sb, "9-choose")
            mark("choose-note")
            let packing = sb.descendants(matching: .any).matching(NSPredicate(format: "label == 'Packing'")).firstMatch
            if packing.waitForExistence(timeout: 4) { packing.tap(); pause(1.5) }
            mark("chose-packing")
            // Away from the settings, then Done.
            sb.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.06)).tap()
            pause(1.5)
        }
        let done = sb.buttons["Done"].firstMatch
        if done.exists { done.tap() }
        pause(2)
        mark("widget-packing")
        let circle = sb.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'widget.item.'")).firstMatch
        XCTAssertTrue(circle.waitForExistence(timeout: 5), "an item on the widget")
        pause(1.5)
        circle.tap()
        pause(3.5)
        mark("ticked-opens-pinto")
        // An edit in Pinto: one more thing to pack.
        let editor = app.textViews["editor"]
        if editor.waitForExistence(timeout: 8) {
            editor.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.85)).tap()
            passKeyboardTip(app)
            pause(0.8)
            typeSlowly(app, "\nSunglasses")
            pause(1.5)
            mark("edited-in-pinto")
            let barDone = app.buttons["editor.done"].firstMatch
            if barDone.exists { barDone.tap() }
            pause(1)
        }
        XCUIDevice.shared.press(.home)
        pause(3)
        mark("home-after-edit")
        pause(1.5)
        record("end")
    }

    /// Opus's capture path, timed: from the Home Screen with Pinto closed, launch it and make a
    /// five-item checklist. The script burns the clip's own clock into the video.
    func testC6TimedChecklist() {
        begin("c6-timed-checklist")
        let app = XCUIApplication()
        app.terminate()
        XCUIDevice.shared.press(.home)
        pause(2)
        mark("home-screen")
        pause(1)
        // No screenshots from here to the last item: they'd add to the time.
        record("clock-start")
        app.launchArguments = ["-uitest", "-demo", "-noPagePrewarm"]
        app.launch()
        let compose = app.buttons["list.newNote"].firstMatch
        XCTAssertTrue(compose.waitForExistence(timeout: 20))
        record("launched")
        compose.tap()
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 10))
        passKeyboardTip(app)
        app.typeText("Market\n")
        let checklist = app.buttons["Checklist"].firstMatch
        if checklist.waitForExistence(timeout: 3) { checklist.tap() } else { app.typeText("- [ ] ") }
        app.typeText("Tomatoes\nBread\nOlive oil\nBasil\nLemons")
        record("clock-stop")
        mark("five-items")
        pause(2.5)
        // The keyboard away: a change on screen after the clock stops, so the clip's clock lines up.
        let done = app.buttons["editor.done"].firstMatch
        if done.exists { done.tap() }
        pause(1.5)
        mark("keyboard-away")
        record("end")
    }
}
#endif
