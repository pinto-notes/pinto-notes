#if os(iOS)
import XCTest

/// Flows for the persona council's before-and-after videos (2026-11-04). Each test is one clip,
/// recorded from outside by `xcrun simctl io recordVideo` on a headless simulator. Paced like a
/// person: a beat to look before each tap. Not a check: a test only fails when its screen can't
/// be reached.
final class PersonaShowcaseRecordings: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    private func launch(_ args: [String]) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-noPagePrewarm"] + args
        app.launch()
        return app
    }

    private func pause(_ s: Double) { Thread.sleep(forTimeInterval: s) }

    /// An AI adds to Groceries while it's open; the button at the foot shows what it added, in a
    /// sheet, and Keep keeps it.
    func test1ReviewSheet() {
        let app = launch(["-open", "Groceries", "-aiEdit", "Groceries", "-aiScene", "paella", "-aiAfter", "3"])
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15))
        let review = app.buttons["note.aiReview"].firstMatch
        XCTAssertTrue(review.waitForExistence(timeout: 10))
        pause(3)
        review.tap()
        XCTAssertTrue(app.descendants(matching: .any)["review.card"].firstMatch.waitForExistence(timeout: 5))
        pause(3)
        let keep = app.buttons["Keep"].firstMatch
        if keep.waitForExistence(timeout: 3) { keep.tap() }
        pause(3)
    }

    /// Search finds a line deep in a note; opening it goes to that line.
    func test2SearchGoesToTheLine() {
        let app = launch([])
        XCTAssertTrue(app.staticTexts["Groceries"].firstMatch.waitForExistence(timeout: 15))
        pause(1.5)
        let field = app.searchFields.firstMatch
        if !field.exists, app.buttons["Search"].firstMatch.exists { app.buttons["Search"].firstMatch.tap() }
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap()
        pause(0.6)
        field.typeText("comfortable shoes")
        pause(2)
        let hit = app.cells.containing(NSPredicate(format: "label CONTAINS 'Lisbon'")).firstMatch
        let row = hit.exists ? hit : app.staticTexts["Lisbon"].firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 5))
        row.tap()
        pause(4)
    }

    /// Share › Send a Copy › Pinto Notes, add to a note, Save: it says Saved, and when it goes in.
    func test3ShareSheetSaved() {
        let app = launch(["-open", "Lisbon"])
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15))
        pause(1.5)
        app.buttons["editor.share"].firstMatch.tap()
        let send = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Send'")).firstMatch
        XCTAssertTrue(send.waitForExistence(timeout: 5))
        pause(1)
        send.tap()
        let pinto = app.descendants(matching: .any).matching(NSPredicate(format: "label == 'Pinto Notes'")).firstMatch
        XCTAssertTrue(pinto.waitForExistence(timeout: 8))
        pause(1.2)
        pinto.tap()
        let save = app.buttons["share.save"].firstMatch
        XCTAssertTrue(save.waitForExistence(timeout: 10))
        pause(2)
        let addTo = app.buttons["share.addTo"].firstMatch
        if addTo.waitForExistence(timeout: 2) {
            addTo.tap()
            pause(1.5)
            let recent = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'share.note.' AND identifier != 'share.note.new'")).firstMatch
            if recent.waitForExistence(timeout: 3) { recent.tap() }
        }
        pause(3)
        save.tap()
        pause(4)
    }

    /// From Safari: share a page about Lisbon › Pinto Notes › Add to "Lisbon" › Add. What the Pinto
    /// Notes share sheet is for: bringing things in from other apps (Emil, 4 November 2026: the
    /// clip shared a Pinto note into Pinto, which made no sense). Wikipedia's Trams in Lisbon, or
    /// PN_PAGE_URL.
    func test3bShareFromSafari() {
        let app = launch([])
        XCTAssertTrue(app.staticTexts["Groceries"].firstMatch.waitForExistence(timeout: 15))
        pause(1)
        // A real page (Emil, 4 November 2026: a page served from the Mac looked fake). From the
        // Home Screen, so Safari has no "◂ Pinto Notes" back link.
        let url = ProcessInfo.processInfo.environment["PN_PAGE_URL"] ?? "https://en.m.wikipedia.org/wiki/Trams_in_Lisbon"
        XCUIDevice.shared.press(.home)
        pause(1)
        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        safari.open(URL(string: url)!)
        XCTAssertTrue(safari.wait(for: .runningForeground, timeout: 15))
        XCTAssertTrue(safari.staticTexts.matching(NSPredicate(format: "label CONTAINS 'Trams in Lisbon'")).firstMatch.waitForExistence(timeout: 30))
        pause(3)
        try? safari.debugDescription.write(toFile: "/tmp/pn-safari-1.txt", atomically: true, encoding: .utf8)
        var share = safari.buttons["ShareButton"].firstMatch
        if !share.exists { share = safari.buttons["Share"].firstMatch }
        if !share.exists {
            // A first-run tip can sit over the page; close it.
            let tip = safari.buttons["xmark.circle.fill"].firstMatch
            if tip.exists { tip.tap(); pause(0.8) }
            let more = safari.buttons["MoreMenuButton"].firstMatch
            if more.exists { more.tap(); pause(1.2) }
            try? safari.debugDescription.write(toFile: "/tmp/pn-safari-2.txt", atomically: true, encoding: .utf8)
            share = safari.buttons.matching(NSPredicate(format: "label == 'Share' OR identifier == 'ShareButton'")).firstMatch
        }
        XCTAssertTrue(share.waitForExistence(timeout: 5), "Safari's share button")
        share.tap()
        pause(1.5)
        try? safari.debugDescription.write(toFile: "/tmp/pn-safari-3.txt", atomically: true, encoding: .utf8)
        let pinto = safari.descendants(matching: .any).matching(NSPredicate(format: "label == 'Pinto Notes'")).firstMatch
        if !pinto.waitForExistence(timeout: 5) {
            // Further along the row of apps.
            let row = safari.collectionViews.firstMatch
            for _ in 0..<3 where !pinto.exists { row.swipeLeft(); pause(0.8) }
        }
        XCTAssertTrue(pinto.waitForExistence(timeout: 5), "Pinto Notes in the share sheet")
        pause(1)
        pinto.tap()
        let save = safari.buttons["share.save"].firstMatch
        XCTAssertTrue(save.waitForExistence(timeout: 15))
        pause(2.5)
        let addTo = safari.buttons["share.addTo"].firstMatch
        if addTo.waitForExistence(timeout: 3) {
            addTo.tap()
            pause(1.5)
            let lisbon = safari.buttons["share.note.Lisbon"].firstMatch
            if !lisbon.exists {
                let find = safari.searchFields.firstMatch
                if find.waitForExistence(timeout: 3) { find.tap(); pause(0.5); find.typeText("Lisbon"); pause(1.5) }
            }
            XCTAssertTrue(lisbon.waitForExistence(timeout: 5), "the Lisbon note in Add to")
            lisbon.tap()
        }
        pause(3)
        save.tap()
        pause(3)
        // Back in Pinto: Lisbon has the page at the end. Search finds it there.
        app.activate()
        pause(2)
        let field = app.searchFields.firstMatch
        if !field.exists, app.buttons["Search"].firstMatch.exists { app.buttons["Search"].firstMatch.tap() }
        if field.waitForExistence(timeout: 5) {
            field.tap(); pause(0.5)
            field.typeText("Trams in Lisbon")
            pause(2)
            let hit = app.cells.containing(NSPredicate(format: "label CONTAINS 'Lisbon'")).firstMatch
            let row = hit.exists ? hit : app.staticTexts["Lisbon"].firstMatch
            if row.waitForExistence(timeout: 5) { row.tap() }
        }
        pause(4)
    }

    /// Connect an AI, just after ChatGPT is connected: what it can do now, on the phone.
    func test4Connected() {
        let app = launch(["-captureScreen", "connected-chatgpt"])
        pause(4)
        app.swipeUp()
        pause(3)
    }

    private func dump(_ app: XCUIApplication, _ name: String) {
        try? app.debugDescription.write(toFile: "/tmp/pn-widget-\(name).txt", atomically: true, encoding: .utf8)
    }

    /// The Checklist widget on the Home Screen: a tap on a circle opens Pinto at the note with the
    /// item ticked.
    func test5WidgetTick() {
        let app = launch(["-open", "Groceries"])
        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 15))
        pause(2)
        XCUIDevice.shared.press(.home)
        let sb = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        pause(1.5)
        let hasWidget = sb.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS 'Groceries'")).firstMatch
        if !hasWidget.exists {
            sb.swipeLeft(); pause(0.5)
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
            dump(sb, "3-gallery")
            let search = sb.searchFields.firstMatch
            if search.waitForExistence(timeout: 3) { search.tap(); search.typeText("Pinto"); pause(1.5) }
            dump(sb, "4-search")
            let pinto = sb.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS 'Pinto'")).element(boundBy: search.exists ? 1 : 0)
            if pinto.waitForExistence(timeout: 3) { pinto.tap(); pause(2) }
            dump(sb, "5-pinto")
            let addW = sb.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Add Widget'")).firstMatch
            if addW.waitForExistence(timeout: 3) { addW.tap(); pause(2) }
            dump(sb, "6-added")
            let done = sb.buttons["Done"].firstMatch
            if done.waitForExistence(timeout: 3) { done.tap() } else { XCUIDevice.shared.press(.home) }
            pause(2.5)
        }
        dump(sb, "7-home")
        let circle = sb.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'widget.item.'")).firstMatch
        XCTAssertTrue(circle.waitForExistence(timeout: 5), "the widget's first item")
        pause(1.5)
        circle.tap()
        pause(4)
        dump(app, "8-app")
    }
}
#endif
