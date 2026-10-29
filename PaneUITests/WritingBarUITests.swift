#if os(iOS)
import XCTest

/// The writing tools come up with the keyboard, and only then: an open note has no bar at its foot
/// while you read (Emil, 29 October 2026). Above the keyboard they are the size the system toolbar
/// drew them at the foot, 22 pt glyphs in 44 pt targets ("the bottom buttons on my phone get
/// smaller when I click on the note"; they were 17 pt). Measured on the simulator: each button's
/// frame, and its glyph's ink in the picture. A screenshot per state goes to $PANE_SHOTS with
/// $SHOT_PREFIX (light-, dark-). The 8 pt gap above the keyboard is KeyboardBarUITests'.
final class WritingBarUITests: XCTestCase {
    static let tools = ["editor.format", "Checklist", "Table", "editor.attach", "editor.done"]
    /// The glyphs' ink as the system toolbar drew them at the foot of a note (measured 29 October
    /// 2026, iPhone 17 Pro, iOS 26.4): checklist, table, paperclip. Above the keyboard at 17 pt
    /// the first two were 19 x 17 and 19.7 x 15.7.
    static let systemInk: [String: CGSize] = [
        "Checklist": CGSize(width: 24.3, height: 21.7),
        "Table": CGSize(width: 25.3, height: 19.7),
        "editor.attach": CGSize(width: 20.7, height: 23),
    ]

    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-open", "Groceries"]
        app.launch()
    }

    func shot(_ name: String) {
        let env = ProcessInfo.processInfo.environment
        let dir = env["PANE_SHOTS"] ?? "/tmp/pane-shots"
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(env["SHOT_PREFIX"] ?? "")\(name).png"))
    }

    @MainActor
    func testNoBarWhileReadingAndFullSizeToolsWhileWriting() throws {
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        Thread.sleep(forTimeInterval: 1)
        shot("1-reading")
        XCTAssertEqual(app.keyboards.count, 0)
        for id in Self.tools { XCTAssertFalse(app.buttons[id].exists, "no \(id) while reading") }

        editor.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.15)).tap()
        XCTAssertTrue(app.buttons["editor.done"].waitForExistence(timeout: 5), "the bar above the keyboard")
        Thread.sleep(forTimeInterval: 1)
        shot("2-writing")
        let image = app.screenshot().image
        // Every measurement is reported, not only the first that's off.
        continueAfterFailure = true
        var xs: [CGFloat] = []
        for id in Self.tools {
            let button = app.buttons[id].firstMatch
            XCTAssertTrue(button.exists, "\(id) in the bar")
            let frame = button.frame
            let ink = try XCTUnwrap(Self.ink(in: frame, of: image), "\(id)'s glyph")
            print("WRITING-BAR \(id) frame \(frame) ink \(ink)")
            XCTAssertEqual(frame.width, 44, accuracy: 1, "\(id) is a 44 pt target")
            XCTAssertEqual(frame.height, 44, accuracy: 1, "\(id) is a 44 pt target")
            if let want = Self.systemInk[id] {
                XCTAssertEqual(ink.width, want.width, accuracy: 1, "\(id)'s glyph is as wide as the toolbar's")
                XCTAssertEqual(ink.height, want.height, accuracy: 1, "\(id)'s glyph is as tall as the toolbar's")
            }
            xs.append(frame.minX)
        }
        XCTAssertEqual(xs, xs.sorted(), "Format, Checklist, Table, Attach, then Hide keyboard")

        // The paperclip asks what to put in, as the bar at the foot's menu did.
        app.buttons["editor.attach"].tap()
        XCTAssertTrue(app.buttons["attach.photo"].waitForExistence(timeout: 3), "photo or video")
        XCTAssertTrue(app.buttons["attach.file"].exists, "a file")
        XCTAssertTrue(app.buttons["attach.noteLink"].exists, "a link to a note")
        shot("3-attach")
    }

    /// The glyph's ink inside a button: pixels well away from the colour most of the frame has.
    static func ink(in frame: CGRect, of image: UIImage) -> CGSize? {
        guard let cg = image.cgImage else { return nil }
        let scale = CGFloat(cg.width) / image.size.width
        let w = cg.width, h = cg.height
        var data = [UInt8](repeating: 0, count: w * h * 4)
        guard let ctx = CGContext(data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                  space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
        let x0 = max(0, Int(frame.minX * scale)), x1 = min(w, Int(frame.maxX * scale))
        let y0 = max(0, Int(frame.minY * scale)), y1 = min(h, Int(frame.maxY * scale))
        guard x1 > x0, y1 > y0 else { return nil }
        func lum(_ x: Int, _ y: Int) -> Int {
            let i = (y * w + x) * 4
            return (Int(data[i]) * 3 + Int(data[i + 1]) * 6 + Int(data[i + 2])) / 10
        }
        // The background: the most common brightness in the frame.
        var counts = [Int](repeating: 0, count: 256)
        for y in y0..<y1 { for x in x0..<x1 { counts[lum(x, y)] += 1 } }
        let bg = counts.indices.max { counts[$0] < counts[$1] }!
        var minX = x1, maxX = x0 - 1, minY = y1, maxY = y0 - 1
        for y in y0..<y1 {
            for x in x0..<x1 where abs(lum(x, y) - bg) > 90 {
                minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
            }
        }
        guard maxX >= minX else { return nil }
        return CGSize(width: CGFloat(maxX - minX + 1) / scale, height: CGFloat(maxY - minY + 1) / scale)
    }
}
#endif
